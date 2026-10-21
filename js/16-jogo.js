'use strict';
// =================================================================== estado e lógica do jogo (passo fixo de 60 Hz)
const G = { state: 'title', prevState: 'play', frame: 0, t: 0, titleT: 0, resT: 0, winT: 0, shake: 0, flash: 0, interf: 0, lead: 0, lastBeat: -1,
  timer: { t: 0, on: false }, result: null, best: null, deathMsg: 0, coinCombo: 0, coinT: 0, ufoTimer: 1500, hintT: 0, skidCd: 0, alarmT: 0, alarmTip: false, cutscene: false, timeFrozen: false, slomo: 0 };
const cam = { x: 0, y: 92, ty: 92, zoom: 1 };
const viewW = () => VW / cam.zoom, viewH = () => VHV / cam.zoom;
const camBaseY = () => GROUND_Y - groundFrac() * viewH();
let colorX = -300, colorTarget = -300;
function loadBest() { const v = parseFloat(store.get(REC_KEY)); G.best = v > 0 ? v : null; }
loadBest();

// v7: de patins inline agressivo — arranca mais devagar, corre mais, tem embalo (rodinha) e freia no powerslide
const FORMS = [
  { name: 'BAIXINHO', w: 12, h: 14, acc: 0.0628, max: 2.51, coast: 0.026, brake: 0.14, jump: 4.2 },   // v10: mais 7% devagar (v9.1 era 0,0675 · 2,7)
  { name: 'VARAPAU', w: 10, h: 24, acc: 0.0711, max: 2.85, coast: 0.024, brake: 0.15, jump: 5.0 },
  { name: 'MAROMBADO', w: 16, h: 20, acc: 0.0519, max: 2.18, coast: 0.032, brake: 0.12, jump: 3.7 },
];
let hero;
function resetHero(x) {
  hero = { x, y: GROUND_Y - 14, w: 12, h: 14, vx: 0, vy: 0, form: 0, tfFrom: 0, tfT: 1, face: 1, onGround: true, coyote: 0, jbuf: 0, jumping: false,
    inv: 0, strum: 0, cd: 0, phase: 0, dead: false, deadT: 0, combo: 0,
    sq: 1, sqv: 0, duck: 1, hairX: 0, hairY: 0, hvx: 0, hvy: 0, badge: 0, badgeV: 0, scarf: 0, blink: 0, blinkT: 120, look: 0, mouth: 0, idleT: 0,
    ramp: null, rail: null, loop: null, lt: 0, slope: 0, rs: 0, railCd: 0, slideT: 0, slideCd: 0, slideBuf: 0, stride: 0, pushing: false, wheel: 0, ang: 0, angT: 0, airT: 0, trick: false, grindT: 0,
    takeoff: GROUND_Y, bigAir: false, grindRun: 0, man: null, manDone: [], manPts: 0, lastTrick: -1, stunT: 0, airPrev: false, happyT: 0, cheerT: 0 };
}
function setForm(f, hurtFlag) {
  const h = hero, F = FORMS[f]; let nx = h.x + h.w / 2 - F.w / 2, ny = h.y + h.h - F.h;
  if (!hurtFlag && overlapsSolid(nx, ny, F.w, F.h)) {
    let ok = false; for (const [dx, dy] of [[0, -4], [0, -8], [-4, 0], [4, 0], [-8, 0], [8, 0]]) if (!overlapsSolid(nx + dx, ny + dy, F.w, F.h)) { nx += dx; ny += dy; ok = true; break; }
    if (!ok) { pop(h.x + h.w / 2, h.y - 6, 'SEM ESPAÇO!', '#ffd23f'); return false; }
  }
  h.tfFrom = h.form; h.form = f; h.tfT = 0; h.w = F.w; h.h = F.h; h.x = nx; h.y = ny; h.sq = f === 1 ? 1.35 : f === 2 ? 0.75 : 1.2; return true;
}

// ---------- efeitos
function pop(x, y, text, col, big) { pops.push({ x, y: Math.max(y, cam.y + 0.3 * viewH()), text, col, t: 0, big: !!big }); }
function part(o) { if (parts.length < 380) parts.push(Object.assign({ vx: 0, vy: 0, g: 0.1, life: 40, size: 2, kind: 'dot', col: '#fff', rot: 0, vr: 0 }, o, { max: o.life || 40 })); }
const NOTE_COLS = ['#b6ff3b', '#ff7a1a', '#ffd23f', '#7fd4ff', '#ff3fa4'];
function noteBurst(x, y, n, spd = 1.4) { for (let i = 0; i < n; i++) part({ x, y, vx: rnd(-spd, spd), vy: rnd(-2.6, -0.8), col: NOTE_COLS[i % 5], life: 55, size: rnd(0.8, 1.2), g: 0.05, kind: 'note', vr: rnd(-0.1, 0.1) }); }
function dust(x, y, n, spread = 1) { for (let i = 0; i < n; i++) part({ x: x + rnd(-2, 2), y, vx: rnd(-0.9, 0.9) * spread, vy: rnd(-0.7, -0.1), col: '#cfc6dc', life: 26, size: rnd(1.4, 2.6), g: -0.005, kind: 'puff' }); }

// ---------- interações
function freeEnemy(e, combo = 1) {
  hero.happyT = Math.max(hero.happyT, 30);
  // v10: o liberto fica na fase, de frente para o herói, com carinha feliz e um balão de agradecimento
  e.freed = true; e.ft = 0; e.vx = 0; e.vy = -3; e.dir = (e.x + e.w / 2 < hero.x + hero.w / 2) ? 1 : -1; e.flying = e.type === 'pigeon'; stats.robots++;
  e.state = 'free'; e.alert = 0; e.alertShow = 0; e.alarm = 0; e.charge = 0; e.closedT = 0; e.thankT = THANK_T + (combo - 1) * 12;
  if (e.type === 'cat') e.vy = -2.6; else if (e.type === 'pigeon') e.vy = -1.4;   // o pombo dá só uma levantadinha e desce batendo asa
  if (combo > 1) pop(e.x + e.w / 2, e.y - 26, 'COMBO x' + combo, '#ff7a1a', true);
  if (combo >= 3) sfx('cheer', { vol: 0.6 });
  noteBurst(e.x + e.w / 2, e.y + 4, 9);
  for (let i = 0; i < 8; i++) part({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: rnd(-2, 2), vy: rnd(-2.5, 0), col: '#c9ced9', life: 30, size: rnd(1, 1.8), g: 0.18, kind: 'bolt', vr: rnd(-0.3, 0.3) });
  sfx('free', { vol: 0.7, pan: panOf(e.x), vary: 0.03 });
  // reforço sonoro: o tilintar do "obrigado" e a voz feliz do bicho, logo depois do estalo da libertação
  const at = AU.ctx ? AU.ctx.currentTime + 0.2 + (combo - 1) * 0.12 : 0, pan = panOf(e.x);
  sfx('thanks', { when: at, vol: 0.75, pan, vary: 0.02 });
  const voice = VOICE[e.type]; if (voice) sfx(voice[0], { when: at + 0.12, vol: voice[1], rate: voice[2], pan, vary: 0.04 });
}
const THANK_T = 190;   // quadros que o balão "obrigado pelo despertar" fica na tela
const VOICE = { dog: ['bark', 0.55, 1.25], cat: ['meow', 0.75, 1.12], pigeon: ['coo', 0.6, 1.3] };
function hurt() {
  if (hero.inv > 0 || hero.dead || G.state !== 'play' || G.cutscene || talk) return;
  if (window.__god) { G.godHits = (G.godHits || 0) + 1; return; }   // gancho de teste
  AU.hurtT = 1;
  if (hero.form > 0) { setForm(0, true); hero.inv = 110; sfx('hurt'); G.shake = 8; pop(hero.x + hero.w / 2, hero.y - 8, 'AI!', '#ff3b5c'); }
  else kill();
}
function kill() {
  if (hero.dead) return;
  hero.dead = true; hero.deadT = 0; hero.vx = 0; hero.vy = 0; hero.form = 0; hero.tfT = 1; stats.deaths++;
  sfx('morte', { vol: 0.9 }); AU.duck = 1; G.deathMsg = 1; G.shake = 10;
}
function respawn() { resetLadeira(); resetHero(cp.x); hero.inv = 60; G.deathMsg = 0; AU.duck = 0; calmEnemies(); resetBoss(); bossBoxes.length = 0; updateCamera(true); }
function bumpTile(c, r) {
  const t = tileAt(c, r), key = r * COLS + c;
  if (t === T.NP || t === T.NPEP || t === T.NBAT) {
    map[key] = T.USED; bumps.set(key, 10);
    if (t === T.NP) { stats.coins++; sfx('note_open', { pan: panOf(c * TS) }); part({ x: c * TS + 8, y: r * TS - 4, vy: -3.4, g: 0.2, life: 28, kind: 'pick', col: '#ff8a2a', size: 4 }); }
    else { items.push({ type: t === T.NPEP ? 'pepino' : 'batata', x: c * TS + 2, y: r * TS + 2, w: 12, h: 8, vx: 0, vy: 0, rise: 12, dir: 1, onGround: false }); sfx('item'); sfx('bump', { vol: 0.6 }); }
    for (let i = 0; i < 5; i++) part({ x: c * TS + 8, y: r * TS, vx: rnd(-1, 1), vy: rnd(-2, -0.5), col: NOTE_COLS[i], life: 40, kind: 'note', size: 0.9, g: 0.05 });
  } else if (t === T.BRICK) {
    if (hero.form === 2) breakTile(c, r); else { bumps.set(key, 10); sfx('bump', { vol: 0.8 }); }
  } else sfx('bump', { vol: 0.5 });
  for (const e of enemies) if (!e.freed && !e.gone && Math.abs(e.y + e.h - r * TS) < 3 && e.x + e.w > c * TS && e.x < c * TS + TS) hitEnemy(e, 'bump');
}
function breakTile(c, r) {
  map[r * COLS + c] = 0; sfx('brick', { pan: panOf(c * TS), vary: 0.05 }); G.shake = Math.max(G.shake, 5);
  for (let i = 0; i < 7; i++) part({ x: c * TS + 8, y: r * TS + 8, vx: rnd(-2.2, 2.2), vy: rnd(-3.6, -1), col: '#9a95a6', life: 55, size: rnd(1.8, 3.4), g: 0.25, kind: 'chunk', vr: rnd(-0.3, 0.3) });
  dust(c * TS + 8, r * TS + 12, 4);
}
function slam() {
  sfx('slam'); G.shake = 12; const cx = hero.x + hero.w / 2;
  for (let i = 0; i < 16; i++) part({ x: cx, y: hero.y + hero.h, vx: (i - 8) * 0.42, vy: rnd(-1.2, -0.2), col: '#d7cfe2', life: 32, size: rnd(1.6, 3), g: 0.02, kind: 'puff' });
  part({ x: cx, y: hero.y + hero.h, kind: 'ring', life: 22, size: 1, col: '#ff7a1a', g: 0 });
  let n = 0; for (const e of enemies) if (!e.freed && !e.gone && Math.abs(e.x + e.w / 2 - cx) < 64 && Math.abs(e.y + e.h - (hero.y + hero.h)) < 24) { n++; hitEnemy(e, 'slam', n); }
  if (bossFighting() && boss.state === 'tired' && Math.abs(boss.x - cx) < 84 && Math.abs(boss.y - (hero.y + hero.h)) < 24 && hitBoss('slam')) n++;
  if (n) pop(cx, hero.y - 16, 'PISÃO!', '#ff7a1a', true);
}
function hitAntenna() {
  const a = antenna; a.hp--; a.flash = 12; G.shake = 7; sfx('antenna_hit', { pan: panOf(a.x) });
  for (let i = 0; i < 12; i++) part({ x: a.x + 8, y: rnd(ANT_TOP + 6, 185), vx: rnd(-2.4, 2.4), vy: rnd(-2.4, 1), col: '#fff3c4', life: 18, size: 1, g: 0.08, kind: 'spark' });
  if (a.hp <= 0) {
    a.alive = false; colorTarget = Math.max(colorTarget, a.x + 32 * TS); colorX = Math.max(colorX, cam.x - 30);
    pop(a.x + 8, ANT_TOP + 8, 'SINAL CORTADO.', '#b6ff3b', true); sfx('antena'); G.shake = 18; G.flash = 0.6; noteBurst(a.x + 8, 150, 26, 2.2);
    a.abductAt = G.frame + 110;
  } else pop(a.x + 8, ANT_TOP + 18, 'FALTAM ' + a.hp, '#ffd23f');
}
// ---------- powerslide (v7): freia de lado e solta um leque de faíscas que derruba robô (antes era a onda do violão)
const SLIDE_T = 24;
function startSlide() {
  const h = hero; if (h.slideCd > 0) return;
  const dir = Math.abs(h.vx) > 0.4 ? Math.sign(h.vx) : h.face, fx = h.x + h.w / 2, fy = h.y + h.h;
  h.slideT = SLIDE_T; h.slideCd = 30; h.face = dir; h.sq = 0.86;
  h.slideWave = { x: fx + dir * 6, y: fy - 7, ox: fx + dir * 5, oy: fy - 1.5, dir, t: 0, spd: 3.6 + Math.min(3, Math.abs(h.vx)) * 0.45, hitA: false, hits: new Set() };
  waves.push(h.slideWave);
  sfx('powerslide', { vol: 0.9, pan: panOf(fx), vary: 0.04 }); G.shake = Math.max(G.shake, 2); tutSlide();
  if (!eggs.contato && fx > GRAFFITI.x0 - 8 && fx < GRAFFITI.x1 + 8 && !ufos.some(u => u.kind === 'contact')) startContact();
}
const SPARK_COLS = ['#fff3c4', '#ffd36b', '#ffb347', '#ff9a3c'];
function sparkAt(x, y, vx, vy, n = 1, life = 18) { for (let i = 0; i < n; i++) part({ x, y, vx: vx + rnd(-0.6, 0.6), vy: vy + rnd(-0.8, 0.4), col: SPARK_COLS[(Math.random() * 4) | 0], life: life * rnd(0.7, 1.1), size: 1, g: 0.16, kind: 'spark' }); }
// ---------- câmera lenta nos pulos altos (v8): passou de ~4,75 blocos acima de onde saiu do chão, o jogo desacelera de leve
// e a câmera aproxima 15% no herói; descendo perto do chão, tudo volta ao normal
const SLOMO_RISE = 76, SLOMO_NEAR = 30, SLOMO_SPEED = 0.35, SLOMO_ZOOM = 0.15;
function groundGap(h) {   // distância dos pés até o chão logo abaixo (blocos, rampa ou corrimão)
  const fx = h.x + h.w / 2, feet = h.y + h.h, c = Math.floor(fx / TS);
  let best = VH + 40 - feet;
  for (let r = Math.max(0, Math.floor(feet / TS)); r < ROWS; r++) if (solidAt(c, r)) { best = Math.min(best, r * TS - feet); break; }
  const rp = rampAt(fx); if (rp) { const ys = rampY(rp, fx); if (ys >= feet - 1) best = Math.min(best, ys - feet); }
  for (const rl of rails) if (fx >= rl.x0 && fx <= rl.x1) { const ry = railY(rl, fx); if (ry >= feet - 1) best = Math.min(best, ry - feet); }
  return Math.max(0, best);
}
function updateSlomo() {
  const h = hero;
  if (h.onGround || h.rail || h.dead) { h.takeoff = h.y + h.h; h.bigAir = false; }
  else if (!h.bigAir) {   // já subiu o bastante, ou vai subir (pela velocidade de agora)
    const rise = h.takeoff - (h.y + h.h), gUp = h.jumping && input.jump ? 0.14 : 0.36;
    if (rise + (h.vy < 0 ? h.vy * h.vy / (2 * gUp) : 0) >= SLOMO_RISE) h.bigAir = true;
  }
  const ok = G.state === 'play' && !h.dead && !G.cutscene && !(bossFighting() && heroCX() > ARENA.c0 * TS - 40);
  const want = ok && h.bigAir && !(h.vy > 0 && groundGap(h) < SLOMO_NEAR) ? 1 : 0;
  G.slomo += (want - G.slomo) * (want ? 0.09 : 0.16);
  if (G.slomo < 0.003) G.slomo = 0;
}
// ---------- manobras no ar (v8.1): no ar, o SLIDE sorteia uma de 5 manobras. Pousando inteiro, os pontos entram; mais de
// uma no mesmo voo multiplica (x2, x3...). Pousar no meio da manobra é tombo: sem dano, mas perde os pontos do voo.
const TRICKS = [
  { id: 'back', name: 'MORTAL PRA TRÁS', pts: 300, dur: 30, rate: 1.3 },
  { id: 'front', name: 'MORTAL PRA FRENTE', pts: 300, dur: 30, rate: 1.25 },
  { id: 'spin', name: 'PARAFUSO 360', pts: 200, dur: 24, rate: 1.6 },
  { id: 'star', name: 'ESTRELA', pts: 150, dur: 20, rate: 1.1 },
  { id: 'guitar', name: 'AIR GUITAR', pts: 250, dur: 26, rate: 1.0 },
];
const TRICK_SAFE = 0.8;   // pousou com 80% da manobra feita: conta como inteira
function startTrick(h) {
  let k; do { k = (Math.random() * TRICKS.length) | 0; } while (k === h.lastTrick);
  const T = TRICKS[k]; h.lastTrick = k; h.man = { k, t: 0, dur: T.dur };
  pop(h.x + h.w / 2, h.y - 12, T.name + '!', '#7fd4ff');
  sfx('air', { vol: 0.6, rate: T.rate, vary: 0.04, pan: panOf(h.x) });
  if (T.id === 'guitar') { sfx('strum_' + (chordNow() || 'A'), { vol: 0.8, pan: panOf(h.x) }); }
}
function trickFx(h) {   // rastro de brilho durante a manobra; no air guitar, notas saindo do violão
  const T = TRICKS[h.man.k], cx = h.x + h.w / 2, cy = h.y + h.h / 2;
  if (G.frame % 3 === 0) part({ x: cx + rnd(-5, 5), y: cy + rnd(-6, 6), vx: -h.vx * 0.2, vy: rnd(-0.4, 0.4), col: T.id === 'guitar' ? '#b6ff3b' : '#bfe8ff', life: 16, size: 1, g: 0, kind: 'spark' });
  if (T.id === 'guitar' && h.man.t % 9 === 4) { noteBurst(cx + h.face * 4, cy - 2, 2, 1.2); if (h.man.t === 11) sfx('strum_' + (chordNow() || 'A'), { vol: 0.65, pan: panOf(h.x) }); }
}
function finishTrick(h) {   // terminou a manobra ainda no ar
  const T = TRICKS[h.man.k]; h.manDone.push(h.man.k); h.man = null; h.manPts += T.pts;
  const n = h.manDone.length;
  if (n > 1) pop(h.x + h.w / 2, h.y - 4, 'COMBO x' + n + '!', '#ffd23f');   // a soma aparece no pouso
  sfx('pick', { rate: Math.pow(2, PENTA[Math.min(7, 2 + n)] / 12), vol: 0.75, pan: panOf(h.x) });
  for (let i = 0; i < 8; i++) part({ x: h.x + h.w / 2, y: h.y + h.h / 2, vx: Math.cos(i * 0.785) * 1.6, vy: Math.sin(i * 0.785) * 1.6, col: '#ffd23f', life: 18, size: 1, g: 0, kind: 'spark' });
}
function trickLand(h) {     // tocou no chão, numa rampa ou num corrimão
  if (h.man) { if (h.man.t / h.man.dur >= TRICK_SAFE) finishTrick(h); else { trickBail(h); return; } }
  if (!h.manDone.length) return;
  const n = h.manDone.length, total = h.manPts * n;
  stats.score += total; stats.tricks += n; stats.bestCombo = Math.max(stats.bestCombo, n);
  pop(h.x + h.w / 2, h.y - 18, '+' + total + (n > 1 ? '  COMBO x' + n + '!' : ' POUSO LIMPO!'), '#b6ff3b', n > 1 || total >= 300);
  sfx(n > 1 ? 'combo' : 'note_open', { vol: 0.7, pan: panOf(h.x) }); if (total >= 900) sfx('cheer', { vol: 0.5 });
  noteBurst(h.x + h.w / 2, h.y + 2, 4 + n * 3);
  h.manDone = []; h.manPts = 0; h.happyT = 56; if (h.onGround && !h.rail) h.cheerT = 50;   // v9: comemora com o sinal do rock
}
function trickBail(h) {      // pousou no meio: tombo (sem dano), perde os pontos do voo
  h.man = null; h.manDone = []; h.manPts = 0; h.stunT = 28; h.slideBuf = 0;
  h.vx *= 0.3; h.sq = 0.7; G.shake = Math.max(G.shake, 4);
  pop(h.x + h.w / 2, h.y - 12, 'TOMBO! SEM PONTOS', '#ff3b5c');
  sfx('land', { vol: 0.85, rate: 0.85 }); sfx('skid', { vol: 0.55 }); dust(h.x + h.w / 2, h.y + h.h, 7, 1.4);
}
const MEDALS = [59, 83, 118];   // v10 (herói mais 7% calmo): ouro, prata e bronze em segundos (v9.1: 55, 77 e 110)
function win() {
  if (G.state !== 'play') return;
  G.state = 'win'; G.winT = 0; G.timer.on = false; colorTarget = LW + 900; shocks.length = 0; projs.length = 0; G.alarmT = 0; bossBoxes.length = 0; G.cutscene = false;
  musicStop(0.25); sfx('vitoria', { vol: 1 }); AU.crowd = 1;
  const t = G.timer.t, prev = G.best, isNew = prev == null || t < prev;
  if (isNew) { store.set(REC_KEY, t.toFixed(3)); G.best = t; }
  const et = (eggs.abducao ? 1 : 0) + (eggs.contato ? 1 : 0) + (eggs.turista ? 1 : 0);
  const sPrev = parseInt(store.get(SCORE_KEY)) || 0, sNew = stats.score > sPrev;
  if (sNew) store.set(SCORE_KEY, String(stats.score));
  G.result = { t, isNew, prev, et, medal: t <= MEDALS[0] ? 'OURO' : t <= MEDALS[1] ? 'PRATA' : t <= MEDALS[2] ? 'BRONZE' : null, score: stats.score, scoreNew: sNew && stats.score > 0, scorePrev: sPrev };
}

// ---------- física
function physBody(b, g = 0.3) {
  let hitWall = false;
  b.vy = Math.min(b.vy + g, 5); b.x += b.vx;
  const r0 = Math.floor(b.y / TS), r1 = Math.floor((b.y + b.h - 0.01) / TS);
  if (b.vx !== 0) { const c = b.vx > 0 ? Math.floor((b.x + b.w - 0.01) / TS) : Math.floor(b.x / TS); for (let r = r0; r <= r1; r++) if (solidAt(c, r)) { b.x = b.vx > 0 ? c * TS - b.w : (c + 1) * TS; hitWall = true; break; } }
  if (ramps.length && rampBlock(b)) hitWall = true;   // v7: corpo das rampas é parede
  if (tut && tutBlock(b)) hitWall = true;              // v8: cerca e cancela do treino
  b.y += b.vy; b.onGround = false;
  const c0 = Math.floor(b.x / TS), c1 = Math.floor((b.x + b.w - 0.01) / TS);
  if (b.vy > 0) { const r = Math.floor((b.y + b.h - 0.01) / TS); for (let c = c0; c <= c1; c++) if (r >= 0 && solidAt(c, r)) { b.y = r * TS - b.h; b.vy = 0; b.onGround = true; break; } }
  else if (b.vy < 0) { const r = Math.floor(b.y / TS); for (let c = c0; c <= c1; c++) if (solidAt(c, r)) { b.y = (r + 1) * TS; b.vy = 0; break; } }
  return hitWall;
}
// espaço livre acima dos pés (até o primeiro bloco), para o herói se agachar em tetos baixos
function ceilRoom(h, maxUp) {
  const c0 = Math.floor((h.x + 1) / TS), c1 = Math.floor((h.x + h.w - 1) / TS), feet = h.y + h.h;
  let room = maxUp;
  for (let c = c0; c <= c1; c++) for (let r = Math.floor((h.y - 0.01) / TS); r >= Math.floor((feet - maxUp) / TS); r--) if (solidAt(c, r)) { room = Math.min(room, feet - (r + 1) * TS); break; }
  return room;
}
const approach = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);
function updateHero() {
  const h = hero;
  // molas de animação (squash & stretch, cabelo, crachá)
  h.sqv += (1 - h.sq) * 0.24; h.sqv *= 0.7; h.sq += h.sqv;
  const tx = clamp(-h.vx * 0.7, -2.4, 2.4) * h.face, ty = clamp(-h.vy * 0.45, -2, 2.2);
  h.hvx += (tx - h.hairX) * 0.22; h.hvx *= 0.74; h.hairX += h.hvx; h.hvy += (ty - h.hairY) * 0.22; h.hvy *= 0.74; h.hairY += h.hvy;
  h.badgeV += (-h.vx * 0.12 - h.badge) * 0.2; h.badgeV *= 0.85; h.badge += h.badgeV;
  h.scarf = lerp(h.scarf, clamp(Math.abs(h.vx) * 0.25 + Math.sin(G.t * 9) * 0.08, 0, 0.9), 0.15);
  if (--h.blinkT <= 0) { h.blink = 7; h.blinkT = 140 + Math.random() * 160; } if (h.blink > 0) h.blink--;
  if (h.tfT < 1) h.tfT = Math.min(1, h.tfT + 1 / 24);
  { const vis = heroVisH(FORMP[h.form]); h.duck = lerp(h.duck, clamp((ceilRoom(h, vis + 2) - 0.4) / vis, 0.62, 1), 0.3); }   // agacha sob teto baixo
  h.mouth = lerp(h.mouth, (!h.onGround && h.vy < -1) || h.strum > 0 || h.slideT > 8 ? 1 : 0, 0.25);
  if (h.dead) { h.ramp = h.rail = h.loop = null; skateAudio(h, false); h.deadT++; if (h.deadT === 24) h.vy = -5; if (h.deadT > 24) { h.vy += 0.3; h.y += h.vy; } if (h.deadT > 110) respawn(); return; }
  const F = FORMS[h.form], playing = G.state === 'play', auto = playing && G.cutscene;   // cutscene: o portão abriu, ele vai sozinho até o palco
  if (talk && h.onGround && !h.rail && !h.ramp) h.vx = approach(h.vx, 0, 0.3);   // v11: parado ouvindo a fala
  if (h.stunT > 0) h.stunT--;
  const dirIn = h.stunT > 0 ? 0 : playing && !auto ? (input.right ? 1 : 0) - (input.left ? 1 : 0) : (h.x + h.w / 2 < (GOAL_C + 3) * TS - 6 ? 1 : 0);
  h.slope = playing && !auto && !talk ? slopeK(h.x + h.w / 2) : 0;   // v11: na ladeira o embalo vem sozinho e o teto sobe
  const lim = (playing && !auto ? F.max : auto ? 1.7 : 1.1) * (1 + 0.22 * h.slope);   // v13: na ladeira o embalo é menor (o jogo fica mais calmo; a sensação de velocidade vem dos efeitos)
  if (G.skidCd > 0) G.skidCd--;
  if (h.cd > 0) h.cd--; if (h.strum > 0) h.strum--; if (h.inv > 0) h.inv--;
  if (h.slideCd > 0) h.slideCd--; if (h.railCd > 0) h.railCd--;
  if (input.jumpP && playing && !auto && h.stunT === 0) h.jbuf = 7;
  if (auto && h.onGround && !h.ramp && solidAt(Math.floor((h.x + h.w + 3) / TS), Math.floor((h.y + h.h - 2) / TS))) h.jbuf = 7;   // sobe no palco sozinho
  // botão SLIDE: no chão faz o powerslide; no ar faz uma manobra sorteada (caindo já colado no chão, guarda o powerslide)
  if (input.actP && playing && !auto && !h.rail && h.stunT === 0) {
    if (h.onGround && h.slideCd === 0) startSlide();
    else if (!h.onGround) { if (h.vy > 0 && groundGap(h) < 14) h.slideBuf = 12; else if (!h.man) startTrick(h); }
  }
  if (h.slideBuf > 0) { h.slideBuf--; if (h.onGround && !h.rail && h.slideCd === 0) { startSlide(); h.slideBuf = 0; } }
  if (h.rail) railStep(h, F);
  else if (h.loop) loopStep(h);
  else if (h.ramp) rampStep(h, F, dirIn);
  else freeStep(h, F, dirIn, lim, playing, auto);
  if (h.jbuf > 0) h.jbuf--;
  const grounded = h.onGround || !!h.rail;
  if (h.man && !grounded) { h.man.t++; trickFx(h); if (h.man.t >= h.man.dur) finishTrick(h); }
  if (h.airPrev && grounded) trickLand(h);
  // v11: grind longo vale pontos (contados quando ele sai do corrimão)
  if (h.rail || h.loop) h.grindRun++;
  else if (h.grindRun > 0) {
    if (h.grindRun >= 24 && playing) { const pts = Math.round(h.grindRun / 6) * 10; stats.score += pts; pop(h.x + h.w / 2, h.y - 14, '+' + pts + ' GRIND!', '#ffb347', pts >= 150); sfx('note_open', { vol: 0.5, rate: 1.2, pan: panOf(h.x) }); }
    h.grindRun = 0;
  }
  h.airPrev = !grounded;
  if (h.slideT > 0) {   // faíscas saindo do patins da frente
    h.slideT--;
    if (h.slideT > SLIDE_T - 17) sparkAt(h.x + h.w / 2 + h.face * (h.w / 2 + 2), h.y + h.h - 1, h.face * rnd(1.4, 4.2) + h.vx * 0.3, rnd(-2.4, -0.5), 2, 16);
    // deslizando encostado na antena também conta (de patins é fácil passar do ponto)
    const sw = h.slideWave, a = antenna;
    if (sw && !sw.hitA && a.alive && h.slideT > SLIDE_T - 18 && h.x < a.x + a.w + 6 && h.x + h.w > a.x - 6) { sw.hitA = true; hitAntenna(); }
    if (tut && tut.fence.on && h.slideT > SLIDE_T - 18 && Math.abs(heroCX() - tut.fence.x) < h.w / 2 + 9) tutFenceHit();
  }
  // pose: inclina com a rampa/corrimão; rodinhas giram com o chão
  if (!h.loop) {   // no loop o ângulo vem direto do círculo
    h.angT = h.ramp ? Math.atan(rampSlope(h.ramp, h.x + h.w / 2)) : h.rail ? Math.atan(h.rail.m) * 0.5 : 0;
    h.ang += (h.angT - h.ang) * (h.ramp || h.rail ? 0.45 : 0.12);
  }
  h.wheel += (h.onGround && !h.rail ? (h.ramp ? h.rs : h.vx) : 0) / 0.62;
  if (h.onGround) { h.coyote = 6; h.airT = 0; } else { if (h.coyote > 0) h.coyote--; h.airT++; }
  h.phase += h.onGround ? Math.abs(h.vx) * 0.105 : 0;
  h.idleT = (Math.abs(h.vx) < 0.05 && h.onGround) ? h.idleT + 1 : 0;
  if (h.happyT > 0) h.happyT--; if (h.cheerT > 0) h.cheerT--;   // v9: humor (sorriso e comemoração)
  skateAudio(h, playing || G.state === 'win');
  // dica da pista em U: preso lá dentro sem embalo por uns segundos
  if (playing && PIPE && h.x + h.w / 2 > PIPE.x0 && h.x + h.w / 2 < PIPE.x1 && h.y + h.h > PIPE.top + 8) { if (++G.pipeT === 200 && !G.pipeTip) { G.pipeTip = true; pop(h.x + h.w / 2, h.y - 22, 'SEM EMBALO? PULE NA PAREDE', '#ffd23f'); pop(h.x + h.w / 2, h.y - 12, 'E SEGURE →', '#ffd23f'); } }
  else G.pipeT = 0;
  if (h.y > VH + 24) { kill(); hero.deadT = 30; return; }
  if (!playing) return;
  for (const k of coins) if (!k.taken && Math.abs(k.x - (h.x + h.w / 2)) < h.w / 2 + 5 && k.y > h.y - 5 && k.y < h.y + h.h + 5) collectPick(k.x, k.y, k);
  for (const d of drops) if (!d.taken && Math.abs(d.x - (h.x + h.w / 2)) < h.w / 2 + 5 && d.y > h.y - 5 && d.y < h.y + h.h + 5) collectPick(d.x, d.y, d);
  if (G.coinT > 0) G.coinT--; else G.coinCombo = 0;
  for (const it of items) if (!it.taken && it.rise <= 0 && h.x < it.x + it.w && h.x + h.w > it.x && h.y < it.y + it.h && h.y + h.h > it.y) {
    it.taken = true; const f = it.type === 'pepino' ? 1 : 2;
    if (h.form === f) { pop(it.x + 6, it.y - 8, 'NATURAL!', '#b6ff3b'); sfx('pick', { rate: 1.5 }); }
    else if (setForm(f)) { sfx(f === 1 ? 'powerup_varapau' : 'powerup_marombado'); pop(h.x + h.w / 2, h.y - 12, FORMS[f].name + '!', f === 1 ? '#b6ff3b' : '#ff7a1a', true); noteBurst(h.x + h.w / 2, h.y + 6, 12); G.flash = 0.25; }
  }
  for (const p of pianos) if (!p.on && h.x + h.w > p.x && h.x < p.x + 32) {
    p.on = true; p.t = 0; cp = { x: p.x + 8 }; colorTarget = Math.max(colorTarget, p.x + (p.reach ?? 26) * TS); colorX = Math.max(colorX, cam.x - 30);
    sfx('checkpoint'); pop(p.x + 16, 142, 'SHOW SALVO.', '#ffd23f', true); noteBurst(p.x + 16, 160, 16); h.happyT = 60; if (h.onGround) h.cheerT = 50;
  }
  if (!alien.met && !alien.gone && Math.abs(h.x + h.w / 2 - alien.x) < 9 && h.y < alien.y + 2 && h.y + h.h > alien.y - 16) {
    alien.met = true; alien.t = 0; eggs.turista = true; sfx('ufo', { vol: 0.7 }); pop(alien.x + 34, alien.y + 14, 'VALEU, TERRÁQUEO!', '#7fd4ff', true); pop(alien.x + 34, alien.y + 26, 'ET ' + etCount() + '/3', '#b6ff3b');
  }
  if (h.x + h.w / 2 > GOAL_C * TS && h.onGround) win();
}
function doJump(h, F, vx, vyBase) {
  h.vx = vx; h.vy = Math.max(-5.9, Math.min(vyBase, 0) - (F.jump + Math.min(1, Math.abs(vx) / F.max) * 0.25));   // pulo com embalo de rampa: voo grande, com teto
  h.jumping = true; h.jbuf = 0; h.coyote = 0; h.onGround = false; h.trick = vyBase < -0.8; h.ramp = null;
  if (h.rail) { h.rail = null; h.railCd = 10; sparkAt(h.x + h.w / 2, h.y + h.h, -h.vx * 0.3, -1, 4); }
  sfx('jump', { rate: h.form === 1 ? 1.12 : h.form === 2 ? 0.84 : 1, vary: 0.04, vol: 0.75 }); h.sq = 1.22; dust(h.x + h.w / 2, h.y + h.h, 4);
}
function landFx(h, vy) {
  if (vy > 1.6) { h.sq = clamp(1 - vy * 0.055, 0.68, 0.92); sfx('land', { vol: clamp(vy / 5.5, 0.25, 0.8), vary: 0.05 }); sfx('land_skate', { vol: clamp(vy / 6, 0.2, 0.6), vary: 0.06, pan: panOf(h.x) }); if (vy > 3) dust(h.x + h.w / 2, h.y + h.h, 5); }
}
// modo livre: chão de blocos e ar (com a física de patins)
function freeStep(h, F, dirIn, lim, playing, auto) {
  h.pushing = false;
  if (h.slideT > 0 && h.onGround) h.vx = approach(h.vx, 0, 0.17);
  else if (dirIn) {
    if (h.vx * dirIn < -0.05) {   // freando para virar
      h.vx += dirIn * F.brake * (h.onGround ? 1 : 0.5);
      if (h.onGround && Math.abs(h.vx) > 1.4 && G.skidCd <= 0) { sfx('skid', { vol: 0.5, vary: 0.04 }); G.skidCd = 24; }
      if (h.onGround && G.frame % 3 === 0) dust(h.x + h.w / 2, h.y + h.h, 1, 0.5);
    } else if (Math.abs(h.vx) < lim) {
      h.vx = dirIn * Math.min(lim, Math.abs(h.vx) + F.acc * (h.onGround ? (Math.abs(h.vx) < 1.1 ? 1.7 : 1) : 0.55));
      h.pushing = h.onGround;
    }
    h.face = dirIn;
  } else h.vx = approach(h.vx, 0, h.onGround ? (playing && !auto ? F.coast : 0.08) : 0.006);
  if (h.slope > 0 && h.onGround && h.slideT === 0 && dirIn >= 0) { h.vx = Math.min(lim, h.vx + 0.04 * h.slope); if (dirIn === 0) h.face = 1; }   // descida: a gravidade empurra
  if (Math.abs(h.vx) > lim && h.onGround && h.slideT === 0) h.vx = Math.sign(h.vx) * Math.max(lim, Math.abs(h.vx) - 0.035);   // embalo extra das rampas some aos poucos
  if (h.pushing) { const p0 = h.stride; h.stride += 0.075 + Math.abs(h.vx) * 0.02; if (Math.floor(p0 / Math.PI) !== Math.floor(h.stride / Math.PI)) sfx('push', { vol: 0.3, vary: 0.08, pan: panOf(h.x) }); }
  if (h.jbuf > 0 && (h.onGround || h.coyote > 0)) doJump(h, F, h.vx, 0);
  const held = input.jump && playing;
  h.vy = Math.min(h.vy + ((h.vy < 0 && h.jumping && held) ? 0.14 : h.vy < 0 ? 0.36 : 0.42), 5.5);
  if (h.vy >= 0) h.jumping = false;
  const prevVy = h.vy, wasGround = h.onGround, prevX = h.x, prevFeet = h.y + h.h;
  h.x += h.vx; if (h.x < 0) { h.x = 0; h.vx = 0; } if (h.x + h.w > LW) { h.x = LW - h.w; h.vx = 0; }
  const dir = Math.sign(h.vx);
  if (dir) {
    const c = dir > 0 ? Math.floor((h.x + h.w - 0.01) / TS) : Math.floor(h.x / TS);
    const r0 = Math.floor(h.y / TS), r1 = Math.floor((h.y + h.h - 0.01) / TS);
    let solid = false, allBrick = true;
    for (let r = r0; r <= r1; r++) if (solidAt(c, r)) { solid = true; if (tileAt(c, r) !== T.BRICK) allBrick = false; }
    if (solid) {
      if (h.form === 2 && allBrick && Math.abs(h.vx) > 0.6) { for (let r = r0; r <= r1; r++) if (tileAt(c, r) === T.BRICK) breakTile(c, r); h.vx *= 0.85; }
      else { h.x = dir > 0 ? c * TS - h.w : (c + 1) * TS; h.vx = 0; }
    }
  }
  rampWalls(h, prevX); if (tut) tutWalls(h, prevX);
  h.y += h.vy; h.onGround = false;
  const c0 = Math.floor(h.x / TS), c1 = Math.floor((h.x + h.w - 0.01) / TS);
  if (h.vy > 0) {
    const r = Math.floor((h.y + h.h - 0.01) / TS); let hit = false;
    if (r >= 0) for (let c = c0; c <= c1; c++) if (solidAt(c, r)) hit = true;
    if (hit) {
      h.y = r * TS - h.h;
      if (!wasGround) { landFx(h, prevVy); h.trick = false; }
      if (h.form === 2 && prevVy >= 5) slam();
      h.vy = 0; h.onGround = true; h.combo = 0;
    }
  } else if (h.vy < 0) {
    const r = Math.floor(h.y / TS); const sl = solidAt(c0, r), sr = solidAt(c1, r);
    if (sl || sr) {
      if (sl && !sr && c0 !== c1 && (c0 + 1) * TS - h.x <= 4) h.x = (c0 + 1) * TS;
      else if (sr && !sl && c0 !== c1 && h.x + h.w - c1 * TS <= 4) h.x = c1 * TS - h.w;
      else {
        let best = -1, bd = 99; for (let c = c0; c <= c1; c++) if (solidAt(c, r)) { const d = Math.abs(c * TS + 8 - (h.x + h.w / 2)); if (d < bd) { bd = d; best = c; } }
        h.y = (r + 1) * TS; h.vy = 0.5; h.jumping = false; if (r >= 0) bumpTile(best, r); h.sq = 0.86;
      }
    }
  }
  if (!rampAttach(h, prevFeet, prevVy, wasGround) && h.vy >= 0 && h.railCd === 0) railAttach(h, prevFeet);
}
// paredes das rampas: a traseira da rampinha e a borda do quarter-pipe (quem vem por baixo bate)
function rampWalls(h, prevX) {
  for (const r of ramps) {
    if (r.kind === 'slope' || h.y + h.h <= r.top + 3 || h.y >= r.base) continue;
    if (r.dir > 0 && prevX >= r.lipX - 0.01 && h.x < r.lipX) { h.x = r.lipX; if (h.vx < 0) h.vx = 0; }
    else if (r.dir < 0 && prevX + h.w <= r.lipX + 0.01 && h.x + h.w > r.lipX) { h.x = r.lipX - h.w; if (h.vx > 0) h.vx = 0; }
  }
  const fx = h.x + h.w / 2, r = rampAt(fx);
  if (r && h.y + h.h - rampY(r, fx) > 26 && h.y < r.base) { h.x = prevX; h.vx = 0; }   // entrou fundo no corpo da curva: bate e volta
}
function rampAttach(h, prevFeet, vy0, wasGround) {
  const fx = h.x + h.w / 2, fy = h.y + h.h;
  for (const r of ramps) {
    if (fx < r.x0 || fx > r.x1 || h.y >= r.base) continue;
    const ys = rampY(r, fx);
    if (fy < ys - 0.5 || fy - ys > 26) continue;
    const m = rampSlope(r, fx), n = Math.hypot(1, m);
    h.ramp = r; h.rs = (h.vx + Math.max(0, vy0) * m) / n * (r.kind === 'qp' && Math.abs(m) > 1 ? 0.8 : 1);   // voltando de um voo na parede perde um pouco do embalo
    if (!wasGround) landFx(h, vy0);
    h.y = ys - h.h; h.vy = 0; h.onGround = true; h.jumping = false; h.trick = false; h.combo = 0;
    return true;
  }
  return false;
}
// modo rampa: anda ao longo da superfície; a gravidade puxa ladeira abaixo; segurar para a frente bombeia
function rampStep(h, F, dirIn) {
  const r = h.ramp, fx = h.x + h.w / 2;
  const m = rampSlope(r, fx), n = Math.hypot(1, m), tx = 1 / n, ty = m / n;
  const mv = Math.sign(h.rs), uphill = mv !== 0 && mv * ty < 0, pump = dirIn !== 0 && dirIn === mv;
  h.rs += RAMP_G * ty * (uphill && pump ? 0.5 : 1);
  h.pushing = false;
  if (h.slideT > 0) h.rs = approach(h.rs, 0, 0.05);   // na rampa o powerslide freia pouco (não deixa ninguém preso na pista em U)
  else if (dirIn) {
    if (mv !== 0 && dirIn !== mv && Math.abs(h.rs) > 0.3) h.rs += dirIn * F.brake * 0.6;
    else if ((!uphill || Math.abs(m) < 0.6) && Math.abs(h.rs) < F.max) { h.rs += dirIn * F.acc * 0.8; h.pushing = Math.abs(m) < 0.6; }
    if (h.pushing) h.stride += 0.075 + Math.abs(h.rs) * 0.02;
  }
  h.rs = clamp(approach(h.rs, 0, 0.004), -5.19, 5.19);   // v10: teto mais 7% menor
  if (Math.abs(h.rs) > 0.3) h.face = Math.sign(h.rs);
  if (h.jbuf > 0) { doJump(h, F, h.rs * tx, h.rs * ty); return; }   // pulo com o embalo da rampa: na subida vira voo grande
  const nfx = fx + h.rs * tx, lipSide = r.dir > 0 ? nfx > r.x1 : nfx < r.x0, lowSide = r.dir > 0 ? nfx < r.x0 : nfx > r.x1;
  if (lowSide) { h.ramp = null; h.x = nfx - h.w / 2; h.y = r.base - h.h; h.vx = h.rs; h.vy = 0; h.onGround = true; return; }
  if (lipSide) {
    if (r.kind === 'slope') { h.ramp = null; h.x = nfx - h.w / 2; h.y = r.top - h.h; h.vx = h.rs; h.vy = 0; h.onGround = true; return; }
    // borda: voa. O quarter-pipe joga reto para cima e você cai de volta na pista;
    // segurando para o lado do deck, ele dá um pulinho e sobe no deck
    const mL = rampSlope(r, r.lipX), nL = Math.hypot(1, mL);
    let vx = h.rs / nL, vy = h.rs * mL / nL;
    if (r.kind === 'qp') {
      if (dirIn === r.dir) { vx = r.dir * (1.1 + Math.abs(h.rs) * 0.2); vy = -Math.max(1.8, Math.abs(h.rs) * 0.8); h.x = r.lipX - r.dir * 4 - h.w / 2; }
      else { vx = 0; vy = -Math.abs(h.rs); h.x = r.lipX - r.dir * 7 - h.w / 2; }
    } else { h.x = nfx - h.w / 2; if (r.kind === 'kick') vy -= Math.min(1.2, Math.abs(h.rs) * 0.45); }   // a rampinha "joga" para cima: rolando rápido já passa um buraco curto
    h.y = r.top - h.h - 0.5; h.vx = vx; h.vy = Math.max(-6.6, vy); h.ramp = null; h.onGround = false; h.trick = true; h.jumping = false;
    if (h.vy < -1.2) sfx('air', { vol: clamp(-h.vy / 5, 0.25, 0.7), pan: panOf(h.x), vary: 0.05 });
    return;
  }
  h.x = nfx - h.w / 2; h.y = rampY(r, nfx) - h.h;
  const m2 = rampSlope(r, nfx), n2 = Math.hypot(1, m2);
  h.vx = h.rs / n2; h.vy = h.rs * m2 / n2; h.onGround = true;
}
// corrimão: grudar caindo por cima, deslizar (grind) e sair pela ponta ou pulando
function railAttach(h, prevFeet) {
  const fx = h.x + h.w / 2, fy = h.y + h.h;
  for (const r of rails) {
    if (fx < r.x0 - 1 || fx > r.x1 + 1) continue;
    const ry = railY(r, clamp(fx, r.x0, r.x1));
    if (fy >= ry - 0.5 && prevFeet <= ry + 2.5) {
      let s = h.vx * r.tx + h.vy * r.ty;
      if (Math.abs(s) < 1.4) s = 1.4 * (Math.sign(h.vx) || h.face);
      h.rail = r; h.ramp = null; h.rs = s; h.x = clamp(fx, r.x0, r.x1) - h.w / 2; h.y = ry - h.h; h.vy = 0; h.onGround = true; h.jumping = false; h.trick = false; h.grindT = 0;
      sfx('grind_start', { vol: 0.75, pan: panOf(fx), vary: 0.05 }); h.sq = 0.84; sparkAt(fx, ry, -s * 0.4, -1.4, 7, 18);
      return true;
    }
  }
  return false;
}
function railStep(h, F) {
  const r = h.rail; h.grindT++;
  h.rs = clamp(approach(h.rs + 0.2 * r.ty, 0, 0.0035), -4.69, 4.69);   // corrimão descendo acelera (v10: teto mais 7% menor)
  if (Math.abs(h.rs) > 0.2) h.face = Math.sign(h.rs);
  h.pushing = false;
  if (h.jbuf > 0) { doJump(h, F, h.rs * r.tx, h.rs * r.ty); return; }
  let fx = h.x + h.w / 2 + h.rs * r.tx, rr = r;
  if (fx > r.x1 || fx < r.x0) {
    const nx = railNext(r, fx > r.x1 ? 1 : -1);
    if (nx && nx.isLoop) { enterLoop(h, nx, fx - r.x1); return; }   // v11: o corrimão vira um loop
    if (nx) { rr = h.rail = nx; fx = clamp(fx, nx.x0, nx.x1); }      // emenda no corrimão seguinte
    else {   // sai na ponta com um pulinho
      h.rail = null; h.railCd = 10; h.vx = h.rs * r.tx; h.vy = Math.min(h.rs * r.ty, 0) - 1.3; h.onGround = false; h.x = fx - h.w / 2; h.trick = false;
      sparkAt(fx, railY(r, clamp(fx, r.x0, r.x1)), h.vx * 0.3, -1.2, 5);
      return;
    }
  }
  if (Math.abs(h.rs) < 0.25) { h.rail = null; h.railCd = 12; h.vy = 0.5; h.onGround = false; return; }   // perdeu o embalo: cai
  h.x = fx - h.w / 2; h.y = railY(rr, fx) - h.h; h.vx = h.rs * rr.tx; h.vy = h.rs * rr.ty; h.onGround = true; rr.glow = 1;
  sparkAt(fx - h.face * 2, h.y + h.h, -h.vx * 0.55 + rnd(-0.5, 0.5), rnd(-2.2, -0.4), G.frame % 2 ? 3 : 2, 18);   // v13: mais faísca no grind
}
// som das rodinhas e do grind (laços que acompanham a velocidade)
function skateAudio(h, on) {
  const sp = Math.abs(h.ramp ? h.rs : h.vx), roll = on && h.onGround && !h.rail && !h.dead ? clamp(sp / 3, 0, 1) : 0;
  loopSet('roll', roll * 0.4, 0.75 + roll * 0.55);
  loopSet('grind', on && h.rail ? 0.5 : 0, 0.85 + Math.min(1, Math.abs(h.rs) / 5) * 0.4);
}
function collectPick(x, y, k) {
  k.taken = true; stats.coins++; hero.happyT = Math.max(hero.happyT, 16);
  G.coinCombo = G.coinT > 0 ? G.coinCombo + 1 : 0; G.coinT = 36;
  if (G.coinCombo >= 7) { sfx('combo', { vol: 0.8 }); pop(x, y - 10, 'JOGO DE RODAS!', '#ff7a1a', true); G.coinCombo = 0; G.coinT = 0; noteBurst(x, y, 10); }
  else sfx('pick', { rate: Math.pow(2, PENTA[G.coinCombo] / 12), vol: 0.75, pan: panOf(x) });
  for (let i = 0; i < 6; i++) part({ x, y, vx: Math.cos(i) * 1.4, vy: Math.sin(i) * 1.4, col: '#ffd08a', life: 16, size: 1, g: 0, kind: 'spark' });
}
const etCount = () => (eggs.abducao ? 1 : 0) + (eggs.contato ? 1 : 0) + (eggs.turista ? 1 : 0);
function startContact() {
  const cx = (GRAFFITI.x0 + GRAFFITI.x1) / 2;
  ufos.push({ kind: 'contact', x: cx, y: cam.y - 30, ph: 0, t: 0, beam: 0, beamLen: 68, seed: 3 });
  eggs.contato = true; sfx('ufo', { vol: 0.9 });
}
function updateUFOs() {
  if (G.state === 'play' && --G.ufoTimer <= 0) { G.ufoTimer = 2400 + Math.random() * 1800; ufos.push({ kind: 'flyby', x: W / KB + 30, y: 14 + Math.random() * 34, vx: -(1.1 + Math.random() * 1.1), s: 0.32 + Math.random() * 0.25, beam: 0, seed: Math.random() * 9 }); }
  const a = antenna;
  if (!a.alive && a.abductAt && G.frame >= a.abductAt && !a.abducted) { a.abducted = true; ufos.push({ kind: 'abduct', x: a.x + 8 - 36, y: cam.y - 30, ph: 0, t: 0, beam: 0, beamLen: 74, seed: 1 }); sfx('ufo', { vol: 0.9 }); }
  for (let i = ufos.length - 1; i >= 0; i--) {
    const u = ufos[i]; u.t++;
    if (u.kind === 'flyby') { u.x += u.vx; u.y += Math.sin(u.t * 0.05) * 0.2; u.beam = ((u.t / 40) | 0) % 5 === 2 ? 0.6 : 0; u.beamLen = 40; if (u.x < -40) ufos.splice(i, 1); continue; }
    if (u.kind === 'abduct') {
      if (u.ph === 0) { u.x = lerp(u.x, a.x + 8, 0.04); u.y = lerp(u.y, 120, 0.05); if (u.t > 70) { u.ph = 1; u.t = 0; sfx('beam'); } }
      else if (u.ph === 1) { u.beam = Math.min(1, u.beam + 0.05); a.lift = Math.min(68, a.lift + 0.75); a.wreck = Math.max(0, 1 - u.t / 95); if (u.t > 100) { u.ph = 2; u.t = 0; a.wreck = 0; eggs.abducao = true; pop(a.x + 8, 112, 'ABDUÇÃO! ET ' + etCount() + '/3', '#7fd4ff', true); } }
      else { u.beam = Math.max(0, u.beam - 0.08); u.x += 4.5; u.y -= 2.2; if (u.y < -60) ufos.splice(i, 1); }
      continue;
    }
    if (u.kind === 'contact') {
      const cx = (GRAFFITI.x0 + GRAFFITI.x1) / 2;
      if (u.ph === 0) { u.y = lerp(u.y, 124, 0.06); if (u.t > 60) { u.ph = 1; u.t = 0; pop(cx, 112, 'CONTATO IMEDIATO! ET ' + etCount() + '/3', '#b6ff3b', true); } }
      else if (u.ph === 1) {
        u.beam = 0.8; u.beamCol = NOTE_COLS[Math.floor(beatNow()) % 5]; u.x = cx + Math.sin(u.t * 0.05) * 10;
        if (u.t % 22 === 0 && u.t <= 132) { drops.push({ x: u.x + rnd(-6, 6), y: u.y + 6, vy: 0, taken: false }); stats.coinsTotal++; }
        if (u.t % 30 === 0) noteBurst(u.x, u.y + 4, 4, 1);
        if (u.t > 170) { u.ph = 2; u.t = 0; sfx('ufo', { vol: 0.6, rate: 1.2 }); }
      } else { u.beam = 0; u.x -= 3.5; u.y -= 2.6; if (u.y < -60) ufos.splice(i, 1); }
    }
  }
  if (alien.met && !alien.gone) { alien.t++; if (alien.t > 40) alien.beam = Math.min(1, alien.beam + 0.025); if (alien.beam >= 1) alien.gone = true; }
  for (const d of drops) if (!d.taken) { d.vy = Math.min(d.vy + 0.18, 3.5); d.y += d.vy; const r = Math.floor((d.y + 4) / TS), c = Math.floor(d.x / TS); if (solidAt(c, r)) { d.y = r * TS - 4; d.vy = 0; } }
}
function updateItems() {
  for (const it of items) {
    if (it.taken) continue;
    if (it.rise > 0) { it.y -= 1; it.rise--; continue; }
    it.vx = it.dir * 0.6; if (physBody(it, 0.25)) it.dir *= -1;
    if (it.y > VH + 20) it.taken = true;
  }
}
function updateWaves() {   // v7: leque de faíscas do powerslide (antes, a onda do violão)
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i]; w.x += w.dir * w.spd; w.spd *= 0.95; w.t++;
    if (hero.slideT > 0) { w.ox = hero.x + hero.w / 2 + w.dir * 5; w.oy = hero.y + hero.h - 1.5; }   // o leque sai do patins enquanto ele desliza
    if (w.t % 2 === 0) sparkAt(w.x, w.y + rnd(-4, 4), w.dir * rnd(0.8, 2), rnd(-1.4, 0.2), 1, 12);
    let blocked = false;
    for (const e of enemies) if (!e.freed && !e.gone && !w.hits.has(e) && Math.abs(e.x + e.w / 2 - w.x) < 12 && Math.abs(e.y + e.h / 2 - w.y) < 14 + Math.max(0, e.h - 14) / 2) {
      w.hits.add(e); const r = hitEnemy(e, 'slide');
      if (r === true) sfx('stomp', { vol: 0.6 }); else if (r === 'blocked') blocked = true;
    }
    for (let j = projs.length - 1; j >= 0; j--) { const p = projs[j]; if (Math.abs(p.x - w.x) < 10 && Math.abs(p.y - w.y) < 12) { projs.splice(j, 1); sparkAt(p.x, p.y, w.dir, -1, 4); } }
    for (let j = shocks.length - 1; j >= 0; j--) { const sh = shocks[j]; if (Math.abs(sh.x - w.x) < 11 && Math.abs(sh.y - 4 - w.y) < 16) { shocks.splice(j, 1); sparkAt(sh.x, sh.y - 4, w.dir, -1, 4); } }
    for (let j = bossBoxes.length - 1; j >= 0; j--) { const bx = bossBoxes[j]; if (Math.abs(bx.x - w.x) < 12 && Math.abs(bx.y - w.y) < 13) { pop(bx.x, bx.y - 10, 'FORA!', '#b6ff3b'); sparkAt(bx.x, bx.y, w.dir, -1.5, 6); breakBox(j); } }
    if (tut && tut.fence.on && Math.abs(w.x - tut.fence.x) < 12 && w.y > 100) { tutFenceHit(); waves.splice(i, 1); continue; }   // v8: a faísca derruba a cerca do treino
    if (blocked || bossWave(w)) { waves.splice(i, 1); continue; }
    if (antenna.alive && !w.hitA && w.x > antenna.x - 6 && w.x < antenna.x + 22) { w.hitA = true; hitAntenna(); }
    if (w.t > 16 || solidAt(Math.floor(w.x / TS), Math.floor(w.y / TS))) waves.splice(i, 1);
  }
}
function updateProjs() {
  for (let i = projs.length - 1; i >= 0; i--) {
    const p = projs[i]; p.x += p.vx; p.y += p.vy || 0; p.life--;
    if (p.life <= 0 || solidAt(Math.floor(p.x / TS), Math.floor(p.y / TS))) { projs.splice(i, 1); continue; }
    if (!hero.dead && Math.abs(p.x - (hero.x + hero.w / 2)) < hero.w / 2 + 3 && p.y > hero.y - 3 && p.y < hero.y + hero.h + 3) { projs.splice(i, 1); hurt(); }
  }
}
function updateCamera(snap) {
  if (hero.dead && !snap) return;
  const ending = G.state === 'win' || G.state === 'results';
  const bc = !ending ? bossCamera() : null;           // luta: enquadra herói e chefe
  const zt = ending ? VHV / 206 : bc ? bc.zoom : lerp(1, LAD_ZOOM, slopeK(hero.x + hero.w / 2)) - 0.05 * SPD + SLOMO_ZOOM * G.slomo;   // v12: na ladeira a câmera abre   // no fim, a câmera abre para mostrar o palco inteiro; no pulo alto, aproxima
  cam.zoom = snap ? zt : cam.zoom + (zt - cam.zoom) * (ending || bc ? 0.035 : 0.09);   // a aproximação do pulo alto é mais rápida
  const vw = viewW(), vh = viewH(), base = camBaseY();
  G.lead += (hero.face * (30 + Math.min(3.2, Math.abs(hero.vx)) * 7 + 46 * slopeK(hero.x + hero.w / 2)) - G.lead) * 0.03;   // v12: na ladeira olha mais à frente   // de patins, olha mais longe quando está rápido (v9.1: mais calmo)
  let tx = hero.x + hero.w / 2 - vw / 2 + G.lead * (1 - 0.6 * G.slomo);
  if (ending) tx = (STAGE_C + 8) * TS - vw / 2;
  else if (bc) tx = bc.hi - bc.lo <= vw ? (bc.lo + bc.hi) / 2 - vw / 2 : bc.onBoss ? (boss.x > bc.hx ? boss.x + 52 - vw : boss.x - 52) : (boss.x > bc.hx ? bc.hx - 34 : bc.hx + 34 - vw);
  cam.x = snap ? tx : cam.x + (tx - cam.x) * (ending ? 0.05 : bc ? 0.08 : 0.12);
  cam.x = clamp(cam.x, 0, LW - vw);
  // vertical: só sobe quando o herói pisa em algo bem alto ou chega perto do topo da tela
  const feet = hero.y + hero.h;
  let ty = cam.ty;
  if (hero.onGround || ending) ty = (feet < GROUND_Y - 44 && !ending) ? feet - groundFrac() * vh : base;
  if (hero.y < ty + 0.08 * vh) ty = hero.y - 0.08 * vh;
  if (feet > ty + 0.92 * vh && feet < GROUND_Y + 2) ty = feet - 0.92 * vh;
  if (G.slomo > 0 && !ending) ty = lerp(ty, hero.y + hero.h / 2 - vh * 0.46, G.slomo);   // câmera lenta: herói no meio do quadro
  ty = clamp(ty, -24, base);
  cam.ty = ty;
  cam.y = snap ? ty : cam.y + (ty - cam.y) * (0.09 + 0.12 * G.slomo);   // no pulo alto a câmera acompanha mais firme
  cam.y = Math.min(cam.y, base);
}
function updateDanger() {
  let d = 0; const hx = hero.x + hero.w / 2;
  for (const e of enemies) if (!e.freed && !e.gone && e.x > cam.x - 40 && e.x < cam.x + viewW() + 40) {
    d += Math.abs(e.x - hx) < 130 ? 1.0 : 0.5;
    if (e.alert > 0) d += 0.35;
    if (e.state === 'dive' || e.state === 'dash' || e.state === 'charge' || e.charge > 0) d += 0.4;
  }
  d += projs.length * 0.5 + shocks.length * 0.6 + (G.alarmT > 0 ? 1.5 : 0) + bossBoxes.length * 0.6;
  if (bossFighting() && hx > ARENA.c0 * TS - 40) d += boss.state === 'tired' ? 1.4 : 3.0;   // luta com o chefe: banda pesada
  if (antenna.alive) d += 2.2 * clamp(1 - Math.abs(hx - antenna.x) / 300, 0, 1);
  d += 1.7 * slopeK(hx);   // v11: na ladeira a banda acelera
  AU.hurtT = Math.max(0, (AU.hurtT || 0) - 1 / 180); d += (AU.hurtT || 0) * 1.5;
  if (G.state !== 'play' || hero.dead) d = 0;
  const tg = clamp(d / 3.2, 0, 1);
  AU.danger += (tg - AU.danger) * (tg > AU.danger ? 0.06 : 0.012);
  AU.radio = antenna.alive ? Math.pow(clamp(1 - Math.abs(hx - antenna.x) / 320, 0, 1), 1.5) : 0;
  if (G.state === 'play') AU.crowd = 0.1 + 0.8 * (stats.robots / stats.robotsTotal) + (colorX > hx ? 0.1 : 0);
  let I = 0; if (antenna.alive) { I = clamp(1 - Math.abs(hx - (antenna.x + 8)) / 300, 0, 1); I *= I; }
  G.interf += (I - G.interf) * 0.1;
}
function updateFx() {
  if (colorX < colorTarget) {
    colorX = Math.min(colorTarget, colorX + 6);
    const sx = colorX - cam.x; if (sx > -10 && sx < viewW() + 10 && G.frame % 2 === 0) part({ x: colorX + rnd(-6, 2), y: rnd(cam.y + 6, Math.min(190, cam.y + viewH() * 0.85)), vx: rnd(0.2, 1.2), vy: rnd(-0.8, 0.2), col: NOTE_COLS[(Math.random() * 5) | 0], life: 50, size: rnd(0.6, 1), g: -0.01, kind: Math.random() < 0.4 ? 'note' : 'spark' });
  }
  for (const [k, v] of bumps) { if (v <= 1) bumps.delete(k); else bumps.set(k, v - 1); }
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr; if (p.kind === 'puff') { p.vx *= 0.94; p.size *= 1.012; } if (--p.life <= 0) parts.splice(i, 1); }
  for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.t++; p.y -= 0.3; if (p.t > 80) pops.splice(i, 1); }
  if (antenna.flash > 0) antenna.flash--; if (!antenna.alive && antenna.fall < 1) antenna.fall += 0.025;
  if (!antenna.alive && antenna.wreck > 0 && G.frame % 6 === 0) part({ x: antenna.x + 8 + rnd(-10, 10), y: 186 - antenna.lift, vx: rnd(-0.2, 0.2), vy: -0.5, col: '#5a5566', life: 70, size: rnd(3, 5), g: -0.004, kind: 'smoke' });
  for (const p of pianos) p.t++;
  for (const b of BILLBOARDS) { if (b.on) b.t += 1 / 60; }
  if (G.shake > 0) G.shake--; if (G.flash > 0) G.flash = Math.max(0, G.flash - 0.04);
}
function startGame() {
  audioInit(); buildLevel(); computeRuns(); resetHero(cp.x); G.timer = { t: 0, on: false }; colorX = colorTarget = colMap(38) * TS;   // v8: a pista do Merlin é colorida
  for (const b of BILLBOARDS) { b.on = false; b.t = 0; }
  G.state = 'play'; G.lead = 0; G.result = null; G.deathMsg = 0; G.shake = 0; G.hintT = 0; G.ufoTimer = 1500; G.coinCombo = 0; G.alarmT = 0; G.alarmTip = false; G.cutscene = false; G.timeFrozen = false; G.pipeT = 0; G.pipeTip = false; G.slomo = 0;
  AU.danger = 0; AU.duck = 0; AU.crowd = 0.1; cam.zoom = 1; updateCamera(true); musicStart(true); loadBest();
}
function update() {
  G.frame++; G.t += 1 / 60; syncInput();
  if (G.state === 'paused') { input.jumpP = input.actP = input.startP = false; return; }
  if (G.state === 'title') { G.titleT++; colorX = colorTarget = LW + 900; cam.zoom = 1; cam.x = (G.titleT * 0.25) % 1100; cam.y = cam.ty = camBaseY(); hero.x = cam.x + VW * 0.7; if (input.startP) { if (nameAsking()) confirmName(); else startGame(); } input.jumpP = input.actP = input.startP = false; updateFx(); musicUpdate(); return; }
  if (G.state === 'results') {   // o show continua atrás do placar: a banda toda tocando e o Gabriel no violão
    G.resT++; if (G.resT > 50 && input.startP) startGame(); input.jumpP = input.actP = input.startP = false; updateFx(); updateEnemies(); updateBoss();
    if (G.frame % 16 === 0) hero.strum = 16; else if (hero.strum > 0) hero.strum--;
    if (G.resT === 30) { AU.danger = 0.9; AU.crowd = 1; musicStart(false); } else if (G.resT > 30) AU.danger = lerp(AU.danger, G.resT < 1000 ? 0.9 : 0.5, 0.01);
    musicUpdate(); return;
  }
  if (G.state === 'play' && !G.timer.on && !G.timeFrozen && !hero.dead && !talk && !(tut && tut.active) && (input.left || input.right || input.jumpP)) G.timer.on = true;   // v8: só depois do treino
  if (G.timer.on && !talk) G.timer.t += 1 / 60;   // v11: o tempo para enquanto alguém fala
  G.hintT++;
  updateTalk();
  updateHero(); updateSlomo(); updateTutorial(); updateEnemies(); updateLadeira(); updateBoss(); updateShocks(); updateItems(); updateWaves(); updateProjs(); updateUFOs(); updateFx(); updateCamera(false); updateDanger(); musicUpdate();
  if (G.state === 'win') {
    G.winT++;
    if (G.winT % 24 === 0) { hero.strum = 16; noteBurst(hero.x + hero.w / 2, hero.y, 6); }
    if (G.winT > 150 && G.winT < 330 && G.winT % 26 === 0 && hero.onGround) { hero.vy = -3.2; hero.sq = 1.2; }
    if (G.winT % 2 === 0) part({ x: cam.x + rnd(0, viewW()), y: cam.y - 6, vx: rnd(-0.4, 0.4), vy: rnd(0.6, 1.4), col: NOTE_COLS[G.winT % 5], life: 200, size: rnd(1.6, 2.6), g: 0.004, kind: 'confetti', vr: rnd(-0.2, 0.2) });
    if (G.winT > 420 || (G.winT > 90 && input.startP)) { G.state = 'results'; G.resT = 0; for (const n in AU.loops) loopSet(n, 0); }
  }
  input.jumpP = input.actP = input.startP = false;
}
