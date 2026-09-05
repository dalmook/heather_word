import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const base=process.env.BASE_URL || 'http://127.0.0.1:4173/heather_word';
const out=process.env.UI_QA_OUTPUT || 'audit/after';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const report={checks:[],consoleWarnings:[],consoleErrors:[],screenshots:[]};
await mkdir(out,{recursive:true});
const dir=await mkdtemp(join(tmpdir(),'heather-visual-'));
const browser=spawn(process.env.CHROME_PATH || 'google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port=9444',`--user-data-dir=${dir}`,'about:blank'],{stdio:'ignore'});
let ws;
try {
  let target;
  for(let i=0;i<100;i++) {
    try {const r=await fetch('http://127.0.0.1:9444/json/new?about:blank',{method:'PUT'});if(r.ok){target=await r.json();break;}} catch {}
    await pause(100);
  }
  if(!target) throw new Error('Chrome did not start');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  let sequence=0;const pending=new Map();
  ws.addEventListener('message',event=>{
    const data=JSON.parse(event.data);
    if(data.id){const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(new Error(data.error.message)):p.resolve(data.result);}return;}
    if(data.method==='Runtime.consoleAPICalled') {
      const {type,args=[]}=data.params;const text=args.map(x=>x.value??x.description??'').join(' ');
      if(type==='warning')report.consoleWarnings.push(text);
      if(type==='error')report.consoleErrors.push(text);
    }
    if(data.method==='Log.entryAdded') {
      const e=data.params.entry;if(e.level==='warning')report.consoleWarnings.push(e.text);
      if(e.level==='error')report.consoleErrors.push(e.text);
    }
    if(data.method==='Runtime.exceptionThrown')report.consoleErrors.push(data.params.exceptionDetails.text);
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result?.value;};
  const capture=async name=>{await pause(300);const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(out,name),Buffer.from(r.data,'base64'));report.screenshots.push(name);};
  await Promise.all([send('Page.enable'),send('Runtime.enable'),send('Log.enable')]);
  await send('Page.navigate',{url:`${base}/?mode=local#/home`});
  let ready=false;
  for(let i=0;i<200;i++){if(await evaluate('Boolean(window.HeatherWordUI&&window.HeatherWordSeason2)')){ready=true;break;}await pause(100);}
  assert.ok(ready,'Both app APIs load');
  for(const width of [360,390,430,768,1440]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:width>=768?1000:844,deviceScaleFactor:1,mobile:width<768});
    for(const tab of ['home','learn','games','collection','my']) {
      await evaluate(`document.querySelector('[data-hw9-tab="${tab}"]').click()`);await pause(300);
      const rect=await evaluate("(()=>{const main=document.querySelector('#hw9Content');const title=main.querySelector('h1');return {color:getComputedStyle(title).color,overflow:main.scrollWidth-main.clientWidth}})()");
      assert.equal(rect.color,'rgb(32, 37, 55)',`${width}/${tab} heading`);
      assert.ok(rect.overflow<=1,`${width}/${tab} horizontal overflow`);
      report.checks.push(`${width}/${tab}: heading and overflow`);
      if(tab==='home'||(width===390&&tab==='games'))await capture(`verified-${tab}-${width}.png`);
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate("window.HeatherWordSeason2.open('settings')");await pause(300);
  const layout=await evaluate("(()=>{const c=document.querySelector('.s2-content').getBoundingClientRect();const n=document.querySelector('.s2-nav').getBoundingClientRect();return {contentHeight:c.height,contentBottom:c.bottom,navTop:n.top,navHeight:n.height}})()");
  assert.ok(layout.contentHeight>400&&layout.navTop>=layout.contentBottom-1&&layout.navHeight<120,'Adventure scroll region and bottom navigation');
  report.checks.push('adventure settings: content and bottom navigation');
  await capture('verified-settings-390.png');
  await evaluate("window.HeatherWordSeason2.close()");
  // Real pointer dispatch, not an element.click(), verifies navigation hit testing.
  const targetPoint=await evaluate("(()=>{const e=document.querySelector('[data-hw9-tab=learn]');const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...targetPoint});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...targetPoint});await pause(300);
  assert.equal(await evaluate("document.querySelector('#hw9App').dataset.tab"),'learn');
  report.checks.push('real pointer navigation hit target');
  assert.equal(report.consoleErrors.length,0,'No runtime or console errors');
  report.passed=true;
} catch(error) {report.passed=false;report.failure=error.stack;process.exitCode=1;}
finally {report.generatedAt=new Date().toISOString();await writeFile(join(out,'visual-qa.json'),JSON.stringify(report,null,2));ws?.close();browser.kill('SIGTERM');}
