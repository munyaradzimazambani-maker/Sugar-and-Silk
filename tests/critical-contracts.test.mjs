import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('schema authorizes admins from profiles instead of JWT role claims', () => {
  const schema = read('supabase_schema.sql');

  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);
  assert.match(
    schema,
    /CREATE POLICY admin_full_access_clients[\s\S]*USING \(public\.is_admin\(\)\)[\s\S]*WITH CHECK \(public\.is_admin\(\)\);/,
  );
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/,
  );
});

test('schema links engagements to profiles and provisions a private document bucket', () => {
  const schema = read('supabase_schema.sql');

  assert.match(schema, /profile_id UUID NOT NULL UNIQUE REFERENCES profiles\(id\) ON DELETE CASCADE/);
  assert.match(schema, /company_name TEXT NOT NULL/);
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO UPDATE SET public = false;/,
  );
});

test('admin onboarding creates engagements from existing client profiles', () => {
  const adminPage = read('app/(portal)/admin/page.tsx');

  assert.match(adminPage, /from\('profiles'\)[\s\S]*\.eq\('role', 'client'\)/);
  assert.match(adminPage, /setAvailableProfiles\(profileData\.filter/);
  assert.match(adminPage, /profile_id: selectedProfile\.id/);
  assert.match(adminPage, /company_name: selectedProfile\.company_name \|\| selectedProfile\.full_name/);
  assert.doesNotMatch(adminPage, /\.insert\(newClient\)/);
});

test('admin detail uses client route params and rolls back orphaned uploads', () => {
  const detailPage = read('app/(portal)/admin/clients/[id]/page.tsx');

  assert.match(detailPage, /import \{ useParams \} from 'next\/navigation';/);
  assert.match(detailPage, /const clientId = params\.id;/);
  assert.doesNotMatch(detailPage, /client_id: params\.id/);
  assert.match(detailPage, /crypto\.randomUUID\(\)/);
  assert.match(detailPage, /\.remove\(\[filePath\]\)/);
  assert.match(detailPage, /setUploadErrorMessage\('Upload failed before it could be saved\. Please try again\.'\)/);
});

test('demo login credentials are hidden unless demo mode is enabled', () => {
  const loginPage = read('app/(auth)/login/page.tsx');

  assert.match(loginPage, /NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'/);
  assert.match(loginPage, /\{showDemoLogin && \(/);
  assert.match(loginPage, /setEmail\('admin@pcm\.com'\); setPassword\('password'\);/);
});
