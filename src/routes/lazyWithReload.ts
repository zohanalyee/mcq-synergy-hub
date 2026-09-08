import { lazy, type ComponentType } from "react";

// Retry a lazy import once, then force a single full reload on stale-chunk errors
export function lazyWithReload<T extends { default: ComponentType<any> }>(
  factory: () => Promise<T>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const key = "chunk-reloaded";
      try {
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
          return await new Promise<T>(() => {});
        }
      } catch {
        /* storage unavailable — fall through to rethrow */
      }
      throw err;
    }
  });
}
