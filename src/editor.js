import {EditorDocument,clone,moduleOf,levelOf,boundsOf,uniqueId,snap,layoutWarnings} from './editor-model.js';
import {EditorView} from './editor-view.js';
import {Simulation} from './simulation.js';
import {FollowCamera} from './camera.js';
import {Renderer} from './renderer.js';
import {SemanticInput} from './input.js';
import {presentationSnapshot} from './presentation.js';

const $=id=>document.getElementById(id),SAVE='motion-lab.level-studio.draft.v1';
const view=new EditorView($('scene'));
let doc,lab,schema,moduleId=null,selection=[],drag=null,box=null,test=null,last=0,panelZ=5,needsDraw=true,saveTimer;
let recovery=null,autosaveAllowed=true,selectedPrefab='unit-jump';
const data=()=>doc.state.data,level=()=>levelOf(data(),doc.state.levelId),activeModule=()=>moduleOf(data(),moduleId);
const items=()=>view.items(data(),doc.state.levelId,moduleId),grid=()=>Number($('grid').value);
function message(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function attempt(fn){try{fn();return true;}catch(e){message(e.message,true);return false;}}
function scheduleSave(){
 clearTimeout(saveTimer);$('dirty').textContent=autosaveAllowed?'DRAFT · SAVING…':'DRAFT · SAVE HELD';
 if(!autosaveAllowed)return;
 saveTimer=setTimeout(()=>{try{localStorage.setItem(SAVE,JSON.stringify({version:1,state:doc.state,savedAt:new Date().toISOString()}));$('dirty').textContent='DRAFT · SAVED LOCALLY';$('storage-state').textContent='Saved in this browser. Export JSON to keep a portable copy.';$('recover').disabled=false;}catch{$('dirty').textContent='DRAFT · NOT SAVED';$('storage-state').textContent='Browser storage unavailable or full. Export JSON to preserve the draft.';}},300);
}
function edited(text='Draft updated'){
 selection=selection.filter(id=>items().some(i=>i.id===id));refresh();scheduleSave();message(text);
}
function change(fn,text){attempt(()=>{fn();edited(text);});}
function setSelection(ids){selection=[...new Set(ids)];renderInspector();needsDraw=true;}
function frameItems(list){view.resize();const left=$('prefabs-panel').hidden?45:$('prefabs-panel').getBoundingClientRect().width+40,right=$('inspector-panel').hidden?45:$('inspector-panel').getBoundingClientRect().width+40;view.frame(list,{left,right});needsDraw=true;}
function togglePanel(id,show=$(id).hidden){$(id).hidden=!show;$(id).style.zIndex=++panelZ;document.querySelector(`[data-toggle="${id}"]`)?.setAttribute('aria-pressed',String(show));clampPanel($(id));}
function clampPanel(panel){
 if(panel.hidden)return;const host=$('studio').getBoundingClientRect(),r=panel.getBoundingClientRect();
 panel.style.left=`${Math.max(8,Math.min(r.left-host.left,Math.max(8,host.width-r.width-8)))}px`;panel.style.right='auto';panel.style.top=`${Math.max(62,Math.min(r.top-host.top,Math.max(62,host.height-r.height-72)))}px`;
}
function refresh(){
 if(!moduleOf(data(),selectedPrefab))selectedPrefab=data().modules[0].id;
 $('level').replaceChildren(...data().finiteLevels.map(l=>new Option(l.id,l.id)));$('level').value=doc.state.levelId;
 $('scope').textContent=moduleId?'← Layout':'Layout';$('breadcrumb').textContent=moduleId?`PREFAB / ${moduleId}`:'FINITE LEVEL / '+doc.state.levelId.toUpperCase();
 $('undo').disabled=!doc.past.length;$('redo').disabled=!doc.future.length;
 renderPrefabs();renderInspector();renderSettings();needsDraw=true;
}
const glyph=id=>({jump:'↗',slide:'↘',vault:'⌁',dash:'↠',swing:'◡',cable:'╲',pad:'⇡',chain:'⤴',recovery:'◇'}[id]||'▦');
function renderPrefabs(){
 const q=$('prefab-search').value.toLowerCase(),modules=data().modules.filter(m=>(m.id+' '+m.tags.join(' ')).toLowerCase().includes(q));$('prefab-count').textContent=data().modules.length;
 $('prefab-list').replaceChildren(...modules.map(m=>{
  const card=document.createElement('div');card.className='prefab-card';const icon=document.createElement('span');icon.className='prefab-glyph';icon.textContent=glyph(m.tags.find(t=>!['prefab','authored'].includes(t)));
  const info=document.createElement('div');info.className='prefab-info';const title=document.createElement('b');title.textContent=m.id.replace(/^unit-/,'').replaceAll('-',' ');const detail=document.createElement('small');detail.textContent=`${m.size[0]} m · ${m.entities.length} entities · ${(m.sceneActions||[]).length} detectors`;info.append(title,detail);
  const add=document.createElement('button');add.textContent='+';add.title=`Place ${m.id}`;add.setAttribute('aria-label',`Place ${m.id}`);add.onclick=()=>place(m.id);info.title='Click to inspect this shared prefab';info.style.cursor='pointer';info.onclick=()=>enterPrefab(m.id);card.append(icon,info,add);return card;
 }));
}
function place(id){
 if(moduleId){message('Return to Layout to place a prefab.');return;}
 change(()=>{selectedPrefab=id;const after=$('append').checked?(selection.at(-1)||level().finish.instanceId):null;selection=[doc.add(id,[snap(view.camera.x,grid()),snap(0,grid())],{after})];},'Prefab placed. Drag to adjust, or connect more units.');
}
function prefabFrame(){const m=activeModule(),bounds=m.entities.filter(e=>e.kind!=='hazard').map(boundsOf),bottom=Math.min(0,...bounds.map(b=>b[1])),top=Math.max(5,...bounds.map(b=>b[1]+b[3]));return [{rect:[0,bottom,m.size[0],top-bottom]}];}
function enterPrefab(id){moduleId=id;selectedPrefab=id;selection=[];refresh();frameItems(prefabFrame());message('Editing a shared prefab. Every linked instance uses these changes.');}
function leavePrefab(){moduleId=null;selection=[];refresh();frameItems(items());}
function field(label,name,value,{type='number',step='.05'}={}){
 const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.name=name;input.type=type;if(type==='checkbox'){l.className='check';input.checked=value;}else{input.value=value;input.required=true;if(type==='number')input.step=step;}l.append(input);return l;
}
function renderInspector(){
 $('selection-empty').firstChild.textContent=moduleId?'Select an entity in the scene.':'Select a unit in the scene.';$('selected-count').textContent=selection.length;$('selection-empty').hidden=!!selection.length;$('selection-details').hidden=!selection.length;$('prefab-authoring').hidden=!moduleId;
 $('selection-label').textContent=selection.join(' + ');$('connect').hidden=!!moduleId;$('connect').disabled=selection.length<2;$('edit-prefab').hidden=!!moduleId;$('edit-prefab').disabled=selection.length!==1;$('test-selection').hidden=!!moduleId;$('test-selection').disabled=selection.length!==1;
 $('clone-prefab').disabled=!(moduleId||selection.length===1);
 $('entity-form').hidden=!moduleId||selection.length!==1;
 if(moduleId){const m=activeModule(),uses=data().finiteLevels.flatMap(l=>l.instances).filter(i=>i.moduleId===moduleId).length;$('prefab-warning').textContent=`${m.id} · ${uses} linked instance(s). Duplicate geometry also duplicates its detector references.`;$('module-json').value=JSON.stringify(m,null,2);
  if(selection.length===1){const e=m.entities.find(e=>e.id===selection[0]),fields=[];
   if(e.rect)for(const [i,label]of ['X','Y','Width','Height'].entries())fields.push(field(label,'rect'+i,e.rect[i]));
   if(e.position)for(const [i,label]of ['X','Y'].entries())fields.push(field(label,'pos'+i,e.position[i]));
   if(e.points){const l=document.createElement('label');l.textContent='Cable points [x, y]';const t=document.createElement('textarea');t.name='points';t.rows=4;t.value=JSON.stringify(e.points);l.append(t);fields.push(l);}
   if(e.kind==='surface'){fields.push(field('One-way','oneWay',e.oneWay,{type:'checkbox'}),field('Vaultable','vaultable',e.vaultable,{type:'checkbox'}));}
   if(e.profileId){const l=document.createElement('label');l.textContent='Traversal profile';const s=document.createElement('select');s.name='profileId';for(const p of data().profiles.filter(p=>e.kind==='anchor'?['dashGrapple','swingGrapple'].includes(p.kind):p.kind===e.kind))s.add(new Option(p.id,p.id));s.value=e.profileId;l.append(s);fields.push(l);}
   $('entity-fields').replaceChildren(...fields);
  }
 }
}
function renderSettings(){
 $('revision').value=data().contentRevision;
 for(const name of ['spawn','finish']){
  const options=level().instances.flatMap(i=>moduleOf(data(),i.moduleId).sockets.filter(s=>s.role===(name==='spawn'?'entry':'exit')).map(s=>new Option(`${i.id} / ${s.id}`,JSON.stringify({instanceId:i.id,socketId:s.id}))));$(name).replaceChildren(...options);$(name).value=JSON.stringify(level()[name]);
 }
 const warnings=layoutWarnings(data(),doc.state.levelId);$('validation-count').textContent=warnings.length?`${warnings.length} warnings`:'PASS';$('validation').replaceChildren(...(warnings.length?warnings:['Shared schema and references are valid. Socket seams are aligned; traversal is verified by playtesting.']).map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));
}
function selectedOperation(operation){if(!selection.length)return;change(()=>{const result=doc[operation](selection,{moduleId});if(Array.isArray(result))selection=result;},`${operation==='remove'?'Deleted':'Duplicated'} selection.`);}
function exportDraft(){attempt(()=>{doc.check(data());const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data(),null,2)+'\n'],{type:'application/json'}));a.href=url;a.download=`${doc.state.levelId}.content.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Exported the complete validated package.');});}
function recover(){
 attempt(()=>{const saved=recovery||JSON.parse(localStorage.getItem(SAVE));if(saved?.version!==1||!saved.state)throw Error('No compatible saved draft.');doc.replace(saved.state.data,saved.state.levelId);moduleId=null;selection=[];autosaveAllowed=true;recovery=null;$('recovery-banner').hidden=true;edited('Saved draft recovered. Undo returns to the previous content.');view.frame(items());});
}
function startTest(fromInstance=null){
 attempt(()=>{if(test)return;const compiled=doc.playtest(lab,{fromInstance,moduleId}),sim=new Simulation(compiled.content,compiled.lab),camera=new FollowCamera(compiled.content.rules.camera),renderer=new Renderer($('test-game'),sim.world,compiled.lab,compiled.content.rules);
  renderer.loadArt();renderer.debug=$('test-debug').checked;test={sim,camera,renderer,previous:null,accumulator:0,dt:1/compiled.content.rules.fixedStepHz};
  test.input=new SemanticInput(compiled.content.rules.bindings,kind=>sim.preview(kind),()=>{test.accumulator=0;test.previous=null;sim.pause('Focus lost — resume to continue');},compiled.content.rules.maxBufferedActions);
  $('playtest').hidden=false;$('studio').inert=true;document.querySelector('.studio-bar').inert=true;$('test-game').focus({preventScroll:true});last=0;message('Playing an immutable snapshot. Your draft, camera and selection are preserved.');
 });
}
function stopTest(){if(!test)return;test.input.destroy();test=null;$('playtest').hidden=true;$('studio').inert=false;document.querySelector('.studio-bar').inert=false;$('scene').focus({preventScroll:true});last=0;needsDraw=true;message('Returned to the unchanged draft.');}

// Scene interaction owns only a preview offset until pointer-up: one drag is one undo step.
const point=e=>{const r=$('scene').getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
$('scene').oncontextmenu=e=>e.preventDefault();
$('scene').onpointerdown=e=>{
 if(!doc||test)return;$('scene').focus({preventScroll:true});const at=point(e),world=view.world(at);$('scene').setPointerCapture(e.pointerId);
 if(e.button===1||e.button===2||e.altKey){drag={kind:'pan',start:at,camera:{...view.camera}};return;}
 const hit=view.hit(items(),world);
 if(hit){if(e.shiftKey){setSelection(selection.includes(hit)?selection.filter(i=>i!==hit):[...selection,hit]);}else if(!selection.includes(hit))setSelection([hit]);drag={kind:'move',start:world,offset:[0,0]};}
 else{const keep=e.shiftKey?[...selection]:[];setSelection(keep);drag={kind:'box',start:world,keep};box=[world,world];}needsDraw=true;
};
$('scene').onpointermove=e=>{
 if(!doc||test)return;const at=point(e),world=view.world(at);$('coordinates').textContent=`${world[0].toFixed(2)}, ${world[1].toFixed(2)} m`;
 if(!drag)return;
 if(drag.kind==='pan'){view.camera.x=drag.camera.x-(at[0]-drag.start[0])/view.camera.scale;view.camera.y=drag.camera.y+(at[1]-drag.start[1])/view.camera.scale;}
 if(drag.kind==='move')drag.offset=world.map((v,k)=>snap(v-drag.start[k],grid()));
 if(drag.kind==='box'){box=[drag.start,world];const min=world.map((v,k)=>Math.min(v,drag.start[k])),max=world.map((v,k)=>Math.max(v,drag.start[k]));setSelection([...drag.keep,...items().filter(({rect:[x,y,w,h]})=>x<=max[0]&&x+w>=min[0]&&y<=max[1]&&y+h>=min[1]).map(i=>i.id)]);}
 needsDraw=true;
};
function endDrag(cancel=false){const d=drag;drag=null;box=null;if(d?.kind==='move'&&!cancel&&d.offset.some(v=>v))change(()=>doc.move(selection,...d.offset,{moduleId}),'Moved selection.');needsDraw=true;}
$('scene').onpointerup=()=>endDrag();$('scene').onpointercancel=()=>endDrag(true);$('scene').onlostpointercapture=()=>{if(drag)endDrag(true);};
$('scene').ondblclick=e=>{if(moduleId||test)return;const id=view.hit(items(),view.world(point(e))),i=level().instances.find(i=>i.id===id);if(i)enterPrefab(i.moduleId);};
$('scene').addEventListener('wheel',e=>{e.preventDefault();view.zoom(Math.exp(-e.deltaY*.0015),point(e));needsDraw=true;},{passive:false});

// Floating panels: independent drag/resize/hide. Positions never enter game content.
document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>togglePanel(b.dataset.toggle));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>togglePanel(b.dataset.close,false));
for(const panel of document.querySelectorAll('.floating')){
 panel.onpointerdown=()=>panel.style.zIndex=++panelZ;
 const handle=panel.querySelector('.panel-handle');let moving=null;
 handle.onpointerdown=e=>{if(e.target.closest('button'))return;const r=panel.getBoundingClientRect(),host=$('studio').getBoundingClientRect();moving={x:e.clientX,y:e.clientY,left:r.left-host.left,top:r.top-host.top};handle.setPointerCapture(e.pointerId);};
 handle.onpointermove=e=>{if(!moving)return;panel.style.left=`${moving.left+e.clientX-moving.x}px`;panel.style.right='auto';panel.style.top=`${moving.top+e.clientY-moving.y}px`;clampPanel(panel);};
 handle.onpointerup=handle.onpointercancel=()=>moving=null;
 new ResizeObserver(()=>clampPanel(panel)).observe(panel);
}
$('reset-panels').onclick=()=>{document.querySelectorAll('.floating').forEach(p=>{p.removeAttribute('style');clampPanel(p);});};
$('scope').onclick=()=>{if(moduleId)leavePrefab();};$('leave-prefab').onclick=leavePrefab;
$('prefab-search').oninput=renderPrefabs;
$('level').onchange=()=>{attempt(()=>{doc.selectLevel($('level').value);moduleId=null;selection=[];refresh();view.frame(items());});};
$('undo').onclick=()=>change(()=>{doc.undo();if(moduleId&&!moduleOf(data(),moduleId))moduleId=null;},'Undid the last edit.');
$('redo').onclick=()=>change(()=>doc.redo(),'Redid the last edit.');
$('fit').onclick=()=>frameItems(moduleId?prefabFrame():items());$('focus').onclick=()=>frameItems(items().filter(i=>selection.includes(i.id)));
$('zoom-in').onclick=()=>{view.zoom(1.25);needsDraw=true;};$('zoom-out').onclick=()=>{view.zoom(.8);needsDraw=true;};$('grid').onchange=()=>needsDraw=true;
$('duplicate').onclick=()=>selectedOperation('duplicate');$('delete').onclick=()=>selectedOperation('remove');
$('connect').onclick=()=>change(()=>doc.align(selection),'Connected and aligned selected sockets.');
$('edit-prefab').onclick=()=>{if(selection.length===1)enterPrefab(level().instances.find(i=>i.id===selection[0]).moduleId);};
$('clone-prefab').onclick=()=>change(()=>{
 const instance=!moduleId?level().instances.find(i=>i.id===selection[0]):null,source=moduleId||instance?.moduleId;if(!source)throw Error('Select one instance first.');let id;
 doc.transact('Create prefab variant',(d,l)=>{const m=clone(moduleOf(d,source));id=uniqueId(source+'-variant',d.modules);m.id=id;d.modules.push(m);if(instance)l.instances.find(i=>i.id===instance.id).moduleId=id;});
 if(moduleId)moduleId=id;selectedPrefab=id;
},'Created an independent prefab variant. Existing instances keep their original definition.');
$('transform-form').onsubmit=e=>{e.preventDefault();const f=e.target;change(()=>doc.move(selection,Number(f.elements.dx.value),Number(f.elements.dy.value),{moduleId}),'Applied batch offset.');};
$('entity-form').onsubmit=e=>{e.preventDefault();const f=e.target;change(()=>doc.transact('Edit entity geometry',d=>{const entity=moduleOf(d,moduleId).entities.find(v=>v.id===selection[0]);if(entity.rect)entity.rect=entity.rect.map((_,i)=>Number(f.elements['rect'+i].value));if(entity.position)entity.position=entity.position.map((_,i)=>Number(f.elements['pos'+i].value));if(entity.points)entity.points=JSON.parse(f.elements.points.value);if(entity.kind==='surface'){entity.oneWay=f.elements.oneWay.checked;entity.vaultable=f.elements.vaultable.checked;}if(entity.profileId)entity.profileId=f.elements.profileId.value;}),'Updated geometry and its derived detector positions.');};
$('apply-module').onclick=()=>change(()=>{const candidate=JSON.parse($('module-json').value);if(candidate.id!==moduleId)throw Error('Keep the shared prefab ID. Use Make unique for a variant.');doc.transact('Edit prefab data',d=>{d.modules[d.modules.findIndex(m=>m.id===moduleId)]=candidate;});},'Validated and applied shared prefab data.');
$('add-entity').onclick=()=>change(()=>{let id;doc.transact('Add entity',d=>{const m=moduleOf(d,moduleId),kind=$('entity-kind').value,pos=[snap(view.camera.x,grid()),snap(view.camera.y,grid())];id=uniqueId(kind.toLowerCase(),m.entities);let e={id,kind};if(['surface','hazard','jumpPad'].includes(kind))e.rect=[...pos,2,.5];if(kind==='surface')Object.assign(e,{oneWay:false,vaultable:false});if(['dashGrapple','swingGrapple'].includes(kind))Object.assign(e,{kind:'anchor',position:pos});if(kind==='zipline')e.points=[pos,[pos[0]+8,pos[1]-1]];const profile=d.profiles.find(p=>p.kind===kind);if(profile)e.profileId=profile.id;m.entities.push(e);});selection=[id];},'Added entity. Configure detector references in the prefab JSON where needed.');
$('level-form').onsubmit=e=>{e.preventDefault();change(()=>doc.transact('Level settings',(d,l)=>{d.contentRevision=$('revision').value.trim();l.spawn=JSON.parse($('spawn').value);l.finish=JSON.parse($('finish').value);}),'Updated level settings.');};
$('new-level').onclick=()=>change(()=>{doc.newLevel($('new-level-id').value.trim(),selectedPrefab);moduleId=null;selection=[];view.frame(items());},'Created a finite level. Add prefabs to extend it.');
$('export').onclick=exportDraft;$('import').onclick=()=>$('import-file').click();
$('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>8*1024*1024)throw Error('Content package exceeds the 8 MB editor import limit.');const candidate=JSON.parse(await file.text());doc.replace(candidate,candidate.finiteLevels?.[0]?.id);moduleId=null;selection=[];edited('Imported validated content. Undo restores the previous draft.');view.frame(items());}catch(error){message(error.message,true);}finally{e.target.value='';}};
$('recover').onclick=$('recover-banner').onclick=recover;
$('dismiss-recovery').onclick=()=>{recovery=null;autosaveAllowed=true;$('recovery-banner').hidden=true;message('Current content kept. The next edit starts a new local save.');};
$('clear-save').onclick=()=>{clearTimeout(saveTimer);try{localStorage.removeItem(SAVE);recovery=null;autosaveAllowed=true;$('recovery-banner').hidden=true;$('recover').disabled=true;$('storage-state').textContent='Saved draft cleared. Current in-memory content is unchanged.';}catch{message('Browser storage is unavailable.',true);}};
$('test').onclick=()=>startTest();$('test-selection').onclick=()=>startTest(selection[0]);$('stop-test').onclick=stopTest;
$('test-debug').onchange=()=>{if(test)test.renderer.debug=$('test-debug').checked;};
$('test-retry').onclick=()=>{if(test){test.input.clear();test.sim.reset(0,'retry');test.previous=null;test.accumulator=0;$('test-game').focus();}};
$('test-resume').onclick=()=>{if(!test)return;test.input.clear();test.previous=null;test.accumulator=0;if(test.sim.session==='Playing')test.sim.pause();else if(test.sim.session==='Failed')test.sim.reset(0);else test.sim.resume();$('test-game').focus();};
window.addEventListener('keydown',e=>{
 if(!doc||test||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
 const ctrl=e.ctrlKey||e.metaKey,key=e.key.toLowerCase();
 if(ctrl&&key==='z'){e.preventDefault();(e.shiftKey?$('redo'):$('undo')).click();return;}
 if(ctrl&&key==='d'){e.preventDefault();selectedOperation('duplicate');return;}
 if(ctrl&&key==='s'){e.preventDefault();exportDraft();return;}
 if(ctrl&&key==='a'){e.preventDefault();setSelection(items().map(i=>i.id));return;}
 if(key==='delete'||key==='backspace'){e.preventDefault();selectedOperation('remove');}
 if(key==='escape'){endDrag(true);setSelection([]);}
 if(key==='home'){e.preventDefault();$('fit').click();}if(key==='f')$('focus').click();if(key==='t')startTest();
 if(['arrowleft','arrowright','arrowup','arrowdown'].includes(key)&&selection.length){e.preventDefault();const amount=(grid()||.1)*(e.shiftKey?10:1);change(()=>doc.move(selection,(key==='arrowright'?1:key==='arrowleft'?-1:0)*amount,(key==='arrowup'?1:key==='arrowdown'?-1:0)*amount,{moduleId}),'Nudged selection.');}
 if(key==='+'||key==='=')$('zoom-in').click();if(key==='-')$('zoom-out').click();
});
window.addEventListener('resize',()=>{document.querySelectorAll('.floating').forEach(clampPanel);needsDraw=true;});
function frame(ms){
 const elapsed=last?Math.max(0,(ms-last)/1000):0;last=ms;
 if(test){const t=test,s=t.sim;let budget=Math.min(elapsed,lab.maxFrameSeconds);t.accumulator+=budget;
  if(s.session==='Playing'){for(let n=0;t.accumulator>=t.dt&&n<lab.maxStepsPerFrame;n++){t.previous=s.snapshot();s.step(t.input.consume(s.rules.maxBufferedActions));t.accumulator-=t.dt;if(s.session!=='Playing'){t.accumulator=0;t.previous=null;break;}}if(t.accumulator>=t.dt)t.accumulator%=t.dt;}
  else{const input=t.input.consume(s.rules.maxBufferedActions);t.accumulator=0;t.previous=null;for(const command of input.pressed){if(command.action==='retry')s.reset(0,'retry');if(command.action==='pause')s.resume();}}
  const current=s.snapshot(),visible=presentationSnapshot(t.previous,current,t.accumulator/t.dt),rect=$('test-game').getBoundingClientRect();t.camera.update(visible,budget,rect.width/Math.max(1,rect.height),s.world);t.renderer.draw(visible,t.camera);
  $('test-status').textContent=`${current.session} · ${current.player.state} · x ${current.player.x.toFixed(1)} · ${s.reason||t.renderer.artStatus}`;$('test-resume').textContent=s.session==='Playing'?'Pause [ESC]':s.session==='Failed'?'Restart [R]':'Resume [ESC]';
 }else if(doc&&needsDraw){view.draw({data:data(),levelId:doc.state.levelId,moduleId,selection,offset:drag?.kind==='move'?drag.offset:null,box,grid:grid()});$('zoom').textContent=Math.round(view.camera.scale/28*100)+'%';needsDraw=false;}
 requestAnimationFrame(frame);
}
async function boot(){
 const read=async url=>{const r=await fetch(url);if(!r.ok)throw Error(`${url}: HTTP ${r.status}`);return r.json();};
 try{const [content,contract,course]=await Promise.all([read('content/parkour.json'),read('Documents/Plans/Design/Schemas/content-package.schema.json'),read('content/lab-course.json')]);schema=contract;lab=course;doc=new EditorDocument(content,schema);if(window.innerWidth<1000)togglePanel('inspector-panel',false);refresh();frameItems(items().slice(0,3));document.querySelectorAll('.floating').forEach(clampPanel);message('Select, place and connect prefabs. Double-click a unit to edit its shared geometry.');
  try{const saved=localStorage.getItem(SAVE);if(saved){recovery=JSON.parse(saved);autosaveAllowed=false;$('recovery-banner').hidden=false;$('recover').disabled=false;$('storage-state').textContent='A saved draft is available. Autosave waits for Recover or Keep current content.';}}catch{$('storage-state').textContent='Browser storage unavailable. Use JSON import/export.';}
 }catch(e){message(e.message,true);}
 requestAnimationFrame(frame);
}
boot();
