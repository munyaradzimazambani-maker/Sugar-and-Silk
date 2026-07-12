import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const schema = readProjectFile('supabase_schema.sql');
const adminDetailPage = readProjectFile('app/(portal)/admin/clients/[id]/page.tsx');
const loginPage = readProjectFile('app/(auth)/login/page.tsx');

assert.match(
  schema,
  /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*SECURITY DEFINER/,
  'schema must define a SECURITY DEFINER helper for profile-backed admin checks',
);
assert.doesNotMatch(
  schema,
  /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
  'admin policies must not use the Supabase JWT role claim as an app role',
);
assert.match(
  schema,
  /company_name TEXT NOT NULL/,
  'clients table must include the company_name column used by admin and dashboard queries',
);
assert.match(
  schema,
  /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO UPDATE SET public = false/,
  'documents storage bucket must be provisioned as private',
);
assert.match(
  schema,
  /CREATE POLICY admin_full_storage_access ON storage\.objects[\s\S]*bucket_id = 'documents' AND public\.is_admin\(\)/,
  'storage admin policy must use the same profile-backed admin check',
);

assert.match(
  adminDetailPage,
  /useParams<\{ id: string \}>/,
  'admin detail route must unwrap dynamic route params via useParams',
);
assert.doesNotMatch(
  adminDetailPage,
  /function AdminClientDetailPage\(\{ params \}/,
  'admin detail route must not read dynamic params from synchronous props',
);
assert.match(
  adminDetailPage,
  /crypto\.randomUUID\(\)/,
  'document upload paths must use collision-resistant IDs',
);
assert.doesNotMatch(
  adminDetailPage,
  /Math\.random\(\)/,
  'document upload paths must not use Math.random',
);
assert.match(
  adminDetailPage,
  /\.remove\(\[filePath\]\)/,
  'document uploads must remove storage objects if metadata insert fails',
);
assert.match(
  adminDetailPage,
  /setUploadError\('Upload failed while saving the document record\. Please try again\.'\)/,
  'document metadata failures must surface a user-visible error',
);

assert.match(
  loginPage,
  /NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'/,
  'demo credential helpers must be behind an explicit public feature flag',
);
assert.match(
  loginPage,
  /\{enableDemoLogin && \(/,
  'demo credential UI must not render unless the feature flag is enabled',
);
