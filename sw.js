// 경건생활 서비스 워커: 통독 리마인드 푸시 알림을 받아 보여 줌
// 알림 서버(worker/)는 내용 없이 "지금 알려 줘" 신호만 보내고, 문구는 여기서 시간대에 맞게 고른다.

// [제목, 본문, 양 포즈, 그림 말풍선, 조건]
// - 포즈·말풍선은 알림 그림(icons/notify/<시간대>-<순서>.jpg)용. 문구를 고치거나 늘리면
//   `node tools/notify-art/build.mjs`로 그림을 다시 구워야 함 (포즈 목록은 tools/notify-art/art.js의 POSES)
// - 조건 "streak": 연속 기록이 있을 때만
const MESSAGES = {
  // 9~12시 중 랜덤: 아침부터 슬쩍 킹받게
  morning: [
    ["아담아, 네가 어디 있느냐 👀", "하나님이 아담을 찾으시던 그 질문(창 3:9), 지금 성경책이 똑같이 묻고 있어요. 오늘 분량 {portion}.", "point", "너 어디 있니?"],
    ["새벽기도는 놓쳤어도 괜찮아요 🌅", "주의 긍휼은 아침마다 새롭다잖아요(애 3:22-23). 아침 기회도 아직 새거예요. {portion} 펼쳐요.", "stretch", "아직 아침임"],
    ["만나는 해 뜨거워지면 녹습니다 🫠", "출애굽기 16장 21절 실화. 오늘 만나({portion})도 점심 전에 거두는 게 국룰이에요.", "shock", "만나 녹는 중"],
    ["아침 묵상 안 한 양 찾습니다 🔍", "목자는 아흔아홉 마리 두고 한 마리를 찾는다던데(눅 15:4)… 네, 지금 찾는 그 한 마리가 당신이에요.", "sign", "양 찾습니다\n(당신임)"],
    ["커피는 드셨고, 말씀은요? ☕", "커피는 벌써 두 잔째인데 성경은 아직 0장. 순서가 살짝 바뀐 것 같아요.", "sip", "커피 ≠ 말씀"],
    ["다니엘은 하루 세 번 기도했대요 🦁", "사자 굴 각오하고도 했던 다니엘(단 6:10). 우리는 사자도 없는데 {portion} 정도는…?", "pray", "사자 없음 ㅇㅈ?"],
    ["알람 끄고 다시 잠든 거 다 알아요 🤫", "게으른 자여 네가 어느 때까지 누워 있겠느냐(잠 6:9). 잠언이 너무 정확해서 무서운 아침이에요.", "shush", "다 봤음"],
    ["카톡 30개보다 말씀 1장 먼저 📱", "알림 빨간 숫자는 기다려 줘요. 오늘 분량 {portion}은 아침에 읽어야 제맛이고요.", "phone", "카톡 말고 이거"],
    ["아브라함은 아침 일찍 일어나… 📜", "성경 인물들 은근 다 아침형이에요(창 22:3). 우리도 아침에 한 장, 찍먹이라도?", "armscross", "너 빼고 다 아침형"],
    ["오늘도 무사히 눈 뜬 기념 🎉", "눈 뜬 것부터 은혜라면, 그 눈으로 성경 한 장 읽는 건 은혜 위에 은혜(요 1:16).", "cheer", "기상 ㅊㅋ"],
  ],
  // 15~18시 중 랜덤: 오후 나른할 때 찌르기
  afternoon: [
    ["엘리야 로뎀나무 모드 감지 🌳", "지쳐 누운 엘리야에게도 천사가 '일어나서 먹으라' 했죠(왕상 19:5). 오늘 떡은 {portion}.", "lounge", "일어나 먹으라"],
    ["식곤증 주의: 유두고 사례 🪟", "바울 설교 듣다 졸다가 창문에서 떨어진 유두고(행 20:9). 성경 읽다 졸면 적어도 바닥이라 안전해요.", "sleep", "…zzZ"],
    ["제 구 시, 기도할 시간이에요 🕒", "베드로와 요한은 오후 세 시에 기도하러 성전에 올라갔대요(행 3:1). 오후 세 시엔 말씀 한 장도 좋아요.", "peek", "제 구 시임"],
    ["요나처럼 반대 방향 가는 중? 🐋", "니느웨 말고 다시스행 배를 탄 요나(욘 1:3). 성경 말고 쇼츠를 탄 우리. 지금 방향 전환 가능합니다.", "run", "다시스 아님!"],
    ["오후 간식은 칼로리 0 🍯", "주의 말씀의 맛이 꿀보다 더 달다고(시 119:103). 0kcal인데 달대요. {portion} 한 입?", "crosslegs", "0kcal 꿀"],
    ["삭개오야, 속히 내려오라 🌳", "나무 위에서 구경만 하던 삭개오처럼(눅 19:5), 오늘 말씀도 구경만 하고 있진 않나요?", "point", "내려오라"],
    ["오늘 통독률 0%… 실화? ⏳", "와이파이는 빵빵한데 말씀 진도는 0%. 지금 {portion} 누르면 바로 로딩 시작이에요.", "facepalm", "0%…실화?"],
    ["마리아는 좋은 편을 택했대요 ✨", "바쁜 오후여도 필요한 것은 한 가지(눅 10:42). 할 일 목록 맨 위에 {portion} 올려 둘게요.", "sign", "좋은 편\n택하는 중"],
    ["바로 왕처럼 '내일' 하실 건가요? 🐸", "개구리 재앙 언제 없애 줄까 물으니 '내일'이라던 바로(출 8:10). 어디서 많이 본 패턴인데요.", "sip", "내일? 🐸"],
    ["저녁 알림 오기 전에 선수 치기 🏃", "지금 읽으면 18시·21시·23시 알림이 전부 조용해져요. 알림 세 번 피하는 가장 빠른 방법!", "shush", "조용히 끝내자"],
  ],
  // 18시: 저녁
  evening: [
    ["오늘의 만나, 아직 그대로예요 🍞", "광야의 만나는 날마다 거뒀죠(출 16:4). 오늘 분량 {portion}, 저녁 먹기 전에 한 입 어때요?", "crosslegs", "만나 식어요"],
    ["베뢰아 성도 모집 중 📜", "날마다 성경을 상고하던 베뢰아 사람들처럼(행 17:11), 오늘은 {portion}을 상고할 차례예요.", "sign", "베뢰아 성도\n모집 중"],
    ["칼뱅의 안경 챙기셨나요? 👓", "칼뱅은 성경을 하나님을 바로 보게 하는 안경이라 했죠. 오늘 안경은 아직 서랍 속에 있어요.", "peek", "안경 어디?"],
    ["사무엘아, 사무엘아 👂", "“말씀하옵소서 주의 종이 듣겠나이다”(삼상 3:10)가 정답인데, 지금 대답이 '5분만…'인 것 같아요.", "lounge", "5분만…"],
    ["퇴근길 말씀 한 조각 🚇", "오늘 분량은 {portion}. 두세 정거장이면 한 장이 끝나요. 쇼츠 말고 이거요.", "phone", "지하철엔 성경"],
    ["저녁은 드셨고, 말씀은요? 🍚", "사람이 떡으로만 살 것이 아니라 하셨는데(마 4:4), 오늘 설마 떡만 드신 건 아니죠?", "armscross", "떡만 먹음?"],
    ["롯의 아내처럼 뒤돌아보지 마요 🧂", "오늘 하루 돌아보며 한숨 쉬지 말고(창 19:26), 앞에 놓인 {portion}만 보고 가요.", "shock", "소금 될 뻔"],
    ["노아는 비 오기 전에 방주 지었어요 🛶", "비 오고 나서 지으면 늦잖아요(창 6:22). 자정 오기 전에 {portion} 지어 봐요.", "run", "비 오기 전에!"],
    ["여리고는 일곱 바퀴, 오늘은 한 장부터 🎺", "여리고 성은 일곱 바퀴 돌아야 무너졌지만(수 6:4), 오늘 분량은 한 장씩 넘기면 무너져요.", "megaphone", "뿌우우~"],
    ["기드온처럼 표징 기다리는 중? 🐑", "양털로 확인하던 기드온처럼(삿 6:37) 사인을 기다리셨다면… 이 양이 그 표징입니다. 지금 읽으세요.", "point", "이게 표징임"],
  ],
  // 21시: 더 킹받게
  night: [
    ["마르다야, 마르다야 🍳", "분주한 하루였죠. 그래도 필요한 것은 한 가지(눅 10:42). {portion}, 지금 주님 발치에 앉아 볼까요?", "facepalm", "마르다야…"],
    ["도르트 총회만큼 미루실 건가요? ⏳", "도르트 총회는 반년이 넘게 걸렸지만, 오늘 통독은 20분이면 돼요.", "armscross", "도르트급 미룸"],
    ["쇼츠 대신 성경 한 장? 📱", "알고리즘은 끝이 없지만 오늘 분량은 끝이 있어요. {portion}부터 가볍게 시작해요.", "phone", "쇼츠 3시간째"],
    ["겟세마네 제자들 모드 😴", "“너희가 나와 함께 한 시간도 깨어 있을 수 없더냐”(마 26:40). 한 시간까진 필요 없어요. 20분이면 돼요.", "sleep", "한 시간도…?"],
    ["보아스가 이삭을 남겨 뒀어요 🌾", "룻을 위해 일부러 이삭을 흘려 두던 보아스처럼(룻 2:16), 오늘 말씀 이삭도 넉넉히 남아 있어요.", "crosslegs", "이삭 남음 ㅎ"],
    ["에스라는 새벽부터 정오까지 읽었대요 📖", "느헤미야 8장의 에스라는 반나절을 읽었는데(느 8:3), 우리는 {portion}이면 돼요. 할 만하죠?", "sign", "에스라: 6시간\n나: 0분"],
    ["주야로 묵상, 이제 '야'만 남았어요 🌙", "복 있는 사람은 주야로 묵상한다죠(시 1:2). 낮은 지나갔지만 밤은 아직 길어요.", "lounge", "이제 '야'임"],
    ["발람의 나귀도 말을 했는데 🫏", "나귀까지 입을 열어 말렸는데(민 22:28), 이제 양까지 나섰습니다. 성경 펴세요.", "megaphone", "양도 말함"],
    ["닭 울기 전에 세 번째 다짐? 🐓", "“오늘은 진짜 읽는다” 오늘 몇 번째 다짐이세요? 닭 울기 전에 지켜 봐요(마 26:34).", "sip", "세 번째임"],
    ["섭리 가운데 도착한 알림입니다 😌", "이 알림을 지금 보신 것도 섭리 안에 있겠죠? 순종으로 응답할 시간이에요.", "pray", "섭리임 ㅇㅇ"],
  ],
  // 23시: 마지막 알림
  last: [
    ["열 처녀 비유, 등불 점검 🪔", "자정까지 한 시간! 오늘 통독 등불이 아직 꺼져 있어요(마 25장). 기름 채우러 가요.", "lamp", "기름 없음!!"],
    ["🔥 {streak}일 연속 기록이 위태로워요", "바울은 달려갈 길을 마쳤다는데(딤후 4:7), 우리의 연속 통독은 오늘 멈출 위기예요.", "shock", "연속 기록!!", "streak"],
    ["니고데모도 밤에 찾아왔어요 🌃", "늦은 밤에 말씀 앞에 나와도 괜찮아요(요 3:2). 지금 한 장이라도 펼쳐요.", "peek", "밤에 와도 됨"],
    ["개미에게 가서 배우라시던데요 🐜", "잠언 6장 6절이 이 시간에 떠오른 건 우연일까요? 아직 늦지 않았어요.", "sign", "개미 보고\n배우는 중"],
    ["당회에는 비밀로 할게요 🤫", "오늘 통독 안 한 거, 목사님·장로님껜 말 안 할게요. 대신 자기 전에 {portion} 딱 펼쳐 주세요.", "shush", "비밀 지켜줌"],
    ["마지막 알림이에요. 진짜로요.", "은혜는 값없이 주어지지만 성경은 펼쳐야 읽혀요. 오늘이 가기 전에 한 장만이라도! 🙏", "megaphone", "진짜 마지막"],
    ["말씀 기근 경보 ⚠️", "양식이 아니라 말씀이 없는 기근이 가장 무섭다죠(암 8:11). 자정 전에 해제해 주세요.", "run", "기근 경보!!"],
    ["내일의 나에게 떠넘기기 금지 🙅", "내일 일은 내일이 염려할 거예요(마 6:34). 오늘 분량은 오늘 읽기로 해요.", "armscross", "내일 금지"],
    ["삼손, 머리카락 잘리기 직전 ✂️", "들릴라 무릎에서 잠든 삼손처럼(삿 16:19) 이대로 자면… 오늘 통독도 싹둑이에요.", "faint", "힘이 빠져…"],
    ["이불 속에서도 성경은 열려요 🛏️", "이불 밖은 위험하다지만 성경 앱은 이불 안에서도 열려요. 자기 전 {portion}, 누운 채로 가능!", "hide", "누워서 가능"],
    ["방주 문 닫히기 전 마지막 탑승 🚪", "방주 문은 하나님이 닫으셨죠(창 7:16). 오늘 통독 문은 자정에 닫혀요. 지금 탑승!", "point", "탑승하세요"],
  ],
  // 앱에서는 이미 읽었는데 서버에 아직 반영되지 않았을 때
  done: [
    ["오늘 통독 완료! 👏", "벌써 읽으셨네요. 잠들기 전에 오늘 말씀 한 절만 더 곱씹어 볼까요?", "cheer", "완료!"],
    ["착하고 충성된 통독자여 😊", "오늘 분량을 마치셨어요. 내일도 같은 자리에서 만나요.", "crosslegs", "ㅎ 다 읽음"],
    ["알림이 머쓱해졌어요 😅", "이미 읽으신 줄 모르고 왔네요. 양은 조용히 퇴장합니다.", "shush", "조용히 퇴장"],
    ["오늘치 달려갈 길 완주 🏁", "오늘 분량 끝! 선한 싸움 오늘 라운드는 승리예요(딤후 4:7). 이제 푹 쉬어요.", "lounge", "쉬어도 됨"],
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

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function buildMessage() {
  const now = new Date();
  const today = ymd(now);
  const yesterday = ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const snap = (await idbGet("reminder")) || {};
  const fresh = snap.date === today;

  let tier;
  if (fresh && snap.done) tier = "done";
  else {
    const h = now.getHours();
    tier = h < 12 ? "morning" : h < 18 ? "afternoon" : h < 20 ? "evening" : h < 22 ? "night" : "last";
  }

  const streak = fresh || (snap.date === yesterday && snap.done) ? snap.streak || 0 : 0;
  // 연속 기록 문구는 기록이 있을 때만
  const pool = MESSAGES[tier].filter((m) => m[4] !== "streak" || streak > 0);
  const lastKey = `last-${tier}`;
  const last = await idbGet(lastKey);
  let idx = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && idx === last) idx = (idx + 1) % pool.length;
  await idbSet(lastKey, idx);

  const portion = fresh && snap.portion ? snap.portion : "오늘 분량";
  const fill = (s) => s.replace(/\{portion\}/g, portion).replace(/\{streak\}/g, String(streak));
  // 메시지마다 양(🐑) 포즈 그림: icons/notify/<시간대>-<원래 순서>.jpg (안드로이드·PC 크롬/엣지에서 크게 보임, 아이폰은 표시 안 함)
  const image = `icons/notify/${tier}-${MESSAGES[tier].indexOf(pool[idx])}.jpg`;
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
