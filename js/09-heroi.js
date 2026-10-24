'use strict';
// =================================================================== o herói (rig vetorial procedural)
// v20: o patinador da ficha Inline City (elenco Uhuu Rollers) — formas: 0 baixinho, 1 varapau (pepino), 2 marombado (batata-doce)
// v4: escala ~10% maior que a hitbox (além do zoom da câmera); v5: mais 10%. Num teto baixo (túnel) ele se agacha
const FORMP = [
  { leg: 3.4, legW: 2.6, hipW: 4.8, torso: 5.7, shW: 7.6, belly: 9.8, hrx: 5.1, hry: 4.5, neck: 0.0, arm: 4.2, armW: 2.3, boot: 1.0, scale: 1.045, gscale: 0.8 },
  { leg: 9.2, legW: 2.0, hipW: 3.8, torso: 8.8, shW: 6.0, belly: 6.2, hrx: 4.8, hry: 4.3, neck: 1.6, arm: 7.2, armW: 1.8, boot: 0.95, scale: 1.09, gscale: 0.85 },
  { leg: 4.2, legW: 3.5, hipW: 6.8, torso: 7.2, shW: 12.8, belly: 11.2, hrx: 5.1, hry: 4.5, neck: 0.4, arm: 5.4, armW: 3.7, boot: 1.15, scale: 1.19, gscale: 0.85 },
];
const heroVisH = P => (3.6 * P.boot + P.leg - 0.9 + P.torso + P.neck + P.hry * 1.85) * P.scale;   // altura visual (até o topo do cabelo), de patins
const SKIN = '#eaa878', SKIN_D = '#c97f52';   // v20: pele morena clara da ficha
// v20: paleta da ficha Inline City — capacete preto fosco com coroa branca, camiseta branca larga com coroa preta, mochila
// urbana preta, calça cargo preta, luva sem dedo preta e patins brancos com chassi preto e rodas creme
const HP = {
  hair: '#3b2418', hairTop: '#6a4128', hairHi: 'rgba(255,200,150,0.35)',
  tee: '#fbfaf6', teeMid: '#ecebe6', teeBot: '#cfcdc6', crown: '#16151b', teeLine: 'rgba(40,36,50,0.22)',
  pack: '#1d1c23', packTop: '#3a3843', packHi: 'rgba(255,255,255,0.18)', strap: '#141318',
  pants: '#24232b', pantsHi: '#3a3944', pocket: '#1a1920',
  glove: '#18171d', gloveHi: '#3a3944',
  boot: '#f4f1ea', bootBot: '#cfcac0', bootLine: '#1b1a21', frame: '#1e1d24', wheel: '#efe0b8', hub: '#2b2a33',
  trim: '#16151b', patchANote: '#b6ff3b',
  scarf: '#ff7a1a', scarf2: '#ff9a3c', band: '#ffd23f',
};
function formParams(a, b, t) {
  const A = FORMP[a], B = FORMP[b], o = {};
  for (const k in A) o[k] = lerp(A[k], B[k], t);
  o.tall = (t < 0.5 ? a : b) === 1; o.buff = (t < 0.5 ? a : b) === 2;
  return o;
}
function ik(ax, ay, bx, by, len, dirSign) {
  const dx = bx - ax, dy = by - ay; const d = Math.max(0.001, Math.hypot(dx, dy)); const seg = len / 2;
  const dd = Math.min(d, len * 0.999); const h = Math.sqrt(Math.max(0, seg * seg - (dd / 2) * (dd / 2)));
  const mx = ax + dx / 2, my = ay + dy / 2, nx = -dy / d, ny = dx / d;
  let kx = mx + nx * h, ky = my + ny * h;
  if ((kx - mx) * dirSign < 0) { kx = mx - nx * h; ky = my - ny * h; }
  return [kx, ky];
}
function limb(g, pts, w, col) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.strokeStyle = OUT; g.lineWidth = w + 1.1; g.stroke();
  g.strokeStyle = col; g.lineWidth = w; g.stroke();
}
function guitarPath(g) {
  g.beginPath(); g.moveTo(0, -4.9);
  g.bezierCurveTo(1.9, -4.9, 2.8, -3.6, 2.4, -2.2); g.bezierCurveTo(2.1, -1.4, 2.0, -1.0, 2.6, -0.2); g.bezierCurveTo(3.8, 1.2, 3.2, 3.9, 0, 3.9);
  g.bezierCurveTo(-3.2, 3.9, -3.8, 1.2, -2.6, -0.2); g.bezierCurveTo(-2.0, -1.0, -2.1, -1.4, -2.4, -2.2); g.bezierCurveTo(-2.8, -3.6, -1.9, -4.9, 0, -4.9); g.closePath();
}
let GLOW_DEFER = null;   // quando é uma lista, os brilhos do violão são guardados para depois do contorno do herói
function drawGuitar(g, x, y, rot, s, glowing) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  rr(g, -0.6, -12.6, 1.2, 8.4, 0.4); fillStroke(g, '#5a3216', 0.45);
  rr(g, -1.0, -14.6, 2.0, 2.4, 0.6); fillStroke(g, '#2f1a0c', 0.45);
  g.fillStyle = '#d9d2c4'; for (let i = 0; i < 3; i++) { ell(g, -1.25, -14.1 + i * 0.75, 0.3, 0.3); g.fill(); ell(g, 1.25, -14.1 + i * 0.75, 0.3, 0.3); g.fill(); }
  guitarPath(g);
  const gr = g.createRadialGradient(-0.8, -1.2, 0.3, 0, 0, 4.6); gr.addColorStop(0, '#f0b062'); gr.addColorStop(0.65, '#c4742f'); gr.addColorStop(1, '#8a4416');
  fillStroke(g, gr, 0.6);
  g.save(); g.scale(0.86, 0.86); guitarPath(g); g.restore(); g.strokeStyle = 'rgba(255,236,200,0.45)'; g.lineWidth = 0.22; g.stroke();
  ell(g, 0, -1.7, 1.08, 1.08); g.fillStyle = '#26130a'; g.fill(); g.strokeStyle = '#f3d29b'; g.lineWidth = 0.28; g.stroke();
  rr(g, -1.3, 1.5, 2.6, 0.65, 0.3); g.fillStyle = '#2f1a0c'; g.fill();
  g.strokeStyle = 'rgba(240,240,240,0.7)'; g.lineWidth = 0.08; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 0.18, 1.6); g.lineTo(i * 0.12, -14.2); g.stroke(); }
  g.fillStyle = '#b6ff3b'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr_ = i % 2 ? 0.35 : 0.85; g.lineTo(1.7 + Math.cos(a) * rr_, 1.5 + Math.sin(a) * rr_); } g.closePath(); g.fill();
  g.fillStyle = '#ff7a1a'; ell(g, -1.75, -2.9, 0.62, 0.62); g.fill(); g.fillStyle = '#fff'; g.font = `800 0.8px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TI', -1.75, -2.88);
  g.strokeStyle = '#e3343f'; g.lineWidth = 0.18; g.beginPath(); g.moveTo(-2.25, -3.4); g.lineTo(-1.25, -2.4); g.stroke();
  g.restore();
  if (glowing) { if (GLOW_DEFER) { const m = g.getTransform(); GLOW_DEFER.push([m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f, 9 * s * Math.hypot(m.a, m.b), 0.5 * glowing]); } else glow(g, x, y, 9 * s, '#b6ff3b', 0.5 * glowing); }
}

// --- patins inline (v20, ficha Inline City): bota branca com cano e tiras pretas, chassi preto e 4 rodas creme
// origem no chão, debaixo do meio do chassi; bico para +x
function drawSkate(g, s, wr) {
  for (const wx of [-2.0, -0.68, 0.68, 2.0]) {
    const x = wx * s, y = -0.62 * s, r = 0.62 * s;
    ell(g, x, y, r, r); fillStroke(g, HP.wheel, 0.4);
    ell(g, x, y, r * 0.5, r * 0.5); g.fillStyle = HP.hub; g.fill();
    g.strokeStyle = 'rgba(255,240,210,0.6)'; g.lineWidth = 0.14 * s; g.beginPath(); g.moveTo(x + Math.cos(wr) * r * 0.42, y + Math.sin(wr) * r * 0.42); g.lineTo(x - Math.cos(wr) * r * 0.42, y - Math.sin(wr) * r * 0.42); g.stroke();
  }
  rr(g, -2.6 * s, -1.62 * s, 5.2 * s, 0.82 * s, 0.32 * s); fillStroke(g, HP.frame, 0.45);   // chassi
  g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(-2.4 * s, -1.54 * s, 4.8 * s, 0.18 * s);
  // bota branca: calcanhar atrás, bico arredondado, cano alto
  g.beginPath();
  g.moveTo(-2.15 * s, -1.55 * s); g.lineTo(2.2 * s, -1.55 * s);
  g.quadraticCurveTo(2.85 * s, -1.6 * s, 2.7 * s, -2.35 * s); g.quadraticCurveTo(2.45 * s, -3.0 * s, 1.0 * s, -3.15 * s);
  g.lineTo(0.95 * s, -4.05 * s); g.lineTo(-1.95 * s, -4.05 * s); g.quadraticCurveTo(-2.35 * s, -2.8 * s, -2.15 * s, -1.55 * s); g.closePath();
  fillStroke(g, vgrad(g, -4.1 * s, -1.5 * s, [[0, HP.boot], [1, HP.bootBot]]), 0.55);
  g.fillStyle = HP.bootLine; rr(g, -2.12 * s, -2.05 * s, 4.75 * s, 0.42 * s, 0.2 * s); g.fill();          // faixa preta da sola
  ell(g, -1.0 * s, -2.75 * s, 0.55 * s, 0.55 * s); fillStroke(g, HP.bootLine, 0.3);                     // rebite do tornozelo
  g.strokeStyle = HP.bootLine; g.lineWidth = 0.4 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.15 * s, -3.05 * s); g.lineTo(1.35 * s, -2.55 * s); g.moveTo(0.4 * s, -3.6 * s); g.lineTo(1.0 * s, -3.4 * s); g.stroke();   // tiras
  g.fillStyle = 'rgba(255,255,255,0.7)'; ell(g, 1.75 * s, -2.55 * s, 0.7 * s, 0.28 * s, -0.25); g.fill();
  rr(g, -2.05 * s, -4.55 * s, 3.15 * s, 1.15 * s, 0.4 * s); fillStroke(g, vgrad(g, -4.55 * s, -3.4 * s, [[0, '#ffffff'], [1, HP.bootBot]]), 0.45);   // cano branco
  g.fillStyle = HP.bootLine; g.fillRect(-2.0 * s, -4.1 * s, 3.05 * s, 0.34 * s);   // tira preta do cano
  rr(g, 0.25 * s, -4.3 * s, 0.75 * s, 0.6 * s, 0.15 * s); g.fillStyle = '#d7dbe2'; g.fill();           // fivela
}
// --- capacete de skatista (v8): casco redondo preto brilhante, respiros, adesivos, friso e jugular.
// Os espinhos laranja do moicano ficam presos no topo do casco e balançam com a mola do cabelo.
const HELM = { top: '#4a4852', mid: '#26252c', bot: '#111015', rim: '#3d3b45', strap: '#2a2930', vent: '#09080c' };   // v20: preto fosco
// coroa da marca Inline City (três pontas e a base), centrada em (x, y), largura ~2*s
function crownGlyph(g, x, y, s, col) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-0.95, 0.42); g.lineTo(-1.0, -0.45); g.lineTo(-0.5, -0.05); g.lineTo(0, -0.65); g.lineTo(0.5, -0.05); g.lineTo(1.0, -0.45); g.lineTo(0.95, 0.42); g.closePath();
  g.fillStyle = col; g.fill();
  g.fillRect(-0.95, 0.52, 1.9, 0.22);
  g.restore();
}
function drawHelmet(g, hx, hy, rx, ry, S, P) {
  const F = [hx + rx * 1.0, hy - ry * 0.5], C1 = [hx + rx * 1.12, hy - ry * 1.5], C2 = [hx - rx * 1.25, hy - ry * 1.66], B = [hx - rx * 1.12, hy + ry * 0.12];
  const bez = t => { const u = 1 - t; return [u * u * u * F[0] + 3 * u * u * t * C1[0] + 3 * u * t * t * C2[0] + t * t * t * B[0], u * u * u * F[1] + 3 * u * u * t * C1[1] + 3 * u * t * t * C2[1] + t * t * t * B[1]]; };
  const dbez = t => { const u = 1 - t; return [3 * u * u * (C1[0] - F[0]) + 6 * u * t * (C2[0] - C1[0]) + 3 * t * t * (B[0] - C2[0]), 3 * u * u * (C1[1] - F[1]) + 6 * u * t * (C2[1] - C1[1]) + 3 * t * t * (B[1] - C2[1])]; };
  // jugular: da borda, na frente da orelha, até a fivela embaixo do queixo (passa por cima da barba)
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(hx - rx * 0.5, hy - ry * 0.22); g.quadraticCurveTo(hx - rx * 0.44, hy + ry * 0.72, hx + rx * 0.18, hy + ry * 1.3);
  g.strokeStyle = OUT; g.lineWidth = 0.8; g.stroke(); g.strokeStyle = HELM.strap; g.lineWidth = 0.46; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 0.14; g.stroke();
  rr(g, hx + rx * 0.1, hy + ry * 1.18, 0.9, 0.55, 0.2); fillStroke(g, '#c9ced6', 0.25);
  // casco
  const shell = () => { g.beginPath(); g.moveTo(F[0], F[1]); g.bezierCurveTo(C1[0], C1[1], C2[0], C2[1], B[0], B[1]); g.quadraticCurveTo(hx - rx * 0.85, hy - ry * 0.12, hx - rx * 0.45, hy - ry * 0.38); g.quadraticCurveTo(hx + rx * 0.3, hy - ry * 0.62, F[0], F[1]); g.closePath(); };
  shell();
  const gr = g.createRadialGradient(hx + rx * 0.3, hy - ry * 1.1, 0.3, hx, hy - ry * 0.55, rx * 1.4); gr.addColorStop(0, HELM.top); gr.addColorStop(0.5, HELM.mid); gr.addColorStop(1, HELM.bot);
  fillStroke(g, gr, 0.75);
  g.save(); shell(); g.clip();
  // respiros
  g.fillStyle = HELM.vent;
  for (const [vx, vy, rot] of [[0.46, -0.84, 0.55], [-0.04, -0.98, 0.05], [-0.56, -0.8, -0.5]]) { ell(g, hx + rx * vx, hy + ry * vy, 0.85, 0.32, rot); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 0.14;
  for (const [vx, vy, rot] of [[0.46, -0.84, 0.55], [-0.04, -0.98, 0.05], [-0.56, -0.8, -0.5]]) { ell(g, hx + rx * vx, hy + ry * vy + 0.12, 0.85, 0.32, rot); g.stroke(); }
  // v20: a coroa branca da marca na lateral do capacete
  crownGlyph(g, hx - rx * 0.12, hy - ry * 0.72, 1.25, '#f4f1ea');
  // brilho do verniz
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.42; g.beginPath(); g.moveTo(hx - rx * 0.12, hy - ry * 1.16); g.quadraticCurveTo(hx + rx * 0.48, hy - ry * 1.18, hx + rx * 0.82, hy - ry * 0.86); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.7)'; ell(g, hx + rx * 0.3, hy - ry * 1.08, 0.34, 0.2, -0.2); g.fill();
  g.restore();
  // friso da borda (e a faixa amarela do Marombado)
  g.beginPath(); g.moveTo(B[0], B[1]); g.quadraticCurveTo(hx - rx * 0.85, hy - ry * 0.12, hx - rx * 0.45, hy - ry * 0.38); g.quadraticCurveTo(hx + rx * 0.3, hy - ry * 0.62, F[0], F[1]);
  g.strokeStyle = P.buff ? HP.band : HELM.rim; g.lineWidth = P.buff ? 0.95 : 0.55; g.stroke();
  if (!P.buff) { g.save(); g.translate(0, -0.22); g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 0.14; g.stroke(); g.restore(); }
  if (P.buff) {
    g.fillStyle = HP.band; g.beginPath(); g.moveTo(B[0] + 0.2, B[1] - 0.6); g.lineTo(B[0] - 1.6 - S.hairDX * 0.4, B[1] - 0.2 + Math.sin(S.t * 14) * 0.4); g.lineTo(B[0] - 1.3 - S.hairDX * 0.4, B[1] + 0.7); g.closePath(); fillStroke(g, HP.band, 0.35);
  }
}
// v20: mochila urbana preta (ficha Inline City) nas costas: corpo arredondado, bolso, alça de mão e a coroinha branca
function drawBackpack(g, x, y, h, P, S) {
  const w = 3.6 + (P.buff ? 1.2 : 0), bob = Math.sin(S.t * 9) * 0.12 * Math.min(1, S.speed || 0);
  g.save(); g.translate(x + 0.6, y + bob);
  rr(g, -w, 0, w + 0.4, h, 1.3); fillStroke(g, vgrad(g, 0, h, [[0, HP.packTop], [1, HP.pack]]), 0.6);
  rr(g, -w - 0.5, h * 0.42, w * 0.75, h * 0.48, 0.9); fillStroke(g, HP.pack, 0.45);                 // bolso da frente
  g.strokeStyle = HP.packHi; g.lineWidth = 0.22; g.beginPath(); g.moveTo(-w - 0.3, h * 0.55); g.lineTo(-w * 0.4, h * 0.55); g.stroke();   // zíper
  crownGlyph(g, -w * 0.55, h * 0.7, 0.55, '#e8e5de');
  g.strokeStyle = OUT; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-w * 0.7, 0.2); g.quadraticCurveTo(-w * 0.45, -1.1, -w * 0.15, 0.2); g.stroke();   // alça de mão
  g.strokeStyle = HP.packTop; g.lineWidth = 0.35; g.stroke();
  g.fillStyle = HP.packHi; g.fillRect(-w + 0.5, 0.5, 0.35, h - 1.2);
  g.restore();
}
// pose: estado de animação vindo do jogo. S.mode (v7): idle, coast, stride, tuck, air, grab, grind, slide, dead
function drawHeroRig(g, P, S) {
  g.save();
  g.scale(P.scale, P.scale);
  g.scale(1 / Math.sqrt(S.sq), S.sq);
  g.rotate(S.lean);
  const skH = 3.6 * P.boot, legV = P.leg - 0.9, mode = S.dead ? 'dead' : (S.victory || S.strum) && !S.mode ? 'idle' : (S.mode || 'idle');
  // ----- alvo dos pés [x, y, giro do patins], quanto agacha e quanto o tronco inclina (em volta do quadril)
  let crouch = 0.06, leanU = 0.03, front = [1.5, 0, 0], back = [-1.0, 0, 0];
  switch (mode) {
    case 'idle': crouch = 0.07; leanU = 0.03 + Math.sin(S.t * 1.7) * 0.025; if (S.tap) front = [1.5, -0.45, -0.12]; break;
    case 'coast': crouch = 0.18; leanU = 0.15; front = [2.5, 0, 0]; back = [-2.5, 0, 0]; break;
    case 'tuck': crouch = 0.38; leanU = 0.46; front = [2.7, 0, 0]; back = [-2.7, 0, 0]; break;
    case 'stride': {
      crouch = 0.2; leanU = 0.28;
      const L = Math.min(legV * 1.5 + 3.6, 9.5), F0 = 1.6 + legV * 0.12, foot = ph => {   // perna de trás bem esticada empurrando (pernas de borracha no baixinho)
        const c = ((ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (c < Math.PI) return [lerp(F0, -L, smooth(0, 1, c / Math.PI)), 0, 0];   // empurra para trás no chão
        const t = smooth(0, 1, (c - Math.PI) / Math.PI); return [lerp(-L, F0, t), -Math.sin(t * Math.PI) * 1.5 * P.boot, -0.16 * Math.sin(t * Math.PI)];
      };
      front = foot(S.stride); back = foot(S.stride + Math.PI); break;
    }
    case 'air': leanU = 0.06; if (S.vy < 0) { crouch = 0.22; front = [2.2, -2.1, -0.24]; back = [-1.8, -1.4, -0.1]; } else { crouch = 0.1; front = [2.1, -0.7, 0.14]; back = [-2.0, -0.4, 0.12]; } break;
    case 'grab': crouch = 0.26; leanU = 0.12; front = [2.4, -4.4, -0.55]; back = [-3.8, -0.9, 0.2]; break;
    // v11: soul grind de verdade — o patins da frente apoiado no corrimão pela placa (afunda um pouco), o de trás atravessado
    // no corrimão (visto de frente fica estreito), base larga, agachado fundo e o tronco oscilando para se equilibrar
    case 'grind': { const wob = Math.sin(S.t * 7.5); crouch = 0.36; leanU = 0.1 + wob * 0.05; front = [Math.min(legV * 0.9 + 3.6, 7), 1.0, -0.06]; back = [-Math.min(legV * 0.8 + 3.2, 6), 1.5, 0.15, 0.42]; break; }
    case 'slide': crouch = 0.48; leanU = -0.36; front = [Math.min(legV * 1.35 + 4.4, 11.5), 0, -0.06]; back = [-0.6, 0, 0]; break;
    // v8.1: manobras no ar — grupado (mortais) e estrela (braços e pernas abertos)
    case 'flip': crouch = 0.62; leanU = 0.42; front = [1.6, -legV * 0.95 - 1.2, -0.7]; back = [-0.4, -legV * 0.85 - 1.0, -0.45]; break;
    case 'star': crouch = 0.0; leanU = -0.08; front = [legV * 0.6 + 5.4, 0.2, 0.75]; back = [-legV * 0.6 - 5.4, 0.2, -0.75]; break;   // pernas em X bem aberto
  }
  const hipY = -(skH + legV) + crouch * legV * 1.55 + S.bob;
  const shY = hipY - P.torso;
  const headY = shY - P.neck - P.hry * 0.8 + S.nod;
  const upper = fn => { g.save(); g.translate(0, hipY); g.rotate(leanU); g.translate(0, -hipY); fn(); g.restore(); };
  const toU = (x, y) => { const c = Math.cos(-leanU), sn = Math.sin(-leanU), dy = y - hipY; return [x * c - dy * sn, hipY + x * sn + dy * c]; };
  // ----- pernas (IK de dois ossos, joelho para a frente; o pé fica no patins)
  const legs = {};
  for (const [nm, sx, ft] of [['back', -1, back], ['front', 1, front]]) {
    const hx = sx * P.hipW * 0.16;
    let fx = ft[0], fy = ft[1], fr = ft[2];
    if (S.dead) { fx = hx + sx * 2.5; fy = -1.6 + sx; fr = sx * 0.4; }
    const ax = fx + 0.15, ay = fy - skH + 0.35;
    const [kx, ky] = ik(hx * 0.8, hipY, ax, ay, legV + 0.6, 1);
    legs[nm] = { hx: hx * 0.8, kx, ky, ax, ay, fx, fy, fr, sk: ft[3] || 1 };
  }
  const drawLeg = L => {   // v20: calça cargo preta larga, com bolso na coxa e a barra caindo no cano do patins
    limb(g, [L.hx, hipY, L.kx, L.ky, L.ax, L.ay], P.legW * 1.2, HP.pants);
    g.strokeStyle = HP.pantsHi; g.lineWidth = 0.32; g.lineCap = 'round'; g.beginPath(); g.moveTo(lerp(L.hx, L.kx, 0.15) + 0.5, lerp(hipY, L.ky, 0.15)); g.lineTo(lerp(L.hx, L.kx, 0.85) + 0.5, lerp(hipY, L.ky, 0.85)); g.stroke();
    const pa = Math.atan2(L.ky - hipY, L.kx - L.hx), px = lerp(L.hx, L.kx, 0.55), py = lerp(hipY, L.ky, 0.55);
    g.save(); g.translate(px, py); g.rotate(pa - Math.PI / 2); rr(g, -0.2, -0.9, P.legW * 0.95, 1.8, 0.3); fillStroke(g, HP.pocket, 0.3); g.fillStyle = HP.pantsHi; g.fillRect(-0.2, -0.9, P.legW * 0.95, 0.42); g.restore();
    g.save(); g.translate(L.fx, L.fy); g.rotate(L.fr); if (L.sk !== 1) g.scale(L.sk, 1); drawSkate(g, P.boot * 0.92, S.wheel || 0); g.restore();
  };
  // ----- braços (alvos no referencial do tronco inclinado)
  const arms = {};
  const shx = P.shW * 0.36, reach = (sx, sy, x, y, len) => { const d = Math.hypot(x - sx, y - sy); return d > len ? [sx + (x - sx) / d * len, sy + (y - sy) / d * len] : [x, y]; };
  for (const [nm, sx] of [['back', -1], ['front', 1]]) {
    const sxp = sx * shx * 0.8, syp = shY + 1.2;
    let hx, hy, a = null;
    if (S.victory && nm === 'back') { hx = -1.8; hy = shY - P.arm * 1.05; }
    else if (S.strum || S.victory) {
      if (nm === 'front') { hx = 1.4 + Math.sin(S.strumT * 1.4) * 0.3; hy = hipY - 1.8 + Math.sin(S.strumT * 1.6) * 1.1; }
      else { hx = 6.4 * P.gscale; hy = hipY - 4.4 * P.gscale; }
    } else if (S.dead) { const t = S.t * 9 + (sx > 0 ? 0 : 2); hx = sxp + Math.cos(t) * P.arm; hy = syp + Math.sin(t) * P.arm; }
    else switch (mode) {
      case 'stride': a = Math.PI / 2 - Math.sin(S.stride + (sx > 0 ? Math.PI : 0)) * 1.2; break;
      case 'tuck': if (nm === 'front') [hx, hy] = toU(legs.front.kx + 1.2, legs.front.ky - 0.4); else { hx = sxp - 2.4; hy = hipY - 0.6; } break;
      case 'air': a = S.vy < 0 ? (sx > 0 ? -0.5 : -2.0) : (sx > 0 ? -0.3 : -2.7); break;
      case 'grab': if (nm === 'front') [hx, hy] = toU(front[0] + 0.4, front[1] - skH * 0.62); else a = -2.35; break;
      case 'grind': { const wob = Math.sin(S.t * 7.5) * 0.16; a = sx > 0 ? -0.22 + wob : -2.3 + wob; break; }   // v11: braços bem abertos, balançando
      case 'slide': if (nm === 'back') [hx, hy] = toU(-legV * 1.3 - 0.6, -0.5); else a = -0.2; break;
      case 'flip': [hx, hy] = toU((nm === 'front' ? legs.front : legs.back).kx + 0.9, (nm === 'front' ? legs.front : legs.back).ky + 0.9); break;   // abraça os joelhos
      case 'star': { const aa = sx > 0 ? 0.1 : Math.PI - 0.1, L = P.arm + 0.3; hx = sxp + Math.cos(aa) * L; hy = syp + Math.sin(aa) * L; break; }   // braços retos abertos para os lados (as mãos saem da silhueta da cabeça)
      case 'coast': a = Math.PI / 2 - sx * 0.5; break;
      default: a = Math.PI / 2 - sx * 0.22 + Math.sin(S.t * 2.2 + sx) * 0.04;
    }
    if (a != null) { hx = sxp + Math.cos(a) * P.arm; hy = syp + Math.sin(a) * P.arm; }
    const gA = nm === 'front' && S.gest && !S.dead && !S.strum && !S.victory ? (S.gestA || 0) : 0;   // v9: gesto com a mão ao lado do rosto
    if (gA > 0) { hx = lerp(hx, sxp + 5.0, gA); hy = lerp(hy, shY - 2.2, gA); }
    [hx, hy] = reach(sxp, syp, hx, hy, P.arm + 0.3 + gA * 1.3);
    const [ex, ey] = ik(sxp, syp, hx, hy, P.arm + 0.35, -1);
    arms[nm] = { sx: sxp, sy: syp, ex, ey, hx, hy, gest: gA > 0.5 ? S.gest : null };
  }
  const drawArm = (A, front) => {   // v20: braço de pele, manga curta larga da camiseta e luva sem dedo preta com munhequeira
    limb(g, [A.sx, A.sy, A.ex, A.ey, A.hx, A.hy], P.armW * (P.buff ? 1 : 0.9), SKIN);
    if (P.buff) { ell(g, (A.sx + A.ex) / 2, (A.sy + A.ey) / 2 - 0.3, P.armW * 0.62, P.armW * 0.5, Math.atan2(A.ey - A.sy, A.ex - A.sx)); fillStroke(g, SKIN, 0.5); g.fillStyle = 'rgba(255,255,255,0.25)'; ell(g, (A.sx + A.ex) / 2 - 0.3, (A.sy + A.ey) / 2 - 0.9, 0.8, 0.4); g.fill(); }
    const sl = P.buff ? 0.4 : 0.62, mx = lerp(A.sx, A.ex, sl), my = lerp(A.sy, A.ey, sl);
    limb(g, [A.sx, A.sy, mx, my], P.armW * 1.6, front ? HP.tee : HP.teeMid);
    { const ux = A.ex - A.sx, uy = A.ey - A.sy, ul = Math.hypot(ux, uy) || 1; g.strokeStyle = HP.teeLine; g.lineWidth = 0.28; g.beginPath(); g.moveTo(mx - uy / ul * P.armW * 0.8, my + ux / ul * P.armW * 0.8); g.lineTo(mx + uy / ul * P.armW * 0.8, my - ux / ul * P.armW * 0.8); g.stroke(); }
    const fx = A.hx - A.ex, fy = A.hy - A.ey, cx_ = lerp(A.ex, A.hx, 0.72), cy_ = lerp(A.ey, A.hy, 0.72);
    g.save(); g.translate(cx_, cy_); g.rotate(Math.atan2(fy, fx)); rr(g, -0.8, -P.armW * 0.66, 1.6, P.armW * 1.32, 0.4); fillStroke(g, HP.glove, 0.35); g.fillStyle = HP.gloveHi; g.fillRect(-0.15, -P.armW * 0.6, 0.3, P.armW * 1.2); g.restore();
    const hr = 1.12 * (P.buff ? 1.12 : 1);
    if (A.gest) {   // chifrinho do rock (indicador e mindinho) ou joinha (polegar)
      const fs = A.gest === 'rock' ? [[-0.5, -0.24], [0.5, 0.22]] : [[0.1, -0.12]];
      for (const [gx, rot] of fs) { g.save(); g.translate(A.hx + gx, A.hy - hr * 0.35); g.rotate(rot); rr(g, -0.3, -1.8, 0.6, 2.05, 0.3); fillStroke(g, SKIN, 0.42); g.restore(); }
    }
    ell(g, A.hx, A.hy, hr, hr); fillStroke(g, HP.glove, 0.55);                       // luva (palma)
    g.fillStyle = SKIN; g.beginPath(); g.arc(A.hx, A.hy, hr * 0.98, -0.6, 0.6); g.closePath(); g.fill();   // pontas dos dedos de fora
    g.fillStyle = 'rgba(255,255,255,0.22)'; ell(g, A.hx - hr * 0.3, A.hy - hr * 0.35, hr * 0.35, hr * 0.25); g.fill();
  };
  // ----- v20: mochila urbana preta nas costas (o violão só aparece quando ele toca)
  upper(() => drawBackpack(g, -P.shW * 0.5, shY + 0.6, P.torso * 0.92, P, S));
  upper(() => drawArm(arms.back));
  if (S.victory) upper(() => { const A = arms.back; for (const dx of [-0.55, 0.6]) { g.lineCap = 'round'; g.strokeStyle = OUT; g.lineWidth = 1.0; g.beginPath(); g.moveTo(A.hx + dx * 0.6, A.hy - 0.5); g.lineTo(A.hx + dx, A.hy - 2.4); g.stroke(); g.strokeStyle = SKIN; g.lineWidth = 0.55; g.stroke(); } });
  drawLeg(legs.back);
  g.save(); g.translate(0, hipY); g.rotate(leanU); g.translate(0, -hipY);
  // ----- tronco (v20): camiseta branca larga caindo por cima da calça, coroa preta no peito e a alça da mochila
  const tw = P.shW, bw = P.belly * 1.05;
  const tee = () => { g.beginPath(); g.moveTo(-tw * 0.52, shY + 0.9);
    g.quadraticCurveTo(-bw * 0.62, (shY + hipY) / 2 + 0.4, -bw * 0.5, hipY + 0.9);
    g.quadraticCurveTo(0, hipY + 1.5, bw * 0.5, hipY + 0.9);
    g.quadraticCurveTo(bw * 0.62, (shY + hipY) / 2 + 0.4, tw * 0.52, shY + 0.9);
    g.quadraticCurveTo(0, shY - 1.3, -tw * 0.52, shY + 0.9); g.closePath(); };
  tee(); fillStroke(g, vgrad(g, shY, hipY + 1.4, [[0, HP.tee], [0.6, HP.teeMid], [1, HP.teeBot]]), 0.75);
  g.save(); tee(); g.clip();
  g.strokeStyle = HP.teeLine; g.lineWidth = 0.32; g.beginPath(); g.moveTo(-bw * 0.2, hipY - 1.2); g.quadraticCurveTo(-bw * 0.05, hipY - 0.2, -bw * 0.12, hipY + 1); g.moveTo(bw * 0.18, shY + P.torso * 0.5); g.quadraticCurveTo(bw * 0.28, hipY - 0.6, bw * 0.22, hipY + 0.9); g.stroke();   // dobras do tecido
  crownGlyph(g, tw * 0.12, shY + P.torso * 0.42, P.buff ? 1.4 : 1.1, HP.crown);                                // coroa no peito
  g.restore();
  g.strokeStyle = HP.teeLine; g.lineWidth = 0.3; g.beginPath(); g.moveTo(-tw * 0.18, shY - 0.15); g.quadraticCurveTo(tw * 0.05, shY + 0.75, tw * 0.3, shY - 0.05); g.stroke();   // gola
  g.lineCap = 'round'; g.strokeStyle = HP.strap; g.lineWidth = 0.95; g.beginPath(); g.moveTo(-tw * 0.06, shY - 0.2); g.quadraticCurveTo(tw * 0.02, shY + P.torso * 0.5, -tw * 0.04, hipY - 0.8); g.stroke();   // alça da mochila
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 0.22; g.stroke();
  rr(g, -tw * 0.14, shY + P.torso * 0.45, 0.9, 0.7, 0.2); fillStroke(g, '#5d6272', 0.2);   // regulador da alça
  if (P.tall) { // cachecol verde-limão (Varapau)
    g.fillStyle = HP.scarf; rr(g, -tw * 0.42, shY - 0.6, tw * 0.84, 1.6, 0.8); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.4; g.stroke();
    g.save(); g.translate(-tw * 0.3, shY + 0.4); g.rotate(0.9 + S.scarf); rr(g, -0.6, 0, 1.3, 4.2, 0.6); fillStroke(g, HP.scarf2, 0.4); g.restore();
  }
  g.restore();
  drawLeg(legs.front);
  const armFirst = !(S.strum || S.victory);   // v9: braço atrás da cabeça (a boca e a barba ficam à mostra; no gesto, a mão aparece ao lado do rosto)
  if (armFirst) upper(() => drawArm(arms.front, true));
  g.save(); g.translate(0, hipY); g.rotate(leanU); g.translate(0, -hipY);
  // ----- cabeça
  const hx = 0.35, hy = headY, rx = P.hrx, ry = P.hry;
  // v20: cabelo castanho bagunçado escapando por baixo do capacete, na nuca e atrás da orelha (balança com a mola do cabelo)
  g.beginPath();
  g.moveTo(hx - rx * 0.55, hy - ry * 0.05);
  g.bezierCurveTo(hx - rx * 1.25, hy - ry * 0.1, hx - rx * 1.32 + S.hairDX * 0.5, hy + ry * 0.55 + S.hairDY * 0.3, hx - rx * 1.18 + S.hairDX * 0.7, hy + ry * 0.92 + S.hairDY * 0.4);
  g.lineTo(hx - rx * 1.0 + S.hairDX * 0.4, hy + ry * 0.7); g.lineTo(hx - rx * 0.92 + S.hairDX * 0.5, hy + ry * 0.98);
  g.quadraticCurveTo(hx - rx * 0.62, hy + ry * 0.62, hx - rx * 0.5, hy + ry * 0.3); g.closePath();
  fillStroke(g, vgrad(g, hy - ry * 0.1, hy + ry, [[0, HP.hairTop], [1, HP.hair]]), 0.55);
  ell(g, hx - rx * 0.8, hy + 0.7, 0.95, 1.25); fillStroke(g, SKIN_D, 0.45);
  ell(g, hx, hy, rx, ry);
  const sk = g.createRadialGradient(hx + rx * 0.3, hy - ry * 0.4, 0.4, hx, hy, rx * 1.15); sk.addColorStop(0, '#ffe0c2'); sk.addColorStop(0.6, SKIN); sk.addColorStop(1, SKIN_D);
  fillStroke(g, sk, 0.75);
  const emo = S.dead ? 'dead' : (S.emo || (S.hurt ? 'hurt' : (S.victory || S.strum) ? 'happy' : 'neutral'));   // v9: expressão
  g.fillStyle = `rgba(255,120,120,${emo === 'happy' || emo === 'rock' || emo === 'thrill' ? 0.55 : 0.3})`; ell(g, hx + rx * 0.62, hy + ry * 0.36, 1.1, 0.55); g.fill();
  // v20: capacete preto fosco com a coroa; a franja castanha escapa por baixo da aba, na testa
  drawHelmet(g, hx, hy, rx, ry, S, P);
  g.beginPath(); g.moveTo(hx - rx * 0.35, hy - ry * 0.4);
  for (const [fx, fy] of [[-0.12, 0.08], [0.06, -0.3], [0.26, 0.02], [0.44, -0.3], [0.62, -0.02], [0.8, -0.32], [0.96, -0.12]]) g.lineTo(hx + rx * fx + S.hairDX * 0.25, hy + ry * fy + Math.max(0, S.hairDY) * 0.15);
  g.lineTo(hx + rx * 0.98, hy - ry * 0.52); g.quadraticCurveTo(hx + rx * 0.3, hy - ry * 0.74, hx - rx * 0.35, hy - ry * 0.4); g.closePath();
  fillStroke(g, vgrad(g, hy - ry * 0.7, hy, [[0, HP.hairTop], [1, HP.hair]]), 0.5);
  g.strokeStyle = HP.hairHi; g.lineWidth = 0.22; g.beginPath(); g.moveTo(hx + rx * 0.1, hy - ry * 0.5); g.lineTo(hx + rx * 0.2, hy - ry * 0.2); g.moveTo(hx + rx * 0.5, hy - ry * 0.52); g.lineTo(hx + rx * 0.56, hy - ry * 0.22); g.stroke();
  // v9: rosto mais expressivo — olhos maiores com íris castanha e brilho, pálpebras que mudam o olhar, sobrancelhas que reagem,
  // e boca que vai do sorriso de canto ao grito com língua de fora (v20: olhos grandes escuros de desenho, sem óculos)
  const ey = hy + 0.32, e1 = hx, e2 = hx + rx * 0.62;
  const joy = emo === 'happy' && S.joy;
  const BROW = { neutral: [0, -0.1, 0.25], cool: [0.12, -0.3, 0.18], happy: [-0.35, -0.45, 0.55], thrill: [-0.75, -0.85, 0.6], focus: [0.6, -0.25, -0.05], rock: [0.45, -0.3, 0.15], hurt: [-0.65, 0.2, 0.05], dead: [0, 0, 0] }[emo] || [0, -0.1, 0.25];
  const bry = ey - 2.2, [bi, bo, ba] = BROW;
  g.strokeStyle = HP.hair; g.lineWidth = 0.84; g.lineCap = 'round'; g.beginPath();
  g.moveTo(e1 - 1.3, bry + bo); g.quadraticCurveTo(e1 - 0.1, bry - ba + (bo + bi) / 2 - 0.15, e1 + 0.95, bry + bi);
  g.moveTo(e2 - 1.0, bry + bi); g.quadraticCurveTo(e2 + 0.15, bry - ba + (bo + bi) / 2 - 0.15 - (emo === 'cool' ? 0.25 : 0), e2 + 1.4, bry + bo - 0.1);
  g.stroke();
  const lid = { cool: 0.42, focus: 0.32, rock: 0.22, neutral: 0.1, happy: 0.04, thrill: 0, hurt: 0.04 }[emo] ?? 0.1;
  const lookX = 0.3 - 0.62 * (S.lookCam || 0), lookY = emo === 'thrill' ? -0.18 : emo === 'hurt' ? 0.1 : 0;
  [e1, e2].forEach((ex, k) => {
    const sc = k ? 1 : 0.88;
    if (S.dead) { g.strokeStyle = OUT; g.lineWidth = 0.42; g.beginPath(); g.moveTo(ex - 0.65, ey - 0.65); g.lineTo(ex + 0.65, ey + 0.65); g.moveTo(ex + 0.65, ey - 0.65); g.lineTo(ex - 0.65, ey + 0.65); g.stroke(); return; }
    if (S.blink || joy || (S.wink && k === 1)) {   // olho fechado: arco feliz (^) ou pálpebra baixa
      g.strokeStyle = OUT; g.lineWidth = 0.44; g.beginPath();
      if (joy || S.wink) { g.moveTo(ex - 0.95 * sc, ey + 0.4); g.quadraticCurveTo(ex, ey - 0.8, ex + 0.95 * sc, ey + 0.4); }
      else { g.moveTo(ex - 0.95 * sc, ey + 0.1); g.quadraticCurveTo(ex, ey + 0.5, ex + 0.95 * sc, ey + 0.1); }
      g.stroke(); return;
    }
    const rxE = 1.08 * sc, ryE = 1.6 * sc, ix = ex + lookX * 0.4 * sc, iy = ey + 0.1 + lookY;
    ell(g, ex, ey, rxE, ryE); g.fillStyle = '#fbf6ef'; g.fill();
    g.save(); ell(g, ex, ey, rxE, ryE); g.clip();
    ell(g, ix + 0.08, iy, 0.98 * sc, 1.48 * sc); g.fillStyle = vgrad(g, iy - 1.4, iy + 1.4, [[0, '#0f0907'], [1, '#3a2416']]); g.fill();   // olho escuro grande
    g.fillStyle = '#fff'; ell(g, ix + 0.3 * sc, iy - 0.5 * sc, 0.36 * sc, 0.42 * sc); g.fill(); ell(g, ix - 0.2 * sc, iy + 0.45 * sc, 0.15 * sc, 0.15 * sc); g.fill();
    if (lid > 0) { const ly = ey - ryE + ryE * 2 * lid; g.fillStyle = SKIN_D; g.fillRect(ex - rxE, ey - ryE - 0.1, rxE * 2, ly - (ey - ryE) + 0.1); g.strokeStyle = OUT; g.lineWidth = 0.36; g.beginPath(); g.moveTo(ex - rxE, ly); g.lineTo(ex + rxE, ly); g.stroke(); }
    g.restore();
    g.strokeStyle = OUT; g.lineWidth = 0.3; g.beginPath(); g.ellipse(ex, ey, rxE, ryE, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  });
  g.fillStyle = SKIN_D; ell(g, hx + rx * 0.98, hy + 1.0, 0.3, 0.42); g.fill();   // narizinho
  // boca
  const mx = hx + rx * 0.5, my = hy + ry * 0.68;
  const mm = S.dead ? 'o' : (S.mouth > 0.3 && emo !== 'focus') ? (emo === 'rock' ? 'tongue' : 'open') : ({ happy: 'smile', thrill: 'open', focus: 'grin', rock: 'tongue', hurt: 'o' }[emo] || 'smirk');
  if (mm === 'open' || mm === 'tongue') {   // aberta (cantando, gritando "uhuu") — no rock, com a língua de fora
    const oy = Math.max(0.55, S.mouth || 0.8);
    ell(g, mx, my + 0.15, 1.15, 0.28 + 0.78 * oy); g.fillStyle = '#4a1022'; g.fill(); g.strokeStyle = '#2a0f18'; g.lineWidth = 0.32; g.stroke();
    g.fillStyle = '#f4efe6'; rr(g, mx - 0.68, my + 0.15 - (0.28 + 0.78 * oy) + 0.12, 1.36, 0.38, 0.14); g.fill();
    if (mm === 'tongue') { rr(g, mx - 0.48, my + 0.2, 0.96, 2.0, 0.48); fillStroke(g, '#ff6f8a', 0.3, '#2a0f18'); g.strokeStyle = 'rgba(160,30,60,0.6)'; g.lineWidth = 0.14; g.beginPath(); g.moveTo(mx, my + 0.6); g.lineTo(mx, my + 1.7); g.stroke(); }
    else { g.fillStyle = '#ff6f8a'; ell(g, mx, my + 0.15 + 0.44 * oy, 0.56, 0.26); g.fill(); }
  } else if (mm === 'smile') {   // sorrisão com os dentes de cima
    g.beginPath(); g.moveTo(mx - 1.2, my - 0.25); g.quadraticCurveTo(mx, my + 1.45, mx + 1.25, my - 0.4); g.quadraticCurveTo(mx, my + 0.12, mx - 1.2, my - 0.25); g.closePath();
    g.fillStyle = '#4a1022'; g.fill(); g.save(); g.clip(); g.fillStyle = '#f4efe6'; g.fillRect(mx - 1.3, my - 0.5, 2.6, 0.78); g.fillStyle = '#ff6f8a'; ell(g, mx + 0.05, my + 0.95, 0.6, 0.32); g.fill(); g.restore();
    g.strokeStyle = '#2a0f18'; g.lineWidth = 0.34; g.stroke();
  } else if (mm === 'grin') {   // dentes cerrados (esforço com atitude: powerslide, corrimão, chefe)
    rr(g, mx - 1.15, my - 0.4, 2.3, 1.0, 0.42); g.fillStyle = '#f4efe6'; g.fill(); g.strokeStyle = '#2a0f18'; g.lineWidth = 0.34; g.stroke();
    g.lineWidth = 0.14; g.beginPath(); g.moveTo(mx - 1.0, my + 0.1); g.lineTo(mx + 1.0, my + 0.1); for (const tx of [-0.5, 0, 0.5]) { g.moveTo(mx + tx, my - 0.35); g.lineTo(mx + tx, my + 0.55); } g.stroke();
  } else if (mm === 'o') {   // susto
    ell(g, mx + 0.1, my + 0.2, 0.48, 0.6); g.fillStyle = '#4a1022'; g.fill(); g.strokeStyle = '#2a0f18'; g.lineWidth = 0.3; g.stroke();
  } else {   // sorriso de canto confiante, com o lábio de baixo aparecendo na barba
    ell(g, mx + 0.1, my + 0.24, 1.18, 0.5); g.fillStyle = '#c9776a'; g.fill();
    g.strokeStyle = '#2a0f18'; g.lineWidth = 0.44; g.lineCap = 'round'; g.beginPath(); g.moveTo(mx - 1.05, my - 0.05); g.quadraticCurveTo(mx, my + 0.62, mx + 1.2, my - 0.5); g.stroke();
    g.lineWidth = 0.22; g.beginPath(); g.moveTo(mx + 1.2, my - 0.5); g.lineTo(mx + 1.42, my - 0.36); g.stroke();
  }
  // ----- violão na frente (tocando) ou acima da cabeça (vitória)
  if (S.strum || S.victory) drawGuitar(g, 1.2, hipY - 1.3, 1.2 + Math.sin(S.strumT * 1.6) * 0.04, P.gscale, S.victory ? 1 : S.strumGlow);
  if (!armFirst) drawArm(arms.front, true);
  g.restore();
  g.restore();
}
