import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

async function readSource(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('schema uses profile-backed admin RLS and enforces linked client engagements', async () => {
  const schema = await readSource('supabase_schema.sql');

  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*SECURITY DEFINER/,
    'admin checks must read profiles through a SECURITY DEFINER helper',
  );
  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'Supabase JWT role is the database role, not the app admin role',
  );
  assert.match(
    schema,
    /profile_id UUID NOT NULL UNIQUE REFERENCES profiles\(id\)/,
    'client engagements must be tied to exactly one client profile',
  );

  const adminPolicies = [
    'admin_full_access_profiles',
    'admin_full_access_clients',
    'admin_full_access_maturity',
    'admin_full_access_roadmap',
    'admin_full_access_kpis',
    'admin_full_access_documents',
    'admin_full_access_tasks',
    'admin_full_access_activity',
  ];

  for (const policy of adminPolicies) {
    assert.match(
      schema,
      new RegExp(`CREATE POLICY ${policy}[\\s\\S]*USING \\(public\\.is_admin\\(\\)\\)\\s*WITH CHECK \\(public\\.is_admin\\(\\)\\);`),
      `${policy} must allow admin reads and writes through public.is_admin()`,
    );
  }

  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO NOTHING;/,
    'document storage bucket must be provisioned by the schema',
  );
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)\s*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/,
    'storage admin policy must use the same profile-backed admin check for reads and writes',
  );
});

test('admin portfolio reads company names from profiles and creates linked clients', async () => {
  const adminPage = await readSource('app/(portal)/admin/page.tsx');

  assert.match(
    adminPage,
    /\.from\('clients'\)[\s\S]*\.select\('\*, profiles\(id, full_name, company_name\)'\)/,
    'admin client list must join profiles for company names',
  );
  assert.doesNotMatch(
    adminPage,
    /\.from\('clients'\)[\s\S]{0,160}\.order\('company_name'/,
    'clients table has no company_name column to order by',
  );
  assert.doesNotMatch(
    adminPage,
    /\.insert\(newClient\)/,
    'new engagement inserts must not pass UI-only company_name fields to clients',
  );
  assert.match(
    adminPage,
    /profile_id: newClient\.profile_id/,
    'new engagement inserts must link an existing client profile',
  );
  assert.match(
    adminPage,
    /availableProfiles/,
    'admin onboarding should only offer profiles without an engagement',
  );
});

test('admin detail uses client route params safely and rolls back failed document metadata writes', async () => {
  const detailPage = await readSource('app/(portal)/admin/clients/[id]/page.tsx');

  assert.match(detailPage, /import \{ useParams \} from 'next\/navigation';/);
  assert.doesNotMatch(detailPage, /AdminClientDetailPage\(\{ params \}/);
  assert.doesNotMatch(detailPage, /client_id: params\.id/);
  assert.match(
    detailPage,
    /\.from\('clients'\)[\s\S]*\.select\('\*, profiles\(id, full_name, company_name\)'\)/,
    'admin detail header must join profiles for company names',
  );

  assert.match(detailPage, /async function handleDocumentUpload\(file: File\)/);
  assert.match(detailPage, /crypto\.randomUUID\(\)/, 'storage keys must not collide across uploads');
  assert.match(
    detailPage,
    /\.from\('documents'\)[\s\S]*\.remove\(\[filePath\]\)/,
    'a DB insert failure after storage upload must remove the uploaded object',
  );
  assert.match(
    detailPage,
    /e\.currentTarget\.value = '';/,
    'file input should reset so failed uploads can be retried',
  );
});

test('client dashboard renders company name from the profile record', async () => {
  const dashboardPage = await readSource('app/(portal)/dashboard/page.tsx');

  assert.match(dashboardPage, /profile\?\.company_name/);
  assert.doesNotMatch(
    dashboardPage,
    /client\?\.company_name/,
    'clients table does not store company_name',
  );
});
