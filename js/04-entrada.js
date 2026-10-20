'use strict';
// =================================================================== entrada
const input = { left: false, right: false, jump: false, jumpP: false, actP: false, startP: false, any: false };
const keys = {}; let touchDir = 0, touchJump = false;
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', KeyX: 'act', KeyJ: 'act', KeyK: 'act' };
window.addEventListener('keydown', e => {
  audioInit();
  if (e.target && e.target.tagName === 'INPUT') return;   // digitando o nome: o jogo não rouba as teclas
  const k = KEYMAP[e.code];
  if (k || e.code === 'Enter') e.preventDefault();
  if (e.repeat) return;
  if (k && !COARSE) setTouchUI(false);
  if (k) { keys[k] = true; if (k === 'jump') { input.jumpP = true; input.startP = true; } if (k === 'act') input.actP = true; }
  if (e.code === 'Enter') input.startP = true;
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  if (e.code === 'KeyM') setMuted(!AU.muted);
  if (e.code === 'KeyF') toggleFull();
  if (e.code === 'KeyR' && (G.state === 'play' || G.state === 'paused')) startGame();
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; touchDir = 0; touchJump = false; });
function syncInput() { input.left = !!keys.left || touchDir < 0; input.right = !!keys.right || touchDir > 0; input.jump = !!keys.jump || touchJump; }

const touchEl = document.getElementById('touch'), pad = document.getElementById('pad'), bJump = document.getElementById('jump'), bAct = document.getElementById('act');
function setTouchUI(on) { if (touchUI === on) return; touchUI = on; touchEl.hidden = !on; }
touchEl.hidden = !touchUI;
window.addEventListener('touchstart', () => setTouchUI(true), { passive: true });
function padUpdate(e) { const r = pad.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2); touchDir = Math.abs(dx) < 8 ? 0 : Math.sign(dx); pad.classList.toggle('l', touchDir < 0); pad.classList.toggle('r', touchDir > 0); }
pad.addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); try { pad.setPointerCapture(e.pointerId); } catch (_) {} padUpdate(e); });
pad.addEventListener('pointermove', e => { if (pad.hasPointerCapture && pad.hasPointerCapture(e.pointerId)) padUpdate(e); });
const padEnd = () => { touchDir = 0; pad.classList.remove('l', 'r'); };
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => pad.addEventListener(ev, padEnd));
bJump.addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); try { bJump.setPointerCapture(e.pointerId); } catch (_) {} touchJump = true; input.jumpP = true; input.startP = true; bJump.classList.add('on'); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => bJump.addEventListener(ev, () => { touchJump = false; bJump.classList.remove('on'); }));
bAct.addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); input.actP = true; bAct.classList.add('on'); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => bAct.addEventListener(ev, () => bAct.classList.remove('on')));
['touchend', 'click'].forEach(ev => document.addEventListener(ev, () => audioInit(), { passive: true }));
document.getElementById('wrap').addEventListener('pointerdown', () => { audioInit(); if ((G.state === 'title' && !nameAsking()) || G.state === 'results') input.startP = true; });
// ---------- caixa do nome (v8)
const nameBox = document.getElementById('nameBox'), nameIn = document.getElementById('nameIn');
const nameAsking = () => !nameBox.hidden;
function askName() {
  nameIn.value = store.get(NAME_KEY) ? heroName : ''; nameBox.hidden = false;
  if (!COARSE) setTimeout(() => { try { nameIn.focus({ preventScroll: true }); nameIn.select(); } catch (_) {} }, 60);
}
function confirmName() {
  heroName = cleanName(nameIn.value) || NAME_DEF; store.set(NAME_KEY, heroName);
  nameBox.hidden = true; nameBox.classList.remove('top'); try { nameIn.blur(); } catch (_) {}
  audioInit(); startGame();
}
nameBox.addEventListener('submit', e => { e.preventDefault(); confirmName(); });
nameIn.addEventListener('focus', () => { if (isTouch) nameBox.classList.add('top'); });
nameIn.addEventListener('blur', () => nameBox.classList.remove('top'));
['pointerdown', 'touchstart'].forEach(ev => nameBox.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
document.getElementById('bPause').addEventListener('click', e => { e.currentTarget.blur(); audioInit(); togglePause(); });
document.getElementById('bMute').addEventListener('click', e => { e.currentTarget.blur(); audioInit(); setMuted(!AU.muted); });
document.getElementById('bFull').addEventListener('click', e => { e.currentTarget.blur(); toggleFull(); });
document.getElementById('rotOk').addEventListener('click', () => { rotDismissed = true; document.getElementById('rot').hidden = true; });
function toggleFull() {
  try {
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (_) {} }).catch(() => {});
  } catch (_) {}
}
