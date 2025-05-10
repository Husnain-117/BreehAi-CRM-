import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import toast from 'react-hot-toast';

interface UpdateLeadAgentVariables {
  leadId: string;
  agentId: string | null;
}

const updateLeadAgent = async ({ leadId, agentId }: UpdateLeadAgentVariables) => {
  const { data, error } = await supabase
    .from('leads')
    .update({ agent_id: agentId })
    .eq('id', leadId)
    .select('id, agent_id') // select to confirm
    .single();

  if (error) {
    console.error('Error updating lead agent:', error);
    throw new Error(error.message || 'Failed to update lead agent.');
  }
  return data;
};

export const useUpdateLeadAgentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(updateLeadAgent, {
    onSuccess: (data) => {
      toast.success(`Lead agent updated successfully.`);
      // Invalidate queries that depend on lead data, especially the main leads list
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', data?.id] }); // If you have individual lead queries
      // May also need to invalidate dashboard stats if they depend on agent assignments
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }); 
    },
    onError: (error: Error) => {
      toast.error(`Failed to update agent: ${error.message}`);
    },
  });
}; 