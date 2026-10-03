import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User, Mail, Lock, Layers, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Camera, Trash2 } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import ThemeToggle from '../components/ThemeToggle';

interface PanitiaOption {
    id: number;
    name: string;
}

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

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
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoError, setPhotoError] = useState('');
    const photoInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/panitia/public').then((res) => setPanitiaOptions(res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        return () => {
            if (photoPreview) URL.revokeObjectURL(photoPreview);
        };
    }, [photoPreview]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting the same file after removing it
        if (!file) return;

        if (!PHOTO_TYPES.includes(file.type)) {
            setPhotoError('Photo must be a JPG, PNG or WebP image.');
            return;
        }
        if (file.size > PHOTO_MAX_BYTES) {
            setPhotoError('Photo must be 2 MB or smaller.');
            return;
        }

        setPhotoError('');
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const removePhoto = () => {
        setPhoto(null);
        setPhotoPreview(null);
        setPhotoError('');
    };

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
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('username', username);
            formData.append('password', password);
            formData.append('password_confirmation', passwordConfirmation);
            formData.append('primary_panitia_id', primaryPanitiaId);
            if (photo) formData.append('photo', photo);

            await api.post('/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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
            <ThemeToggle className="theme-toggle-floating" />
            <div style={{ textAlign: 'center', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                    src="/smkkp-logo.png"
                    alt="SMK Kubor Panjang Crest"
                    style={{
                        width: '74px',
                        height: '74px',
                        objectFit: 'contain',
                        marginBottom: '0.65rem',
                        filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.12))',
                    }}
                />
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    SMK KUBOR PANJANG
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.2rem' }}>
                    Secure School Document Management System
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    Teacher Registration & Panitia Affiliation
                </div>
            </div>

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
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoChange}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                className={`photo-picker ${photoPreview ? 'has-photo' : ''}`}
                                onClick={() => photoInputRef.current?.click()}
                                aria-label={photoPreview ? 'Change profile photo' : 'Add profile photo'}
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Profile preview" />
                                ) : (
                                    <Camera size={28} />
                                )}
                                <span className="photo-picker-badge"><Camera size={13} /></span>
                            </button>
                            <div style={{ marginTop: '0.6rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)' }}>
                                Profile Photo <span className="form-hint" style={{ fontWeight: 500 }}>(optional)</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.9rem', marginTop: '0.25rem', minHeight: '1.2rem' }}>
                                <button type="button" className="btn-link" onClick={() => photoInputRef.current?.click()}>
                                    {photoPreview ? 'Change photo' : 'Upload photo'}
                                </button>
                                {photoPreview && (
                                    <button type="button" className="btn-link" onClick={removePhoto} style={{ color: 'var(--danger)' }}>
                                        <Trash2 size={13} /> Remove
                                    </button>
                                )}
                            </div>
                            <span className="form-hint" style={{ marginTop: '0.25rem', textAlign: 'center' }}>
                                JPG, PNG or WebP, up to 2 MB. A clear photo helps the administrator verify your account.
                            </span>
                            {(photoError || firstError('photo')) && (
                                <div className="form-error" style={{ marginTop: '0.35rem' }}>{photoError || firstError('photo')}</div>
                            )}
                        </div>

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
