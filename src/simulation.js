import {compileWorld} from './content.js';
import {clamp,bodyRect,overlaps,moveBody,sweepBody,supportAt,clearBody,lineClear,closestOnCable,cableAt} from './collision.js';
import {detectSceneAction,trajectoryAt} from './scene-actions.js';
const FREE=new Set(['Run','Airborne']);
const LOW=new Set(['Slide','CrouchHold']);
export class Simulation{
 constructor(content,lab,{playing=true}={}){
  this.content=content;this.lab=lab;this.rules=content.rules;this.dt=1/this.rules.fixedStepHz;this.world=compileWorld(content,lab);this.coverage={};this.events=[];this.serial=0;this.laps=0;this.failures=0;this.snap=0;this.stationIndex=0;this.reset(0);if(!playing)this.session='Ready';
 }
 mark(id,detail=''){
  this.coverage[id]=(this.coverage[id]||0)+1;this.events.unshift(Object.freeze({id,detail,tick:this.tick,snap:this.snap,serial:++this.serial}));this.events.length=Math.min(this.events.length,this.lab.diagnostics.historySize);
 }
 reset(index=this.stationIndex,reason=''){
  this.stationIndex=clamp(index,0,this.lab.stations.length-1);const station=this.lab.stations[this.stationIndex],[x,y]=station.useLevelSpawn?this.world.spawn:station.spawn;
  this.p={x,y:y+this.rules.collisionSkin,vx:0,vy:0,state:'Run',attachment:null,lowAir:false,slideLeft:0,vault:null,context:null,stateTime:0,landLeft:0,gaitDistance:0};this.pendingAction=null;
  this.session='Playing';this.reason='';this.time=0;this.tick=0;this.cooldowns={dashGrapple:0,swingGrapple:0};this.padContacts=new Map();this.lastGround=0;this.jumpUntil=-Infinity;this.phase='';this.wallTime=0;this.snap++;
  if(reason==='retry')this.mark('Retry',this.lab.stations[this.stationIndex].name);
 }
 retry(){this.reset(this.currentStationIndex(),'retry');}
 pause(reason='Paused by player'){
  if(this.session!=='Playing')return;this.session='Paused';this.reason=reason;this.jumpUntil=-Infinity;this.pendingAction=null;this.mark('Paused',reason);
 }
 resume(){if(this.session==='Paused'||this.session==='Ready'){this.session='Playing';this.reason='';this.jumpUntil=-Infinity;}}
 fail(reason){if(this.session!=='Playing')return;this.session='Failed';this.reason=reason;this.failures++;this.p.attachment=null;this.p.vault=null;this.p.context=null;this.pendingAction=null;this.jumpUntil=-Infinity;this.mark('Failed',reason);}
 currentStationIndex(){const x=this.p.x;const i=this.lab.stations.findIndex(s=>x>=s.range[0]&&x<s.range[1]);return i<0?this.stationIndex:i;}
 bodySize(){return LOW.has(this.p.state)||this.p.lowAir||this.p.state==='Vault'?this.rules.slideBodySize:this.rules.bodySize;}
 grip(){return [this.p.x+this.rules.gripOffset[0],this.p.y+this.rules.gripOffset[1]];}
 center(){return [this.p.x,this.p.y+this.bodySize()[1]/2];}
 transition(state){if(this.p.state!==state){this.p.state=state;this.p.stateTime=0;if(['Run','Slide','CrouchHold','Vault','DashGrapple','SwingGrapple','Zipline'].includes(state))this.mark(state);}}
 reject(detail){this.mark('Rejected',detail);return false;}
 preview(kind){
  const marker=detectSceneAction(this.world,this.p,kind);
  if(marker&&this.rules.enabledAbilities.includes(marker.kind)&&!(this.cooldowns[kind]>0))return {id:marker.entityId,markerId:marker.id,point:marker.point,ready:this.p.x>=marker.startX};
  if(['jump','slide'].includes(kind))return null;
  return this.previewTarget(kind);
 }
 previewTarget(kind){
  const p=this.p,r=this.rules,origin=kind==='swingGrapple'?this.grip():this.center();if(!FREE.has(p.state)||!r.enabledAbilities.includes(kind)||this.cooldowns[kind]>0)return null;
  if(kind==='zipline'){
   const grip=this.grip(),choices=[];
   for(const e of this.world.cables){const hit=closestOnCable(grip,e);if(hit.distance<=e.profile.captureRadius){const target={x:hit.at[0]-r.gripOffset[0],y:hit.at[1]-r.gripOffset[1]};if(clearBody(target,r.bodySize,this.world.surfaces)&&!sweepBody(p,r.bodySize,target.x-p.x,target.y-p.y,this.world.surfaces,r.collisionSkin))choices.push({id:e.id,entity:e,point:hit.at,s:hit.s,distance:hit.distance});}}
   return choices.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id))[0]||null;
  }
  const choices=[];
  for(const e of this.world.anchors){if(e.profile.kind!==kind)continue;const dx=e.position[0]-origin[0],dy=e.position[1]-origin[1],distance=Math.hypot(dx,dy),angle=Math.abs(Math.atan2(dy,dx)),f=e.profile;if(distance>f.range||angle>f.coneRadians/2||!lineClear(origin,e.position,this.world.surfaces))continue;if(kind==='swingGrapple'&&(distance<f.minLength||distance>f.maxLength))continue;choices.push({id:e.id,entity:e,point:e.position,distance,angle});}
  return choices.sort((a,b)=>a.angle-b.angle||a.distance-b.distance||a.id.localeCompare(b.id))[0]||null;
 }
 acquire(kind,command){
  const target=this.previewTarget(kind);if(!target||('targetId'in command&&command.targetId!==target.id))return this.reject(`${kind}: no matching clear preview target`);
  const again=this.previewTarget(kind);if(!again||again.id!==target.id)return this.reject('Target changed before commit');
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
 tryVault(marker){
  const p=this.p,r=this.rules;if(p.state!=='Run'||!r.enabledAbilities.includes('vault'))return false;
  const b=r.slideBodySize,block=this.world.surfaces.find(e=>e.id===marker?.entityId&&e.vaultable);if(!block)return false;
  const [x,y,w,h]=block.rect,top=y+h,exitX=x+w+b[0]/2+r.collisionSkin*3;
  if(top-p.y>r.vaultMaxHeight||top<=p.y||w>r.vaultMaxWidth)return false;
  const support=supportAt({x:exitX,y:p.y},b,this.world.surfaces,r.groundProbeDistance);if(!support)return false;
  const endY=support.rect[1]+support.rect[3]+r.collisionSkin,start=[p.x,p.y],height=top-p.y+r.collisionSkin*2;
  const points=r.vaultTrajectory.map(([,x,y])=>[start[0]+(exitX-start[0])*x,start[1]+(endY-start[1])*x+height*y]);
  for(let i=1;i<points.length;i++){const a={x:points[i-1][0],y:points[i-1][1]},z=points[i];if(!clearBody({x:z[0],y:z[1]},b,this.world.surfaces)||sweepBody(a,b,z[0]-a.x,z[1]-a.y,this.world.surfaces,r.collisionSkin))return false;}
  p.vault={id:block.id,points,start,exit:[exitX,endY],height,elapsed:0};p.context={markerId:marker.id,kind:'vault',contact:[x+r.collisionSkin,top],progress:0};p.vx=p.vy=0;this.transition('Vault');return true;
 }
 queueContext(command){
  const marker=detectSceneAction(this.world,this.p,command.action);if(!marker||!this.rules.enabledAbilities.includes(marker.kind))return false;
  if(command.markerId&&command.markerId!==marker.id||'targetId'in command&&command.targetId!==marker.entityId){this.reject('Scene action target changed');return true;}
  const prior=this.world.sceneActions.find(m=>m.id===this.pendingAction?.markerId);
  if(this.pendingAction?.queuedTick===this.tick&&(prior?.priority??-Infinity)>=marker.priority)return true;
  if(!this.pendingAction||this.pendingAction.markerId!==marker.id){this.pendingAction={markerId:marker.id,action:command.action,expiresAt:this.time+this.rules.contextInputSeconds,queuedTick:this.tick,previousX:this.p.x};this.mark('ActionQueued',marker.id);}
  return true;
 }
 commitContext(held){
  const pending=this.pendingAction;if(!pending)return false;const marker=this.world.sceneActions.find(m=>m.id===pending.markerId),p=this.p;
  const crossed=marker&&pending.previousX<marker.startX&&p.x>=marker.startX;pending.previousX=p.x;
  if(!marker||this.time>pending.expiresAt||p.x>marker.startX+marker.lateDistance&&!crossed||p.y<marker.minY||p.y>marker.maxY||!FREE.has(p.state)||pending.action==='swingGrapple'&&!held.has('swingGrapple')){this.pendingAction=null;this.mark('ActionCancelled','Expired, released or no longer eligible');return false;}
  if(p.x<marker.startX)return false;
  if(['jump','slide','vault'].includes(marker.kind)&&p.state!=='Run')return false;
  if(['dashGrapple','swingGrapple','zipline'].includes(marker.kind)&&this.previewTarget(marker.kind)?.id!==marker.entityId)return false;
  if(['jump','slide','vault'].includes(marker.kind)&&p.x!==marker.startX){const dx=marker.startX-p.x;if(sweepBody(p,this.bodySize(),dx,0,this.world.surfaces,this.rules.collisionSkin))return false;this.applyMove(dx,0);}
  this.pendingAction=null;let ok=false;
  if(marker.kind==='vault')ok=this.tryVault(marker);
  else if(marker.kind==='slide'){p.slideLeft=this.rules.slideSeconds;this.transition('Slide');p.context={markerId:marker.id,kind:'slide'};ok=true;}
  else if(marker.kind==='jump'){p.vy=this.rules.jumpVelocity;p.lowAir=false;this.jumpUntil=-Infinity;this.lastGround=-Infinity;this.transition('Airborne');this.mark('Jump');ok=true;}
  else{ok=this.acquire(marker.kind,{targetId:marker.entityId});if(ok)p.context={markerId:marker.id,kind:marker.kind};}
  this.mark(ok?'ActionAligned':'ActionCancelled',marker.id);return ok;
 }
 applyMove(dx,dy){
  const p=this.p,marker=this.world.sceneActions.find(m=>m.id===this.pendingAction?.markerId);
  // Land exactly on the entry plane instead of overshooting and snapping back.
  if(marker&&p.state==='Run'&&['jump','slide','vault'].includes(marker.kind)&&dx>0&&p.x<marker.startX&&p.x+dx>=marker.startX)dx=marker.startX-p.x;
  const before={x:p.x,y:p.y},out=moveBody(p,this.bodySize(),dx,dy,this.world.surfaces,this.rules.collisionSkin);p.x=out.x;p.y=out.y;
  for(const c of out.contacts){if(c.normal[0]){p.vx=0;this.wallHit=true;}if(c.normal[1])p.vy=0;}
  this.segments.push({before,after:{x:p.x,y:p.y}});return out;
 }
 step(input={}){
  let commands=(input.pressed||[]).map(v=>typeof v==='string'?{action:v}:v);const has=a=>commands.find(c=>c.action===a),held=new Set(input.held||[]),released=new Set(input.released||[]);
  if(has('pause')){this.session==='Paused'?this.resume():this.pause();return;}
  if(has('retry')){this.retry();return;}
  if(this.session!=='Playing')return;
  const p=this.p,r=this.rules,dt=this.dt,wasState=p.state,wasGround=['Run','Slide','CrouchHold'].includes(wasState),oldY=p.y,oldX=p.x;
  this.tick++;this.time+=dt;p.stateTime+=dt;p.landLeft=Math.max(0,p.landLeft-dt);this.segments=[];this.wallHit=false;
  for(const k of Object.keys(this.cooldowns))this.cooldowns[k]=Math.max(0,this.cooldowns[k]-dt);
  const support=supportAt(p,this.bodySize(),this.world.surfaces,r.groundProbeDistance);
  if(wasGround){if(support){p.y=support.rect[1]+support.rect[3]+r.collisionSkin;this.lastGround=this.time;}else{p.lowAir=LOW.has(p.state);this.transition('Airborne');}}
  if(p.lowAir&&clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding))p.lowAir=false;
  const wasAttached=!!p.attachment;
  if(p.state==='SwingGrapple'&&(!held.has('swingGrapple')||released.has('swingGrapple')))this.detach('hold released');
  if(p.state==='Zipline'&&(has('jump')||has('zipline')))this.detach(has('jump')?'jump':'toggle',!!has('jump'));
  let committed=wasAttached&&p.attachment===null;
  if(!committed){commands=commands.filter(c=>c.action==='swingGrapple'&&!held.has('swingGrapple')||!this.queueContext(c));committed=this.commitContext(held);}
  if(!committed){for(const kind of ['swingGrapple','dashGrapple','zipline'])if(has(kind)){if(kind==='swingGrapple'&&!held.has(kind))continue;if(!FREE.has(p.state)){this.reject(`${kind}: detach or leave low/vault state first`);continue;}if(this.acquire(kind,has(kind))){committed=true;break;}}}
  if(has('jump')&&!wasAttached&&FREE.has(p.state)&&r.enabledAbilities.includes('jump'))this.jumpUntil=this.time+r.jumpBufferSeconds;
  if(!committed&&FREE.has(p.state)&&this.jumpUntil>=this.time&&(p.state==='Run'||this.time-this.lastGround<=r.coyoteSeconds)){
   p.vy=r.jumpVelocity;p.lowAir=false;this.jumpUntil=-Infinity;this.lastGround=-Infinity;this.transition('Airborne');this.mark('Jump');committed=true;
  }
  if(!committed&&has('slide')){
   if(p.state==='Run'&&r.enabledAbilities.includes('slide')){p.slideLeft=r.slideSeconds;this.transition('Slide');committed=true;}else this.reject('Slide requires grounded running');
  }
  if(p.state==='Slide'){p.slideLeft-=dt;if(p.slideLeft<=0){if(clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding)){this.transition('Run');this.mark('Stand');}else this.transition('CrouchHold');}}
  if(p.state==='CrouchHold'&&clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding)){this.transition('Run');this.mark('Stand');}
  const impactVy=p.vy;
  if(p.state==='Vault'){
   const v=p.vault,old=v.elapsed;v.elapsed=Math.min(r.vaultDurationSeconds,v.elapsed+dt);
   const sample=t=>{const [x,y]=trajectoryAt(r.vaultTrajectory,clamp(t/r.vaultDurationSeconds,0,1));return[v.start[0]+(v.exit[0]-v.start[0])*x,v.start[1]+(v.exit[1]-v.start[1])*x+v.height*y];};
   const cuts=r.vaultTrajectory.slice(1,-1).map(k=>k[0]*r.vaultDurationSeconds).filter(t=>t>old&&t<v.elapsed);cuts.push(v.elapsed);p.context.progress=v.elapsed/r.vaultDurationSeconds;
   for(const t of cuts){const at=sample(t),out=this.applyMove(at[0]-p.x,at[1]-p.y);if(out.contacts.length){p.vault=null;p.context=null;this.transition('Airborne');this.reject('Vault path blocked');break;}}
   if(p.vault&&v.elapsed>=r.vaultDurationSeconds-1e-9){p.vault=null;p.context=null;p.vx=r.vaultExitSpeed;this.transition(clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding)?'Run':'CrouchHold');this.mark('Land','vault exit');}
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
   if(!isSwing){const accel=(p.state==='Airborne'?r.airAcceleration:r.groundAcceleration)*dt;if(p.vx<r.runSpeed)p.vx=Math.min(r.runSpeed,p.vx+accel);else if(p.state!=='Airborne')p.vx=Math.max(r.runSpeed,p.vx-accel);}
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
  if(p.x>=this.world.finish[0]){this.laps++;this.mark('Lap',`Lap ${this.laps}: return gate`);this.reset(0);return;}
  let launched=false;
  for(const e of this.world.pads){
   const [x,y,w,h]=e.rect,top=y+h,contact=p.x+r.bodySize[0]/2>x&&p.x-r.bodySize[0]/2<x+w&&p.y<=top+r.groundProbeDistance&&oldY>=top-r.collisionSkin*2&&p.vy<=0;
   const lock=this.padContacts.get(e.id)||{touching:false,readyAt:0};
   const marker=this.world.sceneActions.find(m=>m.kind==='jumpPad'&&m.entityId===e.id),aligned=!marker||p.x>=marker.startX;
   if(contact&&aligned&&!lock.touching&&this.time>=lock.readyAt&&!p.attachment&&p.state!=='Vault'&&r.enabledAbilities.includes('jumpPad')){const v=e.profile.launchVelocity;if(e.profile.velocityPolicy==='replace')[p.vx,p.vy]=v;else{p.vx+=v[0];p.vy+=v[1];}p.lowAir=false;this.jumpUntil=-Infinity;this.lastGround=-Infinity;this.transition('Airborne');this.mark('JumpPad',e.id);lock.readyAt=this.time+e.profile.rearmSeconds;launched=true;}
   lock.touching=contact&&aligned;this.padContacts.set(e.id,lock);
  }
  if(!launched&&!p.attachment&&p.state!=='Vault'){
   const ground=supportAt(p,this.bodySize(),this.world.surfaces,r.groundProbeDistance);
   if(ground&&p.vy<=0){p.y=ground.rect[1]+ground.rect[3]+r.collisionSkin;p.vy=0;this.lastGround=this.time;if(p.state==='Airborne'){const canStand=clearBody(p,r.bodySize,this.world.surfaces,r.standClearancePadding);p.lowAir=false;this.transition(canStand?'Run':'CrouchHold');p.landLeft=r.landingRecoverySeconds;this.mark('Land',`impact ${Math.abs(impactVy).toFixed(1)} m/s`);}}
   else if(['Run','Slide','CrouchHold'].includes(p.state)){p.lowAir=LOW.has(p.state);this.transition('Airborne');}
  }
  if(p.state==='Airborne'||p.state==='SwingGrapple'){const phase=p.vy>0?'Rise':'Fall';if(phase!==this.phase){this.mark(phase);this.phase=phase;}}else this.phase='';
  if(p.state==='Run'&&!this.coverage.Run)this.mark('Run');
  if(p.state==='Run')p.context=null;
  if(p.state==='Run'||LOW.has(p.state))p.gaitDistance+=Math.abs(p.x-oldX);
  this.wallTime=this.wallHit?this.wallTime+dt:0;if(this.wallTime>=this.lab.diagnostics.wallWarningSeconds){this.reject('Wall ahead: jump or retry station');this.wallTime=-this.lab.diagnostics.wallWarningSeconds;}
  p.vx=clamp(p.vx,-r.maxHorizontalSpeed,r.maxHorizontalSpeed);p.vy=clamp(p.vy,-r.maxFallSpeed,r.maxFallSpeed);
  if(![p.x,p.y,p.vx,p.vy].every(Number.isFinite))this.fail('Invalid numeric motion state');
 }
 snapshot(){
  const p=this.p,targets={};for(const kind of ['dashGrapple','swingGrapple','zipline']){const t=this.preview(kind);targets[kind]=t?{id:t.id,point:[...t.point]}:null;}
  for(const kind of ['jump','slide']){const t=this.preview(kind);targets[kind]=t?{id:t.id,markerId:t.markerId,point:[...t.point],ready:t.ready}:null;}
  return Object.freeze({player:Object.freeze({...p,context:p.context?{...p.context,contact:p.context.contact?[...p.context.contact]:undefined}:null,attachment:p.attachment?{...p.attachment}:null,vault:undefined}),grip:this.grip(),pendingAction:this.pendingAction?{...this.pendingAction}:null,size:[...this.bodySize()],session:this.session,reason:this.reason,tick:this.tick,time:this.time,stationIndex:this.currentStationIndex(),coverage:{...this.coverage},events:[...this.events],laps:this.laps,failures:this.failures,targets,cooldowns:{...this.cooldowns},snap:this.snap});
 }
}
