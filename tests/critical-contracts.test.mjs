import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');

function createTableBlock(tableName) {
  const match = schema.match(new RegExp(`CREATE TABLE ${tableName} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(match, `Expected CREATE TABLE block for ${tableName}`);
  return match[1];
}

test('clients table includes the company_name column used by admin and dashboard queries', () => {
  const clientsTable = createTableBlock('clients');

  assert.match(
    clientsTable,
    /\n\s+company_name TEXT NOT NULL,/,
    'clients.company_name must exist because the app orders, inserts, and displays it directly',
  );
});

test('admin RLS policies use profiles.role instead of an unconfigured JWT role claim', () => {
  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'/,
    'Supabase JWTs do not contain profiles.role by default; admin policies must not depend on that claim',
  );

  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/,
    'public.is_admin() must authorize admins from public.profiles.role',
  );

  const adminPolicies = [
    'profiles',
    'clients',
    'maturity',
    'roadmap',
    'kpis',
    'documents',
    'tasks',
    'activity',
  ];

  for (const policy of adminPolicies) {
    assert.match(
      schema,
      new RegExp(
        `CREATE POLICY admin_full_access_${policy}[\\s\\S]*?USING \\(public\\.is_admin\\(\\)\\)[\\s\\S]*?WITH CHECK \\(public\\.is_admin\\(\\)\\);`,
      ),
      `admin_full_access_${policy} must use public.is_admin() for reads and writes`,
    );
  }
});

test('documents storage bucket is provisioned privately with profile-backed admin access', () => {
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)\s+VALUES \('documents', 'documents', false\)\s+ON CONFLICT \(id\) DO UPDATE SET public = false;/,
    'the documents bucket must be created as private for uploads and downloads to work securely',
  );

  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access ON storage\.objects FOR ALL TO authenticated\s+USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)\s+WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/,
    'storage admin access must follow the same profile-backed admin role as table RLS',
  );
});
