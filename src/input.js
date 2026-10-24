export class SemanticInput{
 constructor(bindings,targetProvider,focusLoss,maxQueued){
  this.heldKeys=new Set();this.pointerHeld=new Set();this.held=new Set();this.queue=[];this.bindings=bindings;this.targetProvider=targetProvider;this.maxQueued=maxQueued;
  this.keydown=e=>{
   if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const binding=this.bindings.find(b=>b.keys.includes(e.code));if(!binding)return;e.preventDefault();if(e.repeat||this.heldKeys.has(e.code))return;this.heldKeys.add(e.code);if(this.held.has(binding.action))return;this.held.add(binding.action);
   const target=this.targetProvider(binding.action),command={action:binding.action};if(target?.markerId)command.markerId=target.markerId;if(['dashGrapple','swingGrapple','zipline'].includes(binding.action))command.targetId=target?.id??null;
   this.enqueue({phase:'press',command});
  };
  this.keyup=e=>{const binding=this.bindings.find(b=>b.keys.includes(e.code));if(!binding||!this.heldKeys.has(e.code))return;e.preventDefault();this.heldKeys.delete(e.code);if(!this.pointerHeld.has(binding.action)&&!binding.keys.some(k=>this.heldKeys.has(k))){this.held.delete(binding.action);this.enqueue({phase:'release',command:{action:binding.action}});}};
  this.blur=()=>{this.clear();focusLoss();};this.visibility=()=>{if(document.hidden)this.blur();};
  window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
 }
 consume(max){const events=this.queue.splice(0,max);return {pressed:events.filter(e=>e.phase==='press').map(e=>e.command),released:events.filter(e=>e.phase==='release').map(e=>e.command.action),held:[...this.held]};}
 enqueue(event){this.queue.push(event);if(this.queue.length>this.maxQueued)this.queue.splice(0,this.queue.length-this.maxQueued);}
 holdAction(action,down){if(down){this.pointerHeld.add(action);if(this.held.has(action))return;this.held.add(action);const target=this.targetProvider(action),command={action};if(target?.markerId)command.markerId=target.markerId;if(['dashGrapple','swingGrapple','zipline'].includes(action))command.targetId=target?.id??null;this.enqueue({phase:'press',command});}else{if(!this.pointerHeld.has(action))return;this.pointerHeld.delete(action);if(!this.bindings.find(b=>b.action===action)?.keys.some(k=>this.heldKeys.has(k))){this.held.delete(action);this.enqueue({phase:'release',command:{action}});}}}
 clear(){this.queue=[];this.held.clear();this.heldKeys.clear();this.pointerHeld.clear();}
 destroy(){window.removeEventListener('keydown',this.keydown);window.removeEventListener('keyup',this.keyup);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);}
}
