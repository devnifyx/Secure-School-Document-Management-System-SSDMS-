import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

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

    const fetchPanitia = async () => {
        try {
            const res = await api.get('/panitia');
            setPanitia(res.data);
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

    useEffect(() => { fetchPanitia(); fetchTeachers(); }, []);

    const handleCreate = async () => {
        setSaving(true); setFormError('');
        try {
            await api.post('/panitia', { name: formName });
            setFormName(''); setShowCreate(false);
            fetchPanitia();
        } catch (e: any) {
            setFormError(e.response?.data?.message || 'Failed to create.');
        } finally { setSaving(false); }
    };

    const handleUpdate = async () => {
        if (!editItem) return;
        setSaving(true); setFormError('');
        try {
            await api.put(`/panitia/${editItem.id}`, { name: formName });
            setEditItem(null); setFormName('');
            fetchPanitia();
        } catch (e: any) {
            setFormError(e.response?.data?.message || 'Failed to update.');
        } finally { setSaving(false); }
    };

    const toggleStatus = async (item: PanitiaItem) => {
        const newStatus = item.status === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`/panitia/${item.id}`, { status: newStatus });
            fetchPanitia();
            if (selectedPanitia?.id === item.id) {
                setSelectedPanitia({ ...item, status: newStatus });
            }
        } catch { /* silent */ }
    };

    const handleAssign = async () => {
        if (!selectedPanitia || !assignUserId) return;
        try {
            await api.post(`/panitia/${selectedPanitia.id}/assign`, {
                user_id: Number(assignUserId),
                is_primary: assignPrimary,
            });
            setAssignUserId(''); setAssignPrimary(false);
            fetchMembers(selectedPanitia.id);
            fetchPanitia();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to assign.');
        }
    };

    const handleRemove = async (userId: number) => {
        if (!selectedPanitia || !confirm('Remove this member from the Panitia?')) return;
        try {
            await api.delete(`/panitia/${selectedPanitia.id}/members/${userId}`);
            fetchMembers(selectedPanitia.id);
            fetchPanitia();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to remove.');
        }
    };

    const handleSetPrimary = async (userId: number) => {
        if (!selectedPanitia) return;
        try {
            await api.put(`/panitia/${selectedPanitia.id}/members/${userId}/primary`);
            fetchMembers(selectedPanitia.id);
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to set primary.');
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
        <Layout title="Panitia Management" subtitle="Manage subject departments and member assignments."
            actions={<button className="btn btn-primary" onClick={() => { setShowCreate(true); setFormName(''); setFormError(''); }}>+ Create Panitia</button>}>

            {(showCreate || editItem) && (
                <div className="modal-overlay" onClick={() => { setShowCreate(false); setEditItem(null); }}>
                    <div className="modal-box" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editItem ? 'Edit Panitia' : 'Create Panitia'}</h3>
                            <button className="modal-close" onClick={() => { setShowCreate(false); setEditItem(null); }}>×</button>
                        </div>
                        <div className="modal-body">
                            {formError && <div className="notice notice-danger" style={{ marginBottom: '1rem' }}>{formError}</div>}
                            <div className="form-group">
                                <label className="form-label">Panitia Name</label>
                                <input className="form-control" value={formName} onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Bahasa Melayu" autoFocus />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary btn-sm" onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</button>
                            <button className="btn btn-primary btn-sm" disabled={saving || !formName.trim()}
                                onClick={editItem ? handleUpdate : handleCreate}>
                                {saving ? 'Saving…' : (editItem ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="empty-state"><div className="icon">⏳</div>Loading…</div>
            ) : (
                <div className="dashboard-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="panel">
                            <div className="panel-header"><h3>All Panitia</h3></div>
                            <div className="table-wrap">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Status</th>
                                            <th>Members</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {panitia.map((p) => (
                                            <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => openMembers(p)}>
                                                <td style={{ fontWeight: 600 }}>{p.name}</td>
                                                <td>
                                                    <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td>{p.users_count}</td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditItem(p); setFormName(p.name); setFormError(''); }}>
                                                            Edit
                                                        </button>
                                                        <button className={`btn btn-sm ${p.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                                                            onClick={() => toggleStatus(p)}>
                                                            {p.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="panel">
                            <div className="panel-header">
                                <h3>{selectedPanitia ? `Members: ${selectedPanitia.name}` : 'Select a Panitia'}</h3>
                            </div>
                            <div className="panel-body">
                                {!selectedPanitia ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem', padding: '1.5rem 0' }}>
                                        Click a Panitia to view and manage its members.
                                    </div>
                                ) : membersLoading ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>Loading…</div>
                                ) : (
                                    <>
                                        {members.length === 0 ? (
                                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem', padding: '1rem 0' }}>
                                                No members assigned yet.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                                {members.map((m) => (
                                                    <div key={m.id} style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '0.6rem 0.75rem', background: 'var(--bg)', borderRadius: '8px',
                                                    }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.83rem' }}>{m.name}</div>
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.email}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            {m.pivot.is_primary ? (
                                                                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Primary</span>
                                                            ) : (
                                                                <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}
                                                                    onClick={() => handleSetPrimary(m.id)}>Set Primary</button>
                                                            )}
                                                            <button className="btn btn-danger btn-sm" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}
                                                                onClick={() => handleRemove(m.id)}>Remove</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.5rem' }}>Assign Teacher</div>
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <select className="form-control" style={{ flex: '1', minWidth: '140px' }}
                                                    value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}>
                                                    <option value="">Select teacher…</option>
                                                    {availableTeachers.map((t) => (
                                                        <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                                                    ))}
                                                </select>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                    <input type="checkbox" checked={assignPrimary} onChange={(e) => setAssignPrimary(e.target.checked)} />
                                                    Primary
                                                </label>
                                                <button className="btn btn-primary btn-sm" disabled={!assignUserId} onClick={handleAssign}>
                                                    Assign
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default PanitiaManagement;
