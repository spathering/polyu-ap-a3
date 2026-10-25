import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/simulation.js';
import {FollowCamera} from '../src/camera.js';
import {CharacterAnimation} from '../src/animation.js';
import {validateContent} from '../src/content.js';
import {directedCameraPose} from '../src/directed-camera.js';
import {approachDistance,approachDuration,validatePerformanceSequences} from '../src/scene-performance.js';
import {presentationSnapshot} from '../src/presentation.js';
import {rehearsalInput} from '../src/rehearsal.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url))),content=read('../content/parkour.json'),schema=read('../Documents/Plans/Design/Schemas/content-package.schema.json'),lab=read('../content/lab-course.json'),catalog=read('../assets/character/animations.json');
const fresh=()=>{const s=new Simulation(structuredClone(content),lab);s.reset(2);s.p.vx=6;return s;};
test('scene outcome clips and override camera tracks reject invalid authoring',()=>{
 assert.deepEqual(validatePerformanceSequences(content,catalog),[]);const bad=structuredClone(content);bad.scenePerformances[0].variants.late.sequence='unknown';assert.match(validatePerformanceSequences(bad,catalog).join(' '),/missing animation sequence unknown/);bad.scenePerformances[0].variants.missed.cameraKnots=[[0,0,0],[.8,.5,0],[.3,1,0],[1,1,0]];assert.ok(validateContent(bad,schema,lab).some(e=>e.includes('camera track')));
});
const play=outcome=>{const s=new Simulation(structuredClone(content),lab);s.reset(2);const w=lab.witnesses.find(w=>w.id===`timing-vault-${outcome}`),held=new Set(),animation=new CharacterAnimation(catalog,s.rules),sequences=new Set();for(let n=0;n<w.frames;n++){s.step(rehearsalInput(w,n,held));sequences.add(animation.sample(s.snapshot(),s.world).sequence);}return {s,sequences};};
test('scene is matched and all outcome transforms are prepared before any input',()=>{
 const s=fresh();s.step();const ready=s.snapshot().matchedScenes.find(m=>m.markerId==='vault/block-vault');assert.equal(ready.status,'matched');assert.equal(ready.outcome,null);assert.equal(s.pendingAction,null);assert.equal(s.coverage.Vault,undefined);const prepared=s.sceneMatches.get(ready.markerId);assert.ok(prepared.variants.timely.plan&&prepared.variants.late.plan);assert.notEqual(prepared.variants.timely.plan.start[0],prepared.variants.late.plan.start[0]);assert.equal(s.sceneShot.phase,'approach');
});
test('early signals from different approach positions enter exactly the same prefab animation/root plan',()=>{
 const plans=[];for(const x of [66.2,68]){const s=fresh();s.p.x=x;s.step({pressed:['jump']});assert.equal(s.p.state,'Run');assert.equal(s.pendingAction.performanceOutcome,'timely');for(let n=0;n<60&&s.p.state!=='Vault';n++)s.step();plans.push(s.p.vault);assert.equal(s.performance.outcome,'timely');}for(const key of ['start','exit','points','duration'])assert.deepEqual(plans[0][key],plans[1][key]);
});
test('a late signal waits for the late playback slot and cannot snap back to the timely origin',()=>{
 const s=fresh();s.p.x=69.3;s.step({pressed:['jump']});assert.equal(s.p.state,'Run');assert.equal(s.pendingAction.performanceOutcome,'late');for(let n=0;n<10&&s.p.state!=='Vault';n++){const x=s.p.x;s.step();assert.ok(s.p.x>=x-1e-9);}assert.equal(s.p.vault.start[0],69.55);assert.equal(s.performance.outcome,'late');assert.equal(s.performance.spec.sequence,'vaultLate');
});
test('first confirmed signal remains authoritative when the player presses again',()=>{
 const s=fresh();s.p.x=68;s.step({pressed:['jump']});const time=s.sceneMatches.get('vault/block-vault').confirmedAt;s.step({pressed:['jump']});assert.equal(s.sceneMatches.get('vault/block-vault').confirmedAt,time);assert.equal(s.pendingAction.performanceOutcome,'timely');
});
test('the same obstacle has three distinct authored clips and meaningful outcomes',()=>{
 const timely=play('timely'),late=play('late'),missed=play('missed');assert.ok(timely.sequences.has('vault'));assert.ok(late.sequences.has('vaultLate'));assert.ok(missed.sequences.has('obstacleHit'));assert.ok(timely.s.coverage.Land&&late.s.coverage.Land);assert.equal(missed.s.session,'Failed');assert.equal(missed.s.coverage.Vault,undefined);assert.ok(missed.s.p.x<71);assert.equal(timely.s.lastSceneOutcome.outcome,'timely');assert.equal(late.s.lastSceneOutcome.outcome,'late');assert.equal(missed.s.lastSceneOutcome.outcome,'missed');
});
test('no signal plays the missed response without fabricating a successful traversal',()=>{const s=fresh();for(let n=0;n<120&&s.session==='Playing';n++)s.step();assert.ok(s.coverage.SceneMatched&&s.coverage.SceneMissed);assert.equal(s.session,'Failed');assert.equal(s.coverage.Vault,undefined);});
test('a fixed shot is completely independent of root pose and instantaneous velocity',()=>{
 const s=fresh();s.p.x=68;s.step({pressed:['jump']});for(let n=0;n<30&&s.p.state!=='Vault';n++)s.step();const a=new FollowCamera(s.rules.camera),b=new FollowCamera(s.rules.camera);
 for(let n=0;n<30;n++){s.step();const snapshot=s.snapshot(),noisy={...snapshot,player:{...snapshot.player,x:snapshot.player.x+Math.sin(n)*1.5,y:snapshot.player.y+Math.cos(n),vx:n%2?24:-24,vy:n%2?25:-25},focus:[999,-999]};a.update(snapshot,1/60,1.7,s.world);b.update(noisy,1/60,1.7,s.world);assert.deepEqual([a.x,a.y,a.height],[b.x,b.y,b.height]);}
});
test('authored vault camera has a stable horizon while the physical root rises and falls',()=>{
 const s=fresh();s.p.x=68;s.step({pressed:['jump']});for(let n=0;n<30&&s.p.state!=='Vault';n++)s.step();const shot=s.snapshot().sceneShot,poses=[0,.2,.5,.8,1].map(u=>directedCameraPose(shot,shot.startedAt+shot.duration*u,1.7,s.rules.camera));assert.ok(poses.every(p=>p.y===poses[0].y&&p.height===poses[0].height));assert.ok(poses.at(-1).x>poses[0].x);
});
test('scene camera sampling agrees across 30, 60 and 120 Hz at identical simulation times',()=>{
 const s=fresh();s.p.x=68;s.step({pressed:['jump']});for(let n=0;n<30&&s.p.state!=='Vault';n++)s.step();const snapshot=s.snapshot(),ends=[];
 for(const hz of [30,60,120]){const camera=new FollowCamera(s.rules.camera);for(let n=0;n<=hz;n++)camera.update({...snapshot,time:snapshot.time+n/hz},1/hz,1.7,s.world);ends.push([camera.x,camera.y,camera.height]);}for(const at of ends.slice(1))for(let k=0;k<3;k++)assert.ok(Math.abs(at[k]-ends[0][k])<1e-8);
});
test('pause freezes a directed shot and retry discards its timeline and outcome',()=>{
 const s=fresh(),camera=new FollowCamera(s.rules.camera);s.step();camera.update(s.snapshot(),s.dt,1.7,s.world);s.pause();const old=JSON.stringify(camera);camera.update(s.snapshot(),1,1.7,s.world);assert.equal(JSON.stringify(camera),old);s.retry();assert.equal(s.sceneShot,null);assert.equal(s.sceneMatches.size,0);assert.equal(s.lastSceneOutcome,null);
});
test('scene recipes validate matching kinds, all branches and ordered camera tracks',()=>{
 for(const mutate of [c=>c.modules.find(m=>m.id==='unit-vault').sceneActions[0].performanceId='missing',c=>delete c.scenePerformances[0].variants.late,c=>c.scenePerformances[0].camera.knots[1][0]=0,c=>c.rules.performanceByKind.vault='scene-slide']){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c,schema,lab).length);}
});
test('old content without choreography retains its original free buffer and controller',()=>{
 const c=structuredClone(content);delete c.scenePerformances;delete c.rules.performanceByKind;for(const m of c.modules)for(const marker of m.sceneActions||[])delete marker.performanceId;assert.deepEqual(validateContent(c,schema,lab),[]);const s=new Simulation(c,lab);s.reset(2);s.p.x=68;s.step({pressed:['jump']});assert.ok(s.pendingAction);assert.equal(s.sceneMatches.size,0);assert.equal(s.sceneShot,null);
});
test('approach prediction uses entry speed and acceleration once rather than noisy render samples',()=>{
 for(const [distance,v,a,limit]of [[2,0,24,6],[2,12,24,6],[3,6,24,6],[3,18,0,6]]){const t=approachDuration(distance,v,a,limit);assert.ok(Math.abs(approachDistance(t,v,a,limit)-distance)<1e-8);}
});
test('render interpolation cannot show a future selected scene animation or shot',()=>{
 const s=fresh();s.p.x=69.2;s.p.vx=6;const old=s.snapshot();s.step({pressed:['jump']});const current=s.snapshot(),half=presentationSnapshot(old,current,.5);assert.equal(half.performance,null);assert.equal(half.sceneShot,null);assert.equal(presentationSnapshot(old,current,1).performance.outcome,'timely');
});
test('snapshot mutations cannot modify the bound recipe or scripted motion',()=>{const s=fresh();s.p.x=69.2;s.step({pressed:['jump']});const snap=s.snapshot();snap.performance.spec.sequence='bogus';snap.sceneShot.camera.knots[0][1]=999;assert.notEqual(s.performance.spec.sequence,'bogus');assert.notEqual(s.sceneShot.camera.knots[0][1],999);});
