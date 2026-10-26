export const WATER_ESCAPE_SECONDS=5;

// Cancel conflicting activity before the rescue animation starts.
export function beginWaterEscape(actor,safe){
 actor.path=[];actor.task=null;actor.running=false;actor.boatRide=null;
 actor.usingObject=null;actor.interaction=null;actor.action='';actor.objectAction=null;
 actor.objectScene=null;actor.objectEvidence=null;actor.eventRoutine=null;actor.eventObjects=null;actor.eventPartner=null;
 actor.collisionStun=null;actor.expression='worried';actor.direction='down';actor.idle=0;
 actor.waterEscape={elapsed:0,safe:{x:safe.x,y:safe.y}};
 return actor.waterEscape;
}

export function advanceWaterEscape(actor,dt){
 const state=actor.waterEscape;if(!state)return false;
 state.elapsed+=Math.max(0,Math.min(.05,Number(dt)||0));
 if(state.elapsed+1e-9<WATER_ESCAPE_SECONDS)return false;
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
