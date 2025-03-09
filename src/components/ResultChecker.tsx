
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Mail, Search, Check, X, Sparkles, Zap } from 'lucide-react';
import SuccessAnimation from './SuccessAnimation';

interface Candidate {
  email: string;
  selected: boolean;
  department?: string;
}

// Mock database of candidates - in a real app this would come from an API
const candidatesDB: Candidate[] = [
  { email: 'john.doe@example.com', selected: true, department: 'Social Media' },
  { email: 'jane.smith@example.com', selected: true, department: 'SEO' },
  { email: 'alex.johnson@example.com', selected: true, department: 'Content Marketing' },
  { email: 'sarah.williams@example.com', selected: false },
  { email: 'test@test.com', selected: true, department: 'Social Media' },
];

const ResultChecker: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Candidate | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation on mount
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const handleCheck = () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setHasChecked(false);
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      const candidate = candidatesDB.find(c => c.email.toLowerCase() === email.toLowerCase());
      setResult(candidate || { email, selected: false });
      setIsLoading(false);
      setHasChecked(true);
      
      if (candidate?.selected) {
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);
      }
    }, 1500);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const resetForm = () => {
    // Animate out before resetting
    setFadeIn(false);
    setTimeout(() => {
      setEmail('');
      setResult(null);
      setHasChecked(false);
      setFadeIn(true);
    }, 300);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <SuccessAnimation show={showSuccessAnimation} />
      
      <div className={`glass-panel rounded-2xl px-6 py-8 md:p-8 transition-all duration-500 shadow-xl hover:shadow-2xl ${fadeIn ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
        {!hasChecked ? (
          <div className="animate-scale">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center gradient-text relative">
              Check Your Application Status
              <span className="absolute -top-1 -right-2">
                <Sparkles className="h-5 w-5 text-trendtial-red animate-pulse" />
              </span>
            </h2>
            
            <div className="relative mb-6 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-hover:text-trendtial-red transition-colors duration-300" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="input-primary w-full pl-10 transition-all duration-300 border-trendtial-gray focus:border-trendtial-red focus:ring-2 focus:ring-trendtial-red/20"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCheck();
                }}
              />
              <div className="absolute h-0.5 bottom-0 left-0 bg-gradient-to-r from-trendtial-red to-trendtial-red/40 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{ width: '100%' }}></div>
            </div>
            
            <button
              onClick={handleCheck}
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 overflow-hidden relative group"
            >
              {isLoading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <>
                  <Search className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative">
                    Check Result
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                  </span>
                </>
              )}
              <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            {result?.selected ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 shadow-md animate-pulse">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 gradient-text relative inline-block">
                  Congratulations!
                  <span className="absolute top-0 right-0 transform translate-x-6 -translate-y-2">
                    <Zap className="h-5 w-5 text-yellow-400 animate-bounce" />
                  </span>
                </h2>
                <p className="text-lg mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  You have been selected for the <span className="font-semibold bg-gradient-to-r from-trendtial-red to-trendtial-red/80 text-transparent bg-clip-text">{result.department}</span> internship!
                </p>
                <p className="text-sm text-gray-600 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  We'll contact you shortly with next steps.
                </p>
                <button
                  onClick={resetForm}
                  className="btn-primary group relative overflow-hidden"
                >
                  <span className="relative z-10">Check Another Result</span>
                  <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-red-100 to-red-200 shadow-md animate-pulse">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 text-trendtial-black">
                  Not Selected
                </h2>
                <p className="text-base mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  Thank you for your application. Unfortunately, you haven't been selected for this internship cycle.
                </p>
                <p className="text-sm text-gray-600 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  We encourage you to apply again in the future as we're always looking for talented individuals.
                </p>
                <button
                  onClick={resetForm}
                  className="btn-primary group relative overflow-hidden"
                >
                  <span className="relative z-10">Check Another Result</span>
                  <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultChecker;
