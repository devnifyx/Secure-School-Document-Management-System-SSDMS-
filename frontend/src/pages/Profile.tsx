import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    // Name form
    const [name, setName] = useState(user?.name ?? '');
    const [nameLoading, setNameLoading] = useState(false);
    const [nameSuccess, setNameSuccess] = useState('');
    const [nameError, setNameError] = useState('');

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwError, setPwError] = useState('');

    const handleNameSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setNameError('Name cannot be empty.'); return; }
        setNameLoading(true); setNameError(''); setNameSuccess('');
        try {
            const res = await api.put('/profile', { name: name.trim() });
            updateUser({ name: res.data.name });
            setNameSuccess('Name updated successfully!');
        } catch (e: any) {
            setNameError(e.response?.data?.message || 'Failed to update name.');
        } finally {
            setNameLoading(false);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError(''); setPwSuccess('');
        if (newPassword.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
        if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return; }
        setPwLoading(true);
        try {
            await api.put('/profile', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            });
            setPwSuccess('Password changed successfully!');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (e: any) {
            const data = e.response?.data;
            setPwError(
                data?.errors?.current_password?.[0] ||
                data?.errors?.new_password?.[0] ||
                data?.message ||
                'Failed to change password.'
            );
        } finally {
            setPwLoading(false);
        }
    };

    const strengthScore = (pw: string): number => {
        if (!pw) return 0;
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return score;
    };

    const strength = strengthScore(newPassword);
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
    const strengthColor = ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'][strength];

    return (
        <Layout title="My Profile">
            <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Account info card */}
                <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: user?.role === 'Admin'
                                ? 'linear-gradient(135deg, #1a2332, #2c3e50)'
                                : 'linear-gradient(135deg, #1a6b3c, #27ae60)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', color: 'white', fontWeight: 700, flexShrink: 0,
                        }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.05rem' }}>{user?.name}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{user?.email}</div>
                            <span style={{
                                display: 'inline-block', marginTop: '0.3rem',
                                background: user?.role === 'Admin' ? '#f5f3ff' : '#ecfdf5',
                                color: user?.role === 'Admin' ? '#7c3aed' : '#059669',
                                fontSize: '0.72rem', fontWeight: 700,
                                padding: '0.1rem 0.55rem', borderRadius: '20px',
                            }}>{user?.role}</span>
                        </div>
                    </div>

                    {/* Change name */}
                    <form onSubmit={handleNameSave}>
                        <label style={labelStyle}>Display Name</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ ...inputStyle, flex: 1 }}
                                placeholder="Your full name"
                            />
                            <button type="submit" disabled={nameLoading} style={saveBtnStyle(nameLoading)}>
                                {nameLoading ? '…' : 'Save'}
                            </button>
                        </div>
                        {nameSuccess && <div style={successNote}>{nameSuccess}</div>}
                        {nameError && <div style={errorNote}>{nameError}</div>}
                    </form>
                </div>

                {/* Change password card */}
                <div style={card}>
                    <h3 style={{ margin: '0 0 1.25rem 0', color: '#1f2937', fontSize: '0.95rem', fontWeight: 700 }}>
                        🔑 Change Password
                    </h3>

                    {pwSuccess && (
                        <div style={{ ...successNote, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ✅ {pwSuccess}
                        </div>
                    )}
                    {pwError && (
                        <div style={{ ...errorNote, marginBottom: '1rem' }}>
                            ⚠️ {pwError}
                        </div>
                    )}

                    <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Current Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    placeholder="Enter current password"
                                    style={{ ...inputStyle, paddingRight: '2.5rem' }}
                                />
                                <EyeBtn show={showCurrent} toggle={() => setShowCurrent((v) => !v)} />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="At least 8 characters"
                                    style={{ ...inputStyle, paddingRight: '2.5rem' }}
                                />
                                <EyeBtn show={showNew} toggle={() => setShowNew((v) => !v)} />
                            </div>
                            {/* Strength bar */}
                            {newPassword && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '3px', marginBottom: '0.25rem' }}>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} style={{
                                                flex: 1, height: '4px', borderRadius: '2px',
                                                background: i <= strength ? strengthColor : '#e5e7eb',
                                                transition: 'background 0.2s',
                                            }} />
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: strengthColor, fontWeight: 500 }}>
                                        {strengthLabel}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={labelStyle}>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Repeat new password"
                                style={{
                                    ...inputStyle,
                                    borderColor: confirmPassword && confirmPassword !== newPassword ? '#ef4444' : '#e5e7eb',
                                }}
                            />
                            {confirmPassword && confirmPassword !== newPassword && (
                                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.3rem' }}>
                                    Passwords do not match
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={pwLoading}
                            style={{
                                padding: '0.75rem',
                                background: pwLoading ? '#9ca3af' : '#1f2937',
                                color: 'white', border: 'none',
                                borderRadius: '8px', fontSize: '0.9rem',
                                fontWeight: 600, cursor: pwLoading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {pwLoading ? 'Changing…' : 'Change Password'}
                        </button>
                    </form>
                </div>

                {/* Security info */}
                <div style={{
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: '10px', padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#1e40af',
                }}>
                    <strong>🔒 Security tips:</strong>
                    <ul style={{ margin: '0.5rem 0 0 1rem', lineHeight: 1.8 }}>
                        <li>Use at least 12 characters with a mix of letters, numbers, and symbols</li>
                        <li>Never share your password with anyone</li>
                        {user?.role === 'Teacher' && <li>Your account locks after 3 failed login attempts</li>}
                    </ul>
                </div>
            </div>
        </Layout>
    );
};

const EyeBtn: React.FC<{ show: boolean; toggle: () => void }> = ({ show, toggle }) => (
    <button type="button" onClick={toggle} style={{
        position: 'absolute', right: '0.75rem', top: '50%',
        transform: 'translateY(-50%)', background: 'none',
        border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#9ca3af',
    }}>{show ? '🙈' : '👁'}</button>
);

const card: React.CSSProperties = {
    background: 'white', borderRadius: '12px',
    padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '0.4rem',
    fontSize: '0.82rem', fontWeight: 600, color: '#374151',
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.75rem',
    border: '1.5px solid #e5e7eb', borderRadius: '8px',
    fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none',
};

const saveBtnStyle = (disabled: boolean): React.CSSProperties => ({
    background: disabled ? '#9ca3af' : '#10b981',
    color: 'white', border: 'none', borderRadius: '8px',
    padding: '0 1.1rem', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.875rem', fontWeight: 600, flexShrink: 0,
});

const successNote: React.CSSProperties = {
    marginTop: '0.5rem', padding: '0.5rem 0.75rem',
    background: '#ecfdf5', color: '#059669',
    borderRadius: '6px', fontSize: '0.8rem',
};

const errorNote: React.CSSProperties = {
    marginTop: '0.5rem', padding: '0.5rem 0.75rem',
    background: '#fef2f2', color: '#dc2626',
    borderRadius: '6px', fontSize: '0.8rem',
};

export default Profile;
