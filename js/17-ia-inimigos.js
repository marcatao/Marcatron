'use strict';
// =================================================================== inimigos: máquinas de estado (v4)
// Pombix: anda -> alerta ("!" + arrulho) -> sobe com a hélice -> mira -> mergulha -> tonto no chão (inofensivo)
// Totó Subwoofer: patrulha no ritmo; blindado late (onda de choque no chão, pule!) e dá bote; sem blindagem fica bravo e rápido
// Girassinal: carrega no tempo 4 e atira mirando (leque de 3 se você estiver por cima); fecha em botão se você chegar perto
// Vigia: câmera-gato que varre a rua com um feixe de luz; se te vê, toca o alarme e deixa os robôs por perto mais rápidos
const ALERT_R = 320, CONE_R = 118, CONE_HW = 0.2;
const heroCX = () => hero.x + hero.w / 2, heroCY = () => hero.y + hero.h / 2;
const canAct = () => !hero.dead && G.state === 'play';
function groundAhead(e, dir) { const c = Math.floor((dir > 0 ? e.x + e.w + 1 : e.x - 1) / TS), r = Math.floor((e.y + e.h + 1) / TS); return solidAt(c, r); }
function onScreen(e, m = 0) { return e.x + e.w > cam.x - m && e.x < cam.x + viewW() + m && e.y + e.h > cam.y - m && e.y < cam.y + viewH() + m; }
function lineOfSight(x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 5);
  for (let i = 2; i < n; i++) { const k = i / n; if (solidAt(Math.floor(lerp(x0, x1, k) / TS), Math.floor(lerp(y0, y1, k) / TS))) return false; }
  return true;
}

// ---------- dano nos inimigos. src: 'stomp' (pisão), 'slide' (faíscas do powerslide), 'grind' (faíscas do corrimão), 'bump' (bloco por baixo), 'slam' (pisão do Marombado)
const SPARKY = { wave: 1, slide: 1, grind: 1 };
function hitEnemy(e, src, combo = 1) {
  if (e.freed || e.gone) return false;
  if (e.hitCd > 0 && (src === 'stomp' || SPARKY[src])) return false;
  if (!tutRescueOk(e, src)) { e.hitCd = 20; return false; }   // v11: bichos do treino só com o jeito ensinado
  if (e.type === 'flower' && SPARKY[src] && e.closedT > 0.5) {   // botão fechado: a faísca bate e volta
    e.hitCd = 12; sfx('bump', { vol: 0.5, rate: 1.7, pan: panOf(e.x) });
    pop(e.x + e.w / 2, e.y - 6, 'FECHADA!', '#ffd23f');
    for (let i = 0; i < 6; i++) part({ x: e.x + e.w / 2, y: e.y + 1, vx: rnd(-1.6, 1.6), vy: rnd(-1.8, -0.4), col: '#fff3c4', life: 14, size: 1, g: 0.05, kind: 'spark' });
    return 'blocked';
  }
  if (e.armor && (src === 'stomp' || SPARKY[src])) { dropArmor(e); return 'armor'; }
  freeEnemy(e, combo); return true;
}
function dropArmor(e) {
  e.armor = false; e.angry = true; e.state = 'stun'; e.st = 0; e.vx = 0; e.hitCd = 26; e.charge = 0;
  e.y += e.h - DIM.dog.h; e.h = DIM.dog.h;
  sfx('armor', { pan: panOf(e.x), vol: 0.9 }); G.shake = Math.max(G.shake, 5);
  pop(e.x + e.w / 2, e.y - 10, 'SEM BLINDAGEM!', '#ff7a1a');
  part({ x: e.x + e.w / 2, y: e.y - 4, vx: (e.x + e.w / 2 < hero.x + hero.w / 2 ? -1 : 1) * 1.4, vy: -3.4, g: 0.2, life: 80, kind: 'sub', size: 1, vr: 0.18, col: '#26242c' });
  for (let i = 0; i < 6; i++) part({ x: e.x + e.w / 2, y: e.y, vx: rnd(-1.8, 1.8), vy: rnd(-2.6, -0.6), col: '#c9ced9', life: 30, size: rnd(0.9, 1.5), g: 0.18, kind: 'bolt', vr: rnd(-0.3, 0.3) });
}

// ---------- contato com o herói
function contactHero(e) {
  if (!canAct() || e.freed) return;
  const h = hero;
  if (!(h.x + 1 < e.x + e.w && h.x + h.w - 1 > e.x && h.y + 2 < e.y + e.h && h.y + h.h > e.y + 1)) return;
  // v7: deslizando no powerslide ou no corrimão, as faíscas derrubam quem encosta (a girassol fechada machuca)
  if (h.slideT > SLIDE_T - 18 || h.rail) {
    const r = hitEnemy(e, h.rail ? 'grind' : 'slide', h.combo + 1);
    if (r === 'blocked' && e.type === 'flower') hurt(); else if (r) { sfx('stomp', { vol: 0.7, pan: panOf(e.x) }); sparkAt(e.x + e.w / 2, e.y + e.h - 3, h.face * 1.5, -1.6, 8); }
    return;
  }
  const stomp = h.vy > 0.4 && h.y + h.h - h.vy <= e.y + 6;
  if (e.type === 'flower') { if (stomp) { h.vy = -3.2; pop(e.x + e.w / 2, e.y - 6, 'LÂMINAS!', '#ff3b5c'); } hurt(); return; }
  if (stomp) {
    h.combo++; h.vy = input.jump ? -5.2 : -3.4; h.jumping = input.jump; h.sq = 1.15;
    const r = hitEnemy(e, 'stomp', h.combo);
    if (r) sfx('stomp', { rate: Math.pow(2, PENTA[Math.min(h.combo - 1, 7)] / 12), pan: panOf(e.x) });
    return;
  }
  if ((e.type === 'pigeon' && e.state === 'dizzy') || (e.type === 'dog' && e.state === 'stun') || e.hitCd > 0) return;   // tonto/atordoado não machuca
  if (e.tame) { h.vx = (h.x + h.w / 2 < e.x + e.w / 2 ? -1 : 1) * 1.2; return; }   // v11: os do treino só empurram
  hurt();
}

// ---------- libertos: fogem felizes
// v10: libertos não fogem mais: ficam onde foram despertados, virados para o herói, pulando de alegria de vez em quando
function updFreed(e) {
  e.ft++; if (e.thankT > 0) e.thankT--;
  const dx = heroCX() - (e.x + e.w / 2);
  if (Math.abs(dx) > 6) e.dir = Math.sign(dx);
  e.vx = 0;
  if (e.type === 'pigeon') {
    if (e.flying) {   // bate asa até o chão; sem chão embaixo (buraco), fica pairando ali mesmo
      if (groundBelow(e.x + e.w / 2, e.y + e.h) != null) { e.vy = Math.min(e.vy + 0.08, 0.9); physBody(e, 0); if (e.onGround) { e.flying = false; e.vy = 0; } }
      else { e.vy = lerp(e.vy, Math.sin(e.ft * 0.07) * 0.25, 0.08); e.y += e.vy; }
    } else { physBody(e); if (e.onGround && e.ft % 96 === 48) e.vy = -1.6; }
  } else if (e.type === 'flower') physBody(e, 0.3);
  else { physBody(e); if (e.onGround && e.ft > 30 && e.ft % (e.type === 'cat' ? 84 : 72) === 0) e.vy = e.type === 'cat' ? -2.0 : -2.3; }
  if (e.y > VH + 20) e.gone = true;
}

// ---------- Pombix
function updPigeon(e, k) {
  const hx = heroCX(), ex = e.x + e.w / 2, dx = hx - ex, adx = Math.abs(dx), alerted = e.alert > 0;
  const flying = e.state !== 'walk' && e.state !== 'dizzy' && e.state !== 'alert';
  e.rotorV = lerp(e.rotorV, flying ? 0.95 : e.state === 'alert' ? 0.5 : e.state === 'dizzy' ? 0.02 : 0.06, 0.1); e.rotor += e.rotorV;
  switch (e.state) {
    case 'walk': {
      const sp = (0.25 + k.pulse * 1.15) * (1 + k.I * 0.8) * (alerted ? 1.5 : 1);
      e.vx = e.dir * 0.45 * sp;
      if (e.onGround && !groundAhead(e, e.dir)) { e.dir *= -1; e.vx = -e.vx; }
      if (physBody(e)) e.dir *= -1;
      if (e.cd > 0) e.cd--;
      const feetDy = (hero.y + hero.h) - (e.y + e.h);
      if (e.tier > 0 && canAct() && (e.cd <= 0 || alerted) && e.onGround && e.y > cam.y + 4 && adx < (alerted ? 150 : 112) && feetDy > -40 && feetDy < 100 && (alerted || adx < 36 || Math.sign(dx) === e.dir)) {
        e.state = 'alert'; e.st = 0; e.dir = Math.sign(dx) || e.dir; e.vx = 0;
        sfx('coo', { pan: panOf(e.x), vol: 0.55, vary: 0.05 });
      }
      break;
    }
    case 'alert':
      e.vx = 0; physBody(e);
      if (++e.st > (alerted ? 14 : 26)) { e.state = 'rise'; e.st = 0; e.vy = -1.4; e.onGround = false; }
      break;
    case 'rise': {
      const ty = Math.min(e.y - 6, Math.max(hero.y - 40, cam.y + 12));
      e.vy = lerp(e.vy, clamp((ty - e.y) * 0.1, -1.8, 0.6), 0.2);
      if (e.vy < 0 && solidAt(Math.floor(ex / TS), Math.floor((e.y + e.vy - 2) / TS))) e.vy = 0;   // teto
      e.y += e.vy; e.vx = lerp(e.vx, clamp(dx * 0.02, -0.7, 0.7), 0.06); e.x += e.vx; e.dir = Math.sign(dx) || e.dir;
      if (++e.st > 46 || (e.st > 16 && Math.abs(e.y - ty) < 2.5)) { e.state = 'aim'; e.st = 0; }
      break;
    }
    case 'aim': {
      e.dir = Math.sign(dx) || e.dir;
      e.vx = lerp(e.vx, clamp((hx - 30 * e.dir - ex) * 0.03, -0.9, 0.9), 0.08); e.x += e.vx;
      e.y += Math.sin(e.st * 0.3) * 0.25;
      if (++e.st > (alerted ? 16 : 28)) {
        if (!canAct()) { e.state = 'recover'; e.st = 0; break; }
        const tx = hx + hero.vx * 10, ty = hero.y + hero.h - 4, ax = tx - ex, ay = Math.max(ty - (e.y + e.h / 2), 6), d = Math.hypot(ax, ay), spd = alerted ? 3.8 : 3.3;
        e.vx = ax / d * spd; e.vy = ay / d * spd; e.state = 'dive'; e.st = 0;
        sfx('dive', { pan: panOf(e.x), vol: 0.6 });
      }
      break;
    }
    case 'dive': {
      e.st++; e.x += e.vx; e.y += e.vy;
      const cx = e.x + e.w / 2;
      if (G.frame % 2 === 0) part({ x: cx - e.vx * 2, y: e.y + e.h / 2 - e.vy * 2, vx: -e.vx * 0.15, vy: -e.vy * 0.15, col: '#ff6a80', life: 12, size: 1, g: 0, kind: 'spark' });
      const fr = Math.floor((e.y + e.h) / TS);
      if (e.vy > 0 && solidAt(Math.floor(cx / TS), fr)) {   // espatifou no chão: fica tonto
        e.y = fr * TS - e.h; e.vx = 0; e.vy = 0; e.onGround = true; e.state = 'dizzy'; e.st = 0;
        dust(cx, e.y + e.h, 6, 1.4); sfx('bump', { vol: 0.55, pan: panOf(e.x) }); sfx('dizzy', { vol: 0.5, pan: panOf(e.x) }); G.shake = Math.max(G.shake, 3);
      } else if (solidAt(Math.floor(cx / TS), Math.floor((e.y + e.h / 2) / TS))) { e.vx *= -0.6; e.vy = -1; e.state = 'recover'; e.st = 0; }
      else if (e.y > GROUND_Y + 6 || e.st > 80) { e.state = 'recover'; e.st = 0; }
      break;
    }
    case 'dizzy':
      e.vx = 0; physBody(e);
      if (++e.st > 110) { e.state = 'walk'; e.st = 0; e.cd = 140; }
      break;
    case 'recover': {   // volta a subir (caiu no buraco ou bateu na parede) e procura chão
      e.st++;
      const toward = Math.sign(e.hx - e.x) || e.dir;
      if (e.y > GROUND_Y - 36) { e.vy = lerp(e.vy, -1.4, 0.12); e.vx = lerp(e.vx, toward * 0.5, 0.05); }
      else { e.vy = lerp(e.vy, 0, 0.2); e.vx = lerp(e.vx, toward * 1.2, 0.08); }
      e.x += e.vx; e.y += e.vy; e.dir = Math.sign(e.vx) || e.dir;
      if (e.y <= GROUND_Y - 34 && (solidAt(Math.floor((e.x + e.w / 2) / TS), 12) || e.st > 240)) { e.state = 'land'; e.st = 0; e.vy = 0; }
      break;
    }
    case 'land':
      e.vx *= 0.9; physBody(e, 0.08); if (e.vy > 1.3) e.vy = 1.3;
      if (e.onGround) { e.state = 'walk'; e.cd = 120; }
      else if (e.y > GROUND_Y + 6) { e.state = 'recover'; e.st = 0; }
      break;
  }
}

// ---------- Totó Subwoofer
function updDog(e, k) {
  const hx = heroCX(), ex = e.x + e.w / 2, dx = hx - ex, adx = Math.abs(dx), alerted = e.alert > 0;
  const same = Math.abs((hero.y + hero.h) - (e.y + e.h)) < 18, fast = (e.angry ? 1.55 : 1) * (alerted ? 1.35 : 1);
  if (e.angry && G.frame % 22 === 0) part({ x: ex - e.dir * 5, y: e.y + 1, vx: rnd(-0.2, 0.2), vy: -0.5, col: '#b9bdc7', life: 34, size: 1.5, g: -0.01, kind: 'puff' });
  switch (e.state) {
    case 'walk': {
      const sp = (0.25 + k.pulse * 1.15) * (1 + k.I * 0.8) * fast;
      e.vx = e.dir * 0.55 * sp;
      if (e.onGround && !groundAhead(e, e.dir)) { e.dir *= -1; e.vx = -e.vx; }
      if (e.onGround && e.tier === 0 && k.newBeat && k.bi % 2 === 0) e.vy = -2.6;   // pulinho no ritmo (versão tutorial)
      if (physBody(e)) e.dir *= -1;
      if (e.cd > 0) e.cd--;
      if (e.tier > 0 && canAct() && (e.cd <= 0 || alerted) && e.onGround && same && onScreen(e, -4)) {
        // blindado: late de longe (começa a carregar num tempo da música) e só dá bote colado; sem blindagem: bote de longe
        if (e.armor && adx < 170 && adx > 40 && k.newBeat) {
          e.state = 'charge'; e.st = 0; e.dir = Math.sign(dx) || e.dir; sfx('charge', { vol: 0.4, rate: 0.5, pan: panOf(e.x) });
        } else if (adx < (e.armor ? 44 : e.angry || alerted ? 120 : 84) && (Math.sign(dx) === e.dir || adx < 30)) { e.state = 'crouch'; e.st = 0; e.dir = Math.sign(dx) || e.dir; }
      }
      break;
    }
    case 'charge':   // o subwoofer enche por 2 tempos (aviso), depois late
      e.vx = 0; physBody(e); e.dir = Math.sign(dx) || e.dir;
      if (++e.st >= Math.round(BEAT * 120)) { dogBark(e); e.state = 'bark'; e.st = 0; }
      break;
    case 'bark':
      e.vx = 0; physBody(e);
      if (++e.st > 26) { e.state = 'walk'; e.st = 0; e.cd = 110; }
      break;
    case 'crouch':   // abaixa a frente antes do bote
      e.vx = 0; physBody(e);
      if (++e.st > (e.angry || alerted ? 12 : 20)) { e.state = 'dash'; e.st = 0; e.dir = Math.sign(dx) || e.dir; sfx('skid', { vol: 0.45, rate: 0.8, pan: panOf(e.x) }); }
      break;
    case 'dash': {
      e.st++; e.vx = e.dir * (e.angry ? 2.7 : 2.4) * (alerted ? 1.12 : 1);
      if (e.onGround && !groundAhead(e, e.dir)) { e.vx = 0; e.state = 'skid'; e.st = 0; break; }   // freia na beirada
      if (physBody(e)) { e.state = 'skid'; e.st = 0; G.shake = Math.max(G.shake, 3); sfx('bump', { vol: 0.5, pan: panOf(e.x) }); break; }
      if (G.frame % 3 === 0) dust(ex - e.dir * 5, e.y + e.h, 1, 0.6);
      if (e.st > 40) { e.state = 'skid'; e.st = 0; }
      break;
    }
    case 'skid':
      e.vx *= 0.82; physBody(e); if (G.frame % 3 === 0 && Math.abs(e.vx) > 0.3) dust(ex, e.y + e.h, 1, 0.4);
      if (++e.st > 22) { e.state = 'walk'; e.st = 0; e.cd = 100; }
      break;
    case 'stun':
      e.vx = 0; physBody(e);
      if (++e.st > 50) { e.state = 'walk'; e.st = 0; e.cd = 30; }
      break;
  }
}
function dogBark(e) {
  const y = e.y + e.h, ex = e.x + e.w / 2;
  for (const d of [-1, 1]) shocks.push({ x: ex + d * 7, y, dir: d, t: 0, life: 70, spd: 2.1 });
  sfx('bark', { pan: panOf(e.x), vol: 0.85 }); G.shake = Math.max(G.shake, 4);
  part({ x: ex, y, kind: 'ring', life: 20, size: 1, col: '#ff2a4a', g: 0 });
  for (let i = 0; i < 6; i++) part({ x: ex + rnd(-6, 6), y: y - 1, vx: rnd(-1, 1), vy: rnd(-1.2, -0.3), col: '#cfc6dc', life: 24, size: rnd(1.4, 2.4), g: 0.02, kind: 'puff' });
}
function updateShocks() {
  for (let i = shocks.length - 1; i >= 0; i--) {
    const s = shocks[i]; s.t++; s.x += s.dir * s.spd;
    const c = Math.floor(s.x / TS);
    if (s.t > s.life || !solidAt(c, Math.floor((s.y + 2) / TS)) || solidAt(c, Math.floor((s.y - 3) / TS)) || rampSolidAt(s.x, s.y - 3)) { dust(s.x, s.y, 2, 0.6); shocks.splice(i, 1); continue; }
    if (s.t % 4 === 0) part({ x: s.x + rnd(-2, 2), y: s.y, vx: s.dir * rnd(0.1, 0.6), vy: rnd(-1.1, -0.4), col: '#9a8fb0', life: 18, size: rnd(0.8, 1.5), g: 0.08, kind: 'chunk', vr: rnd(-0.3, 0.3) });
    if (canAct() && Math.abs(heroCX() - s.x) < hero.w / 2 + 2.5 && hero.y + hero.h > s.y - 7 && hero.y < s.y) hurt();
  }
}

// ---------- Girassinal
function updFlower(e, k) {
  e.vx = 0; physBody(e, 0.3);
  const ex = e.x + e.w / 2, fy = e.y + e.h - 15.6 * ES, dx = heroCX() - ex, dy = heroCY() - fy, adx = Math.abs(dx);
  const near = canAct() && adx < 30 && dy > -48 && dy < 20;
  e.closedT = near ? Math.min(1, e.closedT + 0.14) : Math.max(0, e.closedT - 0.04);
  if (near && !e.popped && e.closedT > 0.6) { e.popped = true; pop(ex, e.y - 6, 'FECHOU! FAÍSCA DE LONGE', '#ffd23f'); }
  e.look = lerp(e.look, clamp(dx / 50, -1, 1), 0.08);
  e.recoil *= 0.84;
  const ch = clamp(e.charge / (BEAT * 60), 0, 1), period = e.alert > 0 ? 2 : 4;
  e.spin += 0.012 + (e.charge > 0 ? 0.28 * ch : 0);
  if (e.closedT > 0.4) { e.charge = 0; return; }
  if (e.charge > 0) {
    e.charge++;
    if (G.frame % 2 === 0) { const a = rnd(0, 6.28); part({ x: ex + Math.cos(a) * 9, y: fy + Math.sin(a) * 9, vx: -Math.cos(a) * 0.55, vy: -Math.sin(a) * 0.55, col: '#ff5a6e', life: 15, size: 0.9, g: 0, kind: 'spark' }); }
    if (e.charge > BEAT * 60) { fireFlower(e, k); e.charge = 0; }
  } else if (e.tier > 0 && k.newBeat && k.bi % period === period - 1 && canAct() && adx < 230 && Math.abs(dy) < 120 && onScreen(e, -2)) {
    e.charge = 1; sfx('charge', { vol: 0.45, pan: panOf(e.x) });
  }
}
function fireFlower(e, k) {
  const ex = e.x + e.w / 2, fy = e.y + e.h - 15.6 * ES, dx = heroCX() - ex, dy = heroCY() - fy, d = Math.hypot(dx, dy) || 1;
  const spd = 1.55 * (1 + k.I * 0.35), uy = clamp(dy / d, -0.92, 0.22), ux = Math.sign(dx || -1) * Math.sqrt(1 - uy * uy);
  const base = Math.atan2(uy, ux), above = hero.y + hero.h < e.y - 4;
  for (const a of above ? [base - 0.3, base, base + 0.3] : [base]) projs.push({ x: ex + Math.cos(a) * 6, y: fy + Math.sin(a) * 6, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 210 });
  e.recoil = 1; e.aim = base;
  sfx('zap', { vol: 0.55, pan: panOf(e.x) });
  for (let i = 0; i < 5; i++) part({ x: ex + Math.cos(base) * 5, y: fy + Math.sin(base) * 5, vx: Math.cos(base + rnd(-0.6, 0.6)) * rnd(0.6, 1.6), vy: Math.sin(base + rnd(-0.6, 0.6)) * rnd(0.6, 1.6), col: '#ffd0d6', life: 10, size: 1, g: 0, kind: 'spark' });
}

// ---------- Vigia
function updCat(e, k) {
  e.vx = 0; physBody(e, 0.3);
  if (e.turnT > 0) e.turnT--;
  const [ex, ey] = catEye(e), hx = heroCX(), hy = heroCY();
  if (e.alarm > 0) {   // alarme: a câmera segue o herói
    e.alarm--;
    const fdx = hx - ex; if (Math.abs(fdx) > 8 && Math.sign(fdx) !== e.face) { e.face = Math.sign(fdx); e.turnT = 8; }
    e.pitch = lerp(e.pitch, clamp(Math.atan2(hy - ey, Math.abs(hx - ex)), -0.25, 1.3), 0.15);
    if (e.alarm === 0) { e.cd = 200; e.sweep = 0; e.face = e.face0; e.turnT = 14; }
    return;
  }
  if (e.cd > 0) e.cd--;
  e.sweep += 1 / 60;
  const face = Math.floor(e.sweep / 6.8) % 2 === 0 ? e.face0 : -e.face0;   // vira a cabeça a cada duas varreduras
  if (face !== e.face) { e.face = face; e.turnT = 14; }
  e.pitch = 0.52 + 0.34 * Math.sin(e.sweep * Math.PI * 2 / 3.4);
  if (e.cd <= 0 && e.turnT <= 0 && canAct() && onScreen(e, -6)) {
    const vx = hx - ex, vy = hy - ey, d = Math.hypot(vx, vy);
    if (d < CONE_R && d > 4 && Math.sign(vx) === e.face && Math.abs(Math.atan2(vy, Math.abs(vx)) - e.pitch) < CONE_HW + 0.06 && lineOfSight(ex, ey, hx, hy)) triggerAlarm(e);
  }
}
function triggerAlarm(e) {
  e.alarm = 330; G.alarmT = Math.max(G.alarmT, 330);
  sfx('alarm', { vol: 0.55, pan: panOf(e.x) });
  pop(e.x + e.w / 2, e.y - 12, 'ALARME!', '#ff3b5c', true);
  for (const o of enemies) if (o !== e && !o.freed && !o.gone && Math.abs(o.x - e.x) < ALERT_R) { o.alert = 330; o.alertShow = 50; o.cd = 0; }
  if (!G.alarmTip) { G.alarmTip = true; pop(hero.x + hero.w / 2, hero.y - 24, 'O VIGIA CHAMOU REFORÇO!', '#ffd23f'); }
}

// ---------- laço dos inimigos
function updateEnemies() {
  const beat = beatNow(), bi = Math.floor(beat), newBeat = bi !== G.lastBeat; G.lastBeat = bi;
  const pulse = Math.max(0, 1 - (((beat % 1) + 1) % 1) * 3);
  if (G.alarmT > 0) G.alarmT--;
  for (const e of enemies) {
    if (e.gone) continue;
    e.t += 1 / 60; if (e.hitCd > 0) e.hitCd--; if (e.alert > 0) e.alert--; if (e.alertShow > 0) e.alertShow--;
    if (e.freed) { updFreed(e); continue; }
    if (!(e.x > cam.x - 72 && e.x < cam.x + viewW() + 72)) continue;
    const k = { beat, bi, newBeat, pulse, I: antenna.alive ? clamp(1 - Math.abs(e.x - antenna.x) / 300, 0, 1) : 0 };
    if (e.type === 'pigeon') updPigeon(e, k); else if (e.type === 'dog') updDog(e, k); else if (e.type === 'flower') updFlower(e, k); else updCat(e, k);
    if (e.x < 0) e.x = 0; if (e.x + e.w > LW) e.x = LW - e.w;
    if (e.pen) { if (e.x < e.pen[0]) { e.x = e.pen[0]; e.dir = 1; } else if (e.x + e.w > e.pen[1]) { e.x = e.pen[1] - e.w; e.dir = -1; } }   // v11: cercadinho do treino
    if (e.y > VH + 30 && e.type !== 'pigeon') { e.gone = true; continue; }
    contactHero(e);
  }
}
// depois de cair, os inimigos voltam a um estado calmo
function calmEnemies() {
  G.alarmT = 0; shocks.length = 0; projs.length = 0;
  for (const e of enemies) if (!e.freed) {
    e.alert = 0; e.alertShow = 0; e.alarm = 0; e.charge = 0;
    if (e.type === 'pigeon' && e.state !== 'walk' && e.state !== 'dizzy') { e.state = 'recover'; e.st = 0; }
    if (e.type === 'dog' && e.state !== 'walk') { e.state = 'walk'; e.cd = 90; }
    if (e.type === 'cat') { e.cd = 120; e.face = e.face0; e.sweep = 0; }
  }
}
