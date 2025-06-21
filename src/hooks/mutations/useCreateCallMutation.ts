import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export interface CreateCallData {
  lead_id: string;
  user_id: string;
  duration: number; // in seconds
  call_type: 'inbound' | 'outbound' | 'callback' | 'voicemail';
  outcome: 'completed' | 'no_answer' | 'busy' | 'failed' | 'voicemail';
  notes?: string;
  call_start_time: string;
}

export const useCreateCallMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (callData: CreateCallData) => {
      const { data, error } = await supabase
        .from('calls')
        .insert({
          ...callData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    {
      onSuccess: (data, variables) => {
        // Invalidate and refetch
        queryClient.invalidateQueries(['calls', variables.lead_id]);
        queryClient.invalidateQueries(['leadActivities', variables.lead_id]);
        queryClient.invalidateQueries(['lead', variables.lead_id]);
        
        toast.success('Call logged successfully');
      },
      onError: (error: Error) => {
        console.error('Error creating call:', error);
        toast.error('Failed to log call');
      },
    }
  );
};

export default useCreateCallMutation;
