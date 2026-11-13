import * as THREE from 'three';
import { CONFIG } from '../config/game.config.js';
import { LOCATION_INFO, STATION_INFO } from '../data/nasaSources.js';
import { CREW, crewById } from '../data/characters.js';
import { STORY, STORY_END } from '../data/story.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Tex } from './Textures.js';
import { World } from './World.js';
import { Player } from './Player.js';
import { CameraRig } from './Camera.js';
import { Interaction } from './Interaction.js';
import { MissionManager } from './Missions.js';
import { Resources } from './Resources.js';
import { Scoring } from './Scoring.js';
import { QuizManager } from './Quiz.js';
import { EventManager } from './Events.js';
import { SaveSystem } from './SaveSystem.js';
import { AudioFX } from './Audio.js';
import { Input } from './Input.js';
import { DayNight } from './DayNight.js';
import { Vehicles } from './Vehicles.js';
import { Landing } from './Landing.js';
import { HUD } from '../ui/HUD.js';
import { MainMenu } from '../ui/MainMenu.js';
import { Panels } from '../ui/MissionPanel.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { ResultsScreen } from '../ui/ResultsScreen.js';
import { SciencePanel } from '../ui/SciencePanel.js';
import { IntroUI } from '../ui/IntroUI.js';
import { CharacterSelect } from '../ui/CharacterSelect.js';
import { onModalChange, closeAll, popEsc, $ } from '../ui/ui.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Game {
  constructor() {
    this.canvas = $('#c'); this.settings = SaveSystem.loadSettings(); this.mode = 'loading'; this.modals = 0; this.time = 0; this.storm = { cur: 0, target: 0 };
    this.playerName = 'Commander'; this.crew = CREW[0]; this.indoor = false; this.lastMeal = -999; this.sunIntensity = 3.3; this.hemiBase = 0.35; this.envBase = 0.75;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x06080f); this.camera = new THREE.PerspectiveCamera(60, 1, 0.3, 1600);
    this.buildSky(); this.buildLights(); this.puffs = new Puffs(this.scene); this.puffT = 0;
    this.audio = new AudioFX(this.settings); this.res = new Resources(); this.score = new Scoring(); this.quiz = new QuizManager(this);
    this.input = new Input(this.canvas); this.clock = new THREE.Clock();
    this.applyQuality(); window.addEventListener('resize', () => this.resize());
    onModalChange((n) => { this.modals = n; if (n > 0) this.input.releaseLock(); });
    this.input.onLockChange = (locked) => { if (!locked && this.state === 'playing') this.pauseMenu.open(); };
    window.addEventListener('keydown', (e) => {
      if (this.mode !== 'game' || e.repeat) return;
      if (e.code === 'Escape') { if (this.landing && this.landing.active) return this.landing.skip(); if (!popEsc() && this.state === 'playing') this.pauseMenu.open(); }
      if (e.code === 'KeyC' && this.state === 'playing' && !this.vehicles.active) this.openCrewSwitch();
    });
    document.addEventListener('click', (e) => {
      if (!(e.target.closest && e.target.closest('button, a.nasa-btn'))) return; this.audio.sfx('click');
      setTimeout(() => { if (this.mode === 'game' && this.state === 'playing') { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); this.input.relock(); } }, 60);
    });
  }
  get state() { if (this.mode !== 'game') return this.mode; if (this.landing && this.landing.active) return 'intro'; return this.modals > 0 ? 'modal' : 'playing'; }

  // ---------- rendering setup ----------
  buildSky() {
    const C = (h) => new THREE.Color(h);
    this.skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { sunDir: { value: new THREE.Vector3(70, 100, 45).normalize() }, storm: { value: 0 }, night: { value: 0 }, hor: { value: C(0xeab58a) }, mid: { value: C(0xc98a6c) }, zen: { value: C(0x7d6574) }, stormC: { value: C(0xa55f35) } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec3 vD; uniform vec3 sunDir, hor, mid, zen, stormC; uniform float storm, night;
        float hash(vec3 p){ p = fract(p * 0.3183099 + vec3(.1,.2,.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        void main(){ vec3 d = normalize(vD); float h = clamp(d.y, 0.0, 1.0);
          vec3 c = mix(hor, mid, smoothstep(0.0, 0.22, h)); c = mix(c, zen, smoothstep(0.18, 0.95, h));
          float s = max(dot(d, sunDir), 0.0), up = smoothstep(-0.1, 0.1, sunDir.y);
          c += vec3(1.0, 0.72, 0.45) * pow(s, 14.0) * 0.55 * up; c += vec3(0.25, 0.45, 0.9) * pow(s, 5.0) * 0.14 * (1.0 - 0.6 * up);
          c += vec3(1.0, 0.95, 0.85) * pow(s, 1200.0) * 40.0 * up;
          float hs = hash(floor(d * 190.0)); c += vec3(step(0.9965, hs) * (0.6 + 0.4 * sin(hs * 500.0))) * night * 1.8 * smoothstep(0.0, 0.25, d.y);
          c = mix(c, stormC * (1.0 - 0.7 * night), storm * 0.9); if (d.y < 0.0) c = mix(hor, hor * 0.6, clamp(-d.y * 3.0, 0.0, 1.0));
          gl_FragColor = vec4(c, 1.0); }` });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), this.skyMat); this.dome.renderOrder = -1000; this.dome.frustumCulled = false; this.scene.add(this.dome);
    const pm = new THREE.PMREMGenerator(this.renderer), envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), this.skyMat));
    this.scene.environment = pm.fromScene(envScene, 0.02, 0.1, 200).texture; this.scene.environmentIntensity = 0.75; pm.dispose();
    this.fogBase = { color: C(0xeab58a), storm: C(0xa55f35), density: 0.0016 }; this.scene.fog = new THREE.FogExp2(this.fogBase.color.clone(), this.fogBase.density);
  }
  buildLights() {
    this.hemi = new THREE.HemisphereLight(0xffd9bd, 0x7a3a22, 0.35); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff0dd, 3.3); this.sun.position.set(70, 100, 45); this.sun.castShadow = true;
    const sc = this.sun.shadow.camera; sc.left = sc.bottom = -70; sc.right = sc.top = 70; sc.near = 1; sc.far = 320; this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.06; this.sun.shadow.radius = 3;
    this.scene.add(this.sun, this.sun.target);
    this.indoorLights = []; for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xfff1dd, 0, 24, 1.5); this.scene.add(l); this.indoorLights.push(l); }
    const N = 700, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) p[i] = (Math.random() - 0.5) * 60; g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.dust = new THREE.Points(g, new THREE.PointsMaterial({ map: Tex.soft(), color: 0xe0a77a, size: 0.55, transparent: true, opacity: 0.25, depthWrite: false })); this.dust.frustumCulled = false; this.scene.add(this.dust);
  }
  applyQuality() {
    const pick = this.settings.quality === 'auto' || !this.settings.quality ? ((navigator.hardwareConcurrency || 8) <= 4 ? 'medium' : 'high') : this.settings.quality;
    const Q = { high: { pr: 1.75, shadow: 2048, bloom: true, samples: 4 }, medium: { pr: 1.25, shadow: 1024, bloom: true, samples: 0 }, low: { pr: 1, shadow: 0, bloom: false, samples: 0 } }[pick]; this.Q = Q;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, Q.pr)); this.renderer.shadowMap.enabled = Q.shadow > 0; this.sun.castShadow = Q.shadow > 0;
    if (Q.shadow) { this.sun.shadow.mapSize.set(Q.shadow, Q.shadow); if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; } }
    this.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)); });
    this.buildComposer();
  }
  buildComposer() {
    if (this.composer) this.composer.dispose && this.composer.dispose();
    const w = window.innerWidth, h = window.innerHeight, pr = this.renderer.getPixelRatio(); this.renderer.setSize(w, h, false);
    const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: this.Q.samples });
    this.composer = new EffectComposer(this.renderer, rt); this.composer.setSize(w * pr, h * pr); this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w * pr, h * pr), 0.32, 0.55, 0.92); this.bloom.enabled = this.Q.bloom; this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass());
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  resize() { const w = window.innerWidth, h = window.innerHeight, pr = this.renderer.getPixelRatio(); this.renderer.setSize(w, h, false); this.composer.setSize(w * pr, h * pr); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
  setLoad(i, f, tip) {
    const pct = Math.round(Math.min(1, (i + f) / 5) * 100); $('#load-bar').style.width = pct + '%'; $('#load-pct').textContent = pct + '%';
    document.querySelectorAll('#load-steps li').forEach((li, k) => { li.classList.toggle('done', k < i); li.classList.toggle('now', k === i); }); if (tip) $('#load-status').textContent = tip;
  }
  async init() {
    this.world = new World(this.scene); this.player = new Player(this.scene, this.world); this.player.group.visible = false; this.player.onJump = () => this.audio.sfx('jump');
    this.setLoad(0, 0.1, 'Building your astronaut…'); await this.player.load(this.crew); this.setLoad(1, 0.1, 'Terraforming the colony…');
    await this.world.load((f) => this.setLoad(1, f * 0.9)); this.setLoad(2, 0, 'Starting life-support systems…');
    this.cam = new CameraRig(this.camera, this.world); this.cam.sens = this.settings.sensitivity;
    this.dayNight = new DayNight(this); this.vehicles = new Vehicles(this); this.vehicles.build(); this.landing = new Landing(this);
    this.hud = new HUD(this); this.panels = new Panels(this); this.science = new SciencePanel(this); this.menu = new MainMenu(this); this.results = new ResultsScreen(this); this.introUI = new IntroUI(this); this.charSelect = new CharacterSelect(this);
    this.pauseMenu = new PauseMenu(this); this.interaction = new Interaction(this); this.missions = new MissionManager(this); this.events = new EventManager(this);
    this.res.on((r, d) => this.hud.setRes(r, d)); this.hud.setRes(this.res); this.hud.setCrew(this.crew, this.playerName); this.applySettings();
    await sleep(200); this.setLoad(3, 0, 'Loading 10 missions…'); await sleep(200); this.setLoad(4, 0.5, 'Loading NASA science…'); await sleep(200); this.setLoad(5, 1, 'Ready!');
    await sleep(350); $('#loading').classList.add('hide'); setTimeout(() => ($('#loading').hidden = true), 800);
    this.mode = 'menu'; this.dayNight.setHour(17.7); this.menu.show(); this.clock.start(); this.loop();
  }
  applySettings() { document.documentElement.style.fontSize = 16 * this.settings.uiScale + 'px'; if (this.cam) this.cam.sens = this.settings.sensitivity; SaveSystem.saveSettings(this.settings); }
  fade(fn, ms = 300) { let f = document.getElementById('fade'); if (!f) { f = document.createElement('div'); f.id = 'fade'; document.body.appendChild(f); } f.classList.add('on'); setTimeout(() => { fn(); setTimeout(() => f.classList.remove('on'), 120); }, ms); }

  // ---------- story flow ----------
  startNew() {
    this.menu.hide(); this.introUI.askName((name) => { this.playerName = name; this.charSelect.open({ title: 'CHOOSE YOUR CREW MEMBER', confirm: 'LAND ON MARS ▶', onPick: (id) => {
      this.setCrew(id, true); SaveSystem.clear(); this.res.reset(); this.score.reset(); this.score.crewUsed = [id]; this.dayNight.setHour(CONFIG.time.startHour); this.dayNight.sol = 1;
      this.mode = 'game'; closeAll(); this.hud.show(false); this.player.group.visible = false;
      this.introUI.story(STORY, name, () => this.landing.start(() => this.introUI.story([STORY_END], name, () => { this.startGameplay(true); this.missions.begin(0); }, 'BEGIN MISSION 1 ▶')));
    }, onCancel: () => this.toMenu() }); });
  }
  continueGame() {
    const s = SaveSystem.load(); if (!s || s.finished) return this.startNew();
    this.playerName = s.name || 'Commander'; this.setCrew(s.crewId || 'commander', true); this.res.reset(); this.res.load(s.res); this.score.reset(); this.score.load(s.score);
    this.dayNight.hour = s.hour ?? CONFIG.time.startHour; this.dayNight.sol = s.sol || 1; this.startGameplay(); this.missions.begin(s.mission);
  }
  resetProgress() { SaveSystem.clear(); this.menu.show(); }
  setCrew(id, silent = false) {
    this.crew = crewById(id); this.player.setCrew(this.crew); this.hud && this.hud.setCrew(this.crew, this.playerName);
    if (!this.score.crewUsed.includes(id)) this.score.crewUsed.push(id); if (this.score.crewUsed.length >= 2) this.unlock('crew_hopper'); if (!silent) { this.hud.toast(`Now playing: ${this.crew.name}`, 'good'); this.audio.sfx('accept'); }
  }
  openCrewSwitch() { this.charSelect.open({ title: 'SWITCH CREW MEMBER', confirm: 'PLAY AS THIS CREW MEMBER', current: this.crew.id, closable: true, onPick: (id) => this.setCrew(id) }); }
  startGameplay() {
    this.mode = 'game'; closeAll(); this.menu.hide(); this.hud.show(true); this.setIndoor(null); this.player.setOutfit('suit'); this.vehicles.active = null; this.player.sitting(false);
    const w = this.world, hb = w.locations.get('Habitat'); this.player.group.visible = true; this.player.spawn(w.spawn);
    if (hb) { const d = hb.center.clone().sub(w.spawn); this.cam.yaw = Math.atan2(-d.x, -d.z); this.player.faceToward(hb.center); }
    this.cam.init = false; this.cam.cine = null;
  }
  saveSnapshot(index) { this.lastSnap = { v: 2, mission: index, name: this.playerName, crewId: this.crew.id, hour: this.dayNight.hour, sol: this.dayNight.sol, res: this.res.serialize(), score: this.score.serialize() }; SaveSystem.save(this.lastSnap); }
  retryMission() { const s = this.lastSnap; closeAll(); this.res.load(s.res); this.score.load(s.score); this.dayNight.hour = s.hour; this.dayNight.sol = s.sol; if (this.world.interior) this.exitBuilding(true); this.missions.begin(s.mission); }
  restartMissionFromPause() { closeAll(); this.retryMission(); }
  toMenu() { this.mode = 'menu'; closeAll(); this.hud.show(false); this.player.group.visible = false; this.storm.target = 0; this.world.setActive([]); this.world.setAlerts([]); this.missions.active = false; this.input.releaseLock(); this.setIndoor(null); this.world.exitInterior(); if (this.vehicles.active) this.vehicles.exit(); this.landing.active = false; this.introUI.caption(null); this.dayNight.setHour(17.7); this.menu.show(); }
  finish(cycles) { this.unlock('mission_engineer'); const rank = this.score.rank(this.res); if (rank.min >= 70) this.unlock('mars_commander'); SaveSystem.save({ ...this.lastSnap, finished: true }); this.results.show(cycles); }
  unlock(id) { const a = this.score.unlock(id); if (a) { this.hud.achievement(a); this.audio.sfx('achieve'); } }
  setStorm(v) { this.storm.target = v; }

  // ---------- buildings, rooms, stations ----------
  setIndoor(I) {
    this.indoor = !!I; if (!I) return; I.lightPos.forEach((p, i) => this.indoorLights[i].position.copy(p));
  }
  enterBuilding(key) {
    const I = this.world.interiors.get(key); if (!I || this.state !== 'playing') return; this.audio.sfx('interact');
    this.fade(() => {
      this.outPos = this.player.group.position.clone(); this.outFacing = this.player.facing; this.world.enterInterior(key); this.setIndoor(I); this.player.setOutfit('casual');
      this.player.spawn(I.entry, Math.PI); this.cam.yaw = 0; this.cam.init = false; this.hud.toast('🚪 Airlock cycle done — dust removed. Suit off.', 'good');
      if (!this.score.rooms.includes(key)) this.score.rooms.push(key); if (this.score.rooms.length >= 5) this.unlock('home_tour'); this.missions.onEnter(key);
    });
  }
  exitBuilding(instant = false) {
    const go = () => { this.world.exitInterior(); this.setIndoor(null); this.player.setOutfit('suit'); const p = this.outPos || this.world.spawn; this.player.spawn(p, this.outFacing || 0); this.cam.init = false; this.hud.toast('🧑‍🚀 Suit on — outside on Mars.', 'good'); };
    if (instant) go(); else { this.audio.sfx('interact'); this.fade(go); }
  }
  /** Effects of using a station: returns a short note. */
  stationAct(act) {
    const r = this.res, med = this.crew.id === 'medic' ? 1.5 : 1;
    switch (act) {
      case 'eat': { r.apply({ food: -3, health: Math.round(8 * med) }); this.lastMeal = this.time; this.unlock('foodie'); this.player.react('Celebrate', 1.4); return `🍲 Meal eaten: Crew Health +${Math.round(8 * med)}, Food −3.`; }
      case 'harvest': r.apply({ food: 6, health: 3 }); return '🥬 Harvested fresh food: Food +6, Crew Health +3.';
      case 'sleep': { this.fade(() => { this.dayNight.sleepToMorning(); }); r.apply({ health: Math.round(10 * med) }); this.unlock('night_owl'); return `😴 You slept until morning: Crew Health +${Math.round(10 * med)}.`; }
      case 'rest': r.apply({ radiation: 6, health: Math.round(2 * med) }); return '🛡️ Resting in the shelter: Radiation Safety +6.';
      case 'scan': this.score.science += 10; this.score.points += 10; return '🔬 Scan complete: +10 Science Points.';
      default: return '';
    }
  }
  /** Free (non-mission) use of a station. */
  useStation(key) {
    const info = STATION_INFO[key]; if (!info) return; const hr = this.dayNight.hour, cool = this.time - this.lastMeal > 70;
    const show = (note) => this.panels.info({ title: info.name, icon: info.icon, text: `${info.text}${note ? '\n\n' + note : ''}`, src: info.src, button: 'CLOSE' }, () => {});
    this.player.react('Interact', 1);
    if (key === 'Locker') return this.openCrewSwitch();
    if (key === 'Galley') return show(cool ? this.stationAct('eat') : '😋 You are not hungry yet — try again in a minute.');
    if (key === 'Harvest') return show(cool ? (this.lastMeal = this.time, this.stationAct('harvest')) : '🥬 The basket is empty for now — it regrows in about a minute.');
    if (key === 'Bed') return show(hr >= 17 || hr < 5 ? this.stationAct('sleep') : '🌞 Not sleepy yet — it is still daytime. Try again after 17:00.');
    if (key === 'Dosimeter') return show(`Radiation Safety is ${Math.round(this.res.v.radiation)}% (${this.res.status('radiation')}).`);
    if (key === 'Console') { const a = this.missions.activeSteps()[0]; return show(a ? `📋 Mission ${this.missions.current.id}: ${a.label}` : '📋 No active objective. Walk outside and explore!'); }
    if (!this.score.discoveries.includes(key)) { this.score.discoveries.push(key); this.score.science += 5; this.score.points += 5; this.hud.toast('🔎 New discovery!  +5 Science Points', 'good'); }
    show('');
  }
  interact(key) {
    if (this.state !== 'playing') return; this.audio.sfx('interact');
    if (this.missions.interact(key)) return; if (this.world.stations.has(key)) this.useStation(key); else this.inspect(key);
  }
  inspect(key) {
    const info = LOCATION_INFO[key]; if (!info) return;
    if (!this.score.discoveries.includes(key)) { this.score.discoveries.push(key); this.score.science += 5; this.score.points += 5; this.hud.toast('🔎 New discovery!  +5 Science Points', 'good'); }
    const loc = this.world.locations.get(key); if (loc) this.player.faceToward(loc.target(this.player.group.position));
    this.player.react(key === 'Rover' ? 'Scan' : 'Interact', 1); if (key === 'Rover') this.world.driveRover();
    this.panels.info({ title: info.name, icon: info.icon, text: info.text, src: info.src, button: 'CLOSE' }, () => {});
  }

  // ---------- loop ----------
  loop = () => {
    requestAnimationFrame(this.loop); const dt = Math.min(0.05, this.clock.getDelta()); this.time += dt;
    try { this.update(dt); } catch (e) { console.error(e); }
    this.composer.render(); this.input.endFrame();
  };
  update(dt) {
    this.world.update(this.time, dt); this.puffs.update(dt); this.dayNight.apply(); this.updateLighting(dt); this.dome.position.copy(this.camera.position);
    if (this.mode !== 'game') { this.cam.menuOrbit(this.time); return; }
    if (this.landing.active) { this.landing.update(dt); return; }
    const playing = this.state === 'playing'; this.input.enabled = playing;
    if (playing) { this.dayNight.update(dt); if (this.input.dx || this.input.dy) this.cam.rotate(this.input.dx, this.input.dy); if (this.input.wheel) this.cam.zoom(this.input.wheel); if (this.cam.cine && (this.input.hit('Space') || this.input.hit('Enter') || this.input.hit('KeyE'))) this.cam.skipCinematic(); }
    const driving = !!this.vehicles.active, night = 1 - this.dayNight.daylight;
    this.vehicles.update(dt, this.input, playing && !this.cam.cine);
    this.player.update(dt, this.input, this.cam.yaw, playing && !this.cam.cine && !driving, night > 0.45 && !this.indoor);
    const target = driving ? this.vehicles.active.pos : this.player.group.position;
    if (driving && playing && !this.input.dx && Math.abs(this.vehicles.active.speed) > 2) { let d = (this.vehicles.active.heading + Math.PI) - this.cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.cam.yaw += d * Math.min(1, dt * 1.6); }
    this.cam.update(dt, target); this.interaction.update(); this.events.update(dt); this.missions.update(); this.hud.update(dt);
    const pp = this.player.group.position; this.puffT -= dt;
    if (!driving && this.player.grounded && this.player.speed > 6.5 && this.puffT <= 0 && !this.indoor) { this.puffT = 0.1; this.puffs.emit(pp, 1, 1); }
    if (this.player.landed > 0 && !this.indoor) this.puffs.emit(pp, Math.ceil(7 * this.player.landed), 2);
    if (this.sunDirV) { this.sun.target.position.copy(target); this.sun.position.set(target.x + this.sunDirV.x * 110, target.y + Math.max(8, this.sunDirV.y * 110), target.z + this.sunDirV.z * 110); }
  }
  updateLighting(dt) {
    const s = this.storm; s.cur += (s.target - s.cur) * Math.min(1, dt * 0.35); const k = s.cur, fb = this.fogBase, I = this.indoor;
    this.scene.fog.density = I ? 0 : THREE.MathUtils.lerp(fb.density, 0.021, k); this.scene.fog.color.copy(fb.color).lerp(fb.storm, k * (1 - 0.7 * (1 - this.dayNight.daylight))); this.skyMat.uniforms.storm.value = k;
    this.sun.intensity = I ? 0 : this.sunIntensity * THREE.MathUtils.lerp(1, 0.36, k); this.hemi.intensity = I ? 0.5 : THREE.MathUtils.lerp(this.hemiBase, this.hemiBase * 1.4 + 0.1, k);
    this.scene.environmentIntensity = I ? 0.3 : THREE.MathUtils.lerp(this.envBase, this.envBase * 0.6, k); this.dome.visible = !I; this.dust.visible = !I; this.indoorLights.forEach((l) => (l.intensity = I ? 26 : 0));
    this.dust.material.opacity = (0.22 + 0.5 * k) * (0.35 + 0.65 * this.dayNight.daylight); this.dust.material.size = 0.5 + 0.35 * k;
    const a = this.dust.geometry.attributes.position, c = this.camera.position, wind = 1.2 + 16 * k;
    for (let i = 0; i < a.count; i++) {
      let x = a.getX(i) + dt * wind, y = a.getY(i) + Math.sin(this.time + i) * dt * 0.4, z = a.getZ(i) + dt * wind * 0.3;
      if (x - c.x > 30) x -= 60; if (x - c.x < -30) x += 60; if (z - c.z > 30) z -= 60; if (z - c.z < -30) z += 60; if (y - c.y > 15) y -= 30; if (y - c.y < -15) y += 30;
      a.setXYZ(i, x, y, z);
    }
    a.needsUpdate = true;
  }
}

/** Soft dust puffs kicked up by running, driving and landing. */
class Puffs {
  constructor(scene) {
    this.items = []; this.i = 0;
    for (let n = 0; n < 48; n++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Tex.soft(), color: 0xcf9a72, transparent: true, opacity: 0, depthWrite: false })); sp.visible = false; scene.add(sp); this.items.push({ sp, life: 0, max: 1, v: new THREE.Vector3(), s0: 1 }); }
  }
  emit(pos, n = 1, power = 1) {
    for (let k = 0; k < n; k++) { const it = this.items[this.i++ % this.items.length]; it.life = it.max = 0.7 + Math.random() * 0.5; it.s0 = 0.5 + Math.random() * 0.5 * power; it.sp.position.set(pos.x + (Math.random() - 0.5) * 0.5, pos.y + 0.1, pos.z + (Math.random() - 0.5) * 0.5); it.v.set((Math.random() - 0.5) * power * 1.6, 0.5 + Math.random() * 0.6, (Math.random() - 0.5) * power * 1.6); it.sp.visible = true; }
  }
  update(dt) { for (const it of this.items) { if (it.life <= 0) continue; it.life -= dt; const t = 1 - it.life / it.max; it.sp.position.addScaledVector(it.v, dt); it.sp.scale.setScalar(it.s0 * (1 + t * 2.2)); it.sp.material.opacity = Math.max(0, 0.4 * (1 - t)); if (it.life <= 0) it.sp.visible = false; } }
}
