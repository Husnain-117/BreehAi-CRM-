
import React from 'react';
import { Check, X, Building, MapPin, RefreshCw } from 'lucide-react';
import { PropertyData } from '../../utils/googleSheets';

interface ResultDisplayProps {
  result: PropertyData | null;
  resetForm: () => void;
  refreshData: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, resetForm, refreshData }) => {
  if (result?.verified) {
    return (
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 shadow-md animate-pulse">
          <Check className="h-8 w-8 text-green-800" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-yellow-500 relative inline-block">
          Verified Property
          <span className="absolute top-0 right-0 transform translate-x-6 -translate-y-2">
            <Building className="h-5 w-5 text-yellow-500 animate-bounce" />
          </span>
        </h2>
        <p className="text-lg mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          This premium commercial unit is verified at
        </p>
        <div className="mb-2 animate-fade-in inline-block" style={{ animationDelay: '0.3s' }}>
          <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-yellow-500">
            The Dunes Mall
          </span>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-semibold text-green-800 mb-2">Unit Details</h3>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="text-sm text-gray-600">Owner:</div>
            <div className="text-sm font-medium text-green-900">{result.ownerName}</div>
            
            <div className="text-sm text-gray-600">Floor:</div>
            <div className="text-sm font-medium text-green-900">{result.floorLevel}</div>
            
            <div className="text-sm text-gray-600">Type:</div>
            <div className="text-sm font-medium text-green-900">{result.unitType}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <MapPin className="h-4 w-4 text-green-800" />
          <span className="text-sm font-medium">
            <span className="text-green-700">Avenue5 International Development</span>
          </span>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={resetForm}
            className="flex-1 group relative overflow-hidden bg-green-800 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all duration-300 hover:shadow-lg hover:bg-green-700"
          >
            <span className="relative z-10">Check Another</span>
            <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
          </button>
          <button
            onClick={refreshData}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5 text-green-800" />
          </button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-red-100 to-red-200 shadow-md animate-pulse">
          <X className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-3 text-red-600">
          Unverified Unit
        </h2>
        <p className="text-base mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          We could not verify this unit ID in our records for The Dunes Mall.
        </p>
        <div className="p-4 bg-gray-50 rounded-lg mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-gray-600 italic">
            "If you believe this is an error, please contact Avenue5 International's property management office for assistance."
          </p>
        </div>
        <p className="text-sm text-gray-600 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Please check your unit ID and try again, or contact our support team.
        </p>
        <div className="flex gap-3">
          <button
            onClick={resetForm}
            className="flex-1 group relative overflow-hidden bg-green-800 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all duration-300 hover:shadow-lg hover:bg-green-700"
          >
            <span className="relative z-10">Try Again</span>
            <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
          </button>
          <button
            onClick={refreshData}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5 text-green-800" />
          </button>
        </div>
      </div>
    );
  }
};

export default ResultDisplay;
