// Clothing construction is a design interpretation; only evidence-tagged details
// describe scripture. Do not infer a person's actual colors from their role.
export const WARDROBES={
 tunic:{label:'기본 속옷과 허리 주름'}, traveler:{label:'여행용 겉옷',mantle:true},
 worker:{label:'작업용 튜닉과 띠',belt:true}, shepherd:{label:'목자의 겉옷',mantle:true,belt:true},
 fur:{label:'거친 털옷과 가죽띠',fur:true,belt:true}, royal:{label:'테두리 장식 예복',mantle:true},
 priest:{label:'세마포 계열 의복과 띠',belt:true}, highPriest:{label:'에봇과 흉패',priestBreastplate:true,belt:true},
 linen:{label:'가죽옷과 구별되는 밝은 베옷'}, leather:{label:'가죽옷',leather:true},
 artisan:{label:'일할 때 띠로 여민 튜닉',belt:true}, shawl:{label:'어깨에 두른 숄',shawl:true},
 egyptian:{label:'이집트 복식에서 착안한 깃과 주름옷',broadCollar:true},
 persian:{label:'페르시아 복식에서 착안한 겹옷',mantle:true},
};
const specifics={
 아론:'highPriest',엘르아살:'highPriest',사무엘:'linen',아담:'leather',하와:'leather',
 '세례 요한':'fur',엘리야:'fur',바로:'egyptian',보디발:'egyptian',고레스:'persian',다리오:'persian',하만:'persian',
 아벨:'shepherd',라헬:'shepherd',아모스:'shepherd',룻:'worker',나봇:'worker',일꾼:'worker',
 아굴라:'artisan',브리스길라:'artisan',다비다:'artisan',느헤미야:'artisan',노아:'artisan',
};
export function wardrobeFor(style,role=''){
 const kind=specifics[style.name]||(style.royal?'royal':/제사장/.test(role)?'priest':style.fur?'fur':style.shawl||style.hood?'shawl':style.mantle?'traveler':style.vest?'worker':'tunic');
 const wardrobe=WARDROBES[kind];
 const detail=/골리앗/.test(style.name)?{plate:true,helmet:true}:style.name==='모르드개'?{mantleColor:'#87628e',underColor:'#e8e4d2'}:style.name==='다니엘'?{goldChain:true}:{};
 return {...wardrobe,...style,...detail,wardrobe:kind,wardrobeLabel:wardrobe.label,
  design:style.design+' 의복의 재단·주름·테두리는 시대 복식에서 착안한 창작 도안이에요.'};
}
// Shared front/profile/back cloth marks stay inside the torso. Facial pixels and
// limb animation are rendered separately after these marks.
export function drawWardrobe(r,s,direction='down'){
 const side=direction==='right'||direction==='left',back=direction==='up';
 const lo=side?10:8,hi=side?16:16,accent=s.trim||s.accent||'#c9b58d';
 if(s.underColor){r(side?14:10,22,side?3:4,8,s.underColor);}
 if(s.mantleColor){if(back)r(6,22,12,9,s.mantleColor);else r(side?8:6,22,2,9,s.mantleColor);}
 if(s.fold===1){r(lo,25,1,5,'#302f3522');r(hi-2,27,1,4,'#ffffff22');}
 if(s.fold===2){r(lo+2,24,1,7,'#302f3522');r(hi-1,28,1,3,'#ffffff22');}
 if(s.weave===1)r(lo,30,hi-lo,1,accent);
 if(s.weave===2)for(let x=lo;x<hi;x+=3)r(x,30,2,1,accent);
 if(s.trim){r(side?16:7,23,1,3,s.trim);r(lo,31,hi-lo,1,s.trim);}
 if(s.leather){r(lo,25,hi-lo,1,'#6f503c');r(lo+2,24,1,3,'#d2aa75');}
 if(s.royal){r(lo,28,1,2,accent);r(hi-1,28,1,2,accent);}
 if(s.broadCollar){r(side?14:8,21,side?3:8,2,'#d2b06b');r(side?15:10,23,side?2:4,1,'#73999d');}
 if(s.goldChain&&!back){r(side?15:9,22,1,2,'#d5b05a');r(side?16:14,22,1,2,'#d5b05a');r(side?16:10,24,side?1:4,1,'#d5b05a');}
 if(s.priestBreastplate){
  if(back){r(8,22,1,6,accent);r(15,22,1,6,accent);r(8,28,8,1,accent);}
  else if(side){r(16,22,2,5,'#c7a65c');for(let y=0;y<4;y++)r(17,22+y,1,1,['#a75d53','#6b9caa','#a08cba'][y%3]);}
  else{r(9,22,6,5,'#c7a65c');for(let y=0;y<4;y++)for(let x=0;x<3;x++)r(9+x*2,22+y,1,1,['#a75d53','#6b9caa','#a08cba'][(x+y)%3]);}
 }
}
