import test from "node:test";
import assert from "node:assert/strict";
import { BLOG_MIN_WORDS, blogWordCount, isBlogIndexable } from "./blogIndexability.js";

test("blog indexability requires at least 300 words", () => {
  assert.equal(BLOG_MIN_WORDS, 300);
  assert.equal(isBlogIndexable("word ".repeat(80)), false);
  assert.equal(isBlogIndexable("word ".repeat(299)), false);
  assert.equal(isBlogIndexable("word ".repeat(300)), true);
});

test("HTML and markdown decoration do not add words", () => {
  const content = `<article><h2>## Heading</h2><p>${"word ".repeat(298)}</p></article>`;
  assert.equal(blogWordCount(content), 299);
  assert.equal(isBlogIndexable(content), false);
});

test("missing content is not indexable", () => {
  assert.equal(isBlogIndexable(null), false);
  assert.equal(isBlogIndexable(undefined), false);
  assert.equal(isBlogIndexable(""), false);
});