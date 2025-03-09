
import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#FAFAFA] opacity-90"></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 -right-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-trendtial-red/10 to-trendtial-red/5 animate-float blur-xl"></div>
      <div className="absolute bottom-0 -left-[10%] w-[35%] h-[35%] rounded-full bg-gradient-to-tr from-trendtial-black/10 to-trendtial-black/5 animate-float blur-xl" style={{ animationDelay: '0.5s', animationDuration: '6s' }}></div>
      <div className="absolute top-[20%] left-[10%] w-[25%] h-[25%] rounded-full bg-gradient-to-tl from-yellow-400/5 to-trendtial-red/10 animate-float blur-xl" style={{ animationDelay: '1s', animationDuration: '8s' }}></div>
      
      {/* Animated shapes */}
      <div className="absolute top-[15%] right-[15%] w-16 h-16 rounded-full border border-trendtial-red/20 animate-pulse"></div>
      <div className="absolute bottom-[20%] right-[30%] w-24 h-24 rounded-full border border-trendtial-red/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-[70%] left-[20%] w-20 h-20 rounded-full border border-trendtial-black/10 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'radial-gradient(#FF3131 1px, transparent 2px)', 
             backgroundSize: '40px 40px',
             backgroundPosition: '-19px -19px'
           }}>
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiNmOGY4ZjgiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNNjAgMzBjMCAxNi41NjktMTMuNDMxIDMwLTMwIDMwQzEzLjQzMSA2MCAwIDQ2LjU2OSAwIDMwIDAgMTMuNDMxIDEzLjQzMSAwIDMwIDBjMTYuNTY5IDAgMzAgMTMuNDMxIDMwIDMweiIgc3Ryb2tlPSIjRTBFMEUwIiBzdHJva2Utd2lkdGg9Ii41Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      
      {/* Light beams */}
      <div className="absolute -top-20 left-[50%] transform -translate-x-1/2 w-[200%] h-[50vh] rotate-45 bg-gradient-to-b from-trendtial-red/5 to-transparent opacity-60 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute -bottom-20 left-[50%] transform -translate-x-1/2 w-[200%] h-[50vh] -rotate-45 bg-gradient-to-t from-trendtial-black/5 to-transparent opacity-60 animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
    </div>
  );
};

export default AnimatedBackground;
