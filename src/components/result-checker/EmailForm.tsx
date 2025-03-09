
import React from 'react';
import { Mail, Search, RefreshCw, Sparkles } from 'lucide-react';

interface EmailFormProps {
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  handleCheck: () => void;
  refreshData: () => void;
  dataLoading: boolean;
  connectionError: boolean;
}

const EmailForm: React.FC<EmailFormProps> = ({
  email,
  setEmail,
  isLoading,
  handleCheck,
  refreshData,
  dataLoading,
  connectionError
}) => {
  return (
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
  );
};

export default EmailForm;
