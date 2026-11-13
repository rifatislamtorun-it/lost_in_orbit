import * as THREE from 'three';
import { Mat, Tex } from './Textures.js';
import { CONFIG } from '../config/game.config.js';

const V3 = THREE.Vector3;
/** The story's landing cinematic: entry fireball → parachute → retro-rockets → touchdown beside the outpost pad. */
export class Landing {
  constructor(game) { this.g = game; this.active = false; this.t = 0; this.cap = null; this.built = false; }
  build() {
    const g = this.g, w = g.world, lz = w.locations.get('LandingZone'), P = lz ? lz.center.clone() : w.spawn.clone();
    const tx = P.x + 8, tz = P.z + 8, ty = w.groundAt(tx, tz, P.y + 5) ?? P.y; this.T = new V3(tx, ty, tz);
    const cap = new THREE.Group(), white = Mat.panel(0xf2f4f8), shield = Mat.paint(0x5a2a14, { roughness: 0.9, metalness: 0.2 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.9, 2.8, 28), white); body.position.y = 1.7; cap.add(body);
    const hs = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.85, 0.3, 28), shield); hs.position.y = 0.15; cap.add(hs);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.95, 0.5, 20), Mat.paint(0xff7a3d)); top.position.y = 3.35; cap.add(top);
    const win = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), Mat.glow(0x9fe3ff, 1.2)); win.scale.z = 0.4; win.position.set(0, 2.1, 1.38); win.rotation.x = -0.25; cap.add(win);
    const logo = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), new THREE.MeshStandardMaterial({ map: Tex.emblem(), transparent: true, alphaTest: 0.3 })); logo.position.set(0, 1.35, 1.58); logo.rotation.x = -0.45; cap.add(logo);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78, n = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.5, 10), Mat.metal(0x6c7587)); n.position.set(Math.cos(a) * 1.2, 0.5, Math.sin(a) * 1.2); cap.add(n); }
    this.flame = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4.5, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); this.flame.rotation.x = Math.PI; this.flame.position.y = -2; cap.add(this.flame);
    this.fire = new THREE.Mesh(new THREE.SphereGeometry(2.9, 18, 14), new THREE.MeshBasicMaterial({ color: 0xff6a20, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); this.fire.position.y = 0.4; this.fire.scale.y = 1.5; cap.add(this.fire);
    const ch = new THREE.Group(), cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const x = cv.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f2f2f2' : '#ff6a2a'; x.fillRect(i * 32, 0, 32, 64); } const ct = new THREE.CanvasTexture(cv); ct.colorSpace = THREE.SRGBColorSpace;
    const can = new THREE.Mesh(new THREE.SphereGeometry(6.5, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ map: ct, side: THREE.DoubleSide, roughness: 0.9 })); can.position.y = 15; ch.add(can);
    const pts = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; pts.push(new V3(Math.cos(a) * 6.4, 15, Math.sin(a) * 6.4), new V3(0, 3.8, 0)); } ch.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xeeeeee })));
    cap.add(ch); this.chute = ch; cap.traverse((o) => { if (o.isMesh) o.castShadow = true; }); this.cap = cap; g.scene.add(cap); this.built = true;
  }
  start(done) {
    const g = this.g; if (!this.built) this.build(); this.done = done; this.active = true; this.t = 0; this.cap.visible = true; this.chute.visible = false; this.fireOn = true; this.touch = false; this.chuteGone = false;
    this.S = new V3(-75, 0, -120); g.dayNight.setHour(CONFIG.time.startHour); g.hud.show(false); g.player.group.visible = false; this.caption('ENTRY — the heat shield glows');
    g.audio.sfx('warn'); this.said = new Set();
  }
  caption(t) { this.g.introUI.caption(t); }
  skip() { if (this.active) this.finish(); }
  finish() {
    const g = this.g; this.active = false; this.caption(null); this.cap.position.copy(this.T); this.cap.visible = true; this.chute.visible = false; this.flame.visible = false; this.fire.visible = false;
    g.world.circles.push({ x: this.T.x, z: this.T.z, r: 2.4 }); this.d = this.done; this.done = null; this.d && this.d();
  }
  update(dt) {
    const g = this.g; this.t += dt; const t = this.t, T = this.T, u = Math.min(1, t / 15), q = Math.pow(1 - u, 1.8), off = this.S.clone().multiplyScalar(Math.pow(1 - u, 2));
    this.cap.position.set(T.x + off.x, T.y + 260 * q + 0.01, T.z + off.z); this.cap.rotation.set(Math.sin(t * 1.3) * 0.08 * (1 - u), t * 0.2, Math.cos(t * 1.1) * 0.08 * (1 - u));
    const say = (k, tx, sfx) => { if (!this.said.has(k)) { this.said.add(k); this.caption(tx); sfx && g.audio.sfx(sfx); } };
    this.fire.visible = t < 5.2; if (this.fire.visible) { this.fire.material.opacity = 0.6 * Math.max(0, 1 - t / 5.2) + 0.1 * Math.sin(t * 30); this.fire.scale.set(1 + 0.1 * Math.sin(t * 25), 1.5, 1 + 0.1 * Math.cos(t * 22)); }
    if (t > 5 && t < 12.6) { say('p', 'PARACHUTE OPENS — the thin air slows the capsule', 'accept'); this.chute.visible = true; const s = Math.min(1, (t - 5) / 1.1); this.chute.scale.setScalar(0.1 + 0.9 * s); }
    if (t >= 12.6 && !this.chuteGone) { this.chuteGone = true; this.chute.visible = false; }
    this.flame.visible = t > 11.4 && t < 15.3; if (this.flame.visible) { say('r', 'RETRO-ROCKETS FIRE — soft landing!', 'warn'); this.flame.scale.set(1 + 0.2 * Math.sin(t * 40), 0.8 + 0.4 * Math.random(), 1 + 0.2 * Math.cos(t * 37)); this.cap.rotation.set(0, this.cap.rotation.y, 0); }
    if (t > 11.6 && t < 16 && this.cap.position.y < T.y + 30) g.puffs.emit(new V3(T.x, T.y, T.z), 3, 3);
    if (t >= 15 && !this.touch) { this.touch = true; say('t', 'TOUCHDOWN! Welcome to Mars.', 'complete'); g.puffs.emit(T, 22, 3.5); }
    // camera
    const cam = g.camera, c0 = new V3(T.x - 42, T.y + 7, T.z + 40), look = this.cap.position.clone(); look.y = Math.max(look.y, T.y + 2);
    if (t < 15.5) { cam.position.set(c0.x, c0.y + Math.min(40, (this.cap.position.y - T.y) * 0.12), c0.z); cam.lookAt(look); }
    else { const k = Math.min(1, (t - 15.5) / 2.5); cam.position.lerpVectors(c0, new V3(T.x - 13, T.y + 3.5, T.z + 13), k); cam.lookAt(T.x, T.y + 1.8, T.z); }
    if (t > 18.2) this.finish();
  }
}
