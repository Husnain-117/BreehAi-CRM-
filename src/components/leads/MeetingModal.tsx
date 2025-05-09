import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { z } from 'zod';
import { Lead } from '../../types';
import { useCreateMeetingMutation, NewMeetingData } from '../../hooks/mutations/useCreateMeetingMutation';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Zod schema for meeting validation
const meetingSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  meetingDate: z.string().min(1, { message: 'Date is required.' })
    .refine((date: string): boolean => !isNaN(new Date(date).valueOf()), { message: 'Invalid date format.' }),
  meetingTime: z.string().min(1, { message: 'Time is required.' })
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:MM).' }),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;
// Revert to simpler ZodFormattedError typing, similar to FollowUpModal
type MeetingFormErrors = z.ZodFormattedError<MeetingFormData> | null;

interface MeetingModalProps {
  lead: Lead | null;
  bulkLeads?: Lead[];
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingModal: React.FC<MeetingModalProps> = ({ lead, bulkLeads, isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<MeetingFormErrors>(null);
  const { profile } = useAuth();
  const { mutateAsync: createSingleMeeting, isLoading: isSingleLoading, error: singleMutationError } = useCreateMeetingMutation();
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const currentLeads = bulkLeads && bulkLeads.length > 0 ? bulkLeads : (lead ? [lead] : []);
  const isBulkMode = bulkLeads && bulkLeads.length > 0;

  useEffect(() => {
    if (isOpen && currentLeads.length > 0) {
      const firstLead = currentLeads[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setMeetingDate(tomorrow.toISOString().split('T')[0]);
      setMeetingTime('10:00');
      setTitle(`Meeting with ${firstLead.clients?.client_name || firstLead.contact_person || 'Lead'}`);
      setNotes('');
      setLocation('');
      setFormErrors(null);
      setBulkError(null);
    } else if (!isOpen) {
      setTitle('');
      setMeetingDate('');
      setMeetingTime('');
      setLocation('');
      setNotes('');
      setFormErrors(null);
      setBulkError(null);
    }
  }, [isOpen, currentLeads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);
    setBulkError(null);

    const validationResult = meetingSchema.safeParse({ title, meetingDate, meetingTime, location, notes });

    if (!validationResult.success) {
      setFormErrors(validationResult.error.format()); // Standard Zod format
      return;
    }

    if (!profile || !profile.id) {
      toast.error('User profile not found. Cannot create meeting(s).');
      return;
    }

    const { title: validatedTitle, meetingDate: validatedDate, meetingTime: validatedTime, location: validatedLocation, notes: validatedNotes } = validationResult.data;
    const startDateTime = new Date(`${validatedDate}T${validatedTime}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const meetingsToCreate: NewMeetingData[] = currentLeads.map(l => ({
      lead_id: l.id,
      agent_id: profile.id,
      title: validatedTitle,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      location: validatedLocation || undefined,
      notes: validatedNotes || undefined,
    }));

    if (isBulkMode) {
      setIsBulkLoading(true);
      try {
        const { error: rpcError } = await supabase.rpc('upsert_meetings_bulk', { meetings_data: meetingsToCreate });
        if (rpcError) throw rpcError;
        queryClient.invalidateQueries(['meetings']);
        currentLeads.forEach(l => queryClient.invalidateQueries(['meetings', l.id]));
        queryClient.invalidateQueries(['leads']);
        onClose();
      } catch (err: any) {
        console.error('Bulk meeting creation error:', err);
        setBulkError(err.message || 'Failed to create bulk meetings.');
      } finally {
        setIsBulkLoading(false);
      }
    } else if (meetingsToCreate.length === 1) {
      try {
        await createSingleMeeting(meetingsToCreate[0]);
        // Manually invalidate queries to ensure UI updates
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
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

  if (!isOpen || currentLeads.length === 0) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={isLoading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
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
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={isLoading ? () => {} : onClose}
                    disabled={isLoading}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CalendarDaysIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Schedule Meeting(s)
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
                    <label htmlFor="meetingTitle" className="block text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input type="text" name="meetingTitle" id="meetingTitle" value={title} onChange={(e) => { setTitle(e.target.value); if (formErrors?.title) setFormErrors((prev) => prev ? ({ ...prev, title: undefined }) : null); }} required disabled={isLoading} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 ${formErrors?.title ? 'border-red-500' : ''}`} aria-invalid={!!formErrors?.title} aria-describedby={formErrors?.title ? 'title-error' : undefined} />
                    {formErrors?.title?._errors && (<p className="mt-1 text-xs text-red-600" id="title-error">{formErrors.title._errors.join(', ')}</p>)}
                  </div>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input type="date" name="meetingDate" id="meetingDate" value={meetingDate} onChange={(e) => { setMeetingDate(e.target.value); if (formErrors?.meetingDate) setFormErrors((prev) => prev ? ({ ...prev, meetingDate: undefined }) : null); }} required disabled={isLoading} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 ${formErrors?.meetingDate ? 'border-red-500' : ''}`} aria-invalid={!!formErrors?.meetingDate} aria-describedby={formErrors?.meetingDate ? 'date-error' : undefined} />
                      {formErrors?.meetingDate?._errors && (<p className="mt-1 text-xs text-red-600" id="date-error">{formErrors.meetingDate._errors.join(', ')}</p>)}
                    </div>
                    <div>
                      <label htmlFor="meetingTime" className="block text-sm font-medium text-gray-700">
                        Time <span className="text-red-500">*</span>
                      </label>
                      <input type="time" name="meetingTime" id="meetingTime" value={meetingTime} onChange={(e) => { setMeetingTime(e.target.value); if (formErrors?.meetingTime) setFormErrors((prev) => prev ? ({ ...prev, meetingTime: undefined }) : null); }} required disabled={isLoading} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 ${formErrors?.meetingTime ? 'border-red-500' : ''}`} aria-invalid={!!formErrors?.meetingTime} aria-describedby={formErrors?.meetingTime ? 'time-error' : undefined} />
                      {formErrors?.meetingTime?._errors && (<p className="mt-1 text-xs text-red-600" id="time-error">{formErrors.meetingTime._errors.join(', ')}</p>)}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="meetingLocation" className="block text-sm font-medium text-gray-700">
                      Location (Optional)
                    </label>
                    <input type="text" name="meetingLocation" id="meetingLocation" value={location} onChange={(e) => { setLocation(e.target.value); if (formErrors?.location) setFormErrors((prev) => prev ? ({ ...prev, location: undefined }) : null); }} disabled={isLoading} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 ${formErrors?.location ? 'border-red-500' : ''}`} aria-invalid={!!formErrors?.location} aria-describedby={formErrors?.location ? 'location-error' : undefined} />
                    {formErrors?.location?._errors && (<p className="mt-1 text-xs text-red-600" id="location-error">{formErrors.location._errors.join(', ')}</p>)}
                  </div>
                  <div>
                    <label htmlFor="meetingNotes" className="block text-sm font-medium text-gray-700">
                      Notes (Optional)
                    </label>
                    <textarea id="meetingNotes" name="meetingNotes" rows={3} value={notes} onChange={(e) => { setNotes(e.target.value); if (formErrors?.notes) setFormErrors((prev) => prev ? ({...prev, notes: undefined}) : null);}} disabled={isLoading} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 ${formErrors?.notes ? 'border-red-500' : ''}`} placeholder="Add a note for this meeting..." aria-invalid={!!formErrors?.notes} aria-describedby={formErrors?.notes ? 'notes-error' : undefined} />
                    {formErrors?.notes?._errors && (<p className="mt-1 text-xs text-red-600" id="notes-error">{formErrors.notes._errors.join(', ')}</p>)}
                  </div>
                  {mutationError && (
                    <div className="text-sm text-red-600">
                      Failed to schedule meeting(s): {mutationError.message}
                    </div>
                  )}
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-75"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Scheduling...' : (isBulkMode ? `Schedule for ${currentLeads.length} Leads` : 'Schedule Meeting')}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 disabled:opacity-75"
                      onClick={isLoading ? () => {} : onClose}
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