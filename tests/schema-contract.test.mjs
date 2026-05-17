import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(new URL('../supabase_schema.sql', import.meta.url), 'utf8');

function tableDefinition(tableName) {
  const match = schema.match(new RegExp(`CREATE TABLE ${tableName} \\(([^;]+)\\);`, 'm'));
  assert.ok(match, `Expected CREATE TABLE ${tableName} to exist`);
  return match[1];
}

test('clients table stores the company name used by admin workflows', () => {
  const clients = tableDefinition('clients');

  assert.match(
    clients,
    /\bcompany_name\s+TEXT\s+NOT\s+NULL\b/i,
    'admin list/create pages insert, sort, search, and render clients.company_name'
  );
});

test('admin policies use profile roles instead of unset JWT role claims', () => {
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/);
  assert.match(schema, /SECURITY DEFINER/);
  assert.match(schema, /FROM public\.profiles[\s\S]+WHERE id = auth\.uid\(\)[\s\S]+AND role = 'admin'/);

  assert.doesNotMatch(
    schema,
    /auth\.jwt\(\)\s*->>\s*'role'\s*=\s*'admin'/,
    'Supabase access tokens expose role=authenticated by default; app authorization is profiles.role'
  );
});

test('admin write policies include explicit profile-backed WITH CHECK clauses', () => {
  const adminPolicyBlocks = schema.match(/CREATE POLICY admin_full_[\s\S]*?(?=\n\nCREATE POLICY|\n\n-- STORAGE|\n\n-- Allow|$)/g) ?? [];

  assert.ok(adminPolicyBlocks.length >= 8, 'Expected admin policies for application tables');

  for (const block of adminPolicyBlocks) {
    assert.match(block, /USING \([^)]*public\.is_admin\(\)[^)]*\)/);
    assert.match(block, /WITH CHECK \([^)]*public\.is_admin\(\)[^)]*\)/);
  }
});
