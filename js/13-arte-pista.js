'use strict';
// =================================================================== arte da pista de patins (v7): rampas, pista em U, decks e corrimãos
// Tudo desenhado direto da mesma função de superfície usada na física (rampY), para o desenho bater com o chão de verdade.
function rampPath(g, r, step = 2) {
  g.beginPath(); g.moveTo(r.lowX, r.base);
  const n = Math.max(4, Math.ceil(r.L / step));
  for (let i = 0; i <= n; i++) { const u = i / n * r.L, x = r.dir > 0 ? r.x0 + u : r.x1 - u; g.lineTo(x, rampY(r, x)); }
  g.lineTo(r.lipX, r.base); g.closePath();
}
function drawRamp(g, r, t) {
  g.save();
  if (r.kind === 'slope') {   // ladeira de concreto com faixa de atenção
    rampPath(g, r, 8); fillStroke(g, vgrad(g, r.top, r.base, [[0, '#8d8798'], [1, '#5c566a']]), 0.8);
    g.save(); rampPath(g, r, 8); g.clip();
    g.strokeStyle = 'rgba(30,24,40,0.35)'; g.lineWidth = 0.5;
    for (let k = 1; k < 4; k++) { const y = r.top + k * r.h / 4; g.beginPath(); g.moveTo(r.x0, y); g.lineTo(r.x1, y); g.stroke(); }
    g.restore();
    g.strokeStyle = '#cfc8dc'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(r.lowX, r.base); g.lineTo(r.lipX, r.top); g.stroke();
    g.strokeStyle = OUT; g.lineWidth = 0.5; g.stroke();
    g.restore(); return;
  }
  // corpo de compensado (lateral escura com ripas) e a superfície clara de madeira
  rampPath(g, r); fillStroke(g, vgrad(g, r.top, r.base, [[0, '#5d4030'], [1, '#33231a']]), 0.8);
  g.save(); rampPath(g, r); g.clip();
  g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 0.5;
  for (let x = Math.ceil(r.x0 / 8) * 8; x < r.x1; x += 8) { g.beginPath(); g.moveTo(x, r.top); g.lineTo(x, r.base); g.stroke(); }
  g.strokeStyle = 'rgba(255,210,160,0.12)'; g.lineWidth = 0.8;   // travessas da estrutura
  for (let k = 0; k < 3; k++) { const y = r.base - (k + 0.5) * r.h / 3; g.beginPath(); g.moveTo(r.x0, y); g.lineTo(r.x1, y + (r.dir > 0 ? 6 : -6)); g.stroke(); }
  // adesivo / grafite na lateral
  const cx = r.dir > 0 ? r.x0 + r.L * (r.kind === 'qp' ? 0.8 : 0.62) : r.x1 - r.L * (r.kind === 'qp' ? 0.8 : 0.62), cy = r.kind === 'qp' ? r.base - 9.5 : r.base - r.h * 0.22;
  if (r.h >= 16) {
    g.save(); g.translate(cx, cy); g.rotate(-0.08 * r.dir);
    if (r.kind === 'qp') { g.fillStyle = '#ff7a1a'; g.font = `6.4px ${FONT_HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SOM', 0, -3.4); g.fillStyle = '#b6ff3b'; g.fillText('LIVRE', 0, 3.6); }
    else { star(g, 0, 0, 3.4, '#ffd23f'); }
    g.restore();
  }
  g.restore();
  // superfície (borda de cima) em madeira clara
  g.strokeStyle = OUT; g.lineWidth = 2.4; g.lineJoin = 'round'; g.beginPath();
  const n = Math.ceil(r.L / 2);
  for (let i = 0; i <= n; i++) { const u = i / n * r.L, x = r.dir > 0 ? r.x0 + u : r.x1 - u, y = rampY(r, x); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
  g.stroke(); g.strokeStyle = '#d8a86a'; g.lineWidth = 1.5; g.stroke();
  g.strokeStyle = 'rgba(255,240,210,0.6)'; g.lineWidth = 0.4; g.stroke();
  // borda de metal: chapa na rampinha, cano (coping) no quarter-pipe
  if (r.kind === 'qp') { ell(g, r.lipX + r.dir * -0.4, r.top + 0.6, 1.7, 1.7); fillStroke(g, vgrad(g, r.top - 1.2, r.top + 2.2, [[0, '#f1f3f8'], [1, '#7b808d']]), 0.55); }
  else { g.strokeStyle = '#c9ced6'; g.lineWidth = 1.1; g.beginPath(); const xa = r.lipX - r.dir * 4; g.moveTo(xa, rampY(r, xa)); g.lineTo(r.lipX, r.top); g.stroke(); }
  // traseira da rampinha
  if (r.kind === 'kick') { g.strokeStyle = '#2a1c14'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(r.lipX, r.top + 1); g.lineTo(r.lipX, r.base); g.stroke(); }
  g.restore();
}
// apoio abaixo de um ponto (bloco sólido mais próximo)
function supportBelow(x, y) { const c = Math.floor(x / TS); for (let r = Math.max(0, Math.floor(y / TS)); r < ROWS; r++) if (solidAt(c, r)) return r * TS; return null; }
function drawRail(g, r, t) {
  // postes: nas pontas e a cada ~40 unidades, só onde tem apoio perto
  const n = Math.max(1, Math.round((r.x1 - r.x0) / 40));
  g.lineCap = 'round';
  for (let i = 0; i <= n; i++) {
    const x = lerp(r.x0 + 2, r.x1 - 2, i / n), y = railY(r, x), sb = supportBelow(x, y + 2);
    if (sb == null || sb - y > 70) continue;
    g.strokeStyle = OUT; g.lineWidth = 1.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x, sb); g.stroke();
    g.strokeStyle = '#7d8290'; g.lineWidth = 1.0; g.stroke();
    rr(g, x - 1.6, sb - 1.2, 3.2, 1.2, 0.4); fillStroke(g, '#5d6272', 0.35);
  }
  // barra redonda de metal
  g.strokeStyle = OUT; g.lineWidth = 2.6; g.beginPath(); g.moveTo(r.x0, r.y0); g.lineTo(r.x1, r.y1); g.stroke();
  g.strokeStyle = '#a9afbc'; g.lineWidth = 1.7; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.45; g.beginPath(); g.moveTo(r.x0, r.y0 - 0.45); g.lineTo(r.x1, r.y1 - 0.45); g.stroke();
  for (const [x, y] of [[r.x0, r.y0], [r.x1, r.y1]]) { ell(g, x, y, 1.15, 1.15); fillStroke(g, '#5d6272', 0.4); }
  if (r.glow > 0.02) {   // metal quente depois do grind
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = r.glow * 0.6; g.strokeStyle = '#ffb347'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(r.x0, r.y0); g.lineTo(r.x1, r.y1); g.stroke(); g.restore();
    r.glow *= 0.93;
  }
}
function drawSkatepark(g, vx0, vx1, t) {
  for (const r of ramps) if (r.x1 > vx0 - 10 && r.x0 < vx1 + 10) drawRamp(g, r, t);
}
function drawRails(g, vx0, vx1, t) {
  for (const L of loops) if (L.cx + L.R > vx0 - 10 && L.cx - L.R < vx1 + 10) drawLoop(g, L, t);   // v11: corrimão com loop
  for (const r of rails) if (r.x1 > vx0 - 10 && r.x0 < vx1 + 10) drawRail(g, r, t);
}
// --- deck de compensado (blocos da pista em U): o de cima tem a plataforma
function paintDeck(g, top) {
  g.fillStyle = vgrad(g, 0, 16, [[0, '#6a4a32'], [1, '#3e2a1d']]); g.fillRect(0, 0, 16, 16);
  g.strokeStyle = 'rgba(20,12,6,0.5)'; g.lineWidth = 0.45; for (const x of [4, 8, 12]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 16); g.stroke(); }
  g.strokeStyle = 'rgba(255,220,180,0.12)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(0, 15); g.lineTo(16, 2); g.stroke();
  if (top) {
    g.fillStyle = vgrad(g, 0, 3.4, [[0, '#e0b27a'], [1, '#a8763f']]); g.fillRect(0, 0, 16, 3.4);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, 16, 0.5);
    g.fillStyle = '#3a2618'; for (const x of [2, 14]) { ell(g, x, 1.7, 0.45, 0.45); g.fill(); }
  }
}
onRescale(() => { TILE.deck = tileCanvas(g => paintDeck(g, false)); TILE.deckTop = tileCanvas(g => paintDeck(g, true)); });
