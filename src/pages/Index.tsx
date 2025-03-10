
import React from 'react';
import Logo from '../components/Logo';
import ResultChecker from '../components/result-checker';
import AnimatedBackground from '../components/AnimatedBackground';
import TransitionLayout from '../components/TransitionLayout';

const Index = () => {
  return (
    <TransitionLayout>
      <div className="min-h-screen flex flex-col px-4 py-8 md:py-12 bg-gradient-to-b from-white via-white to-green-50">
        <AnimatedBackground />
        
        <header className="container mx-auto mb-8">
          <Logo className="mx-auto" />
        </header>
        
        <main className="container mx-auto flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Property <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-yellow-500">Verification</span>
            </h1>
            <p className="text-lg md:text-xl text-green-900">
              Verify your commercial unit at The Dunes Mall by Avenue5 International
            </p>
          </div>
          
          <ResultChecker />
        </main>
        
        <footer className="container mx-auto mt-12 text-center text-sm text-green-900">
          <p>© {new Date().getFullYear()} Avenue5 International. All rights reserved.</p>
        </footer>
      </div>
    </TransitionLayout>
  );
};

export default Index;
