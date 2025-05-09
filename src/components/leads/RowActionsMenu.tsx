import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon, DocumentDuplicateIcon, TrashIcon, PencilSquareIcon, CalendarDaysIcon, ClockIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Lead, UserProfile } from '../../types'; // Assuming UserProfile is also in types
import { useAuth } from '../../contexts/AuthContext'; // To get current user profile for permissions

interface RowActionsMenuProps {
  lead: Lead;
  onViewDetails: () => void;
  onScheduleFollowUp: () => void;
  onScheduleMeeting: () => void; // Added prop
  // onDelete: (leadId: string) => void; // Example handler
}

const statusOptions: Lead['status_bucket'][] = ['P1', 'P2', 'P3'];

export const RowActionsMenu: React.FC<RowActionsMenuProps> = ({ lead, onViewDetails, onScheduleFollowUp, onScheduleMeeting }) => { // Destructured prop
  const { profile } = useAuth(); // Get current user's profile

  // TODO: Implement actual permission checks based on profile and lead
  const canEdit = true; // Example: profile?.role === 'super_admin' || profile?.id === lead.agent_id;
  const canDelete = profile?.role === 'super_admin' || profile?.role === 'manager';
  const canDuplicate = true; // Placeholder, replace with actual logic e.g., based on profile?.role

  const handleChangeStatus = (newStatus: Lead['status_bucket']) => {
    console.log(`Change status for lead ${lead.id} to ${newStatus}`);
    // TODO: Implement actual status change mutation
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button 
          onClick={(e) => e.stopPropagation()}
          className="inline-flex w-full justify-center rounded-md p-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100"
        >
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-20 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onViewDetails}
                  className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <PencilSquareIcon className="mr-2 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  View Details
                </button>
              )}
            </Menu.Item>
          </div>
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onScheduleFollowUp}
                  className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <ClockIcon className="mr-2 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Schedule Follow-Up...
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onScheduleMeeting} // Used prop
                  className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <CalendarDaysIcon className="mr-2 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Schedule Meeting...
                </button>
              )}
            </Menu.Item>
          </div>
          {/* Change Status Submenu */}
          <div className="py-1">
            <Menu as="div" className="relative">
              {({ open }) => (
                <>
                  <Menu.Button
                    className={`hover:bg-gray-100 hover:text-gray-900 text-gray-700 group flex w-full items-center justify-between rounded-md px-2 py-2 text-sm`}
                  >
                    Change Status
                    <ChevronRightIcon className={`h-5 w-5 text-gray-400 group-hover:text-gray-500 transform ${open ? 'rotate-90' : ''}`} />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute left-full top-0 -mt-7 ml-1 w-32 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {statusOptions.map((status) => (
                        <Menu.Item key={status}>
                          {({ active }) => (
                            <button
                              onClick={() => handleChangeStatus(status)}
                              className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} ${lead.status_bucket === status ? 'font-semibold' : 'font-normal'} block w-full text-left px-4 py-2 text-sm`}
                            >
                              {status}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
          </div>
          <div className="py-1">
            <Menu.Item disabled={!canDuplicate}>
              {({ active, disabled: isMenuItemDisabled }) => (
                <button
                  onClick={() => !isMenuItemDisabled && console.log('Duplicate Lead:', lead.id)} // Only log if not disabled
                  className={`${active && !isMenuItemDisabled ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} ${isMenuItemDisabled ? 'opacity-50 cursor-not-allowed' : 'group cursor-pointer'} flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  // The button itself is not explicitly disabled; Menu.Item handles focus and click blocking
                >
                  <DocumentDuplicateIcon className={`mr-2 h-5 w-5 ${isMenuItemDisabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-500'}`} aria-hidden="true" />
                  Duplicate Lead
                </button>
              )}
            </Menu.Item>
            <Menu.Item disabled={!canDelete}>
              {({ active, disabled: isMenuItemDisabled }) => (
                <button
                  onClick={() => !isMenuItemDisabled && console.log('Delete Lead:', lead.id)} // Only log if not disabled
                  className={`${active && !isMenuItemDisabled ? 'bg-red-100 text-red-700' : 'text-red-600'} ${isMenuItemDisabled ? 'opacity-50 cursor-not-allowed' : 'group cursor-pointer'} flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <TrashIcon className={`mr-2 h-5 w-5 ${isMenuItemDisabled ? 'text-red-300' : 'text-red-400 group-hover:text-red-500'}`} aria-hidden="true" />
                  Delete Lead
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}; 