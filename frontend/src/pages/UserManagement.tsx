import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface PanitiaRef {
    id: number;
    name: string;
    pivot: { is_primary: boolean };
}

interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    role: 'Admin' | 'Teacher';
    is_active: boolean;
    account_status: 'Pending' | 'Approved' | 'Rejected';
    created_at: string;
    panitia: PanitiaRef[];
}

interface PanitiaOption { id: number; name: string; status: string; }

const emptyForm = { name: '', email: '', username: '', password: '', role: 'Teacher' as 'Admin' | 'Teacher', panitia_ids: [] as number[], primary_panitia_id: null as number | null };

const UserManagement: React.FC = () => {
    const { user: me } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'all' | 'pending'>('all');

    const [modal, setModal] = useState<'none' | 'create' | 'edit'>('none');
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [panitiaOptions, setPanitiaOptions] = useState<PanitiaOption[]>([]);

    useEffect(() => { loadUsers(); loadPanitia(); }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load users');
        } finally { setLoading(false); }
    };

    const loadPanitia = async () => {
        try {
            const res = await api.get('/panitia');
            setPanitiaOptions(res.data);
        } catch { /* silent */ }
    };

    const openCreate = () => { setForm(emptyForm); setFormError(''); setModal('create'); };
    const openEdit = (u: User) => {
        setForm({
            name: u.name, email: u.email, username: u.username || '', password: '', role: u.role,
            panitia_ids: u.panitia?.map((p) => p.id) || [],
            primary_panitia_id: u.panitia?.find((p) => p.pivot.is_primary)?.id || null,
        });
        setEditId(u.id); setFormError(''); setModal('edit');
    };

    const handleSave = async () => {
        setFormError('');
        if (!form.name.trim() || !form.email.trim()) { setFormError('Name and email are required.'); return; }
        if (modal === 'create' && !form.username.trim()) { setFormError('Username is required.'); return; }
        if (modal === 'create' && form.password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
        setSaving(true);
        try {
            if (modal === 'create') {
                await api.post('/users', {
                    ...form,
                    primary_panitia_id: form.primary_panitia_id || (form.panitia_ids.length > 0 ? form.panitia_ids[0] : null),
                });
            } else {
                const payload: any = {
                    name: form.name, email: form.email, username: form.username, role: form.role,
                    panitia_ids: form.panitia_ids,
                    primary_panitia_id: form.primary_panitia_id || (form.panitia_ids.length > 0 ? form.panitia_ids[0] : null),
                };
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

    const handleApprove = async (u: User) => {
        try { await api.post(`/users/${u.id}/approve`); loadUsers(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed to approve'); }
    };

    const handleReject = async (u: User) => {
        if (!confirm(`Reject registration for "${u.name}"?`)) return;
        try { await api.post(`/users/${u.id}/reject`); loadUsers(); }
        catch (e: any) { alert(e.response?.data?.message || 'Failed to reject'); }
    };

    const togglePanitia = (id: number) => {
        setForm((prev) => {
            const ids = prev.panitia_ids.includes(id)
                ? prev.panitia_ids.filter((x) => x !== id)
                : [...prev.panitia_ids, id];
            const primary = ids.includes(prev.primary_panitia_id ?? -1) ? prev.primary_panitia_id : (ids[0] ?? null);
            return { ...prev, panitia_ids: ids, primary_panitia_id: primary };
        });
    };

    const filteredUsers = tab === 'pending'
        ? users.filter((u) => u.account_status === 'Pending')
        : users;
    const pendingCount = users.filter((u) => u.account_status === 'Pending').length;

    const statusBadge = (s: string) => {
        if (s === 'Approved') return 'badge-success';
        if (s === 'Rejected') return 'badge-danger';
        return 'badge-warning';
    };

    return (
        <Layout
            title="User Management"
            subtitle="Create, edit, and manage staff accounts and roles"
            actions={<button className="btn btn-primary" onClick={openCreate}>+ New User</button>}
        >
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('all')}>
                    All Users ({users.length})
                </button>
                <button className={`btn btn-sm ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('pending')}>
                    Pending Approval {pendingCount > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.3rem' }}>{pendingCount}</span>}
                </button>
            </div>

            <div className="panel">
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
                                    <th>Account</th>
                                    <th>Panitia</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={6} className="table-empty">No users found</td></tr>
                                ) : filteredUsers.map((u) => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 600 }}>
                                            {u.name}
                                            {u.id === me?.id && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>(you)</span>}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{u.email}</td>
                                        <td><span className={`badge ${u.role === 'Admin' ? 'badge-info' : 'badge-neutral'}`}>{u.role}</span></td>
                                        <td>
                                            <span className={`badge ${statusBadge(u.account_status)}`}>{u.account_status}</span>
                                            {u.account_status === 'Approved' && !u.is_active && (
                                                <span className="badge badge-danger" style={{ marginLeft: '0.3rem' }}>Deactivated</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.75rem', maxWidth: '180px' }}>
                                            {u.panitia && u.panitia.length > 0
                                                ? u.panitia.map((p) => (
                                                    <span key={p.id} className="badge badge-neutral" style={{ marginRight: '0.2rem', marginBottom: '0.15rem' }}>
                                                        {p.name}{p.pivot.is_primary ? ' ★' : ''}
                                                    </span>
                                                  ))
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            {u.account_status === 'Pending' ? (
                                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(u)}>Approve</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(u)}>Reject</button>
                                                </div>
                                            ) : (
                                                <>
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
                    <div className="modal-box" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
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
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Username</label>
                                    <input className="form-control" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                                </div>
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
                            {form.role === 'Teacher' && (
                                <div className="form-group">
                                    <label className="form-label">Assigned Panitia</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {panitiaOptions.filter((p) => p.status === 'active').map((p) => (
                                            <label key={p.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                                fontSize: '0.78rem', padding: '0.3rem 0.6rem',
                                                background: form.panitia_ids.includes(p.id) ? 'var(--primary-soft)' : 'var(--bg)',
                                                borderRadius: '6px', cursor: 'pointer',
                                                border: form.panitia_ids.includes(p.id) ? '1px solid var(--primary)' : '1px solid var(--border)',
                                            }}>
                                                <input type="checkbox" checked={form.panitia_ids.includes(p.id)}
                                                    onChange={() => togglePanitia(p.id)} style={{ display: 'none' }} />
                                                {p.name}
                                                {form.panitia_ids.includes(p.id) && (
                                                    <button type="button" style={{
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        fontSize: '0.65rem', padding: 0, marginLeft: '0.2rem',
                                                        color: form.primary_panitia_id === p.id ? 'var(--primary)' : 'var(--text-muted)',
                                                        fontWeight: form.primary_panitia_id === p.id ? 700 : 400,
                                                    }} onClick={(e) => { e.preventDefault(); setForm({ ...form, primary_panitia_id: p.id }); }}
                                                        title="Set as primary">
                                                        {form.primary_panitia_id === p.id ? '★ Primary' : '☆'}
                                                    </button>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
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
