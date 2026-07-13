import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function readRepoFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('admin RLS policies use profile-backed admin authorization', async () => {
  const schema = await readRepoFile('supabase_schema.sql');

  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*SECURITY DEFINER[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/,
  );
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);

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
      new RegExp(`CREATE POLICY ${policy}[\\s\\S]*USING \\(public\\.is_admin\\(\\)\\)[\\s\\S]*WITH CHECK \\(public\\.is_admin\\(\\)\\);`),
    );
  }

  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/,
  );
});

test('schema supports the shipped admin client and document workflows', async () => {
  const schema = await readRepoFile('supabase_schema.sql');

  assert.match(schema, /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL DEFAULT ''/);
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO UPDATE SET public = false;/,
  );
});

test('demo credential autofill is explicitly disabled unless opted in', async () => {
  const loginPage = await readRepoFile('app/(auth)/login/page.tsx');

  assert.match(loginPage, /NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'/);
  assert.match(loginPage, /\{showDemoCredentials && \(/);
  assert.match(loginPage, /admin@pcm\.com/);
});

test('admin detail uses route params safely and rolls back orphaned uploads', async () => {
  const detailPage = await readRepoFile('app/(portal)/admin/clients/[id]/page.tsx');

  assert.match(detailPage, /useParams<\{ id: string \| string\[\] \}>/);
  assert.doesNotMatch(detailPage, /\bparams\.id\b/);
  assert.doesNotMatch(detailPage, /Math\.random\(\)/);
  assert.match(detailPage, /crypto\.randomUUID\(\)/);
  assert.match(detailPage, /if \(dbError\) \{[\s\S]*remove\(\[filePath\]\)[\s\S]*return;/);
});
