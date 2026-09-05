import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Lightweight delimiter validation catches malformed grid/minmax declarations
// without adding a build-time dependency to the static Pages application.
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
test('all design system stylesheets have balanced syntax delimiters', async () => {
  for (const path of ['ui/tokens.css','ui/components.css','ui/layout.css','ui/legacy.css','ui/explorers.css']) {
    const text = (await read(path)).replace(/\/\*[\s\S]*?\*\//g,'').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'');
    const stack=[];
    for (const character of text) {
      if ('({['.includes(character)) stack.push(character);
      if (')}]'.includes(character)) assert.equal(stack.pop(), {')':'(', '}':'{', ']':'['}[character], path);
    }
    assert.equal(stack.length, 0, path);
  }
});
test('headings and adventure navigation use explicit readable layout contracts', async () => {
  assert.match(await read('ui/layout.css'), /\.hw9-view-heading h1\s*\{\s*color:var\(--color-text-primary\)/);
  const legacy=await read('ui/legacy.css');
  assert.match(legacy, /\.s2-content\s*\{\s*grid-row:\s*2/);
  assert.match(legacy, /\.s2-nav\s*\{\s*grid-row:\s*3/);
});
