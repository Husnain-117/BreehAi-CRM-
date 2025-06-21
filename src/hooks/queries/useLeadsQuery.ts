import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Lead } from '../../types'; // Import Lead type

// Placeholder Lead type - REMOVED

interface LeadsQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: keyof Lead | string; // Allow string for joined columns like 'clients.client_name'
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>; // e.g., { status_bucket: 'P1', agent_id: 'uuid' }
}

const fetchLeads = async (options: LeadsQueryOptions = {}) => {
  console.log('[fetchLeads] Starting. Options:', options);

  let query = supabase.from('leads').select(`
    id,
    client_id,
    agent_id,
    status_bucket,
    progress_details,
    next_step,
    sync_lock,
    created_at,
    updated_at,
    lead_source,
    contact_person,
    email,
    phone,
    deal_value,
    tags,
    follow_up_due_date,
    clients (
      client_name,
      company,
      company_size
    ),
    users (full_name)
  `);

  // Apply filters
  if (options.filters) {
    for (const key in options.filters) {
      if (options.filters[key] !== undefined && options.filters[key] !== null && options.filters[key] !== '') {
        query = query.eq(key as any, options.filters[key]);
      }
    }
  }

  // Apply sorting
  if (options.sortBy && options.sortOrder) {
    const isJoinedSort = String(options.sortBy).includes('.');
    if (isJoinedSort) {
        const [foreignTable, column] = String(options.sortBy).split('.');
        query = query.order(column, { 
            ascending: options.sortOrder === 'asc', 
            foreignTable: foreignTable 
        });
    } else {
        query = query.order(options.sortBy as string, { ascending: options.sortOrder === 'asc' });
    }
  }

  console.log('[fetchLeads] Query built, before main execution or count query. Pagination options - Page:', options.page, 'Limit:', options.limit);

  // Apply pagination & count
  let totalCount: number | null = null;
  if (options.page && options.limit) {
    const from = (options.page - 1) * options.limit;
    const to = from + options.limit - 1;
    

    // Fetch total count only when paginating
    console.log('[fetchLeads] Attempting to fetch total count. Filters for count:', options.filters);
    let countQueryFilters = { ...options.filters }; 
    let countQuery = supabase.from('leads').select('id', { count: 'exact', head: true });
    if (countQueryFilters) {
        for (const key in countQueryFilters) {
          if (countQueryFilters[key] !== undefined && countQueryFilters[key] !== null && countQueryFilters[key] !== '') {
            countQuery = countQuery.eq(key as any, countQueryFilters[key]);
          }
        }
      }
    const { count: exactCount, error: countError } = await countQuery;
    if (countError) console.error("[fetchLeads] Error fetching total lead count:", countError.message);
    else console.log('[fetchLeads] Total count fetched:', exactCount);
    totalCount = exactCount;
    
    // Add range to the main query after count is fetched
    query = query.range(from, to);
    console.log('[fetchLeads] Range added to main query. From:', from, 'To:', to);
  }

  console.log('[fetchLeads] About to execute main data query.');
  const { data, error, count: queryCount } = await query.returns<Lead[]>();
  console.log('[fetchLeads] Main data query executed. Data:', data, 'Error:', error, 'QueryCount (from main query, may be null if paginated):', queryCount);

  if (error) {
    console.error('[fetchLeads] Error from main data query:', error.message);
    throw new Error(error.message);
  }
  
  const result = { leads: data || [], count: totalCount ?? queryCount ?? 0 };
  console.log('[fetchLeads] Returning result:', result);
  return result; 
};

export const useLeadsQuery = (options: LeadsQueryOptions = {}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('[useLeadsQuery] Setting up realtime subscription');
    
    // Create a unique channel name for each subscription
    const channelName = `leads_${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true },
      },
    });

    // Set up the postgres changes listener
    channel
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'leads' 
        },
        (payload) => {
          console.log('[useLeadsQuery] Change received on leads table!', payload);
          queryClient.invalidateQueries({ 
            queryKey: ['leads', options],
            refetchType: 'active',
          });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[useLeadsQuery] Subscription error:', err);
          return;
        }
        console.log(`[useLeadsQuery] Realtime status for ${channelName} → ${status}`);
      });

    // Cleanup function
    return () => {
      console.log(`[useLeadsQuery] Cleanup: Removing channel ${channelName}.`);
      if (channel) {
        supabase.removeChannel(channel)
          .then(() => console.log(`[useLeadsQuery] Channel ${channelName} removed successfully.`))
          .catch(err => console.error(`[useLeadsQuery] Error removing channel ${channelName}:`, err));
      }
    };
  }, [queryClient, JSON.stringify(options)]); // Use JSON.stringify for deep comparison of options

  return useQuery<{ leads: Lead[], count: number }, Error>(
    ['leads', options], 
    () => fetchLeads(options),
    {
      keepPreviousData: true, 
    }
  );
}; 