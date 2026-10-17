export type Environment =
  Readonly<{ mode: 'demo' }> | Readonly<{ mode: 'live'; origin: string }>;
export function parseEnvironment(
  env: Record<string, string | undefined>,
): Environment {
  const mode = env.DATA_MODE ?? 'demo';
  if (mode === 'demo') return { mode };
  if (mode !== 'live') throw new Error('DATA_MODE must be demo or live.');
  let url: URL;
  try {
    url = new URL(env.API_BASE_URL ?? '');
  } catch {
    throw new Error('Live mode requires a valid API_BASE_URL origin.');
  }
  const testLoopback =
    env.STARTER_E2E === '1' &&
    url.protocol === 'http:' &&
    ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname);
  if (
    (!testLoopback && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'API_BASE_URL must be an HTTPS origin without credentials, path, query or fragment.',
    );
  }
  return { mode, origin: url.origin };
}
