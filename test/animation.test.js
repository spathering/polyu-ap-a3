import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {CharacterAnimation} from '../src/animation.js';
import {Simulation} from '../src/simulation.js';
import {rehearsalInput} from '../src/rehearsal.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const catalog=read('../assets/character/animations.json'),content=read('../content/parkour.json'),lab=read('../content/lab-course.json');
const animation=new CharacterAnimation(catalog,content.rules);

test('all published atlas files exist, match hashes and contain every animation crop',()=>{
 for(const seq of Object.values(catalog.sequences)){
  const clip=catalog.clips.find(c=>c.id===seq.clip);assert.ok(clip);assert.ok(seq.fps>0);assert.ok(seq.range[0]>=0&&seq.range[1]<clip.frames.length);
 }
 for(const clip of catalog.clips){
  const dimensions=clip.sheets.map(sheet=>{
   const file=new URL('../'+sheet.file,import.meta.url);
   assert.ok(fs.existsSync(file),`Missing published atlas: ${sheet.file}`);
   const bytes=fs.readFileSync(file);assert.equal(createHash('sha256').update(bytes).digest('hex'),sheet.sha256);
   return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
  });
  for(const f of clip.frames){const [x,y,w,h]=f.rect;assert.ok(w>0&&h>0&&x>=0&&y>=0);assert.ok(clip.sheets[f.sheet]);assert.ok(f.anchor.every(Number.isFinite));if(dimensions[f.sheet]){assert.ok(x+w<=dimensions[f.sheet][0]);assert.ok(y+h<=dimensions[f.sheet][1]);}}
 }
});

test('real route snapshots select all traversal sprites without modifying physics',()=>{
 const seen=new Set();
 for(const w of lab.witnesses){const sim=new Simulation(content,lab),held=new Set();sim.reset(lab.stations.findIndex(s=>s.id===w.stationId));
  for(let i=0;i<w.frames;i++){sim.step(rehearsalInput(w,i,held));const snap=sim.snapshot(),before=JSON.stringify(snap),a=animation.sample(snap,sim.world);assert.ok(a.frame);seen.add(a.sequence);assert.equal(JSON.stringify(snap),before);}
 }
 for(const id of ['run','slide','rise','fall','land','vault','dash','pad','swing','cable','swingRelease','cableRelease'])assert.ok(seen.has(id),id);
});

test('animation freezes with simulation time, and retry cannot reuse an old pad event',()=>{
 const sim=new Simulation(content,lab);sim.reset(6);sim.p.x=202.9;sim.step();assert.equal(animation.sample(sim.snapshot(),sim.world).sequence,'pad');sim.pause();const frozen=animation.sample(sim.snapshot(),sim.world);for(let i=0;i<40;i++)sim.step();assert.deepEqual(animation.sample(sim.snapshot(),sim.world),frozen);
 sim.retry();sim.p.state='Airborne';sim.p.vy=2;assert.equal(animation.sample(sim.snapshot(),sim.world).sequence,'rise');
});

test('vault frame progress uses the current movement rule rather than a copied duration',()=>{
 const rules={...content.rules,vaultDurationSeconds:.6},a=new CharacterAnimation(catalog,rules),sim=new Simulation(content,lab);
 sim.p.state='Vault';sim.p.stateTime=.3;assert.equal(a.sample(sim.snapshot(),sim.world).index,23);
});
test('interpolated presentation cannot consume a future launch or release event',()=>{
 const sim=new Simulation(content,lab);sim.p.state='Airborne';sim.p.vy=2;const snap=structuredClone(sim.snapshot());snap.time=99/60;snap.events=[{id:'JumpPad',snap:snap.snap,tick:100,serial:1}];assert.equal(animation.sample(snap,sim.world).sequence,'rise');snap.time=100/60;assert.equal(animation.sample(snap,sim.world).sequence,'pad');
});
