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
        entity_id: number | null;
        details: string | null;
        ip_address: string | null;
        created_at: string;
        user: { id: number; name: string } | null;
    }>;
}

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
    LOGIN_SUCCESS:        { bg: '#ecfdf5', color: '#059669' },
    LOGOUT:              { bg: '#f3f4f6', color: '#6b7280' },
    LOGIN_FAILED:        { bg: '#fef2f2', color: '#dc2626' },
    ACCOUNT_LOCKED:      { bg: '#fef2f2', color: '#dc2626' },
    DOCUMENT_UPLOADED:   { bg: '#eff6ff', color: '#3b82f6' },
    DOCUMENT_APPROVED:   { bg: '#ecfdf5', color: '#059669' },
    DOCUMENT_REJECTED:   { bg: '#fef2f2', color: '#dc2626' },
    DOCUMENT_DOWNLOADED: { bg: '#eff6ff', color: '#2563eb' },
    USER_CREATED:        { bg: '#f5f3ff', color: '#7c3aed' },
    USER_UPDATED:        { bg: '#fdf4ff', color: '#9333ea' },
    USER_DELETED:        { bg: '#fef2f2', color: '#dc2626' },
};

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/dashboard/stats')
            .then((res) => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const docCards = stats ? [
        { label: 'Pending Approvals', value: stats.documents.pending, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '⏳', path: '/documents?status=Pending' },
        { label: 'Approved',          value: stats.documents.approved, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: '✅', path: '/documents?status=Approved' },
        { label: 'Rejected',          value: stats.documents.rejected, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '❌', path: '/documents?status=Rejected' },
        { label: 'Total Documents',   value: stats.documents.total,    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: '📄', path: '/documents' },
        { label: 'Active Users',      value: stats.users.active,       color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: '👥', path: '/users' },
        { label: 'Total Users',       value: stats.users.total,        color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: '🧑‍💼', path: '/users' },
    ] : [];

    return (
        <Layout title={`Admin Dashboard`}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>Loading…
                </div>
            ) : stats ? (
                <>
                    <div style={{ marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
                        Welcome back, <strong>{user?.name}</strong>
                    </div>

                    {/* Stat cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                        gap: '1rem', marginBottom: '2rem',
                    }}>
                        {docCards.map((card) => (
                            <div key={card.label} onClick={() => navigate(card.path)}
                                style={{
                                    background: card.bg, border: `1px solid ${card.border}`,
                                    borderRadius: '12px', padding: '1.25rem',
                                    cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{card.icon}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginTop: '0.3rem' }}>{card.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Recent audit logs */}
                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6',
                        }}>
                            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '0.95rem', fontWeight: 700 }}>
                                📋 Recent Activity
                            </h3>
                            <button onClick={() => navigate('/audit-logs')} style={{
                                background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                            }}>View all →</button>
                        </div>

                        {stats.recent_audit_logs.length === 0 ? (
                            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>No activity yet</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f9fafb' }}>
                                            {['Time', 'User', 'Action', 'Details'].map((h) => (
                                                <th key={h} style={{
                                                    padding: '0.65rem 1rem', textAlign: 'left',
                                                    color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #f3f4f6',
                                                    whiteSpace: 'nowrap',
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recent_audit_logs.map((log) => {
                                            const ac = ACTION_COLORS[log.action] ?? { bg: '#f3f4f6', color: '#374151' };
                                            return (
                                                <tr key={log.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                                    <td style={{ padding: '0.7rem 1rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '0.7rem 1rem', color: '#374151', fontWeight: 500 }}>
                                                        {log.user?.name ?? <em style={{ color: '#aaa' }}>System</em>}
                                                    </td>
                                                    <td style={{ padding: '0.7rem 1rem' }}>
                                                        <span style={{
                                                            background: ac.bg, color: ac.color,
                                                            padding: '0.2rem 0.55rem', borderRadius: '4px',
                                                            fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700,
                                                        }}>{log.action}</span>
                                                    </td>
                                                    <td style={{ padding: '0.7rem 1rem', color: '#6b7280', maxWidth: '300px' }}>
                                                        {log.details ?? '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ color: '#ef4444' }}>Failed to load dashboard data.</div>
            )}
        </Layout>
    );
};

export default AdminDashboard;
