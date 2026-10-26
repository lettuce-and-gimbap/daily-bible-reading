// Human sprites keep one source drawing during motion. Scene effects and
// placement animate independently so facial/body pixels never morph per frame.
export function characterSpriteFrame({motionOnly=false,walkFrame=0,action='',interaction=null,expression='neutral',baseExpression='neutral'}={}){
 if(motionOnly)return {walkFrame:((Math.trunc(walkFrame)%4)+4)%4,action:'',interaction:null,expression:baseExpression||'neutral'};
 return {walkFrame,action,interaction,expression};
}

export function walkingFrame(stride,moving=true){
 return moving?Math.floor(Math.max(0,stride||0)*2)%4:0;
}

// Reduced-motion preferences suppress decorative bobbing, not the leg cycle
// needed to communicate that a character is walking across the world.
export function characterWalkFrame({stride=0,moving=false,actionPose=false}={}){
 return walkingFrame(stride,Boolean(moving)&&!actionPose);
}
