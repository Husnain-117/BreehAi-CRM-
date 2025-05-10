import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Meeting } from '../../types';
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

// Interface for the data needed to update a meeting
// It includes the meeting ID and makes other fields partial as not all fields might be updated at once.
export interface UpdateMeetingData {
  id: string;
  lead_id?: string | null;
  agent_id?: string;
  title?: string;
  start_time?: string; // ISO string format
  end_time?: string;   // ISO string format
  status?: 'Scheduled' | 'Completed' | 'Pending' | 'Cancelled'; // Include status for updates
  location?: string;
  notes?: string;
}

export const useUpdateMeetingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Meeting, // Expected return type on success
    Error,   // Error type
    UpdateMeetingData // Input type to the mutation function
  >(
    async (meetingData: UpdateMeetingData) => {
      const { id, ...updateData } = meetingData;
      
      // Remove undefined fields from updateData to prevent overwriting with undefined in Supabase
      const filteredUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as Partial<Omit<UpdateMeetingData, 'id'>>);

      if (Object.keys(filteredUpdateData).length === 0) {
        // Avoid making an update call if no fields are actually being changed (excluding id)
        // Or handle as an error/warning, or return the original meeting data if appropriate
        const existingMeeting = queryClient.getQueryData<Meeting[]>(['meetings'])?.find(m => m.id === id) || 
                                queryClient.getQueryData<Meeting>(['meetings', id]);
        if (existingMeeting) return existingMeeting;
        throw new Error('No data provided for update.');
      }

      const { data, error } = await supabase
        .from('meetings')
        .update(filteredUpdateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating meeting:', error);
        toast.error(`Error updating meeting: ${error.message}`);
        throw error;
      }
      if (!data) {
        throw new Error('No data returned after updating meeting.');
      }
      return data as Meeting;
    },
    {
      onSuccess: (data, variables) => {
        toast.success('Meeting updated successfully');
        
        // Invalidate all meetings list and the specific meeting detail query
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.id] });

        // Optionally, invalidate related queries like leads or agent tasks if meeting changes affect them
        if (variables.lead_id) {
          queryClient.invalidateQueries({ queryKey: ['leads', variables.lead_id] });
          queryClient.invalidateQueries({ queryKey: ['meetings', variables.lead_id] }); // if meetings are queried by lead_id
        }
      },
      onError: (error: Error | PostgrestError, variables) => {
        console.error(`Mutation error updating meeting ${variables.id}:`, error.message);
        // Toast error is already handled in the mutation function for supabase errors
        // but we can add more specific error handling here if needed.
        if (!('code' in error)) { // General errors not from Supabase
          toast.error(`Failed to update meeting: ${error.message}`);
        }
      },
    }
  );
}; 