import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { account, validReminderMessages } from "../worker/src/account.js";
import reminderWorker from "../worker/src/index.js";

const require = createRequire(import.meta.url);
const { renderCard, POSES } = require("../tools/notify-art/art.js");

const emptyMessages = () => Object.fromEntries(
  ["morning", "afternoon", "evening", "night", "last", "done"].map((tier) => [tier, []]),
);

function mockEnv(userId = "buucksoo") {
  const saved = new Map();
  const db = {
    prepare() {
      return { bind() { return { first: async () => ({ user_id: userId, last: Date.now() }), run: async () => ({ success: true }) }; } };
    },
  };
  const subs = {
    async get(key, type) { const value = saved.get(key); return value && type === "json" ? JSON.parse(value) : value || null; },
    async put(key, value) { saved.set(key, value); },
    async delete(key) { saved.delete(key); },
  };
  return { env: { DB: db, SUBS: subs }, saved };
}

function responseJson(data, status = 200) { return new Response(JSON.stringify(data), { status }); }

test("reminder message database accepts only the known tiers and valid text/image rows", () => {
  const rows = emptyMessages();
  rows.morning.push(["제목", "본문 {portion}", "pray", "말풍선", "streak", "icons/notify/morning-0.jpg"]);
  assert.equal(validReminderMessages(rows), true);
  assert.equal(validReminderMessages({ ...rows, unknown: [] }), false);
  assert.equal(validReminderMessages({ ...rows, morning: [["제목", "본문", "pray", "", "", "https://bad.test/image.png"]] }), false);
  assert.equal(validReminderMessages({ ...rows, night: [["제목", "본문", "pray", "말풍선", "", "https://daily-bible-reminder.gimbap-lettuce.workers.dev/reminder-art/night/0.jpg?v=123"]] }), true);
});

test("only the administrator can read or replace the shared reminder database", async () => {
  const { env, saved } = mockEnv();
  const messages = emptyMessages();
  const put = new Request("https://worker.test/account/admin/reminder-messages", {
    method: "PUT", headers: { Authorization: "Bearer session-token" }, body: JSON.stringify({ messages }),
  });
  const result = await account("/account/admin/reminder-messages", put, env, responseJson);
  assert.equal(result.status, 200);
  assert.equal(JSON.parse(saved.get("admin:reminder-messages")).messages.done.length, 0);

  const { env: nonAdminEnv } = mockEnv("reader");
  const deniedRequest = new Request("https://worker.test/account/admin/reminder-messages", {
    method: "PUT", headers: { Authorization: "Bearer session-token" }, body: JSON.stringify({ messages }),
  });
  const denied = await account("/account/admin/reminder-messages", deniedRequest, nonAdminEnv, responseJson);
  assert.equal(denied.status, 403);
});

test("edited bubble art is stored as a shared JPEG in Worker KV", async () => {
  const { env, saved } = mockEnv();
  const messages = emptyMessages();
  messages.night.push(["제목", "본문", "pray", "수정한 말풍선", "", "https://daily-bible-reminder.gimbap-lettuce.workers.dev/reminder-art/night/0.jpg?v=123"]);
  const jpg = Buffer.from([0xff, 0xd8, 0x00, 0x00, 0xff, 0xd9]);
  const request = new Request("https://worker.test/account/admin/reminder-messages", {
    method: "PUT", headers: { Authorization: "Bearer session-token" },
    body: JSON.stringify({ messages, art: { "night:0": jpg.toString("base64") }, artDeletes: [] }),
  });
  const response = await account("/account/admin/reminder-messages", request, env, responseJson);
  assert.equal(response.status, 200);
  assert.deepEqual(new Uint8Array(saved.get("admin:reminder-art:night:0")), new Uint8Array(jpg));
});

test("shared reminder artwork endpoint serves the saved JPEG bytes", async () => {
  const jpg = new Uint8Array([0xff, 0xd8, 1, 2, 0xff, 0xd9]);
  const env = { SUBS: { async get(key, type) {
    assert.equal(key, "admin:reminder-art:night:0");
    assert.equal(type, "arrayBuffer");
    return jpg.buffer;
  } } };
  const response = await reminderWorker.fetch(
    new Request("https://worker.test/reminder-art/night/0.jpg?v=123", { headers: { Origin: "https://lettuce-and-gimbap.github.io" } }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), jpg);
});

test("worker exposes the API version required for shared reminder edits", async () => {
  const response = await reminderWorker.fetch(new Request("https://worker.test/reminder-capabilities"), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reminderMessagesApiVersion: 3, reminderArtwork: true });
});

test("editing bubble text renders that exact text into the artwork", () => {
  const phrase = "오늘은 천천히 한 장 읽고 마음에 닿는 말씀을 오래 붙들어요";
  const svg = renderCard({ tier: "night", pose: "pray", say: phrase }, (text, size) => String(text).length * size * 0.55);
  assert.ok(svg.replace(/<[^>]+>/g, "").includes(phrase));
  assert.ok((svg.match(/<tspan /g) || []).length > 1, "긴 문구는 말풍선 안에서 여러 줄로 표시해야 함");
});

test("admin reminder review has manual navigation without auto-advance controls", async () => {
  const ui = await readFile(new URL("../js/features/reminder-admin.js", import.meta.url), "utf8");
  assert.match(ui, /data-reminder-next/);
  assert.doesNotMatch(ui, /data-reminder-play|reminderAdminTimer|scheduleNext/);
  assert.match(ui, /reminderAdminHasCurrentApi/);
  assert.match(ui, /Worker가 최신 알림 저장 API를 제공하지 않습니다/);
});

test("JSON round-trip of a four-cell message preserves optional condition when artwork is added", async () => {
  const { env, saved } = mockEnv();
  const messages = emptyMessages();
  const row = ["제목", "본문", "lounge", "새 말풍선"];
  row[5] = "https://daily-bible-reminder.gimbap-lettuce.workers.dev/reminder-art/evening/0.jpg?v=123";
  messages.evening.push(row);
  const payload = JSON.stringify({ messages, art: { "evening:0": Buffer.from([255,216,0,255,217]).toString("base64") } });
  assert.equal(JSON.parse(payload).messages.evening[0][4], null);
  const response = await account("/account/admin/reminder-messages", new Request("https://worker.test/account/admin/reminder-messages", {
    method: "PUT", headers: { Authorization: "Bearer session-token" }, body: payload,
  }), env, responseJson);
  assert.equal(response.status, 200, JSON.stringify(await response.json()));
  const stored = JSON.parse(saved.get("admin:reminder-messages"));
  assert.equal(stored.messages.evening[0][4], "");
  assert.equal(stored.messages.evening[0][3], "새 말풍선");
});

const defaultSource = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
const defaultMessages = Function(`return ${defaultSource.match(/const DEFAULT_MESSAGES = (\{[\s\S]*?\n\});/)[1]}`)();
const allEntries = Object.entries(defaultMessages).flatMap(([tier, rows]) => rows.map((row, index) => ({tier,index,row})));
const testJpeg = Buffer.from([255,216,0,255,217]).toString('base64');
async function savePayload(env, payload, path = '/account/admin/reminder-messages') {
  return account(path, new Request(`https://worker.test${path}`, {
    method:'PUT', headers:{Authorization:'Bearer test'}, body:JSON.stringify(payload),
  }), env, responseJson);
}

test('all 119 actual reminders accept title, body, bubble, empty bubble and replacement art edits', async () => {
  assert.equal(allEntries.length,119);
  for (const {tier,index,row:original} of allEntries) {
    for (const variant of ['title','body','bubble','empty-bubble','replace-art']) {
      const messages = structuredClone(defaultMessages);
      const row = messages[tier][index];
      const art = {};
      if (variant === 'title') row[0] = '가'.repeat(120);
      if (variant === 'body') row[1] = '{portion} {streak} '.padEnd(600, '나');
      if (variant.includes('bubble')) {
        row[3] = variant === 'empty-bubble' ? '' : '기도 & 말씀 <함께> "읽어요" 🐑';
        row[5] = `https://daily-bible-reminder.gimbap-lettuce.workers.dev/reminder-art/${tier}/${index}.jpg?v=123`;
        art[`${tier}:${index}`] = testJpeg;
      }
      if (variant === 'replace-art') row[5] = 'icons/notify/morning-0.jpg';
      const {env,saved} = mockEnv();
      const response = await savePayload(env,{messages,art});
      assert.equal(response.status,200,`${tier}:${index} ${variant}: ${JSON.stringify(await response.json())}`);
      const stored = JSON.parse(saved.get('admin:reminder-messages')).messages[tier][index];
      assert.equal(stored[4] || '',original[4] || '', '연속 기록 조건 보존');
      assert.equal(stored[0],row[0]);
      assert.equal(stored[1],row[1]);
      if (variant.includes('bubble')) assert.equal(stored[3],row[3]);
    }
  }
});

test('all 119 artwork uploads can be batched before publishing the message DB', async () => {
  const messages = structuredClone(defaultMessages);
  for (const {tier,index} of allEntries) {
    messages[tier][index][3] = '변경한 문구';
    messages[tier][index][5] = `https://daily-bible-reminder.gimbap-lettuce.workers.dev/reminder-art/${tier}/${index}.jpg?v=123`;
  }
  const {env,saved} = mockEnv();
  for(let start=0;start<allEntries.length;start+=10) {
    const art = Object.fromEntries(allEntries.slice(start,start+10).map(({tier,index})=>[`${tier}:${index}`,testJpeg]));
    const response = await savePayload(env,{messages,art},'/account/admin/reminder-art');
    assert.equal(response.status,200,JSON.stringify(await response.json()));
    assert.equal(saved.has('admin:reminder-messages'),false);
  }
  const response = await savePayload(env,{messages});
  assert.equal(response.status,200);
  for(const {tier,index} of allEntries) assert.ok(saved.has(`admin:reminder-art:${tier}:${index}`));
});

test('replacing or resetting messages retains images still used by cached notifications', async () => {
  const {env,saved} = mockEnv();
  saved.set('admin:reminder-art:night:0',new Uint8Array([255,216,255,217]).buffer);
  const messages = structuredClone(defaultMessages);
  const response = await savePayload(env,{messages,artDeletes:['night:0']});
  assert.equal(response.status,200);
  assert.ok(saved.has('admin:reminder-art:night:0'));
  const reset = await savePayload(env,{messages:null});
  assert.equal(reset.status,200);
  assert.ok(saved.has('admin:reminder-art:night:0'));
  assert.equal(saved.has('admin:reminder-messages'),false);
});

test('temporary KV write rate limits retry without losing the edited message', async () => {
  const {env,saved} = mockEnv();
  const put=env.SUBS.put;
  let attempts=0;
  env.SUBS.put=async(key,value)=>{if(attempts++===0)throw Error('KV PUT failed: 429 Too Many Requests');return put(key,value);};
  const messages=structuredClone(defaultMessages);messages.morning[0][0]='재시도 후 저장';
  const response=await savePayload(env,{messages});
  assert.equal(response.status,200);
  assert.equal(attempts,2);
  assert.equal(JSON.parse(saved.get('admin:reminder-messages')).messages.morning[0][0],'재시도 후 저장');
});


test('all 119 reminder images exist and reference supported renderer poses', async () => {
  for(const {tier,index,row} of allEntries) {
    assert.equal(typeof POSES[row[2]],'function',`${tier}:${index} pose`);
    const image=await readFile(new URL(`../icons/notify/${tier}-${index}.jpg`,import.meta.url));
    assert.equal(image[0],255);assert.equal(image[1],216);
  }
});

test('empty optional image slots use defaults while invalid required values cannot overwrite saved DB', async () => {
  const {env,saved}=mockEnv();
  const messages=structuredClone(defaultMessages);messages.morning[0][5]=null;
  assert.equal((await savePayload(env,{messages})).status,200);
  const previous=saved.get('admin:reminder-messages');
  messages.morning[0][0]=null;
  const rejected=await savePayload(env,{messages});
  assert.equal(rejected.status,400);
  assert.equal(saved.get('admin:reminder-messages'),previous);
});

test('failed image uploads leave the published message DB untouched', async () => {
  const {env,saved}=mockEnv();
  const messages=structuredClone(defaultMessages);
  await savePayload(env,{messages});
  const previous=saved.get('admin:reminder-messages');
  messages.night[0][5]='https://daily-bible-reminder.gimbap-lettuce.workers.dev/reminder-art/night/0.jpg?v=123';
  const put=env.SUBS.put;
  env.SUBS.put=async(key,value)=>{if(key.startsWith('admin:reminder-art:'))throw Error('storage unavailable');return put(key,value);};
  await assert.rejects(savePayload(env,{messages,art:{'night:0':testJpeg}}),/storage unavailable/);
  assert.equal(saved.get('admin:reminder-messages'),previous);
});
