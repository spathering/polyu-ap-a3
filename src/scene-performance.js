import {clearBody,sweepBody,supportAt} from './collision.js';
const copy=v=>structuredClone(v);
export function approachDistance(t,v,a,limit){if(!a)return v*t;const ramp=Math.abs(limit-v)/a,u=Math.min(t,ramp),signed=a*Math.sign(limit-v);return v*u+signed*u*u/2+Math.max(0,t-ramp)*limit;}
export function approachDuration(distance,v,a,limit){if(!a||v===limit)return distance/Math.max(v,1e-9);const signed=a*Math.sign(limit-v),ramp=Math.abs(limit-v)/a,d=(v+limit)/2*ramp;return distance<=d?(-v+Math.sqrt(v*v+2*signed*distance))/signed:ramp+(distance-d)/limit;}
// Geometry + immutable recipe are bound before a player signal is received.
export function traversalPlan(world,marker,r,start,durationScale=1){
 const e=world.surfaces.find(e=>e.id===marker.entityId),climb=marker.kind==='climb';if(!e)return null;
 const [x,y,w,h]=e.rect,top=y+h,b=r.slideBodySize,exitX=x+(climb?0:w)+b[0]/2+r.collisionSkin*3;
 if(top-start[1]>(climb?r.climbMaxHeight:r.vaultMaxHeight)+r.collisionSkin||top<=start[1]||!climb&&w>r.vaultMaxWidth||climb&&w<b[0]+r.collisionSkin*3)return null;
 const support=supportAt({x:exitX,y:climb?top+r.collisionSkin:start[1]},b,world.surfaces,r.groundProbeDistance);if(!support)return null;
 const exit=[exitX,support.rect[1]+support.rect[3]+r.collisionSkin],height=top-start[1]+r.collisionSkin*2,knots=climb?r.climbTrajectory:r.vaultTrajectory;
 const points=knots.map(([,u,v])=>[start[0]+(exitX-start[0])*u,climb?start[1]+(exit[1]-start[1])*v:start[1]+(exit[1]-start[1])*u+height*v]);
 for(let i=1;i<points.length;i++){const a={x:points[i-1][0],y:points[i-1][1]},z=points[i];if(!clearBody({x:z[0],y:z[1]},b,world.surfaces)||sweepBody(a,b,z[0]-a.x,z[1]-a.y,world.surfaces,r.collisionSkin))return null;}
 return {id:e.id,points,start:[...start],exit,height,elapsed:0,kind:marker.kind,entryVx:r.runSpeed,duration:(climb?r.climbDurationSeconds:r.vaultDurationSeconds)*durationScale};
}
export function prepareScene(world,marker,p,r,time){
 const recipe=marker.performance;if(!recipe)return null;
 const y=p.vault?.exit?.[1]??p.y,entity=world.entities.find(e=>e.id===marker.entityId),variants={};
 for(const outcome of ['timely','late','missed']){
  const spec=recipe.variants[outcome],start=[marker.startX+(outcome==='timely'?0:marker.lateDistance),y];let plan=null,duration=recipe.missSeconds,exit=[start[0]+r.runSpeed*duration,y];
  if(outcome!=='missed'){
   if(['vault','climb'].includes(marker.kind)){plan=traversalPlan(world,marker,r,start,spec.durationScale);if(plan){duration=plan.duration;exit=plan.exit;}}
   else if(marker.kind==='jump'){duration=2*r.jumpVelocity/r.gravity;exit=[start[0]+r.runSpeed*duration,y];}
   else if(marker.kind==='slide'){exit=[entity.rect[0]+entity.rect[2]+r.bodySize[0]/2+r.collisionSkin*3+r.runSpeed*r.actionRecoverySeconds,y];duration=Math.max(r.slideSeconds,(exit[0]-start[0])/r.runSpeed)*spec.durationScale;}
   else if(marker.kind==='dashGrapple'){exit=[entity.position[0]-entity.profile.arrivalRadius,entity.position[1]-r.bodySize[1]/2];duration=Math.max(1/r.fixedStepHz,Math.hypot(exit[0]-start[0],exit[1]-start[1])/entity.profile.speed);}
   else if(marker.kind==='zipline'){exit=[entity.points.at(-1)[0],entity.points.at(-1)[1]-r.gripOffset[1]];duration=entity.totalLength/entity.profile.speed;}
   else{exit=[entity.position[0]+r.runSpeed,y];duration=recipe.playSeconds||1;}
  }else if(['vault','climb','slide'].includes(marker.kind)){exit=[entity.rect[0]-r.bodySize[0]/2-r.collisionSkin,y];plan={start,exit,kind:'collision'};}
  const focusY=marker.kind==='swingGrapple'?(entity.position[1]+Math.min(y,entity.position[1]-entity.profile.maxLength-r.gripOffset[1]))/2:marker.kind==='zipline'?(entity.points[0][1]+entity.points.at(-1)[1])/2-r.gripOffset[1]/2:y+r.bodySize[1]/2;
  variants[outcome]={outcome,spec:copy(spec),start,exit:[...exit],duration,plan,shot:{id:marker.id,kind:marker.kind,bodyHalf:r.bodySize[0]/2,target:entity.position||entity.points?.[0]||[entity.rect[0],entity.rect[1]+entity.rect[3]],outcome,start,exit:[...exit],focusY,endY:['climb'].includes(marker.kind)?exit[1]-y:0,duration,camera:{...copy(recipe.camera),knots:copy(spec.cameraKnots||recipe.camera.knots)},referenceSpeed:r.runSpeed}};
 }
 if(['vault','climb'].includes(marker.kind)&&!variants.timely.plan)return null;
 return {markerId:marker.id,kind:marker.kind,input:marker.input,status:'matched',matchedAt:time,confirmedAt:null,outcome:null,recipe,variants,marker};
}
export function sceneAnimation(performance){
 if(!performance)return null;const {kind,outcome,elapsed,duration,spec}=performance,u=Math.min(1,elapsed/duration);
 if(outcome==='missed'&&kind==='jump'&&u<.25)return {sequence:'run',phase:undefined};
 if(outcome==='timely'&&kind==='jump')return {sequence:u<.5?'rise':'fall',phase:u<.5?u*2:(u-.5)*2};
 if(outcome==='timely'&&kind==='slide')return u<.08?{sequence:'slideEnter',phase:u/.08}:u>.91?{sequence:'slideExit',phase:(u-.91)/.09}:{sequence:'slide',phase:(u-.08)/.83};
 if(outcome==='late'&&kind==='slide')return u<.18?{sequence:'slideLate',phase:u/.18}:u>.91?{sequence:'slideExit',phase:(u-.91)/.09}:{sequence:'slide',phase:(u-.18)/.73};
 return {sequence:spec.sequence,phase:u};
}
export function validatePerformanceSequences(content,catalogue){
 const errors=[];for(const p of content.scenePerformances||[])for(const [outcome,v]of Object.entries(p.variants))if(!catalogue.sequences[v.sequence])errors.push(`${p.id}/${outcome}: missing animation sequence ${v.sequence}`);return errors;
}
