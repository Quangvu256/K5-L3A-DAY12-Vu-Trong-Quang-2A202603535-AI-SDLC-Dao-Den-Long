import { execFileSync } from 'node:child_process';
import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const hookPath = resolve('.githooks/pre-commit');
const raw = readFileSync(hookPath, 'utf8').replace(/\r\n/g, '\n');
writeFileSync(hookPath, raw, 'utf8');
try {
  chmodSync(hookPath, 0o755);
} catch {
  // Windows NTFS ignores POSIX mode bits cleanly
}

execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
console.log('Git hooks configured: core.hooksPath -> .githooks');
