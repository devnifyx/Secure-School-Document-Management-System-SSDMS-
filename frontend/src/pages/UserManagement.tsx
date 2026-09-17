import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import CustomSelect from '../components/CustomSelect';
import {
    Users,
    UserPlus,
    CheckCircle2,
    XCircle,
    Edit2,
    Trash2,
    Power,
    Shield,
    Layers,
    Star,
    X,
    Lock,
    Mail,
    User as UserIcon,
} from 'lucide-react';

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

const emptyForm = {
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'Teacher' as 'Admin' | 'Teacher',
    panitia_ids: [] as number[],
    primary_panitia_id: null as number | null,
};

const UserManagement: React.FC = () => {
    const { user: me } = useAuth();
    const { success, error: toastError } = useToast();

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

    // Confirmation dialog states
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [toggleTarget, setToggleTarget] = useState<User | null>(null);
    const [toggleLoading, setToggleLoading] = useState(false);

    const [rejectTarget, setRejectTarget] = useState<User | null>(null);
    const [rejectLoading, setRejectLoading] = useState(false);

    useEffect(() => {
        loadUsers();
        loadPanitia();
    }, []);

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

    const loadPanitia = async () => {
        try {
            const res = await api.get('/panitia');
            setPanitiaOptions(res.data);
        } catch { /* silent */ }
    };

    const openCreate = () => {
        setForm(emptyForm);
        setFormError('');
        setModal('create');
    };

    const openEdit = (u: User) => {
        setForm({
            name: u.name,
            email: u.email,
            username: u.username || '',
            password: '',
            role: u.role,
            panitia_ids: u.panitia?.map((p) => p.id) || [],
            primary_panitia_id: u.panitia?.find((p) => p.pivot.is_primary)?.id || null,
        });
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
        if (modal === 'create' && !form.username.trim()) {
            setFormError('Username is required.');
            return;
        }
        if (modal === 'create' && form.password.length < 8) {
            setFormError('Password must be at least 8 characters.');
            return;
        }

        setSaving(true);
        try {
            if (modal === 'create') {
                await api.post('/users', {
                    ...form,
                    primary_panitia_id: form.primary_panitia_id || (form.panitia_ids.length > 0 ? form.panitia_ids[0] : null),
                });
                success(`Created user "${form.name}" successfully.`);
            } else {
                const payload: any = {
                    name: form.name,
                    email: form.email,
                    username: form.username,
                    role: form.role,
                    panitia_ids: form.panitia_ids,
                    primary_panitia_id: form.primary_panitia_id || (form.panitia_ids.length > 0 ? form.panitia_ids[0] : null),
                };
                if (form.password) payload.password = form.password;
                await api.put(`/users/${editId}`, payload);
                success(`Updated user "${form.name}" successfully.`);
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

    const confirmToggleActive = async () => {
        if (!toggleTarget) return;
        if (toggleTarget.id === me?.id) {
            toastError('You cannot deactivate your own account.');
            setToggleTarget(null);
            return;
        }
        setToggleLoading(true);
        try {
            await api.put(`/users/${toggleTarget.id}`, { is_active: !toggleTarget.is_active });
            success(`User "${toggleTarget.name}" ${toggleTarget.is_active ? 'deactivated' : 'activated'}.`);
            setToggleTarget(null);
            loadUsers();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to update user status');
        } finally {
            setToggleLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        if (deleteTarget.id === me?.id) {
            toastError('You cannot delete your own account.');
            setDeleteTarget(null);
            return;
        }
        setDeleteLoading(true);
        try {
            await api.delete(`/users/${deleteTarget.id}`);
            success(`User "${deleteTarget.name}" deleted.`);
            setDeleteTarget(null);
            loadUsers();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to delete user');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleApprove = async (u: User) => {
        try {
            await api.post(`/users/${u.id}/approve`);
            success(`Approved registration for "${u.name}".`);
            loadUsers();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to approve');
        }
    };

    const confirmReject = async () => {
        if (!rejectTarget) return;
        setRejectLoading(true);
        try {
            await api.post(`/users/${rejectTarget.id}/reject`);
            success(`Registration rejected for "${rejectTarget.name}".`);
            setRejectTarget(null);
            loadUsers();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to reject registration');
        } finally {
            setRejectLoading(false);
        }
    };

    const togglePanitia = (id: number) => {
        setForm((prev) => {
            const ids = prev.panitia_ids.includes(id)
                ? prev.panitia_ids.filter((x) => x !== id)
                : [...prev.panitia_ids, id];
            const primary = ids.includes(prev.primary_panitia_id ?? -1)
                ? prev.primary_panitia_id
                : (ids[0] ?? null);
            return { ...prev, panitia_ids: ids, primary_panitia_id: primary };
        });
    };

    const filteredUsers = tab === 'pending'
        ? users.filter((u) => u.account_status === 'Pending')
        : users;
    const pendingCount = users.filter((u) => u.account_status === 'Pending').length;

    const statusBadge = (s: string) => {
        if (s === 'Approved') return <span className="badge badge-success"><CheckCircle2 size={11} /> Approved</span>;
        if (s === 'Rejected') return <span className="badge badge-danger"><XCircle size={11} /> Rejected</span>;
        return <span className="badge badge-warning">Pending Review</span>;
    };

    return (
        <Layout
            title="User Management"
            subtitle="Administer system staff, assign departmental Panitia, and approve new registrations"
            actions={
                <button className="btn btn-primary" onClick={openCreate}>
                    <UserPlus size={16} /> New User
                </button>
            }
        >
            {/* Segmented Tab Controls */}
            <div className="tab-group">
                <button
                    className={`tab-btn ${tab === 'all' ? 'active' : ''}`}
                    onClick={() => setTab('all')}
                >
                    <Users size={15} /> All Users ({users.length})
                </button>
                <button
                    className={`tab-btn ${tab === 'pending' ? 'active' : ''}`}
                    onClick={() => setTab('pending')}
                >
                    Pending Registrations
                    {pendingCount > 0 && (
                        <span className="badge badge-warning" style={{ fontSize: '0.66rem', marginLeft: '0.2rem' }}>
                            {pendingCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="panel">
                {loading ? (
                    <div style={{ padding: '1.5rem' }}>
                        <SkeletonTable rows={5} columns={6} />
                    </div>
                ) : error ? (
                    <div className="notice notice-danger">{error}</div>
                ) : filteredUsers.length === 0 ? (
                    <EmptyState
                        icon={<Users size={42} className="text-slate-400" />}
                        title="No users in this view"
                        description={tab === 'pending' ? 'No registration requests are awaiting approval.' : 'No users match criteria.'}
                    />
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Staff Member</th>
                                    <th>Email / Username</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Assigned Departments</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: u.role === 'Admin' ? 'var(--primary)' : 'var(--surface-alt)',
                                                    color: u.role === 'Admin' ? '#ffffff' : 'var(--text)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span>{u.name}</span>
                                                    {u.id === me?.id && (
                                                        <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                            (You)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{u.email}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.role === 'Admin' ? 'badge-info' : 'badge-neutral'}`}>
                                                <Shield size={11} /> {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                {statusBadge(u.account_status)}
                                                {u.account_status === 'Approved' && !u.is_active && (
                                                    <span className="badge badge-danger">Deactivated</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '200px' }}>
                                            {u.panitia && u.panitia.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                    {u.panitia.map((p) => (
                                                        <span
                                                            key={p.id}
                                                            className="badge badge-neutral"
                                                            style={{ fontSize: '0.68rem', gap: '0.25rem' }}
                                                        >
                                                            {p.name}
                                                            {p.pivot.is_primary && (
                                                                <Star size={10} style={{ color: 'var(--warning)', fill: 'currentColor' }} />
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {u.account_status === 'Pending' ? (
                                                <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(u)}>
                                                        <CheckCircle2 size={13} /> Approve
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => setRejectTarget(u)}>
                                                        <XCircle size={13} /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => openEdit(u)}
                                                        title="Edit User"
                                                    >
                                                        <Edit2 size={13} /> Edit
                                                    </button>
                                                    {u.id !== me?.id && (
                                                        <>
                                                            <button
                                                                className={`btn btn-sm ${u.is_active ? 'btn-secondary' : 'btn-success'}`}
                                                                onClick={() => setToggleTarget(u)}
                                                                title={u.is_active ? 'Deactivate user' : 'Activate user'}
                                                            >
                                                                <Power size={13} /> {u.is_active ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => setDeleteTarget(u)}
                                                                title="Delete user"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit User Modal */}
            {modal !== 'none' && (
                <div className="modal-overlay" onClick={() => setModal('none')}>
                    <div className="modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <UserIcon size={18} style={{ color: 'var(--primary)' }} />
                                {modal === 'create' ? 'Create New Staff User' : 'Edit User Profile'}
                            </h3>
                            <button className="modal-close" onClick={() => setModal('none')} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {formError && (
                                <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
                                    {formError}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    className="form-control"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Teacher or administrator name"
                                    autoFocus
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Email Address <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                            <Mail size={15} />
                                        </div>
                                        <input
                                            className="form-control"
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="email@school.edu"
                                            style={{ paddingLeft: '2.4rem' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Username <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input
                                        className="form-control"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                        placeholder="username"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Password {modal === 'edit' ? <span className="form-hint">(leave blank to keep current)</span> : <span style={{ color: 'var(--danger)' }}>*</span>}
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                                        <Lock size={15} />
                                    </div>
                                    <input
                                        className="form-control"
                                        type="password"
                                        value={form.password}
                                        placeholder={modal === 'edit' ? 'Unchanged' : 'Minimum 8 characters'}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        style={{ paddingLeft: '2.4rem' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <CustomSelect
                                    options={[
                                        {
                                            value: 'Teacher',
                                            label: 'Teacher',
                                            sublabel: 'Standard access to assigned panitia documents & reports',
                                            icon: <UserIcon size={16} />
                                        },
                                        {
                                            value: 'Admin',
                                            label: 'Admin',
                                            sublabel: 'Full system administrative & user management access',
                                            icon: <Shield size={16} />
                                        },
                                    ]}
                                    value={form.role}
                                    onChange={(val) => setForm({ ...form, role: val as 'Admin' | 'Teacher' })}
                                />
                            </div>

                            {form.role === 'Teacher' && (
                                <div className="form-group">
                                    <label className="form-label">Assigned Departments (Panitia)</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {panitiaOptions.filter((p) => p.status === 'active').map((p) => {
                                            const isChecked = form.panitia_ids.includes(p.id);
                                            const isPrimary = form.primary_panitia_id === p.id;
                                            return (
                                                <div
                                                    key={p.id}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        padding: '0.4rem 0.75rem',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)',
                                                        background: isChecked ? 'var(--primary-soft)' : '#ffffff',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => togglePanitia(p.id)}
                                                >
                                                    <Layers size={13} style={{ color: isChecked ? 'var(--primary)' : 'var(--text-muted)' }} />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: isChecked ? 600 : 400 }}>
                                                        {p.name}
                                                    </span>
                                                    {isChecked && (
                                                        <button
                                                            type="button"
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '0 0.2rem',
                                                                color: isPrimary ? 'var(--primary)' : 'var(--text-muted)',
                                                                fontWeight: isPrimary ? 700 : 400,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setForm({ ...form, primary_panitia_id: p.id });
                                                            }}
                                                            title="Set as primary"
                                                        >
                                                            <Star size={12} style={{ fill: isPrimary ? 'currentColor' : 'none' }} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <span className="form-hint" style={{ marginTop: '0.35rem', display: 'block' }}>
                                        Click a department to assign. Click the star to set as primary.
                                    </span>
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

            {/* Confirm Deactivation / Activation Modal */}
            <ConfirmModal
                isOpen={toggleTarget !== null}
                title={`${toggleTarget?.is_active ? 'Deactivate' : 'Activate'} User Account`}
                message={`Are you sure you want to ${toggleTarget?.is_active ? 'deactivate' : 'activate'} "${toggleTarget?.name}"? ${toggleTarget?.is_active ? 'They will no longer be able to log in to the system.' : 'They will regain system access.'}`}
                confirmText={toggleTarget?.is_active ? 'Deactivate Account' : 'Activate Account'}
                isDanger={toggleTarget?.is_active}
                onConfirm={confirmToggleActive}
                onCancel={() => setToggleTarget(null)}
                loading={toggleLoading}
            />

            {/* Confirm Delete User Modal */}
            <ConfirmModal
                isOpen={deleteTarget !== null}
                title="Delete User Account"
                message={`Permanently delete user "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmText="Delete User"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteLoading}
            />

            {/* Confirm Reject Registration Modal */}
            <ConfirmModal
                isOpen={rejectTarget !== null}
                title="Reject Registration"
                message={`Reject the pending registration request for "${rejectTarget?.name}" (${rejectTarget?.email})?`}
                confirmText="Reject Registration"
                isDanger={true}
                onConfirm={confirmReject}
                onCancel={() => setRejectTarget(null)}
                loading={rejectLoading}
            />
        </Layout>
    );
};

export default UserManagement;
