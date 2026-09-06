/* Character reactions never grant rewards or change saves. Animation can be interrupted safely. */
import {getSeason2Character,renderMonsterSvg} from './monster-catalog-season2.js?v=13.0.0';
import {renderEggSvg} from './character-companions.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let reveal=null,cleanupReveal=null;
export function closeCharacterReveal(){cleanupReveal?.();}
export function showCharacterReveal(character,{kind='unlock',previous=null}={}){
 if(!character||typeof document==='undefined')return;
 closeCharacterReveal();
 const prior=document.activeElement;
 const dialog=document.createElement('dialog');reveal=dialog;
 dialog.className='hw-character-reveal';dialog.dataset.rarity=character.rarity;
 dialog.setAttribute('aria-labelledby','hwCharacterRevealTitle');
 dialog.innerHTML=`<div class="hw-reveal-heading"><span>${kind==='evolution'?'함께 자란 순간':escape(character.rarityLabel)+' · 새로운 만남'}</span><h2 id="hwCharacterRevealTitle">${kind==='evolution'?'새 모습으로 자랐어요!':'우리, 함께 공부할까?'}</h2></div>
   <div class="hw-reveal-stage">${previous?`<div class="hw-reveal-previous">${renderMonsterSvg(previous)}<small>이전 모습</small></div>`:''}<div class="hw-reveal-silhouette">${renderMonsterSvg(character,{locked:true})}</div><div class="hw-reveal-final">${renderMonsterSvg(character,{mood:'happy'})}</div></div>
   <h3>${escape(character.name)}</h3><p>${escape(character.personality)}</p><p class="hw-reveal-saved">도감에 저장됐어요. 연출을 닫아도 그대로예요.</p><div class="hw-reveal-actions"><button type="button" class="s2-secondary" data-reveal-skip>연출 건너뛰기</button><button type="button" class="s2-primary" data-reveal-close>친구 만나러 가기</button></div>`;
 const finish=()=>{
   if(reveal!==dialog)return;reveal=null;cleanupReveal=null;
   window.removeEventListener('hashchange',finish);window.removeEventListener('pagehide',finish);
   if(dialog.open&&typeof dialog.close==='function')dialog.close();dialog.remove();
   if(prior?.isConnected)prior.focus({preventScroll:true});else document.querySelector('.s2-content [data-s2-action="set-partner"],.s2-content button')?.focus({preventScroll:true});
 };
 cleanupReveal=finish;
 dialog.querySelector('[data-reveal-close]').addEventListener('click',finish);
 dialog.querySelector('[data-reveal-skip]').addEventListener('click',event=>{dialog.classList.add('is-skipped');event.currentTarget.hidden=true;dialog.querySelector('[data-reveal-close]').focus();});
 dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});dialog.addEventListener('close',finish);
 window.addEventListener('hashchange',finish);window.addEventListener('pagehide',finish);
 document.body.appendChild(dialog);if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
 dialog.querySelector('[data-reveal-close]').focus();
}
if(typeof document!=='undefined'){
 let frame=0,intersection=null,mutations=null;const observed=new Set();
 const selectors=['.hw-character-hero .hw-character','.hw-character-hero .hw-avatar','.hw12-companion-art .hw-character','.hw9-partner-feature .hw-character','.hw9-profile-visual .hw-avatar','.s2-partner-stage .hw-character','.s2-detail-hero .hw-character','.s2-study-partner .hw-character','#petCareEmoji .hw-character','#dressAvatarPreview .hw-avatar','#hwLegacyStudyPartner .hw-character'];
 const syncLegacyBuddy=()=>{
   const screen=document.querySelector('#gameScreen');if(!screen)return;
   const feedback=document.querySelector('#feedback');
   const visible=screen.classList.contains('active');
   let buddy=document.querySelector('#hwLegacyStudyPartner');
   if(!visible){if(buddy)buddy.hidden=true;return;}
   const partner=getSeason2Character(window.HeatherWordSeason2?.getState?.().partnerId);
   const good=feedback?.classList.contains('good')||feedback?.classList.contains('ok')||document.body.classList.contains('celebrate');
   const hasReview=Boolean(feedback?.textContent?.trim())&&!good;
   const signature=`${partner?.id||'egg'}:${good}:${hasReview}`;
   if(!buddy){buddy=document.createElement('aside');buddy.id='hwLegacyStudyPartner';buddy.className='s2-study-partner';screen.appendChild(buddy);}
   buddy.hidden=false;if(buddy.dataset.signature===signature)return;buddy.dataset.signature=signature;
   buddy.dataset.reaction=good?'correct':hasReview?'review':'idle';
   buddy.innerHTML=`<div>${partner?renderMonsterSvg(partner,{mood:good?'happy':'idle'}):renderEggSvg()}</div><p>${good?'같이 해냈어!':hasReview?'괜찮아. 다시 만나면 더 반가울 거야.':'천천히 생각해도 괜찮아.'}</p>`;
 };
 const scan=()=>{
   frame=0;if(document.hidden)return;
   syncLegacyBuddy();
   for(const node of observed)if(!node.isConnected){intersection?.unobserve(node);observed.delete(node);}
   for(const node of document.querySelectorAll(selectors.join(','))){if(observed.has(node))continue;observed.add(node);if(intersection)intersection.observe(node);else node.classList.add('is-live');}
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(scan);};
 const visibility=()=>{document.documentElement.classList.toggle('hw-motion-paused',document.hidden);if(!document.hidden)schedule();};
 const start=()=>{
   if(mutations)return;
   intersection='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const {target,isIntersecting} of entries)target.classList.toggle('is-live',isIntersecting);},{threshold:.05}):null;
   mutations=new MutationObserver(schedule);mutations.observe(document.body,{childList:true,subtree:true});
   document.addEventListener('visibilitychange',visibility);window.addEventListener('heather:legacy-render',schedule);
   const feedback=document.querySelector('#feedback');if(feedback)mutations.observe(feedback,{attributes:true,childList:true,subtree:true});
   schedule();
 };
 const stop=()=>{closeCharacterReveal();cancelAnimationFrame(frame);frame=0;mutations?.disconnect();mutations=null;intersection?.disconnect();observed.clear();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('heather:legacy-render',schedule);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.addEventListener('pagehide',stop);window.addEventListener('pageshow',start);
}
