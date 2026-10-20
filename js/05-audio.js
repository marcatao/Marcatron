'use strict';
// =================================================================== áudio: trilha adaptativa em camadas + efeitos
const AU = {
  ctx: null, master: null, music: null, mfilter: null, sfx: null, buf: {}, gains: {}, srcs: {},
  t0: 0, started: false, muted: store.get('rcs.mudo') === '1', loaded: 0, total: 0, wantStart: false,
  danger: 0, crowd: 0.15, radio: 0, duck: 0, tick: 0, last: {}, loops: {},
};
const LOOP_PRE = 0.5, LOOP_LEN = 30.0;               // 16 compassos a 128 BPM
const LAYERS = ['calma', 'banda', 'pesada', 'plateia', 'radio'];
const LAYER_VOL = { calma: 0.95, banda: 0.9, pesada: 0.85, plateia: 0.75, radio: 0.8 };
const SFX_WAV = ['roll', 'grind', 'push', 'grind_start', 'powerslide', 'air', 'land_skate', 'strum_A', 'strum_D', 'strum_E', 'strum_G', 'pick', 'combo', 'jump0', 'jump1', 'jump2', 'land0', 'land1', 'skid', 'bump0', 'bump1', 'note_open', 'brick', 'stomp0', 'stomp1', 'stomp2', 'free', 'hurt', 'slam', 'antenna_hit', 'zap', 'item', 'click', 'pause', 'sticks', 'bark', 'alarm', 'dive', 'charge', 'armor', 'coo', 'meow', 'dizzy', 'thanks'];
const SFX_LATE = ['boss_roar', 'boss_throw', 'box_break', 'boss_tired', 'boss_hit', 'boss_clank', 'boss_step', 'gate'];   // v6: chefe (carregam depois)
const SFX_MP3 = ['ufo', 'beam', 'cheer', 'vitoria', 'morte', 'checkpoint', 'antena', 'powerup_varapau', 'powerup_marombado'];
const VARIANTS = { jump: ['jump0', 'jump1', 'jump2'], land: ['land0', 'land1'], stomp: ['stomp0', 'stomp1', 'stomp2'], bump: ['bump0', 'bump1'] };
const PENTA = [0, 2, 5, 7, 9, 12, 14, 17];            // escala de combo: pentatônica de Lá maior a partir do Mi da palheta

function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended' && G.state !== 'paused') AU.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  let c; try { c = AU.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { return; }
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.22;
  comp.connect(c.destination);
  AU.master = c.createGain(); AU.master.gain.value = AU.muted ? 0 : 0.95; AU.master.connect(comp);
  AU.music = c.createGain(); AU.music.gain.value = 0.85;
  AU.mfilter = c.createBiquadFilter(); AU.mfilter.type = 'lowpass'; AU.mfilter.frequency.value = 20000; AU.mfilter.Q.value = 0.5;
  AU.mfilter.connect(AU.music); AU.music.connect(AU.master);
  AU.sfx = c.createGain(); AU.sfx.gain.value = 0.9; AU.sfx.connect(AU.master);
  for (const L of LAYERS) { const g = c.createGain(); g.gain.value = 0; g.connect(AU.mfilter); AU.gains[L] = g; }
  loadAudio();
}
function decode(ab) {
  return new Promise((res, rej) => { try { const p = AU.ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } });
}
async function loadOne(name, file) {
  try {
    const r = await fetch((window.__AUD && window.__AUD[file]) || 'audio/' + file); if (!r.ok) throw new Error(r.status);   // __AUD: versão de arquivo único (áudio embutido)
    AU.buf[name] = await decode(await r.arrayBuffer());
    if (LAYERS.includes(name) && AU.started) startLayer(name);
  } catch (e) { /* sem esse som; o jogo segue */ }
  AU.loaded++;
}
async function loadAudio() {
  const first = [['calma', 'calma.mp3'], ['banda', 'banda.mp3'], ...SFX_WAV.map(n => [n, n + '.wav'])];
  const later = [['pesada', 'pesada.mp3'], ['plateia', 'plateia.mp3'], ['radio', 'radio.mp3'], ...SFX_MP3.map(n => [n, n + '.mp3']), ...SFX_LATE.map(n => [n, n + '.wav'])];
  AU.total = first.length + later.length;
  const pool = async (list, n) => { let i = 0; const run = async () => { while (i < list.length) { const [a, b] = list[i++]; await loadOne(a, b); } }; await Promise.all(Array.from({ length: n }, run)); };
  await pool(first, 6);
  if (AU.wantStart) musicStart(true);
  await pool(later, 4);
}
function startLayer(name) {
  const b = AU.buf[name]; if (!b || AU.srcs[name] || !AU.started) return;
  const c = AU.ctx, s = c.createBufferSource();
  s.buffer = b; s.loop = true; s.loopStart = LOOP_PRE; s.loopEnd = LOOP_PRE + LOOP_LEN;
  s.connect(AU.gains[name]);
  const now = c.currentTime;
  if (now < AU.t0) s.start(AU.t0, LOOP_PRE);
  else s.start(now + 0.03, LOOP_PRE + ((now + 0.03 - AU.t0) % LOOP_LEN));
  AU.srcs[name] = s;
}
function musicStop(fade = 0.15) {
  if (!AU.ctx) return;
  const now = AU.ctx.currentTime;
  for (const L of LAYERS) { const s = AU.srcs[L]; if (s) { try { s.stop(now + fade); } catch (e) {} delete AU.srcs[L]; } }
  AU.music.gain.cancelScheduledValues(now); AU.music.gain.setValueAtTime(AU.music.gain.value, now);
  AU.music.gain.linearRampToValueAtTime(0, now + fade); AU.music.gain.setValueAtTime(0.85, now + fade + 0.02);
  AU.started = false;
}
function musicStart(countIn) {
  if (!AU.ctx) { AU.wantStart = true; return; }
  if (!AU.buf.calma || !AU.buf.banda) { AU.wantStart = true; return; }
  AU.wantStart = false;
  if (AU.started) musicStop(0.05);
  const now = AU.ctx.currentTime + 0.12;
  let t0 = now;
  if (countIn && AU.buf.sticks) { for (let i = 0; i < 4; i++) sfx('sticks', { when: now + i * BEAT, vol: i === 3 ? 0.9 : 0.7 }); t0 = now + 4 * BEAT; }
  AU.t0 = t0; AU.started = true;
  for (const L of LAYERS) { AU.gains[L].gain.cancelScheduledValues(AU.ctx.currentTime); AU.gains[L].gain.setValueAtTime(0, AU.ctx.currentTime); startLayer(L); }
  AU.last = {};
}
function musicUpdate() {
  if (!AU.ctx || !AU.started) return;
  if ((AU.tick++ & 3) !== 0) return;
  const now = AU.ctx.currentTime, D = AU.danger;
  const tg = {
    calma: clamp(1.25 - 1.8 * D, 0, 1),
    banda: smooth(0.16, 0.42, D),
    pesada: smooth(0.56, 0.84, D),
    plateia: AU.crowd,
    radio: AU.radio,
  };
  for (const L of LAYERS) {
    const v = tg[L] * LAYER_VOL[L] * (1 - AU.duck * 0.6);
    if (Math.abs((AU.last[L] ?? -1) - v) > 0.005) { AU.gains[L].gain.setTargetAtTime(v, now, L === 'calma' ? 0.35 : 0.2); AU.last[L] = v; }
  }
  const f = Math.min(AU.duck > 0.5 ? 650 : lerp(20000, 2600, AU.radio * 0.8), lerp(20000, 5200, G.slomo || 0));   // v8: no ar em câmera lenta a banda fica abafada
  if (Math.abs((AU.last.f ?? 0) - f) > 50) { AU.mfilter.frequency.setTargetAtTime(f, now, 0.12); AU.last.f = f; }
}
function sfx(name, o = {}) {
  if (!AU.ctx || AU.muted) return null;
  let b = AU.buf[name];
  if (!b && VARIANTS[name]) { const v = VARIANTS[name]; b = AU.buf[v[(Math.random() * v.length) | 0]]; }
  if (!b) return null;
  const c = AU.ctx, s = c.createBufferSource(); s.buffer = b;
  s.playbackRate.value = (o.rate || 1) * (o.vary ? 1 + (Math.random() * 2 - 1) * o.vary : 1);
  const g = c.createGain(); g.gain.value = o.vol ?? 1; s.connect(g);
  let node = g;
  if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); node = p; }
  node.connect(AU.sfx);
  try { s.start(o.when || 0); } catch (e) {}
  return s;
}
// v7: laços de efeito (rodinhas no asfalto e grind no corrimão) que acompanham a velocidade do herói
function loopSet(name, vol, rate = 1) {
  if (!AU.ctx || !AU.buf[name]) return;
  let L = AU.loops[name];
  if (!L) {
    if (vol < 0.01) return;
    const c = AU.ctx, s = c.createBufferSource(), g = c.createGain();
    s.buffer = AU.buf[name]; s.loop = true; g.gain.value = 0; s.connect(g); g.connect(AU.sfx);
    try { s.start(); } catch (e) {}
    L = AU.loops[name] = { s, g, v: 0, r: 1 };
  }
  const now = AU.ctx.currentTime;
  if (Math.abs(L.v - vol) > 0.01) { L.g.gain.setTargetAtTime(vol, now, 0.06); L.v = vol; }
  if (Math.abs(L.r - rate) > 0.02) { L.s.playbackRate.setTargetAtTime(rate, now, 0.08); L.r = rate; }
}
const panOf = x => clamp((x - (cam.x + VW / 2)) / VW * 1.4, -0.9, 0.9);
function beatNow() { if (AU.ctx && AU.started && AU.ctx.state === 'running') return (AU.ctx.currentTime - AU.t0) / BEAT; return G.frame / 60 / BEAT; }
function chordNow() { const b = Math.max(0, beatNow()); return HARM[Math.floor(b / 4) % 16]; }
function setMuted(m) {
  AU.muted = m; store.set('rcs.mudo', m ? '1' : '0');
  if (AU.master) AU.master.gain.setTargetAtTime(m ? 0 : 0.95, AU.ctx.currentTime, 0.02);
  const b = document.getElementById('bMute'); b.setAttribute('aria-pressed', m ? 'true' : 'false');
  document.getElementById('snd').style.display = m ? 'none' : ''; document.getElementById('slash').style.display = m ? '' : 'none';
}
function togglePause() {
  if (G.state === 'play' || G.state === 'win') {
    G.prevState = G.state; G.state = 'paused'; sfx('pause', { vol: 0.8 }); for (const n in AU.loops) loopSet(n, 0);   // rodinhas e grind calam na hora
    clearTimeout(togglePause._t); togglePause._t = setTimeout(() => { if (G.state === 'paused' && AU.ctx) AU.ctx.suspend(); }, 650);
  } else if (G.state === 'paused') {
    G.state = G.prevState; clearTimeout(togglePause._t);
    if (AU.ctx) AU.ctx.resume().then(() => sfx('click', { vol: 0.8 }));
  }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && (G.state === 'play' || G.state === 'win')) togglePause(); });
