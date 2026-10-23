'use strict';
// =================================================================== elenco v2 (rascunho 2): rig vetorial
// Rascunho 2: visual punk dos patinadores de referência (capacete com chamas, óculos de proteção, jaqueta/colete de brim
// com spikes e patches, camiseta de banda, cinto com pochetes e corrente, calça cargo, luva sem dedo com tachas e patins
// com rodas que brilham), nas proporções do rascunho 1. Contorno escuro, cores chapadas com uma sombra dura por peça.
// Mesmo esquema do jogo: origem no chão debaixo do personagem, olhando para +x, unidades do mundo do jogo (16 = um bloco).
// Desenha com drawChar(g, C, poseName, t, opts).
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const BPM = 128, BEAT = 60 / BPM;

// ----- elenco: proporções (rig, iguais às do rascunho 1) e visual
// top: 'jacket' (jaqueta de manga até o cotovelo) | 'vest' (colete sem manga); goggles: 'eyes' (no rosto) | 'up' (no capacete)
const CAST = {
  gabriel: {
    id: 'gabriel', name: 'Gabriel Rock', hair: 'spiky', beard: false, top: 'jacket', spikes: true, torn: false, print: 'guitar',
    goggles: 'eyes', pants: 'cargo', chain: true, necklace: null, backpack: false, mouth: 'grin', sign: 'horns',
    rig: { skH: 3.5, thigh: 3.3, shin: 3.1, torso: 6.0, shW: 7.2, waist: 6.2, R: 3.75, arm1: 2.8, arm2: 2.7, legW: 2.55, armW: 2.0, neck: 0.35, sk: 0.95 },
    pal: {
      line: '#121018', skin: '#f2c29c', skinS: '#d6936c', blush: '#ff8a7a', eyeW: '#ffffff', iris: '#3b6fd4', pupil: '#121018',
      hair: '#1a1820', hairS: '#0c0b10', hairL: '#3a3746',
      helm: '#1f1d25', helmS: '#121117', flame: '#d62b2b', flameS: '#9c1b1f', flameL: '#ff7a3a',
      gogF: '#2c2a33', gogS: '#16151b', lens: 'rgba(120,150,210,0.38)', lensL: 'rgba(255,255,255,0.55)', strap: '#1b1a20',
      top: '#2b313f', topS: '#1b1f29', stitch: '#66718a', tee: '#3b3542', teeS: '#28232e', print: '#cdbb8a', printS: '#8a7a55',
      patchA: '#c8323a', patchB: '#e2b13c', patchC: '#5f8f4a', stud: '#c9ccd4', studS: '#7d808a',
      leg: '#4f5338', legS: '#383b27', pocket: '#5c6142',
      belt: '#1c1a1f', buckle: '#c9ccd4', pouch: '#26242b', chainC: '#b9bcc6',
      pad: '#1d1b21', padS: '#0f0e13', padA: '#3e3b47', glove: '#1d1b21', gloveS: '#0f0e13',
      boot: '#1d1b21', bootS: '#0f0e13', bootA: '#b9bcc6', lace: '#8b8e98', frame: '#8d909a', frameS: '#5c5f69',
      wheel: '#e8333a', wheelS: '#a81c22', hub: '#2a2830', glow: '#ff3b3b',
    },
  },
  lua: {
    id: 'lua', name: 'Lua Riff', hair: 'pigtails', beard: false, top: 'vest', spikes: false, torn: false, print: 'guitar',
    goggles: 'eyes', pants: 'ripped', chain: true, necklace: 'bolt', backpack: true, mouth: 'smirk', sign: 'horns',
    rig: { skH: 3.4, thigh: 3.3, shin: 3.1, torso: 5.7, shW: 6.4, waist: 5.6, R: 3.75, arm1: 2.75, arm2: 2.65, legW: 2.35, armW: 1.8, neck: 0.35, sk: 0.92 },
    pal: {
      line: '#120f18', skin: '#c68a5f', skinS: '#a1683f', blush: '#ff6f8e', eyeW: '#ffffff', iris: '#6a3d1e', pupil: '#120f18',
      hair: '#1f2a57', hairS: '#121a3a', hairL: '#3b4c8f', tips: '#38d6ff', tipsS: '#1a9ec4', tie: '#2c2a33',
      helm: '#1f1d25', helmS: '#121117', flame: '#ff8a1a', flameS: '#d0560a', flameL: '#ffd23f',
      gogF: '#d8dbe2', gogS: '#9a9daa', lens: 'rgba(160,220,255,0.32)', lensL: 'rgba(255,255,255,0.7)', strap: '#1b1a20',
      top: '#25232b', topS: '#16151b', stitch: '#55525f', tee: '#c4313d', teeS: '#922330', print: '#f2e6d0', printS: '#b8a88e',
      patchA: '#38d6ff', patchB: '#ffd23f', patchC: '#c4313d', stud: '#c9ccd4', studS: '#7d808a',
      leg: '#26242c', legS: '#18171d', rip: '#c68a5f',
      belt: '#3a2e26', buckle: '#c9ccd4', pouch: '#4a5236', chainC: '#b9bcc6',
      bag: '#4a5236', bagS: '#343a25', camoA: '#2f3523', camoB: '#6b7350',
      pad: '#1d1b21', padS: '#0f0e13', padA: '#3e3b47', glove: '#1d1b21', gloveS: '#0f0e13',
      boot: '#1d1b21', bootS: '#0f0e13', bootA: '#38d6ff', lace: '#38d6ff', frame: '#2e2d35', frameS: '#1b1a20',
      wheel: '#17222e', wheelS: '#0d141c', hub: '#38d6ff', glow: '#38d6ff', pendant: '#c9ccd4',
    },
  },
  merlin: {
    id: 'merlin', name: 'Merlin', hair: 'curls', beard: true, bandana: true, top: 'vest', spikes: false, torn: true, print: 'skull',
    goggles: 'up', pants: 'cargo', thighStrap: true, chain: false, carabiner: true, necklace: 'pick', backpack: false, mouth: 'smile', sign: 'point2',
    rig: { skH: 4.4, thigh: 6.1, shin: 5.9, torso: 10.2, shW: 9.0, waist: 7.4, R: 3.95, arm1: 4.9, arm2: 4.7, legW: 2.7, armW: 1.85, neck: 1.2, sk: 1.12 },
    pal: {
      line: '#121018', skin: '#e6aa80', skinS: '#c4835c', blush: '#f08a78', eyeW: '#ffffff', iris: '#5a3a1e', pupil: '#121018',
      hair: '#b48a55', hairS: '#7d5a33', hairL: '#e0bf8a', beard: '#7a5636', beardS: '#5a3d24',
      band: '#2a45a8', bandS: '#1b2c74', bandDot: '#e8eefc',
      helm: '#1f1d25', helmS: '#121117', flame: '#2f6fe0', flameS: '#1d48a0', flameL: '#7fc4ff',
      gogF: '#2c2a33', gogS: '#16151b', lens: 'rgba(255,170,60,0.55)', lensL: 'rgba(255,255,255,0.6)', strap: '#1b1a20',
      top: '#5f86b8', topS: '#3f6390', stitch: '#c7d6ea', tee: '#1e1c22', teeS: '#121116', print: '#a3a3ae', printS: '#5d5d68',
      patchA: '#c8323a', patchB: '#e2b13c', patchC: '#5f8f4a', stud: '#c9ccd4', studS: '#7d808a',
      leg: '#8a7a55', legS: '#665a3d', pocket: '#97875f',
      belt: '#1c1a1f', buckle: '#c9ccd4', pouch: '#26242b', chainC: '#b9bcc6',
      pad: '#1d1b21', padS: '#0f0e13', padA: '#3e3b47', glove: '#1d1b21', gloveS: '#0f0e13',
      boot: '#1d1b21', bootS: '#0f0e13', bootA: '#c8323a', lace: '#c8323a', frame: '#2e2d35', frameS: '#1b1a20',
      wheel: '#3ab0ff', wheelS: '#1f78c2', hub: '#d8f0ff', glow: '#3ab0ff', pendant: '#c9ccd4',
    },
  },
};

// ----- desenho básico: forma chapada com sombra dura e contorno opcional
const ST = { line: true, OL: 0.36 };
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
    armF: { a: Math.PI / 2 - 0.25 }, armB: { a: Math.PI / 2 + 0.25 }, handF: 'fist', handB: 'fist', nod: 0, mouth: C.mouth || 'smile', sway: 0, vy: 0, wheel: t * 3, eyes: 'open' };
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
  // ordem: cabelo de trás, mochila, braço de trás, perna de trás, (corrimão), tronco, perna da frente, cinto, cabeça, braço da frente
  upper(() => drawHairBack(g, env));
  if (C.backpack) upper(() => drawBackpack(g, env));
  upper(() => drawArm(g, env, arms.back, true));
  drawLeg(g, env, legs.back, true);
  if (p.rail) drawRail(g, env);
  upper(() => drawTorso(g, env));
  drawLeg(g, env, legs.front, false);
  upper(() => { drawBelt(g, env); drawHead(g, env); drawArm(g, env, arms.front, false); });
  if (p.sparks) drawSparks(g, env);
  g.restore();
}
function mixHex(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const m = (x, y) => Math.round(lerp(x, y, t));
  return '#' + ((1 << 24) | (m(a >> 16, b >> 16) << 16) | (m((a >> 8) & 255, (b >> 8) & 255) << 8) | m(a & 255, b & 255)).toString(16).slice(1);
}
const farC = (env, far) => c => far && c[0] === '#' ? mixHex(c, env.P.line, 0.25) : c;
const pxScale = g => { const m = g.getTransform(); return Math.hypot(m.a, m.b); };
function studs(g, P, pts, r) { for (const [x, y] of pts) { g.fillStyle = P.studS; ell(g, x, y, r, r); g.fill(); g.fillStyle = P.stud; ell(g, x - r * 0.25, y - r * 0.25, r * 0.65, r * 0.65); g.fill(); } }
function spike(g, P, x, y, ang, len, w) {   // spike de metal (cone visto de lado)
  g.save(); g.translate(x, y); g.rotate(ang);
  fillShape(g, () => { g.beginPath(); g.moveTo(-w, 0); g.lineTo(0, -len); g.lineTo(w, 0); g.closePath(); }, P.stud, P.studS, P.line, w * 0.5);
  g.restore();
}

// ----- patins inline: bota preta de cano alto com fivelas, trilho e rodas que brilham
function drawSkate(g, env, far, spin) {
  const P = env.P, s = env.R.sk, sh = farC(env, far);
  // rodas (com brilho)
  const glow = pxScale(g) * 0.9;
  for (const wx of [-1.95, -0.65, 0.65, 1.95]) {
    const x = wx * s, y = -0.62 * s, r = 0.62 * s;
    g.save(); g.shadowColor = P.glow; g.shadowBlur = far ? glow * 0.5 : glow;
    ell(g, x, y, r + ST.OL, r + ST.OL); g.fillStyle = P.line; g.fill(); g.restore();
    fillShape(g, () => ell(g, x, y, r, r), sh(P.wheel), sh(P.wheelS), null, 0.2 * s);
    g.fillStyle = sh(P.hub); ell(g, x, y, r * 0.42, r * 0.42); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.12 * s;
    for (let k = 0; k < 3; k++) { const a = spin + k * TAU / 3; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.15, y + Math.sin(a) * r * 0.15); g.lineTo(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42); g.stroke(); }
  }
  // trilho (frame) com os parafusos
  fillShape(g, () => { g.beginPath(); g.moveTo(-2.65 * s, -1.75 * s); g.lineTo(2.65 * s, -1.75 * s); g.lineTo(2.5 * s, -0.95 * s); g.quadraticCurveTo(1.3 * s, -1.3 * s, 0, -1.0 * s); g.quadraticCurveTo(-1.3 * s, -1.3 * s, -2.5 * s, -0.95 * s); g.closePath(); }, sh(P.frame), sh(P.frameS), P.line, 0.25 * s);
  for (const wx of [-1.95, -0.65, 0.65, 1.95]) { g.fillStyle = sh(P.frameS); ell(g, wx * s, -0.62 * s, 0.14 * s, 0.14 * s); g.fill(); }
  // bota
  const boot = () => {
    g.beginPath();
    g.moveTo(-2.4 * s, -1.65 * s); g.lineTo(2.3 * s, -1.65 * s);
    g.quadraticCurveTo(3.0 * s, -1.7 * s, 2.8 * s, -2.6 * s); g.quadraticCurveTo(2.45 * s, -3.2 * s, 0.95 * s, -3.25 * s);
    g.lineTo(0.95 * s, -4.3 * s); g.quadraticCurveTo(-0.6 * s, -4.6 * s, -2.15 * s, -4.3 * s);
    g.quadraticCurveTo(-2.7 * s, -2.9 * s, -2.4 * s, -1.65 * s); g.closePath();
  };
  fillShape(g, boot, sh(P.boot), sh(P.bootS), P.line, 0.5 * s);
  g.save(); boot(); g.clip();
  g.fillStyle = sh(P.bootA); g.fillRect(-3 * s, -2.05 * s, 6.5 * s, 0.32 * s);                // faixa de cor na sola
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(-3 * s, -1.75 * s, 6.5 * s, 0.12 * s);
  g.restore();
  // cadarço colorido e as duas fivelas de metal (tornozelo e cano)
  g.strokeStyle = sh(P.lace); g.lineWidth = 0.2 * s; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo((0.45 + i * 0.5) * s, (-3.05 + i * 0.14) * s); g.lineTo((0.95 + i * 0.5) * s, (-2.65 + i * 0.14) * s); g.stroke(); }
  for (const [y, w] of [[-3.25, 3.1], [-4.15, 2.9]]) {
    fillShape(g, () => rr(g, -2.25 * s, y * s, w * s, 0.48 * s, 0.2 * s), sh('#2c2a33'), sh('#16151b'), P.line, 0.12 * s);
    fillShape(g, () => rr(g, 0.2 * s, (y - 0.08) * s, 0.75 * s, 0.64 * s, 0.15 * s), sh(P.stud), sh(P.studS), P.line, 0.1 * s);
  }
  g.fillStyle = 'rgba(255,255,255,0.22)'; ell(g, 2.0 * s, -2.6 * s, 0.5 * s, 0.2 * s, -0.3); g.fill();
}

// ----- pernas: calça cargo (bolso) ou jeans rasgado, joelheira e patins
function drawLeg(g, env, Lg, far) {
  const { C, R, P, hipY, p } = env, sh = farC(env, far);
  const pts = [Lg.hx, hipY, Lg.kx, Lg.ky, Lg.ex, Lg.ey];
  noodle(g, pts, R.legW + 0.25, sh(P.leg), sh(P.legS), P.line);
  const ta = Math.atan2(Lg.ky - hipY, Lg.kx - Lg.hx), sa = Math.atan2(Lg.ey - Lg.ky, Lg.ex - Lg.kx);
  const at = (u, seg) => seg ? [lerp(Lg.kx, Lg.ex, u), lerp(Lg.ky, Lg.ey, u), sa] : [lerp(Lg.hx, Lg.kx, u), lerp(hipY, Lg.ky, u), ta];
  if (C.pants === 'cargo') {   // bolso grande na lateral da coxa
    const [x, y, a] = at(0.58, false);
    g.save(); g.translate(x, y); g.rotate(a);
    fillShape(g, () => rr(g, -1.0, -R.legW * 0.42, 2.0, R.legW * 0.95, 0.3), sh(P.pocket), sh(P.legS), P.line, 0.2);
    g.fillStyle = sh(P.legS); g.fillRect(-1.0, -R.legW * 0.42, 0.45, R.legW * 0.95);   // aba
    g.restore();
    if (C.thighStrap) { const [x2, y2, a2] = at(0.25, false); g.save(); g.translate(x2, y2); g.rotate(a2); fillShape(g, () => rr(g, -0.3, -R.legW * 0.62, 0.6, R.legW * 1.24, 0.15), sh('#1c1a1f'), null, P.line); studs(g, P, [[0, R.legW * 0.15]], 0.18); g.restore(); }
  }
  if (C.pants === 'ripped') {   // rasgos mostrando a pele
    for (const [u, seg, w] of [[0.45, false, 1], [0.5, true, 0.8], [0.72, false, 0.6]]) {
      const [x, y, a] = at(u, seg);
      g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
      g.fillStyle = sh(P.rip); ell(g, 0.15, 0, R.legW * 0.32 * w, 0.2, 0.15); g.fill();
      g.strokeStyle = sh(P.line); g.lineWidth = 0.12; g.beginPath(); g.moveTo(-R.legW * 0.3 * w, -0.1); g.lineTo(R.legW * 0.45 * w, 0.05); g.stroke();
      g.restore();
    }
  }
  // joelheira preta grande, com tiras
  g.save(); g.translate(Lg.kx, Lg.ky); g.rotate(sa);
  for (const dx of [-0.75, 0.75]) fillShape(g, () => rr(g, dx - 0.16, -R.legW * 0.6, 0.32, R.legW * 1.2, 0.12), sh(P.padS), null, P.line);
  fillShape(g, () => ell(g, 0, -R.legW * 0.16, R.legW * 0.6, R.legW * 0.56), sh(P.pad), sh(P.padS), P.line, 0.3);
  g.fillStyle = sh(P.padA); ell(g, -0.08, -R.legW * 0.36, R.legW * 0.32, R.legW * 0.16); g.fill();
  g.restore();
  g.save(); g.translate(Lg.fx, Lg.fy); g.rotate(Lg.fr); drawSkate(g, env, far, p.wheel + (far ? 1 : 0)); g.restore();
}

// ----- braços: manga (jaqueta até o cotovelo / manguinha da camiseta / sem manga), cotoveleira, luva sem dedo com tachas
function drawArm(g, env, A, far) {
  const { C, R, P } = env, sh = farC(env, far);
  const pts = [A.ax, A.ay, A.kx, A.ky, A.ex, A.ey];
  noodle(g, pts, R.armW * 0.82, sh(P.skin), sh(P.skinS), P.line);
  if (C.top === 'jacket') {
    noodle(g, [A.ax, A.ay, A.kx, A.ky], R.armW + 0.55, sh(P.top), sh(P.topS), P.line);
    const ua = Math.atan2(A.ky - A.ay, A.kx - A.ax);   // barra dobrada da manga
    g.save(); g.translate(lerp(A.ax, A.kx, 0.88), lerp(A.ay, A.ky, 0.88)); g.rotate(ua);
    fillShape(g, () => rr(g, -0.5, -(R.armW + 0.75) / 2, 1.0, R.armW + 0.75, 0.35), sh(P.topS), null, P.line); g.restore();
  } else if (C.id === 'lua') {
    noodle(g, [A.ax, A.ay, lerp(A.ax, A.kx, 0.5), lerp(A.ay, A.ky, 0.5)], R.armW + 0.5, sh(P.tee), sh(P.teeS), P.line);
  } else {
    fillShape(g, () => ell(g, A.ax - 0.2, A.ay - 0.4, R.armW * 0.6, R.armW * 0.5), sh(P.top), sh(P.topS), P.line, 0.25);   // cava do colete
  }
  // cotoveleira
  const ua = Math.atan2(A.ky - A.ay, A.kx - A.ax);
  g.save(); g.translate(A.kx, A.ky); g.rotate(ua);
  fillShape(g, () => ell(g, 0, 0, R.armW * 0.54, R.armW * 0.58), sh(P.pad), sh(P.padS), P.line, 0.24);
  g.fillStyle = sh(P.padA); ell(g, -0.08, -R.armW * 0.22, R.armW * 0.24, R.armW * 0.14); g.fill();
  g.restore();
  // munhequeira de tachas
  const fa = Math.atan2(A.ey - A.ky, A.ex - A.kx), wx = lerp(A.kx, A.ex, 0.86), wy = lerp(A.ky, A.ey, 0.86);
  g.save(); g.translate(wx, wy); g.rotate(fa);
  fillShape(g, () => rr(g, -0.32, -R.armW * 0.5, 0.64, R.armW * 1.0, 0.2), sh(P.glove), sh(P.gloveS), P.line, 0.15);
  studs(g, P, [[0, -R.armW * 0.22], [0, R.armW * 0.2]], 0.14);
  g.restore();
  drawHand(g, env, A.ex, A.ey, fa, A.hand, far);
}
function drawHand(g, env, x, y, ang, kind, far) {
  const { R, P } = env, sh = farC(env, far), hr = R.armW * 0.62;
  g.save(); g.translate(x, y); g.rotate(ang);
  const finger = (fx, fy, len, rot) => { g.save(); g.translate(fx, fy); g.rotate(rot); fillShape(g, () => rr(g, -0.27, -len, 0.54, len + 0.2, 0.27), sh(P.skin), sh(P.skinS), P.line, 0.15); g.restore(); };
  if (kind === 'horns') { g.save(); g.rotate(Math.PI / 2); finger(-0.42, -hr * 0.5, 1.7, -0.18); finger(0.45, -hr * 0.5, 1.45, 0.2); g.restore(); }
  else if (kind === 'point2') { finger(hr * 0.6, -0.3, 2.0, Math.PI / 2 - 0.12); finger(hr * 0.6, 0.35, 1.9, Math.PI / 2 + 0.1); }
  // luva sem dedo: a palma preta, as pontas dos dedos de fora
  const hand = () => ell(g, hr * 0.25, 0, hr * 1.05, hr);
  fillShape(g, hand, sh(P.skin), sh(P.skinS), P.line, 0.3);
  g.save(); hand(); g.clip(); g.fillStyle = sh(P.glove); g.fillRect(-hr * 2, -hr * 2, hr * 2.2, hr * 4); g.fillStyle = sh(P.gloveS); g.fillRect(-hr * 2, hr * 0.4, hr * 2.2, hr * 2); g.restore();
  if (kind === 'open') { g.save(); g.translate(hr * 0.2, -hr * 0.85); g.rotate(-0.5); fillShape(g, () => rr(g, -0.25, -0.9, 0.5, 1.1, 0.25), sh(P.skin), sh(P.skinS), P.line, 0.12); g.restore(); }
  g.restore();
}

// ----- tronco: camiseta de banda por baixo, jaqueta ou colete de brim aberto por cima
function drawTorso(g, env) {
  const { C, R, P, hipY, shY } = env, tw = R.shW, bw = R.waist;
  const body = () => {
    g.beginPath(); g.moveTo(-tw * 0.5, shY + 1.0);
    g.quadraticCurveTo(-bw * 0.62, (shY + hipY) / 2 + 0.5, -bw * 0.5, hipY + 0.9);
    g.quadraticCurveTo(0, hipY + 1.5, bw * 0.5, hipY + 0.9);
    g.quadraticCurveTo(bw * 0.62, (shY + hipY) / 2 + 0.5, tw * 0.5, shY + 1.0);
    g.quadraticCurveTo(0, shY - 1.1, -tw * 0.5, shY + 1.0); g.closePath();
  };
  // cós da calça por baixo
  fillShape(g, () => rr(g, -bw * 0.5, hipY - 0.6, bw, 1.9, 0.8), P.leg, P.legS, P.line, 0.4);
  // camiseta
  fillShape(g, body, P.tee, P.teeS, P.line, 1.0);
  g.save(); body(); g.clip();
  const px = tw * 0.22, py = shY + R.torso * 0.52, ps = R.torso / 6;
  if (C.print === 'guitar') {   // guitarra dentro de um círculo
    g.strokeStyle = P.printS; g.lineWidth = 0.28 * ps; ell(g, px, py, 1.55 * ps, 1.55 * ps); g.stroke();
    g.save(); g.translate(px, py); g.rotate(0.6); g.fillStyle = P.print;
    g.fillRect(-0.16 * ps, -2.0 * ps, 0.32 * ps, 1.9 * ps); rr(g, -0.32 * ps, -2.35 * ps, 0.64 * ps, 0.5 * ps, 0.15 * ps); g.fill();
    ell(g, 0, 0.55 * ps, 0.85 * ps, 0.75 * ps); g.fill(); ell(g, 0, -0.15 * ps, 0.62 * ps, 0.55 * ps); g.fill();
    g.fillStyle = P.printS; ell(g, 0, 0.2 * ps, 0.22 * ps, 0.22 * ps); g.fill(); g.restore();
  } else if (C.print === 'skull') {   // caveira
    const s2 = ps * 1.15;
    g.fillStyle = P.print; ell(g, px, py - 0.25 * s2, 1.25 * s2, 1.1 * s2); g.fill(); rr(g, px - 0.75 * s2, py + 0.35 * s2, 1.5 * s2, 0.9 * s2, 0.25 * s2); g.fill();
    g.fillStyle = P.tee; ell(g, px - 0.45 * s2, py - 0.2 * s2, 0.33 * s2, 0.38 * s2); g.fill(); ell(g, px + 0.45 * s2, py - 0.2 * s2, 0.33 * s2, 0.38 * s2); g.fill();
    g.beginPath(); g.moveTo(px, py + 0.1 * s2); g.lineTo(px - 0.15 * s2, py + 0.4 * s2); g.lineTo(px + 0.15 * s2, py + 0.4 * s2); g.fill();
    for (let i = -1; i <= 1; i++) g.fillRect(px + i * 0.32 * s2 - 0.05 * s2, py + 0.75 * s2, 0.1 * s2, 0.5 * s2);
    g.strokeStyle = P.printS; g.lineWidth = 0.22 * s2; g.beginPath(); g.moveTo(px - 1.6 * s2, py - 1.4 * s2); g.lineTo(px - 1.1 * s2, py - 0.9 * s2); g.moveTo(px + 1.6 * s2, py - 1.4 * s2); g.lineTo(px + 1.1 * s2, py - 0.9 * s2); g.stroke();
  }
  // jaqueta / colete: cobre o tronco menos a abertura da frente; a camiseta aparece também embaixo da barra
  const hemY = hipY - 0.35;
  const open = () => { g.moveTo(-tw * 0.12, shY - 1.5); g.lineTo(tw * 0.47, shY - 1.5); g.lineTo(bw * 0.42, hipY + 2); g.lineTo(-bw * 0.08, hipY + 2); g.closePath(); };
  const hem = () => {   // região acima da barra (reta ou desfiada)
    g.beginPath(); g.moveTo(-tw, shY - 3);
    g.lineTo(tw, shY - 3); g.lineTo(tw, hemY);
    if (C.torn) for (let x = tw, i = 0; x > -tw; x -= 0.55, i++) g.lineTo(x, hemY + (i % 2 ? 0.55 : -0.05) + (i % 5 === 2 ? 0.4 : 0));
    g.lineTo(-tw, hemY); g.closePath();
  };
  g.save(); hem(); g.clip();
  g.beginPath(); body(); open(); g.fillStyle = P.topS; g.fill('evenodd');
  g.save(); g.translate(-1.0, -0.8); g.beginPath(); body(); open(); g.fillStyle = P.top; g.fill('evenodd'); g.restore();
  // costuras, bolso do peito e lapela
  g.strokeStyle = P.stitch; g.lineWidth = 0.14; g.setLineDash([0.35, 0.3]);
  g.beginPath(); g.moveTo(-tw * 0.5, shY + R.torso * 0.36); g.lineTo(-tw * 0.14, shY + R.torso * 0.36); g.stroke();
  g.setLineDash([]);
  fillShape(g, () => rr(g, -tw * 0.44, shY + R.torso * 0.42, tw * 0.24, R.torso * 0.18, 0.25), P.topS, null, P.line);
  studs(g, P, [[-tw * 0.32, shY + R.torso * 0.49]], 0.15);
  g.fillStyle = P.topS; g.beginPath(); g.moveTo(-tw * 0.12, shY - 1); g.lineTo(-tw * 0.24, shY + R.torso * 0.3); g.lineTo(-tw * 0.08, shY + R.torso * 0.42); g.closePath(); g.fill();   // lapela
  g.beginPath(); g.moveTo(tw * 0.47, shY - 1); g.lineTo(tw * 0.56, shY + R.torso * 0.28); g.lineTo(tw * 0.44, shY + R.torso * 0.36); g.closePath(); g.fill();
  // patches costurados (não na Lua: o colete dela é liso)
  if (C.id !== 'lua') {
    fillShape(g, () => ell(g, -tw * 0.3, shY + R.torso * 0.75, 0.62, 0.62), P.patchA, null, P.line);
    g.fillStyle = '#f2e6d0'; star(g, -tw * 0.3, shY + R.torso * 0.75, 0.38);
  }
  // barra (reta) / bainha desfiada
  if (!C.torn) { g.fillStyle = P.topS; g.fillRect(-tw, hemY - 0.7, tw * 2, 0.7); g.strokeStyle = P.stitch; g.lineWidth = 0.12; g.setLineDash([0.35, 0.3]); g.beginPath(); g.moveTo(-tw, hemY - 0.55); g.lineTo(tw, hemY - 0.55); g.stroke(); g.setLineDash([]); }
  else { g.fillStyle = P.tee; ell(g, -tw * 0.3, shY + R.torso * 0.62, 0.45, 0.32, 0.3); g.fill(); ell(g, tw * 0.5, shY + R.torso * 0.5, 0.3, 0.45); g.fill(); }   // furinhos
  g.restore();
  // contorno da abertura e da barra
  g.restore();
  g.save(); body(); g.clip();
  g.strokeStyle = P.line; g.lineWidth = ST.OL * 1.2; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-tw * 0.12, shY - 1.5); g.lineTo(-bw * 0.08, hemY); g.moveTo(tw * 0.47, shY - 1.5); g.lineTo(bw * 0.42 * 0.98, hemY); g.stroke();
  g.restore();
  // spikes nos ombros (Gabriel)
  if (C.spikes) {
    for (let i = 0; i < 4; i++) { const u = i / 3, x = lerp(-tw * 0.46, -tw * 0.14, u), y = shY + 0.75 - Math.sin(u * Math.PI) * 0.45; spike(g, P, x, y, -0.35 + u * 0.4, 1.05, 0.32); }
    for (let i = 0; i < 2; i++) spike(g, P, tw * (0.36 + i * 0.12), shY + 0.55 + i * 0.25, 0.3 + i * 0.25, 0.9, 0.28);
  }
  // colar: corrente com pingente (raio da Lua / palheta do Merlin)
  if (C.necklace) {
    const a0 = [-tw * 0.05, shY + 0.05], a1 = [tw * 0.42, shY - 0.05], pd = [tw * 0.2, shY + R.torso * 0.24];
    g.strokeStyle = P.chainC; g.lineWidth = 0.2; g.setLineDash([0.22, 0.14]);
    g.beginPath(); g.moveTo(a0[0], a0[1]); g.quadraticCurveTo(pd[0] - 0.8, pd[1] + 0.2, pd[0], pd[1]); g.quadraticCurveTo(pd[0] + 0.8, pd[1] + 0.2, a1[0], a1[1]); g.stroke(); g.setLineDash([]);
    g.fillStyle = P.pendant;
    if (C.necklace === 'bolt') { g.save(); g.translate(pd[0], pd[1] + 0.75); g.lineWidth = 0.15; g.strokeStyle = P.line; bolt(g, 0, 0, 1.0); g.stroke(); g.fill(); g.restore(); }
    else { g.beginPath(); g.moveTo(pd[0] - 0.5, pd[1] + 0.1); g.quadraticCurveTo(pd[0], pd[1] - 0.15, pd[0] + 0.5, pd[1] + 0.1); g.quadraticCurveTo(pd[0] + 0.4, pd[1] + 0.75, pd[0], pd[1] + 1.05); g.quadraticCurveTo(pd[0] - 0.4, pd[1] + 0.75, pd[0] - 0.5, pd[1] + 0.1); g.fill(); g.strokeStyle = P.line; g.lineWidth = 0.14; g.stroke(); }
  }
  // alça da mochila por cima do ombro da frente (Lua)
  if (C.backpack) fillShape(g, () => { g.beginPath(); g.moveTo(tw * 0.26, shY - 0.1); g.lineTo(tw * 0.48, shY + 0.1); g.lineTo(tw * 0.34, shY + R.torso * 0.62); g.lineTo(tw * 0.18, shY + R.torso * 0.6); g.closePath(); }, P.bagS, null, P.line);
}
function bolt(g, x, y, s) {
  g.beginPath(); g.moveTo(x + 0.15 * s, y - 0.75 * s); g.lineTo(x - 0.45 * s, y + 0.1 * s); g.lineTo(x - 0.02 * s, y + 0.1 * s); g.lineTo(x - 0.2 * s, y + 0.78 * s);
  g.lineTo(x + 0.45 * s, y - 0.12 * s); g.lineTo(x + 0.04 * s, y - 0.12 * s); g.closePath(); g.fill();
}
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fill(); }

// ----- cinto com fivela de metal, pochetes e corrente (ou mosquetão)
function drawBelt(g, env) {
  const { C, R, P, hipY } = env, bw = R.waist, y = hipY - 0.45;
  if (C.chain) {   // corrente pendurada da frente até o bolso de trás
    g.lineCap = 'round';
    const chain = () => { g.beginPath(); g.moveTo(bw * 0.38, y + 0.6); g.quadraticCurveTo(bw * 0.05, y + 4.6, -bw * 0.36, y + 0.8); };
    chain(); g.strokeStyle = P.line; g.lineWidth = 0.42; g.stroke();
    chain(); g.strokeStyle = mixHex(P.chainC, P.line, 0.3); g.lineWidth = 0.24; g.setLineDash([0.26, 0.16]); g.stroke(); g.setLineDash([]);
  }
  fillShape(g, () => rr(g, -bw * 0.55, y, bw * 1.1, 1.0, 0.3), P.belt, mixHex(P.belt, P.line, 0.5), P.line, 0.25);
  g.fillStyle = mixHex(P.belt, P.line, 0.5); for (const x of [-bw * 0.2, bw * 0.12]) g.fillRect(x, y - 0.05, 0.3, 1.1);   // passantes
  fillShape(g, () => rr(g, bw * 0.2, y - 0.12, 1.35, 1.24, 0.25), P.buckle, mixHex(P.buckle, P.line, 0.4), P.line, 0.2);
  g.fillStyle = P.belt; rr(g, bw * 0.2 + 0.35, y + 0.22, 0.65, 0.56, 0.12); g.fill();
  // pochete do lado
  fillShape(g, () => rr(g, -bw * 0.6, y - 0.1, 1.3, 1.6, 0.3), P.pouch, mixHex(P.pouch, P.line, 0.45), P.line, 0.25);
  g.fillStyle = mixHex(P.pouch, P.line, 0.45); g.fillRect(-bw * 0.6 + 0.1, y + 0.35, 1.1, 0.2);
  if (C.carabiner) { g.strokeStyle = P.line; g.lineWidth = 0.5; ell(g, bw * 0.05, y + 1.9, 0.42, 0.75); g.stroke(); g.strokeStyle = P.stud; g.lineWidth = 0.26; g.stroke(); }
}

// ----- mochila camuflada (Lua)
function drawBackpack(g, env) {
  const { R, P, shY } = env, tw = R.shW, x = -tw * 0.5 - 1.6, y = shY + 0.2, w = 3.4, h = R.torso * 0.9;
  const bag = () => rr(g, x, y, w, h, 1.1);
  fillShape(g, bag, P.bag, P.bagS, P.line, 0.5);
  g.save(); bag(); g.clip();
  g.fillStyle = P.camoA; for (const [cx, cy, r] of [[0.8, 1.2, 0.7], [2.2, 2.6, 0.6], [1.1, 3.8, 0.8], [2.6, 4.6, 0.5]]) { ell(g, x + cx, y + cy, r, r * 0.7, 0.5); g.fill(); }
  g.fillStyle = P.camoB; for (const [cx, cy, r] of [[1.9, 1.0, 0.5], [0.6, 2.7, 0.55], [2.4, 3.6, 0.45]]) { ell(g, x + cx, y + cy, r, r * 0.7, -0.4); g.fill(); }
  g.fillStyle = P.bagS; g.fillRect(x, y + 1.2, w, 0.35);
  g.restore();
}

// ----- cabelo atrás da cabeça (marias-chiquinhas / cachos compridos)
function drawHairBack(g, env) {
  const { C, R, P, p, t, headX, headY } = env, r = R.R;
  if (C.hair === 'pigtails') {
    pigtail(g, env, headX - r * 0.95, headY + r * 0.25, 1.25 + p.sway * 0.55 + Math.sin(t * 3.1) * 0.06, 0.92);
  } else if (C.hair === 'curls') {
    const dx = p.sway * 1.6, blobs = [[-2.0, -1.0, 2.0], [-3.8, 0.6, 2.2], [-4.6, 3.0, 2.2], [-4.4, 5.6, 2.1], [-3.4, 8.0, 1.9], [-5.4, 7.0, 1.6], [-2.0, 9.6, 1.5], [-4.2, 9.8, 1.35], [-1.0, 3.2, 1.8]];
    const pos = (bx, by) => [headX + bx + dx * Math.max(0, by + 2) / 10, headY + by + Math.sin(t * 2.4 + by) * 0.12];
    if (ST.line) { g.fillStyle = P.line; for (const [bx, by, q] of blobs) { const [x, y] = pos(bx, by); ell(g, x, y, q + ST.OL, q + ST.OL); g.fill(); } }
    for (const [bx, by, q] of blobs) { const [x, y] = pos(bx, by); g.fillStyle = P.hairS; ell(g, x, y, q, q); g.fill(); }
    for (const [bx, by, q] of blobs) { const [x, y] = pos(bx, by); g.fillStyle = P.hair; ell(g, x - q * 0.18, y - q * 0.22, q * 0.78, q * 0.74); g.fill(); }
    g.strokeStyle = P.hairL; g.lineWidth = 0.35; g.lineCap = 'round';
    for (const [bx, by, q] of blobs) { const [x, y] = pos(bx, by); g.beginPath(); g.arc(x - q * 0.2, y - q * 0.2, q * 0.42, Math.PI * 0.95, Math.PI * 1.7); g.stroke(); }
  }
}
function pigtail(g, env, x, y, ang, k) {
  const { P } = env;
  g.save(); g.translate(x, y); g.rotate(ang);
  const len = 6.2 * k, w = 1.9 * k;
  const shape = () => { g.beginPath(); g.moveTo(0, -w * 0.6); g.lineTo(len * 0.3, -w * 1.0); g.lineTo(len * 0.42, -w * 0.7); g.lineTo(len * 0.62, -w * 1.05); g.lineTo(len * 0.72, -w * 0.5); g.lineTo(len, -w * 0.4);
    g.lineTo(len * 0.82, w * 0.15); g.lineTo(len * 0.95, w * 0.75); g.lineTo(len * 0.6, w * 0.55); g.lineTo(len * 0.45, w * 1.0); g.lineTo(len * 0.3, w * 0.6); g.lineTo(0, w * 0.6); g.closePath(); };   // mecha espetada
  fillShape(g, shape, P.hair, P.hairS, P.line, 0.6);
  g.save(); shape(); g.clip(); g.fillStyle = P.tipsS; g.fillRect(len * 0.6, -w * 2, len, w * 4); g.fillStyle = P.tips; g.fillRect(len * 0.62, -w * 2, len, w * 1.7); g.restore();
  fillShape(g, () => ell(g, 0.2, 0, 0.75 * k, 0.95 * k), P.tie, mixHex(P.tie, P.line, 0.3), P.line, 0.2);
  g.restore();
}
// mechas espetadas saindo do capacete (lista em unidades de r: base1, base2, ponta)
const SPIKY = {
  back: [[-1.12, -0.42, -1.18, -0.05, -1.72, -0.42], [-1.18, -0.12, -1.06, 0.24, -1.78, 0.18], [-1.08, 0.12, -0.86, 0.46, -1.52, 0.7], [-0.9, 0.34, -0.6, 0.56, -1.05, 1.04], [-0.62, 0.42, -0.34, 0.5, -0.5, 0.92]],
  bangs: [[0.0, -0.4, 0.3, -0.42, 0.06, 0.0], [0.26, -0.42, 0.58, -0.4, 0.42, 0.02], [0.54, -0.38, 0.86, -0.34, 0.8, -0.02], [0.82, -0.34, 1.05, -0.3, 1.12, -0.06]],
};
function drawSpiky(g, env, list) {
  const { R, P, headX: hx, headY: hy } = env, r = R.R;
  for (const s of list) {
    fillShape(g, () => { g.beginPath(); g.moveTo(hx + s[0] * r, hy + s[1] * r); g.quadraticCurveTo(hx + lerp(s[0], s[4], 0.55) * r, hy + (lerp(s[1], s[5], 0.55) - 0.08) * r, hx + s[4] * r, hy + s[5] * r); g.lineTo(hx + s[2] * r, hy + s[3] * r); g.closePath(); }, P.hair, P.hairS, P.line, 0.25);
    g.strokeStyle = P.hairL; g.lineWidth = r * 0.05; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx + lerp(s[0], s[2], 0.35) * r, hy + lerp(s[1], s[3], 0.35) * r); g.lineTo(hx + lerp(s[0], s[4], 0.7) * r, hy + lerp(s[1], s[5], 0.7) * r); g.stroke();   // brilho de cada mecha
  }
}

// ----- cabeça: rosto, olhos (ou óculos de proteção), cabelo da frente, capacete com chamas e jugular
function drawEyes(g, env) {
  const { C, R, P, p, headX: hx, headY: hy } = env, r = R.R, ey = hy + r * 0.02;
  for (const [ex, s] of [[hx + r * 0.14, 1], [hx + r * 0.66, 0.84]]) {
    const w = r * 0.17 * s, h = r * 0.21 * s;
    g.lineCap = 'round';
    if (p.blink || p.eyes === 'happy') { g.strokeStyle = P.line; g.lineWidth = r * 0.075; g.beginPath(); g.moveTo(ex - w, ey + h * 0.2); g.quadraticCurveTo(ex, ey - h * 0.9, ex + w, ey + h * 0.2); g.stroke(); continue; }
    const hh = p.eyes === 'focus' ? h * 0.72 : h;
    g.fillStyle = P.eyeW; ell(g, ex, ey, w, hh); g.fill();
    g.save(); ell(g, ex, ey, w, hh); g.clip();
    g.fillStyle = P.iris; ell(g, ex + w * 0.22, ey + hh * 0.05, w * 0.72, h * 0.8); g.fill();
    g.fillStyle = P.pupil; ell(g, ex + w * 0.28, ey + hh * 0.08, w * 0.36, h * 0.42); g.fill();
    g.fillStyle = '#fff'; ell(g, ex + w * 0.48, ey - hh * 0.3, w * 0.26, w * 0.26); g.fill();
    g.restore();
    g.strokeStyle = P.line; g.lineWidth = r * 0.07;   // pálpebra de cima
    g.beginPath(); g.moveTo(ex - w * 1.05, ey - hh * 0.25); g.quadraticCurveTo(ex, ey - hh * 1.25, ex + w * 1.1, ey - hh * 0.45); g.stroke();
  }
}
function drawGogglesOnFace(g, env) {
  const { R, P, headX: hx, headY: hy } = env, r = R.R, ey = hy + r * 0.02;
  const lenses = () => { g.beginPath(); g.ellipse(hx + r * 0.14, ey, r * 0.34, r * 0.3, 0, 0, TAU); g.moveTo(hx + r * 0.98, ey); g.ellipse(hx + r * 0.7, ey, r * 0.28, r * 0.28, 0, 0, TAU); };
  // tira por trás da cabeça
  fillShape(g, () => { g.beginPath(); g.moveTo(hx - r * 0.2, ey - r * 0.18); g.lineTo(hx - r * 1.02, ey - r * 0.3); g.lineTo(hx - r * 0.98, ey + r * 0.06); g.lineTo(hx - r * 0.2, ey + r * 0.15); g.closePath(); }, P.strap, null, P.line);
  // armação
  fillShape(g, () => { g.beginPath(); g.ellipse(hx + r * 0.14, ey, r * 0.44, r * 0.4, 0, 0, TAU); g.moveTo(hx + r * 1.08, ey); g.ellipse(hx + r * 0.72, ey, r * 0.36, r * 0.37, 0, 0, TAU); g.rect(hx + r * 0.4, ey - r * 0.12, r * 0.25, r * 0.22); }, P.gogF, P.gogS, P.line, 0.3);
  // pele e olhos por trás da lente, depois a lente fumê e o reflexo
  g.save(); lenses(); g.clip();
  g.fillStyle = P.skin; g.fillRect(hx - r, ey - r, r * 2.2, r * 2); drawEyes(g, env);
  g.fillStyle = P.lens; g.fillRect(hx - r, ey - r, r * 2.2, r * 2);
  g.strokeStyle = P.lensL; g.lineWidth = r * 0.09; g.beginPath(); g.moveTo(hx - r * 0.1, ey - r * 0.05); g.lineTo(hx + r * 0.15, ey - r * 0.28); g.moveTo(hx + r * 0.52, ey + r * 0.02); g.lineTo(hx + r * 0.72, ey - r * 0.22); g.stroke();
  g.restore();
}
function drawHead(g, env) {
  const { C, R, P, p, t, headX: hx, headY: hy } = env, r = R.R;
  fillShape(g, () => rr(g, hx - 1.3, hy + r * 0.55, 2.4, R.neck + 1.6, 0.8), P.skinS, null, P.line);
  if (C.hair === 'spiky' || C.hair === 'pigtails') drawSpiky(g, env, SPIKY.back);
  fillShape(g, () => ell(g, hx, hy, r, r), P.skin, P.skinS, P.line, 0.9);
  fillShape(g, () => ell(g, hx - r * 0.42, hy + r * 0.12, r * 0.24, r * 0.32), P.skin, P.skinS, P.line, 0.2);
  if (C.beard) {
    g.save(); ell(g, hx, hy, r, r); g.clip();
    fillShape(g, () => { g.beginPath(); g.moveTo(hx - r * 0.3, hy + r * 0.2); g.quadraticCurveTo(hx - r * 0.05, hy + r * 0.72, hx + r * 0.5, hy + r * 0.62);
      g.quadraticCurveTo(hx + r * 0.95, hy + r * 0.52, hx + r * 1.2, hy + r * 0.42); g.lineTo(hx + r * 1.2, hy + r * 1.3); g.lineTo(hx - r * 1.2, hy + r * 1.3); g.lineTo(hx - r * 1.2, hy + r * 0.2); g.closePath(); },
    P.beard, P.beardS, null, 0.5);
    g.restore();
    fillShape(g, () => ell(g, hx + r * 0.58, hy + r * 0.4, r * 0.32, r * 0.13, -0.1), P.beard, P.beardS, null, 0.2);
  }
  g.fillStyle = P.blush; g.globalAlpha = 0.45; ell(g, hx + r * 0.02, hy + r * 0.42, r * 0.22, r * 0.12); g.fill(); ell(g, hx + r * 0.8, hy + r * 0.4, r * 0.14, r * 0.1); g.fill(); g.globalAlpha = 1;
  // sobrancelhas (por cima ficam escondidas pelo óculos)
  if (C.goggles !== 'eyes') {
    g.lineCap = 'round'; g.strokeStyle = C.hair === 'curls' ? P.hairS : P.line; g.lineWidth = r * 0.09;
    for (const [ex, s] of [[hx + r * 0.14, 1], [hx + r * 0.66, 0.84]]) { const w = r * 0.17 * s, by = hy - r * 0.34; g.beginPath(); g.moveTo(ex - w * 1.2, by + r * 0.05); g.quadraticCurveTo(ex, by - r * 0.1, ex + w * 1.3, by - r * 0.02); g.stroke(); }
    drawEyes(g, env);
  } else drawGogglesOnFace(g, env);
  fillShape(g, () => ell(g, hx + r * 0.97, hy + r * 0.24, r * 0.16, r * 0.14), P.skin, P.skinS, P.line, 0.12);   // nariz
  // boca
  const mx = hx + r * 0.5, my = hy + r * 0.58, mouth = p.mouth === 'smile' && C.mouth ? C.mouth : p.mouth;
  g.lineCap = 'round';
  if (mouth === 'smile' || mouth === 'smirk') {
    g.strokeStyle = P.line; g.lineWidth = r * 0.07; g.beginPath();
    if (mouth === 'smirk') { g.moveTo(mx - r * 0.22, my + r * 0.02); g.quadraticCurveTo(mx + r * 0.05, my + r * 0.1, mx + r * 0.3, my - r * 0.14); }
    else { g.moveTo(mx - r * 0.24, my - r * 0.04); g.quadraticCurveTo(mx, my + r * 0.18, mx + r * 0.24, my - r * 0.06); }
    g.stroke();
  } else {
    g.beginPath();
    if (mouth === 'o') ell(g, mx + r * 0.02, my + r * 0.04, r * 0.12, r * 0.14);
    else { g.moveTo(mx - r * 0.34, my - r * 0.1); g.quadraticCurveTo(mx, my - r * 0.02, mx + r * 0.34, my - r * 0.12); g.quadraticCurveTo(mx + r * 0.05, my + r * 0.42, mx - r * 0.34, my - r * 0.1); g.closePath(); }
    g.fillStyle = '#5a1420'; g.fill(); g.strokeStyle = P.line; g.lineWidth = r * 0.04; g.stroke();
    if (mouth !== 'o') { g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(mx - r * 0.4, my - r * 0.16, r * 0.8, r * 0.14); g.fillStyle = '#ff7f90'; ell(g, mx, my + r * 0.26, r * 0.15, r * 0.08); g.fill(); g.restore(); }
  }
  // argolinha (Lua)
  if (C.id === 'lua') { g.strokeStyle = P.stud; g.lineWidth = 0.18; ell(g, hx - r * 0.38, hy + r * 0.52 + Math.sin(t * 4) * 0.04, 0.32, 0.36); g.stroke(); }
  // cabelo da frente
  if (C.hair === 'spiky' || C.hair === 'pigtails') drawSpiky(g, env, SPIKY.bangs);
  else if (C.hair === 'curls') for (const [bx, by, cr] of [[-0.85, 0.1, 0.36], [-0.95, 0.55, 0.32], [-0.75, 0.95, 0.27]]) fillShape(g, () => ell(g, hx + bx * r, hy + by * r, cr * r, cr * r), P.hair, P.hairS, P.line, 0.25);
  if (C.bandana) {
    const sw = Math.sin(t * 5) * 0.35 + p.sway * 1.2;
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
  const y = hy - (C.bandana ? r * 0.12 : 0);
  const shell = () => {
    g.beginPath(); g.moveTo(hx - r * 1.14, y + r * 0.12);
    g.bezierCurveTo(hx - r * 1.32, y - r * 1.55, hx + r * 0.95, y - r * 1.78, hx + r * 1.12, y - r * 0.48);
    g.quadraticCurveTo(hx + r * 1.3, y - r * 0.4, hx + r * 1.3, y - r * 0.3);
    g.quadraticCurveTo(hx + r * 1.1, y - r * 0.22, hx + r * 0.95, y - r * 0.24);
    g.quadraticCurveTo(hx - r * 0.1, y - r * 0.32, hx - r * 1.14, y + r * 0.12); g.closePath();
  };
  fillShape(g, shell, P.helm, P.helmS, P.line, 0.9);
  g.save(); shell(); g.clip();
  // chamas saindo da aba e lambendo o casco para trás
  const F = [[1.5, -0.3], [1.2, -0.55], [0.95, -1.12], [0.72, -0.62], [0.4, -1.18], [0.22, -0.6], [-0.15, -1.0], [-0.22, -0.48], [-0.62, -0.78], [-0.6, -0.3], [-0.95, -0.4], [-1.0, 0.3]];
  const flame = (sy, dx, col) => {
    g.beginPath(); g.moveTo(hx + 1.5 * r, y + 0.2 * r);
    for (let i = 0; i < F.length; i++) { const [fx, fy] = F[i], X = hx + (fx + dx) * r, Y = y + (lerp(-0.2, fy, sy)) * r; if (i % 2) g.lineTo(X, Y); else g.quadraticCurveTo(X + 0.25 * r, Y + 0.25 * r, X, Y); }
    g.lineTo(hx - 1.4 * r, y + 0.4 * r); g.closePath(); g.fillStyle = col; g.fill();
  };
  const fl = Math.sin(t * 7) * 0.03;
  flame(1 + fl, 0, P.flameS); flame(0.92 + fl, 0.05, P.flame); flame(0.5, 0.18, P.flameL);
  // respiros e brilho
  g.fillStyle = 'rgba(0,0,0,0.45)';
  for (const [vx, vy, rt] of [[-0.55, -1.02, -0.5], [0.05, -1.14, 0.05], [0.6, -0.95, 0.55]]) { g.save(); g.translate(hx + vx * r, y + vy * r); g.rotate(rt); rr(g, -r * 0.08, -r * 0.18, r * 0.16, r * 0.36, r * 0.08); g.fill(); g.restore(); }
  g.fillStyle = 'rgba(255,255,255,0.35)'; ell(g, hx + r * 0.25, y - r * 1.12, r * 0.42, r * 0.12, 0.3); g.fill();
  g.restore();
  // borda de borracha da aba
  g.strokeStyle = P.helmS; g.lineWidth = r * 0.1; g.beginPath(); g.moveTo(hx - r * 1.1, y + r * 0.08); g.quadraticCurveTo(hx - r * 0.1, y - r * 0.26, hx + r * 0.98, y - r * 0.26); g.stroke();
  // óculos levantado no capacete (Merlin)
  if (C.goggles === 'up') {
    const gy = y - r * 0.72;
    fillShape(g, () => { g.beginPath(); g.moveTo(hx - r * 1.2, gy - r * 0.05); g.quadraticCurveTo(hx, gy - r * 0.42, hx + r * 1.05, gy + r * 0.12); g.lineTo(hx + r * 1.05, gy + r * 0.34); g.quadraticCurveTo(hx, gy - r * 0.18, hx - r * 1.2, gy + r * 0.2); g.closePath(); }, P.strap, null, P.line);
    fillShape(g, () => { g.beginPath(); g.ellipse(hx + r * 0.38, gy, r * 0.32, r * 0.25, 0.25, 0, TAU); g.moveTo(hx + r * 1.1, gy + r * 0.2); g.ellipse(hx + r * 0.88, gy + r * 0.14, r * 0.24, r * 0.21, 0.35, 0, TAU); }, P.gogF, P.gogS, P.line, 0.25);
    g.fillStyle = P.lens; ell(g, hx + r * 0.38, gy, r * 0.22, r * 0.17, 0.25); g.fill(); ell(g, hx + r * 0.88, gy + r * 0.14, r * 0.16, r * 0.14, 0.35); g.fill();
    g.fillStyle = P.lensL; ell(g, hx + r * 0.3, gy - r * 0.06, r * 0.08, r * 0.05, 0.25); g.fill();
  }
  // jugular até o queixo, com a fivela
  g.strokeStyle = P.line; g.lineWidth = r * 0.085; g.lineCap = 'round';
  g.beginPath(); g.moveTo(hx - r * 0.28, y - r * 0.12); g.quadraticCurveTo(hx - r * 0.25, hy + r * 0.62, hx + r * 0.15, hy + r * 0.98); g.stroke();
  g.fillStyle = P.stud; rr(g, hx - r * 0.33, hy + r * 0.42, r * 0.15, r * 0.2, 0.06); g.fill();
  if (C.hair === 'pigtails') pigtail(g, env, hx - r * 0.78, hy + r * 0.32, 1.9 + env.p.sway * 0.5 + Math.sin(t * 3.1 + 0.6) * 0.07, 0.86);
}

// ----- cenografia das poses: corrimão e faíscas
function drawRail(g, env) {
  g.fillStyle = '#c9c4d6'; g.fillRect(-16, -0.75, 32, 0.95);
  g.fillStyle = '#8d87a0'; g.fillRect(-16, -0.05, 32, 0.3);
  g.fillStyle = '#6d6780'; for (const x of [-12, 12]) g.fillRect(x - 0.4, 0.2, 0.8, 2.2);
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
