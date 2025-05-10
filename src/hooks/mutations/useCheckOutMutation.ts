import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Attendance, AttendanceStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CheckOutData {
  attendanceRecordId: string;
  // notes?: string; // Optional: if you want to allow notes on check-out
}

const checkOutUser = async ({ attendanceRecordId }: CheckOutData): Promise<Attendance> => {
  const checkOutTime = new Date().toISOString();

  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_out_time: checkOutTime,
      status: 'CheckedOut' as AttendanceStatus,
      updated_at: new Date().toISOString(),
      // notes: notes, // if notes are passed
    })
    .eq('id', attendanceRecordId)
    .eq('status', 'CheckedIn') // Ensure we only check out if currently checked in
    .select()
    .single();

  if (error) {
    console.error('Error updating attendance for check-out:', error);
    // Handle specific case where the record was not 'CheckedIn' or not found
    if (error.code === 'PGRST116') { // PostgREST error for "single row not found"
        throw new Error('Could not find an active check-in record to check out. Please refresh.');
    }
    throw error;
  }
  if (!data) {
    // This case might happen if the status was not 'CheckedIn' so update didn't apply
    throw new Error('Failed to check out. You might not be checked in or the record was modified. Please refresh.');
  }
  return data as Attendance;
};

export const useCheckOutMutation = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation(checkOutUser, {
    onSuccess: (data) => {
      toast.success(`Checked out successfully at ${new Date(data.check_out_time!).toLocaleTimeString()}`);
      // Invalidate and refetch today's attendance for the current user to update UI
      queryClient.invalidateQueries(['userTodayAttendance', profile?.id]);
      // Optionally, invalidate broader attendance list queries if managers/admins are viewing
      queryClient.invalidateQueries(['allAttendance']);
      queryClient.invalidateQueries(['teamAttendance', profile?.manager_id]);
    },
    onError: (error: Error) => {
      toast.error(`Check-out failed: ${error.message}`);
    },
  });
}; 