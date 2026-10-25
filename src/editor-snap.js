// Snap one anchor in world coordinates; a batch keeps every relative offset.
export const snapCoordinate=(n,step)=>Math.round((step>0?Math.round(n/step)*step:n)*10000)/10000;
export function snappedTranslation(anchor,delta,step){
 return anchor.map((v,k)=>snapCoordinate(v+delta[k],step)-v);
}
export function selectionAnchor(data,levelId,moduleId,ids){
 if(moduleId){const e=data.modules.find(m=>m.id===moduleId).entities.find(e=>e.id===ids[0]);return e?.position||e?.points?.[0]||e?.rect?.slice(0,2)||[0,0];}
 return data.finiteLevels.find(l=>l.id===levelId).instances.find(i=>i.id===ids[0])?.position||[0,0];
}
