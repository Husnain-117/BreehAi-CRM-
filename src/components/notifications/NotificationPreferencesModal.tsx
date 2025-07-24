import React, { useState, useEffect } from 'react';
import { 
  useNotificationPreferencesQuery, 
  useUpdateNotificationPreferences 
} from '../../hooks/queries/useNotificationsQuery';
import { NotificationPreferences, NotificationType, DeliveryMethod, SoundType } from '../../types';
import { XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { playNotificationSound } from '../../utils/soundUtils';
import { canShowBrowserNotifications, requestNotificationPermission } from '../../utils/notificationUtils';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PreferenceFormData {
  [key: string]: NotificationPreferences;
}

const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: preferences = [], isLoading } = useNotificationPreferencesQuery();
  const updatePreferences = useUpdateNotificationPreferences();
  
  const [formData, setFormData] = useState<PreferenceFormData>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences.length > 0) {
      const initialData: PreferenceFormData = {};
      preferences.forEach(pref => {
        initialData[pref.notification_type] = { ...pref };
      });
      setFormData(initialData);
    }
  }, [preferences]);

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const notificationTypeLabels: Record<NotificationType, string> = {
    'follow_up_reminder': 'Follow-up Reminders',
    'meeting_reminder': 'Meeting Reminders',
    'overdue_follow_up': 'Overdue Follow-ups',
    'upcoming_meeting': 'Upcoming Meetings',
    'lead_update': 'Lead Updates',
    'system_alert': 'System Alerts',
  };

  const deliveryMethodLabels: Record<DeliveryMethod, string> = {
    'in_app': 'In-App Toast',
    'browser_push': 'Browser Notifications',
    'email': 'Email',
    'sound': 'Sound Alert',
  };

  const soundTypeLabels: Record<SoundType, string> = {
    'success': 'Success (Cheerful)',
    'info': 'Info (Gentle)',
    'error': 'Alert (Urgent)',
  };

  const reminderMinuteOptions = [
    { value: 0, label: 'At time of event' },
    { value: 5, label: '5 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 1440, label: '1 day before' },
    { value: 2880, label: '2 days before' },
  ];

  const handlePreferenceChange = (
    notificationType: NotificationType,
    field: keyof NotificationPreferences,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [notificationType]: {
        ...prev[notificationType],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleDeliveryMethodToggle = (
    notificationType: NotificationType,
    method: DeliveryMethod
  ) => {
    const currentMethods = formData[notificationType]?.delivery_methods || [];
    const updatedMethods = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method];

    handlePreferenceChange(notificationType, 'delivery_methods', updatedMethods);
  };

  const handleReminderMinutesChange = (
    notificationType: NotificationType,
    minutes: number[],
  ) => {
    handlePreferenceChange(notificationType, 'reminder_minutes', minutes);
  };

  const handleSoundTest = (soundType: SoundType) => {
    playNotificationSound(soundType);
  };

  const handleRequestBrowserPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      setBrowserPermission(granted ? 'granted' : 'denied');
    } catch (error) {
      console.error('Error requesting browser permission:', error);
    }
  };

  const handleSave = async () => {
    try {
      const updates = Object.values(formData).map(pref => 
        updatePreferences.mutateAsync(pref)
      );
      
      await Promise.all(updates);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleReset = () => {
    if (preferences.length > 0) {
      const resetData: PreferenceFormData = {};
      preferences.forEach(pref => {
        resetData[pref.notification_type] = { ...pref };
      });
      setFormData(resetData);
      setHasChanges(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Notification Preferences
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Browser Permission Status */}
                {browserPermission !== 'granted' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <div className="text-yellow-600">⚠️</div>
                      <div className="flex-1">
                        <p className="text-sm text-yellow-800">
                          Browser notifications are {browserPermission === 'denied' ? 'blocked' : 'not enabled'}.
                          {browserPermission === 'denied' 
                            ? ' Please enable them in your browser settings.'
                            : ''
                          }
                        </p>
                        {browserPermission === 'default' && (
                          <button
                            onClick={handleRequestBrowserPermission}
                            className="mt-2 text-sm bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700"
                          >
                            Enable Browser Notifications
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences for each notification type */}
                {Object.entries(notificationTypeLabels).map(([type, label]) => {
                  const pref = formData[type as NotificationType];
                  if (!pref) return null;

                  return (
                    <div key={type} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">{label}</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.enabled}
                            onChange={(e) => handlePreferenceChange(
                              type as NotificationType, 
                              'enabled', 
                              e.target.checked
                            )}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      {pref.enabled && (
                        <div className="space-y-4">
                          {/* Delivery Methods */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Delivery Methods
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(deliveryMethodLabels).map(([method, methodLabel]) => (
                                <label key={method} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={pref.delivery_methods.includes(method as DeliveryMethod)}
                                    onChange={() => handleDeliveryMethodToggle(
                                      type as NotificationType, 
                                      method as DeliveryMethod
                                    )}
                                    disabled={method === 'browser_push' && browserPermission !== 'granted'}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className={`text-sm ${
                                    method === 'browser_push' && browserPermission !== 'granted'
                                      ? 'text-gray-400'
                                      : 'text-gray-700'
                                  }`}>
                                    {methodLabel}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Reminder Timing */}
                          {(type === 'follow_up_reminder' || type === 'meeting_reminder') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Remind me
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                {reminderMinuteOptions.map(option => (
                                  <label key={option.value} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={pref.reminder_minutes.includes(option.value)}
                                      onChange={(e) => {
                                        const currentMinutes = pref.reminder_minutes;
                                        const updatedMinutes = e.target.checked
                                          ? [...currentMinutes, option.value].sort((a, b) => a - b)
                                          : currentMinutes.filter(m => m !== option.value);
                                        handleReminderMinutesChange(type as NotificationType, updatedMinutes);
                                      }}
                                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sound Settings */}
                          {pref.delivery_methods.includes('sound') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sound Type
                              </label>
                              <div className="flex items-center space-x-4">
                                <select
                                  value={pref.sound_type}
                                  onChange={(e) => handlePreferenceChange(
                                    type as NotificationType,
                                    'sound_type',
                                    e.target.value as SoundType
                                  )}
                                  className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                  {Object.entries(soundTypeLabels).map(([soundType, soundLabel]) => (
                                    <option key={soundType} value={soundType}>
                                      {soundLabel}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleSoundTest(pref.sound_type)}
                                  className="text-sm px-3 py-1 text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50"
                                >
                                  Test Sound
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Reset to defaults
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || updatePreferences.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {updatePreferences.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesModal; 