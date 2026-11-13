import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Tex, Mat } from './Textures.js';

/**
 * Procedural astronaut with two outfits:
 *   'suit'   — white EVA spacesuit + life-support pack + glass helmet (worn OUTSIDE on the surface)
 *   'casual' — navy flight jacket, tee, cargo trousers, boots, backpack (worn INSIDE habitats, no suit needed)
 * Crew profiles (see data/characters.js) change skin, hair style, jacket colour, beard/glasses and height.
 * Every limb is a joint pivot so AnimationController can pose it. Feet at y = 0, faces +Z, ~1.75 m tall.
 */
export function buildCommander(profile = {}) {
  const PF = { skin: 0xb98060, hair: 'bun', hairCol: 0x1b120e, jacket: 0x172a63, accent: 0xff7a3d, beard: false, glasses: false, scale: 1, ...profile };
  const root = new THREE.Group(), V2 = THREE.Vector2, fab = Tex.fabric().normal;
  let layer = 'body';
  const fabric = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.78, metalness: 0.03, normalMap: fab, normalScale: new V2(0.7, 0.7), ...o });
  const M = {
    navy: fabric(PF.jacket), navyD: fabric(new THREE.Color(PF.jacket).multiplyScalar(0.55).getHex()), tee: fabric(0x131419, { roughness: 0.9 }), pants: fabric(0x4b4a4f, { roughness: 0.88, normalScale: new V2(1.1, 1.1) }),
    pantsD: fabric(0x37363b, { roughness: 0.9 }), skin: new THREE.MeshStandardMaterial({ color: PF.skin, roughness: 0.5, metalness: 0 }), lip: new THREE.MeshStandardMaterial({ color: new THREE.Color(PF.skin).multiplyScalar(0.62).getHex(), roughness: 0.4 }),
    hair: new THREE.MeshStandardMaterial({ color: PF.hairCol, roughness: 0.85 }), black: Mat.paint(0x101114, { roughness: 0.55, metalness: 0.1 }), strap: fabric(0x15161a),
    boot: new THREE.MeshStandardMaterial({ color: 0x1f3170, roughness: 0.5, metalness: 0.05 }), sole: new THREE.MeshStandardMaterial({ color: 0xe9dcc6, roughness: 0.7 }), metal: Mat.metal(0xa9b2c2),
    brass: Mat.metal(0x9a7a45, { roughness: 0.45 }), white: Mat.paint(0xeef1f6, { roughness: 0.4, metalness: 0.15 }), accent: Mat.paint(PF.accent, { roughness: 0.5 }),
    cyan: Mat.glow(0x4fd1ff, 1.4), eyeW: new THREE.MeshStandardMaterial({ color: 0xf4f1ec, roughness: 0.3 }), iris: new THREE.MeshStandardMaterial({ color: 0x2a170f, roughness: 0.2 }),
    patch: new THREE.MeshStandardMaterial({ map: Tex.emblem(), roughness: 0.7, transparent: true, alphaTest: 0.3 }), glass: Mat.glass(0xcfe9ff, 0.16, { clearcoatRoughness: 0.03, envMapIntensity: 2.2 }),
    suitW: new THREE.MeshStandardMaterial({ color: 0xf2f4f8, roughness: 0.55, metalness: 0.08, normalMap: fab, normalScale: new V2(0.5, 0.5) }), suitG: Mat.metal(0x8b93a3, { roughness: 0.4 }), suitD: Mat.paint(0x2a303c, { roughness: 0.5, metalness: 0.3 }),
    glove: new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.7 }),
  };
  const mesh = (g, m, x = 0, y = 0, z = 0, p = null) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.userData.layer = layer; (p || root).add(o); return o; };
  const cap = (r, len, m, p, x = 0, y = 0, z = 0) => mesh(new THREE.CapsuleGeometry(r, len, 8, 20), m, x, y, z, p);
  const ell = (sx, sy, sz, m, p, x = 0, y = 0, z = 0, r = 0.5) => { const o = mesh(new THREE.SphereGeometry(r, 24, 16), m, x, y, z, p); o.scale.set(sx / r / 2, sy / r / 2, sz / r / 2); return o; };
  const rbox = (w, h, d, m, p, x = 0, y = 0, z = 0, rad = 0.012) => mesh(new RoundedBoxGeometry(w, h, d, 3, rad), m, x, y, z, p);
  const grp = (p, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };
  const torus = (R, r, m, p, x, y, z, sx = 1, sz = 1) => { const o = mesh(new THREE.TorusGeometry(R, r, 10, 28), m, x, y, z, p); o.rotation.x = Math.PI / 2; o.scale.set(sx, sz, 1); return o; };

  // ---------------- hips & legs ----------------
  const hips = grp(root, 0, 0.93, 0);
  layer = 'casual'; ell(0.36, 0.2, 0.24, M.pants, hips, 0, -0.02, 0); rbox(0.37, 0.05, 0.25, M.black, hips, 0, 0.07, 0); mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.006, 12), M.brass, 0, 0.07, 0.127, hips).rotation.x = Math.PI / 2;
  layer = 'suit'; ell(0.38, 0.22, 0.27, M.suitW, hips, 0, -0.02, 0); torus(0.19, 0.022, M.suitG, hips, 0, 0.07, 0, 1, 0.8);
  const leg = (side) => {
    const s = side === 'L' ? 1 : -1, hip = grp(hips, s * 0.095, -0.04, 0), knee = grp(hip, 0, -0.43, 0), ankle = grp(knee, 0, -0.42, 0);
    layer = 'casual';
    cap(0.095, 0.27, M.pants, hip, 0, -0.2, 0); rbox(0.055, 0.16, 0.12, M.pantsD, hip, s * 0.098, -0.2, 0.01); rbox(0.058, 0.05, 0.125, M.pants, hip, s * 0.098, -0.14, 0.01); rbox(0.012, 0.1, 0.02, M.black, hip, s * 0.129, -0.2, 0.03);
    cap(0.074, 0.27, M.pants, knee, 0, -0.2, 0); rbox(0.115, 0.11, 0.045, M.navy, knee, 0, 0.02, 0.075, 0.02); torus(0.078, 0.02, M.black, knee, 0, -0.4, 0);
    rbox(0.115, 0.1, 0.27, M.boot, ankle, 0, -0.01, 0.045, 0.04); rbox(0.12, 0.035, 0.295, M.sole, ankle, 0, -0.055, 0.045, 0.015); rbox(0.1, 0.05, 0.1, M.metal, ankle, 0, 0.02, 0.1, 0.02); rbox(0.075, 0.07, 0.03, M.white, ankle, 0, 0.055, 0.04, 0.012);
    layer = 'suit';
    cap(0.108, 0.27, M.suitW, hip, 0, -0.2, 0); torus(0.1, 0.02, M.suitG, knee, 0, 0.0, 0); cap(0.088, 0.27, M.suitW, knee, 0, -0.2, 0); rbox(0.13, 0.1, 0.05, M.suitG, knee, 0, 0.02, 0.085, 0.02); torus(0.09, 0.012, M.accent, hip, 0, -0.32, 0);
    rbox(0.14, 0.12, 0.3, M.suitW, ankle, 0, -0.01, 0.05, 0.045); rbox(0.145, 0.04, 0.32, M.suitD, ankle, 0, -0.065, 0.05, 0.015); rbox(0.142, 0.025, 0.2, M.accent, ankle, 0, 0.0, 0.08, 0.008);
    return { hip, knee, ankle };
  };
  const legL = leg('L'), legR = leg('R');

  // ---------------- spine / torso ----------------
  const spine = grp(root, 0, 0.99, 0), chest = grp(spine, 0, 0, 0);
  layer = 'casual';
  cap(0.145, 0.1, M.tee, chest, 0, 0.06, 0).scale.set(1.2, 1, 0.82);
  cap(0.165, 0.17, M.navy, chest, 0, 0.23, 0).scale.set(1.28, 1, 0.86);
  torus(0.19, 0.03, M.navyD, chest, 0, 0.01, 0, 1.12, 0.86); rbox(0.115, 0.36, 0.03, M.tee, chest, 0, 0.23, 0.135, 0.015);
  for (const s of [-1, 1]) { rbox(0.012, 0.37, 0.02, M.metal, chest, s * 0.062, 0.23, 0.142, 0.005); rbox(0.075, 0.33, 0.04, M.navy, chest, s * 0.105, 0.23, 0.125, 0.02); rbox(0.06, 0.07, 0.03, M.navyD, chest, s * 0.115, 0.14, 0.158, 0.008); rbox(0.045, 0.34, 0.02, M.strap, chest, s * 0.1, 0.24, 0.161, 0.008); rbox(0.04, 0.025, 0.016, M.metal, chest, s * 0.1, 0.16, 0.172, 0.004); }
  torus(0.095, 0.034, M.navyD, chest, 0, 0.43, -0.005, 1, 0.95); mesh(new THREE.CircleGeometry(0.036, 24), M.patch, -0.115, 0.3, 0.147, chest); rbox(0.07, 0.022, 0.012, M.black, chest, 0.115, 0.3, 0.147, 0.004);
  const pack = grp(chest, 0, 0.23, -0.19);
  rbox(0.34, 0.44, 0.17, Mat.paint(new THREE.Color(PF.jacket).multiplyScalar(0.8).getHex(), { roughness: 0.75, metalness: 0.05, normalMap: fab, normalScale: new V2(0.8, 0.8) }), pack, 0, 0, 0, 0.05);
  rbox(0.29, 0.2, 0.06, M.navy, pack, 0, -0.07, -0.1, 0.03); rbox(0.2, 0.16, 0.05, M.navyD, pack, 0, 0.1, -0.095, 0.02); mesh(new THREE.PlaneGeometry(0.1, 0.1), M.patch, 0, 0.1, -0.123, pack).rotation.y = Math.PI; rbox(0.07, 0.04, 0.02, M.metal, pack, 0, -0.07, -0.135, 0.008);
  for (const s of [-1, 1]) { rbox(0.035, 0.4, 0.014, M.brass, pack, s * 0.12, 0, -0.1, 0.004); rbox(0.075, 0.22, 0.12, M.navyD, pack, s * 0.2, -0.04, 0, 0.025); mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 16), M.white, s * 0.235, 0.05, -0.02, pack); }
  mesh(new THREE.TorusGeometry(0.05, 0.01, 8, 16, Math.PI), M.brass, 0, 0.225, 0, pack); rbox(0.05, 0.03, 0.03, M.cyan, pack, 0, 0.15, -0.13, 0.006);
  layer = 'suit';
  cap(0.19, 0.2, M.suitW, chest, 0, 0.22, 0).scale.set(1.2, 1, 0.92); cap(0.15, 0.1, M.suitW, chest, 0, 0.05, 0).scale.set(1.2, 1, 0.9); torus(0.2, 0.02, M.accent, chest, 0, 0.04, 0, 1.18, 0.92);
  rbox(0.17, 0.13, 0.05, M.suitD, chest, 0, 0.27, 0.172, 0.02); for (const [i, c] of [[-0.05, 0x4fd1ff], [0, 0xffc83d], [0.05, 0x5dff9a]]) rbox(0.025, 0.02, 0.012, Mat.glow(c, 1.6), chest, i, 0.3, 0.2, 0.004);
  mesh(new THREE.CircleGeometry(0.04, 24), M.patch, -0.11, 0.17, 0.176, chest); rbox(0.08, 0.025, 0.012, M.suitD, chest, 0.1, 0.17, 0.176, 0.004); torus(0.11, 0.04, M.suitG, chest, 0, 0.43, 0, 1, 1);
  const plss = grp(chest, 0, 0.24, -0.22); rbox(0.4, 0.5, 0.22, M.suitW, plss, 0, 0, 0, 0.05); rbox(0.34, 0.2, 0.04, M.suitD, plss, 0, 0.12, -0.115, 0.02); rbox(0.3, 0.06, 0.05, M.accent, plss, 0, -0.12, -0.11, 0.015);
  for (const s of [-1, 1]) { mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 14), M.suitG, s * 0.13, -0.02, -0.12, plss); rbox(0.03, 0.03, 0.015, Mat.glow(0x4fd1ff, 1.8), plss, s * 0.1, 0.2, -0.13, 0.004); }
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), M.suitG, 0.14, 0.34, -0.05, plss);

  // ---------------- arms ----------------
  const arm = (side) => {
    const s = side === 'L' ? 1 : -1, sh = grp(chest, s * 0.225, 0.36, 0), el = grp(sh, 0, -0.29, 0), wrist = grp(el, 0, -0.27, 0);
    layer = 'casual';
    ell(0.13, 0.12, 0.12, M.navy, sh); cap(0.066, 0.19, M.navy, sh, 0, -0.15, 0);
    const pt = mesh(new THREE.CircleGeometry(0.04, 24), M.patch, s * 0.068, -0.1, 0, sh); pt.rotation.y = s * Math.PI / 2; rbox(0.035, 0.09, 0.07, M.navyD, sh, s * 0.062, -0.2, -0.015, 0.012);
    cap(0.06, 0.07, M.navy, el, 0, -0.04, 0); torus(0.062, 0.025, M.navyD, el, 0, -0.095, 0); cap(0.046, 0.12, M.skin, el, 0, -0.17, 0);
    layer = 'body'; ell(0.085, 0.11, 0.05, M.skin, wrist, 0, -0.045, 0); ell(0.03, 0.07, 0.035, M.skin, wrist, s * 0.04, -0.035, 0.015).rotation.z = -s * 0.4;
    layer = 'casual'; if (side === 'L') { torus(0.05, 0.014, M.black, el, 0, -0.245, 0); rbox(0.045, 0.014, 0.05, M.black, el, 0, -0.247, 0.045, 0.006); rbox(0.032, 0.004, 0.032, M.cyan, el, 0, -0.254, 0.045, 0.002); }
    layer = 'suit';
    ell(0.18, 0.17, 0.17, M.suitG, sh); cap(0.078, 0.19, M.suitW, sh, 0, -0.15, 0); torus(0.08, 0.012, M.accent, sh, 0, -0.14, 0); const pt2 = mesh(new THREE.CircleGeometry(0.042, 24), M.patch, s * 0.082, -0.08, 0, sh); pt2.rotation.y = s * Math.PI / 2;
    torus(0.075, 0.02, M.suitG, el, 0, 0, 0); cap(0.068, 0.14, M.suitW, el, 0, -0.14, 0); torus(0.064, 0.02, M.suitG, el, 0, -0.255, 0);
    rbox(0.1, 0.15, 0.075, M.glove, wrist, 0, -0.06, 0, 0.03); for (let i = 0; i < 3; i++) rbox(0.022, 0.05, 0.05, M.suitD, wrist, -0.03 + i * 0.03, -0.15, 0, 0.01);
    return { sh, el, wrist };
  };
  const armL = arm('L'), armR = arm('R');

  // ---------------- neck & head ----------------
  layer = 'body';
  const neck = grp(spine, 0, 0.46, 0); mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.09, 16), M.skin, 0, 0.03, 0, neck);
  const head = grp(neck, 0, 0.1, 0.005);
  ell(0.185, 0.225, 0.2, M.skin, head, 0, 0.09, 0); ell(0.12, 0.1, 0.12, M.skin, head, 0, 0.035, 0.025); ell(0.034, 0.04, 0.04, M.skin, head, 0, 0.085, 0.1);
  for (const s of [-1, 1]) {
    ell(0.034, 0.022, 0.02, M.eyeW, head, s * 0.04, 0.115, 0.083); ell(0.02, 0.02, 0.012, M.iris, head, s * 0.04, 0.115, 0.093);
    const br = rbox(0.045, 0.01, 0.014, M.hair, head, s * 0.04, 0.143, 0.088, 0.004); br.rotation.z = -s * 0.12; ell(0.03, 0.05, 0.03, M.skin, head, s * 0.093, 0.09, -0.005);
  }
  ell(0.05, 0.016, 0.02, M.lip, head, 0, 0.037, 0.093);
  const rnd = (() => { let q = 7; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })();
  const cap1 = mesh(new THREE.SphereGeometry(0.106, 28, 18, 0, Math.PI * 2, 0, Math.PI * (PF.hair === 'short' ? 0.5 : 0.6)), M.hair, 0, 0.1, -0.012, head); cap1.scale.set(1.02, 1.03, 1.08); cap1.rotation.x = -0.28;
  if (PF.hair === 'bun') {
    for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 1.7 + Math.PI * 0.15, y = 0.04 + rnd() * 0.17, r = 0.09 + rnd() * 0.025; const c = mesh(new THREE.SphereGeometry(0.02 + rnd() * 0.014, 8, 6), M.hair, Math.cos(a) * r * (rnd() > 0.5 ? 1 : -1), y, -Math.abs(Math.sin(a)) * r * 0.9, head); c.scale.y = 1.3; }
    mesh(new THREE.SphereGeometry(0.058, 16, 12), M.hair, 0, 0.255, -0.045, head); torus(0.052, 0.008, M.accent, head, 0, 0.232, -0.045);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(0.014, 6, 5), M.hair, s * (0.075 + i * 0.006), 0.045 - i * 0.025, 0.03 - i * 0.012, head);
  } else if (PF.hair === 'ponytail') {
    for (let i = 0; i < 5; i++) { const o = mesh(new THREE.SphereGeometry(0.034 - i * 0.003, 10, 8), M.hair, 0, 0.17 - i * 0.04, -0.12 - i * 0.025, head); o.scale.set(1, 1.5, 1); } torus(0.03, 0.008, M.accent, head, 0, 0.16, -0.11);
  } else if (PF.hair === 'afro') {
    const big = mesh(new THREE.SphereGeometry(0.15, 24, 18), M.hair, 0, 0.15, -0.02, head); big.scale.set(1.0, 0.82, 1.0);
    for (let i = 0; i < 40; i++) { const a = rnd() * 6.28, b = rnd() * 1.2, r = 0.145; mesh(new THREE.SphereGeometry(0.022, 6, 5), M.hair, Math.cos(a) * Math.sin(b) * r, 0.15 + Math.cos(b) * r * 0.82, -0.02 + Math.sin(a) * Math.sin(b) * r, head); }
  } else { // short crop
    for (let i = 0; i < 12; i++) { const a = rnd() * 6.28; mesh(new THREE.SphereGeometry(0.02, 6, 5), M.hair, Math.cos(a) * 0.09, 0.18 + rnd() * 0.04, Math.sin(a) * 0.09 - 0.02, head); }
  }
  if (PF.beard) { ell(0.14, 0.09, 0.12, M.hair, head, 0, 0.005, 0.04); ell(0.06, 0.016, 0.02, M.hair, head, 0, 0.056, 0.098); ell(0.03, 0.06, 0.03, M.hair, head, 0.06, 0.04, 0.05); ell(0.03, 0.06, 0.03, M.hair, head, -0.06, 0.04, 0.05); }
  if (PF.glasses) { for (const s of [-1, 1]) { const g = mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 20), M.black, s * 0.04, 0.115, 0.1, head); void g; } rbox(0.03, 0.005, 0.005, M.black, head, 0, 0.12, 0.1, 0.002); }
  // helmet — clear glass bubble (suit only)
  layer = 'suit'; const helmet = grp(neck, 0, 0.1, 0.005);
  mesh(new THREE.SphereGeometry(0.185, 36, 24), M.glass, 0, 0.09, 0, helmet); torus(0.118, 0.026, M.suitG, helmet, 0, -0.035, 0, 1, 1.05); mesh(new THREE.TorusGeometry(0.122, 0.005, 6, 40), M.cyan, 0, -0.01, 0, helmet).rotation.x = Math.PI / 2;
  rbox(0.05, 0.04, 0.04, M.suitG, helmet, 0.17, 0.08, 0, 0.01); rbox(0.05, 0.04, 0.04, M.suitG, helmet, -0.17, 0.08, 0, 0.01); mesh(new THREE.SphereGeometry(0.014, 8, 6), M.cyan, 0, 0.27, 0.1, helmet);
  const lamp = mesh(new THREE.SphereGeometry(0.02, 8, 6), Mat.glow(0xfff1c8, 3), 0, 0.2, 0.17, helmet); lamp.userData.layer = 'suit';

  // ---------------- finish ----------------
  root.traverse((o) => { if (o.isMesh) { o.castShadow = o.material !== M.glass; o.receiveShadow = true; } });
  root.scale.setScalar(PF.scale);
  let mode = 'suit', helmetOn = true;
  const apply = () => { root.traverse((o) => { if (o.isMesh) o.visible = o.userData.layer === 'body' || o.userData.layer === mode; }); helmet.visible = mode === 'suit' && helmetOn; };
  const rig = { root, hips, spine, chest, neck, head, legL, legR, armL, armR, helmet, lamp,
    setOutfit(m) { mode = m; apply(); }, setHelmet(v) { helmetOn = v; apply(); }, get outfit() { return mode; } };
  armL.sh.rotation.z = 0.1; armR.sh.rotation.z = -0.1; armL.el.rotation.x = -0.12; armR.el.rotation.x = -0.12; apply();
  return { group: root, rig, height: 1.76 * PF.scale };
}
