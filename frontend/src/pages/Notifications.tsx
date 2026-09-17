import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import {
    Bell,
    CheckCheck,
    Clock,
    Check,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface NotificationItem {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface Meta { current_page: number; last_page: number; total: number; }

const Notifications: React.FC = () => {
    const { success, error: toastError } = useToast();

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [markingAll, setMarkingAll] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications', { params: { page } });
            setNotifications(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        load();
    }, [load]);

    const markOne = async (n: NotificationItem) => {
        if (n.is_read) return;
        try {
            await api.put(`/notifications/${n.id}/read`);
            setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
        } catch { /* silent */ }
    };

    const markAll = async () => {
        setMarkingAll(true);
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
            success('All notifications marked as read.');
        } catch {
            toastError('Failed to mark all as read.');
        } finally {
            setMarkingAll(false);
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;
    const displayedItems = filter === 'unread'
        ? notifications.filter((n) => !n.is_read)
        : notifications;

    return (
        <Layout
            title="Notifications"
            subtitle="Updates regarding document reviews, submission reminders, and security alerts"
            actions={
                unreadCount > 0 ? (
                    <button
                        className="btn btn-secondary"
                        disabled={markingAll}
                        onClick={markAll}
                    >
                        <CheckCheck size={16} /> Mark All as Read
                    </button>
                ) : undefined
            }
        >
            {/* Filter segmented tabs */}
            <div className="tab-group">
                <button
                    className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    <Bell size={14} /> All ({meta?.total ?? 0})
                </button>
                <button
                    className={`tab-btn ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Unread Only
                    {unreadCount > 0 && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem', marginLeft: '0.2rem' }}>
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="panel">
                {loading ? (
                    <div style={{ padding: '1.5rem' }}>
                        <SkeletonTable rows={5} columns={2} />
                    </div>
                ) : displayedItems.length === 0 ? (
                    <EmptyState
                        icon={<Bell size={42} className="text-slate-400" />}
                        title="No notifications to show"
                        description={filter === 'unread' ? 'All notifications have been marked as read.' : 'You have no notifications in your history.'}
                    />
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {displayedItems.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => markOne(n)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1.1rem 1.5rem',
                                        borderBottom: '1px solid var(--border)',
                                        background: n.is_read ? '#ffffff' : 'var(--primary-soft)',
                                        cursor: n.is_read ? 'default' : 'pointer',
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: n.is_read ? 'var(--surface-alt)' : 'var(--primary)',
                                            color: n.is_read ? 'var(--text-muted)' : '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            marginTop: '0.1rem',
                                        }}>
                                            <Bell size={17} />
                                        </div>
                                        <div>
                                            <div style={{
                                                fontSize: '0.88rem',
                                                color: 'var(--text)',
                                                fontWeight: n.is_read ? 400 : 600,
                                                marginBottom: '0.3rem',
                                                lineHeight: 1.4,
                                            }}>
                                                {n.message}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                fontSize: '0.74rem',
                                                color: 'var(--text-muted)',
                                            }}>
                                                <Clock size={12} />
                                                <span>{new Date(n.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {!n.is_read && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markOne(n);
                                            }}
                                            title="Mark as read"
                                        >
                                            <Check size={13} /> Mark read
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {meta && meta.last_page > 1 && (
                            <div className="pagination">
                                <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                                <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /></button>
                                <span className="page-info">Page <strong>{meta.current_page}</strong> of <strong>{meta.last_page}</strong></span>
                                <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}><ChevronRight size={14} /></button>
                                <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage(meta.last_page)}>»</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default Notifications;
