
import React, { useState, useEffect } from 'react';

interface TransitionLayoutProps {
  children: React.ReactNode;
}

const TransitionLayout: React.FC<TransitionLayoutProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Initial subtle loading animation
    const loadTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    // Reveal content with delay
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    
    return () => {
      clearTimeout(loadTimer);
      clearTimeout(visibilityTimer);
    };
  }, []);
  
  return (
    <div>
      {/* Page loading overlay */}
      <div className={`fixed inset-0 bg-white z-50 flex items-center justify-center transition-opacity duration-1000 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-t-trendtial-red border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-trendtial-red/70 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
        </div>
      </div>
      
      {/* Main content with transition */}
      <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-5'}`}>
        {children}
      </div>
    </div>
  );
};

export default TransitionLayout;
