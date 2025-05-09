import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'; // Changed CalendarIcon to ClockIcon for follow-up
import { z } from 'zod'; // Import Zod
import { Lead } from '../../types';
import { useCreateFollowUpMutation, NewFollowUpData } from '../../hooks/mutations/useCreateFollowUpMutation'; // Import mutation hook and data type
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { supabase } from '../../api/supabaseClient'; // Import supabase client
import { useQueryClient } from '@tanstack/react-query'; // For manual invalidation after RPC
import { toast } from 'react-hot-toast';

// Zod schema for follow-up validation
const followUpSchema = z.object({
  dueDate: z.string().min(1, { message: 'Due date is required.' })
    .refine(date => !isNaN(new Date(date).valueOf()), { message: 'Invalid date format.' }),
  notes: z.string().optional(),
});

type FollowUpFormErrors = z.ZodFormattedError<z.infer<typeof followUpSchema>> | null;

interface FollowUpModalProps {
  lead: Lead | null; // For single lead scheduling
  bulkLeads?: Lead[]; // For bulk scheduling
  isOpen: boolean;
  onClose: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({ lead, bulkLeads, isOpen, onClose }) => {
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<FollowUpFormErrors>(null);
  const { profile } = useAuth(); // Get user profile
  const { mutateAsync: createSingleFollowUp, isLoading: isSingleLoading, error: singleMutationError } = useCreateFollowUpMutation();
  const [isBulkLoading, setIsBulkLoading] = useState(false); // Separate loading state for bulk RPC
  const [bulkError, setBulkError] = useState<string | null>(null); // Separate error state for bulk RPC
  const queryClient = useQueryClient();

  const currentLeads = bulkLeads && bulkLeads.length > 0 ? bulkLeads : (lead ? [lead] : []);
  const isBulkMode = bulkLeads && bulkLeads.length > 0;

  useEffect(() => {
    if (isOpen && currentLeads.length > 0) {
      const firstLead = currentLeads[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      // Use existing follow_up_due_date if available and valid, otherwise default to tomorrow
      const initialDate = firstLead.follow_up_due_date ? new Date(firstLead.follow_up_due_date) : tomorrow;
      // Ensure the date is valid before trying to format it
      setDueDate(initialDate instanceof Date && !isNaN(initialDate.valueOf()) ? initialDate.toISOString().split('T')[0] : tomorrow.toISOString().split('T')[0]);
      setNotes('');
      setFormErrors(null); // Reset errors when modal opens or lead changes
      setBulkError(null);
    } else if (!isOpen) {
      setDueDate('');
      setNotes('');
      setFormErrors(null);
      setBulkError(null);
    }
  }, [isOpen, currentLeads]);

  if (!isOpen || currentLeads.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);
    setBulkError(null);

    const validationResult = followUpSchema.safeParse({ dueDate, notes });

    if (!validationResult.success) {
      setFormErrors(validationResult.error.format());
      return;
    }

    if (!profile || !profile.id) {
      // This should ideally be handled more gracefully, perhaps disabling the form
      // if the profile isn't available, or showing a specific error message.
      toast.error('User profile not found. Cannot create follow-up(s).');
      return;
    }

    const followUpsToCreate: NewFollowUpData[] = currentLeads.map(l => ({
      lead_id: l.id,
      agent_id: profile.id,
      due_date: validationResult.data.dueDate,
      notes: validationResult.data.notes,
      status: 'pending',
    }));

    if (isBulkMode) {
      setIsBulkLoading(true);
      try {
        const { error: rpcError } = await supabase.rpc('upsert_follow_ups_bulk', { follow_ups_data: followUpsToCreate });
        if (rpcError) throw rpcError;
        queryClient.invalidateQueries(['leads']);
        queryClient.invalidateQueries(['follow_ups']); // General follow_ups list
        currentLeads.forEach(l => queryClient.invalidateQueries(['follow_ups', l.id])); // Per-lead follow-ups
        onClose();
      } catch (err: any) {
        console.error('Bulk follow-up creation error:', err);
        setBulkError(err.message || 'Failed to create bulk follow-ups.');
      } finally {
        setIsBulkLoading(false);
      }
    } else if (followUpsToCreate.length === 1) {
      try {
        await createSingleFollowUp(followUpsToCreate[0]);
        // Manually invalidate queries to ensure UI updates
        queryClient.invalidateQueries({ queryKey: ['follow_ups'] });
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        onClose();
      } catch (err) {
        // Error is handled by singleMutationError state
      }
    }
  };

  const isLoading = isSingleLoading || isBulkLoading;
  const mutationError = singleMutationError || (bulkError ? { message: bulkError } : null);
  const leadDisplayName = isBulkMode ? `${currentLeads.length} selected leads` : (currentLeads[0]?.clients?.client_name || currentLeads[0]?.contact_person || 'N/A');

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={isLoading ? () => {} : onClose}> {/* Prevent closing while loading */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in-out duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in-out duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={isLoading ? () => {} : onClose} // Prevent closing while loading
                    disabled={isLoading}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ClockIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Schedule Follow-Up(s)
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        For: {leadDisplayName}
                      </p>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="mt-5 sm:mt-4 space-y-4">
                  <div>
                    <label htmlFor="followUpDueDate" className="block text-sm font-medium text-gray-700">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        name="followUpDueDate"
                        id="followUpDueDate"
                        value={dueDate}
                        onChange={(e) => {
                          setDueDate(e.target.value);
                          if (formErrors?.dueDate) setFormErrors(prev => prev ? { 
                            ...prev, 
                            dueDate: undefined 
                          } as FollowUpFormErrors : null);
                        }}
                        required // Keep for basic browser validation, Zod handles more robustly
                        disabled={isLoading}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 ${formErrors?.dueDate ? 'border-red-500' : ''}`}
                        aria-invalid={!!formErrors?.dueDate}
                        aria-describedby={formErrors?.dueDate ? 'dueDate-error' : undefined}
                      />
                    </div>
                    {formErrors?.dueDate?._errors && (
                      <p className="mt-1 text-xs text-red-600" id="dueDate-error">
                        {formErrors.dueDate._errors.join(', ')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="followUpNotes" className="block text-sm font-medium text-gray-700">
                      Notes (Optional)
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="followUpNotes"
                        name="followUpNotes"
                        rows={3}
                        value={notes}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          if (formErrors?.notes) setFormErrors(prev => prev ? { 
                            ...prev, 
                            notes: undefined 
                          } as FollowUpFormErrors : null);
                        }}
                        disabled={isLoading}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 ${formErrors?.notes ? 'border-red-500' : ''}`}
                        placeholder="Add a note for this follow-up..."
                        aria-invalid={!!formErrors?.notes}
                        aria-describedby={formErrors?.notes ? 'notes-error' : undefined}
                      />
                    </div>
                    {formErrors?.notes?._errors && (
                      <p className="mt-1 text-xs text-red-600" id="notes-error">
                        {formErrors.notes._errors.join(', ')}
                      </p>
                    )}
                  </div>
                  {mutationError && (
                    <div className="mt-2 text-sm text-red-600">
                      Failed to schedule follow-up: {mutationError.message}
                    </div>
                  )}
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-75"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Scheduling...' : (isBulkMode ? `Schedule for ${currentLeads.length} Leads` : 'Schedule')}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 disabled:opacity-75"
                      onClick={isLoading ? () => {} : onClose} // Prevent closing while loading
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}; 