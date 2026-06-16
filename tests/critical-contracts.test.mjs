import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync('supabase_schema.sql', 'utf8');
const adminListPage = readFileSync('app/(portal)/admin/page.tsx', 'utf8');
const adminDetailPage = readFileSync('app/(portal)/admin/clients/[id]/page.tsx', 'utf8');

test('admin RLS checks the application profile role', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /FROM public\.profiles\s+WHERE id = auth\.uid\(\)\s+AND role = 'admin'/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);
});

test('clients schema supports the shipped admin company-name contract', () => {
  assert.match(schema, /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL[\s\S]*\);/);
  assert.match(adminListPage, /\.from\('clients'\)\s*[\s\S]*\.order\('company_name'/);
  assert.match(adminListPage, /\.insert\(newClient\)/);
});

test('documents bucket is private and failed metadata writes roll back uploaded files', () => {
  assert.match(schema, /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)/);
  assert.match(schema, /ON CONFLICT \(id\) DO UPDATE\s+SET public = false/);
  assert.match(adminDetailPage, /crypto\.randomUUID\(\)/);
  assert.match(adminDetailPage, /\.remove\(\[filePath\]\)/);
  assert.doesNotMatch(adminDetailPage, /Math\.random\(\)/);
});

test('admin client detail uses a resolved Next route id for all scoped writes', () => {
  assert.match(adminDetailPage, /import \{ useParams \} from 'next\/navigation';/);
  assert.match(adminDetailPage, /const clientId = params\.id;/);
  assert.doesNotMatch(adminDetailPage, /function AdminClientDetailPage\(\{ params \}/);

  const staleParamUses = adminDetailPage.match(/params\.id/g) ?? [];
  assert.equal(staleParamUses.length, 1);
});
