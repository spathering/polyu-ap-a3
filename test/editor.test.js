import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EditorDocument,layoutWarnings,moduleOf,levelOf,socketPosition} from '../src/editor-model.js';
import {Simulation} from '../src/simulation.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const content=read('../content/parkour.json'),schema=read('../Documents/Plans/Design/Schemas/content-package.schema.json'),lab=read('../content/lab-course.json');
const fresh=()=>new EditorDocument(content,schema);
test('the authored circuit is assembled from nine canonical movement prefabs with aligned seams',()=>{
 const d=fresh();assert.equal(d.state.data.modules.length,9);assert.equal(levelOf(d.state.data,d.state.levelId).instances.length,9);assert.deepEqual(layoutWarnings(d.state.data,d.state.levelId),[]);
});
test('a batch drag is one atomic undo/redo step and cannot mutate the source',()=>{
 const d=fresh(),before=JSON.stringify(d.state);d.move(['slide','vault'],1,.5);assert.equal(d.past.length,1);assert.equal(levelOf(d.state.data,d.state.levelId).instances.find(i=>i.id==='slide').position[0],33);assert.equal(content.finiteLevels[0].instances[1].position[0],32);
 d.undo();assert.equal(JSON.stringify(d.state),before);d.redo();assert.equal(d.past.length,1);assert.ok(Object.isFrozen(d.state.data.modules[0]));
});
test('invalid geometry and malformed imports leave draft and history unchanged',()=>{
 const d=fresh(),before=d.state;assert.throws(()=>d.transact('Invalid',data=>data.modules[0].entities[0].rect[2]=-1));assert.equal(d.state,before);assert.equal(d.past.length,0);
 const broken=structuredClone(content);broken.modules=[];assert.throws(()=>d.replace(broken,'motion-lab'));assert.equal(d.state,before);
});
test('placing a prefab after finish aligns sockets and extends finish without duplicating its definition',()=>{
 const d=fresh(),id=d.add('unit-pad',[0,0],{after:'recovery'}),l=levelOf(d.state.data,d.state.levelId);assert.equal(l.finish.instanceId,id);assert.equal(d.state.data.modules.length,9);const link=l.connections.at(-1);assert.deepEqual(socketPosition(d.state.data,l,link.from),socketPosition(d.state.data,l,link.to));
});
test('inserting in a connected route shifts downstream units and keeps both seams coherent in one undo step',()=>{
 const d=fresh(),before=JSON.stringify(d.state),id=d.add('unit-pad',[0,0],{after:'jump'}),l=levelOf(d.state.data,d.state.levelId);assert.equal(l.instances.find(i=>i.id==='slide').position[0],64);assert.ok(l.connections.some(c=>c.from.instanceId===id&&c.to.instanceId==='slide'));assert.deepEqual(layoutWarnings(d.state.data,d.state.levelId),[]);assert.equal(d.past.length,1);d.undo();assert.equal(JSON.stringify(d.state),before);
});
test('prefab entity duplication copies detector references; deletion removes dependent detectors atomically',()=>{
 const d=fresh(),[id]=d.duplicate(['vault-block'],{moduleId:'unit-vault'});let m=moduleOf(d.state.data,'unit-vault');assert.equal(m.sceneActions.length,2);assert.equal(m.sceneActions.at(-1).entityId,id);
 d.remove([id],{moduleId:'unit-vault'});m=moduleOf(d.state.data,'unit-vault');assert.equal(m.sceneActions.length,1);d.undo();assert.equal(moduleOf(d.state.data,'unit-vault').sceneActions.length,2);
});
test('delete protects endpoint references and prunes obsolete connections for ordinary units',()=>{
 const d=fresh();assert.throws(()=>d.remove(['jump']),/spawn\/finish/);d.remove(['slide']);const l=levelOf(d.state.data,d.state.levelId);assert.ok(!l.instances.some(i=>i.id==='slide'));assert.ok(!l.connections.some(c=>c.from.instanceId==='slide'||c.to.instanceId==='slide'));
});
test('seam diagnostics identify displaced units and connect/align repairs both sides',()=>{
 const d=fresh();d.move(['slide'],3,2);assert.ok(layoutWarnings(d.state.data,d.state.levelId).length);d.align(['jump','slide','vault']);assert.deepEqual(layoutWarnings(d.state.data,d.state.levelId),[]);
});
test('quick test uses a frozen draft and the production simulator while edits/selection stay independent',()=>{
 const d=fresh();d.move(['pad'],1,0);const before=JSON.stringify(d.state),compiled=d.playtest(lab,{fromInstance:'pad'}),sim=new Simulation(compiled.content,compiled.lab);assert.equal(sim.world.spawn[0],193);for(let i=0;i<120;i++)sim.step();assert.equal(JSON.stringify(d.state),before);assert.ok(Object.isFrozen(compiled.content));assert.equal(compiled.lab.stations.length,1);
});
test('isolated prefab test derives its layout and spawn from existing sockets',()=>{
 const d=fresh(),before=JSON.stringify(d.state),compiled=d.playtest(lab,{moduleId:'unit-vault'}),sim=new Simulation(compiled.content,compiled.lab);assert.equal(sim.world.spawn[0],0);assert.equal(sim.world.finish[0],32);assert.ok(sim.world.surfaces.some(e=>e.vaultable));assert.equal(JSON.stringify(d.state),before);
});
test('new level, import/export round-trip and divergent edits preserve valid history',()=>{
 const d=fresh();d.newLevel('rooftop-01','unit-slide');assert.equal(d.state.levelId,'rooftop-01');const exported=JSON.parse(JSON.stringify(d.state.data));const e=new EditorDocument(exported,schema,'rooftop-01');assert.deepEqual(e.state,d.state);d.undo();assert.equal(d.state.levelId,'motion-lab');d.move(['slide'],1,0);assert.equal(d.future.length,0);
});
