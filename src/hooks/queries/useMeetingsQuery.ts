// src/hooks/queries/useMeetingsQuery.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../../api/supabaseClient';
import type { Meeting } from '../../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseMeetingsQueryArgs {
  leadId?: string;
  agentId?: string;
}

/* ---------- data fetcher (unchanged) ---------- */
async function fetchMeetings(args: UseMeetingsQueryArgs): Promise<Meeting[]> {
  let q = supabase
    .from('meetings')
    .select(
      'id, lead_id, agent_id, title, start_time, end_time, location, notes, created_at, updated_at, status'
    )
    .order('start_time', { ascending: false });

  if (args.leadId) q = q.eq('lead_id', args.leadId);
  if (args.agentId) q = q.eq('agent_id', args.agentId);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/* ---------- react-query hook ---------- */
export function useMeetingsQuery(args: UseMeetingsQueryArgs) {
  const queryClient = useQueryClient();
  const argsRef = useRef(args);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const CHANNEL_TOPIC = 'public:meetings';

  /* keep latest filter args for queryFn */
  useEffect(() => {
    argsRef.current = args;
  }, [args]);

  /* Manages the Supabase realtime subscription */
  useEffect(() => {
    console.log('[useMeetingsQuery] Setting up new channel subscription.');
    
    // Always create a fresh channel to avoid subscription conflicts
    const channel = supabase.channel(CHANNEL_TOPIC + '_' + Math.random().toString(36).substr(2, 9));
    
    // Set up the postgres changes listener
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meetings' },
      (payload) => {
        console.log('[useMeetingsQuery] Postgres change received:', payload);
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
      }
    );

    // Subscribe to the channel
    channel.subscribe(status => {
      console.log(`[useMeetingsQuery] Realtime status for ${channel.topic} → ${status}`);
    });
    
    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log(`[useMeetingsQuery] Cleanup: Removing channel ${channelRef.current?.topic}.`);
      const chanToCleanup = channelRef.current;
      if (chanToCleanup) {
        supabase.removeChannel(chanToCleanup)
          .then(() => console.log(`[useMeetingsQuery] Channel ${chanToCleanup.topic} removed successfully.`))
          .catch(err => console.error(`[useMeetingsQuery] Error removing channel ${chanToCleanup.topic}:`, err));
        channelRef.current = null;
      }
    };
  }, [queryClient, CHANNEL_TOPIC]);

  /* vanilla react-query usage */
  return useQuery<Meeting[], Error>({
    queryKey: ['meetings', args],
    queryFn: () => fetchMeetings(argsRef.current),
    staleTime: 30_000,
    cacheTime: 300_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
  });
}