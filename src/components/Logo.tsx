import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8 md:w-10 md:h-10">
        <div className="absolute inset-0 bg-red-600 rounded-md flex items-center justify-center text-white font-display font-bold text-lg md:text-xl">
          tr.
        </div>
      </div>
      <div className="text-xl md:text-2xl font-display font-bold tracking-tight">
        <span className="text-white">Trendtial</span>
      </div>
    </div>
  );
};

export default Logo;
