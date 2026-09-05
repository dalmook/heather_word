import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,access} from 'node:fs/promises';
import {parentInsights,parentReportView,parentReportText,parentGuideView} from '../ui/parent-insights.js';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const starter=await read('starter-context.js');
function boot(search, initial={}) {
  const values=new Map(Object.entries(initial)),writes=[];
  const window={location:{search,pathname:'/heather_word/',hash:'#/home'},history:{replaceState(_a,_b,path){window.redirect=path;}},localStorage:{getItem:k=>values.get(k)??null,setItem(k,v){values.set(k,v);writes.push(k);}}};
  vm.runInNewContext(starter,{window,URLSearchParams});return {window,values,writes};
}
test('ordinary visits do not seed, mutate or redirect the production learner',()=>{
  const original=JSON.stringify({player:{score:9876},words:[{id:'personal'}]});
  const result=boot('?mode=local',{'heather_word_v3':original});
  assert.deepEqual(result.writes,[]);assert.equal(result.values.get('heather_word_v3'),original);
  assert.equal(result.window.redirect,undefined);assert.equal(result.window.HEATHER_DEMO,false);
});
test('explicit trial supplies 60 unique real words, with zero invented progress, in a separate LOCAL record',()=>{
  const result=boot('?demo=1',{'heather_word_v3':'DO NOT TOUCH'});
  assert.match(result.window.redirect,/mode=local/);assert.equal(result.values.get('heather_word_v3'),'DO NOT TOUCH');
  assert.deepEqual(result.writes,['heather_word_demo_v1']);
  const trial=JSON.parse(result.values.get('heather_word_demo_v1'));
  assert.equal(trial.words.length,60);assert.equal(trial.categories.length,6);
  assert.equal(new Set(trial.words.map(w=>w.id)).size,60);
  assert.equal(new Set(trial.words.map(w=>w.word)).size,60);
  for(const w of trial.words) {assert.ok(w.meaning);assert.match(w.word,/^[a-z]+$/);assert.ok(trial.categories.some(c=>c.id===w.categoryId));}
  assert.equal(trial.player.score,undefined);assert.equal(trial.player.season2,undefined);
});
test('returning trial preserves its exact progress even when data is malformed',()=>{
  for(const saved of ['corrupt but retained',JSON.stringify({player:{score:500,season2:{revision:20}},words:[]})]) {
    const result=boot('?mode=local&demo=1',{'heather_word_demo_v1':saved});
    assert.deepEqual(result.writes,[]);assert.equal(result.values.get('heather_word_demo_v1'),saved);
  }
});
test('all three learning layers and the revision guard select the same isolated namespace',async()=>{
  for(const file of ['app.js','season2.js','ui-v9-core.js','firebase-config.js']) {
    assert.ok((await read(file)).includes('const LOCAL_KEY = globalThis.HEATHER_DEMO ? "heather_word_demo_v1" : "heather_word_v3";'),file);
  }
  const html=await read('index.html');
  assert.ok(html.indexOf('src="./starter-context.js')<html.indexOf('src="./firebase-config.js'));
  assert.ok(html.indexOf('src="./starter-context.js')<html.indexOf('src="./app.js'));
});
test('seven local calendar days exclude old, invalid and future answers without mutating records',()=>{
  const now=new Date(2026,8,5,12,0,0), today=new Date(2026,8,5,10).toISOString(), first=new Date(2026,7,30,0).toISOString();
  const snapshot={name:'Heather',words:[],categories:[],season2:{activityLog:[
    {type:'answer',at:today,mode:'choice',result:'correct'},
    {type:'answer',at:today,mode:'choice',result:'wrong'},
    {type:'answer',at:first,mode:'type',result:'skip'},
    {type:'answer',at:new Date(2026,7,29,23,59).toISOString(),result:'correct'},
    {type:'answer',at:new Date(2026,8,5,13).toISOString(),result:'correct'},
    {type:'answer',at:'invalid',result:'correct'},
    {type:'hatch',at:today},{type:'answer',at:today,result:'unknown'}
  ]}};
  const before=JSON.stringify(snapshot),r=parentInsights(snapshot,now);
  assert.equal(r.total,3);assert.equal(r.correct,1);assert.equal(r.accuracy,33);assert.equal(r.activeDays,2);
  assert.equal(r.days[0].total,1);assert.equal(r.days[6].total,2);assert.equal(r.modes[0].accuracy,50);
  assert.equal(JSON.stringify(snapshot),before);
});
test('mastery and review use current words only; level four is not reported as fully mastered',()=>{
  const snapshot={name:'H',words:[{id:'a',word:'apple',meaning:'사과',categoryId:'c'},{id:'b',word:'book',meaning:'책',categoryId:'c'}],categories:[{id:'all'},{id:'c',name:'단어'}],season2:{wordMastery:{a:{level:5,correct:5},b:{level:4,wrong:3,correct:1},deleted:{level:5,wrong:20}}}};
  const r=parentInsights(snapshot);
  assert.equal(r.mastered,1);assert.equal(r.dueWords.length,1);assert.equal(r.dueWords[0].id,'b');assert.equal(r.categories[0].percent,50);
});
test('empty reports stay honest, escape user text and expose no fake paid checkout',()=>{
  const snapshot={name:'<img src=x onerror=alert(1)>',words:[],categories:[],season2:{}};
  const r=parentInsights(snapshot);assert.equal(r.accuracy,null);assert.equal(r.activeDays,0);
  const html=parentReportView(snapshot,{icon:()=>''});
  assert.doesNotMatch(html,/<img src=x/);assert.match(html,/&lt;img/);assert.match(html,/아직 기록 없음/);
  assert.match(parentReportText(r),/정답률 기록 없음/);
  assert.match(parentGuideView({icon:()=>''}),/아직 판매하지 않아요/);
});
test('new production assets resolve under the Pages subpath',async()=>{
  for(const file of ['starter-context.js','ui/parent-insights.js','ui/explorers.css','assets/art/adventure-forest.webp']) await access(new URL('../'+file,import.meta.url));
});
