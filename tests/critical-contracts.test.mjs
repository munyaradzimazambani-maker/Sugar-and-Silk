import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function readWorkspaceFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('schema authorizes admins from profiles and prevents orphan client engagements', () => {
  const schema = readWorkspaceFile('supabase_schema.sql');

  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.doesNotMatch(schema, /auth\.jwt\(\) ->> 'role' = 'admin'/);
  assert.match(schema, /profile_id UUID REFERENCES profiles\(id\) ON DELETE CASCADE NOT NULL UNIQUE/);
  assert.match(schema, /CREATE POLICY admin_full_access_clients[\s\S]*USING \(public\.is_admin\(\)\)[\s\S]*WITH CHECK \(public\.is_admin\(\)\);/);
  assert.match(schema, /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)/);
  assert.match(schema, /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/);
});

test('admin client onboarding links existing profiles instead of writing schema-mismatched company names', () => {
  const adminPage = readWorkspaceFile('app/(portal)/admin/page.tsx');

  assert.match(adminPage, /\.select\('.*, profiles:profile_id\(full_name, company_name\)'\)/);
  assert.match(adminPage, /\.from\('profiles'\)[\s\S]*\.eq\('role', 'client'\)/);
  assert.match(adminPage, /profile_id: ''/);
  assert.match(adminPage, /\.insert\(newClient\)/);
  assert.doesNotMatch(adminPage, /\.order\('company_name'/);
  assert.doesNotMatch(adminPage, /company_name: ''/);
});

test('dynamic admin detail route uses resolved params, profile joins, and storage rollback', () => {
  const detailPage = readWorkspaceFile('app/(portal)/admin/clients/[id]/page.tsx');

  assert.match(detailPage, /useParams<\{ id: string \| string\[\] \}>/);
  assert.doesNotMatch(detailPage, /params\.id/);
  assert.match(detailPage, /\.select\('.*, profiles:profile_id\(full_name, company_name\)'\)/);
  assert.match(detailPage, /crypto\.randomUUID\(\)/);
  assert.match(detailPage, /\.from\('documents'\)\.remove\(\[filePath\]\)/);
  assert.match(detailPage, /setUploadError\('Upload failed while saving document metadata/);
});

test('client dashboard reads company display through the profile relationship', () => {
  const dashboardPage = readWorkspaceFile('app/(portal)/dashboard/page.tsx');

  assert.match(dashboardPage, /\.select\('.*, profiles:profile_id\(company_name\)'\)/);
  assert.match(dashboardPage, /company_name: clientData\.profiles\?\.company_name \|\| profileData\?\.company_name/);
});
