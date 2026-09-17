import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from './ConfirmModal';
import FileDropzone from './FileDropzone';
import CustomSelect from './CustomSelect';
import {
    FileText,
    Download,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    X,
    Lock,
    RefreshCw,
    User,
    Layers,
    Tag,
} from 'lucide-react';

export interface DocumentItem {
    id: number;
    title: string;
    description: string | null;
    file_name: string;
    file_type: string;
    file_size: number;
    category: string;
    tags: string[] | null;
    status: 'Pending' | 'Approved' | 'Rejected';
    rejection_reason: string | null;
    uploaded_by: { id: number; name: string };
    panitia?: { id: number; name: string } | null;
    created_at: string;
    updated_at: string;
}

interface VerifyResultData {
    status: 'intact' | 'tampered' | 'corrupted' | 'missing' | 'no_hash';
    message: string;
    stored_hash?: string;
    current_hash?: string;
    checked_at?: string;
}

interface Props {
    document: DocumentItem;
    onClose: () => void;
    onChanged: () => void;
}

const statusBadge = (status: string) => {
    if (status === 'Approved') return <span className="badge badge-success"><CheckCircle2 size={12} /> Approved</span>;
    if (status === 'Rejected') return <span className="badge badge-danger"><XCircle size={12} /> Rejected</span>;
    return <span className="badge badge-warning"><Clock size={12} /> Pending Review</span>;
};

const DocumentDetailsModal: React.FC<Props> = ({ document: doc, onClose, onChanged }) => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const isAdmin = user?.role === 'Admin';
    const isOwner = doc.uploaded_by.id === user?.id;

    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<VerifyResultData | null>(null);

    const [resubmitMode, setResubmitMode] = useState(false);
    const [resubTitle, setResubTitle] = useState(doc.title);
    const [resubCategory, setResubCategory] = useState(doc.category);
    const [resubTags, setResubTags] = useState(doc.tags?.join(', ') ?? '');
    const [resubDescription, setResubDescription] = useState(doc.description ?? '');
    const [resubFile, setResubFile] = useState<File | null>(null);
    const [resubLoading, setResubLoading] = useState(false);
    const [resubError, setResubError] = useState('');

    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [previewing, setPreviewing] = useState(false);

    const isPreviewable = ['application/pdf', 'image/jpeg', 'image/png'].includes(doc.file_type);

    const handleDownload = async () => {
        try {
            const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = window.document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.file_name);
            window.document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            success(`Downloaded "${doc.file_name}"`);
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Download failed');
        }
    };

    const handlePreview = async () => {
        setPreviewing(true);
        try {
            const res = await api.get(`/documents/${doc.id}/preview`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: doc.file_type });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Preview failed');
        } finally {
            setPreviewing(false);
        }
    };

    const handleVerify = async () => {
        setVerifying(true);
        try {
            const res = await api.post(`/documents/${doc.id}/verify`);
            setVerifyResult(res.data);
            if (res.data.status === 'intact') {
                success('Document cryptographic integrity verified (Intact).');
            } else {
                toastError(`Verification alert: ${res.data.status}`);
            }
        } catch (e: any) {
            setVerifyResult({ status: 'corrupted', message: e.response?.data?.message || 'Verification failed' });
        } finally {
            setVerifying(false);
        }
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await api.post(`/documents/${doc.id}/approve`);
            success('Document approved successfully.');
            setShowApproveConfirm(false);
            onChanged();
            onClose();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to approve');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (reason?: string) => {
        if (!reason?.trim()) return;
        setActionLoading(true);
        try {
            await api.post(`/documents/${doc.id}/reject`, { reason: reason.trim() });
            success('Document rejected with feedback.');
            setShowRejectConfirm(false);
            onChanged();
            onClose();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to reject');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResubLoading(true);
        setResubError('');
        try {
            const formData = new FormData();
            formData.append('title', resubTitle);
            formData.append('category', resubCategory);
            formData.append('description', resubDescription);
            const tags = resubTags.split(',').map((t) => t.trim()).filter(Boolean);
            tags.forEach((tag, i) => formData.append(`tags[${i}]`, tag));
            if (resubFile) formData.append('file', resubFile);
            formData.append('_method', 'PUT');

            await api.post(`/documents/${doc.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            success('Document updated and resubmitted for approval.');
            onChanged();
            onClose();
        } catch (e: any) {
            const msg = e.response?.data?.message || e.response?.data?.errors;
            setResubError(typeof msg === 'string' ? msg : 'Resubmission failed.');
        } finally {
            setResubLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-box"
                style={{ maxWidth: '680px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>
                        <FileText size={20} style={{ color: 'var(--primary)' }} />
                        Document Details
                    </h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    {!resubmitMode ? (
                        <>
                            {/* Title & Status Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem' }}>
                                        {doc.title}
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {statusBadge(doc.status)}
                                        <span className="badge badge-neutral">{doc.category}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {doc.description && (
                                <div style={{
                                    padding: '0.85rem 1.1rem',
                                    background: 'var(--surface-alt)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1.25rem',
                                    fontSize: '0.84rem',
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.6,
                                }}>
                                    {doc.description}
                                </div>
                            )}

                            {/* Rejection Banner */}
                            {doc.rejection_reason && (
                                <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                                    <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                                    <div>
                                        <strong>Admin Feedback / Revision Required:</strong>
                                        <div style={{ marginTop: '0.2rem' }}>{doc.rejection_reason}</div>
                                    </div>
                                </div>
                            )}

                            {/* Metadata Details Grid */}
                            <dl className="detail-grid" style={{ marginBottom: '1.5rem' }}>
                                <dt>Author</dt>
                                <dd>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <User size={13} /> {doc.uploaded_by.name}
                                    </div>
                                </dd>

                                <dt>Department</dt>
                                <dd>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Layers size={13} /> {doc.panitia?.name || '—'}
                                    </div>
                                </dd>

                                <dt>Tags</dt>
                                <dd>
                                    {doc.tags && doc.tags.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                            {doc.tags.map((t) => (
                                                <span key={t} className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                                                    <Tag size={10} /> {t}
                                                </span>
                                            ))}
                                        </div>
                                    ) : '—'}
                                </dd>

                                <dt>File Name</dt>
                                <dd>
                                    <strong>{doc.file_name}</strong> ({(doc.file_size / 1024 / 1024).toFixed(2)} MB)
                                </dd>

                                <dt>Submitted</dt>
                                <dd>{new Date(doc.created_at).toLocaleString()}</dd>

                                <dt>Last Updated</dt>
                                <dd>{new Date(doc.updated_at).toLocaleString()}</dd>
                            </dl>

                            {/* Verification Result Card for Admin */}
                            {isAdmin && (
                                <div className="panel" style={{ marginBottom: '1.25rem', background: 'var(--surface-alt)' }}>
                                    <div className="panel-body" style={{ padding: '1rem 1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: verifyResult ? '0.75rem' : 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Lock size={16} style={{ color: 'var(--primary)' }} />
                                                <strong style={{ fontSize: '0.86rem' }}>Cryptographic Integrity Verification</strong>
                                            </div>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={handleVerify}
                                                disabled={verifying}
                                            >
                                                <RefreshCw size={12} className={verifying ? 'spin' : ''} />
                                                {verifying ? 'Checking…' : 'Verify SHA-256'}
                                            </button>
                                        </div>

                                        {verifyResult && (
                                            <div style={{ fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <span className={`badge ${verifyResult.status === 'intact' ? 'badge-success' : 'badge-danger'}`}>
                                                        {verifyResult.status.toUpperCase()}
                                                    </span>
                                                    <span>{verifyResult.message}</span>
                                                </div>
                                                {verifyResult.stored_hash && (
                                                    <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6, wordBreak: 'break-all' }}>
                                                        <div>Stored:  {verifyResult.stored_hash}</div>
                                                        <div>Current: {verifyResult.current_hash}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Resubmission Mode Form */
                        <form onSubmit={handleResubmit}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                                Resubmit Document with Corrections
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                                Address the rejection feedback and submit the revised document for re-approval.
                            </p>

                            {resubError && (
                                <div className="notice notice-danger" style={{ marginBottom: '1rem' }}>
                                    {resubError}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    className="form-control"
                                    value={resubTitle}
                                    onChange={(e) => setResubTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <CustomSelect
                                        options={[
                                            { value: 'Lesson Plans', label: 'Lesson Plans', sublabel: 'Syllabi, teaching plans, guides' },
                                            { value: 'Assessments', label: 'Assessments', sublabel: 'Exams, quizzes, rubrics' },
                                            { value: 'Reports', label: 'Reports', sublabel: 'Performance & student records' },
                                            { value: 'Other', label: 'Other', sublabel: 'General documentation' },
                                        ]}
                                        value={resubCategory}
                                        onChange={(val) => setResubCategory(val)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tags (comma-separated)</label>
                                    <input
                                        className="form-control"
                                        value={resubTags}
                                        onChange={(e) => setResubTags(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description / Changes Made</label>
                                <textarea
                                    className="form-control"
                                    value={resubDescription}
                                    onChange={(e) => setResubDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <FileDropzone
                                    label="Upload Replacement File (Optional)"
                                    hint="Leave blank if keeping existing file"
                                    file={resubFile}
                                    onFileSelect={setResubFile}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={resubLoading}
                                >
                                    {resubLoading ? 'Submitting…' : 'Submit Revised Document'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setResubmitMode(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Modal Footer Actions */}
                {!resubmitMode && (
                    <div className="modal-footer">
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {(doc.status === 'Approved' || isAdmin || isOwner) && (
                                    <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
                                        <Download size={14} /> Download
                                    </button>
                                )}
                                {isPreviewable && (
                                    <button className="btn btn-secondary btn-sm" onClick={handlePreview} disabled={previewing}>
                                        <Eye size={14} /> {previewing ? 'Opening…' : 'In-Browser Preview'}
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {doc.status === 'Rejected' && isOwner && (
                                    <button className="btn btn-primary btn-sm" onClick={() => setResubmitMode(true)}>
                                        <RefreshCw size={13} /> Resubmit Corrections
                                    </button>
                                )}

                                {isAdmin && doc.status === 'Pending' && (
                                    <>
                                        <button className="btn btn-danger btn-sm" onClick={() => setShowRejectConfirm(true)}>
                                            <XCircle size={13} /> Reject
                                        </button>
                                        <button className="btn btn-success btn-sm" onClick={() => setShowApproveConfirm(true)}>
                                            <CheckCircle2 size={13} /> Approve
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

            {/* Approval Confirmation Modal */}
            <ConfirmModal
                isOpen={showApproveConfirm}
                title="Approve Document"
                message={`Approve "${doc.title}"? Authorized users will be able to access and download this file.`}
                confirmText="Approve"
                onConfirm={handleApprove}
                onCancel={() => setShowApproveConfirm(false)}
                loading={actionLoading}
            />

            {/* Rejection Confirmation Modal with Reason */}
            <ConfirmModal
                isOpen={showRejectConfirm}
                title="Reject Document"
                message={`Please provide feedback explaining why "${doc.title}" is being rejected.`}
                confirmText="Reject with Feedback"
                isDanger={true}
                inputMode={true}
                inputLabel="Reason for Rejection"
                inputPlaceholder="Explain what needs correction…"
                inputRequired={true}
                onConfirm={handleReject}
                onCancel={() => setShowRejectConfirm(false)}
                loading={actionLoading}
            />
        </div>
    );
};

export default DocumentDetailsModal;
