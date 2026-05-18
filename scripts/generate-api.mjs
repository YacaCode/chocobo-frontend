import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = process.env.CHOC0BO_BACKEND_REPO ?? process.env.CHOCOBO_BACKEND_REPO ?? 'seu-usuario/chocobo-backend';
const input = resolve('openapi.yaml');
const output = resolve('src/app/api/generated');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(input)) {
  console.log(`openapi.yaml nao encontrado. Baixando a release mais recente de ${repo}...`);
  run('gh', ['release', 'download', '--repo', repo, '--pattern', 'openapi.yaml', '--clobber']);
}

mkdirSync(dirname(output), { recursive: true });

run('openapi-generator-cli', [
  'generate',
  '-i',
  input,
  '-g',
  'typescript-angular',
  '-o',
  output,
  '--additional-properties=providedInRoot=true,ngVersion=18.0.0,serviceSuffix=ApiService'
]);
