import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from './ConfirmModal';
import FileDropzone from './FileDropzone';
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    Download,
    Eye,
    AlertTriangle,
    X,
    FileText,
    User,
    Layers,
    RefreshCw,
} from 'lucide-react';

export interface WeeklyReportAttachmentItem {
    id: number;
    file_name: string;
    file_type: string;
    file_size: number;
}

export interface WeeklyReportItem {
    id: number;
    title: string;
    week_number: number;
    period_start: string;
    period_end: string;
    activity_summary: string;
    challenges: string | null;
    actions_taken: string | null;
    next_week_plan: string | null;
    status: 'Pending Review' | 'Approved' | 'Rejected';
    is_late: boolean;
    rejection_reason: string | null;
    submitted_by: { id: number; name: string };
    panitia?: { id: number; name: string } | null;
    attachments: WeeklyReportAttachmentItem[];
    created_at: string;
    updated_at: string;
}

const statusBadge = (status: string) => {
    if (status === 'Approved') return <span className="badge badge-success"><CheckCircle2 size={12} /> Approved</span>;
    if (status === 'Rejected') return <span className="badge badge-danger"><XCircle size={12} /> Rejected</span>;
    return <span className="badge badge-warning"><Clock size={12} /> Pending Review</span>;
};

const isPreviewable = (type: string) => ['application/pdf', 'image/jpeg', 'image/png'].includes(type);

interface Props {
    report: WeeklyReportItem;
    onClose: () => void;
    onChanged: () => void;
}

const WeeklyReportDetailsModal: React.FC<Props> = ({ report, onClose, onChanged }) => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const isAdmin = user?.role === 'Admin';
    const isOwner = report.submitted_by.id === user?.id;

    const [actionLoading, setActionLoading] = useState(false);
    const [busyAttachment, setBusyAttachment] = useState<number | null>(null);

    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);

    // Edit/Resubmit mode
    const [editMode, setEditMode] = useState(false);
    const [editTitle, setEditTitle] = useState(report.title);
    const [editSummary, setEditSummary] = useState(report.activity_summary);
    const [editChallenges, setEditChallenges] = useState(report.challenges ?? '');
    const [editActions, setEditActions] = useState(report.actions_taken ?? '');
    const [editNextWeek, setEditNextWeek] = useState(report.next_week_plan ?? '');
    const [editFiles, setEditFiles] = useState<File[]>([]);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await api.post(`/weekly-reports/${report.id}/approve`);
            success('Weekly report approved.');
            setShowApproveConfirm(false);
            onChanged();
            onClose();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to approve report.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (reason?: string) => {
        if (!reason?.trim()) return;
        setActionLoading(true);
        try {
            await api.post(`/weekly-reports/${report.id}/reject`, { reason: reason.trim() });
            success('Weekly report rejected with feedback.');
            setShowRejectConfirm(false);
            onChanged();
            onClose();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to reject report.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownload = async (att: WeeklyReportAttachmentItem) => {
        setBusyAttachment(att.id);
        try {
            const res = await api.get(`/weekly-reports/${report.id}/attachments/${att.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = window.document.createElement('a');
            link.href = url;
            link.setAttribute('download', att.file_name);
            window.document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            success(`Downloaded "${att.file_name}"`);
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Download failed');
        } finally {
            setBusyAttachment(null);
        }
    };

    const handlePreview = async (att: WeeklyReportAttachmentItem) => {
        setBusyAttachment(att.id);
        try {
            const res = await api.get(`/weekly-reports/${report.id}/attachments/${att.id}/preview`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: att.file_type });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Preview failed');
        } finally {
            setBusyAttachment(null);
        }
    };

    const handleResubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditLoading(true);
        setEditError('');
        try {
            const formData = new FormData();
            formData.append('title', editTitle);
            formData.append('activity_summary', editSummary);
            formData.append('challenges', editChallenges);
            formData.append('actions_taken', editActions);
            formData.append('next_week_plan', editNextWeek);
            editFiles.forEach((f) => formData.append('attachments[]', f));
            formData.append('_method', 'PUT');

            await api.post(`/weekly-reports/${report.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            success('Report resubmitted for review.');
            onChanged();
            onClose();
        } catch (e: any) {
            setEditError(e.response?.data?.message || 'Resubmission failed.');
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-box"
                style={{ maxWidth: '740px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>
                        <Calendar size={20} style={{ color: 'var(--primary)' }} />
                        Weekly Activity Report
                    </h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    {!editMode ? (
                        <>
                            {/* Header details */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem' }}>
                                        {report.title}
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {statusBadge(report.status)}
                                        <span className={`badge ${report.is_late ? 'badge-warning' : 'badge-success'}`}>
                                            {report.is_late ? 'Late Submission' : 'On Time'}
                                        </span>
                                        <span className="badge badge-neutral">Week {report.week_number}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Rejection Notice if any */}
                            {report.rejection_reason && (
                                <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                                    <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                                    <div>
                                        <strong>Reviewer Feedback:</strong> {report.rejection_reason}
                                    </div>
                                </div>
                            )}

                            {/* Metadata Grid */}
                            <dl className="detail-grid" style={{ marginBottom: '1.5rem' }}>
                                <dt>Teacher</dt>
                                <dd>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <User size={13} /> {report.submitted_by.name}
                                    </div>
                                </dd>

                                <dt>Department</dt>
                                <dd>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Layers size={13} /> {report.panitia?.name || '—'}
                                    </div>
                                </dd>

                                <dt>Period Coverage</dt>
                                <dd>{report.period_start} to {report.period_end}</dd>

                                <dt>Submitted</dt>
                                <dd>{new Date(report.created_at).toLocaleString()}</dd>
                            </dl>

                            {/* Structured Content Sections */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div className="panel" style={{ background: 'var(--surface-alt)' }}>
                                    <div className="panel-body" style={{ padding: '1rem 1.25rem' }}>
                                        <strong style={{ fontSize: '0.86rem', display: 'block', marginBottom: '0.4rem', color: 'var(--text)' }}>
                                            Activity Summary
                                        </strong>
                                        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                            {report.activity_summary}
                                        </div>
                                    </div>
                                </div>

                                {report.challenges && (
                                    <div className="panel" style={{ background: 'var(--surface-alt)' }}>
                                        <div className="panel-body" style={{ padding: '1rem 1.25rem' }}>
                                            <strong style={{ fontSize: '0.86rem', display: 'block', marginBottom: '0.4rem', color: 'var(--text)' }}>
                                                Challenges Encountered
                                            </strong>
                                            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {report.challenges}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {report.actions_taken && (
                                    <div className="panel" style={{ background: 'var(--surface-alt)' }}>
                                        <div className="panel-body" style={{ padding: '1rem 1.25rem' }}>
                                            <strong style={{ fontSize: '0.86rem', display: 'block', marginBottom: '0.4rem', color: 'var(--text)' }}>
                                                Actions & Solutions Implemented
                                            </strong>
                                            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {report.actions_taken}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {report.next_week_plan && (
                                    <div className="panel" style={{ background: 'var(--surface-alt)' }}>
                                        <div className="panel-body" style={{ padding: '1rem 1.25rem' }}>
                                            <strong style={{ fontSize: '0.86rem', display: 'block', marginBottom: '0.4rem', color: 'var(--text)' }}>
                                                Upcoming Week Plan
                                            </strong>
                                            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {report.next_week_plan}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Attachments Section */}
                            {report.attachments && report.attachments.length > 0 && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <strong style={{ fontSize: '0.86rem', display: 'block', marginBottom: '0.6rem' }}>
                                        Attached Evidence & Files ({report.attachments.length})
                                    </strong>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {report.attachments.map((att) => (
                                            <div
                                                key={att.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '0.75rem 1rem',
                                                    background: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: 'var(--radius-md)',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <FileText size={18} style={{ color: 'var(--primary)' }} />
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{att.file_name}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                            {(att.file_size / 1024 / 1024).toFixed(2)} MB
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    {isPreviewable(att.file_type) && (
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => handlePreview(att)}
                                                            disabled={busyAttachment === att.id}
                                                        >
                                                            <Eye size={12} /> Preview
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleDownload(att)}
                                                        disabled={busyAttachment === att.id}
                                                    >
                                                        <Download size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Edit / Resubmit Form */
                        <form onSubmit={handleResubmit}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                                Edit & Resubmit Weekly Report
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                                Update your report content to address reviewer feedback.
                            </p>

                            {editError && (
                                <div className="notice notice-danger" style={{ marginBottom: '1rem' }}>
                                    {editError}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    className="form-control"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Activity Summary</label>
                                <textarea
                                    className="form-control"
                                    value={editSummary}
                                    onChange={(e) => setEditSummary(e.target.value)}
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Challenges</label>
                                <textarea
                                    className="form-control"
                                    value={editChallenges}
                                    onChange={(e) => setEditChallenges(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Actions Taken</label>
                                <textarea
                                    className="form-control"
                                    value={editActions}
                                    onChange={(e) => setEditActions(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Next Week Plan</label>
                                <textarea
                                    className="form-control"
                                    value={editNextWeek}
                                    onChange={(e) => setEditNextWeek(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <FileDropzone
                                    label="Add Additional Evidence Attachments"
                                    multiple={true}
                                    files={editFiles}
                                    onFilesSelect={setEditFiles}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={editLoading}
                                >
                                    {editLoading ? 'Saving…' : 'Save & Resubmit Report'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setEditMode(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Controls */}
                {!editMode && (
                    <div className="modal-footer">
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                                {report.status === 'Rejected' && isOwner && (
                                    <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>
                                        <RefreshCw size={13} /> Edit & Resubmit
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isAdmin && report.status === 'Pending Review' && (
                                    <>
                                        <button className="btn btn-danger btn-sm" onClick={() => setShowRejectConfirm(true)}>
                                            <XCircle size={13} /> Reject Report
                                        </button>
                                        <button className="btn btn-success btn-sm" onClick={() => setShowApproveConfirm(true)}>
                                            <CheckCircle2 size={13} /> Approve Report
                                        </button>
                                    </>
                                )}
                                <button className="btn btn-secondary btn-sm" onClick={onClose}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Approval Confirm Modal */}
            <ConfirmModal
                isOpen={showApproveConfirm}
                title="Approve Weekly Report"
                message={`Approve ${report.submitted_by.name}'s Week ${report.week_number} report?`}
                confirmText="Approve Report"
                onConfirm={handleApprove}
                onCancel={() => setShowApproveConfirm(false)}
                loading={actionLoading}
            />

            {/* Rejection Confirm Modal with Feedback Input */}
            <ConfirmModal
                isOpen={showRejectConfirm}
                title="Reject Weekly Report"
                message={`Please provide feedback explaining why ${report.submitted_by.name}'s report is being returned for revision.`}
                confirmText="Reject with Feedback"
                isDanger={true}
                inputMode={true}
                inputLabel="Reviewer Revision Notes"
                inputPlaceholder="Explain what needs to be added or clarified…"
                inputRequired={true}
                onConfirm={handleReject}
                onCancel={() => setShowRejectConfirm(false)}
                loading={actionLoading}
            />
        </div>
    );
};

export default WeeklyReportDetailsModal;
