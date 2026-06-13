import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const schema = read('supabase_schema.sql');
const adminPage = read('app/(portal)/admin/page.tsx');

function createTableBody(tableName) {
  const match = schema.match(new RegExp(`CREATE TABLE ${tableName} \\((.*?)\\n\\);`, 's'));
  assert.ok(match, `Expected ${tableName} table definition to exist`);
  return match[1];
}

test('admin RLS checks the app profile role instead of Supabase JWT role claims', () => {
  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/,
  );
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'/);

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
      new RegExp(`CREATE POLICY ${policyName}[\\s\\S]*USING \\(public\\.is_admin\\(\\)\\)[\\s\\S]*WITH CHECK \\(public\\.is_admin\\(\\)\\)`),
      `${policyName} must authorize admins through public.is_admin()`,
    );
  }
});

test('admin client portfolio UI has the company_name column required by its queries', () => {
  const clientsTable = createTableBody('clients');

  assert.match(clientsTable, /\n\s+company_name TEXT NOT NULL,/);
  assert.match(adminPage, /\.order\('company_name', \{ ascending: true \}\)/);
  assert.match(adminPage, /\.from\('clients'\)\s*\n\s*\.insert\(newClient\)/);
});

test('documents storage bucket is provisioned privately and uses profile-backed admin checks', () => {
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*SET public = false;/,
  );
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access ON storage\.objects[\s\S]*bucket_id = 'documents' AND public\.is_admin\(\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\)/,
  );
});
