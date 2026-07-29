import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PanitiaSelection from './pages/PanitiaSelection';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import DocumentUpload from './pages/DocumentUpload';
import DocumentRepository from './pages/DocumentRepository';
import SearchDocuments from './pages/SearchDocuments';
import ApprovalQueue from './pages/ApprovalQueue';
import UserManagement from './pages/UserManagement';
import PanitiaManagement from './pages/PanitiaManagement';
import WeeklyReportSubmit from './pages/WeeklyReportSubmit';
import WeeklyReportRepository from './pages/WeeklyReportRepository';
import WeeklyReportTracker from './pages/WeeklyReportTracker';
import AuditLogs from './pages/AuditLogs';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
    const { user, needsPanitiaSelection } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
            <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" replace />} />
            <Route path="/select-panitia" element={
                user && needsPanitiaSelection ? <PanitiaSelection /> : <Navigate to={user ? '/' : '/login'} replace />
            } />

            <Route path="/" element={
                <ProtectedRoute>
                    {user?.role === 'Admin' ? <AdminDashboard /> : <TeacherDashboard />}
                </ProtectedRoute>
            } />

            <Route path="/documents" element={
                <ProtectedRoute>
                    <DocumentRepository />
                </ProtectedRoute>
            } />

            <Route path="/search" element={
                <ProtectedRoute>
                    <SearchDocuments />
                </ProtectedRoute>
            } />

            <Route path="/upload" element={
                <ProtectedRoute requiredRole="Teacher">
                    <DocumentUpload />
                </ProtectedRoute>
            } />

            <Route path="/approvals" element={
                <ProtectedRoute requiredRole="Admin">
                    <ApprovalQueue />
                </ProtectedRoute>
            } />

            <Route path="/users" element={
                <ProtectedRoute requiredRole="Admin">
                    <UserManagement />
                </ProtectedRoute>
            } />

            <Route path="/panitia" element={
                <ProtectedRoute requiredRole="Admin">
                    <PanitiaManagement />
                </ProtectedRoute>
            } />

            <Route path="/weekly-reports" element={
                <ProtectedRoute>
                    {user?.role === 'Admin' ? <WeeklyReportTracker /> : <WeeklyReportRepository />}
                </ProtectedRoute>
            } />

            <Route path="/weekly-reports/submit" element={
                <ProtectedRoute requiredRole="Teacher">
                    <WeeklyReportSubmit />
                </ProtectedRoute>
            } />

            <Route path="/audit-logs" element={
                <ProtectedRoute requiredRole="Admin">
                    <AuditLogs />
                </ProtectedRoute>
            } />

            <Route path="/notifications" element={
                <ProtectedRoute>
                    <Notifications />
                </ProtectedRoute>
            } />

            <Route path="/settings" element={
                <ProtectedRoute>
                    <Settings />
                </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
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

export default App;
