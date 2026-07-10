import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const schema = read('supabase_schema.sql');
const adminDetailPage = read('app/(portal)/admin/clients/[id]/page.tsx');
const adminListPage = read('app/(portal)/admin/page.tsx');
const dashboardPage = read('app/(portal)/dashboard/page.tsx');

assert.match(
  schema,
  /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.is_admin\(\)[\s\S]*profiles[\s\S]*role\s*=\s*'admin'/i,
  'admin RLS must be backed by profiles.role via public.is_admin()'
);

assert.doesNotMatch(
  schema,
  /auth\.jwt\(\)\s*->>\s*'role'/,
  'admin RLS must not depend on unconfigured JWT role claims'
);

assert.match(
  schema,
  /CREATE\s+TABLE\s+clients\s*\([\s\S]*company_name\s+TEXT/i,
  'clients table must expose company_name used by the shipped admin UI'
);

assert.match(
  schema,
  /INSERT\s+INTO\s+storage\.buckets\s*\([^)]*id[^)]*name[^)]*public[^)]*\)[\s\S]*VALUES\s*\(\s*'documents'\s*,\s*'documents'\s*,\s*false\s*\)/i,
  'documents storage bucket must be provisioned as private'
);

assert.match(
  schema,
  /CREATE\s+POLICY\s+admin_full_storage_access[\s\S]*USING\s*\(\s*bucket_id\s*=\s*'documents'\s+AND\s+public\.is_admin\(\)\s*\)[\s\S]*WITH\s+CHECK\s*\(\s*bucket_id\s*=\s*'documents'\s+AND\s+public\.is_admin\(\)\s*\)/i,
  'admin storage policy must allow profile-backed admins to write document objects'
);

assert.match(
  adminDetailPage,
  /useParams<\{\s*id:\s*string\s*\}>\(\)/,
  'Next client route must read dynamic id via useParams()'
);

assert.doesNotMatch(
  adminDetailPage,
  /params\.id/,
  'admin detail page must not synchronously read params.id in Next 16'
);

assert.match(
  adminDetailPage,
  /crypto\.randomUUID\(\)/,
  'document upload paths must use collision-resistant IDs'
);

assert.match(
  adminDetailPage,
  /dbError[\s\S]*storage[\s\S]*\.remove\(\[filePath\]\)/,
  'failed document metadata inserts must roll back uploaded storage objects'
);

assert.match(
  adminDetailPage,
  /onClick=\{\(\)\s*=>\s*handleDeleteDocument\(doc\)\}/,
  'document delete button must remove document records instead of being a no-op'
);

assert.match(
  adminListPage,
  /\(c\.company_name\s*\|\|\s*''\)\.toLowerCase\(\)/,
  'admin list search must tolerate legacy clients without company_name'
);

assert.match(
  dashboardPage,
  /profile\?\.company_name\s*\|\|\s*client\?\.company_name\s*\|\|\s*'your organization'/,
  'client dashboard should prefer company_name from profiles'
);

console.log('critical contracts verified');
