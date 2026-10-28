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
 wrapped:{label:'사선으로 여민 겹 튜닉',crossSash:true},
 pleated:{label:'주름을 넣은 긴 튜닉',pleated:true},
 fringed:{label:'가장자리에 술을 단 겉옷',fringed:true,mantle:true},
 dyed:{label:'짙은 염색 겉옷',dyed:true,mantle:true},
 apron:{label:'앞치마를 덧댄 작업복',apron:true,belt:true},
 vest:{label:'짧은 조끼와 긴 속옷',vest:true},
 hooded:{label:'후드를 붙인 겉옷',hood:true,mantle:true},
 embroidered:{label:'깃과 소매에 무늬를 넣은 겉옷',embroidered:true},
 short:{label:'짧은 소매 튜닉',shortSleeve:true},
 layered:{label:'속옷 위에 겹쳐 입은 긴 옷',layered:true,mantle:true},
 scarf:{label:'어깨에 두른 짧은 천',scarf:true},
 mourning:{label:'수수한 겉옷과 거친 띠',mourning:true,belt:true},
 guard:{label:'가죽 조끼와 어깨 보호대',guard:true,belt:true},
 scribe:{label:'허리 주머니를 단 기록자 옷',scribePouch:true,belt:true},
 gathered:{label:'허리를 모아 여민 긴 옷',gathered:true,belt:true},
 patched:{label:'덧댄 천 조각이 보이는 튜닉',patchwork:true,belt:true},
 panelled:{label:'색 띠를 나눈 겹 튜닉',verticalPanels:true,crossSash:true},
 padded:{label:'어깨 덧댐과 넓은 허리띠',shoulderPads:true,belt:true},
 hemmed:{label:'가장자리에 짧은 기하 무늬를 두른 옷',hemPattern:true,trim:'#c8ad72'},
};
const specifics={
 아론:'highPriest',엘르아살:'highPriest',사무엘:'linen',아담:'leather',하와:'leather',
 '세례 요한':'fur',엘리야:'fur',바로:'egyptian',보디발:'egyptian',고레스:'persian',다리오:'persian',하만:'persian',
 아벨:'shepherd',라헬:'shepherd',아모스:'shepherd',룻:'worker',나봇:'worker',일꾼:'worker',
 아굴라:'artisan',브리스길라:'artisan',다비다:'artisan',느헤미야:'artisan',노아:'artisan',
};
const garmentEvidence={
 '엘리야':{label:'털옷과 가죽띠',ref:'열왕기하 1:8',text:'본문은 엘리야의 털옷과 허리의 가죽띠를 묘사해요. 그림은 재료와 형태를 단순화한 픽셀 표현이에요.'},
 '예수님':{label:'통으로 짠 속옷',ref:'요한복음 19:23',text:'군인들이 예수님의 속옷을 찢지 않고 제비 뽑은 장면에서 통으로 짠 옷이라고 설명해요. 화면의 긴 튜닉은 그 특징을 단순화한 표현이에요.'},
 '예수':{label:'통으로 짠 속옷',ref:'요한복음 19:23',text:'군인들이 예수님의 속옷을 찢지 않고 제비 뽑은 장면에서 통으로 짠 옷이라고 설명해요. 화면의 긴 튜닉은 그 특징을 단순화한 표현이에요.'},
 '세례 요한':{label:'낙타털 옷과 가죽띠',ref:'마태복음 3:4',text:'본문은 낙타털 옷과 가죽띠를 기록해요. 실제 색과 재단 방식은 정해지지 않아 그림의 색은 창작이에요.'},
 '아론':{label:'제사장 의복과 흉패',ref:'출애굽기 28:4, 15–21',text:'에봇·겉옷·속옷·관·띠와 보석을 단 흉패가 기록돼요. 작은 화면에 맞춰 흉패의 보석은 몇 개의 도트로 줄였어요.'},
 '엘르아살':{label:'제사장 의복',ref:'민수기 20:26–28',text:'아론의 옷을 벗겨 엘르아살에게 입히는 장면이 기록돼요. 도감 그림은 제사장 복식을 간단한 상징으로 표현해요.'},
 '사무엘':{label:'세마포 에봇과 작은 겉옷',ref:'사무엘상 2:18–19',text:'어린 사무엘은 세마포 에봇을 입고 섬겼고, 어머니가 해마다 작은 겉옷을 지어 주었어요. 현재 그림은 그 복식을 단순화했어요.'},
 '요셉':{label:'채색옷',ref:'창세기 37:3',text:'개역개정은 채색옷, 쉬운성경은 소매가 긴 좋은 옷으로 표현해요. 색 배열을 본문에서 확정할 수 없어 그림의 무늬는 구분을 위한 창작이에요.'},
 '에스더':{label:'왕후의 예복',ref:'에스더 5:1',text:'에스더가 왕후의 예복을 입고 왕 앞에 나아간 장면이 기록돼요. 색과 왕관 모양은 도감용 창작 표현이에요.'},
 '모르드개':{label:'푸르고 흰 조복과 자색 겉옷',ref:'에스더 8:15',text:'푸르고 흰 조복, 큰 금관, 자색 겉옷이 기록돼요. 도감에서는 해당 장면의 복식을 상징적으로 단순화했어요.'},
 '다니엘':{label:'자주색 옷과 금 사슬',ref:'다니엘 5:29',text:'왕이 다니엘에게 자주색 옷을 입히고 금 사슬을 목에 걸게 했어요. 이는 특정 사건에서 받은 복식이며 평상시 차림을 뜻하지 않아요.'},
 '골리앗':{label:'놋 투구와 비늘 갑옷',ref:'사무엘상 17:5–7',text:'본문은 놋 투구, 비늘 갑옷, 놋 각반과 창을 묘사해요. 그림의 갑옷은 작은 픽셀 크기에 맞춰 간략화한 상징 표현이에요.'},
 '압살롬':{label:'긴 머리',ref:'사무엘하 14:25–26',text:'본문은 아름다운 용모와 무거운 머리털을 묘사해요. 긴 머리 모양으로 특징을 나타냈으며 옷은 본문에서 확인되지 않아 창작이에요.'},
 '삼손':{label:'자르지 않은 머리털',ref:'사사기 16:13, 17',text:'나실인 서원과 자르지 않은 머리털이 기록돼요. 도트 머리카락은 일곱 가닥을 그대로 세기보다 긴 머리의 상징으로 표현했어요.'},
 '므비보셋':{label:'2발의 장애',ref:'사무엘하 9:13',text:'므비보셋은 2발을 다 절었어요. 이는 의복 특징이 아니라 인물의 몸 상태 기록이며, 걷는 동작에 반영돼요.'},
};
export function wardrobeDetails(style,name,refs=[]){
 const detail=garmentEvidence[name];
 if(detail)return [detail];
 const evidence=String(style?.physicalEvidence||'');
 if(evidence){const m=evidence.match(/([^.]*(?:옷|겉옷|에봇|관|머리털|머리|띠|예복|의복)[^.]*\.)/);if(m){const ref=evidence.match(/([^ ·]+\s+\d+[:장][^ ·]*)/);return [{label:'본문에 기록된 외형',ref:ref?.[1]||refs[0]||'관련 본문',text:m[1]+' 도감에서는 해당 특징을 픽셀로 간단히 표현했어요.'}];}}
 return [];
}
export function wardrobeFor(style,role=''){
 const inferred=style.royal?'royal':/제사장/.test(role)?'priest':style.fur?'fur':style.shawl||style.hood?'shawl':style.mantle?'traveler':style.vest?'worker':null;
 const seed=[...(style.name||'')].reduce((h,c)=>(Math.imul(h,31)+c.codePointAt(0))>>>0,0);
 const creative=['wrapped','pleated','fringed','dyed','apron','vest','hooded','embroidered','short','layered','scarf','mourning','guard','scribe','gathered','patched','panelled','padded','hemmed'];
 const kind=specifics[style.name]||inferred||creative[seed%creative.length];
 const wardrobe=WARDROBES[kind];
 const detail=/골리앗/.test(style.name)?{plate:true,helmet:true}:style.name==='모르드개'?{mantleColor:'#87628e',underColor:'#e8e4d2'}:style.name==='다니엘'?{goldChain:true}:{};
 const colorSeed=[...(style.name||'')].reduce((h,c)=>(Math.imul(h,33)^c.codePointAt(0))>>>0,5381);
 const creativeColors=['#a96668','#547f91','#8b6f9e','#b27e4f','#648a70','#666e9d','#a07786','#758f91','#ad9861','#826a5b','#637eaa','#956b50','#6f8b5c','#8b7288','#4f789d','#aa745f','#72805f','#98784a','#5d8290','#8a6071','#74806e','#9c6955','#5f6f8e','#927b62','#607f79','#a2769a','#76769f','#9a8058'];
 const creativeColor=style.name&&!wardrobeDetails(style,style.name).length?{coat:creativeColors[colorSeed%creativeColors.length]}:{};
 return {...wardrobe,...style,...creativeColor,...detail,wardrobe:kind,wardrobeLabel:wardrobe.label,
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
 if(s.crossSash){if(back){r(8,23,1,8,accent);r(14,23,1,8,accent);}else{r(lo,23,1,2,accent);for(let i=0;i<7;i++)r(lo+i,24+i,1,1,accent);r(hi-1,29,1,3,accent);}}
 if(s.pleated)for(let x=lo+2;x<hi;x+=4)r(x,25,1,5,'#34363a35');
 if(s.fringed)for(let x=lo;x<hi;x+=3)r(x,31,1,1,accent);
 if(s.dyed)r(side?12:9,22,side?2:6,2,accent);
 if(s.apron){r(side?10:9,25,side?5:6,6,'#a27b50');r(side?11:10,26,side?2:4,1,accent);}
 if(s.vest){r(side?10:7,22,side?2:2,7,accent);r(side?15:15,22,2,7,accent);}
 if(s.hood){r(side?8:6,21,side?4:12,3,'#4d4a54');r(side?8:7,21,side?3:10,2,s.coat);}
 if(s.embroidered){r(side?15:8,22,side?2:8,1,accent);r(side?15:10,29,side?2:4,1,accent);}
 if(s.shortSleeve){r(side?8:6,21,side?4:4,4,s.coat);r(side?8:15,31,side?2:2,1,accent);}
 if(s.layered){r(side?8:6,23,side?2:2,8,accent);r(side?16:16,23,2,8,accent);}
 if(s.scarf){r(side?13:8,21,side?3:8,2,accent);r(side?14:9,23,side?2:6,1,accent);}
 if(s.mourning){r(lo,27,hi-lo,2,'#37383a');r(side?8:lo,29,side?2:1,3,'#37383a');}
 if(s.guard){r(side?7:6,22,side?4:3,5,'#705f4f');r(side?15:15,22,2,5,'#705f4f');r(side?15:8,23,2,2,accent);}
 if(s.scribePouch){r(side?15:13,27,side?3:4,5,'#906d49');r(side?16:14,28,2,2,accent);}
 if(s.gathered){r(lo,28,hi-lo,1,accent);r(lo+2,29,hi-lo-4,1,accent);}
 if(s.verticalPanels){r(lo+2,22,2,8,accent);r(hi-4,22,2,8,accent);r(side?12:lo+5,24,1,5,'#fff2cd45');}
 if(s.patchwork){r(lo+1,25,3,2,accent);r(hi-4,28,3,2,accent);r(lo+5,23,2,2,'#e8d8b2');}
 if(s.shoulderPads){r(side?8:7,21,3,3,accent);r(side?14:14,21,3,3,accent);r(lo,24,hi-lo,1,'#403a35');}
 if(s.hemPattern)for(let x=lo;x<hi;x+=3){r(x,30,1,1,accent);if(x%2===0)r(x+1,29,1,1,accent);}
 if(s.royal){r(lo,28,1,2,accent);r(hi-1,28,1,2,accent);}
 if(s.broadCollar){r(side?14:8,21,side?3:8,2,'#d2b06b');r(side?15:10,23,side?2:4,1,'#73999d');}
 if(s.goldChain&&!back){r(side?15:9,22,1,2,'#d5b05a');r(side?16:14,22,1,2,'#d5b05a');r(side?16:10,24,side?1:4,1,'#d5b05a');}
 if(s.priestBreastplate){
  if(back){r(8,22,1,6,accent);r(15,22,1,6,accent);r(8,28,8,1,accent);}
  else if(side){r(16,22,2,5,'#c7a65c');for(let y=0;y<4;y++)r(17,22+y,1,1,['#a75d53','#6b9caa','#a08cba'][y%3]);}
  else{r(9,22,6,5,'#c7a65c');for(let y=0;y<4;y++)for(let x=0;x<3;x++)r(9+x*2,22+y,1,1,['#a75d53','#6b9caa','#a08cba'][(x+y)%3]);}
 }
}
