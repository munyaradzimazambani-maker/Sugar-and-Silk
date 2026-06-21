import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = await readFile(new URL('../supabase_schema.sql', import.meta.url), 'utf8');
const adminDetailPage = await readFile(
  new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url),
  'utf8'
);

assert.match(
  schema,
  /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL[\s\S]*\);/,
  'clients table must include company_name because the admin UI selects, orders, inserts, and renders it'
);

assert.match(
  schema,
  /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*SECURITY DEFINER[\s\S]*FROM profiles[\s\S]*role = 'admin'/,
  'admin RLS must use the profiles.role source of truth used by the application'
);

assert.doesNotMatch(
  schema,
  /auth\.jwt\(\)\s*->>\s*'role'/,
  'admin RLS must not depend on an unset custom JWT role claim'
);

assert.match(
  schema,
  /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)/,
  'schema must provision the private documents storage bucket used by uploads and downloads'
);

assert.match(
  schema,
  /CREATE POLICY admin_full_storage_access ON storage\.objects FOR ALL TO authenticated[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/,
  'admin storage policy must allow profile-backed admins to insert document objects'
);

assert.match(
  adminDetailPage,
  /await supabase\.storage\.from\('documents'\)\.remove\(\[filePath\]\);/,
  'document uploads must delete the storage object if the metadata insert fails'
);

assert.match(
  adminDetailPage,
  /crypto\.randomUUID\(\)/,
  'document uploads must use collision-resistant object names'
);

assert.match(
  adminDetailPage,
  /setUploadError\('The file was uploaded but could not be saved in the document vault\. Please try again\.'\);/,
  'document metadata failures must be visible to admins'
);

console.log('critical contract tests passed');
