// src/components/layouts/PublicLayout.tsx
import React from 'react';

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      {/* Minimal public layout, e.g., for login/signup pages */}
      <main>{children}</main>
    </div>
  );
};

export default PublicLayout; 