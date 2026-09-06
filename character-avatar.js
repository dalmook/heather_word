/* Original Heather Word paper-doll art. Shared by DOM, Phaser, thumbnails and PNG export.
 * Presentation only: callers remain responsible for ownership and persisted selections.
 */
import { tint } from './character-art.js';
export const AVATAR_ART_VERSION='13.0.0';
export const AVATAR_SLOTS=Object.freeze(['background','body','face','hair','top','bottom','outfit','shoes','accessory','effect']);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validColor=(v,f)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:f;
const index=p=>Math.max(1,Math.min(12,Number(String(p?.id||'').split('_').at(-1))||1));
const INK='#443f48',CREAM='#fff7e5';
const path=(d,fill,stroke=INK,w=2.6)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const ellipse=(x,y,rx,ry,c,w=2.6)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="${INK}" stroke-width="${w}"/>`;
const line=(d,c=INK,w=2.3)=>path(d,'none',c,w);
const star=(x,y,r=9,c='#ecc56c')=>path(`M${x} ${y-r}l${r*.3} ${r*.63} ${r*.7} ${r*.1} ${-r*.5} ${r*.5} ${r*.12} ${r*.7} ${-r*.62} ${-r*.33} ${-r*.62} ${r*.33} ${r*.12} ${-r*.7} ${-r*.5} ${-r*.5} ${r*.7} ${-r*.1}z`,c,INK,1.8);
const heart=(x,y,r=12,c='#dd8798')=>path(`M${x} ${y+r}C${x-r*2} ${y-r*.2} ${x-r} ${y-r*1.7} ${x} ${y-r*.5}C${x+r} ${y-r*1.7} ${x+r*2} ${y-r*.2} ${x} ${y+r}Z`,c,INK,1.7);
const bow=(x,y,c='#dd849c')=>path(`M${x-4} ${y}q-19-21-23-8l1 23 23-10M${x+4} ${y}q19-21 23-8l-1 23-23-10`,c)+ellipse(x,y+1,6,7,tint(c,'#ffffff',.3),1.8);
export function resolveAvatarArtParts(avatar={},parts=[]){
 const map=new Map(parts.map(p=>[p.id,p])); const selected={};
 for(const slot of AVATAR_SLOTS){const p=map.get(avatar[slot]);selected[slot]=p?.slot===slot?p:null;}
 if(selected.outfit){selected.top=null;selected.bottom=null;}
 return selected;
}
function background(p){
 const n=index(p),c=validColor(p?.color,'#f4e9e7'),a=validColor(p?.accent,'#d8e7dd');
 let art=path('M20 4h200q16 0 16 16v280q0 16-16 16H20q-16 0-16-16V20q0-16 16-16z',tint(c,'#ffffff',.25),'none',0);
 art+=path('M4 232q115-24 232 0v68q0 16-16 16H20q-16 0-16-16z',tint(a,'#ffffff',.20),'none',0);
 if(n===2){art+=path('M20 69q-5-13 9-16 7-18 21-9 14-5 19 13 13 0 11 12z',CREAM,'none',0)+path('M173 41q-4-13 9-14 7-16 19-7 12 0 12 12 15 1 12 11z',CREAM,'none',0);}
 else if(n===3){art+=ellipse(34,56,17,17,'#e6bd81',1.4)+ellipse(212,116,15,15,'#e6bd81',1.4)+ellipse(206,53,9,9,'#f1d0a5',1);art+=line('M29 51h1m10 10h1M208 110h1m7 13h1','#8b6447',4);}
 else if(n===4){for(let i=0;i<4;i++)art+=path(`M${33+i*12} 187V112a${87-i*12} ${87-i*12} 0 0 1 ${174-i*24} 0v75`,'none',['#e8a0a9','#edc382','#a8c5a1','#a8bcd2'][i],10);}
 else art+=path('M23 205V82a97 97 0 0 1 194 0v123',tint(c,'#ffffff',.48),'none',0)+line('M23 198V99q0-69 67-78M151 21q65 9 66 78v99',tint(c,'#a89996',.23),2);
 art+=ellipse(120,289,70,10,'#b5c4b6',0);return art;
}
function accessories(p,back=false){
 if(!p)return '';const n=index(p),c=validColor(p.color,'#e2bd76');
 if(back){
  if(n===7)return path('M91 167q-33-54-58-30l5 19-9 12 15 15-3 19 36 20 17-21M149 167q33-54 58-30l-5 19 9 12-15 15 3 19-36 20-17-21','#e0ede6')+line('M44 151l30 36M46 170l25 23M196 151l-30 36M194 170l-25 23','#9bbdc0',2.5);
  if(n===10||n===12)return path('M88 158q-31 53-29 105l26-11 34 13 35-13 27 11q-4-70-33-105z',n===12?'#a980b6':'#6e91b5')+line('M75 244q15 2 26 10M139 254l26-10','#e8d7b0',3);
  if(n===11)return [star(33,109,10),star(202,186,13),star(38,238,7),star(191,64,8)].join('')+line('M26 183q-12-44 6-78M209 227q22-32 15-67','#e5be70',3);
  return '';
 }
 if(n===1)return bow(164,64,validColor(p.color,'#e28a9e'));
 if(n===2)return ellipse(97,103,18,16,'none',3)+ellipse(145,103,18,16,'none',3)+line('M115 102h12M62 100l17 2M163 102l15-2',validColor(p.color,INK),3);
 if(n===3)return star(162,72,12)+line('M151 81l11 5','#f5dfac',3);
 if(n===4||n===9||n===12){let art=path(n===9?'M86 51l9-15 11 9 14-24 14 24 12-9 9 15-35 9z':'M85 50l-1-25 19 11 16-22 18 22 19-12-2 26-34 9z',n===9?'#e9dfc6':'#dfb76f');art+=star(120,43,n===12?10:7,'#ab91b6');if(n===9)for(const x of [94,108,132,145])art+=ellipse(x,50,3,3,CREAM,1);return art;}
 if(n===5)return line('M151 160l-72 67','#9b6d78',5)+path('M69 211l27-7 13 33-36 11-10-22z','#e49aaa')+heart(87,226,7,CREAM);
 if(n===6)return line('M59 107V85q2-57 62-57 58 0 63 58v22','#728f9f',11)+path('M54 95h12v30H52q-9-16 2-30M175 95h12q10 15 0 30h-12z','#e5c37e')+line('M57 101v19M183 101v19',CREAM,3);
 if(n===8)return line('M177 238l29-84','#927659',6)+star(209,145,19,'#c6b3db')+star(209,145,8,'#f4df9a')+line('M197 161l-7 12M207 166l2 9','#91b4a7',3);
 return '';
}
function effects(p){if(!p)return '';const n=index(p),c=validColor(p.color,'#ebc275');return `<g class="hw-avatar-sparkles">${[[38,74,6],[199,116,9],[26,207,7],[202,248,6],[69,282,5]].map(([x,y,r])=>n===2?heart(x,y,r,tint(c,'#ffffff',.25)):star(x,y,r,tint(c,'#ffffff',.25))).join('')}</g>`;}
function hairArt(p,back){
 const n=index(p),colors=['#72503d','#684b49','#884f43','#63889d','#ac7552','#8b70a6','#68a79e','#c597bb'];
 const c=validColor(p?.color,colors[n-1]||colors[0]),shine=tint(c,'#fff4cd',.28),shadow=tint(c,INK,.23);
 if(back){let art='';
  if(n===3)art=path('M67 73Q25 63 30 133l-13 29 27-8 19 13 12-51M173 73q42-10 37 60l13 29-27-8-19 13-12-51',c)+line('M43 90q-11 21-2 50M197 90q11 21 2 50',shine,5);
  if(n===5||n===6)art=path(n===5?'M66 52q-34 42-15 90-21 19-6 42l-8 12 35 10 28-20h50l22 20 31-7-8-20q15-27-6-41 13-49-14-85z':'M66 49q-31 35-21 87l-5 61 40 13 79-1 38-14-1-63q9-59-27-83z',c)+line('M55 113q9 25 3 64M183 105q-8 38 1 67',shine,5);
  if(n===7)art=path('M163 61q22-43 46-17 21 32-6 61l-4 34-25-23 3-42z',c)+line('M192 52q14 22-2 47',shine,5);
  art+=path('M60 77q-7-51 61-54 62 0 61 57l-5 52-58 25-58-24z',c);return art;
 }
 let d=['M61 96Q40 42 88 28q23-11 50 0 49-1 44 66l-18-16-6-31q-9 40-39 35l10-18q-30 28-61 23z',
 'M58 121Q40 46 84 29q44-22 80 11 30 19 15 81l-14-29-2-23-24 13-14-21-13 21-35-13-4 25z',
 'M60 88q-11-51 43-62 64-8 77 59l-16-11-7-26-19 26-17-19-11 23-35-8-10 22z',
 'M57 99L47 57l28-23-5-12 35 7 34-13 4 15q43 6 39 63l-15-13-8-25-13 24-23-15-25 15-17-10-11 28z',
 'M60 104Q36 79 51 55q1-27 31-27 12-16 36-7 23-8 36 9 33 0 35 27 16 24-11 45l-12-29-20 5-24-13-19 15-28-8z',
 'M60 105Q46 56 70 35z',
 'M61 99q-15-46 22-66 42-23 76 8 28 12 24 56l-17-18-5-24-20 25-19-12-30 8-17-11-7 31z',
 'M57 103q-17-46 17-68 35-23 70-9 45 15 40 72l-18-20-4-29-23 33-13-16-29 14-20-10-8 28z'][n-1];
 if(n===6)d='M59 105Q44 46 89 30q50-22 79 21 20 19 12 57l-18-24-5-39q-13 39-40 46l5-24-43 25-7 27z';
 let art=path(d||'M60 92q-9-57 60-65 60 1 60 65l-18-20-32-12-40 24z',c)+line(n===4?'M75 48l22-9 25 0':'M73 53q22-20 49-17',shine,5);
 if(n===3)art+=bow(61,74,'#e49a9a')+bow(179,74,'#e49a9a');
 if(n===7)art+=bow(179,56,'#d7bb7a');
 if(n===8)art+=line('M126 37q-6 20-21 30','#e9c477',7)+line('M143 39l-13 24','#83b5a6',7)+line('M159 46l-10 23','#8badd1',6);
 return art;
}
function faceArt(p,mood){
 const n=index(p);let art='';const happy=mood==='happy';
 for(const [x,i] of [[96,0],[145,1]]){
  art+=`<g class="hw-avatar-eye">`;
  if(happy||mood==='blink'||n===2||(n===3&&i===1))art+=line(`M${x-8} 102q8-11 16 0`,INK,3.4);
  else {art+=ellipse(x,101,n===5?9:7.5,n===4?9:11,INK,0);art+=ellipse(x-2,97,2.6,3.2,CREAM,0)+ellipse(x+3,105,1.3,1.4,'#d6bda5',0);if(n===5)art+=star(x-1,97,4,CREAM);}
  art+='</g>'+line(`M${x-8} 83q8-4 16 0`,INK,2);
 }
 art+=`<g opacity="${n===4?'.65':'.36'}" fill="#dc8d87"><ellipse cx="79" cy="117" rx="10" ry="5"/><ellipse cx="163" cy="117" rx="10" ry="5"/></g>`;
 art+=line('M120 108l-2 5 5 1','#b98774',1.8);
 art+=n===4?line('M116 128q5 4 10 0',INK,2):n===2||happy?path('M110 125q10 4 22-1-4 19-14 11z','#8e5561',INK,2)+path('M116 133q7-4 12 0l-5 4z','#edac9f','none',0):line('M110 125q11 12 23-1',INK,2.7);
 return art;
}
function bottoms(p){const n=index(p),c=validColor(p?.color,'#668ca7');
 if(n===1)return path('M84 210h73l-2 38-29 2-6-22-6 22-30-2z',c)+line('M91 217v17l13 0M143 217v17h-11',tint(c,CREAM,.5),2)+line('M90 241h18M132 241h17',tint(c,INK,.2),3);
 let art=path('M86 210h67l18 39q-49 16-101 0z',c)+line('M87 216h68M94 222l-6 23M119 223v28M143 222l7 23',tint(c,CREAM,.45),2.5);
 if(n===3)art+=path('M78 238q41 14 86 0l3 7q-47 15-93 0z','#e9b2b1','none',0)+path('M76 245q44 14 91 0l3 6q-49 15-96 0z','#edd898','none',0);return art;
}
function shoes(p){const n=index(p),c=validColor(p?.color,'#a67f63');let art='';
 for(const x of [89,137]){
 art+=path(`M${x-5} 264h23l8 14 0 11-33 0-4-8z`,tint(c,CREAM,.18));
 art+=path(`M${x-10} 280q20 5 36 0v9h-35z`,CREAM,INK,1.8);
 art+=n===3?star(x+7,275,6,'#fff2be'):line(`M${x+1} 270h12m-12 5h12`,CREAM,2.2);
 }return art;
}
function garments(top,outfit){
 const n=index(outfit||top);const c=outfit?['#87b6c9','#6e92aa','#cfaa72','#bca5ca','#719d97','#d99cb4','#817aa5','#daabae','#7596b6','#b899bf'][n-1]:validColor(top?.color,'#87b6c9');
 const pale=tint(c,CREAM,.5);let back='',front='';
 if(outfit&&(n===5||n===7||n===10))back=path(n===7?'M81 155l-21 112 43-11 19 9 37-9 24 11-26-111z':'M78 154l-30 100 35-10 34 15 34-15 34 11-28-102z',tint(c,INK,.1))+line('M66 242l12-53M175 241l-16-52',pale,2.3);
 if(outfit&&[4,6,8,10].includes(n)){
  front=path(n===8?'M86 180h66l-9 37 31 20-15 8-5 13-36-8-36 8-2-11-20-9 35-21z':n===10?'M85 182h70l-5 34q31 30 37 57-66 26-132 0 8-30 34-57z':n===6?'M86 181h67l-5 32 33 56q-60 23-124 0l37-55z':'M86 182h67l-5 31 24 43q-50 19-104 0l23-42z',c);
  front+=line(n===8?'M96 225l-8 18M145 225l9 18M118 225v19':'M96 222l-15 39M141 222l14 39M120 229v40',pale,3);
  if(n===4)front+=path('M72 244q47 19 96 0l4 11q-50 19-104 0z','#e8c781',INK,1.5);
  if(n===6||n===10)front+=path('M92 212l27 17 29-17q-3 34-29 52-27-20-27-52z',pale,INK,1.8);
 }else front=bottoms({id:'bottom_denim_01',color:outfit&&n===3?'#a88d6c':outfit&&n===9?'#506a95':'#688398'});
 const sleeve=outfit&&n===8?'M85 160l-15 16 12 21 19-17M155 160l16 16-13 21-19-17':outfit&&[6,10].includes(n)?'M83 158q-22 1-23 22 3 20 26 11l12-20M157 158q22 1 23 22-3 20-26 11l-12-20':'M86 157l-22 13-11 37 26 6 15-31M154 157l22 13 11 37-26 6-15-31';
 front+=path(sleeve,c)+path('M88 151l19-7h26l20 8 7 66q-42 10-80 0z',c);
 front+=path('M102 147q16 18 35 0l-8 23-11 3-14-12z',CREAM,INK,2);
 if((outfit&&n===2)||(!outfit&&n===4))front+=path('M88 155l31 31 31-31 7 62q-36 10-74 0z',tint(c,INK,.12))+line('M119 188v30',pale,2.4)+path('M113 166l12 0 5 19-11 7-10-7z','#b77977',INK,1.5);
 else if((outfit&&n===3)||(!outfit&&n===2)){
  front+=path('M96 145q24-15 48 0l-8 18-13-3-13 4z',pale)+ellipse(120,190,12,12,'#e4bd81',1.6)+line('M116 186h1m10 7h1m-14 3h1','#8d6b4e',3)+path('M99 207q20 6 43 0l-3 8h-37z',tint(c,INK,.1),INK,1.5);
 }else if(outfit&&n===7){front+=path('M100 149l20 24 19-24-3 44-17 22-16-22z',pale)+star(120,193,10,'#e4c581');}
 else if(outfit&&[6,8,10].includes(n))front+=bow(121,211,n===10?'#e7c27f':'#c58099')+heart(120,180,9,CREAM);
 else if(!outfit&&n===3)front+=heart(120,190,13,CREAM)+line('M88 214h65M64 199l14 5M163 204l12-5',pale,3);
 else {front+=star(120,188,outfit&&n===9?14:11,'#f1d287');if(outfit&&n===9)front+=line('M88 214l11-47M152 214l-10-47','#ecd69b',3)+star(71,186,6)+star(170,186,6);}
 if(outfit&&n===5)front+=path('M83 156l21 7 16-7 18 7 18-7-11 24-24 2-27-5z','#d9b876',INK,1.8);
 return {back,front};
}
export function buildAvatarLayers(avatar={},parts=[],options={}){
 const selected=resolveAvatarArtParts(avatar,parts),skin=validColor(selected.body?.color,'#f3c7a6'),shadow=tint(skin,'#945f56',.2);
 const {back,front}=garments(selected.top,selected.outfit);const layers=[];
 const add=(slot,art)=>{if(art)layers.push({slot,art});};
 if(options.background!==false)add('background',background(selected.background));
 add('effect',effects(selected.effect));add('accessory',accessories(selected.accessory,true));add('hair',hairArt(selected.hair,true));add('outfit',back);
 add('body',path('M86 218l-1 49 23 0 6-43M132 225l5 42h23l-6-49',skin)+path('M87 164q-20 13-32 52-2 19 13 20 16-2 21-30M153 164q22 15 33 52 1 19-13 20-15-2-22-30',skin)+path('M93 148l11-15h30l15 17 11 67q-39 14-79-1z',skin)+path('M104 130h31v23q-14 17-31-1z',shadow)+ellipse(62,98,10,14,skin)+ellipse(178,98,10,14,skin)+path('M62 83q0-49 58-49 57 0 58 49l-4 30q-7 38-53 39-47-1-55-39z',skin)+line('M74 78q5-28 28-31',tint(skin,CREAM,.5),4));
 if(!selected.outfit)add('bottom',bottoms(selected.bottom));
 add('shoes',shoes(selected.shoes));
 add(selected.outfit?'outfit':'top',front);
 // Tops must not silently replace the selected separate bottom. Remove the helper's default shorts.
 if(!selected.outfit){const topLayer=layers.at(-1);const defaultShorts=bottoms({id:'bottom_denim_01',color:'#688398'});topLayer.art=front.startsWith(defaultShorts)?front.slice(defaultShorts.length):front;}
 add('body',path('M56 212q-5 13 4 20 12 6 16-7l-1-8M165 218q-1 17 12 15 12-5 8-19',skin)+line('M62 222l0 4M177 223l-1 4',shadow,2));
 add('face',faceArt(selected.face,options.mood||'idle'));add('hair',hairArt(selected.hair,false));add('accessory',accessories(selected.accessory,false));
 return layers;
}
export function renderAvatarSvg(avatar={},parts=[],options={}){
 const crop=options.crop||'0 0 240 320';
 const allowedCrops=['0 0 240 320','36 13 169 154','55 70 131 80','50 139 140 159'];
 const viewBox=allowedCrops.includes(crop)?crop:allowedCrops[0];
 const label=options.label||'나의 탐험가';
 const layers=buildAvatarLayers(avatar,parts,options);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="hw-avatar" data-art-version="${AVATAR_ART_VERSION}" role="img" aria-label="${escape(label)}"><title>${escape(label)}</title>${layers.map(({slot,art})=>`<g data-avatar-layer="${slot}">${art}</g>`).join('')}</svg>`;
}
export function renderAvatarItemSvg(item,parts=[],current={}){
 const defaults=Object.fromEntries(AVATAR_SLOTS.map(slot=>[slot,parts.find(p=>p.slot===slot&&p.cost===0)?.id||'']));
 const look={...defaults,...current,[item.slot]:item.id};
 if(item.slot==='top'||item.slot==='bottom')look.outfit='';
 const crop=['hair','face'].includes(item.slot)?'36 13 169 154':'0 0 240 320';
 return renderAvatarSvg(look,parts,{crop,label:item.name});
}
export function renderAvatarLayerSvg(item,parts=[]){
 const layers=buildAvatarLayers({[item.slot]:item.id},parts).filter(l=>l.slot===item.slot);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" role="img" aria-label="${escape(item.name)}">${layers.map(l=>l.art).join('')}</svg>`;
}
/** Export the exact current preview, including offline/Phaser failure. No canvas dependency on the game. */
export async function downloadAvatarPng(avatar,parts,filename='heather-avatar.png'){
 const url=URL.createObjectURL(new Blob([renderAvatarSvg(avatar,parts).replace('<svg ','<svg width="720" height="960" ')],{type:'image/svg+xml'}));
 try{
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=960;
  const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');context.drawImage(image,0,0,720,960);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG export failed')),'image/png'));
  const png=URL.createObjectURL(blob);try{const link=document.createElement('a');link.href=png;link.download=filename;link.click();}finally{setTimeout(()=>URL.revokeObjectURL(png),1000);}
  return true;
 }finally{URL.revokeObjectURL(url);}
}
if(typeof window!=='undefined')window.HeatherAvatarArt=Object.freeze({renderAvatarSvg,downloadAvatarPng,version:AVATAR_ART_VERSION});
