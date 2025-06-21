import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { z } from 'zod';
import { Lead } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Zod schema for call validation
const callSchema = z.object({
  duration: z.number().min(1, { message: 'Duration must be at least 1 minute' }),
  callType: z.string().min(1, { message: 'Call type is required' }),
  notes: z.string().optional(),
  outcome: z.string().min(1, { message: 'Outcome is required' }),
});

type CallFormData = z.infer<typeof callSchema>;
type CallFormErrors = z.ZodFormattedError<CallFormData> | null;

interface CallModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ lead, isOpen, onClose }) => {
  const [duration, setDuration] = useState<number>(0);
  const [callType, setCallType] = useState('outbound');
  const [outcome, setOutcome] = useState('completed');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<CallFormErrors>(null);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const startTimer = () => {
    setTimer(0);
    setTimerStart(new Date());
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setDuration(Math.ceil(timer / 60)); // Convert seconds to minutes, rounded up
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimer(0);
    setDuration(0);
    setTimerStart(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lead) return;
    
    // Validate form
    const validation = callSchema.safeParse({ duration, callType, notes, outcome });
    
    if (!validation.success) {
      setFormErrors(validation.error.format());
      return;
    }

    setIsLoading(true);

    try {
      const callData = {
        lead_id: lead.id,
        user_id: profile?.id,
        duration: duration * 60, // Store in seconds
        call_type: callType,
        outcome,
        notes,
        call_start_time: timerStart?.toISOString() || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // Insert call record
      const { error: callError } = await supabase
        .from('calls')
        .insert(callData);

      if (callError) throw callError;

      // Log activity
      const { error: activityError } = await supabase
        .from('lead_activities')
        .insert({
          lead_id: lead.id,
          activity_type: 'call',
          subject: `Call ${callType === 'inbound' ? 'received' : 'made'}`,
          description: `Call ${callType === 'inbound' ? 'received' : 'made'} with ${lead.first_name || 'lead'}. Duration: ${duration} min. Outcome: ${outcome}`,
          created_by: profile?.id,
          is_automated: false,
        });

      if (activityError) console.error('Error logging activity:', activityError);

      // Update lead's last_contacted_at
      const { error: leadError } = await supabase
        .from('leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', lead.id);

      if (leadError) console.error('Error updating lead:', leadError);

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries(['calls', lead.id]),
        queryClient.invalidateQueries(['leadActivities', lead.id]),
        queryClient.invalidateQueries(['lead', lead.id]),
      ]);

      toast.success('Call logged successfully');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error logging call:', error);
      toast.error('Failed to log call');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDuration(0);
    setCallType('outbound');
    setOutcome('completed');
    setNotes('');
    setFormErrors(null);
    resetTimer();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!lead) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex justify-between items-center mb-4"
                >
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Log a Call
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </Dialog.Title>

                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Log a call with {lead.first_name || 'the lead'}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Call Timer */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Call Duration
                        </label>
                        <span className="text-2xl font-mono">
                          {formatTime(timer)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {!isTimerRunning ? (
                          <button
                            type="button"
                            onClick={startTimer}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Start Call
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopTimer}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            End Call
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={resetTimer}
                          disabled={!duration && !isTimerRunning}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reset
                        </button>
                      </div>
                      {formErrors?.duration?._errors && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.duration._errors[0]}
                        </p>
                      )}
                    </div>

                    {/* Call Type */}
                    <div>
                      <label htmlFor="callType" className="block text-sm font-medium text-gray-700">
                        Call Type
                      </label>
                      <select
                        id="callType"
                        value={callType}
                        onChange={(e) => setCallType(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="outbound">Outbound Call</option>
                        <option value="inbound">Inbound Call</option>
                        <option value="callback">Callback</option>
                        <option value="voicemail">Voicemail</option>
                      </select>
                      {formErrors?.callType?._errors && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.callType._errors[0]}
                        </p>
                      )}
                    </div>

                    {/* Outcome */}
                    <div>
                      <label htmlFor="outcome" className="block text-sm font-medium text-gray-700">
                        Outcome
                      </label>
                      <select
                        id="outcome"
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="completed">Completed</option>
                        <option value="no_answer">No Answer</option>
                        <option value="busy">Busy</option>
                        <option value="failed">Failed</option>
                        <option value="voicemail">Left Voicemail</option>
                      </select>
                      {formErrors?.outcome?._errors && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.outcome._errors[0]}
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <div className="mt-1">
                        <textarea
                          rows={4}
                          name="notes"
                          id="notes"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      {formErrors?.notes?._errors && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.notes._errors[0]}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        disabled={isLoading || (duration === 0 && !isTimerRunning)}
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm ${
                          (isLoading || (duration === 0 && !isTimerRunning)) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isLoading ? 'Saving...' : 'Log Call'}
                      </button>
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        onClick={handleClose}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
