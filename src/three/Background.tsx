// src/three/Background.tsx
// HERO_SEQUENCE §2A — the ambient background. A single fullscreen shader plane
// drawing slow, drifting topographic CONTOUR LINES (domain-warped fbm so the
// curves are smooth and organic, not polygonal), with subtle pointer parallax.
//
// Two things drive it from the hero scroll:
//   • uMix (0..1, from the shared `progress` ref) lerps the whole scene milk→ink
//     and inverts the line color — the page "flips to dark" as you scroll.
//   • the centerpiece box stays a WINDOW INTO THE LIGHT layer: inside its rect the
//     scene stays light (lines continue through it) while everything outside
//     darkens. The box rect is read live from the DOM each frame, so it tracks the
//     window's scroll-driven scale/move exactly.
//
// The plane exactly fills the frustum at z=0, so vUv == screen UV (needed for the
// box mask). Lines are anti-aliased in screen space (fwidth) — no mobile moiré.
// Colors come from tokens (§3) via the caller, so nothing is hardcoded here.

import { useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, ShaderMaterial, Vector2, type Mesh } from "three";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uMix;        // 0 = light/milk, 1 = dark/ink
  uniform float uAspect;     // viewport w/h
  uniform vec2  uMouse;      // eased pointer, -1..1
  uniform vec2  uBoxCenter;  // centerpiece rect center in screen UV
  uniform vec2  uBoxHalf;    // centerpiece rect half-size in screen UV
  uniform vec3  uSurface;    // light background
  uniform vec3  uInk;        // dark background
  uniform vec3  uLineLo;     // line color on light bg
  uniform vec3  uLineHi;     // line color on dark bg
  uniform vec3  uAccent;     // cyan highlight

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // quintic — smooth, no creases
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0; float amp = 0.5;
    for(int i = 0; i < 5; i++){ v += amp * noise(p); p *= 2.0; amp *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    vec2 p = uv - 0.5;
    p.x *= uAspect;
    p += uMouse * 0.05;                 // pointer parallax
    float t = uTime * 0.025;

    // domain-warped height field -> smooth, flowing contours
    vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, 1.7)), fbm(p * 1.6 + vec2(4.3, 2.1)));
    float h = fbm(p * 1.6 + 0.7 * q + vec2(t, -t * 0.6));

    // CONTOUR iso-lines at regular height intervals, AA in screen space
    float lines = 6.0;
    float v = h * lines;
    float d = abs(fract(v - 0.5) - 0.5) / fwidth(v);
    float line = 1.0 - clamp(d, 0.0, 1.0);

    // local mix: inside the centerpiece box the scene stays LIGHT (window into the
    // light layer) while everything outside follows the scroll-driven uMix.
    vec2 bd = abs(uv - uBoxCenter) - uBoxHalf;
    float outside = max(bd.x, bd.y);
    float inBox = 1.0 - smoothstep(-0.004, 0.004, outside);
    float m = mix(uMix, 0.0, inBox);

    vec3 bg = mix(uSurface, uInk, m);
    vec3 lineCol = mix(uLineLo, uLineHi, m);

    // faint cyan pooling toward center/mouse
    float halo = smoothstep(0.9, 0.0, length(p));
    lineCol = mix(lineCol, uAccent, halo * 0.18);

    float strength = mix(0.5, 0.36, m); // settle lines a touch as it darkens
    vec3 col = mix(bg, lineCol, line * strength);

    // gentle vignette into the base tone
    col = mix(col, bg, smoothstep(0.65, 1.35, length(uv - 0.5)) * 0.4);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Background({
  progress,
  box,
  surface,
  ink,
  lineLo,
  lineHi,
  accent,
}: {
  /** shared hero scroll progress (0..1); drives the light→dark mix */
  progress: RefObject<number>;
  /** the centerpiece window element; its live rect stays the light "window" */
  box: RefObject<HTMLElement | null>;
  surface: string;
  ink: string;
  lineLo: string;
  lineHi: string;
  accent: string;
}) {
  const mesh = useRef<Mesh | null>(null);
  const { viewport } = useThree();
  const target = useRef(new Vector2(0, 0));

  const material = useMemo(() => {
    const c = (v: string) => new Color(v); // Color ignores alpha — by design
    return new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uAspect: { value: 1 },
        uMouse: { value: new Vector2(0, 0) },
        uBoxCenter: { value: new Vector2(0.5, 0.5) },
        uBoxHalf: { value: new Vector2(0, 0) },
        uSurface: { value: c(surface) },
        uInk: { value: c(ink) },
        uLineLo: { value: c(lineLo) },
        uLineHi: { value: c(lineHi) },
        uAccent: { value: c(accent) },
      },
    });
  }, [surface, ink, lineLo, lineHi, accent]);

  useFrame((state, delta) => {
    const u = material.uniforms;
    u.uTime.value += delta;
    u.uAspect.value = viewport.width / viewport.height;

    // light→dark ramp (beat sheet: bg begins ~0.15, fully dark ~0.42)
    const p = progress.current ?? 0;
    u.uMix.value = Math.min(1, Math.max(0, (p - 0.15) / 0.27));

    // eased pointer parallax
    target.current.lerp(state.pointer, 0.05);
    (u.uMouse.value as Vector2).copy(target.current);

    // live box rect → screen UV (y up). Reflects the GSAP scale/translate.
    const el = box.current;
    if (el && typeof window !== "undefined") {
      const r = el.getBoundingClientRect();
      const W = window.innerWidth || 1;
      const H = window.innerHeight || 1;
      (u.uBoxCenter.value as Vector2).set(
        (r.left + r.right) / 2 / W,
        1 - (r.top + r.bottom) / 2 / H,
      );
      (u.uBoxHalf.value as Vector2).set(r.width / 2 / W, r.height / 2 / H);
    }
  });

  // Fill the frustum exactly at z=0 so vUv maps 1:1 to the screen.
  return (
    <mesh ref={mesh} position={[0, 0, 0]} material={material}>
      <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
    </mesh>
  );
}
