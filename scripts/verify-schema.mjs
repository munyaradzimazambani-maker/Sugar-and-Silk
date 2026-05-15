import { readFileSync } from 'node:fs';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');

function fail(message) {
  console.error(`Schema verification failed: ${message}`);
  process.exitCode = 1;
}

const clientsTable = schema.match(/CREATE TABLE clients \(([\s\S]*?)\n\);/);

if (!clientsTable) {
  fail('clients table definition is missing');
} else if (!/\bcompany_name\s+TEXT\s+NOT NULL\b/.test(clientsTable[1])) {
  fail('clients.company_name must be present and required for admin client creation/listing');
}

if (/auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/.test(schema)) {
  fail('admin policies must not depend on the default Supabase JWT role claim');
}

const isAdminFunction = schema.match(/CREATE OR REPLACE FUNCTION public\.is_admin\(\)([\s\S]*?)\$\$;/);

if (!isAdminFunction) {
  fail('public.is_admin() helper is missing');
} else {
  const body = isAdminFunction[0];
  if (!/\bSECURITY DEFINER\b/.test(body)) {
    fail('public.is_admin() must be SECURITY DEFINER so RLS can evaluate profile roles');
  }
  if (!/FROM profiles[\s\S]*role\s*=\s*'admin'/.test(body)) {
    fail('public.is_admin() must authorize against profiles.role');
  }
}

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
  const policy = schema.match(new RegExp(`CREATE POLICY ${policyName}[\\s\\S]*?;`));
  if (!policy) {
    fail(`${policyName} policy is missing`);
    continue;
  }

  if (!/public\.is_admin\(\)/.test(policy[0])) {
    fail(`${policyName} must use public.is_admin()`);
  }

  if (!/WITH CHECK/.test(policy[0])) {
    fail(`${policyName} must include a WITH CHECK clause for writes`);
  }
}

if (process.exitCode) {
  process.exit();
}

console.log('Schema verification passed');
