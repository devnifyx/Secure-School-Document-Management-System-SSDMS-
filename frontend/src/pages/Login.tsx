import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login: doLogin, needsPanitiaSelection } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await doLogin(login, password);
        } catch (err: any) {
            const data = err.response?.data;
            setError(data?.errors?.login?.[0] || data?.message || 'Invalid credentials. Please verify and try again.');
            setLoading(false);
            return;
        }
        setLoading(false);
    };

    React.useEffect(() => {
        if (needsPanitiaSelection) {
            navigate('/select-panitia');
        }
    }, [needsPanitiaSelection, navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at top, #EEF2FF 0%, #F8FAFC 60%, #F1F5F9 100%)',
            padding: '1.75rem 1rem',
        }}>
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
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Secure School Document Management System</div>
                </div>
            </div>

            {/* Auth Card */}
            <div className="panel" style={{ width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-xl)' }}>
                <div className="panel-body" style={{ padding: '2rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.35rem' }}>
                        Welcome back
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Sign in to access your school documents and reports
                    </div>

                    {error && (
                        <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email or Username</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    left: '0.9rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                }}>
                                    <User size={17} />
                                </div>
                                <input
                                    className="form-control"
                                    type="text"
                                    value={login}
                                    required
                                    onChange={(e) => setLogin(e.target.value)}
                                    placeholder="teacher@school.edu or username"
                                    style={{ paddingLeft: '2.5rem' }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.45rem' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                                <button
                                    type="button"
                                    className="btn-link"
                                    style={{ fontSize: '0.78rem' }}
                                    onClick={() => navigate('/forgot-password')}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    left: '0.9rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                }}>
                                    <Lock size={17} />
                                </div>
                                <input
                                    className="form-control"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    required
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '0.2rem',
                                        display: 'flex',
                                    }}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
                        >
                            {loading ? 'Signing in…' : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{
                        textAlign: 'center',
                        marginTop: '1.5rem',
                        paddingTop: '1.25rem',
                        borderTop: '1px solid var(--border)',
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                    }}>
                        Don't have an account?{' '}
                        <button className="btn-link" onClick={() => navigate('/register')} style={{ fontWeight: 700 }}>
                            Register now
                        </button>
                    </div>
                </div>
            </div>

            {/* Security Guarantee Pill */}
            <div style={{
                marginTop: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.76rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                maxWidth: '400px',
                lineHeight: 1.4,
            }}>
                <ShieldCheck size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span>Protected with AES-256 encryption. Accounts lock after 3 consecutive failed login attempts.</span>
            </div>
        </div>
    );
};

export default Login;
