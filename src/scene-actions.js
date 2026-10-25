import {sweepBody} from './collision.js';
// Geometry-derived action marks: the marker owns intent/timing, its entity owns position.
export function compileSceneActions(module,instance,entities,rules,performances=[]){
 const authored=module.sceneActions||[],automatic=[];
 if(rules)for(const e of module.entities.filter(e=>e.kind==='surface'&&e.traversal==='auto'&&!authored.some(a=>a.entityId===e.id))){
  const [x,y,w,h]=e.rect;if(h>rules.climbMaxHeight+rules.collisionSkin)continue;
  const kind=h<=rules.vaultMaxHeight+rules.collisionSkin&&w<=rules.vaultMaxWidth?'vault':'climb';
  const approach=kind==='climb'?rules.bodySize[0]+rules.collisionSkin*3:rules.runSpeed*rules.contextApproachSeconds;
  automatic.push({id:`auto-${e.id}`,entityId:e.id,kind,input:'jump',edge:'start',startOffset:-approach,leadDistance:rules.runSpeed*rules.contextInputSeconds,lateDistance:rules.bodySize[0]/2,priority:kind==='vault'?30:20,heightRange:[y-rules.groundProbeDistance,y+rules.groundProbeDistance*2]});
 }
 return [...authored,...automatic].map(marker=>{
  const entity=entities.find(e=>e.id===`${instance.id}/${marker.entityId}`);
  const point=entity.position||entity.points?.[0]||[entity.rect[0]+entity.rect[2]*(marker.edge==='end'?1:marker.edge==='center'?.5:0),entity.rect[1]+entity.rect[3]];
  const minY=marker.heightRange[0]+instance.position[1],maxY=marker.heightRange[1]+instance.position[1];
  const performanceId=marker.performanceId||rules?.performanceByKind?.[marker.kind],performance=performances.find(p=>p.id===performanceId);
  return {...marker,performanceId,performance,leadDistance:Math.max(marker.leadDistance,performance?rules.runSpeed*performance.anticipationSeconds:0),id:`${instance.id}/${marker.id}`,entityId:entity.id,startX:point[0]+marker.startOffset,minY,maxY,point:[point[0]+marker.startOffset,(minY+maxY)/2]};
 });
}

export function detectSceneAction(world,player,action,{rules=null,allowLocked=false,preferredId=null}={}){
 const finishing=allowLocked&&rules&&player.state==='Vault'&&player.context?.progress>=1-rules.actionChainWindowSeconds/(player.vault?.duration||(player.context?.kind==='mantle'?rules.sceneTraversal?.mantleSeconds:player.context?.kind==='climb'?rules.climbDurationSeconds:rules.vaultDurationSeconds));
 if(!['Run','Airborne'].includes(player.state)&&!finishing)return null;
 const candidates=world.sceneActions.filter(m=>m.input===action&&player.x>=m.startX-m.leadDistance&&player.x<=m.startX+m.lateDistance&&player.y>=m.minY&&player.y<=m.maxY&&
  m.id!==player.context?.markerId&&(!['vault','climb','slide'].includes(m.kind)||player.state==='Run'||finishing)&&(m.kind!=='zipline'||player.state==='Airborne'||finishing)&&
  (!rules||!['vault','climb'].includes(m.kind)||world.surfaces.some(e=>{if(e.id!==m.entityId)return false;const h=e.rect[1]+e.rect[3]-player.y;return h>0&&h<=(m.kind==='climb'?rules.climbMaxHeight:rules.vaultMaxHeight)+rules.collisionSkin&&(m.kind!=='vault'||e.rect[2]<=rules.vaultMaxWidth);}))&&
  (!rules||finishing||player.state!=='Run'||m.startX<=player.x||!['jump','slide','vault','climb'].includes(m.kind)||!sweepBody(player,m.kind==='slide'?rules.slideBodySize:rules.bodySize,m.startX-player.x,0,world.surfaces,rules.collisionSkin))) ;
 return candidates.sort((a,b)=>(b.id===preferredId)-(a.id===preferredId)||b.priority-a.priority||Math.abs(a.startX-player.x)-Math.abs(b.startX-player.x)||a.id.localeCompare(b.id))[0]||null;
}

export function trajectoryAt(knots,phase){
 const i=Math.max(1,knots.findIndex(k=>k[0]>=phase)),a=knots[i-1],b=knots[i]||knots.at(-1),u=Math.max(0,Math.min(1,(phase-a[0])/(b[0]-a[0]||1)));
 return [a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];
}
