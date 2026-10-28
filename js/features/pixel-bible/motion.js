// 외형 리듬은 창작. 신체 상태는 이름만으로 추정하지 않고 권·장·역할을 함께 확인한다.
export function characterMotion(n,chapters=[]) {
 if(n.creature)return {key:n.creature.kind==='plant'?'rooted':n.creature.body,speed:n.creature.kind==='plant'?0:n.creature.body==='snake'?1.3:n.creature.body==='bird'?3.4:2.2,swing:.08,frequency:4,phase:0,limp:false,bounce:n.creature.body==='bird'?1:0,evidence:n.creature.kind==='plant'?'뿌리내린 식물 · 자동 이동하지 않으며 바람에 흔들림':'종의 신체에 맞춘 창작 걷기·휴식·먹이 행동'};
 const own=chapters.filter(c=>n.refs?.includes(`${c.name} ${c.chap}${c.code==='psa'?'편':'장'}`));
 const has=(code,from,to=from)=>own.some(c=>c.code===code&&c.chap>=from&&c.chap<=to);
 const seed=[...(n.identity?.id||n.name)].reduce((s,c)=>s+c.codePointAt(0),0);
 const profile={key:['gentle','lively','steady'][seed%3],speed:[2.6,2.9,2.7][seed%3],swing:[.1,.17,.07][seed%3],frequency:[5,7,4][seed%3],phase:(seed%13)/2,limp:false,bounce:0,evidence:'이름별 리듬과 매달림은 창작 동작'};
 if(n.name==='야곱'&&has('gen',32,50))Object.assign(profile,{key:'limp',limp:true,speed:1.8,swing:.07,evidence:'창세기 32:31 · 허벅지로 인해 절뚝거리는 걸음'});
 if(/므비보셋/.test(n.name)&&has('2sa',4,21))Object.assign(profile,{key:'limp',limp:true,speed:1.5,swing:.06,evidence:'사무엘하 4:4, 9:13 · 2발의 장애를 반영한 느린 비대칭 걸음'});
 if(n.name==='모세')Object.assign(profile,{key:'steady',swing:.05,frequency:4,evidence:'지팡이를 든 인물의 균형을 고려한 창작 매달림'});
 if(n.name==='삭개오'&&has('luk',19))Object.assign(profile,{key:'climber',swing:.13,frequency:6,evidence:'누가복음 19:4 · 나무에 올라가는 행동을 참고한 매달림'});
 if(n.name==='엘리야'&&has('1ki',18))Object.assign(profile,{key:'runner',speed:3.6,swing:.12,evidence:'열왕기상 18:46 · 아합 앞에서 달리는 행동'});
 if(n.name==='다윗'&&has('1sa',17))Object.assign(profile,{key:'runner',speed:3.3,swing:.11,evidence:'사무엘상 17:48 · 골리앗을 향해 달리는 행동'});
 if(n.name==='엘리야'&&has('1ki',19))Object.assign(profile,{key:'weary',speed:1.9,swing:.06,frequency:4,evidence:'열왕기상 19:4–8 · 지침과 쉼을 반영한 느린 걸음'});
 if(n.name==='다윗'&&has('2sa',6)||n.name==='미리암'&&has('exo',15))Object.assign(profile,{key:'dance',bounce:2,swing:.16,frequency:7,evidence:'사무엘하 6:14 / 출애굽기 15:20 · 춤을 반영한 경쾌한 걸음'});
 if(/일어나 걸|고침.*걸|걸.*고침/.test(n.role||''))Object.assign(profile,{key:'restored',limp:false,bounce:1,speed:2.8,evidence:'현재 장의 회복 후 걸음을 반영 (치유 이전 상태로 고정하지 않음)'});
 return profile;
}
export function motionPose(profile,stride=0,moving=false){
 if(!moving)return {x:0,y:0,tilt:0,speed:1};
 const phase=stride*Math.PI*2;
 if(profile.limp){const loaded=Math.sin(phase)>0;return {x:loaded?1:0,y:loaded?2:0,tilt:loaded?.045:-.015,speed:loaded?.52:1};}
 return {x:0,y:profile.bounce?Math.round(-Math.abs(Math.sin(phase))*profile.bounce):0,tilt:0,speed:1};
}

// Six discrete poses: dangling legs, alternating kicks and reaching hands.
// Limb asymmetry stays character-specific; an impaired leg is not forced to kick.
export function hangingPose(profile,time=0,velocity=0,reduced=false){
 const beat=reduced?0:Math.floor(time*profile.frequency+profile.phase)%6;
 const lively=['lively','climber','runner','dance'].includes(profile.key);
 const left=[1,0,-2,0,2,1][beat],right=[-1,2,1,0,-2,0][beat];
 return {direction:'down',angle:reduced?0:Math.max(-.24,Math.min(.24,velocity*.004+Math.sin(beat*Math.PI/3)*Math.max(.08,profile.swing))),
  pose:{dangling:true,bodyX:0,bodyY:0,leftLeg:profile.limp?1:left,rightLeg:profile.limp?0:right,leftArm:(lively?[0,-2,-4,-1,1,-2]:[1,0,-1,1,2,0])[beat],rightArm:(lively?[-3,0,1,-2,-4,0]:[0,1,2,0,-1,1])[beat]},
  expression:lively&&beat%3===0?'surprised':'worried'};
}
// Keep the character's source sprite and outfit while animating discrete limbs.
export function liftedCharacterFrame(profile,time=0,velocity=0,reduced=false){
 const hanging=hangingPose(profile,time,velocity,reduced);
 return {direction:hanging.direction,interaction:hanging.pose,expression:hanging.expression,walkFrame:reduced?0:Math.floor(time*profile.frequency+profile.phase)%4,motionOnly:false};
}
