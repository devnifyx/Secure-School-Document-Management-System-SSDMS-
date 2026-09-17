import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import CustomSelect from '../components/CustomSelect';
import {
    Layers,
    Users,
    Plus,
    Edit2,
    Power,
    Star,
    Trash2,
    UserPlus,
    X,
} from 'lucide-react';

interface PanitiaItem {
    id: number;
    name: string;
    status: 'active' | 'inactive';
    users_count: number;
}

interface Member {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    pivot: { is_primary: boolean };
}

interface TeacherOption {
    id: number;
    name: string;
    email: string;
}

const PanitiaManagement: React.FC = () => {
    const { success, error: toastError } = useToast();

    const [panitia, setPanitia] = useState<PanitiaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editItem, setEditItem] = useState<PanitiaItem | null>(null);
    const [formName, setFormName] = useState('');
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const [selectedPanitia, setSelectedPanitia] = useState<PanitiaItem | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [assignUserId, setAssignUserId] = useState('');
    const [assignPrimary, setAssignPrimary] = useState(false);

    // Confirm remove member
    const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
    const [removeLoading, setRemoveLoading] = useState(false);

    const fetchPanitia = async () => {
        try {
            const res = await api.get('/panitia');
            setPanitia(res.data);
            if (!selectedPanitia && res.data.length > 0) {
                setSelectedPanitia(res.data[0]);
                fetchMembers(res.data[0].id);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const fetchMembers = async (id: number) => {
        setMembersLoading(true);
        try {
            const res = await api.get(`/panitia/${id}/members`);
            setMembers(res.data);
        } catch { /* silent */ }
        finally { setMembersLoading(false); }
    };

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/users', { params: { account_status: 'Approved' } });
            setTeachers(res.data.filter((u: any) => u.role === 'Teacher'));
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchPanitia();
        fetchTeachers();
    }, []);

    const handleCreate = async () => {
        setSaving(true);
        setFormError('');
        try {
            await api.post('/panitia', { name: formName.trim() });
            success(`Department "${formName}" created.`);
            setFormName('');
            setShowCreate(false);
            fetchPanitia();
        } catch (e: any) {
            setFormError(e.response?.data?.message || 'Failed to create department.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!editItem) return;
        setSaving(true);
        setFormError('');
        try {
            await api.put(`/panitia/${editItem.id}`, { name: formName.trim() });
            success(`Department renamed to "${formName}".`);
            setEditItem(null);
            setFormName('');
            fetchPanitia();
        } catch (e: any) {
            setFormError(e.response?.data?.message || 'Failed to update department.');
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (item: PanitiaItem) => {
        const newStatus = item.status === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`/panitia/${item.id}`, { status: newStatus });
            success(`Department "${item.name}" marked as ${newStatus}.`);
            fetchPanitia();
            if (selectedPanitia?.id === item.id) {
                setSelectedPanitia({ ...item, status: newStatus });
            }
        } catch {
            toastError('Failed to change status.');
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPanitia || !assignUserId) return;
        try {
            await api.post(`/panitia/${selectedPanitia.id}/assign`, {
                user_id: Number(assignUserId),
                is_primary: assignPrimary,
            });
            success('Teacher assigned to department successfully.');
            setAssignUserId('');
            setAssignPrimary(false);
            fetchMembers(selectedPanitia.id);
            fetchPanitia();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to assign teacher.');
        }
    };

    const confirmRemove = async () => {
        if (!selectedPanitia || !removeTarget) return;
        setRemoveLoading(true);
        try {
            await api.delete(`/panitia/${selectedPanitia.id}/members/${removeTarget.id}`);
            success(`Removed ${removeTarget.name} from ${selectedPanitia.name}.`);
            setRemoveTarget(null);
            fetchMembers(selectedPanitia.id);
            fetchPanitia();
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to remove member.');
        } finally {
            setRemoveLoading(false);
        }
    };

    const handleSetPrimary = async (userId: number) => {
        if (!selectedPanitia) return;
        try {
            await api.put(`/panitia/${selectedPanitia.id}/members/${userId}/primary`);
            success(`Designated ${selectedPanitia.name} as primary department.`);
            fetchMembers(selectedPanitia.id);
        } catch (e: any) {
            toastError(e.response?.data?.message || 'Failed to set primary.');
        }
    };

    const openMembers = (item: PanitiaItem) => {
        setSelectedPanitia(item);
        fetchMembers(item.id);
    };

    const availableTeachers = teachers.filter(
        (t) => !members.some((m) => m.id === t.id)
    );

    return (
        <Layout
            title="Subject Department (Panitia) Management"
            subtitle="Organize academic divisions, designate department heads, and assign teachers"
            actions={
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setShowCreate(true);
                        setFormName('');
                        setFormError('');
                    }}
                >
                    <Plus size={16} /> Create Department
                </button>
            }
        >
            {/* Create / Edit Modal */}
            {(showCreate || editItem) && (
                <div className="modal-overlay" onClick={() => { setShowCreate(false); setEditItem(null); }}>
                    <div className="modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <Layers size={18} style={{ color: 'var(--primary)' }} />
                                {editItem ? 'Edit Department' : 'Create New Department'}
                            </h3>
                            <button className="modal-close" onClick={() => { setShowCreate(false); setEditItem(null); }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {formError && <div className="notice notice-danger" style={{ marginBottom: '1rem' }}>{formError}</div>}
                            <div className="form-group">
                                <label className="form-label">Department / Panitia Name</label>
                                <input
                                    className="form-control"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Science Department, Panitia Sejarah"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                disabled={saving || !formName.trim()}
                                onClick={editItem ? handleUpdate : handleCreate}
                            >
                                {saving ? 'Saving…' : (editItem ? 'Save Changes' : 'Create Department')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ padding: '1.5rem' }}>
                    <SkeletonTable rows={5} columns={4} />
                </div>
            ) : (
                <div className="dashboard-grid">
                    {/* Left Column: Panitia Table */}
                    <div className="panel">
                        <div className="panel-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Layers size={17} style={{ color: 'var(--primary)' }} />
                                <strong>All Subject Departments</strong>
                                <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                                    {panitia.length}
                                </span>
                            </div>
                        </div>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Department Name</th>
                                        <th>Status</th>
                                        <th>Teachers</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {panitia.map((p) => {
                                        const isSelected = selectedPanitia?.id === p.id;
                                        return (
                                            <tr
                                                key={p.id}
                                                style={{
                                                    cursor: 'pointer',
                                                    background: isSelected ? 'var(--primary-soft)' : undefined,
                                                }}
                                                onClick={() => openMembers(p)}
                                            >
                                                <td style={{ fontWeight: 600 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Layers size={15} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
                                                        <span>{p.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <Users size={13} style={{ color: 'var(--text-muted)' }} />
                                                        <span>{p.users_count}</span>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                                    <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => { setEditItem(p); setFormName(p.name); setFormError(''); }}
                                                            title="Rename"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            className={`btn btn-sm ${p.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
                                                            onClick={() => toggleStatus(p)}
                                                            title={p.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        >
                                                            <Power size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column: Member Assignment */}
                    <div className="panel">
                        <div className="panel-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={17} style={{ color: 'var(--primary)' }} />
                                <strong>
                                    {selectedPanitia ? `${selectedPanitia.name} Members` : 'Department Members'}
                                </strong>
                            </div>
                        </div>
                        <div className="panel-body">
                            {!selectedPanitia ? (
                                <EmptyState
                                    icon={<Layers size={36} className="text-slate-400" />}
                                    title="Select a Department"
                                    description="Click on any subject department on the left to inspect or assign teachers."
                                />
                            ) : membersLoading ? (
                                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Loading members…
                                </div>
                            ) : (
                                <>
                                    {/* Assign Form */}
                                    <form onSubmit={handleAssign} style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                                        <label className="form-label" style={{ fontSize: '0.82rem' }}>
                                            Assign Teacher to {selectedPanitia.name}
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                            <CustomSelect
                                                options={availableTeachers.map((t) => ({
                                                    value: String(t.id),
                                                    label: t.name,
                                                    sublabel: t.email,
                                                }))}
                                                value={assignUserId}
                                                onChange={(val) => setAssignUserId(val)}
                                                placeholder="Select teacher to assign…"
                                                clearable={true}
                                                searchable={true}
                                                style={{ flex: 1, minWidth: '220px' }}
                                            />
                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-sm"
                                                disabled={!assignUserId}
                                            >
                                                <UserPlus size={14} /> Assign
                                            </button>
                                        </div>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={assignPrimary}
                                                onChange={(e) => setAssignPrimary(e.target.checked)}
                                            />
                                            <span>Designate as their Primary Department</span>
                                        </label>
                                    </form>

                                    {/* Member Roster List */}
                                    {members.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0', fontSize: '0.84rem' }}>
                                            No teachers currently assigned to this department.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {members.map((m) => (
                                                <div
                                                    key={m.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '0.75rem 0.95rem',
                                                        background: 'var(--surface-alt)',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid var(--border)',
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text)' }}>
                                                            {m.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                                            {m.email}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        {m.pivot.is_primary ? (
                                                            <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                                                                <Star size={10} style={{ fill: 'currentColor' }} /> Primary
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary btn-sm"
                                                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                                                                onClick={() => handleSetPrimary(m.id)}
                                                                title="Set as teacher's primary department"
                                                            >
                                                                Make Primary
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm"
                                                            style={{ padding: '0.3rem 0.5rem' }}
                                                            onClick={() => setRemoveTarget(m)}
                                                            title="Remove member"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Remove Member Dialog */}
            <ConfirmModal
                isOpen={removeTarget !== null}
                title="Remove Department Member"
                message={`Remove "${removeTarget?.name}" from ${selectedPanitia?.name}? They can be re-assigned at any time.`}
                confirmText="Remove Member"
                isDanger={true}
                onConfirm={confirmRemove}
                onCancel={() => setRemoveTarget(null)}
                loading={removeLoading}
            />
        </Layout>
    );
};

export default PanitiaManagement;
