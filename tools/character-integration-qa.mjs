/* Actual Chrome browser checks against an isolated LOCAL origin. No application test hooks. */
import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,writeFile,readdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const base=(process.env.BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,''),out=process.env.CHARACTER_QA_OUTPUT||'/tmp/character-integration';
const baseline=process.env.CHARACTER_BASELINE==='1',pause=ms=>new Promise(r=>setTimeout(r,ms));
await mkdir(out,{recursive:true});
const report={browser:null,baseline,dpr:1,mode:'isolated LOCAL trial; no Firebase writes; viewport emulation, not real mobile hardware',screenshots:[],checks:[],metrics:[],errors:[]};
const profile=await mkdtemp(join(tmpdir(),'hw-character-'));
const chrome=spawn(process.env.CHROME_PATH||'google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=9335',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
let ws,send,evaluate,capture;
try{
 let target;for(let n=0;n<100;n++){try{const res=await fetch('http://127.0.0.1:9335/json/new?about:blank',{method:'PUT'});if(res.ok){target=await res.json();break;}}catch{}await pause(100);}assert.ok(target,'Chrome started');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true});});
 let seq=0;const requests=new Map();
 ws.addEventListener('message',event=>{const r=JSON.parse(event.data);if(r.id){const p=requests.get(r.id);if(p){requests.delete(r.id);clearTimeout(p.timer);r.error?p.reject(Error(r.error.message)):p.resolve(r.result);}return;}if(r.method==='Runtime.exceptionThrown')report.errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);});
 send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{requests.delete(id);reject(Error('CDP timeout: '+method));},25000);requests.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
 evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 const wait=async(expression,label,limit=18000)=>{const start=Date.now();while(Date.now()-start<limit){try{if(await evaluate(expression))return;}catch{}await pause(60);}throw Error('Timed out: '+label);};
 const check=async(expression,label)=>{assert.ok(await evaluate(expression),label);report.checks.push(label);};
 const click=async selector=>{await wait(`Boolean(document.querySelector(${JSON.stringify(selector)}))`,selector);await evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(b.disabled)throw Error('Disabled: '+${JSON.stringify(selector)});b.click();})()`);};
 const settled=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 capture=async(name,delay=100)=>{if(delay)await pause(delay);const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(out,name+'.png'),Buffer.from(result.data,'base64'));report.screenshots.push(name+'.png');};
 const viewport=(width,height=844)=>send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
 const navigate=async(url=base+'/?mode=local&demo=1#/home')=>{
  await send('Page.navigate',{url:'about:blank'});await wait("location.href==='about:blank'",'clean context');
  await send('Page.navigate',{url});await wait("document.readyState==='complete'&&Boolean(window.HeatherWordUI&&window.HeatherWordSeason2)&&window.HeatherWordUI.getSnapshot().wordCount===60",'fresh app ready');await evaluate('document.fonts.ready');await settled();
 };
 const screen=async name=>{await evaluate(`window.HeatherWordUI.openLegacy(${JSON.stringify(name)})`);await settled();};
 const back=async()=>{await evaluate('window.HeatherWordSeason2.close();window.HeatherWordUI.backToShell()');await settled();};
 const detail=async id=>{await evaluate('window.HeatherWordSeason2.open("collection")');await click(`[data-s2-action="character-detail"][data-character-id="${id}"]`);await settled();};
 await Promise.all([send('Page.enable'),send('Runtime.enable'),send('Network.enable')]);
 report.browser=(await send('Browser.getVersion')).product;await send('Network.setCacheDisabled',{cacheDisabled:true});
 await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:out});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [width,height] of [[1440,900],[390,844],[320,844]]){
  await viewport(width,height);await send('Storage.clearDataForOrigin',{origin:new URL(base).origin,storageTypes:'local_storage,session_storage'});await navigate();
  const ready=await evaluate('performance.now()');await pause(250);
  report.metrics.push({width,height,screen:'home',readyMs:ready,resources:await evaluate('performance.getEntriesByType("resource").filter(r=>r.name.startsWith(location.origin)).map(r=>({path:r.name.replace(location.origin,""),bytes:r.encodedBodySize,duration:r.duration}))')});
  await capture(`home-${width}`);
  for(const tab of ['learn','games','collection','my']){await evaluate(`window.HeatherWordUI.setTab(${JSON.stringify(tab)})`);await settled();await check('document.querySelector("#hw9Content").scrollWidth<=document.querySelector("#hw9Content").clientWidth+1',`shell ${tab} fits ${width}`);if(tab==='my')await capture(`profile-${width}`);}
  for(const name of ['dress','shop','pet','collection']){
   const started=Date.now();await screen(name);
   const renderMs=Date.now()-started;
   if(name==='dress')await wait('!!document.querySelector("#avatarGame canvas")&&document.querySelector("#avatarGame").classList.contains("ready")','Phaser ready',20000);
   await pause(150);report.metrics.push({width,screen:name,renderMs,readyMs:Date.now()-started,nodes:await evaluate('document.querySelectorAll("#monsterGrid .monster-tile").length')});await capture(`${name}-${width}`);
   if(name==='collection'&&!baseline){await check('document.querySelectorAll("#monsterGrid .monster-tile").length===60','XP collection page contains 60 of 1000');for(let i=0;i<16;i++)await click('#monsterGrid [data-legacy-page]:last-child:not(:disabled)');await check('document.querySelector("#monsterGrid").textContent.includes("#1000")','XP #1000 remains accessible');}
   await back();
  }
  await evaluate('window.HeatherWordSeason2.open("starter")');await capture(`starter-${width}`);
  await evaluate('window.HeatherWordSeason2.open("collection")');await check('document.querySelector(".s2-content").scrollWidth<=document.querySelector(".s2-content").clientWidth+1',`Season 2 fits ${width}`);await capture(`season2-collection-${width}`);await back();
 }
 // Capture the actual served catalog, including baseline, with the same font and size.
 const sheet=async({name,cards,cols=6,width=1200,height=2400,artSize=160})=>{
  await send('Page.navigate',{url:'about:blank'});await wait("location.href==='about:blank'",'sheet context');await viewport(width,height);
  const html=`<html lang="ko"><head><meta charset="utf-8"><style>body{margin:0;padding:20px;box-sizing:border-box;background:#f5f2ea;font:13px 'Noto Sans CJK KR',sans-serif;display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:12px}article{min-width:0;text-align:center;background:#fff;border-radius:16px;padding:8px;break-inside:avoid}svg{display:block;width:100%;height:${artSize}px}b,small{display:block;word-break:keep-all}small{font-size:10px;color:#54635c;margin-top:4px}</style></head><body>${cards.map(c=>`<article>${c.svg}<b>${c.name}</b><small>${c.caption||''}</small></article>`).join('')}</body></html>`;
  const tree=await send('Page.getFrameTree');await send('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html});await capture(name,200);
 };
 await navigate();
 const served=await evaluate(`(async()=>{const c=await import(${JSON.stringify(base+'/monster-catalog-season2.js')});return c.SEASON2_CATALOG.map(x=>({...x,svg:c.renderMonsterSvg(x),silhouette:c.renderMonsterSvg(x,{locked:true})}));})()`);
 await sheet({name:'all-60',cards:served.map(c=>({svg:c.svg,name:c.name,caption:c.speciesId+' · '+c.evolutionStage})),height:2400,artSize:180});
 await sheet({name:'silhouettes-20',cards:served.filter(c=>c.evolutionStage===1).map(c=>({svg:c.silhouette,name:c.speciesId})),cols:5,width:1100,height:1000,artSize:175});
 if(!baseline){
  // Rich fixture is seeded only in the disposable demo key; the normal LOCAL key is a sentinel.
  await viewport(390);await navigate();
  const initial=await evaluate('JSON.parse(localStorage.getItem("heather_word_demo_v1"))');
  const fixture=structuredClone(initial);fixture.player={...fixture.player,name:'수첩 탐험가',xp:3250,coin:4000,sound:false,ownedPets:{mellow_cat:true},equippedPet:'mellow_cat',ownedItems:{crown:true},equippedItem:'crown'};
  const parts=await evaluate('window.HEATHER_AVATAR_PARTS');
  fixture.player.ownedAvatarItems=Object.fromEntries(parts.filter(p=>p.id!=='outfit_queen_10').map(p=>[p.id,true]));
  fixture.player.equippedAvatar={background:'background_studio_01',body:'body_basic_01',face:'face_round_01',hair:'hair_twintail_03',top:'top_sky_01',bottom:'bottom_denim_01',outfit:'outfit_cookie_03',shoes:'shoes_cookie_01',accessory:'accessory_glasses_02',effect:''};
  const bear='s2_cookie_crumb_bear_1';fixture.player.season2={...fixture.player.season2,starterClaimed:true,partnerId:bear,evolutionMaterials:11,monsterAffinity:{[bear]:{points:80,wordsStudied:16}},season2Collection:Object.fromEntries(served.filter(c=>c.evolutionStage===1&&!['dragon','space'].includes(c.worldId)).map(c=>[c.id,true])),activityLog:[{type:'starter',characterId:bear,at:'2026-09-05T10:00:00Z'}],settings:{ageBand:'easy',reducedMotion:false,autoTts:false,timerEnabled:false},dailyAdventure:{}};
  const seed=async()=>{await navigate();await evaluate(`localStorage.setItem('heather_word_v3','ordinary-local-sentinel');localStorage.removeItem('heather_word_demo_v1');localStorage.setItem('heather_word_demo_v1',${JSON.stringify(JSON.stringify(fixture))});`);await navigate();};
  for(const [width,height] of [[1440,900],[390,844]]){
   await viewport(width,height);await seed();await capture(`owned-home-${width}`);await evaluate('window.HeatherWordUI.setTab("my")');await capture(`owned-profile-${width}`);
   await screen('dress');await wait('document.querySelector("#avatarGame canvas")&&document.querySelector("#avatarGame").classList.contains("ready")','owned dress');await pause(300);await capture(`owned-dress-${width}`);
   await check('document.querySelector("#dressAvatarPreview .hw-avatar")!==null',`DOM avatar fallback exists ${width}`);
   const beforeLook=await evaluate('JSON.stringify(window.HeatherWordLegacyBridge.getSnapshot().player.equippedAvatar)');
   // Previewing the unowned queen outfit is visual only.
   const queen=parts.find(p=>p.slot==='outfit'&&p.id.endsWith('_10'));await click(`[data-avatar-preview-id="${queen.id}"]`);await settled();
   assert.equal(await evaluate('JSON.stringify(window.HeatherWordLegacyBridge.getSnapshot().player.equippedAvatar)'),beforeLook);
   await check(`!window.HeatherWordLegacyBridge.getSnapshot().player.ownedAvatarItems[${JSON.stringify(queen.id)}]`,'unowned preview does not become ownership');await capture(`dress-preview-${width}`);
   await click('#saveAvatarBtn');assert.equal(await evaluate('JSON.stringify(window.HeatherWordLegacyBridge.getSnapshot().player.equippedAvatar)'),beforeLook);report.checks.push('save clears preview without equipping an unowned item');
   const correctSvg=await evaluate('(()=>{const template=document.createElement("template");template.innerHTML=window.HeatherAvatarArt.renderAvatarSvg(window.HeatherWordLegacyBridge.getSnapshot().player.equippedAvatar,window.HEATHER_AVATAR_PARTS,{label:"나의 탐험가 코디"});return template.innerHTML;})()');
   assert.equal(await evaluate('document.querySelector("#dressAvatarPreview").innerHTML'),correctSvg);report.checks.push('DOM preview equals canonical avatar SVG');
   await click('#downloadAvatarBtn');await pause(400);assert.ok((await readdir(out)).some(p=>p.startsWith('heather-avatar')&&p.endsWith('.png')),'PNG download exists');
   await back();await detail(bear);await capture(`detail-${width}`);
   await check('document.querySelector(".s2-content").textContent.includes("2026")','credible acquisition date displayed');
   await click('[data-s2-action="evolve"]');await wait('!!document.querySelector(".hw-character-reveal[open]")','evolution reveal');await capture(`evolution-${width}`,60);
   await check('window.HeatherWordSeason2.getState().evolutionMaterials===8','evolution debits once before reveal');await click('[data-reveal-skip]');await capture(`evolution-revealed-${width}`);await click('[data-reveal-close]');
   await navigate();await check('window.HeatherWordSeason2.getState().season2Collection.s2_cookie_crumb_bear_2===true&&window.HeatherWordSeason2.getState().evolutionMaterials===8','evolution survives reload without a second charge');
   await detail('s2_cookie_crumb_bear_2');await click('[data-s2-action="evolve"]');await click('[data-reveal-close]');await check('window.HeatherWordSeason2.getState().evolutionMaterials===0','final evolution keeps exact existing cost');
   await evaluate('window.HeatherWordSeason2.open("adventure")');await click('[data-s2-action="start-stage"][data-stage-index="0"]');await capture(`study-${width}`);
   let session=await evaluate('window.HeatherWordSeason2.getState().dailyAdventure.session');let question=session.questions[session.index];
   const answer=async()=>{
    const s=await evaluate('window.HeatherWordSeason2.getState().dailyAdventure.session');const q=s.questions[s.index];const word=initial.words.find(w=>w.id===q.wordId).word;
    if(q.mode==='choice'&&!s.retryMode)await click(`[data-s2-action="answer-choice"][data-word-id="${q.wordId}"]`);
    else if(q.mode==='block'&&!s.retryMode)await evaluate(`(()=>{for(const ch of ${JSON.stringify(word.toUpperCase().replace(/[^A-Z]/g,''))}){const b=[...document.querySelectorAll('[data-s2-action="add-block"]')].find(x=>x.textContent.trim().toUpperCase()===ch);if(!b)throw Error('letter missing');b.click();}document.querySelector('[data-s2-action="check-block"]').click();})()`);
    else await evaluate(`(()=>{document.querySelector('[data-s2-answer-input]').value=${JSON.stringify(word)};document.querySelector('[data-s2-action="submit-input"]').click();})()`);
   };
   if(question.mode==='choice'){await evaluate(`document.querySelector('[data-s2-action="answer-choice"]:not([data-word-id="${question.wordId}"])').click()`);await capture(`wrong-${width}`);await check('!!document.querySelector(".s2-study-partner[data-reaction=review]")','gentle wrong-answer reaction');await click('[data-s2-action="retry-question"]');}
   await answer();await capture(`correct-${width}`,20);await check('!!document.querySelector(".s2-study-partner[data-reaction=correct]")','correct reaction is tied to answer');await pause(800);
   for(let n=0;n<12;n++){const s=await evaluate('window.HeatherWordSeason2.getState().dailyAdventure.session');if(s.completed)break;await answer();await pause(800);}
   await check('window.HeatherWordSeason2.getState().dailyAdventure.session.completed','stage completed through real answers');await capture(`stage-clear-${width}`);await back();
   // Hatch both a rare and a legendary friend through real controls using isolated readiness fixtures.
   for(const [world,label] of [['space','rare'],['dragon','legendary']]){
    await evaluate(`(()=>{const e=JSON.parse(localStorage.getItem('heather_word_demo_v1'));const s=structuredClone(e.player.season2||e.player.progress.__season2);s.incubatingEgg={worldId:${JSON.stringify(world)},progress:100,hatchCount:0};if(${JSON.stringify(world)}==='space')s.season2Collection.s2_space_comet_hound_1=true;s.revision=(s.revision||0)+10;e.player.season2=s;e.player.progress={...e.player.progress,__season2:s};localStorage.setItem('heather_word_demo_v1',JSON.stringify(e));})()`);
    await navigate();await evaluate('window.HeatherWordSeason2.open("egg")');await click('[data-s2-action="hatch"]');await wait('!!document.querySelector(".hw-character-reveal[open]")',label+' reveal');await click('[data-reveal-skip]');await capture(`${label}-unlock-${width}`);await click('[data-reveal-close]');
   }
   await check("localStorage.getItem('heather_word_v3')==='ordinary-local-sentinel'",'trial writes never touch ordinary LOCAL');
   await back();await screen('pet');await capture(`owned-pet-${width}`);await back();await screen('shop');await capture(`owned-shop-${width}`);await back();
  }
  // Offline Phaser failure keeps the already selected SVG and independent PNG exporter available.
  await send('Network.setBlockedURLs',{urls:['*phaser*']});await navigate();await screen('dress');await wait('document.querySelector("#avatarGame").classList.contains("failed")','Phaser failure fallback',20000);await capture('phaser-fallback-390');await check('getComputedStyle(document.querySelector("#dressAvatarPreview")).display!=="none"','fallback is visible');await click('#downloadAvatarBtn');await send('Network.setBlockedURLs',{urls:[]});
  await navigate();await evaluate('window.HeatherWordUI.setTab("home")');await check('[...document.querySelectorAll(".is-live")].every(x=>getComputedStyle(x).animationName==="none")','reduced motion stops live character loops');
  // Art QA sheets: real export sources, no production ownership changes.
  const avatarCards=await evaluate(`(async()=>{const a=await import(${JSON.stringify(base+'/character-avatar.js')});return window.HEATHER_AVATAR_PARTS.map(p=>({name:p.name,caption:p.slot+' · '+p.rarity,svg:a.renderAvatarItemSvg(p,window.HEATHER_AVATAR_PARTS)}));})()`);
  await sheet({name:'all-avatar-items-56',cards:avatarCards,cols:7,width:1400,height:2160,artSize:190});
  await sheet({name:'species-evolutions-20',cards:served.map(c=>({svg:c.svg,name:c.name,caption:c.speciesId+' · '+c.evolutionStage})),cols:3,width:900,height:5000,artSize:170});
  const sample=[served.find(c=>c.speciesId==='crumb_bear'&&c.evolutionStage===1),served.find(c=>c.speciesId==='gear_bot'&&c.evolutionStage===3),served.find(c=>c.speciesId==='ember_drake'&&c.evolutionStage===3)];
  for(const size of [64,128,256])await sheet({name:`size-${size}`,cards:sample.map(c=>({svg:c.svg,name:c.name})),cols:3,width:Math.max(500,size*3+110),height:size+130,artSize:size});
 }
 assert.equal(report.errors.length,0,'no uncaught browser exceptions');report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;try{if(capture)await capture('failure',0);if(evaluate)report.failurePage=await evaluate('({url:location.href,text:document.body.innerText.slice(0,9000)})');}catch{}}
finally{report.generatedAt=new Date().toISOString();await writeFile(join(out,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));ws?.close();chrome.kill('SIGTERM');}
