// 경건생활 서비스 워커: 통독 리마인드 푸시 알림을 받아 보여 줌
// 알림 서버(worker/)는 내용 없이 "지금 알려 줘" 신호만 보내고, 문구는 여기서 시간대에 맞게 고른다.

// [제목, 본문, 양 포즈, 그림 말풍선, 조건]
// - 포즈·말풍선은 알림 그림(icons/notify/<시간대>-<순서>.jpg)용. 문구를 고치거나 늘리면
//   `node tools/notify-art/build.mjs`로 그림을 다시 구워야 함 (포즈 목록은 tools/notify-art/art.js의 POSES)
// - 조건 "streak": 연속 기록이 있을 때만
const DEFAULT_MESSAGES = {
  // 아침(~12시): 아침부터 슬쩍 킹받게
  morning: [
    ["아담아, 네가 어디 있느냐 👀","하나님이 아담을 찾으시던 그 질문(창 3:9), 지금 성경책이 똑같이 묻고 있어요. 오늘 분량 {portion}.","droop","너 어디 있니?"],
    ["새벽기도는 놓쳤어도 괜찮아요 🌅","주의 긍휼은 아침마다 새롭다잖아요(애 3:22-23). 아침 기회도 아직 새거예요. {portion} 펼쳐요.","pleading","아직 아침임"],
    ["만나는 해 뜨거워지면 녹습니다 🫠", "출애굽기 16장 21절 실화. 오늘 만나({portion})도 점심 전에 거두는 게 국룰이에요.", "shock", "만나 녹는 중"],
    ["아침 묵상 안 한 양 찾습니다 🔍","목자는 아흔아홉 마리 두고 한 마리를 찾는다던데(눅 15:4)… 네, 지금 찾는 그 한 마리가 당신이에요.","reach","양 찾습니다\n(당신임)"],
    ["커피는 드셨고, 말씀은요? ☕","커피는 벌써 두 잔째인데 성경은 아직 0장. 순서가 살짝 바뀐 것 같아요.","crosslegs","커피 ≠ 말씀"],
    ["다니엘은 하루 세 번 기도했대요 🦁","사자 굴 각오하고도 했던 다니엘(단 6:10). 우리는 사자도 없는데 {portion} 정도는…?","slump","사자 없음 ㅇㅈ?"],
    ["알람 끄고 다시 잠든 거 다 알아요 🤫", "게으른 자여 네가 어느 때까지 누워 있겠느냐(잠 6:9). 잠언이 너무 정확해서 무서운 아침이에요.", "shush", "다 봤음"],
    ["카톡 30개보다 말씀 1장 먼저 📱","알림 빨간 숫자는 기다려 줘요. 오늘 분량 {portion}은 아침에 읽어야 제맛이고요.","phonewait","카톡 말고 이거"],
    ["아브라함은 아침 일찍 일어나… 📜", "성경 인물들 은근 다 아침형이에요(창 22:3). 우리도 아침에 한 장, 찍먹이라도?", "armscross", "너 빼고 다 아침형"],
    ["오늘도 무사히 눈 뜬 기념 🎉", "눈 뜬 것부터 은혜라면, 그 눈으로 성경 한 장 읽는 건 은혜 위에 은혜(요 1:16).", "cheer", "기상 ㅊㅋ"],
    ["ㄹㅇ 아침인데 성경 안 열면 ㅋㅋ 🌞","아침에 {portion} 안 읽으면 하루 종일 현타 온다던데요. 지금 펼쳐요.","lean","ㄹㅇ 현타 예방"],
    ["아침부터 갓생 선언 🔥", "갓생의 시작은 여호와를 경외하는 데서 시작한대요(잠 1:7). {portion} 한 장이면 시작 완료!", "cheer", "갓생 시작"],
    ["알람 5개 끄고 일어난 거 인정 ⏰", "잠 6:10은 '조금 더 자고 팔짱 끼고'를 경고해요. 이제 팔짱 푸시고 {portion}!", "armscross", "팔짱 풀기"],
    ["오늘 목표: 어제보다 1절 더 🎯", "엄청 많이 말고 어제보다 한 절만 더요. 작은 걸음이 쌓이면 길이 돼요.", "point", "1절만 더"],
    ["공복에 말씀 먼저 🍳","몸 밥은 나중에, 영혼 밥은 먼저요(마 4:4). {portion} 드시고 아침 드세요.","crosslegs","말씀 먼저 간식"],
    ["물 말고 말씀부터? 💧","물은 한 잔이면 충분하지만 말씀은 아침에 한 장이 베스트래요.","sighing","물 말고 말씀"],
    ["어제 읽다 졸았죠? 😏", "괜찮아요. 그래도 오늘 {portion}은 깨어서 봐요. 베드로도 졸았지만 다시 깨어났잖아요(마 26:40).", "peek", "졸았는지 다 봤음"],
    ["출석 부름 받은 거 아시죠? 📋", "하나님은 아담을 부르셨죠(창 3:9). 오늘도 호명에 대답하기! {portion} 펴요.", "sign", "출석 부름"],
  ["새벽 미명에 일어난 사람 🌄","다윗도 새벽에 일어나 말씀에 매달렸대요(시 119:147). 오늘 {portion}, 해 뜨기 전에 먼저 만나 봐요.","run","해 뜨기 전 ㅊㅊ"],
  ["아침 첫 소리는 하나님 말씀으로 📣","하루의 첫 소리를 무엇으로 채울지 정해 봐요. 오늘은 {portion}이 첫 방송이에요.","sign","첫 방송 예약"],
  ["아침 등불은 말씀이래요 💡","주의 말씀은 내 발에 등이요(시 119:105). 어두운 아침, {portion}으로 불부터 켜요.","waiting","불 켜기"],
  ["오늘 아침 얼굴 붉히지 않게 🌸","부끄러울 일 없는 하루는 말씀으로 시작할 때 쉬워요. {portion}, 지금 펼쳐 볼까요?","heartplease","얼굴 빨개짐"],
  ["아침부터 이마 치기 전에 🤦","어제 뭘 읽었는지 가물가물하다면 괜찮아요. 오늘 {portion}으로 기억을 다시 채워요.","facepalm","기억 리셋"],
  ["새 아침은 새 말씀으로 🌱","주의 인자하심이 아침마다 새로워요(애 3:23). 오늘 {portion}도 처음 읽는 것처럼요.","pray","새 아침"],
  ["아침 한 숟가락, 말씀 한 장 🥄","밥 한 숟가락 뜨기 전에 {portion} 한 절만 먼저 떠 보세요. 배부른 하루가 시작돼요.","crosslegs","한 숟가락 먼저"],
  ["독수리처럼 날개 치기 전에 🦅","날개 치며 오르려면 먼저 든든히 먹어야 해요(사 40:31). 오늘 {portion}이 그 든든한 아침이에요.","dozing","날개 준비"],
  ["나를 부지런히 찾는 자 🔎","새벽에 나를 찾는 자가 나를 만나리라(잠 8:17). 오늘도 {portion}에서 만나요.","peek","찾았다!"],
    ["좋은 아침이에요, 오늘도 함께 읽어요 ☀️", "서두르지 않아도 괜찮아요. 오늘의 {portion}에서 마음에 닿는 한 문장을 만나 보세요.", "pray", "천천히 한 문장"],
    ["오늘 첫 페이지를 열 시간 📖","딱 한 장부터 시작해요. 작은 시작이 하루의 방향을 바꿔 줍니다.","point","첫 페이지"],
    ["아침 브리핑: 오늘의 말씀 도착 🗞️","하늘에서 온 오늘의 소식입니다. {portion}, 지금 확인해 보세요.","sign","오늘의 말씀"],
  ],
  // 오후(12~18시) 나른할 때 찌르기
  afternoon: [
    ["엘리야 로뎀나무 모드 감지 🌳","지쳐 누운 엘리야에게도 천사가 '일어나서 먹으라' 했죠(왕상 19:5). 오늘 떡은 {portion}.","embarrassed","일어나 먹으라"],
    ["식곤증 주의: 유두고 사례 🪟", "바울 설교 듣다 졸다가 창문에서 떨어진 유두고(행 20:9). 성경 읽다 졸면 적어도 바닥이라 안전해요.", "sleep", "…zzZ"],
    ["제 구 시, 기도할 시간이에요 🕒", "베드로와 요한은 오후 세 시에 기도하러 성전에 올라갔대요(행 3:1). 오후 세 시엔 말씀 한 장도 좋아요.", "peek", "제 구 시임"],
    ["요나처럼 반대 방향 가는 중? 🐋", "니느웨 말고 다시스행 배를 탄 요나(욘 1:3). 성경 말고 쇼츠를 탄 우리. 지금 방향 전환 가능합니다.", "run", "다시스 아님!"],
    ["오후 간식은 칼로리 0 🍯", "주의 말씀의 맛이 꿀보다 더 달다고(시 119:103). 0kcal인데 달대요. {portion} 한 입?", "crosslegs", "0kcal 꿀"],
    ["삭개오야, 속히 내려오라 🌳","나무 위에서 구경만 하던 삭개오처럼(눅 19:5), 오늘 말씀도 구경만 하고 있진 않나요?","wave_small","내려오라"],
    ["오늘 통독률 0%… 실화? ⏳", "와이파이는 빵빵한데 말씀 진도는 0%. 지금 {portion} 누르면 바로 로딩 시작이에요.", "eye_roll", "0%…실화?"],
    ["마리아는 좋은 편을 택했대요 ✨", "바쁜 오후여도 필요한 것은 한 가지(눅 10:42). 할 일 목록 맨 위에 {portion} 올려 둘게요.", "sign", "좋은 편\n택하는 중"],
    ["바로 왕처럼 '내일' 하실 건가요? 🐸","개구리 재앙 언제 없애 줄까 물으니 '내일'이라던 바로(출 8:10). 어디서 많이 본 패턴인데요.","crosslegs","내일? 🐸"],
    ["남은 알림 전에 선수 치기 🏃", "지금 읽으면 오늘 남은 알림이 조용해져요. 알림 피하는 가장 빠른 방법!", "shush", "조용히 끝내자"],
    ["오후 3시 집중력 바닥 🫠","엘리야도 로뎀나무 아래서 쓰러졌지만 천사가 먹을 것을 주고 다시 세웠어요(왕상 19:5-7). {portion} 한 장으로 충전!","wave_tired","충전 필요"],
    ["점심 먹고 쇼츠 3개 봤죠? 📱", "쇼츠는 3개에서 멈추기 힘들지만, 성경은 {portion} 한 장에서 멈춰도 괜찮아요.", "phone", "쇼츠 말고 이거"],
    ["ㄹㅇ 오후는 졸음 전쟁... 😴", "식곤증은 말씀으로 이기는 거예요(시 119:103). 한 절만 읽고 세수 한번 해요.", "sleep", "졸음 전쟁"],
    ["이거 실화냐 통독 0%? 🤔","0%는 아직 '시작 전'이라는 뜻! {portion} 누르면 1%예요. 진짜로요.","condescend","0% 실화?"],
    ["지금 가는 길 맞아요? 🧭", "요나처럼 방향 틀기 전에 {portion} 한 번 펼쳐 보는 것도 좋아요(욘 1:3).", "run", "방향 체크"],
    ["오후 간식은 말씀 간식 🍪","꿀보다 달다는 말씀이에요(시 119:103). 칼로리 걱정 없는 간식! {portion} 한 입.","arms_open","칼로리 0"],
    ["버스 타는 중이면 한 절 🚌", "버스 세 정거장이면 한 장도 가능한 거리예요. {portion} 열어 두세요.", "phone", "버스에서 한 절"],
    ["'내일 하지 뭐' 금지 ⏳","바로처럼 미루다 보면 결국 못 가요(출 8:10). 지금 {portion} 부탁!","fingerwag","내일 금지"],
    ["잠깐, 마음에 쉼표를 놓아 볼까요? 🍃","바쁜 틈에 숨을 고르고 {portion} 한 장 읽어요. 오늘도 충분히 잘하고 있어요.","cheer","마음의 쉼표"],
    ["3분만 집중 모드 켜기 🎧", "알림은 잠시 내려놓고 말씀 한 단락만 읽어 봐요. 작은 집중이 깊은 쉼이 됩니다.", "phone", "집중 모드"],
    ["속보: 오후의 내가 말씀을 기다립니다 📰","쇼츠 한 편 대신 {portion} 한 장이면 오늘 이야기의 주인공은 나예요.","shoulders_up","속보입니다"],
  ],
  // 저녁(18~20시)
  evening: [
    ["오늘의 만나, 아직 그대로예요 🍞", "광야의 만나는 날마다 거뒀죠(출 16:4). 오늘 분량 {portion}, 저녁 먹기 전에 한 입 어때요?", "crosslegs", "만나 식어요"],
    ["베뢰아 성도 모집 중 📜", "날마다 성경을 상고하던 베뢰아 사람들처럼(행 17:11), 오늘은 {portion}을 상고할 차례예요.", "sign", "베뢰아 성도\n모집 중"],
    ["칼뱅의 안경 챙기셨나요? 👓", "칼뱅은 성경을 하나님을 바로 보게 하는 안경이라 했죠. 오늘 안경은 아직 서랍 속에 있어요.", "peek", "안경 어디?"],
    ["사무엘아, 사무엘아 👂", "“말씀하옵소서 주의 종이 듣겠나이다”(삼상 3:10)가 정답인데, 지금 대답이 '5분만…'인 것 같아요.", "sideeye", "5분만…"],
    ["퇴근길 말씀 한 조각 🚇","오늘 분량은 {portion}. 두세 정거장이면 한 장이 끝나요. 쇼츠 말고 이거요.","hands_behind","지하철엔 성경"],
    ["저녁은 드셨고, 말씀은요? 🍚", "사람이 떡으로만 살 것이 아니라 하셨는데(마 4:4), 오늘 설마 떡만 드신 건 아니죠?", "armscross", "떡만 먹음?"],
    ["롯의 아내처럼 뒤돌아보지 마요 🧂", "오늘 하루 돌아보며 한숨 쉬지 말고(창 19:26), 앞에 놓인 {portion}만 보고 가요.", "shock", "소금 될 뻔"],
    ["노아는 비 오기 전에 방주 지었어요 🛶", "비 오고 나서 지으면 늦잖아요(창 6:22). 자정 오기 전에 {portion} 지어 봐요.", "run", "비 오기 전에!"],
    ["여리고는 일곱 바퀴, 오늘은 한 장부터 🎺","여리고 성은 일곱 바퀴 돌아야 무너졌지만(수 6:4), 오늘 분량은 한 장씩 넘기면 무너져요.","sign","뿌우우~"],
    ["기드온처럼 표징 기다리는 중? 🐑","양털로 확인하던 기드온처럼(삿 6:37) 사인을 기다리셨다면… 이 양이 그 표징입니다. 지금 읽으세요.","book_overhead","이게 표징임"],
    ["저녁 먹고 뭐 하세요? 🍽️","설거지 끝나고 소파에 눕기 전에 {portion} 먼저 펼쳐요. 누워서 해도 인정!","sideeye","소파 전에 한 장"],
    ["오늘 하루 감사 한 줄 준비 ✍️", "오늘 말씀 한 절에 감사 한 줄 쓰면 하루가 완성돼요(살전 5:18).", "sign", "감사 한 줄"],
    ["ㅋㅋ 오늘 통독 안 하고 밤 되었죠? 🌙", "밤에 하면 조금 더 힘들어요. 그래도 {portion} 한 장!", "shock", "밤이 왔다"],
    ["갓생 러너 퇴근 완료 🏃", "오늘 달렸으니 마지막 한 바퀴! 달려갈 길을 마치기 위해(딤후 4:7) {portion}.", "run", "마지막 한 바퀴"],
    ["말씀 없이 잠들면 꿈도 흐려져요 💭","꿈 얘기하던 요셉처럼(창 37:5) 오늘 말씀을 꿈에 가져가요. {portion} 펴고 자요.","book_on_head","꿈에 말씀 들고"],
    ["아 피곤하죠? 그래도 한 장 🥱", "엘리야도 천사가 준 떡 한 끼로 40일을 갔어요(왕상 19:8). 말씀 한 끼 먹고 자요.", "lounge", "말씀 한 끼"],
    ["내일 아침의 나에게 떠넘기기 금지 📝", "내일 일은 내일이 염려할 거예요(마 6:34). 오늘 {portion}은 오늘 읽어요.", "sign", "오늘이 마감"],
    ["폰 내려놓고 성경 열기 📵", "폰 80%보다 성경 한 장 100%! {portion} 펴면 잠도 잘 와요.", "shush", "폰 내려놓기"],
    ["저녁의 평안을 한 페이지에 🌙", "하루의 소음을 잠시 내려놓고, {portion}을 천천히 읽으며 마음을 쉬게 해요.", "pray", "평안 한 페이지"],
    ["퇴근 완료! 마음도 로그아웃 전에 📤","오늘의 마지막 업무는 나를 살리는 말씀 읽기. {portion} 확인 후 편히 쉬세요.","reading_seated","마음 로그아웃"],
    ["양심이 아니라 양이 톡 보냈어요 🐑", "오늘 읽을 {portion}이 아직 안 읽힘 상태래요. 지금 열면 바로 해결됩니다.", "peek", "안 읽음 1건"],
  ],
  // 밤(20~22시): 더 킹받게
  night: [
    ["마르다야, 마르다야 🍳", "분주한 하루였죠. 그래도 필요한 것은 한 가지(눅 10:42). {portion}, 지금 주님 발치에 앉아 볼까요?", "facepalm", "마르다야…"],
    ["도르트 총회만큼 미루실 건가요? ⏳", "도르트 총회는 반년이 넘게 걸렸지만, 오늘 통독은 20분이면 돼요.", "eye_roll", "도르트급 미룸"],
    ["쇼츠 대신 성경 한 장? 📱", "알고리즘은 끝이 없지만 오늘 분량은 끝이 있어요. {portion}부터 가볍게 시작해요.", "phone", "쇼츠 3시간째"],
    ["겟세마네 제자들 모드 😴","“너희가 나와 함께 한 시간도 깨어 있을 수 없더냐”(마 26:40). 한 시간까진 필요 없어요. 20분이면 돼요.","book_rest","한 시간도…?"],
    ["보아스가 이삭을 남겨 뒀어요 🌾", "룻을 위해 일부러 이삭을 흘려 두던 보아스처럼(룻 2:16), 오늘 말씀 이삭도 넉넉히 남아 있어요.", "crosslegs", "이삭 남음 ㅎ"],
    ["에스라는 새벽부터 정오까지 읽었대요 📖", "느헤미야 8장의 에스라는 반나절을 읽었는데(느 8:3), 우리는 {portion}이면 돼요. 할 만하죠?", "sign", "에스라: 6시간\n나: 0분"],
    ["주야로 묵상, 이제 '야'만 남았어요 🌙", "복 있는 사람은 주야로 묵상한다죠(시 1:2). 낮은 지나갔지만 밤은 아직 길어요.", "lounge", "이제 '야'임"],
    ["발람의 나귀도 말을 했는데 🫏","나귀까지 입을 열어 말렸는데(민 22:28), 이제 양까지 나섰습니다. 성경 펴세요.","sign","양도 말함"],
    ["닭 울기 전에 세 번째 다짐? 🐓","“오늘은 진짜 읽는다” 오늘 몇 번째 다짐이세요? 닭 울기 전에 지켜 봐요(마 26:34).","head_tilt","세 번째임"],
    ["섭리 가운데 도착한 알림입니다 😌","이 알림을 지금 보신 것도 섭리 안에 있겠죠? 순종으로 응답할 시간이에요.","condescend","섭리임 ㅇㅇ"],
    ["밤이 깊을수록 말씀이 또렷 🌃","밤에 읽는 시편은 참 맛있어요. 주야로 묵상하는 사람은 복 있는 사람이래요(시 1:2). {portion}!","condescend","밤 시편 맛집"],
    ["ㅅㄱ 또 밤에 생각났죠? 🤭", "밤에 생각나는 말씀이 제일 오래 남아요. 지금 {portion} 한 장만요.", "crosslegs", "밤에 생각남"],
    ["잠들기 전 기도 한마디 + 말씀 한 장 🙏","자기 전 말씀 한 장, 기도 한 줄이면 완벽한 마무리예요. {portion} 펴고 기도해요.","kneel","취침 전 루틴"],
    ["오늘 완주 못 하면 어떡하지… 😰","완벽하지 않아도 돼요. 할 수 있는 만큼, {portion} 한 절부터 시작해요.","foot_tap","한 절이면 됨"],
    ["밤 11시, 아직 살아 계신가요? 👀", "밤샘은 말고, 깨어 있을 때 {portion} 한 번만 펼쳐요(마 26:41).", "shush", "깨어 있기"],
    ["쇼츠 대신 시편 한 편? 🎵","시편은 노래책이라 노래 한 곡 듣는 셈 쳐요. {portion} 열고 소리 내 읽어 봐요.","offerbook","시편 틀기"],
    ["자려고 누웠는데 폰 보는 중 🛌","누운 채로 {portion} 한 절만요. 그리고 폰은 내려놓아요.","phonewait","누워서 한 절"],
    ["오늘 진짜 마지막 질문! 📣","오늘 말씀 읽었나요? NO면 지금 {portion} 한 절만 읽고 주무세요.","eye_roll","YES or NO?"],
    ["오늘 하루, 여기까지도 수고했어요 🌌","남은 힘이 적다면 한 절만 읽어도 좋아요. 말씀 안에서 하루를 다정하게 마무리해요.","crawl","한 절도 좋아요"],
    ["마감 임박! 성경책은 야근 안 시킬게요 🕘","전부 끝내려 애쓰지 않아도 돼요. {portion}에서 한 장만 함께 읽어요.","facepalm","한 장이면 충분"],
    ["야식 대신 말씀 한 입 🍯","오늘의 양식은 아직 남아 있어요. {portion} 한 장 맛보고 편히 잠들어요.","crosslegs","마음 야식"],
  ],
  // 늦은 밤(22시~): 마지막 알림
  last: [
    ["열 처녀 비유, 등불 점검 🪔","자정까지 한 시간! 오늘 통독 등불이 아직 꺼져 있어요(마 25장). 기름 채우러 가요.","point","기름 없음!!"],
    ["🔥 {streak}일 연속 기록이 위태로워요","바울은 달려갈 길을 마쳤다는데(딤후 4:7), 우리의 연속 통독은 오늘 멈출 위기예요.","cling","연속 기록!!","streak"],
    ["니고데모도 밤에 찾아왔어요 🌃","늦은 밤에 말씀 앞에 나와도 괜찮아요(요 3:2). 지금 한 장이라도 펼쳐요.","tiny_bow","밤에 와도 됨"],
    ["개미에게 가서 배우라시던데요 🐜", "잠언 6장 6절이 이 시간에 떠오른 건 우연일까요? 아직 늦지 않았어요.", "sign", "개미 보고\n배우는 중"],
    ["당회에는 비밀로 할게요 🤫", "오늘 통독 안 한 거, 목사님·장로님껜 말 안 할게요. 대신 자기 전에 {portion} 딱 펼쳐 주세요.", "shush", "비밀 지켜줌"],
    ["마지막 알림이에요. 진짜로요.","은혜는 값없이 주어지지만 성경은 펼쳐야 읽혀요. 오늘이 가기 전에 한 장만이라도! 🙏","lastlook","진짜 마지막"],
    ["말씀 기근 경보 ⚠️","양식이 아니라 말씀이 없는 기근이 가장 무섭다죠(암 8:11). 자정 전에 해제해 주세요.","tearful","기근 경보!!"],
    ["내일의 나에게 떠넘기기 금지 🙅", "내일 일은 내일이 염려할 거예요(마 6:34). 오늘 분량은 오늘 읽기로 해요.", "armscross", "내일 금지"],
    ["삼손, 머리카락 잘리기 직전 ✂️","들릴라 무릎에서 잠든 삼손처럼(삿 16:19) 이대로 자면… 오늘 통독도 싹둑이에요.","shock","힘이 빠져…"],
    ["이불 속에서도 성경은 열려요 🛏️","이불 밖은 위험하다지만 성경 앱은 이불 안에서도 열려요. 자기 전 {portion}, 누운 채로 가능!","phone","누워서 가능"],
    ["방주 문 닫히기 전 마지막 탑승 🚪", "방주 문은 하나님이 닫으셨죠(창 7:16). 오늘 통독 문은 자정에 닫혀요. 지금 탑승!", "point", "탑승하세요"],
    ["자정 전 마지막 기회 ⏰","마감 5분 전! {portion} 한 절이라도 오늘 안에 체크해요.","stomp","마감 5분 전"],
    ["여기까지 온 것도 잘한 일이에요 💛","늦었다고 자책하지 말고 한 절만 읽어요. 오늘의 작은 시작도 귀합니다.","lastlook","작은 시작도 귀해요"],
    ["마지막 퀘스트: 말씀 한 장 🎮","오늘의 출석 보상은 거창하지 않아요. {portion} 한 장 읽고 편히 로그아웃!","clutchbook","퀘스트 수락?"],
    ["속보: 오늘의 빈칸, 아직 채울 수 있음 🗞️","자정 전까지 시간이 있어요. {portion} 한 장으로 오늘을 마무리해요.","reach","마감 전 속보"],
    ["오늘 통독표 빈칸 발견 🕳️","하루 빈칸이 쌓이면 허전하죠. 지금 {portion} 한 절로 메워 봐요.","phonewait","빈칸 발견"],
    ["달은 떴는데 성경은 안 펴졌네요 🌙", "지금 한 절만 펴면 오늘의 달빛이 말씀이 돼요.", "peek", "달빛 말씀"],
    ["불 끄기 전 마지막 체크 💡", "방 불 끄기 전에 {portion} 체크하고 주무세요. 잔소리 아니고 알림입니다.", "nope", "불 끄기 전에"],
    ["성경도 자러 가고 싶대요 🛏️","책도 오늘 밤 펴서 읽어 주면 좋아해요. {portion} 펴 줘요!","phone","책도 잠 필요"],
    ["오늘 마지막 알림, 착한 양들 🐑🐑","오늘 한 장이라도 읽은 양이면 좋겠어요. {portion}, 지금이 골든타임!","cling","오늘 마지막 콜"],
  ],
  // 앱에서는 이미 읽었는데 서버에 아직 반영되지 않았을 때
  done: [
    ["오늘 통독 완료! 👏", "벌써 읽으셨네요. 잠들기 전에 오늘 말씀 한 절만 더 곱씹어 볼까요?", "cheer", "완료!"],
    ["착하고 충성된 통독자여 😊", "오늘 분량을 마치셨어요. 내일도 같은 자리에서 만나요.", "crosslegs", "ㅎ 다 읽음"],
    ["알림이 머쓱해졌어요 😅", "이미 읽으신 줄 모르고 왔네요. 양은 조용히 퇴장합니다.", "shush", "조용히 퇴장"],
    ["오늘치 달려갈 길 완주 🏁", "오늘 분량 끝! 선한 싸움 오늘 라운드는 승리예요(딤후 4:7). 이제 푹 쉬어요.", "lounge", "쉬어도 됨"],
    ["오늘의 말씀, 잘 받아 두셨어요 🌱", "읽은 한 줄이 내일의 마음에도 싹틀 거예요. 오늘도 수고 많았어요.", "pray", "잘 자라날 거예요"],
    ["완료 도장 쾅! 오늘의 퀘스트 끝 🏆", "오늘 분량을 해냈어요. 마음 놓고 쉬세요. 내일 또 만나요!", "cheer", "오늘 완료!"],
  ],
};

function idb(mode, fn) {
  return new Promise((resolve) => {
    const req = indexedDB.open("daily5", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onerror = () => resolve(undefined);
    req.onsuccess = () => {
      const tx = req.result.transaction("kv", mode);
      const r = fn(tx.objectStore("kv"));
      tx.oncomplete = () => resolve(r && r.result);
      tx.onerror = () => resolve(undefined);
    };
  });
}
const idbGet = (key) => idb("readonly", (s) => s.get(key));
const idbSet = (key, val) => idb("readwrite", (s) => s.put(val, key));
const idbDelete = (key) => idb("readwrite", (s) => s.delete(key));
const REMINDER_DB_URL = "https://daily-bible-reminder.gimbap-lettuce.workers.dev/reminder-messages";

async function refreshReminderMessages() {
  const last = await idbGet("reminder-messages-fetched") || 0;
  if (Date.now() - last < 5 * 60_000) return;
  try {
    const response = await fetch(REMINDER_DB_URL, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (data.messages) await idbSet("reminder-messages", data.messages);
    else await idbDelete("reminder-messages");
    await idbSet("reminder-messages-fetched", Date.now());
  } catch (_) { /* 서버가 안 되면 마지막으로 받은 DB나 기본 DB를 사용 */ }
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localParts(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(date);
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) };
  } catch (_) {
    const p = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(date);
    const v = Object.fromEntries(p.map((x) => [x.type, x.value]));
    return { date: `${v.year}-${v.month}-${v.day}`, hour: Number(v.hour), minute: Number(v.minute) };
  }
}

function shiftDate(date, offset) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function buildMessage() {
  const now = new Date();
  const snap = (await idbGet("reminder")) || {};
  await refreshReminderMessages();
  const MESSAGES = (await idbGet("reminder-messages")) || DEFAULT_MESSAGES;
  const local = localParts(now, snap.timeZone);
  const today = local.date;
  const yesterday = shiftDate(today, -1);
  const fresh = snap.date === today;

  let tier;
  if (fresh && snap.done) tier = "done";
  else {
    const h = local.hour;
    tier = h < 12 ? "morning" : h < 18 ? "afternoon" : h < 20 ? "evening" : h < 22 ? "night" : "last";
  }

  const streak = fresh || (snap.date === yesterday && snap.done) ? snap.streak || 0 : 0;
  // 연속 기록 문구는 기록이 있을 때만
  const pool = (MESSAGES[tier] || DEFAULT_MESSAGES[tier]).filter((m) => m[4] !== "streak" || streak > 0);
  const lastKey = `last-${tier}`;
  const last = await idbGet(lastKey);
  let idx = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && idx === last) idx = (idx + 1) % pool.length;
  await idbSet(lastKey, idx);

  const portion = fresh && snap.portion ? snap.portion : "오늘 분량";
  const fill = (s) => s.replace(/\{portion\}/g, portion).replace(/\{streak\}/g, String(streak));
  // 메시지마다 양(🐑) 포즈 그림: icons/notify/<시간대>-<원래 순서>.jpg (안드로이드·PC 크롬/엣지에서 크게 보임, 아이폰은 표시 안 함)
  const rowIndex = MESSAGES[tier].indexOf(pool[idx]);
  const image = pool[idx][5] || `icons/notify/${tier}-${rowIndex}.jpg?v=sheep-fifty-varied-20261028`;
  return { title: fill(pool[idx][0]), body: fill(pool[idx][1]), image };
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    const { title, body, image } = await buildMessage();
    await self.registration.showNotification(title, {
      body,
      image,
      icon: "icons/icon-192.png",
      badge: "icons/badge-96.png",
      tag: "daily-reading",
      renotify: true,
      data: { url: "./#today" },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./", self.registration.scope).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(self.registration.scope)) {
        await w.focus();
        return w.navigate(target);
      }
    }
    return self.clients.openWindow(target);
  })());
});

// 화면 파일(HTML·스크립트·스타일)과 픽셀 자료실 목록은 매번 서버에 확인해서 받음. 브라우저 캐시의 예전 파일이 먼저 떠서
// 접속 직후 버전이 바뀌는 일을 막음. 오프라인이면 마지막으로 받아 둔 파일을 씀
const SHELL_CACHE = "app-shell-v2";
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isShell = req.mode === "navigate" || url.pathname.endsWith("/") || /\.(html|js|css)$/.test(url.pathname) || /\/data\/pixel-bible\/reference-library\.json$/.test(url.pathname);
  if (!isShell) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req.url, { cache: "no-cache" });
      if (res.ok) {
        const cache = await caches.open(SHELL_CACHE);
        cache.put(req.url, res.clone());
      }
      return res;
    } catch (e) {
      const cached = await caches.match(req.url);
      return cached || Response.error();
    }
  })());
});
