import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync('supabase_schema.sql', 'utf8');
const adminListPage = readFileSync('app/(portal)/admin/page.tsx', 'utf8');
const adminDetailPage = readFileSync('app/(portal)/admin/clients/[id]/page.tsx', 'utf8');

test('admin RLS policies use profile-backed role checks', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);

  for (const policyName of [
    'admin_full_access_profiles',
    'admin_full_access_clients',
    'admin_full_access_maturity',
    'admin_full_access_roadmap',
    'admin_full_access_kpis',
    'admin_full_access_documents',
    'admin_full_access_tasks',
    'admin_full_access_activity',
  ]) {
    assert.match(
      schema,
      new RegExp(
        `CREATE POLICY ${policyName}[\\s\\S]*?USING \\(public\\.is_admin\\(\\)\\)[\\s\\S]*?WITH CHECK \\(public\\.is_admin\\(\\)\\)`
      )
    );
  }
});

test('client company names are persisted by the clients table contract', () => {
  assert.match(schema, /CREATE TABLE clients \([\s\S]*?company_name TEXT NOT NULL/);
  assert.match(adminListPage, /\.from\('clients'\)[\s\S]*?\.order\('company_name'/);
  assert.match(adminListPage, /\.insert\(newClient\)/);
});

test('documents bucket is private and admin storage policies use profile roles', () => {
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*?VALUES \('documents', 'documents', false\)[\s\S]*?ON CONFLICT \(id\) DO UPDATE SET public = false;/
  );
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access ON storage\.objects FOR ALL TO authenticated[\s\S]*?USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*?WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/
  );
});

test('admin client route uses client params API and scoped writes', () => {
  assert.match(adminDetailPage, /useParams<\{ id: string \}>/);
  assert.doesNotMatch(adminDetailPage, /params\.id/);
  assert.match(adminDetailPage, /\.eq\('id', clientId\)/);
  assert.match(adminDetailPage, /client_id: clientId/);
});

test('document upload rolls back storage object when metadata insert fails', () => {
  assert.match(adminDetailPage, /crypto\.randomUUID\(\)/);
  assert.match(adminDetailPage, /\.upload\(filePath, file\)/);
  assert.match(adminDetailPage, /if \(dbError\) \{[\s\S]*?\.remove\(\[filePath\]\)[\s\S]*?throw dbError;/);
  assert.match(adminDetailPage, /setUploadError\('Could not upload this document\. Please try again\.'\)/);
});
