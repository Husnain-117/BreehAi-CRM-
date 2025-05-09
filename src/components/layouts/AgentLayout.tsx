// src/components/layouts/AgentLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // If layout wraps Outlet directly
import NavLink from '../common/NavLink'; // Import NavLink
import { useAuth } from '../../contexts/AuthContext';

const AgentLayout: React.FC = () => {
  const { logout, profile } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 space-y-4 flex flex-col">
        <div>
          <h1 className="text-xl font-semibold mb-4">Agent Portal</h1>
          <nav className="flex flex-col space-y-2">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/leads">Leads</NavLink>
            <NavLink to="/follow-ups">Follow-Ups</NavLink>
            <NavLink to="/meetings">Meetings</NavLink>
          </nav>
        </div>
        <div className="mt-auto pt-4 border-t">
          {profile && <p className="text-sm text-gray-600 mb-2">Welcome, {profile.full_name}</p>}
          <button 
            onClick={logout} 
            className="w-full bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow p-4">
          {/* TODO: Implement dynamic page titles, possibly via context or route match */}
          <h2 className="text-lg font-semibold">Current Page</h2> 
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AgentLayout; 