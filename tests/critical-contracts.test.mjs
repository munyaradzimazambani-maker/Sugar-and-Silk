import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

const schema = await readFile(new URL('../supabase_schema.sql', import.meta.url), 'utf8');
const adminClientDetailPage = await readFile(
  new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url),
  'utf8',
);

test('admin RLS policies use profile-backed app roles instead of JWT role claims', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /FROM profiles\s+WHERE id = auth\.uid\(\)\s+AND role = 'admin'/);
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
      new RegExp(`${policyName}[\\s\\S]*?USING \\(public\\.is_admin\\(\\)\\)[\\s\\S]*?WITH CHECK \\(public\\.is_admin\\(\\)\\)`),
      `${policyName} must allow admin reads and writes through profiles.role`,
    );
  }

  assert.match(
    schema,
    /admin_full_storage_access[\s\S]*?USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*?WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\)/,
  );
});

test('schema provides the client fields and storage bucket required by admin workflows', () => {
  assert.match(
    schema,
    /CREATE TABLE clients \([\s\S]*?company_name TEXT NOT NULL[\s\S]*?\);/,
    'admin list/create/detail pages read and write clients.company_name',
  );
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO UPDATE SET public = false;/,
    'document uploads require a private documents bucket',
  );
});

test('admin client detail uses Next route params safely and rolls back failed document metadata writes', () => {
  assert.match(adminClientDetailPage, /import \{ useParams \} from 'next\/navigation';/);
  assert.match(adminClientDetailPage, /const params = useParams<\{ id: string \}>\(\);/);
  assert.doesNotMatch(adminClientDetailPage, /function AdminClientDetailPage\(\{ params \}/);
  assert.match(adminClientDetailPage, /\.remove\(\[filePath\]\)/);
  assert.match(adminClientDetailPage, /crypto\.randomUUID\(\)/);
});
