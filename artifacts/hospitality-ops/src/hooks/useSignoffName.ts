import { useCallback, useState } from "react";

const KEY = "kc_signoff_name";

/**
 * Persists the user's signoff name in localStorage so swipe-to-complete
 * picks it up automatically on subsequent swipes.
 */
export function useSignoffName() {
  const [name, setNameState] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY) ?? "";
    } catch {
      return "";
    }
  });

  const setName = useCallback((n: string) => {
    setNameState(n);
    try {
      localStorage.setItem(KEY, n);
    } catch {}
  }, []);

  return { name, setName };
}
