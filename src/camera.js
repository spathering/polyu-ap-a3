import {clamp,cableAt} from './collision.js';
export class FollowCamera{
 constructor(rules){this.rules=rules;this.x=0;this.y=0;this.height=rules.baseViewHeight;this.snapId=-1;}
 update(snapshot,dt,aspect,world){
  if(snapshot.session!=='Playing'&&this.snapId===snapshot.snap)return;
  const p=snapshot.player,c=this.rules,attachment=p.attachment?world.entities.find(e=>e.id===p.attachment.id):null;
  const margin=c.deadZoneSize[1]/2;
  let minX=p.x-snapshot.size[0]/2,maxX=p.x+snapshot.size[0]/2,minY=p.y,maxY=p.y+snapshot.size[1];
  const include=at=>{minX=Math.min(minX,at[0]);maxX=Math.max(maxX,at[0]);minY=Math.min(minY,at[1]);maxY=Math.max(maxY,at[1]);};
  if(attachment?.position){include(attachment.position);if(p.attachment.kind==='swingGrapple')include([attachment.position[0],attachment.position[1]-p.attachment.length-(snapshot.grip[1]-p.y)]);}
  if(attachment?.points){include(cableAt(attachment,p.attachment.s).at);const end=attachment.points.at(-1);include([Math.min(end[0],p.x+c.maxLookAhead),end[1]]);}
  const h=clamp(Math.max(c.baseViewHeight,maxY-minY+2*margin,(maxX-minX+2*margin)/aspect),c.minViewHeight,c.maxViewHeight);
  const zoom=1-Math.exp(-dt/c.zoomSmoothingSeconds);this.height+= (h-this.height)*zoom;
  const width=this.height*aspect,look=clamp(Math.max(0,p.vx)*c.lookAheadSeconds,c.minLookAhead,c.maxLookAhead);
  let desiredX=p.x+(0.5-c.targetScreenX)*width+look,desiredY=(attachment?(minY+maxY)/2:p.y+snapshot.size[1]/2+this.height*.16)+clamp(p.vy*c.verticalLookAheadSeconds,-c.maxVerticalOffset,c.maxVerticalOffset);
  const fitX=[maxX-width/2+margin,minX+width/2-margin],fitY=[maxY-this.height/2+margin,minY+this.height/2-margin];
  if(fitX[0]<=fitX[1])desiredX=clamp(desiredX,...fitX);if(fitY[0]<=fitY[1])desiredY=clamp(desiredY,...fitY);
  if(this.snapId!==snapshot.snap){this.snapId=snapshot.snap;this.x=desiredX;this.y=desiredY;this.height=h;return;}
  if(snapshot.session!=='Playing')return;
  const alpha=1-Math.exp(-dt/c.smoothingSeconds),dzX=c.deadZoneSize[0]/2,dzY=c.deadZoneSize[1]/2;
  let dx=desiredX-this.x,dy=desiredY-this.y;dx=Math.abs(dx)<=dzX?0:dx-Math.sign(dx)*dzX;dy=Math.abs(dy)<=dzY?0:dy-Math.sign(dy)*dzY;
  this.x+=clamp(dx*alpha,-c.maxCatchUpSpeed*dt,c.maxCatchUpSpeed*dt);this.y+=clamp(dy*alpha,-c.maxCatchUpSpeed*dt,c.maxCatchUpSpeed*dt);
  if(attachment){const mx=Math.min(margin,Math.max(0,(width-(maxX-minX))/2)),my=Math.min(margin,Math.max(0,(this.height-(maxY-minY))/2));if(maxX-minX<=width)this.x=clamp(this.x,maxX-width/2+mx,minX+width/2-mx);if(maxY-minY<=this.height)this.y=clamp(this.y,maxY-this.height/2+my,minY+this.height/2-my);}
  // Visibility guard affects the presentation only, never the authoritative body.
  const safeX=Math.min(margin,width/4),safeY=Math.min(margin,this.height/4);
  this.x=clamp(this.x,p.x-width/2+safeX,p.x+width/2-safeX);this.y=clamp(this.y,p.y+snapshot.size[1]-this.height/2+safeY,p.y+this.height/2-safeY);
 }
}
