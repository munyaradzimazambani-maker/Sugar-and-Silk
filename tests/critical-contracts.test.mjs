import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const schema = read('supabase_schema.sql');
const adminListPage = read('app/(portal)/admin/page.tsx');
const adminDetailPage = read('app/(portal)/admin/clients/[id]/page.tsx');
const dashboardPage = read('app/(portal)/dashboard/page.tsx');

function tableDefinition(tableName) {
  const match = schema.match(new RegExp(`CREATE TABLE ${tableName} \\(([^;]+)\\);`, 's'));
  assert.ok(match, `Expected ${tableName} table definition to exist`);
  return match[1];
}

const clientsTable = tableDefinition('clients');

assert.match(
  schema,
  /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]+SECURITY DEFINER[\s\S]+FROM public\.profiles[\s\S]+role = 'admin'/,
  'Admin RLS must be backed by the server-controlled profiles.role value.'
);

assert.doesNotMatch(
  schema,
  /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
  'Admin RLS must not rely on Supabase JWT role, which is normally "authenticated".'
);

assert.match(
  schema,
  /CREATE POLICY admin_full_access_clients[\s\S]+USING \(public\.is_admin\(\)\)[\s\S]+WITH CHECK \(public\.is_admin\(\)\)/,
  'Admin client writes must use the profile-backed admin check for USING and WITH CHECK.'
);

assert.match(
  clientsTable,
  /profile_id UUID NOT NULL UNIQUE REFERENCES profiles\(id\) ON DELETE CASCADE/,
  'Each client engagement must be linked to exactly one profile so portal data is reachable.'
);

assert.doesNotMatch(
  clientsTable,
  /\bcompany_name\b/,
  'Company name belongs to profiles; clients should be joined through profile_id.'
);

assert.match(
  schema,
  /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]+VALUES \('documents', 'documents', false\)[\s\S]+ON CONFLICT \(id\) DO UPDATE SET public = false/,
  'The documents bucket must be created or forced private by the schema.'
);

assert.match(
  schema,
  /CREATE POLICY admin_full_storage_access[\s\S]+USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]+WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\)/,
  'Admin storage writes must use the same profile-backed admin check.'
);

assert.match(
  adminListPage,
  /\.select\('.*, profiles:profile_id\(full_name, company_name\)'\)/,
  'Admin client list must join profiles for display company names.'
);

assert.match(
  adminListPage,
  /profile_id: selectedProfileId/,
  'Admin onboarding must link engagements to an existing client profile.'
);

assert.doesNotMatch(
  adminListPage,
  /\.order\('company_name'/,
  'Admin client list must not order by a non-existent clients.company_name column.'
);

assert.match(
  adminDetailPage,
  /useParams<\{ id: string \}>\(\)/,
  'Next 16 client route pages must read dynamic params with useParams().'
);

assert.doesNotMatch(
  adminDetailPage,
  /function AdminClientDetailPage\(\{ params \}/,
  'Admin client detail must not read promised params synchronously from props.'
);

assert.match(
  adminDetailPage,
  /\.select\('.*, profiles:profile_id\(full_name, company_name\)'\)/,
  'Admin client detail must join profiles for display company names.'
);

assert.match(
  adminDetailPage,
  /crypto\.randomUUID\(\)/,
  'Document uploads should use collision-resistant object keys.'
);

assert.match(
  adminDetailPage,
  /if \(dbError\) \{[\s\S]+\.remove\(\[filePath\]\)/,
  'Document upload must remove the storage object if metadata insert fails.'
);

assert.match(
  dashboardPage,
  /profile\?\.company_name \|\| 'your organization'/,
  'Client dashboard must read the company name from profiles.'
);

console.log('Critical contract checks passed.');
