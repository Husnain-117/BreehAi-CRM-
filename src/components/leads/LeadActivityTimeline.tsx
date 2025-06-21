// src/components/leads/LeadActivityTimeline.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { 
  ChatBubbleLeftIcon,
  PhoneIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UserIcon,
  ArrowPathIcon,
  PlusIcon,
  ClockIcon
} from '@heroicons/react/20/solid';
import toast from 'react-hot-toast';
import { Lead } from '../../types';

interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: 'email' | 'call' | 'meeting' | 'note' | 'status_change' | 'document' | 'task' | 'demo';
  subject: string | null;
  description: string | null;
  activity_date: string;
  created_by: string;
  metadata: Record<string, any>;
  is_automated: boolean;
  users?: {
    full_name: string;
  };
}

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  onActivityAdded: () => void;
}

const AddActivityModal: React.FC<AddActivityModalProps> = ({ isOpen, onClose, leadId, onActivityAdded }) => {
  const [activityType, setActivityType] = useState<string>('note');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          activity_type: activityType,
          subject: subject.trim() || null,
          description: description.trim() || null,
          created_by: profile.id,
          activity_date: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Activity added successfully');
      onActivityAdded();
      onClose();
      setSubject('');
      setDescription('');
      setActivityType('note');
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to add activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const activityTypes = [
    { value: 'note', label: '📝 Note' },
    { value: 'call', label: '📞 Call' },
    { value: 'email', label: '📧 Email' },
    { value: 'meeting', label: '🤝 Meeting' },
    { value: 'task', label: '✅ Task' },
    { value: 'demo', label: '🖥️ Demo' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Add Activity</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of the activity"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed notes about the activity"
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface LeadActivityTimelineProps {
  lead: Lead;
}

export const LeadActivityTimeline: React.FC<LeadActivityTimelineProps> = ({ lead }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['lead-activities', lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select(`
          *,
          users (full_name)
        `)
        .eq('lead_id', lead.id)
        .order('activity_date', { ascending: false });

      if (error) throw error;
      return data as LeadActivity[];
    }
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-600" />;
      case 'call': return <PhoneIcon className="h-5 w-5 text-green-600" />;
      case 'meeting': return <CalendarDaysIcon className="h-5 w-5 text-purple-600" />;
      case 'note': return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
      case 'status_change': return <ArrowPathIcon className="h-5 w-5 text-orange-600" />;
      case 'demo': return <UserIcon className="h-5 w-5 text-indigo-600" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 border-blue-200';
      case 'call': return 'bg-green-100 border-green-200';
      case 'meeting': return 'bg-purple-100 border-purple-200';
      case 'note': return 'bg-gray-100 border-gray-200';
      case 'status_change': return 'bg-orange-100 border-orange-200';
      case 'demo': return 'bg-indigo-100 border-indigo-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const handleActivityAdded = () => {
    refetch();
    queryClient.invalidateQueries(['lead-activities', lead.id]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        Error loading activities: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
        <Button 
          onClick={() => setShowAddModal(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No activities recorded yet</p>
          <Button 
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="mt-3"
          >
            Add First Activity
          </Button>
        </div>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(activity.activity_type)}`}>
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {activity.subject || `${activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)} Activity`}
                            </h4>
                            {activity.description && (
                              <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(activity.activity_date).toLocaleDateString()} at{' '}
                              {new Date(activity.activity_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              by {activity.users?.full_name || 'Unknown User'}
                            </p>
                            {activity.is_automated && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                Automated
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AddActivityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        leadId={lead.id}
        onActivityAdded={handleActivityAdded}
      />
    </div>
  );
};