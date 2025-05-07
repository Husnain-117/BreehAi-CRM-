import React from 'react';
import Logo from '../components/Logo';
import ResultChecker from '../components/result-checker';
import AnimatedBackground from '../components/AnimatedBackground';
import TransitionLayout from '../components/TransitionLayout';

const Index = () => {
  return (
    <TransitionLayout>
      <div className="min-h-screen flex flex-col px-4 py-8 md:py-12 bg-white">
        <AnimatedBackground />
        
        <header className="container mx-auto mb-8">
          <Logo className="mx-auto" />
        </header>
        
        <main className="container mx-auto flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-black">
              Trendtial Internship <span className="text-red-500">Result Announcement</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              Enter your email address below to check your internship selection status, position, and lead name.
            </p>
          </div>
          
          <ResultChecker />
        </main>
        
        <footer className="container mx-auto mt-12 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Trendtial. All rights reserved.</p>
        </footer>
      </div>
    </TransitionLayout>
  );
};

export default Index;
