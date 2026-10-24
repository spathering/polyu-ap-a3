// Geometry-derived action marks: the marker owns intent/timing, its entity owns position.
export function compileSceneActions(module,instance,entities){
 return (module.sceneActions||[]).map(marker=>{
  const entity=entities.find(e=>e.id===`${instance.id}/${marker.entityId}`);
  const point=entity.position||entity.points?.[0]||[entity.rect[0]+entity.rect[2]*(marker.edge==='end'?1:marker.edge==='center'?.5:0),entity.rect[1]+entity.rect[3]];
  const minY=marker.heightRange[0]+instance.position[1],maxY=marker.heightRange[1]+instance.position[1];
  return {...marker,id:`${instance.id}/${marker.id}`,entityId:entity.id,startX:point[0]+marker.startOffset,minY,maxY,point:[point[0]+marker.startOffset,(minY+maxY)/2]};
 });
}

export function detectSceneAction(world,player,action){
 if(!['Run','Airborne'].includes(player.state))return null;
 const candidates=world.sceneActions.filter(m=>m.input===action&&player.x>=m.startX-m.leadDistance&&player.x<=m.startX+m.lateDistance&&player.y>=m.minY&&player.y<=m.maxY&&
  (!['vault','slide'].includes(m.kind)||player.state==='Run')&&(m.kind!=='zipline'||player.state==='Airborne'));
 return candidates.sort((a,b)=>b.priority-a.priority||Math.abs(a.startX-player.x)-Math.abs(b.startX-player.x)||a.id.localeCompare(b.id))[0]||null;
}

export function trajectoryAt(knots,phase){
 const i=Math.max(1,knots.findIndex(k=>k[0]>=phase)),a=knots[i-1],b=knots[i]||knots.at(-1),u=Math.max(0,Math.min(1,(phase-a[0])/(b[0]-a[0]||1)));
 return [a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];
}
