import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

interface AuditLog {
    id: number;
    action: string;
    entity_type: string | null;
    entity_id: number | null;
    details: string | null;
    ip_address: string | null;
    created_at: string;
    user: { id: number; name: string; role: string } | null;
}

interface Meta { current_page: number; last_page: number; total: number; per_page: number; }

const ACTION_TYPES = [
    'LOGIN_SUCCESS', 'LOGOUT', 'LOGIN_FAILED', 'LOGIN_FAILED_LOCKED', 'LOGIN_FAILED_INACTIVE',
    'DOCUMENT_UPLOADED', 'DOCUMENT_VIEWED', 'DOCUMENT_DOWNLOADED',
    'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'DOCUMENT_UPDATED', 'DOCUMENT_DELETED',
    'DOCUMENT_VERIFY_PASSED', 'DOCUMENT_VERIFY_FAILED',
    'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
    'PROFILE_UPDATED', 'PROFILE_PASSWORD_CHANGED',
    'AUDIT_LOG_EXPORTED',
];

const actionBadgeClass = (action: string): string => {
    if (action.includes('FAILED') || action.includes('REJECTED') || action.includes('DELETED') || action.includes('LOCKED')) return 'badge-danger';
    if (action.includes('APPROVED') || action.includes('SUCCESS') || action.includes('PASSED')) return 'badge-success';
    if (action.includes('UPLOADED') || action.includes('CREATED') || action.includes('UPDATED')) return 'badge-info';
    return 'badge-neutral';
};

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [actionFilter, setActionFilter] = useState('');
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params: any = { page };
            if (actionFilter) params.action = actionFilter;
            const res = await api.get('/audit-logs', { params });
            setLogs(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total, per_page: res.data.per_page });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load audit logs');
        } finally { setLoading(false); }
    }, [page, actionFilter]);

    useEffect(() => { load(); }, [load]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const params: any = {};
            if (actionFilter) params.action = actionFilter;
            const token = localStorage.getItem('token');
            const query = new URLSearchParams(params).toString();
            const url = `/api/audit-logs/export${query ? '?' + query : ''}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
        } catch { alert('Export failed'); }
        finally { setExporting(false); }
    };

    return (
        <Layout title="Audit Logs" subtitle="Immutable record of all significant system actions">
            <div className="filter-bar">
                <select className="form-control" style={{ maxWidth: '260px' }} value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
                    <option value="">All action types</option>
                    {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={handleExport} disabled={exporting}>
                    {exporting ? 'Exporting…' : '↓ Export CSV'}
                </button>
            </div>

            <div className="panel">
                {loading ? (
                    <div className="empty-state"><div className="icon">⏳</div>Loading audit logs…</div>
                ) : error ? (
                    <div className="notice notice-danger" style={{ margin: '1.25rem' }}>{error}</div>
                ) : (
                    <>
                        <div style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {meta?.total ?? 0} total entries
                        </div>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Action</th>
                                        <th>Document / Entity</th>
                                        <th>IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr><td colSpan={6} className="table-empty">No logs found for the selected filter</td></tr>
                                    ) : logs.map((log) => (
                                        <tr key={log.id}>
                                            <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td>{log.user?.name ?? <em style={{ color: 'var(--text-muted)' }}>System</em>}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{log.user?.role ?? '—'}</td>
                                            <td><span className={`badge ${actionBadgeClass(log.action)}`}>{log.action}</span></td>
                                            <td style={{ color: 'var(--text-secondary)', maxWidth: '280px' }}>
                                                {log.entity_type ? `${log.entity_type} #${log.entity_id}` : '—'}
                                                {log.details && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{log.details}</div>}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{log.ip_address ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {meta && meta.last_page > 1 && (
                            <div className="pagination">
                                <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                                <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                                <span className="page-info">Page {meta.current_page} of {meta.last_page}</span>
                                <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>›</button>
                                <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage(meta.last_page)}>»</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default AuditLogs;
