'use strict';
// =================================================================== elenco v3: recorte (cutout) das ilustrações de referência
// Cada referência (pose T, de frente) foi recortada em 14 peças (sprites/p<n>-<peça>.webp, posições em sprites/rig.json,
// coordenadas da imagem original 1024×1024). Aqui cada peça é um osso: gira em volta do pivô da junta e herda a
// posição do pai. As juntas ficam escondidas debaixo das cotoveleiras, joelheiras, gola e cós. Agachar e dobrar o
// joelho (que de frente acontece em profundidade) vira encurtamento vertical da coxa e da canela.
// Ângulos em graus. Braço esquerdo da imagem (L): -75 = caído ao lado do corpo, +60 = levantado. Braço direito (R): o
// espelho (+75 caído, -60 levantado). Perna L: + abre para fora; perna R: - abre para fora.
const TAU = Math.PI * 2, D2R = Math.PI / 180;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const BPM = 128, BEAT = 60 / BPM;

const BONES = [   // [nome, pai]
  ['pelvis', null], ['torso', 'pelvis'], ['head', 'torso'],
  ['uarmL', 'torso'], ['farmL', 'uarmL'], ['uarmR', 'torso'], ['farmR', 'uarmR'],
  ['thighL', 'pelvis'], ['shinL', 'thighL'], ['skateL', 'shinL'], ['thighR', 'pelvis'], ['shinR', 'thighR'], ['skateR', 'shinR'],
];
const DRAW_ORDER = ['shinL', 'shinR', 'skateL', 'skateR', 'thighL', 'thighR', 'pelvis', 'farmL', 'uarmL', 'farmR', 'uarmR', 'torso', 'head'];

// ----- carregamento
const RIG = { meta: null, img: {}, ready: false };
async function loadRig(base = '') {
  RIG.meta = await (await fetch(base + 'sprites/rig.json')).json();
  const jobs = [];
  for (const id in RIG.meta) for (const nm in RIG.meta[id].parts) {
    const p = RIG.meta[id].parts[nm], im = new Image(); im.src = base + p.src; RIG.img[id + nm] = im;
    jobs.push(im.decode().catch(() => {}));
  }
  await Promise.all(jobs); RIG.ready = true;
}

// ----- poses: devolvem { root: {x, lift, r}, <osso>: {r, sy, sx} }
const POSES = {
  idle: { label: 'Parado' }, push: { label: 'Remada' }, jump: { label: 'Pulo' }, grab: { label: 'Grab' },
  slide: { label: 'Powerslide' }, grind: { label: 'Grind' }, rock: { label: 'Comemoração' },
};
function pose(name, t) {
  const P = {}; for (const [b] of BONES) P[b] = { r: 0, sy: 1, sx: 1 };
  P.root = { x: 0, lift: 0, r: 0 }; P.fx = null;
  const arms = (l, fl, r_, fr) => { P.uarmL.r = l; P.farmL.r = fl; P.uarmR.r = r_; P.farmR.r = fr; };
  const legs = (tl, sl, tr, sr, cl = 1, cr = 1) => { P.thighL.r = tl; P.shinL.r = sl; P.thighR.r = tr; P.shinR.r = sr;
    P.thighL.sy = cl; P.shinL.sy = lerp(1, cl, 0.6); P.thighR.sy = cr; P.shinR.sy = lerp(1, cr, 0.6); };
  switch (name) {
    case 'idle': {   // respiração, peso trocando de perna devagar, cabeça no ritmo
      const br = Math.sin(t * 2.1), w = Math.sin(t * 0.9), b = Math.abs(Math.sin(t / BEAT * Math.PI));
      arms(-77 + br * 1.2, -6, 78 - br * 1.2, 7);
      legs(-3 + w * 1.5, 2, 3 + w * 1.5, -2, 0.97 - Math.max(0, w) * 0.03, 0.97 - Math.max(0, -w) * 0.03);
      P.root.x = w * 6; P.torso.sy = 1 + br * 0.006; P.torso.r = -w * 0.8; P.head.r = w * 1.2 + (b - 0.5) * 2.4; P.pelvis.r = w * 1.2;
      break;
    }
    case 'push': {   // patinação de frente: empurra para o lado, o peso vai para a perna que desliza
      const T = 1.15, ph = (t % T) / T, side = ph < 0.5 ? 1 : -1, u = (ph % 0.5) / 0.5, push = Math.sin(u * Math.PI), rec = smooth(0.7, 1, u);
      const out = 24 * ease(Math.min(1, u * 1.25)) * (1 - rec), lift = Math.sin(rec * Math.PI) * 0.12;
      const glide = 0.84 + 0.04 * (1 - push), pushS = 1 - lift;
      if (side > 0) legs(2 + out, -3 - out * 0.15, -2, 1, pushS, glide); else legs(2, -1, -2 - out, 3 + out * 0.15, glide, pushS);
      P.root.x = -side * 34 * push; P.pelvis.r = side * 3.5 * push; P.torso.r = -side * 4 * push; P.head.r = side * 3 * push;
      P.torso.sy = 0.97;
      // braço do lado que empurra abre para equilibrar, o outro cruza na frente do corpo
      const aL = side > 0 ? -58 + 20 * push : -82 - 6 * push, aR = side > 0 ? 82 + 6 * push : 58 - 20 * push;
      arms(aL, side > 0 ? -18 * push : 6, aR, side > 0 ? -6 : 18 * push);
      break;
    }
    case 'jump': {   // agacha, explode, encolhe no ar, aterrissa amortecendo
      const T = 1.7, ph = (t % T) / T;
      const crouchIn = smooth(0, 0.2, ph) * (1 - smooth(0.2, 0.28, ph)), land = smooth(0.74, 0.8, ph) * (1 - smooth(0.82, 0.98, ph));
      const air = clamp((ph - 0.27) / 0.47, 0, 1), inAir = ph > 0.27 && ph < 0.74, tuck = inAir ? Math.sin(air * Math.PI) : 0;
      const c = Math.max(crouchIn, land);
      P.root.lift = inAir ? Math.sin(air * Math.PI) * 230 : 0;
      legs(-2 + 12 * tuck, 4 - 10 * tuck, 2 - 12 * tuck, -4 + 10 * tuck, 1 - 0.26 * c - 0.34 * tuck, 1 - 0.26 * c - 0.34 * tuck);
      const up = inAir ? 1 - air * 0.6 : 0;
      arms(lerp(-77, -40, c) + up * 115, -10 - 10 * c, lerp(78, 40, c) - up * 115, 10 + 10 * c);
      P.torso.sy = 1 - 0.05 * c; P.head.r = -3 * tuck; P.root.r = inAir ? Math.sin(air * TAU) * 1.5 : 0;
      break;
    }
    case 'grab': {   // joelhos para cima e a mão direita segurando o patins
      const b = Math.sin(t * 2.6);
      P.root.lift = 210 + b * 10; P.root.r = -4 + b * 1.5;
      legs(16, -12, -6, 8, 0.55, 0.26);
      P.shinR.sy = 0.42; P.skateR.r = -12;
      arms(40 + b * 6, 14, 86, -2); P.torso.r = 20; P.torso.sy = 0.92; P.head.r = 10; P.pelvis.r = 4;
      break;
    }
    case 'slide': {   // powerslide: a perna esquerda vai para o lado e trava, o corpo desce sobre a direita
      const vib = Math.sin(t * 55) * 0.6;
      legs(52, -6 + vib, -5, 2, 1.0, 0.74);
      P.skateL.r = 0; P.root.x = 40; P.pelvis.r = -7; P.torso.r = 4 + vib * 0.2; P.head.r = -4;
      arms(-14 + vib, -8, 70, 26); P.fx = 'sparksL';
      break;
    }
    case 'grind': {   // soul grind: base larga em cima do corrimão, braços abertos se equilibrando
      const w = Math.sin(t * 5.6), w2 = Math.sin(t * 3.1 + 1);
      legs(10, -6, -10, 6, 0.86, 0.86);
      P.root.x = w * 10; P.root.lift = 18; P.pelvis.r = w * 2; P.torso.r = -w * 4.5; P.head.r = w * 2.5;
      arms(-16 + w * 10 + w2 * 4, -6 + w * 6, 16 + w * 10 - w2 * 4, 6 + w * 6); P.fx = 'rail';
      break;
    }
    case 'rock': {   // pulinho no tempo da música, soco no ar com a direita
      const bt = t / BEAT, b = Math.abs(Math.sin(bt * Math.PI)), pump = Math.max(0, Math.sin(bt * Math.PI * 2));
      P.root.lift = b * 34; legs(-3, 3, 3, -3, 0.9 + b * 0.1, 0.9 + b * 0.1);
      arms(-72 + b * 6, -12, -62 - pump * 14, -58 + pump * 30);
      P.torso.r = -2 * pump; P.head.r = 4 * (1 - b) - 2; P.torso.sy = 0.98 + b * 0.02;
      break;
    }
  }
  return P;
}

// ----- desenho: g já posicionado no chão debaixo do personagem; scale = pixels por pixel da ilustração
function drawRig(g, id, poseName, t, scale, opts = {}) {
  const M = RIG.meta && RIG.meta[id]; if (!M || !RIG.ready) return;
  const P = pose(poseName, t), W = {};
  // transformações em coordenadas da ilustração; a raiz põe o pivô da bacia no lugar certo
  const piv = M.piv;
  const solve = (rootY) => {
    for (const [b, par] of BONES) {
      const q = P[b], [px, py] = piv[b];
      let pos, ang;
      if (!par) { pos = [px + P.root.x, rootY]; ang = (q.r + P.root.r) * D2R; }
      else { const pm = W[par].full; const p2 = pm.transformPoint(new DOMPoint(px, py)); pos = [p2.x, p2.y]; ang = W[par].ang + q.r * D2R; }
      if (b === 'skateL' || b === 'skateR') ang = q.r * D2R + P.root.r * D2R;   // patins sempre paralelo ao chão (salvo a pose pedir)
      const base = new DOMMatrix().translate(pos[0], pos[1]).rotate(ang / D2R);
      const full = base.scale(q.sx, q.sy).translate(-px, -py);
      W[b] = { ang, full };
    }
  };
  // chão: põe a roda mais baixa encostada no y do chão da ilustração
  solve(piv.pelvis[1]);
  const lowY = Math.max(...['skateL', 'skateR'].map(s => { const p = M.parts[s]; return W[s].full.transformPoint(new DOMPoint(p.x + p.w / 2, M.ground)).y; }));
  const rootY = piv.pelvis[1] + (M.ground - lowY) - P.root.lift;
  solve(rootY);
  const cx = piv.pelvis[0];
  g.save();
  // sombra
  const sh = clamp(1 - P.root.lift / 400, 0.35, 1);
  if (P.fx !== 'rail') { g.fillStyle = opts.shadow || 'rgba(5,2,12,0.4)'; g.beginPath(); g.ellipse(P.root.x * scale, 0, 190 * scale * sh, 22 * scale * sh, 0, 0, TAU); g.fill(); }
  g.scale(scale, scale); g.translate(-cx, -M.ground);
  if (P.fx === 'rail') drawRail(g, M, W);
  const base = g.getTransform();
  for (const b of DRAW_ORDER) {
    const p = M.parts[b], im = RIG.img[id + b]; if (!im) continue;
    g.setTransform(base.multiply(W[b].full)); g.drawImage(im, p.x, p.y, p.w, p.h);
  }
  g.setTransform(base);
  if (P.fx === 'sparksL') drawSparks(g, M, W, t);
  g.restore();
}
function drawRail(g, M, W) {
  const y = M.ground - 6;
  g.fillStyle = '#5d5870'; g.fillRect(M.piv.pelvis[0] - 520, y + 26, 40, 160); g.fillRect(M.piv.pelvis[0] + 480, y + 26, 40, 160);
  g.fillStyle = '#c9c4d6'; g.fillRect(M.piv.pelvis[0] - 640, y, 1280, 30);
  g.fillStyle = '#8d87a0'; g.fillRect(M.piv.pelvis[0] - 640, y + 22, 1280, 8);
}
function drawSparks(g, M, W, t) {
  const p = M.parts.skateL, pt = W.skateL.full.transformPoint(new DOMPoint(p.x + p.w * 0.3, M.ground - 10));
  g.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const seed = Math.floor(t * 24) * 13 + i, rnd = n => { const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
    const a = Math.PI * (1.0 + rnd(1) * 0.45), len = 40 + rnd(2) * 110, x0 = pt.x + (rnd(3) - 0.5) * 80;
    g.strokeStyle = rnd(4) > 0.5 ? '#ffd23f' : '#ff9a3c'; g.lineWidth = 6 + rnd(5) * 4;
    g.beginPath(); g.moveTo(x0, pt.y); g.lineTo(x0 + Math.cos(a) * len, pt.y + Math.sin(a) * len); g.stroke();
  }
}
