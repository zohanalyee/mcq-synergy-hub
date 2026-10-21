import { lazy, type ComponentType } from "react";
import { reloadOnce } from "@/lib/chunkErrors";

// Retry a lazy import once, then force a single guarded full reload on stale-chunk errors
export function lazyWithReload<T extends { default: ComponentType<any> }>(
  factory: () => Promise<T>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      try {
        if (reloadOnce(sessionStorage, () => window.location.reload())) {
          return await new Promise<T>(() => {});
        }
      } catch {
        /* storage unavailable — fall through to rethrow */
      }
      throw err;
    }
  });
}
