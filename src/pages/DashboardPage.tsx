// src/pages/DashboardPage.tsx
import React, { useRef } from 'react';
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

  const isLoading = isLoadingLeads || isLoadingFollowUps || isLoadingMeetings || isLoadingUsers;

  const leadsArray: Lead[] = leadsResponse?.leads || [];
  const followUpsArray: FollowUp[] = followUpsData || [];
  const meetingsArray: Meeting[] = meetingsData || [];
  const usersArray: UserProfile[] = usersData || [];

  // --- KPI Calculations ---
  const totalLeads = leadsResponse?.count || 0;
  const totalFollowUps = followUpsArray.length || 0;
  const pendingFollowUps = followUpsArray.filter((f: FollowUp) => f.status === 'Pending').length || 0;
  const totalMeetings = meetingsArray.length || 0;
  const scheduledMeetings = meetingsArray.filter((m: Meeting) => m.status === 'Scheduled').length || 0;
  const activeAgents = usersArray.filter((u: UserProfile) => u.role === 'agent').length || 0;
  // --- End KPI Calculations ---

  // --- Chart Data Preparation ---
  const followUpStatusData = {
    labels: ['Pending', 'Completed', 'Rescheduled', 'Cancelled'] as FollowUp['status'][],
    datasets: [
      {
        label: 'Follow-up Statuses',
        data: [
          pendingFollowUps,
          followUpsArray.filter((f: FollowUp) => f.status === 'Completed').length || 0,
          followUpsArray.filter((f: FollowUp) => f.status === 'Rescheduled').length || 0,
          followUpsArray.filter((f: FollowUp) => f.status === 'Cancelled').length || 0,
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

  const monthlyLeadCounts = leadsArray.reduce((acc, lead) => {
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
  const meetingStatusCounts = meetingsArray.reduce((acc, meeting) => {
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
  const leadSourceCounts = leadsArray.reduce((acc, lead) => {
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
    // const p1Count = leadsData?.leads.filter(l => l.status_bucket === 'P1').length || 0;
    // const p2Count = leadsData?.leads.filter(l => l.status_bucket === 'P2').length || 0;
    // const p3Count = leadsData?.leads.filter(l => l.status_bucket === 'P3').length || 0;
    return (
      <div className="mt-8 p-6 bg-card shadow-xl rounded-xl border border-border">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Agent Dashboard</h2>
        <p className="text-muted-foreground">Welcome, {profile.full_name}!</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <StatCard title="My P1 Leads" value={0 /* Replace with actual data */} icon={<LeadsIcon />} description="High priority" />
          <StatCard title="My Upcoming Follow-ups" value={0} icon={<FollowUpIcon />} />
          <StatCard title="My Meetings Today" value={0} icon={<MeetingsIcon />} />
        </div>
        {/* Further agent-specific charts or lists can go here */}
      </div>
    );
  };

  const renderManagerDashboard = () => {
    return (
      <div className="mt-8 p-6 bg-card shadow-xl rounded-xl border border-border">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Manager Dashboard</h2>
        <p className="text-muted-foreground">Welcome, {profile.full_name}!</p>
        <p className="text-muted-foreground mt-4">Team performance overview, lead distribution, etc. will be displayed here.</p>
        {/* Placeholder for team P1/P2/P3 counts, conversion rates, agent performance charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <StatCard title="Team Open Leads" value={0} icon={<LeadsIcon />} />
          <StatCard title="Team Conversion Rate" value={"0%"} icon={<UsersIcon />} /> 
        </div>
      </div>
    );
  };

  const renderSuperAdminDashboard = () => {
    return (
      <div className="mt-8 p-6 bg-card shadow-xl rounded-xl border border-border">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Super Admin Dashboard</h2>
        <p className="text-muted-foreground">Welcome, {profile.full_name}!</p>
        <p className="text-muted-foreground mt-4">Organization-wide overview, user activity, and system settings will be accessible here.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <StatCard title="Total Users" value={usersArray.length} icon={<UsersIcon />} />
          <StatCard title="System Health" value={"Nominal"} icon={<UsersIcon />} /> {/* Placeholder icon */} 
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