import {validateContent,deepFreeze} from './content.js';
import {Simulation} from './simulation.js';
import {FollowCamera} from './camera.js';
import {Renderer} from './renderer.js';
import {SemanticInput} from './input.js';
import {rehearsalInput} from './rehearsal.js';
import {presentationSnapshot} from './presentation.js';
const $=id=>document.getElementById(id);
let previousSnapshot=null,content,schema,lab,sim,camera,renderer,input,demo=null,accumulator=0,last=0,lastUI=0,lastEvent=-1,lastStation=null;
const read=async path=>{const response=await fetch(path);if(!response.ok)throw Error(`${path}: HTTP ${response.status}`);return response.json();};
const keyLabel=code=>({Space:'SPACE',ArrowUp:'↑',ArrowDown:'↓',Escape:'ESC'}[code]||code.replace('Key',''));
function createRuntime(candidate,{playing=false}={}){
 const errors=validateContent(candidate,schema,lab);if(errors.length)throw Error(errors.join('\n'));
 input?.destroy();demo=null;previousSnapshot=null;content=deepFreeze(candidate);sim=new Simulation(content,lab,{playing});camera=new FollowCamera(content.rules.camera);renderer=new Renderer($('game'),sim.world,lab,content.rules);renderer.debug=$('debug').checked;renderer.useSprites=$('art-mode').value==='sprites';renderer.loadArt();
 input=new SemanticInput(content.rules.bindings,kind=>sim.preview(kind),()=>{accumulator=0;previousSnapshot=null;sim.pause('Focus lost — input cleared');},content.rules.maxBufferedActions);accumulator=0;last=0;lastEvent=-1;
 for(const name of ['runSpeed','jumpVelocity','gravity'])$('tuning').elements[name].value=content.rules[name];$('tuning').elements.baseViewHeight.value=content.rules.camera.baseViewHeight;
 $('tuning').elements.baseViewHeight.min=content.rules.camera.minViewHeight;$('tuning').elements.baseViewHeight.max=content.rules.camera.maxViewHeight;$('tuning').elements.runSpeed.max=content.rules.maxHorizontalSpeed;
 $('build-status').textContent=`${content.rules.fixedStepHz} HZ / ${content.physicsVersion.toUpperCase()}`;
 buildControls();updateUI(sim.snapshot());
}
function buildControls(){
 $('stations').replaceChildren(...lab.stations.map((station,i)=>{const button=document.createElement('button');button.className='station-button';button.setAttribute('aria-label',`Station ${i+1}: ${station.name}`);const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0');button.append(number,station.name);button.onclick=()=>{demo=null;input.clear();accumulator=0;sim.reset(i);const witness=lab.witnesses.find(w=>w.stationId===station.id);if(witness)$('demo-select').value=witness.id;updateUI(sim.snapshot());$('game').focus({preventScroll:true});};return button;}));
 $('demo-select').replaceChildren(...lab.witnesses.filter(w=>w.id!=='session').map(w=>{const option=document.createElement('option');option.value=w.id;option.textContent=w.id==='full-loop'?'Full circuit / all traversal':w.id.replaceAll('-',' ');return option;}));
 $('coverage').replaceChildren(...lab.coverage.map(c=>{const item=document.createElement('span');item.className='coverage-item';item.dataset.check=c.id;item.textContent=c.label;return item;}));
 $('action-buttons').replaceChildren(...content.rules.bindings.filter(b=>!['pause','retry'].includes(b.action)).map(binding=>{
  const button=document.createElement('button');button.className='action-key';button.dataset.action=binding.action;const key=document.createElement('kbd');key.textContent=keyLabel(binding.keys[0]);button.append(key,{jump:'Jump',slide:'Slide',dashGrapple:'Dash',swingGrapple:'Swing · hold',zipline:'Cable'}[binding.action]);button.setAttribute('aria-label',`${binding.action}${binding.behaviour==='hold'?' (hold)':''}`);
  button.onpointerdown=e=>{e.preventDefault();$('game').focus({preventScroll:true});button.setPointerCapture(e.pointerId);input.holdAction(binding.action,true);};const release=()=>input.holdAction(binding.action,false);button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;return button;
 }));
}
function updateUI(s){
 const p=s.player,station=lab.stations[s.stationIndex];
 $('art-status').textContent=renderer.useSprites?renderer.artStatus:'Procedural rig selected';
 $('art-status').title=renderer.lastPose?`${renderer.lastPose.clip} / frame ${renderer.lastPose.frame}`:'';
 $('lap-count').textContent=String(s.laps).padStart(2,'0');$('session-pill').textContent=s.session.toUpperCase();$('state-label').textContent=['Run','Slide','CrouchHold'].includes(p.state)?`Grounded / ${p.state}`:p.state;
 $('speed-x').firstChild.nodeValue=`${p.vx.toFixed(2)} `;$('speed-y').firstChild.nodeValue=`${p.vy.toFixed(2)} `;$('position').textContent=`${p.x.toFixed(1)} / ${p.y.toFixed(1)}`;$('tick').textContent=s.tick;$('attachment').textContent=p.attachment?.kind||'None';
 $('intent-status').textContent=s.performance?`${s.performance.outcome.toUpperCase()} · ${s.performance.kind.toUpperCase()} · FIXED PLAYBACK + DIRECTED CAMERA`:s.matchedScenes?.length&&!s.pendingAction?'SCENE MATCHED · waiting for input; timely and late windows have different outcomes.':s.pendingAction?`QUEUED · ${s.pendingAction.action.toUpperCase()} · WAITING FOR ALIGNMENT`:p.context?`ALIGNED · ${p.context.kind.toUpperCase()}`:'Press early in a marked approach zone · movement continues until alignment.';
 $('station-number').textContent=`STATION ${String(s.stationIndex+1).padStart(2,'0')} / ${String(lab.stations.length).padStart(2,'0')}`;$('station-title').textContent=station.name;$('station-hint').textContent=station.hint;
 $('demo-status').textContent=demo?`SCRIPTED · ${demo.witness.id} · ${demo.frame}/${demo.witness.frames}`:'Live controls · any action takes over from a rehearsal.';
 if(lastStation!==station.id){lastStation=station.id;$('station-checks').replaceChildren(...station.checks.map(id=>{const tag=document.createElement('span');tag.dataset.check=id;tag.textContent=lab.coverage.find(c=>c.id===id).label;return tag;}));}
 for(const tag of $('station-checks').children)tag.classList.toggle('done',!!s.coverage[tag.dataset.check]);
 for(const [i,button]of [...$('stations').children].entries()){button.classList.toggle('active',i===s.stationIndex);button.classList.toggle('complete',lab.stations[i].checks.every(c=>s.coverage[c]));button.setAttribute('aria-current',i===s.stationIndex?'step':'false');}
 const done=lab.coverage.filter(c=>s.coverage[c.id]).length;$('coverage-count').textContent=`${done} / ${lab.coverage.length}`;$('coverage-meter').style.width=`${done/lab.coverage.length*100}%`;
 for(const node of $('coverage').children)node.classList.toggle('done',!!s.coverage[node.dataset.check]);
 for(const button of $('action-buttons').children)button.classList.toggle('eligible',!!s.targets[button.dataset.action]);
 const top=s.events[0];if(top&&top.serial!==lastEvent){lastEvent=top.serial;$('events').replaceChildren(...s.events.map(e=>{const li=document.createElement('li');li.title=e.detail;const tick=document.createElement('span');tick.textContent=`t${e.tick}`;li.append(tick,e.id);return li;}));$('last-event').textContent=top.detail||top.id;}
 $('overlay').hidden=s.session==='Playing';if($('pause').dataset.session!==s.session){$('pause').dataset.session=s.session;$('pause').innerHTML=s.session==='Paused'?'Resume <kbd>ESC</kbd>':'Pause <kbd>ESC</kbd>';}
 if(s.session!=='Playing'){
  $('overlay-kicker').textContent=s.session==='Failed'?'SAFE RETRY / NO LOST PROGRESS':s.session==='Ready'?'FIXED-STEP CHARACTER LAB':'SIMULATION FROZEN';
  $('overlay-title').textContent=s.session==='Failed'?'Try that move again.':s.session==='Ready'?'Ready for a lap?':'Take a breath.';
  $('overlay-detail').textContent=s.session==='Ready'?'Forward motion is automatic. Press in a marked approach to queue an action; it starts at alignment. SPACE also queues vaults. Select a station to isolate a move.':s.reason;
  $('continue').textContent=s.session==='Failed'?'Retry this station →':s.session==='Ready'?'Start circuit →':'Resume →';
 }
}
function frame(now){
 if(!sim)return;const elapsed=last?Math.min(lab.maxFrameSeconds,(now-last)/1000):0;last=now;
 if(sim.session==='Playing')accumulator+=elapsed;else accumulator=0;
 // Session commands must be processed even while paused, without advancing motion time.
 if(sim.session!=='Playing'){
  previousSnapshot=null;const queued=input.consume(content.rules.maxBufferedActions);if(queued.pressed.some(c=>['pause','retry'].includes(c.action)))sim.step(queued);
 }else{
  let steps=0;while(accumulator>=sim.dt&&steps<lab.maxStepsPerFrame){const live=input.consume(content.rules.maxBufferedActions);if(live.pressed.length||live.released.length)demo=null;const controls=demo?rehearsalInput(demo.witness,demo.frame,demo.held):live;previousSnapshot=sim.snapshot();sim.step(controls);if(demo&&++demo.frame>=demo.witness.frames){demo=null;sim.pause('Scripted rehearsal complete. Resume for live controls, or choose another station.');}accumulator-=sim.dt;steps++;if(sim.session!=='Playing'){demo=null;input.clear();accumulator=0;break;}}
  if(steps===lab.maxStepsPerFrame)accumulator=Math.min(accumulator,sim.dt);
 }
 const s=sim.snapshot(),rect=$('game').getBoundingClientRect();const view=presentationSnapshot(previousSnapshot,s,accumulator/sim.dt);camera.update(view,elapsed,rect.width/rect.height,sim.world);renderer.draw(view,camera);
 if(now-lastUI>65){updateUI(s);lastUI=now;}requestAnimationFrame(frame);
}
function resumeOrRetry(){if(!sim)return;previousSnapshot=null;demo=null;input.clear();accumulator=0;if(sim.session==='Failed')sim.retry();else sim.resume();updateUI(sim.snapshot());$('game').focus({preventScroll:true});}
$('continue').onclick=resumeOrRetry;$('pause').onclick=()=>{if(!sim)return;previousSnapshot=null;demo=null;input.clear();sim.session==='Paused'?sim.resume():sim.pause();accumulator=0;updateUI(sim.snapshot());};$('retry').onclick=()=>{if(!sim)return;demo=null;input.clear();sim.retry();accumulator=0;updateUI(sim.snapshot());};$('restart').onclick=()=>{if(!sim)return;demo=null;input.clear();sim.reset(0,'retry');accumulator=0;updateUI(sim.snapshot());};
$('demo').onclick=()=>{if(!sim)return;const witness=lab.witnesses.find(w=>w.id===$('demo-select').value);input.clear();accumulator=0;sim.reset(lab.stations.findIndex(s=>s.id===witness.stationId));demo={witness,frame:0,held:new Set()};updateUI(sim.snapshot());$('game').focus({preventScroll:true});};
$('debug').onchange=()=>{if(renderer)renderer.debug=$('debug').checked;};$('art-mode').onchange=()=>{if(renderer)renderer.useSprites=$('art-mode').value==='sprites';};
$('tuning').onsubmit=e=>{
 e.preventDefault();try{const candidate=structuredClone(content),form=new FormData(e.target);for(const name of ['runSpeed','jumpVelocity','gravity'])candidate.rules[name]=Number(form.get(name));candidate.rules.camera.baseViewHeight=Number(form.get('baseViewHeight'));candidate.contentRevision=`${content.contentRevision}-tuned`;createRuntime(candidate,{playing:false});$('tuning-status').textContent='Validated and applied. Coverage reset for the new content snapshot.';}catch(error){$('tuning-status').textContent=error.message;}
};
$('export').onclick=()=>{if(!sim)return;const blob=new Blob([JSON.stringify(content,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='parkour-tuned.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
try{
 [content,schema,lab]=await Promise.all([read('content/parkour.json'),read('Documents/Plans/Design/Schemas/content-package.schema.json'),read('content/lab-course.json')]);createRuntime(content);requestAnimationFrame(frame);
}catch(error){$('overlay-title').textContent='Content could not load.';$('overlay-detail').textContent=error.message;$('continue').textContent='Reload page';$('continue').onclick=()=>location.reload();$('build-status').textContent='LOAD ERROR';}
