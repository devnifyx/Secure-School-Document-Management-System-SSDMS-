import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [markingAll, setMarkingAll] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications', { params: { page } });
            setNotifications(res.data.data);
            setMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { load(); }, [load]);

    const markOne = async (n: Notification) => {
        if (n.is_read) return;
        await api.put(`/notifications/${n.id}/read`);
        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
    };

    const markAll = async () => {
        setMarkingAll(true);
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
        } finally {
            setMarkingAll(false);
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <Layout title="Notifications">
            <div style={{ maxWidth: '720px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                        {meta?.total ?? 0} total &nbsp;·&nbsp;
                        <span style={{ color: unreadCount > 0 ? '#f59e0b' : '#9ca3af', fontWeight: 600 }}>
                            {unreadCount} unread
                        </span>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAll}
                            disabled={markingAll}
                            style={{
                                background: 'none', border: '1px solid #e5e7eb',
                                borderRadius: '8px', padding: '0.45rem 0.9rem',
                                cursor: markingAll ? 'not-allowed' : 'pointer',
                                fontSize: '0.8rem', color: '#374151',
                                opacity: markingAll ? 0.6 : 1,
                            }}
                        >
                            ✓ Mark all as read
                        </button>
                    )}
                </div>

                <div style={{
                    background: 'white', borderRadius: '12px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
                }}>
                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
                            Loading notifications…
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                            <div style={{ fontWeight: 500 }}>You're all caught up!</div>
                            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>No notifications yet.</div>
                        </div>
                    ) : (
                        notifications.map((n, idx) => (
                            <div
                                key={n.id}
                                onClick={() => markOne(n)}
                                style={{
                                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                                    padding: '1rem 1.25rem',
                                    background: n.is_read ? 'white' : '#fffbeb',
                                    borderBottom: idx < notifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    cursor: n.is_read ? 'default' : 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!n.is_read) (e.currentTarget as HTMLDivElement).style.background = '#fef3c7';
                                }}
                                onMouseLeave={(e) => {
                                    if (!n.is_read) (e.currentTarget as HTMLDivElement).style.background = '#fffbeb';
                                }}
                            >
                                {/* Unread dot */}
                                <div style={{ paddingTop: '4px', flexShrink: 0 }}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: n.is_read ? '#e5e7eb' : '#f59e0b',
                                        marginTop: '2px',
                                    }} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: n.is_read ? '#6b7280' : '#1f2937',
                                        fontWeight: n.is_read ? 400 : 500,
                                        marginBottom: '0.3rem',
                                        lineHeight: 1.5,
                                    }}>
                                        {n.message}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                        {new Date(n.created_at).toLocaleString()}
                                    </div>
                                </div>

                                {!n.is_read && (
                                    <span style={{
                                        fontSize: '0.7rem', color: '#f59e0b',
                                        background: '#fffbeb', border: '1px solid #fde68a',
                                        borderRadius: '20px', padding: '0.15rem 0.5rem',
                                        fontWeight: 600, flexShrink: 0, alignSelf: 'center',
                                    }}>
                                        NEW
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div style={{
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        gap: '0.5rem', marginTop: '1.25rem',
                    }}>
                        <PBtn disabled={page === 1} onClick={() => setPage(1)}>«</PBtn>
                        <PBtn disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</PBtn>
                        <span style={{ padding: '0 0.75rem', color: '#555', fontSize: '0.875rem' }}>
                            Page {meta.current_page} of {meta.last_page}
                        </span>
                        <PBtn disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>›</PBtn>
                        <PBtn disabled={page === meta.last_page} onClick={() => setPage(meta.last_page)}>»</PBtn>
                    </div>
                )}
            </div>
        </Layout>
    );
};

const PBtn: React.FC<{ disabled: boolean; onClick: () => void; children: React.ReactNode }> = ({ disabled, onClick, children }) => (
    <button disabled={disabled} onClick={onClick} style={{
        background: disabled ? '#f9fafb' : 'white',
        border: '1px solid #e5e7eb', borderRadius: '6px',
        padding: '0.4rem 0.75rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#d1d5db' : '#374151',
        fontSize: '0.875rem',
    }}>{children}</button>
);

export default Notifications;
