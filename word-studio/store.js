import {grade,award,normalizeWord,VERSION} from './core.js?v=1.0.0';
const stores=['entries','images','progress','meta'];
export async function openStore(demo=false) {
  const db=await new Promise((resolve,reject)=>{
    const req=indexedDB.open(demo?'heather_word_studio_demo_v1':'heather_word_studio_v1',1);
    req.onupgradeneeded=()=>{for(const name of stores)if(!req.result.objectStoreNames.contains(name))req.result.createObjectStore(name,{keyPath:'id'});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('다른 탭을 닫고 다시 열어 주세요.'));
  });
  db.onversionchange=()=>db.close();
  function transact(names,mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction(names,mode);let value;tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error||Error('저장에 실패했어요.'));tx.onabort=()=>reject(tx.error||Error('저장이 취소됐어요.'));try{fn(tx,v=>{value=v;});}catch(e){tx.abort();reject(e);}});}
  const all=name=>transact([name],'readonly',(tx,done)=>{const r=tx.objectStore(name).getAll();r.onsuccess=()=>done(r.result);});
  return {
    all,
    async snapshot(){const [entries,images,progress,meta]=await Promise.all(stores.map(all));return{entries,images,progress,meta};},
    async save(entry,image=undefined){
      const clean={...normalizeWord(entry),_packId:entry._packId||'my-words',_source:'이 기기 편집',localImage:Boolean(entry.localImage),hidden:Boolean(entry.hidden),updatedAt:Date.now()};
      return transact(['entries','images'],'readwrite',(tx,done)=>{tx.objectStore('entries').put(clean);if(image===null)tx.objectStore('images').delete(clean.id);else if(image)tx.objectStore('images').put({id:clean.id,blob:image});done(clean);});
    },
    async saveMany(entries){return transact(['entries'],'readwrite',(tx)=>{for(const e of entries)tx.objectStore('entries').put({...normalizeWord(e),_packId:e._packId||'my-words',_source:'이 기기 편집',updatedAt:Date.now()});});},
    async reset(id){return transact(['entries','images'],'readwrite',tx=>{tx.objectStore('entries').delete(id);tx.objectStore('images').delete(id);});},
    async attempt(word,correct,mode,hinted=false){return transact(['progress','meta'],'readwrite',(tx,done)=>{
      const ps=tx.objectStore('progress'),ms=tx.objectStore('meta'),pr=ps.get(word.id),mr=ms.get('profile');let pReady=false,mReady=false;
      const finish=()=>{if(!pReady||!mReady)return;const p=grade(word,pr.result,correct,{hinted}),profile=award(mr.result,word,mode,correct,hinted);ps.put(p);ms.put(profile);done({progress:p,profile});};
      pr.onsuccess=()=>{pReady=true;finish();};mr.onsuccess=()=>{mReady=true;finish();};
    });},
    async setMeta(value){return transact(['meta'],'readwrite',tx=>tx.objectStore('meta').put(value));},
    async backup(catalog){const s=await this.snapshot();const images=await Promise.all(s.images.map(async x=>({id:x.id,type:x.blob.type,data:await toDataURL(x.blob)})));return{format:'heather-word-studio',schemaVersion:1,version:VERSION,createdAt:new Date().toISOString(),entries:catalog.map(w=>({...normalizeWord(w),_packId:w._packId,localImage:!!w.localImage})),progress:s.progress,meta:s.meta,images};},
    async restore(payload){
      const clean=validateBackup(payload);
      return transact(stores,'readwrite',tx=>{for(const [name,rows] of Object.entries(clean))for(const r of rows)tx.objectStore(name).put(r);});
    },
    close(){db.close();}
  };
}
export function toDataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});}
export function validateBackup(p){
  if(!p||p.format!=='heather-word-studio'||p.schemaVersion!==1||!Array.isArray(p.entries)||p.entries.length>10000||!Array.isArray(p.images)||p.images.length>10000||!Array.isArray(p.progress)||p.progress.length>10000||!Array.isArray(p.meta)||p.meta.length>20)throw Error('이 앱의 백업 파일이 아니거나 파일이 너무 커요.');
  const seen=new Set();const entries=p.entries.map(e=>{const w=normalizeWord(e);if(seen.has(w.id))throw Error('백업에 중복 ID가 있어요.');seen.add(w.id);return{...w,_packId:String(e._packId||'my-words'),localImage:e.localImage===true,_source:'복원한 단어'};});
  let size=0;const imageIds=new Set();
  const images=p.images.map(x=>{if(!seen.has(x.id)||imageIds.has(x.id)||!/^data:image\/(webp|png|jpeg);base64,[a-zA-Z0-9+/=]+$/.test(x.data||''))throw Error('백업 사진 형식이 올바르지 않아요.');imageIds.add(x.id);const type=x.data.slice(5,x.data.indexOf(';')),bin=atob(x.data.split(',')[1]);size+=bin.length;if(size>40*1024*1024)throw Error('백업 사진 용량이 40MB를 넘어요.');return{id:x.id,blob:new Blob([Uint8Array.from(bin,c=>c.charCodeAt(0))],{type})};});
  if(entries.some(e=>e.localImage&&!imageIds.has(e.id)))throw Error('백업에 빠진 사진이 있어요.');
  const progress=p.progress.filter(x=>seen.has(x.id)).map(x=>({id:x.id,signature:String(x.signature||'').slice(0,400),box:Math.min(5,Math.max(0,Number(x.box)||0)),attempts:Math.min(1e9,Math.max(0,Number(x.attempts)||0)),correct:Math.min(1e9,Math.max(0,Number(x.correct)||0)),wrong:Math.min(1e9,Math.max(0,Number(x.wrong)||0)),due:Math.max(0,Number(x.due)||0),lastAt:Math.max(0,Number(x.lastAt)||0),lastGraduatedDay:String(x.lastGraduatedDay||'').slice(0,10)}));
  const meta=p.meta.filter(x=>['profile','settings'].includes(x.id)).map(x=>{if(x.id==='settings')return{id:'settings',sound:x.sound!==false,level:[1,2,3].includes(x.level)?x.level:1};const days=Object.fromEntries(Object.entries(x.days||{}).filter(([k])=>/^\d{4}-\d{2}-\d{2}$/.test(k)).slice(-366).map(([k,d])=>[k,{attempts:Math.max(0,Number(d.attempts)||0),correct:Math.max(0,Number(d.correct)||0),stars:Math.max(0,Number(d.stars)||0)}]));return{id:'profile',stars:Math.min(1e9,Math.max(0,Number(x.stars)||0)),days,ledger:Array.isArray(x.ledger)?x.ledger.filter(v=>typeof v==='string').slice(-30000):[]};});
  return{entries,images,progress,meta};
}
export async function compressImage(file){
  if(!file||!/^image\/(jpeg|png|webp|gif)$/.test(file.type))throw Error('JPG, PNG, WebP, GIF 사진을 선택해 주세요.');
  if(file.size>15*1024*1024)throw Error('사진은 15MB 이하로 골라 주세요.');
  const url=URL.createObjectURL(file);let img;
  try{img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('사진을 읽지 못했어요. 다른 파일을 골라 주세요.'));i.src=url;});
    if(!img.naturalWidth||!img.naturalHeight)throw Error('사진 크기를 읽지 못했어요.');
    const ratio=Math.min(1,1024/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*ratio));c.height=Math.max(1,Math.round(img.naturalHeight*ratio));const ctx=c.getContext('2d');if(!ctx)throw Error('이 브라우저에서는 사진을 변환할 수 없어요.');ctx.drawImage(img,0,0,c.width,c.height);
    const blob=await new Promise(resolve=>c.toBlob(resolve,'image/webp',.82));if(!blob||blob.size>2*1024*1024)throw Error('사진 압축에 실패했어요. 더 작은 사진을 골라 주세요.');return blob;
  }finally{URL.revokeObjectURL(url);}
}
