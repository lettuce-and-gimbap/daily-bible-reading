// Reviewed everyday uses. These are creative animation choices, not additional Bible events.
const rows=[
 ['field grain wheat barley','sow:빈 곳에 씨 뿌리기|sort:거둔 이삭 고르기|thresh:이삭 두드려 낟알 털기|tie:이삭 묶음 매기'],
 ['tree fig-tree olive-tree vine vineyard grapes','gather:손 뻗어 열매 거두기|sort:거둔 열매 고르기|offer:열매를 손에 받쳐 내밀기'],
 ['bush hyssop reed lily palm cedar','leaves:잎 끝에 손 대어 살피기|trunk:줄기를 손으로 짚기|shade:곁에 낮게 앉아 쉬기'],
 ['water oil olive-oil jar pitcher bowl cup milk wine honey perfume myrrh','close:마개를 다시 닫기|wipe:흐른 내용물 닦기|offer:그릇을 앞으로 내밀기|cap:입구 마개 열기'],
 ['well basin laver water-supply','wash:길어 온 물로 손 씻기|rinse:손끝에 물 끼얹기|fill:그릇에 물 받아 채우기'],
 ['bench throne footstool table','lap:앉아 무릎에 손 모으기|feet:앉아 발 번갈아 흔들기|stretch:앉아 두 팔 펴기|rise:자리에서 일어나기'],
 ['bed mat','stretch:누운 자리에서 기지개 켜기|fold:이불 끝 접어 정리하기|smooth:자리의 주름 펴기'],
 ['boat ark-noah chariot','grip:가장자리를 양손으로 잡기|repair:연결 부위 손질하기|wipe:나무 표면 닦기|reins:양손으로 당겨 자세 잡기'],
 ['scroll book tablet letter','trace:글줄 손끝으로 따라가기|unroll:앞으로 펼쳐 보기|fold:읽은 부분 접어 정리하기|offer:읽을 부분 앞으로 내밀기'],
 ['staff rod','grip:양손으로 자루 잡기|turn:자루를 돌려 살피기|brace:지팡이를 짚고 몸 지탱하기'],
 ['sword spear javelin shield','grip:손잡이 단단히 쥐기|brace:몸 낮추고 자세 버티기|point:안전한 빈 방향 가리키기'],
 ['bow arrow','wipe:활대와 화살대 닦기|tie:깃과 끈 매듭 조이기|guard:빈 쪽을 향해 대기하기'],
 ['sling rope net chain fetter hook','sort:엉킨 부분 나누어 정리하기|stretch:양손을 벌려 길이 확인하기|repair:연결 매듭 손질하기|grip:양손으로 단단히 잡기'],
 ['hammer axe sickle plow yoke oar anchor wheel ladder','measure:손으로 작업 간격 가늠하기|brush:작업 뒤 붙은 가루 털기|grip:손잡이를 양손으로 다시 잡기|turn:작업 방향 바꾸어 잡기'],
 ['helmet armor cloak robe sackcloth ephod breastplate crown sandal belt towel veil curtain linen sail','fold:한쪽 끝부터 접기|tie:끈이나 모서리 매기|measure:몸 앞에 대어 길이 재기|brush:겉면 먼지 털기'],
 ['basket treasure-chest moneybag','count:안의 물건 하나씩 세기|sort:내용물을 나누어 고르기|cover:내용물 위를 덮기|close:입구를 여며 닫기'],
 ['lamp lampstand torch candle oven','shield:손으로 눈앞 열기 가리기|fan:안전한 거리에서 바람 보내기|tend:긴 막대로 불 살피기|trim:심지 주변 손질하기'],
 ['censer incense','raise:향 그릇을 높이 받치기|waft:손으로 향을 가볍게 보내기|close:뚜껑 덮어 정리하기'],
 ['bread barley-bread manna fig fruit','portion:작은 몫으로 나누기|share:한 몫을 앞으로 내밀기|break:2 손으로 조각 나누기|serve:먹을 것을 앞에 놓기'],
 ['seed mustard salt','portion:손바닥에 조금씩 덜기|place:고른 것 따로 놓기|share:작은 몫을 나누어 내밀기'],
 ['flour dough leaven','knead:양손 번갈아 주무르기|roll:손바닥으로 굴려 모으기|divide:반죽을 두 몫으로 가르기|sprinkle:위에 가루 흩뿌리기'],
 ['seal signet key nail','press:작업면에 맞추어 누르기|turn:손끝으로 방향 돌리기|brush:틈에 낀 먼지 털기'],
 ['pen ink','write:짧은 글줄 써 보기|trace:쓴 글줄 따라 긋기|dip:붓끝을 먹에 적시기|cover:먹그릇 덮기'],
 ['coin silver gold pearl jewel scale','sort:크기별로 나누어 놓기|weigh:손에 받쳐 무게 가늠하기|count:손끝으로 하나씩 세기|polish:표면을 천으로 닦기'],
 ['lyre harp tambourine trumpet flute cymbal','tune:연주 전에 손으로 조율하기|beat:짧은 박자 맞추기|hold:연주 뒤 양손으로 받치기|offer:악기를 앞으로 내밀기'],
 ['millstone stone brick','brush:표면 돌가루 털기|stack:작업한 것을 쌓아 놓기|measure:손으로 너비 가늠하기|turn:옆면을 돌려 살피기'],
];
const additions=new Map();
for(const [kinds,text]of rows)for(const kind of kinds.split(' '))additions.set(kind,text.split('|').map(s=>s.split(':')));
export function additionalActions(kind,base){const seen=new Set(base.map(r=>r[0]));return (additions.get(kind)||[]).filter(([g])=>!seen.has(g));}
export function expandedActions(kind,base){return [...base,...additionalActions(kind,base)];}
