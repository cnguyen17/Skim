// src/three/Background.tsx
// §8 ambient atmosphere — a single full-viewport shader plane: a slow drifting
// gradient in ink → cyan with a sparing yellow ember, that parallaxes toward the
// pointer. One signature moment, kept cheap (no particles, no postprocessing).
//
// Colors are passed in from tokens (§3) by the caller so this stays on-brand
// without hardcoding hex here.

import { useMemo, useRef } from "react";
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
  uniform vec2  uMouse;     // -1..1
  uniform vec3  uInk;
  uniform vec3  uAccent;
  uniform vec3  uAccent2;

  // compact value-noise
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
    for(int i = 0; i < 4; i++){ v += amp * noise(p); p *= 2.0; amp *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    vec2 p = (uv - 0.5);
    p += uMouse * 0.08;                       // pointer parallax
    float t = uTime * 0.04;

    float n = fbm(p * 2.2 + vec2(t, -t * 0.6));
    float halo = smoothstep(0.85, 0.0, length(p * vec2(1.1, 1.4)));

    // base: warm near-black, lifted slightly by noise
    vec3 col = uInk + n * 0.05;
    // cyan glow pooling toward center + mouse
    col = mix(col, uAccent * 0.5, halo * (0.35 + 0.25 * n));
    // rare yellow ember, very sparing
    float ember = smoothstep(0.6, 0.95, fbm(p * 3.0 + t)) * halo;
    col = mix(col, uAccent2 * 0.6, ember * 0.12);

    // subtle vignette to keep edges in the ink
    col *= smoothstep(1.2, 0.2, length(p));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Background({
  ink,
  accent,
  accent2,
}: {
  ink: string;
  accent: string;
  accent2: string;
}) {
  const mesh = useRef<Mesh | null>(null);
  const { viewport } = useThree();
  const target = useRef(new Vector2(0, 0));

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new Vector2(0, 0) },
          uInk: { value: new Color(ink) },
          uAccent: { value: new Color(accent) },
          uAccent2: { value: new Color(accent2) },
        },
      }),
    [ink, accent, accent2],
  );

  useFrame((state, delta) => {
    material.uniforms.uTime.value += delta;
    // ease the pointer for a liquid feel
    target.current.lerp(state.pointer, 0.05);
    (material.uniforms.uMouse.value as Vector2).copy(target.current);
  });

  // Cover the camera frustum at this plane's depth.
  return (
    <mesh ref={mesh} position={[0, 0, -2]} material={material}>
      <planeGeometry args={[viewport.width * 1.6, viewport.height * 1.6, 1, 1]} />
    </mesh>
  );
}
