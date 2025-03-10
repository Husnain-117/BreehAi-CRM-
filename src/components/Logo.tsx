
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8 md:w-10 md:h-10">
        <div className="absolute inset-0 bg-yellow-500 rounded-md transform rotate-6"></div>
        <div className="absolute inset-0 bg-green-800 rounded-md border border-green-900 flex items-center justify-center text-white font-display font-bold">
          A
        </div>
      </div>
      <div className="text-xl md:text-2xl font-display font-bold tracking-tight">
        <span className="text-green-800">Avenue</span>
        <span className="text-yellow-500">5</span>
      </div>
    </div>
  );
};

export default Logo;
