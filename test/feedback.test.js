import test from 'node:test';import assert from 'node:assert/strict';
import {SemanticInput,controlBindings} from '../src/input.js';
import {GameAudio} from '../src/audio.js';import {restingRope,citySeed} from '../src/city.js';
import {Simulation} from '../src/simulation.js';import {createChallenge} from '../src/game-flow.js';import {CharacterAnimation} from '../src/animation.js';import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url))),c=read('content/parkour.json'),lab=read('content/lab-course.json'),schema=read('content/content-package.schema.json'),flow=read('content/game-flow.json'),catalog=read('assets/character/animations.json');
globalThis.window=new EventTarget();globalThis.document=new EventTarget();document.hidden=false;
const key={code:'KeyQ',target:{tagName:'CANVAS'},preventDefault(){}};
test('shared Q captures one semantic target and releases the same hold even after a cable comes into range',()=>{
 let zip=false;const input=new SemanticInput(c.rules.bindings,a=>a==='swingGrapple'?{id:'swing'}:a==='zipline'&&zip?{id:'cable'}:null,()=>{},32);
 input.keydown(key);assert.equal(input.consume(32).pressed[0].action,'swingGrapple');zip=true;input.keyup(key);assert.deepEqual(input.consume(32).released,['swingGrapple']);input.keydown(key);const frame=input.consume(32);assert.deepEqual(frame.pressed,[{action:'zipline',targetId:'cable'}]);input.keyup(key);assert.deepEqual(input.consume(32).released,['zipline']);assert.equal(controlBindings(c.rules.bindings).filter(b=>b.keys.includes('KeyQ')).length,1);input.destroy();
});
test('one touch rope button resolves both actions and does not retarget during a hold',()=>{
 let zip=false;const input=new SemanticInput(c.rules.bindings,a=>a==='zipline'&&zip?{id:'cable'}:null,()=>{},32);input.holdAction('rope',true);zip=true;input.holdAction('rope',false);const frame=input.consume(32);assert.equal(frame.pressed[0].action,'swingGrapple');assert.deepEqual(frame.released,['swingGrapple']);input.holdAction('rope',true);assert.equal(input.consume(32).pressed[0].action,'zipline');input.blur();assert.deepEqual(input.consume(32).held,[]);input.destroy();
});
test('mantle has no stationary recovery tail or second landing animation',()=>{
 const ch=createChallenge(c,schema,lab,flow,'high-water'),s=new Simulation(ch.content,ch.lab),anim=new CharacterAnimation(catalog,s.rules);Object.assign(s.p,{x:5.5,y:1.25,state:'Airborne'});s.step({held:['jump']});assert.equal(s.p.state,'LedgeHang');s.step({pressed:['jump']});
 for(let n=0;n<100&&['Vault','LedgeHang'].includes(s.p.state);n++){anim.sample(s.snapshot(),s.world);s.step();}
 assert.equal(s.p.state,'Run');assert.equal(s.p.landLeft,0);assert.equal(s.performance,null);assert.equal(anim.sample(s.snapshot(),s.world).sequence,'run');const x=s.p.x;
 for(let n=0;n<12;n++){s.step();assert.equal(anim.sample(s.snapshot(),s.world).sequence,'run');}assert.ok(s.p.x-x>1.1);
});
test('resting rope uses the actual lowered anchor and canonical grip height',()=>{
 const m=c.modules.find(m=>m.id==='unit-swing'),e={...m.entities[0],profile:c.profiles.find(p=>p.id===m.entities[0].profileId)},[top,end]=restingRope(e,c.rules);assert.ok(top[1]<10);assert.deepEqual(top,e.position);assert.equal(end[1],c.rules.gripOffset[1]);assert.ok(top[1]-end[1]<=e.profile.maxLength);assert.equal(citySeed('district-marathon'),citySeed('district-marathon'));assert.notEqual(citySeed('high-water'),citySeed('wall-signal'));
});
test('audio consumes each event once, respects mute/pause and discards old retry events',()=>{
 const a=new GameAudio(read('content/audio.json'));let played=[];a.play=id=>{if(a.settings.effects)played.push(id);};const snapshot=(serial,session='Playing',snap=1)=>({session,snap,player:{gaitDistance:0,state:'Run'},events:[{id:'Jump',serial,snap}]});a.update(snapshot(1));a.update(snapshot(2));a.update(snapshot(2));assert.deepEqual(played,['jump']);a.update(snapshot(3,'Paused'));assert.deepEqual(played,['jump']);a.update(snapshot(4,'Playing',2));assert.deepEqual(played,['jump']);a.settings.effects=false;a.update(snapshot(5,'Playing',2));assert.deepEqual(played,['jump']);
});
test('audio settings survive blocked or malformed storage and unavailable browser audio',async()=>{
 const a=new GameAudio(read('content/audio.json'),{storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}},Context:null});a.save();assert.equal(await a.unlock(),false);assert.equal(a.settings.volume,.65);
});
const fixtures=read('test/fixtures/campaign-rehearsals.json');
for(const witness of fixtures.witnesses)test(`physical controls finish ${witness.levelId} with the single Q key`,()=>{
 const ch=createChallenge(c,schema,lab,flow,witness.levelId),s=new Simulation(ch.content,ch.lab),input=new SemanticInput(c.rules.bindings,a=>s.preview(a),()=>{},32);
 for(let frame=0;frame<witness.frames;frame++){
  for(const e of witness.actions.filter(e=>e.frame===frame)){const code=c.rules.bindings.find(b=>b.action===e.action).keys[0];input[e.phase==='press'?'keydown':'keyup']({...key,code});}
  s.step(input.consume(32));
 }
 assert.equal(s.session,'Completed',s.reason);for(const e of witness.expect)assert.ok(s.coverage[e],e);input.destroy();
});
