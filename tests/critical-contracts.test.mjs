import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');
const adminDetailPage = readFileSync(
  new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url),
  'utf8',
);

test('clients schema matches admin UI company-name contract', () => {
  assert.match(
    schema,
    /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL[\s\S]*\);/,
    'clients table must include the company_name column selected, ordered, inserted, and rendered by admin UI',
  );
});

test('admin data policies use profile-backed authorization', () => {
  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/,
    'admin helper must authorize from profiles.role, matching middleware and login routing',
  );
  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'admin policies must not rely on unconfigured custom JWT role claims',
  );

  const adminPolicies = schema.match(/CREATE POLICY admin_full_access_[\s\S]*?;/g) || [];
  assert.equal(adminPolicies.length, 8, 'all admin table policies should be present');
  for (const policy of adminPolicies) {
    assert.match(policy, /USING \(public\.is_admin\(\)\)/);
    assert.match(policy, /WITH CHECK \(public\.is_admin\(\)\)/);
  }
});

test('documents storage bucket and admin storage write policy are provisioned', () => {
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)/,
    'schema must create the private documents bucket used by document uploads and signed URLs',
  );
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access ON storage\.objects FOR ALL TO authenticated[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\)/,
    'admin storage policy must allow writes to the documents bucket for profile-backed admins',
  );
});

test('admin client detail page uses Next route params safely', () => {
  assert.match(adminDetailPage, /import \{ useParams \} from 'next\/navigation';/);
  assert.match(adminDetailPage, /const params = useParams<\{ id: string \}>\(\);/);
  assert.match(adminDetailPage, /const clientId = params\.id;/);
  assert.doesNotMatch(adminDetailPage, /function AdminClientDetailPage\(\{ params \}/);
  assert.deepEqual(
    adminDetailPage.match(/params\.id/g),
    ['params.id'],
    'route param should be unwrapped once and all queries/writes should use clientId',
  );
});

test('document upload rolls back storage object when metadata insert fails', () => {
  assert.match(adminDetailPage, /\.upload\(filePath, file\)/);
  assert.match(adminDetailPage, /\.from\('documents'\)\s*\.remove\(\[filePath\]\)/);
  assert.match(
    adminDetailPage,
    /if \(dbError\) \{[\s\S]*\.remove\(\[filePath\]\)[\s\S]*setUploading\(false\);[\s\S]*return;/,
    'failed metadata inserts must clean up the already-uploaded storage object and stop the success path',
  );
});
