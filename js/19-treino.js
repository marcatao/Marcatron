'use strict';
// =================================================================== treino com o Merlin (v8; v11: falas com pausa, história e mais lições)
// Começo da fase: o Merlin conta a história (a IA dominou o mundo e a gente vai salvar os humanos e os animais) e ensina em
// ordem: patinar, pular, powerslide, manobra no ar, resgatar um bicho com o powerslide, resgatar outro pulando em cima dele
// e o corrimão. Cada fala trava o herói até o jogador apertar ESPAÇO (ou tocar na tela); cada etapa só libera a próxima
// quando o jogador consegue. Obrigatório na primeira vez no aparelho; nas próximas, o Merlin só cumprimenta e libera tudo.
// O cronômetro só começa depois do treino.
const TUT_KEY = 'marcatron.treino.v11';   // v11: treino novo, todo mundo vê de novo
const TUT = { s1: 9.5, s2: 13.2, crate0: 15, crate1: 16, s3: 18.8, fence: 22.5, s4: 25, kick0: 27, kick1: 29.5,
  s5: 32.6, pen1: [34.5, 39.5], s6: 41, pen2: [42.5, 47.5], s7: 48.6, rail0: 50.5, rail1: 56, gate: 57.5, sEnd: 56.6 };   // a cancela só abre depois da última fala
const TUT_STEPS = ['PATINAR', 'PULAR', 'SLIDE', 'MANOBRA', 'RESGATE 1', 'RESGATE 2', 'CORRIMÃO'];
const TUT_N = TUT_STEPS.length;
const TUT_WAIT = 720;   // quadros sem completar a lição até o Merlin vir repetir (12 s)
let tut = null;
function makeTutorial(rail, dog, pigeon) {
  const first = store.get(TUT_KEY) !== '1';
  tut = {
    first, active: first, step: first ? 1 : TUT_N + 1, t: 0, stepT: 0, rail, dog, pigeon, tricks0: 0,
    fence: { x: TUT.fence * TS, on: first, off: first ? 0 : 1 },
    gate: { x: TUT.gate * TS, pass: !first, open: first ? 0 : 1 },
    pending: null, bump: null, passed: false, doneT: null, endTalked: false, waitT: 0, visitX: null, repeatN: 0,
    m: { x: TUT.s1 * TS, y: GROUND_Y, vx: 0, vy: 0, face: -1, state: 'ground', target: null, next: null, stride: 0, wheel: 0, t: 0, cheerT: 0, talk: 0, talkT: 0, blinkT: 120, blink: 0, hairDX: 0, sparkT: 0 },
  };
  tut.pending = tutPages(tut.step);
}
const KEYS = () => touchUI ? { right: 'O DIRECIONAL [→]', jump: '[PULAR]', act: '[SLIDE]' } : { right: '[→]', jump: '[ESPAÇO]', act: '[X]' };
// falas de cada etapa (cada item é uma página do balão; o jogador passa com ESPAÇO)
function tutPages(step) {
  const k = KEYS(), n = NAME_UP();
  switch (step) {
    case 1: return [
      whoPage(),
      () => ['OLÁ, ' + NAME_UP() + '! EU SOU O MERLIN,', 'PROFESSOR DE PATINS AQUI DO PAÇO.'],
      ['PRESTA ATENÇÃO: A IA DOMINOU O MUNDO.', 'ELA PLUGOU UM CHIP EM CADA SER VIVO.'],
      ['GENTE E BICHO VIRARAM ROBÔ: OBEDECEM', 'SEM PENSAR, SEM MÚSICA, SEM ALEGRIA.'],
      ['A NOSSA MISSÃO É SALVAR OS HUMANOS', 'E OS ANIMAIS. MAS ANTES: TREINO!'],
      ['ISTO AQUI É O TUTORIAL: SÃO 7 LIÇÕES', 'RAPIDINHAS. O TEMPO SÓ CONTA DEPOIS DELAS.'],
      ['SEGURA ' + k.right + ' PRA REMAR', 'E VEM ATÉ MIM!']];
    case 2: return [['ISSO! TÁ PATINANDO!', 'AGORA O PULO: PASSA POR CIMA DAS CAIXAS.', 'SEGURA ' + k.jump + ' PRA PULAR MAIS ALTO.']];
    case 3: return [['BOA! VOOU ALTO!', 'ESSA CERCA DA IA SÓ DESLIGA COM FAÍSCA.'], ['CHEGA PERTO DELA E DÁ UM', 'POWERSLIDE: ' + k.act + '!']];
    case 4: return [['IRADO! VIU AS FAÍSCAS?', 'AGORA, AS MANOBRAS.'], ['PULA NA RAMPINHA E, LÁ NO AR,', 'APERTA ' + k.act + ' PRA FAZER UMA MANOBRA.'], ['CADA MANOBRA DÁ PONTOS. SÓ NÃO DEIXA', 'PRA ÚLTIMA HORA: TEM QUE POUSAR LIMPO!']];
    case 5: return [['QUE MANOBRA, ' + n + '!'], ['TÁ VENDO ESSE CACHORRO? A IA CONTROLA ELE.', 'OLHA O OLHO VERMELHO DO CHIP...'], ['A FAÍSCA DO POWERSLIDE QUEIMA O CHIP.', 'CHEGA PERTO DELE E DÁ UM ' + k.act + '!']];
    case 6: return [['ELE ACORDOU! OLHA COMO TÁ FELIZ!'], ['ESSE POMBO TAMBÉM TÁ PLUGADO NA IA.', 'DESSA VEZ, PULA EM CIMA DELE! ' + k.jump]];
    case 7: return [['VIU SÓ? MAIS UM LIVRE!'], ['É ASSIM QUE A GENTE SALVA O MUNDO:', 'DESLIGANDO A IA DOS SERES VIVOS.'], ['POWERSLIDE OU PULO NA CABEÇA: CADA UM QUE', 'VOCÊ DESPERTA VOLTA A SENTIR A MÚSICA.'], ['ÚLTIMA LIÇÃO: O CORRIMÃO.', 'PULA EM CIMA DELE E DESLIZA ATÉ O FIM!']];
    default: return tut && tut.first
      ? [['MANDOU BEM, ' + n + '! TREINO COMPLETO.'], ['AGORA É COM VOCÊ: LIBERTA A CIDADE', 'E DESLIGA A IA DE TODO MUNDO!'], ['DICA: NO AR, ' + k.act + ' FAZ MANOBRA', 'E DÁ PONTOS. CAPRICHA!']]
      : [whoPage(),
        () => ['OLÁ, ' + NAME_UP() + '! JÁ SABE O ESQUEMA:', 'A IA DOMINOU O MUNDO E A GENTE DESLIGA ELA.'], ['POWERSLIDE OU PULO NA CABEÇA', 'DESPERTA QUEM TÁ PLUGADO. BORA!']];
  }
}
// v17: a primeira fala de toda partida: sem nome salvo, pergunta o nome; com nome salvo, confirma se é a mesma pessoa
const whoPage = () => G.newSkater ? ['NOME NOVO POR AQUI? ENTÃO O TREINO É OBRIGATÓRIO!', 'NINGUÉM PATINA NA MINHA CIDADE SEM TREINAR.']
  : store.get(NAME_KEY)
  ? () => ({ ask: 'who', lines: ['E AÍ! É VOCÊ MESMO, ' + NAME_UP() + '?', 'OU QUER TROCAR O NOME?'] })
  : { ask: 'name', lines: ['E AÍ, PATINADOR! CHEGA MAIS.', 'ANTES DE TUDO: QUAL É O SEU NOME?'] };
const TUT_ST = [null, 's1', 's2', 's3', 's4', 's5', 's6', 's7'];
// v14: o objetivo de cada lição, sempre visível no topo da tela durante o tutorial
function tutGoal(step) {
  const k = touchUI ? { r: 'DIRECIONAL →', j: 'PULAR', a: 'SLIDE' } : { r: '→', j: 'ESPAÇO', a: 'X' };
  return ['', 'PATINE ATÉ O MERLIN: SEGURE ' + k.r, 'PULE AS CAIXAS: SEGURE ' + k.j + ' PARA PULAR ALTO', 'DÊ UM POWERSLIDE (' + k.a + ') PERTO DA CERCA DA IA',
    'PULE NA RAMPINHA E APERTE ' + k.a + ' NO AR (MANOBRA)', 'SALVE O CACHORRO COM UM POWERSLIDE (' + k.a + ')', 'SALVE O POMBO PULANDO EM CIMA DELE (' + k.j + ')',
    'PULE NO CORRIMÃO E DESLIZE ATÉ O FIM'][step] || 'FALE COM O MERLIN PARA TERMINAR O TREINO';
}
const tutStation = step => (step <= TUT_N ? TUT[TUT_ST[step]] : tut.first ? TUT.sEnd : TUT.s1) * TS;
function tutStepDone() {
  const m = tut.m;
  tut.step++; tut.stepT = 0; tut.bump = null; tut.tricks0 = stats.tricks; tut.waitT = 0; tut.visitX = null; tut.repeatN = 0;
  m.cheerT = 54; m.next = tutStation(tut.step);
  sfx('combo', { vol: 0.7 }); noteBurst(m.x, m.y - MERLIN_H, 10, 1.6);
  tut.pending = tutPages(tut.step);
}
function tutFinish() {
  tut.active = false; tut.gate.pass = true; store.set(TUT_KEY, '1');
  sfx('checkpoint', { vol: 0.9 }); sfx('gate', { vol: 0.5, rate: 1.4 });
  tut.doneT = 0;
}
// ---------- conversa (v11): o balão escreve letra por letra; o herói fica parado até o jogador passar a fala
let talk = null;
const TALK_CPS = 1.35;   // letras por quadro
// uma página é uma lista de linhas, uma função que devolve as linhas (montada na hora, ex.: com o nome que acabou de ser
// digitado) ou {ask: 'name', lines} — a página que pergunta o nome do patinador
function talkPage(p) { const v = typeof p === 'function' ? p() : p; return Array.isArray(v) ? { lines: v } : v; }
const talkLen = page => page.lines.join('').replace(/[\[\]]/g, '').length;
function startTalk(pages, who, onEnd) {
  talk = { pages, i: 0, n: 0, t: 0, who, onEnd, page: talkPage(pages[0]), asking: false };
  hero.jbuf = 0; hero.slideBuf = 0;
  if (who) who.talkT = 30;
}
function talkNext() {
  if (talk.i < talk.pages.length - 1) { talk.i++; talk.n = 0; talk.t = 0; talk.page = talkPage(talk.pages[talk.i]); sfx('click', { vol: 0.5 }); }
  else { const f = talk.onEnd; talk = null; sfx('click', { vol: 0.5, rate: 1.2 }); if (f) f(); }
}
function talkNameAnswered() {   // o jogador digitou o nome (ver 04-entrada.js)
  if (!talk || talk.asking !== 'name') return;
  talk.asking = false; talk.page.ask = null; sfx('combo', { vol: 0.5 });
  // v18: trocou para um nome que ainda não está no ranking (fora do treino): volta o tutorial obrigatório, do começo
  if (tut && !tut.active && !RANK.list.some(r => rankKey(r.name) === rankKey(heroName))) {
    talk = null; store.set(TUT_KEY, ''); G.newSkater = true; startGame(); G.newSkater = false; return;
  }
  talkNext();
}
function talkWho(yes) {   // respondeu "é você mesmo?" (ver 04-entrada.js)
  if (!talk || talk.asking !== 'who') return;
  talk.asking = false; talk.page.ask = null;
  if (!yes) talk.pages.splice(talk.i + 1, 0, { ask: 'name', lines: ['BELEZA! ENTÃO ME DIZ:', 'QUAL É O SEU NOME?'] });
  sfx(yes ? 'combo' : 'click', { vol: 0.5 }); talkNext();
}
function updateTalk() {
  if (!talk) return false;
  talk.t++;
  const len = talkLen(talk.page);
  if (talk.n < len) { talk.n = Math.min(len, talk.n + TALK_CPS); if (talk.t % 4 === 0) sfx('click', { vol: 0.12, rate: 1.5 + Math.random() * 0.5 }); if (talk.who) talk.who.talkT = 12; }
  else if (talk.page.ask && !talk.asking) { talk.asking = talk.page.ask; if (talk.asking === 'who') askWho(); else askName(); }
  if (talk.asking === 'who' && (input.jumpP || input.startP)) answerWho(true);   // ESPAÇO/ENTER = sou eu
  else if (!talk.asking && (input.jumpP || input.actP || input.startP) && talk.t > 6) {
    if (talk.n < len) talk.n = len; else if (!talk.page.ask) talkNext();
  }
  input.jumpP = input.actP = input.startP = false;   // as teclas da conversa não viram pulo nem slide
  input.left = input.right = input.jump = false;
  return true;
}
// a fala da etapa começa quando o Merlin chega no ponto dele e o herói está por perto, de pé no chão
function tutTryTalk() {
  const m = tut.m, h = hero;
  if (!tut.pending || talk || G.state !== 'play' || h.dead || !h.onGround || h.rail || h.ramp) return;
  if (m.target != null || m.next != null || m.cheerT > 0 || m.state !== 'ground') return;
  if (Math.abs(heroCX() - m.x) > 170) return;
  const pages = tut.pending, rep = tut.visitX != null; tut.pending = null;
  if (tut.step > TUT_N) tut.endTalked = true;
  startTalk(pages, m, () => { tut.waitT = 0; tut.visitX = null; if (!rep && tut.active && tut.step > TUT_N) tutFinish(); });
}
function tutFenceHit() {
  const f = tut.fence; if (!f.on) return;
  f.on = false; G.shake = Math.max(G.shake, 7); sfx('antenna_hit', { vol: 0.9, pan: panOf(f.x) }); sfx('free', { vol: 0.5, rate: 0.8 });
  for (let i = 0; i < 18; i++) part({ x: f.x + rnd(-4, 4), y: rnd(150, 190), vx: rnd(-2.4, 2.4), vy: rnd(-2.6, 0.4), col: SPARK_COLS[i % 4], life: 22, size: 1, g: 0.12, kind: 'spark' });
  pop(f.x, 150, 'CURTO-CIRCUITO!', '#ffd23f');
}
// paredes do treino: a cerca (até desligar) e a cancela (até o fim do treino) seguram o herói até o topo do mundo.
// v11: enquanto a etapa do resgate não chega, o bicho do cercadinho fica atrás de uma parede invisível
function tutWallList() {
  const L = []; if (!tut) return L;
  if (tut.fence.on) L.push({ x0: tut.fence.x - 5, x1: tut.fence.x + 5, k: 3 });
  const locked = n => tut.active && (tut.step < n || (tut.step === n && tut.pending));   // só passa depois da fala da etapa
  if (locked(4)) L.push({ x0: TUT.kick0 * TS - 3, x1: TUT.kick0 * TS + 1, k: 5 });
  if (locked(5)) L.push({ x0: TUT.pen1[0] * TS - 3, x1: TUT.pen1[0] * TS + 1, k: 5 });
  if (locked(6)) L.push({ x0: TUT.pen2[0] * TS - 3, x1: TUT.pen2[0] * TS + 1, k: 6 });
  if (locked(7)) L.push({ x0: TUT.rail0 * TS - 14, x1: TUT.rail0 * TS - 10, k: 4 });
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
const TUT_BUMPS = {
  3: k => ['CALMA! ESSA CERCA SÓ CAI COM FAÍSCA:', 'DÁ UM POWERSLIDE PERTO DELA! ' + k.act],
  4: k => tut.step < 7 || tut.pending ? ['AINDA NÃO! TERMINA A LIÇÃO DE AGORA', 'E VEM FALAR COMIGO.'] : ['NO CORRIMÃO! VOLTA, PEGA EMBALO', 'E PULA EM CIMA DELE. ' + k.jump],
  5: k => tut.step < 5 || tut.pending ? ['CALMA, UMA LIÇÃO DE CADA VEZ!', 'VEM FALAR COMIGO PRIMEIRO.'] : ['PRIMEIRO A MANOBRA: PULA NA RAMPINHA', 'E APERTA ' + k.act + ' NO AR!'],
  6: k => tut.step < 6 && !tut.pending ? ['ANTES, SALVA O CACHORRO', 'COM O POWERSLIDE! ' + k.act] : ['CALMA, UMA LIÇÃO DE CADA VEZ!', 'VEM FALAR COMIGO PRIMEIRO.'],
};
function tutBump(k) {
  if ((tut.bump && tut.bump.t < 90) || talk) return;
  tut.bump = { t: 0, lines: TUT_BUMPS[k](KEYS()) };
  tut.m.talkT = 90; sfx('bump', { vol: 0.5, rate: 1.3 });
}
function tutHint(lines) {   // dica que não trava o jogo (ex.: resgate do jeito errado)
  if (!tut || talk || (tut.bump && tut.bump.t < 60)) return;
  tut.bump = { t: 0, lines }; tut.m.talkT = 90; sfx('bump', { vol: 0.45, rate: 1.4 });
}
// v11: os bichos do treino exigem o jeito certo: o cachorro só com faísca, o pombo só com pulo na cabeça
function tutRescueOk(e, src) {
  if (!e.tutReq) return true;
  const k = KEYS();
  if (e.tutReq === 'slide' && !SPARKY[src]) { tutHint(['ESSE AÍ É COM O POWERSLIDE!', 'CHEGA PERTO E APERTA ' + k.act]); return false; }
  if (e.tutReq === 'stomp' && src !== 'stomp' && src !== 'slam') { tutHint(['ESSE AÍ É PULANDO EM CIMA!', 'APERTA ' + k.jump + ' E CAI NELE.']); return false; }
  return true;
}
function tutSlide() {   // o herói deu um powerslide: encostado na cerca também vale; longe demais, o Merlin avisa
  if (!tut || !tut.fence.on || tut.step !== 3) return;
  const d = tut.fence.x - heroCX();
  if (d > 60 && d < 200) tutHint(['MAIS PERTO DA CERCA!', 'A FAÍSCA SÓ VAI UNS 2 BLOCOS.']);
}
function tutGround(x) { return x >= TUT.crate0 * TS - 3 && x <= (TUT.crate1 + 1) * TS + 3 ? 9 * TS : GROUND_Y; }
function updateTutorial() {
  if (!tut) return;
  const m = tut.m, h = hero, hx = heroCX(), playing = G.state === 'play';
  tut.t++; tut.stepT++; m.t += 1 / 60;
  if (tut.bump) { tut.bump.t++; if (tut.bump.t > 150) tut.bump = null; }
  // v14: demorou para fazer a lição? o Merlin vem até o jogador e repete a instrução
  if (tut.active && playing && !talk && !tut.pending && !h.dead && tut.step <= TUT_N && m.cheerT === 0 && m.next == null) {
    if (++tut.waitT > TUT_WAIT) {
      tut.waitT = 0; tut.repeatN++;
      const pages = tutPages(tut.step);
      tut.pending = [[(tut.repeatN > 1 ? 'SEM PRESSA, ' : 'VAMOS LÁ, ') + NAME_UP() + '! VOU REPETIR:'], pages[pages.length - 1]];
      if (Math.abs(hx - m.x) > 110) {
        let vx = clamp(hx + (m.x < hx ? -38 : 38), TUT.s1 * TS, tutStation(tut.step));
        if (vx > TUT.crate0 * TS - 12 && vx < (TUT.crate1 + 1) * TS + 12) vx = TUT.crate0 * TS - 14;   // não para em cima das caixas
        tut.visitX = vx;
      }
    }
  }
  // ----- etapas (só contam fora das falas)
  if (playing && tut.active && !h.dead && !talk && !tut.pending) {
    const s = tut.step;
    if (s === 1 && hx >= m.x - 26) tutStepDone();
    else if (s === 2 && h.x > (TUT.crate1 + 1) * TS + 2 && h.onGround) tutStepDone();
    else if (s === 3 && !tut.fence.on) tutStepDone();
    else if (s === 4 && stats.tricks > tut.tricks0) tutStepDone();
    else if (s === 5 && tut.dog.freed) tutStepDone();
    else if (s === 6 && tut.pigeon.freed) tutStepDone();
    else if (s === 7 && h.rail === tut.rail && h.grindT >= 8) tutStepDone();
  }
  if (!tut.fence.on && tut.fence.off < 1) tut.fence.off = Math.min(1, tut.fence.off + 0.04);
  if (tut.gate.pass && tut.gate.open < 1) tut.gate.open = Math.min(1, tut.gate.open + 0.035);
  // ----- o Merlin: vai até o ponto da etapa (pulando as caixas, a rampinha e deslizando no corrimão), comemora e explica
  if (m.cheerT > 0 && --m.cheerT === 0 && m.next != null) { m.target = m.next; m.next = null; }
  const home = tut.visitX != null ? tut.visitX : tutStation(tut.step);   // o posto da lição (ou perto do jogador, quando vem repetir)
  if (m.target == null && m.next == null && m.cheerT === 0 && m.state === 'ground' && Math.abs(m.x - home) > 3) m.target = home;
  if (m.target != null && m.cheerT === 0) {
    const d = m.target - m.x;
    if (Math.abs(d) < 2.5 && m.state === 'ground') { m.x = m.target; m.target = null; m.vx = 0; }
    else { m.vx = approach(m.vx, Math.sign(d) * 2.3, 0.14); if (m.state !== 'grind') m.face = Math.sign(d) || m.face; }
  } else if (m.state === 'ground') m.vx = approach(m.vx, 0, 0.18);
  if (m.state === 'ground' && m.vx > 0.6 && m.target != null) {
    const c0 = TUT.crate0 * TS, k0 = TUT.kick0 * TS, r = tut.rail;
    if (m.x < c0 && m.x > c0 - 24 && m.target > c0) { m.state = 'air'; m.vy = -6.1; sfx('jump', { vol: 0.35, rate: 0.85, pan: panOf(m.x) }); }
    else if (m.x < k0 && m.x > k0 - 10 && m.target > k0) { m.state = 'air'; m.vy = -4.8; sfx('jump', { vol: 0.3, rate: 0.85, pan: panOf(m.x) }); }
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
  tutTryTalk();
  // depois do treino: quando o herói passa por ele, um "vai!"
  if (tut.doneT != null) tut.doneT++;
  const atEnd = m.target == null && m.state === 'ground' && Math.abs(m.x - tutStation(TUT_N + 1)) < 4;
  if (!tut.active && !tut.passed && atEnd && hx > m.x + 20 && playing && !talk) { tut.passed = true; tut.bump = { t: 0, lines: ['VAI, ' + NAME_UP() + '! ARREBENTA!'] }; m.cheerT = Math.max(m.cheerT, 40); }
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
// v14: no mundo, só uma seta pulando em cima de quem está falando (o texto vai numa caixa fixa na tela, ver drawTalkBox)
function drawTutorialBubble(g) {
  const w = talk && talk.who;
  if (!w) return;
  const b = Math.abs(Math.sin(G.t * 5)) * 3, y = w.y - MERLIN_H - 7 - b;
  g.beginPath(); g.moveTo(w.x - 3.4, y - 4.4); g.lineTo(w.x + 3.4, y - 4.4); g.lineTo(w.x, y); g.closePath(); fillStroke(g, '#b6ff3b', 0.6);
  glow(g, w.x, y - 2, 9, '#b6ff3b', 0.5);
}
// caixa de fala na tela: embaixo, por cima de tudo, com o retrato e o nome do Merlin; escreve letra por letra
function talkText(lines, x, y, lh, fs, reveal) {
  let left = Math.floor(reveal);
  ctx.font = `800 ${fs}px ${FONT_UI}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => {
    let cx = x;
    for (const part of l.split(/(\[[^\]]+\])/)) {
      if (!part || left <= 0) continue;
      const key = part[0] === '[';
      let txt = key ? part.slice(1, -1) : part;
      if (txt.length > left) txt = txt.slice(0, left);
      left -= txt.length;
      ctx.fillStyle = key ? '#ff9a3c' : '#fff8ea'; ctx.fillText(txt, cx, y + i * lh); cx += ctx.measureText(txt).width;
    }
  });
}
function drawTalkBox(u) {
  if (!talk || (G.state !== 'play' && G.state !== 'paused')) return;
  const page = talk.page, done = talk.n >= talkLen(page), sc = H / cssH;
  const side = touchUI ? 200 * sc : 24 * u, bw = Math.min(W - side * 2, 940 * u), fs = Math.max(15 * sc, 25 * u), lh = fs * 1.32;
  const pr = 50 * u, bh = Math.max(pr * 2 + 26 * u, page.lines.length * lh + 64 * u), bx = (W - bw) / 2, by = H - bh - (touchUI ? 12 * sc : 18 * u);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(ctx, bx + 4 * u, by + 6 * u, bw, bh, 18 * u); ctx.fill();
  rr(ctx, bx, by, bw, bh, 18 * u); ctx.fillStyle = 'rgba(16,11,30,0.96)'; ctx.fill(); ctx.strokeStyle = '#b6ff3b'; ctx.lineWidth = 3 * u; ctx.stroke();
  // retrato do Merlin
  const pcx = bx + 22 * u + pr, pcy = by + bh / 2, w = talk.who;
  ctx.save(); ell(ctx, pcx, pcy, pr, pr); const pg = ctx.createRadialGradient(pcx, pcy - pr * 0.3, 4 * u, pcx, pcy, pr); pg.addColorStop(0, '#3b5f8a'); pg.addColorStop(1, '#1a1030'); ctx.fillStyle = pg; ctx.fill(); ctx.clip();
  const s = pr * 3.3 / MERLIN_H; ctx.translate(pcx + 4 * u, pcy + MERLIN_H * s * 0.82); ctx.scale(s, s);   // close no rosto
  drawMerlin(ctx, { t: G.t, mode: done ? 'idle' : 'talk', stride: 0, wheel: 0, vy: 0, talk: done ? 0 : 0.5 + 0.5 * Math.sin(G.t * 15), hairDX: 0, hairDY: 0, blink: (G.frame % 170) < 6 });
  ctx.restore();
  ell(ctx, pcx, pcy, pr, pr); ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 2.5 * u; ctx.stroke();
  // aba com o nome de quem fala
  const tag = 'MERLIN · PROFESSOR DE PATINS'; ctx.font = `800 ${15 * u}px ${FONT_UI}`; const tw = ctx.measureText(tag).width + 26 * u;
  rr(ctx, bx + 2 * pr + 40 * u, by - 15 * u, tw, 30 * u, 10 * u); ctx.fillStyle = '#7fd4ff'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2 * u; ctx.stroke();
  uiText(tag, bx + 2 * pr + 40 * u + tw / 2, by, 15 * u, '#140f1f', 'center', 800, FONT_UI, false);
  // texto e rodapé
  const tx = bx + 2 * pr + 44 * u, ty = by + 30 * u + fs * 0.5;
  talkText(page.lines, tx, ty, lh, fs, talk.n);
  const fy = by + bh - 18 * u;
  if (talk.pages.length > 1) uiText((talk.i + 1) + '/' + talk.pages.length, tx, fy, 14 * u, '#8a83a0', 'left', 800, FONT_UI, false);
  if (page.ask === 'who') { if (done) uiText(touchUI ? 'TOQUE EM UMA DAS OPÇÕES ACIMA' : 'ESPAÇO: SOU EU  ·  N: TROCAR NOME', bx + bw - 20 * u, fy, 15 * u, '#ffd23f', 'right', 800, FONT_UI, false); }
  else if (page.ask) { if (done) uiText('ESCREVA SEU NOME NA CAIXA ACIMA E CONFIRME', bx + bw - 20 * u, fy, 15 * u, '#ffd23f', 'right', 800, FONT_UI, false); }
  else if (done && (G.frame >> 4) % 4 !== 3) uiText(touchUI ? 'TOQUE PRA CONTINUAR ▶' : 'ESPAÇO PRA CONTINUAR ▶', bx + bw - 20 * u, fy, 16 * u, '#ff9a3c', 'right', 800, FONT_UI, false);
  ctx.restore();
}
// ----- HUD do tutorial: deixa claro que é um treino, qual é a lição e o que fazer; as dicas do Merlin aparecem logo abaixo
function drawTutorialHUD(u) {
  if (tut && tut.doneT != null && tut.doneT < 150 && G.state === 'play') {   // faixa de treino completo
    const a = Math.min(1, tut.doneT / 10, (150 - tut.doneT) / 25), y = 46 * H / cssH + 34 * u;
    ctx.globalAlpha = a; ctx.save(); ctx.shadowColor = '#b6ff3b'; ctx.shadowBlur = 16 * u; uiText('TREINO COMPLETO!', W / 2, y, 40 * u, '#c8ff5a', 'center', 400, FONT_HAND); ctx.restore();
    uiText('AGORA VALE O TEMPO', W / 2, y + 30 * u, 16 * u, '#ffffff', 'center', 800); ctx.globalAlpha = 1;
  }
  if (!tut || !tut.active || G.state !== 'play' || talk) return;
  const n = TUT_N, st = Math.min(tut.step, n), y0 = 46 * H / cssH + 6 * u, pw = Math.min(780 * u, W - 420 * u), px = (W - pw) / 2, ph = 84 * u;
  rr(ctx, px, y0, pw, ph, 14 * u); ctx.fillStyle = 'rgba(14,10,24,0.88)'; ctx.fill(); ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 2 * u; ctx.stroke();
  rr(ctx, px + 12 * u, y0 + 10 * u, 98 * u, 24 * u, 8 * u); ctx.fillStyle = '#7fd4ff'; ctx.fill();
  uiText('TUTORIAL', px + 61 * u, y0 + 22.5 * u, 15 * u, '#140f1f', 'center', 800, FONT_UI, false);
  uiText(tut.step > n ? 'TODAS AS LIÇÕES FEITAS' : 'LIÇÃO ' + st + ' DE ' + n + ' · ' + TUT_STEPS[st - 1], px + 120 * u, y0 + 22.5 * u, 16 * u, '#b6ff3b', 'left', 800, FONT_UI, false);
  for (let i = 0; i < n; i++) { const cx = px + pw - 18 * u - (n - 1 - i) * 18 * u, done = i + 1 < tut.step, cur = i + 1 === tut.step; ell(ctx, cx, y0 + 22 * u, 6 * u, 6 * u); ctx.fillStyle = done ? '#b6ff3b' : cur ? '#ffffff' : 'rgba(255,255,255,0.18)'; ctx.fill(); }
  let goal = tutGoal(tut.step), gs = 21 * u; ctx.font = `800 ${gs}px ${FONT_UI}`;
  while (ctx.measureText('▶ ' + goal).width > pw - 28 * u && gs > 12 * u) { gs -= 1 * u; ctx.font = `800 ${gs}px ${FONT_UI}`; }
  uiText('▶ ' + goal, W / 2, y0 + 58 * u, gs, '#ffffff', 'center', 800, FONT_UI, false);
  if (tut.bump && tut.bump.t < 150) {   // dica rápida do Merlin (não para o jogo)
    const a = Math.min(1, tut.bump.t / 8, (150 - tut.bump.t) / 20), txt = 'MERLIN: ' + tut.bump.lines.join(' ').replace(/[\[\]]/g, '');
    let fs = 17 * u; ctx.font = `800 ${fs}px ${FONT_UI}`; while (ctx.measureText(txt).width > pw - 30 * u && fs > 11 * u) { fs -= 1 * u; ctx.font = `800 ${fs}px ${FONT_UI}`; }
    ctx.globalAlpha = a; rr(ctx, px + 20 * u, y0 + ph + 6 * u, pw - 40 * u, 32 * u, 10 * u); ctx.fillStyle = 'rgba(255,154,60,0.95)'; ctx.fill();
    uiText(txt, W / 2, y0 + ph + 22 * u, fs, '#1c1020', 'center', 800, FONT_UI, false); ctx.globalAlpha = 1;
  }
}
