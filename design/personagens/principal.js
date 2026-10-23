'use strict';
// =================================================================== personagem principal: esqueleto de perfil (olhando para +x)
// Peças recortadas da vista LADO da ficha (cut_principal.py → sprites/principal-*.webp e principal.json, coordenadas do
// recorte 320×784). De perfil só se vê um braço e uma perna; o braço e a perna de trás são as mesmas peças, desenhadas
// atrás do corpo e escurecidas. Usa os utilitários de rig.js (clamp, lerp, smooth, ease, D2R, BEAT, TAU).
// Ângulos em graus, sentido horário: perna/braço para a FRENTE = negativo; joelho dobrando = positivo na canela;
// cotovelo dobrando = negativo no antebraço; tronco inclinando para a frente = positivo.
const MAIN = { meta: null, img: {}, dark: {}, ready: false };
const MAIN_BONES = [   // [osso, pai, peça]
  ['torso', null, 'torso'], ['head', 'torso', 'head'],
  ['uarmF', 'torso', 'uarm'], ['farmF', 'uarmF', 'farm'], ['uarmB', 'torso', 'uarm'], ['farmB', 'uarmB', 'farm'],
  ['thighF', 'torso', 'thigh'], ['shinF', 'thighF', 'shin'], ['skateF', 'shinF', 'skate'],
  ['thighB', 'torso', 'thigh'], ['shinB', 'thighB', 'shin'], ['skateB', 'shinB', 'skate'],
];
const MAIN_ORDER = ['uarmB', 'farmB', 'thighB', 'shinB', 'skateB', 'shinF', 'skateF', 'thighF', 'torso', 'head', 'uarmF', 'farmF'];
const MAIN_DARK = { uarmB: 1, farmB: 1, thighB: 1, shinB: 1, skateB: 1 };
async function loadMain(base = '') {
  MAIN.meta = await (await fetch(base + 'sprites/principal.json')).json();
  await Promise.all(Object.entries(MAIN.meta.parts).map(async ([nm, p]) => {
    const im = new Image(); im.src = base + p.src; await im.decode().catch(() => {}); MAIN.img[nm] = im;
    // cópia escurecida e azulada para as peças do lado de trás
    const c = document.createElement('canvas'); c.width = p.w; c.height = p.h; const g = c.getContext('2d');
    g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, p.w, p.h), px = d.data;
    for (let i = 0; i < px.length; i += 4) { px[i] *= 0.62; px[i + 1] *= 0.62; px[i + 2] *= 0.7; }
    g.putImageData(d, 0, 0); MAIN.dark[nm] = c;
  }));
  MAIN.ready = true;
}

// ----- poses de perfil
function mainPose(name, t) {
  const P = {}; for (const [b] of MAIN_BONES) P[b] = { r: 0, sy: 1 };
  P.root = { x: 0, lift: 0 }; P.fx = null;
  const leg = (s, th, sh, sk = 0) => { P['thigh' + s].r = th; P['shin' + s].r = sh; P['skate' + s].level = sk; };
  const arm = (s, ua, fa) => { P['uarm' + s].r = ua; P['farm' + s].r = fa; };
  switch (name) {
    case 'idle': {   // em pé nos patins, joelho levemente dobrado, respirando e balançando a cabeça no ritmo
      const br = Math.sin(t * 2.1), b = Math.abs(Math.sin(t / BEAT * Math.PI));
      leg('F', -9, 14); leg('B', 7, 10);
      arm('F', 4 + br * 1.5, -8); arm('B', -6 - br * 1.5, -10);
      P.torso.r = 2 + br * 0.6; P.head.r = -2 + b * 2.5; P.torso.sy = 1 + br * 0.005;
      break;
    }
    case 'push': {   // passada de patinação: a perna empurra para trás e para fora, a outra desliza dobrada embaixo do corpo
      const T = 1.1, ph = (t % T) / T;
      const stroke = q => {   // ciclo de uma perna: q 0..1 (0 = pé embaixo do corpo, 0.5 = fim do empurrão atrás)
        const push = smooth(0, 0.5, q) * (1 - smooth(0.5, 1, q)), rec = q > 0.5 ? Math.sin((q - 0.5) / 0.5 * Math.PI) : 0;
        return { th: lerp(-24, 34, push) - rec * 18, sh: lerp(44, 8, push) + rec * 55, lvl: lerp(0, 10, push) - rec * 12 };
      };
      const f = stroke(ph), b = stroke((ph + 0.5) % 1);
      leg('F', f.th, f.sh, f.lvl); leg('B', b.th, b.sh, b.lvl);
      const sw = Math.sin(ph * TAU);
      arm('F', -sw * 34, -18 - Math.max(0, sw) * 20); arm('B', sw * 34, -18 - Math.max(0, -sw) * 20);
      P.torso.r = 20 + Math.sin(ph * TAU * 2) * 1.5; P.head.r = -14; P.root.lift = -Math.abs(Math.sin(ph * TAU)) * 6;
      break;
    }
    case 'jump': {   // agacha, estica tudo, grupa no ar, aterrissa amortecendo
      const T = 1.7, ph = (t % T) / T;
      const c = smooth(0, 0.2, ph) * (1 - smooth(0.2, 0.27, ph)) + smooth(0.74, 0.8, ph) * (1 - smooth(0.82, 0.98, ph));
      const air = clamp((ph - 0.27) / 0.47, 0, 1), inAir = ph > 0.27 && ph < 0.74, tuck = inAir ? Math.sin(air * Math.PI) : 0;
      P.root.lift = inAir ? Math.sin(air * Math.PI) * 190 : 0;
      leg('F', -10 - 55 * c - 60 * tuck, 14 + 85 * c + 95 * tuck); leg('B', 6 - 40 * c - 40 * tuck, 10 + 80 * c + 85 * tuck);
      arm('F', lerp(4, 40, c) - tuck * 120, -10 - 30 * tuck); arm('B', lerp(-6, 45, c) - tuck * 95, -20 - 20 * tuck);
      P.torso.r = 2 + 24 * c + 10 * tuck; P.head.r = -2 - 18 * c - 6 * tuck;
      break;
    }
    case 'grab': {   // no ar: joelhos no peito e a mão da frente segurando o patins
      const b = Math.sin(t * 2.6);
      P.root.lift = 170 + b * 8;
      leg('F', -88, 118, -6); leg('B', -50, 104, 4);
      arm('F', -42, -60); arm('B', -125 + b * 8, -20);
      P.torso.r = 24; P.head.r = -20;
      break;
    }
    case 'slide': {   // powerslide: perna da frente esticada e travando de lado, a de trás bem agachada, corpo para trás
      const vib = Math.sin(t * 55) * 0.8;
      leg('F', -68 + vib, 8, 0); leg('B', -42, 118, 0);
      arm('F', -78, -15); arm('B', 32, -6);
      P.torso.r = -8 + vib * 0.2; P.head.r = 6; P.fx = 'sparks';
      break;
    }
    case 'grind': {   // soul grind: pés abertos sobre o corrimão, agachado, braços abertos se equilibrando
      const w = Math.sin(t * 5.6);
      leg('F', -32, 44, 0); leg('B', 30, 38, 0);
      arm('F', -78 + w * 14, -10); arm('B', 70 - w * 14, -10);
      P.torso.r = 10 + w * 4; P.head.r = -8; P.root.lift = 26; P.fx = 'rail';
      break;
    }
    case 'rock': {   // pulinho no tempo e soco no ar com o braço da frente
      const bt = t / BEAT, b = Math.abs(Math.sin(bt * Math.PI)), pump = Math.max(0, Math.sin(bt * Math.PI * 2));
      P.root.lift = b * 40; leg('F', -16 - 10 * (1 - b), 26 + 20 * (1 - b)); leg('B', 10, 22 + 16 * (1 - b));
      arm('F', -104 - pump * 14, -34 + pump * 10); arm('B', 14, -30);
      P.torso.r = -4; P.head.r = -10 + 6 * (1 - b);
      break;
    }
  }
  return P;
}

// ----- desenho: g no chão debaixo do personagem; scale = pixels de tela por pixel do recorte
function drawMain(g, poseName, t, scale, opts = {}) {
  if (!MAIN.ready) return;
  const M = MAIN.meta, piv = M.piv, P = mainPose(poseName, t), W = {};
  const pv = b => piv[b.replace(/[FB]$/, '')];
  const solve = rootY => {
    for (const [b, par] of MAIN_BONES) {
      const q = P[b], [px, py] = pv(b);
      let pos, ang;
      if (!par) { pos = [px + P.root.x, rootY]; ang = q.r * D2R; }
      else { const p2 = W[par].full.transformPoint(new DOMPoint(px, py)); pos = [p2.x, p2.y]; ang = W[par].ang + q.r * D2R; }
      if (b.startsWith('skate') && q.level != null) ang = q.level * D2R;   // patins com o giro pedido pela pose (0 = paralelo ao chão)
      W[b] = { ang, full: new DOMMatrix().translate(pos[0], pos[1]).rotate(ang / D2R).scale(1, q.sy).translate(-px, -py) };
    }
  };
  const wheels = s => { const p = M.parts.skate; return [p.x + 18, p.x + p.w - 18].map(x => W[s].full.transformPoint(new DOMPoint(x, M.ground)).y); };
  solve(piv.torso[1]);
  const low = Math.max(...wheels('skateF'), ...wheels('skateB'));
  solve(piv.torso[1] + (M.ground - low) - P.root.lift);
  const cx = piv.torso[0];
  g.save();
  const sh = clamp(1 - P.root.lift / 320, 0.35, 1);
  if (P.fx !== 'rail') { g.fillStyle = opts.shadow || 'rgba(5,2,12,0.4)'; g.beginPath(); g.ellipse(4 * scale, 0, 120 * scale * sh, 14 * scale * sh, 0, 0, TAU); g.fill(); }
  g.scale(scale, scale); g.translate(-cx, -M.ground);
  if (P.fx === 'rail') { const y = M.ground - 4; g.fillStyle = '#5d5870'; g.fillRect(cx - 300, y + 18, 22, 120); g.fillRect(cx + 280, y + 18, 22, 120); g.fillStyle = '#c9c4d6'; g.fillRect(cx - 380, y, 760, 20); g.fillStyle = '#8d87a0'; g.fillRect(cx - 380, y + 14, 760, 6); }
  const base = g.getTransform();
  for (const b of MAIN_ORDER) {
    const part = MAIN_BONES.find(x => x[0] === b)[2], p = M.parts[part];
    g.setTransform(base.multiply(W[b].full)); g.drawImage(MAIN_DARK[b] ? MAIN.dark[part] : MAIN.img[part], p.x, p.y, p.w, p.h);
  }
  g.setTransform(base);
  if (P.fx === 'sparks') {
    const p = M.parts.skate, pt = W.skateF.full.transformPoint(new DOMPoint(p.x + 30, M.ground - 6));
    g.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const seed = Math.floor(t * 24) * 13 + i, rnd = n => { const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
      const a = Math.PI * (1.02 + rnd(1) * 0.4), len = 30 + rnd(2) * 80, x0 = pt.x + (rnd(3) - 0.5) * 50;
      g.strokeStyle = rnd(4) > 0.5 ? '#ffd23f' : '#ff9a3c'; g.lineWidth = 4 + rnd(5) * 3;
      g.beginPath(); g.moveTo(x0, pt.y); g.lineTo(x0 + Math.cos(a) * len, pt.y + Math.sin(a) * len); g.stroke();
    }
  }
  g.restore();
}
