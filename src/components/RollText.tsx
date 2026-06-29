// src/components/RollText.tsx
// §3 signature animation — per-letter "roll" on hover/focus. Each grapheme gets
// two stacked copies (::before/::after via CSS); one rolls out as the other
// rolls in, staggered per letter. The per-letter delay is set in JS (--i) so it
// works cross-browser (no Chrome-only sibling-index()).
//
// Pseudo-element color cannot use currentColor (the .rl spans are transparent),
// so we snapshot the computed .roll color into --roll-fg after paint.

import { createElement, useLayoutEffect, useRef, type ElementType } from "react";

function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function syncRollColor(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const { color, fontSize } = cs;
  if (color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent") {
    el.style.setProperty("--roll-fg", color);
  }
  if (fontSize) {
    el.style.setProperty("--roll-fs", fontSize);
  }
}

export function RollText({
  text,
  as = "span",
  className = "",
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const chars = graphemes(text);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    syncRollColor(el);
    const ro = new ResizeObserver(() => syncRollColor(el));
    ro.observe(el);
    return () => ro.disconnect();
  }, [className, text]);

  return createElement(
    as,
    { ref: rootRef, className: `roll ${className}`.trim(), "aria-label": text },
    chars.map((c, i) =>
      createElement("span", {
        key: i,
        className: "rl",
        style: {
          "--i": i,
          width: c === " " ? "0.35em" : "1ch",
        } as React.CSSProperties,
        "data-char": c === " " ? " " : c,
        "aria-hidden": true,
      }),
    ),
  );
}
