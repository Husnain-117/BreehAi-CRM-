import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { FollowUp } from '../../types';
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

// Interface for the data needed to update a follow-up
// Includes the follow-up ID and makes other fields partial.
export interface UpdateFollowUpData {
  id: string;
  lead_id?: string;
  agent_id?: string;
  due_date?: string; // ISO string format
  status?: 'Pending' | 'Completed' | 'Rescheduled' | 'Cancelled';
  notes?: string;
}

export const useUpdateFollowUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    FollowUp,          // Expected return type on success
    Error,             // Error type
    UpdateFollowUpData // Input type to the mutation function
  >(
    async (followUpData: UpdateFollowUpData) => {
      const { id, ...updateData } = followUpData;
      
      // Filter out undefined fields from updateData
      const filteredUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as Partial<Omit<UpdateFollowUpData, 'id'>>);

      if (Object.keys(filteredUpdateData).length === 0) {
        // If no actual data fields are being updated (besides id), 
        // we can choose to either throw an error or return early.
        // For now, let's fetch the existing one to return it as if no-op update occurred.
        const existingFollowUp = queryClient.getQueryData<FollowUp[]>(['follow_ups'])?.find(f => f.id === id) || 
                                 queryClient.getQueryData<FollowUp>(['follow_ups', id]);
        if (existingFollowUp) return existingFollowUp;
        // Or throw: throw new Error('No data provided for update.');
      }

      const { data, error } = await supabase
        .from('follow_ups')
        .update(filteredUpdateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating follow-up:', error);
        toast.error(`Error updating follow-up: ${error.message}`);
        throw error;
      }
      if (!data) {
        throw new Error('No data returned after updating follow-up.');
      }
      return data as FollowUp;
    },
    {
      onSuccess: (data, variables) => {
        toast.success('Follow-up updated successfully!');
        
        queryClient.invalidateQueries({ queryKey: ['follow_ups'] });
        queryClient.invalidateQueries({ queryKey: ['follow_ups', variables.id] });

        if (variables.lead_id) {
          queryClient.invalidateQueries({ queryKey: ['leads', variables.lead_id] });
          queryClient.invalidateQueries({ queryKey: ['follow_ups', variables.lead_id] });
        }
      },
      onError: (error: Error | PostgrestError, variables) => {
        console.error(`Mutation error updating follow-up ${variables.id}:`, error.message);
        if (!('code' in error)) { 
          toast.error(`Failed to update follow-up: ${error.message}`);
        }
      },
    }
  );
}; 