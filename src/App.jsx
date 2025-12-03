import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import useUserRole from './hooks/useUserRole';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Login';
import Register from './Register';
import Homepage from './Homepage';
import ProfilePage from './components/Profile/Profilepage';
import EditProfile from './components/Profile/EditProfilePage';
import Communication from './pages/Communication';
import Settings from './pages/settings';
import AdminLayout from './components/AdminLayout';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import Members from './pages/admin/Members';
import Security from './pages/admin/Security';
import Complaints from './pages/admin/Complaints';
import Events from './pages/admin/Events';
import Maintenance from './pages/admin/Maintenance';
import Announcements from './pages/admin/Announcements';
import DocumentsPage from './pages/DocumentsPage';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage';
import AdminLogin from './pages/admin/AdminLogin';

// ✅ Simplified RoleBasedRedirect
const RoleBasedRedirect = () => {
  const [user, loading] = useAuthState(auth);
  const { role, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) {
    return <LoadingScreen />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'resident' || role === 'user') return <Navigate to="/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Default Landing */}
        <Route index element={<RoleBasedRedirect />} />

        {/* Protected User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="resident">
              <Homepage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requiredRole="resident">
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute requiredRole="resident">
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communication"
          element={
            <ProtectedRoute requiredRole="resident">
              <Communication />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredRole="resident">
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute requiredRole="resident">
              <DocumentsPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="security" element={<Security />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="events" element={<Events />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="documents" element={<AdminDocumentsPage />} />
        </Route>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />

        {/* ✅ Catch-all route now redirects home, not to redirect loop */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
