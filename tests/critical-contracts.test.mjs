import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Supabase schema supports app-level admin access and client company names', () => {
  const schema = read('supabase_schema.sql');

  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /FROM public\.profiles\s+WHERE id = auth\.uid\(\)\s+AND role = 'admin'/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);
  assert.match(schema, /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL[\s\S]*\);/);
  assert.match(schema, /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)/);
});

test('admin client detail page unwraps dynamic route params through Next navigation', () => {
  const page = read('app/(portal)/admin/clients/[id]/page.tsx');

  assert.match(page, /import \{ useParams \} from 'next\/navigation';/);
  assert.match(page, /const clientId = params\.id;/);
  assert.doesNotMatch(page, /\.eq\([^)]*params\.id/);
  assert.doesNotMatch(page, /client_id: params\.id/);
  assert.match(page, /\.eq\('id', clientId\)/);
  assert.match(page, /client_id: clientId/);
});

test('document upload rolls back storage object when metadata insert fails', () => {
  const page = read('app/(portal)/admin/clients/[id]/page.tsx');

  assert.match(page, /async function handleDocumentUpload\(file: File\)/);
  assert.match(page, /\.upload\(filePath, file\)/);
  assert.match(page, /if \(dbError\) \{[\s\S]*\.remove\(\[filePath\]\)[\s\S]*setUploadError\('Upload could not be saved\. The file was not kept\.'\)/);
});

test('admin client search does not crash on records missing company names', () => {
  const page = read('app/(portal)/admin/page.tsx');

  assert.match(page, /\(c\.company_name \|\| ''\)\.toLowerCase\(\)/);
});
