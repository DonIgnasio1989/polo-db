/* ============ СПРАВОЧНИКИ ============ */
const BASE_CATS = [
    { id: 'All', label: 'Все системы', icon: '📦' },
    { id: 'Maintenance', label: '🔧 Регламент ТО', icon: '🔧' },
    { id: 'RoadKit', label: '🎒 С собой в дорогу', icon: '🎒' },
    { id: 'Engine', label: '1. Двигатель, Сцепление', icon: '⚙️' },
    { id: 'Cooling', label: '1.1 Охлаждение', icon: '❄️', parent: 'Engine' },
    { id: 'Ignition', label: '1.2 Зажигание', icon: '🔥', parent: 'Engine' },
    { id: 'Fluids', label: '1.3 Жидкости', icon: '🛢️', parent: 'Engine' },
    { id: 'Fuel', label: '2. Топливная система', icon: '⛽' },
    { id: 'Exhaust', label: '2.1 Система выпуска ОГ', icon: '💨', parent: 'Fuel' },
    { id: 'Heating', label: '2.2 Отопитель', icon: '🌡️', parent: 'Fuel' },
    { id: 'Transmission', label: '3. Трансмиссия', icon: '🔄' },
    { id: 'Suspension', label: '4. Передняя ось, Дифференциал, Рулевое', icon: '🛞' },
    { id: 'RearAxle', label: '5. Задняя ось', icon: '🔩' },
    { id: 'Brakes', label: '6. Колёса, Тормозная система', icon: '🛑' },
    { id: 'Controls', label: '7. Механизмы управления, Педальный узел', icon: '🎛️' },
    { id: 'Body', label: '8. Кузов', icon: '🚗' },
    { id: 'Electrical', label: '9. Электрика', icon: '💡' },
    { id: 'Bulbs', label: '9.1 Освещение, Лампы', icon: '🔆', parent: 'Electrical' },
    { id: 'Interior', label: '0. Аксессуары, Салон', icon: '🪑' }
];
let CATS = BASE_CATS.slice();
const ENGINES = {
    'AER': { v: '1.0', hp: 50, f: 'P' }, 'ALL': { v: '1.0', hp: 50, f: 'P' }, 'AEV': { v: '1.0', hp: 50, f: 'P' },
    'ALD': { v: '1.0', hp: 50, f: 'P' }, 'ANV': { v: '1.0', hp: 50, f: 'P' }, 'AUC': { v: '1.0', hp: 50, f: 'P' },
    'AEX': { v: '1.4', hp: 60, f: 'P' }, 'APQ': { v: '1.4', hp: 60, f: 'P' }, 'AKV': { v: '1.4', hp: 60, f: 'P' },
    'ANX': { v: '1.4', hp: 60, f: 'P' }, 'AKK': { v: '1.4', hp: 60, f: 'P' }, 'ANW': { v: '1.4', hp: 60, f: 'P' },
    'AUD': { v: '1.4', hp: 60, f: 'P' }, 'APE': { v: '1.4 16V', hp: 75, f: 'P' }, 'AUA': { v: '1.4 16V', hp: 75, f: 'P' },
    'AEE': { v: '1.6', hp: 75, f: 'P' }, 'ALM': { v: '1.6', hp: 75, f: 'P' }, 'AUR': { v: '1.6', hp: 75, f: 'P' },
    'AFT': { v: '1.6', hp: 100, f: 'P' }, '1F': { v: '1.6', hp: 75, f: 'P' }, 'ADZ': { v: '1.8', hp: 90, f: 'P' },
    'AKW': { v: '1.7 SDI', hp: 60, f: 'D' }, 'AHB': { v: '1.7 SDI', hp: 60, f: 'D' },
    'AEY': { v: '1.9 SDI', hp: 64, f: 'D' }, 'AGP': { v: '1.9 D', hp: 68, f: 'D' }, 'AQM': { v: '1.9 SDI', hp: 68, f: 'D' },
    'AYQ': { v: '1.9 SDI', hp: 64, f: 'D' }, 'ASV': { v: '1.9 SDI', hp: 110, f: 'D' }, '1Y': { v: '1.9 D', hp: 64, f: 'D' },
    'AFN': { v: '1.9 TDI', hp: 110, f: 'D' }, 'AHU': { v: '1.9 TDI', hp: 90, f: 'D' }, 'ALE': { v: '1.9 TDI', hp: 90, f: 'D' },
    'AGR': { v: '1.9 TDI', hp: 90, f: 'D' }, 'ALH': { v: '1.9 TDI', hp: 90, f: 'D' }
};
const BODIES = { '3d': 'Hatchback 3д (6N1)', '5d': 'Hatchback 5д (6N2)', 'classic': 'Polo Classic (седан)', 'estate': 'Polo Estate (универсал)', 'caddy-van': 'Caddy Van', 'caddy-kombi': 'Caddy Kombi', 'caddy-pickup': 'Caddy Pickup' };
/* === КПП: механика + автомат === */
const TRANSMISSIONS = {
    '085': 'МКПП 085 (5-ст)', '020': 'МКПП 020 (4/5-ст)', '02K': 'МКПП 02K (5-ст)',
    '01M': 'АКПП 01M (4-ст)', '01N': 'АКПП 01N (4-ст)', 'AG4': 'АКПП AG4 (4-ст)'
};
const TRIMS = ['Base', 'CL', 'GL', 'Trendline', 'Comfortline', 'Highline', 'Open Air'];
const BASE_EK = { Maintenance: { g: 'Регламент ТО', s: 'Обслуживание' }, RoadKit: { g: 'С собой в дорогу', s: 'Аварийный набор' }, Engine: { g: 'Двигатель', s: 'ГРМ / Ремни' }, Fuel: { g: 'Топливная', s: 'Подача / Фильтры' }, Ignition: { g: 'Зажигание', s: 'Свечи / Катушки' }, Cooling: { g: 'Охлаждение', s: 'Радиатор / Термостат' }, Heating: { g: 'Отопление', s: 'Печка / Климат' }, Suspension: { g: 'Подвеска', s: 'Передняя / Задняя' }, Brakes: { g: 'Тормоза', s: 'Передние / Задние' }, Transmission: { g: 'Трансмиссия', s: 'КПП / Привод' }, Exhaust: { g: 'Выхлоп', s: 'Глушитель' }, Electrical: { g: 'Электрика', s: 'Генератор / Стартер' }, Bulbs: { g: 'Лампы', s: 'Освещение' }, Body: { g: 'Кузов', s: 'Наружные панели' }, Interior: { g: 'Интерьер', s: 'Панель / Сиденья' }, Fluids: { g: 'Жидкости', s: 'Эксплуатационные' } };
let EK = Object.assign({}, BASE_EK);
const IL = { s: 'СПЕЦИФИКАЦИЯ', t: 'ИНСТРУМЕНТ', p: 'ПРОЦЕДУРА', w: 'ВНИМАНИЕ', n: 'ЗАМЕТКА', r: 'РЕКОМЕНДАЦИЯ' };
const IC = { s: 'ts', t: 'tt', p: 'tp2', w: 'tw', n: 'tn', r: 'tr' };
const IM = { spec: 's', tool: 't', proc: 'p', warn: 'w', note: 'n', recommendation: 'r' };
const MI = { s: 'spec', t: 'tool', p: 'proc', w: 'warn', n: 'note', r: 'recommendation' };
const SH = {
    ex: n => 'https://www.exist.ru/Price/?pcode=' + n,
    ad: n => 'https://www.autodoc.ru/price/0/' + n,
    av: n => 'https://www.avito.ru/rossiya/zapchasti_i_aksessuary?q=' + encodeURIComponent(n)
};
const shopH = o => {
    if (!o) return '';
    const c = o.replace(/\s/g, '');
    if (!c) return '';
    return '<div class="pr">'
        + '<a class="psl ex" target="_blank" rel="noopener noreferrer" href="' + SH.ex(c) + '" title="Поиск Exist">🛒 Exist</a>'
        + '<a class="psl ad" target="_blank" rel="noopener noreferrer" href="' + SH.ad(c) + '" title="Поиск Autodoc">🛒 Autodoc</a>'
        + '<a class="psl av" target="_blank" rel="noopener noreferrer" href="' + SH.av(o) + '" title="Поиск Avito">🛒 Avito</a>'
        + '</div>';
};
const ONLINE_CATALOGS = {
    sevenzap: vin => 'https://7zap.com/en/catalog/cars/volkswagen/global/polo-classic-typ-6n-parts-catalog/?vin=' + vin,
    autopoisk: vin => 'https://autopoisk.ru/volkswagen?vin=' + vin,
    partsouq: vin => 'https://partsouq.com/en/search/all?q=' + vin,
    sufix: () => 'https://sufix.pro/catalog/volkswagen/polo-iii-6n1-94-99/1-0-aer-all-50/',
    parts2407: () => 'https://2407.pl/en/parts/volkswagen/polo-iii-6n1-hatchback/50-1-0-aer-all-50-hp/',
    amayama: () => 'https://www.amayama.com/en/genuine-catalogs/volkswagen/polo/6n1',
    elcats: () => 'https://www.elcats.ru/vw/Unit.aspx?mdl=8BD8FB5D&cat=1'
};
const getPurchaseHtml = p => {
    const av = (typeof gAV === 'function') ? gAV() : null;
    const vin = av && av.ok ? av.vin : '';
    const prs = fP(p.price, p.currency);
    const su = p.shopUrl || '';
    const hh = p.priceHistory && p.priceHistory.length > 0 ? '<span class="hi" title="История цен">📊 ' + p.priceHistory.length + '</span>' : '';
    let h = '';
    h += '<div class="prow">';
    h += prs ? '<span class="price-tag">' + esc(prs) + '</span>' : '<span style="color:var(--mu);font-size:.7rem">цена не указана</span>';
    h += hh;
    if (su) h += '<a class="sl" href="' + escA(su) + '" target="_blank" rel="noopener noreferrer">🛒 Свой магазин</a>';
    h += '</div>';
    if (p.oem) { h += '<div class="prow">' + shopH(p.oem) + '</div>'; }
    h += '<div class="prow op-b">';
    if (vin) {
        h += '<a class="psl op1" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.sevenzap(vin) + '">7zap VIN</a>';
        h += '<a class="psl op2" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.autopoisk(vin) + '">Autopoisk</a>';
        h += '<a class="psl op3" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.partsouq(vin) + '">Partsouq</a>';
    }
    h += '<a class="psl op4" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.sufix() + '">Sufix</a>';
    h += '<a class="psl op5" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.parts2407() + '">2407.pl</a>';
    h += '<a class="psl op6" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.amayama() + '">Amayama</a>';
    h += '<a class="psl op7" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.elcats() + '">Elcats</a>';
    h += '</div>';
    return h;
};

/* ============ БАЗА ДАННЫХ ============ */
const DB = []; /* данные грузятся из data/parts.json */

const UK = 'vw_polo_ui_v185', PK = 'vw_polo_db_v181', WK = 'vw_polo_workshops_v181', VK = 'vw_polo_vincario_key_v18', GK = 'vw_polo_garage_v181', DN = 'vw_polo_v181', DV = 2, SP = 'parts', SW = 'workshops';
let APP_VERSION = '19.2'; // fallback, если update.json не загрузится
const LICKEY = 'vw_polo_license_v1';
const UPKEY = 'vw_polo_update_url_v1';
const PROFKEY = 'vw_polo_profile_v1';

let D = [], W = [], G = [], SV = { activeCat: 'All', searchQuery: '', statusFilter: 'all', engineFilter: 'all', bodyFilter: 'all', trimFilter: 'all', transFilter: 'all', sidebarCollapsed: false, theme: 'dark', sortBy: 'default', view: 'grid', activeVinId: null, groupBySub: false, vinStrictFilter: false };
let USER = { name: '', email: '', city: '', initials: '', color: '#00b0f0' };
let edId = null, ewId = null, pPh = null, pPhCl = false, useIDB = true, vk = '', pGV = null, dbr = null;
const METAKEY = 'vw_polo_meta_v1';
const openM = id => $(id).classList.add('show');
const closeM = id => $(id).classList.remove('show');
const TOKEY = 'vw_polo_to_v1';
let TO = { km: null, lastDate: null, interval: 15000 };
let LOG = [];
function lTO() { try { const r = localStorage.getItem(TOKEY); if (r) { const t = JSON.parse(r); TO = Object.assign(TO, t); } } catch (e) { } }
function sTOStorage() { try { localStorage.setItem(TOKEY, JSON.stringify(TO)); } catch (e) { } }
async function lLogs() {
    try { const r = localStorage.getItem('vw_polo_logs_v1'); if (r) { const a = JSON.parse(r); if (Array.isArray(a)) LOG = a; } } catch (e) { }
    try {
        if (useIDB) {
            const db = await oDB();
            if (db.objectStoreNames.contains('logs')) {
                const lg = await iAll('logs');
                if (Array.isArray(lg) && lg.length) LOG = lg;
            }
        }
    } catch (e) { console.warn('logs load error', e); }
}
let CUSTOM = { categories: [], sections: {} };
const $ = id => document.getElementById(id);
const uid = () => 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
const nz = s => (s == null ? '' : String(s)).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const esc = t => { if (t == null) return ''; const d = document.createElement('div'); d.textContent = String(t); return d.innerHTML; };
const escA = t => esc(t).replace(/"/g, '&quot;');
const sImg = d => typeof d === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(d) ? d : '';
const sUrl = u => { if (typeof u !== 'string') return ''; const t = u.trim(); if (!t) return ''; if (/^\s*(javascript|data|vbscript):/i.test(t)) return ''; return t; };
const fP = (p, c) => { if (p == null || p === '' || isNaN(p)) return ''; const n = Number(p); if (!isFinite(n)) return ''; const s = { RUB: '₽', USD: '$', EUR: '€', BYN: 'Br', KZT: '₸', UAH: '₴' }; return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ' + (s[c] || c || ''); };
const fD = ts => { try { return new Date(ts).toLocaleDateString('ru-RU'); } catch (e) { return ''; } };

/* ============ ЛИЦЕНЗИЯ ============ */
let licAppReady = false;
function checkLicense() {
    let st = '';
    try { st = localStorage.getItem(LICKEY) || ''; } catch (e) { }
    if (st === 'accepted') {
        init().then(() => rSz()).catch(e => { console.error(e); toast('Ошибка инициализации', 'danger'); });
    } else if (st === 'declined') {
        $('declined').classList.add('show');
    } else {
        $('licgate').classList.add('show');
    }
}
function licAccept() {
    try { localStorage.setItem(LICKEY, 'accepted'); } catch (e) { }
    $('licgate').classList.remove('show');
    init().then(() => rSz()).catch(e => { console.error(e); toast('Ошибка инициализации', 'danger'); });
}
function licDecline() {
    try { localStorage.setItem(LICKEY, 'declined'); } catch (e) { }
    $('licgate').classList.remove('show');
    $('declined').classList.add('show');
}
function licReset() {
    try { localStorage.removeItem(LICKEY); } catch (e) { }
    $('declined').classList.remove('show');
    $('aboutmo').classList.remove('show');
    $('licgate').classList.add('show');
}

function oDB() {
    if (dbr) return dbr;
    dbr = new Promise((res, rej) => {
        if (!('indexedDB' in window)) { rej(new Error('IDB')); return; }
        const r = indexedDB.open(DN, DV);
        r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains(SP)) db.createObjectStore(SP, { keyPath: 'id' }); if (!db.objectStoreNames.contains(SW)) db.createObjectStore(SW, { keyPath: 'id' }); if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id' }); };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
    return dbr;
}
const iAll = async s => { const db = await oDB(); return new Promise((res, rej) => { const tx = db.transaction(s, 'readonly'); const r = tx.objectStore(s).getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => rej(r.error); }); };
const iPut = async (s, i) => { const db = await oDB(); return new Promise((res, rej) => { const tx = db.transaction(s, 'readwrite'); tx.objectStore(s).put(i); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); };
const iMany = async (s, arr) => { const db = await oDB(); return new Promise((res, rej) => { const tx = db.transaction(s, 'readwrite'); const st = tx.objectStore(s); arr.forEach(it => st.put(it)); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); };
const iDel = async (s, id) => { const db = await oDB(); return new Promise((res, rej) => { const tx = db.transaction(s, 'readwrite'); tx.objectStore(s).delete(id); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); };
const iClr = async s => { const db = await oDB(); return new Promise((res, rej) => { const tx = db.transaction(s, 'readwrite'); tx.objectStore(s).clear(); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); };

function nP(p) {
    if (!p || typeof p !== 'object') return null;
    const cat = (typeof p.cat === 'string' && CATS.some(x => x.id === p.cat))
        ? p.cat
        : 'Engine';
    const ALL_ENGINES = Object.keys(ENGINES);
    const ALL_BODIES = Object.keys(BODIES);
    const ALL_TRANS = Object.keys(TRANSMISSIONS);
    let inst;
    if (Array.isArray(p.inst)) { inst = p.inst.filter(i => i && i.text).map(i => ({ type: MI[IM[i.type]] || i.type || 'note', text: String(i.text) })); }
    else if (Array.isArray(p.i)) { inst = p.i.map(x => ({ type: MI[x[0]] || 'note', text: String(x[1] || '') })).filter(x => x.text); }
    else { inst = []; }
    const eng = Array.isArray(p.engines) ? p.engines.filter(x => ALL_ENGINES.includes(x)) : [];
    const bdy = Array.isArray(p.bodies) ? p.bodies.filter(x => ALL_BODIES.includes(x)) : [];
    const trn = Array.isArray(p.transmissions) ? p.transmissions.filter(x => ALL_TRANS.includes(x)) : [];
    const trm = Array.isArray(p.trims) ? p.trims.filter(x => TRIMS.includes(x)) : [];
    return {
        id: p.id || uid(), cat, sub: String(p.sub || p.subcategory || ''), name: String(p.n || p.name || ''), oem: String(p.o || p.oem || ''), verified: !!(p.v || p.verified),
        analogs: Array.isArray(p.a || p.analogs) ? (p.a || p.analogs).map(String).filter(Boolean) : [],
        donors: Array.isArray(p.d || p.donors) ? (p.d || p.donors).map(String).filter(Boolean) : [],
        engines: eng, bodies: bdy, transmissions: trn, trims: trm,
        price: (p.price == null || p.price === '') ? null : (isFinite(Number(p.price)) ? Number(p.price) : null),
        currency: p.currency || 'RUB',
        status: ['want', 'bought', 'installed'].includes(p.status) ? p.status : '',
        favorite: !!p.favorite,
        notes: String(p.notes || ''),
        shopUrl: sUrl(p.shopUrl || ''), photo: sImg(p.photo || ''), inst,
        priceHistory: Array.isArray(p.priceHistory) ? p.priceHistory.filter(h => h && typeof h === 'object' && h.ts && h.price != null).slice(-50) : []
    };
}
const nW = w => !w || typeof w !== 'object' ? null : { id: w.id || ('w_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)), name: String(w.name || ''), phone: String(w.phone || ''), address: String(w.address || ''), spec: String(w.spec || ''), rating: Math.max(0, Math.min(5, Number(w.rating) || 0)), note: String(w.note || '') };

const VY = { 'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986, 'H': 1987, 'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995, 'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999, 'Y': 2000, '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009 };
const VP = { 'A': ['Ingolstadt', 'DE'], 'B': ['Bruxelles', 'BE'], 'D': ['Dresden', 'DE'], 'E': ['Emden', 'DE'], 'H': ['Hannover', 'DE'], 'K': ['Osnabrück', 'DE'], 'M': ['Mexico', 'MX'], 'N': ['Neckarsulm', 'DE'], 'P': ['Pamplona', 'ES'], 'R': ['Moskau', 'RU'], 'S': ['Salzgitter', 'DE'], 'V': ['Westmoreland', 'US'], 'W': ['Wolfsburg', 'DE'], 'X': ['Poznań', 'PL'], 'Z': ['Zwickau', 'DE'] };
const vV = v => typeof v === 'string' && v.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(v);
function vD(v) {
    const x = String(v || '').toUpperCase();
    if (!vV(x)) return { ok: false, error: 'VIN должен быть 17 символов (без I, O, Q)' };
    const w = x.slice(0, 3), yc = x[9], pc = x[10], sr = x.slice(11);
    let brand = 'Неизвестно', country = '—';
    if (w === 'WVW') { brand = 'Volkswagen'; country = 'Германия'; }
    else if (w === 'WV1') { brand = 'Volkswagen (коммер.)'; country = 'Германия'; }
    else if (w === 'WV2') { brand = 'Volkswagen'; country = 'Германия'; }
    else if (w.startsWith('9BW') || w.startsWith('9BV')) { brand = 'VW do Brasil'; country = 'Бразилия'; }
    else if (w === '3VW') { brand = 'VW Mexico'; country = 'Мексика'; }
    let vp = x.slice(6, 9);
    if (!/^[0-9A-Z]{3}$/.test(vp) || /^ZZZ$/.test(vp)) vp = x.slice(3, 6);
    let model = '—', body = '—';
    if (/^6N/.test(vp)) {
        model = 'Polo/Caddy (6N)';
        if (vp === '6N1') body = 'Hatchback 3d';
        else if (vp === '6N2') body = 'Hatchback 5d';
        else if (vp === '6NF') body = 'Variant';
        else if (vp === '6NH') body = 'Classic Sedan';
        else if (vp === '6NX') body = 'Van';
        else body = 'Hatchback';
    }
    else if (/^9N/.test(vp)) { model = 'Polo (9N)'; body = 'Hatchback'; }
    else if (/^6K/.test(vp)) { model = 'Polo (6K)'; body = 'Hatchback'; }
    else if (/^1J/.test(vp)) { model = 'Golf (1J)'; body = 'Hatchback'; }
    const year = VY[yc] || null, pl = VP[pc] || ['—', '—'];
    return { ok: true, vin: x, brand, country, model, body, year, plant: pl[0], plantCountry: pl[1], engines: /^6N/.test(vp) ? Object.keys(ENGINES) : ['—'], serial: sr };
}
async function vR(v) { return vD(v); }

function lG() { try { const r = localStorage.getItem(GK); if (r) { const a = JSON.parse(r); if (Array.isArray(a)) G = a.filter(x => x && x.vin && x.id).map(x => ({ id: x.id, vin: String(x.vin).toUpperCase(), brand: String(x.brand || ''), model: String(x.model || ''), year: x.year || null, body: String(x.body || ''), plant: String(x.plant || ''), engines: Array.isArray(x.engines) ? x.engines : [], addedAt: x.addedAt || Date.now() })); } } catch (e) { } }
const sG = () => { try { localStorage.setItem(GK, JSON.stringify(G)); } catch (e) { } };
function lMeta() {
    try {
        const r = localStorage.getItem(METAKEY); if (!r) return;
        const m = JSON.parse(r); if (!m || typeof m !== 'object') return;
        if (Array.isArray(m.categories)) {
            for (const c of m.categories) {
                if (!c || !c.id) continue;
                const ex = CATS.find(x => x.id === c.id);
                if (ex) { ex.label = c.label || ex.label; ex.icon = c.icon || ex.icon; }
                else CATS.push({ id: c.id, label: c.label || c.id, icon: c.icon || '📁' });
            }
        }
        if (m.sections && typeof m.sections === 'object') {
            CUSTOM.sections = Object.assign({}, m.sections);
            for (const sid of Object.keys(m.sections)) {
                const s = m.sections[sid]; if (!s) continue;
                if (!CATS.find(x => x.id === sid)) CATS.push({ id: sid, label: s.label || sid, icon: s.icon || '📋' });
            }
        }
    } catch (e) { }
}
function sMeta() { try { localStorage.setItem(METAKEY, JSON.stringify(CUSTOM)); } catch (e) { } }
function resetMeta() {
    CATS = BASE_CATS.slice();
    EK = Object.assign({}, BASE_EK);
    CUSTOM = { categories: [], sections: {} };
    try { localStorage.removeItem(METAKEY); } catch (e) { }
}
function gAV() { if (!SV.activeVinId) return null; const g = G.find(x => x.id === SV.activeVinId); return g ? { ok: true, ...g } : null; }
function pCompat(p) {
    const v = gAV(); if (!v || !v.ok) return null;
    const model = nz(v.model || '');
    const donors = (p.donors || []).map(nz).filter(Boolean);
    if (!donors.length) return { pct: 50, cls: 'u', label: 'нет данных' };
    const tokens = model.split(/[\s()/\-]+/).filter(t => t.length >= 2 && t !== 'vw' && t !== 'volkswagen' && t !== 'seat' && t !== 'skoda');
    if (!tokens.length) return { pct: 50, cls: 'u', label: 'нет данных' };
    let best = 0;
    for (const d of donors) {
        if (d === model || d.includes(model) || model.includes(d)) { best = 100; break; }
        let hit = 0;
        for (const t of tokens) { if (d.includes(t)) hit++; }
        const pct = Math.round(hit / tokens.length * 100);
        if (pct > best) best = pct;
    }
    let cls, label;
    if (best >= 80) { cls = 'y'; label = 'подходит'; }
    else if (best >= 40) { cls = 'u'; label = 'возможно подходит'; }
    else if (best > 0) { cls = 'n'; label = 'скорее не подходит'; }
    else { cls = 'n'; label = 'не подходит'; }
    return { pct: best, cls, label };
}
function rGar() {
    const l = $('gl'), c = $('gc'); if (!l) return;
    c.textContent = G.length ? '(' + G.length + ')' : '';
    if (!G.length) { l.innerHTML = '<div class="ge">Нет сохранённых машин</div>'; return; }
    l.innerHTML = G.map(g => {
        const act = SV.activeVinId === g.id, desc = [g.brand, g.model, g.year].filter(Boolean).join(' ');
        return '<div class="gi' + (act ? ' active' : '') + '" data-gid="' + escA(g.id) + '"><div class="gii"><div class="giv">' + esc(g.vin) + '</div><div class="gid">' + esc(desc || '—') + '</div></div><button class="gix" data-vact="delete" data-gid="' + escA(g.id) + '" title="Удалить">✕</button></div>';
    }).join('');
}
function setAV(id) {
    SV.activeVinId = SV.activeVinId === id ? null : id;
    sU(); rGar(); rSB(); rC();
    const info = gAV();
    toast(info ? 'Активный VIN: …' + info.vin.slice(-6) : 'VIN-фильтр снят');
}
function remV(id) {
    const g = G.find(x => x.id === id); if (!g) return;
    if (!confirm('Удалить VIN ' + g.vin + '?')) return;
    G = G.filter(x => x.id !== id);
    if (SV.activeVinId === id) SV.activeVinId = null;
    sG(); sU(); rGar(); rSB(); rC(); toast('VIN удалён', 'danger');
}
function oGM() { pGV = null; $('g_vi').value = ''; $('g_re').style.display = 'none'; $('g_re').innerHTML = ''; $('g_sb').disabled = true; $('gmo').classList.add('show'); setTimeout(() => $('g_vi').focus(), 50); }
const cGM = () => { $('gmo').classList.remove('show'); pGV = null; };
async function decG() {
    const raw = $('g_vi').value.trim().toUpperCase(), re = $('g_re'), sb = $('g_sb');
    re.style.display = 'block';
    if (!raw) { re.innerHTML = '<span class="er">Введите VIN</span>'; sb.disabled = true; return; }
    if (!vV(raw)) { re.innerHTML = '<span class="er">Неверный VIN: 17 символов без I, O, Q</span>'; sb.disabled = true; return; }
    re.innerHTML = '<span class="ok">⏳ Декодируем…</span>';
    const btn = $('g_db'); btn.disabled = true;
    try {
        const info = await vR(raw);
        if (!info.ok) { re.innerHTML = '<span class="er">' + esc(info.error || 'Ошибка') + '</span>'; sb.disabled = true; return; }
        pGV = info;
        const L = []; L.push('<b>' + esc(info.brand) + '</b> ' + esc(info.model));
        if (info.year) L.push('Год: <b>' + info.year + '</b>');
        if (info.body && info.body !== '—') L.push('Кузов: ' + esc(info.body));
        if (info.plant) L.push('Завод: ' + esc(info.plant));
        if (info.engines && info.engines[0] !== '—') L.push('Двигатели: ' + esc(info.engines.slice(0, 8).join(', ')));
        re.innerHTML = L.join('<br>'); sb.disabled = false;
    } catch (e) { re.innerHTML = '<span class="er">Ошибка: ' + esc(e.message) + '</span>'; sb.disabled = true; }
    finally { btn.disabled = false; }
}
function sGarV() {
    if (!pGV || !pGV.ok) return;
    if (G.some(g => g.vin === pGV.vin)) { toast('VIN уже в гараже', 'danger'); return; }
    const g = { id: 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6), vin: pGV.vin, brand: pGV.brand || '', model: pGV.model || '', year: pGV.year || null, body: pGV.body || '', plant: pGV.plant || '', engines: Array.isArray(pGV.engines) ? pGV.engines : [], addedAt: Date.now() };
    G.push(g); sG(); SV.activeVinId = g.id; sU(); rGar(); rSB(); rC(); cGM(); toast('VIN сохранён', 'success');
}

/* ============ ПРОФИЛЬ ============ */
function lProfile() {
    try {
        const r = localStorage.getItem(PROFKEY);
        if (r) {
            const p = JSON.parse(r); if (p && typeof p === 'object') {
                USER = { name: String(p.name || ''), email: String(p.email || ''), city: String(p.city || ''), initials: String(p.initials || ''), color: String(p.color || '#00b0f0') };
            }
        }
    } catch (e) { }
}
function sProfileStorage() {
    try { localStorage.setItem(PROFKEY, JSON.stringify(USER)); } catch (e) { }
}
function renderProfile() {
    const av = $('sft_avatar'), un = $('sft_username');
    if (!av || !un) return;
    const nm = USER.name.trim();
    const ini = (USER.initials || '').trim().toUpperCase().slice(0, 2) || (nm ? nm.slice(0, 2).toUpperCase() : '');
    av.textContent = ini || '👤';
    av.style.background = USER.color || 'linear-gradient(135deg,#00b0f0,#0091c9)';
    un.textContent = nm || 'Гость';
    un.title = nm ? nm + (USER.city ? ' · ' + USER.city : '') : 'Нажмите, чтобы заполнить профиль';
}
function oProfile() {
    $('pf_name').value = USER.name || '';
    $('pf_email').value = USER.email || '';
    $('pf_city').value = USER.city || '';
    $('pf_ini').value = USER.initials || '';
    renderColors();
    updateProfPreview();
    $('profmo').classList.add('show');
}
function cProfile() { $('profmo').classList.remove('show'); }
function sProfile() {
    USER.name = $('pf_name').value.trim().slice(0, 40);
    USER.email = $('pf_email').value.trim().slice(0, 80);
    USER.city = $('pf_city').value.trim().slice(0, 60);
    USER.initials = $('pf_ini').value.trim().toUpperCase().slice(0, 2);
    sProfileStorage();
    renderProfile();
    cProfile();
    toast('Профиль сохранён', 'success');
}
function resetProfile() {
    if (!confirm('Сбросить профиль?')) return;
    USER = { name: '', email: '', city: '', initials: '', color: '#00b0f0' };
    sProfileStorage();
    renderProfile();
    $('pf_name').value = ''; $('pf_email').value = ''; $('pf_city').value = ''; $('pf_ini').value = '';
    renderColors();
    updateProfPreview();
    toast('Профиль сброшен', 'danger');
}
const PROF_COLORS = ['#00b0f0', '#28a745', '#dc3545', '#9c27b0', '#f5a623', '#17a2b8', '#6c757d', '#ff6b00'];
function renderColors() {
    const c = $('pf_colors'); if (!c) return;
    c.innerHTML = PROF_COLORS.map(col => '<button type="button" class="prof-color' + (USER.color === col ? ' sel' : '') + '" data-color="' + col + '" style="background:' + col + '" title="' + col + '"></button>').join('');
    c.querySelectorAll('.prof-color').forEach(b => { b.onclick = () => { USER.color = b.dataset.color; renderColors(); updateProfPreview(); }; });
}
function updateProfPreview() {
    const big = $('prof_avatar_big'), nm = $('prof_name_view'), sub = $('prof_sub_view');
    if (!big || !nm || !sub) return;
    const name = $('pf_name').value.trim() || 'Гость';
    const ini = $('pf_ini').value.trim().toUpperCase().slice(0, 2) || name.slice(0, 2).toUpperCase();
    big.textContent = ini || '👤';
    big.style.background = USER.color || '#00b0f0';
    nm.textContent = name;
    const parts = [];
    if ($('pf_city').value.trim()) parts.push($('pf_city').value.trim());
    if ($('pf_email').value.trim()) parts.push($('pf_email').value.trim());
    sub.textContent = parts.length ? parts.join(' · ') : 'Локальный профиль · не синхронизируется';
}

/* ============ ДОНАТ ============ */
function oDonate() { $('donmo').classList.add('show'); }
function cDonate() { $('donmo').classList.remove('show'); }

/* ============ ОБНОВЛЕНИЕ ============ */
function oUp() {
    try { $('up_url').value = localStorage.getItem(UPKEY) || location.origin + location.pathname.replace(/[^/]*$/, '') + 'data/parts.json'; } catch (e) { }
    $('up_status').innerHTML = '';
    $('upmo').classList.add('show');
}
function cUp() { $('upmo').classList.remove('show'); window._upParts = null; }
function sUpUrl() {
    const u = $('up_url').value.trim();
    try { localStorage.setItem(UPKEY, u); } catch (e) { }
    toast(u ? 'URL сохранён' : 'URL очищен', 'success');
}

const url = $('up_url').value.trim();
async function checkUpdate() {
    const st = $('up_status');
    st.innerHTML = '<div class="up-load">⏳ Проверяем сервер…</div>';
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    let remoteVer = null;
    try {
        const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
        if (r.ok) { const m = await r.json(); remoteVer = String(m.appVersion || ''); }
    } catch (e) { }
    const files = [
        'data/parts-01-engine-fuel-ignition.json',
        'data/parts-02-cooling-heating-brakes-suspension.json',
        'data/parts-03-trans-exh-elec-bulbs.json',
        'data/parts-04-body-interior-maint-fluids-roadkit.json',
        'data/parts-05-rear-axle-controls.json'
    ];
    let parts = [];
    for (const f of files) {
        try {
            const r = await fetch(f + '?t=' + Date.now(), { cache: 'no-store' });
            if (!r.ok) continue;
            const arr = await r.json();
            if (Array.isArray(arr)) parts = parts.concat(arr);
        } catch (e) { }
    }
    window._upParts = parts;
    const seen = new Set(D.map(x => (x.oem || '') + '||' + (x.name || '')));
    let newCnt = 0;
    for (const raw of parts) {
        const p = nP(raw); if (!p) continue;
        const k = (p.oem || '') + '||' + (p.name || '');
        if (!seen.has(k)) newCnt++;
    }
    const appNewer = remoteVer && remoteVer !== APP_VERSION;
    let h = '<div class="up-ok">';
    h += '<div style="font-weight:700;margin-bottom:8px">✓ Проверка завершена</div>';
    h += '<div style="margin-bottom:4px">Программа: <b>' + esc(APP_VERSION) + '</b>';
    if (appNewer) h += ' → <b style="color:var(--a)">' + esc(remoteVer) + '</b> — доступна новая';
    else h += ' — актуальна';
    h += '</div>';
    h += '<div style="margin-bottom:4px">Позиций: <b>' + D.length + '</b> у вас · <b>' + parts.length + '</b> на сервере</div>';
    h += '<div style="margin-bottom:8px">Новых: <b>' + newCnt + '</b></div>';
    h += '<div class="up-actions">';
    h += '<button class="bn ok-btn" onclick="doFullUpdate()">🔄 Обновить всё</button>';
    if (newCnt) h += '<button class="bn p" onclick="applyUpMerge()">➕ Добавить новые (' + newCnt + ')</button>';
    h += '</div></div>';
    st.innerHTML = h;
}

function doFullUpdate() {
    toast('Загружаем свежую версию…', 'success');
    setTimeout(() => location.replace(location.pathname + '?v=' + Date.now()), 300);
}

function applyUpMerge() {
    const parts = window._upParts; if (!parts) { toast('Нет данных', 'danger'); return; }
    const cl = parts.map(nP).filter(Boolean);
    const seen = new Set(D.map(x => (x.oem || '') + '||' + (x.name || '')));
    let add = 0;
    for (const p of cl) {
        const k = (p.oem || '') + '||' + (p.name || '');
        if (!seen.has(k)) { D.push(p); seen.add(k); add++; }
    }
    useIDB ? iMany(SP, D).catch(() => { }) : sD();
    rSB(); rC(); cUp();
    toast('Добавлено: ' + add + ' из ' + cl.length, 'success');
}
function applyUpReplace() {
    const parts = window._upParts; if (!parts) { toast('Нет данных', 'danger'); return; }
    if (!confirm('Заменить всю базу данных?\n\nВНИМАНИЕ: ваши правки будут потеряны! Продолжить?')) return;
    D = parts.map(nP).filter(Boolean);
    if (useIDB) iClr(SP).then(() => iMany(SP, D)).catch(() => { }); else sD();
    rSB(); rC(); cUp();
    toast('База заменена: ' + D.length + ' поз.', 'success');
}

/* ============ О ПРОГРАММЕ / БАГ ============ */
const oAbout = () => { $('aboutmo').classList.add('show'); };
const cAbout = () => { $('aboutmo').classList.remove('show'); };
const oBug = () => {
    const ml = $('bug_mailto');
    if (ml) ml.href = 'mailto:donignasio@vk.com?subject='
        + encodeURIComponent('База Мастера — баг-репорт')
        + '&body=' + encodeURIComponent(
            'Версия: ' + APP_VERSION + '\n' +
            'Устройство/браузер: \n' +
            'Что сделал: \n' +
            'Что ожидал: \n' +
            'Что получил: \n'
        );
    $('bugmo').classList.add('show');
};
const cBug = () => { $('bugmo').classList.remove('show'); };

async function loadFromServer() {
    const files = [
        'data/parts-01-engine-fuel-ignition.json',
        'data/parts-02-cooling-heating-brakes-suspension.json',
        'data/parts-03-trans-exh-elec-bulbs.json',
        'data/parts-04-body-interior-maint-fluids-roadkit.json',
        'data/parts-05-rear-axle-controls.json'
    ];
    let all = [], anyOk = false;
    for (const f of files) {
        try {
            const r = await fetch(f, { cache: 'no-store' });
            if (!r.ok) { console.warn('Не найден:', f); continue; }
            const parts = await r.json();
            if (Array.isArray(parts) && parts.length) { all = all.concat(parts); anyOk = true; console.log('OK:', f, parts.length); }
        } catch (e) { console.warn('Ошибка в ' + f, e); }
    }
    if (!anyOk) return false;
    D = all.map(nP).filter(Boolean);
    console.log('Итого загружено:', D.length);
    if (useIDB) await iMany(SP, D); else sD();
    try {
        const rs = await fetch('data/sections.json', { cache: 'no-store' });
        if (rs.ok) { const secs = await rs.json(); if (secs && typeof secs === 'object') { CUSTOM.sections = Object.assign({}, secs); sMeta(); } }
    } catch (e) { }
    try {
        const rw = await fetch('data/workshops.json', { cache: 'no-store' });
        if (rw.ok) { const ws = await rw.json(); if (Array.isArray(ws) && ws.length) { W = ws.map(nW).filter(Boolean); if (useIDB) await iMany(SW, W); else sWk(); } }
    } catch (e) { }
    return true;
}
async function lAll() {
    // 1. Локальные данные
    try {
        const p = await iAll(SP), w = await iAll(SW);
        D = p.map(nP).filter(Boolean);
        W = w.map(nW).filter(Boolean);
    } catch (e) { useIDB = false; lLS(); }

    // 2. Манифест из update.json
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    let files = [];
    try {
        const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
        if (r.ok) {
            const m = await r.json();
            if (Array.isArray(m.files) && m.files.length) files = m.files;
        }
    } catch (e) { console.warn('update.json не загрузился', e); }
    if (!files.length) {
        files = [
            'data/parts-01-engine-fuel-ignition.json',
            'data/parts-02-cooling-heating-brakes-suspension.json',
            'data/parts-03-trans-exh-elec-bulbs.json',
            'data/parts-04-body-interior-maint-fluids-roadkit.json',
            'data/parts-05-rear-axle-controls.json',
            'data/categories.json',
            'data/sections.json',
            'data/workshops.json'
        ];
    }

    // 3. Скачиваем всё, раскладываем по типам
    let serverParts = [], cats = null, secs = null, wss = null;
    for (const f of files) {
        try {
            const r = await fetch(f + '?t=' + Date.now(), { cache: 'no-store' });
            if (!r.ok) { console.warn('Не найден:', f); continue; }
            const data = await r.json();
            if (/parts-/.test(f) && Array.isArray(data)) {
                serverParts = serverParts.concat(data);
                console.log('OK:', f, data.length);
            } else if (/categories/.test(f) && Array.isArray(data)) {
                cats = data;
            } else if (/sections/.test(f) && data && typeof data === 'object') {
                secs = data;
            } else if (/workshops/.test(f) && Array.isArray(data)) {
                wss = data;
            }
        } catch (e) { console.warn('Ошибка ' + f, e); }
    }

    // 4. Мерж + обновление
    if (serverParts.length) {
        const map = new Map(D.map(x => [(x.oem || '') + '||' + (x.name || ''), x]));
        let add = 0, upd = 0;
        for (const raw of serverParts) {
            const np = nP(raw); if (!np) continue;
            const k = (np.oem || '') + '||' + (np.name || '');
            if (!map.has(k)) { D.push(np); map.set(k, np); add++; }
            else {
                const old = map.get(k);
                const user = { id: old.id, status: old.status, favorite: old.favorite, notes: old.notes, price: old.price, currency: old.currency, priceHistory: old.priceHistory, photo: old.photo, shopUrl: old.shopUrl };
                Object.assign(old, np, user);
                upd++;
            }
        }
        console.log('С сервера: +' + add + ', ~' + upd + ' | Итого:', D.length);
        if (useIDB) try { await iMany(SP, D); } catch (e) { }
        else sD();
    }

    // 5. Категории
    if (cats) for (const c of cats) {
        if (!c || !c.id) continue;
        if (!CATS.find(x => x.id === c.id)) CATS.push({ id: c.id, label: c.label || c.id, icon: c.icon || '📁' });
    }

    // 6. Секции
    if (secs) { CUSTOM.sections = Object.assign({}, secs); sMeta(); }

    // 7. Мастерские
    if (wss && wss.length) {
        W = wss.map(nW).filter(Boolean);
        if (useIDB) await iMany(SW, W); else sWk();
    }

    lG(); lMeta(); lU(); lProfile(); lTO(); await lLogs();
    if (SV.activeVinId && !G.some(g => g.id === SV.activeVinId)) SV.activeVinId = null;
    try { vk = localStorage.getItem(VK) || ''; } catch (e) { }
}
function lLS() {
    try { const r = localStorage.getItem(PK); if (r) { const a = JSON.parse(r); if (Array.isArray(a)) D = a.map(nP).filter(Boolean); } } catch (e) { }
    if (!D.length) D = DB.map(nP).filter(Boolean);
    try { const r = localStorage.getItem(WK); if (r) { const a = JSON.parse(r); if (Array.isArray(a)) W = a.map(nW).filter(Boolean); } } catch (e) { }
}
const sD = () => { if (useIDB) iMany(SP, D).catch(() => toast('Ошибка IndexedDB', 'danger')); else { try { localStorage.setItem(PK, JSON.stringify(D)); } catch (e) { toast('Хранилище переполнено', 'danger'); } } };
const sLogs = () => { if (useIDB) iMany('logs', LOG).catch(() => { }); else { try { localStorage.setItem('vw_polo_logs_v1', JSON.stringify(LOG)); } catch (e) { } } };
const sWk = () => { if (useIDB) iMany(SW, W).catch(() => { }); else { try { localStorage.setItem(WK, JSON.stringify(W)); } catch (e) { } } };
function lU() { try { const r = localStorage.getItem(UK); if (r) { const p = JSON.parse(r); SV = Object.assign(SV, p); if (!CATS.some(c => c.id === SV.activeCat) && !['Favorites', 'Workshops'].includes(SV.activeCat)) SV.activeCat = 'All'; } } catch (e) { } }
const sU = () => { try { localStorage.setItem(UK, JSON.stringify(SV)); } catch (e) { } };

let tt = null;
function toast(m, k) { const kk = k === 'success' ? 's' : k === 'danger' ? 'd' : (k || ''); const e = $('tt'); clearTimeout(tuT); e.innerHTML = ''; e.textContent = m; e.className = 'tst show' + (kk ? ' ' + kk : ''); clearTimeout(tt); tt = setTimeout(() => e.classList.remove('show'), 5000); }
let tuT = null;
function toastUndo(msg, onUndo) {
    const e = $('tt');
    e.innerHTML = esc(msg) + ' <button id="tt_undo" style="margin-left:10px;padding:2px 10px;border:1px solid #fff;background:transparent;color:#fff;border-radius:3px;cursor:pointer;font-weight:700;font-size:.78rem">↶ Вернуть</button><div id="tt_progress"></div>';
    e.className = 'tst show d';
    clearTimeout(tuT);
    const btn = $('tt_undo');
    const bar = $('tt_progress');
    if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '100%';
        requestAnimationFrame(() => {
            bar.style.transition = 'width 10s linear';
            bar.style.width = '0%';
        });
    }
    if (btn) btn.onclick = () => {
        clearTimeout(tuT);
        e.classList.remove('show');
        onUndo();
    };
    tuT = setTimeout(() => e.classList.remove('show'), 10000);
}

let usT = null, rcT = null;
const sUS = () => { clearTimeout(usT); usT = setTimeout(sU, 300); };
const dRC = () => { clearTimeout(rcT); rcT = setTimeout(rC, 120); };

async function init() {
    if (licAppReady) return; licAppReady = true;
    await lAll(); aTh(); aSS(); rGar(); rSB(); rC(); renderProfile();
    const si = $('sr'); si.value = SV.searchQuery || ''; uSC();
    [['sr', 'input', e => { SV.searchQuery = e.target.value; uSC(); sUS(); dRC(); }],
    ['sf', 'change', e => { SV.statusFilter = e.target.value; sU(); rC(); }],
    ['ss', 'change', e => { SV.sortBy = e.target.value; sU(); rC(); }],
    ['fmtr', 'change', e => { SV.engineFilter = e.target.value; updateFilterStyling(); sU(); rC(); }],
    ['fbdy', 'change', e => { SV.bodyFilter = e.target.value; updateFilterStyling(); sU(); rC(); }],
    ['ftr', 'change', e => { SV.transFilter = e.target.value; updateFilterStyling(); sU(); rC(); }],
    ['if', 'change', oIF], ['pf', 'change', oPF]].forEach(([id, ev, fn]) => $(id).addEventListener(ev, fn));
    ['pf_name', 'pf_ini', 'pf_city', 'pf_email'].forEach(id => { const el = $(id); if (el) el.addEventListener('input', updateProfPreview); });
    $('sf').value = SV.statusFilter || 'all'; $('ss').value = SV.sortBy || 'default';
    $('fmtr').value = SV.engineFilter || 'all';
    $('fbdy').value = SV.bodyFilter || 'all';
    $('ftr').value = SV.transFilter || 'all';
    updateFilterStyling();
    setV(SV.view || 'grid', true);
    $('ca').addEventListener('click', oCC);
    $('ca').addEventListener('focusout', e => {
        const t = e.target;
        if (t && t.classList && t.classList.contains('cn')) {
            const id = t.dataset.notesId;
            if (!id) return;
            const p = D.find(x => x.id === id);
            if (!p) return;
            const v = t.value;
            if (p.notes !== v) {
                p.notes = v;
                useIDB ? iPut(SP, p).catch(() => { }) : sD();
                toast('Заметка сохранена', 'success');
            }
        }
    });
    $('gl').addEventListener('click', e => {
        const d = e.target.closest('[data-vact="delete"]');
        if (d) { e.stopPropagation(); remV(d.dataset.gid); return; }
        const i = e.target.closest('.gi'); if (i && i.dataset.gid) setAV(i.dataset.gid);
    });
    $('gab').addEventListener('click', oGM);
    ['mo', 'wmo', 'gmo', 'smo', 'aboutmo', 'bugmo', 'donmo', 'profmo', 'upmo', 'partmo'].forEach(id => {
        $(id).addEventListener('click', e => {
            if (e.target.id === id) {
                if (id === 'mo') cM(); else if (id === 'wmo') cWM(); else if (id === 'gmo') cGM(); else if (id === 'smo') cSM();
                else if (id === 'partmo') cPC();
                else if (id === 'aboutmo') cAbout(); else if (id === 'bugmo') cBug(); else if (id === 'donmo') cDonate();
                else if (id === 'profmo') cProfile(); else if (id === 'upmo') cUp();
                else if (id === 'logmo') cLog(); else if (id === 'tomo') cTO(); else if (id === 'shopmo') cShop();
                else if (id === 'partmo') cPC();
            }
        });
    });
    document.addEventListener('click', e => { const m = $('em'); if (m.classList.contains('show') && !e.target.closest('.ew')) cEM(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if ($('partmo') && $('partmo').classList.contains('show')) return cPC();
            if ($('lbt').classList.contains('show')) return cL();
            if ($('aboutmo').classList.contains('show')) return cAbout();
            if ($('bugmo').classList.contains('show')) return cBug();
            if ($('donmo').classList.contains('show')) return cDonate();
            if ($('profmo').classList.contains('show')) return cProfile();
            if ($('upmo').classList.contains('show')) return cUp();
            if ($('mo').classList.contains('show')) return cM();
            if ($('wmo').classList.contains('show')) return cWM();
            if ($('gmo').classList.contains('show')) return cGM();
            if ($('smo').classList.contains('show')) return cSM();
            if ($('sb').classList.contains('open-mobile')) return cMM();
            cEM();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); si.focus(); si.select(); }
    });
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(rSz, 120); });
    const dt = $('dtgl'); if (dt) dt.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); tSB(); });
    const mt = $('mob'); if (mt) mt.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); tMM(); });
    const gv = $('g_vi'), vv = /[A-HJ-NPR-Z0-9]/, vm = 17;
    gv.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); decG(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length > 1) return;
        const ch = e.key.toUpperCase();
        if (!vv.test(ch)) { e.preventDefault(); return; }
        const s = gv.selectionStart ?? gv.value.length, en = gv.selectionEnd ?? gv.value.length, l = gv.value.length;
        const wb = (s !== en) ? l - (en - s) + 1 : l + 1;
        if (wb > vm) e.preventDefault();
    });
    gv.addEventListener('input', () => {
        if (gv.isComposing) return;
        const r = gv.value, u = r.toUpperCase();
        if (u === r) return;
        const s = gv.selectionStart, e2 = gv.selectionEnd;
        gv.value = u;
        try { gv.setSelectionRange(s, e2); } catch (err) { }
    });
    ['paste', 'blur'].forEach(ev => gv.addEventListener(ev, () => {
        const f = () => { const r = gv.value, c = r.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, vm); if (c !== r) gv.value = c; };
        if (ev === 'paste') setTimeout(f, 0); else f();
    }));
    updSearchSuggest();
    rTOWidget();
    iPWA();
}
function updSearchSuggest() {
    const dl = $('searchSuggest'); if (!dl) return;
    const items = [], seen = new Set();
    const push = (v, k) => { if (v && !seen.has(k)) { items.push(v); seen.add(k); } };
    for (const p of D) {
        push(p.oem, 'o:' + p.oem);
        push(p.name, 'n:' + p.name);
        for (const a of (p.analogs || [])) push(a, 'a:' + a);
    }
    dl.innerHTML = items.slice(0, 500).map(x => '<option value="' + escA(x) + '">').join('');
}
function updateFilterStyling() {
    ['fmtr', 'fbdy', 'ftr'].forEach(id => { const el = $(id); if (!el) return; el.classList.toggle('act', el.value && el.value !== 'all'); });
}
function aTh() { document.body.classList.toggle('theme-dark', SV.theme !== 'light'); $('tb2').textContent = SV.theme === 'light' ? '🌙' : '☀️'; }
function tTh() { SV.theme = SV.theme === 'light' ? 'dark' : 'light'; aTh(); sU(); }
function setV(v, s) { SV.view = v; if (!s) sU(); $('vg').classList.toggle('active', v === 'grid'); $('vt').classList.toggle('active', v === 'tree'); rC(); }
function aSS() { const m = window.innerWidth <= 900, sb = $('sb'), bd = document.body; if (!m && SV.sidebarCollapsed) { sb.classList.add('collapsed'); bd.classList.add('sidebar-collapsed'); } else { sb.classList.remove('collapsed'); bd.classList.remove('sidebar-collapsed'); } }
function rSz() { aSS(); const m = window.innerWidth <= 900; const mb = $('mob'); if (mb) mb.style.display = m ? 'flex' : ''; if (!m) cMM(); }
function tSB() { if (window.innerWidth <= 900) return; SV.sidebarCollapsed = !SV.sidebarCollapsed; aSS(); sU(); }
const oMM = () => { $('sb').classList.add('open-mobile'); $('ov').classList.add('show'); };
const cMM = () => { $('sb').classList.remove('open-mobile'); $('ov').classList.remove('show'); };
const tMM = () => $('sb').classList.contains('open-mobile') ? cMM() : oMM();

function rSB() {
    const n = $('nl'); n.innerHTML = '';
    const cnt = id => D.filter(p => p.cat === id).length;
    const add = (id, ic, lb, count, cls, sub) => {
        const li = document.createElement('li');
        li.className = 'ni ' + (SV.activeCat === id ? 'active ' : '') + (cls || '') + (sub ? ' sub' : '');
        li.setAttribute('tabindex', '-1');
        li.onclick = () => { SV.activeCat = id; sU(); rSB(); rC(); if (window.innerWidth <= 900) cMM(); $('ca').scrollTop = 0; };
        li.innerHTML = '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + ic + ' ' + esc(lb) + '</span><span class="bdg">' + count + '</span>';
        n.appendChild(li);
    };
    add('All', '📦', 'Все системы', D.length);
    add('Favorites', '⭐', 'Избранное', D.filter(p => p.favorite).length, 'fav');
    const dv = document.createElement('li'); dv.className = 'nd'; n.appendChild(dv);
    // Верхние уровни — категории без parent
    CATS.filter(c => c.id !== 'All' && !c.parent).forEach(c => {
        const kids = CATS.filter(k => k.parent === c.id);
        const own = cnt(c.id);
        const total = own + kids.reduce((s, k) => s + cnt(k.id), 0);
        add(c.id, c.icon, c.label, total, kids.length ? 'folder' : '');
        kids.forEach(k => add(k.id, k.icon, k.label, cnt(k.id), '', true));
    });
    const dv2 = document.createElement('li'); dv2.className = 'nd'; n.appendChild(dv2);
    add('Workshops', '🔧', 'Мастерские', W.length);
    add('Log', '📖', 'Журнал обслуживания', LOG.length);
}
function nI(id, ic, lb, ct, ex) {
    const li = document.createElement('li');
    li.className = 'ni ' + (ex || '') + (SV.activeCat === id ? ' active' : '');
    li.setAttribute('tabindex', '-1');
    li.onclick = () => { SV.activeCat = id; sU(); rSB(); rC(); if (window.innerWidth <= 900) cMM(); $('ca').scrollTop = 0; };
    li.innerHTML = '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + ic + ' ' + esc(lb) + '</span><span class="bdg">' + ct + '</span>';
    return li;
}

const uSC = () => $('scl').classList.toggle('show', !!(SV.searchQuery || '').length);
const cS = () => { SV.searchQuery = ''; $('sr').value = ''; uSC(); sU(); rC(); };
function resetFilters() {
    SV.searchQuery = ''; $('sr').value = ''; uSC();
    SV.statusFilter = 'all'; $('sf').value = 'all';
    SV.engineFilter = 'all'; $('fmtr').value = 'all';
    SV.bodyFilter = 'all'; $('fbdy').value = 'all';
    SV.transFilter = 'all'; $('ftr').value = 'all';
    SV.sortBy = 'default'; $('ss').value = 'default';
    updateFilterStyling(); sU(); rC(); toast('Фильтры сброшены', 'success');
}
async function rD() {
    if (!confirm('Полный сброс: удалить всё и загрузить заново с сервера?')) return;
    try {
        if (useIDB) { await iClr(SP); await iClr(SW); }
        localStorage.removeItem(PK);
        localStorage.removeItem(WK);
        resetMeta();
        D = []; W = [];
        await lAll();
        rSB(); rC();
        toast('Загружено: ' + D.length + ' поз.', 'success');
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}

function mP(p, t) {
    if (!t.length) return true;
    const h = nz([p.oem || '', p.name || '', ...(p.analogs || []), ...(p.donors || []), ...((p.inst || []).map(i => i.text)), p.notes || '', ...(p.engines || []), ...(p.transmissions || []), ...(p.bodies || [])].join('  '));
    return t.every(x => h.includes(x));
}
function sP(a) {
    const s = SV.sortBy;
    if (s === 'oem') return [...a].sort((x, y) => (x.oem || '').localeCompare(y.oem || ''));
    if (s === 'name') return [...a].sort((x, y) => (x.name || '').localeCompare(y.name || ''));
    if (s === 'priceAsc') return [...a].sort((x, y) => (Number(x.price) || Infinity) - (Number(y.price) || Infinity));
    if (s === 'priceDesc') return [...a].sort((x, y) => (Number(y.price) || -Infinity) - (Number(x.price) || -Infinity));
    if (s === 'favorite') return [...a].sort((x, y) => (y.favorite ? 1 : 0) - (x.favorite ? 1 : 0));
    return a;
}
function gF() {
    const t = nz(SV.searchQuery).split(/\s+/).filter(Boolean);
    let f = D;
    // По умолчанию VIN НЕ скрывает детали — только подсвечивает бейдж совместимости.
    // Жёсткий режим включается чипом «🔒 VIN-строго» над списком.
    if (SV.activeVinId && SV.vinStrictFilter) {
        f = f.filter(p => {
            if (!p.donors || !p.donors.length) return true;
            const cmp = pCompat(p);
            return !cmp || cmp.cls !== 'n';
        });
    }
    if (SV.activeCat === 'Favorites') f = f.filter(p => p.favorite);
    else if (SV.activeCat !== 'All' && SV.activeCat !== 'Workshops') f = f.filter(p => p.cat === SV.activeCat);
    if (SV.statusFilter && SV.statusFilter !== 'all') f = f.filter(p => (p.status || '') === SV.statusFilter);
    if (SV.engineFilter && SV.engineFilter !== 'all') {
        f = f.filter(p => {
            const arr = p.engines || [];
            if (!arr.length) return true;
            return arr.includes(SV.engineFilter);
        });
    }
    if (SV.bodyFilter && SV.bodyFilter !== 'all') {
        f = f.filter(p => {
            const arr = p.bodies || [];
            if (!arr.length) return true;
            return arr.includes(SV.bodyFilter);
        });
    }
    if (SV.transFilter && SV.transFilter !== 'all') {
        f = f.filter(p => {
            const arr = p.transmissions || [];
            if (!arr.length) return true;
            return arr.includes(SV.transFilter);
        });
    }
    if (t.length) f = f.filter(p => mP(p, t));
    return sP(f);
}

function rC() {
    if (SV.activeCat === 'Workshops') { rW(); return; }
    if (SV.activeCat === 'Log') { rLog(); return; }
    if (CUSTOM.sections[SV.activeCat]) { rSec(SV.activeCat); return; }
    const ar = $('ca'), f = gF();
    let title, icon;
    if (SV.activeCat === 'Favorites') { title = 'Избранное'; icon = '⭐'; }
    else if (SV.activeCat === 'All') { title = 'Все системы'; icon = '📦'; }
    else { const c = CATS.find(x => x.id === SV.activeCat); title = c ? c.label : '?'; icon = c ? c.icon : '📦'; }
    let h = '<h2 class="sh">' + icon + ' ' + esc(title) + '</h2>';
    const chips = [];
    chips.push('<span class="chip">найдено: <b>' + f.length + '</b></span>');
    if (SV.engineFilter && SV.engineFilter !== 'all') chips.push('<span class="chip">⚙️ ' + esc(SV.engineFilter) + '</span>');
    if (SV.bodyFilter && SV.bodyFilter !== 'all') chips.push('<span class="chip">🚗 ' + esc(BODIES[SV.bodyFilter] || SV.bodyFilter) + '</span>');
    if (SV.transFilter && SV.transFilter !== 'all') chips.push('<span class="chip">🔄 ' + esc(TRANSMISSIONS[SV.transFilter] || SV.transFilter) + '</span>');
    if (SV.statusFilter && SV.statusFilter !== 'all') chips.push('<span class="chip">🏷 ' + esc(SV.statusFilter) + '</span>');
    if (SV.searchQuery) chips.push('<span class="chip">🔍 "' + esc(SV.searchQuery) + '"</span>');
    chips.push('<span class="chip" data-chip="groupBySub" style="cursor:pointer;' + (SV.groupBySub ? 'border-color:var(--a);background:rgba(0,176,240,.12);' : '') + '" title="Группировать по подкатегориям">📂 Группы</span>');
    const av = gAV();
    if (av) {
        chips.push('<span class="chip">VIN …' + esc(av.vin.slice(-6)) + '</span>');
        chips.push('<span class="chip" data-chip="vinStrict" style="cursor:pointer;' + (SV.vinStrictFilter ? 'border-color:var(--dg);background:rgba(220,53,69,.12);' : '') + '" title="Скрыть детали, несовместимые с VIN">🔒 VIN-строго</span>');
    }
    h += '<div class="ri">' + chips.join('') + '</div>';
    if (!f.length) {
        let ei, em;
        if (SV.activeCat === 'Favorites') { ei = '⭐'; em = 'Пока нет избранного.'; }
        else if (!D.length) { ei = '📂'; em = 'База пуста. Положи parts.json в data/ или нажми ⚙️ → 🌐 Обновление базы.'; }
        else { ei = '🔍'; em = 'Ничего не найдено. Попробуйте сбросить фильтры.'; }
        h += '<div class="emp"><div class="empi">' + ei + '</div><p>' + em + '</p><button class="bn" onclick="resetFilters()" style="margin-top:10px">🔄 Сбросить фильтры</button></div>';
        ar.innerHTML = h; return;
    }
    if (SV.view === 'tree') { h += rET(f); }
    else if (SV.groupBySub) {
        const groups = {};
        for (const p of f) { const k = (p.sub || '').trim() || '— без подкатегории —'; if (!groups[k]) groups[k] = []; groups[k].push(p); }
        const keys = Object.keys(groups).sort((a, b) => (a === '— без подкатегории —' ? 1 : b === '— без подкатегории —' ? -1 : 0) || a.localeCompare(b));
        for (const k of keys) {
            h += '<h3 style="margin:14px 0 8px;font-size:.9rem;color:var(--b);display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:3px;height:14px;background:var(--a);border-radius:2px"></span>' + esc(k) + ' <span style="font-size:.72rem;color:var(--mu);font-weight:400">(' + groups[k].length + ')</span></h3>';
            h += '<div class="gr">';
            for (const p of groups[k]) h += cH(p);
            h += '</div>';
        }
    } else {
        h += '<div class="gr">'; for (const p of f) h += cH(p); h += '</div>';
    }
    ar.innerHTML = h;
}
function cH(p) {
    const o = p.oem || '';
    const anInline = (p.analogs || []).length
        ? (p.analogs || []).map(a => '<span class="tg an">' + esc(a) + '<button class="ctb2" data-copy="' + escA(a) + '" title="Копировать">📋</button></span>').join('')
        : '<span style="color:var(--mu);font-size:.66rem">—</span>';
    const dn = (p.donors || []).map(d => '<span class="tg dn">' + esc(d) + '</span>').join('') || '<span style="color:var(--mu);font-size:.72rem">— нет данных —</span>';
    const eng = (p.engines || []).map(e => '<span class="tg eg">' + esc(e) + '</span>').join('') || '<span style="color:var(--mu);font-size:.72rem">универсально</span>';
    const bdy = (p.bodies || []).map(b => '<span class="tg bd">' + esc(BODIES[b] || b) + '</span>').join('') || '<span style="color:var(--mu);font-size:.72rem">все кузова</span>';
    const trn = (p.transmissions || []).map(t => '<span class="tg tr">' + esc(TRANSMISSIONS[t] || t) + '</span>').join('') || '';
    const trm = (p.trims || []).map(t => '<span class="tg tm">' + esc(t) + '</span>').join('') || '';
    let ih = '';
    if (p.inst && p.inst.length) {
        const warns = p.inst.filter(i => i.type === 'warn');
        const others = p.inst.filter(i => i.type !== 'warn');
        ih = '<div class="ins">';
        if (warns.length) { for (const it of warns) { ih += '<div class="ini"><span class="it tw">ВНИМАНИЕ</span>' + esc(it.text) + '</div>'; } }
        if (others.length) { for (const it of others) { const k = IM[it.type] || 'n'; ih += '<div class="ini" style="margin-top:5px"><span class="it ' + IC[k] + '">' + IL[k] + '</span>' + esc(it.text) + '</div>'; } }
        ih += '</div>';
    }
    const ntH = '<textarea class="cn" data-notes-id="' + escA(p.id) + '" placeholder="Заметка…" rows="2">' + esc(p.notes || '') + '</textarea>';
    const ph = p.photo || ''; const phh = ph ? '<div class="cd-sec" style="padding-top:4px"><img class="cd-photo" src="' + ph + '" alt="" data-lightbox="' + ph + '"></div>' : '';
    const f = !!p.favorite;
    const vb = p.verified ? '<span class="vb t">✓ ETKA</span>' : '<span class="vb f">⚠</span>';
    const cmp = pCompat(p); let ch = '';
    if (cmp) { const ic = cmp.cls === 'y' ? '✓' : cmp.cls === 'n' ? '✗' : '?'; ch = '<span class="cb ' + cmp.cls + '" title="' + escA(cmp.label) + '">' + ic + ' ' + cmp.pct + '%</span>'; }
    const st = p.status || '';
    const stBar = '<span class="cd-st-lb">Статус:</span>'
        + [['want', '🛒', 'Хочу'], ['bought', '📦', 'Купил'], ['installed', '✅', 'Поставил']]
            .map(([id, ic, lb]) => '<button class="tp' + (st === id ? ' on' : '') + '" data-action="set-status" data-status="' + id + '" data-id="' + escA(p.id) + '">' + ic + ' ' + lb + '</button>').join('');

    return '<div class="cd' + (f ? ' fav' : '') + '" data-id="' + escA(p.id) + '">'
        + '<div class="cd-top">'
        + '<h3 class="cd-nm">' + esc(p.name || '(без названия)') + '</h3>'
        + '<div class="cd-btns">'
        + '<button class="ctb sr' + (f ? ' on' : '') + '" data-action="favorite" title="Избранное">' + (f ? '★' : '☆') + '</button>'
        + '<button class="ctb" data-action="edit" title="Ред.">✎</button>'
        + '<button class="ctb dg" data-action="delete" title="Удалить">✕</button>'
        + '</div></div>'
        + '<div class="cd-meta">'
        + '<span class="cd-oem-v">' + (o ? esc(o) : '— без артикула —') + (o ? '<button class="cob" data-action="copy" data-oem="' + escA(o) + '" title="Копировать">📋</button>' : '') + '</span>'
        + vb + ch
        + '</div>'
        + '<div class="cd-meta cd-ans"><span class="cd-ans-lb">🔧 Аналоги:</span>' + anInline + '</div>'
        + '<div class="cd-purchase">' + getPurchaseHtml(p) + '</div>'
        + (o ? '<div class="cd-meta"><button class="bn" style="padding:4px 8px;font-size:.7rem" onclick="findCheaper(\'' + escA(o) + '\')" title="Открыть Exist + Autodoc + Avito">🔍 Найти дешевле</button></div>' : '')
        + lastLogBadge(o)
        + '<div class="cd-st">' + stBar + '</div>'
        + '<details class="cd-body"><summary>Подробности</summary><div class="cd-content">'
        + phh
        + '<div class="cd-sec"><div class="cd-s-t">🚗 Применимость</div>'
        + '<div class="rw"><span class="lb">Двигатели</span><div class="tgs">' + eng + '</div></div>'
        + '<div class="rw"><span class="lb">Кузова</span><div class="tgs">' + bdy + '</div></div>'
        + (trn ? '<div class="rw"><span class="lb">КПП</span><div class="tgs">' + trn + '</div></div>' : '')
        + (trm ? '<div class="rw"><span class="lb">Комплектации</span><div class="tgs">' + trm + '</div></div>' : '')
        + '<div class="rw"><span class="lb">Доноры</span><div class="tgs">' + dn + '</div></div>'
        + '</div>'
        + (ih ? '<div class="cd-sec"><div class="cd-s-t">📖 Инструкции (' + p.inst.length + ')</div>' + ih + '</div>' : '')
        + '<div class="cd-sec"><div class="cd-s-t">📝 Заметки</div>' + ntH + '</div>'
        + '</div></details>'
        + '</div>';
}
function oPC(id) {
  const p = D.find(x => x.id === id);
  if (!p) return;
  $('partmo_title').textContent = p.name || p.oem || 'Деталь';
  // Рендерим карточку без кнопок редактирования/удаления
  let html = cH(p);
  // Убираем кнопки ✎ и ✕ из верхнего правого угла
  html = html.replace(/<button class="ctb" data-action="edit"[^>]*>✎<\/button>/, '');
  html = html.replace(/<button class="ctb dg" data-action="delete"[^>]*>✕<\/button>/, '');
  // Снимаем фиксированную позицию — карточка внутри модалки
  html = html.replace('class="cd', 'class="cd" style="border:none;box-shadow:none" data-old');
  $('partmo_body').innerHTML = '<div style="margin:-4px">' + html + '</div>';
  // Автооткрываем "Подробности"
  const det = $('partmo_body').querySelector('.cd-body');
  if (det) det.setAttribute('open', '');
  openM('partmo');
}
const cPC = () => closeM('partmo');
function rSec(sid) {
    const ar = $('ca');
    const s = CUSTOM.sections[sid] || {};
    const rows = Array.isArray(s.rows) ? s.rows : [];
    let h = '<h2 class="sh">' + (s.icon || '📋') + ' ' + esc(s.label || sid) + '</h2>';
    h += '<div class="ri"><span class="chip">всего: <b>' + rows.length + '</b></span></div>';
    if (!rows.length) { h += '<div class="emp"><div class="empi">📋</div><p>Раздел пуст — заполни через импорт JSON.</p></div>'; ar.innerHTML = h; return; }
    const cols = s.cols || [];
    h += '<div style="overflow-x:auto;border-radius:6px"><table style="width:100%;border-collapse:collapse;font-size:.82rem;background:var(--cd);border:1px solid var(--bd)">';
    if (cols.length) h += '<thead><tr>' + cols.map(c => '<th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--a);background:var(--hv);font-size:.7rem;text-transform:uppercase;letter-spacing:.4px;color:var(--mu)">' + esc(c) + '</th>').join('') + '</tr></thead>';
    h += '<tbody>';
    for (const r of rows) {
        const cells = Array.isArray(r) ? r : cols.map(c => (r && r[c] != null) ? r[c] : '');
        h += '<tr>' + cells.map(c => '<td style="padding:7px 10px;border-bottom:1px solid var(--bd);vertical-align:top">' + esc(String(c == null ? '' : c)) + '</td>').join('') + '</tr>';
    }
    h += '</tbody></table></div>';
    ar.innerHTML = h;
}
function rET(parts) {
    const t = {};
    for (const p of parts) { const m = EK[p.cat] || { g: 'Прочее', s: 'Прочее' }; if (!t[m.g]) t[m.g] = {}; if (!t[m.g][m.s]) t[m.g][m.s] = []; t[m.g][m.s].push(p); }
    let h = '<div class="et">';
    for (const g of Object.keys(t).sort()) {
        const sg = t[g]; let tot = 0; for (const s of Object.keys(sg)) tot += sg[s].length;
        h += '<details open><summary>📁 ' + esc(g) + '<span class="gc">' + tot + '</span></summary>';
        for (const s of Object.keys(sg).sort()) {
            const a = sg[s];
            h += '<details open><summary style="font-size:.8rem;font-weight:600;color:var(--mu)">📂 ' + esc(s) + '<span class="gc">' + a.length + '</span></summary><div class="sg">';
            for (const p of a.slice().sort((x, y) => (x.oem || '').localeCompare(y.oem || ''))) {
                const w = p.verified ? '' : ' <span style="color:var(--wn);font-size:.68rem">⚠</span>';
                const cm = pCompat(p); let sm = '';
                if (cm) {
                    const col = cm.cls === 'y' ? 'var(--ok)' : cm.cls === 'n' ? 'var(--dg)' : 'var(--mu)';
                    const ic = cm.cls === 'y' ? '✓' : cm.cls === 'n' ? '✗' : '?';
                    sm = ' <span style="color:' + col + ';font-weight:700;font-size:.68rem">' + ic + cm.pct + '%</span>';
                }
                let pm = '';
                if (p.status === 'want') pm = ' 🛒';
                else if (p.status === 'bought') pm = ' 📦';
                else if (p.status === 'installed') pm = ' ✅';
                let nm = '';
                if (p.notes) nm = ' 📝';
                h += '<div class="ep" data-id="' + escA(p.id) + '"><span class="om">' + esc(p.oem || '—') + '</span><span class="nm">' + esc(p.name || '') + pm + nm + w + sm + '</span></div>';
            }
            h += '</div></details>';
        }
        h += '</details>';
    }
    return h + '</div>';
}
function toggleAllDetails() {
    const ar = $('ca');
    const anyOpen = ar.querySelector('.cd-body[open]');
    ar.querySelectorAll('.cd-body').forEach(d => { if (anyOpen) d.removeAttribute('open'); else d.setAttribute('open', ''); });
}
function rW() {
    const ar = $('ca');
    let h = '<h2 class="sh">🔧 Мастерские</h2>';
    h += '<div class="ri"><span class="chip">всего: <b>' + W.length + '</b></span><button class="bn p" onclick="oWM()" style="padding:4px 10px;font-size:.78rem">➕ Добавить</button></div>';
    if (!W.length) { h += '<div class="emp"><div class="empi">🔧</div><p><b>Список пуст</b></p><p>Сохраняйте проверенных мастеров.</p></div>'; ar.innerHTML = h; return; }
    h += '<div class="gr">'; for (const w of W) h += wH(w); h += '</div>';
    ar.innerHTML = h;
}
function wH(w) {
    const st = w.rating ? '<span class="wra">' + '★'.repeat(w.rating) + '☆'.repeat(5 - w.rating) + '</span>' : '';
    let l = '';
    if (w.phone) l += '<div class="wli"><span class="ic">📞</span><a href="tel:' + escA(w.phone.replace(/[^0-9+]/g, '')) + '">' + esc(w.phone) + '</a></div>';
    if (w.address) l += '<div class="wli"><span class="ic">📍</span>' + esc(w.address) + '</div>';
    if (w.spec) l += '<div class="wli"><span class="ic">🔧</span>' + esc(w.spec) + '</div>';
    if (st) l += '<div class="wli"><span class="ic">⭐</span>' + st + '</div>';
    const n = w.note ? '<div class="wnt">' + esc(w.note) + '</div>' : '';
    return '<div class="wc" data-wid="' + escA(w.id) + '"><div class="chr"><div class="wn">' + esc(w.name || '(без названия)') + '</div><div class="cto"><button class="ctb" data-wact="edit" title="Ред.">✎</button><button class="ctb dg" data-wact="delete" title="Удалить">✕</button></div></div>' + l + n + '</div>';
}

function cT(t, b) {
    const x = String(t || '');
    const done = () => { const o = b.textContent; b.textContent = '✓'; b.classList.add('ok'); setTimeout(() => { b.textContent = o; b.classList.remove('ok'); }, 1200); toast('Скопировано: ' + x, 'success'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(x).then(done).catch(() => fC(x, done)); else fC(x, done);
}
function fC(t, d) {
    try { const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); d && d(); } catch (e) { toast('Не удалось скопировать', 'danger'); }
}

function oCC(e) {
    const img = e.target.closest('[data-lightbox]'); if (img) { oL(img.dataset.lightbox); return; }
    const chip = e.target.closest('[data-chip]');
    if (chip) {
        const k = chip.dataset.chip;
        if (k === 'groupBySub') SV.groupBySub = !SV.groupBySub;
        else if (k === 'vinStrict') SV.vinStrictFilter = !SV.vinStrictFilter;
        sU(); rC();
        return;
    }
    if (e.target.classList && e.target.classList.contains('cn')) return;
    const wb = e.target.closest('[data-wact]');
    if (wb) { const c = wb.closest('.wc'); const id = c ? c.dataset.wid : null; if (!id) return; if (wb.dataset.wact === 'edit') oEMW(id); else dWsh(id); return; }
    const sb2 = e.target.closest('[data-action="set-status"]'); if (sb2) { e.stopPropagation(); sPS(sb2.dataset.id, sb2.dataset.status); return; }
    const ct = e.target.closest('[data-copy]'); if (ct && !ct.closest('.cto')) { e.stopPropagation(); cT(ct.dataset.copy, ct); return; }
    const b = e.target.closest('[data-action]');
    if (b) {
        const a = b.dataset.action; const c = b.closest('.cd'); const id = c ? c.dataset.id : null;
        if (a === 'copy') return cT(b.dataset.oem, b);
        if (a === 'favorite' && id) return tF(id);
        if (a === 'edit' && id) return oEM(id);
        if (a === 'delete' && id) return dPt(id);
    }
    const la = e.target.closest('[data-lac]');
    if (la) { const c = la.closest('.log-entry'); const id = c ? c.dataset.lid : null; if (!id) return; if (la.dataset.lac === 'edit') oLogEdit(id); else dLog(id); return; }
    const tp = e.target.closest('.ep'); if (tp && tp.dataset.id) oPC(tp.dataset.id);
}
function tF(id) { const p = D.find(x => x.id === id); if (!p) return; p.favorite = !p.favorite; if (useIDB) iPut(SP, p).catch(() => { }); else sD(); rSB(); rC(); toast(p.favorite ? '⭐ Добавлено' : 'Убрано'); }
function sPS(id, st) { const p = D.find(x => x.id === id); if (!p || !['want', 'bought', 'installed'].includes(st)) return; const same = p.status === st; p.status = same ? '' : st; useIDB ? iPut(SP, p).catch(() => { }) : sD(); rSB(); rC(); const L = { want: '🛒 Хочу', bought: '📦 Куплено', installed: '✅ Установлено' }; toast(same ? 'Статус снят' : L[st], same ? '' : 'success'); }
const oL = s => { $('lbi').src = s; $('lbt').classList.add('show'); };
const cL = () => { $('lbt').classList.remove('show'); $('lbi').src = ''; };

const fCS = () => $('f_cat').innerHTML = CATS.filter(c => c.id !== 'All').map(c => '<option value="' + c.id + '">' + c.icon + ' ' + esc(c.label) + '</option>').join('');
function aIR(t, x) {
    const ed = $('ie'), r = document.createElement('div');
    r.className = 'ier';
    r.innerHTML = '<select class="ity">' + Object.keys(IL).map(k => '<option value="' + MI[k] + '">' + IL[k] + '</option>').join('') + '</select>'
        + '<input type="text" class="itx" placeholder="Текст…"><button type="button" title="Удалить">×</button>';
    r.querySelector('select').value = MI[t] || 'proc';
    r.querySelector('input').value = x || '';
    r.querySelector('button').addEventListener('click', () => r.remove());
    ed.appendChild(r);
}
function rPH(h) {
    const g = $('phg'), l = $('phl');
    if (!h || !h.length) { g.style.display = 'none'; return; }
    g.style.display = '';
    l.innerHTML = h.slice().reverse().map(x => '<div class="phi"><span class="phd">' + esc(fD(x.ts)) + '</span><span class="php">' + esc(fP(x.price, x.currency)) + '</span></div>').join('');
}
function oAM() {
    edId = null; pPh = null; pPhCl = false;
    $('mt').textContent = 'Добавить деталь'; $('f_id').value = '';
    $('f_cat').value = (SV.activeCat !== 'All' && SV.activeCat !== 'Favorites' && SV.activeCat !== 'Workshops') ? SV.activeCat : 'Engine';
    ['f_name', 'f_oem', 'f_an', 'f_dn', 'f_pr', 'f_su', 'f_notes', 'f_eng', 'f_trn', 'f_bdy', 'f_trm'].forEach(id => $(id).value = '');
    $('f_ver').checked = false; $('f_cu').value = 'RUB'; $('f_sts').value = ''; $('f_fav').value = '0';
    $('ie').innerHTML = ''; aIR('proc', '');
    uPP(); rPH([]); $('mo').classList.add('show');
    setTimeout(() => $('f_name').focus(), 50);
}
function oEM(id) {
    const p = D.find(x => x.id === id); if (!p) return;
    edId = id; pPh = p.photo || null; pPhCl = false;
    $('mt').textContent = 'Редактировать: ' + (p.name || '');
    $('f_id').value = id; $('f_cat').value = p.cat || 'Engine'; $('f_name').value = p.name || ''; $('f_oem').value = p.oem || '';
    $('f_ver').checked = !!p.verified; $('f_an').value = (p.analogs || []).join(', '); $('f_dn').value = (p.donors || []).join(', ');
    $('f_eng').value = (p.engines || []).join(', '); $('f_trn').value = (p.transmissions || []).join(', ');
    $('f_bdy').value = (p.bodies || []).join(', '); $('f_trm').value = (p.trims || []).join(', ');
    $('f_pr').value = (p.price != null) ? p.price : ''; $('f_cu').value = p.currency || 'RUB';
    $('f_sts').value = p.status || ''; $('f_fav').value = p.favorite ? '1' : '0'; $('f_su').value = p.shopUrl || '';
    $('f_notes').value = p.notes || '';
    const ed = $('ie'); ed.innerHTML = '';
    if (p.inst && p.inst.length) p.inst.forEach(i => aIR(IM[i.type] || 'note', i.text)); else aIR('proc', '');
    rPH(p.priceHistory || []); uPP(); $('mo').classList.add('show'); setTimeout(() => $('f_name').focus(), 50);
}
const cM = () => { $('mo').classList.remove('show'); edId = null; pPh = null; pPhCl = false; };
function sPt() {
    const name = $('f_name').value.trim(), cat = $('f_cat').value;
    if (!name) { toast('Введите название', 'danger'); $('f_name').focus(); return; }
    const oem = $('f_oem').value.trim(), verified = $('f_ver').checked;
    const analogs = sl($('f_an').value), donors = sl($('f_dn').value);
    const engs = sl($('f_eng').value).map(s => s.toUpperCase()).filter(x => ENGINES[x]);
    const trns = sl($('f_trn').value).filter(x => TRANSMISSIONS[x]);
    const bdys = sl($('f_bdy').value).filter(x => BODIES[x]);
    const trms = sl($('f_trm').value).filter(x => TRIMS.includes(x));
    const prRaw = $('f_pr').value, price = prRaw === '' ? null : Number(prRaw);
    const currency = $('f_cu').value, status = $('f_sts').value;
    const favorite = $('f_fav').value === '1', shopUrl = sUrl($('f_su').value.trim());
    const notes = $('f_notes').value.trim();
    const inst = [];
    document.querySelectorAll('#ie .ier').forEach(r => { const t = r.querySelector('select').value, x = r.querySelector('input').value.trim(); if (x) inst.push({ type: t, text: x }); });
    const phF = pPhCl ? null : pPh;
    if (edId) {
        const i = D.findIndex(x => x.id === edId); if (i < 0) return;
        const o = D[i]; let h = Array.isArray(o.priceHistory) ? o.priceHistory.slice() : [];
        if (o.price !== price && price != null && !isNaN(price)) { h.push({ ts: Date.now(), price: Number(price), currency: currency || 'RUB' }); if (h.length > 50) h = h.slice(-50); }
        D[i] = Object.assign({}, o, { cat, sub: o.sub || '', name, oem, verified, analogs, donors, engines: engs, bodies: bdys, transmissions: trns, trims: trms, price, currency, status, favorite, notes, shopUrl, inst, photo: phF, priceHistory: h });
        if (useIDB) iPut(SP, D[i]).catch(() => { });
        toast('Сохранено', 'success');
    } else {
        const np = { id: uid(), cat, sub: '', name, oem, verified, analogs, donors, engines: engs, bodies: bdys, transmissions: trns, trims: trms, price, currency, status, favorite, notes, shopUrl, inst, photo: phF, priceHistory: [] };
        D.push(np); if (useIDB) iPut(SP, np).catch(() => { });
        toast('Добавлено', 'success');
    }
    if (!useIDB) sD();
    rSB(); rC(); cM();
}
function dPt(id) {
    const p = D.find(x => x.id === id); if (!p) return;
    if (!confirm('Удалить «' + (p.name || p.oem || 'без названия').replace(/["'«»]/g, '') + '»?')) return;
    const idx = D.findIndex(x => x.id === id);
    const saved = D[idx];
    D = D.filter(x => x.id !== id);
    useIDB ? iDel(SP, id).catch(() => { }) : sD();
    rSB(); rC();
    toastUndo('Удалено: ' + (saved.name || saved.oem || ''), () => {
        D.splice(idx, 0, saved);
        useIDB ? iPut(SP, saved).catch(() => { }) : sD();
        rSB(); rC();
        toast('Восстановлено', 'success');
    });
}
const sl = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean);

const oWM = () => { ewId = null; $('wmt').textContent = 'Добавить мастерскую';['w_id', 'w_name', 'w_ph', 'w_ad', 'w_sp', 'w_no'].forEach(id => $(id).value = ''); $('w_ra').value = '0'; $('wmo').classList.add('show'); setTimeout(() => $('w_name').focus(), 50); };
function oEMW(id) {
    const w = W.find(x => x.id === id); if (!w) return;
    ewId = id; $('wmt').textContent = 'Редактировать: ' + (w.name || '');
    $('w_id').value = id; $('w_name').value = w.name || ''; $('w_ph').value = w.phone || ''; $('w_ad').value = w.address || ''; $('w_sp').value = w.spec || ''; $('w_ra').value = String(w.rating || 0); $('w_no').value = w.note || '';
    $('wmo').classList.add('show'); setTimeout(() => $('w_name').focus(), 50);
}
const cWM = () => { $('wmo').classList.remove('show'); ewId = null; };
function sWsh() {
    const name = $('w_name').value.trim(); if (!name) { toast('Введите название', 'danger'); return; }
    const d = { name, phone: $('w_ph').value.trim(), address: $('w_ad').value.trim(), spec: $('w_sp').value.trim(), rating: Number($('w_ra').value) || 0, note: $('w_no').value.trim() };
    if (ewId) { const i = W.findIndex(x => x.id === ewId); if (i < 0) return; W[i] = Object.assign({}, W[i], d); if (useIDB) iPut(SW, W[i]).catch(() => { }); toast('Сохранено', 'success'); }
    else { const nw = nW(Object.assign({ id: uid() }, d)); W.push(nw); if (useIDB) iPut(SW, nw).catch(() => { }); toast('Добавлено', 'success'); }
    if (!useIDB) sWk(); rSB(); rW(); cWM();
}
function dWsh(id) {
    const w = W.find(x => x.id === id); if (!w) return;
    if (!confirm('Удалить «' + (w.name || '').replace(/["'«»]/g, '') + '»?')) return;
    W = W.filter(x => x.id !== id);
    useIDB ? iDel(SW, id).catch(() => { }) : sWk();
    rSB(); rW(); toast('Удалено', 'danger');
}

const pkP = () => $('pf').click();
const clP = () => { pPh = null; pPhCl = true; uPP(); };
function uPP() {
    const im = $('pp'), d = $('pcb'), cur = pPhCl ? null : pPh, s = sImg(cur);
    if (s) { im.src = s; im.style.display = 'block'; d.style.display = 'inline-flex'; }
    else { im.src = ''; im.style.display = 'none'; d.style.display = 'none'; }
}
async function oPF(e) {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return; if (!/^image\//.test(f.type)) { toast('Не изображение', 'danger'); return; }
    try { pPh = await cI(f, 500, .75); pPhCl = false; uPP(); } catch (err) { toast('Ошибка обработки', 'danger'); }
}
const cI = (f, ms, q) => new Promise((res, rej) => { const r = new FileReader(); r.onerror = rej; r.onload = e => { const im = new Image(); im.onerror = rej; im.onload = () => { const sc = Math.min(1, ms / Math.max(im.width, im.height)); const w = Math.max(1, Math.round(im.width * sc)), h = Math.max(1, Math.round(im.height * sc)); const c = document.createElement('canvas'); c.width = w; c.height = h; const cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(im, 0, 0, w, h); res(c.toDataURL('image/jpeg', q)); }; im.src = e.target.result; }; r.readAsDataURL(f); });

const oSM = () => { $('s_vk').value = vk || ''; $('smo').classList.add('show'); };
const cSM = () => { $('smo').classList.remove('show'); };
const sSet = () => { vk = $('s_vk').value.trim(); try { localStorage.setItem(VK, vk); } catch (e) { } toast('Сохранено', 'success'); cSM(); };

const cEM = () => $('em').classList.remove('show');
const tMMenu = e => { if (e) e.stopPropagation(); const m = $('em'); const em_t = $('em_theme'); if (em_t) em_t.textContent = (SV.theme === 'light' ? '🌙 Тёмная тема' : '☀️ Светлая тема'); m.classList.toggle('show'); };
function dl(f, c, m) { const b = new Blob([c], { type: m }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = f; document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(u); }, 100); }
function eD() {
    try {
        const p = { version: APP_VERSION, exportedAt: new Date().toISOString(), vehicle: 'VW Polo/Caddy 6N 1995-2003', author: USER.name || 'Guest', parts: D, workshops: W, garage: G, categories: CUSTOM.categories || [], sections: CUSTOM.sections || {} };
        dl('vw_polo_caddy_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(p, null, 2), 'application/json');
        toast('Экспорт: ' + D.length + ' поз., ' + W.length + ' СТО', 'success');
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}
const csvE = v => { if (v == null) return ''; const s = String(v); if (/[",\r\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'; return s; };
const statL = s => ({ want: 'Хочу купить', bought: 'Куплено', installed: 'Установлено' }[s] || '');
const catL = id => { const c = CATS.find(x => x.id === id); return c ? c.label : id; };
function eCSV(of) {
    try {
        const src = of ? D.filter(p => p.favorite) : D;
        if (!src.length) { toast('Нет данных', 'danger'); return; }
        const H = ['Категория', 'Название', 'OEM', 'Подтверждён', 'Двигатели', 'КПП', 'Кузова', 'Комплектации', 'Аналоги', 'Доноры', 'Цена', 'Валюта', 'Статус', 'Избранное', 'Магазин', 'Заметки'];
        const rows = src.map(p => [catL(p.cat), p.name || '', p.oem || '', p.verified ? 'Да' : '', (p.engines || []).join('; '), (p.transmissions || []).join('; '), (p.bodies || []).join('; '), (p.trims || []).join('; '), (p.analogs || []).join('; '), (p.donors || []).join('; '), p.price != null ? p.price : '', p.currency || '', statL(p.status), p.favorite ? 'Да' : '', p.shopUrl || '', p.notes || '']);
        const csv = '\ufeff' + [H, ...rows].map(r => r.map(csvE).join(',')).join('\r\n');
        dl((of ? 'favorites_' : 'parts_') + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
        toast('CSV: ' + src.length + ' строк', 'success');
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}
function eET() {
    try {
        if (!D.length) { toast('Нет данных', 'danger'); return; }
        const H = ['Группа', 'Подгруппа', 'Поз.', 'Номер', 'Наименование', 'Подтв.', 'Кол-во', 'Примечание'];
        const rows = [];
        const srt = D.slice().sort((a, b) => { const ga = (EK[a.cat] || {}).g || '', gb = (EK[b.cat] || {}).g || ''; if (ga !== gb) return ga.localeCompare(gb); return (a.oem || '').localeCompare(b.oem || ''); });
        let lg = '', ct = 0;
        for (const p of srt) { const m = EK[p.cat] || { g: 'Прочее', s: 'Прочее' }; if (m.g !== lg) { ct = 1; lg = m.g; } else ct++; const n = (p.inst || []).map(i => IL[IM[i.type] || 'n'] + ': ' + i.text).join(' | '); rows.push([m.g, m.s, String(ct).padStart(3, '0'), p.oem || '', p.name || '', p.verified ? 'Да' : '—', '1', n]); }
        const csv = '\ufeff' + [H, ...rows].map(r => r.map(csvE).join(',')).join('\r\n');
        dl('etka_' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
        toast('ETKA-CSV: ' + rows.length + ' строк', 'success');
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}
function eWCSV() {
    try {
        if (!W.length) { toast('Пусто', 'danger'); return; }
        const H = ['Название', 'Телефон', 'Адрес', 'Специализация', 'Рейтинг', 'Заметка'];
        const rows = W.map(w => [w.name, w.phone, w.address, w.spec, w.rating || '', w.note]);
        const csv = '\ufeff' + [H, ...rows].map(r => r.map(csvE).join(',')).join('\r\n');
        dl('workshops_' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
        toast('CSV мастерских готов', 'success');
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}
const tI = () => $('if').click();
function oIF(e) {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onerror = () => toast('Ошибка чтения', 'danger');
    r.onload = ev => {
        try {
            const p = JSON.parse(ev.target.result);
            const parts = Array.isArray(p) ? p : (p && Array.isArray(p.parts)) ? p.parts : null;
            if (!parts) throw new Error('Нет массива parts');
            if (!parts.length) throw new Error('Пустой массив');
            const ws = p && Array.isArray(p.workshops) ? p.workshops : null;
            const gs = p && Array.isArray(p.garage) ? p.garage : null;
            const meta = (p && typeof p === 'object') ? { categories: p.categories, sections: p.sections } : null;
            aI(parts, ws, gs, meta);
        } catch (err) { toast('Неверный JSON: ' + err.message, 'danger'); }
    };
    r.readAsText(f);
}
function aI(parts, ws, gs, meta) {
    const mode = prompt('Импортировать ' + parts.length + ' позиций.\n\n"replace" — заменить\n"merge" — добавить\n\n(Отмена)', 'merge');
    if (!mode) return;
    const m = mode.trim().toLowerCase();
    const cl = parts.map(nP).filter(Boolean);
    if (!cl.length) { toast('Нет валидных позиций', 'danger'); return; }
    if (m === 'replace') {
        if (!confirm('Заменить базу?')) return;
        D = cl;
        if (useIDB) iClr(SP).then(() => iMany(SP, D)).catch(() => { }); else sD();
        if (ws && ws.length) { W = ws.map(nW).filter(Boolean); if (useIDB) iClr(SW).then(() => iMany(SW, W)).catch(() => { }); else sWk(); }
        if (gs && gs.length) { G = gs.filter(x => x && x.vin).map(x => ({ id: x.id || ('g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)), vin: String(x.vin).toUpperCase(), brand: String(x.brand || ''), model: String(x.model || ''), year: x.year || null, body: String(x.body || ''), plant: String(x.plant || ''), engines: Array.isArray(x.engines) ? x.engines : [], addedAt: x.addedAt || Date.now() })); sG(); }
        toast('База заменена: ' + D.length + ' поз.', 'success');
    } else if (m === 'merge') {
        const seen = new Set(D.map(x => (x.oem || '') + '||' + (x.name || ''))); let add = 0;
        for (const p of cl) { const k = (p.oem || '') + '||' + (p.name || ''); if (!seen.has(k)) { D.push(p); seen.add(k); add++; } }
        if (useIDB) iMany(SP, D).catch(() => { }); else sD();
        if (ws && ws.length) { const wsn = new Set(W.map(w => w.name || '')); let wa = 0; for (const w of ws.map(nW).filter(Boolean)) { if (!wsn.has(w.name)) { W.push(w); wsn.add(w.name); wa++; } } if (useIDB) iMany(SW, W).catch(() => { }); else sWk(); toast('+' + add + ' поз., +' + wa + ' СТО', 'success'); }
        else toast('+' + add + ' из ' + cl.length, 'success');
        if (gs && gs.length) { const gsn = new Set(G.map(g => g.vin)); let ga = 0; for (const g of gs) { if (g && g.vin && !gsn.has(String(g.vin).toUpperCase())) { G.push({ id: g.id || ('g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)), vin: String(g.vin).toUpperCase(), brand: String(g.brand || ''), model: String(g.model || ''), year: g.year || null, body: String(g.body || ''), plant: String(g.plant || ''), engines: Array.isArray(g.engines) ? g.engines : [], addedAt: g.addedAt || Date.now() }); gsn.add(String(g.vin).toUpperCase()); ga++; } } if (ga) { sG(); toast('+' + ga + ' VIN', 'success'); } }
    } else { toast('Неизвестный режим', 'danger'); return; }
    if (meta && typeof meta === 'object') {
        if (Array.isArray(meta.categories)) {
            for (const c of meta.categories) {
                if (!c || !c.id) continue;
                const ex = CATS.find(x => x.id === c.id);
                if (ex) { ex.label = c.label || ex.label; ex.icon = c.icon || ex.icon; }
                else CATS.push({ id: c.id, label: c.label || c.id, icon: c.icon || '📁' });
            }
            CUSTOM.categories = (CUSTOM.categories || []).concat(meta.categories);
        }
        if (meta.sections && typeof meta.sections === 'object') {
            for (const sid of Object.keys(meta.sections)) {
                const s = meta.sections[sid]; if (!s) continue;
                CUSTOM.sections[sid] = Object.assign({}, CUSTOM.sections[sid] || {}, s);
                if (!CATS.find(x => x.id === sid)) CATS.push({ id: sid, label: s.label || sid, icon: s.icon || '📋' });
            }
        }
        sMeta();
    }
    rGar(); rSB(); rC();
}
/* ============ ЖУРНАЛ ============ */
function rLog() {
    const ar = $('ca');
    let h = '<h2 class="sh">📖 Журнал обслуживания</h2>';
    const av = gAV();
    h += '<div class="ri">';
    h += '<span class="chip">записей: <b>' + LOG.length + '</b></span>';
    if (av) h += '<span class="chip">VIN …' + esc(av.vin.slice(-6)) + '</span>';
    h += '<button class="bn p" onclick="oLogNew()" style="padding:4px 10px;font-size:.78rem">➕ Добавить запись</button>';
    h += '</div>';
    if (!LOG.length) {
        h += '<div class="emp"><div class="empi">📖</div><p><b>Журнал пуст</b></p><p>Фиксируй каждую работу — потом не вспомнишь, когда менял ГРМ.</p></div>';
        ar.innerHTML = h; return;
    }
    const srt = [...LOG].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.km || 0) - (a.km || 0));
    for (const e of srt) {
        h += '<div class="log-entry" data-lid="' + escA(e.id) + '" style="background:var(--cd);border:1px solid var(--bd);border-left:4px solid var(--a);border-radius:6px;padding:10px 12px;margin-bottom:8px">';
        h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px"><span style="font-family:Consolas,monospace;font-size:.72rem;color:var(--mu);font-weight:700">' + esc(e.date || '—') + '</span>';
        if (e.km) h += '<span style="font-size:.72rem;background:var(--hv);padding:1px 6px;border-radius:10px;color:var(--mu)">' + e.km.toLocaleString('ru-RU') + ' км</span>';
        h += '</div>';
        h += '<div style="font-weight:700;font-size:.92rem;color:var(--tx);margin:2px 0 6px">' + esc(e.title || '(без названия)') + '</div>';
        if (e.items && e.items.length) h += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px">' + e.items.map(it => '<span style="font-size:.68rem;background:rgba(0,176,240,.12);color:var(--a);padding:2px 6px;border-radius:3px;font-family:Consolas,monospace">' + esc(it) + '</span>').join('') + '</div>';
        h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.75rem;color:var(--mu);flex-wrap:wrap"><span>' + (e.shop ? esc(e.shop) : '') + '</span>';
        if (e.cost != null) h += '<span style="font-weight:700;color:var(--tx);font-size:.88rem">' + esc(fP(e.cost, e.currency || 'RUB')) + '</span>';
        h += '<span style="display:flex;gap:4px"><button class="ctb" data-lac="edit" title="Ред.">✎</button><button class="ctb dg" data-lac="del" title="Удалить">✕</button></span>';
        h += '</div>';
        if (e.notes) h += '<div style="font-size:.76rem;color:var(--mu);margin-top:6px;padding-top:6px;border-top:1px dashed var(--bd)">' + esc(e.notes) + '</div>';
        h += '</div>';
    }
    ar.innerHTML = h;
}
function oLogNew() {
    $('logmt').textContent = 'Новая запись';
    $('l_id').value = '';
    $('l_date').value = new Date().toISOString().slice(0, 10);
    $('l_km').value = TO.km || '';
    $('l_title').value = ''; $('l_items').value = ''; $('l_cost').value = ''; $('l_cur').value = 'RUB';
    $('l_shop').value = ''; $('l_notes').value = '';
    openM('logmo');
    setTimeout(() => $('l_title').focus(), 50);
}
function oLogEdit(id) {
    const e = LOG.find(x => x.id === id); if (!e) return;
    $('logmt').textContent = 'Редактирование';
    $('l_id').value = e.id;
    $('l_date').value = e.date || '';
    $('l_km').value = e.km || '';
    $('l_title').value = e.title || '';
    $('l_items').value = (e.items || []).join(', ');
    $('l_cost').value = e.cost != null ? e.cost : '';
    $('l_cur').value = e.currency || 'RUB';
    $('l_shop').value = e.shop || '';
    $('l_notes').value = e.notes || '';
    openM('logmo');
}
const cLog = () => closeM('logmo');
function sLog() {
    const title = $('l_title').value.trim();
    if (!title) { toast('Введите название', 'danger'); return; }
    const id = $('l_id').value;
    const rec = {
        id: id || ('l_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)),
        date: $('l_date').value || new Date().toISOString().slice(0, 10),
        km: $('l_km').value ? Number($('l_km').value) : null,
        title,
        items: sl($('l_items').value),
        cost: $('l_cost').value !== '' ? Number($('l_cost').value) : null,
        currency: $('l_cur').value || 'RUB',
        shop: $('l_shop').value.trim(),
        notes: $('l_notes').value.trim(),
        vin: gAV() ? gAV().vin : '',
        createdAt: Date.now()
    };
    if (id) { const i = LOG.findIndex(x => x.id === id); if (i >= 0) LOG[i] = rec; }
    else LOG.push(rec);
    useIDB ? iPut('logs', rec).catch(() => { }) : sLogs();
    if (!useIDB) sLogs();
    cLog(); rC(); toast(id ? 'Запись обновлена' : 'Запись добавлена', 'success');
}
function dLog(id) {
    if (!confirm('Удалить запись?')) return;
    LOG = LOG.filter(x => x.id !== id);
    useIDB ? iDel('logs', id).catch(() => { }) : sLogs();
    if (!useIDB) sLogs();
    rC(); toast('Удалено', 'danger');
}
function lastLogForOEM(oem) {
    if (!oem) return null;
    const arr = LOG.filter(e => (e.items || []).some(it => nz(it) === nz(oem)));
    if (!arr.length) return null;
    return arr.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
}
function lastLogBadge(oem) {
    if (!oem) return '';
    const l = lastLogForOEM(oem);
    if (!l) return '';
    return '<div class="cd-meta"><span class="hi" style="cursor:default" title="Последняя замена: ' + escA(l.title) + '">🔧 Меняли: ' + esc(l.date) + (l.km ? ' · ' + l.km.toLocaleString('ru-RU') + ' км' : '') + '</span></div>';
}

/* ============ КАЛЬКУЛЯТОР ТО ============ */
function nextTO() {
    if (TO.km == null || !TO.lastDate) return null;
    const last = new Date(TO.lastDate);
    if (isNaN(last.getTime())) return null;
    const interval = Number(TO.interval) || 15000;
    const monthlyKm = 1000;
    const monthsSince = Math.max(0, (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const kmSinceLast = monthsSince * monthlyKm;
    const kmToNext = Math.max(0, interval - kmSinceLast);
    const daysToNext = Math.round(kmToNext / monthlyKm * 30.44);
    return { interval, kmLeft: Math.round(kmToNext), daysLeft: daysToNext, lastDate: TO.lastDate };
}
function rTOWidget() {
    const chip = $('toChip'), lbl = $('toLbl');
    if (!chip || !lbl) return;
    const t = nextTO();
    if (!t) { lbl.textContent = 'Настроить ТО'; chip.title = 'Заполни пробег и дату последнего ТО'; return; }
    const urgent = t.daysLeft <= 7 || t.kmLeft <= 500;
    const warn = t.daysLeft <= 30 || t.kmLeft <= 2000;
    if (urgent) { chip.style.borderColor = 'var(--dg)'; chip.style.color = 'var(--dg)'; chip.style.background = 'rgba(220,53,69,.08)'; }
    else if (warn) { chip.style.borderColor = 'var(--sr)'; chip.style.color = 'var(--sr)'; chip.style.background = 'rgba(245,166,35,.08)'; }
    else { chip.style.borderColor = 'var(--ok)'; chip.style.color = 'var(--ok)'; chip.style.background = 'rgba(40,167,69,.08)'; }
    lbl.textContent = 'До ТО: ' + t.kmLeft.toLocaleString('ru-RU') + ' км / ' + t.daysLeft + ' дн.';
    chip.title = 'ТО каждые ' + t.interval.toLocaleString('ru-RU') + ' км. Клик для настроек.';
}
function oTO() {
    $('t_km').value = TO.km || '';
    $('t_date').value = TO.lastDate || '';
    $('t_interval').value = String(TO.interval || 15000);
    openM('tomo');
}
const cTO = () => closeM('tomo');
function resetTO() {
    if (!confirm('Сбросить настройки ТО? Виджет вернётся в состояние «Настроить».')) return;
    TO = { km: null, lastDate: null, interval: 15000 };
    try { localStorage.removeItem(TOKEY); } catch (e) { }
    cTO(); rTOWidget(); toast('Настройки ТО сброшены', 'danger');
}
function sTO() {
    TO.km = $('t_km').value !== '' ? Number($('t_km').value) : null;
    TO.lastDate = $('t_date').value || null;
    TO.interval = Number($('t_interval').value) || 15000;
    sTOStorage();
    cTO(); rTOWidget(); toast('Настройки ТО сохранены', 'success');
}

/* ============ СПИСОК ПОКУПОК НА ТО ============ */
let shopPick = new Set();
function oShopList() {
    shopPick = new Set();
    const t = nextTO();
    const candidates = D.filter(p => {
        if (p.cat === 'Maintenance') return false;
        return ['Engine', 'Fuel', 'Ignition', 'Cooling', 'Brakes', 'Suspension', 'Transmission', 'Fluids', 'Bulbs', 'Electrical', 'Heating'].includes(p.cat);
    });
    const byCat = {};
    for (const p of candidates) { if (!byCat[p.cat]) byCat[p.cat] = []; byCat[p.cat].push(p); }
    const ar = $('shopBody');
    let h = '';
    if (t) h += '<div style="padding:10px 12px;background:rgba(40,167,69,.08);border:1px solid var(--ok);border-radius:4px;font-size:.82rem;margin-bottom:12px">📅 Последнее ТО: <b>' + esc(t.lastDate) + '</b> · Следующее через <b>' + t.kmLeft.toLocaleString('ru-RU') + ' км</b> (~' + t.daysLeft + ' дн.)</div>';
    else h += '<div style="padding:10px 12px;background:rgba(245,166,35,.08);border:1px solid var(--sr);border-radius:4px;font-size:.82rem;margin-bottom:12px">⚠️ Настрой ТО в шапке (🛠) — расчёт будет точнее. Пока показываю всё по регламенту.</div>';
    h += '<p style="font-size:.82rem;color:var(--mu);margin-top:0">Отметь, что нужно купить. Итог суммируется внизу.</p>';
    const catLbl = { Engine: '⚙️ Двигатель / ГРМ', Fuel: '⛽ Топливная', Ignition: '🔥 Зажигание', Cooling: '❄️ Охлаждение', Brakes: '🛑 Тормоза', Suspension: '🛞 Подвеска', Transmission: '🔄 Трансмиссия', Fluids: '🛢️ Жидкости', Bulbs: '🔆 Лампы', Electrical: '💡 Электрика', Heating: '🌡️ Печка' };
    const catOrder = ['Fluids', 'Engine', 'Ignition', 'Fuel', 'Cooling', 'Brakes', 'Suspension', 'Transmission', 'Electrical', 'Heating', 'Bulbs'];
    for (const cat of catOrder) {
        if (!byCat[cat]) continue;
        h += '<div style="margin-top:14px"><div style="font-size:.85rem;font-weight:700;color:var(--tx);padding:6px 0;border-bottom:1px solid var(--bd);margin-bottom:6px">' + (catLbl[cat] || cat) + '</div>';
        for (const p of byCat[cat]) {
            h += '<label style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-bottom:1px solid var(--bd);cursor:pointer;transition:all .15s"><input type="checkbox" data-shop-id="' + escA(p.id) + '" style="margin-top:3px;flex-shrink:0;width:16px;height:16px;cursor:pointer"><div style="flex:1;min-width:0">';
            h += '<div style="font-weight:700;font-size:.85rem;color:var(--tx)">' + esc(p.name || '') + '</div>';
            if (p.oem) h += '<div style="font-family:Consolas,monospace;font-size:.7rem;color:var(--mu)">' + esc(p.oem) + '</div>';
            if (p.analogs && p.analogs.length) h += '<div style="font-size:.7rem;color:var(--mu);margin-top:2px">Аналоги: ' + esc(p.analogs.slice(0, 3).join(', ')) + '</div>';
            h += '</div></label>';
        }
        h += '</div>';
    }
    h += '<div id="shopTotal" style="padding:12px;background:var(--hv);border:1px solid var(--bd);border-radius:6px;font-weight:700;font-size:.92rem;text-align:right;margin-top:10px;color:var(--tx)">Выбрано: <b>0</b> позиций</div>';
    ar.innerHTML = h;
    ar.querySelectorAll('[data-shop-id]').forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) shopPick.add(cb.dataset.shopId); else shopPick.delete(cb.dataset.shopId);
            $('shopTotal').innerHTML = 'Выбрано: <b>' + shopPick.size + '</b> позиций';
        });
    });
    openM('shopmo');
}
const cShop = () => closeM('shopmo');
function pShop() {
    if (!shopPick.size) { toast('Ничего не выбрано', 'danger'); return; }
    const items = D.filter(p => shopPick.has(p.id));
    const css = '<style>body{font-family:Arial,sans-serif;padding:20px;color:#000}h1{font-size:18px;margin:0 0 12px}h2{font-size:14px;margin:18px 0 8px;color:#004b8f;border-bottom:1px solid #ccc;padding-bottom:3px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f0f0f0}@media print{@page{margin:15mm}}</style>';
    const w = window.open('', '_blank');
    let h = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Список покупок на ТО</title>' + css + '</head><' + 'body>';
    h += '<h1>Список покупок на ТО — VW Polo/Caddy 6N</h1>';
    h += '<p style="font-size:12px;color:#666">Дата: ' + new Date().toLocaleDateString('ru-RU') + (TO.km ? ' · Пробег: ' + TO.km.toLocaleString('ru-RU') + ' км' : '') + '</p>';
    const byCat = {};
    for (const p of items) { if (!byCat[p.cat]) byCat[p.cat] = []; byCat[p.cat].push(p); }
    for (const cat of Object.keys(byCat)) {
        h += '<h2>' + cat + '</h2><table><tr><th style="width:30px">OK</th><th style="width:150px">OEM</th><th>Наименование</th><th style="width:200px">Аналоги</th></tr>';
        for (const p of byCat[cat]) {
            h += '<tr><td></td><td>' + esc(p.oem || '—') + '</td><td>' + esc(p.name || '') + '</td><td style="font-size:11px">' + esc((p.analogs || []).slice(0, 3).join(', ')) + '</td></tr>';
        }
        h += '</table>';
    }
    h += '<p style="margin-top:20px;font-size:11px;color:#666">Всего: ' + items.length + ' позиций.</p>';
    h += '<' + 'script>window.onload=function(){setTimeout(function(){window.print()},300)}<' + '/script>';
    h += '<' + '/body>' + '<' + '/html>';
    w.document.write(h);
    w.document.close();
}
function eShopCSV() {
    if (!shopPick.size) { toast('Ничего не выбрано', 'danger'); return; }
    const items = D.filter(p => shopPick.has(p.id));
    const csvE = v => { if (v == null) return ''; const s = String(v); if (/[",\r\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'; return s; };
    const H = ['OEM', 'Название', 'Категория', 'Аналоги', 'Цена', 'Валюта', 'Заметки'];
    const rows = items.map(p => [p.oem || '', p.name || '', catL(p.cat), (p.analogs || []).join('; '), p.price != null ? p.price : '', p.currency || '', p.notes || '']);
    const csv = '\ufeff' + [H, ...rows].map(r => r.map(csvE).join(',')).join('\r\n');
    dl('to_shop_list_' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
    toast('CSV: ' + items.length + ' позиций', 'success');
}

/* ============ НАЙТИ ДЕШЕВЛЕ ============ */
function findCheaper(oem) {
    if (!oem) { toast('Нет артикула', 'danger'); return; }
    const c = String(oem).replace(/\s/g, '');
    ['https://www.exist.ru/Price/?pcode=' + c, 'https://www.autodoc.ru/price/0/' + c, 'https://www.avito.ru/rossiya/zapchasti_i_aksessuary?q=' + encodeURIComponent(oem)].forEach(u => window.open(u, '_blank', 'noopener'));
    toast('Открыто 3 магазина', 'success');
}
function iPWA() {
    try {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#001e50"/><text x="256" y="320" font-family="Arial" font-size="200" font-weight="bold" fill="#00b0f0" text-anchor="middle">VW</text></svg>';
        const ic = 'data:image/svg+xml;base64,' + btoa(svg);
        const mf = { name: 'VW Polo/Caddy 6N — База Мастера', short_name: 'Polo 6N', description: 'Каталог запчастей 1995-2003', start_url: location.href.split('#')[0], scope: '.', display: 'standalone', orientation: 'portrait-primary', background_color: '#0a1830', theme_color: '#0a1830', lang: 'ru', icons: [{ src: ic, sizes: '192x192', type: 'image/svg+xml', purpose: 'any' }, { src: ic, sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }] };
        const blob = new Blob([JSON.stringify(mf)], { type: 'application/manifest+json' });
        const url = URL.createObjectURL(blob);
        const l = document.createElement('link'); l.rel = 'manifest'; l.href = url; document.head.appendChild(l);
        const ai = document.createElement('link'); ai.rel = 'apple-touch-icon'; ai.href = ic; document.head.appendChild(ai);
        const fav = document.createElement('link'); fav.rel = 'icon'; fav.href = ic; document.head.appendChild(fav);
    } catch (e) { }
}

window.addEventListener('DOMContentLoaded', async () => {
    // 1. Подтягиваем актуальную версию с сервера
    try {
        const base = location.origin + location.pathname.replace(/[^/]*$/, '');
        const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
        if (r.ok) {
            const m = await r.json();
            if (m.appVersion) APP_VERSION = String(m.appVersion);
        }
    } catch (e) { }

    // 2. Подставляем версию во все места UI
    ['ver_gate', 'ver_footer', 'ver_about', 'ver_bug'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = APP_VERSION;
    });

    fCS();
    checkLicense();
    // Автопроверка "доступна новая версия" УБРАНА — она теперь не нужна
});() => {
    // Подставляем актуальную версию во все места UI
    ['ver_gate', 'ver_footer', 'ver_about', 'ver_bug'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = APP_VERSION;
    });
    fCS();
    checkLicense();

    // АВТОПРОВЕРКА ОБНОВЛЕНИЙ — через 2 секунды после старта
    setTimeout(async () => {
        try {
            const base = location.origin + location.pathname.replace(/[^/]*$/, '');
            const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
            if (!r.ok) return;
            const m = await r.json();
            if (m.appVersion && typeof APP_VERSION !== 'undefined' && m.appVersion !== APP_VERSION) {
                toast('📦 Доступна новая версия ' + m.appVersion, 'success');
            }
        } catch (e) { }
    
    });
}