import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import AdminDashboard from './pages/AdminDashboard';
import AssessmentCreate from './pages/AssessmentCreate';
import AssessmentDetail from './pages/AssessmentDetail';
import CandidateManagement from './pages/CandidateManagement';
import ResultsDashboard from './pages/ResultsDashboard';
import ExamLanding from './pages/ExamLanding';
import ExamRoom from './pages/ExamRoom';
import ExamComplete from './pages/ExamComplete';
import CandidateLogin from './pages/CandidateLogin';
import SystemCheckPage from './pages/SystemCheckPage';
import CandidateRegistration from './pages/CandidateRegistration';
import HRDashboard from './pages/HRDashboard';
import HRLogin from './pages/HRLogin';

function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

    if (!user) {
        // Context-aware redirect
        const loginPath = location.pathname.startsWith('/hr') ? '/hr/login' : '/login';
        return <Navigate to={loginPath} replace />;
    }

    if (role && user.role !== role && user.role !== 'ADMIN') return <Navigate to="/" replace />;
    return children;
}

function AppRoutes() {
    const { user } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={
                user ? (user.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/hr/dashboard" replace />) : <AdminLogin />
            } />
            <Route path="/register" element={user ? <Navigate to="/admin" replace /> : <AdminRegister />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
                <ProtectedRoute role="ADMIN">
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin/assessments/create" element={
                <ProtectedRoute role="ADMIN">
                    <AssessmentCreate />
                </ProtectedRoute>
            } />
            <Route path="/admin/assessments/:id" element={
                <ProtectedRoute role="ADMIN">
                    <AssessmentDetail />
                </ProtectedRoute>
            } />
            <Route path="/admin/candidates" element={
                <ProtectedRoute role="HR">
                    <CandidateManagement />
                </ProtectedRoute>
            } />
            <Route path="/admin/results/:assessmentId" element={
                <ProtectedRoute role="ADMIN">
                    <ResultsDashboard />
                </ProtectedRoute>
            } />
            <Route path="/hr/login" element={
                user ? (user.role === 'ADMIN' ? <Navigate to="/hr/dashboard" replace /> : <Navigate to="/hr/dashboard" replace />) : <HRLogin />
            } />
            <Route path="/hr/dashboard" element={
                <ProtectedRoute role="HR">
                    <HRDashboard view="OVERVIEW" />
                </ProtectedRoute>
            } />
            <Route path="/hr/monitoring" element={
                <ProtectedRoute role="HR">
                    <HRDashboard view="MONITORING" />
                </ProtectedRoute>
            } />
            <Route path="/hr/analytics" element={
                <ProtectedRoute role="HR">
                    <HRDashboard view="ANALYTICS" />
                </ProtectedRoute>
            } />
            <Route path="/hr/ranking" element={
                <ProtectedRoute role="HR">
                    <HRDashboard view="RANKING" />
                </ProtectedRoute>
            } />
            <Route path="/hrdashboard" element={<Navigate to="/hr/dashboard" replace />} />

            {/* Candidate Routes (Identity & System Integrity) */}
            <Route path="/candidate/login" element={<CandidateLogin />} />
            <Route path="/exam/check/:token" element={<SystemCheckPage />} />
            <Route path="/exam/register/:token" element={<CandidateRegistration />} />
            <Route path="/exam/:token" element={<ExamLanding />} />
            <Route path="/exam/room/:sessionId" element={<ExamRoom />} />
            <Route path="/exam/complete" element={<ExamComplete />} />

            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster position="top-right" />
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
