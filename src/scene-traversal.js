import {clearBody,sweepBody,overlaps,bodyRect} from './collision.js';
export function wallCandidate(world,p,r,kind,excluded=new Set()){
 const t=r.sceneTraversal;if(!t||p.state!=='Airborne'||p.lowAir||p.attachment||!r.enabledAbilities.includes(kind))return null;
 const allowed=kind==='ledgeGrab'?['ledge','wall-ledge']:['wall','wall-ledge'];
 return world.surfaces.filter(e=>{
  if(!allowed.includes(e.traversal)||e.oneWay||excluded.has(e.id))return false;
  const [x,y,,h]=e.rect,gap=x-p.x-r.bodySize[0]/2,top=y+h;
  if(gap < -r.collisionSkin||gap>t.reach||p.y<y-r.groundProbeDistance||p.y>=top)return false;
  if(kind==='ledgeGrab'&&Math.abs(top-p.y-t.hangGripHeight)>t.catchTolerance)return false;
  const at={x:x-r.bodySize[0]/2-r.collisionSkin,y:kind==='ledgeGrab'?top-t.hangGripHeight:p.y};
  return clearBody(at,r.bodySize,world.surfaces)&&!sweepBody(p,r.bodySize,at.x-p.x,at.y-p.y,world.surfaces,r.collisionSkin)&&!world.hazards.some(h=>overlaps(bodyRect(at,r.bodySize),h.rect)||sweepBody(p,r.bodySize,at.x-p.x,at.y-p.y,[h],r.collisionSkin));
 }).sort((a,b)=>a.rect[0]-b.rect[0]||a.id.localeCompare(b.id))[0]||null;
}
export function mantlePlan(world,p,r){
 const e=world.surfaces.find(e=>e.id===p.ledge?.id),t=r.sceneTraversal;if(!e||!t)return null;
 const [x,y,w,h]=e.rect,top=y+h,exit=[x+r.bodySize[0]/2+r.collisionSkin*3,top+r.collisionSkin];
 if(w<r.bodySize[0]+r.collisionSkin*3||!clearBody({x:exit[0],y:exit[1]},r.bodySize,world.surfaces,r.standClearancePadding))return null;
 const start=[p.x,p.y],points=t.mantleTrajectory.map(([,u,v])=>[start[0]+(exit[0]-start[0])*u,start[1]+(exit[1]-start[1])*v]);
 for(let n=1;n<points.length;n++){const a={x:points[n-1][0],y:points[n-1][1]},b=points[n];if(!clearBody({x:b[0],y:b[1]},r.slideBodySize,world.surfaces)||sweepBody(a,r.slideBodySize,b[0]-a.x,b[1]-a.y,world.surfaces,r.collisionSkin))return null;}
 return {id:e.id,kind:'mantle',points,start,exit,height:exit[1]-start[1],elapsed:0,duration:t.mantleSeconds,entryVx:r.runSpeed};
}
