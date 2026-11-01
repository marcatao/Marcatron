'use strict';
// =================================================================== herói com a arte do elenco (v21)
// O personagem principal é desenhado com as peças recortadas da ilustração da ficha Inline City (elenco Uhuu Rollers):
// cabeça, tronco com mochila, braço, antebraço com luva, coxa, canela e patins (img/heroi). As peças viram um esqueleto de
// perfil (olhando para +x) e as poses do jogo (remada, ar, grind, powerslide, mortal, estrela...) giram os ossos.
// O braço e a perna de trás são as mesmas peças, escurecidas, atrás do corpo. Enquanto as imagens carregam (ou se não
// carregarem), o jogo usa o desenho vetorial de antes (drawHeroVector em 09-heroi.js).
// Coordenadas das peças: recorte de 320x784 px da vista de lado; ground = linha das rodas. Ângulos em graus, sentido horário:
// perna/braço para a FRENTE = negativo; joelho dobrando = positivo na canela; cotovelo dobrando = negativo no antebraço;
// tronco inclinando para a frente = positivo.
const HA = {
  ready: false, img: {}, dark: {},
  parts: { head: { x: 38, y: 33, w: 252, h: 238 }, torso: { x: 59, y: 256, w: 173, h: 203 }, uarm: { x: 121, y: 271, w: 67, h: 146 }, farm: { x: 109, y: 368, w: 91, h: 134 },
    thigh: { x: 102, y: 428, w: 130, h: 163 }, shin: { x: 110, y: 486, w: 112, h: 159 }, skate: { x: 92, y: 612, w: 177, h: 151 } },
  piv: { torso: [168, 446], head: [176, 262], uarm: [154, 290], farm: [158, 392], thigh: [168, 452], shin: [165, 535], skate: [165, 628] },
  ground: 761, top: 33,
  // v22: as 6 expressões da ficha (rostos de 3/4, já olhando para +x), trocadas conforme a situação; [largura, altura]
  faces: {'sorriso': [229, 210], 'risada': [223, 214], 'piscada': [233, 212], 'susto': [218, 214], 'foco': [231, 214], 'preocupado': [218, 208]},
  face: {}, lastFace: null, faceT: -99,
};
const HA_BONES = [   // [osso, pai, peça]
  ['torso', null, 'torso'], ['head', 'torso', 'head'],
  ['uarmF', 'torso', 'uarm'], ['farmF', 'uarmF', 'farm'], ['uarmB', 'torso', 'uarm'], ['farmB', 'uarmB', 'farm'],
  ['thighF', 'torso', 'thigh'], ['shinF', 'thighF', 'shin'], ['skateF', 'shinF', 'skate'],
  ['thighB', 'torso', 'thigh'], ['shinB', 'thighB', 'shin'], ['skateB', 'shinB', 'skate'],
];
const HA_ORDER = ['uarmB', 'farmB', 'thighB', 'shinB', 'skateB', 'shinF', 'skateF', 'thighF', 'torso', 'head', 'uarmF', 'farmF'];
const HA_DARK = { uarmB: 1, farmB: 1, thighB: 1, shinB: 1, skateB: 1 };
(function loadHeroArt() {
  for (const nm of Object.keys(HA.faces)) {   // rostos: carregam à parte (até chegarem, fica a cabeça de perfil)
    const im = new Image(); im.onload = () => { HA.face[nm] = im; };
    im.src = (window.__IMG && window.__IMG['heroi/rosto-' + nm + '.webp']) || 'img/heroi/rosto-' + nm + '.webp';
  }
  const names = Object.keys(HA.parts); let n = 0;
  for (const nm of names) {
    const im = new Image();
    im.onload = () => {
      HA.img[nm] = im;
      const p = HA.parts[nm], c = mk(p.w, p.h), g = c.getContext('2d');   // cópia escurecida e azulada (lado de trás), sem ler pixels
      g.drawImage(im, 0, 0, p.w, p.h); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(16,10,40,0.42)'; g.fillRect(0, 0, p.w, p.h);
      HA.dark[nm] = c;
      if (++n === names.length) HA.ready = true;
    };
    im.src = (window.__IMG && window.__IMG['heroi/principal-' + nm + '.webp']) || 'img/heroi/principal-' + nm + '.webp';
  }
})();

// ----- poses: S vem do jogo (mesmo estado do desenho vetorial: S.mode, S.t, S.stride, S.vy...)
function heroArtPose(S) {
  const P = {}; for (const [b] of HA_BONES) P[b] = { r: 0, sx: 1, sy: 1 };
  const t = S.t || 0, mode = S.dead ? 'dead' : (S.victory || S.strum) && (!S.mode || S.mode === 'idle') ? 'rock' : (S.mode || 'idle');
  const leg = (s, th, sh, sk = 0) => { P['thigh' + s].r = th; P['shin' + s].r = sh; P['skate' + s].level = sk; };
  const arm = (s, ua, fa) => { P['uarm' + s].r = ua; P['farm' + s].r = fa; };
  switch (mode) {
    case 'idle': {   // em pé nos patins, joelho levemente dobrado, respirando e balançando a cabeça no ritmo
      const br = Math.sin(t * 2.1), b = Math.abs(Math.sin(t / BEAT * Math.PI));
      leg('F', -9, 14); leg('B', 7, 10); arm('F', 4 + br * 1.5, -8); arm('B', -6 - br * 1.5, -10);
      P.torso.r = 2 + br * 0.6; P.head.r = -2 + b * 2.5 + (S.nod || 0) * 3; P.torso.sy = 1 + br * 0.005;
      break;
    }
    case 'coast': {  // deslizando no embalo, base aberta e um pouco agachado
      const w = Math.sin(t * 3);
      leg('F', -18, 26); leg('B', 16, 20); arm('F', -14 + w * 3, -16); arm('B', 14 - w * 3, -14);
      P.torso.r = 12; P.head.r = -8;
      break;
    }
    case 'tuck': {   // rápido: agachado, braços para a frente
      leg('F', -42, 80); leg('B', -10, 68); arm('F', -48, -58); arm('B', 18, -50);
      P.torso.r = 34; P.head.r = -24;
      break;
    }
    case 'stride': { // passada: uma perna empurra para trás e para fora, a outra desliza dobrada embaixo do corpo
      const ph = (((S.stride || 0) / (Math.PI * 2)) % 1 + 1) % 1;
      const stroke = q => {
        const push = smooth(0, 0.5, q) * (1 - smooth(0.5, 1, q)), rec = q > 0.5 ? Math.sin((q - 0.5) / 0.5 * Math.PI) : 0;
        return { th: lerp(-24, 34, push) - rec * 18, sh: lerp(44, 8, push) + rec * 55, lvl: lerp(0, 10, push) - rec * 12 };
      };
      const f = stroke(ph), b = stroke((ph + 0.5) % 1);
      leg('F', f.th, f.sh, f.lvl); leg('B', b.th, b.sh, b.lvl);
      const sw = Math.sin(ph * Math.PI * 2);
      arm('F', -sw * 34, -18 - Math.max(0, sw) * 20); arm('B', sw * 34, -18 - Math.max(0, -sw) * 20);
      P.torso.r = 20 + Math.sin(ph * Math.PI * 4) * 1.5; P.head.r = -14;
      break;
    }
    case 'air': {    // subindo: joelhos para cima; caindo: pernas esticando para o pouso, braços abertos
      if ((S.vy || 0) < 0) { leg('F', -62, 96, -8); leg('B', -30, 84, 6); arm('F', -110, -30); arm('B', -70, -24); P.torso.r = 14; P.head.r = -10; }
      else { leg('F', -24, 34); leg('B', 12, 26); arm('F', -96, -12); arm('B', 70, -10); P.torso.r = 6; P.head.r = -6; }
      break;
    }
    case 'grab': {   // joelhos no peito e a mão da frente segurando o patins
      const b = Math.sin(t * 2.6);
      leg('F', -88, 118, -6); leg('B', -50, 104, 4); arm('F', -42, -60); arm('B', -125 + b * 8, -20);
      P.torso.r = 24; P.head.r = -20;
      break;
    }
    case 'flip': {   // mortal: bola, abraçando os joelhos (o jogo gira o desenho inteiro)
      leg('F', -98, 128, -10); leg('B', -84, 124, -6); arm('F', -70, -84); arm('B', -46, -76);
      P.torso.r = 30; P.head.r = -12;
      break;
    }
    case 'star': {   // estrela: braços e pernas bem abertos
      leg('F', -55, 4, -18); leg('B', 55, 4, 18); arm('F', -125, -6); arm('B', 125, -6);
      P.torso.r = 0; P.head.r = -4;
      break;
    }
    case 'grind': {  // soul grind: pés abertos sobre o corrimão, agachado, braços abertos se equilibrando
      const w = Math.sin(t * 5.6);
      leg('F', -32, 44, 0); leg('B', 30, 38, 0); arm('F', -78 + w * 14, -10); arm('B', 70 - w * 14, -10);
      P.torso.r = 10 + w * 4; P.head.r = -8;
      break;
    }
    case 'slide': {  // powerslide: perna da frente esticada travando, a de trás bem agachada, corpo para trás
      const vib = Math.sin(t * 55) * 0.8;
      leg('F', -68 + vib, 8, 0); leg('B', -42, 118, 0); arm('F', -78, -15); arm('B', 32, -6);
      P.torso.r = -8 + vib * 0.2; P.head.r = 6;
      break;
    }
    case 'dead': {   // tombo: braços e pernas para o alto (o jogo gira e derruba)
      leg('F', -50, 30, -10); leg('B', 40, 24, 10); arm('F', -150, -20); arm('B', 150, -20);
      P.torso.r = -10; P.head.r = 10;
      break;
    }
    case 'rock': {   // tocando / comemorando: pulinho no tempo e soco no ar
      const bt = t / BEAT, b = Math.abs(Math.sin(bt * Math.PI)), pump = Math.max(0, Math.sin(bt * Math.PI * 2));
      leg('F', -16 - 10 * (1 - b), 26 + 20 * (1 - b)); leg('B', 10, 22 + 16 * (1 - b));
      if (S.victory) { arm('F', -104 - pump * 14, -34 + pump * 10); arm('B', 14, -30); } else { arm('F', -40, -70); arm('B', -20, -60); }
      P.torso.r = -4; P.head.r = -10 + 6 * (1 - b);
      break;
    }
    default: leg('F', -9, 14); leg('B', 7, 10);
  }
  return P;
}

// ----- desenho: g com a origem no chão, debaixo do herói (unidades do jogo); P = formParams (forma), S = pose
function drawHeroArt(g, P, S) {
  // v22: debaixo de teto baixo (S.sq pequeno por causa do agachamento), ele se agacha de verdade e só o resto vira achatamento
  const sq0 = S.sq || 1, crouch = clamp((0.9 - sq0) / 0.45, 0, 1);
  const Q = heroArtPose(S);
  if (crouch > 0) {
    const D = { thighF: -78, shinF: 128, thighB: -46, shinB: 120, uarmF: -40, farmF: -70, uarmB: 10, farmB: -60, torso: 46, head: -34 };
    for (const k in D) Q[k].r = lerp(Q[k].r, D[k], crouch);
    Q.skateF.level = lerp(Q.skateF.level || 0, 0, crouch); Q.skateB.level = lerp(Q.skateB.level || 0, 0, crouch);
  }
  const sqEff = clamp(sq0 / lerp(1, 0.62, crouch), 0.62, 1.3);
  const piv = HA.piv, W = {}, pv = b => piv[b.replace(/[FB]$/, '')];
  // formas: Varapau = pernas e tronco compridos; Marombado = tronco e braços largos
  if (P.tall) { for (const b of ['thighF', 'thighB', 'shinF', 'shinB']) Q[b].sy = 1.55; Q.torso.sy *= 1.12; for (const b of ['uarmF', 'uarmB', 'farmF', 'farmB']) Q[b].sy = 1.3; }
  if (P.buff) { Q.torso.sx = 1.32; for (const b of ['uarmF', 'uarmB', 'farmF', 'farmB']) Q[b].sx = 1.45; for (const b of ['thighF', 'thighB']) Q[b].sx = 1.18; }
  const solve = rootY => {
    for (const [b, par] of HA_BONES) {
      const q = Q[b], [px, py] = pv(b);
      let pos, ang;
      if (!par) { pos = [px, rootY]; ang = q.r * D2R_H; }
      else { const p2 = W[par].full.transformPoint(new DOMPoint(px, py)); pos = [p2.x, p2.y]; ang = W[par].ang + q.r * D2R_H; }
      if (b.startsWith('skate') && q.level != null) ang = q.level * D2R_H;   // patins com o giro pedido (0 = paralelo ao chão)
      W[b] = { ang, full: new DOMMatrix().translate(pos[0], pos[1]).rotate(ang / D2R_H).scale(q.sx, q.sy).translate(-px, -py) };
    }
  };
  const wheels = s => { const p = HA.parts.skate; return [p.x + 18, p.x + p.w - 18].map(x => W[s].full.transformPoint(new DOMPoint(x, HA.ground)).y); };
  solve(piv.torso[1]);
  const low = Math.max(...wheels('skateF'), ...wheels('skateB'));
  solve(piv.torso[1] + (HA.ground - low));   // as rodas mais baixas encostam no chão
  // escala: a altura de pé da arte vira a altura visual do herói nesta forma (mesma proporção de antes)
  const artH = (HA.ground - HA.top) * (P.tall ? 1.3 : P.buff ? 1.06 : 1), s = heroDrawH(P) / artH;
  g.save();
  g.scale(1 / Math.sqrt(sqEff), sqEff); g.rotate(S.lean || 0);
  g.scale(s, s); g.translate(-piv.torso[0], -HA.ground);
  const base = g.getTransform();
  const face = heroFace(S), fimg = face && HA.face[face];
  if (face !== HA.lastFace) { HA.lastFace = face; HA.faceT = G.frame; }
  for (const b of HA_ORDER) {
    const part = HA_BONES.find(x => x[0] === b)[2], p = HA.parts[part];
    g.setTransform(base.multiply(W[b].full));
    if (b === 'head' && fimg) {   // rosto com expressão: o queixo encaixa no pescoço, com um pulinho quando troca
      const [fw, fh] = HA.faces[face], pop = 1 + 0.12 * Math.max(0, 1 - (G.frame - HA.faceT) / 8), [nx, ny] = piv.head;
      g.translate(nx, ny); g.scale(pop, pop); g.drawImage(fimg, -fw * 0.5 + 10, -fh * 0.97, fw, fh);
    } else g.drawImage(HA_DARK[b] ? HA.dark[part] : HA.img[part], p.x, p.y, p.w, p.h);
  }
  g.setTransform(base);
  // violão na frente quando ele toca (air guitar, comemoração no palco)
  if (S.strum || S.victory) {
    const hip = W.torso.full.transformPoint(new DOMPoint(piv.thigh[0] + 20, piv.thigh[1] - 40));
    g.translate(hip.x, hip.y); g.scale(1 / s, 1 / s);
    drawGuitar(g, 0, 0, 1.2 + Math.sin((S.strumT || 0) * 1.6) * 0.04, P.gscale, S.victory ? 1 : (S.strumGlow || 0));
  }
  g.restore();
}
const D2R_H = Math.PI / 180;
// v22: qual expressão da ficha usar (null = cabeça de perfil, o rosto neutro); S.emo vem do jogo (ver drawHeroNow)
function heroFace(S) {
  if (S.dead) return 'preocupado';
  if (S.hurt || S.emo === 'hurt') return 'susto';
  if (S.wink) return 'piscada';
  if (S.victory || S.emo === 'thrill' || S.emo === 'rock' || (S.emo === 'happy' && S.joy)) return 'risada';
  if (S.emo === 'happy') return 'sorriso';
  if (S.emo === 'focus' || S.emo === 'cool') return 'foco';
  return null;
}
// v22: o herói tem a altura do Merlin (as formas maiores crescem menos, para caber na fase)
function heroDrawH(P) {
  if (!HA.ready) return heroVisH(P);
  const r = heroVisH(P) / heroVisH(FORMP[0]);
  return MERLIN_H * (1 + (r - 1) * 0.45);
}
