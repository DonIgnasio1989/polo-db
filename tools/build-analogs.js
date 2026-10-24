#!/usr/bin/env node
/* ============================================================
   build-analogs.js — 1.9.0 «Аналоги»
   1. База знаний (KB) внешних кросс-номеров (проверено по
      drive2.ru, топ-аналоги, октябрь 2026) → data/analogs.json
   2. Транзитивное замыкание цепей аналогов по data/parts.full.json
      (union-find, санитария: узел = код ≥5 символов с цифрами —
      мусор вроде «USEDPART»/«KOLBENSCHMIDT» без цифр исключается)
   3. Физическая пропись в детали → restore/parts.with-analogs.json
      (можно залить на сервер как data/parts.json)
   4. Отчёт → restore/ANALOGS-REPORT.md
   Запуск: node tools/build-analogs.js  (из папки vw-polo-app)
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

/* ============ БАЗА ЗНАНИЙ (внешние кроссы, требуют проверки голосами) ============
   Ключ — нормализованный OEM (без пробелов, A-Z0-9).
   Значения — «Бренд Код» в стиле поля `a` основной базы.
   Источник: кросс-листы drive2.ru (топ-6 по отзывам) + цепочки замен VAG.
   Спорные/непроверенные НЕ добавлялись (лучше меньше, да точнее). */
const KB = {
    /* Масляный фильтр 1.7/1.9 SDI */
    '030115561C': ['056 115 561 G', 'PURFLUX LS702', 'FRAM PH2870A', 'STP S0561'],
    /* Салонный фильтр-элемент (Golf IV/Octavia; стоит и в базе Polo) */
    '1J0819644A': ['MANN CUK 2862', 'MAHLE LAK 63', 'FILTRON K 1047A', 'BOSCH 1 987 432 300', '1J0 819 644'],
    /* Топливные фильтры (бензин) */
    '6N0201511':  ['MANN WK 613', 'FILTRON PP 831', '6N0 201 511 A', '6X0 201 511 B'],
    '6N0201511A': ['MANN WK 613', 'FILTRON PP 831', 'FRAM G6400', 'PURFLUX EP139', '6N0 201 511', '6X0 201 511 B'],
    '6X0201511B': ['MANN WK 613', 'FILTRON PP 831', 'FRAM G6400', '6N0 201 511 A'],
    /* Топливный фильтр (дизель 1.9 D/SDI, Felicia/T4) */
    '6N0127401C': ['191 127 247 A', 'KOLBENSCHMIDT 50013182', 'PURFLUX FCS412', 'FRAM P5328', 'PATRON PF3056'],
    /* Воздушный фильтр-элемент 1.0/1.4 (Polo 6N) */
    '032129620':  ['FILTRON AR 201', 'FRAM CA3333', 'KOLBENSCHMIDT 50013077', '056 129 620'],
    /* Помпы ОЖ */
    '030121008C': ['INA 530 0165 30', '030 121 008 D', '030 121 008 J'],
    '030121008D': ['INA 530 0165 30', '030 121 008 C', '030 121 008 J'],
    '036121005S': ['GMB GWVW-13A', 'DOLZ A191', 'KORTEX KPW0064', '036 121 008 M'],
    /* Амортизаторы передние (варианты по шасси + Economy) */
    '6N0413031J': ['MONROE 11202', 'TRW JHM185T', 'FENOX A51010', '1H0 413 031 L', '6N0 413 031'],
    '6N0413031H': ['6N0 413 031', '6N0 413 031 J', '1H0 413 031 L', 'MONROE 11202'],
    'JZW413031D': ['6N0 413 031', '6N0 413 031 J'],
    /* Амортизаторы задние */
    '6N0513031H': ['6N0 513 031', '6N0 513 031 L'],
    '6N0513031T': ['6N0 513 031', '6N0 513 031 L'],
    'JZW513025Q': ['6N0 513 031', '6N0 513 031 L'],
    /* Диски тормозные передние 256×20 (AFH/AHS) */
    '6N0615301D': ['BREMBO 09.5166.14', 'ATE 24.0120-0128.1', 'TRW DF1533', 'REMSA 6175.10', '321 615 301 D'],
    /* Economy-диск 239×18 = базовый вентилируемый */
    'JZW615301L': ['6N0 615 301 C'],
    /* Диски тормозные задние 232×9 */
    '6N0615601A': ['ATE 24.0109-0124.1', 'TRW DF4062', 'A.B.S. 17192', 'MAXGEAR 19-1185'],
    /* Колодки задние дисковые Economy */
    'JZW698451B': ['1H0 698 451 G'],
    /* Стойки стабилизатора 18/20-22 мм (взаимозаменяемы по кроссам) */
    '6N0411315C': ['TRW JTS397', 'TRW JTS398', '6N0 411 315 D', 'FIRST LINE FDL7288', 'OPTIMAL G7-686'],
    '6N0411315D': ['TRW JTS397', 'TRW JTS398', '6N0 411 315 C', 'FIRST LINE FDL7288', 'OPTIMAL G7-686'],
    /* Опора амортизаторной стойки (кроссы drive2) */
    '6N0412331A': ['1J0 412 249', '357 412 331 A', '7M0 412 331', '6R0 412 249'],
    /* Отбойник и пыльник амортизатора */
    '1H0412303B': ['LEMFÖRDER 21112 01'],
    '357413175A': ['PATRON PSE6119'],
    /* Поликлиновой ремень (без кондиционера) = 6PK1070 */
    '030145933T': ['6PK1070', 'KAVO DMV-6527', '030 145 933 R'],
    /* Комплекты сцепления (цепочка замен VAG + бюджетные линии) */
    '030198141BX': ['032 198 141 X', '030 141 025 R', 'KAMOKA KC005', 'METACO 5500055'],
    '030198141AX': ['030 198 141 BX', '032 198 141 X'],
    '032198141X':  ['030 198 141 BX', '030 198 141 AX'],
    '028198141DX': ['030 198 141 BX', '030 198 141 AX'],
    /* Ступица задняя в сборе (рядный подшипник) */
    '6X0598477':  ['FAG 713 610 320', 'SNR R154.45', 'HK 5007', 'KORTEX KHB4227STD'],
};

/* ============ УТИЛИТЫ ============ */
const normOem = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
/* 1.10.6: правило приведено в точности к anCodeOk из js/app.js — иначе
   экспорт (restore/parts.with-analogs.json) и рантайм (applyAnalogKb)
   начинают расходиться. Строки вроде «Universeel 10.9» или «Universeel М12»
   раньше считались кодами и склеивали в одну компоненту несвязанные детали
   (43 ложных аналога в 15 записях). Правило «≥3 цифр» НЕ вводили: оно
   отсекло бы настоящие артикулы MAHLE LAK 63, GMB GWVW-13A, NGK BKR6E. */
const AN_JUNK_RE = /\b(universeel|universal|used\s*part|repro|refurbished)\b/i;
const codeOk = s => {
    const raw = String(s || '');
    if (/[а-яА-ЯёЁ]/.test(raw)) return false;
    if (AN_JUNK_RE.test(raw)) return false;
    const n = normOem(raw);
    return n.length >= 5 && /[0-9]/.test(n);
};
const oemSegs = o => String(o || '').split('·').map(s => normOem(s)).filter(codeOk);

function main() {
    const partsPath = path.join(ROOT, 'data', 'parts.full.json');
    const raw = JSON.parse(fs.readFileSync(partsPath, 'utf8'));
    console.log('Позиций в базе:', raw.length);

    /* --- 1. Граф: сегменты OEM ↔ аналоги ↔ KB (union-find) --- */
    const parent = {};
    const addNode = x => { if (!(x in parent)) parent[x] = x; };
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
    const disp = {};     // узел → отображаемая строка (приоритет: аналоги базы → KB → сегмент)
    const dispDb = {};   // узел известен как аналог из базы
    const segDisp = {};  // узел → сырой сегмент OEM
    const kbNodes = {};  // узлы, введённые базой знаний

    let junkSkipped = 0;
    raw.forEach(p => {
        const o = String(p.o || p.oem || '');
        String(o).split('·').forEach(seg => { const n = normOem(seg); if (n && !segDisp[n]) segDisp[n] = seg.trim(); });
        const segs = oemSegs(o);
        segs.forEach(s => { addNode(s); });
        (Array.isArray(p.a) ? p.a : (p.analogs || [])).forEach(a => {
            if (!codeOk(a)) { junkSkipped++; return; }
            const n = normOem(a);
            addNode(n);
            if (!dispDb[n]) { disp[n] = String(a).trim(); dispDb[n] = 1; }
            segs.forEach(s => uni(s, n));
        });
    });

    const kbKeysInDb = {}, kbKeysMissing = [];
    Object.keys(KB).forEach(k => {
        const nk = normOem(String(k).replace(/^\s*VAG\s+/i, ''));
        (KB[k] || []).forEach(code => {
            const nc = normOem(String(code).replace(/^\s*VAG\s+/i, ''));
            if (!codeOk(nc)) return;
            addNode(nk); addNode(nc);
            if (!disp[nc]) disp[nc] = String(code).trim();
            kbNodes[nc] = 1; kbNodes[nk] = 1;
            uni(nk, nc);
        });
        if (segDisp[nk]) kbKeysInDb[nk] = segDisp[nk]; else kbKeysMissing.push(nk);
    });

    /* --- 2. Компоненты --- */
    const comps = {};
    Object.keys(parent).forEach(n => { const r = find(n); (comps[r] = comps[r] || []).push(n); });
    const sizes = Object.values(comps).map(c => c.length).sort((a, b) => b - a);
    const AN_MAX = 32;
    const bigComps = Object.values(comps).filter(c => c.length > AN_MAX);

    /* --- 3. Слияние в позиции (физическая пропись) --- */
    let addedChain = 0, addedKb = 0, partsTouched = 0;
    const out = raw.map(p => {
        const q = Object.assign({}, p);
        const own = new Set(oemSegs(String(q.o || q.oem || '')));
        const arr = (Array.isArray(q.a) ? q.a : (q.analogs || [])).map(String);
        const have = new Set(arr.map(normOem).filter(Boolean));
        const roots = new Set();
        own.forEach(s => { if (parent[s]) roots.add(find(s)); });
        arr.forEach(a => { const n = normOem(a); if (codeOk(n) && parent[n]) roots.add(find(n)); });
        let touched = false;
        roots.forEach(r => {
            const comp = comps[r] || [];
            if (comp.length > AN_MAX) return;
            comp.forEach(n => {
                if (own.has(n) || have.has(n)) return;
                const d = dispDb[n] ? disp[n] : (disp[n] || segDisp[n] || n);
                arr.push(d); have.add(n); touched = true;
                if (kbNodes[n] && !dispDb[n] && !segDisp[n]) addedKb++; else addedChain++;
            });
        });
        if (touched) {
            partsTouched++;
            /* Сырой формат базы — поле `a` (как в data-src). Если строка пришла
               в нормализованном виде (analogs) — унифицируем в `a`. */
            q.a = arr;
            delete q.analogs;
        }
        return q;
    });

    /* --- 4. Запись файлов --- */
    const dataDir = path.join(ROOT, 'data'), restoreDir = path.join(ROOT, 'restore');
    if (!fs.existsSync(restoreDir)) fs.mkdirSync(restoreDir, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);

    const analogsJson = {
        v: 1,
        updated: today,
        source: 'Кросс-листы drive2.ru (топ-6 по отзывам) + цепочки замен VAG. Проверяйте применимость и голосуйте 👍/👎 в карточке детали.',
        kb: KB
    };
    fs.writeFileSync(path.join(dataDir, 'analogs.json'), JSON.stringify(analogsJson, null, 1));
    fs.writeFileSync(path.join(restoreDir, 'parts.with-analogs.json'), JSON.stringify(out));

    const withA = out.filter(p => (p.a || p.analogs || []).length).length;
    const totalCodes = out.reduce((s, p) => s + (p.a || p.analogs || []).length, 0);
    const report = [
        '# Отчёт: аналоги v1.9.0 (' + today + ')',
        '',
        '| Метрика | Значение |',
        '|---|---|',
        '| Позиций в базе | ' + raw.length + ' |',
        '| Было с аналогами | ' + raw.filter(p => (p.a || []).length).length + ' |',
        '| Стало с аналогами | ' + withA + ' |',
        '| Всего кодов-аналогов | ' + totalCodes + ' |',
        '| Узлов в графе кроссов | ' + sizes.reduce((s, x) => s + x, 0) + ' |',
        '| Компонент связности | ' + sizes.length + ' (макс. размер ' + sizes[0] + ') |',
        '| Компонент больше порога ' + AN_MAX + ' (не слиты) | ' + bigComps.length + ' |',
        '| Мусорных строк без цифр пропущено | ' + junkSkipped + ' |',
        '| Ключей KB | ' + Object.keys(KB).length + ' (в базе: ' + Object.keys(kbKeysInDb).length + ', мимо: ' + kbKeysMissing.length + ') |',
        '| Добавлено цепочкой (🔗) | ' + addedChain + ' |',
        '| Добавлено из KB (❓) | ' + addedKb + ' |',
        '| Позиций затронуто | ' + partsTouched + ' |',
        '',
        kbKeysMissing.length ? '## Ключи KB, не найденные в базе\n' + kbKeysMissing.map(k => '- ' + k).join('\n') + '\n' : '',
        '## Файлы',
        '- `data/analogs.json` — лёгкий файл KB для приложения (мёржится в рантайме)',
        '- `restore/parts.with-analogs.json` — физически прописанные аналоги (для загрузки на сервер как data/parts.json)',
        ''
    ].filter(x => x !== '').join('\n');
    fs.writeFileSync(path.join(restoreDir, 'ANALOGS-REPORT.md'), report);

    console.log('---');
    console.log('Было с аналогами:', raw.filter(p => (p.a || []).length).length, '→ стало:', withA);
    console.log('Добавлено: цепочкой', addedChain, '+ KB', addedKb, '| затронуто позиций:', partsTouched);
    console.log('Компонент:', sizes.length, '| макс. размер:', sizes[0], '| пропущено больших:', bigComps.length);
    console.log('KB ключей:', Object.keys(KB).length, '| в базе:', Object.keys(kbKeysInDb).length, '| мимо:', kbKeysMissing.join(',') || 'нет');
    console.log('Записано: data/analogs.json, restore/parts.with-analogs.json, restore/ANALOGS-REPORT.md');
}

main();
