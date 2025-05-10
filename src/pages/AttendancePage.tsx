import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserTodayAttendanceQuery } from '../hooks/queries/useUserTodayAttendanceQuery';
import { useCheckInMutation } from '../hooks/mutations/useCheckInMutation';
import { useCheckOutMutation } from '../hooks/mutations/useCheckOutMutation';
import { Button } from '../components/ui/button';
import toast from 'react-hot-toast'; // Added for error notifications
import { Loader2 } from 'lucide-react'; // For loading spinner icon
import { useUserAttendanceHistoryQuery } from '../hooks/queries/useUserAttendanceHistoryQuery'; // Added
import AttendanceListDisplay from '../components/attendance/AttendanceListDisplay'; // Added

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
    // Placeholder for Manager/Superadmin views
    // Here you would use useTeamAttendanceQuery or useAllAttendanceQuery
    // and display data using a component like DailyReportsDisplay (adapted for attendance)
    return (
      <div className="mt-8 bg-card p-6 rounded-lg shadow border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {profile.role === 'manager' ? 'Team Attendance Overview' : 'All User Attendance'}
        </h2>
        <p className="text-muted-foreground">Manager and Superadmin attendance views are under construction.</p>
        {/* Example: <TeamAttendanceDisplay teamId={profile.id} /> */}
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
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-foreground">Attendance</h1>
      {renderUserAttendanceActions()}
      {(profile.role === 'manager' || profile.role === 'super_admin') && renderManagerAdminView()}
      {/* Placeholder for viewing own attendance history - Replaced with actual component */}
      <div className="mt-8">
        {renderMyAttendanceHistory()} 
      </div>
    </div>
  );
};

export default AttendancePage; 