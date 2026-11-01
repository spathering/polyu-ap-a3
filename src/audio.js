// Audio observes simulation events. It cannot advance gameplay or determine outcomes.
export class GameAudio{
 constructor(config,{storage,Context=globalThis.AudioContext||globalThis.webkitAudioContext}={}){
  this.config=config;this.Context=Context;this.storage=storage;this.buffers=new Map();this.voices=new Set();this.active=false;this.serial=0;this.snap=null;this.stepAt=0;this.settings={music:true,effects:true,volume:.65};
  try{const s=JSON.parse(storage?.getItem('motion-run.audio.v1')||'{}');for(const k of ['music','effects'])if(typeof s[k]==='boolean')this.settings[k]=s[k];if(Number.isFinite(s.volume))this.settings.volume=Math.max(0,Math.min(1,s.volume));}catch{}
 }
 async unlock(){
  if(!this.Context)return false;
  try{if(!this.context){this.context=new this.Context();this.master=this.context.createGain();this.master.connect(this.context.destination);this.master.gain.value=this.settings.volume;
    this.loading=Promise.all(Object.entries(this.config.tracks).map(async([id,t])=>{try{const r=await fetch(t.file);if(!r.ok)return;this.buffers.set(id,await this.context.decodeAudioData(await r.arrayBuffer()));}catch{/* An unavailable track never blocks play. */}}));}
   await this.context.resume();await this.loading;this.syncMusic();return true;
  }catch{return false;}
 }
 save(){try{this.storage?.setItem('motion-run.audio.v1',JSON.stringify(this.settings));}catch{}if(this.master)this.master.gain.setTargetAtTime(this.settings.volume,this.context.currentTime,.03);this.syncMusic();if(!this.settings.effects)this.stopEffects();}
 setActive(active){const changed=this.active!==active;this.active=active;this.syncMusic();if(changed&&!active)this.stopEffects();}
 syncMusic(){
  const enabled=this.active&&this.settings.music&&this.context?.state==='running'&&this.buffers.has('music');
  if(enabled&&!this.music){const node=this.context.createBufferSource(),gain=this.context.createGain();node.buffer=this.buffers.get('music');node.loop=true;gain.gain.value=this.config.tracks.music.gain;node.connect(gain);gain.connect(this.master);node.start();this.music={node,gain};}
  else if(!enabled&&this.music){this.music.node.stop();this.music.node.disconnect();this.music.gain.disconnect();this.music=null;}
 }
 play(id){if(!this.settings.effects||this.context?.state!=='running'||!this.buffers.has(id)||this.voices.size>=this.config.maxVoices)return;
  const node=this.context.createBufferSource(),gain=this.context.createGain();node.buffer=this.buffers.get(id);gain.gain.value=this.config.tracks[id].gain;node.connect(gain);gain.connect(this.master);this.voices.add(node);node.onended=()=>{this.voices.delete(node);node.disconnect();gain.disconnect();};node.start();
 }
 stopEffects(){for(const n of this.voices)n.stop();this.voices.clear();}
 update(s){
  this.setActive(s.session==='Playing'&&!document.hidden);
  if(this.snap!==s.snap){this.snap=s.snap;this.stepAt=s.player.gaitDistance;this.serial=s.events[0]?.serial||this.serial;return;}
  const events=s.events.filter(e=>e.serial>this.serial&&e.snap===s.snap).reverse();this.serial=Math.max(this.serial,s.events[0]?.serial||0);
  if(!document.hidden)for(const e of events){const id=this.config.events[e.id];if(id&&(this.active||['Failed','Completed'].includes(e.id)))this.play(id);}
  if(this.active&&s.player.state==='Run'&&s.player.gaitDistance-this.stepAt>=this.config.stepMetres){this.stepAt=s.player.gaitDistance;this.play('step');}
  if(s.player.state!=='Run')this.stepAt=s.player.gaitDistance;
 }
}
export async function mountAudio(host,{game=false}={}){
 const details=document.createElement('details');details.className='audio-controls';const summary=document.createElement('summary');summary.textContent='Sound';details.append(summary);host.append(details);
 try{const response=await fetch('content/audio.json');if(!response.ok)throw Error('Audio unavailable');let storage;try{storage=localStorage;}catch{}const audio=new GameAudio(await response.json(),{storage});
  for(const [key,title]of [['music','Music'],['effects','Effects']]){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=audio.settings[key];input.dataset.audio=key;input.onchange=()=>{audio.settings[key]=input.checked;audio.save();audio.unlock();};label.append(input,title);details.append(label);}
  const label=document.createElement('label'),volume=document.createElement('input');volume.type='range';volume.min=0;volume.max=1;volume.step=.05;volume.value=audio.settings.volume;volume.setAttribute('aria-label','Sound volume');volume.oninput=()=>{audio.settings.volume=Number(volume.value);audio.save();};label.append('Volume',volume);details.append(label);
  const unlock=()=>audio.unlock();document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.setActive(false);audio.stopEffects();}else if(!game)audio.setActive(true);});
  if(!game)audio.setActive(true);return audio;
 }catch{summary.textContent='Sound unavailable';return null;}
}
