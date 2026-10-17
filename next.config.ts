import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
import { parseEnvironment } from './src/core/config/environment';

// Validate configuration during build/start without making a network request.
parseEnvironment(process.env);
const config: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
  poweredByHeader: false,
};
export default config;
