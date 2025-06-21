// src/components/leads/LeadNurturing.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Lead } from '../../types';
import { 
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/20/solid';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

interface NurtureSequence {
  id: string;
  name: string;
  description: string | null;
  trigger_conditions: Record<string, any>;
  is_active: boolean;
  created_by: string;
  created_at: string;
  nurture_steps?: NurtureStep[];
}

interface NurtureStep {
  id: string;
  sequence_id: string;
  step_order: number;
  name: string;
  delay_days: number;
  action_type: 'email' | 'task' | 'call' | 'sms' | 'notification';
  content: string | null;
  template_data: Record<string, any>;
  is_active: boolean;
}

interface NurtureEnrollment {
  id: string;
  lead_id: string;
  sequence_id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  enrolled_at: string;
  completed_at: string | null;
  next_action_date: string | null;
  nurture_sequences?: NurtureSequence;
  leads?: Lead;
}

interface LeadNurturingProps {
  lead?: Lead;
  showAllEnrollments?: boolean;
}

const CreateSequenceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSequenceCreated: () => void;
}> = ({ isOpen, onClose, onSequenceCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Partial<NurtureStep>[]>([
    { step_order: 1, name: '', delay_days: 0, action_type: 'email', content: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();

  const addStep = () => {
    setSteps([...steps, {
      step_order: steps.length + 1,
      name: '',
      delay_days: 1,
      action_type: 'email',
      content: ''
    }]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setSteps(updatedSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSubmitting(true);
    try {
      // Create sequence
      const { data: sequence, error: sequenceError } = await supabase
        .from('nurture_sequences')
        .insert({
          name,
          description,
          created_by: profile.id,
          trigger_conditions: {}
        })
        .select()
        .single();

      if (sequenceError) throw sequenceError;

      // Create steps
      const stepsToInsert = steps.map(step => ({
        sequence_id: sequence.id,
        step_order: step.step_order,
        name: step.name,
        delay_days: step.delay_days,
        action_type: step.action_type,
        content: step.content,
        template_data: {}
      }));

      const { error: stepsError } = await supabase
        .from('nurture_steps')
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;

      toast.success('Nurture sequence created successfully');
      onSequenceCreated();
      onClose();
      setName('');
      setDescription('');
      setSteps([{ step_order: 1, name: '', delay_days: 0, action_type: 'email', content: '' }]);
    } catch (error) {
      console.error('Error creating sequence:', error);
      toast.error('Failed to create nurture sequence');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create Nurture Sequence</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sequence Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., New Lead Welcome Series"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when and how this sequence should be used"
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">Sequence Steps</label>
              <Button type="button" onClick={addStep} size="sm" variant="outline">
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Step
              </Button>
            </div>
            
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center mb-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white text-xs rounded-full mr-3">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">Step {index + 1}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Step Name</label>
                      <input
                        type="text"
                        value={step.name || ''}
                        onChange={(e) => updateStep(index, 'name', e.target.value)}
                        placeholder="e.g., Welcome Email"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Delay (Days)</label>
                      <input
                        type="number"
                        value={step.delay_days || 0}
                        onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value))}
                        min="0"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Action Type</label>
                      <select
                        value={step.action_type || 'email'}
                        onChange={(e) => updateStep(index, 'action_type', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="email">📧 Email</option>
                        <option value="task">✅ Task</option>
                        <option value="call">📞 Call</option>
                        <option value="sms">💬 SMS</option>
                        <option value="notification">🔔 Notification</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Content/Template</label>
                    <textarea
                      value={step.content || ''}
                      onChange={(e) => updateStep(index, 'content', e.target.value)}
                      placeholder="Enter the content for this step..."
                      rows={3}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Sequence'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const LeadNurturing: React.FC<LeadNurturingProps> = ({ lead, showAllEnrollments = false }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<string>('');
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Fetch nurture sequences
  const { data: sequences = [], isLoading: sequencesLoading } = useQuery({
    queryKey: ['nurture-sequences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nurture_sequences')
        .select(`
          *,
          nurture_steps (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as NurtureSequence[];
    }
  });

  // Fetch enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading, refetch } = useQuery({
    queryKey: ['nurture-enrollments', lead?.id || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('lead_nurture_enrollments')
        .select(`
          *,
          nurture_sequences (*),
          leads (*, clients(*))
        `)
        .order('enrolled_at', { ascending: false });

      if (lead && !showAllEnrollments) {
        query = query.eq('lead_id', lead.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NurtureEnrollment[];
    }
  });

  // Enroll lead in sequence
  const enrollMutation = useMutation({
    mutationFn: async ({ leadId, sequenceId }: { leadId: string; sequenceId: string }) => {
      const { error } = await supabase
        .from('lead_nurture_enrollments')
        .insert({
          lead_id: leadId,
          sequence_id: sequenceId,
          current_step: 1,
          status: 'active',
          created_by: profile?.id,
          next_action_date: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lead enrolled in nurture sequence');
      refetch();
      setSelectedSequence('');
    },
    onError: (error) => {
      console.error('Error enrolling lead:', error);
      toast.error('Failed to enroll lead');
    }
  });

  // Update enrollment status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ enrollmentId, status }: { enrollmentId: string; status: string }) => {
      const updates: any = { status };
      if (status === 'completed' || status === 'cancelled') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('lead_nurture_enrollments')
        .update(updates)
        .eq('id', enrollmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Enrollment status updated');
      refetch();
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'email': return <EnvelopeIcon className="h-4 w-4" />;
      case 'call': return <PhoneIcon className="h-4 w-4" />;
      case 'task': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (sequencesLoading || enrollmentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Lead Nurturing</h3>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCreateModal(true)} size="sm" variant="outline">
            <PlusIcon className="h-4 w-4 mr-1" />
            Create Sequence
          </Button>
        </div>
      </div>

      {/* Enroll in Sequence (only show for single lead) */}
      {lead && !showAllEnrollments && (
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-3">Enroll in Sequence</h4>
          <div className="flex space-x-3">
            <select
              value={selectedSequence}
              onChange={(e) => setSelectedSequence(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a nurture sequence...</option>
              {sequences.map(seq => (
                <option key={seq.id} value={seq.id}>{seq.name}</option>
              ))}
            </select>
            <Button
              onClick={() => {
                if (selectedSequence && lead) {
                  enrollMutation.mutate({ leadId: lead.id, sequenceId: selectedSequence });
                }
              }}
              disabled={!selectedSequence || enrollMutation.isLoading}
              size="sm"
            >
              {enrollMutation.isLoading ? 'Enrolling...' : 'Enroll'}
            </Button>
          </div>
        </div>
      )}

      {/* Active Enrollments */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">
          {showAllEnrollments ? 'All Enrollments' : 'Current Enrollments'}
        </h4>
        
        {enrollments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No active nurture sequences</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map(enrollment => (
              <div key={enrollment.id} className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {enrollment.nurture_sequences?.name}
                    </h5>
                    {showAllEnrollments && (
                      <p className="text-sm text-gray-600">
                        Lead: {enrollment.leads?.clients?.client_name || 'Unknown'}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                      {enrollment.status}
                    </span>
                    
                    <div className="flex space-x-1">
                      {enrollment.status === 'active' && (
                        <Button
                          onClick={() => updateStatusMutation.mutate({ enrollmentId: enrollment.id, status: 'paused' })}
                          size="sm"
                          variant="outline"
                          className="p-1"
                        >
                          <PauseIcon className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {enrollment.status === 'paused' && (
                        <Button
                          onClick={() => updateStatusMutation.mutate({ enrollmentId: enrollment.id, status: 'active' })}
                          size="sm"
                          variant="outline"
                          className="p-1"
                        >
                          <PlayIcon className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {(enrollment.status === 'active' || enrollment.status === 'paused') && (
                        <Button
                          onClick={() => updateStatusMutation.mutate({ enrollmentId: enrollment.id, status: 'cancelled' })}
                          size="sm"
                          variant="outline"
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <StopIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress: Step {enrollment.current_step} of {enrollment.nurture_sequences?.nurture_steps?.length || 0}</span>
                    {enrollment.next_action_date && (
                      <span>Next: {new Date(enrollment.next_action_date).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((enrollment.current_step - 1) / Math.max(1, (enrollment.nurture_sequences?.nurture_steps?.length || 1) - 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Sequence Steps Preview */}
                {enrollment.nurture_sequences?.nurture_steps && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex space-x-4 overflow-x-auto pb-2">
                      {enrollment.nurture_sequences.nurture_steps
                        .sort((a, b) => a.step_order - b.step_order)
                        .map((step, index) => (
                          <div 
                            key={step.id} 
                            className={`flex-shrink-0 flex items-center space-x-2 p-2 rounded-lg border ${
                              index + 1 < enrollment.current_step 
                                ? 'bg-green-50 border-green-200' 
                                : index + 1 === enrollment.current_step
                                ? 'bg-indigo-50 border-indigo-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className={`p-1 rounded ${
                              index + 1 < enrollment.current_step 
                                ? 'bg-green-100 text-green-600'
                                : index + 1 === enrollment.current_step
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {getActionIcon(step.action_type)}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{step.name}</p>
                              <p className="text-xs text-gray-500">Day {step.delay_days}</p>
                            </div>
                            {index + 1 < enrollment.current_step && (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Sequences */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-medium text-gray-900 mb-4">Available Sequences</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sequences.map(sequence => (
            <div key={sequence.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-gray-900">{sequence.name}</h5>
                <span className="text-xs text-gray-500">
                  {sequence.nurture_steps?.length || 0} steps
                </span>
              </div>
              
              {sequence.description && (
                <p className="text-sm text-gray-600 mb-3">{sequence.description}</p>
              )}
              
              <div className="flex space-x-2 text-xs">
                {sequence.nurture_steps?.slice(0, 3).map((step, index) => (
                  <span key={step.id} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                    {getActionIcon(step.action_type)}
                    <span>{step.action_type}</span>
                  </span>
                ))}
                {(sequence.nurture_steps?.length || 0) > 3 && (
                  <span className="text-gray-500">+{(sequence.nurture_steps?.length || 0) - 3} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateSequenceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSequenceCreated={() => {
          queryClient.invalidateQueries(['nurture-sequences']);
        }}
      />
    </div>
  );
};