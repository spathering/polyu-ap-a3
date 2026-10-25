import {Simulation} from './simulation.js';
export function rehearsalInput(witness,frame,held){
 const pressed=[],released=[];for(const event of witness.actions.filter(a=>a.frame===frame)){if(event.phase==='press'){pressed.push(event.action);held.add(event.action);}else{released.push(event.action);held.delete(event.action);}}return {pressed,released,held:[...held]};
}
export function runRehearsal(content,lab,witness,observer=()=>{}){
 const sim=new Simulation(content,lab),station=lab.stations.findIndex(s=>s.id===witness.stationId);if(station<0)throw Error('Unknown rehearsal station');sim.reset(station);const held=new Set();
 for(let frame=0;frame<witness.frames;frame++){sim.step(rehearsalInput(witness,frame,held));observer(sim,frame);}
 return {id:witness.id,missing:witness.expect.filter(c=>!sim.coverage[c]),coverage:{...sim.coverage},session:sim.session,x:sim.p.x,y:sim.p.y,ticks:sim.tick,sim};
}
export function runFiniteRehearsal(content,course,witness){
 const sim=new Simulation(content,course),held=new Set();for(let frame=0;frame<witness.frames;frame++)sim.step(rehearsalInput(witness,frame,held));
 return {id:witness.levelId,session:sim.session,missing:witness.expect.filter(id=>!sim.coverage[id]),failures:sim.failures,ticks:sim.tick,coverage:{...sim.coverage}};
}
