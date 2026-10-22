'use strict';
// =================================================================== ladeira da Igreja Matriz (v11)
// Antes do chefe, a rua desce em direção à Igreja Matriz da Marechal. No topo o Merlin reaparece e avisa: "aperta os patins".
// A descida é uma ilusão: o chão continua reto, mas a câmera inclina, o fundo sobe, o vento passa e o herói ganha embalo sozinho.
// Subindo a ladeira vêm carros, motos, bicicletas e velhinhas: é pular por cima (no teto do carro dá para quicar).
// No meio, um corrimão que faz um loop completo; no fim, um ponto de ônibus com patinadores sentados filmando com o celular.
let traffic = [], loops = [], ladM = null;
const LT = { piano: 1.0, merlin: 5.5, tilt0: 9, tilt1: 14, tilt2: 141, tilt3: 148, stop: 141.5, loopC: 68, loopR: 34 };   // v12: 150 colunas, mais íngreme
const TILT_A = 0.13;      // inclinação máxima da câmera (rad, ~7,5°)
// v16: velocidade na ladeira. Segurando para frente, h.lspd sobe de 0 a 1 em ~15 s (LAD_ACC por quadro; só chega ao topo no fim da descida) e a velocidade-alvo vai
// de LAD_V0 a LAD_V1; soltando, cai em ~5 s (LAD_DEC). O velocímetro mostra |v| x KMH: LAD_V1 = 3,79 → ~76 km/h.
const LAD_ACC = 1 / 760, LAD_DEC = 0.0035, LAD_V0 = 2.0, LAD_V1 = 3.79, KMH = 20, SPEEDO_MAX = 75;
const LAD_ZOOM = 0.52;    // v13: na ladeira a câmera abre bem (personagem menor, campo de visão ~2x) para dar tempo de reagir
const LAD_X = c => (LAD.c0 + c) * TS;
// v13: tamanhos reais (13 unidades por metro; o herói tem ~1,6 m) e todos mais devagar
const TRAFFIC_DIM = { fusca: { w: 53, h: 20, vx: -0.8 }, kombi: { w: 58, h: 25.5, vx: -0.65 }, moto: { w: 25, h: 22, vx: -1.05 }, bike: { w: 23, h: 22, vx: -0.5 }, vovo: { w: 11, h: 19, vx: -0.22 } };
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
  const up = makeRail(LAD_X(LT.loopC - 10), 191, LAD_X(LT.loopC - 6), y);
  const entry = makeRail(LAD_X(LT.loopC - 6), y, cx, y), exit = makeRail(cx, y, LAD_X(LT.loopC + 5), y);
  up.keep = entry.keep = true;   // v16: a subida até o loop não freia (senão o herói cai antes de entrar)
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
  h.rail = null; h.loop = L; h.lt = Math.max(0, over) / L.R; h.loopVin = Math.abs(h.rs); h.rs = Math.max(Math.abs(h.rs), 2.7); h.face = 1;
  sfx('air', { vol: 0.6, rate: 0.9, pan: panOf(L.cx) }); sfx('grind_start', { vol: 0.6, rate: 1.2, pan: panOf(L.cx) });
}
function loopStep(h) {
  const L = h.loop; L.glow = 1; h.jbuf = 0; h.grindT++;
  h.rs = Math.max(2.2, h.rs - 0.07 * Math.sin(h.lt));
  h.lt += h.rs / L.R;
  if (h.lt >= Math.PI * 2) {
    const over = (h.lt - Math.PI * 2) * L.R;
    h.rs = Math.max(h.loopVin || 0, 2.2);   // sai com a mesma velocidade com que entrou
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
// v13: sensação de velocidade (0..1): forte na descida e em qualquer grind/loop; o efeito visual é maior que a velocidade real
let SPD = 0;
function updateSpeedFx() {
  const h = hero, tg = h.dead || G.state !== 'play' ? 0 : Math.max(slopeK(h.x + h.w / 2) * clamp(Math.abs(h.vx) / 1.8, 0, 1), h.loop ? 1 : h.rail ? clamp(Math.abs(h.rs) / 2.2, 0.45, 0.9) : 0);
  SPD += (tg - SPD) * (tg > SPD ? 0.12 : 0.05);
  if (SPD > 0.3 && h.onGround && !h.rail && !h.loop && G.frame % 3 === 0) part({ kind: 'puff', x: h.x + h.w / 2 - h.face * 3, y: h.y + h.h, vx: -h.face * rnd(0.6, 1.4), vy: -rnd(0.1, 0.4), col: '#cfc6dc', life: 22, size: rnd(1, 1.8), g: -0.005 });   // poeira dos patins
}
function updateLadeira() {
  updateSpeedFx();
  { // velocímetro: velocidade atual (suavizada) e a máxima atingida nas ladeiras
    const h = hero, v = h.rail || h.loop || h.ramp ? Math.abs(h.rs) : Math.abs(h.vx), on = G.state === 'play' && slopeK(h.x + h.w / 2) > 0.02;
    G.kmh = (G.kmh || 0) + (v * KMH - (G.kmh || 0)) * 0.2;
    if (on && !h.dead && !h.loop) G.kmhMax = Math.max(G.kmhMax || 0, v * KMH);   // pela velocidade real; o loop não conta
    G.speedoA = (G.speedoA || 0) + ((on ? 1 : 0) - (G.speedoA || 0)) * 0.08;
  }
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
  if ((k < 0.004 && SPD < 0.05) || G.state === 'title' || G.state === 'paused') { TBASE = TBASE_INV = null; return; }
  // inclinação + um tremor leve da câmera (a rua "vibra" com a velocidade)
  const a = TILT_A * k, s = Math.cos(a) + (W / H) * Math.sin(a) + 0.004 + 0.012 * SPD, jx = (hash(G.frame * 1.7) - 0.5) * 0.9 * K * SPD, jy = (hash(G.frame * 2.3 + 5) - 0.5) * 0.9 * K * SPD;
  TBASE = new DOMMatrix().translate(W / 2 + jx, H / 2 + jy).rotate(a * 180 / Math.PI).scale(s).translate(-W / 2, -H / 2); TBASE_INV = TBASE.inverse();
  _setT(TBASE);
}
function tiltEnd() {
  if (!TBASE) return;
  const sp = SPD;
  if (sp > 0.05) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    // vento: riscos passando na direção do movimento (mais rápidos que o herói: é aí que mora a sensação de velocidade)
    for (let i = 0; i < 30; i++) {
      const y = hash(i * 7.3) * H, len = (50 + hash(i * 3.1) * 140) * K * 0.12 * (0.5 + sp), x = W * 1.4 - ((G.t * (900 + hash(i) * 700) * K * 0.1 * (0.5 + sp) + hash(i * 9) * W * 1.8) % (W * 1.8));
      ctx.lineWidth = Math.max(1, K * (0.18 + 0.2 * hash(i * 2.2)));
      ctx.strokeStyle = `rgba(255,255,255,${0.24 * sp * (0.4 + hash(i * 5))})`; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    // linhas de velocidade nas bordas da tela (estilo mangá), piscando
    if (sp > 0.3) {
      const cx = W * 0.58, cy = H * 0.5, R = Math.hypot(W, H) * 0.55, seed = (G.frame >> 1) * 0.37;
      for (let i = 0; i < 34; i++) {
        const a = hash(i * 3.7 + seed) * Math.PI * 2, r0 = R * (0.62 + hash(i * 1.3 + seed) * 0.2);
        ctx.strokeStyle = `rgba(255,255,255,${0.15 * (sp - 0.3) / 0.7})`; ctx.lineWidth = Math.max(1, K * (0.3 + hash(i + seed) * 0.5));
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * R * 1.2, cy + Math.sin(a) * R * 1.2); ctx.stroke();
      }
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
// v13: veículos desenhados em METROS (medidas reais) e convertidos para o jogo com U unidades por metro; o herói (Baixinho,
// ~21 unidades) vale ~1,6 m. Frente sempre à esquerda (eles sobem a ladeira para a esquerda).
const U = 13;
const LW_M = 0.045;   // espessura do contorno, em metros
function limbM(g, pts, w, col) { g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.strokeStyle = OUT; g.lineWidth = w + 0.05; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
function drawFusca(g, tr, x, b, spin, t) {
  const col = tr.col, light = mix(col, '#ffffff', 0.4), dark = mix(col, '#000000', 0.4), bob = Math.sin(t * 9 + tr.seed) * 0.018, E = (mx, my) => [x + mx * U, b + my * U];
  smoke(g, x + 4.1 * U, b - 0.32 * U, t, tr.seed);
  g.save(); g.translate(x, b); g.scale(U, U); g.translate(0, bob);
  // carroceria: o "besouro" — capô baixo e curto, para-brisa inclinado, teto em cúpula e a tampa do motor caindo atrás
  const shell = () => { g.beginPath(); g.moveTo(0.14, -0.4); g.bezierCurveTo(0.06, -0.6, 0.16, -0.76, 0.42, -0.8); g.bezierCurveTo(0.8, -0.85, 1.14, -0.9, 1.4, -0.97);
    g.bezierCurveTo(1.58, -1.32, 1.84, -1.5, 2.28, -1.52); g.bezierCurveTo(2.84, -1.53, 3.22, -1.36, 3.46, -1.08); g.bezierCurveTo(3.76, -0.88, 4.02, -0.76, 4.04, -0.48); g.lineTo(4.0, -0.38); g.lineTo(0.14, -0.38); g.closePath(); };
  shell(); g.fillStyle = vgrad(g, -1.55, -0.38, [[0, light], [0.45, col], [1, dark]]); g.fill(); g.strokeStyle = OUT; g.lineWidth = LW_M; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.42)'; g.beginPath(); g.ellipse(2.45, -1.43, 0.55, 0.035, -0.05, 0, Math.PI * 2); g.fill();   // brilho do teto
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(0.9, -0.86, 0.38, 0.03, -0.12, 0, Math.PI * 2); g.fill();     // brilho do capô
  // para-lamas soltos e bem redondos (a marca do Fusca), com o estribo entre eles
  g.fillStyle = '#26232e'; g.fillRect(1.44, -0.47, 1.3, 0.09); g.fillStyle = '#c9ced6'; g.fillRect(1.44, -0.47, 1.3, 0.02);
  const fender = (a, c) => { g.beginPath(); g.moveTo(a, -0.4); g.bezierCurveTo(a + 0.04, -0.8, a + 0.36, -0.93, c, -0.93); g.bezierCurveTo(c + 0.32, -0.93, a + 1.24, -0.78, a + 1.3, -0.4); g.closePath();
    g.fillStyle = vgrad(g, -0.95, -0.4, [[0, light], [0.5, col], [1, dark]]); g.fill(); g.strokeStyle = OUT; g.lineWidth = LW_M; g.stroke(); };
  fender(0.18, 0.84); fender(2.66, 3.3);
  // vidros (porta e o vidrinho traseiro) com reflexo, e o motorista
  const win = () => { g.beginPath(); g.moveTo(1.56, -1.0); g.bezierCurveTo(1.68, -1.3, 1.9, -1.43, 2.16, -1.45); g.lineTo(2.4, -1.45); g.lineTo(2.4, -1.0); g.closePath();
    g.moveTo(2.52, -1.0); g.lineTo(2.52, -1.45); g.bezierCurveTo(2.86, -1.44, 3.12, -1.31, 3.3, -1.07); g.lineTo(3.24, -1.0); g.closePath(); };
  win(); g.fillStyle = vgrad(g, -1.46, -1.0, [[0, '#d8f2ff'], [1, '#4f7fa8']]); g.fill();
  g.save(); win(); g.clip();
  g.fillStyle = '#3b2a22'; ell(g, 2.12, -1.2, 0.13, 0.15); g.fill(); g.fillStyle = '#c98b5e'; ell(g, 2.0, -1.18, 0.07, 0.1); g.fill();
  g.strokeStyle = '#1c1b23'; g.lineWidth = 0.035; g.beginPath(); g.arc(1.88, -1.06, 0.12, Math.PI, Math.PI * 1.7); g.stroke();
  const rf = ((t * 0.4 + tr.seed * 0.3) % 1) * 2.6; g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(1.1 + rf, -1.5); g.lineTo(1.3 + rf, -1.5); g.lineTo(1.0 + rf, -0.98); g.lineTo(0.8 + rf, -0.98); g.closePath(); g.fill();
  g.restore();
  win(); g.strokeStyle = '#e2e6ec'; g.lineWidth = 0.035; g.stroke();
  // porta, maçaneta, friso cromado, grade do motor (as "guelras" da tampa traseira) e o escapamento duplo
  g.strokeStyle = 'rgba(20,16,30,0.55)'; g.lineWidth = 0.025; g.beginPath(); g.moveTo(1.48, -0.45); g.lineTo(1.52, -0.97); g.moveTo(2.46, -0.45); g.lineTo(2.46, -1.45); g.stroke();
  rr(g, 2.22, -0.92, 0.14, 0.035, 0.015); g.fillStyle = '#e2e6ec'; g.fill();
  g.strokeStyle = 'rgba(240,244,250,0.85)'; g.lineWidth = 0.025; g.beginPath(); g.moveTo(1.5, -0.74); g.lineTo(2.66, -0.74); g.stroke();
  g.strokeStyle = 'rgba(20,16,30,0.6)'; g.lineWidth = 0.022; g.beginPath(); for (let k = 0; k < 5; k++) { g.moveTo(3.56 + k * 0.07, -1.0 + k * 0.03); g.lineTo(3.6 + k * 0.07, -0.86 + k * 0.03); } g.stroke();
  g.fillStyle = '#9aa1ad'; for (const ey of [-0.36, -0.3]) { rr(g, 3.95, ey - 0.02, 0.18, 0.045, 0.02); g.fill(); }
  // retrovisor redondo, farol no para-lama (com aro cromado), pisca em cima e a lanterna gota atrás
  g.strokeStyle = '#c9ced6'; g.lineWidth = 0.025; g.beginPath(); g.moveTo(1.6, -1.0); g.lineTo(1.54, -1.12); g.stroke(); ell(g, 1.53, -1.14, 0.05, 0.05); fillStroke(g, '#e2e6ec', 0.02);
  g.beginPath(); g.ellipse(0.3, -0.8, 0.12, 0.13, -0.5, 0, Math.PI * 2); g.fillStyle = chrome(g, -0.93, -0.67); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.03; g.stroke();
  g.beginPath(); g.ellipse(0.27, -0.8, 0.07, 0.09, -0.5, 0, Math.PI * 2); g.fillStyle = '#fff7d6'; g.fill();
  ell(g, 0.62, -0.9, 0.04, 0.025); g.fillStyle = '#ffb347'; g.fill();
  g.beginPath(); g.ellipse(3.9, -0.72, 0.05, 0.1, 0.5, 0, Math.PI * 2); g.fillStyle = '#ff3b3b'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.02; g.stroke();
  // para-choques de lâmina com garras
  for (const [x0, x1] of [[-0.06, 0.34], [3.82, 4.16]]) { rr(g, x0, -0.5, x1 - x0, 0.07, 0.03); g.fillStyle = chrome(g, -0.5, -0.43); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.02; g.stroke(); }
  for (const gx of [0.08, 3.98]) { rr(g, gx, -0.6, 0.05, 0.22, 0.02); g.fillStyle = '#d7dbe2'; g.fill(); }
  // caixas de roda (o arco aberto do para-lama)
  g.fillStyle = '#0e0c14'; for (const ax of [0.84, 3.3]) { g.beginPath(); g.arc(ax, -0.32, 0.37, Math.PI, 0); g.closePath(); g.fill(); }
  g.restore();
  beam(g, x + 0.2 * U, b - 0.8 * U, 3.6 * U, 0.75 * U, 0.22); emit(...E(0.24, -0.8), 9, '#fff2c8', 0.85); emit(...E(3.9, -0.72), 5, '#ff3b3b', 0.6);
  tire(g, x + 0.84 * U, b - 0.31 * U, 0.31 * U, spin, 'calota'); tire(g, x + 3.3 * U, b - 0.31 * U, 0.31 * U, spin, 'calota');
}
function drawKombi(g, tr, x, b, spin, t) {
  const col = tr.col, bob = Math.sin(t * 8 + tr.seed) * 0.02, E = (mx, my) => [x + mx * U, b + my * U];
  smoke(g, x + 4.55 * U, b - 0.34 * U, t, tr.seed);
  g.save(); g.translate(x, b); g.scale(U, U); g.translate(0, bob);
  // o "pão de forma": caixa alta de cantos redondos, frente achatada levemente abaulada
  const body = () => { g.beginPath(); g.moveTo(0.14, -0.38); g.quadraticCurveTo(0.02, -0.4, 0.02, -0.55); g.bezierCurveTo(-0.05, -1.0, -0.04, -1.5, 0.08, -1.72); g.quadraticCurveTo(0.2, -1.96, 0.48, -1.96);
    g.lineTo(4.04, -1.96); g.quadraticCurveTo(4.48, -1.96, 4.48, -1.52); g.lineTo(4.48, -0.52); g.quadraticCurveTo(4.48, -0.38, 4.34, -0.38); g.closePath(); };
  body(); g.fillStyle = vgrad(g, -1.96, -0.4, [[0, '#ffffff'], [1, '#e4ded0']]); g.fill();
  // saia colorida com o "V" na frente (duas cores, a cara da Kombi)
  g.save(); body(); g.clip();
  g.beginPath(); g.moveTo(-0.1, -0.74); g.bezierCurveTo(0.22, -0.82, 0.42, -1.18, 0.7, -1.22); g.lineTo(4.6, -1.22); g.lineTo(4.6, -0.3); g.lineTo(-0.1, -0.3); g.closePath();
  g.fillStyle = vgrad(g, -1.22, -0.38, [[0, mix(col, '#ffffff', 0.15)], [1, mix(col, '#000000', 0.35)]]); g.fill();
  g.strokeStyle = '#e2e6ec'; g.lineWidth = 0.03; g.beginPath(); g.moveTo(-0.1, -0.74); g.bezierCurveTo(0.22, -0.82, 0.42, -1.18, 0.7, -1.22); g.lineTo(4.6, -1.22); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0.5, -1.9, 3.5, 0.03);
  g.restore();
  body(); g.strokeStyle = OUT; g.lineWidth = LW_M; g.stroke();
  // calha do teto e a fileira de janelas (a da cabine com o motorista)
  g.strokeStyle = 'rgba(40,36,50,0.5)'; g.lineWidth = 0.02; g.beginPath(); g.moveTo(0.4, -1.88); g.lineTo(4.1, -1.88); g.stroke();
  const wins = [[0.14, 0.98, 0.16], [1.12, 1.78, 0.06], [1.92, 2.58, 0.06], [2.72, 3.38, 0.06], [3.52, 4.3, 0.2]];
  const winPath = () => { g.beginPath(); for (const [a, c, rad] of wins) rr(g, a, -1.82, c - a, 0.5, rad); };
  for (const [a, c, rad] of wins) { rr(g, a, -1.82, c - a, 0.5, rad); g.fillStyle = vgrad(g, -1.82, -1.32, [[0, '#d8f2ff'], [1, '#4f7fa8']]); g.fill(); g.strokeStyle = '#c9ced6'; g.lineWidth = 0.03; g.stroke(); }
  g.save(); rr(g, 0.14, -1.82, 0.84, 0.5, 0.16); g.clip(); g.fillStyle = '#2a2433'; ell(g, 0.66, -1.5, 0.15, 0.17); g.fill(); g.fillStyle = '#f1c7a1'; ell(g, 0.53, -1.48, 0.07, 0.1); g.fill();
  g.strokeStyle = '#1c1b23'; g.lineWidth = 0.035; g.beginPath(); g.moveTo(0.3, -1.32); g.lineTo(0.42, -1.5); g.stroke(); g.restore();   // volante quase deitado
  g.save(); winPath(); g.clip(); const rf = ((t * 0.35 + tr.seed * 0.2) % 1) * 5; g.fillStyle = 'rgba(255,255,255,0.38)'; g.beginPath(); g.moveTo(rf - 0.3, -1.85); g.lineTo(rf, -1.85); g.lineTo(rf - 0.25, -1.3); g.lineTo(rf - 0.55, -1.3); g.closePath(); g.fill(); g.restore();
  // portas (cabine e a corrediça), frisos, maçanetas, as grelhas de ar do motor e o retrovisor de haste
  g.strokeStyle = 'rgba(20,16,30,0.5)'; g.lineWidth = 0.022; g.beginPath(); g.moveTo(1.04, -1.9); g.lineTo(1.04, -0.42); g.moveTo(1.06, -1.25); g.lineTo(2.1, -1.25); g.moveTo(2.1, -1.9); g.lineTo(2.1, -0.42); g.stroke();
  for (const hx of [0.86, 1.94]) { rr(g, hx, -1.12, 0.12, 0.035, 0.015); g.fillStyle = '#e2e6ec'; g.fill(); }
  g.fillStyle = '#26232e'; for (let k = 0; k < 6; k++) { rr(g, 3.72 + k * 0.09, -1.14, 0.045, 0.2, 0.02); g.fill(); }
  g.strokeStyle = '#c9ced6'; g.lineWidth = 0.025; g.beginPath(); g.moveTo(0.2, -1.32); g.lineTo(0.06, -1.42); g.stroke(); rr(g, -0.02, -1.5, 0.08, 0.13, 0.03); fillStroke(g, '#e2e6ec', 0.02);
  // farol redondo e pisca na frente, para-choques e a lanterninha de trás
  g.beginPath(); g.ellipse(0.0, -0.84, 0.06, 0.12, 0, 0, Math.PI * 2); g.fillStyle = chrome(g, -0.96, -0.72); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.025; g.stroke();
  g.beginPath(); g.ellipse(-0.01, -0.84, 0.035, 0.08, 0, 0, Math.PI * 2); g.fillStyle = '#fff7d6'; g.fill();
  ell(g, 0.02, -1.08, 0.035, 0.035); g.fillStyle = '#ffb347'; g.fill();
  for (const [x0, x1] of [[-0.08, 0.3], [4.22, 4.56]]) { rr(g, x0, -0.5, x1 - x0, 0.08, 0.03); g.fillStyle = chrome(g, -0.5, -0.42); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.02; g.stroke(); }
  rr(g, 4.42, -0.98, 0.06, 0.16, 0.02); g.fillStyle = '#ff3b3b'; g.fill();
  g.fillStyle = '#0e0c14'; for (const ax of [0.84, 3.24]) { g.beginPath(); g.arc(ax, -0.33, 0.39, Math.PI, 0); g.closePath(); g.fill(); }
  g.restore();
  beam(g, x - 0.02 * U, b - 0.84 * U, 3.6 * U, 0.75 * U, 0.22); emit(...E(0, -0.84), 9, '#fff2c8', 0.85); emit(...E(4.45, -0.9), 5, '#ff3b3b', 0.6);
  tire(g, x + 0.84 * U, b - 0.33 * U, 0.33 * U, spin, 'calota'); tire(g, x + 3.24 * U, b - 0.33 * U, 0.33 * U, spin, 'calota');
}
function drawMoto(g, tr, x, b, spin, t) {
  // moto de motoboy (tipo 125 cilindradas), com baú de entrega
  const col = tr.col, bob = Math.sin(t * 14 + tr.seed) * 0.012, E = (mx, my) => [x + mx * U, b + my * U];
  smoke(g, x + 1.95 * U, b - 0.5 * U, t * 1.4, tr.seed);
  tire(g, x + 0.33 * U, b - 0.31 * U, 0.31 * U, spin); tire(g, x + 1.62 * U, b - 0.31 * U, 0.31 * U, spin);
  g.save(); g.translate(x, b); g.scale(U, U); g.translate(0, bob);
  limbM(g, [1.62, -0.31, 1.0, -0.5], 0.07, '#2b2a33');                                   // balança traseira
  g.beginPath(); g.arc(1.62, -0.31, 0.37, Math.PI * 1.05, Math.PI * 1.7); g.strokeStyle = OUT; g.lineWidth = 0.1; g.stroke(); g.strokeStyle = col; g.lineWidth = 0.06; g.stroke();   // para-lama traseiro
  rr(g, 0.64, -0.8, 0.38, 0.34, 0.06); g.fillStyle = vgrad(g, -0.8, -0.46, [[0, '#6a7080'], [1, '#2b2a33']]); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.03; g.stroke();   // motor
  g.strokeStyle = 'rgba(210,214,222,0.6)'; g.lineWidth = 0.015; g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(0.67, -0.74 + k * 0.07); g.lineTo(0.98, -0.74 + k * 0.07); } g.stroke();
  limbM(g, [0.78, -0.44, 1.0, -0.36, 1.84, -0.5], 0.07, '#d7dbe2');                       // escapamento cromado
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.015; g.beginPath(); g.moveTo(1.05, -0.38); g.lineTo(1.8, -0.51); g.stroke();
  for (const dx of [0, 0.05]) limbM(g, [0.33 + dx, -0.31, 0.56 + dx, -0.98], 0.035, '#e2e6ec');   // garfo
  g.beginPath(); g.arc(0.33, -0.31, 0.36, Math.PI * 1.12, Math.PI * 1.62); g.strokeStyle = OUT; g.lineWidth = 0.09; g.stroke(); g.strokeStyle = col; g.lineWidth = 0.05; g.stroke();
  // tanque com faixa, banco, rabeta com lanterna e o farol
  g.beginPath(); g.moveTo(0.6, -0.94); g.bezierCurveTo(0.7, -1.08, 0.98, -1.07, 1.06, -0.96); g.lineTo(1.03, -0.82); g.lineTo(0.63, -0.82); g.closePath();
  g.fillStyle = vgrad(g, -1.07, -0.82, [[0, mix(col, '#ffffff', 0.45)], [0.5, col], [1, mix(col, '#000000', 0.3)]]); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.03; g.stroke();
  g.strokeStyle = '#ffffff'; g.lineWidth = 0.025; g.beginPath(); g.moveTo(0.66, -0.92); g.lineTo(1.0, -0.94); g.stroke();
  rr(g, 1.02, -0.92, 0.56, 0.08, 0.04); fillStroke(g, '#1c1b23', 0.02);
  g.beginPath(); g.moveTo(1.5, -0.9); g.lineTo(1.9, -0.96); g.lineTo(1.86, -0.82); g.lineTo(1.5, -0.8); g.closePath(); fillStroke(g, col, 0.025);
  rr(g, 1.86, -0.96, 0.06, 0.07, 0.02); g.fillStyle = '#ff3b3b'; g.fill();
  ell(g, 0.5, -0.9, 0.08, 0.08); g.fillStyle = chrome(g, -0.98, -0.82); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.025; g.stroke(); ell(g, 0.48, -0.9, 0.05, 0.05); g.fillStyle = '#fff7d6'; g.fill();
  limbM(g, [0.58, -0.98, 0.66, -1.06, 0.74, -1.04], 0.025, '#2b2a33');                    // guidão
  // motoboy: bota na pedaleira, calça, jaqueta com faixa refletiva, luva no punho, capacete com viseira
  const hip = [1.18, -0.95], foot = [0.98, -0.44], sh = [0.98, -1.42], hand = [0.73, -1.04];
  const knee = ikJoint(hip[0], hip[1], foot[0], foot[1], 0.44, 0.46, -1), elb = ikJoint(sh[0], sh[1], hand[0], hand[1], 0.28, 0.28, 1);
  rr(g, 1.24, -1.42, 0.44, 0.42, 0.05); g.fillStyle = vgrad(g, -1.42, -1.0, [[0, '#ff5a5f'], [1, '#c1121f']]); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.03; g.stroke();
  g.fillStyle = '#ffffff'; g.font = `800 0.11px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ENTREGA', 1.46, -1.24); g.fillRect(1.27, -1.14, 0.38, 0.02);
  limbM(g, [hip[0], hip[1], knee[0], knee[1], foot[0], foot[1]], 0.12, '#2c3a5a');
  rr(g, foot[0] - 0.12, foot[1] - 0.04, 0.2, 0.1, 0.04); fillStroke(g, '#1c1b23', 0.02);
  limbM(g, [hip[0], hip[1], sh[0], sh[1]], 0.24, '#2b2f3a');
  g.strokeStyle = '#d7f75b'; g.lineWidth = 0.035; g.beginPath(); g.moveTo(1.16, -1.16); g.lineTo(0.98, -1.2); g.stroke();
  limbM(g, [sh[0], sh[1], elb[0], elb[1], hand[0], hand[1]], 0.08, '#2b2f3a'); ell(g, hand[0], hand[1], 0.05, 0.05); fillStroke(g, '#1c1b23', 0.02);
  ell(g, 0.93, -1.6, 0.15, 0.15); g.fillStyle = vgrad(g, -1.75, -1.45, [[0, mix(col, '#ffffff', 0.45)], [1, col]]); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.03; g.stroke();
  g.beginPath(); g.moveTo(0.79, -1.63); g.quadraticCurveTo(0.86, -1.68, 0.96, -1.64); g.lineTo(0.94, -1.53); g.lineTo(0.8, -1.55); g.closePath(); fillStroke(g, '#1c2a3a', 0.02);
  g.fillStyle = 'rgba(255,255,255,0.6)'; ell(g, 0.86, -1.62, 0.04, 0.015, -0.2); g.fill();
  g.restore();
  beam(g, x + 0.44 * U, b - 0.9 * U, 3.0 * U, 0.6 * U, 0.24); emit(...E(0.48, -0.9), 8, '#fff2c8', 0.85); emit(...E(1.88, -0.92), 4, '#ff3b3b', 0.6);
}
function drawBike(g, tr, x, b, spin, t) {
  const col = tr.col, cr = -tr.t * 7, E = (mx, my) => [x + mx * U, b + my * U];
  g.save(); g.translate(x, b); g.scale(U, U);
  const r = 0.34, wa = 0.36, wb = 1.38, wy = -r, BB = [0.84, -0.3], ST = [1.0, -0.84], HT = [0.5, -0.86], HB = [0.46, -0.7];
  const ped = [[BB[0] + Math.cos(cr) * 0.17, BB[1] + Math.sin(cr) * 0.17], [BB[0] - Math.cos(cr) * 0.17, BB[1] - Math.sin(cr) * 0.17]];
  const hip = [1.0, -0.96], sh = [0.66, -1.42], hand = [0.44, -1.0];
  const leg = p => { const k = ikJoint(hip[0], hip[1], p[0], p[1], 0.44, 0.46, -1); return [hip[0], hip[1], k[0], k[1], p[0], p[1]]; };
  limbM(g, leg(ped[1]), 0.1, '#1f2a44');   // perna de trás (atrás do quadro)
  for (const wx of [wa, wb]) {   // rodas finas com 16 raios
    ell(g, wx, wy, r, r); g.strokeStyle = OUT; g.lineWidth = 0.075; g.stroke(); g.strokeStyle = '#2c2a33'; g.lineWidth = 0.045; g.stroke();
    ell(g, wx, wy, r - 0.045, r - 0.045); g.strokeStyle = '#c9ced6'; g.lineWidth = 0.02; g.stroke();
    g.strokeStyle = 'rgba(210,214,222,0.75)'; g.lineWidth = 0.008; g.beginPath(); for (let k = 0; k < 16; k++) { const a = spin + k * 0.3927; g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * (r - 0.05), wy + Math.sin(a) * (r - 0.05)); } g.stroke();
    ell(g, wx, wy, 0.03, 0.03); g.fillStyle = '#9aa1ad'; g.fill();
  }
  g.strokeStyle = '#4a4552'; g.lineWidth = 0.02; g.beginPath(); g.moveTo(BB[0], BB[1] - 0.1); g.lineTo(wb, wy - 0.04); g.moveTo(BB[0], BB[1] + 0.1); g.lineTo(wb, wy + 0.04); g.stroke();
  ell(g, BB[0], BB[1], 0.1, 0.1); g.strokeStyle = '#c9ced6'; g.lineWidth = 0.025; g.stroke();
  const tube = (a, c, w = 0.055, cc = col) => limbM(g, [a[0], a[1], c[0], c[1]], w, cc);
  tube(BB, [wb, wy]); tube(ST, [wb, wy], 0.04); tube(BB, HB, 0.065); tube(ST, HT); tube(BB, [ST[0] + 0.02, ST[1] - 0.06]); tube(HB, [wa, wy], 0.04, '#d7dbe2');
  limbM(g, [HT[0], HT[1], HB[0], HB[1]], 0.07, col);
  limbM(g, [HT[0], HT[1], HT[0] - 0.03, HT[1] - 0.1, hand[0], hand[1], hand[0] + 0.04, hand[1] + 0.08], 0.03, '#2b2a33');   // guidão
  rr(g, ST[0] - 0.1, ST[1] - 0.12, 0.24, 0.06, 0.03); fillStroke(g, '#1c1b23', 0.02);
  g.strokeStyle = '#9aa1ad'; g.lineWidth = 0.025; g.beginPath(); g.moveTo(ped[0][0], ped[0][1]); g.lineTo(ped[1][0], ped[1][1]); g.stroke();
  for (const p of ped) { rr(g, p[0] - 0.05, p[1] - 0.018, 0.1, 0.036, 0.015); g.fillStyle = '#2b2a33'; g.fill(); }
  // ciclista: perna da frente, tronco inclinado, braços no guidão, capacete com aberturas e óculos escuros
  limbM(g, leg(ped[0]), 0.11, '#2c3a5a');
  rr(g, ped[0][0] - 0.09, ped[0][1] - 0.08, 0.16, 0.07, 0.03); fillStroke(g, '#f2f2f4', 0.015);
  limbM(g, [hip[0], hip[1], sh[0], sh[1]], 0.2, mix(col, '#ffffff', 0.35));
  const elb = ikJoint(sh[0], sh[1], hand[0], hand[1], 0.27, 0.27, 1);
  limbM(g, [sh[0], sh[1], elb[0], elb[1], hand[0], hand[1]], 0.07, '#f1c7a1');
  ell(g, sh[0] - 0.1, sh[1] - 0.16, 0.13, 0.13); fillStroke(g, '#f1c7a1', 0.025);
  g.fillStyle = '#1c1b23'; g.fillRect(sh[0] - 0.25, sh[1] - 0.2, 0.15, 0.05);
  g.beginPath(); g.moveTo(sh[0] - 0.26, sh[1] - 0.22); g.quadraticCurveTo(sh[0] - 0.16, sh[1] - 0.4, sh[0] + 0.04, sh[1] - 0.32); g.lineTo(sh[0] + 0.12, sh[1] - 0.24); g.quadraticCurveTo(sh[0] - 0.04, sh[1] - 0.2, sh[0] - 0.26, sh[1] - 0.22); g.closePath();
  g.fillStyle = vgrad(g, sh[1] - 0.4, sh[1] - 0.2, [[0, '#ffffff'], [1, '#ffbe0b']]); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.025; g.stroke();
  ell(g, 0.52, -0.8, 0.035, 0.035); g.fillStyle = '#fff7d6'; g.fill();
  g.restore();
  emit(...E(0.52, -0.8), 6, '#fff2c8', 0.7); beam(g, x + 0.5 * U, b - 0.8 * U, 2.0 * U, 0.4 * U, 0.16);
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

// ---------- velocímetro (v16): aparece nas ladeiras, de 0 a 75 km/h, com a máxima atingida
function drawSpeedo(u) {
  const a = G.speedoA || 0; if (a < 0.02 || G.state === 'title') return;
  const R = 76 * u, cx = W - R - 34 * u, cy = H * 0.5, v = clamp(G.kmh || 0, 0, 79), a0 = Math.PI * 0.75, sw = Math.PI * 1.5, ang = k => a0 + sw * clamp(k / SPEEDO_MAX, 0, 1.05);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
  ell(ctx, cx, cy, R + 10 * u, R + 10 * u); ctx.fillStyle = 'rgba(14,10,24,0.88)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2 * u; ctx.stroke();
  // faixa colorida (verde → amarelo → vermelho a partir de 60) e o trecho já percorrido
  ctx.lineCap = 'butt'; ctx.lineWidth = 9 * u;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.arc(cx, cy, R - 6 * u, a0, a0 + sw); ctx.stroke();
  const gr = ctx.createLinearGradient(cx - R, 0, cx + R, 0); gr.addColorStop(0, '#b6ff3b'); gr.addColorStop(0.6, '#ffd23f'); gr.addColorStop(1, '#ff3b4a');
  ctx.strokeStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R - 6 * u, a0, ang(v)); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,59,74,0.55)'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(cx, cy, R + 2 * u, ang(60), ang(75)); ctx.stroke();
  // marcas a cada 5 km/h, números a cada 15
  for (let k = 0; k <= 75; k += 5) {
    const t = ang(k), big = k % 15 === 0, r0 = R - (big ? 20 : 15) * u, r1 = R - 12 * u;
    ctx.strokeStyle = k >= 60 ? '#ff6b76' : '#e8e2f6'; ctx.lineWidth = (big ? 2.4 : 1.2) * u;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * r0, cy + Math.sin(t) * r0); ctx.lineTo(cx + Math.cos(t) * r1, cy + Math.sin(t) * r1); ctx.stroke();
    if (big) uiText(String(k), cx + Math.cos(t) * (R - 32 * u), cy + Math.sin(t) * (R - 32 * u), 12 * u, k >= 60 ? '#ff6b76' : '#cfc8de', 'center', 800, FONT_UI, false);
  }
  // marca da máxima e o ponteiro
  if ((G.kmhMax || 0) > 1) { const t = ang(G.kmhMax); ctx.fillStyle = '#7fd4ff'; ctx.beginPath(); ctx.arc(cx + Math.cos(t) * (R - 6 * u), cy + Math.sin(t) * (R - 6 * u), 4 * u, 0, Math.PI * 2); ctx.fill(); }
  const t = ang(v), shake = v > 70 ? (Math.random() - 0.5) * 0.03 : 0;
  ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 3.6 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - Math.cos(t + shake) * 10 * u, cy - Math.sin(t + shake) * 10 * u); ctx.lineTo(cx + Math.cos(t + shake) * (R - 16 * u), cy + Math.sin(t + shake) * (R - 16 * u)); ctx.stroke();
  ell(ctx, cx, cy, 7 * u, 7 * u); ctx.fillStyle = '#ff7a1a'; ctx.fill(); ctx.strokeStyle = '#140f1f'; ctx.lineWidth = 2 * u; ctx.stroke();
  if (v > 70) glow(ctx, cx, cy, R * 0.9, '#ff3b4a', 0.25 + 0.15 * Math.sin(G.t * 20));
  uiText(String(Math.round(v)), cx, cy + R * 0.42, 30 * u, v >= 60 ? '#ff9a3c' : '#ffffff', 'center', 800, FONT_UI);
  uiText('KM/H', cx, cy + R * 0.42 + 20 * u, 11 * u, '#9a93ad', 'center', 800, FONT_UI, false);
  uiText('MÁX ' + Math.round(G.kmhMax || 0) + ' KM/H', cx, cy + R + 24 * u, 15 * u, '#7fd4ff', 'center', 800, FONT_UI);
  uiText('SEGURE → PARA ACELERAR', cx, cy - R - 20 * u, 13 * u, '#c8ff5a', 'center', 800, FONT_UI);
  ctx.restore();
}
