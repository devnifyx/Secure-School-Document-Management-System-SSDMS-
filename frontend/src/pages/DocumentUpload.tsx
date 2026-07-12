import React, { useState, useRef } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg', 'image/png',
];

const FILE_ICONS: Record<string, string> = {
    'application/pdf': '📕',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
    'application/msword': '📘',
    'image/jpeg': '🖼',
    'image/png': '🖼',
};

const CATEGORIES = ['Lesson Plans', 'Assessments', 'Reports', 'Other'];

const DocumentUpload: React.FC = () => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const validateFile = (f: File): string | null => {
        if (!ALLOWED_TYPES.includes(f.type)) return 'File type not allowed. Use PDF, DOCX, DOC, JPG, or PNG.';
        if (f.size > 10 * 1024 * 1024) return 'File size must not exceed 10 MB.';
        return null;
    };

    const handleFileSelect = (f: File) => {
        const err = validateFile(f);
        if (err) { setError(err); return; }
        setError(''); setFile(f);
        if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFileSelect(f);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFileSelect(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) { setError('Please select a file.'); return; }
        if (!category) { setError('Please select a category.'); return; }
        setLoading(true); setError('');
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('file', file);
            formData.append('category', category);
            const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
            tags.forEach((tag, i) => formData.append(`tags[${i}]`, tag));
            await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccess(true);
            setTimeout(() => navigate('/documents'), 2000);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors;
            setError(typeof msg === 'string' ? msg : 'Upload failed. Please check your inputs.');
        } finally { setLoading(false); }
    };

    return (
        <Layout title="Upload Document">
            <div style={{ maxWidth: '600px' }}>
                {success ? (
                    <div style={{
                        background: 'white', borderRadius: '14px', padding: '3rem 2rem',
                        textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <h3 style={{ color: '#10b981', margin: '0 0 0.5rem 0' }}>Document Uploaded!</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                            Your document has been submitted for admin approval. Redirecting…
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Error */}
                        {error && (
                            <div style={{
                                background: '#fef2f2', border: '1px solid #fecaca',
                                color: '#dc2626', padding: '0.75rem 1rem',
                                borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem',
                            }}>{error}</div>
                        )}

                        {/* Drop zone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            style={{
                                border: `2px dashed ${dragOver ? '#10b981' : file ? '#10b981' : '#d1d5db'}`,
                                borderRadius: '12px',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: dragOver ? '#ecfdf5' : file ? '#f0fdf4' : '#fafafa',
                                marginBottom: '1.25rem',
                                transition: 'all 0.2s',
                            }}
                        >
                            <input
                                ref={fileInputRef} type="file"
                                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                            {file ? (
                                <>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                                        {FILE_ICONS[file.type] ?? '📄'}
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{file.name}</div>
                                    <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        style={{
                                            marginTop: '0.75rem', background: 'none', border: 'none',
                                            color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem',
                                        }}
                                    >
                                        Remove file
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☁️</div>
                                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                                        Drag & drop your file here
                                    </div>
                                    <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                        or click to browse
                                    </div>
                                    <div style={{ color: '#d1d5db', fontSize: '0.75rem' }}>
                                        PDF, DOCX, DOC, JPG, PNG · Max 10 MB
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Form fields */}
                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Field label="Document Title *">
                                <input
                                    type="text" value={title} required
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a clear, descriptive title"
                                    style={inputStyle}
                                />
                            </Field>

                            <Field label="Category *">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat} type="button"
                                            onClick={() => setCategory(cat)}
                                            style={{
                                                padding: '0.6rem',
                                                border: `2px solid ${category === cat ? '#10b981' : '#e5e7eb'}`,
                                                borderRadius: '8px',
                                                background: category === cat ? '#ecfdf5' : 'white',
                                                color: category === cat ? '#059669' : '#374151',
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                fontWeight: category === cat ? 600 : 400,
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <Field label="Tags (optional)" hint="Separate with commas">
                                <input
                                    type="text" value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    placeholder="e.g. math, algebra, grade-10"
                                    style={inputStyle}
                                />
                                {tagsInput && (
                                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                        {tagsInput.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                                            <span key={tag} style={{
                                                background: '#eff6ff', color: '#3b82f6',
                                                padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                                            }}>#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </Field>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '0.85rem',
                                    background: loading ? '#9ca3af' : '#10b981',
                                    color: 'white', border: 'none',
                                    borderRadius: '8px', fontSize: '0.95rem',
                                    fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                    marginTop: '0.5rem', transition: 'background 0.15s',
                                }}
                            >
                                {loading ? '⏳ Uploading & Encrypting…' : '⬆️ Submit for Approval'}
                            </button>

                            <p style={{ margin: 0, textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
                                🔒 Your document is encrypted with AES-256 before storage
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </Layout>
    );
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{label}</label>
            {hint && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{hint}</span>}
        </div>
        {children}
    </div>
);

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.75rem',
    border: '1px solid #e5e7eb', borderRadius: '8px',
    fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none',
    background: 'white',
};

export default DocumentUpload;
