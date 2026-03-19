// src/components/layouts/PublicLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 sm:px-8 py-12">
      <main className="w-full max-w-sm sm:max-w-md flex flex-col justify-center">
        <div className="w-full mx-auto">
          {/* Main Logo */}
          <div className="flex items-center justify-center mb-10">
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Breeh AI CRM
            </span>
          </div>

          <Outlet />

          <footer className="mt-12 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Breeh AI CRM. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
};

export default PublicLayout; 