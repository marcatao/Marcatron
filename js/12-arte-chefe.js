'use strict';
// =================================================================== arte do chefe: PAREDÃO, o segurança da IA (v6)
// Gigante musculoso (~60 unidades, 3x o Gabriel baixinho) desenhado de 3/4 virado para a esquerda (-x), origem no chão;
// espelha quando olha para a direita. Curvar o tronco usa cisalhamento (o tronco "deita" para a frente sem girar os ombros).
const BOSS_PAL = {
  robo: { skin: '#a9b2c6', skinD: '#6f7890', skinL: '#dfe4ee', hair: '#1b1a21', hairL: '#45434f',
    shirt: '#26252e', shirtD: '#121117', shirtL: '#43414f', text: '#eef0f5', pants: '#30344a', pantsD: '#1b1e2b', pantsL: '#4b5068',
    boot: '#141319', sole: '#4a4654', lace: '#8a8f9c', belt: '#111016', buckle: '#c9ced6',
    pad: '#8d93a0', padL: '#e3e6ec', padD: '#4f5462', cone: '#23242c', coneL: '#5b5e6c', cap: RED,
    band: '#121117', stud: '#d5d9e0', mouth: '#3a1020', tongue: '#d9667a', teeth: '#ece9ee', brow: '#1b1a21', vein: '#7f88a6' },
  free: { skin: '#c98b5e', skinD: '#935a37', skinL: '#f4c79c', hair: '#2a1d1c', hairL: '#5e4339',
    shirt: '#ffd23f', shirtD: '#d4951a', shirtL: '#fff3b0', text: '#241a12', pants: '#30344a', pantsD: '#1b1e2b', pantsL: '#4b5068',
    boot: '#141319', sole: '#4a4654', lace: '#ff9a3c', belt: '#111016', buckle: '#e7c35f',
    pad: '#8d93a0', padL: '#e3e6ec', padD: '#4f5462', cone: '#23242c', coneL: '#5b5e6c', cap: '#b6ff3b',
    band: '#ff3fa4', stud: '#ffe8f4', mouth: '#4a1022', tongue: '#ff6f8a', teeth: '#f6f2ea', brow: '#2a1d1c', vein: '#a86a44' },
};
BOSS_PAL.flash = Object.fromEntries(Object.keys(BOSS_PAL.robo).map(k => [k, k === 'mouth' || k === 'cone' || k === 'belt' || k === 'boot' ? '#d9d5e2' : '#ffffff']));
const B_UA = 12.2, B_FA = 11.6, B_TH = 9.3, B_SN = 8.7;          // ossos: braço, antebraço, coxa, canela
const B_SHN = [-12.4, -19.6], B_SHF = [11.4, -19.6], B_NECK = [-0.7, -28.6];   // ombros e topo do pescoço (no tronco)
const easeO = t => 1 - (1 - t) * (1 - t), easeIO = t => t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// IK de dois ossos com "polo" (o joelho/cotovelo vai para o lado do polo); devolve a junta e a ponta (encurtada se não alcança)
function ik2(a, e, l1, l2, pole) {
  let dx = e[0] - a[0], dy = e[1] - a[1], d = Math.hypot(dx, dy) || 0.001;
  const max = (l1 + l2) * 0.998; let ex = e[0], ey = e[1];
  if (d > max) { ex = a[0] + dx / d * max; ey = a[1] + dy / d * max; dx = ex - a[0]; dy = ey - a[1]; d = max; }
  const k = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - k * k));
  const ux = dx / d, uy = dy / d, mx = a[0] + ux * k, my = a[1] + uy * k;
  const c1 = [mx - uy * h, my + ux * h], c2 = [mx + uy * h, my - ux * h];
  return { j: Math.hypot(c1[0] - pole[0], c1[1] - pole[1]) < Math.hypot(c2[0] - pole[0], c2[1] - pole[1]) ? c1 : c2, e: [ex, ey] };
}
// membro afunilado (cápsula com larguras diferentes nas pontas e um "músculo" de um lado)
function taper(g, a, b, w0, w1, fill, lw = 0.75, bul = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 0.001, nx = -dy / L, ny = dx / L;
  const r0 = w0 / 2, r1 = w1 / 2, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, rm = (r0 + r1) / 2, an = Math.atan2(ny, nx);
  g.beginPath();
  g.moveTo(a[0] + nx * r0, a[1] + ny * r0);
  g.quadraticCurveTo(mx + nx * (rm * 1.12 + bul), my + ny * (rm * 1.12 + bul), b[0] + nx * r1, b[1] + ny * r1);
  g.arc(b[0], b[1], r1, an, an + Math.PI, true);
  g.quadraticCurveTo(mx - nx * rm * 1.12, my - ny * rm * 1.12, a[0] - nx * r0, a[1] - ny * r0);
  g.arc(a[0], a[1], r0, an + Math.PI, an + 2 * Math.PI, true);
  g.closePath();
  if (fill) fillStroke(g, fill, lw);
}

// ------------------------------------------------------------------ poses (coordenadas locais, virado para a esquerda)
function bossBase() {
  return { hipX: 0, hipY: -21.6, lean: 0.02, bend: 0, head: 0, hN: [-16.6, -20.5], hF: [15.6, -20.5], poleN: [-24, -27], poleF: [24, -27],
    fN: [-8.2, 0], fF: [7.2, 0], kneel: 0, flex: 0, mouth: 'frown', eyes: 'visor', brow: -0.6, handN: 'fist', handF: 'fist',
    box: null, shake: 0, stars: 0, farFront: true, sweat: 0, tongue: 0 };
}
function bossT2L(P, x, y) {   // ponto no referencial do tronco -> local
  const sx = 0.62 * P.bend, sy = 1 - 0.36 * P.bend, ca = Math.cos(-P.lean), sa = Math.sin(-P.lean);
  const px = x + sx * y, py = sy * y;
  return [P.hipX + px * ca - py * sa, P.hipY + px * sa + py * ca];
}
function blendPose(A, B, t) {
  const o = {};
  for (const k in B) {
    const a = A[k], b = B[k];
    if (typeof b === 'number' && typeof a === 'number') o[k] = lerp(a, b, t);
    else if (Array.isArray(b) && Array.isArray(a) && b.length === 2) o[k] = lerp2(a, b, t);
    else if (Array.isArray(b) && Array.isArray(a)) o[k] = b.map((v, i) => lerp(a[i], v, t));
    else o[k] = t < 0.5 ? a : b;
  }
  return o;
}
function poseIdle(b, beat) {   // braços cruzados, batendo o pé
  const P = bossBase(), pulse = beatPulse(beat, 3.2);
  P.hipY = -21.6 + Math.sin(b.t * 2) * 0.18; P.lean = 0.03; P.head = -0.03 - pulse * 0.05;
  P.hN = bossT2L(P, -1.0, -11.2); P.hF = bossT2L(P, 2.6, -9.8); P.poleN = bossT2L(P, -26, -6); P.poleF = bossT2L(P, 26, -6);
  P.handN = 'fist'; P.handF = 'tuck'; P.fN = [-8.6, -pulse * 1.1];
  return P;
}
function poseFlex(b, k) {     // bíceps duplo (apresentação e raiva)
  const P = bossBase();
  P.hipY = -21 + 1.2 * k; P.lean = -0.02;
  P.hN = bossT2L(P, -21.8, -31.4); P.hF = bossT2L(P, 20.8, -31.6); P.poleN = bossT2L(P, -34, -16); P.poleF = bossT2L(P, 34, -16);
  P.flex = 1; P.head = 0.2; P.mouth = 'roar'; P.eyes = 'hot'; P.brow = -1; P.shake = 0.35;
  return P;
}
function poseGuard(b, beat) { // guarda entre um arremesso e outro
  const P = bossBase(), pulse = beatPulse(beat, 3);
  P.hipY = -19.8 + pulse * 0.6; P.lean = 0.08;
  P.hN = bossT2L(P, -16.5, -14.5); P.hF = bossT2L(P, -8.5, -18.2); P.poleN = bossT2L(P, -24, 2); P.poleF = bossT2L(P, 18, 4);
  P.head = -0.03; P.brow = -0.8;
  return P;
}
function poseGrab(b, p) {     // a esteira entrega a caixa: alcança, pega e levanta acima da cabeça
  const pick = [(FEED_PICK[0] - b.x) * -b.dir, FEED_PICK[1] - b.y], over = [-6, -68], back = pick[0] > 0;
  const P = bossBase(); P.mouth = 'grit'; P.brow = -0.9;
  if (p < 0.45) {
    const q = easeIO(p / 0.45), G0 = poseGuard(b, 0);
    P.lean = lerp(0.06, back ? -0.2 : 0.16, q); P.hipY = -21 + 1.5 * q; P.head = lerp(0, 0.24, q);
    P.hN = lerp2(G0.hN, [pick[0] - 2, pick[1] + 2.5], q); P.hF = lerp2(G0.hF, [pick[0] + 2.5, pick[1] + 0.5], q);
    P.poleN = [-8, -66]; P.poleF = [26, -60]; P.handN = P.handF = q > 0.8 ? 'grip' : 'fist';
  } else {
    const q = easeIO((p - 0.45) / 0.55);
    const bx = lerp(pick[0], over[0], q), by = lerp(pick[1], over[1], q) - Math.sin(q * Math.PI) * 8, rot = lerp(0, -0.14, q);
    P.box = [bx, by, rot];
    P.lean = lerp(back ? -0.2 : 0.16, -0.1, q); P.hipY = -21 + lerp(1.5, 0.8, q); P.head = lerp(0.24, 0.32, q);
    P.hN = [bx - 5.6, by + 4.8]; P.hF = [bx + 5.4, by + 4.4]; P.poleN = [-26, -46]; P.poleF = [26, -48]; P.handN = P.handF = 'grip';
  }
  return P;
}
function poseThrow(b, q) {    // arremesso: braços descem para a frente
  const P = bossBase(), k = easeO(q);
  P.lean = lerp(-0.1, 0.32, k); P.hipY = -21 + lerp(0.8, 2.6, k); P.fN = [lerp(-8.6, -12.4, k), 0];
  P.hN = lerp2([-11.6, -63.2], [-25, -37], k); P.hF = lerp2([-0.6, -63.6], [-19, -40], k);
  P.poleN = [-24, lerp(-48, -8, k)]; P.poleF = [24, lerp(-48, -8, k)];
  P.head = lerp(0.32, -0.04, k); P.mouth = 'huh'; P.eyes = 'hot'; P.brow = -1; P.handN = P.handF = k > 0.5 ? 'open' : 'grip';
  return P;
}
function poseTired(b) {       // mãos nos joelhos, ofegante, língua de fora
  const P = bossBase(), s = Math.sin(b.pant);
  P.hipX = 4.4; P.hipY = -16.6 + s * 0.35; P.bend = 1; P.lean = 0.12 + s * 0.03; P.head = -0.26 + s * 0.06;
  P.fN = [-11.2, 0]; P.fF = [10.4, 0];
  const kN = ik2([P.hipX - 4.6, P.hipY + 0.6], [P.fN[0], -3.2], B_TH, B_SN, [P.fN[0] - 16, P.hipY + 6]).j;
  const kF = ik2([P.hipX + 4.2, P.hipY + 0.6], [P.fF[0], -3.2], B_TH, B_SN, [P.fF[0] - 14, P.hipY + 6]).j;
  P.hN = [kN[0] - 1.6, kN[1] - 2.6]; P.hF = [kF[0] - 1.4, kF[1] - 2.8]; P.poleN = [kN[0] + 4, kN[1] - 16]; P.poleF = [kF[0] + 6, kF[1] - 16];
  P.handN = P.handF = 'open'; P.mouth = 'pant'; P.eyes = 'dim'; P.brow = 0.6; P.farFront = false; P.sweat = 1; P.tongue = 1;
  return P;
}
function poseRecoil(b) {      // levou o golpe
  const P = bossBase();
  P.hipX = 1.2; P.hipY = -20.2; P.lean = -0.24; P.head = 0.42;
  P.hN = [-22, -46]; P.hF = [18.5, -47]; P.poleN = [-28, -32]; P.poleF = [28, -32];
  P.handN = P.handF = 'open'; P.mouth = 'oof'; P.eyes = 'glitch'; P.brow = 0.7; P.shake = 0.5;
  return P;
}
function poseStagger(b) {     // tonto, coçando a cabeça
  const P = bossBase(), s = b.st;
  P.lean = -0.06 + Math.sin(s * 0.33) * 0.06; P.hipY = -20.4; P.head = 0.12 + Math.sin(s * 0.5) * 0.08;
  P.hN = [-6.5 + Math.sin(s * 0.8) * 1.4, -60.5]; P.poleN = [-26, -50]; P.hF = bossT2L(P, 14.6, -4); P.poleF = bossT2L(P, 28, -12);
  P.handN = 'open'; P.handF = 'fist'; P.mouth = 'oof'; P.eyes = 'glitch'; P.brow = 0.5; P.stars = 1;
  return P;
}
function poseAngry(b, beat) { // posição de gorila, tremendo de raiva
  const P = bossBase(), stomp = b.st % 24 < 7 ? Math.sin((b.st % 24) / 7 * Math.PI) : 0;
  P.hipY = -18.6; P.lean = 0.14;
  P.hN = bossT2L(P, -18, -1.5); P.hF = bossT2L(P, 17, -1); P.poleN = bossT2L(P, -30, -14); P.poleF = bossT2L(P, 30, -14);
  P.flex = 1; P.head = -0.06; P.mouth = 'grit'; P.eyes = 'hot'; P.brow = -1; P.shake = 0.45; P.fN = [-9.4, -stomp * 3.2];
  return P;
}
function poseKneel(b) {       // de joelhos (nocaute)
  const P = bossBase();
  P.kneel = 1; P.hipX = 1.4; P.hipY = -12.6; P.bend = 0.45; P.lean = 0.16; P.head = -0.42;
  P.hN = [-14.5, -4.4]; P.hF = [11.5, -4.2]; P.poleN = [-20, -20]; P.poleF = [20, -20]; P.handN = P.handF = 'open';
  P.mouth = 'daze'; P.eyes = 'daze'; P.brow = 0.5; P.stars = 1;
  return P;
}
function poseHappy(b, beat) { // liberto: postura orgulhosa e sorriso
  const P = bossBase(), pulse = beatPulse(beat, 3);
  P.lean = -0.04; P.head = 0.06 - pulse * 0.05; P.mouth = 'smile'; P.eyes = 'happy'; P.brow = 0.4;
  return P;
}
function poseWalk(b, happy) {
  const P = bossBase(), ph = b.walkPh;
  P.fN = [-5.6 + Math.sin(ph) * 6.6, -Math.max(0, Math.cos(ph)) * 3.4]; P.fF = [5.2 + Math.sin(ph + Math.PI) * 6.6, -Math.max(0, Math.cos(ph + Math.PI)) * 3.4];
  P.hipY = -21 - Math.abs(Math.cos(ph)) * 0.9 + 0.5; P.lean = 0.06;
  P.hN = [-15.4 + Math.sin(ph + Math.PI) * 4.4, -21.5]; P.hF = [14.4 + Math.sin(ph) * 4.4, -21.5];
  P.head = 0.04; if (happy) { P.mouth = 'smile'; P.eyes = 'happy'; P.brow = 0.4; }
  return P;
}
function poseLift(b, beat) {  // levantando / segurando a porta de enrolar
  const P = bossBase(), gl = b.gateLift, L = GATE.lift * gl, bend = 1 - smooth(0, 0.45, gl);
  P.hipY = -21 + 7 * bend; P.bend = 0.7 * bend; P.lean = 0.1 * bend;
  const hy = -Math.max(6, L) - 0.6;
  P.hN = [-5.4, hy]; P.hF = [5.8, hy - 0.2]; P.poleN = [-28, -30]; P.poleF = [28, -30]; P.handN = P.handF = 'grip';
  P.head = lerp(-0.1, 0.22, 1 - bend); P.mouth = gl < 0.85 ? 'grit' : 'smile'; P.eyes = 'happy'; P.brow = 0.3;
  if (b.state === 'hold') { const pulse = beatPulse(beat, 3); P.fN = [-8.6, -pulse * 1.2]; P.head = 0.22 - pulse * 0.06; }
  return P;
}
function poseParty(b, beat) { // de roadie, curtindo o show: bate cabeça e faz o gesto do rock
  const P = bossBase(), pulse = beatPulse(beat, 2.6);
  P.head = 0.16 - pulse * 0.5; P.lean = 0.06 + pulse * 0.1; P.hipY = -21 + pulse * 0.8;
  P.hN = [-11.5, -59 + pulse * 4]; P.poleN = [-26, -44]; P.handN = 'horns';
  P.hF = bossT2L(P, 15, -3); P.poleF = bossT2L(P, 28, -14);
  P.mouth = 'yeah'; P.eyes = 'happy'; P.brow = 0.4;
  return P;
}
function bossPose(b, beat) {
  const st = b.st, PH = BP[Math.min(2, b.phase)];
  switch (b.state) {
    case 'idle': return poseIdle(b, beat);
    case 'intro': return blendPose(poseIdle(b, beat), poseFlex(b, 1), smooth(0, 16, st));
    case 'grab': { const P = poseGrab(b, clamp(st / PH.grab, 0, 1)); return st < 8 && b.throwsLeft < 3 ? blendPose(poseThrow(b, 1), P, st / 8) : P; }
    case 'throw': return poseThrow(b, clamp(st / 14, 0, 1));
    case 'pause': return blendPose(poseThrow(b, 1), poseGuard(b, beat), smooth(0, 12, st));
    case 'tired': {
      if (st >= 12) return poseTired(b);
      const from = (b.waitSt || 0) > 0 ? blendPose(poseThrow(b, 1), poseGuard(b, beat), smooth(0, 12, b.waitSt)) : poseThrow(b, 1);
      return blendPose(from, poseTired(b), easeO(st / 12));
    }
    case 'recover': return blendPose(poseTired(b), poseGuard(b, beat), smooth(0, 30, st));
    case 'hit': return st < 12 ? blendPose(poseTired(b), poseRecoil(b), easeO(st / 12)) : blendPose(poseRecoil(b), poseStagger(b), smooth(12, 24, st));
    case 'angry': return blendPose(poseStagger(b), poseAngry(b, beat), smooth(0, 10, st));
    case 'defeat': { const P = blendPose(poseStagger(b), poseKneel(b), easeIO(clamp(st / 30, 0, 1))); if (st < 40) { P.eyes = 'glitch'; P.shake = st > 26 ? 0.5 : 0; } return P; }
    case 'freed': {
      if (st > 64) return poseWalk(b, true);
      const H = poseHappy(b, beat);
      if (st > 24) { H.hN = [-19 + Math.sin(st * 0.42) * 2.6, -55]; H.poleN = [-30, -40]; H.handN = 'open'; }
      return blendPose(poseKneel(b), H, smooth(0, 36, st));
    }
    case 'lift': case 'hold': return poseLift(b, beat);
    case 'party': return b.x < BOSS_PARTY - 0.5 ? poseWalk(b, true) : blendPose(poseLift(b, beat), poseParty(b, beat), smooth(0, 14, st));
  }
  return bossBase();
}

// ------------------------------------------------------------------ rig
function drawBossLeg(g, hip, knee, ank, C, near) {
  taper(g, hip, knee, 11.2, 8.6, vgrad(g, hip[1] - 3, knee[1] + 3, [[0, C.pantsL], [1, C.pants]]), 0.75, 0.9);
  taper(g, knee, ank, 8.8, 6.6, C.pants, 0.75, 0.8);
  g.strokeStyle = C.pantsD; g.lineWidth = 0.42; g.lineCap = 'round';
  g.beginPath(); g.moveTo(knee[0] - 2.2, knee[1] - 0.6); g.quadraticCurveTo(knee[0], knee[1] + 0.8, knee[0] + 2.2, knee[1] - 0.4); g.stroke();
  if (near) {   // bolso cargo
    const mx = lerp(hip[0], knee[0], 0.55), my = lerp(hip[1], knee[1], 0.55);
    g.save(); g.translate(mx, my); g.rotate(Math.atan2(knee[1] - hip[1], knee[0] - hip[0]) - Math.PI / 2);
    rr(g, -2.4, -2.1, 4.8, 4.4, 0.7); fillStroke(g, C.pantsL, 0.4); g.fillStyle = C.pantsD; g.fillRect(-2.4, -2.1, 4.8, 1.1);
    g.restore();
  }
  // coturno (bico para a frente)
  const ax = ank[0], fy = ank[1] + 3.2;
  g.beginPath();
  g.moveTo(ax + 3.3, fy - 5.0); g.lineTo(ax + 3.7, fy - 0.9); g.quadraticCurveTo(ax + 3.7, fy, ax + 2.6, fy); g.lineTo(ax - 5.3, fy);
  g.quadraticCurveTo(ax - 7.4, fy, ax - 7.2, fy - 1.7); g.quadraticCurveTo(ax - 6.9, fy - 3.5, ax - 2.8, fy - 3.6); g.lineTo(ax - 2.5, fy - 5.0); g.closePath();
  fillStroke(g, C.boot, 0.75);
  g.fillStyle = C.sole; g.fillRect(ax - 6.9, fy - 1.0, 10.4, 1.0);
  g.fillStyle = 'rgba(255,255,255,0.16)'; ell(g, ax - 5.2, fy - 2.4, 1.6, 0.6, -0.2); g.fill();
  g.strokeStyle = C.lace; g.lineWidth = 0.32; g.beginPath(); for (let i = 0; i < 3; i++) { g.moveTo(ax - 2.7 - i * 0.9, fy - 4.4 + i * 0.85); g.lineTo(ax - 0.9 - i * 0.9, fy - 3.6 + i * 0.85); } g.stroke();
  g.fillStyle = C.pantsD; rr(g, ax - 3.0, fy - 6.0, 6.8, 1.6, 0.7); g.fill();   // barra da calça dobrada sobre o coturno
}
function drawBossArm(g, sh, el, hd, C, P, mode, near, o) {
  const u = [el[0] - sh[0], el[1] - sh[1]], v = [hd[0] - el[0], hd[1] - el[1]], cross = u[0] * v[1] - u[1] * v[0];
  const bul = 1.2 + P.flex * 1.7;
  // braço (bíceps do lado de dentro da dobra)
  const A = cross >= -2 ? [sh, el, 8.6, 6.6] : [el, sh, 6.6, 8.6];
  taper(g, A[0], A[1], A[2], A[3], C.skin, 0.75, bul);
  { // luz no bíceps e sombra no tríceps
    const L = Math.hypot(u[0], u[1]) || 1, s = cross >= -2 ? 1 : -1, nx = -u[1] / L * s, ny = u[0] / L * s, mx = (sh[0] + el[0]) / 2, my = (sh[1] + el[1]) / 2;
    g.strokeStyle = rgba(C.skinL.length === 7 ? C.skinL : '#ffffff', 0.55); g.lineWidth = 1.0; g.lineCap = 'round';
    g.beginPath(); g.moveTo(mx + nx * 2.4 - u[0] * 0.22, my + ny * 2.4 - u[1] * 0.22); g.quadraticCurveTo(mx + nx * (3.4 + P.flex), my + ny * (3.4 + P.flex), mx + nx * 2.2 + u[0] * 0.24, my + ny * 2.2 + u[1] * 0.24); g.stroke();
    g.strokeStyle = rgba(C.skinD.length === 7 ? C.skinD : '#ffffff', 0.5); g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(mx - nx * 2.6 - u[0] * 0.2, my - ny * 2.6 - u[1] * 0.2); g.lineTo(mx - nx * 2.4 + u[0] * 0.3, my - ny * 2.4 + u[1] * 0.3); g.stroke();
    if (P.flex > 0.5 && C !== BOSS_PAL.flash) { g.strokeStyle = C.vein; g.lineWidth = 0.32; g.beginPath(); g.moveTo(mx + nx * 0.6 - u[0] * 0.1, my + ny * 0.6 - u[1] * 0.1); g.quadraticCurveTo(mx + nx * 1.6, my + ny * 1.6, mx + nx * 0.8 + u[0] * 0.34, my + ny * 0.8 + u[1] * 0.34); g.stroke(); }
    if (!o.robo && near && C !== BOSS_PAL.flash) noteGlyph(g, mx + nx * 1.4, my + ny * 1.4 + 0.5, 0.42, '#3a2a5a');   // tatuagem de nota (liberto)
  }
  // manga da camiseta, justinha no braço
  taper(g, sh, [sh[0] + u[0] * 0.3, sh[1] + u[1] * 0.3], 9.6, 9.0, C.shirt, 0.7);
  // antebraço
  const fl = Math.hypot(v[0], v[1]) || 1, wx = hd[0] - v[0] / fl * 2.4, wy = hd[1] - v[1] / fl * 2.4;
  taper(g, el, [wx, wy], 7.4, 5.6, C.skin, 0.75, 0.9);
  g.strokeStyle = rgba(C.skinL.length === 7 ? C.skinL : '#ffffff', 0.4); g.lineWidth = 0.7;
  g.beginPath(); g.moveTo(lerp(el[0], wx, 0.15) - v[1] / fl * 1.6, lerp(el[1], wy, 0.15) + v[0] / fl * 1.6); g.lineTo(lerp(el[0], wx, 0.7) - v[1] / fl * 1.2, lerp(el[1], wy, 0.7) + v[0] / fl * 1.2); g.stroke();
  // munhequeira com tachas
  g.save(); g.translate(wx, wy); g.rotate(Math.atan2(v[1], v[0]));
  rr(g, -1.2, -3.1, 2.4, 6.2, 0.7); fillStroke(g, C.band, 0.5);
  g.fillStyle = C.stud; for (const y of [-1.6, 0, 1.6]) { ell(g, 0, y, 0.42, 0.42); g.fill(); }
  g.restore();
  // mão
  if (mode === 'tuck') return;
  g.save(); g.translate(hd[0], hd[1]); g.rotate(Math.atan2(v[1], v[0]));
  if (mode === 'open') {
    rr(g, -1.4, -3.0, 5.4, 6.0, 2.2); fillStroke(g, C.skin, 0.65);
    g.strokeStyle = rgba(C.skinD.length === 7 ? C.skinD : '#888888', 0.8); g.lineWidth = 0.32; g.beginPath(); for (const y of [-1.4, 0, 1.4]) { g.moveTo(1.6, y); g.lineTo(3.6, y); } g.stroke();
    ell(g, 0.4, -3.0, 1.0, 1.6, 0.6); fillStroke(g, C.skin, 0.5);
  } else if (mode === 'horns') {
    ell(g, 0.6, 0, 3.4, 3.1); fillStroke(g, C.skin, 0.65);
    for (const y of [-2.2, 2.0]) { g.save(); g.translate(2.2, y); rr(g, 0, -0.8, 4.4, 1.6, 0.8); fillStroke(g, C.skin, 0.5); g.restore(); }
  } else {
    ell(g, 0.8, 0, mode === 'grip' ? 3.5 : 3.6, mode === 'grip' ? 2.9 : 3.3); fillStroke(g, C.skin, 0.65);
    g.strokeStyle = rgba(C.skinD.length === 7 ? C.skinD : '#888888', 0.85); g.lineWidth = 0.32; g.beginPath();
    for (const y of [-1.5, 0, 1.5]) { g.moveTo(2.4, y - 0.5); g.quadraticCurveTo(3.3, y, 2.4, y + 0.5); }
    g.moveTo(-0.6, -1.6); g.quadraticCurveTo(1.2, -0.6, 2.0, -1.8); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.28)'; ell(g, 0.2, -1.4, 1.4, 0.7); g.fill();
  }
  g.restore();
}
function drawBossPad(g, x, y, ang, C, o, near) {   // ombreira de metal com alto-falante
  g.save(); g.translate(x, y); g.rotate(ang);
  ell(g, 0, 0, 6.3, 5.0); fillStroke(g, vgrad(g, -5.0, 5.0, [[0, C.padL], [0.45, C.pad], [1, C.padD]]), 0.8);
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.4; g.beginPath(); g.ellipse(0, 0, 5.4, 4.2, 0, Math.PI * 1.1, Math.PI * 1.75); g.stroke();
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; bolt(g, Math.cos(a) * 5.0, Math.sin(a) * 3.9, 0.36); }
  const s = 1 + 0.08 * o.pulse;
  g.save(); g.scale(s, s);
  ell(g, -0.4, 0.2, 3.6, 3.1); fillStroke(g, C.cone, 0.5);
  g.strokeStyle = C.coneL; g.lineWidth = 0.5; ell(g, -0.4, 0.2, 2.9, 2.5); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 0.25; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.moveTo(-0.4 + Math.cos(a) * 1.4, 0.2 + Math.sin(a) * 1.2); g.lineTo(-0.4 + Math.cos(a) * 3.0, 0.2 + Math.sin(a) * 2.6); } g.stroke();
  ell(g, -0.4, 0.2, 1.35, 1.2); g.fillStyle = C.cap; g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)'; ell(g, -0.8, -0.2, 0.45, 0.35); g.fill();
  g.restore();
  if (C !== BOSS_PAL.flash) emitL(g, -0.4, 0.2, o.robo ? 5 + 2.5 * o.pulse : 3.6 + 2 * o.pulse, C.cap, o.robo ? 0.75 : 0.5);
  g.restore();
}
function drawBossTorso(g, P, C, o) {
  const sw = 1 + P.flex * 0.04;
  g.beginPath();
  g.moveTo(-7.8, 0.8);
  g.bezierCurveTo(-8.6, -4.6, -15.6 * sw, -10.4, -15.6 * sw, -15.6);
  g.quadraticCurveTo(-15.6 * sw, -19.2, -13.2 * sw, -21.0);
  g.quadraticCurveTo(-9.6, -24.4, -4.6, -25.6);
  g.quadraticCurveTo(-0.8, -26.4, 3.2, -25.6);
  g.quadraticCurveTo(8.6, -24.6, 12.2 * sw, -21.0);
  g.quadraticCurveTo(14.6 * sw, -19.2, 14.6 * sw, -15.6);
  g.bezierCurveTo(14.6 * sw, -10.4, 8.4, -4.6, 7.4, 0.8);
  g.closePath();
  fillStroke(g, vgrad(g, -26, 1, [[0, C.shirtL], [0.32, C.shirt], [1, C.shirtD]]), 0.85);
  g.save(); g.clip();
  const sideG = g.createLinearGradient(-16, 0, 16, 0); sideG.addColorStop(0, 'rgba(255,255,255,0.08)'); sideG.addColorStop(0.55, 'rgba(0,0,0,0)'); sideG.addColorStop(1, 'rgba(0,0,0,0.3)');
  g.fillStyle = sideG; g.fillRect(-17, -27, 34, 29);
  g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = 0.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-13.4, -16.4); g.quadraticCurveTo(-8, -10.6, -1.6, -12.6); g.moveTo(-1.6, -12.6); g.quadraticCurveTo(5, -10.4, 11.6, -15.8); g.stroke();   // peitorais
  g.lineWidth = 0.4; g.beginPath(); g.moveTo(-1.4, -23.4); g.lineTo(-1.6, -13.2); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.moveTo(-6, -8.6); g.quadraticCurveTo(-1.6, -7.4, 3.4, -8.6); g.moveTo(-5.6, -4.6); g.quadraticCurveTo(-1.6, -3.6, 3.0, -4.6); g.moveTo(-1.6, -12); g.lineTo(-1.6, -2); g.stroke();   // abdômen
  g.fillStyle = 'rgba(255,255,255,0.13)'; ell(g, -8, -19.4, 4.6, 1.5, -0.12); g.fill(); ell(g, 5.2, -19.2, 3.4, 1.2, 0.12); g.fill();
  // texto da camiseta (desfaz o espelho para não ler ao contrário)
  g.save(); g.translate(-1.4, -16.4); if (o.mir) g.scale(-1, 1); g.rotate(o.mir ? 0.02 : -0.02);
  g.fillStyle = C.text; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (o.robo) { g.font = `800 3.7px ${FONT_UI}`; g.fillText('SEGURANÇA', 0, 0); g.fillStyle = C === BOSS_PAL.flash ? '#fff' : RED; ell(g, 0, -3.2, 0.7, 0.45); g.fill(); }
  else { g.font = `800 5.6px ${FONT_UI}`; g.fillText('STAFF', 0, 0.2); g.font = `800 2.2px ${FONT_UI}`; g.fillText('SOM LIVRE', 0, 3.6); }
  g.restore();
  g.restore();
  // gola
  g.strokeStyle = C.shirtD; g.lineWidth = 1.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(-5.0, -25.0); g.quadraticCurveTo(-1.2, -22.4, 3.4, -25.0); g.stroke();
  // cinto com fivela de alto-falante
  rr(g, -8.4, -1.8, 16.4, 2.8, 0.7); fillStroke(g, C.belt, 0.55);
  rr(g, -4.0, -2.3, 4.8, 3.8, 0.8); fillStroke(g, C.buckle, 0.5);
  g.fillStyle = 'rgba(0,0,0,0.55)'; for (const y of [-1.2, -0.2, 0.8]) g.fillRect(-3.2, y, 3.2, 0.42);
}
function drawBossHead(g, P, C, o) {
  // silhueta: nuca, topo reto (corte "flat-top"), testa, nariz, queixo quadrado
  g.beginPath();
  g.moveTo(2.9, 0.4);
  g.quadraticCurveTo(5.3, -3.2, 5.2, -7.8);
  g.quadraticCurveTo(5.0, -11.8, 1.8, -12.8);
  g.lineTo(-3.4, -12.8);
  g.quadraticCurveTo(-6.6, -12.4, -6.8, -9.4);
  g.lineTo(-7.0, -7.2);
  g.quadraticCurveTo(-8.3, -5.7, -7.2, -4.6);
  g.lineTo(-6.8, -3.9);
  g.quadraticCurveTo(-7.2, -2.6, -6.7, -1.4);
  g.quadraticCurveTo(-6.6, 0.3, -4.8, 0.6);
  g.quadraticCurveTo(-1.6, 1.0, 0.6, -0.5);
  g.quadraticCurveTo(1.8, -0.9, 2.9, 0.4);
  g.closePath();
  const sk = g.createRadialGradient(-3.4, -8.4, 0.6, -1, -6, 9.4); sk.addColorStop(0, C.skinL); sk.addColorStop(0.55, C.skin); sk.addColorStop(1, C.skinD);
  fillStroke(g, sk, 0.85);
  g.save(); g.clip();
  g.fillStyle = rgba(C.skinD.length === 7 ? C.skinD : '#ffffff', 0.55); g.beginPath(); g.moveTo(-6, 0.8); g.quadraticCurveTo(-1, -1.6, 3.6, -1.2); g.lineTo(6, 2); g.lineTo(-6, 2); g.closePath(); g.fill();   // sombra do maxilar
  g.fillStyle = rgba(C.hair.length === 7 ? C.hair : '#ffffff', 0.45); g.fillRect(0.6, -12.6, 5, 3.6);   // degradê raspado na lateral
  g.restore();
  // orelha
  ell(g, 2.6, -6.4, 1.3, 2.0, 0.1); fillStroke(g, C.skin, 0.55);
  g.strokeStyle = rgba(C.skinD.length === 7 ? C.skinD : '#888888', 0.9); g.lineWidth = 0.3; g.beginPath(); g.arc(2.7, -6.3, 0.9, -1.2, 1.6); g.stroke();
  // cabelo: topo reto
  g.beginPath();
  g.moveTo(-6.7, -9.8); g.lineTo(-6.9, -14.9); g.quadraticCurveTo(-6.8, -16.0, -5.6, -16.0); g.lineTo(3.0, -16.0); g.quadraticCurveTo(4.6, -16.0, 4.7, -14.6); g.lineTo(4.9, -10.6);
  g.quadraticCurveTo(3.6, -12.4, 1.4, -12.6); g.lineTo(-3.6, -12.6); g.quadraticCurveTo(-6.0, -12.2, -6.7, -9.8); g.closePath();
  fillStroke(g, vgrad(g, -16, -10, [[0, C.hairL], [1, C.hair]]), 0.7);
  g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(-6.2, -15.3); g.lineTo(3.6, -15.3); g.stroke();
  // sobrancelhas grossas (bravo = ponta de dentro para baixo)
  const br = P.brow;
  g.strokeStyle = C.brow; g.lineWidth = 1.05; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-6.7, -8.9 + br * 0.3); g.lineTo(-3.8, -8.5 - br * 0.9); g.moveTo(-2.7, -8.5 - br * 0.9); g.lineTo(0.1, -9.1 + br * 0.3); g.stroke();
  // olhos: visor da IA (robotizado) ou olhos de verdade (liberto)
  const E = P.eyes;
  if (o.robo && E !== 'daze') {
    g.beginPath(); g.moveTo(-7.5, -7.8); g.quadraticCurveTo(-2.6, -8.5, 2.3, -7.6); g.lineTo(2.2, -5.0); g.quadraticCurveTo(-2.6, -5.6, -7.4, -4.9); g.closePath();
    fillStroke(g, vgrad(g, -8.4, -4.9, [[0, '#3a3a46'], [0.5, '#121218'], [1, '#22222b']]), 0.6);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.28; g.beginPath(); g.moveTo(-6.8, -7.4); g.quadraticCurveTo(-3, -7.9, 0.8, -7.4); g.stroke();
    const flick = E === 'dim' ? (Math.sin(o.t * 37) > 0.2 ? 0.35 : 0.08) : E === 'glitch' ? (Math.random() < 0.5 ? 1 : 0.25) : 1;
    const hot = E === 'hot' ? 1 : 0;
    if (C !== BOSS_PAL.flash) {
      g.globalAlpha = flick; g.strokeStyle = RED; g.lineWidth = 0.75 + hot * 0.3;
      g.beginPath();
      if (E === 'glitch') { for (let k = 0; k < 4; k++) { const a = -6.6 + k * 2.2; g.moveTo(a, -6.4 + (Math.random() - 0.5) * 0.6); g.lineTo(a + 1.5, -6.4 + (Math.random() - 0.5) * 0.6); } }
      else { g.moveTo(-6.6, -6.35); g.quadraticCurveTo(-2.6, -6.9, 1.4, -6.3); }
      g.stroke(); g.globalAlpha = 1;
      const scan = E === 'visor' ? Math.sin(o.t * 1.7) * 3.2 - 2.6 : -5.2, dy = -6.5 + Math.abs(scan + 2.6) * 0.04;
      if (E !== 'dim' || flick > 0.3) {
        g.fillStyle = '#ffd0d6'; ell(g, scan, dy, 0.85 + hot * 0.25, 0.6 + hot * 0.15); g.fill();
        emitL(g, scan, dy, 5.2 + hot * 3, RED, 0.9 * flick);
      }
      emitL(g, -2.6, -6.4, 9 + hot * 4, RED, 0.28 * flick);
    }
    if (o.cracks > 0) { g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 0.22; g.beginPath(); g.moveTo(-1.2, -7.9); g.lineTo(-0.4, -6.6); g.lineTo(-1.0, -5.4); if (o.cracks > 1) { g.moveTo(-5.4, -7.6); g.lineTo(-4.6, -6.4); g.lineTo(-5.6, -5.2); g.moveTo(-4.6, -6.4); g.lineTo(-3.4, -6.0); } g.stroke(); }
    // ponto no ouvido + fio enrolado até a gola
    ell(g, 2.4, -6.0, 0.7, 0.7); g.fillStyle = '#111016'; g.fill();
    g.strokeStyle = '#d8dce6'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(2.6, -5.4);
    for (let i = 0; i <= 10; i++) { const k = i / 10; g.lineTo(3.2 + Math.sin(k * 18) * 0.55 + k * 0.8, -5.2 + k * 6.6); }
    g.stroke();
  } else {
    for (const [ex, ey, s] of [[-4.9, -6.4, 1], [-1.4, -6.5, 0.86]]) {
      if (E === 'daze') { g.strokeStyle = OUT; g.lineWidth = 0.32; g.beginPath(); for (let i = 0; i < 12; i++) { const a = i * 0.8 + o.t * 6, r = 0.1 + i * 0.075 * s; g.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r); } g.stroke(); continue; }
      if (P.mouth === 'yeah' || P.mouth === 'smile' && o.party) { g.strokeStyle = OUT; g.lineWidth = 0.45; g.beginPath(); g.arc(ex, ey + 0.4, 0.95 * s, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); continue; }
      ell(g, ex, ey, 1.05 * s, 1.2 * s); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.3; g.stroke();
      ell(g, ex - 0.32, ey + 0.1, 0.58 * s, 0.7 * s); g.fillStyle = '#3a2416'; g.fill();
      g.fillStyle = '#fff'; ell(g, ex - 0.5, ey - 0.25, 0.2, 0.2); g.fill();
    }
    if (!o.robo) { ell(g, 2.5, -4.6, 0.45, 0.45); g.strokeStyle = '#e7c35f'; g.lineWidth = 0.3; g.stroke(); g.fillStyle = 'rgba(255,110,110,0.32)'; ell(g, -4.6, -3.6, 1.3, 0.6); g.fill(); }
  }
  // nariz e boca
  g.strokeStyle = rgba(C.skinD.length === 7 ? C.skinD : '#888888', 0.9); g.lineWidth = 0.35; g.beginPath(); g.moveTo(-7.1, -4.7); g.quadraticCurveTo(-6.2, -4.3, -6.1, -5.0); g.stroke();
  const M = P.mouth, mx = -5.1, my = -2.1;
  g.lineCap = 'round';
  if (M === 'frown') { g.strokeStyle = OUT; g.lineWidth = 0.5; g.beginPath(); g.moveTo(mx - 1.4, my + 0.1); g.quadraticCurveTo(mx, my - 0.3, mx + 1.6, my + 0.4); g.stroke(); }
  else if (M === 'grit') { rr(g, mx - 1.7, my - 0.8, 3.6, 1.7, 0.5); g.fillStyle = C.teeth; g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.4; g.stroke(); g.lineWidth = 0.22; g.beginPath(); for (const x of [-0.6, 0.4, 1.3]) { g.moveTo(mx + x, my - 0.8); g.lineTo(mx + x, my + 0.9); } g.moveTo(mx - 1.7, my + 0.05); g.lineTo(mx + 1.9, my + 0.05); g.stroke(); }
  else if (M === 'roar' || M === 'yeah') {
    g.beginPath(); g.moveTo(mx - 2.0, my - 1.0); g.quadraticCurveTo(mx, my - 1.6, mx + 2.1, my - 0.8); g.quadraticCurveTo(mx + 1.6, my + 2.6, mx - 0.4, my + 2.7); g.quadraticCurveTo(mx - 2.2, my + 2.2, mx - 2.0, my - 1.0); g.closePath();
    g.fillStyle = C.mouth; g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.45; g.stroke();
    g.fillStyle = C.teeth; rr(g, mx - 1.6, my - 1.1, 3.4, 0.7, 0.2); g.fill();
    g.fillStyle = C.tongue; ell(g, mx - 0.1, my + 2.0, 1.2, 0.55); g.fill();
  } else if (M === 'huh' || M === 'oof') { ell(g, mx, my + 0.2, M === 'oof' ? 1.1 : 1.3, M === 'oof' ? 1.4 : 0.9); g.fillStyle = C.mouth; g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.4; g.stroke(); }
  else if (M === 'pant') {
    const open = 1.1 + Math.sin(o.pant) * 0.25;
    ell(g, mx, my + 0.2, 1.5, open); g.fillStyle = C.mouth; g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.4; g.stroke();
    g.save(); g.translate(mx - 0.4, my + 0.6); g.rotate(0.25 + Math.sin(o.pant * 0.5) * 0.12);   // língua de fora
    rr(g, -1.0, 0, 2.0, 3.4 + Math.sin(o.pant) * 0.3, 1.0); fillStroke(g, C.tongue, 0.4); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.2; g.beginPath(); g.moveTo(0, 0.4); g.lineTo(0, 2.6); g.stroke();
    g.restore();
  } else if (M === 'smile') {
    g.beginPath(); g.moveTo(mx - 1.9, my - 0.7); g.quadraticCurveTo(mx, my - 0.2, mx + 2.0, my - 0.9); g.quadraticCurveTo(mx + 1.4, my + 2.0, mx - 0.2, my + 1.9); g.quadraticCurveTo(mx - 1.8, my + 1.4, mx - 1.9, my - 0.7); g.closePath();
    g.fillStyle = C.mouth; g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.42; g.stroke();
    g.fillStyle = C.teeth; rr(g, mx - 1.5, my - 0.6, 3.2, 0.75, 0.25); g.fill();
  } else if (M === 'daze') { g.strokeStyle = OUT; g.lineWidth = 0.42; g.beginPath(); g.moveTo(mx - 1.5, my); g.quadraticCurveTo(mx - 0.7, my - 0.6, mx, my); g.quadraticCurveTo(mx + 0.7, my + 0.6, mx + 1.5, my); g.stroke(); }
}
function drawBossRig(g, P, C, o) {
  const T = (x, y) => bossT2L(P, x, y);
  // pernas
  const hipN = [P.hipX - 4.6, P.hipY + 0.6], hipF = [P.hipX + 4.2, P.hipY + 0.6];
  const LN = ik2(hipN, [P.fN[0], P.fN[1] - 3.2], B_TH, B_SN, [P.fN[0] - 16, P.hipY + 8]), LF = ik2(hipF, [P.fF[0], P.fF[1] - 3.2], B_TH, B_SN, [P.fF[0] - 14, P.hipY + 8]);
  let kN = LN.j, aN = LN.e, kF = LF.j, aF = LF.e;
  if (P.kneel > 0) { const q = P.kneel; kN = lerp2(kN, [-8.2, -2.6], q); kF = lerp2(kF, [6.6, -2.6], q); aN = lerp2(aN, [0.8, -2.2], q); aF = lerp2(aF, [15.4, -2.2], q); }
  if (P.kneel > 0.5) {   // canelas deitadas no chão, sola do coturno para trás
    for (const [h, k, a, near] of [[hipF, kF, aF, false], [hipN, kN, aN, true]]) {
      taper(g, h, k, 11.2, 8.6, C.pants, 0.75, 0.6); taper(g, k, a, 8.6, 6.4, C.pants, 0.75, 0.3);
      g.save(); g.translate(a[0] + 1.4, a[1] + 1.2); g.rotate(-1.35); rr(g, -2.4, -3.6, 4.8, 7.2, 1.4); fillStroke(g, C.boot, 0.7); g.fillStyle = C.sole; g.fillRect(-2.4, 2.6, 4.8, 1.0); g.restore();
      if (near) { g.strokeStyle = C.pantsD; g.lineWidth = 0.4; g.beginPath(); g.moveTo(k[0] - 2, k[1] - 0.8); g.lineTo(k[0] + 2, k[1] - 0.6); g.stroke(); }
    }
  } else { drawBossLeg(g, hipF, kF, aF, C, false); drawBossLeg(g, hipN, kN, aN, C, true); }
  // braços (IK com polo)
  const shN = T(B_SHN[0], B_SHN[1]), shF = T(B_SHF[0], B_SHF[1]);
  const AN = ik2(shN, P.hN, B_UA, B_FA, P.poleN), AF = ik2(shF, P.hF, B_UA, B_FA, P.poleF);
  const farArm = () => { drawBossArm(g, shF, AF.j, AF.e, C, P, P.handF, false, o); drawBossPad(g, shF[0] + 0.8, shF[1] - 1.4, Math.atan2(AF.j[1] - shF[1], AF.j[0] - shF[0]) - Math.PI / 2 + 0.2, C, o, false); };
  if (!P.farFront) farArm();
  // tronco (cisalhado quando curvado) e pescoço
  g.save();
  g.translate(P.hipX, P.hipY); g.rotate(-P.lean); g.transform(1, 0, 0.62 * P.bend, 1 - 0.36 * P.bend, 0, 0);
  g.beginPath(); g.moveTo(-4.9, -24.4); g.lineTo(-4.0, -29.4); g.lineTo(2.6, -29.4); g.lineTo(3.6, -24.4); g.closePath(); fillStroke(g, C.skin, 0.75);
  g.fillStyle = rgba(C.skinD.length === 7 ? C.skinD : '#ffffff', 0.6); g.beginPath(); g.moveTo(0.6, -24.6); g.lineTo(1.2, -29.2); g.lineTo(2.6, -29.4); g.lineTo(3.6, -24.4); g.closePath(); g.fill();
  drawBossTorso(g, P, C, o);
  if (!o.robo) { // fone de roadie no pescoço (liberto)
    g.strokeStyle = '#1c1b23'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-5.2, -25.4); g.quadraticCurveTo(-1, -21.2, 4.0, -25.4); g.stroke();
    for (const x of [-5.2, 4.0]) { ell(g, x, -25.2, 1.5, 1.8); fillStroke(g, '#ff3fa4', 0.45); }
  }
  g.restore();
  if (P.farFront) farArm();
  // cabeça
  const nk = T(B_NECK[0], B_NECK[1]);
  g.save(); g.translate(nk[0], nk[1]); g.rotate(P.head);
  drawBossHead(g, P, C, o);
  g.restore();
  // caixa levantada
  if (P.box) { g.save(); g.translate(P.box[0], P.box[1]); g.rotate(P.box[2]); drawSpeakerBox(g, 14, 12, 3 - o.throwsLeft, o.robo, o.t, o.pulse, C === BOSS_PAL.flash); g.restore(); }
  // braço da frente
  drawBossArm(g, shN, AN.j, AN.e, C, P, P.handN, true, o);
  drawBossPad(g, shN[0] - 0.9, shN[1] - 1.4, Math.atan2(AN.j[1] - shN[1], AN.j[0] - shN[0]) - Math.PI / 2 - 0.2, C, o, true);
  return { head: [nk[0] - 1.2 + Math.sin(P.head) * 6, nk[1] - 8] };
}
function drawBoss(g, b, beat) {
  const P = bossPose(b, beat);
  const flash = b.flash > 0 && (b.flash >> 1) % 2 === 0;
  const C = flash ? BOSS_PAL.flash : b.freed ? BOSS_PAL.free : BOSS_PAL.robo;
  const o = { t: b.t, pulse: beatPulse(beat, 3), mir: b.dir > 0, robo: !b.freed, cracks: b.cracks, pant: b.pant, throwsLeft: b.throwsLeft, party: b.state === 'party' };
  const sx = P.shake ? (Math.random() - 0.5) * P.shake * 2 : 0;
  contactShadow(g, b.x - b.dir * (P.hipX - 2), b.y, P.kneel ? 20 : 19 + Math.abs(P.fN[0] - P.fF[0]) * 0.3, 1.1);
  g.save(); g.translate(b.x + sx, b.y); if (b.dir > 0) g.scale(-1, 1);
  const R = drawBossRig(g, P, C, o);
  if (P.stars) for (let i = 0; i < 3; i++) { const a = b.t * 5 + i * 2.09; star(g, R.head[0] + Math.cos(a) * 7.5, R.head[1] - 8 + Math.sin(a) * 1.8, 1.5, '#ffd23f'); }
  if (P.sweat && !flash) { const s = (b.t * 1.4) % 1; g.fillStyle = 'rgba(160,220,255,0.9)'; g.beginPath(); g.moveTo(R.head[0] + 5.5, R.head[1] - 2 + s * 4); g.quadraticCurveTo(R.head[0] + 6.6, R.head[1] + 0.2 + s * 4, R.head[0] + 5.5, R.head[1] + 0.8 + s * 4); g.quadraticCurveTo(R.head[0] + 4.4, R.head[1] + 0.2 + s * 4, R.head[0] + 5.5, R.head[1] - 2 + s * 4); g.fill(); }
  g.restore();
}

// ------------------------------------------------------------------ caixas de som (as que ele arremessa, a esteira e o paredão)
function drawSpeakerBox(g, w, h, kind, robo, t, pulse, flash) {
  rr(g, -w / 2, -h / 2, w, h, 1.3); fillStroke(g, flash ? '#ffffff' : vgrad(g, -h / 2, h / 2, [[0, '#3a3843'], [1, '#17161c']]), 0.75);
  g.fillStyle = '#b9bfca'; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.moveTo(sx * w / 2, sy * h / 2); g.lineTo(sx * (w / 2 - 2.4), sy * h / 2); g.lineTo(sx * w / 2, sy * (h / 2 - 2.4)); g.closePath(); g.fill(); }
  const led = robo ? RED : '#b6ff3b', s = 1 + 0.08 * pulse;
  if (kind === 2) {   // subwoofer: um cone grande
    ell(g, 0, 0.3, h * 0.38 * s, h * 0.38 * s); fillStroke(g, '#25252e', 0.5);
    g.strokeStyle = led; g.lineWidth = 0.45; ell(g, 0, 0.3, h * 0.42, h * 0.42); g.stroke();
    ell(g, 0, 0.3, h * 0.13, h * 0.13); g.fillStyle = '#45444f'; g.fill();
  } else {
    ell(g, 0, h * 0.13, h * 0.29 * s, h * 0.29 * s); fillStroke(g, '#25252e', 0.5);
    g.strokeStyle = led; g.lineWidth = 0.4; ell(g, 0, h * 0.13, h * 0.33, h * 0.33); g.stroke();
    ell(g, 0, h * 0.13, h * 0.1, h * 0.1); g.fillStyle = '#45444f'; g.fill();
    ell(g, 0, -h * 0.3, h * 0.1, h * 0.1); fillStroke(g, '#2e2d36', 0.35);
  }
  g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(-w / 2 + 1, -h / 2 + 0.8, w - 2, 0.7);
  g.fillStyle = led; ell(g, w / 2 - 1.8, -h / 2 + 1.6, 0.45, 0.45); g.fill();
  if (!flash) emitL(g, 0, kind === 2 ? 0.3 : h * 0.13, 7 + pulse * 3, led, robo ? 0.5 : 0.35);
}
function drawBossBoxes(g, beat) {
  const pulse = beatPulse(beat, 3);
  for (const bx of bossBoxes) {
    // sombra no chão e alvo de onde ela vai cair (aviso)
    const gy = groundBelow(bx.x, bx.y), hgt = gy != null ? gy - (bx.y + bx.h / 2) : 99;
    if (gy != null && hgt < 150) contactShadow(g, bx.x, gy, 8 * (1 - hgt / 220), Math.max(0.25, 1 - hgt / 150));
    if (bx.tx != null) { const ty = groundBelow(bx.tx, bx.y); if (ty != null) { const a = 0.35 + 0.3 * Math.sin(bx.t * 0.5); g.strokeStyle = `rgba(255,42,74,${a})`; g.lineWidth = 0.7; g.setLineDash([1.6, 1.4]); ell(g, bx.tx, ty + 0.2, 8, 2); g.stroke(); g.setLineDash([]); } }
    // onda de som saindo da caixa (ela toca o Batidão enquanto voa)
    const r = 8 + (bx.t % 14) * 0.9; g.strokeStyle = `rgba(255,42,74,${0.35 * (1 - (bx.t % 14) / 14)})`; g.lineWidth = 0.6; g.beginPath(); g.arc(bx.x, bx.y, r, 0, Math.PI * 2); g.stroke();
    g.save(); g.translate(bx.x, bx.y); g.rotate(bx.rot); drawSpeakerBox(g, 14, 12, bx.kind, true, bx.t / 60, pulse, false); g.restore();
    if (bx.y < cam.y + 6) {   // fora da tela, lá em cima: seta vermelha na borda
      const y = cam.y + 4; g.fillStyle = RED; g.beginPath(); g.moveTo(bx.x - 3, y); g.lineTo(bx.x + 3, y); g.lineTo(bx.x, y + 4); g.closePath(); g.fill(); emit(bx.x, y + 1.5, 6, RED, 0.7);
    }
  }
}
function drawSpeakerStack(g, beat) {
  const x0 = STACK.x0, w = STACK.w, rail = STACK.rail, pulse = beatPulse(beat, 3), free = boss && boss.freed, led = free ? '#b6ff3b' : RED;
  g.save();
  // duas fileiras de gabinetes grandes
  for (const [y, h] of [[164, 28], [rail + 1, 23]]) for (let k = 0; k < 2; k++) {
    const x = x0 + k * 32;
    rr(g, x, y, 32, h, 1.6); fillStroke(g, vgrad(g, y, y + h, [[0, '#2c2a33'], [1, '#141318']]), 0.75);
    g.fillStyle = '#b9bfca'; for (const [cx, cy] of [[x + 1.5, y + 1.5], [x + 30.5, y + 1.5], [x + 1.5, y + h - 1.5], [x + 30.5, y + h - 1.5]]) { ell(g, cx, cy, 0.9, 0.9); g.fill(); }
    const n = h > 25 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const cx = x + (n === 2 ? 9 + i * 14 : 16), cy = y + h / 2, rcone = (n === 2 ? 5.6 : 7.4) * (1 + 0.06 * pulse);
      ell(g, cx, cy, rcone, rcone); fillStroke(g, '#24232b', 0.55);
      g.strokeStyle = '#4a4855'; g.lineWidth = 0.5; ell(g, cx, cy, rcone * 0.78, rcone * 0.78); g.stroke();
      ell(g, cx, cy, rcone * 0.28, rcone * 0.28); g.fillStyle = '#3e3d48'; g.fill();
      g.strokeStyle = rgba(led, 0.6); g.lineWidth = 0.35; ell(g, cx, cy, rcone + 0.6, rcone + 0.6); g.stroke();
    }
  }
  // painel de LED no meio
  rr(g, x0 + 18, rail + 4.4, 28, 6.4, 1); fillStroke(g, '#0d0c11', 0.5);
  g.fillStyle = led; g.font = `800 4.2px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(free ? 'SOM LIVRE' : 'BATIDÃO.EXE', x0 + 32, rail + 7.8);
  emit(x0 + 32, rail + 7.6, 16, led, 0.35 + 0.25 * pulse);
  // esteira no topo (alimenta o chefe com caixas)
  g.fillStyle = '#4a4e5a'; g.fillRect(x0 - 2, rail - 1.6, w + 4, 2.6);
  g.strokeStyle = OUT; g.lineWidth = 0.5; g.strokeRect(x0 - 2, rail - 1.6, w + 4, 2.6);
  const roll = boss ? -boss.feedX * 0.5 : 0;
  for (let x = x0; x <= x0 + w; x += 4) { ell(g, x, rail - 0.3, 0.9, 0.9); g.fillStyle = '#9aa0ad'; g.fill(); g.strokeStyle = '#2a2c34'; g.lineWidth = 0.25; g.beginPath(); g.moveTo(x, rail - 0.3); g.lineTo(x + Math.cos(roll + x) * 0.9, rail - 0.3 + Math.sin(roll + x) * 0.9); g.stroke(); }
  if (boss) {
    g.save(); g.beginPath(); g.rect(x0 - 4, rail - 30, w + 1, 30); g.clip();
    for (let i = 0; i < boss.feedN; i++) { g.save(); g.translate(x0 + STACK.slot / 2 + i * STACK.slot + boss.feedX, rail - 7.6); drawSpeakerBox(g, 14, 12, clamp(3 - boss.feedN + i, 0, 2), !free, 0, pulse, false); g.restore(); }
    g.restore();
  }
  // boca da esteira (as caixas saem de dentro do paredão)
  rr(g, x0 + w - 3, rail - 15, 6, 14, 1); fillStroke(g, '#1a1920', 0.6);
  g.fillStyle = '#0a090d'; g.fillRect(x0 + w - 2, rail - 13.6, 4, 11.4);
  g.strokeStyle = '#3a3844'; g.lineWidth = 0.6; for (let y = rail - 13; y < rail - 2; y += 2.2) { g.beginPath(); g.moveTo(x0 + w - 2, y); g.lineTo(x0 + w + 2, y + 0.6); g.stroke(); }
  g.fillStyle = led; ell(g, x0 + w, rail - 16.4, 0.8, 0.8); g.fill(); emit(x0 + w, rail - 16.4, 5, led, 0.6 + 0.4 * pulse);
  g.restore();
}
// --- parede do backstage com porta de enrolar (o chefe abre quando é libertado)
function drawGate(g, t, beat) {
  const x0 = GATE.x0 - 3, x1 = GATE.x1 + 3, w = x1 - x0, b = boss, gl = b ? b.gateLift : 0, open = b && b.freed;
  g.save();
  g.fillStyle = vgrad(g, -40, 192, [[0, '#120e18'], [1, '#231c2c']]); g.fillRect(x0, -40, w, 232);
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 0.6; for (let x = x0 + 3; x < x1; x += 4) { g.beginPath(); g.moveTo(x, -40); g.lineTo(x, GATE.top - 10); g.stroke(); }
  g.strokeStyle = OUT; g.lineWidth = 0.9; g.strokeRect(x0, -40, w, 232);
  // vão da porta
  const dy = 192 - GATE.lift * gl;
  g.fillStyle = open ? vgrad(g, GATE.top, 192, [[0, '#3a2440'], [1, '#6b3a4a']]) : '#0b0910';
  g.fillRect(GATE.x0, GATE.top, GATE.x1 - GATE.x0, 192 - GATE.top);
  if (open && gl > 0.1) emit((GATE.x0 + GATE.x1) / 2, 176, 30, '#ffb36b', 0.35 * gl);
  // porta de aço ondulado
  if (dy > GATE.top + 0.5) {
    g.save(); g.beginPath(); g.rect(GATE.x0, GATE.top, GATE.x1 - GATE.x0, dy - GATE.top); g.clip();
    g.fillStyle = vgrad(g, GATE.top, 192, [[0, '#8a8f9c'], [1, '#5d6272']]); g.fillRect(GATE.x0, GATE.top, GATE.x1 - GATE.x0, dy - GATE.top);
    g.strokeStyle = 'rgba(20,18,28,0.45)'; g.lineWidth = 0.5;
    for (let y = dy - 2; y > GATE.top; y -= 2.8) { g.beginPath(); g.moveTo(GATE.x0, y); g.lineTo(GATE.x1, y); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.16)'; for (let y = dy - 3.2; y > GATE.top; y -= 2.8) g.fillRect(GATE.x0, y, GATE.x1 - GATE.x0, 0.5);
    g.fillStyle = '#1b1922'; g.font = `800 4.8px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('SÓ STAFF', (GATE.x0 + GATE.x1) / 2, dy - 30);
    g.fillStyle = '#ffd23f'; for (let k = 0; k < 6; k++) { g.save(); g.translate(GATE.x0 + 2.7 + k * 5.3, dy - 3); g.rotate(0.5); g.fillRect(-0.9, -2.2, 1.8, 4.4); g.restore(); }   // faixa de atenção
    g.restore();
    g.fillStyle = '#2a2833'; g.fillRect(GATE.x0, dy - 1.2, GATE.x1 - GATE.x0, 1.4);
    rr(g, (GATE.x0 + GATE.x1) / 2 - 3, dy - 5.4, 6, 1.6, 0.6); fillStroke(g, '#c9ced6', 0.4);
  }
  // batentes, caixa do rolo e placa
  for (const x of [GATE.x0 - 1.6, GATE.x1 - 1.2]) { rr(g, x, GATE.top - 4, 2.8, 196 - GATE.top, 0.6); fillStroke(g, '#4a4e5a', 0.5); }
  rr(g, GATE.x0 - 3, GATE.top - 8.5, GATE.x1 - GATE.x0 + 6, 7.4, 1.2); fillStroke(g, vgrad(g, GATE.top - 8.5, GATE.top - 1, [[0, '#6c717e'], [1, '#3e424e']]), 0.6);
  rr(g, x0 + 2, GATE.top - 25, w - 4, 11, 1.2); fillStroke(g, '#ece6d8', 0.6);
  g.fillStyle = '#16131d'; g.font = `800 5.6px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BACKSTAGE', (x0 + x1) / 2, GATE.top - 19.2);
  // trava da IA: vermelha fechada, verde-limão aberta
  const lc = open ? '#b6ff3b' : RED;
  rr(g, GATE.x1 - 5.6, GATE.top + 22, 4.4, 6.2, 0.8); fillStroke(g, '#1d1c24', 0.45);
  ell(g, GATE.x1 - 3.4, GATE.top + 24.4, 1.1, 1.1); g.fillStyle = lc; g.fill();
  if (dy > GATE.top + 24) emit(GATE.x1 - 3.4, GATE.top + 24.4, 6, lc, 0.8 + 0.2 * Math.sin(t * 6));
  // treliça subindo pelo lado esquerdo
  g.strokeStyle = '#7a7f8c'; g.lineWidth = 0.6; g.beginPath();
  for (let y = -40; y < 192; y += 6) { g.moveTo(x0 - 3.2, y); g.lineTo(x0 + 0.2, y + 6); g.moveTo(x0 + 0.2, y); g.lineTo(x0 - 3.2, y + 6); }
  g.moveTo(x0 - 3.2, -40); g.lineTo(x0 - 3.2, 192); g.moveTo(x0 + 0.2, -40); g.lineTo(x0 + 0.2, 192); g.stroke();
  g.restore();
}

// ------------------------------------------------------------------ HUD do chefe (barra embaixo, no centro, e cartão de apresentação)
function drawBossHUD(u, pad) {
  const b = boss; if (!b || !b.active || G.state !== 'play') return;
  let a = 1; if (b.defeated) a = b.state === 'hit' ? 1 : b.state === 'defeat' ? clamp(1 - (b.st - 70) / 40, 0, 1) : 0;
  if (b.state === 'intro') a = clamp(b.st / 20, 0, 1);
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const w = Math.min(330 * u, W * 0.44), h = 54 * u, x = W / 2 - w / 2, y = H - h - (touchUI ? 18 : 12) * u;   // embaixo, na calçada: o céu fica livre para ver as caixas
  rr(ctx, x, y, w, h, 12 * u); ctx.fillStyle = 'rgba(14,10,24,0.74)'; ctx.fill();
  const tired = b.state === 'tired';
  ctx.strokeStyle = b.defeated ? '#ffd23f' : tired ? '#b6ff3b' : 'rgba(255,42,74,0.75)'; ctx.lineWidth = 2 * u; ctx.stroke();
  uiText('PAREDÃO', x + 14 * u, y + 17 * u, 22 * u, b.defeated ? '#ffd23f' : '#ff3b5c', 'left', 400, FONT_HAND);
  // vida: 3 cones de alto-falante (o que já levou golpe fica rachado)
  for (let i = 0; i < 3; i++) {
    const cx = x + w - 18 * u - (2 - i) * 24 * u, cy = y + 17 * u, on = i < b.hp;
    ctx.beginPath(); ctx.arc(cx, cy, 8.5 * u, 0, Math.PI * 2); ctx.fillStyle = on ? '#2a2830' : '#15131a'; ctx.fill();
    ctx.lineWidth = 2 * u; ctx.strokeStyle = on ? '#ff3b5c' : '#4a4652'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 3 * u, 0, Math.PI * 2); ctx.fillStyle = on ? '#ff2a4a' : '#3a3742'; ctx.fill();
    if (on) glow(ctx, cx, cy, 14 * u, '#ff2a4a', 0.4);
    else { ctx.strokeStyle = '#8a8496'; ctx.lineWidth = 1.4 * u; ctx.beginPath(); ctx.moveTo(cx - 5 * u, cy - 5 * u); ctx.lineTo(cx + 1 * u, cy); ctx.lineTo(cx - 2 * u, cy + 5 * u); ctx.stroke(); }
  }
  // fôlego: as 3 caixas da rodada (quando acabam, ele cansa)
  const ly = y + 40 * u;
  if (b.defeated) uiText('NOCAUTE!', W / 2, ly, 17 * u, '#ffd23f', 'center', 800);
  else if (tired) { if ((G.frame >> 3) % 2 === 0 || b.st < 20) uiText('CANSADO! BATA AGORA!', W / 2, ly, 17 * u, '#b6ff3b', 'center', 800); }
  else if (b.state === 'hit' || b.state === 'angry') uiText('FICOU BRAVO!', W / 2, ly, 16 * u, '#ff7a1a', 'center', 800);
  else {
    const left = b.state === 'intro' ? 3 : b.throwsLeft - (b.holding || b.state === 'throw' ? 1 : 0);
    uiText('CAIXAS ATÉ CANSAR', x + 14 * u, ly, 13 * u, '#cfc8de', 'left', 600);
    for (let i = 0; i < 3; i++) {
      const bx = x + w - 20 * u - (2 - i) * 22 * u, on = i < left;
      rr(ctx, bx - 8 * u, ly - 6.5 * u, 16 * u, 13 * u, 2.5 * u); ctx.fillStyle = on ? '#2e2c36' : 'rgba(46,44,54,0.25)'; ctx.fill();
      ctx.strokeStyle = on ? '#e3e6ee' : 'rgba(227,230,238,0.25)'; ctx.lineWidth = 1.2 * u; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, ly + 1 * u, 3.6 * u, 0, Math.PI * 2); ctx.strokeStyle = on ? '#ff3b5c' : 'rgba(255,59,92,0.25)'; ctx.stroke();
    }
  }
  ctx.restore();
}
function drawBossCard(u) {   // apresentação do chefe (só na primeira vez)
  const b = boss; if (!b || b.state !== 'intro' || b.introSeen) return;
  const t = b.st, a = clamp(Math.min((t - 6) / 14, (120 - t) / 18), 0, 1); if (a <= 0) return;
  const slide = (1 - easeO(clamp((t - 6) / 20, 0, 1))) * W * 0.25;
  ctx.save(); ctx.globalAlpha = a;
  const y = H * 0.36, bh = 96 * u;
  const gr = ctx.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(255,42,74,0)'); gr.addColorStop(0.2, 'rgba(40,6,16,0.82)'); gr.addColorStop(0.8, 'rgba(40,6,16,0.82)'); gr.addColorStop(1, 'rgba(255,42,74,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, y - bh / 2, W, bh);
  ctx.fillStyle = '#ff2a4a'; ctx.fillRect(0, y - bh / 2, W, 2 * u); ctx.fillRect(0, y + bh / 2 - 2 * u, W, 2 * u);
  ctx.save(); ctx.shadowColor = '#ff2a4a'; ctx.shadowBlur = 22 * u; uiText('PAREDÃO', W / 2 - slide, y - 10 * u, 62 * u, '#ff5a72', 'center', 400, FONT_HAND, false); ctx.restore();
  uiText('O SEGURANÇA DA IA · NÃO DEIXA NINGUÉM SUBIR NO PALCO', W / 2 + slide, y + 30 * u, 17 * u, '#ffffff', 'center', 800);
  ctx.restore();
}
