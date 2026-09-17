import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import WeeklyReportDetailsModal, { WeeklyReportItem } from '../components/WeeklyReportDetailsModal';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { getISOWeek } from '../utils/week';
import {
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    UserX,
    RotateCcw,
    Eye,
    ChevronLeft,
    ChevronRight,
    User,
    Layers,
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

interface Meta { current_page: number; last_page: number; total: number; }
interface TeacherOption { id: number; name: string; role: string; }
interface PanitiaOption { id: number; name: string; }
interface NotSubmittedUser { id: number; name: string; email: string; }

const statusBadge = (status: string) => {
    if (status === 'Approved') return <span className="badge badge-success"><CheckCircle2 size={11} /> Approved</span>;
    if (status === 'Rejected') return <span className="badge badge-danger"><XCircle size={11} /> Rejected</span>;
    return <span className="badge badge-warning"><Clock size={11} /> Pending Review</span>;
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
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, weekFilter, teacherFilter, panitiaFilter, statusFilter, lateOnly]);

    useEffect(() => {
        if (tab === 'all') load();
    }, [tab, load]);

    useEffect(() => {
        api.get('/users').then((res) => setTeachers(res.data.filter((u: TeacherOption) => u.role === 'Teacher'))).catch(() => {});
        api.get('/panitia').then((res) => setPanitiaOptions(res.data)).catch(() => {});
    }, []);

    const loadNotSubmitted = useCallback(async () => {
        if (!notSubmittedWeek) return;
        setNotSubmittedLoading(true);
        try {
            const res = await api.get('/weekly-reports-not-submitted', { params: { week_number: notSubmittedWeek } });
            setNotSubmitted(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setNotSubmittedLoading(false);
        }
    }, [notSubmittedWeek]);

    useEffect(() => {
        if (tab === 'not-submitted') loadNotSubmitted();
    }, [tab, loadNotSubmitted]);

    const resetFilters = () => {
        setWeekFilter('');
        setTeacherFilter('');
        setPanitiaFilter('');
        setStatusFilter('');
        setLateOnly(false);
        setPage(1);
    };

    const teacherOptions = [
        { value: '', label: 'All Teachers' },
        ...teachers.map((t) => ({ value: String(t.id), label: t.name, icon: <User size={14} /> })),
    ];

    const panitiaFilterOptions = [
        { value: '', label: 'All Departments' },
        ...panitiaOptions.map((p) => ({ value: String(p.id), label: p.name, icon: <Layers size={14} /> })),
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'Pending Review', label: 'Pending Review', icon: <Clock size={14} /> },
        { value: 'Approved', label: 'Approved', icon: <CheckCircle2 size={14} /> },
        { value: 'Rejected', label: 'Rejected', icon: <XCircle size={14} /> },
    ];

    return (
        <Layout
            title="Weekly Report Tracker"
            subtitle="Monitor and verify weekly activity reports submitted by teaching staff"
        >
            {/* Tab navigation */}
            <div className="tab-group">
                <button
                    className={`tab-btn ${tab === 'all' ? 'active' : ''}`}
                    onClick={() => setTab('all')}
                >
                    <Calendar size={15} /> All Submissions
                </button>
                <button
                    className={`tab-btn ${tab === 'not-submitted' ? 'active' : ''}`}
                    onClick={() => setTab('not-submitted')}
                >
                    <UserX size={15} /> Missing Reports
                </button>
            </div>

            {tab === 'all' ? (
                <>
                    {/* Filters */}
                    <div className="filter-bar">
                        <input
                            className="form-control"
                            style={{ maxWidth: '110px' }}
                            type="number"
                            placeholder="Week #"
                            value={weekFilter}
                            onChange={(e) => { setWeekFilter(e.target.value); setPage(1); }}
                        />

                        <CustomSelect
                            options={teacherOptions}
                            value={teacherFilter}
                            onChange={(val) => { setTeacherFilter(val); setPage(1); }}
                            placeholder="All Teachers"
                            searchable={teachers.length > 5}
                            clearable={true}
                            style={{ minWidth: '180px', maxWidth: '230px' }}
                        />

                        <CustomSelect
                            options={panitiaFilterOptions}
                            value={panitiaFilter}
                            onChange={(val) => { setPanitiaFilter(val); setPage(1); }}
                            placeholder="All Departments"
                            searchable={panitiaOptions.length > 5}
                            clearable={true}
                            style={{ minWidth: '180px', maxWidth: '230px' }}
                        />

                        <CustomSelect
                            options={statusOptions}
                            value={statusFilter}
                            onChange={(val) => { setStatusFilter(val); setPage(1); }}
                            placeholder="All Statuses"
                            clearable={true}
                            style={{ minWidth: '165px', maxWidth: '190px' }}
                        />

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={lateOnly}
                                onChange={(e) => { setLateOnly(e.target.checked); setPage(1); }}
                            />
                            <span>Late Only</span>
                        </label>

                        {(weekFilter || teacherFilter || panitiaFilter || statusFilter || lateOnly) && (
                            <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                                <RotateCcw size={13} /> Reset
                            </button>
                        )}

                        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <strong>{meta?.total ?? 0}</strong> reports
                        </span>
                    </div>

                    <div className="panel">
                        {loading ? (
                            <div style={{ padding: '1.5rem' }}>
                                <SkeletonTable rows={5} columns={6} />
                            </div>
                        ) : reports.length === 0 ? (
                            <EmptyState
                                icon={<Calendar size={42} className="text-slate-400" />}
                                title="No reports match criteria"
                                description="Try removing some filters to see more submissions."
                                secondaryActionText="Reset Filters"
                                onSecondaryAction={resetFilters}
                            />
                        ) : (
                            <>
                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Teacher</th>
                                                <th>Department</th>
                                                <th>Week</th>
                                                <th>Date Submitted</th>
                                                <th>Timing</th>
                                                <th>Approval Status</th>
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
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <User size={14} style={{ color: 'var(--primary)' }} />
                                                            <span>{r.submitted_by.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                                                            <Layers size={13} style={{ color: 'var(--text-muted)' }} />
                                                            <span>{r.panitia?.name || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                                                            Week {r.week_number}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                        {new Date(r.created_at).toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${r.is_late ? 'badge-warning' : 'badge-success'}`}>
                                                            {r.is_late ? <Clock size={11} /> : <CheckCircle2 size={11} />}
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
                </>
            ) : (
                /* Not Submitted Tracker */
                <>
                    <div className="filter-bar">
                        <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)' }}>
                            Check Week Number:
                        </label>
                        <input
                            className="form-control"
                            style={{ maxWidth: '120px' }}
                            type="number"
                            value={notSubmittedWeek}
                            onChange={(e) => setNotSubmittedWeek(e.target.value)}
                        />
                    </div>

                    <div className="panel">
                        {notSubmittedLoading ? (
                            <div style={{ padding: '1.5rem' }}>
                                <SkeletonTable rows={4} columns={2} />
                            </div>
                        ) : notSubmitted.length === 0 ? (
                            <EmptyState
                                icon={<CheckCircle2 size={42} style={{ color: 'var(--success)' }} />}
                                title="100% Submission Compliance!"
                                description={`All registered teachers have submitted their activity report for Week ${notSubmittedWeek}.`}
                            />
                        ) : (
                            <>
                                <div className="panel-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <UserX size={18} style={{ color: 'var(--danger)' }} />
                                        <strong>Teachers with Missing Reports — Week {notSubmittedWeek}</strong>
                                        <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                                            {notSubmitted.length} missing
                                        </span>
                                    </div>
                                </div>
                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Teacher Name</th>
                                                <th>Email Address</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {notSubmitted.map((u) => (
                                                <tr key={u.id}>
                                                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                                    <td>
                                                        <span className="badge badge-danger">
                                                            <XCircle size={11} /> Not Submitted
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Modal */}
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

export default WeeklyReportTracker;
