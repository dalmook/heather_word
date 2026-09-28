/** Pure learning/content utilities. No network, user storage or legacy writes. */
export const VERSION = '1.0.0';
export const DAY = 86400000;
export const INTERVALS = Object.freeze([0, 1, 3, 7, 14, 30]);
export const MODES = Object.freeze([
  { id: 'picture', icon: 'image', title: '그림 탐정', text: '그림과 뜻을 보고 단어 찾기', min: 2 },
  { id: 'meaning', icon: 'book', title: '뜻 찾기', text: '영어 단어의 뜻을 톡!', min: 2 },
  { id: 'listen', icon: 'sound', title: '소리 탐험', text: '발음을 듣고 단어 찾기', min: 2 },
  { id: 'pairs', icon: 'cards', title: '짝꿍 카드', text: '단어와 뜻을 짝지어요', min: 2 },
  { id: 'tiles', icon: 'blocks', title: '철자 공방', text: '글자 블록으로 단어 만들기', min: 1 },
  { id: 'type', icon: 'pencil', title: '스펠링 마법', text: '직접 쓰며 기억을 꺼내요', min: 1 },
  { id: 'ox', icon: 'check', title: '맞아, 아니야!', text: '단어와 뜻이 맞는지 고르기', min: 2 },
  { id: 'trail', icon: 'flag', title: '토리의 보물길', text: '여러 문제로 열 걸음 모험', min: 2 }
]);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const textKey = value => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
export function dayKey(time = Date.now()) {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function hashID(value) {
  let h = 2166136261;
  for (const c of String(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}
export function safeAsset(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  if (/^https:\/\//i.test(s)) {
    try { const u = new URL(s); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
  }
  if (!/^content\/(images|audio)\/[a-zA-Z0-9_./-]+$/.test(s) || s.split('/').some(p => p === '..' || p === '.')) return '';
  return s;
}
const field = (v, max) => String(v ?? '').trim().slice(0, max);
export function normalizeWord(row, {strict = true} = {}) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw Error('단어 형식이 올바르지 않아요.');
  const id = field(row.id, 96), word = field(row.word, 60), meaning = field(row.meaning, 120);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,95}$/.test(id)) throw Error('단어 ID는 영문·숫자·밑줄·하이픈으로 작성해 주세요.');
  if (!word || !meaning) throw Error('영어 단어와 한글 뜻을 모두 입력해 주세요.');
  if (strict && (String(row.word).length > 60 || String(row.meaning).length > 120 || String(row.id).length > 96)) throw Error('단어, 뜻 또는 ID가 너무 길어요.');
  for (const k of ['image','audio']) if (strict && row[k] && !safeAsset(row[k])) throw Error(`${word}: ${k} 경로는 content/images, content/audio 또는 HTTPS 주소여야 해요.`);
  return {id, word, meaning, category:field(row.category || '내 단어',40), emoji:field(row.emoji || '✨',12), image:safeAsset(row.image), audio:safeAsset(row.audio), example:field(row.example,240), exampleMeaning:field(row.exampleMeaning,240)};
}
export function validatePack(pack) {
  if (!pack || pack.schemaVersion !== 1 || !/^[a-z0-9][a-z0-9_-]{0,47}$/.test(pack.id || '') || !String(pack.title || '').trim() || !Array.isArray(pack.words) || pack.words.length > 5000) throw Error('단어팩의 schemaVersion, id, title, words를 확인해 주세요. (최대 5,000개)');
  const seen = new Set();
  const words = pack.words.map(row => {const w=normalizeWord(row); if(seen.has(w.id)) throw Error(`중복 단어 ID: ${w.id}`); seen.add(w.id); return w;});
  return {schemaVersion:1, id:pack.id, title:field(pack.title,60), description:field(pack.description,180), sample:pack.sample === true, words};
}
export function validateManifest(value) {
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.packs) || value.packs.length > 100) throw Error('content/index.json 형식을 확인해 주세요.');
  const seen = new Set();
  const packs = value.packs.map(p => {
    if (!p || !/^[a-z0-9][a-z0-9_-]{0,47}$/.test(p.id || '') || !/^packs\/[a-zA-Z0-9_-]+\.json$/.test(p.file || '') || seen.has(p.id)) throw Error('단어팩 ID 또는 파일 경로가 잘못되었거나 중복됐어요.');
    seen.add(p.id); return {id:p.id, file:p.file};
  });
  return {schemaVersion:1, packs};
}
export function legacyWords(snapshot = {}) {
  const categories = new Map((Array.isArray(snapshot.categories) ? snapshot.categories : []).map(c => [c.id,c.name]));
  const rows = Array.isArray(snapshot.words) ? snapshot.words : Object.values(snapshot.words || {});
  return rows.flatMap(row => {
    try {return [{...normalizeWord({...row,id:`legacy-${hashID(row.id || `${row.word}|${row.categoryId}`)}`,category:categories.get(row.categoryId) || row.category || '기존 단어장'}, {strict:false}), _packId:'legacy', _source:'기존 단어장'}];} catch {return [];}
  });
}
export function mergeWords(base, edits) {
  const map = new Map(base.map(w => [w.id, w]));
  for (const w of edits) {if (w.hidden) map.delete(w.id); else map.set(w.id, {...map.get(w.id), ...w});}
  return [...map.values()];
}
export function shuffle(items, rng = Math.random) {
  const a = [...items];
  for(let i=a.length-1;i>0;i--) {const j=Math.min(i,Math.max(0,Math.floor(rng()*(i+1)))); [a[i],a[j]]=[a[j],a[i]];}
  return a;
}
export const signature = w => `${textKey(w.word)}\u001f${textKey(w.meaning)}`;
export function progressFor(word, value) {
  if (!value || value.signature !== signature(word)) return {id:word.id,signature:signature(word),box:0,attempts:0,correct:0,due:0,wrong:0,lastAt:0,lastGraduatedDay:''};
  return {...value, box:Math.min(5,Math.max(0,Number(value.box)||0)), due:Number(value.due)||0};
}
export function grade(word, prior, correct, {hinted=false, now=Date.now()}={}) {
  const p=progressFor(word,prior), today=dayKey(now);
  const good=Boolean(correct && !hinted);
  const box=good ? (p.lastGraduatedDay===today ? Math.max(1,p.box) : Math.min(5,p.box+1)) : 0;
  return {...p, box, attempts:(p.attempts||0)+1, correct:(p.correct||0)+(good?1:0), wrong:(p.wrong||0)+(good?0:1), due:good ? (p.lastGraduatedDay===today && p.due>now ? p.due : now+INTERVALS[box]*DAY) : now+10*60000, lastAt:now, lastGraduatedDay:good?today:p.lastGraduatedDay};
}
export function chooseWords(words, progress, {count=5, reviewOnly=false, now=Date.now()}={}) {
  const rows = words.map(w=>({w,p:progressFor(w,progress.get(w.id))}));
  const due=rows.filter(x=>x.p.attempts>0 && x.p.due<=now).sort((a,b)=>a.p.due-b.p.due || b.p.wrong-a.p.wrong);
  if(reviewOnly) return due.slice(0,count).map(x=>x.w);
  const fresh=shuffle(rows.filter(x=>!x.p.attempts));
  const later=rows.filter(x=>x.p.attempts>0 && x.p.due>now).sort((a,b)=>a.p.due-b.p.due);
  return [...due,...fresh,...later].slice(0,count).map(x=>x.w);
}
export function choicesFor(word, words, key='word', count=4, rng=Math.random) {
  const seen=new Set([textKey(word[key])]);
  const other=shuffle(words,rng).filter(w=>{const v=textKey(w[key]);if(!v||seen.has(v))return false;seen.add(v);return true;});
  return shuffle([word,...other.slice(0,Math.max(1,count)-1)],rng);
}
export function uniquePairs(words, limit=4, rng=Math.random) {
  const en=new Set(), ko=new Set();
  return shuffle(words,rng).filter(w=>{const a=textKey(w.word),b=textKey(w.meaning);if(en.has(a)||ko.has(b))return false;en.add(a);ko.add(b);return true;}).slice(0,limit);
}
export function makeJourney(words, pool, level=1) {
  const result=[];
  for(const w of words) result.push({word:w,mode:'card'});
  for(const w of shuffle(words)) result.push({word:w,mode:choicesFor(w,pool,'word').length>1?'picture':'tiles'});
  for(const w of shuffle(words)) result.push({word:w,mode:level===3?'type':'tiles'});
  return result;
}
/** Small CSV/TSV parser, including quoted commas and escaped quotes. */
export function parseBulk(text) {
  if(String(text).length>200000) throw Error('한 번에 200,000자 이하로 넣어 주세요.');
  const input=String(text).replace(/^\uFEFF/,'').trim();
  if(!input) return [];
  const delimiter=input.includes('\t')?'\t':',';
  let rows=[],row=[],cell='',quoted=false;
  for(let i=0;i<input.length;i++) {
    const c=input[i];
    if(c==='"') {if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===delimiter&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&input[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted) throw Error('닫히지 않은 따옴표가 있어요.');
  row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
  if(rows[0]?.[0]?.trim().toLowerCase()==='word' && ['meaning','뜻'].includes(rows[0]?.[1]?.trim().toLowerCase())) rows.shift();
  if(rows.length>500) throw Error('한 번에 최대 500개까지 추가해 주세요.');
  return rows.map((r,i)=>{
    if(r.length===1 && r[0].includes('/')) {const at=r[0].indexOf('/');r=[r[0].slice(0,at),r[0].slice(at+1)];}
    if(r.length<2 || !r[0].trim() || !r[1].trim()) throw Error(`${i+1}번째 줄: 영어 단어와 뜻이 필요해요.`);
    return normalizeWord({id:`bulk-${i}`,word:r[0],meaning:r[1],category:r[2]||'내 단어',image:r[3]||'',example:r[4]||''});
  });
}
export function streak(days, now=Date.now()) {
  let n=0;const d=new Date(now);d.setHours(12,0,0,0);
  if(!days?.[dayKey(d.getTime())]) d.setDate(d.getDate()-1);
  while(days?.[dayKey(d.getTime())]) {n++;d.setDate(d.getDate()-1);if(n>3650)break;}
  return n;
}
export function award(profile={}, word, mode, correct, hinted, now=Date.now()) {
  const today=dayKey(now), key=`${today}|${mode}|${word.id}`;
  const ledger=Array.isArray(profile.ledger)?profile.ledger.filter(k=>k.startsWith(today+'|')):[];
  const points=correct&&!hinted&&!ledger.includes(key)?3:0;
  const days={...(profile.days||{})}, d=days[today]||{attempts:0,correct:0,stars:0};
  days[today]={attempts:d.attempts+1,correct:d.correct+(correct&&!hinted?1:0),stars:d.stars+points};
  const trimmed=Object.fromEntries(Object.entries(days).sort().slice(-366));
  return {...profile,id:'profile',stars:Math.min(1000000000,(Number(profile.stars)||0)+points),days:trimmed,ledger:points?[...ledger,key]:ledger,earned:points};
}
// Standards-compatible ZIP STORE writer; no third-party runtime or server.
const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
export function zipStore(files) {
  const enc=new TextEncoder(), local=[], central=[];let offset=0,total=0;
  for(const {name,data} of files) {
    if(!/^[a-zA-Z0-9_./-]+$/.test(name)||name.startsWith('/')||name.split('/').includes('..'))throw Error('잘못된 ZIP 경로');
    const n=enc.encode(name),bytes=typeof data==='string'?enc.encode(data):data;
    if(!(bytes instanceof Uint8Array))throw Error('잘못된 파일 데이터');
    total+=bytes.length;if(total>60*1024*1024)throw Error('내보내기 크기가 60MB를 넘어요. 단어팩을 나누어 주세요.');
    const crc=crc32(bytes),head=new Uint8Array(30+n.length),h=new DataView(head.buffer);
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,bytes.length,true);h.setUint32(22,bytes.length,true);h.setUint16(26,n.length,true);head.set(n,30);local.push(head,bytes);
    const c=new Uint8Array(46+n.length),v=new DataView(c.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint16(14,33,true);v.setUint32(16,crc,true);v.setUint32(20,bytes.length,true);v.setUint32(24,bytes.length,true);v.setUint16(28,n.length,true);v.setUint32(42,offset,true);c.set(n,46);central.push(c);offset+=head.length+bytes.length;
  }
  const size=central.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);
  return new Blob([...local,...central,end],{type:'application/zip'});
}
