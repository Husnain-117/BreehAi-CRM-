import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '../ui/button';
import { InputField } from '../ui/InputField';
import { SelectField } from '../ui/SelectField';
import { useUsersQuery } from '../../hooks/queries/useUsersQuery';
import { useCreateUserMutation } from '../../hooks/mutations/useCreateUserMutation';
import { useUpdateUserMutation } from '../../hooks/mutations/useUpdateUserMutation';
import { UserProfile } from '../../types';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess: () => void;
}

type RoleType = 'agent' | 'manager';

export const UserFormModal: React.FC<UserFormModalProps> = ({ open, onClose, user, onSuccess }) => {
  const isEdit = !!user;
  const [form, setForm] = useState<{
    full_name: string;
    email: string;
    role: RoleType;
    manager_id: string;
    password: string;
  }>({
    full_name: '',
    email: '',
    role: 'agent',
    manager_id: '',
    password: '',
  });
  const { data: managers } = useUsersQuery({ role: 'manager' });
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        role: (user.role as RoleType) || 'agent',
        manager_id: user.manager_id || '',
        password: '',
      });
    } else {
      setForm({ full_name: '', email: '', role: 'agent', manager_id: '', password: '' });
    }
  }, [user, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'role' ? (value as RoleType) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && user) {
        await updateMutation.mutateAsync({ ...user, ...form, id: user.id, role: form.role as UserProfile['role'] });
      } else {
        await createMutation.mutateAsync(form);
      }
      onSuccess();
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  const errorMsg = (createMutation.error as Error)?.message || (updateMutation.error as Error)?.message;

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
                  {isEdit ? 'Edit User' : 'Create User'}
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <InputField label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required />
                  <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={isEdit} />
                  <SelectField
                    label="Role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    options={[
                      { value: 'agent', label: 'Agent' },
                      { value: 'manager', label: 'Manager' },
                    ]}
                    required
                  />
                  {form.role === 'agent' && (
                    <SelectField
                      label="Manager"
                      name="manager_id"
                      value={form.manager_id}
                      onChange={handleChange}
                      options={[
                        { value: '', label: 'None' },
                        ...(managers?.map(m => ({ value: m.id, label: m.full_name || m.email || m.id })) || [])
                      ]}
                    />
                  )}
                  {!isEdit && (
                    <InputField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} />
                  )}
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                      {createMutation.isLoading || updateMutation.isLoading ? 'Processing...' : (isEdit ? 'Update' : 'Create')}
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