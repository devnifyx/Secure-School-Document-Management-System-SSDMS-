import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

const VERIFY_CONFIG: Record<string, { badge: string; label: string }> = {
    intact:    { badge: 'badge-success', label: 'INTACT' },
    tampered:  { badge: 'badge-danger',  label: 'TAMPERED' },
    corrupted: { badge: 'badge-warning', label: 'CORRUPTED' },
    missing:   { badge: 'badge-neutral', label: 'FILE MISSING' },
    no_hash:   { badge: 'badge-info',    label: 'NO RECORD' },
};

const statusBadge = (status: string) => {
    if (status === 'Approved') return 'badge-success';
    if (status === 'Rejected') return 'badge-danger';
    return 'badge-warning';
};

const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg', 'image/png',
];

interface Props {
    document: DocumentItem;
    onClose: () => void;
    onChanged: () => void;
}

const DocumentDetailsModal: React.FC<Props> = ({ document: doc, onClose, onChanged }) => {
    const { user } = useAuth();
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

    const [actionLoading, setActionLoading] = useState(false);
    const [previewing, setPreviewing] = useState(false);

    const isPreviewable = ['application/pdf', 'image/jpeg', 'image/png'].includes(doc.file_type);

    const handleDownload = async () => {
        try {
            const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = window.document.createElement('a');
            link.href = url; link.setAttribute('download', doc.file_name);
            window.document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e: any) { alert(e.response?.data?.message || 'Download failed'); }
    };

    const handlePreview = async () => {
        setPreviewing(true);
        try {
            const res = await api.get(`/documents/${doc.id}/preview`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: doc.file_type });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            // Give the new tab time to load the blob before revoking
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (e: any) {
            alert(e.response?.data?.message || 'Preview failed');
        } finally { setPreviewing(false); }
    };

    const handleVerify = async () => {
        setVerifying(true);
        try {
            const res = await api.post(`/documents/${doc.id}/verify`);
            setVerifyResult(res.data);
        } catch (e: any) {
            setVerifyResult({ status: 'corrupted', message: e.response?.data?.message || 'Verification failed' });
        } finally { setVerifying(false); }
    };

    const handleApprove = async () => {
        if (!confirm('Approve this document?')) return;
        setActionLoading(true);
        try { await api.post(`/documents/${doc.id}/approve`); onChanged(); onClose(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed to approve'); }
        finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        const reason = prompt('Enter rejection reason (required):');
        if (!reason?.trim()) return;
        setActionLoading(true);
        try { await api.post(`/documents/${doc.id}/reject`, { reason }); onChanged(); onClose(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed to reject'); }
        finally { setActionLoading(false); }
    };

    const handleResubFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        if (f && !ALLOWED_TYPES.includes(f.type)) { setResubError('File type not allowed.'); e.target.value = ''; return; }
        if (f && f.size > 10 * 1024 * 1024) { setResubError('File must be under 10 MB.'); e.target.value = ''; return; }
        setResubError(''); setResubFile(f);
    };

    const handleResubmit = async () => {
        setResubLoading(true); setResubError('');
        try {
            const formData = new FormData();
            formData.append('title', resubTitle);
            formData.append('category', resubCategory);
            formData.append('description', resubDescription);
            const tags = resubTags.split(',').map((t) => t.trim()).filter(Boolean);
            tags.forEach((tag, i) => formData.append(`tags[${i}]`, tag));
            if (resubFile) formData.append('file', resubFile);
            formData.append('_method', 'PUT');
            await api.post(`/documents/${doc.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            onChanged(); onClose();
        } catch (e: any) {
            const msg = e.response?.data?.message || e.response?.data?.errors;
            setResubError(typeof msg === 'string' ? msg : 'Resubmission failed.');
        } finally { setResubLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Document Details</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {!resubmitMode ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
                                <div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.3rem' }}>{doc.title}</div>
                                    <span className={`badge ${statusBadge(doc.status)}`}>{doc.status}</span>
                                </div>
                            </div>

                            {doc.description && (
                                <div style={{ marginBottom: '1rem', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {doc.description}
                                </div>
                            )}

                            <dl className="detail-grid" style={{ marginBottom: '1rem' }}>
                                <dt>Owner</dt><dd>{doc.uploaded_by.name}</dd>
                                <dt>Panitia</dt><dd>{doc.panitia?.name || '—'}</dd>
                                <dt>Category</dt><dd>{doc.category}</dd>
                                <dt>Tags</dt>
                                <dd>
                                    {doc.tags && doc.tags.length > 0
                                        ? doc.tags.map((t) => <span key={t} className="badge badge-neutral" style={{ marginRight: '0.3rem' }}>{t}</span>)
                                        : '—'}
                                </dd>
                                <dt>File</dt>
                                <dd>
                                    {doc.file_name} ({(doc.file_size / 1024 / 1024).toFixed(2)} MB)
                                    {!isPreviewable && (doc.status === 'Approved' || isAdmin) && (
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                            In-browser preview is not available for this file type — use Download to open it.
                                        </div>
                                    )}
                                </dd>
                                <dt>Submitted</dt><dd>{new Date(doc.created_at).toLocaleString()}</dd>
                                <dt>Last Updated</dt><dd>{new Date(doc.updated_at).toLocaleString()}</dd>
                            </dl>

                            {doc.rejection_reason && (
                                <div className="notice notice-danger" style={{ marginBottom: '1rem' }}>
                                    <span>⚠</span>
                                    <div><strong>Rejection reason:</strong> {doc.rejection_reason}</div>
                                </div>
                            )}

                            {isAdmin && verifyResult && (
                                <div className="notice" style={{
                                    marginBottom: '1rem',
                                    background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)',
                                }}>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                            <span className={`badge ${VERIFY_CONFIG[verifyResult.status].badge}`}>
                                                {VERIFY_CONFIG[verifyResult.status].label}
                                            </span>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{verifyResult.message}</span>
                                        </div>
                                        {verifyResult.stored_hash && (
                                            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                                                <div>Stored:&nbsp;&nbsp;{verifyResult.stored_hash}</div>
                                                <div>Current: {verifyResult.current_hash}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="notice notice-danger" style={{ marginBottom: '1.1rem' }}>
                                <span>⚠</span>
                                <div><strong>Rejection reason:</strong> {doc.rejection_reason}</div>
                            </div>
                            {resubError && <div className="notice notice-danger" style={{ marginBottom: '1rem' }}>{resubError}</div>}

                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-control" value={resubTitle} onChange={(e) => setResubTitle(e.target.value)} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-control" value={resubCategory} onChange={(e) => setResubCategory(e.target.value)}>
                                        <option value="Lesson Plans">Lesson Plans</option>
                                        <option value="Assessments">Assessments</option>
                                        <option value="Reports">Reports</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tags</label>
                                    <input className="form-control" value={resubTags} onChange={(e) => setResubTags(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-control" rows={3} value={resubDescription} onChange={(e) => setResubDescription(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Replace File <span className="form-hint">(optional)</span></label>
                                <input className="form-control" type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" onChange={handleResubFile} />
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    {!resubmitMode ? (
                        <>
                            <div className="modal-footer-group">
                                {(doc.status === 'Approved' || isAdmin) && isPreviewable && (
                                    <button className="btn btn-secondary btn-sm" onClick={handlePreview} disabled={previewing}>
                                        {previewing ? 'Opening…' : '⬡ Preview'}
                                    </button>
                                )}
                                {(doc.status === 'Approved' || isAdmin) && (
                                    <button className="btn btn-secondary btn-sm" onClick={handleDownload}>⤓ Download</button>
                                )}
                                {isAdmin && (
                                    <button className="btn btn-secondary btn-sm" onClick={handleVerify} disabled={verifying}>
                                        {verifying ? 'Verifying…' : '⛊ Verify'}
                                    </button>
                                )}
                            </div>
                            <div className="modal-footer-spacer" />
                            <div className="modal-footer-group">
                                {isAdmin && doc.status === 'Pending' && (
                                    <>
                                        <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={actionLoading}>Reject</button>
                                        <button className="btn btn-success btn-sm" onClick={handleApprove} disabled={actionLoading}>Approve</button>
                                    </>
                                )}
                                {!isAdmin && isOwner && doc.status === 'Rejected' && (
                                    <button className="btn btn-primary btn-sm" onClick={() => setResubmitMode(true)}>Resubmit</button>
                                )}
                                <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary btn-sm" onClick={() => setResubmitMode(false)} disabled={resubLoading}>Back</button>
                            <div className="modal-footer-spacer" />
                            <button className="btn btn-primary btn-sm" onClick={handleResubmit} disabled={resubLoading}>
                                {resubLoading ? 'Submitting…' : 'Resubmit for Approval'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentDetailsModal;
