import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import useUserRole from '../hooks/useUserRole';
import LoadingScreen from './LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, Zap, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Enhanced ProtectedRoute Matrix
 * Implements high-fidelity routing guards, role-based clearance, and visual security alerts.
 */
const ProtectedRoute = ({ children, requiredRole, redirectPath = '/login' }) => {
  const [user, loading] = useAuthState(auth);
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!loading && !roleLoading) {
      // High-precision security verification delay
      const timer = setTimeout(() => setIsAuthorizing(false), 900);
      return () => clearTimeout(timer);
    }
  }, [loading, roleLoading]);

  // Authorization Sequence Viewport
  if (loading || roleLoading || isAuthorizing) {
    return <LoadingScreen />;
  }

  // Identity Guard Protocol
  if (!user) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Access Clearance normalization
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  // Role Validation Matrix and Breach Handshake
  if (requiredRole && !allowedRoles.includes(role)) {
    if (!accessDenied) {
      setAccessDenied(true);
      console.warn(`[Security Alert] Unauthorized access attempt by ${user.email} at ${location.pathname}`);
      toast.error("SECURITY BREACH: Unauthorized Sector Entry", {
        icon: '⛔',
        style: { borderRadius: '2rem', background: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', fontStyle: 'italic' },
        duration: 4000
      });
    }

    // Role-based tactical redirection
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === 'security') {
      return <Navigate to="/security/dashboard" replace />;
    } else if (role === 'user') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Clearance Granted: Render Child Protocol with Premium Transition
  return (
    <div className="relative overflow-hidden min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(15px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.02, filter: 'blur(15px)' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full relative z-10"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Dynamic Security Aura */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600 rounded-full blur-[100px]" />
      </div>

      {/* HUD Watermark */}
      <div className="fixed bottom-6 right-8 pointer-events-none opacity-20 z-[9999] flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase text-slate-900 tracking-[0.4em] italic leading-none">Identity Secured</span>
          <span className="text-[8px] font-black uppercase text-indigo-600 tracking-[0.4em] italic mt-1 leading-none">{user.email}</span>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white shadow-xl shadow-indigo-100 flex items-center justify-center border border-indigo-50 border-r-4 border-r-indigo-600">
          <ShieldAlert size={20} className="text-indigo-600 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;
