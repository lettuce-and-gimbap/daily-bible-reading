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
 if(elapsed<.32){
  const beat=reduced?0:Math.round(elapsed*9);
  return {fall:true,hand:1,handY:beat%2?14:19,phase:beat%2,bodyY:beat%2?-1:0,impactTilt:beat%2?-.38:.3,impactX:beat%2?-3:3,impactY:1};
 }
 if(elapsed>=2.62){
  const beat=reduced?1:Math.min(3,Math.floor((elapsed-2.62)*9));
  return {rising:beat>=2,sit:beat<2,hand:beat<2?1:0,handY:beat<2?16:23,phase:beat,bodyY:beat<2?1:0,headY:beat<2?1:0,headX:beat===0?-1:0,impactTilt:beat===0?.18:0,legSwing:beat%2};
 }
 const shake=reduced?0:Math.floor((elapsed-.32)*6)%2;
 return {sit:true,hand:1,handY:[31,32,30,31][phase],handX:shake?1:0,headX:shake?1:-1,headY:phase%2,headTilt:shake?.14:-.14,phase,bodyY:[1,2,1,0][phase],impactTilt:shake?.045:-.045,legSwing:phase%2?1:0};
}

export function swimPose(elapsed,reduced=false){
 const phase=reduced?0:Math.floor(elapsed*5)%4;
 return {swimming:true,hand:1,handY:[16,19,15,18][phase],phase,bodyY:reduced?0:[0,-1,1,0][phase]};
}

export function impactSparkles(elapsed,reduced=false){
 const phase=reduced?0:elapsed*5;
 return Array.from({length:3},(_,i)=>({x:Math.round(Math.cos(phase+i*Math.PI*2/3)*12),y:Math.round(Math.sin(phase+i*Math.PI*2/3)*2)-74,kind:'star'}));
}
