import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');
const adminDetailPage = readFileSync(
  new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url),
  'utf8',
);

function tableDefinition(tableName) {
  const match = schema.match(new RegExp(`CREATE TABLE ${tableName} \\([\\s\\S]*?\\n\\);`));
  assert.ok(match, `Expected ${tableName} table definition to exist`);
  return match[0];
}

test('client schema matches admin portfolio queries and inserts', () => {
  const clientsTable = tableDefinition('clients');

  assert.match(
    clientsTable,
    /\n\s+company_name\s+TEXT\s+NOT NULL,/,
    'admin list/create requires clients.company_name to exist',
  );
});

test('admin RLS uses profile role source instead of Supabase JWT role claim', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /FROM profiles\s+WHERE id = auth\.uid\(\)\s+AND role = 'admin'/);
  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'Supabase JWT role is authenticated/anon, not the app admin role',
  );

  const adminPolicyCount = [...schema.matchAll(/CREATE POLICY admin_full_[\s\S]*?USING \(public\.is_admin\(\)\)/g)].length;
  assert.equal(adminPolicyCount, 9, 'all admin table/storage policies should call public.is_admin()');
});

test('documents storage bucket is provisioned by the schema', () => {
  assert.match(schema, /INSERT INTO storage\.buckets \(id, name, public\)/);
  assert.match(schema, /VALUES \('documents', 'documents', FALSE\)/);
});

test('admin client detail page reads dynamic id through Next client route API', () => {
  assert.match(adminDetailPage, /import \{ useParams \} from 'next\/navigation';/);
  assert.match(adminDetailPage, /const \{ id \} = useParams<\{ id: string \}>\(\);/);
  assert.doesNotMatch(adminDetailPage, /params\.id/);
});

test('document upload rolls back storage object when metadata insert fails', () => {
  assert.match(adminDetailPage, /crypto\.randomUUID\(\)/, 'upload paths should avoid collisions');
  assert.match(adminDetailPage, /if \(dbError\) \{[\s\S]*?storage\.from\('documents'\)\.remove\(\[filePath\]\)/);
});
