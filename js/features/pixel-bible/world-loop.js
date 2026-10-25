// The CSS rotates the world viewport on portrait screens. Orientation is a
// presentation concern; pausing the engine here freezes otherwise valid motion.
export function worldCanAnimate({disposed=false,hidden=false,allowed=true}={}){
 return !disposed&&!hidden&&allowed;
}
