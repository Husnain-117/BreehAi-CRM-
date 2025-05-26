import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Meeting } from '../../types';

export const useMeetingByIdQuery = (meetingId: string) => {
  return useQuery<Meeting, Error>({
    queryKey: ['meeting', meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          leads (
            *,
            clients (client_name)
          ),
          users (full_name)
        `)
        .eq('id', meetingId)
        .single(); // Ensure only one row is returned

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Meeting not found');
      }

      return data as Meeting;
    },
    enabled: !!meetingId, // Only run the query if meetingId is provided
  });
};