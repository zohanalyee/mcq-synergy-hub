/**
 * Safe JSON-LD serialization.
 *
 * JSON.stringify output is NOT safe to place inside a `<script>` element:
 * a `</script>` sequence (or U+2028/U+2029) inside any string value ends the
 * script block early and lets scraped / Telegram-sourced content inject markup.
 * Escaping `<`, `>` and `&` as unicode escapes keeps the JSON semantically
 * identical while making early script termination impossible.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
