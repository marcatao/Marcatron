'use strict';
// =================================================================== chefe: PAREDÃO, o segurança da IA (v6)
// Guarda o portão do backstage. Joga 3 caixas de som em você (a esteira do paredão de som atrás dele vai entregando);
// depois fica cansado (mãos nos joelhos, ofegante). Cansado, ele pode ser atingido: pulo na cabeça, faíscas do powerslide ou pisão do
// Marombado. 3 acertos = nocaute; liberto, ele abre o portão e o Gabriel Rock vai para o palco tocar o show.
const ARENA = { c0: STAGE_C - 26, gateC: STAGE_C - 3 };
const STACK = { x0: (STAGE_C - 8.5) * TS, w: 64, rail: 140, slot: 17 };   // paredão de som com esteira no topo
const GATE = { x0: ARENA.gateC * TS, x1: (ARENA.gateC + 2) * TS, top: 128, lift: 64 };
const BOSS_HOME = STACK.x0 - 20, BOSS_PARTY = (STAGE_C + 1.6) * TS;
const BP = [   // por fase (vida 3, 2, 1): mais rápido a cada acerto (gravidade maior = caixas mais rápidas)
  { grab: 36, pause: 34, tired: 210, g: 0.164 },   // v9.1: caixas ~10% mais lentas (o herói ficou 10% mais devagar)
  { grab: 30, pause: 26, tired: 180, g: 0.197 },
  { grab: 24, pause: 18, tired: 150, g: 0.238 },
];
const THROW_H = [48, 90, 22];   // altura do arco das 3 caixas: normal, "balão" alto (sai por cima da tela) e rasteira que quica
function makeBoss() {
  boss = { x: BOSS_HOME, y: GROUND_Y, dir: -1, state: 'idle', st: 0, hp: 3, phase: 0, throwsLeft: 3, active: false, defeated: false, freed: false,
    t: 0, flash: 0, holding: false, tiredTip: false, strongTip: false, introSeen: false, gateLift: 0, gateOpen: false, cracks: 0, pant: 0, walkPh: 0,
    feedN: 3, feedX: 0, chip: null };
  bossBoxes = [];
}
function resetBoss() {   // o herói caiu: a luta recomeça do zero
  if (!boss || boss.defeated) return;
  const keep = { strongTip: boss.strongTip, tiredTip: boss.tiredTip, introSeen: boss.introSeen };
  makeBoss(); Object.assign(boss, keep);
}
const bossTiredPose = b => b.state === 'tired' || (b.state === 'recover' && b.st < 14);
function bossBody() {   // caixa de colisão (de pé: 34 x 54; cansado e curvado: 42 x 42, deslocada para a frente)
  const b = boss;
  if (bossTiredPose(b)) { const back = 15, fwd = 27; return b.dir < 0 ? { x0: b.x - fwd, x1: b.x + back, y0: b.y - 42, y1: b.y } : { x0: b.x - back, x1: b.x + fwd, y0: b.y - 42, y1: b.y }; }
  return { x0: b.x - 17, x1: b.x + 17, y0: b.y - 54, y1: b.y };
}
const bossFighting = () => !!boss && boss.active && !boss.defeated;
function bossSay(text, col = '#ff3b5c', big = true, dy = 0) {   // fala do chefe, sempre dentro da tela
  const half = text.length * (big ? 2.2 : 1.6) + 4;
  pop(clamp(boss.x, cam.x + half, cam.x + viewW() - half), boss.y - 66 + dy, text, col, big);
}
const FEED_PICK = [STACK.x0 + STACK.slot / 2, STACK.rail - 6];   // onde ele pega a caixa da frente da esteira (mundo)

function bossSet(state) { boss.state = state; boss.st = 0; }
function updateBoss() {
  if (!boss) return;
  const b = boss, P = BP[Math.min(2, b.phase)], hx = heroCX();
  b.t += 1 / 60; b.st++;
  if (b.flash > 0) b.flash--;
  if (!b.defeated && b.state !== 'idle' && b.state !== 'tired' && b.state !== 'hit') { const d = Math.sign(hx - b.x); if (d) b.dir = d; }
  switch (b.state) {
    case 'idle':   // de braços cruzados na frente do portão, batendo o pé no ritmo
      if (canAct() && hx > ARENA.c0 * TS + 40 && hx < GATE.x0) {
        b.active = true; bossSet('intro'); sfx('boss_roar', { vol: 0.9, pan: panOf(b.x) }); G.shake = 14;
        bossSay('SEM PULSEIRA, NÃO PASSA!');
      }
      break;
    case 'intro':  // pose de bíceps duplo + rugido (mais curta se você já viu)
      if (b.st % 30 === 15) { G.shake = Math.max(G.shake, 6); sfx('boss_step', { vol: 0.7 }); }
      if (b.st > (b.introSeen ? 56 : 120)) { b.introSeen = true; b.throwsLeft = 3; bossSet('grab'); }
      break;
    case 'grab':   // a esteira entrega uma caixa; ele pega e levanta acima da cabeça
      b.holding = b.st > P.grab * 0.45;
      if (b.st >= P.grab) { bossThrow(); bossSet('throw'); }
      break;
    case 'throw':
      b.holding = false;
      if (b.st > 14) { b.throwsLeft--; bossSet('pause'); }
      break;
    case 'pause':
      if (b.throwsLeft > 0) { if (b.st > P.pause) bossSet('grab'); }
      else if (bossBoxes.length === 0 || b.st > 150) { b.waitSt = b.st; bossSet('tired'); bossTired(); }   // v9.1: só cansa depois que a última caixa caiu
      break;
    case 'tired':  // cansado: a hora de bater
      b.pant += 0.2;
      if (G.frame % 26 === 0) part({ x: b.x + b.dir * 18 + rnd(-4, 4), y: b.y - 30, vx: b.dir * rnd(0.2, 0.6), vy: -0.5, col: '#d9dde6', life: 40, size: rnd(1.6, 2.6), g: -0.01, kind: 'puff' });
      if (G.frame % 9 === 0) part({ x: b.x + b.dir * rnd(8, 22), y: b.y - 34 + rnd(-3, 3), vx: rnd(-0.6, 0.6), vy: rnd(-1.2, -0.4), col: '#7fd4ff', life: 28, size: 0.9, g: 0.12, kind: 'drop' });
      if (b.st > P.tired) bossSet('recover');
      break;
    case 'recover':
      if (b.st === 1) b.throwsLeft = 3;   // a esteira já vai trazendo a próxima leva
      if (b.st > 30) { bossSet('grab'); sfx('boss_roar', { vol: 0.45, rate: 1.15, pan: panOf(b.x) }); }
      break;
    case 'hit':
      if (b.st === 1) b.x = clamp(b.x - b.dir * 6, ARENA.c0 * TS + 40, BOSS_HOME + 6);
      if (b.st > 56) {
        if (b.hp <= 0) bossSet('defeat');
        else { bossSet('angry'); sfx('boss_roar', { vol: 0.85, pan: panOf(b.x) }); G.shake = 10; bossSay(b.hp === 2 ? 'AGORA É PESSOAL!' : 'TÔ FICANDO BRAVO!', '#ff3b5c', false); }
      }
      break;
    case 'angry':  // volta mais bravo: a próxima rodada é mais rápida
      if (b.st === 1) b.throwsLeft = 3;
      b.x += clamp(BOSS_HOME - b.x, -0.7, 0.7);
      if (b.st % 24 === 12) { G.shake = Math.max(G.shake, 5); sfx('boss_step', { vol: 0.6, pan: panOf(b.x) }); }
      if (G.frame % 6 === 0) part({ x: b.x + rnd(-5, 5), y: b.y - 60, vx: rnd(-0.4, 0.4), vy: -0.9, col: '#c9ced6', life: 30, size: 2, g: -0.01, kind: 'puff' });
      if (b.st > 60) bossSet('grab');
      break;
    case 'defeat': // cai de joelhos, o visor estoura e o chip da IA voa longe
      if (b.st % 7 === 0 && b.st < 40) part({ x: b.x + b.dir * 4 + rnd(-4, 4), y: b.y - 40, vx: rnd(-1.6, 1.6), vy: rnd(-1.6, -0.2), col: '#fff3c4', life: 14, size: 1, g: 0.05, kind: 'spark' });
      if (b.st === 40) {
        b.freed = true; G.flash = 0.6; G.shake = 16; sfx('free', { vol: 1 }); sfx('cheer', { vol: 0.8 }); noteBurst(b.x, b.y - 40, 30, 2.4);
        for (let i = 0; i < 14; i++) part({ x: b.x + b.dir * 4, y: b.y - 40, vx: rnd(-2.6, 2.6), vy: rnd(-3.5, -1), col: i % 2 ? '#2a2830' : '#ff6a80', life: 50, size: rnd(0.8, 1.6), g: 0.18, kind: 'chunk', vr: rnd(-0.4, 0.4) });
        part({ x: b.x + b.dir * 4, y: b.y - 42, vx: -b.dir * 1.4, vy: -4.6, col: '#2c2d36', life: 90, size: 1, g: 0.15, kind: 'chip', vr: 0.25 });
        stats.robots++; bossSay('PAREDÃO LIBERTADO!', '#b6ff3b');
        colorTarget = LW + 900; colorX = Math.max(colorX, cam.x - 30);   // a cor volta para a arena e para o palco
      }
      if (b.st > 120) bossSet('freed');
      break;
    case 'freed':  // levanta sorrindo, agradece e vai abrir o portão
      if (b.st < 64) { const d = Math.sign(hx - b.x); if (d) b.dir = d; }
      if (b.st === 30) bossSay('VALEU, ' + NAME_UP() + '! O PALCO É SEU!', '#ffd23f', false, -4);
      if (b.st > 64) {
        const gx = (GATE.x0 + GATE.x1) / 2;
        b.dir = 1; b.walkPh += 0.15;
        b.x = Math.min(gx, b.x + 1.25);
        if (b.st % 22 === 0) sfx('boss_step', { vol: 0.45, pan: panOf(b.x) });
        if (b.x >= gx) { bossSet('lift'); sfx('gate', { vol: 0.9, pan: panOf(b.x) }); }
      }
      break;
    case 'lift':   // levanta a porta de enrolar e segura no alto para o Gabriel passar
      b.dir = 1;
      b.gateLift = Math.min(1, b.gateLift + 1 / 80);
      if (b.gateLift > 0.55 && !b.gateOpen) { b.gateOpen = true; for (let r = 8; r <= 11; r++) for (const c of [ARENA.gateC, ARENA.gateC + 1]) map[r * COLS + c] = 0; }
      if (b.gateLift >= 1) { bossSet('hold'); G.cutscene = true; }
      break;
    case 'hold':
      if (hero.x > GATE.x1 + 30 && b.st > 30) bossSet('party');
      break;
    case 'party':  // vira roadie: vai para a beira do palco curtir o show
      b.dir = 1;
      if (b.x < BOSS_PARTY) { b.walkPh += 0.15; b.x = Math.min(BOSS_PARTY, b.x + 1.25); if (b.st % 22 === 0) sfx('boss_step', { vol: 0.35, pan: panOf(b.x) }); }
      if (b.x > STAGE_C * TS + 12) b.y = Math.max(GROUND_Y - TS, b.y - 1.2);   // sobe no palco
      break;
  }
  // esteira: quantas caixas aparecem esperando no topo do paredão de som
  let n = b.throwsLeft - (b.holding || b.state === 'throw' ? 1 : 0);
  if (b.state === 'tired' || b.state === 'hit' || b.state === 'defeat') n = 0;
  if (n !== b.feedN) { b.feedX += STACK.slot * Math.abs(n - b.feedN); if (n > b.feedN) sfx('boss_clank', { vol: 0.25, rate: 0.6, pan: panOf(STACK.x0) }); b.feedN = n; }
  b.feedX = Math.max(0, b.feedX - 2.6);
  updateBossBoxes();
  bossContact();
}
function bossTired() {
  sfx('boss_tired', { vol: 0.85, pan: panOf(boss.x) });
  bossSay('CANSOU!', '#b6ff3b');
  if (!boss.tiredTip) { boss.tiredTip = true; bossSay('PULE NA CABEÇA OU DÊ UM POWERSLIDE!', '#ffffff', false, 10); }
}
function bossDefeat() {  // o terceiro acerto: nocaute (o cronômetro para aqui)
  const b = boss; b.defeated = true; b.holding = false;
  G.timeFrozen = true; G.timer.on = false;
  for (let i = bossBoxes.length - 1; i >= 0; i--) breakBox(i);
  shocks.length = 0; projs.length = 0;
  sfx('antena', { vol: 0.9 }); G.shake = 18; G.flash = 0.45;
}
function bossThrow() {
  const b = boss, P = BP[Math.min(2, b.phase)], k = clamp(3 - b.throwsLeft, 0, 2), g = P.g;
  const x0 = b.x + b.dir * 6, y0 = b.y - 68, ty = GROUND_Y - 6;
  const vy = -Math.sqrt(2 * g * THROW_H[k]), T = (-vy + Math.sqrt(vy * vy + 2 * g * (ty - y0))) / g;
  let tx = heroCX() + hero.vx * T * 0.45;
  tx = clamp(tx, ARENA.c0 * TS - 40, GATE.x0 - 10);
  bossBoxes.push({ x: x0, y: y0, vx: (tx - x0) / T, vy, g, rot: 0, vr: (Math.sign(tx - x0) || -1) * (0.07 + 0.04 * k), w: 13, h: 11, bounce: k === 2 ? 1 : 0, kind: k, t: 0, tx });
  sfx('boss_throw', { vol: 0.85, pan: panOf(b.x), vary: 0.04 });
}
function breakBox(i) {
  const bx = bossBoxes[i]; bossBoxes.splice(i, 1);
  sfx('box_break', { vol: 0.85, pan: panOf(bx.x), vary: 0.05 }); G.shake = Math.max(G.shake, 5);
  for (let k = 0; k < 9; k++) part({ x: bx.x, y: bx.y, vx: rnd(-2.4, 2.4), vy: rnd(-3.2, -0.8), col: k % 3 ? '#2a2830' : '#8a8f9c', life: 50, size: rnd(1.4, 2.8), g: 0.22, kind: 'chunk', vr: rnd(-0.4, 0.4) });
  part({ x: bx.x, y: bx.y, vx: rnd(-1, 1), vy: -2.6, col: '#3c3a46', life: 50, size: 1, g: 0.2, kind: 'cone', vr: rnd(-0.3, 0.3) });
  dust(bx.x, Math.min(bx.y + 5, GROUND_Y), 5, 1.4);
}
function updateBossBoxes() {
  for (let i = bossBoxes.length - 1; i >= 0; i--) {
    const bx = bossBoxes[i]; bx.t++;
    bx.vy += bx.g; bx.x += bx.vx; bx.y += bx.vy; bx.rot += bx.vr;
    if (canAct() && Math.abs(bx.x - heroCX()) < bx.w / 2 + hero.w / 2 - 1 && Math.abs(bx.y - heroCY()) < bx.h / 2 + hero.h / 2 - 1) {
      knockHero(Math.sign(bx.vx) || -1); hurt(); breakBox(i); continue;
    }
    const c = Math.floor(bx.x / TS), r = Math.floor((bx.y + bx.h / 2) / TS);
    if (solidAt(c, Math.floor(bx.y / TS))) { breakBox(i); continue; }   // bateu numa parede
    if (bx.vy > 0 && solidAt(c, r)) {
      if (bx.bounce > 0) {   // a terceira quica uma vez e continua rolando na sua direção
        bx.bounce--; bx.tx = null; bx.y = r * TS - bx.h / 2; bx.vy = -Math.abs(bx.vy) * 0.48; bx.vx *= 0.9; bx.vr *= 1.4;
        sfx('bump', { vol: 0.7, rate: 0.7, pan: panOf(bx.x) }); dust(bx.x, r * TS, 4); G.shake = Math.max(G.shake, 4);
      } else { breakBox(i); continue; }
    }
    if (bx.y > VH + 40 || bx.x < 0 || bx.x > LW) bossBoxes.splice(i, 1);
  }
}
function knockHero(dir) { if (hero.inv > 0 || hero.dead || window.__god) return; hero.vx = dir * 2.6; hero.vy = -3.2; hero.onGround = false; }
function hitBoss(src) {
  const b = boss;
  if (!bossFighting() || b.state !== 'tired') return false;
  b.hp--; b.phase = Math.min(2, 3 - b.hp); b.cracks++; b.flash = 16; bossSet('hit');
  G.shake = 14; G.flash = 0.3; sfx('boss_hit', { vol: 1, pan: panOf(b.x) }); sfx('stomp', { rate: 0.7, vol: 0.8 });
  noteBurst(b.x, b.y - 40, 12, 1.8);
  for (let i = 0; i < 10; i++) part({ x: b.x + b.dir * 14, y: b.y - 32, vx: rnd(-2.6, 2.6), vy: rnd(-2.6, 0.4), col: '#fff3c4', life: 18, size: 1, g: 0.08, kind: 'spark' });
  bossSay(b.hp === 2 ? 'TOMA!' : b.hp === 1 ? 'MAIS UM!' : 'NOCAUTE!', '#ffd23f');
  if (b.hp <= 0) bossDefeat();
  return true;
}
function bossClank(x, y) {
  sfx('boss_clank', { vol: 0.8, pan: panOf(x) });
  for (let i = 0; i < 6; i++) part({ x, y, vx: rnd(-1.8, 1.8), vy: rnd(-1.8, 0.2), col: '#fff3c4', life: 14, size: 1, g: 0.05, kind: 'spark' });
  if (!boss.strongTip) { boss.strongTip = true; bossSay('MUITO FORTE! ESPERE ELE CANSAR.', '#ffd23f', false); }
}
function bossContact() {
  if (!bossFighting() || !canAct() || boss.state === 'hit') return;
  const bb = bossBody(), h = hero;
  if (!(h.x < bb.x1 && h.x + h.w > bb.x0 && h.y < bb.y1 && h.y + h.h > bb.y0)) return;
  const fromTop = h.vy > 0.4 && h.y + h.h - h.vy <= bb.y0 + 8;
  const pushOut = () => { if (heroCX() < (bb.x0 + bb.x1) / 2) h.x = bb.x0 - h.w; else h.x = bb.x1; h.vx = 0; };
  if (boss.state === 'tired') {
    if (fromTop) { hitBoss('stomp'); h.vy = input.jump ? -5.6 : -4.4; h.jumping = input.jump; h.sq = 1.2; h.y = bb.y0 - h.h; h.combo = 0; }
    else pushOut();
    return;
  }
  if (fromTop) { h.vy = -4.2; h.y = bb.y0 - h.h; h.vx += (heroCX() < boss.x ? -1 : 1) * 1.2; bossClank(heroCX(), bb.y0); return; }
  if (boss.state === 'recover' || (boss.state === 'angry' && boss.st < 24)) { pushOut(); return; }
  knockHero(Math.sign(heroCX() - boss.x) || -1); hurt(); pushOut();
}
function bossWave(w) {   // as faíscas do powerslide chegaram nele (chamado por updateWaves)
  if (!bossFighting() || w.hits.has(boss)) return false;
  const bb = bossBody();
  if (w.x > bb.x0 - 4 && w.x < bb.x1 + 4 && w.y > bb.y0 - 6 && w.y < bb.y1) {
    w.hits.add(boss);
    if (!hitBoss('slide')) bossClank(w.x, w.y);
    return true;
  }
  return false;
}
// câmera da luta (e do nocaute até o portão abrir): abre o zoom para enquadrar o herói e o chefe juntos;
// se não couber, prioriza o herói
function bossCamera() {
  if (!boss || !boss.active || G.cutscene || boss.state === 'party' || boss.state === 'hold') return null;
  const hx = heroCX();
  if (hx < ARENA.c0 * TS - 30) return null;
  const lo = Math.min(hx, boss.x) - 44, hi = Math.max(hx, boss.x) + 40;
  return { zoom: clamp(VW / (hi - lo), 0.64, 1), lo, hi, hx, onBoss: boss.defeated };   // depois do nocaute, a cena é dele
}
