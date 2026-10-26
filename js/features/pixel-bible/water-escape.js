export const WATER_ESCAPE_SECONDS=5;
export const WATER_ESCAPE_SPEED=1.8;

// Cancel conflicting activity before the rescue animation starts.
export function beginWaterEscape(actor,safe){
 actor.path=[];actor.task=null;actor.running=false;actor.boatRide=null;
 actor.usingObject=null;actor.interaction=null;actor.action='';actor.objectAction=null;
 actor.objectScene=null;actor.objectEvidence=null;actor.eventRoutine=null;actor.eventObjects=null;actor.eventPartner=null;
 actor.collisionStun=null;actor.expression='worried';actor.direction='down';actor.idle=0;
 const from={x:actor.x,y:actor.y},destination={x:safe.x,y:safe.y};
 const distance=Math.hypot(destination.x-from.x,destination.y-from.y);
 actor.waterEscape={elapsed:0,from,safe:destination,distance,duration:Math.max(WATER_ESCAPE_SECONDS,distance/WATER_ESCAPE_SPEED),progress:0};
 return actor.waterEscape;
}

export function advanceWaterEscape(actor,dt){
 const state=actor.waterEscape;if(!state)return false;
 state.elapsed+=Math.max(0,Math.min(.05,Number(dt)||0));
 state.progress=Math.min(1,state.elapsed/state.duration);
 actor.x=state.from.x+(state.safe.x-state.from.x)*state.progress;
 actor.y=state.from.y+(state.safe.y-state.from.y)*state.progress;
 if(state.elapsed+1e-9<state.duration)return false;
 return rescueWaterEscape(actor);
}

// A watchdog can use the same transition if animation frames are throttled or
// the tab temporarily stops painting. Keep it idempotent for timer/frame races.
export function rescueWaterEscape(actor){
 const state=actor.waterEscape;if(!state)return false;
 actor.x=state.safe.x;actor.y=state.safe.y;actor.waterEscape=null;actor.idle=3;actor.expression='worried';
 return true;
}

// Advance each submerged actor independently of ordinary NPC movement and
// cinematic playback. Returning the rescued actors lets the UI announce only
// a real escape without coupling other characters to this timer.
export function advanceWaterEscapes(actors,dt){
 const rescued=[];
 for(const actor of actors)if(actor.waterEscape&&advanceWaterEscape(actor,dt))rescued.push(actor);
 return rescued;
}
