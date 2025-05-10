import React, { useState, useEffect } from 'react';
import { useUsersQuery } from '../../hooks/queries/useUsersQuery';
import { useLeadsQuery } from '../../hooks/queries/useLeadsQuery';
import { useFollowUpsQuery } from '../../hooks/queries/useFollowUpsQuery';
import { useMeetingsQuery } from '../../hooks/queries/useMeetingsQuery';
import { UserProfile, Lead, FollowUp, Meeting } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// Helper to get start date for daily/weekly
const getStartDateForPeriod = (period: 'daily' | 'weekly' | 'all'): Date | null => {
  const now = new Date();
  if (period === 'daily') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return today;
  }
  if (period === 'weekly') {
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))); // Adjust for Sunday start
    weekStart.setHours(0,0,0,0);
    return weekStart;
  }
  return null; // For 'all' or other cases
};


const TeamProgressPage: React.FC = () => {
  const { profile } = useAuth();
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: new Date() });

  useEffect(() => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of current day
    setDateRange({ start: getStartDateForPeriod(timePeriod), end: endDate });
  }, [timePeriod]);

  // Fetching all data initially, then filtering client-side by date range and team structure.
  // For larger datasets, consider passing date filters to the queries if supported.
  const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery({});
  const { data: leadsData, isLoading: isLoadingLeads } = useLeadsQuery({}); // Assuming this fetches all leads
  const { data: followUpsData, isLoading: isLoadingFollowUps } = useFollowUpsQuery({});
  const { data: meetingsData, isLoading: isLoadingMeetings } = useMeetingsQuery({});

  const isLoading = isLoadingUsers || isLoadingLeads || isLoadingFollowUps || isLoadingMeetings;

  const managers = usersData?.filter((user: UserProfile) => user.role === 'manager') || [];
  const allAgents = usersData?.filter((user: UserProfile) => user.role === 'agent') || [];
  const allLeads = leadsData?.leads || [];
  const allFollowUps = followUpsData || [];
  const allMeetings = meetingsData || [];
  
  if (isLoading) {
    return <div className="p-6 text-center">Loading team progress data...</div>;
  }

  if (profile?.role !== 'super_admin') {
    return <div className="p-6 text-center text-red-500">Access Denied. This page is for Super Admins only.</div>;
  }
  
  // Filter activities by date range
  const filterByDate = <T extends { created_at: string | Date }>(items: T[]): T[] => {
    if (!dateRange.start) return items; // If 'all' time, no date filtering
    return items.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= dateRange.start! && itemDate <= dateRange.end!;
    });
  };

  const periodLeads = filterByDate(allLeads);
  const periodFollowUps = filterByDate(allFollowUps);
  const periodMeetings = filterByDate(allMeetings);

  return (
    <div className="p-4 sm:p-6 bg-background text-foreground min-h-screen">
      <h1 className="text-3xl font-bold text-foreground mb-6">Team Progress Overview</h1>
      
      <div className="mb-6 flex items-center space-x-4">
        <label htmlFor="timePeriod" className="font-medium">Select Period:</label>
        <select
          id="timePeriod"
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as 'daily' | 'weekly' | 'all')}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      {managers.map((manager) => {
        const teamAgentIds = allAgents.filter(agent => agent.manager_id === manager.id).map(a => a.id);
        
        const teamLeads = periodLeads.filter(lead => lead.agent_id && teamAgentIds.includes(lead.agent_id));
        const teamFollowUps = periodFollowUps.filter(followUp => followUp.agent_id && teamAgentIds.includes(followUp.agent_id));
        const teamMeetings = periodMeetings.filter(meeting => meeting.agent_id && teamAgentIds.includes(meeting.agent_id));

        const teamCompletedFollowUps = teamFollowUps.filter(f => f.status === 'Completed').length;
        const teamCompletedMeetings = teamMeetings.filter(m => m.status === 'Completed').length;
        const teamRevenue = teamLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);

        return (
          <div key={manager.id} className="mb-8 p-6 bg-card shadow-xl rounded-xl border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-3">{manager.full_name || 'Unnamed Manager'}</h2>
            <p className="text-sm text-muted-foreground mb-4">Team Progress ({timePeriod})</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-background rounded-lg shadow">
                <h3 className="text-sm font-medium text-muted-foreground">New Leads</h3>
                <p className="text-2xl font-bold">{teamLeads.length}</p>
              </div>
              <div className="p-4 bg-background rounded-lg shadow">
                <h3 className="text-sm font-medium text-muted-foreground">Follow-ups Done</h3>
                <p className="text-2xl font-bold">{teamCompletedFollowUps}</p>
              </div>
              <div className="p-4 bg-background rounded-lg shadow">
                <h3 className="text-sm font-medium text-muted-foreground">Meetings Done</h3>
                <p className="text-2xl font-bold">{teamCompletedMeetings}</p>
              </div>
              <div className="p-4 bg-background rounded-lg shadow">
                <h3 className="text-sm font-medium text-muted-foreground">Expected Revenue</h3>
                <p className="text-2xl font-bold">${teamRevenue.toLocaleString()}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Team Members ({teamAgentIds.length})</h3>
            {teamAgentIds.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {allAgents.filter(agent => agent.manager_id === manager.id).map(agent => (
                  <li key={agent.id}>{agent.full_name || 'Unnamed Agent'}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No agents assigned to this manager.</p>
            )}
          </div>
        );
      })}
      {managers.length === 0 && (
        <p className="text-center text-muted-foreground">No managers found in the system.</p>
      )}
    </div>
  );
};

export default TeamProgressPage; 