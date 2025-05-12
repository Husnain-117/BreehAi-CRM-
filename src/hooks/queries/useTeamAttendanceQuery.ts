import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Attendance, UserProfile } from '../../types';

// Define a combined type for attendance with user info
export type TeamAttendanceRecord = Attendance & {
  user_full_name?: string | null; 
  user_email?: string | null;
};

interface UseTeamAttendanceQueryArgs {
  managerId?: string; // Fetch agents for this manager
  // userId?: string; // Could be used to fetch a specific user's record with name
  // Add date range filters if needed in the future
  // startDate?: string; // YYYY-MM-DD
  // endDate?: string; // YYYY-MM-DD
}

const fetchTeamAttendance = async (args: UseTeamAttendanceQueryArgs): Promise<TeamAttendanceRecord[]> => {
  let userIdsToFetch: string[] | null = null;

  // Step 1: Fetch relevant User IDs if filtering (Manager view)
  if (args.managerId) {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('manager_id', args.managerId);

    if (userError) {
      console.error('Error fetching users for manager:', userError);
      throw new Error(userError.message);
    }
    userIdsToFetch = users?.map(u => u.id) || [];
    // If no users found for manager, return empty array immediately
    if (userIdsToFetch.length === 0) {
      return [];
    }
  }

  // Step 2: Fetch Attendance records, joining with users for names
  let attendanceQuery = supabase
    .from('attendance')
    .select(`
      *,
      users ( full_name, email )
    `)
    .order('date', { ascending: false })
    .order('check_in_time', { ascending: false, nullsFirst: false });

  // Apply user ID filter if needed (Manager view)
  if (userIdsToFetch) {
    attendanceQuery = attendanceQuery.in('user_id', userIdsToFetch);
  }
  // For SuperAdmin (no managerId), it fetches all attendance

  const { data: attendanceData, error: attendanceError } = await attendanceQuery;

  if (attendanceError) {
    console.error('Error fetching team attendance:', attendanceError);
    throw new Error(attendanceError.message);
  }

  // Map data to include user details at the top level
  const mappedData = attendanceData?.map(record => ({
    ...record,
    user_full_name: (record.users as any)?.full_name,
    user_email: (record.users as any)?.email,
    users: undefined, // Remove nested object
  })) || [];

  return mappedData as TeamAttendanceRecord[];
};

// Correctly accept standard React Query options
export const useTeamAttendanceQuery = (
  args: UseTeamAttendanceQueryArgs = {},
  // Define the options type correctly, allowing standard useQuery options
  options?: Omit<UseQueryOptions<TeamAttendanceRecord[], Error>, 'queryKey' | 'queryFn'>
) => {
  // Construct the final options object for useQuery
  const queryOptions: UseQueryOptions<TeamAttendanceRecord[], Error> = {
    queryKey: ['team_attendance', args.managerId || 'all'], 
    queryFn: () => fetchTeamAttendance(args),
    ...options, // Spread any additional options provided
  };
  
  return useQuery<TeamAttendanceRecord[], Error>(queryOptions);
}; 