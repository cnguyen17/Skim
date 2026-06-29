// src/hooks/useMediaQuery.ts
// Small SSR-safe matchMedia hook. Used by WorkFridge to fall back to the simple
// tabbed grid on small screens (the 2.5D fridge is a desktop progressive
// enhancement — see WorkFridge.tsx / §8 fallback rules).

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== "undefined" && "matchMedia" in window
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (!("matchMedia" in window)) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
