import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { UserProfile } from '../../types';

interface UseUsersQueryArgs {
  role?: 'agent' | 'manager' | 'super_admin';
  managerId?: string;
  // Add other filter parameters as needed
}

const fetchUsers = async (args: UseUsersQueryArgs): Promise<UserProfile[]> => {
  let query = supabase
    .from('users') // Assuming your public users table is named 'users'
    .select('id, full_name, email, role, manager_id');

  if (args.role) {
    query = query.eq('role', args.role);
  }
  if (args.managerId) {
    query = query.eq('manager_id', args.managerId);
  }
  // Add more filters based on args

  query = query.order('full_name', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useUsersQuery = (args: UseUsersQueryArgs = {}) => {
  return useQuery<UserProfile[], Error>({
    queryKey: ['users', args], // Dynamic query key based on filters
    queryFn: () => fetchUsers(args),
    // You might want to configure staleTime, cacheTime, etc.
  });
}; 