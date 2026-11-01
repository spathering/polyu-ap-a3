// Decorative layers have deterministic world cells; they never feed collision or camera.
const hash=(i,s)=>{let n=Math.imul(i^s,1597334677);n=Math.imul(n^(n>>>16),2246822507);return (n>>>0)/4294967296;};
export const CITY_THEMES=[
 {sky:['#cbdfe9','#f9e9ce'],sun:'#fff2ca',layers:['#b6cbd7','#8eaebb','#668895'],lights:'#ffe1a3'},
 {sky:['#cbcce2','#f4d9c5'],sun:'#fff1d0',layers:['#b8b8d0','#969cb5','#717f9d'],lights:'#ffddad'},
 {sky:['#afcfd8','#e4ede1'],sun:'#f9f3d5',layers:['#a1bfc4','#7c9fa9','#567e8e'],lights:'#ffe5b1'}
];
export function citySeed(id){return [...id].reduce((n,c)=>Math.imul(n,31)+c.charCodeAt(0)|0,17);}
export function drawCity(ctx,w,h,camera,seed){
 const theme=CITY_THEMES[Math.abs(seed)%CITY_THEMES.length],sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,theme.sky[0]);sky.addColorStop(1,theme.sky[1]);ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 const scale=h/720;ctx.fillStyle=theme.sun;ctx.beginPath();ctx.arc(w*.73,h*.24,42*scale,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#ffffff55';for(let i=-1;i<6;i++){const x=i*350*scale-camera.x*scale*.8%(350*scale),y=(90+hash(i,seed)*90)*scale;ctx.beginPath();ctx.ellipse(x,y,100*scale,9*scale,0,0,Math.PI*2);ctx.fill();}
 for(let layer=0;layer<3;layer++){
  const cell=(100+layer*38)*scale,offset=camera.x*(2+layer*3)*scale,first=Math.floor(offset/cell)-1,last=first+Math.ceil(w/cell)+2,base=h*(.72+layer*.08)+camera.y*scale*(1+layer);
  for(let i=first;i<=last;i++){
   const r=hash(i,seed+layer*103),x=i*cell-offset,bw=cell*(.6+r*.3),bh=(70+hash(i,seed+layer+61)*(190+layer*25))*scale,y=base-bh;
   ctx.fillStyle=theme.layers[layer];ctx.fillRect(x,y,bw,h-y);
   if(r<.32){ctx.fillRect(x+bw*.22,y-18*scale,bw*.55,18*scale);ctx.fillRect(x+bw*.48,y-53*scale,2*scale,40*scale);}
   else if(r<.65){ctx.fillRect(x+bw*.13,y-13*scale,bw*.3,13*scale);ctx.strokeStyle=theme.layers[layer];ctx.lineWidth=2*scale;ctx.beginPath();ctx.moveTo(x+bw*.7,y);ctx.lineTo(x+bw*.7,y-22*scale);ctx.lineTo(x+bw*.94,y-14*scale);ctx.stroke();}
   else {ctx.fillRect(x+bw*.2,y-27*scale,bw*.42,20*scale);ctx.fillRect(x+bw*.26,y-7*scale,3*scale,7*scale);ctx.fillRect(x+bw*.53,y-7*scale,3*scale,7*scale);}
   if(layer>0){
    const gap=(layer===2?17:13)*scale;for(let row=0;row<Math.min(16,bh/gap-1);row++)for(let col=0;col<Math.floor(bw/gap)-1;col++){
     const lit=hash(i*997+row*31+col,seed)> .68;ctx.fillStyle=lit?theme.lights+'80':'#e5f1ef28';ctx.fillRect(x+gap*(col+1),y+gap*(row+1),gap*.35,gap*.48);
    }
    if(r>.72){ctx.fillStyle=theme.lights+'99';ctx.fillRect(x+bw*.18,y+bh*.22,bw*.64,8*scale);}
   }
   if(layer===2&&r<.28){ctx.strokeStyle=theme.layers[layer];ctx.lineWidth=3*scale;ctx.beginPath();ctx.moveTo(x+bw*.6,y);ctx.lineTo(x+bw*.6,y-65*scale);ctx.lineTo(x+bw*.6+85*scale,y-65*scale);ctx.moveTo(x+bw*.6+65*scale,y-65*scale);ctx.lineTo(x+bw*.6+65*scale,y-25*scale);ctx.stroke();}
  }
 }
 const haze=ctx.createLinearGradient(0,h*.45,0,h);haze.addColorStop(0,'#f3eee000');haze.addColorStop(1,theme.sky[1]+'88');ctx.fillStyle=haze;ctx.fillRect(0,h*.45,w,h*.55);
}
// The unused rope hangs from the same anchor and maximum usable length as physics.
export function restingRope(anchor,rules,groundY=0){return [anchor.position,[anchor.position[0],anchor.position[1]-Math.min(anchor.profile.maxLength,Math.max(anchor.profile.minLength,anchor.position[1]-groundY-rules.gripOffset[1]))]];}
