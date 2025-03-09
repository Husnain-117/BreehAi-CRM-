
import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#FAFAFA] opacity-90"></div>
      
      {/* Abstract shapes */}
      <div className="absolute top-0 -right-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-trendtial-red/10 to-trendtial-red/5 animate-float"></div>
      <div className="absolute bottom-0 -left-[10%] w-[35%] h-[35%] rounded-full bg-gradient-to-tr from-trendtial-black/10 to-trendtial-black/5 animate-float" style={{ animationDelay: '0.5s' }}></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiNmOGY4ZjgiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNNjAgMzBjMCAxNi41NjktMTMuNDMxIDMwLTMwIDMwQzEzLjQzMSA2MCAwIDQ2LjU2OSAwIDMwIDAgMTMuNDMxIDEzLjQzMSAwIDMwIDBjMTYuNTY5IDAgMzAgMTMuNDMxIDMwIDMweiIgc3Ryb2tlPSIjRTBFMEUwIiBzdHJva2Utd2lkdGg9Ii41Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
    </div>
  );
};

export default AnimatedBackground;
