'use strict';
// =================================================================== ranking (v14): o melhor tempo de cada nome
// Fica no banco do próprio artefato (claude.ai): sobrevive às atualizações do jogo e é o mesmo para todo mundo que abre o
// link. Cada nome é um documento ranking/<nome-normalizado> com o melhor tempo. Fora do claude.ai, ou para quem não pode
// gravar no banco (quem só tem acesso de leitura), o ranking fica guardado no próprio aparelho.
const RANK_LOCAL_KEY = 'marcatron.ranking.v1';
const RANK = { db: null, shared: false, canWrite: true, list: [], mine: null, myPos: 0, sending: false, failed: false };
const rankKey = name => String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'anonimo';
function rankClean(list) { return list.filter(r => r && typeof r.best === 'number' && r.best > 0 && typeof r.name === 'string' && r.name).sort((a, b) => a.best - b.best); }
function rankLocalLoad() { try { const v = JSON.parse(store.get(RANK_LOCAL_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function rankLocalSave(list) { store.set(RANK_LOCAL_KEY, JSON.stringify(rankClean(list).slice(0, 100))); }
(async function rankInit() {
  RANK.list = rankClean(rankLocalLoad());
  try {
    if (!window.claude || typeof window.claude.use !== 'function') return;   // aberto fora do claude.ai: ranking do aparelho
    const db = await window.claude.use('db'); if (!db) return;
    const user = await window.claude.use('user');
    if (user && typeof user.can === 'function') { try { if ((await user.can('data.write')) === false) RANK.canWrite = false; } catch (e) {} }
    RANK.db = db; RANK.shared = true;
    db.collection('ranking').orderBy('best', 'asc').limit(100).onSnapshot(snap => {
      RANK.list = rankClean(snap.docs.map(d => d.data())); rankFindMine();
    }, () => { RANK.shared = false; RANK.list = rankClean(rankLocalLoad()); rankFindMine(); });
  } catch (e) { RANK.shared = false; }
})();
function rankFindMine() { RANK.myPos = RANK.mine ? RANK.list.findIndex(r => rankKey(r.name) === RANK.mine) + 1 : 0; }
// chamado ao concluir a fase: grava o tempo se for o melhor desse nome
async function rankSubmit(name, t, extra = {}) {
  const key = rankKey(name), row = { name: String(name).slice(0, 16), best: Math.round(t * 1000) / 1000, at: new Date().toISOString(), score: extra.score || 0, medal: extra.medal || '' };
  RANK.mine = key; RANK.failed = false;
  const loc = rankLocalLoad(), i = loc.findIndex(r => r && rankKey(r.name) === key);
  if (i < 0) loc.push(row); else if (row.best < loc[i].best) loc[i] = row;
  rankLocalSave(loc);
  if (!RANK.shared || !RANK.db || !RANK.canWrite) { if (!RANK.shared) RANK.list = rankClean(loc); rankFindMine(); return; }
  RANK.sending = true;
  try {
    const ref = RANK.db.collection('ranking').doc(key), cur = await ref.get(), prev = cur.exists ? cur.data() : null;
    if (!prev || typeof prev.best !== 'number' || row.best < prev.best) await ref.set(row);
  } catch (e) {
    RANK.failed = true;
    if (e && e.code === 'invalid_argument') RANK.canWrite = false;   // sem permissão de gravar: fica só no aparelho
  }
  RANK.sending = false; rankFindMine();
}
// painel do ranking (resultado e tela de título)
function drawRanking(x, y, w, h, u, opts = {}) {
  const rows = RANK.list, max = opts.max || 10;
  rr(ctx, x, y, w, h, 16 * u); ctx.fillStyle = 'rgba(20,14,32,0.94)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,210,63,0.75)'; ctx.lineWidth = 2.5 * u; ctx.stroke();
  uiText(opts.title || 'RANKING', x + w / 2, y + 30 * u, 26 * u, '#ffd23f', 'center', 400, FONT_HAND, false);
  uiText(RANK.shared ? (RANK.canWrite ? 'MELHOR TEMPO DE CADA PATINADOR' : 'SEU TEMPO FICOU SÓ NESTE APARELHO') : 'GUARDADO NESTE APARELHO', x + w / 2, y + 54 * u, 12 * u, '#9a93ad', 'center', 800, FONT_UI, false);
  const top = y + 78 * u, lh = Math.min(26 * u, (h - 96 * u) / max);
  if (!rows.length) { uiText('NINGUÉM AINDA. SEJA O PRIMEIRO!', x + w / 2, top + 20 * u, 15 * u, '#cfc8de', 'center', 800, FONT_UI, false); return; }
  const show = rows.slice(0, max), mineIn = RANK.myPos > 0 && RANK.myPos <= max;
  show.forEach((r, i) => {
    const yy = top + i * lh, me = RANK.mine && rankKey(r.name) === RANK.mine;
    if (me) { rr(ctx, x + 10 * u, yy - lh * 0.46, w - 20 * u, lh * 0.92, 6 * u); ctx.fillStyle = 'rgba(182,255,59,0.18)'; ctx.fill(); }
    const col = me ? '#c8ff5a' : i === 0 ? '#ffcf3a' : i === 1 ? '#d7dde6' : i === 2 ? '#d08a48' : '#e8e2f6';
    uiText((i + 1) + 'º', x + 22 * u, yy, 16 * u, col, 'left', 800, FONT_UI, false);
    ctx.font = `800 ${16 * u}px ${FONT_UI}`; let nm = r.name.toUpperCase(); while (ctx.measureText(nm).width > w - 150 * u && nm.length > 3) nm = nm.slice(0, -1);
    uiText(nm, x + 56 * u, yy, 16 * u, col, 'left', 800, FONT_UI, false);
    uiText(fmt(r.best), x + w - 20 * u, yy, 16 * u, col, 'right', 800, FONT_UI, false);
  });
  if (RANK.myPos > max && !mineIn) {
    const r = rows[RANK.myPos - 1], yy = top + max * lh + 4 * u;
    uiText('…  ' + RANK.myPos + 'º  ' + r.name.toUpperCase(), x + 22 * u, yy, 15 * u, '#c8ff5a', 'left', 800, FONT_UI, false);
    uiText(fmt(r.best), x + w - 20 * u, yy, 15 * u, '#c8ff5a', 'right', 800, FONT_UI, false);
  }
  if (RANK.sending) uiText('salvando…', x + w / 2, y + h - 12 * u, 12 * u, '#9a93ad', 'center', 600, FONT_UI, false);
  else if (RANK.failed) uiText('não deu para salvar no ranking agora', x + w / 2, y + h - 12 * u, 12 * u, '#ff7a1a', 'center', 600, FONT_UI, false);
}
