// src/components/layouts/PublicLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const TrendtialLogo = () => (
  <div className="flex items-center justify-center mb-8">
    <svg width="48" height="48" viewBox="0 0 200 200" className="mr-3">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'rgb(220, 38, 38)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'rgb(239, 68, 68)', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="30" fill="url(#grad1)" />
      <text x="25" y="140" fontFamily="Arial, sans-serif" fontSize="100" fontWeight="bold" fill="white">tr.</text>
    </svg>
    <span className="text-4xl font-bold text-foreground">Trendtial</span>
  </div>
);

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <TrendtialLogo />
      <main className="w-full max-w-md">
        <div className="bg-card shadow-2xl rounded-xl p-8 sm:p-10">
          <Outlet />
        </div>
      </main>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Trendtial CRM. All rights reserved.
      </footer>
    </div>
  );
};

export default PublicLayout; 