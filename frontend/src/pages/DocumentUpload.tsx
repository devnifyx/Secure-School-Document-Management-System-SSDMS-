import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg', 'image/png',
];

const DocumentUpload: React.FC = () => {
    const { activePanitia, panitiaList } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [panitiaId, setPanitiaId] = useState<string>(String(activePanitia?.id || ''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        if (f && !ALLOWED_TYPES.includes(f.type)) {
            setError('File type not allowed. Accepted formats: PDF, DOCX, DOC, JPG, PNG.');
            setFile(null); e.target.value = ''; return;
        }
        if (f && f.size > 10 * 1024 * 1024) {
            setError('File size must not exceed 10 MB.');
            setFile(null); e.target.value = ''; return;
        }
        setError(''); setFile(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) { setError('Please attach a file.'); return; }
        if (!category) { setError('Please select a category.'); return; }
        if (!panitiaId) { setError('Please select a Panitia.'); return; }
        setLoading(true); setError('');
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('file', file);
            formData.append('category', category);
            formData.append('panitia_id', panitiaId);
            const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
            tags.forEach((tag, i) => formData.append(`tags[${i}]`, tag));
            await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccess(true);
            setTimeout(() => navigate('/documents'), 1400);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors;
            setError(typeof msg === 'string' ? msg : 'Upload failed. Please check the form and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Upload Document" subtitle="Submit a document for administrative review and approval">
            <div style={{ maxWidth: '680px' }}>
                <div className="panel">
                    <div className="panel-body">
                        {success && (
                            <div className="notice notice-success" style={{ marginBottom: '1.25rem' }}>
                                <span>✓</span>
                                <div>Document submitted successfully. Redirecting to your document repository…</div>
                            </div>
                        )}
                        {error && (
                            <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                                <span>⚠</span><div>{error}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Document Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    className="form-control" type="text" value={title} required
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Grade 10 Mathematics Lesson Plan — Week 3"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Category <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} required>
                                        <option value="">Select a category</option>
                                        <option value="Lesson Plans">Lesson Plans</option>
                                        <option value="Assessments">Assessments</option>
                                        <option value="Reports">Reports</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Upload For Panitia <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    {panitiaList.length <= 1 ? (
                                        <input className="form-control" value={activePanitia?.name || ''} disabled />
                                    ) : (
                                        <select className="form-control" value={panitiaId} onChange={(e) => setPanitiaId(e.target.value)} required>
                                            {panitiaList.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Tags <span className="form-hint">(comma-separated, optional)</span>
                                </label>
                                <input
                                    className="form-control" type="text" value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    placeholder="e.g. mathematics, grade-10, week-3"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description <span className="form-hint">(optional)</span></label>
                                <textarea
                                    className="form-control" value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide additional context or notes about this document"
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    File Upload <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                                    <span className="form-hint">(PDF, DOCX, DOC, JPG, PNG — max 10 MB)</span>
                                </label>
                                <input
                                    className="form-control" type="file"
                                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    required
                                />
                                {file && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        Selected: <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </div>
                                )}
                            </div>

                            <div className="notice notice-info" style={{ margin: '1.25rem 0' }}>
                                <span>🔒</span>
                                <div>Uploaded documents are automatically encrypted using AES-256 before being stored. A cryptographic checksum is recorded for future integrity verification.</div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={loading || success}>
                                    {loading ? 'Uploading…' : 'Submit for Approval'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => navigate('/documents')}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DocumentUpload;
