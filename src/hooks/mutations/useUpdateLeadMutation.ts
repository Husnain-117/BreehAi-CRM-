import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { LeadFormData } from '../../types/leadSchema';
import { Lead } from '../../types'; // For return type
import toast from 'react-hot-toast';

interface UpdateLeadVariables {
  leadId: string;
  clientId: string; // ID of the linked client record
  updatedData: Partial<LeadFormData>; // Use Partial as not all fields might be edited
}

const updateLead = async ({ leadId, clientId, updatedData }: UpdateLeadVariables): Promise<Lead | null> => {
  // Separate client data from lead data
  const {
    clientName,
    companyName,
    companySize,
    // other fields that are actually on the Zod schema but might belong to client
    ...leadSpecificData 
  } = updatedData;

  // 1. Update client details if they are part of updatedData and clientId is valid
  if (clientId && (clientName !== undefined || companyName !== undefined || companySize !== undefined)) {
    const clientUpdates: { client_name?: string; company?: string; company_size?: number | null } = {};
    if (clientName !== undefined) clientUpdates.client_name = clientName;
    if (companyName !== undefined) clientUpdates.company = companyName;
    if (companySize !== undefined) clientUpdates.company_size = typeof companySize === 'number' ? companySize : null;
    
    if (Object.keys(clientUpdates).length > 0) {
      const { error: clientError } = await supabase
        .from('clients')
        .update(clientUpdates)
        .eq('id', clientId);

      if (clientError) {
        console.error('Error updating client details:', clientError);
        toast.error(`Failed to update client details: ${clientError.message}`);
        // Decide if we should proceed if client update fails. For now, we will.
      }
    }
  }

  // 2. Prepare and update lead-specific data
  const leadUpdatesForDb: Record<string, any> = { ...leadSpecificData };
  if (updatedData.status) {
    leadUpdatesForDb.status_bucket = updatedData.status;
  }
  if (updatedData.agent_id !== undefined) {
    leadUpdatesForDb.agent_id = updatedData.agent_id === '' ? null : updatedData.agent_id;
  }
  if (updatedData.dealValue !== undefined) {
    leadUpdatesForDb.deal_value = typeof updatedData.dealValue === 'number' ? updatedData.dealValue : null;
  }
  if (updatedData.tags !== undefined) {
    if (typeof updatedData.tags === 'string') {
      leadUpdatesForDb.tags = updatedData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else {
      leadUpdatesForDb.tags = updatedData.tags; // Should already be an array if not string
    }
  }

  // Remove fields not directly on 'leads' table or handled above
  delete leadUpdatesForDb.clientName;
  delete leadUpdatesForDb.companyName;
  delete leadUpdatesForDb.companySize;
  delete leadUpdatesForDb.status; // as it's mapped to status_bucket

  if (Object.keys(leadUpdatesForDb).length === 0) {
    // Nothing to update on the lead itself after processing client data
    // but we might have updated the client. To be safe, fetch the lead again.
    const { data, error } = await supabase.from('leads').select('*, clients(*), users(*)').eq('id', leadId).single();
    if (error) throw new Error('Lead data fetch failed after client-only update.');
    return data as Lead;
  }

  const { data, error } = await supabase
    .from('leads')
    .update(leadUpdatesForDb)
    .eq('id', leadId)
    .select('*, clients(*), users(*)') // Fetch comprehensive lead data after update
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    throw new Error(error.message || 'Failed to update lead.');
  }
  return data as Lead;
};

export const useUpdateLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(updateLead, {
    onSuccess: (data) => {
      toast.success('Lead updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // Invalidate the list of leads
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['lead', data.id] }); // Invalidate specific lead query if you have one
        queryClient.setQueryData(['lead', data.id], data); // Optimistically update specific lead cache
      }
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (error: Error) => {
      toast.error(`Lead update failed: ${error.message}`);
    },
  });
}; 