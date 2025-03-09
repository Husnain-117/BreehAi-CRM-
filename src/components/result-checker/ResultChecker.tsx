
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { RefreshCw } from 'lucide-react';
import SuccessAnimation from '../SuccessAnimation';
import { fetchCandidateData, CandidateData, findCandidateByEmail } from '../../utils/googleSheets';
import EmailForm from './EmailForm';
import ResultDisplay from './ResultDisplay';
import ConnectionError from './ConnectionError';
import LoadingOverlay from './LoadingOverlay';

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
        {dataLoading && !hasChecked && <LoadingOverlay />}
        
        {connectionError && !hasChecked && !dataLoading && (
          <ConnectionError onRefresh={refreshData} />
        )}
        
        {!hasChecked ? (
          <EmailForm 
            email={email}
            setEmail={setEmail}
            isLoading={isLoading}
            handleCheck={handleCheck}
            refreshData={refreshData}
            dataLoading={dataLoading}
            connectionError={connectionError}
          />
        ) : (
          <ResultDisplay 
            result={result} 
            resetForm={resetForm} 
            refreshData={refreshData} 
          />
        )}
      </div>
    </div>
  );
};

export default ResultChecker;
