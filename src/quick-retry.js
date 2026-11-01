// Presentation-owned retry delay; the simulator still records failure before reset.
export class QuickRetry{
 constructor(seconds){this.seconds=seconds;this.remaining=null;}
 update(sim,dt){
  if(sim.session!=='Failed'){this.remaining=null;return false;}
  this.remaining=(this.remaining??this.seconds)-dt;
  if(this.remaining>0)return false;
  sim.retry();this.remaining=null;return true;
 }
}
