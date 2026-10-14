#!/usr/bin/env node
// Pre-workshop check: `npm run doctor`
// Verifies tools, starts the test database, runs migrations and one test
// at each boundary. Send a screenshot of the final summary to the organiser.
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const results = [];

function run(command) {
  const r = spawnSync(command, { shell: true, encoding: 'utf8' });
  return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
}

function check(name, fn, hint) {
  process.stdout.write(`• ${name} ... `);
  let ok = false;
  let detail = '';
  try {
    [ok, detail] = fn();
  } catch (e) {
    detail = String(e);
  }
  console.log(ok ? `OK ${detail}` : 'FAILED');
  if (!ok) {
    if (detail) console.log(indent(detail));
    if (hint) console.log(indent(`→ ${hint}`));
  }
  results.push({ name, ok });
  return ok;
}

function indent(text) {
  return text
    .split('\n')
    .slice(-15)
    .map((line) => `    ${line}`)
    .join('\n');
}

function step(command) {
  return () => {
    const r = run(command);
    return [r.ok, r.ok ? '' : r.out];
  };
}

console.log('\nElection workshop — environment doctor\n');

const nodeMajor = Number(process.versions.node.split('.')[0]);
check('Node.js >= 24', () => [nodeMajor >= 24, `(v${process.versions.node})`], 'Install Node 24 LTS from https://nodejs.org');
check('git', () => [run('git --version').ok, ''], 'Install git from https://git-scm.com');
check('Docker CLI', () => [run('docker --version').ok, ''], 'Install Docker Desktop, OrbStack or Colima');
const dockerUp = check('Docker daemon running', () => [run('docker info').ok, ''], 'Start Docker Desktop (or `colima start`) and retry');
check('Docker Compose v2', () => {
  const r = run('docker compose version --short');
  return [r.ok, r.ok ? `(v${r.out})` : r.out];
}, 'Update Docker Desktop, or install the docker-compose-plugin');

if (dockerUp) {
  check('Start test database', step('npm run db:up:test'), 'Is port 5433 already used? Stop the other Postgres and retry');
  check('Liquibase migrations', step('npm run db:migrate:test'), 'First run downloads images — check your internet connection');
  check('Unit test', step('npx jest --selectProjects unit'));
  check('Integration test', step('npx jest --selectProjects integration --runInBand'));
}

const failed = results.filter((r) => !r.ok);
console.log('\n────────────────────────────────────────');
console.log(`OS       : ${os.type()} ${os.release()} (${os.arch()})`);
console.log(`Node     : v${process.versions.node}`);
console.log(`Checks   : ${results.length - failed.length}/${results.length} passed`);
console.log(failed.length === 0 ? '✅ READY for the workshop — take a screenshot of this!' : '❌ NOT READY — fix the FAILED items above, then run `npm run doctor` again');
console.log('────────────────────────────────────────\n');
process.exit(failed.length === 0 ? 0 : 1);
