/* Isolated browser geometry and canvas evidence. No production account or data writes. */
import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const base=(process.env.BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,''),out=process.env.CHARACTER_QA_OUTPUT||'/tmp/character-viewport';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
await mkdir(out,{recursive:true});
const profile=await mkdtemp(join(tmpdir(),'character-viewport-'));
const browser=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=9336',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
let ws;const report=[];
try {
 let target;
 for(let n=0;n<100;n++){try{const r=await fetch('http://127.0.0.1:9336/json/new?about:blank',{method:'PUT'});if(r.ok){target=await r.json();break;}}catch{}await pause(100);}
 assert.ok(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
 let id=0;const calls=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data),p=calls.get(m.id);if(p){calls.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const next=++id,timer=setTimeout(()=>{calls.delete(next);reject(Error('CDP timeout '+method));},25000);calls.set(next,{resolve,reject,timer});ws.send(JSON.stringify({id:next,method,params}));});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let n=0;n<250;n++){try{if(await run(expression))return;}catch{}await pause(80);}throw Error('Browser state timeout: '+expression);};
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const width of [1440,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1440?900:844,deviceScaleFactor:1,mobile:width<768});
  await send('Page.navigate',{url:'about:blank'});await wait("location.href==='about:blank'");
  await send('Page.navigate',{url:base+'/?mode=local&demo=1#/home'});await wait('document.readyState==="complete"&&!!window.HeatherWordUI');await pause(300);
  const hero=await run('(()=>{const a=document.querySelector(".kids-speech").getBoundingClientRect(),b=document.querySelector(".hw-character-hero").getBoundingClientRect();return {textBottom:a.bottom,artTop:b.top};})()');
  if(width<768)assert.ok(hero.artTop>=hero.textBottom,'hero art must not overlap copy');
  await run('window.HeatherWordUI.openLegacy("dress")');await wait('document.querySelector("#avatarGame.ready canvas")');await pause(600);
  const state=await run('(()=>{const rect=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,cssWidth:s.width,cssHeight:s.height,margin:s.margin,position:s.position,display:s.display,transform:s.transform,inline:e.getAttribute("style")};};const c=document.querySelector("#avatarGame canvas");return {room:rect(document.querySelector(".phaser-dress-room")),host:rect(document.querySelector("#avatarGame")),canvas:rect(c),backing:{width:c.width,height:c.height},png:c.toDataURL("image/png")};})()');
  await writeFile(join(out,`canvas-${width}.png`),Buffer.from(state.png.split(',')[1],'base64'));delete state.png;
  const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(out,`dress-${width}.png`),Buffer.from(shot.data,'base64'));
  report.push({width,hero,...state});
  assert.ok(state.canvas.width<=state.host.width+1&&state.canvas.height<=state.host.height+1,'canvas CSS bounds fit host');
 }
} catch(error){report.push({failure:error.stack});process.exitCode=1;}
finally{await writeFile(join(out,'viewport-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));ws?.close();browser.kill('SIGTERM');}
