// Explicit chapter/verse/actor rules, never inferred from a vague mood or an object alone.
const RULES=[
 {code:'2ki',chapter:2,verses:[8],actor:/^엘리야$/,gesture:'mantle-river',object:'cloak',requires:['water-supply']},
 {code:'2ki',chapter:2,verses:[14],actor:/^엘리사$/,gesture:'mantle-river',object:'cloak',requires:['water-supply']},
 {code:'2ki',chapter:2,verses:[20,21],actor:/엘리사/,gesture:'salt-source',object:'salt-bowl',requires:['water-supply']},
 {code:'2ki',chapter:4,verses:[3,4,5,6],actor:/선지자 제자의 아내/,gesture:'oil-many',object:'oil',requires:['jar']},
 {code:'2ki',chapter:4,verses:[40,41],actor:/엘리사/,gesture:'flour-pot',object:'flour-bowl',requires:['pot']},
 {code:'2ki',chapter:6,verses:[5,6,7],actor:/엘리사/,gesture:'axe-float',object:'rod',requires:['water-supply','axe']},
 {code:'2ki',chapter:20,verses:[7],actor:/이사야/,target:/히스기야/,gesture:'fig-paste',object:'fig-poultice',requires:['bed']},
 {code:'mrk',chapter:14,verses:[3],actor:/여인|여자/,target:/^예수(님)?$/,gesture:'anoint-head',object:'alabaster-jar',requires:[]},
 {code:'jhn',chapter:13,verses:[5,8,9],actor:/^예수(님)?$/,target:/베드로/,gesture:'feet-basin',object:'basin',requires:[]},
 {code:'act',chapter:12,verses:[7,8,9,10],actor:/베드로/,gesture:'chain-open',object:'chain',requires:[]},
 {code:'luk',chapter:5,verses:[4,5,6],actor:/시몬|베드로/,gesture:'net-catch',object:'net',requires:['boat']},
 {code:'exo',chapter:2,verses:[3],actor:/요게벳|모세의 어머니/,gesture:'reed-float',object:'reed-basket',requires:['water-supply']},
 {code:'ezk',chapter:4,verses:[1],actor:/에스겔/,gesture:'tablet-write',object:'writing-tablet',requires:[]},
 {code:'luk',chapter:1,verses:[63],actor:/사가랴/,gesture:'tablet-write',object:'writing-tablet',requires:[]},
];
export function sceneVerses(scene){if(scene.verseNumbers)return scene.verseNumbers;const raw=scene.ref?.split(':')[1]||'';return raw.split(',').flatMap(p=>{const m=p.trim().match(/^(\d+)(?:[-–—](\d+))?$/);return m?Array.from({length:Math.min(200,Number(m[2]||m[1])-Number(m[1])+1)},(_,i)=>Number(m[1])+i):[];});}
export function enhanceScene(scene,cast=[]){
 const verses=sceneVerses(scene);const rule=RULES.find(r=>r.code===scene.code&&r.chapter===scene.chapter&&r.verses.some(v=>verses.includes(v))&&cast.some(p=>r.actor.test(p.name)));
 if(!rule)return scene;
 const actor=cast.find(p=>scene.actors.includes(p.name)&&rule.actor.test(p.name))||cast.find(p=>rule.actor.test(p.name));
 const target=rule.target?cast.find(p=>rule.target.test(p.name)):null;
 // Narrated episodes may gain an explicit, source-checked action without invented dialogue.
 return {...scene,actors:[...new Set([...scene.actors,actor.name,...(target?[target.name]:[])])],object:rule.object,requiresObjects:rule.requires,actions:{...scene.actions,[actor.name]:rule.object,...(rule.gesture==='fig-paste'&&target?{[target.name]:'bed'}:{})},passiveMotions:rule.gesture==='fig-paste'&&target?{[target.name]:{id:'patient-rest',kind:'bed',category:'bed',gesture:'lie',period:4,phase:0,variant:0}}:scene.passiveMotions,eventMotion:{actor:actor.name,target:target?.name,gesture:rule.gesture},objectNote:(scene.objectNote||'')+' 이 장면은 표시된 보조 물건도 가까이 놓아 주세요. 사건의 결과는 일시적인 픽셀 연출이에요.'};
}
export function eventRoutine(scene,actor){if(scene?.passiveMotions?.[actor.name])return scene.passiveMotions[actor.name];if(scene?.eventMotion?.actor!==actor.name)return null;return {id:'event:'+scene.id,gesture:scene.eventMotion.gesture,kind:scene.object,category:'tool',variant:0,period:5.6,phase:0,unique:true,scripted:true};}
const HANDS={
 'mantle-river':[[26,0,0],[22,-2,-1],[18,-4,-2],[21,5,1],[29,8,3],[25,5,1],[24,2,0],[26,0,0]],
 'salt-source':[[27,0,0],[25,1,0],[24,3,0],[21,6,-1],[23,8,0],[24,5,1],[25,2,0],[27,0,0]],
 'flour-pot':[[27,0,0],[25,1,0],[22,3,-1],[21,5,-1],[25,7,1],[25,4,0],[26,1,0],[27,0,0]],
 'oil-many':[[27,0,0],[24,1,0],[22,3,0],[23,5,0],[24,6,1],[24,5,1],[25,2,0],[27,0,0]],
 'axe-float':[[27,0,0],[29,2,2],[30,4,3],[23,5,1],[20,7,0],[25,3,0],[26,1,0],[27,0,0]],
 'fig-paste':[[27,0,0],[26,2,0],[25,4,1],[24,7,2],[24,8,2],[25,5,1],[26,2,0],[27,0,0]],
 'anoint-head':[[27,0,0],[24,1,0],[20,2,-1],[16,5,-1],[17,7,0],[20,4,0],[24,1,0],[27,0,0]],
 'feet-basin':[[27,0,0],[29,1,1],[30,3,3],[30,5,4],[29,6,4],[30,4,3],[28,2,1],[27,0,0]],
 'chain-open':[[27,0,0],[26,2,0],[25,4,0],[26,-3,1],[27,-5,1],[26,-1,0],[26,1,0],[27,0,0]],
 'net-catch':[[27,0,0],[24,-2,-1],[20,-5,-2],[18,3,-1],[23,8,1],[25,-2,2],[25,-5,1],[27,0,0]],
 'reed-float':[[27,0,0],[27,2,1],[29,4,2],[31,6,3],[31,7,3],[29,4,2],[27,2,0],[27,0,0]],
 'tablet-write':[[27,0,0],[25,1,0],[24,2,0],[24,4,0],[25,2,0],[24,5,0],[25,2,0],[27,0,0]],
};
export const SCRIPTED_GESTURES=Object.keys(HANDS);
export const SCRIPTED_TRACKS=HANDS;
export function scriptedPose(routine,time,reduced=false){
 const t=reduced?1:Math.max(0,Math.min(1,time/routine.period)),beat=Math.min(7,Math.floor(t*8)),v=HANDS[routine.gesture]?.[beat]||[27,0,0];
 const angles=routine.gesture==='mantle-river'?[0,-.4,-1.2,-.9,.8,.5,0,0]:['salt-source','flour-pot','oil-many','anoint-head'].includes(routine.gesture)?[0,0,-.1,.4,.9,.6,0,0]:[0,0,0,0,0,0,0,0];
 return {toolAngle:angles[beat],scripted:true,eventProgress:t,eventBeat:beat,actual:routine.gesture,gesture:({ 'mantle-river':'use','salt-source':'pour','flour-pot':'pour','oil-many':'pour','axe-float':'cast','fig-paste':'place','anoint-head':'pour','feet-basin':'wash','chain-open':'unlock','net-catch':'cast','reed-float':'place','tablet-write':'write'})[routine.gesture],handY:v[0],handX:v[1],bodyX:Math.round(v[1]/3),bodyY:v[2],bend:['feet-basin','fig-paste','reed-float'].includes(routine.gesture)&&beat>=2&&beat<=5?2:0,hand:beat>=1&&beat<=6?1:0,phase:beat<2?0:beat<4?1:beat<6?2:3,within:(t*8)%1,prop:'tool',unique:true,outfit:routine.kind,reach:beat>=2&&beat<=5?2:0};
}
