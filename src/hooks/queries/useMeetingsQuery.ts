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
    
    // Create a unique channel name for each subscription
    const channelName = `meetings_${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true },
      },
    });
    
    // Set up the postgres changes listener
    channel
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'meetings',
          filter: args.leadId ? `lead_id=eq.${args.leadId}` : undefined
        },
        (payload) => {
          console.log('[useMeetingsQuery] Postgres change received:', payload);
          queryClient.invalidateQueries({ 
            queryKey: ['meetings', args],
            refetchType: 'active',
          });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[useMeetingsQuery] Subscription error:', err);
          return;
        }
        console.log(`[useMeetingsQuery] Realtime status for ${channelName} → ${status}`);
      });
    
    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log(`[useMeetingsQuery] Cleanup: Removing channel ${channelName}.`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
          .then(() => console.log(`[useMeetingsQuery] Channel ${channelName} removed successfully.`))
          .catch(err => console.error(`[useMeetingsQuery] Error removing channel ${channelName}:`, err));
        channelRef.current = null;
      }
    };
  }, [queryClient, JSON.stringify(args)]); // Use JSON.stringify for deep comparison of args

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