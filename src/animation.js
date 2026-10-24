import {clamp} from './collision.js';

// Presentation reads snapshots; image frames never move the collider or own state.
export class CharacterAnimation{
 constructor(catalog,rules){this.catalog=catalog;this.rules=rules;}
 sample(snapshot,world){
  const p=snapshot.player,c=this.catalog,t=c.timing;
  const recent=id=>snapshot.events.find(e=>e.id===id&&e.snap===snapshot.snap&&e.tick/this.rules.fixedStepHz<=snapshot.time+1e-9);
  const since=e=>e?Math.max(0,snapshot.time-e.tick/this.rules.fixedStepHz):Infinity;
  let sequence,phase,offset=0,fraction=0;
  const pad=recent('JumpPad'),padAge=since(pad);
  const releases=[recent('SwingRelease'),recent('ZiplineRelease'),recent('ZiplineEnd'),recent('ZiplineJump')].filter(Boolean).sort((a,b)=>b.serial-a.serial);
  const release=releases[0],releaseAge=since(release);
  if(p.state==='SwingGrapple'){
   // One calibrated hanging pose rotates continuously with the rope, avoiding
   // unrelated generated silhouettes switching at velocity thresholds.
   sequence='swing';offset=c.sequences.swing.holdFrame-c.sequences.swing.range[0];
  }else if(p.state==='Zipline'){
   sequence='cable';offset=c.sequences.cable.holdFrame-c.sequences.cable.range[0];
  }else if(p.state==='DashGrapple')sequence='dash';
  else if(p.state==='Vault'){sequence='vault';phase=p.context?.kind==='vault'?p.context.progress:clamp(p.stateTime/this.rules.vaultDurationSeconds,0,1);}
  else if(p.state==='Slide'&&p.stateTime<t.slideEnterSeconds){sequence='slideEnter';phase=p.stateTime/t.slideEnterSeconds;}
  else if(p.state==='Slide'||p.state==='CrouchHold'||p.lowAir)sequence='slide';
  else if(p.state==='Airborne'){
   if(releaseAge>=0&&releaseAge<t.releaseSeconds){sequence=release.id==='SwingRelease'?'swingRelease':'cableRelease';phase=releaseAge/t.releaseSeconds;}
   else if(padAge>=0&&padAge<t.padMaxSeconds){sequence='pad';offset=p.vy>t.padRiseFast?1:p.vy>0?2:p.vy>t.padDescentFast?3:4;}
   else sequence=p.vy>0?'rise':'fall';
  }else if(p.landLeft>0){sequence='land';phase=1-clamp(p.landLeft/this.rules.landingRecoverySeconds,0,1);}
  else if(since(recent('Stand'))<t.slideExitSeconds){sequence='slideExit';phase=since(recent('Stand'))/t.slideExitSeconds;}
  else sequence=Math.abs(p.vx)>.1?'run':'idle';
  const seq=c.sequences[sequence],clip=c.clips.find(c=>c.id===seq.clip),[start,end]=seq.range,count=end-start+1;
  if(phase!==undefined){const at=clamp(phase,0,1)*(count-1);offset=Math.floor(at);fraction=at-offset;}
  else if(!['swing','cable','pad'].includes(sequence)){
   const elapsed=sequence==='idle'?snapshot.time:p.stateTime;
   const at=sequence==='run'?p.gaitDistance/this.rules.runSpeed*seq.fps:elapsed*seq.fps,raw=Math.floor(at);offset=seq.loop?raw%count:Math.min(count-1,raw);fraction=at-raw;
  }
  const index=start+offset;
  const nextIndex=seq.loop?start+(offset+1)%count:Math.min(end,index+1);
  return {sequence,clip,index,frame:clip.frames[index],nextIndex,nextFrame:clip.frames[nextIndex],fraction:nextIndex===index?0:fraction};
 }
}
