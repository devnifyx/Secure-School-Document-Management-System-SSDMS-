import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { SkeletonCard, SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    UserPlus,
    Users,
    Calendar,
    Layers,
    ShieldCheck,
    ArrowRight,
    Activity,
    Lock,
} from 'lucide-react';

interface Stats {
    documents: { total: number; pending: number; approved: number; rejected: number };
    users: { total: number; active: number };
    pending_registrations: number;
    panitia: { total: number; active: number };
    weekly_reports: {
        total: number; pending: number; approved: number; rejected: number; late: number;
        current_week: number; not_submitted_this_week: number;
    };
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
    if (action.includes('FAILED') || action.includes('REJECTED') || action.includes('DELETED') || action.includes('LOCKED')) {
        return { cls: 'badge-danger' };
    }
    if (action.includes('APPROVED') || action.includes('SUCCESS') || action.includes('PASSED')) {
        return { cls: 'badge-success' };
    }
    if (action.includes('UPLOADED') || action.includes('CREATED') || action.includes('UPDATED')) {
        return { cls: 'badge-info' };
    }
    return { cls: 'badge-neutral' };
};

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [pending, setPending] = useState<PendingDoc[]>([]);
    const [loading, setLoading] = useState(true);
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
        <Layout
            title="Dashboard Overview"
            subtitle="Real-time system health, document queue, and departmental metrics"
        >
            {loading || !stats ? (
                <>
                    <SkeletonCard count={4} />
                    <div className="dashboard-grid">
                        <div className="panel" style={{ padding: '1.5rem' }}>
                            <SkeletonTable rows={4} columns={4} />
                        </div>
                        <div className="panel" style={{ padding: '1.5rem' }}>
                            <SkeletonTable rows={4} columns={2} />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Summary KPI cards */}
                    <div className="summary-grid">
                        <div className="summary-card" onClick={() => navigate('/documents')}>
                            <div className="summary-card-header">
                                <span className="label">Total Documents</span>
                                <div className="summary-card-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                                    <FileText size={18} />
                                </div>
                            </div>
                            <div className="value">{stats.documents.total}</div>
                            <div className="subtext">All academic files recorded</div>
                        </div>

                        <div className="summary-card" onClick={() => navigate('/approvals')}>
                            <div className="summary-card-header">
                                <span className="label">Pending Review</span>
                                <div className="summary-card-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                                    <Clock size={18} />
                                </div>
                            </div>
                            <div className="value" style={{ color: stats.documents.pending > 0 ? 'var(--warning)' : 'inherit' }}>
                                {stats.documents.pending}
                            </div>
                            <div className="subtext">
                                {stats.documents.pending > 0 ? 'Requires attention in queue' : 'Queue is clear'}
                            </div>
                        </div>

                        <div className="summary-card" onClick={() => navigate('/documents?status=Approved')}>
                            <div className="summary-card-header">
                                <span className="label">Approved</span>
                                <div className="summary-card-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                                    <CheckCircle2 size={18} />
                                </div>
                            </div>
                            <div className="value" style={{ color: 'var(--success)' }}>{stats.documents.approved}</div>
                            <div className="subtext">Verified & accessible</div>
                        </div>

                        <div className="summary-card" onClick={() => navigate('/documents?status=Rejected')}>
                            <div className="summary-card-header">
                                <span className="label">Rejected</span>
                                <div className="summary-card-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                                    <XCircle size={18} />
                                </div>
                            </div>
                            <div className="value" style={{ color: 'var(--danger)' }}>{stats.documents.rejected}</div>
                            <div className="subtext">
                                {stats.documents.rejected > 0 ? 'Action required by teachers' : 'Zero rejected'}
                            </div>
                        </div>

                        {stats.pending_registrations > 0 && (
                            <div className="summary-card" onClick={() => navigate('/users')} style={{ borderColor: 'var(--warning)' }}>
                                <div className="summary-card-header">
                                    <span className="label">Pending Users</span>
                                    <div className="summary-card-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                                        <UserPlus size={18} />
                                    </div>
                                </div>
                                <div className="value" style={{ color: 'var(--warning)' }}>{stats.pending_registrations}</div>
                                <div className="subtext">New registrations awaiting review</div>
                            </div>
                        )}
                    </div>

                    <div className="dashboard-grid">
                        {/* Left Column: Queues & Logs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Pending Review Table */}
                            <div className="panel">
                                <div className="panel-header">
                                    <h3>
                                        <Clock size={17} style={{ color: 'var(--warning)' }} />
                                        Pending Approval Queue
                                    </h3>
                                    <button className="btn-link" onClick={() => navigate('/approvals')}>
                                        View Queue <ArrowRight size={14} />
                                    </button>
                                </div>
                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Document Title</th>
                                                <th>Category</th>
                                                <th>Submitted By</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pending.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4}>
                                                        <EmptyState
                                                            icon={<CheckCircle2 size={32} className="text-success" />}
                                                            title="Approval Queue is Empty"
                                                            description="All submitted documents have been reviewed."
                                                        />
                                                    </td>
                                                </tr>
                                            ) : pending.map((d) => (
                                                <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/approvals')}>
                                                    <td style={{ fontWeight: 600 }}>{d.title}</td>
                                                    <td>
                                                        <span className="badge badge-neutral">{d.category}</span>
                                                    </td>
                                                    <td>{d.uploaded_by.name}</td>
                                                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                        {new Date(d.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Recent Activity Timeline */}
                            <div className="panel">
                                <div className="panel-header">
                                    <h3>
                                        <Activity size={17} style={{ color: 'var(--primary)' }} />
                                        Recent System Activities
                                    </h3>
                                    <button className="btn-link" onClick={() => navigate('/audit-logs')}>
                                        All Logs <ArrowRight size={14} />
                                    </button>
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
                                                <tr>
                                                    <td colSpan={4} className="table-empty">No activity recorded yet</td>
                                                </tr>
                                            ) : stats.recent_audit_logs.map((log) => (
                                                <tr key={log.id}>
                                                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </td>
                                                    <td style={{ fontWeight: 500 }}>{log.user?.name ?? <em>System</em>}</td>
                                                    <td><span className={`badge ${actionBadge(log.action).cls}`}>{log.action}</span></td>
                                                    <td style={{ color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {log.details ?? '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Summaries & System Health */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* User Overview */}
                            <div className="panel">
                                <div className="panel-header">
                                    <h3><Users size={17} /> User Overview</h3>
                                </div>
                                <div className="panel-body">
                                    <dl className="detail-grid">
                                        <dt>Total Users</dt><dd>{stats.users.total}</dd>
                                        <dt>Active Users</dt><dd style={{ color: 'var(--success)', fontWeight: 700 }}>{stats.users.active}</dd>
                                        <dt>Deactivated</dt><dd>{stats.users.total - stats.users.active}</dd>
                                    </dl>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ marginTop: '1.25rem', width: '100%' }}
                                        onClick={() => navigate('/users')}
                                    >
                                        Manage Staff & Users
                                    </button>
                                </div>
                            </div>

                            {/* Weekly Reports Overview */}
                            <div className="panel">
                                <div className="panel-header">
                                    <h3><Calendar size={17} /> Weekly Reports (Week {stats.weekly_reports.current_week})</h3>
                                </div>
                                <div className="panel-body">
                                    <dl className="detail-grid">
                                        <dt>Pending Review</dt>
                                        <dd style={{ color: stats.weekly_reports.pending > 0 ? 'var(--warning)' : 'inherit', fontWeight: 700 }}>
                                            {stats.weekly_reports.pending}
                                        </dd>
                                        <dt>Late Submissions</dt><dd>{stats.weekly_reports.late}</dd>
                                        <dt>Not Submitted</dt>
                                        <dd style={{ color: stats.weekly_reports.not_submitted_this_week > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                                            {stats.weekly_reports.not_submitted_this_week}
                                        </dd>
                                    </dl>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ marginTop: '1.25rem', width: '100%' }}
                                        onClick={() => navigate('/weekly-reports')}
                                    >
                                        Open Report Tracker
                                    </button>
                                </div>
                            </div>

                            {/* Panitia Overview */}
                            <div className="panel">
                                <div className="panel-header">
                                    <h3><Layers size={17} /> Panitia Overview</h3>
                                </div>
                                <div className="panel-body">
                                    <dl className="detail-grid">
                                        <dt>Total Panitia</dt><dd>{stats.panitia.total}</dd>
                                        <dt>Active Departments</dt><dd style={{ color: 'var(--success)', fontWeight: 700 }}>{stats.panitia.active}</dd>
                                        <dt>Inactive</dt><dd>{stats.panitia.total - stats.panitia.active}</dd>
                                    </dl>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ marginTop: '1.25rem', width: '100%' }}
                                        onClick={() => navigate('/panitia')}
                                    >
                                        Manage Panitia
                                    </button>
                                </div>
                            </div>

                            {/* System Status */}
                            <div className="panel" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, var(--surface-alt) 100%)' }}>
                                <div className="panel-header">
                                    <h3><ShieldCheck size={17} style={{ color: 'var(--success)' }} /> Security Status</h3>
                                </div>
                                <div className="panel-body">
                                    <dl className="detail-grid">
                                        <dt>Encryption</dt>
                                        <dd>
                                            <span className="badge badge-success">
                                                <Lock size={11} /> AES-256 Active
                                            </span>
                                        </dd>
                                        <dt>Session Expiry</dt><dd>8 Hours Idle Window</dd>
                                        <dt>Lockout Policy</dt><dd>3 Attempts / 15 Min</dd>
                                    </dl>
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
