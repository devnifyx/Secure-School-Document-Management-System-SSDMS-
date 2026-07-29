import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getISOWeek, getWeekRange, isSubmissionWindowOpen } from '../utils/week';

const WeeklyReportSubmit: React.FC = () => {
    const { activePanitia } = useAuth();
    const now = new Date();
    const defaultRange = getWeekRange(now);

    const [title, setTitle] = useState(`Week ${getISOWeek(now)} Activity Report`);
    const [weekNumber, setWeekNumber] = useState(getISOWeek(now));
    const [periodStart, setPeriodStart] = useState(defaultRange.start);
    const [periodEnd, setPeriodEnd] = useState(defaultRange.end);
    const [summary, setSummary] = useState('');
    const [challenges, setChallenges] = useState('');
    const [actionsTaken, setActionsTaken] = useState('');
    const [nextWeekPlan, setNextWeekPlan] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);

    const [lateEnabled, setLateEnabled] = useState(false);
    const windowOpen = isSubmissionWindowOpen(now);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/settings/late-submission')
            .then((res) => setLateEnabled(res.data.late_submission_enabled))
            .catch(() => {});
    }, []);

    const canSubmit = windowOpen || lateEnabled;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true); setError('');
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('week_number', String(weekNumber));
            formData.append('period_start', periodStart);
            formData.append('period_end', periodEnd);
            formData.append('activity_summary', summary);
            formData.append('challenges', challenges);
            formData.append('actions_taken', actionsTaken);
            formData.append('next_week_plan', nextWeekPlan);
            if (files) {
                Array.from(files).forEach((f) => formData.append('attachments[]', f));
            }
            await api.post('/weekly-reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccess(true);
            setTimeout(() => navigate('/weekly-reports'), 1400);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors;
            setError(typeof msg === 'string' ? msg : 'Submission failed. Please check the form and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Submit Weekly Activity Report" subtitle="Summarize your work and activities for the week">
            <div style={{ maxWidth: '760px' }}>
                <div className="panel">
                    <div className="panel-body">
                        {success && (
                            <div className="notice notice-success" style={{ marginBottom: '1.25rem' }}>
                                <span>✓</span>
                                <div>Weekly report submitted successfully. Redirecting…</div>
                            </div>
                        )}
                        {!canSubmit && !success && (
                            <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                                <span>⚠</span>
                                <div>Submission period is closed. Weekly reports can only be submitted on Saturday and Sunday, unless an administrator enables late submission.</div>
                            </div>
                        )}
                        {canSubmit && !windowOpen && !success && (
                            <div className="notice notice-warning" style={{ marginBottom: '1.25rem' }}>
                                <span>⚠</span>
                                <div>You're submitting outside the normal Saturday–Sunday window. This will be recorded as a <strong>late submission</strong>.</div>
                            </div>
                        )}
                        {error && (
                            <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                                <span>⚠</span><div>{error}</div>
                            </div>
                        )}

                        <fieldset disabled={!canSubmit || success} style={{ border: 'none', padding: 0, margin: 0 }}>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Report Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input className="form-control" type="text" value={title} required onChange={(e) => setTitle(e.target.value)} />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Week Number <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input className="form-control" type="number" min={1} max={53} value={weekNumber} required
                                            onChange={(e) => setWeekNumber(Number(e.target.value))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Panitia</label>
                                        <input className="form-control" value={activePanitia?.name || ''} disabled />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Period Start <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input className="form-control" type="date" value={periodStart} required onChange={(e) => setPeriodStart(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Period End <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input className="form-control" type="date" value={periodEnd} required onChange={(e) => setPeriodEnd(e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Activity Summary <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <textarea className="form-control" rows={4} value={summary} required
                                        onChange={(e) => setSummary(e.target.value)}
                                        placeholder="Teaching activities, meetings attended, school programmes, administrative tasks, student activities, training/workshops, etc." />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Challenges or Issues Faced <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <textarea className="form-control" rows={3} value={challenges} required onChange={(e) => setChallenges(e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Actions Taken <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <textarea className="form-control" rows={3} value={actionsTaken} required onChange={(e) => setActionsTaken(e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Next Week Planning <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <textarea className="form-control" rows={3} value={nextWeekPlan} required onChange={(e) => setNextWeekPlan(e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Supporting Documents <span className="form-hint">(optional — PDF, DOCX, XLSX, PPTX, JPG, PNG, max 10 MB each)</span>
                                    </label>
                                    <input className="form-control" type="file" multiple
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                                        onChange={(e) => setFiles(e.target.files)} />
                                </div>

                                <div className="notice notice-info" style={{ margin: '1.25rem 0' }}>
                                    <span>🔒</span>
                                    <div>Supporting documents are automatically encrypted using AES-256 before being stored.</div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="submit" className="btn btn-primary" disabled={loading || success || !canSubmit}>
                                        {loading ? 'Submitting…' : 'Submit Report'}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/weekly-reports')}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </fieldset>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default WeeklyReportSubmit;
