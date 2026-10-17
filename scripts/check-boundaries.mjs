import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve('src');
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.tsx?$/.test(file)) files.push(file);
  }
}
walk(root);
const graph = new Map();
const errors = [];
const relative = (file) => path.relative(root, file).split(path.sep).join('/');
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const imports = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      imports.push(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      imports.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const name = relative(file);
  const resolved = imports.flatMap((specifier) => {
    const base = specifier.startsWith('@/')
      ? path.join(root, specifier.slice(2))
      : specifier.startsWith('.')
        ? path.resolve(path.dirname(file), specifier)
        : null;
    if (!base) return [];
    const found = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, 'index.ts'),
    ].find((candidate) => files.includes(candidate));
    return found ? [found] : [];
  });
  graph.set(file, { source, imports, resolved });
  for (const dependency of resolved) {
    const target = relative(dependency);
    if (name.startsWith('core/') && /^(app|feature)\//.test(target))
      errors.push(`${name} -> ${target}: core cannot depend on app/features`);
    if (
      name.includes('/domain/') &&
      !target.includes('/domain/') &&
      !target.startsWith('core/result/')
    )
      errors.push(`${name} -> ${target}: domain boundary`);
    if (
      name.includes('/presentation/') &&
      (target.startsWith('app/') || target.includes('/data/'))
    )
      errors.push(`${name} -> ${target}: presentation boundary`);
    if (
      name.includes('/data/') &&
      (target.startsWith('app/') || target.includes('/presentation/'))
    )
      errors.push(`${name} -> ${target}: data boundary`);
    const feature = name.match(/^feature\/([^/]+)/)?.[1];
    const targetFeature = target.match(/^feature\/([^/]+)/)?.[1];
    if (feature && targetFeature && feature !== targetFeature)
      errors.push(
        `${name} -> ${target}: cross-feature dependency requires an explicit shared contract`,
      );
  }
  if (
    name.includes('/domain/') &&
    imports.some((value) => /^(react|next|server-only)(\/|$)/.test(value))
  )
    errors.push(`${name}: framework import in domain`);
}
for (const [entry, metadata] of graph) {
  if (!/^['"]use client['"];/.test(metadata.source)) continue;
  const visited = new Set();
  function check(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const entryInfo = graph.get(file);
    if (
      entryInfo.imports.includes('server-only') ||
      /\.server\.tsx?$/.test(file)
    )
      errors.push(`${relative(entry)} reaches server module ${relative(file)}`);
    for (const dependency of entryInfo.resolved) check(dependency);
  }
  check(entry);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Boundary checks passed for ${files.length} source files.`);
