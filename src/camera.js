import {clamp,cableAt} from './collision.js';
import {directedCameraPose,blendDirectedPose} from './directed-camera.js';
export class FollowCamera{
 constructor(rules){this.rules=rules;this.x=0;this.y=0;this.height=rules.baseViewHeight;this.snapId=-1;this.motion=[0,0];this.target=null;}
 update(snapshot,dt,aspect,world){
  if(snapshot.session!=='Playing'&&this.snapId===snapshot.snap)return;
  if(snapshot.sceneShot){
   const shot=snapshot.sceneShot,target=directedCameraPose(shot,snapshot.time,aspect,this.rules),reset=this.snapId!==snapshot.snap;
   if(reset){this.x=target.x;this.y=target.y;this.height=target.height;this.motion=[0,0];this.snapId=snapshot.snap;}
   if(reset||this.directed?.key!==shot.key||this.directed.aspect!==aspect)this.directed={key:shot.key,aspect,start:snapshot.time,from:{x:this.x,y:this.y,height:this.height,velocity:[...this.motion]}};
   const old=[this.x,this.y],pose=blendDirectedPose(this.directed.from,target,snapshot.time-this.directed.start,shot.camera.blendSeconds);
   this.x=pose.x;this.y=pose.y;this.height=pose.height;this.motion=old.map((v,k)=>dt>0?([this.x,this.y][k]-v)/dt:0);this.vx=shot.referenceSpeed;this.vy=0;this.target=[this.x,this.y];return;
  }
  this.directed=null;
  const p=snapshot.player,c=this.rules,pending=world.sceneActions.find(m=>m.id===snapshot.pendingAction?.markerId),actual=p.attachment?world.entities.find(e=>e.id===p.attachment.id):null,attachment=actual||(pending&&['dashGrapple','swingGrapple','zipline'].includes(pending.kind)?world.entities.find(e=>e.id===pending.entityId):null);
  const filter=1-Math.exp(-dt/c.velocitySmoothingSeconds);if(this.snapId!==snapshot.snap){this.vx=p.vx;this.vy=p.vy;}else{this.vx+=(p.vx-this.vx)*filter;this.vy+=(p.vy-this.vy)*filter;}
  const margin=c.deadZoneSize[1]/2;
  let minX=p.x-snapshot.size[0]/2,maxX=p.x+snapshot.size[0]/2,minY=p.y,maxY=p.y+snapshot.size[1];
  const include=at=>{minX=Math.min(minX,at[0]);maxX=Math.max(maxX,at[0]);minY=Math.min(minY,at[1]);maxY=Math.max(maxY,at[1]);};
  if(attachment?.position){include(attachment.position);if(p.attachment?.kind==='swingGrapple')include([attachment.position[0],attachment.position[1]-p.attachment.length-(snapshot.grip[1]-p.y)]);}
  if(attachment?.points){include(cableAt(attachment,p.attachment?.s||0).at);const end=attachment.points.at(-1);include([Math.min(end[0],p.x+c.maxLookAhead),end[1]]);}
  if(['ledge','mantle'].includes(p.context?.kind)&&p.context.contact){include(p.context.contact);include([p.context.contact[0]+c.minLookAhead,p.context.contact[1]+snapshot.size[1]]);}
  const h=clamp(Math.max(c.baseViewHeight,maxY-minY+2*margin,(maxX-minX+2*margin)/aspect),c.minViewHeight,c.maxViewHeight);
  const zoom=1-Math.exp(-dt/c.zoomSmoothingSeconds);this.height+= (h-this.height)*zoom;
  const width=this.height*aspect,look=clamp(Math.max(0,this.vx)*c.lookAheadSeconds,c.minLookAhead,c.maxLookAhead);
  let desiredX=p.x+(0.5-c.targetScreenX)*width+look,desiredY=(attachment?(minY+maxY)/2:(snapshot.focus?.[1]??p.y+snapshot.size[1]/2)+this.height*.16)+clamp(this.vy*c.verticalLookAheadSeconds,-c.maxVerticalOffset,c.maxVerticalOffset);
  const fitX=[maxX-width/2+margin,minX+width/2-margin],fitY=[maxY-this.height/2+margin,minY+this.height/2-margin];
  if(fitX[0]<=fitX[1])desiredX=clamp(desiredX,...fitX);if(fitY[0]<=fitY[1])desiredY=clamp(desiredY,...fitY);
  if(this.snapId!==snapshot.snap){this.snapId=snapshot.snap;this.x=desiredX;this.y=desiredY;this.height=h;this.motion=[0,0];this.target=[desiredX,desiredY];return;}
  if(snapshot.session!=='Playing')return;
  // Reference camera uses target displacement plus bounded velocity changes.
  // Re-express that behaviour in metres/seconds, independent of display refresh.
  const target=[desiredX,desiredY],previous=this.target||target,velocity=target.map((v,k)=>dt>0?(v-previous[k])/dt:0);this.target=target;
  const steps=Math.max(1,Math.ceil(dt*120)),step=dt/steps;
  for(let i=0;i<steps;i++){
   const at=target.map((v,k)=>previous[k]+(v-previous[k])*(i+1)/steps),error=[at[0]-this.x,at[1]-this.y];
   const aim=error.map((e,k)=>velocity[k]+Math.sign(e)*Math.max(0,Math.abs(e)-c.deadZoneSize[k]/2)/c.smoothingSeconds),change=aim.map((v,k)=>v-this.motion[k]);
   const limit=(c.followAcceleration??c.maxCatchUpSpeed/c.smoothingSeconds)*step,factor=Math.min(1,limit/(Math.hypot(...change)||1));
   this.motion=this.motion.map((v,k)=>v+change[k]*factor);
   const speed=Math.hypot(...this.motion);if(speed>c.maxCatchUpSpeed)this.motion=this.motion.map(v=>v*c.maxCatchUpSpeed/speed);
   this.x+=this.motion[0]*step;this.y+=this.motion[1]*step;
  }
  if(actual){const mx=Math.min(margin,Math.max(0,(width-(maxX-minX))/2)),my=Math.min(margin,Math.max(0,(this.height-(maxY-minY))/2));if(maxX-minX<=width)this.x=clamp(this.x,maxX-width/2+mx,minX+width/2-mx);if(maxY-minY<=this.height)this.y=clamp(this.y,maxY-this.height/2+my,minY+this.height/2-my);}
  // Visibility guard affects the presentation only, never the authoritative body.
  const safeX=Math.min(margin,width/4),safeY=Math.min(margin,this.height/4);
  this.x=clamp(this.x,p.x-width/2+safeX,p.x+width/2-safeX);this.y=clamp(this.y,p.y+snapshot.size[1]-this.height/2+safeY,p.y+this.height/2-safeY);
 }
}
