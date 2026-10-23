import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyVerdict, isStalled } from "./qualityReportVerdict.js";

const now = Date.parse("2026-10-23T12:00:00Z");
const fresh = "2026-10-23T11:00:00Z";

test("stalled after exactly 6 hours, not at 5h59m", () => {
  assert.equal(isStalled("2026-10-23T06:00:00Z", now), true);
  assert.equal(isStalled("2026-10-23T06:01:00Z", now), false);
  assert.equal(isStalled(null, now), true);
});

test("background paid use beats everything", () => {
  assert.match(dailyVerdict({ paidBackground: 1, lastReviewIso: null, rateLimited: 99, newFails: 5 }, now), /paid/);
});

test("stalled comes before 429s and fails", () => {
  assert.match(dailyVerdict({ lastReviewIso: "2026-10-23T01:00:00Z", rateLimited: 99, newFails: 5 }, now), /stalled/);
});

test("429s come before new fails", () => {
  assert.match(dailyVerdict({ lastReviewIso: fresh, rateLimited: 20, newFails: 5 }, now), /429/);
});

test("new fails when nothing worse", () => {
  assert.match(dailyVerdict({ lastReviewIso: fresh, rateLimited: 19, newFails: 2 }, now), /2 new failed/);
});

test("All OK when nothing wrong", () => {
  assert.equal(dailyVerdict({ lastReviewIso: fresh }, now), "All OK");
});
