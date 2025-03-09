
import React, { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { Mail, Search, Check, X } from 'lucide-react';
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
    setEmail('');
    setResult(null);
    setHasChecked(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <SuccessAnimation show={showSuccessAnimation} />
      
      <div className="glass-panel rounded-2xl px-6 py-8 md:p-8">
        {!hasChecked ? (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center gradient-text">
              Check Your Application Status
            </h2>
            
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="input-primary w-full pl-10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCheck();
                }}
              />
            </div>
            
            <button
              onClick={handleCheck}
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Check Result
                </>
              )}
            </button>
          </>
        ) : (
          <div className="animate-fade-in">
            {result?.selected ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 gradient-text">
                  Congratulations!
                </h2>
                <p className="text-lg mb-4">
                  You have been selected for the <span className="font-semibold">{result.department}</span> internship!
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  We'll contact you shortly with next steps.
                </p>
                <button
                  onClick={resetForm}
                  className="btn-primary"
                >
                  Check Another Result
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 text-trendtial-black">
                  Not Selected
                </h2>
                <p className="text-base mb-4">
                  Thank you for your application. Unfortunately, you haven't been selected for this internship cycle.
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  We encourage you to apply again in the future as we're always looking for talented individuals.
                </p>
                <button
                  onClick={resetForm}
                  className="btn-primary"
                >
                  Check Another Result
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
