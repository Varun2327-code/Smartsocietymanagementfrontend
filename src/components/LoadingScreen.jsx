import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 text-center animate-fadeIn">
      {/* Logo Section */}
      <div className="relative mb-8">
        {/* Outer Glow Pulse */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-40 animate-pulse"></div>

        {/* Society Logo Circle */}
        <div className="relative w-36 h-36 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
          {/* Society Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20 text-white drop-shadow-lg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M5 6h14M5 18h14" />
          </svg>
        </div>
      </div>

      {/* Loading Dots Animation */}
      <div className="flex space-x-2 mb-4">
        <span className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce animation-delay-0"></span>
        <span className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce animation-delay-200"></span>
        <span className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce animation-delay-400"></span>
      </div>

      {/* Text Content */}
      <h1 className="text-2xl font-bold text-indigo-700 tracking-wide mb-2">
        Loading Society Dashboard...
      </h1>
      <p className="text-gray-600 font-medium text-sm">
        Connecting to your society data. Please wait a moment.
      </p>

      {/* Shimmer Loading Bar */}
      <div className="relative w-64 h-2 mt-8 bg-gray-200 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 animate-shimmer"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
