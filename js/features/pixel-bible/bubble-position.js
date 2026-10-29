export function captureBubblePlacement(anchorX,anchorY,left,top,side){
 return {side,dx:left-anchorX,dy:top-anchorY};
}

export function pinnedBubblePlacement(pin,anchorX,anchorY,width,height,viewportWidth,viewportHeight,margin=4){
 const left=Math.max(margin,Math.min(viewportWidth-width-margin,anchorX+pin.dx));
 const top=Math.max(margin,Math.min(viewportHeight-height-margin,anchorY+pin.dy));
 return {left,right:left+width,top,bottom:top+height,side:pin.side};
}

export function chooseBubblePlacement({anchorX,anchorY,width,height,viewportWidth,viewportHeight,characters=[],placed=[],scale=1,margin=4,gap=8}){
 const left=anchorX-22*scale,right=anchorX+22*scale,top=anchorY-76*scale,bottom=anchorY-24*scale;
 const candidates=[
  {side:'left',left:left-width-gap,top:anchorY-height/2,cost:0},
  {side:'right',left:right+gap,top:anchorY-height/2,cost:0},
  {side:'left',left:left-width-gap,top:top,cost:1},
  {side:'right',left:right+gap,top:top,cost:1},
  {side:'top',left:anchorX-width/2,top:top-height-gap,cost:3},
  {side:'bottom',left:anchorX-width/2,top:bottom+gap,cost:5},
 ];
 const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
 let best=null;
 for(const candidate of candidates){
  const x=Math.max(margin,Math.min(viewportWidth-width-margin,candidate.left)),y=Math.max(margin,Math.min(viewportHeight-height-margin,candidate.top));
  const box={left:x,right:x+width,top:y,bottom:y+height};
  const actorOverlap=characters.reduce((sum,rect)=>sum+overlap(box,rect),0),bubbleOverlap=placed.reduce((sum,rect)=>sum+overlap(box,rect),0);
  const score=candidate.cost+(actorOverlap+bubbleOverlap)*10000;
  if(!best||score<best.score)best={...box,side:candidate.side,score};
 }
 return best;
}
