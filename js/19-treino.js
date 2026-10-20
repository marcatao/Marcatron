'use strict';
// =================================================================== treino com o Merlin (v8)
// Começo da fase: o Merlin, professor de patins, ensina em ordem — patinar, pular, powerslide e corrimão. Cada etapa só
// libera a próxima quando o jogador consegue: a pilha de cases só passa pulando (segurando o botão), a cerca da IA só
// desliga com faísca e a cancela do treino só abre depois de um grind no corrimão. Obrigatório na primeira vez no
// aparelho; nas próximas, o Merlin só cumprimenta e libera tudo. O cronômetro só começa depois do treino.
const TUT_KEY = 'marcatron.treino';
const TUT = { s1: 9.5, s2: 13.2, crate0: 15, crate1: 16, s3: 18.8, fence: 22.5, s4: 26, rail0: 28, rail1: 34, gate: 36, sEnd: 37.8 };
const TUT_STEPS = ['PATINAR', 'PULAR', 'POWERSLIDE', 'CORRIMÃO'];
let tut = null;
function makeTutorial(rail) {
  const first = store.get(TUT_KEY) !== '1';
  tut = {
    first, active: first, step: first ? 1 : 5, t: 0, stepT: 0, rail,
    fence: { x: TUT.fence * TS, on: first, off: first ? 0 : 1 },
    gate: { x: TUT.gate * TS, pass: !first, open: first ? 0 : 1 },
    say: null, praise: null, bump: null, endSaid: false, passed: false, doneT: null,
    m: { x: TUT.s1 * TS, y: GROUND_Y, vx: 0, vy: 0, face: -1, state: 'ground', target: null, next: null, stride: 0, wheel: 0, t: 0, cheerT: 0, talk: 0, blinkT: 120, blink: 0, hairDX: 0, sparkT: 0 },
  };
  tutSay();
}
const KEYS = () => touchUI ? { right: 'O DIRECIONAL [→]', jump: '[PULAR]', act: '[SLIDE]' } : { right: '[→]', jump: '[ESPAÇO]', act: '[X]' };
function tutLines(step) {
  const k = KEYS(), n = NAME_UP();
  switch (step) {
    case 1: return ['FALA, ' + n + '! EU SOU O MERLIN.', 'SEGURA ' + k.right + ' PRA REMAR E VEM ATÉ MIM!'];
    case 2: return ['AGORA O PULO: PASSA POR CIMA DAS CAIXAS!', 'SEGURA ' + k.jump + ' PRA PULAR MAIS ALTO.'];
    case 3: return ['ESSA CERCA DA IA SÓ DESLIGA COM FAÍSCA.', 'CHEGA PERTO E DÁ UM POWERSLIDE: ' + k.act + '!'];
    case 4: return ['AGORA O CORRIMÃO: PULA EM CIMA DELE', 'E DESLIZA ATÉ O FIM!'];
    default: return tut && tut.first ? ['AGORA É COM VOCÊ, ' + n + ':', 'LIBERTA A CIDADE!', 'DICA: NO AR, ' + k.act + ' FAZ MANOBRA E DÁ PONTOS!'] : ['E AÍ, ' + n + '! JÁ SABE TUDO.', 'BORA LIBERTAR A CIDADE!', 'NO AR, ' + k.act + ' = MANOBRA. CAPRICHA!'];
  }
}
function tutSay(lines) { tut.say = { lines: lines || tutLines(tut.step), t: 0 }; tut.m.talkT = 150; }
const tutStation = step => (step === 1 ? TUT.s1 : step === 2 ? TUT.s2 : step === 3 ? TUT.s3 : step === 4 ? TUT.s4 : tut.first ? TUT.sEnd : TUT.s1) * TS;
function tutStepDone(praise) {
  const m = tut.m;
  tut.step++; tut.stepT = 0; tut.bump = null;
  tut.praise = { text: praise, t: 0 };
  m.cheerT = 54; m.next = tutStation(tut.step);
  sfx('combo', { vol: 0.7 }); noteBurst(m.x, m.y - MERLIN_H, 10, 1.6);
  if (tut.step > 4) tutFinish(); else tutSay();
}
function tutFinish() {
  tut.active = false; tut.gate.pass = true; store.set(TUT_KEY, '1');
  sfx('checkpoint', { vol: 0.9 }); sfx('gate', { vol: 0.5, rate: 1.4 });
  tut.doneT = 0;
  tutSay();
}
function tutFenceHit() {
  const f = tut.fence; if (!f.on) return;
  f.on = false; G.shake = Math.max(G.shake, 7); sfx('antenna_hit', { vol: 0.9, pan: panOf(f.x) }); sfx('free', { vol: 0.5, rate: 0.8 });
  for (let i = 0; i < 18; i++) part({ x: f.x + rnd(-4, 4), y: rnd(150, 190), vx: rnd(-2.4, 2.4), vy: rnd(-2.6, 0.4), col: SPARK_COLS[i % 4], life: 22, size: 1, g: 0.12, kind: 'spark' });
  pop(f.x, 150, 'CURTO-CIRCUITO!', '#ffd23f');
}
// paredes do treino: a cerca (até desligar) e a cancela (até o fim do treino) seguram o herói até o topo do mundo
function tutWallList() {
  const L = []; if (!tut) return L;
  if (tut.fence.on) L.push({ x0: tut.fence.x - 5, x1: tut.fence.x + 5, k: 3 });
  if (!tut.gate.pass) L.push({ x0: tut.gate.x - 2, x1: tut.gate.x + 3, k: 4 });
  return L;
}
function tutWalls(h, prevX) {
  for (const w of tutWallList()) {
    if (prevX + h.w <= w.x0 + 0.01 && h.x + h.w > w.x0) { h.x = w.x0 - h.w; if (h.vx > 0) h.vx = 0; tutBump(w.k); }
    else if (prevX >= w.x1 - 0.01 && h.x < w.x1) { h.x = w.x1; if (h.vx < 0) h.vx = 0; }
  }
}
function tutBlock(b) {   // robôs também não atravessam
  for (const w of tutWallList()) if (b.x + b.w > w.x0 && b.x < w.x1) { b.x = (b.x + b.w / 2 < (w.x0 + w.x1) / 2) ? w.x0 - b.w - 0.01 : w.x1 + 0.01; return true; }
  return false;
}
function tutBump(k) {
  if (tut.bump && tut.bump.t < 90) return;
  const kk = KEYS();
  tut.bump = { t: 0, lines: k === 3 ? ['CALMA! ESSA CERCA SÓ CAI COM FAÍSCA:', 'DÁ UM POWERSLIDE PERTO DELA! ' + kk.act] : ['NO CORRIMÃO! VOLTA, PEGA EMBALO', 'E PULA EM CIMA DELE. ' + kk.jump] };
  tut.m.talkT = 90; sfx('bump', { vol: 0.5, rate: 1.3 });
}
function tutSlide() {   // o herói deu um powerslide: encostado na cerca também vale; longe demais, o Merlin avisa
  if (!tut || !tut.fence.on || tut.step !== 3) return;
  const d = tut.fence.x - heroCX();
  if (d > 60 && d < 200) { tut.bump = { t: 0, lines: ['MAIS PERTO DA CERCA!', 'A FAÍSCA SÓ VAI UNS 2 BLOCOS.'] }; tut.m.talkT = 90; }
}
function tutGround(x) { return x >= TUT.crate0 * TS - 3 && x <= (TUT.crate1 + 1) * TS + 3 ? 9 * TS : GROUND_Y; }
function updateTutorial() {
  if (!tut) return;
  const m = tut.m, h = hero, hx = heroCX(), playing = G.state === 'play';
  tut.t++; tut.stepT++; m.t += 1 / 60;
  if (tut.say) tut.say.t++; if (tut.praise) { tut.praise.t++; if (tut.praise.t > 80) tut.praise = null; } if (tut.bump) { tut.bump.t++; if (tut.bump.t > 150) tut.bump = null; }
  // ----- etapas
  if (playing && tut.active && !h.dead) {
    if (tut.step === 1 && hx >= m.x - 26) tutStepDone('ISSO! TÁ PATINANDO!');
    else if (tut.step === 2 && h.x > (TUT.crate1 + 1) * TS + 2 && h.onGround) tutStepDone('BOA! VOOU ALTO!');
    else if (tut.step === 3 && !tut.fence.on) tutStepDone('IRADO! VIU AS FAÍSCAS?');
    else if (tut.step === 4 && h.rail === tut.rail && h.grindT >= 8) tutStepDone('MANDOU BEM, ' + NAME_UP() + '!');
  }
  if (!tut.fence.on && tut.fence.off < 1) tut.fence.off = Math.min(1, tut.fence.off + 0.04);
  if (tut.gate.pass && tut.gate.open < 1) tut.gate.open = Math.min(1, tut.gate.open + 0.035);
  // ----- o Merlin: vai até o ponto da etapa (pulando as caixas e deslizando no corrimão), comemora e explica
  if (m.cheerT > 0 && --m.cheerT === 0 && m.next != null) { m.target = m.next; m.next = null; }
  if (m.target == null && m.cheerT === 0 && m.state === 'ground' && Math.abs(m.x - tutStation(tut.step)) > 3) m.target = tutStation(tut.step);
  if (m.target != null && m.cheerT === 0) {
    const d = m.target - m.x;
    if (Math.abs(d) < 2.5 && m.state === 'ground') { m.x = m.target; m.target = null; m.vx = 0; }
    else { m.vx = approach(m.vx, Math.sign(d) * 2.3, 0.14); if (m.state !== 'grind') m.face = Math.sign(d) || m.face; }
  } else if (m.state === 'ground') m.vx = approach(m.vx, 0, 0.18);
  if (m.state === 'ground' && m.vx > 0.6 && m.target != null) {
    const c0 = TUT.crate0 * TS, r = tut.rail;
    if (m.x < c0 && m.x > c0 - 24 && m.target > c0) { m.state = 'air'; m.vy = -6.1; sfx('jump', { vol: 0.35, rate: 0.85, pan: panOf(m.x) }); }
    else if (r && m.x < r.x0 && m.x > r.x0 - 18 && m.target > r.x1) { m.state = 'air'; m.vy = -3.7; sfx('jump', { vol: 0.3, rate: 0.85, pan: panOf(m.x) }); }
  }
  m.x += m.vx;
  if (!tut.fence.on || m.x < tut.fence.x - 12 || m.target == null) {} else if (m.x > tut.fence.x - 14 && m.target > tut.fence.x) { m.x = tut.fence.x - 14; m.vx = 0; }   // não atravessa a cerca ligada
  if (m.state === 'air') {
    m.vy = Math.min(m.vy + 0.3, 6); m.y += m.vy;
    const r = tut.rail;
    if (r && m.vy > 0 && m.x >= r.x0 && m.x <= r.x1 && m.y >= r.y0 - 1 && m.y - m.vy <= r.y0 + 2) { m.state = 'grind'; m.y = r.y0; m.vx = Math.max(m.vx, 2.6); sfx('grind_start', { vol: 0.4, pan: panOf(m.x) }); }
    else { const gy = tutGround(m.x); if (m.y >= gy) { m.y = gy; m.vy = 0; m.state = 'ground'; sfx('land_skate', { vol: 0.3, pan: panOf(m.x) }); } }
  } else if (m.state === 'grind') {
    m.vx = Math.max(m.vx, 2.4); m.y = tut.rail.y0;
    if (++m.sparkT % 2 === 0 && onScreen({ x: m.x - 4, y: m.y - 4, w: 8, h: 8 })) sparkAt(m.x - 2, m.y, -m.vx * 0.45, rnd(-1.8, -0.4), 1, 14);
    if (m.x > tut.rail.x1) { m.state = 'air'; m.vy = -1.6; }
  } else { const gy = tutGround(m.x); if (gy > m.y + 1) { m.state = 'air'; m.vy = 0; } else m.y = gy; }
  m.stride += Math.abs(m.vx) * 0.085; m.wheel += (m.state === 'ground' ? m.vx : 0) / 0.66;
  if (m.target == null && m.state === 'ground' && m.cheerT === 0) { const f = Math.sign(hx - m.x); if (f) m.face = f; }
  if (m.talkT > 0) m.talkT--;
  m.talk = m.talkT > 0 ? 0.5 + 0.5 * Math.sin(m.t * 15) : 0;
  if (--m.blinkT <= 0) { m.blink = 7; m.blinkT = 150 + Math.random() * 160; } if (m.blink > 0) m.blink--;
  m.hairDX += (clamp(-m.vx * 0.8, -2.2, 2.2) * m.face - m.hairDX) * 0.12;
  // depois do treino: quando o herói passa por ele, um "vai!"
  if (tut.doneT != null) tut.doneT++;
  const atEnd = m.target == null && m.state === 'ground' && Math.abs(m.x - tutStation(5)) < 4;
  if (!tut.active && !tut.passed && tut.first && !atEnd && hx > tutStation(5) + 20) tut.passed = true;   // passou antes de ele chegar: sem bronca nem elogio
  if (!tut.active && !tut.passed && atEnd && hx > m.x + 20 && playing) { tut.passed = true; tut.praise = { text: 'VAI, ' + NAME_UP() + '! ARREBENTA!', t: 0 }; m.cheerT = Math.max(m.cheerT, 40); }
}
function merlinMode(m) {
  if (m.cheerT > 0) return 'cheer';
  if (m.state === 'air') return 'air';
  if (m.state === 'grind') return 'grind';
  if (Math.abs(m.vx) > 0.35) return 'skate';
  if (!tut.active && tut.passed) return 'wave';
  return m.talkT > 0 ? (((m.t * 0.6) | 0) % 2 ? 'talk' : 'point') : 'idle';
}
// ----- desenho: cerca da IA, cancela do treino, o Merlin e o balão (depois da dessaturação: ficam sempre coloridos)
function drawTutorialBack(g, t, vx0, vx1) {
  if (!tut) return;
  const f = tut.fence;
  if (f.x > vx0 - 30 && f.x < vx1 + 30) {
    const on = f.on, x = f.x;
    // laser até o topo do mundo (não dá para pular por cima)
    if (on) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let y = 6; y < 186; y += 6) { const a = 0.6 + 0.3 * Math.sin(t * 9 + y * 0.3); g.strokeStyle = `rgba(255,42,74,${a})`; g.lineWidth = 1.0; g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.stroke(); g.strokeStyle = `rgba(255,190,200,${a * 0.6})`; g.lineWidth = 0.3; g.stroke(); }
      g.fillStyle = 'rgba(255,42,74,0.16)'; g.fillRect(x - 5, -40, 10, 232);
      for (let y = 126; y < 190; y += 16) emit(x, y, 10, RED, 0.35);
      g.restore();
    }
    // postes e a caixa de controle (alvo da faísca)
    for (const px of [x - 5.5, x + 5.5]) { rr(g, px - 1.1, 118, 2.2, 74, 0.6); fillStroke(g, vgrad(g, 118, 192, [[0, '#8a8f9c'], [1, '#4a4e5a']]), 0.5); ell(g, px, 117.5, 1.4, 1.4); fillStroke(g, on ? RED : '#7ce38a', 0.4); if (on) emit(px, 117.5, 6, RED, 0.8); }
    rr(g, x - 7, 178, 14, 14, 1.4); fillStroke(g, vgrad(g, 178, 192, [[0, '#3a3d48'], [1, '#22232b']]), 0.6);
    ell(g, x, 184.5, 3.2, 3.2); fillStroke(g, on ? '#2a0a10' : '#10301a', 0.4);
    ell(g, x, 184.5, 1.6, 1.6); g.fillStyle = on ? RED : '#7ce38a'; g.fill(); if (on) emit(x, 184.5, 7, RED, 0.9 + 0.3 * Math.sin(t * 6));
    g.fillStyle = '#d7dbe2'; g.font = `800 2.6px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(on ? 'IA' : 'OFF', x, 180.2);
    if (!on && f.off < 1 && G.frame % 3 === 0) part({ x: x + rnd(-3, 3), y: 178, vx: rnd(-0.2, 0.2), vy: -0.6, col: '#5a5566', life: 50, size: rnd(2, 3.5), g: -0.004, kind: 'smoke' });
  }
  const gt = tut.gate;
  if (gt.x > vx0 - 50 && gt.x < vx1 + 30) {
    const x = gt.x, ang = -Math.PI / 2 * smooth(0, 1, gt.open);   // braço da cancela gira para cima
    rr(g, x - 1.8, 158, 3.6, 34, 0.8); fillStroke(g, '#2b2a33', 0.5);
    for (let y = 160; y < 190; y += 6) { g.fillStyle = '#ffd23f'; g.fillRect(x - 1.5, y, 3, 3); }
    rr(g, x - 3.4, 154, 6.8, 6, 1.2); fillStroke(g, '#ff7a1a', 0.5);
    g.fillStyle = '#1c1b23'; g.font = `800 2.5px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TREINO', x, 157.2);
    g.save(); g.translate(x, 163); g.rotate(ang);
    rr(g, -30, -1.4, 30, 2.8, 1.2); fillStroke(g, '#f4f0e8', 0.5);
    g.save(); rr(g, -30, -1.4, 30, 2.8, 1.2); g.clip(); g.fillStyle = '#ff3b3b'; for (let k = -30; k < 0; k += 6) { g.beginPath(); g.moveTo(k, -1.4); g.lineTo(k + 3, -1.4); g.lineTo(k + 1.6, 1.4); g.lineTo(k - 1.4, 1.4); g.closePath(); g.fill(); } g.restore();
    ell(g, 0, 0, 1.6, 1.6); fillStroke(g, '#c9ced6', 0.4);
    g.restore();
    if (!gt.pass) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,210,63,${0.06 + 0.04 * Math.sin(t * 5)})`; g.fillRect(x - 2, -40, 5, 232); g.restore(); }
  }
}
function drawTutorialFront(g, t, vx0, vx1) {
  if (!tut) return;
  const m = tut.m;
  if (m.x > vx0 - 40 && m.x < vx1 + 40) {
    // sombra, Merlin e um contorno de luz suave como o do herói
    if (m.state !== 'air') { g.fillStyle = 'rgba(8,4,16,0.4)'; ell(g, m.x, m.y + 0.4, 10, 1.8); g.fill(); }
    glow(g, m.x, m.y - 16, 30, '#7fd4ff', 0.12);
    g.save(); g.translate(m.x, m.y); g.scale(m.face, 1);
    drawMerlin(g, { t: m.t, mode: merlinMode(m), stride: m.stride, wheel: m.wheel, vy: m.vy, talk: m.talk, hairDX: m.hairDX, hairDY: m.state === 'air' ? clamp(-m.vy * 0.4, -2, 2) : 0, blink: m.blink > 0 });
    g.restore();
  }
}
function drawTutorialBubble(g) {
  if (!tut) return;
  const m = tut.m;
  // balão: bronca > elogio > fala da etapa (só quando o herói está por perto)
  const hx = heroCX(), near = Math.abs(hx - m.x) < 230 && G.state === 'play';
  let lines = null;
  if (tut.bump && tut.bump.t < 150) lines = tut.bump.lines;
  else if (tut.praise) lines = [tut.praise.text];
  else if (tut.say && m.target == null && m.state === 'ground' && (tut.active || !tut.passed)) lines = tut.say.lines;
  if (lines && near) {
    const cx = cam.x, cw = viewW();
    drawBubble(g, m.x + m.face * 3, m.y - MERLIN_H - 2, lines, { minX: cx + 3, maxX: cx + cw - 3, size: 5.2 });
  }
}
// ----- HUD: as 4 etapas do treino
function drawTutorialHUD(u) {
  if (tut && tut.doneT != null && tut.doneT < 150 && G.state === 'play') {   // faixa de treino completo
    const a = Math.min(1, tut.doneT / 10, (150 - tut.doneT) / 25), y = 46 * H / cssH + 34 * u;
    ctx.globalAlpha = a; ctx.save(); ctx.shadowColor = '#b6ff3b'; ctx.shadowBlur = 16 * u; uiText('TREINO COMPLETO!', W / 2, y, 40 * u, '#c8ff5a', 'center', 400, FONT_HAND); ctx.restore();
    uiText('AGORA VALE O TEMPO', W / 2, y + 30 * u, 16 * u, '#ffffff', 'center', 800); ctx.globalAlpha = 1;
  }
  if (!tut || !tut.active || G.state !== 'play') return;
  const y = 46 * H / cssH + 30 * u, n = TUT_STEPS.length;   // abaixo dos botões do topo
  ctx.font = `800 ${15 * u}px ${FONT_UI}`;
  const items = TUT_STEPS.map((s, i) => (i + 1 < tut.step ? '✓ ' : i + 1 === tut.step ? '▶ ' : '') + s);
  const ws = items.map(s => ctx.measureText(s).width), gap = 18 * u, tw = ws.reduce((a, b) => a + b, 0) + gap * (n - 1);
  const w = Math.max(tw, 200 * u) + 30 * u, x0 = (W - w) / 2;
  rr(ctx, x0, y - 30 * u, w, 52 * u, 12 * u); ctx.fillStyle = 'rgba(14,10,24,0.78)'; ctx.fill(); ctx.strokeStyle = 'rgba(127,212,255,0.6)'; ctx.lineWidth = 1.5 * u; ctx.stroke();
  uiText('TREINO COM O MERLIN · O TEMPO SÓ COMEÇA DEPOIS', W / 2, y - 16 * u, 12 * u, '#7fd4ff', 'center', 800, FONT_UI, false);
  let x = (W - tw) / 2;
  items.forEach((s, i) => { uiText(s, x, y + 6 * u, 15 * u, i + 1 < tut.step ? '#b6ff3b' : i + 1 === tut.step ? '#ffffff' : '#8a83a0', 'left', 800, FONT_UI, false); x += ws[i] + gap; });
}
