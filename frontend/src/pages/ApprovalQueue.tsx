import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import DocumentDetailsModal, { DocumentItem } from '../components/DocumentDetailsModal';
import ConfirmModal from '../components/ConfirmModal';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { useToast } from '../contexts/ToastContext';
import {
    CheckSquare,
    CheckCircle2,
    XCircle,
    Eye,
    FileText,
    Clock,
    User,
    Layers,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface Meta { current_page: number; last_page: number; total: number; }

const ApprovalQueue: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const [selected, setSelected] = useState<DocumentItem | null>(null);

    // Confirmation & Action Modals
    const [approveTarget, setApproveTarget] = useState<DocumentItem | null>(null);
    const [approveLoading, setApproveLoading] = useState(false);

    const [rejectTarget, setRejectTarget] = useState<DocumentItem | null>(null);
    const [rejectLoading, setRejectLoading] = useState(false);

    const { success, error: toastError } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/documents', { params: { status: 'Pending', page } });
            setDocuments(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch {
            toastError('Failed to load pending queue');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        load();
    }, [load]);

    const handleApproveConfirm = async () => {
        if (!approveTarget) return;
        setApproveLoading(true);
        try {
            await api.post(`/documents/${approveTarget.id}/approve`);
            success(`Document "${approveTarget.title}" approved successfully.`);
            setApproveTarget(null);
            load();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to approve document.');
        } finally {
            setApproveLoading(false);
        }
    };

    const handleRejectConfirm = async (reason?: string) => {
        if (!rejectTarget || !reason?.trim()) return;
        setRejectLoading(true);
        try {
            await api.post(`/documents/${rejectTarget.id}/reject`, { reason: reason.trim() });
            success(`Document "${rejectTarget.title}" has been rejected.`);
            setRejectTarget(null);
            load();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to reject document.');
        } finally {
            setRejectLoading(false);
        }
    };

    return (
        <Layout
            title="Approval Queue"
            subtitle="Review, approve, or request revisions for submitted academic documents"
        >
            <div className="panel">
                <div className="panel-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
                        <strong>Pending Review Items</strong>
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                            {meta?.total ?? 0} awaiting
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '1.5rem' }}>
                        <SkeletonTable rows={5} columns={6} />
                    </div>
                ) : documents.length === 0 ? (
                    <EmptyState
                        icon={<CheckCircle2 size={46} style={{ color: 'var(--success)' }} />}
                        title="All caught up!"
                        description="There are no documents currently awaiting administrative review in the queue."
                    />
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Document Title</th>
                                        <th>Category</th>
                                        <th>Submitted By</th>
                                        <th>Department</th>
                                        <th>Submission Date</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.map((doc) => (
                                        <tr key={doc.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                    <span>{doc.title}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-neutral">{doc.category}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <User size={13} style={{ color: 'var(--text-muted)' }} />
                                                    <span>{doc.uploaded_by.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                                                    <Layers size={13} style={{ color: 'var(--text-muted)' }} />
                                                    <span>{doc.panitia?.name || '—'}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Clock size={13} />
                                                    {new Date(doc.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => setSelected(doc)}
                                                    >
                                                        <Eye size={13} /> Review
                                                    </button>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => setApproveTarget(doc)}
                                                    >
                                                        <CheckCircle2 size={13} /> Approve
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => setRejectTarget(doc)}
                                                    >
                                                        <XCircle size={13} /> Reject
                                                    </button>
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
                                    «
                                </button>
                                <button
                                    className="page-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="page-info">
                                    Page <strong>{meta.current_page}</strong> of <strong>{meta.last_page}</strong>
                                </span>
                                <button
                                    className="page-btn"
                                    disabled={page === meta.last_page}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    <ChevronRight size={14} />
                                </button>
                                <button
                                    className="page-btn"
                                    disabled={page === meta.last_page}
                                    onClick={() => setPage(meta.last_page)}
                                >
                                    »
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Document Details Modal */}
            {selected && (
                <DocumentDetailsModal
                    document={selected}
                    onClose={() => setSelected(null)}
                    onChanged={load}
                />
            )}

            {/* Approve Confirmation Modal */}
            <ConfirmModal
                isOpen={approveTarget !== null}
                title="Approve Document"
                message={`Are you sure you want to approve "${approveTarget?.title}"? It will become available to all authorized users in the repository.`}
                confirmText="Approve Document"
                onConfirm={handleApproveConfirm}
                onCancel={() => setApproveTarget(null)}
                loading={approveLoading}
            />

            {/* Reject Confirmation Modal with Input */}
            <ConfirmModal
                isOpen={rejectTarget !== null}
                title="Reject Document"
                message={`Please specify a reason for rejecting "${rejectTarget?.title}". The author will be notified to correct and resubmit.`}
                confirmText="Reject & Request Revision"
                isDanger={true}
                inputMode={true}
                inputLabel="Rejection Feedback & Instructions"
                inputPlaceholder="Explain what needs to be changed or corrected…"
                inputRequired={true}
                onConfirm={handleRejectConfirm}
                onCancel={() => setRejectTarget(null)}
                loading={rejectLoading}
            />
        </Layout>
    );
};

export default ApprovalQueue;
