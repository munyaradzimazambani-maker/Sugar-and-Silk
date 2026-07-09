import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const schema = read('supabase_schema.sql');
const adminListPage = read('app/(portal)/admin/page.tsx');
const adminDetailPage = read('app/(portal)/admin/clients/[id]/page.tsx');
const loginPage = read('app/(auth)/login/page.tsx');

assert.match(
  schema,
  /CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*FROM public\.profiles[\s\S]*role = 'admin'/,
  'schema must authorize admins from profiles.role',
);

assert.doesNotMatch(
  schema,
  /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
  'admin policies must not depend on Supabase JWT role claims',
);

const adminPolicyNames = [
  'profiles',
  'clients',
  'maturity',
  'roadmap',
  'kpis',
  'documents',
  'tasks',
  'activity',
];

for (const name of adminPolicyNames) {
  assert.match(
    schema,
    new RegExp(`CREATE POLICY admin_full_access_${name}[\\s\\S]*USING \\(public\\.is_admin\\(\\)\\)[\\s\\S]*WITH CHECK \\(public\\.is_admin\\(\\)\\)`),
    `admin policy for ${name} must use public.is_admin() for reads and writes`,
  );
}

assert.match(
  schema,
  /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL/,
  'clients table must expose company_name used by the admin UI',
);

assert.match(
  schema,
  /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)[\s\S]*ON CONFLICT \(id\) DO UPDATE SET public = false;/,
  'documents bucket must be provisioned as private',
);

assert.match(
  schema,
  /CREATE POLICY admin_full_storage_access[\s\S]*USING \(bucket_id = 'documents' AND public\.is_admin\(\)\)[\s\S]*WITH CHECK \(bucket_id = 'documents' AND public\.is_admin\(\)\)/,
  'admin storage policy must use profile-backed admin checks',
);

assert.match(
  adminListPage,
  /c\.company_name \|\| ''/,
  'admin client search must tolerate existing clients without a company name',
);

assert.match(
  adminDetailPage,
  /import \{ useParams \} from 'next\/navigation';/,
  'client route page must use useParams in this client component',
);

assert.match(
  adminDetailPage,
  /const \{ id: clientId \} = useParams<\{ id: string \}>/,
  'client detail page must unwrap the dynamic id with useParams',
);

assert.doesNotMatch(
  adminDetailPage,
  /params\.id|function AdminClientDetailPage\(\{ params \}/,
  'client detail page must not read Next 16 params synchronously',
);

assert.match(
  adminDetailPage,
  /async function handleDocumentUpload\(file: File\)[\s\S]*\.upload\(filePath, file\)[\s\S]*if \(dbError\) \{[\s\S]*\.remove\(\[filePath\]\)/,
  'document upload must remove storage objects when DB metadata insert fails',
);

assert.match(
  adminDetailPage,
  /crypto\.randomUUID\(\)/,
  'document upload paths must be collision resistant',
);

assert.match(
  loginPage,
  /NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'/,
  'demo credential autofill must be gated behind an explicit public flag',
);

assert.match(
  loginPage,
  /\{showDemoCredentials && \(/,
  'demo credential UI must only render when the flag is enabled',
);

console.log('critical contracts passed');
