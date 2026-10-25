import {clamp} from './collision.js';

// Presentation reads snapshots; image frames never move the collider or own state.
export class CharacterAnimation{
 constructor(catalog,rules){this.catalog=catalog;this.rules=rules;this.last=null;this.runOffset=0;this.entered=0;}
 sample(snapshot,world){
  const p=snapshot.player,c=this.catalog,t=c.timing;
  const recent=id=>snapshot.events.find(e=>e.id===id&&e.snap===snapshot.snap&&e.tick/this.rules.fixedStepHz<=snapshot.time+1e-9);
  const since=e=>e?Math.max(0,snapshot.time-e.tick/this.rules.fixedStepHz):Infinity;
  let sequence,phase,offset=0,fraction=0;
  const pad=recent('JumpPad'),padAge=since(pad);
  const releases=[recent('SwingRelease'),recent('ZiplineRelease'),recent('ZiplineEnd'),recent('ZiplineJump')].filter(Boolean).sort((a,b)=>b.serial-a.serial);
  const release=releases[0],releaseAge=since(release);
  const scripted=snapshot.performance?.animation;
  if(p.state==='LedgeHang'){sequence='ledgeHang';phase=0;}
  else if(scripted){sequence=scripted.sequence;phase=scripted.phase;if(['swing','cable'].includes(sequence))phase=(c.sequences[sequence].holdFrame-c.sequences[sequence].range[0])/(c.sequences[sequence].range[1]-c.sequences[sequence].range[0]||1);}
  else if(p.state==='Roll'){sequence='roll';phase=clamp(p.stateTime/this.rules.sceneTraversal.rollSeconds,0,1);}
  else if(p.state==='SwingGrapple'){
   // One calibrated hanging pose rotates continuously with the rope, avoiding
   // unrelated generated silhouettes switching at velocity thresholds.
   sequence='swing';offset=c.sequences.swing.holdFrame-c.sequences.swing.range[0];
  }else if(p.state==='Zipline'){
   sequence='cable';offset=c.sequences.cable.holdFrame-c.sequences.cable.range[0];
  }else if(p.state==='DashGrapple')sequence='dash';
  else if(p.state==='Vault'){sequence=p.context?.kind==='mantle'?'mantle':p.context?.kind==='climb'?'climb':'vault';phase=p.context?.progress??clamp(p.stateTime/this.rules.vaultDurationSeconds,0,1);}
  else if(p.state==='Slide'&&p.stateTime<t.slideEnterSeconds){sequence='slideEnter';phase=p.stateTime/t.slideEnterSeconds;}
  else if(p.state==='Slide'||p.state==='CrouchHold'||p.lowAir)sequence='slide';
  else if(p.state==='Airborne'){
   if(since(recent('WallJump'))<t.wallJumpSeconds){sequence='wallJump';phase=since(recent('WallJump'))/t.wallJumpSeconds;}
   else if(releaseAge>=0&&releaseAge<t.releaseSeconds){sequence=release.id==='SwingRelease'?'swingRelease':'cableRelease';phase=releaseAge/t.releaseSeconds;}
   else if(padAge>=0&&padAge<t.padMaxSeconds){sequence='pad';offset=p.vy>t.padRiseFast?1:p.vy>0?2:p.vy>t.padDescentFast?3:4;}
   else sequence=p.vy>0?'rise':'fall';
  }else if(p.landLeft>0||since(recent('Land'))<this.rules.actionRecoverySeconds){sequence='land';phase=Number.isFinite(since(recent('Land')))?since(recent('Land'))/this.rules.actionRecoverySeconds:1-clamp(p.landLeft/this.rules.landingRecoverySeconds,0,1);}
  else if(since(recent('Stand'))<t.slideExitSeconds){sequence='slideExit';phase=since(recent('Stand'))/t.slideExitSeconds;}
  else sequence=Math.abs(p.vx)>.1?'run':'idle';
  const seq=c.sequences[sequence],clip=c.clips.find(c=>c.id===seq.clip),[start,end]=seq.range,count=end-start+1;
  const reset=!this.last||this.last.snap!==snapshot.snap||snapshot.time<this.last.time;
  if(reset){this.last=null;this.runOffset=0;this.entered=snapshot.time-p.stateTime;}
  if(this.last?.sequence!==sequence){
   this.entered=snapshot.time;
   if(sequence==='run'&&this.last?.frame.poseSignature){
    const source=this.last.frame.poseSignature,weights=c.timing.poseMatchWeights;let best=start,score=Infinity;
    for(let i=start;i<=end;i++){const signature=clip.frames[i].poseSignature;if(!signature||signature.length!==source.length)continue;const cost=signature.reduce((sum,v,k)=>sum+(v-source[k])**2*(weights?.[k]??1),0);if(cost<score){score=cost;best=i;}}
    const raw=Math.floor(p.gaitDistance/this.rules.runSpeed*seq.fps);this.runOffset=((best-start-raw)%count+count)%count;
   }
  }
  if(phase!==undefined){const at=clamp(phase,0,1)*(count-1);offset=Math.floor(at);fraction=at-offset;}
  else if(!['swing','cable','pad'].includes(sequence)){
   const elapsed=sequence==='idle'?snapshot.time:Math.max(0,snapshot.time-this.entered);
   const at=sequence==='run'?p.gaitDistance/this.rules.runSpeed*seq.fps+this.runOffset:elapsed*seq.fps,raw=Math.floor(at);offset=seq.loop?raw%count:Math.min(count-1,raw);fraction=at-raw;
  }
  const index=start+offset;
  const nextIndex=seq.loop?start+(offset+1)%count:Math.min(end,index+1);
  const sample={sequence,clip,index,frame:clip.frames[index],nextIndex,nextFrame:clip.frames[nextIndex],fraction:nextIndex===index?0:fraction};this.last={snap:snapshot.snap,time:snapshot.time,sequence,frame:sample.frame};return sample;
 }
}
