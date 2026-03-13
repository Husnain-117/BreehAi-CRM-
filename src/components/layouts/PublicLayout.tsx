// src/components/layouts/PublicLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Left side: Image/Brand area */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary/10 overflow-hidden items-center justify-center">
        {/* Image with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-secondary/90 mix-blend-multiply z-10" />
        <img
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="CRM Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-20 text-center text-white px-12">
          <h1 className="text-5xl font-bold tracking-tight mb-6">Breeh AI CRM</h1>
          <p className="text-xl opacity-90 font-medium leading-relaxed max-w-lg mx-auto">
            Empower your team, streamline your workflows, and accelerate your sales pipeline.
          </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <main className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-24 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center mb-10">
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Breeh AI CRM</span>
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