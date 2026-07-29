import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import WeeklyReportDetailsModal, { WeeklyReportItem } from '../components/WeeklyReportDetailsModal';
import { getISOWeek } from '../utils/week';

interface Meta { current_page: number; last_page: number; total: number; }
interface TeacherOption { id: number; name: string; role: string; }
interface PanitiaOption { id: number; name: string; }
interface NotSubmittedUser { id: number; name: string; email: string; }

const statusBadge = (status: string) => {
    if (status === 'Approved') return 'badge-success';
    if (status === 'Rejected') return 'badge-danger';
    return 'badge-warning';
};

const WeeklyReportTracker: React.FC = () => {
    const [tab, setTab] = useState<'all' | 'not-submitted'>('all');

    const [reports, setReports] = useState<WeeklyReportItem[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [panitiaOptions, setPanitiaOptions] = useState<PanitiaOption[]>([]);
    const [weekFilter, setWeekFilter] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('');
    const [panitiaFilter, setPanitiaFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [lateOnly, setLateOnly] = useState(false);

    const [notSubmittedWeek, setNotSubmittedWeek] = useState(String(getISOWeek(new Date())));
    const [notSubmitted, setNotSubmitted] = useState<NotSubmittedUser[]>([]);
    const [notSubmittedLoading, setNotSubmittedLoading] = useState(false);

    const [lateEnabled, setLateEnabled] = useState(false);
    const [toggling, setToggling] = useState(false);

    const [selected, setSelected] = useState<WeeklyReportItem | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page };
            if (weekFilter) params.week_number = weekFilter;
            if (teacherFilter) params.submitted_by = teacherFilter;
            if (panitiaFilter) params.panitia_id = panitiaFilter;
            if (statusFilter) params.status = statusFilter;
            if (lateOnly) params.late_only = 1;
            const res = await api.get('/weekly-reports', { params });
            setReports(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, weekFilter, teacherFilter, panitiaFilter, statusFilter, lateOnly]);

    useEffect(() => { if (tab === 'all') load(); }, [tab, load]);

    useEffect(() => {
        api.get('/users').then((res) => setTeachers(res.data.filter((u: TeacherOption) => u.role === 'Teacher'))).catch(() => {});
        api.get('/panitia').then((res) => setPanitiaOptions(res.data)).catch(() => {});
        api.get('/settings/late-submission').then((res) => setLateEnabled(res.data.late_submission_enabled)).catch(() => {});
    }, []);

    const loadNotSubmitted = useCallback(async () => {
        if (!notSubmittedWeek) return;
        setNotSubmittedLoading(true);
        try {
            const res = await api.get('/weekly-reports-not-submitted', { params: { week_number: notSubmittedWeek } });
            setNotSubmitted(res.data);
        } catch (e) { console.error(e); }
        finally { setNotSubmittedLoading(false); }
    }, [notSubmittedWeek]);

    useEffect(() => { if (tab === 'not-submitted') loadNotSubmitted(); }, [tab, loadNotSubmitted]);

    const handleToggleLate = async () => {
        setToggling(true);
        try {
            const res = await api.put('/settings/late-submission', { enabled: !lateEnabled });
            setLateEnabled(res.data.late_submission_enabled);
        } catch (e: any) { alert(e.response?.data?.message || 'Failed to update setting'); }
        finally { setToggling(false); }
    };

    return (
        <Layout
            title="Weekly Report Tracker"
            subtitle="Monitor weekly activity report submissions across all teachers"
            actions={
                <button className={`btn btn-sm ${lateEnabled ? 'btn-danger' : 'btn-secondary'}`} disabled={toggling} onClick={handleToggleLate}>
                    {toggling ? 'Updating…' : lateEnabled ? 'Late Submission: ON' : 'Late Submission: OFF'}
                </button>
            }
        >
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('all')}>All Reports</button>
                <button className={`btn btn-sm ${tab === 'not-submitted' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('not-submitted')}>Not Submitted</button>
            </div>

            {tab === 'all' ? (
                <>
                    <div className="filter-bar">
                        <input className="form-control" style={{ maxWidth: '120px' }} type="number" placeholder="Week #"
                            value={weekFilter} onChange={(e) => { setWeekFilter(e.target.value); setPage(1); }} />
                        <select className="form-control" style={{ maxWidth: '200px' }} value={teacherFilter} onChange={(e) => { setTeacherFilter(e.target.value); setPage(1); }}>
                            <option value="">All teachers</option>
                            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <select className="form-control" style={{ maxWidth: '200px' }} value={panitiaFilter} onChange={(e) => { setPanitiaFilter(e.target.value); setPage(1); }}>
                            <option value="">All Panitia</option>
                            {panitiaOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select className="form-control" style={{ maxWidth: '180px' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="">All statuses</option>
                            <option value="Pending Review">Pending Review</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <input type="checkbox" checked={lateOnly} onChange={(e) => { setLateOnly(e.target.checked); setPage(1); }} />
                            Late only
                        </label>
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {meta?.total ?? 0} report{meta?.total !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="panel">
                        {loading ? (
                            <div className="empty-state"><div className="icon">⏳</div>Loading reports…</div>
                        ) : reports.length === 0 ? (
                            <div className="empty-state"><div className="icon">🗎</div>No weekly reports match these filters.</div>
                        ) : (
                            <>
                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Teacher</th>
                                                <th>Panitia</th>
                                                <th>Week</th>
                                                <th>Submission Date</th>
                                                <th>Report Status</th>
                                                <th>Approval Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reports.map((r) => (
                                                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(r)}>
                                                    <td style={{ fontWeight: 600 }}>{r.submitted_by.name}</td>
                                                    <td>{r.panitia?.name || '—'}</td>
                                                    <td>Week {r.week_number}</td>
                                                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleString()}</td>
                                                    <td>
                                                        <span className={`badge ${r.is_late ? 'badge-neutral' : 'badge-success'}`}>{r.is_late ? 'Late' : 'On Time'}</span>
                                                    </td>
                                                    <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
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
                </>
            ) : (
                <>
                    <div className="filter-bar">
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Week Number</label>
                        <input className="form-control" style={{ maxWidth: '120px' }} type="number" value={notSubmittedWeek}
                            onChange={(e) => setNotSubmittedWeek(e.target.value)} />
                    </div>
                    <div className="panel">
                        {notSubmittedLoading ? (
                            <div className="empty-state"><div className="icon">⏳</div>Checking submissions…</div>
                        ) : notSubmitted.length === 0 ? (
                            <div className="empty-state"><div className="icon">✓</div>All teachers have submitted their report for this week.</div>
                        ) : (
                            <div className="table-wrap">
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Teacher Name</th><th>Email</th></tr>
                                    </thead>
                                    <tbody>
                                        {notSubmitted.map((u) => (
                                            <tr key={u.id}>
                                                <td style={{ fontWeight: 600 }}>{u.name}</td>
                                                <td>{u.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {selected && (
                <WeeklyReportDetailsModal report={selected} onClose={() => setSelected(null)} onChanged={load} />
            )}
        </Layout>
    );
};

export default WeeklyReportTracker;
