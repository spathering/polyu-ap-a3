import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/simulation.js';
import {createChallenge,validateFlow} from '../src/game-flow.js';
import {compileWorld,validateContent} from '../src/content.js';
import {wallCandidate} from '../src/scene-traversal.js';
import {rehearsalInput} from '../src/rehearsal.js';
import {CharacterAnimation} from '../src/animation.js';
import {EditorDocument} from '../src/editor-model.js';
import {FollowCamera} from '../src/camera.js';
import {Renderer} from '../src/renderer.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url))),content=read('../content/parkour.json'),schema=read('../Documents/Plans/Design/Schemas/content-package.schema.json'),lab=read('../content/lab-course.json'),flow=read('../content/game-flow.json'),fixtures=read('./fixtures/campaign-rehearsals.json'),catalog=read('../assets/character/animations.json');
function create(id='high-water',candidate=content){const c=createChallenge(candidate,schema,lab,flow,id);return new Simulation(c.content,c.lab);}
function hang(){const s=create();Object.assign(s.p,{x:5.5,y:1.25,state:'Airborne'});s.step({held:['jump']});assert.equal(s.p.state,'LedgeHang');return s;}

test('six additional courses have distinct authored maps and share exact editor geometry',()=>{
 const courses=flow.levels.filter(l=>l.levelId);assert.equal(courses.length,6);assert.equal(flow.levels.length,9);const maps=new Set(),before=JSON.stringify(content);
 for(const course of courses){const c=createChallenge(content,schema,lab,flow,course.id),w=compileWorld(c.content,c.lab),d=new EditorDocument(content,schema,course.levelId),preview=d.playtest(lab);assert.deepEqual(w.entities,compileWorld(preview.content,preview.lab).entities);assert.deepEqual(w.spawn,compileWorld(preview.content,preview.lab).spawn);maps.add(JSON.stringify(w.entities));assert.equal(c.lab.stations.at(-1).range[1],w.finish[0]);}
 assert.equal(maps.size,6);assert.equal(JSON.stringify(content),before);
});
for(const witness of fixtures.witnesses)test(`finite course production replay: ${witness.levelId}`,()=>{
 assert.equal(fixtures.contentRevision,content.contentRevision);assert.equal(fixtures.physicsVersion,content.physicsVersion);const s=create(witness.levelId),held=new Set(),animation=new CharacterAnimation(catalog,s.rules),seen=new Set();
 for(let frame=0;frame<witness.frames;frame++){s.step(rehearsalInput(witness,frame,held));seen.add(animation.sample(s.snapshot(),s.world).sequence);assert.notEqual(s.session,'Failed',`${frame}: ${s.reason}`);}
 assert.equal(s.session,'Completed');for(const id of witness.expect)assert.ok(s.coverage[id],id);assert.equal(s.failures,0);const before=JSON.stringify(s.snapshot());s.step();assert.equal(JSON.stringify(s.snapshot()),before);
 if(s.coverage.Mantle){assert.ok(seen.has('ledgeHang'));assert.ok(seen.has('mantle'));}if(s.coverage.WallJump)assert.ok(seen.has('wallJump'));if(s.coverage.Roll)assert.ok(seen.has('roll'));
});
test('authored section references must exist, be ordered and cover the real finite endpoints',()=>{
 for(const modify of [f=>f.levels[3].sections[0].from.socketId='missing',f=>f.levels[3].sections[1].from.socketId='entry',f=>f.levels[3].levelId='missing',f=>f.levels[3].sections.at(-1).to.socketId='cp1']){const f=structuredClone(flow);modify(f);assert.ok(validateFlow(f,lab,content).length);}
});
test('new traversal rules are optional for legacy packages but required when their abilities are enabled',()=>{
 const c=structuredClone(content);delete c.rules.sceneTraversal;assert.ok(validateContent(c,schema).length);c.rules.enabledAbilities=c.rules.enabledAbilities.filter(a=>!['wallJump','ledgeGrab','roll'].includes(a));assert.deepEqual(validateContent(c,schema),[]);const s=create('high-water',c);Object.assign(s.p,{x:5.5,y:1.25,state:'Airborne'});s.step({held:['jump']});assert.notEqual(s.p.state,'LedgeHang');
});
test('a ledge requires deliberate hold and freezes contact until a second press commits a swept mantle',()=>{
 const free=create();Object.assign(free.p,{x:5.5,y:1.25,state:'Airborne'});free.step();assert.notEqual(free.p.state,'LedgeHang');const s=hang(),contact=[s.p.x,s.p.y];for(let n=0;n<20;n++)s.step();assert.deepEqual([s.p.x,s.p.y],contact);s.step({pressed:['jump']});assert.equal(s.p.context.kind,'mantle');for(let n=0;n<60&&s.p.state==='Vault';n++)s.step();assert.equal(s.p.state,'Run');assert.ok(Math.abs(s.p.y-2.72)<1e-8);
});
test('a blocked ledge top rejects mantle and keeps the player hanging',()=>{
 const c=structuredClone(content),m=c.modules.find(m=>m.id==='unit-ledge');m.entities.push({id:'blocked-top',kind:'surface',rect:[6,3.1,7,2],oneWay:false,vaultable:false});const s=create('high-water',c);Object.assign(s.p,{x:5.5,y:1.25,state:'Airborne'});s.step({held:['jump']});assert.equal(s.p.state,'LedgeHang');s.step({pressed:['jump']});assert.equal(s.p.state,'LedgeHang');assert.ok(s.coverage.Rejected);assert.equal(s.p.vault,null);
});
test('drop and timeout clear the pin and forbid immediate re-grab; pause preserves the hang',()=>{
 const s=hang(),before=[s.p.x,s.p.y];s.pause();s.step({held:['jump']});assert.deepEqual([s.p.x,s.p.y],before);s.resume();s.step({pressed:['slide'],held:['jump']});assert.equal(s.p.state,'Airborne');assert.equal(s.p.ledge,null);assert.ok(s.ledgeReadyAt>s.time);const t=hang();for(let n=0;n<260&&t.p.state==='LedgeHang';n++)t.step();assert.equal(t.p.state,'Airborne');assert.ok(t.coverage.LedgeDrop);
});
test('wall rebound consumes one use per wall and airborne period',()=>{
 const s=create('wall-signal');Object.assign(s.p,{x:7.3,y:1.3,state:'Airborne',vy:2});s.step({pressed:['jump']});assert.equal(s.coverage.WallJump,1);assert.ok(s.p.vx<0&&s.p.vy>0);Object.assign(s.p,{x:7.3,y:1.3,state:'Airborne'});s.step({pressed:['jump']});assert.equal(s.coverage.WallJump,1);s.retry();assert.equal(s.wallJumps.size,0);
});
test('lethal contact in the ledge capture corridor cannot be bypassed by a pin',()=>{
 const s=create(),p={...s.p,x:5.2,y:1.25,state:'Airborne'},world={...s.world,hazards:[{id:'danger',kind:'hazard',rect:[5.5,1,.18,1]}]};assert.equal(wallCandidate(world,p,s.rules,'ledgeGrab'),null);
});
test('roll is deliberate, buffered near a hard landing, clears on pause, and respects head clearance',()=>{
 const s=create('soft-landing');Object.assign(s.p,{x:16,y:.2,state:'Airborne',vy:-10,vx:6});s.step({pressed:['slide']});for(let n=0;n<4&&s.p.state==='Airborne';n++)s.step();assert.equal(s.p.state,'Roll');assert.ok(s.coverage.RollQueued);assert.deepEqual(s.bodySize(),s.rules.slideBodySize);for(let n=0;n<40&&s.p.state==='Roll';n++)s.step();assert.ok(['Run','CrouchHold','Slide'].includes(s.p.state));
 const no=create('soft-landing');Object.assign(no.p,{x:16,y:.2,state:'Airborne',vy:-10});for(let n=0;n<5;n++)no.step();assert.ok(!no.coverage.Roll);
 const expired=create('soft-landing');Object.assign(expired.p,{x:16,y:2,state:'Airborne',vy:0});expired.step({pressed:['slide']});for(let n=0;n<45;n++)expired.step();assert.ok(!expired.coverage.Roll);
 const paused=create('soft-landing');Object.assign(paused.p,{x:16,y:2,state:'Airborne',vy:-10});paused.step({pressed:['slide']});assert.ok(paused.rollUntil>paused.time);paused.pause();assert.equal(paused.rollUntil,-Infinity);
});
test('hanging and mantling are visible across portrait and landscape camera aspects',()=>{
 for(const aspect of [.46,1.78,2.3]){const s=hang(),camera=new FollowCamera(s.rules.camera);camera.update(s.snapshot(),1/60,aspect,s.world);const p=s.p,half=camera.height/2;assert.ok(p.y>=camera.y-half&&p.y+s.rules.bodySize[1]<=camera.y+half);assert.ok(p.x>=camera.x-half*aspect&&p.x<=camera.x+half*aspect);s.step({pressed:['jump']});for(let n=0;n<50;n++){s.step();camera.update(s.snapshot(),1/60,aspect,s.world);assert.ok([camera.x,camera.y,camera.height].every(Number.isFinite));}}
});

test('roll recovery cannot stand under a low ceiling; a late buffered jump survives its clear exit',()=>{
 const s=create('soft-landing');Object.assign(s.p,{x:23,y:.02,state:'Roll',slideLeft:.001,vx:6});s.step();assert.equal(s.p.state,'CrouchHold');assert.deepEqual(s.bodySize(),s.rules.slideBodySize);
 const clear=create('soft-landing');Object.assign(clear.p,{x:35,y:.02,state:'Roll',slideLeft:.03,vx:6});clear.step({pressed:['jump']});for(let n=0;n<5;n++)clear.step();assert.equal(clear.p.state,'Airborne');assert.ok(clear.coverage.Jump);
});

test('the ledge hold and mantle support phase align the calibrated wrist to the actual corner',()=>{
 const s=hang(),r=new Renderer({getContext:()=>({})},s.world,s.lab,s.rules);r.scale=60;r.xy=(x,y)=>[x*60,-y*60];r.animation=new CharacterAnimation(catalog,s.rules);for(const c of catalog.clips)for(const sheet of c.sheets)r.images.set(sheet.file,{});
 const check=()=>{const pose=r.spritePose(s.snapshot()),f=pose.sample.frame,actual=pose.point.map((v,k)=>v+(f.contact[k]-pose.anchor[k])*pose.scale),target=r.xy(...s.p.context.contact);assert.ok(Math.hypot(...actual.map((v,k)=>v-target[k]))<1e-6);};check();s.step({pressed:['jump']});for(let n=0;n<24;n++){check();s.step();}
});
