import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
        setLoading(true); setError(''); setInfo('');
        try {
            const res = await api.post('/forgot-password', { email });
            setInfo(res.data.message);
            setStep('code');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally { setLoading(false); }
    };

    const resendCode = async () => {
        setLoading(true); setError(''); setInfo('');
        try {
            const res = await api.post('/forgot-password', { email });
            setInfo(res.data.message);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Could not resend code. Please try again shortly.');
        } finally { setLoading(false); }
    };

    const submitCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await api.post('/verify-reset-code', { email, code });
            setResetToken(res.data.reset_token);
            setStep('reset');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid verification code.');
        } finally { setLoading(false); }
    };

    const submitReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await api.post('/reset-password', {
                reset_token: resetToken,
                password,
                password_confirmation: passwordConfirmation,
            });
            setStep('done');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Could not reset password. Please try again.');
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
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem',
                }}>🏫</div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>SSDMS</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Secure School Document Management System</div>
                </div>
            </div>

            <div className="panel" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="panel-body">
                    {step === 'done' ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✓</div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '0.5rem' }}>
                                Password Reset
                            </div>
                            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                                Your password has been changed successfully. Please log in with your new password.
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.2rem' }}>
                                {step === 'email' && 'Forgot Password'}
                                {step === 'code' && 'Enter Verification Code'}
                                {step === 'reset' && 'Set New Password'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                {step === 'email' && 'Enter your registered email to receive a verification code'}
                                {step === 'code' && `A 6-digit code was sent to ${email}`}
                                {step === 'reset' && 'Choose a new password for your account'}
                            </div>

                            {info && <div className="notice notice-info" style={{ marginBottom: '1.1rem' }}>{info}</div>}
                            {error && <div className="notice notice-danger" style={{ marginBottom: '1.1rem' }}>{error}</div>}

                            {step === 'email' && (
                                <form onSubmit={submitEmail}>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input className="form-control" type="email" value={email} required autoFocus
                                            onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={loading}
                                        style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}>
                                        {loading ? 'Sending…' : 'Send Verification Code'}
                                    </button>
                                </form>
                            )}

                            {step === 'code' && (
                                <form onSubmit={submitCode}>
                                    <div className="form-group">
                                        <label className="form-label">Verification Code</label>
                                        <input className="form-control" type="text" inputMode="numeric" maxLength={6}
                                            value={code} required autoFocus
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="6-digit code"
                                            style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: '1.1rem' }} />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={loading || code.length !== 6}
                                        style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}>
                                        {loading ? 'Verifying…' : 'Verify Code'}
                                    </button>
                                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
                                        <button type="button" className="btn-link" disabled={loading} onClick={resendCode}>
                                            Resend code
                                        </button>
                                    </div>
                                </form>
                            )}

                            {step === 'reset' && (
                                <form onSubmit={submitReset}>
                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <input className="form-control" type="password" value={password} required autoFocus
                                            onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Confirm New Password</label>
                                        <input className="form-control" type="password" value={passwordConfirmation} required
                                            onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Re-enter password" />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={loading}
                                        style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}>
                                        {loading ? 'Resetting…' : 'Reset Password'}
                                    </button>
                                </form>
                            )}

                            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                <button className="btn-link" onClick={() => navigate('/login')}>Back to Login</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
