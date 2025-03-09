
import React, { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  show: boolean;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ show }) => {
  const [confetti, setConfetti] = useState<JSX.Element[]>([]);
  
  useEffect(() => {
    if (show) {
      const colors = ['#FF3131', '#FAFAFA', '#333'];
      const pieces = [];
      
      for (let i = 0; i < 100; i++) {
        const style = {
          left: `${Math.random() * 100}%`,
          top: '-20px',
          width: `${Math.random() * 10 + 5}px`,
          height: `${Math.random() * 10 + 5}px`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          animationDelay: `${Math.random() * 0.5}s`,
        };
        
        pieces.push(
          <div 
            key={i}
            className="absolute rounded-sm animate-confetti"
            style={style}
          />
        );
      }
      
      setConfetti(pieces);
      
      // Clean up
      const timer = setTimeout(() => {
        setConfetti([]);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [show]);
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confetti}
    </div>
  );
};

export default SuccessAnimation;
