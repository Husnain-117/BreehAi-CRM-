import { toast } from 'react-hot-toast';
import { playNotificationSound } from './soundUtils';
import type { Notification, DeliveryMethod, SoundType } from '../types';

// Define the NotificationAction interface to match browser API
interface NotificationActionType {
  action: string;
  title: string;
  icon?: string;
}

// Browser notification permissions and setup
export class BrowserNotificationService {
  private static instance: BrowserNotificationService;
  private permission: NotificationPermission = 'default';
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {
    this.initializePermission();
  }

  public static getInstance(): BrowserNotificationService {
    if (!BrowserNotificationService.instance) {
      BrowserNotificationService.instance = new BrowserNotificationService();
    }
    return BrowserNotificationService.instance;
  }

  private async initializePermission(): Promise<void> {
    if ('Notification' in window) {
      this.permission = window.Notification.permission;
      
      // Register service worker for enhanced notifications
      if ('serviceWorker' in navigator) {
        try {
          this.registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully');
        } catch (error) {
          console.warn('Service Worker registration failed:', error);
        }
      }
    }
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window && window.Notification.permission === 'default') {
      this.permission = await window.Notification.requestPermission();
    }
    return this.permission;
  }

  public canShowNotifications(): boolean {
    return 'Notification' in window && this.permission === 'granted';
  }

  public async showNotification(
    title: string,
    options: {
      body: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      actions?: NotificationActionType[];
      requireInteraction?: boolean;
      silent?: boolean;
    }
  ): Promise<void> {
    if (!this.canShowNotifications()) {
      console.warn('Browser notifications not available or not permitted');
      return;
    }

    const notificationOptions: NotificationOptions & { actions?: NotificationActionType[] } = {
      body: options.body,
      icon: options.icon || '/trlogo.png',
      badge: options.badge || '/trlogo.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      actions: options.actions || [],
      timestamp: Date.now(),
    };

    if (this.registration) {
      // Use service worker for better notification handling
      await this.registration.showNotification(title, notificationOptions);
    } else {
      // Fallback to basic notification
      new window.Notification(title, notificationOptions);
    }
  }

  public getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

// Enhanced notification dispatcher
export class NotificationDispatcher {
  private static instance: NotificationDispatcher;
  private browserService: BrowserNotificationService;

  private constructor() {
    this.browserService = BrowserNotificationService.getInstance();
  }

  public static getInstance(): NotificationDispatcher {
    if (!NotificationDispatcher.instance) {
      NotificationDispatcher.instance = new NotificationDispatcher();
    }
    return NotificationDispatcher.instance;
  }

  public async dispatchNotification(notification: Notification): Promise<void> {
    const { delivery_method, title, message, metadata } = notification;

    // Dispatch to each requested delivery method
    for (const method of delivery_method) {
      try {
        await this.dispatchToMethod(method, notification);
      } catch (error) {
        console.error(`Failed to dispatch notification via ${method}:`, error);
      }
    }
  }

  private async dispatchToMethod(method: DeliveryMethod, notification: Notification): Promise<void> {
    const { title, message, metadata, type, entity_type, entity_id } = notification;
    
    switch (method) {
      case 'in_app':
        this.showInAppNotification(notification);
        break;
        
      case 'sound':
        if (metadata.sound_type) {
          playNotificationSound(metadata.sound_type as SoundType);
        }
        break;
        
      case 'browser_push':
        await this.showBrowserNotification(notification);
        break;
        
      case 'email':
        // This would typically trigger an API call to send email
        console.log('Email notification would be sent:', { title, message, metadata });
        break;
    }
  }

  private showInAppNotification(notification: Notification): void {
    const { title, message, type, metadata } = notification;
    
    // Choose toast type based on notification type
    const toastType = this.getToastType(type);
    const icon = this.getNotificationIcon(type);
    
    toast(message, {
      icon,
      duration: this.getToastDuration(type),
      position: 'top-right',
      style: {
        background: this.getToastBackgroundColor(type),
        color: '#fff',
        fontSize: '14px',
      },
    });
  }

  private async showBrowserNotification(notification: Notification): Promise<void> {
    const { title, message, type, entity_type, entity_id, metadata } = notification;
    
    const actions: NotificationActionType[] = [];
    
    // Add contextual actions based on notification type
    if (type === 'follow_up_reminder' || type === 'overdue_follow_up') {
      actions.push(
        { action: 'view_followup', title: 'View Follow-up', icon: '/icons/eye.png' },
        { action: 'complete_followup', title: 'Mark Complete', icon: '/icons/check.png' }
      );
    } else if (type === 'meeting_reminder') {
      actions.push(
        { action: 'view_meeting', title: 'View Meeting', icon: '/icons/calendar.png' },
        { action: 'join_meeting', title: 'Join Now', icon: '/icons/video.png' }
      );
    }

    await this.browserService.showNotification(title, {
      body: message,
      tag: `${type}_${entity_id}`,
      data: {
        notificationId: notification.id,
        type,
        entity_type,
        entity_id,
        metadata,
      },
      actions,
      requireInteraction: type === 'overdue_follow_up' || type === 'meeting_reminder',
    });
  }

  private getToastType(type: string): string {
    switch (type) {
      case 'overdue_follow_up':
        return 'error';
      case 'follow_up_reminder':
      case 'meeting_reminder':
      case 'upcoming_meeting':
        return 'custom';
      case 'lead_update':
        return 'success';
      case 'system_alert':
        return 'loading';
      default:
        return 'custom';
    }
  }

  private getNotificationIcon(type: string): string {
    switch (type) {
      case 'follow_up_reminder':
      case 'overdue_follow_up':
        return '📞';
      case 'meeting_reminder':
      case 'upcoming_meeting':
        return '📅';
      case 'lead_update':
        return '👤';
      case 'system_alert':
        return '⚠️';
      default:
        return '🔔';
    }
  }

  private getToastDuration(type: string): number {
    switch (type) {
      case 'overdue_follow_up':
        return 8000; // 8 seconds for urgent items
      case 'meeting_reminder':
        return 6000; // 6 seconds for meetings
      case 'follow_up_reminder':
      case 'upcoming_meeting':
        return 5000; // 5 seconds for reminders
      case 'lead_update':
        return 4000; // 4 seconds for updates
      case 'system_alert':
        return 7000; // 7 seconds for system alerts
      default:
        return 5000;
    }
  }

  private getToastBackgroundColor(type: string): string {
    switch (type) {
      case 'overdue_follow_up':
        return '#dc2626'; // Red for overdue
      case 'follow_up_reminder':
        return '#2563eb'; // Blue for reminders
      case 'meeting_reminder':
      case 'upcoming_meeting':
        return '#7c3aed'; // Purple for meetings
      case 'lead_update':
        return '#059669'; // Green for updates
      case 'system_alert':
        return '#d97706'; // Orange for alerts
      default:
        return '#374151'; // Default gray
    }
  }
}

// Utility functions for notification management
export const requestNotificationPermission = async (): Promise<boolean> => {
  const service = BrowserNotificationService.getInstance();
  const permission = await service.requestPermission();
  return permission === 'granted';
};

export const canShowBrowserNotifications = (): boolean => {
  const service = BrowserNotificationService.getInstance();
  return service.canShowNotifications();
};

export const dispatchNotification = async (notification: Notification): Promise<void> => {
  const dispatcher = NotificationDispatcher.getInstance();
  await dispatcher.dispatchNotification(notification);
};

// Quick notification creators for common scenarios
export const createFollowUpReminder = (
  userId: string,
  followUpId: string,
  clientName: string,
  dueDate: string,
  timeUntilDue: string
): Partial<Notification> => ({
  user_id: userId,
  type: 'follow_up_reminder',
  title: 'Follow-up Reminder',
  message: `Follow-up with ${clientName} is due ${timeUntilDue}`,
  entity_type: 'follow_up',
  entity_id: followUpId,
  delivery_method: ['in_app', 'sound', 'browser_push'],
  metadata: {
    sound_type: 'info',
    client_name: clientName,
    due_date: dueDate,
  },
});

export const createMeetingReminder = (
  userId: string,
  meetingId: string,
  meetingTitle: string,
  clientName: string,
  startTime: string,
  timeUntilStart: string
): Partial<Notification> => ({
  user_id: userId,
  type: 'meeting_reminder',
  title: 'Meeting Reminder',
  message: `Meeting "${meetingTitle}"${clientName ? ` with ${clientName}` : ''} starts ${timeUntilStart}`,
  entity_type: 'meeting',
  entity_id: meetingId,
  delivery_method: ['in_app', 'sound', 'browser_push'],
  metadata: {
    sound_type: 'info',
    title: meetingTitle,
    client_name: clientName,
    start_time: startTime,
  },
});

export const createOverdueNotification = (
  userId: string,
  followUpId: string,
  clientName: string,
  daysOverdue: number
): Partial<Notification> => ({
  user_id: userId,
  type: 'overdue_follow_up',
  title: 'Overdue Follow-up',
  message: `Follow-up with ${clientName} is overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`,
  entity_type: 'follow_up',
  entity_id: followUpId,
  delivery_method: ['in_app', 'sound', 'browser_push'],
  metadata: {
    sound_type: 'error',
    client_name: clientName,
    days_overdue: daysOverdue,
  },
});

// Initialize notification system
export const initializeNotificationSystem = async (): Promise<void> => {
  console.log('Initializing notification system...');
  
  // Request browser notification permission
  const hasPermission = await requestNotificationPermission();
  console.log('Browser notification permission:', hasPermission ? 'granted' : 'denied');
  
  // Set up service worker message handling
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        handleNotificationClick(event.data);
      }
    });
  }
  
  console.log('Notification system initialized');
};

// Handle notification click events
const handleNotificationClick = (data: any): void => {
  const { notificationId, entity_type, entity_id, action } = data;
  
  // Handle different notification actions
  switch (action) {
    case 'view_followup':
      window.location.href = `/follow-ups?highlightId=${entity_id}`;
      break;
    case 'view_meeting':
      window.location.href = `/meetings?highlightId=${entity_id}`;
      break;
    case 'complete_followup':
      // This would trigger a completion action - could emit an event or call an API
      console.log('Complete follow-up action triggered for:', entity_id);
      break;
    case 'join_meeting':
      // This would open the meeting link if available
      console.log('Join meeting action triggered for:', entity_id);
      break;
    default:
      // Default action - navigate to relevant page
      if (entity_type === 'follow_up') {
        window.location.href = `/follow-ups?highlightId=${entity_id}`;
      } else if (entity_type === 'meeting') {
        window.location.href = `/meetings?highlightId=${entity_id}`;
      } else {
        window.location.href = '/dashboard';
      }
  }
}; 