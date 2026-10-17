import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
const files = [
  'README.md',
  'AGENTS.md',
  ...readdirSync('docs')
    .filter((name) => name.endsWith('.md'))
    .map((name) => `docs/${name}`),
];
let links = 0;
const errors = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if ((text.match(/^```/gm)?.length ?? 0) % 2)
    errors.push(`${file}: unbalanced fences`);
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^https?:/.test(target)) continue;
    const [name, anchor] = target.split('#');
    const resolved = name
      ? path.resolve(path.dirname(file), name)
      : path.resolve(file);
    links++;
    if (!existsSync(resolved)) {
      errors.push(`${file}: missing ${target}`);
      continue;
    }
    if (anchor) {
      const headings = [
        ...readFileSync(resolved, 'utf8').matchAll(/^#{1,6} (.+)$/gm),
      ].map((match) =>
        match[1]
          .toLowerCase()
          .replace(/[^\w -]/g, '')
          .replaceAll(' ', '-'),
      );
      if (!headings.includes(anchor))
        errors.push(`${file}: missing anchor ${target}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Documentation checks passed: ${files.length} files, ${links} local links.`,
  );
