import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import DocumentDetailsModal, { DocumentItem } from '../components/DocumentDetailsModal';

interface Meta { current_page: number; last_page: number; total: number; }

const statusBadge = (status: string) => {
    if (status === 'Approved') return 'badge-success';
    if (status === 'Rejected') return 'badge-danger';
    return 'badge-warning';
};

const DocumentRepository: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);

    const [searchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');

    const [selected, setSelected] = useState<DocumentItem | null>(null);

    const { user } = useAuth();
    const navigate = useNavigate();
    const isTeacher = user?.role === 'Teacher';

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params: any = { page };
            if (statusFilter) params.status = statusFilter;
            if (categoryFilter) params.category = categoryFilter;
            const res = await api.get('/documents', { params });
            setDocuments(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load documents');
        } finally { setLoading(false); }
    }, [page, statusFilter, categoryFilter]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const s = searchParams.get('status');
        if (s) setStatusFilter(s);
    }, []);

    const handleDownload = async (doc: DocumentItem, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', doc.file_name);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) { alert(err.response?.data?.message || 'Download failed'); }
    };

    return (
        <Layout
            title="Document Repository"
            subtitle={isTeacher ? 'Documents you have submitted' : 'All documents in the system'}
            actions={isTeacher ? <button className="btn btn-primary" onClick={() => navigate('/upload')}>+ Upload Document</button> : undefined}
        >
            <div className="filter-bar">
                <select className="form-control" style={{ maxWidth: '180px' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
                <select className="form-control" style={{ maxWidth: '180px' }} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
                    <option value="">All categories</option>
                    <option value="Lesson Plans">Lesson Plans</option>
                    <option value="Assessments">Assessments</option>
                    <option value="Reports">Reports</option>
                    <option value="Other">Other</option>
                </select>
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {meta?.total ?? 0} document{meta?.total !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="panel">
                {loading ? (
                    <div className="empty-state"><div className="icon">⏳</div>Loading documents…</div>
                ) : error ? (
                    <div className="notice notice-danger" style={{ margin: '1.25rem' }}>{error}</div>
                ) : documents.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">📁</div>
                        No documents found.
                        {isTeacher && <div style={{ marginTop: '0.75rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>Upload your first document</button>
                        </div>}
                    </div>
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Document Name</th>
                                        <th>Category</th>
                                        {!isTeacher && <th>Owner</th>}
                                        <th>Status</th>
                                        <th>Last Updated</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.map((doc) => (
                                        <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(doc)}>
                                            <td style={{ fontWeight: 600 }}>{doc.title}</td>
                                            <td>{doc.category}</td>
                                            {!isTeacher && <td>{doc.uploaded_by.name}</td>}
                                            <td><span className={`badge ${statusBadge(doc.status)}`}>{doc.status}</span></td>
                                            <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(doc.updated_at).toLocaleDateString()}
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <button className="row-action" onClick={() => setSelected(doc)}>View</button>
                                                {(doc.status === 'Approved' || !isTeacher) && (
                                                    <>
                                                        {' '}·{' '}
                                                        <button className="row-action" onClick={(e) => handleDownload(doc, e)}>Download</button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {meta && meta.last_page > 1 && (
                            <div className="pagination">
                                <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                                <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                                <span className="page-info">Page {meta.current_page} of {meta.last_page}</span>
                                <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>›</button>
                                <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage(meta.last_page)}>»</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selected && (
                <DocumentDetailsModal
                    document={selected}
                    onClose={() => setSelected(null)}
                    onChanged={load}
                />
            )}
        </Layout>
    );
};

export default DocumentRepository;
