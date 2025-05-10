import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Meeting } from '../../types';

interface UseMeetingsQueryArgs {
  leadId?: string;
  agentId?: string;
  // Add other filter parameters as needed, e.g., date range
}

const fetchMeetings = async (args: UseMeetingsQueryArgs): Promise<Meeting[]> => {
  let query = supabase
    .from('meetings')
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

  query = query.order('start_time', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching meetings:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useMeetingsQuery = (args: UseMeetingsQueryArgs = {}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('public:meetings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        (payload) => {
          console.log('Change received on meetings table!', payload);
          queryClient.invalidateQueries({ queryKey: ['meetings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, args.leadId, args.agentId]);

  return useQuery<Meeting[], Error>({
    queryKey: ['meetings', args],
    queryFn: () => fetchMeetings(args),
  });
}; 