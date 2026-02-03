import type { DeferredAction } from "@/lib/types";

const STORAGE_KEY = "olera_deferred_action";
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export function setDeferredAction(action: Omit<DeferredAction, "createdAt">) {
  if (typeof window === "undefined") return;

  const entry: DeferredAction = {
    ...action,
    createdAt: new Date().toISOString(),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function getDeferredAction(): DeferredAction | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const entry: DeferredAction = JSON.parse(raw);
    const age = Date.now() - new Date(entry.createdAt).getTime();

    // Expire stale entries
    if (age > MAX_AGE_MS) {
      clearDeferredAction();
      return null;
    }

    return entry;
  } catch {
    clearDeferredAction();
    return null;
  }
}

export function clearDeferredAction() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
