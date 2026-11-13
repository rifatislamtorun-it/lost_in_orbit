import * as THREE from 'three';
import { Mat } from './Textures.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const V3 = THREE.Vector3;
const rb = (w, h, d, m, r = 0.05) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m);

function makeBuggy(color) {
  const g = new THREE.Group(), body = Mat.paint(color, { metalness: 0.5, roughness: 0.35 }), dark = Mat.paint(0x22252c, { roughness: 0.7, metalness: 0.4 }), wheels = [], front = [];
  const add = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  add(rb(1.7, 0.45, 3.1, body), 0, 0.85, 0); add(rb(1.4, 0.3, 1.1, body), 0, 1.1, 1.2); add(rb(1.5, 0.4, 1.1, dark), 0, 1.0, -1.45);
  add(rb(0.5, 0.35, 0.5, dark, 0.08), -0.4, 1.25, -0.1); add(rb(0.5, 0.35, 0.5, dark, 0.08), 0.4, 1.25, -0.1);                      // seats
  for (const s of [-1, 1]) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), Mat.metal(0xc9d0dc)); bar.position.set(s * 0.78, 1.6, 0.05); bar.rotation.x = -0.1; g.add(bar); }
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), Mat.metal(0xc9d0dc)), 0, 2.1, -0.55).rotation.z = Math.PI / 2;
  const ws = add(rb(1.4, 0.55, 0.05, Mat.glass(0x9fd8ff, 0.4), 0.02), 0, 1.5, 0.62); ws.rotation.x = -0.35;
  for (const s of [-1, 1]) { add(rb(0.3, 0.16, 0.1, Mat.glow(0xfff1c8, 2.5), 0.03), s * 0.55, 0.95, 1.58); add(rb(0.25, 0.1, 0.06, Mat.glow(0xff3030, 1.6), 0.02), s * 0.6, 1.0, -1.98); }
  for (const [x, z, f] of [[-0.95, 1.1, true], [0.95, 1.1, true], [-0.95, -1.1, false], [0.95, -1.1, false]]) { const w = new THREE.Group(), t = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.5, 20), Mat.paint(0x15161a, { roughness: 0.95, metalness: 0 })), h = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.52, 10), Mat.metal(0xb7bdc9)); t.rotation.z = h.rotation.z = Math.PI / 2; w.add(t, h); const pivot = new THREE.Group(); pivot.position.set(x, 0.58, z); pivot.add(w); g.add(pivot); wheels.push(w); if (f) front.push(pivot); }
  const ant = add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6), Mat.metal(0x333)), 0.7, 1.9, -1.6); void ant; add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), Mat.glow(0xff7a3d, 2)), 0.7, 2.6, -1.6);
  return { g, wheels, front, seat: new V3(0, 1.0, -0.1), reach: 3.4, radius: 1.9, max: 17, boost: 25, accel: 12, turn: 1.7 };
}
function makeTruck() {
  const g = new THREE.Group(), white = Mat.panel(0xf1efe8), dark = Mat.paint(0x22252c, { roughness: 0.7, metalness: 0.4 }), wheels = [], front = [];
  const add = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  add(rb(2.4, 0.6, 5.2, white), 0, 1.15, 0); add(rb(2.3, 1.5, 2.2, white, 0.12), 0, 2.15, 1.3); add(rb(2.0, 0.7, 0.06, Mat.glass(0x9fd8ff, 0.5), 0.02), 0, 2.45, 2.42); add(rb(2.2, 0.1, 3.0, Mat.solar(), 0.02), 0, 1.58, -1.5);
  add(rb(2.3, 0.7, 2.6, Mat.paint(0xff7a3d)), 0, 1.7, -1.5); add(rb(0.5, 0.4, 0.5, dark, 0.08), -0.5, 1.75, 0.9); add(rb(0.5, 0.4, 0.5, dark, 0.08), 0.5, 1.75, 0.9);
  for (const s of [-1, 1]) { add(rb(0.35, 0.18, 0.1, Mat.glow(0xfff1c8, 2.5), 0.03), s * 0.75, 1.3, 2.62); add(rb(0.3, 0.12, 0.06, Mat.glow(0xff3030, 1.6), 0.02), s * 0.8, 1.3, -2.64); }
  for (const [x, z, f] of [[-1.2, 1.9, true], [1.2, 1.9, true], [-1.2, 0, false], [1.2, 0, false], [-1.2, -1.9, false], [1.2, -1.9, false]]) { const w = new THREE.Group(), t = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.6, 22), Mat.paint(0x15161a, { roughness: 0.95, metalness: 0 })), h = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.62, 10), Mat.metal(0xb7bdc9)); t.rotation.z = h.rotation.z = Math.PI / 2; w.add(t, h); const pivot = new THREE.Group(); pivot.position.set(x, 0.75, z); pivot.add(w); g.add(pivot); wheels.push(w); if (f) front.push(pivot); }
  return { g, wheels, front, seat: new V3(-0.5, 1.45, 0.9), reach: 4.2, radius: 2.5, max: 13, boost: 18, accel: 8, turn: 1.2 };
}

export class Vehicles {
  constructor(game) { this.g = game; this.list = []; this.active = null; this.spot = new THREE.SpotLight(0xfff1d0, 0, 90, 0.55, 0.6, 1); game.scene.add(this.spot, this.spot.target); }
  build() {
    const w = this.g.world, at = (k, dx, dz) => { const l = w.locations.get(k); const c = l ? l.center : w.spawn; return [c.x + dx, c.z + dz]; };
    const defs = [['Rover-1 (Buggy)', makeBuggy(0xff7a3d), ...at('RepairStation', -14, 14), 0.9], ['Rover-2 (Buggy)', makeBuggy(0x1f5fb8), ...at('LandingZone', 24, 14), -0.5], ['Rover-3 (Truck)', makeTruck(), ...at('Habitat', 30, 22), 2.2]];
    for (const [name, v, x, z, h] of defs) {
      const grp = v.g; w.root.add(grp); const y = w.groundAt(x, z, 400) ?? w.spawn.y; Object.assign(v, { name, group: grp, pos: new V3(x, y, z), heading: h, speed: 0, steer: 0, pitch: 0, roll: 0 }); grp.position.copy(v.pos); grp.rotation.set(0, h, 0, 'YXZ'); this.list.push(v); w.circles && 0;
    }
  }
  nearest(p) { let b = null, bd = 1e9; for (const v of this.list) { const d = Math.hypot(v.pos.x - p.x, v.pos.z - p.z) - v.reach; if (d < bd) { bd = d; b = v; } } return bd < 0 ? b : null; }
  seatWorld(v) { const s = v.seat.clone(); s.applyAxisAngle(new V3(0, 1, 0), v.heading); return s.add(v.pos); }
  enter(v) { this.active = v; const g = this.g, p = g.player; p.sitting(true); g.audio.sfx('accept'); g.hud.toast(`🚙 Driving ${v.name} — W/S drive, A/D steer, Shift boost, F exit`, 'good'); }
  exit() {
    const v = this.active; if (!v) return; const g = this.g, w = g.world, right = new V3(Math.cos(v.heading), 0, -Math.sin(v.heading)); let best = null;
    for (const side of [1, -1]) { const x = v.pos.x + right.x * side * (v.radius + 1.2), z = v.pos.z + right.z * side * (v.radius + 1.2), y = w.groundAt(x, z, v.pos.y + 3); if (y !== null) { best = new V3(x, y, z); break; } }
    this.active = null; v.speed = 0; g.player.sitting(false); g.player.group.position.copy(best || v.pos.clone().add(new V3(0, 1, 3))); g.player.vy = 0; g.player.vel.set(0, 0, 0); g.hud.toast('Left the rover');
  }
  update(dt, input, canDrive) {
    const g = this.g, w = g.world;
    for (const v of this.list) {
      if (v === this.active && canDrive) {
        const f = (input.down('KeyW') || input.down('ArrowUp') ? 1 : 0) - (input.down('KeyS') || input.down('ArrowDown') ? 1 : 0), st = (input.down('KeyA') || input.down('ArrowLeft') ? 1 : 0) - (input.down('KeyD') || input.down('ArrowRight') ? 1 : 0), boost = input.down('ShiftLeft') || input.down('ShiftRight'), mx = boost ? v.boost : v.max;
        v.speed += f * v.accel * dt * (f * v.speed < 0 ? 2.2 : 1); if (!f) v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), 6 * dt); if (input.down('Space')) v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), 22 * dt);
        v.speed = THREE.MathUtils.clamp(v.speed, -mx * 0.4, mx); v.steer += (st - v.steer) * Math.min(1, dt * 6);
        v.heading += v.steer * v.turn * dt * THREE.MathUtils.clamp(v.speed / 5, -1, 1);
      } else if (v === this.active) v.speed *= 0.96; else v.speed *= 0.9;
      const dx = Math.sin(v.heading) * v.speed * dt, dz = Math.cos(v.heading) * v.speed * dt;
      if (Math.abs(v.speed) > 0.05) { const adj = w.collide(v.pos, dx, dz, v.radius); if (Math.hypot(adj.x, adj.z) < Math.hypot(dx, dz) * 0.6) v.speed *= 0.5; v.pos.x += adj.x; v.pos.z += adj.z; w.clampBounds(v.pos); }
      const fw = new V3(Math.sin(v.heading), 0, Math.cos(v.heading)), lf = new V3(Math.cos(v.heading), 0, -Math.sin(v.heading)), q = (a, b) => w.groundAt(v.pos.x + fw.x * a + lf.x * b, v.pos.z + fw.z * a + lf.z * b, v.pos.y + 1.5);
      const hc = q(0, 0), hf = q(1.4, 0), hb = q(-1.4, 0), hl = q(0, 1), hr = q(0, -1);
      if (hc !== null) { v.pos.y += (hc - v.pos.y) * Math.min(1, dt * 14); const tp = -Math.atan2((hf ?? hc) - (hb ?? hc), 2.8), tr = Math.atan2((hl ?? hc) - (hr ?? hc), 2); v.pitch += (tp - v.pitch) * Math.min(1, dt * 8); v.roll += (tr - v.roll) * Math.min(1, dt * 8); }
      v.group.position.copy(v.pos); v.group.rotation.set(v.pitch, v.heading, v.roll, 'YXZ');
      for (const wh of v.wheels) wh.rotation.x += v.speed * dt / 0.6; for (const f of v.front) f.rotation.y = v.steer * 0.45;
      if (v === this.active && Math.abs(v.speed) > 6 && g.puffT <= 0) g.puffs.emit(v.pos.clone().addScaledVector(fw, -1.6), 1, 1.6);
    }
    if (this.active) {
      const v = this.active, p = g.player; p.group.position.copy(this.seatWorld(v)); p.facing = v.heading; p.heading.rotation.y = v.heading; p.group.rotation.set(v.pitch, 0, v.roll, 'YXZ'); p.group.rotation.y = 0;
      const night = g.dayNight ? 1 - g.dayNight.daylight : 0; this.spot.intensity = 90 * night; this.spot.position.copy(v.pos).add(new V3(0, 1.4, 0).addScaledVector(new V3(Math.sin(v.heading), 0, Math.cos(v.heading)), 1.5)); this.spot.target.position.copy(this.spot.position).add(new V3(Math.sin(v.heading), -0.12, Math.cos(v.heading)).multiplyScalar(20));
    } else this.spot.intensity = 0;
  }
}
