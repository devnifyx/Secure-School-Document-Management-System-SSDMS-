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
    user: { id: number; name: string } | null;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

const ACTION_TYPES = [
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'ACCOUNT_LOCKED',
    'DOCUMENT_UPLOADED', 'DOCUMENT_VIEWED', 'DOCUMENT_DOWNLOADED',
    'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'DOCUMENT_UPDATED', 'DOCUMENT_DELETED',
    'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
    'AUDIT_LOG_EXPORTED',
];

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [actionFilter, setActionFilter] = useState('');
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = { page };
            if (actionFilter) params.action = actionFilter;
            const res = await api.get('/audit-logs', { params });
            setLogs(res.data.data);
            setMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
                per_page: res.data.per_page,
            });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [page, actionFilter]);

    useEffect(() => { load(); }, [load]);

    const handleActionChange = (val: string) => {
        setActionFilter(val);
        setPage(1);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params: any = {};
            if (actionFilter) params.action = actionFilter;
            const token = localStorage.getItem('token');
            const query = new URLSearchParams(params).toString();
            const url = `/api/audit-logs/export${query ? '?' + query : ''}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
        } catch {
            alert('Export failed');
        } finally {
            setExporting(false);
        }
    };

    const actionBg: Record<string, string> = {
        LOGIN: '#27ae60', LOGOUT: '#95a5a6', LOGIN_FAILED: '#e74c3c',
        ACCOUNT_LOCKED: '#c0392b', DOCUMENT_UPLOADED: '#3498db',
        DOCUMENT_APPROVED: '#27ae60', DOCUMENT_REJECTED: '#e74c3c',
        DOCUMENT_DOWNLOADED: '#2980b9', DOCUMENT_VIEWED: '#7f8c8d',
        USER_CREATED: '#9b59b6', USER_UPDATED: '#8e44ad', USER_DELETED: '#c0392b',
    };

    const getActionColor = (action: string) =>
        actionBg[action] ?? '#2c3e50';

    return (
        <Layout title="Audit Logs">
            {/* Filters + export */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                alignItems: 'center',
            }}>
                <select
                    value={actionFilter}
                    onChange={(e) => handleActionChange(e.target.value)}
                    style={{
                        padding: '0.6rem 0.85rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        minWidth: '220px',
                    }}
                >
                    <option value="">All action types</option>
                    {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    style={{
                        background: '#27ae60',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1.1rem',
                        borderRadius: '6px',
                        cursor: exporting ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        opacity: exporting ? 0.7 : 1,
                        marginLeft: 'auto',
                    }}
                >
                    {exporting ? 'Exporting…' : '↓ Export CSV'}
                </button>
            </div>

            <div style={{
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                overflow: 'hidden',
            }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>Loading…</div>
                ) : error ? (
                    <div style={{ padding: '2rem', color: '#e74c3c', textAlign: 'center' }}>{error}</div>
                ) : (
                    <>
                        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '0.8rem' }}>
                            {meta?.total ?? 0} total entries
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa' }}>
                                        {['#', 'Timestamp', 'User', 'Action', 'Entity', 'Details', 'IP'].map((h) => (
                                            <th key={h} style={{
                                                padding: '0.75rem 1rem',
                                                textAlign: 'left',
                                                color: '#666',
                                                fontWeight: 600,
                                                borderBottom: '1px solid #eee',
                                                whiteSpace: 'nowrap',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>
                                                No logs found
                                            </td>
                                        </tr>
                                    ) : logs.map((log) => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                            <td style={{ padding: '0.75rem 1rem', color: '#999', fontSize: '0.8rem' }}>{log.id}</td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#999', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#333', whiteSpace: 'nowrap' }}>
                                                {log.user?.name ?? <em style={{ color: '#aaa' }}>System</em>}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    background: getActionColor(log.action) + '20',
                                                    color: getActionColor(log.action),
                                                    padding: '0.2rem 0.55rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontFamily: 'monospace',
                                                    fontWeight: 600,
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#666', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                {log.entity_type ? `${log.entity_type} #${log.entity_id}` : '—'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#555', maxWidth: '280px', fontSize: '0.8rem' }}>
                                                {log.details ?? '—'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#999', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                {log.ip_address ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {meta && meta.last_page > 1 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '1rem',
                                borderTop: '1px solid #f0f0f0',
                            }}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(1)}
                                    style={pageBtnStyle(page === 1)}
                                >«</button>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    style={pageBtnStyle(page === 1)}
                                >‹</button>
                                <span style={{ padding: '0 0.75rem', color: '#555', fontSize: '0.875rem' }}>
                                    Page {meta.current_page} of {meta.last_page}
                                </span>
                                <button
                                    disabled={page === meta.last_page}
                                    onClick={() => setPage((p) => p + 1)}
                                    style={pageBtnStyle(page === meta.last_page)}
                                >›</button>
                                <button
                                    disabled={page === meta.last_page}
                                    onClick={() => setPage(meta.last_page)}
                                    style={pageBtnStyle(page === meta.last_page)}
                                >»</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

const pageBtnStyle = (disabled: boolean): React.CSSProperties => ({
    background: disabled ? '#f0f0f0' : 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '0.35rem 0.7rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#bbb' : '#333',
    fontSize: '0.875rem',
});

export default AuditLogs;
