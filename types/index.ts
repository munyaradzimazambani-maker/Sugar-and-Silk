export type UserRole = 'admin' | 'client';

export interface Profile {
  id: string;
  full_name: string;
  company_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Client {
  id: string;
  profile_id: string;
  industry: string;
  engagement_start: string;
  engagement_status: 'active' | 'paused' | 'completed';
  notes?: string;
  company_name?: string; // Joined from profile
}

export interface MaturityScore {
  id: string;
  client_id: string;
  dimension: string;
  score: number; // 1-5
  assessed_at: string;
  notes?: string;
}

export interface RoadmapPhase {
  id: string;
  client_id: string;
  phase_number: number;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  start_date: string;
  end_date: string;
}

export interface KPI {
  id: string;
  client_id: string;
  category: 'marketing' | 'sales' | 'financial';
  name: string;
  value: number;
  target: number;
  unit: string;
  recorded_at: string;
}

export interface Document {
  id: string;
  client_id: string;
  title: string;
  description: string;
  file_url: string;
  category: 'strategy' | 'report' | 'contract' | 'other';
  uploaded_at: string;
}

export interface Task {
  id: string;
  client_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  assignee: string;
}

export interface ActivityLog {
  id: string;
  client_id: string;
  type: 'meeting' | 'note' | 'milestone' | 'update';
  title: string;
  body: string;
  occurred_at: string;
  created_by: string;
}
