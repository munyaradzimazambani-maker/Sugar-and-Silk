import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');

function tableDefinition(tableName) {
  const match = schema.match(new RegExp(`CREATE TABLE ${tableName} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(match, `Expected ${tableName} table definition to exist`);
  return match[1];
}

test('clients table includes the company name used by admin workflows', () => {
  const clientsTable = tableDefinition('clients');

  assert.match(
    clientsTable,
    /\bcompany_name\s+TEXT\s+NOT\s+NULL\b/,
    'admin client list, create, and detail pages require clients.company_name'
  );
});

test('admin RLS policies use the profile-backed application role', () => {
  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'Supabase JWT role is the database role by default, not the application admin role'
  );

  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/,
    'is_admin must check public.profiles.role, matching middleware authorization'
  );

  for (const policyName of [
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
    const policyPattern = new RegExp(
      `CREATE POLICY ${policyName}[\\s\\S]*USING \\([\\s\\S]*public\\.is_admin\\(\\)[\\s\\S]*\\)`,
      'm'
    );

    assert.match(schema, policyPattern, `${policyName} should authorize admins via public.is_admin()`);
  }
});
