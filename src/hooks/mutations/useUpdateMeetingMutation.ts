import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Meeting } from '../../types';
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

export interface UpdateMeetingData {
  id: string;
  lead_id?: string | null;
  agent_id?: string;
  title?: string;
  start_time?: string;
  end_time?: string;
  status?: 'Scheduled' | 'Completed' | 'Pending' | 'Cancelled';
  location?: string;
  notes?: string;
  updated_at?: string;
}

export const useUpdateMeetingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Meeting,
    Error,
    UpdateMeetingData
  >(
    async (meetingData: UpdateMeetingData) => {
      const { id, ...updateData } = meetingData;

      console.log('Updating meeting with data:', { id, ...updateData });

      // Step 1: Check if the meeting exists in the database
      const { data: existingMeeting, error: fetchError } = await supabase
        .from('meetings')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError || !existingMeeting) {
        const errorMessage = fetchError?.message || 'Meeting not found in the database.';
        console.error('Error fetching meeting before update:', fetchError, 'ID:', id);
        throw new Error(errorMessage);
      }

      // Step 2: Filter out undefined fields
      const filteredUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as Partial<Omit<UpdateMeetingData, 'id'>>);

      if (Object.keys(filteredUpdateData).length === 0) {
        throw new Error('No data provided for update.');
      }

      // Step 3: Add updated_at timestamp
      filteredUpdateData.updated_at = new Date().toISOString();

      console.log('Filtered update data:', filteredUpdateData);

      // Step 4: Perform the update
      const { data, error } = await supabase
        .from('meetings')
        .update(filteredUpdateData)
        .eq('id', id)
        .select('*, leads (id, client_id, status_bucket, contact_person, clients (client_name)), users:agent_id (id, full_name)')
        .single();

      if (error) {
        console.error('Error updating meeting:', error);
        console.error('Error details:', { code: error.code, hint: error.hint, details: error.details });
        throw error;
      }

      if (!data) {
        const err = new Error('No data returned after updating meeting.');
        console.error(err);
        throw err;
      }

      console.log('Meeting updated successfully:', data);
      return data as Meeting;
    },
    {
      onMutate: async (newMeetingData) => {
        await queryClient.cancelQueries({ queryKey: ['meetings'] });
        const previousMeetings = queryClient.getQueryData<Meeting[]>(['meetings']);
        const previousMeeting = previousMeetings?.find(m => m.id === newMeetingData.id);
        if (previousMeetings && previousMeeting) {
          queryClient.setQueryData<Meeting[]>(['meetings'], (old) =>
            old?.map(m => m.id === newMeetingData.id ? { ...m, ...newMeetingData, updated_at: new Date().toISOString() } : m)
          );
        }
        return { previousMeetings, previousMeeting };
      },
      onError: (err, newMeetingData, context: any) => {
        console.error(`Mutation error updating meeting ${newMeetingData.id}:`, err.message);
        if ('code' in err && err.code === 'PGRST116') {
          toast.error(`Failed to update meeting: Meeting with ID ${newMeetingData.id} not found in the database.`);
        } else {
          toast.error(`Failed to update meeting: ${err.message}`);
        }
        if (context?.previousMeetings) {
          queryClient.setQueryData(['meetings'], context.previousMeetings);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
      },
      onSuccess: (data, variables) => {
        toast.success('Meeting updated successfully');
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.id] });
        if (variables.lead_id) {
          queryClient.invalidateQueries({ queryKey: ['leads', variables.lead_id] });
          queryClient.invalidateQueries({ queryKey: ['meetings', variables.lead_id] });
        }
      },
    }
  );
};