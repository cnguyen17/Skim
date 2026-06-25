// src/lib/gsap.ts
// Single place that registers GSAP plugins, so every component imports gsap +
// ScrollTrigger from here and registration happens exactly once.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
