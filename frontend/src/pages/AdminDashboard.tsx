import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
    documents: { total: number; pending: number; approved: number; rejected: number };
    users: { total: number; active: number };
    recent_audit_logs: Array<{
        id: number;
        action: string;
        entity_type: string | null;
        details: string | null;
        created_at: string;
        user: { id: number; name: string } | null;
    }>;
}

interface PendingDoc {
    id: number;
    title: string;
    category: string;
    created_at: string;
    uploaded_by: { name: string };
}

const actionBadge = (action: string): { cls: string } => {
    if (action.includes('FAILED') || action.includes('REJECTED') || action.includes('DELETED') || action.includes('LOCKED')) return { cls: 'badge-danger' };
    if (action.includes('APPROVED') || action.includes('SUCCESS') || action.includes('PASSED')) return { cls: 'badge-success' };
    if (action.includes('UPLOADED') || action.includes('CREATED')) return { cls: 'badge-info' };
    return { cls: 'badge-neutral' };
};

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [pending, setPending] = useState<PendingDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            api.get('/dashboard/stats'),
            api.get('/documents', { params: { status: 'Pending', page: 1 } }),
        ]).then(([statsRes, docsRes]) => {
            setStats(statsRes.data);
            setPending(docsRes.data.data.slice(0, 6));
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    return (
        <Layout title="Dashboard" subtitle={`Welcome back, ${user?.name}`}>
            {loading || !stats ? (
                <div className="empty-state"><div className="icon">⏳</div>Loading dashboard…</div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="summary-grid">
                        <div className="summary-card" onClick={() => navigate('/documents')}>
                            <div className="label">Total Documents</div>
                            <div className="value">{stats.documents.total}</div>
                        </div>
                        <div className="summary-card" style={{ borderLeftColor: 'var(--warning)' }} onClick={() => navigate('/approvals')}>
                            <div className="label">Pending Approval</div>
                            <div className="value" style={{ color: 'var(--warning)' }}>{stats.documents.pending}</div>
                        </div>
                        <div className="summary-card" style={{ borderLeftColor: 'var(--success)' }} onClick={() => navigate('/documents?status=Approved')}>
                            <div className="label">Approved Documents</div>
                            <div className="value" style={{ color: 'var(--success)' }}>{stats.documents.approved}</div>
                        </div>
                        <div className="summary-card" style={{ borderLeftColor: 'var(--danger)' }} onClick={() => navigate('/documents?status=Rejected')}>
                            <div className="label">Rejected Documents</div>
                            <div className="value" style={{ color: 'var(--danger)' }}>{stats.documents.rejected}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem', alignItems: 'start'}}>
                        {/* Left column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                            {/* Pending approval table */}
                            <div className="panel">
                                <div className="panel-header">
                                    <h3>Pending Approval Queue</h3>
                                    <button className="btn-link" onClick={() => navigate('/approvals')}>View all →</button>
                                </div>
                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Document Name</th>
                                                <th>Category</th>
                                                <th>Uploaded By</th>
                                                <th>Submitted</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pending.length === 0 ? (
                                                <tr><td colSpan={4} className="table-empty">No documents awaiting approval</td></tr>
                                            ) : pending.map((d) => (
                                                <tr key={d.id}>
                                                    <td style={{ fontWeight: 600 }}>{d.title}</td>
                                                    <td>{d.category}</td>
                                                    <td>{d.uploaded_by.name}</td>
                                                    <td>{new Date(d.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Recent activity */}
                            <div className="panel">
                                <div className="panel-header">
                                    <h3>Recent Activities</h3>
                                    <button className="btn-link" onClick={() => navigate('/audit-logs')}>View all →</button>
                                </div>
                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>User</th>
                                                <th>Action</th>
                                                <th>Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recent_audit_logs.length === 0 ? (
                                                <tr><td colSpan={4} className="table-empty">No activity yet</td></tr>
                                            ) : stats.recent_audit_logs.map((log) => (
                                                <tr key={log.id}>
                                                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td>{log.user?.name ?? <em>System</em>}</td>
                                                    <td><span className={`badge ${actionBadge(log.action).cls}`}>{log.action}</span></td>
                                                    <td style={{ color: 'var(--text-secondary)', maxWidth: '260px' }}>{log.details ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                            <div className="panel">
                                <div className="panel-header"><h3>User Overview</h3></div>
                                <div className="panel-body">
                                    <div className="detail-grid">
                                        <dt>Total Users</dt><dd>{stats.users.total}</dd>
                                        <dt>Active Users</dt><dd style={{ color: 'var(--success)', fontWeight: 700 }}>{stats.users.active}</dd>
                                        <dt>Inactive</dt><dd>{stats.users.total - stats.users.active}</dd>
                                    </div>
                                    <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem', width: '100%' }} onClick={() => navigate('/users')}>
                                        Manage Users
                                    </button>
                                </div>
                            </div>

                            <div className="panel">
                                <div className="panel-header"><h3>System Status</h3></div>
                                <div className="panel-body">
                                    <div className="detail-grid">
                                        <dt>Encryption</dt><dd><span className="badge badge-success">AES-256 Active</span></dd>
                                        <dt>Session Policy</dt><dd>8-hour expiry</dd>
                                        <dt>Lockout Policy</dt><dd>3 attempts / 15 min</dd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default AdminDashboard;
