'use strict';
// =================================================================== fase 1-1: Paço de São Bernardo (v7: refeita para patins; v9: cenário no Paço Municipal de São Bernardo do Campo)
const T = { E: 0, GROUND: 1, CASE: 2, BRICK: 3, NP: 4, NPEP: 5, NBAT: 6, USED: 7, AMP: 8, STAGE: 12, PLANK: 13, GATE: 14, DECK: 15 };
const DIM = { pigeon: { w: 13, h: 12 }, dog: { w: 15, h: 13 }, flower: { w: 13, h: 17 }, cat: { w: 15, h: 14 } };   // v5: 10% maiores
let map, ampAt, coins, enemies, items, waves, projs, shocks, parts, pops, signs, pianos, antenna, bumps, cp, stats, eggs, ufos, alien, drops, boss, bossBoxes;
const GRAFFITI = { x0: 144 * TS, x1: 149 * TS };
const ANT_TOP = 116;               // topo da antena (cabe na câmera com o zoom da v4)

function buildLevel() {
  map = new Uint8Array(COLS * ROWS); ampAt = new Map();
  coins = []; enemies = []; items = []; waves = []; projs = []; shocks = []; parts = []; pops = []; signs = []; pianos = []; bumps = new Map(); ufos = []; drops = [];
  ramps = []; rails = [];
  const set = (c, r, t) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) map[r * COLS + c] = t; };
  const fill = (c0, c1, r0, r1, t) => { for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) set(c, r, t); };
  const G_ = (a, b) => fill(a, b, 12, 14, T.GROUND);
  const coin = (c, r) => coins.push({ x: c * TS + 8, y: r * TS + 8, taken: false, ph: hash(c * 31 + r) * 6 });
  // tier 0 = versão de tutorial (só anda); armor = Totó com subwoofer blindado (2 golpes)
  const en = (type, c, r = 12, o = {}) => {
    const d = DIM[type], h = type === 'dog' && o.armor ? 20 : d.h, x = c * TS + (TS - d.w) / 2, y = r * TS - h;   // o subwoofer aumenta a altura do Totó
    enemies.push({ type, x, y, w: d.w, h, vx: 0, vy: 0, dir: -1, freed: false, gone: false, onGround: false, ft: 0, t: hash(c * 3) * 9, look: -1,
      tier: o.tier ?? 1, armor: !!o.armor, angry: false, state: 'walk', st: 0, hx: x, hy: y, alert: 0, cd: 60 + hash(c) * 60, hitCd: 0,
      rotor: 0, rotorV: 0, rot: 0, closedT: 0, charge: 0, aim: Math.PI, recoil: 0, spin: 0, face: o.face ?? -1, face0: o.face ?? -1, pitch: 0.5, turnT: 0, sweep: hash(c * 7) * 9, alarm: 0, alertShow: 0, popped: false });
  };
  G_(0, 59); G_(63, 106); G_(109, 163); G_(167, COLS - 1);
  // 1. v8: o treino do Merlin (pista dele, colorida): patinar até ele, pular a pilha de cases, powerslide na cerca da IA,
  //    grind no corrimão; cada etapa só libera a próxima quando o jogador consegue (ver 63-tutorial.js)
  set(6, 8, T.NP); [4, 5, 7.5].forEach(c => coin(c, 10));
  fill(TUT.crate0, TUT.crate1, 9, 11, T.CASE);                                     // 3 blocos: só passa segurando o pulo
  [[14.4, 7.4], [15.5, 5.9], [16.5, 5.9], [17.6, 7.4]].forEach(([c, r]) => coin(c, r));
  [24.5, 25.5].forEach(c => coin(c, 10));
  const tutRail = makeRail(TUT.rail0 * TS, 176, TUT.rail1 * TS, 176);           // corrimão do treino
  [29, 30, 31, 32, 33].forEach(c => coin(c, 10));
  // 2. rota alta (corrimão no andaime) x rota baixa
  makeRamp('kick', 41.5, 44, { h: 16 });                                   // pulo da rampa leva ao andaime
  coin(45.4, 8.2); coin(46.6, 6.4); coin(47.8, 5.2);
  en('dog', 45.5, 12, { tier: 0 });
  fill(48, 66, 7, 7, T.PLANK); makeRail(50 * TS, 98, 64.5 * TS, 98);
  for (let c = 51; c <= 63; c += 2) coin(c, 5);
  en('pigeon', 56, 7); en('pigeon', 50); en('flower', 57); coin(60, 9); coin(61, 8); coin(62, 9); en('dog', 66, 12, { armor: true });
  pianos.push({ c: 70, x: 70 * TS, on: false, t: 0 });
  // 3. a parede: baixinho pelo túnel, Marombado quebra, quem sobra escala (o Vigia observa de cima das caixas)
  set(77, 8, T.BRICK); set(78, 8, T.NBAT); set(79, 8, T.BRICK);
  fill(83, 84, 10, 11, T.CASE); fill(86, 87, 7, 7, T.CASE); fill(88, 89, 4, 10, T.BRICK);
  en('cat', 83.5, 10, { face: -1 });
  coin(86, 6); coin(87, 6); coin(88, 11); coin(89, 11);
  [93, 94, 95].forEach(c => coin(c, 10)); en('dog', 96, 12, { armor: true }); set(99, 8, T.BRICK); set(100, 8, T.NPEP); set(101, 8, T.BRICK); en('pigeon', 103);
  makeRamp('kick', 104.5, 107, { h: 16 });                                // na beira do buraco: rolando rápido já passa; pulando na borda, voa até a antena
  coin(107, 8); coin(108, 6.6); coin(109.5, 7.4);
  // 4. a antena do Batidão.exe e a pista em U (com o Vigia no deck)
  en('flower', 113); antenna = { x: 118 * TS, y: ANT_TOP, w: 16, h: GROUND_Y - ANT_TOP, hp: 3, alive: true, flash: 0, fall: 0, wreck: 1, lift: 0 };
  set(121, 8, T.NP); set(122, 8, T.NP); en('dog', 122, 12, { armor: true });
  fill(124, 124, 10, 11, T.CASE); fill(125, 126, 9, 11, T.DECK);            // degrau e deck da esquerda
  makeRamp('qp', 127, 130, { dir: -1 });                                   // pista em U: duas paredes de quarto de círculo
  makeRamp('qp', 133, 136, { dir: 1 });
  fill(136, 139, 9, 11, T.DECK); en('cat', 139, 9, { face: -1 });           // deck da direita com o Vigia (no fundo: dá tempo de reagir depois do pulinho)
  makeRamp('slope', 140, 143, { h: 48, dir: -1 });                         // ladeira de volta para a rua
  [[129, 7], [130, 5.4], [131.5, 4.4], [133, 5.4], [134, 7]].forEach(([c, r]) => coin(c, r));
  en('pigeon', 145.5); en('pigeon', 148);
  pianos.push({ c: 153, x: 153 * TS, on: false, t: 0 }); en('dog', 158, 12, { armor: true });
  // 5. escadas com corrimão (o terceiro Vigia no degrau) e reta final
  [1, 2, 3, 4].forEach((h, i) => fill(160 + i, 160 + i, 12 - h, 11, T.CASE));
  en('cat', 162, 9, { face: -1 });
  makeRail(163.3 * TS, 118, 167.5 * TS, 118);                              // corrimão por cima do buraco...
  makeRail(167.5 * TS, 118, 171 * TS, 174);                                // ...emendado no corrimão da descida
  [164, 165, 166].forEach(c => coin(c, 6));
  [4, 3, 2, 1].forEach((h, i) => fill(167 + i, 167 + i, 12 - h, 11, T.CASE));
  set(178, 8, T.NP); set(179, 8, T.NP); set(180, 8, T.BRICK); en('dog', 181, 12, { armor: true }); en('pigeon', 185); en('pigeon', 175.5);
  makeRail(181.5 * TS, 168, 186.5 * TS, 168); en('flower', 184);          // girassol embaixo do corrimão: por cima dela, de grind, passa ileso
  [182, 183, 184, 185, 186].forEach(c => coin(c, 10)); set(186, 7, T.NBAT);   // batata-doce antes do chefe (o pisão do Marombado também derruba o Paredão)
  // 6. arena do chefe (v6): piano de checkpoint, o Paredão, o paredão de som e a parede do backstage
  pianos.push({ c: 188, x: 188 * TS, on: false, t: 0, reach: 3 });   // a cor só chega até a entrada da arena
  fill(ARENA.gateC, ARENA.gateC + 1, 0, 11, T.GATE);
  makeBoss();
  // 7. palco
  fill(STAGE_C + 1, STAGE_C + 17, 11, 11, T.STAGE);
  signs.push(
    { c: 40.6, lines: ['PULE NA BORDA E VOE', 'NO AR: SLIDE=MANOBRA'] },
    { c: 47.5, lines: ['GIRASSOL CORTA!', 'FAÍSCA DE LONGE'] },
    { c: 76, lines: ['BAIXINHO: TÚNEL', 'FORTE: PAREDE'] },
    { c: 80.6, lines: ['VIGIA: FUJA DA LUZ', 'ALARME CHAMA TODOS'] },
    { c: 110.6, lines: ['POWERSLIDE NA', 'ANTENA: 3X'] },
    { c: 120.4, lines: ['PISTA EM U: SEGURE →', 'E PULE NA BORDA'] },
    { c: 192.3, lines: ['CHEFE: PAREDÃO', '3 CAIXAS E ELE CANSA'] },
  );
  findPipe(); makeTutorial(tutRail);
  alien = { x: 88 * TS + 10, y: 4 * TS, met: false, t: 0, beam: 0, gone: false };
  cp = { x: 3 * TS };
  let notes = 0; for (let i = 0; i < map.length; i++) if (map[i] === T.NP) notes++;
  stats = { coins: 0, coinsTotal: coins.length + notes, robots: 0, robotsTotal: enemies.length + 1, deaths: 0, score: 0, tricks: 0, bestCombo: 0 };   // +1: o Paredão
  eggs = { abducao: false, contato: false, turista: false };
}
const tileAt = (c, r) => (c < 0 || c >= COLS) ? T.GROUND : (r < 0 || r >= ROWS) ? 0 : map[r * COLS + c];
const solidAt = (c, r) => tileAt(c, r) !== 0;
function overlapsSolid(x, y, w, h) {
  for (let c = Math.floor(x / TS); c <= Math.floor((x + w - 0.01) / TS); c++) for (let r = Math.floor(y / TS); r <= Math.floor((y + h - 0.01) / TS); r++) if (solidAt(c, r)) return true;
  return false;
}
