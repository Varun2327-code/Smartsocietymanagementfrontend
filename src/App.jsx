import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import useUserRole from './hooks/useUserRole';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Login';
import Register from './Register';
import Homepage from './Homepage';
import ProfilePage from './components/Profile/ProfilePage.jsx';
import EditProfile from './components/Profile/EditProfilePage.jsx';
import Communication from './pages/Communication';
import Settings from './pages/Settings.jsx';
import AdminLayout from './components/AdminLayout.jsx';

import Dashboard from './pages/admin/Dashboard.jsx';
import Members from './pages/admin/Members.jsx';
import Security from './pages/admin/Security.jsx';
import Complaints from './pages/admin/Complaints.jsx';
import Events from './pages/admin/Events.jsx';
import Maintenance from './pages/admin/Maintenance.jsx';
import Announcements from './pages/admin/Announcements.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';

// ✅ Role Based Redirect (fixed component)
const RoleBasedRedirect = () => {
  const [user, loading] = useAuthState(auth);
  const { role, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'resident') return <Navigate to="/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>

        {/* Default Landing */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Protected Resident Routes */}
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
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <Outlet />   {/* allows nested admin routes */}
              </AdminLayout>
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
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin/documents" element={<AdminDocumentsPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* No Loop — Catch All Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
};

export default App;
