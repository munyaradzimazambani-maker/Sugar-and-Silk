import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');
const adminDetailPage = readFileSync(
  new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url),
  'utf8',
);

test('clients schema includes the company name used by admin portfolio queries', () => {
  const clientsTable = schema.match(/CREATE TABLE clients \(([\s\S]*?)\n\);/)?.[1] ?? '';

  assert.match(
    clientsTable,
    /\bcompany_name\s+TEXT\s+NOT\s+NULL\b/,
    'admin client list orders by and renders clients.company_name, so fresh schemas must create it',
  );
});

test('admin RLS and storage policies use the same profile role source as the app', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /SECURITY DEFINER/);
  assert.match(schema, /FROM public\.profiles[\s\S]*role = 'admin'/);
  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'Supabase auth JWTs do not include the app profile role unless custom claims are configured',
  );

  const adminPolicyMatches = schema.match(/CREATE POLICY admin_full_[\s\S]*?WITH CHECK \(public\.is_admin\(\)\);/g) ?? [];
  assert.equal(adminPolicyMatches.length, 8, 'each table admin policy should use profile-backed WITH CHECK access');
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/,
    'admin storage writes must use the same profile-backed role check',
  );
});

test('documents storage bucket is provisioned as private by the schema', () => {
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)/,
  );
  assert.match(schema, /ON CONFLICT \(id\) DO UPDATE SET public = false/);
});

test('admin client detail page reads route params with the client-component API', () => {
  assert.match(adminDetailPage, /import \{ useParams \} from 'next\/navigation';/);
  assert.match(adminDetailPage, /const params = useParams<\{ id: string \}>\(\);/);
  assert.match(adminDetailPage, /const clientId = params\.id;/);
  assert.equal(adminDetailPage.match(/params\.id/g)?.length, 1, 'queries should use the resolved clientId value');
});

test('document uploads roll back storage when metadata insert fails', () => {
  assert.match(adminDetailPage, /crypto\.randomUUID\(\)/, 'upload paths should not collide across files');
  assert.match(adminDetailPage, /if \(dbError\) \{[\s\S]*?\.remove\(\[filePath\]\)[\s\S]*?return;/);
  assert.match(adminDetailPage, /setUploadError\('Upload failed while saving document metadata\. Please try again\.'\)/);
});
