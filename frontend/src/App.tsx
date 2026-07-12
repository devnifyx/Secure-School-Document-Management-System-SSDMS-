import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import DocumentUpload from './pages/DocumentUpload';
import DocumentList from './pages/DocumentList';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        {user?.role === 'Admin' ? <AdminDashboard /> : <TeacherDashboard />}
                    </ProtectedRoute>
                }
            />
            <Route
                path="/upload"
                element={
                    <ProtectedRoute>
                        <DocumentUpload />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/documents"
                element={
                    <ProtectedRoute>
                        <DocumentList />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App
