#!/usr/bin/env node
/* ============================================================
   tools/migrate-1.13.0.js — каталог по реальному логу VCDS
   ------------------------------------------------------------
   Запускать ПОСЛЕ tools/migrate-1.10.6.js и tools/migrate-1.12.1.js
   (на чистом data-src — подряд: 1.10.6, 1.12.1, 1.13.0). Идемпотентна.

   Повод: владелец прислал лог сканера — uploads/Log2-М271МН62.txt
   (VCDS RUS 21.9.0.6, съём 2025-12-04, госномер М271МН62, VIN блок не отдал).
   Разбор: tools/vcds_log.py, отчёт restore/VCDS-LOG-ANALYSIS.md.

   Правила:
     V1  в каталог добавлены позиции, которых в нём не было, но которые
         видны в логе как «номер детали блока управления»:
         · 1J0 907 379 G — электронный блок ABS (ATE ABS 20 IE CAN);
         · 6K0 906 027 E — ЭБУ двигателя Bosch Motronic MP 9.0.
     V2  614 117 — это ГИДРАВЛИЧЕСКИЙ блок, а 907 379 — ЭЛЕКТРОННЫЙ.
         В карточках 6N0 614 117 A/B/C названия остались прежними
         (переименование осиротило бы записи в IndexedDB у пользователей),
         но добавлено пояснение и предупреждение про спорную карточку
         1H0 937 503 «Блок управления ABS».
     V3  добавлена карточка выключателя стоп-сигнала семейства
         1J0 945 511 (он же F / F116 / F117 для ABS 20 IE). Номер детали
         взят НЕ из ETKA — поэтому карточка описывает семейство и прямо
         требует сверки по VIN.

   Источники (проверено 2026-10-24):
     · лог владельца (фикстура tests/fixtures/vcds-sample/Log2-sample.txt) —
       номера блоков, компоненты, коды и статусы ошибок;
     · forums.ross-tech.com/index.php?threads/53057 — Golf IV (1999):
       «ABS pump: 1J0 614 117 C; ABS module: 1J0 907 379 G» — т.е. 614 117
       это гидравлика, 907 379 — электронный блок ATE ABS 20 IE;
     · essexrecons.com (Volkswagen — ABS ECU module ATE MK20) — 1J0 907 379 Q/R
       входят в семейство электронных блоков ATE MK20;
     · ecuscb.com (Bosch MP9.0, 0 261 204 593 = 6K0 906 027 E) и carlabimmo.com
       (в базе Bosch MP9.0 номер 6K0 906 027 E указан для VW Polo III (6N) 1.4,
       60 л.с.) — соответствие ECU ↔ мотор;
     · car.gr (каталог б/у): «SEAT CORDOBA IBIZA INCA VW POLO CADDY 1.4
       6K0906027E» — та же деталь на платформе 6K;
     · vwts.ru/forum/topic/43450 — выключатель стоп-сигнала Golf 4:
       старый образец 191 945 515, новый 1J0 945 511 D (подтверждает семейство,
       НЕ подтверждает применимость к 6N — поэтому в карточке ⚠);
     · таблица elaborator-кодов VAG — gerritspeek.nl/vag-com_foutcodeslijst-en.html;
       приоритеты — ross-tech.com/vcds/tour/dtc_screen.html.

   Чего здесь НЕТ намеренно:
     · не меняются названия существующих записей (ключ слияния = oem + name);
     · не проставляется поле `sup` — направление суперсессии можно определить
       только по ETKA, а дампа нет;
     · не утверждается, какой именно мотор стоит на машине М271МН62 —
       соответствие «6K0 906 027 E ↔ 1.4 60 л.с.» дано по базе ECU как ⚠.

   Лог: restore/DATA-FIXES-1.13.0.md + restore/data-fixes-1.13.0.json
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data-src');
const OUT = path.join(ROOT, 'restore');
const DRY = process.argv.includes('--dry');

const appSrc = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
const IM = Object.fromEntries([...((appSrc.match(/const IM = \{([^}]*)\}/) || [, ''])[1]).matchAll(/(\w+):\s*'(\w)'/g)].map(m => [m[1], m[2]]));

const oemOf = r => String(r.o || r.oem || '').trim();
const isNew = r => ('n' in r) || ('o' in r) || ('i' in r);
const log = [];
const add = (file, idx, oem, rule, text) => log.push({ file, idx, oem, rule, text });

function pushInst(r, type, text) {
    text = String(text || '').trim();
    if (!text) return false;
    const list = isNew(r) ? (r.i = r.i || []) : (r.inst = r.inst || []);
    const has = list.some(x => {
        const t = Array.isArray(x) ? String(x[1] || '') : String((x && x.text) || '');
        return t.trim() === text || (text.length > 40 && t.includes(text.slice(0, 40)));
    });
    if (has) return false;
    if (isNew(r)) list.push([IM[type] || 'n', text]);
    else list.push({ type, text });
    return true;
}

/* --------------------------------------------------------------- карточки --
   Формат записи — «новый» (o/n/i/a/d/engines/bodies), как в data-src.
   v: 1 = значение подтверждено источником (здесь источник — сам лог блока). */
const CARD_ABS_ECU = {
    cat: 'Brakes', sub: 'ABS',
    o: '1J0 907 379 G',
    n: 'Блок управления ABS электронный (ATE ABS 20 IE CAN, ставится на гидроблок)',
    v: 1,
    a: ['1J0 907 379 (семейство, буква = версия)'],
    d: ['VW Polo 6N2', 'VW Golf IV', 'VW Bora'],
    gens: ['6N2'], bodies: ['3d', '5d', 'classic', 'estate'],
    i: [
        ['s', 'Компонент по логу блока: «ABS 20 IE CAN 0001». Электронный блок крепится к гидравлическому (гидроблок — семейство 614 117, у Golf IV с этим блоком идёт 1J0 614 117 C; номер гидроблока для 6N — сверить по VIN в ETKA).'],
        ['w', 'Номер детали и буква версии зависят от года и оснащения — заказывать строго по VIN. Семейство 1J0 907 379 x встречается и как ATE MK20 (в т.ч. Q/R) — это не взаимозаменяемые исполнения.'],
        ['w', 'После замены обязательны кодирование блока и базовая установка (VCDS: 03 → 07 — кодирование, 03 → 04 — базовая установка). Б/у блок с чужой кодировкой без адаптации оставляет лампу ABS.'],
        ['n', 'Источник маркировок VCDS для этого блока существует: в логе владельца — «RUS\\1J0-907-37x-ABS.clb». У блока 01-Двигатель того же авто маркировки не нашлись («Перенаправление неудачно») — описания двигателя сканер берёт из общей базы и может ошибаться.'],
        ['n', 'Коды этого блока из реального лога (Polo 6N, госномер М271МН62, съём 2025-12-04): 00283 (впускной/выпускной клапан контура заднего левого тормоза, N139), 00288 (датчик давления F116 / датчик предупреждения F117 — выключатель педали тормоза), 00272 (выпускной клапан контура заднего правого тормоза, N135). Все — непостоянные.'],
        ['w', 'Код 00288 зависит от блока: в 03-ABS это выключатель педали тормоза (F116/F117), а в 25-Иммобилайзер / 46-Комфорт тот же номер означает актуатор блокировки рулевой колонки (N360). Искать расшифровку только по своему блоку.'],
    ],
};

const CARD_ENGINE_ECU = {
    cat: 'Engine', sub: 'Воздух и топливо',
    o: '6K0 906 027 E',
    n: 'ЭБУ двигателя Bosch Motronic MP 9.0 (0 261 204 593)',
    v: 1,
    a: ['Bosch 0 261 204 593'],
    d: ['VW Polo 6N/6N2', 'Seat Ibiza (6K)', 'Seat Cordoba (6K)', 'Seat Inca (6K)', 'VW Caddy (9K)'],
    gens: ['6N1', '6N2'],
    i: [
        ['s', 'По логу блока: компонент «MOTRONIC MP 9.0», код ПО 0261204593 (S023), рабочий код 1037357494, VCID 2E523624EA1744F9E7-4BB0.'],
        ['w', '⚠ В базах ECU (ecuscb.com, carlabimmo.com) номер 6K0 906 027 E / Bosch 0 261 204 593 значится для VW Polo III (6N) 1.4, 60 л.с., и для Seat Cordoba/Ibiza/Inca 1.4. Словарь моторов приложения при этом относит AEX/AKV к Siemens Simos 2P: значит, на части машин 1.4 60 л.с. стоит MP 9.0, а на части — Simos 2P (или словарь неполон). Перед заказом — сверка по VIN в ETKA.'],
        ['w', 'Замена ЭБУ — с привязкой иммобилайзера (адаптация к приборной панели), иначе мотор заводится и глохнет. Новая деталь у VW по этому номеру — редкость, рынок в основном б/у.'],
        ['n', 'У этого блока строка VIN в логе VCDS оказалась пустой: машиной помечен только госномер. Для 6N это типично — VIN по K-линии отдают не все блоки.'],
        ['n', 'Ошибки блока из реального лога: 00561 «Адаптация смеси» (статус 13-00 — предел адаптации (Mul) не достигнут), 00528 «Датчик высоты» (F96, статус 11-00 — предел регулирования не достигнут), 01072 «Вакуумный клапан привода сцепления» (N183, статус 20-10 — сбой в базовой установке, непостоянная). Готовность (readiness) — «не доступна»: блок не EOBD.'],
    ],
};

const CARD_BRAKE_SWITCH = {
    cat: 'Controls', sub: 'Выключатель',
    o: '1J0 945 511',
    n: 'Выключатель стоп-сигнала (семейство, он же F / F116 / F117 для ABS 20 IE)',
    v: 0,
    a: ['1J0 945 511 D', '1J0 945 511 B'],
    d: ['VW Polo 6N2', 'VW Golf IV'],
    gens: ['6N2'], bodies: ['3d', '5d', 'classic', 'estate'],
    i: [
        ['w', '⚠ Номер детали в этой карточке НЕ подтверждён ETKA — он взят из открытых источников как «новый образец» выключателя педали тормоза для платформы Golf IV (vwts.ru/forum/topic/43450, drive2.ru). На Polo 6N/6N2 в зависимости от года может стоять другой номер; в каталоге уже есть карточка 1H0 945 515 A «Выключатель стоп-сигнала (лягушка)». Точный номер — только по VIN.'],
        ['s', 'Выключатель многоконтактный: один контакт идёт на стоп-сигналы (F), другие — на блок ABS и на ЭБУ двигателя (в логах и схемах обозначаются F116/F117). Поэтому отказ одной «лягушки» даёт ошибки сразу в нескольких блоках.'],
        ['n', 'В присланном логе на Polo 6N код 00288 (датчик давления F116 / датчик предупреждения F117) записан трижды с разными статусами — 35-10, 16-10, 04-10, все непостоянные. Такой «букет» по одному компоненту чаще даёт сам выключатель или его разъём/педаль, а не гидроблок.'],
        ['p', 'Проверка без снятия: при нажатой педали стоп-сигналы должны загораться мгновенно и гаснуть без задержки; в VCDS — блок 03, группа измерений с состоянием выключателей педали. Замена: ставить при полностью отпущенной педали, шток выключателя сам выставляется по месту (не контрить «с усилием»).'],
        ['w', 'Не путать с кодом 00526 (Brake Light Switch (F): Circuit Malfunction) — это ошибка цепи выключателя стоп-сигнала в более новых блоках, и с 00288 в блоке 25/46 (там это актуатор блокировки рулевой колонки N360).'],
    ],
};

/* Пояснения к существующим карточкам (названия НЕ меняем). */
const HYDRAULIC_NOTE = [
    ['6N0 614 117 A', [
        ['s', '614 117 — это ГИДРАВЛИЧЕСКИЙ блок (в номенклатуре VW «ABS pump» / гидроблок); ЭЛЕКТРОННЫЙ блок — семейство 907 379 (у Golf IV с ATE ABS 20 IE это 1J0 907 379 x, в каталоге — карточка 1J0 907 379 G). Источник: forums.ross-tech.com/index.php?threads/53057 («ABS pump: 1J0 614 117 C; ABS module: 1J0 907 379 G»).'],
        ['w', 'В карточке поле «аналоги» содержит «6N0 614 117» — это не аналог, а базовый номер того же гидроблока.'],
    ]],
    ['6N0 614 117 B', [
        ['w', '⚠ Название говорит «Блок управления ABS», но 614 117 по номенклатуре VW — ГИДРАВЛИЧЕСКИЙ блок (электронный блок — 907 379). Название оставлено как есть: переименование создало бы «сироту» в IndexedDB у тех, кто уже загрузил базу. Источники: forums.ross-tech.com/index.php?threads/53057, essexrecons.com (ATE MK20 — 1J0 907 379 Q/R).'],
    ]],
    ['6N0 614 117 C', [
        ['w', '⚠ Как и у 6N0 614 117 B: 614 117 — гидравлический блок, электронный — 907 379. Ограничение по моторам (AFH/AHS) взято из выгрузки ETKA и не перепроверялось.'],
    ]],
    ['1H0 937 503', [
        ['w', '⚠ Спорная карточка: название «Блок управления ABS», а номер 1H0 937 503 относится к группе 937 — жгуты/разъёмы/реле, не к блокам ABS (те идут как 614 117 — гидроблок и 907 379 — электронный блок). Вероятно, при выгрузке из HTML название «уехало» из соседней строки. Не заказывать по этому номеру блок ABS; запись оставлена до сверки с ETKA — удаление осиротило бы её у пользователей.'],
    ]],
    ['1H0 945 515 A', [
        ['n', 'На Polo 6N2 / Golf IV с ABS ATE 20 IE выключатель педали тормоза для блока ABS обозначается F / F116 / F117, и там встречается «новый образец» — семейство 1J0 945 511 (см. карточку в категории Controls). Какой номер стоит на конкретной машине — по VIN в ETKA.'],
    ]],
];

function migrate(file, arr) {
    /* V2: пояснения к существующим карточкам */
    arr.forEach((r, idx) => {
        const o = oemOf(r);
        const hit = HYDRAULIC_NOTE.find(x => x[0] === o);
        if (!hit) return;
        for (const [type, text] of hit[1]) {
            if (pushInst(r, type, text)) add(file, idx, o, 'V2', 'пояснение (' + type + '): ' + text.slice(0, 90) + '…');
        }
    });

    /* V1 / V3: новые карточки — только в целевые файлы, только если их ещё нет */
    /* Порядок ключей в записи должен быть детерминированным: иначе
       data/parts.json, собранный «с нуля» и собранный после повторного
       прогона миграции по уже модифицированному data-src, совпадает
       по содержимому, но расходится побайтово (доп. поля gens/bodies
       дописываются в конец объекта). Собираем запись по фиксированному
       порядку — как в остальных файлах data-src. */
    const KEY_ORDER = ['cat', 'sub', 'o', 'n', 'v', 'a', 'd', 'engines',
        'bodies', 'transmissions', 'transCodes', 'gens', 'trims', 'sup', 'i'];
    const canon = r => {
        const out = {};
        for (const k of KEY_ORDER) if (k in r) out[k] = r[k];
        for (const k of Object.keys(r)) if (!(k in out)) out[k] = r[k];
        return out;
    };
    const push = (target, card, rule) => {
        if (file !== target) return;
        const idx = arr.findIndex(r => oemOf(r) === card.o);
        if (idx >= 0) {
            /* карточка уже есть (повторный запуск): доносим поля применимости,
               чтобы миграция оставалась идемпотентной и после правок ниже */
            let n = 0;
            for (const k of ['gens', 'bodies', 'engines', 'd', 'a', 'cat', 'sub']) {
                if (!card[k]) continue;
                const have = arr[idx][k];
                const want = Array.isArray(card[k]) ? card[k] : [card[k]];
                if (!Array.isArray(have)) {
                    if (JSON.stringify(have) !== JSON.stringify(card[k])) {
                        arr[idx][k] = card[k]; n++;
                    }
                    continue;
                }
                const merged = have.concat(want.filter(x => !have.includes(x)));
                if (merged.length !== have.length) { arr[idx][k] = merged; n++; }
            }
            if (n) add(file, idx, card.o, rule, 'дополнена применимость существующей карточки');
            /* канонический порядок ключей — всегда, иначе запись, созданная
               более ранним прогоном миграции, так и осталась бы с gens/bodies
               в конце объекта и data/parts.json не совпадал бы побайтово
               со сборкой «с нуля» */
            const c = canon(arr[idx]);
            if (JSON.stringify(c) !== JSON.stringify(arr[idx])) arr[idx] = c;
            return;
        }
        arr.push(canon(card));
        add(file, arr.length - 1, card.o, rule, 'добавлена карточка «' + card.n + '»');
    };
    push('parts-13-brakes-wheels-detailed.json', CARD_ABS_ECU, 'V1');
    push('parts-01-engine-fuel-ignition.json', CARD_ENGINE_ECU, 'V1');
    push('parts-05-rear-axle-controls.json', CARD_BRAKE_SWITCH, 'V3');
}

const files = fs.readdirSync(SRC).filter(f => /^parts-.*\.json$/.test(f)).sort();
let touchedFiles = 0, touchedRecs = 0;
const perRule = {};
for (const f of files) {
    const p = path.join(SRC, f);
    const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
    const before = log.length;
    migrate(f, arr);
    const mine = log.slice(before);
    if (!mine.length) continue;
    touchedFiles++;
    touchedRecs += new Set(mine.map(x => x.idx)).size;
    mine.forEach(x => { perRule[x.rule] = (perRule[x.rule] || 0) + 1; });
    if (!DRY) fs.writeFileSync(p, JSON.stringify(arr, null, 2).replace(/\n/g, '\r\n'), 'utf8');
}

if (!DRY && !fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const md = [
    '# Обогащение каталога 1.13.0 (tools/migrate-1.13.0.js)', '',
    'Дата: ' + new Date().toISOString().slice(0, 10) + (DRY ? ' · **dry-run**' : ''), '',
    'Повод: реальный лог VCDS владельца (`uploads/Log2-М271МН62.txt`,',
    'фикстура `tests/fixtures/vcds-sample/Log2-sample.txt`), разбор — `tools/vcds_log.py`,',
    'отчёт — `restore/VCDS-LOG-ANALYSIS.md`.', '',
    '| Правило | Что делает | Правок |', '|---|---|---|',
    '| V1 | добавлены блоки управления, которых не было в каталоге (1J0 907 379 G, 6K0 906 027 E) | ' + (perRule.V1 || 0) + ' |',
    '| V2 | 614 117 = гидроблок, 907 379 = электронный блок: пояснения в существующие карточки | ' + (perRule.V2 || 0) + ' |',
    '| V3 | выключатель стоп-сигнала семейства 1J0 945 511 (F/F116/F117) | ' + (perRule.V3 || 0) + ' |',
    '', 'Файлов изменено: **' + touchedFiles + '** · записей: **' + touchedRecs + '** · правок: **' + log.length + '**', '',
    '## Источники', '',
    '- Лог VCDS владельца — номера блоков, компоненты, коды и статусы ошибок (первоисточник).',
    '- forums.ross-tech.com/index.php?threads/53057 — «ABS pump: 1J0 614 117 C; ABS module: 1J0 907 379 G» (Golf IV, 1999).',
    '- essexrecons.com, «Volkswagen — ABS ECU module ATE MK20» — 1J0 907 379 Q/R в семействе электронных блоков ATE MK20.',
    '- ecuscb.com (Bosch MP9.0, 0 261 204 593 = 6K0 906 027 E), carlabimmo.com (6K0 906 027 E ↔ VW Polo III (6N) 1.4, 60 л.с.), car.gr (6K0906027E ↔ Seat Cordoba/Ibiza/Inca, VW Polo/Caddy 1.4).',
    '- vwts.ru/forum/topic/43450 — выключатель стоп-сигнала Golf 4: старый 191 945 515, новый 1J0 945 511 D. Применимость к 6N НЕ подтверждена — в карточке стоит ⚠.',
    '- Таблица elaborator-кодов VAG: gerritspeek.nl/vag-com_foutcodeslijst-en.html. Приоритеты неисправности: ross-tech.com/vcds/tour/dtc_screen.html.',
    '- Код 00288 в блоках 25/46 — актуатор блокировки рулевой колонки N360: wiki.ross-tech.com/index.php/00288.',
    '- Код 00561 (Адаптация смеси: предел (Add) превышен — симптомы/причины/решения): wiki.ross-tech.com/index.php/00561.',
    '- Код 00283 на современных VAG — датчик частоты вращения переднего левого колеса G47, а не клапан: wiki.ross-tech.com/index.php/00283 (пример того, что один номер означает разное в разных блоках).', '',
    '## Что намеренно НЕ менялось', '',
    '- Названия существующих записей (ключ слияния в приложении — `oem + name`; переименование создаёт «сирот» в IndexedDB).',
    '- Поле `sup`: направление суперсессии определяется только по ETKA, дампа нет.',
    '- Утверждение о моторе машины М271МН62: соответствие «6K0 906 027 E ↔ 1.4 60 л.с.» взято из базы ECU и помечено ⚠, а не записано как факт.', '',
    '## Детализация', ''
];
const byFile = {};
log.forEach(x => { (byFile[x.file] = byFile[x.file] || []).push(x); });
Object.keys(byFile).sort().forEach(f => {
    md.push('### ' + f); md.push('');
    byFile[f].forEach(x => md.push('- `#' + x.idx + '` **' + x.rule + '** `' + (x.oem || '—') + '` — ' + x.text));
    md.push('');
});
/* H4 (аудит 2026-10-27): миграция идемпотентна — на уже мигрированном data-src
   она делает 0 правок. Раньше отчёты перезаписывались безусловно, и повторный
   прогон (а «памятка» предписывает гонять миграции подряд каждый релиз) стирал
   историю: data-fixes-*.json обнулялся, DATA-FIXES-*.md сжимался в ~70 раз.
   Теперь нулевой прогон пишет отдельный *.noop.md и историю не трогает. */
if (!DRY && !touchedRecs && !log.length) {
    fs.writeFileSync(path.join(OUT, 'DATA-FIXES-1.13.0.noop.md'), md.join('\n'), 'utf8');
    console.log('правок не было (data-src уже мигрирован) — история НЕ перезаписана;');
    console.log('   просмотрочный отчёт: restore/DATA-FIXES-1.13.0.noop.md');
} else if (!DRY) {
    fs.writeFileSync(path.join(OUT, 'DATA-FIXES-1.13.0.md'), md.join('\n'), 'utf8');
    fs.writeFileSync(path.join(OUT, 'data-fixes-1.13.0.json'), JSON.stringify({ generated: new Date().toISOString(), perRule, touchedFiles, touchedRecs, log }, null, 1), 'utf8');
}
console.log((DRY ? '[dry] ' : '') + 'файлов: ' + touchedFiles + ' · записей: ' + touchedRecs + ' · правок: ' + log.length);
console.log('по правилам:', JSON.stringify(perRule));
