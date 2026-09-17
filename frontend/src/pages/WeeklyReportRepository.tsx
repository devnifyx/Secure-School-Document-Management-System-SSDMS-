import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WeeklyReportDetailsModal, { WeeklyReportItem } from '../components/WeeklyReportDetailsModal';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { isSubmissionWindowOpen } from '../utils/week';
import {
    Calendar,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';

interface Meta { current_page: number; last_page: number; total: number; }

const statusBadge = (status: string) => {
    if (status === 'Approved') return <span className="badge badge-success"><CheckCircle2 size={11} /> Approved</span>;
    if (status === 'Rejected') return <span className="badge badge-danger"><XCircle size={11} /> Rejected</span>;
    return <span className="badge badge-warning"><Clock size={11} /> Pending Review</span>;
};

const WeeklyReportRepository: React.FC = () => {
    const [reports, setReports] = useState<WeeklyReportItem[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selected, setSelected] = useState<WeeklyReportItem | null>(null);

    const navigate = useNavigate();
    const windowOpen = isSubmissionWindowOpen();

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = { page };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/weekly-reports', { params });
            setReports(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load weekly reports');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <Layout
            title="Weekly Activity Reports"
            subtitle="View your past weekly submissions, reviewer feedback, and progress status"
            actions={
                <button className="btn btn-primary" onClick={() => navigate('/weekly-reports/submit')}>
                    <Plus size={16} /> Submit Weekly Report
                </button>
            }
        >
            {/* Submission Window Banner */}
            {!windowOpen ? (
                <div className="notice notice-warning" style={{ marginBottom: '1.5rem' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <div>
                        <strong>Normal Submission Window Closed:</strong> On-time submissions are accepted on <strong>Saturdays & Sundays</strong>. You can still submit now, but it will be flagged as a <strong>Late Submission</strong> for administrative review.
                    </div>
                </div>
            ) : (
                <div className="notice notice-success" style={{ marginBottom: '1.5rem' }}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <div>
                        <strong>On-Time Window Active:</strong> You are within the normal weekend reporting window. Submissions made now will be recorded as <strong>On Time</strong>.
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="filter-bar">
                <select
                    className="form-control"
                    style={{ maxWidth: '200px' }}
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Review Statuses</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>

                <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <strong>{meta?.total ?? 0}</strong> {meta?.total === 1 ? 'report' : 'reports'}
                </span>
            </div>

            <div className="panel">
                {loading ? (
                    <div style={{ padding: '1.5rem' }}>
                        <SkeletonTable rows={5} columns={5} />
                    </div>
                ) : error ? (
                    <div className="notice notice-danger">{error}</div>
                ) : reports.length === 0 ? (
                    <EmptyState
                        icon={<Calendar size={42} className="text-slate-400" />}
                        title="No weekly reports found"
                        description="You haven't submitted any weekly activity reports yet."
                        actionText="Submit First Report"
                        onAction={() => navigate('/weekly-reports/submit')}
                    />
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Report Title</th>
                                        <th>Week Number</th>
                                        <th>Submission Date</th>
                                        <th>Timing</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((r) => (
                                        <tr
                                            key={r.id}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setSelected(r)}
                                        >
                                            <td style={{ fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <Calendar size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                    <span>{r.title}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                                                    Week {r.week_number}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <span className={`badge ${r.is_late ? 'badge-warning' : 'badge-success'}`}>
                                                    {r.is_late ? 'Late' : 'On Time'}
                                                </span>
                                            </td>
                                            <td>{statusBadge(r.status)}</td>
                                            <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setSelected(r)}
                                                >
                                                    <Eye size={13} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

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

            {/* Details Modal */}
            {selected && (
                <WeeklyReportDetailsModal
                    report={selected}
                    onClose={() => setSelected(null)}
                    onChanged={load}
                />
            )}
        </Layout>
    );
};

export default WeeklyReportRepository;
