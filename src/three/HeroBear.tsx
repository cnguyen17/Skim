// src/three/HeroBear.tsx
// §7 hero centerpiece — a textured plane inside the 3D scene with idle float +
// pointer parallax and soft lighting. The artwork is a SWAPPABLE LAYER: it takes
// a `src` (defaulting to the provided wordmark as a stand-in until the owner
// drops in bear.svg / the v2 portrait). Nothing here assumes "bear", so the
// camera/scroll logic in HeroScene is unaffected when the art changes.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { MathUtils, type Group, type Texture } from "three";

export function HeroBear({
  src,
  height = 3.2,
}: {
  src: string;
  /** world-units tall; width derives from the texture aspect */
  height?: number;
}) {
  const group = useRef<Group | null>(null);
  const texture = useTexture(src) as Texture;
  const img = texture.image as { width: number; height: number } | undefined;
  const aspect = img && img.height ? img.width / img.height : 1;

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const { x, y } = state.pointer;
    // idle float
    g.position.y = Math.sin(t * 0.8) * 0.12;
    // ease rotation toward the pointer for parallax depth
    g.rotation.y = MathUtils.lerp(g.rotation.y, x * 0.35, 0.06);
    g.rotation.x = MathUtils.lerp(g.rotation.x, -y * 0.22, 0.06);
    g.position.x = MathUtils.lerp(g.position.x, x * 0.25, 0.06);
  });

  return (
    <group ref={group}>
      <mesh>
        <planeGeometry args={[height * aspect, height, 1, 1]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}
