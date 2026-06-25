// src/hooks/useReducedMotion.ts
// §11 accessibility plumbing — single source for the prefers-reduced-motion
// signal. Components/providers read this to disable Lenis, freeze the 3D, and
// swap reveals for instant opacity. Reacts live if the user changes the OS pref.

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== "undefined" && "matchMedia" in window
      ? window.matchMedia(QUERY).matches
      : false,
  );

  useEffect(() => {
    if (!("matchMedia" in window)) return;
    const mql = window.matchMedia(QUERY);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
