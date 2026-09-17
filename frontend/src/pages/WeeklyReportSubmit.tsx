import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/Layout';
import FileDropzone from '../components/FileDropzone';
import { getISOWeek, getWeekRange, isSubmissionWindowOpen } from '../utils/week';
import {
    Calendar,
    Send,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    FileText,
} from 'lucide-react';

const WeeklyReportSubmit: React.FC = () => {
    const { activePanitia } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();

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
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const windowOpen = isSubmissionWindowOpen(now);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('week_number', String(weekNumber));
            formData.append('period_start', periodStart);
            formData.append('period_end', periodEnd);
            formData.append('activity_summary', summary.trim());
            formData.append('challenges', challenges.trim());
            formData.append('actions_taken', actionsTaken.trim());
            formData.append('next_week_plan', nextWeekPlan.trim());

            attachedFiles.forEach((f) => {
                formData.append('attachments[]', f);
            });

            await api.post('/weekly-reports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            success('Weekly report submitted successfully.');
            navigate('/weekly-reports');
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors;
            const errText = typeof msg === 'string' ? msg : 'Submission failed. Please check form fields.';
            setError(errText);
            toastError(errText);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout
            title="Submit Weekly Activity Report"
            subtitle="Record and summarize your curriculum progress, classroom activities, and forward planning"
        >
            <div style={{ maxWidth: '820px' }}>
                {/* Window Notice */}
                {!windowOpen ? (
                    <div className="notice notice-warning" style={{ marginBottom: '1.5rem' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                        <div>
                            <strong>Notice: Late Submission:</strong> The standard Saturday–Sunday window is closed. This report will be logged as a <strong>Late Submission</strong>.
                        </div>
                    </div>
                ) : (
                    <div className="notice notice-success" style={{ marginBottom: '1.5rem' }}>
                        <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                        <div>
                            <strong>On-Time Window Active:</strong> Submitting during the regular weekend cycle (Saturday – Sunday).
                        </div>
                    </div>
                )}

                {error && (
                    <div className="notice notice-danger" style={{ marginBottom: '1.5rem' }}>
                        <div>{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Section 1: Overview */}
                    <div className="panel">
                        <div className="panel-header">
                            <h3><Calendar size={17} style={{ color: 'var(--primary)' }} /> Period & Report Details</h3>
                        </div>
                        <div className="panel-body">
                            <div className="form-group">
                                <label className="form-label">
                                    Report Title <span style={{ color: 'var(--danger)' }}>*</span>
                                </label>
                                <input
                                    className="form-control"
                                    type="text"
                                    value={title}
                                    required
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Week 3 Activity Report — Mathematics"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Week Number <span style={{ color: 'var(--danger)' }}>*</span>
                                    </label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        min={1}
                                        max={53}
                                        value={weekNumber}
                                        required
                                        onChange={(e) => setWeekNumber(Number(e.target.value))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Active Department (Panitia)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="form-control"
                                            value={activePanitia?.name || 'Department'}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Period Start Date <span style={{ color: 'var(--danger)' }}>*</span>
                                    </label>
                                    <input
                                        className="form-control"
                                        type="date"
                                        value={periodStart}
                                        required
                                        onChange={(e) => setPeriodStart(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Period End Date <span style={{ color: 'var(--danger)' }}>*</span>
                                    </label>
                                    <input
                                        className="form-control"
                                        type="date"
                                        value={periodEnd}
                                        required
                                        onChange={(e) => setPeriodEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Summary & Progress */}
                    <div className="panel">
                        <div className="panel-header">
                            <h3><FileText size={17} style={{ color: 'var(--primary)' }} /> Weekly Activities & Reflection</h3>
                        </div>
                        <div className="panel-body">
                            <div className="form-group">
                                <label className="form-label">
                                    Weekly Summary of Completed Activities <span style={{ color: 'var(--danger)' }}>*</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    value={summary}
                                    required
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="Summarize key topics taught, learning milestones achieved, student assessments conducted…"
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Challenges & Obstacles Encountered <span className="form-hint">(optional)</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    value={challenges}
                                    onChange={(e) => setChallenges(e.target.value)}
                                    placeholder="Describe any curriculum delays, student difficulties, or resource limitations…"
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Corrective Actions Taken / Solutions Implemented <span className="form-hint">(optional)</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    value={actionsTaken}
                                    onChange={(e) => setActionsTaken(e.target.value)}
                                    placeholder="Remedial sessions conducted, adjusted lesson plans, student consultations…"
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Action Plan for Upcoming Week <span className="form-hint">(optional)</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    value={nextWeekPlan}
                                    onChange={(e) => setNextWeekPlan(e.target.value)}
                                    placeholder="Key objectives, planned exams, upcoming departmental meetings…"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Evidence & Attachments */}
                    <div className="panel">
                        <div className="panel-header">
                            <h3><FileText size={17} style={{ color: 'var(--primary)' }} /> Supporting Evidence & Attachments</h3>
                        </div>
                        <div className="panel-body">
                            <FileDropzone
                                label="Upload Lesson Evidence, Attendance, or Photos (Optional)"
                                hint="PDF, Word, or images (Up to 10 MB each)"
                                multiple={true}
                                files={attachedFiles}
                                onFilesSelect={setAttachedFiles}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ padding: '0.75rem 1.6rem' }}
                        >
                            <Send size={16} />
                            {loading ? 'Submitting Report…' : 'Submit Weekly Report'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/weekly-reports')}
                        >
                            <ArrowLeft size={16} /> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default WeeklyReportSubmit;
