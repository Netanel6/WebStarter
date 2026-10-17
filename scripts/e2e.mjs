import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { readFile } from 'node:fs/promises';
let scenario = { kind: 'success' };
let count = 0;
const fixtures = JSON.parse(
  await readFile(
    new URL('../tests/support/e2e-catalog.json', import.meta.url),
    'utf8',
  ),
);
const server = createServer(async (req, res) => {
  if (req.url === '/control' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    scenario = JSON.parse(body);
    count = 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
    return;
  }
  if (req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count }));
    return;
  }
  if (req.url !== '/v1/catalog') {
    res.writeHead(404);
    res.end();
    return;
  }
  count++;
  const current = { ...scenario };
  if (current.delay) await delay(current.delay);
  const status =
    current.kind === 'server'
      ? 503
      : current.kind === 'missing-service'
        ? 404
        : current.kind === 'rate'
          ? 429
          : 200;
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...(current.kind === 'rate' ? { 'Retry-After': '1' } : {}),
  });
  res.end(
    JSON.stringify(
      current.kind === 'empty'
        ? { items: [] }
        : current.kind === 'malformed'
          ? { items: [{ id: 'broken' }] }
          : current.items
            ? { items: current.items }
            : fixtures,
    ),
  );
});
const children = new Set();
function launch(args, env) {
  const child = spawn(process.execPath, args, { stdio: 'inherit', env });
  children.add(child);
  child.once('exit', () => children.delete(child));
  return child;
}
async function run(args, env) {
  const child = launch(args, env);
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error(`${args.join(' ')} exited ${code}`);
}
const env = {
  ...process.env,
  DATA_MODE: 'live',
  API_BASE_URL: 'http://127.0.0.1:4318',
  STARTER_E2E: '1',
  STARTER_PRIVATE_PROBE: 'web-starter-secret-sentinel',
  NEXT_TELEMETRY_DISABLED: '1',
};
async function cleanup() {
  for (const child of children) child.kill('SIGTERM');
  await Promise.all([...children].map((child) => once(child, 'exit')));
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
process.once('SIGINT', () => {
  void cleanup().then(() => process.exit(130));
});
try {
  server.listen(4318, '127.0.0.1');
  await once(server, 'listening');
  await run(['node_modules/next/dist/bin/next', 'build'], env);
  if (count !== 0) throw new Error(`Build made ${count} upstream requests.`);
  const app = launch(
    [
      'node_modules/next/dist/bin/next',
      'start',
      '--hostname',
      '127.0.0.1',
      '--port',
      '4317',
    ],
    env,
  );
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (app.exitCode !== null)
      throw new Error('Production server exited before readiness.');
    try {
      const response = await fetch('http://127.0.0.1:4317/api/catalog');
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for the owned server. */
    }
    await delay(200);
  }
  if (!ready) throw new Error('Production server did not become ready.');
  await run(
    ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
    env,
  );
} finally {
  await cleanup();
}
