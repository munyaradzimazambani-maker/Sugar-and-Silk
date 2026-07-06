import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('schema uses profile-backed admin authorization and a private documents bucket', () => {
  const schema = read('supabase_schema.sql');

  assert.match(
    schema,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/,
    'admin checks must use profiles.role because the app stores roles in profiles'
  );
  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'Supabase JWT role is authenticated/anon, not the application admin role'
  );
  assert.match(schema, /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL/);
  assert.match(
    schema,
    /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO UPDATE SET public = false;/
  );
  assert.match(
    schema,
    /CREATE POLICY admin_full_storage_access[\s\S]*public\.is_admin\(\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\);/
  );
});

test('admin list is aligned with clients.company_name and does not crash on legacy rows', () => {
  const adminPage = read('app/(portal)/admin/page.tsx');

  assert.match(adminPage, /\.order\('company_name', \{ ascending: true \}\)/);
  assert.match(adminPage, /\(c\.company_name \|\| ''\)\.toLowerCase\(\)/);
  assert.doesNotMatch(adminPage, /c\.company_name\.toLowerCase\(\)/);
});

test('admin detail route uses resolved client params and rolls back orphaned uploads', () => {
  const detailPage = read('app/(portal)/admin/clients/[id]/page.tsx');

  assert.match(detailPage, /import \{ useParams \} from 'next\/navigation';/);
  assert.match(detailPage, /const routeParams = useParams/);
  assert.doesNotMatch(detailPage, /params\.id/);
  assert.doesNotMatch(detailPage, /Math\.random\(\)/);
  assert.match(detailPage, /remove\(\[filePath\]\)/);
  assert.match(detailPage, /setUploadError\(/);
});

test('dashboard pages stop loading when auth is unavailable', () => {
  const dashboardPages = [
    'app/(portal)/dashboard/page.tsx',
    'app/(portal)/dashboard/documents/page.tsx',
    'app/(portal)/dashboard/tasks/page.tsx',
    'app/(portal)/dashboard/maturity/page.tsx',
    'app/(portal)/dashboard/kpis/page.tsx',
    'app/(portal)/dashboard/roadmap/page.tsx',
    'app/(portal)/dashboard/activity/page.tsx',
  ];

  for (const path of dashboardPages) {
    const source = read(path);
    assert.doesNotMatch(source, /if \(!user\) return;/, `${path} can leave the page spinning forever`);
    assert.match(
      source,
      /if \(!user\) \{\s*setLoading\(false\);\s*return;\s*\}/,
      `${path} should clear loading before returning without a user`
    );
  }
});
