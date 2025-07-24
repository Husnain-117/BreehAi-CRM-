import React, { useState } from 'react';
import { 
  useNotificationPreferencesQuery, 
  useUpdateNotificationPreferences 
} from '../hooks/queries/useNotificationsQuery';
import { NotificationPreferences, NotificationType, DeliveryMethod, SoundType } from '../types';
import { toast } from 'react-hot-toast';
import { playNotificationSound } from '../utils/soundUtils';
import { canShowBrowserNotifications, requestNotificationPermission } from '../utils/notificationUtils';
import { 
  BellIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  SpeakerWaveIcon,
  Cog6ToothIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const NotificationSettingsPage: React.FC = () => {
  const { data: preferences, isLoading } = useNotificationPreferencesQuery();
  const updatePreferences = useUpdateNotificationPreferences();
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<Record<string, NotificationPreferences>>({});

  // Initialize local preferences when data loads
  React.useEffect(() => {
    if (preferences && Object.keys(localPreferences).length === 0) {
      setLocalPreferences(preferences);
    }
  }, [preferences, localPreferences]);

  const notificationTypes: { key: NotificationType; label: string; description: string }[] = [
    {
      key: 'follow_up_reminder',
      label: 'Follow-up Reminders',
      description: 'Get notified before follow-ups are due'
    },
    {
      key: 'meeting_reminder',
      label: 'Meeting Reminders', 
      description: 'Get notified before meetings start'
    },
    {
      key: 'overdue_follow_up',
      label: 'Overdue Follow-ups',
      description: 'Get notified about overdue follow-up tasks'
    },
    {
      key: 'upcoming_meeting',
      label: 'Upcoming Meetings',
      description: 'Get notified about meetings starting soon'
    },
    {
      key: 'lead_update',
      label: 'Lead Updates',
      description: 'Get notified when leads are updated'
    },
    {
      key: 'system_alert',
      label: 'System Alerts',
      description: 'Get notified about important system messages'
    }
  ];

  const deliveryMethods: { key: DeliveryMethod; label: string; icon: React.ReactNode; description: string }[] = [
    {
      key: 'in_app',
      label: 'In-App',
      icon: <BellIcon className="h-5 w-5" />,
      description: 'Show notifications within the application'
    },
    {
      key: 'browser_push',
      label: 'Browser Push',
      icon: <DevicePhoneMobileIcon className="h-5 w-5" />,
      description: 'Send browser push notifications'
    },
    {
      key: 'email',
      label: 'Email',
      icon: <EnvelopeIcon className="h-5 w-5" />,
      description: 'Send email notifications'
    },
    {
      key: 'sound',
      label: 'Sound',
      icon: <SpeakerWaveIcon className="h-5 w-5" />,
      description: 'Play notification sounds'
    }
  ];

  const soundTypes: { key: SoundType; label: string }[] = [
    { key: 'success', label: 'Success' },
    { key: 'info', label: 'Info' },
    { key: 'error', label: 'Alert' }
  ];

  const handlePreferenceChange = (
    notificationType: NotificationType,
    field: keyof NotificationPreferences,
    value: any
  ) => {
    setLocalPreferences(prev => ({
      ...prev,
      [notificationType]: {
        ...prev[notificationType],
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const handleDeliveryMethodToggle = (
    notificationType: NotificationType,
    method: DeliveryMethod
  ) => {
    const currentMethods = localPreferences[notificationType]?.delivery_methods || [];
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method];
    
    handlePreferenceChange(notificationType, 'delivery_methods', newMethods);
  };

  const handleSaveChanges = async () => {
    try {
      await updatePreferences.mutateAsync(localPreferences);
      setUnsavedChanges(false);
      toast.success('Notification preferences updated successfully!');
    } catch (error) {
      toast.error('Failed to update notification preferences');
      console.error('Error saving preferences:', error);
    }
  };

  const handleTestSound = (soundType: SoundType) => {
    playNotificationSound(soundType);
  };

  const handleRequestBrowserPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast.success('Browser notifications enabled!');
    } else {
      toast.error('Browser notifications permission denied');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Cog6ToothIcon className="h-8 w-8 mr-3 text-blue-600" />
              Notification Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Configure how and when you receive notifications for different activities.
            </p>
          </div>
          
          {unsavedChanges && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-amber-600">You have unsaved changes</span>
              <button
                onClick={handleSaveChanges}
                disabled={updatePreferences.isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {updatePreferences.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Browser Permission Status */}
      {!canShowBrowserNotifications() && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-amber-800">Browser Notifications Disabled</h3>
              <p className="text-sm text-amber-700">
                Enable browser notifications to receive push notifications even when the app is closed.
              </p>
            </div>
            <button
              onClick={handleRequestBrowserPermission}
              className="bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700"
            >
              Enable
            </button>
          </div>
        </div>
      )}

      {/* Notification Type Settings */}
      <div className="space-y-6">
        {notificationTypes.map(({ key: notificationType, label, description }) => {
          const prefs = localPreferences[notificationType] || {
            enabled: true,
            delivery_methods: ['in_app'],
            sound_type: 'info',
            advance_minutes: [15, 30]
          };

          return (
            <div key={notificationType} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.enabled}
                    onChange={(e) => handlePreferenceChange(notificationType, 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {prefs.enabled && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  {/* Delivery Methods */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Delivery Methods</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {deliveryMethods.map(({ key: method, label: methodLabel, icon, description: methodDesc }) => {
                        const isSelected = prefs.delivery_methods.includes(method);
                        return (
                          <div
                            key={method}
                            onClick={() => handleDeliveryMethodToggle(notificationType, method)}
                            className={`
                              relative p-3 border rounded-lg cursor-pointer transition-colors
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-2">
                              {icon}
                              <span className="text-sm font-medium">{methodLabel}</span>
                              {isSelected && (
                                <CheckIcon className="h-4 w-4 text-blue-600 ml-auto" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{methodDesc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sound Settings */}
                  {prefs.delivery_methods.includes('sound') && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Sound Type</h4>
                      <div className="flex items-center space-x-4">
                        {soundTypes.map(({ key: soundType, label: soundLabel }) => (
                          <label key={soundType} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`sound-${notificationType}`}
                              checked={prefs.sound_type === soundType}
                              onChange={() => handlePreferenceChange(notificationType, 'sound_type', soundType)}
                              className="text-blue-600"
                            />
                            <span className="text-sm">{soundLabel}</span>
                            <button
                              onClick={() => handleTestSound(soundType)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                            >
                              Test
                            </button>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advance Notice */}
                  {(['follow_up_reminder', 'meeting_reminder'] as NotificationType[]).includes(notificationType) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Advance Notice (minutes)</h4>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={prefs.advance_minutes.join(', ')}
                          onChange={(e) => {
                            const minutes = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                            handlePreferenceChange(notificationType, 'advance_minutes', minutes);
                          }}
                          placeholder="15, 30, 60"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <span className="text-xs text-gray-500">Comma-separated values</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      {unsavedChanges && (
        <div className="sticky bottom-6 mt-8 flex justify-end">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">You have unsaved changes</span>
              <button
                onClick={() => {
                  setLocalPreferences(preferences || {});
                  setUnsavedChanges(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={updatePreferences.isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {updatePreferences.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettingsPage; 