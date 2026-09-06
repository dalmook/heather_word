/* Legacy XP friends and pet-care companions are independent collections.
 * Family-based artwork intentionally does not claim 1,000 hand-designed species.
 */
import {tint} from './character-art.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const INK='#40524f',LIGHT='#fff4db';
const FAMILY_COLORS=['#b8cec1','#e6c177','#c4dcdd','#d6bad0','#f1e4d0','#dbaa7d','#c6b4d8','#a0bfa1','#d7a77c','#e4c77f','#94bbc9','#c2add0','#dcba80','#d8a3a7','#a6c8a0','#d5b47d','#a2b8c5','#a7c29a','#d8bc94','#dec089'];
const PALETTES=['#ebc98d','#e4b494','#a9cfc4','#b7c2de','#d4b7d0'];
export const LEGACY_ART_FAMILIES=Object.freeze(['egg','chick','cloud','rabbit','panda','fox','unicorn','dragon','phoenix','star','whale','butterfly','tiger','octopus','frog','lion','penguin','trex','bear','crown']);
export const PET_ART_IDS=Object.freeze(['cookie_puppy','mellow_cat','star_bunny','cloud_penguin','jelly_dragon']);
function brush(locked=false){
 const parts=[];
 const shape=(d,c,w=3)=>parts.push(`<path d="${d}" fill="${locked?INK:c}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
 const detail=(d,c=INK,w=2.5)=>{if(!locked)parts.push(`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);};
 const oval=(x,y,rx,ry,c,w=3)=>shape(`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${2*rx} 0a${rx} ${ry} 0 1 0 ${-2*rx} 0`,c,w);
 const face=(x,y,gap=37,happy=false)=>{
  if(locked)return;
  for(const dx of [-gap/2,gap/2]){if(happy)detail(`M${x+dx-6} ${y}q6-8 12 0`,INK,3);else{parts.push(`<g class="hw-character-eye"><ellipse cx="${x+dx}" cy="${y}" rx="6" ry="8" fill="${INK}"/><circle cx="${x+dx-1.5}" cy="${y-3}" r="2" fill="#fff9ed"/></g>`);}}
  detail(`M${x-7} ${y+18}q7 7 14 0`,INK,2.5);parts.push(`<g fill="#e29794" opacity=".45"><ellipse cx="${x-gap/2-10}" cy="${y+12}" rx="8" ry="4"/><ellipse cx="${x+gap/2+10}" cy="${y+12}" rx="8" ry="4"/></g>`);
 };
 const star=(x,y,r=12,c='#e5bb72')=>shape(`M${x} ${y-r}l${r*.31} ${r*.63} ${r*.7} ${r*.1} ${-r*.5} ${r*.5} ${r*.11} ${r*.7} ${-r*.62} ${-r*.32} ${-r*.62} ${r*.32} ${r*.11} ${-r*.7} ${-r*.5} ${-r*.5} ${r*.7} ${-r*.1}z`,c,2);
 return {parts,shape,detail,oval,face,star,locked};
}
function mammal(b,f,c,happy){
 const {shape,oval,detail,face}=b;
 if(f==='fox')shape('M156 170q43-25 42-66 32 58-8 82l-25 11z',c);
 if(f==='rabbit'){shape('M81 89Q55 23 76 22q22 8 30 57M135 75q12-59 31-50 18 14-6 65',c);detail('M79 40l13 38M161 39l-13 42','#d8a2a4',7);}
 if(f==='unicorn'){shape('M149 165q43-15 32-58 32 12 23 43l-23 38z','#c9b4c7');shape('M102 76l18-61 20 60z','#e1c182');detail('M112 44l16 5M108 58l26 6',LIGHT,3);}
 const round=['panda','tiger','lion','bear'].includes(f);
 if(f==='lion')shape('M65 82l1-33 27 3 25-22 26 21 31-2 4 31 26 19-16 25 7 30-33 8-18 26-28-14-30 11-16-28-31-7 11-29-15-24z','#c39965');
 if(round){oval(77,73,22,24,c);oval(166,73,22,24,c);if(f==='panda'){oval(77,73,17,19,INK,0);oval(166,73,17,19,INK,0);}else{oval(77,73,11,12,tint(c,'#bb8270',.32),0);oval(166,73,11,12,tint(c,'#bb8270',.32),0);}}
 else if(f!=='rabbit')shape('M66 98L63 45l41 30M137 75l39-30 0 58',c);
 oval(121,167,47,44,c);oval(86,202,23,12,tint(c,INK,.14));oval(156,202,23,12,tint(c,INK,.14));
 shape('M64 105q0-43 58-44 55 4 56 47 1 40-57 48-60-5-57-51z',c);
 if(f==='panda'){oval(98,112,16,20,INK,0);oval(147,112,16,20,INK,0);if(!b.locked){oval(98,110,6,8,LIGHT,0);oval(147,110,6,8,LIGHT,0);detail('M116 137q7 5 14-1',INK,3);}}
 else {if(f==='fox')shape('M67 115l28 3 26-14 23 14 33-4q-11 37-55 41-42-6-55-40z',LIGHT,0);face(121,111,42,happy);}
 if(['tiger','lion','bear'].includes(f)){shape('M111 126q10-6 20 0l-10 7z','#956653',2);}
 if(f==='tiger'){detail('M102  70 l12 6',INK,4);detail('M122 69v12M141 73l-7 7M 70 111l13 4m-11 10 13 2M172 111l-13 4m11 10-13 2',INK,4);}
 if(f==='unicorn'){shape('M87 79q13-35 47-27l24 28-33-5-15 21-23 5z','#c8b5d2');detail('M104 68l18-6','#ede1e9',4);}
 shape('M76 157q-24 0-24 18 10 15 26 7l13-13M167 156q23 4 20 20-12 14-27 4l-8-13',c);
 if(!b.locked)oval(121,179,22,16,tint(c,LIGHT,.65),0);
}
function familyArt(f,c,b,happy=false){
 const {shape,detail,oval,face,star}=b;
 if(['rabbit','panda','fox','unicorn','tiger','lion','bear'].includes(f)){mammal(b,f,c,happy);return;}
 if(f==='egg'){shape('M73 157q-9-33 12-70 34-55 66-4 22 35 15  70-13 51-58 43-30-4-35-39z',LIGHT);shape('M72 143l20 9 15-10 24 12 20-13 16 11 3 21q-4  30-42 37-42 0-55-34z',c,2);face(121,120,32,happy);detail('M88 87q10-23 19-27','#fffefa',5);star(120,179,14,'#c4b3c9');return;}
 if(f==='cloud'){shape('M51 139q-14-36 20-45-1-38 36-38 30-30 54 8 37-3 35 32 28 21 11 46-16 36-52 30-36 24-61-1-42 9-43-32z',c);face(123,117,47,happy);detail('M72 104q2-20 23-23',LIGHT,5);shape('M95 175l-15 29 24-6M145 175l14 29-23-6',tint(c,INK,.14));return;}
 if(f==='star'||f==='crown'){if(f==='star')shape('M120 30l29 47 59 14-32 48 3 61-57-20-58 21 3-61-35-48 60-14z',c);else shape('M56 170L43 70l48 27 30-60 31 60 47-29-17 102q-59 22-126 0z',c);face(120,122,43,happy);detail('M78 100l17-9M108 54l10-10',LIGHT,5);if(f==='crown')star(120,70,10,'#c1accc');return;}
 if(f==='chick'||f==='penguin'||f==='phoenix'){
 if(f==='phoenix'){shape('M98 169l-29 45 37-6 15-22 21 25 35-5-30-43',c);shape('M 70 111l-43-42 2 41-13 13 22 19 9 31 35-34M170 111l43-42-2 41 13 13-22 19-9 31-35-34',c);}
 else shape('M76 125q-33 14-39 47l28-9 17 9M165 125q33 14 39 47l-28-9-17 9',c);
 oval(93,201,24,12,'#d5a574');oval(149,201,24,12,'#d5a574');
 shape('M69 113q-1-51 51-54 53 3 54 56l3  50 q-6 44-56 40-50 3-55-41z',c);
 if(f==='penguin')shape('M 80 126q4-38 39-22 39-17 44 21l-3 47q-38 30-74-1z',LIGHT,0);
 face(121,116,39,happy);shape('M111 134l10-9 12 9-11 10z','#e8b775',2);
 if(f==='chick')shape('M111 62l-5-28 17 14 17-16-3 32z',c);
 if(f==='phoenix')shape('M100 66l-4-34 25 19 22-22-1 42-20 15z','#e5bc77');
 return;
 }
 if(f==='whale'){shape('M173 143q27-17 39-48l17 8-11 28 12 19-25 18-18 13q-30 36-88 20-60-15-68-60-5-49 49-50  60-2 73 52z',c);shape('M64 155q29 36 93 19-22 41-64 22-27-9-29-41z',LIGHT,0);oval(81,127,7,9,INK,0);if(!b.locked)oval(79,124,2,3,LIGHT,0);detail('M64 145q18 9 35-3',INK,3);shape('M115 162q-9 35 24 33l19-17z',tint(c,INK,.12));shape('M85 84q-25-25-13-34 14-8 18 18 4-36  20-23 7 15-25 39z','#a5d7d0');return;}
 if(f==='butterfly'){
 shape('M111 106Q72 38 36 63 11 113  70 134Q26 154 47 193q46 17 69-46M129 106q39-68 75-43 25 50-70 71  50 20 29 59-46 17-69-46',c);
 shape('M98 107Q67 65 48  80 q-7 32 45 41M143 107q31-42 50-27 7 32-45 41',tint(c,LIGHT,.55),1.5);
 oval(120,134,15,49,'#a2b69e');oval(120,92,23,22,'#a2b69e');face(120,90,18,happy);detail('M110 74l-9-23M130 74l9-23',INK,4);return;
 }
 if(f==='octopus'){shape('M64 136Q39  70 99 55q 70-16 78 59l-9  30 q37 8 41  30-5 24-29 5l-17-16q20  50-4  50-20-7-21-41-6  50-29 41-8-17 2-35-31 50-43 22 0-17 24-37-45 24-50-1 6-20 33-26z',c);face(117,109,43,happy);detail('M82 88q16-17 35-18',LIGHT,5);return;}
 if(f==='frog'){
  oval(120,164,53,40,c);
  oval(89,83,23,25,c);oval(154,83,23,25,c);shape('M63 109q-2-37 57-39 57 2 58 40-6 36-57 38-52-2-58-39z',c);face(121, 90,65,happy);oval(121,169,32,28,LIGHT,0);shape('M84 180q-44-14-43 17l29 9 34-15M155 180q44-14 43 17l-29 9-34-15',c);return;
 }
 if(f==='dragon'||f==='trex'){
  shape('M153 165q41-13 49-48l11 40-18 32-41 12z',c);
  if(f==='dragon')shape('M90 123L54 75l-18 35-15 26 31 3 21 27M158 123l27-48  20 31 15 30-29 3-17 27',tint(c,'#dcb687',.4));
  shape('M81 131q-18 46 6 68  30 25  70-1 11-29-14-62z',c);oval(87,204,23,11,c);oval(151,204,25,11,c);oval(122,174,29,27,LIGHT,0);
  shape('M63 101q-11-47 35-48 39-1 48  30 l 30 10q20 6 13  30-4 31-56  20-57 9-70-27z',c);oval(103,91,7,9,INK,0);if(!b.locked)oval(101,88,2,3,LIGHT,0);detail('M132 122q26 8 44-1',INK,3);shape('M87 152l-16 18 11 12 20-17',c);
  if(f==='dragon')shape('M75 61l-5-25 24 19M128 60l17-22-4 36',tint(c,'#dcb687',.3));
  else shape('M76 63l-11-20 23 8 5-23 13 25z','#91b59c');return;
 }
}
function wrap(b,id,name,options={}){
 const shadow=options.locked||options.shadow===false?'':'<ellipse cx="120" cy="217" rx="65" ry="8" fill="#45614e" opacity=".12"/>';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" class="hw-character hw-companion" data-character-id="${escape(id)}" role="img" aria-label="${escape(name)}"><title>${escape(name)}</title>${shadow}<g class="hw-character-body">${b.parts.join('')}</g></svg>`;
}
export function renderLegacyMonster(monster={},options={}){
 const number=Math.max(1,Math.min(1000,Math.floor(Number(monster.number)||Number(String(monster.id||'').replace('monster_',''))||1)));
 const family=LEGACY_ART_FAMILIES[(number-1)%20],tier=Math.floor((number-1)/20),c=tint(FAMILY_COLORS[(number-1)%20],PALETTES[tier%5],(tier%5)*.05);
 const b=brush(Boolean(options.locked));familyArt(family,c,b,options.mood==='happy');
 if(tier>0&&family!=='egg'&&family!=='star'&&family!=='crown'){
  b.shape('M95 151l25 8 26-8 0 12-25 7-26-8z',PALETTES[(tier+2)%5],2);
  if(tier>=10)b.star(120,166,7,'#e6c280');
  if(tier>=25){b.star(57,183,7,'#e6c280');b.star(184,185,7,'#e6c280');}
 }
 return wrap(b,monster.id||`monster_${String(number).padStart(3,'0')}`,options.ariaLabel||monster.name||'XP 도감 친구',options);
}
export function renderEggSvg(options={}){
 const b=brush(Boolean(options.locked));familyArt('egg','#b6cbb8',b);return wrap(b,'waiting-egg',options.ariaLabel||'아직 만나지 않은 친구의 알',options);
}
export function renderPetSvg(pet={},options={}){
 const id=pet.id||'',b=brush(Boolean(options.locked)),happy=options.mood==='happy';
 if(id==='cookie_puppy'){
  b.shape('M161 169q29-4 33-29 20 26-8 43l-22 9z','#cbaa7e');
  b.oval(120,175,44, 30,'#e5c99f');b.oval(90,202,22,11,'#cead7e');b.oval(151,202,22,11,'#cead7e');
  b.shape('M70 89q8-39 51-40 47 3 52  40 l-1 44q-10  30-51 32-50-3-55-40z','#e5c99f');
  b.shape('M78 67q-40-8-40  40 0 35 26 32l19-46M162 66q40-8 40  40 0 35-26 32l-19-46','#a98863');b.face(122,109,41,happy);b.oval(122,132,22,17,LIGHT,0);b.shape('M115 125q9-6 16 0l-8 7z','#8f7057',2);b.detail('M120 135q5 7 11 0');b.shape('M 80 160l18 8-4 21-29-7z','#cead7e');b.oval(148,175,17,17,'#dfb97d');b.detail('M142 171h1m10 10h1m-15-1h1','#87694f',3);
 }else if(id==='mellow_cat'){
  b.shape('M163 174q 40 8  30-27-9-10-14-1 0 7 9 8','#dfbfd0');mammal(b,'cat','#eddbd1',happy);b.detail('M111 74l9 8 9-8','#cbb3c3',4);b.shape('M101 157l19 9 20-9-2 16-18 8-19-8z','#a3bfb4',2);b.star(120,174,7,'#e2c585');
 }else if(id==='star_bunny'){
  mammal(b,'rabbit','#d8d4e9',happy);b.star(121,78,9,'#e8c788');b.shape('M91 156l28 9 30-9-4 17-24 5-25-7z','#97b5b7',2);b.star(120,181,10,'#e6c787');
 }else if(id==='cloud_penguin'){
  familyArt('penguin','#9bb5c3',b,happy);b.shape('M82 76q-4-17 11-20 8-20 26-9 13-13 27 1 22 1 15 25z','#e5f1e9',2);b.shape('M80 149q41 17 82-1l-4 17-36 7-37-7z','#baa9c7',2);b.shape('M142 167l17 28-19-4-13-22z','#baa9c7',2);
 }else if(id==='jelly_dragon'){
  familyArt('dragon','#bbcaad',b,happy);b.shape('M107 53l9-22 15 15-2 17z','#c7b7d9',2);b.detail('M84 77q8-10 19-11',LIGHT,4);b.oval(122,177,14,11,'#ead2bf',0);
 }else return renderEggSvg(options);
 const level=Math.max(1,Number(options.level)||1);
 if(level>=7)b.star(78,182,8,'#e2c47b');if(level>=12){b.star(51,145,6,'#d9c481');b.star(187, 80,6,'#d9c481');}
 return wrap(b,id,pet.name||'나의 돌봄 친구',options);
}
const CHARM={
 ribbon:b=>{b.shape('M111 110Q55 55  50 105l5 53  50-20 M129 110q56-55 61-5l-5 53-50-20','#d998aa');b.oval(120,121,15,18,'#edc1c7');},
 star_pin:b=>{b.star(120,120,63,'#e5c783');b.star(120,120, 30,'#fff0c6');},
 flower_crown:b=>{b.shape('M 50 148q70-55 140 0l-8 17q-62-45-125 0z','#8fae94');for(const x of [ 70,120,170]){for(let i=0;i<5;i++)b.oval(x+Math.cos(i*1.256)*13,120+Math.sin(i*1.256)*13,11,11,'#ecdac4',2);b.oval(x,120,8,8,'#e9bf6f',1);}},
 heart_pin:b=>b.shape('M120 178Q22 110  60 77q31-25 60 8 29-33 60-8 38 33-60 101z','#d99baa'),
 sunglasses:b=>{b.shape('M 40 95h66l-5 51q-30 23-50-4zM134 95h66l-15 47q-20 27-50 4z','#667f86');b.detail('M105 113h 30 M45 101l-16-7M196 101l16-7',INK,7);b.detail('M58 110l22 0M146 110h22','#d6e5dd',4);},
 magic_hat:b=>{b.shape('M74 147l21-76 40-37 20 113z','#8e89aa');b.shape('M 40 153q80-33 160 0-70 47-160 0z','#a1a0b5');b.star(122,108,17,'#ead19b');},
 party_hat:b=>{b.shape('M 60 178l 60-128  60 128z','#a1bfad');b.detail('M86 135l67 18M103 99l 30 12','#e4c791',11);b.oval(120,48,12,12,'#d8a3aa');},
 headphones:b=>{b.detail('M61 141V101q0-58 59-58t59 58v40','#819da4',18);b.shape('M48 111h33v 60 H48q-17-20 0-60 M159 111h33q17 40 0  60 h-33z','#d7b890');b.detail('M 60 127v27M179 127v27',LIGHT,5);},
 school_bag:b=>{b.shape('M93 68v-18h54v18M65 79q56-27 110 0l9 111H56z','#b68e95');b.shape('M67 83q56-19 105 0l-8 47-86 0z','#d6acb0');b.shape('M 90 142h 60 v37H90z','#e1c296');b.star(121,106,12, LIGHT);},
 medal:b=>{b.shape('M 60 40h44l24 67-31 17zM180 40h-44l-24 67 31 17z','#9db4c1');b.oval(120,145, 40,40,'#dfbc78');b.star(120,145,24,LIGHT);},
 crown:b=>{b.shape('M51 161L39 77l 50 23 31-47 31 47 50-23-12 84z','#e4c287');b.star(120,128,20,LIGHT);},
 wings:b=>{b.shape('M112 169Q26 155 29  70 l33 27 9-26 42 69M128 169q86-14 83-99l-33 27-9-26-42 69','#d8e5df');b.detail('M45 99l50  50 M195 99l-50 50','#9eb9ba',5);},
 crystal:b=>{b.shape('M 80  60 h 80 l42 51-82 79-82-79z','#a3c5c8');b.detail('M80 60l-5 51 45 79 43-79-3-51M38 111h164M75 111l45-51 43 51',LIGHT,3);},
 rainbow_aura:b=>{for(let i=0;i<4;i++)b.detail(`M${36+i*18} 177V120a${84-i*18} ${84-i*18} 0 0 1 ${168-i*36} 0v57`,['#d7a1aa','#e1c48d','#9cbcaf','#9faccd'][i],13);},
 rocket_pack:b=>{b.shape('M85 148V82l35-43 34 43v66l28 35-37-6h-49l-40 6z','#a5b7b6');b.oval(120,105,20,20,'#d8e5e0');b.shape('M99 174l21 40 21-40z','#e3ba7e');},
 moon_charm:b=>{b.shape('M159  50 q-90 0-100 72 5  70 81  60 39-13  50-47-50 32-78-11-24-42 47-74z','#e5c78d');b.star(169,119,21,'#acb6c7');},
 trophy:b=>{b.shape('M78 62h84l-9  70-30 24-30-24z','#dfbb78');b.detail('M78 77H47q-4  50 45 48M160 77h33q4 50-45 48',INK,7);b.shape('M110 150h22v26l27 14H82l28-14z','#caa66e');b.star(120,104,18,LIGHT);},
 legend_crown:b=>{b.shape('M51 161L39 77l 50 23 31-47 31 47 50-23-12 84z','#bdaccb');b.star(120,128,20,'#f0d69c');b.star( 40,65,11,'#ebcd97');b.star(202,65,11,'#ebcd97');b.star(120, 40,10,'#ebcd97');}
};
export const CHARM_ART_IDS=Object.freeze(Object.keys(CHARM));
export function renderCharmSvg(item={},options={}){const b=brush(Boolean(options.locked));(CHARM[item.id]||CHARM.star_pin)(b);return wrap(b,item.id||'charm',item.name||'꾸미기 소품',{...options,shadow:false});}
