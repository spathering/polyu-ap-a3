import {compileWorld,deepFreeze,validateContent,resolveSocket} from './content.js';
export function validateFlow(flow,lab,content=null){
 const errors=[],ids=new Set();
 if(flow?.version!=='1.0.0'||!Array.isArray(flow.levels)||!flow.levels.length)return ['Invalid game flow'];
 for(const level of flow.levels){
  if(!/^[a-z][a-z0-9-]*$/.test(level.id)||ids.has(level.id))errors.push('Invalid or duplicate challenge ID');ids.add(level.id);
  for(const key of ['title','subtitle','description','difficulty'])if(typeof level[key]!=='string'||!level[key].trim())errors.push(`${level.id}: missing ${key}`);
  if(!['cyan','violet','amber'].includes(level.accent))errors.push(`${level.id}: invalid accent`);
  if(level.levelId){
   if(level.stationIds||!Array.isArray(level.sections)||!level.sections.length)errors.push(`${level.id}: authored level requires section references`);
   if(content){const authored=content.finiteLevels.find(l=>l.id===level.levelId);if(!authored)errors.push(`${level.id}: missing finite level`);else{let previous=null;const sectionIds=new Set();for(const section of level.sections||[]){try{const from=resolveSocket(content,authored,section.from),to=resolveSocket(content,authored,section.to);if(sectionIds.has(section.id)||!section.name||!section.hint||!section.keys||to[0]<=from[0]||previous&&Math.abs(from[0]-previous[0])>content.rules.collisionSkin)errors.push(`${level.id}: invalid section ordering`);sectionIds.add(section.id);previous=to;}catch(e){errors.push(e.message);}}try{if(JSON.stringify(resolveSocket(content,authored,level.sections[0].from))!==JSON.stringify(resolveSocket(content,authored,authored.spawn))||JSON.stringify(resolveSocket(content,authored,level.sections.at(-1).to))!==JSON.stringify(resolveSocket(content,authored,authored.finish)))errors.push(`${level.id}: sections must cover spawn to finish`);}catch(e){errors.push(e.message);}}}
  }else{const indices=(Array.isArray(level.stationIds)?level.stationIds:[]).map(id=>lab.stations.findIndex(s=>s.id===id));if(!indices.length||indices.some((n,i)=>n<0||i>0&&n!==indices[i-1]+1))errors.push(`${level.id}: select consecutive known stations`);}

 }
 if(flow.modes){
  if(!Array.isArray(flow.modes)||!flow.modes.length)return [...errors,'Invalid mode catalogue'];
  const modeIds=new Set();
  for(const mode of flow.modes){
   if(!/^[a-z][a-z0-9-]*$/.test(mode.id)||modeIds.has(mode.id))errors.push('Invalid or duplicate mode ID');modeIds.add(mode.id);
   if(!['available','coming-soon'].includes(mode.status)||!['finite','endless'].includes(mode.kind)||!['cyan','violet','amber'].includes(mode.accent))errors.push(`${mode.id}: invalid mode metadata`);
   for(const key of ['title','subtitle','description'])if(typeof mode[key]!=='string'||!mode[key].trim())errors.push(`${mode.id}: missing ${key}`);
   const entries=flow.levels.filter(l=>l.modeId===mode.id);if(mode.status==='available'&&!entries.length||mode.status!=='available'&&entries.length)errors.push(`${mode.id}: mode availability does not match playable levels`);
  }
  for(const level of flow.levels)if(!modeIds.has(level.modeId))errors.push(`${level.id}: missing mode reference`);
 }
 return errors;
}
// Navigation reads catalogue references; neither the UI nor URLs author membership.
export function gameModes(flow){return flow.modes||[{id:'finite',title:'Finite lines',subtitle:'Choose a route',description:'Handcrafted parkour challenges.',status:'available',kind:'finite',accent:'cyan'}];}
export function levelsForMode(flow,modeId){const mode=gameModes(flow).find(m=>m.id===modeId);return mode?.status==='available'?flow.levels.filter(l=>!flow.modes||l.modeId===modeId):[];}
export function modeForLevel(flow,id){const entry=flow.levels.find(l=>l.id===id);return entry?gameModes(flow).find(m=>!flow.modes||m.id===entry.modeId):null;}
export function selectionUrl(flow,id){const mode=modeForLevel(flow,id)||gameModes(flow).find(m=>m.status==='available');return `levels.html?mode=${encodeURIComponent(mode.id)}`;}
export function nextLevel(flow,id){const mode=modeForLevel(flow,id);if(!mode)return null;const levels=levelsForMode(flow,mode.id);return levels[levels.findIndex(l=>l.id===id)+1]||null;}
// Challenges are immutable views of the authored circuit. No copied geometry,
// checkpoint coordinates or action timing is authored in the menu catalogue.
export function createChallenge(content,schema,lab,flow,id){
 const errors=[...validateContent(content,schema,lab),...validateFlow(flow,lab,content)];if(errors.length)throw Error(errors.join('\n'));
 const entry=flow.levels.find(l=>l.id===id);if(!entry)throw Error(`Unknown level: ${id}`);
 if(entry.levelId){
  const level=content.finiteLevels.find(l=>l.id===entry.levelId),world=compileWorld(content,{levelId:entry.levelId}),stations=entry.sections.map((section,i)=>{const from=resolveSocket(content,level,section.from),to=resolveSocket(content,level,section.to);return {id:section.id,name:section.name,range:[from[0],to[0]],spawn:from,useLevelSpawn:i===0,cueX:from[0],keys:section.keys,hint:section.hint,checks:[]};});
  const course={...structuredClone(lab),levelId:entry.levelId,title:entry.title,presentation:'game',completionMode:'finish',stations,witnesses:[]};const invalid=validateContent(content,schema,course);if(invalid.length)throw Error(invalid.join('\n'));return deepFreeze({content:structuredClone(content),lab:course,entry,spawn:[...world.spawn],finish:[...world.finish]});
 }
 const stations=entry.stationIds.map(id=>lab.stations.find(s=>s.id===id)),world=compileWorld(content,lab),first=stations[0],last=stations.at(-1);
 const spawn=first.useLevelSpawn?world.spawn:first.spawn,finish=[last.range[1]-content.rules.bodySize[0],world.finish[1]];
 const packageCopy=structuredClone(content),source=packageCopy.finiteLevels.find(l=>l.id===lab.levelId),boundary=structuredClone(packageCopy.modules.find(m=>m.id==='unit-ground'));
 boundary.id=`challenge-${id}-bounds`;boundary.tags=['temporary-preview'];boundary.entities=[];
 boundary.sockets[0].position=[...spawn];boundary.sockets[1].position=finish;
 source.id=`challenge-${id}`;source.instances.push({id:'challenge-bounds',moduleId:boundary.id,position:[0,0]});source.spawn={instanceId:'challenge-bounds',socketId:'entry'};source.finish={instanceId:'challenge-bounds',socketId:'exit'};packageCopy.modules.push(boundary);
 const course={...structuredClone(lab),levelId:source.id,title:entry.title,presentation:'game',completionMode:'finish',stations:structuredClone(stations),witnesses:[]};course.stations[0].useLevelSpawn=true;
 const invalid=validateContent(packageCopy,schema,course);if(invalid.length)throw Error(invalid.join('\n'));
 return deepFreeze({content:packageCopy,lab:course,entry,spawn:[...spawn],finish});
}
export function readProgress(storage){try{const saved=JSON.parse(storage.getItem('motion-run.progress.v1')||'{}');return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};}catch{return {};}}
export function recordCompletion(storage,id,seconds){
 const saved=readProgress(storage),old=saved[id];saved[id]={bestSeconds:Number.isFinite(old?.bestSeconds)?Math.min(old.bestSeconds,seconds):seconds};
 try{storage.setItem('motion-run.progress.v1',JSON.stringify(saved));return true;}catch{return false;}
}
