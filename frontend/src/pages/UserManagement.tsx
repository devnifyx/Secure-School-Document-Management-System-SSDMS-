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
        } finally { setLoading(false); }
    };

    const openCreate = () => { setForm(emptyForm); setFormError(''); setModal('create'); };
    const openEdit = (u: User) => {
        setForm({ name: u.name, email: u.email, password: '', role: u.role });
        setEditId(u.id); setFormError(''); setModal('edit');
    };

    const handleSave = async () => {
        setFormError('');
        if (!form.name.trim() || !form.email.trim()) { setFormError('Name and email are required.'); return; }
        if (modal === 'create' && form.password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
        setSaving(true);
        try {
            if (modal === 'create') {
                await api.post('/users', form);
            } else {
                const payload: any = { name: form.name, email: form.email, role: form.role };
                if (form.password) payload.password = form.password;
                await api.put(`/users/${editId}`, payload);
            }
            setModal('none'); loadUsers();
        } catch (e: any) {
            const msg = e.response?.data?.message || e.response?.data?.errors;
            setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally { setSaving(false); }
    };

    const toggleActive = async (u: User) => {
        if (u.id === me?.id) { alert('You cannot deactivate your own account.'); return; }
        try { await api.put(`/users/${u.id}`, { is_active: !u.is_active }); loadUsers(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed to update user'); }
    };

    const handleDelete = async (u: User) => {
        if (u.id === me?.id) { alert('You cannot delete your own account.'); return; }
        if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
        try { await api.delete(`/users/${u.id}`); loadUsers(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed to delete user'); }
    };

    return (
        <Layout
            title="User Management"
            subtitle="Create, edit, and manage staff accounts and roles"
            actions={<button className="btn btn-primary" onClick={openCreate}>+ New User</button>}
        >
            <div className="panel">
                <div style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {users.length} user{users.length !== 1 ? 's' : ''} total
                </div>

                {loading ? (
                    <div className="empty-state"><div className="icon">⏳</div>Loading users…</div>
                ) : error ? (
                    <div className="notice notice-danger" style={{ margin: '1.25rem' }}>{error}</div>
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 600 }}>
                                            {u.name}
                                            {u.id === me?.id && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>(you)</span>}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                        <td><span className={`badge ${u.role === 'Admin' ? 'badge-info' : 'badge-neutral'}`}>{u.role}</span></td>
                                        <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="row-action" onClick={() => openEdit(u)}>Edit</button>
                                            {' '}·{' '}
                                            <button className="row-action" onClick={() => toggleActive(u)}>
                                                {u.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            {u.id !== me?.id && (
                                                <>
                                                    {' '}·{' '}
                                                    <button className="row-action danger" onClick={() => handleDelete(u)}>Delete</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modal !== 'none' && (
                <div className="modal-overlay" onClick={() => setModal('none')}>
                    <div className="modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modal === 'create' ? 'Create New User' : 'Edit User'}</h3>
                            <button className="modal-close" onClick={() => setModal('none')}>×</button>
                        </div>
                        <div className="modal-body">
                            {formError && <div className="notice notice-danger" style={{ marginBottom: '1rem' }}>{formError}</div>}
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Password {modal === 'edit' && <span className="form-hint">(leave blank to keep current)</span>}
                                </label>
                                <input className="form-control" type="password" value={form.password}
                                    placeholder={modal === 'edit' ? 'Leave blank to keep current' : 'Min 8 characters'}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'Admin' | 'Teacher' })}>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setModal('none')}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving…' : (modal === 'create' ? 'Create User' : 'Save Changes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default UserManagement;
