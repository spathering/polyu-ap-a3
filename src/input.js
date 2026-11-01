const ropes=new Set(['swingGrapple','zipline']);
// Resolve the shared physical control on press, and preserve that decision until release.
export function controlBindings(bindings){
 const swing=bindings.find(b=>b.action==='swingGrapple'),zip=bindings.find(b=>b.action==='zipline');
 const shared=swing&&zip&&swing.keys.some(k=>zip.keys.includes(k));
 return bindings.filter(b=>!shared||b.action!=='zipline').map(b=>shared&&b===swing?{...b,action:'rope',behaviour:'context'}:b);
}
export class SemanticInput{
 constructor(bindings,targetProvider,focusLoss,maxQueued){
  this.heldKeys=new Map();this.pointerHeld=new Map();this.held=new Set();this.queue=[];this.bindings=bindings;this.targetProvider=targetProvider;this.maxQueued=maxQueued;
  this.keydown=e=>{
   if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.closest?.('.audio-controls'))return;
   const candidates=this.bindings.filter(b=>b.keys.includes(e.code));if(!candidates.length)return;e.preventDefault();
   if(e.repeat||this.heldKeys.has(e.code))return;
   const action=this.resolve(candidates.map(b=>b.action));this.heldKeys.set(e.code,action);this.press(action);
  };
  this.keyup=e=>{const action=this.heldKeys.get(e.code);if(!action)return;e.preventDefault();this.heldKeys.delete(e.code);this.release(action);};
  this.blur=()=>{this.clear();focusLoss();};this.visibility=()=>{if(document.hidden)this.blur();};
  window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
 }
 resolve(actions){if(actions.includes('zipline')&&this.targetProvider('zipline'))return 'zipline';return actions.find(a=>this.targetProvider(a))||actions[0];}
 press(action){if(this.held.has(action))return;this.held.add(action);const target=this.targetProvider(action),command={action};if(target?.markerId)command.markerId=target.markerId;if(ropes.has(action)||action==='dashGrapple')command.targetId=target?.id??null;this.enqueue({phase:'press',command});}
 release(action){if([...this.heldKeys.values(),...this.pointerHeld.values()].includes(action))return;this.held.delete(action);this.enqueue({phase:'release',command:{action}});}
 consume(max){const events=this.queue.splice(0,max);return {pressed:events.filter(e=>e.phase==='press').map(e=>e.command),released:events.filter(e=>e.phase==='release').map(e=>e.command.action),held:[...this.held]};}
 enqueue(event){this.queue.push(event);if(this.queue.length>this.maxQueued)this.queue.splice(0,this.queue.length-this.maxQueued);}
 holdAction(control,down){if(down){if(this.pointerHeld.has(control))return;const action=control==='rope'?this.resolve(['swingGrapple','zipline']):control;this.pointerHeld.set(control,action);this.press(action);}else{const action=this.pointerHeld.get(control);if(!action)return;this.pointerHeld.delete(control);this.release(action);}}
 clear(){this.queue=[];this.held.clear();this.heldKeys.clear();this.pointerHeld.clear();}
 destroy(){window.removeEventListener('keydown',this.keydown);window.removeEventListener('keyup',this.keyup);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);}
}
