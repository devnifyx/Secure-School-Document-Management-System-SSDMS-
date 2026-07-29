import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
    if (status === 'Approved') return 'badge-success';
    if (status === 'Rejected') return 'badge-danger';
    return 'badge-warning';
};

const isPreviewable = (type: string) => ['application/pdf', 'image/jpeg', 'image/png'].includes(type);

interface Props {
    report: WeeklyReportItem;
    onClose: () => void;
    onChanged: () => void;
}

const WeeklyReportDetailsModal: React.FC<Props> = ({ report, onClose, onChanged }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isOwner = report.submitted_by.id === user?.id;

    const [actionLoading, setActionLoading] = useState(false);
    const [busyAttachment, setBusyAttachment] = useState<number | null>(null);

    const [editMode, setEditMode] = useState(false);
    const [editTitle, setEditTitle] = useState(report.title);
    const [editSummary, setEditSummary] = useState(report.activity_summary);
    const [editChallenges, setEditChallenges] = useState(report.challenges ?? '');
    const [editActions, setEditActions] = useState(report.actions_taken ?? '');
    const [editNextWeek, setEditNextWeek] = useState(report.next_week_plan ?? '');
    const [editFiles, setEditFiles] = useState<FileList | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    const handleApprove = async () => {
        if (!confirm('Approve this weekly report?')) return;
        setActionLoading(true);
        try { await api.post(`/weekly-reports/${report.id}/approve`); onChanged(); onClose(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed to approve'); }
        finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        const reason = prompt('Enter rejection reason (required):');
        if (!reason?.trim()) return;
        setActionLoading(true);
        try { await api.post(`/weekly-reports/${report.id}/reject`, { reason }); onChanged(); onClose(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed to reject'); }
        finally { setActionLoading(false); }
    };

    const handleDownload = async (att: WeeklyReportAttachmentItem) => {
        setBusyAttachment(att.id);
        try {
            const res = await api.get(`/weekly-reports/${report.id}/attachments/${att.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = window.document.createElement('a');
            link.href = url; link.setAttribute('download', att.file_name);
            window.document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e: any) { alert(e.response?.data?.message || 'Download failed'); }
        finally { setBusyAttachment(null); }
    };

    const handlePreview = async (att: WeeklyReportAttachmentItem) => {
        setBusyAttachment(att.id);
        try {
            const res = await api.get(`/weekly-reports/${report.id}/attachments/${att.id}/preview`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: att.file_type });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (e: any) { alert(e.response?.data?.message || 'Preview failed'); }
        finally { setBusyAttachment(null); }
    };

    const handleResubmit = async () => {
        setEditLoading(true); setEditError('');
        try {
            const formData = new FormData();
            formData.append('title', editTitle);
            formData.append('activity_summary', editSummary);
            formData.append('challenges', editChallenges);
            formData.append('actions_taken', editActions);
            formData.append('next_week_plan', editNextWeek);
            if (editFiles) {
                Array.from(editFiles).forEach((f) => formData.append('attachments[]', f));
            }
            formData.append('_method', 'PUT');
            await api.post(`/weekly-reports/${report.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            onChanged(); onClose();
        } catch (e: any) {
            const msg = e.response?.data?.message || e.response?.data?.errors;
            setEditError(typeof msg === 'string' ? msg : 'Resubmission failed.');
        } finally { setEditLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" style={{ maxWidth: '660px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Weekly Activity Report</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {!editMode ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
                                <div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.3rem' }}>{report.title}</div>
                                    <span className={`badge ${statusBadge(report.status)}`}>{report.status}</span>
                                    {report.is_late && <span className="badge badge-neutral" style={{ marginLeft: '0.4rem' }}>Late Submission</span>}
                                </div>
                            </div>

                            <dl className="detail-grid" style={{ marginBottom: '1rem' }}>
                                <dt>Submitted By</dt><dd>{report.submitted_by.name}</dd>
                                <dt>Panitia</dt><dd>{report.panitia?.name || '—'}</dd>
                                <dt>Week Number</dt><dd>Week {report.week_number}</dd>
                                <dt>Reporting Period</dt>
                                <dd>{new Date(report.period_start).toLocaleDateString()} to {new Date(report.period_end).toLocaleDateString()}</dd>
                                <dt>Submitted</dt><dd>{new Date(report.created_at).toLocaleString()}</dd>
                                <dt>Last Updated</dt><dd>{new Date(report.updated_at).toLocaleString()}</dd>
                            </dl>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' }}>Activity Summary</div>
                                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.activity_summary}</div>
                            </div>
                            {report.challenges && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' }}>Challenges or Issues Faced</div>
                                    <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.challenges}</div>
                                </div>
                            )}
                            {report.actions_taken && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' }}>Actions Taken</div>
                                    <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.actions_taken}</div>
                                </div>
                            )}
                            {report.next_week_plan && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' }}>Next Week Planning</div>
                                    <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.next_week_plan}</div>
                                </div>
                            )}

                            {report.attachments.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>Supporting Documents</div>
                                    {report.attachments.map((att) => (
                                        <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.7rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '0.4rem' }}>
                                            <span style={{ fontSize: '0.8rem' }}>{att.file_name} <span style={{ color: 'var(--text-muted)' }}>({(att.file_size / 1024 / 1024).toFixed(2)} MB)</span></span>
                                            <span>
                                                {isPreviewable(att.file_type) && (
                                                    <button className="row-action" disabled={busyAttachment === att.id} onClick={() => handlePreview(att)}>Preview</button>
                                                )}
                                                {' '}·{' '}
                                                <button className="row-action" disabled={busyAttachment === att.id} onClick={() => handleDownload(att)}>Download</button>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {report.rejection_reason && (
                                <div className="notice notice-danger" style={{ marginBottom: '1rem' }}>
                                    <span>⚠</span>
                                    <div><strong>Rejection reason:</strong> {report.rejection_reason}</div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {report.rejection_reason && (
                                <div className="notice notice-danger" style={{ marginBottom: '1.1rem' }}>
                                    <span>⚠</span>
                                    <div><strong>Rejection reason:</strong> {report.rejection_reason}</div>
                                </div>
                            )}
                            {editError && <div className="notice notice-danger" style={{ marginBottom: '1rem' }}>{editError}</div>}

                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-control" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Activity Summary</label>
                                <textarea className="form-control" rows={3} value={editSummary} onChange={(e) => setEditSummary(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Challenges or Issues Faced</label>
                                <textarea className="form-control" rows={2} value={editChallenges} onChange={(e) => setEditChallenges(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Actions Taken</label>
                                <textarea className="form-control" rows={2} value={editActions} onChange={(e) => setEditActions(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Next Week Planning</label>
                                <textarea className="form-control" rows={2} value={editNextWeek} onChange={(e) => setEditNextWeek(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Add Supporting Documents <span className="form-hint">(optional)</span></label>
                                <input className="form-control" type="file" multiple
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                                    onChange={(e) => setEditFiles(e.target.files)} />
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    {!editMode ? (
                        <>
                            <div className="modal-footer-group">
                                {isAdmin && report.status === 'Pending Review' && (
                                    <>
                                        <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={actionLoading}>Reject</button>
                                        <button className="btn btn-success btn-sm" onClick={handleApprove} disabled={actionLoading}>Approve</button>
                                    </>
                                )}
                                {!isAdmin && isOwner && report.status === 'Rejected' && (
                                    <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>Edit &amp; Resubmit</button>
                                )}
                            </div>
                            <div className="modal-footer-spacer" />
                            <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(false)} disabled={editLoading}>Back</button>
                            <div className="modal-footer-spacer" />
                            <button className="btn btn-primary btn-sm" onClick={handleResubmit} disabled={editLoading}>
                                {editLoading ? 'Submitting…' : 'Resubmit for Review'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeeklyReportDetailsModal;
