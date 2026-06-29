// src/three/FridgeScene.tsx
// The real 3D fridge (Three.js, lazy-loaded so it stays out of the main bundle).
// An all-white cabinet with a single left-hinged door + a wooden handle, gray
// opaque shelves, and the catalogue sitting inside as milk cartons (on-brand:
// skim milk). Top shelf = Producing, lower racks = DJ Sets / Collaborations.
//
// React owns the open/closed state and the overlay player; this component owns
// the imperative scene. Clicking a carton calls onSelect(key); clicking the
// body/door calls onToggle(). Built for three@0.185 (colorSpace API).
//
// TODO(thumbnails): carton fronts use generated text labels, not the YouTube
// stills, to avoid tainting the WebGL context with cross-origin images. The real
// thumbnail/player shows in the HTML overlay on click.

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type FridgeItem = {
  key: string;
  title: string;
  badge: string; // "SET 01" | "PROD" | "COLLAB"
  group: "producing" | "set" | "collab";
  thumb?: string; // YouTube still (maxres); shown on the carton front
  thumbAlt?: string; // hqdefault fallback if maxres 404s / is CORS-blocked
  spotifyId?: string; // for audio items — fetch cover art via Spotify oEmbed
};

// Brand hexes (mirror src/styles/tokens.css — CanvasTexture can't read CSS vars).
const INK = "#0F0E0C";
const MID = "#5b6678";
const ACCENT = "#58D7FF";
const ACCENT_2 = "#FFE24D";

const OPEN_ANGLE = -THREE.MathUtils.degToRad(118); // negative = swing toward viewer

export type FridgeLayout = {
  producing: { x: number; y: number } | null;
  sets: { x: number; y: number } | null;
};

// The on-screen rectangle of the zoomed carton's face window (normalised 0..1),
// where the HTML video iframe is overlaid. null when nothing is zoomed/settled.
export type FridgeScreen = { x: number; y: number; w: number; h: number } | null;

export default function FridgeScene({
  items,
  open,
  selectedKey,
  onToggle,
  onSelect,
  onLayout,
  onScreen,
}: {
  items: FridgeItem[];
  open: boolean;
  selectedKey: string | null;
  onToggle: () => void;
  onSelect: (key: string) => void;
  onLayout: (layout: FridgeLayout) => void;
  onScreen: (rect: FridgeScreen) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const targetAngleRef = useRef(0);
  const fallenKeyRef = useRef<string | null>(null);

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

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "pointer";

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

    // ---- dimensions ----
    const W = 2.0;
    const H = 4.0;
    const D = 1.6;
    const t = 0.09;
    const innerW = W - 2 * t;
    const innerD = D - t;
    const cavityTop = H - t - 0.05;

    // ---- materials (all-white cabinet) ----
    const white = (extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.5, ...extra });
    const bodyMat = white({ color: 0xf3f1ec, roughness: 0.55 });
    const doorMat = white({ color: 0xfbfaf6, roughness: 0.5 });
    const interiorMat = white({ color: 0xffffff, roughness: 0.8 });
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.1, roughness: 0.6 });
    const blueShelfMat = new THREE.MeshStandardMaterial({ color: 0x58d7ff, metalness: 0.15, roughness: 0.45 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, metalness: 0.0, roughness: 0.7 });
    const footMat = new THREE.MeshStandardMaterial({ color: 0x8e8e92, metalness: 0.6, roughness: 0.4 });

    const disposables: Array<{ dispose: () => void }> = [
      bodyMat, doorMat, interiorMat, shelfMat, blueShelfMat, woodMat, footMat,
    ];

    function box(w: number, h: number, d: number, mat: THREE.Material) {
      const geo = new THREE.BoxGeometry(w, h, d);
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

    // ---- cabinet shell ----
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

    // bright inner liner so the cavity reads white
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

    // feet
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const foot = box(0.16, 0.1, 0.16, footMat);
        foot.position.set(sx * (W / 2 - 0.18), -0.05, sz * (D / 2 - 0.18));
        cabinet.add(foot);
      }
    }

    // ---- shelf levels (explicit Ys so every carton fits inside) ----
    // Top → bottom: Producing rests on yProd; the BLUE divider (yBlue) sits on
    // top of the DJ Sets block; DJ rows rest on yBlue and yBot.
    const yProd = 2.5;
    const yBlue = 1.42;
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
    const innerLight = new THREE.PointLight(0xfff4d6, 0, 7, 2);
    innerLight.position.set(0, cavityTop - 0.2, -0.1);
    cabinet.add(innerLight);

    // Loader for the YouTube stills. crossOrigin=anonymous means a non-CORS
    // response simply fails to load (→ keeps placeholder) and never taints WebGL.
    const texLoader = new THREE.TextureLoader();
    texLoader.setCrossOrigin("anonymous");

    // The milk-carton wrap: SKIM wordmark up top, a blank window in the middle
    // (where the YouTube/Spotify screen plane sits), the title above a blue
    // "skim milk" splash panel at the bottom. Mapped onto the box body.
    function makeMilkTexture(it: FridgeItem) {
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = 384;
      const ctx = c.getContext("2d")!;
      const blue = it.group === "producing" ? ACCENT_2 : it.group === "collab" ? MID : ACCENT;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 320, 384);
      // header + brand
      ctx.fillStyle = MID;
      ctx.font = "500 14px monospace";
      ctx.fillText(`DJ SKIM · ${it.badge}`, 18, 30);
      ctx.fillStyle = blue;
      ctx.font = "800 44px Inter, system-ui, sans-serif";
      ctx.fillText("SKIM", 16, 74);
      // (middle ~90–248 left blank — the screen plane covers it on the front)
      // event title just above the splash
      ctx.fillStyle = INK;
      ctx.font = "700 22px Inter, system-ui, sans-serif";
      const words = it.title.split(" ");
      let line = "";
      let yy = 274;
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width > 286 && line) {
          ctx.fillText(line, 18, yy);
          line = w;
          yy += 26;
          if (yy > 300) break;
        } else line = test;
      }
      if (line && yy <= 300) ctx.fillText(line, 18, yy);
      // bottom blue splash panel
      const panelTop = 312;
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.moveTo(0, panelTop + 12);
      for (let x = 0; x <= 320; x += 40) {
        ctx.quadraticCurveTo(x + 10, panelTop - 10, x + 20, panelTop + 8);
        ctx.quadraticCurveTo(x + 30, panelTop + 24, x + 40, panelTop + 8);
      }
      ctx.lineTo(320, 384);
      ctx.lineTo(0, 384);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 30px Inter, system-ui, sans-serif";
      ctx.fillText("skim", 18, panelTop + 52);
      ctx.font = "500 14px monospace";
      ctx.fillText("milk · prod & dj", 92, panelTop + 50);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      disposables.push(tex);
      return tex;
    }

    // The "screen" on the carton's face — a YouTube placeholder (swapped for the
    // real still when it loads) or a Spotify badge for audio items.
    function genScreen(it: FridgeItem) {
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = 180;
      const ctx = c.getContext("2d")!;
      if (it.thumb) {
        ctx.fillStyle = "#0d0f12";
        ctx.fillRect(0, 0, 320, 180);
        ctx.fillStyle = "#ff0033";
        const bw = 86, bh = 60, bx = 117, by = 60, r = 14;
        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
        ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
        ctx.arcTo(bx, by + bh, bx, by, r);
        ctx.arcTo(bx, by, bx + bw, by, r);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(150, 76);
        ctx.lineTo(150, 104);
        ctx.lineTo(176, 90);
        ctx.closePath();
        ctx.fill();
      } else {
        // Spotify badge
        ctx.fillStyle = "#1DB954";
        ctx.fillRect(0, 0, 320, 180);
        ctx.strokeStyle = "#ffffff";
        ctx.lineCap = "round";
        const cx = 160, cy = 90;
        [34, 24, 14].forEach((rad, i) => {
          ctx.lineWidth = 9 - i * 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy - rad * 0.5, rad, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
        });
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 22px Inter, system-ui, sans-serif";
        ctx.fillText("Spotify", 116, 150);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      disposables.push(tex);
      return tex;
    }

    const CW = 0.5;
    const CH = 0.7;
    const CD = 0.34;
    const GABLE = 0.16;
    // The screen window on the carton face (local frame) — the HTML video iframe
    // is projected onto exactly this rectangle when a carton is zoomed.
    const SCREEN_W = CW * 0.84;
    const SCREEN_H = (SCREEN_W * 9) / 16;
    const SCREEN_Y = CH * 0.6;
    const SCREEN_Z = CD / 2 + 0.006;

    function makeCarton(it: FridgeItem) {
      const g = new THREE.Group();
      const milkMat = new THREE.MeshStandardMaterial({ map: makeMilkTexture(it), roughness: 0.55, metalness: 0 });
      disposables.push(milkMat);
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0 });
      disposables.push(whiteMat);

      const bodyGeo = new THREE.BoxGeometry(CW, CH, CD);
      disposables.push(bodyGeo);
      const body = new THREE.Mesh(bodyGeo, milkMat);
      body.castShadow = true;
      body.receiveShadow = true;
      body.position.y = CH / 2;
      body.userData.itemKey = it.key;
      g.add(body);
      cartonTargets.push(body);

      // the screen on the front face (YouTube still / Spotify badge)
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
        screenMat.map = tex;
        screenMat.needsUpdate = true;
        disposables.push(tex);
      };
      if (it.thumb) {
        texLoader.load(it.thumb, applyScreen, undefined, () => {
          if (it.thumbAlt) texLoader.load(it.thumbAlt, applyScreen, undefined, () => {});
        });
      } else if (it.spotifyId) {
        // Pull the track's cover art via Spotify oEmbed (CORS-enabled JSON).
        fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${it.spotifyId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d && d.thumbnail_url) texLoader.load(d.thumbnail_url, applyScreen, undefined, () => {});
          })
          .catch(() => {});
      }

      // gable (milk-carton) top — a front-facing triangular prism
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

      // white screw cap on the peak
      const capGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 18);
      disposables.push(capGeo);
      const cap = new THREE.Mesh(capGeo, whiteMat);
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

    // ---- place items: Producing on top, DJ Sets (+ collabs) on the racks ----
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
    // DJ Sets / collabs in rows of two: row 1 on the blue divider, then down
    const lowerYs = [yBlue, yBot, yBot - 1.05, yBot - 2.1];
    for (let i = 0; i < lower.length; i += 2) {
      placeRow(lower.slice(i, i + 2), lowerYs[i / 2] ?? yBot - 1.05 * (i / 2 - 1));
    }

    // ---- door (hinged left) ----
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-W / 2, H / 2, D / 2);
    fridge.add(doorPivot);

    const doorThick = 0.16;
    const door = box(W, H, doorThick, doorMat);
    door.position.set(W / 2, 0, doorThick / 2);
    doorPivot.add(door);
    fridgeTargets.push(door);

    const panel = box(W - 0.34, H - 0.34, 0.04, white({ color: 0xeceae3, roughness: 0.55 }));
    panel.position.set(W / 2, 0, doorThick + 0.01);
    doorPivot.add(panel);
    fridgeTargets.push(panel);

    const doorLiner = box(W - 0.2, H - 0.2, 0.02, interiorMat);
    doorLiner.position.set(W / 2, 0, -0.02);
    doorPivot.add(doorLiner);

    // wooden handle near the free (right) edge
    const handle = new THREE.Group();
    const barGeo = new THREE.CylinderGeometry(0.05, 0.05, H * 0.62, 16);
    disposables.push(barGeo);
    const bar = new THREE.Mesh(barGeo, woodMat);
    bar.castShadow = true;
    handle.add(bar);
    for (const sy of [-1, 1]) {
      const soGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12);
      disposables.push(soGeo);
      const so = new THREE.Mesh(soGeo, woodMat);
      so.rotation.x = Math.PI / 2;
      so.position.set(0, (sy * (H * 0.62)) / 2, -0.08);
      handle.add(so);
    }
    handle.position.set(W - 0.22, 0, doorThick + 0.1);
    doorPivot.add(handle);
    fridgeTargets.push(bar);

    // ---- lighting ----
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b0, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(5, 9, 6);
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
    const fill = new THREE.DirectionalLight(0xdfe7ff, 0.35);
    fill.position.set(-6, 4, 4);
    scene.add(fill);

    const groundGeo = new THREE.PlaneGeometry(40, 40);
    disposables.push(groundGeo);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.16 });
    disposables.push(groundMat);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ---- camera: fixed, stationary, facing the door head-on ----
    const target = new THREE.Vector3(0, H * 0.5, 0);
    // 3D anchor points the HTML category labels point at (right side of groups).
    const producingAnchor = new THREE.Vector3(W * 0.4, yProd + 0.34, D / 2);
    const setsAnchor = new THREE.Vector3(W * 0.4, (yBlue + yBot) / 2 + 0.3, D / 2);
    function project(v: THREE.Vector3) {
      const p = v.clone().project(camera);
      return { x: p.x * 0.5 + 0.5, y: -p.y * 0.5 + 0.5 };
    }
    function frameCamera() {
      // Fit the cabinet height to the viewport; pull back more on narrow stages.
      const aspect = camera.aspect || 1;
      const vFovHalf = THREE.MathUtils.degToRad(camera.fov) / 2;
      const fitH = H * 0.62; // half-height to fit (a little margin)
      const fitW = (W * 0.62) / aspect;
      const dist = Math.max(fitH, fitW) / Math.tan(vFovHalf) + 1.0;
      camera.position.set(0, target.y, dist);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      onLayoutRef.current({ producing: project(producingAnchor), sets: project(setsAnchor) });
    }

    // ---- pointer: click only (no orbit) — toggle door / select a carton ----
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function handlePick(e: PointerEvent | MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      // cartons first (only meaningful when open)
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
      renderer.setSize(w, h, false);
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
    const ZOOM_SCALE = 4.2; // how big the picked carton gets
    const ZOOM_DIST = 3.2; // its distance in front of the camera
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
      const cur = doorPivot.rotation.y;
      doorPivot.rotation.y += (targetAngleRef.current - cur) * 0.14;
      const openness = THREE.MathUtils.clamp(doorPivot.rotation.y / OPEN_ANGLE, 0, 1);
      innerLight.intensity = openness * 1.7;

      // The picked carton lifts up flat in front of the fridge and scales up, so
      // its own face fills the view (the video iframe is overlaid on that face).
      const camZ = camera.position.z;
      for (const g of cartonGroups) {
        const rest = g.userData.rest as { x: number; y: number; z: number };
        const picked = g.userData.itemKey === fallenKeyRef.current;
        const s = picked ? ZOOM_SCALE : 1;
        // place so the face WINDOW centre lands at screen centre, facing camera
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

      // Once the picked carton has settled, report its face rect for the iframe.
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
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fridge3d__mount" />;
}
