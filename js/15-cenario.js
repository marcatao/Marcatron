'use strict';
// =================================================================== cenário: céu, cidade em camadas, outdoors, rua e pós-efeitos
// v9 (pedido do usuário): a fase acontece no Paço Municipal de São Bernardo do Campo e arredores. A Prefeitura (lâmina de vidro
// de 19 andares com o cilindro de concreto) fica logo no começo, atrás do treino do Merlin; na esplanada, o espelho d'água com
// chafariz, as bandeiras e o busto de Dom Pedro I; depois a Câmara, a passarela, o corredor de trólebus, o Parque da Juventude
// (a pista de skate em frente ao Paço), os prédios do centro e a Igreja Matriz perto do palco. Cenário mais limpo que o da v8:
// sem cartazes colados e neon, poucos letreiros, menos janelas acesas e mais espaço entre os prédios.
const SHOPS = ['VINIL & CIA', 'PADARIA DO CENTRO', 'BRECHÓ PUNK', 'CORDAS & CAFÉ', 'PIZZARIA DISTORÇÃO', 'FITA K7 RETRÔ', 'LANCHONETE DO ROADIE', 'BANCA DO ZÉ'];
const FAR = [], MID = [], NEAR = [], LAMPS = [];
let AI_TOWER = null;
// marcos, em unidades das camadas: MID (paralaxe 0,3) e NEAR (0,68)
const PREF = { kind: 'pref', x: 160, w: 200, h: 158, cx: 256, seed: 19 };   // torre da Prefeitura sobre o embasamento comprido
const IGREJA = { kind: 'igreja', x: 1780, w: 96, h: 150, seed: 23 };       // Igreja Matriz (fachada rosa e creme, torre do relógio)
const PACO = { pool: [262, 478], flags: [124, 146], bust: 600 };           // esplanada (NEAR)
const TROLLEY = { x0: 1245, x1: 2440, y: 168 };                           // fios do trólebus (NEAR)
(function genLayers() {
  // longe: a serra ao fundo e a silhueta dos prédios do centro
  FAR.push({ hill: true, x: -200, w: LW * 0.12 * PX + 1400 });
  let r = rng(1201), x = -60;
  while (x < LW * 0.12 * PX + 900) {
    const w = 10 + r() * 18, h = 28 + r() * 66 * (0.55 + 0.45 * Math.abs(Math.sin(x * 0.009)));
    FAR.push({ x, w, h, tank: r() < 0.45, ant: r() < 0.15, seed: (r() * 1e6) | 0 });
    x += w + 3 + r() * 14;
  }
  AI_TOWER = { x: LW * 0.12 * PX * 0.9 + 160, h: 150 };
  // meio: prédios residenciais do centro (mais espaçados, poucas janelas acesas); espaço livre em volta da Prefeitura e da Matriz
  MID.push(PREF, IGREJA);
  r = rng(2302); x = -80;
  const cols = ['#2f2946', '#2c2f4a', '#352d4c', '#2a2a42', '#33304a'];
  while (x < LW * 0.3 * PX + 900) {
    const w = 26 + r() * 30, h = 56 + r() * 92;
    const clash = (o, pad) => x + w > o.x - pad && x < o.x + o.w + pad;
    if (clash(PREF, 4) || clash(IGREJA, 6)) { x += 20; continue; }
    MID.push({ x, w, h, col: cols[(r() * cols.length) | 0], seed: (r() * 1e6) | 0, tank: r() < 0.6, bal: r() < 0.65 });
    x += w + 8 + r() * 30;
  }
  // perto: os lugares na ordem da fase
  const N = o => NEAR.push(o), sd = () => (r() * 1e6) | 0;
  r = rng(3403);
  // esplanada do Paço
  N({ kind: 'tree', x: 2, w: 22, seed: 11 }); N({ kind: 'hedge', x: 34, w: 60 });
  N({ kind: 'flags', x: PACO.flags[0] - 4, w: 30 });
  N({ kind: 'hedge', x: 170, w: 64 }); N({ kind: 'bench', x: 236, w: 14 });
  N({ kind: 'pool', x: PACO.pool[0], w: PACO.pool[1] - PACO.pool[0] });
  N({ kind: 'tree', x: 500, w: 22, seed: 12 }); N({ kind: 'hedge', x: 526, w: 50 });
  N({ kind: 'bust', x: PACO.bust - 8, w: 16 });
  N({ kind: 'tree', x: 646, w: 22, seed: 13 }); N({ kind: 'hedge', x: 672, w: 62 });
  // Câmara Municipal e a passarela de concreto por cima da avenida
  N({ kind: 'camara', x: 760, w: 196 });
  N({ kind: 'passarela', x: 985, w: 240 });
  // centro, trecho A: prédios baixos, ponto e fios do trólebus (os fios ficam na frente dos prédios)
  const bcols = ['#4a3a4f', '#3d3a52', '#4b3d36', '#3a4150', '#463448'], awns = ['#c0392b', '#2d6a4f', '#1f4e8c', '#d35400', '#6d2e8c'];
  let si = 0;
  const city = (x0, x1, skip) => {
    let x = x0;
    while (x < x1 - 70) {
      if (skip && x > skip[0] - 70 && x < skip[1]) { x = skip[1]; continue; }
      const w = 62 + r() * 46, h = 40 + r() * 36;
      N({ kind: 'bldg', x, w, h, col: bcols[(r() * bcols.length) | 0], name: r() < 0.55 ? SHOPS[si++ % SHOPS.length] : null, awn: r() < 0.35 ? awns[(r() * awns.length) | 0] : null, seed: sd() });
      const gap = 20 + r() * 34;
      if (r() < 0.65) { const ipe = r() < 0.4; N({ kind: ipe ? 'ipe' : 'tree', x: x + w + gap / 2 - 11, w: 22, seed: sd(), bloom: r() < 0.5 ? '#ff8cc6' : '#ffd23f' }); }
      x += w + gap;
    }
  };
  city(1250, TROLLEY.x1, [1650, 1740]);
  for (let x2 = 2470; x2 < 2950; x2 += 60 + r() * 50) N({ kind: 'tree', x: x2, w: 22, seed: sd() });   // árvores da avenida antes do parque
  N({ kind: 'shelter', x: 1670, w: 54 });
  N({ kind: 'wires', x: TROLLEY.x0, w: TROLLEY.x1 - TROLLEY.x0 });
  // Parque da Juventude: a pista de skate em frente ao Paço (fica atrás da pista em U da fase)
  N({ kind: 'park', x: 2960, w: 600 });
  // centro, trecho B
  city(3580, 3900, null);
  N({ kind: 'wires', x: 3580, w: 320 });
  // arena do chefe: só árvores (o paredão de som e o backstage tampam o resto)
  for (let x2 = 3930; x2 < 4440; x2 += 70 + r() * 50) N({ kind: 'tree', x: x2, w: 22, seed: sd() });
  // Praça da Matriz: palmeiras, canteiros e bancos
  for (let x2 = 4470; x2 < LW * 0.68 * PX + 900; x2 += 90 + r() * 40) { N({ kind: 'palm', x: x2, w: 22, seed: sd() }); if (r() < 0.6) N({ kind: 'hedge', x: x2 + 30, w: 40 }); if (r() < 0.4) N({ kind: 'bench', x: x2 + 50, w: 14 }); }
  // postes: os altos da esplanada, os da rua, as torres de luz do parque e os de globo da praça
  const lamp = (lx, style) => LAMPS.push({ x: lx, style, seed: (hash(lx | 0) * 1e6) | 0 });
  for (const lx of [30, 250, 492, 728]) lamp(lx, 'paco');
  for (let lx = 1300; lx < 2440; lx += 210) lamp(lx, 'rua');
  for (const lx of [2992, 3536]) lamp(lx, 'flood');
  for (const lx of [2560, 2780]) lamp(lx, 'rua');
  for (let lx = 3640; lx < 3900; lx += 210) lamp(lx, 'rua');
  for (const lx of [3990, 4310]) lamp(lx, 'rua');
  for (let lx = 4520; lx < LW * 0.68 * PX + 900; lx += 170) lamp(lx, 'globo');
})();

// ---------- camada em pedaços cacheados (desenhados uma vez por escala)
const LY0 = -44, LY1 = 286;               // faixa vertical pintada nas camadas de fundo (unidades da camada)
// altura do chão na tela: com controles de toque, deixa ~100 px de tela abaixo da calçada para os botões
const groundFrac = () => touchUI ? clamp(1 - 100 / Math.max(300, cssH), 0.72, 0.8) : 0.8;
// topo da tela, em unidades da camada, para uma camada com paralaxe f (o chão da rua de trás fica alinhado com a calçada)
function layerTop(f) { return 200 - groundFrac() * BGH + (cam.y - camBaseY()) * PX * f * 0.55; }
class ChunkLayer {
  constructor(f, res, paint, list, cw = 160, post = null) { this.f = f; this.res = res; this.paint = paint; this.list = list; this.cw = cw; this.post = post; this.cache = new Map(); this.order = []; }
  clear() { this.cache.clear(); this.order = []; }
  get(i) {
    let c = this.cache.get(i); if (c) return c;
    const s = KB * this.res;
    c = mk(Math.ceil(this.cw * s) + 3, Math.ceil((LY1 - LY0) * s));
    const g = c.getContext('2d'); g.scale(s, s); g.translate(-i * this.cw, -LY0);
    const x0 = i * this.cw - 2, x1 = (i + 1) * this.cw + 4 / s + 2;
    for (const o of this.list) if (o.x < x1 && o.x + o.w + 40 > x0) this.paint(g, o);
    if (this.post) this.post(g, i * this.cw - 2, (i + 1) * this.cw + 8);
    this.cache.set(i, c); this.order.push(i);
    if (this.order.length > 8) this.cache.delete(this.order.shift());
    return c;
  }
  draw(camX) {
    const lx = camX * this.f * PX, ly = layerTop(this.f), i0 = Math.floor(lx / this.cw), i1 = Math.floor((lx + W / KB) / this.cw);
    const y = Math.round((LY0 - ly) * KB);
    for (let i = i0; i <= i1; i++) { const c = this.get(i); ctx.drawImage(c, Math.round((i * this.cw - lx) * KB), y, c.width / this.res, c.height / this.res); }
  }
}

function paintFar(g, b) {
  const base = 190;
  if (b.hill) {   // a serra ao fundo, em silhueta suave
    g.fillStyle = vgrad(g, 128, base, [[0, '#2b1f4e'], [1, '#3e2961']]);
    g.beginPath(); g.moveTo(b.x, base);
    for (let x = b.x; x <= b.x + b.w; x += 8) g.lineTo(x, 152 - 13 * Math.sin(x * 0.006) - 7 * Math.sin(x * 0.017 + 1) - 3 * Math.sin(x * 0.05));
    g.lineTo(b.x + b.w, base); g.closePath(); g.fill(); return;
  }
  const top = base - b.h;
  g.fillStyle = vgrad(g, top, base, [[0, '#2d1f50'], [1, '#48296b']]); g.fillRect(b.x, top, b.w, b.h);
  if (b.tank) g.fillRect(b.x + b.w * 0.25, top - 4, b.w * 0.35, 4);   // caixa d'água
  if (b.ant) { g.strokeStyle = '#3a2a5c'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(b.x + b.w * 0.7, top); g.lineTo(b.x + b.w * 0.7, top - 10); g.stroke(); }
  const r = rng(b.seed); g.fillStyle = 'rgba(255,200,130,0.45)';
  for (let y = top + 5; y < base - 4; y += 5) for (let x = b.x + 2; x < b.x + b.w - 2; x += 4) if (r() < 0.06) g.fillRect(x, y, 1.2, 1.6);
}
function paintAITower(g) {
  const t = AI_TOWER, x = t.x, base = 190;
  g.fillStyle = vgrad(g, base - t.h, base, [[0, '#24183e'], [1, '#3b2558']]);
  g.beginPath(); g.moveTo(x - 9, base); g.lineTo(x - 3, base - t.h + 30); g.lineTo(x + 3, base - t.h + 30); g.lineTo(x + 9, base); g.closePath(); g.fill();
  ell(g, x, base - t.h + 26, 14, 5); g.fill(); g.fillRect(x - 1, base - t.h - 12, 2, 40);
  ell(g, x, base - t.h + 14, 7, 7); g.fill();
}
function paintMid(g, b) {
  if (b.kind === 'pref') return paintPrefeitura(g, b);
  if (b.kind === 'igreja') return paintIgreja(g, b);
  const base = 200, top = base - b.h, r = rng(b.seed);
  g.fillStyle = vgrad(g, top, base, [[0, b.col], [1, mix(b.col, '#120c1e', 0.55)]]); g.fillRect(b.x, top, b.w, b.h + 40);
  g.fillStyle = 'rgba(255,190,230,0.07)'; g.fillRect(b.x, top, 1.2, b.h);
  g.fillStyle = mix(b.col, '#0b0712', 0.35); g.fillRect(b.x - 1, top - 2, b.w + 2, 2.6);
  // andares: faixa das sacadas e poucas janelas acesas
  const fl = 7.4, n = Math.floor((b.h - 8) / fl), nc = Math.max(2, Math.floor((b.w - 4) / 8)), cw = (b.w - 4) / nc;
  for (let i = 0; i < n; i++) {
    const y = top + 5 + i * fl;
    if (b.bal) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(b.x + 2, y + 5.1, b.w - 4, 0.9); }
    for (let j = 0; j < nc; j++) { const v = r(); g.fillStyle = v < 0.1 ? '#ffcf78' : v < 0.13 ? '#9fdcff' : 'rgba(10,6,20,0.42)'; g.fillRect(b.x + 2 + j * cw + (cw - 4.6) / 2, y, 4.6, 3.6); }
  }
  if (b.tank) { const tx = b.x + b.w * (0.2 + r() * 0.4); g.fillStyle = mix(b.col, '#0b0712', 0.25); g.fillRect(tx, top - 7, 12, 7); g.fillRect(tx + 2, top - 9, 8, 2); }
}
// ---------- Paço Municipal: a lâmina de vidro de 19 andares, o cilindro de concreto colado nela e o embasamento comprido
function paintPrefeitura(g, b) {
  const base = 200, cx = b.cx, sw = 30, cw = 14, top = base - b.h, py = base - 16;
  const sx0 = cx - (sw + cw) / 2, sx1 = sx0 + sw, ccx = sx1 + cw / 2, r = rng(b.seed);
  // embasamento: bloco baixo e comprido, vidro aceso e pilares
  g.fillStyle = vgrad(g, py, base, [[0, '#4d4762'], [1, '#2a2638']]); g.fillRect(b.x, py, b.w, 16);
  g.fillStyle = '#625b78'; g.fillRect(b.x - 2, py - 2, b.w + 4, 2.4);
  g.fillStyle = 'rgba(255,214,150,0.5)'; for (let x = b.x + 4; x < b.x + b.w - 6; x += 9) g.fillRect(x, py + 4, 6, 7);
  g.fillStyle = '#211d2c'; for (let x = b.x + 2; x < b.x + b.w; x += 18) g.fillRect(x, py + 2, 1.6, 14);
  // lâmina de vidro azul-escuro com caixilhos finos e as salas acesas em faixas
  g.fillStyle = vgrad(g, top, py, [[0, '#2f3f6c'], [0.5, '#1f2c52'], [1, '#151e3a']]); g.fillRect(sx0, top, sw, py - top);
  const fh = (py - top - 6) / 19;
  for (let i = 0; i < 19; i++) {
    const y = top + 5 + i * fh, band = r();
    for (let j = 0; j < 7; j++) {
      const w = (sw - 2.8) / 7, x = sx0 + 1.4 + j * w, on = band < 0.42 ? r() < 0.72 : r() < 0.1;
      g.fillStyle = on ? (j % 3 === 0 ? '#fff0c4' : '#ffd88c') : 'rgba(120,150,210,0.16)';
      g.fillRect(x + 0.3, y + 0.5, w - 0.6, fh - 1.5);
    }
    g.fillStyle = 'rgba(8,10,24,0.85)'; g.fillRect(sx0, y + fh - 1, sw, 1);
  }
  g.fillStyle = 'rgba(170,200,255,0.12)'; g.fillRect(sx0, top, 2, py - top);
  // cilindro de concreto (a circulação), um pouco mais alto que a lâmina, com luz de baixo para cima
  const ct = top - 6, cgr = g.createLinearGradient(sx1, 0, sx1 + cw, 0);
  cgr.addColorStop(0, '#91877a'); cgr.addColorStop(0.45, '#cdc2a9'); cgr.addColorStop(1, '#6a6255');
  g.fillStyle = cgr; g.fillRect(sx1, ct, cw, py - ct); ell(g, ccx, ct, cw / 2, 1.6); g.fill();
  g.strokeStyle = 'rgba(60,52,40,0.45)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(ccx + 1.6, ct + 2); g.lineTo(ccx + 1.6, py); g.stroke();
  const ug = g.createLinearGradient(0, py, 0, ct); ug.addColorStop(0, 'rgba(255,220,160,0.38)'); ug.addColorStop(0.55, 'rgba(255,220,160,0)'); g.fillStyle = ug; g.fillRect(sx1, ct, cw, py - ct);
  // coroa: moldura metálica em volta do topo da lâmina e o mastro da antena
  g.fillStyle = '#3d4054'; g.fillRect(sx0 - 2.4, top - 3.2, sw + 4.8, 2.2); g.fillRect(sx0 - 2.4, top - 3.2, 1.2, 6); g.fillRect(sx1 + 1.2, top - 3.2, 1.2, 6);
  g.strokeStyle = '#3d4054'; g.lineWidth = 0.45; g.beginPath(); for (let x = sx0 - 1.6; x < sx1 + 2; x += 2.6) { g.moveTo(x, top - 3); g.lineTo(x, top); } g.stroke();
  g.fillStyle = '#2c2e3c'; g.fillRect(cx - 4.4, top - 26, 0.9, 23);
  // letreiro discreto no embasamento
  g.fillStyle = 'rgba(255,240,214,0.85)'; g.font = `800 5px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PAÇO MUNICIPAL', b.x + 46, py - 5.4);
}
// ---------- Igreja Matriz: fachada rosa e creme com frontão, portas em arco e a torre do relógio à direita
function paintIgreja(g, b) {
  const base = 200, x0 = b.x, fw = 70, fx1 = x0 + fw, fy = base - 58;
  const PINK = '#e58f7a', PINK_D = '#b35d4d', CREAM = '#f3e3c4', CREAM_D = '#c9b28a', DOOR = '#3a1f22', LIT = '#ffd98e';
  const arch = (x, y, w, h, col) => { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.fillStyle = col; g.fill(); };
  g.fillStyle = '#857d90'; for (let i = 0; i < 4; i++) g.fillRect(x0 - 8 + i * 2, base - 2 - i * 2, fw + 16 - i * 4, 2);   // escadaria
  g.fillStyle = vgrad(g, fy, base, [[0, PINK], [1, PINK_D]]); g.fillRect(x0, fy, fw, base - 8 - fy);
  g.fillStyle = CREAM; for (const px of [x0, x0 + 18, x0 + fw - 22, x0 + fw - 4]) g.fillRect(px, fy, 4, base - 8 - fy);
  g.fillRect(x0 - 2, fy - 3, fw + 4, 3.4); g.fillRect(x0 - 1, fy + 24, fw + 2, 2);
  g.beginPath(); g.moveTo(x0 - 2, fy - 3); g.lineTo(x0 + fw / 2, fy - 22); g.lineTo(fx1 + 2, fy - 3); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x0 + 7, fy - 5.4); g.lineTo(x0 + fw / 2, fy - 17.6); g.lineTo(fx1 - 7, fy - 5.4); g.closePath(); g.fillStyle = PINK; g.fill();
  g.fillStyle = CREAM; g.fillRect(x0 + fw / 2 - 0.6, fy - 31, 1.2, 9); g.fillRect(x0 + fw / 2 - 2.6, fy - 28.4, 5.2, 1.2);
  for (const sx of [x0 + 0.5, fx1 - 3.5]) { g.fillRect(sx, fy - 9, 3, 6); ell(g, sx + 1.5, fy - 10.2, 1.4, 1.5); g.fill(); }   // estátuas
  arch(x0 + 29, base - 30, 12, 22, DOOR); arch(x0 + 7, base - 25, 8, 17, DOOR); arch(fx1 - 15, base - 25, 8, 17, DOOR);
  arch(x0 + 30, fy + 5, 10, 16, LIT); arch(x0 + 8, fy + 6, 6, 13, LIT); arch(fx1 - 14, fy + 6, 6, 13, LIT);
  ell(g, x0 + fw / 2, fy - 9.5, 3.2, 3.2); g.fillStyle = LIT; g.fill();
  // torre do sino
  const tx = fx1 + 4, tw = 17, ty = base - 106;
  g.fillStyle = vgrad(g, ty, base, [[0, PINK], [1, PINK_D]]); g.fillRect(tx, ty, tw, base - 8 - ty);
  g.fillStyle = CREAM; g.fillRect(tx, ty, 2.6, base - 8 - ty); g.fillRect(tx + tw - 2.6, ty, 2.6, base - 8 - ty);
  for (const yy of [ty + 24, ty + 48, ty + 74]) g.fillRect(tx - 1, yy, tw + 2, 2.2);
  ell(g, tx + tw / 2, ty + 36, 4.6, 4.6); g.fillStyle = CREAM; g.fill(); g.strokeStyle = '#4a3a30'; g.lineWidth = 0.5;
  g.beginPath(); g.moveTo(tx + tw / 2, ty + 36); g.lineTo(tx + tw / 2, ty + 33); g.moveTo(tx + tw / 2, ty + 36); g.lineTo(tx + tw / 2 + 2.2, ty + 37); g.stroke();   // relógio
  arch(tx + 5, ty + 7, 7, 13, '#2a1a1c');
  g.beginPath(); g.moveTo(tx - 1.4, ty); g.lineTo(tx + tw / 2, ty - 24); g.lineTo(tx + tw + 1.4, ty); g.closePath(); g.fillStyle = CREAM; g.fill();
  g.beginPath(); g.moveTo(tx + tw / 2, ty - 24); g.lineTo(tx + tw + 1.4, ty); g.lineTo(tx + tw / 2, ty); g.closePath(); g.fillStyle = CREAM_D; g.fill();
  g.fillStyle = CREAM; g.fillRect(tx + tw / 2 - 0.5, ty - 32, 1, 8.4); g.fillRect(tx + tw / 2 - 2, ty - 29.6, 4, 1);
  // holofotes de baixo para cima
  const lg = g.createLinearGradient(0, base, 0, ty - 10); lg.addColorStop(0, 'rgba(255,214,160,0.3)'); lg.addColorStop(0.65, 'rgba(255,214,160,0)'); g.fillStyle = lg; g.fillRect(x0 - 2, ty - 10, tx + tw - x0 + 4, base - ty + 10);
}
// ---------- camada de perto
function nearTree(g, b, cols, crown = 140) {
  const r = rng(b.seed), x = b.x + 11;
  g.fillStyle = '#3b2a22'; rr(g, x - 1.6, crown + 10, 3.2, 200 - crown - 10, 1.2); g.fill();
  for (let i = 0; i < 9; i++) { const a = r() * Math.PI * 2, d = r() * 10; ell(g, x + Math.cos(a) * d, crown + Math.sin(a) * d * 0.7, 7 + r() * 4, 6 + r() * 3); g.fillStyle = cols[i % 3]; g.fill(); }
}
function nearPalm(g, b) {   // palmeira-imperial da praça
  const x = b.x + 11, top = 112 + (b.seed % 12);
  g.strokeStyle = '#7a6a5a'; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, 200); g.quadraticCurveTo(x + 2.4, 160, x + 1, top + 4); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 0.4; for (let y = top + 10; y < 198; y += 4.2) { g.beginPath(); g.moveTo(x - 1.2, y); g.lineTo(x + 2.6, y); g.stroke(); }
  g.fillStyle = '#5c8a42'; ell(g, x + 1, top + 6, 2.2, 5); g.fill();
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i - 3.5) * 0.44, L = 15 + (i % 2) * 4, ex = x + 1 + Math.cos(a) * L, ey = top + Math.sin(a) * L * 0.6 + L * 0.42;
    g.strokeStyle = i % 2 ? '#2f6a3a' : '#3d8248'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + 1, top + 1); g.quadraticCurveTo(x + 1 + Math.cos(a) * L * 0.6, top + Math.sin(a) * L * 0.75 - 2, ex, ey); g.stroke();
  }
}
function paintNear(g, b) {
  const base = 200;
  switch (b.kind) {
    case 'tree': return nearTree(g, b, ['#2f7a4a', '#3c8f55', '#25633d']);
    case 'ipe': return nearTree(g, b, [b.bloom, mix(b.bloom, '#ffffff', 0.25), mix(b.bloom, '#5a1f3a', 0.28)]);
    case 'palm': return nearPalm(g, b);
    case 'hedge': for (let i = 0; i < b.w; i += 7) { ell(g, b.x + i + 3.5, 197, 5, 4.2); g.fillStyle = '#2b6342'; g.fill(); ell(g, b.x + i + 3, 195.6, 3, 2); g.fillStyle = '#3c8a55'; g.fill(); } return;
    case 'bench': g.fillStyle = '#3a3346'; g.fillRect(b.x, 193, b.w, 1.8); g.fillRect(b.x + 1, 194.8, 1, 5.2); g.fillRect(b.x + b.w - 2, 194.8, 1, 5.2); g.fillRect(b.x, 189.6, b.w, 1.2); return;
    case 'flags': {   // mastros (as bandeiras são desenhadas balançando, por cima)
      g.fillStyle = '#7d7a8c'; g.fillRect(b.x, 196, b.w, 4);
      for (const px of PACO.flags) { g.fillStyle = '#c9ccd6'; g.fillRect(px - 0.5, 134, 1, 62); ell(g, px, 133.6, 1, 1); g.fill(); }
      return;
    }
    case 'pool': {   // espelho d'água: borda de concreto e lâmina d'água (o chafariz é desenhado por cima)
      g.fillStyle = '#2a4a78'; g.fillRect(b.x + 2, 192.4, b.w - 4, 2);
      g.fillStyle = '#9d97aa'; g.fillRect(b.x, 194, b.w, 6); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(b.x, 194, b.w, 0.6);
      return;
    }
    case 'bust': {   // busto de Dom Pedro I, de ferro fundido, sobre um pedestal de granito
      const x = b.x + 8;
      g.fillStyle = vgrad(g, 178, 200, [[0, '#a7a2b4'], [1, '#6f6a80']]); g.fillRect(x - 6, 178, 12, 22);
      g.fillStyle = '#c4bfd0'; g.fillRect(x - 7, 177, 14, 2); g.fillStyle = '#d9c27a'; g.fillRect(x - 3, 186, 6, 3);
      g.fillStyle = vgrad(g, 162, 177, [[0, '#76604c'], [1, '#3e3229']]);
      ell(g, x, 174.6, 7, 3.4); g.fill(); g.fillRect(x - 7, 174.6, 14, 2.4); g.fillRect(x - 1.8, 169.5, 3.6, 5.5);
      ell(g, x, 166.4, 3.4, 4.2); g.fill(); g.fillStyle = '#94795e'; ell(g, x - 1.1, 165.2, 1.1, 1.8); g.fill();
      return;
    }
    case 'camara': {   // Câmara Municipal: prédio branco moderno, fita de vidro embaixo e caixa com brises em balanço em cima
      const x0 = b.x, x1 = b.x + b.w;
      g.fillStyle = vgrad(g, 166, 200, [[0, '#b9bccb'], [1, '#868a9e']]); g.fillRect(x0, 166, b.w - 34, 34);
      g.fillStyle = 'rgba(255,214,150,0.72)'; g.fillRect(x0 + 4, 172, b.w - 42, 7); g.fillRect(x0 + 4, 185, b.w - 42, 9);
      g.fillStyle = '#9497aa'; for (let x = x0 + 4; x < x1 - 38; x += 12) { g.fillRect(x, 172, 0.8, 7); g.fillRect(x, 185, 0.8, 9); }
      g.fillStyle = vgrad(g, 134, 166, [[0, '#d4d7e2'], [1, '#a7aabd']]); g.fillRect(x0 + 22, 134, b.w - 22, 32);
      g.fillStyle = '#2b2f40'; g.fillRect(x0 + 26, 139, b.w - 30, 22);
      g.fillStyle = 'rgba(255,214,150,0.55)'; for (let i = 0; i < 4; i++) g.fillRect(x0 + 30 + i * 40, 141, 22, 18);
      g.fillStyle = '#c9ccd8'; for (let y = 141; y < 161; y += 4.4) g.fillRect(x0 + 26, y, b.w - 30, 1);
      g.fillStyle = '#9fa2b4'; g.fillRect(x1 - 28, 166, 2.4, 34); g.fillRect(x1 - 8, 166, 2.4, 34);
      g.fillStyle = '#4e5266'; g.font = `800 5px ${FONT_UI}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('CÂMARA MUNICIPAL', x0 + 28, 163.4);
      return;
    }
    case 'passarela': {   // passarela de concreto por cima da avenida, com rampas nas pontas
      const x0 = b.x + 34, x1 = b.x + b.w - 34, dy = 150;
      g.fillStyle = '#6f6a80';
      g.beginPath(); g.moveTo(b.x, 200); g.lineTo(x0, dy + 8); g.lineTo(x0, dy + 12); g.lineTo(b.x + 7, 200); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(b.x + b.w, 200); g.lineTo(x1, dy + 8); g.lineTo(x1, dy + 12); g.lineTo(b.x + b.w - 7, 200); g.closePath(); g.fill();
      g.fillStyle = '#8a8598'; for (const px of [x0 + 44, x1 - 44]) g.fillRect(px - 3, dy + 9, 6, 200 - dy - 9);
      g.fillStyle = vgrad(g, dy, dy + 9, [[0, '#aaa5b9'], [1, '#6e697e']]); g.fillRect(x0 - 4, dy, x1 - x0 + 8, 9);
      g.strokeStyle = '#c9c5d6'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x0 - 4, dy - 6); g.lineTo(x1 + 4, dy - 6); g.stroke();
      g.lineWidth = 0.35; g.beginPath(); for (let x = x0 - 4; x <= x1 + 4; x += 5) { g.moveTo(x, dy - 6); g.lineTo(x, dy); } g.stroke();
      g.fillStyle = 'rgba(255,226,170,0.8)'; for (let x = x0 + 10; x < x1; x += 30) g.fillRect(x, dy + 8.6, 4, 0.8);
      return;
    }
    case 'wires': {   // postes e fios do trólebus (dois fios com catenária)
      const y = TROLLEY.y, poles = []; for (let x = b.x; x <= b.x + b.w + 1; x += 160) poles.push(x);
      g.fillStyle = '#4a4458'; for (const px of poles) { g.fillRect(px - 0.8, y - 10, 1.6, 200 - y + 10); g.fillRect(px - 0.8, y - 9, 12, 1); }
      g.strokeStyle = 'rgba(28,22,38,0.9)'; g.lineWidth = 0.5;
      for (const yy of [y, y + 3]) { g.beginPath(); for (let i = 0; i < poles.length - 1; i++) { const a = poles[i] + 10, c = poles[i + 1] + 10; g.moveTo(a, yy); g.quadraticCurveTo((a + c) / 2, yy + 3, c, yy); } g.stroke(); }
      return;
    }
    case 'shelter': {   // ponto do trólebus
      const x0 = b.x, w = b.w;
      g.fillStyle = 'rgba(180,220,255,0.16)'; g.fillRect(x0 + 2, 181, w - 4, 14);
      g.fillStyle = '#3d3a4c'; g.fillRect(x0, 178, w, 2.4); g.fillRect(x0 + 2, 180, 1.4, 20); g.fillRect(x0 + w - 3.4, 180, 1.4, 20);
      g.fillStyle = '#e6f2ff'; g.fillRect(x0 + w - 17, 182, 11, 12);
      g.fillStyle = '#2a2836'; g.fillRect(x0 + 6, 192, 20, 1.6); g.fillRect(x0 + 8, 193.6, 1, 6); g.fillRect(x0 + 23, 193.6, 1, 6);
      return;
    }
    case 'bldg': {   // prédio baixo do centro: poucas janelas acesas, uma vitrine e no máximo um letreiro
      const top = base - b.h, r = rng(b.seed);
      g.fillStyle = vgrad(g, top, base, [[0, mix(b.col, '#ffffff', 0.05)], [1, mix(b.col, '#0b0712', 0.35)]]); g.fillRect(b.x, top, b.w, b.h + 30);
      g.fillStyle = mix(b.col, '#000000', 0.38); g.fillRect(b.x - 1.5, top - 2.5, b.w + 3, 3);
      const floors = Math.max(0, Math.floor((b.h - 30) / 15)), nw = Math.max(2, Math.floor(b.w / 26));
      for (let f = 0; f < floors; f++) for (let j = 0; j < nw; j++) {
        const ww = (b.w - 14) / nw - 7, wx = b.x + 7 + j * ((b.w - 14) / nw) + 3.5, wy = top + 7 + f * 15, lit = r() < 0.24;
        g.fillStyle = '#17111f'; g.fillRect(wx - 0.6, wy - 0.6, ww + 1.2, 9.2);
        g.fillStyle = lit ? '#f2b96a' : '#2a2238'; g.fillRect(wx, wy, ww, 8);
      }
      const sy = base - 24;
      g.fillStyle = '#120c18'; g.fillRect(b.x + 3, sy, b.w - 6, 24);
      g.fillStyle = vgrad(g, sy + 4, base, [[0, '#f7c98a'], [1, '#b8642c']]); g.fillRect(b.x + 6, sy + 5, b.w * 0.55, 19);
      g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(b.x + 9, sy + 5); g.lineTo(b.x + 14, sy + 5); g.lineTo(b.x + 8, sy + 24); g.lineTo(b.x + 6, sy + 24); g.closePath(); g.fill();
      g.fillStyle = '#2a1d24'; g.fillRect(b.x + 10 + b.w * 0.55, sy + 6, b.w * 0.45 - 16, 18);
      if (b.awn) { g.fillStyle = b.awn; g.beginPath(); g.moveTo(b.x + 2, sy - 1); g.lineTo(b.x + b.w - 2, sy - 1); g.lineTo(b.x + b.w - 1, sy + 5); g.lineTo(b.x + 1, sy + 5); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(b.x + 1, sy + 5, b.w - 2, 1.2); }
      if (b.name) { g.font = `800 6.6px ${FONT_UI}`; const tw = Math.min(b.w - 10, g.measureText(b.name).width + 8); rr(g, b.x + b.w / 2 - tw / 2, sy - 12.5, tw, 9, 1.5); g.fillStyle = '#16101e'; g.fill(); g.fillStyle = '#f6efe0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.name, b.x + b.w / 2, sy - 7.9, b.w - 14); }
      return;
    }
    case 'park': {   // Parque da Juventude: half-pipe, bowl, muro grafitado e alambrado
      const x0 = b.x, x1 = b.x + b.w, hx0 = x0 + 50, hx1 = x0 + 250, hy = 160;
      g.fillStyle = '#5a536c'; g.beginPath(); g.moveTo(hx0, hy); g.lineTo(hx0 + 10, hy); g.quadraticCurveTo(hx0 + 22, 196, hx0 + 52, 197); g.lineTo(hx1 - 52, 197); g.quadraticCurveTo(hx1 - 22, 196, hx1 - 10, hy); g.lineTo(hx1, hy); g.lineTo(hx1, 200); g.lineTo(hx0, 200); g.closePath(); g.fill();
      g.strokeStyle = '#a8a6b6'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(hx0 + 10, hy); g.quadraticCurveTo(hx0 + 22, 196, hx0 + 52, 197); g.lineTo(hx1 - 52, 197); g.quadraticCurveTo(hx1 - 22, 196, hx1 - 10, hy); g.stroke();
      g.fillStyle = '#7d788e'; g.fillRect(hx0 - 4, hy - 1.5, 16, 2); g.fillRect(hx1 - 12, hy - 1.5, 16, 2);
      g.strokeStyle = '#8f8ba0'; g.lineWidth = 0.4; g.beginPath(); for (const ex of [hx0 - 4, hx1 - 12]) { g.moveTo(ex, hy - 7); g.lineTo(ex + 16, hy - 7); for (let k = 0; k <= 16; k += 4) { g.moveTo(ex + k, hy - 7); g.lineTo(ex + k, hy - 1.5); } } g.stroke();
      // bowl de concreto
      g.fillStyle = '#4e4860'; g.beginPath(); g.moveTo(x0 + 290, 186); g.quadraticCurveTo(x0 + 300, 199, x0 + 330, 199); g.lineTo(x0 + 370, 199); g.quadraticCurveTo(x0 + 400, 199, x0 + 410, 186); g.lineTo(x0 + 410, 200); g.lineTo(x0 + 290, 200); g.closePath(); g.fill();
      g.strokeStyle = '#a8a6b6'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x0 + 286, 186); g.lineTo(x0 + 292, 186); g.moveTo(x0 + 408, 186); g.lineTo(x0 + 414, 186); g.stroke();
      // muro grafitado (poucas formas grandes)
      const wx = x0 + 440, ww = 130;
      g.fillStyle = '#4a4458'; g.fillRect(wx, 174, ww, 26); g.fillStyle = '#5d5670'; g.fillRect(wx - 1, 172.6, ww + 2, 1.8);
      g.save(); g.beginPath(); g.rect(wx, 174, ww, 26); g.clip();
      g.fillStyle = '#ff7a1a'; ell(g, wx + 28, 188, 20, 9, -0.2); g.fill(); g.fillStyle = '#36c9ff'; ell(g, wx + 74, 186, 24, 10, 0.15); g.fill(); g.fillStyle = '#b6ff3b'; ell(g, wx + 112, 190, 16, 8); g.fill();
      g.fillStyle = '#1b1424'; g.font = `11px ${FONT_HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SKATE', wx + 70, 187);
      g.restore();
      // alambrado na frente (bem suave)
      g.strokeStyle = 'rgba(200,196,220,0.14)'; g.lineWidth = 0.35; g.beginPath();
      for (let x = x0; x < x1; x += 4) { g.moveTo(x, 178); g.lineTo(x + 6, 200); g.moveTo(x + 6, 178); g.lineTo(x, 200); } g.stroke();
      g.fillStyle = '#5a536c'; for (let x = x0; x <= x1; x += 40) g.fillRect(x, 176, 1.2, 24); g.fillRect(x0, 176, b.w, 0.9);
      // placa do parque
      rr(g, x0 + 4, 158, 70, 13, 2); g.fillStyle = '#2d6a4f'; g.fill(); g.strokeStyle = '#e8e3d8'; g.lineWidth = 0.6; g.stroke(); g.fillStyle = '#4a4458'; g.fillRect(x0 + 18, 171, 1.4, 29); g.fillRect(x0 + 58, 171, 1.4, 29);
      g.fillStyle = '#f2eee2'; g.font = `800 6px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PARQUE DA JUVENTUDE', x0 + 39, 164.8, 66);
      return;
    }
  }
}
function fogPost(y0, y1, c0, c1) { return (g, x0, x1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); }; }
const LAYER_FAR = new ChunkLayer(0.12, 0.5, paintFar, FAR, 200, fogPost(110, 205, 'rgba(160,70,130,0)', 'rgba(190,80,120,0.42)'));
const LAYER_MID = new ChunkLayer(0.3, 0.75, paintMid, MID, 180, fogPost(140, 205, 'rgba(120,50,110,0)', 'rgba(120,50,110,0.3)'));
const LAYER_NEAR = new ChunkLayer(0.68, 1, paintNear, NEAR, 160);
onRescale(() => { LAYER_FAR.clear(); LAYER_MID.clear(); LAYER_NEAR.clear(); });

// ---------- céu
let SKY_GRAD = null, SKYC = null, MOON = null, CLOUDS = [], VIGNETTE = null, NOISE = null;
onRescale(() => {
  SKY_GRAD = ctx.createLinearGradient(0, 0, 0, H);
  [[0, '#0d0820'], [0.32, '#2a1450'], [0.58, '#6a2468'], [0.76, '#c4486a'], [0.86, '#ff8a5b'], [1, '#ffb06a']].forEach(([o, c]) => SKY_GRAD.addColorStop(o, c));
  SKYC = mk(W, H); { const g = SKYC.getContext('2d'), r = rng(77); g.fillStyle = SKY_GRAD; g.fillRect(0, 0, W, H); for (let i = 0; i < 240; i++) { const x = r() * W, y = r() * H * 0.6, s = (0.4 + r() * 1.2) * KB * 0.35; g.fillStyle = `rgba(255,${200 + r() * 55 | 0},${220 + r() * 35 | 0},${0.25 + r() * 0.6})`; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); } }
  const ms = Math.round(70 * KB); MOON = mk(ms, ms); { const g = MOON.getContext('2d'); g.scale(ms / 70, ms / 70);
    const hl = g.createRadialGradient(35, 35, 8, 35, 35, 35); hl.addColorStop(0, 'rgba(255,236,200,0.5)'); hl.addColorStop(0.45, 'rgba(255,190,170,0.16)'); hl.addColorStop(1, 'rgba(255,170,170,0)'); g.fillStyle = hl; g.fillRect(0, 0, 70, 70);
    const d = g.createRadialGradient(31, 31, 2, 35, 35, 15); d.addColorStop(0, '#fffaf0'); d.addColorStop(1, '#f2d9b8'); g.fillStyle = d; ell(g, 35, 35, 14, 14); g.fill();
    g.fillStyle = 'rgba(190,160,140,0.35)'; for (const [x, y, r] of [[30, 31, 2.6], [39, 38, 3.2], [36, 27, 1.6], [28, 40, 1.4]]) { ell(g, x, y, r, r); g.fill(); } }
  CLOUDS = [0, 1, 2].map(i => { const cw = Math.round(120 * KB * 0.6), ch = Math.round(36 * KB * 0.6); const c = mk(cw, ch), g = c.getContext('2d'), r = rng(400 + i); g.scale(cw / 120, ch / 36);
    for (let k = 0; k < 14; k++) { const x = 15 + r() * 90, y = 14 + r() * 14, rx = 12 + r() * 16; const gr = g.createRadialGradient(x, y, 1, x, y, rx); gr.addColorStop(0, 'rgba(255,170,190,0.22)'); gr.addColorStop(1, 'rgba(120,60,140,0)'); g.fillStyle = gr; ell(g, x, y, rx, rx * 0.55); g.fill(); } return c; });
  VIGNETTE = mk(W, H); { const g = VIGNETTE.getContext('2d'); const vg = g.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H * 0.5, Math.hypot(W, H) * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,0,15,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
  NOISE = mk(256, 256); { const g = NOISE.getContext('2d'), id = g.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); }
});

// ---------- outdoors (camada 0.45): propaganda da IA que vira cartaz de rock quando a cor volta (v9: só 4, longe do Paço)
const BB_F = 0.45;
const BILLBOARDS = [
  { lx: 960, ai: ['BATIDÃO.EXE', 'O ÚNICO HIT QUE VOCÊ PRECISA'], rock: ['SOM LIVRE', 'SHOW HOJE NO PAÇO'], icon: 'guitar' },
  { lx: 1480, ai: ['ATUALIZAÇÃO', 'OBRIGATÓRIA: 99%'], rock: ['RÁDIO PIRATA 87,9', 'AQUI TOCA DE TUDO'], icon: 'radio', bar: true },
  { lx: 2060, ai: ['DISCO VOADOR?', 'NÃO EXISTE. CONFIE NA IA.'], rock: ['ELES ESTÃO ENTRE NÓS', '(E CURTEM ROCK)'], icon: 'ufo' },
  { lx: 2640, ai: ['HIT ÚNICO™', 'EM TODAS AS RÁDIOS'], rock: ['VALEU, SÃO BERNARDO!', 'O SOM É DE QUEM FAZ'], icon: 'heart' },
].map(b => ({ ...b, on: false, t: 0 }));
function bbIcon(g, kind, x, y, s, ai) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (ai) { ell(g, 0, 0, 8, 5); g.fillStyle = '#f4f4f8'; g.fill(); g.strokeStyle = '#1b1a22'; g.lineWidth = 1; g.stroke(); ell(g, 0, 0, 3.4, 3.4); g.fillStyle = RED; g.fill(); ell(g, 0, 0, 1.3, 1.3); g.fillStyle = '#16151a'; g.fill(); }
  else if (kind === 'vinyl') { ell(g, 0, 0, 8, 8); g.fillStyle = '#16151a'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 0.4; for (let r = 3; r < 8; r += 1.2) { ell(g, 0, 0, r, r); g.stroke(); } ell(g, 0, 0, 2.6, 2.6); g.fillStyle = '#ffd23f'; g.fill(); }
  else if (kind === 'pizza') { g.beginPath(); g.moveTo(0, -8); g.lineTo(7, 7); g.lineTo(-7, 7); g.closePath(); g.fillStyle = '#ffcf5a'; g.fill(); g.fillStyle = '#d9472b'; for (const [a, b] of [[0, -1], [-2.5, 3.5], [2.6, 4]]) { ell(g, a, b, 1.5, 1.5); g.fill(); } g.fillStyle = '#c4742f'; g.fillRect(-7.5, 6, 15, 2.2); }
  else if (kind === 'ufo') { g.fillStyle = '#7fd4ff'; ell(g, 0, -2.5, 3.6, 3); g.fill(); g.fillStyle = '#d9dde6'; ell(g, 0, 0, 9, 2.8); g.fill(); g.fillStyle = '#ff3fa4'; for (let i = -2; i <= 2; i++) { ell(g, i * 3.2, 0.4, 0.8, 0.8); g.fill(); } }
  else if (kind === 'radio') { rr(g, -8, -5, 16, 11, 2); g.fillStyle = '#16151a'; g.fill(); ell(g, -3.5, 1, 3, 3); g.fillStyle = '#444'; g.fill(); g.fillStyle = '#ffd23f'; g.fillRect(1, -2, 6, 2.2); g.strokeStyle = '#16151a'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(4, -5); g.lineTo(7, -10); g.stroke(); }
  else if (kind === 'heart') { g.fillStyle = '#ff3fa4'; g.beginPath(); g.moveTo(0, 7); g.bezierCurveTo(-10, 0, -6, -9, 0, -3.5); g.bezierCurveTo(6, -9, 10, 0, 0, 7); g.fill(); }
  else { g.rotate(-0.6); guitarPath(g); g.fillStyle = '#ff7a1a'; g.fill(); g.fillStyle = '#16151a'; g.fillRect(-0.6, -14, 1.2, 9.5); ell(g, 0, -1.7, 1.1, 1.1); g.fill(); }
  g.restore();
}
function drawBillboard(g, b, t) {
  const x = b.lx, y = 58, w = 104, h = 46;
  g.fillStyle = '#2a2433'; g.fillRect(x + 22, y + h, 3, 200 - y - h); g.fillRect(x + w - 25, y + h, 3, 200 - y - h);
  g.strokeStyle = '#2a2433'; g.lineWidth = 0.8; g.beginPath(); for (let yy = y + h + 6; yy < 196; yy += 12) { g.moveTo(x + 23.5, yy); g.lineTo(x + w - 23.5, yy + 10); g.moveTo(x + w - 23.5, yy); g.lineTo(x + 23.5, yy + 10); } g.stroke();
  g.fillStyle = '#3a3344'; g.fillRect(x - 3, y + h, w + 6, 2.6);
  const glitch = b.on && b.t < 0.7;
  const showRock = b.on && (!glitch || ((t * 22) | 0) % 2 === 0);
  rr(g, x, y, w, h, 1.5);
  if (showRock) { const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#ff8a2a'); gr.addColorStop(0.55, '#ff3fa4'); gr.addColorStop(1, '#7a2fd0'); g.fillStyle = gr; }
  else g.fillStyle = vgrad(g, y, y + h, [[0, '#f4f5f8'], [1, '#cfd2da']]);
  g.fill(); g.strokeStyle = '#1b1a22'; g.lineWidth = 1.2; g.stroke();
  g.save(); rr(g, x, y, w, h, 1.5); g.clip();
  const lines = showRock ? b.rock : b.ai;
  bbIcon(g, b.icon, x + 16, y + h / 2, 1.05, !showRock);
  g.textAlign = 'left'; g.textBaseline = 'middle';
  if (showRock) { g.fillStyle = '#fff8e6'; g.font = `11px ${FONT_HAND}`; g.fillText(lines[0], x + 30, y + 17, w - 34); g.font = `800 6.6px ${FONT_UI}`; g.fillStyle = '#1b0f22'; g.fillText(lines[1], x + 30, y + 31, w - 34); }
  else {
    g.fillStyle = '#1b1a22'; g.font = `800 11px ${FONT_UI}`; g.fillText(lines[0], x + 30, y + 16, w - 34); g.font = `600 6.6px ${FONT_UI}`; g.fillStyle = '#4a4855'; g.fillText(lines[1], x + 30, y + 29, w - 34);
    if (b.bar) { g.fillStyle = '#d5d7de'; g.fillRect(x + 30, y + 36, 64, 3); g.fillStyle = RED; g.fillRect(x + 30, y + 36, 63, 3); }
    g.fillStyle = RED; g.fillRect(x, y + h - 3, w, 3);
  }
  if (glitch) { for (let i = 0; i < 5; i++) { const yy = y + Math.random() * h; g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,42,74' : '54,245,255'},0.55)`; g.fillRect(x + (Math.random() - 0.5) * 8, yy, w, 1.2 + Math.random() * 2); } }
  g.restore();
  for (const lx of [x + 26, x + w - 26]) { g.fillStyle = '#2a2433'; g.fillRect(lx - 3, y - 7, 6, 3); g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, y - 5, 0, y + h); gr.addColorStop(0, 'rgba(255,240,200,0.35)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(lx - 2, y - 4); g.lineTo(lx + 2, y - 4); g.lineTo(lx + 22, y + h); g.lineTo(lx - 22, y + h); g.closePath(); g.fill(); g.restore(); }
}

// ---------- rua (camada do jogo); v9: no Paço o chão é a esplanada de granito claro
const PACO_GX = 41 * TS;
let RUNS = [];
function computeRuns() { RUNS = []; let c = 0; while (c < COLS) { if (tileAt(c, 12) === T.GROUND) { const s = c; while (c < COLS && tileAt(c, 12) === T.GROUND) c++; RUNS.push([s, c - 1]); } else c++; } }
function drawGround(g, vx0, vx1) {
  for (const [c0, c1] of RUNS) {
    const x0 = c0 * TS, x1 = (c1 + 1) * TS; if (x1 < vx0 - 8 || x0 > vx1 + 8) continue;
    const a = Math.max(x0, vx0 - 16), b = Math.min(x1, vx1 + 16);
    g.fillStyle = vgrad(g, 199, 240, [[0, '#3a3348'], [0.4, '#2a2436'], [1, '#14101c']]); g.fillRect(a, 199, b - a, 41);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.5;
    for (let y = 206; y < 240; y += 7) { g.beginPath(); g.moveTo(a, y); g.lineTo(b, y); g.stroke(); }
    for (let c = Math.max(c0, Math.floor(a / TS)); c <= Math.min(c1, Math.ceil(b / TS)); c++) {
      const hsh = hash(c * 7 + 3);
      g.strokeStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); for (let y = 206, k = 0; y < 240; y += 7, k++) { const xx = c * TS + ((k % 2) ? 8 : 0); g.moveTo(xx, y); g.lineTo(xx, y + 7); } g.stroke();
      if (hsh < 0.18) { g.fillStyle = '#2b2533'; ell(g, c * TS + 8, 222, 6, 2.4); g.fill(); g.strokeStyle = '#4a4252'; g.lineWidth = 0.5; g.stroke(); }
    }
    if (x1 - x0 > 96) { // cano com flanges
      const py = 214; g.fillStyle = vgrad(g, py - 2.6, py + 2.6, [[0, '#8a8696'], [0.5, '#5c5868'], [1, '#2e2a38']]); g.fillRect(a, py - 2.6, b - a, 5.2);
      g.fillStyle = '#6c6878'; for (let xx = Math.ceil(a / 48) * 48; xx < b; xx += 48) g.fillRect(xx - 1.2, py - 3.4, 2.4, 6.8);
    }
    g.fillStyle = vgrad(g, 192, 199, [[0, '#a7a1b5'], [1, '#7e788d']]); g.fillRect(a, 192, b - a, 7);
    if (a < PACO_GX) { const pb = Math.min(b, PACO_GX); g.fillStyle = vgrad(g, 192, 199, [[0, '#cbc6d4'], [1, '#9a94a8']]); g.fillRect(a, 192, pb - a, 7); }   // granito da esplanada
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(a, 192, b - a, 0.6);
    g.fillStyle = '#5a5468'; g.fillRect(a, 198.4, b - a, 1.6);
    for (let c = Math.max(c0, Math.floor(a / TS)); c <= Math.min(c1, Math.ceil(b / TS)); c++) {
      const x = c * TS, hsh = hash(c * 13 + 1), paco = x < PACO_GX;
      g.fillStyle = 'rgba(40,30,50,0.45)'; g.fillRect(x, 192, 0.45, 6.4);
      if (paco) { g.fillStyle = 'rgba(40,30,50,0.3)'; g.fillRect(x + 8, 192, 0.35, 6.4); continue; }   // placas de granito, sem rachaduras nem mato
      if (hsh < 0.25) { g.strokeStyle = 'rgba(40,30,50,0.5)'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(x + 3 + hsh * 20, 192.5); g.lineTo(x + 6 + hsh * 18, 195); g.lineTo(x + 5 + hsh * 22, 197.5); g.stroke(); }
      if (hsh > 0.8) { g.fillStyle = '#4c9a3c'; for (let k = 0; k < 4; k++) { const bx = x + (hsh * 97 % 1) * 3 - 1 + k * 0.9; g.beginPath(); g.moveTo(bx, 192.4); g.lineTo(bx + 0.4 + (k % 2 ? 0.8 : -0.5), 189.4 - k % 2); g.lineTo(bx + 0.8, 192.4); g.fill(); } }
    }
    for (const [ex, dir] of [[x0, 1], [x1, -1]]) {
      if ((dir > 0 && c0 === 0) || (dir < 0 && c1 === COLS - 1)) continue;
      g.fillStyle = '#14101c'; g.beginPath(); g.moveTo(ex, 199); for (let k = 0; k <= 8; k++) g.lineTo(ex + dir * (k % 2 ? 2.4 : 0.6), 199 + k * 5); g.lineTo(ex - dir * 3, 240); g.lineTo(ex - dir * 3, 199); g.closePath(); g.fill();
      g.strokeStyle = '#7a5a4a'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(ex, 204); g.lineTo(ex - dir * 3.5, 202); g.moveTo(ex, 214); g.lineTo(ex - dir * 4, 215.5); g.stroke();
    }
  }
}

// ---------- dessaturação: o mundo à direita da frente de cor fica cinza e frio
function desatPass() {
  const fx = (colorX - cam.x) * K * cam.zoom, band = 60 * K;
  if (fx - band >= W) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const x0 = Math.max(0, Math.floor(fx - band));
  const gr = ctx.createLinearGradient(fx - band, 0, fx + band * 0.15, 0);
  gr.addColorStop(0, 'rgba(128,128,128,0)'); gr.addColorStop(1, 'rgba(128,128,128,0.9)');
  ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = gr; ctx.fillRect(x0, 0, W - x0, H);
  const g2 = ctx.createLinearGradient(fx - band, 0, fx + band * 0.4, 0);
  g2.addColorStop(0, 'rgba(18,22,40,0)'); g2.addColorStop(1, 'rgba(18,22,40,0.2)');
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = g2; ctx.fillRect(x0, 0, W - x0, H);
  ctx.restore();
}
// ---------- v9: partes vivas do cenário (chafariz, bandeiras, trólebus e a luz de balizamento da Prefeitura)
function flagPath(g, px, fy, w, h, t, i) {
  const wv = s => Math.sin(t * 2.6 + i * 1.7 - s * 0.45) * 1.1 * (s / w);
  g.beginPath(); g.moveTo(px, fy);
  for (let s = 0; s <= w; s += 1.5) g.lineTo(px + s, fy + wv(s));
  for (let s = w; s >= 0; s -= 1.5) g.lineTo(px + s, fy + h + wv(s));
  g.closePath();
}
function drawPacoLive(g, t, nl) {
  const vis = (a, b) => b > nl - 30 && a < nl + W / KB + 30;
  if (vis(PACO.pool[0], PACO.pool[1])) {   // chafariz do espelho d'água
    const [a, b] = PACO.pool;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const x = a + 16 + i * ((b - a - 32) / 7), hh = 14 + 5 * Math.sin(t * 1.6 + i * 0.8), y0 = 193.2;
      g.strokeStyle = 'rgba(160,215,255,0.32)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 - hh); g.stroke();
      g.strokeStyle = 'rgba(230,248,255,0.5)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 - hh); g.stroke();
      for (let k = 0; k < 4; k++) { const ph = (t * 1.8 + k / 4 + i * 0.37) % 1, sx = x + (k - 1.5) * 2.4 * ph, sy = y0 - hh + ph * ph * 12; g.fillStyle = `rgba(210,240,255,${0.6 * (1 - ph)})`; g.fillRect(sx - 0.45, sy - 0.45, 0.9, 0.9); }
      glow(g, x, y0, 6, '#9fdcff', 0.3);
    }
    g.restore();
  }
  if (vis(PACO.flags[0] - 10, PACO.flags[1] + 20)) {   // bandeiras do Brasil e de São Paulo
    const w = 15, h = 10, fy = 135;
    let px = PACO.flags[0] + 0.5; flagPath(g, px, fy, w, h, t, 0); g.save(); g.clip();
    g.fillStyle = '#1f9a4a'; g.fillRect(px, fy - 3, w, h + 6); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(px + w / 2, fy + 1.2); g.lineTo(px + w - 1.4, fy + h / 2); g.lineTo(px + w / 2, fy + h - 1.2); g.lineTo(px + 1.4, fy + h / 2); g.closePath(); g.fill();
    g.fillStyle = '#1f3f9a'; ell(g, px + w / 2, fy + h / 2, 2.6, 2.6); g.fill(); g.restore();
    px = PACO.flags[1] + 0.5; flagPath(g, px, fy + 1, w, h, t, 1); g.save(); g.clip();
    for (let k = 0; k < 13; k++) { g.fillStyle = k % 2 ? '#f4f4f4' : '#22222a'; g.fillRect(px, fy - 2 + k * (h + 6) / 13, w, (h + 6) / 13 + 0.1); }
    g.fillStyle = '#d42a2a'; g.fillRect(px, fy - 2, w * 0.42, h * 0.55 + 3); g.fillStyle = '#f4f4f4'; ell(g, px + w * 0.21, fy + h * 0.25 + 0.6, 1.8, 1.8); g.fill(); g.restore();
  }
  // trólebus indo da direita para a esquerda, com as varas nos fios
  const span = TROLLEY.x1 - TROLLEY.x0 + 240, x = TROLLEY.x1 + 60 - (t * 13) % span;
  if (x > TROLLEY.x0 - 70 && vis(x, x + 70)) {
    const y = 200, L = 64, Hb = 17;
    g.strokeStyle = '#2b2734'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x + 42, y - Hb - 3); g.lineTo(x + 16, TROLLEY.y + 0.6); g.moveTo(x + 46, y - Hb - 3); g.lineTo(x + 20, TROLLEY.y + 3.6); g.stroke();
    rr(g, x, y - Hb - 3, L, Hb, 2.5); g.fillStyle = '#d6dae4'; g.fill(); g.strokeStyle = '#3a3646'; g.lineWidth = 0.5; g.stroke();
    g.fillStyle = '#3fae6a'; g.fillRect(x + 0.5, y - 9.5, L - 1, 2.2);
    g.fillStyle = '#ffe1a6'; for (let i = 0; i < 6; i++) g.fillRect(x + 7 + i * 9.3, y - Hb, 7.2, 5.6);
    g.fillStyle = '#2a2f3c'; g.fillRect(x + 1.2, y - Hb, 4.4, 8);
    g.fillStyle = '#16141c'; ell(g, x + 13, y - 2.6, 3, 3); g.fill(); ell(g, x + L - 13, y - 2.6, 3, 3); g.fill();
    glow(g, x + 0.5, y - 6, 7, '#fff2c8', 0.55);
    if (hash((t * 7) | 0) < 0.14) glow(g, x + 16, TROLLEY.y + 1, 5, '#9fdcff', 0.9);
  }
}
function drawBackground(t, beat) {
  const cx = cam.x, Kz = K * cam.zoom;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(SKYC, 0, 0);
  const mx = W * 0.8 - cx * 0.02 * KB, my = H * 0.18; ctx.drawImage(MOON, mx - MOON.width / 2, my - MOON.height / 2);
  for (let i = 0; i < 5; i++) { const c = CLOUDS[i % 3]; const span = W + c.width * 2; const x = ((i * 0.27 * span - cx * 0.05 * KB + t * 4 * KB * (0.5 + i * 0.15)) % span + span) % span - c.width; ctx.drawImage(c, x, (10 + i * 12) * KB); }
  // OVNIs ao longe (sobrevoos)
  ctx.setTransform(KB, 0, 0, KB, 0, 0);
  for (const u of ufos) if (u.kind === 'flyby') drawUFO(ctx, u, t, u.s);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  LAYER_FAR.draw(cx);
  ctx.setTransform(KB, 0, 0, KB, -Math.round(cx * 0.12 * PX * KB), -Math.round(layerTop(0.12) * KB)); paintAITower(ctx);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  LAYER_MID.draw(cx);
  // luz vermelha de balizamento no alto da Prefeitura
  const ml = cx * 0.3 * PX;
  if (PREF.cx > ml - 40 && PREF.cx < ml + W / KB + 40) {
    ctx.setTransform(KB, 0, 0, KB, -Math.round(ml * KB), -Math.round(layerTop(0.3) * KB));
    const on = (G.frame % 96) < 48; glow(ctx, PREF.cx - 4, 200 - PREF.h - 26.5, on ? 6 : 3, '#ff3b4a', on ? 0.95 : 0.3);
  }
  const bl = cx * BB_F * PX;
  ctx.setTransform(KB, 0, 0, KB, -Math.round(bl * KB), -Math.round(layerTop(BB_F) * KB));
  for (const b of BILLBOARDS) if (b.lx > bl - 120 && b.lx < bl + W / KB + 20) drawBillboard(ctx, b, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  LAYER_NEAR.draw(cx);
  const nf = 0.68, nl = cx * nf * PX;
  ctx.setTransform(KB, 0, 0, KB, -Math.round(nl * KB), -Math.round(layerTop(nf) * KB));
  drawPacoLive(ctx, t, nl);
  // postes (luz dinâmica): altos na esplanada, de rua, torres de luz no parque e de globo na praça
  for (const L of LAMPS) {
    if (L.x < nl - 30 || L.x > nl + W / KB + 30) continue;
    const fl = colorX > L.x / (nf * PX) ? 1 : (hash((G.frame >> 2) + L.seed) > 0.12 ? 1 : 0.3);
    ctx.fillStyle = '#2c2638';
    if (L.style === 'paco') {
      ctx.fillRect(L.x - 0.8, 120, 1.6, 80); ell(ctx, L.x, 119.4, 4.4, 1.4); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.16 * fl; const gr = ctx.createLinearGradient(0, 121, 0, 200); gr.addColorStop(0, 'rgba(255,226,170,1)'); gr.addColorStop(1, 'rgba(255,226,170,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(L.x - 3.5, 121); ctx.lineTo(L.x + 3.5, 121); ctx.lineTo(L.x + 20, 200); ctx.lineTo(L.x - 20, 200); ctx.closePath(); ctx.fill(); ctx.restore();
      glow(ctx, L.x, 121, 9, '#ffe2aa', 0.8 * fl);
    } else if (L.style === 'flood') {
      ctx.strokeStyle = '#2c2638'; ctx.lineWidth = 0.5; ctx.beginPath(); for (let y = 100; y < 200; y += 6) { ctx.moveTo(L.x - 2, y); ctx.lineTo(L.x + 2, y + 6); ctx.moveTo(L.x + 2, y); ctx.lineTo(L.x - 2, y + 6); } ctx.stroke();
      ctx.fillRect(L.x - 2.2, 100, 0.8, 100); ctx.fillRect(L.x + 1.4, 100, 0.8, 100); ctx.fillRect(L.x - 7, 96, 14, 4);
      for (const dx of [-4.5, 0, 4.5]) glow(ctx, L.x + dx, 98, 8, '#f4f7ff', 0.65 * fl);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.1 * fl; const gr = ctx.createLinearGradient(0, 100, 0, 200); gr.addColorStop(0, 'rgba(230,240,255,1)'); gr.addColorStop(1, 'rgba(230,240,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(L.x - 6, 100); ctx.lineTo(L.x + 6, 100); ctx.lineTo(L.x + 60, 200); ctx.lineTo(L.x - 60, 200); ctx.closePath(); ctx.fill(); ctx.restore();
    } else if (L.style === 'globo') {
      ctx.fillRect(L.x - 0.7, 168, 1.4, 32); ell(ctx, L.x, 166, 3, 3); ctx.fillStyle = '#fff6e6'; ctx.fill(); glow(ctx, L.x, 166, 10, '#ffe7c0', 0.75 * fl);
    } else {
      ctx.fillRect(L.x - 1, 130, 2, 70); ctx.fillRect(L.x - 1, 130, 10, 1.6); rr(ctx, L.x + 6, 129, 7, 3.4, 1.2); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.2 * fl;
      const gr = ctx.createLinearGradient(0, 132, 0, 200); gr.addColorStop(0, 'rgba(255,214,150,1)'); gr.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(L.x + 7.5, 132); ctx.lineTo(L.x + 11.5, 132); ctx.lineTo(L.x + 26, 200); ctx.lineTo(L.x - 7, 200); ctx.closePath(); ctx.fill(); ctx.restore();
      glow(ctx, L.x + 9.5, 133, 9, '#ffd696', 0.8 * fl);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const gy = Math.max(0, (196 - cam.y) * Kz), dark = ctx.createLinearGradient(0, gy, 0, H); dark.addColorStop(0, '#120c1c'); dark.addColorStop(1, '#06030c');
  ctx.fillStyle = dark; ctx.fillRect(0, gy, W, H - gy);
}
function drawForeground(t) {   // silhuetas na frente da câmera (v9: menos, para limpar a tela)
  const cx = cam.x, f = 1.28, Kz = K * cam.zoom;
  ctx.setTransform(Kz, 0, 0, Kz, -Math.round(cx * f * Kz), -Math.round(cam.y * Kz));
  const l0 = cx * f - 60, l1 = cx * f + viewW() + 60;
  for (let i = Math.floor(l0 / 90); i <= Math.floor(l1 / 90); i++) {
    const x = i * 90 + hash(i) * 50, kind = hash(i + 7);
    ctx.fillStyle = 'rgba(6,3,12,0.92)';
    if (kind < 0.22) { for (let k = 0; k < 5; k++) { ell(ctx, x + k * 6, 232 - hash(i * 5 + k) * 5, 7, 6); ctx.fill(); } }
    else if (kind < 0.3) { ctx.beginPath(); ctx.moveTo(x, 236); ctx.lineTo(x + 5, 218); ctx.lineTo(x + 10, 236); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,122,26,0.35)'; ctx.fillRect(x + 3, 226, 4, 2); }
    else if (kind < 0.36) { rr(ctx, x, 222, 16, 14, 2); ctx.fill(); }
  }
}
function postFX(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (qScale > 0.8) ctx.drawImage(VIGNETTE, 0, 0);
  const I = G.interf;
  if (I > 0.03) {
    ctx.save(); ctx.globalAlpha = Math.min(0.32, I * 0.35); ctx.globalCompositeOperation = 'overlay';
    const ox = (Math.random() * 256) | 0, oy = (Math.random() * 256) | 0, s = Math.max(1, K * 0.6);
    for (let y = -oy; y < H; y += 256 * s) for (let x = -ox; x < W; x += 256 * s) ctx.drawImage(NOISE, x, y, 256 * s, 256 * s);
    ctx.restore();
    if (I > 0.25 && Math.random() < I * 0.4) { const y = (Math.random() * H) | 0, h = (2 + Math.random() * 12) * K * 0.5, dx = (Math.random() - 0.5) * 18 * I * K; ctx.drawImage(cvs, 0, y, W, h, dx, y, W, h); }
    ctx.save(); ctx.globalAlpha = 0.06 + I * 0.08; ctx.fillStyle = '#000'; for (let y = 0; y < H; y += Math.max(2, Math.round(K))) ctx.fillRect(0, y, W, Math.max(1, K * 0.25)); ctx.restore();
    if (I > 0.5) { ctx.fillStyle = `rgba(255,42,74,${(I - 0.5) * 0.1})`; ctx.fillRect(0, 0, W, H); }
  }
  if (G.alarmT > 0 && G.state === 'play') { // alarme do Vigia: bordas vermelhas pulsando
    const a = 0.2 * (0.55 + 0.45 * Math.sin(G.t * 13)) * Math.min(1, G.alarmT / 50);
    const gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    gr.addColorStop(0, 'rgba(255,30,60,0)'); gr.addColorStop(1, `rgba(255,30,60,${a})`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  if (G.slomo > 0.02) { // v8: câmera lenta do pulo alto — bordas escurecem de leve e o centro ganha um brilho quente
    const s = G.slomo, gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.58);
    gr.addColorStop(0, 'rgba(8,4,16,0)'); gr.addColorStop(1, `rgba(8,4,16,${0.42 * s})`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,170,90,${0.035 * s})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
}
