export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function overlaps(a,b,pad=0){return a[0]+a[2]>b[0]+pad&&a[0]<b[0]+b[2]-pad&&a[1]+a[3]>b[1]+pad&&a[1]<b[1]+b[3]-pad;}
export const bodyRect=(p,size)=>[p.x-size[0]/2,p.y,...size];
export function rayRect(x,y,dx,dy,rect){
 let entry=-Infinity,exit=Infinity,normal=[0,0];
 for(let axis=0;axis<2;axis++){
  const p=axis?y:x,d=axis?dy:dx,min=rect[axis],max=min+rect[axis+2];
  if(Math.abs(d)<1e-10){if(p<=min+1e-9||p>=max-1e-9)return null;continue;}
  let near=(min-p)/d,far=(max-p)/d,n=d>0?-1:1;if(near>far)[near,far]=[far,near];
  if(near>entry){entry=near;normal=axis?[0,n]:[n,0];}exit=Math.min(exit,far);if(entry>exit)return null;
 }
 if(entry< -1e-8||entry>1||exit<0)return null;return {t:Math.max(0,entry),normal};
}
export function sweepBody(p,size,dx,dy,surfaces,skin){
 let best=null;const centerY=p.y+size[1]/2;
 for(const e of surfaces){const [x,y,w,h]=e.rect;
  if(e.oneWay){if(dy>=0||p.y<y+h-skin*2)continue;const t=(y+h-p.y)/dy;if(t<0||t>1)continue;const px=p.x+dx*t;if(px+size[0]/2<=x||px-size[0]/2>=x+w)continue;const hit={t,normal:[0,1],entity:e};if(!best||t<best.t)best=hit;continue;}
  const expanded=[x-size[0]/2,y-size[1]/2,w+size[0],h+size[1]],hit=rayRect(p.x,centerY,dx,dy,expanded);
  if(hit&&(!best||hit.t<best.t))best={...hit,entity:e};
 }
 return best;
}
export function moveBody(p,size,dx,dy,surfaces,skin){
 let x=p.x,y=p.y,rx=dx,ry=dy;const contacts=[];
 for(let i=0;i<4;i++){
  if(Math.hypot(rx,ry)<1e-10)break;const hit=sweepBody({x,y},size,rx,ry,surfaces,skin);
  if(!hit){x+=rx;y+=ry;break;}
  x+=rx*hit.t+hit.normal[0]*skin;y+=ry*hit.t+hit.normal[1]*skin;contacts.push(hit);
  rx*=1-hit.t;ry*=1-hit.t;if(hit.normal[0])rx=0;if(hit.normal[1])ry=0;
 }
 return {x,y,contacts};
}
export function supportAt(p,size,surfaces,distance){
 return surfaces.filter(e=>{const [x,y,w,h]=e.rect;return p.x+size[0]/2>x+1e-6&&p.x-size[0]/2<x+w-1e-6&&p.y>=y+h-1e-5&&p.y-(y+h)<=distance;}).sort((a,b)=>b.rect[1]+b.rect[3]-a.rect[1]-a.rect[3])[0]||null;
}
export function clearBody(p,size,surfaces,padding=0){return !surfaces.some(e=>!e.oneWay&&overlaps(bodyRect(p,[size[0]+padding,size[1]+padding]),e.rect,1e-6));}
export function lineClear(a,b,surfaces){return !surfaces.some(e=>!e.oneWay&&rayRect(a[0],a[1],b[0]-a[0],b[1]-a[1],e.rect));}
export function closestOnCable(point,cable){
 let best=null,travel=0;
 for(let i=0;i<cable.lengths.length;i++){const a=cable.points[i],b=cable.points[i+1],len=cable.lengths[i],t=clamp(((point[0]-a[0])*(b[0]-a[0])+(point[1]-a[1])*(b[1]-a[1]))/(len*len),0,1),at=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],distance=Math.hypot(point[0]-at[0],point[1]-at[1]);if(!best||distance<best.distance)best={at,distance,s:travel+len*t};travel+=len;}return best;
}
export function cableAt(cable,s){let left=clamp(s,0,cable.totalLength);for(let i=0;i<cable.lengths.length;i++){const len=cable.lengths[i];if(left<=len||i===cable.lengths.length-1){const a=cable.points[i],b=cable.points[i+1],t=left/len;return {at:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],tangent:[(b[0]-a[0])/len,(b[1]-a[1])/len],segment:i};}left-=len;}}
