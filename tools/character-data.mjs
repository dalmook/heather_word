/* Build/test only. Extract trusted literal catalogs without executing the application. */
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
export function literalCatalog(source,name){
 const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const match=source.match(new RegExp('const '+escaped+' = Object\\.freeze\\((\\[[\\s\\S]*?\\n\\]|\\{[\\s\\S]*?\\n\\})\\);'));
 if(!match)throw new Error('Missing literal catalog: '+name);
 return JSON.parse(JSON.stringify(vm.runInNewContext('('+match[1]+')',Object.create(null),{timeout:500})));
}
export async function readCharacterData(){
 const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
 return {avatar:literalCatalog(source,'AVATAR_ITEMS'),charms:literalCatalog(source,'SHOP_ITEMS'),pets:literalCatalog(source,'SHOP_PETS')};
}
