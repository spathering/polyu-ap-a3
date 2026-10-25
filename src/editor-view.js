import {boundsOf,moduleOf,levelOf,socketPosition,translateEntity} from './editor-model.js';
import {compileSceneActions} from './scene-actions.js';
import {moduleSpace,heightUnit,blockAction} from './module-space.js';

const palette={surface:'#324b63',hazard:'#dc785b',anchor:'#8b6ccc',zipline:'#159bab',jumpPad:'#e1a140'};
export class EditorView{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.camera={x:26,y:3,scale:28};this.w=1;this.h=1;}
 resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);this.w=r.width;this.h=r.height;if(this.canvas.width!==Math.round(r.width*d)||this.canvas.height!==Math.round(r.height*d)){this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);}this.ctx.setTransform(d,0,0,d,0,0);}
 screen([x,y]){const c=this.camera;return [this.w/2+(x-c.x)*c.scale,this.h/2-(y-c.y)*c.scale];}
 world([x,y]){const c=this.camera;return [c.x+(x-this.w/2)/c.scale,c.y-(y-this.h/2)/c.scale];}
 zoom(factor,at=[this.w/2,this.h/2]){const before=this.world(at);this.camera.scale=Math.max(1.5,Math.min(180,this.camera.scale*factor));const after=this.world(at);this.camera.x+=before[0]-after[0];this.camera.y+=before[1]-after[1];}
 items(data,levelId,moduleId){return moduleId?moduleOf(data,moduleId).entities.map(e=>({id:e.id,rect:boundsOf(e),entity:e})):levelOf(data,levelId).instances.map(i=>{const b=moduleSpace(data,moduleOf(data,i.moduleId));return {id:i.id,rect:[b[0]+i.position[0],b[1]+i.position[1],b[2],b[3]],instance:i};});}
 hit(items,point){return [...items].reverse().find(({rect:[x,y,w,h]})=>point[0]>=x-.15&&point[0]<=x+w+.15&&point[1]>=y-.15&&point[1]<=y+h+.15)?.id;}
 frame(items,{left=50,right=50,top=100,bottom=90}={}){if(!items.length)return;const x=Math.min(...items.map(i=>i.rect[0])),y=Math.min(...items.map(i=>i.rect[1])),r=Math.max(...items.map(i=>i.rect[0]+i.rect[2])),t=Math.max(...items.map(i=>i.rect[1]+i.rect[3]));
  const scale=Math.max(1.5,Math.min(80,Math.max(200,this.w-left-right)/Math.max(1,r-x),Math.max(150,this.h-top-bottom)/Math.max(1,t-y)));
  this.camera={x:(x+r)/2-(left-right)/2/scale,y:(y+t)/2+(top-bottom)/2/scale,scale};
 }
 draw({data,levelId,moduleId=null,selection=[],offset=null,box=null,grid=.5,brush=null,ghost=null}){
  this.resize();const ctx=this.ctx,s=this.camera.scale;ctx.clearRect(0,0,this.w,this.h);ctx.fillStyle='#edf3f7';ctx.fillRect(0,0,this.w,this.h);
  const bottom=this.world([0,this.h]),top=this.world([this.w,0]),step=grid>0?grid*Math.pow(2,Math.max(0,Math.ceil(Math.log2(9/(grid*s))))):(s>40?1:s>12?2:10);
  ctx.lineWidth=1;ctx.strokeStyle='#dce6ee';ctx.beginPath();for(let x=Math.floor(bottom[0]/step)*step;x<=top[0];x+=step){const a=this.screen([x,0]);ctx.moveTo(a[0],0);ctx.lineTo(a[0],this.h);}for(let y=Math.floor(bottom[1]/step)*step;y<=top[1];y+=step){const a=this.screen([0,y]);ctx.moveTo(0,a[1]);ctx.lineTo(this.w,a[1]);}ctx.stroke();
  const zero=this.screen([0,0]);ctx.strokeStyle='#b4c8d6';ctx.beginPath();ctx.moveTo(0,zero[1]);ctx.lineTo(this.w,zero[1]);ctx.stroke();
  ctx.fillStyle='#8a9fae';ctx.font='10px system-ui';for(let x=Math.ceil(bottom[0]/(step*2))*step*2;x<=top[0];x+=step*2){const [sx]=this.screen([x,0]);ctx.fillText(`${x} m`,sx+4,this.h-90);}
  const entity=(e,origin=[0,0])=>{
   ctx.fillStyle=palette[e.kind];ctx.strokeStyle=palette[e.kind];ctx.lineWidth=2;
   if(e.rect){const [x,y,w,h]=e.rect,a=this.screen([x+origin[0],y+h+origin[1]]);ctx.globalAlpha=e.kind==='hazard'?.25:1;ctx.fillRect(...a,w*s,h*s);ctx.globalAlpha=1;if(e.vaultable||e.oneWay){ctx.fillStyle=e.vaultable?'#17bdce':'#9cbad3';ctx.fillRect(...a,w*s,Math.max(2,s*.06));}}
   if(e.position){const a=this.screen(e.position.map((v,k)=>v+origin[k]));ctx.fillStyle='#f5f9fc';ctx.beginPath();ctx.arc(...a,Math.max(5,.18*s),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#8b6ccc';ctx.fillRect(a[0]-2,a[1]-2,4,4);}
   if(e.points){ctx.beginPath();e.points.forEach((p,i)=>{const a=this.screen(p.map((v,k)=>v+origin[k]));i?ctx.lineTo(...a):ctx.moveTo(...a);});ctx.stroke();}
  };
  const drawModule=(m,origin,geometry=true)=>{if(geometry)for(const e of m.entities)entity(e,origin);
   for(const socket of m.sockets){const at=this.screen(socket.position.map((v,k)=>v+origin[k]));ctx.fillStyle=socket.role==='entry'?'#11a39c':'#b58a4b';ctx.beginPath();ctx.arc(...at,3,0,Math.PI*2);ctx.fill();}
   if(moduleId){const entities=m.entities.map(e=>{const v=structuredClone(e);translateEntity(v,...origin);v.id=`preview/${e.id}`;return v;});
    for(const a of compileSceneActions(m,{id:'preview',position:origin},entities,data.rules,data.scenePerformances||[])){const at=this.screen([a.startX,a.maxY]);ctx.fillStyle='#0eaeac15';ctx.fillRect(at[0]-a.leadDistance*s,at[1],(a.leadDistance+a.lateDistance)*s,(a.maxY-a.minY)*s);ctx.strokeStyle='#159fae';ctx.beginPath();ctx.moveTo(at[0],at[1]);ctx.lineTo(at[0],at[1]+(a.maxY-a.minY)*s);ctx.stroke();ctx.fillStyle='#168a9c';ctx.font='9px system-ui';ctx.fillText(a.kind,at[0]+4,at[1]-4);}
   }
  };
  if(moduleId){const m=moduleOf(data,moduleId),preview={...m,entities:m.entities.map(e=>{if(!offset||!selection.includes(e.id))return e;const copy=structuredClone(e);translateEntity(copy,...offset);return copy;})};drawModule(preview,[0,0]);}
  else{const level=levelOf(data,levelId);
   for(const i of level.instances){const m=moduleOf(data,i.moduleId),b=moduleSpace(data,m),selected=selection.includes(i.id),origin=i.position.map((v,k)=>v+(selected&&offset?offset[k]:0)),at=this.screen([origin[0]+b[0],origin[1]+b[1]+b[3]]),terrain=m.tags.includes('scene-terrain');ctx.fillStyle=selected?'#12aeb90c':'#fff3';if(!terrain)ctx.fillRect(...at,b[2]*s,b[3]*s);drawModule(m,origin);ctx.strokeStyle=selected?'#139eb1':'#a6bbc980';ctx.lineWidth=selected?2:1;ctx.setLineDash(selected?[]:[4,5]);if(!terrain||selected)ctx.strokeRect(...at,b[2]*s,b[3]*s);ctx.setLineDash([]);if(!terrain){ctx.fillStyle=selected?'#087c8c':'#7792a5';ctx.font='600 10px system-ui';ctx.fillText(i.id.toUpperCase(),at[0]+7,at[1]-6);}}
   for(const ref of [level.spawn,level.finish]){const at=this.screen(socketPosition(data,level,ref)),start=ref===level.spawn;ctx.fillStyle=start?'#139a9c':'#c38c3c';ctx.fillRect(at[0]-1,at[1]-45,2,45);ctx.fillText(start?'SPAWN':'FINISH',at[0]+6,at[1]-34);}
  }
  if(moduleId)for(const item of this.items(data,levelId,moduleId).filter(i=>selection.includes(i.id))){const [x,y,w,h]=item.rect,a=this.screen([x+(offset?.[0]||0),y+h+(offset?.[1]||0)]);ctx.strokeStyle='#159eaf';ctx.lineWidth=2;ctx.strokeRect(a[0]-4,a[1]-4,w*s+8,h*s+8);ctx.fillStyle='#078e9f';ctx.font='10px system-ui';ctx.fillText(item.id,a[0],a[1]-10);}
  if(box){const a=this.screen(box[0]),b=this.screen(box[1]);ctx.fillStyle='#0a9caf15';ctx.strokeStyle='#1c9eaf';ctx.lineWidth=1;ctx.fillRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);ctx.strokeRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);}
  if(ghost){const m=moduleOf(data,ghost.moduleId),b=moduleSpace(data,m),at=this.screen([ghost.position[0]+b[0],ghost.position[1]+b[1]+b[3]]);ctx.globalAlpha=.55;drawModule(m,ghost.position);ctx.fillStyle='#13a5be18';ctx.fillRect(...at,b[2]*s,b[3]*s);ctx.strokeStyle='#068fa5';ctx.setLineDash([6,4]);ctx.strokeRect(...at,b[2]*s,b[3]*s);ctx.setLineDash([]);ctx.globalAlpha=1;const pin=this.screen(ghost.position);ctx.fillStyle='#087f91';ctx.font='11px system-ui';ctx.fillText(`ENTRY ${ghost.position.map(v=>v.toFixed(2)).join(', ')} m`,pin[0]+8,pin[1]-12);}
  if(brush){const [x,y,w,h]=brush,at=this.screen([x,y+h]);ctx.fillStyle='#15b3c12b';ctx.fillRect(...at,w*s,h*s);ctx.strokeStyle='#088c9c';ctx.lineWidth=2;ctx.strokeRect(...at,w*s,h*s);ctx.fillStyle='#126a7a';ctx.font='600 11px system-ui';ctx.fillText(`${w.toFixed(2)} × ${h.toFixed(2)} m · ${(h/heightUnit(data)).toFixed(2)} H · ${blockAction(data,w,h)}`,at[0]+5,at[1]-9);
   const person=this.screen([x-data.rules.bodySize[0],y]),height=data.rules.bodySize[1]*s;ctx.strokeStyle='#607e94';ctx.lineWidth=Math.max(2,data.rules.bodySize[0]*s*.3);ctx.beginPath();ctx.moveTo(person[0],person[1]-height*.85);ctx.lineTo(person[0],person[1]-height*.35);ctx.lineTo(person[0]-height*.1,person[1]);ctx.moveTo(person[0],person[1]-height*.35);ctx.lineTo(person[0]+height*.1,person[1]);ctx.stroke();ctx.beginPath();ctx.arc(person[0],person[1]-height*.93,height*.075,0,Math.PI*2);ctx.stroke();}
 }
}
