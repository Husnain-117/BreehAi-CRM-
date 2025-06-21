// src/utils/channelManager.ts
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../api/supabaseClient';

const activeChannels = new Map<string, RealtimeChannel>();

export const getOrCreateChannel = (name: string, options?: any): RealtimeChannel => {
  // If a channel with this name already exists, return it
  if (activeChannels.has(name)) {
    return activeChannels.get(name)!;
  }

  // Otherwise, create a new channel
  const channel = supabase.channel(name, options);
  activeChannels.set(name, channel);
  return channel;
};

export const removeChannel = (name: string): void => {
  const channel = activeChannels.get(name);
  if (channel) {
    supabase.removeChannel(channel);
    activeChannels.delete(name);
  }
};