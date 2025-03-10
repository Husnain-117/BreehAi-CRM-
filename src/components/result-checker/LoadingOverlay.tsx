
import React from 'react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 rounded-full border-4 border-green-800 border-t-transparent animate-spin mb-4"></div>
        <p className="text-green-900 font-medium">Connecting to property database...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
