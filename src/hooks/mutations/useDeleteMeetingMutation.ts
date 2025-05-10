import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

export const useDeleteMeetingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,       // No specific data returned on successful delete, typically
    Error,      // Error type
    string      // Input type to the mutation function (meetingId)
  >(
    async (meetingId: string) => {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) {
        console.error('Error deleting meeting:', error);
        toast.error(`Error deleting meeting: ${error.message}`);
        throw error;
      }
    },
    {
      onSuccess: (data, meetingId) => {
        toast.success('Meeting deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        // If you have queries for a specific meeting ID that might now be invalid:
        queryClient.removeQueries({ queryKey: ['meetings', meetingId] });
      },
      onError: (error: Error | PostgrestError, meetingId) => {
        console.error(`Mutation error deleting meeting ${meetingId}:`, error.message);
        // Toast error is handled in the mutation fn for supabase errors.
        // Add more specific handling if needed.
        if (!('code' in error)) {
          toast.error(`Failed to delete meeting: ${error.message}`);
        }
      },
    }
  );
}; 