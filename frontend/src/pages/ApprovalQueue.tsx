import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import DocumentDetailsModal, { DocumentItem } from '../components/DocumentDetailsModal';

interface Meta { current_page: number; last_page: number; total: number; }

const ApprovalQueue: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const [selected, setSelected] = useState<DocumentItem | null>(null);
    const [rejectTarget, setRejectTarget] = useState<DocumentItem | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);
    const [approvingId, setApprovingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/documents', { params: { status: 'Pending', page } });
            setDocuments(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { load(); }, [load]);

    const handleApprove = async (id: number) => {
        if (!confirm('Approve this document?')) return;
        setApprovingId(id);
        try { await api.post(`/documents/${id}/approve`); load(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed to approve'); }
        finally { setApprovingId(null); }
    };

    const submitReject = async () => {
        if (!rejectTarget || !rejectReason.trim()) return;
        setRejectLoading(true);
        try {
            await api.post(`/documents/${rejectTarget.id}/reject`, { reason: rejectReason.trim() });
            setRejectTarget(null); setRejectReason('');
            load();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to reject');
        } finally { setRejectLoading(false); }
    };

    return (
        <Layout title="Approval Queue" subtitle="Documents awaiting administrative review">
            <div className="panel">
                {loading ? (
                    <div className="empty-state"><div className="icon">⏳</div>Loading queue…</div>
                ) : documents.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">✓</div>
                        No documents are currently pending approval.
                    </div>
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Document Name</th>
                                        <th>Category</th>
                                        <th>Uploaded By</th>
                                        <th>Submission Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.map((doc) => (
                                        <tr key={doc.id}>
                                            <td style={{ fontWeight: 600 }}>{doc.title}</td>
                                            <td>{doc.category}</td>
                                            <td>{doc.uploaded_by.name}</td>
                                            <td>{new Date(doc.created_at).toLocaleString()}</td>
                                            <td><span className="badge badge-warning">Pending</span></td>
                                            <td>
                                                <button className="row-action" onClick={() => setSelected(doc)}>View</button>
                                                {' '}·{' '}
                                                <button
                                                    className="row-action"
                                                    style={{ color: 'var(--success)' }}
                                                    disabled={approvingId === doc.id}
                                                    onClick={() => handleApprove(doc.id)}
                                                >
                                                    {approvingId === doc.id ? 'Approving…' : 'Approve'}
                                                </button>
                                                {' '}·{' '}
                                                <button className="row-action danger" onClick={() => { setRejectTarget(doc); setRejectReason(''); }}>
                                                    Reject
                                                </button>
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
                <DocumentDetailsModal document={selected} onClose={() => setSelected(null)} onChanged={load} />
            )}

            {/* Reject reason modal */}
            {rejectTarget && (
                <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
                    <div className="modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Reject Document</h3>
                            <button className="modal-close" onClick={() => setRejectTarget(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Rejecting <strong>{rejectTarget.title}</strong>. A reason is required and will be visible to the submitter.
                            </p>
                            <div className="form-group">
                                <label className="form-label">Rejection Reason <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <textarea
                                    className="form-control" rows={4} value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Explain what needs to be corrected…"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={submitReject} disabled={rejectLoading || !rejectReason.trim()}>
                                {rejectLoading ? 'Rejecting…' : 'Reject Document'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ApprovalQueue;
