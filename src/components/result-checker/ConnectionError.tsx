
import React from 'react';
import { X, RefreshCw } from 'lucide-react';

interface ConnectionErrorProps {
  onRefresh: () => void;
}

const ConnectionError: React.FC<ConnectionErrorProps> = ({ onRefresh }) => {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 p-6">
      <div className="flex flex-col items-center text-center">
        <X className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-green-900 font-medium mb-2">Connection Error</p>
        <p className="text-sm text-gray-600 mb-4">We're unable to reach our property database at the moment.</p>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};

export default ConnectionError;
