// src/types/index.ts

// User profile structure (mirroring AuthContext and public.users)
export interface UserProfile {
  id: string;
  email?: string;
  role?: 'agent' | 'manager' | 'super_admin';
  full_name?: string;
  manager_id?: string | null;
  // other fields from your public.users table
}

// Client structure (mirroring public.clients)
export interface Client {
  id: string;
  client_name: string;
  company?: string | null;
  industry?: string | null;
  location?: string | null;
  phone?: string | null;
  physical_meeting_info?: string | null;
  expected_value?: number | null;
  created_at: string;
  updated_at: string;
  company_size?: number | null;
  email?: string | null;
}

// Lead engagement structure (mirroring public.leads and joined data)
export interface Lead {
  id: string;
  client_id: string;
  agent_id: string | null;
  status_bucket: 'P1' | 'P2' | 'P3';
  progress_details: string | null;
  next_step: string | null;
  lead_source: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  deal_value: number | null;
  tags: string[] | null;
  follow_up_due_date: string | null;
  notes: string | null;
  industry: string | null;
  
  // NEW CRM ENHANCEMENT FIELDS
  lead_score?: number;
  qualification_status?: 'unqualified' | 'marketing_qualified' | 'sales_qualified' | 'opportunity';
  pipeline_stage_id?: string;
  expected_close_date?: string;
  win_probability?: number;
  lost_reason?: string;
  
  // ENHANCED SOURCE TRACKING
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer_url?: string;
  first_touch_date?: string;
  last_touch_date?: string;
  
  created_at: string;
  updated_at: string;
  sync_lock: boolean;
  clients?: Client;
  users?: UserProfile;
  pipeline_stages?: PipelineStage;
}

// NEW CRM TYPES

// Pipeline Management
export interface PipelineStage {
  id: string;
  name: string;
  description?: string | null;
  order_position: number;
  probability: number;
  is_active: boolean;
  color_code: string;
  created_at: string;
  updated_at: string;
}

// Lead Activities & Timeline
export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: 'email' | 'call' | 'meeting' | 'note' | 'status_change' | 'document' | 'task' | 'demo';
  subject?: string | null;
  description?: string | null;
  activity_date: string;
  created_by: string;
  metadata: Record<string, any>;
  is_automated: boolean;
  created_at: string;
  updated_at: string;
  users?: Pick<UserProfile, 'full_name'>;
}

// Lead Scoring
export interface LeadScoringCriteria {
  id: string;
  name: string;
  category: 'demographic' | 'behavioral' | 'engagement' | 'firmographic';
  condition_field: string;
  condition_operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  condition_value: string;
  score_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Lead Nurturing
export interface NurtureSequence {
  id: string;
  name: string;
  description?: string | null;
  trigger_conditions: Record<string, any>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  nurture_steps?: NurtureStep[];
}

export interface NurtureStep {
  id: string;
  sequence_id: string;
  step_order: number;
  name: string;
  delay_days: number;
  action_type: 'email' | 'task' | 'call' | 'sms' | 'notification';
  content?: string | null;
  template_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NurtureEnrollment {
  id: string;
  lead_id: string;
  sequence_id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  enrolled_at: string;
  completed_at?: string | null;
  next_action_date?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
  nurture_sequences?: NurtureSequence;
  leads?: Lead;
}

// EXISTING TYPES (keeping your original ones)

export interface FollowUp {
  id: string;
  lead_id: string;
  agent_id: string;
  due_date: string;
  status: 'Pending' | 'Completed' | 'Rescheduled' | 'Cancelled';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  leads?: Lead | null;
  users?: Pick<UserProfile, 'full_name'> | null;
}

export interface Meeting {
  id: string;
  lead_id: string | null;
  agent_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: 'Scheduled' | 'Completed' | 'Pending' | 'Cancelled';
  location?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  leads?: Lead | null;
  users?: Pick<UserProfile, 'full_name'> | null;
}

// --- Daily Report Types ---
export type TeamType = 'telesales' | 'linkedin' | 'cold_email';

export interface BaseDailyReport {
  id?: string;
  agent_id: string;
  manager_id: string | null;
  report_date: string;
  team_type: TeamType;
  created_at?: string;
  updated_at?: string;
}

export interface TelesalesDailyReport extends BaseDailyReport {
  team_type: 'telesales';
  outreach_count: number;
  responses_count: number;
}

export interface LinkedInDailyReport extends BaseDailyReport {
  team_type: 'linkedin';
  outreach_count: number;
  responses_count: number;
  comments_done: number;
  content_posted: boolean;
}

export interface ColdEmailDailyReport extends BaseDailyReport {
  team_type: 'cold_email';
  emails_sent: number;
  responses_count: number;
}

export type DailyReport = TelesalesDailyReport | LinkedInDailyReport | ColdEmailDailyReport;

// --- Attendance Types ---
export type AttendanceStatus = 'CheckedOut' | 'CheckedIn' | 'OnLeave';

export interface Attendance {
  id: string;
  user_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  users?: Pick<UserProfile, 'full_name' | 'email'> | null;
}