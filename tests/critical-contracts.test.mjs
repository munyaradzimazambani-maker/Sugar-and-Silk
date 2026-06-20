import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin RLS uses profile-backed role checks and provisions private documents storage', () => {
  const schema = read('supabase_schema.sql');

  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /FROM profiles\s+WHERE id = auth\.uid\(\)\s+AND role = 'admin'/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);

  for (const policy of [
    'admin_full_access_profiles',
    'admin_full_access_clients',
    'admin_full_access_maturity',
    'admin_full_access_roadmap',
    'admin_full_access_kpis',
    'admin_full_access_documents',
    'admin_full_access_tasks',
    'admin_full_access_activity',
    'admin_full_storage_access',
  ]) {
    assert.match(schema, new RegExp(`CREATE POLICY ${policy}[\\s\\S]*public\\.is_admin\\(\\)`));
  }

  assert.match(schema, /profile_id UUID NOT NULL UNIQUE REFERENCES profiles\(id\) ON DELETE CASCADE/);
  assert.match(schema, /INSERT INTO storage\.buckets \(id, name, public\)\s+VALUES \('documents', 'documents', false\)/);
  assert.match(schema, /ON CONFLICT \(id\) DO UPDATE SET public = false/);
});

test('admin client pages use profile-backed company names and stable route params', () => {
  const listPage = read('app/(portal)/admin/page.tsx');
  const detailPage = read('app/(portal)/admin/clients/[id]/page.tsx');
  const dashboardPage = read('app/(portal)/dashboard/page.tsx');

  assert.match(listPage, /\.select\('.*profiles:profile_id\(id, full_name, company_name\)'.*\)/);
  assert.doesNotMatch(listPage, /\.from\('clients'\)[\s\S]{0,160}\.order\('company_name'/);
  assert.match(listPage, /profile_id: newClient\.profile_id/);
  assert.doesNotMatch(listPage, /\.insert\(newClient\)/);

  assert.match(detailPage, /useParams<\{ id: string \}>\(\)/);
  assert.doesNotMatch(detailPage, /function AdminClientDetailPage\(\{ params \}/);
  assert.doesNotMatch(detailPage, /params\.id/);
  assert.match(detailPage, /profiles:profile_id\(id, full_name, company_name\)/);

  assert.match(dashboardPage, /profile\?\.company_name \|\| 'your organization'/);
  assert.doesNotMatch(dashboardPage, /client\?\.company_name \|\| 'your organization'/);
});

test('document upload rolls back storage when metadata insert fails', () => {
  const detailPage = read('app/(portal)/admin/clients/[id]/page.tsx');

  assert.match(detailPage, /crypto\.randomUUID\(\)/);
  assert.match(detailPage, /const \{ error: dbError \} = await supabase[\s\S]*\.from\('documents'\)[\s\S]*\.insert\(/);
  assert.match(detailPage, /if \(dbError\) \{[\s\S]*await supabase\.storage\.from\('documents'\)\.remove\(\[filePath\]\);[\s\S]*return;/);
  assert.match(detailPage, /setUploadError\('Upload failed while saving document metadata\. The file was not kept\.'\)/);
});

test('demo credentials are hidden unless explicitly enabled', () => {
  const loginPage = read('app/(auth)/login/page.tsx');

  assert.match(loginPage, /NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === 'true'/);
  assert.match(loginPage, /\{showDemoCredentials && \(/);
  assert.match(loginPage, /admin@pcm\.com/);
  assert.match(loginPage, /client@techflow\.com/);
});
