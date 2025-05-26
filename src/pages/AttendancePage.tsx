import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserTodayAttendanceQuery } from '../hooks/queries/useUserTodayAttendanceQuery';
import { useCheckInMutation } from '../hooks/mutations/useCheckInMutation';
import { useCheckOutMutation } from '../hooks/mutations/useCheckOutMutation';
import { Button } from '../components/ui/button';
import toast from 'react-hot-toast'; // Added for error notifications
import { Loader2, CalendarDays, User, Users, ListFilter, SlidersHorizontal } from 'lucide-react'; // Added SlidersHorizontal
import { useUserAttendanceHistoryQuery } from '../hooks/queries/useUserAttendanceHistoryQuery'; // Added
import { useTeamAttendanceQuery, TeamAttendanceRecord } from '../hooks/queries/useTeamAttendanceQuery'; // Import the new hook and type
import AttendanceListDisplay from '../components/attendance/AttendanceListDisplay'; // Added
import { DatePicker } from '../components/ui/date-picker'; // Import DatePicker
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'; // For filters
import { useUsersQuery } from '../hooks/queries/useUsersQuery'; // For agent/manager dropdowns

// Add ALL_VALUE constant
const ALL_VALUE = "__ALL__";

const AttendancePage: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const { 
    data: todayAttendance,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchTodayAttendance,
  } = useUserTodayAttendanceQuery();

  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  // Added for My Attendance History
  const {
    data: attendanceHistory,
    isLoading: historyLoading,
    error: historyError,
  } = useUserAttendanceHistoryQuery();

  // --- State for Team/All View Filters ---
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);
  // Initialize filters with ALL_VALUE
  const [filterAgentId, setFilterAgentId] = useState<string>(ALL_VALUE);
  const [filterManagerId, setFilterManagerId] = useState<string>(ALL_VALUE); // Specific for super admin filter
  const [filterStatus, setFilterStatus] = useState<'CheckedIn' | 'CheckedOut' | 'OnLeave' | typeof ALL_VALUE >(ALL_VALUE);

  // Fetch users for dropdowns
  const { data: allUsers } = useUsersQuery({}); 
  const agents = useMemo(() => allUsers?.filter(u => u.role === 'agent') || [], [allUsers]);
  const managers = useMemo(() => allUsers?.filter(u => u.role === 'manager') || [], [allUsers]);

  const handleCheckIn = () => {
    if (!profile?.id) return;
    checkInMutation.mutate({ userId: profile.id });
  };

  const handleCheckOut = () => {
    if (!todayAttendance?.id || todayAttendance.status !== 'CheckedIn') return;
    checkOutMutation.mutate({ attendanceRecordId: todayAttendance.id });
  };

  if (authLoading) {
    return <div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> Loading user data...</div>;
  }
  if (!profile) {
    return <div className="p-6 text-center">Please login to access attendance.</div>;
  }

  const renderUserAttendanceActions = () => {
    if (attendanceLoading) {
      return <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /> Fetching attendance status...</div>;
    }
    if (attendanceError) {
      toast.error(`Could not load attendance status: ${attendanceError.message}`);
      return (
        <div className="bg-card p-6 rounded-lg shadow border border-border text-red-600">
          <p className="font-semibold">Error</p>
          <p>Could not load attendance status. Please try refreshing or contact support if the issue persists.</p>
        </div>
      );
    }

    let statusMessage = "You are currently checked out.";
    let actionButton: JSX.Element | null = (
      <Button 
        onClick={handleCheckIn} 
        disabled={checkInMutation.isLoading || todayAttendance?.status === 'CheckedIn'}
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
      >
        {checkInMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Check In
      </Button>
    );

    if (todayAttendance?.status === 'CheckedIn') {
      statusMessage = `Checked in since ${new Date(todayAttendance.check_in_time!).toLocaleTimeString()}`;
      actionButton = (
        <Button 
          onClick={handleCheckOut} 
          disabled={checkOutMutation.isLoading}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
        >
          {checkOutMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Check Out
        </Button>
      );
    } else if (todayAttendance?.status === 'OnLeave') {
      statusMessage = "You are currently marked as 'On Leave'.";
      actionButton = null; // Or a button to cancel leave, etc.
    }
    
    return (
      <div className="bg-card p-6 rounded-lg shadow border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Today's Attendance</h2>
        <p className="text-muted-foreground mb-1">Status: {statusMessage}</p>
        {todayAttendance?.notes && <p className="text-sm text-muted-foreground mb-4">Notes: {todayAttendance.notes}</p>}
        {actionButton ? <div className="mt-4">{actionButton}</div> : null}
         {/* Button to manually refresh, useful if refetchInterval isn't aggressive enough or for immediate feedback */}
        <Button onClick={() => refetchTodayAttendance()} variant="outline" size="sm" className="mt-4 text-xs">
          Refresh Status
        </Button>
      </div>
    );
  };

  const renderManagerAdminView = () => {
    const isManager = profile?.role === 'manager';
    const isSuperAdmin = profile?.role === 'super_admin';

    // Determine manager ID for query: specific manager for super admin filter, or logged-in manager
    const managerIdForQuery = isSuperAdmin ? (filterManagerId === ALL_VALUE ? undefined : filterManagerId) : (isManager ? profile.id : undefined);

    const queryArgs = {
      managerId: managerIdForQuery,
      agentId: filterAgentId === ALL_VALUE ? undefined : filterAgentId, 
      startDate: filterStartDate ? filterStartDate.toISOString().split('T')[0] : undefined,
      endDate: filterEndDate ? filterEndDate.toISOString().split('T')[0] : undefined,
      status: filterStatus === ALL_VALUE ? undefined : filterStatus,
    };
    const queryOptions = {
      enabled: !!profile && (isManager || isSuperAdmin),
    };

    const { 
      data: teamAttendance, 
      isLoading: teamLoading, 
      error: teamError 
    } = useTeamAttendanceQuery(queryArgs, queryOptions);

    return (
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-semibold text-foreground">
          {isManager ? 'Team Attendance' : 'All User Attendance'}
        </h2>
        
        {/* --- Filter Controls --- */}
        <div className="p-4 border rounded-lg bg-card shadow-sm">
            <h3 className="flex items-center text-md font-semibold mb-4 text-foreground">
               <SlidersHorizontal className="w-5 h-5 mr-2 text-muted-foreground"/> Filters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Date Start */}
              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-medium text-muted-foreground">
                  <CalendarDays className="w-4 h-4 mr-1.5" /> Start Date
                </label>
                <DatePicker date={filterStartDate} setDate={setFilterStartDate} />
              </div>
              {/* Date End */}
              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-medium text-muted-foreground">
                  <CalendarDays className="w-4 h-4 mr-1.5" /> End Date
                </label>
                <DatePicker date={filterEndDate} setDate={setFilterEndDate} />
              </div>
              {/* Agent Filter (Super Admin only - maybe manager too?) */}
              {/* Decide if Manager should also see Agent filter */} 
              {(isSuperAdmin || isManager) && (
                 <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-medium text-muted-foreground">
                    <User className="w-4 h-4 mr-1.5" /> Agent
                  </label>
                  {/* Use ALL_VALUE for the 'All' option */}
                  <Select value={filterAgentId} onValueChange={(value: string) => setFilterAgentId(value)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Agents" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>All Agents</SelectItem>
                      {/* Only show agents relevant to the selected manager if manager is filtered */}
                      {(isSuperAdmin && filterManagerId !== ALL_VALUE ? agents.filter(a => a.manager_id === filterManagerId) : agents)
                        .map(agent => (
                        agent.id ? <SelectItem key={agent.id} value={agent.id}>{agent.full_name || agent.email}</SelectItem> : null
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Manager Filter (Super Admin only) */}
              {isSuperAdmin && (
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-medium text-muted-foreground">
                    <Users className="w-4 h-4 mr-1.5" /> Manager
                  </label>
                  {/* Use ALL_VALUE for the 'All' option */}
                  <Select value={filterManagerId} onValueChange={(value: string) => { setFilterManagerId(value); setFilterAgentId(ALL_VALUE); /* Reset agent if manager changes */ }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Managers" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>All Managers</SelectItem>
                      {managers.map(manager => (
                        manager.id ? <SelectItem key={manager.id} value={manager.id}>{manager.full_name || manager.email}</SelectItem> : null
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-medium text-muted-foreground">
                  <ListFilter className="w-4 h-4 mr-1.5" /> Status
                </label>
                {/* Use ALL_VALUE for the 'All' option */}
                <Select value={filterStatus} onValueChange={(value: string) => setFilterStatus(value as any /* Cast needed, or type ALL_VALUE */)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All Statuses</SelectItem>
                    <SelectItem value="CheckedIn">Checked In</SelectItem>
                    <SelectItem value="CheckedOut">Checked Out</SelectItem>
                    <SelectItem value="OnLeave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>

        {/* Attendance List Display */}
        <AttendanceListDisplay 
          attendanceRecords={teamAttendance || []}
          isLoading={teamLoading}
          error={teamError}
          title="Filtered Attendance History" // Changed title
          showUserName={true} 
        />
      </div>
    );
  }

  // Added for My Attendance History section
  const renderMyAttendanceHistory = () => {
    return (
      <AttendanceListDisplay 
        attendanceRecords={attendanceHistory || []}
        isLoading={historyLoading}
        error={historyError}
        title="My Attendance History"
        currentUserView={true} // Indicate this is for the current user's own view
      />
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
      
      {/* Grid layout for sections */} 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Column 1: Actions and Own History */} 
        <div className="lg:col-span-1 space-y-8">
      {renderUserAttendanceActions()}
        {renderMyAttendanceHistory()} 
        </div>
        
        {/* Column 2: Team/All View (if applicable) */} 
        {(profile?.role === 'manager' || profile?.role === 'super_admin') && (
            <div className="lg:col-span-2">
                 {renderManagerAdminView()} 
            </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage; 