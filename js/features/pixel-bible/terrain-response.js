import {backgroundFor} from './backgrounds.js';
import {WORLD} from './camera.js';
// Match the water shapes drawn by biome-art and landscape, in world pixels.
export function waterAt(key,x,y){
 const m=backgroundFor(key).motif,w=WORLD.width,h=WORLD.height,px=x*24,py=y*24;
 if(['lake','galilee'].includes(m))return py>=h-126||((px-w*(m==='lake'?.2:.83))/(w*.22))**2+((py-h*.7)/(h*.25))**2<1;
 if(['river','garden','newcity'].includes(m)&&py>=150&&py<h-80){const left=w*(m==='garden'?.24:m==='newcity'?.68:.72)+Math.sin(Math.floor((py-150)/8)*8/140+150/140)*w*.065;return px>=left&&px<left+82;}
 return false;
}
export function dryLanding(key,from,blocked){for(let radius=1;radius<80;radius++)for(let dx=-radius;dx<=radius;dx++)for(const dy of [-radius,radius]){const p={x:Math.round(from.x)+dx,y:Math.round(from.y)+dy};if(!waterAt(key,p.x,p.y)&&!blocked(p.x,p.y))return p;}return null;}
