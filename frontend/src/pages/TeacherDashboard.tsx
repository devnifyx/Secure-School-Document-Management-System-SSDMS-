import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
            {/* Header */}
            <header style={{
                background: '#27ae60',
                color: 'white',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <h1 style={{ margin: 0 }}>SSDMS Teacher Dashboard</h1>
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
                    }} onClick={() => navigate('/documents?status=Pending')}>
                        <h3 style={{ color: '#333', marginTop: 0 }}>Pending Documents</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>0</p>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                    }} onClick={() => navigate('/documents?status=Approved')}>
                        <h3 style={{ color: '#333', marginTop: 0 }}>Approved Documents</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>0</p>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                    }} onClick={() => navigate('/documents?status=Rejected')}>
                        <h3 style={{ color: '#333', marginTop: 0 }}>Rejected Documents</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>0</p>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}>
                    <h2 style={{ color: '#333', marginTop: 0 }}>Quick Actions</h2>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/upload')} style={{
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                        }}>
                            Upload Document
                        </button>
                        <button onClick={() => navigate('/documents')} style={{
                            background: '#95a5a6',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                        }}>
                            View My Documents
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;