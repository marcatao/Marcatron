'use strict';
// =================================================================== Merlin, o professor de patins (v8)
// Homenagem ao professor de patins do usuário (Anderson "Merlin"), no estilo vetorial do jogo: cabelo comprido e
// cacheado, bandana azul estampada, barba curta, camiseta e calça pretas, patins inline laranja e o gesto de apontar
// com dois dedos. Rig próprio (mais alto e magro que o herói), origem no chão debaixo dele, olhando para +x.
const MP = {
  skin: '#e6aa80', skinL: '#f6c9a2', skinD: '#c4835c',
  hair: '#ae8551', hairL: '#e3c08a', hairD: '#73512e', hairDD: '#4e3520',
  beard: '#7a5636', beardL: '#9b7350',
  band: '#24398a', bandL: '#3f5fc0', bandD: '#16245c', bandDot: '#e8eefc',
  tee: '#1d1b23', teeL: '#34313d', pants: '#25232b', pantsL: '#36333e',
  boot: '#ff5a1f', bootL: '#ff8c4a', bootD: '#b8360f', frame: '#22212a', wheel: '#ece6da', hub: '#ffb347',
};
const MERLIN_H = 37;   // altura (até o topo do cabelo), em unidades: ~1,8x o Gabriel baixinho
function drawMerlinSkate(g, s, wr) {
  for (const wx of [-2.1, -0.7, 0.7, 2.1]) {
    const x = wx * s, y = -0.66 * s, r = 0.66 * s;
    ell(g, x, y, r, r); fillStroke(g, MP.wheel, 0.4);
    ell(g, x, y, r * 0.46, r * 0.46); g.fillStyle = MP.hub; g.fill();
    g.strokeStyle = 'rgba(70,40,10,0.55)'; g.lineWidth = 0.15 * s; g.beginPath(); g.moveTo(x + Math.cos(wr) * r * 0.44, y + Math.sin(wr) * r * 0.44); g.lineTo(x - Math.cos(wr) * r * 0.44, y - Math.sin(wr) * r * 0.44); g.stroke();
  }
  rr(g, -2.75 * s, -1.68 * s, 5.5 * s, 0.8 * s, 0.32 * s); fillStroke(g, MP.frame, 0.45);
  g.beginPath();
  g.moveTo(-2.25 * s, -1.62 * s); g.lineTo(2.3 * s, -1.62 * s);
  g.quadraticCurveTo(2.95 * s, -1.66 * s, 2.8 * s, -2.45 * s); g.quadraticCurveTo(2.5 * s, -3.15 * s, 1.0 * s, -3.25 * s);
  g.lineTo(0.95 * s, -4.3 * s); g.lineTo(-2.0 * s, -4.3 * s); g.quadraticCurveTo(-2.45 * s, -2.9 * s, -2.25 * s, -1.62 * s); g.closePath();
  fillStroke(g, vgrad(g, -4.3 * s, -1.6 * s, [[0, MP.bootL], [0.55, MP.boot], [1, MP.bootD]]), 0.55);
  g.fillStyle = 'rgba(255,255,255,0.28)'; ell(g, 1.8 * s, -2.62 * s, 0.7 * s, 0.3 * s, -0.25); g.fill();
  g.strokeStyle = 'rgba(40,10,0,0.55)'; g.lineWidth = 0.16 * s; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo((0.2 + i * 0.45) * s, (-3.05 + i * 0.12) * s); g.lineTo((0.75 + i * 0.45) * s, (-2.7 + i * 0.12) * s); g.stroke(); }   // cadarço
  rr(g, -2.1 * s, -4.75 * s, 3.2 * s, 1.0 * s, 0.4 * s); fillStroke(g, MP.bootD, 0.45);   // cano
}
// pose: S = { t, mode: idle|point|talk|cheer|wave|skate|air|slide|grind, stride, wheel, vy, talk (0..1 boca), hairDX, hairDY, bob, blink }
function drawMerlin(g, S) {
  g.save();
  const s = 1.05, skH = 4.5 * s, legV = 11.6, torso = 10.2, neck = 1.3, shW = 9.2, waist = 7.4, arm = 9.6, armW = 1.75, legW = 2.7;
  let crouch = 0.05, lean = 0.02, front = [2.0, 0, 0], back = [-1.9, 0, 0], hop = 0;
  const mode = S.mode || 'idle';
  switch (mode) {
    case 'idle': case 'talk': lean = 0.02 + Math.sin(S.t * 1.6) * 0.02; crouch = 0.06 + Math.max(0, Math.sin(S.t * 8.4)) * 0.03; break;
    case 'point': lean = 0.1; crouch = 0.1; front = [2.6, 0, 0]; back = [-2.2, 0, 0]; break;
    case 'cheer': hop = Math.abs(Math.sin(S.t * 7)) * 2.2; crouch = 0.02; front = [1.6, -hop * 0.2, -0.1]; back = [-1.6, -hop * 0.2, 0.1]; break;
    case 'wave': lean = 0.0; crouch = 0.05; break;
    case 'skate': {
      crouch = 0.18; lean = 0.24;
      const L = 9.5, F0 = 2.2, foot = ph => { const c = ((ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (c < Math.PI) return [lerp(F0, -L, smooth(0, 1, c / Math.PI)), 0, 0];
        const u = smooth(0, 1, (c - Math.PI) / Math.PI); return [lerp(-L, F0, u), -Math.sin(u * Math.PI) * 1.8, -0.16 * Math.sin(u * Math.PI)]; };
      front = foot(S.stride || 0); back = foot((S.stride || 0) + Math.PI); break;
    }
    case 'air': crouch = 0.3; lean = 0.12; front = [2.6, -3.4, -0.3]; back = [-2.4, -2.2, -0.12]; break;
    case 'slide': crouch = 0.42; lean = -0.32; front = [11.5, 0, -0.05]; back = [-0.8, 0, 0]; break;
    case 'grind': crouch = 0.38; lean = -0.04; front = [4.0, 0, 0]; back = [-3.8, 0, 0]; break;
  }
  g.translate(0, -hop + (S.bob || 0));
  const hipY = -(skH + legV) + crouch * legV * 1.4;
  const shY = hipY - torso, headY = shY - neck - 4.2;
  const toU = (x, y) => { const c = Math.cos(-lean), sn = Math.sin(-lean), dy = y - hipY; return [x * c - dy * sn, hipY + x * sn + dy * c]; };
  // ----- pernas
  const legs = {};
  for (const [nm, sx, ft] of [['back', -1, back], ['front', 1, front]]) {
    const hx = sx * 1.2, ax = ft[0] + 0.2, ay = ft[1] - skH + 0.4;
    const [kx, ky] = ik(hx, hipY, ax, ay, legV + 0.8, 1);
    legs[nm] = { hx, kx, ky, ax, ay, fx: ft[0], fy: ft[1], fr: ft[2] };
  }
  const drawLeg = (L, dark) => {
    limb(g, [L.hx, hipY, L.kx, L.ky, L.ax, L.ay], legW, dark ? '#1c1a21' : MP.pants);
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(L.hx + 0.5, hipY + 0.5); g.lineTo(L.kx + 0.5, L.ky); g.stroke();
    g.save(); g.translate(L.fx, L.fy); g.rotate(L.fr); drawMerlinSkate(g, s, S.wheel || 0); g.restore();
  };
  // ----- braços: alvos no referencial do tronco
  const arms = {}, shx = shW * 0.36;
  for (const [nm, sx] of [['back', -1], ['front', 1]]) {
    const sxp = sx * shx * 0.75, syp = shY + 1.3;
    let hx, hy, a = null;
    switch (mode) {
      case 'point': if (nm === 'front') { hx = sxp + arm * 0.96; hy = syp - 1.4; } else { hx = -waist * 0.5 - 0.6; hy = hipY - 0.4; } break;   // aponta para o aluno; a outra mão na cintura
      case 'talk': if (nm === 'front') { hx = sxp + arm * 0.62; hy = syp + 3.2 + Math.sin(S.t * 6) * 0.9; } else a = Math.PI / 2 + 0.15; break;
      case 'cheer': a = sx > 0 ? -1.25 + Math.sin(S.t * 14) * 0.1 : -1.95 + Math.sin(S.t * 14 + 1) * 0.1; break;
      case 'wave': if (nm === 'front') { hx = sxp + 2.2 + Math.sin(S.t * 10) * 1.8; hy = syp - arm * 0.88; } else a = Math.PI / 2 + 0.12; break;
      case 'skate': a = Math.PI / 2 - Math.sin((S.stride || 0) + (sx > 0 ? Math.PI : 0)) * 1.1; break;
      case 'air': a = sx > 0 ? -0.6 : -2.5; break;
      case 'slide': if (nm === 'back') [hx, hy] = toU(-8.5, -1.2); else a = -0.25; break;
      case 'grind': a = sx > 0 ? -0.35 : -2.75; break;
      default: a = Math.PI / 2 - sx * 0.18 + Math.sin(S.t * 2 + sx) * 0.04;
    }
    if (a != null) { hx = sxp + Math.cos(a) * arm; hy = syp + Math.sin(a) * arm; }
    const d = Math.hypot(hx - sxp, hy - syp); if (d > arm) { hx = sxp + (hx - sxp) / d * arm; hy = syp + (hy - syp) / d * arm; }
    const [ex, ey] = ik(sxp, syp, hx, hy, arm + 0.4, nm === 'front' && mode === 'point' ? 1 : -1);
    arms[nm] = { sx: sxp, sy: syp, ex, ey, hx, hy, nm };
  }
  const drawArm = A => {
    // manga curta preta até o meio do braço, depois pele
    const mx = lerp(A.sx, A.ex, 0.55), my = lerp(A.sy, A.ey, 0.55);
    limb(g, [A.sx, A.sy, A.ex, A.ey, A.hx, A.hy], armW, MP.skin);
    limb(g, [A.sx, A.sy, mx, my], armW + 1.0, MP.tee);
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(A.sx + 0.3, A.sy - 0.2); g.lineTo(mx + 0.2, my - 0.4); g.stroke();
    // mão: apontando com dois dedos (o "V" da foto) ou fechada
    const ang = Math.atan2(A.hy - A.ey, A.hx - A.ex);
    g.save(); g.translate(A.hx, A.hy); g.rotate(ang);
    ell(g, 0, 0, 1.05, 0.95); fillStroke(g, MP.skin, 0.5);
    if (A.nm === 'front' && (mode === 'point' || mode === 'cheer' || mode === 'talk')) {
      for (const [dy, len, rot] of [[-0.5, 2.5, -0.3], [0.32, 2.35, 0.14]]) {
        g.save(); g.translate(0.6, dy); g.rotate(rot); rr(g, 0, -0.4, len, 0.8, 0.4); fillStroke(g, MP.skin, 0.4); g.restore();
      }
      ell(g, 0.2, 0.75, 0.55, 0.38, 0.6); fillStroke(g, MP.skinD, 0.3);   // polegar dobrado
    }
    g.fillStyle = 'rgba(255,255,255,0.3)'; ell(g, -0.3, -0.35, 0.4, 0.25); g.fill();
    g.restore();
  };
  // ----- ordem de desenho: cabelo de trás, braço de trás, perna de trás, tronco, perna da frente, cabeça, braço da frente
  const upperT = fn => { g.save(); g.translate(0, hipY); g.rotate(lean); g.translate(0, -hipY); fn(); g.restore(); };
  const hx0 = 0.6, hy0 = headY;
  upperT(() => merlinHairBack(g, hx0, hy0, S));
  upperT(() => drawArm(arms.back));
  drawLeg(legs.back, true);
  upperT(() => {
    // camiseta preta
    g.beginPath(); g.moveTo(-shW * 0.5, shY + 1.0);
    g.quadraticCurveTo(-waist * 0.62, (shY + hipY) / 2, -waist * 0.5, hipY + 1.2);
    g.lineTo(waist * 0.5, hipY + 1.2);
    g.quadraticCurveTo(waist * 0.62, (shY + hipY) / 2, shW * 0.5, shY + 1.0);
    g.quadraticCurveTo(0, shY - 1.0, -shW * 0.5, shY + 1.0); g.closePath();
    fillStroke(g, vgrad(g, shY, hipY + 1, [[0, MP.teeL], [0.35, MP.tee], [1, '#141219']]), 0.75);
    g.save(); g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 0.4;
    for (const [x0, y0, x1, y1] of [[-2.5, shY + 4, -1.2, hipY - 1], [2.4, shY + 5, 1.4, hipY - 1.5]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 0.6, (y0 + y1) / 2, x1, y1); g.stroke(); }
    g.restore();
    // golinha e o logo branco no peito (uma rodinha estilizada, genérica)
    g.strokeStyle = '#0f0e13'; g.lineWidth = 0.55; g.beginPath(); g.moveTo(-1.6, shY + 0.15); g.quadraticCurveTo(0.6, shY + 1.5, 2.2, shY + 0.1); g.stroke();
    const lx = shW * 0.18, ly = shY + 3.4;
    g.strokeStyle = '#f2f0ea'; g.lineWidth = 0.32; ell(g, lx, ly, 1.05, 1.05); g.stroke(); ell(g, lx, ly, 0.38, 0.38); g.fillStyle = '#f2f0ea'; g.fill();
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; g.beginPath(); g.moveTo(lx + Math.cos(a) * 0.4, ly + Math.sin(a) * 0.4); g.lineTo(lx + Math.cos(a) * 1.0, ly + Math.sin(a) * 1.0); g.stroke(); }
    // cós da calça
    g.fillStyle = '#121117'; g.fillRect(-waist * 0.5, hipY + 0.2, waist, 1.0);
  });
  drawLeg(legs.front, false);
  upperT(() => { merlinHead(g, hx0, hy0, S); drawArm(arms.front); });
  g.restore();
}
// cabelo cacheado comprido: massa de trás (cai até os ombros) — desenhada antes do corpo
function merlinHairBack(g, hx, hy, S) {
  const dx = S.hairDX || 0, dy = S.hairDY || 0;
  // em cima a bandana segura o volume; atrás os cachos caem compridos até as costas
  const blobs = [
    [-2.2, -5.3, 2.0], [0.2, -5.9, 2.05], [2.4, -5.3, 1.75], [3.9, -3.9, 1.4],
    [-4.4, -3.6, 2.3], [-5.4, -1.0, 2.4], [-5.6, 1.8, 2.4], [-5.3, 4.6, 2.3], [-4.6, 7.2, 2.2],
    [-3.4, 9.4, 2.0], [-5.7, 8.6, 1.8], [-2.1, 10.9, 1.6], [-4.4, 11.3, 1.55], [-6.4, 5.6, 1.6],
  ];
  const sway = (bx, by) => [hx + bx + dx * Math.max(0, by + 4) / 12, hy + by + dy * 0.3];
  // contorno escuro (todas as bolinhas juntas) e depois o miolo em camadas
  g.fillStyle = OUT; for (const [bx, by, r] of blobs) { const [x, y] = sway(bx, by); ell(g, x, y, r + 0.55, r + 0.55); g.fill(); }
  for (const [bx, by, r] of blobs) { const [x, y] = sway(bx, by); ell(g, x, y, r, r); g.fillStyle = MP.hairD; g.fill(); }
  for (const [bx, by, r] of blobs) { const [x, y] = sway(bx, by); ell(g, x - r * 0.15, y - r * 0.2, r * 0.82, r * 0.78); g.fillStyle = MP.hair; g.fill(); }
  // cachinhos: arcos claros
  g.strokeStyle = MP.hairL; g.lineWidth = 0.4; g.lineCap = 'round';
  for (const [bx, by, r] of blobs) { const [x, y] = sway(bx, by); g.beginPath(); g.arc(x - r * 0.2, y - r * 0.15, r * 0.45, Math.PI * 0.95, Math.PI * 1.75); g.stroke(); }
  g.strokeStyle = MP.hairDD; g.lineWidth = 0.3;
  for (const [bx, by, r] of blobs) { const [x, y] = sway(bx, by); g.beginPath(); g.arc(x + r * 0.25, y + r * 0.3, r * 0.4, Math.PI * 0.05, Math.PI * 0.7); g.stroke(); }
}
function merlinHead(g, hx, hy, S) {
  const rx = 3.9, ry = 4.5, dx = S.hairDX || 0;
  // pescoço
  rr(g, hx - 1.5, hy + ry * 0.55, 2.8, 3.0, 0.8); fillStroke(g, MP.skinD, 0.5);
  // rosto (oval um pouco comprido, de adulto)
  ell(g, hx, hy, rx, ry);
  const sk = g.createRadialGradient(hx + rx * 0.35, hy - ry * 0.3, 0.4, hx, hy, rx * 1.2); sk.addColorStop(0, MP.skinL); sk.addColorStop(0.6, MP.skin); sk.addColorStop(1, MP.skinD);
  fillStroke(g, sk, 0.75);
  // orelha (atrás, meio escondida pelo cabelo)
  ell(g, hx - rx * 0.62, hy + 0.5, 0.9, 1.25); fillStroke(g, MP.skinD, 0.4);
  // barba curta na mandíbula e no queixo, com bigode
  g.beginPath();
  g.moveTo(hx - rx * 0.45, hy + ry * 0.05);
  g.quadraticCurveTo(hx - rx * 0.55, hy + ry * 0.62, hx - rx * 0.2, hy + ry * 0.92);
  g.quadraticCurveTo(hx + rx * 0.3, hy + ry * 1.12, hx + rx * 0.78, hy + ry * 0.86);
  g.quadraticCurveTo(hx + rx * 1.0, hy + ry * 0.6, hx + rx * 0.96, hy + ry * 0.36);
  g.quadraticCurveTo(hx + rx * 0.72, hy + ry * 0.36, hx + rx * 0.55, hy + ry * 0.3);   // bigode
  g.quadraticCurveTo(hx + rx * 0.2, hy + ry * 0.34, hx + rx * 0.05, hy + ry * 0.5);
  g.quadraticCurveTo(hx - rx * 0.12, hy + ry * 0.3, hx - rx * 0.22, hy + ry * 0.05);
  g.closePath();
  fillStroke(g, vgrad(g, hy, hy + ry * 1.1, [[0, MP.beardL], [1, MP.beard]]), 0.5);
  g.save(); g.clip(); g.strokeStyle = 'rgba(40,24,12,0.45)'; g.lineWidth = 0.18; g.beginPath();
  for (let i = 0; i < 9; i++) { const x = hx - rx * 0.4 + i * rx * 0.16, y = hy + ry * (0.55 + (i % 3) * 0.12); g.moveTo(x, y); g.lineTo(x + 0.2, y + 0.55); }
  g.stroke(); g.restore();
  // boca: sorrisão com os dentes de cima (como na foto)
  const mx = hx + rx * 0.5, my = hy + ry * 0.58, open = 0.55 + (S.talk || 0) * 0.45;
  g.beginPath(); g.moveTo(mx - 1.25, my - 0.1); g.quadraticCurveTo(mx, my + 1.25 * open + 0.2, mx + 1.35, my - 0.3); g.quadraticCurveTo(mx, my + 0.15, mx - 1.25, my - 0.1); g.closePath();
  g.fillStyle = '#5a1420'; g.fill(); g.strokeStyle = '#3a0c14'; g.lineWidth = 0.3; g.stroke();
  g.save(); g.clip(); g.fillStyle = '#fbf7ef'; g.fillRect(mx - 1.4, my - 0.4, 2.8, 0.62); g.fillStyle = '#e46a7a'; ell(g, mx + 0.1, my + 1.0 * open, 0.75, 0.32); g.fill(); g.restore();
  // nariz
  g.strokeStyle = MP.skinD; g.lineWidth = 0.42; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx + rx * 0.82, hy - ry * 0.05); g.quadraticCurveTo(hx + rx * 1.06, hy + ry * 0.2, hx + rx * 0.84, hy + ry * 0.26); g.stroke();
  // olhos sorrindo e sobrancelhas
  const ey = hy - ry * 0.1, e1 = hx + rx * 0.08, e2 = hx + rx * 0.62;
  for (const ex of [e1, e2]) {
    if (S.blink) { g.strokeStyle = OUT; g.lineWidth = 0.42; g.beginPath(); g.moveTo(ex - 0.7, ey); g.quadraticCurveTo(ex, ey - 0.4, ex + 0.7, ey); g.stroke(); continue; }
    ell(g, ex, ey, 0.82, 0.78); g.fillStyle = '#fff'; g.fill();
    ell(g, ex + 0.22, ey + 0.05, 0.5, 0.56); g.fillStyle = '#3b2616'; g.fill();
    g.fillStyle = '#fff'; ell(g, ex + 0.38, ey - 0.16, 0.16, 0.16); g.fill();
    g.strokeStyle = MP.skinD; g.lineWidth = 0.32; g.beginPath(); g.moveTo(ex - 0.8, ey + 0.55); g.quadraticCurveTo(ex, ey + 0.95, ex + 0.85, ey + 0.5); g.stroke();   // bochecha sorrindo
    g.strokeStyle = OUT; g.lineWidth = 0.28; g.beginPath(); g.moveTo(ex - 0.85, ey - 0.25); g.quadraticCurveTo(ex, ey - 0.95, ex + 0.85, ey - 0.3); g.stroke();
  }
  g.strokeStyle = MP.hairD; g.lineWidth = 0.6; g.beginPath(); g.moveTo(e1 - 0.9, ey - 1.45); g.quadraticCurveTo(e1, ey - 1.9, e1 + 0.9, ey - 1.55); g.moveTo(e2 - 0.8, ey - 1.6); g.quadraticCurveTo(e2 + 0.1, ey - 2.0, e2 + 1.0, ey - 1.55); g.stroke();
  // franja/cachos da frente saindo por baixo da bandana e caindo do lado do rosto
  const curls = [[-2.6, -2.2, 1.45], [-3.5, 0.2, 1.4], [-3.2, 2.6, 1.3], [-3.1, 4.5, 1.15], [-2.4, 6.0, 0.9], [-0.6, -3.4, 1.3], [1.4, -3.5, 1.2], [3.2, -2.9, 1.0]];
  for (const [bx, by, r] of curls) { ell(g, hx + bx + dx * 0.15, hy + by, r + 0.45, r + 0.45); g.fillStyle = OUT; g.fill(); }
  for (const [bx, by, r] of curls) { ell(g, hx + bx + dx * 0.15, hy + by, r, r); g.fillStyle = MP.hair; g.fill(); }
  g.strokeStyle = MP.hairL; g.lineWidth = 0.35; for (const [bx, by, r] of curls) { g.beginPath(); g.arc(hx + bx + dx * 0.15 - r * 0.15, hy + by - r * 0.1, r * 0.5, Math.PI, Math.PI * 1.8); g.stroke(); }
  // bandana azul estampada amarrada na testa, com o nó e as pontas atrás
  const bY = hy - ry * 0.62;
  g.beginPath();
  g.moveTo(hx - rx * 1.15, bY + 0.9); g.quadraticCurveTo(hx, bY - 2.6, hx + rx * 1.02, bY - 0.2);
  g.lineTo(hx + rx * 1.0, bY + 1.7); g.quadraticCurveTo(hx, bY - 0.6, hx - rx * 1.12, bY + 2.9); g.closePath();
  fillStroke(g, vgrad(g, bY - 2, bY + 3, [[0, MP.bandL], [0.6, MP.band], [1, MP.bandD]]), 0.6);
  g.save(); g.clip();
  g.fillStyle = MP.bandDot; for (let i = 0; i < 9; i++) { const x = hx - rx + i * rx * 0.24, y = bY + 0.3 - Math.sin((i / 8) * Math.PI) * 1.6 + (i % 2) * 0.7; ell(g, x, y, 0.28, 0.2, 0.5); g.fill(); }
  g.strokeStyle = 'rgba(232,238,252,0.75)'; g.lineWidth = 0.2; for (let i = 0; i < 4; i++) { const x = hx - rx * 0.7 + i * rx * 0.48, y = bY - 0.6 - Math.sin(((i + 0.5) / 4) * Math.PI) * 0.9; g.beginPath(); g.arc(x, y + 0.9, 0.5, Math.PI * 1.1, Math.PI * 2.1); g.stroke(); }   // estampa de gotinhas (paisley)
  g.restore();
  // nó e as duas pontas (balançam)
  const kx = hx - rx * 1.12, ky = bY + 1.7, sw = Math.sin((S.t || 0) * 5) * 0.4 - dx * 0.5;
  g.beginPath(); g.moveTo(kx, ky - 0.4); g.quadraticCurveTo(kx - 2.6, ky + 0.4 + sw, kx - 3.4, ky + 2.4 + sw); g.lineTo(kx - 2.3, ky + 2.6 + sw); g.quadraticCurveTo(kx - 1.6, ky + 1.4, kx, ky + 0.8); g.closePath();
  fillStroke(g, MP.band, 0.45);
  g.beginPath(); g.moveTo(kx, ky); g.quadraticCurveTo(kx - 1.6, ky + 2.2 + sw * 0.6, kx - 1.9, ky + 4.0 + sw * 0.6); g.lineTo(kx - 0.9, ky + 3.8 + sw * 0.6); g.quadraticCurveTo(kx - 0.6, ky + 2.0, kx + 0.4, ky + 0.9); g.closePath();
  fillStroke(g, MP.bandD, 0.45);
  ell(g, kx + 0.1, ky + 0.4, 0.9, 0.75); fillStroke(g, MP.bandL, 0.45);
  // volume do cabelo por cima da bandana
  for (const [bx, by, r] of [[-1.6, -5.7, 1.25], [0.5, -6.1, 1.3], [2.5, -5.3, 1.1]]) { ell(g, hx + bx, hy + by, r + 0.45, r + 0.45); g.fillStyle = OUT; g.fill(); ell(g, hx + bx, hy + by, r, r); g.fillStyle = MP.hair; g.fill(); g.strokeStyle = MP.hairL; g.lineWidth = 0.35; g.beginPath(); g.arc(hx + bx - r * 0.1, hy + by - r * 0.1, r * 0.5, Math.PI, Math.PI * 1.8); g.stroke(); }
}
// balão de fala do Merlin (em coordenadas de mundo): ponta apontando para ele, texto em caixa alta
function drawBubble(g, x, y, lines, opts = {}) {
  // v11: opts.reveal = quantas letras já apareceram (a fala vai sendo escrita); opts.prompt = aviso de continuar no rodapé;
  // opts.pages = [atual, total]. O tamanho do balão é sempre o da fala inteira, para não "pulsar" enquanto escreve.
  const size = opts.size || 5.4, lh = size * 1.25, padX = 4, padY = 3, foot = opts.prompt != null ? lh * 0.95 : 0;
  g.font = `800 ${size}px ${FONT_UI}`;
  const w = Math.max(...lines.map(l => g.measureText(l.replace(/[\[\]]/g, '')).width), opts.prompt ? 70 : 0) + padX * 2, h = lines.length * lh + padY * 2 - (lh - size) + foot;
  let bx = x - w / 2; const by = y - h - 5;
  if (opts.minX != null) bx = Math.max(opts.minX, bx); if (opts.maxX != null) bx = Math.min(opts.maxX - w, bx);
  const tx = clamp(x, bx + 4, bx + w - 4);
  g.save();
  g.fillStyle = 'rgba(10,6,18,0.35)'; g.save(); g.translate(0.8, 1.0); rr(g, bx, by, w, h, 3); g.fill(); g.restore();
  rr(g, bx, by, w, h, 3); fillStroke(g, '#fff8ea', 0.7);
  g.beginPath(); g.moveTo(tx - 2.4, by + h - 0.4); g.lineTo(tx, by + h + 4.6); g.lineTo(tx + 2.4, by + h - 0.4); g.closePath(); fillStroke(g, '#fff8ea', 0.7);
  g.fillStyle = '#fff8ea'; g.fillRect(tx - 2.0, by + h - 1.4, 4.0, 1.2);
  g.textAlign = 'left'; g.textBaseline = 'top';
  let left = opts.reveal != null ? Math.floor(opts.reveal) : Infinity;
  lines.forEach((l, i) => {
    // trechos entre colchetes ficam em laranja (o botão a apertar)
    let cx = bx + padX, yy = by + padY + i * lh;
    for (const part of l.split(/(\[[^\]]+\])/)) {
      if (!part || left <= 0) continue;
      const key = part[0] === '[';
      let txt = key ? part.slice(1, -1) : part;
      if (txt.length > left) txt = txt.slice(0, left);
      left -= txt.length;
      g.fillStyle = key ? '#e2550c' : '#21162e'; g.fillText(txt, cx, yy); cx += g.measureText(txt).width;
    }
  });
  if (foot) {
    const fy = by + h - padY - size * 0.82;
    if (opts.pages && opts.pages[1] > 1) { g.font = `800 ${size * 0.7}px ${FONT_UI}`; g.fillStyle = '#9a8fae'; g.fillText(opts.pages[0] + '/' + opts.pages[1], bx + padX, fy + size * 0.12); }
    if (opts.prompt) {
      g.font = `800 ${size * 0.82}px ${FONT_UI}`; g.textAlign = 'right';
      const parts = opts.prompt.split(/(\[[^\]]+\])/).filter(Boolean); let px = bx + w - padX;
      for (let k = parts.length - 1; k >= 0; k--) { const key = parts[k][0] === '[', t = key ? parts[k].slice(1, -1) : parts[k]; g.fillStyle = key ? '#e2550c' : '#5a4a6e'; g.fillText(t, px, fy); px -= g.measureText(t).width; }
    }
  }
  g.restore();
  return { x: bx, y: by, w, h };
}
