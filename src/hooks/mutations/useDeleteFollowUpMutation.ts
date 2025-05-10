import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

export const useDeleteFollowUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,       // No specific data returned on successful delete
    Error,      // Error type
    string      // Input type: followUpId
  >(
    async (followUpId: string) => {
      const { error } = await supabase
        .from('follow_ups')
        .delete()
        .eq('id', followUpId);

      if (error) {
        console.error('Error deleting follow-up:', error);
        toast.error(`Error deleting follow-up: ${error.message}`);
        throw error;
      }
    },
    {
      onSuccess: (data, followUpId) => {
        toast.success('Follow-up deleted successfully!');
        queryClient.invalidateQueries({ queryKey: ['follow_ups'] });
        // Remove queries for the specific deleted follow-up to prevent stale data if accessed directly
        queryClient.removeQueries({ queryKey: ['follow_ups', followUpId] });
      },
      onError: (error: Error | PostgrestError, followUpId) => {
        console.error(`Mutation error deleting follow-up ${followUpId}:`, error.message);
        if (!('code' in error)) {
          toast.error(`Failed to delete follow-up: ${error.message}`);
        }
      },
    }
  );
}; 