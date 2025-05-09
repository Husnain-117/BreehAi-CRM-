import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, LeadFormData, leadStatusSchema } from '../../types/leadSchema';
import { Button } from '../ui/button';
import { InputField } from '../ui/InputField';
import { SelectField } from '../ui/SelectField';
import { XIcon } from 'lucide-react'; // For close button
import toast from 'react-hot-toast'; // Import toast
import { supabase } from '../../lib/supabaseClient'; // Adjust path if necessary

// API functions using the REAL Supabase client
const fetchUsersList = async () => {
  const { data, error } = await supabase.from('users').select('id, full_name'); // Adjust if your user table/columns differ
  if (error) {
    console.error('Error fetching users:', error);
    throw new Error(error.message || 'Failed to fetch users.');
  }
  return data.map((user: any) => ({ id: user.id, name: user.full_name || user.name })); // Adjust name mapping if needed
};

const addNewLead = async (formData: LeadFormData) => {
  try {
    // Construct the object to insert into the 'leads' table.
    // Keys must match actual column names in your Supabase 'leads' table.
    const leadInsertData: { [key: string]: any } = {
      // client_id will be set after client lookup/creation logic is implemented.
      // If client_id is non-nullable in your DB, this insert will fail until that logic is added.
      agent_id: formData.agent_id === '' ? null : formData.agent_id,
      status_bucket: formData.status, // Assumes 'status' from form maps to 'status_bucket' in DB
      lead_source: formData.leadSource,
      contact_person: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      // dealValue is already a number or undefined due to z.coerce.number(). If undefined, send null.
      deal_value: formData.dealValue === undefined ? null : formData.dealValue, 
      tags: formData.tags,
      notes: formData.notes, 
      // Ensure all other necessary fields for 'leads' table are included here if they are in LeadFormData
    };

    // TODO: Implement client lookup/creation logic using formData.clientName, formData.companyName, formData.companySize
    // and then set leadInsertData.client_id = foundOrCreatedClientId;

    console.log('[addNewLead] Data being inserted into leads table:', leadInsertData);

    const { data, error } = await supabase
      .from('leads')
      .insert(leadInsertData) // Insert the transformed data
      .select();

    if (error) {
      console.error('[addNewLead] Error adding lead to Supabase:', error.message, error.details, error.hint);
      const errorMessage = error.message || 'Failed to add lead.';
      throw new Error(errorMessage);
    }
    
    console.log('[addNewLead] Lead added successfully to Supabase:', data);
    // data from insert().select() is an array of inserted records
    return data && data.length > 0 ? data[0] : null;
  } catch (e) {
    const errorMessage = (e as Error)?.message || 'An unexpected error occurred while adding lead.';
    console.error('[addNewLead] Caught exception:', e);
    throw new Error(errorMessage);
  }
};

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onLeadAdded }) => {
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      clientName: '',
      companyName: '',
      status: 'P1',
      agent_id: '',
      leadSource: '',
      contactPerson: '',
      email: '',
      phone: '',
      dealValue: undefined, // Let z.coerce.number handle undefined for initial empty state
      companySize: undefined, // Let z.coerce.number handle undefined for initial empty state
      tags: '',
      notes: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        try {
          const fetchedUsers = await fetchUsersList();
          setUsers(fetchedUsers);
        } catch (err) {
          toast.error((err as Error).message || 'Could not load users.');
        }
      };
      loadUsers();
      reset(); // Reset form when modal opens
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Adding new lead...');
    try {
      // console.log("Form data to submit:", data);
      await addNewLead(data);
      toast.success('Lead added successfully!', { id: toastId });
      onLeadAdded(); // Call parent callback to refresh data
      onClose(); // Close modal on success
    } catch (error) {
      console.error('Failed to submit lead:', error);
      toast.error((error as Error).message || 'An unexpected error occurred.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const statusOptions = leadStatusSchema.options.map(status => ({ value: status, label: status }));
  const agentOptions = users.map(user => ({ value: user.id, label: user.name }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" aria-labelledby="add-lead-modal-title" role="dialog" aria-modal="true">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 id="add-lead-modal-title" className="text-2xl font-semibold text-gray-800">Add New Lead</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <XIcon className="h-6 w-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InputField label="Client Name" {...register('clientName')} error={errors.clientName?.message} placeholder="e.g., Acme Corp" autoFocus />
            <InputField label="Company Name" {...register('companyName')} error={errors.companyName?.message} placeholder="e.g., Acme Inc."/>
            <SelectField label="Status" {...register('status')} options={statusOptions} error={errors.status?.message} />
            <SelectField label="Assigned Agent" {...register('agent_id')} options={agentOptions} error={errors.agent_id?.message} />
            <InputField label="Lead Source" {...register('leadSource')} error={errors.leadSource?.message} placeholder="e.g., Website, Referral"/>
            <InputField label="Contact Person Name" {...register('contactPerson')} error={errors.contactPerson?.message} placeholder="e.g., John Doe"/>
            <InputField label="Email Address" type="email" {...register('email')} error={errors.email?.message} placeholder="e.g., john.doe@example.com"/>
            <InputField label="Phone Number" type="tel" {...register('phone')} error={errors.phone?.message} placeholder="e.g., (555) 123-4567"/>
            <InputField label="Deal Value" type="number" {...register('dealValue')} error={errors.dealValue?.message} placeholder="e.g., 5000" step="0.01"/>
            <InputField label="Company Size" type="number" {...register('companySize')} error={errors.companySize?.message} placeholder="e.g., 50" step="1"/>
          </div>
          
          <div className="mt-4">
            <InputField label="Tags (Optional)" {...register('tags')} error={errors.tags?.message} placeholder="e.g., important, follow-up-soon"/>
          </div>

          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={4}
              className={`mt-1 block w-full px-3 py-2 border ${errors.notes ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder="Enter any additional notes here..."
            />
            {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800">
              {isSubmitting ? 'Adding Lead...' : 'Add Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 