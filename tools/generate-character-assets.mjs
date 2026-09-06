import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readCharacterData} from './character-data.mjs';
import {renderAvatarItemSvg,renderAvatarLayerSvg} from '../character-avatar.js';
import {renderPetSvg,renderCharmSvg,renderLegacyMonster,LEGACY_ART_FAMILIES} from '../character-companions.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),{avatar,charms,pets}=await readCharacterData();
const write=async(path,svg)=>{const file=resolve(root,path.replace(/^\.\//,''));if(!file.startsWith(root+'/assets/'))throw new Error('Asset path outside assets');await mkdir(dirname(file),{recursive:true});await writeFile(file,svg+'\n','utf8');};
for(const item of avatar){if(item.src)await write(item.src,renderAvatarLayerSvg(item,avatar));await write('assets/avatar/previews/'+item.id+'.svg',renderAvatarItemSvg(item,avatar));}
for(const item of charms)await write('assets/companions/charms/'+item.id+'.svg',renderCharmSvg(item));
for(const pet of pets)await write('assets/companions/pets/'+pet.id+'.svg',renderPetSvg(pet));
for(let i=0;i<20;i++)await write('assets/companions/xp-families/'+LEGACY_ART_FAMILIES[i]+'.svg',renderLegacyMonster({number:i+1,name:LEGACY_ART_FAMILIES[i]}));
console.log(`Generated ${avatar.filter(p=>p.src).length} original avatar layers, ${avatar.length} previews, ${pets.length} pets, ${charms.length} charms, 20 XP family representatives. Runtime remains canonical.`);
