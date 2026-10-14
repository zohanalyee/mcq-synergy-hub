// Shared, deterministic internal-link rule for board topic pages.
// Used by BOTH src/pages/BoardTopicPage.tsx (client) and scripts/inject-meta.mjs
// (static HTML), so both emit the exact same hrefs. No randomness.
//
// Input `order` is src/generated/topicOrder.json: hub path -> indexable topic
// paths in curriculum order.
//
// Rule for a topic at index i in a hub of N indexable topics:
//   prev     = i-1 (none on the first topic)
//   next     = i+1 (none on the last topic)
//   siblings = circular window i+1, i-1, i+2, i-2, i+3, i-3 (deduped, self excluded)
// Every indexable topic therefore receives a link from min(N-1, 6) siblings
// plus its subject hub. A non-indexable topic gets no prev/next and the first
// SIBLING_WINDOW indexable topics of its hub.

export const SIBLING_WINDOW = 6;

export function hubPathOf(topicPath) {
  return String(topicPath || "").split("/").slice(0, 5).join("/");
}

export function topicLinks(order, topicPath) {
  const hub = hubPathOf(topicPath);
  const list = (order && order[hub]) || [];
  const i = list.indexOf(topicPath);
  if (i === -1) {
    return { hub, prev: null, next: null, siblings: list.slice(0, SIBLING_WINDOW) };
  }
  const n = list.length;
  const siblings = [];
  const half = SIBLING_WINDOW / 2;
  for (let k = 1; k <= half; k++) {
    for (const j of [(i + k) % n, (((i - k) % n) + n) % n]) {
      const p = list[j];
      if (p !== topicPath && !siblings.includes(p)) siblings.push(p);
    }
  }
  return {
    hub,
    prev: i > 0 ? list[i - 1] : null,
    next: i < n - 1 ? list[i + 1] : null,
    siblings,
  };
}

export function humanizeSlug(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
