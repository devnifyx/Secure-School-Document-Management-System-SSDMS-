import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { SkeletonCard, SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    UploadCloud,
    Calendar,
    ArrowRight,
    HelpCircle,
} from 'lucide-react';

interface Stats {
    documents: { total: number; pending: number; approved: number; rejected: number };
    weekly_reports: {
        total: number; pending: number; approved: number; rejected: number;
        current_week: number; current_week_submitted: boolean; submission_window_open: boolean;
    };
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
    const { user, activePanitia } = useAuth();
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
            title="Teacher Dashboard"
            subtitle={`Welcome, ${user?.name || 'Educator'}${activePanitia ? ` · Active Department: ${activePanitia.name}` : ''}`}
            actions={
                <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                    <UploadCloud size={16} /> Upload Document
                </button>
            }
            withWallpaper={true}
        >
            <div className="teacher-brand-banner" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xs)',
            }}>
                        <img
                            src="/smkkp-logo.png"
                            alt="SMK Kubor Panjang Crest"
                            style={{
                                width: '46px',
                                height: '46px',
                                objectFit: 'contain',
                                flexShrink: 0,
                                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.12))',
                            }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
                                SMK KUBOR PANJANG
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                Academic Educator Workspace · {user?.name || 'Teacher'} {activePanitia ? `(${activePanitia.name})` : ''}
                            </div>
                        </div>
                    </div>

                    {loading || !stats ? (
                        <>
                            <SkeletonCard count={4} />
                            <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <SkeletonTable rows={4} columns={4} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="summary-grid">
                                <div
                                    className="teacher-status-card status-submitted"
                                    onClick={() => navigate('/documents')}
                                    title="View all submitted documents"
                                >
                                    <div className="status-card-header">
                                        <span className="status-title">SUBMITTED</span>
                                        <div className="status-icon">
                                            <FileText size={17} color="#FFFFFF" />
                                        </div>
                                    </div>
                                    <div className="status-value">{stats.documents.total}</div>
                                    <div className="status-subtext">All submitted documents</div>
                                </div>

                                <div
                                    className="teacher-status-card status-pending"
                                    onClick={() => navigate('/documents?status=Pending')}
                                    title="View pending review documents"
                                >
                                    <div className="status-card-header">
                                        <span className="status-title">PENDING</span>
                                        <div className="status-icon">
                                            <Clock size={17} color="#FFFFFF" />
                                        </div>
                                    </div>
                                    <div className="status-value">{stats.documents.pending}</div>
                                    <div className="status-subtext">Awaiting administrative approval</div>
                                </div>

                                <div
                                    className="teacher-status-card status-approved"
                                    onClick={() => navigate('/documents?status=Approved')}
                                    title="View approved documents"
                                >
                                    <div className="status-card-header">
                                        <span className="status-title">APPROVED</span>
                                        <div className="status-icon">
                                            <CheckCircle2 size={17} color="#FFFFFF" />
                                        </div>
                                    </div>
                                    <div className="status-value">{stats.documents.approved}</div>
                                    <div className="status-subtext">Ready & verified in repository</div>
                                </div>

                                <div
                                    className="teacher-status-card status-rejected"
                                    onClick={() => navigate('/documents?status=Rejected')}
                                    title="View rejected documents"
                                >
                                    <div className="status-card-header">
                                        <span className="status-title">REJECTED</span>
                                        <div className="status-icon">
                                            <XCircle size={17} color="#FFFFFF" />
                                        </div>
                                    </div>
                                    <div className="status-value">{stats.documents.rejected}</div>
                                    <div className="status-subtext">
                                        {stats.documents.rejected > 0 ? 'Requires revision & resubmission' : 'Zero rejections'}
                                    </div>
                                </div>
                            </div>

                            <div className="panel" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                                <div className="panel-header">
                                    <h3>
                                        <Calendar size={18} style={{ color: 'var(--primary)' }} />
                                        Weekly Activity Report — Week {stats.weekly_reports.current_week}
                                    </h3>
                                    <button className="btn-link" onClick={() => navigate('/weekly-reports')}>
                                        View Report History <ArrowRight size={14} />
                                    </button>
                                </div>
                                <div className="panel-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>
                                                    Current Submission Status:
                                                </span>
                                                {stats.weekly_reports.current_week_submitted ? (
                                                    <span className="badge badge-success">
                                                        <CheckCircle2 size={12} /> Submitted
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-warning">
                                                        <Clock size={12} /> Not Submitted
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                {stats.weekly_reports.submission_window_open ? (
                                                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                                        ● On-Time Window is OPEN (Saturday – Sunday)
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--warning)', fontWeight: 500 }}>
                                                        ● Normal submission window is closed — submissions will be recorded as Late
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {!stats.weekly_reports.current_week_submitted && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => navigate('/weekly-reports/submit')}
                                            >
                                                Submit Week {stats.weekly_reports.current_week} Report
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="panel" style={{ marginBottom: '1.5rem' }}>
                                <div className="panel-header">
                                    <h3><FileText size={18} /> My Recent Documents</h3>
                                    <button className="btn-link" onClick={() => navigate('/documents')}>
                                        View All Repository <ArrowRight size={14} />
                                    </button>
                                </div>
                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Document Title</th>
                                                <th>Category</th>
                                                <th>Review Status</th>
                                                <th>Submitted On</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recent.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4}>
                                                        <EmptyState
                                                            icon={<FileText size={36} className="text-slate-400" />}
                                                            title="No documents uploaded yet"
                                                            description="Upload your lesson plans, assessments, or teaching materials for admin review."
                                                            actionText="Upload First Document"
                                                            onAction={() => navigate('/upload')}
                                                        />
                                                    </td>
                                                </tr>
                                            ) : recent.map((d) => (
                                                <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/documents')}>
                                                    <td style={{ fontWeight: 600 }}>{d.title}</td>
                                                    <td><span className="badge badge-neutral">{d.category}</span></td>
                                                    <td><span className={`badge ${statusBadge(d.status)}`}>{d.status}</span></td>
                                                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                        {new Date(d.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="notice notice-info">
                                <HelpCircle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                                <div>
                                    <strong>Document Approval Lifecycle:</strong> Once you upload a document, administrators are immediately notified to review it. You will receive an instant notification when it is approved or rejected. If rejected, you can review the administrator's feedback and resubmit a corrected file directly from your Document Repository.
                                </div>
                            </div>
                        </>
                    )}
        </Layout>
    );
};

export default TeacherDashboard;
