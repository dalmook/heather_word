import fs from 'node:fs';
import path from 'node:path';
import {validateManifest,validatePack} from '../word-studio/core.js';
const root=process.cwd();
const manifest=validateManifest(JSON.parse(fs.readFileSync(path.join(root,'content/index.json'),'utf8')));
const ids=new Set();let count=0,assets=0;
for(const item of manifest.packs){
 const pack=validatePack(JSON.parse(fs.readFileSync(path.join(root,'content',item.file),'utf8')));
 if(pack.id!==item.id)throw Error(`Pack ID mismatch: ${item.file}`);
 for(const w of pack.words){
  if(ids.has(w.id))throw Error(`Duplicate global word ID: ${w.id}`);ids.add(w.id);count++;
  for(const key of ['image','audio'])if(w[key]&&!w[key].startsWith('https://')){const file=path.resolve(root,w[key]);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())throw Error(`Missing ${key}: ${w.id} → ${w[key]}`);assets++;}
 }
}
console.log(`Word Studio content valid: ${manifest.packs.length} packs, ${count} words, ${assets} local media files.`);
