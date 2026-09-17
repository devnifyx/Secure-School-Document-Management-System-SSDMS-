import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import {
    LayoutDashboard,
    FolderArchive,
    Search,
    CheckSquare,
    Calendar,
    Users,
    Layers,
    History,
    Bell,
    Settings,
    LogOut,
    UploadCloud,
    Menu,
    X,
    ChevronDown,
    Check,
    GraduationCap,
    Clock,
    Sun,
    Moon,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

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
    const { user, logout, activePanitia, panitiaList, switchPanitia } = useAuth();
    const { success, error } = useToast();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = user?.role === 'Admin';

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showPanitia, setShowPanitia] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const notifRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);
    const panitiaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close mobile menu upon navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
            if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
            if (panitiaRef.current && !panitiaRef.current.contains(e.target as Node)) setShowPanitia(false);
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
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            success('All notifications marked as read.');
        } catch {
            error('Failed to update notifications.');
        }
    };

    const markOneRead = async (id: number) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch { /* silent */ }
    };

    const handleSwitchPanitia = async (panitiaId: number) => {
        setSwitching(true);
        try {
            await switchPanitia(panitiaId);
            setShowPanitia(false);
            success('Panitia switched successfully.');
            window.location.reload();
        } catch (e: any) {
            error(e.response?.data?.message || 'Failed to switch Panitia.');
        } finally {
            setSwitching(false);
        }
    };

    const isActive = (path: string) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const navItems = isAdmin
        ? [
            { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={19} /> },
            { label: 'Repository', path: '/documents', icon: <FolderArchive size={19} /> },
            { label: 'Search', path: '/search', icon: <Search size={19} /> },
            { label: 'Approval Queue', path: '/approvals', icon: <CheckSquare size={19} /> },
            { label: 'Weekly Reports', path: '/weekly-reports', icon: <Calendar size={19} /> },
            { label: 'User Management', path: '/users', icon: <Users size={19} /> },
            { label: 'Panitia', path: '/panitia', icon: <Layers size={19} /> },
            { label: 'Audit Logs', path: '/audit-logs', icon: <History size={19} /> },
            { label: 'Notifications', path: '/notifications', icon: <Bell size={19} /> },
        ]
        : [
            { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={19} /> },
            { label: 'Repository', path: '/documents', icon: <FolderArchive size={19} /> },
            { label: 'Search', path: '/search', icon: <Search size={19} /> },
            { label: 'Weekly Reports', path: '/weekly-reports', icon: <Calendar size={19} /> },
            { label: 'Notifications', path: '/notifications', icon: <Bell size={19} /> },
        ];

    return (
        <div className="app-shell">
            {/* Mobile Backdrop Overlay */}
            <div
                className={`sidebar-backdrop ${mobileOpen ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar Drawer */}
            <nav className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-brand" onClick={() => navigate('/')}>
                    <div className="sidebar-brand-mark">
                        <GraduationCap size={22} />
                    </div>
                    <div className="sidebar-brand-text">
                        <div className="name">SSDMS {isAdmin ? 'Admin' : 'Portal'}</div>
                        <div className="sub">Academic Document System</div>
                    </div>
                </div>

                {!isAdmin && (
                    <button className="sidebar-upload-btn" onClick={() => navigate('/upload')} title="Upload Document">
                        <UploadCloud size={18} />
                        <span>Upload Document</span>
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
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="sidebar-footer">
                    <div
                        className={`sidebar-link ${isActive('/settings') ? 'active' : ''}`}
                        onClick={() => navigate('/settings')}
                        title="Settings"
                    >
                        <span className="icon"><Settings size={18} /></span>
                        <span>Settings</span>
                    </div>
                    <div className="sidebar-link" onClick={logout} title="Logout" style={{ color: '#F87171' }}>
                        <span className="icon"><LogOut size={18} /></span>
                        <span>Logout</span>
                    </div>
                </div>
            </nav>

            {/* Topbar */}
            <header className="topbar">
                {/* Mobile hamburger menu toggle button */}
                <button
                    className="topbar-mobile-toggle"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Toggle navigation"
                >
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Panitia Switcher (Teacher with multiple Panitia) */}
                    {!isAdmin && panitiaList.length > 1 && activePanitia && (
                        <div ref={panitiaRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowPanitia((v) => !v)}
                                className="btn btn-secondary btn-sm"
                                style={{
                                    borderColor: 'var(--primary)',
                                    color: 'var(--primary)',
                                    background: 'var(--primary-soft)',
                                    fontWeight: 600,
                                }}
                            >
                                <span>{activePanitia.name}</span>
                                <ChevronDown size={14} />
                            </button>
                            {showPanitia && (
                                <div style={{
                                    position: 'absolute', right: 0, top: '2.6rem', width: '230px',
                                    background: 'var(--surface)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                                    zIndex: 200, overflow: 'hidden', animation: 'scaleIn 0.15s ease-out',
                                }}>
                                    <div style={{
                                        padding: '0.7rem 1rem', borderBottom: '1px solid var(--border)',
                                        fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                    }}>
                                        Switch Active Panitia
                                    </div>
                                    {panitiaList.map((p) => (
                                        <button
                                            key={p.id}
                                            disabled={switching}
                                            onClick={() => p.id !== activePanitia.id && handleSwitchPanitia(p.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                width: '100%', textAlign: 'left',
                                                padding: '0.7rem 1rem', background: p.id === activePanitia.id ? 'var(--primary-soft)' : 'none',
                                                border: 'none', cursor: p.id === activePanitia.id ? 'default' : 'pointer',
                                                fontSize: '0.82rem', color: 'var(--text)',
                                                fontWeight: p.id === activePanitia.id ? 700 : 500,
                                            }}
                                        >
                                            <span>
                                                {p.name}
                                                {p.pivot?.is_primary && (
                                                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>(Primary)</span>
                                                )}
                                            </span>
                                            {p.id === activePanitia.id && <Check size={16} color="var(--primary)" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Single Panitia indicator */}
                    {!isAdmin && panitiaList.length === 1 && activePanitia && (
                        <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>
                            <Layers size={13} /> {activePanitia.name}
                        </span>
                    )}

                    {/* Theme Toggle Button */}
                    <button
                        className="topbar-icon-btn"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <Sun size={18} style={{ color: '#FBBF24' }} />
                        ) : (
                            <Moon size={18} />
                        )}
                    </button>

                    {/* Notifications popover */}
                    <div ref={notifRef} style={{ position: 'relative' }}>
                        <button
                            className="topbar-icon-btn"
                            onClick={() => setShowNotifs((v) => !v)}
                            title="Notifications"
                            aria-label="View notifications"
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="topbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </button>
                        {showNotifs && (
                            <div style={{
                                position: 'absolute', right: 0, top: '2.8rem', width: '360px',
                                maxWidth: 'calc(100vw - 2rem)',
                                background: 'var(--surface)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
                                maxHeight: '420px', overflowY: 'auto', zIndex: 200,
                                animation: 'scaleIn 0.15s ease-out',
                            }}>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.9rem 1.2rem', borderBottom: '1px solid var(--border)',
                                    background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 2,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Notifications</strong>
                                        {unreadCount > 0 && (
                                            <span className="badge badge-info" style={{ fontSize: '0.66rem' }}>{unreadCount} new</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {unreadCount > 0 && (
                                            <button className="btn-link" onClick={markAllRead}>Mark read</button>
                                        )}
                                        <button className="btn-link" onClick={() => { setShowNotifs(false); navigate('/notifications'); }}>View all</button>
                                    </div>
                                </div>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                                        <Bell size={28} style={{ opacity: 0.3, marginBottom: '0.5rem', display: 'inline-block' }} />
                                        <div>No notifications yet</div>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => !n.is_read && markOneRead(n.id)}
                                            style={{
                                                padding: '0.8rem 1.2rem',
                                                borderBottom: '1px solid var(--border)',
                                                background: n.is_read ? 'var(--surface)' : 'var(--primary-soft)',
                                                cursor: n.is_read ? 'default' : 'pointer',
                                                transition: 'background 0.12s',
                                            }}
                                        >
                                            <div style={{ fontSize: '0.83rem', color: 'var(--text)', fontWeight: n.is_read ? 400 : 600 }}>
                                                {n.message}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                                <Clock size={12} />
                                                {new Date(n.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* User profile dropdown */}
                    <div ref={userRef} style={{ position: 'relative' }}>
                        <div className="topbar-user" onClick={() => setShowUserMenu((v) => !v)}>
                            <div className="topbar-avatar">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="topbar-user-info">
                                <div className="name">{user?.name}</div>
                                <div className="role">{user?.role}</div>
                            </div>
                            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        {showUserMenu && (
                            <div style={{
                                position: 'absolute', right: 0, top: '3.2rem', width: '220px',
                                background: 'var(--surface)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                                zIndex: 200, overflow: 'hidden', animation: 'scaleIn 0.15s ease-out',
                            }}>
                                <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>{user?.name}</div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                                </div>
                                <button
                                    onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                                    style={dropdownItemStyle}
                                >
                                    <Settings size={15} /> Account Settings
                                </button>
                                <button
                                    onClick={() => { setShowUserMenu(false); logout(); }}
                                    style={{ ...dropdownItemStyle, color: 'var(--danger)' }}
                                >
                                    <LogOut size={15} /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Page Main Content */}
            <main className="content">
                {(title || actions) && (
                    <div className="page-header">
                        <div>
                            {title && <h1 className="page-title">{title}</h1>}
                            {subtitle && <p className="page-subtitle">{subtitle}</p>}
                        </div>
                        {actions && <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{actions}</div>}
                    </div>
                )}
                {children}
            </main>
        </div>
    );
};

const dropdownItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    width: '100%',
    textAlign: 'left',
    padding: '0.75rem 1rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.83rem',
    color: 'var(--text)',
    transition: 'background 0.12s',
};

export default Layout;
