/* ============================================================
   Тесты чистых функций js/cloud.js (мержи, ники, diff каталога).
   Запуск:  node test/cloud.test.js
   Не требуют браузера и Supabase — только Node.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ── Шимы браузерного окружения ── */
const store = {};
global.window = global;
global.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
};
global.document = {
    getElementById: () => null,
    createElement: () => ({ style: {}, classList: { add() { }, remove() { } }, setAttribute() { } }),
    head: { appendChild() { } },
    body: { classList: { add() { }, remove() { } } },
    querySelector: () => null
};
global.navigator = { onLine: true };
global.confirm = () => true;
global.addEventListener = () => { };

/* ── Глобальные переменные app.js, которые трогает cloud.js ── */
global.G = [];
global.D = [];
global.W = [];
global.LOG = [];
global.TO_ALL = {};
global.SHOP_ALL = {};
global.USER = { name: '', email: '', city: '', initials: '', color: '#00b0f0' };
global.CUSTOM = { categories: [], sections: {} };
global.SV = { activeVinId: null };

/* ── Загружаем cloud.js в глобальный контекст ── */
const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'cloud.js'), 'utf8');
vm.runInThisContext(code, { filename: 'cloud.js' });

const I = window.Cloud._internal;

/* ── Мини-фреймворк ── */
let pass = 0, fail = 0;
function t(name, fn) {
    try { fn(); pass++; console.log('  ✓ ' + name); }
    catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + (e && e.message || e)); }
}
const eq = (a, b, m) => {
    const x = JSON.stringify(a), y = JSON.stringify(b);
    if (x !== y) throw new Error((m || '') + ' ожидалось ' + y + ', получено ' + x);
};
const ok = (v, m) => { if (!v) throw new Error(m || 'ожидалось truthy'); };

console.log('\n=== cloud.js: merge-функции ===');

t('mergeGarage: объединение по id, локальный приоритет', () => {
    const local = [{ id: 'g1', vin: 'AAA', engineCode: 'LOK' }];
    const server = [{ id: 'g1', vin: 'AAA', engineCode: 'SRV' }, { id: 'g2', vin: 'BBB' }];
    const m = I.mergeGarage(local, server);
    eq(m.length, 2);
    eq(m.find(x => x.id === 'g1').engineCode, 'LOK');
    ok(m.some(x => x.id === 'g2'));
});

t('mergeGarage: мусор на входе не роняет', () => {
    eq(I.mergeGarage(null, undefined).length, 0);
    eq(I.mergeGarage([{ id: 'a' }], 'oops').length, 1);
});

t('mergeTo: по VIN — побеждает запись с большим пробегом/свежей датой', () => {
    const local = { 'VIN1': { km: 200000, lastDate: '2026-01-01', interval: 15000 } };
    const server = {
        'VIN1': { km: 195000, lastDate: '2025-06-01', interval: 15000 },
        'VIN2': { km: 100, lastDate: null, interval: 15000 }
    };
    const m = I.mergeTo(local, server);
    eq(m['VIN1'].km, 200000);
    eq(m['VIN2'].km, 100);
});

t('mergeLogs: объединение по id + сортировка по дате', () => {
    const local = [{ id: 'l2', date: '2026-02-02', title: 'B' }];
    const server = [{ id: 'l1', date: '2026-01-01', title: 'A' }, { id: 'l2', date: '2026-02-02', title: 'B-old' }];
    const m = I.mergeLogs(local, server);
    eq(m.length, 2);
    eq(m[0].id, 'l1');
    eq(m[1].title, 'B');   // локальная версия свежее
});

t('mergeShop: объединение отметок по каждому VIN', () => {
    const m = I.mergeShop({ 'V1': ['a', 'b'] }, { 'V1': ['b', 'c'], 'V2': ['x'] });
    eq(m['V1'].slice().sort(), ['a', 'b', 'c']);
    eq(m['V2'], ['x']);
});

t('mergePrivate: сервер свежее и локально чисто → сервер целиком', () => {
    const s = [{ id: 'srv' }], l = [{ id: 'loc' }];
    eq(I.mergePrivate('garage', l, s, true, false), s);
});
t('mergePrivate: локально грязно, сервер не новее → локальные', () => {
    const s = [{ id: 'srv' }], l = [{ id: 'loc' }];
    eq(I.mergePrivate('garage', l, s, false, true), l);
});
t('mergePrivate: оба изменились → поэлементный мерж (garage)', () => {
    const m = I.mergePrivate('garage', [{ id: 'l' }], [{ id: 's' }], true, true);
    eq(m.length, 2);
});
t('mergePrivate: pflags — локальный приоритет по ключам', () => {
    const m = I.mergePrivate('pflags', { k1: { s: 'loc' } }, { k1: { s: 'srv' }, k2: { s: 'srv2' } }, true, true);
    eq(m.k1.s, 'loc');
    eq(m.k2.s, 'srv2');
});

console.log('\n=== cloud.js: ники и конфиг ===');

t('validNick: правила ника', () => {
    ok(I.validNick('ignat_6n'));
    ok(I.validNick('A.B-C_1'));
    ok(!I.validNick('иван'));            // кириллица — нет
    ok(!I.validNick('ab'));               // короче 3
    ok(!I.validNick('a'.repeat(25)));     // длиннее 24
    ok(!I.validNick('ni k'));             // пробел
});

t('nickEmail: ник → псевдо-email', () => {
    eq(I.nickEmail(' Ignat_6N '), 'ignat_6n@users.baza-mastera.app');
});

t('configured(): без конфига — false, с LS-конфигом — true', () => {
    eq(I.configured(), false);
    store['vw_cloud_cfg'] = JSON.stringify({ url: 'https://x.supabase.co', anonKey: 'k' });
    eq(I.configured(), true);
    eq(I.cfg().url, 'https://x.supabase.co');
    delete store['vw_cloud_cfg'];
});

console.log('\n=== cloud.js: diff каталога ===');

t('computePartsDiff: свои позиции vs правки серверных', () => {
    /* «серверный каталог»: одна позиция (ключ oem|name), pristine-поля пустые */
    store['vw_cloud_srvpk_v1'] = JSON.stringify({ '030115561a|фильтр масляный': {} });
    global.D = [
        { id: 'p1', oem: '030115561A', name: 'Фильтр масляный', notes: 'ставить с прокладкой', price: 900, currency: 'RUB', shopUrl: '', photos: [], priceHistory: [], status: 'bought', favorite: true },
        { id: 'p2', oem: 'X000', name: 'Моя деталь', notes: '', price: null, photos: [], status: '', favorite: false }
    ];
    const diff = I.computePartsDiff();
    eq(diff.customs.length, 1, 'customs:');
    eq(diff.customs[0].id, 'p2');
    const ov = diff.overrides['030115561a|фильтр масляный'];
    ok(ov, 'override существует');
    eq(ov.notes, 'ставить с прокладкой');
    eq(ov.price, 900);
    ok(!('status' in ov) && !('favorite' in ov), 'личные status/favorite не уезжают в общий override');
    delete store['vw_cloud_srvpk_v1'];
});

t('computePartsDiff: пустые правки не создают override', () => {
    store['vw_cloud_srvpk_v1'] = JSON.stringify({ 'a|b': {} });
    global.D = [{ id: 'p1', oem: 'A', name: 'B', notes: '', price: null, shopUrl: '', photos: [], priceHistory: [], status: '', favorite: false }];
    eq(Object.keys(I.computePartsDiff().overrides).length, 0);
    delete store['vw_cloud_srvpk_v1'];
    global.D = [];
});

t('computeMetaRows: серверный раздел — только label/icon/parent', () => {
    store['vw_cloud_srvsids_v1'] = JSON.stringify(['Engines']);
    global.CUSTOM = {
        categories: [{ id: 'MyCat', label: 'Моя', icon: '📁' }],
        sections: {
            'Engines': { label: 'Моторы v2', icon: '⚙️', rows: [{ huge: 'server-rows' }], cols: ['a'] },
            'MySec': { label: 'Мой раздел', rows: [{ x: 1 }] }
        }
    };
    const rows = I.computeMetaRows();
    const eng = rows.find(r => r.key === 'sec:Engines');
    ok(eng && !eng.data.rows, 'rows серверного раздела не синхронизируются');
    eq(eng.data.label, 'Моторы v2');
    const my = rows.find(r => r.key === 'sec:MySec');
    ok(my && my.data.rows, 'пользовательский раздел — целиком');
    ok(rows.some(r => r.key === 'categories'));
    delete store['vw_cloud_srvsids_v1'];
    global.CUSTOM = { categories: [], sections: {} };
});

t('markDirty без входа — безопасный no-op', () => {
    window.Cloud.markDirty('garage');   // не должно бросать
    ok(true);
});

console.log('\n──────────────────────────────');
console.log('  пройдено: ' + pass + ', провалено: ' + fail);
console.log('──────────────────────────────\n');
process.exit(fail ? 1 : 0);
