// src/components/layouts/PublicLayout.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // Optional: for a logo link

// Optional: Placeholder for a simple logo if you want one on public pages
const LogoSimple = () => (
  <Link to="/login" className="font-display text-3xl font-bold text-primary hover:opacity-80 transition-opacity">
    CRM
  </Link>
);

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 sm:p-6">
      <div className="mb-8">
        {/* You can place a logo here if desired */}
        {/* <LogoSimple /> */}
      </div>
      <main className="w-full max-w-md bg-card shadow-xl rounded-xl p-6 sm:p-8">
        {children}
      </main>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Your CRM. All rights reserved.</p>
        {/* Optional: Add links to privacy policy, terms of service, etc. */}
      </footer>
    </div>
  );
};

export default PublicLayout; 