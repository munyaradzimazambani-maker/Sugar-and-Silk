import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');

function tableDefinition(tableName) {
  const match = schema.match(new RegExp(`CREATE TABLE ${tableName} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(match, `Expected ${tableName} table definition to exist`);
  return match[1];
}

test('clients schema exposes the company name used by admin workflows', () => {
  const clientsTable = tableDefinition('clients');

  assert.match(
    clientsTable,
    /\bcompany_name\s+TEXT\s+NOT\s+NULL\b/i,
    'Admin client listing, searching, and creation require clients.company_name to be persisted',
  );
});

test('admin policies use the profile-backed application role', () => {
  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*SECURITY DEFINER[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/,
    'RLS needs a SECURITY DEFINER helper that reads profiles.role for the current user',
  );

  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'Supabase JWT role is not the application admin role and would block admin access',
  );

  const adminPolicyTables = [
    'profiles',
    'clients',
    'maturity_scores',
    'roadmap_phases',
    'kpis',
    'documents',
    'tasks',
    'activity_log',
  ];

  for (const tableName of adminPolicyTables) {
    assert.match(
      schema,
      new RegExp(`CREATE POLICY admin_full_access_[a-z_]+ ON ${tableName} FOR ALL TO authenticated\\s+USING \\(public\\.is_admin\\(\\)\\);`),
      `Expected ${tableName} admin policy to use public.is_admin()`,
    );
  }

  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access ON storage\.objects FOR ALL TO authenticated\s+USING \(bucket_id = 'documents' AND public\.is_admin\(\)\);/,
    'Storage admin policy should use the same profile-backed admin helper',
  );
});
