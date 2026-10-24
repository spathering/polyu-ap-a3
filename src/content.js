import {compileSceneActions} from './scene-actions.js';
// Supported JSON Schema keywords are deliberately bounded to the project's checked-in schemas.
export function validateSchema(value,schema,root=schema,path='$'){
 const errors=[];const fail=message=>errors.push(`${path}: ${message}`);
 if(schema===false)return [`${path}: item is not allowed`];if(schema===true)return [];
 if(schema.$ref){const ref=schema.$ref.split('/').slice(1).reduce((s,k)=>s?.[k],root);if(!ref)return [`${path}: unresolved schema reference`];return validateSchema(value,ref,root,path);}
 if(schema.oneOf){const branches=schema.oneOf.map(s=>validateSchema(value,s,root,path));if(branches.filter(e=>!e.length).length!==1)fail('must match exactly one known entity/profile shape');return errors;}
 if('const'in schema&&value!==schema.const)fail(`expected ${schema.const}`);
 if(schema.enum&&!schema.enum.includes(value))fail('unknown value');
 if(schema.type){const type=Array.isArray(value)?'array':value===null?'null':typeof value;const good=schema.type==='integer'?Number.isInteger(value):type===schema.type;if(!good){fail(`expected ${schema.type}`);return errors;}}
 if(typeof value==='number'){
  if(!Number.isFinite(value))fail('must be finite');
  if(schema.minimum!==undefined&&value<schema.minimum)fail(`minimum ${schema.minimum}`);
  if(schema.maximum!==undefined&&value>schema.maximum)fail(`maximum ${schema.maximum}`);
  if(schema.exclusiveMinimum!==undefined&&value<=schema.exclusiveMinimum)fail('must exceed lower bound');
 }
 if(typeof value==='string'){
  if(schema.minLength!==undefined&&value.length<schema.minLength)fail('string too short');
  if(schema.pattern&&!new RegExp(schema.pattern).test(value))fail('invalid identifier');
 }
 if(Array.isArray(value)){
  if(schema.minItems!==undefined&&value.length<schema.minItems)fail('too few items');
  if(schema.maxItems!==undefined&&value.length>schema.maxItems)fail('too many items');
  if(schema.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)fail('duplicate items');
  value.forEach((v,i)=>{const s=schema.prefixItems?.[i]??schema.items;if(s!==undefined)errors.push(...validateSchema(v,s,root,`${path}[${i}]`));});
 }
 if(value&&typeof value==='object'&&!Array.isArray(value)){
  for(const k of schema.required||[])if(!(k in value))fail(`missing ${k}`);
  for(const [k,v]of Object.entries(value)){const s=schema.properties?.[k];if(s)errors.push(...validateSchema(v,s,root,`${path}.${k}`));else if(schema.additionalProperties===false)fail(`unknown field ${k}`);}
 }
 return errors;
}
export function validateContent(content,schema,lab){
 const errors=validateSchema(content,schema),r=content.rules;if(errors.length)return errors;
 const ids=(list,label)=>{const seen=new Set();for(const x of list){if(seen.has(x.id))errors.push(`Duplicate ${label}: ${x.id}`);seen.add(x.id);}return seen;};
 const profiles=new Map(content.profiles.map(p=>[p.id,p]));ids(content.profiles,'profile');ids(content.modules,'module');ids(content.finiteLevels,'level');
 const c=r.camera;if(!(c.minViewHeight<=c.baseViewHeight&&c.baseViewHeight<=c.maxViewHeight))errors.push('Camera view height order');
 if(c.minLookAhead>c.maxLookAhead)errors.push('Camera lookahead order');
 if(c.maxCatchUpSpeed<r.maxHorizontalSpeed)errors.push('Camera catch-up must cover speed cap');
 if(r.slideBodySize[1]>=r.bodySize[1])errors.push('Crouched body must be shorter');
 const knots=r.vaultTrajectory;if(knots[0][0]!==0||knots.at(-1)[0]!==1||knots[0][1]!==0||knots.at(-1)[1]!==1||knots[0][2]!==0||knots.at(-1)[2]!==0||knots.some((k,i)=>i&&(k[0]<=knots[i-1][0]||k[1]<knots[i-1][1])))errors.push('Invalid vault trajectory order/endpoints');
 const keys=new Set(),actions=new Set();for(const b of r.bindings){if(actions.has(b.action))errors.push('Duplicate action binding');actions.add(b.action);for(const k of b.keys){if(keys.has(k))errors.push(`Key conflict ${k}`);keys.add(k);}}
 for(const p of content.profiles)if(p.kind==='swingGrapple'&&p.minLength>p.maxLength)errors.push('Rope length order');
 for(const m of content.modules){
  ids(m.entities,`${m.id} entity`);ids(m.sockets,`${m.id} socket`);
  ids(m.routes,`${m.id} route`);
  for(const role of ['entry','exit'])if(!m.sockets.some(s=>s.role===role))errors.push(`Missing ${role} socket in ${m.id}`);
  for(const s of m.sockets)for(const key of ['vxRange','vyRange'])if(s.contract[key][0]>s.contract[key][1])errors.push(`Invalid socket ${key}: ${m.id}/${s.id}`);
  ids(m.sceneActions||[],`${m.id} action marker`);
  for(const a of m.sceneActions||[]){const e=m.entities.find(e=>e.id===a.entityId);if(!e||!(a.kind==='vault'?e.kind==='surface'&&e.vaultable:a.kind==='slide'||a.kind==='jump'?e.kind==='surface':a.kind==='jumpPad'?e.kind==='jumpPad':a.kind==='zipline'?e.kind==='zipline':e.kind==='anchor'&&profiles.get(e.profileId)?.kind===a.kind))errors.push(`Invalid scene action reference ${a.id}`);if(a.heightRange[0]>=a.heightRange[1])errors.push(`Invalid scene action height range ${a.id}`);if(a.input!==(a.kind==='vault'?'jump':a.kind==='jumpPad'?'automatic':a.kind))errors.push(`Scene action/input mismatch ${a.id}`);if(a.input!=='automatic'&&!r.bindings.some(b=>b.action===a.input))errors.push(`Unbound scene action ${a.id}`);}
  for(const e of m.entities){if(e.profileId){const p=profiles.get(e.profileId);if(!p||!(e.kind==='anchor'?['dashGrapple','swingGrapple'].includes(p.kind):p.kind===e.kind))errors.push(`Profile mismatch ${m.id}/${e.id}`);}
   if(e.points)for(let i=1;i<e.points.length;i++)if(Math.hypot(e.points[i][0]-e.points[i-1][0],e.points[i][1]-e.points[i-1][1])<r.collisionSkin)errors.push(`Degenerate cable ${e.id}`);
  }
  for(const route of m.routes)for(const key of ['entrySocketId','exitSocketId'])if(!m.sockets.some(s=>s.id===route[key]&&s.role===(key==='entrySocketId'?'entry':'exit')))errors.push(`Missing or incorrect route socket ${route[key]}`);
 }
 for(const l of content.finiteLevels){ids(l.instances,'instance');for(const i of l.instances)if(!content.modules.some(m=>m.id===i.moduleId))errors.push(`Missing module ${i.moduleId}`);for(const ref of [l.spawn,l.finish,...l.connections.flatMap(c=>[c.from,c.to])]){const ins=l.instances.find(i=>i.id===ref.instanceId),m=content.modules.find(m=>m.id===ins?.moduleId);if(!m?.sockets.some(s=>s.id===ref.socketId))errors.push('Missing layout socket');}}
 for(const l of content.finiteLevels)for(const [ref,role]of [[l.spawn,'entry'],[l.finish,'exit'],...l.connections.flatMap(c=>[[c.from,'exit'],[c.to,'entry']])]){const ins=l.instances.find(i=>i.id===ref.instanceId),m=content.modules.find(m=>m.id===ins?.moduleId),s=m?.sockets.find(s=>s.id===ref.socketId);if(s&&s.role!==role)errors.push(`Wrong socket role in ${l.id}: expected ${role}`);}
 for(const p of content.endlessPresets)for(const id of [p.startModuleId,p.fallbackModuleId,...p.modulePool.map(m=>m.moduleId)])if(!content.modules.some(m=>m.id===id))errors.push(`Missing pool module ${id}`);
 if(lab){
  if(lab.version!=='1.0.0'||!Array.isArray(lab.stations)||!Array.isArray(lab.coverage)||!Array.isArray(lab.witnesses)||!content.finiteLevels.some(l=>l.id===lab.levelId)){errors.push('Invalid lab/course identity');return errors;}
  ids(lab.stations,'station');ids(lab.coverage,'coverage');
  const required=['Run','Jump','Rise','Fall','Land','Slide','CrouchHold','Stand','Vault','DashGrapple','DashRelease','SwingGrapple','SwingRelease','Zipline','ZiplineJump','ZiplineRelease','ZiplineEnd','JumpPad','Rejected','Failed','Paused','Retry','Lap'];
  for(const id of required)if(!lab.coverage.some(c=>c.id===id))errors.push(`Missing action coverage ${id}`);
  for(const s of lab.stations){if(!(s.range?.[0]<s.range?.[1])||(!s.useLevelSpawn&&s.spawn?.length!==2))errors.push(`Invalid station ${s.id}`);for(const id of s.checks||[])if(!lab.coverage.some(c=>c.id===id))errors.push(`Unknown station check ${id}`);}
  for(const key of ['fallLimit','maxFrameSeconds','maxStepsPerFrame'])if(!Number.isFinite(lab[key]))errors.push(`Invalid lab ${key}`);
  const allowed=new Set(r.bindings.map(b=>b.action));ids(lab.witnesses,'witness');for(const w of lab.witnesses){if(!lab.stations.some(s=>s.id===w.stationId)||!Number.isInteger(w.frames)||w.frames<=0)errors.push(`Invalid rehearsal ${w.id}`);for(const a of w.actions||[])if(!allowed.has(a.action)||!Number.isInteger(a.frame)||a.frame<0||a.frame>=w.frames||!['press','release'].includes(a.phase))errors.push(`Invalid rehearsal action ${w.id}`);for(const id of w.expect||[])if(!lab.coverage.some(c=>c.id===id))errors.push(`Unknown rehearsal check ${id}`);}
 }
 return errors;
}
export function deepFreeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);Object.values(v).forEach(deepFreeze);}return v;}
export function compileWorld(content,lab){
 const level=content.finiteLevels.find(l=>l.id===lab.levelId),profiles=new Map(content.profiles.map(p=>[p.id,p])),entities=[];
 for(const ins of level.instances){const m=content.modules.find(m=>m.id===ins.moduleId),[x,y]=ins.position;for(const e of m.entities){const v={...e,id:`${ins.id}/${e.id}`,localId:e.id};if(e.rect)v.rect=[e.rect[0]+x,e.rect[1]+y,...e.rect.slice(2)];if(e.position)v.position=[e.position[0]+x,e.position[1]+y];if(e.points){v.points=e.points.map(p=>[p[0]+x,p[1]+y]);v.lengths=[];v.totalLength=0;for(let i=1;i<v.points.length;i++){const n=Math.hypot(v.points[i][0]-v.points[i-1][0],v.points[i][1]-v.points[i-1][1]);v.lengths.push(n);v.totalLength+=n;}}if(v.profileId)v.profile=profiles.get(v.profileId);entities.push(v);}}
 const endpoint=ref=>{const ins=level.instances.find(i=>i.id===ref.instanceId),module=content.modules.find(m=>m.id===ins.moduleId),socket=module.sockets.find(s=>s.id===ref.socketId);return [ins.position[0]+socket.position[0],ins.position[1]+socket.position[1]];};
 const sceneActions=level.instances.flatMap(ins=>compileSceneActions(content.modules.find(m=>m.id===ins.moduleId),ins,entities));
 return deepFreeze({entities,sceneActions,spawn:endpoint(level.spawn),finish:endpoint(level.finish),surfaces:entities.filter(e=>e.kind==='surface'),hazards:entities.filter(e=>e.kind==='hazard'),anchors:entities.filter(e=>e.kind==='anchor'),cables:entities.filter(e=>e.kind==='zipline'),pads:entities.filter(e=>e.kind==='jumpPad')});
}
