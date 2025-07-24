import { supabase } from '../api/supabaseClient';
import { addMinutes, addHours, addDays, isBefore, parseISO } from 'date-fns';
import { NotificationType, Notification } from '../types';
import { dispatchNotification } from '../utils/notificationUtils';

export interface ReminderConfig {
  minutes?: number[];
  hours?: number[];
  days?: number[];
}

export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private scheduledNotifications = new Map<string, NodeJS.Timeout>();
  private isRunning = false;

  private constructor() {}

  public static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  // Start the notification scheduler
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleUpcomingNotifications();
    
    // Check for new notifications every 5 minutes
    setInterval(() => {
      this.scheduleUpcomingNotifications();
    }, 5 * 60 * 1000);

    console.log('Notification scheduler started');
  }

  // Stop the notification scheduler
  public stop(): void {
    this.isRunning = false;
    this.scheduledNotifications.forEach(timeout => clearTimeout(timeout));
    this.scheduledNotifications.clear();
    console.log('Notification scheduler stopped');
  }

  // Schedule notifications for follow-ups
  public async scheduleFollowUpNotifications(followUpId: string, dueDate: string, userId: string, leadName: string): Promise<void> {
    const reminderConfig: ReminderConfig = {
      minutes: [15, 30],
      hours: [1, 2, 24],
      days: [1, 3, 7]
    };

    await this.createScheduledNotifications({
      entityId: followUpId,
      entityType: 'follow_up',
      userId,
      dueDate,
      title: `Follow-up Reminder: ${leadName}`,
      message: `Don't forget to follow up with ${leadName}`,
      reminderConfig,
      notificationType: 'follow_up_reminder'
    });
  }

  // Schedule notifications for meetings
  public async scheduleMeetingNotifications(meetingId: string, startTime: string, userId: string, title: string): Promise<void> {
    const reminderConfig: ReminderConfig = {
      minutes: [15, 30],
      hours: [1, 2],
      days: [1]
    };

    await this.createScheduledNotifications({
      entityId: meetingId,
      entityType: 'meeting',
      userId,
      dueDate: startTime,
      title: `Meeting Reminder: ${title}`,
      message: `You have a meeting coming up: ${title}`,
      reminderConfig,
      notificationType: 'meeting_reminder'
    });
  }

  // Create overdue notifications
  public async createOverdueNotifications(): Promise<void> {
    try {
      // Check for overdue follow-ups
      const { data: overdueFollowUps } = await supabase
        .from('follow_ups')
        .select(`
          id,
          due_date,
          notes,
          user_id,
          leads!inner(name)
        `)
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString());

      for (const followUp of overdueFollowUps || []) {
        const leadName = (followUp.leads as any)?.name || 'Unknown Lead';
        await this.createNotification({
          userId: followUp.user_id,
          type: 'overdue_follow_up',
          title: 'Overdue Follow-up',
          message: `Follow-up with ${leadName} was due ${this.getRelativeTime(followUp.due_date)}`,
          entityType: 'follow_up',
          entityId: followUp.id,
          deliveryMethod: ['in_app', 'browser_push', 'sound'],
          metadata: {
            due_date: followUp.due_date,
            sound_type: 'error'
          }
        });
      }

      // Check for meetings that started without being marked as completed
      const now = new Date();
      const oneHourAgo = addMinutes(now, -60);
      
      const { data: missedMeetings } = await supabase
        .from('meetings')
        .select(`
          id,
          start_time,
          title,
          user_id
        `)
        .eq('status', 'scheduled')
        .gte('start_time', oneHourAgo.toISOString())
        .lt('start_time', now.toISOString());

      for (const meeting of missedMeetings || []) {
        await this.createNotification({
          userId: meeting.user_id,
          type: 'system_alert',
          title: 'Meeting Status Update',
          message: `Meeting "${meeting.title}" has started. Don't forget to update its status.`,
          entityType: 'meeting',
          entityId: meeting.id,
          deliveryMethod: ['in_app', 'browser_push'],
          metadata: {
            start_time: meeting.start_time
          }
        });
      }
    } catch (error) {
      console.error('Error creating overdue notifications:', error);
    }
  }

  // Private method to create scheduled notifications
  private async createScheduledNotifications(config: {
    entityId: string;
    entityType: 'follow_up' | 'meeting';
    userId: string;
    dueDate: string;
    title: string;
    message: string;
    reminderConfig: ReminderConfig;
    notificationType: NotificationType;
  }): Promise<void> {
    const dueDateTime = parseISO(config.dueDate);
    const now = new Date();

    // Create notifications for each reminder time
    const reminderTimes: Date[] = [];

    // Add minute-based reminders
    if (config.reminderConfig.minutes) {
      config.reminderConfig.minutes.forEach(minutes => {
        const reminderTime = addMinutes(dueDateTime, -minutes);
        if (isBefore(now, reminderTime)) {
          reminderTimes.push(reminderTime);
        }
      });
    }

    // Add hour-based reminders
    if (config.reminderConfig.hours) {
      config.reminderConfig.hours.forEach(hours => {
        const reminderTime = addHours(dueDateTime, -hours);
        if (isBefore(now, reminderTime)) {
          reminderTimes.push(reminderTime);
        }
      });
    }

    // Add day-based reminders
    if (config.reminderConfig.days) {
      config.reminderConfig.days.forEach(days => {
        const reminderTime = addDays(dueDateTime, -days);
        if (isBefore(now, reminderTime)) {
          reminderTimes.push(reminderTime);
        }
      });
    }

    // Create notifications in database
    for (const reminderTime of reminderTimes) {
      await this.createNotification({
        userId: config.userId,
        type: config.notificationType,
        title: config.title,
        message: `${config.message} - ${this.getRelativeTime(config.dueDate)}`,
        entityType: config.entityType,
        entityId: config.entityId,
        scheduledFor: reminderTime.toISOString(),
        deliveryMethod: ['in_app', 'browser_push', 'sound'],
        metadata: {
          due_date: config.dueDate,
          sound_type: 'info'
        }
      });
    }
  }

  // Schedule upcoming notifications based on database records
  private async scheduleUpcomingNotifications(): Promise<void> {
    try {
      // Get notifications scheduled for the next hour that haven't been delivered
      const oneHourFromNow = addHours(new Date(), 1);
      
      const { data: upcomingNotifications } = await supabase
        .from('notifications')
        .select('*')
        .not('scheduled_for', 'is', null)
        .lte('scheduled_for', oneHourFromNow.toISOString())
        .gte('scheduled_for', new Date().toISOString())
        .eq('is_read', false);

      for (const notification of upcomingNotifications || []) {
        const notificationId = `${notification.id}`;
        
        // Skip if already scheduled
        if (this.scheduledNotifications.has(notificationId)) {
          continue;
        }

        const scheduledTime = parseISO(notification.scheduled_for!);
        const timeUntilNotification = scheduledTime.getTime() - Date.now();

        if (timeUntilNotification > 0) {
          const timeout = setTimeout(async () => {
            // Dispatch the notification
            await dispatchNotification(notification);
            
            // Remove from scheduled notifications
            this.scheduledNotifications.delete(notificationId);
            
            console.log(`Dispatched scheduled notification: ${notification.title}`);
          }, timeUntilNotification);

          this.scheduledNotifications.set(notificationId, timeout);
        }
      }
    } catch (error) {
      console.error('Error scheduling upcoming notifications:', error);
    }
  }

  // Create a notification record in the database
  private async createNotification(config: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: 'follow_up' | 'meeting' | 'lead' | 'system';
    entityId?: string;
    scheduledFor?: string;
    deliveryMethod?: string[];
    metadata?: any;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: config.userId,
          type: config.type,
          title: config.title,
          message: config.message,
          entity_type: config.entityType,
          entity_id: config.entityId,
          scheduled_for: config.scheduledFor,
          delivery_method: config.deliveryMethod || ['in_app'],
          metadata: config.metadata || {}
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Helper method to get relative time description
  private getRelativeTime(dateString: string): string {
    const date = parseISO(dateString);
    const now = new Date();
    
    if (isBefore(date, now)) {
      return `${Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))} days ago`;
    } else {
      return `in ${Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days`;
    }
  }

  // Cancel notifications for a specific entity
  public async cancelNotifications(entityType: string, entityId: string): Promise<void> {
    try {
      // Remove from database
      await supabase
        .from('notifications')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('is_read', false);

      // Cancel scheduled timeouts
      for (const [key, timeout] of this.scheduledNotifications.entries()) {
        if (key.includes(entityId)) {
          clearTimeout(timeout);
          this.scheduledNotifications.delete(key);
        }
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance(); 