
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Mail, Search, Check, X, Sparkles, Zap, RefreshCw, Award } from 'lucide-react';
import SuccessAnimation from './SuccessAnimation';
import { fetchCandidateData, CandidateData, findCandidateByEmail } from '../utils/googleSheets';

const ResultChecker: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CandidateData | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation on mount
    setTimeout(() => setFadeIn(true), 100);
    
    // Load candidate data from Google Sheets
    loadCandidateData();
  }, []);

  const loadCandidateData = async () => {
    setDataLoading(true);
    setConnectionError(false);
    try {
      const data = await fetchCandidateData();
      if (data.length === 0) {
        setConnectionError(true);
        toast.error("Connection issue with our talent database. Please try refreshing.", {
          duration: 5000,
          id: "connection-error"
        });
      } else {
        setCandidates(data);
        toast.success(`Connected to talent database with ${data.length} candidates`, {
          duration: 3000,
          id: "connection-success"
        });
      }
    } catch (error) {
      console.error("Failed to load candidate data:", error);
      setConnectionError(true);
      toast.error("Unable to load our talent database. Please refresh or try again later.", {
        duration: 5000,
        id: "connection-error"
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleCheck = () => {
    if (!email) {
      toast.error('Please enter your email address to check your status');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (dataLoading) {
      toast.error('Our talent database is still loading. Please wait a moment.');
      return;
    }

    if (connectionError || candidates.length === 0) {
      toast.error('Unable to connect to our database. Please refresh and try again.');
      return;
    }

    setIsLoading(true);
    setHasChecked(false);
    setResult(null);

    // Small delay for UX purposes
    setTimeout(() => {
      const candidate = findCandidateByEmail(candidates, email);
      setResult(candidate);
      setIsLoading(false);
      setHasChecked(true);
      
      if (candidate?.selected) {
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);
      }
    }, 1200);
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

  const refreshData = async () => {
    toast.info("Refreshing talent database...", {
      id: "refreshing-data"
    });
    await loadCandidateData();
    
    // If user already checked result, update it with fresh data
    if (result && email) {
      const updatedResult = findCandidateByEmail(candidates, email);
      setResult(updatedResult);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <SuccessAnimation show={showSuccessAnimation} />
      
      <div className={`glass-panel rounded-2xl px-6 py-8 md:p-8 transition-all duration-500 shadow-xl hover:shadow-2xl ${fadeIn ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
        {dataLoading && !hasChecked && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full border-4 border-trendtial-red border-t-transparent animate-spin mb-4"></div>
              <p className="text-trendtial-black font-medium">Connecting to talent database...</p>
            </div>
          </div>
        )}
        
        {connectionError && !hasChecked && !dataLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 p-6">
            <div className="flex flex-col items-center text-center">
              <X className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-trendtial-black font-medium mb-2">Connection Error</p>
              <p className="text-sm text-gray-600 mb-4">We're unable to reach our talent database at the moment.</p>
              <button 
                onClick={refreshData}
                className="btn-primary flex items-center gap-2 px-4 py-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}
        
        {!hasChecked ? (
          <div className="animate-scale">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center gradient-text relative">
              Your Future Awaits
              <span className="absolute -top-1 -right-2">
                <Sparkles className="h-5 w-5 text-trendtial-red animate-pulse" />
              </span>
            </h2>
            
            <p className="text-center text-trendtial-darkgray mb-6 text-sm md:text-base">
              Discover if you're joining our elite team of digital trailblazers
            </p>
            
            <div className="relative mb-6 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-hover:text-trendtial-red transition-colors duration-300" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your professional email"
                className="input-primary w-full pl-10 transition-all duration-300 border-trendtial-gray focus:border-trendtial-red focus:ring-2 focus:ring-trendtial-red/20"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCheck();
                }}
              />
              <div className="absolute h-0.5 bottom-0 left-0 bg-gradient-to-r from-trendtial-red to-trendtial-red/40 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{ width: '100%' }}></div>
            </div>
            
            <button
              onClick={handleCheck}
              disabled={isLoading || dataLoading || connectionError}
              className={`btn-primary w-full flex items-center justify-center gap-2 overflow-hidden relative group mb-4 ${(dataLoading || connectionError) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <>
                  <Search className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative">
                    Reveal Your Destiny
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                  </span>
                </>
              )}
              <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
            </button>
            
            <div className="flex justify-center">
              <button 
                onClick={refreshData}
                disabled={dataLoading}
                className={`text-xs text-trendtial-darkgray hover:text-trendtial-red flex items-center gap-1 transition-colors ${dataLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`h-3 w-3 ${dataLoading ? 'animate-spin' : ''}`} />
                <span>{dataLoading ? 'Refreshing...' : 'Refresh talent database'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {result?.selected ? (
              <div className="text-center">
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
            ) : (
              <div className="text-center">
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultChecker;
