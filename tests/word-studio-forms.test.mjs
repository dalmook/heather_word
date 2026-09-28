import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateBackup} from '../word-studio/store.js';
const source=fs.readFileSync('word-studio/app.js','utf8');
test('editor submit identity is not shadowed by the word ID input',()=>{
  assert.match(source,/form\.getAttribute\('id'\)/);
  assert.doesNotMatch(source,/\bform\.id\b/);
});
test('secondary editor actions explicitly avoid native form submission',()=>{
  assert.ok(source.includes('<button type="button" class="ws-btn ${kind}"'));
  assert.ok(source.includes('id="typeAnswer" name="typeAnswer"'));
});
test('restoring a backup preserves deliberately hidden words',()=>{
  const p=validateBackup({format:'heather-word-studio',schemaVersion:1,entries:[{id:'hidden-word',word:'book',meaning:'책',hidden:true}],images:[],progress:[],meta:[]});
  assert.equal(p.entries[0].hidden,true);
});
