import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../api/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DailyReport, TeamType } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CalendarDays, User, Users, ListFilter } from 'lucide-react';
import { DatePicker } from '../components/ui/date-picker';
import DailyReportsDisplay from '../components/admin/DailyReportsDisplay';
import { useDailyReportsQuery } from '../hooks/queries/useDailyReportsQuery';
import { useUsersQuery } from '../hooks/queries/useUsersQuery';

const ALL_VALUE = "__ALL__";

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

const dailyReportFormSchema = z.discriminatedUnion("team_type", [
  z.object({ ...baseReportSchema, team_type: z.literal('telesales'), ...telesalesMetricsSchema.shape, emails_sent: z.number().optional(), comments_done: z.number().optional(), content_posted: z.boolean().optional() }),
  z.object({ ...baseReportSchema, team_type: z.literal('linkedin'), ...linkedInMetricsSchema.shape, emails_sent: z.number().optional() }),
  z.object({ ...baseReportSchema, team_type: z.literal('cold_email'), ...coldEmailMetricsSchema.shape, outreach_count: z.number().optional(), comments_done: z.number().optional(), content_posted: z.boolean().optional() }),
]);

type DailyReportFormData = z.infer<typeof dailyReportFormSchema>;

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
  const [selectedTeamType, setSelectedTeamType] = useState<TeamType | ''>('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [selectedAgentId, setSelectedAgentId] = useState(ALL_VALUE);
  const [selectedManagerId, setSelectedManagerId] = useState(ALL_VALUE);
  const [filterTeamType, setFilterTeamType] = useState<TeamType | typeof ALL_VALUE>(ALL_VALUE);

  const { data: allUsers } = useUsersQuery({});
  const agents = useMemo(() => allUsers?.filter(u => u.role === 'agent') || [], [allUsers]);
  const managers = useMemo(() => allUsers?.filter(u => u.role === 'manager') || [], [allUsers]);

  const isManagerViewer = profile?.role === 'manager';
  const isSuperAdminViewer = profile?.role === 'super_admin';
  const { data: reportsData, isLoading: reportsLoading, error: reportsError } = useDailyReportsQuery(
    { managerId: isManagerViewer ? profile.id : undefined },
    { enabled: (isManagerViewer || isSuperAdminViewer) && !authLoading && !!profile }
  );

  const { handleSubmit, control, watch, formState: { errors }, reset, setValue } = useForm<DailyReportFormData>({
    resolver: zodResolver(dailyReportFormSchema),
    defaultValues: {
      report_date: new Date().toISOString().split('T')[0],
      team_type: undefined,
    },
  });

  const watchedTeamType = watch("team_type");

  useEffect(() => {
    if (watchedTeamType) {
      setSelectedTeamType(watchedTeamType);
      switch (watchedTeamType) {
        case 'telesales':
          setValue('outreach_count', 0);
          setValue('responses_count', 0);
          break;
        case 'linkedin':
          setValue('outreach_count', 0);
          setValue('responses_count', 0);
          setValue('comments_done', 0);
          setValue('content_posted', false);
          break;
        case 'cold_email':
          setValue('emails_sent', 0);
          setValue('responses_count', 0);
          break;
      }
    }
  }, [watchedTeamType, setValue]);

  const mutation = useMutation(saveDailyReport, {
    onSuccess: () => {
      toast.success('Daily report submitted successfully!');
      reset();
      setSelectedTeamType('');
      queryClient.invalidateQueries(['daily_reports']);
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
      team_type: (formData.team_type ? formData.team_type : 'telesales') as "telesales" | "linkedin" | "cold_email",
      ...(formData.team_type === 'telesales' && { outreach_count: formData.outreach_count, responses_count: formData.responses_count }),
      ...(formData.team_type === 'linkedin' && { outreach_count: formData.outreach_count, responses_count: formData.responses_count, comments_done: formData.comments_done, content_posted: formData.content_posted }),
      ...(formData.team_type === 'cold_email' && { emails_sent: formData.emails_sent, responses_count: formData.responses_count }),
    } as any;

    mutation.mutate(reportToSave);
  };

  const filteredReports = useMemo(() => {
    if (!reportsData || !profile) return [];
    return reportsData.filter(report => {
      const reportDate = new Date(report.report_date);
      if (dateFrom && reportDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (reportDate > endOfDay) return false;
      }
      if (selectedAgentId !== ALL_VALUE && report.agent_id !== selectedAgentId) return false;
      if (isSuperAdminViewer && selectedManagerId !== ALL_VALUE && report.manager_id !== selectedManagerId) return false;
      if (filterTeamType !== ALL_VALUE && report.team_type !== filterTeamType) return false;
      return true;
    });
  }, [reportsData, dateFrom, dateTo, selectedAgentId, selectedManagerId, filterTeamType, profile, isSuperAdminViewer]);

  if (authLoading) return <div className="flex justify-center p-6 text-muted-foreground">Loading user profile...</div>;
  if (!profile) return <div className="flex justify-center p-6 text-muted-foreground">Please login to access this page.</div>;

  if (isManagerViewer || isSuperAdminViewer) {
    if (reportsLoading) return <div className="flex justify-center p-6 text-muted-foreground">Loading reports...</div>;
    if (reportsError) return <div className="flex justify-center p-6 text-destructive">Error loading reports: {reportsError.message}</div>;

    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="w-full bg-card text-card-foreground rounded-xl shadow-lg p-6 border border-border">
          <div className="border-b border-border pb-4">
            <h2 className="text-3xl font-bold text-foreground">
              {isManagerViewer ? "Your Team's Daily Reports" : "All Daily Reports"}
            </h2>
          </div>
          <div className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-muted-foreground">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  From
                </label>
                <DatePicker date={dateFrom} setDate={setDateFrom} />
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-muted-foreground">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  To
                </label>
                <DatePicker date={dateTo} setDate={setDateTo} />
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-muted-foreground">
                  <User className="w-4 h-4 mr-2" />
                  Agent
                </label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger className="w-full border-input bg-background rounded-lg text-foreground focus:ring-ring focus:border-ring">
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All Agents</SelectItem>
                    {agents.map(agent => (
                      agent.id && <SelectItem key={agent.id} value={agent.id}>{agent.full_name || agent.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isSuperAdminViewer && (
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    Manager
                  </label>
                  <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                    <SelectTrigger className="w-full border-input bg-background rounded-lg text-foreground focus:ring-ring focus:border-ring">
                      <SelectValue placeholder="All Managers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>All Managers</SelectItem>
                      {managers.map(manager => (
                        manager.id && <SelectItem key={manager.id} value={manager.id}>{manager.full_name || manager.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-muted-foreground">
                  <ListFilter className="w-4 h-4 mr-2" />
                  Team
                </label>
                <Select value={filterTeamType} onValueChange={setFilterTeamType as any}>
                  <SelectTrigger className="w-full border-input bg-background rounded-lg text-foreground focus:ring-ring focus:border-ring">
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
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
        </div>
      </div>
    );
  }

  if (profile.role === 'agent') {
    if (!profile.manager_id) {
      return (
        <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
          <div className="w-full bg-card text-card-foreground rounded-xl shadow-lg p-6 border border-border">
            <h2 className="text-3xl font-bold text-center text-foreground">Submit Daily Report</h2>
            <div className="text-center mt-6">
              <p className="text-destructive-foreground bg-destructive/10 p-4 rounded-lg">
                Your profile is missing a manager assignment. Please contact an administrator to be assigned to a manager before submitting reports.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
        <div className="w-full bg-card text-card-foreground rounded-xl shadow-lg p-6 border border-border">
          <h2 className="text-3xl font-bold text-center text-foreground">Submit Daily Report</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="report_date" className="text-sm font-medium text-muted-foreground">Report Date</label>
                <Controller
                  name="report_date"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      id="report_date"
                      {...field}
                      className={`bg-background text-foreground ${errors.report_date ? 'border-destructive' : 'border-input focus:border-ring focus:ring-ring'}`}
                    />
                  )}
                />
                {errors.report_date && <p className="text-sm text-destructive">{errors.report_date.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="team_type" className="text-sm font-medium text-muted-foreground">Team Type</label>
                <Controller
                  name="team_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => {
                        field.onChange(value as TeamType);
                        setSelectedTeamType(value as TeamType);
                      }}
                    >
                      <SelectTrigger id="team_type" className={`bg-background text-foreground ${errors.team_type ? 'border-destructive' : 'border-input focus:border-ring focus:ring-ring'}`}>
                        <SelectValue placeholder="Select Team Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="telesales">Telesales</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="cold_email">Cold Email</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.team_type && <p className="text-sm text-destructive">{errors.team_type.message}</p>}
              </div>

              {selectedTeamType === 'telesales' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="outreach_count_ts" className="text-sm font-medium text-muted-foreground">Total People Outreached</label>
                    <Controller
                      name="outreach_count"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          id="outreach_count_ts"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          className={`bg-background text-foreground ${errors.outreach_count ? 'border-destructive' : 'border-input focus:border-ring focus:ring-ring'}`}
                        />
                      )}
                    />
                    {errors.outreach_count && <p className="text-sm text-destructive">{errors.outreach_count.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="responses_count_ts" className="text-sm font-medium text-muted-foreground">Total Responses Gotten</label>
                    <Controller
                      name="responses_count"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          id="responses_count_ts"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          className={`bg-background text-foreground ${errors.responses_count ? 'border-destructive' : 'border-input focus:border-ring focus:ring-ring'}`}
                        />
                      )}
                    />
                    {errors.responses_count && <p className="text-sm text-destructive">{errors.responses_count.message}</p>}
                  </div>
                </>
              )}

              {selectedTeamType === 'linkedin' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="outreach_count_li" className="text-sm font-medium text-muted-foreground">Total People Outreached</label>
                    <Controller
                      name="outreach_count"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          id="outreach_count_li"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          className={`bg-background text-foreground ${errors.outreach_count ? 'border-destructive' : 'border-input focus:border-ring focus:ring-ring'}`}
                        />
                      )}
                    />
                    {errors.outreach_count && <p className="text-sm text-destructive">{errors.outreach_count.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="responses_count_li" className="text-sm font-medium text-muted-foreground">Total Responses Gotten</label>
                    <Controller
                      name="responses_count"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          id="responses_count_li"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          className={`bg-background text-foreground ${errors.responses_count ? 'border-destructive' : 'border-input focus:border-ring focus:ring-ring'}`}
                        />
                      )}
                    />
                    {errors.responses_count && <p className="text-sm text-destructive">{errors.responses_count.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="comments_done" className="text-sm font-medium text-muted-foreground">Total Comments Done</label>
                    <Controller
                      name="comments_done"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          id="comments_done"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          className={`bg-background text-foreground ${errors.comments_done ? 'border-destructive' : 'border-input focus:border-ring focus:ring-ring'}`}
                        />
                      )}
                    />
                    {errors.comments_done && <p className="text-sm text-destructive">{errors.comments_done.message}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="content_posted"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          id="content_posted"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4 border-input bg-background rounded text-primary focus:ring-ring"
                        />
                      )}
                    />
                    <label htmlFor="content_posted" className="text-sm font-medium text-muted-foreground">
                      Content Posted?
                    </label>
                    {errors.content_posted && <p className="text-sm text-destructive">{errors.content_posted.message}</p>}
                  </div>
                </>
              )}

              {selectedTeamType === 'cold_email' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="emails_sent" className="text-sm font-medium text-muted-foreground">Number of Emails Sent</label>
                    <Controller
                      name="emails_sent"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          id="emails_sent"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          className={`bg-background text-foreground ${errors.emails_sent ? 'border-destructive' : 'border-input focus:border-ring focus:ring-ring'}`}
                        />
                      )}
                    />
                    {errors.emails_sent && <p className="text-sm text-destructive">{errors.emails_sent.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="responses_count_ce" className="text-sm font-medium text-muted-foreground">Number of Responses Gotten</label>
                    <Controller
                      name="responses_count"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          id="responses_count_ce"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          className={`bg-background text-foreground ${errors.responses_count ? 'border-destructive' : 'border-input focus:border-ring focus:ring-ring'}`}
                        />
                      )}
                    />
                    {errors.responses_count && <p className="text-sm text-destructive">{errors.responses_count.message}</p>}
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={mutation.isLoading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                {mutation.isLoading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return <div className="flex justify-center p-6 text-muted-foreground">You do not have access to this page.</div>;
};

export default DailyReportPage;