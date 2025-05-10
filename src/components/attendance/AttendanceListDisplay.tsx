import React from 'react';
import { Attendance } from '../../types';
import { AlertCircle, CheckCircle2, LogOut, UserCircle } from 'lucide-react'; // Assuming these icons are available

interface AttendanceListDisplayProps {
  attendanceRecords: Attendance[];
  isLoading: boolean;
  error?: Error | null;
  title?: string;
  showUserName?: boolean; // To show user names for manager/admin views
  currentUserView?: boolean; // To adjust display slightly for "My History" view
}

const getStatusIcon = (status: Attendance['status']) => {
  switch (status) {
    case 'CheckedIn':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'CheckedOut':
      return <LogOut className="h-5 w-5 text-red-500" />;
    case 'OnLeave':
      return <UserCircle className="h-5 w-5 text-yellow-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

const AttendanceListDisplay: React.FC<AttendanceListDisplayProps> = ({
  attendanceRecords,
  isLoading,
  error,
  title = "Attendance Records",
  showUserName = false, // Default to false
  // currentUserView = true, // Example of how it might be used
}) => {
  if (isLoading) {
    return <div className="text-center p-4">Loading attendance records...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading records: {error.message}</div>;
  }

  if (!attendanceRecords || attendanceRecords.length === 0) {
    return <div className="text-muted-foreground p-4">No attendance records found.</div>;
  }

  return (
    <div className="bg-card p-4 sm:p-6 rounded-lg shadow border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <ul className="space-y-3">
        {attendanceRecords.map((record) => (
          <li key={record.id} className="p-3 border border-border rounded-md hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(record.status)}
                <div>
                  <p className="font-medium text-foreground">
                    {new Date(record.date).toLocaleDateString()} - <span className={`font-semibold ${record.status === 'CheckedIn' ? 'text-green-600' : record.status === 'CheckedOut' ? 'text-red-600' : 'text-yellow-600'}`}>{record.status}</span>
                  </p>
                  {showUserName && record.user_full_name && (
                     <p className="text-sm text-muted-foreground">User: {record.user_full_name}</p>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground text-right">
                {record.check_in_time && <p>In: {new Date(record.check_in_time).toLocaleTimeString()}</p>}
                {record.check_out_time && <p>Out: {new Date(record.check_out_time).toLocaleTimeString()}</p>}
              </div>
            </div>
            {record.notes && <p className="text-xs text-muted-foreground mt-2 pl-8">Notes: {record.notes}</p>}
          </li>
        ))}
      </ul>
      {/* Future: Add pagination controls here */}
    </div>
  );
};

export default AttendanceListDisplay; 