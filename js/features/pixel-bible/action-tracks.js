// Four separate beats: prepare, approach, act, return. Coordinates are source pixels.
const tracks={
 eat:{handY:[27,23,17,23],bodyY:[0,0,0,0]},
 blow:{handY:[27,20,17,22],bodyY:[0,0,0,0]},
 drink:{handY:[28,22,16,22],bodyY:[0,0,0,0]},
 pour:{handY:[27,23,23,27],bodyX:[0,0,1,0]},
 ground:{handY:[26,29,30,28],bodyY:[0,2,3,1]},
 work:{handY:[26,25,27,26],bodyX:[0,-1,1,0]},
 inspect:{handY:[26,22,22,26],bodyY:[0,0,0,0]},
 offer:{handY:[26,24,23,25],reach:[0,1,2,1]},
 overhead:{handY:[26,21,18,23],bodyY:[0,0,-1,0]},
 pull:{handY:[26,24,25,26],bodyX:[0,-1,2,0]},
 music:{handY:[26,23,24,25],bodyX:[0,-1,1,0]},
 rest:{handY:[26,26,26,26],bodyX:[0,0,0,0]},
};
const groups={
 eat:'eat taste',blow:'blow long-blow rehearse',drink:'drink sip',pour:'pour fill scoop rinse wash sprinkle',
 ground:'pick gather gather-flour harvest retrieve feed-grain knead portion sow place care prepare bait plant-staff',
 work:'arrange beat brush cap close coil count cover dip fan fletch fold grind grip knead knock measure mend open pet polish press repair roll roll-seal smooth sort stack stamp stir tap tend thresh tie trace trim tune turn turn-key uncoil unlock unroll unstring untie use wipe wrap write',
 inspect:'inspect look observe watch read wait-fish leaves fruit trunk guide',
 offer:'offer serve share feed break hands point wave',
 overhead:'raise lift-chain lift-oar lift-seal draw-weapon cast cast-line shake shake-cloth shake-net swing thrust load-sling spin-sling sling sling-low',
 pull:'pull push reel rope lower lower-rope row back-row reins',
 music:'strum pluck play waft',
 rest:'sit feet rest lap shade lean lean-staff balance brace guard shield bow kneel stretch step-back carry hold lower warm kick bonk skip take-bread remove-weight',
};
const lookup=new Map();
for(const [track,names] of Object.entries(groups))for(const name of names.split(' '))if(!lookup.has(name))lookup.set(name,track);
export function actionTrack(gesture){return lookup.get(gesture)||null;}
export function applyActionTrack(pose,position){
 if(pose.archery||pose.lie||pose.kneel||pose.wearing||pose.unique||['wear','remove','climb-ladder'].includes(pose.actual))return pose;
 const track=tracks[actionTrack(pose.actual)];if(!track)return pose;
 const phase=Math.floor(position)%4,next=(phase+1)%4,f=position-Math.floor(position);
 const local=pose.gesture==='drink'&&phase===2?Math.max(0,(f-.65)/.35):f;
 const stepped=Math.floor((local*local*(3-2*local))*12)/12;
 for(const [key,values] of Object.entries(track))pose[key]=Math.round(values[phase]+(values[next]-values[phase])*stepped);
 return pose;
}
