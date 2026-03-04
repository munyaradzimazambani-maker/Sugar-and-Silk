import { Profile, Client, MaturityScore, RoadmapPhase, KPI, Task, Document, ActivityLog } from '../types';

export const MOCK_PROFILES: Profile[] = [
    {
        id: 'admin-1',
        full_name: 'PCM Strategist',
        company_name: 'Antigravity Consulting',
        role: 'admin',
        created_at: new Date().toISOString(),
    },
    {
        id: 'client-1',
        full_name: 'John Doe',
        company_name: 'TechFlow Solutions',
        role: 'client',
        created_at: new Date().toISOString(),
    },
    {
        id: 'client-2',
        full_name: 'Sarah Smith',
        company_name: 'EcoRetailers Ltd',
        role: 'client',
        created_at: new Date().toISOString(),
    },
];

export const MOCK_CLIENTS: Client[] = [
    {
        id: 'client-1-id',
        profile_id: 'client-1',
        industry: 'Software & SaaS',
        engagement_start: '2024-01-15',
        engagement_status: 'active',
        company_name: 'TechFlow Solutions',
    },
    {
        id: 'client-2-id',
        profile_id: 'client-2',
        industry: 'Retail & E-commerce',
        engagement_start: '2024-02-01',
        engagement_status: 'active',
        company_name: 'EcoRetailers Ltd',
    },
];

export const MOCK_MATURITY_SCORES: MaturityScore[] = [
    { id: '1', client_id: 'client-1-id', dimension: 'SEO', score: 2, assessed_at: '2024-01-20' },
    { id: '2', client_id: 'client-1-id', dimension: 'Analytics', score: 4, assessed_at: '2024-01-20' },
    { id: '3', client_id: 'client-1-id', dimension: 'CRM', score: 1, assessed_at: '2024-01-20' },
    { id: '4', client_id: 'client-1-id', dimension: 'Automation', score: 3, assessed_at: '2024-01-20' },
    { id: '5', client_id: 'client-1-id', dimension: 'Paid Media', score: 2, assessed_at: '2024-01-20' },
    { id: '6', client_id: 'client-1-id', dimension: 'Strategy', score: 3, assessed_at: '2024-01-20' },
];

export const MOCK_ROADMAP: RoadmapPhase[] = [
    {
        id: 'p1',
        client_id: 'client-1-id',
        phase_number: 1,
        title: 'Audit & Analysis',
        description: 'Deep dive into current systems and performance.',
        status: 'completed',
        start_date: '2024-01-15',
        end_date: '2024-02-15',
    },
    {
        id: 'p2',
        client_id: 'client-1-id',
        phase_number: 2,
        title: 'Strategy Design',
        description: 'Creating the ROI-focused digital roadmap.',
        status: 'in_progress',
        start_date: '2024-02-16',
        end_date: '2024-03-30',
    },
    {
        id: 'p3',
        client_id: 'client-1-id',
        phase_number: 3,
        title: 'Implementation',
        description: 'Deploying systems and campaign structures.',
        status: 'not_started',
        start_date: '2024-04-01',
        end_date: '2024-06-30',
    },
];

export const MOCK_KPIS: KPI[] = [
    { id: 'k1', client_id: 'client-1-id', category: 'marketing', name: 'Leads', value: 450, target: 500, unit: 'leads', recorded_at: '2024-02-28' },
    { id: 'k2', client_id: 'client-1-id', category: 'marketing', name: 'Conversion Rate', value: 3.2, target: 4.5, unit: '%', recorded_at: '2024-02-28' },
    { id: 'k3', client_id: 'client-1-id', category: 'sales', name: 'Revenue', value: 125000, target: 150000, unit: 'ZAR', recorded_at: '2024-02-28' },
    { id: 'k4', client_id: 'client-1-id', category: 'financial', name: 'CAC', value: 320, target: 300, unit: 'ZAR', recorded_at: '2024-02-28' },
];

export const MOCK_TASKS: Task[] = [
    { id: 't1', client_id: 'client-1-id', title: 'Connect CRM to Analytics', description: 'Enable offline conversion tracking.', status: 'in_progress', priority: 'high', due_date: '2024-03-10', assignee: 'Consultant' },
    { id: 't2', client_id: 'client-1-id', title: 'Approve SEO Roadmap', description: 'Review the technical audit findings.', status: 'todo', priority: 'medium', due_date: '2024-03-05', assignee: 'Client' },
    { id: 't3', client_id: 'client-1-id', title: 'Initial Strategy Session', description: 'Kickoff meeting and goal alignment.', status: 'done', priority: 'high', due_date: '2024-01-20', assignee: 'Both' },
];

export const MOCK_DOCS: Document[] = [
    { id: 'd1', client_id: 'client-1-id', title: 'Engagement Contract', description: 'Signed scope of work.', file_url: '#', category: 'contract', uploaded_at: '2024-01-15T10:00:00Z' },
    { id: 'd2', client_id: 'client-1-id', title: 'Digital Audit Report', description: 'Initial findings from Q1 audit.', file_url: '#', category: 'report', uploaded_at: '2024-01-30T14:30:00Z' },
];

export const MOCK_ACTIVITY: ActivityLog[] = [
    { id: 'a1', client_id: 'client-1-id', type: 'meeting', title: 'Discovery Workshop', body: 'Identified core bottlenecks in lead flow.', occurred_at: '2024-01-18T09:00:00Z', created_by: 'admin-1' },
    { id: 'a2', client_id: 'client-1-id', type: 'milestone', title: 'Audit Complete', body: 'All digital assets audited and scored.', occurred_at: '2024-02-01T17:00:00Z', created_by: 'admin-1' },
];
