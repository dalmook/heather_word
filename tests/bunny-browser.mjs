import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out='review-output';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'no-preference'});
page.setDefaultTimeout(8000);
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
const shot=async name=>page.screenshot({path:`${out}/${name}.png`,fullPage:true});
const test=async(name,fn)=>{try{await fn();checks.push({name,pass:true});console.log('PASS',name);}catch(e){checks.push({name,pass:false,error:e.message});console.error('FAIL',name,e.message);await shot(`failure-${checks.length}`).catch(()=>{});}};
const boot=async url=>{await page.goto(url);await page.waitForFunction(()=>window.HeatherWordBunny?.version==='14.0.0');await page.waitForTimeout(350);};
const base=process.env.BUNNY_TEST_URL||'http://127.0.0.1:8765/';
const snapshot=()=>page.evaluate(()=>{const s=window.HeatherWordLegacyBridge.getSnapshot();return {words:s.words,categories:s.categories,player:s.player};});
const season=()=>page.evaluate(()=>window.HeatherWordSeason2.getState());
const overflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
async function openGame(mode){await page.evaluate(mode=>window.HeatherWordUI.openLegacy('game',{mode,categoryId:'all'}),mode);await page.waitForSelector('#gameScreen.active .bunny-study-bar');await page.waitForTimeout(120);}
async function word(){return page.evaluate(()=>{const meaning=document.querySelector('#gameBox .question-meaning')?.textContent;return window.HeatherWordLegacyBridge.getSnapshot().words.find(w=>w.meaning===meaning);});}
async function correct(mode){const w=await word();assert.ok(w,'question word');if(mode==='choice')await page.locator(`#gameBox .choice[data-word-id="${w.id}"]`).click();else if(mode==='block'){for(const letter of w.word.toLowerCase().replace(/[^a-z]/g,'')){await page.locator('#letterBank .tile').filter({hasText:new RegExp(`^${letter}$`,'i')}).first().click();}await page.locator('#checkTilesBtn').click();}else{await page.locator('#answerInput').fill(w.word);assert.ok(await page.locator('#gameScreen .bunny-rabbit').isVisible(),'rabbit stays visible during input');await page.locator('#checkInputBtn').click();}}
async function closeReveal(){const close=page.locator('.hw-character-reveal[open] [data-reveal-close]');if(await close.count())await close.click();}
async function seasonCorrect(){
 const s=(await season()).dailyAdventure.session,w=(await snapshot()).words.find(w=>w.id===s.questions[s.index].wordId);assert.ok(w);
 if(await page.locator('.s2-choice-grid').count())await page.locator(`[data-s2-action=answer-choice][data-word-id="${w.id}"]`).click();
 else if(await page.locator('.s2-letter-bank').count()){
  for(let i=0;i<w.word.toLowerCase().replace(/[^a-z]/g,'').length;i++){
   const retained=await page.locator('#season2Overlay .bunny-study-bar').elementHandle();
   await page.locator(`[data-s2-action=add-block][data-letter-index="${i}"]`).click();
   await page.waitForSelector('#season2Overlay .bunny-study-bar');
   assert.ok(await retained.evaluate(el=>el.isConnected),'same rig survives the scheduled render');
   assert.equal(await page.locator('#season2Overlay .bunny-study-bar').count(),1,'one retained rabbit for block DOM replacements');
  }
  await page.locator('[data-s2-action=check-block]').click();
 }else{await page.locator('[data-s2-answer-input]').fill(w.word);await page.locator('[data-s2-action=submit-input]').click();}
 await page.waitForFunction(()=>document.querySelector('#season2Overlay .bunny-study-bar')?.dataset.reaction==='correct');
 await page.waitForFunction(old=>{const now=window.HeatherWordSeason2.getState().dailyAdventure.session;return now?.index!==old||now?.completed;},s.index);
}
try{
 await test('empty real mode: original words are not populated',async()=>{await boot(`${base}?mode=local#/home`);assert.equal((await snapshot()).words.length,0);assert.equal(await page.locator('.bunny-hero-friend').count(),1);assert.equal(await page.locator('.kids-scene .bunny-rabbit').count(),1);assert.equal((await page.evaluate(()=>window.HeatherWordBunny.getStatus())).playing,false);await shot('01-empty-desktop');});
 await test('petting and settings never grant score or coins',async()=>{const before=await snapshot();await page.locator('[data-bunny-pet]').click();await page.locator('.hw9-header [data-bunny-settings]').click();await page.locator('[data-bunny-pref=motion]').selectOption('off');await page.locator('[data-bunny-close]').click();await page.waitForTimeout(200);const after=await snapshot();assert.deepEqual(after.words,before.words);assert.equal(after.player.score,before.player.score);assert.equal(after.player.coin,before.player.coin);assert.equal((await page.evaluate(()=>window.HeatherWordBunny.getStatus())).motion,'off');await page.reload();await page.waitForFunction(()=>window.HeatherWordBunny?.getStatus().motion==='off');});
 await test('demo remains separate and home is responsive',async()=>{await boot(`${base}?demo=1&mode=local#/home`);assert.equal((await snapshot()).words.length,60);assert.equal((await page.evaluate(()=>window.HeatherWordBunny.getPreferences())).motion,'full');await shot('02-home-desktop');for(const width of [320,390,768]){await page.setViewportSize({width,height:844});await page.waitForTimeout(120);await overflow();assert.ok((await page.locator('.hw9-hero-cta').boundingBox()).height>=56);await shot(`03-home-${width}`);}await page.setViewportSize({width:390,height:844});});
 await test('game selection shows all four original modes',async()=>{await page.evaluate(()=>window.HeatherWordUI.setTab('games'));await page.waitForSelector('.bunny-mode-buddy');assert.equal(await page.locator('.hw9-game-card').count(),4);await overflow();await shot('04-games-mobile');});
 await test('choice round: positive response, no double scoring, all ten questions',async()=>{await openGame('choice');await shot('05-choice-mobile');const before=await snapshot();await correct('choice');await page.waitForFunction(()=>document.querySelector('#gameScreen .bunny-study-bar')?.dataset.reaction==='correct');assert.equal((await snapshot()).player.score,before.player.score+1);await shot('06-correct-mobile');await page.waitForTimeout(780);for(let i=1;i<10;i++){await correct('choice');await page.waitForTimeout(790);}await page.waitForSelector('.round-complete');await page.waitForTimeout(150);assert.equal(await page.locator('.round-complete .bunny-result-art').count(),1);const end=await snapshot();await page.waitForTimeout(500);assert.equal((await snapshot()).player.score,end.player.score);assert.deepEqual(end.words,before.words);await page.locator('#restartRoundBtn').scrollIntoViewIfNeeded();assert.ok(await page.locator('#restartRoundBtn').isVisible());await shot('07-round-complete');});
 await test('wrong choice shows encouraging rabbit and existing answer review',async()=>{await openGame('choice');const w=await word();await page.locator(`#gameBox .choice:not([data-word-id="${w.id}"])`).first().click();await page.waitForSelector('#nextReviewBtn');await page.waitForFunction(()=>document.querySelector('#gameScreen .bunny-study-bar')?.dataset.reaction==='review');await shot('08-wrong-answer');await page.locator('#nextReviewBtn').click();await page.waitForTimeout(150);await overflow();});
 for(const mode of ['block','blank','type'])await test(`${mode}: input, grading and original combo reward`,async()=>{await openGame(mode);await shot(`09-${mode}-mobile`);const before=await snapshot();await correct(mode);await page.waitForFunction(()=>document.querySelector('#feedback')?.classList.contains('good'));const points={block:15,blank:40,type:100}[mode],bonus=(before.player.combo+1)%3===0?Math.max(1,Math.round(points*.2)):0;assert.equal((await snapshot()).player.score,before.player.score+points+bonus);await page.waitForTimeout(800);await overflow();});
 await test('cards retain controls and rabbit study helper',async()=>{await page.evaluate(()=>window.HeatherWordUI.openLegacy('card',{categoryId:'all'}));await page.waitForSelector('#cardScreen.active .bunny-study-bar');await shot('10-cards-mobile');await page.locator('#nextCardBtn').click();await page.locator('#cardSpeakBtn').click();await overflow();});
 await test('all 21 adventure questions, review, four completions and unchanged words',async()=>{
  const before=await snapshot();await page.evaluate(()=>window.HeatherWordUI.backToShell());await page.evaluate(()=>window.HeatherWordUI.openAdventure());await page.waitForSelector('#season2Overlay:not([hidden])');
  const start=page.locator('[data-s2-action=start-stage][data-stage-index="0"]');if(await start.count())await start.click();
  const starter=page.locator('[data-s2-action=choose-starter]');if(await starter.count())await starter.first().click();await page.waitForTimeout(350);await closeReveal();
  await shot('11-adventure-map');if(await start.isVisible().catch(()=>false))await start.click();
  await page.waitForSelector('#season2Overlay .bunny-study-bar');
  for(let stage=0;stage<4;stage++){
   assert.equal((await season()).dailyAdventure.session.stageIndex,stage);await shot(`12-adventure-stage-${stage+1}`);
   if(stage===0){await page.locator('[data-s2-action=skip-question]').click();await page.waitForFunction(()=>document.querySelector('#season2Overlay .bunny-study-bar')?.dataset.reaction==='review');await page.locator('[data-s2-action=retry-question]').click();}
   for(let j=0;j<[5,7,5,4][stage];j++)await seasonCorrect();
   await page.waitForSelector('.s2-stage-complete .bunny-result-art');await shot(`13-stage-complete-${stage+1}`);
   const reward=await season();await page.waitForTimeout(200);assert.deepEqual(await season(),reward,'no duplicate presentation reward');
   await page.locator('[data-s2-action=finish-stage]').click();await page.waitForTimeout(150);
  }
  assert.equal((await season()).dailyAdventure.completed,true);assert.deepEqual((await snapshot()).words,before.words);await overflow();
 });
 await test('motion, real music activation, mute and accessible settings',async()=>{await closeReveal();await page.evaluate(()=>window.HeatherWordSeason2?.close());await page.evaluate(()=>window.HeatherWordUI.backToShell());await page.evaluate(()=>window.HeatherWordUI.setTab('home'));await page.setViewportSize({width:1440,height:960});await page.locator('.hw9-header [data-bunny-music]').click();await page.waitForFunction(()=>window.HeatherWordBunny.getStatus().playing===true);assert.equal((await page.evaluate(()=>window.HeatherWordBunny.getPreferences())).music,true);await page.locator('.hw9-header [data-bunny-music]').click();assert.equal((await page.evaluate(()=>window.HeatherWordBunny.getStatus())).playing,false);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);assert.equal((await page.evaluate(()=>window.HeatherWordBunny.getStatus())).motion,'gentle');await page.locator('[data-bunny-pet]').click();assert.equal(await page.locator('.bunny-flying-letter').count(),0);assert.equal((await page.evaluate(()=>window.HeatherWordBunny.getStatus())).particles,0);await page.locator('.hw9-header [data-bunny-settings]').click();await shot('14-settings-desktop');await page.keyboard.press('Escape');assert.equal(await page.locator('#bunnySettings').evaluate(n=>n.open),false);});
 await test('no uncaught runtime errors',async()=>assert.deepEqual(errors,[]));
}finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors},null,2));await browser.close();}
if(checks.some(c=>!c.pass))process.exitCode=1;
