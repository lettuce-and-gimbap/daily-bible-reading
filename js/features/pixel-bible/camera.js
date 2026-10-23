export const WORLD={width:2880,height:1728,tile:24};
export const BOUNDS={minX:2,maxX:WORLD.width/24-3,minY:4,maxY:WORLD.height/24-3};
export const ZOOM={min:.4,max:2.5};
export function cameraView(width,height,camera){
 const scale=Math.max(width/960,height/480)*camera.zoom;
 return {scale,x:width/2-camera.x*scale,y:height/2-camera.y*scale};
}
export function constrainCamera(camera,width,height){
 const base=Math.max(width/960,height/480);
 const min=Math.max(ZOOM.min,width/WORLD.width/base,height/WORLD.height/base);
 camera.zoom=Math.max(min,Math.min(ZOOM.max,camera.zoom));
 const scale=base*camera.zoom,hx=width/(2*scale),hy=height/(2*scale);
 camera.x=Math.max(hx,Math.min(WORLD.width-hx,camera.x));
 camera.y=Math.max(hy,Math.min(WORLD.height-hy,camera.y));
 return camera;
}
export function toWorld(point,width,height,camera){
 const v=cameraView(width,height,camera);
 return {x:(point.x-v.x)/v.scale,y:(point.y-v.y)/v.scale};
}
export function zoomAt(camera,zoom,point,width,height){
 const anchor=toWorld(point,width,height,camera);
 camera.zoom=zoom;constrainCamera(camera,width,height);
 const scale=cameraView(width,height,camera).scale;
 camera.x=anchor.x-(point.x-width/2)/scale;camera.y=anchor.y-(point.y-height/2)/scale;
 return constrainCamera(camera,width,height);
}
export function pinchCamera(camera,anchor,zoom,mid,width,height){
 camera.zoom=zoom;constrainCamera(camera,width,height);
 const scale=cameraView(width,height,camera).scale;
 camera.x=anchor.x-(mid.x-width/2)/scale;camera.y=anchor.y-(mid.y-height/2)/scale;
 return constrainCamera(camera,width,height);
}
export function edgePan(point,rect,dt,scale){
 const edge=Math.min(64,rect.width/5,rect.height/5);
 const axis=(p,size)=>p<edge?-Math.min(1,(edge-p)/edge):p>size-edge?Math.min(1,(p-size+edge)/edge):0;
 return {x:axis(point.x-rect.left,rect.width)*480*dt/scale,y:axis(point.y-rect.top,rect.height)*480*dt/scale};
}
