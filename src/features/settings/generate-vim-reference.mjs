// Regenerate after upgrading @replit/codemirror-vim.
import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL(import.meta.resolve('@replit/codemirror-vim-core')), 'utf8');

function readTable(name) {
  const literal = source.match(new RegExp(`var ${name} = (\\[[\\s\\S]+?\\n  \\]);`))?.[1];
  if (!literal) throw new Error(`Could not find the Vim engine's ${name} table`);
  return runInNewContext(literal, Object.create(null), { timeout: 100 });
}

const bindings = readTable('defaultKeymap').map((entry) => [
  entry.keys,
  entry.context ?? 'Default',
  entry.toKeys ? `Alias for ${entry.toKeys}` : (entry.action ?? entry.operator ?? entry.motion ?? entry.type),
]);

for (const command of readTable('defaultExCommandMap')) {
  const keys = command.shortName ? `:${command.shortName} / :${command.name}` : `:${command.name}`;
  bindings.push([keys, 'Ex', command.name === 'write' ? 'Save and score' : command.name]);
}

const body = bindings.map((entry) => `  ${JSON.stringify(entry)},`).join('\n');
const file = '// Generated from the Vim engine. Run node src/features/settings/generate-vim-reference.mjs to update.\n'
  + `export const vimBindings: readonly (readonly [string, string, string])[] = [\n${body}\n];\n`;
writeFileSync(new URL('vim-reference.ts', import.meta.url), file);
console.log(`Indexed ${bindings.length} Vim bindings.`);
