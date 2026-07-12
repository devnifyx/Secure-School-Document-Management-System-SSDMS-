import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.role === 'Admin';

    const navLinks = isAdmin
        ? [
            { label: 'Dashboard',   path: '/',            icon: '📊' },
            { label: 'Documents',   path: '/documents',   icon: '📁' },
            { label: 'Users',       path: '/users',       icon: '👥' },
            { label: 'Audit Logs',  path: '/audit-logs',  icon: '📋' },
        ]
        : [
            { label: 'Dashboard',    path: '/',             icon: '🏠' },
            { label: 'My Documents', path: '/documents',    icon: '📁' },
            { label: 'Upload',       path: '/upload',       icon: '⬆️' },
        ];

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            const items: Notification[] = res.data.data;
            setNotifications(items.slice(0, 15));
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

    return (
        <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column' }}>
            {/* Sidebar + content layout */}
            <div style={{ display: 'flex', minHeight: '100vh' }}>

                {/* Sidebar */}
                <aside style={{
                    width: '220px',
                    background: isAdmin
                        ? 'linear-gradient(180deg, #1a2332 0%, #2c3e50 100%)'
                        : 'linear-gradient(180deg, #1a6b3c 0%, #27ae60 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    zIndex: 50,
                    boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
                }}>
                    {/* Logo area */}
                    <div style={{
                        padding: '1.5rem 1.25rem',
                        borderBottom: 'rgba(255,255,255,0.12) 1px solid',
                    }}>
                        <div
                            onClick={() => navigate('/')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                                📚 SSDMS
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', marginTop: '2px' }}>
                                Secure Document System
                            </div>
                        </div>
                    </div>

                    {/* User info */}
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderBottom: 'rgba(255,255,255,0.12) 1px solid',
                    }}>
                        <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', marginBottom: '0.5rem',
                            color: 'white', fontWeight: 700,
                        }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>{user?.name}</div>
                        <div style={{
                            display: 'inline-block',
                            background: 'rgba(255,255,255,0.15)',
                            color: 'rgba(255,255,255,0.85)',
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '20px',
                            marginTop: '0.25rem',
                            fontWeight: 500,
                        }}>
                            {user?.role}
                        </div>
                    </div>

                    {/* Nav links */}
                    <nav style={{ flex: 1, padding: '0.75rem 0.75rem' }}>
                        {navLinks.map((link) => {
                            const active = isActive(link.path);
                            return (
                                <button
                                    key={link.path}
                                    onClick={() => navigate(link.path)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        width: '100%',
                                        padding: '0.6rem 0.75rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                                        color: active ? 'white' : 'rgba(255,255,255,0.65)',
                                        fontSize: '0.875rem',
                                        fontWeight: active ? 600 : 400,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        marginBottom: '0.25rem',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                    }}
                                >
                                    <span style={{ fontSize: '0.9rem' }}>{link.icon}</span>
                                    {link.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Bottom: profile + notifications + logout */}
                    <div style={{ padding: '0.75rem', borderTop: 'rgba(255,255,255,0.12) 1px solid' }}>
                        <button
                            onClick={() => navigate('/profile')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                width: '100%', padding: '0.6rem 0.75rem',
                                borderRadius: '8px', border: 'none',
                                background: isActive('/profile') ? 'rgba(255,255,255,0.2)' : 'transparent',
                                color: isActive('/profile') ? 'white' : 'rgba(255,255,255,0.65)',
                                fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left',
                                marginBottom: '0.25rem',
                            }}
                            onMouseEnter={(e) => { if (!isActive('/profile')) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                            onMouseLeave={(e) => { if (!isActive('/profile')) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                            <span>👤</span> My Profile
                        </button>
                        {/* Notification bell */}
                        <div ref={bellRef} style={{ position: 'relative', marginBottom: '0.5rem' }}>
                            <button
                                onClick={() => setShowNotifs((v) => !v)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    width: '100%',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: showNotifs ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    color: 'rgba(255,255,255,0.75)',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span>🔔</span>
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        background: '#e74c3c',
                                        color: 'white',
                                        borderRadius: '20px',
                                        padding: '0.1rem 0.45rem',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification dropdown - pops right */}
                            {showNotifs && (
                                <div style={{
                                    position: 'fixed',
                                    left: '228px',
                                    bottom: '60px',
                                    width: '320px',
                                    background: 'white',
                                    borderRadius: '10px',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                                    maxHeight: '380px',
                                    overflowY: 'auto',
                                    zIndex: 200,
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem 1rem',
                                        borderBottom: '1px solid #eee',
                                        position: 'sticky',
                                        top: 0,
                                        background: 'white',
                                    }}>
                                        <strong style={{ fontSize: '0.9rem', color: '#333' }}>Notifications</strong>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} style={{
                                                    background: 'none', border: 'none',
                                                    color: '#3498db', cursor: 'pointer', fontSize: '0.78rem',
                                                }}>Mark all read</button>
                                            )}
                                            <button onClick={() => { setShowNotifs(false); navigate('/notifications'); }} style={{
                                                background: 'none', border: 'none',
                                                color: '#6b7280', cursor: 'pointer', fontSize: '0.78rem',
                                            }}>View all</button>
                                        </div>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.875rem' }}>
                                            No notifications yet
                                        </div>
                                    ) : notifications.map((n) => (
                                        <div key={n.id} onClick={() => !n.is_read && markOneRead(n.id)}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                borderBottom: '1px solid #f5f5f5',
                                                background: n.is_read ? 'white' : '#eff6ff',
                                                cursor: n.is_read ? 'default' : 'pointer',
                                            }}>
                                            <div style={{ fontSize: '0.8rem', color: '#333', marginBottom: '0.2rem' }}>{n.message}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#aaa' }}>
                                                {new Date(n.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={logout}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                width: '100%', padding: '0.6rem 0.75rem',
                                borderRadius: '8px', border: 'none',
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.65)',
                                fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(231,76,60,0.3)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                            <span>🚪</span> Logout
                        </button>
                    </div>
                </aside>

                {/* Main content area */}
                <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    {/* Top bar */}
                    <header style={{
                        background: 'white',
                        padding: '0 2rem',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 40,
                    }}>
                        {title && (
                            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#2c3e50' }}>
                                {title}
                            </h1>
                        )}
                        <div style={{ marginLeft: 'auto', color: '#999', fontSize: '0.8rem' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </header>

                    <main style={{ flex: 1, padding: '2rem' }}>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Layout;
