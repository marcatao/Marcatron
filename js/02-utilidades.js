'use strict';
// =================================================================== utilidades
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);
function hash(i) { let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const REC_KEY = 'marcatron.recorde.1-1.v10';   // v10: o herói ficou mais 7% devagar, o recorde antigo não vale mais
const SCORE_KEY = 'marcatron.pontos.1-1';   // v8.1: melhor pontuação de manobras
// v8: o nome do personagem é perguntado ao abrir o jogo (o último fica salvo no aparelho e vem preenchido)
const NAME_KEY = 'marcatron.nome', NAME_DEF = 'Patinador';
const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} ._'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16);
// v19: filtro de nomes — palavrões, termos sexuais e pejorativos viram "Maninho". Normaliza acentos, maiúsculas, números no
// lugar de letras (p0rr4), letras repetidas (puuuta) e letras separadas (p.u.t.a). Raízes casam com o começo de cada palavra
// (evita "computador" → "puta"); as curtas só valem como palavra inteira (evita "Rolando" → "rola").
const NAME_SAFE = 'Maninho';
const NAME_BAD_ROOTS = ['caralh', 'porra', 'buceta', 'bucet', 'xoxot', 'xerec', 'xavasc', 'piroc', 'pirok', 'punhet', 'foder', 'fodid', 'fodas', 'foda', 'fuder', 'fudid',
  'puta', 'puto', 'putinh', 'putari', 'viado', 'viadinh', 'veado', 'bicha', 'boiola', 'baitola', 'sapatao', 'arromb', 'corno', 'cuzao', 'cuzinh', 'merda', 'bosta',
  'cacete', 'merd', 'siriric', 'boquet', 'chupa', 'gozad', 'goza', 'tesao', 'tesud', 'safad', 'putaria', 'sexo', 'porn', 'peitud', 'bundud', 'bunda', 'rabud',
  'idiota', 'imbecil', 'retardad', 'mongol', 'debil', 'otario', 'babaca', 'escrot', 'vagabund', 'piranh', 'vadia', 'macaco', 'crioul', 'negrinh', 'traveco', 'nazi', 'hitler',
  'fuck', 'shit', 'bitch', 'cock', 'pussy', 'cunt', 'nigg', 'fagg', 'slut', 'whore', 'porno', 'asshole', 'bastard', 'penis', 'vagina'];
const NAME_BAD_WORDS = ['cu', 'cus', 'pau', 'pica', 'rola', 'pinto', 'rabo', 'bct', 'krl', 'crl', 'fdp', 'pqp', 'vsf', 'tnc', 'vtnc', 'kct', 'tmnc', 'sex', 'sexy', 'nude', 'nudes', 'gozo', 'fag', 'ass', 'dick', 'anus'];
const badNorm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[0@4]/g, m => ({ 0: 'o', '@': 'a', 4: 'a' })[m]).replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[5$]/g, 's').replace(/7/g, 't').replace(/9/g, 'g')
  .replace(/[^a-z ]+/g, ' ').replace(/([a-z])\1+/g, '$1');
const BAD_ROOTS = NAME_BAD_ROOTS.map(badNorm).map(s => s.trim()), BAD_WORDS = new Set(NAME_BAD_WORDS.map(badNorm));
function nameBad(name) {
  const n = badNorm(name), words = n.split(/\s+/).filter(Boolean), glued = words.filter(w => w.length === 1).join('');   // p u t a → "puta"
  const hit = w => BAD_WORDS.has(w) || BAD_ROOTS.some(r => r.length >= 4 && w.startsWith(r));
  return words.some(hit) || (glued.length >= 3 && hit(glued)) || BAD_ROOTS.some(r => r.length >= 5 && n.replace(/ /g, '').includes(r));
}
let heroName = cleanName(store.get(NAME_KEY)) || NAME_DEF;
if (nameBad(heroName)) heroName = NAME_SAFE;
const NAME_UP = () => heroName.toUpperCase();
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function mix(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const r = Math.round(lerp(a >> 16, b >> 16, t)), g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}
function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); }
function vgrad(g, y0, y1, stops) { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function fillStroke(g, fill, lw = 0.7, stroke = OUT) { g.fillStyle = fill; g.fill(); if (lw > 0) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); } }
