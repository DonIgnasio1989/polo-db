/* ============================================================
База Мастера · Supabase Cloud Sync v4
Аккаунты + синхронизация поверх локального каталога.
Общее: parts (каталог+фото), workshops, schemes, votes.
Приватное: garage, logs, TO, shop, partState, profile.

v4: настраиваемый интервал, push без перерисовки, pull рисует
только при реальных изменениях, сохранение раскрытых блоков,
прокрутки и фокуса, пауза синхронизации одной кнопкой.
Подключение: блок-лоадер в конце app.js. index.html не трогаем.
============================================================ */
(function () {
'use strict';

/* ====== ЗАПОЛНИТЬ: Supabase → Project Settings → API ======
   Или ввести в окне входа («⚙ Подключение к Supabase»). */
const CFG = {
  url: 'https://qqeupqyvulouugjsacyu.supabase.co',
  key: 'sb_publishable_rLNCb-LGBM6Sf-1_e10ejg_XSFWwu3c'
};

const EPOCH = '1970-01-01T00:00:00.000Z';
const LSK = {
  cfg: 'bm_sb_cfg_v1',
  uid: 'bm_sb_uid_v1',
  curS: 'bm_sb_cur_shared_v1',
  curP: u => 'bm_sb_cur_priv_' + u,
  baseS: 'bm_sb_base_shared_v1',
  baseP: u => 'bm_sb_base_priv_' + u,
  tomb: 'bm_sb_tomb_v1',
  pend: 'bm_sb_pending_v1',
  last: 'bm_sb_last_sync_v1',
  sync: 'bm_sb_sync_v1'
};
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { } };

/* Настройки синхронизации (правятся в окне аккаунта) */
const SYNC_DEF = { interval: 300000, realtime: true, preserve: true, pauseOnType: true, paused: false };
const PRESETS = [
  { ms: 0, label: 'Вручную' },
  { ms: 60000, label: '1 мин' },
  { ms: 300000, label: '5 мин' },
  { ms: 900000, label: '15 мин' },
  { ms: 1800000, label: '30 мин' },
  { ms: 3600000, label: '60 мин' }
];
const intLabel = ms => (PRESETS.find(p => p.ms === ms) || { label: Math.round(ms / 60000) + ' мин' }).label;

const S = {
  sb: null, user: null, ready: false, pushing: false, pulling: false,
  pushT: null, pullT: null, timer: null, ch: null,
  bootPull: false, status: 'idle', warned: new Set(), deferred: null,
  sync: Object.assign({}, SYNC_DEF, lsGet(LSK.sync, {})),
  baseS: lsGet(LSK.baseS, { parts: {}, workshops: {}, schemes: {}, votes: {} }),
  baseP: { garage: {}, logs: {}, settings: {} },
  tomb: new Set(lsGet(LSK.tomb, [])),
  curS: lsGet(LSK.curS, EPOCH),
  curP: EPOCH,
  lastSync: lsGet(LSK.last, 0)
};
if (!S.baseS.votes) S.baseS.votes = {};
const saveSync = () => lsSet(LSK.sync, S.sync);

const J = o => JSON.stringify(o ?? null);
const hash = s => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16) + ':' + s.length;
};
const sharedData = p => ({
  cat: p.cat, sub: p.sub || '', name: p.name || '', oem: p.oem || '', verified: !!p.verified,
  analogs: p.analogs || [], donors: p.donors || [], engines: p.engines || [], bodies: p.bodies || [],
  transmissions: p.transmissions || [], transCodes: p.transCodes || [], trims: p.trims || [],
  gens: p.gens || [], prReq: p.prReq || [], prNo: p.prNo || [], sup: p.sup || '',
  price: p.price ?? null, currency: p.currency || 'RUB', shopUrl: p.shopUrl || '',
  photos: p.photos || [], parts: p.parts || [], inst: p.inst || [], priceHistory: p.priceHistory || []
});
const fpPart = p => hash(J(sharedData(p)));
const keyOf = p => String(p.oem || '').toLowerCase() + '|' + String(p.name || '').toLowerCase();
const personalOf = p => ({ status: p.status || '', favorite: !!p.favorite, notes: p.notes || '' });
const cfg = () => { const c = lsGet(LSK.cfg, null); return (c && c.url && c.key) ? c : CFG; };
const cfgOk = () => { const c = cfg(); return /^https:\/\/[a-z0-9-]+\.[a-z0-9.-]+\/?$/i.test(c.url || '') && (c.key || '').length > 40; };

/* ============================================================
Библиотека
============================================================ */
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => res(); s.onerror = () => rej(new Error('load ' + src));
    document.head.appendChild(s);
  });
}
async function loadLib() {
  if (window.supabase && window.supabase.createClient) return window.supabase;
  const cur = document.currentScript;
  const base = (cur && cur.src) ? cur.src.replace(/[^/]*$/, '') : 'js/';
  try { await loadScript(base + 'vendor/supabase.js'); } catch (e) { }
  if (!window.supabase || !window.supabase.createClient) {
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js');
  }
  if (!window.supabase || !window.supabase.createClient) throw new Error('supabase-js недоступен');
  return window.supabase;
}
async function makeClient() {
  const lib = await loadLib();
  const c = cfg();
  S.sb = lib.createClient(c.url.replace(/\/+$/, ''), c.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'bm_sb_auth' }
  });
  S.sb.auth.onAuthStateChange(ev => {
    if (ev === 'PASSWORD_RECOVERY') { renderReset(); openM('cloudmo'); return; }
    if (ev === 'SIGNED_OUT') { S.user = null; paintChip(); }
  });
  return S.sb;
}

/* ============================================================
СОХРАНЕНИЕ СОСТОЯНИЯ ЭКРАНА
Раскрытые «Подробности», разделы расходников, дерево ETKA,
прокрутка каталога и карточки, курсор в поле заметки.
============================================================ */
function detailKey(d) {
  if (!d || !d.tagName) return '';
  if (d.dataset && d.dataset.etkey) return 'et:' + d.dataset.etkey;
  if (d.dataset && d.dataset.mgr) return 'mgr:' + d.dataset.mgr;
  if (d.classList && d.classList.contains('cd-body')) {
    if (d.closest('#partmo_body')) return 'pm:' + (partmoId || '');
    const c = d.closest('.cd');
    if (c && c.dataset && c.dataset.id) return 'cd:' + c.dataset.id;
  }
  if (d.classList && d.classList.contains('iss-src')) {
    const t = d.querySelector('.iss-src-t');
    return 'iss:' + (t ? t.textContent : '');
  }
  return '';
}
function captureUI() {
  const open = new Set();
  document.querySelectorAll('#ca details[open], #partmo_body details[open]').forEach(d => {
    const k = detailKey(d); if (k) open.add(k);
  });
  const ca = document.getElementById('ca');
  const pm = document.getElementById('partmo_body');
  const a = document.activeElement;
  let focus = null;
  if (a && a.dataset && a.dataset.notesId) {
    focus = {
      id: a.dataset.notesId,
      inModal: !!a.closest('#partmo_body'),
      start: a.selectionStart, end: a.selectionEnd, value: a.value
    };
  }
  return {
    open,
    scroll: ca ? ca.scrollTop : 0,
    pmScroll: pm ? pm.scrollTop : 0,
    focus
  };
}
function restoreUI(st) {
  if (!st) return;
  if (S.sync.preserve) {
    document.querySelectorAll('#ca details, #partmo_body details').forEach(d => {
      const k = detailKey(d);
      if (k) d.open = st.open.has(k);
    });
  }
  if (st.focus) {
    const scope = st.focus.inModal ? document.getElementById('partmo_body') : document.getElementById('ca');
    const el = scope && scope.querySelector('[data-notes-id="' + CSS.escape(st.focus.id) + '"]');
    if (el) {
      el.value = st.focus.value;
      el.focus({ preventScroll: true });
      try { el.setSelectionRange(st.focus.start, st.focus.end); } catch (e) { }
    }
  }
  const ca = document.getElementById('ca');
  const pm = document.getElementById('partmo_body');
  if (ca) ca.scrollTop = st.scroll;
  if (pm) pm.scrollTop = st.pmScroll;
  requestAnimationFrame(() => {
    if (ca && Math.abs(ca.scrollTop - st.scroll) > 2) ca.scrollTop = st.scroll;
    if (pm && Math.abs(pm.scrollTop - st.pmScroll) > 2) pm.scrollTop = st.pmScroll;
  });
}
function isTyping() {
  const a = document.activeElement;
  if (!a) return false;
  const t = String(a.tagName || '').toLowerCase();
  return t === 'textarea' || t === 'select' ||
    (t === 'input' && !/^(checkbox|radio|button|submit|file|range|color)$/i.test(a.type || 'text'));
}

/* ============================================================
UI
============================================================ */
function injectUI() {
  if (document.getElementById('clChip')) return;
  const st = document.createElement('style');
  st.textContent = `
.cl-chip{display:flex;align-items:stretch;gap:0;width:100%;margin:0 0 10px;
 background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:var(--r-md,10px);
 overflow:hidden;transition:border-color var(--tr,.2s),box-shadow var(--tr,.2s)}
.cl-chip:hover{border-color:var(--a);box-shadow:var(--sh-glow)}
.cl-main{flex:1;min-width:0;display:flex;align-items:center;gap:10px;padding:8px 10px;background:none;border:none;
 color:#fff;font-family:inherit;font-size:.78rem;font-weight:600;cursor:pointer;text-align:left;transition:background var(--tr,.2s)}
.cl-main:hover{background:color-mix(in srgb,var(--a) 16%,transparent)}
.cl-pause{flex:0 0 34px;background:rgba(255,255,255,.05);border:none;border-left:1px solid rgba(255,255,255,.12);
 color:#fff;font-size:.82rem;cursor:pointer;font-family:inherit;transition:all var(--tr,.2s)}
.cl-pause:hover{background:color-mix(in srgb,var(--a) 28%,transparent)}
.cl-pause.on{color:var(--sr,#fbbf24)}
.cl-ic{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;
 font-size:.95rem;background:linear-gradient(135deg,var(--a),var(--a-h));box-shadow:0 2px 8px rgba(0,0,0,.3)}
.cl-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.cl-t1{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cl-t2{font-size:.62rem;font-weight:500;opacity:.72;display:flex;align-items:center;gap:5px;
 overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cl-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;background:#8b95a5}
.cl-dot.ok{background:var(--ok,#3ecf7e);box-shadow:0 0 6px var(--ok,#3ecf7e)}
.cl-dot.err{background:var(--dg,#f25c69)}
.cl-dot.pause{background:var(--sr,#fbbf24)}
.cl-dot.busy{background:var(--sr,#fbbf24);animation:clPulse 1s ease-in-out infinite}
@keyframes clPulse{50%{opacity:.35}}
.cl-tabs{display:flex;gap:6px;margin-bottom:14px}
.cl-tab{flex:1;padding:9px;border:1.5px solid var(--bd);border-radius:var(--r-sm,6px);background:var(--cd-2);
 color:var(--tx);font-family:inherit;font-size:.84rem;font-weight:700;cursor:pointer;transition:all var(--tr,.2s)}
.cl-tab.on{background:linear-gradient(135deg,var(--a),var(--a-h));color:#fff;border-color:transparent}
.cl-err{margin:10px 0 0;padding:9px 12px;border-radius:var(--r-sm,6px);font-size:.8rem;font-weight:600;
 background:color-mix(in srgb,var(--dg) 12%,transparent);border:1px solid var(--dg);color:var(--dg)}
.cl-ok{margin:10px 0 0;padding:9px 12px;border-radius:var(--r-sm,6px);font-size:.8rem;font-weight:600;
 background:color-mix(in srgb,var(--ok) 12%,transparent);border:1px solid var(--ok);color:var(--ok)}
.cl-note{font-size:.74rem;color:var(--mu);line-height:1.55;margin-top:12px}
.cl-note b{color:var(--tx)}
.cl-link{background:none;border:none;padding:0;margin-top:10px;color:var(--a);font-family:inherit;
 font-size:.76rem;font-weight:600;cursor:pointer;text-decoration:underline dotted}
.cl-acc{display:flex;align-items:center;gap:14px;padding:14px;border:1px solid var(--bd);border-radius:var(--r-md,10px);
 background:linear-gradient(135deg,color-mix(in srgb,var(--a) 9%,transparent),transparent);margin-bottom:14px}
.cl-ava{width:52px;height:52px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;
 font-size:1.3rem;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--a),var(--a-h));box-shadow:var(--sh-glow)}
.cl-acc-n{font-weight:800;font-size:1rem;color:var(--tx)}
.cl-acc-l{font-size:.76rem;color:var(--mu);font-family:var(--ff-mono,monospace);word-break:break-all}
.cl-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:14px}
.cl-stat{padding:9px 11px;border:1px solid var(--bd);border-radius:var(--r-sm,6px);background:var(--hv)}
.cl-stat b{display:block;font-size:1.05rem;color:var(--a);font-family:var(--ff-mono,monospace)}
.cl-stat span{font-size:.68rem;color:var(--mu)}
.cl-set{border:1px solid var(--bd);border-radius:var(--r-md,10px);padding:12px;margin-bottom:14px;background:var(--hv)}
.cl-set-h{font-size:.62rem;text-transform:uppercase;letter-spacing:.7px;font-weight:800;color:var(--mu);
 margin-bottom:10px;display:flex;align-items:center;gap:8px}
.cl-set-h::before{content:'';width:3px;height:12px;border-radius:2px;background:linear-gradient(180deg,var(--a),var(--a-h))}
.cl-seg{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}
.cl-seg button{flex:1 1 auto;min-width:62px;padding:7px 8px;border:1.5px solid var(--bd);border-radius:var(--r-sm,6px);
 background:var(--cd-2);color:var(--tx);font-family:inherit;font-size:.74rem;font-weight:700;cursor:pointer;transition:all var(--tr,.2s)}
.cl-seg button:hover{border-color:var(--a);color:var(--a)}
.cl-seg button.on{background:linear-gradient(135deg,var(--a),var(--a-h));color:#fff;border-color:transparent}
.cl-sw{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:.8rem;color:var(--tx);cursor:pointer}
.cl-sw input{position:absolute;opacity:0;width:0;height:0}
.cl-sw i{width:34px;height:18px;border-radius:999px;background:var(--bd);position:relative;flex-shrink:0;transition:background var(--tr,.2s)}
.cl-sw i::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;
 transition:transform var(--tr,.2s);box-shadow:0 1px 3px rgba(0,0,0,.3)}
.cl-sw input:checked+i{background:linear-gradient(135deg,var(--a),var(--a-h))}
.cl-sw input:checked+i::after{transform:translateX(16px)}
.cl-sw span{flex:1;min-width:0}
.cl-sw em{display:block;font-style:normal;font-size:.68rem;color:var(--mu);margin-top:1px}
.cl-rows{display:flex;flex-direction:column;gap:8px}
.cl-rows .bn{justify-content:center}
.cl-srv{margin-top:12px}
.cl-srv summary{cursor:pointer;font-size:.74rem;color:var(--mu);user-select:none}
.cl-srv .fg{margin-top:8px}
.cl-spin{display:inline-block;animation:clRot 1s linear infinite}
@keyframes clRot{to{transform:rotate(360deg)}}
@media(max-width:900px){.cl-main{padding:7px 9px}.cl-seg button{min-width:54px;font-size:.7rem}}`;
  document.head.appendChild(st);

  const chip = document.createElement('div');
  chip.className = 'cl-chip'; chip.id = 'clChip';
  chip.innerHTML = '<button type="button" class="cl-main" id="clMain"></button>'
    + '<button type="button" class="cl-pause" id="clPause" title="Пауза автосинхронизации">⏸</button>';
  const sft = document.querySelector('.sft');
  if (sft) sft.insertBefore(chip, sft.firstChild);
  else { chip.style.cssText = 'position:fixed;left:12px;bottom:12px;width:250px;z-index:2600'; document.body.appendChild(chip); }
  document.getElementById('clMain').addEventListener('click', openCloud);
  document.getElementById('clPause').addEventListener('click', togglePause);

  const mo = document.createElement('div');
  mo.className = 'mo'; mo.id = 'cloudmo';
  mo.innerHTML = '<div class="mdl" style="max-width:480px">'
    + '<div class="mh"><h3 id="clTitle">☁️ Аккаунт</h3><button class="mc" type="button" id="clClose">✕</button></div>'
    + '<div class="mb" id="clBody"></div></div>';
  document.body.appendChild(mo);
  mo.addEventListener('click', e => { if (e.target === mo) closeM('cloudmo'); });
  document.getElementById('clClose').addEventListener('click', () => closeM('cloudmo'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mo.classList.contains('show')) { e.stopPropagation(); closeM('cloudmo'); }
  }, true);
  paintChip();
}
function openCloud() { S.user ? renderAccount() : renderAuth('login'); openM('cloudmo'); }
function togglePause() {
  if (!S.user) { openCloud(); return; }
  S.sync.paused = !S.sync.paused; saveSync(); startTimer(); paintChip();
  toast(S.sync.paused ? '⏸ Автосинхронизация на паузе — правки копятся локально' : '▶ Автосинхронизация включена', 'info');
  if (!S.sync.paused) syncNow(false);
}
function paintChip() {
  const c = document.getElementById('clMain'); if (!c) return;
  const pb = document.getElementById('clPause');
  let dot = '', sub = 'Войти и синхронизировать', title = '☁️ Войти';
  if (!cfgOk()) sub = 'Укажите проект Supabase';
  else if (S.user) {
    title = '☁️ ' + (S.user.name || S.user.email);
    const tail = S.sync.paused ? 'пауза' : (S.sync.interval ? 'авто · ' + intLabel(S.sync.interval) : 'вручную');
    if (S.status === 'busy') { dot = 'busy'; sub = 'Синхронизация…'; }
    else if (S.status === 'err') { dot = 'err'; sub = 'Оффлайн · ' + tail; }
    else if (S.sync.paused) { dot = 'pause'; sub = 'Пауза · правки сохраняются локально'; }
    else if (S.lastSync) { dot = 'ok'; sub = new Date(S.lastSync).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + ' · ' + tail; }
    else { dot = 'ok'; sub = 'На связи · ' + tail; }
  }
  c.innerHTML = '<span class="cl-ic">' + (S.user ? esc((S.user.name || S.user.email).slice(0, 1).toUpperCase()) : '☁️') + '</span>'
    + '<span class="cl-tx"><span class="cl-t1">' + esc(title) + '</span>'
    + '<span class="cl-t2"><span class="cl-dot ' + dot + '"></span>' + esc(sub) + '</span></span>';
  if (pb) {
    pb.textContent = S.sync.paused ? '▶' : '⏸';
    pb.classList.toggle('on', !!S.sync.paused);
    pb.title = S.sync.paused ? 'Возобновить автосинхронизацию' : 'Поставить автосинхронизацию на паузу';
    pb.style.display = S.user ? '' : 'none';
  }
}
const setStatus = s => { S.status = s; paintChip(); };
const cfgFields = () =>
  '<details class="cl-srv"' + (cfgOk() ? '' : ' open') + '><summary>⚙ Подключение к Supabase</summary>'
  + '<div class="fg"><label>Project URL</label><input type="url" id="clUrl" placeholder="https://xxx.supabase.co" value="' + escA(cfg().url || '') + '"></div>'
  + '<div class="fg"><label>anon public key</label><input type="text" id="clKey" placeholder="eyJhbGciOi…" value="' + escA(cfg().key || '') + '"></div>'
  + '<button type="button" class="bn" id="clCfgSave" style="width:100%;justify-content:center">💾 Сохранить и подключиться</button>'
  + '<p class="cl-note">Ключ <b>anon</b> публичный — данные защищает RLS на сервере.</p></details>';
function bindCfg() {
  const b = document.getElementById('clCfgSave'); if (!b) return;
  b.addEventListener('click', async () => {
    lsSet(LSK.cfg, { url: document.getElementById('clUrl').value.trim(), key: document.getElementById('clKey').value.trim() });
    try { await makeClient(); toast('Подключение сохранено', 'success'); S.user ? renderAccount() : renderAuth(authTab); }
    catch (e) { toast('Не удалось подключиться: ' + e.message, 'danger'); }
    paintChip();
  });
}

let authTab = 'login';
function renderAuth(tab) {
  authTab = tab || authTab;
  const reg = authTab === 'register';
  document.getElementById('clTitle').textContent = '☁️ Вход и синхронизация';
  document.getElementById('clBody').innerHTML =
    '<div class="cl-tabs">'
    + '<button type="button" class="cl-tab' + (!reg ? ' on' : '') + '" data-cl-tab="login">Вход</button>'
    + '<button type="button" class="cl-tab' + (reg ? ' on' : '') + '" data-cl-tab="register">Регистрация</button></div>'
    + (reg ? '<div class="fg"><label>Имя</label><input type="text" id="clName" maxlength="40" placeholder="Бро"></div>' : '')
    + '<div class="fg"><label>Email</label><input type="email" id="clEmail" autocomplete="username" placeholder="master@garage.ru"></div>'
    + '<div class="fg"><label>Пароль</label><input type="password" id="clPass" autocomplete="' + (reg ? 'new-password' : 'current-password') + '" placeholder="минимум 6 символов"></div>'
    + '<div id="clMsg"></div>'
    + '<button type="button" class="bn p" id="clGo" style="width:100%;justify-content:center;margin-top:14px;padding:12px">'
    + (reg ? '✨ Создать аккаунт' : '🔓 Войти') + '</button>'
    + (reg ? '' : '<button type="button" class="cl-link" id="clForgot">Забыли пароль?</button>')
    + cfgFields()
    + '<p class="cl-note"><b>Общее для всех:</b> каталог с правками и фото, СТО, схемы узлов, голоса за аналоги. '
    + '<b>Только ваше:</b> гараж, журнал, ТО, список покупок, статусы, избранное и заметки — доступны с любого устройства после входа.</p>';
  document.querySelectorAll('[data-cl-tab]').forEach(b => b.addEventListener('click', () => renderAuth(b.dataset.clTab)));
  bindCfg();
  const msg = (m, ok) => { document.getElementById('clMsg').innerHTML = '<div class="' + (ok ? 'cl-ok' : 'cl-err') + '">' + esc(m) + '</div>'; };
  const go = document.getElementById('clGo');
  const submit = async () => {
    const email = document.getElementById('clEmail').value.trim();
    const password = document.getElementById('clPass').value;
    const name = reg ? document.getElementById('clName').value.trim() : '';
    if (!email || !password) return msg('Заполните email и пароль');
    if (!cfgOk()) return msg('Сначала укажите Project URL и anon key (⚙ Подключение)');
    go.disabled = true; go.innerHTML = '<span class="cl-spin">⏳</span> Подождите…';
    try {
      if (!S.sb) await makeClient();
      const r = reg
        ? await S.sb.auth.signUp({ email, password, options: { data: { name: name || email.split('@')[0] } } })
        : await S.sb.auth.signInWithPassword({ email, password });
      if (r.error) throw r.error;
      if (!r.data.session) {
        msg('Письмо с подтверждением отправлено на ' + email + '. Подтвердите и войдите.', true);
        go.disabled = false; go.textContent = '✨ Создать аккаунт';
        return;
      }
      closeM('cloudmo');
      if (typeof pubMode === 'function' && pubMode()) { toast('☁️ Вход выполнен — включаю полную версию', 'success'); setTimeout(() => pubExit(), 600); return; }
      await startSession(r.data.user);
      toast('☁️ Добро пожаловать! Синхронизация включена', 'success');
    } catch (e) {
      msg(ruAuthErr(e.message || String(e)));
      go.disabled = false; go.textContent = reg ? '✨ Создать аккаунт' : '🔓 Войти';
    }
  };
  go.addEventListener('click', submit);
  ['clEmail', 'clPass'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
  const f = document.getElementById('clForgot');
  if (f) f.addEventListener('click', async () => {
    const email = document.getElementById('clEmail').value.trim();
    if (!email) return msg('Введите email — пришлём ссылку для сброса');
    try {
      if (!S.sb) await makeClient();
      const { error } = await S.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if (error) throw error;
      msg('Ссылка для сброса пароля отправлена на ' + email, true);
    } catch (e) { msg(ruAuthErr(e.message)); }
  });
  setTimeout(() => { const el = document.getElementById('clEmail'); if (el) el.focus(); }, 60);
}
function ruAuthErr(m) {
  if (/Invalid login credentials/i.test(m)) return 'Неверный email или пароль';
  if (/already registered|already exists/i.test(m)) return 'Такой email уже зарегистрирован';
  if (/Password should be/i.test(m)) return 'Пароль слишком короткий (минимум 6 символов)';
  if (/Email not confirmed/i.test(m)) return 'Email не подтверждён — проверьте почту';
  if (/rate limit|too many/i.test(m)) return 'Слишком много попыток — подождите минуту';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Сервер недоступен — проверьте сеть и адрес проекта';
  return m;
}
function renderReset() {
  document.getElementById('clTitle').textContent = '🔑 Новый пароль';
  document.getElementById('clBody').innerHTML =
    '<div class="fg"><label>Новый пароль</label><input type="password" id="clNew" placeholder="минимум 6 символов"></div>'
    + '<div id="clMsg"></div>'
    + '<button type="button" class="bn p" id="clSet" style="width:100%;justify-content:center;margin-top:12px">💾 Сохранить пароль</button>';
  document.getElementById('clSet').addEventListener('click', async () => {
    try {
      const { error } = await S.sb.auth.updateUser({ password: document.getElementById('clNew').value });
      if (error) throw error;
      closeM('cloudmo'); toast('Пароль обновлён', 'success');
    } catch (e) { document.getElementById('clMsg').innerHTML = '<div class="cl-err">' + esc(ruAuthErr(e.message)) + '</div>'; }
  });
}
function syncPanel() {
  return '<div class="cl-set"><div class="cl-set-h">Автосинхронизация</div>'
    + '<div class="cl-seg" id="clSeg">' + PRESETS.map(p =>
      '<button type="button" data-ms="' + p.ms + '" class="' + (S.sync.interval === p.ms ? 'on' : '') + '">' + p.label + '</button>').join('') + '</div>'
    + '<label class="cl-sw"><input type="checkbox" id="clRt"' + (S.sync.realtime ? ' checked' : '') + '><i></i>'
    + '<span>Мгновенно ловить чужие правки<em>Realtime-канал: приходит сразу, экран обновляется только при изменениях</em></span></label>'
    + '<label class="cl-sw"><input type="checkbox" id="clPres"' + (S.sync.preserve ? ' checked' : '') + '><i></i>'
    + '<span>Сохранять раскрытые блоки<em>«Подробности», разделы ТО, прокрутка и курсор в заметке</em></span></label>'
    + '<label class="cl-sw"><input type="checkbox" id="clType"' + (S.sync.pauseOnType ? ' checked' : '') + '><i></i>'
    + '<span>Не трогать экран при вводе<em>Пока курсор в поле — перерисовка откладывается</em></span></label>'
    + '</div>';
}
function renderAccount() {
  const u = S.user;
  document.getElementById('clTitle').textContent = '☁️ Аккаунт и синхронизация';
  document.getElementById('clBody').innerHTML =
    '<div class="cl-acc"><div class="cl-ava">' + esc((u.name || u.email).slice(0, 1).toUpperCase()) + '</div>'
    + '<div><div class="cl-acc-n">' + esc(u.name || 'Мастер') + '</div><div class="cl-acc-l">' + esc(u.email) + '</div></div></div>'
    + '<div class="cl-stats">'
    + '<div class="cl-stat"><b>' + G.length + '</b><span>машин в гараже</span></div>'
    + '<div class="cl-stat"><b>' + LOG.length + '</b><span>записей журнала</span></div>'
    + '<div class="cl-stat"><b>' + Object.keys(S.baseS.parts).length + '</b><span>деталей на сервере</span></div>'
    + '</div>'
    + syncPanel()
    + '<div class="cl-rows">'
    + '<button type="button" class="bn p" id="clSync">🔄 Синхронизировать сейчас</button>'
    + '<button type="button" class="bn" id="clPause2">' + (S.sync.paused ? '▶ Возобновить автосинхронизацию' : '⏸ Поставить на паузу') + '</button>'
    + '<button type="button" class="bn" id="clSeed">📤 Отправить весь каталог на сервер</button>'
    + '<button type="button" class="bn" id="clOut">🚪 Выйти</button>'
    + '</div>'
    + cfgFields()
    + '<p class="cl-note">Последняя синхронизация: <b>' + (S.lastSync ? new Date(S.lastSync).toLocaleString('ru-RU') : '—') + '</b>. '
    + 'Ваши правки уходят на сервер сразу и <b>без перерисовки экрана</b>. Чужие изменения приходят по расписанию выше.</p>';
  bindCfg();
  document.querySelectorAll('#clSeg button').forEach(b => b.addEventListener('click', () => {
    S.sync.interval = Number(b.dataset.ms);
    if (S.sync.interval) S.sync.paused = false;
    saveSync(); startTimer(); paintChip(); renderAccount();
    toast(S.sync.interval ? '⏱ Проверка чужих правок: ' + intLabel(S.sync.interval) : '⏱ Автопроверка выключена — только вручную', 'success');
  }));
  const bindSw = (id, key, after) => {
    const el = document.getElementById(id);
    el.addEventListener('change', () => { S.sync[key] = el.checked; saveSync(); if (after) after(); paintChip(); });
  };
  bindSw('clRt', 'realtime', () => { S.sync.realtime ? subscribe() : unsubscribe(); });
  bindSw('clPres', 'preserve');
  bindSw('clType', 'pauseOnType', () => { if (!S.sync.pauseOnType) flushDeferred(); });
  document.getElementById('clSync').addEventListener('click', async () => { closeM('cloudmo'); await syncNow(true); });
  document.getElementById('clPause2').addEventListener('click', () => { togglePause(); renderAccount(); });
  document.getElementById('clSeed').addEventListener('click', () => {
    if (!confirm('Отправить все локальные детали, СТО и схемы на сервер? Существующие записи будут обновлены вашими версиями.')) return;
    S.baseS.parts = {}; S.baseS.workshops = {}; S.baseS.schemes = {};
    lsSet(LSK.baseS, S.baseS);
    closeM('cloudmo'); syncNow(true);
  });
  document.getElementById('clOut').addEventListener('click', async () => {
    try { await pushOnly(); } catch (e) { }
    try { await S.sb.auth.signOut(); } catch (e) { }
    unsubscribe(); stopTimer(); wipePrivate();
    S.user = null; S.bootPull = false; S.status = 'idle'; lsDel(LSK.uid);
    closeM('cloudmo'); paintChip();
    toast('Вы вышли. Приватные данные — в аккаунте', 'info');
  });
}

/* ============================================================
Приватная зона
============================================================ */
function wipePrivate() {
  G = []; LOG = []; TO_ALL = {}; SHOP_ALL = {};
  D.forEach(p => { p.status = ''; p.favorite = false; p.notes = ''; });
  sG(); _toPersist(); toSync();
  lsSet(SHPKEY, { byVin: {} }); shopSync();
  if (useIDB) { iMany(SP, D).catch(() => { }); iClr('logs').catch(() => { }); } else { sD(); sLogs(); }
  SV.activeVinId = null; SV.vinStrictFilter = false;
  _rebuildLogIndex(); applyVinFilters(); sU(); rGar(); rSB(); rTOWidget(); rC();
  S.baseP = { garage: {}, logs: {}, settings: {} };
  S.curP = EPOCH;
}
async function startSession(user) {
  const prev = lsGet(LSK.uid, null);
  if (prev != null && prev !== user.id) wipePrivate();
  S.user = { id: user.id, email: user.email || '', name: (user.user_metadata && user.user_metadata.name) || USER.name || '' };
  lsSet(LSK.uid, user.id);
  S.baseP = lsGet(LSK.baseP(user.id), { garage: {}, logs: {}, settings: {} });
  S.curP = lsGet(LSK.curP(user.id), EPOCH);
  S.bootPull = false;
  paintChip();
  if (S.sync.realtime) subscribe();
  startTimer();
  await syncNow(false);
}

/* ============================================================
PULL — применяем только реальные изменения
============================================================ */
const newCtx = () => ({ parts: new Set(), workshops: false, schemes: false, votes: false, garage: false, logs: false, settings: false });
const ctxAny = c => !!(c.parts.size || c.workshops || c.schemes || c.votes || c.garage || c.logs || c.settings);

function applyParts(rows, authoritative, ctx) {
  if (!Array.isArray(rows) || !rows.length) return;
  const byKey = new Map();
  D.forEach(p => { const k = keyOf(p); if (!byKey.has(k)) byKey.set(k, p); });
  const renamed = [];
  for (const r of rows) {
    if (!r || !r.id) continue;
    let local = D.find(x => x.id === r.id) || null;
    if (!local && r.data) local = byKey.get(keyOf(r.data)) || null;
    if (r.deleted) {
      S.tomb.add(r.id); delete S.baseS.parts[r.id];
      if (local) { D = D.filter(x => x !== local); if (useIDB) iDel(SP, local.id).catch(() => { }); ctx.parts.add(r.id); }
      continue;
    }
    if (!r.data) continue;
    const inc = nP(Object.assign({}, r.data, { id: r.id }));
    if (!inc) continue;
    if (local) {
      const localFp = fpPart(local), incFp = fpPart(inc);
      const base = S.baseS.parts[local.id];
      const clean = base && base.fp === localFp;
      if (localFp === incFp && local.id === r.id) {
        if (!base || base.ts !== r.updatedAt) S.baseS.parts[r.id] = { fp: localFp, ts: r.updatedAt, key: keyOf(local) };
        continue;                                    // нечего менять — экран не трогаем
      }
      if (!authoritative && !clean) continue;        // наша правка ждёт push
      const personal = personalOf(local);
      if (local.id !== r.id) { renamed.push(local.id); delete S.baseS.parts[local.id]; local.id = r.id; }
      Object.assign(local, sharedData(inc), personal);
      S.baseS.parts[r.id] = { fp: fpPart(local), ts: r.updatedAt, key: keyOf(local) };
      ctx.parts.add(r.id);
    } else {
      D.push(inc); byKey.set(keyOf(inc), inc);
      S.baseS.parts[r.id] = { fp: fpPart(inc), ts: r.updatedAt, key: keyOf(inc) };
      ctx.parts.add(r.id);
    }
  }
  if (useIDB) renamed.forEach(id => iDel(SP, id).catch(() => { }));
}
function applyWorkshops(rows, authoritative, ctx) {
  if (!Array.isArray(rows)) return;
  for (const r of rows) {
    if (!r || !r.id) continue;
    const local = W.find(x => x.id === r.id);
    if (r.deleted) {
      delete S.baseS.workshops[r.id];
      if (local) { W = W.filter(x => x !== local); if (useIDB) iDel(SW, local.id).catch(() => { }); ctx.workshops = true; }
      continue;
    }
    const inc = nW(Object.assign({}, r.data, { id: r.id }));
    if (!inc) continue;
    const fp = hash(J(inc));
    if (local) {
      const lfp = hash(J(local));
      if (lfp === fp) { S.baseS.workshops[r.id] = { fp, ts: r.updatedAt }; continue; }
      const clean = S.baseS.workshops[r.id] && S.baseS.workshops[r.id].fp === lfp;
      if (!authoritative && !clean) continue;
      Object.assign(local, inc);
    } else W.push(inc);
    S.baseS.workshops[r.id] = { fp: hash(J(local || inc)), ts: r.updatedAt };
    ctx.workshops = true;
  }
}
function applySchemes(rows, authoritative, ctx) {
  if (!Array.isArray(rows) || !rows.length) return;
  const all = schAll(); let touched = false;
  for (const r of rows) {
    if (!r || !r.id) continue;
    if (r.deleted) { if (all[r.id]) { delete all[r.id]; touched = true; } delete S.baseS.schemes[r.id]; continue; }
    if (!r.data) continue;
    const fp = hash(J(r.data));
    const localFp = all[r.id] ? hash(J(all[r.id])) : null;
    if (localFp === fp) { S.baseS.schemes[r.id] = { fp, ts: r.updatedAt }; continue; }
    const clean = S.baseS.schemes[r.id] && S.baseS.schemes[r.id].fp === localFp;
    if (authoritative || clean || localFp == null) {
      all[r.id] = r.data; S.baseS.schemes[r.id] = { fp: hash(J(all[r.id])), ts: r.updatedAt }; touched = true;
    }
  }
  if (touched) { schSetAll(all); ctx.schemes = true; }
}
function applyVotes(votes, ctx) {
  if (!votes) return;
  const all = votesAll(); let touched = false;
  Object.keys(votes).forEach(k => {
    const srv = votes[k], cur = all[k] || { ok: 0, bad: 0, my: '' };
    const localMy = cur.my || '', baseMy = S.baseS.votes[k] || '';
    const my = (localMy === baseMy) ? (srv.my || '') : localMy;
    const ok = srv.ok | 0, bad = srv.bad | 0;
    if ((cur.ok | 0) === ok && (cur.bad | 0) === bad && localMy === my) { S.baseS.votes[k] = my; return; }
    all[k] = { ok, bad, my }; S.baseS.votes[k] = my; touched = true;
  });
  if (touched) { lsSet(VOTEKEY, all); ctx.votes = true; }
}
function applyPrivate(kind, rows, get, set, idb, ctx) {
  if (!Array.isArray(rows) || !rows.length) return;
  const arr = get(); const removed = []; let touched = false;
  for (const r of rows) {
    if (!r || !r.id) continue;
    const i = arr.findIndex(x => x.id === r.id);
    const local = i >= 0 ? arr[i] : null;
    const base = S.baseP[kind][r.id];
    const clean = !local || (base && base.fp === hash(J(local)));
    if (r.deleted) {
      delete S.baseP[kind][r.id];
      if (local && clean) { arr.splice(i, 1); removed.push(r.id); touched = true; }
      continue;
    }
    if (!r.data) continue;
    const inc = Object.assign({}, r.data, { id: r.id });
    const fp = hash(J(inc));
    if (local) {
      if (hash(J(local)) === fp) { S.baseP[kind][r.id] = { fp, ts: r.updatedAt }; continue; }
      if (!clean) continue;
      Object.assign(local, inc);
    } else arr.push(inc);
    S.baseP[kind][r.id] = { fp: hash(J(local || inc)), ts: r.updatedAt };
    touched = true;
  }
  set(arr);
  if (idb && useIDB) removed.forEach(id => iDel(idb, id).catch(() => { }));
  if (touched) ctx[kind] = true;
}
function buildPartState() {
  const m = {};
  D.forEach(p => { if (p.status || p.favorite || p.notes) m[p.id] = personalOf(p); });
  return m;
}
function applySettings(st, ctx) {
  if (!st) return;
  for (const k of Object.keys(st)) {
    const r = st[k]; if (!r || r.data == null) continue;
    const cur = k === 'to' ? TO_ALL : k === 'shop' ? SHOP_ALL : k === 'profile' ? USER : buildPartState();
    const base = S.baseP.settings[k];
    const localFp = hash(J(cur)), remoteFp = hash(J(r.data));
    if (localFp === remoteFp) { S.baseP.settings[k] = { fp: localFp, ts: r.updatedAt }; continue; }
    if (base && base.fp !== localFp) continue;      // локальное новее — уйдёт push
    if (k === 'to') { TO_ALL = r.data || {}; toSync(); _toPersist(); }
    else if (k === 'shop') { SHOP_ALL = r.data || {}; lsSet(SHPKEY, { byVin: SHOP_ALL }); shopSync(); }
    else if (k === 'profile') { USER = Object.assign({ name: '', email: '', city: '', initials: '', color: '#00b0f0' }, r.data); sProfileStorage(); renderProfile(); }
    else if (k === 'partState') {
      const m = r.data || {};
      D.forEach(p => { const s = m[p.id]; if (s) { p.status = s.status || ''; p.favorite = !!s.favorite; p.notes = s.notes || ''; } });
    }
    const after = k === 'to' ? TO_ALL : k === 'shop' ? SHOP_ALL : k === 'profile' ? USER : buildPartState();
    S.baseP.settings[k] = { fp: hash(J(after)), ts: r.updatedAt };
    ctx.settings = true;
  }
}

/* Перерисовка с сохранением состояния экрана */
function renderAll(ctx) {
  const st = captureUI();
  if (ctx.parts.size) { useIDB ? iMany(SP, D).catch(() => { }) : sD(); }
  if (ctx.workshops) { useIDB ? iMany(SW, W).catch(() => { }) : sWk(); }
  if (ctx.garage) sG();
  if (ctx.logs) { useIDB ? iMany('logs', LOG).catch(() => { }) : sLogs(); }
  if (ctx.parts.size || ctx.workshops) applyAnalogKb();
  if (ctx.logs) _rebuildLogIndex();
  if (ctx.parts.size || ctx.settings) shopSync();
  if (ctx.garage) {
    if (SV.activeVinId && !G.some(g => g.id === SV.activeVinId)) SV.activeVinId = null;
    applyVinFilters();
  }
  sU(); rGar(); rSB(); rTOWidget();
  if (window._maintActive && window._maintViewGid && G.some(g => g.id === window._maintViewGid)) maintRerender();
  else rC();
  if (partmoId) {
    const p = D.find(x => x.id === partmoId);
    if (!p) cPC();
    else if (ctx.parts.has(partmoId) || ctx.settings) oPC(partmoId);
  }
  restoreUI(st);
}
function mergeCtx(a, b) {
  if (!a) return b;
  b.parts.forEach(id => a.parts.add(id));
  ['workshops', 'schemes', 'votes', 'garage', 'logs', 'settings'].forEach(k => { a[k] = a[k] || b[k]; });
  return a;
}
function flushDeferred() {
  if (!S.deferred) return;
  if (S.sync.pauseOnType && isTyping()) return;
  const c = S.deferred; S.deferred = null;
  renderAll(c);
}
function requestRender(ctx) {
  if (S.sync.pauseOnType && isTyping()) { S.deferred = mergeCtx(S.deferred, ctx); return; }
  renderAll(ctx);
}

async function pullOnly(authoritative) {
  if (!S.user || !S.sb || S.pulling) return false;
  S.pulling = true;
  try {
    const { data, error } = await S.sb.rpc('bm_pull', { since_shared: S.curS || EPOCH, since_priv: S.curP || EPOCH });
    if (error) throw new Error(error.message);
    const resp = data || {};
    const ctx = newCtx();
    applyParts(resp.parts, authoritative, ctx);
    applyWorkshops(resp.workshops, authoritative, ctx);
    applySchemes(resp.schemes, authoritative, ctx);
    applyVotes(resp.votes, ctx);
    applyPrivate('garage', resp.garage, () => G, a => { G = a; }, null, ctx);
    applyPrivate('logs', resp.logs, () => LOG, a => { LOG = a; }, 'logs', ctx);
    applySettings(resp.settings, ctx);
    if (ctxAny(ctx)) requestRender(ctx);
    S.curS = resp.ts || S.curS;
    S.curP = resp.ts || S.curP;
    lsSet(LSK.curS, S.curS); lsSet(LSK.baseS, S.baseS); lsSet(LSK.tomb, Array.from(S.tomb));
    lsSet(LSK.curP(S.user.id), S.curP); lsSet(LSK.baseP(S.user.id), S.baseP);
    return ctxAny(ctx);
  } finally { S.pulling = false; }
}

/* ============================================================
PUSH — без перерисовки экрана
============================================================ */
function pruneTombstones() {
  if (!S.tomb.size) return;
  const before = D.length;
  D = D.filter(p => {
    if (S.tomb.has(p.id)) { if (useIDB) iDel(SP, p.id).catch(() => { }); return false; }
    return true;
  });
  if (D.length !== before && !useIDB) sD();
}
function buildPush() {
  const out = { parts: [], workshops: [], schemes: [], garage: [], logs: [], settings: {}, votes: [] };
  const ids = new Set(), byKey = new Map();
  D.forEach(p => { ids.add(p.id); const k = keyOf(p); if (!byKey.has(k)) byKey.set(k, p); });

  for (const p of D) {
    const base = S.baseS.parts[p.id];
    if (!base || base.fp !== fpPart(p)) out.parts.push({ id: p.id, data: sharedData(p) });
  }
  const dels = [];
  for (const id of Object.keys(S.baseS.parts)) {
    if (ids.has(id) || S.tomb.has(id)) continue;
    const cand = byKey.get(S.baseS.parts[id].key || '\u0000');
    if (cand && cand.id !== id) {
      if (useIDB) iDel(SP, cand.id).catch(() => { });
      cand.id = id;
      if (useIDB) iPut(SP, cand).catch(() => { });
      ids.add(id);
      if (S.baseS.parts[id].fp !== fpPart(cand)) out.parts.push({ id, data: sharedData(cand) });
      continue;
    }
    dels.push(id);
  }
  if (dels.length <= 200 || !D.length) dels.forEach(id => out.parts.push({ id, deleted: true }));

  const wIds = new Set(W.map(w => w.id));
  W.forEach(w => { const b = S.baseS.workshops[w.id]; if (!b || b.fp !== hash(J(w))) out.workshops.push({ id: w.id, data: w }); });
  Object.keys(S.baseS.workshops).forEach(id => { if (!wIds.has(id)) out.workshops.push({ id, deleted: true }); });

  const sch = schAll();
  Object.keys(sch).forEach(k => { const b = S.baseS.schemes[k]; if (!b || b.fp !== hash(J(sch[k]))) out.schemes.push({ id: k, data: sch[k] }); });
  Object.keys(S.baseS.schemes).forEach(k => { if (!sch[k]) out.schemes.push({ id: k, deleted: true }); });

  const va = votesAll();
  Object.keys(va).forEach(k => { const my = va[k].my || ''; if ((S.baseS.votes[k] || '') !== my) out.votes.push({ key: k, dir: my }); });

  const gIds = new Set(G.map(g => g.id));
  G.forEach(g => { const b = S.baseP.garage[g.id]; if (!b || b.fp !== hash(J(g))) out.garage.push({ id: g.id, data: g }); });
  Object.keys(S.baseP.garage).forEach(id => { if (!gIds.has(id)) out.garage.push({ id, deleted: true }); });

  const lIds = new Set(LOG.map(l => l.id));
  LOG.forEach(l => { const b = S.baseP.logs[l.id]; if (!b || b.fp !== hash(J(l))) out.logs.push({ id: l.id, data: l }); });
  Object.keys(S.baseP.logs).forEach(id => { if (!lIds.has(id)) out.logs.push({ id, deleted: true }); });

  const st = { to: TO_ALL, shop: SHOP_ALL, partState: buildPartState(), profile: USER };
  Object.keys(st).forEach(k => { const b = S.baseP.settings[k]; if (!b || b.fp !== hash(J(st[k]))) out.settings[k] = st[k]; });

  const empty = !out.parts.length && !out.workshops.length && !out.schemes.length && !out.garage.length
    && !out.logs.length && !out.votes.length && !Object.keys(out.settings).length;
  return empty ? null : out;
}
function savePending(p) {
  const q = lsGet(LSK.pend, { parts: {}, workshops: {}, schemes: {}, votes: {} });
  (p.parts || []).forEach(e => { q.parts[e.id] = e.deleted ? { deleted: true } : e.data; });
  (p.workshops || []).forEach(e => { q.workshops[e.id] = e.deleted ? { deleted: true } : e.data; });
  (p.schemes || []).forEach(e => { q.schemes[e.id] = e.deleted ? { deleted: true } : e.data; });
  (p.votes || []).forEach(v => { q.votes[v.key] = v.dir; });
  lsSet(LSK.pend, q);
}
function clearPending(p) {
  const q = lsGet(LSK.pend, null); if (!q) return;
  (p.parts || []).forEach(e => delete q.parts[e.id]);
  (p.workshops || []).forEach(e => delete q.workshops[e.id]);
  (p.schemes || []).forEach(e => delete q.schemes[e.id]);
  (p.votes || []).forEach(v => delete q.votes[v.key]);
  lsSet(LSK.pend, q);
}
function applyPending() {
  const q = lsGet(LSK.pend, null); if (!q) return;
  Object.keys(q.parts || {}).forEach(id => {
    const v = q.parts[id];
    if (v && v.deleted) { D = D.filter(x => x.id !== id); S.tomb.add(id); return; }
    const l = D.find(x => x.id === id); if (!l) return;
    const n = nP(v); if (n) Object.assign(l, sharedData(n));
  });
  Object.keys(q.workshops || {}).forEach(id => {
    const v = q.workshops[id];
    if (v && v.deleted) { W = W.filter(x => x.id !== id); return; }
    const l = W.find(x => x.id === id); if (l) Object.assign(l, v);
  });
  const sch = schAll();
  Object.keys(q.schemes || {}).forEach(k => { const v = q.schemes[k]; if (v && v.deleted) delete sch[k]; else sch[k] = v; });
  schSetAll(sch);
  const va = votesAll();
  Object.keys(q.votes || {}).forEach(k => { va[k] = va[k] || { ok: 0, bad: 0, my: '' }; va[k].my = q.votes[k]; });
  lsSet(VOTEKEY, va);
}
async function upsertBatched(table, rows, onConflict, cols) {
  const LIMIT = 3.5 * 1024 * 1024, MAXROWS = 60;
  const map = {}; let chunk = [], size = 0;
  const flush = async () => {
    if (!chunk.length) return;
    const { data, error } = await S.sb.from(table).upsert(chunk, { onConflict }).select(cols);
    if (error) throw new Error(table + ': ' + error.message);
    (data || []).forEach(r => { map[r.id || r.key] = r.updated_at; });
    chunk = []; size = 0;
  };
  for (const r of rows) {
    const s = J(r).length;
    if (s > LIMIT) {
      const id = r.id || r.key;
      if (!S.warned.has(id)) { S.warned.add(id); toast('Запись «' + id + '» слишком большая для сервера — уменьшите фото', 'danger'); }
      continue;
    }
    if (chunk.length >= MAXROWS || size + s > LIMIT) await flush();
    chunk.push(r); size += s;
  }
  await flush();
  return map;
}
function commit(p, maps) {
  (p.parts || []).forEach(e => {
    if (e.deleted) { delete S.baseS.parts[e.id]; S.tomb.add(e.id); return; }
    const l = D.find(x => x.id === e.id);
    if (l && maps.parts[e.id]) S.baseS.parts[e.id] = { fp: fpPart(l), ts: maps.parts[e.id], key: keyOf(l) };
  });
  (p.workshops || []).forEach(e => {
    if (e.deleted) { delete S.baseS.workshops[e.id]; return; }
    const l = W.find(x => x.id === e.id);
    if (l && maps.workshops[e.id]) S.baseS.workshops[e.id] = { fp: hash(J(l)), ts: maps.workshops[e.id] };
  });
  const sch = schAll();
  (p.schemes || []).forEach(e => {
    if (e.deleted) { delete S.baseS.schemes[e.id]; return; }
    if (sch[e.id] && maps.schemes[e.id]) S.baseS.schemes[e.id] = { fp: hash(J(sch[e.id])), ts: maps.schemes[e.id] };
  });
  (p.garage || []).forEach(e => {
    if (e.deleted) { delete S.baseP.garage[e.id]; return; }
    const l = G.find(x => x.id === e.id);
    if (l && maps.garage[e.id]) S.baseP.garage[e.id] = { fp: hash(J(l)), ts: maps.garage[e.id] };
  });
  (p.logs || []).forEach(e => {
    if (e.deleted) { delete S.baseP.logs[e.id]; return; }
    const l = LOG.find(x => x.id === e.id);
    if (l && maps.logs[e.id]) S.baseP.logs[e.id] = { fp: hash(J(l)), ts: maps.logs[e.id] };
  });
  Object.keys(p.settings || {}).forEach(k => {
    if (maps.settings[k]) S.baseP.settings[k] = { fp: hash(J(p.settings[k])), ts: maps.settings[k] };
  });
  (p.votes || []).forEach(v => { S.baseS.votes[v.key] = v.dir; });
  lsSet(LSK.baseS, S.baseS); lsSet(LSK.tomb, Array.from(S.tomb));
  if (S.user) lsSet(LSK.baseP(S.user.id), S.baseP);
}
async function pushOnly() {
  if (!S.user || !S.sb || S.pushing) return;
  if (!S.bootPull) { await syncNow(false); return; }
  if (!navigator.onLine) { setStatus('err'); return; }
  const p = buildPush();
  if (!p) return;
  S.pushing = true;
  try {
    savePending(p);
    const uid = S.user.id;
    const maps = { parts: {}, workshops: {}, schemes: {}, garage: {}, logs: {}, settings: {} };
    if (p.parts.length) maps.parts = await upsertBatched('parts',
      p.parts.map(e => ({ id: e.id, data: e.data || {}, deleted: !!e.deleted, owner: uid })), 'id', 'id,updated_at');
    if (p.workshops.length) maps.workshops = await upsertBatched('workshops',
      p.workshops.map(e => ({ id: e.id, data: e.data || {}, deleted: !!e.deleted, owner: uid })), 'id', 'id,updated_at');
    if (p.schemes.length) maps.schemes = await upsertBatched('schemes',
      p.schemes.map(e => ({ id: e.id, data: e.data || {}, deleted: !!e.deleted, owner: uid })), 'id', 'id,updated_at');
    if (p.garage.length) maps.garage = await upsertBatched('garage',
      p.garage.map(e => ({ user_id: uid, id: e.id, data: e.data || {}, deleted: !!e.deleted })), 'user_id,id', 'id,updated_at');
    if (p.logs.length) maps.logs = await upsertBatched('logs',
      p.logs.map(e => ({ user_id: uid, id: e.id, data: e.data || {}, deleted: !!e.deleted })), 'user_id,id', 'id,updated_at');
    const stKeys = Object.keys(p.settings || {});
    if (stKeys.length) maps.settings = await upsertBatched('settings',
      stKeys.map(k => ({ user_id: uid, key: k, data: p.settings[k] })), 'user_id,key', 'key,updated_at');
    if (p.votes.length) {
      const off = p.votes.filter(v => !v.dir).map(v => v.key);
      const on = p.votes.filter(v => v.dir).map(v => ({ user_id: uid, key: v.key, dir: v.dir }));
      if (off.length) {
        const { error } = await S.sb.from('votes').delete().eq('user_id', uid).in('key', off);
        if (error) throw new Error('votes: ' + error.message);
      }
      if (on.length) {
        const { error } = await S.sb.from('votes').upsert(on, { onConflict: 'user_id,key' });
        if (error) throw new Error('votes: ' + error.message);
      }
    }
    commit(p, maps);
    clearPending(p);
    S.lastSync = Date.now(); lsSet(LSK.last, S.lastSync);
    if (S.status !== 'err') setStatus('ok');
  } catch (e) {
    setStatus('err');
    if (/JWT|not authenticated|invalid claim/i.test(e.message || '')) {
      S.user = null; lsDel(LSK.uid); paintChip();
      toast('Сессия истекла — войдите снова', 'info');
    }
  } finally { S.pushing = false; }
}

/* ============================================================
Цикл
============================================================ */
async function syncNow(manual) {
  if (!S.user || !S.ready || !S.sb) return;
  if (!navigator.onLine) { setStatus('err'); if (manual) toast('Нет сети — правки сохранены локально', 'info'); return; }
  setStatus('busy');
  try {
    pruneTombstones();
    if (!S.bootPull) { await pullOnly(true); applyPending(); S.bootPull = true; }
    await pushOnly();
    await pullOnly(false);
    flushDeferred();
    S.lastSync = Date.now(); lsSet(LSK.last, S.lastSync);
    setStatus('ok');
    if (manual) toast('☁️ Синхронизировано', 'success');
  } catch (e) {
    setStatus('err');
    if (manual) toast('Сервер недоступен — правки сохранены локально и уйдут при связи', 'info');
  }
}
/* Локальная правка → только отправка. Экран не трогаем вообще. */
function markDirty() {
  if (!S.user || !S.ready) return;
  clearTimeout(S.pushT);
  S.pushT = setTimeout(() => { pushOnly(); }, 1200);
}
/* Чужая правка (realtime) → тянем, рисуем только при изменениях. */
function markRemote() {
  if (!S.user || !S.ready || S.sync.paused) return;
  clearTimeout(S.pullT);
  S.pullT = setTimeout(async () => {
    try { await pullOnly(false); setStatus('ok'); } catch (e) { setStatus('err'); }
  }, 1500);
}
function startTimer() {
  stopTimer();
  if (!S.user || !S.sync.interval || S.sync.paused) return;
  S.timer = setInterval(() => {
    if (document.visibilityState === 'hidden') return;
    syncNow(false);
  }, S.sync.interval);
}
function stopTimer() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }
function subscribe() {
  if (!S.sb || !S.user || !S.sync.realtime) return;
  unsubscribe();
  const ch = S.sb.channel('bm-sync');
  ['parts', 'workshops', 'schemes', 'votes'].forEach(t =>
    ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, markRemote));
  ['garage', 'logs', 'settings'].forEach(t =>
    ch.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: 'user_id=eq.' + S.user.id }, markRemote));
  ch.subscribe();
  S.ch = ch;
}
function unsubscribe() { if (S.ch && S.sb) { try { S.sb.removeChannel(S.ch); } catch (e) { } } S.ch = null; }

/* ============================================================
BOOT
============================================================ */
function bind() {
  ['click', 'keydown', 'change'].forEach(ev => document.addEventListener(ev, markDirty, true));
  document.addEventListener('focusout', e => {
    markDirty();
    if (S.deferred) setTimeout(flushDeferred, 250);
  }, true);
  window.addEventListener('online', () => syncNow(false));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!S.sync.paused && Date.now() - S.lastSync > 20000) syncNow(false);
      else flushDeferred();
    } else { clearTimeout(S.pushT); pushOnly(); }
  });
  window.addEventListener('pagehide', () => { pushOnly(); });
}
async function boot() {
  S.ready = true; bind();
  if (!cfgOk()) { paintChip(); return; }
  try {
    await makeClient();
    const { data } = await S.sb.auth.getSession();
    if (data && data.session) await startSession(data.session.user);
    else paintChip();
  } catch (e) { setStatus('err'); }
}
function whenReady() {
  const t = setInterval(() => {
    let ok = false;
    try {
      ok = document.readyState !== 'loading'
        && typeof esc === 'function'
        && typeof openM === 'function'
        && Array.isArray(D);
    } catch (e) { }
    if (!ok) return;
    clearInterval(t);
    injectUI();
    const t2 = setInterval(() => {
      let go = false;
      try { go = typeof licAppReady !== 'undefined' && licAppReady; } catch (e) { }
      if (go) { clearInterval(t2); boot(); }
    }, 300);
  }, 200);
}
whenReady();

window.Cloud = {
  sync: () => syncNow(true),
  open: openCloud,
  pause: togglePause,
  every: ms => { S.sync.interval = Number(ms) || 0; S.sync.paused = false; saveSync(); startTimer(); paintChip(); }
};
})();