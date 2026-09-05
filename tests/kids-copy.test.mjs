import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../ui-v9.js',import.meta.url),'utf8');
test('blank mode instruction asks for the entire word required by the preserved engine',()=>{
  assert.match(source,/blank: "힌트를 보고 단어 전체를 써 봐!"/);
  assert.doesNotMatch(source,/빈칸에 들어갈 글자를 써 봐/);
});
test('no scheduled review does not claim an unperformed completion',()=>{
  assert.doesNotMatch(source,/복습은 다 했어!/);
  assert.match(source,/새 단어를 만나 볼까/);
});
