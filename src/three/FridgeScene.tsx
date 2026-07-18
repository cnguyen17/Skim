// src/three/FridgeScene.tsx
// The real 3D fridge (Three.js, lazy-loaded so it stays out of the main bundle).
// Silver chrome cabinet (rounded doors, metal handles — reference look) with
// cartoon-white skim-milk cartons. Carton labels are SVG (vector) rasterized
// at high resolution so text stays sharp when a carton zooms in.
//
// React owns the open/closed state and the overlay player; this component owns
// the imperative scene. Clicking a carton calls onSelect(key); clicking the
// body/door calls onToggle(). Built for three@0.185 (colorSpace API).

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type FridgeItem = {
  key: string;
  title: string;
  badge: string; // "SET 01" | "PROD" | "COLLAB"
  group: "producing" | "set" | "collab";
  thumb?: string; // YouTube still (maxres); shown on the carton front
  thumbAlt?: string; // hqdefault fallback if maxres 404s / is CORS-blocked
  spotifyId?: string; // for audio items — fetch cover art via Spotify oEmbed
};

// Brand accents — saturated so carton labels stay readable from afar.
const INK = "#0F0E0C";
const ACCENT = "#00B7FF"; // saturated cyan
const ACCENT_2 = "#FFC400"; // saturated yellow

const OPEN_ANGLE = -THREE.MathUtils.degToRad(118); // negative = swing toward viewer

export type FridgeLayout = {
  producing: { x: number; y: number } | null;
  sets: { x: number; y: number } | null;
};

// The on-screen rectangle of the zoomed carton's face window (normalised 0..1),
// where the HTML video iframe is overlaid. null when nothing is zoomed/settled.
export type FridgeScreen = { x: number; y: number; w: number; h: number } | null;

/** Escape text for SVG attribute / text nodes. */
function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Word-wrap a title into ≤2 lines for the carton SVG. */
function wrapTitle(title: string, maxChars = 16): string[] {
  const words = title.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (test.length > maxChars && line) {
      lines.push(line);
      line = w;
      if (lines.length >= 2) return lines;
    } else {
      line = test;
    }
  }
  if (line && lines.length < 2) lines.push(line);
  return lines;
}

export default function FridgeScene({
  items,
  open,
  selectedKey,
  expanded = false,
  onToggle,
  onSelect,
  onLayout,
  onScreen,
}: {
  items: FridgeItem[];
  open: boolean;
  selectedKey: string | null;
  /** Fullscreen mode — zoom onto the cabinet so it fills the viewport top-to-bottom. */
  expanded?: boolean;
  onToggle: () => void;
  onSelect: (key: string) => void;
  onLayout: (layout: FridgeLayout) => void;
  onScreen: (rect: FridgeScreen) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const targetAngleRef = useRef(0);
  const fallenKeyRef = useRef<string | null>(null);
  const expandedRef = useRef(expanded);
  const frameCameraRef = useRef<() => void>(() => {});

  // Latest-callback refs so the scene (built once) always calls current handlers.
  const onToggleRef = useRef(onToggle);
  const onSelectRef = useRef(onSelect);
  const onLayoutRef = useRef(onLayout);
  const onScreenRef = useRef(onScreen);
  onToggleRef.current = onToggle;
  onSelectRef.current = onSelect;
  onLayoutRef.current = onLayout;
  onScreenRef.current = onScreen;
  const itemsRef = useRef(items);

  // Drive the door from React state without rebuilding the scene.
  useEffect(() => {
    targetAngleRef.current = open ? OPEN_ANGLE : 0;
  }, [open]);

  // Which carton is "spilling" (clicked).
  useEffect(() => {
    fallenKeyRef.current = selectedKey;
  }, [selectedKey]);

  // Entering/leaving fullscreen — recompute framing (zoom still tracks door openness).
  useEffect(() => {
    expandedRef.current = expanded;
    frameCameraRef.current();
  }, [expanded]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "pointer";

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // Studio env so the silver paint actually reads as metal.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.95;

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);

    // ---- dimensions ----
    const W = 2.05;
    const H = 3.85;
    const D = 1.55;
    const t = 0.1;
    const rEdge = 0.14; // bubbly rounded corners (reference fridge)
    const innerW = W - 2 * t;
    const innerD = D - t;
    const cavityTop = H - t - 0.05;
    const freezerH = H * 0.34;
    const mainDoorH = H - freezerH - 0.06;

    // ---- materials: silver chrome exterior, soft white interior ----
    const silver = (extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({
        color: 0xc8ced6,
        metalness: 0.92,
        roughness: 0.18,
        envMapIntensity: 1.25,
        ...extra,
      });
    const chrome = (extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({
        color: 0xe8eef4,
        metalness: 1,
        roughness: 0.08,
        envMapIntensity: 1.4,
        ...extra,
      });
    const bodyMat = silver({ color: 0xb8c0ca, roughness: 0.22 });
    const doorMat = silver({ color: 0xd0d6de, roughness: 0.14 });
    const doorPanelMat = silver({ color: 0xc4cbd4, roughness: 0.2 });
    const interiorMat = new THREE.MeshStandardMaterial({
      // Cool blue-grey cavity (cartoon fridge vibe) so white cartons pop.
      color: 0x7a8fa8,
      metalness: 0,
      roughness: 0.95,
    });
    const shelfMat = new THREE.MeshStandardMaterial({
      // Bright pure silver so shelves read clear against the blue-grey cavity.
      color: 0xeef2f6,
      metalness: 0.95,
      roughness: 0.12,
      envMapIntensity: 1.35,
    });
    const blueShelfMat = shelfMat; // all platforms same bright silver
    const chromeMat = chrome();
    const footMat = chrome({ color: 0x9aa3ad, roughness: 0.28 });

    const disposables: Array<{ dispose: () => void }> = [
      bodyMat, doorMat, doorPanelMat, interiorMat, shelfMat, chromeMat, footMat, envTex,
    ];

    function box(w: number, h: number, d: number, mat: THREE.Material) {
      const geo = new THREE.BoxGeometry(w, h, d);
      disposables.push(geo);
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }

    function roundBox(w: number, h: number, d: number, rad: number, mat: THREE.Material) {
      const geo = new RoundedBoxGeometry(w, h, d, 5, Math.min(rad, Math.min(w, h, d) * 0.45));
      disposables.push(geo);
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }

    const fridge = new THREE.Group();
    scene.add(fridge);

    const fridgeTargets: THREE.Object3D[] = []; // click → toggle door
    const cartonTargets: THREE.Object3D[] = []; // click → select item
    const cartonGroups: THREE.Group[] = []; // for the lift/zoom animation
    const cartonByKey = new Map<string, THREE.Group>();
    const doorPivots: THREE.Group[] = [];

    // ---- cabinet shell (silver) ----
    const cabinet = new THREE.Group();
    fridge.add(cabinet);

    const back = box(W, H, t, bodyMat);
    back.position.set(0, H / 2, -D / 2 + t / 2);
    cabinet.add(back);
    fridgeTargets.push(back);

    const left = box(t, H, D, bodyMat);
    left.position.set(-W / 2 + t / 2, H / 2, 0);
    cabinet.add(left);
    fridgeTargets.push(left);

    const right = box(t, H, D, bodyMat);
    right.position.set(W / 2 - t / 2, H / 2, 0);
    cabinet.add(right);
    fridgeTargets.push(right);

    const topPanel = box(W, t, D, bodyMat);
    topPanel.position.set(0, H - t / 2, 0);
    cabinet.add(topPanel);
    fridgeTargets.push(topPanel);

    const bottomPanel = box(W, t, D, bodyMat);
    bottomPanel.position.set(0, t / 2, 0);
    cabinet.add(bottomPanel);
    fridgeTargets.push(bottomPanel);

    // soft white liner
    const linerBack = box(innerW, H - 2 * t, 0.02, interiorMat);
    linerBack.position.set(0, H / 2, -D / 2 + t + 0.02);
    cabinet.add(linerBack);
    fridgeTargets.push(linerBack);
    const linerLeft = box(0.02, H - 2 * t, innerD, interiorMat);
    linerLeft.position.set(-innerW / 2, H / 2, t / 2);
    cabinet.add(linerLeft);
    const linerRight = box(0.02, H - 2 * t, innerD, interiorMat);
    linerRight.position.set(innerW / 2, H / 2, t / 2);
    cabinet.add(linerRight);

    // recessed dark base (reference)
    const baseMat = chrome({ color: 0x3a3f46, metalness: 0.7, roughness: 0.35 });
    disposables.push(baseMat);
    const base = roundBox(W * 0.92, 0.12, D * 0.9, 0.04, baseMat);
    base.position.set(0, 0.02, 0);
    cabinet.add(base);

    // feet
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const foot = box(0.16, 0.08, 0.16, footMat);
        foot.position.set(sx * (W / 2 - 0.22), -0.02, sz * (D / 2 - 0.22));
        cabinet.add(foot);
      }
    }

    // ---- shelf levels ----
    const yProd = 2.45;
    const yBlue = 1.4;
    const yBot = 0.4;
    function addShelf(y: number, blue: boolean) {
      const shelf = box(innerW - 0.04, 0.05, innerD - 0.06, blue ? blueShelfMat : shelfMat);
      shelf.position.set(0, y - 0.05, t / 2);
      cabinet.add(shelf);
    }
    addShelf(yProd, false);
    addShelf(yBlue, true);
    addShelf(yBot, false);

    // ---- interior light (on when open) ----
    // Soft cool fill — enough to see cartons, keeps the blue-grey walls readable.
    const innerLight = new THREE.PointLight(0xd8e6f5, 0, 6, 2.2);
    innerLight.position.set(0, cavityTop - 0.25, 0.15);
    cabinet.add(innerLight);

    const texLoader = new THREE.TextureLoader();
    texLoader.setCrossOrigin("anonymous");

    // Vector carton wrap: SVG → Texture (rasterized at 2K so zoom stays crisp).
    const TEX_W = 1024;
    const TEX_H = 1228;

    // Carton geometry + the video "screen" plane. Declared here (above the SVG
    // writer) so the printed frame can be derived from the SAME window the HTML
    // video iframe is overlaid on — keeping art + overlay pixel-aligned.
    const CW = 0.5;
    const CH = 0.7;
    const CD = 0.34;
    const GABLE = 0.16;
    const SCREEN_W = CW * 0.84;
    const SCREEN_H = (SCREEN_W * 9) / 16;
    const SCREEN_Y = CH * 0.6;
    const SCREEN_Z = CD / 2 + 0.006;

    // The +Z face maps the full texture across CW×CH (image top → face top).
    // Convert the SCREEN plane into texture pixels + a uniform margin so the
    // printed frame wraps the video tightly (no dead space below it).
    const FRAME_PAD = 16;
    const halfU = SCREEN_W / CW / 2;
    const topV = (SCREEN_Y + SCREEN_H / 2) / CH;
    const botV = (SCREEN_Y - SCREEN_H / 2) / CH;
    const FRAME = {
      x: (0.5 - halfU) * TEX_W - FRAME_PAD,
      y: (1 - topV) * TEX_H - FRAME_PAD,
      w: halfU * 2 * TEX_W + FRAME_PAD * 2,
      h: (topV - botV) * TEX_H + FRAME_PAD * 2,
    };

    function milkSvg(it: FridgeItem) {
      const splash = it.group === "producing" ? ACCENT_2 : it.group === "collab" ? "#4A5568" : ACCENT;
      const lines = wrapTitle(it.title, 16);
      const lineTs = lines
        .map(
          (ln, i) =>
            `<text x="48" y="${848 + i * 58}" fill="${INK}" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-size="52" font-weight="900">${esc(ln)}</text>`,
        )
        .join("");
      // Dark stroke under the splash fill so SKIM reads from across the stage.
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${TEX_W}" height="${TEX_H}" viewBox="0 0 ${TEX_W} ${TEX_H}">
  <rect width="${TEX_W}" height="${TEX_H}" fill="#FFFAF2"/>
  <rect x="0" y="0" width="${TEX_W}" height="28" fill="${splash}"/>
  <text x="48" y="86" fill="${INK}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="34" font-weight="700" letter-spacing="5">DJ SKIM · ${esc(it.badge)}</text>
  <text x="44" y="220" fill="${INK}" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-size="168" font-weight="900" stroke="${INK}" stroke-width="10" paint-order="stroke fill">${esc("SKIM")}</text>
  <text x="44" y="220" fill="${splash}" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-size="168" font-weight="900">${esc("SKIM")}</text>
  <rect x="${FRAME.x.toFixed(1)}" y="${FRAME.y.toFixed(1)}" width="${FRAME.w.toFixed(1)}" height="${FRAME.h.toFixed(1)}" rx="26" fill="#E8E0D4" stroke="${splash}" stroke-width="18"/>
  ${lineTs}
  <path d="M0 960 Q 128 910 256 960 T 512 960 T 768 960 T 1024 960 L1024 ${TEX_H} L0 ${TEX_H} Z" fill="${splash}"/>
  <text x="48" y="1130" fill="${INK}" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-size="84" font-weight="900">skim</text>
  <text x="300" y="1124" fill="${INK}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="32" font-weight="700" letter-spacing="2">milk · prod &amp; dj</text>
</svg>`;
    }

    function svgToTexture(svg: string, onReady: (tex: THREE.Texture) => void) {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        disposables.push(tex);
        onReady(tex);
      };
      img.onerror = () => {
        // Fallback: flat cartoon white if SVG fails to parse
        const c = document.createElement("canvas");
        c.width = 4;
        c.height = 4;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#FFFAF2";
        ctx.fillRect(0, 0, 4, 4);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        disposables.push(tex);
        onReady(tex);
      };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function genScreen(it: FridgeItem) {
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 360;
      const ctx = c.getContext("2d")!;
      if (it.thumb) {
        ctx.fillStyle = "#0d0f12";
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = "#ff0033";
        const bw = 140, bh = 96, bx = 250, by = 132, r = 18;
        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
        ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
        ctx.arcTo(bx, by + bh, bx, by, r);
        ctx.arcTo(bx, by, bx + bw, by, r);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(295, 158);
        ctx.lineTo(295, 202);
        ctx.lineTo(340, 180);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = "#1DB954";
        ctx.fillRect(0, 0, 640, 360);
        ctx.strokeStyle = "#ffffff";
        ctx.lineCap = "round";
        const cx = 320, cy = 170;
        [56, 40, 24].forEach((rad, i) => {
          ctx.lineWidth = 12 - i * 2;
          ctx.beginPath();
          ctx.arc(cx, cy - rad * 0.5, rad, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
        });
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 36px Inter, system-ui, sans-serif";
        ctx.fillText("Spotify", 245, 280);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      disposables.push(tex);
      return tex;
    }

    function makeCarton(it: FridgeItem) {
      const g = new THREE.Group();

      // Unlit front label — colors stay punchy at distance (no wash from lights).
      const milkMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        toneMapped: false,
      });
      disposables.push(milkMat);
      const whiteMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.78,
        metalness: 0,
      });
      disposables.push(whiteMat);
      const capMat = new THREE.MeshStandardMaterial({
        color: it.group === "producing" ? 0xffc400 : 0x00b7ff,
        roughness: 0.35,
        metalness: 0.05,
        emissive: it.group === "producing" ? 0xff8800 : 0x0077aa,
        emissiveIntensity: 0.55,
        toneMapped: false,
      });
      disposables.push(capMat);

      const bodyGeo = new THREE.BoxGeometry(CW, CH, CD);
      disposables.push(bodyGeo);
      // Only the front face (+Z) gets the SVG wrap; sides stay toony white.
      const bodyMats = [whiteMat, whiteMat, whiteMat, whiteMat, milkMat, whiteMat];
      const body = new THREE.Mesh(bodyGeo, bodyMats);
      body.castShadow = true;
      body.receiveShadow = true;
      body.position.y = CH / 2;
      body.userData.itemKey = it.key;
      g.add(body);
      cartonTargets.push(body);

      svgToTexture(milkSvg(it), (tex) => {
        milkMat.map = tex;
        milkMat.needsUpdate = true;
      });

      const screenMat = new THREE.MeshBasicMaterial({ map: genScreen(it) });
      disposables.push(screenMat);
      const screenGeo = new THREE.PlaneGeometry(SCREEN_W, SCREEN_H);
      disposables.push(screenGeo);
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, SCREEN_Y, SCREEN_Z);
      screen.userData.itemKey = it.key;
      g.add(screen);
      cartonTargets.push(screen);
      const applyScreen = (tex: THREE.Texture) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        screenMat.map = tex;
        screenMat.needsUpdate = true;
        disposables.push(tex);
      };
      if (it.thumb) {
        texLoader.load(it.thumb, applyScreen, undefined, () => {
          if (it.thumbAlt) texLoader.load(it.thumbAlt, applyScreen, undefined, () => {});
        });
      } else if (it.spotifyId) {
        fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${it.spotifyId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d && d.thumbnail_url) texLoader.load(d.thumbnail_url, applyScreen, undefined, () => {});
          })
          .catch(() => {});
      }

      const shape = new THREE.Shape();
      shape.moveTo(-CW / 2, 0);
      shape.lineTo(CW / 2, 0);
      shape.lineTo(0, GABLE);
      shape.lineTo(-CW / 2, 0);
      const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: CD, bevelEnabled: false });
      roofGeo.translate(0, 0, -CD / 2);
      disposables.push(roofGeo);
      const roof = new THREE.Mesh(roofGeo, whiteMat);
      roof.castShadow = true;
      roof.position.y = CH;
      roof.userData.itemKey = it.key;
      g.add(roof);
      cartonTargets.push(roof);

      const capGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 18);
      disposables.push(capGeo);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.castShadow = true;
      cap.position.set(0, CH + GABLE - 0.01, 0);
      cap.userData.itemKey = it.key;
      g.add(cap);
      cartonTargets.push(cap);

      g.userData.itemKey = it.key;
      cartonGroups.push(g);
      cartonByKey.set(it.key, g);
      return g;
    }

    // ---- place items ----
    const halfW = innerW / 2 - 0.36;
    const placeRow = (row: FridgeItem[], baseY: number) => {
      row.forEach((it, i) => {
        const fx = row.length === 1 ? 0 : (i / (row.length - 1)) * 2 - 1;
        const carton = makeCarton(it);
        const z = t / 2 + 0.02;
        const x = fx * halfW;
        carton.position.set(x, baseY, z);
        carton.userData.rest = { x, y: baseY, z };
        cabinet.add(carton);
      });
    };

    const producing = itemsRef.current.filter((i) => i.group === "producing");
    const lower = itemsRef.current.filter((i) => i.group !== "producing");
    placeRow(producing, yProd);
    const lowerYs = [yBlue, yBot, yBot - 1.05, yBot - 2.1];
    for (let i = 0; i < lower.length; i += 2) {
      placeRow(lower.slice(i, i + 2), lowerYs[i / 2] ?? yBot - 1.05 * (i / 2 - 1));
    }

    // ---- dual rounded doors (freezer + fridge), left-hinged, chrome hardware ----
    const doorThick = 0.14;
    const gap = 0.05;
    const freezerY = H - freezerH / 2 - 0.02;
    const mainY = mainDoorH / 2 + 0.02;

    function makeDoor(height: number, pivotY: number) {
      const pivot = new THREE.Group();
      pivot.position.set(-W / 2, pivotY, D / 2);
      fridge.add(pivot);
      doorPivots.push(pivot);

      const door = roundBox(W - 0.04, height, doorThick, rEdge * 0.85, doorMat);
      door.position.set(W / 2, 0, doorThick / 2);
      pivot.add(door);
      fridgeTargets.push(door);

      const panel = roundBox(W - 0.38, height - 0.28, 0.035, rEdge * 0.55, doorPanelMat);
      panel.position.set(W / 2, 0, doorThick + 0.01);
      pivot.add(panel);
      fridgeTargets.push(panel);

      const liner = box(W - 0.22, height - 0.18, 0.02, interiorMat);
      liner.position.set(W / 2, 0, -0.015);
      pivot.add(liner);

      // Horizontal chrome handle on the free (right) edge — reference style.
      const handle = new THREE.Group();
      const gripGeo = new RoundedBoxGeometry(0.1, 0.08, 0.42, 3, 0.035);
      disposables.push(gripGeo);
      const grip = new THREE.Mesh(gripGeo, chromeMat);
      grip.castShadow = true;
      handle.add(grip);
      const plateGeo = new RoundedBoxGeometry(0.12, 0.14, 0.14, 2, 0.025);
      disposables.push(plateGeo);
      const plate = new THREE.Mesh(plateGeo, chromeMat);
      plate.position.z = -0.12;
      handle.add(plate);
      handle.position.set(W - 0.28, 0, doorThick + 0.12);
      handle.rotation.y = Math.PI / 2;
      pivot.add(handle);
      fridgeTargets.push(grip);

      return pivot;
    }

    makeDoor(freezerH - gap * 0.5, freezerY);
    makeDoor(mainDoorH - gap * 0.5, mainY);

    // ---- lighting (punchy so chrome catches highlights) ----
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a7380, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(4.5, 8, 5.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -4;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd8e4ff, 0.45);
    fill.position.set(-6, 4, 4);
    scene.add(fill);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.55);
    rimLight.position.set(-2, 3, -5);
    scene.add(rimLight);

    const groundGeo = new THREE.PlaneGeometry(40, 40);
    disposables.push(groundGeo);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.22 });
    disposables.push(groundMat);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ---- camera ----
    const target = new THREE.Vector3(0, H * 0.5, 0);
    // Anchors sit just past the cabinet's right edge so leader-lines start outside the fridge.
    const producingAnchor = new THREE.Vector3(W * 0.5 + 0.12, yProd + 0.34, D / 2);
    // Point at the TOP of the middle row (where DJ Sets start), not mid-cavity.
    const setsAnchor = new THREE.Vector3(W * 0.5 + 0.12, yBlue + 0.62, D / 2);
    function project(v: THREE.Vector3) {
      const p = v.clone().project(camera);
      return { x: p.x * 0.5 + 0.5, y: -p.y * 0.5 + 0.5 };
    }

    let lastLayout = { producing: null as { x: number; y: number } | null, sets: null as { x: number; y: number } | null };
    function reportLayout() {
      const producing = project(producingAnchor);
      const sets = project(setsAnchor);
      const moved =
        !lastLayout.producing ||
        !lastLayout.sets ||
        Math.abs(producing.x - lastLayout.producing.x) > 0.004 ||
        Math.abs(producing.y - lastLayout.producing.y) > 0.004 ||
        Math.abs(sets.x - lastLayout.sets.x) > 0.004 ||
        Math.abs(sets.y - lastLayout.sets.y) > 0.004;
      if (!moved) return;
      lastLayout = { producing, sets };
      onLayoutRef.current(lastLayout);
    }

    /** Expanded framing: 0 = overview (whole closed fridge), 1 = cabinet fills the screen. */
    function camExpanded(openness: number) {
      const aspect = Math.max(camera.aspect || 1, 0.01);
      const vFovHalf = THREE.MathUtils.degToRad(camera.fov) / 2;

      const overviewH = H * 1.3;
      const overviewW = W * 1.65;
      const ovDistH = overviewH / 2 / Math.tan(vFovHalf);
      const ovDistW = overviewW / 2 / (Math.tan(vFovHalf) * aspect);
      const overviewZ = Math.max(ovDistH, ovDistW) + D * 0.5;

      // Tighter zoom + aim slightly below center so the fridge sits higher
      // (fills top gap) while the bottom stays flush.
      const detailH = H * 0.88;
      const detailZ = detailH / 2 / Math.tan(vFovHalf) + D * 0.24;
      const detailY = H * 0.455;

      const z = THREE.MathUtils.lerp(overviewZ, detailZ, openness);
      const y = THREE.MathUtils.lerp(target.y * 0.96, detailY, openness);
      const lookY = THREE.MathUtils.lerp(target.y, detailY, openness);
      return { y, z, lookY };
    }

    /** Inline (on-page) framing — same open/close dolly as expanded, fit to the stage. */
    function camInline(openness: number) {
      const aspect = Math.max(camera.aspect || 1, 0.01);
      const vFovHalf = THREE.MathUtils.degToRad(camera.fov) / 2;

      const overviewH = H * 1.35;
      const overviewW = W * 2.4;
      const ovDistH = overviewH / 2 / Math.tan(vFovHalf);
      const ovDistW = overviewW / 2 / (Math.tan(vFovHalf) * aspect);
      const overviewZ = Math.max(ovDistH, ovDistW) + D * 0.55;

      const detailH = H * 0.9;
      const detailZ = detailH / 2 / Math.tan(vFovHalf) + D * 0.24;
      const detailY = H * 0.455;

      const z = THREE.MathUtils.lerp(overviewZ, detailZ, openness);
      const y = THREE.MathUtils.lerp(target.y * 0.96, detailY, openness);
      const lookY = THREE.MathUtils.lerp(target.y, detailY, openness);
      return { y, z, lookY };
    }

    function applyCam(g: { y: number; z: number; lookY: number }) {
      camera.position.set(0, g.y, g.z);
      camera.lookAt(0, g.lookY, 0);
      camera.updateMatrixWorld();
    }

    function doorOpenness() {
      if (doorPivots[0]) {
        return THREE.MathUtils.clamp(doorPivots[0].rotation.y / OPEN_ANGLE, 0, 1);
      }
      return targetAngleRef.current === 0 ? 0 : 1;
    }

    function frameCamera() {
      const openness = doorOpenness();
      applyCam(expandedRef.current ? camExpanded(openness) : camInline(openness));
      reportLayout();
    }
    frameCameraRef.current = frameCamera;

    // ---- pointer ----
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function handlePick(e: PointerEvent | MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const cHits = raycaster.intersectObjects(cartonTargets, false);
      if (cHits.length && targetAngleRef.current !== 0) {
        const key = cHits[0].object.userData.itemKey as string;
        if (key) {
          onSelectRef.current(key);
          return;
        }
      }
      const fHits = raycaster.intersectObjects(fridgeTargets, false);
      if (fHits.length) onToggleRef.current();
    }
    const onClick = (e: MouseEvent) => handlePick(e);
    mount.addEventListener("click", onClick);

    // ---- size + visibility ----
    function resize() {
      const m = mountRef.current;
      if (!m) return;
      const w = m.clientWidth || 1;
      const h = m.clientHeight || 1;
      renderer.setSize(w, h, true);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      frameCamera();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0 });
    io.observe(mount);

    // ---- render loop ----
    const ZOOM_SCALE = 4.2;
    const ZOOM_DIST = 3.2;
    const corner = new THREE.Vector3();
    let reported: FridgeScreen = null;
    function reportScreen(r: FridgeScreen) {
      const same =
        (!r && !reported) ||
        (!!r &&
          !!reported &&
          Math.abs(r.x - reported.x) < 0.002 &&
          Math.abs(r.y - reported.y) < 0.002 &&
          Math.abs(r.w - reported.w) < 0.002 &&
          Math.abs(r.h - reported.h) < 0.002);
      if (!same) {
        reported = r;
        onScreenRef.current(r);
      }
    }
    function projectScreenRect(g: THREE.Group): FridgeScreen {
      g.updateWorldMatrix(true, false);
      let minX = 1, minY = 1, maxX = 0, maxY = 0;
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          corner.set((sx * SCREEN_W) / 2, SCREEN_Y + (sy * SCREEN_H) / 2, SCREEN_Z);
          g.localToWorld(corner);
          corner.project(camera);
          const px = corner.x * 0.5 + 0.5;
          const py = -corner.y * 0.5 + 0.5;
          minX = Math.min(minX, px);
          maxX = Math.max(maxX, px);
          minY = Math.min(minY, py);
          maxY = Math.max(maxY, py);
        }
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      for (const pivot of doorPivots) {
        const cur = pivot.rotation.y;
        pivot.rotation.y += (targetAngleRef.current - cur) * 0.14;
      }
      const openness = doorPivots[0]
        ? THREE.MathUtils.clamp(doorPivots[0].rotation.y / OPEN_ANGLE, 0, 1)
        : 0;
      innerLight.intensity = openness * 0.55;

      // Camera dollies with the doors in both modes — overview when closed, fill when open.
      applyCam(expandedRef.current ? camExpanded(openness) : camInline(openness));
      if (openness > 0.08) reportLayout();

      const camZ = camera.position.z;
      for (const g of cartonGroups) {
        const rest = g.userData.rest as { x: number; y: number; z: number };
        const picked = g.userData.itemKey === fallenKeyRef.current;
        const s = picked ? ZOOM_SCALE : 1;
        const tx = picked ? 0 : rest.x;
        const ty = picked ? target.y - SCREEN_Y * s : rest.y;
        const tz = picked ? camZ - ZOOM_DIST - SCREEN_Z * s : rest.z;
        g.position.x += (tx - g.position.x) * 0.16;
        g.position.y += (ty - g.position.y) * 0.16;
        g.position.z += (tz - g.position.z) * 0.16;
        const ns = g.scale.x + (s - g.scale.x) * 0.16;
        g.scale.setScalar(ns);
      }

      renderer.render(scene, camera);

      const selKey = fallenKeyRef.current;
      const sel = selKey ? cartonByKey.get(selKey) : undefined;
      if (sel && Math.abs(sel.scale.x - ZOOM_SCALE) < 0.08) {
        reportScreen(projectScreenRect(sel));
      } else {
        reportScreen(null);
      }
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mount.removeEventListener("click", onClick);
      frameCameraRef.current = () => {};
      for (const d of disposables) d.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fridge3d__mount" />;
}
