import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
            {/* Header */}
            <header style={{
                background: '#2c3e50',
                color: 'white',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <h1 style={{ margin: 0 }}>SSDMS Admin Dashboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span>Welcome, {user?.name}</span>
                    <button
                        onClick={logout}
                        style={{
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                    }} onClick={() => navigate('/documents')}>
                        <h3 style={{ color: '#333', marginTop: 0 }}>Pending Approvals</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>0</p>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                    }} onClick={() => navigate('/documents')}>
                        <h3 style={{ color: '#333', marginTop: 0 }}>Total Documents</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>0</p>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}>
                        <h3 style={{ color: '#333', marginTop: 0 }}>Active Users</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>1</p>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}>
                    <h2 style={{ color: '#333', marginTop: 0 }}>Recent Audit Logs</h2>
                    <p style={{ color: '#666' }}>Audit log functionality coming soon...</p>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;