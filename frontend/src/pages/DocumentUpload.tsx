import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/Layout';
import FileDropzone from '../components/FileDropzone';
import CustomSelect from '../components/CustomSelect';
import { ShieldCheck, UploadCloud, ArrowLeft, Tag, X } from 'lucide-react';

const DocumentUpload: React.FC = () => {
    const { activePanitia, panitiaList } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [panitiaId, setPanitiaId] = useState<string>(String(activePanitia?.id || ''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddTag = () => {
        const trimmed = tagInput.trim().replace(/^,+|,+$/g, '');
        if (trimmed && !tags.includes(trimmed)) {
            setTags((prev) => [...prev, trimmed]);
            setTagInput('');
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const removeTag = (t: string) => {
        setTags((prev) => prev.filter((item) => item !== t));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!file) {
            setError('Please attach a document file.');
            return;
        }
        if (!category) {
            setError('Please select a category.');
            return;
        }
        if (!panitiaId) {
            setError('Please select a department (Panitia).');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('file', file);
            formData.append('category', category);
            formData.append('panitia_id', panitiaId);
            tags.forEach((tag, i) => formData.append(`tags[${i}]`, tag));

            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            success('Document submitted successfully for administrator approval.');
            navigate('/documents');
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors;
            const errorString = typeof msg === 'string' ? msg : 'Upload failed. Please check form inputs.';
            setError(errorString);
            toastError(errorString);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout
            title="Upload Document"
            subtitle="Submit academic lesson plans, assessments, or departmental records for administrative review"
        >
            <div style={{ maxWidth: '720px' }}>
                <div className="panel">
                    <div className="panel-body" style={{ padding: '2rem' }}>
                        {error && (
                            <div className="notice notice-danger" style={{ marginBottom: '1.5rem' }}>
                                <span>⚠</span>
                                <div>{error}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Document Title */}
                            <div className="form-group">
                                <label className="form-label">
                                    Document Title <span style={{ color: 'var(--danger)' }}>*</span>
                                </label>
                                <input
                                    className="form-control"
                                    type="text"
                                    value={title}
                                    required
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Grade 10 Mathematics Lesson Plan — Semester 1"
                                    autoFocus
                                />
                            </div>

                            {/* Category & Panitia */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Category <span style={{ color: 'var(--danger)' }}>*</span>
                                    </label>
                                    <CustomSelect
                                        options={[
                                            { value: 'Lesson Plans', label: 'Lesson Plans', sublabel: 'Syllabi, teaching plans, guides' },
                                            { value: 'Assessments', label: 'Assessments', sublabel: 'Exams, tests, rubrics & quizzes' },
                                            { value: 'Reports', label: 'Reports', sublabel: 'Student progress & department reports' },
                                            { value: 'Other', label: 'Other', sublabel: 'General school administration files' },
                                        ]}
                                        value={category}
                                        onChange={(val) => setCategory(val)}
                                        placeholder="Select Category…"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Subject Department (Panitia) <span style={{ color: 'var(--danger)' }}>*</span>
                                    </label>
                                    {panitiaList.length <= 1 ? (
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="form-control"
                                                value={activePanitia?.name || 'Assigned Department'}
                                                disabled
                                            />
                                        </div>
                                    ) : (
                                        <CustomSelect
                                            options={panitiaList.map((p) => ({
                                                value: String(p.id),
                                                label: p.name,
                                                sublabel: p.pivot?.is_primary ? 'Primary Department' : undefined,
                                            }))}
                                            value={panitiaId}
                                            onChange={(val) => setPanitiaId(val)}
                                            placeholder="Select Department…"
                                            searchable={panitiaList.length > 4}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* File Upload Dropzone */}
                            <div className="form-group">
                                <FileDropzone
                                    label="Attach File Document *"
                                    hint="PDF, DOCX, DOC, JPG, PNG (Maximum 10 MB)"
                                    file={file}
                                    onFileSelect={setFile}
                                    maxSizeMB={10}
                                />
                            </div>

                            {/* Tags Input */}
                            <div className="form-group">
                                <label className="form-label">
                                    Keywords & Tags <span className="form-hint">(Press Enter or comma to add tags)</span>
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="e.g. algebra, term-1, quiz"
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleAddTag}
                                        disabled={!tagInput.trim()}
                                    >
                                        Add
                                    </button>
                                </div>
                                {tags.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {tags.map((t) => (
                                            <span
                                                key={t}
                                                className="badge badge-neutral"
                                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.4rem' }}
                                            >
                                                <Tag size={12} /> {t}
                                                <X
                                                    size={13}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => removeTag(t)}
                                                />
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label className="form-label">
                                    Description & Context <span className="form-hint">(optional)</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide context, curriculum standards addressed, or instructions for reviewers…"
                                    rows={3}
                                />
                            </div>

                            {/* Security Notice */}
                            <div className="notice notice-info" style={{ margin: '1.5rem 0' }}>
                                <ShieldCheck size={22} style={{ flexShrink: 0, marginTop: '0.1rem', color: 'var(--primary)' }} />
                                <div>
                                    <strong>End-to-End Cryptographic Security:</strong> All submitted documents are immediately encrypted using <strong>AES-256</strong> cipher before storage. A SHA-256 cryptographic checksum is recorded for tamper-detection integrity verification.
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                    style={{ padding: '0.7rem 1.4rem' }}
                                >
                                    <UploadCloud size={17} />
                                    {loading ? 'Encrypting & Uploading…' : 'Submit for Review'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/documents')}
                                >
                                    <ArrowLeft size={16} /> Cancel
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
