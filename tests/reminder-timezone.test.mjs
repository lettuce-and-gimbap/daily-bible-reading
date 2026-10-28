import test from "node:test";
import assert from "node:assert/strict";
import { daySlots, isReminderWindowOpen, localClock, normalizeTimeZone } from "../worker/src/index.js";

test("reminder clock follows each IANA timezone, including local date boundaries", () => {
  const at = new Date("2026-10-28T00:00:00.000Z");
  assert.deepEqual(localClock(at, "Asia/Seoul"), { date: "2026-10-28", hour: 9, minute: 0 });
  assert.deepEqual(localClock(at, "America/New_York"), { date: "2026-10-27", hour: 20, minute: 0 });
});

test("invalid or missing timezone safely falls back to Korea", () => {
  assert.equal(normalizeTimeZone("not/a-zone"), "Asia/Seoul");
  assert.equal(normalizeTimeZone(undefined), "Asia/Seoul");
  assert.deepEqual(localClock(new Date("2026-10-28T00:00:00Z"), "not/a-zone"), {
    date: "2026-10-28", hour: 9, minute: 0,
  });
});

test("the reminder window is closed from local midnight through 06:59 and open at 07:00", () => {
  assert.equal(isReminderWindowOpen(new Date("2026-10-27T21:00:00Z"), "Asia/Seoul"), false); // 06:00
  assert.equal(isReminderWindowOpen(new Date("2026-10-27T21:55:00Z"), "Asia/Seoul"), false); // 06:55
  assert.equal(isReminderWindowOpen(new Date("2026-10-27T22:00:00Z"), "Asia/Seoul"), true); // 07:00
  assert.equal(isReminderWindowOpen(new Date("2026-10-28T10:00:00Z"), "America/New_York"), false); // 06:00
  assert.equal(isReminderWindowOpen(new Date("2026-10-28T11:00:00Z"), "America/New_York"), true); // 07:00
});

test("daily reminder slots stay inside 07:00–23:55 and are unique per subscriber", () => {
  for (const id of ["one", "two", "subscriber-🌱"]) {
    const slots = daySlots(id, "2026-10-28");
    assert.equal(slots.length, 7);
    assert.equal(new Set(slots).size, 7);
    assert.ok(slots.every((slot) => slot >= 84 && slot < 288));
  }
});
