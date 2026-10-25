import {validateContent,deepFreeze,compileWorld,resolveSocket} from './content.js';
import {moduleSpace,entityBounds,heightUnit} from './module-space.js';
import {snapCoordinate} from './editor-snap.js';

export const clone=value=>structuredClone(value);
const round=n=>Math.round(n*10000)/10000;
export const snap=snapCoordinate;
export const boundsOf=entityBounds;
export function translateEntity(e,dx,dy){
 if(e.rect){e.rect[0]=round(e.rect[0]+dx);e.rect[1]=round(e.rect[1]+dy);}
 if(e.position)e.position=[round(e.position[0]+dx),round(e.position[1]+dy)];
 if(e.points)e.points=e.points.map(([x,y])=>[round(x+dx),round(y+dy)]);
}
export const uniqueId=(base,list)=>{let id=base,n=2;while(list.some(v=>v.id===id))id=`${base}-${n++}`;return id;};
export const levelOf=(data,id)=>data.finiteLevels.find(l=>l.id===id);
export const moduleOf=(data,id)=>data.modules.find(m=>m.id===id);
export function migrateLegacy(candidate,template){
 if(candidate.schemaVersion!=='1.2.0')throw Error('Only the known 1.2.0 package can be converted.');
 const next=clone(candidate);next.schemaVersion=template.schemaVersion;
 for(const key of ['climbMaxHeight','climbDurationSeconds','climbTrajectory','contextApproachSeconds','actionRecoverySeconds','actionChainWindowSeconds'])next.rules[key]=clone(template.rules[key]);
 next.rules.camera.velocitySmoothingSeconds=template.rules.camera.velocitySmoothingSeconds;
 next.rules.camera.followAcceleration=template.rules.camera.followAcceleration;
 if(!next.rules.enabledAbilities.includes('climb'))next.rules.enabledAbilities.push('climb');
 for(const m of next.modules)delete m.size;
 return next;
}
export const socketPosition=resolveSocket;
// One draft owner. Every edit, import, undo and playtest uses the game contract.
export class EditorDocument{
 constructor(data,schema,levelId=data.finiteLevels[0].id){this.schema=schema;this.past=[];this.future=[];this.revision=0;this.replace(data,levelId,false);}
 check(data){const errors=validateContent(data,this.schema);if(errors.length)throw Error(errors.slice(0,12).join('\n'));}
 replace(data,levelId,record=true){
  this.check(data);if(!levelOf(data,levelId))throw Error('Select an existing finite level.');
  if(record){this.past.push(this.state);if(this.past.length>80)this.past.shift();}this.state=deepFreeze({data:clone(data),levelId});this.future=[];this.revision++;
 }
 transact(label,edit){
  const next=clone(this.state);edit(next.data,levelOf(next.data,next.levelId));this.check(next.data);
  if(!levelOf(next.data,next.levelId))throw Error('The active level must exist.');
  if(JSON.stringify(next)===JSON.stringify(this.state))return false;
  this.past.push(this.state);if(this.past.length>80)this.past.shift();this.future=[];this.state=deepFreeze(next);this.revision++;this.lastEdit=label;return true;
 }
 undo(){if(!this.past.length)return false;this.future.push(this.state);this.state=this.past.pop();this.revision++;return true;}
 redo(){if(!this.future.length)return false;this.past.push(this.state);this.state=this.future.pop();this.revision++;return true;}
 selectLevel(id){if(!levelOf(this.state.data,id))throw Error('Unknown level');this.state=deepFreeze({...this.state,levelId:id});}
 add(moduleId,position,{after=null}={}){
  let added;this.transact('Place prefab',(data,level)=>{
   const m=moduleOf(data,moduleId);if(!m)throw Error('Unknown prefab');
   added=uniqueId(moduleId.replace(/^unit-/,''),level.instances);const i={id:added,moduleId,position:position.map(round)};level.instances.push(i);
   if(after){const source=level.instances.find(i=>i.id===after),sm=moduleOf(data,source.moduleId),exit=sm.sockets.find(s=>s.role==='exit'),entry=m.sockets.find(s=>s.role==='entry');
    const from={instanceId:after,socketId:exit.id},to={instanceId:added,socketId:entry.id},at=socketPosition(data,level,from);
    i.position=at.map((v,k)=>round(v-entry.position[k]));
    const outgoing=level.connections.filter(c=>c.from.instanceId===after&&c.from.socketId===exit.id);
    if(outgoing.length>1)throw Error('This exit branches. Use free placement or choose an unbranched insertion point.');
    if(outgoing.length){const next=outgoing[0],newExit={instanceId:added,socketId:m.sockets.find(s=>s.role==='exit').id},end=socketPosition(data,level,newExit),start=socketPosition(data,level,next.to),delta=end.map((v,k)=>v-start[k]);
     const downstream=new Set([next.to.instanceId]);let changed=true;while(changed){changed=false;for(const c of level.connections)if(downstream.has(c.from.instanceId)&&!downstream.has(c.to.instanceId)){downstream.add(c.to.instanceId);changed=true;}}
     if(downstream.has(after))throw Error('Cannot insert into a cyclic connection path.');
     for(const ins of level.instances)if(downstream.has(ins.id))ins.position=ins.position.map((v,k)=>round(v+delta[k]));
     level.connections=level.connections.filter(c=>c!==next);level.connections.push({from:newExit,to:next.to});
    }
    level.connections.push({from,to});
    if(level.finish.instanceId===after)level.finish={instanceId:added,socketId:m.sockets.find(s=>s.role==='exit').id};
   }
  });return added;
 }
 move(ids,dx,dy,{moduleId=null,grid=0}={}){
  this.transact('Move selection',(data,level)=>{
   const list=moduleId?moduleOf(data,moduleId).entities:level.instances;
   for(const e of list.filter(e=>ids.includes(e.id))){if(moduleId)translateEntity(e,dx,dy);else e.position=e.position.map((v,k)=>snap(v+(k?dy:dx),grid));}
  });
 }
 duplicate(ids,{moduleId=null,offset=[2,0]}={}){
  const added=[];this.transact('Duplicate selection',(data,level)=>{
   const m=moduleId?moduleOf(data,moduleId):null,list=m?m.entities:level.instances;
   for(const e of [...list].filter(e=>ids.includes(e.id))){const next=clone(e);next.id=uniqueId(e.id,list);if(m)translateEntity(next,...offset);else next.position=next.position.map((v,k)=>round(v+offset[k]));list.push(next);added.push(next.id);
    if(m)for(const action of [...(m.sceneActions||[])].filter(a=>a.entityId===e.id))m.sceneActions.push({...action,id:uniqueId(action.id,m.sceneActions),entityId:next.id});
   }
  });return added;
 }
 remove(ids,{moduleId=null}={}){
  this.transact('Delete selection',(data,level)=>{
   if(moduleId){const m=moduleOf(data,moduleId);m.entities=m.entities.filter(e=>!ids.includes(e.id));m.sceneActions=(m.sceneActions||[]).filter(a=>!ids.includes(a.entityId));}
   else{if(ids.includes(level.spawn.instanceId)||ids.includes(level.finish.instanceId))throw Error('Move the spawn/finish socket in Level settings before deleting its instance.');
    level.instances=level.instances.filter(i=>!ids.includes(i.id));level.connections=level.connections.filter(c=>!ids.includes(c.from.instanceId)&&!ids.includes(c.to.instanceId));}
  });
 }
 align(ids){
  this.transact('Connect and align sockets',(data,level)=>{
   const ordered=level.instances.filter(i=>ids.includes(i.id)).sort((a,b)=>a.position[0]-b.position[0]);
   for(let n=1;n<ordered.length;n++){const a=ordered[n-1],b=ordered[n],am=moduleOf(data,a.moduleId),bm=moduleOf(data,b.moduleId),exit=am.sockets.find(s=>s.role==='exit'),entry=bm.sockets.find(s=>s.role==='entry');
    if(!exit||!entry)throw Error('Both prefabs need entry and exit sockets.');
    const from={instanceId:a.id,socketId:exit.id},to={instanceId:b.id,socketId:entry.id},at=socketPosition(data,level,from);b.position=at.map((v,k)=>round(v-entry.position[k]));
    level.connections=level.connections.filter(c=>!(c.from.instanceId===a.id&&c.from.socketId===exit.id||c.to.instanceId===b.id&&c.to.socketId===entry.id));level.connections.push({from,to});
   }
  });
 }
 newLevel(id,moduleId){
  if(!/^[a-z][a-z0-9_-]*$/.test(id))throw Error('Use a lowercase level ID.');
  this.transact('New finite level',(data)=>{if(levelOf(data,id))throw Error('Level ID already exists');const m=moduleOf(data,moduleId);data.finiteLevels.push({id,instances:[{id:'start',moduleId,position:[0,0]}],connections:[],spawn:{instanceId:'start',socketId:m.sockets.find(s=>s.role==='entry').id},finish:{instanceId:'start',socketId:m.sockets.find(s=>s.role==='exit').id}});});this.selectLevel(id);
 }
 paintBlock(rect,{moduleId=null}={}){
  if(rect.some(v=>!Number.isFinite(v))||rect[2]<=0||rect[3]<=0)throw Error('Draw a block with positive width and height.');
  let selected;this.transact('Draw terrain block',(data,level)=>{
   if(moduleId){const m=moduleOf(data,moduleId);selected=uniqueId('block',m.entities);m.entities.push({id:selected,kind:'surface',rect:rect.map(round),oneWay:false,vaultable:false,traversal:'auto'});return;}
   const [x,y,w,h]=rect.map(round),existing=data.modules.find(m=>{const e=m.entities[0];return m.tags.includes('brush')&&m.entities.length===1&&e.kind==='surface'&&!e.oneWay&&!e.vaultable&&e.traversal==='auto'&&JSON.stringify(e.rect)===JSON.stringify([0,0,w,h]);});
   let m=existing;
   if(!m){const source=data.modules.find(m=>m.sockets.some(s=>s.role==='entry')&&m.sockets.some(s=>s.role==='exit'));m={id:uniqueId('block',data.modules),tags:['brush','terrain'],difficulty:0,entities:[{id:'body',kind:'surface',rect:[0,0,w,h],oneWay:false,vaultable:false,traversal:'auto'}],sceneActions:[],sockets:clone(source.sockets.slice(0,2)),routes:[{id:'block',entrySocketId:'entry',exitSocketId:'exit',requiredAbilities:[],witnessActions:[],maxTicks:source.routes[0].maxTicks}]};
    m.sockets[0]={...m.sockets[0],id:'entry',role:'entry',position:[-data.rules.runSpeed*data.rules.contextApproachSeconds,0]};m.sockets[1]={...m.sockets[1],id:'exit',role:'exit',position:[w+data.rules.bodySize[0]/2,h]};data.modules.push(m);
   }
   selected=uniqueId('block',level.instances);level.instances.push({id:selected,moduleId:m.id,position:[x,y]});
  });return selected;
 }
 playtest(lab,{fromInstance=null,moduleId=null}={}){
  const data=clone(this.state.data);let level=levelOf(data,this.state.levelId);
  let scaffold=false;
  if(moduleId){const m=moduleOf(data,moduleId);if(!m)throw Error('Unknown prefab');const placed=level.instances.find(i=>i.moduleId===moduleId);
   if(placed){level=clone(level);level.id=uniqueId('prefab-preview',data.finiteLevels);level.spawn={instanceId:placed.id,socketId:m.sockets.find(s=>s.role==='entry').id};level.finish={instanceId:placed.id,socketId:m.sockets.find(s=>s.role==='exit').id};data.finiteLevels.push(level);}
   else{level={id:uniqueId('prefab-preview',data.finiteLevels),instances:[{id:'preview',moduleId,position:[0,0]}],connections:[],spawn:{instanceId:'preview',socketId:m.sockets.find(s=>s.role==='entry').id},finish:{instanceId:'preview',socketId:m.sockets.find(s=>s.role==='exit').id}};
    const box=moduleSpace(data,m),base=m.sockets.find(s=>s.role==='entry').position[1],support=clone(m);support.id=uniqueId('preview-support',data.modules);support.tags=['temporary-preview'];support.sceneActions=[];support.entities=[{id:'floor',kind:'surface',rect:[box[0],base-heightUnit(data),box[2],heightUnit(data)],oneWay:false,vaultable:false}];
    const jump=(m.sceneActions||[]).find(a=>a.kind==='jump');if(jump){const e=m.entities.find(e=>e.id===jump.entityId),start=e.rect[0]+e.rect[2]+jump.startOffset,land=start+data.rules.runSpeed*2*data.rules.jumpVelocity/data.rules.gravity+data.rules.bodySize[0]/4;support.entities=[{...support.entities[0],rect:[box[0],base-heightUnit(data),Math.max(data.rules.collisionSkin,e.rect[0]-box[0]),heightUnit(data)]},{...support.entities[0],id:'landing',rect:[land,base-heightUnit(data),Math.max(data.rules.bodySize[0],box[0]+box[2]-land),heightUnit(data)]}];}
    data.modules.push(support);level.instances.unshift({id:'support',moduleId:support.id,position:[0,0]});data.finiteLevels.push(level);scaffold=true;
   }
  }
  if(fromInstance){const i=level.instances.find(i=>i.id===fromInstance);if(!i)throw Error('Select a start instance');level.spawn={instanceId:i.id,socketId:moduleOf(data,i.moduleId).sockets.find(s=>s.role==='entry').id};}
  this.check(data);const world=compileWorld(data,{levelId:level.id});
  const fallLimit=Math.min(lab.fallLimit,...world.surfaces.map(e=>e.rect[1]-data.rules.bodySize[1]));
  const testLab={...clone(lab),levelId:level.id,fallLimit,stations:[{id:'editor',name:'Draft playtest',range:[world.spawn[0],Math.max(world.spawn[0]+1,world.finish[0])],cueX:world.spawn[0],useLevelSpawn:true,keys:'SPACE / S / E / HOLD Q / F',hint:'Testing an immutable draft snapshot.',checks:[]}],witnesses:[]};
  return deepFreeze({content:data,lab:testLab,scaffold});
 }
}

export function layoutWarnings(data,levelId){
 const level=levelOf(data,levelId),warnings=[];
 for(const c of level.connections){const a=socketPosition(data,level,c.from),b=socketPosition(data,level,c.to);if(Math.hypot(a[0]-b[0],a[1]-b[1])>.025)warnings.push(`${c.from.instanceId} → ${c.to.instanceId}: sockets are separated; select both and Connect & align.`);
  const socket=ref=>{const i=level.instances.find(i=>i.id===ref.instanceId);return moduleOf(data,i.moduleId).sockets.find(s=>s.id===ref.socketId);},from=socket(c.from),to=socket(c.to);
  if(from.role!=='exit'||to.role!=='entry')warnings.push('Connection must run from exit to entry.');
  if(!from.contract.postures.some(p=>to.contract.postures.includes(p))||['vxRange','vyRange'].some(k=>Math.max(from.contract[k][0],to.contract[k][0])>Math.min(from.contract[k][1],to.contract[k][1])))warnings.push(`${c.from.instanceId} → ${c.to.instanceId}: incompatible posture/velocity contracts.`);
 }
 const connected=new Set([level.spawn.instanceId]);let changed=true;while(changed){changed=false;for(const c of level.connections)if(connected.has(c.from.instanceId)&&!connected.has(c.to.instanceId)){connected.add(c.to.instanceId);changed=true;}}
 if(level.connections.length&&!connected.has(level.finish.instanceId))warnings.push('The declared socket graph has no path from spawn to finish. Free scene placement is independent of this graph.');
 if(socketPosition(data,level,level.finish)[0]<=socketPosition(data,level,level.spawn)[0])warnings.push('The automatic forward runner requires finish to the right of spawn.');
 return warnings;
}
