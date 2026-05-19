import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const adminClientPage = readFileSync(
  new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url),
  'utf8'
);

test('admin client detail page resolves the dynamic route id on the client', () => {
  assert.match(
    adminClientPage,
    /import\s+\{\s*useParams\s*\}\s+from\s+'next\/navigation';/,
    'client route components must use Next navigation hooks for dynamic params'
  );

  assert.match(
    adminClientPage,
    /const\s+\{\s*id\s*\}\s*=\s*useParams<\{\s*id:\s*string\s*\}>\(\);/,
    'the admin detail page should derive the client id from useParams()'
  );

  assert.doesNotMatch(
    adminClientPage,
    /params\.id/,
    'direct params.id access can read a Promise in Next 16 and break client id scoping'
  );
});
