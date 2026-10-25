export function captureBubblePlacement(anchorX,anchorY,left,top,side){
 return {side,dx:left-anchorX,dy:top-anchorY};
}

export function pinnedBubblePlacement(pin,anchorX,anchorY,width,height,viewportWidth,viewportHeight,margin=4){
 const left=Math.max(margin,Math.min(viewportWidth-width-margin,anchorX+pin.dx));
 const top=Math.max(margin,Math.min(viewportHeight-height-margin,anchorY+pin.dy));
 return {left,right:left+width,top,bottom:top+height,side:pin.side};
}
