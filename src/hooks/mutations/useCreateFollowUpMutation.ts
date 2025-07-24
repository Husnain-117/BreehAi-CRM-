import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { FollowUp } from '../../types'; // Assuming FollowUp type might need creation or adjustment
import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast
import { notificationScheduler } from '../../services/notificationScheduler';

// Type for the data needed to create a new follow-up
// This should align with the form data and exclude DB-generated fields
export interface NewFollowUpData {
  lead_id: string;
  agent_id: string;
  due_date: string; // ISO string format
  status: 'Pending' | 'Completed' | 'Rescheduled' | 'Cancelled';
  notes?: string;
}

// The actual FollowUp type might include id, created_at, updated_at
// This could be defined in src/types/index.ts
// For now, we'll assume the insert returns something compatible with a basic FollowUp type.

export const useCreateFollowUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    FollowUp,        // Expected return type on success (the created follow-up)
    Error,           // Error type
    NewFollowUpData  // Input type to the mutation function
  >(
    async (followUpData: NewFollowUpData) => {
      // Ensure notes is explicitly null if empty, or undefined if your DB handles it
      const dataToInsert = {
        ...followUpData,
        notes: followUpData.notes || null, 
      };

      const { data, error } = await supabase
        .from('follow_ups') // Target the 'follow_ups' table
        .insert(dataToInsert)
        .select(`
          *,
          leads!inner(name)
        `)
        .single(); // Assuming you want the created record back

      if (error) {
        console.error('Error creating follow-up:', error);
        toast.error(`Error creating follow-up: ${error.message}`);
        throw error; 
      }
      if (!data) {
        throw new Error('No data returned after creating follow-up.');
      }
      return data as FollowUp;
    },
    {
      onSuccess: async (data) => {
        toast.success('Follow-up created successfully!');
        
        // Schedule notifications for the new follow-up
        try {
          const leadName = (data.leads as any)?.name || 'Unknown Lead';
          await notificationScheduler.scheduleFollowUpNotifications(
            data.id,
            data.due_date,
            data.agent_id,
            leadName
          );
          console.log('Follow-up notifications scheduled successfully');
        } catch (error) {
          console.error('Error scheduling follow-up notifications:', error);
        }
        
        // Invalidate queries to refetch follow-ups list
        queryClient.invalidateQueries({ queryKey: ['follow_ups'] }); 
        // Potentially invalidate queries related to the specific lead or agent
        if (data.lead_id) {
          queryClient.invalidateQueries({ queryKey: ['leads', data.lead_id] });
          queryClient.invalidateQueries({ queryKey: ['follow_ups', data.lead_id] }); // If you query follow-ups by lead
        }
        // todo: invalidate agent specific queries if any
      },
      onError: (error: Error | PostgrestError) => {
        console.error('Mutation error creating follow-up:', error.message);
        // Toast error is handled in the mutation function for Supabase errors.
        // Add more specific handling here if needed for other error types.
        if (!('code' in error)) { // General errors not from Supabase
           toast.error(`Failed to create follow-up: ${error.message}`);
        }
      },
    }
  );
}; 