'use strict';
// =================================================================== tela, escala e qualidade
let W = 960, H = 540, K = 4, KB = 2.5, VW = 240, qScale = 1, cssW = 960, cssH = 540;
const caches = [];                // funções que reconstroem caches ao mudar a escala
function onRescale(fn) { caches.push(fn); }
function resize() {
  const ww = window.innerWidth, wh = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  let vw = VHV * ww / wh, cw = ww, ch = wh;
  if (vw < 170) { vw = 170; ch = ww * VHV / 170; }
  if (vw > 400) { vw = 400; cw = wh * 400 / VHV; }
  const maxH = (COARSE ? 912 : 1197) * qScale;
  let bh = Math.min(ch * dpr, maxH);
  bh = Math.max(285, Math.round(bh / 57) * 57);      // múltiplo de 57 => blocos de 16 unidades com pixels inteiros (16·H/114)
  H = bh; K = H / VHV; KB = H / BGH; W = Math.round(vw * K); VW = W / K;
  cvs.width = W; cvs.height = H; cvs.style.width = Math.round(cw) + 'px'; cvs.style.height = Math.round(ch) + 'px';
  cssW = cw; cssH = ch;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  caches.forEach(fn => fn());
  const rot = document.getElementById('rot');
  if (rot) rot.hidden = !(isTouch && wh > ww && !rotDismissed);
}
let rotDismissed = false;
window.addEventListener('resize', () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 80); });
// queda de qualidade automática se o aparelho não sustentar ~55 fps
// v10: reage antes (média acima de 20 ms) e também a trancos frequentes (quadros perdidos), não só à média
const perf = { acc: 0, n: 0, slow: 0, lastAdj: 0, skip: 120 };
function perfSample(dtMs, now) {
  if (window.__noAdapt || perf.skip > 0 || document.hidden || dtMs > 120) { perf.skip--; return; }
  perf.acc += dtMs; perf.n++; if (dtMs > 24) perf.slow++;
  if (perf.n >= 120) {
    const avg = perf.acc / perf.n, slow = perf.slow; perf.acc = 0; perf.n = 0; perf.slow = 0;
    if ((avg > 20 || slow > 18) && qScale > 0.5 && now - perf.lastAdj > 2500) { qScale *= 0.85; perf.lastAdj = now; perf.skip = 60; resize(); }
  }
}
