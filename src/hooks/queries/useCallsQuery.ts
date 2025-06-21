import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';

export interface Call {
  id: string;
  lead_id: string;
  user_id: string;
  duration: number; // in seconds
  call_type: 'inbound' | 'outbound' | 'callback' | 'voicemail';
  outcome: 'completed' | 'no_answer' | 'busy' | 'failed' | 'voicemail';
  notes: string | null;
  call_start_time: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  } | null;
}

interface UseCallsQueryOptions {
  leadId?: string;
  limit?: number;
  enabled?: boolean;
}

export const useCallsQuery = ({ leadId, limit = 50, enabled = true }: UseCallsQueryOptions = {}) => {
  return useQuery<Call[]>({
    queryKey: ['calls', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      let query = supabase
        .from('calls')
        .select(`
          *,
          user:user_id (id, full_name, avatar_url)
        `)
        .eq('lead_id', leadId)
        .order('call_start_time', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as Call[];
    },
    enabled: enabled && !!leadId,
  });
};

export default useCallsQuery;
