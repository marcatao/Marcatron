'use strict';
// =================================================================== arte dos inimigos robotizados (v4: mais detalhe e poses por estado)
// Todos desenhados virados para a esquerda (-x) com a origem no chão, no centro da hitbox; espelha quando olham para a direita.
const ES = 1.1;                                     // v5: arte dos inimigos 10% maior (hitboxes em DIM acompanham)
let WT = { k: 1, ox: 0, oy: 0 };                    // transformação do mundo (para emissivos de partes giradas)
function toWorld(g, x, y) { const m = g.getTransform(); return [(m.a * x + m.c * y + m.e - WT.ox) / WT.k, (m.b * x + m.d * y + m.f - WT.oy) / WT.k]; }
function emitL(g, x, y, r, col, a = 1) { const p = toWorld(g, x, y); emit(p[0], p[1], r, col, a); }
function groundBelow(x, y) { const c = Math.floor(x / TS); for (let r = Math.max(0, Math.floor(y / TS)); r < ROWS; r++) if (solidAt(c, r)) return r * TS; return null; }
function contactShadow(g, x, y, w, k = 1) { g.fillStyle = `rgba(8,4,16,${0.36 * k})`; ell(g, x, y + 0.3, w, 1.3 * Math.max(0.5, k)); g.fill(); }
const beatPulse = (beat, k = 3) => Math.max(0, 1 - (((beat % 1) + 1) % 1) * k);
function star(g, x, y, r, col) {
  g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.25; g.stroke();
}
function thinLimb(g, pts, w, col) { // perna fina com contorno proporcional
  g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.strokeStyle = OUT; g.lineWidth = w + 0.5; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke();
}
const PIG_AIR = { rise: 1, aim: 1, dive: 1, recover: 1, land: 1 };

// ------------------------------------------------------------------ Pombo-Antena "Pombix" (Eletrônico / Punk quando livre)
function drawPigeon(g, e, beat) {
  const free = e.freed, st = free ? 'free' : e.state, t = e.t, pulse = beatPulse(beat);
  const air = free ? e.flying : !!PIG_AIR[st];
  const cx = e.x + e.w / 2, by = e.y + e.h;
  const gy = groundBelow(cx, by - 1);
  if (gy != null && gy - by < 80) contactShadow(g, cx, gy, 5.6 * ES * (1 - (gy - by) / 120), 1 - (gy - by) / 80);
  g.save(); g.translate(cx, by); g.scale(ES, ES); if (e.dir > 0) g.scale(-1, 1);
  const fwd = e.vx * (e.dir > 0 ? 1 : -1);          // velocidade "para a frente" no referencial do desenho
  let rot = 0;
  if (st === 'dive') rot = clamp(Math.atan2(-e.vy, fwd), -1.25, 1.25);
  else if (st === 'alert') rot = -0.06 + Math.sin(e.st * 0.9) * 0.05;
  else if (st === 'dizzy') rot = Math.sin(e.st * 0.22) * 0.2;
  else if (free && e.flying) rot = -0.15;
  else if (air) rot = -clamp(fwd * 0.18, -0.3, 0.3) + Math.sin(t * 6) * 0.03;
  g.translate(0.8, -6.4); g.rotate(rot); if (st === 'alert') g.scale(1.05, 0.93); g.translate(-0.8, 6.4);
  const bodyFill = free ? vgrad(g, -11, -2, [[0, '#b8c4e6'], [1, '#7d8bb8']]) : metalGrad(g, -11, -2);
  // cauda: cabo com plugue + 3 penas de metal em leque
  if (!free) {
    const sw = Math.sin(t * 3) * 0.6 + (air ? 1.2 : 0), px = 10.4 + sw, py = -1.8 - (air ? 1.6 : 0);
    g.strokeStyle = '#17181e'; g.lineWidth = 0.7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(6.0, -6.0); g.bezierCurveTo(8.4, -4.8, 9.0 + sw * 0.4, -2.6, px, py); g.stroke();
    g.save(); g.translate(px, py); g.rotate(0.5 + sw * 0.1); rr(g, -0.4, -0.6, 2.0, 1.2, 0.35); fillStroke(g, '#c9ced6', 0.3); g.fillStyle = '#e8d27a'; g.fillRect(1.5, -0.24, 1.2, 0.48); g.restore();
  }
  for (const [a, l] of [[-0.6, 5.0], [-0.3, 5.8], [0.0, 5.0]]) {
    g.save(); g.translate(5.2, -7.4); g.rotate(a + (air ? -0.12 : 0) + Math.sin(t * 4 + a * 3) * 0.04);
    g.beginPath(); g.moveTo(0, -0.9); g.lineTo(l, -1.25); g.quadraticCurveTo(l + 1.1, 0, l, 1.05); g.lineTo(0, 0.9); g.closePath();
    fillStroke(g, free ? (a < -0.4 ? '#5d69a0' : '#6c78a8') : metalGrad(g, -1.3, 1.1), 0.5);
    g.strokeStyle = free ? 'rgba(40,50,100,0.5)' : 'rgba(255,255,255,0.4)'; g.lineWidth = 0.2; g.beginPath(); g.moveTo(0.6, -0.45); g.lineTo(l - 0.3, -0.75); g.stroke();
    g.restore();
  }
  // pernas (no chão) ou recolhidas (voando)
  const legCol = free ? '#e58a9a' : '#8a909d';
  if (!air) {
    const stp = st === 'walk' || st === 'free' ? Math.sin(beat * Math.PI) * 1.2 : 0;
    for (const [hx0, s] of [[1.6, 1], [-0.5, -1]]) {
      const fx = hx0 + s * stp * 0.9 - 0.3;
      thinLimb(g, [hx0, -3.7, hx0 + 0.8, -1.9, fx, -0.35], 0.55, legCol);
      if (!free) { ell(g, hx0 + 0.8, -1.9, 0.42, 0.42); fillStroke(g, '#5d6272', 0.22); }
      g.strokeStyle = free ? '#c76a7a' : '#4a4e5a'; g.lineWidth = 0.42; g.lineCap = 'round';
      g.beginPath(); g.moveTo(fx, -0.3); g.lineTo(fx - 1.5, 0); g.moveTo(fx, -0.3); g.lineTo(fx - 0.8, 0.1); g.moveTo(fx, -0.3); g.lineTo(fx + 0.9, 0); g.stroke();
    }
  } else thinLimb(g, [1.0, -3.6, 2.4, -2.5, 3.8, -2.6], 0.5, legCol);
  // corpo
  ell(g, 0.8, -6.4, 6.6, 4.6); fillStroke(g, bodyFill, 0.7);
  g.save(); ell(g, 0.8, -6.4, 6.6, 4.6); g.clip();
  g.fillStyle = free ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.38)'; ell(g, 1.8, -9.8, 3.8, 0.9, -0.08); g.fill();
  g.fillStyle = 'rgba(16,18,28,0.22)'; ell(g, 0.8, -2.2, 6.8, 2.0); g.fill();
  if (!free) { g.strokeStyle = 'rgba(40,42,52,0.55)'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(-1.0, -11.0); g.quadraticCurveTo(2.8, -6.4, 0.8, -1.7); g.stroke(); }
  g.restore();
  if (!free) {
    for (const [x, y] of [[-0.2, -9.7], [1.9, -6.5], [1.1, -3.0]]) bolt(g, x, y, 0.3);
    // alto-falante no peito
    ell(g, -2.7, -5.0, 2.5, 2.1); fillStroke(g, '#24252d', 0.45);
    g.save(); ell(g, -2.7, -5.0, 2.15, 1.75); g.clip(); g.fillStyle = '#50535f';
    for (let ix = -4.7; ix < -0.6; ix += 0.78) for (let iy = -6.7; iy < -3.2; iy += 0.78) g.fillRect(ix, iy, 0.36, 0.36);
    g.restore();
    ell(g, -2.7, -5.0, 2.5, 2.1); g.strokeStyle = '#8a8f9c'; g.lineWidth = 0.28; g.stroke();
  } else { g.fillStyle = '#dde2f4'; ell(g, -2.3, -4.8, 3.0, 2.3, 0.2); g.fill(); }
  // asa: 3 placas sobrepostas (bate rápido voando, recolhe no mergulho)
  let wa = 0;
  if (free && e.flying) wa = Math.sin(e.ft * 0.6) * 0.9 - 0.4;
  else if (st === 'rise' || st === 'aim' || st === 'recover' || st === 'land') wa = Math.sin(t * 40) * 0.8 - 0.35;
  else if (st === 'dive') wa = 0.5;
  else if (st === 'alert') wa = -0.3 + Math.sin(e.st * 1.3) * 0.3;
  else if (st === 'dizzy') wa = 0.45;
  g.save(); g.translate(2.0, -7.6); g.rotate(wa);
  for (let k = 2; k >= 0; k--) {
    const ox = k * 1.2, oy = k * 0.85, len = 5.4 - k * 0.6;
    g.beginPath(); g.moveTo(-1.5 + ox * 0.3, -0.6 + oy); g.quadraticCurveTo(len * 0.5 + ox, -1.6 + oy, len + ox, 0.2 + oy); g.quadraticCurveTo(len * 0.4 + ox, 1.6 + oy, -1.3 + ox * 0.3, 1.0 + oy); g.closePath();
    fillStroke(g, free ? ['#8f9bc8', '#7d89b9', '#6c78a8'][k] : ['#aab0bc', '#8f95a2', '#767b88'][k], 0.45);
  }
  if (!free) { bolt(g, -0.5, 0.1, 0.3); g.strokeStyle = 'rgba(255,255,255,0.42)'; g.lineWidth = 0.2; g.beginPath(); g.moveTo(-0.4, -0.5); g.quadraticCurveTo(2.2, -1.3, 4.7, -0.1); g.stroke(); }
  else { g.strokeStyle = '#4c5788'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(1, 1.2); g.lineTo(4.4, 0.6); g.moveTo(0.6, 2.0); g.lineTo(3.8, 1.5); g.stroke(); }
  g.restore();
  // cabeça (vai e vem no ritmo andando)
  const bob = (st === 'walk' || (free && !e.flying)) ? -pulse * 1.2 : 0;
  const hx = -4.4 + bob * 1.4 + (st === 'alert' ? -0.5 : 0), hy = -10.8 + bob * 0.3 + (st === 'alert' ? 0.5 : 0);
  if (!free) { g.save(); g.translate(hx + 2.0, hy + 2.5); g.rotate(-0.5); rr(g, -1.7, -0.75, 3.4, 1.5, 0.6); fillStroke(g, '#3a3d48', 0.35); g.fillStyle = RED; ell(g, 0.6, 0, 0.32, 0.32); g.fill(); g.restore(); }
  else { g.fillStyle = '#4fc79a'; ell(g, hx + 1.7, hy + 1.9, 2.6, 2.1, 0.4); g.fill(); g.fillStyle = '#a370e0'; ell(g, hx + 2.1, hy + 2.8, 2.4, 1.4, 0.4); g.fill(); }
  ell(g, hx, hy, 3.3, 3.1); fillStroke(g, free ? '#adb9dd' : metalGrad(g, hy - 3.1, hy + 3.1), 0.7);
  if (!free) { g.fillStyle = 'rgba(255,255,255,0.45)'; ell(g, hx + 0.7, hy - 2.0, 1.5, 0.6, -0.2); g.fill(); bolt(g, hx + 2.0, hy + 0.9, 0.32); }
  // bico em duas placas (abre no arrulho de alerta)
  const open = st === 'alert' ? Math.max(0, Math.sin(e.st * 0.5)) * 0.4 : st === 'dive' ? 0.12 : 0;
  g.save(); g.translate(hx - 2.6, hy + 0.3);
  g.save(); g.rotate(open); g.beginPath(); g.moveTo(0, -0.65); g.lineTo(-3.0, 0.3); g.lineTo(0, 0.4); g.closePath(); fillStroke(g, free ? '#e8ae62' : '#727786', 0.45); g.restore();
  g.save(); g.rotate(-open); g.beginPath(); g.moveTo(0, 0.4); g.lineTo(-2.4, 0.55); g.lineTo(0, 1.25); g.closePath(); fillStroke(g, free ? '#c98a44' : '#5a5f6c', 0.45); g.restore();
  g.restore();
  if (!free) {
    rr(g, hx - 2.8, hy - 1.9, 3.5, 2.1, 0.7); g.fillStyle = '#1b1c24'; g.fill(); g.strokeStyle = '#8a8f9c'; g.lineWidth = 0.24; g.stroke();
    if (st === 'dizzy') {
      g.strokeStyle = '#ff9a3c'; g.lineWidth = 0.26; g.beginPath();
      for (let i = 0; i < 14; i++) { const a = i * 0.75 + e.st * 0.3, r = 0.1 + i * 0.055; g.lineTo(hx - 1.05 + Math.cos(a) * r, hy - 0.85 + Math.sin(a) * r); }
      g.stroke();
    } else {
      const scan = st === 'walk' ? Math.sin(t * 3.2) * 0.75 : -0.6, ex = hx - 1.05 + scan, ey = hy - 0.85;
      g.fillStyle = RED; ell(g, ex, ey, 0.62, 0.62); g.fill(); g.fillStyle = '#ffd0d6'; ell(g, ex - 0.16, ey - 0.16, 0.2, 0.2); g.fill();
      emitL(g, ex, ey, st === 'aim' || st === 'dive' ? 4.6 : 3.0, RED, st === 'aim' ? 0.65 + 0.35 * Math.sin(e.st * 1.4) : 0.85);
    }
    // mastro + hélice no topo (gira quando ele levanta voo)
    const mx = hx + 0.6, my = hy - 3.0;
    g.strokeStyle = OUT; g.lineWidth = 0.9; g.beginPath(); g.moveTo(mx, my + 0.4); g.lineTo(mx, my - 2.8); g.stroke();
    g.strokeStyle = '#7f8594'; g.lineWidth = 0.45; g.stroke();
    if (e.rotorV > 0.35) {
      ell(g, mx, my - 3.2, 6.2, 0.95); g.fillStyle = 'rgba(214,220,232,0.3)'; g.fill(); g.strokeStyle = 'rgba(240,244,250,0.45)'; g.lineWidth = 0.2; g.stroke();
      const a = e.rotor; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.32; g.beginPath(); g.moveTo(mx + Math.cos(a) * 5.8, my - 3.2 + Math.sin(a) * 0.5); g.lineTo(mx - Math.cos(a) * 5.8, my - 3.2 - Math.sin(a) * 0.5); g.stroke();
    } else {
      const c = Math.cos(e.rotor) * 5.2;
      g.strokeStyle = OUT; g.lineWidth = 1.0; g.beginPath(); g.moveTo(mx - c, my - 3.2); g.lineTo(mx + c, my - 3.2); g.stroke();
      g.strokeStyle = '#a3a9b6'; g.lineWidth = 0.5; g.stroke();
    }
    ell(g, mx, my - 3.2, 0.62, 0.48); fillStroke(g, '#c9ced6', 0.28);
    if (((t * 2) | 0) % 2 === 0 || st !== 'walk') emitL(g, mx, my - 3.2, 2.2, RED, 0.8);
  } else {
    g.fillStyle = '#16121e'; ell(g, hx - 1.1, hy - 0.7, 0.75, 0.8); g.fill(); g.fillStyle = '#fff'; ell(g, hx - 1.3, hy - 1.0, 0.25, 0.25); g.fill();
    g.beginPath(); g.moveTo(hx - 1.6, hy - 2.5);   // crista punk
    for (let i = 0; i < 4; i++) { g.lineTo(hx - 1.0 + i * 0.95, hy - 5.1 + Math.abs(i - 1.5) * 0.45); g.lineTo(hx - 0.5 + i * 0.95, hy - 2.9); }
    g.closePath(); fillStroke(g, '#ff3fa4', 0.4);
  }
  if (st === 'dizzy') for (let i = 0; i < 3; i++) { const a = e.st * 0.15 + i * 2.09; star(g, hx + 0.6 + Math.cos(a) * 3.8, hy - 4.6 + Math.sin(a) * 1.1, 0.95, '#ffd23f'); }
  g.restore();
  if (st === 'dive') { // riscos de velocidade
    const sp = Math.hypot(e.vx, e.vy) || 1, ux = e.vx / sp, uy = e.vy / sp, my = e.y + e.h / 2;
    g.strokeStyle = 'rgba(255,240,240,0.55)'; g.lineWidth = 0.4; g.lineCap = 'round'; g.beginPath();
    for (let k = -1; k <= 1; k++) { const ox = -uy * k * 3.2, oy = ux * k * 3.2, l0 = 7 + Math.abs(k) * 2; g.moveTo(cx - ux * l0 + ox, my - uy * l0 + oy); g.lineTo(cx - ux * (l0 + 7) + ox, my - uy * (l0 + 7) + oy); }
    g.stroke();
  }
}

// ------------------------------------------------------------------ Cão-Caixa "Totó Subwoofer" (Grave / Metal quando livre)
function drawDog(g, e, beat) {
  const free = e.freed, st = free ? 'free' : e.state, armored = !free && e.armor, angry = !free && e.angry, t = e.t, pulse = beatPulse(beat);
  const cx = e.x + e.w / 2, by = e.y + e.h;
  contactShadow(g, cx, by, 7.6 * ES, e.onGround ? 1 : 0.6);
  g.save(); g.translate(cx, by); g.scale(ES, ES); if (e.dir > 0) g.scale(-1, 1);
  const chg = st === 'charge' ? clamp(e.st / (BEAT * 120), 0, 1) : 0;
  const bark = st === 'bark' ? Math.max(0, 1 - e.st / 18) : 0;
  const dash = st === 'dash', crouch = st === 'crouch' ? 1 : st === 'skid' ? 0.6 : chg * 0.7;
  const lean = dash ? -0.07 : st === 'crouch' ? -0.13 : bark ? 0.09 : 0;
  // pose: inclina em torno do quadril, abaixa no bote, estica na corrida
  g.translate(0, crouch * 0.8); g.translate(3, -5); g.rotate(lean); g.translate(-3, 5);
  if (dash) g.scale(1.07, 0.95);
  if (chg > 0) g.scale(1 + Math.sin(e.st * 1.7) * 0.012 * chg, 1 - chg * 0.04);
  const bodyFill = free ? vgrad(g, -11, -4, [[0, '#dca56c'], [1, '#a8693a']]) : metalGrad(g, -11, -4);
  // ritmo das patas
  let run, amp;
  if (free) { run = e.ft * 0.5; amp = 1.6; } else if (dash) { run = t * 32; amp = 2.2; } else if (st === 'walk') { run = beat * Math.PI * 2; amp = 0.9; } else { run = 0; amp = 0; }
  const spread = st === 'crouch' || chg > 0 ? 1 : 0;
  const leg = (x, ph, far) => {
    const dx = Math.sin(run + ph) * amp - (x < 0 ? spread * 1.1 : -spread * 1.0), lift = Math.max(0, -Math.cos(run + ph)) * amp * 0.5;
    thinLimb(g, [x, -4.6, x + dx * 0.4, -2.4 - lift * 0.5, x + dx, -0.7 - lift], 1.35, free ? (far ? '#a5683a' : '#c08548') : (far ? '#646976' : '#8a909d'));
    if (!free) { g.strokeStyle = far ? '#8a8f9c' : '#c9ced6'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(x + 0.3, -4.2); g.lineTo(x + dx * 0.4 + 0.3, -2.6 - lift * 0.5); g.stroke(); }
    rr(g, x + dx - 1.25, -1.0 - lift, 2.5, 1.1, 0.5); fillStroke(g, free ? '#5a3a22' : '#1b1c22', 0.3);
  };
  leg(-2.0, Math.PI, true); leg(5.0, 0, true);
  // cauda: cabo espiralado com plugue P10 (abana quando livre)
  const wag = free ? Math.sin(e.ft * 0.9) * 2 : Math.sin(t * 3) * 0.5 + (dash ? 1.4 : 0) + (angry ? Math.sin(t * 12) * 0.4 : 0);
  if (free) { g.strokeStyle = OUT; g.lineWidth = 2.0; g.lineCap = 'round'; g.beginPath(); g.moveTo(6.2, -8.6); g.quadraticCurveTo(9.0, -10 + wag, 8.6, -12.6 + wag); g.stroke(); g.strokeStyle = '#a8693a'; g.lineWidth = 1.3; g.stroke(); }
  else {
    g.strokeStyle = '#17181e'; g.lineWidth = 0.75; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i <= 18; i++) { const u = i / 18, x = 6.4 + u * 3.3 + Math.sin(u * 15) * 0.55, y = -8.0 - u * 3.6 + Math.cos(u * 15) * 0.55 + wag * u; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    g.save(); g.translate(9.7, -11.6 + wag); g.rotate(-0.95 + wag * 0.1);
    rr(g, -0.6, -0.7, 2.4, 1.4, 0.4); fillStroke(g, '#c9ced6', 0.32); g.fillStyle = '#e8d27a'; g.fillRect(1.6, -0.26, 1.4, 0.52); g.fillStyle = '#16151a'; g.fillRect(2.4, -0.3, 0.28, 0.6);
    g.restore();
  }
  // corpo-caixa
  rr(g, -6.6, -11.2, 13.4, 7.2, 3.0); fillStroke(g, bodyFill, 0.7);
  g.save(); rr(g, -6.6, -11.2, 13.4, 7.2, 3.0); g.clip();
  g.fillStyle = 'rgba(255,255,255,0.22)'; rr(g, -5.4, -11.0, 11.2, 1.5, 0.7); g.fill();
  g.fillStyle = 'rgba(14,12,24,0.25)'; g.fillRect(-7, -5.6, 14, 2);
  if (!free) { g.strokeStyle = 'rgba(30,32,40,0.5)'; g.lineWidth = 0.28; g.beginPath(); g.moveTo(-1.4, -11); g.lineTo(-1.4, -4); g.moveTo(3.4, -11); g.lineTo(3.4, -4); g.stroke(); }
  else { g.fillStyle = '#f1dfc2'; ell(g, -1.2, -4.8, 4.6, 1.8); g.fill(); g.fillStyle = 'rgba(120,70,30,0.35)'; ell(g, 3.6, -9.0, 2.0, 1.2); g.fill(); }
  g.restore();
  if (!free) {
    for (const [x, y] of [[-5.5, -9.6], [5.6, -9.6], [-5.5, -5.6], [5.6, -5.6]]) bolt(g, x, y, 0.32);
    g.fillStyle = '#1b1c22'; for (let i = 0; i < 3; i++) rr(g, -0.9 + i * 1.3, -6.4, 0.7, 1.5, 0.3), g.fill();       // respiro da barriga
    for (let i = 0; i < 3; i++) {     // VU de LEDs no flanco (pulsa no ritmo; tudo vermelho carregando)
      const on = chg > 0 ? 1 : pulse > i * 0.3 ? 1 : 0.25, c = chg > 0 || i === 2 ? RED : i === 1 ? '#ffd23f' : '#b6ff3b';
      g.fillStyle = on > 0.5 ? c : '#2a2c36'; g.fillRect(-0.4 + i * 1.3, -9.4, 0.95, 1.2);
      if (on > 0.5) emitL(g, 0.08 + i * 1.3, -8.8, 1.8, c, 0.6);
    }
  }
  if (armored) {
    // subwoofer blindado nas costas
    const s = 1 + pulse * 0.1 + chg * (0.22 + 0.1 * Math.sin(e.st * 1.6));
    g.strokeStyle = '#121218'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-3.0, -10.9); g.lineTo(-2.7, -4.6); g.moveTo(5.0, -10.9); g.lineTo(4.8, -4.6); g.stroke();
    rr(g, -3.3, -18.0, 9.8, 7.6, 1.3); fillStroke(g, vgrad(g, -18, -10.4, [[0, '#3a3842'], [1, '#1b1a21']]), 0.7);
    g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 0.25; for (let y = -17.2; y < -10.6; y += 0.9) { g.beginPath(); g.moveTo(-3.1, y); g.lineTo(6.3, y); g.stroke(); }
    g.fillStyle = '#b9bec9'; for (const [x, y] of [[-3.3, -18.0], [5.3, -18.0], [-3.3, -11.6], [5.3, -11.6]]) { rr(g, x, y, 1.2, 1.2, 0.3); g.fill(); }
    const wx = 1.6, wy = -14.2;
    ell(g, wx, wy, 3.3, 3.3); fillStroke(g, '#0e0e13', 0.4);
    const cg = g.createRadialGradient(wx - 0.8, wy - 0.8, 0.2, wx, wy, 3.0 * s); cg.addColorStop(0, '#5a5866'); cg.addColorStop(1, '#1c1b22');
    ell(g, wx, wy, 2.8 * s, 2.8 * s); g.fillStyle = cg; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 0.25; ell(g, wx, wy, 2.0 * s, 2.0 * s); g.stroke();
    ell(g, wx, wy, 1.05 * s, 1.05 * s); g.fillStyle = chg > 0 ? mix('#2a2930', '#ff2a4a', chg) : '#2a2930'; g.fill();
    g.save(); g.translate(-1.4, -16.9); if (e.dir > 0) g.scale(-1, 1);
    g.fillStyle = '#bdb6cc'; g.font = `800 1.5px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SUB', 0, 0); g.restore();
    if (chg > 0 || pulse > 0.6) emitL(g, wx, wy, 3 + chg * 9, RED, 0.2 + chg * 0.8);
  } else if (!free) {
    // sem a blindagem: placa amassada e fios soltando faísca
    rr(g, -3.0, -12.4, 8.6, 1.8, 0.6); fillStroke(g, '#5d6272', 0.45);
    for (const [x, c, k] of [[-1.6, '#ff3b5c', 0], [0.9, '#ffd23f', 1], [3.4, '#36f5ff', 2]]) {
      const sw = Math.sin(t * 6 + k * 2) * 0.6;
      g.strokeStyle = c; g.lineWidth = 0.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, -12.3); g.quadraticCurveTo(x + sw, -14.2, x + 0.8 + sw, -15.4); g.stroke();
      if (((t * 9 + k * 3) | 0) % 6 === 0) { emitL(g, x + 0.8 + sw, -15.4, 3.2, '#ffd23f', 0.9); g.strokeStyle = '#fff6c0'; g.lineWidth = 0.22; g.beginPath(); g.moveTo(x + 0.8 + sw, -15.4); g.lineTo(x + 1.8 + sw, -16.6); g.moveTo(x + 0.8 + sw, -15.4); g.lineTo(x - 0.2 + sw, -16.8); g.stroke(); }
    }
  }
  leg(-4.6, 0, false); leg(2.6, Math.PI, false);
  // cabeça
  const hx = -7.0, hy = -11.4 - (st === 'walk' ? pulse * 0.6 : 0) + crouch * 0.6 - bark * 0.6;
  // coleira de tachas (atrás da cabeça, no pescoço) com plaquinha
  g.save(); g.translate(hx + 3.3, hy + 2.6); g.rotate(-0.2);
  rr(g, -0.8, -2.4, 1.7, 4.4, 0.5); fillStroke(g, free ? '#b6ff3b' : '#16151a', 0.35);
  g.fillStyle = '#e6e9ef'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(0.85, -1.7 + i * 1.4); g.lineTo(1.7, -1.3 + i * 1.4); g.lineTo(0.85, -0.9 + i * 1.4); g.fill(); }
  g.restore();
  ell(g, hx + 2.4, hy + 4.4, 0.7, 0.7); fillStroke(g, '#d9b44a', 0.3);
  g.save(); g.translate(hx + 2.2, hy - 2.4); g.rotate(dash ? 0.95 : free ? 0.5 + Math.sin(e.ft * 0.4) * 0.2 : angry ? -0.1 : 0.25 + Math.sin(t * 2) * 0.05);
  g.beginPath(); g.moveTo(-0.9, 0); g.lineTo(0.2, -3.3); g.lineTo(1.5, 0.2); g.closePath(); fillStroke(g, free ? '#8a5228' : '#6b7080', 0.5);
  if (!free) { g.fillStyle = '#25262e'; g.beginPath(); g.moveTo(-0.25, -0.2); g.lineTo(0.25, -2.0); g.lineTo(0.85, -0.1); g.closePath(); g.fill(); }
  g.restore();
  rr(g, hx - 3.6, hy - 3.0, 7.6, 6.0, 2.0); fillStroke(g, bodyFill, 0.7);
  if (!free) { g.fillStyle = 'rgba(255,255,255,0.3)'; rr(g, hx - 2.8, hy - 2.7, 5.4, 0.9, 0.45); g.fill(); bolt(g, hx + 2.6, hy - 1.6, 0.3); }
  rr(g, hx - 6.6, hy - 0.5, 4.4, 3.1, 1.2); fillStroke(g, free ? '#f1dfc2' : '#b9bdc7', 0.6);
  rr(g, hx - 7.2, hy - 0.7, 1.6, 1.3, 0.6); fillStroke(g, '#16151a', 0.3);
  g.fillStyle = 'rgba(255,255,255,0.5)'; ell(g, hx - 6.8, hy - 0.4, 0.3, 0.2); g.fill();
  g.save(); g.translate(hx - 2.4, hy + 2.5); g.rotate(bark * 0.6 + (angry ? 0.1 : 0) + (free ? 0.14 : 0) + (dash ? 0.12 : 0));
  rr(g, -4.0, -0.4, 4.3, 1.5, 0.6); fillStroke(g, free ? '#e9d3b2' : '#9aa0ad', 0.5);
  if (!free) { g.fillStyle = '#eef0f4'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-3.5 + i * 1.1, -0.4); g.lineTo(-3.1 + i * 1.1, -1.15); g.lineTo(-2.7 + i * 1.1, -0.4); g.fill(); } }
  g.restore();
  if (bark > 0) emitL(g, hx - 4.0, hy + 2.3, 7 * bark, RED, bark);
  if (!free) {
    rr(g, hx - 2.9, hy - 1.8, 3.1, 1.9, 0.6); g.fillStyle = '#1b1c24'; g.fill(); g.strokeStyle = '#8a8f9c'; g.lineWidth = 0.22; g.stroke();
    g.fillStyle = RED; ell(g, hx - 1.6, hy - 0.85, 0.66, 0.6); g.fill(); g.fillStyle = '#ffd0d6'; ell(g, hx - 1.8, hy - 1.0, 0.2, 0.18); g.fill();
    if (angry || chg > 0) { g.strokeStyle = OUT; g.lineWidth = 0.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - 3.2, hy - 2.6); g.lineTo(hx - 0.5, hy - 1.7); g.stroke(); }
    emitL(g, hx - 1.6, hy - 0.85, angry ? 3.8 : 3.0, RED, 0.9);
  } else {
    g.fillStyle = '#16121e'; ell(g, hx - 1.4, hy - 0.7, 0.7, 0.8); g.fill(); g.fillStyle = '#fff'; ell(g, hx - 1.6, hy - 1.0, 0.22, 0.22); g.fill();
    g.fillStyle = '#ff6f8a'; ell(g, hx - 4.6, hy + 3.6 + Math.sin(e.ft * 0.6) * 0.3, 0.7, 1.1); g.fill();
  }
  g.restore();
}

// ------------------------------------------------------------------ Girassol-Parabólica "Girassinal" (lâminas / Acústico quando livre)
function drawFlower(g, e, beat) {
  const free = e.freed, cl = free ? 0 : e.closedT, ch = free ? 0 : clamp(e.charge / (BEAT * 60), 0, 1), t = e.t, pulse = beatPulse(beat);
  const cx = e.x + e.w / 2, by = e.y + e.h;
  contactShadow(g, cx, by, 5.4 * ES);
  g.save(); g.translate(cx, by); g.scale(ES, ES);
  g.rotate(free ? Math.sin(e.ft * 0.06) * 0.12 : Math.sin(t * 1.3) * 0.025);
  // vaso: caixa de metal com grade e LED de status (ou vaso de barro, livre)
  rr(g, -4.4, -3.9, 8.8, 3.9, 0.9); fillStroke(g, free ? vgrad(g, -3.9, 0, [[0, '#a8683e'], [1, '#6b3f22']]) : metalGrad(g, -3.9, 0), 0.6);
  if (!free) {
    g.fillStyle = '#25262e'; for (let i = 0; i < 4; i++) rr(g, -3.5 + i * 1.5, -2.8, 0.9, 1.8, 0.3), g.fill();
    const lc = ch > 0 ? RED : '#ffb347'; g.fillStyle = lc; ell(g, 3.2, -2.0, 0.45, 0.45); g.fill(); emitL(g, 3.2, -2.0, 2.0, lc, 0.8);
    bolt(g, -3.8, -3.3, 0.26); bolt(g, 3.8, -3.3, 0.26);
  } else { g.fillStyle = '#3a2414'; ell(g, 0, -3.8, 4.0, 0.8); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-4, -3.2, 8, 0.5); }
  // caule de cabo com anéis
  const hy = -15.6;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -3.6); g.bezierCurveTo(-1.6, -7.2, 1.6, -10.4, 0, hy + 3.4);
  g.strokeStyle = OUT; g.lineWidth = 1.9; g.stroke(); g.strokeStyle = free ? '#4caf50' : '#6f7482'; g.lineWidth = 1.1; g.stroke();
  if (!free) { g.strokeStyle = '#b9bec9'; g.lineWidth = 0.3; for (const [x, y] of [[-0.55, -5.4], [-0.25, -7.6], [0.4, -9.6], [0.4, -11.3]]) { g.beginPath(); g.moveTo(x - 0.6, y); g.lineTo(x + 0.6, y + 0.1); g.stroke(); } }
  // folhas: placas de circuito (com trilhas e chip) / folhas de verdade
  for (const [x, y, a] of [[-0.3, -6.4, -0.55], [0.4, -9.0, 0.7]]) {
    const s = a < 0 ? -1 : 1;
    g.save(); g.translate(x, y); g.rotate(a);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 3.0, -2.4, s * 4.8, 0.2); g.quadraticCurveTo(s * 2.8, 1.8, 0, 0); g.closePath();
    fillStroke(g, free ? '#5cc35f' : '#2f6b4a', 0.45);
    if (!free) {
      g.strokeStyle = '#d9b44a'; g.lineWidth = 0.18; g.beginPath(); g.moveTo(s * 0.6, 0); g.lineTo(s * 2.0, -0.6); g.lineTo(s * 3.6, -0.1); g.moveTo(s * 1.4, 0.3); g.lineTo(s * 2.6, 0.6); g.stroke();
      g.fillStyle = '#15161b'; g.fillRect(s > 0 ? 1.9 : -2.9, -0.55, 1.0, 0.8);
    } else { g.strokeStyle = '#3d8f40'; g.lineWidth = 0.22; g.beginPath(); g.moveTo(s * 0.5, 0); g.lineTo(s * 3.8, 0); g.stroke(); }
    g.restore();
  }
  // cabeça: prato com lâminas que mira no herói; fecha em botão quando ele chega perto
  const look = free ? 0 : clamp(e.look, -1, 1), rec = free ? 0 : e.recoil;
  g.save(); g.translate(-look * rec * 1.3, hy + rec * 0.5); g.rotate(look * 0.42 * (1 - cl));
  const dS = 1 - cl * 0.4, n = 12, spin = free ? Math.sin(e.ft * 0.05) * 0.1 : e.spin;
  const blades = () => {
    for (let i = 0; i < n; i++) {
      const a0 = i * Math.PI * 2 / n + spin;
      let d = a0 + Math.PI / 2; d = ((d % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;      // desvio a partir do "para cima"
      const a = -Math.PI / 2 + d * lerp(1, 0.2, cl), r0 = lerp(3.5, 1.2, cl) * dS, L = lerp(4.2, 7.2, cl);
      g.save(); g.rotate(a + Math.PI / 2);
      if (free) { ell(g, 0, -(r0 + 2.4), 1.55, 2.7); fillStroke(g, i % 2 ? '#ffd23f' : '#ffc12a', 0.42); }
      else {
        g.beginPath(); g.moveTo(-1.1, -r0); g.lineTo(0, -(r0 + L)); g.lineTo(1.1, -r0); g.closePath();
        fillStroke(g, vgrad(g, -(r0 + L), -r0, [[0, '#f4f6fa'], [0.5, '#b4b9c4'], [1, '#6f7482']]), 0.42);
        g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 0.16; g.beginPath(); g.moveTo(-0.7, -r0 - 0.3); g.lineTo(-0.05, -(r0 + L) + 0.6); g.stroke();
      }
      g.restore();
    }
  };
  if (cl < 0.5) blades();
  ell(g, 0, 0, 4.1 * dS, 4.1 * dS);
  if (free) { fillStroke(g, '#6b3f1d', 0.6); }
  else {
    const dg = g.createRadialGradient(-1.2, -1.2, 0.4, 0, 0, 4.2 * dS); dg.addColorStop(0, '#5d6272'); dg.addColorStop(0.55, '#a6acb8'); dg.addColorStop(1, '#e4e8ef');
    fillStroke(g, dg, 0.6);
    g.strokeStyle = 'rgba(30,32,40,0.3)'; g.lineWidth = 0.22; ell(g, 0, 0, 2.9 * dS, 2.9 * dS); g.stroke(); ell(g, 0, 0, 1.8 * dS, 1.8 * dS); g.stroke();
    // tripé do emissor
    const fx = -0.4 * Math.sign(look || -1), fy = -0.4;
    g.strokeStyle = '#4a4e5a'; g.lineWidth = 0.32; g.beginPath(); for (const a of [-2.5, -0.6, 1.6]) { g.moveTo(Math.cos(a) * 3.6 * dS, Math.sin(a) * 3.6 * dS); g.lineTo(fx, fy); } g.stroke();
    const er = (0.95 + ch * 0.75 + pulse * 0.15) * dS;
    ell(g, fx, fy, 1.35 * dS, 1.35 * dS); fillStroke(g, '#1d1e26', 0.35);
    g.fillStyle = RED; ell(g, fx, fy, er * 0.75, er * 0.75); g.fill(); g.fillStyle = '#ffd0d6'; ell(g, fx - 0.25, fy - 0.25, 0.22, 0.22); g.fill();
    emitL(g, fx, fy, 3.6 + ch * 8 + pulse * 1.5, RED, 0.75 + ch * 0.25);
    if (rec > 0.4) emitL(g, fx, fy, 10 * rec, '#ffd0d6', rec);
  }
  if (free) {
    g.fillStyle = '#3a210e'; for (let i = 0; i < 11; i++) { ell(g, Math.cos(i * 2.4) * 2.6 * (i / 11), Math.sin(i * 2.4) * 2.6 * (i / 11), 0.32, 0.32); g.fill(); }
    g.fillStyle = '#1c120a'; ell(g, -1.2, -0.6, 0.45, 0.55); g.fill(); ell(g, 1.2, -0.6, 0.45, 0.55); g.fill();
    g.fillStyle = '#fff'; ell(g, -1.35, -0.8, 0.14, 0.14); g.fill(); ell(g, 1.05, -0.8, 0.14, 0.14); g.fill();
    g.strokeStyle = '#1c120a'; g.lineWidth = 0.4; g.beginPath(); g.arc(0, 0.4, 1.4, 0.25, Math.PI - 0.25); g.stroke();
    g.fillStyle = 'rgba(255,120,120,0.45)'; ell(g, -2.3, 0.6, 0.6, 0.35); g.fill(); ell(g, 2.3, 0.6, 0.6, 0.35); g.fill();
  }
  if (cl >= 0.5) blades();
  g.restore(); g.restore();
}

// ------------------------------------------------------------------ Gato-Câmera "Vigia" (CFTV / gato malhado quando livre)
function catEye(e) { return [e.x + e.w / 2 + e.face * 6.6 * ES, e.y + e.h - 10.2 * ES]; }
function drawCat(g, e, beat) {
  const free = e.freed, t = e.t, cx = e.x + e.w / 2, by = e.y + e.h;
  contactShadow(g, cx, by, 6.4 * ES, e.onGround || !free ? 1 : 0.6);
  if (free) return drawFreeCat(g, e);
  const al = e.alarm > 0, turn = e.turnT > 0 ? e.turnT / 14 : 0;
  g.save(); g.translate(cx, by); g.scale(ES, ES); if (e.face > 0) g.scale(-1, 1);
  if (turn > 0) g.scale(1 - Math.sin(turn * Math.PI) * 0.25, 1);
  // cauda: cabo que balança, com LED na ponta
  const sw = Math.sin(t * 2.2) * 1.1 + (al ? Math.sin(t * 15) * 0.8 : 0);
  g.lineCap = 'round'; g.beginPath(); g.moveTo(4.4, -1.6); g.bezierCurveTo(8.6, -1.0, 8.8 + sw, -5.8, 7.0 + sw, -9.4);
  g.strokeStyle = OUT; g.lineWidth = 1.7; g.stroke(); g.strokeStyle = '#6b7080'; g.lineWidth = 1.0; g.stroke();
  g.strokeStyle = '#b9bec9'; g.lineWidth = 0.25; g.setLineDash([0.4, 0.9]); g.stroke(); g.setLineDash([]);
  const tc = al ? RED : '#ffb347'; g.fillStyle = tc; ell(g, 7.0 + sw, -9.6, 0.62, 0.62); g.fill(); emitL(g, 7.0 + sw, -9.6, 2.4, tc, al ? 1 : 0.6);
  // corpo sentado
  g.beginPath(); g.moveTo(-3.0, -8.8);
  g.bezierCurveTo(-5.0, -6.6, -4.8, -2.0, -3.8, 0);
  g.lineTo(4.8, 0);
  g.bezierCurveTo(6.6, -1.2, 6.4, -5.8, 3.4, -7.8);
  g.quadraticCurveTo(0.8, -9.8, -3.0, -8.8); g.closePath();
  fillStroke(g, metalGrad(g, -9.8, 0), 0.7);
  g.save(); g.clip();
  g.fillStyle = 'rgba(255,255,255,0.3)'; ell(g, -2.6, -6.0, 0.9, 2.6, 0.2); g.fill();
  g.fillStyle = 'rgba(14,16,24,0.22)'; ell(g, 3.8, -1.0, 4, 1.8); g.fill();
  g.restore();
  // coxa traseira (placa redonda) e pata de trás
  ell(g, 3.0, -3.2, 2.8, 3.0); fillStroke(g, metalGrad(g, -6.2, -0.2), 0.5); bolt(g, 3.0, -3.2, 0.42);
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.25; g.beginPath(); g.arc(3.0, -3.2, 2.2, -2.6, -1.2); g.stroke();
  rr(g, 1.2, -1.0, 3.6, 1.0, 0.5); fillStroke(g, '#25262e', 0.3);
  g.save(); g.translate(1.0, -5.4); if (e.face > 0) g.scale(-1, 1);
  g.fillStyle = '#1d1e26'; rr(g, -1.6, -0.8, 3.2, 1.6, 0.4); g.fill(); g.fillStyle = '#ffd23f'; g.font = `800 1.25px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CFTV', 0, 0.05);
  g.restore();
  // patas da frente
  for (const x of [-3.0, -1.3]) { rr(g, x - 0.75, -5.2, 1.5, 5.2, 0.7); fillStroke(g, x < -2 ? '#a3a9b6' : '#82889a', 0.45); rr(g, x - 1.0, -0.9, 2.0, 0.9, 0.4); fillStroke(g, '#25262e', 0.3); }
  // cabeça: carcaça de câmera de segurança com orelhas de gato
  const pitch = e.pitch ?? 0.5;
  g.save(); g.translate(-0.8, -9.4); g.rotate(-clamp(pitch - 0.4, -0.35, 0.5) * 0.55);
  for (const [x, s] of [[1.9, 1], [-2.4, 0.92]]) {   // orelhas de gato (metal com interior escuro)
    g.beginPath(); g.moveTo(x - 1.6 * s, -3.0); g.lineTo(x - 0.1, -6.9 * s); g.lineTo(x + 1.5 * s, -3.0); g.closePath(); fillStroke(g, '#9aa0ad', 0.5);
    g.fillStyle = '#3a3d48'; g.beginPath(); g.moveTo(x - 0.85 * s, -3.2); g.lineTo(x - 0.1, -5.6 * s); g.lineTo(x + 0.75 * s, -3.2); g.closePath(); g.fill();
  }
  rr(g, -5.4, -3.4, 8.8, 5.6, 1.4); fillStroke(g, vgrad(g, -3.4, 2.2, [[0, '#eef1f6'], [0.6, '#b4b9c4'], [1, '#868c99']]), 0.6);
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-5.2, 0.6, 8.4, 1.4);
  bolt(g, 2.3, -1.9, 0.3); bolt(g, 2.3, 1.0, 0.3);
  g.beginPath(); g.moveTo(-6.6, -3.7); g.lineTo(3.6, -4.1); g.lineTo(3.4, -3.1); g.lineTo(-6.0, -2.8); g.closePath(); fillStroke(g, '#5d6272', 0.4);
  // lente com anel de LEDs
  ell(g, -5.6, -0.5, 2.4, 2.4); fillStroke(g, '#17181e', 0.5);
  const lg = g.createRadialGradient(-6.1, -1.0, 0.1, -5.6, -0.5, 1.8); lg.addColorStop(0, '#5a6280'); lg.addColorStop(1, '#0b0c12');
  ell(g, -5.6, -0.5, 1.7, 1.7); g.fillStyle = lg; g.fill();
  const lc = al ? (((t * 10) | 0) % 2 ? RED : '#ff8a9a') : e.cd > 0 ? '#6a5a40' : '#ffb347';
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * (al ? 6 : 1.2); g.fillStyle = (i + ((t * 6) | 0)) % 2 ? lc : '#2a2c36'; ell(g, -5.6 + Math.cos(a) * 2.05, -0.5 + Math.sin(a) * 2.05, 0.26, 0.26); g.fill(); }
  g.fillStyle = al ? RED : '#ffb347'; ell(g, -5.9, -0.5, 0.62, 0.62); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; ell(g, -6.4, -1.1, 0.35, 0.22, -0.5); g.fill();
  emitL(g, -5.9, -0.5, al ? 6.5 : 3.4, al ? RED : '#ffb347', e.cd > 0 && !al ? 0.35 : 0.9);
  g.strokeStyle = '#c9ced6'; g.lineWidth = 0.18; g.beginPath(); for (const [x1, y1] of [[-10.0, 0.0], [-10.2, 1.3], [-9.6, 2.5]]) { g.moveTo(-7.2, 1.0); g.lineTo(x1, y1); } g.stroke();
  // giroflex no topo
  rr(g, -0.2, -5.0, 2.2, 0.8, 0.3); fillStroke(g, '#3a3d48', 0.3);
  ell(g, 0.9, -5.0, 1.0, 1.2); g.fillStyle = al ? (((t * 8) | 0) % 2 ? '#ff2a4a' : '#8a1022') : '#6a4a20'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.3; g.stroke();
  if (al) {
    emitL(g, 0.9, -5.4, 9, RED, 0.85);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,40,70,0.35)';
    const ra = t * 9; for (const s of [1, -1]) { g.beginPath(); g.moveTo(0.9, -5.4); g.lineTo(0.9 + Math.cos(ra) * 16 * s, -5.4 - 3 + Math.sin(ra) * 2); g.lineTo(0.9 + Math.cos(ra) * 16 * s, -5.4 + 3 + Math.sin(ra) * 2); g.closePath(); g.fill(); }
    g.restore();
  }
  g.restore();
  g.restore();
}
function drawFreeCat(g, e) {
  // gato laranja malhado, coleira de tachas verde-limão, fugindo feliz
  const run = e.onGround ? Math.sin(e.ft * 0.55) : 0.6, air = !e.onGround;
  g.save(); g.translate(e.x + e.w / 2, e.y + e.h); g.scale(ES, ES); if (e.dir > 0) g.scale(-1, 1);
  g.strokeStyle = OUT; g.lineWidth = 2.0; g.lineCap = 'round'; g.beginPath(); g.moveTo(4.6, -6.0); g.quadraticCurveTo(8.0, -7.0 + run, 7.6, -11.0 + run * 0.6); g.stroke();
  g.strokeStyle = '#f08a2c'; g.lineWidth = 1.3; g.stroke();
  for (const [x, ph, far] of [[-2.6, 0, 1], [3.0, Math.PI, 1], [-3.6, Math.PI, 0], [2.0, 0, 0]]) {
    const dx = (air ? (x < 0 ? -1.6 : 1.6) : Math.sin(e.ft * 0.55 + ph) * 1.8);
    thinLimb(g, [x, -4.4, x + dx * 0.5, -2.2, x + dx, -0.4], 1.25, far ? '#d87422' : '#f59a3c');
  }
  ell(g, 0.6, -6.0, 5.8, 3.0); fillStroke(g, vgrad(g, -9, -3, [[0, '#ffb35c'], [1, '#e07a22']]), 0.6);
  g.strokeStyle = '#b8561a'; g.lineWidth = 0.5; g.beginPath(); for (const x of [-1.6, 0.8, 3.2]) { g.moveTo(x, -8.8); g.quadraticCurveTo(x + 0.6, -7.4, x + 0.2, -6.2); } g.stroke();
  g.fillStyle = '#fff3e0'; ell(g, -2.6, -4.4, 2.6, 1.3); g.fill();
  const hx = -5.0, hy = -9.0;
  for (const s of [1, -1]) { g.beginPath(); g.moveTo(hx - 1.8 + s * 1.2, hy - 1.6); g.lineTo(hx - 0.6 + s * 1.6, hy - 4.6); g.lineTo(hx + 0.6 + s * 1.6, hy - 1.4); g.closePath(); fillStroke(g, '#f59a3c', 0.45); }
  ell(g, hx, hy, 3.1, 2.8); fillStroke(g, vgrad(g, hy - 3, hy + 3, [[0, '#ffb35c'], [1, '#e8862c']]), 0.6);
  g.fillStyle = '#fff3e0'; ell(g, hx - 1.4, hy + 1.0, 1.6, 1.2); g.fill();
  g.fillStyle = '#7ce35a'; ell(g, hx - 1.0, hy - 0.6, 0.7, 0.85); g.fill(); g.fillStyle = '#16121e'; ell(g, hx - 1.1, hy - 0.6, 0.28, 0.7); g.fill();
  g.fillStyle = '#ff7f9a'; ell(g, hx - 2.8, hy + 0.5, 0.45, 0.35); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 0.15; g.beginPath(); g.moveTo(hx - 2.6, hy + 0.9); g.lineTo(hx - 5.2, hy + 0.4); g.moveTo(hx - 2.6, hy + 1.1); g.lineTo(hx - 5.0, hy + 1.6); g.stroke();
  g.save(); g.translate(hx + 1.6, hy + 2.2); g.rotate(-0.4); rr(g, -0.6, -1.8, 1.2, 3.6, 0.4); fillStroke(g, '#b6ff3b', 0.3); g.restore();
  g.restore();
}

function drawEnemy(g, e, beat) {
  if (e.type === 'pigeon') drawPigeon(g, e, beat);
  else if (e.type === 'dog') drawDog(g, e, beat);
  else if (e.type === 'flower') drawFlower(g, e, beat);
  else drawCat(g, e, beat);
  if (!e.freed && e.alert > 0) emit(e.x + e.w / 2, e.y + e.h * 0.5, 15, RED, 0.22 + 0.14 * Math.sin(G.t * 14));
}

// ------------------------------------------------------------------ luz da câmera do Vigia, ondas de choque e avisos "!"
function drawCone(g, e) {
  const [ex, ey] = catEye(e), al = e.alarm > 0, R = CONE_R, hw = CONE_HW;
  const pitch = e.pitch ?? 0.5, a0 = e.face < 0 ? Math.PI - pitch : pitch;
  const vis = e.turnT > 0 ? 1 - e.turnT / 14 : 1;
  const col = al ? '#ff2a4a' : '#ffc96b', a = (al ? 0.42 + 0.12 * Math.sin(G.t * 22) : e.cd > 0 ? 0.07 : 0.2) * vis;
  if (a <= 0.01) return;
  g.save(); g.beginPath(); g.rect(ex - R - 4, ey - R - 4, R * 2 + 8, GROUND_Y + 0.4 - (ey - R - 4)); g.clip();
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(ex, ey, 1, ex, ey, R); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.65, rgba(col, a * 0.45)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.beginPath(); g.moveTo(ex, ey); g.arc(ex, ey, R, a0 - hw, a0 + hw); g.closePath(); g.fill();
  g.strokeStyle = rgba(col, Math.min(1, a * 1.3)); g.lineWidth = 0.3; g.beginPath();
  for (const s of [-1, 1]) { g.moveTo(ex, ey); g.lineTo(ex + Math.cos(a0 + s * hw) * R * 0.8, ey + Math.sin(a0 + s * hw) * R * 0.8); }
  g.stroke();
  // mancha de luz onde o feixe bate na calçada
  const sn = Math.sin(a0);
  if (sn > 0.05) { const d = (GROUND_Y - ey) / sn; if (d > 0 && d < R) { const sx = ex + Math.cos(a0) * d, rw = clamp(d * hw / sn, 3, 26); g.fillStyle = rgba(col, a * 1.2 * (1 - d / R)); ell(g, sx, GROUND_Y - 0.6, rw, 1.6); g.fill(); } }
  g.restore();
}
function drawShock(g, s) {
  const k = s.t / s.life, a = 1 - k * 0.55, wob = 0.88 + 0.12 * Math.sin(s.t * 0.9);
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  // domo de pressão + 3 frentes de onda (grave do subwoofer andando pelo chão)
  g.fillStyle = rgba('#ff3a64', 0.2 * a); g.beginPath(); g.ellipse(s.x, s.y, 5.6, 8.6 * wob, 0, Math.PI, Math.PI * 2); g.fill();
  for (let i = 0; i < 3; i++) {
    const x = s.x - s.dir * i * 3.6, h = (8.8 - i * 2.3) * (0.86 + 0.14 * Math.sin(s.t * 0.9 + i)), w = 5.6 - i * 1.0;
    g.strokeStyle = rgba(i === 0 ? '#ff5a7a' : '#b04aff', a * (1 - i * 0.25)); g.lineWidth = 1.5 - i * 0.35;
    g.beginPath(); g.ellipse(x, s.y, w, h, 0, Math.PI, Math.PI * 2); g.stroke();
  }
  g.strokeStyle = rgba('#ffd0dc', 0.7 * a); g.lineWidth = 0.5; g.beginPath(); g.moveTo(s.x - s.dir * 12, s.y - 0.3); g.lineTo(s.x + s.dir * 4, s.y - 0.3); g.stroke();
  g.restore();
  emit(s.x, s.y - 3, 11, '#ff2a4a', 0.55 * a);
}
function drawAlertMark(g, e) {
  const pigeonAlert = e.type === 'pigeon' && e.state === 'alert';
  const k = pigeonAlert ? Math.min(1, e.st / 5) : e.alertShow > 0 ? Math.min(1, (50 - e.alertShow) / 5 + 0.01) : 0;
  if (k <= 0) return;
  const x = e.x + e.w / 2, y = e.y - (e.type === 'pigeon' ? 12 : 6) + Math.sin(G.t * 16) * 0.5;
  g.save(); g.translate(x, y); g.scale(k * (1 + (1 - k) * 0.4), k * (1 + (1 - k) * 0.4));
  rr(g, -2.4, -6.2, 4.8, 5.8, 1.4); fillStroke(g, RED, 0.5);
  g.beginPath(); g.moveTo(-0.9, -0.5); g.lineTo(0, 1.3); g.lineTo(0.9, -0.5); g.closePath(); g.fillStyle = RED; g.fill();
  g.fillStyle = '#fff'; g.font = `800 5.2px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 0, -3.2);
  g.restore();
  glow(g, x, y - 3, 8, RED, 0.5);
}
