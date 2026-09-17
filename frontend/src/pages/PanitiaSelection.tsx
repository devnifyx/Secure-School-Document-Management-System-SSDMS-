import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Layers, Star, ArrowRight, AlertCircle, LogOut } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const PanitiaSelection: React.FC = () => {
    const { panitiaList, selectPanitia, user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState<number | null>(null);
    const [error, setError] = React.useState('');

    const handleSelect = async (panitiaId: number) => {
        setLoading(panitiaId);
        setError('');
        try {
            await selectPanitia(panitiaId);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to select Panitia.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--auth-bg, radial-gradient(ellipse at top, #EEF2FF 0%, #F8FAFC 60%, #F1F5F9 100%))',
            padding: '2rem 1rem',
            position: 'relative',
        }}>
            {/* Theme Toggle Button */}
            <ThemeToggle className="theme-toggle-floating" />
            {/* Header Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)',
                }}>
                    <GraduationCap size={26} />
                </div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>SSDMS</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Welcome, {user?.name}</div>
                </div>
            </div>

            {/* Selection Card */}
            <div className="panel" style={{ width: '100%', maxWidth: '520px', boxShadow: 'var(--shadow-xl)' }}>
                <div className="panel-body" style={{ padding: '2rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.35rem' }}>
                        Select Active Department
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        You are assigned to multiple Panitia. Choose which department workspace to enter for this session.
                    </div>

                    {error && (
                        <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <div>{error}</div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {panitiaList.map((p) => (
                            <button
                                key={p.id}
                                className="btn btn-secondary"
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '1rem 1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderRadius: 'var(--radius-lg)',
                                    borderColor: p.pivot?.is_primary ? 'var(--primary)' : 'var(--border)',
                                    background: p.pivot?.is_primary ? 'var(--primary-soft)' : 'var(--surface)',
                                }}
                                disabled={loading !== null}
                                onClick={() => handleSelect(p.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                    <div style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: 'var(--radius-md)',
                                        background: p.pivot?.is_primary ? 'var(--primary)' : 'var(--surface-alt)',
                                        color: p.pivot?.is_primary ? '#ffffff' : 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                                            {p.name}
                                        </div>
                                        {p.pivot?.is_primary && (
                                            <span className="badge badge-info" style={{ marginTop: '0.2rem', fontSize: '0.65rem' }}>
                                                <Star size={10} style={{ fill: 'currentColor' }} /> Primary Department
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {loading === p.id ? 'Opening…' : <ArrowRight size={18} />}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div style={{
                        textAlign: 'center',
                        marginTop: '1.75rem',
                        paddingTop: '1.25rem',
                        borderTop: '1px solid var(--border)',
                    }}>
                        <button
                            type="button"
                            className="btn-link"
                            onClick={logout}
                            style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
                        >
                            <LogOut size={14} /> Sign out and return to login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanitiaSelection;
