import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const loginPage = readFileSync('app/(auth)/login/page.tsx', 'utf8');

test('demo credentials are hidden unless explicitly enabled', () => {
  assert.match(
    loginPage,
    /const showDemoCredentials = process\.env\.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';/,
    'login page must default demo credential helpers off behind an explicit public flag',
  );

  const demoBlockIndex = loginPage.indexOf('{showDemoCredentials && (');
  const adminEmailIndex = loginPage.indexOf('admin@pcm.com');
  const demoPasswordIndex = loginPage.indexOf("setPassword('password')");

  assert.notEqual(demoBlockIndex, -1, 'demo credential UI must be gated');
  assert(
    adminEmailIndex > demoBlockIndex,
    'admin demo email should only appear inside the gated demo block',
  );
  assert(
    demoPasswordIndex > demoBlockIndex,
    'demo password fill should only appear inside the gated demo block',
  );
});
