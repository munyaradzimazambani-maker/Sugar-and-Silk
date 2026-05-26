import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const schema = read('supabase_schema.sql');
const adminDetailPage = read('app/(portal)/admin/clients/[id]/page.tsx');
const adminListPage = read('app/(portal)/admin/page.tsx');

assert.match(
  schema,
  /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL,[\s\S]*engagement_start DATE/s,
  'clients table must persist the company_name used by admin list/detail/create flows',
);

assert.match(
  schema,
  /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/s,
  'admin RLS must derive authorization from profiles.role',
);

assert.doesNotMatch(
  schema,
  /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
  'admin policies must not depend on an unset custom JWT role claim',
);

assert.match(
  schema,
  /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO NOTHING/s,
  'documents storage bucket must exist for admin uploads',
);

assert.match(
  schema,
  /CREATE POLICY admin_full_storage_access ON storage\.objects FOR ALL TO authenticated\s+USING \(bucket_id = 'documents' AND public\.is_admin\(\)\);/,
  'storage admin policy must use the same profile-backed admin check',
);

assert.match(
  adminDetailPage,
  /import \{ useParams \} from 'next\/navigation';[\s\S]*const params = useParams<\{ id: string \}>\(\);[\s\S]*const clientId = params\.id;/s,
  'client route page must read the dynamic id with useParams',
);

assert.doesNotMatch(
  adminDetailPage.replace('const clientId = params.id;', ''),
  /params\.id/,
  'admin detail data operations must use the resolved clientId',
);

assert.match(
  adminDetailPage,
  /await supabase\.storage\.from\('documents'\)\.remove\(\[filePath\]\);/,
  'failed document metadata inserts must remove the uploaded storage object',
);

assert.match(
  adminDetailPage,
  /crypto\.randomUUID\(\)/,
  'document storage keys should not rely on Math.random collisions',
);

assert.match(
  adminListPage,
  /\(c\.company_name \?\? ''\)\.toLowerCase\(\)/,
  'admin search must tolerate legacy rows while company_name is backfilled',
);

console.log('critical contract tests passed');
