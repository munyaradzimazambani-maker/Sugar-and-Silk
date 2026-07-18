import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const schema = await readFile(new URL('../supabase_schema.sql', import.meta.url), 'utf8');

test('admin RLS resolves the application role from profiles', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /SECURITY DEFINER/);
  assert.match(schema, /FROM public\.profiles[\s\S]*role = 'admin'/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);
});

test('every admin policy checks is_admin for existing and new rows', () => {
  const tablePolicies = [
    'profiles',
    'clients',
    'maturity',
    'roadmap',
    'kpis',
    'documents',
    'tasks',
    'activity',
  ];

  for (const policy of tablePolicies) {
    const declaration = new RegExp(
      `CREATE POLICY admin_full_access_${policy}[\\s\\S]*?` +
      `USING \\(public\\.is_admin\\(\\)\\)[\\s\\S]*?` +
      `WITH CHECK \\(public\\.is_admin\\(\\)\\);`
    );
    assert.match(schema, declaration, `${policy} admin policy must protect reads and writes`);
  }

  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access[\s\S]*?USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*?WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/
  );
});
