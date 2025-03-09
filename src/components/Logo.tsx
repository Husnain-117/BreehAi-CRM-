
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8 md:w-10 md:h-10">
        <div className="absolute inset-0 bg-trendtial-red rounded-md transform rotate-6"></div>
        <div className="absolute inset-0 bg-trendtial-black rounded-md border border-trendtial-gray flex items-center justify-center text-trendtial-white font-display font-bold">
          T
        </div>
      </div>
      <div className="text-xl md:text-2xl font-display font-bold tracking-tight">
        <span className="text-trendtial-black">Trend</span>
        <span className="text-trendtial-red">tial</span>
      </div>
    </div>
  );
};

export default Logo;
