import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');

function tableDefinition(tableName) {
  const match = schema.match(new RegExp(`CREATE TABLE ${tableName} \\(([^;]+)\\);`, 's'));
  assert.ok(match, `Expected ${tableName} table to be defined`);
  return match[1];
}

test('clients table stores the company name used by admin onboarding', () => {
  const clientsTable = tableDefinition('clients');

  assert.match(
    clientsTable,
    /\bcompany_name\s+TEXT\s+NOT\s+NULL\b/,
    'admin UI inserts and orders clients.company_name, so the schema must expose it',
  );
});

test('admin RLS policies use the profile role rather than the Supabase JWT role', () => {
  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]+FROM public\.profiles[\s\S]+role = 'admin'/,
    'admin authorization helper should check profiles.role',
  );

  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'Supabase JWT role is "authenticated", not the app-level admin role',
  );

  const adminPolicyNames = [
    'admin_full_access_profiles',
    'admin_full_access_clients',
    'admin_full_access_maturity',
    'admin_full_access_roadmap',
    'admin_full_access_kpis',
    'admin_full_access_documents',
    'admin_full_access_tasks',
    'admin_full_access_activity',
    'admin_full_storage_access',
  ];

  for (const policyName of adminPolicyNames) {
    const policyMatch = schema.match(new RegExp(`CREATE POLICY ${policyName}[\\s\\S]+?(?=\\n\\n|$)`));
    assert.ok(policyMatch, `Expected ${policyName} to be defined`);
    assert.match(policyMatch[0], /public\.is_admin\(\)/, `${policyName} must use the profile-backed admin helper`);
  }
});
