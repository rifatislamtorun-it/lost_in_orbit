import { ASSETS } from '../config/game.config.js';
import { openModal, closeModal, esc, $ } from './ui.js';

const NAMES = ['Nova', 'Orion', 'Luna', 'Atlas', 'Zara', 'Kai', 'Vega', 'Sol'];
/** Name entry + animated story screens + landing captions. */
export class IntroUI {
  constructor(game) { this.g = game; this.cap = null; }
  askName(cb) {
    const el = openModal('name', `<div class="card name-card anim-in center"><img class="logo sm" src="${ASSETS.LOGO}" alt="StellarSpark"><div class="tag">NASA ASTRONAUT REGISTRATION</div><h1>WHAT IS YOUR NAME, ASTRONAUT?</h1>
      <p>Mission Control needs a name for the crew list.</p><input id="nm" maxlength="14" autocomplete="off" placeholder="Type your name…" aria-label="Your name"><div class="chips-row">${NAMES.map((n) => `<button class="chipbtn" data-n="${n}">${n}</button>`).join('')}</div>
      <div class="row" style="justify-content:center"><button class="btn big" id="nm-ok">CONTINUE ▶</button><button class="btn ghost" id="nm-back">BACK</button></div></div>`, 'story-bg', { count: false });
    const inp = $('#nm', el), go = () => { const n = (inp.value || '').trim().replace(/[<>&"]/g, '') || 'Commander'; closeModal('name'); cb(n); };
    inp.focus(); inp.onkeydown = (e) => { if (e.key === 'Enter') go(); e.stopPropagation(); }; $('#nm-ok', el).onclick = go; $('#nm-back', el).onclick = () => { closeModal('name'); this.g.menu.show(); };
    el.querySelectorAll('.chipbtn').forEach((b) => (b.onclick = () => { inp.value = b.dataset.n; inp.focus(); }));
  }
  /** Typed story frames. Space / Enter / NEXT to advance, SKIP to jump to the end. */
  story(frames, name, done, lastLabel = 'NEXT ▶') {
    let i = 0, timer = 0, full = '';
    const render = () => {
      const f = frames[i]; full = f.text.replace(/\{name\}/g, name); clearInterval(timer);
      const el = openModal('story', `<div class="story-card anim-in"><div class="story-icon">${f.icon}</div><div class="tag">${esc(f.kicker)}</div><h1>${esc(f.title)}</h1><p id="st-text"></p>
        <div class="row" style="justify-content:space-between"><span class="dots">${frames.map((_, k) => (k === i ? '●' : '○')).join(' ')}</span><span><button class="btn ghost" id="st-skip">SKIP ▶▶</button> <button class="btn" id="st-next">${i === frames.length - 1 ? lastLabel : 'NEXT ▶'}</button></span></div></div>`, 'story-bg', { count: false });
      const p = $('#st-text', el); let n = 0; timer = setInterval(() => { n += 2; p.textContent = full.slice(0, n); if (n >= full.length) clearInterval(timer); }, 22);
      const next = () => { if (n < full.length) { n = full.length; p.textContent = full; clearInterval(timer); return; } i++; if (i >= frames.length) finish(); else render(); };
      const finish = () => { clearInterval(timer); window.removeEventListener('keydown', key, true); closeModal('story'); done(); };
      const key = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); next(); } };
      window.removeEventListener('keydown', this._key || (() => {}), true); this._key = key; window.addEventListener('keydown', key, true);
      $('#st-next', el).onclick = next; $('#st-skip', el).onclick = () => { i = frames.length - 1; if (frames.length > 1) { render(); } else finish(); };
    };
    render();
  }
  caption(text) {
    if (!this.cap) { this.cap = document.createElement('div'); this.cap.id = 'landcap'; this.cap.innerHTML = '<div id="landtext"></div><button class="btn ghost" id="landskip">SKIP ▶▶</button>'; $('#ui').appendChild(this.cap); $('#landskip', this.cap).onclick = () => this.g.landing.skip(); }
    this.cap.hidden = !text; if (text) $('#landtext', this.cap).textContent = text;
  }
}
