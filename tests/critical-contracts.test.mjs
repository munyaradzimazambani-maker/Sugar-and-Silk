import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');
const adminDetailPage = readFileSync(
  new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url),
  'utf8',
);

test('admin RLS is backed by profiles.role instead of the Supabase JWT role claim', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /FROM public\.profiles\s+WHERE id = auth\.uid\(\)\s+AND role = 'admin'/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);
  assert.match(schema, /CREATE POLICY admin_full_access_clients[\s\S]*USING \(public\.is_admin\(\)\)[\s\S]*WITH CHECK \(public\.is_admin\(\)\);/);
  assert.match(schema, /CREATE POLICY admin_full_access_documents[\s\S]*USING \(public\.is_admin\(\)\)[\s\S]*WITH CHECK \(public\.is_admin\(\)\);/);
});

test('clients table exposes the company_name field used by the admin and dashboard flows', () => {
  assert.match(schema, /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL,[\s\S]*\);/);
});

test('documents storage bucket is private and uses the same profile-backed admin check', () => {
  assert.match(schema, /INSERT INTO storage\.buckets \(id, name, public\)\s+VALUES \('documents', 'documents', false\)/);
  assert.match(schema, /ON CONFLICT \(id\) DO UPDATE SET public = false;/);
  assert.match(schema, /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/);
});

test('admin detail route uses Next client params API for all client-scoped writes', () => {
  assert.match(adminDetailPage, /import \{ useParams \} from 'next\/navigation';/);
  assert.match(adminDetailPage, /const clientId = params\.id;/);
  const pageAfterClientIdDeclaration = adminDetailPage.replace('const clientId = params.id;', '');
  assert.doesNotMatch(pageAfterClientIdDeclaration, /params\.id/);
});

test('failed document metadata writes remove the uploaded storage object', () => {
  assert.match(adminDetailPage, /const filePath = `\$\{client\.id\}\/\$\{crypto\.randomUUID\(\)\}\$\{fileExt\}`;/);
  assert.match(adminDetailPage, /if \(dbError\) \{[\s\S]*supabase\.storage\.from\('documents'\)\.remove\(\[filePath\]\);[\s\S]*return;[\s\S]*\}/);
});
