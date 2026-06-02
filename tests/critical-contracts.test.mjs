import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const schema = read('supabase_schema.sql');
const adminDetailPage = read('app/(portal)/admin/clients/[id]/page.tsx');
const packageJson = JSON.parse(read('package.json'));

assert.match(
  schema,
  /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL[\s\S]*\);/,
  'clients table must include the company_name column used by admin and dashboard queries',
);

assert.match(
  schema,
  /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/,
  'admin policies must derive authorization from profiles.role',
);

assert.doesNotMatch(
  schema,
  /auth\.jwt\(\)\s*->>\s*'role'/,
  'admin policies must not depend on an unset JWT role claim',
);

for (const table of [
  'profiles',
  'clients',
  'maturity',
  'roadmap',
  'kpis',
  'documents',
  'tasks',
  'activity',
]) {
  assert.match(
    schema,
    new RegExp(`CREATE POLICY admin_full_access_${table}[\\s\\S]*USING \\(public\\.is_admin\\(\\)\\)[\\s\\S]*WITH CHECK \\(public\\.is_admin\\(\\)\\);`),
    `admin policy for ${table} must use profile-backed admin checks for reads and writes`,
  );
}

assert.match(
  schema,
  /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO NOTHING;/,
  'documents storage bucket must be created by the schema',
);

assert.match(
  schema,
  /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/,
  'admin storage policy must use profile-backed admin checks for reads and writes',
);

assert.match(
  adminDetailPage,
  /useParams<\{\s*id: string\s*\}>\(\)/,
  'client route page must read dynamic params with useParams in the client component',
);

assert.doesNotMatch(
  adminDetailPage,
  /params\.id/,
  'client route page must not access params.id synchronously',
);

assert.match(
  adminDetailPage,
  /crypto\.randomUUID\(\)/,
  'document uploads must use collision-resistant storage keys',
);

assert.match(
  adminDetailPage,
  /\.remove\(\[filePath\]\)/,
  'document upload must remove the storage object when the metadata insert fails',
);

assert.equal(
  packageJson.scripts.test,
  'node tests/critical-contracts.test.mjs',
  'npm test should run the critical contract checks',
);

console.log('critical contract checks passed');
