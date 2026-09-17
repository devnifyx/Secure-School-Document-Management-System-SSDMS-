import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { GraduationCap, Mail, KeyRound, Lock, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

type Step = 'email' | 'code' | 'reset' | 'done';

const ForgotPassword: React.FC = () => {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const navigate = useNavigate();

    const submitEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setInfo('');
        try {
            const res = await api.post('/forgot-password', { email });
            setInfo(res.data.message || 'Verification code sent to your email.');
            setStep('code');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please verify your email.');
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        setLoading(true);
        setError('');
        setInfo('');
        try {
            const res = await api.post('/forgot-password', { email });
            setInfo(res.data.message || 'A new verification code has been sent.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Could not resend code. Please try again shortly.');
        } finally {
            setLoading(false);
        }
    };

    const submitCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/verify-reset-code', { email, code: code.trim() });
            setResetToken(res.data.reset_token);
            setStep('reset');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired verification code.');
        } finally {
            setLoading(false);
        }
    };

    const submitReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== passwordConfirmation) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/reset-password', {
                reset_token: resetToken,
                password,
                password_confirmation: passwordConfirmation,
            });
            setStep('done');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Could not reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const stepIndex = step === 'email' ? 1 : step === 'code' ? 2 : step === 'reset' ? 3 : 4;

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
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Account Recovery</div>
                </div>
            </div>

            {/* Recovery Card */}
            <div className="panel" style={{ width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)' }}>
                {/* Step indicator bar */}
                <div style={{ display: 'flex', height: '4px', background: 'var(--border)' }}>
                    <div style={{
                        width: `${(stepIndex / 4) * 100}%`,
                        background: 'linear-gradient(90deg, #4F46E5 0%, #10B981 100%)',
                        transition: 'width 0.3s ease',
                    }} />
                </div>

                <div className="panel-body" style={{ padding: '2rem' }}>
                    {step === 'email' && (
                        <>
                            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.35rem' }}>
                                Reset Password
                            </h2>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Enter your account email address to receive a 6-digit verification code.
                            </p>

                            {error && (
                                <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                    <div>{error}</div>
                                </div>
                            )}

                            <form onSubmit={submitEmail}>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
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
                                            placeholder="your-name@school.edu"
                                            style={{ paddingLeft: '2.5rem' }}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
                                    {loading ? 'Sending code…' : (
                                        <>
                                            <span>Send Verification Code</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {step === 'code' && (
                        <>
                            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.35rem' }}>
                                Enter Verification Code
                            </h2>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                We sent a 6-digit verification code to <strong>{email}</strong>.
                            </p>

                            {info && (
                                <div className="notice notice-info" style={{ marginBottom: '1.25rem' }}>
                                    <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                                    <div>{info}</div>
                                </div>
                            )}
                            {error && (
                                <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                    <div>{error}</div>
                                </div>
                            )}

                            <form onSubmit={submitCode}>
                                <div className="form-group">
                                    <label className="form-label">6-Digit Code</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                            <KeyRound size={16} />
                                        </div>
                                        <input
                                            className="form-control"
                                            type="text"
                                            maxLength={6}
                                            value={code}
                                            required
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="123456"
                                            style={{ paddingLeft: '2.5rem', letterSpacing: '0.25em', fontWeight: 700, fontSize: '1.1rem' }}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
                                    {loading ? 'Verifying…' : (
                                        <>
                                            <span>Verify Code</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                                <button
                                    type="button"
                                    className="btn-link"
                                    onClick={resendCode}
                                    disabled={loading}
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    <RefreshCw size={14} /> Resend verification code
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'reset' && (
                        <>
                            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.35rem' }}>
                                Set New Password
                            </h2>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Enter a strong new password for your account.
                            </p>

                            {error && (
                                <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                    <div>{error}</div>
                                </div>
                            )}

                            <form onSubmit={submitReset}>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
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
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
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
                                            placeholder="Repeat password"
                                            style={{ paddingLeft: '2.5rem' }}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
                                    {loading ? 'Updating password…' : 'Save New Password'}
                                </button>
                            </form>
                        </>
                    )}

                    {step === 'done' && (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'var(--success-bg)',
                                color: 'var(--success)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.25rem',
                            }}>
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
                                Password Reset Complete
                            </h2>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                Your password has been successfully updated. You can now sign in with your new password.
                            </p>
                            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={() => navigate('/login')}>
                                Sign In Now
                            </button>
                        </div>
                    )}

                    {step !== 'done' && (
                        <div style={{
                            textAlign: 'center',
                            marginTop: '1.5rem',
                            paddingTop: '1.25rem',
                            borderTop: '1px solid var(--border)',
                            fontSize: '0.84rem',
                            color: 'var(--text-secondary)',
                        }}>
                            <button className="btn-link" onClick={() => navigate('/login')}>
                                <ArrowLeft size={14} /> Return to Sign In
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
