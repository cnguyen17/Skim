// src/components/RollText.tsx
// §3 signature animation — per-letter "roll" on hover/focus. Each grapheme gets
// two stacked copies (::before/::after via CSS); one rolls out as the other
// rolls in, staggered per letter. The per-letter delay is set in JS (--i) so it
// works cross-browser (no Chrome-only sibling-index()).
//
// §11: under reduced motion the global CSS zeroes the transitions, so the text
// simply shows statically — still fully legible.

import { createElement, type ElementType } from "react";

function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
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
  const chars = graphemes(text);

  return createElement(
    as,
    { className: `roll ${className}`.trim(), "aria-label": text },
    chars.map((c, i) =>
      createElement(
        "span",
        {
          key: i,
          className: "rl",
          style: { "--i": i } as React.CSSProperties,
          "data-char": c === " " ? " " : c,
          "aria-hidden": true,
        },
        c === " " ? " " : c,
      ),
    ),
  );
}
