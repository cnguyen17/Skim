// TEMP tuner — renders the production BioCartonCanvas but lets us override the
// scene's MODEL yaw/scale and LABEL placement live from the URL query, so framing
// + the carton label can be dialed in via screenshots without edit/reload cycles.
// Delete this route + file (and the MODEL/LABEL exports it pokes) once set.
//
//   /_model?yaw=-120&sc=2.8&px=0&py=-0.9&lx=0.16&ly=0.29&lz=0.135&rx=0&ry=90&rz=0&lw=0.235&lh=0.45&dbg=1

import { useEffect } from "react";
import BioCartonCanvas from "../components/BioCartonCanvas";
import { preloadLabelTexture } from "../three/useLabelTexture";
import { MODEL, LABEL, CAMERA } from "../three/BearMilkScene";

function applyQuery() {
  const q = new URLSearchParams(window.location.search);
  const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d);
  if (q.has("yaw")) MODEL.yaw = (num("yaw", -120) * Math.PI) / 180;
  MODEL.scale = num("sc", MODEL.scale);
  MODEL.position = [num("px", MODEL.position[0]), num("py", MODEL.position[1]), num("pz", MODEL.position[2])];
  LABEL.pos = [num("lx", LABEL.pos[0]), num("ly", LABEL.pos[1]), num("lz", LABEL.pos[2])];
  LABEL.rot = [
    (num("rx", (LABEL.rot[0] * 180) / Math.PI) * Math.PI) / 180,
    (num("ry", (LABEL.rot[1] * 180) / Math.PI) * Math.PI) / 180,
    (num("rz", (LABEL.rot[2] * 180) / Math.PI) * Math.PI) / 180,
  ];
  LABEL.width = num("lw", LABEL.width);
  LABEL.height = num("lh", LABEL.height);
  LABEL.debug = num("dbg", 0) === 1;
  CAMERA.y = num("cy", CAMERA.y);
  CAMERA.z = num("cz", CAMERA.z);
  CAMERA.fov = num("fov", CAMERA.fov);
}

export default function ModelDiag() {
  applyQuery();
  useEffect(() => void preloadLabelTexture(), []);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0F0E0C", display: "grid", placeItems: "center" }}>
      <div style={{ position: "relative", width: 442, height: 760, outline: "1px solid #222" }}>
        <BioCartonCanvas />
      </div>
      <div style={{ position: "fixed", top: 10, left: 12, font: "11px monospace", color: "#58D7FF" }}>
        {window.location.search || "defaults"}
      </div>
    </div>
  );
}
