import * as THREE from 'three';
import { MISSIONS, DECISIONS } from '../data/missions.js';
import { LOCATION_INFO, STATION_INFO } from '../data/nasaSources.js';

export class MissionManager {
  constructor(game) { this.g = game; this.index = 0; this.steps = []; this.active = false; this.baseAlerts = []; }
  get current() { return MISSIONS[Math.min(this.index, MISSIONS.length - 1)]; }
  get total() { return MISSIONS.length; }

  begin(index) {
    const g = this.g; this.index = index; this.active = false; this.steps = []; this.baseAlerts = [];
    g.saveSnapshot(index); g.world.setActive([]); g.world.setAlerts([]); g.hud.setMission(this);
    g.audio.sfx('accept'); g.player.react('Wave', 2);
    g.panels.briefing(this.current, () => this.start());
  }
  start() {
    const g = this.g, m = this.current;
    this.steps = m.steps.map((s) => ({ ...s, done: false })); this.active = true;
    if (m.time !== undefined) g.dayNight.setHour(m.time);
    if (m.onStart) {
      g.res.apply(m.onStart.fx); g.hud.toast(`⚠ ${m.onStart.note}`, 'warn'); g.audio.sfx('warn');
      this.baseAlerts = (m.onStart.alert || []).map((k) => g.world.canonical(k));
    }
    g.world.setAlerts(this.baseAlerts); g.setStorm(m.storm || 0);
    this.refresh(); g.events.reset();
    const first = this.activeSteps()[0];
    if (first && !g.world.interior && !g.vehicles.active) g.cam.cinematic(g.world.targetPoint(first.target, g.player.group.position), 3, 28);
  }
  activeSteps() {
    if (!this.active) return [];
    const un = this.steps.filter((s) => !s.done); if (!un.length) return [];
    const gmin = Math.min(...un.map((s) => s.g)); return un.filter((s) => s.g === gmin);
  }
  stepFor(key) { return this.activeSteps().find((s) => s.type !== 'enter' && s.type !== 'drive' && this.g.world.canonical(s.target) === key); }
  refresh() { const g = this.g; g.world.setActive(this.activeSteps().flatMap((s) => g.world.activeKeysFor(s.target))); g.hud.setMission(this); }

  interact(key) {
    const g = this.g, step = this.stepFor(key); if (!step) return false;
    if (step.busy) return true; step.busy = true;
    const loc = g.world.locFor(key); if (loc && !g.world.interior) g.player.faceToward(loc.target(g.player.group.position));
    g.player.react(step.anim || { repair: 'Repair', quiz: 'Interact', decision: 'Interact', visit: 'Interact', station: 'Interact' }[step.type], 1);
    if (step.rover) g.world.driveRover();
    setTimeout(() => this.run(step), 650);
    return true;
  }
  run(step) {
    const g = this.g, done = () => { step.busy = false; this.finish(step); };
    switch (step.type) {
      case 'visit': { const info = LOCATION_INFO[step.target] || STATION_INFO[step.target] || {}; g.panels.info({ title: step.title || info.name, icon: info.icon, text: step.text || info.text, src: step.src !== undefined ? step.src : info.src, button: 'CONTINUE' }, done); break; }
      case 'station': { const info = STATION_INFO[step.target] || {}; const note = g.stationAct(step.act); g.panels.info({ title: step.title || info.name, icon: info.icon, text: `${step.text || info.text}${note ? '\n\n' + note : ''}`, src: step.src !== undefined ? step.src : info.src, button: 'CONTINUE' }, done); break; }
      case 'quiz': g.panels.quiz(step.quiz, done); break;
      case 'repair': g.panels.repair(step, () => { if (step.fx) g.res.apply(step.fx); done(); }); break;
      case 'decision': g.panels.decision(DECISIONS[step.decision], step.decision, done); break;
      default: step.busy = false;
    }
  }
  /** Called when the player walks through a building door. */
  onEnter(key) {
    const s = this.activeSteps().find((x) => x.type === 'enter' && this.g.world.canonical(x.target) === key); if (!s || s.busy) return;
    s.busy = true; const info = LOCATION_INFO[s.target] || {};
    setTimeout(() => this.g.panels.info({ title: s.title || info.name, icon: info.icon, text: s.text || info.text, src: s.src !== undefined ? s.src : info.src, button: 'CONTINUE' }, () => { s.busy = false; this.finish(s); }), 700);
  }
  /** Per-frame: finish 'drive' steps when a rover reaches the destination. */
  update() {
    const g = this.g; if (!this.active || !g.vehicles.active) return;
    const s = this.activeSteps().find((x) => x.type === 'drive'); if (!s || s.busy) return;
    const loc = g.world.locFor(s.target); if (loc && loc.distanceTo(g.vehicles.active.pos) < 3) { s.busy = true; g.unlock('road_trip'); g.hud.toast(`📍 Arrived: ${(LOCATION_INFO[s.target] || {}).name || s.target}`, 'good'); setTimeout(() => { s.busy = false; this.finish(s); }, 600); }
  }
  finish(step) {
    const g = this.g; step.done = true; g.score.points += 10; g.audio.sfx('accept'); g.hud.toast('✔ Objective complete  +10', 'good');
    if (this.activeSteps().length === 0) this.completeMission(); else this.refresh();
  }
  completeMission() {
    const g = this.g, m = this.current; this.active = false; g.world.setActive([]); g.world.setAlerts([]); this.baseAlerts = []; g.hud.setMission(this);
    const cycles = []; let failed = null, opt = { bonus: g.crew.id === 'commander' ? 1 : g.crew.id === 'medic' ? 2 : 0, shield: g.crew.id === 'medic' ? 0.6 : 1 };
    for (let i = 0; i < (m.final ? 3 : 1); i++) { cycles.push(g.res.cycle(opt)); failed = g.res.failure(); if (failed) break; }
    if (m.onComplete) g.res.apply(m.onComplete.fx);
    g.setStorm(0);
    if (failed) { g.player.react('Sad', 2); g.audio.sfx('wrong'); g.panels.failed(failed, cycles, () => g.retryMission(), () => g.toMenu()); return; }
    const credits = Math.round(m.reward.credits * (g.crew.id === 'commander' ? 1.1 : 1)); g.res.apply({ credits }); g.score.points += m.reward.points; g.score.missionsDone++;
    const d = (id) => g.score.decisions.find((x) => x.id === id);
    if (m.id === 1) g.unlock('first_sol');
    if (m.id === 3 && d('water_plan') && d('water_plan').eng >= 85) g.unlock('water_wise');
    if (m.id === 5 && g.res.v.power >= 40) g.unlock('power_saver');
    if (m.id === 6 && d('rad_plan') && d('rad_plan').eng >= 75) g.unlock('radiation_ready');
    g.player.react('Celebrate', 2.4); g.audio.sfx('complete');
    g.panels.complete(m, cycles, m.final ? () => g.finish(cycles) : () => this.begin(this.index + 1));
  }
}
void THREE; void 0;
