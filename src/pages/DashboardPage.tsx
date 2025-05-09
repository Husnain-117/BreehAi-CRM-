// src/pages/DashboardPage.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
// import { useLeadsQuery } from '../hooks/queries/useLeadsQuery'; // Example: for fetching lead counts

const DashboardPage: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();

  // Example: Fetch some data relevant to the dashboard
  // const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useLeadsQuery({
  //   // Add filters if needed, e.g., only leads for the current agent/manager
  //   filters: profile?.role === 'agent' ? { agent_id: profile.id } : 
  //            profile?.role === 'manager' ? { manager_id_for_leads_view: profile.id } : {} // Needs backend support for manager_id_for_leads_view
  // });

  if (authLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (!profile) {
    return <div>Error: User profile not available.</div>;
  }

  const renderAgentDashboard = () => {
    // const p1Count = leadsData?.leads.filter(l => l.status_bucket === 'P1').length || 0;
    // const p2Count = leadsData?.leads.filter(l => l.status_bucket === 'P2').length || 0;
    // const p3Count = leadsData?.leads.filter(l => l.status_bucket === 'P3').length || 0;
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Agent Dashboard</h2>
        <p>Welcome, {profile.full_name}!</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-4 shadow rounded-lg">
            <h3 className="font-semibold text-lg">My P1 Leads</h3>
            {/* <p className="text-3xl">{leadsLoading ? '...' : p1Count}</p> */}
            <p className="text-3xl">_Count_</p>
          </div>
          <div className="bg-white p-4 shadow rounded-lg">
            <h3 className="font-semibold text-lg">My P2 Leads</h3>
            {/* <p className="text-3xl">{leadsLoading ? '...' : p2Count}</p> */}
            <p className="text-3xl">_Count_</p>
          </div>
          <div className="bg-white p-4 shadow rounded-lg">
            <h3 className="font-semibold text-lg">My P3 Leads</h3>
            {/* <p className="text-3xl">{leadsLoading ? '...' : p3Count}</p> */}
            <p className="text-3xl">_Count_</p>
          </div>
        </div>
        {/* Placeholder for upcoming follow-ups, meetings scheduled */}
      </div>
    );
  };

  const renderManagerDashboard = () => {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Manager Dashboard</h2>
        <p>Welcome, {profile.full_name}!</p>
        <p className="mt-4">Team performance overview, lead distribution, etc. (Not yet implemented)</p>
        {/* Placeholder for team P1/P2/P3 counts, conversion rates */}
      </div>
    );
  };

  const renderSuperAdminDashboard = () => {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Super Admin Dashboard</h2>
        <p>Welcome, {profile.full_name}!</p>
        <p className="mt-4">Organization-wide overview, user activity summaries. (Not yet implemented)</p>
        {/* Placeholder for system stats, user counts by role */}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {/* {leadsError && <p className="text-red-500">Error loading lead data: {leadsError.message}</p>} */}
      
      {profile.role === 'agent' && renderAgentDashboard()}
      {profile.role === 'manager' && renderManagerDashboard()}
      {profile.role === 'super_admin' && renderSuperAdminDashboard()}
    </div>
  );
};

export default DashboardPage; 