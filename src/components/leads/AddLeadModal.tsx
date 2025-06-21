import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, LeadFormData, leadStatusSchema, INDUSTRY_OPTIONS } from '../../types/leadSchema';
import { Button } from '../ui/button';
import { InputField } from '../ui/InputField';
import { SelectField } from '../ui/SelectField';
import { XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth to get current user

// Remove the fetchUsersList function since we don't need it anymore

const addNewLead = async (formData: LeadFormData, currentUserId: string) => {
  try {
    let clientId: string | null = null;

    // 1. Check for existing client by client_name
    const { data: existingClients, error: fetchClientError } = await supabase
      .from('clients')
      .select('id')
      .eq('client_name', formData.clientName);

    if (fetchClientError) {
      console.error('[addNewLead] Error fetching client by name:', fetchClientError);
      throw new Error('Failed to check for existing client.');
    }

    if (existingClients && existingClients.length > 0) {
      clientId = existingClients[0].id;
      console.log('[addNewLead] Found existing client with ID (by name):', clientId);
    } else {
      console.log('[addNewLead] No existing client found with this name. Creating new client...');
      const { data: newClient, error: createClientError } = await supabase
        .from('clients')
        .insert({
          client_name: formData.clientName,
          company: formData.companyName,
          company_size: formData.companySize === undefined ? null : formData.companySize,
          // Add industry to clients table if you want company-level categorization
          industry: formData.industry === '' ? null : formData.industry,
        })
        .select('id')
        .single();

      if (createClientError) {
        console.error('[addNewLead] Error creating new client:', createClientError);
        throw new Error('Failed to create new client.');
      }
      if (newClient) {
        clientId = newClient.id;
        console.log('[addNewLead] Created new client with ID:', clientId);
      } else {
        throw new Error('Failed to create client and retrieve ID.')
      }
    }

    if (!clientId) {
      throw new Error('Could not obtain a client ID for the lead.');
    }

    const leadInsertData: { [key: string]: any } = {
      client_id: clientId,
      agent_id: currentUserId, // Automatically assign to current user
      status_bucket: formData.status,
      lead_source: formData.leadSource,
      contact_person: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      deal_value: formData.dealValue === undefined ? null : formData.dealValue,
      industry: formData.industry === '' ? null : formData.industry,
      notes: formData.notes === '' ? null : formData.notes,
      tags: formData.tags && formData.tags.trim() !== '' 
            ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') 
            : null,
    };

    console.log('[addNewLead] Data being inserted into leads table:', leadInsertData);

    const { data, error } = await supabase
      .from('leads')
      .insert(leadInsertData)
      .select();

    if (error) {
      console.error('[addNewLead] Error adding lead to Supabase:', error.message, error.details, error.hint);
      const errorMessage = error.message || 'Failed to add lead.';
      throw new Error(errorMessage);
    }
    
    console.log('[addNewLead] Lead added successfully to Supabase:', data);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth(); // Get current user profile

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
      agent_id: '', // This will be ignored since we auto-assign
      leadSource: '',
      contactPerson: '',
      email: '',
      phone: '',
      dealValue: undefined,
      companySize: undefined,
      industry: '',
      tags: '',
      notes: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset(); // Reset form when modal opens
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: LeadFormData) => {
    if (!profile?.id) {
      toast.error('User profile not found. Cannot create lead.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Adding new lead...');
    try {
      await addNewLead(data, profile.id); // Pass current user ID
      toast.success(`Lead added successfully and assigned to ${profile.full_name}!`, { id: toastId });
      onLeadAdded();
      onClose();
    } catch (error) {
      console.error('Failed to submit lead:', error);
      toast.error((error as Error).message || 'An unexpected error occurred.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const statusOptions = leadStatusSchema.options.map(status => ({ value: status, label: status }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" aria-labelledby="add-lead-modal-title" role="dialog" aria-modal="true">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 id="add-lead-modal-title" className="text-2xl font-semibold text-gray-800">Add New Lead</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <XIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Show current user info */}
        {profile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">👤 Lead Assignment</h3>
            <p className="text-sm text-blue-700">
              This lead will be automatically assigned to: <strong>{profile.full_name}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              No need to select an agent - it's automatically assigned to you!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <InputField label="Client Name" {...register('clientName')} error={errors.clientName?.message} placeholder="e.g., Acme Corp" autoFocus />
            <InputField label="Company Name" {...register('companyName')} error={errors.companyName?.message} placeholder="e.g., Acme Inc."/>
            <SelectField label="Status" {...register('status')} options={statusOptions} error={errors.status?.message} />
            
            {/* Remove the Assigned Agent field completely */}
            
            <InputField label="Lead Source" {...register('leadSource')} error={errors.leadSource?.message} placeholder="e.g., Website, Referral"/>
            <InputField label="Contact Person Name" {...register('contactPerson')} error={errors.contactPerson?.message} placeholder="e.g., John Doe"/>
            <InputField label="Email Address" type="email" {...register('email')} error={errors.email?.message} placeholder="e.g., john.doe@example.com"/>
            <InputField label="Phone Number" type="tel" {...register('phone')} error={errors.phone?.message} placeholder="e.g., (555) 123-4567"/>
            <InputField label="Deal Value ($)" type="number" {...register('dealValue')} error={errors.dealValue?.message} placeholder="e.g., 5000" step="0.01"/>
            <InputField label="Company Size (Employees)" type="number" {...register('companySize')} error={errors.companySize?.message} placeholder="e.g., 50" step="1"/>
            <SelectField 
              label="Industry" 
              {...register('industry')} 
              options={INDUSTRY_OPTIONS} 
              error={errors.industry?.message} 
            />
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