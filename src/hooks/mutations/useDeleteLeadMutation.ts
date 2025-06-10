// useDeleteLeadMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import toast from 'react-hot-toast';

export const useDeleteLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      console.log(`Starting deletion process for lead: ${leadId}`);
      
      // First, delete all related follow-ups
      const { error: followUpError } = await supabase
        .from('follow_ups')
        .delete()
        .eq('lead_id', leadId);

      if (followUpError) {
        console.error('Error deleting follow-ups:', followUpError);
        throw new Error(`Failed to delete follow-ups: ${followUpError.message}`);
      }

      // Then, delete all related meetings
      const { error: meetingError } = await supabase
        .from('meetings')
        .delete()
        .eq('lead_id', leadId);

      if (meetingError) {
        console.error('Error deleting meetings:', meetingError);
        throw new Error(`Failed to delete meetings: ${meetingError.message}`);
      }

      // Finally, delete the lead itself
      const { error: leadError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (leadError) {
        console.error('Error deleting lead:', leadError);
        throw new Error(`Failed to delete lead: ${leadError.message}`);
      }

      console.log(`Successfully deleted lead: ${leadId}`);
      return leadId;
    },
    onSuccess: (deletedLeadId) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['follow_ups'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      
      // Remove specific queries for this lead
      queryClient.removeQueries({ queryKey: ['leads', deletedLeadId] });
      queryClient.removeQueries({ queryKey: ['follow_ups', deletedLeadId] });
      queryClient.removeQueries({ queryKey: ['meetings', deletedLeadId] });
    },
    onError: (error: Error) => {
      console.error('Delete lead mutation failed:', error);
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });
};
