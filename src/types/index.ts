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

// Notification system types
export type NotificationType = 
  | 'follow_up_reminder' 
  | 'meeting_reminder' 
  | 'overdue_follow_up' 
  | 'upcoming_meeting' 
  | 'lead_update' 
  | 'system_alert';

export type DeliveryMethod = 'in_app' | 'email' | 'browser_push' | 'sound';

export type SoundType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: 'follow_up' | 'meeting' | 'lead' | 'system';
  entity_id?: string;
  is_read: boolean;
  notification_date: string;
  scheduled_for?: string;
  delivery_method: DeliveryMethod[];
  metadata: {
    sound_type?: SoundType;
    due_date?: string;
    start_time?: string;
    client_name?: string;
    title?: string;
    location?: string;
    notes?: string;
    days_overdue?: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  enabled: boolean;
  reminder_minutes: number[];
  delivery_methods: DeliveryMethod[];
  email_enabled: boolean;
  browser_push_enabled: boolean;
  sound_enabled: boolean;
  sound_type: SoundType;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  [key: string]: NotificationPreferences;
}

// Todo System Types
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  due_date?: string | null;
  category?: string | null;
  tags: string[];
  order_position: number;
  assigned_by?: string | null;
  is_team_task: boolean;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  users?: Pick<UserProfile, 'id' | 'full_name' | 'email'>;
  assigned_by_user?: Pick<UserProfile, 'id' | 'full_name' | 'email'>;
  comments?: TodoComment[];
  attachments?: TodoAttachment[];
  comments_count?: number;
  attachments_count?: number;
}

export interface TodoComment {
  id: string;
  todo_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  
  // Joined data
  users?: Pick<UserProfile, 'id' | 'full_name' | 'email'>;
}

export interface TodoAttachment {
  id: string;
  todo_id: string;
  filename: string;
  file_url: string;
  file_size?: number | null;
  uploaded_by: string;
  created_at: string;
  
  // Joined data
  uploaded_by_user?: Pick<UserProfile, 'id' | 'full_name' | 'email'>;
}

// Create/Update interfaces
export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: TodoPriority;
  due_date?: string;
  category?: string;
  tags?: string[];
  user_id?: string; // For managers/admins assigning to others
  is_team_task?: boolean;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  due_date?: string;
  category?: string;
  tags?: string[];
  order_position?: number;
}

export interface CreateTodoCommentData {
  todo_id: string;
  comment: string;
}

export interface TodoFilters {
  status?: TodoStatus[];
  priority?: TodoPriority[];
  category?: string[];
  tags?: string[];
  assigned_by?: string[];
  user_id?: string[];
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
  is_overdue?: boolean;
  is_team_task?: boolean;
}

export interface TodoSortOptions {
  field: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'title' | 'order_position';
  direction: 'asc' | 'desc';
}

// Permission and access control
export interface TodoPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canComment: boolean;
  canAttach: boolean;
}

// Analytics and stats
export interface TodoStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  due_today: number;
  due_this_week: number;
  completion_rate: number;
}

export interface TeamTodoStats extends TodoStats {
  by_user: Record<string, TodoStats>;
  by_priority: Record<TodoPriority, number>;
  by_category: Record<string, number>;
}

// Drag and drop
export interface TodoDragItem {
  id: string;
  index: number;
  status: TodoStatus;
}

// Real-time collaboration
export interface TodoActivity {
  id: string;
  todo_id: string;
  user_id: string;
  action: 'created' | 'updated' | 'completed' | 'commented' | 'attached' | 'assigned';
  details: Record<string, any>;
  created_at: string;
  
  // Joined data
  users?: Pick<UserProfile, 'id' | 'full_name' | 'email'>;
}

// Bulk operations
export interface BulkTodoOperation {
  action: 'update_status' | 'update_priority' | 'delete' | 'assign' | 'add_tags' | 'remove_tags';
  todo_ids: string[];
  data?: Record<string, any>;
}

// Templates and recurring todos
export interface TodoTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  category?: string;
  tags: string[];
  created_by: string;
  is_public: boolean;
  created_at: string;
}

export interface RecurringTodo {
  id: string;
  template_id: string;
  user_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval_value: number;
  next_due_date: string;
  is_active: boolean;
  created_at: string;
}