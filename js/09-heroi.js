'use strict';
// =================================================================== o herói (rig vetorial procedural)
// Gabriel Rock — formas: 0 baixinho, 1 varapau (pepino), 2 marombado (batata-doce)
// v4: escala ~10% maior que a hitbox (além do zoom da câmera); v5: mais 10%. Num teto baixo (túnel) ele se agacha
const FORMP = [
  { leg: 3.4, legW: 2.6, hipW: 4.8, torso: 5.7, shW: 7.6, belly: 9.8, hrx: 5.1, hry: 4.5, neck: 0.0, arm: 4.2, armW: 2.3, boot: 1.0, scale: 1.045, gscale: 0.8 },
  { leg: 9.2, legW: 2.0, hipW: 3.8, torso: 8.8, shW: 6.0, belly: 6.2, hrx: 4.8, hry: 4.3, neck: 1.6, arm: 7.2, armW: 1.8, boot: 0.95, scale: 1.09, gscale: 0.85 },
  { leg: 4.2, legW: 3.5, hipW: 6.8, torso: 7.2, shW: 12.8, belly: 11.2, hrx: 5.1, hry: 4.5, neck: 0.4, arm: 5.4, armW: 3.7, boot: 1.15, scale: 1.19, gscale: 0.85 },
];
const heroVisH = P => (3.6 * P.boot + P.leg - 0.9 + P.torso + P.neck + P.hry * 1.85) * P.scale;   // altura visual (até o topo do cabelo), de patins
const SKIN = '#f3c29b', SKIN_D = '#d9946c';
// paleta do Gabriel Rock (v5: cores que destacam do cenário roxo/azul, das vitrines laranja e do mundo cinza)
const HP = {
  hair: '#2a1d1c', hairTop: '#4d3732', beard: '#5a3a2c', beardTop: '#7c5541', beardBot: '#35211a', beardHi: 'rgba(240,200,160,0.38)',
  jackTop: '#d2ff73', jack: '#8fe02a', jackBot: '#4f9a12', jackBuffTop: '#c4f560', jackL: '#f2ffd2',
  shirt: '#f6f2ea', shirtBot: '#cfc8bd', print: '#ff6a10', trim: '#ff7a1a', cuff: '#1c1b23',
  pants: '#55679b', boot: '#1a1920', sole: '#4a4552', lace: '#ff9a3c',
  mohawk: '#ff7a1a', mohawk2: '#ffb347', patchA: '#1c1b23', patchANote: '#b6ff3b', patchB: '#ff7a1a',
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

// --- patins inline agressivo (v7): bota preta com cano laranja, placa de grind verde-limão, chassi e 4 rodinhas
// origem no chão, debaixo do meio do chassi; bico para +x
function drawSkate(g, s, wr) {
  for (const wx of [-2.0, -0.68, 0.68, 2.0]) {
    const x = wx * s, y = -0.62 * s, r = 0.62 * s;
    ell(g, x, y, r, r); fillStroke(g, '#efe6cc', 0.4);
    ell(g, x, y, r * 0.48, r * 0.48); g.fillStyle = HP.trim; g.fill();
    g.strokeStyle = 'rgba(60,30,10,0.55)'; g.lineWidth = 0.16 * s; g.beginPath(); g.moveTo(x + Math.cos(wr) * r * 0.46, y + Math.sin(wr) * r * 0.46); g.lineTo(x - Math.cos(wr) * r * 0.46, y - Math.sin(wr) * r * 0.46); g.stroke();
  }
  rr(g, -2.6 * s, -1.6 * s, 5.2 * s, 0.78 * s, 0.32 * s); fillStroke(g, '#2b2a33', 0.45);
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-2.4 * s, -1.52 * s, 4.8 * s, 0.18 * s);
  // bota: calcanhar atrás, bico arredondado, cano subindo até o tornozelo
  g.beginPath();
  g.moveTo(-2.15 * s, -1.55 * s); g.lineTo(2.2 * s, -1.55 * s);
  g.quadraticCurveTo(2.85 * s, -1.6 * s, 2.7 * s, -2.35 * s); g.quadraticCurveTo(2.45 * s, -3.0 * s, 1.0 * s, -3.15 * s);
  g.lineTo(0.95 * s, -4.05 * s); g.lineTo(-1.95 * s, -4.05 * s); g.quadraticCurveTo(-2.35 * s, -2.8 * s, -2.15 * s, -1.55 * s); g.closePath();
  fillStroke(g, vgrad(g, -4.1 * s, -1.5 * s, [[0, '#34323d'], [1, HP.boot]]), 0.55);
  g.fillStyle = 'rgba(255,255,255,0.2)'; ell(g, 1.75 * s, -2.55 * s, 0.75 * s, 0.32 * s, -0.25); g.fill();
  rr(g, -0.85 * s, -2.15 * s, 1.9 * s, 0.62 * s, 0.25 * s); fillStroke(g, HP.jack, 0.35);           // placa de grind (soul plate)
  g.strokeStyle = HP.jack; g.lineWidth = 0.42 * s; g.beginPath(); g.moveTo(0.05 * s, -3.1 * s); g.lineTo(1.25 * s, -2.55 * s); g.stroke();   // tira no peito do pé
  rr(g, -2.05 * s, -4.55 * s, 3.15 * s, 1.15 * s, 0.4 * s); fillStroke(g, HP.trim, 0.45);            // cano (cuff)
  rr(g, 0.25 * s, -4.3 * s, 0.75 * s, 0.6 * s, 0.15 * s); g.fillStyle = '#d7dbe2'; g.fill();          // fivela
}
// --- capacete de skatista (v8): casco redondo preto brilhante, respiros, adesivos, friso e jugular.
// Os espinhos laranja do moicano ficam presos no topo do casco e balançam com a mola do cabelo.
const HELM = { top: '#5a5766', mid: '#2b2934', bot: '#111016', rim: '#4b4857', strap: '#2e2d37', vent: '#09080c' };
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
  // espinhos do moicano (atrás do casco: a base some dentro dele)
  const SP = [[0.15, 2.5, 1.0], [0.27, 3.25, 1.12], [0.4, 3.75, 1.18], [0.53, 3.35, 1.12], [0.66, 2.65, 1.0]];
  SP.forEach(([t, L, w], i) => {
    const [px, py] = bez(t), [tx, ty] = dbez(t), tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
    let nx = -uy, ny = ux; if (ny > 0) { nx = -nx; ny = -ny; }          // normal para fora (para cima)
    const dx = nx - 0.32, dy = ny, dl = Math.hypot(dx, dy), k = 1 + (i === 2 ? 0.05 : 0);
    const tipX = px + dx / dl * L * k + S.hairDX * 0.45, tipY = py + dy / dl * L * k + S.hairDY * 0.45;
    g.beginPath(); g.moveTo(px - ux * w + nx * -0.6, py - uy * w + ny * -0.6); g.quadraticCurveTo(px - ux * w * 0.3 + (tipX - px) * 0.5, py - uy * w * 0.3 + (tipY - py) * 0.5, tipX, tipY);
    g.quadraticCurveTo(px + ux * w * 0.3 + (tipX - px) * 0.45, py + uy * w * 0.3 + (tipY - py) * 0.45, px + ux * w + nx * -0.6, py + uy * w + ny * -0.6); g.closePath();
    fillStroke(g, i % 2 ? HP.mohawk2 : HP.mohawk, 0.5);
    g.strokeStyle = 'rgba(255,240,200,0.55)'; g.lineWidth = 0.18; g.beginPath(); g.moveTo(px + (tipX - px) * 0.2, py + (tipY - py) * 0.2); g.lineTo(px + (tipX - px) * 0.75 - ux * 0.12, py + (tipY - py) * 0.75 - uy * 0.12); g.stroke();
  });
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
  // adesivos: verde-limão com nota, estrela laranja e uma rodinha
  g.save(); g.translate(hx - rx * 0.66, hy - ry * 0.42); g.rotate(0.38); rr(g, -0.95, -0.62, 1.9, 1.24, 0.22); fillStroke(g, HP.patchANote, 0.22); noteGlyph(g, 0.05, 0, 0.26, '#1c1b23'); g.restore();
  star(g, hx + rx * 0.6, hy - ry * 0.62, 0.62, '#ff7a1a');
  ell(g, hx + rx * 0.04, hy - ry * 0.54, 0.55, 0.55); fillStroke(g, '#efe6cc', 0.2); ell(g, hx + rx * 0.04, hy - ry * 0.54, 0.24, 0.24); g.fillStyle = HP.trim; g.fill();
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
  const drawLeg = L => {
    limb(g, [L.hx, hipY, L.kx, L.ky, L.ax, L.ay], P.legW, HP.pants);
    ell(g, L.kx + P.legW * 0.32, L.ky, P.legW * 0.62, P.legW * 0.56); fillStroke(g, '#1c1b23', 0.4);   // joelheira
    g.fillStyle = HP.trim; ell(g, L.kx + P.legW * 0.5, L.ky, P.legW * 0.3, P.legW * 0.34); g.fill();
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
  const drawArm = (A, front) => {
    const col = P.buff ? SKIN : HP.jack;
    limb(g, [A.sx, A.sy, A.ex, A.ey, A.hx, A.hy], P.armW, col);
    if (front && !P.buff) {   // v9: remendo de raio no ombro da manga (estilo)
      const mx = lerp(A.sx, A.ex, 0.5), my = lerp(A.sy, A.ey, 0.5);
      g.save(); g.translate(mx, my); g.rotate(Math.atan2(A.ey - A.sy, A.ex - A.sx)); rr(g, -0.95, -0.82, 1.9, 1.64, 0.45); fillStroke(g, '#1c1b23', 0.3);
      g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(-0.55, -0.45); g.lineTo(0.15, -0.15); g.lineTo(-0.05, 0.05); g.lineTo(0.6, 0.45); g.lineTo(-0.15, 0.12); g.lineTo(0.02, -0.05); g.closePath(); g.fill(); g.restore();
    }
    if (P.buff) { ell(g, (A.sx + A.ex) / 2, (A.sy + A.ey) / 2 - 0.3, P.armW * 0.62, P.armW * 0.5, Math.atan2(A.ey - A.sy, A.ex - A.sx)); fillStroke(g, SKIN, 0.5); g.fillStyle = 'rgba(255,255,255,0.25)'; ell(g, (A.sx + A.ex) / 2 - 0.3, (A.sy + A.ey) / 2 - 0.9, 0.8, 0.4); g.fill(); }
    else {
      const ux = A.ex - A.sx, uy = A.ey - A.sy, ul = Math.hypot(ux, uy) || 1;
      g.strokeStyle = HP.jackL; g.lineWidth = 0.45; g.lineCap = 'round'; g.beginPath(); g.moveTo(A.sx + ux * 0.2 - uy / ul * 0.5, A.sy + uy * 0.2 + ux / ul * 0.5); g.lineTo(A.ex - uy / ul * 0.5, A.ey + ux / ul * 0.5); g.stroke();
    }
    // munhequeira de patins (protetor de punho)
    const fx = A.hx - A.ex, fy = A.hy - A.ey, fl = Math.hypot(fx, fy) || 1, cx_ = lerp(A.ex, A.hx, 0.7), cy_ = lerp(A.ey, A.hy, 0.7);
    g.save(); g.translate(cx_, cy_); g.rotate(Math.atan2(fy, fx)); rr(g, -0.7, -P.armW * 0.62, 1.4, P.armW * 1.24, 0.35); fillStroke(g, '#1c1b23', 0.35); g.fillStyle = HP.trim; g.fillRect(-0.18, -P.armW * 0.58, 0.36, P.armW * 1.16); g.restore();
    const hr = 1.12 * (P.buff ? 1.12 : 1);
    if (A.gest) {   // v9: chifrinho do rock (indicador e mindinho para cima) ou joinha (polegar)
      const fs = A.gest === 'rock' ? [[-0.5, -0.24], [0.5, 0.22]] : [[0.1, -0.12]];
      for (const [fx, rot] of fs) { g.save(); g.translate(A.hx + fx, A.hy - hr * 0.35); g.rotate(rot); rr(g, -0.3, -1.8, 0.6, 2.05, 0.3); fillStroke(g, SKIN, 0.42); g.restore(); }
    }
    ell(g, A.hx, A.hy, hr, hr); fillStroke(g, SKIN, 0.55);
    g.fillStyle = 'rgba(255,255,255,0.35)'; ell(g, A.hx - hr * 0.3, A.hy - hr * 0.35, hr * 0.35, hr * 0.25); g.fill();
  };
  // ----- violão nas costas
  if (!S.strum && !S.victory) upper(() => drawGuitar(g, -P.shW * 0.42, shY + P.torso * 0.55, -0.55 - S.lean * 0.6 + S.gsw * 0.05, P.gscale, 0));
  upper(() => drawArm(arms.back));
  if (S.victory) upper(() => { const A = arms.back; for (const dx of [-0.55, 0.6]) { g.lineCap = 'round'; g.strokeStyle = OUT; g.lineWidth = 1.0; g.beginPath(); g.moveTo(A.hx + dx * 0.6, A.hy - 0.5); g.lineTo(A.hx + dx, A.hy - 2.4); g.stroke(); g.strokeStyle = SKIN; g.lineWidth = 0.55; g.stroke(); } });
  drawLeg(legs.back);
  g.save(); g.translate(0, hipY); g.rotate(leanU); g.translate(0, -hipY);
  // ----- tronco
  const tw = P.shW, bw = P.belly;
  g.beginPath();
  g.moveTo(-tw * 0.5, shY + 1);
  g.quadraticCurveTo(-bw * 0.64, (shY + hipY) / 2 + 0.6, -bw * 0.44, hipY + 0.2);
  g.lineTo(bw * 0.44, hipY + 0.2);
  g.quadraticCurveTo(bw * 0.64, (shY + hipY) / 2 + 0.6, tw * 0.5, shY + 1);
  g.quadraticCurveTo(0, shY - 1.3, -tw * 0.5, shY + 1); g.closePath();
  fillStroke(g, vgrad(g, shY, hipY, [[0, P.buff ? HP.jackBuffTop : HP.jackTop], [0.5, HP.jack], [1, HP.jackBot]]), 0.75);
  g.save(); g.clip();
  g.fillStyle = vgrad(g, shY, hipY, [[0, HP.shirt], [1, HP.shirtBot]]);
  g.beginPath(); g.moveTo(-tw * 0.15 - (P.buff ? 1.5 : 0), shY - 1); g.lineTo(tw * 0.15 + (P.buff ? 1.5 : 0), shY - 1); g.lineTo(bw * 0.2 + (P.buff ? 1.2 : 0), hipY + 1); g.lineTo(-bw * 0.2 - (P.buff ? 1.2 : 0), hipY + 1); g.closePath(); g.fill();
  g.strokeStyle = HP.print; g.lineWidth = 0.5; g.beginPath(); const cy = (shY + hipY) / 2; g.moveTo(0.4, cy - 1.5); g.lineTo(-0.4, cy); g.lineTo(0.5, cy); g.lineTo(-0.3, cy + 1.5); g.stroke();
  g.strokeStyle = HP.jackL; g.lineWidth = 0.4; g.beginPath(); g.moveTo(-tw * 0.15, shY); g.lineTo(-bw * 0.22, hipY); g.moveTo(tw * 0.15, shY); g.lineTo(bw * 0.22, hipY); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-bw, hipY - 1.3, bw * 2, 1.5);
  g.restore();
  g.strokeStyle = HP.trim; g.lineWidth = 0.45; g.beginPath(); g.moveTo(-tw * 0.44, shY + 1.0); g.quadraticCurveTo(-tw * 0.2, shY - 0.4, -tw * 0.12, shY + 0.6); g.moveTo(tw * 0.44, shY + 1.0); g.quadraticCurveTo(tw * 0.2, shY - 0.4, tw * 0.12, shY + 0.6); g.stroke();
  g.fillStyle = '#121117'; g.fillRect(-bw * 0.46, hipY - 1.0, bw * 0.92, 0.9); g.fillStyle = '#c9ced6'; rr(g, -0.7, hipY - 1.1, 1.4, 1.1, 0.25); g.fill();
  // v9: corrente da carteira
  g.strokeStyle = '#d7dbe2'; g.lineWidth = 0.24; g.setLineDash([0.36, 0.24]); g.beginPath(); g.moveTo(bw * 0.3, hipY - 0.55); g.quadraticCurveTo(bw * 0.08, hipY + 1.7, -bw * 0.24, hipY + 0.25); g.stroke(); g.setLineDash([]);
  // remendos, alfinetes, alça do violão e crachá riscado
  ell(g, tw * 0.26, shY + P.torso * 0.34, 1.15, 1.15); fillStroke(g, HP.patchA, 0.4); noteGlyph(g, tw * 0.27, shY + P.torso * 0.33, 0.33, HP.patchANote);
  g.save(); g.translate(-tw * 0.34, shY + P.torso * 0.6); g.rotate(0.22); rr(g, -0.9, -0.7, 1.8, 1.4, 0.25); fillStroke(g, HP.patchB, 0.35); g.restore();
  g.strokeStyle = '#d7dbe2'; g.lineWidth = 0.22; g.beginPath(); g.moveTo(tw * 0.18, shY + P.torso * 0.66); g.lineTo(tw * 0.36, shY + P.torso * 0.56); g.stroke(); ell(g, tw * 0.37, shY + P.torso * 0.555, 0.25, 0.25); g.stroke();
  if (!S.strum && !S.victory) { g.strokeStyle = '#121117'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-tw * 0.42, shY + 0.6); g.lineTo(bw * 0.38, hipY - 1.3); g.stroke(); }
  const bx = 0.5 + S.badge * 1.4, by = shY + P.torso * 0.62;
  g.strokeStyle = '#3a6bd8'; g.lineWidth = 0.28; g.beginPath(); g.moveTo(-0.9, shY + 0.3); g.quadraticCurveTo(bx - 0.6, by - 2, bx, by - 1.3); g.moveTo(0.9, shY + 0.3); g.quadraticCurveTo(bx + 0.4, by - 2, bx, by - 1.3); g.stroke();
  g.save(); g.translate(bx, by); g.rotate(S.badge * 0.4); rr(g, -1.05, -1.3, 2.1, 2.7, 0.3); fillStroke(g, '#f2f2f4', 0.35);
  g.fillStyle = '#3a6bd8'; g.fillRect(-1.05, -1.3, 2.1, 0.55); g.strokeStyle = '#e3343f'; g.lineWidth = 0.32; g.beginPath(); g.moveTo(-0.8, -0.4); g.lineTo(0.8, 1.1); g.moveTo(0.8, -0.4); g.lineTo(-0.8, 1.1); g.stroke(); g.restore();
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
  // v8: cabelo castanho escapando por baixo do capacete, na nuca (balança com a mola do cabelo)
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
  // barba do Gabriel Rock: costeleta -> faixa na mandíbula -> queixo cheio com pontinha (bochechas livres, sem bigode)
  g.beginPath();
  g.moveTo(hx - rx * 0.4, hy + ry * 0.02);
  g.quadraticCurveTo(hx - rx * 0.56, hy + ry * 0.42, hx - rx * 0.48, hy + ry * 0.82);
  g.bezierCurveTo(hx - rx * 0.36, hy + ry * 1.14, hx + rx * 0.02, hy + ry * 1.3, hx + rx * 0.3, hy + ry * 1.36);
  g.bezierCurveTo(hx + rx * 0.6, hy + ry * 1.26, hx + rx * 0.86, hy + ry * 1.04, hx + rx * 0.9, hy + ry * 0.74);
  g.quadraticCurveTo(hx + rx * 0.93, hy + ry * 0.62, hx + rx * 0.84, hy + ry * 0.62);
  g.quadraticCurveTo(hx + rx * 0.74, hy + ry * 0.88, hx + rx * 0.5, hy + ry * 0.9);
  g.quadraticCurveTo(hx + rx * 0.22, hy + ry * 0.9, hx + rx * 0.06, hy + ry * 0.78);
  g.quadraticCurveTo(hx - rx * 0.16, hy + ry * 0.6, hx - rx * 0.24, hy + ry * 0.3);
  g.quadraticCurveTo(hx - rx * 0.28, hy + ry * 0.12, hx - rx * 0.4, hy + ry * 0.02);
  g.closePath();
  fillStroke(g, vgrad(g, hy + ry * 0.2, hy + ry * 1.36, [[0, HP.beardTop], [0.5, HP.beard], [1, HP.beardBot]]), 0.55);
  g.save(); g.clip();
  g.strokeStyle = HP.beardHi; g.lineWidth = 0.2; g.lineCap = 'round'; g.beginPath();
  for (const [a, b, c, d] of [[-0.42, 0.3, -0.4, 0.62], [-0.3, 0.8, -0.16, 1.06], [0.06, 0.98, 0.14, 1.24], [0.36, 1.0, 0.4, 1.26], [0.64, 0.94, 0.7, 1.12]]) { g.moveTo(hx + rx * a, hy + ry * b); g.lineTo(hx + rx * c, hy + ry * d); }
  g.stroke();
  g.restore();
  // v8: capacete de skatista (casco preto brilhante cheio de adesivos) com o moicano laranja de espinhos em cima
  drawHelmet(g, hx, hy, rx, ry, S, P);
  // v9: rosto mais expressivo — olhos maiores com íris castanha e brilho, pálpebras que mudam o olhar, sobrancelhas que reagem,
  // óculos de armação grossa (ainda com a fita na ponte) e boca que vai do sorriso de canto ao grito com língua de fora
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
    const rxE = 1.16 * sc, ryE = 1.3 * sc, ix = ex + lookX * sc, iy = ey + 0.12 + lookY;
    ell(g, ex, ey, rxE, ryE); g.fillStyle = '#fff'; g.fill();
    g.save(); ell(g, ex, ey, rxE, ryE); g.clip();
    ell(g, ix, iy, 0.74 * sc, 0.82 * sc); g.fillStyle = '#7a4a28'; g.fill();
    ell(g, ix, iy + 0.12, 0.56 * sc, 0.62 * sc); g.fillStyle = '#3d2314'; g.fill();
    ell(g, ix, iy + 0.06, 0.34 * sc, 0.38 * sc); g.fillStyle = '#120a10'; g.fill();
    g.fillStyle = '#fff'; ell(g, ix + 0.26 * sc, iy - 0.3 * sc, 0.27 * sc, 0.27 * sc); g.fill(); ell(g, ix - 0.25 * sc, iy + 0.33 * sc, 0.12 * sc, 0.12 * sc); g.fill();
    if (lid > 0) { const ly = ey - ryE + ryE * 2 * lid; g.fillStyle = SKIN_D; g.fillRect(ex - rxE, ey - ryE - 0.1, rxE * 2, ly - (ey - ryE) + 0.1); g.strokeStyle = OUT; g.lineWidth = 0.36; g.beginPath(); g.moveTo(ex - rxE, ly); g.lineTo(ex + rxE, ly); g.stroke(); }
    g.restore();
    g.strokeStyle = OUT; g.lineWidth = 0.3; g.beginPath(); g.ellipse(ex, ey, rxE, ryE, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  });
  // óculos de armação grossa em cima (estilo "browline"), lentes maiores, haste até a orelha e a fita na ponte
  for (const [ex, k] of [[e1, 0], [e2, 1]]) {
    const sc = k ? 1 : 0.88, lw = 3.25 * sc, lh = 2.85 * sc;
    rr(g, ex - lw / 2, ey - lh / 2 - 0.05, lw, lh, 0.85 * sc); g.fillStyle = 'rgba(207,230,255,0.18)'; g.fill(); g.strokeStyle = '#141218'; g.lineWidth = 0.4; g.stroke();
    g.strokeStyle = '#141218'; g.lineWidth = 0.95; g.beginPath(); g.moveTo(ex - lw / 2 + 0.15, ey - lh / 2 + 0.25); g.quadraticCurveTo(ex, ey - lh / 2 - 0.12, ex + lw / 2 - 0.15, ey - lh / 2 + 0.25); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.22; g.beginPath(); g.moveTo(ex - lw * 0.32, ey + lh * 0.26); g.lineTo(ex - lw * 0.06, ey - lh * 0.2); g.stroke();
  }
  g.strokeStyle = '#141218'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(e1 - 1.4, ey - 0.7); g.lineTo(hx - rx * 0.8, ey + 0.1); g.stroke();
  g.save(); g.translate((e1 + e2) / 2 + 0.1, ey - 0.45); g.rotate(0.35); g.fillStyle = '#f4f2ea'; g.fillRect(-0.55, -0.7, 1.1, 1.4); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.12; g.strokeRect(-0.55, -0.7, 1.1, 1.4); g.beginPath(); g.moveTo(-0.55, -0.2); g.lineTo(0.55, -0.2); g.moveTo(-0.55, 0.25); g.lineTo(0.55, 0.25); g.stroke(); g.restore();
  g.fillStyle = SKIN_D; ell(g, hx + rx * 0.97, hy + 1.1, 0.55, 0.75); g.fill();
  // boca no meio da barba
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
