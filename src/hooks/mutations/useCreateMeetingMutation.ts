import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Meeting } from '../../types'; // Assuming Meeting type exists or will be created
import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError
import { toast } from 'react-hot-toast'; // Import toast for notifications

// Interface for the data needed to create a new meeting
export interface NewMeetingData {
  lead_id: string | null; // lead_id is nullable in the schema
  agent_id: string;
  title: string;
  start_time: string; // ISO string format
  end_time: string;   // ISO string format
  location?: string;
  notes?: string;
}

export const useCreateMeetingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Meeting, Error, NewMeetingData>(
    async (meetingData: NewMeetingData) => {
      const { data, error } = await supabase
        .from('meetings')
        .insert([
          {
            lead_id: meetingData.lead_id,
            agent_id: meetingData.agent_id,
            title: meetingData.title,
            start_time: meetingData.start_time,
            end_time: meetingData.end_time,
            location: meetingData.location,
            notes: meetingData.notes,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating meeting:', error);
        throw error; // Throw the error for onError to handle
      }
      if (!data) {
        throw new Error('No data returned after creating meeting despite no explicit error.');
      }
      return data as Meeting;
    },
    {
      onSuccess: (data, variables) => {
        console.log('Meeting created successfully:', data);
        toast.success('Meeting scheduled successfully');
        
        // More aggressive cache invalidation strategy
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        queryClient.invalidateQueries({ queryKey: ['leads'] }); 
        
        // If there's a specific lead, invalidate that too
        if (variables.lead_id) {
          queryClient.invalidateQueries({ queryKey: ['meetings', variables.lead_id] });
          queryClient.invalidateQueries({ queryKey: ['follow_ups', variables.lead_id] }); // For activity log
        }
        
        // Invalidate agent queries if needed
        if (variables.agent_id) {
          queryClient.invalidateQueries({ queryKey: ['user_tasks', variables.agent_id] });
          queryClient.invalidateQueries({ queryKey: ['user_calendar', variables.agent_id] });
        }
      },
      onError: (error: Error | PostgrestError) => {
        console.error('Mutation error creating meeting:', error.message);
        if ('code' in error && error.code === '42501') {
          toast.error('Permission Denied: You do not have the required permissions to create this meeting.');
        } else {
          // The MeetingModal already displays mutationError.message
        }
      },
    }
  );
}; 