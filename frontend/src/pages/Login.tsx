import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            const data = err.response?.data;
            setError(data?.errors?.email?.[0] || data?.message || 'Login failed');
        } finally { setLoading(false); }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
            padding: '1.5rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
                <div style={{
                    width: '38px', height: '38px', borderRadius: '4px',
                    background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem',
                }}>🏫</div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--navy)' }}>SSDMS</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Secure School Document Management System</div>
                </div>
            </div>

            <div className="panel" style={{ width: '100%', maxWidth: '380px' }}>
                <div className="panel-body">
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.2rem' }}>Sign In</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Enter your credentials to access the system
                    </div>

                    {error && <div className="notice notice-danger" style={{ marginBottom: '1.1rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                className="form-control" type="email" value={email} required
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@school.edu"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-control" type="password" value={password} required
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>

            <div style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '380px' }}>
                Protected system. All access attempts are logged. Accounts are locked after 3 consecutive failed login attempts.
            </div>
        </div>
    );
};

export default Login;
