import * as THREE from 'three';
import { Tex, Mat, rep } from './Textures.js';
import { STATION_INFO } from '../data/nasaSources.js';

const V3 = THREE.Vector3;
/** Builds the enterable rooms. They live far above the map (y = 800) and are visited through airlock doors. */
const DEFS = {
  Habitat: { w: 22, d: 16, h: 4.2, floor: 0x5b6272, wall: 0xdfe4ec, accent: 0x4fd1ff, ox: 1000 },
  Greenhouse: { w: 20, d: 14, h: 4.6, floor: 0x6b5a4a, wall: 0xe7efe9, accent: 0xff6ad5, ox: 1060 },
  ResearchLab: { w: 16, d: 12, h: 4.0, floor: 0x4b5566, wall: 0xe9edf3, accent: 0x4fd1ff, ox: 1120 },
  RepairStation: { w: 20, d: 14, h: 4.8, floor: 0x3d424d, wall: 0xcfd5de, accent: 0xffc83d, ox: 1180 },
  RadiationShelter: { w: 12, d: 10, h: 3.5, floor: 0x3a3b40, wall: 0x6b6a70, accent: 0xc58bff, ox: 1240 },
};
const Y0 = 800;

export function buildInteriors(world) {
  const out = new Map();
  for (const [key, def] of Object.entries(DEFS)) out.set(key, build(world, key, def));
  return out;
}

function build(world, key, def) {
  const { w, d, h } = def, ox = def.ox, oz = 0, group = new THREE.Group(); world.root.add(group);
  const I = { key, parentKey: key, group, w, d, h, y: Y0, ox, oz, boxes: [], stations: new Map(), lightPos: [], entry: new V3(ox, Y0, oz + d / 2 - 2.2), exitLoc: null, windowMat: null,
    bounds: { x0: ox - w / 2 + 0.6, x1: ox + w / 2 - 0.6, z0: oz - d / 2 + 0.6, z1: oz + d / 2 - 0.6 } };
  const panel = (c, rx = 1, ry = 1, o = {}) => { const m = Mat.panel(c, o); m.map = rep(m.map, rx, ry); m.normalMap = rep(m.normalMap, rx, ry); return m; };
  const paint = (c, o = {}) => Mat.paint(c, o), glow = (c, i = 1) => Mat.glow(c, i), metal = (c) => Mat.metal(c, { roughness: 0.45 });
  const put = (m, x, y, z, ry = 0) => { m.position.set(ox + x, Y0 + y, oz + z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; group.add(m); return m; };
  const box = (bw, bh, bd, mat) => new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
  const cyl = (r, hh, mat, s = 16) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, hh, s), mat);
  const furn = (x, z, fw, fd, fh, mat, solid = true, y0 = 0) => { const m = put(box(fw, fh, fd, mat), x, y0 + fh / 2, z); if (solid) I.boxes.push({ x0: ox + x - fw / 2 - 0.1, x1: ox + x + fw / 2 + 0.1, z0: oz + z - fd / 2 - 0.1, z1: oz + z + fd / 2 + 0.1 }); return m; };
  const station = (k, x, z) => { const loc = { key: k, boxes: [new THREE.Box3(new V3(ox + x - 0.7, Y0, oz + z - 0.7), new V3(ox + x + 0.7, Y0 + 2, oz + z + 0.7))], center: new V3(ox + x, Y0 + 1, oz + z), top: Y0 + 2.3, size: 1.4, interior: I, beacon: null, lights: [] };
    loc.distanceTo = (p) => Math.max(0, Math.hypot(p.x - loc.center.x, p.z - loc.center.z) - 0.4); loc.target = () => new V3(loc.center.x, Y0 + 2, loc.center.z); I.stations.set(k, loc); return loc; };

  // ---- shell ----
  const floorM = panel(def.floor, w / 3, d / 3, { metalness: 0.2, roughness: 0.6 }), wallM = panel(def.wall, w / 4, 1, { roughness: 0.55 });
  put(box(w, 0.3, d, floorM), 0, -0.15, 0); put(box(w, 0.3, d, panel(0xf2f4f8, w / 4, d / 4)), 0, h + 0.15, 0);
  put(box(w, h, 0.4, wallM), 0, h / 2, -d / 2 - 0.2); put(box(0.4, h, d, wallM), -w / 2 - 0.2, h / 2, 0); put(box(0.4, h, d, wallM), w / 2 + 0.2, h / 2, 0);
  put(box(w, h, 0.4, wallM), 0, h / 2, d / 2 + 0.2);
  put(box(w, 0.25, 0.1, glow(def.accent, 1.2)), 0, 0.9, -d / 2 + 0.06); put(box(w, 0.25, 0.1, glow(def.accent, 1.2)), 0, 0.9, d / 2 - 0.06);   // glowing trim
  for (let i = 0; i < Math.floor(w / 6); i++) for (let j = 0; j < Math.floor(d / 6) + 1; j++) { const x = -w / 2 + 3 + i * 6, z = -d / 2 + 2.5 + j * 5.5; put(box(2.6, 0.08, 0.5, glow(0xfff4dd, 2.2)), x, h - 0.05, z); if (I.lightPos.length < 4) I.lightPos.push(new V3(ox + x, Y0 + h - 0.6, oz + z)); }
  while (I.lightPos.length < 4) I.lightPos.push(new V3(ox, Y0 + h - 0.6, oz));
  I.windowMat = new THREE.MeshBasicMaterial({ color: 0xe0a070 }); put(new THREE.Mesh(new THREE.PlaneGeometry(Math.min(8, w * 0.4), 1.6), I.windowMat), 0, 2.3, -d / 2 + 0.03);   // window to the Martian sky
  put(box(Math.min(8, w * 0.4) + 0.3, 0.12, 0.12, metal(0x8a93a6)), 0, 3.15, -d / 2 + 0.05); put(box(Math.min(8, w * 0.4) + 0.3, 0.12, 0.12, metal(0x8a93a6)), 0, 1.45, -d / 2 + 0.05);
  // exit door (airlock)
  put(box(2.4, 3, 0.3, metal(0x39414f)), 0, 1.5, d / 2 - 0.1); put(box(1.7, 2.5, 0.35, glow(0x4fd1ff, 0.6)), 0, 1.35, d / 2 - 0.12); put(box(2.2, 0.3, 0.1, new THREE.MeshStandardMaterial({ map: Tex.sign('EXIT ▸ MARS', 'airlock'), emissiveMap: Tex.sign('EXIT ▸ MARS', 'airlock'), emissive: 0xffffff, emissiveIntensity: 0.6 })), 0, 3.4, d / 2 - 0.2);
  I.exitLoc = { key: '__exit', center: new V3(ox, Y0 + 1, oz + d / 2 - 0.8), distanceTo: (p) => Math.hypot(p.x - ox, p.z - (oz + d / 2 - 0.5)) - 0.4, target: () => new V3(ox, Y0 + 2, oz + d / 2 - 0.5), boxes: [], top: Y0 + 3 };
  const plant = (x, z) => { put(cyl(0.3, 0.5, paint(0x6b4328)), x, 0.25, z); const p = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), Mat.glow(0x3fb55a, 0.25)); p.scale.y = 1.3; put(p, x, 0.95, z); };
  const chair = (x, z, ry = 0) => { put(cyl(0.3, 0.1, paint(0x2b3345)), x, 0.5, z); const b = put(box(0.5, 0.5, 0.1, paint(0x2b3345)), x, 0.85, z - 0.25 * Math.cos(ry)); void b; put(cyl(0.05, 0.5, metal(0x8a93a6), 8), x, 0.25, z); };
  const screen = (x, y, z, col, ry = 0, sw = 1.1, sh = 0.7) => { const s = put(new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), Mat.glow(col, 1.1)), x, y, z, ry); put(box(sw + 0.08, sh + 0.08, 0.06, paint(0x15181f)), x, y, z - 0.04 * Math.cos(ry), ry); return s; };

  if (key === 'Habitat') {
    furn(-7, -5.8, 5, 1.6, 0.95, panel(0x39414f, 1, 1)); for (let i = -1; i <= 1; i++) screen(-7 + i * 1.5, 1.55, -6.2, [0x4fd1ff, 0x5dff9a, 0xffc83d][i + 1], 0.0); chair(-7, -4.4); station('Console', -7, -3.9);
    furn(7.5, -7, 6, 1.1, 1.0, metal(0xb9c0cc)); furn(9.8, -7, 1.3, 1.1, 2.1, panel(0xeef1f6, 1, 1)); screen(9.8, 1.6, -6.4, 0xff7a3d, 0, 0.8, 0.5); station('Galley', 5.5, -3.4);
    furn(5.5, -2, 3.2, 1.5, 0.8, panel(0xf2f4f8, 1, 1)); for (const [x, z] of [[4.2, -3.1], [6.8, -3.1], [4.2, -0.9], [6.8, -0.9]]) put(cyl(0.3, 0.45, paint(0xff7a3d), 12), x, 0.22, z);
    for (const [x, c] of [[4.5, 0xffc83d], [5.5, 0xe0563a], [6.5, 0x5dbb63]]) put(new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), Mat.glow(c, 0.5)), x, 0.95, -2);
    for (const z of [0.2, 3.6]) { furn(9.5, z, 2, 3, 0.7, paint(0x39414f)); furn(9.5, z, 1.9, 2.9, 0.12, paint(0xf2f4f8), false, 0.7); put(box(1.9, 0.18, 1.2, paint(def.accent === 0x4fd1ff ? 0x1c5a8a : 0x444)), 9.5, 0.9, z - 0.7); }
    station('Bed', 7.6, 1.9);
    furn(-10.3, 3, 1, 6.5, 2.3, metal(0x9aa4b6)); for (let i = 0; i < 6; i++) put(box(0.05, 2, 0.8, paint(0x2a303c)), -9.78, 1.2, 0.2 + i * 1.05); station('Locker', -8.5, 3.2);
    for (const z of [5.4, 6.6]) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.7, 6, 14), paint(0xf2f4f8)); body.position.y = 1.1; g.add(body); const hl = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), Mat.glass(0xcfe9ff, 0.3)); hl.position.y = 1.85; g.add(hl); put(g, -9.0, 0, z); }
    const holo = put(cyl(1.3, 0.9, panel(0x2b3345, 1, 1)), 0, 0.45, -1); put(new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), Mat.glow(0xd0603a, 0.7)), 0, 1.5, -1); I.boxes.push({ x0: ox - 1.5, x1: ox + 1.5, z0: oz - 2.5, z1: oz + 0.5 }); void holo;
    plant(-10, -7); plant(10, 7); plant(-2.5, 6.5);
  } else if (key === 'Greenhouse') {
    const soil = paint(0x4a3224, { roughness: 1 }), tray = panel(0xdfe6e0, 2, 1);
    const plantMat = Mat.glow(0x3fc25a, 0.35), fruit = Mat.glow(0xe0463a, 0.5), N = 4 * 8 * 2, pm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 10, 8), plantMat, N), fm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), fruit, N), o3 = new THREE.Object3D(); let n = 0;
    for (const [bx, bz] of [[-5, -4.6], [5, -4.6], [-5, 0.4], [5, 0.4]]) { furn(bx, bz, 7.4, 1.6, 0.8, tray); furn(bx, bz, 7.0, 1.2, 0.12, soil, false, 0.8); for (let i = 0; i < 8; i++) for (let k = 0; k < 2; k++) { const px = bx - 3.2 + i * 0.92, pz = bz - 0.3 + k * 0.6; o3.position.set(ox + px, Y0 + 1.25, oz + pz); o3.scale.set(1, 1.2 + (i % 3) * 0.2, 1); o3.updateMatrix(); pm.setMatrixAt(n, o3.matrix); o3.position.y += 0.2; o3.position.x += 0.12; o3.scale.setScalar(1); o3.updateMatrix(); fm.setMatrixAt(n, o3.matrix); n++; }
      put(box(7.2, 0.1, 0.5, glow(0xff6ad5, 1.8)), bx, 2.8, bz); }
    pm.count = fm.count = n; group.add(pm, fm);
    furn(0, -4.2, 2, 1.0, 0.95, panel(0x39414f, 1, 1)); screen(0, 1.5, -4.6, 0x5dff9a, 0, 0.9, 0.6); station('Planter', 0, -2.9);
    furn(0, 4.2, 3.4, 1.2, 0.9, panel(0xf2f4f8, 1, 1)); for (let i = 0; i < 6; i++) put(new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), Mat.glow([0xe0463a, 0x5dbb63, 0xffc83d][i % 3], 0.5)), -1.2 + i * 0.5, 1.05, 4.2); station('Harvest', 0, 2.7);
    put(cyl(1.1, 2.4, Mat.glass(0x9fd8ff, 0.5), 16), -9, 1.2, 5.6); I.boxes.push({ x0: ox - 10.2, x1: ox - 7.8, z0: oz + 4.4, z1: oz + 6.8 }); plant(9, 5.8);
    for (let i = 0; i < 2; i++) put(cyl(0.08, w - 2, metal(0x9aa4b6), 8), 0, 3.9, -2 + i * 5).rotation.z = Math.PI / 2;
  } else if (key === 'ResearchLab') {
    for (const [x, z] of [[-4, -4.2], [3, -4.2]]) { furn(x, z, 5, 1.5, 0.95, panel(0xe6ebf2, 2, 1)); put(cyl(0.12, 0.3, Mat.glass(0xbfe6ff, 0.6), 10), x - 1.5, 1.1, z); put(cyl(0.1, 0.25, Mat.glass(0xffc8a0, 0.6), 10), x - 1.1, 1.08, z + 0.2); const mic = put(box(0.25, 0.5, 0.25, paint(0x2a303c)), x + 1, 1.2, z); void mic; }
    for (let i = 0; i < 3; i++) screen(-5 + i * 2.6, 2.6, -d / 2 + 0.12, [0x4fd1ff, 0x5dff9a, 0xff7a3d][i], 0, 2, 1.1);
    station('LabBench', -4, -2.6); furn(6.3, -4.6, 1.4, 1.0, 2.1, metal(0xcfd5de)); furn(0, 1.5, 3, 1.4, 0.95, panel(0xe6ebf2, 2, 1)); put(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 10, 24), Mat.glow(0x4fd1ff, 1.6)), 0, 1.7, 1.5).rotation.x = Math.PI / 2; chair(-4, -1.2); chair(1.5, 3.2); plant(-7, 4.8);
  } else if (key === 'RepairStation') {
    furn(-6, -5.8, 6.5, 1.5, 1.0, panel(0x555d6b, 2, 1)); const wall = put(box(7, 2, 0.12, panel(0x39414f, 3, 1)), -6, 2.2, -d / 2 + 0.15); void wall; for (let i = 0; i < 9; i++) put(box(0.12, 0.7, 0.05, paint([0xffc83d, 0xe0463a, 0x4fd1ff][i % 3])), -8.6 + i * 0.65, 2.5, -d / 2 + 0.25);
    station('Workbench', -6, -4.1); furn(7, -5.5, 2.4, 1.2, 1.3, paint(0xe0463a)); for (let i = 0; i < 3; i++) put(cyl(0.6, 0.35, paint(0x18191d, { roughness: 0.9 }), 18), 5, 0.18 + i * 0.36, 2);
    I.boxes.push({ x0: ox + 4.3, x1: ox + 5.7, z0: oz + 1.3, z1: oz + 2.7 }); const ch = put(box(3.4, 0.7, 1.7, paint(0x394152)), 2.5, 0.7, 0.5); put(box(3.0, 0.2, 1.4, paint(0xff7a3d)), 2.5, 1.15, 0.5); for (const x of [1.3, 3.7]) for (const z of [-0.4, 1.4]) { const wh = cyl(0.45, 0.4, paint(0x18191d, { roughness: 0.9 }), 14); wh.rotation.x = Math.PI / 2; put(wh, x, 0.45, z); } void ch; I.boxes.push({ x0: ox + 0.6, x1: ox + 4.4, z0: oz - 0.6, z1: oz + 1.6 });
    put(box(0.5, 3.2, 0.5, metal(0x8a93a6)), -3, 1.6, 1.2); I.boxes.push({ x0: ox - 3.4, x1: ox - 2.6, z0: oz + 0.8, z1: oz + 1.6 });
  } else {
    for (const s of [-1, 1]) { furn(s * 4.6, 0.5, 1, 6, 0.5, panel(0x555560, 1, 1)); furn(s * 4.6, 0.5, 0.9, 5.8, 0.1, paint(def.accent === 0xc58bff ? 0x44335c : 0x333), false, 0.5); }
    put(box(5, 1.6, 0.15, paint(0x15181f)), 0, 1.7, -d / 2 + 0.2); put(new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.3), Mat.glow(0x5dff9a, 1.1)), 0, 1.7, -d / 2 + 0.3); station('Dosimeter', 0, -3.3);
    for (let i = 0; i < 4; i++) furn(-3.5 + i * 2.3, 3.6, 1.1, 1.1, 1.1, panel(0xb0b5a0, 1, 1)); put(new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 8, 28), Mat.glow(0xc58bff, 1.4)), 0, 2.4, 0).rotation.x = Math.PI / 2;
  }
  for (const [k, loc] of I.stations) { loc.name = (STATION_INFO[k] || {}).name; }
  I.group.visible = true;
  return I;
}
