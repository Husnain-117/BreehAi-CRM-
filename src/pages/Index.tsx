
import React from 'react';
import Logo from '../components/Logo';
import ResultChecker from '../components/result-checker';
import AnimatedBackground from '../components/AnimatedBackground';
import TransitionLayout from '../components/TransitionLayout';

const Index = () => {
  return (
    <TransitionLayout>
      <div className="min-h-screen flex flex-col px-4 py-8 md:py-12">
        <AnimatedBackground />
        
        <header className="container mx-auto mb-8">
          <Logo className="mx-auto" />
        </header>
        
        <main className="container mx-auto flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Internship Selection <span className="gradient-text">Results</span>
            </h1>
            <p className="text-lg md:text-xl text-trendtial-darkgray">
              Check if you've been selected for the Trendtial Marketing internship program
            </p>
          </div>
          
          <ResultChecker />
        </main>
        
        <footer className="container mx-auto mt-12 text-center text-sm text-trendtial-darkgray">
          <p>© {new Date().getFullYear()} Trendtial Marketing. All rights reserved.</p>
        </footer>
      </div>
    </TransitionLayout>
  );
};

export default Index;
