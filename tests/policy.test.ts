import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readRepositoryFile(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('manifest uses only approved least-privilege permissions', async () => {
  const manifest = JSON.parse(
    await readRepositoryFile('src/manifest.json'),
  ) as Record<string, unknown>;

  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, [
    'activeTab',
    'clipboardWrite',
    'scripting',
  ]);
  assert.equal('host_permissions' in manifest, false);
  assert.equal('optional_host_permissions' in manifest, false);
  assert.equal('content_scripts' in manifest, false);
  assert.equal('background' in manifest, false);
});

test('collector avoids prohibited data and network surfaces', async () => {
  const inspectorSource = await readRepositoryFile('src/inspector.ts');
  const forbiddenPatterns = [
    /document\.cookie/,
    /localStorage\.getItem/,
    /sessionStorage\.getItem/,
    /\bfetch\s*\(/,
    /new\s+WebSocket/,
    /new\s+EventSource/,
    /new\s+XMLHttpRequest/,
    /indexedDB\.open/,
    /chrome\.cookies/,
    /chrome\.debugger/,
    /chrome\.webRequest/,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(inspectorSource, pattern);
  }
});

test('inspection executes in the isolated world', async () => {
  const popupSource = await readRepositoryFile('src/popup/popup.ts');

  assert.match(popupSource, /world:\s*'ISOLATED'/);
  assert.doesNotMatch(popupSource, /world:\s*'MAIN'/);
});
