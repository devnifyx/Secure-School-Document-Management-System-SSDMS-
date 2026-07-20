import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface PanitiaOption {
    id: number;
    name: string;
}

const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [primaryPanitiaId, setPrimaryPanitiaId] = useState('');
    const [panitiaOptions, setPanitiaOptions] = useState<PanitiaOption[]>([]);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/panitia/public').then((res) => setPanitiaOptions(res.data)).catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setLoading(true);
        try {
            await api.post('/register', {
                name,
                email,
                username,
                password,
                password_confirmation: passwordConfirmation,
                primary_panitia_id: Number(primaryPanitiaId),
            });
            setSuccess(true);
        } catch (err: any) {
            const data = err.response?.data;
            if (data?.errors) {
                setFieldErrors(data.errors);
            } else {
                setError(data?.message || 'Registration failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    const firstError = (field: string) => fieldErrors[field]?.[0];

    if (success) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
                padding: '1.5rem',
            }}>
                <div className="panel" style={{ width: '100%', maxWidth: '420px' }}>
                    <div className="panel-body" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✓</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '0.5rem' }}>
                            Registration Submitted
                        </div>
                        <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            Your account is pending administrator approval. You will be able to log in once an administrator approves your registration.
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
            padding: '1.5rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
                <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem',
                }}>🏫</div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>SSDMS</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Secure School Document Management System</div>
                </div>
            </div>

            <div className="panel" style={{ width: '100%', maxWidth: '420px' }}>
                <div className="panel-body">
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.2rem' }}>Create Account</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Register as a new teacher
                    </div>

                    {error && <div className="notice notice-danger" style={{ marginBottom: '1.1rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-control" type="text" value={name} required
                                onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoFocus />
                            {firstError('name') && <div className="form-error">{firstError('name')}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input className="form-control" type="email" value={email} required
                                onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
                            {firstError('email') && <div className="form-error">{firstError('email')}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input className="form-control" type="text" value={username} required
                                onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" />
                            {firstError('username') && <div className="form-error">{firstError('username')}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input className="form-control" type="password" value={password} required
                                onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
                            {firstError('password') && <div className="form-error">{firstError('password')}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input className="form-control" type="password" value={passwordConfirmation} required
                                onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Re-enter password" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Primary Panitia</label>
                            <select className="form-control" value={primaryPanitiaId} required
                                onChange={(e) => setPrimaryPanitiaId(e.target.value)}>
                                <option value="">Select your primary Panitia</option>
                                {panitiaOptions.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {firstError('primary_panitia_id') && <div className="form-error">{firstError('primary_panitia_id')}</div>}
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}
                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}>
                            {loading ? 'Registering…' : 'Register'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Already have an account?{' '}
                        <button className="btn-link" onClick={() => navigate('/login')}>Sign in</button>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '420px' }}>
                Your account will require administrator approval before you can access the system.
            </div>
        </div>
    );
};

export default Register;
