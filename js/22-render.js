'use strict';
// =================================================================== render do mundo, HUD, telas e laço principal
const easeElastic = t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
function drawTiles(pass2) {
  const c0 = Math.max(0, Math.floor(cam.x / TS) - 2), c1 = Math.min(COLS - 1, Math.floor((cam.x + viewW()) / TS) + 1);
  for (let c = c0; c <= c1; c++) for (let r = 0; r < 12; r++) {
    const t = map[r * COLS + c]; if (!t || t === T.GROUND || t === T.GATE) continue;
    const isNote = t === T.NP || t === T.NPEP || t === T.NBAT || t === T.USED;
    if (isNote !== pass2) continue;
    const b = bumps.get(r * COLS + c), oy = b ? -Math.sin((10 - b) / 10 * Math.PI) * 4 : 0;
    if (t === T.AMP) { const h = ampAt.get(c); if (h && r === 12 - h) ctx.drawImage(AMP_SPR[h], c * TS, r * TS, 32, h * TS); continue; }
    let img;
    if (t === T.CASE) img = TILE['case' + ((c * 3 + r) % 4)];
    else if (t === T.BRICK) img = TILE['brick' + ((c * 7 + r * 3) % 6)];
    else if (t === T.PLANK) img = TILE.plank; else if (t === T.STAGE) img = TILE.stage;
    else if (t === T.DECK) img = tileAt(c, r - 1) === T.DECK ? TILE.deck : TILE.deckTop;
    else if (t === T.USED) img = TILE.used; else img = TILE.note;
    ctx.drawImage(img, c * TS, r * TS + oy, TS, TS);
    if (t === T.NP || t === T.NPEP || t === T.NBAT) glow(ctx, c * TS + 8, r * TS + 8 + oy, 11, '#b6ff3b', 0.35 + 0.15 * Math.sin(G.t * 4 + c));
  }
}
// v10: balão de agradecimento dos libertos (surge com um pulinho, some aos poucos)
function drawThanks(vx0, vx1) {
  for (const e of enemies) if (e.freed && !e.gone && e.thankT > 0 && e.x > vx0 - 40 && e.x < vx1 + 40) {
    const age = THANK_T - e.thankT, a = Math.min(1, e.thankT / 25), sc = age < 10 ? 0.6 + 0.4 * Math.sin(age / 10 * Math.PI / 2) * 1.08 : 1;
    const x = e.x + e.w / 2, y = e.y - 2 - Math.min(age, 10) * 0.25;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc);
    drawBubble(ctx, 0, 0, ['OBRIGADO PELO', 'DESPERTAR!'], { size: 4.6 });
    ctx.restore();
  }
}
function drawHeroNow(beat) {
  const h = hero;
  if (h.inv > 0 && !h.dead && (G.frame >> 2) % 2 === 0) return;
  const P = formParams(h.tfFrom, h.form, easeElastic(h.tfT));
  const sp = Math.abs(h.ramp ? h.rs : h.vx), idle = h.onGround && sp < 0.12 && !h.dead && !h.rail && h.slideT === 0;
  const bp = Math.max(0, 1 - (((beat % 1) + 1) % 1) * 3.2);
  // v7: pose de patins (remada, embalo, agachado, ar, grab, grind, powerslide)
  let mode = h.dead ? 'dead' : h.rail ? 'grind' : h.slideT > 0 ? 'slide' : !h.onGround ? (h.trick && h.airT > 6 ? 'grab' : 'air') : h.pushing ? 'stride' : sp > 2.6 ? 'tuck' : sp > 0.25 ? 'coast' : 'idle';
  // v8.1: manobra no ar (mortais giram em volta do meio do corpo; o parafuso "vira" de lado; estrela abre tudo; air guitar)
  const man = !h.dead && h.man ? h.man : null, MT = man ? TRICKS[man.k] : null, mp = man ? Math.min(1, man.t / man.dur) : 0;
  const eio = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  if (man) mode = MT.id === 'back' || MT.id === 'front' ? 'flip' : MT.id === 'star' ? 'star' : 'air';
  else if (h.stunT > 0 && !h.dead) mode = 'tuck';   // tombo
  const S = {
    t: G.t, phase: h.phase, speed: sp, air: !h.onGround && !h.dead, vy: h.vy, sq: h.sq * h.duck, mode, stride: h.stride, wheel: h.wheel,
    lean: 0,
    bob: mode === 'stride' ? -Math.abs(Math.sin(h.stride)) * 0.5 : mode === 'grind' ? Math.sin(G.t * 30) * 0.12 : Math.sin(G.t * 2.4) * 0.12,
    nod: idle ? -bp * 0.7 : 0, tap: idle && bp > 0.4, strum: h.strum > 0 && !(G.state === 'win' && G.winT > 150 && G.winT < 330), strumT: (16 - h.strum) * 0.7, strumGlow: h.strum / 16,
    victory: G.state === 'win' && G.winT > 150 && G.winT < 330, dead: h.dead, hurt: h.inv > 0, blink: h.blink > 0,
    hairDX: h.hairX, hairDY: h.hairY, badge: h.badge, scarf: h.scarf, look: 1, mouth: h.mouth, gsw: Math.sin(h.phase * 2),
  };
  if (man && MT.id === 'guitar') { S.strum = true; S.strumT = man.t * 0.95; S.strumGlow = 0.9; S.mouth = 1; S.vy = -1; }
  if (h.stunT > 0) S.hurt = true;
  { // v9: carisma — o rosto reage ao que acontece; parado, ele olha para o jogador, pisca e faz o sinal do rock (ou joinha)
    const ip = h.idleT - 150, cyc = ip >= 0 ? ip % 330 : -1, armsFree = mode === 'idle' || mode === 'coast' || mode === 'tuck';
    let emo = 'neutral', gest = null, gestA = 0, wink = 0, lookCam = 0, joy = false;
    if (h.dead) emo = 'dead';
    else if (h.stunT > 0 || h.inv > 70) emo = 'hurt';
    else if (G.state === 'win' || G.state === 'results') emo = 'happy';
    else if (man) emo = MT.id === 'guitar' ? 'rock' : 'thrill';
    else if (h.slideT > 0 || h.rail) emo = 'focus';
    else if (G.slomo > 0.3) emo = 'thrill';
    else if (h.cheerT > 0 && armsFree) { emo = 'rock'; gest = 'rock'; gestA = clamp(Math.min((50 - h.cheerT) / 6, h.cheerT / 8), 0, 1); wink = h.cheerT < 40 && h.cheerT > 16 ? 1 : 0; }
    else if (h.happyT > 0) { emo = 'happy'; joy = h.happyT > 26; }
    else if (!h.onGround && h.manDone.length) emo = 'happy';
    else if (bossFighting()) emo = 'focus';
    else if (cyc >= 0 && cyc < 130 && mode === 'idle') {
      lookCam = clamp(cyc / 10, 0, 1) * clamp((130 - cyc) / 10, 0, 1);
      if (cyc >= 40) { gest = Math.floor(ip / 330) % 2 ? 'thumb' : 'rock'; gestA = clamp((cyc - 40) / 8, 0, 1) * clamp((126 - cyc) / 8, 0, 1); emo = gest === 'rock' ? 'rock' : 'happy'; wink = cyc > 52 && cyc < 86 ? 1 : 0; }
      else emo = 'cool';
    }
    else if (sp > 2.2 && h.onGround) emo = 'cool';
    S.emo = emo; S.gest = gest; S.gestA = gestA; S.wink = wink; S.lookCam = lookCam; S.joy = joy;
    if (emo === 'rock' && gest === 'rock') S.mouth = Math.max(S.mouth, 0.75);   // língua de fora no sinal do rock
  }
  const flipRot = !man ? 0 : MT.id === 'back' ? -Math.PI * 2 * eio(mp) : MT.id === 'front' ? Math.PI * 2 * eio(mp) : MT.id === 'star' ? Math.sin(mp * Math.PI * 2) * 0.16 : 0;
  const spinX = man && MT.id === 'spin' ? (c => (c < 0 ? -1 : 1) * Math.max(0.14, Math.abs(c)))(Math.cos(Math.PI * 2 * eio(mp))) : 1;
  // sombra de contato e halo quente atrás (ajudam o herói a destacar do fundo)
  const fx0 = h.x + h.w / 2, fy0 = h.y + h.h;
  if (!h.dead && (h.onGround || h.rail)) { ctx.fillStyle = 'rgba(8,4,16,0.42)'; ell(ctx, fx0, fy0 + 0.4, 7.7 * (P.buff ? 1.3 : 1), 1.6); ctx.fill(); }
  if (!h.dead) glow(ctx, fx0, fy0 - 10, 26, '#ffcf7a', 0.14);
  if (man && flipRot && MT.id !== 'star') {   // rastro do mortal: arco claro atrás da cabeça
    const vh = heroVisH(P), cy = fy0 - vh * 0.48, R = vh * 0.6, dir = h.face * (MT.id === 'back' ? -1 : 1), head = -Math.PI / 2 + h.face * flipRot;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const a1 = head - dir * i * 0.3, a0 = a1 - dir * 0.3; ctx.strokeStyle = `rgba(191,232,255,${0.42 - i * 0.08})`; ctx.lineWidth = 2.4 - i * 0.4; ctx.beginPath(); ctx.arc(fx0, cy, R, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); }
    ctx.restore();
  }
  if (man && MT.id === 'star') {   // estrela dourada atrás dele: lê na hora como "ESTRELA"
    const sc = Math.sin(Math.min(1, mp / 0.25) * Math.PI / 2) * (mp > 0.75 ? 1 - (mp - 0.75) / 0.25 : 1), vh = heroVisH(P), R1 = vh * 0.72 * (0.75 + 0.25 * sc), R0 = R1 * 0.45;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(fx0, fy0 - vh * 0.48); ctx.rotate(mp * 1.2); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? R0 : R1, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, R1); gr.addColorStop(0, 'rgba(255,236,150,0.55)'); gr.addColorStop(1, 'rgba(255,190,60,0.12)');
    ctx.globalAlpha = 0.1 + 0.9 * sc; ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = 'rgba(255,225,120,0.7)'; ctx.lineWidth = 0.5; ctx.stroke(); ctx.restore();
  }
  // o rig é desenhado numa camada à parte para ganhar um contorno de luz (silhueta deslocada em 8 direções)
  const k = WT.k, fx = WT.ox + fx0 * k, fy = WT.oy + fy0 * k, ix = Math.floor(fx), iy = Math.floor(fy);
  const wide = Math.abs(h.ang) > 0.25 || mode === 'slide' || mode === 'grab' || h.dead || !!man || h.stunT > 0;   // camada maior quando ele está inclinado (rampa, manobra)
  const cw = Math.ceil((wide ? 86 : 62) * k), chh = Math.ceil((wide ? 82 : 72) * k), ox0 = Math.round((wide ? 43 : 31) * k), oy0 = Math.round((wide ? 58 : 54) * k);
  if (!HERO_L.c || HERO_L.c.width < cw || HERO_L.c.height < chh) { const W2 = Math.ceil(86 * k), H2 = Math.ceil(82 * k); HERO_L.c = mk(W2, H2); HERO_L.g = HERO_L.c.getContext('2d'); HERO_L.o = mk(W2, H2); HERO_L.og = HERO_L.o.getContext('2d'); }
  const g = HERO_L.g, og = HERO_L.og;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, HERO_L.c.width, HERO_L.c.height);
  g.setTransform(k, 0, 0, k, ox0 + (fx - ix), oy0 + (fy - iy));
  if (h.dead) { g.translate(0, -8); g.rotate(h.deadT * 0.13); g.translate(0, 8); }
  else if (Math.abs(h.ang) > 0.001) g.rotate(h.ang);   // de pé na superfície da rampa
  g.scale(h.face * spinX, 1);
  if (flipRot) { const cy = -heroVisH(P) * 0.48; g.translate(0, cy); g.rotate(flipRot); g.translate(0, -cy); }
  GLOW_DEFER = [];
  drawHeroRig(g, P, S);
  const glows = GLOW_DEFER; GLOW_DEFER = null;
  if ((h.rail || h.loop) && !h.dead) glow(ctx, fx0 - h.face * 2, fy0, 10 + Math.sin(G.t * 40) * 2, '#ffb347', 0.6);   // v11: brasa no ponto de contato do grind
  const r = Math.max(1.4, 0.34 * k);
  og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, HERO_L.o.width, HERO_L.o.height);
  for (const [dx, dy] of RIM_DIRS) og.drawImage(HERO_L.c, 0, 0, cw, chh, dx * r, dy * r, cw, chh);
  og.globalCompositeOperation = 'source-in'; og.fillStyle = HERO_RIM; og.fillRect(0, 0, cw, chh);
  og.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(HERO_L.o, 0, 0, cw, chh, ix - ox0, iy - oy0, cw, chh);
  if (SPD > 0.25 && !h.dead) { const d = -(Math.sign(h.vx) || h.face) * K * 2.4 * SPD; for (let k = 3; k >= 1; k--) { ctx.globalAlpha = 0.26 * SPD * (1 - k / 4); ctx.drawImage(HERO_L.c, 0, 0, cw, chh, ix - ox0 + d * k, iy - oy0, cw, chh); } ctx.globalAlpha = 1; }   // v13: rastro de velocidade
  ctx.drawImage(HERO_L.c, 0, 0, cw, chh, ix - ox0, iy - oy0, cw, chh);
  for (const [gx, gy, gr, ga] of glows) glow(ctx, gx + ix - ox0, gy + iy - oy0, gr, '#b6ff3b', ga);
  ctx.restore();
  if (h.tfT < 1) glow(ctx, h.x + h.w / 2, h.y + h.h / 2, 26 * (1 - h.tfT), h.form === 1 ? '#b6ff3b' : h.form === 2 ? '#ff7a1a' : '#ffffff', 0.8);
}
const HERO_L = { c: null, g: null, o: null, og: null };
const HERO_RIM = 'rgba(255,244,214,0.92)';
const RIM_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // v10: 4 cópias da silhueta em vez de 8 (contorno quase igual, desenho bem mais leve)
function drawParts() {
  for (const p of parts) {
    const a = clamp(p.life / p.max * 2, 0, 1);
    ctx.globalAlpha = a;
    switch (p.kind) {
      case 'note': noteGlyph(ctx, p.x, p.y, p.size, p.col); break;
      case 'spark': ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = p.col; ctx.lineWidth = 0.7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); ctx.stroke(); ctx.restore(); break;
      case 'puff': ctx.fillStyle = rgba(p.col, 0.45); ell(ctx, p.x, p.y, p.size, p.size); ctx.fill(); break;
      case 'smoke': ctx.fillStyle = rgba(p.col, 0.35); ell(ctx, p.x, p.y, p.size * (1 + (1 - p.life / p.max) * 1.5), p.size * (1 + (1 - p.life / p.max) * 1.5)); ctx.fill(); break;
      case 'chunk': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.beginPath(); ctx.moveTo(-p.size, -p.size * 0.6); ctx.lineTo(p.size * 0.8, -p.size); ctx.lineTo(p.size, p.size * 0.7); ctx.lineTo(-p.size * 0.5, p.size); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.35; ctx.stroke(); ctx.restore(); break;
      case 'bolt': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8); ctx.fillRect(-p.size * 0.4, -p.size, p.size * 0.8, p.size * 2); ctx.restore(); break;
      case 'pick': drawWheel(ctx, p.x, p.y, 4, G.t * 10); break;
      case 'sub': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); rr(ctx, -4.9, -3.8, 9.8, 7.6, 1.3); ctx.fillStyle = '#29272f'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.6; ctx.stroke(); ell(ctx, 0, 0.2, 2.9, 2.9); ctx.fillStyle = '#3c3a46'; ctx.fill(); ctx.strokeStyle = '#0e0e13'; ctx.lineWidth = 0.5; ctx.stroke(); ell(ctx, 0, 0.2, 1.1, 1.1); ctx.fillStyle = '#16151a'; ctx.fill(); ctx.restore(); break;
      case 'drop': ctx.fillStyle = p.col; ctx.beginPath(); ctx.moveTo(p.x, p.y - p.size * 1.6); ctx.quadraticCurveTo(p.x + p.size, p.y, p.x, p.y + p.size * 0.8); ctx.quadraticCurveTo(p.x - p.size, p.y, p.x, p.y - p.size * 1.6); ctx.fill(); break;
      case 'cone': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(Math.abs(Math.cos(p.rot * 2)) * 0.8 + 0.2, 1); ell(ctx, 0, 0, 4.2, 4.2); ctx.fillStyle = '#25252e'; ctx.fill(); ctx.strokeStyle = '#5b5e6c'; ctx.lineWidth = 0.7; ctx.stroke(); ell(ctx, 0, 0, 1.4, 1.4); ctx.fillStyle = '#45444f'; ctx.fill(); ctx.restore(); break;
      case 'chip': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = '#d9b44a'; for (let k = -1; k <= 1; k++) { ctx.fillRect(-3.4, k * 1.3 - 0.3, 6.8, 0.6); ctx.fillRect(k * 1.3 - 0.3, -3.4, 0.6, 6.8); } rr(ctx, -2.4, -2.4, 4.8, 4.8, 0.6); ctx.fillStyle = '#2c2d36'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.4; ctx.stroke(); ell(ctx, 0, 0, 0.9, 0.9); ctx.fillStyle = RED; ctx.fill(); ctx.restore(); glow(ctx, p.x, p.y, 6, RED, 0.6); break;
      case 'confetti': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.abs(Math.sin(p.rot * 3)) + 0.2); ctx.fillStyle = p.col; ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size); ctx.restore(); break;
      case 'ring': { const k = 1 - p.life / p.max; ctx.strokeStyle = p.col; ctx.lineWidth = 2 * (1 - k); ell(ctx, p.x, p.y - 1, 6 + k * 60, 2 + k * 9); ctx.stroke(); break; }
      default: ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
}
function drawPops() {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (const p of pops) {
    const a = p.t > 60 ? (80 - p.t) / 20 : 1, s = p.t < 8 ? 0.6 + p.t / 20 : 1;
    ctx.globalAlpha = a; ctx.font = `${(p.big ? 8.4 : 6.2) * s}px ${FONT_HAND}`;
    const hw = ctx.measureText(p.text).width / 2 + 3, x = hw * 2 < viewW() ? clamp(p.x, cam.x + hw, cam.x + viewW() - hw) : cam.x + viewW() / 2;   // nunca sai da tela
    ctx.lineWidth = p.big ? 2.2 : 1.6; ctx.strokeStyle = '#120a1c'; ctx.strokeText(p.text, x, p.y); ctx.fillStyle = p.col; ctx.fillText(p.text, x, p.y);
  }
  ctx.globalAlpha = 1;
}
function mark(n) { if (!PROF.on) return; const t = performance.now(); PROF.acc[n] = (PROF.acc[n] || 0) + t - (PROF.last || t); PROF.last = t; }
function drawWorld() {
  const t = G.t, beat = beatNow();
  emissive = []; if (PROF.on) PROF.last = performance.now();
  drawBackground(t, beat); mark('bg');
  const sh = G.shake > 0 ? Math.min(6, G.shake) * 0.35 : 0;
  const Kz = K * cam.zoom;
  const ox = -Math.round(cam.x * Kz) + Math.round((Math.random() - 0.5) * sh * K), oy = -Math.round(cam.y * Kz) + Math.round((Math.random() - 0.5) * sh * K);
  const vx0 = cam.x, vx1 = cam.x + viewW();
  ctx.setTransform(Kz, 0, 0, Kz, ox, oy); WT = { k: Kz, ox, oy };
  // billboards: ativa quando a frente de cor passa pela posição dele na tela
  for (const b of BILLBOARDS) if (!b.on) { const bx = (b.lx + 52 - cam.x * BB_F * PX) * KB; if ((colorX - cam.x) * Kz > bx) { b.on = true; b.t = 0; } }
  if (vx1 > (STAGE_C - 4) * TS) drawStageBack(ctx, t, G.state === 'win' || G.state === 'results');
  if (vx0 < GRAFFITI.x1 + 20 && vx1 > GRAFFITI.x0 - 20) drawGraffitiWall(ctx, t);
  if (G.state !== 'title') for (const s of signs) { const x = s.c * TS; if (x > vx0 - 60 && x < vx1 + 60) drawSign(ctx, s); }   // na abertura as placas de dica brigavam com o texto
  for (const p of pianos) if (p.x > vx0 - 40 && p.x < vx1 + 8) drawPiano(ctx, p, t);
  if (antenna.x > vx0 - 120 && antenna.x < vx1 + 140) drawAntenna(ctx, antenna, t, beat);
  for (const u of ufos) if (u.kind !== 'flyby') drawUFO(ctx, u, t, 1);
  for (const it of items) if (!it.taken && it.rise > 0) drawFood(ctx, it, t);
  drawLadeiraBack(ctx, vx0, vx1, t);   // v11: ponto de ônibus com os patinadores
  mark('decor'); drawGround(ctx, vx0, vx1); drawSkatepark(ctx, vx0, vx1, t); mark('ground');
  drawTiles(false); drawRails(ctx, vx0, vx1, t); mark('tiles');
  for (const e of enemies) if (!e.gone && !e.freed && e.x > vx0 - 30 && e.x < vx1 + 30) drawEnemy(ctx, e, beat);
  for (const p of projs) drawStatic(ctx, p);
  const arenaOn = vx1 > STACK.x0 - 40 && vx0 < GATE.x1 + 60;
  if (arenaOn) { drawSpeakerStack(ctx, beat); drawGate(ctx, t, beat); }
  if (boss && !boss.freed && boss.x > vx0 - 50 && boss.x < vx1 + 50) drawBoss(ctx, boss, beat);   // robotizado: fica cinza no mundo cinza (só o vermelho da IA brilha)
  mark('enemies');
  desatPass(); mark('desat');
  ctx.setTransform(Kz, 0, 0, Kz, ox, oy);
  // luz das câmeras do Vigia e ondas de choque: cores da IA continuam vivas no mundo cinza
  drawTutorialBack(ctx, t, vx0, vx1);   // v8: cerca da IA e cancela do treino
  for (const e of enemies) if (e.type === 'cat' && !e.freed && !e.gone && e.x > vx0 - 140 && e.x < vx1 + 140) drawCone(ctx, e);
  for (const s of shocks) drawShock(ctx, s);
  if (bossBoxes.length) drawBossBoxes(ctx, beat);
  mark('fg-cones'); flushEmissive(ctx); mark('fg-emis1');
  for (const e of enemies) if (!e.gone && !e.freed && e.x > vx0 - 30 && e.x < vx1 + 30) drawAlertMark(ctx, e);
  mark('fg-alert'); drawTiles(true); mark('fg-tiles');
  for (const e of enemies) if (!e.gone && e.freed && e.x > vx0 - 30 && e.x < vx1 + 30) drawEnemy(ctx, e, beat);
  if (boss && boss.freed && boss.x > vx0 - 50 && boss.x < vx1 + 50) drawBoss(ctx, boss, beat);
  for (const k of coins) if (!k.taken && k.x > vx0 - 10 && k.x < vx1 + 10) { const y = k.y + Math.sin(t * 3 + k.ph) * 1.2; glow(ctx, k.x, y, 9, '#ff8a2a', 0.45); drawWheel(ctx, k.x, y, 4.3, t * 4 + k.ph); }
  for (const d of drops) if (!d.taken) { glow(ctx, d.x, d.y, 9, '#b6ff3b', 0.5); drawWheel(ctx, d.x, d.y, 4.3, t * 5, WHEEL_LIME); }
  for (const it of items) if (!it.taken && it.rise <= 0) drawFood(ctx, it, t);
  if (alien.x > vx0 - 20 && alien.x < vx1 + 20) drawAlien(ctx, alien, t);
  mark('fg-coins'); flushEmissive(ctx); mark('fg-emis2');
  if (G.state !== 'title') drawTutorialFront(ctx, t, vx0, vx1);   // v8: o Merlin (atrás do herói); na abertura ele aparece no primeiro plano
  drawLadeiraFront(ctx, vx0, vx1, t);   // v11: Merlin no topo da ladeira e o trânsito
  if (G.state !== 'title') drawHeroNow(beat); mark('fg-hero');
  for (const w of waves) {   // v7: leque de faíscas saindo do patins (powerslide)
    const a = 1 - w.t / 17;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.lineCap = 'round';
    for (let k = 0; k < 7; k++) {
      const yy = w.y + (k - 3) * 2.3 + Math.sin(w.t * 1.7 + k * 2.1) * 0.9, xx = w.x - w.dir * ((k * 5) % 3) * 2.4;
      ctx.strokeStyle = SPARK_COLS[k % 4]; ctx.lineWidth = 1.15 - (k % 3) * 0.28;
      ctx.beginPath(); ctx.moveTo(w.ox, w.oy); ctx.quadraticCurveTo((w.ox + xx) / 2, Math.min(w.oy, yy) - 2.5 - (k % 2) * 2, xx, yy); ctx.stroke();
    }
    ctx.restore();
    glow(ctx, w.x, w.y, 15, '#ffb347', 0.6 * a); glow(ctx, w.ox, w.oy, 9, '#fff3c4', 0.7 * a);
  }
  mark('fg-actors'); drawParts();
  flushEmissive(ctx);
  drawTutorialBubble(ctx);
  drawThanks(vx0, vx1); drawPops(); mark('parts');
  if (vx1 > (STAGE_C - 1) * TS) drawStageCrowd(ctx, t, beat, G.state === 'win' || G.state === 'results');
  drawForeground(t);
  postFX(t); mark('post');
}

// ---------- HUD e telas
function uiText(s, x, y, size, col, align = 'left', weight = 800, font = FONT_UI, stroke = true) {
  ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.18; ctx.strokeStyle = 'rgba(10,6,18,0.9)'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}
const fmt = t => { if (t == null) return '--:--.--'; const m = Math.floor(t / 60), s = t - m * 60; return String(m).padStart(2, '0') + ':' + s.toFixed(2).padStart(5, '0'); };
function drawVU(x, y, r, v) {
  ctx.save(); ctx.translate(x, y);
  rr(ctx, -r * 1.25, -r * 1.05, r * 2.5, r * 1.35, r * 0.18); ctx.fillStyle = 'rgba(14,10,24,0.72)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.stroke();
  const a0 = Math.PI * 1.17, a1 = Math.PI * 1.83;
  ctx.lineWidth = r * 0.16;
  for (const [s, e, c] of [[0, 0.45, '#b6ff3b'], [0.45, 0.75, '#ffd23f'], [0.75, 1, '#ff3b5c']]) { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(0, 0, r * 0.82, lerp(a0, a1, s), lerp(a0, a1, e)); ctx.stroke(); }
  const jit = Math.sin(G.t * 31) * 0.012 + Math.max(0, 1 - ((beatNow() % 1 + 1) % 1) * 4) * 0.035;
  const ang = lerp(a0, a1, clamp(v + jit, 0, 1));
  ctx.strokeStyle = '#f6f2ff'; ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * r * 0.9, Math.sin(ang) * r * 0.9); ctx.stroke();
  ctx.fillStyle = '#f6f2ff'; ell(ctx, 0, 0, r * 0.09, r * 0.09); ctx.fill();
  uiText(v < 0.3 ? 'CALMO' : v < 0.65 ? 'BANDA' : 'PESADO', 0, r * 0.12, r * 0.3, v < 0.3 ? '#b6ff3b' : v < 0.65 ? '#ffd23f' : '#ff3b5c', 'center', 800, FONT_UI, false);
  ctx.restore();
}
function drawHUD() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const u = H / 540, pad = 18 * u;
  ctx.save(); ctx.setTransform(u * 2.4, 0, 0, u * 2.4, pad + 12 * u, pad + 14 * u); drawWheel(ctx, 0, 0, 4.6, G.t * 2.5); ctx.restore();
  uiText('× ' + String(stats.coins).padStart(2, '0'), pad + 30 * u, pad + 14 * u, 26 * u, '#fff7e8');
  ctx.save(); ctx.setTransform(u * 1.6, 0, 0, u * 1.6, pad + 12 * u, pad + 44 * u + 9 * u); ctx.fillStyle = '#b6ff3b'; noteGlyph(ctx, 0, -3, 1.6, '#b6ff3b'); ctx.restore();
  uiText('LIBERTOS ' + stats.robots + '/' + stats.robotsTotal, pad + 30 * u, pad + 46 * u, 19 * u, '#b6ff3b');
  const fc = hero.form === 1 ? '#b6ff3b' : hero.form === 2 ? '#ff7a1a' : '#e8e2f6';
  ctx.font = `800 ${14 * u}px ${FONT_UI}`; const fw = ctx.measureText(FORMS[hero.form].name).width + 18 * u;
  rr(ctx, pad, pad + 62 * u, fw, 22 * u, 11 * u); ctx.fillStyle = 'rgba(14,10,24,0.7)'; ctx.fill(); ctx.strokeStyle = fc; ctx.lineWidth = 1.5 * u; ctx.stroke();
  uiText(FORMS[hero.form].name, pad + fw / 2, pad + 73 * u, 14 * u, fc, 'center', 800, FONT_UI, false);
  if (etCount() > 0) uiText('ETs ' + etCount() + '/3', pad + fw + 10 * u, pad + 73 * u, 15 * u, '#7fd4ff');
  uiText('PONTOS ' + String(stats.score).padStart(5, '0'), pad, pad + 100 * u, 18 * u, '#ffd23f');   // v8.1: manobras no ar
  if (hero.manDone.length) { const n = hero.manDone.length; uiText('NO AR: ' + hero.manPts + (n > 1 ? ' x' + n + ' = ' + hero.manPts * n : '') + ' · POUSE!', pad, pad + 122 * u, 15 * u, '#7fd4ff'); }
  uiText(fmt(G.timer.t), W - pad, pad + 16 * u, 34 * u, G.timer.on ? '#ffffff' : '#cfc8de', 'right');
  uiText('REC ' + fmt(G.best), W - pad, pad + 44 * u, 16 * u, '#ffd23f', 'right', 600);
  drawVU(W - pad - 46 * u, pad + 96 * u, 34 * u, AU.danger);
  drawBossHUD(u, pad); drawBossCard(u); drawTutorialHUD(u); drawTalkBox(u);
  if (G.state === 'play' && !G.timer.on && !G.timeFrozen && !hero.dead && !(tut && (tut.active || (tut.doneT != null && tut.doneT < 150))) && (G.frame >> 5) % 2 === 0) uiText('O TEMPO COMEÇA QUANDO VOCÊ SE MEXER', W / 2, H * 0.2, 20 * u, '#ffffff', 'center');
  if (G.state === 'play' && G.hintT < 600 && !(tut && tut.active)) {
    ctx.globalAlpha = clamp((600 - G.hintT) / 90, 0, 1) * 0.92;
    uiText(touchUI ? 'DIRECIONAL PATINA · PULAR (SEGURE = MAIS ALTO) · SLIDE = FAÍSCA (NO AR: MANOBRA)' : '← → PATINAR · ESPAÇO PULAR (SEGURE = MAIS ALTO) · X POWERSLIDE (NO AR: MANOBRA)', W / 2, H - (touchUI ? 46 : 26) * u, (touchUI ? 15 : 17) * u, '#f2eefa', 'center', 600);
    ctx.globalAlpha = 1;
  }
  if (G.deathMsg && hero.dead) {
    ctx.fillStyle = 'rgba(10,4,18,0.55)'; ctx.fillRect(0, H * 0.36, W, H * 0.24);
    uiText('ERRO 404', W / 2, H * 0.43, 52 * u, '#ff3b5c', 'center', 800, FONT_HAND);
    uiText('VONTADE DE DESISTIR NÃO ENCONTRADA', W / 2, H * 0.53, 20 * u, '#ffffff', 'center');
  }
  if (AU.ctx && AU.total && AU.loaded < AU.total && G.state !== 'title') uiText('carregando som ' + Math.round(AU.loaded / AU.total * 100) + '%', W / 2, H - 12 * u, 13 * u, '#9a93ad', 'center', 600);
}
// v14: abertura do UHUU ROLLERS — logo grande, o herói e o Merlin patinando, botão de jogar e o top 3 do ranking
function drawTitle() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const u = H / 540, b = Math.max(0, 1 - (((beatNow() % 1) + 1) % 1) * 3), sc = H / cssH;
  const gr = ctx.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(8,4,16,0.93)'); gr.addColorStop(0.5, 'rgba(8,4,16,0.72)'); gr.addColorStop(1, 'rgba(8,4,16,0.25)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  const lx = Math.max(36 * u, W * 0.06), ly = H * 0.22;
  // logo: UHUU (letra de marcador, laranja → rosa) e ROLLERS (condensada, verde-limão) entre duas rodinhas girando
  ctx.save(); ctx.translate(lx, ly); ctx.rotate(-0.06); ctx.scale(1 + b * 0.03, 1 + b * 0.03);
  ctx.font = `400 ${132 * u}px ${FONT_HAND}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const lg = ctx.createLinearGradient(0, -60 * u, 0, 60 * u); lg.addColorStop(0, '#ffd23f'); lg.addColorStop(0.5, '#ff7a1a'); lg.addColorStop(1, '#ff3fa4');
  ctx.lineJoin = 'round'; ctx.lineWidth = 16 * u; ctx.strokeStyle = '#140f1f'; ctx.strokeText('UHUU', 0, 0);
  ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = 30 * u; ctx.fillStyle = lg; ctx.fillText('UHUU', 0, 0); ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillText('UHUU', -2 * u, -3 * u); ctx.fillStyle = lg; ctx.fillText('UHUU', 0, 0);
  const uw = ctx.measureText('UHUU').width;
  ctx.font = `800 ${62 * u}px ${FONT_UI}`; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${6 * u}px`;
  const rw = ctx.measureText('ROLLERS').width, rx = Math.max(30 * u, (uw - rw) / 2 + 20 * u), ry = 92 * u;
  ctx.lineWidth = 10 * u; ctx.strokeText('ROLLERS', rx, ry); ctx.shadowColor = '#b6ff3b'; ctx.shadowBlur = 18 * u; ctx.fillStyle = '#c8ff5a'; ctx.fillText('ROLLERS', rx, ry); ctx.shadowBlur = 0;
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px';
  for (const wx of [rx - 26 * u, rx + rw + 22 * u]) { ctx.save(); ctx.translate(wx, ry); ctx.scale(3.6 * u, 3.6 * u); drawWheel(ctx, 0, 0, 4.6, G.t * 6 * (wx < rx ? 1 : -1), WHEEL_LIME); ctx.restore(); }
  ctx.restore();
  uiText('PATINS, ROCK E LIBERDADE EM SÃO BERNARDO DO CAMPO', lx + 4 * u, H * 0.45, 20 * u, '#ffffff', 'left', 800);
  ['A IA dominou o mundo e plugou um chip em cada ser vivo.', 'Aprenda com o Merlin, desperte humanos e animais e chegue ao palco!']
    .forEach((t, i) => uiText(t, lx + 4 * u, H * 0.51 + i * 24 * u, 18 * u, '#cfc8de', 'left', 600));
  // botão de jogar, pulsando no ritmo
  const bx = lx, by = H * 0.6, bw = 330 * u, bh = 60 * u, pulse = 0.5 + 0.5 * Math.sin(G.t * 4);
  ctx.save(); ctx.shadowColor = '#b6ff3b'; ctx.shadowBlur = (12 + 14 * pulse) * u; rr(ctx, bx, by, bw, bh, 30 * u);
  const bg = ctx.createLinearGradient(0, by, 0, by + bh); bg.addColorStop(0, '#d8ff7a'); bg.addColorStop(1, '#7ccf2a'); ctx.fillStyle = bg; ctx.fill(); ctx.restore();
  rr(ctx, bx, by, bw, bh, 30 * u); ctx.strokeStyle = '#140f1f'; ctx.lineWidth = 3 * u; ctx.stroke();
  uiText('▶  JOGAR', bx + bw / 2, by + bh / 2 - 6 * u, 30 * u, '#140f1f', 'center', 800, FONT_UI, false);
  uiText(touchUI ? 'TOQUE NA TELA' : 'ENTER OU ESPAÇO', bx + bw / 2, by + bh / 2 + 17 * u, 12 * u, '#2a3a10', 'center', 800, FONT_UI, false);
  const nm = store.get(NAME_KEY);
  if (G.nameReset > 0) uiText('BELEZA! O MERLIN VAI PERGUNTAR SEU NOME.', bx + bw + 20 * u, by + bh / 2, 15 * u, '#ffd23f', 'left', 800);
  else if (nm && !touchUI) uiText('PATINADOR: ' + nm.toUpperCase() + '  ·  N: TROCAR', bx + bw + 20 * u, by + bh / 2, 15 * u, '#9a93ad', 'left', 800);
  // v15: ranking top 10 à direita da abertura
  { const rw = clamp(W * 0.33, 280 * u, 380 * u), nm0 = store.get(NAME_KEY); if (!G.result) { RANK.mine = nm0 ? rankKey(nm0) : null; rankFindMine(); }   // destaca o patinador atual
    const ry = 54 * H / cssH + 8 * u; drawRanking(W - rw - 24 * u, ry, rw, Math.min(362 * u, H - ry - 46 * u), u, { title: "TOP 10", max: 10 }); }   // v15: sem os personagens, o ranking ocupa a direita toda
  uiText(touchUI ? 'Direcional patina · PULAR · SLIDE solta faísca (no ar: manobra)' : '← → patinar · Espaço pular · X powerslide (no ar: manobra) · P pausa · M som', lx + 4 * u, H - 22 * u, 15 * u, '#9a93ad', 'left', 600);
  const nx = W - 18 * u;
  if (isTouch) uiText('Sem som? Tire o celular do modo silencioso.', nx, H - 40 * u, 13 * u, '#9a93ad', 'right', 600);
  if (AU.ctx && AU.total) uiText(AU.loaded < AU.total ? 'carregando som ' + Math.round(AU.loaded / AU.total * 100) + '%' : 'som pronto', nx, H - 22 * u, 13 * u, '#9a93ad', 'right', 600);
  else uiText('o som liga no primeiro toque', nx, H - 22 * u, 13 * u, '#9a93ad', 'right', 600);
}
function drawResults() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const u = H / 540, R = G.result;
  ctx.fillStyle = 'rgba(8,4,16,0.62)'; ctx.fillRect(0, 0, W, H);
  // v14: resultado à esquerda, ranking à direita
  const avail = W - 40 * u, rw = clamp(avail * 0.36, 250 * u, 330 * u), pw = Math.min(600 * u, avail - rw - 16 * u), ph = 440 * u, px = (W - pw - 16 * u - rw) / 2, py = (H - ph) / 2;
  drawRanking(px + pw + 16 * u, py, rw, ph, u, { title: 'RANKING', max: 12 });
  rr(ctx, px, py, pw, ph, 18 * u); ctx.fillStyle = 'rgba(20,14,32,0.94)'; ctx.fill();
  const bg = ctx.createLinearGradient(px, py, px + pw, py); bg.addColorStop(0, '#ff7a1a'); bg.addColorStop(0.5, '#ff3fa4'); bg.addColorStop(1, '#b6ff3b');
  ctx.strokeStyle = bg; ctx.lineWidth = 3 * u; ctx.stroke();
  const cx = px + pw / 2;
  ctx.save(); ctx.shadowColor = '#ff3fa4'; ctx.shadowBlur = 18 * u; uiText('SHOW CONCLUÍDO!', cx, py + 48 * u, 44 * u, '#fff3e0', 'center', 400, FONT_HAND, false); ctx.restore();
  uiText('TEMPO DE ' + NAME_UP(), cx, py + 92 * u, 16 * u, '#9a93ad', 'center', 600);
  uiText(fmt(R.t), cx, py + 124 * u, 50 * u, '#ffffff', 'center', 800);
  if (R.isNew) { if ((G.frame >> 4) % 2 === 0) uiText('NOVO RECORDE!', cx, py + 160 * u, 22 * u, '#ffd23f', 'center', 800); }
  else uiText('RECORDE ' + fmt(R.prev), cx, py + 160 * u, 20 * u, '#ffd23f', 'center', 600);
  const mc = { OURO: '#ffcf3a', PRATA: '#d7dde6', BRONZE: '#d08a48' }[R.medal] || '#5a5468';
  const mx = cx - 120 * u, my = py + 214 * u;
  ctx.fillStyle = '#ff3fa4'; ctx.beginPath(); ctx.moveTo(mx - 20 * u, my - 40 * u); ctx.lineTo(mx - 9 * u, my - 40 * u); ctx.lineTo(mx + 3 * u, my - 12 * u); ctx.lineTo(mx - 8 * u, my - 12 * u); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7fd4ff'; ctx.beginPath(); ctx.moveTo(mx + 20 * u, my - 40 * u); ctx.lineTo(mx + 9 * u, my - 40 * u); ctx.lineTo(mx - 3 * u, my - 12 * u); ctx.lineTo(mx + 8 * u, my - 12 * u); ctx.closePath(); ctx.fill();
  const mg = ctx.createRadialGradient(mx - 6 * u, my - 6 * u, 2 * u, mx, my, 24 * u); mg.addColorStop(0, '#ffffff'); mg.addColorStop(0.35, mc); mg.addColorStop(1, mix(mc.length === 7 ? mc : '#5a5468', '#000000', 0.4));
  ell(ctx, mx, my, 22 * u, 22 * u); ctx.fillStyle = mg; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2 * u; ctx.stroke();
  ctx.save(); ctx.setTransform(u * 2.2, 0, 0, u * 2.2, mx, my); noteGlyph(ctx, 0.5, 0, 1.4, '#2a1a10'); ctx.restore();
  uiText(R.medal ? 'MEDALHA DE ' + R.medal : 'SEM MEDALHA', mx + 38 * u, my, 24 * u, mc, 'left', 800);
  const sy = py + 262 * u, c1 = px + 40 * u, c2 = px + pw / 2 + 20 * u;
  uiText('RODINHAS ' + stats.coins + '/' + stats.coinsTotal, c1, sy, 19 * u, '#fff7e8', 'left', 600);
  uiText('LIBERTOS ' + stats.robots + '/' + stats.robotsTotal, c2, sy, 19 * u, '#b6ff3b', 'left', 600);
  uiText('QUEDAS ' + stats.deaths, c1, sy + 28 * u, 19 * u, '#fff7e8', 'left', 600);
  uiText(antenna.alive ? 'ANTENA DE PÉ' : 'ANTENA DERRUBADA', c2, sy + 28 * u, 19 * u, antenna.alive ? '#ff3b5c' : '#b6ff3b', 'left', 600);
  uiText('ETs ENCONTRADOS ' + R.et + '/3', c2, sy + 56 * u, 19 * u, '#7fd4ff', 'left', 600);
  uiText('OURO < ' + MEDALS[0] + ' s · PRATA < ' + MEDALS[1] + ' s · BRONZE < ' + MEDALS[2] + ' s', cx, py + ph - 50 * u, 15 * u, '#9a93ad', 'center', 600);
  uiText(boss && boss.freed ? 'PAREDÃO LIBERTADO' : 'PAREDÃO DE PÉ', c1, sy + 56 * u, 19 * u, boss && boss.freed ? '#b6ff3b' : '#ff3b5c', 'left', 600);
  uiText('PONTOS ' + R.score, c1, sy + 90 * u, 22 * u, '#ffd23f', 'left', 800);
  uiText('MANOBRAS ' + stats.tricks + (stats.bestCombo > 1 ? ' · COMBO x' + stats.bestCombo : ''), c2, sy + 90 * u, 19 * u, '#7fd4ff', 'left', 600);
  if (R.scoreNew) { if ((G.frame >> 4) % 2 === 0) uiText('NOVO RECORDE DE PONTOS!', c1, sy + 114 * u, 15 * u, '#ffd23f', 'left', 800); }
  else if (R.scorePrev > 0) uiText('MELHOR ' + R.scorePrev, c1, sy + 114 * u, 15 * u, '#cfc8de', 'left', 600);
  if (G.resT > 50 && (G.frame >> 5) % 2 === 0) uiText(touchUI ? 'TOQUE PARA TOCAR DE NOVO' : 'ENTER: TOCAR DE NOVO', cx, py + ph - 24 * u, 20 * u, '#ffffff', 'center', 800);
}
const PROF = { on: false, acc: {}, last: 0 };
function prof(name, fn) { if (!PROF.on) return fn(); const t0 = performance.now(); fn(); PROF.acc[name] = (PROF.acc[name] || 0) + performance.now() - t0; }
function render() {
  tiltBegin(); drawWorld(); tiltEnd();   // v11: câmera inclinada na ladeira
  if (G.state === 'title') drawTitle();
  else {
    drawHUD(); mark('hud');
    if (G.state === 'results') drawResults();
    if (G.state === 'paused') { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(8,4,16,0.6)'; ctx.fillRect(0, 0, W, H); const u = H / 540; uiText('PAUSA', W / 2, H * 0.44, 60 * u, '#c8ff5a', 'center', 400, FONT_HAND); uiText(touchUI ? 'Toque no botão de pausa para voltar' : 'P volta · R recomeça a fase', W / 2, H * 0.56, 20 * u, '#ffffff', 'center', 600); }
  }
}

// ---------- laço principal
buildLevel(); computeRuns(); resetHero(cp.x);
resize();
setMuted(AU.muted);
if (document.fonts && document.fonts.load) Promise.all([document.fonts.load(`20px ${FONT_HAND}`), document.fonts.load(`800 20px ${FONT_UI}`), document.fonts.load(`600 20px ${FONT_UI}`)]).then(() => resize()).catch(() => {});
// v9.1: desenho interpolado. A lógica continua em passos fixos de 60 Hz, mas a tela desenha cada coisa na posição entre
// os dois últimos passos: o movimento fica liso em qualquer monitor (60, 120, 144 Hz) e some o tranco dos quadros
// que rodam 0 ou 2 passos. A posição real volta logo depois do desenho.
const IP_LISTS = () => [enemies, items, waves, projs, shocks, parts, pops, drops, ufos, bossBoxes];
function ipSnap() {
  cam._px = cam.x; cam._py = cam.y; cam._pz = cam.zoom;
  hero._px = hero.x; hero._py = hero.y;
  if (boss) { boss._px = boss.x; boss._py = boss.y; }
  if (tut && tut.m) { tut.m._px = tut.m.x; tut.m._py = tut.m.y; }
  for (const L of IP_LISTS()) if (L) for (const o of L) { o._px = o.x; o._py = o.y; }
}
const IP_SWAP = [];
function ipOne(o, a, lim) {
  if (!o || o._px === undefined || typeof o.x !== 'number' || typeof o.y !== 'number') return;
  const dx = o.x - o._px, dy = o.y - o._py;
  if (dx * dx + dy * dy > lim * lim) return;   // teletransporte (renascer, troca de cena): sem interpolar
  IP_SWAP.push(o, o.x, o.y); o.x = o._px + dx * a; o.y = o._py + dy * a;
}
function ipApply(a) {
  IP_SWAP.length = 0;
  if (cam._px !== undefined && Math.abs(cam.x - cam._px) < 120 && Math.abs(cam.y - cam._py) < 120) { IP_SWAP.push(cam, cam.x, cam.y, cam.zoom); cam.x = cam._px + (cam.x - cam._px) * a; cam.y = cam._py + (cam.y - cam._py) * a; cam.zoom = cam._pz + (cam.zoom - cam._pz) * a; }
  ipOne(hero, a, 40); ipOne(boss, a, 40); if (tut) ipOne(tut.m, a, 40);
  for (const L of IP_LISTS()) if (L) for (const o of L) ipOne(o, a, 40);
}
function ipRestore() {
  let i = 0;
  if (IP_SWAP[0] === cam) { cam.x = IP_SWAP[1]; cam.y = IP_SWAP[2]; cam.zoom = IP_SWAP[3]; i = 4; }
  for (; i < IP_SWAP.length; i += 3) { IP_SWAP[i].x = IP_SWAP[i + 1]; IP_SWAP[i].y = IP_SWAP[i + 2]; }
  IP_SWAP.length = 0;
}
let acc = 0, last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (window.__freeze) { last = now; return; }
  let dt = (now - last) / 1000; last = now; if (dt > 0.25) dt = 0.25;
  acc += dt * (1 - SLOMO_SPEED * G.slomo); let n = 0; while (acc >= 1 / 60 && n < 5) { ipSnap(); update(); acc -= 1 / 60; n++; }   // v8: câmera lenta sutil nos pulos altos
  if (n >= 5) acc = Math.min(acc, 1 / 60);
  if (!window.__noInterp) ipApply(Math.min(1, acc * 60));
  if (window.__onRender) window.__onRender(cam, hero);   // testes de fluidez
  try { if (!window.__skipRender) render(); } finally { ipRestore(); }
  if (G.state === 'play' || G.state === 'title') perfSample(dt * 1000, now);
}
requestAnimationFrame(loop);
window.__rcs = { PROF, merlin: { drawMerlin, drawBubble }, scene: { paintPrefeitura, paintIgreja, paintFar, paintMid, paintNear, nearTree, nearPalm, drawPacoLive, flagPath, PREF, IGREJA, PACO, TROLLEY, FAR, MID, NEAR }, art: { noteGlyph, star, guitarPath, drawHeroRig, FORMP, formParams, HP, drawPigeon, drawDog, drawFlower, drawCat, drawCone, drawShock, drawAlertMark, drawEnemy, drawUFO, drawAlien, drawPick, drawFood, drawAntenna, drawPiano, drawWheel, flushEmissive, drawSkate, drawRamp, drawRail, drawBoss, bossPose, drawSpeakerBox, drawSpeakerStack, drawGate, drawBossBoxes, ctx, get K() { return K; } }, get G() { return G; }, get hero() { return hero; }, get stats() { return stats; }, get eggs() { return eggs; }, get enemies() { return enemies; }, get shocks() { return shocks; }, get ramps() { return ramps; }, get rails() { return rails; }, get boss() { return boss; }, get bossBoxes() { return bossBoxes; }, hitBoss, bossSet, updateBoss, get ARENA() { return ARENA; }, get GATE() { return GATE; }, get STACK() { return STACK; }, get projs() { return projs; }, get AU() { return AU; }, startGame, triggerAlarm, hitEnemy, setWT(v) { WT = v; }, get cam() { return cam; }, set colorX(v) { colorX = v; colorTarget = v; },
  step(n = 1) { for (let i = 0; i < n; i++) update(); render(); },   // testes: avança quadros com o laço congelado (__freeze)
  tick(n = 1) { for (let i = 0; i < n; i++) update(); }, get tut() { return tut; }, solidAt, tileAt, rampAt, rampY, get items() { return items; }, get coins() { return coins; }, get pianos() { return pianos; }, get antenna() { return antenna; }, bossBody,
  key(k, down) { keys[k] = down; if (down && k === 'jump') input.jumpP = true; if (down && k === 'act') input.actP = true; },
  levelDump() { buildLevel(); return { COLS, ROWS, TS, STAGE_C, GOAL_C, T, map: Array.from(map), amps: [...ampAt.entries()], enemies: enemies.map(e => ({ type: e.type, x: e.x, y: e.y, w: e.w, h: e.h, armor: e.armor, tier: e.tier })), coins: coins.map(k => ({ x: k.x, y: k.y })), pianos: pianos.map(p => ({ c: p.c, reach: p.reach })), signs, antenna: { x: antenna.x }, alien: { x: alien.x, y: alien.y }, boss: { x: boss.x, y: boss.y }, STACK, GATE, ARENA, ramps: ramps.map(r => ({ kind: r.kind, x0: r.x0, x1: r.x1, base: r.base, dir: r.dir, h: r.h, top: r.top, surf: Array.from({ length: 25 }, (_, i) => { const x = r.x0 + (r.x1 - r.x0) * i / 24; return [+x.toFixed(1), +rampY(r, x).toFixed(1)]; }) })), rails: rails.map(r => ({ x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 })), PIPE, TUT, tutFence: tut && tut.fence.x, tutGate: tut && tut.gate.x }; } };   // usado para gerar a planta da fase
