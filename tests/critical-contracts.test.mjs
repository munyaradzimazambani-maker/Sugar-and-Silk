import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readProjectFile = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('schema authorizes admins through profiles.role, not JWT role claims', () => {
  const schema = readProjectFile('supabase_schema.sql');

  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'/);
  assert.match(schema, /CREATE POLICY admin_full_access_clients[\s\S]*USING \(public\.is_admin\(\)\)[\s\S]*WITH CHECK \(public\.is_admin\(\)\);/);
  assert.match(schema, /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/);
});

test('schema requires one linked profile per client engagement and creates the documents bucket', () => {
  const schema = readProjectFile('supabase_schema.sql');

  assert.match(schema, /profile_id UUID NOT NULL UNIQUE REFERENCES profiles\(id\)/);
  assert.match(schema, /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO NOTHING;/);
});

test('admin portfolio uses profile-backed company names and cannot create orphan clients', () => {
  const adminPage = readProjectFile('app/(portal)/admin/page.tsx');

  assert.match(adminPage, /\.select\('\*, profiles:profile_id\(id, full_name, company_name\)'\)/);
  assert.match(adminPage, /\.from\('profiles'\)[\s\S]*\.eq\('role', 'client'\)/);
  assert.match(adminPage, /profile_id: newClient\.profile_id/);
  assert.doesNotMatch(adminPage, /\.from\('clients'\)[\s\S]{0,120}\.order\('company_name'/);
  assert.doesNotMatch(adminPage, /\.insert\(newClient\)/);
});

test('admin detail route unwraps client id with useParams and rolls back failed document records', () => {
  const detailPage = readProjectFile('app/(portal)/admin/clients/[id]/page.tsx');

  assert.match(detailPage, /useParams/);
  assert.match(detailPage, /const clientId = Array\.isArray\(routeParams\.id\)/);
  assert.match(detailPage, /\.select\('\*, profiles:profile_id\(company_name, full_name\)'\)/);
  assert.match(detailPage, /crypto\.randomUUID\(\)/);
  assert.match(detailPage, /\.remove\(\[filePath\]\)/);
  assert.doesNotMatch(detailPage, /params\.id/);
});
