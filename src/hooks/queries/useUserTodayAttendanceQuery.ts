import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Attendance } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const fetchUserTodayAttendance = async (userId: string): Promise<Attendance | null> => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle(); // Fetches a single record or null, errors if multiple (should not happen for user_id/date)

  if (error) {
    console.error("Error fetching today's attendance:", error);
    throw error;
  }
  return data as Attendance | null;
};

export const useUserTodayAttendanceQuery = (
  options?: Omit<UseQueryOptions<Attendance | null, Error, Attendance | null, [string, string | undefined]>, 'queryKey' | 'queryFn'>
) => {
  const { profile, loading: authLoading } = useAuth();
  const userId = profile?.id;

  return useQuery<Attendance | null, Error, Attendance | null, [string, string | undefined]>(
    ['userTodayAttendance', userId], // Query key includes userId to refetch if user changes
    () => {
      if (!userId) throw new Error('User ID not available for fetching attendance');
      return fetchUserTodayAttendance(userId);
    },
    {
      enabled: !!userId && !authLoading, // Only run query if userId is available and auth is not loading
      staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes for attendance status
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      ...options,
    }
  );
}; 