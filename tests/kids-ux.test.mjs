import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {availableCategory,homeView,gameArtwork} from '../ui/components.js';
import {deriveSnapshot,missionCta} from '../ui-v9-core.js';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const context={icon:()=>'<svg></svg>',partnerMarkup:()=>'<svg></svg>',missionCta};
test('empty and removed game categories resolve to the visible all option without writing data',()=>{
 for(const selectedCategoryId of ['custom','removed','fruit','all']) {
  const raw={selectedCategoryId,categories:[{id:'fruit',name:'과일'},{id:'custom',name:'내 단어'}],words:[{id:'1',word:'apple',meaning:'사과',categoryId:'fruit'}]};
  const snapshot=deriveSnapshot(raw),before=JSON.stringify(snapshot);
  assert.equal(availableCategory(snapshot),['fruit','all'].includes(selectedCategoryId)?selectedCategoryId:'all');
  assert.equal(JSON.stringify(snapshot),before);
 }
});
test('child journey uses actual four-stage progress and no fabricated rewards',()=>{
 for(const stageIndex of [0,1,2,3,4]) {
  const s=deriveSnapshot({words:[{id:'1',word:'apple'}],player:{season2:{dailyAdventure:{stageIndex,completed:stageIndex===4,stars:[2,0,0,0]}}}});
  const html=homeView(s,context);
  assert.equal((html.match(/<li class="is-done"/g)||[]).length,stageIndex);
  assert.equal((html.match(/aria-current="step"/g)||[]).length,stageIndex===4?0:1);
  assert.match(html,/모은 별 2개/);
  assert.match(html,/data-hw9-action="adventure"/);
 }
});
test('first-use invitation goes to the protected word preparation route',()=>{
 const html=homeView(deriveSnapshot({}),context);
 assert.match(html,/첫 단어장 준비하기/);
 assert.match(html,/보호자와 함께/);
 assert.doesNotMatch(html,/data-hw9-action="adventure"|aria-current="step"/);
});
test('mode illustrations are decorative and all four modes stay available',async()=>{
 const source=await read('ui-v9.js');
 for(const mode of ['choice','block','blank','type']) {assert.match(gameArtwork(mode),/aria-hidden="true"/);assert.ok(source.includes(`mode: "${mode}"`));}
 for(const label of ['단어','놀이','친구','나']) assert.ok(source.includes(`label: "${label}"`));
 assert.ok(source.includes('?.value || availableCategory(app.snapshot)'));
});
test('nonvisual learning engines retain v10 bytes except the explicit trial storage namespace',async()=>{
 const {createHash}=await import('node:crypto');
 const baseline=JSON.parse(await read('tests/fixtures/kids-baseline.json'));
 // app functions, Season 2 interaction functions and renderer data have narrower contract tests.
 const visualFiles=new Set(['app.js','season2.js','monster-catalog-season2.js','avatar-phaser.js']);
 for(const [file,hash] of Object.entries(baseline).filter(([file])=>!visualFiles.has(file))) assert.equal(createHash('sha256').update((await read(file)).replace("const LOCAL_KEY = globalThis.HEATHER_DEMO ? \"heather_word_demo_v1\" : \"heather_word_v3\";", "const LOCAL_KEY = \"heather_word_v3\";")).digest('hex'),hash,file);
});
