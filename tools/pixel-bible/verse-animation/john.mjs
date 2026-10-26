export const chapters={},additionalPeople={};
const fix={call:'signal',shine:'light',witness:'look',fill:'pour',overturn:'push',rejoice:'smile',approach:'walk',question:'speak',answer:'speak',invite:'reach',recognize:'look',raise:'lift',heal:'touch',teach:'speak',follow:'walk',gather:'gather',return:'walk',report:'speak',send:'release',prepare:'place',enter:'walk',appear:'look',believe:'bow',testify:'speak',baptize:'pour',depart:'walk',celebrate:'smile',serve:'extend',cleanse:'wash',wash:'smooth',drive:'push',sell:'release',exchange:'turn',remember:'look',rebuke:'point',seek:'inspect',find:'look',come:'walk',draw:'scoop',drink:'pour',give:'release',feed:'share',cross:'walk',lift:'raise',receive:'take',speak:'speak',listen:'listen',look:'look',touch:'touch',walk:'walk',wait:'wait',stand:'stand',sit:'sit',rise:'rise',turn:'turn',point:'point',reach:'reach',hold:'hold',place:'place',carry:'carry',bless:'bless',bow:'bow',kneel:'kneel',pray:'pray',read:'read',write:'write',eat:'eat',sleep:'sleep',fall:'fall',open:'open',hide:'hide',signal:'signal',lower:'lower',pour:'pour',strike:'strike',release:'release',startle:'startle',retreat:'retreat',run:'run',inspect:'inspect',brace:'brace',remove:'remove-shoe',gather:'gather',share:'share',break:'break-bread',climb:'step',light:'light',sweep:'smooth',ask:'speak',come:'walk',remain:'wait',reveal:'open',proclaim:'speak',witness:'look',test:'inspect',marvel:'startle',go:'walk',follow:'walk',beloved:'bless',deny:'turn',teach:'speak',know:'look',receive:'take',see:'look',drink:'pour',save:'lift',sacrifice:'release',lift:'lift',scatter:'scatter',rise:'rise',carry:'carry',greet:'bless',prophesy:'speak',seek:'inspect',bring:'carry',restore:'heal'};
const propFix={light:'lamp',fig:'scene-marker',jar:'water',whip:'staff',temple:'scroll',stone:'stone',water:'water',wine:'wine',bread:'bread',fig:'fig-tree',sheep:'sheep',lamb:'sheep',fish:'fish',coin:'coin',cross:'cross',tomb:'tomb',scroll:'scroll',table:'table',well:'well',boat:'boat',staff:'staff',robe:'robe',house:'house',basket:'basket',lamp:'lamp',door:'gate',field:'field',vine:'vine',net:'net',hand:'scene-marker'};
const add=(chapter,rows,ranges,extras=[],effects={})=>{additionalPeople[chapter]=extras.map(name=>({name,role:`요한복음 ${chapter}장 관련 인물`,refs:[`요한복음 ${chapter}장`]}));chapters[chapter]=[];for(const [i,line]of rows.trim().split('\n').entries()){const [title,study]=line.split('|'),verse=i+1,g=ranges.find(x=>verse>=x.from&&verse<=x.to),actions=g.actions.map(a=>fix[a]||a),scene={verse,title,study,actors:g.actors,actions,setting:g.setting,prop:propFix[g.prop]||g.prop};scene.tracks=Object.fromEntries(g.actors.slice(1).map((n,j)=>[n,j%2?['look','listen','turn','reach','receive','stand']:['look','listen','bow','reach','hold','stand']]));if(effects[verse])scene.effect=effects[verse];chapters[chapter].push(scene)}};
add(1,`
태초부터 계신 말씀|말씀은 태초부터 계셨고 하나님과 함께 계셨어요.
하나님이신 말씀|말씀은 하나님이셨다고 요한이 증언해요.
만물이 말씀으로 지어짐|만물이 말씀으로 생겨났고 말씀 없이 된 것은 없어요.
말씀 안의 생명과 빛|말씀 안에 생명이 있고 그 생명은 사람들의 빛이에요.
어둠에 비치는 빛|빛이 어둠 속에서 비치지만 어둠은 이기지 못해요.
하나님께 보내심을 받은 사람|하나님께서 요한을 보내 빛을 증언하게 하세요.
빛을 믿게 하려는 증언|요한은 빛이 아니고 빛을 증언하러 온 사람이에요.
세상에 오는 참빛|모든 사람을 비추는 참빛이 세상에 오세요.
세상에 오시는 참빛|모든 사람을 비추는 참빛이 세상에 오세요.
세상에 계셨던 창조주|세상은 말씀으로 지어졌지만 세상은 그를 알지 못했어요.
자기 백성의 거절|말씀이 자기 땅에 오셨으나 자기 백성이 영접하지 않았어요.
하나님의 자녀가 되는 권세|영접하고 믿는 이들에게 하나님의 자녀가 되는 권세를 주세요.
혈통이 아닌 하나님께로 난 사람|하나님의 자녀는 혈통이나 사람의 뜻이 아니라 하나님께로부터 나요.
육신이 되어 우리 가운데 오신 말씀|말씀이 육신이 되어 우리 가운데 거하시고 영광을 보여 주세요.
은혜와 진리가 충만한 영광|독생자의 영광에는 은혜와 진리가 가득해요.
요한의 증언|요한은 자신보다 뒤에 오신 분이 먼저 계셨다고 증언해요.
은혜 위에 더해지는 은혜|율법은 모세로 말미암고 은혜와 진리는 예수 그리스도로 말미암아요.
하나님을 드러내신 독생자|아버지 품에 계신 독생자가 하나님을 알려 주세요.
제사장들이 요한에게 묻다|예루살렘에서 제사장과 레위인들이 요한에게 정체를 물어요.
그리스도가 아니라고 답함|요한은 자신이 그리스도가 아니라고 분명히 말해요.
엘리야냐는 질문|그들이 요한에게 엘리야냐고 물어요.
선지자냐는 질문|사람들이 네가 그 선지자냐고 물어요.
광야에서 외치는 소리|요한은 이사야의 말처럼 주의 길을 곧게 하라고 외치는 소리라고 답해요.
세례를 따지는 바리새인들|바리새인들이 그리스도도 엘리야도 선지자도 아니라면 왜 세례를 주느냐고 물어요.
물로 세례를 베푸는 요한|요한은 자신이 물로 세례를 베푼다고 답해요.
너희 가운데 서 계신 분|요한은 자기 뒤에 오시지만 자신은 그분의 신발 끈도 풀 자격이 없다고 해요.
요단 건너편의 증언|이 일은 요단 건너편 베다니에서 일어나고 요한은 거기서 세례를 베풀어요.
세상 죄를 지고 가는 어린양|요한은 예수를 보고 세상 죄를 지고 가는 하나님의 어린양이라 해요.
자기 뒤에 오실 분|요한은 자신 뒤에 오시는 분이 먼저 계셨다고 증언해요.
이스라엘에 나타내려 받은 세례|요한은 물로 세례를 베푸는 까닭이 그분을 이스라엘에 나타내기 위해서라고 해요.
성령이 머무는 표적|요한은 성령이 비둘기처럼 내려와 머무는 것을 보았다고 증언해요.
성령으로 세례 주시는 분|요한은 그분이 성령으로 세례를 주는 하나님의 아들이라고 증언해요.
성령으로 세례 주시는 분|요한은 그분이 성령으로 세례를 주는 하나님의 아들이라고 증언해요.
예수를 따라가는 두 제자|다음 날 요한이 제자 둘과 서 있다가 예수를 바라봐요.
하나님의 어린양을 가리킴|요한이 예수를 하나님의 어린양이라고 가리켜요.
예수를 따라간 두 사람|두 제자가 그 말을 듣고 예수를 따라가요.
무엇을 찾느냐는 물음|예수께서 돌아서서 무엇을 찾느냐고 물으세요.
어디 계시는지 묻는 제자들|제자들은 랍비여 어디에 머무시는지 여쭈어요.
와서 보라는 초대|예수께서는 와서 보라고 하시고 두 제자는 그날 함께 머물러요.
안드레가 시몬을 데려옴|안드레가 형제 시몬을 찾아 메시아를 만났다고 전해요.
게바라 이름을 지어 주심|예수께서 시몬을 보시고 게바라 부를 것이라 하세요.
빌립을 부르심|예수께서 빌립에게 나를 따르라고 하세요.
벳새다 출신 빌립|빌립은 안드레와 베드로와 같은 벳새다 사람이라고 소개돼요.
모세와 선지자가 기록한 이를 알림|빌립은 모세와 선지자가 기록한 이가 나사렛 예수라고 나다나엘에게 알려요.
나사렛을 두고 의심하는 나다나엘|나다나엘은 나사렛에서 무슨 선한 것이 나겠느냐고 물어요.
와서 보라는 빌립|빌립은 직접 와서 보라고 나다나엘을 이끌어요.
어떻게 자신을 아시는지 묻다|나다나엘이 어떻게 자신을 아시느냐고 물어요.
무화과나무 아래를 보신 예수|예수께서는 빌립이 부르기 전 나다나엘이 무화과나무 아래 있을 때 보았다고 하세요.
이스라엘 사람이라 칭찬받음|나다나엘은 예수를 하나님의 아들이자 이스라엘의 왕이라 고백해요.
더 큰 일을 보리라|예수께서는 이보다 더 큰 일을 보게 될 것이라 하세요.
하늘이 열리고 천사가 오르내림|하늘이 열리고 하나님의 천사들이 인자 위에 오르내리는 것을 보리라 하세요.
`,[
{from:1,to:18,actors:["말씀","요한","사람들"],setting:"sky",prop:"light",actions:["appear","look","shine","speak","witness","gather"]},
{from:19,to:28,actors:["요한","제사장들","레위인들","바리새인들"],setting:"river",prop:"water",actions:["question","answer","point","listen","pour","witness"]},
{from:29,to:34,actors:["요한","예수","제자들"],setting:"river",prop:"sheep",actions:["look","point","approach","speak","listen","witness"]},
{from:35,to:42,actors:["예수","안드레","시몬","두 제자"],setting:"road",prop:"scene-marker",actions:["walk","turn","ask","follow","invite","bring"]},
{from:43,to:51,actors:["예수","빌립","나다나엘"],setting:"road",prop:"fig-tree",actions:["walk","call","question","answer","look","bless"]}
],["말씀","요한","사람들","제사장들","레위인들","바리새인들","예수","제자들","안드레","시몬","두 제자","빌립","나다나엘"]);
add(2,`
갈릴리 가나의 혼인 잔치|사흘째에 갈릴리 가나에서 혼인 잔치가 열려요.
잔치에 함께하신 예수|예수와 어머니와 제자들이 혼인 잔치에 초대받아요.
포도주가 떨어진 잔치|잔치 중 포도주가 모자라자 예수의 어머니가 그 사실을 알려요.
아직 이르지 않은 때|예수께서는 자신의 때가 아직 이르지 않았다고 답하세요.
어머니가 종들에게 이르다|예수의 어머니는 무엇을 말씀하시든 그대로 하라고 종들에게 말해요.
돌항아리 여섯 개|정결 예식용 돌항아리 여섯 개가 놓여 있어요.
항아리에 물을 채우라|예수께서 항아리마다 물을 채우라고 하시자 종들이 가득 채워요.
떠서 연회장에게 가져가라|예수께서 이제 떠서 연회장에게 가져가라 하세요.
물에서 난 좋은 포도주|연회장은 물로 된 포도주를 맛보지만 어디서 왔는지 몰라요.
신랑을 부른 연회장|연회장이 신랑을 불러 좋은 포도주를 지금까지 남겼다고 말해요.
첫 표적을 보이신 예수|예수께서 가나에서 첫 표적을 행해 영광을 드러내세요.
제자들이 믿음|제자들이 예수를 믿어요.
가버나움으로 내려가심|예수께서 어머니와 형제들과 제자들과 가버나움에 내려가세요.
유월절에 예루살렘으로 올라가심|유대인의 유월절이 가까워 예수께서 예루살렘으로 올라가세요.
성전에서 파는 이들을 보심|예수께서 성전에서 소와 양과 비둘기를 파는 사람들을 보세요.
환전상과 상을 엎으심|예수께서 환전상들의 돈을 쏟고 상을 엎으세요.
양과 소를 성전 밖으로 내보냄|예수께서 양과 소를 성전에서 내보내세요.
비둘기 장사꾼에게 치우라 하심|예수께서 비둘기 파는 이들에게 이것을 가져가라 하세요.
아버지의 집을 장사터로 만들지 말라|예수께서 아버지의 집을 장사하는 집으로 만들지 말라고 하세요.
주의 집을 향한 열심|제자들은 주의 집을 향한 열심이 자신을 삼킬 것이라는 말씀을 기억해요.
무슨 표적을 보이느냐는 질문|유대인들이 이런 일을 할 권세가 있음을 보여 줄 표적을 요구해요.
성전을 헐라 사흘에 세우리라|예수께서는 이 성전을 헐면 사흘 만에 일으키겠다고 하세요.
마흔여섯 해 걸린 성전|유대인들은 성전을 마흔여섯 해 동안 지었다며 되물어요.
자기 몸을 가리킨 말씀|예수께서 말씀하신 성전은 자기 몸을 가리킨 것이었어요.
부활 뒤 기억한 제자들|예수께서 살아나신 뒤 제자들은 이 말씀을 기억하고 성경과 예수의 말씀을 믿어요.
`,[
{from:1,to:13,actors:["예수","예수의 어머니","종들","연회장","제자들"],setting:"house",prop:"water",actions:["gather","serve","signal","speak","fill","pour"]},
{from:14,to:20,actors:["예수","성전 상인들","환전상들","제자들"],setting:"temple",prop:"table",actions:["enter","look","overturn","drive","remove","remember"]},
{from:21,to:25,actors:["예수","유대 지도자들","제자들"],setting:"temple",prop:"stone",actions:["question","answer","point","listen","rise","believe"]}
],["예수","예수의 어머니","종들","연회장","제자들","성전 상인들","환전상들","유대 지도자들"] ,{11:"water"});
add(3,`
밤에 찾아온 니고데모|바리새인이자 유대인의 지도자인 니고데모가 밤에 예수를 찾아와요.
하나님께로부터 온 선생|니고데모는 표적을 보아 예수가 하나님께로부터 온 선생임을 안다고 말해요.
거듭나야 하나님 나라를 봄|예수께서는 거듭나지 않으면 하나님 나라를 볼 수 없다고 하세요.
어머니 태에 다시 들어가는가|니고데모가 늙은 사람이 어떻게 다시 날 수 있는지 묻어요.
물과 성령으로 남|예수께서는 물과 성령으로 나지 않으면 하나님 나라에 들어갈 수 없다고 하세요.
육과 영의 차이|육으로 난 것은 육이고 성령으로 난 것은 영이라고 하세요.
바람처럼 알 수 없는 성령|바람이 불어도 어디서 와 어디로 가는지 모르듯 성령으로 난 사람도 그래요.
어떻게 이런 일이 가능한가|니고데모가 어떻게 이런 일이 있을 수 있느냐고 물어요.
이스라엘 선생의 질문|예수께서는 이스라엘의 선생이면서 이런 일을 모를 수 있느냐고 하세요.
보고 들은 것을 증언함|예수께서는 자신들이 아는 것을 말하고 본 것을 증언한다고 하세요.
본 것을 증언하심|예수와 제자들은 아는 것을 말하고 본 것을 증언하지만 사람들은 받지 않아요.
땅의 일을 믿지 않으면|땅의 일을 말해도 믿지 않으면 하늘의 일을 어떻게 믿겠느냐고 하세요.
하늘에서 내려온 인자|하늘에서 내려온 이 외에는 하늘에 올라간 이가 없다고 말씀하세요.
모세가 든 놋뱀처럼|모세가 광야에서 뱀을 든 것처럼 인자도 들려야 해요.
믿는 이에게 주시는 영생|인자를 믿는 이는 영생을 얻게 하려는 뜻이에요.
세상을 사랑하신 하나님|하나님께서 세상을 사랑해 독생자를 주셨어요.
세상을 구원하러 보내심|아들을 보내신 것은 세상을 심판하려는 것이 아니라 구원하려는 거예요.
믿는 이는 심판받지 않음|아들을 믿는 이는 심판을 받지 않아요.
믿지 않는 이는 이미 심판 아래|독생자의 이름을 믿지 않는 이는 이미 심판을 받았어요.
빛보다 어둠을 사랑함|사람들은 악한 일을 하므로 빛보다 어둠을 사랑해요.
빛을 피하는 악한 행위|악을 행하는 이는 행위가 드러날까 빛을 미워하고 빛으로 오지 않아요.
빛으로 오는 진실한 행위|진리를 따르는 이는 자기 행위가 하나님 안에서 한 일임을 보이려고 빛으로 와요.
예수와 제자들의 세례|예수께서 제자들과 유대 땅에 머물며 세례를 베푸세요.
애논에서 세례를 베푸는 요한|요한은 살렘 가까운 애논에서 물이 많은 곳에서 세례를 베풀고, 아직 감옥에 갇히지 않았어요.
요한의 제자들과 유대인의 정결 논쟁|요한의 제자들과 한 유대인 사이에 정결 예식에 관한 논쟁이 생겨요.
예수께 몰리는 사람들|사람들이 예수께로 가며 모두가 그를 따른다고 요한에게 알려요.
하늘에서 주시지 않으면|요한은 하늘에서 주시지 않으면 사람이 아무것도 받을 수 없다고 답해요.
보냄 받은 이라고 증언함|요한은 자신이 그리스도보다 앞서 보내심을 받은 이라고 제자들에게 증언해요.
나는 그리스도가 아니요|요한은 자신이 그리스도가 아니라고 분명히 말해요.
신랑의 친구가 기뻐함|신랑의 친구는 신랑의 음성을 듣고 기뻐하며 요한의 기쁨도 가득해요.
그는 흥하고 나는 쇠하여야|요한은 예수께서 흥하고 자신은 쇠하여야 한다고 말해요.
위에서 오시는 이|위에서 오시는 이는 모든 이보다 높고 하늘에서 본 것을 증언하세요.
증언을 받는 이는 하나님을 참되다 함|그의 증언을 받는 이는 하나님이 참되심을 인정해요.
하나님의 말씀을 하시는 분|하나님께서 보내신 이는 하나님의 말씀을 하시고 성령을 한량없이 받아요.
아들을 사랑하시는 아버지|아버지께서는 아들을 사랑해 모든 것을 그의 손에 맡기셨어요.
아들을 믿는 이의 영생|아들을 믿는 이는 영생을 얻고 아들에게 순종하지 않는 이는 진노 아래 있어요.
`,[
{from:1,to:12,actors:["예수","니고데모"],setting:"house",prop:"lamp",actions:["approach","greet","speak","question","listen","point"]},
{from:13,to:21,actors:["예수","니고데모","모세"],setting:"wilderness",prop:"bronze-snake",actions:["teach","raise","look","believe","shine","walk"]},
{from:22,to:30,actors:["예수","요한","요한의 제자들","사람들"],setting:"river",prop:"water",actions:["walk","baptize","gather","report","answer","rejoice"]},
{from:31,to:36,actors:["요한","예수","제자들"],setting:"river",prop:"scroll",actions:["look","testify","speak","listen","believe","wait"]}
],["예수","니고데모","모세","요한","요한의 제자들","사람들","제자들"]);
