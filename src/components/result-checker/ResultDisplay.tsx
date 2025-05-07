import React, { useEffect } from 'react';
import { Check, X, User, Briefcase, RefreshCw, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CandidateData } from '../../utils/googleSheets';
import { playSuccessSound } from '../../utils/sounds';
import VerificationSteps from './VerificationSteps';

interface ResultDisplayProps {
  result: CandidateData | null;
  resetForm: () => void;
  refreshData: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, resetForm, refreshData }) => {
  useEffect(() => {
    if (result?.status.trim().toLowerCase() === 'selected') {
      // Play confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Play success sound
      playSuccessSound();
    }
  }, [result]);

  if (!result) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-red-400 shadow-md animate-pulse">
          <X className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-3 text-red-500">
          No Record Found
        </h2>
        <p className="text-base mb-4 animate-fade-in text-gray-500" style={{ animationDelay: '0.2s' }}>
          We could not find any internship application with this email address.
        </p>
        <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-gray-600 italic">
            "Please check your email address and try again, or contact Trendtial support if you believe this is an error."
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={resetForm}
            className="flex-1 group relative overflow-hidden bg-red-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:bg-red-500"
          >
            <span className="relative z-10">Try Again</span>
            <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
          </button>
          <button
            onClick={refreshData}
            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5 text-red-600" />
          </button>
        </div>
      </div>
    );
  }

  const isSelected = result.status.trim().toLowerCase() === 'selected';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-center animate-fade-in max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 shadow-lg animate-pulse">
          {isSelected ? <Check className="h-10 w-10 text-white" /> : <X className="h-10 w-10 text-red-600" />}
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent" style={{ letterSpacing: '-1px' }}>
          {isSelected ? 'Congratulations!' : 'Not Selected'}
        </h2>
        {isSelected && <div className="text-4xl mb-2 animate-bounce">🎉</div>}
        <p className="text-base md:text-lg mb-8 animate-fade-in text-gray-600 font-medium" style={{ animationDelay: '0.2s' }}>
          {isSelected
            ? 'You have been selected for the Trendtial Internship!'
            : 'Thank you for applying to the Trendtial Internship.'}
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8 animate-fade-in text-left max-w-md mx-auto shadow-sm">
          <h3 className="font-semibold text-red-500 mb-3 flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-yellow-400" /> <span>Candidate Details</span>
          </h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div className="text-sm text-gray-600">Name:</div>
            <div className="text-sm font-bold text-gray-900">{result.name}</div>
            <div className="text-sm text-gray-600">Status:</div>
            <div className={`text-sm font-bold ${isSelected ? 'text-yellow-500' : 'text-red-500'}`}>{result.status}</div>
            <div className="text-sm text-gray-600">Position:</div>
            <div className="text-sm font-bold text-gray-900">{result.position}</div>
            {!isSelected && (
              <>
                <div className="text-sm text-gray-600">Lead Name:</div>
                <div className="text-sm font-bold text-gray-900">{result.leadName}</div>
              </>
            )}
          </div>
        </div>
        {isSelected ? (
          <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in text-yellow-500 font-bold text-lg" style={{ animationDelay: '0.5s' }}>
            <Star className="h-5 w-5 animate-bounce" />
            <span>Welcome to the Trendtial team!</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in text-gray-500 font-medium" style={{ animationDelay: '0.5s' }}>
            <Briefcase className="h-5 w-5" />
            <span>We encourage you to apply again in the future.</span>
          </div>
        )}
        <div className="flex gap-3 mt-2">
          <button
            onClick={resetForm}
            className="flex-1 group relative overflow-hidden bg-red-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:bg-red-500"
          >
            <span className="relative z-10">Check Another</span>
            <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
          </button>
          <button
            onClick={refreshData}
            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5 text-red-600" />
          </button>
        </div>
      </div>

      {isSelected && <VerificationSteps result={result} onUpdate={refreshData} />}
    </div>
  );
};

export default ResultDisplay;
