import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function runCapture(bin, args) {
  if (process.platform === 'win32') {
    return execFileSync('cmd.exe', ['/d', '/s', '/c', bin, ...args], { encoding: 'utf8' });
  }
  return execFileSync(bin, args, { encoding: 'utf8' });
}

const phaseArg = process.argv[2];
if (!phaseArg || !/^[1-4]$/.test(phaseArg)) {
  console.error('Usage: node scripts/capture-proof.mjs <1|2|3|4>');
  process.exit(1);
}

const proofDir = resolve('docs', 'proof', `phase-${phaseArg}`);
mkdirSync(proofDir, { recursive: true });

console.log(`Capturing real proof artifacts into ${proofDir}...`);

const verifyOut = runCapture('npm', ['run', 'verify']);
writeFileSync(resolve(proofDir, 'verify-output.txt'), verifyOut, 'utf8');

const scenariosDir = resolve('scenarios');
const scenarioFiles = readdirSync(scenariosDir)
  .filter((f) => f.endsWith('.json'))
  .sort();

const determinismLines = [];
for (const file of scenarioFiles) {
  const fullPath = resolve(scenariosDir, file);
  const outPath = resolve(proofDir, `scenario-${file.replace('.json', '')}.out.json`);
  const run1 = runCapture('npx', ['tsx', 'src/headless/cli.ts', '--scenario', fullPath, '--pretty', '--out', outPath]);
  const run2 = runCapture('npx', ['tsx', 'src/headless/cli.ts', '--scenario', fullPath, '--pretty']);
  const parsed1 = JSON.parse(run1);
  const parsed2 = JSON.parse(run2);
  const match = run1 === run2 && parsed1.digestSha256 === parsed2.digestSha256;
  determinismLines.push(
    `${file} | status=${parsed1.status} | ticks=${parsed1.ticksElapsed} | match=${match} | sha256=${parsed1.digestSha256}`
  );
  if (!match) {
    throw new Error(`Determinism check failed during proof capture for ${file}`);
  }
}

writeFileSync(resolve(proofDir, 'determinism.txt'), `${determinismLines.join('\n')}\n`, 'utf8');
console.log(`Proof capture for Phase ${phaseArg} completed cleanly.`);
