import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Meeting } from '../../types'; // Assuming Meeting type exists or will be created
import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError

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
        // Invalidate queries to refetch data
        // 1. Invalidate a general meetings list if you have one
        queryClient.invalidateQueries(['meetings']);
        // 2. If lead_id is present, invalidate follow_ups for that lead (as meetings might be part of an activity log)
        if (variables.lead_id) {
          queryClient.invalidateQueries(['follow_ups', variables.lead_id]); // Or a dedicated activity log query key
          queryClient.invalidateQueries(['meetings', variables.lead_id]); // Specific meetings for a lead
          queryClient.invalidateQueries(['leads']); // Invalidate leads if meeting updates activity log
        }
        // 3. Potentially invalidate queries related to the agent's tasks/calendar
        if (variables.agent_id) {
            queryClient.invalidateQueries(['user_tasks', variables.agent_id]);
            queryClient.invalidateQueries(['user_calendar', variables.agent_id]);
        }
        // Unlike follow-ups, creating a meeting doesn't directly update a field on the lead itself (like follow_up_due_date)
        // So, invalidating ['leads'] might not be strictly necessary unless meeting creation affects lead display indirectly.
      },
      onError: (error: Error | PostgrestError) => {
        console.error('Mutation error creating meeting:', error.message);
        if ('code' in error && error.code === '42501') {
          alert('Permission Denied: You do not have the required permissions to create this meeting.');
          // TODO: Replace alert with a toast notification
        } else {
          // The MeetingModal already displays mutationError.message
        }
      },
    }
  );
}; 