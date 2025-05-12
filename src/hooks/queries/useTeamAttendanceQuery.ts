import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Attendance, UserProfile } from '../../types';

// Define a combined type for attendance with user info
export type TeamAttendanceRecord = Attendance & {
  user_full_name?: string | null; 
  user_email?: string | null;
};

// Add new filter args
interface UseTeamAttendanceQueryArgs {
  managerId?: string; // Fetch agents for this manager
  agentId?: string; // Fetch specific agent's records
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: 'CheckedIn' | 'CheckedOut' | 'OnLeave'; // Filter by status
}

const fetchTeamAttendance = async (args: UseTeamAttendanceQueryArgs): Promise<TeamAttendanceRecord[]> => {
  let userIdsToFetch: string[] | null = null;

  // If specific agentId is provided, filter only by that
  if (args.agentId) {
    userIdsToFetch = [args.agentId];
  } 
  // Otherwise, if managerId is provided, fetch users for that manager
  else if (args.managerId) {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('manager_id', args.managerId);

    if (userError) {
      console.error('Error fetching users for manager:', userError);
      throw new Error(userError.message);
    }
    userIdsToFetch = users?.map(u => u.id) || [];
    if (userIdsToFetch.length === 0) return [];
  }
  // If neither agentId nor managerId is provided (Super Admin all view), userIdsToFetch remains null

  // Fetch Attendance records, joining with users for names
  let attendanceQuery = supabase
    .from('attendance')
    .select(`
      *,
      users ( full_name, email )
    `)
    .order('date', { ascending: false })
    .order('check_in_time', { ascending: false, nullsFirst: false });

  // Apply user ID filter if needed (Agent or Manager view)
  if (userIdsToFetch) {
    attendanceQuery = attendanceQuery.in('user_id', userIdsToFetch);
  }
  
  // Apply date filters
  if (args.startDate) {
    attendanceQuery = attendanceQuery.gte('date', args.startDate);
  }
  if (args.endDate) {
    attendanceQuery = attendanceQuery.lte('date', args.endDate);
  }

  // Apply status filter
  if (args.status) {
    attendanceQuery = attendanceQuery.eq('status', args.status);
  }

  const { data: attendanceData, error: attendanceError } = await attendanceQuery;

  if (attendanceError) {
    console.error('Error fetching team attendance:', attendanceError);
    throw new Error(attendanceError.message);
  }

  // Map data
  const mappedData = attendanceData?.map(record => ({
    ...record,
    user_full_name: (record.users as any)?.full_name,
    user_email: (record.users as any)?.email,
    users: undefined, 
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
    // Include all filter args in the queryKey for proper caching and refetching
    queryKey: ['team_attendance', args.managerId || 'all', args.agentId, args.startDate, args.endDate, args.status], 
    queryFn: () => fetchTeamAttendance(args),
    ...options, // Spread any additional options provided
  };
  
  return useQuery<TeamAttendanceRecord[], Error>(queryOptions);
}; 