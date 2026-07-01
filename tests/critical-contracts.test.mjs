import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin RLS is backed by profiles.role instead of JWT role claims', () => {
  const schema = read('supabase_schema.sql');

  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /FROM public\.profiles/);
  assert.match(schema, /role = 'admin'/);
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
    assert.ok(schema.includes(`CREATE POLICY ${policy}`), `missing ${policy}`);
  }
});

test('client engagements must be linked to a profile and admin UI uses that relationship', () => {
  const schema = read('supabase_schema.sql');
  const adminList = read('app/(portal)/admin/page.tsx');
  const dashboard = read('app/(portal)/dashboard/page.tsx');

  assert.match(schema, /profile_id UUID NOT NULL UNIQUE REFERENCES profiles\(id\) ON DELETE CASCADE/);
  assert.ok(adminList.includes(".select('*, profiles(id, full_name, company_name)'"));
  assert.ok(adminList.includes("profile_id: ''"));
  assert.ok(adminList.includes('.insert(newClient)'));
  assert.doesNotMatch(adminList, /company_name:\s*''/);
  assert.doesNotMatch(dashboard, /client\?\.company_name/);
});

test('admin client detail uses Next route params safely and rolls back orphaned uploads', () => {
  const detail = read('app/(portal)/admin/clients/[id]/page.tsx');

  assert.ok(detail.includes("import { useParams } from 'next/navigation';"));
  assert.doesNotMatch(detail, /AdminClientDetailPage\(\{\s*params/);
  assert.doesNotMatch(detail, /client_id:\s*params\.id|\.eq\('id',\s*params\.id/);

  assert.ok(detail.includes('crypto.randomUUID()'));
  assert.ok(detail.includes("await supabase.storage.from('documents').remove([filePath])"));
  assert.ok(detail.includes('setDocumentError('));
});

test('documents bucket is provisioned as private storage', () => {
  const schema = read('supabase_schema.sql');

  assert.match(schema, /INSERT INTO storage\.buckets \(id, name, public\)/);
  assert.match(schema, /VALUES \('documents', 'documents', false\)/);
  assert.match(schema, /SET public = false/);
});
