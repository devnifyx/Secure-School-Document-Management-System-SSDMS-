import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import UserAvatar from '../components/UserAvatar';
import ConfirmModal from '../components/ConfirmModal';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    User,
    Shield,
    Lock,
    Clock,
    Key,
    Save,
    Eye,
    EyeOff,
    CheckCircle2,
    Mail,
    AlertCircle,
    Sun,
    Moon,
    Palette,
    Camera,
    Trash2,
} from 'lucide-react';

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const Settings: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { success, error: toastError } = useToast();
    const { theme, setTheme } = useTheme();

    const [tab, setTab] = useState<'profile' | 'password' | 'appearance' | 'session'>('profile');

    const [name, setName] = useState(user?.name ?? '');
    const [nameLoading, setNameLoading] = useState(false);
    const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const photoInputRef = useRef<HTMLInputElement>(null);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [photoMsg, setPhotoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loginTime = localStorage.getItem('loginTime');
    const loginDate = loginTime ? new Date(loginTime) : null;
    const expiryDate = loginDate ? new Date(loginDate.getTime() + 8 * 60 * 60 * 1000) : null;
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const updateTimer = () => {
            if (!expiryDate) return;
            const now = new Date().getTime();
            const diff = expiryDate.getTime() - now;
            if (diff <= 0) {
                setTimeLeft('Expired');
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s remaining`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiryDate]);

    const handleNameSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setNameMsg({ type: 'error', text: 'Name cannot be empty.' });
            return;
        }
        setNameLoading(true);
        setNameMsg(null);
        try {
            const res = await api.put('/profile', { name: name.trim() });
            updateUser({ name: res.data.name });
            setNameMsg({ type: 'success', text: 'Display name updated successfully.' });
            success('Account name updated.');
        } catch (e: any) {
            const errText = e.response?.data?.message || 'Failed to update name.';
            setNameMsg({ type: 'error', text: errText });
            toastError(errText);
        } finally {
            setNameLoading(false);
        }
    };

    const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow picking the same file again later
        if (!file) return;

        setPhotoMsg(null);
        if (!PHOTO_TYPES.includes(file.type)) {
            setPhotoMsg({ type: 'error', text: 'Photo must be a JPG, PNG or WebP image.' });
            return;
        }
        if (file.size > PHOTO_MAX_BYTES) {
            setPhotoMsg({ type: 'error', text: 'Photo must be 2 MB or smaller.' });
            return;
        }

        setPhotoLoading(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);
            const res = await api.post('/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            updateUser({ has_photo: res.data.has_photo, updated_at: res.data.updated_at });
            setPhotoMsg({ type: 'success', text: 'Profile photo updated.' });
            success('Profile photo updated.');
        } catch (err: any) {
            const data = err.response?.data;
            const errText = data?.errors?.photo?.[0] || data?.message || 'Failed to upload photo.';
            setPhotoMsg({ type: 'error', text: errText });
            toastError(errText);
        } finally {
            setPhotoLoading(false);
        }
    };

    const handlePhotoRemove = async () => {
        setPhotoLoading(true);
        setPhotoMsg(null);
        try {
            const res = await api.delete('/profile/photo');
            updateUser({ has_photo: res.data.has_photo, updated_at: res.data.updated_at });
            setPhotoMsg({ type: 'success', text: 'Profile photo removed.' });
            success('Profile photo removed.');
        } catch (err: any) {
            const errText = err.response?.data?.message || 'Failed to remove photo.';
            setPhotoMsg({ type: 'error', text: errText });
            toastError(errText);
        } finally {
            setPhotoLoading(false);
            setConfirmRemovePhoto(false);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwMsg(null);
        if (newPassword.length < 8) {
            setPwMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setPwLoading(true);
        try {
            await api.put('/profile', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            });
            setPwMsg({ type: 'success', text: 'Password changed successfully.' });
            success('Password successfully changed.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e: any) {
            const data = e.response?.data;
            const errText = data?.errors?.current_password?.[0] || data?.errors?.new_password?.[0] || data?.message || 'Failed to change password.';
            setPwMsg({ type: 'error', text: errText });
            toastError(errText);
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <Layout
            title="Account & Security Settings"
            subtitle="Manage your personal profile, update your password, and inspect active session policies"
        >
            <div style={{ maxWidth: '680px' }}>
                <div className="tab-group" style={{ marginBottom: '1.5rem' }}>
                    <button
                        className={`tab-btn ${tab === 'profile' ? 'active' : ''}`}
                        onClick={() => setTab('profile')}
                    >
                        <User size={15} /> Profile Details
                    </button>
                    <button
                        className={`tab-btn ${tab === 'password' ? 'active' : ''}`}
                        onClick={() => setTab('password')}
                    >
                        <Key size={15} /> Change Password
                    </button>
                    <button
                        className={`tab-btn ${tab === 'appearance' ? 'active' : ''}`}
                        onClick={() => setTab('appearance')}
                    >
                        <Palette size={15} /> Appearance
                    </button>
                    <button
                        className={`tab-btn ${tab === 'session' ? 'active' : ''}`}
                        onClick={() => setTab('session')}
                    >
                        <Shield size={15} /> Session & Security
                    </button>
                </div>

                {tab === 'profile' && (
                    <div className="panel">
                        <div className="panel-header">
                            <h3><User size={17} style={{ color: 'var(--primary)' }} /> Profile Information</h3>
                        </div>
                        <div className="panel-body">
                            <div className="profile-photo-row">
                                <button
                                    type="button"
                                    className="profile-photo-avatar"
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={photoLoading}
                                    aria-label="Change profile photo"
                                >
                                    {user && (
                                        <UserAvatar
                                            userId={user.id}
                                            name={user.name}
                                            hasPhoto={user.has_photo}
                                            version={user.updated_at}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '2rem',
                                                fontWeight: 700,
                                                color: '#FFFFFF',
                                                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                                            }}
                                        />
                                    )}
                                    <span className="photo-picker-badge"><Camera size={14} /></span>
                                </button>

                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>Profile Photo</div>
                                    <div className="form-hint" style={{ margin: '0.15rem 0 0.7rem' }}>
                                        JPG, PNG or WebP, up to 2 MB. Only you and administrators can see it.
                                    </div>
                                    <input
                                        ref={photoInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoSelected}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            disabled={photoLoading}
                                            onClick={() => photoInputRef.current?.click()}
                                        >
                                            <Camera size={14} />
                                            {photoLoading ? 'Uploading…' : user?.has_photo ? 'Change photo' : 'Upload photo'}
                                        </button>
                                        {user?.has_photo && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                disabled={photoLoading}
                                                onClick={() => setConfirmRemovePhoto(true)}
                                                style={{ color: 'var(--danger)' }}
                                            >
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {photoMsg && (
                                <div className={`notice ${photoMsg.type === 'success' ? 'notice-success' : 'notice-danger'}`} style={{ marginBottom: '1.25rem' }}>
                                    {photoMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    <div>{photoMsg.text}</div>
                                </div>
                            )}

                            <dl className="detail-grid" style={{ marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                                <dt>Email Address</dt>
                                <dd>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span>{user?.email}</span>
                                    </div>
                                </dd>

                                <dt>Assigned Role</dt>
                                <dd>
                                    <span className="badge badge-info">{user?.role}</span>
                                </dd>

                                <dt>Account Status</dt>
                                <dd>
                                    <span className="badge badge-success">
                                        <CheckCircle2 size={11} /> Active
                                    </span>
                                </dd>
                            </dl>

                            <form onSubmit={handleNameSave}>
                                {nameMsg && (
                                    <div className={`notice ${nameMsg.type === 'success' ? 'notice-success' : 'notice-danger'}`} style={{ marginBottom: '1.25rem' }}>
                                        {nameMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                        <div>{nameMsg.text}</div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Display Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                            <User size={16} />
                                        </div>
                                        <input
                                            className="form-control"
                                            value={name}
                                            required
                                            onChange={(e) => setName(e.target.value)}
                                            style={{ paddingLeft: '2.5rem' }}
                                        />
                                    </div>
                                    <span className="form-hint" style={{ marginTop: '0.35rem', display: 'block' }}>
                                        This name appears on documents and reports you upload.
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={nameLoading || name.trim() === user?.name}
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    <Save size={15} />
                                    {nameLoading ? 'Saving…' : 'Update Profile'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {tab === 'password' && (
                    <div className="panel">
                        <div className="panel-header">
                            <h3><Lock size={17} style={{ color: 'var(--primary)' }} /> Update Password</h3>
                        </div>
                        <div className="panel-body">
                            {pwMsg && (
                                <div className={`notice ${pwMsg.type === 'success' ? 'notice-success' : 'notice-danger'}`} style={{ marginBottom: '1.25rem' }}>
                                    {pwMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    <div>{pwMsg.text}</div>
                                </div>
                            )}

                            <form onSubmit={handlePasswordSave}>
                                <div className="form-group">
                                    <label className="form-label">Current Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                            <Lock size={16} />
                                        </div>
                                        <input
                                            className="form-control"
                                            type={showCurrent ? 'text' : 'password'}
                                            value={currentPassword}
                                            required
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrent((v) => !v)}
                                            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                                        >
                                            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                            <Key size={16} />
                                        </div>
                                        <input
                                            className="form-control"
                                            type={showNew ? 'text' : 'password'}
                                            value={newPassword}
                                            required
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Minimum 8 characters"
                                            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew((v) => !v)}
                                            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                                        >
                                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                            <Key size={16} />
                                        </div>
                                        <input
                                            className="form-control"
                                            type="password"
                                            value={confirmPassword}
                                            required
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat new password"
                                            style={{ paddingLeft: '2.5rem' }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    <Lock size={15} />
                                    {pwLoading ? 'Changing Password…' : 'Change Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {tab === 'appearance' && (
                    <div className="panel">
                        <div className="panel-header">
                            <h3><Palette size={17} style={{ color: 'var(--primary)' }} /> Interface Theme</h3>
                        </div>
                        <div className="panel-body">
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Choose how the SSDMS dashboard appears to you. Your theme selection is automatically saved in your browser.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                <div
                                    onClick={() => {
                                        setTheme('light');
                                        success('Switched to Light Mode');
                                    }}
                                    style={{
                                        border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        background: '#ffffff',
                                        color: '#0F172A',
                                        boxShadow: theme === 'light' ? '0 0 0 3px var(--primary-focus)' : 'none',
                                        transition: 'var(--transition)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.92rem' }}>
                                            <Sun size={18} style={{ color: '#F59E0B' }} />
                                            <span>Light Mode</span>
                                        </div>
                                        {theme === 'light' && (
                                            <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Active</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                                        Crisp, high-contrast daytime interface with clean white surfaces and sharp typography.
                                    </p>
                                </div>

                                <div
                                    onClick={() => {
                                        setTheme('dark');
                                        success('Switched to Dark Mode');
                                    }}
                                    style={{
                                        border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid #334155',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        background: '#0F172A',
                                        color: '#F8FAFC',
                                        boxShadow: theme === 'dark' ? '0 0 0 3px var(--primary-focus)' : 'none',
                                        transition: 'var(--transition)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.92rem' }}>
                                            <Moon size={18} style={{ color: '#818CF8' }} />
                                            <span>Dark Mode</span>
                                        </div>
                                        {theme === 'dark' && (
                                            <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Active</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                                        Deep midnight slate palette tailored for low-light conditions and reduced eye fatigue.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'session' && (
                    <div className="panel">
                        <div className="panel-header">
                            <h3><Shield size={17} style={{ color: 'var(--success)' }} /> Active Session & Policies</h3>
                        </div>
                        <div className="panel-body">
                            <dl className="detail-grid" style={{ marginBottom: '1.5rem' }}>
                                <dt>Login Timestamp</dt>
                                <dd>{loginDate ? loginDate.toLocaleString() : 'Active session'}</dd>

                                <dt>Session Expiry</dt>
                                <dd>{expiryDate ? expiryDate.toLocaleString() : '8 hours from login'}</dd>

                                <dt>Time Remaining</dt>
                                <dd>
                                    <span className="badge badge-info" style={{ fontSize: '0.78rem' }}>
                                        <Clock size={12} /> {timeLeft || 'Active'}
                                    </span>
                                </dd>

                                <dt>Account Protection</dt>
                                <dd>
                                    <span className="badge badge-success">
                                        <CheckCircle2 size={11} /> 3-Attempt Lockout Active
                                    </span>
                                </dd>

                                <dt>File Storage</dt>
                                <dd>
                                    <span className="badge badge-success">
                                        <Lock size={11} /> AES-256 Encrypted
                                    </span>
                                </dd>
                            </dl>

                            <div className="notice notice-info">
                                <Shield size={20} style={{ flexShrink: 0 }} />
                                <div>
                                    <strong>Automatic Inactivity Timeout:</strong> For institutional data security, sessions expire after 8 hours. When expired, you will be prompted to re-enter your credentials.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ConfirmModal
                isOpen={confirmRemovePhoto}
                title="Remove profile photo?"
                message="Your photo will be deleted and your initial will be shown instead. You can upload a new one at any time."
                confirmText="Remove photo"
                isDanger
                loading={photoLoading}
                onConfirm={handlePhotoRemove}
                onCancel={() => setConfirmRemovePhoto(false)}
            />
        </Layout>
    );
};

export default Settings;
