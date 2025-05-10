import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../api/supabaseClient'; // Adjusted path
import { FollowUp } from '../../types'; // Adjusted path

interface UseFollowUpsQueryArgs {
  leadId?: string;
  agentId?: string;
  // Add other filter parameters as needed, e.g., status, date range
}

const fetchFollowUps = async (args: UseFollowUpsQueryArgs): Promise<FollowUp[]> => {
  let query = supabase
    .from('follow_ups')
    .select(`
      *,
      leads (id, client_id, status_bucket, contact_person, clients (client_name)),
      users:agent_id (id, full_name)
    `);

  if (args.leadId) {
    query = query.eq('lead_id', args.leadId);
  }
  if (args.agentId) {
    query = query.eq('agent_id', args.agentId);
  }
  // Add more filters based on args

  query = query.order('due_date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching follow-ups:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useFollowUpsQuery = (args: UseFollowUpsQueryArgs = {}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('public:follow_ups') // Channel for follow_ups table
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follow_ups' }, // Listen to follow_ups table
        (payload) => {
          console.log('Change received on follow_ups table!', payload);
          queryClient.invalidateQueries({ queryKey: ['follow_ups'] }); // Invalidate follow_ups queries
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, args.leadId, args.agentId]); // Rerun if queryClient or key filter args change

  return useQuery<FollowUp[], Error>({
    queryKey: ['follow_ups', args], // Dynamic query key based on filters
    queryFn: () => fetchFollowUps(args),
    // You might want to configure staleTime, cacheTime, enabled, etc.
    // enabled: !!args.leadId, // Example: only enable if leadId is provided
  });
}; 