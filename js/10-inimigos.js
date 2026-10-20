'use strict';
// =================================================================== inimigos robotizados, criaturas libertas, itens e cenário de jogo
const MET = '#9aa0ad', MET_D = '#5d6272', MET_L = '#cfd3dc';
function metalGrad(g, y0, y1) { return vgrad(g, y0, y1, [[0, MET_L], [0.45, MET], [1, MET_D]]); }
function bolt(g, x, y, r = 0.45) { ell(g, x, y, r, r); g.fillStyle = MET_D; g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; ell(g, x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.35); g.fill(); }

// (a arte dos inimigos robotizados fica em 46-enemies.js)

// --- projétil de estática (a IA atira "sinal")
function drawStatic(g, p) {
  g.save(); g.translate(p.x, p.y);
  g.strokeStyle = 'rgba(220,226,240,0.85)'; g.lineWidth = 0.6;
  for (let i = 0; i < 3; i++) { const r = 2 + i * 1.3 + Math.random() * 0.6; g.beginPath(); g.arc(0, 0, r, Math.random() * 6, Math.random() * 6 + 3.5); g.stroke(); }
  g.restore();
  emit(p.x, p.y, 5, RED, 0.8);
}

// --- comida natural (sempre colorida)
function drawFood(g, it, t) {
  g.save(); g.translate(it.x + it.w / 2, it.y + it.h / 2 + Math.sin(t * 5) * 0.4);
  if (it.type === 'pepino') {
    g.rotate(-0.15); rr(g, -6, -3, 12, 6, 3); fillStroke(g, vgrad(g, -3, 3, [[0, '#7fd85a'], [1, '#2e7d32']]), 0.6);
    g.fillStyle = '#c8f5a8'; for (const x of [-3.5, -0.5, 2.5]) { ell(g, x, -0.8, 0.5, 0.35); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.5)'; rr(g, -4.5, -2.3, 7, 0.9, 0.45); g.fill();
    g.fillStyle = '#7a5a2a'; g.fillRect(5.6, -0.5, 1.4, 1);
  } else {
    g.rotate(0.2); g.beginPath(); g.moveTo(-6, 0.5); g.bezierCurveTo(-5, -4, 3, -4.4, 6.2, -0.6); g.bezierCurveTo(5, 3.6, -3, 4, -6, 0.5); g.closePath();
    fillStroke(g, vgrad(g, -4, 4, [[0, '#c45a92'], [1, '#7e2a5c']]), 0.6);
    g.fillStyle = '#ff9a3c'; ell(g, -5.2, 0.4, 1.0, 1.6); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.4)'; ell(g, -1, -2.2, 3, 0.7, -0.1); g.fill();
  }
  g.restore();
  emit(it.x + it.w / 2, it.y + it.h / 2, 9, it.type === 'pepino' ? '#b6ff3b' : '#ff7a1a', 0.35);
}

// --- placas de madeira do tutorial
function drawSign(g, s) {
  const x = s.c * TS + 8;
  g.save(); g.translate(x, 192); g.scale(0.66, 0.66); g.translate(-x, -192);
  g.font = `6.2px ${FONT_HAND}`;
  const w = Math.max(...s.lines.map(t => g.measureText(t).width)) + 8;
  g.fillStyle = '#4a3020'; g.fillRect(x - 1, 178, 2, 14);
  rr(g, x - w / 2, 154, w, 25, 2); fillStroke(g, vgrad(g, 154, 179, [[0, '#d8b078'], [1, '#a77a46']]), 0.8);
  g.strokeStyle = 'rgba(90,55,25,0.35)'; g.lineWidth = 0.4; for (let y = 160; y < 178; y += 6) { g.beginPath(); g.moveTo(x - w / 2 + 1, y); g.lineTo(x + w / 2 - 1, y); g.stroke(); }
  g.fillStyle = '#2a170a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  s.lines.forEach((t, i) => g.fillText(t, x, 161.5 + i * 9.5));
  g.restore();
}

// --- piano de armário (checkpoint) com candelabro gótico
function drawPiano(g, p, t) {
  const X = p.x;
  g.save();
  rr(g, X, 158, 32, 34, 2); fillStroke(g, vgrad(g, 158, 192, [[0, '#5b3220'], [1, '#2a140b']]), 0.8);
  rr(g, X - 1, 156, 34, 4, 1.4); fillStroke(g, '#6e3d26', 0.6);
  g.strokeStyle = 'rgba(255,210,160,0.25)'; g.lineWidth = 0.4; rr(g, X + 4, 161, 24, 9, 1.5); g.stroke();
  g.fillStyle = 'rgba(255,220,170,0.18)'; g.font = `5px ${FONT_HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪ SOM LIVRE', X + 16, 165.6);
  g.fillStyle = '#efe8d8'; g.fillRect(X + 1, 172, 30, 5); g.fillStyle = '#141010'; for (let i = 0; i < 7; i++) if (i !== 2) g.fillRect(X + 3.2 + i * 4.1, 172, 2, 3);
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.2; for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(X + 1 + i * 3, 175); g.lineTo(X + 1 + i * 3, 177); g.stroke(); }
  rr(g, X - 1.5, 177, 35, 2.4, 0.8); fillStroke(g, '#3a1d10', 0.5);
  g.fillStyle = '#c9a24a'; g.fillRect(X + 12, 189, 2, 2.5); g.fillRect(X + 18, 189, 2, 2.5);
  // candelabro
  const cx = X + 25;
  g.strokeStyle = '#c9a24a'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(cx, 156); g.lineTo(cx, 151); g.moveTo(cx - 3, 149); g.quadraticCurveTo(cx, 152.5, cx + 3, 149); g.stroke();
  for (const dx of [-3, 0, 3]) { g.fillStyle = '#f2ead8'; g.fillRect(cx + dx - 0.6, 145 + (dx === 0 ? -1.5 : 0), 1.2, 4); }
  if (p.on) for (const dx of [-3, 0, 3]) { const fy = 144 + (dx === 0 ? -1.5 : 0) + Math.sin(t * 9 + dx) * 0.2; g.fillStyle = '#ffd36b'; ell(g, cx + dx, fy, 0.6, 1.1); g.fill(); emit(cx + dx, fy, 6, '#ffb347', 0.8); }
  g.restore();
  if (p.on) emit(X + 16, 172, 30, '#ffd23f', 0.22 + Math.sin(t * 2) * 0.05);
}

// --- antena do Batidão.exe (torre de 92 unidades, cabe na câmera aproximada)
function drawAntenna(g, a, t, beat) {
  const ax = a.x + 8;
  if (a.wreck <= 0) return;
  g.save();
  if (!a.alive) {
    g.translate(ax, 192 - a.lift); g.scale(a.wreck, a.wreck); g.translate(-ax, -192);
    g.translate(ax, 190); g.rotate(-1.15 * Math.min(1, a.fall)); g.translate(-ax, -190);
  }
  const top = ANT_TOP, L = 192 - top, q = L / 88, flash = a.flash > 0 && a.flash % 4 < 2;
  const metal = flash ? '#ffffff' : '#8a8f9c';
  g.strokeStyle = OUT; g.lineWidth = 2.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(ax - 7, 192); g.lineTo(ax - 2.4, top); g.moveTo(ax + 7, 192); g.lineTo(ax + 2.4, top); g.stroke();
  g.strokeStyle = metal; g.lineWidth = 1.5; g.stroke();
  g.lineWidth = 0.6; g.beginPath();
  for (let y = top + 6; y < 188; y += 9) { const k0 = (y - top) / L, k1 = Math.min(1, (y + 9 - top) / L); g.moveTo(ax - 2.4 - 4.6 * k0, y); g.lineTo(ax + 2.4 + 4.6 * k1, Math.min(192, y + 9)); g.moveTo(ax + 2.4 + 4.6 * k0, y); g.lineTo(ax - 2.4 - 4.6 * k1, Math.min(192, y + 9)); }
  g.stroke();
  rr(g, ax - 9, top + 50 * q, 18, 3, 1); fillStroke(g, '#5d6272', 0.5);
  // cornetas de som
  for (const [dx, dy, s] of [[-1, top + 22 * q, 1], [1, top + 32 * q, 1], [-1, top + 42 * q, 0.8]]) {
    g.save(); g.translate(ax + dx * 3, dy); g.scale(dx * s, s);
    g.beginPath(); g.moveTo(0, -1.4); g.lineTo(7, -4.4); g.lineTo(7, 4.4); g.lineTo(0, 1.4); g.closePath(); fillStroke(g, '#4a4e5a', 0.55);
    ell(g, 7, 0, 1.4, 4.4); g.fillStyle = '#20222b'; g.fill(); g.restore();
  }
  // prato no topo
  g.save(); g.translate(ax + 3, top - 3); g.rotate(-0.5); ell(g, 0, 0, 6.5, 3.2); fillStroke(g, vgrad(g, -3.2, 3.2, [[0, '#e1e5ec'], [1, '#7b808d']]), 0.6); g.restore();
  // olho da IA
  ell(g, ax, top + 10, 4.4, 4.4); fillStroke(g, '#1d1e26', 0.6); ell(g, ax, top + 10, 2.7, 1.8); g.fillStyle = RED; g.fill(); ell(g, ax, top + 10, 0.85, 0.85); g.fillStyle = '#16151a'; g.fill();
  // placa
  rr(g, ax - 13, top + 58 * q, 26, 7, 1.2); fillStroke(g, '#1d1e26', 0.5);
  g.fillStyle = 'rgba(220,226,240,0.9)'; g.font = `800 5px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BATIDÃO.EXE', ax, top + 58 * q + 3.7);
  g.restore();
  if (a.alive) {
    emit(ax, top + 10, 10, RED, 0.9);
    if (((t * 1.6) | 0) % 2 === 0) emit(ax + 3, top - 7, 6, RED, 1);
    const pulse = ((beat % 1) + 1) % 1;   // a contagem inicial tem tempos negativos
    g.save(); g.strokeStyle = 'rgba(255,42,74,0.55)'; g.lineWidth = 1;
    for (let k = 0; k < 3; k++) { const r = ((pulse + k / 3) % 1) * 56 + 8; g.globalAlpha = (1 - r / 64) * 0.8; g.beginPath(); g.arc(ax - 8, top + 22 * q + 4, r, Math.PI * 0.75, Math.PI * 1.25); g.stroke(); g.beginPath(); g.arc(ax + 8, top + 32 * q, r, -Math.PI * 0.25, Math.PI * 0.25); g.stroke(); }
    g.restore();
  }
}

// --- muro com grafite de disco voador (segredo "contato")
function drawGraffitiWall(g, t) {
  const x0 = GRAFFITI.x0, w = GRAFFITI.x1 - GRAFFITI.x0;
  rr(g, x0, 150, w, 42, 1.5); fillStroke(g, vgrad(g, 150, 192, [[0, '#6e6878'], [1, '#4a4555']]), 0.7);
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.4; for (let y = 157; y < 192; y += 7) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); }
  const cx = x0 + w / 2;
  g.save(); g.translate(cx, 166);
  g.fillStyle = '#7fd4ff'; ell(g, 0, -3, 6, 4); g.fill();
  g.fillStyle = '#b6ff3b'; ell(g, 0, 0, 16, 4.6); g.fill(); g.strokeStyle = '#16151a'; g.lineWidth = 0.9; g.stroke();
  g.fillStyle = '#ff3fa4'; for (let i = -2; i <= 2; i++) { ell(g, i * 5.5, 0.6, 1.2, 1.2); g.fill(); }
  g.fillStyle = 'rgba(255,240,140,0.55)'; g.beginPath(); g.moveTo(-6, 3.5); g.lineTo(6, 3.5); g.lineTo(12, 22); g.lineTo(-12, 22); g.closePath(); g.fill();
  g.restore();
  g.fillStyle = '#fff6d0'; g.font = `7px ${FONT_HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(cx, 184); g.rotate(-0.04); g.fillText('SOLTA FAÍSCA PRA ELES!', 0, 0); g.restore();
  g.fillStyle = '#ff3fa4'; g.font = `5px ${FONT_HAND}`; g.fillText('eles curtem rock', cx + 18, 154.5);
}

// --- ET turista sentado no muro (segredo "turista")
function drawAlien(g, al, t) {
  if (al.gone) return;
  g.save(); g.translate(al.x, al.y - al.beam * 40); g.globalAlpha = 1 - al.beam * 0.6;
  const wave = al.met ? Math.sin(t * 14) * 0.6 : 0;
  g.strokeStyle = '#5fd06a'; g.lineWidth = 1.3; g.lineCap = 'round';
  const kick = Math.sin(t * 4) * 0.8;
  g.beginPath(); g.moveTo(-1.2, -1); g.lineTo(-1.6, 3 + kick); g.moveTo(1.2, -1); g.lineTo(1.8, 3 - kick); g.stroke();
  rr(g, -2.8, -6.5, 5.6, 6, 2); fillStroke(g, '#16151d', 0.5);
  g.fillStyle = '#b6ff3b'; g.font = `800 2.1px ${FONT_UI}`; g.textAlign = 'center'; g.fillText('ROCK', 0, -3);
  limb(g, [2.4, -5, 4.6, -7.8 + wave * 2, 5.4, -10 + wave * 2], 1.0, '#6be07a');
  limb(g, [-2.4, -5, -4.2, -3.2], 1.0, '#6be07a');
  g.fillStyle = '#e3343f'; rr(g, -5.6, -5.0, 1.8, 2.6, 0.4); g.fill();
  ell(g, 0, -11, 4.6, 4.2); fillStroke(g, vgrad(g, -15, -7, [[0, '#8ff59a'], [1, '#45b852']]), 0.6);
  g.strokeStyle = '#45b852'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-1.5, -14.8); g.lineTo(-2.6, -17.6); g.moveTo(1.5, -14.8); g.lineTo(2.8, -17.4); g.stroke();
  g.fillStyle = '#ff3fa4'; ell(g, -2.6, -17.8, 0.7, 0.7); g.fill(); ell(g, 2.8, -17.6, 0.7, 0.7); g.fill();
  g.fillStyle = '#121018'; rr(g, -4, -12.4, 8, 2.4, 1); g.fill(); g.strokeStyle = '#121018'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(-4, -11.4); g.lineTo(-4.8, -11); g.moveTo(4, -11.4); g.lineTo(4.8, -11); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-3.2, -12, 1.8, 0.5);
  g.strokeStyle = '#1d4a22'; g.lineWidth = 0.4; g.beginPath(); g.arc(0, -8.8, 1.2, 0.3, Math.PI - 0.3); g.stroke();
  g.restore();
  if (al.beam > 0) emit(al.x, al.y - 20, 30, '#7fd4ff', al.beam);
}

// --- disco voador
function drawUFO(g, u, t, s = 1) {
  g.save(); g.translate(u.x, u.y); g.scale(s, s); g.rotate(Math.sin(t * 2.4 + (u.seed || 0)) * 0.06);
  if (u.beam > 0) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = u.beam * 0.55;
    const col = u.beamCol || '#7fd4ff';
    const gr = g.createLinearGradient(0, 2, 0, u.beamLen || 120); gr.addColorStop(0, rgba(col, 0.9)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.beginPath(); g.moveTo(-6, 2); g.lineTo(6, 2); g.lineTo(22, u.beamLen || 120); g.lineTo(-22, u.beamLen || 120); g.closePath(); g.fill();
    g.restore();
  }
  ell(g, 0, -4.2, 7, 5.6); g.fillStyle = 'rgba(140,220,255,0.55)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.5; g.stroke();
  g.fillStyle = '#5fd06a'; ell(g, 0, -4, 2.2, 2.4); g.fill(); g.fillStyle = '#121018'; ell(g, -0.8, -4.4, 0.6, 0.9, 0.3); g.fill(); ell(g, 0.8, -4.4, 0.6, 0.9, -0.3); g.fill();
  ell(g, 0, 0, 17, 4.6); fillStroke(g, vgrad(g, -4.6, 4.6, [[0, '#f1f3f8'], [0.5, '#a3a9b8'], [1, '#5d6272']]), 0.7);
  ell(g, 0, 1.6, 9, 2); g.fillStyle = '#3d4150'; g.fill();
  const cols = ['#ff3fa4', '#b6ff3b', '#ffd23f', '#7fd4ff', '#ff7a1a'];
  for (let i = 0; i < 7; i++) { const x = -13 + i * 4.33, on = ((t * 8 + i) | 0) % 3 === 0; g.fillStyle = on ? cols[i % 5] : '#2a2c36'; ell(g, x, 0.6, 1.1, 1.0); g.fill(); if (on) emit(u.x + x * s, u.y + 0.6 * s, 4 * s, cols[i % 5], 0.8); }
  g.restore();
  emit(u.x, u.y + 2 * s, 20 * s, '#7fd4ff', 0.25);
}

// --- palco final
function drawStageBack(g, t, win) {
  const sx = STAGE_C * TS, ex = (STAGE_C + 18) * TS, w = ex - sx;
  g.save();
  g.fillStyle = vgrad(g, 40, 176, [[0, '#1d1028'], [1, '#2c1636']]); g.fillRect(sx + 6, 44, w - 12, 132);
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2; for (let x = sx + 10; x < ex - 6; x += 7) { g.beginPath(); g.moveTo(x, 44); g.quadraticCurveTo(x + 2, 110, x, 176); g.stroke(); }
  // treliça
  const truss = (x0, y0, x1, y1) => { g.strokeStyle = '#8c909c'; g.lineWidth = 0.7; g.beginPath(); const n = Math.max(2, Math.hypot(x1 - x0, y1 - y0) / 6 | 0); for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n; g.moveTo(lerp(x0, x1, a), lerp(y0, y1, a) - 2); g.lineTo(lerp(x0, x1, b), lerp(y0, y1, b) + 2); } g.moveTo(x0, y0 - 2); g.lineTo(x1, y1 - 2); g.moveTo(x0, y0 + 2); g.lineTo(x1, y1 + 2); g.stroke(); };
  truss(sx, 40, ex, 40); truss(sx + 3, 40, sx + 3, 176); truss(ex - 3, 40, ex - 3, 176);
  // faixa
  rr(g, sx + 92, 50, 104, 22, 2); fillStroke(g, vgrad(g, 50, 72, [[0, '#ff8a2a'], [1, '#d4520f']]), 0.8);
  g.fillStyle = '#fff6e8'; g.font = `15px ${FONT_HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SOM LIVRE', sx + 144, 61.5);
  // bateria no praticável
  rr(g, sx + 118, 150, 52, 26, 2); fillStroke(g, '#24182c', 0.6);
  ell(g, sx + 144, 160, 11, 11); fillStroke(g, '#e9e2f2', 0.8); ell(g, sx + 144, 160, 9, 9); g.strokeStyle = '#ff3fa4'; g.lineWidth = 0.8; g.stroke();
  g.fillStyle = '#ff3fa4'; g.font = `5.5px ${FONT_HAND}`; g.fillText('SL', sx + 144, 160.5);
  for (const [x, y, r] of [[sx + 128, 146, 4], [sx + 160, 146, 4.5]]) { ell(g, x, y, r, r * 0.6); fillStroke(g, '#3a2d45', 0.5); }
  for (const [x, y] of [[sx + 122, 134], [sx + 168, 130]]) { g.strokeStyle = '#a8adba'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y + 2); g.lineTo(x, 150); g.stroke(); ell(g, x, y, 7, 1.5); fillStroke(g, '#d9b44a', 0.4); }
  // caixas de som
  for (const ox of [sx + 14, ex - 46]) { for (let k = 0; k < 2; k++) { const y = 128 - k * 30; rr(g, ox, y, 32, 30, 2); fillStroke(g, '#18171d', 0.7); for (const cy of [y + 9, y + 21]) { ell(g, ox + 16, cy, 6, 6); fillStroke(g, '#3a3644', 0.5); ell(g, ox + 16, cy, 2.4, 2.4); g.fillStyle = '#0f0e12'; g.fill(); } } }
  // canhões de luz
  for (let i = 0; i < 5; i++) {
    const lx = sx + 30 + i * 58, sw = Math.sin(t * (win ? 2.2 : 0.6) + i * 1.3) * (win ? 46 : 18);
    const col = ['#b6ff3b', '#ff7a1a', '#ff3fa4', '#7fd4ff', '#ffd23f'][i];
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = win ? 0.22 : 0.08;
    const gr = g.createLinearGradient(lx, 44, lx + sw, 176); gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.beginPath(); g.moveTo(lx - 2, 46); g.lineTo(lx + 2, 46); g.lineTo(lx + sw + 24, 176); g.lineTo(lx + sw - 24, 176); g.closePath(); g.fill(); g.restore();
    rr(g, lx - 3.5, 41, 7, 6, 1.2); fillStroke(g, '#2a2833', 0.5); emit(lx, 47, 7, col, win ? 1 : 0.5);
  }
  // pedestal do microfone
  const mx = (GOAL_C + 3) * TS + 4;
  g.strokeStyle = '#c9cdd6'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(mx, 176); g.lineTo(mx, 148); g.moveTo(mx - 5, 176); g.lineTo(mx + 5, 176); g.moveTo(mx, 148); g.lineTo(mx - 4, 143); g.stroke();
  ell(g, mx - 4.6, 142.2, 1.6, 2.1, 0.6); fillStroke(g, '#2a2833', 0.5);
  g.restore();
}
function drawStageCrowd(g, t, beat, win) {
  const sx = (STAGE_C - 1) * TS, ex = (STAGE_C + 22) * TS;
  g.save();
  const pulse = Math.max(0, 1 - (beat % 1) * 2.5);
  for (let i = 0; i < 40; i++) {
    const x = sx + (i / 40) * (ex - sx) + hash(i) * 8, h = 18 + hash(i + 50) * 10, bob = (win ? 3 : 1.2) * pulse * (0.6 + hash(i + 9) * 0.6);
    const y = 236 - h + 14 - bob;
    const alienHere = i === 23;
    g.fillStyle = alienHere ? '#2f6b3a' : '#0d0912';
    ell(g, x, y, 4.4, 4.8); g.fill(); rr(g, x - 6, y + 4, 12, 20, 4); g.fill();
    if (alienHere) { g.fillStyle = '#121018'; ell(g, x - 1.6, y - 0.6, 1.2, 1.7, 0.4); g.fill(); ell(g, x + 1.6, y - 0.6, 1.2, 1.7, -0.4); g.fill(); g.strokeStyle = '#2f6b3a'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - 1.5, y - 4.4); g.lineTo(x - 2.6, y - 8); g.moveTo(x + 1.5, y - 4.4); g.lineTo(x + 2.6, y - 8); g.stroke(); }
    if (win || hash(i + 77) > 0.7) {
      const up = win ? 1 : pulse;
      g.strokeStyle = alienHere ? '#2f6b3a' : '#0d0912'; g.lineWidth = 2.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + 3, y + 6); g.lineTo(x + 6 + up * 1.5, y - 6 - up * 4); g.stroke();
      if (win && hash(i + 3) > 0.5) { const fx = x + 6 + up * 1.5, fy = y - 8 - up * 4; g.fillStyle = '#ffd36b'; ell(g, fx, fy - 1.5, 0.8, 1.6); g.fill(); emit(fx, fy - 1.5, 6, '#ffb347', 0.9); }
    }
  }
  g.restore();
}
