import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { GraduationCap, User, Mail, Lock, Layers, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import ThemeToggle from '../components/ThemeToggle';

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

        if (password !== passwordConfirmation) {
            setError('Passwords do not match.');
            return;
        }

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
                setError(data?.message || 'Registration failed. Please check the information provided.');
            }
        } finally {
            setLoading(false);
        }
    };

    const firstError = (field: string) => fieldErrors[field]?.[0];

    if (success) {
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
                <div className="panel" style={{ width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)' }}>
                    <div className="panel-body" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'var(--success-bg)',
                            color: 'var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                        }}>
                            <CheckCircle2 size={36} />
                        </div>
                        <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
                            Registration Submitted
                        </h2>
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
                            Thank you for registering! Your teacher account has been submitted for administrator review. You will receive access once an administrator approves your account.
                        </p>
                        <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={() => navigate('/login')}>
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--auth-bg, radial-gradient(ellipse at top, #EEF2FF 0%, #F8FAFC 60%, #F1F5F9 100%))',
            padding: '2.5rem 1rem',
            position: 'relative',
        }}>
            {/* Theme Toggle Button */}
            <ThemeToggle className="theme-toggle-floating" />
            {/* Header Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.75rem' }}>
                <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)',
                }}>
                    <GraduationCap size={24} />
                </div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>SSDMS</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Secure Academic Document Management</div>
                </div>
            </div>

            {/* Registration Card */}
            <div className="panel" style={{ width: '100%', maxWidth: '560px', boxShadow: 'var(--shadow-xl)' }}>
                <div className="panel-body" style={{ padding: '2rem 2.25rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)', marginBottom: '0.35rem' }}>
                        Create Teacher Account
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Register to submit lesson plans, assessments, and weekly reports
                    </div>

                    {error && (
                        <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                    <User size={16} />
                                </div>
                                <input
                                    className="form-control"
                                    type="text"
                                    value={name}
                                    required
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Cikgu Ahmad Razali"
                                    style={{ paddingLeft: '2.5rem' }}
                                    autoFocus
                                />
                            </div>
                            {firstError('name') && <div className="form-error">{firstError('name')}</div>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Email Address <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        className="form-control"
                                        type="email"
                                        value={email}
                                        required
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ahmad@school.edu"
                                        style={{ paddingLeft: '2.5rem' }}
                                    />
                                </div>
                                {firstError('email') && <div className="form-error">{firstError('email')}</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Username <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    className="form-control"
                                    type="text"
                                    value={username}
                                    required
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. ahmad_razali"
                                />
                                {firstError('username') && <div className="form-error">{firstError('username')}</div>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        className="form-control"
                                        type="password"
                                        value={password}
                                        required
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 8 characters"
                                        style={{ paddingLeft: '2.5rem' }}
                                    />
                                </div>
                                {firstError('password') && <div className="form-error">{firstError('password')}</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        className="form-control"
                                        type="password"
                                        value={passwordConfirmation}
                                        required
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        placeholder="Confirm password"
                                        style={{ paddingLeft: '2.5rem' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Primary Subject Department (Panitia) <span style={{ color: 'var(--danger)' }}>*</span>
                            </label>
                            <CustomSelect
                                options={panitiaOptions.map((p) => ({
                                    value: String(p.id),
                                    label: p.name,
                                    icon: <Layers size={16} />
                                }))}
                                value={primaryPanitiaId}
                                onChange={(val) => setPrimaryPanitiaId(val)}
                                placeholder="Select your primary department…"
                                searchable={true}
                            />
                            {firstError('primary_panitia_id') && <div className="form-error">{firstError('primary_panitia_id')}</div>}
                            <span className="form-hint" style={{ marginTop: '0.35rem', display: 'block' }}>
                                Administrators can assign you to additional Panitia after account approval.
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
                        >
                            {loading ? 'Submitting registration…' : (
                                <>
                                    <span>Register Account</span>
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
                        Already have an account?{' '}
                        <button className="btn-link" onClick={() => navigate('/login')} style={{ fontWeight: 700 }}>
                            <ArrowLeft size={14} /> Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
