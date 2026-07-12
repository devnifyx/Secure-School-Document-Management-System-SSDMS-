import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

interface NotificationItem {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface Meta { current_page: number; last_page: number; total: number; }

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [markingAll, setMarkingAll] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications', { params: { page } });
            setNotifications(res.data.data);
            setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { load(); }, [load]);

    const markOne = async (n: NotificationItem) => {
        if (n.is_read) return;
        await api.put(`/notifications/${n.id}/read`);
        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
    };

    const markAll = async () => {
        setMarkingAll(true);
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
        } finally { setMarkingAll(false); }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <Layout
            title="Notifications"
            subtitle={`${meta?.total ?? 0} total · ${unreadCount} unread`}
            actions={unreadCount > 0 ? <button className="btn btn-secondary" disabled={markingAll} onClick={markAll}>Mark All as Read</button> : undefined}
        >
            <div className="panel">
                {loading ? (
                    <div className="empty-state"><div className="icon">⏳</div>Loading notifications…</div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">✓</div>
                        No notifications yet.
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '32px' }}></th>
                                    <th>Message</th>
                                    <th>Received</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map((n) => (
                                    <tr key={n.id} onClick={() => markOne(n)} style={{ cursor: n.is_read ? 'default' : 'pointer', background: n.is_read ? undefined : '#F5F9FD' }}>
                                        <td>
                                            <span style={{
                                                display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                                                background: n.is_read ? 'var(--border-strong)' : 'var(--info)',
                                            }} />
                                        </td>
                                        <td style={{ fontWeight: n.is_read ? 400 : 600, color: n.is_read ? 'var(--text-secondary)' : 'var(--text)' }}>
                                            {n.message}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {new Date(n.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {meta && meta.last_page > 1 && (
                    <div className="pagination">
                        <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                        <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                        <span className="page-info">Page {meta.current_page} of {meta.last_page}</span>
                        <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>›</button>
                        <button className="page-btn" disabled={page === meta.last_page} onClick={() => setPage(meta.last_page)}>»</button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Notifications;
