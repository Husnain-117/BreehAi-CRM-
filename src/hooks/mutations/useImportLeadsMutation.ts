import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { LeadFormData } from '../../types/leadSchema';
import toast from 'react-hot-toast';

interface ImportLeadsData {
  leads: LeadFormData[] | any[]; // Accept both types
  currentUserId?: string; // Current user ID for auto-assignment
  skipValidationErrors?: boolean;
}

interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: Array<{
    leadIndex: number;
    leadData: any;
    error: string;
  }>;
}

// Helper function to clean and validate data
const cleanLeadData = (leadData: any): any => {
  return {
    ...leadData,
    // Clean phone numbers - remove all non-digits except +
    phone: leadData.phone ? leadData.phone.toString().replace(/[^\d+]/g, '') : null,
    // Clean deal values - remove currency symbols and commas
    dealValue: leadData.dealValue ? parseFloat(leadData.dealValue.toString().replace(/[^\d.]/g, '')) || null : null,
    // Clean email - lowercase and trim
    email: leadData.email ? leadData.email.toLowerCase().trim() : null,
    // Convert empty strings to null
    clientName: leadData.clientName?.trim() || null,
    companyName: leadData.companyName?.trim() || null,
    contactPerson: leadData.contactPerson?.trim() || null,
    leadSource: leadData.leadSource?.trim() || null,
    notes: leadData.notes?.trim() || null,
    tags: leadData.tags?.trim() || null,
  };
};

const importLeads = async ({ 
  leads, 
  currentUserId,
  skipValidationErrors = true 
}: ImportLeadsData): Promise<ImportResult> => {
  if (!leads || leads.length === 0) {
    return { successCount: 0, errorCount: 0, errors: [] };
  }

  if (!currentUserId) {
    throw new Error('Current user ID is required for lead assignment');
  }

  const result: ImportResult = {
    successCount: 0,
    errorCount: 0,
    errors: []
  };

  console.log(`Starting import of ${leads.length} leads assigned to user: ${currentUserId}`);
  
  // Process leads one by one for better error handling
  for (let i = 0; i < leads.length; i++) {
    const leadData = leads[i];
    
    try {
      // Clean the lead data first
      const cleanedLead = cleanLeadData(leadData);
      
      // Validate required fields
      if (!cleanedLead.clientName && !cleanedLead.companyName) {
        throw new Error('Either Client Name or Company Name is required');
      }
      
      if (!cleanedLead.email && !cleanedLead.phone) {
        throw new Error('Either Email or Phone is required');
      }
      
      // Step 1: Auto-assign to current user (no agent lookup needed)
      const agentId = currentUserId;
      
      // Step 2: Upsert client information
      const clientToUpsert = {
        client_name: cleanedLead.clientName || cleanedLead.companyName,
        company: cleanedLead.companyName || cleanedLead.clientName,
        company_size: typeof cleanedLead.companySize === 'number' ? cleanedLead.companySize : null,
        email: cleanedLead.email,
        phone: cleanedLead.phone,
        industry: cleanedLead.industry || null,
      };

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .upsert(clientToUpsert, { 
          onConflict: 'client_name',
          ignoreDuplicates: false 
        })
        .select('id')
        .single();

      if (clientError) {
        // Try to get existing client if upsert failed
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('client_name', clientToUpsert.client_name)
          .single();
          
        if (!existingClient) {
          throw new Error(`Failed to create/find client: ${clientError.message}`);
        }
        
        clientData.id = existingClient.id;
      }

      if (!clientData?.id) {
        throw new Error('Could not obtain client ID');
      }

      // Step 3: Prepare lead object for database
      let tagsArray: string[] | null = null;
      if (cleanedLead.tags && typeof cleanedLead.tags === 'string') {
        tagsArray = cleanedLead.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }
      
      const leadForDb = {
        client_id: clientData.id,
        agent_id: agentId, // Always use current user
        status_bucket: cleanedLead.status || 'P1',
        lead_source: cleanedLead.leadSource || 'Import',
        contact_person: cleanedLead.contactPerson || cleanedLead.clientName,
        email: cleanedLead.email,
        phone: cleanedLead.phone,
        deal_value: cleanedLead.dealValue,
        tags: tagsArray,
        notes: cleanedLead.notes,
        next_step: cleanedLead.nextStep || null,
        progress_details: cleanedLead.progress || null,
      };

      // Step 4: Insert the lead
      const { error: leadInsertError } = await supabase
        .from('leads')
        .insert(leadForDb);

      if (leadInsertError) {
        throw new Error(`Failed to insert lead: ${leadInsertError.message}`);
      }

      result.successCount++;
      console.log(`Successfully imported lead ${i + 1}: ${cleanedLead.clientName || cleanedLead.companyName}`);

    } catch (error) {
      result.errorCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      result.errors.push({
        leadIndex: i + 1,
        leadData: {
          clientName: leadData.clientName,
          companyName: leadData.companyName,
          email: leadData.email,
          phone: leadData.phone
        },
        error: errorMessage
      });
      
      console.error(`Error importing lead ${i + 1}:`, errorMessage, leadData);
      
      // If skipValidationErrors is false, stop on first error
      if (!skipValidationErrors) {
        break;
      }
    }
  }

  console.log(`Import completed: ${result.successCount} successful, ${result.errorCount} failed`);
  
  return result;
};

export const useImportLeadsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(importLeads, {
    onSuccess: (result) => {
      const { successCount, errorCount, errors } = result;
      
      if (successCount > 0) {
        toast.success(`${successCount} leads imported and assigned to you successfully!`);
        
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} leads failed to import. Check console for details.`);
        
        // Log detailed errors for debugging
        console.group('Import Errors Details:');
        errors.forEach(error => {
          console.error(`Row ${error.leadIndex}:`, error.error, error.leadData);
        });
        console.groupEnd();
      }
      
      if (successCount === 0 && errorCount > 0) {
        toast.error('No leads were imported. Please check your data format and try again.');
      }
    },
    onError: (error: Error) => {
      console.error('Import mutation failed:', error);
      toast.error(`Import failed: ${error.message}`);
    },
  });
};