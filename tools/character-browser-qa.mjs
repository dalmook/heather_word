import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {SEASON2_CATALOG,renderMonsterSvg} from '../monster-catalog-season2.js';
const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const out=process.env.CHARACTER_QA_OUTPUT||'audit/characters';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
await mkdir(out,{recursive:true});
const report={screenshots:[],checks:[],metrics:[],errors:[],mode:'isolated LOCAL trial; no Firebase writes',dpr:1};
const dir=await mkdtemp(join(tmpdir(),'character-browser-'));
const browser=spawn(process.env.CHROME_PATH||'google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=9333',`--user-data-dir=${dir}`,'about:blank'],{stdio:'ignore'});
let ws;
try {
 let target;for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:9333/json/new?about:blank',{method:'PUT'});if(r.ok){target=await r.json();break;}}catch{}await pause(100);}
 assert.ok(target,'Chromium started');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
 let seq=0;const pending=new Map();
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}return;}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 const capture=async name=>{await pause(250);const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(out,name+'.png'),Buffer.from(r.data,'base64'));report.screenshots.push(name+'.png');};
 await Promise.all([send('Page.enable'),send('Runtime.enable'),send('Network.enable')]);
 report.browser=(await send('Browser.getVersion')).product;
 await send('Network.setCacheDisabled',{cacheDisabled:true});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [width,height] of [[1440,900],[390,844],[320,844]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
  const start=Date.now();await send('Page.navigate',{url:base+'/?mode=local&demo=1#/home'});
  let ready=false;for(let i=0;i<200;i++){if(await evaluate('Boolean(window.HeatherWordUI&&window.HeatherWordSeason2)')){ready=true;break;}await pause(100);}assert.ok(ready,'app ready');
  report.metrics.push({width,height,readyMs:Date.now()-start,resources:await evaluate('performance.getEntriesByType("resource").filter(r=>r.name.startsWith(location.origin)).map(r=>({name:r.name.replace(location.origin,""),duration:r.duration,bytes:r.encodedBodySize}))')});
  await capture(`home-${width}`);
  await evaluate('window.HeatherWordUI.setTab("my")');await capture(`profile-${width}`);
  for(const screen of ['dress','shop','pet','collection']){
   const t=Date.now();await evaluate(`window.HeatherWordUI.openLegacy(${JSON.stringify(screen)})`);
   if(screen==='dress')await pause(1800);
   await capture(`${screen}-${width}`);
   report.metrics.push({screen,width,entryMs:Date.now()-t,canvas:await evaluate('!!document.querySelector("#avatarGame canvas")')});
   await evaluate('window.HeatherWordUI.backToShell()');
  }
  await evaluate('window.HeatherWordSeason2.open("starter")');await capture(`starter-${width}`);
  await evaluate('window.HeatherWordSeason2.open("collection")');await capture(`season2-collection-${width}`);
  const overflow=await evaluate('document.querySelector(".s2-content").scrollWidth-document.querySelector(".s2-content").clientWidth');
  report.checks.push({name:`collection overflow ${width}`,overflow});
  assert.ok(overflow<=1,`collection fits ${width}`);
  await evaluate('window.HeatherWordSeason2.close()');
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1200,height:2840,deviceScaleFactor:1,mobile:false});
 const sheet='<style>body{margin:0;padding:22px;box-sizing:border-box;background:#f5f2ea;font:14px sans-serif;display:grid;grid-template-columns:repeat(6,1fr);gap:12px}article{text-align:center;background:white;border-radius:16px;padding:8px}svg{display:block;width:100%;height:180px}b,small{display:block}small{font-size:11px;color:#54635c;margin-top:4px}</style>'+SEASON2_CATALOG.map(c=>`<article>${renderMonsterSvg(c)}<b>${c.name}</b><small>${c.speciesId} · ${c.evolutionStage}</small></article>`).join('');
 await evaluate(`document.body.innerHTML=${JSON.stringify(sheet)}`);await capture('all-60');
 assert.equal(report.errors.length,0,'no browser exceptions');report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;}
finally{report.generatedAt=new Date().toISOString();await writeFile(join(out,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));ws?.close();browser.kill('SIGTERM');}
