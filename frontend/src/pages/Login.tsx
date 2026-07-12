import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
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
            minHeight: '100vh',
            display: 'flex',
            background: '#f0f4f8',
        }}>
            {/* Left panel */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1a6b3c 0%, #27ae60 50%, #2ecc71 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem',
                color: 'white',
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', textAlign: 'center' }}>
                    SSDMS
                </h1>
                <p style={{ fontSize: '0.95rem', opacity: 0.85, textAlign: 'center', margin: '0 0 2.5rem 0' }}>
                    Secure School Document<br />Management System
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '280px' }}>
                    {[
                        { icon: '🔒', label: 'AES-256 Encryption', desc: 'All documents encrypted at rest' },
                        { icon: '✅', label: 'Approval Workflow', desc: 'Admin reviews before publishing' },
                        { icon: '📋', label: 'Full Audit Trail', desc: 'Every action is logged' },
                    ].map((f) => (
                        <div key={f.label} style={{
                            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                            background: 'rgba(255,255,255,0.12)',
                            borderRadius: '10px', padding: '0.75rem',
                        }}>
                            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{f.icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{f.label}</div>
                                <div style={{ opacity: 0.75, fontSize: '0.75rem' }}>{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — login form */}
            <div style={{
                width: '420px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 2.5rem',
                background: 'white',
            }}>
                <div style={{ width: '100%', maxWidth: '340px' }}>
                    <h2 style={{ margin: '0 0 0.35rem 0', color: '#1f2937', fontWeight: 800, fontSize: '1.5rem' }}>
                        Welcome back
                    </h2>
                    <p style={{ margin: '0 0 2rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                        Sign in to your account to continue
                    </p>

                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            color: '#dc2626', padding: '0.75rem 1rem',
                            borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem',
                            display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                                Email address
                            </label>
                            <input
                                type="email" value={email} required
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@ssdms.local"
                                style={{
                                    width: '100%', padding: '0.7rem 0.85rem',
                                    border: '1.5px solid #e5e7eb', borderRadius: '8px',
                                    fontSize: '0.9rem', boxSizing: 'border-box',
                                    outline: 'none', transition: 'border-color 0.15s',
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#10b981'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'} value={password} required
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    style={{
                                        width: '100%', padding: '0.7rem 2.5rem 0.7rem 0.85rem',
                                        border: '1.5px solid #e5e7eb', borderRadius: '8px',
                                        fontSize: '0.9rem', boxSizing: 'border-box',
                                        outline: 'none', transition: 'border-color 0.15s',
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#10b981'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
                                />
                                <button
                                    type="button" onClick={() => setShowPass((v) => !v)}
                                    style={{
                                        position: 'absolute', right: '0.75rem', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#9ca3af',
                                    }}
                                >{showPass ? '🙈' : '👁'}</button>
                            </div>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '0.8rem',
                                background: loading ? '#9ca3af' : '#10b981',
                                color: 'white', border: 'none',
                                borderRadius: '8px', fontSize: '0.95rem',
                                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                marginTop: '0.5rem', transition: 'background 0.15s',
                            }}
                        >
                            {loading ? 'Signing in…' : 'Sign In →'}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', padding: '0.85rem', background: '#f9fafb', borderRadius: '8px', fontSize: '0.78rem', color: '#6b7280' }}>
                        <strong>Demo credentials:</strong><br />
                        Email: admin@ssdms.local<br />
                        Password: admin123
                    </div>

                    <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
                        🔒 Account locks after 3 failed attempts (Teachers only)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
