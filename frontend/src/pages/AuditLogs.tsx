import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import {
    History,
    Download,
    RotateCcw,
    Shield,
    Clock,
    User,
    Globe,
    ChevronLeft,
    ChevronRight,
    FileText,
    Filter,
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

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

const getActionSublabel = (action: string): string => {
    switch (action) {
        case 'LOGIN_SUCCESS': return 'User session started';
        case 'LOGOUT': return 'User logged out';
        case 'LOGIN_FAILED': return 'Invalid credentials attempt';
        case 'LOGIN_FAILED_LOCKED': return 'Account locked by threshold';
        case 'LOGIN_FAILED_INACTIVE': return 'Inactive or suspended user';
        case 'DOCUMENT_UPLOADED': return 'New document submitted';
        case 'DOCUMENT_VIEWED': return 'Document preview viewed';
        case 'DOCUMENT_DOWNLOADED': return 'Document file downloaded';
        case 'DOCUMENT_APPROVED': return 'Document approved';
        case 'DOCUMENT_REJECTED': return 'Document rejected';
        case 'DOCUMENT_UPDATED': return 'Document metadata or file edited';
        case 'DOCUMENT_DELETED': return 'Document moved to trash/deleted';
        case 'DOCUMENT_VERIFY_PASSED': return 'SHA-256 hash verified';
        case 'DOCUMENT_VERIFY_FAILED': return 'Integrity check mismatch';
        case 'USER_CREATED': return 'New user registered';
        case 'USER_UPDATED': return 'User profile updated';
        case 'USER_DELETED': return 'User removed';
        case 'PROFILE_UPDATED': return 'Account profile updated';
        case 'PROFILE_PASSWORD_CHANGED': return 'Password changed';
        case 'AUDIT_LOG_EXPORTED': return 'Audit log CSV exported';
        default: return '';
    }
};

const getActionIcon = (action: string) => {
    if (action.startsWith('LOGIN') || action === 'LOGOUT') return <Shield size={14} />;
    if (action.startsWith('DOCUMENT')) return <FileText size={14} />;
    if (action.startsWith('USER') || action.startsWith('PROFILE')) return <User size={14} />;
    if (action.startsWith('AUDIT')) return <History size={14} />;
    return <Filter size={14} />;
};

const actionBadgeClass = (action: string): string => {
    if (action.includes('FAILED') || action.includes('REJECTED') || action.includes('DELETED') || action.includes('LOCKED')) {
        return 'badge-danger';
    }
    if (action.includes('APPROVED') || action.includes('SUCCESS') || action.includes('PASSED')) {
        return 'badge-success';
    }
    if (action.includes('UPLOADED') || action.includes('CREATED') || action.includes('UPDATED')) {
        return 'badge-info';
    }
    return 'badge-neutral';
};

const AuditLogs: React.FC = () => {
    const { success, error: toastError } = useToast();

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
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total, per_page: res.data.per_page });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [page, actionFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const params: any = {};
            if (actionFilter) params.action = actionFilter;
            const token = localStorage.getItem('token');
            const query = new URLSearchParams(params).toString();
            const url = `/api/audit-logs/export${query ? '?' + query : ''}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            link.remove();
            success('Audit log CSV exported successfully.');
        } catch {
            toastError('Failed to export audit logs.');
        } finally {
            setExporting(false);
        }
    };

    const actionOptions = [
        { value: '', label: 'All Action Types', icon: <Filter size={14} /> },
        ...ACTION_TYPES.map((a) => ({
            value: a,
            label: a,
            sublabel: getActionSublabel(a),
            icon: getActionIcon(a),
        })),
    ];

    return (
        <Layout
            title="Audit Logs"
            subtitle="Immutable system ledger tracking all document actions, logins, and security events"
            actions={
                <button
                    className="btn btn-secondary"
                    onClick={handleExport}
                    disabled={exporting || loading}
                >
                    <Download size={15} />
                    {exporting ? 'Exporting…' : 'Export CSV'}
                </button>
            }
        >
            {/* Filter toolbar */}
            <div className="filter-bar">
                <CustomSelect
                    options={actionOptions}
                    value={actionFilter}
                    onChange={(val) => {
                        setActionFilter(val);
                        setPage(1);
                    }}
                    placeholder="All Action Types"
                    searchable={true}
                    clearable={true}
                    style={{ minWidth: '280px', maxWidth: '360px' }}
                />

                {actionFilter && (
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setActionFilter(''); setPage(1); }}
                    >
                        <RotateCcw size={13} /> Reset
                    </button>
                )}

                <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <strong>{meta?.total ?? 0}</strong> log entries recorded
                </span>
            </div>

            <div className="panel">
                {loading ? (
                    <div style={{ padding: '1.5rem' }}>
                        <SkeletonTable rows={6} columns={5} />
                    </div>
                ) : error ? (
                    <div className="notice notice-danger">{error}</div>
                ) : logs.length === 0 ? (
                    <EmptyState
                        icon={<History size={42} className="text-slate-400" />}
                        title="No audit logs found"
                        description="No logs match the selected action filter."
                        secondaryActionText={actionFilter ? 'Clear Filter' : undefined}
                        onSecondaryAction={() => { setActionFilter(''); setPage(1); }}
                    />
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Action Type</th>
                                        <th>Event Details</th>
                                        <th>IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id}>
                                            <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Clock size={13} />
                                                    <span>{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                {log.user ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <User size={13} style={{ color: 'var(--text-muted)' }} />
                                                        <span>{log.user.name}</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                                                        <Shield size={13} />
                                                        <em>System</em>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${actionBadgeClass(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.4 }}>
                                                {log.details ?? '—'}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <Globe size={12} />
                                                    <span>{log.ip_address || '—'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {meta && meta.last_page > 1 && (
                            <div className="pagination">
                                <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                                <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /></button>
                                <span className="page-info">Page <strong>{meta.current_page}</strong> of <strong>{meta.last_page}</strong></span>
                                <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}><ChevronRight size={14} /></button>
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
