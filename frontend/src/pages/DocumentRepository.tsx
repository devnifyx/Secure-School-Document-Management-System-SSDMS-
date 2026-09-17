import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import DocumentDetailsModal, { DocumentItem } from '../components/DocumentDetailsModal';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import {
    FileText,
    UploadCloud,
    Download,
    Eye,
    LayoutGrid,
    List,
    RotateCcw,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Tag,
} from 'lucide-react';

interface Meta { current_page: number; last_page: number; total: number; }

const statusBadge = (status: string) => {
    if (status === 'Approved') return <span className="badge badge-success"><CheckCircle2 size={11} /> Approved</span>;
    if (status === 'Rejected') return <span className="badge badge-danger"><XCircle size={11} /> Rejected</span>;
    return <span className="badge badge-warning"><Clock size={11} /> Pending</span>;
};

const DocumentRepository: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const [searchParams, setSearchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
    const [searchQuery, setSearchQuery] = useState('');

    const [selected, setSelected] = useState<DocumentItem | null>(null);

    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const isTeacher = user?.role === 'Teacher';

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = { page };
            if (statusFilter) params.status = statusFilter;
            if (categoryFilter) params.category = categoryFilter;
            if (searchQuery) params.search = searchQuery;
            const res = await api.get('/documents', { params });
            setDocuments(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, categoryFilter, searchQuery]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const s = searchParams.get('status');
        if (s) setStatusFilter(s);
    }, [searchParams]);

    const handleResetFilters = () => {
        setStatusFilter('');
        setCategoryFilter('');
        setSearchQuery('');
        setPage(1);
        setSearchParams({});
    };

    const handleDownload = async (doc: DocumentItem, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.file_name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            success(`Downloaded "${doc.file_name}"`);
        } catch (err: any) {
            toastError(err.response?.data?.message || 'Download failed');
        }
    };

    return (
        <Layout
            title="Document Repository"
            subtitle={isTeacher ? 'Your submitted academic documents and verification records' : 'All institution documents across departments'}
            actions={
                isTeacher ? (
                    <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                        <UploadCloud size={16} /> Upload Document
                    </button>
                ) : undefined
            }
        >
            {/* Filter & Toolbar */}
            <div className="filter-bar">
                <input
                    className="form-control"
                    type="text"
                    placeholder="Filter by title…"
                    style={{ maxWidth: '240px' }}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                    }}
                />

                <select
                    className="form-control"
                    style={{ maxWidth: '170px' }}
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Review Statuses</option>
                    <option value="Pending">Pending Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>

                <select
                    className="form-control"
                    style={{ maxWidth: '170px' }}
                    value={categoryFilter}
                    onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Categories</option>
                    <option value="Lesson Plans">Lesson Plans</option>
                    <option value="Assessments">Assessments</option>
                    <option value="Reports">Reports</option>
                    <option value="Other">Other</option>
                </select>

                {(statusFilter || categoryFilter || searchQuery) && (
                    <button className="btn btn-secondary btn-sm" onClick={handleResetFilters} title="Reset filters">
                        <RotateCcw size={13} /> Reset
                    </button>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <strong>{meta?.total ?? 0}</strong> {meta?.total === 1 ? 'document' : 'documents'}
                    </span>

                    {/* View Switcher Toggle */}
                    <div className="tab-group" style={{ margin: 0 }}>
                        <button
                            type="button"
                            className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                            title="Table View"
                        >
                            <List size={15} />
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Card Grid View"
                        >
                            <LayoutGrid size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="panel" style={{ padding: '1.5rem' }}>
                    <SkeletonTable rows={6} columns={6} />
                </div>
            ) : error ? (
                <div className="notice notice-danger">{error}</div>
            ) : documents.length === 0 ? (
                <div className="panel">
                    <EmptyState
                        icon={<FileText size={42} className="text-slate-400" />}
                        title="No documents found"
                        description={
                            statusFilter || categoryFilter || searchQuery
                                ? 'No documents matched your current search filters. Try clearing filters.'
                                : "You haven't uploaded any documents yet."
                        }
                        actionText={isTeacher ? 'Upload New Document' : undefined}
                        onAction={isTeacher ? () => navigate('/upload') : undefined}
                        secondaryActionText={statusFilter || categoryFilter || searchQuery ? 'Clear Filters' : undefined}
                        onSecondaryAction={handleResetFilters}
                    />
                </div>
            ) : viewMode === 'table' ? (
                <div className="panel">
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Document Title</th>
                                    <th>Category</th>
                                    {!isTeacher && <th>Author</th>}
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Last Updated</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => (
                                    <tr
                                        key={doc.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelected(doc)}
                                    >
                                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                <span>{doc.title}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-neutral">{doc.category}</span>
                                        </td>
                                        {!isTeacher && <td>{doc.uploaded_by.name}</td>}
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {doc.panitia?.name || '—'}
                                        </td>
                                        <td>{statusBadge(doc.status)}</td>
                                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                            {new Date(doc.updated_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setSelected(doc)}
                                                    title="View Details"
                                                >
                                                    <Eye size={13} /> View
                                                </button>
                                                {(doc.status === 'Approved' || !isTeacher) && (
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={(e) => handleDownload(doc, e)}
                                                        title="Download File"
                                                    >
                                                        <Download size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div className="pagination">
                            <button
                                className="page-btn"
                                disabled={page === 1}
                                onClick={() => setPage(1)}
                            >
                                « First
                            </button>
                            <button
                                className="page-btn"
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <span className="page-info">
                                Page <strong>{meta.current_page}</strong> of <strong>{meta.last_page}</strong>
                            </span>
                            <button
                                className="page-btn"
                                disabled={page === meta.last_page}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next <ChevronRight size={14} />
                            </button>
                            <button
                                className="page-btn"
                                disabled={page === meta.last_page}
                                onClick={() => setPage(meta.last_page)}
                            >
                                Last »
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* Grid Card View */
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                        gap: '1.25rem',
                        marginBottom: '1.5rem',
                    }}>
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="panel"
                                style={{
                                    cursor: 'pointer',
                                    transition: 'var(--transition)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                                onClick={() => setSelected(doc)}
                            >
                                <div className="panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <span className="badge badge-neutral">{doc.category}</span>
                                        {statusBadge(doc.status)}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text)', lineHeight: 1.3 }}>
                                        {doc.title}
                                    </div>
                                    {doc.description && (
                                        <p style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            lineHeight: 1.4,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {doc.description}
                                        </p>
                                    )}

                                    {doc.tags && doc.tags.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: 'auto' }}>
                                            {doc.tags.slice(0, 3).map((t) => (
                                                <span key={t} className="badge badge-neutral" style={{ fontSize: '0.66rem' }}>
                                                    <Tag size={10} /> {t}
                                                </span>
                                            ))}
                                            {doc.tags.length > 3 && (
                                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                    +{doc.tags.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div style={{
                                    padding: '0.75rem 1.25rem',
                                    borderTop: '1px solid var(--border)',
                                    background: 'var(--surface-alt)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.74rem',
                                    color: 'var(--text-muted)',
                                }}>
                                    <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                                    <div style={{ display: 'flex', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setSelected(doc)}>
                                            <Eye size={12} /> View
                                        </button>
                                        {(doc.status === 'Approved' || !isTeacher) && (
                                            <button className="btn btn-secondary btn-sm" onClick={(e) => handleDownload(doc, e)}>
                                                <Download size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {meta && meta.last_page > 1 && (
                        <div className="pagination">
                            <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>« First</button>
                            <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /> Prev</button>
                            <span className="page-info">Page {meta.current_page} of {meta.last_page}</span>
                            <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight size={14} /></button>
                            <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage(meta.last_page)}>Last »</button>
                        </div>
                    )}
                </>
            )}

            {/* Document Details Modal */}
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
