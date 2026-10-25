import {clamp} from './collision.js';
import {trajectoryAt} from './scene-actions.js';
import {approachDistance} from './scene-performance.js';
const smooth=t=>t*t*(3-2*t);
// A shot samples an authored scene timeline. It never reads body pose or velocity.
export function directedCameraPose(shot,time,aspect,c){
 const margin=c.deadZoneSize[1]/2,target=shot.target,kind=shot.kind;
 let height=c.baseViewHeight*shot.camera.heightScale;
 if(kind==='swingGrapple')height=Math.max(height,2*Math.max(Math.abs(target[1]-shot.focusY),Math.abs(target[1]-shot.focusY))+2*margin,(Math.abs(target[0]-shot.start[0])+2*margin)/aspect);
 if(kind==='dashGrapple')height=Math.max(height,(Math.abs(target[0]-shot.start[0])+2*margin)/aspect);
 height=clamp(height,c.minViewHeight,c.maxViewHeight);
 const width=height*aspect,offset=Math.min((.5-c.targetScreenX)*width+clamp(shot.referenceSpeed*c.lookAheadSeconds,c.minLookAhead,c.maxLookAhead),Math.max(0,width/2-margin-(shot.bodyHalf||0)));
 const elapsed=Math.max(0,shot.phase==='approach'?time-shot.matchedAt:time-shot.startedAt),u=clamp(elapsed/(shot.phase==='approach'?shot.approachSeconds:shot.duration),0,1),[x,y]=trajectoryAt(shot.camera.knots,u);
 let from=shot.phase==='approach'?shot.approachStart[0]:shot.start[0],to=shot.phase==='approach'?shot.start[0]:shot.exit[0],cameraX=from+(to-from)*x+offset;
 if(shot.phase==='approach')cameraX=from+Math.min(Math.max(0,to-from),approachDistance(elapsed,shot.approachSpeed,shot.approachAcceleration,shot.referenceSpeed))+offset;
 if(kind==='dashGrapple')cameraX=(shot.start[0]+target[0])/2;
 else if(kind==='swingGrapple')cameraX=(from+(to-from)*x+target[0])/2;
 const coast=shot.phase==='recovery'?Math.max(0,time-shot.endedAt)*shot.referenceSpeed:0;
 return {x:cameraX+coast,y:shot.focusY+(kind==='swingGrapple'?0:height*.16)+shot.endY*smooth(u)+y,height};
}
export function blendDirectedPose(from,target,elapsed,seconds){
 const u=clamp(elapsed/seconds,0,1),w=smooth(u),tangent=elapsed*(1-u)*(1-u);
 return {x:from.x+(target.x-from.x)*w+(from.velocity?.[0]||0)*tangent,y:from.y+(target.y-from.y)*w+(from.velocity?.[1]||0)*tangent,height:from.height+(target.height-from.height)*w};
}
