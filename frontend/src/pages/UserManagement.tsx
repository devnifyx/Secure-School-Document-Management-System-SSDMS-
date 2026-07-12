import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Teacher';
    is_active: boolean;
    created_at: string;
}

const emptyForm = { name: '', email: '', password: '', role: 'Teacher' as 'Admin' | 'Teacher' };

const UserManagement: React.FC = () => {
    const { user: me } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [modal, setModal] = useState<'none' | 'create' | 'edit'>('none');
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setForm(emptyForm);
        setFormError('');
        setModal('create');
    };

    const openEdit = (u: User) => {
        setForm({ name: u.name, email: u.email, password: '', role: u.role });
        setEditId(u.id);
        setFormError('');
        setModal('edit');
    };

    const handleSave = async () => {
        setFormError('');
        if (!form.name.trim() || !form.email.trim()) {
            setFormError('Name and email are required.');
            return;
        }
        if (modal === 'create' && form.password.length < 8) {
            setFormError('Password must be at least 8 characters.');
            return;
        }
        setSaving(true);
        try {
            if (modal === 'create') {
                await api.post('/users', form);
            } else {
                const payload: any = { name: form.name, email: form.email, role: form.role };
                if (form.password) payload.password = form.password;
                await api.put(`/users/${editId}`, payload);
            }
            setModal('none');
            loadUsers();
        } catch (e: any) {
            const msg = e.response?.data?.message || e.response?.data?.errors;
            setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (u: User) => {
        if (u.id === me?.id) { alert("You cannot deactivate your own account."); return; }
        try {
            await api.put(`/users/${u.id}`, { is_active: !u.is_active });
            loadUsers();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to update user');
        }
    };

    const handleDelete = async (u: User) => {
        if (u.id === me?.id) { alert("You cannot delete your own account."); return; }
        if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/users/${u.id}`);
            loadUsers();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to delete user');
        }
    };

    const roleColor = (role: string) => role === 'Admin' ? '#9b59b6' : '#3498db';

    return (
        <Layout title="User Management">
            <div style={{
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                overflow: 'hidden',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #f0f0f0',
                }}>
                    <span style={{ color: '#666', fontSize: '0.875rem' }}>{users.length} users total</span>
                    <button
                        onClick={openCreate}
                        style={{
                            background: '#2c3e50',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1.1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                        }}
                    >
                        + New User
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>Loading…</div>
                ) : error ? (
                    <div style={{ padding: '2rem', color: '#e74c3c', textAlign: 'center' }}>{error}</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                                        <th key={h} style={{
                                            padding: '0.75rem 1rem',
                                            textAlign: 'left',
                                            color: '#666',
                                            fontWeight: 600,
                                            borderBottom: '1px solid #eee',
                                            whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '0.85rem 1rem', fontWeight: 500, color: '#333' }}>
                                            {u.name}
                                            {u.id === me?.id && (
                                                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#999' }}>(you)</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', color: '#555' }}>{u.email}</td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <span style={{
                                                background: roleColor(u.role) + '22',
                                                color: roleColor(u.role),
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <span style={{
                                                background: u.is_active ? '#27ae6022' : '#e74c3c22',
                                                color: u.is_active ? '#27ae60' : '#e74c3c',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                            }}>
                                                {u.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', color: '#999', whiteSpace: 'nowrap' }}>
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => openEdit(u)}
                                                    style={btnStyle('#3498db')}
                                                >Edit</button>
                                                <button
                                                    onClick={() => toggleActive(u)}
                                                    style={btnStyle(u.is_active ? '#f39c12' : '#27ae60')}
                                                >
                                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                {u.id !== me?.id && (
                                                    <button
                                                        onClick={() => handleDelete(u)}
                                                        style={btnStyle('#e74c3c')}
                                                    >Delete</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal !== 'none' && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '10px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '440px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    }}>
                        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>
                            {modal === 'create' ? 'Create New User' : 'Edit User'}
                        </h3>

                        {formError && (
                            <div style={{
                                background: '#fee', color: '#c33',
                                padding: '0.75rem', borderRadius: '6px',
                                marginBottom: '1rem', fontSize: '0.875rem',
                            }}>{formError}</div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Name</label>
                                <input style={inputStyle} value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input style={inputStyle} type="email" value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    Password {modal === 'edit' && <span style={{ color: '#999', fontSize: '0.8rem' }}>(leave blank to keep)</span>}
                                </label>
                                <input style={inputStyle} type="password" value={form.password}
                                    placeholder={modal === 'edit' ? 'Leave blank to keep current' : 'Min 8 characters'}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Role</label>
                                <select style={inputStyle} value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value as 'Admin' | 'Teacher' })}>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => setModal('none')}
                                style={{
                                    background: '#f0f0f0', border: 'none', padding: '0.6rem 1.2rem',
                                    borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem',
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    background: '#2c3e50', color: 'white', border: 'none',
                                    padding: '0.6rem 1.2rem', borderRadius: '6px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem', opacity: saving ? 0.7 : 1,
                                }}
                            >
                                {saving ? 'Saving…' : (modal === 'create' ? 'Create User' : 'Save Changes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

const btnStyle = (bg: string): React.CSSProperties => ({
    background: bg + '18',
    color: bg,
    border: `1px solid ${bg}44`,
    padding: '0.3rem 0.7rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
});

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.4rem',
    color: '#555',
    fontSize: '0.875rem',
    fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
};

export default UserManagement;
