import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
    uploaded_by: {
        id: number;
        name: string;
    };
    created_at: string;
}

const DocumentList: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');
    const [searchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const status = searchParams.get('status');
        if (status) setStatusFilter(status);
        loadDocuments();
    }, [searchParams, statusFilter]);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            const response = await api.get('/documents', { params });
            setDocuments(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id: number) => {
        try {
            const response = await api.get(`/documents/${id}/download`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const doc = documents.find(d => d.id === id);
            if (doc) {
                link.setAttribute('download', doc.file_name);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Download failed');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await api.post(`/documents/${id}/approve`);
            loadDocuments();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Approval failed');
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt('Please enter a rejection reason:');
        if (!reason) return;
        try {
            await api.post(`/documents/${id}/reject`, { reason });
            loadDocuments();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Rejection failed');
        }
    };

    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(filter.toLowerCase()) ||
        (doc.tags?.some(tag => tag.toLowerCase().includes(filter.toLowerCase())))
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return '#27ae60';
            case 'Rejected': return '#e74c3c';
            case 'Pending': return '#f39c12';
            default: return '#333';
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
                background: user?.role === 'Admin' ? '#2c3e50' : '#27ae60',
                color: 'white',
                padding: '1rem 2rem',
                display: 'flex',
                alignItems: 'center',
            }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Documents</h1>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
                    {user?.role === 'Teacher' && (
                        <button
                            onClick={() => navigate('/upload')}
                            style={{
                                background: 'transparent',
                                border: '2px solid white',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Upload
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        style={{
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
                </div>
            </header>
            <main style={{ padding: '2rem' }}>
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                }}>
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '1rem',
                        }}
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '1rem',
                        }}
                    >
                        <option value="">All statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.2rem' }}>
                        Loading...
                    </div>
                ) : error ? (
                    <div style={{
                        background: '#fee',
                        color: '#c33',
                        padding: '1rem',
                        borderRadius: '4px',
                        textAlign: 'center',
                    }}>
                        {error}
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        fontSize: '1.2rem',
                        color: '#666',
                    }}>
                        No documents found
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gap: '1rem',
                    }}>
                        {filteredDocuments.map(doc => (
                            <div key={doc.id} style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{doc.title}</h3>
                                        <p style={{ margin: '0.25rem 0', color: '#666' }}>
                                            <strong>Uploaded by:</strong> {doc.uploaded_by.name}
                                        </p>
                                        <p style={{ margin: '0.25rem 0', color: '#666' }}>
                                            <strong>Category:</strong> {doc.category}
                                        </p>
                                        {doc.tags?.length && (
                                            <p style={{ margin: '0.25rem 0', color: '#666' }}>
                                                <strong>Tags:</strong> {doc.tags.join(', ')}
                                            </p>
                                        )}
                                        <p style={{ margin: '0.25rem 0', color: '#666' }}>
                                            <strong>File:</strong> {doc.file_name} ({(doc.file_size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                        {doc.rejection_reason && (
                                            <p style={{ margin: '0.5rem 0', color: '#e74c3c', fontStyle: 'italic' }}>
                                                <strong>Rejection reason:</strong> {doc.rejection_reason}
                                            </p>
                                        )}
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.875rem',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            background: getStatusColor(doc.status),
                                            marginTop: '0.5rem',
                                        }}>
                                            {doc.status}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                        {(doc.status === 'Approved' || user?.role === 'Admin') && (
                                            <button
                                                onClick={() => handleDownload(doc.id)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#3498db',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Download
                                            </button>
                                        )}
                                        {user?.role === 'Admin' && doc.status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(doc.id)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#27ae60',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(doc.id)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#e74c3c',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DocumentList;