import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { DailyReport } from '../../types';

// Changed to a type intersection to correctly combine with the DailyReport discriminated union
export type DailyReportWithNames = DailyReport & {
  agent_name: string | null;
  manager_name: string | null;
  // The actual nested objects from Supabase, if needed by the display component directly
  // Otherwise, they are flattened into agent_name and manager_name above.
  agent?: { full_name: string | null } | null;
  manager?: { full_name: string | null } | null;
};

interface UseDailyReportsQueryArgs {
  managerId?: string;
  // Add other filters like dateRange if needed in the future
}

// Define a type for the query options that our hook can accept
type DailyReportsQueryOptions = Omit<UseQueryOptions<DailyReportWithNames[], Error>, 'queryKey' | 'queryFn'>;

const fetchDailyReports = async ({ managerId }: UseDailyReportsQueryArgs): Promise<DailyReportWithNames[]> => {
  let query = supabase
    .from('daily_reports')
    .select(`
      *,
      agent:users!daily_reports_agent_id_fkey(full_name),
      manager:users!daily_reports_manager_id_fkey(full_name)
    `)
    .order('report_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (managerId) {
    query = query.eq('manager_id', managerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching daily reports:', error);
    throw new Error(error.message);
  }

  // The data from Supabase with the nested selects will look like:
  // { ...daily_report_fields, agent: { full_name: 'Agent Name' }, manager: { full_name: 'Manager Name' } }
  return (data || []).map(report => {
    const baseReport = report as Omit<typeof report, 'agent' | 'manager'> & DailyReport; // Assert base type
    return {
      ...baseReport,
      agent_name: report.agent?.full_name || 'N/A',
      manager_name: report.manager?.full_name || 'N/A',
      // Keep original agent/manager objects if needed, or they can be omitted if only names are used
      agent: report.agent,
      manager: report.manager,
    } as DailyReportWithNames;
  });
};

export const useDailyReportsQuery = (
  args: UseDailyReportsQueryArgs = {},
  options?: DailyReportsQueryOptions // Accept UseQueryOptions
) => {
  return useQuery<DailyReportWithNames[], Error>(
    ['daily_reports', args], // Include all args in queryKey for uniqueness
    () => fetchDailyReports(args),
    {
      ...options, // Spread the passed options here
    }
  );
}; 