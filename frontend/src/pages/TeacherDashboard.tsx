import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
    documents: { total: number; pending: number; approved: number; rejected: number };
}

interface RecentDoc {
    id: number;
    title: string;
    category: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    created_at: string;
}

const statusBadge = (status: string) => {
    if (status === 'Approved') return 'badge-success';
    if (status === 'Rejected') return 'badge-danger';
    return 'badge-warning';
};

const TeacherDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recent, setRecent] = useState<RecentDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            api.get('/dashboard/stats'),
            api.get('/documents', { params: { page: 1 } }),
        ]).then(([statsRes, docsRes]) => {
            setStats(statsRes.data);
            setRecent(docsRes.data.data.slice(0, 8));
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    return (
        <Layout
            title="Dashboard"
            subtitle={`Welcome back, ${user?.name}`}
            actions={<button className="btn btn-primary" onClick={() => navigate('/upload')}>+ Upload Document</button>}
        >
            {loading || !stats ? (
                <div className="empty-state"><div className="icon">⏳</div>Loading dashboard…</div>
            ) : (
                <>
                    <div className="summary-grid">
                        <div className="summary-card" onClick={() => navigate('/documents')}>
                            <div className="label">Total Submitted 🗎</div>
                            <div className="value">{stats.documents.total}</div>
                        </div>
                        <div className="summary-card" onClick={() => navigate('/documents?status=Pending')}>
                            <div className="label">Pending Review ◔</div>
                            <div className="value" style={{ color: 'var(--warning)' }}>{stats.documents.pending}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Awaiting admin review</div>
                        </div>
                        <div className="summary-card" onClick={() => navigate('/documents?status=Approved')}>
                            <div className="label">Approved ✓</div>
                            <div className="value" style={{ color: 'var(--success)' }}>{stats.documents.approved}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Ready to download</div>
                        </div>
                        <div className="summary-card" onClick={() => navigate('/documents?status=Rejected')}>
                            <div className="label">Rejected ⊘</div>
                            <div className="value" style={{ color: 'var(--danger)' }}>{stats.documents.rejected}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                {stats.documents.rejected > 0 ? 'Action needed' : 'None rejected'}
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-header">
                            <h3>My Recent Documents</h3>
                            <button className="btn-link" onClick={() => navigate('/documents')}>View all →</button>
                        </div>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Document Name</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.length === 0 ? (
                                        <tr><td colSpan={4} className="table-empty">
                                            You haven't uploaded any documents yet.{' '}
                                            <button className="btn-link" onClick={() => navigate('/upload')}>Upload your first document</button>
                                        </td></tr>
                                    ) : recent.map((d) => (
                                        <tr key={d.id}>
                                            <td style={{ fontWeight: 600 }}>{d.title}</td>
                                            <td>{d.category}</td>
                                            <td><span className={`badge ${statusBadge(d.status)}`}>{d.status}</span></td>
                                            <td>{new Date(d.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="notice notice-info" style={{ marginTop: '1.25rem' }}>
                        <span>ℹ</span>
                        <div>
                            <strong>How the approval process works:</strong> after you upload a document, it enters the review
                            queue and an administrator is notified. You will receive a notification once it is approved or
                            rejected. If rejected, you may view the reason and resubmit a corrected version.
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default TeacherDashboard;
