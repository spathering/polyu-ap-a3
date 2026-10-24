import test from 'node:test';
import assert from 'node:assert/strict';
import {presentationSnapshot} from '../src/presentation.js';
import {PoseTransition} from '../src/pose-transition.js';
const snap=(time,state='Run',snap=1)=>({time,snap,session:'Playing',size:[.6,state==='Slide'?.8:1.8],grip:[0,2.3],player:{state,x:time,y:0,vx:1,vy:0,gaitDistance:time,stateTime:time,landLeft:0}});
test('discrete pose and collider size do not lead interpolated motion at an action boundary',()=>{
 const old=snap(1),next=snap(1+1/60,'Slide');next.player.stateTime=0;const half=presentationSnapshot(old,next,.5);assert.equal(half.player.state,'Run');assert.equal(half.size[1],1.8);assert.ok(half.player.stateTime>=old.player.stateTime);assert.equal(presentationSnapshot(old,next,1).player.state,'Slide');
});
const pose=sequence=>({sample:{sequence}}),timing={transitionSeconds:.1,transitionMaxOffsetMetres:.65};
test('visual root correction is bounded, eases to zero, and freezes with simulation time',()=>{
 const p=new PoseTransition(timing);p.update(snap(0),pose('run'),[0,1]);const started=p.update(snap(.01,'Airborne'),pose('rise'),[0,.8]);assert.ok(Math.abs(started.correction[1]-.2)<1e-10);const half=p.update(snap(.06,'Airborne'),pose('rise'),[0,.8]);assert.ok(Math.abs(half.correction[1]-.1)<1e-10);assert.deepEqual(p.update(snap(.06,'Airborne'),pose('rise'),[0,.8]),half);assert.deepEqual(p.update(snap(.12,'Airborne'),pose('rise'),[0,.8]).correction,[0,0]);
});
test('contact locks and retry bypass presentation inertia',()=>{
 const p=new PoseTransition(timing);p.update(snap(0),pose('run'),[0,1]);assert.deepEqual(p.update(snap(.01,'SwingGrapple'),pose('swing'),[0,2]).correction,[0,0]);assert.deepEqual(p.update(snap(0,'Airborne',2),pose('rise'),[0,.8]).correction,[0,0]);
});
test('release rotation takes the short angular path and eases around the pelvis',()=>{
 const p=new PoseTransition(timing);p.update(snap(0,'SwingGrapple'),{...pose('swing'),rotation:Math.PI-.05},[0,1]);const release=p.update(snap(.01,'Airborne'),{...pose('swingRelease'),rotation:-Math.PI+.05},[0,1]);assert.ok(Math.abs(release.rotationCorrection+.1)<1e-10);assert.ok(Math.abs(p.update(snap(.06,'Airborne'),{...pose('swingRelease'),rotation:-Math.PI+.05},[0,1]).rotationCorrection+.05)<1e-10);
});
