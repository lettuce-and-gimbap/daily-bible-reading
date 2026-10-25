export const WATER_ESCAPE_SECONDS=5;

// Cancel conflicting activity before the rescue animation starts.
export function beginWaterEscape(actor,safe){
 actor.path=[];actor.task=null;actor.running=false;actor.boatRide=null;
 actor.usingObject=null;actor.interaction=null;actor.action='';actor.objectAction=null;
 actor.collisionStun=null;actor.expression='worried';actor.direction='down';actor.idle=0;
 actor.waterEscape={elapsed:0,safe:{x:safe.x,y:safe.y}};
 return actor.waterEscape;
}

export function advanceWaterEscape(actor,dt){
 const state=actor.waterEscape;if(!state)return false;
 state.elapsed+=Math.max(0,Math.min(.05,Number(dt)||0));
 if(state.elapsed+1e-9<WATER_ESCAPE_SECONDS)return false;
 actor.x=state.safe.x;actor.y=state.safe.y;actor.waterEscape=null;actor.idle=3;actor.expression='worried';
 return true;
}
