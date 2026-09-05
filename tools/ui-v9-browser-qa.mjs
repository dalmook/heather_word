import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { UI_V9_VERSION } from "../ui-v9-core.js";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
const outputDir = resolve(process.env.UI_QA_OUTPUT || "audit/after");
const port = Number(process.env.CHROME_DEBUG_PORT || 9333);
const errors = [], consoleErrors = [], consoleWarnings = [], networkErrors = [];
const fixture = {
  selectedCategoryId: "fruit",
  categories: [{id:"all",name:"전체",emoji:""},{id:"fruit",name:"과일과 간식",emoji:""},{id:"family",name:"우리 가족과 아주 긴 카테고리 이름",emoji:""},{id:"school",name:"학교",emoji:""},{id:"custom",name:"직접 추가",emoji:""}],
  words: [
    {id:"apple",word:"apple",meaning:"사과",categoryId:"fruit",emoji:"🍎"},
    {id:"banana",word:"banana",meaning:"바나나",categoryId:"fruit",emoji:"🍌"},
    {id:"cookie",word:"cookie",meaning:"쿠키",categoryId:"fruit",emoji:"🍪"},
    {id:"mother",word:"mother",meaning:"엄마",categoryId:"family",emoji:""},
    {id:"father",word:"father",meaning:"아빠",categoryId:"family",emoji:""},
    {id:"classroom",word:"classroom",meaning:"교실",categoryId:"school",emoji:""},
    {id:"pneumo",word:"pneumonoultramicroscopicsilicovolcanoconiosis",meaning:"매우 긴 영어 단어",categoryId:"custom",emoji:""}
  ],
  player: {
    name:"Heather의 아주 긴 사용자 이름",score:30976,coin:10000,xp:321000,combo:2,bestCombo:48,sound:false,
    progress: {
      apple:{correct:7,wrong:2,skip:1},banana:{correct:1,wrong:3,skip:0},
      __season2: {
        schemaVersion:8,revision:18,partnerId:"s2_cookie_crumb_bear_1",discoveryPoints:44,evolutionMaterials:3,
        season2Collection:{s2_cookie_crumb_bear_1:true},
        wordMastery:{apple:{level:5,wrong:2,correct:7,nextReviewAt:"2026-08-30T00:00:00.000Z"},banana:{level:1,wrong:3,correct:1,nextReviewAt:"2026-09-03T00:00:00.000Z"}},
        studyStreak:{current:5,best:12,protectedDays:1},
        dailyAdventure:{date:"2026-08-31",stageIndex:2,stars:[3,2,0,0],completed:false,rewardTokens:[],session:{id:"qa"}},
        weeklyProgress:{weekKey:"2026-08-31",activeDays:["2026-08-27","2026-08-28"],adventures:2,bosses:1},
        incubatingEgg:{worldId:"cookie",progress:68,hatchCount:0},
        settings:{ageBand:"challenge",reducedMotion:false,autoTts:false,timerEnabled:false},
        monsterAffinity:{},achievements:{},titles:{},endgameProgress:{masteryStars:1,completedWorlds:[]},worldProgress:{},honorCollection:{},activityLog:[],answerTokens:[]
      }
    },
    knownCards:{apple:true},questionHistory:{},dailyMission:{date:"2026-08-31",cardViews:5,gameCorrect:3,writingAttempts:1,rewarded:false},
    ownedItems:{},equippedItem:"",ownedAvatarItems:{body01:true,face01:true,hair01:true,outfit01:true},
    equippedAvatar:{body:"body01",face:"face01",hair:"hair01",outfit:"outfit01",accessory:""},
    ownedThemes:{},equippedTheme:"",ownedPets:{pet_panda:true},equippedPet:"pet_panda",petCare:{xp:50,mood:70,hunger:40,foods:{}},rewardClaims:[]
  }
};
function commandExists(name) {return spawnSync("bash",["-lc",`command -v ${name}`],{encoding:"utf8"}).stdout.trim();}
function chromePath() {return process.env.CHROME_BIN || commandExists("google-chrome") || commandExists("chromium") || commandExists("chromium-browser");}
function delay(ms) {return new Promise(resolve=>setTimeout(resolve,ms));}
async function waitFor(predicate,message,timeout=15000,interval=80) {
  const started=Date.now();while(Date.now()-started<timeout) {if(await predicate())return;await delay(interval);}throw new Error(`Timeout: ${message}`);
}
class Cdp {
  constructor(url) {this.url=url;this.ws=null;this.id=0;this.pending=new Map();this.listeners=new Map();}
  async connect() {
    this.ws=new WebSocket(this.url);
    await new Promise((resolve,reject)=>{this.ws.addEventListener("open",resolve,{once:true});this.ws.addEventListener("error",reject,{once:true});});
    this.ws.addEventListener("message",event=>{
      const message=JSON.parse(String(event.data));
      if(message.id) {const pending=this.pending.get(message.id);if(!pending)return;this.pending.delete(message.id);if(message.error)pending.reject(new Error(message.error.message));else pending.resolve(message.result||{});return;}
      for(const listener of this.listeners.get(message.method)||[])listener(message.params||{});
    });
  }
  send(method,params={}) {const id=++this.id;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
  on(method,listener) {const list=this.listeners.get(method)||[];list.push(listener);this.listeners.set(method,list);}
  close() {this.ws?.close();}
}
async function jsonFetch(url,options={}) {const response=await fetch(url,options);if(!response.ok)throw new Error(`${response.status} ${url}`);return response.json();}
async function evaluate(cdp,expression,awaitPromise=true) {
  const result=await cdp.send("Runtime.evaluate",{expression,awaitPromise,returnByValue:true,userGesture:true});
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||"Runtime exception");return result.result?.value;
}
async function screenshot(cdp,filename) {
  await delay(250);
  const result=await cdp.send("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:false});
  await writeFile(join(outputDir,filename),Buffer.from(result.data,"base64"));
}
async function setViewport(cdp,width,height) {
  await cdp.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<800,screenWidth:width,screenHeight:height});
  await cdp.send("Emulation.setTouchEmulationEnabled",{enabled:width<800,maxTouchPoints:5});
}
async function click(cdp,selector) {return evaluate(cdp,`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return false;el.click();return true;})()`);}
async function load(cdp,url) {
  await cdp.send("Page.navigate",{url});
  await waitFor(async()=>await evaluate(cdp,"document.readyState === 'complete'"),`document load ${url}`);
  await waitFor(async()=>await evaluate(cdp,`document.body?.dataset?.hw9Version === ${JSON.stringify(UI_V9_VERSION)}`),"UI ready",30000);
  await waitFor(async()=>await evaluate(cdp,"Boolean(window.HeatherWordUI && window.HeatherWordLegacyBridge)"),"public UI bridges",20000);
}
async function setTab(cdp,tab) {
  await evaluate(cdp,`window.HeatherWordUI.setTab(${JSON.stringify(tab)})`);
  await waitFor(async()=>await evaluate(cdp,`document.querySelector('[data-hw9-tab="${tab}"]')?.getAttribute('aria-current') === 'page'`),`tab ${tab}`);
}
function answerForMeaning(meaning) {return fixture.words.find(word=>word.meaning===meaning)?.word||"";}
async function answerCurrentChoice(cdp) {
  const meaning=await evaluate(cdp,"document.querySelector('.question-meaning')?.textContent.trim()||''"),answer=answerForMeaning(meaning);
  if(!answer)throw new Error(`No answer for meaning ${meaning}`);
  const ok=await evaluate(cdp,`(()=>{const button=[...document.querySelectorAll('[data-word-id]')].find(item=>item.textContent.trim()===${JSON.stringify(answer)});button?.click();return Boolean(button);})()`);
  if(!ok)throw new Error(`Choice not found for ${answer}`);
}
async function answerCurrentText(cdp,answer,correct=true) {
  const value=correct?answer:"definitelywrong";
  const ok=await evaluate(cdp,`(()=>{const input=document.querySelector('#answerInput');if(!input)return false;input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#checkInputBtn')?.click();return true;})()`);
  if(!ok)throw new Error("Text input missing");
}
async function answerCurrentBlock(cdp) {
  const meaning=await evaluate(cdp,"document.querySelector('.question-meaning')?.textContent.trim()||''"),answer=answerForMeaning(meaning).replace(/[^a-z]/gi,"").toUpperCase();
  if(!answer)throw new Error(`No block answer for ${meaning}`);
  const ok=await evaluate(cdp,`(()=>{for(const char of ${JSON.stringify(answer)}){const button=[...document.querySelectorAll('[data-bank-index]')].find(item=>item.textContent.trim().toUpperCase()===char);if(!button)return false;button.click();}document.querySelector('#checkTilesBtn')?.click();return true;})()`);
  if(!ok)throw new Error(`Unable to build block answer ${answer}`);
}
async function openGame(cdp,mode) {
  await evaluate(cdp,`window.HeatherWordUI.openLegacy('game',{mode:${JSON.stringify(mode)},categoryId:'all'})`);
  await waitFor(async()=>await evaluate(cdp,`document.body.classList.contains('hw9-legacy-active') && document.querySelector('#gameScreen')?.classList.contains('active') && document.querySelector('.mode-btn[data-mode="${mode}"]')?.classList.contains('active')`),`game ${mode}`);
}
async function backToShell(cdp) {
  await evaluate(cdp,"window.HeatherWordUI.backToShell()");
  await waitFor(async()=>await evaluate(cdp,"!document.body.classList.contains('hw9-legacy-active') && !document.querySelector('#hw9App')?.hidden"),"return shell");
}
const extendedChecks=[];
async function expectBrowser(cdp,expression,label) {if(!await evaluate(cdp,expression))throw new Error(`Commercial regression: ${label}`);extendedChecks.push(label);}
async function runExtended(cdp) {
  await backToShell(cdp);
  await evaluate(cdp,`(()=>{const e=JSON.parse(localStorage.getItem('heather_word_v3'));e.words=${JSON.stringify(fixture.words)};localStorage.setItem('heather_word_v3',JSON.stringify(e));})()`);
  await cdp.send('Page.reload',{ignoreCache:true});
  await waitFor(async()=>await evaluate(cdp,"Boolean(window.HeatherWordUI)&&Boolean(window.HeatherWordSeason2)"),'extended fixture reload',20000);
  await backToShell(cdp);
  for(const mode of ['block','blank','type']) {
    await openGame(cdp,mode);
    for(let i=0;i<10;i++) {
      if(mode==='block')await answerCurrentBlock(cdp);
      else {const meaning=await evaluate(cdp,"document.querySelector('.question-meaning')?.textContent.trim()||''");await answerCurrentText(cdp,answerForMeaning(meaning));}
      await delay(740);
    }
    await expectBrowser(cdp,"Boolean(document.querySelector('.round-complete'))",`${mode}: 10 questions and completion`);
    await screenshot(cdp,`complete-${mode}.png`);await backToShell(cdp);
  }
  for(const width of [360,390,430,768,1440]) {
    await setViewport(cdp,width,width>=768?1000:844);
    for(const tab of ['home','learn','games','collection','my']) {
      await setTab(cdp,tab);await delay(200);
      await expectBrowser(cdp,"document.querySelector('#hw9Content').scrollWidth <= document.querySelector('#hw9Content').clientWidth+1",`${tab}: no horizontal overflow at ${width}`);
      await expectBrowser(cdp,"[...document.querySelectorAll('.hw9-tabbar button')].every(el=>el.getBoundingClientRect().height>=48)",`navigation targets >=48px at ${width}/${tab}`);
      if([360,430,1440].includes(width))await screenshot(cdp,`${tab}-${width}-commercial.png`);
    }
  }
  await setViewport(cdp,390,844);await setTab(cdp,'games');
  await evaluate(cdp,"(()=>{const s=document.querySelector('[data-hw9-game-category]');s.value='family';s.dispatchEvent(new Event('change',{bubbles:true}));})()");await delay(80);
  await expectBrowser(cdp,"window.HeatherWordUI.getSnapshot().selectedCategoryId==='family'",'category selection before starting game');
  await click(cdp,'[data-hw9-game="type"]');await cdp.send('Page.reload',{ignoreCache:true});
  await waitFor(async()=>await evaluate(cdp,"document.querySelector('.mode-btn[data-mode=type]')?.classList.contains('active')&&document.body.classList.contains('hw9-legacy-active')"),'focused game restores correct mode',20000);
  extendedChecks.push('deep-link refresh restores game mode');
  await backToShell(cdp);await setTab(cdp,'my');await click(cdp,'[data-hw9-action="lock-parent"]');await click(cdp,'[data-hw9-action="report"]');
  await waitFor(async()=>await evaluate(cdp,"document.querySelector('#hw9ParentDialog')?.open"),'report PIN gate');
  await evaluate(cdp,"(()=>{const d=document.querySelector('#hw9ParentDialog');d.querySelector('[data-hw9-parent-pin]').value='0000';d.querySelector('form').requestSubmit();})()");await delay(100);
  await expectBrowser(cdp,"document.querySelector('[data-hw9-parent-error]').textContent.includes('맞지')",'wrong report PIN does not unlock');
  await evaluate(cdp,"(()=>{const d=document.querySelector('#hw9ParentDialog');d.querySelector('[data-hw9-parent-pin]').value='2580';d.querySelector('form').requestSubmit();})()");
  await waitFor(async()=>await evaluate(cdp,"document.querySelector('#s2ViewTitle')?.textContent==='학습 리포트'&&!document.querySelector('#season2Overlay').hidden"),'protected report');
  await screenshot(cdp,'protected-report.png');
  await expectBrowser(cdp,"Boolean(document.querySelector('[data-s2-action=export-report-json]')&&document.querySelector('[data-s2-action=export-report-csv]'))",'both report export controls preserved');
  await evaluate(cdp,"document.querySelector('#s2Content').focus()");
  await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await expectBrowser(cdp,"Boolean(document.activeElement.closest('#season2Overlay'))",'season dialog traps keyboard focus');
  await click(cdp,'#season2Overlay [data-s2-view=settings]');await screenshot(cdp,'season-settings.png');
  await evaluate(cdp,"(()=>{const x=document.querySelector('[data-s2-setting=reducedMotion]');if(x){x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}));}})()");
  await expectBrowser(cdp,"window.HeatherWordSeason2.getState().settings.reducedMotion===true",'reduced motion setting persists');
  await click(cdp,'#season2Overlay [data-s2-action=close]');await setTab(cdp,'home');await click(cdp,'.hw9-hero-cta');
  await waitFor(async()=>await evaluate(cdp,"document.querySelector('#season2Overlay')?.hidden===false"),'adventure entry');
  if(await evaluate(cdp,"Boolean(document.querySelector('[data-s2-action=choose-starter]'))"))await click(cdp,'[data-s2-action=choose-starter]');
  await click(cdp,'[data-s2-action=start-stage][data-stage-index="0"]');
  await waitFor(async()=>await evaluate(cdp,"Boolean(window.HeatherWordSeason2.getState().dailyAdventure.session?.questions?.length)"),'season session');
  const sessionBefore=await evaluate(cdp,"window.HeatherWordSeason2.getState().dailyAdventure.session.questions[0].wordId");
  await click(cdp,'#season2Overlay [data-s2-action=close]');await cdp.send('Page.reload',{ignoreCache:true});
  await waitFor(async()=>await evaluate(cdp,"Boolean(window.HeatherWordSeason2&&window.HeatherWordUI)"),'reload season data',20000);
  await expectBrowser(cdp,`window.HeatherWordSeason2.getState().dailyAdventure.session.questions[0].wordId===${JSON.stringify(sessionBefore)}`,'unfinished adventure survives reload');
  await setTab(cdp,'home');await click(cdp,'.hw9-hero-cta');await click(cdp,'[data-s2-action=start-stage][data-stage-index="0"]');
  for(let stage=0;stage<4;stage++) {
    for(let safety=0;safety<10;safety++) {
      const session=await evaluate(cdp,'window.HeatherWordSeason2.getState().dailyAdventure.session');if(session.completed)break;
      const q=session.questions[session.index],word=fixture.words.find(w=>w.id===q.wordId)?.word;
      if(!word)throw new Error(`Unknown season fixture word ${q.wordId}`);
      if(q.mode==='choice')await click(cdp,`#season2Overlay [data-s2-action=answer-choice][data-word-id="${q.wordId}"]`);
      else if(q.mode==='block')await evaluate(cdp,`(()=>{for(const ch of ${JSON.stringify(word.toUpperCase().replace(/[^A-Z]/g,''))}){const b=[...document.querySelectorAll('[data-s2-action=add-block]')].find(x=>x.textContent.trim().toUpperCase()===ch);if(!b)throw new Error('Missing block');b.click();}document.querySelector('[data-s2-action=check-block]').click();})()`);
      else await evaluate(cdp,`(()=>{const input=document.querySelector('[data-s2-answer-input]');input.value=${JSON.stringify(word)};document.querySelector('[data-s2-action=submit-input]').click();})()`);
      await delay(800);
    }
    await expectBrowser(cdp,'window.HeatherWordSeason2.getState().dailyAdventure.session.completed',`adventure stage ${stage+1} completion`);
    await screenshot(cdp,`adventure-stage-${stage+1}.png`);await click(cdp,'[data-s2-action=finish-stage]');
  }
  await expectBrowser(cdp,'window.HeatherWordSeason2.getState().dailyAdventure.completed','full four-stage adventure and rewards');await click(cdp,'#season2Overlay [data-s2-action=close]');
  await evaluate(cdp,"(()=>{const e=JSON.parse(localStorage.getItem('heather_word_v3'));e.words=Array.from({length:151},(_,i)=>({id:'qa-'+i,word:'testword'+i,meaning:'연습 '+i,categoryId:'custom'}));e.selectedCategoryId='all';localStorage.setItem('heather_word_v3',JSON.stringify(e));})()");
  await cdp.send('Page.reload',{ignoreCache:true});await waitFor(async()=>await evaluate(cdp,"Boolean(window.HeatherWordUI)&&window.HeatherWordUI.getSnapshot().wordCount===151"),'151-word fixture',20000);
  await setTab(cdp,'learn');await click(cdp,'[data-hw9-action=library]');await evaluate(cdp,"window.__searchNode=document.querySelector('[data-hw9-word-search]');window.__searchNode.focus()");
  await cdp.send('Input.insertText',{text:'testword'});await delay(200);
  await expectBrowser(cdp,"document.activeElement===window.__searchNode&&document.querySelector('.hw9-word-list').children.length===60",'search retains same input node and focus');
  await click(cdp,'[data-hw9-action=more-words]');await click(cdp,'[data-hw9-action=more-words]');
  await expectBrowser(cdp,"document.querySelectorAll('.hw9-word-row').length===151",'all words beyond the old 120 limit are reachable');await screenshot(cdp,'search-pagination.png');
  await evaluate(cdp,"(()=>{const e=document.querySelector('[data-hw9-word-search]');e.focus();e.value='연습';e.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));e.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));})()");
  await expectBrowser(cdp,"document.activeElement===window.__searchNode&&document.querySelector('.hw9-result-count').textContent.includes('151')",'Korean composition updates results without replacing input');
  await setTab(cdp,'my');await cdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await delay(100);
  await expectBrowser(cdp,"document.querySelector('[data-hw9-connection]').textContent.includes('오프라인')",'offline state is explicitly labeled');await screenshot(cdp,'state-offline.png');
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await writeFile(join(outputDir,'commercial-checks.json'),JSON.stringify({checks:extendedChecks,count:extendedChecks.length},null,2));
}
async function runKidsChecks(cdp) {
  const checks=[];
  for(const width of [360,390,430,768,1440]) {
    await setViewport(cdp,width,width>=768?1000:800);await setTab(cdp,'home');await delay(300);
    const metrics=await evaluate(cdp,"(()=>{const c=document.querySelector('.hw9-hero-cta').getBoundingClientRect(),m=document.querySelector('#hw9Content').getBoundingClientRect();return {height:c.height,visible:c.top>=m.top&&c.bottom<=m.bottom,nodes:document.querySelectorAll('.kids-path li').length}})()");
    if(metrics.height<56||!metrics.visible||metrics.nodes!==4)throw new Error(`Child home layout ${width}: ${JSON.stringify(metrics)}`);
    checks.push(`${width}: start above fold, 56px target, four real stages`);await screenshot(cdp,`kids-home-${width}.png`);
  }
  await setViewport(cdp,390,844);await setTab(cdp,'games');await screenshot(cdp,'kids-games-390.png');
  if(await evaluate(cdp,"document.querySelectorAll('.hw9-game-icon svg').length")!==4)throw new Error('Four illustrated modes missing');
  checks.push('four distinct game illustrations and controls');
  await evaluate(cdp,"(()=>{const e=JSON.parse(localStorage.getItem('heather_word_v3'));e.categories.push({id:'empty-qa',name:'빈 카테고리'});e.selectedCategoryId='empty-qa';localStorage.setItem('heather_word_v3',JSON.stringify(e));})()");
  await cdp.send('Page.reload',{ignoreCache:true});await waitFor(async()=>await evaluate(cdp,"Boolean(window.HeatherWordUI&&window.HeatherWordSeason2)"),'empty category fixture',20000);await setTab(cdp,'games');
  if(await evaluate(cdp,"document.querySelector('[data-hw9-game-category]').value")!=='all')throw new Error('Empty category did not display all');
  await click(cdp,'[data-hw9-game=choice]');await waitFor(async()=>await evaluate(cdp,"Boolean(document.querySelector('#gameBox .choice'))"),'visible all launches questions');
  if(await evaluate(cdp,"document.querySelector('#gameCategory').value")!=='all')throw new Error('Empty category launch mismatch');
  checks.push('empty category resolves and launches the displayed all option');
  await waitFor(async()=>await evaluate(cdp,"Boolean(document.querySelector('#kidsPlayHint'))"),'child game instruction');
  if(!await evaluate(cdp,"document.querySelector('#kidsPlayHint').textContent.includes('눌러')"))throw new Error('Child instruction missing');
  await screenshot(cdp,'kids-choice-390.png');checks.push('short instruction on live game screen');await backToShell(cdp);
  await setTab(cdp,'home');await click(cdp,'.hw9-hero-cta');await waitFor(async()=>await evaluate(cdp,"document.querySelector('#season2Overlay')?.hidden===false"),'kids map');
  await screenshot(cdp,'kids-adventure-390.png');await click(cdp,'#season2Overlay [data-s2-action=close]');
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await setTab(cdp,'home');await delay(250);
  if(!await evaluate(cdp,"getComputedStyle(document.querySelector('.hw9-view')).animationName==='none'"))throw new Error('Reduced motion not respected');
  checks.push('system reduced motion disables animation');await cdp.send('Emulation.setEmulatedMedia',{features:[]});
  await writeFile(join(outputDir,'kids-checks.json'),JSON.stringify({checks,count:checks.length},null,2));
}
async function run() {
  await mkdir(outputDir,{recursive:true});const browser=chromePath();if(!browser)throw new Error('Chrome/Chromium not found');
  const userDir=await mkdtemp(join(tmpdir(),'heather-ui-v9-'));
  const chrome=spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars',`--remote-debugging-port=${port}`,`--user-data-dir=${userDir}`,'--no-first-run','--no-default-browser-check','about:blank'],{stdio:['ignore','pipe','pipe']});
  let browserLog='';chrome.stderr.on('data',data=>{browserLog+=data.toString();});
  try {
    await waitFor(async()=>{try{await jsonFetch(`http://127.0.0.1:${port}/json/version`);return true;}catch{return false;}},'Chrome debug port',30000);
    const target=await jsonFetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'}),cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.connect();
    await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Log.enable'),cdp.send('Network.enable')]);
    cdp.on('Runtime.exceptionThrown',({exceptionDetails})=>errors.push(exceptionDetails?.exception?.description||exceptionDetails?.text||'exception'));
    cdp.on('Log.entryAdded',({entry})=>{if(entry?.level==='error')consoleErrors.push(entry.text);if(entry?.level==='warning')consoleWarnings.push(entry.text);});
    cdp.on('Runtime.consoleAPICalled',({type,args})=>{const text=args?.map(arg=>arg.value||arg.description).join(' ')||type;if(type==='error')consoleErrors.push(text);if(type==='warning')consoleWarnings.push(text);});
    cdp.on('Network.responseReceived',({response})=>{if(Number(response?.status)>=400)networkErrors.push(`${response.status} ${response.url}`);});
    const fixtureScript=`(()=>{if(location.origin===${JSON.stringify(new URL(baseUrl).origin)}&&sessionStorage.getItem('__hw9_fixture_seeded')!=='1'){localStorage.setItem('heather_word_v3',${JSON.stringify(JSON.stringify(fixture))});localStorage.removeItem('heather_parent_gate_v1');sessionStorage.setItem('__hw9_fixture_seeded','1');}})();`;
    await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:fixtureScript});await setViewport(cdp,390,844);await load(cdp,`${baseUrl}/?mode=local&qa=existing#/home`);
    const viewports=[[360,800],[375,812],[390,844],[412,915],[430,932],[768,1024],[1440,1000]];
    for(const [width,height] of viewports){await setViewport(cdp,width,height);await setTab(cdp,'home');await screenshot(cdp,`home-${width}x${height}.png`);}
    await setViewport(cdp,390,844);
    for(const tab of ['home','learn','games','collection','my']){await setTab(cdp,tab);await screenshot(cdp,`tab-${tab}-390x844.png`);}
    await setTab(cdp,'home');await evaluate(cdp,"window.HeatherWordUI.openLegacy('card',{categoryId:'fruit'})");
    await waitFor(async()=>await evaluate(cdp,"document.querySelector('#cardScreen')?.classList.contains('active')"),'card screen');await screenshot(cdp,'focus-card-390x844.png');
    const scoreBeforeCard=await evaluate(cdp,'window.HeatherWordLegacyBridge.getSnapshot().player.score');await click(cdp,'#knowBtn');
    await waitFor(async()=>await evaluate(cdp,'window.HeatherWordLegacyBridge.getSnapshot().player.score')>=scoreBeforeCard,'card result');await backToShell(cdp);
    await openGame(cdp,'choice');const scoreBeforeRound=await evaluate(cdp,'window.HeatherWordLegacyBridge.getSnapshot().player.score');
    for(let index=0;index<10;index++) {
      await waitFor(async()=>await evaluate(cdp,"Boolean(document.querySelector('[data-word-id]'))"),`choice question ${index+1}`);await answerCurrentChoice(cdp);
      if(index<9)await waitFor(async()=>await evaluate(cdp,"!document.querySelector('#gameBox')?.classList.contains('answer-review-mode')&&Boolean(document.querySelector('[data-word-id]'))&&!document.querySelector('[data-word-id]')?.disabled"),`choice advance ${index+1}`,3000);
      await delay(720);
    }
    await waitFor(async()=>await evaluate(cdp,"Boolean(document.querySelector('.round-complete'))"),'choice round completion',5000);
    const scoreAfterRound=await evaluate(cdp,'window.HeatherWordLegacyBridge.getSnapshot().player.score');if(scoreAfterRound<=scoreBeforeRound)throw new Error('Choice round did not increase score');
    await screenshot(cdp,'focus-game-complete-390x844.png');await backToShell(cdp);
    await openGame(cdp,'block');await waitFor(async()=>await evaluate(cdp,"Boolean(document.querySelector('[data-bank-index]'))"),'block bank');await answerCurrentBlock(cdp);
    await waitFor(async()=>await evaluate(cdp,"document.querySelector('#feedback')?.classList.contains('good')"),'block correct');await backToShell(cdp);
    await openGame(cdp,'blank');await waitFor(async()=>await evaluate(cdp,"Boolean(document.querySelector('#answerInput'))"),'blank input');
    let meaning=await evaluate(cdp,"document.querySelector('.question-meaning')?.textContent.trim()||''");await answerCurrentText(cdp,answerForMeaning(meaning),true);
    await waitFor(async()=>await evaluate(cdp,"document.querySelector('#feedback')?.classList.contains('good')"),'blank correct');await screenshot(cdp,'focus-game-blank-390x844.png');await backToShell(cdp);
    await openGame(cdp,'type');await waitFor(async()=>await evaluate(cdp,"Boolean(document.querySelector('#answerInput'))"),'type input');
    meaning=await evaluate(cdp,"document.querySelector('.question-meaning')?.textContent.trim()||''");await answerCurrentText(cdp,answerForMeaning(meaning),false);
    await waitFor(async()=>await evaluate(cdp,"Boolean(document.querySelector('.answer-review'))"),'wrong answer review');await screenshot(cdp,'focus-game-wrong-390x844.png');await click(cdp,'#nextReviewBtn');
    await waitFor(async()=>await evaluate(cdp,"Boolean(document.querySelector('#answerInput'))"),'next type input');meaning=await evaluate(cdp,"document.querySelector('.question-meaning')?.textContent.trim()||''");await answerCurrentText(cdp,answerForMeaning(meaning),true);
    await waitFor(async()=>await evaluate(cdp,"document.querySelector('#feedback')?.classList.contains('good')"),'type correct');await backToShell(cdp);
    for(const screen of ['collection','pet','dress','shop','rank']) {
      await evaluate(cdp,`window.HeatherWordUI.openLegacy(${JSON.stringify(screen)})`);await waitFor(async()=>await evaluate(cdp,`document.querySelector('#${screen}Screen')?.classList.contains('active')`),`${screen} screen`);await screenshot(cdp,`focus-${screen}-390x844.png`);await backToShell(cdp);
    }
    await setTab(cdp,'my');await click(cdp,"[data-hw9-action='parent']");await waitFor(async()=>await evaluate(cdp,"document.querySelector('#hw9ParentDialog')?.open===true"),'parent gate');
    await evaluate(cdp,"(()=>{const d=document.querySelector('#hw9ParentDialog');d.querySelector('[data-hw9-parent-pin]').value='2580';d.querySelector('[data-hw9-parent-confirm]').value='2580';d.querySelector('[data-hw9-parent-form]').requestSubmit();})()");
    await waitFor(async()=>await evaluate(cdp,"document.querySelector('#manageScreen')?.classList.contains('active')"),'parent management');await screenshot(cdp,'focus-parent-manage-390x844.png');
    const originalWords=await evaluate(cdp,'window.HeatherWordLegacyBridge.getSnapshot().words.length');await click(cdp,'#addWordBtn');await waitFor(async()=>await evaluate(cdp,"document.querySelector('#wordDialog')?.open===true"),'word dialog');
    await evaluate(cdp,"(()=>{document.querySelector('#wordInput').value='rocket';document.querySelector('#meaningInput').value='로켓';document.querySelector('#emojiInput').value='';document.querySelector('#wordCategoryInput').value='custom';document.querySelector('#saveWordBtn').click();})()");
    await waitFor(async()=>await evaluate(cdp,'window.HeatherWordLegacyBridge.getSnapshot().words.length')>originalWords,'word add');await click(cdp,'#bulkAddBtn');
    await waitFor(async()=>await evaluate(cdp,"document.querySelector('#bulkDialog')?.open===true"),'bulk dialog');
    await evaluate(cdp,"(()=>{document.querySelector('#bulkCategoryInput').value='custom';document.querySelector('#bulkTextInput').value='moon / 달\\nstar / 별';document.querySelector('#saveBulkBtn').click();})()");
    await waitFor(async()=>await evaluate(cdp,'window.HeatherWordLegacyBridge.getSnapshot().words.length')>=originalWords+3,'bulk add');
    const beforeReload=await evaluate(cdp,"localStorage.getItem('heather_word_v3')");await cdp.send('Page.reload',{ignoreCache:true});
    await waitFor(async()=>await evaluate(cdp,`document.body?.dataset?.hw9Version === ${JSON.stringify(UI_V9_VERSION)}`),'reload ready',20000);
    const afterReload=await evaluate(cdp,"localStorage.getItem('heather_word_v3')");if(!beforeReload||!afterReload)throw new Error('Local state missing after reload');
    await runExtended(cdp);
    // Restore the isolated fixture for child-specific interaction checks.
    await evaluate(cdp,`localStorage.setItem('heather_word_v3',${JSON.stringify(JSON.stringify(fixture))})`);await cdp.send('Page.reload',{ignoreCache:true});
    await waitFor(async()=>await evaluate(cdp,"Boolean(window.HeatherWordUI&&window.HeatherWordSeason2)"),'kids fixture ready',20000);await runKidsChecks(cdp);
    await setTab(cdp,'learn');
    await evaluate(cdp,"localStorage.setItem('heather_word_v3',JSON.stringify({player:{name:'New learner',score:0,coin:0,xp:0,knownCards:{},progress:{},dailyMission:{date:'2026-08-31',cardViews:0,gameCorrect:0,writingAttempts:0,rewarded:false}},categories:[],words:[],selectedCategoryId:'all'}));window.dispatchEvent(new CustomEvent('heather:state-change'));");await delay(250);await screenshot(cdp,'state-empty-new-user-390x844.png');
    if(!await evaluate(cdp,"document.querySelector('.hw9-empty-state')?.textContent.includes('단어가 없어요')===true"))throw new Error('New-user empty state missing');
    await setTab(cdp,'home');await screenshot(cdp,'kids-first-use-390.png');
    const report={version:await evaluate(cdp,'document.body.dataset.hw9Version'),screenshots:(await readdir(outputDir)).filter(name=>name.endsWith('.png')).length,consoleErrors,consoleWarnings,networkErrors,exceptions:errors,preservedLocalKey:await evaluate(cdp,"typeof localStorage.getItem('heather_word_v3')==='string'"),generatedAt:new Date().toISOString()};
    await writeFile(join(outputDir,'qa-report.json'),JSON.stringify(report,null,2));
    if(errors.length||consoleErrors.length||networkErrors.length)throw new Error(`Browser errors: ${JSON.stringify({errors,consoleErrors,networkErrors})}`);cdp.close();
  } finally {await writeFile(join(outputDir,'browser-stderr.txt'),browserLog);chrome.kill('SIGTERM');}
}
run().catch(async error=>{await mkdir(outputDir,{recursive:true});await writeFile(join(outputDir,'qa-failure.txt'),`${error.stack||error}\n`);console.error(error);process.exitCode=1;});
