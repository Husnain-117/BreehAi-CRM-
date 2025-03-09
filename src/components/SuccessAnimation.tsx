
import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SuccessAnimationProps {
  show: boolean;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ show }) => {
  const [confetti, setConfetti] = useState<JSX.Element[]>([]);
  const [stars, setStars] = useState<JSX.Element[]>([]);
  
  useEffect(() => {
    if (show) {
      // Create confetti pieces
      const colors = ['#FF3131', '#FAFAFA', '#333', '#FFDA7B', '#FF8A8A'];
      const pieces = [];
      
      for (let i = 0; i < 150; i++) {
        const size = Math.random() * 10 + 5;
        const speedFactor = Math.random() * 0.5 + 0.5;
        const style = {
          left: `${Math.random() * 100}%`,
          top: '-20px',
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          animationDelay: `${Math.random() * 0.5}s`,
          animationDuration: `${1 + Math.random() * 2}s`,
          transform: `rotate(${Math.random() * 360}deg)`,
        };
        
        // Different shapes for confetti
        const shapes = ['rounded-sm', 'rounded-full', 'rounded-none'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        pieces.push(
          <div 
            key={`confetti-${i}`}
            className={`absolute ${shape} animate-confetti`}
            style={style}
          />
        );
      }
      
      // Create stars
      const starElements = [];
      for (let i = 0; i < 15; i++) {
        const size = Math.random() * 0.6 + 0.4;
        const style = {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          transform: `scale(${size}) rotate(${Math.random() * 180}deg)`,
          animationDelay: `${Math.random() * 1.5}s`,
          animationDuration: `${1 + Math.random() * 1}s`,
        };
        
        starElements.push(
          <div 
            key={`star-${i}`}
            className="absolute"
            style={style}
          >
            <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
          </div>
        );
      }
      
      setConfetti(pieces);
      setStars(starElements);
      
      // Clean up
      const timer = setTimeout(() => {
        setConfetti([]);
        setStars([]);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [show]);
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {confetti}
      {stars}
    </div>
  );
};

export default SuccessAnimation;
