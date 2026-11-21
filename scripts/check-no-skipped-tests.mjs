import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const FORBIDDEN_SKIPS = [
  { name: '.skip(', regex: /\b(?:describe|it|test)\.skip\s*\(/ },
  { name: 'xit(', regex: /\bxit\s*\(/ },
  { name: 'xtest(', regex: /\bxtest\s*\(/ },
  { name: 'xdescribe(', regex: /\bxdescribe\s*\(/ },
];

const testsDir = resolve('tests');
const files = readdirSync(testsDir)
  .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
  .sort();

const violations = [];
for (const file of files) {
  const fullPath = join(testsDir, file);
  const content = readFileSync(fullPath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    for (const rule of FORBIDDEN_SKIPS) {
      if (rule.regex.test(line)) {
        violations.push(`tests/${file}:${idx + 1} contains forbidden [${rule.name}]: ${line.trim()}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('No-Skipped-Tests Guard FAILED:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log(`[No-Skipped-Tests Guard] OK (${files.length} test files checked, 0 skipped tests).`);
