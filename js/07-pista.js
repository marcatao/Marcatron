'use strict';
// =================================================================== pista de patins (v7): rampas, pista em U e corrimãos
// Rampas são superfícies y(x) por cima do chão de blocos. O herói gruda nelas e anda com a velocidade ao longo da
// superfície: a gravidade puxa ladeira abaixo e segurar para a frente "bombeia" (perde menos embalo subindo).
// A ponta alta da rampinha (kicker) e do quarter-pipe é uma borda que lança no ar; pular na rampa dá o voo grande.
// Corrimãos são segmentos onde ele desliza (grind) soltando faísca.
const RAMP_G = 0.15;            // gravidade ao longo da superfície (unidades/quadro²)
let ramps = [], rails = [], PIPE = null;   // PIPE: a pista em U (par de quarter-pipes frente a frente)
// kind: 'kick' (rampinha de salto com curva), 'qp' (quarter-pipe: quarto de círculo até quase vertical), 'slope' (ladeira reta)
// dir: +1 = sobe para a direita; -1 = sobe para a esquerda. Colunas de bloco (podem ser frações).
function makeRamp(kind, c0, c1, o = {}) {
  const x0 = c0 * TS, x1 = c1 * TS, L = x1 - x0, base = o.base ?? GROUND_Y, dir = o.dir ?? 1;
  const h = kind === 'qp' ? L : (o.h ?? 16);
  const r = { kind, x0, x1, L, base, dir, h, top: base - h, lipX: dir > 0 ? x1 : x0, lowX: dir > 0 ? x0 : x1, deck: o.deck || null, seed: ramps.length };
  ramps.push(r); return r;
}
function rampU(r, x) { return clamp(r.dir > 0 ? x - r.x0 : r.x1 - x, 0, r.L); }   // distância a partir da ponta baixa
function rampY(r, x) {
  const u = rampU(r, x);
  if (r.kind === 'qp') { const R = r.L; return r.base - (R - Math.sqrt(Math.max(0, R * R - u * u))); }
  if (r.kind === 'kick') { const t = u / r.L; return r.base - r.h * t * t; }
  return r.base - r.h * u / r.L;
}
function rampSlope(r, x) {    // dy/dx
  const u = rampU(r, x); let d;
  if (r.kind === 'qp') { const R = r.L, uu = Math.min(u, R - 0.3); d = -uu / Math.sqrt(R * R - uu * uu); }
  else if (r.kind === 'kick') d = -2 * r.h * u / (r.L * r.L);
  else d = -r.h / r.L;
  return r.dir > 0 ? d : -d;
}
function rampAt(x) { for (const r of ramps) if (x >= r.x0 && x <= r.x1) return r; return null; }
// ponto dentro do corpo de alguma rampa (abaixo da superfície)?
function rampSolidAt(x, y) { for (const r of ramps) if (x > r.x0 && x < r.x1 && y > rampY(r, x) + 1 && y < r.base) return true; return false; }
// inimigos e itens tratam o corpo da rampa como parede (dão meia-volta)
function rampBlock(b) {
  for (const r of ramps) {
    if (b.x + b.w <= r.x0 || b.x >= r.x1 || b.y >= r.base) continue;
    const cx = clamp(b.x + b.w / 2, r.x0, r.x1);
    if (b.y + b.h - rampY(r, cx) > 3) { b.x = (b.x + b.w / 2 < (r.x0 + r.x1) / 2) ? r.x0 - b.w - 0.01 : r.x1 + 0.01; return true; }
  }
  return false;
}
// corrimão: segmento (x0,y0)-(x1,y1) com x0 < x1; y é a altura em que os patins deslizam
function makeRail(x0, y0, x1, y1, o = {}) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  const r = { x0, y0, x1, y1, tx: dx / len, ty: dy / len, m: dy / dx, len, posts: o.posts ?? true, glow: 0 };
  rails.push(r); return r;
}
const railY = (r, x) => r.y0 + (x - r.x0) * r.m;
// corrimão que continua a partir de uma ponta (corrimão do topo da escada emendado no da descida)
function railNext(r, dir) {
  if (dir > 0 && r.next) return r.next;   // v11: emenda marcada (o corrimão que entra no loop)
  for (const o of rails) if (o !== r) {
    if (dir > 0 && Math.abs(o.x0 - r.x1) < 3 && Math.abs(o.y0 - r.y1) < 3) return o;
    if (dir < 0 && Math.abs(o.x1 - r.x0) < 3 && Math.abs(o.y1 - r.y0) < 3) return o;
  }
  return null;
}
// acha a pista em U: um quarter-pipe que sobe para a esquerda seguido de um que sobe para a direita
function findPipe() {
  PIPE = null;
  for (const a of ramps) if (a.kind === 'qp' && a.dir < 0) for (const b of ramps) if (b.kind === 'qp' && b.dir > 0 && b.x0 >= a.x1 && b.x0 - a.x1 < 120) PIPE = { x0: a.x0, x1: b.x1, top: Math.min(a.top, b.top) };
}
