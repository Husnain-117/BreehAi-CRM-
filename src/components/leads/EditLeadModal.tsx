import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, LeadFormData, leadStatusSchema, INDUSTRY_OPTIONS } from '../../types/leadSchema';
import { Lead, UserProfile } from '../../types';
import { Button } from '../ui/button';
import { InputField } from '../ui/InputField';
import { SelectField } from '../ui/SelectField';
import { TextareaField } from '../ui/TextareaField';
import { XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUsersQuery } from '../../hooks/queries';
import { useUpdateLeadMutation } from '../../hooks/mutations/useUpdateLeadMutation';

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({ isOpen, onClose, lead }) => {
  const { data: users, isLoading: isLoadingUsers } = useUsersQuery({ role: 'agent' });
  const updateLeadMutation = useUpdateLeadMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
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
      dealValue: undefined,
      companySize: undefined,
      industry: '', // ADD THIS
      tags: '',
      notes: '',
    }
  });

  useEffect(() => {
    if (lead && isOpen) {
      reset({
        clientName: lead.clients?.client_name || '',
        companyName: lead.clients?.company || '',
        status: lead.status_bucket || 'P1',
        agent_id: lead.agent_id || '',
        leadSource: lead.lead_source || '',
        contactPerson: lead.contact_person || '',
        email: lead.email || '', 
        phone: lead.phone || '', 
        dealValue: lead.deal_value === null ? undefined : lead.deal_value,
        companySize: lead.clients?.company_size === null ? undefined : lead.clients?.company_size,
        // ADD THIS LINE
        industry: lead.industry || '',
        tags: lead.tags?.join(', ') || '',
        notes: lead.notes || '',
      });
    } else if (!isOpen) {
        reset(); 
    }
  }, [lead, isOpen, reset]);

  const onSubmit = async (data: LeadFormData) => {
    if (!lead || !lead.client_id) {
      toast.error('Cannot update lead: Missing lead or client ID.');
      return;
    }
    
    await updateLeadMutation.mutateAsync({ 
        leadId: lead.id, 
        clientId: lead.client_id, 
        updatedData: data 
    }, {
        onSuccess: () => {
            onClose(); 
        }
    });
  };

  if (!isOpen || !lead) return null;

  const statusOptions = leadStatusSchema.options.map(s => ({ value: s, label: s }));
  const agentOptions = [
    { value: '', label: 'Unassigned' },
    ...(users?.map(user => ({ value: user.id, label: user.full_name || 'Unnamed Agent' })) || [])
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <React.Fragment>
            <h2 className="text-2xl font-semibold">Edit Lead</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
              <XIcon className="h-6 w-6" />
            </Button>
          </React.Fragment>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-grow space-y-6 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <InputField label="Client Name" name="clientName" register={register} error={errors.clientName} required />
            <InputField label="Company Name" name="companyName" register={register} error={errors.companyName} required />
            <SelectField label="Status" name="status" register={register} error={errors.status} options={statusOptions} required />
            <SelectField label="Assigned Agent" name="agent_id" register={register} error={errors.agent_id} options={agentOptions} isLoading={isLoadingUsers} />
            <InputField label="Lead Source" name="leadSource" register={register} error={errors.leadSource} />
            <InputField label="Contact Person" name="contactPerson" register={register} error={errors.contactPerson} />
            <InputField label="Email" name="email" type="email" register={register} error={errors.email} required />
            <InputField label="Phone" name="phone" register={register} error={errors.phone} required />
            <InputField label="Deal Value ($)" name="dealValue" type="number" step="0.01" register={register} error={errors.dealValue} />
            <InputField label="Company Size (Employees)" name="companySize" type="number" register={register} error={errors.companySize} />
            {/* ADD INDUSTRY FIELD */}
            <SelectField 
              label="Industry" 
              name="industry" 
              register={register} 
              error={errors.industry} 
              options={INDUSTRY_OPTIONS} 
            />
          </div>
          
          <TextareaField label="Tags (comma-separated)" name="tags" register={register} error={errors.tags} placeholder="e.g., interested, demo-scheduled, high-priority" />
          <TextareaField label="Notes" name="notes" register={register} error={errors.notes} rows={4} />
          
          <div className="mt-auto pt-6 border-t border-border flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};