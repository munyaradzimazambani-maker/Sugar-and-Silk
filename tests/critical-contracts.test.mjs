import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const schema = readFileSync('supabase_schema.sql', 'utf8');
const adminListPage = readFileSync('app/(portal)/admin/page.tsx', 'utf8');
const adminDetailPage = readFileSync('app/(portal)/admin/clients/[id]/page.tsx', 'utf8');

test('admin RLS policies use the profile-backed admin helper', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);

  const adminTablePolicies = schema.match(
    /CREATE POLICY admin_full_access_\w+ ON \w+ FOR ALL TO authenticated\s+USING \(public\.is_admin\(\)\)\s+WITH CHECK \(public\.is_admin\(\)\);/g,
  );

  assert.equal(adminTablePolicies?.length, 8);
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access ON storage\.objects FOR ALL TO authenticated\s+USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)\s+WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/,
  );
});

test('clients schema exposes the company_name field used by admin workflows', () => {
  assert.match(schema, /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL/);
  assert.match(adminListPage, /\.from\('clients'\)[\s\S]*\.order\('company_name', \{ ascending: true \}\)/);
});

test('documents storage bucket is created by the schema', () => {
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)\s+VALUES \('documents', 'documents', false\)\s+ON CONFLICT \(id\) DO NOTHING;/,
  );
});

test('admin client detail route uses Next client params safely', () => {
  assert.match(adminDetailPage, /useParams<\{ id: string \}>\(\)/);
  assert.doesNotMatch(adminDetailPage, /AdminClientDetailPage\(\{ params/);
  assert.doesNotMatch(adminDetailPage, /params\.id/);
});

test('document uploads roll back storage objects when metadata insert fails', () => {
  assert.match(adminDetailPage, /crypto\.randomUUID\(\)/);
  assert.doesNotMatch(adminDetailPage, /Math\.random\(\)/);
  assert.match(
    adminDetailPage,
    /if \(dbError\) \{\s+await supabase\.storage\.from\('documents'\)\.remove\(\[filePath\]\);\s+throw dbError;\s+\}/,
  );
});
