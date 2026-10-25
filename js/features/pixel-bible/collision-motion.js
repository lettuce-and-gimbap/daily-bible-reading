export const RUN_SPEED = 1.9;
export const RUN_CHANCE = 0.16;
export const COLLISION_STUN_SECONDS = 3;

export function shouldRun(random=Math.random){return random()<RUN_CHANCE;}

export function runningIntoPerson(actor,next,npcs){
 const before=(other)=>Math.hypot(actor.x-other.x,actor.y-other.y);
 const after=(other)=>Math.hypot(next.x-other.x,next.y-other.y);
 return npcs.find(other=>other!==actor&&!other.waterEscape&&!other.collisionStun&&after(other)<.82&&after(other)<before(other));
}

export function runningIntoObject(next,objects,actor){
 const near=objects.filter(object=>object!==actor.boatRide);
 return near.find(object=>{
  const before=Math.hypot(actor.x-object.x,actor.y-object.y),after=Math.hypot(next.x-object.x,next.y-object.y);
  return after<.9&&after<before;
 });
}

export function impactPose(elapsed,reduced=false){
 const phase=reduced?0:Math.floor(elapsed*5)%4;
 return {sit:true,hand:1,handY:[18,16,20,17][phase],phase,bodyY:reduced?0:[0,-1,0,1][phase],legSwing:phase%2?1:0};
}

export function swimPose(elapsed,reduced=false){
 const phase=reduced?0:Math.floor(elapsed*5)%4;
 return {swimming:true,hand:1,handY:[16,19,15,18][phase],phase,bodyY:reduced?0:[0,-1,1,0][phase]};
}

export function impactSparkles(elapsed,reduced=false){
 const phase=reduced?0:elapsed*5;
 return Array.from({length:3},(_,i)=>({x:Math.round(Math.cos(phase+i*Math.PI*2/3)*18),y:Math.round(Math.sin(phase+i*Math.PI*2/3)*5)-104,kind:'star'}));
}
