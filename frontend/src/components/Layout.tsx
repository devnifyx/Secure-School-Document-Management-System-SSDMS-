import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface NotificationItem {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, actions }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = user?.role === 'Admin';

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
            if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            const items: NotificationItem[] = res.data.data;
            setNotifications(items.slice(0, 8));
            setUnreadCount(items.filter((n) => !n.is_read).length);
        } catch { /* silent */ }
    };

    const markAllRead = async () => {
        await api.post('/notifications/mark-all-read');
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const markOneRead = async (id: number) => {
        await api.put(`/notifications/${id}/read`);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
    };

    const isActive = (path: string) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const navItems: Array<{ label: string; path: string; icon: string }> = isAdmin
        ? [
            { label: 'Dashboard', path: '/', icon: '▤' },
            { label: 'Repository', path: '/documents', icon: '🗀' },
            { label: 'Search', path: '/search', icon: '⌕' },
            { label: 'Approval Queue', path: '/approvals', icon: '☰' },
            { label: 'User Management', path: '/users', icon: '⚇' },
            { label: 'Audit Logs', path: '/audit-logs', icon: '↺' },
            { label: 'Notifications', path: '/notifications', icon: '◔' },
        ]
        : [
            { label: 'Dashboard', path: '/', icon: '▤' },
            { label: 'Repository', path: '/documents', icon: '🗀' },
            { label: 'Search', path: '/search', icon: '⌕' },
            { label: 'Notifications', path: '/notifications', icon: '◔' },
        ];

    return (
        <div className="app-shell">
            {/* Sidebar */}
            <nav className="sidebar">
                <div className="sidebar-brand" onClick={() => navigate('/')}>
                    <div className="card-icon">
                        <img
                            src="/SSDMSLogo.png"
                            alt="SSDMS Logo"
                            style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                borderRadius: "8px", // Rounded corners
                            }}
                            />
                    </div>
                    <div className="sidebar-brand-text">
                        <div className="name">SSDMS {isAdmin ? 'Admin' : ''}</div>
                        <div className="sub">Academic Document System</div>
                    </div>
                </div>

                {!isAdmin && (
                    <button className="sidebar-upload-btn" onClick={() => navigate('/upload')} title="Upload Document">
                        <span className="icon">⤒</span>
                        <span className="label">Upload Document</span>
                    </button>
                )}

                <div className="sidebar-nav">
                    {navItems.map((item) => (
                        <div
                            key={item.path}
                            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                            title={item.label}
                        >
                            <span className="icon">{item.icon}</span>
                            <span className="label">{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="sidebar-footer">
                    <div
                        className={`sidebar-link ${isActive('/settings') ? 'active' : ''}`}
                        onClick={() => navigate('/settings')}
                        title="Settings"
                    >
                        <span className="icon">⚙</span>
                        <span className="label">Settings</span>
                    </div>
                    <div className="sidebar-link" onClick={logout} title="Logout">
                        <span className="icon">⎋</span>
                        <span className="label">Logout</span>
                    </div>
                </div>
            </nav>

            {/* Topbar */}
            <header className="topbar">
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Notifications */}
                    <div ref={notifRef} style={{ position: 'relative' }}>
                        <button className="topbar-icon-btn" onClick={() => setShowNotifs((v) => !v)} title="Notifications">
                            🔔
                            {unreadCount > 0 && (
                                <span className="topbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </button>
                        {showNotifs && (
                            <div style={{
                                position: 'absolute', right: 0, top: '2.8rem', width: '340px',
                                background: '#fff', border: '1px solid var(--border)',
                                borderRadius: '12px', boxShadow: 'var(--shadow-md)',
                                maxHeight: '400px', overflowY: 'auto', zIndex: 200,
                            }}>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
                                }}>
                                    <strong style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Notifications</strong>
                                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                                        {unreadCount > 0 && (
                                            <button className="btn-link" onClick={markAllRead}>Mark all read</button>
                                        )}
                                        <button className="btn-link" onClick={() => { setShowNotifs(false); navigate('/notifications'); }}>View all</button>
                                    </div>
                                </div>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '1.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        No notifications
                                    </div>
                                ) : notifications.map((n) => (
                                    <div key={n.id} onClick={() => !n.is_read && markOneRead(n.id)} style={{
                                        padding: '0.7rem 1rem',
                                        borderBottom: '1px solid #F3F4F6',
                                        background: n.is_read ? '#fff' : 'var(--primary-soft)',
                                        cursor: n.is_read ? 'default' : 'pointer',
                                    }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{n.message}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                            {new Date(n.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* User dropdown */}
                    <div ref={userRef} style={{ position: 'relative' }}>
                        <div className="topbar-user" onClick={() => setShowUserMenu((v) => !v)}>
                            <div className="topbar-user-info" style={{ textAlign: 'right' }}>
                                <div className="name">{user?.name}</div>
                                <div className="role">{user?.email}</div>
                            </div>
                            <div className="topbar-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                        </div>
                        {showUserMenu && (
                            <div style={{
                                position: 'absolute', right: 0, top: '3rem', width: '200px',
                                background: '#fff', border: '1px solid var(--border)',
                                borderRadius: '12px', boxShadow: 'var(--shadow-md)',
                                zIndex: 200, overflow: 'hidden',
                            }}>
                                <button onClick={() => { setShowUserMenu(false); navigate('/settings'); }} style={dropdownItem}>
                                    ⚙ Account Settings
                                </button>
                                <button onClick={logout} style={{ ...dropdownItem, color: 'var(--danger)' }}>
                                    ⎋ Log Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="content">
                {(title || actions) && (
                    <div className="page-header">
                        <div>
                            {title && <div className="page-title">{title}</div>}
                            {subtitle && <div className="page-subtitle">{subtitle}</div>}
                        </div>
                        {actions && <div>{actions}</div>}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};

const dropdownItem: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '0.7rem 1rem', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text)',
};

export default Layout;
