import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const page = readFileSync(new URL('../app/(portal)/admin/clients/[id]/page.tsx', import.meta.url), 'utf8');

test('admin client detail page unwraps route params with useParams', () => {
  assert.match(page, /import \{ useParams \} from 'next\/navigation';/);
  assert.match(page, /const \{ id: clientId \} = useParams<\{ id: string \}>\(\);/);
  assert.doesNotMatch(page, /params\.id/);
});

test('document upload rolls back storage objects when metadata insert fails', () => {
  assert.match(page, /async function handleDocumentUpload\(file: File\)/);
  assert.match(page, /if \(dbError\) \{[\s\S]*\.from\('documents'\)[\s\S]*\.remove\(\[filePath\]\)/);
  assert.match(page, /setUploadErrorMessage\('Upload failed while saving document metadata\. Please try again\.'\)/);
});
