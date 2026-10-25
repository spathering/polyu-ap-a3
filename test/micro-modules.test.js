import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EditorDocument,migrateLegacy,moduleOf,levelOf} from '../src/editor-model.js';
import {moduleSpace,heightUnit,blockAction} from '../src/module-space.js';
import {validateContent} from '../src/content.js';
import {Simulation} from '../src/simulation.js';
import {CharacterAnimation} from '../src/animation.js';
import {Renderer} from '../src/renderer.js';
import {FollowCamera} from '../src/camera.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const content=read('../content/parkour.json'),schema=read('../Documents/Plans/Design/Schemas/content-package.schema.json'),lab=read('../content/lab-course.json'),catalog=read('../assets/character/animations.json');
const fresh=()=>new EditorDocument(content,schema);
test('small module space is data-derived, includes anticipation and recovery, and reacts to rule changes',()=>{
 const m=moduleOf(content,'unit-vault'),before=JSON.stringify(m),b=moduleSpace(content,m);assert.ok(b[2]<12&&b[3]<5);assert.ok(b[0]<m.entities[0].rect[0]-content.rules.runSpeed*content.rules.contextApproachSeconds);assert.ok(b[0]+b[2]>m.entities[0].rect[0]+m.entities[0].rect[2]);assert.equal(JSON.stringify(m),before);
 const c=structuredClone(content);c.rules.actionRecoverySeconds+=.5;assert.ok(moduleSpace(c,moduleOf(c,m.id))[2]>b[2]);
});
test('all atomic pivots are entry-normalized and occupied bounds remain finite',()=>{
 for(const m of content.modules.filter(m=>m.tags.includes('prefab'))){assert.deepEqual(m.sockets.find(s=>s.role==='entry').position,[0,0]);const b=moduleSpace(content,m);assert.ok(b.every(Number.isFinite)&&b[2]>0&&b[3]>0);assert.ok(!('size'in m));}
 assert.ok(moduleSpace(content,moduleOf(content,'unit-blocked-anchor'))[2]>=content.profiles.find(p=>p.id==='dash-basic').range);
});
test('painted blocks reuse identical definitions and commit one recoverable transaction',()=>{
 const d=fresh(),before=JSON.stringify(d.state),a=d.paintBlock([350,0,2.4,heightUnit(content)]),b=d.paintBlock([360,0,2.4,heightUnit(content)]),l=levelOf(d.state.data,d.state.levelId);assert.equal(l.instances.find(i=>i.id===a).moduleId,l.instances.find(i=>i.id===b).moduleId);assert.equal(d.past.length,2);d.undo();d.undo();assert.equal(JSON.stringify(d.state),before);
});
test('a fresh brush stroke does not inherit a same-size block whose traversal was deliberately disabled',()=>{
 const d=fresh(),a=d.paintBlock([340,0,2.4,1.2]);d.transact('Disable auto traversal',(c,l)=>{const i=l.instances.find(i=>i.id===a);moduleOf(c,i.moduleId).entities[0].traversal='none';});const b=d.paintBlock([350,0,2.4,1.2]),l=levelOf(d.state.data,d.state.levelId);assert.notEqual(l.instances.find(i=>i.id===a).moduleId,l.instances.find(i=>i.id===b).moduleId);assert.equal(moduleOf(d.state.data,l.instances.find(i=>i.id===b).moduleId).entities[0].traversal,'auto');
});
test('the block height unit and automatic traversal follow the same character limits',()=>{
 const d=fresh();d.paintBlock([340,0,1.2,heightUnit(content)]);d.paintBlock([345,0,2.4,heightUnit(content)]);d.paintBlock([355,0,2.4,heightUnit(content)*2]);const result=d.playtest(lab),sim=new Simulation(result.content,result.lab);assert.ok(sim.world.sceneActions.some(a=>a.kind==='vault'&&a.startX>330));assert.ok(sim.world.sceneActions.some(a=>a.kind==='climb'&&a.startX>340));assert.ok(!sim.world.sceneActions.some(a=>a.startX>352));assert.equal(blockAction(content,3,heightUnit(content)*2),'solid');
});
test('drawing into a shared prefab updates every instance through one geometry owner',()=>{
 const d=fresh();d.paintBlock([1,0,2.4,heightUnit(content)],{moduleId:'unit-pad'});const result=d.playtest(lab),sim=new Simulation(result.content,result.lab);assert.ok(sim.world.sceneActions.some(a=>a.id.startsWith('pad/')&&a.kind==='climb'));assert.ok(sim.world.sceneActions.some(a=>a.id.startsWith('chain-pad/')&&a.kind==='climb'));
});
test('a drawn wide low ledge commits a swept climb and lands on its top',()=>{
 const d=fresh();d.newLevel('paint-test','unit-ground');d.paintBlock([2,0,2.4,heightUnit(content)]);const result=d.playtest(lab),sim=new Simulation(result.content,result.lab);sim.step({pressed:['jump']});for(let i=0;i<90&&!sim.coverage.Climb;i++)sim.step();assert.equal(sim.coverage.Climb,1);for(let i=0;i<60&&sim.p.state==='Vault';i++)sim.step();assert.equal(sim.p.state,'Run');assert.ok(Math.abs(sim.p.y-(heightUnit(content)+content.rules.collisionSkin))<1e-8);assert.ok(sim.coverage.Land);
});
test('compact stacked one-H steps can chain climbs using relative height and the same input intent',()=>{
 const d=fresh();d.newLevel('compact-steps','unit-ground');d.paintBlock([2,0,2.4,1.2]);d.paintBlock([3.2,1.2,2.4,1.2]);const t=d.playtest(lab),s=new Simulation(t.content,t.lab);s.step({pressed:['jump']});for(let n=0;n<120&&!(s.p.context?.kind==='climb'&&s.p.context.progress>=.82);n++)s.step();s.step({pressed:['jump']});for(let n=0;n<90&&(s.coverage.Climb<2||s.p.state==='Vault');n++)s.step();assert.equal(s.coverage.Climb,2);assert.equal(s.p.state,'Run');assert.ok(Math.abs(s.p.y-2.42)<1e-8);assert.equal(s.p.attachment,null);
});
test('climb preview scaffold is derived and cannot modify the authored package',()=>{
 const d=fresh(),before=JSON.stringify(d.state),result=d.playtest(lab,{moduleId:'unit-climb'}),sim=new Simulation(result.content,result.lab);assert.equal(result.scaffold,true);assert.ok(sim.world.surfaces.some(e=>e.id.startsWith('support/')));assert.equal(JSON.stringify(d.state),before);
});
test('legacy conversion preserves original geometry and removes obsolete fixed-size boxes explicitly',()=>{
 const old=structuredClone(content);old.schemaVersion='1.2.0';for(const m of old.modules)m.size=[32,18];delete old.rules.climbMaxHeight;const before=JSON.stringify(old),converted=migrateLegacy(old,content);assert.equal(converted.schemaVersion,'1.3.0');assert.deepEqual(validateContent(converted,schema),[]);assert.deepEqual(converted.modules[0].entities,old.modules[0].entities);assert.equal(JSON.stringify(old),before);assert.ok(converted.modules.every(m=>!m.size));
});
test('invalid painted geometry or climb rules leave the active draft intact',()=>{
 const d=fresh(),before=d.state;assert.throws(()=>d.paintBlock([0,0,0,1]));assert.equal(d.state,before);assert.throws(()=>d.transact('Invalid climb',c=>c.rules.climbTrajectory.at(-1)[2]=0));assert.equal(d.state,before);
});
test('captured clear grapple target remains eligible when a competing anchor ranks ahead',()=>{
 const c=structuredClone(content),m=moduleOf(c,'unit-dash'),i=c.finiteLevels[0].instances.find(i=>i.moduleId===m.id);m.entities.push({id:'competitor',kind:'anchor',profileId:'dash-basic',position:[116-i.position[0],3]});const s=new Simulation(c,lab);Object.assign(s.p,{x:108,y:1,state:'Airborne'});assert.equal(s.previewTarget('dashGrapple').id,'dash/competitor');assert.ok(s.acquire('dashGrapple',{targetId:'dash/dash-anchor'}));assert.equal(s.p.attachment.id,'dash/dash-anchor');
});
test('overheight marked obstacles do not advertise an incompatible vault',()=>{
 const c=structuredClone(content);moduleOf(c,'unit-vault').entities.find(e=>e.vaultable).rect[3]=c.rules.vaultMaxHeight+.5;const s=new Simulation(c,lab);s.reset(2);s.p.x=68;assert.equal(s.preview('jump'),null);s.step({pressed:['jump']});assert.notEqual(s.p.state,'Vault');
});
test('the end of a vault can retain an early next-action intent without a second motion owner',()=>{
 const c=structuredClone(content),m=moduleOf(c,'unit-vault'),first=m.entities[0];m.entities.push({...first,id:'second',rect:[first.rect[0]+3.8,...first.rect.slice(1)]});m.sceneActions.push({...m.sceneActions[0],id:'second-vault',entityId:'second'});const s=new Simulation(c,lab);s.reset(2);s.p.x=68;s.p.vx=6;s.step({pressed:['jump']});for(let n=0;n<100&&!(s.p.context?.progress>=.97);n++)s.step();s.step({pressed:['jump']});assert.ok(s.pendingAction||s.coverage.Vault>=2);for(let n=0;n<30&&s.coverage.Vault<2;n++)s.step();assert.equal(s.coverage.Vault,2);assert.equal(s.p.attachment,null);
});
test('vault velocity describes actual travel and recovery uses an inherited forward speed',()=>{
 const s=new Simulation(content,lab);s.reset(2);s.p.x=68;s.p.vx=9;s.step({pressed:['jump']});for(let n=0;n<30&&s.p.state!=='Vault';n++)s.step();const x=s.p.x;s.step();assert.ok(Math.abs(s.p.vx-(s.p.x-x)/s.dt)<1e-8);for(let n=0;n<70&&s.p.state==='Vault';n++)s.step();assert.ok(s.p.vx>=content.rules.vaultExitSpeed);assert.ok(s.p.landLeft>0);
});
test('return to running chooses the closest calibrated gait phase while remaining render-only',()=>{
 const a=new CharacterAnimation(catalog,content.rules),s=new Simulation(content,lab),old=s.snapshot(),land={...old,time:1,events:[{id:'Land',tick:60,snap:old.snap,serial:1}],player:{...old.player,vx:6,landLeft:.1}};const previous=a.sample(land,s.world),run={...land,time:1.3,events:[],player:{...land.player,landLeft:0,gaitDistance:2}},sample=a.sample(run,s.world),weights=catalog.timing.poseMatchWeights,cost=f=>f.poseSignature.reduce((sum,v,k)=>sum+(v-previous.frame.poseSignature[k])**2*weights[k],0),clip=catalog.clips.find(c=>c.id==='run');assert.equal(sample.sequence,'run');assert.ok(cost(sample.frame)<=Math.min(...clip.frames.map(cost))+1e-8);assert.equal(s.p.gaitDistance,0);
});
test('climb snapshots choose their dedicated prepared action clip',()=>{
 const a=new CharacterAnimation(catalog,content.rules),s=new Simulation(content,lab),snap=s.snapshot(),view={...snap,player:{...snap.player,state:'Vault',context:{kind:'climb',progress:.5}}};assert.equal(a.sample(view,s.world).sequence,'climb');
});
test('the calibrated climb hand reaches the actual painted ledge during its locked phase',()=>{
 const d=fresh();d.newLevel('climb-contact','unit-ground');d.paintBlock([2,0,2.4,1.2]);const t=d.playtest(lab),s=new Simulation(t.content,t.lab);s.step({pressed:['jump']});for(let n=0;n<120&&!(s.p.context?.progress>=.4);n++)s.step();assert.equal(s.p.context?.kind,'climb');const renderer=new Renderer({getContext:()=>({})},s.world,t.lab,content.rules);renderer.animation=new CharacterAnimation(catalog,content.rules);renderer.scale=100;renderer.xy=(x,y)=>[x*100,-y*100];for(const clip of catalog.clips)for(const page of clip.sheets)renderer.images.set(page.file,{});const pose=renderer.spritePose(s.snapshot()),hand=pose.sample.frame.contact,actual=pose.point.map((v,i)=>v+(hand[i]-pose.anchor[i])*pose.scale),expected=renderer.xy(...s.p.context.contact);assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<.1);
});
test('crouching cannot lower the camera focus merely by changing collider height',()=>{
 const rules={...content.rules.camera,deadZoneSize:[.01,.01]},s=new Simulation(content,lab),camera=new FollowCamera(rules),run=structuredClone(s.snapshot());camera.update(run,s.dt,2,s.world);const y=camera.y,slide={...run,size:content.rules.slideBodySize,player:{...run.player,state:'Slide'}};for(let n=0;n<20;n++)camera.update(slide,s.dt,2,s.world);assert.equal(camera.y,y);
});
test('automatic and authored detector IDs share one validated namespace',()=>{
 const c=structuredClone(content),m=moduleOf(c,'unit-climb');m.entities.push({id:'other',kind:'surface',rect:[10,0,1,.6],oneWay:false,vaultable:true});m.sceneActions.push({...moduleOf(c,'unit-vault').sceneActions[0],id:'auto-ledge',entityId:'other'});assert.ok(validateContent(c,schema).some(e=>e.includes('compiled action marker')));
});
