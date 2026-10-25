import {createChallenge,recordCompletion,gameModes,levelsForMode,modeForLevel,nextLevel,selectionUrl} from './game-flow.js';
import {Simulation} from './simulation.js';
import {FollowCamera} from './camera.js';
import {Renderer} from './renderer.js';
import {SemanticInput} from './input.js';
import {presentationSnapshot} from './presentation.js';
const $=id=>document.getElementById(id),read=async path=>{const r=await fetch(path);if(!r.ok)throw Error(`${path}: HTTP ${r.status}`);return r.json();};
const keyLabel=code=>({Space:'SPACE',ArrowUp:'↑',ArrowDown:'↓',Escape:'ESC'}[code]||code.replace('Key','')),controlLabel=binding=>(binding.behaviour==='hold'?'HOLD ':'')+keyLabel(binding.keys[0]),moveName=kind=>({jump:'jump',slide:'slide',vault:'vault',climb:'climb',dashGrapple:'dash grapple',swingGrapple:'swing',zipline:'zipline'}[kind]||kind);
let sim,input,renderer,camera,challenge,flow,previous=null,last=0,accumulator=0,elapsedTicks=0,lastUI=0,completed=false,storageNotice='';
function clearTiming(){previous=null;accumulator=0;input?.clear();}
function restart(){clearTiming();sim.reset(0);elapsedTicks=0;completed=false;storageNotice='';$('next-level').hidden=true;}
function proceed(){if(!sim)return;clearTiming();if(sim.session==='Completed')restart();else if(sim.session==='Failed')sim.retry();else sim.resume();$('game').focus({preventScroll:true});update();}
function update(){
 const s=sim.snapshot(),station=challenge.lab.stations[s.stationIndex],ratio=Math.max(0,Math.min(1,(s.player.x-challenge.spawn[0])/(challenge.finish[0]-challenge.spawn[0])));
 $('section-name').textContent=`${String(s.stationIndex+1).padStart(2,'0')} / ${String(challenge.lab.stations.length).padStart(2,'0')} · ${station.name.toUpperCase()}`;$('progress').textContent=`${Math.floor(ratio*100)}%`;$('progress-bar').style.width=`${ratio*100}%`;$('clock').textContent=`${(elapsedTicks/sim.rules.fixedStepHz).toFixed(2)} s`;
 const p=s.player,jump=s.targets.jump,matched=s.matchedScenes?.find(m=>m.status==='confirmed')||s.matchedScenes?.[0],sceneHint=s.performance?`${moveName(s.performance.kind).toUpperCase()} · ${{timely:'Good timing.',late:'Late recovery.',missed:'Missed the move.'}[s.performance.outcome]}`:matched?matched.status==='confirmed'?'Move ready · keep your line.':`${controlLabel(sim.rules.bindings.find(b=>b.action===matched.input))} · ${moveName(matched.kind)} · ${p.x<=matched.timelyUntil?'press now':'late chance'}`:null;
 $('hint').textContent=p.state==='LedgeHang'?(jump?'SPACE climb up · S drop':'Top blocked · S drop'):p.context?.kind==='mantle'?'Climbing over the edge.':p.state==='Roll'?'Rolling through the landing · head clearance controls recovery':sim.rollUntil>=sim.time?'ROLL READY · waiting for ground contact':sceneHint?sceneHint:s.pendingAction?'Move ready · keep running.':p.state==='Airborne'&&jump&&!jump.markerId?(jump.kind==='ledgeGrab'?'Hold SPACE · catch the marked ledge':'SPACE · rebound from the marked wall'):p.context?.kind==='wallJump'?'Wall rebound · look for the landing':station.hint;
 $('motion-state').textContent=s.performance?.outcome.toUpperCase()||p.context?.kind?.toUpperCase()||p.state.toUpperCase();$('art-status').textContent=renderer.artStatus;
 for(const b of $('action-buttons').children)b.classList.toggle('eligible',!!s.targets[b.dataset.action]);
 $('overlay').hidden=s.session==='Playing';$('pause').textContent=s.session==='Paused'?'▶':'Ⅱ';$('pause').setAttribute('aria-label',s.session==='Paused'?'Resume':'Pause');
 if(s.session==='Playing')return;
 const done=s.session==='Completed',failed=s.session==='Failed',ready=s.session==='Ready';
 $('restart-run').hidden=ready||done;
 $('overlay-kicker').textContent=done?'LINE COMPLETE':failed?'READ THE SCENE. TRY AGAIN.':ready?challenge.entry.difficulty:'RUN PAUSED';
 $('overlay-title').textContent=done?'You found your line.':failed?'Keep going.':ready?challenge.entry.title:'Take a breath.';
 $('overlay-detail').textContent=done?`${(elapsedTicks/sim.rules.fixedStepHz).toFixed(2)} seconds of running time. ${storageNotice||'Your best time is saved on this device.'}`:failed?`${s.reason}. Retry begins at the current section; the run timer continues.`:ready?challenge.entry.description:s.reason;
 $('continue').textContent=done?'Run again ↗':failed?'Retry section ↗':ready?'Start running ↗':'Resume ↗';$('continue').disabled=false;
}
function frame(now){
 const dt=last?Math.min(challenge.lab.maxFrameSeconds,(now-last)/1000):0;last=now;
 if(sim.session==='Playing')accumulator+=dt;else accumulator=0;
 if(sim.session!=='Playing'){
  previous=null;const controls=input.consume(sim.rules.maxBufferedActions);if(controls.pressed.some(c=>c.action==='retry')&&sim.session==='Completed')restart();else if(controls.pressed.some(c=>['pause','retry'].includes(c.action))){sim.step(controls);clearTiming();}
 }else{
  let steps=0;while(accumulator>=sim.dt&&steps<challenge.lab.maxStepsPerFrame){const controls=input.consume(sim.rules.maxBufferedActions);previous=sim.snapshot();sim.step(controls);if(!controls.pressed.some(c=>['pause','retry'].includes(c.action)))elapsedTicks++;accumulator-=sim.dt;steps++;if(sim.session!=='Playing'){clearTiming();break;}}
  if(steps===challenge.lab.maxStepsPerFrame)accumulator=Math.min(accumulator,sim.dt);
 }
 if(sim.session==='Completed'&&!completed){completed=true;let storage;try{storage=localStorage;}catch{}if(!recordCompletion(storage,challenge.entry.id,elapsedTicks/sim.rules.fixedStepHz))storageNotice='Browser storage is unavailable; this result could not be saved.';const next=nextLevel(flow,challenge.entry.id);if(next){$('next-level').href=`play.html?level=${encodeURIComponent(next.id)}`;$('next-level').hidden=false;}}
 const snapshot=sim.snapshot(),visible=presentationSnapshot(previous,snapshot,accumulator/sim.dt),rect=$('game').getBoundingClientRect();camera.update(visible,dt,rect.width/Math.max(1,rect.height),sim.world);renderer.draw(visible,camera);
 if(now-lastUI>50){update();lastUI=now;}requestAnimationFrame(frame);
}
$('continue').onclick=proceed;$('retry').onclick=()=>{if(!sim)return;clearTiming();if(sim.session==='Completed')restart();else sim.retry();$('game').focus({preventScroll:true});update();};$('pause').onclick=()=>{if(!sim||sim.session==='Completed'||sim.session==='Failed'||sim.session==='Ready')return;clearTiming();if(sim.session==='Paused')sim.resume();else sim.pause();update();};
$('restart-run').onclick=()=>{if(!sim)return;restart();$('game').focus({preventScroll:true});update();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('fullscreen').title='Fullscreen is unavailable in this browser; the scene already fills the page.';}};
document.addEventListener('keydown',e=>{if(e.key==='?'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){e.preventDefault();$('controls-panel').open=!$('controls-panel').open;}});
try{
 const [content,schema,lab,loadedFlow]=await Promise.all([read('content/parkour.json'),read('Documents/Plans/Design/Schemas/content-package.schema.json'),read('content/lab-course.json'),read('content/game-flow.json')]);flow=loadedFlow;const id=new URLSearchParams(location.search).get('level')||levelsForMode(flow,gameModes(flow).find(m=>m.status==='available').id)[0].id;challenge=createChallenge(content,schema,lab,flow,id);
 for(const a of document.querySelectorAll('[data-level-select]'))a.href=selectionUrl(flow,id);
 sim=new Simulation(challenge.content,challenge.lab,{playing:false});camera=new FollowCamera(sim.rules.camera);renderer=new Renderer($('game'),sim.world,challenge.lab,sim.rules);renderer.loadArt();input=new SemanticInput(sim.rules.bindings,kind=>sim.preview(kind),()=>{clearTiming();sim.pause('Focus lost — resume when ready.');},sim.rules.maxBufferedActions);
 document.title=`${challenge.entry.title} · Motion / Run`;$('level-title').textContent=challenge.entry.title;$('level-subtitle').textContent=`${modeForLevel(flow,id).title.toUpperCase()} / ${challenge.entry.subtitle.replace(/^\d+ \/ /,'').toUpperCase()}`;
 for(const binding of sim.rules.bindings.filter(b=>!['pause','retry'].includes(b.action))){const b=document.createElement('button');b.dataset.action=binding.action;b.className='action-key';const key=document.createElement('kbd');key.textContent=controlLabel(binding);b.append(key,{jump:'Jump / climb',slide:'Slide',dashGrapple:'Dash',swingGrapple:'Swing',zipline:'Cable'}[binding.action]);b.onpointerdown=e=>{e.preventDefault();$('game').focus({preventScroll:true});b.setPointerCapture(e.pointerId);input.holdAction(binding.action,true);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>input.holdAction(binding.action,false);$('action-buttons').append(b);}
 update();requestAnimationFrame(frame);
}catch(error){$('overlay-title').textContent='This line could not load.';$('overlay-detail').textContent=error.message;$('continue').textContent='Try loading again';$('continue').disabled=false;$('continue').onclick=()=>location.reload();$('level-title').textContent='Level unavailable';}
