import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Simulation} from '../src/simulation.js';import {createChallenge} from '../src/game-flow.js';import {QuickRetry} from '../src/quick-retry.js';import {GameAudio} from '../src/audio.js';import {screenRoute,routeFromShell,screenURL,shellURL} from '../src/screen-route.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url))),c=read('content/parkour.json'),schema=read('content/content-package.schema.json'),lab=read('content/lab-course.json'),flow=read('content/game-flow.json');
const create=id=>{const ch=createChallenge(c,schema,lab,flow,id);return new Simulation(ch.content,ch.lab);};
test('a single tapped jump catches and climbs a second-height ledge without another signal',()=>{
 const s=create('high-water');let gripTicks=0;for(let n=0;n<130;n++){s.step(n===20?{pressed:['jump']}:{});if(s.p.state==='LedgeHang')gripTicks++;assert.notEqual(s.session,'Failed',s.reason);}
 assert.equal(s.coverage.Jump,1);assert.equal(s.coverage.LedgeGrab,1);assert.equal(s.coverage.Mantle,1);assert.ok(s.p.x>6.5&&s.p.y>=2.7);assert.ok(gripTicks<=Math.ceil(c.rules.sceneTraversal.gripSettleSeconds*c.rules.fixedStepHz)+1);
});
test('first-height climbs keep moving horizontally through every playback tick',()=>{
 const s=create('high-water');s.reset(1);const marker=s.world.sceneActions.find(m=>m.kind==='climb');s.p.x=marker.startX-.1;s.p.vx=c.rules.runSpeed;s.step({pressed:['jump']});let frames=0;
 for(let n=0;n<90;n++){const x=s.p.x,climb=s.p.context?.kind==='climb';s.step();if(climb){assert.ok(s.p.x>x,`stalled at ${s.p.context?.progress}`);frames++;}if(frames&&s.p.state==='Run')break;}
 assert.ok(frames>=20&&frames<=27);assert.equal(s.p.state,'Run');assert.equal(s.p.landLeft,0);
});
test('sliding against the foot of the high ledge fails despite collision-skin micro-movement',()=>{
 const s=create('high-water');Object.assign(s.p,{x:5.6,y:.02,vx:6,vy:0,state:'Slide',slideLeft:2});let ticks=0;while(s.session==='Playing'&&ticks++<90)s.step();assert.equal(s.session,'Failed');assert.equal(s.reason,'Blocked at obstacle');assert.ok(ticks<40);const failedSnap=s.snap,r=new QuickRetry(c.rules.failureRetrySeconds);assert.equal(r.update(s,.05),false);for(let n=0;n<20&&s.snap===failedSnap;n++)r.update(s,1/60);assert.equal(s.session,'Playing');assert.equal(s.snap,failedSnap+1);assert.ok(s.p.x<5);
});
test('failed attempts restart the current section; pause and normal play never trigger quick retry',()=>{
 const s=create('high-water'),r=new QuickRetry(.18);s.reset(1);const x=s.p.x;s.fail('test');assert.equal(r.update(s,.1),false);assert.equal(r.update(s,.09),true);assert.equal(s.p.x,x);s.pause();assert.equal(r.update(s,5),false);assert.equal(s.session,'Paused');
});
test('one looping music source survives scene inactivity, pause, retry and menu changes',()=>{
 const a=new GameAudio(read('content/audio.json'));let starts=0,stops=0;const node=()=>({connect(){},disconnect(){},start(){starts++},stop(){stops++}});a.context={state:'running',currentTime:0,createBufferSource:node,createGain:()=>({connect(){},disconnect(){},gain:{value:0}})};a.master={};a.buffers.set('music',{});a.syncMusic();const source=a.music.node;
 for(const active of [true,false,true,false,true])a.setActive(active);assert.equal(a.music.node,source);assert.equal(starts,1);assert.equal(stops,0);a.settings.music=false;a.syncMusic();assert.equal(stops,1);assert.equal(a.music,null);
});
test('shell routes preserve repo prefixes and deep-link parameters without accepting external paths',()=>{
 const base='https://example.test/game/',r=screenRoute('pages/play.html?level=high-water',base);assert.deepEqual(r,{screen:'play',search:'?level=high-water'});assert.equal(screenURL(r,base),base+'pages/play.html?level=high-water');assert.deepEqual(routeFromShell(shellURL(r,base)),r);assert.equal(screenRoute('https://other.test/pages/play.html',base),null);assert.equal(screenRoute('../elsewhere/pages/play.html',base),null);assert.equal(screenRoute(base,base).screen,'home');
});
