import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const FORBIDDEN_PATTERNS = [
  { name: 'Math.random', regex: /\bMath\.random\s*\(/ },
  { name: 'Date.now', regex: /\bDate\.now\s*\(/ },
  { name: 'performance.now', regex: /\bperformance\.now\s*\(/ },
  { name: 'new Date', regex: /\bnew\s+Date\b/ },
  { name: 'window access', regex: /\bwindow\./ },
  { name: 'document access', regex: /\bdocument\./ },
  { name: 'three import', regex: /from\s+['"]three['"]/ },
  { name: 'node:* import', regex: /from\s+['"]node:/ },
];

const coreDir = resolve('src', 'core');
const files = readdirSync(coreDir)
  .filter((f) => f.endsWith('.ts'))
  .sort();

const violations = [];
for (const file of files) {
  const fullPath = join(coreDir, file);
  const content = readFileSync(fullPath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    for (const rule of FORBIDDEN_PATTERNS) {
      if (rule.regex.test(line)) {
        violations.push(`src/core/${file}:${idx + 1} violates [${rule.name}]: ${line.trim()}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Core Purity Guard FAILED:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log(`[Core Purity Guard] OK (${files.length} files in src/core/ verified pure & deterministic).`);
