/* Heather Word character studio. Original vector drawings; no remote assets.
 * This module is presentation-only: it never reads or writes learner state.
 * Coordinates: 240 square, ground 216, 12px safe area. No SVG fragment IDs.
 */
export const CHARACTER_ART_VERSION = '13.0.0';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hex = (value, fallback='#a3d6ba') => /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
export function tint(color, toward, amount=.25) {
  const a=hex(color), b=hex(toward);
  return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-amount)+parseInt(b.slice(i,i+2),16)*amount).toString(16).padStart(2,'0')).join('');
}
function studio(palette, locked=false, mood='idle') {
  const p=Array.isArray(palette)?palette:[];
  const main=hex(p[0]), ink=tint(hex(p[1],'#35594a'),'#25343c',.48), light=hex(p[2],'#fff5dc');
  const shade=tint(main,ink,.19), gleam=tint(main,'#ffffff',.55), gold='#edb75f';
  const parts=[];
  const shape=(d,fill=main,width=3.4)=>parts.push(`<path d="${d}" fill="${locked?'#354a48':fill}" stroke="${locked?'#354a48':ink}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`);
  const detail=(d,fill='none',color=ink,width=2.4)=>{if(!locked)parts.push(`<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`);};
  const oval=(x,y,rx,ry,fill=main,width=3.4)=>shape(`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0`,fill,width);
  const dot=(x,y,r,fill=ink)=>{if(!locked)parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`);};
  const eye=(x,y,r=7,mode=mood)=>{
    if(locked)return;
    parts.push('<g class="hw-character-eye">');
    if(mode==='happy') detail(`M${x-r} ${y+2}q${r} ${-r-4} ${r*2} 0`,'none',ink,3.4);
    else {parts.push(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r+2}" fill="${ink}"/>`);dot(x-2,y-3,2.6,'#fffdf5');dot(x+2,y+3,1.15,gleam);}
    parts.push('</g>');
  };
  const face=(x,y,gap=31,mode=mood)=>{
    eye(x-gap/2,y,6.4,mode);eye(x+gap/2,y,6.4,mode);
    detail(`M${x-7} ${y+18}q7 7 14 0`,'none',ink,2.8);
    if(!locked) parts.push(`<g fill="#ee938b" opacity=".42"><ellipse cx="${x-gap/2-10}" cy="${y+13}" rx="8" ry="4"/><ellipse cx="${x+gap/2+10}" cy="${y+13}" rx="8" ry="4"/></g>`);
  };
  const star=(x,y,r=8,fill=gold)=>shape(`M${x} ${y-r}l${r*.31} ${r*.64} ${r*.71} ${r*.1} ${-r*.51} ${r*.5} ${r*.12} ${r*.71} ${-r*.63} ${-r*.34} ${-r*.63} ${r*.34} ${r*.12} ${-r*.71} ${-r*.51} ${-r*.5} ${r*.71} ${-r*.1}z`,fill,2.2);
  const cookie=(x,y,r=20)=>{oval(x,y,r,r,'#eabc78',3);detail(`M${x-r+5} ${y-3}q2 ${-r+6} ${r-4} ${-r+6}`,'none','#ffe5b0',3);for(const [dx,dy] of [[-7,-7],[7,-4],[-4,7],[9,8]])dot(x+dx,y+dy,2.8,'#815135');};
  const leaf=(x,y,size=25,flip=1)=>{shape(`M${x} ${y}q${-size*flip} ${-size*1.3} ${size*.5*flip} ${-size*1.7}q${size*.8*flip} ${size*.7} ${-size*.5*flip} ${size*1.7}z`,'#72ba86',2.7);detail(`M${x} ${y-3}l${size*.25*flip} ${-size*1.1}`,'none',ink,2);};
  const scarf=(x,y,w=60,c='#4fa7a1')=>{shape(`M${x-w/2} ${y}q${w/2} 12 ${w} 0l-4 14q${-w/2+4} 12 ${-w+8} 0z`,c,3);shape(`M${x+12} ${y+13}q18 9 21 27l-17-4-9-25z`,c,2.5);detail(`M${x-w/2+8} ${y+7}q${w/2-8} 9 ${w-16} 0`,'none',tint(c,'#ffffff',.3),2);};
  return {main,ink,light,shade,gleam,gold,shape,detail,oval,dot,eye,face,star,cookie,leaf,scarf,parts,locked};
}
const DRAW = {};
DRAW.crumb_bear=(a,s)=>{
 const {shape,detail,oval,dot,face,cookie,scarf,main,light,shade,gleam}=a;
 // A biscuit courier becomes a scalloped-cookie guardian, not a scaled baby.
 if(s===3){shape('M77 114Q38 138 35 195q28 16 59-3l57-1q31 17 51 0-6-44-34-72z','#5caaa1');detail('M51 187q16 6 31-2M163 185l22 5','none','#d4f0d5',3);}
 oval(s===1?91:82,204,s===1?18:22,12,shade);oval(s===1?149:158,204,s===1?18:22,12,shade);
 shape(s===1?'M76 143q-5 38 8 53 28 23 66 2 17-19 12-53z':s===2?'M80 119Q56 151 73 194q48 28 98-1 14-42-16-74z':'M76 112q-23 27-17 65 2 34 41 32h48q35 0 32-39-2-36-22-55z',main);
 detail(s===1?'M87 171q35 15 65-1l-6 22q-30 16-54-1z':'M76 169q44 22 92-2l-5 25q-45 22-81-1z',light,light,0);
 oval(s===1?78:74,s===1?79:62,s===1?23:24,s===1?24:25,main);oval(s===1?162:166,s===1?79:62,s===1?23:24,s===1?24:25,main);
 dot(s===1?78:74,s===1?79:62,12,'#ca8a52');dot(s===1?162:166,s===1?79:62,12,'#ca8a52');
 shape(s===1?'M64 112Q60 73 89 65q33-13 62 0 33 7 29 47 3 44-58 47-61-1-58-47z':'M57 101q1-44 46-47h35q42 6 44 48 3 44-62 47-66-3-63-48z',main);
 detail(s===1?'M76 105q2-30 30-30':'M71 91q7-27 31-27','none',gleam,5);
 detail(`M96 ${s===1?125:118}q24-22 48 0-2 27-24 27-23 0-24-27z`,light,light,0);
 face(120,s===1?112:101,39);detail(`M115 ${s===1?126:115}q5-4 10 0l-5 4z`,a.ink,a.ink,1);
 if(s>=2){scarf(120,146,77,s===3?'#bc6251':'#4caaa0');shape('M79 158l16 3-3 37-22-3z','#956841',2.5);detail('M73 169l19 3','none',light,2);}
 if(s===3){shape('M78 53l1-22 15 6 9-14 17 12 16-12 9 14 15-6 1 22q-43 16-83 0z','#e8b26a');detail('M86 49q34 9 65 0','none','#fff0c8',4);dot(105,45,3);dot(136,45,3);cookie(174,163,29);shape('M48 147q-17 0-18 16 2 21 23 17l13-15z',main);cookie(43,164,12);}
 else {cookie(s===1?124:153,s===1?174:173,s===1?23:24);shape(s===1?'M78 153q-15 6-10 20 9 13 29 7l7-13z':'M66 147q-18 7-12 21 11 13 24 1z',main);shape(s===1?'M162 153q16 5 10 19-7 12-23 5l-6-12z':'M173 148q17 6 12 22-9 12-22 4l-5-12z',main);}
};
DRAW.gear_bot=(a,s)=>{
 const {shape,detail,oval,dot,eye,star,main,ink,light,shade}=a;
 if(s===1){oval(120,204,23,16,ink);detail('M108 199v10m12-12v14m12-12v10','none','#a4beb9',3);shape('M83 141l-20 8-5 26 14 5 12-18M157 141l20 8 5 26-14 5-12-18',main);shape('M83 111q37-17 74 0v64q-1 21-37 20-37 1-37-20z',main);}
 else {for(const x of [s===3?78:92,s===3?160:148]){shape(`M${x-14} 173v30l-10 4v12h42v-17l-6-29z`,shade);detail(`M${x-14} 211h25`,'none',light,3);}shape(s===2?'M78 112h84l13 52-16 31H81l-15-31z':'M67 103h108l16 58-20 37H69l-19-37z',main);}
 if(s===3){shape('M66 98L39 88l-18 21 5 29 33 8z','#efb85e');shape('M176 98l27-10 18 21-5 29-33 8z','#efb85e');shape('M28 139l-9 23 8 31 31-4 9-28-9-17z',main);shape('M182 144l-9 17 9 28 31 4 8-31-9-23z',main);for(const x of [44,196]){oval(x,165,12,12,'#83c5be',3);dot(x,165,4,light);detail(`M${x-8} 184h14`,'none',light,3);}shape('M79 136h84v29l-15 17H94l-15-17z','#365e63');detail('M91 148h61M100 160h44','none','#99e3c0',4);star(121,162,11,'#f2ca76');}
 if(s===2){shape('M77 124l-30 8-8 28 20 11 19-27M163 124l30 8 8 28-20 11-19-27',main);oval(49,164,13,13,'#efb85e');oval(191,164,13,13,'#efb85e');shape('M101 154h38v27h-38z','#437776',2);detail('M109 163h22m-22 9h13','none','#bceecb',3);}
 // Antenna is a tuning fork in the final form.
 if(s===3){shape('M107 56V27h-9V18h22v35h7V18h20v10h-9v28z','#efb85e',3);}else{detail(`M120 ${s===1?71:57}V${s===1?48:34}`,'none',ink,5);oval(120,s===1?45:31,9,8,'#f1b95f');}
 shape(s===1?'M75 86q0-18 18-18h54q19 0 19 18v47q0 16-18 16H93q-18 0-18-16z':s===2?'M68 65q0-15 21-15h63q21 0 21 15v62q0 17-22 17H89q-21 0-21-17z':'M69 63l13-13h76l15 13v58l-16 17H84l-15-17z',main);
 shape(s===1?'M85 89h71v38H85z':s===2?'M81 74h79v48H81z':'M82 70h77v46H82z','#244951',3);
 eye(103,s===1?107:94,6,'happy');eye(138,s===1?107:94,6,'happy');detail(`M${s===1?113:111} ${s===1?123:111}h18`,'none','#c1efd0',3);
 if(!a.locked){a.parts.push(`<path d="M93 ${s===1?95:81}h11" stroke="#8fd5c8" stroke-width="4" stroke-linecap="round"/>`);}
 for(const [x,y] of [[78,s===1?82:62],[164,s===1?138:128]])dot(x,y,2.3,light);
};
DRAW.ember_drake=(a,s)=>{
 const {shape,detail,oval,dot,eye,main,light,shade,gold}=a;
 // Distinct wing anatomy and long S-tail; no flame-tail or borrowed monster silhouette.
 shape(s===1?'M147 181q30 11 50-5 11-13 8-26 22 23 4 42-24 25-62 6z':s===2?'M148 178q28 17 47-9 13-18 8-33 26 18 16 45-12 37-62 22z':'M149 175q43 33 57-14 5-16 0-34 27 39 3 68-31 40-72 4z',shade);
 if(s===1){shape('M81 140l-36-29 1 22-17 18 30 2 16 20z','#f9c57a');shape('M161 140l27-27 1 19 16 13-29 12z','#f9c57a');}
 if(s===2){shape('M81 145Q53 74 19 79l10 33-14 36 37-2 23 25z','#db706e');detail('M28 91l41 57M29 115l38 35','none',light,2.5);shape('M161 138Q183 70 221 80l-11 32 12 31-38 7-20 20z','#db706e');detail('M211 91l-39 56M209 115l-32 35','none',light,2.5);}
 if(s===3){shape('M83 132Q53 64 14 56l11 39-12 46 34-12 10 47 28-22z','#cc6667');detail('M22 68q21 28 52 73M27 101l46 40M49 134l24 7','none','#ffd0a2',2.5);shape('M157 131q27-67 68-75l-12 41 14 44-34-12-10 47-28-22z','#cc6667');detail('M217 68q-23 28-50 73M211 101l-42 40M191 135l-24 6','none','#ffd0a2',2.5);}
 oval(s===3?83:91,207,s===3?22:18,11,shade);oval(s===3?157:149,207,s===3?22:18,11,shade);
 shape(s===1?'M87 133q-23 21-9 56 15 25 43 22 40 2 45-28 2-29-22-49z':s===2?'M85 122q-24 36-9 75 40 24 84 0 21-36-12-75z':'M91 110q-30 32-23 73 1 30 47 28 49 5 55-21 1-46-32-78z',main);
 detail(s===1?'M106 145q25-11 32 9l12 32q-25 24-47 0z':'M106 132q18-7 29 7l19 54q-27 18-49-1z','#ffdaaa','#ffdaaa',0);
 detail('M110 167h27M110 182h32','none','#d99472',2);
 shape(s===1?'M73 96L60 66l24 8q33-29 70-5l22-12-3 34q14 17 8 36-7 28-45 26l-47-9q-25-15-16-48z':s===2?'M76 83L68 44l27 20q33-21 58 1l22-23 1 44q17 14 14 36-5 25-45 27l-54-12q-25-16-15-54z':'M80 81L69 37l31 24q29-13 50 1l26-30-1 49q20 12 19 33-2 26-40 29l-58-7Q69 124 80 81z',main);
 detail(s===1?'M82 75l-12-2 6 14':'M82 66l-5-12 14 15',light,light,0);
 shape(s===1?'M131 113q27-10 47 6l-2 18q-28 19-53 0z':'M134 106q37-10 55 4l-2 20q-30 16-58 0z',light,3);
 eye(s===1?104:106,s===1?107:99,s===3?8:7);dot(s===1?164:175,s===1?121:116,2.7,a.ink);detail(s===1?'M143 139q12 3 20-2':'M144 131q17 5 30-2','none',a.ink,2.5);
 if(s>=2){shape('M103 63q-9-21 6-39-1 13 13 18 14-5 17-15 7 25-11 31z','#eeb665',3);detail('M110 203l-7-5M126 207v-8M149 202l-5-7','none',light,3);}
 shape('M83 148q-17-4-23 9-3 12 13 15l19-10z',main);shape('M157 148q15-4 20 6 4 13-11 17l-15-10z',main);
 if(s===3){shape('M102 155l20-13 21 14-5 22-18 12-16-13z','#a55554',2.5);shape('M119 151q-11 15-5 22 11 8 17-4 1-8-5-16 0 10-7 10z',gold,2);}
};
DRAW.jam_mouse=(a,s)=>{
 const {shape,detail,oval,dot,face,main,light,shade,gleam}=a;
 shape(s===3?'M156 183q48 18 54-20-1-25-22-21-20 4-9 19 9 10 15-3':'M153 186q46 19 50-10-2-15-16-12',main,7);
 if(s>=2){shape('M58 121l28-5 8 56-31 8z','#e39989');shape('M54 116h35v12H54z','#975767',3);detail('M65 133l12-2 4 24-12 3z',light,light,0);}
 oval(s===3?99:100,205,22,10,shade);oval(s===3?161:151,202,20,10,shade);
 shape(s===1?'M91 132q-20 32-3 58 34 26 65-1 13-25-9-57z':s===2?'M92 121q-24 18-17 56 6 29 35 27l37-6q33-15 9-42l-19-35z':'M108 117q-25 11-35 34-9 37 15 48 32 15 57-11l25-23-15-39z',main);
 if(s>=2){shape(s===3?'M91 166l36-12 18 37-33 12-24-11z':'M82 163l33 7 45-10-2 32-46 11-27-12z','#645c8e');detail('M109 179l16 18','none',light,2.5);}
 oval(s===1?74:79,s===1?89:71,s===3?33:30,s===3?33:30,main);oval(s===1?165:169,s===1?84:64,s===3?32:28,s===3?34:30,main);
 dot(s===1?74:79,s===1?89:71,18,'#f8c5bd');dot(s===1?165:169,s===1?84:64,17,'#f8c5bd');
 shape(s===1?'M72 116q2-37 48-39 49 0 50 37-1 29-49 44-46-10-49-42z':'M78 103q1-38 42-38 52-5 54 31 9 34-35 53-53-6-61-46z',main);
 detail(s===1?'M95 128q24-17 47-3l-20 25z':'M112 121q25-13 45-9l-23 26z',light,light,0);
 face(s===1?121:132,s===1?111:99,s===1?37:39);oval(s===1?121:134,s===1?126:114,6,4,'#925260',1);
 detail(s===1?'M86 128l-15-4m17 12-16 2M153 128l15-6m-15 15 17 1':'M102 121l-16-3m19 11-15 3M159 112l16-7m-12 14 15-2','none',a.ink,2);
 if(s===1){shape('M111 156h34l3 36-40 2z','#a84f6b',2.8);shape('M108 153h39v9h-39z','#f3cba2',2);detail('M117 169h19v14h-19z',light,light,0);shape('M91 154q-17 14 4 21l17-8z',main);shape('M153 153q19 12 1 21l-9-6z',main);}
 else {a.scarf(127,143,65,'#f4c77f');shape('M82 145q-18 2-24 15l17 5 21-12z',main);shape('M162 142q27-8 32 5 1 13-22 15z',main);}
 if(s===3){shape('M101 66q23-25 50-9l12 10-29 12-42-2z','#625f8a');detail('M99 73l43-9','none','#ffe3a4',3);a.leaf(143,57,11);detail('M148 174l16-10M146 181l24-11','none','#ffe3a4',3);}
};
DRAW.mist_fox=(a,s)=>{
 const {shape,detail,oval,dot,face,main,light,shade,gleam}=a;
 shape(s===1?'M148 169q30-1 46-32 25 5 14 39-10 38-49 30l-22-14z':s===2?'M148 158q41-22 47-64 35 19 22 61-7 48-54 49l-26-25z':'M145 165q40-22 33-78 34-5 40 21-21 2-17 22 31 4 20 30-3 22-38 40l-29-4z',main);
 detail(s===1?'M185 153q18 0 11 25l-24 20 5-19z':s===2?'M194 109q23 33-13 59l4-30z':'M189 100q17 4 10 14-26 26-6 27 23-9 17 7-5 10-32 31z',light,light,0);
 if(s===3)shape('M159 161q25-38 11-62-6-24 14-46 27 38 5 60l-5 50z','#b3d9e2');
 oval(95,205,18,10,shade);oval(144,205,18,10,shade);
 shape(s===1?'M91 145q-29 22-17 49 36 22 78 2 15-26-12-49z':s===2?'M90 126q-18 30-17 60 11 28 69 16 23-25 0-65z':'M98 115q-24 34-26 67 2 34 55 25 33-21 21-68z',main);
 shape(s===1?'M65 114L64 48l38 31q22-8 40-1l31-37 1 72q-3 40-54 49-47-7-55-48z':s===2?'M64 103L58 29l47 42 34-4 29-45 9 77q-5 41-55 48-48-5-58-44z':'M61 99L48 21l54 43 36-6 34-44 4 80q2 35-54 50-50-4-61-45z',main);
 detail(s===1?'M74 89V65l19 22M151 86l14-24v34':'M72 82l-4-30 26 27M151 77l15-32 2 45',shade,shade,0);
 detail(s===1?'M74 116q24 3 47 24 15-21 43-26-4 32-43 38-33-7-47-36z':'M71 105q24 4 51 25 19-23 46-30-1 35-46 41-36-6-51-36z',light,light,0);
 face(120,s===1?113:100,41);oval(122,s===1?132:120,6,4,a.ink,1);
 if(s>=2){shape(s===2?'M79 140q-19 0-23 12 9 15 28 12l-4 19 21-11 21 8 12-17 27-4-5-19q-38 19-77 0z':'M73 135q-30 0-39 20l26 9-2 27 24-17 24 21 13-28 27 9 6-20 28-8-16-17q-40 24-91 4z',light);oval(117,158,8,9,'#8bbbc8',2);}
 else{shape('M105 153l15 6 16-7-4 32-12-9-12 9z',light,2.4);}
 if(s===3){detail('M81 185q16 6 22 13M92 176l12 11','none','#6da5b6',2);shape('M76 55q5-18 21-18l-3 18-14 9z',light,2.4);}
};
DRAW.breeze_owl=(a,s)=>{
 const {shape,detail,oval,dot,eye,main,light,shade}=a;
 oval(94,208,17,8,'#e9b877');oval(146,208,17,8,'#e9b877');
 if(s===3){shape('M82 113Q48 78 13 96l21 23-19 17 25 7-4 28 33-14 22-28z',main);shape('M158 113q34-35 69-17l-21 23 19 17-25 7 4 28-33-14-22-28z',main);detail('M26 100l48 25M31 132l39-3M47 159l24-24M214 100l-48 25M209 132l-39-3M193 159l-24-24','none',shade,4);}
 shape(s===1?'M65 115q-13 51 13 75 43 32 87 0 24-35 10-75z':s===2?'M72 100q-30 52-9 93 23 25 59 17 37 10 57-21 17-46-19-89z':'M80 92q-30 62-11 108 26 17 51 9 35 10 52-16 14-52-17-101z',main);
 detail(s===1?'M83 138q36-15 74 0v43q-37 28-74 0z':'M86 135q34-16 68 0l7 54q-41 27-79 0z',light,light,0);
 for(const [x,y] of [[108,159],[132,159],[120,177]])detail(`M${x-5} ${y}l5 5 5-5`,'none',shade,3);
 if(s<3){shape(s===1?'M66 126q-22 5-21 45l25-10 9-22z':'M74 112q-34-18-40 18l8 23 10-5 7 31 21-30z',shade);shape(s===1?'M174 126q22 5 21 45l-25-10-9-22z':'M166 112q34-18 40 18l-8 23-10-5-7 31-21-30z',shade);}
 shape(s===1?'M65 109V63l24 12q31-24 62 0l24-12v46q-2 34-55 37-55-3-55-37z':s===2?'M63 91l-7-50 34 22q30-20 59 0l34-22-7 50q5 45-56 47-60-1-57-47z':'M63 86L49 32l41 20q30-21 61 0l37-20-10 54q7 45-57 47-64-1-58-47z',main);
 detail(s===1?'M71 99q0-31 31-23l18 18 18-18q31-8 31 23-1 29-30 31l-19-13-18 13q-31-2-31-31z':'M70 88q-1-33 32-22l18 16 18-16q33-11 32 22-2 31-34 31l-16-12-16 12q-32 0-34-31z',light,light,0);
 eye(97,s===1?104:91,8);eye(143,s===1?104:91,8);
 shape(`M113 ${s===1?115:101}l7-4 8 4-8 13z`,'#e9b877',2);
 if(s>=2){shape('M105 192l11-13 4 9 5-8 13 10 1 17h-36z','#efd59d',2);detail('M112 195h18m-18 6h15','none',a.ink,1.5);}
 if(s===3){shape('M112 52l-4-31 12 7 9-14 5 35z',light,2.5);detail('M120 40l8-9','none',shade,2);a.scarf(120,132,88,'#769eaf');}
};
DRAW.bubble_fin=(a,s)=>{
 const {shape,detail,oval,dot,eye,main,light,shade,gleam}=a;
 shape(s===1?'M151 112q25-27 53-25l-10 28 14 28q-27 4-48-13z':s===2?'M147 103q38-38 74-38l-7 29-25 20 27 10 2 42q-41-9-68-40z':'M145 99q40-44 79-64l-5 41-34 28 30 13 10 57q-51-12-80-50z',shade);
 detail(s===1?'M176 107l17-10m-19 29 21 7':'M176 102l30-20m-29 41 27 26','none',light,3);
 shape(s===1?'M82 87q5-24 26-34l14 31z':s===2?'M74 89q-11-28 24-50l9 30 34 4-15 27z':'M67 88q-6-47 20-66l14 24 20-8 15 46-31 15z',main);
 if(s===3){shape('M77 139q-5 37 9 70l23-20 17 9 6-49z',main);detail('M91 155l7 35M112 158l8 26','none',light,3);}
 else shape('M89 149l16 32 25-25z',main);
 shape(s===1?'M42 121q10-41 56-41 41-2 65 40-20 41-69 41-41 0-52-40z':s===2?'M29 124q8-49 65-48 46-4 78 42-25 42-80 50-51 0-63-44z':'M24 121q8-50 65-47 50-1 82 43-24 45-82 49-54-3-65-45z',main);
 detail(s===1?'M53 135q35 24 85 5-22 22-52 13z':'M37 138q42 21 104 1-23 29-62 20z',light,light,0);
 detail('M47 105q20-19 43-17','none',gleam,4);eye(s===1?76:64,116,8);
 detail(s===1?'M63 137q8 5 15-1':'M45 139q9 5 17-1','none',a.ink,2.6);
 shape(s===1?'M111 119q21-18 31 4-15 4-15 18z':s===2?'M108 123q14-2 27-15l22 37-38 27-11-28z':'M106 120q19-7 36-16l34 43-28 6-3 35-23-19-16-30z',light,2.5);
 detail(s===3?'M122 121l18 36m-10-40 20 27':'M120 124l9 16','none',shade,2.5);
 if(s>=2){dot(89,103,4,light);dot(103,103,3,light);dot(113,108,2.4,light);}
 if(s===3){oval(67,67,11,13,'#bfece4',2.5);detail('M63 62q2-4 6-4','none','#fffdf5',2.5);shape('M151 86l-5-11 8-5 12 4-4 11z','#f0c574',2.4);}
};
DRAW.coral_otter=(a,s)=>{
 const {shape,detail,oval,dot,face,main,light,shade,gleam}=a;
 shape(s===1?'M80 161q-34 17-36 39 23 13 56-11z':s===2?'M148 167q42 17 46 43-36 15-57-13z':'M151 159q49 12 57 42-24 23-63-9z',shade);
 if(s===3){shape('M75 118q-40 29-37 65l24-5 3 25 28-25 53 7 22 16 8-31 22 3q-2-42-42-57z','#558f83');detail('M56 176l24-31M170 166l-16-31','none','#b0d4b1',3);}
 oval(88,204,21,10,shade);oval(149,204,21,10,shade);
 shape(s===1?'M81 125q-27 22-14 59 19 32 56 24 41-3 47-30 5-33-31-52z':s===2?'M87 111q-23 23-18 70 5 31 50 27 47 0 49-30 1-45-28-67z':'M92 101q-28 37-26 79 3 34 54 27 43 4 45-27-3-50-27-78z',main);
 detail('M99 138q21-17 42 0l7 48q-28 24-56-1z',light,light,0);
 oval(75,s===1?85:66,18,18,main);oval(163,s===1?85:66,18,18,main);dot(75,s===1?85:66,8,shade);dot(163,s===1?85:66,8,shade);
 shape(s===1?'M62 112q-2-44 55-44 55-1 57 43-2 42-55 42-55-1-57-41z':'M65 93q0-43 54-43 54 0 56 44-1 42-56 45-52-3-54-46z',main);
 detail(`M89 ${s===1?115:96}q12-13 30 0 18-13 31 0 6 31-31 32-35-2-30-32z`,light,light,0);
 face(119,s===1?107:91,44);oval(119,s===1?121:105,8,5,a.ink,1);
 detail(`M81 ${s===1?127:112}l-12-2m14 9-13 3M156 ${s===1?127:112}l12-2m-14 9 13 3`,'none',a.ink,2);
 if(s>=2)a.scarf(120,135,70,'#4aafa2');
 if(s===3){shape('M79 63l3-17 26 5 22-8 29 8-5 16-34-8z','#79bdb0',2.4);dot(119,52,6,'#fff2db');}
 shape(s===3?'M92 180q-22-36-1-41 13-9 19 6 8-20 23-14 10 2 11 17 18-10 24 8 5 23-47 39z':'M94 184q-20-26-4-35 11-9 20 3 8-17 22-12 10 4 9 16 18-3 18 12-9 21-41 28z','#f3b9a7',2.7);
 detail(s===3?'M96 149l22 36m-5-36 8 34m18-43-16 43m29-24-27 26':'M99 158l19 26m-4-26 6 25m14-30-12 30m19-13-17 15','none','#b76c70',2);
 shape('M77 148q-15 1-15 15 3 14 22 17l14-10z',main);shape('M159 149q17 3 16 17-5 13-18 11l-9-11z',main);
};
DRAW.sprout_rex=(a,s)=>{
 const {shape,detail,oval,dot,eye,leaf,main,light,shade,gleam}=a;
 shape(s===1?'M148 165q36 11 57-13-1 36-47 44z':s===2?'M147 159q45 2 66-31 16 43-55 72z':'M148 154q44-4 71-42 15 25-3 47-17 28-57 40z',shade);
 if(s>=2){for(const [x,y] of [[165,159],[185,149],[204,134]])leaf(x,y,s===3?14:9,-1);}
 oval(s===3?85:91,207,21,11,shade);oval(s===3?151:148,208,23,11,shade);
 shape(s===1?'M84 126q-20 34-10 65 19 24 55 20 44-4 42-34-7-30-33-51z':s===2?'M93 109q-29 35-18 83 33 32 80 10 31-14 12-50l-25-44z':'M102 106q-37 26-37 65-2 42 41 40l49-4q31-11 13-58l-29-45z',main);
 detail('M112 139q24-8 34 20l9 33q-25 20-45 4z',light,light,0);detail('M115 167h27m-24 16h27','none',shade,2.5);
 shape(s===1?'M69 95q11-40 54-34 28-1 31 22l27 6q27 22 7 46-31 23-69 8-52 5-50-48z':s===2?'M67 81q8-35 46-34 37-3 43 23l33 5q25 18 11 48-26 28-77 19-60-1-56-61z':'M59 81q6-42 47-40 35-7 52 18l33 4q34 14 21 44-12 38-75 35-74 4-78-61z',main);
 detail(s===1?'M79 86q13-17 31-16':'M75 74q10-21 32-21','none',gleam,5);
 shape(s===1?'M137 124q24 7 49-2l-4 14-39 5z':'M140 119q38 6 60-12l-7 23-46 8z',light,2.5);
 eye(s===1?110:106,s===1?92:86,8);dot(s===1?174:186,s===1?101:92,3,a.ink);
 detail('M148 127l5 7 4-8m15 0 5 5 4-9','none',a.ink,1.7);
 leaf(s===1?102:97,s===1?61:42,s===3?19:13,-1);if(s>=2){leaf(116,46,s===3?23:15);leaf(85,52,12,-1);}
 shape('M94 149q18-9 28 3l-1 14-10-3-8 7-15-6z',main);detail('M104 158l7 5m2-8 6 6','none',a.ink,2);
 if(s===3){shape('M73 164l14-12 11 18-7 21-24-1z','#689977');detail('M79 167l5 17','none','#d6e5b7',3);leaf(203,124,11);}
};
DRAW.stone_trike=(a,s)=>{
 const {shape,detail,oval,dot,face,main,light,shade}=a;
 shape('M161 169l39-13 15 27-40 8z',shade);
 oval(68,205,s===3?22:17,11,shade);oval(167,205,s===3?22:17,11,shade);
 shape(s===1?'M65 153q-15 28 10 47 45 21 95-3 21-21-6-46z':'M58 139q-23 39 7 64 54 24 117-3 17-28-8-62z',main);
 shape(s===1?'M67 109l-9-27 17-5 7-22 28 13 27-7 25 11 23 21-9 27-18 17-81-3z':s===2?'M53 101L42 69l23-9 4-25 29 11 23-17 22 18 29-13 3 29 23 8-10 35-17 42H69z':'M47 111L25 80l25-18-2-30 34 7 18-24 25 19 25-18 21 28 31-7-2 31 24 17-26 37-31 41H73z',shade);
 detail(s===3?'M53 84l17-21 15 5 17-25 21 11 23-9 13 24 23-3 8 23-17 34H74z':'M68 86l22-23 27 8 25-7 30 23-13 32H84z',main,main,0);
 if(s>=2){for(const [x,y] of [[70,78],[120,54],[173,84]])detail(`M${x-5} ${y}l5-6 6 6-5 6z`,'none',light,2.5);}
 shape(s===1?'M69 116q5-29 50-28 46-1 52 28l-9 51q-43 27-84 0z':s===2?'M65 113q8-32 55-29 47-2 54 29l-4 57q-49 32-98-1z':'M61 109q5-35 59-29 51-5 58 30l-4 63q-53 32-106-1z',main);
 shape(s===1?'M88 111l-7-29 18 24M142 107l20-28-7 34':s===2?'M86 105L76 62q20 9 23 35M145 98q7-28 23-41l-11 48':'M82 104Q55 58 70 41q6 29 27 50M146 92q32-34 20-55 33 19-5 71',light,2.6);
 face(120,s===1?131:126,s===3?50:43);
 shape(s===1?'M113 145l7-20 9 23z':s===2?'M112 146l8-29 13 30z':'M108 145l13-36 13 35z',light,2.5);
 detail(`M90 ${s===1?159:162}q30 20 59-1`, 'none',shade,3);
 if(s===3){shape('M88 180l32 10 36-10-5 20-32 9-30-10z','#507f73',2.5);a.star(121,197,7,'#e5c879');}
};
DRAW.rune_cat=(a,s)=>{
 const {shape,detail,oval,dot,face,main,light,shade}=a;
 shape(s===1?'M151 178q43 15 50-17 0-21-17-17-16 2-7 16':'M153 181q42 19 53-22 4-42-25-42-21 1-19 22 4 13 19 7',main,10);
 if(s===3){shape('M91 111q-37 31-46 88l32-9 23 19 21-24 38 20 23-16 21 5q-10-58-46-78z','#7d78a7');detail('M61 186l26-35M184 187l-28-44','none','#d6cdea',3);}
 oval(95,208,16,9,shade);oval(144,208,17,9,shade);
 shape(s===1?'M91 141q-21 23-11 53 20 21 60 10 24-17 6-59z':s===2?'M87 127q-24 33-17 67 19 28 77 11 27-24 2-77z':'M86 117q-24 42-14 82 18 23 73 8 28-28 4-88z',main);
 if(s>=2){shape('M83 154l34 13 34-15 13 44-47 15-45-14z','#655b90');detail('M117 171v30M82 194l32 8 39-10','none','#e7d3a6',3);}
 shape(s===1?'M69 114L69 56l32 20 34-4 32-24 6 62q3 36-53 45-53-5-51-41z':s===2?'M64 100l-1-61 37 28 35-4 36-32 7 64q5 42-58 47-59-2-56-42z':'M62 100l-5-65 43 29 36-5 40-38 3 73q5 43-57 50-61-3-60-44z',main);
 detail(s===1?'M79 84l-1-14 14 17M148 82l13-19 4 25':'M77 82l-4-24 19 21M150 77l17-26 1 37',shade,shade,0);
 face(120,s===1?112:102,42);shape(`M116 ${s===1?126:117}l8 0-4 5z`,'#996d86',1.8);
 detail(`M86 ${s===1?124:116}l-17-4m19 13-17 1M154 ${s===1?124:116}l17-4m-19 13 17 1`,'none',a.ink,2);
 if(s>=2){shape('M104 69l7-15 9 8 11-13 8 17-18 12z','#efe2a9',2.2);}
 shape('M80 149q-20 3-18 16 4 11 24 4l10-9z',main);
 detail(s===3?'M160 183l34-60':'M153 182l31-39','none','#9a7755',6);
 if(s===3){shape('M176 112l8-25 13 13 18-4-5 20-18 8z','#c4e4d4',2.8);detail('M194 96l-1 19','none',light,3);}
 else a.star(185,141,12,'#eec578');
 shape('M153 151q21-4 20 10-7 13-20 7l-7-9z',main);
};
DRAW.page_golem=(a,s)=>{
 const {shape,detail,oval,dot,eye,main,light,shade,ink}=a;
 if(s===1){shape('M83 185l-14 19 8 11 28-8 4-20M137 188l4 19 27 8 8-12-15-19',shade);shape('M72 80l11-18 78 9 14 14-4 103-84 8-15-12z',main);shape('M88 81l77 3-5 108-75 3z',light,3);shape('M70 76l18 5-3 114-17-10z','#a57954',3);detail('M97 93l53 3M97 101l36 2M95 174l50 2M94 181l57 1','none',shade,2.4);eye(108,132,6);eye(144,130,6);detail('M119 151q10 6 18-2','none',ink,2.4);shape('M129 65l18 1-2 40-8-6-9 4z','#71aaa1',2);shape('M70 134l-15 4-7 22 20 3M171 132l14 2 5 22-19 7',main);}
 else {
  if(s===3){shape('M58 117L22 59l32 10 4-27 29 24 10-24 23 29 18-32 16 26 28-24 5 29 31-11-28 66z',light);detail('M40 73l33 50M69 66l23 51M152 72l-10 44M181 67l-25 54M206 76l-32 50','none',shade,2.5);}
  shape('M85 183l-13 26 18 9 21-9 0-27M136 183l-1 26 20 9 19-9-14-26',shade);
  shape(s===2?'M66 102l-23 13-3 54 23 5 17-48M175 102l22 13 5 54-22 5-16-49':'M66 107l-33 11-8 43 16 12 26-11 14-36M173 107l34 11 8 43-16 12-26-11-14-36',main);
  detail('M44 144l17 3m-18 8 17 3M180 146l16-3m-16 14 16-3','none',light,3);
  shape(s===2?'M71 89q25-8 49 7 25-14 49-7l6 97q-32-4-55 10-25-13-56-10z':'M63 91q28-13 57 4 27-15 57-4l3 100q-36-1-59 14-31-12-59-11z',main);
  shape(s===2?'M78 97q20-4 41 9l-1 77q-17-9-44-6z':'M70 102q24-6 50 10v79q-26-11-51-7z',light,2.5);
  shape(s===2?'M122 106q21-13 40-9l5 80q-25-1-45 9z':'M122 111q24-15 48-9l1 83q-27-1-48 10z','#f5dfa9',2.5);
  eye(94,135,6);eye(147,135,6);detail('M109 159q12 11 23 0','none',ink,2.5);
  detail('M81 115l19 4M139 117l20-4M81 167l18 2M143 171l17-3','none',shade,2);
  shape(s===2?'M100 91l-3-22 47 1-4 21z':'M82 89l-4-21 24-8 44 5 22 10-4 17z','#769e93');
  if(s===3){shape('M91 62l-4-23 62 4 4 23z',main);detail('M95 48l45 2M96 55l45 2','none',ink,2);shape('M130 41V26l16 2-2 33-7-6-9 5z','#c67867',2);oval(39,168,12,10,main);a.star(38,165,6,'#f0cb74');}
 }
};
DRAW.drill_mole=(a,s)=>{
 const {shape,detail,oval,eye,main,shade,light,ink}=a;
 shape(s===1?'M83 149q-22 11-32 41l22 7 24-31M150 149q26 10 39 39l-20 8-26-28':'M77 143q-35 13-46 44l26 11 35-25M163 143q33 10 50 44l-28 11-35-25',main);
 shape(s===1?'M93 157q-16 31-1 49l30 2 26-7 1-43z':'M82 136q-21 44-9 64 38 23 91 0 12-38-6-66z',shade);
 shape(s===1?'M92 182l-15 22 17 9 23-13M135 184l1 20 27 9 12-13':'M79 182l-17 22 21 13 32-15M137 184l5 21 28 12 12-17',main);
 shape(s===1?'M83 101q-3-30 33-34 35-4 47 34l5 50q-45 35-88 0z':s===2?'M72 91q7-36 50-39 42 7 48 41l8 64q-54 29-107-1z':'M64 88q17-36 59-38 43 6 53 38l8 65q-61 33-123-3z',main);
 shape(s===1?'M82 117q37-25 82 0l-10 40-59 2z':'M68 106q52-31 105 0l-10 47q-46 19-83-2z',light,2);
 eye(s===1?103:95,119,5);eye(s===1?141:147,117,5);shape('M105 130q14-13 28 0-8 18-28 0z','#9b7071',2);detail('M112 149q9 7 19-1','none',ink,2);
 shape(s===1?'M79 99q-3-39 39-43 45 2 50 43z':s===2?'M64 90q7-52 59-54 50 9 54 54z':'M55 88l9-36 41-20 49 13 27 43z','#d69b48');
 detail(s===1?'M119 63v30':'M121 43v35','none',light,9);oval(121,s===1?91:80,12,12,'#e6efe0',3);detail(`M117 ${s===1?87:76}h6`,'none','#ffffff',3);
 if(s>=2){shape('M79 159l37 9 42-9 4 32-43 15-44-16z','#798f85');detail('M112 171v25M129 171v25','none','#e2ddba',3);}
 shape(s===3?'M166 157l15-8 15 5 32 33-41 4-20-16z':'M155 170l18-9 31 25-36 7z','#b6c8c6');detail(s===3?'M182 158l-7 18M193 168l-8 15M205 179l-7 10':'M173 172l-7 13M183 180l-5 10','none',ink,3);
 if(s===3){shape('M37 149l21-11 18 21-17 18-28-6z','#8ba6a2');a.star(95,180,8,'#edcf78');}
};
DRAW.orbit_bunny=(a,s)=>{
 const {shape,detail,oval,face,main,light,shade}=a;
 shape(s===1?'M75 107Q52 46 70 26q19-3 31 58M133 85Q146 26 168 33q12 24-13 76':s===2?'M75 96Q43 30 67 20q25 8 38 59M139 73Q161 10 180 24q10 28-24 74':'M67 104Q27 34 52 22q31 6 53 63M141 74Q178 5 197 25q5 35-42 90',main);
 detail(s===1?'M76 40q-6 23 13 46M164 46l-17 43':s===2?'M67 33q11 9 25 43M174 36l-24 47':'M56 35q15 10 35 45M189 39l-35 52','none','#d49bbb',8);
 if(s===3){shape('M74 136q-45 11-48 43l34-9 8 32 33-28M158 136q46 12 54 42l-34-7-7 31-33-29','#e5dab6');}
 shape(s===1?'M86 139q-24 34-8 60 38 25 77-1 12-29-16-59z':'M82 130q-22 49-6 71 39 21 82 0 17-34-15-68z',main);
 oval(93,200,24,13,shade);oval(148,200,24,13,shade);
 shape(s===1?'M73 88q35-24 73-1 28 12 28 41-6 40-57 37-47-3-51-33-3-22 7-44z':'M71 82q41-27 80-1 27 12 28 42-5 39-60 35-49-2-52-32-4-20 4-44z',main);
 shape('M87 119q10-19 29-5 17-13 33 2l4 26q-36 29-67-1z',light,0);face(120,120,43);detail('M115 139l5 4 5-4','none',a.ink,2.5);
 shape('M75 152q-22 1-23 20 12 12 30 4l10-15M163 149q21 7 18 24-11 9-26-2l-9-15',main);
 if(s===1){oval(116,184,22,16,'#e7c678');detail('M87 185q33 13 62-2','none','#66868b',4);}
 else {shape('M84 153l35 12 34-12 7 34-39 20-40-21z','#728db2');a.star(121,180,10,'#f4d989');shape('M158 167l18-13 7 20-20 16z',light,2);}
 if(s===3){shape('M85 77l14-19 21 8 23-16 16 23-39 20z','#efe1aa',2);a.star(121,79,7,'#839dbb');}
};
DRAW.comet_hound=(a,s)=>{
 const {shape,detail,oval,eye,main,light,shade}=a;
 shape(s===1?'M157 162q33-10 40-48l13 15-4 33q-13 29-49 24z':s===2?'M164 148q42-5 45-59l17 24-4 42q-15 33-51 28z':'M167 137q45-9 35-62l15 10 10 40-12 36-41 21z',main);
 detail(s===1?'M197 126q1 29-26 45':'M210 108q10 34-26 53','none','#edcf8d',10);
 shape(s===1?'M82 149q38-20 71 2l18 38-26 14-18-15-20 17-36-15z':'M73 131q49-27 88-1l16 47-23 23-31-18-39 19-25-24z',main);
 shape(s===1?'M81 182l-5 22 25 6 10-21M138 185l7 24 26-8-15-21':'M68 171l-8 35 27 5 15-30M148 170l7 36 29-1-11-34',shade);
 if(s===3){shape('M73 127l-19 27 16 13-10 18 34-5 26 14 25-15 29 2-11-18 14-11-23-25z','#e7e1c9');}
 shape(s===1?'M68 84L56 46l42 20q37-14 60 14l28-22-6 61q-5 38-58 42-51-3-54-39z':s===2?'M58 75L48 32l48 25q37-13 63 17l34-33-11 78q-10 31-63 27-60-8-61-41z':'M57 72L38 23l57 27q35-13 65 23l40-35-17 81q-16 36-66 27-58-14-60-46z',main);
 detail('M72 80L65 63l23 11M169 84l14-17-5 28',shade,shade,0);
 shape(s===1?'M92 118l29-16 37 16-9 25-27 9-28-13z':'M86 113l34-18 42 19-15 27-29 2-27-12z',light,2);
 eye(94,103,5);eye(147,101,5);shape('M114 116l15-1-5 12-7-1z',a.ink,2);detail('M107 134l13-3 14 4','none',a.ink,2);
 if(s>=2){shape('M98 66l17-27 16 24-9 26z','#edd59c',2);a.star(119,157,10,'#f0cd84');}
 if(s===3){shape('M76 175l15-13 14 18-18 15z','#738eb7');shape('M151 175l17-15 13 22-17 15z','#738eb7');}
};
DRAW.frost_seal=(a,s)=>{
 const {shape,detail,oval,face,main,light,shade}=a;
 shape(s===1?'M82 130q-40 15-43 56l37-8 12 24q39 25 76-3l35-6-18-23 15-19-45-6z':s===2?'M71 128q-40 26-43 66l49-9q41 34 87 8l49 9-14-28 15-20-61-11z':'M67 121q-47 28-45 76l53-13q43 32 94 7l52 12-12-29 11-22-57-14z',main);
 detail('M75 167q30 30 81 15','none',light,18);
 shape(s===1?'M80 84q30-31 63-11 36 17 26 49-6 37-51 36-44-1-46-32-2-20 8-42z':'M71 73q37-35 76-13 37 17 26 54-9 39-55 40-46-4-48-36-3-21 1-45z',main);
 shape('M87 111q13-16 31-1 24-14 40 7l-7 22q-28 22-57-1z',light,1.5);face(121,s===1?111:102,43);shape('M114 120q9-6 16 0l-8 8z','#849da2',2);
 detail('M92 129l-22-3m24 11-23 4M151 129l22-3m-24 11 23 4','none',a.ink,2);
 if(s>=2){shape('M79 151l36 9 45-11 0 18-44 8-40-9z','#70aaa9',2);shape('M90 163l-16 33 27-9 8-21z','#91c2ba',2);}
 if(s===3){shape('M80 72l11-32 18 19 16-39 15 37 21-19 9 38z','#c1e0df');detail('M105 69l17-31 17 31','none','#f5ffef',4);shape('M99 135l2 24 9-22M140 136l6 21 3-26',light,2);}
 shape('M79 167q-24-3-31 23l17 9 27-20z',shade);detail('M60 188l7-8','none',light,3);
};
DRAW.glacier_yak=(a,s)=>{
 const {shape,detail,oval,face,main,light,shade}=a;
 shape(s===1?'M74 148l-10 53 26 9 12-51M143 158l6 50 25-8-10-50':'M61 143l-8 62 29 8 20-58M146 155l11 55 30-9-12-62',shade);
 shape(s===1?'M62 104q18-45 64-35 43 0 54 44l6 63-24-7-7 23-23-12-18 14-23-14-27 9-5-22-22 0z':s===2?'M44 100q26-50 76-39 54-3 70 44l13 72-29-8-9 25-28-11-19 17-22-17-27 13-9-27-24 9z':'M39 98q15-60 78-50 68-6 84 55l9 76-29-7-9 28-31-9-24 17-22-17-29 12-10-27-27 9z',main);
 shape(s===1?'M80 87q-37-3-26-40l21 14 17 0M150 86q37-3 26-40l-21 14-17 0':'M74 77Q26 72 34 23l28 29 30 1M159 77q49-5 41-54l-29 29-30 1','#bdd2cf');
 detail(s===1?'M59 54l13 15M171 56l-12 15':'M41 37l19 22M192 37l-19 22','none',light,4);
 shape('M77 86l18-12 15 13 16-16 15 15 18-11 8 29-10 15 4 30-20 26-40-4-22-21 3-29-15-15z',light);
 face(122,115,45);oval(122,145,27,16,shade,2);detail('M109 144l3 3m18-3 3 3','none',a.ink,3);
 if(s>=2){shape('M67 152l17 25 35 9 45-25 8 19-49 23-48-13-20-29z','#6ca3aa',2);a.star(122,190,9,'#efd19b');}
 if(s===3){shape('M86 87l4-33 18 18 16-42 17 40 19-16-1 35z','#a6dcd9',2.5);detail('M104 82l18-35 14 33','none',light,3);}
};
DRAW.ruin_gecko=(a,s)=>{
 const {shape,detail,oval,eye,main,light,shade}=a;
 shape(s===1?'M154 174q60 20 49-21-5-21-22-12-10 7-1 14 5 2 8-3-13-15-24 7-1 17-10 15z':s===2?'M153 174q73 27 70-28-3-40-36-23-23 19-8 35 20 13 29-9-21-12-26 9-3 11-29 2z':'M151 173q78 37 80-26-5-48-42-32-29 17-16 43 21 22 38-7 3-15-10-19-18 0-14 15 12 14 12-3 9 27-25 16z',main);
 shape(s===1?'M83 134q-4 37 28 57l39-5q23-22-2-57z':'M75 119q-13 56 28 80l51-13q27-31-6-65z',main);
 shape('M91 155l-37 4-13 28 11 12 12-14 26-3M145 161l29 22 1 20-14 6-6-21-24-8',shade);
 shape(s===1?'M67 98q7-37 48-36 44-1 54 36l-1 24q-6 32-53 30-50-1-48-32z':'M53 85q11-42 66-39 47 5 59 42l-2 28q-12 39-57 34-55-3-65-38z',main);
 oval(s===1?88:80,s===1?98:89,20,24,light,2);oval(s===1?148:153,s===1?98:89,20,24,light,2);eye(s===1?88:80,s===1?99:89,7);eye(s===1?148:153,s===1?99:89,7);detail('M99 126q20 13 41-1','none',a.ink,3);
 if(s>=2){shape('M58 89l16-34 13-4 7 38z','#7d9955',2);shape('M145 52l22 10 12 33-30-9z','#7d9955',2);shape('M90 160l24-15 32 9 2 28-33 11-29-13z','#c5c17d');detail('M105 164l11-7 14 6-1 13-14 6-13-9z','none',a.ink,2.5);}
 if(s===3){a.leaf(83,63,35,-1);a.leaf(103,45,31,1);shape('M75 142l-36 3 7-31 12 11 26 5M149 139l33-12 12 14-8 16-34 3',main);}
 else shape('M84 139l-31-1-8 15 12 13 34-12M150 139l22-5 11 15-7 12-28-6',main);
 detail('M108 75l13-7 10 9M103 91l9-2','none',shade,3);
};
DRAW.whisper_ghost=(a,s)=>{
 const {shape,detail,eye,main,light,shade}=a;
 if(s===3){shape('M62 151L26 178l6-44 13-27-9-33 25 11 7-35 20 19M170 151l44 23-8-43-14-22 10-35-30 13-8-32-23 18',shade);}
 shape(s===1?'M82 86q10-38 41-35 41-1 44 52l11 65 18 21-23 2-18-15-15 26-24-12-26 16-6-26-28 13 16-45z':s===2?'M66 83q10-47 55-47 45 4 51 53l4 73 24 39-36-11-15 21-28-13-26 13-17-24-31 14 16-41z':'M68 80q8-49 54-48 46 6 54 54l8 76 27 42-42-12-17 23-32-14-33 12-14-24-38 15 24-44z',main);
 detail('M82 92q15-37 43-30','none',light,10);eye(s===1?104:98,111,6);eye(s===1?144:147,111,6);detail('M113 137q9 7 16-1','none',a.ink,2.5);
 shape(s===1?'M95 162l25 6 24-7 1 27-25 8-25-9z':'M86 155q16-7 35 5 17-10 36-3l-1 35-34 8-35-8z',light,2.5);detail('M121 163v29M96 172l14 2M135 172l14-2','none',shade,2.5);
 shape('M86 153q-24-9-28 9 7 20 31 12M155 153q24-9 28 9-7 20-31 12',main);
 if(s>=2){shape('M74 89l9-25 37-15 38 12 9 26-42-9z','#809993');detail('M124 51l-2 26','none',light,3);}
 if(s===3){shape('M99 47l-8-21 65 2-9 21z','#c9b888',2);detail('M104 33l35 1M103 40l32 1','none',light,2);a.star(120,81,8,'#e7cd91');}
};
DRAW.crown_deer=(a,s)=>{
 const {shape,detail,oval,eye,main,light,shade}=a;
 shape(s===1?'M86 144l-2 58 14 8 15-46M137 162l7 45 17-2-5-58':'M75 143l-9 64 19 7 21-59M147 154l12 57 20-4-16-68',shade);
 shape(s===1?'M79 120q-3 61 39 65 43-8 45-67z':s===2?'M78 107q-16 65 35 84 46-4 52-81z':'M79 98q-12 38-8 67 16 33 51 31 39-9 46-39l-11-51z',main);
 shape(s===1?'M95 66L80 37l5-20 12 28 13 12M145 65l17-27-4-20-12 27-10 14':s===2?'M94 68L64 29l-1-17 12 20 18-7-7 21 17 9M145 67l34-36 0-19-11 22-18-8 7 23-17 10':'M96 75L60 45l-12-29 19 16 18-18-5 32 18-4 11 17M143 72l35-29 12-29-20 16-18-16 5 31-19-3-11 19','#c3b889',3);
 if(s===3){a.star(54,22,8,'#e9cc82');a.star(185,22,8,'#e9cc82');a.star(120,37,10,'#e9cc82');}
 shape('M83 90Q57 65 47 84q-1 25 38 24M152 86q24-25 39-5 1 23-37 24',main);detail('M72 91l-14-3M165 88l13-3','none',shade,6);
 shape(s===1?'M84 78q33-18 67 1l6 42-18 34-21 9-20-12-17-31z':'M82 73q37-20 73 0l3 39-15 37-26 17-22-18-15-35z',main);
 shape('M107 120l14-20 12 20 12 19-24 20-21-19z',light,0);eye(98,106,5);eye(143,104,5);shape('M115 137l13-1-7 9z','#8d7974',2);detail('M116 148h11','none',a.ink,2);
 detail('M110 87l11-10 11 10','none',light,4);
 if(s>=2){shape('M89 150l29 15 36-22 12 30-47 23-41-22z','#799c96',3);a.star(120,176,s===3?12:8,'#f0d68a');}
 if(s===3){shape('M76 151l-32 36 24-4 8 20 27-27M157 147l36 32-25-1-3 25-28-27','#e4d5a6',3);detail('M83 160l-16 21M155 160l12 21','none',light,3);}
};

/** One deterministic drawing source for runtime, static files, and locked outlines. */
export function renderCharacterArt(character,options={}) {
 const c=character||{};const stage=Math.max(1,Math.min(3,Number(c.evolutionStage)||1));
 const a=studio(c.palette,Boolean(options.locked),options.mood||'idle');
 const draw=DRAW[c.speciesId]||DRAW.crumb_bear;draw(a,stage);
 return wrap(a,c.name||'단어 친구',c.id||'unknown',options,'s2-monster-svg hw-character');
}
function wrap(a,name,id,options={},classes='hw-character'){
 name=options.locked?'아직 만나지 못한 친구의 실루엣':name;
 const shadow=options.locked||options.shadow===false?'':`<ellipse cx="120" cy="216" rx="61" ry="8" fill="#385849" opacity=".10"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" class="${classes}" data-art-version="${CHARACTER_ART_VERSION}" data-character-id="${esc(id)}" role="img" aria-label="${esc(options.ariaLabel||name)}"><title>${esc(options.ariaLabel||name)}</title>${shadow}<g class="hw-character-body" transform="translate(6 7) scale(.95)" stroke-linejoin="round" stroke-linecap="round">${a.parts.join('')}</g></svg>`;
}
export const DRAWN_SPECIES=Object.freeze(Object.keys(DRAW));
