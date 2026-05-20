import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(
  new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url),
  'utf8'
);

test('admin document upload rolls back storage when the database record is not saved', () => {
  assert.match(pageSource, /async function handleDocumentUpload/);
  assert.match(pageSource, /const \{ error: dbError \} = await supabase\s*\.from\('documents'\)\s*\.insert/s);
  assert.match(
    pageSource,
    /if \(dbError\) \{[\s\S]*?supabase\.storage\s*\.from\('documents'\)\s*\.remove\(\[filePath\]\)/,
  );
  assert.match(pageSource, /setDocumentError\('The upload could not be saved\. Please try again\.'\)/);
});

test('admin document upload keeps retry possible after a failure', () => {
  assert.match(pageSource, /finally \{[\s\S]*?setUploading\(false\);[\s\S]*?e\.target\.value = '';/);
  assert.match(pageSource, /onChange=\{handleDocumentUpload\}/);
});
