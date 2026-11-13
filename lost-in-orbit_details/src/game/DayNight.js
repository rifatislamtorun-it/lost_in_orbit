import * as THREE from 'three';
import { CONFIG } from '../config/game.config.js';
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const C = (h) => new THREE.Color(h);
const PH = { day: { hor: C(0xeab58a), mid: C(0xc98a6c), zen: C(0x7d6574) }, dusk: { hor: C(0xf0905c), mid: C(0x8e5a78), zen: C(0x2b2a55) }, night: { hor: C(0x1c1b34), mid: C(0x0c0e24), zen: C(0x03040c) } };

/** Mars day/night: one sol = CONFIG.time.solSeconds real seconds. Drives sun, sky, stars, moons, fog, lamps and the HUD clock. */
export class DayNight {
  constructor(game) {
    this.g = game; this.hour = CONFIG.time.startHour; this.sol = 1; this.daylight = 1; this.elev = 1; this.tmp = new THREE.Color(); this.hor = new THREE.Color(); this.mid = new THREE.Color(); this.zen = new THREE.Color();
    const mk = (r, col) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color: col, fog: false })); m.frustumCulled = false; game.scene.add(m); return m; };
    this.phobos = mk(11, 0xb9b2a8); this.deimos = mk(6, 0xa89f94); this.phobos.scale.set(1.2, 0.9, 1); this.moonLight = new THREE.DirectionalLight(0x8fa6ff, 0); game.scene.add(this.moonLight);
    this.apply(0);
  }
  get label() { const h = this.hour; return h < 5 ? 'Night' : h < 7 ? 'Dawn' : h < 11 ? 'Morning' : h < 15 ? 'Midday' : h < 18 ? 'Afternoon' : h < 19.5 ? 'Dusk' : 'Night'; }
  get clock() { const h = Math.floor(this.hour), m = Math.floor((this.hour - h) * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
  get temp() { return Math.round(THREE.MathUtils.lerp(-88, -22, this.daylight)); }
  setHour(h) { this.hour = h; this.apply(0); }
  sleepToMorning() { if (this.hour >= 6) this.sol++; this.hour = 6.2; this.apply(0); }
  update(dt) { this.hour += dt * (24 / CONFIG.time.solSeconds); if (this.hour >= 24) { this.hour -= 24; this.sol++; } this.apply(dt); }
  apply() {
    const g = this.g, a = ((this.hour - 6) / 12) * Math.PI, sunDir = new THREE.Vector3(Math.cos(a) * 0.95, Math.sin(a), 0.38).normalize(), e = sunDir.y; this.elev = e;
    const wDay = sm(0.1, 0.42, e), wNight = sm(0.02, -0.2, e), wDusk = Math.max(0, 1 - wDay - wNight); this.daylight = Math.max(wDay, sm(-0.02, 0.2, e) * 0.6);
    for (const [k, out] of [['hor', this.hor], ['mid', this.mid], ['zen', this.zen]]) { out.copy(PH.dusk[k]).lerp(PH.day[k], wDay).lerp(PH.night[k], wNight); }
    const u = g.skyMat.uniforms; u.sunDir.value.copy(sunDir); u.hor.value.copy(this.hor); u.mid.value.copy(this.mid); u.zen.value.copy(this.zen); u.night.value = wNight;
    g.fogBase.color.copy(this.hor); g.fogBase.density = 0.0016 + wNight * 0.0006;
    const sunI = 3.3 * Math.max(0, sm(-0.02, 0.3, e)); g.sunIntensity = sunI; g.sun.color.setRGB(1, 0.78 + 0.2 * wDay, 0.55 + 0.4 * wDay); g.sunDirV = sunDir;
    g.hemiBase = 0.1 + 0.25 * this.daylight; g.envBase = 0.18 + 0.57 * this.daylight; g.hemi.color.set(wNight > 0.5 ? 0x4a5a9a : 0xffd9bd);
    this.moonLight.intensity = indoors(g) ? 0 : 0.35 * wNight; this.moonLight.position.set(-60, 90, 30);
    const cam = g.camera.position, ph = this.hour * 2.1, de = this.hour * 0.9 + 1.2;
    const place = (m, az, el, r) => m.position.set(cam.x + Math.cos(az) * Math.cos(el) * r, cam.y + Math.sin(el) * r, cam.z + Math.sin(az) * Math.cos(el) * r);
    place(this.phobos, ph, 0.7 + 0.35 * Math.sin(ph * 0.5), 700); place(this.deimos, de, 0.9 + 0.2 * Math.sin(de), 700); this.phobos.visible = this.deimos.visible = wNight > 0.35 && !indoors(g);
    for (const n of g.world.nightMats || []) n.mat.emissiveIntensity = n.day + (n.night - n.day) * wNight;
    if (g.world.interiors) for (const I of g.world.interiors.values()) if (I.windowMat) I.windowMat.color.copy(this.hor).multiplyScalar(0.9 + 0.5 * this.daylight);
  }
}
const indoors = (g) => !!(g.world && g.world.interior);
