import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Notification, NotificationPreferences, NotificationType } from '../../types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { dispatchNotification } from '../../utils/notificationUtils';

// Fetch notifications for the current user
const fetchNotifications = async (options: {
  unreadOnly?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
} = {}): Promise<{ notifications: Notification[], count: number }> => {
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('notification_date', { ascending: false });

  if (options.unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return {
    notifications: data || [],
    count: count || 0,
  };
};

// Fetch notification preferences
const fetchNotificationPreferences = async (): Promise<NotificationPreferences[]> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .order('notification_type');

  if (error) {
    console.error('Error fetching notification preferences:', error);
    throw new Error(`Failed to fetch notification preferences: ${error.message}`);
  }

  return data || [];
};

// Hook for fetching notifications
export const useNotificationsQuery = (options: {
  unreadOnly?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
  enableRealtime?: boolean;
} = {}) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const queryKey = ['notifications', options];

  // Set up real-time subscription
  useEffect(() => {
    if (!options.enableRealtime) return;

    console.log('[useNotificationsQuery] Setting up realtime subscription');
    
    const channelName = `notifications_${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications'
        },
        async (payload) => {
          console.log('[useNotificationsQuery] Change received:', payload);
          
          // If it's a new notification, dispatch it immediately
          if (payload.eventType === 'INSERT' && payload.new) {
            const notification = payload.new as Notification;
            
            // Check if the notification should be shown now
            const scheduledFor = notification.scheduled_for ? new Date(notification.scheduled_for) : null;
            const now = new Date();
            
            if (!scheduledFor || scheduledFor <= now) {
              await dispatchNotification(notification);
            }
          }
          
          // Invalidate queries to refresh the notification list
          queryClient.invalidateQueries({ 
            queryKey: ['notifications'],
            refetchType: 'active',
          });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[useNotificationsQuery] Subscription error:', err);
          return;
        }
        console.log(`[useNotificationsQuery] Realtime status → ${status}`);
      });

    channelRef.current = channel;

    return () => {
      console.log('[useNotificationsQuery] Cleanup: removing channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient, options.enableRealtime]);

  return useQuery({
    queryKey,
    queryFn: () => fetchNotifications(options),
    staleTime: 30000, // 30 seconds
    refetchInterval: options.enableRealtime ? false : 60000, // Refetch every minute if realtime is disabled
  });
};

// Hook for fetching notification preferences
export const useNotificationPreferencesQuery = () => {
  return useQuery({
    queryKey: ['notification_preferences'],
    queryFn: fetchNotificationPreferences,
    staleTime: 300000, // 5 minutes
  });
};

// Hook for getting unread notification count
export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread_count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      
      return count || 0;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Mark notification as read mutation
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
    },
  });
};

// Mark all notifications as read mutation
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('is_read', false);

      if (error) {
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
    },
  });
};

// Delete old notifications mutation
export const useDeleteOldNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (daysOld: number = 30) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('is_read', true);

      if (error) {
        throw new Error(`Failed to delete old notifications: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Error deleting old notifications:', error);
    },
  });
};

// Update notification preferences mutation
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences> & { id: string }) => {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preferences.id);

      if (error) {
        throw new Error(`Failed to update notification preferences: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_preferences'] });
    },
    onError: (error) => {
      console.error('Error updating notification preferences:', error);
    },
  });
};

// Create a new notification (useful for testing or manual notifications)
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      return data;
    },
    onSuccess: (newNotification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Dispatch the notification immediately if it should be shown now
      const scheduledFor = newNotification.scheduled_for ? new Date(newNotification.scheduled_for) : null;
      const now = new Date();
      
      if (!scheduledFor || scheduledFor <= now) {
        dispatchNotification(newNotification);
      }
    },
    onError: (error) => {
      console.error('Error creating notification:', error);
    },
  });
}; 