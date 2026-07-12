import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import DocumentDetailsModal, { DocumentItem } from '../components/DocumentDetailsModal';

const statusBadge = (status: string) => {
    if (status === 'Approved') return 'badge-success';
    if (status === 'Rejected') return 'badge-danger';
    return 'badge-warning';
};

const SearchDocuments: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('');
    const [tag, setTag] = useState('');
    const [status, setStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [results, setResults] = useState<DocumentItem[]>([]);
    const [total, setTotal] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selected, setSelected] = useState<DocumentItem | null>(null);

    const { user } = useAuth();
    const isTeacher = user?.role === 'Teacher';

    const runSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true); setSearched(true);
        try {
            const params: any = {};
            if (keyword) params.search = keyword;
            if (category) params.category = category;
            if (tag) params.tag = tag;
            if (status) params.status = status;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const res = await api.get('/documents', { params });
            setResults(res.data.data);
            setTotal(res.data.total);
        } catch (e: any) {
            setResults([]); setTotal(0);
        } finally { setLoading(false); }
    };

    const clearFilters = () => {
        setKeyword(''); setCategory(''); setTag(''); setStatus(''); setDateFrom(''); setDateTo('');
        setResults([]); setTotal(null); setSearched(false);
    };

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
        <Layout title="Search Documents" subtitle="Find documents by keyword, category, tag, status, or date">
            <div className="panel" style={{ marginBottom: '1.25rem' }}>
                <div className="panel-body">
                    <form onSubmit={runSearch}>
                        <div className="search-input-group" style={{ maxWidth: 'none', marginBottom: '1rem' }}>
                            <input
                                className="form-control"
                                type="text"
                                placeholder="Search by title or description keyword…"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                            <button type="submit">Search</button>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="">Any category</option>
                                    <option value="Lesson Plans">Lesson Plans</option>
                                    <option value="Assessments">Assessments</option>
                                    <option value="Reports">Reports</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tag</label>
                                <input className="form-control" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. grade-10" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="">Any status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">From Date</label>
                                <input className="form-control" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">To Date</label>
                                <input className="form-control" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.1rem' }}>
                            <button type="submit" className="btn btn-primary">Apply Filters</button>
                            <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>
                        </div>
                    </form>
                </div>
            </div>

            {searched && (
                <div className="panel">
                    <div className="panel-header">
                        <h3>Search Results</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{total ?? 0} match{total !== 1 ? 'es' : ''}</span>
                    </div>
                    {loading ? (
                        <div className="empty-state"><div className="icon">⏳</div>Searching…</div>
                    ) : results.length === 0 ? (
                        <div className="empty-state"><div className="icon">⌕</div>No documents match your search criteria.</div>
                    ) : (
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Document Name</th>
                                        <th>Category</th>
                                        {!isTeacher && <th>Owner</th>}
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((doc) => (
                                        <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(doc)}>
                                            <td style={{ fontWeight: 600 }}>{doc.title}</td>
                                            <td>{doc.category}</td>
                                            {!isTeacher && <td>{doc.uploaded_by.name}</td>}
                                            <td><span className={`badge ${statusBadge(doc.status)}`}>{doc.status}</span></td>
                                            <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(doc.created_at).toLocaleDateString()}
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
                    )}
                </div>
            )}

            {selected && (
                <DocumentDetailsModal document={selected} onClose={() => setSelected(null)} onChanged={runSearch} />
            )}
        </Layout>
    );
};

export default SearchDocuments;
