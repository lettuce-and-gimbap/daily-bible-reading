// Hand-authored verse plans. Summaries are new paraphrases, never uploaded source text.
export const chapters={};
let chapter=1;const out=()=>chapters[chapter]??=[];
const v=(verse,title,study,actors,actions,extra={})=>out().push({verse,title,study,actors,actions:actions.split(' '),...extra});
const d=(verse,title,study,diagram,labels,extra={})=>v(verse,title,study,[],'look inspect point show inspect stand',{mode:'illustration',diagram:{kind:diagram,labels},...extra});
const genealogy=[
[1,'계보의 표제',['아브라함','다윗','예수'],'예수께서 아브라함과 다윗의 약속을 잇는 분임을 먼저 밝혀요.'],
[2,'언약 계보의 시작',['아브라함','이삭','야곱','유다'],'아브라함에서 유다와 형제들까지 계보가 이어져요.'],
[3,'다말이 포함된 계보',['유다 · 다말','베레스','헤스론','람'],'다말과 두 아들의 사연도 계보에서 지워지지 않아요.'],
[4,'람에서 살몬까지',['람','아미나답','나손','살몬'],'광야 세대와 연결되는 이름들이 이어져요.'],
[5,'라합과 룻의 자리',['살몬 · 라합','보아스 · 룻','오벳','이새'],'라합과 룻도 다윗에게 이르는 계보에 포함돼요.'],
[6,'다윗과 솔로몬',['이새','다윗 · 우리야의 아내','솔로몬'],'다윗의 왕권과 함께 그의 잘못을 떠올리게 하는 표현도 남겨요.'],
[7,'솔로몬 이후의 왕들',['솔로몬','르호보암','아비야','아사'],'왕들의 계보가 솔로몬 이후로 이어져요.'],
[8,'여호사밧에서 웃시야로',['아사','여호사밧','요람','웃시야'],'본문이 선별해 기록한 왕들의 흐름을 보여 줘요.'],
[9,'웃시야에서 히스기야로',['웃시야','요담','아하스','히스기야'],'왕위가 이어지는 동안에도 구원의 약속은 계속돼요.'],
[10,'히스기야에서 요시야로',['히스기야','므낫세','아몬','요시야'],'신앙과 실패의 역사를 가진 왕들이 같은 계보 안에 있어요.'],
[11,'포로기의 경계',['요시야','여고냐','바벨론 포로'],'왕들의 계보가 포로라는 전환점을 맞아요.'],
[12,'포로 이후에도 이어짐',['여고냐','스알디엘','스룹바벨'],'왕국이 무너진 뒤에도 계보의 기록은 끝나지 않아요.'],
[13,'스룹바벨 이후',['스룹바벨','아비훗','엘리아김','아소르'],'크게 알려지지 않은 이름들도 약속의 흐름 안에 있어요.'],
[14,'아소르에서 엘리웃으로',['아소르','사독','아킴','엘리웃'],'여러 세대의 이름을 따라 계보가 이어져요.'],
[15,'요셉의 앞 세대',['엘리웃','엘르아살','맛단','야곱'],'계보가 요셉의 아버지 야곱에게 가까워져요.'],
[16,'마리아에게서 나신 예수',['야곱','요셉','마리아','예수'],'요셉을 소개한 뒤, 예수께서 마리아에게서 나셨음을 구별해요.'],
[17,'세 묶음의 계보',['아브라함 → 다윗','다윗 → 포로','포로 → 그리스도'],'마태는 계보를 열네 대씩 세 묶음으로 정리해요.']];
for(const [n,t,labels,s]of genealogy){d(n,t,s,'lineage',labels);if(n===16)out().at(-1).diagram.edgeLabels=['계보','혼인','탄생'];}
v(18,'요셉이 알게 된 임신','함께 살기 전의 임신을 알게 되면서 두 사람의 상황에 긴장이 생겨요.',['요셉','마리아'],'look listen startle lower turn stand',{emotion:'worried',setting:'chamber'});
v(19,'드러내지 않으려는 요셉','요셉은 마리아를 공개적으로 수치스럽게 하지 않을 길을 생각해요.',['요셉'],'listen lower sit look turn lower',{emotion:'worried',setting:'chamber'});
v(20,'꿈속의 천사','천사는 요셉에게 두려움을 내려놓고 마리아를 맞으라고 알려요.',['주의 사자','요셉'],'look speak extend point listen lower',{mode:'vision',setting:'night',support:{actor:'요셉',actions:['sleep','sleep','sleep','sleep','sleep','sleep']},effect:'light'});
d(21,'이름과 구원의 사명','아기의 이름은 자기 백성을 죄에서 건지실 사명을 가리켜요.','promise',['아기의 이름','예수','죄에서 구원']);
d(22,'예언과 사건의 연결','이 탄생을 앞서 주신 약속의 성취로 설명해요.','promise',['예언의 약속','탄생','성취']);
d(23,'임마누엘의 뜻','임마누엘이라는 이름은 하나님이 함께하심을 알려 줘요.','promise',['임마누엘','함께하심','하나님']);
v(24,'잠에서 깨어 순종함','요셉은 꿈에서 들은 지시를 실제 행동으로 옮겨 마리아를 맞아요.',['요셉','마리아'],'sleep rise look walk extend stand',{setting:'chamber'});
v(25,'아기에게 이름을 지음','요셉은 아기가 태어난 뒤 지시받은 이름으로 부르며 순종해요.',['요셉','마리아','예수'],'look cradle speak smile bless stand',{setting:'chamber',portrayals:{예수:{scale:.5,hideBeard:true,lie:true}}});
chapter=2;
v(1,'박사들이 예루살렘에 도착함','동방에서 온 박사들이 유대 왕의 탄생을 찾아 예루살렘에 들어와요.',['동방 박사들'],'walk walk look halt inspect stand',{setting:'road'});
v(2,'태어난 왕을 찾는 질문','박사들은 별을 본 일과 찾아온 목적을 밝히며 아기를 물어요.',['동방 박사들'],'look point speak listen look stand',{effect:'star-guide'});
v(3,'헤롯의 놀람','새 왕에 관한 소식이 헤롯에게 불안과 충격을 일으켜요.',['헤롯'],'listen startle brace look lower sit',{emotion:'worried',setting:'court'});
v(4,'서기관들에게 묻는 왕','헤롯은 종교 지도자들을 불러 탄생 장소를 알아보려 해요.',['헤롯','대제사장과 서기관'],'signal look speak point listen lower',{setting:'court'});
v(5,'베들레헴이라는 답','지도자들은 예언의 기록을 근거로 베들레헴을 지목해요.',['대제사장과 서기관','헤롯'],'open read point speak lower stand',{prop:'scroll',setting:'court'});
d(6,'작은 마을과 다스릴 분','작은 베들레헴에서 백성을 돌볼 통치자가 나온다는 약속을 보여 줘요.','promise',['베들레헴','다스릴 분','백성을 돌봄']);
v(7,'별이 나타난 때를 캐묻다','헤롯은 박사들을 따로 불러 별을 본 시기를 알아내요.',['헤롯','동방 박사들'],'signal speak point listen inspect lower',{setting:'court',emotion:'worried'});
v(8,'경배하겠다는 거짓말','헤롯은 박사들을 보내면서 찾은 아기의 소식을 돌려달라고 요구해요.',['헤롯','동방 박사들'],'speak point extend listen signal stand',{setting:'court'});
v(9,'별을 따라 집으로','박사들이 떠나자 별이 앞서 인도하고 아기 있는 곳에서 멈춰요.',['동방 박사들'],'look walk look walk halt point',{effect:'star-guide',setting:'road'});
v(10,'별을 다시 본 기쁨','박사들은 길을 알려 주는 별을 보고 크게 기뻐해요.',['동방 박사들'],'look startle smile lift bow stand',{effect:'star-guide',emotion:'joy'});
v(11,'경배하고 예물을 열다','박사들은 집에서 아기께 경배하고 준비한 예물을 내놓아요.',['동방 박사들','마리아','예수'],'walk kneel bow open extend lower',{prop:'gold',setting:'chamber',effect:'gifts',portrayals:{예수:{scale:.5,hideBeard:true,sit:true}}});
v(12,'다른 길로 돌아감','박사들은 꿈의 경고를 받아 헤롯에게 돌아가지 않는 길을 택해요.',['동방 박사들'],'sleep rise look turn walk walk',{setting:'road',effect:'detour'});
v(13,'애굽으로 피하라는 경고','천사가 요셉의 꿈에서 아기를 지킬 피난길을 알려 줘요.',['주의 사자','요셉'],'look speak point signal listen lower',{mode:'vision',setting:'night',support:{actor:'요셉',actions:['sleep','sleep','sleep','sleep','sleep','sleep']}});
v(14,'밤중에 떠난 가족','요셉은 지체하지 않고 마리아와 아기를 데리고 밤에 떠나요.',['요셉','마리아','예수'],'rise gather carry walk walk look',{setting:'night',effect:'journey',portrayals:{예수:{scale:.5,hideBeard:true,sit:true}}});
d(15,'피난과 약속의 연결','애굽 체류를 아들을 불러내신다는 예언과 연결해 설명해요.','map',['유대','애굽','부르심']);
v(16,'분노하여 명령하는 헤롯','헤롯은 속았다는 분노로 아이들을 해치라는 잔혹한 명령을 내려요.',['헤롯'],'listen startle brace point signal lower',{setting:'court',emotion:'angry',effect:'none'});
d(17,'예레미야의 예언을 떠올림','슬픔의 사건을 앞서 기록된 예언에 비추어 설명해요.','promise',['예언의 기록','슬픔의 사건','되새김']);
d(18,'아이들을 잃은 슬픔','라헬의 통곡을 통해 자녀를 잃은 깊은 애통을 전해요.','lament',['자녀를 잃음','통곡','깊은 슬픔']);
v(19,'다시 꿈에 나타난 천사','헤롯이 죽은 뒤 천사가 요셉에게 다시 나타나요.',['주의 사자','요셉'],'look walk speak listen point lower',{mode:'vision',setting:'night',support:{actor:'요셉',actions:['sleep','sleep','sleep','sleep','sleep','sleep']}});
v(20,'돌아가라는 지시','천사는 가족이 이스라엘 땅으로 돌아갈 때가 왔음을 알려요.',['주의 사자','요셉'],'speak point extend signal listen stand',{mode:'vision',setting:'night'});
v(21,'이스라엘로 향하는 가족','요셉은 아기와 마리아를 데리고 돌아가는 길에 올라요.',['요셉','마리아','예수'],'look gather carry walk walk halt',{setting:'road',effect:'journey',portrayals:{예수:{scale:.5,hideBeard:true,sit:true}}});
v(22,'두려움을 안고 갈릴리로','요셉은 아켈라오의 통치를 듣고 두려워하다가 갈릴리로 방향을 바꿔요.',['요셉'],'listen startle lower look turn walk',{setting:'road',emotion:'worried',effect:'detour'});
v(23,'나사렛에 자리 잡음','가족이 나사렛에 정착한 일을 선지자의 말씀과 연결해요.',['요셉','마리아'],'walk halt look extend stand stand',{setting:'courtyard',prop:'house'});
chapter=3;
v(1,'광야에서 외치는 요한','요한이 유대 광야에 나타나 사람들에게 전하기 시작해요.',['세례 요한'],'walk halt look speak point stand',{setting:'desert'});
v(2,'돌이키라는 선포','요한은 하나님 나라가 가까움을 알리며 삶의 방향을 돌리라고 외쳐요.',['세례 요한'],'look lift speak point lower stand',{setting:'desert',emotion:'determined'});
d(3,'준비해야 할 길','요한의 사역을 주님을 맞을 길을 준비하는 목소리로 소개해요.','map',['광야의 외침','길을 준비함','주님을 맞음']);
v(4,'요한의 차림과 음식','검소한 차림과 광야의 음식이 요한의 생활을 드러내요.',['세례 요한'],'look inspect smooth reach eat lower',{setting:'desert',prop:'honey'});
v(5,'요단으로 모이는 사람들','여러 지역에서 사람들이 요한이 있는 곳으로 나와요.',['유대 사람들','세례 요한'],'walk walk look walk halt listen',{setting:'water'});
v(6,'죄를 고백하고 받는 세례','사람들이 자기 죄를 고백하며 요단강에서 세례를 받아요.',['세례 요한','유대 사람들'],'listen reach touch lower look stand',{motif:'baptism',setting:'water',effect:'baptism'});
v(7,'지도자들을 향한 경고','요한은 찾아오는 지도자들에게 피할 길만 구하는 태도를 책망해요.',['세례 요한','바리새인과 사두개인'],'look halt speak point listen lower',{setting:'water',emotion:'determined'});
d(8,'회개가 맺어야 할 열매','마음의 돌이킴이 실제 삶의 변화로 이어져야 한다고 가르쳐요.','growth',['회개','삶의 변화','열매']);
d(9,'혈통만 의지하지 말라','아브라함의 자손이라는 신분을 회개의 대신으로 삼지 말라고 경고해요.','comparison',['혈통 자랑','돌이킴 없음','참된 응답']);
d(10,'뿌리 곁의 도끼','열매 없는 나무의 이미지는 임박한 심판을 설명하는 비유예요.','judgment',['나무의 뿌리','도끼','열매를 살핌'],{prop:'axe'});
v(11,'뒤에 오실 분 앞의 겸손','요한은 자기 사역의 한계를 밝히고 뒤에 오실 분의 크심을 전해요.',['세례 요한'],'speak lower bow point listen stand',{setting:'water'});
d(12,'알곡과 쭉정이','타작의 구분으로 심판과 구원의 엄중함을 설명해요.','separate',['타작 마당','알곡','쭉정이'],{prop:'grain'});
v(13,'예수께서 요단에 오심','예수께서 요한에게 세례를 받으러 갈릴리에서 찾아오세요.',['예수','세례 요한'],'walk walk halt look speak stand',{setting:'water'});
v(14,'말리는 요한','요한은 자신이 오히려 예수께 받아야 한다며 세례를 주저해요.',['세례 요한','예수'],'startle halt retreat speak bow listen',{setting:'water',emotion:'surprised'});
v(15,'예수의 뜻을 받아들임','예수의 설명을 들은 요한이 세례를 베풀기로 받아들여요.',['예수','세례 요한'],'listen speak extend lower look stand',{setting:'water',support:{actor:'세례 요한',actions:['listen','listen','look','bow','stand','stand']}});
v(16,'물에서 올라오시는 예수','세례 뒤 물에서 올라오시는 예수 위로 비둘기 같은 표상이 내려와요.',['예수'],'kneel rise stand look look stand',{setting:'water',effect:'dove-descend'});
v(17,'하늘에서 들리는 인정','하늘의 음성이 예수를 사랑하고 기뻐하는 아들로 알리세요.',['예수'],'look listen stand bow look stand',{setting:'water',effect:'light'});
chapter=4;
v(1,'시험의 광야로','예수께서 광야로 가셔서 시험을 마주하세요.',['예수'],'walk walk halt look stand stand',{setting:'desert'});
v(2,'긴 금식 뒤의 배고픔','긴 금식이 끝난 뒤 예수께서 배고픔을 겪으세요.',['예수'],'stand lower sit brace look stand',{setting:'desert',emotion:'worried'});
v(3,'돌을 떡으로 만들라는 유혹','시험하는 자가 배고픔을 이용해 능력을 쓰라고 요구해요.',['마귀','예수'],'walk speak point extend listen stand',{setting:'desert',prop:'stone'});
v(4,'말씀을 붙드는 대답','예수께서는 생명이 음식만으로 유지되지 않는다는 말씀으로 답하세요.',['예수','마귀'],'listen look speak halt point stand',{setting:'desert'});
v(5,'성전 높은 곳의 시험','시험의 장소가 성전의 높은 곳으로 옮겨져요.',['마귀','예수'],'walk point halt extend look stand',{setting:'temple',prop:'temple'});
v(6,'뛰어내리라는 요구','마귀는 성경을 인용하며 위험한 도약으로 보호를 시험하라고 유혹해요.',['마귀','예수'],'speak open point extend listen lower',{setting:'temple'});
v(7,'시험을 거절하는 대답','예수께서는 하나님을 시험하지 말라는 말씀으로 그 요구를 거절하세요.',['예수','마귀'],'listen halt speak point lower stand',{setting:'temple',emotion:'determined'});
v(8,'높은 산에서 보여 준 나라들','마귀가 세상 권세의 영광을 보이며 예수를 유혹해요.',['마귀','예수'],'walk halt extend point look stand',{setting:'hills',effect:'kingdoms'});
v(9,'경배를 요구하는 거래','마귀는 권세를 미끼로 자신에게 절하라고 요구해요.',['마귀','예수'],'speak point extend wait listen stand',{setting:'hills',effect:'kingdoms'});
v(10,'물러가라는 명령','예수께서는 하나님만 섬겨야 함을 밝히며 사탄을 물리치세요.',['예수','마귀'],'look halt speak point stand stand',{setting:'hills',emotion:'determined'});
v(11,'시험하는 자가 떠남','시험하는 자가 떠나고 예수께 돌봄이 주어져요.',['예수','마귀'],'stand listen lower look stand stand',{setting:'hills',tracks:{마귀:['stand','retreat','turn','walk','walk','walk']},visibility:{마귀:[true,true,true,true,false,false]}});
v(12,'요한의 소식을 듣고 이동함','예수께서 요한의 체포 소식을 듣고 갈릴리로 물러가세요.',['예수'],'listen lower look turn walk walk',{setting:'road'});
v(13,'가버나움으로 옮기심','예수께서 나사렛을 떠나 호숫가 가버나움에 거처를 정하세요.',['예수'],'walk walk look halt extend stand',{setting:'road',prop:'house'});
d(14,'이사야의 약속과 연결됨','갈릴리에서의 사역이 앞선 예언과 이어짐을 밝혀요.','promise',['이사야의 약속','갈릴리 사역','성취']);
d(15,'빛이 비칠 지역','예언이 가리키는 갈릴리와 요단 주변 지역을 짚어요.','map',['스불론 · 납달리','해변 길','갈릴리']);
d(16,'어둠에 비친 빛','어둠 속 백성에게 큰 빛이 비친다는 약속을 보여 줘요.','light',['어둠','비치는 빛','백성에게 소망']);
v(17,'갈릴리에서의 선포','예수께서 돌이킴과 하나님 나라를 선포하며 사역을 시작하세요.',['예수','무리'],'look speak point extend listen stand',{setting:'courtyard'});
v(18,'그물을 던지는 두 형제','예수께서 호숫가에서 일하는 베드로와 안드레를 만나세요.',['베드로','안드레','예수'],'grasp load windup throw pull look',{setting:'water',prop:'net',effect:'cast-net',tracks:{안드레:['grasp','load','windup','throw','pull','look']}});
v(19,'새로운 부르심','예수께서 두 형제에게 따라오라고 부르며 새로운 사명을 알려 주세요.',['예수','베드로','안드레'],'look signal speak extend wait stand',{setting:'water'});
v(20,'그물을 두고 따라감','두 형제가 일하던 그물을 놓아두고 예수의 길을 따르기 시작해요.',['베드로','안드레','예수'],'grasp lower release turn walk walk',{setting:'water',prop:'net',propFixed:true,tracks:{안드레:['grasp','lower','release','turn','walk','walk']}});
v(21,'배에서 그물을 고치던 형제','예수께서 세베대와 일하는 야고보와 요한에게도 부르심을 전하세요.',['야고보','요한','세베대','예수'],'inspect grasp weave weave look listen',{setting:'water',prop:'net',tracks:{요한:['inspect','grasp','weave','weave','look','listen']}});
v(22,'배와 아버지를 두고 출발함','야고보와 요한이 배와 아버지를 떠나 예수를 따르는 길에 올라요.',['야고보','요한','세베대','예수'],'lower release rise turn walk walk',{setting:'water',prop:'boat',tracks:{요한:['lower','release','rise','turn','walk','walk']}});
v(23,'가르침과 치유의 사역','예수의 갈릴리 사역은 가르침과 복음 선포, 병든 사람을 돌보는 일로 펼쳐져요.',['예수','무리'],'walk halt speak extend touch lower',{setting:'courtyard',effect:'heal'});
v(24,'병든 이들을 데려옴','사람들이 여러 고통을 가진 이들을 예수께 데려오고 치유가 이어져요.',['예수','무리'],'look listen reach touch lower inspect',{setting:'courtyard',effect:'heal',tracks:{무리:['walk','walk','sit','sit','rise','stand']}});
v(25,'여러 지역에서 따르는 무리','서로 다른 지역에서 온 많은 사람이 예수의 뒤를 따라요.',['예수','무리'],'look turn walk walk walk halt',{setting:'road',tracks:{무리:['look','turn','walk','walk','walk','halt']}});
chapter=5;
v(1,'산에 앉으신 예수','예수께서 산에 앉으시자 제자들이 가까이 나아와요.',['예수','제자들'],'look walk halt sit listen sit',{setting:'hills'});
v(2,'가르침을 시작함','예수께서 모인 사람들에게 말씀을 풀어 가르치세요.',['예수','제자들'],'sit look speak point listen lower',{setting:'hills',portrayals:{예수:{sit:true}}});
const teaching5=[
[3,'자기 부족을 아는 마음','하나님 앞에서 자기 빈곤을 아는 사람에게 나라의 복을 약속하세요.','promise',['빈 마음','하나님 의지','나라의 복']],
[4,'애통과 위로','슬픔을 품은 사람에게 하나님이 주실 위로를 말씀하세요.','lament',['애통','받을 위로','소망']],
[5,'온유와 기업','온유함은 힘없는 패배가 아니라 하나님이 주실 기업을 기다리는 태도예요.','growth',['온유','기다림','기업']],
[6,'의를 갈망함','의를 음식과 물처럼 간절히 원하는 마음에 채우심을 약속하세요.','gift',['의에 대한 갈망','주림 · 목마름','채우심']],
[7,'긍휼을 베푸는 삶','타인을 불쌍히 여기는 사람에게 긍휼의 복을 말씀하세요.','gift',['이웃의 고통','베푸는 긍휼','받는 긍휼']],
[8,'깨끗한 마음','마음의 깨끗함과 하나님을 뵙는 복을 연결하세요.','light',['깨끗한 마음','밝아짐','하나님을 뵘']],
[9,'화평을 만들어 감','갈등 속에서 평화를 이루는 사람을 하나님의 자녀라 부르세요.','reconcile',['갈등','화평을 이룸','하나님의 자녀']],
[10,'의 때문에 겪는 박해','의를 지키다 받는 박해가 하나님 나라의 복을 빼앗지 못해요.','promise',['의로운 길','박해','나라의 복']],
[11,'예수 때문에 받는 모욕','예수를 따른다는 이유로 거짓 비난을 받을 때의 복을 말씀하세요.','warning',['예수를 따름','거짓 비난','복의 약속']],
[12,'박해 너머의 소망','먼저 고난받은 선지자들처럼 하늘의 상을 바라보라고 격려하세요.','promise',['앞선 선지자들','현재의 고난','하늘의 상']],
[13,'맛을 잃은 소금','제자의 역할을 소금에 비추며 본래의 쓰임을 잃지 말라고 경고하세요.','salt',['소금','맛을 잃음','쓰임을 잃음']],
[14,'숨길 수 없는 빛','산 위 마을처럼 제자의 빛은 세상에서 드러나야 해요.','light',['산 위 마을','드러나는 빛','세상']],
[15,'등불을 놓는 자리','등불은 덮어 두는 대신 높이 놓아 집 안을 비추는 데 쓰여요.','lamp',['덮인 등불','등잔대','집 안의 빛']],
[16,'선행이 향할 영광','선한 행동을 통해 사람들이 하나님께 영광 돌리게 하라고 가르치세요.','light',['선한 행동','사람들이 봄','아버지께 영광']],
[17,'말씀을 완성하러 오심','예수께서는 율법과 선지자의 뜻을 폐기하지 않고 이루세요.','promise',['율법 · 선지자','폐기하지 않음','예수의 성취']],
[18,'작은 획까지의 신실함','말씀의 작은 부분까지 헛되지 않음을 강조하세요.','promise',['작은 획','신실한 말씀','이루어짐']],
[19,'행하며 가르침','작은 계명도 가볍게 버리지 말고 행하면서 가르쳐야 해요.','comparison',['버리고 가르침','행하며 가르침','나라의 평가']],
[20,'겉모양을 넘어서는 의','종교적 겉모양을 넘어서는 참된 의가 필요하다고 가르치세요.','heart',['겉으로 보이는 의','마음의 의','나라의 기준']],
[21,'살인 금지의 계명','살인과 심판에 관한 익숙한 계명을 먼저 상기시키세요.','judgment',['생명을 해침','계명의 금지','심판']],
[22,'분노와 모욕의 무게','분노와 모욕도 형제를 해치는 죄임을 드러내세요.','heart',['분노','모욕','죄의 책임']],
[23,'예배 중 떠오른 갈등','예물을 드리다가 형제에게 잘못한 일이 생각나는 상황을 들어요.','reconcile',['예물','떠오른 원망','멈추어 돌아봄']],
[24,'먼저 화해하라','예물보다 먼저 형제와의 관계를 바로잡으라고 가르치세요.','reconcile',['예물을 둠','형제와 화해','다시 예배']],
[25,'길에서 화해할 기회','다툼이 재판으로 굳어지기 전에 화해할 기회를 붙들라고 해요.','map',['다투는 길','화해의 기회','재판의 위험']],
[26,'남은 책임까지','빚과 감금의 예를 들어 해결되지 않은 책임의 엄중함을 강조하세요.','judgment',['남은 빚','갚을 책임','풀리지 않은 감금']],
[27,'간음 금지의 계명','혼인의 신실함에 관한 계명을 상기시키세요.','promise',['혼인의 약속','신실함','계명의 보호']],
[28,'욕망을 품는 마음','겉으로 드러난 행동뿐 아니라 타인을 탐하는 마음도 다루세요.','heart',['바라보는 눈','품은 욕망','마음의 책임']],
[29,'죄의 통로를 끊는 결단','눈을 버린다는 강한 표현으로 죄를 단호히 끊으라고 가르치세요.','warning',['죄의 통로','단호한 결단','삶을 지킴']],
[30,'행동에서도 끊어 냄','손을 끊는다는 비유도 죄의 행동과 타협하지 말라는 엄중한 권면이에요.','warning',['죄의 행동','타협을 끊음','삶을 지킴']],
[31,'이혼 증서의 관행','당시 이혼 증서를 주는 관행을 먼저 언급하세요.','promise',['혼인','이혼 증서','익숙한 관행']],
[32,'버림받는 배우자의 책임','쉽게 배우자를 버리는 일이 낳는 죄와 책임을 지적하세요.','reconcile',['혼인의 신실함','배우자를 버림','관계의 책임']],
[33,'거짓 맹세를 경계함','맹세를 이용한 거짓과 약속의 파기를 경계하는 계명을 상기시키세요.','promise',['맹세','진실한 약속','지킬 책임']],
[34,'하늘을 담보 삼지 말라','하나님의 보좌인 하늘을 자기 말의 담보처럼 삼지 말라고 하세요.','warning',['하늘','하나님의 권위','맹세의 경계']],
[35,'땅과 성도 내 것이 아님','땅과 예루살렘도 하나님께 속하므로 함부로 맹세에 끌어들이지 못해요.','map',['땅','예루살렘','하나님께 속함']],
[36,'자기 머리로도 맹세하지 말라','머리카락 하나까지 마음대로 못하는 인간의 한계를 드러내세요.','comparison',['자기 머리','통제의 한계','겸손한 말']],
[37,'꾸밈없는 진실한 말','과장된 보증을 더하기보다 말 자체를 진실하게 하라고 가르치세요.','comparison',['그렇다','아니다','진실한 말']],
[38,'동등한 보복의 원칙','보복을 제한하던 익숙한 원칙을 먼저 떠올리게 하세요.','balance',['입은 해','동등한 보상','보복의 한계']],
[39,'모욕을 되갚지 않음','뺨의 예를 통해 모욕을 다시 폭력으로 돌려주지 말라고 하세요.','reconcile',['모욕','보복을 멈춤','다른 응답']],
[40,'겉옷까지 내어 주는 태도','옷을 둘러싼 다툼에서 움켜쥐는 태도를 넘어서는 관대함을 말씀하세요.','gift',['속옷의 다툼','겉옷까지','관대함']],
[41,'억지 동행을 넘어섬','강요된 길에서조차 자발적으로 더 걸어 주는 태도를 가르치세요.','map',['강요된 길','더 걷는 길','자발적 섬김']],
[42,'구하는 이에게 내어 줌','도움과 빌릴 것을 구하는 이에게 마음을 닫지 말라고 하세요.','gift',['도움의 요청','내어 줌','열린 손']],
[43,'이웃과 원수의 경계','사랑할 이웃과 미워할 원수를 나누던 생각을 언급하세요.','comparison',['이웃','원수','사랑의 경계']],
[44,'원수를 위한 기도','사랑을 원수에게까지 넓히고 박해자를 위해 기도하라고 하세요.','reconcile',['원수','사랑','박해자를 위한 기도']],
[45,'가리지 않는 햇빛과 비','햇빛과 비를 두루 주시는 아버지의 선하심을 본받으라고 하세요.','rain',['선한 이 · 악한 이','햇빛과 비','아버지의 선하심']],
[46,'되돌려 받는 사랑을 넘어','나를 사랑하는 사람만 사랑하는 한계를 넘어야 해요.','comparison',['받은 사랑','같은 만큼만','더 넓은 사랑']],
[47,'가까운 사람 밖으로','친한 집단 안에서만 인사하는 태도를 넘어서라고 하세요.','reconcile',['내 편에게만','인사의 경계','밖으로 넓힘']],
[48,'아버지를 닮는 온전함','아버지의 온전한 사랑을 닮아 가라는 권면으로 맺으세요.','growth',['아버지의 사랑','닮아 감','온전함']]
];for(const [n,t,s,k,l]of teaching5)d(n,t,s,k,l);
chapter=6;
const teaching6=[
[1,'경건의 동기를 살핌','선행을 남의 눈에 보이기 위한 공연으로 만들지 말라고 하세요.','heart',['선행','사람의 시선','하나님 앞의 동기']],
[2,'구제를 자랑하지 말라','구제를 칭찬받을 수단으로 삼지 말라는 뜻을 나팔의 비유로 전하세요.','gift',['구제','자랑의 나팔','칭찬을 구함']],
[3,'스스로도 과시하지 않음','선행을 세고 자랑하기보다 조용히 이웃을 도우라고 가르치세요.','gift',['돕는 손','자기 과시를 멈춤','은밀한 나눔']],
[4,'은밀한 구제를 보심','사람이 모르더라도 하나님은 이웃을 돕는 일을 아세요.','gift',['은밀한 구제','아버지의 아심','하나님께 맡김']],
[5,'보여 주기 위한 기도','기도가 사람에게 경건해 보이려는 행동이 되지 않도록 경계하세요.','comparison',['기도','보여 주려는 마음','동기의 점검']],
[6,'문을 닫고 기도함','사람의 시선을 떠나 아버지께 마음을 기울이는 기도를 가르치세요.','door',['골방','닫힌 문','아버지께 기도']],
[7,'말의 양이 기도를 정하지 않음','뜻없이 말을 늘어놓아야 응답받는다고 생각하지 말라고 하세요.','comparison',['말을 늘어놓음','횟수에 의존','참된 간구']],
[8,'구하기 전부터 아심','하나님이 필요를 모르시는 것처럼 기도하지 말라고 가르치세요.','promise',['우리의 필요','아버지의 아심','신뢰하는 기도']],
[9,'아버지의 이름을 높임','기도의 시작을 아버지의 거룩하신 이름에 두게 하세요.','promise',['우리 아버지','거룩한 이름','경외']],
[10,'나라와 뜻을 구함','자기 계획만이 아니라 하나님의 나라와 뜻을 먼저 구하도록 이끄세요.','map',['하나님의 나라','하늘의 뜻','땅에서도 이루어짐']],
[11,'오늘의 양식을 구함','날마다 필요한 양식을 아버지께 의지하며 구하게 하세요.','gift',['오늘','필요한 양식','매일의 의지']],
[12,'용서를 구하는 사람의 용서','죄의 용서를 구하면서 이웃에게도 용서하는 삶을 가르치세요.','reconcile',['내 잘못','용서의 간구','이웃을 용서함']],
[13,'시험과 악에서 지켜 주심','시험에 쓰러지지 않고 악에서 건짐받도록 구하게 하세요.','warning',['시험의 위험','지켜 주심','악에서 건짐']],
[14,'용서와 아버지의 긍휼','다른 사람을 용서하는 삶과 아버지의 용서를 연결해 말씀하세요.','reconcile',['이웃의 잘못','용서','아버지의 긍휼']],
[15,'용서하지 않는 마음의 경고','이웃의 잘못을 붙든 채 용서받기만 원하는 태도를 경고하세요.','heart',['붙든 원한','용서하지 않음','엄중한 경고']],
[16,'금식을 과시하지 않음','금식 중 괴로운 표정을 일부러 드러내 경건을 과시하지 말라고 하세요.','comparison',['금식','과시하는 표정','칭찬의 유혹']],
[17,'평소처럼 단정하게','금식 사실을 자랑하지 않도록 평소의 단정함을 유지하라고 하세요.','gift',['머리에 기름','얼굴을 씻음','평소의 차림']],
[18,'은밀히 드리는 금식','금식도 사람의 시선보다 아버지 앞에서의 진실함을 향해야 해요.','heart',['사람의 시선','은밀한 금식','아버지 앞에서']],
[19,'상하기 쉬운 땅의 보물','재물은 손상과 도둑의 위험을 피할 수 없다고 가르치세요.','treasure',['땅의 보물','손상','도둑의 위험']],
[20,'하늘에 둔 보물','하나님께 속한 가치에 마음을 두라고 가르치세요.','treasure',['하늘의 보물','상하지 않음','하나님께 속한 가치']],
[21,'보물이 끄는 마음','무엇을 보물로 여기는지가 마음의 방향을 드러내요.','heart',['나의 보물','끌리는 마음','마음의 방향']],
[22,'눈과 밝은 몸','눈을 등불에 비추어 삶을 바라보는 관점의 중요성을 가르치세요.','lamp',['성한 눈','몸의 등불','밝음']],
[23,'어두워진 관점','눈이 흐리면 전체가 어두워진다는 비유로 내면을 경고하세요.','light',['흐린 눈','어둠','더 깊은 어둠']],
[24,'두 주인을 섬길 수 없음','하나님과 재물을 같은 자리에 두 주인으로 모실 수 없어요.','separate',['하나님','충성의 선택','재물']],
[25,'생명과 몸을 기억함','먹을 것과 입을 것의 염려보다 생명과 몸의 가치를 먼저 기억하게 하세요.','comparison',['먹고 입을 염려','생명과 몸','더 큰 가치']],
[26,'새를 먹이시는 아버지','새를 돌보시는 아버지께서 사람을 더 귀히 여기심을 생각하게 하세요.','bird',['공중의 새','아버지의 돌보심','귀한 사람']],
[27,'염려의 한계','걱정만으로 삶을 늘리거나 바꿀 수 없음을 깨닫게 하세요.','comparison',['염려','인간의 한계','의지할 분']],
[28,'백합의 성장을 봄','들꽃이 자라는 모습을 통해 의복의 염려를 돌아보게 하세요.','growth',['들의 백합','자라남','의복의 염려']],
[29,'솔로몬의 옷보다','솔로몬의 화려한 차림도 꽃의 아름다움에 못 미친다고 하세요.','comparison',['왕의 화려함','한 송이 꽃','주신 아름다움']],
[30,'들풀도 입히심','잠시 사는 풀을 입히시는 하나님께 사람을 맡기라고 권하세요.','growth',['잠깐의 들풀','입히시는 하나님','더 귀한 사람']],
[31,'염려의 질문을 멈춤','먹고 마시고 입는 문제만 되뇌는 염려에 붙들리지 말라고 하세요.','heart',['먹을 것','마실 것 · 입을 것','염려를 내려놓음']],
[32,'필요를 아시는 아버지','필요를 아시는 아버지께 속한 사람답게 신뢰하라고 하세요.','promise',['우리에게 필요한 것','아버지의 아심','신뢰']],
[33,'먼저 구할 것','나라와 의를 먼저 구하며 다른 필요를 아버지께 맡기라고 하세요.','map',['먼저 구함','하나님 나라와 의','필요를 맡김']],
[34,'오늘을 살아감','내일의 짐까지 오늘 미리 짊어지지 말라고 가르치세요.','map',['오늘의 몫','내일의 염려','오늘을 살아감']]
];for(const [n,t,s,k,l]of teaching6)d(n,t,s,k,l);
chapter=7;
const teaching7=[
[1,'남을 정죄하지 말라','다른 이를 함부로 죄인으로 단정하는 태도를 경계하세요.','judgment',['이웃','함부로 정죄함','판단을 멈춤']],
[2,'내 기준이 나에게도','남에게 들이대는 잣대가 자신에게도 적용됨을 기억하게 하세요.','balance',['남에게 댄 잣대','같은 기준','나에게 돌아옴']],
[3,'티와 들보의 차이','남의 작은 허물보다 자기 큰 허물을 보지 못하는 모습을 드러내세요.','comparison',['형제의 작은 티','내 큰 들보','보지 못함']],
[4,'가려진 눈으로 도우려 함','자기 문제를 보지 못하면서 남을 고쳐 주겠다는 태도를 경고하세요.','comparison',['내 눈의 들보','남을 고치려 함','먼저 돌아봄']],
[5,'먼저 자신의 들보를 뺌','자신의 허물을 먼저 바로잡아야 형제를 제대로 도울 수 있어요.','reconcile',['자기 허물을 봄','먼저 바로잡음','형제를 도움']],
[6,'귀한 것을 분별해 대함','귀한 것을 짓밟는 이 앞에서 분별 없이 내어 놓지 말라고 가르치세요.','treasure',['거룩한 것 · 진주','짓밟음의 위험','분별']],
[7,'구하고 찾고 두드림','아버지께 끈기 있게 구하며 나아가도록 격려하세요.','door',['구함','찾음','문을 두드림']],
[8,'열리는 문','구하는 이의 간구를 아버지께서 외면하지 않으심을 약속하세요.','door',['간구하는 이','응답의 약속','열린 문']],
[9,'떡 대신 돌을 주지 않음','자녀의 양식 요청에 해로운 것을 주지 않는 부모의 예를 드세요.','gift',['아이가 구한 떡','돌이 아닌 양식','부모의 돌봄']],
[10,'생선 대신 뱀을 주지 않음','자녀의 필요에 해를 끼치는 것으로 답하지 않는 부모의 마음을 들어요.','gift',['아이가 구한 생선','뱀이 아님','좋은 것을 줌']],
[11,'더 좋은 아버지의 선물','불완전한 부모보다 아버지께서 더 선하게 응답하심을 가르치세요.','gift',['부모의 좋은 선물','하늘 아버지','더 선한 응답']],
[12,'먼저 그렇게 대하라','내가 바라는 대접을 다른 사람에게 먼저 실천하라고 하세요.','reconcile',['바라는 대접','내가 먼저 행함','이웃에게']],
[13,'넓은 길의 위험','사람이 많이 간다는 이유만으로 길을 선택하지 말라고 경고하세요.','door',['큰 문','넓은 길','멸망의 위험']],
[14,'생명으로 향하는 좁은 길','적은 사람이 찾더라도 생명에 이르는 길을 택하라고 하세요.','door',['좁은 문','어려운 길','생명']],
[15,'겉모습을 경계함','선한 겉모습 속에 해치려는 속셈이 숨을 수 있다고 경고하세요.','veil',['양의 겉모습','숨은 이리','거짓 선지자']],
[16,'열매로 분별함','말과 겉모양보다 삶이 맺는 결과를 보고 분별하라고 하세요.','growth',['가시나무','포도를 못 맺음','열매로 분별']],
[17,'나무와 열매의 관계','나무의 성질이 열매로 드러난다는 비유로 삶을 돌아보게 하세요.','growth',['좋은 나무','좋은 열매','나쁜 나무의 열매']],
[18,'본질이 드러나는 결과','겉을 꾸며도 속의 성질과 삶의 열매는 무관하지 않아요.','comparison',['나무의 본질','맺는 열매','일치하는 결과']],
[19,'열매 없는 나무의 끝','좋은 열매를 맺지 못하는 삶에 대한 심판을 경고하세요.','judgment',['열매 없는 나무','잘려짐','심판']],
[20,'분별의 결론','그들이 맺는 열매가 어떤 사람인지를 드러낸다고 정리하세요.','growth',['삶의 열매','드러나는 본질','분별']],
[21,'말보다 아버지의 뜻을 행함','주님을 부르는 말과 실제 순종을 구별하세요.','comparison',['입술의 고백','아버지의 뜻','행하는 삶']],
[22,'능력을 내세우는 주장','놀라운 활동을 했다는 자기 주장이 참된 관계를 대신하지 못해요.','warning',['드러난 활동','스스로 내세움','관계의 점검']],
[23,'불법에 대한 거절','외적 활동 뒤의 불순종을 주께서 엄중히 거절하심을 전하세요.','judgment',['불법의 삶','주님의 판단','거절']],
[24,'반석 위의 집','듣고 실천하는 삶을 튼튼한 기초 위에 집을 짓는 모습으로 설명하세요.','house',['말씀을 듣고 행함','반석','세워진 집']],
[25,'폭풍에도 선 집','흔들리는 상황에서도 반석 위의 집은 무너지지 않는다고 하세요.','house-storm',['비 · 바람 · 물','반석의 기초','견딘 집']],
[26,'모래 위의 집','듣기만 하고 실천하지 않는 삶을 약한 기초에 집을 짓는 데 비유하세요.','house',['말씀을 듣기만 함','모래','불안한 집']],
[27,'무너진 집','기초 없는 집은 폭풍을 만나 크게 무너져요.','house-fall',['비 · 바람 · 물','모래의 기초','무너짐']]
];for(const [n,t,s,k,l]of teaching7)d(n,t,s,k,l);
v(28,'가르침을 듣고 놀라는 무리','예수의 가르침을 마치자 듣던 사람들이 그 말씀에 놀라요.',['무리','예수'],'listen look startle listen look stand',{setting:'hills',emotion:'surprised'});
v(29,'권위 있는 가르침','사람들은 익숙한 서기관들의 방식과 다른 예수의 권위를 느껴요.',['무리','예수'],'listen look bow listen lower stand',{setting:'hills'});
chapter=8;
v(1,'산에서 내려오는 예수와 무리','예수께서 가르침을 마치고 내려오실 때 많은 사람이 뒤따라요.',['예수','무리'],'stand look walk walk walk halt',{setting:'hills',tracks:{무리:['stand','look','walk','walk','walk','halt']},directions:{예수:'right',무리:'right'}});
v(2,'나병환자가 엎드려 청함','나병환자가 예수의 뜻과 능력을 의지해 깨끗해지기를 구해요.',['나병환자','예수'],'walk halt kneel bow speak listen',{setting:'road'});
v(3,'손을 대어 깨끗하게 함','예수께서 손을 대시자 나병환자가 즉시 깨끗해져요.',['예수','나병환자'],'look extend touch hold lower inspect',{setting:'road',motif:'heal-rise',effect:'heal',tracks:{나병환자:['kneel','kneel','look','rise','stand','stand']}});
v(4,'제사장에게 보이라는 지시','예수께서는 나은 몸을 제사장에게 보이고 정한 예물을 드리라고 하세요.',['예수','나병환자'],'speak halt point extend listen lower',{setting:'road'});
v(5,'도움을 청하는 백부장','가버나움에서 백부장이 예수께 다가와 간청해요.',['백부장','예수'],'walk halt bow speak extend listen',{setting:'courtyard'});
v(6,'집에 있는 종의 고통을 전함','백부장은 다른 곳에 누운 종의 심한 고통을 예수께 알리고 있어요.',['백부장','예수','백부장의 종'],'speak point lower speak listen stand',{setting:'chamber',prop:'bed',effect:'remote-room',propAt:{x:555,y:235},tracks:{'백부장의 종':['lie','lie','lie','lie','lie','lie']},placements:{백부장:{x:180,y:235},예수:{x:310,y:235},'백부장의 종':{x:555,y:235}}});
v(7,'가서 고치겠다는 응답','예수께서 백부장의 요청에 응답해 종을 고치러 가겠다고 하세요.',['예수','백부장'],'listen speak extend point lower stand',{setting:'courtyard'});
v(8,'말씀의 권위를 신뢰함','백부장은 예수의 방문 없이도 말씀만으로 종이 나을 것을 믿어요.',['백부장','예수'],'bow speak lower look listen stand',{setting:'courtyard'});
d(9,'명령에 따르는 권위','백부장은 군대에서 아는 명령의 질서를 예수의 권위에 비추어요.','map',['명령의 권위','가고 오는 부하','말씀을 신뢰함']);
v(10,'믿음을 보시고 놀라심','예수께서 백부장의 믿음을 놀랍게 여기며 따르던 이들에게 말씀하세요.',['예수','백부장'],'listen startle look speak point stand',{setting:'courtyard',emotion:'surprised'});
d(11,'여러 곳에서 올 백성','먼 곳에서 온 이들도 하나님 나라의 잔치에 함께할 것을 말씀하세요.','gift',['동쪽과 서쪽','약속의 백성','함께하는 잔치']);
d(12,'혈통의 안전을 경고함','본래 자손이라는 신분만 믿는 태도에는 엄중한 배제의 경고가 있어요.','judgment',['당연한 자격이라 여김','나라 밖의 어둠','엄중한 경고']);
v(13,'다른 곳의 종이 나음','예수께서 백부장을 보내실 때 집에 있던 종도 즉시 나아요.',['예수','백부장','백부장의 종'],'speak extend point lower stand stand',{setting:'chamber',prop:'bed',propAt:{x:555,y:235},effect:'remote-room',tracks:{'백부장의 종':['lie','lie','rise','sit','sit','sit']},placements:{예수:{x:180,y:235},백부장:{x:310,y:235},'백부장의 종':{x:555,y:235}}});
v(14,'열병으로 누운 장모','예수께서 베드로의 집에서 열병으로 누운 장모를 보세요.',['예수','베드로의 장모'],'walk halt look inspect listen lower',{setting:'chamber',prop:'bed',tracks:{'베드로의 장모':['lie','lie','lie','lie','lie','lie']}});
v(15,'손을 만지자 일어나 섬김','예수께서 손을 만지시자 열이 떠나고 장모가 일어나 대접해요.',['예수','베드로의 장모'],'look extend touch hold lower inspect',{setting:'chamber',prop:'bed',placements:{예수:{x:300,y:235},'베드로의 장모':{x:370,y:235}},tracks:{'베드로의 장모':['lie','lie','rise','stand','extend','stand']},effect:'heal'});
v(16,'저녁에 모인 병든 이들','해 질 무렵 사람들이 병든 이들을 데려오고 예수께서 고치세요.',['예수','무리'],'look listen speak extend touch lower',{setting:'night',effect:'heal',tracks:{무리:['walk','walk','sit','sit','rise','stand']}});
d(17,'연약함을 담당하심','치유의 사역을 이사야가 전한 연약함을 짊어지시는 분의 약속과 연결해요.','promise',['백성의 연약함','짊어지시는 분','이루어진 약속']);
v(18,'건너편으로 가라는 지시','무리가 둘러싸자 예수께서 제자들에게 건너편으로 가자고 하세요.',['예수','제자들'],'look turn speak point signal stand',{setting:'water',prop:'boat'});
v(19,'어디든 따르겠다는 말','서기관 한 사람이 예수께 다가와 따라가겠다는 뜻을 밝혀요.',['서기관','예수'],'walk halt bow speak extend listen',{setting:'water'});
d(20,'안락함이 보장되지 않는 길','따름의 길에 편안한 거처가 약속된 것은 아니라고 설명하세요.','comparison',['동물의 거처','인자의 고단함','따름의 각오']);
v(21,'먼저 장례를 허락해 달라는 청','한 제자가 아버지의 장례를 먼저 치르게 해 달라고 구해요.',['제자들','예수'],'look bow speak extend listen lower',{setting:'road'});
v(22,'지금 따르라는 부르심','예수께서는 하나님 나라의 부르심에 우선하여 응답하라고 하세요.',['예수','제자들'],'listen speak signal point stand stand',{setting:'road'});
v(23,'예수와 제자들이 배에 오름','예수께서 배를 타시자 제자들도 함께 타요.',['예수','제자들'],'walk halt sit look stand sit',{setting:'water',prop:'boat',motif:'calm-sea',effect:'none',tracks:{제자들:['walk','halt','sit','look','stand','sit']}});
v(24,'풍랑 속에서 주무심','파도가 배를 덮는 동안에도 예수께서는 잠들어 계세요.',['예수','제자들'],'sleep sleep sleep sleep sleep sleep',{setting:'water',prop:'boat',motif:'calm-sea',effect:'storm',tracks:{제자들:['look','startle','brace','brace','brace','look']}});
v(25,'제자들이 예수를 깨움','위기에 빠진 제자들이 예수께 다가가 깨우며 구원을 구해요.',['제자들','예수'],'look startle reach touch speak extend',{setting:'water',prop:'boat',motif:'calm-sea',effect:'storm',tracks:{예수:['sleep','sleep','rise','sit','look','stand']}});
v(26,'일어나 바람과 물결을 꾸짖음','예수께서 일어나 명하시자 거센 바람과 바다가 잠잠해져요.',['예수','제자들'],'rise look speak halt stand stand',{setting:'water',prop:'boat',motif:'calm-sea',effect:'storm-calm',tracks:{제자들:['brace','brace','look','look','stand','stand']}});
v(27,'바다도 순종함에 놀람','제자들은 자연이 예수께 순종하는 것을 보고 놀라 물어요.',['제자들','예수'],'look startle turn speak look stand',{setting:'water',prop:'boat',motif:'calm-sea',emotion:'surprised'});
v(28,'무덤에서 나온 두 사람','가다라에서 귀신 들린 두 사람이 무덤 사이에서 나와 예수와 마주쳐요.',['귀신 들린 두 사람','예수'],'walk brace halt look speak stand',{setting:'road',prop:'tomb',portrayals:{'귀신 들린 두 사람':{copies:2}}});
v(29,'예수께 소리치는 이들','그들은 예수를 하나님의 아들로 부르며 심판을 두려워해요.',['귀신 들린 두 사람','예수'],'startle brace speak retreat look stand',{setting:'road',emotion:'worried',portrayals:{'귀신 들린 두 사람':{copies:2}}});
d(30,'멀리서 먹는 돼지 떼','사건의 현장에서 떨어진 곳에 돼지들이 먹이를 먹고 있어요.','herd',['멀리 있는 돼지 떼','먹이를 먹음','이어질 사건']);
v(31,'돼지 떼로 보내 달라는 간청','귀신들이 쫓겨날 것을 알고 돼지 떼로 가게 해 달라고 간청해요.',['귀신 들린 두 사람','예수'],'brace lower speak extend listen stand',{setting:'road',portrayals:{'귀신 들린 두 사람':{copies:2}}});
d(32,'비탈 아래 물로 달리는 떼','귀신이 떠난 뒤 돼지 떼가 비탈을 달려 물로 들어가 죽는 결과가 이어져요.','herd-water',['내려가는 비탈','물로 달리는 떼','물에 잠김']);
v(33,'마을로 달려가 전하는 이들','돼지를 치던 이들이 달아나 마을에서 일어난 일을 전해요.',['돼지 치던 사람들'],'startle turn run run speak point',{setting:'road',directions:{'돼지 치던 사람들':'right'}});
v(34,'떠나 달라는 마을 사람들','마을 사람들이 예수를 만나 자기 지역을 떠나 달라고 간청해요.',['무리','예수'],'walk halt bow speak point listen',{setting:'road'});
chapter=9;
v(1,'배를 타고 돌아옴','예수께서 배를 타고 호수 건너 사역하던 동네로 돌아오세요.',['예수'],'walk sit row row rise stand',{setting:'water',prop:'boat',motif:'calm-sea'});
v(2,'누운 병자에게 용서를 선언함','사람들이 데려온 중풍병자에게 예수께서 먼저 죄의 용서를 말씀하세요.',['예수','중풍병자'],'look listen speak extend lower stand',{setting:'chamber',prop:'mat',tracks:{중풍병자:['lie','lie','lie','lie','lie','lie']}});
v(3,'속으로 반발하는 서기관들','서기관들이 죄 사함의 선언을 듣고 마음속으로 반발해요.',['서기관들'],'listen startle lower turn look stand',{setting:'chamber',emotion:'worried'});
v(4,'그 생각을 드러내 물으심','예수께서 그들의 마음속 생각을 짚어 질문하세요.',['예수','서기관들'],'look speak point listen lower stand',{setting:'chamber'});
d(5,'보이지 않는 용서와 보이는 치유','용서의 선언과 일어나 걸으라는 명령을 대조해 권위를 드러내세요.','comparison',['죄 사함의 선언','일어나라는 명령','드러날 권위']);
v(6,'침상을 들고 가라는 명령','예수께서 죄 사함의 권세를 밝히시며 병자에게 일어나 돌아가라 명하세요.',['예수','중풍병자'],'speak point extend signal lower stand',{setting:'chamber',prop:'mat',tracks:{중풍병자:['lie','lie','look','sit','rise','stand']}});
v(7,'일어나 집으로 감','중풍병자였던 사람이 일어나 자기 집으로 걸어가요.',['중풍병자'],'rise stand reach carry walk walk',{setting:'road',prop:'mat',propPortable:true,held:[false,false,false,true,true,true],directions:{중풍병자:'right'}});
v(8,'두려움과 찬양','무리는 눈앞의 권능을 보고 경외하며 하나님께 영광 돌려요.',['무리'],'look startle lower lift bow stand',{setting:'courtyard',emotion:'surprised'});
v(9,'세관에서 일어난 마태','예수께서 부르시자 세관에 있던 마태가 일어나 따라요.',['예수','마태'],'walk halt speak signal turn walk',{setting:'courtyard',prop:'table',tracks:{마태:['sit','sit','look','rise','turn','walk']},directions:{예수:'right',마태:'right'}});
v(10,'함께 앉은 식탁','마태의 집에서 세리와 죄인들이 예수와 제자들의 식탁에 함께해요.',['예수','마태','제자들'],'sit look reach eat lower sit',{setting:'chamber',prop:'table',propAt:{x:405,y:235},propScale:2,placements:{예수:{x:330,y:235},마태:{x:405,y:235},제자들:{x:480,y:235}},props:[{kind:'bread',x:385,y:214},{kind:'cup',x:425,y:214}],tracks:{마태:['sit','look','reach','eat','lower','sit'],제자들:['sit','look','reach','eat','lower','sit']},portrayals:{예수:{sit:true},마태:{sit:true},제자들:{sit:true}}});
v(11,'식탁을 두고 따지는 바리새인','바리새인들이 제자들에게 예수의 식탁 교제를 문제 삼아요.',['바리새인','제자들'],'look point speak listen lower stand',{setting:'chamber'});
d(12,'병든 사람에게 필요한 의사','예수께서는 병든 이에게 의사가 필요하다는 비유로 사역을 설명하세요.','gift',['병든 사람','필요한 의사','찾아오신 돌봄']);
d(13,'긍휼을 바라시는 뜻','예수께서는 자비의 뜻을 배우라며 죄인을 부르러 오셨다고 설명하세요.','reconcile',['형식의 제사','하나님의 긍휼','죄인을 부르심']);
v(14,'금식에 관한 질문','요한의 제자들이 자신들과 다른 예수의 제자들의 금식 관행을 물어요.',['요한의 제자들','예수'],'walk halt speak point listen lower',{setting:'courtyard'});
d(15,'신랑이 함께 있는 때','신랑과 함께하는 기쁨의 때와 그를 잃은 뒤의 금식을 구별하세요.','comparison',['함께 있는 신랑','지금의 기쁨','빼앗길 때의 금식']);
d(16,'새 천과 낡은 옷','수축하는 새 천이 낡은 옷을 더 찢는 모습을 비유로 드세요.','cloth-patch',['낡은 옷','새 천의 조각','더 벌어진 틈']);
d(17,'새 포도주와 부대','새 포도주와 낡은 부대의 부조화로 새 부대의 필요를 설명하세요.','wineskin',['새 포도주','낡은 부대의 터짐','새 부대에 담음']);
v(18,'딸을 살려 달라는 간청','관리가 엎드려 죽은 딸에게 와서 손을 얹어 달라고 간청해요.',['관리','예수'],'walk kneel bow speak extend listen',{setting:'road',emotion:'worried'});
v(19,'관리의 뒤를 따라 출발함','예수와 제자들이 일어나 관리의 집으로 함께 가요.',['관리','예수','제자들'],'look turn walk walk walk halt',{setting:'road',tracks:{예수:['rise','turn','walk','walk','walk','halt'],제자들:['rise','turn','walk','walk','walk','halt']},directions:{관리:'right',예수:'right',제자들:'right'}});
v(20,'뒤에서 옷자락을 만짐','오래 앓던 여인이 예수의 뒤로 다가가 겉옷 가장자리를 만져요.',['혈루증 여인','예수'],'walk crouch reach touch hold lower',{setting:'road',motif:'touch-cloak',effect:'garment-touch',placements:{'혈루증 여인':{x:330,y:235},예수:{x:395,y:235}},directions:{'혈루증 여인':'right',예수:'right'}});
v(21,'여인이 품은 믿음','여인은 옷에 손을 대기만 해도 나을 수 있다고 마음에 믿고 있어요.',['혈루증 여인'],'look lower reach look kneel stand',{setting:'road',emotion:'worried'});
v(22,'돌아보시며 안심시키심','예수께서 돌아보며 안심시키시자 여인의 치유가 드러나요.',['예수','혈루증 여인'],'turn look speak extend lower stand',{setting:'road',effect:'heal',tracks:{'혈루증 여인':['kneel','look','listen','rise','stand','stand']}});
v(23,'장례의 소리가 있는 집','예수께서 관리의 집에서 피리 소리와 소란스러운 애도를 만나세요.',['예수','피리 부는 사람들'],'walk halt look listen lower stand',{setting:'chamber',prop:'flute',tracks:{'피리 부는 사람들':['grasp','lift','blow','hold','lower','stand']}});
v(24,'물러가라는 말씀과 비웃음','예수의 말씀에 집 안 사람들이 믿지 못하고 비웃어요.',['예수','무리'],'look halt speak point listen lower',{setting:'chamber',tracks:{무리:['listen','look','turn','smile','look','stand']}});
v(25,'소녀의 손을 잡아 일으킴','예수께서 사람들을 내보낸 뒤 소녀의 손을 잡으시자 소녀가 일어나요.',['예수','관리의 딸'],'walk look reach grasp lift lower',{setting:'chamber',prop:'bed',motif:'raise-dead',effect:'rise',portrayals:{'관리의 딸':{scale:.7,hideBeard:true}}});
d(26,'퍼져 나가는 소식','소녀가 살아난 소식이 주변 지역으로 퍼져요.','map',['관리의 집','이웃의 소식','온 지역으로']);
v(27,'따라오며 부르는 두 맹인','보지 못하는 두 사람이 예수의 뒤를 따라오며 자비를 구해요.',['두 맹인','예수'],'walk walk speak extend listen stand',{setting:'road',portrayals:{'두 맹인':{copies:2}}});
v(28,'치유를 믿느냐는 질문','집 안에서 예수께서 믿음을 물으시고 두 사람이 믿는다고 답해요.',['예수','두 맹인'],'look speak point listen lower stand',{setting:'chamber',portrayals:{'두 맹인':{copies:2}}});
v(29,'눈에 손을 대심','예수께서 두 사람의 눈에 손을 대며 믿음대로 이루어지라 말씀하세요.',['예수','두 맹인'],'look reach lift touch lower stand',{setting:'chamber',placements:{예수:{x:300,y:235},'두 맹인':{x:395,y:235}},effect:'heal',portrayals:{'두 맹인':{copies:2}}});
v(30,'열린 눈과 엄중한 당부','눈이 밝아진 뒤 예수께서 일을 함부로 알리지 말라고 당부하세요.',['예수','두 맹인'],'look speak halt point lower stand',{setting:'chamber',portrayals:{'두 맹인':{copies:2}}});
v(31,'사방에 알리는 두 사람','두 사람은 나가서 예수에 관한 소식을 널리 전해요.',['두 맹인'],'walk look speak point walk stand',{setting:'road',portrayals:{'두 맹인':{copies:2}}});
v(32,'말 못하는 사람을 데려옴','사람들이 귀신 들려 말을 못하는 이를 예수께 데려와요.',['말 못하는 사람','예수'],'walk halt lower look stand stand',{setting:'courtyard'});
v(33,'말하게 된 사람','귀신이 떠난 뒤 말 못하던 사람이 말하고 무리가 놀라요.',['예수','말 못하는 사람','무리'],'look speak halt lower look stand',{setting:'courtyard',effect:'heal',tracks:{'말 못하는 사람':['stand','look','startle','speak','speak','stand'],무리:['listen','look','startle','listen','look','stand']}});
v(34,'치유를 왜곡하는 주장','바리새인들이 예수의 능력을 귀신의 우두머리와 연결해 비난해요.',['바리새인'],'look turn speak point listen lower',{setting:'courtyard'});
v(35,'여러 마을을 돌보시는 예수','예수께서 여러 마을을 다니며 가르치고 전파하고 치유하세요.',['예수','무리'],'walk halt speak extend touch stand',{setting:'road',effect:'heal'});
v(36,'지친 무리를 불쌍히 여기심','예수께서 목자 없는 양처럼 지친 사람들을 긍휼히 여기세요.',['예수','무리'],'look listen lower reach extend stand',{setting:'road',emotion:'gentle',tracks:{무리:['walk','lower','sit','lower','look','stand']}});
d(37,'많은 추수와 적은 일꾼','예수께서 사역의 필요를 추수와 일꾼의 비유로 설명하세요.','growth',['많은 곡식','적은 일꾼','사역의 필요']);
v(38,'일꾼을 보내 달라는 기도','예수께서 추수의 주인께 일꾼을 보내 달라고 기도하라 가르치세요.',['예수','제자들'],'look speak point lift listen lower',{setting:'pasture'});
export const additionalPeople={8:[{name:'무리',role:'예수를 따르거나 병든 이들을 데려온 사람들',refs:['마태복음 8:1','마태복음 8:16','마태복음 8:34']},{name:'백부장의 종',role:'집에서 중풍병으로 고통받다가 나은 종',refs:['마태복음 8:6','마태복음 8:13']},{name:'돼지 치던 사람들',role:'사건을 보고 마을에 알린 사람들',refs:['마태복음 8:33']}],9:[{name:'서기관들',role:'죄 사함의 말씀에 속으로 반발한 이들',refs:['마태복음 9:3']},{name:'무리',role:'예수의 권능을 보고 놀란 사람들',refs:['마태복음 9:8','마태복음 9:33']},{name:'요한의 제자들',role:'금식의 이유를 물으러 온 이들',refs:['마태복음 9:14']},{name:'피리 부는 사람들',role:'관리의 집에서 장례의 피리를 불던 이들',refs:['마태복음 9:23']},{name:'말 못하는 사람',role:'귀신이 떠난 뒤 말하게 된 사람',refs:['마태복음 9:32','마태복음 9:33']}]};
