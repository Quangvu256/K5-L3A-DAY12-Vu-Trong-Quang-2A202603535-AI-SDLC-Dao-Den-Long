import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

function runBin(bin, args, capture = false) {
  const opts = {
    stdio: capture ? 'pipe' : 'inherit',
    encoding: capture ? 'utf8' : undefined,
  };
  if (process.platform === 'win32') {
    return execFileSync('cmd.exe', ['/d', '/s', '/c', bin, ...args], opts);
  }
  return execFileSync(bin, args, opts);
}

console.log('=== [1/5] Core Purity Guard ===');
runBin('node', ['scripts/check-core-purity.mjs']);

console.log('\n=== [2/5] TypeScript Typecheck ===');
runBin('npm', ['run', 'typecheck']);

console.log('\n=== [3/5] Unit & Contract Tests (Vitest) ===');
runBin('npm', ['test']);

console.log('\n=== [4/5] Headless Scenario Execution & Determinism Double-Check ===');
const scenariosDir = resolve('scenarios');
const scenarioFiles = readdirSync(scenariosDir)
  .filter((f) => f.endsWith('.json'))
  .sort();

if (scenarioFiles.length === 0) {
  throw new Error('No scenario files found in scenarios/.');
}

for (const file of scenarioFiles) {
  const fullPath = resolve(scenariosDir, file);
  const out1 = runBin('npx', ['tsx', 'src/headless/cli.ts', '--scenario', fullPath], true);
  const out2 = runBin('npx', ['tsx', 'src/headless/cli.ts', '--scenario', fullPath], true);

  if (out1 !== out2) {
    throw new Error(`Determinism mismatch for scenario ${file}!`);
  }

  const parsed = JSON.parse(out1);
  console.log(
    `[OK] ${file} -> level=${parsed.levelId}, status=${parsed.status}, ticks=${parsed.ticksElapsed}, lanterns=${parsed.lanternsLit}/${parsed.lanternsTotal}, digest=${parsed.digestSha256.slice(0, 12)}...`
  );
}

console.log('\n=== [5/5] Verification Gate PASSED ===');
