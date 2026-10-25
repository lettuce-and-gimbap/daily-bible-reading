// Explicit direction for every reviewed Kings scene; no keyword-inferred actor actions.
const plans=[
 ['chamber','lie','sorrow','bed'],['hills','kneel','fear','prayer'],['river','strike','resolve','divide'],['river','offer','sorrow','cloak'],['spring','pour','resolve','salt'],
 ['valley','speak','hope','music'],['valley','offer','joy','water'],['chamber','pour','hope','oil'],['chamber','offer','joy','room'],['chamber','offer','resolve','staff'],
 ['chamber','kneel','sorrow','prayer'],['courtyard','pour','resolve','flour'],['courtyard','offer','joy','bread'],['chamber','speak','hope','speech'],['river','kneel','hope','wash'],
 ['courtyard','refuse','resolve','gift'],['courtyard','offer','fear','cloak'],['river','offer','hope','axe'],['hills','offer','hope','fire'],['courtyard','offer','joy','bread'],
 ['gate','walk','resolve','journey'],['camp','walk','joy','journey'],['court','offer','hope','petition'],['court','speak','sorrow','tears'],['chamber','pour','resolve','anoint'],
 ['stairs','speak','resolve','cloak'],['road','offer','resolve','chariot'],['altar','speak','sorrow','idol'],['chamber','offer','fear','shelter'],['temple','offer','joy','crown'],
 ['temple','offer','resolve','coins'],['temple','speak','resolve','repair'],['chamber','shoot','resolve','arrow'],['chamber','strike','resolve','ground-arrows'],['court','read','resolve','scroll'],
 ['courtyard','speak','resolve','trees'],['court','speak','sorrow','speech'],['court','offer','fear','coins'],['altar','offer','resolve','plan'],['altar','offer','resolve','altar'],
 ['courtyard','read','resolve','scroll'],['altar','speak','sorrow','idol'],['temple','strike','resolve','break'],['gate','silent','fear','siege'],['temple','kneel','hope','letter'],
 ['temple','kneel','sorrow','prayer'],['chamber','lie','sorrow','tears'],['chamber','offer','hope','fig'],['stairs','offer','hope','shadow'],['gate','speak','resolve','warning'],
 ['temple','read','surprise','scroll'],['court','tear','sorrow','tear'],['chamber','speak','resolve','speech'],['temple','read','resolve','covenant'],['temple','offer','joy','bread'],
 ['gate','walk','sorrow','exile'],['court','speak','fear','crown'],['ruins','walk','sorrow','burn'],['courtyard','speak','hope','speech'],['court','offer','joy','robe']
];
export const KINGS_DIRECTION=Object.fromEntries(plans.map(([setting,pose,emotion,effect],i)=>[`2ki-review-${i+1}`,{setting,pose,emotion,effect,lead:0,duration:8}]));
Object.assign(KINGS_DIRECTION,{
 'jordan-elijah':{...KINGS_DIRECTION['2ki-review-3']},'jordan-elisha':{...KINGS_DIRECTION['2ki-review-4'],pose:'strike',effect:'divide'},
 'jericho-water':{...KINGS_DIRECTION['2ki-review-5']},'floating-axe':{...KINGS_DIRECTION['2ki-review-18']}
});
KINGS_DIRECTION['2ki-review-15'].lead=1;
KINGS_DIRECTION['2ki-review-33'].lead=1;
export function directionFor(scene){return KINGS_DIRECTION[scene.id]||{setting:'courtyard',pose:'speak',emotion:'resolve',effect:'speech',lead:0,duration:8};}
export function sceneBeat(seconds){return Math.min(1,Math.max(0,seconds/6));}
