import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {SEASON2_WORLDS,SEASON2_SPECIES,SEASON2_CATALOG,SEASON2_STARTERS,renderMonsterSvg,getSpeciesStages} from '../monster-catalog-season2.js';
import {DRAWN_SPECIES,renderCharacterArt} from '../character-art.js';
import {readCharacterData,literalCatalog} from '../tools/character-data.mjs';
import {AVATAR_SLOTS,resolveAvatarArtParts,buildAvatarLayers,renderAvatarSvg,renderAvatarItemSvg,renderAvatarLayerSvg} from '../character-avatar.js';
import {renderLegacyMonster,renderPetSvg,renderCharmSvg,LEGACY_ART_FAMILIES,PET_ART_IDS,CHARM_ART_IDS} from '../character-companions.js';
import {characterAcquisitionRecord} from '../character-progress.js';
import {migratePlayer,evolveCharacter,claimStarter,hatchCharacter,applyStageReward} from '../season2-core.js';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const fixture=JSON.parse(await read('tests/fixtures/character-data-baseline.json'));
const data=await readCharacterData(),source=await read('app.js');
const hash=s=>createHash('sha256').update(s).digest('hex');
const functions=source=>{const matches=[...source.matchAll(/^(?:async )?function (\w+)\(/gm)];return Object.fromEntries(matches.map((m,i)=>[m[1],source.slice(m.index,matches[i+1]?.index??source.length)]));};
const geometry=svg=>svg.replace(/<title>[\s\S]*?<\/title>/g,'').replace(/\s(?:id|aria-label|data-[\w-]+|class)="[^"]*"/g,'').replace(/#[\da-f]{3,8}\b/gi,'#COLOR').replace(/\s+/g,' ').trim();
const defaults=Object.fromEntries(AVATAR_SLOTS.map(slot=>[slot,data.avatar.find(p=>p.slot===slot&&p.cost===0)?.id||'']));
test('all 12 worlds, 20 species and 60 IDs retain exact non-name data',()=>{
 assert.deepEqual(SEASON2_WORLDS,fixture.worlds);assert.deepEqual(SEASON2_STARTERS,fixture.starters);
 const omit=(obj,...keys)=>Object.fromEntries(Object.entries(obj).filter(([k])=>!keys.includes(k)));
 assert.deepEqual(SEASON2_SPECIES.map(o=>omit(o,'names')),fixture.species.map(o=>omit(o,'names')));
 assert.deepEqual(SEASON2_CATALOG.map(o=>omit(o,'name')),fixture.catalog.map(o=>omit(o,'name')));
 assert.equal(SEASON2_CATALOG.length,60);assert.deepEqual([...DRAWN_SPECIES].sort(),SEASON2_SPECIES.map(s=>s.id).sort());
});
test('all renamed display labels have explicit original ID provenance',async()=>{
 const mapping=JSON.parse(await read('docs/characters/name-map.json'));
 assert.equal(mapping.length,60);
 for(const c of SEASON2_CATALOG){const row=mapping.find(r=>r.speciesId===c.speciesId&&r.stage===c.evolutionStage);assert.equal(row?.newName,c.name);assert.equal(row.oldName,fixture.catalog.find(x=>x.id===c.id).name);}
});
test('prices, rarity keys, IDs, food effects and default ownership are unchanged',()=>{
 for(const key of ['AVATAR_ITEMS','SHOP_ITEMS','SHOP_PETS','SHOP_THEMES','SHOP_FOODS','DEFAULT_OWNED_AVATAR_ITEMS'])assert.deepEqual(literalCatalog(source,key),fixture[key],key);
 assert.equal(data.avatar.length,56);assert.equal(data.pets.length,5);assert.equal(data.charms.length,18);
 assert.deepEqual([...PET_ART_IDS].sort(),data.pets.map(p=>p.id).sort());assert.deepEqual([...CHARM_ART_IDS].sort(),data.charms.map(p=>p.id).sort());
});
test('60 genuine geometry variants and 20 distinct species silhouettes remain without names and colors',()=>{
 const forms=new Set(),species=new Set();
 for(const c of SEASON2_CATALOG){const svg=renderMonsterSvg(c);forms.add(hash(geometry(svg)));assert.equal(svg,renderMonsterSvg(c.id));assert.match(svg,/viewBox="0 0 240 240"/);assert.doesNotMatch(svg,/NaN|undefined|Infinity/);}
 for(const s of SEASON2_SPECIES){const [c]=getSpeciesStages(s.id),svg=renderMonsterSvg(c,{locked:true});species.add(hash(geometry(svg)));assert.doesNotMatch(svg,/hw-character-eye|<circle|<ellipse|url\(#/);assert.doesNotMatch(svg,new RegExp('<title>'+c.name));}
 assert.equal(forms.size,60);assert.equal(species.size,20);
});
test('SVG is deterministic, escaped, self-contained and has no fragment IDs to collide',()=>{
 const c={...SEASON2_CATALOG[0],id:'"><script>alert(1)</script>',name:'<img onerror="bad">',palette:['" onload="bad','#125578','#fffafa']};
 const svg=renderCharacterArt(c);assert.doesNotMatch(svg,/<script|<img|onload=|\sid="|url\(|href=|<foreignObject/);assert.match(svg,/&lt;img/);
 for(const c of SEASON2_CATALOG){const svg=renderMonsterSvg(c);assert.equal(svg,renderMonsterSvg(c));assert.doesNotMatch(svg,/\sid="|url\(#|<script|<foreignObject|href=/);}
 for(const item of data.avatar)assert.doesNotMatch(renderAvatarItemSvg(item,data.avatar),/\sid="|url\(#|<script|<foreignObject|href=/);
});
test('outfit precedence, separate trousers, back accessories and glasses are resolved without mutation',()=>{
 const before=JSON.stringify({defaults,parts:data.avatar}),outfit=resolveAvatarArtParts(defaults,data.avatar);
 assert.equal(outfit.top,null);assert.equal(outfit.bottom,null);assert.equal(outfit.outfit.id,'outfit_basic_01');
 const separate={...defaults,outfit:'',bottom:'bottom_skirt_02',accessory:'accessory_glasses_02'};
 const resolved=resolveAvatarArtParts(separate,data.avatar);assert.equal(resolved.top.id,'top_sky_01');
 const layers=buildAvatarLayers(separate,data.avatar);assert.ok(layers.some(l=>l.slot==='bottom'));assert.equal(layers.at(-1).slot,'accessory');
 const wing=buildAvatarLayers({...defaults,accessory:'accessory_wings_07'},data.avatar);
 assert.ok(wing.findIndex(l=>l.slot==='accessory')<wing.findIndex(l=>l.slot==='body'));
 assert.equal(JSON.stringify({defaults,parts:data.avatar}),before);
 assert.equal(resolveAvatarArtParts({hair:'outfit_basic_01'},data.avatar).hair,null);
});
test('all current items render through the same avatar pipeline and standalone layers are valid',()=>{
 for(const item of data.avatar){const thumb=renderAvatarItemSvg(item,data.avatar,defaults);assert.match(thumb,/class="hw-avatar"/);assert.doesNotMatch(thumb,/NaN|undefined|Infinity/);assert.match(renderAvatarLayerSvg(item,data.avatar),/viewBox="0 0 240 320"/);}
 assert.equal(renderAvatarSvg(defaults,data.avatar),renderAvatarSvg(JSON.parse(JSON.stringify(defaults)),data.avatar));
});
test('legacy 1000-monster identity range and every pet/charm generate independently of Season 2',()=>{
 assert.equal(LEGACY_ART_FAMILIES.length,20);const ids=new Set();
 for(let i=1;i<=1000;i++){const id='monster_'+String(i).padStart(3,'0');const svg=renderLegacyMonster({id,number:i,name:'기존 XP 친구 '+i});assert.ok(svg.includes(`data-character-id="${id}"`));assert.doesNotMatch(svg,/NaN|undefined|Infinity/);ids.add(id);}
 assert.equal(ids.size,1000);
 assert.equal(new Set(data.pets.map(p=>hash(geometry(renderPetSvg(p))))).size,5);
 assert.equal(new Set(data.charms.map(p=>hash(geometry(renderCharmSvg(p))))).size,18);
});
test('acquisition dates require exact credible acquisition events and never invent missing history',()=>{
 const s2={activityLog:[{type:'hatch',characterId:'a',duplicate:true,at:'2026-01-01'},{type:'starter',characterId:'a',at:'2026-09-05T08:00:00Z'},{type:'evolve',to:'b',at:'bad'}]};
 const before=JSON.stringify(s2);assert.equal(characterAcquisitionRecord(s2,'a').type,'starter');assert.equal(characterAcquisitionRecord(s2,'b'),null);assert.equal(characterAcquisitionRecord({},'a'),null);assert.equal(JSON.stringify(s2),before);
});
test('old save ownership, balances, avatar and pet care survive migration and JSON save/load',()=>{
 const now=new Date('2026-09-06T00:00:00Z');
 const save={name:'기존 사용자',xp:98765,coin:4321,score:8912,ownedItems:{crown:true},equippedItem:'crown',ownedPets:{mellow_cat:true},equippedPet:'mellow_cat',petCare:{xp:200,hunger:65,mood:90},ownedAvatarItems:Object.fromEntries(data.avatar.map(p=>[p.id,true])),equippedAvatar:{...defaults,hair:'hair_twintail_03',accessory:'accessory_wings_07'},season2:{season2Collection:{s2_cookie_crumb_bear_1:true},partnerId:'s2_cookie_crumb_bear_1',monsterAffinity:{s2_cookie_crumb_bear_1:{points:33,wordsStudied:15}},evolutionMaterials:12}};
 const first=migratePlayer(save,[],now),second=migratePlayer(JSON.parse(JSON.stringify(first)),[],now);
 for(const key of ['name','xp','coin','score','ownedItems','equippedItem','ownedPets','equippedPet','petCare','ownedAvatarItems','equippedAvatar'])assert.deepEqual(first[key],save[key],key);
 assert.deepEqual(first,second);assert.equal(second.season2.partnerId,save.season2.partnerId);assert.equal(second.season2.monsterAffinity.s2_cookie_crumb_bear_1.points,33);
 assert.equal(renderAvatarSvg(save.equippedAvatar,data.avatar),renderAvatarSvg(second.equippedAvatar,data.avatar));
});
test('evolution, hatching and stage rewards stay idempotent when presentation is omitted or interrupted',()=>{
 const now=new Date('2026-09-06T00:00:00Z');let s2=migratePlayer({},[],now).season2;
 s2=claimStarter(s2,SEASON2_STARTERS[0],SEASON2_STARTERS,now);const id=SEASON2_STARTERS[0],c=SEASON2_CATALOG.find(c=>c.id===id),next=getSpeciesStages(c.speciesId)[1];
 s2.monsterAffinity[id]={points:30,wordsStudied:30};s2.evolutionMaterials=3;
 const first=evolveCharacter(s2,id,next.id,1,now);assert.equal(first.evolved,true);assert.equal(first.season2.evolutionMaterials,0);
 const reload=migratePlayer(JSON.parse(JSON.stringify({season2:first.season2})),[],now).season2;
 const second=evolveCharacter(reload,id,next.id,1,now);assert.equal(second.evolved,false);assert.equal(second.season2.evolutionMaterials,0);assert.equal(second.season2.partnerId,next.id);
 const a=applyStageReward(reload,0,3,now),b=applyStageReward(a,0,3,now);assert.deepEqual(a,b);
 const ready={...a,incubatingEgg:{...a.incubatingEgg,worldId:'cloud',progress:100}};
 const pool=SEASON2_CATALOG.filter(c=>c.worldId==='cloud'&&c.evolutionStage===1).map(c=>c.id),h=hatchCharacter(ready,'cloud',pool,now);
 assert.ok(h.characterId);assert.equal(hatchCharacter(h.season2,'cloud',pool,now).characterId,'');
});
test('all unmodified Season 2 coordination functions retain their original bytes',async()=>{
 const baseline=JSON.parse(await read('tests/fixtures/season2-functions-baseline.json')),actual=functions(await read('season2.js'));
 const exceptions=new Set(baseline.visualExceptions);
 for(const [name,expected] of Object.entries(baseline.functions)){assert.ok(actual[name],name);if(!exceptions.has(name))assert.equal(hash(actual[name]),expected,name);}
 // This last helper only gained an inter-function blank line; still require its exact body.
 assert.equal(actual.escapeAttr.trimEnd(),'function escapeAttr(value) {\n  return escapeHtml(value).replaceAll("`", "&#096;");\n}');
});
test('render-only exception list is explicit and immutable in scope',async()=>{
 const f=JSON.parse(await read('tests/fixtures/character-visual-functions.json'));
 assert.deepEqual(Object.keys(f.functions).sort(),['ensureAvatarRuntime','renderHomePet','renderAvatar','renderPhaserAvatar','downloadAvatarImage','renderEquippedAccessory','renderAvatarPurchaseProduct','renderAvatarProduct','renderShopProduct','renderPetProduct','renderPetCare','renderCollection'].sort());
 const ui=await read('character-ui.js');assert.doesNotMatch(ui,/localStorage\.(setItem|removeItem)|syncPlayer\(|persistSeason2\(|applyStageReward\(|evolveCharacter\(/);
 const s2=functions(await read('season2.js'));for(const name of ['chooseStarter','hatchEgg','evolve']){assert.ok(s2[name].indexOf('persistSeason2()')<s2[name].indexOf('showCharacterReveal('),name);}
 const phaser=await read('avatar-phaser.js');assert.match(phaser,/HeatherAvatarArt/);assert.match(phaser,/destroy/);assert.match(phaser,/IntersectionObserver/);
});
test('generated deployment assets exactly match the canonical runtime sources',async()=>{
 for(const c of SEASON2_CATALOG){const expected=renderMonsterSvg(c).replace(' class="s2-monster-svg"','').replace(` data-character-id="${c.id}"`,'')+'\n';assert.equal(await read(c.image),expected,c.id);}
 for(const item of data.avatar){assert.equal(await read('assets/avatar/previews/'+item.id+'.svg'),renderAvatarItemSvg(item,data.avatar)+'\n');if(item.src)assert.equal(await read(item.src),renderAvatarLayerSvg(item,data.avatar)+'\n');}
 for(const pet of data.pets)assert.equal(await read('assets/companions/pets/'+pet.id+'.svg'),renderPetSvg(pet)+'\n');
 for(const item of data.charms)assert.equal(await read('assets/companions/charms/'+item.id+'.svg'),renderCharmSvg(item)+'\n');
});
