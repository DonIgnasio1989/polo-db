/* ============================================================
База Мастера · Supabase Sync v2
Аккаунты (Supabase Auth) + синхронизация поверх локального каталога.
Общее: parts (каталожные поля + фото), workshops, schemes, votes.
Приватное: garage, logs, TO, shop, partState (статус/избранное/заметка), profile.
Стратегия: dirty-diff + курсоры + LWW + tombstones + оффлайн-очередь + Realtime.
Подключение: <script src="js/cloud.js" defer></script> ПОСЛЕ app.js.
============================================================ */
(function () {
'use strict';

/* ====== ЗАПОЛНИТЬ: Project Settings → API ====== */
const CFG = {
  url: 'https://qqeupqyvulouugjsacyu.supabase.co',
  key: 'sb_publishable_rLNCb-LGBM6Sf-1_e10ejg_XSFWwu3c'
};
/* Можно не править файл: URL и anon key задаются в модалке входа
   («⚙ Подключение») и хранятся в localStorage этого устройства. */

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
  last: 'bm_sb_last_sync_v1'
};
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { } };

const S = {
  sb: null, user: null, ready: false, busy: false, dirtyT: null, ch: null,
  bootPull: false, status: 'idle', warned: new Set(),
  baseS: lsGet(LSK.baseS, { parts: {}, workshops: {}, schemes: {}, votes: {} }),
  baseP: { garage: {}, logs: {}, settings: {} },
  tomb: new Set(lsGet(LSK.tomb, [])),
  curS: lsGet(LSK.curS, EPOCH),
  curP: EPOCH,
  lastSync: lsGet(LSK.last, 0)
};
const J = o => JSON.stringify(o ?? null);
const hash = s => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16) + ':' + s.length;
};
/* Общая проекция детали. Личное (status/favorite/notes) — в settings.partState */
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
const cfg = () => {
  const c = lsGet(LSK.cfg, null);
  return (c && c.url && c.key) ? c : CFG;
};
const cfgOk = () => { const c = cfg(); return /^https:\/\/.+\.supabase\.(co|in)\/?$/.test(c.url || '') && (c.key || '').length > 40; };

/* ============================================================
Загрузка supabase-js: локальный вендор → CDN. Нет сети — работаем локально.
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
  try { await loadScript('js/vendor/supabase.js'); } catch (e) { }
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
  S.sb.auth.onAuthStateChange((ev, sess) => {
    if (ev === 'PASSWORD_RECOVERY') { renderReset(); openM('cloudmo'); return; }
    if (ev === 'SIGNED_OUT') { S.user = null; paintChip(); }
  });
  return S.sb;
}

/* ============================================================
UI
============================================================ */
function injectUI() {
  const st = document.createElement('style');
  st.textContent = `
.cl-chip{display:flex;align-items:center;gap:10px;width:100%;margin:0 0 10px;padding:8px 12px;
 background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:var(--r-md);
 color:#fff;font-family:inherit;font-size:.78rem;font-weight:600;cursor:pointer;text-align:left;transition:all var(--tr)}
.cl-chip:hover{border-color:var(--a);background:color-mix(in srgb,var(--a) 16%,transparent);transform:translateY(-1px);box-shadow:var(--sh-glow)}
.cl-ic{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;
 font-size:.95rem;background:linear-gradient(135deg,var(--a),var(--a-h));box-shadow:0 2px 8px rgba(0,0,0,.3)}
.cl-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.cl-t1{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cl-t2{font-size:.62rem;font-weight:500;opacity:.72;display:flex;align-items:center;gap:5px}
.cl-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;background:#8b95a5}
.cl-dot.ok{background:var(--ok,#3ecf7e);box-shadow:0 0 6px var(--ok,#3ecf7e)}
.cl-dot.err{background:var(--dg,#f25c69)}
.cl-dot.busy{background:var(--sr,#fbbf24);animation:clPulse 1s ease-in-out infinite}
@keyframes clPulse{50%{opacity:.35}}
.cl-tabs{display:flex;gap:6px;margin-bottom:14px}
.cl-tab{flex:1;padding:9px;border:1.5px solid var(--bd);border-radius:var(--r-sm);background:var(--cd-2);
 color:var(--tx);font-family:inherit;font-size:.84rem;font-weight:700;cursor:pointer;transition:all var(--tr)}
.cl-tab.on{background:linear-gradient(135deg,var(--a),var(--a-h));color:#fff;border-color:transparent}
.cl-err{margin:10px 0 0;padding:9px 12px;border-radius:var(--r-sm);font-size:.8rem;font-weight:600;
 background:color-mix(in srgb,var(--dg) 12%,transparent);border:1px solid var(--dg);color:var(--dg)}
.cl-ok{margin:10px 0 0;padding:9px 12px;border-radius:var(--r-sm);font-size:.8rem;font-weight:600;
 background:color-mix(in srgb,var(--ok) 12%,transparent);border:1px solid var(--ok);color:var(--ok)}
.cl-note{font-size:.74rem;color:var(--mu);line-height:1.55;margin-top:12px}
.cl-note b{color:var(--tx)}
.cl-link{background:none;border:none;padding:0;margin-top:10px;color:var(--a);font-family:inherit;
 font-size:.76rem;font-weight:600;cursor:pointer;text-decoration:underline dotted}
.cl-acc{display:flex;align-items:center;gap:14px;padding:14px;border:1px solid var(--bd);border-radius:var(--r-md);
 background:linear-gradient(135deg,color-mix(in srgb,var(--a) 9%,transparent),transparent);margin-bottom:14px}
.cl-ava{width:52px;height:52px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;
 font-size:1.3rem;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--a),var(--a-h));box-shadow:var(--sh-glow)}
.cl-acc-n{font-weight:800;font-size:1rem;color:var(--tx)}
.cl-acc-l{font-size:.76rem;color:var(--mu);font-family:var(--ff-mono);word-break:break-all}
.cl-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:14px}
.cl-stat{padding:9px 11px;border:1px solid var(--bd);border-radius:var(--r-sm);background:var(--hv)}
.cl-stat b{display:block;font-size:1.05rem;color:var(--a);font-family:var(--ff-mono)}
.cl-stat span{font-size:.68rem;color:var(--mu)}
.cl-rows{display:flex;flex-direction:column;gap:8px}
.cl-rows .bn{justify-content:center}
.cl-srv{margin-top:12px}
.cl-srv summary{cursor:pointer;font-size:.74rem;color:var(--mu);user-select:none}
.cl-srv .fg{margin-top:8px}
.cl-spin{display:inline-block;animation:clRot 1s linear infinite}
@keyframes clRot{to{transform:rotate(360deg)}}
@media(max-width:900px){.cl-chip{padding:7px 10px}}`;
  document.head.appendChild(st);

  const chip = document.createElement('button');
  chip.type = 'button'; chip.className = 'cl-chip'; chip.id = 'clChip';
  chip.addEventListener('click', openCloud);
  const sft = document.querySelector('.sft');
  if (sft) sft.insertBefore(chip, sft.firstChild);

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
function paintChip() {
  const c = document.getElementById('clChip'); if (!c) return;
  let dot = '', sub = 'Войти и синхронизировать', title = '☁️ Войти';
  if (!cfgOk()) { sub = 'Укажите проект Supabase'; }
  else if (S.user) {
    title = '☁️ ' + (S.user.name || S.user.email);
    if (S.status === 'busy') { dot = 'busy'; sub = 'Синхронизация…'; }
    else if (S.status === 'err') { dot = 'err'; sub = 'Оффлайн — правки сохранены локально'; }
    else if (S.lastSync) { dot = 'ok'; sub = 'Синхронизировано ' + new Date(S.lastSync).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); }
    else { dot = 'ok'; sub = 'На связи'; }
  }
  c.innerHTML = '<span class="cl-ic">' + (S.user ? esc((S.user.name || S.user.email).slice(0, 1).toUpperCase()) : '☁️') + '</span>'
    + '<span class="cl-tx"><span class="cl-t1">' + esc(title) + '</span>'
    + '<span class="cl-t2"><span class="cl-dot ' + dot + '"></span>' + esc(sub) + '</span></span>';
}
const setStatus = s => { S.status = s; paintChip(); };
const cfgFields = () =>
  '<details class="cl-srv"><summary>⚙ Подключение к Supabase</summary>'
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
    + '<b>Только ваше:</b> гараж, журнал, ТО, список покупок, статусы, избранное и заметки — доступны с любого устройства после входа. Без входа всё работает локально.</p>';
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
  setTimeout(() => document.getElementById('clEmail').focus(), 60);
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
    const p = document.getElementById('clNew').value;
    try {
      const { error } = await S.sb.auth.updateUser({ password: p });
      if (error) throw error;
      closeM('cloudmo'); toast('Пароль обновлён', 'success');
    } catch (e) { document.getElementById('clMsg').innerHTML = '<div class="cl-err">' + esc(ruAuthErr(e.message)) + '</div>'; }
  });
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
    + '<div class="cl-rows">'
    + '<button type="button" class="bn p" id="clSync">🔄 Синхронизировать сейчас</button>'
    + '<button type="button" class="bn" id="clSeed">📤 Отправить весь каталог на сервер</button>'
    + '<button type="button" class="bn" id="clOut">🚪 Выйти</button>'
    + '</div>'
    + cfgFields()
    + '<p class="cl-note">Последняя синхронизация: <b>' + (S.lastSync ? new Date(S.lastSync).toLocaleString('ru-RU') : '—') + '</b>. '
    + 'При выходе гараж, журнал и ТО убираются с этого устройства, но остаются в аккаунте. Общий каталог остаётся.</p>';
  bindCfg();
  document.getElementById('clSync').addEventListener('click', async () => { closeM('cloudmo'); await syncNow(true); });
  document.getElementById('clSeed').addEventListener('click', () => {
    if (!confirm('Отправить все локальные детали, СТО и схемы на сервер? Существующие записи будут обновлены вашими версиями.')) return;
    S.baseS.parts = {}; S.baseS.workshops = {}; S.baseS.schemes = {};
    lsSet(LSK.baseS, S.baseS);
    closeM('cloudmo'); syncNow(true);
  });
  document.getElementById('clOut').addEventListener('click', async () => {
    try { await syncNow(true); } catch (e) { }
    try { await S.sb.auth.signOut(); } catch (e) { }
    unsubscribe(); wipePrivate();
    S.user = null; S.bootPull = false; S.status = 'idle'; lsDel(LSK.uid);
    closeM('cloudmo'); paintChip();
    toast('Вы вышли. Приватные данные — в аккаунте', 'info');
  });
}

/* ============================================================
Приватная зона: очистка при выходе / смене пользователя
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

/* ============================================================
Сессия
============================================================ */
async function startSession(user) {
  const prev = lsGet(LSK.uid, null);
  if (prev != null && prev !== user.id) wipePrivate();
  S.user = { id: user.id, email: user.email || '', name: (user.user_metadata && user.user_metadata.name) || USER.name || '' };
  lsSet(LSK.uid, user.id);
  S.baseP = lsGet(LSK.baseP(user.id), { garage: {}, logs: {}, settings: {} });
  S.curP = lsGet(LSK.curP(user.id), EPOCH);
  S.bootPull = false;
  paintChip(); subscribe();
  await syncNow(false);
}

/* ============================================================
PULL
============================================================ */
function applyParts(rows, authoritative) {
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
      if (local) { D = D.filter(x => x !== local); if (useIDB) iDel(SP, local.id).catch(() => { }); }
      continue;
    }
    if (!r.data) continue;
    const inc = nP(Object.assign({}, r.data, { id: r.id }));
    if (!inc) continue;
    if (local) {
      const base = S.baseS.parts[local.id];
      const clean = base && base.fp === fpPart(local);
      if (!authoritative && !clean && fpPart(local) !== fpPart(inc)) continue; // наша правка ждёт push
      const personal = personalOf(local);
      if (local.id !== r.id) { renamed.push(local.id); delete S.baseS.parts[local.id]; local.id = r.id; }
      Object.assign(local, sharedData(inc), personal);
      S.baseS.parts[r.id] = { fp: fpPart(local), ts: r.updatedAt, key: keyOf(local) };
    } else {
      D.push(inc); byKey.set(keyOf(inc), inc);
      S.baseS.parts[r.id] = { fp: fpPart(inc), ts: r.updatedAt, key: keyOf(inc) };
    }
  }
  if (useIDB) renamed.forEach(id => iDel(SP, id).catch(() => { }));
}
function applyWorkshops(rows, authoritative) {
  if (!Array.isArray(rows)) return;
  for (const r of rows) {
    if (!r || !r.id) continue;
    const local = W.find(x => x.id === r.id);
    if (r.deleted) {
      delete S.baseS.workshops[r.id];
      if (local) { W = W.filter(x => x !== local); if (useIDB) iDel(SW, local.id).catch(() => { }); }
      continue;
    }
    const inc = nW(Object.assign({}, r.data, { id: r.id }));
    if (!inc) continue;
    if (local) {
      const base = S.baseS.workshops[r.id];
      const clean = base && base.fp === hash(J(local));
      if (!authoritative && !clean && hash(J(local)) !== hash(J(inc))) continue;
      Object.assign(local, inc);
    } else W.push(inc);
    S.baseS.workshops[r.id] = { fp: hash(J(local || inc)), ts: r.updatedAt };
  }
}
function applySchemes(rows, authoritative) {
  if (!Array.isArray(rows) || !rows.length) return;
  const all = schAll(); let touched = false;
  for (const r of rows) {
    if (!r || !r.id) continue;
    if (r.deleted) { delete all[r.id]; delete S.baseS.schemes[r.id]; touched = true; continue; }
    if (!r.data) continue;
    const localFp = all[r.id] ? hash(J(all[r.id])) : null;
    const base = S.baseS.schemes[r.id];
    const clean = base && base.fp === localFp;
    if (authoritative || clean || localFp == null || localFp === hash(J(r.data))) {
      all[r.id] = r.data; S.baseS.schemes[r.id] = { fp: hash(J(all[r.id])), ts: r.updatedAt }; touched = true;
    }
  }
  if (touched) schSetAll(all);
}
function applyVotes(votes) {
  if (!votes) return;
  const all = votesAll();
  Object.keys(votes).forEach(k => {
    const srv = votes[k], localMy = (all[k] && all[k].my) || '', baseMy = S.baseS.votes[k] || '';
    const my = (localMy === baseMy) ? (srv.my || '') : localMy;
    all[k] = { ok: srv.ok | 0, bad: srv.bad | 0, my };
    S.baseS.votes[k] = my;
  });
  lsSet(VOTEKEY, all);
}
function applyPrivate(kind, rows, get, set, idb) {
  if (!Array.isArray(rows) || !rows.length) return;
  const arr = get(); const removed = [];
  for (const r of rows) {
    if (!r || !r.id) continue;
    const i = arr.findIndex(x => x.id === r.id);
    const local = i >= 0 ? arr[i] : null;
    const base = S.baseP[kind][r.id];
    const clean = !local || (base && base.fp === hash(J(local)));
    if (r.deleted) {
      delete S.baseP[kind][r.id];
      if (local && clean) { arr.splice(i, 1); removed.push(r.id); }
      continue;
    }
    if (!r.data) continue;
    const inc = Object.assign({}, r.data, { id: r.id });
    if (local) { if (!clean) continue; Object.assign(local, inc); } else arr.push(inc);
    S.baseP[kind][r.id] = { fp: hash(J(local || inc)), ts: r.updatedAt };
  }
  set(arr);
  if (idb && useIDB) removed.forEach(id => iDel(idb, id).catch(() => { }));
}
function buildPartState() {
  const m = {};
  D.forEach(p => { if (p.status || p.favorite || p.notes) m[p.id] = personalOf(p); });
  return m;
}
function applySettings(st) {
  if (!st) return;
  for (const k of Object.keys(st)) {
    const r = st[k]; if (!r || r.data == null) continue;
    const cur = k === 'to' ? TO_ALL : k === 'shop' ? SHOP_ALL : k === 'profile' ? USER : buildPartState();
    const base = S.baseP.settings[k];
    const localFp = hash(J(cur));
    if (base && base.fp !== localFp && localFp !== hash(J(r.data))) continue; // локальное новее — уйдёт push
    if (k === 'to') { TO_ALL = r.data || {}; toSync(); _toPersist(); }
    else if (k === 'shop') { SHOP_ALL = r.data || {}; lsSet(SHPKEY, { byVin: SHOP_ALL }); shopSync(); }
    else if (k === 'profile') { USER = Object.assign({ name: '', email: '', city: '', initials: '', color: '#00b0f0' }, r.data); sProfileStorage(); renderProfile(); }
    else if (k === 'partState') {
      const m = r.data || {};
      D.forEach(p => { const s = m[p.id]; if (s) { p.status = s.status || ''; p.favorite = !!s.favorite; p.notes = s.notes || ''; } });
    }
    const after = k === 'to' ? TO_ALL : k === 'shop' ? SHOP_ALL : k === 'profile' ? USER : buildPartState();
    S.baseP.settings[k] = { fp: hash(J(after)), ts: r.updatedAt };
  }
}
async function pull(authoritative) {
  const { data, error } = await S.sb.rpc('bm_pull', { since_shared: S.curS || EPOCH, since_priv: S.curP || EPOCH });
  if (error) throw new Error(error.message);
  const resp = data || {};
  applyParts(resp.parts, authoritative);
  applyWorkshops(resp.workshops, authoritative);
  applySchemes(resp.schemes, authoritative);
  applyVotes(resp.votes);
  if (S.user) {
    applyPrivate('garage', resp.garage, () => G, a => { G = a; }, null);
    applyPrivate('logs', resp.logs, () => LOG, a => { LOG = a; }, 'logs');
    applySettings(resp.settings);
  }
  if (useIDB) { iMany(SP, D).catch(() => { }); iMany(SW, W).catch(() => { }); iMany('logs', LOG).catch(() => { }); }
  else { sD(); sWk(); sLogs(); }
  sG();
  if (SV.activeVinId && !G.some(g => g.id === SV.activeVinId)) SV.activeVinId = null;
  applyAnalogKb(); _rebuildLogIndex(); shopSync();
  applyVinFilters(); sU(); rGar(); rSB(); rTOWidget(); rC();
  if (partmoId) { const p = D.find(x => x.id === partmoId); if (p) oPC(p.id); else cPC(); }
  S.curS = resp.ts || S.curS;
  lsSet(LSK.curS, S.curS); lsSet(LSK.baseS, S.baseS); lsSet(LSK.tomb, Array.from(S.tomb));
  if (S.user) { S.curP = resp.ts || S.curP; lsSet(LSK.curP(S.user.id), S.curP); lsSet(LSK.baseP(S.user.id), S.baseP); }
}

/* ============================================================
PUSH
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
    if (cand && cand.id !== id) {           // сид пересоздал id — возвращаем серверный
      if (useIDB) { iDel(SP, cand.id).catch(() => { }); }
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
/* Батчинг: не упереться в размер тела запроса (фото — тяжёлые) */
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
  const nowIso = new Date().toISOString();
  const ts = (m, id) => (m && m[id]) || nowIso;
  (p.parts || []).forEach(e => {
    if (e.deleted) { delete S.baseS.parts[e.id]; S.tomb.add(e.id); return; }
    const l = D.find(x => x.id === e.id);
    if (l && maps.parts[e.id]) S.baseS.parts[e.id] = { fp: fpPart(l), ts: ts(maps.parts, e.id), key: keyOf(l) };
  });
  (p.workshops || []).forEach(e => {
    if (e.deleted) { delete S.baseS.workshops[e.id]; return; }
    const l = W.find(x => x.id === e.id);
    if (l && maps.workshops[e.id]) S.baseS.workshops[e.id] = { fp: hash(J(l)), ts: ts(maps.workshops, e.id) };
  });
  const sch = schAll();
  (p.schemes || []).forEach(e => {
    if (e.deleted) { delete S.baseS.schemes[e.id]; return; }
    if (sch[e.id] && maps.schemes[e.id]) S.baseS.schemes[e.id] = { fp: hash(J(sch[e.id])), ts: ts(maps.schemes, e.id) };
  });
  (p.garage || []).forEach(e => {
    if (e.deleted) { delete S.baseP.garage[e.id]; return; }
    const l = G.find(x => x.id === e.id);
    if (l && maps.garage[e.id]) S.baseP.garage[e.id] = { fp: hash(J(l)), ts: ts(maps.garage, e.id) };
  });
  (p.logs || []).forEach(e => {
    if (e.deleted) { delete S.baseP.logs[e.id]; return; }
    const l = LOG.find(x => x.id === e.id);
    if (l && maps.logs[e.id]) S.baseP.logs[e.id] = { fp: hash(J(l)), ts: ts(maps.logs, e.id) };
  });
  Object.keys(p.settings || {}).forEach(k => {
    if (maps.settings[k]) S.baseP.settings[k] = { fp: hash(J(p.settings[k])), ts: maps.settings[k] };
  });
  (p.votes || []).forEach(v => { S.baseS.votes[v.key] = v.dir; });
  lsSet(LSK.baseS, S.baseS); lsSet(LSK.tomb, Array.from(S.tomb));
  if (S.user) lsSet(LSK.baseP(S.user.id), S.baseP);
}
async function pushIfDirty() {
  const p = buildPush(); if (!p) return;
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
}

/* ============================================================
Цикл + Realtime
============================================================ */
async function syncNow(manual) {
  if (!S.user || !S.ready || S.busy || !S.sb) return;
  if (!navigator.onLine) { setStatus('err'); return; }
  S.busy = true; setStatus('busy');
  try {
    pruneTombstones();
    if (!S.bootPull) { await pull(true); applyPending(); S.bootPull = true; }
    await pushIfDirty();
    await pull(false);
    S.lastSync = Date.now(); lsSet(LSK.last, S.lastSync);
    setStatus('ok');
    if (manual) toast('☁️ Синхронизировано', 'success');
  } catch (e) {
    setStatus('err');
    if (/JWT|not authenticated|invalid claim/i.test(e.message || '')) {
      S.user = null; lsDel(LSK.uid); paintChip();
      toast('Сессия истекла — войдите снова', 'info');
    } else if (manual) {
      toast('Сервер недоступен — правки сохранены локально и уйдут при связи', 'info');
    }
  } finally { S.busy = false; }
}
function markDirty(delay) {
  if (!S.user || !S.ready) return;
  clearTimeout(S.dirtyT);
  S.dirtyT = setTimeout(() => syncNow(false), delay || 900);
}
function subscribe() {
  if (!S.sb || !S.user) return;
  unsubscribe();
  const ch = S.sb.channel('bm-sync');
  ['parts', 'workshops', 'schemes', 'votes'].forEach(t =>
    ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => markDirty(1200)));
  ['garage', 'logs', 'settings'].forEach(t =>
    ch.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: 'user_id=eq.' + S.user.id }, () => markDirty(1200)));
  ch.subscribe();
  S.ch = ch;
}
function unsubscribe() { if (S.ch && S.sb) { try { S.sb.removeChannel(S.ch); } catch (e) { } } S.ch = null; }

/* ============================================================
BOOT
============================================================ */
function bind() {
  ['click', 'keydown', 'change', 'focusout'].forEach(ev => document.addEventListener(ev, () => markDirty(), true));
  window.addEventListener('online', () => syncNow(false));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(false); else markDirty(150); });
  setInterval(() => syncNow(false), 30000);
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
function waitApp() {
  const t = setInterval(() => {
    let ok = false;
    try { ok = typeof licAppReady !== 'undefined' && licAppReady && Array.isArray(D); } catch (e) { }
    if (ok) { clearInterval(t); boot(); }
  }, 300);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { injectUI(); waitApp(); }, { once: true });
} else { injectUI(); waitApp(); }

window.Cloud = { sync: () => syncNow(true), open: openCloud };
})();