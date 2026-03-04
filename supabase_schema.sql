-- DIGITAL STRATEGY CLIENT COMMAND PORTAL SCHEMA

-- 1. Profiles (Extends Auth.Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  company_name TEXT,
  role TEXT CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Client Engagements
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  industry TEXT,
  engagement_start DATE DEFAULT CURRENT_DATE,
  engagement_status TEXT CHECK (engagement_status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Maturity Scores
CREATE TABLE maturity_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 5),
  assessed_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Strategy Roadmap Phases
CREATE TABLE roadmap_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Key Performance Indicators (KPIs)
CREATE TABLE kpis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('marketing', 'sales', 'financial')),
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  target NUMERIC,
  unit TEXT,
  recorded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Documents
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  category TEXT CHECK (category IN ('strategy', 'report', 'contract', 'other')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tasks
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date DATE,
  assignee TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Activity Log
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('meeting', 'note', 'milestone', 'update')),
  title TEXT NOT NULL,
  body TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES ---

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE maturity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY admin_full_access_profiles ON profiles FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY client_read_own_profile ON profiles FOR SELECT TO authenticated 
USING (auth.uid() = id);

-- 2. Clients
CREATE POLICY admin_full_access_clients ON clients FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY client_read_own_engagement ON clients FOR SELECT TO authenticated 
USING (profile_id = auth.uid());

-- 3. Maturity Scores
CREATE POLICY admin_full_access_maturity ON maturity_scores FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY client_read_own_maturity ON maturity_scores FOR SELECT TO authenticated 
USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

-- 4. Roadmap Phases
CREATE POLICY admin_full_access_roadmap ON roadmap_phases FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY client_read_own_roadmap ON roadmap_phases FOR SELECT TO authenticated 
USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

-- 5. KPIs
CREATE POLICY admin_full_access_kpis ON kpis FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY client_read_own_kpis ON kpis FOR SELECT TO authenticated 
USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

-- 6. Documents
CREATE POLICY admin_full_access_documents ON documents FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY client_read_own_documents ON documents FOR SELECT TO authenticated 
USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

-- 7. Tasks
CREATE POLICY admin_full_access_tasks ON tasks FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY client_read_own_tasks ON tasks FOR SELECT TO authenticated 
USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

-- 8. Activity Log
CREATE POLICY admin_full_access_activity ON activity_log FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY client_read_own_activity ON activity_log FOR SELECT TO authenticated 
USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

-- STORAGE POLICIES (for 'documents' bucket) --

-- Allow admins full access to all storage objects
CREATE POLICY admin_full_storage_access ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'documents' AND (auth.jwt() ->> 'role' = 'admin'));

-- Allow clients to view/download their own documents
-- (Note: We use signed URLs in the app, but this adds a second layer of security)
CREATE POLICY client_read_own_storage ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM clients WHERE profile_id = auth.uid()
));
