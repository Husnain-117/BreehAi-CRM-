import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import NotificationCenter from './NotificationCenter';
import { useUnreadNotificationCount } from '../../hooks/queries/useNotificationsQuery';
import { requestNotificationPermission, canShowBrowserNotifications } from '../../utils/notificationUtils';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  
  const { data: unreadCount = 0, isLoading } = useUnreadNotificationCount();

  // Check notification permission on mount
  useEffect(() => {
    const checkPermission = () => {
      const canShow = canShowBrowserNotifications();
      setHasPermission(canShow);
      
      // Show permission prompt if we don't have permission and have unread notifications
      if (!canShow && unreadCount > 0 && 'Notification' in window) {
        const lastPromptTime = localStorage.getItem('notificationPromptTime');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        // Only prompt once per hour
        if (!lastPromptTime || (now - parseInt(lastPromptTime)) > oneHour) {
          setShowPermissionPrompt(true);
        }
      }
    };

    checkPermission();
  }, [unreadCount]);

  const handleRequestPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      setHasPermission(granted);
      setShowPermissionPrompt(false);
      
      // Remember that we prompted
      localStorage.setItem('notificationPromptTime', Date.now().toString());
      
      if (!granted) {
        // Show a helpful message about enabling notifications
        console.log('Notification permission denied. Users can enable it in browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleDismissPrompt = () => {
    setShowPermissionPrompt(false);
    localStorage.setItem('notificationPromptTime', Date.now().toString());
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md transition-colors"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          {unreadCount > 0 ? (
            <BellSolidIcon className="h-6 w-6 text-indigo-600" />
          ) : (
            <BellIcon className="h-6 w-6" />
          )}
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[18px] h-[18px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* Pulse animation for new notifications */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex rounded-full h-3 w-3 translate-x-1/2 -translate-y-1/2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            </span>
          )}
        </button>

        {/* Browser permission prompt */}
        {showPermissionPrompt && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40">
            <div className="flex">
              <div className="flex-shrink-0">
                <BellIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  Enable Desktop Notifications
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get instant alerts for follow-ups, meetings, and important updates even when the tab isn't active.
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handleRequestPermission}
                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Enable
                  </button>
                  <button
                    onClick={handleDismissPrompt}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismissPrompt}
                className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};

export default NotificationBell; 