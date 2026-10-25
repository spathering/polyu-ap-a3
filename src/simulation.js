import {compileWorld} from './content.js';
import {clamp,bodyRect,overlaps,moveBody,sweepBody,supportAt,clearBody,lineClear,closestOnCable,cableAt} from './collision.js';
import {detectSceneAction,trajectoryAt} from './scene-actions.js';
import {wallCandidate,mantlePlan} from './scene-traversal.js';
import {prepareScene,sceneAnimation,approachDuration} from './scene-performance.js';
const FREE=new Set(['Run','Airborne']);
const LOW=new Set(['Slide','CrouchHold','Roll']);
export class Simulation{
 constructor(content,lab,{playing=true}={}){
  this.content=content;this.lab=lab;this.rules=content.rules;this.dt=1/this.rules.fixedStepHz;this.world=compileWorld(content,lab);this.coverage={};this.events=[];this.serial=0;this.laps=0;this.failures=0;this.snap=0;this.stationIndex=0;this.reset(0);if(!playing)this.session='Ready';
 }
 mark(id,detail=''){
  this.coverage[id]=(this.coverage[id]||0)+1;this.events.unshift(Object.freeze({id,detail,tick:this.tick,snap:this.snap,serial:++this.serial}));this.events.length=Math.min(this.events.length,this.lab.diagnostics.historySize);
 }
 reset(index=this.stationIndex,reason=''){
  this.stationIndex=clamp(index,0,this.lab.stations.length-1);const station=this.lab.stations[this.stationIndex],[x,y]=station.useLevelSpawn?this.world.spawn:station.spawn;
  this.p={x,y:y+this.rules.collisionSkin,vx:0,vy:0,state:'Run',attachment:null,ledge:null,lowAir:false,slideLeft:0,vault:null,context:null,stateTime:0,landLeft:0,gaitDistance:0};this.pendingAction=null;this.wallJumps=new Set();this.ledgeReadyAt=0;this.rollUntil=-Infinity;
  this.session='Playing';this.reason='';this.time=0;this.tick=0;this.cooldowns={dashGrapple:0,swingGrapple:0};this.padContacts=new Map();this.lastGround=0;this.jumpUntil=-Infinity;this.phase='';this.wallTime=0;this.snap++;this.sceneMatches=new Map();this.performance=null;this.sceneShot=null;this.lastSceneOutcome=null;this.sceneSerial=0;this.preparedMantle=null;
  if(reason==='retry')this.mark('Retry',this.lab.stations[this.stationIndex].name);
 }
 retry(){this.reset(this.currentStationIndex(),'retry');}
 pause(reason='Paused by player'){
  if(this.session!=='Playing')return;this.session='Paused';this.reason=reason;this.jumpUntil=-Infinity;this.rollUntil=-Infinity;this.pendingAction=null;for(const s of this.sceneMatches.values())if(s.status==='confirmed'){s.status='matched';s.outcome=null;}this.mark('Paused',reason);
 }
 resume(){if(this.session==='Paused'||this.session==='Ready'){this.session='Playing';this.reason='';this.jumpUntil=-Infinity;}}
 fail(reason){if(this.session!=='Playing')return;this.session='Failed';this.reason=reason;this.failures++;this.p.attachment=null;this.p.ledge=null;this.p.vault=null;this.p.context=null;this.pendingAction=null;this.jumpUntil=-Infinity;this.mark('Failed',reason);}
 currentStationIndex(){const x=this.p.x;const i=this.lab.stations.findIndex(s=>x>=s.range[0]&&x<s.range[1]);return i<0?this.stationIndex:i;}
 bodySize(){return LOW.has(this.p.state)||this.p.lowAir||this.p.state==='Vault'?this.rules.slideBodySize:this.rules.bodySize;}
 grip(){return [this.p.x+this.rules.gripOffset[0],this.p.y+this.rules.gripOffset[1]];}
 center(){return [this.p.x,this.p.y+this.bodySize()[1]/2];}
 transition(state){if(this.p.state!==state){this.p.state=state;this.p.stateTime=0;if(['Run','Slide','CrouchHold','Vault','DashGrapple','SwingGrapple','Zipline'].includes(state))this.mark(state);}}
 reject(detail){this.mark('Rejected',detail);return false;}
 preview(kind){
  if(kind==='jump'&&this.p.state==='LedgeHang')return mantlePlan(this.world,this.p,this.rules)?{id:this.p.ledge.id,point:this.p.context.contact}:null;
  const marker=detectSceneAction(this.world,this.p,kind,{rules:this.rules,allowLocked:true,preferredId:this.pendingAction?.markerId});
  if(marker&&this.rules.enabledAbilities.includes(marker.kind)&&!(this.cooldowns[kind]>0)&&!['done','missed'].includes(this.sceneMatches.get(marker.id)?.status))return {id:marker.entityId,markerId:marker.id,point:marker.point,ready:this.p.x>=marker.startX};
  if(kind==='jump'){const wall=wallCandidate(this.world,this.p,this.rules,'wallJump',this.wallJumps);if(wall)return {id:wall.id,kind:'wallJump',point:[wall.rect[0],this.p.y+this.rules.bodySize[1]/2]};const ledge=this.time>=this.ledgeReadyAt?wallCandidate(this.world,this.p,this.rules,'ledgeGrab'):null;return ledge?{id:ledge.id,kind:'ledgeGrab',point:[ledge.rect[0],ledge.rect[1]+ledge.rect[3]]}:null;}
  if(kind==='slide')return null;
  return this.previewTarget(kind);
 }
 previewTarget(kind,targetId=null){
  const p=this.p,r=this.rules,origin=kind==='swingGrapple'?this.grip():this.center();if(!FREE.has(p.state)||!r.enabledAbilities.includes(kind)||this.cooldowns[kind]>0)return null;
  if(kind==='zipline'){
   const grip=this.grip(),choices=[];
   for(const e of this.world.cables){if(targetId&&e.id!==targetId)continue;const hit=closestOnCable(grip,e);if(hit.distance<=e.profile.captureRadius){const target={x:hit.at[0]-r.gripOffset[0],y:hit.at[1]-r.gripOffset[1]};if(clearBody(target,r.bodySize,this.world.surfaces)&&!sweepBody(p,r.bodySize,target.x-p.x,target.y-p.y,this.world.surfaces,r.collisionSkin))choices.push({id:e.id,entity:e,point:hit.at,s:hit.s,distance:hit.distance});}}
   return choices.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id))[0]||null;
  }
  const choices=[];
  for(const e of this.world.anchors){if(e.profile.kind!==kind||targetId&&e.id!==targetId)continue;const dx=e.position[0]-origin[0],dy=e.position[1]-origin[1],distance=Math.hypot(dx,dy),angle=Math.abs(Math.atan2(dy,dx)),f=e.profile;if(distance>f.range||angle>f.coneRadians/2||!lineClear(origin,e.position,this.world.surfaces))continue;if(kind==='swingGrapple'&&(distance<f.minLength||distance>f.maxLength))continue;choices.push({id:e.id,entity:e,point:e.position,distance,angle});}
  return choices.sort((a,b)=>a.angle-b.angle||a.distance-b.distance||a.id.localeCompare(b.id))[0]||null;
 }
 acquire(kind,command){
  const target=this.previewTarget(kind,command.targetId);if(!target||('targetId'in command&&command.targetId!==target.id))return this.reject(`${kind}: no matching clear preview target`);
  const again=this.previewTarget(kind,target.id);if(!again||again.id!==target.id)return this.reject('Target changed before commit');
  const e=target.entity,p=this.p;
  if(kind==='zipline'){
   p.x=target.point[0]-this.rules.gripOffset[0];p.y=target.point[1]-this.rules.gripOffset[1];p.vx=p.vy=0;p.attachment={kind,id:e.id,s:target.s};this.transition('Zipline');
  }else{
   p.attachment={kind,id:e.id,length:target.distance};this.cooldowns[kind]=e.profile.cooldownSeconds;this.transition(kind==='dashGrapple'?'DashGrapple':'SwingGrapple');
  }
  p.lowAir=false;this.jumpUntil=-Infinity;return true;
 }
 detach(reason,jump=false){
  const p=this.p,a=p.attachment;if(!a)return;const e=this.world.entities.find(e=>e.id===a.id);
  if(a.kind==='zipline'&&e){const {tangent}=cableAt(e,a.s);p.vx=tangent[0]*e.profile.speed;p.vy=tangent[1]*e.profile.speed+(jump?e.profile.exitJumpVelocity:0);this.mark(jump?'ZiplineJump':reason==='endpoint'?'ZiplineEnd':'ZiplineRelease',reason);}
  else this.mark(a.kind==='swingGrapple'?'SwingRelease':'DashRelease',reason);
  p.attachment=null;p.context=null;this.jumpUntil=-Infinity;this.transition('Airborne');
 }
 dropLedge(reason){const p=this.p,t=this.rules.sceneTraversal;p.ledge=null;p.context=null;[p.vx,p.vy]=t.dropVelocity;this.ledgeReadyAt=this.time+t.regrabSeconds;this.transition('Airborne');this.mark('LedgeDrop',reason);}
 beginMantle(){const plan=this.preparedMantle||mantlePlan(this.world,this.p,this.rules);if(!plan)return this.reject('Ledge top or mantle path is blocked');this.p.vault=structuredClone(plan);this.p.ledge=null;this.p.context={kind:'mantle',contact:[...this.p.context.contact],progress:0};this.manualShot('climb',plan.start,plan.exit,plan.duration);this.transition('Vault');this.mark('Mantle',plan.id);return true;}
 wallJump(){const e=wallCandidate(this.world,this.p,this.rules,'wallJump',this.wallJumps);if(!e)return false;this.finishPerformance();this.wallJumps.add(e.id);[this.p.vx,this.p.vy]=this.rules.sceneTraversal.wallJumpVelocity;this.p.context={kind:'wallJump',contact:[e.rect[0],this.p.y+this.rules.bodySize[1]/2]};this.manualShot('jump',[this.p.x,this.p.y],[this.p.x,this.p.y],2*this.p.vy/this.rules.gravity);this.jumpUntil=-Infinity;this.lastGround=-Infinity;this.mark('WallJump',e.id);return true;}
 manualShot(kind,start,exit,duration){
  const recipe=this.content.scenePerformances?.find(p=>p.id===this.rules.performanceByKind?.[kind]);if(!recipe)return;
  this.sceneShot={key:`${this.snap}/manual/${++this.sceneSerial}`,manual:true,kind,bodyHalf:this.rules.bodySize[0]/2,start:[...start],exit:[...exit],focusY:start[1]+this.rules.bodySize[1]/2,endY:exit[1]-start[1],duration,camera:structuredClone(recipe.camera),referenceSpeed:this.rules.runSpeed,startedAt:this.time,matchedAt:this.time,phase:'playing'};
 }
 finishPerformance(){if(this.performance){const s=this.sceneMatches.get(this.performance.markerId);if(s)s.status='done';this.performance=null;if(this.sceneShot)this.sceneShot={...this.sceneShot,phase:'recovery',endedAt:this.time};}}
 prepareScenes(){
  for(const action of ['jump','slide','dashGrapple','swingGrapple','zipline']){
   const m=detectSceneAction(this.world,this.p,action,{rules:this.rules,allowLocked:true,preferredId:this.pendingAction?.markerId});
   if(!m?.performance||!this.rules.enabledAbilities.includes(m.kind)||this.sceneMatches.has(m.id))continue;
   const scene=prepareScene(this.world,m,this.p,this.rules,this.time);if(scene){this.sceneMatches.set(m.id,scene);this.mark('SceneMatched',`${m.id}: waiting for ${m.input}`);if(!this.sceneShot){const speed=Math.max(0,this.p.vx),acceleration=this.p.state==='Run'?this.rules.groundAcceleration:speed>this.rules.runSpeed?0:this.rules.airAcceleration;this.sceneShot={...scene.variants.timely.shot,key:`${this.snap}/match/${m.id}`,phase:'approach',startedAt:this.time,matchedAt:this.time,approachStart:[this.p.x,this.p.y],approachSpeed:speed,approachAcceleration:acceleration,approachSeconds:Math.max(this.dt,approachDuration(Math.max(0,m.startX-this.p.x),speed,acceleration,this.rules.runSpeed))};}}
  }
 }
 beginPerformance(scene,outcome){
  const variant=scene.variants[outcome];scene.status=outcome==='missed'?'missed':'playing';scene.outcome=outcome;
  this.performance={id:++this.sceneSerial,markerId:scene.markerId,kind:scene.kind,outcome,elapsed:0,duration:variant.duration,spec:variant.spec};
  this.sceneShot={...variant.shot,key:`${this.snap}/${this.sceneSerial}`,startedAt:this.time,matchedAt:scene.matchedAt,phase:'playing'};
  this.lastSceneOutcome={markerId:scene.markerId,outcome,tick:this.tick};this.mark('SceneOutcome',`${scene.markerId}: ${outcome}`);
  this.mark({timely:'SceneTimely',late:'SceneLate',missed:'SceneMissed'}[outcome],scene.markerId);
 }
 missScene(scene){
  if(scene.marker.required===false){scene.status='done';scene.outcome='missed';if(this.sceneShot?.id===scene.markerId)this.sceneShot={...this.sceneShot,phase:'recovery',endedAt:this.time};this.mark('SceneBypassed',scene.markerId);return;}
  this.pendingAction=null;this.beginPerformance(scene,'missed');
  if(scene.kind!=='jump'){
   const p=this.p,e=this.world.entities.find(e=>e.id===scene.marker.entityId),exit=e.rect?[e.rect[0]-this.rules.bodySize[0]/2-this.rules.collisionSkin,p.y]:[p.x+this.rules.runSpeed*.2,p.y];
   p.stumble={start:[p.x,p.y],exit};p.attachment=null;p.ledge=null;p.vault=null;p.context={kind:'missed',markerId:scene.markerId};this.transition('SceneFailure');
  }
 }
 updateScenePlayback(){
  if(this.performance){const a=this.performance;a.elapsed=Math.min(a.duration,a.elapsed+this.dt);
   if(a.elapsed>=a.duration-1e-9&&a.kind==='swingGrapple'&&this.p.state==='SwingGrapple')this.detach('authored scene exit');
   if(a.elapsed>=a.duration-1e-9||this.p.state==='LedgeHang'||a.outcome!=='missed'&&(a.kind==='swingGrapple'&&this.p.state!=='SwingGrapple'||a.kind==='zipline'&&this.p.state!=='Zipline')){
    const scene=this.sceneMatches.get(a.markerId);if(scene)scene.status='done';this.sceneShot={...this.sceneShot,phase:'recovery',endedAt:this.time};this.performance=null;
    if(a.outcome==='missed')this.fail(`Missed ${a.kind} input window`);
   }
  }else if(this.sceneShot?.manual&&this.sceneShot.phase==='playing'&&this.time-this.sceneShot.startedAt>=this.sceneShot.duration)this.sceneShot={...this.sceneShot,phase:'recovery',endedAt:this.time};
  else if(this.sceneShot?.phase==='recovery'&&this.time-this.sceneShot.endedAt>this.sceneShot.camera.releaseSeconds)this.sceneShot=null;
 }
 tryVault(marker,prepared=null){
  const p=this.p,r=this.rules,climb=marker?.kind==='climb',kind=climb?'climb':'vault';if(p.state!=='Run'||!r.enabledAbilities.includes(kind))return false;
  if(prepared){p.vault=structuredClone(prepared);p.context={markerId:marker.id,kind,contact:[this.world.surfaces.find(e=>e.id===marker.entityId).rect[0]+r.collisionSkin,p.vault.height+p.vault.start[1]-r.collisionSkin*2],progress:0};this.transition('Vault');if(climb)this.mark('Climb',marker.entityId);return true;}
  const b=r.slideBodySize,block=this.world.surfaces.find(e=>e.id===marker?.entityId&&(climb||e.vaultable||e.traversal==='auto'));if(!block)return false;
  const [x,y,w,h]=block.rect,top=y+h,exitX=x+(climb?0:w)+b[0]/2+r.collisionSkin*3;
  if(top-p.y>(climb?r.climbMaxHeight:r.vaultMaxHeight)+r.collisionSkin||top<=p.y||(!climb&&w>r.vaultMaxWidth)||climb&&w<b[0]+r.collisionSkin*3)return false;
  const support=supportAt({x:exitX,y:climb?top+r.collisionSkin:p.y},b,this.world.surfaces,r.groundProbeDistance);if(!support)return false;
  const endY=support.rect[1]+support.rect[3]+r.collisionSkin,start=[p.x,p.y],height=top-p.y+r.collisionSkin*2,knots=climb?r.climbTrajectory:r.vaultTrajectory;
  const points=knots.map(([,u,v])=>[start[0]+(exitX-start[0])*u,climb?start[1]+(endY-start[1])*v:start[1]+(endY-start[1])*u+height*v]);
  for(let i=1;i<points.length;i++){const a={x:points[i-1][0],y:points[i-1][1]},z=points[i];if(!clearBody({x:z[0],y:z[1]},b,this.world.surfaces)||sweepBody(a,b,z[0]-a.x,z[1]-a.y,this.world.surfaces,r.collisionSkin))return false;}
  p.vault={id:block.id,points,start,exit:[exitX,endY],height,elapsed:0,kind,entryVx:p.vx,duration:climb?r.climbDurationSeconds:r.vaultDurationSeconds};p.context={markerId:marker.id,kind,contact:[x+r.collisionSkin,top],progress:0};this.transition('Vault');if(climb)this.mark('Climb',block.id);return true;
 }
 queueContext(command){
  const marker=detectSceneAction(this.world,this.p,command.action,{rules:this.rules,allowLocked:true,preferredId:this.pendingAction?.markerId});if(!marker||!this.rules.enabledAbilities.includes(marker.kind))return false;
  if(command.markerId&&command.markerId!==marker.id||'targetId'in command&&command.targetId!==marker.entityId){this.reject('Scene action target changed');return true;}
  if(marker.performance){
   let scene=this.sceneMatches.get(marker.id);if(!scene){scene=prepareScene(this.world,marker,this.p,this.rules,this.time);if(!scene){this.reject('Scene preset does not fit the approach or exit');return true;}this.sceneMatches.set(marker.id,scene);}
   if(['done','missed','playing'].includes(scene.status))return true;
   if(scene.status==='confirmed'&&this.pendingAction?.markerId===marker.id)return true;
   const prior=this.world.sceneActions.find(m=>m.id===this.pendingAction?.markerId);if(this.pendingAction?.queuedTick===this.tick&&(prior?.priority??-Infinity)>=marker.priority)return true;
   const outcome=this.p.x<=marker.startX+scene.recipe.timelyEndOffset?'timely':'late';scene.status='confirmed';scene.outcome=outcome;scene.confirmedAt=this.time;
   this.pendingAction={markerId:marker.id,action:command.action,expiresAt:Infinity,queuedTick:this.tick,previousX:this.p.x,performanceOutcome:outcome};this.mark('ActionQueued',`${marker.id}: ${outcome}`);return true;
  }
  const prior=this.world.sceneActions.find(m=>m.id===this.pendingAction?.markerId);
  if(this.pendingAction?.queuedTick===this.tick&&(prior?.priority??-Infinity)>=marker.priority)return true;
  if(!this.pendingAction||this.pendingAction.markerId!==marker.id){this.pendingAction={markerId:marker.id,action:command.action,expiresAt:this.time+this.rules.contextInputSeconds,queuedTick:this.tick,previousX:this.p.x};this.mark('ActionQueued',marker.id);}
  return true;
 }
 commitContext(held){
  const pending=this.pendingAction;if(!pending)return false;const original=this.world.sceneActions.find(m=>m.id===pending.markerId),scene=this.sceneMatches.get(pending.markerId),variant=pending.performanceOutcome?scene?.variants[pending.performanceOutcome]:null,marker=variant?{...original,startX:variant.start[0]}:original,p=this.p;
  const crossed=marker&&pending.previousX<marker.startX&&p.x>=marker.startX;pending.previousX=p.x;
  const finishing=p.state==='Vault'&&p.vault&&p.vault.duration-p.vault.elapsed<=this.rules.actionChainWindowSeconds;
  if(!marker||this.time>pending.expiresAt||p.x>marker.startX+marker.lateDistance&&!crossed||p.y<marker.minY||p.y>marker.maxY||!FREE.has(p.state)&&!finishing||pending.action==='swingGrapple'&&!held.has('swingGrapple')){this.pendingAction=null;if(scene?.status==='confirmed'){scene.status='matched';scene.outcome=null;}this.mark('ActionCancelled','Expired, released or no longer eligible');return false;}
  if(finishing)return false;
  if(p.x<marker.startX)return false;
  if(['jump','slide','vault','climb'].includes(marker.kind)&&p.state!=='Run')return false;
  if(['dashGrapple','swingGrapple','zipline'].includes(marker.kind)&&!this.previewTarget(marker.kind,marker.entityId))return false;
  if(['jump','slide','vault','climb'].includes(marker.kind)&&p.x!==marker.startX){const dx=marker.startX-p.x;if(sweepBody(p,this.bodySize(),dx,0,this.world.surfaces,this.rules.collisionSkin))return false;this.applyMove(dx,0);}
  this.pendingAction=null;let ok=false;
  if(marker.kind==='vault'||marker.kind==='climb')ok=this.tryVault(marker,variant?.plan);
  else if(marker.kind==='slide'){p.slideLeft=this.rules.slideSeconds;this.transition('Slide');p.context={markerId:marker.id,kind:'slide'};ok=true;}
  else if(marker.kind==='jump'){p.vy=this.rules.jumpVelocity*(pending.performanceOutcome==='late'?scene.recipe.lateJumpScale:1);if(variant)p.vx=this.rules.runSpeed;p.lowAir=false;this.jumpUntil=-Infinity;this.lastGround=-Infinity;this.transition('Airborne');this.mark('Jump');ok=true;}
  else{ok=this.acquire(marker.kind,{targetId:marker.entityId});if(ok)p.context={markerId:marker.id,kind:marker.kind};}
  if(ok&&variant)this.beginPerformance(scene,pending.performanceOutcome);
  this.mark(ok?'ActionAligned':'ActionCancelled',marker.id);return ok;
 }
 applyMove(dx,dy){
  const p=this.p,raw=this.world.sceneActions.find(m=>m.id===this.pendingAction?.markerId),scene=this.sceneMatches.get(raw?.id),marker=raw&&this.pendingAction.performanceOutcome?{...raw,startX:scene.variants[this.pendingAction.performanceOutcome].start[0]}:raw;
  // Land exactly on the entry plane instead of overshooting and snapping back.
  if(marker&&p.state==='Run'&&['jump','slide','vault','climb'].includes(marker.kind)&&dx>0&&p.x<marker.startX&&p.x+dx>=marker.startX)dx=marker.startX-p.x;
  if(p.state==='Run'&&dx>0)for(const s of this.sceneMatches.values()){const limit=s.marker.startX+s.marker.lateDistance;if(s.status==='matched'&&s.marker.required!==false&&p.x<limit&&p.x+dx>=limit)dx=Math.min(dx,limit-p.x);}
  const before={x:p.x,y:p.y},out=moveBody(p,this.bodySize(),dx,dy,this.world.surfaces,this.rules.collisionSkin);p.x=out.x;p.y=out.y;
  for(const c of out.contacts){if(c.normal[0]){p.vx=0;this.wallHit=true;}if(c.normal[1])p.vy=0;}
  this.segments.push({before,after:{x:p.x,y:p.y}});return out;
 }
 step(input={}){
  let commands=(input.pressed||[]).map(v=>typeof v==='string'?{action:v}:v);const has=a=>commands.find(c=>c.action===a),held=new Set(input.held||[]),released=new Set(input.released||[]);
  if(has('pause')){this.session==='Paused'?this.resume():this.pause();return;}
  if(has('retry')){this.retry();return;}
  if(this.session!=='Playing')return;
  const p=this.p,r=this.rules,dt=this.dt,wasState=p.state,wasGround=['Run','Slide','CrouchHold','Roll'].includes(wasState),oldY=p.y,oldX=p.x;
  this.tick++;this.time+=dt;p.stateTime+=dt;p.landLeft=Math.max(0,p.landLeft-dt);this.segments=[];this.wallHit=false;
  this.prepareScenes();
  if(this.performance?.spec.lockInput&&this.performance.duration-this.performance.elapsed>r.actionChainWindowSeconds)commands=commands.filter(c=>c.action==='jump'&&wallCandidate(this.world,p,r,'wallJump',this.wallJumps));
  if(!this.performance&&!this.pendingAction)for(const s of this.sceneMatches.values())if(s.status==='matched'&&p.x>=s.marker.startX+s.marker.lateDistance-1e-9&&!commands.some(c=>c.action===s.input)){this.missScene(s);break;}
  for(const k of Object.keys(this.cooldowns))this.cooldowns[k]=Math.max(0,this.cooldowns[k]-dt);
  const support=supportAt(p,this.bodySize(),this.world.surfaces,r.groundProbeDistance);
  if(wasGround){if(support){p.y=support.rect[1]+support.rect[3]+r.collisionSkin;this.lastGround=this.time;}else{p.lowAir=LOW.has(p.state);this.transition('Airborne');}}
  if(p.lowAir&&clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding))p.lowAir=false;
  const wasAttached=!!p.attachment;
  if(p.state==='SwingGrapple'&&(!held.has('swingGrapple')||released.has('swingGrapple')))this.detach('hold released');
  if(p.state==='Zipline'&&(has('jump')||has('zipline')))this.detach(has('jump')?'jump':'toggle',!!has('jump'));
  let committed=wasAttached&&p.attachment===null;
  if(p.state==='LedgeHang'){
   committed=true;if(has('slide'))this.dropLedge('deliberate drop');else if(has('jump'))this.beginMantle();else if(p.stateTime>=r.sceneTraversal.maxHangSeconds)this.dropLedge('hang timeout');
  }
  if(!committed){commands=commands.filter(c=>c.action==='swingGrapple'&&!held.has('swingGrapple')||!this.queueContext(c));committed=this.commitContext(held);}
  if(this.pendingAction)commands=[];
  if(!committed){for(const kind of ['swingGrapple','dashGrapple','zipline'])if(has(kind)){if(kind==='swingGrapple'&&!held.has(kind))continue;if(!FREE.has(p.state)){this.reject(`${kind}: detach or leave low/vault state first`);continue;}if(this.acquire(kind,has(kind))){committed=true;break;}}}
  if(!committed&&has('jump')&&p.state==='Airborne'&&this.wallJump())committed=true;
  if(!committed&&has('jump')&&!wasAttached&&(FREE.has(p.state)||p.state==='Roll'&&p.slideLeft<=r.jumpBufferSeconds)&&r.enabledAbilities.includes('jump'))this.jumpUntil=this.time+r.jumpBufferSeconds;
  if(!committed&&FREE.has(p.state)&&this.jumpUntil>=this.time&&(p.state==='Run'||this.time-this.lastGround<=r.coyoteSeconds)){
   p.vy=r.jumpVelocity;p.lowAir=false;this.jumpUntil=-Infinity;this.lastGround=-Infinity;this.transition('Airborne');this.mark('Jump');committed=true;
  }
  if(!committed&&has('slide')){
   if(p.state==='Airborne'&&r.sceneTraversal&&r.enabledAbilities.includes('roll')){this.rollUntil=this.time+r.sceneTraversal.rollBufferSeconds;this.mark('RollQueued');committed=true;}
   else if(p.state==='Run'&&r.enabledAbilities.includes('slide')){p.slideLeft=r.slideSeconds;this.transition('Slide');committed=true;}else this.reject('Slide requires grounded running');
  }
  if(p.state==='Slide'){p.slideLeft-=dt;if(p.slideLeft<=0){if(clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding)){this.transition('Run');this.mark('Stand');}else this.transition('CrouchHold');}}
  if(p.state==='CrouchHold'&&clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding)){this.transition('Run');this.mark('Stand');}
  if(p.state==='Roll'){p.slideLeft-=dt;if(p.slideLeft<=0){this.transition(clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding)?'Run':'CrouchHold');this.mark('RollEnd');}}
  const impactVy=p.vy;
  if(p.state==='SceneFailure'){const a=this.performance,u=Math.min(1,(a.elapsed+dt)/a.duration),q=u<.45?u/.45:1-(u-.45)/.55*.2,at=p.stumble;p.vx=0;p.vy=0;this.applyMove(at.start[0]+(at.exit[0]-at.start[0])*q-p.x,0);}
  else if(p.state==='LedgeHang'){p.vx=p.vy=0;}
  else if(p.state==='Vault'){
   const v=p.vault,old=v.elapsed,climbing=['climb','mantle'].includes(v.kind),knots=v.kind==='mantle'?r.sceneTraversal.mantleTrajectory:v.kind==='climb'?r.climbTrajectory:r.vaultTrajectory;v.elapsed=Math.min(v.duration,v.elapsed+dt);
   const sample=t=>{const [x,y]=trajectoryAt(knots,clamp(t/v.duration,0,1));return[v.start[0]+(v.exit[0]-v.start[0])*x,climbing?v.start[1]+(v.exit[1]-v.start[1])*y:v.start[1]+(v.exit[1]-v.start[1])*x+v.height*y];};
   const cuts=knots.slice(1,-1).map(k=>k[0]*v.duration).filter(t=>t>old&&t<v.elapsed);cuts.push(v.elapsed);p.context.progress=v.elapsed/v.duration;
   for(const t of cuts){const at=sample(t),out=this.applyMove(at[0]-p.x,at[1]-p.y);if(out.contacts.length){p.vault=null;p.context=null;this.transition('Airborne');this.reject('Vault path blocked');break;}}
   if(p.vault){p.vx=(p.x-oldX)/dt;p.vy=(p.y-oldY)/dt;}
   if(p.vault&&v.elapsed>=v.duration-1e-9){p.vault=null;p.context=null;p.vx=Math.max(r.vaultExitSpeed,v.entryVx);p.vy=0;p.landLeft=r.landingRecoverySeconds;this.transition(clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding)?'Run':'CrouchHold');this.mark('Land',`${v.kind} exit`);}
  }else if(p.state==='DashGrapple'){
   const e=this.world.anchors.find(e=>e.id===p.attachment.id);if(!e)this.detach('missing anchor');else{
    const c=this.center(),dx=e.position[0]-c[0],dy=e.position[1]-c[1],distance=Math.hypot(dx,dy),f=e.profile,travel=Math.min(Math.max(0,distance-f.arrivalRadius),f.speed*dt),nx=dx/distance||0,ny=dy/distance||0;
    p.vx=nx*f.speed;p.vy=ny*f.speed;const out=this.applyMove(nx*travel,ny*travel);
    if(out.contacts.length||distance-travel<=f.arrivalRadius+1e-6){p.vx=nx*f.exitSpeed;p.vy=ny*f.exitSpeed;this.detach(out.contacts.length?'blocked':'arrival');}
   }
  }else if(p.state==='Zipline'){
   const a=p.attachment,e=this.world.cables.find(e=>e.id===a.id);if(!e)this.detach('missing cable');else{
    const next=Math.min(e.totalLength,a.s+e.profile.speed*dt);let boundary=0;const cuts=[];for(const len of e.lengths){boundary+=len;if(boundary>a.s&&boundary<next)cuts.push(boundary);}cuts.push(next);
    for(const s of cuts){const {at,tangent}=cableAt(e,s),out=this.applyMove(at[0]-r.gripOffset[0]-p.x,at[1]-r.gripOffset[1]-p.y);a.s=s;p.vx=tangent[0]*e.profile.speed;p.vy=tangent[1]*e.profile.speed;if(out.contacts.length){this.detach('cable blocked');break;}}
    if(p.attachment&&a.s>=e.totalLength-1e-8)this.detach('endpoint');
   }
  }else{
   const isSwing=p.state==='SwingGrapple';
   if(this.performance?.kind==='slide')p.vx=r.runSpeed/this.performance.spec.durationScale;
   else if(!isSwing){const accel=(p.state==='Airborne'?r.airAcceleration:r.groundAcceleration)*dt;if(p.vx<r.runSpeed)p.vx=Math.min(r.runSpeed,p.vx+accel);else if(p.state!=='Airborne')p.vx=Math.max(r.runSpeed,p.vx-accel);}
   p.vy=Math.max(-r.maxFallSpeed,p.vy-r.gravity*dt);p.vx=clamp(p.vx,-r.maxHorizontalSpeed,r.maxHorizontalSpeed);
   if(isSwing){const e=this.world.anchors.find(e=>e.id===p.attachment?.id),speed=Math.hypot(p.vx,p.vy);if(e&&speed>e.profile.maxSpeed){p.vx*=e.profile.maxSpeed/speed;p.vy*=e.profile.maxSpeed/speed;}}
   let dx=p.vx*dt,dy=p.vy*dt;
   if(isSwing){const a=p.attachment,e=this.world.anchors.find(e=>e.id===a.id);if(!e||!lineClear(this.grip(),e.position,this.world.surfaces))this.detach('blocked or missing tether');else{
    const center=[p.x+dx+r.gripOffset[0],p.y+dy+r.gripOffset[1]],rx=center[0]-e.position[0],ry=center[1]-e.position[1],distance=Math.hypot(rx,ry);
    if(distance>a.length){const nx=rx/distance,ny=ry/distance,radial=p.vx*nx+p.vy*ny;if(radial>0){p.vx-=radial*nx;p.vy-=radial*ny;}dx=e.position[0]+nx*a.length-r.gripOffset[0]-p.x;dy=e.position[1]+ny*a.length-r.gripOffset[1]-p.y;}
    const speed=Math.hypot(p.vx,p.vy);if(speed>e.profile.maxSpeed){p.vx*=e.profile.maxSpeed/speed;p.vy*=e.profile.maxSpeed/speed;}
   }}
   const out=this.applyMove(dx,dy);if(p.state==='SwingGrapple'&&out.contacts.length)this.detach('body contact');
  }
  // Every moved segment participates in lethal sweeps before pad/landing/lap effects.
  const lethal=this.world.hazards.find(e=>overlaps(bodyRect(p,this.bodySize()),e.rect)||this.segments.some(s=>sweepBody(s.before,this.bodySize(),s.after.x-s.before.x,s.after.y-s.before.y,[e],r.collisionSkin)));
  if(lethal||p.y<this.lab.fallLimit){this.fail(lethal?'Hazard contact':'Fell below the course');return;}
  if(p.x>=this.world.finish[0]){if(this.lab.completionMode==='finish'){this.session='Completed';this.pendingAction=null;this.jumpUntil=-Infinity;this.mark('Completed','Finish reached');return;}this.laps++;this.mark('Lap',`Lap ${this.laps}: return gate`);this.reset(0);return;}
  let launched=false;
  for(const e of this.world.pads){
   const [x,y,w,h]=e.rect,top=y+h,contact=p.x+r.bodySize[0]/2>x&&p.x-r.bodySize[0]/2<x+w&&p.y<=top+r.groundProbeDistance&&oldY>=top-r.collisionSkin*2&&p.vy<=0;
   const lock=this.padContacts.get(e.id)||{touching:false,readyAt:0};
   const marker=this.world.sceneActions.find(m=>m.kind==='jumpPad'&&m.entityId===e.id),aligned=!marker||p.x>=marker.startX;
   if(contact&&aligned&&!lock.touching&&this.time>=lock.readyAt&&!p.attachment&&p.state!=='Vault'&&r.enabledAbilities.includes('jumpPad')){const v=e.profile.launchVelocity;if(e.profile.velocityPolicy==='replace')[p.vx,p.vy]=v;else{p.vx+=v[0];p.vy+=v[1];}p.lowAir=false;this.jumpUntil=-Infinity;this.lastGround=-Infinity;this.transition('Airborne');this.mark('JumpPad',e.id);lock.readyAt=this.time+e.profile.rearmSeconds;launched=true;}
   lock.touching=contact&&aligned;this.padContacts.set(e.id,lock);
  }
  if(!launched&&!p.attachment&&!['Vault','LedgeHang'].includes(p.state)){
   const ground=supportAt(p,this.bodySize(),this.world.surfaces,r.groundProbeDistance);
   if(ground&&p.vy<=0){p.y=ground.rect[1]+ground.rect[3]+r.collisionSkin;p.vy=0;this.lastGround=this.time;this.wallJumps.clear();if(p.state==='Airborne'){const canStand=clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding),roll=r.sceneTraversal&&r.enabledAbilities.includes('roll')&&this.rollUntil>=this.time&&Math.abs(impactVy)>=r.sceneTraversal.rollMinImpact;p.lowAir=false;p.context=null;this.transition(roll?'Roll':canStand?'Run':'CrouchHold');if(roll){p.slideLeft=r.sceneTraversal.rollSeconds;p.vx=Math.max(p.vx,r.sceneTraversal.rollSpeed);this.manualShot('slide',[p.x,p.y],[p.x+r.runSpeed*p.slideLeft,p.y],p.slideLeft);this.mark('Roll');}this.rollUntil=-Infinity;p.landLeft=r.landingRecoverySeconds;this.mark('Land',`impact ${Math.abs(impactVy).toFixed(1)} m/s`);}}
   else if(['Run','Slide','CrouchHold'].includes(p.state)){p.lowAir=LOW.has(p.state);this.transition('Airborne');}
  }
  if(p.state==='Airborne'&&held.has('jump')&&this.time>=this.ledgeReadyAt){const e=wallCandidate(this.world,p,r,'ledgeGrab');if(e){const at=[e.rect[0]-r.bodySize[0]/2-r.collisionSkin,e.rect[1]+e.rect[3]-r.sceneTraversal.hangGripHeight];this.applyMove(at[0]-p.x,at[1]-p.y);p.vx=p.vy=0;p.ledge={id:e.id};p.context={kind:'ledge',contact:[e.rect[0],e.rect[1]+e.rect[3]]};this.pendingAction=null;this.jumpUntil=-Infinity;this.finishPerformance();this.preparedMantle=mantlePlan(this.world,p,r);this.manualShot('climb',[p.x,p.y],[p.x,p.y],r.sceneTraversal.maxHangSeconds);this.transition('LedgeHang');this.mark('LedgeGrab',e.id);}}
  if(p.state==='Airborne'||p.state==='SwingGrapple'){const phase=p.vy>0?'Rise':'Fall';if(phase!==this.phase){this.mark(phase);this.phase=phase;}}else this.phase='';
  if(p.state==='Run'&&!this.coverage.Run)this.mark('Run');
  if(p.state==='Run')p.context=null;
  this.updateScenePlayback();
  if(p.state==='Run'||LOW.has(p.state))p.gaitDistance+=Math.abs(p.x-oldX);
  this.wallTime=this.wallHit?this.wallTime+dt:0;if(this.wallTime>=this.lab.diagnostics.wallWarningSeconds){this.reject('Wall ahead: jump or retry station');this.wallTime=-this.lab.diagnostics.wallWarningSeconds;}
  p.vx=clamp(p.vx,-r.maxHorizontalSpeed,r.maxHorizontalSpeed);p.vy=clamp(p.vy,-r.maxFallSpeed,r.maxFallSpeed);
  if(![p.x,p.y,p.vx,p.vy].every(Number.isFinite))this.fail('Invalid numeric motion state');
 }
 snapshot(){
  const p=this.p,targets={};for(const kind of ['dashGrapple','swingGrapple','zipline']){const t=this.preview(kind);targets[kind]=t?{id:t.id,point:[...t.point]}:null;}
  for(const kind of ['jump','slide']){const t=this.preview(kind);targets[kind]=t?{id:t.id,kind:t.kind,markerId:t.markerId,point:[...t.point],ready:t.ready}:null;}
  const performance=this.performance?{...structuredClone(this.performance),animation:sceneAnimation(this.performance)}:null,matched=[...this.sceneMatches.values()].filter(s=>['matched','confirmed'].includes(s.status)).map(s=>({markerId:s.markerId,status:s.status,outcome:s.outcome,kind:s.kind,input:s.input,timelyUntil:s.marker.startX+s.recipe.timelyEndOffset,lateUntil:s.marker.startX+s.marker.lateDistance}));
  return Object.freeze({player:Object.freeze({...p,context:p.context?{...p.context,contact:p.context.contact?[...p.context.contact]:undefined}:null,attachment:p.attachment?{...p.attachment}:null,ledge:p.ledge?{...p.ledge}:null,vault:undefined,stumble:undefined}),performance,matchedScenes:matched,sceneShot:this.sceneShot?structuredClone(this.sceneShot):null,lastSceneOutcome:this.lastSceneOutcome?{...this.lastSceneOutcome}:null,focus:[p.x,p.y+this.rules.bodySize[1]/2],grip:this.grip(),pendingAction:this.pendingAction?{...this.pendingAction}:null,size:[...this.bodySize()],session:this.session,reason:this.reason,tick:this.tick,time:this.time,stationIndex:this.currentStationIndex(),coverage:{...this.coverage},events:[...this.events],laps:this.laps,failures:this.failures,targets,cooldowns:{...this.cooldowns},snap:this.snap});
 }
}
