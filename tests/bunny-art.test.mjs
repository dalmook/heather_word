import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {rabbitMarkup,rabbitHero,normalizeBunnyPrefs,energyLabel} from '../bunny-art.js';
import {BunnySoundtrack} from '../bunny-audio.js';
test('rabbit states use one original, accessible, white SVG rig',()=>{
 for(const mood of ['idle','input','correct','review','celebrate','wave']){
  const svg=rabbitMarkup({mood});assert.ok(svg.includes(`data-mood="${mood}"`));assert.match(svg,/fill="#fffef9"/);assert.match(svg,/aria-label=/);assert.match(svg,/bunny-ear-left/);assert.match(svg,/bunny-arm-right/);
 }
 assert.match(rabbitMarkup({decorative:true}),/aria-hidden="true"/);
});
test('rabbit labels and unsupported states cannot inject markup',()=>{
 const svg=rabbitMarkup({mood:'" onload="bad()',label:'"><script>bad()</script>'});
 assert.match(svg,/data-mood="idle"/);assert.doesNotMatch(svg,/<script|onload=/);assert.match(svg,/&lt;script&gt;/);
});
test('rabbit hero is keyboard operable with no external asset request',()=>{
 const html=rabbitHero();assert.match(html,/<button type="button"/);assert.match(html,/data-bunny-pet/);assert.match(html,/bunny-landscape/);assert.doesNotMatch(html,/<image|<img|<script|<foreignObject/);
});
test('preferences are opt-in, bounded and resilient to invalid storage',()=>{
 for(const v of [null,false,[],undefined,123,'x'])assert.deepEqual(normalizeBunnyPrefs(v),{music:false,volume:.24,motion:'full'});
 assert.deepEqual(normalizeBunnyPrefs({music:'yes',volume:3,motion:'spin'}),{music:false,volume:1,motion:'full'});
 assert.deepEqual(normalizeBunnyPrefs({music:true,volume:-5,motion:'off'}),{music:true,volume:0,motion:'off'});
 assert.equal(normalizeBunnyPrefs({volume:Infinity}).volume,.24);
});
test('energy labels are based on bounded actual answers, not invented rewards',()=>{
 assert.equal(energyLabel(-1),energyLabel(0));assert.equal(energyLabel(3),'신나는 모험!');assert.equal(energyLabel(6),'반짝반짝!');assert.equal(energyLabel(100),'피날레!');
});
test('music is silent by default and does not schedule without user activation',()=>{
 const sound=new BunnySoundtrack();sound.configure({enabled:true,energy:10});assert.equal(sound.timer,0);assert.equal(sound.context,null);sound.configure({visible:false});sound.stop();assert.equal(sound.nodes.size,0);
});
test('presentation adapter cannot write learning data or grant rewards',()=>{
 const source=fs.readFileSync(new URL('../bunny-adventure.js',import.meta.url),'utf8');
 const writes=[...source.matchAll(/localStorage\.(setItem|removeItem|clear)\(([^)]*)\)/g)];assert.equal(writes.length,1);assert.equal(writes[0][1],'setItem');assert.match(writes[0][2],/^PREFS_KEY,/);
 assert.doesNotMatch(source,/\.award|\.grant|\.syncPlayer|\.recordWordResult|\.setDoc|heather_word_v3|heather_word_demo_v1/);
});
test('effect lifecycle and keyboard input retain explicit cleanup and motion safeguards',()=>{
 const source=fs.readFileSync(new URL('../bunny-adventure.js',import.meta.url),'utf8');assert.match(source,/#answerInput/);assert.match(source,/prefers-reduced-motion/);assert.match(source,/visibilitychange/);assert.match(source,/pagehide/);assert.match(source,/observer\?\.disconnect/);assert.match(source,/particles\.slice\(-140\)/);
});
