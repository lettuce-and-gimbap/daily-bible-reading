export const WATER_ESCAPE_SECONDS=5;
export const WATER_ESCAPE_SPEED=1.8;
export const WATER_TREAD_SECONDS=3;
export const WATER_HUFF_SECONDS=2;

// Cancel conflicting activity before the rescue animation starts.
export function beginWaterEscape(actor,safe){
 actor.path=[];actor.task=null;actor.running=false;actor.boatRide=null;
 actor.waterHuff=null;
 actor.usingObject=null;actor.interaction=null;actor.action='';actor.objectAction=null;
 actor.objectScene=null;actor.objectEvidence=null;actor.eventRoutine=null;actor.eventObjects=null;actor.eventPartner=null;
 actor.collisionStun=null;actor.expression='worried';actor.direction='down';actor.idle=0;
 const from={x:actor.x,y:actor.y},destination={x:safe.x,y:safe.y};
 const distance=Math.hypot(destination.x-from.x,destination.y-from.y);
 const swimDuration=Math.max(WATER_ESCAPE_SECONDS,distance/WATER_ESCAPE_SPEED);
 actor.waterEscape={elapsed:0,from,safe:destination,distance,swimDuration,duration:WATER_TREAD_SECONDS+swimDuration,phase:'treading',progress:0};
 return actor.waterEscape;
}

export function advanceWaterEscape(actor,dt){
 const state=actor.waterEscape;if(!state)return false;
 state.elapsed+=Math.max(0,Math.min(.05,Number(dt)||0));
 if(state.elapsed+1e-9<WATER_TREAD_SECONDS){state.phase='treading';state.progress=0;return false;}
 state.phase='swimming';state.progress=Math.min(1,(state.elapsed-WATER_TREAD_SECONDS)/state.swimDuration);
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
 actor.waterHuff={elapsed:0,duration:WATER_HUFF_SECONDS};
 return true;
}

// Pause a rescued character briefly for a visible breath before ordinary
// movement resumes. Returns true while the panting phase is still active.
export function advanceWaterHuff(actor,dt){
 const huff=actor.waterHuff;if(!huff)return false;
 huff.elapsed+=Math.max(0,Math.min(.05,Number(dt)||0));
 if(huff.elapsed+1e-9<huff.duration)return true;
 actor.waterHuff=null;actor.expression='neutral';actor.idle=.35;return false;
}

// Advance each submerged actor independently of ordinary NPC movement and
// cinematic playback. Returning the rescued actors lets the UI announce only
// a real escape without coupling other characters to this timer.
export function advanceWaterEscapes(actors,dt){
 const rescued=[];
 for(const actor of actors)if(actor.waterEscape&&advanceWaterEscape(actor,dt))rescued.push(actor);
 return rescued;
}
