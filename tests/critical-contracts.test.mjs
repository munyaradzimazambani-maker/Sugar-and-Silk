import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');
const adminPage = readFileSync(new URL('../app/(portal)/admin/page.tsx', import.meta.url), 'utf8');
const adminDetailPage = readFileSync(new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url), 'utf8');

function tableDefinition(tableName) {
  const match = schema.match(new RegExp(`CREATE TABLE ${tableName} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(match, `Expected ${tableName} table definition to exist`);
  return match[1];
}

test('admin RLS policies use profiles.role instead of the built-in JWT role claim', () => {
  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM profiles[\s\S]*role = 'admin'/,
    'Expected public.is_admin() to check the application role stored on profiles',
  );

  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'Admin policies must not rely on Supabase built-in JWT role, which is authenticated/anon',
  );

  const adminPolicyUses = schema.match(/USING \(public\.is_admin\(\)\)/g) ?? [];
  assert.equal(adminPolicyUses.length, 8, 'Expected all admin table policies to use public.is_admin()');

  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\)/,
    'Expected storage admin policy to use public.is_admin() for reads and writes',
  );
});

test('clients schema matches the current admin portfolio UI contract', () => {
  const clientsTable = tableDefinition('clients');

  assert.match(
    clientsTable,
    /\n\s+company_name TEXT NOT NULL,/,
    'Admin list/create/search reads and writes clients.company_name, so the column must exist',
  );

  assert.match(
    adminPage,
    /\.from\('clients'\)[\s\S]*\.order\('company_name', \{ ascending: true \}\)/,
    'This test should track the current admin list ordering contract',
  );

  assert.match(
    adminPage,
    /\.insert\(newClient\)/,
    'This test should track the current admin create payload contract',
  );
});

test('document storage bucket is provisioned by the schema', () => {
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO NOTHING;/,
    'Document upload code requires a private documents storage bucket to exist',
  );
});

test('document upload rolls back storage when metadata insert fails', () => {
  assert.match(
    adminDetailPage,
    /const fileId = crypto\.randomUUID\(\);[\s\S]*const filePath = `\$\{client\.id\}\/\$\{fileId\}\.\$\{fileExt\}`;/,
    'Uploaded document keys should be collision-resistant within each client folder',
  );

  assert.match(
    adminDetailPage,
    /if \(dbError\) \{[\s\S]*\.from\('documents'\)[\s\S]*\.remove\(\[filePath\]\);[\s\S]*setUploadError\('Upload failed while saving the document record\. Please try again\.'\);[\s\S]*return;/,
    'A metadata insert failure after storage upload must delete the just-uploaded object and stop refresh',
  );
});
