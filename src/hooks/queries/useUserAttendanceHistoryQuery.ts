import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Attendance } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const fetchUserAttendanceHistory = async (userId: string): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false }); // Show most recent first

  if (error) {
    console.error("Error fetching user's attendance history:", error);
    throw error;
  }
  return data as Attendance[];
};

export const useUserAttendanceHistoryQuery = (
  options?: Omit<UseQueryOptions<Attendance[], Error, Attendance[], [string, string | undefined]>, 'queryKey' | 'queryFn'>
) => {
  const { profile, loading: authLoading } = useAuth();
  const userId = profile?.id;

  return useQuery<Attendance[], Error, Attendance[], [string, string | undefined]>(
    ['userAttendanceHistory', userId], // Query key includes userId
    () => {
      if (!userId) throw new Error('User ID not available for fetching attendance history');
      return fetchUserAttendanceHistory(userId);
    },
    {
      enabled: !!userId && !authLoading, // Only run query if userId is available and auth is not loading
      staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
      ...options,
    }
  );
}; 