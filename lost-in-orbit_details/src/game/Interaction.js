import { CONFIG } from '../config/game.config.js';
import { LOCATION_INFO, STATION_INFO } from '../data/nasaSources.js';

export class Interaction {
  constructor(game) { this.g = game; this.target = null; this.door = null; this.vehicle = null; this.exit = false; }
  update() {
    const g = this.g, w = g.world, hud = g.hud; this.target = null; this.door = null; this.vehicle = null; this.exit = false;
    if (g.state !== 'playing') { hud.setPrompt(null); hud.setPrompt2(null); return; }
    const p = g.player.group.position, input = g.input;
    if (g.vehicles.active) { hud.setPrompt(null); hud.setPrompt2('[ F ]  Exit rover'); if (input.hit('KeyF')) g.vehicles.exit(); return; }
    let e = null, f = null;
    if (w.interior) {
      let best = null, bd = 1e9; for (const loc of w.interior.stations.values()) { const d = loc.distanceTo(p); if (d < bd) { bd = d; best = loc; } }
      if (best && bd <= 2.6) { this.target = best; const step = g.missions.stepFor(best.key), info = STATION_INFO[best.key]; e = { text: `[ E ]  ${step ? step.label : info.verb}`, m: !!step }; }
      if (w.interior.exitLoc.distanceTo(p) < 2.4) { this.exit = true; f = '[ F ]  Exit to the Mars surface'; }
    } else {
      let best = null, bd = 1e9; for (const loc of w.locations.values()) { const d = loc.distanceTo(p); if (d < bd) { bd = d; best = loc; } }
      if (best && bd <= CONFIG.interact.reach) { this.target = best; const step = g.missions.stepFor(best.key), info = LOCATION_INFO[best.key]; e = { text: `[ E ]  ${step ? step.label : info ? info.verb : 'Inspect'}`, m: !!step }; }
      this.vehicle = g.vehicles.nearest(p); this.door = w.nearestDoor(p);
      if (this.vehicle) f = `[ F ]  Drive ${this.vehicle.name}`; else if (this.door) f = `[ F ]  Enter ${(LOCATION_INFO[this.door.key] || {}).name || this.door.key}`;
    }
    hud.setPrompt(e && e.text, e && e.m); hud.setPrompt2(f);
    if (this.target && input.hit('KeyE')) g.interact(this.target.key);
    if (input.hit('KeyF')) { if (this.exit) g.exitBuilding(); else if (this.vehicle) g.vehicles.enter(this.vehicle); else if (this.door) g.enterBuilding(this.door.key); }
  }
  /** Nearest active objective, for the waypoint marker (indoor stations route through the door / room exit). */
  waypointTarget() {
    const g = this.g, steps = g.missions.activeSteps(); if (!steps.length) return null;
    const p = g.player.group.position, vp = g.vehicles.active ? g.vehicles.active.pos : p; let best = null, bd = 1e9;
    for (const s of steps) { const d = g.world.distanceTo(s.target, vp); if (d < bd) { bd = d; best = s; } }
    if (!best) return null; const key = best.target, st = g.world.stations.get(key), inside = !!g.world.interior;
    const info = (inside && !(st && st.interior === g.world.interior)) ? { name: 'Exit', icon: '🚪' } : (STATION_INFO[key] || LOCATION_INFO[key] || {});
    return { key, dist: bd, point: g.world.targetPoint(key, vp), name: info.name || key, icon: info.icon || '🎯' };
  }
}
