import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin RLS is based on profiles.role instead of the Supabase JWT role claim', () => {
  const schema = read('supabase_schema.sql');

  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /SECURITY DEFINER/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);

  const tableAdminPolicies = schema.match(/USING \(public\.is_admin\(\)\);/g) ?? [];
  assert.equal(tableAdminPolicies.length, 8);
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access ON storage\.objects FOR ALL TO authenticated\s+USING \(bucket_id = 'documents' AND public\.is_admin\(\)\);/
  );
});

test('client engagements cannot be created without a linked portal profile', () => {
  const schema = read('supabase_schema.sql');
  const clientsTable = schema.match(/CREATE TABLE clients \(([\s\S]*?)\);/)?.[1] ?? '';

  assert.match(clientsTable, /profile_id UUID NOT NULL REFERENCES profiles\(id\) ON DELETE CASCADE UNIQUE/);
  assert.match(clientsTable, /company_name TEXT NOT NULL/);
});

test('documents storage bucket is provisioned by the schema', () => {
  const schema = read('supabase_schema.sql');

  assert.match(schema, /INSERT INTO storage\.buckets \(id, name, public\)/);
  assert.match(schema, /VALUES \('documents', 'documents', false\)/);
  assert.match(schema, /ON CONFLICT \(id\) DO UPDATE SET public = EXCLUDED\.public/);
});

test('admin onboarding creates profile-linked client engagements', () => {
  const source = read('app/(portal)/admin/page.tsx');

  assert.match(source, /profile_id: ''/);
  assert.match(source, /\.from\('profiles'\)/);
  assert.match(source, /\.eq\('role', 'client'\)/);
  assert.match(source, /if \(!newClient\.profile_id \|\| !newClient\.company_name\) return;/);
  assert.match(source, /\.insert\(newClient\)/);
});

test('admin detail page uses stable route params and rolls back orphaned uploads', () => {
  const source = read('app/(portal)/admin/clients/[id]/page.tsx');

  assert.match(source, /useParams<\{ id: string \}>/);
  assert.doesNotMatch(source, /AdminClientDetailPage\(\{ params \}/);
  assert.doesNotMatch(source, /params\.id/);

  assert.match(source, /async function handleDocumentUpload\(file: File\)/);
  assert.match(source, /\.remove\(\[filePath\]\)/);
  assert.doesNotMatch(source, /Math\.random\(\)/);
});
