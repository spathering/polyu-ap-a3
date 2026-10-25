const lerp=(a,b,t)=>a+(b-a)*t;
// Interpolate only presentation; discrete state/commands stay on fixed simulation ticks.
export function presentationSnapshot(previous,current,alpha){
 if(!previous||previous.snap!==current.snap||previous.session!=='Playing'||current.session!=='Playing')return current;
 const t=Math.max(0,Math.min(1,alpha)),changed=current.player.state!==previous.player.state;
 // Interpolated time is between these ticks. Do not show the next discrete pose
 // at the old position (especially standing -> crouch or hanging -> airborne).
 const p={...(changed&&t<1?previous.player:current.player)};
 for(const key of ['x','y','vx','vy','gaitDistance'])p[key]=lerp(previous.player[key],current.player[key],t);
 if(!changed){p.stateTime=lerp(previous.player.stateTime,p.stateTime,t);p.landLeft=lerp(previous.player.landLeft,p.landLeft,t);if(p.context?.progress!==undefined&&previous.player.context?.markerId===p.context.markerId)p.context={...p.context,progress:lerp(previous.player.context.progress,p.context.progress,t)};}
 else if(t<1)p.stateTime=previous.player.stateTime+(current.time-previous.time)*t;
 if(p.attachment?.kind==='zipline'&&p.attachment.id===previous.player.attachment?.id)p.attachment={...p.attachment,s:lerp(previous.player.attachment.s,p.attachment.s,t)};
 const performance=previous.performance?.id===current.performance?.id&&current.performance?{...current.performance,elapsed:lerp(previous.performance.elapsed,current.performance.elapsed,t),animation:current.performance.animation?{...current.performance.animation,phase:typeof previous.performance.animation?.phase==='number'&&previous.performance.animation.sequence===current.performance.animation.sequence?lerp(previous.performance.animation.phase,current.performance.animation.phase,t):current.performance.animation.phase}:null}:t<1?previous.performance:current.performance;
 return {...current,performance,sceneShot:t<1?previous.sceneShot:current.sceneShot,size:changed&&t<1?previous.size:current.size,focus:current.focus?.map((v,i)=>lerp(previous.focus?.[i]??v,v,t)),grip:current.grip.map((v,i)=>lerp(previous.grip[i],v,t)),time:lerp(previous.time,current.time,t),player:p};
}
