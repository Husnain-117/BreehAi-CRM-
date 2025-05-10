import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { LeadFormData } from '../../types/leadSchema';
import toast from 'react-hot-toast';

interface ImportLeadsData {
  leads: LeadFormData[];
}

const importLeads = async ({ leads }: ImportLeadsData): Promise<number> => {
  if (!leads || leads.length === 0) {
    return 0;
  }

  const processedLeadsForDb: any[] = [];
  let successfullyProcessedCount = 0;

  for (const leadData of leads) {
    try {
      // Step 1: Upsert client information
      const clientToUpsert = {
        client_name: leadData.clientName,
        company: leadData.companyName,
        // Ensure companySize is a number or null, not empty string from Zod coercion
        company_size: typeof leadData.companySize === 'number' ? leadData.companySize : null, 
        // Add other client-specific fields if they exist in LeadFormData and map to clients table
        email: leadData.email, // Assuming client's direct email if relevant for clients table
        phone: leadData.phone, // Assuming client's direct phone if relevant for clients table
      };

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .upsert(clientToUpsert, { onConflict: 'client_name' }) // Assuming client_name is unique
        .select('id')
        .single();

      if (clientError || !clientData) {
        console.error('Error upserting client:', clientError?.message, 'for lead:', leadData.clientName);
        // Optionally, collect this error and report it, or skip this lead
        continue; // Skip this lead if client upsert fails
      }

      const clientId = clientData.id;

      // Step 2: Prepare lead object for 'leads' table
      let tagsArray: string[] | null = null;
      if (leadData.tags && typeof leadData.tags === 'string') {
        tagsArray = leadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(leadData.tags)) { // Should not happen based on Zod schema, but good practice
        tagsArray = leadData.tags;
      }
      
      const leadForDb = {
        client_id: clientId,
        agent_id: leadData.agent_id || null, // Ensure null if empty string
        status_bucket: leadData.status, // Direct mapping from Zod schema
        lead_source: leadData.leadSource,
        contact_person: leadData.contactPerson,
        email: leadData.email, // Lead's specific email
        phone: leadData.phone, // Lead's specific phone
        deal_value: typeof leadData.dealValue === 'number' ? leadData.dealValue : null,
        tags: tagsArray,
        notes: leadData.notes,
        // other fields from LeadFormData that map directly to 'leads' table columns
        // e.g., progress_details, next_step if they were in LeadFormData
      };

      processedLeadsForDb.push(leadForDb);
    } catch (individualError) {
        console.error('Error processing individual lead:', leadData.clientName, individualError);
        // Optionally, collect errors for individual leads
    }
  }

  if (processedLeadsForDb.length === 0) {
    toast.error("No leads could be prepared for import after processing.");
    return 0;
  }

  // Step 3: Batch insert processed leads into 'leads' table
  const { error: leadsInsertError, count: insertedLeadsCount } = await supabase
    .from('leads')
    .insert(processedLeadsForDb);

  if (leadsInsertError) {
    console.error('Error inserting leads:', leadsInsertError);
    let message = leadsInsertError.message;
    // Attempt to provide a more specific error message if possible
    if (leadsInsertError.details?.includes('violates unique constraint')) {
        message = 'One or more leads violate a unique constraint (e.g., duplicate email or phone if unique in DB for leads).';
    } else if (leadsInsertError.details?.includes('violates foreign key constraint')) {
        message = 'One or more leads reference a non-existent entity (e.g., invalid agent_id).';
    }
    throw new Error(`Supabase error during leads insert: ${message}`);
  }
  
  successfullyProcessedCount = insertedLeadsCount !== null ? insertedLeadsCount : 0;
  
  if (successfullyProcessedCount < leads.length && successfullyProcessedCount == 0 && processedLeadsForDb.length > 0) {
    // This means all leads were processed for DB, but insert returned 0, which implies a deeper issue or all failed server-side
     toast.error(`Leads were prepared, but Supabase reported 0 successful inserts. Check server logs or data validity.`);
  } else if (successfullyProcessedCount < leads.length) {
    toast.error(`${leads.length - successfullyProcessedCount} leads could not be imported due to issues during client creation or final insert.`);
  }

  return successfullyProcessedCount;
};

export const useImportLeadsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(importLeads, {
    onSuccess: (insertedCount) => {
      toast.success(`${insertedCount} leads imported successfully!`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }); // Invalidate dashboard too
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });
}; 