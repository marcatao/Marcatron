'use strict';
// =================================================================== elenco v2: rig vetorial "flat"
// Estilo: cores chapadas, uma sombra dura por forma (luz vindo de cima e da frente), membros de macarrão, cabeça grande,
// olhos de feijão com brilho e bochechas coradas. Mesmo esquema do jogo: origem no chão debaixo do personagem, olhando
// para +x, unidades do mundo do jogo (16 = um bloco). Desenha com drawChar(g, C, poseName, t, opts).
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const BPM = 128, BEAT = 60 / BPM;

// ----- elenco: proporções (rig) e paleta. line = contorno (não é preto: é o tom mais escuro de cada um)
const CAST = {
  gabriel: {
    id: 'gabriel', name: 'Gabriel Rock', hair: 'mohawk', beard: true, top: 'jacket', legs: 'pants', back: 'guitar', sign: 'horns',
    rig: { skH: 3.5, thigh: 3.3, shin: 3.1, torso: 6.0, shW: 7.2, waist: 6.2, R: 3.75, arm1: 2.8, arm2: 2.7, legW: 2.55, armW: 2.0, neck: 0.35, sk: 0.95 },
    pal: {
      line: '#24183a', skin: '#f6c7a1', skinS: '#e09a74', blush: '#ff8a8a', eye: '#24183a',
      hair: '#3a2620', hairS: '#24160f', beard: '#7a5038', beardS: '#5a3826',
      helm: '#f4efe6', helmS: '#cfc6b8', crest: '#ff7a1a', crestS: '#d9560a', sticker: '#2c2350', sticker2: '#b6ff3b',
      top: '#a6e83a', topS: '#6fb51c', tee: '#fbf7ee', teeS: '#dcd2c2', print: '#ff6a10',
      leg: '#5a6fb0', legS: '#41528c', pad: '#2c2833', padS: '#1b1820', padA: '#ff7a1a',
      boot: '#2c2833', bootS: '#1b1820', bootA: '#ff7a1a', frame: '#ff7a1a', frameS: '#c9520c', wheel: '#ffd23f', wheelS: '#e0a812',
      guitar: '#ff7a1a', guitarS: '#c9520c', neckC: '#5a3a26',
    },
  },
  lua: {
    id: 'lua', name: 'Lua Riff', hair: 'pigtails', beard: false, top: 'bandtee', legs: 'stripes', back: null, sign: 'horns',
    rig: { skH: 3.4, thigh: 3.3, shin: 3.1, torso: 5.7, shW: 6.4, waist: 5.6, R: 3.75, arm1: 2.75, arm2: 2.65, legW: 2.35, armW: 1.8, neck: 0.35, sk: 0.92 },
    pal: {
      line: '#2a1533', skin: '#c68a5f', skinS: '#a1683f', blush: '#ff6f8e', eye: '#2a1533',
      hair: '#3a2233', hairS: '#24131f', tips: '#ff4fa3', tipsS: '#d12a80', tie: '#7ff0c8',
      helm: '#7ff0c8', helmS: '#45c79c', sticker: '#ffd23f', sticker2: '#ff4fa3',
      top: '#ffd23f', topS: '#e3a914', print: '#2a1533',
      flan: '#e0405a', flanS: '#a82640', flanL: '#ffb0bd',
      short: '#5b3f9e', shortS: '#43307a',
      leg: '#2b2340', legS: '#1d1730', stripe: '#f2eefa',
      pad: '#7b4dff', padS: '#5a31d6', padA: '#7ff0c8',
      boot: '#f6f2ff', bootS: '#cfc6e6', bootA: '#ff4fa3', frame: '#7b4dff', frameS: '#5a31d6', wheel: '#ff4fa3', wheelS: '#d12a80',
      earring: '#ffd23f',
    },
  },
  merlin: {
    id: 'merlin', name: 'Merlin', hair: 'curls', beard: true, top: 'tee', legs: 'pants', back: null, sign: 'point2', bandana: true,
    rig: { skH: 4.4, thigh: 6.1, shin: 5.9, torso: 10.2, shW: 9.0, waist: 7.4, R: 3.95, arm1: 4.9, arm2: 4.7, legW: 2.7, armW: 1.85, neck: 1.2, sk: 1.12 },
    pal: {
      line: '#140f1f', skin: '#e6aa80', skinS: '#c4835c', blush: '#f08a78', eye: '#2a1810',
      hair: '#b48a55', hairS: '#7d5a33', hairL: '#e0bf8a', beard: '#7a5636', beardS: '#5a3d24',
      band: '#2a45a8', bandS: '#1b2c74', bandDot: '#e8eefc',
      helm: '#ff5a1f', helmS: '#c63f10', sticker: '#2a45a8', sticker2: '#f2f0ea',
      top: '#2a2732', topS: '#1a1820', print: '#f2f0ea',
      leg: '#33303b', legS: '#22202a', pad: '#22202a', padS: '#141218', padA: '#ff5a1f',
      boot: '#ff5a1f', bootS: '#c63f10', bootA: '#ffd2ad', frame: '#22212a', frameS: '#141218', wheel: '#ece6da', wheelS: '#c9c0b0', hub: '#ffb347',
    },
  },
};

// ----- desenho básico: forma chapada com sombra dura e contorno opcional
const ST = { line: true, OL: 0.32 };
function fillShape(g, build, base, shade, line, off = 0.75) {
  if (ST.line && line) { build(); g.lineJoin = 'round'; g.lineWidth = ST.OL * 2; g.strokeStyle = line; g.stroke(); }
  build(); g.fillStyle = shade || base; g.fill();
  if (shade) { g.save(); build(); g.clip(); g.translate(-off, -off * 0.8); build(); g.fillStyle = base; g.fill(); g.restore(); }
}
function poly(g, pts) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); }
// membro de macarrão: traço grosso arredondado; a sombra fica no lado de baixo e de trás
function noodle(g, pts, w, base, shade, line) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (ST.line && line) { poly(g, pts); g.lineWidth = w + ST.OL * 2; g.strokeStyle = line; g.stroke(); }
  poly(g, pts); g.lineWidth = w; g.strokeStyle = shade; g.stroke();
  g.save(); g.translate(-w * 0.14, -w * 0.15); poly(g, pts); g.lineWidth = w * 0.62; g.strokeStyle = base; g.stroke(); g.restore();
}
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); }
function rr(g, x, y, w, h, r) { r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2); g.beginPath(); g.roundRect(x, y, w, h, r); }
// IK de dois ossos; bend +1 dobra para a frente (joelho), -1 para trás (cotovelo)
function ik(ax, ay, bx, by, L1, L2, bend) {
  const dx = bx - ax, dy = by - ay, a = Math.atan2(dy, dx);
  const d = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 0.01, (L1 + L2) * 0.999);
  const c = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), k = a - bend * Math.acos(c);
  return { kx: ax + Math.cos(k) * L1, ky: ay + Math.sin(k) * L1, ex: ax + Math.cos(a) * d, ey: ay + Math.sin(a) * d };
}

// ----- poses (t em segundos). Pés: [x, y, giro]; braços: { a: ângulo } ou { to: [x, y] } no referencial do mundo
const POSES = {
  idle: { label: 'Parado' }, push: { label: 'Remada' }, jump: { label: 'Pulo' }, grab: { label: 'Grab' },
  slide: { label: 'Powerslide' }, grind: { label: 'Grind' }, rock: { label: 'Comemoração' },
};
function pose(name, t, C) {
  const R = C.rig, L = R.thigh + R.shin, k = L / 6.4, A = R.arm1 + R.arm2, beat = t / BEAT;
  const p = { crouch: 0.07, lean: 0.03, lift: 0, sx: 1, sy: 1, front: [1.6 * k, 0, 0], back: [-1.3 * k, 0, 0],
    armF: { a: Math.PI / 2 - 0.25 }, armB: { a: Math.PI / 2 + 0.25 }, handF: 'fist', handB: 'fist', nod: 0, mouth: 'smile', sway: 0, vy: 0, wheel: t * 3, eyes: 'open' };
  switch (name) {
    case 'idle': {
      const b = Math.abs(Math.sin(beat * Math.PI));
      p.crouch = 0.06 + b * 0.05; p.nod = b * 0.35; p.lean = 0.03 + Math.sin(t * 1.7) * 0.02; p.wheel = 0;
      p.armF = { a: Math.PI / 2 - 0.22 + Math.sin(t * 2.2) * 0.05 }; p.armB = { a: Math.PI / 2 + 0.24 + Math.sin(t * 2.2 + 1) * 0.05 };
      p.handB = 'open'; p.sway = Math.sin(t * 1.7) * 0.15; break;
    }
    case 'push': {
      const ph = t * TAU * 0.95, Lr = L * 0.95 + 2.2 * k, F0 = 1.4 * k;
      const foot = q => { const c = ((q % TAU) + TAU) % TAU;
        if (c < Math.PI) return [lerp(F0, -Lr, smooth(0, 1, c / Math.PI)), 0, 0];
        const u = smooth(0, 1, (c - Math.PI) / Math.PI); return [lerp(-Lr, F0, u), -Math.sin(u * Math.PI) * 1.5 * k, -0.18 * Math.sin(u * Math.PI)]; };
      p.crouch = 0.24; p.lean = 0.3; p.front = foot(ph); p.back = foot(ph + Math.PI);
      p.armF = { a: Math.PI / 2 - Math.sin(ph + Math.PI) * 1.15 }; p.armB = { a: Math.PI / 2 - Math.sin(ph) * 1.15 };
      p.handF = p.handB = 'open'; p.sway = -0.7 + Math.sin(ph * 2) * 0.12; p.wheel = t * 14;
      p.lift = Math.abs(Math.sin(ph)) * 0.25; break;
    }
    case 'jump': {
      const T = 1.5, u = (t % T) / T, a = clamp((u - 0.14) / 0.68, 0, 1), H = 7 * Math.sqrt(k);
      p.lift = Math.sin(a * Math.PI) * H; p.vy = a > 0 && a < 1 ? Math.cos(a * Math.PI) : 0;
      if (a <= 0 || a >= 1) {   // preparação e aterrissagem: agacha e achata
        const q = a <= 0 ? smooth(0, 0.14, u) : 1 - smooth(0.82, 1, u);
        p.crouch = 0.1 + q * 0.42; p.sy = 1 - q * 0.08; p.sx = 1 + q * 0.07; p.lean = 0.1 + q * 0.12;
        p.armF = { a: Math.PI / 2 + 0.5 * q }; p.armB = { a: Math.PI / 2 + 0.9 * q };
      } else {
        p.crouch = 0.12 + (1 - Math.abs(p.vy)) * 0.2; p.sy = 1 + p.vy * 0.06; p.sx = 1 - p.vy * 0.04;
        p.front = [1.9 * k, -1.8 * (1 - Math.abs(p.vy)) - 0.6, -0.25]; p.back = [-1.5 * k, -1.0, -0.08];
        p.armF = { a: -0.55 - p.vy * 0.3 }; p.armB = { a: -2.45 + p.vy * 0.25 }; p.handF = p.handB = 'open';
        p.mouth = 'grin'; p.sway = p.vy * 0.9;
      }
      p.wheel = t * 6; break;
    }
    case 'grab': {
      p.lift = 6.5 * Math.sqrt(k) + Math.sin(t * 2.4) * 0.6; p.crouch = 0.5; p.lean = 0.3;
      p.front = [2.0 * k, -4.6 * k, -0.6]; p.back = [-2.6 * k, -0.9, 0.22];
      p.armF = { to: 'frontBoot' }; p.armB = { a: -2.35 + Math.sin(t * 2.4) * 0.1 }; p.handB = 'horns';
      p.mouth = 'grin'; p.sway = 0.35 + Math.sin(t * 2.4) * 0.2; p.wheel = t * 8; break;
    }
    case 'slide': {
      const vib = Math.sin(t * 60) * 0.06;
      p.crouch = 0.52; p.lean = -0.32 + vib * 0.3; p.front = [L * 1.25 + 2.6 * k, 0, -0.06]; p.back = [-0.5 * k, 0, 0];
      p.armB = { to: [-L * 1.15 - 0.6, -0.5] }; p.armF = { a: -0.22 }; p.handB = 'open'; p.handF = 'fist';
      p.mouth = 'o'; p.eyes = 'focus'; p.sway = -0.9; p.wheel = t * 2; p.sparks = 'front'; break;
    }
    case 'grind': {
      const wob = Math.sin(t * 6.5);
      p.lift = 2.2; p.crouch = 0.38; p.lean = 0.08 + wob * 0.05; p.front = [L * 0.72 + 1.4 * k, 0, -0.05]; p.back = [-(L * 0.62 + 1.2 * k), 0, 0.12];
      p.armF = { a: -0.2 + wob * 0.15 }; p.armB = { a: -2.9 + wob * 0.15 }; p.handF = p.handB = 'open';
      p.mouth = 'grin'; p.sway = -0.6 + wob * 0.2; p.rail = true; p.sparks = 'rail'; p.wheel = 0; break;
    }
    case 'rock': {
      const b = Math.abs(Math.sin(beat * Math.PI)), hop = b * 1.6;
      p.lift = hop; p.crouch = 0.08 + (1 - b) * 0.12; p.nod = (1 - b) * 0.5; p.vy = Math.cos(beat * Math.PI) * 0.6;
      p.front = [1.4 * k, -hop * 0.15, -0.08]; p.back = [-1.4 * k, -hop * 0.1, 0.06];
      if (C.sign === 'point2') { p.armF = { a: -0.25 + Math.sin(t * 4) * 0.05 }; p.handF = 'point2'; p.armB = { a: Math.PI / 2 + 0.9 }; p.handB = 'fist'; }
      else { p.armF = { a: -0.6 + Math.sin(beat * Math.PI * 2) * 0.1 }; p.handF = 'horns'; p.armB = { a: Math.PI / 2 + 1.0 }; p.handB = 'fist'; }
      p.mouth = 'grin'; p.eyes = 'happy'; p.sway = p.vy * 0.7; p.wheel = 0; break;
    }
  }
  p.blink = (t % 3.6) < 0.11 && p.eyes === 'open';
  return p;
}

// ----- personagem completo
function drawChar(g, C, poseName, t, opts = {}) {
  const R = C.rig, P = C.pal, p = pose(poseName, t, C);
  const legL = R.thigh + R.shin, skH = R.skH;
  g.save();
  // sombra no chão (encolhe com a altura)
  const sh = clamp(1 - p.lift / 14, 0.4, 1);
  if (!p.rail) { g.fillStyle = opts.shadow || 'rgba(10,6,20,0.35)'; ell(g, 0.4, 0.2, (5 + legL * 0.35) * sh, 0.9 * sh); g.fill(); }
  g.translate(0, -p.lift);
  g.scale(p.sx, p.sy);
  const hipY = -(skH + legL * 0.97) + p.crouch * legL * 0.8;
  const shY = hipY - R.torso, headX = 0.5, headY = shY - R.neck - R.R * 0.88 + p.nod;
  const rot = (x, y, a) => { const c = Math.cos(a), s = Math.sin(a), dy = y - hipY; return [x * c - dy * s, hipY + x * s + dy * c]; };
  const toU = (x, y) => rot(x, y, -p.lean);   // ponto do mundo → referencial do tronco inclinado
  const upper = fn => { g.save(); g.translate(0, hipY); g.rotate(p.lean); g.translate(0, -hipY); fn(); g.restore(); };
  // pernas
  const legs = {};
  for (const [nm, sx, ft] of [['back', -1, p.back], ['front', 1, p.front]]) {
    const hx = sx * R.waist * 0.14, ax = ft[0] + 0.15, ay = ft[1] - skH + 0.4;
    legs[nm] = { hx, ...ik(hx, hipY, ax, ay, R.thigh, R.shin, 1), fx: ft[0], fy: ft[1], fr: ft[2] };
  }
  // braços
  const arms = {}, shx = R.shW * 0.3;
  for (const [nm, sx, spec] of [['back', -1, p.armB], ['front', 1, p.armF]]) {
    const ax = sx * shx, ay = shY + 1.1; let hx, hy;
    if (spec.a != null) { hx = ax + Math.cos(spec.a) * (R.arm1 + R.arm2); hy = ay + Math.sin(spec.a) * (R.arm1 + R.arm2); }
    else {
      let w = spec.to;
      if (w === 'frontBoot') { const F = legs.front; const c = Math.cos(F.fr), sn = Math.sin(F.fr), lx = 0.4 * R.sk, ly = -3.0 * R.sk; w = [F.fx + lx * c - ly * sn, F.fy + lx * sn + ly * c]; }
      [hx, hy] = toU(w[0], w[1]);
    }
    arms[nm] = { ax, ay, ...ik(ax, ay, hx, hy, R.arm1, R.arm2, -1), hand: nm === 'front' ? p.handF : p.handB };
  }
  const env = { C, R, P, p, t, hipY, shY, headX, headY, legs, arms };
  // ordem: cabelo de trás, violão, braço de trás, perna de trás, (corrimão), tronco, perna da frente, cabeça, braço da frente
  upper(() => drawHairBack(g, env));
  if (C.back === 'guitar') upper(() => drawGuitarBack(g, env));
  upper(() => drawArm(g, env, arms.back, true));
  drawLeg(g, env, legs.back, true);
  if (p.rail) drawRail(g, env);
  upper(() => drawTorso(g, env));
  drawLeg(g, env, legs.front, false);
  upper(() => { drawHead(g, env); drawArm(g, env, arms.front, false); });
  if (p.sparks) drawSparks(g, env);
  g.restore();
}

// ----- patins inline (origem embaixo das rodas, debaixo do tornozelo)
function drawSkate(g, env, far, spin) {
  const P = env.P, s = env.R.sk, dk = far ? 0.82 : 1;
  const sh = c => far ? mixHex(c, env.P.line, 0.25) : c;
  // rodas
  for (const wx of [-1.95, -0.65, 0.65, 1.95]) {
    const x = wx * s, y = -0.62 * s, r = 0.62 * s;
    fillShape(g, () => ell(g, x, y, r, r), sh(P.wheel), sh(P.wheelS), P.line, 0.22 * s);
    g.fillStyle = sh(P.hub || P.frameS); ell(g, x, y, r * 0.36, r * 0.36); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.14 * s; g.beginPath(); g.moveTo(x + Math.cos(spin) * r * 0.62, y + Math.sin(spin) * r * 0.62); g.lineTo(x + Math.cos(spin) * r * 0.36, y + Math.sin(spin) * r * 0.36); g.stroke();
  }
  // trilho (frame)
  fillShape(g, () => rr(g, -2.6 * s, -1.75 * s, 5.2 * s, 0.75 * s, 0.3 * s), sh(P.frame), sh(P.frameS), P.line, 0.25 * s);
  // bota: cano alto, bico arredondado
  fillShape(g, () => {
    g.beginPath();
    g.moveTo(-2.35 * s, -1.65 * s); g.lineTo(2.25 * s, -1.65 * s);
    g.quadraticCurveTo(2.95 * s, -1.7 * s, 2.75 * s, -2.55 * s); g.quadraticCurveTo(2.4 * s, -3.15 * s, 0.9 * s, -3.2 * s);
    g.lineTo(0.85 * s, -4.15 * s); g.quadraticCurveTo(-0.6 * s, -4.45 * s, -2.05 * s, -4.15 * s);
    g.quadraticCurveTo(-2.6 * s, -2.9 * s, -2.35 * s, -1.65 * s); g.closePath();
  }, sh(P.boot), sh(P.bootS), P.line, 0.5 * s);
  // fivela e cadarço (cor de destaque)
  g.fillStyle = sh(P.bootA); rr(g, -2.0 * s, -3.75 * s, 2.7 * s, 0.5 * s, 0.25 * s); g.fill();
  g.strokeStyle = sh(P.bootA); g.lineWidth = 0.22 * s; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo((0.35 + i * 0.5) * s, (-3.0 + i * 0.12) * s); g.lineTo((0.8 + i * 0.5) * s, (-2.6 + i * 0.12) * s); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.35)'; ell(g, 1.9 * s, -2.55 * s, 0.55 * s, 0.22 * s, -0.3); g.fill();
}
function mixHex(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const m = (x, y) => Math.round(lerp(x, y, t));
  return '#' + ((1 << 24) | (m(a >> 16, b >> 16) << 16) | (m((a >> 8) & 255, (b >> 8) & 255) << 8) | m(a & 255, b & 255)).toString(16).slice(1);
}

// ----- pernas: calça (ou meia listrada), joelheira e patins
function drawLeg(g, env, Lg, far) {
  const { C, R, P, hipY, p } = env, sh = c => far ? mixHex(c, P.line, 0.22) : c;
  const pts = [Lg.hx, hipY, Lg.kx, Lg.ky, Lg.ex, Lg.ey];
  noodle(g, pts, R.legW, sh(P.leg), sh(P.legS), P.line);
  if (C.legs === 'stripes') {   // meia-calça listrada (toque gótico-fofo)
    g.save(); g.lineCap = 'butt'; g.setLineDash([0.45, 0.55]); g.lineDashOffset = 0;
    poly(g, pts); g.lineWidth = R.legW * 0.92; g.strokeStyle = sh(P.stripe); g.globalAlpha = 0.85; g.stroke(); g.restore();
  }
  if (C.legs === 'stripes') {   // shortinho por cima da coxa
    const mx = lerp(Lg.hx, Lg.kx, 0.45), my = lerp(hipY, Lg.ky, 0.45);
    noodle(g, [Lg.hx, hipY - 0.2, mx, my], R.legW + 0.9, sh(P.short), sh(P.shortS), P.line);
  }
  // joelheira: concha arredondada na frente do joelho
  const ang = Math.atan2(Lg.ey - Lg.ky, Lg.ex - Lg.kx);
  g.save(); g.translate(Lg.kx, Lg.ky); g.rotate(ang);
  fillShape(g, () => ell(g, 0.1, -R.legW * 0.16, R.legW * 0.68, R.legW * 0.6), sh(P.pad), sh(P.padS), P.line, 0.32);
  g.fillStyle = sh(P.padA); ell(g, 0.15, -R.legW * 0.42, R.legW * 0.36, R.legW * 0.17); g.fill();
  g.restore();
  g.save(); g.translate(Lg.fx, Lg.fy); g.rotate(Lg.fr); drawSkate(g, env, far, p.wheel + (far ? 1 : 0)); g.restore();
}

// ----- braços: manga, cotoveleira, munhequeira e mão (com gestos)
function drawArm(g, env, A, far) {
  const { C, R, P } = env, sh = c => far ? mixHex(c, P.line, 0.22) : c;
  const pts = [A.ax, A.ay, A.kx, A.ky, A.ex, A.ey];
  if (C.top === 'jacket') noodle(g, pts, R.armW, sh(P.top), sh(P.topS), P.line);
  else {
    noodle(g, pts, R.armW * 0.82, sh(P.skin), sh(P.skinS), P.line);
    const mx = lerp(A.ax, A.kx, 0.6), my = lerp(A.ay, A.ky, 0.6);
    noodle(g, [A.ax, A.ay, mx, my], R.armW + 0.75, sh(P.top), sh(P.topS), P.line);
  }
  // cotoveleira
  const ua = Math.atan2(A.ky - A.ay, A.kx - A.ax);
  g.save(); g.translate(A.kx, A.ky); g.rotate(ua);
  fillShape(g, () => ell(g, 0, 0, R.armW * 0.62, R.armW * 0.66), sh(P.pad), sh(P.padS), P.line, 0.28);
  g.fillStyle = sh(P.padA); ell(g, 0, -R.armW * 0.18, R.armW * 0.18, R.armW * 0.34); g.fill();
  g.restore();
  // munhequeira (protetor de punho)
  const fa = Math.atan2(A.ey - A.ky, A.ex - A.kx), wx = lerp(A.kx, A.ex, 0.72), wy = lerp(A.ky, A.ey, 0.72);
  g.save(); g.translate(wx, wy); g.rotate(fa);
  fillShape(g, () => rr(g, -0.75, -R.armW * 0.55, 1.5, R.armW * 1.1, 0.4), sh(P.pad), sh(P.padS), P.line, 0.25);
  g.fillStyle = sh(P.padA); g.fillRect(-0.15, -R.armW * 0.5, 0.3, R.armW * 1.0);
  g.restore();
  drawHand(g, env, A.ex, A.ey, fa, A.hand, far);
}
function drawHand(g, env, x, y, ang, kind, far) {
  const { R, P } = env, sh = c => far ? mixHex(c, P.line, 0.22) : c, hr = R.armW * 0.6;
  g.save(); g.translate(x, y); g.rotate(ang);
  const finger = (fx, fy, len, rot) => { g.save(); g.translate(fx, fy); g.rotate(rot); fillShape(g, () => rr(g, -0.27, -len, 0.54, len + 0.2, 0.27), sh(P.skin), sh(P.skinS), P.line, 0.15); g.restore(); };
  if (kind === 'horns') {   // chifrinho do rock: indicador e mindinho apontando para a frente da mão
    g.save(); g.rotate(Math.PI / 2);
    finger(-0.42, -hr * 0.5, 1.7, -0.18); finger(0.45, -hr * 0.5, 1.45, 0.2); g.restore();
  } else if (kind === 'point2') {   // o "V" apontando do Merlin
    finger(hr * 0.6, -0.3, 2.0, Math.PI / 2 - 0.12); finger(hr * 0.6, 0.35, 1.9, Math.PI / 2 + 0.1);
  }
  fillShape(g, () => ell(g, hr * 0.25, 0, hr * 1.05, hr), sh(P.skin), sh(P.skinS), P.line, 0.3);
  if (kind === 'open') { g.save(); g.translate(hr * 0.2, -hr * 0.85); g.rotate(-0.5); fillShape(g, () => rr(g, -0.25, -0.9, 0.5, 1.1, 0.25), sh(P.skin), sh(P.skinS), P.line, 0.12); g.restore(); }
  g.restore();
}

// ----- tronco (jaqueta / camiseta de banda / camiseta lisa), com detalhes de rock discretos
function drawTorso(g, env) {
  const { C, R, P, hipY, shY } = env, tw = R.shW, bw = R.waist;
  const body = () => {
    g.beginPath(); g.moveTo(-tw * 0.5, shY + 1.0);
    g.quadraticCurveTo(-bw * 0.62, (shY + hipY) / 2 + 0.5, -bw * 0.5, hipY + 0.9);
    g.quadraticCurveTo(0, hipY + 1.5, bw * 0.5, hipY + 0.9);
    g.quadraticCurveTo(bw * 0.62, (shY + hipY) / 2 + 0.5, tw * 0.5, shY + 1.0);
    g.quadraticCurveTo(0, shY - 1.1, -tw * 0.5, shY + 1.0); g.closePath();
  };
  // quadril / cós (aparece embaixo da camisa)
  fillShape(g, () => rr(g, -bw * 0.5, hipY - 0.6, bw, 1.9, 0.8), C.legs === 'stripes' ? P.short : P.leg, C.legs === 'stripes' ? P.shortS : P.legS, P.line, 0.4);
  fillShape(g, body, P.top, P.topS, P.line, 1.0);
  g.save(); body(); g.clip();
  if (C.top === 'jacket') {
    // camiseta branca aparecendo na abertura da jaqueta, com uma palheta laranja estampada
    fillShape(g, () => { g.beginPath(); g.moveTo(tw * 0.08, shY - 1); g.lineTo(tw * 0.44, shY - 1); g.lineTo(bw * 0.4, hipY + 2); g.lineTo(bw * 0.02, hipY + 2); g.closePath(); }, P.tee, P.teeS, null, 0.5);
    const px = tw * 0.27, py = shY + R.torso * 0.48;
    g.fillStyle = P.print; g.beginPath(); g.moveTo(px - 0.85, py - 0.7); g.quadraticCurveTo(px, py - 1.2, px + 0.85, py - 0.7); g.quadraticCurveTo(px + 0.75, py + 0.4, px, py + 1.1); g.quadraticCurveTo(px - 0.75, py + 0.4, px - 0.85, py - 0.7); g.fill();
    // barra canelada e gola
    g.fillStyle = P.topS; g.fillRect(-bw, hipY - 0.2, bw * 2, 1.4);
    g.fillStyle = P.line; g.globalAlpha = 0.25; for (let x = -bw * 0.5; x < bw * 0.5; x += 0.55) g.fillRect(x, hipY - 0.2, 0.18, 1.3); g.globalAlpha = 1;
    // bottons na jaqueta (raio e estrela)
    g.fillStyle = P.sticker; ell(g, -tw * 0.12, shY + R.torso * 0.34, 0.62, 0.62); g.fill();
    g.fillStyle = P.sticker2; bolt(g, -tw * 0.12, shY + R.torso * 0.34, 0.55);
  } else if (C.top === 'bandtee') {
    // camiseta de banda: raio com estrelinhas
    g.fillStyle = P.print; bolt(g, tw * 0.12, shY + R.torso * 0.5, 1.6);
    g.fillStyle = P.tips; star(g, tw * 0.36, shY + R.torso * 0.25, 0.45); star(g, -tw * 0.12, shY + R.torso * 0.72, 0.35);
  } else {
    // camiseta preta lisa com a rodinha branca no peito (logo genérico)
    const lx = tw * 0.2, ly = shY + R.torso * 0.32;
    g.strokeStyle = P.print; g.lineWidth = 0.32; ell(g, lx, ly, 1.1, 1.1); g.stroke(); g.fillStyle = P.print; ell(g, lx, ly, 0.38, 0.38); g.fill();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; g.beginPath(); g.moveTo(lx + Math.cos(a) * 0.4, ly + Math.sin(a) * 0.4); g.lineTo(lx + Math.cos(a) * 1.05, ly + Math.sin(a) * 1.05); g.stroke(); }
  }
  g.restore();
  // gola
  g.strokeStyle = C.top === 'jacket' ? P.topS : P.line; g.lineWidth = 0.55; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-tw * 0.18, shY + 0.1); g.quadraticCurveTo(tw * 0.05, shY + 1.3, tw * 0.3, shY + 0.05); g.stroke();
  // flanela xadrez amarrada na cintura (Lua)
  if (C.top === 'bandtee') {
    const y = hipY - 0.2;
    fillShape(g, () => rr(g, -bw * 0.56, y - 0.5, bw * 1.12, 1.5, 0.7), P.flan, P.flanS, P.line, 0.4);
    // mangas amarradas caindo na frente
    fillShape(g, () => { g.beginPath(); g.moveTo(bw * 0.15, y); g.quadraticCurveTo(bw * 0.55, y + 2.4, bw * 0.3, y + 4.0); g.lineTo(bw * 0.02, y + 3.6); g.quadraticCurveTo(bw * 0.2, y + 2.2, -bw * 0.05, y + 0.6); g.closePath(); }, P.flan, P.flanS, P.line, 0.35);
    fillShape(g, () => ell(g, bw * 0.12, y + 0.3, 0.9, 0.75), P.flan, P.flanS, P.line, 0.3);
    g.strokeStyle = P.flanL; g.globalAlpha = 0.6; g.lineWidth = 0.18;
    for (let x = -bw * 0.5; x < bw * 0.5; x += 0.9) { g.beginPath(); g.moveTo(x, y - 0.45); g.lineTo(x, y + 0.95); g.stroke(); }
    g.beginPath(); g.moveTo(-bw * 0.55, y + 0.25); g.lineTo(bw * 0.55, y + 0.25); g.stroke(); g.globalAlpha = 1;
  }
}
function bolt(g, x, y, s) {
  g.beginPath(); g.moveTo(x + 0.15 * s, y - 0.75 * s); g.lineTo(x - 0.45 * s, y + 0.1 * s); g.lineTo(x - 0.02 * s, y + 0.1 * s); g.lineTo(x - 0.2 * s, y + 0.78 * s);
  g.lineTo(x + 0.45 * s, y - 0.12 * s); g.lineTo(x + 0.04 * s, y - 0.12 * s); g.closePath(); g.fill();
}
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr_ = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr_, y + Math.sin(a) * rr_); } g.closePath(); g.fill(); }

// ----- violão pequeno nas costas (Gabriel)
function drawGuitarBack(g, env) {
  const { P, R, shY, hipY } = env;
  g.save(); g.translate(-R.shW * 0.42, shY + R.torso * 0.6); g.rotate(-0.6);
  noodle(g, [0, -1, 0, -6.4], 0.9, P.neckC, mixHex(P.neckC, P.line, 0.4), P.line);
  fillShape(g, () => rr(g, -0.75, -7.6, 1.5, 1.6, 0.4), P.neckC, mixHex(P.neckC, P.line, 0.4), P.line, 0.2);
  fillShape(g, () => { g.beginPath(); g.ellipse(0, 0.4, 2.3, 2.0, 0, 0, TAU); g.moveTo(1.9, -1.6); g.ellipse(0, -1.6, 1.75, 1.55, 0, 0, TAU); }, P.guitar, P.guitarS, P.line, 0.5);
  g.fillStyle = P.line; ell(g, 0, -0.9, 0.55, 0.55); g.fill();
  g.restore();
  // alça atravessando o peito
  g.strokeStyle = P.line; g.lineWidth = 0.55; g.beginPath(); g.moveTo(-R.shW * 0.32, shY + 0.6); g.quadraticCurveTo(0, (shY + hipY) / 2, R.waist * 0.4, hipY - 0.3); g.stroke();
}

// ----- cabelo atrás da cabeça (marias-chiquinhas / cachos compridos)
function drawHairBack(g, env) {
  const { C, R, P, p, t, headX, headY } = env, r = R.R;
  if (C.hair === 'pigtails') {
    // a maria-chiquinha de trás (a da frente vem depois da cabeça)
    pigtail(g, env, headX - r * 0.95, headY + r * 0.25, 1.25 + p.sway * 0.55 + Math.sin(t * 3.1) * 0.06, 0.92);
  } else if (C.hair === 'curls') {
    const dx = p.sway * 1.6, blobs = [[-2.0, -1.0, 2.0], [-3.8, 0.6, 2.2], [-4.6, 3.0, 2.2], [-4.4, 5.6, 2.1], [-3.4, 8.0, 1.9], [-5.4, 7.0, 1.6], [-2.0, 9.6, 1.5], [-4.2, 9.8, 1.35], [-1.0, 3.2, 1.8]];
    const pos = (bx, by) => [headX + bx + dx * Math.max(0, by + 2) / 10, headY + by + Math.sin(t * 2.4 + by) * 0.12];
    if (ST.line) { g.fillStyle = P.line; for (const [bx, by, rr_] of blobs) { const [x, y] = pos(bx, by); ell(g, x, y, rr_ + ST.OL, rr_ + ST.OL); g.fill(); } }
    for (const [bx, by, rr_] of blobs) { const [x, y] = pos(bx, by); g.fillStyle = P.hairS; ell(g, x, y, rr_, rr_); g.fill(); }
    for (const [bx, by, rr_] of blobs) { const [x, y] = pos(bx, by); g.fillStyle = P.hair; ell(g, x - rr_ * 0.18, y - rr_ * 0.22, rr_ * 0.78, rr_ * 0.74); g.fill(); }
    g.strokeStyle = P.hairL; g.lineWidth = 0.35; g.lineCap = 'round';
    for (const [bx, by, rr_] of blobs) { const [x, y] = pos(bx, by); g.beginPath(); g.arc(x - rr_ * 0.2, y - rr_ * 0.2, rr_ * 0.42, Math.PI * 0.95, Math.PI * 1.7); g.stroke(); }
  }
}
function pigtail(g, env, x, y, ang, k) {
  const { P } = env;
  g.save(); g.translate(x, y); g.rotate(ang);
  const len = 6.2 * k, w = 1.9 * k;
  const shape = () => { g.beginPath(); g.moveTo(0, -w * 0.6); g.quadraticCurveTo(len * 0.55, -w * 1.25, len, -0.1); g.quadraticCurveTo(len * 0.9, w * 0.5, len * 0.55, w * 0.9); g.quadraticCurveTo(len * 0.2, w * 0.9, 0, w * 0.6); g.closePath(); };
  fillShape(g, shape, P.hair, P.hairS, P.line, 0.6);
  g.save(); shape(); g.clip(); g.fillStyle = P.tipsS; g.fillRect(len * 0.6, -w * 2, len, w * 4); g.fillStyle = P.tips; g.fillRect(len * 0.62, -w * 2, len, w * 1.6); g.restore();
  fillShape(g, () => ell(g, 0.2, 0, 0.75 * k, 0.95 * k), P.tie, mixHex(P.tie, P.line, 0.3), P.line, 0.2);
  g.restore();
}

// ----- cabeça: rosto, cabelo da frente, capacete e jugular
function drawHead(g, env) {
  const { C, R, P, p, t, headX: hx, headY: hy } = env, r = R.R;
  // pescoço
  fillShape(g, () => rr(g, hx - 1.3, hy + r * 0.55, 2.4, R.neck + 1.6, 0.8), P.skinS, null, P.line);
  // orelha atrás
  // rosto
  fillShape(g, () => ell(g, hx, hy, r, r * 1.0), P.skin, P.skinS, P.line, 0.9);
  fillShape(g, () => ell(g, hx - r * 0.42, hy + r * 0.12, r * 0.24, r * 0.32), P.skin, P.skinS, P.line, 0.2);
  // barba (Gabriel: barba curta com bigode; Merlin: barba cheia curta)
  if (C.beard) {
    g.save(); ell(g, hx, hy, r, r); g.clip();
    fillShape(g, () => { g.beginPath(); g.moveTo(hx - r * 0.3, hy + r * 0.2); g.quadraticCurveTo(hx - r * 0.05, hy + r * 0.72, hx + r * 0.5, hy + r * 0.62);
      g.quadraticCurveTo(hx + r * 0.95, hy + r * 0.52, hx + r * 1.2, hy + r * 0.42); g.lineTo(hx + r * 1.2, hy + r * 1.3); g.lineTo(hx - r * 1.2, hy + r * 1.3); g.lineTo(hx - r * 1.2, hy + r * 0.2); g.closePath(); },
    P.beard, P.beardS, null, 0.5);
    g.restore();
    fillShape(g, () => ell(g, hx + r * 0.58, hy + r * 0.4, r * 0.32, r * 0.13, -0.1), P.beard, P.beardS, null, 0.2);   // bigode
  }
  // olhos de feijão com brilho, sobrancelhas, bochechas
  const ey = hy + r * 0.02, eyes = [[hx + r * 0.12, 1], [hx + r * 0.64, 0.86]];
  g.fillStyle = P.blush; g.globalAlpha = 0.5; ell(g, hx + r * 0.02, hy + r * 0.42, r * 0.22, r * 0.13); g.fill(); ell(g, hx + r * 0.78, hy + r * 0.4, r * 0.15, r * 0.11); g.fill(); g.globalAlpha = 1;
  for (const [ex, s] of eyes) {
    const w = r * 0.13 * s, h = r * 0.2 * s;
    g.strokeStyle = P.eye; g.lineCap = 'round'; g.lineWidth = r * 0.075;
    if (p.blink || p.eyes === 'happy') { g.beginPath(); g.moveTo(ex - w * 1.3, ey + h * 0.25); g.quadraticCurveTo(ex, ey - h * 0.9, ex + w * 1.3, ey + h * 0.25); g.stroke(); }
    else {
      const hh = p.eyes === 'focus' ? h * 0.7 : h;
      g.fillStyle = P.eye; ell(g, ex, ey, w, hh); g.fill();
      g.fillStyle = '#fff'; ell(g, ex + w * 0.35, ey - hh * 0.4, w * 0.42, w * 0.42); g.fill();
    }
    g.lineWidth = r * 0.07; g.strokeStyle = C.hair === 'curls' ? P.hairS : P.line;
    const by = ey - r * (p.eyes === 'focus' ? 0.3 : 0.38);
    g.beginPath(); g.moveTo(ex - w * 1.3, by + (p.eyes === 'focus' ? -r * 0.04 : r * 0.03)); g.quadraticCurveTo(ex, by - r * 0.08, ex + w * 1.4, by + (p.eyes === 'focus' ? r * 0.06 : 0)); g.stroke();
  }
  // nariz
  fillShape(g, () => ell(g, hx + r * 0.96, hy + r * 0.2, r * 0.17, r * 0.15), P.skin, P.skinS, P.line, 0.12);
  // boca
  const mx = hx + r * 0.5, my = hy + r * 0.56;
  g.lineCap = 'round';
  if (p.mouth === 'smile') { g.strokeStyle = P.line; g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(mx - r * 0.24, my - r * 0.04); g.quadraticCurveTo(mx, my + r * 0.18, mx + r * 0.24, my - r * 0.06); g.stroke(); }
  else {
    const open = p.mouth === 'o' ? 0.6 : 1;
    g.beginPath();
    if (p.mouth === 'o') ell(g, mx + r * 0.02, my + r * 0.04, r * 0.12, r * 0.14);
    else { g.moveTo(mx - r * 0.3, my - r * 0.07); g.quadraticCurveTo(mx, my - r * 0.02, mx + r * 0.3, my - r * 0.09); g.quadraticCurveTo(mx + r * 0.05, my + r * 0.42 * open, mx - r * 0.3, my - r * 0.07); g.closePath(); }
    g.fillStyle = '#5a1420'; g.fill();
    if (p.mouth !== 'o') { g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(mx - r * 0.35, my - r * 0.14, r * 0.7, r * 0.11); g.fillStyle = '#ff7f90'; ell(g, mx, my + r * 0.25, r * 0.15, r * 0.08); g.fill(); g.restore(); }
  }
  // brinco de palheta (Lua)
  if (C.id === 'lua') { g.fillStyle = P.earring; const ex = hx - r * 0.38, ey2 = hy + r * 0.55 + Math.sin(t * 4) * 0.05; g.beginPath(); g.moveTo(ex - 0.32, ey2); g.quadraticCurveTo(ex, ey2 - 0.18, ex + 0.32, ey2); g.quadraticCurveTo(ex + 0.25, ey2 + 0.4, ex, ey2 + 0.62); g.quadraticCurveTo(ex - 0.25, ey2 + 0.4, ex - 0.32, ey2); g.fill(); }
  // cabelo da frente
  if (C.hair === 'pigtails') {
    fillShape(g, () => { g.beginPath(); g.moveTo(hx - r * 1.02, hy - r * 0.1); g.quadraticCurveTo(hx - r * 0.7, hy + r * 0.45, hx - r * 0.55, hy - r * 0.15);
      g.quadraticCurveTo(hx - r * 0.2, hy + r * 0.05, hx + r * 0.05, hy - r * 0.32); g.quadraticCurveTo(hx + r * 0.4, hy - r * 0.08, hx + r * 0.62, hy - r * 0.42);
      g.quadraticCurveTo(hx + r * 0.85, hy - r * 0.25, hx + r * 1.0, hy - r * 0.45); g.lineTo(hx + r * 0.9, hy - r * 0.9); g.lineTo(hx - r * 1.0, hy - r * 0.9); g.closePath(); }, P.hair, P.hairS, P.line, 0.4);
    g.fillStyle = P.tips; ell(g, hx + r * 0.62, hy - r * 0.47, r * 0.14, r * 0.08, 0.4); g.fill();
  } else if (C.hair === 'mohawk') {
    fillShape(g, () => { g.beginPath(); g.moveTo(hx - r * 0.5, hy - r * 0.5); g.lineTo(hx - r * 0.2, hy - r * 0.5); g.lineTo(hx - r * 0.26, hy + r * 0.3); g.quadraticCurveTo(hx - r * 0.45, hy + r * 0.35, hx - r * 0.55, hy + r * 0.1); g.closePath(); }, P.hair, P.hairS, null, 0.2);   // costeleta
  } else if (C.hair === 'curls') {
    const curls = [[-0.85, 0.1, 0.36], [-0.95, 0.55, 0.32], [-0.75, 0.95, 0.27]];
    for (const [bx, by, cr] of curls) fillShape(g, () => ell(g, hx + bx * r, hy + by * r, cr * r, cr * r), P.hair, P.hairS, P.line, 0.25);
  }
  // bandana do Merlin aparecendo embaixo do capacete, com as pontas balançando atrás
  if (C.bandana) {
    const sw = Math.sin(t * 5) * 0.35 + env.p.sway * 1.2;
    fillShape(g, () => { g.beginPath(); g.moveTo(hx - r * 1.05, hy - r * 0.18); g.quadraticCurveTo(hx, hy - r * 0.62, hx + r * 1.02, hy - r * 0.45); g.lineTo(hx + r * 1.0, hy - r * 0.2); g.quadraticCurveTo(hx, hy - r * 0.35, hx - r * 1.05, hy + r * 0.12); g.closePath(); }, P.band, P.bandS, P.line, 0.3);
    g.fillStyle = P.bandDot; for (let i = 0; i < 7; i++) { const x = hx - r * 0.8 + i * r * 0.28; ell(g, x, hy - r * (0.32 + Math.sin(i / 6 * Math.PI) * 0.15), 0.22, 0.15, 0.5); g.fill(); }
    const kx = hx - r * 1.02, ky = hy - r * 0.05;
    fillShape(g, () => { g.beginPath(); g.moveTo(kx, ky - 0.3); g.quadraticCurveTo(kx - 2.2, ky + 0.2 + sw, kx - 3.0, ky + 1.9 + sw); g.lineTo(kx - 2.0, ky + 2.1 + sw); g.quadraticCurveTo(kx - 1.3, ky + 1.1, kx, ky + 0.6); g.closePath(); }, P.band, P.bandS, P.line, 0.3);
    fillShape(g, () => ell(g, kx + 0.1, ky + 0.2, 0.7, 0.6), P.band, P.bandS, P.line, 0.2);
  }
  drawHelmet(g, env);
}
function drawHelmet(g, env) {
  const { C, R, P, t, headX: hx, headY: hy } = env, r = R.R;
  const lift = C.bandana ? r * 0.12 : 0, y = hy - lift;
  const shell = () => {
    g.beginPath(); g.moveTo(hx - r * 1.14, y + r * 0.12);
    g.bezierCurveTo(hx - r * 1.32, y - r * 1.55, hx + r * 0.95, y - r * 1.78, hx + r * 1.12, y - r * 0.48);
    g.quadraticCurveTo(hx + r * 1.36, y - r * 0.42, hx + r * 1.38, y - r * 0.3);   // aba curtinha
    g.quadraticCurveTo(hx + r * 1.1, y - r * 0.22, hx + r * 0.95, y - r * 0.24);
    g.quadraticCurveTo(hx - r * 0.1, y - r * 0.32, hx - r * 1.14, y + r * 0.12); g.closePath();
  };
  // crista de moicano de borracha (Gabriel): o moicano dele virou parte do capacete
  if (C.hair === 'mohawk') {
    const cx = hx - r * 0.05, cy = y - r * 0.35, wig = Math.sin(t * 9) * 0.04 + env.p.sway * 0.08;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.92 + i * Math.PI * 0.16 + wig * (1 - i / 5), b0 = r * 1.0, len = r * (0.55 + Math.sin(i / 4 * Math.PI) * 0.35), da = 0.17;
      fillShape(g, () => { g.beginPath(); g.moveTo(cx + Math.cos(a - da) * b0, cy + Math.sin(a - da) * b0);
        g.quadraticCurveTo(cx + Math.cos(a - 0.02) * (b0 + len * 0.7), cy + Math.sin(a - 0.02) * (b0 + len * 0.7), cx + Math.cos(a + 0.06) * (b0 + len), cy + Math.sin(a + 0.06) * (b0 + len));
        g.quadraticCurveTo(cx + Math.cos(a + 0.05) * (b0 + len * 0.45), cy + Math.sin(a + 0.05) * (b0 + len * 0.45), cx + Math.cos(a + da) * b0, cy + Math.sin(a + da) * b0); g.closePath(); },
      P.crest, P.crestS, P.line, 0.3);
    }
  }
  fillShape(g, shell, P.helm, P.helmS, P.line, 0.9);
  g.save(); shell(); g.clip();
  // faixa central e respiros
  g.fillStyle = P.helmS; g.globalAlpha = 0.55;
  for (const [vx, vy, rot] of [[-0.55, -0.95, -0.5], [0.05, -1.08, 0.05], [0.6, -0.88, 0.55]]) { g.save(); g.translate(hx + vx * r, y + vy * r); g.rotate(rot); rr(g, -r * 0.09, -r * 0.2, r * 0.18, r * 0.4, r * 0.09); g.fill(); g.restore(); }
  g.globalAlpha = 1;
  // brilho
  g.fillStyle = 'rgba(255,255,255,0.45)'; ell(g, hx + r * 0.35, y - r * 1.05, r * 0.35, r * 0.12, 0.35); g.fill();
  // adesivo (raio / estrela / palheta)
  const sx = hx - r * 0.5, sy = y - r * 0.38;
  if (C.id === 'gabriel') { g.fillStyle = P.sticker; ell(g, sx, sy, r * 0.26, r * 0.26); g.fill(); g.fillStyle = P.sticker2; bolt(g, sx, sy, r * 0.32); }
  else if (C.id === 'lua') { g.fillStyle = P.sticker; bolt(g, sx + r * 0.1, sy - r * 0.05, r * 0.5); g.fillStyle = P.sticker2; star(g, hx + r * 0.55, y - r * 0.55, r * 0.15); star(g, hx - r * 0.1, y - r * 1.05, r * 0.1); }
  else { g.fillStyle = P.sticker; rr(g, hx - r * 1.3, y - r * 0.62, r * 2.6, r * 0.2, 0.1); g.fill(); g.fillStyle = P.sticker2; star(g, sx, sy - r * 0.18, r * 0.15); }
  g.restore();
  // jugular (tira) até o queixo
  g.strokeStyle = P.line; g.lineWidth = r * 0.075; g.lineCap = 'round';
  g.beginPath(); g.moveTo(hx - r * 0.28, y - r * 0.12); g.quadraticCurveTo(hx - r * 0.25, hy + r * 0.62, hx + r * 0.15, hy + r * 0.98); g.stroke();
  g.fillStyle = P.line; rr(g, hx - r * 0.31, hy + r * 0.42, r * 0.14, r * 0.2, 0.08); g.fill();
  // maria-chiquinha da frente por cima de tudo
  if (C.hair === 'pigtails') pigtail(g, env, hx - r * 0.78, hy + r * 0.32, 1.9 + env.p.sway * 0.5 + Math.sin(t * 3.1 + 0.6) * 0.07, 0.86);
}

// ----- cenografia das poses: corrimão e faíscas
function drawRail(g, env) {
  const P = env.P;
  g.fillStyle = '#c9c4d6'; g.fillRect(-16, -0.75, 32, 0.95);
  g.fillStyle = '#8d87a0'; g.fillRect(-16, -0.05, 32, 0.3);
  g.fillStyle = '#6d6780'; for (const x of [-12, 12]) g.fillRect(x - 0.4, 0.2, 0.8, 2.2 + 0);
}
function drawSparks(g, env) {
  const { p, t, legs, R } = env;
  const base = p.sparks === 'front' ? [legs.front.fx - 1.8 * R.sk, -0.2] : [legs.front.fx + 1.5 * R.sk, -0.8];
  g.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const seed = Math.floor(t * 20) * 7 + i, rnd = n => { const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
    const a = Math.PI * (1.05 + rnd(1) * 0.35), len = 1 + rnd(2) * 2.6;
    const x0 = base[0] + rnd(3) * 1.5, y0 = base[1];
    g.strokeStyle = rnd(4) > 0.5 ? '#ffd23f' : '#ff9a3c'; g.lineWidth = 0.28;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(a) * len, y0 + Math.sin(a) * len); g.stroke();
  }
}
