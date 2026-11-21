import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { runScenario } from './contract';

interface CliArgs {
  scenarioPath: string;
  outPath?: string;
  pretty: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  let scenarioPath = '';
  let outPath: string | undefined;
  let pretty = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--scenario' && i + 1 < argv.length) {
      scenarioPath = argv[i + 1];
      i += 1;
    } else if (arg === '--out' && i + 1 < argv.length) {
      outPath = argv[i + 1];
      i += 1;
    } else if (arg === '--pretty') {
      pretty = true;
    }
  }

  if (!scenarioPath) {
    throw new Error('Usage: npm run headless -- --scenario <path> [--out <path>] [--pretty]');
  }

  return { scenarioPath, outPath, pretty };
}

function main(): void {
  const { scenarioPath, outPath, pretty } = parseArgs(process.argv.slice(2));
  const rawJson = readFileSync(resolve(scenarioPath), 'utf8');
  const scenario = JSON.parse(rawJson) as unknown;
  const result = runScenario(scenario);
  const serialized = pretty ? `${JSON.stringify(result, null, 2)}\n` : `${JSON.stringify(result)}\n`;

  if (outPath) {
    const absOut = resolve(outPath);
    mkdirSync(dirname(absOut), { recursive: true });
    writeFileSync(absOut, serialized, 'utf8');
  }

  process.stdout.write(serialized);
}

try {
  main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[headless error] ${message}\n`);
  process.exit(1);
}
