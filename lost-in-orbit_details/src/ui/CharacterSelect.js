import * as THREE from 'three';
import { CREW } from '../data/characters.js';
import { buildCommander } from '../game/Character.js';
import { openModal, closeModal, esc, $, $$ } from './ui.js';

/** Crew picker with a rotating 3D preview (own small renderer). Used at the start and for in-game switching (C). */
export class CharacterSelect {
  constructor(game) { this.g = game; }
  open({ title, confirm, current, closable, onPick, onCancel }) {
    let sel = Math.max(0, CREW.findIndex((c) => c.id === (current || this.g.crew.id))), outfit = 'suit', raf = 0, alive = true;
    const el = openModal('crew', `<div class="card wide anim-in crew"><h1>${esc(title)}</h1><div class="crew-grid"><div class="crew-list">${CREW.map((c, i) => `<button class="crew-card" data-i="${i}"><span class="ce">${c.icon}</span><span><b>${esc(c.name)}</b><small>${esc(c.role)}</small></span></button>`).join('')}</div>
      <div class="crew-view"><canvas id="crew-cv" width="320" height="400"></canvas><div class="row" style="justify-content:center;margin:.3rem 0"><button class="btn ghost" id="cv-out">☀ Outside: EVA suit</button></div></div>
      <div class="crew-info"><h2 id="ci-name"></h2><h4 id="ci-role"></h4><p id="ci-perk"></p><p class="disc">Everyone wears a white EVA suit outside and normal clothes inside the habitat. Perks help in different missions — try them all!</p></div></div>
      <div class="row"><button class="btn big" id="cv-ok">${esc(confirm)}</button>${closable ? '<button class="btn ghost" id="cv-x">CANCEL</button>' : '<button class="btn ghost" id="cv-x">BACK</button>'}</div></div>`, 'story-bg', { esc: !!closable });
    const cv = $('#crew-cv', el); let renderer = null, scene, cam, model = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); renderer.setPixelRatio(1); renderer.setSize(320, 400, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
      scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(32, 0.8, 0.1, 50); cam.position.set(0, 1.15, 4.2); cam.lookAt(0, 0.95, 0);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6)); const k = new THREE.DirectionalLight(0xffffff, 3); k.position.set(2, 3, 3); scene.add(k); const r = new THREE.DirectionalLight(0x6fb0ff, 1.6); r.position.set(-3, 2, -2); scene.add(r);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), new THREE.MeshBasicMaterial({ color: 0x4fd1ff, transparent: true, opacity: 0.22 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
    } catch (e) { console.warn('preview unavailable', e); }
    const show = () => {
      const c = CREW[sel]; $$('.crew-card', el).forEach((b, i) => b.classList.toggle('on', i === sel)); $('#ci-name').textContent = c.name; $('#ci-role').textContent = c.role; $('#ci-perk').textContent = c.perk;
      if (!renderer) return; if (model) { scene.remove(model); } const a = buildCommander(c); model = a.group; a.rig.setOutfit(outfit); a.rig.setHelmet(true); model.rotation.y = 0.4; scene.add(model);
      a.rig.armL.sh.rotation.z = 0.2; a.rig.armR.sh.rotation.z = -0.2; $('#cv-out').textContent = outfit === 'suit' ? '☀ Outside: EVA suit  (tap for indoor look)' : '🏠 Inside: casual wear  (tap for EVA suit)'; this.rig = a.rig;
    };
    $$('.crew-card', el).forEach((b) => (b.onclick = () => { sel = +b.dataset.i; show(); })); $('#cv-out').onclick = () => { outfit = outfit === 'suit' ? 'casual' : 'suit'; show(); };
    const stop = () => { alive = false; cancelAnimationFrame(raf); if (renderer) { renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); } };
    $('#cv-ok', el).onclick = () => { stop(); closeModal('crew'); onPick(CREW[sel].id); }; $('#cv-x', el).onclick = () => { stop(); closeModal('crew'); onCancel && onCancel(); };
    show(); const loop = () => { if (!alive) return; raf = requestAnimationFrame(loop); if (model && renderer) { model.rotation.y += 0.012; renderer.render(scene, cam); } }; loop();
  }
}
