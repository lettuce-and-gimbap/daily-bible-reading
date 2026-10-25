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
// Eight authored beats: reach, grip, position, start, work, follow-through, recover, release.
// Repeated working strokes are distinct from picking up and returning the object.
for(const track of Object.values(tracks))for(const [key,v] of Object.entries(track)){
 track[key]=[v[0],Math.round((v[0]+v[1])/2),v[1],v[2],v[1],v[2],v[3],Math.round((v[3]+v[0])/2)];
}
Object.assign(tracks,{
 drink:{handY:[28,25,22,19,16,16,22,25],bodyY:[0,0,0,0,0,0,0,0]},
 grind:{handY:[27,26,25,26,25,26,27,27],bodyX:[0,-1,-2,0,2,0,-1,0]},
 write:{handY:[27,25,24,25,24,25,26,27],bodyX:[0,0,-1,0,1,0,0,0]},
 sow:{handY:[28,27,25,23,24,26,27,28],reach:[0,0,1,2,3,2,1,0]},
 wash:{handY:[28,27,25,26,25,26,27,28],bodyX:[0,0,-1,1,-1,1,0,0]},
 hammer:{handY:[27,24,19,17,26,21,26,27],bodyY:[0,0,-1,-1,2,0,1,0]},
 music:{handY:[26,24,23,25,23,24,25,26],bodyX:[0,-1,0,1,0,-1,0,0]}
});
// Object-specific beats keep similar verbs visually distinct: e.g. a person
// scoops low, raises a cup to drink, and tips a vessel to pour rather than
// replaying one generic "work" pose for all three.
const actionTracks={
 scoop:{handY:[30,31,32,30,26,23,25,29],handX:[0,1,2,3,4,3,1,0],bodyX:[0,0,1,1,2,1,0,0],bodyY:[0,1,2,1,0,0,0,0]},
 fill:{handY:[27,28,30,30,28,26,25,27],handX:[0,1,2,1,-1,-2,-1,0],bodyX:[0,0,1,0,-1,-1,0,0]},
 cap:{handY:[24,22,20,21,23,21,23,25],handX:[0,1,2,3,2,0,-1,0],bodyX:[0,0,1,1,0,-1,0,0]},
 wash:{handY:[29,28,27,28,27,28,29,29],handX:[0,-2,1,3,-2,2,1,0],bodyX:[0,-1,0,1,-1,1,0,0]},
 pour:{handY:[25,23,22,20,19,20,23,26],handX:[0,1,2,3,4,3,1,0],bodyX:[0,0,1,2,2,1,0,0],bodyY:[0,0,0,-1,-1,0,0,0],toolAngle:[0,-.1,-.25,-.55,-.7,-.5,-.2,0]},
 drink:{handY:[28,25,22,19,16,16,22,26],handX:[0,1,2,3,3,3,1,0],headX:[0,0,0,0,0,0,0,0],bodyY:[0,0,0,0,0,0,0,0]},
 sip:{handY:[27,25,23,21,19,21,24,26],handX:[0,0,1,2,2,1,0,0],headY:[0,0,0,-1,-1,0,0,0]},
 rinse:{handY:[28,26,27,29,28,27,28,29],handX:[0,-1,2,3,-2,1,0,0],bodyX:[0,0,1,1,-1,0,0,0]},
 stepBack:{handY:[25,24,23,24,25,24,25,25],handX:[0,0,-1,-2,0,1,0,0],bodyX:[0,-1,-2,-2,-1,0,0,0],bodyY:[0,0,0,-1,0,0,0,0],legSwing:[0,-1,-1,0,1,1,0,0]},
 lean:{handY:[26,25,24,24,24,25,26,26],handX:[0,1,2,2,1,0,0,0],bodyX:[0,0,1,2,2,1,0,0],bodyY:[0,0,1,1,1,0,0,0]},
 shade:{handY:[24,22,20,19,20,22,24,25],handX:[0,1,2,3,3,2,1,0],headX:[0,0,0,-1,-1,0,0,0],headTilt:[0,-.04,-.08,-.1,-.08,-.04,0,0]},
 hold:{handY:[25,24,23,23,23,24,25,25],handX:[0,1,2,2,2,1,0,0],bodyX:[0,0,0,0,0,0,0,0]},
 sling:{handY:[25,23,21,19,20,23,25,26],handX:[0,-2,-3,0,4,5,2,0],bodyX:[0,-1,-1,0,2,2,1,0],bodyY:[0,0,-1,-1,0,0,0,0]},
 loadSling:{handY:[26,24,22,24,21,19,22,25],handX:[0,1,3,4,2,0,-1,0],bodyX:[0,0,1,1,0,-1,0,0]},
 portion:{handY:[26,25,26,28,27,25,24,26],handX:[0,-2,-3,0,3,3,1,0],bodyX:[0,-1,-1,0,1,1,0,0]},
 push:{handY:[26,24,23,24,25,25,26,27],handX:[0,2,4,6,6,3,1,0],bodyX:[0,1,2,3,2,1,0,0],bodyY:[0,0,-1,-1,0,0,0,0]},
 shake:{handY:[25,23,20,19,21,23,25,26],handX:[0,1,3,5,4,2,1,0],bodyX:[0,0,1,2,1,0,-1,0],headY:[0,0,0,1,0,0,0,0]},
 kick:{handY:[25,24,22,21,22,24,25,25],handX:[0,0,-1,-2,-1,0,0,0],bodyX:[0,-1,-2,-2,-1,0,0,0],bodyY:[0,0,0,-1,0,0,0,0],legSwing:[0,0,-1,-2,2,1,0,0]},
 bonk:{handY:[24,23,22,21,23,24,25,25],handX:[0,1,1,0,-1,0,0,0],headY:[0,0,0,1,2,1,0,0],headTilt:[0,0,.04,.12,-.14,-.08,0,0],bodyY:[0,0,0,0,2,1,0,0]},
 fruit:{handY:[24,22,20,19,20,21,23,24],handX:[0,1,2,3,2,1,0,0],headY:[0,0,0,-1,-1,0,0,0]},
 leaves:{handY:[25,23,21,20,22,21,23,25],handX:[0,1,2,3,4,2,1,0],headX:[0,0,-1,-1,0,1,0,0],headTilt:[0,-.04,-.08,-.1,.05,.08,0,0]},
 trunk:{handY:[25,26,27,26,24,25,26,25],handX:[0,2,4,5,4,2,1,0],bodyX:[0,1,2,2,1,0,0,0]},
 tie:{handY:[25,23,21,22,20,22,24,26],handX:[0,2,3,1,-2,1,2,0],bodyX:[0,0,1,1,-1,0,0,0]},
 untie:{handY:[24,22,21,22,24,22,24,26],handX:[0,-2,-3,-1,2,-1,-2,0],bodyX:[0,0,-1,-1,1,0,0,0]},
 coil:{handY:[25,23,22,24,22,24,25,26],handX:[0,2,4,3,-2,-3,1,0],bodyX:[0,1,1,0,-1,-1,0,0]},
 row:{handY:[24,23,21,23,26,28,25,24],handX:[0,-2,-4,-1,4,6,3,0],bodyX:[0,-1,-2,0,2,3,1,0],bodyY:[0,0,-1,0,1,1,0,0]},
 backRow:{handY:[28,27,25,23,24,26,27,28],handX:[0,2,4,2,-4,-5,-2,0],bodyX:[0,1,2,1,-2,-2,-1,0]},
 backRow:{handY:[28,27,25,23,24,26,27,28],handX:[0,2,4,2,-4,-5,-2,0],bodyX:[0,1,2,1,-2,-2,-1,0]},
 reins:{handY:[24,23,22,23,24,23,22,24],handX:[0,2,3,1,-2,-3,-1,0],bodyX:[0,1,1,0,-1,-1,0,0]},
 knead:{handY:[28,27,29,26,29,26,28,28],handX:[0,-2,0,3,1,-3,-1,0],bodyX:[0,-1,0,1,0,-1,0,0],bodyY:[0,1,2,1,2,1,0,0]},
 press:{handY:[26,25,29,30,29,27,25,26],handX:[0,0,1,1,0,-1,0,0],bodyY:[0,0,2,3,2,1,0,0]},
 divide:{handY:[26,25,27,28,26,24,25,26],handX:[0,-2,-3,0,3,4,2,0],bodyX:[0,-1,-1,0,1,1,0,0]},
 roll:{handY:[27,25,24,26,24,26,27,27],handX:[0,-3,3,-3,3,-2,2,0],bodyX:[0,-1,1,-1,1,0,0,0]},
 pick:{handY:[26,28,31,32,29,26,24,26],handX:[0,1,3,4,3,1,0,0],bodyY:[0,1,3,4,3,1,0,0],bodyX:[0,0,1,2,1,0,0,0]},
 place:{handY:[24,25,27,30,31,29,26,25],handX:[0,1,2,3,3,2,1,0],bodyY:[0,0,1,2,2,1,0,0]},
 stack:{handY:[27,25,22,20,21,24,26,27],handX:[0,1,2,3,3,2,1,0],bodyY:[0,0,-1,-2,-1,0,0,0]},
 sort:{handY:[25,24,25,27,25,24,26,25],handX:[0,-2,2,3,-3,-2,2,0],bodyX:[0,-1,1,1,-1,-1,0,0]},
 measure:{handY:[24,22,21,22,22,21,23,25],handX:[0,2,4,6,6,4,2,0],bodyX:[0,0,1,1,1,0,0,0]},
 turn:{handY:[25,23,22,23,25,27,26,25],handX:[0,2,4,5,3,-1,-2,0],bodyX:[0,1,2,2,1,-1,-1,0],bodyY:[0,0,-1,-1,0,1,0,0]},
 repair:{handY:[26,24,23,25,23,25,26,27],handX:[0,-2,1,4,1,-2,1,0],bodyX:[0,-1,0,1,0,-1,0,0]},
 wipe:{handY:[25,24,25,24,25,24,25,26],handX:[0,-3,3,-3,3,-2,2,0],bodyX:[0,-1,1,-1,1,-1,0,0]},
 brush:{handY:[26,24,25,23,24,22,24,26],handX:[0,-3,-1,2,4,1,-2,0],bodyX:[0,-1,0,1,1,0,-1,0]},
 observe:{handY:[25,24,23,23,24,25,25,25],headX:[0,0,-1,-1,1,1,0,0],headTilt:[0,-.04,-.08,-.08,.08,.08,0,0]},
 offer:{handY:[27,25,24,23,23,24,25,27],handX:[0,1,3,6,6,4,2,0],bodyX:[0,0,1,2,2,1,0,0]},
 share:{handY:[26,25,24,23,23,24,25,26],handX:[0,1,3,5,5,3,1,0],bodyX:[0,0,1,1,1,0,0,0]},
 break:{handY:[25,24,23,23,25,26,25,25],handX:[0,1,2,2,-1,1,0,0],bodyX:[0,0,1,1,0,0,0,0]},
 sprinkle:{handY:[25,23,21,20,19,20,23,25],handX:[0,1,2,3,4,3,1,0],bodyX:[0,0,1,1,0,0,0,0]},
 gather:{handY:[26,29,31,32,30,28,26,26],handX:[0,1,2,4,3,1,0,0],bodyY:[0,1,3,4,3,2,1,0]},
 thresh:{handY:[24,22,19,16,18,21,23,25],handX:[0,1,2,3,4,3,1,0],bodyX:[0,-1,-1,0,1,1,0,0]},
 sow:{handY:[28,27,25,23,24,26,27,28],handX:[0,-1,0,2,4,3,1,0],bodyY:[0,1,2,1,0,0,0,0]},
 strum:{handY:[25,23,24,25,23,24,25,26],handX:[0,-2,1,3,-1,2,1,0],bodyX:[0,-1,0,1,0,-1,0,0]},
 blow:{handY:[24,22,19,18,18,20,22,24],handX:[0,1,2,2,2,1,0,0],bodyY:[0,0,-1,-1,-1,0,0,0]},
 read:{handY:[24,24,23,23,24,24,25,25],headX:[0,-1,-1,0,1,1,0,0],headTilt:[0,-.04,-.04,0,.04,.04,0,0]},
 write:{handY:[27,25,24,25,24,25,26,27],handX:[0,1,2,4,2,-1,1,0],bodyX:[0,0,-1,0,1,0,0,0]},
 open:{handY:[24,23,22,20,21,23,25,26],handX:[0,2,4,5,4,2,1,0],bodyX:[0,1,2,2,1,0,0,0]},
 close:{handY:[26,25,24,22,23,25,26,27],handX:[0,-2,-4,-5,-4,-2,-1,0],bodyX:[0,-1,-2,-2,-1,0,0,0]},
 climb:{handY:[25,20,18,22,24,19,20,25],handX:[0,-2,2,4,1,-3,-1,0],bodyY:[0,-2,-3,0,0,-2,-1,0],legSwing:[0,1,-1,0,1,-1,0,0]},
 kickObject:{handY:[25,24,22,21,22,24,25,25],handX:[0,0,-1,-2,-1,0,0,0],bodyX:[0,-1,-2,-2,-1,0,0,0],bodyY:[0,0,0,-1,0,0,0,0],legSwing:[0,0,-1,-2,2,1,0,0]},
 look:{handY:[25,25,25,25,25,25,25,25],headX:[0,0,-1,-1,0,1,1,0],headTilt:[0,-.03,-.07,-.07,0,.07,.07,0]},
 inspect:{handY:[24,22,21,21,22,23,24,25],handX:[0,1,2,3,3,2,1,0],headX:[0,-1,-1,0,1,1,0,0],headTilt:[0,-.06,-.1,-.1,.06,.1,.04,0]},
 point:{handY:[26,24,21,19,18,19,22,25],handX:[0,1,3,5,7,6,3,0],bodyX:[0,0,1,1,1,1,0,0]},
 hands:{handY:[26,24,22,21,21,22,24,26],handX:[0,0,0,0,0,0,0,0],bodyY:[0,0,-1,-1,-1,0,0,0],headY:[0,0,-1,-1,-1,0,0,0]},
 sit:{handY:[25,25,25,25,25,25,25,25],bodyY:[0,1,2,2,2,1,0,0]},
 lap:{handY:[27,27,27,27,27,27,27,27],handX:[0,1,1,0,-1,-1,0,0],bodyY:[1,1,1,1,1,1,1,1]},
 stretch:{handY:[26,23,19,15,14,16,21,25],handX:[0,-1,-2,-2,2,2,1,0],bodyY:[0,-1,-2,-2,-2,-1,0,0]},
 serve:{handY:[26,24,23,22,21,22,24,26],handX:[0,1,3,5,7,5,2,0],bodyX:[0,0,1,2,2,1,0,0]},
 guard:{handY:[23,21,20,21,22,21,20,23],handX:[0,1,2,3,3,2,1,0],bodyX:[0,-1,-1,0,1,0,-1,0],bodyY:[0,0,-1,-1,0,0,-1,0]},
 brace:{handY:[26,24,23,25,26,24,23,26],handX:[0,2,4,5,5,3,1,0],bodyX:[0,1,2,2,1,0,-1,0],bodyY:[0,0,1,1,1,0,0,0]},
 thrust:{handY:[24,22,20,21,23,24,25,25],handX:[0,-2,-3,0,6,8,4,0],bodyX:[0,-1,-2,-1,2,3,1,0],bodyY:[0,0,-1,0,0,0,0,0]},
 swing:{handY:[27,23,18,15,17,23,28,27],handX:[0,-2,-4,-2,4,7,3,0],bodyX:[0,-1,-2,-1,1,2,1,0],bodyY:[0,-1,-2,-1,0,1,0,0],toolAngle:[0,-.3,-.9,-1.2,-.6,.4,.3,0]},
 fletch:{handY:[24,23,25,22,24,22,24,25],handX:[0,1,2,3,4,2,1,0],headX:[0,0,-1,-1,0,1,0,0]},
 count:{handY:[24,23,22,23,24,22,23,24],handX:[0,-1,0,1,0,-1,0,0],headX:[0,-1,-1,0,1,0,0,0]},
 cover:{handY:[26,24,23,22,23,25,26,27],handX:[0,-1,-2,-3,-2,-1,0,0],bodyX:[0,-1,-1,-1,0,0,0,0]},
 play:{handY:[26,24,22,24,25,23,24,26],handX:[0,-2,0,3,1,-1,2,0],bodyX:[0,-1,0,1,0,-1,0,0]},
 pluck:{handY:[25,24,23,21,22,24,25,26],handX:[0,1,2,3,2,1,0,0],bodyX:[0,0,-1,0,1,0,0,0]},
 longBlow:{handY:[24,22,19,18,18,18,20,24],handX:[0,1,2,2,2,2,1,0],bodyY:[0,0,-1,-1,-1,-1,0,0]},
 rehearse:{handY:[25,23,20,22,19,22,20,25],handX:[0,1,2,3,2,3,1,0],bodyY:[0,0,-1,0,-1,0,0,0]},
 balance:{handY:[24,24,23,22,23,24,24,25],handX:[0,-1,-2,0,2,1,-1,0],bodyX:[0,-1,-2,0,2,1,-1,0],legSwing:[0,-1,0,1,0,-1,0,0]},
 removeWeight:{handY:[25,23,21,19,20,22,24,26],handX:[0,1,2,3,3,2,1,0],bodyX:[0,0,0,1,0,0,0,0]},
 polish:{handY:[26,24,25,23,25,24,25,26],handX:[0,-2,2,-2,3,-1,1,0],bodyX:[0,-1,1,-1,1,0,0,0]},
 smooth:{handY:[26,24,23,24,23,24,25,26],handX:[0,-2,1,4,2,-2,1,0],bodyX:[0,-1,0,1,0,-1,0,0]},
 sleep:{handY:[27,27,27,27,27,27,27,27],bodyY:[0,1,2,1,0,-1,-2,-1],headY:[0,0,0,0,0,0,0,0],headTilt:[0,0,.01,.01,0,-.01,-.01,0]},
 tuck:{handY:[25,24,23,22,23,24,25,26],handX:[0,-1,-2,-3,-2,0,1,0],bodyX:[0,0,-1,-1,0,0,0,0]},
 lie:{bodyY:[0,0,0,0,0,0,0,0],headTilt:[0,.01,0,-.01,0,.01,0,-.01]},
};
for(const [name,track] of Object.entries(actionTracks))tracks[name]=track;
// Strong held key poses: anticipation, contact, recoil and a deliberate recovery.
Object.assign(tracks,{
 hammer:{handY:[27,22,16,15,29,25,22,27],handX:[0,-2,-3,-2,6,4,2,0],bodyX:[0,-2,-3,-2,4,2,1,0],bodyY:[0,-1,-2,-1,3,2,0,0],toolAngle:[0,-.5,-1.4,-1.2,.8,.4,-.1,0]},
 pull:{handY:[27,25,24,25,23,24,26,27],handX:[0,4,7,6,-3,-2,1,0],bodyX:[0,1,2,1,-4,-3,-1,0],bodyY:[0,0,1,1,2,1,0,0]},
 overhead:{handY:[27,23,17,14,16,20,24,27],handX:[0,-1,-2,1,5,4,2,0],bodyX:[0,-1,-2,-1,3,2,1,0]},
 ground:{handY:[26,28,31,32,29,27,25,26],handX:[0,2,5,6,3,1,0,0],bodyY:[0,1,3,4,3,2,0,0],bodyX:[0,1,2,3,2,1,0,0]},
 grind:{handY:[27,26,24,26,28,26,25,27],handX:[0,-3,0,5,3,-2,0,0],bodyX:[0,-2,-1,3,2,-1,0,0]},
 work:{handY:[27,24,22,24,28,26,24,27],handX:[0,-2,-3,2,5,3,1,0],bodyX:[0,-1,-2,0,3,2,0,0]},
 music:{handY:[26,23,21,25,22,25,23,26],handX:[0,-2,2,4,-1,3,1,0],bodyX:[0,-1,0,2,0,-1,0,0]},
 offer:{handY:[27,25,24,23,23,24,25,27],handX:[0,1,3,6,6,4,2,0],bodyX:[0,0,1,2,2,1,0,0]},
});
const lookup=new Map();
for(const [track,names] of Object.entries(groups))for(const name of names.split(' '))if(!lookup.has(name))lookup.set(name,track);
const actionAliases={
 'back-row':'backRow','kick':'kickObject','step-back':'stepBack','look':'look','observe':'observe','inspect':'inspect','watch':'observe','hands':'hands','point':'point','sit':'sit','lap':'lap','stretch':'stretch','serve':'serve','guard':'guard','brace':'brace','thrust':'thrust','swing':'swing','fletch':'fletch','count':'count','cover':'cover','play':'play','pluck':'pluck','long-blow':'longBlow','rehearse':'rehearse','balance':'balance','remove-weight':'removeWeight','polish':'polish','smooth':'smooth','leaves':'leaves','fruit':'fruit','trunk':'trunk','lean':'lean','shade':'shade',
 'sling-low':'pull','load-sling':'loadSling','high-shot':'overhead','low-shot':'ground','quick-shot':'overhead','steady-shot':'ground','raise':'overhead','lift-chain':'overhead','lift-oar':'overhead',
 'fill-vessels':'fill','fill-manna':'fill','rinse':'rinse','taste':'eat','sip':'sip','gather-flour':'gather','harvest':'gather','retrieve':'pick','feed-grain':'scoop','portion':'portion','bundle':'tie','roll-seal':'roll',
 'push':'push','reel':'pull','lower-rope':'pull','lower':'pull','rope':'pull','uncoil':'coil','untie':'untie','turn-key':'turn','turn':'turn','stack':'stack','arrange':'place','stamp':'press','tend':'wipe','trim':'brush','tune':'repair','mend':'repair','tap':'strum','trace':'write','unroll':'open','wrap':'close','cover':'cover','dip':'scoop','fan':'work','warm':'rest','kneel':'ground','bow':'rest','hold':'hold','carry':'pull','shake-cloth':'shake','shake-net':'shake','spin-sling':'sling','cast':'overhead','cast-line':'overhead','bait':'scoop','guide':'offer','point':'point','wave':'offer','place':'place','pick':'pick','gather':'gather','sort':'sort','measure':'measure','repair':'repair','wipe':'wipe','brush':'brush','divide':'divide','press':'press','knead':'knead','pour':'pour','fill':'fill','cap':'cap','scoop':'scoop','drink':'drink','wash':'wash','shake':'shake','bonk':'bonk','climb':'climb','read':'read','write':'write','open':'open','close':'close','share':'share','break':'break','sprinkle':'sprinkle','sow':'sow','thresh':'thresh','strum':'strum','blow':'blow','row':'row','reins':'reins','tie':'tie','untie':'untie','coil':'coil','observe':'observe','offer':'offer','sleep':'sleep','tuck':'tuck','lie':'lie'
};
export function actionTrack(gesture){return actionAliases[gesture]||lookup.get(gesture)||null;}
export function applyActionTrack(pose,position){
 if(pose.archery||pose.lie&&!['sleep','tuck','smooth','lie'].includes(pose.actual)||pose.kneel||pose.wearing||pose.unique||['wear','remove','climb-ladder'].includes(pose.actual))return pose;
 const track=tracks[actionTrack(pose.actual)||actionTrack(pose.gesture)];if(!track)return pose;
 const beat=position*2,phase=Math.floor(beat)%8,next=(phase+1)%8,f=beat-Math.floor(beat);
 const local=pose.gesture==='drink'&&[4,5].includes(phase)?Math.max(0,(f-.65)/.35):f;
 const subtle=['drink','eat','blow','inspect','rest'].includes(actionTrack(pose.actual)||actionTrack(pose.gesture));
 const stepped=subtle?Math.floor((local*local*(3-2*local))*4)/4:0;
 for(const [key,values] of Object.entries(track))pose[key]=key==='toolAngle'||key==='headTilt'?values[phase]:Math.round(values[phase]+(values[next]-values[phase])*stepped);
 return pose;
}
