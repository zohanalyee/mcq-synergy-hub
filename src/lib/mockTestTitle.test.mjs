import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMockTestTitle } from "./mockTestTitle.js";

test("title already ending in | MCQsAI is used unchanged", () => {
  const t = "STS EST Physics Mock Test, MCQs & Past Papers | MCQsAI";
  assert.equal(buildMockTestTitle(t), t);
});

test("short title gets the brand suffix", () => {
  assert.equal(
    buildMockTestTitle("Sindh Health Vaccinator BPS-06 Mock Test & MCQs"),
    "Sindh Health Vaccinator BPS-06 Mock Test & MCQs | MCQsAI",
  );
});

test("title that would pass 65 characters with suffix stays bare", () => {
  const t = "Junior Office Associate BPS-13 Mock Test, MCQs & Past Papers"; // 60
  assert.equal(buildMockTestTitle(t), t);
});

test("exactly 65 with suffix is allowed", () => {
  const t = "x".repeat(54);
  assert.equal(buildMockTestTitle(t).length, 65);
});
