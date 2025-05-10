import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '../ui/button';
import { InputField } from '../ui/InputField';
import { useResetUserPasswordMutation } from '../../hooks/mutations/useResetUserPasswordMutation';
import { UserProfile } from '../../types';

interface UpdatePasswordModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess: () => void;
}

export const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({ open, onClose, user, onSuccess }) => {
  const [password, setPassword] = useState('');
  const resetMutation = useResetUserPasswordMutation();

  useEffect(() => {
    if (open) {
      setPassword('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && password) {
      try {
        await resetMutation.mutateAsync({ userId: user.id, password });
        onSuccess();
      } catch (error) {
        console.error("Password update error:", error);
      }
    }
  };

  const errorMsg = (resetMutation.error as Error)?.message;

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
                  Update User Password
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <InputField 
                    label="New Password" 
                    name="password" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    minLength={6}
                  />
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={resetMutation.isLoading || !password}>
                      {resetMutation.isLoading ? 'Updating...' : 'Update'}
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