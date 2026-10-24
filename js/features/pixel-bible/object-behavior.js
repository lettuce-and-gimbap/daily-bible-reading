import {OBJECT_CATALOG} from './object-catalog.js';
// 모든 카탈로그 항목은 동작 계열과 운반 가능 여부를 명시적으로 결정한다.
// 큰 구조물/제의 물품/살아 있는 동물을 손 소품으로 축소하지 않는다.
const fixed=new Set(['flour','dough','leaven','mat','table','bed','throne','footstool','ark-covenant','treasure-chest','stable','tabernacle','tent','temple','gate','wall','tower','house','palace','tomb','millstone','stone-pillar','chariot','wheel','anchor','sail','plow','yoke','ladder','cross','bronze-snake','laver','basin','pot','oven','lampstand','fire','curtain','veil','water-supply','vineyard']);
const categories={crop:'field',seat:'bench',book:'scroll',tent:'building',staff:'tool',shield:'weapon',wear:'wear',cart:'cart',basket:'basket',lamp:'lamp',symbol:'symbol',cross:'building',chest:'chest'};
export function objectBehavior(kind){
 const d=OBJECT_CATALOG[kind]||{family:kind,action:kind};
 let category=categories[d.family]||d.family;
 if(d.family==='plant')category=d.action==='bush'?'bush':d.action==='field'?'field':'tree';
 if(d.family==='vessel')category=kind==='ink'?'tool':d.action;
 if(kind==='rope')category='rope';
 if(kind==='table')category='table';
 if(kind==='bed'||kind==='mat')category='bed';
 if(kind==='pen')category='scroll';
 if(['pot','oven'].includes(kind))category='cooking';
 if(kind==='stable')category='basket';
 if(['seed','mustard'].includes(kind))category='treasure';
 const carry=!fixed.has(kind)&&(['vessel','book','staff','tool','weapon','shield','wear','cloth','treasure','instrument','basket','food','net','lamp','stone'].includes(d.family)||['stone','seed','mustard'].includes(kind));
 return {category,carry,frontOnly:!carry&&!['bench','bed','boat','cart'].includes(category)};
}
