import {validateFlow,readProgress,gameModes,levelsForMode} from './game-flow.js';
const $=id=>document.getElementById(id),read=async path=>{const r=await fetch(path);if(!r.ok)throw Error(`${path}: HTTP ${r.status}`);return r.json();};
const graphics=[
 '<path d="M0 128h60V105h36v23h54V76h25v52h95v-28h30"/><path d="M34 95q45-85 90 0m18-29q35-50 72 0" stroke-dasharray="4 6" fill="none"/>',
 '<path d="M0 126h65v20m150-20h85"/><path d="M70 30L120 86 190 26l90 24M190 26v-15" fill="none"/><circle cx="70" cy="30" r="5"/><circle cx="190" cy="26" r="5"/>',
 '<path d="M0 130h60m170 0h70M50 125l10-10 10 10M160 34l110 15"/><path d="M65 110q25-90 60-60t65 0" fill="none" stroke-dasharray="4 6"/><circle cx="130" cy="22" r="5"/>'
];

try{
 const [flow,lab,content]=await Promise.all([read('content/game-flow.json'),read('content/lab-course.json'),read('content/parkour.json')]),errors=validateFlow(flow,lab,content);if(errors.length)throw Error(errors.join('\n'));
 if($('description'))$('description').textContent=flow.description;
 if($('mode-list'))$('mode-list').replaceChildren(...gameModes(flow).map(mode=>{
  const card=document.createElement('article');card.className=`mode-card ${mode.accent}${mode.status==='available'?'':' unavailable'}`;card.dataset.mode=mode.id;
  const count=document.createElement('span');count.className='mode-count';const levels=levelsForMode(flow,mode.id);count.textContent=mode.status==='available'?`${String(levels.length).padStart(2,'0')} ROUTES`:'IN DEVELOPMENT';
  const art=document.createElement('div');art.className='mode-symbol';art.setAttribute('aria-hidden','true');if(mode.kind==='endless')art.textContent='∞';else art.innerHTML=`<svg viewBox="0 0 300 150" fill="none" stroke="currentColor" stroke-width="3">${graphics[mode.id==='training'?1:0]}</svg>`;
  const body=document.createElement('div');body.className='mode-card-content';const small=document.createElement('small');small.textContent=mode.subtitle;const h=document.createElement('h2');h.textContent=mode.title;const desc=document.createElement('p');desc.textContent=mode.description;
  const link=document.createElement(mode.status==='available'?'a':'button');link.className='button';if(mode.status==='available')link.href=`levels.html?mode=${encodeURIComponent(mode.id)}`;else{link.disabled=true;link.setAttribute('aria-disabled','true');}link.append(mode.status==='available'?'Select mode':'Coming soon',Object.assign(document.createElement('b'),{textContent:mode.status==='available'?'↗':'—'}));body.append(small,h,desc,link);card.append(count,art,body);return card;
 }));
 if($('level-list')){
  const modeId=new URLSearchParams(location.search).get('mode')||gameModes(flow).find(m=>m.status==='available').id,mode=gameModes(flow).find(m=>m.id===modeId);if(!mode)throw Error('Unknown mode. Return to mode select to choose a route.');if(mode.status!=='available')throw Error(`${mode.title} is still in development. Choose Campaign or Training.`);
  const levels=levelsForMode(flow,mode.id);document.title=`${mode.title} · Motion / Run`;$('mode-title').textContent=mode.title;$('mode-subtitle').textContent=mode.subtitle;$('mode-breadcrumb').textContent=mode.title;$('level-summary').textContent=`${levels.length} ${mode.id==='training'?'training':'handcrafted'} routes. Choose your next line.`;
  let storage;try{storage=localStorage;}catch{}const progress=readProgress(storage);let completed=0;
  $('level-list').replaceChildren(...levels.map((level,i)=>{
   const card=document.createElement('article');card.className=`level-card ${level.accent}`;card.dataset.level=level.id;
   const art=document.createElement('div');art.className='level-art';art.setAttribute('aria-hidden','true');art.innerHTML=`<span class="card-number">${String(i+1).padStart(2,'0')} / ${(level.stationIds||level.sections).length} ${(level.stationIds||level.sections).length===1?'SECTION':'SECTIONS'}</span><svg class="route-graphic" viewBox="0 0 300 150" fill="none" stroke="currentColor" stroke-width="3">${graphics[i%graphics.length]}</svg>`;
   const body=document.createElement('div');body.className='level-card-content';const meta=document.createElement('div');meta.className='level-meta';meta.textContent=level.difficulty;const h=document.createElement('h2');h.textContent=level.title;const subtitle=document.createElement('span');subtitle.className='level-subtitle';subtitle.textContent=level.subtitle.replace(/^\d+ \/ /,'');const desc=document.createElement('p');desc.textContent=level.description;const best=document.createElement('div');best.className='level-best';const seconds=progress[level.id]?.bestSeconds;if(Number.isFinite(seconds)&&seconds>=0){completed++;best.textContent=`✓ COMPLETE · BEST ${seconds.toFixed(2)} s`;}else best.textContent='NOT COMPLETED YET';
   const link=document.createElement('a');link.className='button';link.href=`play.html?level=${encodeURIComponent(level.id)}`;link.append('Start run',Object.assign(document.createElement('b'),{textContent:'↗'}));body.append(meta,h,subtitle,desc,best,link);card.append(art,body);return card;
  }));$('completion-count').textContent=`${String(completed).padStart(2,'0')} / ${String(levels.length).padStart(2,'0')}`;
 }
 if($('menu-bindings'))for(const binding of content.rules.bindings){const row=document.createElement('div'),name=document.createElement('dt'),keys=document.createElement('dd');name.textContent={jump:'Jump / vault / climb',slide:'Slide / roll / drop',dashGrapple:'Dash grapple',swingGrapple:'Swing grapple',zipline:'Zipline',pause:'Pause',retry:'Retry section'}[binding.action]||binding.action;keys.textContent=(binding.action==='swingGrapple'?'HOLD ':'')+binding.keys.map(k=>({Space:'SPACE',ArrowUp:'↑',ArrowDown:'↓',Escape:'ESC'}[k]||k.replace('Key',''))).join(' / ');row.append(name,keys);$('menu-bindings').append(row);}
 $('load-status').textContent='';
}catch(e){$('load-status').textContent=`Could not load this menu. ${e.message}`;if($('level-summary'))$('level-summary').textContent='Return to mode select or reload to try again.';}
const dialog=$('controls-dialog');if(dialog){dialog.addEventListener('close',()=>$('how-to-play').focus());$('how-to-play').onclick=()=>dialog.showModal();$('close-controls').onclick=$('guide-done').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}
if($('menu-fullscreen'))$('menu-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('menu-fullscreen').textContent='Fullscreen unavailable';}};
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(dialog?.open){e.preventDefault();dialog.close();return;}const back=document.querySelector('.breadcrumbs a:last-of-type');if(back){e.preventDefault();location.href=back.href;}});
if($('runner')){
 try{
  const catalog=await read('assets/character/animations.json'),seq=catalog.sequences.run,clip=catalog.clips.find(c=>c.id===seq.clip),images=new Map();await Promise.all(clip.sheets.map(async sheet=>{const im=new Image();im.src=sheet.file;await im.decode();images.set(sheet.file,im);}));
  const canvas=$('runner'),ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function paint(now){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=r.width*dpr;canvas.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const frame=clip.frames[seq.range[0]+(reduced?0:Math.floor(now/1000*seq.fps))%(seq.range[1]-seq.range[0]+1)],sheet=clip.sheets[frame.sheet],im=images.get(typeof sheet==='string'?sheet:sheet?.file)||images.get(frame.sheet),[sx,sy,w,h]=frame.rect,scale=Math.min(1.9,r.height*.47/(clip.pixelsPerMetre*1.8));
   if(im){document.querySelector('#runner-fallback').style.display='none';ctx.drawImage(im,sx,sy,w,h,r.width*.47-frame.anchor[0]*scale,r.height*.73-frame.anchor[1]*scale,w*scale,h*scale);}if(!reduced)requestAnimationFrame(paint);
  }requestAnimationFrame(paint);
 }catch{/* The menu remains usable if research artwork is unavailable. */}
}
