import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {wordResults,progress,escapeText,homeView} from '../ui/components.js';
import {deriveSnapshot,snapshotFingerprint,missionCta} from '../ui-v9-core.js';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const baseline=JSON.parse(await read('tests/fixtures/commercial-baseline.json'));
const hash=s=>createHash('sha256').update(s).digest('hex');
for(const [path,expected] of Object.entries(baseline.files)) test(`protected baseline file is byte-identical: ${path}`,async()=>assert.equal(hash(await read(path)),expected));
test('all pre-existing app functions except navigation/render remain byte-identical',async()=>{
 const app=await read('app.js'),matches=[...app.matchAll(/^(?:async )?function (\w+)\(/gm)];
 const actual=Object.fromEntries(matches.map((m,i)=>[m[1],app.slice(m.index,matches[i+1]?.index??app.length)]));
 const joined=baseline.appFunctionNames.map(name=>name+':'+hash(actual[name]||'')).join('\n');
 assert.equal(hash(joined),baseline.appFunctionsSha,'A preserved learning function changed');
});
test('word library exposes all 181 entries through pagination without mutation',()=>{
 const words=Array.from({length:181},(_,i)=>({id:String(i),word:`word${i}`,meaning:'한글 뜻',categoryId:i%2?'a':'b'}));
 const before=JSON.stringify(words);
 assert.equal(wordResults(words,'','all',60).items.length,60);
 assert.equal(wordResults(words,'','all',120).items.length,120);
 assert.equal(wordResults(words,'','all',240).items.length,181);
 assert.equal(wordResults(words,'한글','a',60).total,90);
 assert.equal(wordResults(words,'NONE','all',60).total,0);
 assert.equal(JSON.stringify(words),before);
});
test('presentation helpers escape markup and clamp progress',()=>{
 assert.equal(escapeText('<img onerror="bad">'), '&lt;img onerror=&quot;bad&quot;&gt;');
 assert.match(progress(180,'<unsafe>'),/aria-valuenow="100"/);
 assert.match(progress(NaN,'test'),/aria-valuenow="0"/);
 assert.doesNotMatch(progress(50,'<unsafe>'),/<unsafe>/);
});
test('first use has an enabled word preparation action, not a fake activity',()=>{
 const snapshot=deriveSnapshot({});const before=JSON.stringify(snapshot);
 const html=homeView(snapshot,{icon:()=>'',partnerMarkup:()=>'',missionCta});
 assert.match(html,/data-hw9-action="parent"/);
 assert.match(html,/첫 단어장 준비하기/);
 assert.doesNotMatch(html,/disabled/);
 assert.equal(JSON.stringify(snapshot),before);
});
test('adventure and daily mission never use an invented combined percentage',()=>{
 const snapshot=deriveSnapshot({player:{season2:{dailyAdventure:{stageIndex:1,stars:[3]}}}});
 const html=homeView(snapshot,{icon:()=>'',partnerMarkup:()=>'',missionCta});
 assert.doesNotMatch(html,/약 5분/);
 assert.equal(snapshot.mission.percent,0);
 assert.equal(snapshot.adventure.percent,25);
});
test('edited word content and selected category invalidate the display snapshot',()=>{
 const raw={words:[{id:'1',word:'apple',meaning:'사과',categoryId:'a'}],selectedCategoryId:'a'};
 const original=snapshotFingerprint(deriveSnapshot(raw));
 assert.notEqual(original,snapshotFingerprint(deriveSnapshot({...raw,selectedCategoryId:'all'})));
 assert.notEqual(original,snapshotFingerprint(deriveSnapshot({...raw,words:[{...raw.words[0],meaning:'수정'}]})));
});
test('all report entry points use the existing PIN gate, not a public password',async()=>{
 const s=await read('season2.js');assert.doesNotMatch(s,/MANAGE_PASSWORD|["']3341["']|window\.prompt/);
 assert.match(s,/requestParentAccess\(showReport\)/);assert.match(s,/view === "report" && window\.HEATHER_PARENT_GATE_GRANTED/);
 const ui=await read('ui-v9.js');assert.match(ui,/finally \{ submit\.disabled=false/);
});
test('search handlers update results rather than replacing the input and legacy render is lazy',async()=>{
 const ui=await read('ui-v9.js'),app=await read('app.js');
 assert.match(ui,/compositionend/);assert.match(ui,/function refreshWordResults/);
 assert.match(app,/if \(state\.screen === "collection"\) renderCollection\(\)/);
 assert.match(app,/clearTimeout\(nextTimer\)/);
});
test('static metadata uses project-relative installation and valid icon paths',async()=>{
 const manifest=JSON.parse(await read('manifest.webmanifest'));
 assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./#/home');
 for(const icon of manifest.icons) assert.ok(icon.src.startsWith('./'));
 assert.match(await read('404.html'),/heather_word\/#\/home/);
});
