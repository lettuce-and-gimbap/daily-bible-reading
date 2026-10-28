import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { account, validReminderMessages } from "../worker/src/account.js";
import reminderWorker from "../worker/src/index.js";

const require = createRequire(import.meta.url);
const { renderCard } = require("../tools/notify-art/art.js");

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
});
