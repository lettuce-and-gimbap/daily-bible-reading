import {ANIMATION_MOTIFS,ACTION_LABELS} from './motifs.js';
import {KINGS_DIRECTION} from '../cinematic-scenes.js';
const STATIC={
 'jacob-stone':'dream','rebekah-well':'water','isaac-well':'well','moses-bush':'holy-ground','aaron-manna':'store','david-stones':'gather-stones','widow-water':'provision','widow-oil':'oil','josiah-scroll':'tear','zacchaeus-tree':'tend','peter-net':'offer',
 glean:'gather',greet:'greet',water:'water',meal:'feast','return-naomi':'receive','rest-elijah':'feed','moses-reed-basket':'reed-float',
 'jordan-elijah':'divide','jordan-elisha':'divide','jericho-water':'salt','floating-axe':'float'
};
const KINGS='sleep plead divide retrieve salt play water oil build staff pray flour offer report water refuse conceal float vision feast journey report petition mourn anoint crown carry idol shelter crown coins repair shoot strike judgment parable steward tribute plan arrange read idol demolish silent pray pray mourn heal look warning read tear report covenant feast depart appoint burn encourage wear'.split(' ');
export function eventPlan(scene){
 if(scene.animation?.version===2)return scene.animation;
 let motif=STATIC[scene.id];if(!motif&&scene.id?.startsWith('2ki-review-'))motif=KINGS[Number(scene.id.split('-').at(-1))-1];
 const d=KINGS_DIRECTION[scene.id];if(!motif&&d)motif={lie:'sleep',kneel:'pray',shoot:'shoot',strike:'strike',read:'read',pour:'pour',walk:'journey',tear:'tear'}[d.pose]||'report';
 const base=ANIMATION_MOTIFS[motif]||ANIMATION_MOTIFS.symbolic;
 const lead=scene.eventMotion?.actor||scene.actors?.[d?.lead||0];return {version:2,motif:motif||'symbolic',lead,target:scene.actors?.find(n=>n!==lead),prop:scene.object,setting:base.setting,effect:base.effect,emotion:base.emotion,mode:motif?'reconstruction':'illustration',duration:8.2,beats:base.actions.map((action,i)=>({action,actor:lead,duration:[1,1.2,1.5,1.8,1.5,1.2][i]}))};
}
const arms=(a,b)=>[a||[5,25,5,28],b||[17,25,17,28]];
const REST=arms();
const A={
 listen:{arms:REST},stand:{arms:REST},inspect:{arms:arms([7,25,10,27],[17,25,14,27])},grasp:{arms:arms(null,[19,26,22,29]),held:true},
 weigh:{arms:arms([7,24,10,25],[20,24,24,25]),held:true},scoop:{arms:arms(null,[20,27,24,30]),bend:1,held:true},march:{walk:true,move:1},
 gather:{arms:arms([5,27,10,30],[17,27,14,30]),bend:2,held:true},lift:{arms:arms([6,23,8,19],[17,23,19,19]),held:true},
 extend:{arms:arms([7,24,11,25],[20,24,25,24]),held:true},release:{arms:arms([7,25,11,25],[20,25,25,25])},
 bow:{arms:REST,bodyY:2},kneel:{arms:arms([7,25,10,25],[16,25,13,25]),kneel:true},pray:{arms:arms([7,24,11,23],[16,24,13,23]),kneel:true},
 walk:{walk:true,move:1},run:{walk:true,move:1.8},look:{arms:REST},startle:{arms:arms([4,24,2,20],[19,24,23,20])},
 strike:{arms:arms([8,23,11,25],[20,27,25,30]),held:true,bodyY:1},pour:{arms:arms([8,24,12,24],[19,23,24,21]),held:true,angle:.8},
 read:{arms:arms([7,24,10,24],[16,24,13,24]),held:true},write:{arms:arms([7,25,10,25],[16,23,13,24]),held:true},
 mourn:{arms:arms([7,23,10,20],[16,24,14,21]),kneel:true},lower:{arms:REST},reach:{arms:arms(null,[20,25,25,25])},
 place:{arms:arms([8,26,11,29],[19,26,22,29]),bend:1},carry:{arms:arms([8,24,11,25],[17,24,14,25]),held:true,walk:true,move:1},
 sleep:{lie:true},lie:{lie:true},rise:{arms:REST},tear:{arms:arms([5,24,8,25],[19,24,16,25]),held:false},
 bless:{arms:arms([7,23,10,19],[19,23,22,18])},point:{arms:arms(null,[21,23,27,23])},hold:{arms:arms([7,23,10,21],[18,23,22,21]),held:true},
 brace:{arms:arms([4,25,7,27],[19,25,22,27]),bodyY:1},retreat:{walk:true,move:-1},drop:{arms:arms(null,[20,24,25,23])},
 receive:{arms:arms([8,25,11,24],[19,25,23,24]),held:true},wait:{arms:REST},turn:{arms:REST,turn:true},hide:{arms:REST,bend:3,move:-1},
 peek:{arms:arms(null,[19,23,22,20]),bodyY:-1},windup:{arms:arms([7,24,10,25],[18,20,16,15]),held:true},
 recoil:{arms:arms([7,24,10,25],[18,23,21,25]),held:true},speak:{arms:arms(null,[19,24,22,23])},signal:{arms:arms(null,[19,21,22,16])},
 'remove-shoe':{arms:arms([7,28,10,33],[17,28,14,33]),bend:3},cover:{arms:arms([8,23,10,24],[20,24,24,26]),held:true},
 pledge:{arms:arms(null,[18,23,21,22])},smile:{arms:REST},'cover-mouth':{arms:arms(null,[17,22,15,19])},guard:{arms:arms([5,23,2,24],[20,23,25,24])},
 count:{arms:arms([7,25,11,25],[17,25,14,25]),held:true},cradle:{arms:arms([8,24,11,26],[17,24,14,26])},
 dig:{arms:arms([8,25,11,29],[19,24,24,28]),bend:2,held:true},roll:{arms:arms([8,26,11,28],[21,26,26,28]),bodyY:2},
 push:{arms:arms([8,25,11,25],[21,25,26,25]),bodyX:1},bury:{arms:arms([8,27,11,30],[20,27,25,30]),bend:3},
 fall:{arms:arms([4,23,2,20],[20,23,25,20]),bodyY:5},open:{arms:arms([6,25,8,24],[20,25,23,24]),held:true},
 halt:{arms:arms(null,[20,23,23,20])},light:{arms:arms(null,[21,24,24,23]),held:true},smooth:{arms:arms([7,25,10,26],[18,25,15,26])},
 sway:{arms:arms([6,22,7,19],[19,22,22,19]),bodyX:1,held:true},weave:{arms:arms([7,25,10,25],[18,25,14,24]),held:true},
 scratch:{arms:arms(null,[17,25,14,27]),held:true},hammer:{arms:arms(null,[20,24,23,27]),held:true},
 'load':{arms:arms([9,24,13,24],[18,24,15,24]),held:true},aim:{arms:arms([9,23,13,24],[21,23,28,23]),held:true},
 'draw-bow':{arms:arms([10,22,14,21],[21,23,28,23]),held:true},row:{arms:arms([7,24,10,28],[20,23,25,26]),held:true},
 strum:{arms:arms([8,25,12,25],[17,24,14,26]),held:true},fold:{arms:arms([7,25,11,25],[17,25,14,25]),held:true},
 bundle:{arms:arms([8,25,11,26],[17,25,14,26]),held:true},tie:{arms:arms([9,25,12,25],[17,25,14,25]),held:true},
 untie:{arms:arms([7,25,10,25],[19,25,22,25]),held:true},shake:{arms:arms([7,24,10,23],[17,24,14,23]),held:true},
 wear:{arms:arms([6,21,9,18],[18,21,21,18]),held:true},step:{walk:true},blow:{arms:arms([8,23,11,21],[20,22,25,21]),held:true},
 throw:{arms:arms(null,[22,22,28,23])},cut:{arms:arms(null,[19,25,23,26]),held:true},crouch:{bend:3},
 pull:{arms:arms([8,24,11,23],[18,24,14,23]),held:true,bodyX:-1},touch:{arms:arms(null,[21,24,26,25])},
 load:{arms:arms([8,23,12,24],[19,23,22,25]),held:true},mold:{arms:arms([8,27,11,28],[18,27,15,28]),held:true},
 flatten:{arms:arms([8,27,11,29],[19,27,23,29]),bend:1},align:{arms:arms([7,24,11,24],[18,24,22,24]),held:true},
 join:{arms:arms([8,24,12,24],[17,24,14,24]),held:true},show:{arms:arms([8,23,12,22],[17,23,14,22]),held:true},
 retrieve:{arms:arms(null,[20,27,25,30]),bend:2,held:true},scatter:{arms:arms(null,[22,24,27,24]),held:true,angle:.6},
 mark:{arms:arms(null,[18,24,22,26]),held:true},eat:{arms:arms(null,[18,21,16,17]),held:true},sit:{sit:true},
 bend:{bend:2},lamp:{arms:arms(null,[20,24,24,25]),held:true}
};
export const EVENT_ACTIONS=Object.keys(A);
const defaults={bodyX:0,bodyY:0,hand:0,handY:27,handX:0,phase:0,within:0,legSwing:0};
const mix=(a,b,t)=>Math.round(a+(b-a)*t);
export function sampleEvent(scene,actors,seconds,{reduced=false,portrait=false}={}){
 const original=eventPlan(scene),plan=scene.eventMotion?.actor?{...original,lead:scene.eventMotion.actor,prop:scene.object}:original,elapsed=Math.max(0,Number.isFinite(seconds)?seconds:0),duration=plan.beats.reduce((n,b)=>n+b.duration,0);
 let index=0,start=0;while(index<plan.beats.length-1&&elapsed>=start+plan.beats[index].duration){start+=plan.beats[index].duration;index++;}
 const beat=plan.beats[index],previous=plan.beats[Math.max(0,index-1)],progress=Math.min(1,Math.max(0,(elapsed-start)/beat.duration));
 // At most one source-dot per sample; a brief travel interval connects distinct poses.
 const blend=reduced?1:Math.min(1,Math.floor(progress*16)/16),action=A[beat.action]||A.listen,old=A[previous.action]||A.listen;
 const last=elapsed>=duration;
 const states=actors.map((person,i)=>{
  const active=person.name===plan.lead&&!portrait,other=plan.target===person.name;
  const track=plan.tracks?.[person.name];
  const support=track?A[track[index]]:plan.support?.actor===person.name?A[plan.support.actions[index]]:null;
  let state=support|| (active?action:other&&index>=3&&plan.effect==='transfer'?A.receive:A.listen);
  if(other&&['heal-rise','raise-dead','revive-fall'].includes(plan.motif))state=index<4?(['raise-dead','revive-fall'].includes(plan.motif)||plan.prop==='bed'?A.lie:A.sit):plan.motif==='raise-dead'&&index===4?A.walk:A.stand;
  if((other||actors.length===1)&&plan.motif==='roof-lower')state=index<5?A.lie:A.stand;
  if(active&&plan.motif==='crucifixion'&&index>=2)state={arms:arms([3,21,-1,21],[21,21,27,21])};
  if(other&&plan.motif==='baptism')state=index===2||index===3?A.kneel:A.stand;
  if(other&&plan.motif==='emmaus')state=index===4?A.startle:index>=2?A.sit:A.listen;
  if(other&&['wash-feet','anoint-feet','anoint-cloak'].includes(plan.motif))state=A.sit;
  if(scene.passiveMotions?.[person.name]?.gesture==='lie')state=index>=5?A.sit:A.lie;
  if(plan.mode==='illustration')state=portrait?A.listen:A.read;
  let prev=support?A[(track||plan.support.actions)[Math.max(0,index-1)]]:active?old:other&&index>3&&plan.effect==='transfer'?A.receive:A.listen;
  if(scene.passiveMotions?.[person.name]?.gesture==='lie')prev=index===5?A.lie:state;
  if(plan.mode==='illustration')prev=state;
  if(active&&plan.held){state={...state,held:plan.held[index]};prev={...prev,held:plan.held[Math.max(0,index-1)]};}
  const ar=state.arms||REST,pr=prev.arms||REST,eventArms=ar.map((arm,j)=>arm.map((v,k)=>mix(pr[j][k],v,blend)));
  const wasLying=!!prev.lie,isLying=!!state.lie,recline=reduced?1:wasLying===isLying?1:Math.round((isLying?Math.min(1,progress*2):1-Math.min(1,progress*2))*4)/4;
  const pose={...defaults,eventArms,heldObject:true,bodyX:mix(prev.bodyX||0,state.bodyX||0,blend),bodyY:mix(prev.bodyY||0,state.bodyY||0,blend),eventKneel:!!state.kneel,bend:state.bend||0,sit:!!state.sit,lie:isLying||wasLying&&recline>0,recline};
  let travel=0;for(let k=0;k<=index;k++){const move=A[track?.[k]||plan.beats[k].action]?.move||0;travel+=move*(k===index?progress:1)*12;}
  if(!active&&!track)travel=0;
  const expression=portrait?'neutral':last||index>=4?plan.emotion:index===1&&['worried','sad'].includes(plan.emotion)?plan.emotion:'neutral';
  return {person,active,visible:plan.visibility?.[person.name]?.[index]!==false&&!(other&&plan.motif==='raise-dead'&&plan.prop==='tomb'&&index<4)&&!(active&&plan.motif==='emmaus'&&index>=4),pose,action:active?beat.action:'listen',held:active&&!!state.held,previousHeld:active&&!!prev.held,hand:{x:eventArms[1][2],y:eventArms[1][3]},toolAngle:state.angle||0,
   travel:Math.round(travel),direction:portrait||plan.mode==='illustration'?'down':plan.directions?.[person.name]|| (state.turn?'up':i===0?'right':'left'),walkFrame:!reduced&&state.walk&&!last?Math.floor(elapsed*5)%4:0,expression};
 });
 return {plan,states,index,progress,elapsed,duration,finished:last,label:ACTION_LABELS[beat.action]||'동작',effectProgress:Math.min(1,Math.max(0,(index+progress-2)/3))};
}
