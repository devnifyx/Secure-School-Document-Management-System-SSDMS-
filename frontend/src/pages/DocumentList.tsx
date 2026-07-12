import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';

interface Document {
    id: number;
    title: string;
    file_name: string;
    file_type: string;
    file_size: number;
    category: string;
    tags: string[] | null;
    status: 'Pending' | 'Approved' | 'Rejected';
    rejection_reason: string | null;
    uploaded_by: { id: number; name: string };
    created_at: string;
}

interface Meta { current_page: number; last_page: number; total: number; }

const STATUS_CONFIG = {
    Approved: { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: '✅' },
    Rejected: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '❌' },
    Pending:  { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '⏳' },
};

const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg', 'image/png',
];

const DocumentList: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Verification state: map of docId → result
    const [verifyResults, setVerifyResults] = useState<Record<number, {
        status: 'intact' | 'tampered' | 'corrupted' | 'missing' | 'no_hash';
        message: string;
        stored_hash?: string;
        current_hash?: string;
        checked_at?: string;
    }>>({});
    const [verifying, setVerifying] = useState<Record<number, boolean>>({});

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [searchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');

    // Resubmit modal state
    const [resubmitDoc, setResubmitDoc] = useState<Document | null>(null);
    const [resubTitle, setResubTitle] = useState('');
    const [resubCategory, setResubCategory] = useState('');
    const [resubTags, setResubTags] = useState('');
    const [resubFile, setResubFile] = useState<File | null>(null);
    const [resubLoading, setResubLoading] = useState(false);
    const [resubError, setResubError] = useState('');

    const { user } = useAuth();
    const navigate = useNavigate();

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params: any = { page };
            if (statusFilter) params.status = statusFilter;
            if (categoryFilter) params.category = categoryFilter;
            if (search) params.search = search;
            const res = await api.get('/documents', { params });
            setDocuments(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load documents');
        } finally { setLoading(false); }
    }, [page, statusFilter, categoryFilter, search]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const s = searchParams.get('status');
        if (s) setStatusFilter(s);
    }, []);

    const handleSearch = () => { setSearch(searchInput.trim()); setPage(1); };

    const handleDownload = async (doc: Document) => {
        try {
            const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', doc.file_name);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e: any) { alert(e.response?.data?.message || 'Download failed'); }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('Approve this document?')) return;
        try { await api.post(`/documents/${id}/approve`); load(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    };

    const handleReject = async (id: number) => {
        const reason = prompt('Enter rejection reason (required):');
        if (!reason?.trim()) return;
        try { await api.post(`/documents/${id}/reject`, { reason }); load(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this document? This cannot be undone.')) return;
        try { await api.delete(`/documents/${id}`); load(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    };

    const handleVerify = async (id: number) => {
        setVerifying((v) => ({ ...v, [id]: true }));
        try {
            const res = await api.post(`/documents/${id}/verify`);
            setVerifyResults((r) => ({ ...r, [id]: res.data }));
        } catch (e: any) {
            setVerifyResults((r) => ({ ...r, [id]: { status: 'corrupted', message: e.response?.data?.message || 'Verification failed' } }));
        } finally {
            setVerifying((v) => ({ ...v, [id]: false }));
        }
    };

    const openResubmit = (doc: Document) => {
        setResubmitDoc(doc);
        setResubTitle(doc.title);
        setResubCategory(doc.category);
        setResubTags(doc.tags?.join(', ') ?? '');
        setResubFile(null);
        setResubError('');
    };

    const handleResubmit = async () => {
        if (!resubmitDoc) return;
        setResubLoading(true); setResubError('');
        try {
            const formData = new FormData();
            formData.append('title', resubTitle);
            formData.append('category', resubCategory);
            const tags = resubTags.split(',').map((t) => t.trim()).filter(Boolean);
            tags.forEach((tag, i) => formData.append(`tags[${i}]`, tag));
            if (resubFile) formData.append('file', resubFile);
            formData.append('_method', 'PUT');
            await api.post(`/documents/${resubmitDoc.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResubmitDoc(null);
            load();
        } catch (e: any) {
            const msg = e.response?.data?.message || e.response?.data?.errors;
            setResubError(typeof msg === 'string' ? msg : 'Resubmission failed');
        } finally { setResubLoading(false); }
    };

    const handleResubFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        if (f && !ALLOWED_TYPES.includes(f.type)) {
            setResubError('File type not allowed. Use PDF, DOCX, DOC, JPG, or PNG.');
            e.target.value = ''; return;
        }
        if (f && f.size > 10 * 1024 * 1024) {
            setResubError('File must be under 10 MB.'); e.target.value = ''; return;
        }
        setResubError(''); setResubFile(f);
    };

    const isTeacher = user?.role === 'Teacher';

    return (
        <Layout title={isTeacher ? 'My Documents' : 'All Documents'}>
            {/* Filters row */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', flex: 1, minWidth: '220px' }}>
                    <input
                        type="text"
                        placeholder="Search by title…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            flex: 1, padding: '0.6rem 0.85rem',
                            border: '1px solid #e5e7eb', borderRight: 'none',
                            borderRadius: '8px 0 0 8px', fontSize: '0.875rem',
                            background: 'white', outline: 'none',
                        }}
                    />
                    <button onClick={handleSearch} style={{
                        background: '#1f2937', color: 'white', border: 'none',
                        padding: '0.6rem 1rem', borderRadius: '0 8px 8px 0',
                        cursor: 'pointer', fontSize: '0.875rem',
                    }}>🔍</button>
                </div>

                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    style={filterSelect}>
                    <option value="">All statuses</option>
                    <option value="Pending">⏳ Pending</option>
                    <option value="Approved">✅ Approved</option>
                    <option value="Rejected">❌ Rejected</option>
                </select>

                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    style={filterSelect}>
                    <option value="">All categories</option>
                    <option value="Lesson Plans">📖 Lesson Plans</option>
                    <option value="Assessments">📝 Assessments</option>
                    <option value="Reports">📊 Reports</option>
                    <option value="Other">📌 Other</option>
                </select>

                {isTeacher && (
                    <button onClick={() => navigate('/upload')} style={{
                        background: '#10b981', color: 'white', border: 'none',
                        padding: '0.6rem 1.1rem', borderRadius: '8px',
                        cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                        marginLeft: 'auto',
                    }}>
                        + Upload Document
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📂</div>
                    Loading documents…
                </div>
            ) : error ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '1rem', borderRadius: '8px' }}>{error}</div>
            ) : documents.length === 0 ? (
                <div style={{
                    background: 'white', borderRadius: '12px', padding: '4rem 2rem',
                    textAlign: 'center', color: '#9ca3af',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>No documents found</div>
                    {isTeacher && (
                        <button onClick={() => navigate('/upload')} style={{
                            marginTop: '1rem', background: '#10b981', color: 'white',
                            border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                        }}>Upload your first document</button>
                    )}
                </div>
            ) : (
                <>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        {meta?.total ?? 0} document{meta?.total !== 1 ? 's' : ''}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {documents.map((doc) => {
                            const cfg = STATUS_CONFIG[doc.status];
                            return (
                                <div key={doc.id} style={{
                                    background: 'white', borderRadius: '12px',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                    border: '1px solid #f3f4f6',
                                    overflow: 'hidden',
                                }}>
                                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    {/* Status icon */}
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '10px',
                                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem', flexShrink: 0,
                                    }}>
                                        {cfg.icon}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem' }}>{doc.title}</span>
                                            <span style={{
                                                background: cfg.bg, color: cfg.color,
                                                border: `1px solid ${cfg.border}`,
                                                padding: '0.1rem 0.6rem', borderRadius: '20px',
                                                fontSize: '0.72rem', fontWeight: 700,
                                            }}>{doc.status}</span>
                                        </div>

                                        <div style={{ fontSize: '0.78rem', color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1.25rem', marginBottom: '0.4rem' }}>
                                            {!isTeacher && <span>👤 {doc.uploaded_by.name}</span>}
                                            <span>📂 {doc.category}</span>
                                            <span>📄 {doc.file_name} ({(doc.file_size / 1024 / 1024).toFixed(2)} MB)</span>
                                            <span>🗓 {new Date(doc.created_at).toLocaleDateString()}</span>
                                        </div>

                                        {doc.tags && doc.tags.length > 0 && (
                                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                                                {doc.tags.map((tag) => (
                                                    <span key={tag} style={{
                                                        background: '#eff6ff', color: '#3b82f6',
                                                        padding: '0.1rem 0.45rem', borderRadius: '4px',
                                                        fontSize: '0.72rem', fontWeight: 500,
                                                    }}>#{tag}</span>
                                                ))}
                                            </div>
                                        )}

                                        {doc.rejection_reason && (
                                            <div style={{
                                                marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                                                background: '#fef2f2', borderLeft: '3px solid #ef4444',
                                                borderRadius: '0 6px 6px 0', color: '#dc2626', fontSize: '0.78rem',
                                            }}>
                                                <strong>Rejection reason:</strong> {doc.rejection_reason}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                                        {(doc.status === 'Approved' || user?.role === 'Admin') && (
                                            <ActionBtn color="#3b82f6" onClick={() => handleDownload(doc)}>⬇ Download</ActionBtn>
                                        )}
                                        {user?.role === 'Admin' && doc.status === 'Pending' && (
                                            <>
                                                <ActionBtn color="#10b981" onClick={() => handleApprove(doc.id)}>✓ Approve</ActionBtn>
                                                <ActionBtn color="#ef4444" onClick={() => handleReject(doc.id)}>✗ Reject</ActionBtn>
                                            </>
                                        )}
                                        {isTeacher && doc.status === 'Rejected' && (
                                            <ActionBtn color="#f59e0b" onClick={() => openResubmit(doc)}>🔄 Resubmit</ActionBtn>
                                        )}
                                        {(user?.role === 'Admin' || (isTeacher && doc.uploaded_by.id === user?.id)) && (
                                            <ActionBtn color="#6b7280" onClick={() => handleDelete(doc.id)}>🗑 Delete</ActionBtn>
                                        )}
                                        {user?.role === 'Admin' && (
                                            <ActionBtn color="#6366f1" onClick={() => handleVerify(doc.id)}>
                                                {verifying[doc.id] ? '⏳…' : '🔍 Verify'}
                                            </ActionBtn>
                                        )}
                                    </div>
                                </div>
                                </div>{/* end inner flex row */}

                                {/* Integrity verification result panel */}
                                {verifyResults[doc.id] && (
                                    <VerifyResult
                                        result={verifyResults[doc.id]}
                                        onClose={() => setVerifyResults((r) => { const n = { ...r }; delete n[doc.id]; return n; })}
                                    />
                                )}
                            </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                            <PageBtn disabled={page === 1} onClick={() => setPage(1)}>«</PageBtn>
                            <PageBtn disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</PageBtn>
                            <span style={{ padding: '0 0.75rem', color: '#555', fontSize: '0.875rem' }}>
                                Page {meta.current_page} of {meta.last_page}
                            </span>
                            <PageBtn disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>›</PageBtn>
                            <PageBtn disabled={page === meta.last_page} onClick={() => setPage(meta.last_page)}>»</PageBtn>
                        </div>
                    )}
                </>
            )}

            {/* Resubmit Modal */}
            {resubmitDoc && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
                }}>
                    <div style={{
                        background: 'white', borderRadius: '14px', padding: '2rem',
                        width: '100%', maxWidth: '480px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.05rem' }}>🔄 Resubmit Document</h3>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                                    Update and resubmit for approval
                                </p>
                            </div>
                            <button onClick={() => setResubmitDoc(null)} style={{
                                background: '#f3f4f6', border: 'none', borderRadius: '50%',
                                width: '30px', height: '30px', cursor: 'pointer', fontSize: '1rem', color: '#6b7280',
                            }}>×</button>
                        </div>

                        {/* Rejection reason reminder */}
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem',
                        }}>
                            <strong style={{ color: '#dc2626' }}>Rejection reason:</strong>
                            <span style={{ color: '#7f1d1d', marginLeft: '0.5rem' }}>{resubmitDoc.rejection_reason}</span>
                        </div>

                        {resubError && (
                            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.7rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                                {resubError}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <ModalField label="Title">
                                <input value={resubTitle} onChange={(e) => setResubTitle(e.target.value)} style={modalInput} />
                            </ModalField>
                            <ModalField label="Category">
                                <select value={resubCategory} onChange={(e) => setResubCategory(e.target.value)} style={modalInput}>
                                    <option value="Lesson Plans">Lesson Plans</option>
                                    <option value="Assessments">Assessments</option>
                                    <option value="Reports">Reports</option>
                                    <option value="Other">Other</option>
                                </select>
                            </ModalField>
                            <ModalField label="Tags (comma-separated)">
                                <input value={resubTags} onChange={(e) => setResubTags(e.target.value)} placeholder="e.g. math, grade-10" style={modalInput} />
                            </ModalField>
                            <ModalField label="Replace File (optional — PDF, DOCX, JPG, PNG, max 10 MB)">
                                <input type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" onChange={handleResubFile} style={modalInput} />
                            </ModalField>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setResubmitDoc(null)} style={{
                                background: '#f3f4f6', border: 'none', padding: '0.65rem 1.25rem',
                                borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#374151',
                            }}>Cancel</button>
                            <button onClick={handleResubmit} disabled={resubLoading} style={{
                                background: '#f59e0b', color: 'white', border: 'none',
                                padding: '0.65rem 1.5rem', borderRadius: '8px',
                                cursor: resubLoading ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem', fontWeight: 600, opacity: resubLoading ? 0.7 : 1,
                            }}>
                                {resubLoading ? 'Submitting…' : '🔄 Resubmit for Approval'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

interface VerifyResultData {
    status: 'intact' | 'tampered' | 'corrupted' | 'missing' | 'no_hash';
    message: string;
    stored_hash?: string;
    current_hash?: string;
    checked_at?: string;
}

const VERIFY_CONFIG = {
    intact:    { icon: '✅', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'INTACT' },
    tampered:  { icon: '🚨', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'TAMPERED' },
    corrupted: { icon: '⚠️', color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'CORRUPTED' },
    missing:   { icon: '❓', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', label: 'FILE MISSING' },
    no_hash:   { icon: 'ℹ️', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'NO RECORD' },
};

const VerifyResult: React.FC<{ result: VerifyResultData; onClose: () => void }> = ({ result, onClose }) => {
    const cfg = VERIFY_CONFIG[result.status];
    return (
        <div style={{
            borderTop: `2px solid ${cfg.border}`,
            background: cfg.bg,
            padding: '1rem 1.5rem',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{cfg.icon}</span>
                        <span style={{
                            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em',
                            color: cfg.color, background: cfg.color + '20',
                            padding: '0.15rem 0.55rem', borderRadius: '4px',
                        }}>{cfg.label}</span>
                        {result.checked_at && (
                            <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                                Checked {new Date(result.checked_at).toLocaleString()}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: cfg.color, fontWeight: 500, marginBottom: '0.5rem' }}>
                        {result.message}
                    </div>
                    {result.stored_hash && (
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', fontFamily: 'monospace', lineHeight: 1.8 }}>
                            <div><span style={{ color: '#374151', fontWeight: 600 }}>Stored&nbsp;&nbsp; SHA-256:</span> {result.stored_hash}</div>
                            {result.current_hash && (
                                <div>
                                    <span style={{ color: '#374151', fontWeight: 600 }}>Current SHA-256:</span>{' '}
                                    <span style={{ color: result.status === 'intact' ? '#059669' : '#dc2626' }}>
                                        {result.current_hash}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <button onClick={onClose} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', fontSize: '1.1rem', flexShrink: 0,
                }}>×</button>
            </div>
        </div>
    );
};

const filterSelect: React.CSSProperties = {
    padding: '0.6rem 0.85rem', border: '1px solid #e5e7eb',
    borderRadius: '8px', fontSize: '0.875rem', background: 'white',
    minWidth: '150px', cursor: 'pointer',
};

const ActionBtn: React.FC<{ color: string; onClick: () => void; children: React.ReactNode }> = ({ color, onClick, children }) => (
    <button onClick={onClick} style={{
        background: color + '15', color, border: `1px solid ${color}40`,
        padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer',
        fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'center',
    }}>{children}</button>
);

const PageBtn: React.FC<{ disabled: boolean; onClick: () => void; children: React.ReactNode }> = ({ disabled, onClick, children }) => (
    <button disabled={disabled} onClick={onClick} style={{
        background: disabled ? '#f9fafb' : 'white', border: '1px solid #e5e7eb',
        borderRadius: '6px', padding: '0.4rem 0.75rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#d1d5db' : '#374151', fontSize: '0.875rem',
    }}>{children}</button>
);

const ModalField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{label}</label>
        {children}
    </div>
);

const modalInput: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.75rem',
    border: '1px solid #e5e7eb', borderRadius: '8px',
    fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none',
};

export default DocumentList;
