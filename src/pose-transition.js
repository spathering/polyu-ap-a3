const smooth=t=>t*t*(3-2*t);
// Presentation memory uses simulation time and body-relative metres, never pixels.
// It therefore freezes on pause and cannot feed camera changes back into motion.
export class PoseTransition{
 constructor(timing){this.timing=timing;this.last=null;this.transition=null;}
 update(snapshot,pose,pelvisOffset){
  const {time,snap}=snapshot,key=pose.sample.sequence,locked=['SwingGrapple','Zipline','LedgeHang'].includes(snapshot.player.state)||['vault','climb','mantle'].includes(snapshot.player.context?.kind);
  const valid=this.last&&this.last.snap===snap&&time>=this.last.time;
  if(!valid)this.transition=null;
  const elapsed=valid?time-this.last.time:0;
  if(valid&&this.last.key!==key){
   const velocity=this.last.velocity||[0,0],delta=pelvisOffset.map((v,i)=>this.last.offset[i]+velocity[i]*elapsed-v),length=Math.hypot(...delta),limit=this.timing.transitionMaxOffsetMetres;
   const angle=(this.last.rotation||0)-(pose.rotation||0);
   this.transition=locked?null:{start:time,offset:delta.map(v=>v*Math.min(1,limit/(length||1))),velocity,angle:Math.atan2(Math.sin(angle),Math.cos(angle))};
  }
  let correction=[0,0],rotationCorrection=0;
  if(this.transition&&!locked){const t=Math.max(0,Math.min(1,(time-this.transition.start)/this.timing.transitionSeconds)),weight=smooth(t),tangent=t*(1-t)*(1-t)*this.timing.transitionSeconds;correction=this.transition.offset.map((v,k)=>v*(1-weight)+this.transition.velocity[k]*tangent);const length=Math.hypot(...correction),limit=this.timing.transitionMaxOffsetMetres;if(length>limit)correction=correction.map(v=>v*limit/length);rotationCorrection=this.transition.angle*(1-weight);if(t>=1)this.transition=null;}
  const offset=pelvisOffset.map((v,i)=>v+correction[i]),velocity=elapsed>1e-9?offset.map((v,k)=>(v-this.last.offset[k])/elapsed):valid?this.last.velocity||[0,0]:[0,0],speed=Math.hypot(...velocity),max=this.timing.transitionMaxOffsetMetres/this.timing.transitionSeconds;
  this.last={snap,time,key,offset,velocity:velocity.map(v=>v*Math.min(1,max/(speed||1))),rotation:(pose.rotation||0)+rotationCorrection};
  return {correction,rotationCorrection};
 }
}
