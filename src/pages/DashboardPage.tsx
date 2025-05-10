// src/pages/DashboardPage.tsx
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLeadsQuery } from '../hooks/queries/useLeadsQuery';
import { useFollowUpsQuery } from '../hooks/queries/useFollowUpsQuery';
import { useMeetingsQuery } from '../hooks/queries/useMeetingsQuery';
import { useUsersQuery } from '../hooks/queries/useUsersQuery';
import { FollowUp, Meeting, UserProfile, Lead } from '../types'; // Ensure Lead, Meeting, UserProfile are imported if not already
import StatCard from '../components/dashboard/StatCard';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, ChartEvent, ActiveElement } from 'chart.js';
import { Pie, Line, getElementAtEvent } from 'react-chartjs-2';

// Define a more specific type for chart events
type ChartNativeEvent = keyof HTMLElementEventMap;

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// --- SVG Icons for Stat Cards (can be expanded or moved to a shared file) ---
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-1.5M15 21H9" />
  </svg>
);

const LeadsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h2zm10 4h.01M17 7h2a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2V9a2 2 0 012-2h3zm-7 4h.01M10 11h2a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-2a2 2 0 012-2h3z" />
  </svg>
);

const FollowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M12 15h.01M12 12h.01" />
  </svg>
);

const MeetingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 21h10" />
  </svg>
);
// --- End SVG Icons ---

const DashboardPage: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const { data: leadsResponse, isLoading: isLoadingLeads } = useLeadsQuery({});
  const { data: followUpsData, isLoading: isLoadingFollowUps } = useFollowUpsQuery({});
  const { data: meetingsData, isLoading: isLoadingMeetings } = useMeetingsQuery({});
  const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery({});

  const navigate = useNavigate();
  const followUpStatusChartRef = useRef<ChartJS<'pie', number[], string> | null>(null);
  const meetingStatusChartRef = useRef<ChartJS<'pie', number[], string> | null>(null);

  const [startDate, setStartDate] = useState<string>(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>('');     // YYYY-MM-DD

  const isLoading = isLoadingLeads || isLoadingFollowUps || isLoadingMeetings || isLoadingUsers;

  const rawLeadsArray: Lead[] = leadsResponse?.leads || [];
  const rawFollowUpsArray: FollowUp[] = followUpsData || [];
  const rawMeetingsArray: Meeting[] = meetingsData || [];
  const usersArray: UserProfile[] = usersData || [];
  
  // Filtered data based on date range
  const [filteredLeadsArray, setFilteredLeadsArray] = useState<Lead[]>([]);
  const [filteredFollowUpsArray, setFilteredFollowUpsArray] = useState<FollowUp[]>([]);
  const [filteredMeetingsArray, setFilteredMeetingsArray] = useState<Meeting[]>([]);

  useEffect(() => {
    const filterByDateRange = <T extends { created_at: string }>(items: T[]): T[] => {
      if (!startDate && !endDate) return items;
      return items.filter(item => {
        const itemDate = new Date(item.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && itemDate < start) return false;
        if (end) {
          // To include the end date, set it to the end of the day
          const endOfDay = new Date(end);
          endOfDay.setHours(23, 59, 59, 999);
          if (itemDate > endOfDay) return false;
        }
        return true;
      });
    };

    setFilteredLeadsArray(filterByDateRange(rawLeadsArray));
    setFilteredFollowUpsArray(filterByDateRange(rawFollowUpsArray));
    setFilteredMeetingsArray(filterByDateRange(rawMeetingsArray));
  }, [rawLeadsArray, rawFollowUpsArray, rawMeetingsArray, startDate, endDate]);


  // --- KPI Calculations (now use filtered arrays) ---
  const totalLeads = filteredLeadsArray.length; // Corrected to use filtered length
  const totalFollowUps = filteredFollowUpsArray.length;
  const pendingFollowUps = filteredFollowUpsArray.filter((f: FollowUp) => f.status === 'Pending').length;
  const completedFollowUps = filteredFollowUpsArray.filter((f: FollowUp) => f.status === 'Completed').length;
  const totalMeetings = filteredMeetingsArray.length;
  const scheduledMeetings = filteredMeetingsArray.filter((m: Meeting) => m.status === 'Scheduled').length;
  const completedMeetings = filteredMeetingsArray.filter((m: Meeting) => m.status === 'Completed').length;
  const activeAgents = usersArray.filter((u: UserProfile) => u.role === 'agent').length;

  const totalExpectedRevenue = filteredLeadsArray.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);
  
  // --- End KPI Calculations ---

  // --- Chart Data Preparation (now use filtered arrays) ---
  const followUpStatusData = {
    labels: ['Pending', 'Completed', 'Rescheduled', 'Cancelled'] as FollowUp['status'][],
    datasets: [
      {
        label: 'Follow-up Statuses',
        data: [
          pendingFollowUps,
          completedFollowUps,
          filteredFollowUpsArray.filter((f: FollowUp) => f.status === 'Rescheduled').length,
          filteredFollowUpsArray.filter((f: FollowUp) => f.status === 'Cancelled').length,
        ],
        backgroundColor: [
          'rgba(255, 206, 86, 0.7)', // Yellow
          'rgba(75, 192, 192, 0.7)', // Green
          'rgba(54, 162, 235, 0.7)', // Blue
          'rgba(255, 99, 132, 0.7)',  // Red
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const monthlyLeadCounts = filteredLeadsArray.reduce((acc, lead) => {
    const month = new Date(lead.created_at).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const last6Months = Array.from({length: 6}, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString('default', { month: 'short' });
  }).reverse();

  const leadsOverTimeData = {
    labels: last6Months,
    datasets: [
      {
        label: 'New Leads',
        data: last6Months.map(month => monthlyLeadCounts[month] || 0),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  // Meeting Status Data Preparation
  const meetingStatusCounts = filteredMeetingsArray.reduce((acc, meeting) => {
    const status = meeting.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<Meeting['status'] | 'Unknown', number>);

  const meetingStatusChartData = {
    labels: Object.keys(meetingStatusCounts),
    datasets: [
      {
        label: 'Meeting Statuses',
        data: Object.values(meetingStatusCounts),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',  // Blue (Scheduled)
          'rgba(75, 192, 192, 0.7)',  // Green (Completed)
          'rgba(255, 206, 86, 0.7)',  // Yellow (Pending)
          'rgba(255, 99, 132, 0.7)',   // Red (Cancelled)
          'rgba(153, 102, 255, 0.7)', // Purple (Other/Unknown if any)
          'rgba(255, 159, 64, 0.7)',  // Orange
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Lead Source Data Preparation
  const leadSourceCounts = filteredLeadsArray.reduce((acc, lead) => {
    const source = lead.lead_source || 'Unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const leadSourceChartData = {
    labels: Object.keys(leadSourceCounts),
    datasets: [
      {
        label: 'Lead Sources',
        data: Object.values(leadSourceCounts),
        // Add more colors if you expect many lead sources
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)',
          'rgba(83, 102, 255, 0.7)',
        ],
        borderColor: Object.values(leadSourceCounts).map((_, index, arr) => arr[index] ? arr[index].toString().replace('0.7', '1') : 'rgba(0,0,0,1)'), // Derive from backgroundColor
        borderWidth: 1,
      },
    ],
  };

  const leadPriorityCounts = filteredLeadsArray.reduce((acc, lead) => {
    const priority = lead.status_bucket || 'Unknown'; // status_bucket is P1, P2, P3
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const leadPriorityChartData = {
    labels: Object.keys(leadPriorityCounts).sort(), // Sort to ensure P1, P2, P3 order if possible
    datasets: [
      {
        label: 'Leads by Priority',
        data: Object.keys(leadPriorityCounts).sort().map(key => leadPriorityCounts[key]),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',  // P1 - Red
          'rgba(255, 206, 86, 0.7)', // P2 - Yellow
          'rgba(75, 192, 192, 0.7)',  // P3 - Green
          'rgba(153, 102, 255, 0.7)', // Unknown - Purple
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const onFollowUpStatusClick = (event: ChartEvent) => {
    if (!followUpStatusChartRef.current) return;
    const elements = getElementAtEvent(followUpStatusChartRef.current, event as unknown as React.MouseEvent<HTMLCanvasElement, MouseEvent>);
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      const status = followUpStatusData.labels[elementIndex];
      if (status) {
        navigate(`/follow-ups?status=${encodeURIComponent(status)}`);
      }
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart Title' // Generic title, should be set per chart
      }
    }
  };

  const followUpChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: onFollowUpStatusClick,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Follow-up Statuses'
      }
    },
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'] as ChartNativeEvent[],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'New Leads (Last 6 Months)'
      }
    }
  };

  const meetingStatusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Meeting Statuses'
      }
    }
  };

  const leadSourceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Lead Source Distribution'
      }
    }
  };

  if (authLoading || isLoading) { // Combined loading state for auth and data
    return <div className="p-6 text-center text-xl">Loading dashboard data...</div>;
  }

  if (!profile) {
    return <div>Error: User profile not available. Please log in.</div>;
  }

  const renderAgentDashboard = () => {
    const agentLeads = filteredLeadsArray.filter(lead => lead.agent_id === profile?.id);
    const agentExpectedRevenue = agentLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="MY TOTAL LEADS" value={agentLeads.length.toString()} icon={<LeadsIcon />} />
          {/* Add more agent-specific StatCards here using agentLeads, agentFollowUps, agentMeetings */}
          <StatCard title="MY EXPECTED REVENUE" value={`$${agentExpectedRevenue.toLocaleString()}`} icon={<LeadsIcon />} />
        </div>
        {/* Agent-specific charts can be added here */}
        <p className="text-muted-foreground">Your personal dashboard with leads and activities assigned to you.</p>
      </div>
    );
  };

  const renderManagerDashboard = () => {
    if (!profile || !usersArray) return <p>Loading manager data...</p>;
    const managedAgentIds = usersArray.filter(user => user.manager_id === profile.id).map(agent => agent.id);
    const teamLeads = filteredLeadsArray.filter(lead => lead.agent_id && managedAgentIds.includes(lead.agent_id));
    const teamExpectedRevenue = teamLeads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="TEAM TOTAL LEADS" value={teamLeads.length.toString()} icon={<LeadsIcon />} />
          {/* Add more team-specific StatCards here */}
          <StatCard title="TEAM EXPECTED REVENUE" value={`$${teamExpectedRevenue.toLocaleString()}`} icon={<LeadsIcon />} />
        </div>
        {/* Team-specific charts can be added here */}
        <p className="text-muted-foreground">Dashboard for your team's performance and activities.</p>
      </div>
    );
  };

  const renderSuperAdminDashboard = () => {
    // totalExpectedRevenue is already calculated globally for Super Admin
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="TOTAL LEADS" value={totalLeads.toString()} icon={<LeadsIcon />} />
          <StatCard title="TOTAL FOLLOW-UPS" value={totalFollowUps.toString()} icon={<FollowUpIcon />} />
          <StatCard title="COMPLETED FOLLOW-UPS" value={completedFollowUps.toString()} icon={<FollowUpIcon />} />
          <StatCard title="PENDING FOLLOW-UPS" value={pendingFollowUps.toString()} icon={<FollowUpIcon />} />
          <StatCard title="TOTAL MEETINGS" value={totalMeetings.toString()} icon={<MeetingsIcon />} />
          <StatCard title="COMPLETED MEETINGS" value={completedMeetings.toString()} icon={<MeetingsIcon />} />
          <StatCard title="SCHEDULED MEETINGS" value={scheduledMeetings.toString()} icon={<MeetingsIcon />} />
          <StatCard title="ACTIVE AGENTS" value={activeAgents.toString()} icon={<UsersIcon />} />
          <StatCard title="TOTAL EXPECTED REVENUE" value={`$${totalExpectedRevenue.toLocaleString()}`} icon={<LeadsIcon />} />
        </div>
        
        {/* Date Filter Inputs */}
        <div className="bg-white p-4 shadow rounded-lg flex gap-4 items-center">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date:</label>
            <input 
              type="date" 
              id="startDate" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
      <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date:</label>
            <input 
              type="date" 
              id="endDate" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 shadow rounded-lg h-96">
            <h2 className="text-xl font-semibold text-center text-foreground mb-4">Follow-Up Status</h2>
            <div style={{ height: '350px' }}> 
              <Pie 
                data={followUpStatusData} 
                options={followUpChartOptions} 
              />
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-lg h-96">
            <h2 className="text-xl font-semibold text-center text-foreground mb-4">Leads by Priority</h2>
            <div style={{ height: '350px' }}> 
              <Pie 
                data={leadPriorityChartData} 
                options={{...chartOptions, plugins: {...chartOptions.plugins, title: {...chartOptions.plugins?.title, text: 'Leads by Priority'}}}} 
              />
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-lg h-96">
            <h2 className="text-xl font-semibold text-center text-foreground mb-4">New Leads (Last 6 Months)</h2>
            <div style={{ height: '350px' }}> 
              <Line 
                data={leadsOverTimeData} 
                options={lineChartOptions}
              />
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-lg h-96">
            <h2 className="text-xl font-semibold text-center text-foreground mb-4">Meeting Status</h2>
            <div style={{ height: '350px' }}> 
              <Pie 
                data={meetingStatusChartData} 
                options={meetingStatusChartOptions} 
              />
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-lg h-96">
            <h2 className="text-xl font-semibold text-center text-foreground mb-4">Lead Sources</h2>
            <div style={{ height: '350px' }}> 
              <Pie 
                data={leadSourceChartData} 
                options={leadSourceChartOptions} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-background text-foreground min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold text-foreground mb-2">CRM Dashboard</h1>
      <p className="text-muted-foreground mb-8">Overview of your sales and customer activities.</p>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Leads" value={totalLeads} icon={<LeadsIcon />} />
        <StatCard title="Pending Follow-Ups" value={pendingFollowUps} icon={<FollowUpIcon />} description={`out of ${totalFollowUps} total`} />
        <StatCard title="Scheduled Meetings" value={scheduledMeetings} icon={<MeetingsIcon />} description={`out of ${totalMeetings} total`} />
        <StatCard title="Active Agents" value={activeAgents} icon={<UsersIcon />} />
      </div>

      {/* Charts Section - now a 2x2 grid for potentially 4 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card shadow-xl rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold text-center text-foreground mb-4">Follow-Up Status</h2>
          <div style={{ height: '350px' }}> 
            <Pie 
              data={followUpStatusData} 
              options={followUpChartOptions} 
            />
          </div>
        </div>
        <div className="bg-card shadow-xl rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold text-center text-foreground mb-4">New Leads (Last 6 Months)</h2>
          <div style={{ height: '350px' }}> 
            <Line 
              data={leadsOverTimeData} 
              options={lineChartOptions}
            />
          </div>
        </div>
        <div className="bg-card shadow-xl rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold text-center text-foreground mb-4">Meeting Status</h2>
          <div style={{ height: '350px' }}> 
            <Pie 
              data={meetingStatusChartData} 
              options={meetingStatusChartOptions} 
            />
          </div>
        </div>
        <div className="bg-card shadow-xl rounded-xl p-6 border border-border">
          <h2 className="text-xl font-semibold text-center text-foreground mb-4">Lead Sources</h2>
          <div style={{ height: '350px' }}> 
            <Pie 
              data={leadSourceChartData} 
              options={leadSourceChartOptions} 
            />
          </div>
        </div>
      </div>
      
      {/* Placeholder for more advanced sections if needed */}
      {/* <div className="bg-white shadow-lg rounded-xl p-5 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Activity Feed (Coming Soon)</h2>
        <p className="text-gray-500">Recent activities and updates will appear here.</p>
      </div> */}
      
      {profile.role === 'agent' && renderAgentDashboard()}
      {profile.role === 'manager' && renderManagerDashboard()}
      {profile.role === 'super_admin' && renderSuperAdminDashboard()}
    </div>
  );
};

export default DashboardPage; 