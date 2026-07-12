import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const DocumentUpload: React.FC = () => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('file', file);
            formData.append('category', category);
            if (tagsInput) {
                const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
                tagsArray.forEach((tag, index) => {
                    formData.append(`tags[${index}]`, tag);
                });
            }
            await api.post('/documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            navigate('/documents');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            background: '#f5f7fa',
        }}>
            <header style={{
                background: '#27ae60',
                color: 'white',
                padding: '1rem 2rem',
                display: 'flex',
                alignItems: 'center',
            }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Upload Document</h1>
                <button
                    onClick={() => navigate('/')}
                    style={{
                    marginLeft: 'auto',
                    background: 'transparent',
                    border: '2px solid white',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }}
                >
                    Back
                </button>
            </header>
            <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}>
                    {error && (
                        <div style={{
                            background: '#fee',
                            color: '#c33',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                        }}>
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>File</label>
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                }}
                            >
                                <option value="">Select category</option>
                                <option value="Lesson Plans">Lesson Plans</option>
                                <option value="Assessments">Assessments</option>
                                <option value="Reports">Reports</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                placeholder="e.g., math, algebra, 2024"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default DocumentUpload;