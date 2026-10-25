import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createChallenge,validateFlow,readProgress,recordCompletion,gameModes,levelsForMode,modeForLevel,nextLevel,selectionUrl} from '../src/game-flow.js';
import {snappedTranslation,selectionAnchor} from '../src/editor-snap.js';
import {Simulation} from '../src/simulation.js';
import {FollowCamera} from '../src/camera.js';
import {PoseTransition} from '../src/pose-transition.js';
import {compileWorld,validateContent} from '../src/content.js';
import {rehearsalInput} from '../src/rehearsal.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const content=read('../content/parkour.json'),schema=read('../Documents/Plans/Design/Schemas/content-package.schema.json'),lab=read('../content/lab-course.json'),flow=read('../content/game-flow.json');
test('player modes partition all nine routes without copying geometry or enabling endless',()=>{
 const before=JSON.stringify(flow);assert.deepEqual(validateFlow(flow,lab,content),[]);assert.equal(levelsForMode(flow,'campaign').length,6);assert.equal(levelsForMode(flow,'training').length,3);assert.deepEqual(levelsForMode(flow,'endless'),[]);assert.deepEqual(levelsForMode(flow,'missing'),[]);assert.equal(gameModes(flow).find(m=>m.id==='endless').status,'coming-soon');assert.equal(new Set(gameModes(flow).flatMap(m=>levelsForMode(flow,m.id).map(l=>l.id))).size,9);assert.equal(JSON.stringify(flow),before);
});
test('next and return navigation stay inside the current mode even at mode boundaries',()=>{
 assert.equal(nextLevel(flow,'foundations').id,'airways');assert.equal(nextLevel(flow,'momentum'),null);assert.equal(nextLevel(flow,'roof-rhythm').id,'high-water');assert.equal(nextLevel(flow,'crosscurrent'),null);assert.equal(nextLevel(flow,'unknown'),null);assert.equal(modeForLevel(flow,'high-water').id,'campaign');assert.equal(selectionUrl(flow,'foundations'),'levels.html?mode=training');assert.equal(selectionUrl(flow,'high-water'),'levels.html?mode=campaign');
});
test('mode authoring rejects missing references, duplicate IDs and unavailable populated modes',()=>{
 for(const change of [f=>f.levels[0].modeId='missing',f=>f.modes[1].id=f.modes[0].id,f=>f.modes[0].status='coming-soon',f=>f.modes[2].status='available']){const f=structuredClone(flow);change(f);assert.ok(validateFlow(f,lab,content).length);}
});
test('legacy flow without mode metadata retains its original single catalogue navigation',()=>{
 const f=structuredClone(flow);delete f.modes;assert.deepEqual(validateFlow(f,lab,content),[]);assert.equal(levelsForMode(f,'finite').length,9);assert.equal(selectionUrl(f,'foundations'),'levels.html?mode=finite');assert.equal(nextLevel(f,'momentum').id,'roof-rhythm');
});
test('absolute grid snapping repairs an off-grid anchor and preserves batch spacing',()=>{
 const d=snappedTranslation([1.13,-.22],[.4,-.2],.3);assert.ok(Math.abs(1.13+d[0]-1.5)<1e-9);assert.ok(Math.abs(-.22+d[1]+.3)<1e-9);
 const other=[2.07,.44],moved=other.map((v,k)=>v+d[k]);assert.ok(Math.abs((moved[0]-(1.13+d[0]))-(other[0]-1.13))<1e-9);
 const free=snappedTranslation([1,2],[.1234,-.5678],0);assert.ok(Math.abs(free[0]-.1234)<1e-9&&Math.abs(free[1]+.5678)<1e-9);
 const l=content.finiteLevels[0];assert.deepEqual(selectionAnchor(content,l.id,null,['vault']),l.instances.find(i=>i.id==='vault').position);
});
test('challenge catalogue rejects stale, duplicate and nonconsecutive station references',()=>{
 assert.deepEqual(validateFlow(flow,lab),[]);for(const modify of [f=>f.levels[0].stationIds=['missing'],f=>f.levels[0].stationIds=['jump','vault'],f=>f.levels[1].id=f.levels[0].id]){const f=structuredClone(flow);modify(f);assert.ok(validateFlow(f,lab).length);}assert.throws(()=>createChallenge(content,schema,lab,flow,'missing'),/Unknown level/);
});
test('every selectable challenge derives immutable boundaries and identical source geometry',()=>{
 const before=JSON.stringify(content),source=compileWorld(content,lab);
 for(const level of flow.levels.filter(l=>l.stationIds)){const c=createChallenge(content,schema,lab,flow,level.id),w=compileWorld(c.content,c.lab);assert.deepEqual(validateContent(c.content,schema,c.lab),[]);assert.deepEqual(w.entities,source.entities);assert.ok(c.finish[0]>c.spawn[0]);assert.equal(c.lab.completionMode,'finish');assert.ok(Object.isFrozen(c.content.rules));assert.equal(c.lab.stations.length,level.stationIds.length);}
 assert.equal(JSON.stringify(content),before);
});
test('the first challenge completes with production input, freezes at finish and supports retry',()=>{
 const c=createChallenge(content,schema,lab,flow,'foundations'),s=new Simulation(c.content,c.lab),w=lab.witnesses.find(w=>w.id==='full-loop'),held=new Set();
 for(let n=0;n<w.frames&&s.session==='Playing';n++)s.step(rehearsalInput(w,n,held));assert.equal(s.session,'Completed');assert.ok(s.coverage.Jump&&s.coverage.Slide&&s.coverage.Vault);assert.equal(s.laps,0);const before=JSON.stringify(s.snapshot());s.step();assert.equal(JSON.stringify(s.snapshot()),before);s.step({pressed:['retry']});assert.equal(s.session,'Playing');assert.equal(s.pendingAction,null);
});
test('later challenge starts use their existing authored checkpoints',()=>{
 for(const [id,witness] of [['airways','dash'],['momentum','chain']]){const c=createChallenge(content,schema,lab,flow,id),s=new Simulation(c.content,c.lab),w=lab.witnesses.find(w=>w.id===witness),held=new Set();for(let n=0;n<w.frames&&s.session==='Playing';n++)s.step(rehearsalInput(w,n,held));assert.notEqual(s.session,'Failed');for(const event of w.expect.filter(e=>e!=='Lap'))assert.ok(s.coverage[event],`${id}: ${event}`);}
});
test('local completion preserves the best time and tolerates corrupt or blocked storage',()=>{
 let value='{broken';const storage={getItem:()=>value,setItem:(k,v)=>value=v};assert.deepEqual(readProgress(storage),{});assert.ok(recordCompletion(storage,'foundations',20));assert.ok(recordCompletion(storage,'foundations',25));assert.equal(readProgress(storage).foundations.bestSeconds,20);recordCompletion(storage,'foundations',18);assert.equal(readProgress(storage).foundations.bestSeconds,18);assert.equal(recordCompletion(undefined,'foundations',2),false);
});
test('a blocked approach cannot advertise or queue the obstacle behind a wall',()=>{
 const c=structuredClone(content),m=c.modules.find(m=>m.id==='unit-vault');m.entities.push({id:'occluder',kind:'surface',rect:[.1,0,.3,3],oneWay:false,vaultable:false});const s=new Simulation(c,lab);s.reset(2);assert.equal(s.preview('jump'),null);s.step({pressed:['jump']});assert.equal(s.pendingAction,null);assert.ok(s.coverage.Jump);
});
test('camera tracks target velocity with a bounded change and resets momentum on retry',()=>{
 const s=new Simulation(content,lab),c=new FollowCamera(content.rules.camera);let snap=s.snapshot();c.update(snap,1/60,1.8,s.world);const before=[...c.motion];s.step();snap=s.snapshot();c.update(snap,1/60,1.8,s.world);assert.ok(Math.hypot(...c.motion.map((v,k)=>v-before[k]))<=content.rules.camera.followAcceleration/60+1e-8);const paused={...snap,session:'Paused'},state=JSON.stringify(c);c.update(paused,1,1.8,s.world);assert.equal(JSON.stringify(c),state);s.retry();c.update(s.snapshot(),1/60,1.8,s.world);assert.deepEqual(c.motion,[0,0]);
});
test('existing 1.3 drafts without the added camera parameter retain finite derived follow behaviour',()=>{
 const c=structuredClone(content);delete c.rules.camera.followAcceleration;assert.deepEqual(validateContent(c,schema),[]);const s=new Simulation(c,lab),camera=new FollowCamera(c.rules.camera);camera.update(s.snapshot(),1/60,1.8,s.world);s.step();camera.update(s.snapshot(),1/60,1.8,s.world);assert.ok([...camera.motion,camera.x,camera.y].every(Number.isFinite));
});
test('pose stitching uses two preceding poses to continue local momentum, with contact lock priority',()=>{
 const p=new PoseTransition({transitionSeconds:.1,transitionMaxOffsetMetres:.65}),s=t=>({time:t,snap:1,player:{state:'Run'}}),pose=k=>({sample:{sequence:k}});p.update(s(0),pose('run'),[0,1]);p.update(s(.01),pose('run'),[0,1.01]);const result=p.update(s(.02),pose('rise'),[0,.8]);assert.ok(Math.abs(result.correction[1]-.22)<1e-9);assert.deepEqual(p.update({...s(.03),player:{state:'Vault',context:{kind:'vault'}}},pose('vault'),[0,.7]).correction,[0,0]);
});
