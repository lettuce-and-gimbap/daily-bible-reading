// 매일 5장 통독 서비스 워커: 저녁 리마인드 푸시 알림을 받아 보여 줌
// 알림 서버(worker/)는 내용 없이 "지금 알려 줘" 신호만 보내고, 문구는 여기서 시간대에 맞게 고른다.

const MESSAGES = {
  // 18시: 부드럽게
  evening: [
    ["오늘의 만나, 아직 그대로예요 🍞", "광야의 만나는 날마다 거뒀죠(출 16:4). 오늘 분량 {portion}, 저녁 먹기 전에 한 입 어때요?"],
    ["베뢰아 성도 모집 중 📜", "날마다 성경을 상고하던 베뢰아 사람들처럼(행 17:11), 오늘은 {portion}을 상고할 차례예요."],
    ["Sola Scriptura, 오늘도 유효합니다", "오직 성경을 고백하는 우리인데… 오늘 성경은 아직 덮여 있네요. {portion}이면 충분해요."],
    ["칼뱅의 안경 챙기셨나요? 👓", "칼뱅은 성경을 하나님을 바로 보게 하는 안경이라 했죠. 오늘 안경은 아직 서랍 속에 있어요."],
    ["소요리문답 제1문 기억나세요?", "사람의 제일 되는 목적은 하나님을 영화롭게 하고 영원히 즐거워하는 것. 오늘은 {portion}으로 즐거워해 볼까요?"],
    ["사무엘처럼 대답할 시간 👂", "“말씀하세요, 듣겠습니다”(삼상 3:10). 오늘 말씀이 아직 기다리고 있어요."],
    ["퇴근길 말씀 한 조각 🚇", "오늘 분량은 {portion}. 두세 정거장이면 한 장이 끝나요."],
    ["일용할 양식 챙기셨나요? 🍚", "사람이 떡으로만 살 수 없다 하셨으니(마 4:4), 저녁밥과 함께 말씀도 챙겨 드세요."],
  ],
  // 21시: 조금 더 재치 있게
  night: [
    ["마르다야, 마르다야 🍳", "분주한 하루였죠. 그래도 필요한 것은 한 가지(눅 10:42). {portion}, 지금 주님 발치에 앉아 볼까요?"],
    ["도르트 총회만큼 미루실 건가요? ⏳", "도르트 총회는 반년이 넘게 걸렸지만, 오늘 통독은 20분이면 돼요."],
    ["쇼츠 대신 성경 한 장? 📱", "알고리즘은 끝이 없지만 오늘 분량은 끝이 있어요. {portion}부터 가볍게 시작해요."],
    ["섭리 가운데 도착한 알림입니다 😌", "이 알림을 지금 보신 것도 섭리 안에 있겠죠? 순종으로 응답할 시간이에요."],
    ["보아스가 이삭을 남겨 뒀어요 🌾", "룻을 위해 일부러 이삭을 흘려 두던 보아스처럼(룻 2:16), 오늘 말씀 이삭도 넉넉히 남아 있어요."],
    ["에스라는 새벽부터 정오까지 읽었대요 📖", "느헤미야 8장의 에스라에 비하면 우리는 {portion}이면 되니까… 할 만하죠?"],
    ["주야로 묵상, 이제 '야'만 남았어요 🌙", "복 있는 사람은 주야로 묵상한다죠(시 1:2). 낮은 지나갔지만 밤은 아직 길어요."],
    ["새찬송가 199장 제목 기억나세요? 🎵", "「나의 사랑하는 책」이었죠. 그 책, 오늘은 아직 한 번도 안 펼치셨어요."],
  ],
  // 23시: 마지막 알림
  last: [
    ["열 처녀 비유, 등불 점검 🪔", "자정까지 한 시간! 오늘 통독 등불이 아직 꺼져 있어요(마 25장). 기름 채우러 가요."],
    ["🔥 {streak}일 연속 기록이 위태로워요", "바울은 달려갈 길을 마쳤다는데(딤후 4:7), 우리의 연속 통독은 오늘 멈출 위기예요.", "streak"],
    ["니고데모도 밤에 찾아왔어요 🌃", "늦은 밤에 말씀 앞에 나와도 괜찮아요(요 3:2). 지금 한 장이라도 펼쳐요."],
    ["개미에게 가서 배우라시던데요 🐜", "잠언 6장 6절이 이 시간에 떠오른 건 우연일까요? 아직 늦지 않았어요."],
    ["당회에는 비밀로 할게요 🤫", "오늘 통독 안 한 거, 목사님·장로님껜 말 안 할게요. 대신 자기 전에 {portion} 딱 펼쳐 주세요."],
    ["마지막 알림이에요. 진짜로요.", "은혜는 값없이 주어지지만 성경은 펼쳐야 읽혀요. 오늘이 가기 전에 한 장만이라도! 🙏"],
    ["말씀 기근 경보 ⚠️", "양식이 아니라 말씀이 없는 기근이 가장 무섭다죠(암 8:11). 자정 전에 해제해 주세요."],
    ["내일의 나에게 떠넘기기 금지 🙅", "내일 일은 내일이 염려할 거예요(마 6:34). 오늘 분량은 오늘 읽기로 해요."],
  ],
  // 앱에서는 이미 읽었는데 서버에 아직 반영되지 않았을 때
  done: [
    ["오늘 통독 완료! 👏", "벌써 읽으셨네요. 잠들기 전에 오늘 말씀 한 절만 더 곱씹어 볼까요?"],
    ["착하고 충성된 통독자여 😊", "오늘 분량을 마치셨어요. 내일도 같은 자리에서 만나요."],
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
  else tier = now.getHours() < 20 ? "evening" : now.getHours() < 22 ? "night" : "last";

  const streak = fresh || (snap.date === yesterday && snap.done) ? snap.streak || 0 : 0;
  // 연속 기록 문구는 기록이 있을 때만
  const pool = MESSAGES[tier].filter((m) => m[2] !== "streak" || streak > 0);
  const lastKey = `last-${tier}`;
  const last = await idbGet(lastKey);
  let idx = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && idx === last) idx = (idx + 1) % pool.length;
  await idbSet(lastKey, idx);

  const portion = fresh && snap.portion ? snap.portion : "오늘 분량";
  const fill = (s) => s.replace(/\{portion\}/g, portion).replace(/\{streak\}/g, String(streak));
  return { title: fill(pool[idx][0]), body: fill(pool[idx][1]) };
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    const { title, body } = await buildMessage();
    await self.registration.showNotification(title, {
      body,
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
