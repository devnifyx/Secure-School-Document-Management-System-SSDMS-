import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
    documents: { total: number; pending: number; approved: number; rejected: number };
}

const TeacherDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/dashboard/stats')
            .then((res) => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const cards = stats ? [
        {
            label: 'Pending Review',
            value: stats.documents.pending,
            color: '#f59e0b',
            bg: '#fffbeb',
            border: '#fde68a',
            icon: '⏳',
            path: '/documents?status=Pending',
            desc: 'Awaiting admin approval',
        },
        {
            label: 'Approved',
            value: stats.documents.approved,
            color: '#10b981',
            bg: '#ecfdf5',
            border: '#a7f3d0',
            icon: '✅',
            path: '/documents?status=Approved',
            desc: 'Ready to download',
        },
        {
            label: 'Rejected',
            value: stats.documents.rejected,
            color: '#ef4444',
            bg: '#fef2f2',
            border: '#fecaca',
            icon: '❌',
            path: '/documents?status=Rejected',
            desc: 'Needs resubmission',
        },
        {
            label: 'Total Submitted',
            value: stats.documents.total,
            color: '#3b82f6',
            bg: '#eff6ff',
            border: '#bfdbfe',
            icon: '📄',
            path: '/documents',
            desc: 'All your documents',
        },
    ] : [];

    return (
        <Layout title={`Welcome back, ${user?.name?.split(' ')[0]}! 👋`}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    Loading your dashboard…
                </div>
            ) : (
                <div style={{ maxWidth: '900px' }}>
                    {/* Stats grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem',
                    }}>
                        {cards.map((card) => (
                            <div
                                key={card.label}
                                onClick={() => navigate(card.path)}
                                style={{
                                    background: card.bg,
                                    border: `1px solid ${card.border}`,
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s, box-shadow 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{card.icon}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>
                                    {card.value}
                                </div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginTop: '0.25rem' }}>
                                    {card.label}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>
                                    {card.desc}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick actions */}
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        marginBottom: '1.5rem',
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '0.95rem', fontWeight: 700 }}>
                            Quick Actions
                        </h3>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <ActionButton
                                icon="⬆️"
                                label="Upload New Document"
                                desc="Submit a document for approval"
                                color="#10b981"
                                onClick={() => navigate('/upload')}
                            />
                            <ActionButton
                                icon="📁"
                                label="View My Documents"
                                desc="Browse all your submissions"
                                color="#3b82f6"
                                onClick={() => navigate('/documents')}
                            />
                            {stats && stats.documents.rejected > 0 && (
                                <ActionButton
                                    icon="🔄"
                                    label="Resubmit Rejected"
                                    desc={`${stats.documents.rejected} document(s) need attention`}
                                    color="#ef4444"
                                    onClick={() => navigate('/documents?status=Rejected')}
                                />
                            )}
                        </div>
                    </div>

                    {/* Tips */}
                    <div style={{
                        background: 'linear-gradient(135deg, #eff6ff, #ecfdf5)',
                        border: '1px solid #bfdbfe',
                        borderRadius: '12px',
                        padding: '1.25rem 1.5rem',
                    }}>
                        <h3 style={{ margin: '0 0 0.75rem 0', color: '#1e40af', fontSize: '0.9rem', fontWeight: 700 }}>
                            💡 How it works
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                            {[
                                { step: '1', text: 'Upload your document with a title, category and tags' },
                                { step: '2', text: 'Your document is encrypted and sent for admin review' },
                                { step: '3', text: 'You receive a notification when it\'s approved or rejected' },
                                { step: '4', text: 'Download approved documents anytime' },
                            ].map((item) => (
                                <div key={item.step} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                    <span style={{
                                        background: '#3b82f6', color: 'white',
                                        borderRadius: '50%', width: '20px', height: '20px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, marginTop: '1px',
                                    }}>{item.step}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#374151' }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

const ActionButton: React.FC<{
    icon: string; label: string; desc: string; color: string; onClick: () => void;
}> = ({ icon, label, desc, color, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            background: color + '10',
            border: `1px solid ${color}30`,
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = color + '20';
            (e.currentTarget as HTMLButtonElement).style.borderColor = color + '60';
        }}
        onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = color + '10';
            (e.currentTarget as HTMLButtonElement).style.borderColor = color + '30';
        }}
    >
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
        <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{label}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{desc}</div>
        </div>
    </button>
);

export default TeacherDashboard;
