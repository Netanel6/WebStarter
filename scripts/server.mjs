import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, chmod, unlink } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const [action, mode, ...args] = process.argv.slice(2);
if (!['start', 'stop'].includes(action) || !['dev', 'prod'].includes(mode)) {
  throw new Error('Usage: node scripts/server.mjs <start|stop> <dev|prod>');
}
const id = createHash('sha256').update(root).digest('hex').slice(0, 20);
const directory = path.join(
  os.tmpdir(),
  `web-starter-${process.getuid?.() ?? 'user'}`,
);
await mkdir(directory, { recursive: true, mode: 0o700 });
const socketPath =
  process.platform === 'win32'
    ? `\\\\.\\pipe\\web-starter-${id}`
    : path.join(directory, `${id}.sock`);

function request(command) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);
    let response = '';
    socket.setTimeout(30_000, () =>
      socket.destroy(new Error('Server control timed out.')),
    );
    socket.on('connect', () => socket.write(`${command}\n`));
    socket.on('data', (data) => {
      response += data;
    });
    socket.on('end', () => resolve(response.trim()));
    socket.on('error', reject);
  });
}

let existing;
try {
  existing = await request(action === 'stop' ? `stop:${mode}` : 'status');
} catch (error) {
  if (!['ENOENT', 'ECONNREFUSED'].includes(error.code)) throw error;
  // A refused Unix socket remains after a hard crash. No PID is ever killed.
  if (error.code === 'ECONNREFUSED')
    await unlink(socketPath).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
}
if (action === 'stop') {
  console.log(
    existing ?? `No managed ${mode} server is running for this project.`,
  );
  process.exitCode = existing?.startsWith('Refused') ? 1 : 0;
} else if (existing) {
  console.error(`${existing} Stop it before starting another server.`);
  process.exitCode = 1;
} else {
  let child;
  let stopping = false;
  const waiters = [];
  const server = net.createServer((socket) => {
    socket.setTimeout(2000, () => socket.destroy());
    socket.once('data', (data) => {
      if (data.toString().trim() === `stop:${mode}`) {
        socket.setTimeout(0);
        waiters.push(socket);
        stop();
      } else if (data.toString().trim().startsWith('stop:')) {
        socket.end(
          `Refused: the running server is ${mode}. Use npm run stop${mode === 'dev' ? 'Dev' : 'Prod'}.\n`,
        );
      } else socket.end(`A managed ${mode} server is already running.\n`);
    });
    socket.on('error', () => {});
  });
  function stop() {
    if (stopping) return;
    stopping = true;
    child?.kill('SIGTERM');
  }
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(socketPath, resolve);
  });
  if (process.platform !== 'win32') await chmod(socketPath, 0o600);

  async function run(command, options = []) {
    if (stopping) return 0;
    child = spawn(
      process.execPath,
      [path.join(root, 'node_modules/next/dist/bin/next'), command, ...options],
      {
        cwd: root,
        stdio: 'inherit',
        env: process.env,
      },
    );
    return new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code) => resolve(stopping ? 0 : (code ?? 1)));
    });
  }
  try {
    console.log(
      `Starting ${mode}. Stop with npm run stop${mode === 'dev' ? 'Dev' : 'Prod'} in another terminal, or Ctrl+C here.`,
    );
    let code = mode === 'prod' ? await run('build') : 0;
    if (code === 0 && !stopping)
      code = await run(
        mode === 'dev' ? 'dev' : 'start',
        args.length ? args : ['--port', process.env.PORT ?? '3000'],
      );
    process.exitCode = code;
  } finally {
    for (const socket of waiters) socket.end(`Stopped ${mode} server.\n`);
    server.close();
  }
}
