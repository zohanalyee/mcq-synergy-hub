// Single source of truth for blog indexability. Used by BlogPost.tsx (browser),
// scripts/inject-meta.mjs (prerender) and scripts/generate-sitemaps.mjs (blog.xml).
export const BLOG_MIN_WORDS = 300;

export function blogWordCount(content) {
  return String(content || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~\-!\[\]()]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function isBlogIndexable(content) {
  return blogWordCount(content) >= BLOG_MIN_WORDS;
}
