import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PanitiaSelection: React.FC = () => {
    const { panitiaList, selectPanitia, user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState<number | null>(null);
    const [error, setError] = React.useState('');

    const handleSelect = async (panitiaId: number) => {
        setLoading(panitiaId);
        setError('');
        try {
            await selectPanitia(panitiaId);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to select Panitia.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
            padding: '1.5rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
                <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem',
                }}>🏫</div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>SSDMS</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Welcome, {user?.name}</div>
                </div>
            </div>

            <div className="panel" style={{ width: '100%', maxWidth: '440px' }}>
                <div className="panel-body">
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.2rem' }}>
                        Select Active Panitia
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        You are assigned to multiple Panitia. Choose which one to work in.
                    </div>

                    {error && <div className="notice notice-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {panitiaList.map((p) => (
                            <button
                                key={p.id}
                                className="btn btn-secondary"
                                style={{
                                    width: '100%', textAlign: 'left', padding: '0.85rem 1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}
                                disabled={loading !== null}
                                onClick={() => handleSelect(p.id)}
                            >
                                <span>
                                    <strong>{p.name}</strong>
                                    {p.pivot?.is_primary && (
                                        <span className="badge badge-info" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>Primary</span>
                                    )}
                                </span>
                                {loading === p.id ? (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading…</span>
                                ) : (
                                    <span style={{ fontSize: '0.85rem' }}>→</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                        <button className="btn-link" onClick={logout} style={{ fontSize: '0.82rem' }}>Sign out</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanitiaSelection;
