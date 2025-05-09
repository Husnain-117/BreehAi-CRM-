import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { FollowUp } from '../../types'; // Assuming FollowUp type might need creation or adjustment
import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError

// Interface for the data needed to create a new follow-up
export interface NewFollowUpData {
  lead_id: string;
  agent_id: string; // Should be the ID of the currently authenticated user or assigned agent
  due_date: string; // ISO string format e.g., YYYY-MM-DD
  notes?: string;
  status: 'pending' | 'completed' | 'rescheduled'; // Aligned with FollowUp type comment
}

// The actual FollowUp type might include id, created_at, updated_at
// This could be defined in src/types/index.ts
// For now, we'll assume the insert returns something compatible with a basic FollowUp type.

export const useCreateFollowUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<FollowUp, Error, NewFollowUpData>(
    async (followUpData: NewFollowUpData) => {
      const { data, error } = await supabase
        .from('follow_ups')
        .insert([
          {
            lead_id: followUpData.lead_id,
            agent_id: followUpData.agent_id,
            due_date: followUpData.due_date,
            notes: followUpData.notes,
            status: followUpData.status,
          },
        ])
        .select()
        .single(); // Assuming you want the created record back

      if (error) {
        console.error('Error creating follow-up:', error);
        // Throw the error so it can be caught by onError
        throw error; 
      }
      if (!data) {
        // This case should ideally not happen if insert is successful and select().single() is used.
        // But if it does, it's a different kind of error.
        throw new Error('No data returned after creating follow-up despite no explicit error.');
      }
      return data as FollowUp; // Cast to your FollowUp type
    },
    {
      onSuccess: (data, variables) => {
        console.log('Follow-up created successfully:', data);
        // Invalidate queries to refetch data
        // 1. Invalidate leads query to update potential follow_up_due_date on the lead
        queryClient.invalidateQueries(['leads']); 
        // 2. Invalidate a specific query for this lead's follow-ups if you have one
        //    (e.g., for an activity log in LeadDrawer)
        if (variables.lead_id) {
          queryClient.invalidateQueries(['follow_ups', variables.lead_id]);
          queryClient.invalidateQueries(['follow_ups']); // Invalidate general list too
        }
        // 3. Potentially invalidate queries related to the agent's tasks
        if (variables.agent_id) {
            queryClient.invalidateQueries(['user_tasks', variables.agent_id]);
        }
      },
      onError: (error: Error | PostgrestError) => {
        console.error('Mutation error creating follow-up:', error.message);
        if ('code' in error && error.code === '42501') {
          // This is a PostgrestError with an RLS violation
          alert('Permission Denied: You do not have the required permissions to create this follow-up.');
          // TODO: Replace alert with a toast notification
        } else {
          // Handle other types of errors or show a generic message
          // The FollowUpModal already displays mutationError.message, so an alert might be redundant
          // unless specific handling is needed here.
        }
      },
    }
  );
}; 