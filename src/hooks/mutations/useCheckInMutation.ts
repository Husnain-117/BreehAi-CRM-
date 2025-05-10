import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Attendance, AttendanceStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CheckInData {
  userId: string;
  // notes?: string; // Optional: if you want to allow notes on check-in
}

const checkInUser = async ({ userId }: CheckInData): Promise<Attendance> => {
  const today = new Date().toISOString().split('T')[0];
  const checkInTime = new Date().toISOString();

  // First, check if an attendance record for today already exists for this user
  const { data: existingRecord, error: fetchError } = await supabase
    .from('attendance')
    .select('id, status')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking existing attendance for check-in:', fetchError);
    throw fetchError;
  }

  if (existingRecord) {
    if (existingRecord.status === 'CheckedIn') {
      throw new Error('Already checked in for today.');
    }
    // If CheckedOut or OnLeave, we might allow re-check-in or update, 
    // but for simplicity now, we'll assume an update to CheckedIn for a CheckedOut record.
    // For 'OnLeave', this flow might need adjustment or be disallowed.
    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_in_time: checkInTime,
        status: 'CheckedIn' as AttendanceStatus,
        check_out_time: null, // Ensure check_out_time is cleared if re-checking in
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingRecord.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating attendance for check-in:', error);
      throw error;
    }
    return data as Attendance;
  }

  // No existing record, create a new one
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      user_id: userId,
      date: today,
      check_in_time: checkInTime,
      status: 'CheckedIn' as AttendanceStatus,
      // notes: notes, // if notes are passed
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting new attendance for check-in:', error);
    throw error;
  }
  return data as Attendance;
};

export const useCheckInMutation = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation(checkInUser, {
    onSuccess: (data) => {
      toast.success(`Checked in successfully at ${new Date(data.check_in_time!).toLocaleTimeString()}`);
      // Invalidate and refetch today's attendance for the current user to update UI
      queryClient.invalidateQueries(['userTodayAttendance', profile?.id]);
      // Optionally, invalidate broader attendance list queries if managers/admins are viewing
      queryClient.invalidateQueries(['allAttendance']); 
      queryClient.invalidateQueries(['teamAttendance', profile?.manager_id]);
    },
    onError: (error: Error) => {
      toast.error(`Check-in failed: ${error.message}`);
    },
  });
}; 