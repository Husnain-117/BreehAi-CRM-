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
  progress_details?: string | null;
  next_step?: string | null;
  sync_lock?: boolean | null;
  created_at: string;
  updated_at: string;
  clients?: {
    client_name: string;
    company?: string | null;
    company_size?: number | null;
  } | null;
  users?: Pick<UserProfile, 'full_name'> | null;
  lead_source?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  deal_value?: number | null;
  tags?: string[] | null;
  follow_up_due_date?: string | null;
}

// You can add more types here as needed for FollowUps, Meetings etc.
export interface FollowUp {
  id: string;
  lead_id: string;
  agent_id: string;
  due_date: string;
  status: 'Pending' | 'Completed' | 'Rescheduled' | 'Cancelled';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  leads?: Lead | null; // Optional joined lead data
  users?: Pick<UserProfile, 'full_name'> | null; // Optional joined agent data
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
  leads?: Lead | null; // Optional joined lead data
  users?: Pick<UserProfile, 'full_name'> | null; // Optional joined agent data
} 