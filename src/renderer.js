import {clamp,cableAt} from './collision.js';
import {CharacterAnimation} from './animation.js';
import {PoseTransition} from './pose-transition.js';
const COLORS={ink:'#142840',muted:'#91a6bb',cyan:'#13b9cf',swing:'#8b64d9',amber:'#e7a442',hazard:'#dc6e58'};
export class Renderer{
 constructor(canvas,world,lab,rules){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.world=world;this.lab=lab;this.rules=rules;this.debug=false;this.useSprites=true;this.images=new Map();this.animation=null;this.artStatus='Loading processed sprites…';}
 async loadArt(){try{
  const response=await fetch(this.lab.art.manifest);if(!response.ok)throw Error('Animation catalog unavailable');
  const catalog=await response.json();this.animation=new CharacterAnimation(catalog,this.rules);this.poseTransition=new PoseTransition(catalog.timing);
  const sheets=catalog.clips.flatMap(c=>c.sheets);await Promise.all(sheets.map(async sheet=>{
   const image=new Image();image.src=sheet.file;try{await image.decode();this.images.set(sheet.file,image);}catch{/* Missing local research art uses the rig fallback. */}
  }));
  this.artStatus=this.images.size===sheets.length?'Processed sprites ready':`Sprites ${this.images.size}/${sheets.length} · missing frames use rig fallback`;
 }catch{this.artStatus='Sprite catalog unavailable · rig fallback';}}
 resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.w=rect.width;this.h=rect.height;if(this.canvas.width!==Math.round(rect.width*dpr)||this.canvas.height!==Math.round(rect.height*dpr)){this.canvas.width=Math.round(rect.width*dpr);this.canvas.height=Math.round(rect.height*dpr);}this.ctx.setTransform(dpr,0,0,dpr,0,0);}
 draw(snapshot,camera){
  this.resize();const ctx=this.ctx,w=this.w,h=this.h,p=snapshot.player;this.scale=h/camera.height;this.camera=camera;const unit=this.scale;
  const xy=(x,y)=>[w/2+(x-camera.x)*unit,h/2-(y-camera.y)*unit];this.xy=xy;
  ctx.clearRect(0,0,w,h);const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#dce8f3');sky.addColorStop(1,'#f7fafc');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  // Decorative skyline is separate from collision geometry and gameplay data.
  ctx.fillStyle='#cfdeeb';for(let i=-2;i<12;i++){const x=i*140-((camera.x*unit*.12)%140),hh=70+((i*37+79)%100);ctx.fillRect(x,h*.75-hh,90,hh+150);ctx.fillRect(x+24,h*.75-hh-12,28,16);}
  const minX=camera.x-w/(2*unit),maxX=camera.x+w/(2*unit);
  ctx.strokeStyle='#b7cbdc55';ctx.lineWidth=1;for(let x=Math.floor(minX/2)*2;x<maxX;x+=2){const q=xy(x,0);ctx.beginPath();ctx.moveTo(q[0],0);ctx.lineTo(q[0],h);ctx.stroke();}
  for(let y=-8;y<20;y+=2){const q=xy(0,y);ctx.beginPath();ctx.moveTo(0,q[1]);ctx.lineTo(w,q[1]);ctx.stroke();}
  for(const station of this.lab.stations){if(station.range[1]<minX||station.range[0]>maxX)continue;const a=xy(station.range[0],0);ctx.fillStyle='#748ca230';ctx.fillRect(a[0],0,1,h);ctx.fillStyle='#6e879e';ctx.font='600 11px system-ui';ctx.fillText(`${String(this.lab.stations.indexOf(station)+1).padStart(2,'0')} / ${station.name.toUpperCase()}`,a[0]+12,25);
   if(station.cueX>=minX&&station.cueX<=maxX){const [x,y]=xy(station.cueX,2.9);ctx.font='600 11px system-ui';const text=station.keys,tw=ctx.measureText(text).width;ctx.fillStyle='#ffffffdc';ctx.beginPath();ctx.roundRect(x-tw/2-9,y-17,tw+18,25,5);ctx.fill();ctx.fillStyle=COLORS.ink;ctx.fillText(text,x-tw/2,y);}}
  for(const e of this.world.surfaces){const [x,y,ww,hh]=e.rect;if(x+ww<minX||x>maxX)continue;const a=xy(x,y+hh);ctx.fillStyle=e.oneWay?'#546b87':'#233d57';ctx.fillRect(a[0],a[1],ww*unit,hh*unit);ctx.fillStyle=e.vaultable?COLORS.cyan:'#526c85';ctx.fillRect(a[0],a[1],ww*unit,Math.max(3,unit*.06));if(e.vaultable){ctx.fillStyle='#adf5f5';for(let xx=a[0]+5;xx<a[0]+ww*unit;xx+=12)ctx.fillRect(xx,a[1]+7,5,2);}if(e.oneWay){ctx.setLineDash([5,5]);ctx.strokeStyle='#acd3e9';ctx.beginPath();ctx.moveTo(a[0],a[1]+5);ctx.lineTo(a[0]+ww*unit,a[1]+5);ctx.stroke();ctx.setLineDash([]);}}
  for(const pad of this.world.pads){const [x,y,ww,hh]=pad.rect,a=xy(x,y+hh);ctx.fillStyle=COLORS.amber;ctx.fillRect(a[0],a[1]-5,ww*unit,Math.max(8,hh*unit));ctx.strokeStyle='#f5bc61';ctx.lineWidth=2;for(let xx=a[0]+12;xx<a[0]+ww*unit;xx+=18){ctx.beginPath();ctx.moveTo(xx-4,a[1]-9);ctx.lineTo(xx,a[1]-14);ctx.lineTo(xx+4,a[1]-9);ctx.stroke();}}
  for(const cable of this.world.cables){ctx.strokeStyle='#148798';ctx.lineWidth=3;ctx.beginPath();for(const [i,pt]of cable.points.entries()){const a=xy(...pt);i?ctx.lineTo(...a):ctx.moveTo(...a);}ctx.stroke();for(const point of [cable.points[0],cable.points.at(-1)]){const a=xy(...point);ctx.fillStyle='#148798';ctx.beginPath();ctx.arc(...a,5,0,Math.PI*2);ctx.fill();}}
  for(const anchor of this.world.anchors){const a=xy(...anchor.position),kind=anchor.profile.kind,target=snapshot.targets[kind]?.id===anchor.id,color=kind==='dashGrapple'?COLORS.cyan:COLORS.swing;ctx.strokeStyle=color;ctx.fillStyle=target?color:'#f5f9fc';ctx.lineWidth=2;ctx.beginPath();ctx.arc(...a,target?10:7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=target?'#fff':color;ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText(kind==='dashGrapple'?'E':'Q',a[0],a[1]+3);ctx.textAlign='left';if(target){ctx.setLineDash([3,5]);ctx.globalAlpha=.4;ctx.beginPath();ctx.arc(...a,18,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}}
  for(const marker of this.world.sceneActions){
   if(marker.startX<minX||marker.startX>maxX)continue;const at=xy(marker.startX,marker.minY),queued=snapshot.pendingAction?.markerId===marker.id;
   ctx.strokeStyle=queued?'#e7a442':'#21a9b7';ctx.lineWidth=queued?3:1.5;ctx.beginPath();ctx.moveTo(at[0],at[1]);ctx.lineTo(at[0],at[1]-unit*.45);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 9px system-ui';ctx.fillText(queued?'QUEUED':marker.input==='automatic'?'CONTACT':marker.input==='jump'?'SPACE':marker.input==='slide'?'S':marker.input==='dashGrapple'?'E':marker.input==='swingGrapple'?'Q':'F',at[0]+5,at[1]-unit*.4);
   if(this.debug){ctx.fillStyle=queued?'#e7a44222':'#13b9cf16';ctx.fillRect(at[0]-marker.leadDistance*unit,at[1]-(marker.maxY-marker.minY)*unit,(marker.leadDistance+marker.lateDistance)*unit,(marker.maxY-marker.minY)*unit);ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(at[0],at[1]);ctx.lineTo(at[0],at[1]-(marker.maxY-marker.minY)*unit);ctx.stroke();ctx.setLineDash([]);}
  }
  const attachment=p.attachment,entity=attachment?this.world.entities.find(e=>e.id===attachment.id):null;
  const pose=this.spritePose(snapshot,entity);this.lastPose=pose?{sequence:pose.sample.sequence,clip:pose.sample.clip.id,frame:pose.sample.index}:null;
  if(entity?.position){const a=pose?.grip||(attachment.kind==='swingGrapple'?xy(...snapshot.grip):xy(p.x,p.y+snapshot.size[1]*.8)),b=xy(...entity.position);ctx.strokeStyle=attachment.kind==='dashGrapple'?COLORS.cyan:COLORS.swing;ctx.lineWidth=attachment.kind==='dashGrapple'?2:3;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
  if(entity?.points){const a=xy(...cableAt(entity,attachment.s).at);ctx.fillStyle=COLORS.ink;ctx.beginPath();ctx.roundRect(a[0]-7,a[1]-4,14,8,3);ctx.fill();}
  const gate=xy(...this.world.finish);ctx.strokeStyle=COLORS.cyan;ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(gate[0],gate[1]);ctx.lineTo(gate[0],gate[1]-4*unit);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#147f8f';ctx.font='bold 11px system-ui';ctx.fillText('LAP RETURN',gate[0]-32,gate[1]-4.2*unit);
  if(pose)this.drawAnimatedSprite(pose,snapshot,entity);else{this.poseTransition=null;this.drawBody(snapshot);}
  const foot=xy(p.x,p.y);ctx.fillStyle='#13b9cf';ctx.beginPath();ctx.arc(foot[0],foot[1],2,0,Math.PI*2);ctx.fill();
  if(this.debug){const b=snapshot.size,a=xy(p.x-b[0]/2,p.y+b[1]);ctx.strokeStyle='#0cabc6';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.strokeRect(a[0],a[1],b[0]*unit,b[1]*unit);ctx.setLineDash([]);const c=xy(p.x,p.y+b[1]/2);ctx.strokeStyle='#d97932';ctx.beginPath();ctx.moveTo(...c);ctx.lineTo(c[0]+p.vx*unit*.15,c[1]-p.vy*unit*.15);ctx.stroke();if(attachment?.length&&entity){const center=xy(...entity.position);ctx.strokeStyle='#8b64d955';ctx.beginPath();ctx.arc(...center,attachment.length*unit,0,Math.PI*2);ctx.stroke();}}
  if(this.debug){for(const [label,point]of [['H',[p.x,p.y]],['V',[p.x+snapshot.size[0]/2,p.y+snapshot.size[1]/2]],['GRIP',snapshot.grip]]){const at=xy(...point);ctx.fillStyle='#d17b2f';ctx.beginPath();ctx.arc(...at,3,0,Math.PI*2);ctx.fill();ctx.font='9px system-ui';ctx.fillText(label,at[0]+5,at[1]-5);}}
  if(snapshot.session!=='Playing'){ctx.fillStyle='#1021374d';ctx.fillRect(0,0,w,h);}
 }
 spritePose(snapshot,entity,sampleOverride=null){
  if(!this.useSprites||!this.animation)return null;
  let sample=sampleOverride||this.animation.sample(snapshot,this.world);
  if(!sampleOverride&&sample.fraction>=.5)sample={...sample,index:sample.nextIndex,frame:sample.nextFrame};
  const {clip,frame}=sample,image=this.images.get(clip.sheets[frame.sheet].file);if(!image)return null;
  const p=snapshot.player,cal=this.animation.catalog.calibration,scale=this.scale/(frame.pixelsPerMetre||clip.pixelsPerMetre)*this.rules.bodySize[1]/cal.referenceBodyHeightMetres;
  const pelvis=clip.origin==='generated'||['Airborne','DashGrapple'].includes(p.state);
  let point=this.xy(p.x,p.y+(pelvis?this.rules.bodySize[1]*cal.pelvisHeightRatio:0)),anchor=pelvis?frame.pelvis:frame.anchor,rotation=0,grip=null;
  if(frame.grip&&['SwingGrapple','Zipline'].includes(p.state)){
   point=entity?.points?this.xy(...cableAt(entity,p.attachment.s).at):this.xy(p.x+this.rules.gripOffset[0],p.y+this.rules.gripOffset[1]);anchor=frame.grip;grip=point;
   if(entity?.position)rotation=Math.atan2(entity.position[0]-p.x,entity.position[1]-(p.y+this.rules.gripOffset[1]));
  }
  if(p.context?.kind==='vault'&&frame.contact){const u=p.context.progress,[a,b]=cal.contactWindow,blend=cal.contactBlendFraction,weight=clamp(Math.min((u-a)/blend,(b-u)/blend),0,1),target=this.xy(...p.context.contact),hand=[point[0]+(frame.contact[0]-anchor[0])*scale,point[1]+(frame.contact[1]-anchor[1])*scale],dx=target[0]-hand[0],dy=target[1]-hand[1],limit=cal.maxContactWarpMetres*this.scale,factor=Math.min(1,limit/(Math.hypot(dx,dy)||1))*weight;point=[point[0]+dx*factor,point[1]+dy*factor];}
  return {sample,image,scale,point,anchor,rotation,grip};
 }
 spritePelvis(pose){const {frame}=pose.sample,dx=(frame.pelvis[0]-pose.anchor[0])*pose.scale,dy=(frame.pelvis[1]-pose.anchor[1])*pose.scale,c=Math.cos(pose.rotation),s=Math.sin(pose.rotation);return [pose.point[0]+dx*c-dy*s,pose.point[1]+dx*s+dy*c];}
 drawAnimatedSprite(pose,snapshot,entity){
  if(!this.poseTransition)this.poseTransition=new PoseTransition(this.animation.catalog.timing);
  const base=this.xy(snapshot.player.x,snapshot.player.y),pelvis=this.spritePelvis(pose),local=pelvis.map((v,i)=>(v-base[i])/this.scale),transition=this.poseTransition.update(snapshot,pose,local);
  const shift=transition.correction.map(v=>v*this.scale),current={...pose,point:pose.point.map((v,i)=>v+shift[i])};
  // Rotate about the calibrated pelvis so release smoothing cannot add a root hop.
  const before=this.spritePelvis(current);current.rotation+=transition.rotationCorrection;const after=this.spritePelvis(current);current.point=current.point.map((v,i)=>v+before[i]-after[i]);
  this.drawSprite(current);
 }
 drawSprite(pose,opacity=1){
  const {image,sample,point,anchor,rotation,scale}=pose,[sx,sy,w,h]=sample.frame.rect,ctx=this.ctx;
  if(opacity<=0)return;ctx.save();ctx.globalAlpha=opacity;ctx.translate(...point);ctx.rotate(rotation);ctx.imageSmoothingEnabled=true;
  ctx.drawImage(image,sx,sy,w,h,-anchor[0]*scale,-anchor[1]*scale,w*scale,h*scale);ctx.restore();
 }
 drawBody(snapshot){
  const p=snapshot.player,ctx=this.ctx,xy=this.xy,unit=this.scale,low=snapshot.size[1]<1,phase=p.stateTime*Math.max(3,Math.abs(p.vx))*2.3;
  let hip=[0,.88],chest=[.04,1.34],neck=[.07,1.5],head=[.08,1.67],knees=[[-.18,.48],[.24,.45]],feet=[[-.3,.08],[.35,.08]],elbows=[[-.28,1.12],[.35,1.12]],hands=[[-.2,1.35],[.42,1.32]];
  if(p.state==='Run'){const k=Math.sin(phase),q=Math.cos(phase);knees=[[-k*.26,.45],[k*.26,.45]];feet=[[-k*.45,Math.max(.07,-q*.17)],[k*.45,Math.max(.07,q*.17)]];elbows=[[-k*.32,1.13],[k*.32,1.1]];hands=[[-k*.4,1.3],[k*.4,1.26]];hip[1]+=.025*Math.cos(phase*2);}
  if(low){hip=[-.1,.34];chest=[.17,.45];neck=[.33,.51];head=[.42,.64];knees=[[-.27,.16],[.28,.15]];feet=[[-.55,.08],[.55,.08]];elbows=[[-.2,.36],[.35,.3]];hands=[[-.45,.26],[.6,.22]];}
  else if(['Airborne','DashGrapple','Vault'].includes(p.state)){const up=p.vy>0;knees=[[-.25,up?.65:.43],[.28,up?.72:.45]];feet=[[-.45,up?.38:.08],[.42,up?.5:.1]];elbows=[[-.3,1.2],[.4,1.27]];hands=[[-.4,1.47],[.6,1.5]];if(p.state==='DashGrapple'){hands=[[.6,1.55],[.55,1.48]];feet=[[-.6,.55],[-.2,.15]];}if(p.state==='Vault'){hip=[0,1];knees=[[-.2,.75],[.4,.8]];feet=[[-.45,.65],[.6,.7]];hands=[[.5,.8],[.55,.85]];}}
  if(['SwingGrapple','Zipline'].includes(p.state)){const e=this.world.entities.find(e=>e.id===p.attachment?.id);let target=e?.position;if(e?.points)target=cableAt(e,p.attachment.s).at;let nx=0,ny=1;if(target){const dx=target[0]-p.x,dy=target[1]-(p.y+1.4),len=Math.hypot(dx,dy);nx=dx/len;ny=dy/len;}hands=[[nx*.48,1.38+ny*.52],[nx*.48+.04,1.38+ny*.52]];elbows=[[nx*.25-.1,1.42+ny*.25],[nx*.25+.08,1.42+ny*.25]];head=[.06,1.4];neck=[0,1.25];chest=[0,1.1];hip=[0,.65];knees=[[-.28,.3],[.16,.32]];feet=[[-.42,.1],[.3,.12]];}
  if(['SwingGrapple','Zipline'].includes(p.state)){const [gx,gy]=this.rules.gripOffset;hands=[[gx-.025,gy],[gx+.025,gy]];elbows=[[gx-.12,1.4+(gy-1.4)*.5],[gx+.12,1.4+(gy-1.4)*.5]];}
  if(p.landLeft>0){hip[1]-=.1;chest[1]-=.1;head[1]-=.1;neck[1]-=.1;}
  const joint=a=>xy(p.x+a[0],p.y+a[1]);ctx.strokeStyle=ctx.fillStyle=COLORS.ink;ctx.lineCap=ctx.lineJoin='round';
  const limb=(a,b,width)=>{ctx.lineWidth=width*unit;ctx.beginPath();ctx.moveTo(...joint(a));ctx.lineTo(...joint(b));ctx.stroke();};
  limb(hip,chest,.31);limb(chest,neck,.24);for(let i=0;i<2;i++){limb(hip,knees[i],.19);limb(knees[i],feet[i],.135);limb(feet[i],[feet[i][0]+.11,feet[i][1]-.01],.12);limb(chest,elbows[i],.14);limb(elbows[i],hands[i],.105);}
  const hp=joint(head);ctx.beginPath();ctx.roundRect(hp[0]-.125*unit,hp[1]-.15*unit,.25*unit,.29*unit,.06*unit);ctx.fill();
 }
}
