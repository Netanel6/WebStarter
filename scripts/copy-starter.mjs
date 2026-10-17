import {
  cp,
  mkdir,
  readFile,
  readdir,
  writeFile,
  access,
  lstat,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const source = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const destinationArg = process.argv[2];
if (!destinationArg)
  throw new Error(
    'Usage: npm run starter:copy -- ../my-project [package-name]',
  );
const destination = path.resolve(destinationArg);
const name =
  process.argv[3] ??
  path.basename(destination).toLowerCase().replaceAll(' ', '-');
if (!/^[a-z][a-z0-9-]*$/.test(name))
  throw new Error(
    'Use a lowercase package name containing letters, numbers and hyphens.',
  );
const relative = path.relative(source, destination);
if (
  !relative ||
  (!relative.startsWith(`..${path.sep}`) &&
    relative !== '..' &&
    !path.isAbsolute(relative))
)
  throw new Error('Destination must be outside the starter folder.');
try {
  await access(destination);
  throw new Error(
    'Destination already exists. Choose a new folder; no files were changed.',
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const allowed = new Set([
  'src',
  'tests',
  'contracts',
  'docs',
  'scripts',
  'public',
  '.github',
  'README.md',
  'AGENTS.md',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.ts',
  'next-env.d.ts',
  'eslint.config.mjs',
  'vitest.config.ts',
  'playwright.config.ts',
  'integration-manifest.json',
  '.gitignore',
  '.gitattributes',
  '.prettierignore',
  '.prettierrc.json',
  '.editorconfig',
  '.env.example',
  '.nvmrc',
  '.node-version',
  '.npmrc',
]);
await mkdir(destination, { recursive: true });
for (const entry of await readdir(source, { withFileTypes: true })) {
  if (!allowed.has(entry.name) || entry.isSymbolicLink()) continue;
  await cp(path.join(source, entry.name), path.join(destination, entry.name), {
    recursive: true,
    filter: async (file) => {
      const base = path.basename(file);
      return (
        !(await lstat(file)).isSymbolicLink() &&
        base !== '.DS_Store' &&
        (!base.startsWith('.env') || base === '.env.example')
      );
    },
  });
}
for (const file of ['package.json', 'package-lock.json']) {
  const target = path.join(destination, file);
  const json = JSON.parse(await readFile(target, 'utf8'));
  json.name = name;
  if (json.packages?.['']) json.packages[''].name = name;
  await writeFile(target, `${JSON.stringify(json, null, 2)}\n`);
}
const productFile = path.join(destination, 'src/core/config/product.ts');
const title = name
  .split('-')
  .filter(Boolean)
  .map((part) => part[0].toUpperCase() + part.slice(1))
  .join(' ');
const product = await readFile(productFile, 'utf8');
await writeFile(
  productFile,
  product.replace(/name: '[^']*'/, `name: '${title}'`),
);
await writeFile(
  path.join(destination, 'docs/PROJECT_CONTEXT.md'),
  `# ${title} project context\n\nCreated from Web Starter. The copied application includes the removable demo catalog.\n\n## Product setup\n\n- Product purpose/users: TODO.\n- API and environments: demo by default; configure deliberately.\n- Features/business rules: replace or remove the catalog sample.\n- Validation: not yet run in this copy; source validation does not validate this product.\n- CI/release/hosting: configure for this repository.\n\nFollow [the adoption guide](ADOPTION.md) and update this file with actual evidence.\n`,
);
console.log(
  `Created ${destination} with package name ${name}.\nRun npm ci and npm run dev there. No dependencies, secrets, Git history or build output were copied.`,
);
