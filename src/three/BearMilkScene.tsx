// src/three/BearMilkScene.tsx
// The signature Bio scene: the bear-leaning-on-a-milk-carton GLB, wearing the
// Nutrition-Facts card as a label across the carton's front face.
//
// The export is a SINGLE fused, unrigged mesh (bear + carton in one geometry,
// one baked texture). So:
//   • HEAD-ONLY motion is synthesised at load time: we convert the mesh to a
//     SkinnedMesh with two bones (body + head) and weight vertices to the head
//     bone by height with a smooth falloff across the neck, then rotate only the
//     head bone toward the cursor. The body never moves. The head target is built
//     in WORLD space and converted into the bone's local frame, so it stays a
//     clean turn/nod no matter how the whole model is yawed for framing.
//   • The CARTON keeps its own geometry from the GLB; we float the Nutrition-Facts
//     CanvasTexture on a plane just proud of its front face (tunable below).

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import {
  Bone,
  Box3,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  Skeleton,
  SkinnedMesh,
  Uint16BufferAttribute,
  Vector3,
  type Material,
} from "three";
import { useLabelTexture } from "./useLabelTexture";
import { BEAR_URL } from "./bearAssets";

// Compressed (148k-tri, meshopt, 1K) replacement for the raw Tripo export.
// Prefer preloadBearAssets() from Home so this is warm before Bio scrolls in.

// ─── Tunables ────────────────────────────────────────────────────────────────
// Framing of the whole piece inside the (tall) Bio column.
// Exported so the temp /_model tuner can override yaw/label live; safe to inline.
export const MODEL = {
  yaw: MathUtils.degToRad(-120),
  scale: 1, // base — BioFraming scales to fill the canvas ear-to-feet
  position: [-0.45, 0, 0] as [number, number, number], // x bias only; y set by framing
};

export const CAMERA = { y: 0, z: 7.35, fov: 32 };

/** Minimal vertical padding inside the canvas (world units at z=0 plane). */
export const FRAME = { top: 0.09, bottom: 0.03, x: -0.45 };

// Synthetic head rig — all in the model's LOCAL space (y: 0=floor → ~0.98=ears).
const HEAD = {
  pivotY: 0.63, // neck joint height (head spans ~0.64→0.98)
  neckLo: 0.56, // below: 100% body
  neckHi: 0.72, // above: 100% head (smooth bend across the band)
  yaw: MathUtils.degToRad(26),
  pitch: MathUtils.degToRad(16),
  damp: 5,
};

// Nutrition-Facts label plane, in the model's LOCAL (pre-yaw/scale) frame.
export const LABEL = {
  // The carton's printed front panel faces local (0.87, 0, -0.5); the -120° model
  // yaw turns that to face the camera dead-on, so the label reads flat AND sits
  // flush on the panel ("printed on"). Sized to cover the whole face edge-to-edge.
  // Sized to sit ON the carton face — not edge-to-edge — so the white carton
  // shows around the label (see original ~0.235 × 0.47 panel proportions).
  pos: [0.16, 0.305, 0.088] as [number, number, number],
  rot: [0, MathUtils.degToRad(120), 0] as [number, number, number],
  width: 0.248,
  height: 0.52,
  debug: false,
};
// ─────────────────────────────────────────────────────────────────────────────

useGLTF.preload(BEAR_URL);

const ss = (e0: number, e1: number, x: number) => {
  const t = MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

type Rig = { object: Group; head: Bone | null };

/** Clone the GLB and convert its single mesh into a SkinnedMesh with a body+head
 *  bone pair so we can turn only the head. */
function buildRig(source: Group): Rig {
  const object = source.clone(true);

  let mesh: Mesh | null = null;
  object.traverse((o) => {
    if (!mesh && (o as Mesh).isMesh) mesh = o as Mesh;
  });
  if (!mesh) return { object, head: null };
  const src = mesh as Mesh;

  // Clone geometry (clone(true) shares it) so skin attrs don't mutate the cache.
  const geom = src.geometry.clone();
  const pos = geom.getAttribute("position");
  const count = pos.count;
  const skinIndex = new Uint16Array(count * 4);
  const skinWeight = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const w = ss(HEAD.neckLo, HEAD.neckHi, pos.getY(i));
    skinIndex[i * 4 + 1] = 1; // bone 1 = head
    skinWeight[i * 4] = 1 - w; // bone 0 = body
    skinWeight[i * 4 + 1] = w;
  }
  geom.setAttribute("skinIndex", new Uint16BufferAttribute(skinIndex, 4));
  geom.setAttribute("skinWeight", new Float32BufferAttribute(skinWeight, 4));

  const body = new Bone();
  const head = new Bone();
  head.position.set(0, HEAD.pivotY, 0); // pivot at the neck
  body.add(head);

  const skinned = new SkinnedMesh(geom, src.material as Material);
  skinned.castShadow = true;
  skinned.receiveShadow = true;
  skinned.position.copy(src.position);
  skinned.quaternion.copy(src.quaternion);
  skinned.scale.copy(src.scale);
  skinned.add(body);
  skinned.bind(new Skeleton([body, head]));

  src.parent?.add(skinned);
  src.parent?.remove(src);

  return { object, head };
}

const WORLD_UP = new Vector3(0, 1, 0);
const WORLD_RIGHT = new Vector3(1, 0, 0);

function Bear({
  reducedMotion,
  onReady,
}: {
  reducedMotion: boolean;
  onReady?: () => void;
}) {
  const { scene } = useGLTF(BEAR_URL);
  const { pointer } = useThree();
  const rig = useMemo(() => buildRig(scene as unknown as Group), [scene]);

  useEffect(() => {
    // Wait two frames so the first lit draw lands before we crossfade in.
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => onReady?.());
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [onReady, scene]);

  // scratch quaternions reused each frame
  const qWorld = useRef(new Quaternion());
  const qYaw = useRef(new Quaternion());
  const qPitch = useRef(new Quaternion());
  const qParent = useRef(new Quaternion());
  const qParentInv = useRef(new Quaternion());
  const qTarget = useRef(new Quaternion());

  useFrame((_, dt) => {
    const head = rig.head;
    if (!head) return;
    if (reducedMotion) {
      head.quaternion.identity();
      return;
    }
    const px = MathUtils.clamp(pointer.x, -1, 1);
    const py = MathUtils.clamp(pointer.y, -1, 1);

    // Desired head delta in WORLD space: yaw about world-up, nod about world-right.
    qYaw.current.setFromAxisAngle(WORLD_UP, px * HEAD.yaw);
    qPitch.current.setFromAxisAngle(WORLD_RIGHT, -py * HEAD.pitch);
    qWorld.current.copy(qYaw.current).multiply(qPitch.current);

    // Convert world delta into the bone's local frame: q_local = P⁻¹ · Δworld · P,
    // where P is the bone parent's world orientation (the model's yaw etc.).
    head.parent?.getWorldQuaternion(qParent.current);
    qParentInv.current.copy(qParent.current).invert();
    qTarget.current
      .copy(qParentInv.current)
      .multiply(qWorld.current)
      .multiply(qParent.current);

    head.quaternion.slerp(qTarget.current, 1 - Math.exp(-HEAD.damp * dt));
  });

  return <primitive object={rig.object} />;
}

function Label() {
  const tex = useLabelTexture();
  return (
    <mesh position={LABEL.pos} rotation={LABEL.rot}>
      <planeGeometry args={[LABEL.width, LABEL.height]} />
      {LABEL.debug ? (
        <meshBasicMaterial color="#ff00aa" />
      ) : tex ? (
        // Unlit + toneMapped:false so the printed label shows at its true cream/ink
        // values and stays crisp + readable regardless of scene lighting / ACES.
        <meshBasicMaterial key={tex.uuid} map={tex} toneMapped={false} />
      ) : (
        <meshBasicMaterial color="#F7F2E8" toneMapped={false} />
      )}
    </mesh>
  );
}

function PlaceholderBear() {
  return (
    <mesh position={[0, 0.5, 0]} castShadow>
      <boxGeometry args={[0.4, 1, 0.4]} />
      <meshStandardMaterial color="#6b5b4a" roughness={0.8} />
    </mesh>
  );
}

class BearErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    // eslint-disable-next-line no-console
    console.warn(`[BearMilkScene] could not load ${BEAR_URL} — showing placeholder.`);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const _box = new Box3();

/** Bbox of the bear+carton GLB only — excludes the floating label plane so
 *  framing tracks ears/feet, not the nutrition card. */
function bearBox(group: Group, target: Box3) {
  target.makeEmpty();
  group.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh || m.geometry?.type === "PlaneGeometry") return;
    target.expandByObject(m);
  });
}

/** Scale + anchor the bear+carton to the canvas: feet on the bottom edge, ears
 *  near the top — refits automatically when the viewport aspect changes so
 *  taller containers never clip body parts. */
function BioFraming({ children }: { children: ReactNode }) {
  const root = useRef<Group>(null);
  const { camera, size } = useThree();
  const ready = useRef(false);

  const fit = useCallback(() => {
    const g = root.current;
    if (!g) return;

    let hasMesh = false;
    g.traverse((o) => {
      if ((o as Mesh).isMesh) hasMesh = true;
    });
    if (!hasMesh) return;

    const cam = camera as PerspectiveCamera;
    cam.fov = CAMERA.fov;
    cam.position.set(0, CAMERA.y, CAMERA.z);
    cam.aspect = size.width / Math.max(size.height, 1);
    cam.updateProjectionMatrix();

    g.rotation.set(0, MODEL.yaw, 0);
    g.scale.setScalar(MODEL.scale);
    g.position.set(FRAME.x, 0, MODEL.position[2]);

    bearBox(g, _box);
    const height = _box.max.y - _box.min.y;
    const width = _box.max.x - _box.min.x;
    if (height <= 0 || width <= 0) return;

    const vHalf = CAMERA.z * Math.tan(MathUtils.degToRad(CAMERA.fov / 2));
    const hHalf = vHalf * cam.aspect;
    const availY = vHalf * 2 - FRAME.top - FRAME.bottom;
    const availX = hHalf * 2 - 0.06;
    const scaleMul = Math.min(availY / height, availX / width) * 0.985;
    g.scale.setScalar(MODEL.scale * scaleMul);

    bearBox(g, _box);
    g.position.y = -vHalf + FRAME.bottom - _box.min.y;

    ready.current = true;
  }, [camera, size.height, size.width]);

  useLayoutEffect(() => {
    ready.current = false;
    fit();
  }, [fit]);

  useFrame(() => {
    if (!ready.current) fit();
  });

  return <group ref={root}>{children}</group>;
}

export function BearMilkScene({
  milk: _milk,
  reducedMotion = false,
  onReady,
}: {
  milk: string;
  reducedMotion?: boolean;
  onReady?: () => void;
}) {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-3, 2.5, 4]} intensity={0.7} color="#fff4e0" />
      <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#58D7FF" />

      <BioFraming>
        <Label />
        <BearErrorBoundary fallback={<PlaceholderBear />}>
          <Suspense fallback={null}>
            <Bear reducedMotion={reducedMotion} onReady={onReady} />
          </Suspense>
        </BearErrorBoundary>
      </BioFraming>

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.45}
        scale={8}
        blur={2.4}
        far={4}
        resolution={256}
      />
    </>
  );
}
