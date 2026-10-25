import {compileSceneActions} from './scene-actions.js';

export function entityBounds(e){
 if(e.rect)return [...e.rect];
 const points=e.points||[e.position],xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 return [Math.min(...xs),Math.min(...ys),Math.max(.1,Math.max(...xs)-Math.min(...xs)),Math.max(.1,Math.max(...ys)-Math.min(...ys))];
}
export const heightUnit=content=>content.rules.climbMaxHeight;
export const placementPivot=m=>m.sockets.find(s=>s.role==='entry').position;

// The intended forward action's AABB is a derived editor aid, not a reachability
// certificate or a bound on every possible grapple release. Geometry has one owner.
export function moduleSpace(content,m){
 const r=content.rules,half=r.bodySize[0]/2,recovery=r.runSpeed*r.actionRecoverySeconds;
 let left=Infinity,bottom=Infinity,right=-Infinity,top=-Infinity;
 const point=(x,y)=>{left=Math.min(left,x);right=Math.max(right,x);bottom=Math.min(bottom,y);top=Math.max(top,y);};
 const body=(x,y,h=r.bodySize[1])=>{point(x-half,y);point(x+half,y+h);};
 for(const e of m.entities){const [x,y,w,h]=entityBounds(e);point(x,y);point(x+w,y+h);}
 if(r.sceneTraversal)for(const e of m.entities.filter(e=>e.kind==='surface'&&['ledge','wall','wall-ledge'].includes(e.traversal))){const [x,y,w,h]=e.rect,t=r.sceneTraversal;body(x-t.reach-half,y);body(x-half,y+h-t.hangGripHeight);body(x+half+recovery,y+h);if(e.traversal!=='ledge'){const time=t.wallJumpVelocity[1]/r.gravity;body(x+t.wallJumpVelocity[0]*time,y+h+t.wallJumpVelocity[1]**2/(2*r.gravity));}}
 const profiles=new Map(content.profiles.map(p=>[p.id,p]));
 const markers=compileSceneActions(m,{id:'space',position:[0,0]},m.entities.map(e=>({...e,id:`space/${e.id}`})),r,content.scenePerformances||[]);
 for(const e of m.entities.filter(e=>e.kind==='anchor'&&!markers.some(a=>a.entityId===`space/${e.id}`))){const profile=profiles.get(e.profileId);markers.push({kind:profile.kind,entityId:`space/${e.id}`,startX:e.position[0]-profile.range,leadDistance:r.runSpeed*r.contextInputSeconds});}
 const ballistic=(x,y,vx,vy,floor)=>{
  const flight=(vy+Math.sqrt(Math.max(0,vy*vy+2*r.gravity*Math.max(0,y-floor))))/r.gravity;
  body(x,y);body(x+vx*flight,floor);if(vy>0)body(x+vx*vy/r.gravity,y+vy*vy/(2*r.gravity));body(x+vx*flight+recovery,floor);
 };
 for(const a of markers){
  const e=m.entities.find(e=>`space/${e.id}`===a.entityId),entryY=m.sockets.find(s=>s.role==='entry')?.position[1]||0,base=['vault','climb'].includes(a.kind)?e.rect[1]:['jump','jumpPad'].includes(a.kind)?e.rect[1]+e.rect[3]:entryY,profile=profiles.get(e.profileId);
  body(a.startX-a.leadDistance,base);body(a.startX,base);
  if(a.kind==='jump')ballistic(a.startX,base,r.runSpeed,r.jumpVelocity,base);
  else if(a.kind==='slide'){const b=entityBounds(e);body(b[0]+b[2]+half+recovery,base);}
  else if(a.kind==='vault'||a.kind==='climb'){
   const [x,y,w,h]=e.rect,endX=a.kind==='climb'?x+half+r.collisionSkin*3:x+w+half+r.collisionSkin*3,endY=a.kind==='climb'?y+h+r.collisionSkin:base;
   const knots=a.kind==='climb'?r.climbTrajectory:r.vaultTrajectory;
   for(const [,u,v]of knots)body(a.startX+(endX-a.startX)*u,a.kind==='climb'?base+(endY-base)*v:base+(y+h-base+r.collisionSkin*2)*v,r.slideBodySize[1]);
   body(endX+recovery,endY);
  }else if(a.kind==='jumpPad'){const [x,y,w,h]=e.rect;ballistic(x+w/2,y+h,...profile.launchVelocity,base);}
  else if(a.kind==='zipline'){
   for(const p of e.points)body(p[0]-r.gripOffset[0],p[1]-r.gripOffset[1]);
   const b=e.points.at(-1),c=e.points.at(-2),len=Math.hypot(b[0]-c[0],b[1]-c[1]);ballistic(b[0],b[1]-r.gripOffset[1],(b[0]-c[0])/len*profile.speed,(b[1]-c[1])/len*profile.speed,base);
  }else if(a.kind==='dashGrapple'){
   const [x,y]=e.position,dx=x-a.startX,dy=y-base-r.bodySize[1]/2,len=Math.hypot(dx,dy)||1;
   ballistic(x-dx/len*profile.arrivalRadius,y-dy/len*profile.arrivalRadius-r.bodySize[1]/2,dx/len*profile.exitSpeed,dy/len*profile.exitSpeed,base);
  }else if(a.kind==='swingGrapple'){
   const [x,y]=e.position,len=Math.min(profile.maxLength,Math.hypot(x-a.startX,y-base-r.gripOffset[1]));
   body(x,Math.min(base,y-len-r.gripOffset[1]));body(x+len+recovery,base);point(x,y);
  }
 }
 if(!Number.isFinite(left)){left=bottom=0;right=r.bodySize[0];top=r.bodySize[1];}
 return [left,bottom,Math.max(r.collisionSkin,right-left),Math.max(r.collisionSkin,top-bottom)];
}

export function blockAction(content,width,height){
 const r=content.rules;if(height>r.climbMaxHeight+r.collisionSkin)return 'solid';
 return height<=r.vaultMaxHeight+r.collisionSkin&&width<=r.vaultMaxWidth?'vault':'climb';
}
