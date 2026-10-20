'use strict';
// =================================================================== ladeira da Igreja Matriz (v11)
// Antes do chefe, a rua desce em direção à Igreja Matriz da Marechal. No topo o Merlin reaparece e avisa: "aperta os patins".
// A descida é uma ilusão: o chão continua reto, mas a câmera inclina, o fundo sobe, o vento passa e o herói ganha embalo sozinho.
// Subindo a ladeira vêm carros, motos, bicicletas e velhinhas: é pular por cima (no teto do carro dá para quicar).
// No meio, um corrimão que faz um loop completo; no fim, um ponto de ônibus com patinadores sentados filmando com o celular.
let traffic = [], loops = [], ladM = null;
const LT = { piano: 1.0, merlin: 5.5, tilt0: 9, tilt1: 14, tilt2: 86, tilt3: 93, stop: 87.5, loopC: 50, loopR: 34 };
const LAD_X = c => (LAD.c0 + c) * TS;
const TRAFFIC_DIM = { car: { w: 44, h: 20, vx: -1.1 }, moto: { w: 26, h: 19, vx: -1.5 }, bike: { w: 22, h: 20, vx: -0.7 }, vovo: { w: 11, h: 17, vx: -0.3 } };
const CAR_COLS = ['#e63946', '#2a9d8f', '#f4a261', '#3a86ff', '#ffbe0b', '#8338ec'];
function makeLadeira(coin) {
  traffic = []; loops = [];
  pianos.push({ c: LAD.c0 + LT.piano, x: LAD_X(LT.piano), on: false, t: 0, reach: SH_LAD.n });   // checkpoint no topo; a cor vai até o fim da descida
  signs.push({ c: LAD.c0 + 7.6, lines: ['LADEIRA DA MATRIZ', 'PULE O TRÂNSITO!'] });
  ladM = { x: LAD_X(LT.merlin), y: GROUND_Y, face: -1, t: 0, talkT: 0, talk: 0, blink: 0, blinkT: 90, hairDX: 0, talked: false, waveT: 0 };
  const plan = [['vovo', 18], ['car', 33], ['bike', 64], ['moto', 78], ['vovo', 90]];   // espaçados: dá para pousar entre um e outro
  plan.forEach(([kind, c], i) => {
    const d = TRAFFIC_DIM[kind], x = LAD_X(c);
    traffic.push({ kind, x, x0: x, y: GROUND_Y - d.h, w: d.w, h: d.h, vx: d.vx, on: false, gone: false, cleared: false, t: hash(i * 17) * 9, col: CAR_COLS[i % CAR_COLS.length], seed: i, oops: 0 });
    for (let k = 0; k < 3; k++) coin(c + 0.4 + (k - 1) * 1.1 - 2.2, k === 1 ? 7.2 : 8.0);   // as rodinhas mostram o arco do pulo
  });
  // corrimão com loop: entra pela esquerda, dá a volta completa e sai pela direita
  const cx = LAD_X(LT.loopC), y = 176, R = LT.loopR;
  // a entrada nasce rente ao chão e sobe: quem vem rolando já engata o grind (dá para fugir pulando)
  makeRail(LAD_X(LT.loopC - 10), 191, LAD_X(LT.loopC - 6), y);
  const entry = makeRail(LAD_X(LT.loopC - 6), y, cx, y), exit = makeRail(cx, y, LAD_X(LT.loopC + 5), y);
  const L = { isLoop: true, cx, cy: y - R, R, entry, exit, glow: 0 };
  entry.next = L; loops.push(L);
  for (let k = 0; k < 10; k++) { const a = Math.PI * 0.35 + k * Math.PI * 0.14, c = (cx + Math.sin(a) * (R - 9)) / TS - 0.5, r = (y - R + Math.cos(a) * (R - 9)) / TS - 0.5; coin(c, r); }
}
function slopeK(x) {
  const a = LAD_X(LT.tilt0), b = LAD_X(LT.tilt1), c = LAD_X(LT.tilt2), d = LAD_X(LT.tilt3);
  return x < a || x > d ? 0 : x < b ? smooth(a, b, x) : x > c ? 1 - smooth(c, d, x) : 1;
}
function resetLadeira() {   // renasceu: o trânsito que ainda está à frente volta para o lugar
  for (const t of traffic) if (t.x0 > cp.x - 10) { t.x = t.x0; t.on = false; t.gone = false; t.cleared = false; t.oops = 0; }
}
// ---------- loop do corrimão (o herói segue o círculo; a gravidade freia na subida e devolve na descida)
function enterLoop(h, L, over) {
  h.rail = null; h.loop = L; h.lt = Math.max(0, over) / L.R; h.rs = Math.max(Math.abs(h.rs), 2.7); h.face = 1;
  sfx('air', { vol: 0.6, rate: 0.9, pan: panOf(L.cx) }); sfx('grind_start', { vol: 0.6, rate: 1.2, pan: panOf(L.cx) });
}
function loopStep(h) {
  const L = h.loop; L.glow = 1; h.jbuf = 0; h.grindT++;
  h.rs = Math.max(2.5, h.rs - 0.075 * Math.sin(h.lt));
  h.lt += h.rs / L.R;
  if (h.lt >= Math.PI * 2) {
    const over = (h.lt - Math.PI * 2) * L.R;
    h.loop = null; h.lt = 0; h.ang = 0; h.rail = L.exit; h.x = L.cx + over - h.w / 2; h.y = L.exit.y0 - h.h; h.vx = h.rs; h.vy = 0; h.onGround = true;
    stats.score += 300; pop(L.cx, L.cy - L.R - 8, '+300 LOOP!', '#ffd23f', true); sfx('combo', { vol: 0.75 }); sfx('cheer', { vol: 0.45 }); G.shake = Math.max(G.shake, 4);
    noteBurst(L.cx, L.cy - L.R, 12, 2);
    return;
  }
  const px = L.cx + L.R * Math.sin(h.lt), py = L.cy + L.R * Math.cos(h.lt);
  h.x = px - h.w / 2; h.y = py - h.h; h.vx = h.rs * Math.cos(h.lt); h.vy = -h.rs * Math.sin(h.lt); h.onGround = true; h.ang = -h.lt;
  if (G.frame % 2 === 0) sparkAt(px - Math.cos(h.lt) * 2, py + Math.sin(h.lt) * 2, -h.vx * 0.4 + rnd(-0.4, 0.4), -h.vy * 0.4 + rnd(-0.6, 0.6), 2, 16);
}
// ---------- atualização: inclinação, Merlin do topo e o trânsito
const LAD_PAGES = () => {
  const k = KEYS(), n = NAME_UP();
  return [
    [n + '! AQUI COMEÇA A NOSSA PRIMEIRA LADEIRA:', 'A DA IGREJA MATRIZ!'],
    ['É DESCIDA BRAVA. TOMA CUIDADO', 'E APERTA BEM OS PATINS!'],
    ['VEM CARRO, MOTO, BICICLETA E VELHINHA', 'SUBINDO. PULA POR CIMA DE TUDO! ' + k.jump],
    ['NO MEIO TEM UM CORRIMÃO COM LOOP.', 'LÁ EMBAIXO, O SEGURANÇA DA IA TE ESPERA. BOA SORTE!'],
  ];
};
function updateLadeira() {
  if (!ladM) return;
  G.tilt = (G.tilt || 0) + (slopeK(cam.x + viewW() / 2) - (G.tilt || 0)) * 0.05;
  const m = ladM, h = hero, playing = G.state === 'play';
  m.t += 1 / 60; if (m.talkT > 0) m.talkT--; if (m.waveT > 0) m.waveT--;
  m.talk = m.talkT > 0 ? 0.5 + 0.5 * Math.sin(m.t * 15) : 0;
  if (--m.blinkT <= 0) { m.blink = 7; m.blinkT = 150 + Math.random() * 160; } if (m.blink > 0) m.blink--;
  const f = Math.sign(heroCX() - m.x); if (f) m.face = f;
  if (!m.talked && playing && !talk && !h.dead && h.onGround && !h.rail && !h.ramp && Math.abs(heroCX() - m.x) < 70) {
    m.talked = true; startTalk(LAD_PAGES(), m, () => { m.waveT = 150; sfx('sticks', { vol: 0.7 }); });
  }
  if (talk) return;
  for (const t of traffic) {
    if (t.gone) continue;
    if (!t.on) { if (t.x < cam.x + viewW() + 70) t.on = true; else continue; }
    t.x += t.vx; t.t += 1 / 60; if (t.oops > 0) t.oops--;
    if (t.x + t.w < cam.x - 140) { t.gone = true; continue; }
    if (playing && !h.dead) trafficHit(t);
  }
}
function trafficHit(t) {
  const h = hero, hx = h.x + h.w / 2;
  if (!t.cleared && hx > t.x + t.w / 2 && h.y + h.h < t.y + 3 && !h.onGround) {   // passou por cima
    t.cleared = true; stats.score += 100; sfx('pick', { rate: 1.3, vol: 0.7, pan: panOf(t.x) });
    pop(t.x + t.w / 2, t.y - 14, t.kind === 'vovo' ? 'COM LICENÇA, VÓ! +100' : '+100 PULOU!', '#b6ff3b');
  }
  if (!(h.x + 1 < t.x + t.w - 2 && h.x + h.w - 1 > t.x + 2 && h.y + 2 < t.y + t.h && h.y + h.h > t.y + 2)) return;
  if (h.vy > 0 && h.y + h.h - h.vy <= t.y + 7) {   // caiu por cima: quica (no teto do carro, no capacete... e a vovó só leva um susto)
    h.y = t.y - h.h; h.vy = input.jump ? -6.0 : -4.6; h.jumping = input.jump; h.onGround = false; h.sq = 1.2;
    if (t.kind === 'vovo') { t.oops = 50; pop(t.x + t.w / 2, t.y - 8, 'OPA, DESCULPA!', '#ff7a1a'); sfx('bump', { vol: 0.6, rate: 1.3, pan: panOf(t.x) }); return; }
    stats.score += 50; pop(t.x + t.w / 2, t.y - 8, t.kind === 'car' ? '+50 CAPÔ!' : '+50 QUICOU!', '#ffd23f'); sfx('bump', { vol: 0.8, rate: 0.8, pan: panOf(t.x) }); sfx('stomp', { vol: 0.5, rate: 0.7 });
    return;
  }
  if (h.inv > 0) return;
  const was = h.inv;
  hurt();
  if (hero.inv > was || hero.dead) {
    if (!hero.dead) { hero.vx = -2.2; hero.vy = -2.6; hero.onGround = false; }
    t.oops = 70; pop(t.x + t.w / 2, t.y - 10, t.kind === 'vovo' ? 'DESCULPA, VÓ!' : t.kind === 'car' ? 'BIBIIII!' : 'OLHA A FRENTE!', '#ff7a1a');
    if (t.kind === 'car' || t.kind === 'moto') sfx('alarm', { vol: 0.35, rate: 1.6, pan: panOf(t.x) });
  }
}
// ---------- desenho
// inclinação da câmera: em vez de copiar o quadro e girar (caro), a inclinação entra como uma matriz-base em todo
// setTransform da tela principal; o quadro inteiro já sai desenhado girado (com um zoom para não aparecer borda)
const _setT = ctx.setTransform.bind(ctx), _getT = ctx.getTransform.bind(ctx);
let TBASE = null, TBASE_INV = null;
ctx.setTransform = function (a, b, c, d, e, f) {
  if (!TBASE) return typeof a === 'object' ? _setT(a) : _setT(a, b, c, d, e, f);
  _setT(TBASE.multiply(typeof a === 'object' ? DOMMatrix.fromMatrix(a) : new DOMMatrix([a, b, c, d, e, f])));
};
ctx.getTransform = function () { const m = _getT(); return TBASE_INV ? TBASE_INV.multiply(m) : m; };   // quem lê a matriz (brilhos) continua vendo o mundo sem a inclinação
function tiltBegin() {
  const k = G.tilt || 0;
  if (k < 0.004 || G.state === 'title') { TBASE = TBASE_INV = null; return; }
  const a = 0.085 * k, s = Math.cos(a) + (W / H) * Math.sin(a) + 0.004;
  TBASE = new DOMMatrix().translate(W / 2, H / 2).rotate(a * 180 / Math.PI).scale(s).translate(-W / 2, -H / 2); TBASE_INV = TBASE.inverse();
  _setT(TBASE);
}
function tiltEnd() {
  if (!TBASE) return;
  const k = G.tilt || 0, sp = Math.min(1, Math.abs(hero.vx) / 3.2) * k;
  if (sp > 0.05) {   // vento: riscos finos passando na direção da descida
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, K * 0.25);
    for (let i = 0; i < 16; i++) {
      const y = hash(i * 7.3) * H, len = (40 + hash(i * 3.1) * 90) * K * 0.12 * (0.6 + sp), x = W * 1.3 - ((G.t * (500 + hash(i) * 400) * K * 0.1 + hash(i * 9) * W * 1.6) % (W * 1.6));
      ctx.strokeStyle = `rgba(255,255,255,${0.1 * sp * (0.5 + hash(i * 5))})`; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  TBASE = TBASE_INV = null; _setT(1, 0, 0, 1, 0, 0);
}
// Igreja Matriz grande, ao fundo da ladeira (pintada uma vez por escala)
let MATRIZ = null; const MATRIZ_S = 1.15, MATRIZ_F = 0.2;
onRescale(() => {
  const s = KB * MATRIZ_S, w = 140, top = 60, h = 145;
  MATRIZ = mk(w * s, h * s); const g = MATRIZ.getContext('2d'); g.scale(s, s); g.translate(18, -top);
  paintIgreja(g, { x: 0, w: 96, h: 150 });
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(70,40,110,0.28)'; g.fillRect(0, 0, MATRIZ.width, MATRIZ.height);   // névoa da distância
});
function drawMatriz() {
  if (!MATRIZ || cam.x < LAD.x0 - 500 || cam.x > LAD.x1 + 400) return;
  const f = MATRIZ_F, lx = cam.x * f * PX, center = (LAD.x0 + (LAD.x1 - LAD.x0) * 0.62) * f * PX + 40;
  const s = KB * MATRIZ_S, x = (center - lx) * KB, y = (200 - layerTop(f)) * KB;   // base da igreja na altura do chão das camadas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(MATRIZ, Math.round(x - 18 * s), Math.round(y - 140 * s + 14 * KB));   // a base fica um pouco abaixo do horizonte (lá embaixo da ladeira)
  const lit = 0.25 + 0.08 * Math.sin(G.t * 1.3);
  glow(ctx, x + 35 * s, y - 95 * s, 60 * s, '#ffd98e', lit);   // holofotes na torre
}
// ponto de ônibus no fim da ladeira, com três patinadores sentados filmando com o celular
const SKATERS = [{ dx: 14, hood: '#ff3fa4', cap: '#1c1b23', skin: '#c98b5e' }, { dx: 31, hood: '#7fd4ff', cap: '#ffd23f', skin: '#f1c7a1' }, { dx: 48, hood: '#b6ff3b', cap: '#e63946', skin: '#8a5a3c' }];
function drawBusStop(g, t) {
  const x0 = LAD_X(LT.stop), base = GROUND_Y, w = 64, hx = heroCX(), near = Math.abs(hx - (x0 + w / 2)) < 110;
  g.save(); g.translate(x0, base); g.scale(0.92, 0.92); g.translate(-x0, -base);
  // abrigo: colunas, vidro, teto e a placa
  g.fillStyle = '#2e2a38'; g.fillRect(x0 + 2, base - 44, 2.2, 44); g.fillRect(x0 + w - 4, base - 44, 2.2, 44);
  g.fillStyle = 'rgba(160,200,230,0.18)'; g.fillRect(x0 + 4, base - 40, w - 8, 26); g.strokeStyle = 'rgba(200,230,255,0.35)'; g.lineWidth = 0.4; g.strokeRect(x0 + 4, base - 40, w - 8, 26);
  rr(g, x0 - 3, base - 48, w + 6, 5, 1.4); fillStroke(g, '#3d3a52', 0.6); g.fillStyle = '#ffd23f'; g.fillRect(x0 - 3, base - 44, w + 6, 0.8);
  rr(g, x0 + w - 1, base - 62, 12, 9, 1.5); fillStroke(g, '#1f4e8c', 0.5); g.fillStyle = '#f4f4f4'; g.font = `800 3.4px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ÔNIBUS', x0 + w + 5, base - 57.4);
  g.fillStyle = '#2e2a38'; g.fillRect(x0 + w + 4.4, base - 53, 1.2, 53);
  // propaganda no vidro: show de rock
  rr(g, x0 + 6, base - 38, 13, 20, 1); fillStroke(g, '#2a1840', 0.35); g.fillStyle = '#ff7a1a'; g.font = `800 3px ${FONT_UI}`; g.fillText('ROCK', x0 + 12.5, base - 33); g.fillText('NO PAÇO', x0 + 12.5, base - 29.4); noteGlyph(g, x0 + 12.5, base - 23.5, 0.8, '#b6ff3b');
  // banco
  g.fillStyle = '#6b5a48'; g.fillRect(x0 + 6, base - 13, w - 12, 2.2); g.fillStyle = '#2e2a38'; g.fillRect(x0 + 9, base - 11, 1.4, 11); g.fillRect(x0 + w - 11, base - 11, 1.4, 11);
  for (const sk of SKATERS) drawSkater(g, x0 + sk.dx, base - 13, sk, t, hx, near);
  g.restore();
}
function drawSkater(g, x, seatY, sk, t, hx, near) {
  const bob = Math.sin(t * 2 + sk.dx) * 0.25, cheer = near && Math.sin(t * 9 + sk.dx) > 0;
  // pernas para a frente com os patins
  g.strokeStyle = OUT; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, seatY); g.lineTo(x - 5, seatY + 0.5); g.lineTo(x - 6, seatY + 9); g.stroke();
  g.strokeStyle = '#3a4a7a'; g.lineWidth = 1.8; g.stroke();
  g.save(); g.translate(x - 6.5, seatY + 11.6); rr(g, -2.4, -3.4, 4.6, 3.2, 1); fillStroke(g, '#1c1b23', 0.35); g.fillStyle = sk.hood; g.fillRect(-2.2, -3.2, 4.2, 0.8);
  for (const wx of [-1.8, -0.4, 1.0]) { ell(g, wx, 0.2, 0.7, 0.7); g.fillStyle = '#ffd23f'; g.fill(); } g.restore();
  // tronco (moletom) e cabeça com boné
  const ty = seatY - 9 + bob;
  rr(g, x - 2.6, ty, 5.6, 9.4, 2); fillStroke(g, sk.hood, 0.5);
  ell(g, x + 0.2, ty - 3.2, 2.9, 2.9); fillStroke(g, sk.skin, 0.45);
  g.beginPath(); g.arc(x + 0.2, ty - 3.6, 3.1, Math.PI, 0); g.closePath(); fillStroke(g, sk.cap, 0.4); g.fillStyle = sk.cap; g.fillRect(x - 3.6, ty - 3.9, 2.2, 0.9);
  // braço com o celular, mirando no herói (e, quando ele passa, o outro braço comemora)
  const aim = clamp(Math.atan2(-8, hx - x) * 0.25, -0.5, 0.5), px = x - 4.6 + Math.cos(Math.PI + aim) * 0.5, py = ty - 2.4;
  g.strokeStyle = OUT; g.lineWidth = 1.9; g.beginPath(); g.moveTo(x - 1, ty + 1.6); g.lineTo(px + 1, py + 1); g.stroke(); g.strokeStyle = sk.hood; g.lineWidth = 1.2; g.stroke();
  g.save(); g.translate(px, py); g.rotate(aim); rr(g, -1.2, -2.1, 2.4, 4.2, 0.5); fillStroke(g, '#16151a', 0.3);
  g.fillStyle = '#bfe9ff'; g.fillRect(-0.8, -1.6, 1.6, 3.2); g.restore();
  glow(g, px - 1, py, 4, '#bfe9ff', 0.55); if (((t * 2) | 0) % 2 === 0) { g.fillStyle = '#ff2a4a'; ell(g, px + 0.4, py - 1.6, 0.35, 0.35); g.fill(); }   // gravando
  if (cheer) { g.strokeStyle = OUT; g.lineWidth = 1.9; g.beginPath(); g.moveTo(x + 2, ty + 1.6); g.lineTo(x + 4, ty - 5); g.stroke(); g.strokeStyle = sk.hood; g.lineWidth = 1.2; g.stroke(); }
}
function drawLoop(g, L, t) {
  const { cx, cy, R } = L;
  // dois pés de apoio até o chão e a barra redonda em círculo
  for (const dx of [-R * 0.55, R * 0.55]) { const y0 = cy + Math.sqrt(R * R - dx * dx); g.strokeStyle = OUT; g.lineWidth = 1.8; g.beginPath(); g.moveTo(cx + dx, y0); g.lineTo(cx + dx * 1.25, GROUND_Y); g.stroke(); g.strokeStyle = '#7d8290'; g.lineWidth = 1.0; g.stroke(); }
  g.strokeStyle = OUT; g.lineWidth = 2.6; ell(g, cx, cy, R, R); g.stroke();
  g.strokeStyle = '#a9afbc'; g.lineWidth = 1.7; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.45; ell(g, cx, cy, R - 0.6, R - 0.6); g.stroke();
  if (L.glow > 0.02) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = L.glow * 0.6; g.strokeStyle = '#ffb347'; g.lineWidth = 1.3; ell(g, cx, cy, R, R); g.stroke(); g.restore(); L.glow *= 0.95; }
  // placa "LOOP" no pé
  rr(g, cx - 7, GROUND_Y - 12, 14, 6, 1.2); fillStroke(g, '#ffd23f', 0.5); g.fillStyle = '#1c1b23'; g.font = `800 3.6px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LOOP!', cx, GROUND_Y - 8.9);
}
function drawLadeiraBack(g, vx0, vx1, t) {
  const x0 = LAD_X(LT.stop);
  if (x0 < vx1 + 20 && x0 + 80 > vx0) drawBusStop(g, t);
}
function drawLadeiraFront(g, vx0, vx1, t) {
  if (!ladM) return;
  const m = ladM;
  if (m.x > vx0 - 40 && m.x < vx1 + 40) {
    g.fillStyle = 'rgba(8,4,16,0.4)'; ell(g, m.x, m.y + 0.4, 10, 1.8); g.fill();
    glow(g, m.x, m.y - 16, 30, '#7fd4ff', 0.12);
    g.save(); g.translate(m.x, m.y); g.scale(m.face, 1);
    drawMerlin(g, { t: m.t, mode: m.waveT > 0 ? 'wave' : m.talkT > 0 ? (((m.t * 0.6) | 0) % 2 ? 'talk' : 'point') : 'idle', stride: 0, wheel: 0, vy: 0, talk: m.talk, hairDX: m.hairDX, hairDY: 0, blink: m.blink > 0 });
    g.restore();
  }
  for (const tr of traffic) if (!tr.gone && tr.x < vx1 + 60 && tr.x + tr.w > vx0 - 20) drawTraffic(g, tr, t);
}
function wheel(g, x, y, r, spin, rim = '#c9ced6') {
  ell(g, x, y, r, r); fillStroke(g, '#16151a', 0.5);
  ell(g, x, y, r * 0.55, r * 0.55); g.fillStyle = rim; g.fill();
  g.strokeStyle = '#4a4552'; g.lineWidth = r * 0.14; g.beginPath(); for (let k = 0; k < 3; k++) { const a = spin + k * 2.09; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); } g.stroke();
}
function drawTraffic(g, tr, t) {
  const x = tr.x, b = tr.y + tr.h, spin = -tr.x / 4, shake = tr.oops > 0 ? Math.sin(tr.oops * 1.4) * 0.6 : 0;
  g.save(); g.translate(shake, 0);
  g.fillStyle = 'rgba(8,4,16,0.35)'; ell(g, x + tr.w / 2, b + 0.4, tr.w * 0.5, 1.6); g.fill();
  if (tr.kind === 'car') {
    // carro visto de lado, subindo para a esquerda (farol na frente, lanterna atrás)
    g.beginPath(); g.moveTo(x + 2, b - 4); g.lineTo(x + 1, b - 9); g.quadraticCurveTo(x + 2, b - 12.5, x + 8, b - 12.5); g.lineTo(x + 12, b - 12.5); g.lineTo(x + 16, b - 19.5); g.lineTo(x + 31, b - 19.5); g.lineTo(x + 36, b - 12.5);
    g.quadraticCurveTo(x + 43, b - 12, x + 43.5, b - 8); g.lineTo(x + 43, b - 4); g.closePath();
    fillStroke(g, vgrad(g, b - 20, b - 3, [[0, mix(tr.col, '#ffffff', 0.25)], [1, mix(tr.col, '#000000', 0.25)]]), 0.7);
    g.beginPath(); g.moveTo(x + 13.6, b - 12.8); g.lineTo(x + 17, b - 18.3); g.lineTo(x + 23, b - 18.3); g.lineTo(x + 23, b - 12.8); g.closePath(); g.fillStyle = '#a8d4f0'; g.fill();
    g.beginPath(); g.moveTo(x + 24.4, b - 12.8); g.lineTo(x + 24.4, b - 18.3); g.lineTo(x + 30.4, b - 18.3); g.lineTo(x + 34.4, b - 12.8); g.closePath(); g.fill();
    g.fillStyle = '#2a2433'; ell(g, x + 19.5, b - 14.6, 1.8, 2); g.fill();   // motorista
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(x + 23.7, b - 12.6); g.lineTo(x + 23.7, b - 5); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 6, b - 11.6, 30, 0.7);
    rr(g, x + 0.4, b - 10.4, 2.6, 2.2, 0.6); g.fillStyle = '#fff6c8'; g.fill(); emit(x - 2, b - 9.3, 12, '#fff2c8', 0.7);
    rr(g, x + 41.2, b - 10, 2.2, 2, 0.5); g.fillStyle = '#ff3b3b'; g.fill(); emit(x + 43, b - 9, 6, '#ff3b3b', 0.6);
    wheel(g, x + 9, b - 3.6, 3.8, spin); wheel(g, x + 35, b - 3.6, 3.8, spin);
  } else if (tr.kind === 'moto' || tr.kind === 'bike') {
    const moto = tr.kind === 'moto', r = moto ? 3.8 : 4.3, wa = x + r + 0.6, wb = x + tr.w - r - 0.6, wy = b - r, ped = tr.t * (moto ? 0 : 7);
    if (moto) {
      wheel(g, wa, wy, r, spin, '#9aa1ad'); wheel(g, wb, wy, r, spin, '#9aa1ad');
      g.beginPath(); g.moveTo(wa + 2, wy - 3); g.lineTo(wa + 7, wy - 7.5); g.lineTo(wb - 4, wy - 7); g.lineTo(wb - 1, wy - 3.5); g.lineTo(wb - 6, wy - 2); g.lineTo(wa + 5, wy - 1.5); g.closePath(); fillStroke(g, tr.col, 0.6);
      g.strokeStyle = OUT; g.lineWidth = 0.9; g.beginPath(); g.moveTo(wa, wy); g.lineTo(wa + 4, wy - 9); g.stroke();
      ell(g, x + 1.2, wy - 7.6, 1.2, 1.2); g.fillStyle = '#fff6c8'; g.fill(); emit(x - 1, wy - 7.6, 10, '#fff2c8', 0.7);
    } else {
      for (const wx of [wa, wb]) { g.strokeStyle = OUT; g.lineWidth = 1.2; ell(g, wx, wy, r, r); g.stroke(); g.strokeStyle = '#9aa1ad'; g.lineWidth = 0.3; g.beginPath(); for (let k = 0; k < 4; k++) { const a = spin + k * 0.785; g.moveTo(wx - Math.cos(a) * r, wy - Math.sin(a) * r); g.lineTo(wx + Math.cos(a) * r, wy + Math.sin(a) * r); } g.stroke(); }
      g.strokeStyle = tr.col; g.lineWidth = 1.1; g.beginPath(); g.moveTo(wa, wy); g.lineTo(x + 10, wy); g.lineTo(wb, wy); g.lineTo(wb - 3, wy - 7); g.lineTo(x + 8, wy - 7); g.lineTo(x + 10, wy); g.moveTo(x + 8, wy - 7); g.lineTo(wa + 1, wy - 9); g.stroke();
    }
    // piloto com capacete
    const sx = x + tr.w * 0.58, sy = wy - (moto ? 9 : 9.5);
    const k1 = [x + 10 + Math.cos(ped) * 2, wy - 1 + Math.sin(ped) * 2];
    g.strokeStyle = OUT; g.lineWidth = 2.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(moto ? x + 9 : k1[0] - 1, moto ? wy - 6 : k1[1] - 4); g.lineTo(moto ? x + 9 : k1[0], moto ? wy - 2 : k1[1]); g.stroke();
    g.strokeStyle = '#2c3a5a'; g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = OUT; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - 4, sy - 7); g.stroke(); g.strokeStyle = moto ? '#1c1b23' : '#ff7a1a'; g.lineWidth = 2.2; g.stroke();
    g.strokeStyle = OUT; g.lineWidth = 1.3; g.beginPath(); g.moveTo(sx - 3.6, sy - 6); g.lineTo(x + 3.6, wy - 8.6); g.stroke();
    ell(g, sx - 5, sy - 9.6, 2.7, 2.6); fillStroke(g, moto ? '#e63946' : '#f2f2f4', 0.5);
    g.fillStyle = moto ? '#1c2a3a' : '#f1c7a1'; g.fillRect(sx - 8, sy - 10, 2.6, 1.6);
  } else {
    // velhinha subindo devagar com a sacola de feira e a bengala
    const step = Math.sin(tr.t * 4) * 1.1, mx = x + tr.w / 2;
    g.strokeStyle = OUT; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(mx, b - 6); g.lineTo(mx - 1.4 + step, b); g.moveTo(mx, b - 6); g.lineTo(mx + 1.4 - step, b); g.stroke();
    g.strokeStyle = '#d8b9a0'; g.lineWidth = 0.9; g.stroke();
    g.beginPath(); g.moveTo(mx - 4.4, b - 5.6); g.quadraticCurveTo(mx - 3.8, b - 14, mx, b - 14.2); g.quadraticCurveTo(mx + 3.8, b - 14, mx + 4.4, b - 5.6); g.closePath(); fillStroke(g, '#9b5de5', 0.6);   // vestido
    g.fillStyle = '#ffd6ec'; for (let k = 0; k < 5; k++) { ell(g, mx - 2.6 + (k % 3) * 2.4, b - 7.4 - (k > 2 ? 3 : 0), 0.55, 0.55); g.fill(); }
    rr(g, mx - 3.4, b - 15.4, 6.8, 4, 1.5); fillStroke(g, '#e9a8c6', 0.45);   // casaquinho
    ell(g, mx - 0.4, b - 17.4, 2.6, 2.6); fillStroke(g, '#f1c7a1', 0.45);
    g.fillStyle = '#e6e6ee'; ell(g, mx + 0.6, b - 19.4, 2.4, 1.5); g.fill(); ell(g, mx + 1.8, b - 19.8, 1.2, 1.2); g.fill();   // cabelo com coque
    g.strokeStyle = '#5a4a3a'; g.lineWidth = 0.3; ell(g, mx - 1.6, b - 17.6, 0.8, 0.7); g.stroke();   // óculos
    const cane = tr.oops > 0 ? Math.sin(tr.oops * 0.6) * 0.6 - 0.5 : 0.15;
    g.save(); g.translate(mx - 3, b - 12); g.rotate(cane); g.strokeStyle = '#6b4a2a'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, 0); g.lineTo(-0.6, 12); g.moveTo(0, 0); g.quadraticCurveTo(0.4, -1.4, 1.4, -0.8); g.stroke(); g.restore();
    rr(g, mx + 3, b - 10, 4, 5, 1); fillStroke(g, '#2a9d8f', 0.4); g.fillStyle = '#7ccf5a'; ell(g, mx + 4.4, b - 10.6, 1.2, 1); g.fill();   // sacola com verdura
  }
  g.restore();
}
