import test from "node:test";
import assert from "node:assert/strict";
import { account, validReminderMessages } from "../worker/src/account.js";

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
