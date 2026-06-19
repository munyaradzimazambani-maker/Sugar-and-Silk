import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');
const adminListPage = readFileSync(new URL('../app/(portal)/admin/page.tsx', import.meta.url), 'utf8');
const adminDetailPage = readFileSync(new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url), 'utf8');

test('Supabase schema matches shipped admin client and document contracts', () => {
  assert.match(
    schema,
    /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL[\s\S]*\);/,
    'admin UI reads and writes clients.company_name, so the schema must provide it',
  );
  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/,
    'admin RLS must use the same profiles.role authorization source as the app',
  );
  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'Supabase JWT role is normally authenticated, not the app profile role',
  );
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)/,
    'document uploads require a private documents storage bucket',
  );
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\)/,
    'admins need profile-backed read and write access to document storage objects',
  );
});

test('admin client pages avoid known production-breaking route and upload regressions', () => {
  assert.match(adminDetailPage, /import \{ useParams \} from 'next\/navigation';/);
  assert.doesNotMatch(adminDetailPage, /function AdminClientDetailPage\(\{ params \}/);
  assert.doesNotMatch(adminDetailPage, /\.eq\('client_id', params\.id\)|\.eq\('id', params\.id\)|client_id: params\.id/);
  assert.match(adminDetailPage, /const clientId = params\.id;/);
  assert.match(adminDetailPage, /crypto\.randomUUID\(\)/, 'storage paths should not collide via Math.random names');
  assert.match(
    adminDetailPage,
    /if \(dbError\) \{[\s\S]*\.remove\(\[filePath\]\)[\s\S]*return;/,
    'failed document metadata inserts must remove the already-uploaded storage object',
  );
  assert.match(
    adminListPage,
    /\(c\.company_name \|\| ''\)\.toLowerCase\(\)/,
    'admin search should not crash if a transitional row lacks company_name',
  );
});
