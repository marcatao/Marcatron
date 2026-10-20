'use strict';
// =================================================================== ladeira da Igreja Matriz (v11)
// Antes do chefe, a rua desce em direção à Igreja Matriz da Marechal. No topo o Merlin reaparece e avisa: "aperta os patins".
// A descida é uma ilusão: o chão continua reto, mas a câmera inclina, o fundo sobe, o vento passa e o herói ganha embalo sozinho.
// Subindo a ladeira vêm carros, motos, bicicletas e velhinhas: é pular por cima (no teto do carro dá para quicar).
// No meio, um corrimão que faz um loop completo; no fim, um ponto de ônibus com patinadores sentados filmando com o celular.
let traffic = [], loops = [], ladM = null;
const LT = { piano: 1.0, merlin: 5.5, tilt0: 9, tilt1: 14, tilt2: 141, tilt3: 148, stop: 141.5, loopC: 68, loopR: 34 };   // v12: 150 colunas, mais íngreme
const TILT_A = 0.13;      // inclinação máxima da câmera (rad, ~7,5°)
const LAD_ZOOM = 0.72;    // na ladeira a câmera abre (campo de visão ~40% maior) para dar tempo de reagir
const LAD_X = c => (LAD.c0 + c) * TS;
const TRAFFIC_DIM = { fusca: { w: 46, h: 22, vx: -1.1 }, kombi: { w: 52, h: 27, vx: -0.9 }, moto: { w: 32, h: 25, vx: -1.5 }, bike: { w: 27, h: 24, vx: -0.7 }, vovo: { w: 11, h: 17, vx: -0.3 } };
const CAR_COLS = ['#e63946', '#2a9d8f', '#f4a261', '#3a86ff', '#ffbe0b', '#8338ec'];
function makeLadeira(coin) {
  traffic = []; loops = [];
  pianos.push({ c: LAD.c0 + LT.piano, x: LAD_X(LT.piano), on: false, t: 0, reach: SH_LAD.n });   // checkpoint no topo; a cor vai até o fim da descida
  signs.push({ c: LAD.c0 + 7.6, lines: ['LADEIRA DA MATRIZ', 'PULE O TRÂNSITO!'] });
  ladM = { x: LAD_X(LT.merlin), y: GROUND_Y, face: -1, t: 0, talkT: 0, talk: 0, blink: 0, blinkT: 90, hairDX: 0, talked: false, waveT: 0 };
  const plan = [['vovo', 20], ['fusca', 35], ['bike', 50], ['moto', 86], ['kombi', 100], ['bike', 113], ['fusca', 126], ['vovo', 138]];   // espaçados: dá para pousar entre um e outro
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
    stats.score += 50; pop(t.x + t.w / 2, t.y - 8, (t.kind === 'fusca' || t.kind === 'kombi') ? '+50 CAPÔ!' : '+50 QUICOU!', '#ffd23f'); sfx('bump', { vol: 0.8, rate: 0.8, pan: panOf(t.x) }); sfx('stomp', { vol: 0.5, rate: 0.7 });
    return;
  }
  if (h.inv > 0) return;
  const was = h.inv;
  hurt();
  if (hero.inv > was || hero.dead) {
    if (!hero.dead) { hero.vx = -2.2; hero.vy = -2.6; hero.onGround = false; }
    t.oops = 70; pop(t.x + t.w / 2, t.y - 10, t.kind === 'vovo' ? 'DESCULPA, VÓ!' : (t.kind === 'fusca' || t.kind === 'kombi') ? 'BIBIIII!' : 'OLHA A FRENTE!', '#ff7a1a');
    if (t.kind !== 'vovo' && t.kind !== 'bike') sfx('alarm', { vol: 0.35, rate: 1.6, pan: panOf(t.x) });
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
  const a = TILT_A * k, s = Math.cos(a) + (W / H) * Math.sin(a) + 0.004;
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
// ---------- arte do trânsito (v12: Fusca e Kombi, moto de motoboy e bicicleta com o ciclista pedalando)
function ikJoint(x0, y0, x1, y1, l1, l2, front) {   // junta do meio (joelho/cotovelo); front = para que lado ela aponta em x
  const dx = x1 - x0, dy = y1 - y0, d = Math.max(0.01, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01)), a = Math.atan2(dy, dx);
  const c = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const p = [x0 + Math.cos(a + c) * l1, y0 + Math.sin(a + c) * l1], q = [x0 + Math.cos(a - c) * l1, y0 + Math.sin(a - c) * l1];
  return (p[0] - q[0]) * front > 0 ? p : q;
}
function limb2(g, pts, w, col) { g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.strokeStyle = OUT; g.lineWidth = w + 0.7; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
function chrome(g, y0, y1) { return vgrad(g, y0, y1, [[0, '#ffffff'], [0.45, '#c9ced6'], [0.55, '#8a909c'], [1, '#e2e6ec']]); }
function beam(g, x, y, len, spread, a) {   // facho do farol, para a esquerda (o sentido da subida)
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(x, 0, x - len, 0); gr.addColorStop(0, `rgba(255,244,200,${a})`); gr.addColorStop(1, 'rgba(255,244,200,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x, y - 0.8); g.lineTo(x - len, y - spread * 0.5); g.lineTo(x - len, y + spread); g.lineTo(x, y + 0.8); g.closePath(); g.fill(); g.restore();
}
function tire(g, x, y, r, spin, kind) {
  ell(g, x, y, r, r); fillStroke(g, '#17161c', 0.55);
  g.strokeStyle = '#33303b'; g.lineWidth = r * 0.13; g.setLineDash([r * 0.32, r * 0.24]); g.lineDashOffset = -spin * r; ell(g, x, y, r * 0.86, r * 0.86); g.stroke(); g.setLineDash([]);   // banda de rodagem
  if (kind === 'calota') {   // calota cromada abaulada (Fusca/Kombi)
    ell(g, x, y, r * 0.62, r * 0.62); const gr = g.createRadialGradient(x - r * 0.22, y - r * 0.25, 0, x, y, r * 0.62); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#cfd4dc'); gr.addColorStop(1, '#6c7280'); g.fillStyle = gr; g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.3; g.stroke();
    g.strokeStyle = 'rgba(60,64,76,0.6)'; g.lineWidth = 0.28; g.beginPath(); for (let k = 0; k < 4; k++) { const a = spin + k * Math.PI / 2; g.moveTo(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2); g.lineTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); } g.stroke();
    ell(g, x, y, r * 0.16, r * 0.16); g.fillStyle = '#8a909c'; g.fill();
  } else {   // roda de liga com 5 raios e disco de freio (moto)
    ell(g, x, y, r * 0.66, r * 0.66); g.fillStyle = '#2b2a33'; g.fill();
    ell(g, x, y, r * 0.42, r * 0.42); g.strokeStyle = '#9aa1ad'; g.lineWidth = r * 0.12; g.stroke();
    g.strokeStyle = '#c9ced6'; g.lineWidth = r * 0.14; g.lineCap = 'round'; g.beginPath(); for (let k = 0; k < 5; k++) { const a = spin + k * 1.2566; g.moveTo(x + Math.cos(a) * r * 0.12, y + Math.sin(a) * r * 0.12); g.lineTo(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62); } g.stroke();
    ell(g, x, y, r * 0.15, r * 0.15); g.fillStyle = '#e2e6ec'; g.fill();
  }
}
function smoke(g, x, y, t, seed) {   // fumacinha do escapamento
  for (let k = 0; k < 3; k++) { const ph = (t * 1.6 + k / 3 + seed * 0.13) % 1; g.fillStyle = `rgba(200,198,212,${0.35 * (1 - ph)})`; ell(g, x + ph * 9, y - ph * 3.5, 0.9 + ph * 2.4, 0.9 + ph * 2.2); g.fill(); }
}
function drawFusca(g, tr, x, b, spin, t) {
  const col = tr.col, bob = Math.sin(t * 9 + tr.seed) * 0.22, B = b + bob, light = mix(col, '#ffffff', 0.38), dark = mix(col, '#000000', 0.38);
  smoke(g, x + 47, b - 4.6, t, tr.seed);
  g.fillStyle = '#0e0c14'; ell(g, x + 10, b - 4.4, 5.8, 5.2); g.fill(); ell(g, x + 36, b - 4.4, 5.8, 5.2); g.fill();   // caixas de roda
  // carroceria: capô curto, teto em cúpula e a tampa do motor atrás
  g.beginPath(); g.moveTo(x + 1.6, B - 5.4); g.bezierCurveTo(x + 0.4, B - 9, x + 2, B - 11.6, x + 6, B - 12.3); g.quadraticCurveTo(x + 11, B - 12.9, x + 13.6, B - 14.2);
  g.bezierCurveTo(x + 16.4, B - 22.8, x + 31, B - 23.2, x + 37, B - 15.2); g.bezierCurveTo(x + 41.2, B - 13.2, x + 45.6, B - 11.2, x + 45.6, B - 6.6); g.lineTo(x + 45, B - 4.6); g.lineTo(x + 1.6, B - 4.6); g.closePath();
  fillStroke(g, vgrad(g, B - 23, B - 4, [[0, light], [0.42, col], [1, dark]]), 0.75);
  // para-lamas abaulados
  for (const wx of [10, 36]) { g.beginPath(); g.ellipse(x + wx, B - 5.4, 7.4, 6.8, 0, Math.PI, 0); g.closePath(); fillStroke(g, vgrad(g, B - 12.5, B - 4.6, [[0, light], [1, dark]]), 0.6); ell(g, x + wx, B - 4.2, 5.4, 4.8); g.fillStyle = '#0e0c14'; g.fill(); }
  g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(x + 26, B - 18.4, 6.5, 1.1, -0.06, 0, Math.PI * 2); g.fill();   // brilho no teto
  rr(g, x + 16, B - 6.4, 13.6, 1.7, 0.6); g.fillStyle = '#2a2833'; g.fill();   // estribo
  // vidros com reflexo e o motorista
  const win = () => { g.beginPath(); g.moveTo(x + 15.3, B - 14.4); g.quadraticCurveTo(x + 17, B - 20.4, x + 23.6, B - 20.9); g.lineTo(x + 23.6, B - 14.4); g.closePath(); g.moveTo(x + 25, B - 14.4); g.lineTo(x + 25, B - 20.9); g.quadraticCurveTo(x + 31.2, B - 20.5, x + 34.8, B - 15.6); g.lineTo(x + 34.2, B - 14.4); g.closePath(); };
  win(); g.fillStyle = vgrad(g, B - 21, B - 14, [[0, '#d8f2ff'], [1, '#4f7fa8']]); g.fill();
  g.save(); win(); g.clip();
  g.fillStyle = '#3b2a22'; ell(g, x + 20.4, B - 16.4, 2.3, 2.5); g.fill(); g.fillStyle = '#c98b5e'; ell(g, x + 18.6, B - 16, 1.0, 1.3); g.fill();   // motorista
  g.strokeStyle = '#1c1b23'; g.lineWidth = 0.5; g.beginPath(); g.arc(x + 17.6, B - 14.6, 1.6, Math.PI, Math.PI * 1.7); g.stroke();   // volante
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); const rf = ((t * 0.4 + tr.seed * 0.3) % 1) * 30; g.moveTo(x + 12 + rf, B - 22); g.lineTo(x + 15 + rf, B - 22); g.lineTo(x + 10 + rf, B - 13); g.lineTo(x + 7 + rf, B - 13); g.closePath(); g.fill();
  g.restore();
  win(); g.strokeStyle = OUT; g.lineWidth = 0.45; g.stroke();
  // frisos, porta, maçaneta e retrovisor
  g.strokeStyle = 'rgba(240,244,250,0.8)'; g.lineWidth = 0.38; g.beginPath(); g.moveTo(x + 5, B - 10.4); g.lineTo(x + 44.6, B - 10.2); g.stroke();
  g.strokeStyle = 'rgba(20,16,30,0.55)'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(x + 15.2, B - 14.2); g.lineTo(x + 15.6, B - 6.6); g.moveTo(x + 24.4, B - 14.3); g.lineTo(x + 24.6, B - 6.6); g.stroke();
  rr(g, x + 21.4, B - 12.6, 1.8, 0.6, 0.3); g.fillStyle = '#e2e6ec'; g.fill();
  rr(g, x + 13.2, B - 16.4, 1.4, 1.1, 0.4); fillStroke(g, '#e2e6ec', 0.3);
  g.strokeStyle = 'rgba(20,16,30,0.5)'; g.lineWidth = 0.32; g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(x + 39.4 + k * 1.1, B - 14 + k * 0.4); g.lineTo(x + 39.8 + k * 1.1, B - 11.8 + k * 0.4); } g.stroke();   // grade do motor
  // farol redondo, pisca, para-choques e lanterna
  ell(g, x + 5.3, B - 10.6, 1.9, 1.9); fillStroke(g, chrome(g, B - 12.5, B - 8.7), 0.4); ell(g, x + 5.1, B - 10.6, 1.25, 1.25); g.fillStyle = '#fff7d6'; g.fill();
  beam(g, x + 4, B - 10.4, 46, 9, 0.22); emit(x + 4.5, B - 10.6, 9, '#fff2c8', 0.8);
  ell(g, x + 9.4, B - 12.3, 0.6, 0.5); g.fillStyle = '#ffb347'; g.fill();
  rr(g, x - 0.6, B - 7.6, 4.8, 1.6, 0.8); fillStroke(g, chrome(g, B - 7.6, B - 6), 0.35);
  rr(g, x + 42.4, B - 7.6, 4.4, 1.6, 0.8); fillStroke(g, chrome(g, B - 7.6, B - 6), 0.35);
  rr(g, x + 43.6, B - 12, 1.6, 2.8, 0.6); g.fillStyle = '#ff3b3b'; g.fill(); emit(x + 44.6, B - 10.6, 5, '#ff3b3b', 0.6);
  tire(g, x + 10, b - 4.4, 4.4, spin, 'calota'); tire(g, x + 36, b - 4.4, 4.4, spin, 'calota');
}
function drawKombi(g, tr, x, b, spin, t) {
  const col = tr.col, bob = Math.sin(t * 8 + tr.seed) * 0.25, B = b + bob, W2 = 52, top = B - 26.4;
  smoke(g, x + W2 + 1, b - 5, t, tr.seed);
  g.fillStyle = '#0e0c14'; ell(g, x + 10.5, b - 4.6, 6, 5.4); g.fill(); ell(g, x + 42, b - 4.6, 6, 5.4); g.fill();
  const body = () => { g.beginPath(); g.moveTo(x + 2, B - 5); g.lineTo(x + 1.1, B - 13.5); g.quadraticCurveTo(x + 1.2, top + 0.4, x + 9, top); g.lineTo(x + W2 - 3.4, top); g.quadraticCurveTo(x + W2, top + 0.3, x + W2, top + 4); g.lineTo(x + W2, B - 5); g.closePath(); };
  body(); g.fillStyle = vgrad(g, top, B - 5, [[0, '#ffffff'], [1, '#d9d4c6']]); g.fill();
  g.save(); body(); g.clip(); g.fillStyle = vgrad(g, B - 14.6, B - 4, [[0, mix(col, '#ffffff', 0.2)], [1, mix(col, '#000000', 0.35)]]); g.fillRect(x, B - 14.6, W2 + 1, 10);   // saia colorida (duas cores)
  g.beginPath(); g.moveTo(x, B - 14.6); g.lineTo(x + 6, B - 14.6); g.lineTo(x + 3, B - 19.5); g.lineTo(x, B - 19.5); g.closePath(); g.fill(); g.restore();   // o "V" da frente
  body(); g.strokeStyle = OUT; g.lineWidth = 0.75; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x + 9, top + 0.8, W2 - 14, 0.8);
  // fileira de janelas (a da frente com o motorista)
  const wins = [[3.2, 10], [14, 8.6], [24.6, 8.6], [35.2, 8.6], [45.6, 4.4]];
  for (const [wx, ww] of wins) { rr(g, x + wx, top + 2.6, ww, 6.6, 1.3); g.fillStyle = vgrad(g, top + 2.6, top + 9.2, [[0, '#d8f2ff'], [1, '#4f7fa8']]); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.4; g.stroke(); }
  g.save(); rr(g, x + 3.2, top + 2.6, 10, 6.6, 1.3); g.clip(); g.fillStyle = '#2a2433'; ell(g, x + 8.6, top + 7, 2.3, 2.6); g.fill(); g.fillStyle = '#f1c7a1'; ell(g, x + 6.8, top + 7.4, 1, 1.3); g.fill(); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,255,255,0.18)'; const rf = ((t * 0.35 + tr.seed * 0.2) % 1) * 56; g.beginPath(); g.moveTo(x + rf, top + 2.6); g.lineTo(x + rf + 4, top + 2.6); g.lineTo(x + rf + 1, top + 9.2); g.lineTo(x + rf - 3, top + 9.2); g.closePath(); g.fill(); g.restore();
  // portas, frisos e o bagageiro no teto com malas
  g.strokeStyle = 'rgba(20,16,30,0.5)'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(x + 13.4, top + 1.4); g.lineTo(x + 13.4, B - 5.4); g.moveTo(x + 23.9, top + 1.4); g.lineTo(x + 23.9, B - 5.4); g.moveTo(x + 34.6, top + 1.4); g.lineTo(x + 34.6, B - 5.4); g.stroke();
  rr(g, x + 11.4, B - 12.8, 1.6, 0.6, 0.3); g.fillStyle = '#e2e6ec'; g.fill(); rr(g, x + 21.8, B - 12.8, 1.6, 0.6, 0.3); g.fill();
  g.strokeStyle = '#3a3646'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x + 12, top); g.lineTo(x + 12, top - 2); g.lineTo(x + 44, top - 2); g.lineTo(x + 44, top); g.stroke();
  rr(g, x + 15, top - 6.4, 11, 4.4, 1); fillStroke(g, '#8a5a3c', 0.45); rr(g, x + 27.5, top - 5.4, 9, 3.4, 1); fillStroke(g, '#2a9d8f', 0.45);
  g.strokeStyle = '#ffd23f'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(x + 20.5, top - 6.4); g.lineTo(x + 20.5, top - 2); g.moveTo(x + 32, top - 5.4); g.lineTo(x + 32, top - 2); g.stroke();
  // farol, para-choques e lanterna
  ell(g, x + 3.2, B - 10.2, 1.8, 1.8); fillStroke(g, chrome(g, B - 12, B - 8.4), 0.4); ell(g, x + 3, B - 10.2, 1.2, 1.2); g.fillStyle = '#fff7d6'; g.fill();
  beam(g, x + 2, B - 10, 46, 9, 0.22); emit(x + 2.6, B - 10.2, 9, '#fff2c8', 0.8);
  rr(g, x - 0.6, B - 7.2, 5, 1.7, 0.8); fillStroke(g, chrome(g, B - 7.2, B - 5.5), 0.35); rr(g, x + W2 - 3.6, B - 7.2, 4.6, 1.7, 0.8); fillStroke(g, chrome(g, B - 7.2, B - 5.5), 0.35);
  rr(g, x + W2 - 1.4, B - 13.4, 1.4, 3, 0.5); g.fillStyle = '#ff3b3b'; g.fill(); emit(x + W2, B - 12, 5, '#ff3b3b', 0.6);
  tire(g, x + 10.5, b - 4.6, 4.6, spin, 'calota'); tire(g, x + 42, b - 4.6, 4.6, spin, 'calota');
}
function drawMoto(g, tr, x, b, spin, t) {
  const r = 4.8, wa = x + 5.6, wb = x + 26.2, wy = b - r, col = tr.col, bob = Math.sin(t * 14 + tr.seed) * 0.2, Y = wy + bob;
  smoke(g, x + 30.5, wy - 2.6, t * 1.4, tr.seed);
  // balança traseira, motor e escapamento cromado
  limb2(g, [wb, wy, x + 16.5, Y - 4], 1.4, '#2b2a33');
  rr(g, x + 11.6, Y - 9, 8.4, 6.6, 1.4); fillStroke(g, vgrad(g, Y - 9, Y - 2.4, [[0, '#5d6272'], [1, '#2b2a33']]), 0.55);
  g.strokeStyle = 'rgba(200,206,216,0.6)'; g.lineWidth = 0.3; g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(x + 12.4, Y - 8 + k * 1.4); g.lineTo(x + 19.2, Y - 8 + k * 1.4); } g.stroke();
  g.lineCap = 'round'; g.strokeStyle = OUT; g.lineWidth = 2.3; g.beginPath(); g.moveTo(x + 14, Y - 2.6); g.quadraticCurveTo(x + 18, Y - 0.6, x + 29.4, Y - 4.4); g.stroke();
  g.strokeStyle = '#d7dbe2'; g.lineWidth = 1.5; g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(x + 18, Y - 1.7); g.lineTo(x + 28, Y - 4.6); g.stroke();
  // rodas, garfo cromado e para-lama
  tire(g, wa, wy, r, spin); tire(g, wb, wy, r, spin);
  g.beginPath(); g.arc(wb, wy, r + 0.8, Math.PI * 1.05, Math.PI * 1.65); g.strokeStyle = OUT; g.lineWidth = 1.6; g.stroke(); g.strokeStyle = col; g.lineWidth = 1; g.stroke();
  for (const dx of [0, 0.9]) limb2(g, [wa + dx, wy, x + 9.6 + dx, Y - 12.4], 0.75, '#e2e6ec');
  g.beginPath(); g.arc(wa, wy, r + 0.7, Math.PI * 1.15, Math.PI * 1.6); g.strokeStyle = OUT; g.lineWidth = 1.4; g.stroke(); g.strokeStyle = col; g.lineWidth = 0.9; g.stroke();
  // tanque, banco, rabeta com lanterna e a carenagem do farol
  g.beginPath(); g.moveTo(x + 10.4, Y - 12.2); g.bezierCurveTo(x + 12, Y - 15.4, x + 17.4, Y - 15, x + 19.4, Y - 12.6); g.lineTo(x + 18.4, Y - 9.2); g.lineTo(x + 11.4, Y - 9.2); g.closePath();
  fillStroke(g, vgrad(g, Y - 15, Y - 9, [[0, mix(col, '#ffffff', 0.45)], [0.5, col], [1, mix(col, '#000000', 0.3)]]), 0.6);
  g.strokeStyle = '#ffffff'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x + 12, Y - 11.6); g.lineTo(x + 18.2, Y - 11.9); g.stroke();
  rr(g, x + 18.4, Y - 13.4, 8.4, 2.4, 1); fillStroke(g, '#1c1b23', 0.45);
  g.beginPath(); g.moveTo(x + 25.6, Y - 13); g.lineTo(x + 30.4, Y - 13.8); g.lineTo(x + 29.6, Y - 11.2); g.lineTo(x + 25.4, Y - 10.8); g.closePath(); fillStroke(g, col, 0.5);
  rr(g, x + 29.4, Y - 13.6, 1.4, 1.6, 0.4); g.fillStyle = '#ff3b3b'; g.fill(); emit(x + 30.4, Y - 12.8, 5, '#ff3b3b', 0.6);
  g.beginPath(); g.moveTo(x + 10.8, Y - 15.6); g.quadraticCurveTo(x + 6.6, Y - 15.2, x + 6.4, Y - 12); g.lineTo(x + 10.2, Y - 11.4); g.closePath(); fillStroke(g, col, 0.5);
  ell(g, x + 7.2, Y - 13, 1.5, 1.5); fillStroke(g, chrome(g, Y - 14.5, Y - 11.5), 0.35); ell(g, x + 7, Y - 13, 1, 1); g.fillStyle = '#fff7d6'; g.fill();
  beam(g, x + 6, Y - 12.8, 40, 8, 0.24); emit(x + 6.6, Y - 13, 8, '#fff2c8', 0.85);
  // motoboy: bota na pedaleira, jaqueta com faixa refletiva, capacete com viseira e o baú de entrega
  const hip = [x + 21, Y - 14.6], foot = [x + 17.8, Y - 4.6], sh = [x + 15.6, Y - 22], hand = [x + 11.2, Y - 15.6];
  const knee = ikJoint(hip[0], hip[1], foot[0], foot[1], 6.2, 6.4, -1), elb = ikJoint(sh[0], sh[1], hand[0], hand[1], 4.4, 4.4, 1);
  rr(g, x + 21.2, Y - 25.6, 9.6, 9, 1.2); fillStroke(g, vgrad(g, Y - 25.6, Y - 16.6, [[0, '#ff5a5f'], [1, '#c1121f']]), 0.55);
  g.fillStyle = '#ffffff'; g.font = `800 2.3px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ENTREGA', x + 26, Y - 21.6); g.fillRect(x + 21.6, Y - 19.4, 8.8, 0.4);
  limb2(g, [hip[0], hip[1], knee[0], knee[1], foot[0], foot[1]], 2.1, '#2c3a5a');
  rr(g, foot[0] - 2.2, foot[1] - 0.6, 3.6, 2, 0.8); fillStroke(g, '#1c1b23', 0.4);
  limb2(g, [hip[0], hip[1], sh[0], sh[1]], 3.6, '#2b2f3a');
  g.strokeStyle = '#d7f75b'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(lerp(hip[0], sh[0], 0.45) + 1.6, lerp(hip[1], sh[1], 0.45) + 0.6); g.lineTo(lerp(hip[0], sh[0], 0.45) - 1.4, lerp(hip[1], sh[1], 0.45) - 0.4); g.stroke();
  limb2(g, [sh[0], sh[1], elb[0], elb[1], hand[0], hand[1]], 1.5, '#2b2f3a');
  ell(g, hand[0], hand[1], 0.95, 0.95); fillStroke(g, '#1c1b23', 0.3);
  ell(g, sh[0] - 1.2, sh[1] - 3.2, 3.7, 3.5); fillStroke(g, vgrad(g, sh[1] - 6.7, sh[1], [[0, mix(col, '#ffffff', 0.4)], [1, col]]), 0.55);
  g.beginPath(); g.moveTo(sh[0] - 4.8, sh[1] - 3.8); g.quadraticCurveTo(sh[0] - 3.2, sh[1] - 4.6, sh[0] - 1.2, sh[1] - 3.6); g.lineTo(sh[0] - 1.6, sh[1] - 1.4); g.lineTo(sh[0] - 4.6, sh[1] - 1.8); g.closePath(); fillStroke(g, '#1c2a3a', 0.35);   // viseira
  g.fillStyle = 'rgba(255,255,255,0.6)'; ell(g, sh[0] - 3.4, sh[1] - 3.4, 0.9, 0.35, -0.2); g.fill();
}
function drawBike(g, tr, x, b, spin, t) {
  const r = 5.6, wa = x + 5.8, wb = x + 21.4, wy = b - r, col = tr.col, cr = -tr.t * 8;
  const BB = [x + 13.6, wy - 0.4], ST = [x + 15.8, wy - 9.8], HT = [x + 8.4, wy - 10.4], HB = [x + 7.8, wy - 7.8];
  const ped = [[BB[0] + Math.cos(cr) * 2.7, BB[1] + Math.sin(cr) * 2.7], [BB[0] - Math.cos(cr) * 2.7, BB[1] - Math.sin(cr) * 2.7]];
  const hip = [x + 15.6, wy - 13], sh = [x + 10.6, wy - 19.4], hand = [x + 7.6, wy - 12.6];
  const leg = p => { const k = ikJoint(hip[0], hip[1], p[0], p[1], 6.3, 6.5, -1); return [hip[0], hip[1], k[0], k[1], p[0], p[1]]; };
  limb2(g, leg(ped[1]), 1.6, '#1f2a44');   // perna de trás (atrás do quadro)
  for (const wx of [wa, wb]) {   // rodas finas com 12 raios
    ell(g, wx, wy, r, r); g.strokeStyle = OUT; g.lineWidth = 1.5; g.stroke(); g.strokeStyle = '#2c2a33'; g.lineWidth = 0.9; g.stroke();
    ell(g, wx, wy, r - 0.85, r - 0.85); g.strokeStyle = '#c9ced6'; g.lineWidth = 0.4; g.stroke();
    g.strokeStyle = 'rgba(210,214,222,0.75)'; g.lineWidth = 0.16; g.beginPath(); for (let k = 0; k < 12; k++) { const a = spin + k * 0.5236; g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * (r - 0.9), wy + Math.sin(a) * (r - 0.9)); } g.stroke();
    ell(g, wx, wy, 0.55, 0.55); g.fillStyle = '#9aa1ad'; g.fill();
  }
  // corrente, coroa e o quadro (com contorno)
  g.strokeStyle = '#4a4552'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(BB[0], BB[1] - 2); g.lineTo(wb, wy - 0.8); g.moveTo(BB[0], BB[1] + 2); g.lineTo(wb, wy + 0.8); g.stroke();
  ell(g, BB[0], BB[1], 2, 2); g.strokeStyle = '#c9ced6'; g.lineWidth = 0.5; g.stroke();
  const tube = (a, c, w = 1.15, cc = col) => limb2(g, [a[0], a[1], c[0], c[1]], w, cc);
  tube(BB, [wb, wy]); tube(ST, [wb, wy], 0.9); tube(BB, HB, 1.3); tube(ST, HT); tube(BB, [ST[0] + 0.3, ST[1] - 1.4]); tube(HB, [wa, wy], 0.9, '#d7dbe2');
  limb2(g, [HT[0], HT[1], HB[0], HB[1]], 1.4, col);
  limb2(g, [HT[0], HT[1], HT[0] - 0.6, HT[1] - 1.8, hand[0] - 0.6, hand[1] + 0.2, hand[0] + 0.2, hand[1] + 1.6], 0.6, '#2b2a33');   // guidão
  rr(g, ST[0] - 1.6, ST[1] - 2.6, 4.4, 1.3, 0.6); fillStroke(g, '#1c1b23', 0.35);   // selim
  // pedivela e pedais girando
  g.strokeStyle = '#9aa1ad'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(ped[0][0], ped[0][1]); g.lineTo(ped[1][0], ped[1][1]); g.stroke();
  for (const p of ped) { rr(g, p[0] - 1, p[1] - 0.35, 2, 0.7, 0.3); g.fillStyle = '#2b2a33'; g.fill(); }
  // ciclista: perna da frente, tronco inclinado, braços no guidão e capacete aerodinâmico
  limb2(g, leg(ped[0]), 1.7, '#2c3a5a');
  rr(g, ped[0][0] - 1.6, ped[0][1] - 1.4, 2.8, 1.3, 0.5); fillStroke(g, '#f2f2f4', 0.3);
  limb2(g, [hip[0], hip[1], sh[0], sh[1]], 3.2, mix(col, '#ffffff', 0.35));
  g.strokeStyle = '#1c1b23'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(lerp(hip[0], sh[0], 0.3), lerp(hip[1], sh[1], 0.3) - 1.4); g.lineTo(lerp(hip[0], sh[0], 0.7), lerp(hip[1], sh[1], 0.7) - 1.4); g.stroke();
  const elb = ikJoint(sh[0], sh[1], hand[0], hand[1], 3.9, 3.9, 1);
  limb2(g, [sh[0], sh[1], elb[0], elb[1], hand[0], hand[1]], 1.1, '#f1c7a1');
  ell(g, sh[0] - 1.8, sh[1] - 2.6, 2.3, 2.3); fillStroke(g, '#f1c7a1', 0.4);   // rosto
  g.fillStyle = '#1c1b23'; g.fillRect(sh[0] - 4.3, sh[1] - 3.2, 2.6, 0.9);   // óculos escuros
  g.beginPath(); g.moveTo(sh[0] - 4.6, sh[1] - 3.6); g.quadraticCurveTo(sh[0] - 3, sh[1] - 6.6, sh[0] + 0.6, sh[1] - 5.2); g.lineTo(sh[0] + 2.2, sh[1] - 4); g.quadraticCurveTo(sh[0] - 0.6, sh[1] - 3.4, sh[0] - 4.6, sh[1] - 3.6); g.closePath();
  fillStroke(g, vgrad(g, sh[1] - 6.6, sh[1] - 3.4, [[0, '#ffffff'], [1, '#ffbe0b']]), 0.45);
  g.strokeStyle = 'rgba(20,16,30,0.6)'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(sh[0] - 2.6, sh[1] - 5.4); g.lineTo(sh[0] - 1.8, sh[1] - 3.8); g.moveTo(sh[0] - 0.8, sh[1] - 5.2); g.lineTo(sh[0] - 0.2, sh[1] - 3.8); g.stroke();
  ell(g, x + 8.8, wy - 9.6, 0.9, 0.9); g.fillStyle = '#fff7d6'; g.fill(); emit(x + 8.6, wy - 9.6, 6, '#fff2c8', 0.7);   // farolete
  beam(g, x + 8, wy - 9.4, 26, 6, 0.16);
}
function drawTraffic(g, tr, t) {
  const x = tr.x, b = tr.y + tr.h, spin = -tr.x / 4.4, shake = tr.oops > 0 ? Math.sin(tr.oops * 1.4) * 0.6 : 0;
  g.save(); g.translate(shake, 0);
  g.fillStyle = 'rgba(8,4,16,0.38)'; ell(g, x + tr.w / 2, b + 0.4, tr.w * 0.52, 1.7); g.fill();
  if (tr.kind === 'fusca') drawFusca(g, tr, x, b, spin, t);
  else if (tr.kind === 'kombi') drawKombi(g, tr, x, b, spin, t);
  else if (tr.kind === 'moto') drawMoto(g, tr, x, b, spin, t);
  else if (tr.kind === 'bike') drawBike(g, tr, x, b, spin, t);
  else {
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
