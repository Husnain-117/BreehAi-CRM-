
import React from 'react';
import { Check, X, Zap, Award, RefreshCw } from 'lucide-react';
import { CandidateData } from '../../utils/googleSheets';

interface ResultDisplayProps {
  result: CandidateData | null;
  resetForm: () => void;
  refreshData: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, resetForm, refreshData }) => {
  if (result?.selected) {
    return (
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 shadow-md animate-pulse">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-3 gradient-text relative inline-block">
          Brilliant News!
          <span className="absolute top-0 right-0 transform translate-x-6 -translate-y-2">
            <Zap className="h-5 w-5 text-yellow-400 animate-bounce" />
          </span>
        </h2>
        <p className="text-lg mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          You've been selected to join our exceptional team as a
        </p>
        <div className="mb-2 animate-fade-in inline-block" style={{ animationDelay: '0.3s' }}>
          <span className="font-bold text-xl bg-gradient-to-r from-trendtial-red to-trendtial-red/80 text-transparent bg-clip-text">
            {result.designation}
          </span>
        </div>
        
        {result.team && (
          <div className="flex items-center justify-center gap-2 mb-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Award className="h-4 w-4 text-trendtial-red" />
            <span className="text-sm font-medium">
              Team: <span className="text-trendtial-red">{result.team}</span>
            </span>
          </div>
        )}
        
        <p className="text-sm text-gray-600 mb-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          Prepare to embark on a remarkable journey. We'll contact you within 48 hours with your next steps.
        </p>
        <div className="flex gap-3">
          <button
            onClick={resetForm}
            className="btn-primary flex-1 group relative overflow-hidden"
          >
            <span className="relative z-10">Check Another</span>
            <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
          </button>
          <button
            onClick={refreshData}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5 text-trendtial-darkgray" />
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
        <h2 className="text-xl md:text-2xl font-bold mb-3 text-trendtial-black">
          Not Quite This Time
        </h2>
        <p className="text-base mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          While your application showcased your talents, we're unable to move forward at this moment.
        </p>
        <div className="p-4 bg-gray-50 rounded-lg mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-trendtial-darkgray italic">
            "The most brilliant stars often emerge from moments of patience. Your journey with us is just beginning."
          </p>
        </div>
        <p className="text-sm text-gray-600 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          We encourage you to refine your portfolio and consider our next recruitment cycle in 3 months.
        </p>
        <div className="flex gap-3">
          <button
            onClick={resetForm}
            className="btn-primary flex-1 group relative overflow-hidden"
          >
            <span className="relative z-10">Check Another</span>
            <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
          </button>
          <button
            onClick={refreshData}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5 text-trendtial-darkgray" />
          </button>
        </div>
      </div>
    );
  }
};

export default ResultDisplay;
