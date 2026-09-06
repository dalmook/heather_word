/* Read-only presentation facts. Missing acquisition history is never invented. */
export function characterAcquisitionRecord(season2,characterId){
 const records=(Array.isArray(season2?.activityLog)?season2.activityLog:[]).filter(event=>
   ((event.type==='starter'&&event.characterId===characterId)||
   (event.type==='hatch'&&event.characterId===characterId&&event.duplicate===false)||
   (event.type==='evolve'&&event.to===characterId))&&
   typeof event.at==='string'&&Number.isFinite(Date.parse(event.at)));
 if(!records.length)return null;
 return records.reduce((first,event)=>Date.parse(event.at)<Date.parse(first.at)?event:first);
}
