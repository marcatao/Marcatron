'use strict';
// =================================================================== arte: brilho, sprites de blocos e o herói
// --- brilho aditivo (sprites radiais em cache) e fila de emissivos (desenhados depois da dessaturação)
const glowCache = new Map();
function glowSprite(color) {
  let c = glowCache.get(color); if (c) return c;
  c = mk(128, 128); const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, rgba(color, 1)); gr.addColorStop(0.18, rgba(color, 0.55)); gr.addColorStop(0.5, rgba(color, 0.14)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); glowCache.set(color, c); return c;
}
function glow(g, x, y, r, color, a = 1) {
  const op = g.globalCompositeOperation, ga = g.globalAlpha;
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = ga * a;
  g.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  g.globalCompositeOperation = op; g.globalAlpha = ga;
}
let emissive = [];
const emit = (x, y, r, color, a = 1) => emissive.push(x, y, r, color, a);
function flushEmissive(g) { for (let i = 0; i < emissive.length; i += 5) glow(g, emissive[i], emissive[i + 1], emissive[i + 2], emissive[i + 3], emissive[i + 4]); emissive = []; }

function noteGlyph(g, x, y, s, col) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = col; ell(g, -1.1, 2.2, 1.35, 1.0, -0.4); g.fill();
  g.fillRect(-0.05, -3.2, 0.7, 5.4);
  g.beginPath(); g.moveTo(0.6, -3.2); g.quadraticCurveTo(2.6, -2.4, 2.2, -0.2); g.quadraticCurveTo(2.0, -1.6, 0.6, -1.7); g.closePath(); g.fill();
  g.restore();
}
function pickPath(g, r) { g.beginPath(); g.moveTo(0, r * 1.15); g.bezierCurveTo(-r * 0.55, r * 0.55, -r * 1.25, -r * 0.2, -r * 0.95, -r * 0.75); g.quadraticCurveTo(0, -r * 1.25, r * 0.95, -r * 0.75); g.bezierCurveTo(r * 1.25, -r * 0.2, r * 0.55, r * 0.55, 0, r * 1.15); g.closePath(); }
function drawPick(g, x, y, r, spin, col = '#ff8a2a') {
  g.save(); g.translate(x, y); g.scale(Math.max(0.12, Math.abs(Math.cos(spin))), 1);
  pickPath(g, r);
  const gr = g.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, '#ffd08a'); gr.addColorStop(0.45, col); gr.addColorStop(1, '#b8360f');
  fillStroke(g, gr, 0.5);
  g.fillStyle = 'rgba(255,255,255,0.55)'; ell(g, -r * 0.35, -r * 0.45, r * 0.32, r * 0.16, -0.5); g.fill();
  g.fillStyle = '#2a1206'; g.font = `700 ${r * 0.9}px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', 0, r * 0.05);
  g.restore();
}

// v8: rodinha de patins (o coletável que substituiu a palheta): uretano colorido, núcleo escuro com raios e rolamento
const WHEEL_OR = ['#fff3d0', '#ffb347', '#c8601a'], WHEEL_LIME = ['#f4ffd8', '#b6ff3b', '#4f9a12'];
function drawWheel(g, x, y, r, spin, pal = WHEEL_OR) {
  g.save(); g.translate(x, y); g.scale(0.8 + 0.2 * Math.abs(Math.cos(spin * 0.45)), 1);   // balança de leve, como se girasse no ar
  ell(g, 0, 0, r, r);
  const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.08, 0, 0, r * 1.05); gr.addColorStop(0, pal[0]); gr.addColorStop(0.5, pal[1]); gr.addColorStop(1, pal[2]);
  fillStroke(g, gr, 0.5);
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = r * 0.07; ell(g, 0, 0, r * 0.8, r * 0.8); g.stroke();
  ell(g, 0, 0, r * 0.56, r * 0.56); fillStroke(g, '#2b2a33', 0.35);
  g.strokeStyle = pal[1]; g.lineWidth = r * 0.13; g.lineCap = 'round';
  for (let k = 0; k < 5; k++) { const a = spin + k * Math.PI * 0.4; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22); g.lineTo(Math.cos(a) * r * 0.46, Math.sin(a) * r * 0.46); g.stroke(); }
  ell(g, 0, 0, r * 0.22, r * 0.22); g.fillStyle = '#d7dbe2'; g.fill(); ell(g, 0, 0, r * 0.09, r * 0.09); g.fillStyle = '#4a4552'; g.fill();
  g.fillStyle = 'rgba(255,255,255,0.65)'; ell(g, -r * 0.45, -r * 0.5, r * 0.26, r * 0.13, -0.6); g.fill();
  g.restore();
}

// --- sprites dos blocos (redesenhados a cada mudança de escala; tamanho = 16 unidades em pixels inteiros)
const TILE = {};
function tileCanvas(paint) { const s = Math.round(TS * K); const c = mk(s, s); const g = c.getContext('2d'); g.scale(s / TS, s / TS); paint(g); return c; }
function paintCase(g, v) {
  g.fillStyle = vgrad(g, 0, 16, [[0, '#2b2a33'], [1, '#17161c']]); g.fillRect(0, 0, 16, 16);
  g.strokeStyle = '#8f96a3'; g.lineWidth = 1.1; g.strokeRect(0.55, 0.55, 14.9, 14.9);
  g.fillStyle = '#c4cad4'; for (const [x, y] of [[0, 0], [12.4, 0], [0, 12.4], [12.4, 12.4]]) { rr(g, x, y, 3.6, 3.6, 0.8); g.fill(); }
  g.fillStyle = '#5b606b'; for (const [x, y] of [[1.8, 1.8], [14.2, 1.8], [1.8, 14.2], [14.2, 14.2]]) { ell(g, x, y, 0.45, 0.45); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(1.2, 1.2, 13.6, 2.2);
  g.fillStyle = 'rgba(240,236,228,0.8)'; g.font = `800 3.4px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(['PALCO', 'FRÁGIL', 'BANDA', 'TURNÊ'][v % 4], 8, 8.6);
  g.fillStyle = '#9aa1ad'; rr(g, 5.5, 11.3, 5, 1.6, 0.6); g.fill();
}
function paintBrick(g, v) {
  g.fillStyle = vgrad(g, 0, 16, [[0, '#a29daf'], [1, '#7b7689']]); g.fillRect(0, 0, 16, 16);
  g.fillStyle = 'rgba(0,0,0,0.22)';
  g.fillRect(0, 7.4, 16, 0.9); g.fillRect(0, 15.2, 16, 0.8); g.fillRect(v % 2 ? 7.6 : 3.6, 0, 0.8, 7.4); g.fillRect(v % 2 ? 11.6 : 9.8, 8.3, 0.8, 7);
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, 16, 0.6); g.fillRect(0, 8.3, 16, 0.5);
  const r = rng(v * 977 + 13);
  g.strokeStyle = 'rgba(30,26,40,0.75)'; g.lineWidth = 0.45; g.lineCap = 'round';
  for (let k = 0; k < 2; k++) { g.beginPath(); let x = 2 + r() * 12, y = 1 + r() * 12; g.moveTo(x, y); for (let i = 0; i < 4; i++) { x += (r() - 0.5) * 5; y += 1 + r() * 2.5; g.lineTo(x, y); } g.stroke(); }
  if (v % 5 === 2) { // pedaço de cartaz da IA colado
    g.save(); g.translate(8, 8); g.rotate(-0.08 + r() * 0.16); g.fillStyle = '#e4e4ea'; g.fillRect(-5.5, -4.5, 11, 9); g.fillStyle = RED; ell(g, 0, -1, 2.4, 1.5); g.fill(); g.fillStyle = '#1b1a22'; ell(g, 0, -1, 0.9, 0.9); g.fill();
    g.font = `800 2.6px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#1b1a22'; g.fillText('OBEDEÇA', 0, 3.2); g.restore();
  }
}
function paintNote(g, used) {
  g.save();
  rr(g, 0.5, 0.5, 15, 15, 2.4);
  g.fillStyle = used ? vgrad(g, 0, 16, [[0, '#5d5149'], [1, '#3a302a']]) : vgrad(g, 0, 16, [[0, '#ffc957'], [1, '#e8741a']]);
  g.fill(); g.lineWidth = 0.9; g.strokeStyle = OUT; g.stroke();
  rr(g, 2.3, 2.3, 11.4, 11.4, 1.8); g.fillStyle = used ? '#2d2622' : '#2a1608'; g.fill();
  g.fillStyle = used ? '#3e3530' : '#4f2d12';
  for (let x = 3.6; x < 13; x += 1.55) for (let y = 3.6; y < 13; y += 1.55) { ell(g, x, y, 0.36, 0.36); g.fill(); }
  if (!used) {
    noteGlyph(g, 8.5, 8.3, 1.28, '#120804');
    noteGlyph(g, 8.1, 7.9, 1.28, '#c8ff5a');
    g.fillStyle = 'rgba(255,255,255,0.5)'; rr(g, 2.4, 1.2, 11.2, 0.9, 0.45); g.fill();
  } else { noteGlyph(g, 8.1, 7.9, 1.1, '#4a403a'); }
  g.fillStyle = used ? '#4a403a' : '#8a4a14'; for (const [x, y] of [[1.6, 1.6], [14.4, 1.6], [1.6, 14.4], [14.4, 14.4]]) { ell(g, x, y, 0.55, 0.55); g.fill(); }
  g.restore();
}
function paintPlank(g) {
  g.fillStyle = '#6f7480'; g.fillRect(2, 5, 1.6, 11); g.fillRect(12.4, 5, 1.6, 11);
  g.strokeStyle = '#5a5f6b'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(2.8, 15.5); g.lineTo(13.2, 6); g.stroke();
  g.fillStyle = vgrad(g, 0, 5.4, [[0, '#c9925a'], [1, '#8a5a2e']]); rr(g, -0.2, 0.2, 16.4, 5.2, 0.8); g.fill();
  g.strokeStyle = OUT; g.lineWidth = 0.6; g.stroke();
  g.strokeStyle = 'rgba(60,30,10,0.5)'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(0, 2.7); g.lineTo(16, 2.7); g.stroke();
}
function paintStage(g) {
  g.fillStyle = '#1a1020'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = vgrad(g, 0, 6, [[0, '#a8743f'], [1, '#6e4520']]); g.fillRect(0, 0, 16, 6);
  g.fillStyle = 'rgba(255,230,180,0.35)'; g.fillRect(0, 0, 16, 0.6);
  g.fillStyle = 'rgba(40,20,8,0.6)'; g.fillRect(0, 2.9, 16, 0.4); g.fillRect(6, 0, 0.4, 2.9); g.fillRect(12, 3.3, 0.4, 2.7);
  g.fillStyle = '#2a1830'; for (let x = 0.5; x < 16; x += 3.2) g.fillRect(x, 6.5, 1.6, 9.5);
}
function ampCanvas(h) {
  const sw = Math.round(TS * 2 * K), sh = Math.round(TS * h * K);
  const c = mk(sw, sh), g = c.getContext('2d'); g.scale(sw / 32, sh / (16 * h));
  const H_ = 16 * h;
  rr(g, 0.4, 0.4, 31.2, H_ - 0.8, 2.6); g.fillStyle = vgrad(g, 0, H_, [[0, '#2a2830'], [1, '#141318']]); g.fill(); g.lineWidth = 0.9; g.strokeStyle = OUT; g.stroke();
  rr(g, 2, 2, 28, 6.4, 1.2); g.fillStyle = vgrad(g, 2, 8.4, [[0, '#e9cf8a'], [1, '#b08a3e']]); g.fill();
  g.fillStyle = '#16151a'; for (let i = 0; i < 6; i++) { ell(g, 5 + i * 3.6, 5.2, 1.15, 1.15); g.fill(); }
  g.strokeStyle = '#f4f0e6'; g.lineWidth = 0.3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(5 + i * 3.6, 5.2); g.lineTo(5 + i * 3.6 + Math.cos(-1 + i) * 0.9, 5.2 + Math.sin(-1 + i) * 0.9); g.stroke(); }
  g.fillStyle = '#ff5a1f'; ell(g, 27.2, 5.2, 0.9, 0.9); g.fill();
  const gy = 10.2, gh = H_ - gy - 2.4;
  rr(g, 2.2, gy, 27.6, gh, 1.6); g.fillStyle = '#3d3028'; g.fill();
  g.save(); rr(g, 2.2, gy, 27.6, gh, 1.6); g.clip();
  g.strokeStyle = 'rgba(20,14,10,0.55)'; g.lineWidth = 0.35;
  for (let x = -gh; x < 30; x += 1.1) { g.beginPath(); g.moveTo(x, gy); g.lineTo(x + gh, gy + gh); g.stroke(); }
  g.strokeStyle = 'rgba(255,240,220,0.06)'; for (let x = -gh; x < 30; x += 1.1) { g.beginPath(); g.moveTo(x + gh, gy); g.lineTo(x, gy + gh); g.stroke(); }
  g.restore();
  g.strokeStyle = '#d8c48e'; g.lineWidth = 0.5; rr(g, 2.2, gy, 27.6, gh, 1.6); g.stroke();
  g.fillStyle = '#f4e9c8'; g.font = `${Math.min(5.5, gh * 0.4)}px ${FONT_HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('Trovão', 16, gy + Math.min(5.5, gh * 0.4) * 0.9);
  g.fillStyle = '#9aa1ad'; for (const x of [1.6, 30.4]) { ell(g, x, H_ - 1.6, 1.1, 1.1); g.fill(); }
  return c;
}
const AMP_SPR = {};
onRescale(() => {
  for (let v = 0; v < 4; v++) TILE['case' + v] = tileCanvas(g => paintCase(g, v));
  for (let v = 0; v < 6; v++) TILE['brick' + v] = tileCanvas(g => paintBrick(g, v));
  TILE.note = tileCanvas(g => paintNote(g, false)); TILE.used = tileCanvas(g => paintNote(g, true));
  TILE.plank = tileCanvas(paintPlank); TILE.stage = tileCanvas(paintStage);
  for (const h of [2, 3, 4]) AMP_SPR[h] = ampCanvas(h);
});
