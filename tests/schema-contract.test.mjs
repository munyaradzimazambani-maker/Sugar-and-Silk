import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');

test('admin RLS uses the app role stored on profiles', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /FROM public\.profiles[\s\S]*role = 'admin'/);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/);
});

test('clients table exposes the company_name column used by admin and dashboard pages', () => {
  assert.match(schema, /CREATE TABLE clients \([\s\S]*company_name TEXT NOT NULL[\s\S]*\);/);
});

test('documents storage bucket is provisioned by the schema', () => {
  assert.match(schema, /INSERT INTO storage\.buckets \(id, name, public\)[\s\S]*VALUES \('documents', 'documents', false\)/);
});
