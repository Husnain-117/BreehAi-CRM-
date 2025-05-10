import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '../ui/button';
import { SelectField } from '../ui/SelectField';
import { useUsersQuery } from '../../hooks/queries/useUsersQuery';
import { useUpdateUserMutation } from '../../hooks/mutations/useUpdateUserMutation';
import { UserProfile } from '../../types';

interface AssignAgentModalProps {
  open: boolean;
  onClose: () => void;
  agent: UserProfile | null;
  onSuccess: () => void;
}

export const AssignAgentModal: React.FC<AssignAgentModalProps> = ({ open, onClose, agent, onSuccess }) => {
  const [managerId, setManagerId] = useState('');
  const { data: managers, isLoading: managersLoading } = useUsersQuery({ role: 'manager' });
  const updateMutation = useUpdateUserMutation();

  useEffect(() => {
    if (agent && open) {
      setManagerId(agent.manager_id || '');
    } else if (!open) {
      setManagerId('');
    }
  }, [agent, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (agent) {
      try {
        await updateMutation.mutateAsync({ ...agent, id: agent.id, manager_id: managerId || null });
        onSuccess();
      } catch (error) {
        console.error("Assign agent error:", error);
      }
    }
  };

  const errorMsg = (updateMutation.error as Error)?.message;
  const managerOptions = [
    { value: '', label: 'None' },
    ...(managers?.map(m => ({ 
        value: m.id, 
        label: m.full_name || m.email || m.id 
    })) || [])
  ];

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" /> 
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-card p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Assign Agent to Manager
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <SelectField
                    label="Manager"
                    name="manager_id"
                    value={managerId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setManagerId(e.target.value)}
                    options={managerOptions}
                    disabled={managersLoading}
                  />
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={updateMutation.isLoading || managersLoading}>
                      {updateMutation.isLoading ? 'Assigning...' : 'Assign'}
                    </Button>
                  </div>
                  {errorMsg && (
                    <div className="mt-2 text-sm text-red-600">Error: {errorMsg}</div>
                  )}
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 