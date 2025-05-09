import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Lead } from '../../types';

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, isOpen, onClose }) => {
  if (!lead) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300 sm:duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300 sm:duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md sm:max-w-lg">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-white">
                          Lead Details: {lead.clients?.client_name || 'N/A'}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                            onClick={onClose}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-indigo-300">
                          Details for lead ID: {lead.id}
                        </p>
                      </div>
                    </div>
                    <div className="relative flex-1 px-4 py-6 sm:px-6">
                      {/* Lead details content */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-gray-900">Client Information</h3>
                          <p><strong>Company:</strong> {lead.clients?.company || 'N/A'}</p>
                          <p><strong>Contact:</strong> {lead.contact_person || 'N/A'}</p>
                          <p><strong>Email:</strong> {lead.email || 'N/A'}</p>
                          <p><strong>Phone:</strong> {lead.phone || 'N/A'}</p>
                          <p><strong>Lead Source:</strong> {lead.lead_source || 'N/A'}</p>
                          <p><strong>Company Size:</strong> {lead.clients?.company_size?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Lead Status & Value</h3>
                          <p><strong>Status:</strong> {lead.status_bucket}</p>
                          <p><strong>Deal Value:</strong> ${lead.deal_value?.toLocaleString() || '0.00'}</p>
                          <p><strong>Tags:</strong> {lead.tags?.join(', ') || 'None'}</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Assignment & Dates</h3>
                          <p><strong>Assigned Agent:</strong> {lead.users?.full_name || 'Unassigned'}</p>
                          <p><strong>Follow-Up Due:</strong> {lead.follow_up_due_date ? new Date(lead.follow_up_due_date).toLocaleDateString() : 'N/A'}</p>
                          <p><strong>Created:</strong> {new Date(lead.created_at).toLocaleString()}</p>
                          <p><strong>Updated:</strong> {new Date(lead.updated_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Progress & Next Steps</h3>
                          <p><strong>Progress Details:</strong> {lead.progress_details || 'N/A'}</p>
                          <p><strong>Next Step:</strong> {lead.next_step || 'N/A'}</p>
                        </div>
                        
                        {/* TODO: Activity Log Section */}
                        <div>
                          <h3 className="font-medium text-gray-900 mt-6">Activity Log</h3>
                          <p className="text-sm text-gray-500">(Placeholder for activity log)</p>
                          {/* This would list related follow-ups, meetings, status changes etc. */}
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}; 