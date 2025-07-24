import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  useNotificationsQuery, 
  useUnreadNotificationCount, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead,
  useDeleteOldNotifications 
} from '../../hooks/queries/useNotificationsQuery';
import { Notification, NotificationType } from '../../types';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  BellIcon, 
  XMarkIcon, 
  CheckIcon, 
  EyeIcon,
  CalendarIcon,
  PhoneIcon,
  UserIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const pageSize = 20;
  
  // Queries
  const { 
    data: notificationsData, 
    isLoading, 
    error 
  } = useNotificationsQuery({
    unreadOnly: filter === 'unread',
    type: filter !== 'all' && filter !== 'unread' ? filter : undefined,
    limit: pageSize,
    offset: page * pageSize,
    enableRealtime: true,
  });
  
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  
  // Mutations
  const markAsReadMutation = useMarkNotificationRead();
  const markAllAsReadMutation = useMarkAllNotificationsRead();
  const deleteOldMutation = useDeleteOldNotifications();

  const notifications = notificationsData?.notifications || [];
  const totalCount = notificationsData?.count || 0;
  const hasMore = (page + 1) * pageSize < totalCount;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteOld = async () => {
    if (window.confirm('Delete all read notifications older than 30 days?')) {
      try {
        await deleteOldMutation.mutateAsync(30);
      } catch (error) {
        console.error('Failed to delete old notifications:', error);
      }
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'follow_up_reminder':
      case 'overdue_follow_up':
        return <PhoneIcon className="h-5 w-5" />;
      case 'meeting_reminder':
      case 'upcoming_meeting':
        return <CalendarIcon className="h-5 w-5" />;
      case 'lead_update':
        return <UserIcon className="h-5 w-5" />;
      case 'system_alert':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <BellIcon className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'overdue_follow_up':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'follow_up_reminder':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'meeting_reminder':
      case 'upcoming_meeting':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'lead_update':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'system_alert':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEntityLink = (notification: Notification) => {
    switch (notification.entity_type) {
      case 'follow_up':
        return `/follow-ups?highlightId=${notification.entity_id}`;
      case 'meeting':
        return `/meetings?highlightId=${notification.entity_id}`;
      case 'lead':
        return `/leads?highlightId=${notification.entity_id}`;
      default:
        return '/dashboard';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose} />
      
      {/* Panel */}
      <div 
        ref={containerRef}
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${className}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <BellIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as any);
                  setPage(0);
                }}
                className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="follow_up_reminder">Follow-up Reminders</option>
                <option value="meeting_reminder">Meeting Reminders</option>
                <option value="overdue_follow_up">Overdue</option>
                <option value="lead_update">Lead Updates</option>
                <option value="system_alert">System Alerts</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isLoading}
                  className="text-xs px-2 py-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={handleDeleteOld}
                disabled={deleteOldMutation.isLoading}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Delete old notifications"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600">
                <p>Failed to load notifications</p>
                <p className="text-sm text-gray-500 mt-1">{error.message}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No notifications found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {filter === 'unread' ? 'All caught up!' : 'Notifications will appear here'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative group ${
                      !notification.is_read ? 'bg-blue-50' : 'bg-white'
                    } hover:bg-gray-50 transition-colors`}
                  >
                    <Link
                      to={getEntityLink(notification)}
                      onClick={() => {
                        if (!notification.is_read) {
                          handleMarkAsRead(notification.id, {
                            preventDefault: () => {},
                            stopPropagation: () => {}
                          } as React.MouseEvent);
                        }
                        onClose();
                      }}
                      className="block p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 p-2 rounded-full border ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                            } truncate`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatDistanceToNow(new Date(notification.notification_date), { addSuffix: true })}
                            </p>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          {notification.metadata.client_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              Client: {notification.metadata.client_name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {!notification.is_read && (
                        <div className="absolute top-4 right-4">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </Link>
                    
                    {/* Quick Actions */}
                    <div className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          disabled={markAsReadMutation.isLoading}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Mark as read"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => setPage(page + 1)}
                disabled={isLoading}
                className="w-full text-sm text-indigo-600 hover:text-indigo-800 py-2 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load more notifications'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter; 