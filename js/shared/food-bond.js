// Creative friendship dialogue and daily food rewards, saved with account state.
(()=>{
 const greetings=['처음 함께 걷게 되어 반가워요.','다시 찾아주셨군요. 조금 더 가까워진 기분이에요.','오늘은 어떤 말씀을 마음에 담았나요?','당신과 이야기하는 시간이 기다려져요.','함께 걸어온 시간이 소중해요.','힘든 날에도 잠깐 쉬어 갈 자리가 되어 줄게요.','작은 마음도 알아주는 당신이 고마워요.','우리 사이에 쌓인 이야기가 참 많네요.','오래 함께한 친구처럼 편안해요.','가장 가까운 말씀 친구가 되어 주셔서 고마워요.'];
 const ups=['','두 번째 만남부터는 더 환하게 인사할게요.','이제 당신의 발걸음이 익숙해졌어요.','서로를 조금 더 알아가고 있네요.','마음을 나눌 수 있는 친구가 되었어요.','앞으로도 함께 이야기를 쌓아 가요.','당신의 꾸준한 마음을 기억할게요.','함께하는 날들이 큰 선물이에요.','우리의 우정이 한층 깊어졌어요.','최고의 말씀 친구가 되었어요!'];
 function book(){return state.foodBond||(state.foodBond={days:{},people:{},balance:0});}
 function sync(){const b=book(),date=todayStr(),d=b.days[date]||(b.days[date]={});for(const [kind,done]of [['attendance',true],['reading',!!state.plan&&progress().readToday>0&&progress().dailyDone],['qt',!!state.qt[date]?.done]])if(done&&!d[kind]){d[kind]=true;b.balance++;}return b;}
 function info(key){const b=sync(),p=b.people[key]||{total:0};let level=1,spent=0;while(level<10&&p.total>=spent+level*2){spent+=level*2;level++;}return {level,total:p.total,progress:p.total-spent,needed:level<10?level*2:0,balance:b.balance,target:b.days[todayStr()].target};}
 function choose(key){const b=sync(),d=b.days[todayStr()];if(d.given&&d.target!==key)return false;d.target=key;persist();return true;}
 function give(key,name){const b=sync(),before=info(key),d=b.days[todayStr()];if(before.level===10)return '이미 최고 레벨의 말씀 친구예요.';if(!b.balance)return '말씀의 양식이 없어요. 출석·통독·QT로 하루 최대 3개를 얻어요.';if(d.target!==key)return '먼저 오늘 양식을 줄 인물로 지정해 주세요.';const p=b.people[key]||(b.people[key]={total:0});p.total++;b.balance--;d.given=true;const after=info(key);persist();return `${name}: 말씀의 양식을 나눠 주셔서 고마워요! ${after.level>before.level?`레벨 ${after.level}! ${ups[after.level-1]}`:'당신의 따뜻한 마음을 간직할게요.'}`;}
 globalThis.FoodBond={sync,info,choose,give,greeting:(key,name)=>`${name}: ${greetings[info(key).level-1]}`};
 document.addEventListener('DOMContentLoaded',()=>{sync();persist();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){sync();persist();}});
})();
