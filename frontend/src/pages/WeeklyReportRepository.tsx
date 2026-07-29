import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WeeklyReportDetailsModal, { WeeklyReportItem } from '../components/WeeklyReportDetailsModal';
import { isSubmissionWindowOpen } from '../utils/week';

interface Meta { current_page: number; last_page: number; total: number; }

const statusBadge = (status: string) => {
    if (status === 'Approved') return 'badge-success';
    if (status === 'Rejected') return 'badge-danger';
    return 'badge-warning';
};

const WeeklyReportRepository: React.FC = () => {
    const [reports, setReports] = useState<WeeklyReportItem[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selected, setSelected] = useState<WeeklyReportItem | null>(null);
    const [lateEnabled, setLateEnabled] = useState(false);

    const navigate = useNavigate();
    const windowOpen = isSubmissionWindowOpen();

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params: any = { page };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/weekly-reports', { params });
            setReports(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load weekly reports');
        } finally { setLoading(false); }
    }, [page, statusFilter]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        api.get('/settings/late-submission').then((res) => setLateEnabled(res.data.late_submission_enabled)).catch(() => {});
    }, []);

    const canSubmit = windowOpen || lateEnabled;

    return (
        <Layout
            title="Weekly Activity Reports"
            subtitle="Your weekly report history and status"
            actions={
                <button className="btn btn-primary" disabled={!canSubmit} onClick={() => navigate('/weekly-reports/submit')}
                    title={canSubmit ? undefined : 'Submission period is closed'}>
                    + Submit Weekly Report
                </button>
            }
        >
            {!canSubmit && (
                <div className="notice notice-info" style={{ marginBottom: '1.25rem' }}>
                    <span>ℹ</span>
                    <div>Submissions open every Saturday and close Sunday at 11:59 PM. The window is currently closed.</div>
                </div>
            )}

            <div className="filter-bar">
                <select className="form-control" style={{ maxWidth: '200px' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All statuses</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {meta?.total ?? 0} report{meta?.total !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="panel">
                {loading ? (
                    <div className="empty-state"><div className="icon">⏳</div>Loading reports…</div>
                ) : error ? (
                    <div className="notice notice-danger" style={{ margin: '1.25rem' }}>{error}</div>
                ) : reports.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">🗎</div>
                        No weekly reports found.
                        {canSubmit && <div style={{ marginTop: '0.75rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/weekly-reports/submit')}>Submit your first report</button>
                        </div>}
                    </div>
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Week</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((r) => (
                                        <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(r)}>
                                            <td style={{ fontWeight: 600 }}>{r.title}</td>
                                            <td>Week {r.week_number}</td>
                                            <td>
                                                <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
                                                {r.is_late && <span className="badge badge-neutral" style={{ marginLeft: '0.35rem' }}>Late</span>}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <button className="row-action" onClick={() => setSelected(r)}>View</button>
                                            </td>
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

            {selected && (
                <WeeklyReportDetailsModal report={selected} onClose={() => setSelected(null)} onChanged={load} />
            )}
        </Layout>
    );
};

export default WeeklyReportRepository;
