import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import Layout from '../components/Layout';
import DocumentDetailsModal, { DocumentItem } from '../components/DocumentDetailsModal';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import {
    Search,
    Filter,
    RotateCcw,
    FileText,
    Download,
    Eye,
    CheckCircle2,
    Clock,
    XCircle,
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const CATEGORY_OPTIONS = [
    { value: '', label: 'All Categories' },
    { value: 'Lesson Plans', label: 'Lesson Plans', icon: <FileText size={14} /> },
    { value: 'Assessments', label: 'Assessments' },
    { value: 'Reports', label: 'Reports', icon: <FileText size={14} /> },
    { value: 'Other', label: 'Other' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending Review', icon: <Clock size={14} /> },
    { value: 'Approved', label: 'Approved', icon: <CheckCircle2 size={14} /> },
    { value: 'Rejected', label: 'Rejected', icon: <XCircle size={14} /> },
];

const statusBadge = (status: string) => {
    if (status === 'Approved') return <span className="badge badge-success"><CheckCircle2 size={11} /> Approved</span>;
    if (status === 'Rejected') return <span className="badge badge-danger"><XCircle size={11} /> Rejected</span>;
    return <span className="badge badge-warning"><Clock size={11} /> Pending</span>;
};

const SearchDocuments: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('');
    const [tag, setTag] = useState('');
    const [status, setStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [results, setResults] = useState<DocumentItem[]>([]);
    const [total, setTotal] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selected, setSelected] = useState<DocumentItem | null>(null);

    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const isTeacher = user?.role === 'Teacher';

    const runSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        setSearched(true);
        try {
            const params: any = {};
            if (keyword.trim()) params.search = keyword.trim();
            if (category) params.category = category;
            if (tag.trim()) params.tag = tag.trim();
            if (status) params.status = status;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const res = await api.get('/documents', { params });
            setResults(res.data.data);
            setTotal(res.data.total);
        } catch {
            setResults([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setKeyword('');
        setCategory('');
        setTag('');
        setStatus('');
        setDateFrom('');
        setDateTo('');
        setResults([]);
        setTotal(null);
        setSearched(false);
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

    const activeFilterCount = [category, tag, status, dateFrom, dateTo].filter(Boolean).length;

    return (
        <Layout
            title="Search Documents"
            subtitle="Deep search repository files by keyword, curriculum category, tag, or date"
        >
            {/* Search Hero Card */}
            <div className="panel" style={{ marginBottom: '1.75rem' }}>
                <div className="panel-body">
                    <form onSubmit={runSearch}>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <div className="search-input-group" style={{ maxWidth: 'none', flex: '1 1 320px' }}>
                                <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Search by title, curriculum description, or file name…"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit">
                                    <Search size={16} /> Search
                                </button>
                            </div>

                            <button
                                type="button"
                                className={`btn ${showAdvanced || activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setShowAdvanced((v) => !v)}
                            >
                                <Filter size={15} />
                                <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
                            </button>

                            {(searched || activeFilterCount > 0 || keyword) && (
                                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                                    <RotateCcw size={15} /> Clear
                                </button>
                            )}
                        </div>

                        {/* Collapsible Advanced Filters */}
                        {showAdvanced && (
                            <div style={{
                                marginTop: '1.25rem',
                                paddingTop: '1.25rem',
                                borderTop: '1px solid var(--border)',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                            }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Category</label>
                                    <CustomSelect
                                        options={CATEGORY_OPTIONS}
                                        value={category}
                                        onChange={(val) => setCategory(val)}
                                        placeholder="All Categories"
                                        clearable={true}
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Review Status</label>
                                    <CustomSelect
                                        options={STATUS_OPTIONS}
                                        value={status}
                                        onChange={(val) => setStatus(val)}
                                        placeholder="All Statuses"
                                        clearable={true}
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Tag / Keyword</label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={tag}
                                        placeholder="e.g. algebra"
                                        onChange={(e) => setTag(e.target.value)}
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Date From</label>
                                    <input
                                        className="form-control"
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Date To</label>
                                    <input
                                        className="form-control"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Results Section */}
            {loading ? (
                <div className="panel" style={{ padding: '1.5rem' }}>
                    <SkeletonTable rows={5} columns={5} />
                </div>
            ) : !searched ? (
                <div className="panel">
                    <EmptyState
                        icon={<Search size={42} className="text-slate-400" />}
                        title="Find any academic document"
                        description="Enter a keyword or choose categories above and click Search to look up repository documents."
                    />
                </div>
            ) : results.length === 0 ? (
                <div className="panel">
                    <EmptyState
                        icon={<Search size={42} className="text-slate-400" />}
                        title="No matching documents found"
                        description="No documents matched your search query. Try broadening your keywords or removing filters."
                        secondaryActionText="Reset Search"
                        onSecondaryAction={clearFilters}
                    />
                </div>
            ) : (
                <div className="panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <FileText size={18} />
                            <strong>Search Results</strong>
                            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                {total} found
                            </span>
                        </div>
                    </div>

                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Document Title</th>
                                    <th>Category</th>
                                    {!isTeacher && <th>Author</th>}
                                    <th>Status</th>
                                    <th>Updated</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((doc) => (
                                    <tr
                                        key={doc.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelected(doc)}
                                    >
                                        <td style={{ fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                <span>{doc.title}</span>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-neutral">{doc.category}</span></td>
                                        {!isTeacher && <td>{doc.uploaded_by.name}</td>}
                                        <td>{statusBadge(doc.status)}</td>
                                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                            {new Date(doc.updated_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setSelected(doc)}
                                                >
                                                    <Eye size={13} /> View
                                                </button>
                                                {(doc.status === 'Approved' || !isTeacher) && (
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={(e) => handleDownload(doc, e)}
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
                </div>
            )}

            {/* Document Details Modal */}
            {selected && (
                <DocumentDetailsModal
                    document={selected}
                    onClose={() => setSelected(null)}
                    onChanged={runSearch}
                />
            )}
        </Layout>
    );
};

export default SearchDocuments;
