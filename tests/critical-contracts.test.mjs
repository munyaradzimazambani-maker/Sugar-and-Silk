import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const schema = await readFile(new URL('../supabase_schema.sql', import.meta.url), 'utf8');
const adminPage = await readFile(new URL('../app/(portal)/admin/page.tsx', import.meta.url), 'utf8');
const adminDetailPage = await readFile(new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url), 'utf8');

test('admin policies use the app profile role, not Supabase JWT database role', () => {
  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM profiles[\s\S]*role = 'admin'/,
    'schema must define an admin helper backed by profiles.role',
  );
  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'admin RLS must not depend on the default Supabase JWT database role',
  );
  assert.match(
    schema,
    /CREATE POLICY admin_full_access_clients[\s\S]*USING \(public\.is_admin\(\)\)/,
    'admin client access must be granted through public.is_admin()',
  );
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)/,
    'admin storage access must be granted through public.is_admin()',
  );
});

test('clients schema matches admin company-name reads and writes', () => {
  assert.match(
    schema,
    /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL/,
    'clients table must contain the company_name field used by the admin UI',
  );
  assert.match(adminPage, /\.order\('company_name'/);
  assert.match(adminPage, /\.insert\(newClient\)/);
  assert.match(adminDetailPage, /client\.company_name/);
});

test('documents storage bucket is provisioned as private', () => {
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)/,
    'schema must create the private documents bucket used by uploads and signed URLs',
  );
});
