/** Tori presentation adapter. Existing engines alone own words, scoring, rewards and sync. */
import {rabbitMarkup,rabbitHero,normalizeBunnyPrefs,energyLabel,BUNNY_VERSION} from './bunny-art.js?v=14.0.0';
import {BunnySoundtrack} from './bunny-audio.js?v=14.0.0';
const PREFS_KEY=globalThis.HEATHER_DEMO?'heather_bunny_demo_preferences_v1':'heather_bunny_preferences_v1';
const $=(q,root=document)=>root.querySelector(q);
const text=(node,value)=>{if(node&&node.textContent!==String(value))node.textContent=String(value);};
const cls=(node,name,value)=>{if(node.classList.contains(name)!==Boolean(value))node.classList.toggle(name,Boolean(value));};
const icon={music:'<path d="M9 18V5l10-2v13M9 9l10-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="16" cy="16" rx="3" ry="2.5"/>',off:'<path d="M9 18V5l10-2v13M9 9l10-2M3 3l18 18"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="15" cy="17" r="3" fill="currentColor"/>'};
const svg=kind=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icon[kind]}</svg>`;
const tools=()=>`<div class="bunny-tools"><button type="button" class="bunny-tool" data-bunny-music aria-label="토리 배경음악 켜기" aria-pressed="false">${svg('off')}</button><button type="button" class="bunny-tool" data-bunny-settings aria-label="음악과 움직임 설정">${svg('settings')}</button></div>`;
let prefs;try{prefs=normalizeBunnyPrefs(JSON.parse(localStorage.getItem(PREFS_KEY)||'{}'));}catch{prefs=normalizeBunnyPrefs();}
const music=new BunnySoundtrack();
let observer=null,controller=null,frame=0,active=false,buddyHost=null,lastFeedback='',lastQuestion='',lastProgress=0,energy=0,inputTimer=0,reactionTimer=0,motion='full',lastPointer={x:0,y:0};
let particles=[],canvas=null,ctx=null,fxFrame=0,lastTime=0,dialogFocus=null;
const timers=new Set(),flights=new Set(),decorated=new WeakSet();
const delay=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
function savePrefs(){try{localStorage.setItem(PREFS_KEY,JSON.stringify(prefs));}catch{}}
function soundAllowed(){try{return window.HeatherWordLegacyBridge?.getSnapshot?.().player.sound!==false;}catch{return true;}}
function applyPrefs(){
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||window.HeatherWordUI?.getSnapshot?.()?.settings?.reducedMotion===true;
 motion=reduce?(prefs.motion==='off'?'off':'gentle'):prefs.motion;
 cls(document.body,'bunny-motion-off',motion==='off');cls(document.body,'bunny-motion-gentle',motion==='gentle');cls(document.body,'bunny-motion-paused',document.hidden);
 music.configure({enabled:prefs.music,volume:prefs.volume,energy,visible:!document.hidden&&!document.querySelector('dialog[open]'),allowed:soundAllowed()});
 document.querySelectorAll('[data-bunny-music]').forEach(b=>{
   const enabled=prefs.music;b.setAttribute('aria-pressed',String(enabled));b.setAttribute('aria-label',`토리 배경음악 ${enabled?'끄기':'켜기'}`);
   if(b.dataset.enabled!==String(enabled)){b.dataset.enabled=String(enabled);b.innerHTML=svg(enabled?'music':'off');}
 });
 if(motion!=='full'){particles=[];cancelAnimationFrame(fxFrame);fxFrame=0;ctx?.clearRect(0,0,canvas.width,canvas.height);for(const el of flights)el.remove();flights.clear();}
}
function openSettings(){
 let dialog=$('#bunnySettings');
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='bunnySettings';dialog.className='bunny-settings';dialog.setAttribute('aria-labelledby','bunnySettingsTitle');
  dialog.innerHTML=`<h2 id="bunnySettingsTitle">나에게 맞는 모험</h2><p>소리와 움직임만 바뀌어요.<br>단어와 학습 기록은 그대로예요.</p><label>토리 배경음악<input type="checkbox" data-bunny-pref="music"></label><label>음악 크기<input aria-label="배경음악 음량" type="range" min="0" max="100" step="5" data-bunny-pref="volume"></label><label>움직임<select data-bunny-pref="motion"><option value="full">신나게</option><option value="gentle">부드럽게</option><option value="off">멈추기</option></select></label><p>음악은 직접 켠 뒤에만 재생돼요. 발음을 듣는 동안에는 작아져요. 기존 앱 소리가 꺼져 있으면 음악도 쉬어요. 기기의 ‘동작 줄이기’ 설정을 우선해요.</p><button class="bunny-done" data-bunny-close>좋아, 이렇게 할래!</button>`;
  document.body.append(dialog);
  dialog.addEventListener('close',()=>{dialogFocus?.isConnected&&dialogFocus.focus({preventScroll:true});applyPrefs();});
 }
 $('[data-bunny-pref=music]',dialog).checked=prefs.music;
 $('[data-bunny-pref=volume]',dialog).value=Math.round(prefs.volume*100);
 $('[data-bunny-pref=motion]',dialog).value=prefs.motion;
 dialogFocus=document.activeElement;dialog.showModal();applyPrefs();
}
function setMood(mood,root=buddyHost){
 root?.querySelectorAll('.bunny-rabbit').forEach(node=>{node.dataset.mood=mood;});
 if(root?.classList.contains('bunny-study-bar'))root.dataset.reaction=mood;
}
function ensureTools(){
 const header=$('.hw9-header-actions');if(header&&!$('.bunny-tools',header))header.insertAdjacentHTML('afterbegin',tools());
 const brand=$('.hw9-brand>span');if(brand&&!brand.querySelector('.bunny-rabbit'))brand.innerHTML=rabbitMarkup({decorative:true});
 const home=$('.kids-scene');
 // A cached pre-Tori shell is upgraded too; the immutable learning engine is untouched.
 if(home&&!home.classList.contains('bunny-scene')){
   const speech=home.querySelector('.kids-speech');home.classList.add('bunny-scene');home.innerHTML=rabbitHero();if(speech)home.append(speech);
 }
 document.querySelectorAll('.hw9-game-card').forEach(card=>{
  if(decorated.has(card))return;decorated.add(card);
  const el=document.createElement('span');el.className='bunny-mode-buddy';el.setAttribute('aria-hidden','true');el.innerHTML=rabbitMarkup({decorative:true,mood:card.classList.contains('mode-block')?'input':'wave'});card.append(el);
 });
 document.querySelectorAll('.round-complete,.s2-stage-complete').forEach(result=>{
  if(decorated.has(result))return;decorated.add(result);
  const art=document.createElement('div');art.className='bunny-result-art';art.innerHTML=rabbitMarkup({mood:'celebrate',label:'함께 완주해서 신난 토리'});result.prepend(art);
  const note=document.createElement('p');note.className='bunny-result-note';note.textContent='끝까지 도전한 네가 정말 멋져. 다음에도 함께 가자!';result.append(note);
 });
}
function inspectPlay(){
 const season=$('#season2Overlay');
 if(season&&!season.hidden){
  const question=$('.s2-question-card',season),complete=$('.s2-stage-complete',season),session=window.HeatherWordSeason2?.getState?.()?.dailyAdventure?.session;
  if(question||complete){return {kind:'season',host:question||complete,parent:(question||complete).parentElement,feedback:$('.s2-feedback',season),complete:!!complete,index:session?.index||0,energy:session?.correct||0,key:`season:${session?.date}:${session?.stageIndex}:${session?.index}`,resultKey:session?.completed?'complete':'',focus:question||complete};}
  return null;
 }
 const game=$('#gameScreen');
 if(document.body.classList.contains('hw9-legacy-active')&&game?.classList.contains('active')){
  const progress=$('#roundProgress')?.textContent||'',match=progress.match(/(\d+)\s*\/\s*(\d+)/),mode=$('.mode-btn.active')?.dataset.mode||'choice';
  return {kind:'legacy',host:$('#gameBox'),parent:game,feedback:$('#feedback'),complete:!!$('.round-complete',game),index:Number(match?.[1]||0),energy:Number($('#roundCorrect')?.textContent.match(/\d+/)?.[0]||0),key:`legacy:${mode}:${$('#gameCategory')?.value}:${progress}`,focus:$('#gameBox')};
 }
 const card=$('#cardScreen');
 if(document.body.classList.contains('hw9-legacy-active')&&card?.classList.contains('active'))return {kind:'card',host:$('.word-card',card),parent:card,feedback:null,complete:false,index:0,energy:0,key:`card:${$('#cardWord')?.textContent}`,focus:$('.word-card',card)};
 return null;
}
function ensureBuddy(play){
 if(!play?.host)return null;
 let buddy=$('.bunny-study-bar',play.parent);
 // Season 2 replaces its question DOM on every tile. Reattach the same rig.
 if(!buddy && buddyHost && !buddyHost.isConnected){buddy=buddyHost;play.host.before(buddy);}
 if(!buddy){
  buddy=document.createElement('aside');buddy.className='bunny-study-bar';buddy.setAttribute('aria-label','토리 응원과 이번 라운드의 정답 수');
  buddy.innerHTML=`${rabbitMarkup({decorative:true})}<div class="bunny-study-copy"><strong data-bunny-speech>천천히 생각해도 괜찮아.</strong><div class="bunny-energy-title"><span data-bunny-energy-label>차근차근 출발!</span><span data-bunny-count></span></div><div class="bunny-energy" aria-hidden="true">${'<i></i>'.repeat(10)}</div></div>${tools()}`;
  play.host.before(buddy);
 }
 return buddy;
}
function scan(){
 frame=0;if(!active||document.hidden)return;
 ensureTools();const play=inspectPlay();
 if(!play){
  buddyHost=null;lastFeedback='';lastQuestion='';lastProgress=0;energy=0;
  document.querySelectorAll('.bunny-study-bar').forEach(el=>el.remove());applyPrefs();return;
 }
 buddyHost=ensureBuddy(play);energy=Math.min(10,Math.max(0,play.energy));
 if(play.index<lastProgress){lastFeedback='';}
 lastProgress=play.index;
 buddyHost.dataset.energy=String(energy>=9?3:energy>=6?2:energy>=3?1:0);
 text($('[data-bunny-energy-label]',buddyHost),play.kind==='card'?'카드를 보고 소리도 들어 봐!':energyLabel(energy));
 text($('[data-bunny-count]',buddyHost),play.kind==='card'?'':`정답 ${play.energy}개`);
 [...buddyHost.querySelectorAll('.bunny-energy i')].forEach((el,i)=>cls(el,'is-on',i<energy));
 const good=play.feedback?.classList.contains('good'),review=play.feedback?.classList.contains('bad')||play.feedback?.classList.contains('review');
 const reaction=play.complete?'celebrate':good?'correct':review?'review':'idle';
 const feedbackKey=good||review||play.complete?`${play.key}:${reaction}:${play.feedback?.textContent||''}`:'';
 if(feedbackKey&&feedbackKey!==lastFeedback){
   clearTimeout(inputTimer);clearTimeout(reactionTimer);setMood(reaction);
   text($('[data-bunny-speech]',buddyHost),reaction==='celebrate'?'끝까지 해냈어! 정말 멋져!':good?(energy>=6?'우와! 우리 정말 잘하고 있어!':'좋아! 한 단어 더 가까워졌어!'):'괜찮아. 정답을 보고 다시 해보자!');
   if(good||play.complete)burst(buddyHost,play.complete?'완주 성공!':energy>=9?'멋진 도전!':energy>=6?'반짝반짝!':energy>=3?'잘하고 있어!':'좋았어!',play.complete);
 }
 if(!feedbackKey&&play.key!==lastQuestion){
   clearTimeout(inputTimer);setMood('idle');text($('[data-bunny-speech]',buddyHost),play.kind==='card'?'이 단어, 우리 같이 기억하자!':'천천히 생각해도 괜찮아.');
 }
 if(play.complete)setMood('celebrate');
 lastFeedback=feedbackKey;lastQuestion=play.key;applyPrefs();
}
function schedule(){if(active&&!frame)frame=requestAnimationFrame(scan);}
function prepareCanvas(){
 if(canvas)return;
 canvas=document.createElement('canvas');canvas.className='bunny-fx-canvas';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);ctx=canvas.getContext('2d');resizeCanvas();
}
function resizeCanvas(){if(!canvas)return;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);}
function animate(time){
 const dt=Math.min(32,time-lastTime||16)/16;lastTime=time;ctx.clearRect(0,0,innerWidth,innerHeight);
 particles=particles.filter(p=>p.life>0);
 for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.13*dt;p.a+=p.spin*dt;ctx.save();ctx.globalAlpha=Math.min(1,p.life/18);ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=p.color;
  if(p.star){ctx.beginPath();for(let j=0;j<10;j++){const angle=j*Math.PI/5-Math.PI/2,r=j%2?p.size*.44:p.size;ctx.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);}ctx.closePath();ctx.fill();}else{ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.6);}ctx.restore();}
 if(particles.length&&!document.hidden)fxFrame=requestAnimationFrame(animate);else{fxFrame=0;ctx.clearRect(0,0,innerWidth,innerHeight);}
}
function burst(target,label,large=false){
 if(motion!=='full'||document.hidden)return;
 prepareCanvas();if(!ctx)return;const box=target.getBoundingClientRect(),x=box.left+Math.min(box.width*.55,box.width-30),y=Math.max(40,box.top+30),palette=['#b397df','#e5aa78','#dca2b4','#a7c58f','#8ba9d4'];
 for(let i=0;i<(large?64:24+energy*2);i++){const a=Math.random()*Math.PI*2,s=2+Math.random()*5;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-3,life:38+Math.random()*20,size:3+Math.random()*5,a:0,spin:(Math.random()-.5)*.25,color:palette[i%palette.length],star:i%3===0});}
 particles=particles.slice(-140);if(!fxFrame){lastTime=0;fxFrame=requestAnimationFrame(animate);}
 document.querySelectorAll('.bunny-fx-word').forEach(e=>e.remove());const word=document.createElement('div');word.className='bunny-fx-word';word.setAttribute('aria-hidden','true');word.textContent=label;word.style.left=`${Math.max(100,Math.min(innerWidth-100,x))}px`;word.style.top=`${Math.max(50,y-10)}px`;document.body.append(word);delay(()=>word.remove(),900);
}
function carryLetter(letter,origin){
 if(!buddyHost||motion!=='full'||!letter)return;
 const target=$('.bunny-rabbit',buddyHost);if(!target)return;
 const rect=target.getBoundingClientRect();let from=origin?.getBoundingClientRect?.();if(!from?.width)from={left:lastPointer.x,top:lastPointer.y,width:1,height:1};
 const x=from.left+from.width/2,y=from.top+from.height/2;if(x<0||y<0)return;
 while(flights.size>=8){const old=flights.values().next().value;old.remove();flights.delete(old);}
 const tile=document.createElement('span');tile.className='bunny-flying-letter';tile.setAttribute('aria-hidden','true');tile.textContent=String(letter).slice(-1).toUpperCase();tile.style.left=`${x-16}px`;tile.style.top=`${y-16}px`;document.body.append(tile);flights.add(tile);
 const dx=rect.left+rect.width*.51-x,dy=rect.top+rect.height*.74-y;
 const anim=tile.animate([{transform:'translate(0,0) rotate(-12deg)',opacity:1},{transform:`translate(${dx*.5}px,${dy*.65-30}px) rotate(8deg)`,offset:.55,opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.35)`,opacity:0}],{duration:460,easing:'cubic-bezier(.2,.6,.4,1)'});
 const clear=()=>{tile.remove();flights.delete(tile);};anim.onfinish=clear;anim.oncancel=clear;
}
function onInput(event){
 if(!event.target.matches?.('#answerInput,[data-s2-answer-input]'))return;
 if(event.isComposing)return;
 setMood('input');text($('[data-bunny-speech]',buddyHost||document),'좋아, 한 글자씩 모아 보자!');carryLetter(event.data||event.target.value.slice(-1),event.target);
 clearTimeout(inputTimer);inputTimer=setTimeout(()=>{setMood('idle');},700);
}
function onClick(event){
 const button=event.target.closest?.('button');if(!button)return;
 if(button.matches('[data-bunny-settings]')){openSettings();return;}
 if(button.matches('[data-bunny-close]')){$('#bunnySettings')?.close();return;}
 if(button.matches('[data-bunny-music]')){prefs.music=!prefs.music;savePrefs();applyPrefs();music.unlock();return;}
 if(button.matches('[data-bunny-pet]')){
  setMood('wave',button);text($('.bunny-name-tag',button),'반가워! 같이 놀자!');clearTimeout(reactionTimer);reactionTimer=setTimeout(()=>{setMood('idle',button);text($('.bunny-name-tag',button),'토리 · 너의 모험 친구');},1500);burst(button,'반가워!',false);return;
 }
 if(button.matches('.tile,[data-s2-action="add-block"]')){
  buddyHost=ensureBuddy(inspectPlay())||buddyHost;
  setMood('input');carryLetter(button.textContent,button);clearTimeout(inputTimer);inputTimer=setTimeout(()=>setMood('idle'),500);
 }
 schedule();
}
function onPreference(event){
 const key=event.target.dataset.bunnyPref;if(!key)return;
 prefs=normalizeBunnyPrefs({...prefs,[key]:key==='music'?event.target.checked:key==='volume'?Number(event.target.value)/100:event.target.value});savePrefs();applyPrefs();music.unlock();
}
function start(){
 if(active||!window.HeatherWordUI)return;
 active=true;controller=new AbortController();const opts={signal:controller.signal};document.body.classList.add('bunny-ready');document.body.dataset.bunnyVersion=BUNNY_VERSION;
 observer=new MutationObserver(schedule);
 for(const root of [$('#hw9App'),$('#gameScreen'),$('#cardScreen'),$('#season2Overlay')])if(root)observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
 observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('click',onClick,opts);document.addEventListener('input',onInput,opts);document.addEventListener('input',onPreference,opts);document.addEventListener('change',onPreference,opts);
 document.addEventListener('pointerdown',e=>{lastPointer={x:e.clientX,y:e.clientY};if(prefs.music)music.unlock();},opts);
 document.addEventListener('keydown',()=>{if(prefs.music)music.unlock();},opts);
 document.addEventListener('visibilitychange',()=>{applyPrefs();if(document.hidden){particles=[];cancelAnimationFrame(fxFrame);fxFrame=0;ctx?.clearRect(0,0,innerWidth,innerHeight);}else schedule();},opts);
 window.addEventListener('heather:legacy-render',schedule,opts);window.addEventListener('heather:state-change',schedule,opts);window.addEventListener('hashchange',schedule,opts);window.addEventListener('resize',resizeCanvas,opts);
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',applyPrefs,opts);
 applyPrefs();scan();
 window.HeatherWordBunny=Object.freeze({version:BUNNY_VERSION,getPreferences:()=>({...prefs}),getStatus:()=>({energy,motion,particles:particles.length,active,playing:Boolean(music.timer)}),refresh:schedule});
}
function stop(){
 active=false;observer?.disconnect();observer=null;controller?.abort();controller=null;cancelAnimationFrame(frame);cancelAnimationFrame(fxFrame);frame=0;fxFrame=0;clearTimeout(inputTimer);clearTimeout(reactionTimer);for(const t of timers)clearTimeout(t);timers.clear();
 particles=[];for(const el of flights)el.remove();flights.clear();canvas?.remove();canvas=null;ctx=null;music.stop();document.querySelectorAll('.bunny-fx-word').forEach(el=>el.remove());
}
if(typeof document!=='undefined'){
 window.addEventListener('heather:ui-v9-ready',start);window.addEventListener('pageshow',start);window.addEventListener('pagehide',stop);start();
}
