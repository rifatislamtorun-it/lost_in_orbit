import * as THREE from 'three';
import { ASSETS, CONFIG } from '../config/game.config.js';
import { AnimationController } from './AnimationController.js';
import { buildCommander } from './Character.js';
import { exists, loadGLB } from './Loader.js';

const lerpAngle = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

export class Player {
  constructor(scene, world) {
    this.world = world; this.group = new THREE.Group(); this.heading = new THREE.Group(); this.fx = new THREE.Group();
    this.group.add(this.heading); this.heading.add(this.fx); scene.add(this.group);
    this.vel = new THREE.Vector3(); this.vy = 0; this.grounded = false; this.facing = 0; this.speed = 0; this.coyote = 0; this.onJump = null; this.landed = 0;
    this.helmetOn = true; this.outfit = 'suit'; this.rig = null; this.model = null; this.drive = false; this.crew = null;
    this.lamp = new THREE.SpotLight(0xfff0d0, 0, 70, 0.62, 0.55, 1.2); scene.add(this.lamp, this.lamp.target);   // head-lamp for night walks
  }
  async load(crew) {
    this.crew = crew || this.crew;
    let gltf = null;
    if (ASSETS.USE_GLB.player && (await exists(ASSETS.PLAYER_MODEL))) gltf = await loadGLB(ASSETS.PLAYER_MODEL);
    if (gltf) {
      const m = gltf.scene, holder = new THREE.Group(); holder.add(m); holder.rotation.y = CONFIG.player.modelYawOffset; m.updateMatrixWorld(true);
      let b = new THREE.Box3().setFromObject(m); m.scale.multiplyScalar(CONFIG.player.height / (b.max.y - b.min.y || 1)); m.updateMatrixWorld(true);
      b = new THREE.Box3().setFromObject(m); const c = b.getCenter(new THREE.Vector3()); m.position.set(-c.x, -b.min.y, -c.z);
      m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      this.fx.add(holder); this.model = holder; this.anim = new AnimationController({ fx: this.fx, root: m, clips: gltf.animations || [] }); this.usingGLB = true;
    } else this.build();
  }
  build() {
    if (this.model) this.fx.remove(this.model);
    const a = buildCommander(this.crew || {}); a.group.scale.multiplyScalar(CONFIG.player.height / 1.76); this.fx.add(a.group); this.model = a.group; this.rig = a.rig;
    this.anim = new AnimationController({ fx: this.fx, root: a.group, clips: [], rig: a.rig }); this.rig.setHelmet(this.helmetOn); this.rig.setOutfit(this.outfit); this.anim.sit = this.drive;
  }
  /** Switch which crew member you control (look + perks). */
  setCrew(crew) { this.crew = crew; if (!this.usingGLB) this.build(); }
  setOutfit(mode) { this.outfit = mode; this.rig && this.rig.setOutfit(mode); }
  toggleHelmet() { if (this.outfit !== 'suit') return this.helmetOn; this.helmetOn = !this.helmetOn; this.rig && this.rig.setHelmet(this.helmetOn); return this.helmetOn; }
  sitting(v) { this.drive = v; if (this.anim) this.anim.sit = v; if (this.anim && !v) this.group.rotation.set(0, 0, 0); }
  spawn(p, yaw = 0) { this.group.position.copy(p); this.vel.set(0, 0, 0); this.vy = 0; this.facing = yaw; this.heading.rotation.y = yaw; this.group.rotation.set(0, 0, 0); }
  react(name, dur) { this.anim && this.anim.playOnce(name, dur); }
  faceToward(pt) { this.facing = Math.atan2(pt.x - this.group.position.x, pt.z - this.group.position.z); this.heading.rotation.y = this.facing; }
  update(dt, input, camYaw, canMove, lampOn = false) {
    const C = CONFIG.player, pos = this.group.position; let ix = 0, iz = 0; this.landed = 0;
    if (this.drive) { this.anim.update(dt, { speed: 0, grounded: true, vy: 0 }); this.updateLamp(false); return; }
    if (canMove) { if (input.down('KeyW') || input.down('ArrowUp')) iz++; if (input.down('KeyS') || input.down('ArrowDown')) iz--; if (input.down('KeyD') || input.down('ArrowRight')) ix++; if (input.down('KeyA') || input.down('ArrowLeft')) ix--; if (input.hit('KeyH')) this.toggleHelmet(); }
    const f = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw)), r = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
    const dir = f.multiplyScalar(iz).add(r.multiplyScalar(ix)); const moving = dir.lengthSq() > 0; if (moving) dir.normalize();
    const sprint = canMove && (input.down('ShiftLeft') || input.down('ShiftRight')), indoor = !!this.world.interior;
    dir.multiplyScalar((sprint ? C.sprint : C.walk) * (indoor ? 0.7 : 1));
    const k = Math.min(1, dt * (this.grounded ? 12 : 3)); this.vel.x += (dir.x - this.vel.x) * k; this.vel.z += (dir.z - this.vel.z) * k;
    const adj = this.world.collide(pos, this.vel.x * dt, this.vel.z * dt, C.radius); pos.x += adj.x; pos.z += adj.z; this.world.clampBounds(pos);
    if (canMove && input.hit('Space') && (this.grounded || this.coyote > 0)) { this.vy = C.jump; this.grounded = false; this.coyote = 0; this.onJump && this.onJump(); }
    const was = this.grounded, preVy = this.vy; this.vy -= C.gravity * dt; let ny = pos.y + this.vy * dt;
    const gh = this.world.groundAt(pos.x, pos.z, pos.y);
    if (gh !== null && this.vy <= 0 && (ny <= gh + 0.001 || (was && pos.y - gh < 0.4))) { ny = gh; this.vy = 0; this.grounded = true; if (!was && preVy < -6) this.landed = Math.min(1, -preVy / 14); } else this.grounded = false;
    if (was && !this.grounded && this.vy <= 0) this.coyote = 0.1; this.coyote = Math.max(0, this.coyote - dt);
    pos.y = ny;
    if (!indoor && pos.y < this.world.bounds.min.y - 25) { pos.copy(this.world.spawn); this.vy = 0; this.vel.set(0, 0, 0); }
    this.speed = Math.hypot(this.vel.x, this.vel.z);
    if (this.speed > 0.6 && moving) { this.facing = lerpAngle(this.facing, Math.atan2(this.vel.x, this.vel.z), 1 - Math.exp(-dt * 12)); this.heading.rotation.y = this.facing; }
    this.anim.update(dt, { speed: this.speed, grounded: this.grounded, vy: this.vy }); this.updateLamp(lampOn);
  }
  updateLamp(on) {
    const p = this.group.position; this.lamp.intensity = on ? 160 : 0;
    if (on) { const d = new THREE.Vector3(Math.sin(this.facing), -0.12, Math.cos(this.facing)); this.lamp.position.set(p.x, p.y + 1.7, p.z).addScaledVector(d, 0.3); this.lamp.target.position.copy(this.lamp.position).addScaledVector(d, 12); }
  }
}
