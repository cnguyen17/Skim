// src/three/Background.tsx
// HERO_SEQUENCE §2A — the ambient background (highest priority). A single
// full-viewport shader plane drawing slow, drifting topographic CONTOUR LINES
// with subtle pointer parallax. Its whole tone inverts light → dark as the hero
// scrolls: one uniform, `uMix`, lerps milk → ink and inverts the line color.
//
// `uMix` is read every frame from the shared hero `progress` ref (0..1) and
// remapped to the HERO_SEQUENCE background ramp (~0.15 → 0.42). Lines are
// anti-aliased in screen space (fwidth) so they stay crisp — no moiré on mobile.
//
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
  uniform float uMix;       // 0 = light/milk, 1 = dark/ink
  uniform float uAspect;    // viewport w/h, to keep lines from stretching
  uniform vec2  uMouse;     // eased pointer, -1..1
  uniform vec3  uSurface;   // light background
  uniform vec3  uInk;       // dark background
  uniform vec3  uLineLo;    // line color on light bg
  uniform vec3  uLineHi;    // line color on dark bg
  uniform vec3  uAccent;    // cyan, used as a faint highlight band

  // compact value-noise + fbm (cheap; no textures)
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0; float amp = 0.5;
    for(int i = 0; i < 5; i++){ v += amp * noise(p); p *= 2.0; amp *= 0.5; }
    return v;
  }

  void main(){
    // center + aspect-correct so contours read as round-ish topography
    vec2 p = vUv - 0.5;
    p.x *= uAspect;
    p += uMouse * 0.06;                 // pointer parallax

    // a slowly evolving height field
    float t = uTime * 0.03;
    float h = fbm(p * 2.3 + vec2(t, -t * 0.7));
    h += 0.15 * fbm(p * 5.0 - vec2(t * 0.5, t)); // fine ripples

    // CONTOUR lines: iso-lines of the height field at regular intervals.
    float lines = 9.0;                  // number of contour bands
    float v = h * lines;
    float d = abs(fract(v - 0.5) - 0.5) / fwidth(v); // AA distance to nearest line
    float line = 1.0 - clamp(d, 0.0, 1.0);
    line = pow(line, 1.3);              // crisp edges, soft falloff

    // background tone milk -> ink
    vec3 bg = mix(uSurface, uInk, uMix);
    // line tone: dark-on-light -> light-on-dark
    vec3 lineCol = mix(uLineLo, uLineHi, uMix);

    // a faint cyan highlight pooling toward center/mouse, applied to the lines
    float halo = smoothstep(0.9, 0.0, length(p));
    lineCol = mix(lineCol, uAccent, halo * 0.25);

    // fade lines slightly as the scene darkens so the dark page below stays calm
    float strength = mix(0.55, 0.40, uMix);
    vec3 col = mix(bg, lineCol, line * strength);

    // gentle vignette keeps the edges settled in the base tone
    col = mix(col, bg, smoothstep(0.6, 1.3, length(vUv - 0.5)) * 0.5);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Background({
  progress,
  surface,
  ink,
  lineLo,
  lineHi,
  accent,
}: {
  /** shared hero scroll progress (0..1); drives the light→dark mix */
  progress: RefObject<number>;
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
    // tokens may be rgba(...) — three's Color ignores alpha, which is what we
    // want (the alpha is baked into the line `strength` instead).
    const c = (v: string) => new Color(v);
    return new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uAspect: { value: 1 },
        uMouse: { value: new Vector2(0, 0) },
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
    // ramp the light→dark mix from the hero scroll progress (HERO_SEQUENCE beat
    // sheet: background begins ~0.15, fully dark ~0.42).
    const p = progress.current ?? 0;
    u.uMix.value = Math.min(1, Math.max(0, (p - 0.15) / 0.27));
    // ease the pointer for a liquid feel
    target.current.lerp(state.pointer, 0.05);
    (u.uMouse.value as Vector2).copy(target.current);
  });

  // Cover the camera frustum at this plane's depth.
  return (
    <mesh ref={mesh} position={[0, 0, -2]} material={material}>
      <planeGeometry args={[viewport.width * 1.6, viewport.height * 1.6, 1, 1]} />
    </mesh>
  );
}
