import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
    const { user, updateUser } = useAuth();

    const [name, setName] = useState(user?.name ?? '');
    const [nameLoading, setNameLoading] = useState(false);
    const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loginTime = localStorage.getItem('loginTime');
    const loginDate = loginTime ? new Date(loginTime) : null;
    const expiryDate = loginDate ? new Date(loginDate.getTime() + 8 * 60 * 60 * 1000) : null;

    const handleNameSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setNameMsg({ type: 'error', text: 'Name cannot be empty.' }); return; }
        setNameLoading(true); setNameMsg(null);
        try {
            const res = await api.put('/profile', { name: name.trim() });
            updateUser({ name: res.data.name });
            setNameMsg({ type: 'success', text: 'Name updated successfully.' });
        } catch (e: any) {
            setNameMsg({ type: 'error', text: e.response?.data?.message || 'Failed to update name.' });
        } finally { setNameLoading(false); }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwMsg(null);
        if (newPassword.length < 8) { setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' }); return; }
        if (newPassword !== confirmPassword) { setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
        setPwLoading(true);
        try {
            await api.put('/profile', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            });
            setPwMsg({ type: 'success', text: 'Password changed successfully.' });
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (e: any) {
            const data = e.response?.data;
            setPwMsg({
                type: 'error',
                text: data?.errors?.current_password?.[0] || data?.errors?.new_password?.[0] || data?.message || 'Failed to change password.',
            });
        } finally { setPwLoading(false); }
    };

    return (
        <Layout title="Settings" subtitle="Manage your account information and security">
            <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Personal information */}
                <div className="panel">
                    <div className="panel-header"><h3>Personal Information</h3></div>
                    <div className="panel-body">
                        <dl className="detail-grid" style={{ marginBottom: '1.25rem' }}>
                            <dt>Email Address</dt><dd>{user?.email}</dd>
                            <dt>Role</dt><dd><span className="badge badge-info">{user?.role}</span></dd>
                            <dt>Account Status</dt><dd><span className="badge badge-success">Active</span></dd>
                        </dl>

                        <form onSubmit={handleNameSave}>
                            {nameMsg && (
                                <div className={`notice ${nameMsg.type === 'success' ? 'notice-success' : 'notice-danger'}`} style={{ marginBottom: '1rem' }}>
                                    {nameMsg.text}
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Display Name</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
                                    <button type="submit" className="btn btn-primary" disabled={nameLoading}>
                                        {nameLoading ? 'Saving…' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Change password */}
                <div className="panel">
                    <div className="panel-header"><h3>Change Password</h3></div>
                    <div className="panel-body">
                        {pwMsg && (
                            <div className={`notice ${pwMsg.type === 'success' ? 'notice-success' : 'notice-danger'}`} style={{ marginBottom: '1rem' }}>
                                {pwMsg.text}
                            </div>
                        )}
                        <form onSubmit={handlePasswordSave}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input className="form-control" type="password" value={currentPassword} required
                                    onChange={(e) => setCurrentPassword(e.target.value)} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input className="form-control" type="password" value={newPassword} required
                                        onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <input className="form-control" type="password" value={confirmPassword} required
                                        onChange={(e) => setConfirmPassword(e.target.value)} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ marginTop: '0.5rem' }}>
                                {pwLoading ? 'Changing…' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Session information */}
                <div className="panel">
                    <div className="panel-header"><h3>Session Information</h3></div>
                    <div className="panel-body">
                        <dl className="detail-grid">
                            <dt>Signed in since</dt>
                            <dd>{loginDate ? loginDate.toLocaleString() : '—'}</dd>
                            <dt>Session expires</dt>
                            <dd>{expiryDate ? expiryDate.toLocaleString() : '—'}</dd>
                            <dt>Browser</dt>
                            <dd style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{navigator.userAgent}</dd>
                            {user?.role === 'Teacher' && (
                                <>
                                    <dt>Lockout Policy</dt>
                                    <dd>Account locks after 3 consecutive failed login attempts (15 minutes)</dd>
                                </>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
