import React from 'react';

// =========================
// 🌀 Loading Spinner
// =========================
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-300/40 border-t-blue-600 rounded-full animate-spin transition-all duration-300`}
      />
    </div>
  );
};

// =========================
// 💠 Skeleton Loader (Text/Lines)
// =========================
export const SkeletonLoader = ({ count = 1, className = '' }) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
      style={{ height: '20px', marginBottom: '10px' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/60 dark:via-gray-600/50 to-transparent animate-shimmer" />
    </div>
  ));
  return <div>{skeletons}</div>;
};

// =========================
// 📇 Card Skeleton (e.g. Profile Cards, Summary Boxes)
// =========================
export const CardSkeleton = () => (
  <div className="relative bg-white/60 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-md p-6 overflow-hidden animate-fadeIn">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 dark:via-gray-700/30 to-transparent animate-shimmer"></div>

    <div className="flex items-center space-x-4">
      <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// =========================
// 📊 Table Skeleton (e.g. Dashboard Data Tables)
// =========================
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="relative bg-white/70 dark:bg-gray-900/40 backdrop-blur-lg rounded-xl shadow-md p-6 animate-fadeIn">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/20 dark:via-gray-800/30 to-transparent animate-shimmer"></div>

    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
        ))}
      </div>

      {/* Data Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={colIdx} className="h-3 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSpinner;
