// src/three/Background.tsx
// HERO_SEQUENCE §2A — the ambient background. A single fullscreen shader plane
// drawing a slow, flowing "LIQUID MARBLE": domain-warped fractal noise (fbm whose
// sample coordinates are themselves warped by fbm) animated over time, for a
// chaotic, organic paint-swirl motion, with subtle pointer parallax.
//
// Two things drive it from the hero scroll:
//   • uMix (0..1, from the shared `progress` ref) lerps the field OUTSIDE the
//     cyan frame milk→ink, so the page goes dark around the letterbox.
//   • the live centerpiece rect (uBox*) keeps LIGHT marble IN motion inside the
//     frame — not a flat milk DOM fill — so the cutout sits on the same cream
//     swirl as the open hero. The mask is inset + AA'd under the cyan border so
//     cream doesn't bleed past the rounded frame.
//
// Readability is a hard rule (brief): the marble is kept LOW-CONTRAST and dimmed
// (uContrast + a vignette toward the base tone) so the hero face and headline stay
// legible — it reads as ambient texture, not a full-strength B/W swirl.
//
// The plane exactly fills the frustum at z=0, so vUv == screen UV (needed for the
// box mask). Both colors come from tokens (§3) via the caller — sourcing cream vs.
// white (or a future palette) is a one-line swap there, nothing hardcoded here.
//
// Mobile/cheap mode: `lowPower` compiles a lighter shader (fewer fbm octaves +
// a single warp pass) so the same effect runs on weak GPUs. Reduced motion is
// handled upstream in Hero.tsx (the canvas is not mounted; a calm static
// fallback shows instead), which freezes the scene to a static frame.

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

// Built per quality tier: OCTAVES + the HQ warp pass are #define'd in so the loop
// bounds stay constant (GLSL requires it) and the cheap path drops real work.
const fragmentFor = (lowPower: boolean) => /* glsl */ `
  precision highp float;
  #define OCTAVES ${lowPower ? 3 : 5}
  ${lowPower ? "" : "#define HQ_WARP"}
  varying vec2 vUv;
  uniform float uTime;
  uniform float uMix;         // 0 = light/milk, 1 = dark/ink
  uniform float uAspect;      // viewport w/h
  uniform float uContrast;    // marble strength — kept LOW so content stays legible
  uniform vec2  uMouse;       // eased pointer, -1..1
  uniform vec2  uBoxCenter;   // centerpiece rect center in screen UV
  uniform vec2  uBoxHalf;     // centerpiece rect half-size in screen UV
  uniform vec2  uBoxRadius;   // corner radius in screen UV (x/y)
  uniform vec3  uColorLight;  // light tone  (token --milk)
  uniform vec3  uColorDark;   // dark tone   (token --ink)
  uniform vec3  uAccent;      // cyan highlight (very faint)

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
    for(int i = 0; i < OCTAVES; i++){ v += amp * noise(p); p = p * 2.0 + vec2(11.3, 7.7); amp *= 0.5; }
    return v;
  }

  // Rounded rect SDF in screen UV. Negative = inside.
  float sdRoundBox(vec2 uv, vec2 center, vec2 halfSize, vec2 radius){
    float r = min(min(radius.x, radius.y), min(halfSize.x, halfSize.y));
    vec2 q = abs(uv - center) - halfSize + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main(){
    vec2 uv = vUv;
    vec2 p = uv - 0.5;
    p.x *= uAspect;
    p += uMouse * 0.06;                 // pointer parallax
    float t = uTime * 0.075;            // livelier drift

    // Domain warp (IQ-style): fbm of fbm-warped coords -> flowing, chaotic marble.
    // Stronger warp gain + faster phases = more turbulent, distinct swirls.
    vec2 q = vec2(
      fbm(p * 1.7 + vec2(0.0, 0.0) + t),
      fbm(p * 1.7 + vec2(5.2, 1.3) - t * 0.9)
    );
    #ifdef HQ_WARP
      vec2 r = vec2(
        fbm(p * 1.7 + 2.6 * q + vec2(1.7, 9.2) + 0.8 * t),
        fbm(p * 1.7 + 2.6 * q + vec2(8.3, 2.8) - 0.7 * t)
      );
      float f = fbm(p * 1.7 + 2.8 * r);
    #else
      float f = fbm(p * 1.7 + 2.6 * q);
    #endif
    f = clamp(f, 0.0, 1.0);
    f = smoothstep(0.36, 0.64, f);     // tighter band -> distinct, high-contrast veins

    // Light marble stays inside the cyan frame; outside follows scroll → ink.
    // Tiny AA under the DOM border so cream doesn't spill past the blue stroke.
    float sd = sdRoundBox(uv, uBoxCenter, uBoxHalf, uBoxRadius);
    float inside = 1.0 - smoothstep(-0.0015, 0.0015, sd);
    float m = mix(uMix, 0.0, inside);

    // Two color uniforms, lerped by local mix: base tone flips light->dark while the
    // swirl tone is its opposite, so the swirl stays visible at both ends.
    vec3 base  = mix(uColorLight, uColorDark, m);
    vec3 swirl = mix(uColorDark,  uColorLight, m);
    vec3 col = mix(base, swirl, f * uContrast);

    // Brand color into the brightest veins so the marble reads as COLORED, not B/W.
    float veins = smoothstep(0.62, 1.0, f);
    col = mix(col, uAccent, veins * 0.28);

    // faint cyan pooling toward center/mouse (brand glint)
    float halo = smoothstep(0.95, 0.0, length(p));
    col = mix(col, uAccent, halo * 0.07);

    // light vignette into the base tone — softens the edges without flattening
    col = mix(col, base, smoothstep(0.78, 1.45, length(uv - 0.5)) * 0.35);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Background({
  progress,
  box,
  colorLight,
  colorDark,
  accent,
  contrast = 0.62,
  lowPower = false,
}: {
  /** shared hero scroll progress (0..1); drives the light→dark mix */
  progress: RefObject<number>;
  /** the centerpiece window element; its live rect stays the light "window" */
  box: RefObject<HTMLElement | null>;
  /** light tone (token --milk) — swirl/base swap with scroll */
  colorLight: string;
  /** dark tone (token --ink) */
  colorDark: string;
  accent: string;
  /** marble strength; keep low so the hero stays readable */
  contrast?: number;
  /** compile a cheaper shader for weak GPUs / mobile */
  lowPower?: boolean;
}) {
  const mesh = useRef<Mesh | null>(null);
  const { viewport } = useThree();
  const target = useRef(new Vector2(0, 0));

  const material = useMemo(() => {
    const c = (v: string) => new Color(v); // Color ignores alpha — by design
    return new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragmentFor(lowPower),
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uAspect: { value: 1 },
        uContrast: { value: contrast },
        uMouse: { value: new Vector2(0, 0) },
        uBoxCenter: { value: new Vector2(0.5, 0.5) },
        uBoxHalf: { value: new Vector2(0.5, 0.5) },
        uBoxRadius: { value: new Vector2(0, 0) },
        uColorLight: { value: c(colorLight) },
        uColorDark: { value: c(colorDark) },
        uAccent: { value: c(accent) },
      },
    });
  }, [colorLight, colorDark, accent, contrast, lowPower]);

  useFrame((state, delta) => {
    const u = material.uniforms;
    u.uTime.value += delta;
    u.uAspect.value = viewport.width / viewport.height;

    // Outside the frame: light→dark as the window shrinks. Inside stays light.
    const p = progress.current ?? 0;
    u.uMix.value = Math.min(1, Math.max(0, (p - 0.04) / 0.24));

    // eased pointer parallax
    target.current.lerp(state.pointer, 0.05);
    (u.uMouse.value as Vector2).copy(target.current);

    // live box rect → screen UV (y up). Reflects the GSAP scale/translate.
    // Prefer visualViewport on mobile so the light window tracks the cyan frame
    // when the URL bar resizes the layout vs visual viewport.
    const el = box.current;
    if (el && typeof window !== "undefined") {
      const r = el.getBoundingClientRect();
      const vv = window.visualViewport;
      const W = vv?.width || window.innerWidth || 1;
      const H = vv?.height || window.innerHeight || 1;
      const ox = vv?.offsetLeft || 0;
      const oy = vv?.offsetTop || 0;
      // Inset ~2px under the cyan stroke so cream stays inside the border.
      const inset = 2;
      const radius = 12;
      (u.uBoxCenter.value as Vector2).set(
        (r.left - ox + r.width / 2) / W,
        1 - (r.top - oy + r.height / 2) / H,
      );
      (u.uBoxHalf.value as Vector2).set(
        Math.max(0, r.width / 2 - inset) / W,
        Math.max(0, r.height / 2 - inset) / H,
      );
      (u.uBoxRadius.value as Vector2).set(radius / W, radius / H);
    }
  });

  // Fill the frustum exactly at z=0 so vUv maps 1:1 to the screen.
  return (
    <mesh ref={mesh} position={[0, 0, 0]} material={material}>
      <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
    </mesh>
  );
}
