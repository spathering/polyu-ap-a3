import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/simulation.js';
import {validateContent} from '../src/content.js';
import {CharacterAnimation} from '../src/animation.js';
import {presentationSnapshot} from '../src/presentation.js';
import {Renderer} from '../src/renderer.js';
import {cableAt} from '../src/collision.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const content=read('../content/parkour.json'),lab=read('../content/lab-course.json'),schema=read('../Documents/Plans/Design/Schemas/content-package.schema.json'),catalog=read('../assets/character/animations.json');
const fresh=()=>new Simulation(structuredClone(content),lab);

test('early vault input waits while running, then starts at the geometry-derived mark',()=>{
 const s=fresh();s.reset(2);s.p.x=68;s.p.vx=6;const m=s.preview('jump');s.step({pressed:[{action:'jump',markerId:m.markerId}]});assert.equal(s.p.state,'Run');assert.ok(s.pendingAction);assert.ok(s.p.x>68);
 for(let i=0;i<20&&s.p.state!=='Vault';i++){const x=s.p.x;s.step();assert.ok(s.p.x>=x-1e-9,'approach must not snap backward');}assert.equal(s.p.state,'Vault');assert.equal(s.p.vault.start[0],s.world.sceneActions.find(m=>m.kind==='vault').startX);assert.equal(s.coverage.ActionAligned,1);
});
test('a block never starts a vault without a deliberate input',()=>{
 const s=fresh();s.reset(2);for(let i=0;i<150;i++)s.step();assert.equal(s.coverage.Vault,undefined);assert.ok(s.p.x<71);
});
test('a confirmed scene signal waits for its playback window instead of expiring as a free-jump buffer',()=>{
 const c=structuredClone(content);c.rules.groundAcceleration=.01;const s=new Simulation(c,lab);s.reset(2);s.p.x=67.3;s.step({pressed:['jump']});assert.ok(s.pendingAction);for(let i=0;i<40;i++)s.step();assert.ok(s.pendingAction);assert.equal(s.pendingAction.performanceOutcome,'timely');assert.equal(s.coverage.Jump,undefined);assert.equal(s.coverage.Vault,undefined);s.p.x=s.world.sceneActions.find(m=>m.id===s.pendingAction.markerId).startX;s.step();assert.equal(s.p.state,'Vault');
});
test('captured marker identity is revalidated instead of switching to a new scene action',()=>{
 const s=fresh();s.reset(2);s.p.x=68;s.step({pressed:[{action:'jump',markerId:'another/marker'}]});assert.equal(s.coverage.Rejected,1);assert.equal(s.pendingAction,null);assert.equal(s.coverage.Jump,undefined);
});
test('releasing swing before alignment cancels the queued hold',()=>{
 const s=fresh();s.reset(4);s.p.x=135;s.p.y=1;s.p.state='Airborne';s.p.vx=6;s.step({pressed:['swingGrapple'],held:['swingGrapple']});assert.ok(s.pendingAction);s.step({released:['swingGrapple']});assert.equal(s.pendingAction,null);assert.equal(s.p.attachment,null);assert.equal(s.coverage.ActionCancelled,1);
});
test('pause and retry clear queued context input',()=>{
 const s=fresh();s.reset(2);s.p.x=68;s.step({pressed:['jump']});s.pause();assert.equal(s.pendingAction,null);s.resume();s.step({pressed:['jump']});assert.ok(s.pendingAction);s.retry();assert.equal(s.pendingAction,null);
});
test('moving referenced geometry moves the mark without editing another coordinate',()=>{
 const c=structuredClone(content),e=c.modules.find(m=>m.id==='unit-vault').entities.find(e=>e.id==='vault-block');e.rect[0]+=1.5;const s=new Simulation(c,lab),m=s.world.sceneActions.find(m=>m.kind==='vault');assert.equal(m.startX,c.finiteLevels[0].instances.find(i=>i.moduleId==='unit-vault').position[0]+e.rect[0]+c.modules.find(m=>m.id==='unit-vault').sceneActions.find(m=>m.kind==='vault').startOffset);
});
test('invalid marker references and unordered action trajectories fail content validation',()=>{
 for(const mutate of [c=>c.modules[0].sceneActions[0].entityId='missing',c=>c.rules.vaultTrajectory[2][0]=.1,c=>c.modules[0].sceneActions.push({...c.modules[0].sceneActions[0]})]){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c,schema,lab).length);}
});
test('jump-pad impulse requires centre-foot contact alignment, not just body edge overlap',()=>{
 const s=fresh();s.reset(6);s.p.x=202.1;s.step();assert.equal(s.coverage.JumpPad,undefined);s.p.x=202.9;s.step();assert.equal(s.coverage.JumpPad,1);
});
test('run pose phase uses travelled distance and cannot rewind when speed changes',()=>{
 const s=fresh(),a=new CharacterAnimation(catalog,content.rules);s.p.gaitDistance=2;s.p.vx=6;const first=a.sample(s.snapshot(),s.world);s.p.vx=1;s.p.stateTime+=1;const second=a.sample(s.snapshot(),s.world);assert.equal(first.index,second.index);s.p.gaitDistance+=content.rules.runSpeed/catalog.sequences.run.fps;assert.equal(a.sample(s.snapshot(),s.world).index,first.index+1);
});
test('hanging poses remain stable across time/velocity thresholds and share calibrated scale',()=>{
 const s=fresh(),a=new CharacterAnimation(catalog,content.rules);for(const [state,id]of [['SwingGrapple','swing'],['Zipline','cable']]){s.p.state=state;s.p.stateTime=.1;const one=a.sample(s.snapshot(),s.world);s.p.stateTime=8;s.p.vy=-12;assert.equal(a.sample(s.snapshot(),s.world).index,one.index);assert.equal(one.sequence,id);}
 for(const c of catalog.clips.filter(c=>c.origin==='generated'))for(const f of c.frames)assert.ok(Math.abs(Math.hypot(f.headEstimate[0]-f.pelvis[0],f.headEstimate[1]-f.pelvis[1])/f.pixelsPerMetre-.8)<1e-9);
});
test('presentation interpolation is continuous, read-only, and never crosses pause/reset boundaries',()=>{
 const s=fresh(),before=s.snapshot();s.step();const after=s.snapshot(),immutable=JSON.stringify(after),half=presentationSnapshot(before,after,.5);assert.equal(half.player.x,(before.player.x+after.player.x)/2);assert.equal(JSON.stringify(after),immutable);s.pause();const paused=s.snapshot();assert.equal(presentationSnapshot(after,paused,.5),paused);s.retry();const reset=s.snapshot();assert.equal(presentationSnapshot(after,reset,.5),reset);
});

test('a queued action cannot skip its alignment plane at high speed',()=>{
 const c=structuredClone(content);c.modules.find(m=>m.id==='unit-vault').sceneActions.find(m=>m.kind==='vault').lateDistance=.01;const s=new Simulation(c,lab);s.reset(2);s.p.x=69.1;s.p.vx=24;s.step({pressed:['jump']});s.step();assert.equal(s.p.state,'Vault');assert.equal(s.p.vault.start[0],69.2);
});
test('prepared baseline clips contain 60-Hz interpolated poses with unchanged source ranges',()=>{
 for(const clip of catalog.clips.filter(c=>c.origin==='local-reference')){const seq=Object.values(catalog.sequences).find(s=>s.clip===clip.id);assert.equal(clip.sampling.outputPoseHz,60);assert.equal(seq.fps,60);assert.equal(clip.frames.length,(seq.sourceFrameRange[1]-seq.sourceFrameRange[0]+1)*3);assert.ok(Math.abs(clip.frames[1].sourceSampleIndex-clip.frames[0].sourceSampleIndex-1/3)<1e-10);}
});
test('vault hand placement reaches the obstacle contact during its locked phase',()=>{
 const s=fresh();s.reset(2);s.p.x=68;s.p.vx=6;s.step({pressed:['jump']});for(let i=0;i<80&&!(s.p.context?.progress>=.375);i++)s.step();assert.equal(s.p.state,'Vault');
 const renderer=new Renderer({getContext:()=>({})},s.world,lab,content.rules);renderer.animation=new CharacterAnimation(catalog,content.rules);for(const c of catalog.clips)for(const page of c.sheets)renderer.images.set(page.file,{});renderer.scale=100;renderer.xy=(x,y)=>[x*100,-y*100];const pose=renderer.spritePose(s.snapshot()),hand=pose.sample.frame.contact;
 const actual=[pose.point[0]+(hand[0]-pose.anchor[0])*pose.scale,pose.point[1]+(hand[1]-pose.anchor[1])*pose.scale],expected=renderer.xy(...s.p.context.contact);assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<.1);
 const snap=s.snapshot();snap.player.context.contact[0]+=100;assert.notEqual(s.p.context.contact[0],snap.player.context.contact[0]);
});
test('zipline attachment constrains the authoritative grip, independently of sprite proportions',()=>{
 const s=fresh();s.reset(5);s.p.x=165;s.p.y=1.7;s.p.state='Airborne';assert.ok(s.acquire('zipline',{}));assert.equal(s.p.state,'Zipline');const cable=s.world.cables.find(e=>e.id===s.p.attachment.id),at=cableAt(cable,s.p.attachment.s).at;assert.ok(Math.hypot(s.grip()[0]-at[0],s.grip()[1]-at[1])<1e-8);
});
