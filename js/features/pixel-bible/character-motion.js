// Human sprites keep one source drawing during motion. Scene effects and
// placement animate independently so facial/body pixels never morph per frame.
export function characterSpriteFrame({motionOnly=false,walkFrame=0,action='',interaction=null,expression='neutral',baseExpression='neutral'}={}){
 if(motionOnly)return {walkFrame:0,action:'',interaction:null,expression:baseExpression||'neutral'};
 return {walkFrame,action,interaction,expression};
}
