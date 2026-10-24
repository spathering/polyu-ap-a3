const smooth=t=>t*t*(3-2*t);
// Presentation memory uses simulation time and body-relative metres, never pixels.
// It therefore freezes on pause and cannot feed camera changes back into motion.
export class PoseTransition{
 constructor(timing){this.timing=timing;this.last=null;this.transition=null;}
 update(snapshot,pose,pelvisOffset){
  const {time,snap}=snapshot,key=pose.sample.sequence,locked=['SwingGrapple','Zipline'].includes(snapshot.player.state)||snapshot.player.context?.kind==='vault';
  const valid=this.last&&this.last.snap===snap&&time>=this.last.time;
  if(!valid)this.transition=null;
  if(valid&&this.last.key!==key){
   const delta=pelvisOffset.map((v,i)=>this.last.offset[i]-v),length=Math.hypot(...delta),limit=this.timing.transitionMaxOffsetMetres;
   const angle=(this.last.rotation||0)-(pose.rotation||0);
   this.transition=locked?null:{start:time,offset:delta.map(v=>v*Math.min(1,limit/(length||1))),angle:Math.atan2(Math.sin(angle),Math.cos(angle))};
  }
  let correction=[0,0],rotationCorrection=0;
  if(this.transition&&!locked){const t=Math.max(0,Math.min(1,(time-this.transition.start)/this.timing.transitionSeconds)),weight=smooth(t);correction=this.transition.offset.map(v=>v*(1-weight));rotationCorrection=this.transition.angle*(1-weight);if(t>=1)this.transition=null;}
  this.last={snap,time,key,offset:pelvisOffset.map((v,i)=>v+correction[i]),rotation:(pose.rotation||0)+rotationCorrection};
  return {correction,rotationCorrection};
 }
}
