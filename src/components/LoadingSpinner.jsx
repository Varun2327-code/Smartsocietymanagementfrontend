import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Search, Activity, Package, Layers } from 'lucide-react';

// =========================
// 🌀 Premium Orbital Spinner
// =========================
const LoadingSpinner = ({ size = 'md', color = 'indigo', className = '' }) => {
  const sizeMap = {
    sm: 32,
    md: 56,
    lg: 80,
    xl: 120
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative" style={{ width: currentSize, height: currentSize }}>
        {/* Deep Orbital Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-0 rounded-full border-4 border-${color}-50/50 border-t-${color}-500 shadow-xl shadow-${color}-100/20`}
        />

        {/* Counter-Spin Core */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-4 rounded-full border-2 border-dashed border-purple-200 opacity-60`}
        />

        {/* Pulsating Heart */}
        <motion.div
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-${color}-600 rounded-full blur-[2px] shadow-[0_0_10px_rgba(99,102,241,0.8)]`}
        />

        {/* Exterior Satellite Signal */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 bg-white border-2 border-indigo-500 rounded-full shadow-lg"
        />
      </div>
    </div>
  );
};

// =========================
// 💠 Premium Tactical Skeleton
// =========================
export const SkeletonLoader = ({ count = 1, className = '', height = '20px' }) => {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className={`bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden ${className}`}
          style={{ height }}
        >
          <motion.div
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-600/5 to-transparent skew-x-12"
          />
        </motion.div>
      ))}
    </div>
  );
};

// =========================
// 📇 Premium Identity Matrix Skeleton
// =========================
export const CardSkeleton = () => (
  <div className="bg-white border border-slate-50 p-10 rounded-[4rem] shadow-sm relative overflow-hidden group">
    <div className="flex items-start justify-between mb-10">
      <SkeletonLoader height="72px" className="w-[72px] !rounded-[2rem] shadow-inner" />
      <div className="text-right flex flex-col items-end gap-3 px-2">
        <SkeletonLoader height="14px" className="w-16 !rounded-full opacity-60" />
        <SkeletonLoader height="32px" className="w-24 !rounded-2xl" />
      </div>
    </div>
    <div className="space-y-6">
      <SkeletonLoader height="16px" className="w-[85%] !rounded-full" />
      <SkeletonLoader height="12px" className="w-[60%] !rounded-full opacity-40 shadow-sm" />
    </div>
    <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
      <div className="flex gap-2">
        <SkeletonLoader height="32px" className="w-8 !rounded-xl opacity-30" />
        <SkeletonLoader height="32px" className="w-8 !rounded-xl opacity-30" />
      </div>
      <SkeletonLoader height="40px" className="w-32 !rounded-[1.5rem]" />
    </div>
  </div>
);

// =========================
// 📊 Premium Data Grid Skeleton
// =========================
export const TableSkeleton = ({ rows = 6, columns = 5 }) => (
  <div className="bg-white rounded-[50px] border border-slate-50 shadow-sm overflow-hidden mb-12 translate-z-0">
    <div className="px-12 py-10 bg-slate-50/50 flex gap-8">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonLoader key={i} height="12px" className="flex-1 opacity-20 !rounded-full" />
      ))}
    </div>
    <div className="p-12 space-y-10">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-8 items-center group">
          <SkeletonLoader height="56px" className="w-14 !rounded-2xl shadow-inner group-hover:scale-105 transition-transform" />
          <div className="flex-1 space-y-3">
            <SkeletonLoader height="18px" className="w-1/2 !rounded-full italic" />
            <SkeletonLoader height="12px" className="w-1/3 opacity-30 !rounded-full" />
          </div>
          {Array.from({ length: columns - 1 }).map((_, c) => (
            <SkeletonLoader key={c} height="14px" className="w-28 !rounded-full opacity-10" />
          ))}
          <div className="flex gap-3">
            <SkeletonLoader height="40px" className="w-10 !rounded-xl opacity-40" />
            <SkeletonLoader height="40px" className="w-10 !rounded-xl opacity-40" />
          </div>
        </div>
      ))}
    </div>
    <div className="p-12 border-t border-slate-50/50 bg-slate-50/20 flex justify-between">
      <SkeletonLoader height="14px" className="w-48 !rounded-full opacity-30" />
      <div className="flex gap-4">
        <SkeletonLoader height="32px" className="w-8 !rounded-lg opacity-20" />
        <SkeletonLoader height="32px" className="w-8 !rounded-lg opacity-20" />
      </div>
    </div>
  </div>
);

export default LoadingSpinner;
