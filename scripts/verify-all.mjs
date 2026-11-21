import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

if (!existsSync('src') || !existsSync('tests')) {
  console.log('[CP0 verify] Scaffold check passed (src/ and tests/ not yet created).');
  process.exit(0);
}

execSync('npm run typecheck', { stdio: 'inherit' });
execSync('npm test', { stdio: 'inherit' });
