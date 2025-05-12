import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../api/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DailyReport, TeamType, UserProfile } from '../types';
import { Button } from '../components/ui/button';
import { InputField } from '../components/ui/InputField';
import { SelectField } from '../components/ui/SelectField';

// New imports for Manager/Superadmin view
import { useDailyReportsQuery } from '../hooks/queries/useDailyReportsQuery';
import DailyReportsDisplay from '../components/admin/DailyReportsDisplay';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useUsersQuery } from '../hooks/queries/useUsersQuery';

// Import icons from lucide-react
import { CalendarDays, User, Users, ListFilter } from 'lucide-react';

// Import the new DatePicker
import { DatePicker } from '../components/ui/date-picker';

// Import date-fns format if needed elsewhere, or rely on DatePicker internal formatting
import { format as formatDate } from 'date-fns';

// Add ALL_VALUE constant
const ALL_VALUE = "__ALL__";

// --- Zod Schemas for Validation ---
const baseReportSchema = {
  report_date: z.string().refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "Date must be in YYYY-MM-DD format" }),
  team_type: z.enum(['telesales', 'linkedin', 'cold_email']),
};

const telesalesMetricsSchema = z.object({
  outreach_count: z.number().min(0),
  responses_count: z.number().min(0),
});

const linkedInMetricsSchema = z.object({
  outreach_count: z.number().min(0),
  responses_count: z.number().min(0),
  comments_done: z.number().min(0),
  content_posted: z.boolean(),
});

const coldEmailMetricsSchema = z.object({
  emails_sent: z.number().min(0),
  responses_count: z.number().min(0),
});

// Combined schema using discriminated union
const dailyReportFormSchema = z.discriminatedUnion("team_type", [
  z.object({ ...baseReportSchema, team_type: z.literal('telesales'), ...telesalesMetricsSchema.shape }),
  z.object({ ...baseReportSchema, team_type: z.literal('linkedin'), ...linkedInMetricsSchema.shape }),
  z.object({ ...baseReportSchema, team_type: z.literal('cold_email'), ...coldEmailMetricsSchema.shape }),
]);

type DailyReportFormData = z.infer<typeof dailyReportFormSchema>;

// --- API Function to save report ---
const saveDailyReport = async (reportData: Omit<DailyReport, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('daily_reports')
    .insert([reportData])
    .select();

  if (error) {
    toast.error(error.message);
    throw new Error(error.message);
  }
  return data?.[0];
};

const DailyReportPage: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeamType, setSelectedTeamType] = useState<TeamType | '' >('');

  // --- Filter State (Change date state to Date | undefined) --- 
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedAgentId, setSelectedAgentId] = useState(ALL_VALUE);
  const [selectedManagerId, setSelectedManagerId] = useState(ALL_VALUE);
  const [filterTeamType, setFilterTeamType] = useState<TeamType | typeof ALL_VALUE>(ALL_VALUE);

  // Fetch users for filter dropdowns
  const { data: allUsers } = useUsersQuery({}); // Fetch all users
  const agents = useMemo(() => allUsers?.filter(u => u.role === 'agent') || [], [allUsers]);
  const managers = useMemo(() => allUsers?.filter(u => u.role === 'manager') || [], [allUsers]);

  // Fetch reports for manager or superadmin
  const isManagerViewer = profile?.role === 'manager';
  const isSuperAdminViewer = profile?.role === 'super_admin';
  const { 
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
  } = useDailyReportsQuery(
    { // Args for fetchDailyReports
      managerId: isManagerViewer ? profile.id : undefined,
    },
    { // Options for useQuery
      enabled: (isManagerViewer || isSuperAdminViewer) && !authLoading && !!profile 
    }
  );

  const { register, handleSubmit, control, watch, formState: { errors }, reset, setValue } = useForm<DailyReportFormData>({
    resolver: zodResolver(dailyReportFormSchema),
    defaultValues: {
      report_date: new Date().toISOString().split('T')[0], // Today's date
      team_type: undefined, // User must select
      // metrics will be set based on team_type selection
    },
  });

  const watchedTeamType = watch("team_type");

  useEffect(() => {
    // Reset metric fields when team type changes
    if (watchedTeamType) {
      setSelectedTeamType(watchedTeamType);
      // Set default values for metrics based on team type for better UX
      // These will be overridden by user input
      switch (watchedTeamType) {
        case 'telesales':
          setValue('outreach_count', 0 as any); // RHF needs any here for discriminated union
          setValue('responses_count', 0 as any);
          break;
        case 'linkedin':
          setValue('outreach_count', 0 as any);
          setValue('responses_count', 0 as any);
          setValue('comments_done', 0 as any);
          setValue('content_posted', false as any);
          break;
        case 'cold_email':
          setValue('emails_sent', 0 as any);
          setValue('responses_count', 0 as any);
          break;
      }
    }
  }, [watchedTeamType, setValue]);
  
  const mutation = useMutation(saveDailyReport, {
    onSuccess: () => {
      toast.success('Daily report submitted successfully!');
      reset(); // Reset form after successful submission
      setSelectedTeamType('');
      setValue('team_type', undefined as any);
      queryClient.invalidateQueries(['daily_reports']); // Invalidate queries for managers/admins if they view reports
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit report: ${error.message}`);
    },
  });

  const onSubmit: SubmitHandler<DailyReportFormData> = (formData) => {
    if (!profile || !profile.id || profile.role !== 'agent') {
      toast.error('You must be an agent to submit a report.');
      return;
    }
    if (!profile.manager_id) {
        toast.error('Your profile is missing a manager assignment. Please contact an admin.');
        return;
    }

    const reportToSave: Omit<DailyReport, 'id' | 'created_at' | 'updated_at'> = {
      agent_id: profile.id,
      manager_id: profile.manager_id,
      report_date: formData.report_date,
      team_type: formData.team_type,
      ...(formData.team_type === 'telesales' && { outreach_count: formData.outreach_count, responses_count: formData.responses_count }),
      ...(formData.team_type === 'linkedin' && { outreach_count: formData.outreach_count, responses_count: formData.responses_count, comments_done: formData.comments_done, content_posted: formData.content_posted }),
      ...(formData.team_type === 'cold_email' && { emails_sent: formData.emails_sent, responses_count: formData.responses_count }),
    } as Omit<DailyReport, 'id' | 'created_at' | 'updated_at'>; // Type assertion 
    
    mutation.mutate(reportToSave);
  };

  // Filtered reports logic needs to adapt to Date objects
  const filteredReports = useMemo(() => {
    if (!reportsData || !profile) return [];
    return reportsData.filter(report => {
      const reportDate = new Date(report.report_date); // This is already a Date
      
      // Adjust comparison for Date objects
      if (dateFrom && reportDate < dateFrom) return false;
      // For dateTo, compare against the end of the selected day
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (reportDate > endOfDay) return false;
      }

      // Check filters against ALL_VALUE
      if (selectedAgentId !== ALL_VALUE && report.agent_id !== selectedAgentId) return false;
      if (isSuperAdminViewer && selectedManagerId !== ALL_VALUE && report.manager_id !== selectedManagerId) return false;
      if (filterTeamType !== ALL_VALUE && report.team_type !== filterTeamType) return false;

      return true;
    });
    // Update dependencies for useMemo
  }, [reportsData, dateFrom, dateTo, selectedAgentId, selectedManagerId, filterTeamType, profile, isSuperAdminViewer]);

  if (authLoading) return <div className="p-6 text-center">Loading user profile...</div>;
  if (!profile) return <div className="p-6 text-center">Please login to access this page.</div>;

  // Manager and Superadmin Views
  if (isManagerViewer || isSuperAdminViewer) {
    if (reportsLoading) return <div className="p-6 text-center">Loading reports...</div>;
    if (reportsError) return <div className="p-6 text-center text-destructive">Error loading reports: {reportsError.message}</div>;

    return (
      <div className="container mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">
          {isManagerViewer ? "Your Team's Daily Reports" : "All Daily Reports"}
        </h1>

        {/* --- Filter Controls --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8 p-5 border rounded-lg bg-card shadow-sm">
          {/* Date From - Use DatePicker */}
          <div className="space-y-1.5">
            <label htmlFor="dateFromTrigger" className="flex items-center text-sm font-medium text-muted-foreground">
              <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
              Date From
            </label>
            {/* The DatePicker itself doesn't need an ID for the label, the trigger button inside does implicitly */}
            <DatePicker date={dateFrom} setDate={setDateFrom} />
          </div>
          {/* Date To - Use DatePicker */}
          <div className="space-y-1.5">
            <label htmlFor="dateToTrigger" className="flex items-center text-sm font-medium text-muted-foreground">
              <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
              Date To
            </label>
            <DatePicker date={dateTo} setDate={setDateTo} />
          </div>
          {/* Agent Filter */}
          <div className="space-y-1.5">
            <label htmlFor="agentFilter" className="flex items-center text-sm font-medium text-muted-foreground">
              <User className="w-4 h-4 mr-2 text-muted-foreground" />
              Agent
            </label>
            <Select value={selectedAgentId} onValueChange={(value: string) => setSelectedAgentId(value)}>
              <SelectTrigger id="agentFilter" className="h-9"><SelectValue placeholder="All Agents" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Agents</SelectItem>
                {agents.map(agent => (
                  agent.id ? (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name || agent.email}
                    </SelectItem>
                  ) : null 
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Manager Filter (Super Admin only) */}
          {isSuperAdminViewer && (
            <div className="space-y-1.5">
              <label htmlFor="managerFilter" className="flex items-center text-sm font-medium text-muted-foreground">
                <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                Manager
              </label>
              <Select value={selectedManagerId} onValueChange={(value: string) => setSelectedManagerId(value)}>
                <SelectTrigger id="managerFilter" className="h-9"><SelectValue placeholder="All Managers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Managers</SelectItem>
                  {managers.map(manager => (
                    manager.id ? (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name || manager.email}
                      </SelectItem>
                    ) : null 
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Team Filter */}
          <div className="space-y-1.5">
            <label htmlFor="teamFilter" className="flex items-center text-sm font-medium text-muted-foreground">
              <ListFilter className="w-4 h-4 mr-2 text-muted-foreground" />
              Team
            </label>
            <Select value={filterTeamType} onValueChange={(value: string) => setFilterTeamType(value as TeamType | typeof ALL_VALUE)}>
              <SelectTrigger id="teamFilter" className="h-9"><SelectValue placeholder="All Teams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Types</SelectItem>
                <SelectItem value="telesales">Telesales</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="cold_email">Cold Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DailyReportsDisplay reports={filteredReports || []} currentUserProfile={profile} />
      </div>
    );
  }

  // Agent View (Report Submission Form)
  if (profile.role === 'agent') {
    // Conditional rendering for agent form if manager_id is missing
    if (!profile.manager_id) {
        return (
            <div className="container mx-auto p-4 sm:p-6 max-w-2xl text-center">
                <h1 className="text-2xl font-bold mb-6 text-foreground">Submit Daily Report</h1>
                <p className="text-destructive bg-destructive/10 p-4 rounded-md">
                    Your profile is missing a manager assignment. 
                    Please contact an administrator to be assigned to a manager before submitting reports.
                </p>
            </div>
        );
    }

    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-foreground">Submit Daily Report</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 sm:p-8 rounded-lg shadow-lg border border-border">
          <Controller
            name="report_date"
            control={control}
            render={({ field }) => (
              <InputField
                type="date"
                label="Report Date"
                id="report_date"
                {...field}
                error={(errors.report_date as any)?.message}
                className="mt-1"
              />
            )}
          />

          <Controller
            name="team_type"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Team Type"
                id="team_type"
                {...field}
                options={[
                  { value: 'telesales', label: 'Telesales' },
                  { value: 'linkedin', label: 'LinkedIn' },
                  { value: 'cold_email', label: 'Cold Email' },
                ]}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const value = e.target.value as TeamType;
                  field.onChange(value);
                  setSelectedTeamType(value); 
                }}
                value={field.value || ''}
                error={(errors.team_type as any)?.message}
                className="mt-1"
              />
            )}
          />

          {/* Dynamic fields based on selectedTeamType */}
          {selectedTeamType === 'telesales' && (
            <>
              <Controller
                name="outreach_count"
                control={control}
                render={({ field }) => (
                  <InputField
                    type="number"
                    label="Total People Outreached"
                    id="outreach_count_ts"
                    {...field}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    error={(errors as any).outreach_count as any}
                    className="mt-1"
                  />
                )}
              />
              <Controller
                name="responses_count"
                control={control}
                render={({ field }) => (
                  <InputField
                    type="number"
                    label="Total Responses Gotten"
                    id="responses_count_ts"
                    {...field}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    error={(errors as any).responses_count as any}
                    className="mt-1"
                  />
                )}
              />
            </>
          )}

          {selectedTeamType === 'linkedin' && (
            <>
              <Controller
                name="outreach_count"
                control={control}
                render={({ field }) => (
                  <InputField
                    type="number"
                    label="Total People Outreached"
                    id="outreach_count_li"
                    {...field}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    error={(errors as any).outreach_count as any}
                    className="mt-1"
                  />
                )}
              />
              <Controller
                name="responses_count"
                control={control}
                render={({ field }) => (
                  <InputField
                    type="number"
                    label="Total Responses Gotten"
                    id="responses_count_li"
                    {...field}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    error={(errors as any).responses_count as any}
                    className="mt-1"
                  />
                )}
              />
              <Controller
                name="comments_done"
                control={control}
                render={({ field }) => (
                  <InputField
                    type="number"
                    label="Total Comments Done"
                    id="comments_done"
                    {...field}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    error={(errors as any).comments_done as any}
                    className="mt-1"
                  />
                )}
              />
              <div className="flex items-center space-x-2 mt-4 mb-4">
                <Controller
                  name="content_posted"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      id="content_posted"
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  )}
                />
                <label htmlFor="content_posted" className="text-sm font-medium text-gray-700">
                  Content Posted?
                </label>
                {((errors as any).content_posted as any) && (
                  <p className="text-sm text-destructive mt-1">{((errors as any).content_posted as any).message}</p>
                )}
              </div>
            </>
          )}

          {selectedTeamType === 'cold_email' && (
            <>
              <Controller
                name="emails_sent"
                control={control}
                render={({ field }) => (
                  <InputField
                    type="number"
                    label="Number of Emails Sent"
                    id="emails_sent"
                    {...field}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    error={(errors as any).emails_sent as any}
                    className="mt-1"
                  />
                )}
              />
              <Controller
                name="responses_count"
                control={control}
                render={({ field }) => (
                  <InputField
                    type="number"
                    label="Number of Responses Gotten"
                    id="responses_count_ce"
                    {...field}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    error={(errors as any).responses_count as any}
                    className="mt-1"
                  />
                )}
              />
            </>
          )}
          
          {selectedTeamType && (
              <Button type="submit" disabled={mutation.isLoading} className="w-full">
              {mutation.isLoading ? 'Submitting...' : 'Submit Report'}
              </Button>
          )}
        </form>
      </div>
    );
  }
  return <div className="p-6 text-center">You do not have access to this page.</div>;
};

export default DailyReportPage; 