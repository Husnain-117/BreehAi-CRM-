import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import toast from 'react-hot-toast';

export const useBulkDeleteLeadsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      console.log(`Starting bulk deletion for ${leadIds.length} leads:`, leadIds);
      
      if (leadIds.length === 0) {
        throw new Error('No leads selected for deletion');
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process deletions in parallel but with some error handling
      const deletePromises = leadIds.map(async (leadId) => {
        try {
          // Delete follow-ups for this lead
          const { error: followUpError } = await supabase
            .from('follow_ups')
            .delete()
            .eq('lead_id', leadId);

          if (followUpError) {
            throw new Error(`Follow-ups deletion failed: ${followUpError.message}`);
          }

          // Delete meetings for this lead
          const { error: meetingError } = await supabase
            .from('meetings')
            .delete()
            .eq('lead_id', leadId);

          if (meetingError) {
            throw new Error(`Meetings deletion failed: ${meetingError.message}`);
          }

          // Delete the lead itself
          const { error: leadError } = await supabase
            .from('leads')
            .delete()
            .eq('id', leadId);

          if (leadError) {
            throw new Error(`Lead deletion failed: ${leadError.message}`);
          }

          successCount++;
          console.log(`Successfully deleted lead: ${leadId}`);
          
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Lead ${leadId}: ${errorMessage}`);
          console.error(`Failed to delete lead ${leadId}:`, error);
        }
      });

      // Wait for all deletion attempts to complete
      await Promise.all(deletePromises);

      console.log(`Bulk deletion completed: ${successCount} successful, ${errorCount} failed`);

      // If some deletions failed, throw an error with details
      if (errorCount > 0) {
        const errorMessage = `${errorCount} out of ${leadIds.length} leads failed to delete. Errors: ${errors.join('; ')}`;
        throw new Error(errorMessage);
      }

      return { successCount, errorCount, deletedLeadIds: leadIds };
    },
    onSuccess: (result) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['follow_ups'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      
      // Remove specific queries for deleted leads
      result.deletedLeadIds.forEach(leadId => {
        queryClient.removeQueries({ queryKey: ['leads', leadId] });
        queryClient.removeQueries({ queryKey: ['follow_ups', leadId] });
        queryClient.removeQueries({ queryKey: ['meetings', leadId] });
      });

      console.log(`Bulk deletion successful: ${result.successCount} leads deleted`);
    },
    onError: (error: Error) => {
      console.error('Bulk delete leads mutation failed:', error);
      toast.error(`Bulk deletion failed: ${error.message}`);
    },
  });
};

// Alternative: Database function approach for better performance
// Create this SQL function in Supabase for better performance:

/*
-- SQL function for bulk delete with cascading
CREATE OR REPLACE FUNCTION bulk_delete_leads(lead_ids UUID[])
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER := 0;
    error_count INTEGER := 0;
    current_lead_id UUID;
    result JSON;
BEGIN
    -- Loop through each lead ID
    FOREACH current_lead_id IN ARRAY lead_ids
    LOOP
        BEGIN
            -- Delete follow-ups
            DELETE FROM follow_ups WHERE lead_id = current_lead_id;
            
            -- Delete meetings  
            DELETE FROM meetings WHERE lead_id = current_lead_id;
            
            -- Delete the lead
            DELETE FROM leads WHERE id = current_lead_id;
            
            deleted_count := deleted_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            -- Log the error but continue with other leads
            RAISE NOTICE 'Failed to delete lead %: %', current_lead_id, SQLERRM;
        END;
    END LOOP;
    
    -- Return result summary
    result := json_build_object(
        'deleted_count', deleted_count,
        'error_count', error_count,
        'total_requested', array_length(lead_ids, 1)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION bulk_delete_leads(UUID[]) TO authenticated;
*/

// Enhanced version using the database function (uncomment if you create the SQL function above)
/*
export const useBulkDeleteLeadsMutationOptimized = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      if (leadIds.length === 0) {
        throw new Error('No leads selected for deletion');
      }

      const { data, error } = await supabase.rpc('bulk_delete_leads', {
        lead_ids: leadIds
      });

      if (error) {
        throw new Error(`Bulk deletion failed: ${error.message}`);
      }

      if (data.error_count > 0) {
        throw new Error(`${data.error_count} out of ${data.total_requested} leads failed to delete`);
      }

      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['follow_ups'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      
      toast.success(`Successfully deleted ${result.deleted_count} leads`);
    },
    onError: (error: Error) => {
      console.error('Bulk delete leads mutation failed:', error);
      toast.error(`Bulk deletion failed: ${error.message}`);
    },
  });
};
*/ 