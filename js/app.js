/* ============================================================
   VW Polo/Caddy 6N — База Мастера · app.js
   ============================================================ */

/* ============ СПРАВОЧНИКИ ============ */
const BASE_CATS = [
    { id: 'All', label: 'Все системы', icon: '📦' },

    // ─── Сервис ──────────────────────────────
    { id: 'Maintenance', label: 'Регламент ТО', icon: '🔧' },
    { id: 'RoadKit', label: 'С собой в дорогу', icon: '🎒' },

    // ─── Силовой агрегат ─────────────────────
    { id: 'Engine', label: 'Двигатель', icon: '⚙️' },
    { id: 'Cooling', label: 'Охлаждение', icon: '❄️', parent: 'Engine' },
    { id: 'Ignition', label: 'Зажигание', icon: '🔥', parent: 'Engine' },
    { id: 'Fuel', label: 'Топливная система', icon: '⛽' },
    { id: 'Exhaust', label: 'Выпуск ОГ', icon: '💨', parent: 'Fuel' },
    { id: 'Transmission', label: 'Трансмиссия', icon: '🔄' },

    // ─── Ходовая часть ───────────────────────
    { id: 'Suspension', label: 'Подвеска', icon: '🌀' },
    { id: 'Steering', label: 'Рулевое управление', icon: '⎈', parent: 'Suspension' },
    { id: 'Brakes', label: 'Тормозная система', icon: '🛑' },
    { id: 'RearAxle', label: 'Задняя ось', icon: '🔗' },
    { id: 'Controls', label: 'Приводы управления', icon: '🎛️' },

    // ─── Кузов и салон ───────────────────────
    { id: 'Body', label: 'Кузов', icon: '🚗' },
    { id: 'Interior', label: 'Салон', icon: '🪑' },

    // ─── Электрика и климат ──────────────────
    { id: 'Electrical', label: 'Электрика', icon: '⚡' },
    { id: 'Bulbs', label: 'Освещение', icon: '💡', parent: 'Electrical' },
    { id: 'Heating', label: 'Отопление / Климат', icon: '🌡️' },

    // ─── Расходники ──────────────────────────
    { id: 'Fluids', label: 'Жидкости', icon: '🛢️' },
    { id: 'Tires', label: 'Шины и давление', icon: '🛞' }
];
let CATS = BASE_CATS.slice();

/* Поля мотора:
   v   — рабочий объём / исполнение,
   hp  — мощность, л.с.,
   f   — топливо (P бензин / D дизель),
   inj — тип впрыска (MPI / SDI / TDI / механический ТНВД),
   ecu — блок управления (только достоверно известные),
   euro — экокласс (цифра; пусто = нет достоверных данных).
   ⚠ Исправлено в 1.8.0: ASV — это 1.9 TDI 110 л.с. (был ошибочно SDI). */
const ENGINES = {
    'AER': { v: '1.0', hp: 50, f: 'P', inj: 'MPI' }, 'ALL': { v: '1.0', hp: 50, f: 'P', inj: 'MPI' }, 'AEV': { v: '1.0', hp: 50, f: 'P', inj: 'MPI' },
    'ALD': { v: '1.0', hp: 50, f: 'P', inj: 'MPI' }, 'ANV': { v: '1.0', hp: 50, f: 'P', inj: 'MPI' }, 'AUC': { v: '1.0', hp: 50, f: 'P', inj: 'MPI' },
    'AEX': { v: '1.4', hp: 60, f: 'P', inj: 'MPI', ecu: 'Siemens Simos 2P', euro: '2' },
    'APQ': { v: '1.4', hp: 60, f: 'P', inj: 'MPI', ecu: 'Siemens Simos 2P', euro: '2' },
    'AKV': { v: '1.4', hp: 60, f: 'P', inj: 'MPI', ecu: 'Siemens Simos 2P', euro: '2' },
    'ANX': { v: '1.4', hp: 60, f: 'P', inj: 'MPI', ecu: 'Siemens Simos 2P', euro: '2' },
    'AKK': { v: '1.4', hp: 60, f: 'P', inj: 'MPI', ecu: 'Siemens Simos 2P', euro: '2' },
    'ANW': { v: '1.4', hp: 60, f: 'P', inj: 'MPI', ecu: 'Siemens Simos 2P', euro: '2' },
    'AUD': { v: '1.4', hp: 60, f: 'P', inj: 'MPI', ecu: 'Siemens Simos 2P', euro: '2' },
    'APE': { v: '1.4 16V', hp: 75, f: 'P', inj: 'MPI' }, 'AUA': { v: '1.4 16V', hp: 75, f: 'P', inj: 'MPI' },
    'AEE': { v: '1.6', hp: 75, f: 'P', inj: 'MPI', euro: '2' }, 'ALM': { v: '1.6', hp: 75, f: 'P', inj: 'MPI', euro: '2' },
    'AUR': { v: '1.6', hp: 75, f: 'P', inj: 'MPI', euro: '2' },
    'AFT': { v: '1.6', hp: 100, f: 'P', inj: 'MPI', euro: '2' },
    '1F': { v: '1.6', hp: 75, f: 'P', inj: 'MPI', ecu: 'Bosch Digifant' },
    'ADZ': { v: '1.8', hp: 90, f: 'P', inj: 'MPI', ecu: 'Bosch Digifant' },
    'AKW': { v: '1.7 SDI', hp: 60, f: 'D', inj: 'SDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'AHB': { v: '1.7 SDI', hp: 60, f: 'D', inj: 'SDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'AEY': { v: '1.9 SDI', hp: 64, f: 'D', inj: 'SDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'AGP': { v: '1.9 D', hp: 68, f: 'D', inj: 'D (мех. ТНВД)' },
    'AQM': { v: '1.9 SDI', hp: 68, f: 'D', inj: 'SDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'AYQ': { v: '1.9 SDI', hp: 64, f: 'D', inj: 'SDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'ASV': { v: '1.9 TDI', hp: 110, f: 'D', inj: 'TDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    '1Y': { v: '1.9 D', hp: 64, f: 'D', inj: 'D (мех. ТНВД)' },
    'AFN': { v: '1.9 TDI', hp: 110, f: 'D', inj: 'TDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'AHU': { v: '1.9 TDI', hp: 90, f: 'D', inj: 'TDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'ALE': { v: '1.9 TDI', hp: 90, f: 'D', inj: 'TDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'AGR': { v: '1.9 TDI', hp: 90, f: 'D', inj: 'TDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'ALH': { v: '1.9 TDI', hp: 90, f: 'D', inj: 'TDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'ADX': { v: '1.3', hp: 55, f: 'P', inj: 'MPI' }, 'AEA': { v: '1.6', hp: 75, f: 'P', inj: 'MPI', euro: '2' },
    'AHS': { v: '1.6', hp: 75, f: 'P', inj: 'MPI', euro: '2' },
    'AFH': { v: '1.4 16V', hp: 100, f: 'P', inj: 'MPI' }, 'AJV': { v: '1.6 16V', hp: 120, f: 'P', inj: 'MPI' },
    'AHW': { v: '1.4 16V', hp: 75, f: 'P', inj: 'MPI' },
    'AKL': { v: '1.6', hp: 100, f: 'P', inj: 'MPI', euro: '2' }, 'AHT': { v: '1.4', hp: 75, f: 'P', inj: 'MPI', euro: '2' },
    'ABU': { v: '1.4', hp: 60, f: 'P', inj: 'MPI' },
    'AKQ': { v: '1.4 16V', hp: 75, f: 'P', inj: 'MPI' }, 'AFK': { v: '1.4 16V', hp: 75, f: 'P', inj: 'MPI' },
    'ANM': { v: '1.4 16V', hp: 75, f: 'P', inj: 'MPI' },
    'AKU': { v: '1.7 SDI', hp: 57, f: 'D', inj: 'SDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'AHG': { v: '1.7 SDI', hp: 57, f: 'D', inj: 'SDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'AGD': { v: '1.9 SDI', hp: 64, f: 'D', inj: 'SDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    'AEF': { v: '1.9 SDI', hp: 64, f: 'D', inj: 'SDI', ecu: 'Bosch EDC (ТНВД VE)', euro: '2' },
    /* Коды семейства SEAT/R3, встречаются в каталоге доноров и 6N2:
       AKP 1.4 8V 60, AHV 1.6 8V 75, AMF 1.4 TDI R3 75 — сверены по кросс-справочникам */
    'AKP': { v: '1.4', hp: 60, f: 'P', inj: 'MPI', ecu: 'Siemens Simos 2P', euro: '2' },
    'AHV': { v: '1.6', hp: 75, f: 'P', inj: 'MPI', euro: '2' },
    'AMF': { v: '1.4 TDI', hp: 75, f: 'D', inj: 'TDI (насос-форсунки)', ecu: 'Bosch EDC15', euro: '3' },
    /* 1.10.6: донорский код Golf IV/Bora. Встречается в применимости пружин
       1J0 411 105 …, которыми VAG официально заменил 6N0 411 105 F, — без него
       совместимость этих позиций терялась при загрузке (nP() отбрасывает
       неизвестные коды). AEH/AKL/APF = 1.6 8V, 1595 см³, 74 кВт (101 л.с.), MPI. */
    'AEH': { v: '1.6', hp: 100, f: 'P', inj: 'MPI', euro: '2' }
};
/* ============ СЕМЕЙСТВА ДВИГАТЕЛЕЙ ============
   Зеркальная структура к семействам КПП: у каждого мотора
   (буквенного кода) есть своё семейство. Используется в фильтре
   «Семейство ДВС», в редакторе VIN (группировка списка моторов +
   справка) и в поиске.

   Классификация: бензиновые малолитражки R4 1.0–1.6 — EA111;
   бензиновые 1.6/1.8 «взрослой» архитектуры — EA827;
   дизели R4 1.7–1.9 (D/SDI/TDI) — архитектура EA827
   (по классификации VAG 1.9 TD/TDI входят в семейство EA827). */
const ENGINE_FAMILIES = {
    'EA111': {
        label: 'EA111 — бензин R4 1.0–1.6 (8V/16V)',
        fuel: 'P',
        note: 'Малолитражная бензиновая серия для платформы A0: Polo 6N/6N2, Lupo, Seat Arosa/Ibiza, Caddy, Golf. Сюда входят 1.0 50 (AER/ALL/AEV/ALD/ANV/AUC), 1.3 55 (ADX), 1.4 8V 60–75 (ABU/AEX/APQ/AKV/ANX/AKK/ANW/AUD/AHT), 1.4 16V 75–100 (AHW/AKQ/AFK/ANM/APE/AUA/AFH), 1.6 75–100 (AEA/AHS/AEE/ALM/AUR/AFT/AKL, плюс донорский AEH от Golf IV/Bora) и GTI 1.6 16V 120 (AJV). Основа бензиновой линейки Polo III.',
        codes: ['AER', 'ALL', 'AEV', 'ALD', 'ANV', 'AUC', 'ADX', 'ABU', 'AEX', 'APQ', 'AKV', 'ANX', 'AKK', 'ANW', 'AUD', 'AHT', 'AHW', 'AKQ', 'AFK', 'ANM', 'APE', 'AUA', 'AFH', 'AEA', 'AHS', 'AEE', 'ALM', 'AUR', 'AFT', 'AKL', 'AEH', 'AJV', 'AKP', 'AHV']
    },
    'EA827': {
        label: 'EA827 — бензин R4 1.6/1.8',
        fuel: 'P',
        note: '«Взрослая» бензиновая серия родом из Golf/Passat. В линейке Polo встречается редко: 1.6 75 (1F) и 1.8 90 л.с. (ADZ).',
        codes: ['1F', 'ADZ']
    },
    'EA827-D': {
        label: 'EA827-D — дизель R4 1.7–1.9 (D/SDI/TDI)',
        fuel: 'D',
        note: 'Дизельные R4 на архитектуре EA827 («1.9 R4»): 1.7 SDI 57–60 (AKU/AHG/AKW/AHB), 1.9 D/SDI 64–68 (1Y, AEY/AYQ/AGD/AEF, AGP/AQM), 1.9 TDI 90–110 (AHU/ALE/AGR/ALH, AFN/ASV). Ставились на Polo 6N, Classic, Variant и Caddy; славятся огромным ресурсом.',
        codes: ['AKU', 'AHG', 'AKW', 'AHB', '1Y', 'AEY', 'AYQ', 'AGD', 'AEF', 'AGP', 'AQM', 'ASV', 'AHU', 'ALE', 'AGR', 'ALH', 'AFN']
    },
    'R3-TDI': {
        label: 'R3-TDI — 3-цилиндровый дизель 1.4 TDI',
        fuel: 'D',
        note: 'Трёхцилиндровые TDI (AMF, позднее ATL/BAY): Polo 6N2 и Lupo 1999–2005. В каталоге пока представлен только AMF (1.4 TDI 75 л.с.).',
        codes: ['AMF']
    }
};
/* код мотора → семейство */
const ENGINE_CODE_FAM = (() => {
    const m = {};
    Object.keys(ENGINE_FAMILIES).forEach(fam => {
        ENGINE_FAMILIES[fam].codes.forEach(c => { m[c] = fam; });
    });
    return m;
})();
const engineFamOf = code => ENGINE_CODE_FAM[String(code || '').trim().toUpperCase()] || '';

const BODIES = {
    '3d': 'Hatchback 3д', '5d': 'Hatchback 5д', 'classic': 'Polo Classic (седан)',
    'estate': 'Polo Estate (универсал)', 'caddy-van': 'Caddy Van',
    'caddy-kombi': 'Caddy Kombi', 'caddy-pickup': 'Caddy Pickup'
};
const TRANSMISSIONS = {
    '084': 'МКПП 084 (4-ст)',
    '085': 'МКПП 085 (5-ст)',
    '002': 'МКПП 002 (5-ст)',
    '020': 'МКПП 020 (5-ст)',
    '02K': 'МКПП 02K (5-ст)',
    '01M': 'АКПП 01M (4-ст)',
    '01N': 'АКПП 01N (4-ст)'
};

/* ============ КПП: СЕМЕЙСТВА И БУКВЕННЫЕ КОДЫ ============
   Буквенный код выбит на корпусе КПП и указан на наклейке в
   багажнике / в сервисной книжке (рядом с кодом двигателя).
   Один код = конкретный набор передаточных чисел под мотор. */
const GEARBOX = {
    '084': {
        label: 'МКПП 084 (4-ст)',
        speeds: 4,
        note: 'С чем ставили: ранние Polo III (1994–1999) с малолитражными моторами (чаще 1.0–1.4 MPI). Простая и крепкая коробка, но без «экономичной» пятой передачи.',
        codes: ['ADX', 'AGX', 'AHK', 'AKV', 'AKW', 'AKX', 'AKY', 'APY', 'AUD', 'CDK', 'CED', 'CEL', 'CEN', 'CEX', 'CEY', 'CFJ', 'CFK', 'CFL', 'CFM', 'CFN', 'CFO', 'CFP', 'CFQ', 'CFR', 'CFS', 'CFT', 'CFU', 'CFV', 'CFW', 'CFX', 'CFY', 'CFZ', 'CGA', 'CGB', 'CGC', 'CGD', 'CGE', 'CGF', 'CGG', 'CGH', 'CGI', 'CGJ', 'CGK', 'CGL', 'CGM', 'CGN', 'CGO', 'CGP', 'CGQ', 'CGR', 'CGS', 'CGT', 'CGU', 'CGW', 'CGX', 'CGY', 'CGZ', 'CHA', 'CHB', 'CHC', 'CHD', 'CHE', 'CHF', 'CHG', 'CHH', 'CHI', 'CHJ', 'CHK', 'CHL', 'CHM', 'CHN', 'CHO', 'CHP', 'CHQ', 'CHR', 'CHS', 'CHT', 'CHU', 'CHV', 'CHW', 'CHX', 'CHY', 'CHZ']
    },
    '085': {
        label: 'МКПП 085 (5-ст)',
        speeds: 5,
        note: 'С чем ставили: самая массовая 5-ступка на Polo III. Разные буквенные индексы — разные передаточные числа под двигатели 1.4, 1.6, 1.9 TDI и т. п. Версии с индексами FF* и DX* часто шли на версиях с повышенным крутящим моментом.',
        special: {
            'DKE085': 'Модификация 085 с изменёнными передаточными числами (под более тяговитые моторы или для лучшей динамики).',
            'DKE': 'Буквенный код семейства 085 (в каталогах также записывается как DKE085) — ставился с 1.6 AEE.'
        },
        codes: ['AEB', 'AFA', 'AGY', 'AHD', 'AHL', 'AHZ', 'ATV', 'AUE', 'AYZ', 'CCK', 'CEC', 'CEE', 'CEF', 'CEG', 'CEH', 'CEK', 'CEM', 'CHL', 'CHX', 'CJB', 'CJC', 'CJG', 'CKE', 'CKM', 'CKN', 'CKP', 'CKR', 'CKS', 'CKT', 'CLJ', 'CMC', 'CNU', 'CPZ', 'CRA', 'CRX', 'CSD', 'CTW', 'CTY', 'CWL', 'CWM', 'CWN', 'CWP', 'CWR', 'CWS', 'CWT', 'CWU', 'CWV', 'CWW', 'CWX', 'CZG', 'DCA', 'DCC', 'DCD', 'DCE', 'DCG', 'DCH', 'DCJ', 'DCK', 'DCT', 'DDH', 'DDJ', 'DEB', 'DED', 'DHB', 'DKC', 'DKD', 'DKF', 'DKG', 'DPE', 'DPX', 'DQW', 'DQX', 'DRC', 'DSK', 'DSP', 'DSQ', 'DTX', 'DUQ', 'DUY', 'DUZ', 'DWY', 'DWZ', 'DXB', 'DXC', 'DXD', 'DXE', 'DXF', 'DXG', 'DXH', 'DXJ', 'DXK', 'DXL', 'DXM', 'DXN', 'DXP', 'DXQ', 'DYF', 'DYG', 'DYH', 'DYJ', 'DYK', 'DYL', 'EKY', 'ENA', 'ENB', 'EQV', 'EQW', 'EQX', 'EQY', 'EQZ', 'ERA', 'ERB', 'ERC', 'ERD', 'ESY', 'ESZ', 'ETA', 'ETB', 'ETC', 'ETD', 'ETE', 'ETF', 'ETG', 'EUX', 'EUY', 'FCC', 'FCD', 'FDQ', 'FDY', 'FFC', 'FFD', 'FFE', 'FFF', 'FFG', 'FFH', 'FFJ', 'FFK', 'FFL', 'FFM', 'FFN', 'FFP', 'FFQ', 'FFR', 'FFS', 'FFT', 'FFU', 'FFV', 'FFW', 'FFX', 'FGF', 'FHX', 'FHY', 'FHZ', 'FJA', 'FJB', 'FJD', 'FJE', 'FLE', 'FPQ', 'GJE']
    },
    '002': {
        label: 'МКПП 002 (5-ст)',
        speeds: 5,
        note: 'С чем ставили: чаще всего Polo Classic (кузов 6V2) и родственные версии (в т. ч. Caddy на базе Polo). Буквенные суффиксы определяют совместимость с конкретным мотором и годом выпуска.',
        codes: ['DTP', 'DTQ', 'DVM', 'DWT', 'DWU', 'DWV', 'DWW', 'DYR', 'DYS', 'DYT', 'DYU', 'DYV', 'DYW', 'DYX', 'DYY', 'DYZ', 'DZA', 'EDA', 'EDK', 'EDL', 'EFM', 'EMH', 'FCM', 'FJQ', 'FNK', 'GCG']
    }
};

/* Отдельные коды — вне основных семейств (или с особыми пометками) */
const GEARBOX_MISC = {
    'DCD': 'Отдельная версия, ставилась на Polo в 1990-х. По некоторым каталогам относится к семейству 085.',
    'DCH': 'Отдельная версия, ставилась на Polo в 1990-х. Также применялась на Seat Arosa и Cordoba. По некоторым каталогам относится к семейству 085.',
    'FFU': '5-ступка, встречалась на Polo III (1994–2002). Входит в список кодов семейства 085.',
    'FMC': '5-ступка, применялась примерно с 2003 года. Семейство не уточнено.'
};

/* code -> [семейства]; у CHL/CHX два семейства (084 и 085) */
const GEARBOX_CODE_FAMS = (() => {
    const m = {};
    const add = (c, f) => { if (!m[c]) m[c] = []; if (!m[c].includes(f)) m[c].push(f); };
    Object.keys(GEARBOX).forEach(fam => {
        GEARBOX[fam].codes.forEach(c => add(c, fam));
        Object.keys(GEARBOX[fam].special || {}).forEach(c => add(c, fam));
    });
    return m;
})();
const GEARBOX_CODES_ALL = Array.from(new Set(
    Object.keys(GEARBOX_CODE_FAMS).concat(Object.keys(GEARBOX_MISC))
)).sort();

/* ============ СПРАВОЧНИК «МОТОР → КПП» ============
   Какие КПП ставились с каждым двигателем. Используется в
   редакторе VIN: при выборе мотора список семейств и буквенных
   кодов сужается до реально ставившихся.

   Источники: VW ETKA, сводная таблица ti-lo.de / polomagazin.de
   (проверенные буквенные коды для хэтчбеков 6N1/6N2), данные
   форума vwcaddy-forum.de (Caddy 9K: SDI — 020, TDI — 02A/020).

   fams  — семейства КПП (первое = самое частое);
   codes — проверенные буквенные коды (для хэтчбека/универсала 6N).
   Справочник ориентировочный: если кода машины в списке нет —
   это не ошибка, введите его вручную (поле допускает свободный ввод). */
const ENGINE_GEARBOX = {
    // ── Бензин 1.0 (50 л.с.) ──
    'AER': { fams: ['084', '085'], codes: ['DKC', 'DKG', 'DWZ', 'DXD'] },
    'ALL': { fams: ['084', '085'], codes: ['DWZ', 'DXD', 'EQW'] },
    'AEV': { fams: ['084', '085'], codes: ['CWL', 'CWN', 'DCA', 'DCD'] },
    'ALD': { fams: ['085'], codes: [] },
    'ANV': { fams: ['085'], codes: ['ESY'] },
    'AUC': { fams: ['085'], codes: ['FDY', 'FFD'] },
    // ── Бензин 1.3 / 1.4 ──
    'ADX': { fams: ['084', '085'], codes: ['CJC', 'CWU', 'DCJ', 'DXK'] },
    'ABU': { fams: ['084', '085'], codes: [] },
    'AEX': { fams: ['084', '085'], codes: ['DDH', 'DHB', 'DKF', 'DQW', 'DXP'] },
    'APQ': { fams: ['085'], codes: [] },
    'AKV': { fams: ['085'], codes: ['DXP'] },   // 1.10.6: DXP подтверждён записью WVWZZZ6NZXY406408 (vin-db.patch.json)
    'ANX': { fams: ['085'], codes: ['ERD'] },
    'AKK': { fams: ['085'], codes: [] },
    'ANW': { fams: ['085'], codes: [] },
    'AUD': { fams: ['085'], codes: ['ERD'] },
    'AHT': { fams: ['085'], codes: [] },
    // ── Бензин 1.4 16V ──
    'AHW': { fams: ['085'], codes: ['ETE', 'FFR', 'FFS'] },
    'AKQ': { fams: ['085'], codes: ['DUY', 'DXP'] },
    'AFK': { fams: ['085'], codes: ['ETB', 'ETC', 'FHZ'] },
    'ANM': { fams: ['085'], codes: [] },
    'APE': { fams: ['085'], codes: [] },
    'AUA': { fams: ['085'], codes: [] },
    'AFH': { fams: ['085'], codes: ['CWX', 'DSP', 'DXJ', 'DXM'] },
    // ── Бензин 1.6 / 1.8 ──
    'AEA': { fams: ['085'], codes: ['CKE', 'CLJ', 'CWS', 'CWV'] },
    'AHS': { fams: ['085'], codes: [] },
    'AEE': { fams: ['085', '01M'], codes: ['CZG', 'DCC', 'DCG', 'DDJ', 'DKE', 'DKE085', 'DSQ', 'DXE', 'DXH', 'EQY', 'EQZ'] },
    'ALM': { fams: ['085', '01M'], codes: [] },
    'AUR': { fams: ['085'], codes: [] },
    '1F': { fams: ['085', '002', '020'], codes: [] },
    'AFT': { fams: ['085'], codes: [] },
    'AKL': { fams: ['085'], codes: [] },
    'AJV': { fams: ['085'], codes: ['DTX'] },   // GTI 1.6 16V — только 085 (DTX)
    'ADZ': { fams: ['085'], codes: [] },
    // ── Дизель 1.7 ──
    'AKU': { fams: ['085'], codes: ['DED', 'DXQ', 'ETA', 'ETF', 'FDQ'] },
    'AHG': { fams: ['085'], codes: ['DXG'] },
    'AKW': { fams: ['085'], codes: [] },
    'AHB': { fams: ['085'], codes: [] },
    // ── Дизель 1.9 D / SDI / TDI ──
    'AEY': { fams: ['085'], codes: [] },
    'AYQ': { fams: ['085'], codes: [] },
    '1Y': { fams: ['085', '020'], codes: [] },
    'AGD': { fams: ['085'], codes: ['DPX', 'DXF', 'EQX'] },
    'AEF': { fams: ['085'], codes: ['CWT', 'DCH', 'DCT', 'DED'] },
    'AGP': { fams: ['085', '020'], codes: [] },
    'AQM': { fams: ['085'], codes: [] },
    'ASV': { fams: ['085', '020'], codes: [] },
    'AHU': { fams: ['085', '020'], codes: [] },
    'ALE': { fams: ['085', '020'], codes: [] },
    'AGR': { fams: ['085', '020'], codes: [] },
    'ALH': { fams: ['085', '020'], codes: [] },
    'AFN': { fams: ['020', '085'], codes: [] },
    // Семейство SEAT / R3-TDI (коды из каталога доноров и 6N2)
    'AKP': { fams: ['085'], codes: [] },
    'AHV': { fams: ['085'], codes: [] },
    'AMF': { fams: ['085'], codes: [] },
    /* 1.10.6: донорский код Golf IV/Bora — каскад не ограничиваем (fams: []),
       потому что на Polo этот мотор не ставился; запись нужна, чтобы
       справочник «мотор → КПП» по-прежнему покрывал все коды ENGINES. */
    'AEH': { fams: [], codes: [] }
};

/* Classic (6V2/6KV) и Caddy (9K) — платформа Seat Ibiza/Cordoba 6K:
   к «хэтчбековым» семействам добавляются 002 и 020;
   на Polo Classic (6V2) также ставилась 02K (по данным vwts.ru) */
const PLATFORM_EXTRA_FAMS = {
    classic: ['002', '020', '02K'],
    caddy: ['002', '020']
};

/* Определение платформы по кузову/модели гаражной записи */
function platformOf(bodyStr, modelStr) {
    const b = nz(bodyStr), m = nz(modelStr);
    if (b.includes('classic') || b.includes('sedan')) return 'classic';
    if (b.includes('van') || b.includes('pickup')) return 'caddy';
    if (b.includes('variant') || b.includes('estate')) return 'estate';
    if (b.includes('hatch')) return 'hatch';
    if (m.includes('classic')) return 'classic';
    if (m.includes('caddy')) return 'caddy';
    if (m.includes('variant') || m.includes('estate')) return 'estate';
    if (m.includes('polo') || m.includes('6n')) return 'hatch';
    return '';
}

/* Какие КПП ставились с мотором на данной платформе.
   Пустой fams = данных нет (не ограничиваем выбор).
   Проверенные буквенные коды отдаются только для 6N-хэтчбека/универсала. */
function gearboxForEngine(engineCode, platform) {
    const e = ENGINE_GEARBOX[String(engineCode || '').trim().toUpperCase()];
    if (!e) return { fams: [], codes: [] };
    if (platform === 'classic' || platform === 'caddy') {
        const fams = Array.from(new Set(e.fams.concat(PLATFORM_EXTRA_FAMS[platform] || [])));
        return { fams, codes: [] };
    }
    return { fams: e.fams.slice(), codes: e.codes ? e.codes.slice() : [] };
}

const gearboxFamsOf = code => GEARBOX_CODE_FAMS[String(code || '').trim().toUpperCase()] || [];
/* Справка по коду: { fams, note, special } — для подсказок в UI */
function gearboxInfo(code) {
    const c = String(code || '').trim().toUpperCase();
    if (!c) return null;
    const fams = gearboxFamsOf(c);
    let note = GEARBOX_MISC[c] || '';
    let special = '';
    fams.forEach(f => {
        const g = GEARBOX[f];
        if (g && g.special && g.special[c]) special = g.special[c];
        if (!note && g && g.note) note = g.note;
    });
    return { fams, note, special };
}
/* Нормализация пользовательского ввода кода КПП */
const normGb = v => {
    const s = String(v || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return s || 'all';
};
/* Заполняет <datalist> кодами КПП.
   opts.codes — явный список кодов (может быть пустым = пустой datalist);
   opts.fams  — массив семейств (объединение их кодов);
   opts.family — одно семейство;
   ничего не задано — все известные коды. */
function fillGearboxDatalist(dlId, opts) {
    opts = opts || {};
    const dl = $(dlId); if (!dl) return;
    let codes;
    if (Array.isArray(opts.codes)) {
        codes = opts.codes.slice();
    } else {
        const explicit = (Array.isArray(opts.fams) && opts.fams.length)
            ? opts.fams.filter(f => GEARBOX[f])
            : (opts.family && GEARBOX[opts.family] ? [opts.family] : []);
        const full = !explicit.length;
        const fams = full ? Object.keys(GEARBOX) : explicit;
        codes = [];
        fams.forEach(f => { codes = codes.concat(GEARBOX[f].codes, Object.keys(GEARBOX[f].special || {})); });
        // Отдельные коды: DCD/DCH/FFU — если в списке их семейство; FMC — только в полном режиме
        Object.keys(GEARBOX_MISC).forEach(c => {
            const cf = gearboxFamsOf(c);
            if (cf.length ? cf.some(f => fams.includes(f)) : full) codes.push(c);
        });
    }
    codes = Array.from(new Set(codes)).sort();
    dl.innerHTML = codes.map(c => {
        const f = gearboxFamsOf(c);
        const lb = f.length ? f.join('/') : 'отдельный';
        return '<option value="' + c + '">' + lb + '</option>';
    }).join('');
}
/* ====== СЛОВАРЬ ЦВЕТОВ VAG LAF (Polo 6N/Classic/Caddy) ====== */
/* ====== ЦВЕТА КУЗОВА VAG (LACKNUMmern) ======
   Словарь кодов краски для VW Polo 6N/6N2, Classic (6V2), Variant (6V5)
   и Caddy (9K/9U) 1994–2003. Ключ — код с наклейки в багажнике
   (обычно 2–3 символа), aka — полные L-коды и альтернативные обозначения.
   hex — образец цвета (по окрашенным чипам и каталогам подкраски).

   ⚠ Исправлено в 1.8.0 (сверено по базам подкраски):
     · B4 = Candy White (LB9A), а НЕ Tornado Red;
     · J2 = Chagallblau (LD5D), а НЕ Reflex Silver;
     · Tornado Red = G2 (LY3D), Reflex Silver = 8E (LA7W).
   Короткие коды у VAG повторяются между моделями/годами — словарь
   отражает значения именно для платформы 6N/6K/9K. */
const LAF_COLORS = {
    /* ── Белые / чёрные ─────────────────────────────── */
    'B4': { name: 'Candy White', hex: '#F1F1EC', ru: 'Белый Candy', aka: ['LB9A', 'B9A'] },
    'P1': { name: 'Alpinweiss', hex: '#E8E4D6', ru: 'Альпийский белый', aka: ['L90E', 'L025', 'P8'] },
    'B7': { name: 'Cool White', hex: '#DEDEDA', ru: 'Холодный белый', aka: ['LA9B', 'A9B'] },
    'Y9H': { name: 'Polarweiss', hex: '#E7E7DD', ru: 'Полярный белый', aka: ['LY9H'] },
    '41': { name: 'Schwarz', hex: '#151515', ru: 'Чёрный', aka: ['L041', 'L845', '041'] },
    'A2': { name: 'Brilliant Black', hex: '#101014', ru: 'Бриллиант-чёрный', aka: ['LY9B', 'Y9B', 'Y9'] },
    'C9': { name: 'Black Magic Pearl', hex: '#232326', ru: 'Чёрный магия перламутр', aka: ['LC9Z', 'Z4', 'C9Z'] },
    'T7': { name: 'Grauweiss', hex: '#D7D7CB', ru: 'Серо-белый (Caddy)', aka: ['LR902', 'L902', 'L90Z'] },
    'V2': { name: 'Elfenbein', hex: '#DAC691', ru: 'Слоновая кость (Caddy)', aka: ['LR114'] },
    /* ── Красные / оранжевые ────────────────────────── */
    'G2': { name: 'Tornadorot', hex: '#C21212', ru: 'Красный Торнадо', aka: ['LY3D', 'Y3D'] },
    'D8': { name: 'Flashrot', hex: '#B01B1D', ru: 'Красный Flash', aka: ['LP3G', 'P3G'] },
    'G3E': { name: 'Flashrot (LG3E)', hex: '#AD1919', ru: 'Красный Flash (LG3E)', aka: ['LG3E'] },
    'R300': { name: 'Feuerrot', hex: '#B02925', ru: 'Огненно-красный', aka: ['LR300'] },
    'E3': { name: 'Bright Orange', hex: '#CC4F19', ru: 'Ярко-оранжевый', aka: ['LP2C', 'P2C'] },
    '9W': { name: 'Muranorot Perleffekt', hex: '#913341', ru: 'Мурано-красный перламутр', aka: ['LC3X', 'C3X'] },
    'G9': { name: 'Canyon Red Pearl', hex: '#703D3C', ru: 'Каньон-красный перламутр', aka: ['LC3K', 'C3K'] },
    'X7': { name: 'Memoryrot Pearl', hex: '#85333F', ru: 'Мемори-красный перламутр', aka: ['LC3M', 'C3M'] },
    'R8': { name: 'Rosewood Red Pearl', hex: '#4A3A40', ru: 'Палисандр-красный перламутр', aka: ['LC3W', 'C3W'] },
    'P3K': { name: 'Colarot', hex: '#C11722', ru: 'Кола-красный (Caddy)', aka: ['LP3K'] },
    'Q7': { name: 'Colorado Red Metallic', hex: '#6C2630', ru: 'Колорадо-красный металлик (Caddy)', aka: ['LB3Y', 'B3Y'] },
    'H7': { name: 'Paprikarot', hex: '#691A20', ru: 'Паприка-красный (Caddy)', aka: ['LK3A', 'K3A'] },
    'H3F': { name: 'Essentrot', hex: '#872E44', ru: 'Эссен-красный (Caddy)', aka: ['LH3F'] },
    'S3P': { name: 'Red Metallic', hex: '#76292F', ru: 'Красный металлик (Caddy)', aka: ['LS3P'] },
    'K7': { name: 'Red Spice Metallic', hex: '#712A2E', ru: 'Ред-Спайс металлик (Caddy)', aka: ['LA3W', 'A3W'] },
    'Z7': { name: 'Sundown Orange', hex: '#AA342A', ru: 'Сансет-оранжевый (Caddy)', aka: ['LB2A', 'B2A'] },
    /* ── Жёлтые ─────────────────────────────────────── */
    'J5': { name: 'Gelb', hex: '#EFD94C', ru: 'Жёлтый', aka: ['LD1B', 'LJ1D', 'D1B', 'J1D'] },
    '132': { name: 'Ginstergelb', hex: '#DF9F19', ru: 'Жёлтый Гинстер (Harlekin)', aka: ['L13R', 'LS1D', '13R', 'S1D'] },
    'T1': { name: 'Sunflower Yellow', hex: '#F0CC54', ru: 'Подсолнечно-жёлтый', aka: ['LB1B', 'B1B'] },
    'A6': { name: 'Double Yellow', hex: '#F2C632', ru: 'Двойной жёлтый', aka: ['LD1D', 'D1D'] },
    'B1A': { name: 'Shellgelb', hex: '#F0C830', ru: 'Ракушечно-жёлтый (Caddy)', aka: ['LB1A'] },
    'B8': { name: 'Cayennegelb', hex: '#D48C28', ru: 'Кайен-жёлтый (Caddy)', aka: ['LL1G'] },
    'N1K': { name: 'Chromgelb', hex: '#E87D15', ru: 'Хром-жёлтый (Caddy)', aka: ['LN1K'] },
    'N1L': { name: 'Gelb (LN1L)', hex: '#F4BD1A', ru: 'Жёлтый (Caddy)', aka: ['LN1L'] },
    'X3': { name: 'Rapsgelb', hex: '#DC8617', ru: 'Рапсово-жёлтый (Caddy)', aka: ['LJ1B', 'J1B'] },
    /* ── Синие / голубые ────────────────────────────── */
    'J2': { name: 'Chagallblau', hex: '#33518F', ru: 'Синий Шагал (Harlekin)', aka: ['LD5D'] },
    'K1': { name: 'Maritimblau', hex: '#202833', ru: 'Маритим-синий', aka: ['LA5E', 'A5E'] },
    'F3': { name: 'Indienblau', hex: '#273349', ru: 'Индиго-синий', aka: ['LL5M', 'L5M'] },
    '1C': { name: 'Surfblau', hex: '#2A3B66', ru: 'Сёрф-синий', aka: ['LA5C', 'A5C'] },
    '5Z': { name: 'Ravennablau Metallic', hex: '#234C7A', ru: 'Равенна-синий металлик', aka: ['LA5W'] },
    '6J': { name: 'Mercatoblau Metallic', hex: '#256186', ru: 'Меркато-синий металлик', aka: ['LA5M', 'A5M'] },
    'W5': { name: 'Jazz Blue Pearl', hex: '#2E528C', ru: 'Джаз-синий перламутр', aka: ['LW5Z', 'W5Z'] },
    'B5': { name: 'Indigo Blue Pearl', hex: '#313445', ru: 'Индиго-синий перламутр', aka: ['LB5N', 'B5N', '7D'] },
    'C3': { name: 'Fjord Blue Metallic', hex: '#3E4D6E', ru: 'Фьорд-синий металлик', aka: ['LR5V', 'R5V'] },
    'Y5': { name: 'Hellblau Metallic', hex: '#3D537A', ru: 'Светло-синий металлик', aka: ['LR5Y', 'R5Y', 'A5T'] },
    'F8': { name: 'Anthrazitblau Pearl', hex: '#454A50', ru: 'Антрацит-синий перламутр', aka: ['LC7V', 'C7V'] },
    'J1': { name: 'Atlantikblau Pearl', hex: '#30333C', ru: 'Атлантик-синий перламутр', aka: ['LC5H', 'C5H'] },
    'P6': { name: 'Shadow Blue Metallic', hex: '#2C374B', ru: 'Шадоу-синий металлик', aka: ['LD5Q', 'D5Q'] },
    'E1': { name: 'Summerblau', hex: '#284C9A', ru: 'Летне-синий', aka: ['LA5F', 'A5F'] },
    '5X': { name: 'Neptune Metallic', hex: '#4C6B9A', ru: 'Нептун металлик', aka: ['LK5W', 'K5W'] },
    '1E': { name: 'Steinblau', hex: '#89A6AA', ru: 'Каменно-синий (Caddy)', aka: ['LH5J', 'H5J'] },
    '2D': { name: 'Daenischblau', hex: '#4186BD', ru: 'Датский синий (Caddy)', aka: ['LH5R', 'H5R', '5HR'] },
    'E6': { name: 'Mystic Blue Pearl', hex: '#282530', ru: 'Мистик-синий перламутр (Caddy)', aka: ['LC5L', 'C5L'] },
    'F1': { name: 'Ice Blue', hex: '#618198', ru: 'Ледяной синий (Caddy)', aka: ['LJ5B', 'J5B'] },
    'H5C': { name: 'Blau', hex: '#1A5D94', ru: 'Синий (Caddy)', aka: ['LH5C'] },
    'J8': { name: 'Windsorblau Metallic', hex: '#393B47', ru: 'Виндзор-синий металлик (Caddy)', aka: [] },
    '4V': { name: 'Dark Nebioblau Metallic', hex: '#617181', ru: 'Тёмный нео-синий металлик (Caddy)', aka: ['LV5W', 'V5W'] },
    'N2': { name: 'Malibublau Metallic', hex: '#2B8AA8', ru: 'Малибу-синий металлик (Caddy)', aka: ['LD5W', 'D5W'] },
    /* ── Серые / серебристые / бежевые ──────────────── */
    '8E': { name: 'Reflex Silver Metallic', hex: '#C4C8CB', ru: 'Рефлекс-серебристый металлик', aka: ['LA7W', 'A7W'] },
    'C1': { name: 'Satinsilber Metallic', hex: '#C6CAC9', ru: 'Сатин-серебристый металлик', aka: ['LB7Z', 'B7Z'] },
    '7Y': { name: 'Storm Gray Metallic', hex: '#555A5E', ru: 'Серый шторм металлик', aka: ['LK7Y', 'K7Y'] },
    '2A': { name: 'Urbangrau Metallic', hex: '#7B7C7E', ru: 'Урбан-серый металлик', aka: ['LD7W', 'D7W', 'D7'] },
    '2R': { name: 'Platinum Gray Metallic', hex: '#5A5E61', ru: 'Платиново-серый металлик', aka: ['LD7X', 'D7X'] },
    'L1': { name: 'Arktisgrau Metallic', hex: '#B3B3B5', ru: 'Арктический серый металлик (Caddy)', aka: ['LS7N', 'S7N'] },
    'M3': { name: 'Offroad Gray Metallic', hex: '#4A5157', ru: 'Офроуд-серый металлик (Caddy)', aka: ['LD7U', 'D7U'] },
    'B9': { name: 'Monument Gray', hex: '#7F97A1', ru: 'Монумент-серый (Caddy)', aka: ['LL7E', 'L7E'] },
    'D1': { name: 'Wheat Beige Metallic', hex: '#9C9B96', ru: 'Пшенично-бежевый металлик', aka: ['LD1W', 'D1W'] },
    '1W': { name: 'Stormbeige Metallic', hex: '#B3AC99', ru: 'Сторм-бежевый металлик (Caddy)', aka: ['LA1W', 'A1W'] },
    /* ── Зелёные ────────────────────────────────────── */
    '2N': { name: 'Evergreen', hex: '#2F813F', ru: 'Зелёный Evergreen', aka: ['LA6C', 'A6C'] },
    'M5': { name: 'Pistaziengruen', hex: '#4C7A50', ru: 'Фисташковый зелёный (Harlekin)', aka: ['LD6D', 'D6D'] },
    'C6': { name: 'Bright Green Pearl', hex: '#31463F', ru: 'Ярко-зелёный перламутр', aka: ['LC6M', 'C6M'] },
    'W7': { name: 'Dragon Green Pearl', hex: '#2D464A', ru: 'Дракон-зелёный перламутр', aka: ['LC6P', 'C6P'] },
    'L3': { name: 'Cosmic Green Metallic', hex: '#6B8361', ru: 'Космик-зелёный металлик', aka: ['LA6P', 'A6P'] },
    '4L': { name: 'Green Tendence Metallic', hex: '#909B61', ru: 'Грин-Тенденс металлик', aka: ['LA6M', 'A6M'] },
    'D6T': { name: 'Electricgruen Metallic', hex: '#539886', ru: 'Электрик-зелёный металлик', aka: ['LD6T'] },
    '8Z': { name: 'Baltic Green Pearl', hex: '#35484C', ru: 'Балтик-зелёный перламутр (Oceanicgruen)', aka: ['LC6X', 'C6X'] },
    'V4': { name: 'Lintgruen', hex: '#A7B79A', ru: 'Линт-зелёный', aka: ['LL6F'] },
    'S4': { name: 'Science Green Metallic', hex: '#3D6356', ru: 'Сайенс-зелёный металлик', aka: ['LA6S', 'A6S'] },
    'L6J': { name: 'Limette', hex: '#CFD887', ru: 'Лайм', aka: ['LL6J'] },
    'E5': { name: 'Venetian Green Pearl', hex: '#30383A', ru: 'Венецианский зелёный перламутр (Caddy)', aka: ['LD6W', 'D6W'] },
    '9Y': { name: 'Pine Green Pearl', hex: '#2A3E3F', ru: 'Сосново-зелёный перламутр (Caddy)', aka: ['LB6W', 'B6W'] },
    'X8': { name: 'Friesengruen', hex: '#1B5546', ru: 'Фризский зелёный (Caddy)', aka: ['LL6T', 'L6T'] },
    'H6S': { name: 'Scarab Green', hex: '#1B4E49', ru: 'Скарабей-зелёный (Caddy)', aka: ['LH6S'] },
    '68Q': { name: 'Dunkelgruen', hex: '#1B402F', ru: 'Тёмно-зелёный (Caddy)', aka: ['L68Q'] },
    '3P': { name: 'Frescogruen Metallic', hex: '#767972', ru: 'Фреско-зелёный металлик (Caddy)', aka: ['LA6W', 'A6W'] },
    'J6C': { name: 'Gruenblau', hex: '#1D363D', ru: 'Сине-зелёный (Caddy)', aka: ['LJ6C'] }
};
/* Индекс алиасов: любой код (короткий или полный L-код) → ключ словаря */
const LAF_ALIAS = (() => {
    const m = {};
    Object.keys(LAF_COLORS).forEach(k => {
        m[k.toUpperCase()] = k;
        (LAF_COLORS[k].aka || []).forEach(a => { const A = String(a).toUpperCase(); if (!m[A]) m[A] = k; });
    });
    return m;
})();
/* Поиск цвета по коду с наклейки: точное совпадение, затем алиасы,
   затем дубли («B4B4» → B4) и префиксы склеек («J2J241» → J2). */
function lafColor(code) {
    const c = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!c) return null;
    let key = LAF_ALIAS[c];
    if (!key && c.length > 2) {
        if (c.slice(0, 2) === c.slice(2, 4)) key = LAF_ALIAS[c.slice(0, 2)];  // B4B4
        if (!key) key = LAF_ALIAS[c.slice(0, 2)] || LAF_ALIAS[c.slice(0, 3)] || LAF_ALIAS[c.slice(0, 4)];
    }
    if (!key) return null;
    return Object.assign({ code: key }, LAF_COLORS[key]);
}

/* ====== ТИПИЧНЫЕ ПРОБЛЕМЫ (БОЛЯЧКИ) ======
   Ключ — код мотора или семейства КПП; severity: high/medium/low;
   year: 'all' | 'ГГГГ-ГГГГ' | 'ГГГГ+' — при известном годе выпуска
   машины нерелевантные записи не показываются. */
const _ISS_10 = [
    { year: 'all', issue: 'Масложор на больших пробегах (залегание колец)', severity: 'medium' },
    { year: 'all', issue: 'Интерференционный ГРМ: обрыв ремня гнёт клапана — менять каждые 60 тыс. км', severity: 'high' },
    { year: 'all', issue: 'Течь прокладки клапанной крышки', severity: 'low' }
];
const _ISS_14_8V = [
    { year: '1994-1997', issue: 'Трещина ГБЦ между 2-3 цилиндром', severity: 'high' },
    { year: 'all', issue: 'Течь сальника распредвала', severity: 'medium' },
    { year: 'all', issue: 'Интерференционный ГРМ: обрыв ремня гнёт клапана', severity: 'high' },
    { year: 'all', issue: 'Загрязнение дроссельной заслонки — плавают обороты ХХ', severity: 'low' }
];
const _ISS_14_16V = [
    { year: 'all', issue: 'Натяжитель цепи распредвалов — лязг на холодную (менять с башмаками)', severity: 'high' },
    { year: 'all', issue: 'Масложор (колпачки, кольца)', severity: 'medium' },
    { year: 'all', issue: 'Интерференционный ГРМ: ремень + цепь, обрыв гнёт клапана', severity: 'high' }
];
const _ISS_16 = [
    { year: 'all', issue: 'Течь прокладки впускного коллектора', severity: 'medium' },
    { year: 'all', issue: 'Износ подушек двигателя', severity: 'low' },
    { year: 'all', issue: 'Масложор на пробегах 250 тыс.+ км', severity: 'medium' }
];
const _ISS_SDI = [
    { year: 'all', issue: 'Свечи накаливания / реле — трудный пуск зимой', severity: 'medium' },
    { year: 'all', issue: 'Течи и износ ТНВД (VE/EDC)', severity: 'medium' },
    { year: 'all', issue: 'Клапан EGR зарастает сажей (если установлен)', severity: 'low' }
];
const _ISS_TDI90 = [
    { year: 'all', issue: 'Клапан N75 и геометрия/актуатор турбины — провалы тяги', severity: 'medium' },
    { year: 'all', issue: 'ДМРВ (расходомер) — потеря мощности', severity: 'medium' },
    { year: 'all', issue: 'Двухмассовый маховик (AGR/AHU) — стук при трогании', severity: 'medium' },
    { year: 'all', issue: 'Течь сальника распредвала', severity: 'low' }
];
const KNOWN_ISSUES = {
    /* бензин EA111 */
    'AER': _ISS_10, 'ALL': _ISS_10, 'AEV': _ISS_10, 'ALD': _ISS_10, 'ANV': _ISS_10, 'AUC': _ISS_10,
    'AEX': _ISS_14_8V, 'APQ': _ISS_14_8V, 'AKV': _ISS_14_8V, 'ANX': _ISS_14_8V,
    'AKK': _ISS_14_8V, 'ANW': _ISS_14_8V, 'AUD': _ISS_14_8V, 'AHT': _ISS_14_8V, 'ABU': _ISS_14_8V, 'AKP': _ISS_14_8V,
    'APE': _ISS_14_16V, 'AUA': _ISS_14_16V, 'AHW': _ISS_14_16V, 'AKQ': _ISS_14_16V,
    'AFK': _ISS_14_16V, 'ANM': _ISS_14_16V, 'AFH': _ISS_14_16V,
    'AEE': _ISS_16, 'ALM': _ISS_16, 'AUR': _ISS_16, 'AEA': _ISS_16, 'AHS': _ISS_16, 'AHV': _ISS_16,
    'AKL': _ISS_16, 'AFT': _ISS_16,
    /* бензин EA827 */
    '1F': [
        { year: 'all', issue: 'Система Digifant: датчики ХХ/температуры — нестабильные обороты', severity: 'medium' },
        { year: 'all', issue: 'Прокладка ГБЦ — течи масла/антифриза', severity: 'medium' }
    ],
    'ADZ': [
        { year: 'all', issue: 'Система Digifant — плавают обороты', severity: 'medium' },
        { year: 'all', issue: 'Прокладка ГБЦ и сальники — течи масла', severity: 'medium' },
        { year: 'all', issue: 'Износ подушек двигателя', severity: 'low' }
    ],
    /* дизели */
    'AKW': _ISS_SDI, 'AHB': _ISS_SDI, 'AKU': _ISS_SDI, 'AHG': _ISS_SDI,
    'AEY': _ISS_SDI, 'AYQ': _ISS_SDI, 'AQM': _ISS_SDI, 'AGD': _ISS_SDI, 'AEF': _ISS_SDI,
    '1Y': [
        { year: 'all', issue: 'Свечи накаливания — трудный пуск зимой', severity: 'medium' },
        { year: 'all', issue: 'ТНВД (механический) — течи, износ плунжерной пары', severity: 'medium' },
        { year: 'all', issue: 'Регулировка тепловых зазоров клапанов каждые 90 тыс. км', severity: 'low' }
    ],
    'AGP': [
        { year: 'all', issue: 'Свечи накаливания — трудный пуск зимой', severity: 'medium' },
        { year: 'all', issue: 'ТНВД — течи, износ', severity: 'medium' }
    ],
    'AHU': _ISS_TDI90, 'ALE': _ISS_TDI90, 'AGR': _ISS_TDI90, 'ALH': _ISS_TDI90,
    'AFN': [
        { year: 'all', issue: 'Износ турбины K03 (свист, масложор)', severity: 'high' },
        { year: 'all', issue: 'Проблемы с ТНВД — трудный запуск', severity: 'medium' },
        { year: 'all', issue: 'Патрубки интеркулера в масле', severity: 'medium' }
    ],
    'ASV': [
        { year: 'all', issue: 'Износ турбины (VNT-геометрия закисает)', severity: 'high' },
        { year: 'all', issue: 'Проблемы с ТНВД — трудный запуск', severity: 'medium' }
    ],
    'AMF': [
        { year: 'all', issue: 'Жгут проводки насос-форсунок — троит, ошибка в ЭБУ', severity: 'high' },
        { year: 'all', issue: 'Тандемный насос — течи масла/вакуума', severity: 'medium' },
        { year: 'all', issue: 'Двухмассовый маховик — стук/вибрации', severity: 'medium' },
        { year: 'all', issue: 'Клапан EGR зарастает сажей', severity: 'medium' }
    ],
    /* КПП — по семействам */
    '084': [
        { year: 'all', issue: 'Износ синхронизаторов (ранние 4-ст.)', severity: 'medium' },
        { year: 'all', issue: 'Люфт кулисы — нечёткое включение передач', severity: 'low' },
        { year: 'all', issue: 'Течь сальников приводов', severity: 'low' }
    ],
    '085': [
        { year: 'all', issue: 'Износ синхронизаторов 1-2 передачи', severity: 'medium' },
        { year: 'all', issue: 'Течь сальника КПП', severity: 'low' },
        { year: 'all', issue: 'Износ втулок кулисы — разболтанный рычаг', severity: 'low' }
    ],
    '002': [
        { year: 'all', issue: 'Износ синхронизаторов 1-2 передачи', severity: 'medium' },
        { year: 'all', issue: 'Люфт кулисы', severity: 'low' }
    ],
    '020': [
        { year: 'all', issue: 'Износ подшипников первичного вала', severity: 'medium' },
        { year: 'all', issue: 'Проблемы с кулисой (люфт)', severity: 'low' }
    ],
    '01M': [
        { year: 'all', issue: 'Гидроблок — толчки/пинки при переключениях (перегрев ATF)', severity: 'high' },
        { year: 'all', issue: 'ATF менять каждые 60 тыс. км, иначе капремонт', severity: 'medium' },
        { year: 'all', issue: 'Износ блокировки гидротрансформатора — вибрации', severity: 'medium' }
    ]
};
/* Проблемы по платформе/кузову (не зависят от мотора) */
const PLATFORM_ISSUES = {
    'hatch': [
        { year: 'all', issue: 'Коррозия задних арок и порогов — осматривать каждые полгода', severity: 'high' },
        { year: 'all', issue: 'Стук рулевой рейки на неровностях', severity: 'medium' },
        { year: 'all', issue: 'Сайлентблоки передних рычагов — скрип/стук', severity: 'medium' },
        { year: 'all', issue: 'Резистор вентилятора печки — пропадают скорости', severity: 'low' },
        { year: '1999-2001', issue: '6N2: перелом жгута проводов в гофре двери багажника', severity: 'medium' }
    ],
    'estate': [
        { year: 'all', issue: 'Коррозия задних арок, порогов и кромки багажника', severity: 'high' },
        { year: 'all', issue: 'Перелом жгута в гофре пятой двери', severity: 'medium' },
        { year: 'all', issue: 'Газовые упоры багажника — слабеют к 15 годам', severity: 'low' }
    ],
    'classic': [
        { year: 'all', issue: 'Рулевая рейка — стук/течи', severity: 'medium' },
        { year: 'all', issue: 'Течи задних тормозных цилиндров (барабаны)', severity: 'medium' },
        { year: 'all', issue: 'Коррозия порогов и мест под домкрат', severity: 'medium' },
        { year: 'all', issue: 'Износ подушек двигателя (платформа 6K)', severity: 'low' }
    ],
    'caddy': [
        { year: 'all', issue: 'Коррозия порогов и арок — рабочая лошадка, следить', severity: 'high' },
        { year: 'all', issue: 'Ролики и направляющие сдвижной двери — скрип, заедание', severity: 'medium' },
        { year: 'all', issue: 'Задние рессоры — просадка при постоянной загрузке', severity: 'medium' },
        { year: 'all', issue: 'Замок сдвижной двери — разбалтывается', severity: 'low' }
    ]
};
/* Соответствует ли запись о проблеме году выпуска машины */
function issueMatchesYear(issue, year) {
    const y = issue && issue.year;
    if (!y || y === 'all' || !year) return true;
    const s = String(y);
    let m = s.match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
    if (m) return year >= +m[1] && year <= +m[2];
    m = s.match(/^(\d{4})\+$/);
    if (m) return year >= +m[1];
    m = s.match(/^(\d{4})$/);
    if (m) return year === +m[1];
    return true;
}
/* Все проблемы машины: мотор + семейство КПП + платформа, с фильтром по году */
function issuesForGarageCar(g) {
    const out = [];
    const year = g.year || null;
    if (g.engineCode && KNOWN_ISSUES[g.engineCode]) {
        KNOWN_ISSUES[g.engineCode].forEach(i => { if (issueMatchesYear(i, year)) out.push({ ...i, source: g.engineCode }); });
    }
    if (g.transCode && KNOWN_ISSUES[g.transCode]) {
        KNOWN_ISSUES[g.transCode].forEach(i => { if (issueMatchesYear(i, year)) out.push({ ...i, source: 'КПП ' + g.transCode }); });
    }
    const pf = platformOf(g.body, g.model);
    if (pf && PLATFORM_ISSUES[pf]) {
        PLATFORM_ISSUES[pf].forEach(i => { if (issueMatchesYear(i, year)) out.push({ ...i, source: 'кузов' }); });
    }
    // серьёзные — выше
    const w = { high: 0, medium: 1, low: 2 };
    out.sort((a, b) => (w[a.severity] ?? 1) - (w[b.severity] ?? 1));
    return out;
}

/* ============ МОДАЛКА: ТИПИЧНЫЕ ПРОБЛЕМЫ ============
   Вынесена из карточки VIN, чтобы не перегружать её: в карточке
   остаётся только миникнопка «⚠️ Болячки» со счётчиком. */
function oIssues(gid) {
    const g = (gid && G.find(x => x.id === gid)) || gAV();
    if (!g) { toast('VIN не выбран — добавьте машину в гараж', 'danger'); return; }
    window._issGid = g.id;
    const issues = issuesForGarageCar(g);
    $('issmo_title').textContent = '⚠️ Типичные проблемы · …' + (g.vin ? g.vin.slice(-6) : '');
    let h = '';
    if (!issues.length) {
        h = '<p style="font-size:.85rem;color:var(--mu);line-height:1.6">Для этой машины записей нет. Укажите код двигателя и семейство КПП в «✎ Уточнить данные» — справочник подберёт болячки мотора, коробки и кузова.</p>';
    } else {
        const nH = issues.filter(i => i.severity === 'high').length;
        h += '<div class="iss-head">'
            + '<div class="vin-issues-legend"><span class="lg high">🔴 важно — следить обязательно</span><span class="lg medium">🟡 типично для модели</span><span class="lg low">🟢 мелочи</span></div>'
            + (g.year ? '<div class="iss-year">Год выпуска: <b>' + esc(g.year) + '</b> — записи вне вашего года отфильтрованы</div>' : '')
            + '</div>';
        /* Группы по источнику: двигатель / КПП / кузов */
        const bySrc = {};
        issues.forEach(i => { (bySrc[i.source] = bySrc[i.source] || []).push(i); });
        const srcIcon = s => s === 'кузов' ? '🚗' : String(s).startsWith('КПП') ? '🔄' : '⚙️';
        const srcTitle = s => s === 'кузов' ? 'Кузов / платформа' : String(s).startsWith('КПП') ? 'Коробка передач ' + s.replace('КПП ', '') : 'Двигатель ' + s + (ENGINES[s] ? ' — ' + ENGINES[s].v + ' ' + ENGINES[s].hp + ' л.с.' : '');
        Object.keys(bySrc).forEach(src => {
            const arr = bySrc[src];
            const gH = arr.filter(i => i.severity === 'high').length;
            h += '<details class="iss-src" open><summary><span class="iss-src-ic">' + srcIcon(src) + '</span>'
                + '<span class="iss-src-t">' + esc(srcTitle(src)) + '</span>'
                + '<span class="pr-count' + (gH ? ' hi' : '') + '">' + arr.length + '</span></summary><div class="iss-src-body">';
            arr.forEach(i => {
                const cls = i.severity === 'high' ? 'high' : i.severity === 'medium' ? 'medium' : 'low';
                h += '<div class="vin-issue ' + cls + '"><span class="vin-issue-text">' + esc(i.issue) + '</span>'
                    + (i.year && i.year !== 'all' ? '<span class="vin-issue-year">' + esc(i.year) + '</span>' : '') + '</div>';
            });
            h += '</div></details>';
        });
        h += '<p class="iss-note">Справочник составлен по опыту сообществ VAG и не является диагнозом: конкретную машину проверяйте по факту. ' + (nH ? 'Записи 🔴 — то, с чего стоит начать осмотр.' : '') + '</p>';
    }
    $('issmo_body').innerHTML = h;
    openM('issmo');
}
function cIss() { closeM('issmo'); }

/* ============ КАБИНЕТ ВЛАДЕЛЬЦА («Моя машина») ============
   Один экран собирает всё, что приложение уже знает: ТО, журнал,
   расходы по годам, открытые статусы покупок, критичные болячки. */
function rDash() {
    const ar = $('ca'); if (!ar) return;
    window._maintActive = false;
    const av = gAV();
    if (!av) {
        ar.innerHTML = '<div class="emp"><div class="empi">🚘</div><p><b>Машина не выбрана</b></p>'
            + '<p style="font-size:.8rem;color:var(--mu)">Добавьте VIN в гараж — и кабинет соберёт всё известное о машине: ТО, журнал, расходы, статусы покупок и болячки.</p>'
            + '<button class="bn p" onclick="oGM()">+ Добавить VIN</button></div>';
        return;
    }
    const col = lafColor(av.bodyColor);
    let h = '<div class="dash-head"><div class="dash-car">'
        + '<span class="dash-ico">' + giBodyIcon(av) + '</span>'
        + '<div><div class="dash-vin">' + esc(av.vin) + '</div>'
        + '<div class="dash-desc">' + esc([av.brand, av.model, av.year].filter(Boolean).join(' ') || '—')
        + (col ? ' · <span class="gi-dot" style="background:' + col.hex + '"></span> ' + esc(col.ru) : '')
        + (av.engineCode ? ' · ⚙ ' + esc(av.engineCode) : '') + (av.gearboxCode ? ' · 🔄 ' + esc(av.gearboxCode) : '')
        + '</div></div></div></div>';

    const t = nextTO();
    h += '<div class="dash-grid">';
    /* ТО */
    const urgent = t && (t.daysLeft <= 7 || t.kmLeft <= 500);
    h += '<div class="dash-card' + (urgent ? ' warn' : '') + '"><div class="dc-h">🛠 Ближайшее ТО</div>'
        /* ✅ 1.10.4: пробег живёт прямо в карточке ТО — обновил километры,
           и счётчик остатка пересчитался тут же, под полем. Раньше поле
           было в шапке кабинета, а результат — в карточке: неудобно.
           Показываем блок и когда ТО ещё не настроено (t === null) —
           карточка как раз просит «укажите пробег». */
        + '<div class="dash-km"><label for="dashKm">Пробег, км</label><div class="dash-km-row">'
        + '<input type="number" id="dashKm" min="0" step="500" value="' + (TO.km != null ? TO.km : '') + '" placeholder="напр. 187300">'
        + '<button class="bn p" data-action="dash-km" title="Сохранить пробег — остаток до ТО пересчитается сразу">Обновить</button>'
        + '<button class="bn" data-action="dash-notify" title="Разрешить push-напоминания о ТО">🔔</button>'
        + '</div></div>';
    if (t) {
        /* ✅ 1.10.1: при расчёте по одометру показываем, сколько уже проехали
           с последнего ТО; без lastKm — честно пишем, что это оценка по дате. */
        let sub;
        if (t.kmLeft <= 0 || t.daysLeft <= 0) sub = '⚠ пора на сервис!';
        else if (t.byKm) sub = 'с последнего ТО (' + t.lastKm.toLocaleString('ru-RU') + ' км) проехали ' + t.kmSince.toLocaleString('ru-RU') + ' км · интервал ' + t.interval.toLocaleString('ru-RU') + ' км';
        else sub = 'до следующего обслуживания · интервал ' + t.interval.toLocaleString('ru-RU') + ' км · ⚠ оценка по дате — укажите пробег на момент ТО';
        h += '<div class="dc-big">' + Math.max(0, t.kmLeft).toLocaleString('ru-RU') + ' км · ' + Math.max(0, t.daysLeft) + ' дн</div>'
            + '<div class="dc-sub">' + sub + '</div>'
            + '<div class="dash-btns"><button class="bn" onclick="oShopList()" title="Только расходники ТО: фильтры, жидкости и смазки, ремни, колодки, герметики, пробка поддона">🛒 Список покупок</button><button class="bn" onclick="oTO()">✏️ Параметры</button></div>';
    } else {
        h += '<div class="dc-sub">Укажите пробег и пробег/дату последнего ТО — виджет посчитает остаток</div>'
            + '<div class="dash-btns"><button class="bn p" onclick="oTO()">🛠 Настроить ТО</button></div>';
    }
    h += '</div>';
    /* Журнал + расходы — ✅ 1.10.0: только этой машины (переключатель
       «все машины» в журнале на кабинет не влияет) */
    const logs = vinLogs().slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const spend = {};
    logs.forEach(l => {
        if (l.cost == null) return;
        const cur = l.currency || 'RUB';
        const y = String(l.date || '').slice(0, 4) || 'б/д';
        spend[y] = spend[y] || {}; spend[y][cur] = (spend[y][cur] || 0) + (Number(l.cost) || 0);
    });
    const years = Object.keys(spend).sort();
    const yearTot = y => Object.values(spend[y]).reduce((s, x) => s + x, 0);
    const maxYear = Math.max.apply(null, years.map(yearTot).concat([1]));
    h += '<div class="dash-card"><div class="dc-h">📖 Журнал и расходы</div>';
    if (logs.length) {
        h += '<ul class="dash-log">' + logs.slice(0, 4).map(l =>
            '<li><span class="dl-d">' + esc(fD(l.date) || l.date || '') + '</span>'
            + '<span class="dl-t">' + esc(l.title || '') + '</span>'
            + (l.km ? '<span class="dl-km">' + Number(l.km).toLocaleString('ru-RU') + ' км</span>' : '')
            + (l.cost != null ? '<span class="dl-c">' + esc(fP(l.cost, l.currency)) + '</span>' : '') + '</li>').join('') + '</ul>';
        if (years.length) {
            /* ✅ 1.10.5: полоска расходов больше не вылезает за карточку.
               Раньше год, заливка и сумма лежали в одном flex-ряду, и
               width:100% у заливки считался от ширины ВСЕГО ряда — сумма
               уезжала за границу виджета (тем сильнее, чем крупнее расходы).
               Теперь ряд — сетка «год | трек | сумма», процент заливки
               считается только от её дорожки, а сумма живёт в своей
               колонке и при нехватке места сокращается многоточием. */
            h += '<div class="dc-bars">' + years.slice(-5).map(y => {
                const tot = yearTot(y);
                const w = Math.min(100, Math.max(4, Math.round(tot / maxYear * 100)));
                /* Сумма года — со знаком валюты; если валют несколько,
                   показываем разбивку (иначе сумма «в кучу» без знака валюты
                   вводит в заблуждение). Порядок валют — по алфавиту, чтобы
                   вывод не зависел от порядка записей в журнале. */
                const cs = Object.keys(spend[y]).sort();
                const val = cs.map(c => fP(spend[y][c], c)).join(' + ');
                return '<div class="dc-bar" title="' + escA(y + ': ' + val) + '">'
                    + '<span class="dc-bar-y">' + esc(y) + '</span>'
                    + '<span class="dc-bar-t"><i class="dc-bar-f" style="width:' + w + '%"></i></span>'
                    + '<span class="dc-bar-v">' + esc(val) + '</span></div>';
            }).join('') + '</div>';
        }
    } else {
        h += '<div class="dc-sub">Журнал пуст — зафиксируйте первую работу</div>';
    }
    h += '<div class="dash-btns"><button class="bn" onclick="oLogNew()">➕ Запись</button><button class="bn" onclick="goCat(\'Log\')">📖 Весь журнал</button></div></div>';
    /* Покупки */
    const want = D.filter(p => p.status === 'want'), bought = D.filter(p => p.status === 'bought');
    h += '<div class="dash-card"><div class="dc-h">🛒 Покупки</div>'
        + '<div class="dc-big">' + want.length + ' хочу · ' + bought.length + ' куплено</div>';
    const stList = want.concat(bought).slice(0, 5);
    if (stList.length) {
        h += '<ul class="dash-log">' + stList.map(p =>
            '<li><button type="button" class="dl-link" data-action="dash-part" data-id="' + escA(p.id) + '">' + esc(p.oem || '—') + '</button>'
            + '<span class="dl-t">' + esc(p.name || '') + '</span>'
            + '<span class="dl-km">' + (p.status === 'want' ? '🛒' : '📦') + '</span></li>').join('') + '</ul>';
    }
    h += '</div>';
    /* Болячки */
    const iss = issuesForGarageCar(av).filter(i => i.severity === 'high').slice(0, 3);
    h += '<div class="dash-card' + (iss.length ? ' warn' : '') + '"><div class="dc-h">⚠️ Проверить в первую очередь</div>';
    h += iss.length
        ? '<ul class="dash-log">' + iss.map(i => '<li><span class="dl-t">' + esc(i.issue) + '</span><span class="dl-km">' + esc(i.source) + '</span></li>').join('') + '</ul>'
        : '<div class="dc-sub">Критичных записей под этот год нет</div>';
    h += '<div class="dash-btns"><button class="bn" onclick="oIssues(\'' + escA(av.id) + '\')">⚠️ Все болячки</button></div></div>';
    h += '</div>';
    ar.innerHTML = h;
    ar.scrollTop = 0;
}
function goCat(id) { SV.activeCat = id; SV.activeSub = null; sU(); rSB(); rC(); }

/* ============ ГОЛОСА ЗА АНАЛОГИ (community-слой) ============
   «Подошёл / не подошёл» по каждому аналогу; хранится локально,
   экспортируется «community-паком» и сливается с чужими паками (max). */
const VOTEKEY = 'vw_analog_votes_v1';
function votesAll() { try { const o = JSON.parse(localStorage.getItem(VOTEKEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
const voteKeyOf = (p, a) => normOem(p.oem) + '|' + normOem(a);
function getVote(p, a) { return votesAll()[voteKeyOf(p, a)] || { ok: 0, bad: 0, my: '' }; }
function voteScore(p, a) { const v = getVote(p, a); return (v.ok || 0) - (v.bad || 0); }
function setVote(p, a, dir) {
    const all = votesAll(); const k = voteKeyOf(p, a);
    const v = all[k] || { ok: 0, bad: 0, my: '' };
    if (v.my === 'ok') v.ok = Math.max(0, (v.ok || 0) - 1);
    if (v.my === 'bad') v.bad = Math.max(0, (v.bad || 0) - 1);
    v.my = (v.my === dir) ? '' : dir;
    if (v.my === 'ok') v.ok = (v.ok || 0) + 1;
    if (v.my === 'bad') v.bad = (v.bad || 0) + 1;
    all[k] = v;
    try { localStorage.setItem(VOTEKEY, JSON.stringify(all)); } catch (e) { }
    return v;
}
function exportVotes() {
    const all = votesAll();
    if (!Object.keys(all).length) { toast('Голосов пока нет — пакет пуст', 'info'); return; }
    dl('analog_votes_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ version: 1, votes: all }, null, 2), 'application/json');
    toast('🧑‍🤝‍🧑 Community-пак голосов выгружен', 'success');
}
function importVotes() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
            try {
                const j = JSON.parse(String(rd.result));
                const src = (j && j.votes && typeof j.votes === 'object') ? j.votes : j;
                const all = votesAll(); let n = 0;
                Object.keys(src || {}).forEach(k => {
                    const s = src[k];
                    if (!s || typeof s !== 'object') return;
                    const cur = all[k] || { ok: 0, bad: 0, my: '' };
                    cur.ok = Math.max(cur.ok || 0, s.ok || 0);
                    cur.bad = Math.max(cur.bad || 0, s.bad || 0);
                    all[k] = cur; n++;
                });
                try { localStorage.setItem(VOTEKEY, JSON.stringify(all)); } catch (e) { }
                toast('Импортировано голосов: ' + n, 'success');
                if (partmoId) oPC(partmoId);
                rC();
            } catch (e) { toast('Файл голосов не читается', 'danger'); }
        };
        rd.readAsText(f);
    };
    inp.click();
}

/* ============ 1.9.0: АНАЛОГИ — ЦЕПОЧКИ + БАЗА ЗНАНИЙ ============
   Три источника аналогов в карточке:
   · db    — analogs из данных (заполнено владельцем базы);
   · chain — транзитивное замыкание: «аналог аналога» через общий
             кросс-код (union-find по сегментам OEM и кодам аналогов);
   · kb    — data/analogs.json: внешняя база знаний кросс-номеров
             (drive2.ru топ-кроссы + цепочки замен VAG). Требует
             проверки — потому с бейджем ❓ и голосами 👍/👎.
   Мусорные строки без цифр («USEDPART», «Kolbenschmidt») в граф
   НЕ попадают — только отображаются как есть. Компоненты больше
   _AN_MAX не сливаются (защита от ложных цепей). */
let AKB = {};        // normOem → [«Бренд Код»] (из data/analogs.json)
let _anIdx = null;   // normCode → [part id] — индекс для сканера/поиска
const _AN_MAX = 32;

/* Сегменты мульти-артикула «030 121 008 D · DX» → ['030121008D']
   (хвосты-суффиксы без цифр вроде «DX» отбрасываются).

   1.10.6: фильтр ужесточён. Раньше достаточно было «≥5 символов + цифра»,
   и в граф кроссов попадали описания вместо артикулов: «Universeel 10.9»
   (класс прочности), «Universeel М12», «Universeel 10 см», «Universal 200А».
   Такие узлы оказывались общими для разных деталей и склеивали их в одну
   компоненту — у «Гайки крепления тормозного шланга» в аналогах появлялся
   динамик «Pioneer TS-G1033i» (связка через «Universeel М10» ↔ «Universeel
   10 см»), у «Болта стартера М10» — болты крепления амортизатора. Итог:
   43 ложных кода в 15 записях. Теперь в граф не пускаем строки с кириллицей
   и со словами-описаниями; сами строки в данных перенесены в инструкции
   (tools/migrate-1.10.6.js, правило M3) — информация не потеряна.
   Правило «≥3 цифр» НЕ вводили намеренно: оно отсекло бы настоящие
   артикулы aftermarket — MAHLE LAK 63, GMB GWVW-13A, NGK BKR6E, ATE SL.6.
   Зеркальное правило — codeOk в tools/build-analogs.js (держать синхронно). */
const AN_JUNK_RE = /\b(universeel|universal|used\s*part|repro|refurbished)\b/i;
const anCodeOk = s => {
    const raw = String(s || '');
    if (/[а-яА-ЯёЁ]/.test(raw)) return false;
    if (AN_JUNK_RE.test(raw)) return false;
    const n = normOem(raw);
    return n.length >= 5 && /[0-9]/.test(n);
};
const oemSegs = o => String(o || '').split('·').map(s => normOem(s)).filter(anCodeOk);

function normalizeAKB(raw) {
    const out = {};
    const src = raw && typeof raw === 'object' ? (raw.kb && typeof raw.kb === 'object' ? raw.kb : raw) : null;
    if (!src) return out;
    Object.keys(src).forEach(k => {
        const nk = normOem(String(k).replace(/^\s*VAG\s+/i, ''));
        if (!nk) return;
        const arr = Array.isArray(src[k]) ? src[k] : [src[k]];
        const vals = Array.from(new Set(arr.map(x => String(x || '').trim()).filter(x => x && anCodeOk(x))));
        if (vals.length) out[nk] = vals;
    });
    return out;
}

function applyAnalogKb() {
    if (!Array.isArray(D) || !D.length) { _anIdx = {}; return { chain: 0, kb: 0 }; }
    const t0 = Date.now();
    /* 1. Существующие аналоги помечаем как db (данные владельца) */
    D.forEach(p => {
        if (!Array.isArray(p.analogs)) p.analogs = [];
        if (!p.analogSrc || typeof p.analogSrc !== 'object') p.analogSrc = {};
        p.analogs.forEach(a => { const n = normOem(a); if (n && !p.analogSrc[n]) p.analogSrc[n] = 'db'; });
    });
    /* 2. Граф кроссов: сегменты OEM ↔ коды аналогов ↔ база знаний */
    const parent = {};
    const addNode = x => { if (!(x in parent)) parent[x] = x; };
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
    const disp = {}, dispDb = {}, segDisp = {}, kbNodes = {};
    D.forEach(p => {
        String(p.oem || '').split('·').forEach(seg => { const n = normOem(seg); if (n && !segDisp[n]) segDisp[n] = seg.trim(); });
        const segs = oemSegs(p.oem);
        segs.forEach(addNode);
        p.analogs.forEach(a => {
            if (!anCodeOk(a)) return;
            const n = normOem(a);
            addNode(n);
            if (!dispDb[n]) { disp[n] = String(a).trim(); dispDb[n] = 1; }
            segs.forEach(s => uni(s, n));
        });
    });
    Object.keys(AKB).forEach(k => {
        (AKB[k] || []).forEach(code => {
            const nc = normOem(String(code).replace(/^\s*VAG\s+/i, ''));
            if (!anCodeOk(nc)) return;
            addNode(k); addNode(nc);
            if (!disp[nc]) disp[nc] = String(code).trim();
            kbNodes[nc] = 1; kbNodes[k] = 1;
            uni(k, nc);
        });
    });
    /* 3. Компоненты связности */
    const comps = {};
    Object.keys(parent).forEach(n => { const r = find(n); (comps[r] = comps[r] || []).push(n); });
    /* 4. Слияние в детали */
    let addedChain = 0, addedKb = 0, skippedBig = 0;
    D.forEach(p => {
        const own = new Set(oemSegs(p.oem));
        const have = new Set(p.analogs.map(a => normOem(a)).filter(Boolean));
        const roots = new Set();
        own.forEach(s => { if (s in parent) roots.add(find(s)); });
        p.analogs.forEach(a => { const n = normOem(a); if (anCodeOk(n) && (n in parent)) roots.add(find(n)); });
        roots.forEach(r => {
            const comp = comps[r] || [];
            if (comp.length > _AN_MAX) { skippedBig++; return; }
            comp.forEach(n => {
                if (own.has(n) || have.has(n)) return;
                const d = disp[n] || segDisp[n] || n;
                p.analogs.push(d); have.add(n);
                const isKb = kbNodes[n] && !dispDb[n] && !segDisp[n];
                p.analogSrc[n] = isKb ? 'kb' : 'chain';
                if (isKb) addedKb++; else addedChain++;
            });
        });
    });
    /* 5. Индекс «код → детали» для сканера и кросс-поиска.
       Двойные ключи: полная норма («BOSCH1987432300») и без бренда
       («1987432300») — коробка на фото может нести только цифры. */
    const idx = {};
    const put = (n, id) => {
        if (!n || n.length < 5) return;
        const arr = idx[n] = idx[n] || [];
        if (arr.length < 50 && !arr.includes(id)) arr.push(id);
    };
    const stripBrand = s => {
        const m = String(s).match(/^\s*[A-Za-zА-Яа-яЁё.\-]{2,}\s+(.+)$/);
        return m ? m[1] : '';
    };
    D.forEach(p => {
        oemSegs(p.oem).forEach(n => put(n, p.id));
        (p.analogs || []).forEach(a => {
            const n = normOem(a);
            if (anCodeOk(n)) put(n, p.id);
            const s = normOem(stripBrand(a));
            if (anCodeOk(s)) put(s, p.id);
        });
    });
    _anIdx = idx;
    console.log('[analogKb] +' + addedChain + ' цепочка · +' + addedKb + ' KB · индекс ' + Object.keys(idx).length + ' кодов · ' + Math.round(Date.now() - t0) + 'ms' + (skippedBig ? ' · пропущено больших компонент: ' + skippedBig : ''));
    return { chain: addedChain, kb: addedKb };
}

/* Единая точка поиска детали по любому коду: артикул (включая
   сегменты «·»), аналог из базы, цепочка или база знаний. */
function findPartByCode(code) {
    const n = normOem(code);
    if (!n) return null;
    let p = D.find(x => normOem(x.oem) === n);
    if (p) return { p, via: 'oem', matched: p.oem || n };
    p = D.find(x => oemSegs(x.oem).includes(n));
    if (p) return { p, via: 'oem', matched: p.oem || n };
    if (_anIdx && _anIdx[n]) {
        for (const id of _anIdx[n]) {
            const q = D.find(x => x.id === id);
            if (!q) continue;
            const hit = (q.analogs || []).find(a => normOem(a) === n || normOem(stripBrandLocal(a)) === n);
            const src = (q.analogSrc && q.analogSrc[n]) || 'db';
            return { p: q, via: src === 'kb' ? 'kb' : 'analog', matched: hit || n };
        }
    }
    return null;
}
const stripBrandLocal = s => {
    const m = String(s).match(/^\s*[A-Za-zА-Яа-яЁё.\-]{2,}\s+(.+)$/);
    return m ? m[1] : s;
};

/* ============ НАПОМИНАНИЯ О ТО ============ */
function toReminderMsg() {
    const t = nextTO(); if (!t) return null;
    const overdue = t.kmLeft <= 0 || t.daysLeft <= 0;
    const soon = t.daysLeft <= 14 || t.kmLeft <= 500;
    if (!overdue && !soon) return null;
    let last = '';
    try { last = localStorage.getItem('vw_to_remind_v1') || ''; } catch (e) { }
    const today = new Date().toISOString().slice(0, 10);
    if (last === today) return null;
    try { localStorage.setItem('vw_to_remind_v1', today); } catch (e) { }
    return overdue
        ? '🛠 Пора на ТО: интервал превышен на ' + Math.abs(Math.min(0, t.kmLeft)).toLocaleString('ru-RU') + ' км / ' + Math.abs(Math.min(0, t.daysLeft)) + ' дн'
        : '🛠 ТО скоро: осталось ' + t.kmLeft.toLocaleString('ru-RU') + ' км / ' + t.daysLeft + ' дн';
}
function fireToReminder() {
    const msg = toReminderMsg(); if (!msg) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try { new Notification('База Мастера', { body: msg }); return; } catch (e) { }
    }
    setTimeout(() => toast(msg, 'info'), 1200);
}
function askToNotify() {
    if (typeof Notification === 'undefined') { toast('Браузер не поддерживает уведомления', 'info'); return; }
    if (Notification.permission === 'granted') { toast('🔔 Напоминания уже включены', 'success'); return; }
    Notification.requestPermission().then(p => toast(p === 'granted' ? '🔔 Напоминания о ТО включены' : 'Уведомления не разрешены', p === 'granted' ? 'success' : 'info'));
}

/* ============ СИНОНИМЫ ПОИСКА ============
   Сленг мастеров и EN-термины → термины каталога (nz-форма). */
const SYNONYMS = {
    'грм': ['ремень', 'ролик', 'натяжител'],
    'дворники': ['щетк'], 'дворник': ['щетк'], 'wiper': ['щетк'],
    'ожи': ['охлажд'], 'тосол': ['охлажд'], 'coolant': ['охлажд'],
    'маслофильтр': ['фильтр'], 'oilfilter': ['фильтр'],
    'воздушник': ['воздуш'], 'салонник': ['салон'],
    'помпа': ['насос'], 'waterpump': ['насос'],
    'ламбда': ['лямбда'], 'lambda': ['лямбда'],
    'шаровые': ['шаров'], 'сайленты': ['сайлент'],
    'ступа': ['ступиц'], 'hub': ['ступиц'],
    'belt': ['ремен', 'ремн'], 'filter': ['фильтр'], 'pads': ['колодк'],
    'plugs': ['свеч'], 'spark': ['свеч'], 'brakes': ['тормоз'],
    'candy': ['candy'], 'tornero': ['tornado']
};

/* ============ СКАНЕР: VIN / штрих-код детали (камера) ============
   BarcodeDetector (Chrome/Android, WebView в APK): QR, EAN-13, Code128/39.
   Распознанный VIN → форма гаража с подставленным значением;
   артикул/EAN → карточка детали или поиск по кросс-индексу. */
let _scanStream = null, _scanTimer = null;
/* ✅ 1.9.0: извлечение ВСЕХ кандидатов-кодов из подписи/текста.
   Порядок важен: сначала строка целиком (бренд+код как в базе),
   затем шаблоны: VW-OEM «030 115 561 AB», компактный OEM,
   брендовые коды «W 719/45», «PP831», «CT979», цифровые группы
   Bosch «1 987 432 300», EAN-13/8. */
function extractCodes(s) {
    const t = String(s || '');
    const out = [];
    const push = x => { const n = normOem(x); if (anCodeOk(n) && !out.includes(n)) out.push(n); };
    push(t);
    const pats = [
        /\b\d{3}\s?\d{3}\s?\d{3}(?:\s?[A-Z]{1,2})?\b/gi,
        /\b\d{9,12}[A-Z]{1,2}\b/g,
        /\b[A-Z]{1,6}\s?\d{2,7}(?:\s?\/\s?\d{1,3})?\b/gi,
        /\b\d{1,3}(?:\s\d{3}){1,3}\s?\d{0,3}\b/g,
        /\b\d{13}\b/g,
        /\b\d{8}\b/g
    ];
    pats.forEach(re => {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(t)) !== null) { push(m[0]); if (out.length >= 14) break; }
    });
    return out.slice(0, 14);
}
function classifyScan(s) {
    const t = String(s || '').trim();
    if (!t) return { type: 'text', value: '' };
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(t)) return { type: 'vin', value: t.toUpperCase(), cands: [t.toUpperCase()] };
    const art = t.replace(/[^A-Za-z0-9]/g, '');
    if (/^\d{8,14}$/.test(art)) return { type: 'art', value: art.toUpperCase(), cands: extractCodes(t) };   // EAN/UPC
    if (art.length >= 5) return { type: 'art', value: art.toUpperCase(), cands: extractCodes(t) };
    return { type: 'text', value: t, cands: extractCodes(t) };
}
function applyScan(res) {
    if (!res || !res.value) { toast('Пустой код', 'danger'); return; }
    if (res.type === 'vin') {
        cScan();
        if (pubGuard()) return;
        oGM();
        setTimeout(() => {
            const inp = $('g_vi');
            if (inp) { inp.value = res.value; try { inp.dispatchEvent(new Event('input')); } catch (e) { } }
        }, 60);
        toast('📷 VIN считан: …' + res.value.slice(-6) + ' — проверьте и сохраните', 'success');
        return;
    }
    /* ✅ 1.9.0: перебор всех извлечённых кодов — артикул (включая
       сегменты «·»), аналог из базы, цепочка кроссов или база знаний. */
    const cands = (Array.isArray(res.cands) && res.cands.length) ? res.cands : [normOem(res.value)].filter(Boolean);
    let hit = null;
    for (const c of cands) { hit = findPartByCode(c); if (hit) break; }
    cScan();
    if (hit) {
        oPC(hit.p.id);
        toast(hit.via === 'oem'
            ? '📷 Найдена деталь: ' + (hit.p.oem || hit.p.name)
            : '📷 Найдено по ' + (hit.via === 'kb' ? 'базе знаний' : 'аналогу') + ' «' + hit.matched + '» → ' + (hit.p.oem || hit.p.name), 'success');
        return;
    }
    SV.searchQuery = res.value; if ($('sr')) $('sr').value = res.value;
    uSC(); rC();
    toast('📷 Точного совпадения нет — показан поиск по коду', 'info');
}
function oScan() {
    openM('scanmo');
    const st = $('scanStatus');
    if (st) st.textContent = 'Запускаю камеру…';
    if (typeof window.BarcodeDetector === 'undefined') {
        if (st) st.textContent = 'Этот браузер не поддерживает BarcodeDetector — вставьте код вручную ниже.';
        return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (st) st.textContent = 'Камера недоступна — вставьте код вручную ниже.';
        return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
        _scanStream = stream;
        const v = $('scanVideo');
        if (v) { v.srcObject = stream; v.play().catch(() => { }); }
        let det;
        try { det = new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'data_matrix'] }); }
        catch (e) { if (st) st.textContent = 'Детектор штрих-кодов не запустился — вставьте код вручную.'; stopScan(); return; }
        const tick = () => {
            if (!_scanStream) return;
            det.detect(v).then(codes => {
                if (!_scanStream) return;
                if (codes && codes.length) { const raw = codes[0].rawValue; stopScan(); applyScan(classifyScan(raw)); return; }
                _scanTimer = setTimeout(tick, 350);
            }).catch(() => { _scanTimer = setTimeout(tick, 700); });
        };
        tick();
        if (st) st.textContent = 'Наведите камеру на VIN-стикер или штрих-код детали…';
    }).catch(() => {
        stopScan();
        if (st) st.textContent = 'Нет доступа к камере — вставьте код вручную ниже.';
    });
}
function stopScan() {
    if (_scanStream) { _scanStream.getTracks().forEach(t => t.stop()); _scanStream = null; }
    if (_scanTimer) { clearTimeout(_scanTimer); _scanTimer = null; }
    const v = $('scanVideo'); if (v) v.srcObject = null;
}
function cScan() { stopScan(); closeM('scanmo'); }

/* ============ СХЕМЫ УЗЛОВ: фото + нумерованные маркеры ============
   Своя замена взрыв-схемам ETKA: фотография узла (или чертёж) + точки,
   пронумерованные по списку позиций подгруппы. Хранится локально
   (localStorage, фото сжимаются до 1400px JPEG). */
const SCH_KEY = 'vw_schemes_v1';
function schAll() { try { const o = JSON.parse(localStorage.getItem(SCH_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
function schGet(key) { const v = schAll()[key]; return v && Array.isArray(v.photos) ? v : { photos: [], marks: [] }; }
function schSet(key, val) {
    const all = schAll(); all[key] = val;
    try { localStorage.setItem(SCH_KEY, JSON.stringify(all)); return true; }
    catch (e) { toast('Хранилище переполнено — удалите часть фото', 'danger'); return false; }
}
function oScheme(cat, sub) {
    if (!sub) { toast('У позиции не указана подгруппа — схема недоступна', 'info'); return; }
    window._sch = { key: cat + '|' + sub, cat: cat, sub: sub, photo: 0, active: 1, data: schGet(cat + '|' + sub) };
    renderSch();
    openM('schmo');
}
function cSch() { closeM('schmo'); window._sch = null; }
function renderSch() {
    const s = window._sch; if (!s) return;
    const parts = D.filter(p => p.cat === s.cat && (p.sub || '').trim() === s.sub)
        .sort((a, b) => _maintWeight(a) - _maintWeight(b) || String(a.oem || '').localeCompare(String(b.oem || '')));
    s.parts = parts;
    const ph = s.data.photos[s.photo];
    let h = '<div class="sch-top"><b>📐 Схема узла: ' + esc(catL(s.cat)) + ' › ' + esc(s.sub) + '</b>'
        + '<span class="sch-cnt">' + parts.length + ' поз. · сохраняется на этом устройстве</span></div>';
    h += '<div class="sch-stage" id="schStage">'
        + (ph
            ? '<img src="' + ph + '" alt="Схема узла">'
            + '<svg class="sch-marks" viewBox="0 0 100 100" preserveAspectRatio="none">'
            + s.data.marks.filter(m => m.ph === s.photo).map(m =>
                '<g class="sch-mk' + (m.n === s.active ? ' act' : '') + '" data-n="' + m.n + '">'
                + '<circle cx="' + m.x + '" cy="' + m.y + '" r="3.6"/>'
                + '<text x="' + m.x + '" y="' + (m.y + 1.3) + '" text-anchor="middle">' + m.n + '</text></g>').join('')
            + '</svg>'
            : '<div class="sch-empty">Схемы пока нет.<br>Добавьте фото узла или чертёж — и расставьте номера по списку ниже.</div>')
        + '</div>';
    h += '<div class="sch-tools"><button type="button" class="bn" onclick="schPick()">📷 Добавить фото</button>'
        + (ph ? '<button type="button" class="bn" onclick="schDelPhoto()">🗑 Фото</button>'
            + '<button type="button" class="bn" onclick="schClearMarks()">✖ Маркеры</button>' : '')
        + '<span class="sch-hint">' + (ph ? 'Выберите номер в списке → кликните по фото, чтобы поставить точку. Клик по точке — выбрать номер.' : '') + '</span></div>';
    if (s.data.photos.length > 1) {
        h += '<div class="sch-strip">' + s.data.photos.map((p, i) =>
            '<img class="' + (i === s.photo ? 'on' : '') + '" src="' + p + '" alt="" onclick="schPhoto(' + i + ')">').join('') + '</div>';
    }
    h += '<div class="sch-list">' + (parts.length
        ? parts.map((p, i) => '<button type="button" class="sch-li' + ((i + 1) === s.active ? ' act' : '') + '" onclick="schActive(' + (i + 1) + ')">'
            + '<span class="sch-n">' + (i + 1) + '</span>'
            + '<span class="sch-oem">' + esc(p.oem || '—') + '</span>'
            + '<span class="sch-nm">' + esc(p.name || '') + '</span></button>').join('')
        : '<p style="color:var(--mu);font-size:.8rem">В этой подгруппе пока нет позиций.</p>') + '</div>';
    $('schmo_body').innerHTML = h;
    const stg = $('schStage');
    if (stg) stg.onclick = e => {
        const s2 = window._sch; if (!s2 || !s2.data.photos[s2.photo]) return;
        const mk = e.target.closest ? e.target.closest('.sch-mk') : null;
        if (mk) { s2.active = +mk.getAttribute('data-n'); renderSch(); return; }
        const r = stg.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100;
        if (x < 0 || y < 0 || x > 100 || y > 100) return;
        s2.data.marks = s2.data.marks.filter(m => !(m.ph === s2.photo && m.n === s2.active));
        s2.data.marks.push({ n: s2.active, x: +x.toFixed(1), y: +y.toFixed(1), ph: s2.photo });
        schSet(s2.key, s2.data);
        renderSch();
    };
}
function schActive(n) { const s = window._sch; if (!s) return; s.active = n; renderSch(); }
function schPhoto(i) { const s = window._sch; if (!s) return; s.photo = i; renderSch(); }
function schClearMarks() {
    const s = window._sch; if (!s) return;
    s.data.marks = s.data.marks.filter(m => m.ph !== s.photo);
    schSet(s.key, s.data); renderSch();
}
function schDelPhoto() {
    const s = window._sch; if (!s) return;
    const d = s.photo;
    s.data.photos.splice(d, 1);
    s.data.marks = s.data.marks.filter(m => m.ph !== d).map(m => m.ph > d ? Object.assign({}, m, { ph: m.ph - 1 }) : m);
    s.photo = Math.max(0, Math.min(d, s.data.photos.length - 1));
    schSet(s.key, s.data); renderSch();
}
function schPick() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => schAddPhoto(rd.result);
        rd.readAsDataURL(f);
    };
    inp.click();
}
/* Community-пак схем: экспорт/импорт локальных схем (фото + маркеры).
   Слияние осторожное: одинаковые фото схлопываются, маркеры дедуплятся
   по (номер, фото, координаты), чужие фото получают новые индексы. */
function mergeSchemes(base, inc) {
    const out = {};
    Object.keys(base || {}).forEach(k => { out[k] = { photos: (base[k].photos || []).slice(), marks: (base[k].marks || []).slice() }; });
    Object.keys(inc || {}).forEach(k => {
        const b = inc[k] || {};
        const cur = out[k] || (out[k] = { photos: [], marks: [] });
        (b.photos || []).forEach(ph => { if (!cur.photos.includes(ph)) cur.photos.push(ph); });
        (b.marks || []).forEach(m => {
            const src = (b.photos || [])[m.ph];
            const newPh = src ? cur.photos.indexOf(src) : m.ph;
            if (newPh < 0) return;
            if (!cur.marks.some(x => x.n === m.n && x.ph === newPh && x.x === m.x && x.y === m.y)) {
                cur.marks.push({ n: m.n, x: m.x, y: m.y, ph: newPh });
            }
        });
    });
    return out;
}
function schSetAll(all) {
    try { localStorage.setItem(SCH_KEY, JSON.stringify(all)); return true; }
    catch (e) { toast('Хранилище переполнено — пак импортирован не полностью', 'danger'); return false; }
}
function exportSchemes() {
    const all = schAll();
    if (!Object.keys(all).length) { toast('Схем пока нет — сначала добавьте фото с маркерами', 'info'); return; }
    dl('schemes_pack_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ version: 1, schemes: all }, null, 2), 'application/json');
    toast('📐 Пак схем выгружен: ' + Object.keys(all).length + ' узла(ов)', 'success');
}
function importSchemes() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
            try {
                const j = JSON.parse(String(rd.result));
                const inc = (j && j.schemes && typeof j.schemes === 'object') ? j.schemes : j;
                if (!inc || typeof inc !== 'object') throw new Error('bad');
                const before = Object.keys(schAll()).length;
                const merged = mergeSchemes(schAll(), inc);
                if (schSetAll(merged)) {
                    toast('📐 Импортировано узлов: ' + Object.keys(inc).length + ' (всего стало ' + Object.keys(merged).length + ', было ' + before + ')', 'success');
                    if (window._sch) { window._sch.data = schGet(window._sch.key); renderSch(); }
                }
            } catch (e) { toast('Файл пака схем не читается', 'danger'); }
        };
        rd.readAsText(f);
    };
    inp.click();
}
/* Сжатие фото до 1400px JPEG, чтобы не убить localStorage */
function schAddPhoto(dataUrl) {
    const s = window._sch; if (!s) return;
    const img = new Image();
    img.onload = () => {
        const max = 1400;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * k)), hgt = Math.max(1, Math.round(img.height * k));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = hgt;
        const c2 = cv.getContext('2d'); c2.drawImage(img, 0, 0, w, hgt);
        const url = cv.toDataURL('image/jpeg', 0.82);
        s.data.photos.push(url); s.photo = s.data.photos.length - 1;
        if (schSet(s.key, s.data)) toast('Схема сохранена на устройстве', 'success');
        renderSch();
    };
    img.onerror = () => toast('Не удалось прочитать изображение', 'danger');
    img.src = dataUrl;
}

/* Печатный чек-лист осмотра машины: болячки под этот VIN + базовые пункты.
   Формат «сел в машину → прошёл с бумагой» (как tech-статьи Pelican/ECS). */
function printIssueChecklist() {
    const g = G.find(x => x.id === window._issGid) || gAV(); if (!g) return;
    const issues = issuesForGarageCar(g);
    const base = [
        'Кузов: арки, пороги, ниша запаски, кромки дверей — коррозия',
        'Моторный отсек: ремень/цепь ГРМ и дата замены, течи масла и антифриза',
        'Охлаждение: уровень и цвет ОЖ, подтёки радиатора и помпы',
        'Тормоза: остаток колодок/дисков, возраст жидкости (> 2 лет — замена)',
        'Ходовая: сайлентблоки рычагов, шаровые, наконечники, ступичные люфты',
        'Рулевое: люфт рейки на месте и в движении, пыльники тяг',
        'Электрика: клеммы АКБ, заряд генератора, жгут гофры двери багажника (6N2)',
        'Тест-драйв: синхронизаторы КПП под нагрузкой, турбина и ТНВД (TDI/SDI)'
    ];
    const w = window.open('', '_blank');
    if (!w) { toast('Браузер заблокировал всплывающее окно', 'danger'); return; }
    const css = '<style>body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;max-width:720px;margin:0 auto}'
        + 'h1{font-size:17px;margin:0 0 4px}h2{font-size:14px;margin:18px 0 6px}.sub{font-size:11px;color:#666;margin-bottom:14px}'
        + 'ul{list-style:none;padding:0;margin:0}li{margin:7px 0;font-size:13px;line-height:1.5}'
        + '.box{display:inline-block;width:12px;height:12px;border:1.5px solid #333;margin-right:8px;vertical-align:-2px}'
        + '.sev{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.03em}.hi{color:#a11}.me{color:#a60}.lo{color:#370}'
        + '.src{font-size:11px;color:#888}.note{margin-top:14px;font-size:11px;color:#888}</style>';
    let h = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Чек-лист осмотра — ' + esc(g.vin || '') + '</title>' + css + '</head><body>';
    h += '<h1>📋 Чек-лист осмотра автомобиля</h1><div class="sub">VIN ' + esc(g.vin || '—') + ' · ' + esc([g.brand, g.model, g.year].filter(Boolean).join(' '))
        + (g.engineCode ? ' · мотор ' + esc(g.engineCode) : '') + ((g.gearboxCode || g.transCode) ? ' · КПП ' + esc(g.gearboxCode || g.transCode) : '')
        + ' · База Мастера v' + esc(APP_VERSION) + ' · ' + new Date().toLocaleDateString('ru-RU') + '</div>';
    if (issues.length) {
        h += '<h2>⚠ Типичные проблемы этой модели (с учётом года выпуска)</h2><ul>';
        issues.forEach(i => {
            const cls = i.severity === 'high' ? 'hi' : i.severity === 'medium' ? 'me' : 'lo';
            const lb = i.severity === 'high' ? 'важно' : i.severity === 'medium' ? 'типично' : 'мелочи';
            h += '<li><span class="box"></span><span class="sev ' + cls + '">[' + lb + ']</span> ' + esc(i.issue) + ' <span class="src">— ' + esc(i.source) + (i.year && i.year !== 'all' ? ', ' + esc(i.year) : '') + '</span></li>';
        });
        h += '</ul>';
    } else {
        h += '<h2>⚠ Типичные проблемы</h2><ul><li><span class="box"></span>Для этой машины записей нет — проверьте базовые пункты ниже</li></ul>';
    }
    h += '<h2>🔧 Базовый осмотр</h2><ul>' + base.map(b => '<li><span class="box"></span>' + b + '</li>').join('') + '</ul>';
    h += '<div class="note">Заметки: ....................................................................................................</div>';
    h += '<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>';
    w.document.write(h);
    w.document.close();
}

/* ============ ДИПЛИНКИ (#/cat/…, #/part/…, #/vin/…, #/maint/…) ============
   Ссылку на карточку/раздел/машину можно скопировать и открыть позже —
   состояние восстанавливается из hash. Кнопка «назад» браузера работает. */
let _lastSetHash = '';
let _hashReady = false;   // до конца init hash не трогаем, чтобы не затереть входящий диплинк
function setHash(h) {
    const nh = '#' + h;
    if (nh === location.hash) return;
    _lastSetHash = nh;
    location.hash = nh;
}
function syncCatHash() {
    if (!_hashReady) return;
    if (partmoId) return;                                  // поверх каталога открыта карточка
    if (window._maintActive && window._maintViewGid) { setHash('/maint/' + window._maintViewGid); return; }
    setHash('/cat/' + encodeURIComponent(SV.activeCat) + (SV.activeSub ? '/' + encodeURIComponent(SV.activeSub) : ''));
}
function routeHash() {
    const h = decodeURIComponent(location.hash || '');
    let m;
    if ((m = h.match(/^#\/part\/(.+)$/))) { const p = D.find(x => x.id === m[1]); if (p) oPC(p.id); return; }
    if ((m = h.match(/^#\/maint\/(.+)$/))) { const g = G.find(x => x.id === m[1]); if (g) showMaintenanceForVin(g.id); return; }
    if ((m = h.match(/^#\/vin\/(.+)$/))) { const g = G.find(x => x.id === m[1]); if (g && SV.activeVinId !== g.id) setAV(g.id); return; }
    if ((m = h.match(/^#\/cat\/([^/]+)(?:\/(.+))?$/))) {
        SV.activeCat = decodeURIComponent(m[1]);
        SV.activeSub = m[2] ? decodeURIComponent(m[2]) : null;
        sU(); rSB(); rC();
        return;
    }
}
window.addEventListener('hashchange', () => {
    if (location.hash === _lastSetHash) { _lastSetHash = ''; return; }  // это мы сами поставили
    routeHash();
});

/* ====== УТИЛИТЫ ====== */
function getWeekNumber(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return { week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7), year: d.getUTCFullYear() };
}

function getEngineDetails(code) {
    const c = String(code || '').trim().toUpperCase();
    const eng = ENGINES[c];
    if (!eng) return null;
    const fam = engineFamOf(c);
    const kw = eng.hp ? Math.round(eng.hp * 0.7355) : null;
    /* Впрыск: явное поле inj, иначе выводим из обозначения объёма */
    let inj = eng.inj || '';
    if (!inj) {
        const v = String(eng.v || '');
        inj = /SDI/.test(v) ? 'SDI (атмосферный дизель)'
            : /TDI/.test(v) ? 'TDI (турбодизель)'
            : eng.f === 'D' ? 'D (дизель)'
            : 'MPI (распределённый впрыск)';
    }
    const euroMap = { '1': 'Евро-1', '2': 'Евро-2', '3': 'Евро-3', '4': 'Евро-4' };
    return {
        volume: eng.v || '—',
        power: eng.hp ? eng.hp + ' л.с.' + (kw ? ' (' + kw + ' кВт)' : '') : '—',
        family: fam || '',
        injection: inj,
        ecu: eng.ecu || '',
        euro: euroMap[eng.euro] || ''
    };
}
/* Компактная строка расшифровки мотора: «1.4 · 60 л.с. (44 кВт) · MPI · Simos 2P · Евро-2» */
function engineSpecLine(details) {
    if (!details) return '';
    const bits = [details.volume, details.power, details.injection, details.ecu, details.euro].filter(Boolean);
    return bits.join(' · ');
}

const GENERATIONS = {
    '6N1': '6N1 — дорестайл (1994–1999)',
    '6N2': '6N2 — рестайлинг (1999–2001)'
};
const TRIMS = ['Base', 'CL', 'GL', 'Trendline', 'Comfortline', 'Highline', 'Open Air'];

/* ============ АЛИАСЫ ПОДКАТЕГОРИЙ (по категориям) ============ */
const SUB_ALIASES = {
    _all: {
        '': 'Прочее',
        'Разное': 'Прочее',
        'Прочее': 'Прочее',
        'Крепёж': 'Крепёж',
        'Крепёж и прокладки': 'Крепёж',
        'Болты и гайки': 'Крепёж',
    },

    Engine: {
        'Двигатель в сборе': 'Двигатель в сборе и блок цилиндров',
        'Блок цилиндров в сборе': 'Двигатель в сборе и блок цилиндров',
        'Блок цилиндров — детали': 'Двигатель в сборе и блок цилиндров',
        'Блок цилиндров и поршневая': 'Двигатель в сборе и блок цилиндров',
        'Поршни': 'Двигатель в сборе и блок цилиндров',
        'Шатуны': 'Двигатель в сборе и блок цилиндров',
        'Вкладыши': 'Двигатель в сборе и блок цилиндров',
        'ГБЦ': 'ГБЦ и клапаны',
        'ГБЦ и клапанный механизм': 'ГБЦ и клапаны',
        'Клапаны': 'ГБЦ и клапаны',
        'Распредвал': 'ГБЦ и клапаны',
        'Пружины и тарелки': 'ГБЦ и клапаны',
        'Направляющие втулки': 'ГБЦ и клапаны',
        'Маслосъёмные колпачки': 'ГБЦ и клапаны',
        'ГРМ и приводы': 'ГРМ',
        'Привод ГРМ': 'ГРМ',
        'Система смазки': 'Смазка и охлаждение',
        'Система охлаждения': 'Смазка и охлаждение',
        'Фильтры': 'Воздух и топливо',
        'Форсунки': 'Воздух и топливо',
        'Бак / Насос': 'Воздух и топливо',
        'Экология': 'Воздух и топливо',
        'Система впрыска': 'Воздух и топливо',
        'Система впрыска и зажигания': 'Зажигание и датчики',
        'Впускной коллектор': 'Воздух и топливо',
        'Свечи': 'Зажигание и датчики',
        'Катушка': 'Зажигание и датчики',
        'Провода': 'Зажигание и датчики',
        'Трамблёр': 'Зажигание и датчики',
        'Датчики': 'Зажигание и датчики',
        'Система зажигания': 'Зажигание и датчики',
        'Навесное': 'Навесное оборудование',
        'Гидроусилитель руля (опция)': 'Навесное оборудование',
        'Насос ГУР и приводной ремень': 'Навесное оборудование',
        'Навесное оборудование и приводы': 'Навесное оборудование',
        'Опоры двигателя': 'Опоры и сцепление',
        'Прокладки': 'Прокладки и крепёж',
        'Сальники': 'Прокладки и крепёж',
        'Крепёж и прокладки': 'Прокладки и крепёж',
    },

    Fuel: {
        'Форсунки': 'Форсунки',
        'Бак / Насос': 'Бак и насос',
        'Экология': 'Экология (EVAP)',
        'Датчики': 'Датчики',
        'Система впрыска': 'Форсунки',
        'Система впрыска и зажигания': 'Форсунки',
    },

    Ignition: {
        'Свечи': 'Свечи',
        'Катушка': 'Катушка',
        'Провода': 'Провода',
        'Трамблёр': 'Трамблёр',
        'Датчики': 'Датчики',
        'Система зажигания': 'Прочее',
    },

    Cooling: {
        'Термостат / Помпа': 'Помпа и термостат',
        'Помпа': 'Помпа и термостат',
        'Радиатор': 'Радиатор',
        'Датчики': 'Датчики',
        'Патрубки': 'Патрубки и шланги',
        'Шланги ОЖ': 'Патрубки и шланги',
        'Трубопроводы': 'Патрубки и шланги',
        'Фитинги': 'Патрубки и шланги',
        'Хомуты': 'Патрубки и шланги',
        'Вентилятор': 'Вентилятор',
        'Расширительный бачок': 'Расширительный бачок',
        'Система охлаждения': 'Прочее',
        'Кондиционер': 'Кондиционер',
    },

    Heating: {
        'Радиатор печки': 'Радиатор печки',
        'Резистор': 'Резистор и моторчик',
        'Моторчик': 'Резистор и моторчик',
    },

    Brakes: {
        'Передние': 'Передние тормоза',
        'Передние тормоза': 'Передние тормоза',
        'Передний суппорт': 'Передние тормоза',
        'Задние': 'Задние тормоза',
        'Задние тормоза': 'Задние тормоза',
        'ГТЦ': 'ГТЦ и ВУТ',
        'ГТЦ и ВУТ': 'ГТЦ и ВУТ',
        'ABS': 'ABS',
        'Тормозная система с ABS': 'ABS',
        'Шланги': 'Шланги и трубки',
        'Шланги и трубки': 'Шланги и трубки',
        'Трубки и штуцеры': 'Шланги и трубки',
    },

    Suspension: {
        'Передняя': 'Передняя подвеска',
        'Передняя подвеска': 'Передняя подвеска',
        'Рычаги': 'Передняя подвеска',
        'Стабилизатор': 'Передняя подвеска',
        'Задняя': 'Задняя подвеска',
        'Задняя подвеска': 'Задняя подвеска',
        'Ступица': 'Ступица',
        'ШРУС': 'Приводы и ШРУС',
        'Крепёж подвески': 'Крепёж подвески',
        'Болты и гайки': 'Крепёж подвески',
        'Инструмент': 'Инструмент',
        'Рулевое': 'ПЕРЕКИНУТЬ→Steering',
        'Рулевое управление': 'ПЕРЕКИНУТЬ→Steering',
    },

    Steering: {
        'Рулевое': 'Рейка и тяги',
        'Рулевое управление': 'Рейка и тяги',
        'Рейка': 'Рейка и тяги',
        'Тяги': 'Рейка и тяги',
        'ГУР': 'ГУР',
    },

    RearAxle: {
        'Балка': 'Балка',
        'Сайлентблоки': 'Сайлентблоки',
        'Пружины': 'Пружины',
        'Амортизаторы': 'Амортизаторы',
        'Ступица': 'Ступица',
        'Барабаны / Колодки': 'Барабаны и колодки',
        'Ремкомплект': 'Ремкомплект',
        'Тросы / Шланги': 'Тросы и шланги',
    },

    Transmission: {
        'Сцепление': 'Сцепление',
        'КПП / Масла': 'КПП и масла',
        'КПП': 'КПП и масла',
        'Первичный вал': 'Валы и подшипники',
        'Вторичный вал': 'Валы и подшипники',
        'Валы': 'Валы и подшипники',
        'Дифференциал': 'Дифференциал',
        'Шток переключения': 'Кулиса',
        'Тяги и шарниры': 'Кулиса',
        'Трос КПП': 'Кулиса',
        'Кольца': 'Синхронизаторы',
        'Стопорные кольца': 'Синхронизаторы',
        'Прокладки': 'Прокладки и крепёж',
        'Приводы': 'Приводы и ШРУС',
        'ШРУС': 'Приводы и ШРУС',
    },

    Exhaust: {
        'Глушитель': 'Глушитель',
        'Крепёж': 'Крепёж',
        'Выхлопная система': 'Глушитель',
    },

    Electrical: {
        'Питание': 'Питание',
        'Генератор': 'Генератор и стартер',
        'Стартер': 'Генератор и стартер',
        'Генератор и стартер': 'Генератор и стартер',
        'Замок': 'Замок зажигания',
        'Датчики': 'Датчики',
        'Реле': 'Реле и предохранители',
        'Реле и предохранители': 'Реле и предохранители',
        'Приборная панель': 'Приборная панель',
        'Стеклоподъёмники': 'Стеклоподъёмники',
        'Центральный замок': 'Центральный замок',
        'Подогрев сидений': 'Подогрев сидений',
        'Бортовой компьютер': 'Бортовой компьютер',
        'Иммобилайзер': 'Иммобилайзер',
        'Магнитола': 'Магнитола и динамики',
        'Динамики': 'Магнитола и динамики',
        'Обогрев стёкол': 'Обогрев стёкол',
        'Сигнализация': 'Сигнализация',
        'Прикуриватель': 'Прикуриватель',
        'Освещение': 'Освещение',
    },

    Bulbs: {
        'Освещение': 'Лампы',
        'Оптика': 'Оптика',
    },

    Body: {
        'Обвес GTI': 'Обвес',
        'Зеркала': 'Зеркала',
        'Стёкла': 'Стёкла',
        'Капот / Двери': 'Наружные панели',
        'Решётка радиатора': 'Наружные панели',
        'Крылья': 'Наружные панели',
        'Бампер': 'Наружные панели',
        'Передняя часть': 'Наружные панели',
        'Задняя часть': 'Наружные панели',
        'Боковая часть': 'Наружные панели',
        'Кузовные элементы': 'Наружные панели',
        'Замки': 'Замки и ручки',
        'Уплотнители': 'Уплотнители',
        'Двери': 'Двери',
        'Люк (сдвижной верх)': 'Люк',
        'Люк (универсальный)': 'Люк',
        'Тюнинг/аксессуары': 'Аксессуары',
        'ВАЗ-совместимость': 'ВАЗ-совместимость',
        'Электрические зеркала': 'Зеркала',
        'Крепёж и декор': 'Крепёж',
    },

    Interior: {
        'Сиденья': 'Сиденья',
        'Обшивка': 'Обшивка дверей',
        'Обшивка дверей': 'Обшивка дверей',
        'Освещение': 'Освещение салона',
        'Руль': 'Руль',
        'Прочее': 'Прочее',
        'Безопасность': 'Безопасность',
        'Накладки и консоль': 'Панель и консоль',
        'Панель приборов': 'Панель и консоль',
        'Бардачок и вещевые ящики': 'Панель и консоль',
        'Пепельница': 'Панель и консоль',
        'Консоль': 'Панель и консоль',
        'Каркас и направляющие': 'Сиденья',
        'Обивка и накладки': 'Сиденья',
        'Накладки': 'Сиденья',
        'Ручки и замки': 'Ручки и замки',
        'Плафоны': 'Освещение салона',
        'Выключатели': 'Освещение салона',
        'Потолок': 'Потолок',
        'Ручки': 'Потолок',
        'Петли и крепления': 'Потолок',
        'Ковры и накладки': 'Ковры',
        'Аксессуары': 'Аксессуары',
    },

    Maintenance: {
        'Фильтры': 'Фильтры',
        'Регламент': 'Регламент ТО',
        'Жидкости': 'Жидкости',
        'Прокачка': 'Жидкости',
        'Шины': 'Шины',
        'Моторные масла': 'Моторные масла',
        'Смазки': 'Смазки',
        'Стеклоочиститель': 'Стеклоочиститель',
    },

    Fluids: {
        'Моторные масла': 'Моторные масла',
        'Антифриз': 'Антифриз',
        'Смазки': 'Смазки',
        'Кондиционер': 'Фреон и масло кондиционера',
        'Гидроусилитель руля': 'Жидкость ГУР',
        'Тормозная жидкость': 'Тормозная жидкость',
    },

    RoadKit: {
        'Аварийный набор': 'Аварийный набор',
    },

    Tires: {
        'Шины — Хэтчбек 3d/5d': 'Хэтчбек 3d/5d',
        'Шины — Classic (седан)': 'Classic (седан)',
        'Шины — Estate / Variant (универсал)': 'Estate / Variant',
        'Шины — Caddy Van / Kombi': 'Caddy Van / Kombi',
        'Шины — Сводная таблица': 'Сводная таблица',
        'Шины': 'Общее',
    },

    Controls: {
        'Педаль газа': 'Педаль газа',
        'Трос газа': 'Трос газа',
        'Педаль сцепления': 'Педаль сцепления',
        'Трос сцепления': 'Трос сцепления',
        'Кронштейн педалей': 'Кронштейн педалей',
        'Кулиса КПП': 'Кулиса КПП',
        'Трос КПП': 'Кулиса КПП',
        'Выключатель': 'Выключатели',
    },
};
const BASE_EK = {
    Maintenance: { g: 'Регламент ТО', s: 'Обслуживание' },
    RoadKit: { g: 'С собой в дорогу', s: 'Аварийный набор' },
    Engine: { g: 'Двигатель', s: 'Разное' },
    Fuel: { g: 'Топливная', s: 'Подача / Фильтры' },
    Ignition: { g: 'Зажигание', s: 'Свечи / Катушки' },
    Cooling: { g: 'Охлаждение', s: 'Радиатор / Термостат' },
    Heating: { g: 'Отопление', s: 'Печка / Климат' },
    Suspension: { g: 'Подвеска', s: 'Передняя / Задняя' },
    Steering: { g: 'Рулевое', s: 'Рейка и тяги' },
    Brakes: { g: 'Тормоза', s: 'Передние / Задние' },
    Transmission: { g: 'Трансмиссия', s: 'КПП / Привод' },
    Exhaust: { g: 'Выхлоп', s: 'Глушитель' },
    Electrical: { g: 'Электрика', s: 'Генератор / Стартер' },
    Bulbs: { g: 'Лампы', s: 'Освещение' },
    Body: { g: 'Кузов', s: 'Наружные панели' },
    Interior: { g: 'Интерьер', s: 'Панель / Сиденья' },
    Tires: { g: 'Колёса', s: 'Шины и давление' },
    Fluids: { g: 'Жидкости', s: 'Эксплуатационные' },
    RearAxle: { g: 'Задняя ось', s: 'Балка и ступица' },
    Controls: { g: 'Управление', s: 'Педали и кулиса' },
};

/* ============================================================
   ГРУППЫ КАТЕГОРИЙ — порядок и состав блоков в сайдбаре
   ============================================================ */
const CAT_GROUPS = [
    {
        id: 'service',
        label: 'Сервис',
        cats: ['Maintenance', 'RoadKit']
    },
    {
        id: 'powertrain',
        label: 'Силовой агрегат',
        cats: ['Engine', 'Fuel', 'Transmission']
    },
    {
        id: 'chassis',
        label: 'Ходовая часть',
        cats: ['Suspension', 'Steering', 'Brakes', 'RearAxle', 'Controls']
    },
    {
        id: 'body',
        label: 'Кузов и салон',
        cats: ['Body', 'Interior']
    },
    {
        id: 'electro',
        label: 'Электрика и климат',
        cats: ['Electrical', 'Heating']
    },
    {
        id: 'consumables',
        label: 'Расходники',
        cats: ['Fluids', 'Tires']
    },
    {
        id: 'refs',
        label: 'Справочники',
        cats: ['Torque', 'Diagnostics', 'Lamps', 'FluidSpecs', 'Wheels', 'Wiring', 'WiringFuses', 'WiringRelays', 'WiringRef', 'WiringPins', 'Workshops', 'Log'],
        virtual: true
    }
];

let EK = Object.assign({}, BASE_EK);

const IL = { s: 'СПЕЦИФИКАЦИЯ', t: 'ИНСТРУМЕНТ', p: 'ПРОЦЕДУРА', w: 'ВНИМАНИЕ', n: 'ЗАМЕТКА', r: 'РЕКОМЕНДАЦИЯ' };
const IC = { s: 'ts', t: 'tt', p: 'tp2', w: 'tw', n: 'tn', r: 'tr' };
const IM = { spec: 's', tool: 't', proc: 'p', warn: 'w', note: 'n', recommendation: 'r' };
const MI = { s: 'spec', t: 'tool', p: 'proc', w: 'warn', n: 'note', r: 'recommendation' };

const SH = {
    ex: n => 'https://www.exist.ru/Price/?pcode=' + encodeURIComponent(n),
    ad: n => 'https://www.autodoc.ru/price/657/' + encodeURIComponent(n),
    av: (n, name) => {
        const cleanOem = String(n || '').replace(/\s+/g, '');

        let cleanName = String(name || '')
            .replace(/\b(?:vw|volkswagen)\s+polo\b/gi, ' ')
            .replace(/\+/g, ' ')
            .replace(/[()[\]{}«»"'`]/g, ' ')
            .replace(/[\/\\|]/g, ' ')   // ← уже есть, слэш и бэкслэш режутся
            .replace(/\s+/g, ' ')
            .trim();

        // Обрезаем до 4 слов — Avito не любит длинные запросы
        cleanName = cleanName.split(' ').filter(Boolean).slice(0, 4).join(' ');

        // ── Определяем модель для поиска ──────────────────────
        let model = '';

        // 1) Активный VIN из гаража
        if (typeof gAV === 'function') {
            const av = gAV();
            if (av && av.ok) {
                const m = String(av.model || '').replace(/\(6N\)/i, '').replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
                if (m) model = m;
                if (av.gen) model = (model + ' ' + av.gen).trim();
            }
        }

        // 2) Если VIN нет — берём из доноров детали
        if (!model && typeof D !== 'undefined') {
            const p = D.find(x => (x.oem || '').replace(/\s+/g, '') === cleanOem);
            if (p && Array.isArray(p.donors) && p.donors.length) {
                model = p.donors[0].split(/\s+/).slice(0, 3).join(' ');
            }
        }
        // ──────────────────────────────────────────────────────

        // Собираем: [название] [модель] [OEM]
        const parts = [];
        if (cleanName) parts.push(cleanName);
        if (model) parts.push(model);
        if (cleanOem) parts.push(cleanOem);

        const q = parts.join(' ').trim() || 'автозапчасти VW';

        return 'https://www.avito.ru/rossiya/zapchasti_i_aksessuary?q=' + encodeURIComponent(q);
    }
};

const shopH = (o, name) => {
    if (!o) return '';
    const c = o.replace(/\s/g, '');
    if (!c) return '';
    return '<div class="pr">'
        + '<a class="psl ex" target="_blank" rel="noopener noreferrer" href="' + SH.ex(c) + '" title="Поиск Exist">🛒 Exist</a>'
        + '<a class="psl ad" target="_blank" rel="noopener noreferrer" href="' + SH.ad(c) + '" title="Поиск Autodoc">🛒 Autodoc</a>'
        + '<a class="psl av" target="_blank" rel="noopener noreferrer" href="' + SH.av(o, name) + '" title="Поиск Avito">🛒 Avito</a>'
        + '</div>';
};

const ONLINE_CATALOGS = {
    emex: oem => 'https://emex.ru/f?detailNum=' + encodeURIComponent(oem) + '&packet=-1',
    zzap: oem => 'https://www.zzap.ru/public/search.aspx#rawdata=' + encodeURIComponent(oem),
    elcats: oem => 'https://elcats.ru/vw/'
};

const getPurchaseHtml = p => {
    const prs = fP(p.price, p.currency);
    const su = p.shopUrl || '';
    const hh = (p.priceHistory && p.priceHistory.length)
        ? '<span class="hi" title="История цен">📊 ' + p.priceHistory.length + '</span>' : '';
    let h = '';
    h += '<div class="prow">';
    h += prs ? '<span class="price-tag">' + esc(prs) + '</span>' : '<span style="color:var(--mu);font-size:.7rem">цена не указана</span>';
    h += hh;
    if (su) h += '<a class="sl" href="' + escA(su) + '" target="_blank" rel="noopener noreferrer">🛒 Свой магазин</a>';
    h += '</div>';
    /* Статистика цены: мин/сред/макс по истории + изменение + мини-график */
    const ps = priceStats(p);
    if (ps && (p.priceHistory || []).length) {
        const d = ps.delta;
        const dHtml = d == null ? '' : '<span class="pd ' + (d > 0 ? 'up' : d < 0 ? 'down' : '') + '" title="Изменение к последней записи истории цен">' + (d > 0 ? '▲' : d < 0 ? '▼' : '＝') + ' ' + Math.abs(d) + '%</span>';
        h += '<div class="prow price-stats"><span class="ps-lb">📊 мин ' + esc(fP(ps.min, p.currency)) + ' · сред ' + esc(fP(ps.avg, p.currency)) + ' · макс ' + esc(fP(ps.max, p.currency)) + '</span>' + dHtml + sparkSvg(ps.series, 110, 26) + '</div>';
    }
    if (p.oem) h += '<div class="prow">' + shopH(p.oem, p.name) + '</div>';
    if (p.oem) {
        const c = p.oem.replace(/\s+/g, '');
        h += '<div class="prow op-b">';
        h += '<a class="psl op1" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.emex(c) + '" title="Поиск в Emex по артикулу">Emex</a>';
        h += '<a class="psl op7" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.zzap(c) + '" title="Поиск в ZZap по артикулу">ZZap</a>';
        h += '<a class="psl opE" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.elcats() + '" title="Открыть каталог Elcats (выберите VW → Polo → введите артикул)">Elcats</a>';
        h += '</div>';
    }
    /* Взрыв-схемы узла: бесплатные русскоязычные каталоги (Autodoc/Emex/Elcats) */
    const av = gAV();
    const ext = [];
    if (av && av.vin) ext.push({ l: 'Autodoc · схемы по VIN', u: 'https://www.autodoc.ru/vin/' + encodeURIComponent(av.vin), t: 'Бесплатный заводской каталог со взрыв-схемами по вашему VIN (рус.)' });
    if (p.oem) ext.push({ l: 'Autodoc · по артикулу', u: 'https://www.autodoc.ru/search/?q=' + encodeURIComponent(String(p.oem).replace(/\s/g, '')), t: 'Поиск в оригинальном каталоге по артикулу (рус.)' });
    ext.push({ l: 'Emex · оригинал', u: 'https://emex.ru/catalogs/original2', t: 'Оригинальный каталог VAG по VIN (рус.); VIN вводится на сайте' });
    ext.push({ l: 'Elcats VW', u: 'https://elcats.ru/vw/', t: 'Каталог схем VAG (рус.)' });
    h += '<div class="prow ext-diag"><span class="ed-lb" title="Бесплатные русскоязычные внешние каталоги со схемами узлов">🔍 Схемы:</span>'
        + ext.map(x => '<a class="psl" target="_blank" rel="noopener noreferrer" href="' + escA(x.u) + '" title="' + escA(x.t) + '">' + esc(x.l) + '</a>').join('')
        + '</div>';
    /* Supersession: артикул заменён VAG на новый */
    if (p.sup) {
        const np = findByOem(p.sup);
        h += '<div class="sup-note">⚠ Артикул заменён производителем на <b>' + esc(p.sup) + '</b>'
            + (np ? ' — <button type="button" class="bn sup-open" data-action="open-oem" data-oem="' + escA(p.sup) + '">открыть карточку</button>' : ' (в каталоге пока нет)')
            + '</div>';
    }
    /* PR-применимость к активной машине */
    const pf = prFit(p);
    if (pf) h += '<div class="sup-note ' + (pf.cls === 'y' ? 'ok' : 'no') + '">' + (pf.cls === 'y' ? '✅' : '⛔') + ' ' + esc(pf.label) + '</div>';
    /* своя схема узла: фото + нумерованные маркеры */
    h += '<div class="prow"><button type="button" class="bn sch-open" data-action="scheme" data-id="' + escA(p.id) + '">📐 Схема узла: фото + номера</button></div>';
    return h;
};

/* ============ КЛЮЧИ ХРАНИЛИЩА ============ */
const UK = 'vw_polo_ui_v186', PK = 'vw_polo_db_v181', WK = 'vw_polo_workshops_v181',
    VK = 'vw_polo_vincario_key_v18', GK = 'vw_polo_garage_v181', DN = 'vw_polo_v181', DV = 2,
    SP = 'parts', SW = 'workshops', METAKEY = 'vw_polo_meta_v1', TOKEY = 'vw_polo_to_v1',
    LICKEY = 'vw_polo_license_v1', UPKEY = 'vw_polo_update_url_v1', PROFKEY = 'vw_polo_profile_v1',
    LOGKEY = 'vw_polo_logs_v1',
    LOGVMKEY = 'vw_polo_logs_vinmig_v1',
    WNKEY = 'vw_polo_last_seen_version_v1',
    ONBKEY = 'vw_polo_faq_onboarded_v1',
    SHPKEY = 'vw_polo_shop_v1';

const THEMES = [
    { id: 'light', label: 'Светлая', icon: '☀️', cls: 'theme-light', preview: '#f3f5f9' },
    { id: 'dark', label: 'Тёмная', icon: '🌙', cls: 'theme-dark', preview: 'linear-gradient(135deg, #0e1525 0%, #131a28 100%)' },
    { id: 'aurora', label: 'Аврора', icon: '🌌', cls: 'theme-aurora', preview: 'linear-gradient(135deg, #0e1525 0%, #14b8a6 60%, #8b5cf6 100%)' },
    { id: 'cyberpunk', label: 'Киберпанк', icon: '🌸', cls: 'theme-cyberpunk', preview: 'linear-gradient(135deg, #100a1c 0%, #ec4899 55%, #22d3ee 100%)' },
    { id: 'sunset', label: 'Закат', icon: '🌅', cls: 'theme-sunset', preview: 'linear-gradient(135deg, #1a0a14 0%, #ec4899 40%, #f59e0b 100%)' },
    { id: 'cosmos', label: 'Космос', icon: '🌠', cls: 'theme-cosmos', preview: 'linear-gradient(135deg, #0d0a24 0%, #6366f1 60%, #38bdf8 100%)' },
    { id: 'paper', label: 'Крафт', icon: '📜', cls: 'theme-paper', preview: 'linear-gradient(135deg, #ece2cc 0%, #b45f2e 55%, #3a2a18 100%)' }
];

/* ============ СОСТОЯНИЕ ============ */
const DB = [];
let D = [], W = [], G = [], LOG = [];
let SV = {
    activeCat: 'All', activeSub: null, searchQuery: '', statusFilter: 'all', engineFilter: 'all',
    engFamFilter: 'all',
    bodyFilter: 'all', trimFilter: 'all', transFilter: 'all', gearboxFilter: 'all', genFilter: 'all',
    sidebarCollapsed: false,
    theme: 'aurora', sortBy: 'default', view: 'grid', activeVinId: null,
    logScope: 'car',
    groupBySub: false, vinStrictFilter: false, fitOnly: false, expandedCats: {},
    garCollapsed: {},
    shopCollapsed: {},
    _vinApplied: false
};
let USER = { name: '', email: '', city: '', initials: '', color: '#00b0f0' };
let CUSTOM = { categories: [], sections: {} };
/* ✅ 1.10.0: пробег/ТО и журнал — РАЗДЕЛЬНО по машинам гаража.
   TO — «вид» настроек активной машины (км, дата посл. ТО, интервал);
   TO_ALL — карта VIN → { km, lastDate, interval } (ключ '__common__' —
   значения до выбора машины). Старый одиночный формат TOKEY мигрирует
   на активный VIN (или единственную машину гаража) один раз.
   ✅ 1.10.1: добавлен lastKm — пробег НА МОМЕНТ последнего ТО. С ним
   остаток до ТО считается по фактическому одометру (интервал − пробег
   с последнего ТО), а не по оценке «~1000 км/мес» от даты. */
let TO = { km: null, lastKm: null, lastDate: null, interval: 15000 };
let TO_ALL = {};

let APP_VERSION = '1.12.0'; // fallback, если update.json не загрузится
let licAppReady = false;
let edId = null, ewId = null, pPh = null, pPhCl = false;
let useIDB = true, vk = '', pGV = null, dbr = null;
let vinEdId = null, shopPick = new Set(), partmoId = null;
let tt = null, tuT = null, usT = null, rcT = null;
let pPhs = [];
let _lbPhotos = [], _lbIdx = 0;
let _confirmCb = null;
let _changelogCache = [];
let _onbPending = false, _wnPending = false; // схема первого запуска: лицензия → FAQ → что нового
let _logByOem = new Map();
let _visibleLimit = 40, _lastRenderSig = '';

const PAGE_SIZE = 40;

/* ============ ИНДЕКС ЛОГОВ ============
   ✅ 1.10.0: индекс «меняли» строится по записям АКТИВНОЙ машины —
   бейдж 🔧 в карточке детали больше не путает историю разных VIN. */
function _rebuildLogIndex() {
    _logByOem.clear();
    for (const e of vinLogs()) {
        const items = Array.isArray(e.items) ? e.items : [];
        for (const it of items) {
            const key = nz(it);
            if (!key) continue;
            const prev = _logByOem.get(key);
            if (!prev || (e.date || '') > (prev.date || '')) {
                _logByOem.set(key, e);
            }
        }
    }
}

/* ============ УТИЛИТЫ ============ */
const $ = id => document.getElementById(id);
const uid = () => 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
const nz = s => (s == null ? '' : String(s)).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const esc = t => { if (t == null) return ''; const d = document.createElement('div'); d.textContent = String(t); return d.innerHTML; };
/* ✅ Правка №3: escA теперь экранирует и одинарные кавычки */
const escA = t => esc(t).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const sImg = d => typeof d === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(d) ? d : '';
const sUrl = u => {
    if (typeof u !== 'string') return '';
    const t = u.trim();
    if (!t) return '';
    if (/^\s*(javascript|data|vbscript):/i.test(t)) return '';
    return t;
};
const fP = (p, c) => {
    if (p == null || p === '' || isNaN(p)) return '';
    const n = Number(p);
    if (!isFinite(n)) return '';
    const s = { RUB: '₽', USD: '$', EUR: '€', BYN: 'Br', KZT: '₸', UAH: '₴' };
    return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ' + (s[c] || c || '');
};
const fD = ts => { try { return new Date(ts).toLocaleDateString('ru-RU'); } catch (e) { return ''; } };
const sl = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean);
const csvE = v => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\r\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
};

/* ============ ЛОГИЧЕСКИЙ ПОРЯДОК ТО ============ */
const MAINT_ORDER = [
    'масло мотор', 'масло двс', 'масло двигател', 'масло в двигател',
    'фильтр маслян', 'масляный фильтр', 'фильтр масл',
    'воздушный фильтр', 'фильтр воздушн',
    'салонн', 'фильтр салон',
    'топливный фильтр', 'фильтр топливн',
    'свеч', 'свечи зажиган', 'катушк', 'провод высоковольт', 'провода зажиган',
    'ремень грм', 'грм', 'ролик грм', 'натяжитель грм',
    'ремень генератор', 'ремень поликлин', 'ремень приводн', 'ремень кондиц',
    'антифриз', 'охлаждающ', 'жидкость охлажд',
    'тормозн жидк', 'жидкость тормозн', 'жидкость тормоз',
    'жидкость гур', 'жидкость гидроусил',
    'масло кпп', 'масло акпп', 'масло трансмисс', 'масло коробк',
    'омывател', 'жидкость омыв',
    'колодк', 'колодки',
    'тормозн диск', 'диск тормозн',
    'тормозн барабан', 'барабан',
    'суппорт', 'шланг тормозн',
    'амортизатор', 'стойк',
    'пыльник', 'шрус', 'шаров', 'наконечник', 'тяга рулев',
    'сайлентблок', 'втулк стабилиз',
    'аккумулятор', 'акб',
    'щетк', 'щётк', 'дворник', 'стеклоочист',
    'предохранит', 'лампочк', 'лампы',
    'сажев', 'катализатор', 'лямбда', 'датчик кислород'
];

function _maintWeight(p) {
    const n = nz(p.name || '');
    if (!n) return 9999999;
    let m = n.match(/(?:^|\s)то[\s\-–—]*(\d+)/i);
    if (m) {
        const num = parseInt(m[1], 10);
        if (!isNaN(num) && num > 0) return num;
    }
    m = n.match(/(\d[\d\s]{2,})\s*км/);
    if (m) {
        const km = parseInt(m[1].replace(/\s/g, ''), 10);
        if (!isNaN(km) && km > 0) return 1000 + km;
    }
    if (/(?:раз в год|ежегодн|каждый год)/.test(n)) return 500000;
    if (/(?:^|\s)зим/.test(n)) return 900000;
    if (/(?:^|\s)лет/.test(n)) return 901000;
    if (/(?:^|\s)весн/.test(n)) return 902000;
    if (/(?:^|\s)осен/.test(n)) return 903000;
    for (let i = 0; i < MAINT_ORDER.length; i++) {
        if (n.includes(MAINT_ORDER[i])) return 950000 + i;
    }
    return 9999999;
}

function fmtDate(d) {
    if (!d) return '';
    const s = String(d);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return m[3] + '.' + m[2] + '.' + m[1];
    return s;
}
const openM = id => $(id).classList.add('show');
const closeM = id => $(id).classList.remove('show');

/* ============ КАСТОМНЫЙ CONFIRM ============ */
function askConfirm(msg, onYes, opts) {
    opts = opts || {};
    $('confirm_title').textContent = opts.title || '⚠️ Подтверждение';
    $('confirm_msg').textContent = msg;
    $('confirm_yes').textContent = opts.yes || 'Да';
    $('confirm_no').textContent = opts.no || 'Нет';
    const exp = $('confirm_export');
    if (exp) exp.style.display = opts.showExport ? '' : 'none';
    _confirmCb = onYes || null;
    openM('confirmmo');
}
function cConfirm(ok) {
    closeM('confirmmo');
    const cb = _confirmCb;
    _confirmCb = null;
    if (ok && typeof cb === 'function') {
        try {
            const r = cb();
            if (r && typeof r.catch === 'function') {
                r.catch(e => toast('Ошибка: ' + ((e && e.message) || e), 'danger'));
            }
        } catch (e) {
            toast('Ошибка: ' + ((e && e.message) || e), 'danger');
        }
    }
}

/* ============ ЛИЦЕНЗИЯ ============ */
function checkLicense() {
    /* Публичный read-only режим: каталог без гейта, без гаража и правок */
    if (pubMode()) {
        pubApply();
        init().then(() => rSz()).catch(e => { console.error(e); toast('Ошибка инициализации', 'danger'); });
        return;
    }
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
/* ============ ПУБЛИЧНЫЙ READ-ONLY РЕЖИМ ============
   «Витрина» каталога для новичков и поиска: без лицензионного гейта,
   но любые изменения базы/гаража заблокированы (pubGuard в мутаторах). */
const PUBKEY = 'vw_public_mode_v1';
const pubMode = () => { try { return localStorage.getItem(PUBKEY) === '1'; } catch (e) { return false; } };
function pubGuard() {
    if (!pubMode()) return false;
    toast('👁 Просмотр без регистрации: гараж и правки доступны в полной версии', 'info');
    return true;
}
function pubApply() {
    document.body.classList.add('pub');
    if (!$('pubbar')) {
        const d = document.createElement('div');
        d.id = 'pubbar';
        d.innerHTML = '<span>👁 Публичный режим: каталог открыт без гаража и правок</span>'
            + '<button type="button" class="bn" onclick="pubExit()">Включить полную версию</button>';
        document.body.appendChild(d);
    }
}
function pubEnter() {
    try { localStorage.setItem(PUBKEY, '1'); } catch (e) { }
    $('licgate').classList.remove('show');
    pubApply();
    init().then(() => rSz()).catch(e => { console.error(e); toast('Ошибка инициализации', 'danger'); });
}
function pubExit() {
    try { localStorage.removeItem(PUBKEY); } catch (e) { }
    location.reload();
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

/* ============ IndexedDB ============ */
function oDB() {
    if (dbr) return dbr;
    dbr = new Promise((res, rej) => {
        if (!('indexedDB' in window)) { rej(new Error('IDB')); return; }
        const r = indexedDB.open(DN, DV);
        r.onupgradeneeded = () => {
            const db = r.result;
            if (!db.objectStoreNames.contains(SP)) db.createObjectStore(SP, { keyPath: 'id' });
            if (!db.objectStoreNames.contains(SW)) db.createObjectStore(SW, { keyPath: 'id' });
            if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id' });
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
    return dbr;
}
const iAll = async s => {
    const db = await oDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(s, 'readonly');
        const r = tx.objectStore(s).getAll();
        r.onsuccess = () => res(r.result || []);
        r.onerror = () => rej(r.error);
    });
};
const iPut = async (s, i) => {
    const db = await oDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(s, 'readwrite');
        tx.objectStore(s).put(i);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
    });
};
const iMany = async (s, arr) => {
    const db = await oDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(s, 'readwrite');
        const st = tx.objectStore(s);
        arr.forEach(it => st.put(it));
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
    });
};
const iDel = async (s, id) => {
    const db = await oDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(s, 'readwrite');
        tx.objectStore(s).delete(id);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
    });
};
const iClr = async s => {
    const db = await oDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(s, 'readwrite');
        tx.objectStore(s).clear();
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
    });
};

/* ============ НОРМАЛИЗАТОРЫ ============ */
/* 1.10.6: единый разбор инструкций. Исторически данные приходили в трёх
   форматах: [["s","текст"], …] (основной), [{type:"spec",text:"…"}] (старый
   `inst`) и — в 8 записях data-src — плоским ["s","текст"] или объектами
   внутри поля `i`. Раньше такие элементы давали text:'' и отбрасывались
   фильтром: карточка оставалась БЕЗ инструкций, причём молча (потерялось
   35 строк, включая давления шин и «3.4 бар для гружёного Caddy»).
   Теперь понимаем все три варианта; сами данные приведены к основному
   формату миграцией tools/migrate-1.10.6.js (правила M1/M2). */
function instEntry(x) {
    if (!x) return null;
    if (Array.isArray(x)) {
        const t = MI[String(x[0] == null ? '' : x[0]).trim()] || 'note';
        const s = String(x[1] == null ? '' : x[1]).trim();
        return s ? { type: t, text: s } : null;
    }
    if (typeof x === 'object') {
        const raw = String(x.type == null ? (x.t == null ? '' : x.t) : x.type).trim();
        const t = MI[IM[raw]] || MI[raw] || 'note';
        const s = String(x.text == null ? '' : x.text).trim();
        return s ? { type: t, text: s } : null;
    }
    return null;
}
function parseInst(p) {
    const src = Array.isArray(p.i) ? p.i : (Array.isArray(p.inst) ? p.inst : null);
    if (!src || !src.length) return [];
    /* плоский вариант: ["s","текст"] вместо [["s","текст"]] */
    if (src.length === 2 && typeof src[0] === 'string' && typeof src[1] === 'string' && MI[src[0]]) {
        const one = instEntry(src);
        return one ? [one] : [];
    }
    return src.map(instEntry).filter(Boolean);
}

function nP(p) {
    if (!p || typeof p !== 'object') return null;
    const cat = (typeof p.cat === 'string' && CATS.some(x => x.id === p.cat)) ? p.cat : 'Engine';
    const ALL_ENGINES = Object.keys(ENGINES);
    const ALL_BODIES = Object.keys(BODIES);
    const ALL_TRANS = Object.keys(TRANSMISSIONS);

    let rawName = String(p.n || p.name || '');
    if (cat === 'Maintenance') {
        rawName = rawName
            .replace(/\bкаждые\b\s*/gi, '')
            .replace(/\s{2,}/g, ' ')
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            .trim();
    }

    const inst = parseInst(p);

    const eng = Array.isArray(p.engines) ? p.engines.filter(x => ALL_ENGINES.includes(x)) : [];
    const bdy = Array.isArray(p.bodies) ? p.bodies.filter(x => ALL_BODIES.includes(x)) : [];
    /* КПП: семейства — в transmissions; буквенные коды — в transCodes.
       Если в источнике буквенный код лежал в transmissions — переносим. */
    const isGbCode = x => /^[A-Z]{3}$/.test(x) || /^[A-Z]{3}\d{3}$/.test(x);
    const trnRaw = Array.isArray(p.transmissions) ? p.transmissions.map(x => String(x || '').trim()) : [];
    const trn = trnRaw.filter(x => ALL_TRANS.includes(x));
    const trcMigrated = trnRaw.map(x => x.toUpperCase()).filter(x => !ALL_TRANS.includes(x) && isGbCode(x));
    const trcOwn = Array.isArray(p.transCodes)
        ? p.transCodes.map(x => String(x || '').trim().toUpperCase()).filter(isGbCode)
        : [];
    const trc = Array.from(new Set(trcMigrated.concat(trcOwn))).slice(0, 50);
    const trm = Array.isArray(p.trims) ? p.trims.filter(x => TRIMS.includes(x)) : [];
    /* PR-применимость: prReq — коды, которые обязаны быть на машине;
       prNo («!CODE») — коды, с которыми деталь не ставится. */
    const prRaw = (Array.isArray(p.prReq) ? p.prReq.map(String) : String(p.prReq || '').split(','))
        .concat(Array.isArray(p.prNo) ? p.prNo.map(x => '!' + x) : String(p.prNo || '').split(',').filter(x => x.trim()).map(x => '!' + x));
    const prReq = [], prNo = [];
    prRaw.forEach(s0 => {
        const s = String(s0 || '').trim().toUpperCase();
        if (!s) return;
        if (s[0] === '!') prNo.push(s.slice(1)); else prReq.push(s);
    });
    const sup = String(p.sup || p.supersededTo || '').trim().toUpperCase();
    const ALL_GENS = Object.keys(GENERATIONS);
    const gens = Array.isArray(p.gens) ? p.gens.filter(x => ALL_GENS.includes(x)) : [];

    const rawSub = String(p.sub || p.subcategory || '').trim();
    const catMap = SUB_ALIASES[cat] || {};
    const globMap = SUB_ALIASES._all || {};
    const mapped = catMap[rawSub] || globMap[rawSub] || rawSub;

    let finalCat = cat;
    let sub = mapped;
    if (typeof mapped === 'string' && mapped.startsWith('ПЕРЕКИНУТЬ→')) {
        finalCat = mapped.split('→')[1];
        sub = rawSub;
    }

    return {
        id: p.id || uid(),
        cat: finalCat,
        sub,
        name: rawName,
        oem: String(p.o || p.oem || ''),
        verified: !!(p.v || p.verified),
        analogs: Array.isArray(p.a || p.analogs) ? (p.a || p.analogs).map(String).filter(Boolean) : [],
        donors: Array.isArray(p.d || p.donors) ? (p.d || p.donors).map(String).filter(Boolean) : [],
        engines: eng, bodies: bdy, transmissions: trn, transCodes: trc, trims: trm, gens,
        prReq, prNo, sup,
        price: (p.price == null || p.price === '') ? null : (isFinite(Number(p.price)) ? Number(p.price) : null),
        currency: p.currency || 'RUB',
        status: ['want', 'bought', 'installed'].includes(p.status) ? p.status : '',
        favorite: !!p.favorite,
        notes: String(p.notes || ''),
        shopUrl: sUrl(p.shopUrl || ''),
        photos: (() => {
            const arr = [];
            if (Array.isArray(p.photos)) {
                for (const x of p.photos) { const s = sImg(x); if (s) arr.push(s); }
            }
            if (!arr.length && p.photo) {
                const s = sImg(p.photo);
                if (s) arr.push(s);
            }
            return arr.slice(0, 12);
        })(),
        parts: Array.isArray(p.parts) ? p.parts
            .filter(x => x && (x.oem || x.o || x.name || x.n))
            .slice(0, 40)
            .map(x => ({
                name: String(x.name || x.n || ''),
                oem: String(x.oem || x.o || ''),
                note: String(x.note || x.note2 || '')
            })) : [],
        inst,
        priceHistory: Array.isArray(p.priceHistory)
            ? p.priceHistory.filter(h => h && typeof h === 'object' && h.ts && h.price != null).slice(-50)
            : []
    };
}
const nW = w => !w || typeof w !== 'object' ? null : {
    id: w.id || ('w_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)),
    name: String(w.name || ''),
    phone: String(w.phone || ''),
    address: String(w.address || ''),
    spec: String(w.spec || ''),
    rating: Math.max(0, Math.min(5, Number(w.rating) || 0)),
    note: String(w.note || '')
};

/* ============ VIN-ДЕКОДЕР ============ */
const VY = { 'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986, 'H': 1987, 'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995, 'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999, 'Y': 2000, '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009 };
/* Заводы (символ 11 VIN). Источник: clubvw.org.au/vwreference/vwvin + ETKA.
   Для кодов с двумя значениями завод уточняется по WMI/региону. */
const VP = {
    'A': ['Ingolstadt', 'DE'], 'B': ['Bruxelles', 'BE'], 'C': ['Chattanooga', 'US'],
    'D': ['Bratislava', 'SK'], 'E': ['Emden', 'DE'], 'F': ['Resende', 'BR'],
    'G': ['Graz', 'AT'], 'H': ['Hannover', 'DE'], 'K': ['Osnabrück', 'DE'],
    'L': ['Lagos', 'NG'], 'M': ['Puebla', 'MX'], 'N': ['Neckarsulm', 'DE'],
    'P': ['Mosel / Anchieta', 'DE/BR'], 'R': ['Martorell', 'ES'], 'S': ['Salzgitter', 'DE'],
    'T': ['Taubaté / Sarajevo', 'BR/BA'], 'U': ['Uitenhage', 'ZA'],
    'V': ['Palmela / Westmoreland', 'PT/US'], 'W': ['Wolfsburg', 'DE'],
    'X': ['Poznań', 'PL'], 'Y': ['Pamplona', 'ES'], 'Z': ['Zwickau', 'DE'],
    '1': ['Győr', 'HU'], '2': ['Anting', 'CN'], '3': ['Changchun', 'CN'],
    '4': ['Curitiba', 'BR'], '8': ['Dresden / Pacheco', 'DE/AR'], '9': ['Września', 'PL']
};
/* Модели VW по коду (символы 7–8 VIN). Источник: clubvw.org.au/vwreference/vwvin.
   Коды каталога (6N/6V/6K/9K/9U) обрабатываются отдельными ветками в vD(). */
const VW_MODELS = {
    '11': 'Beetle (Бразилия/Мексика)', '13': 'Scirocco / Corrado', '14': 'Caddy 1 (пикап на Golf 1)',
    '15': 'Cabriolet (Beetle/Golf 1)', '16': 'Jetta 1/2 (ранние) · Beetle (с 2012)', '17': 'Golf 1',
    '18': 'Iltis', '19': 'Golf 2 (ранний)', '1C': 'New Beetle (США)', '1E': 'Golf 3 Cabriolet',
    '1F': 'Eos', '1G': 'Golf/Jetta 2 (поздний)', '1H': 'Golf/Vento 3', '1J': 'Golf/Bora 4',
    '1K': 'Golf/Jetta 5/6', '1T': 'Touran', '1Y': 'New Beetle Cabriolet',
    '24': 'T3 пикап', '25': 'T3 Van/Bus/Caravelle', '28': 'LT 1', '2D': 'LT 2', '2E': 'Crafter 1',
    '2H': 'Amarok', '2K': 'Caddy 3 / Caddy Maxi', '30': 'Fox (США)', '31': 'Passat 2', '32': 'Santana',
    '33': 'Passat 2 Variant', '3A': 'Passat 3/4', '3B': 'Passat 5', '3C': 'Passat 6/7/8/CC',
    '3D': 'Phaeton', '3H': 'Arteon', '50': 'Corrado (ранний)', '53': 'Scirocco 1/2',
    '5K': 'Golf/Jetta 6', '5M': 'Golf Plus', '5N': 'Tiguan', '5Z': 'Fox (Европа)',
    '60': 'Corrado (поздний)', '6K': 'Polo Classic/Variant (6K)', '6N': 'Polo 3 (6N)', '6R': 'Polo 5 (6R)',
    '6X': 'Lupo', '70': 'T4', '74': 'Taro', '7H': 'T5/T6.1', '7J': 'T6', '7L': 'Touareg 1',
    '7M': 'Sharan', '7P': 'Touareg 2', '86': 'Polo/Derby 1/2', '87': 'Polo Coupe (86C)',
    '9C': 'New Beetle', '9K': 'Caddy 2 (9K)', '9N': 'Polo 4 (9N)', '9U': 'Caddy 2 Pickup (9U)',
    'A1': 'T-Roc', 'AA': 'Up!', 'AU': 'Golf 7', 'AW': 'Polo 6 (AW)', 'C1': 'T-Cross', 'CD': 'Golf 8',
    'SK': 'Caddy 4', 'SY': 'Crafter 2'
};
const vV = v => typeof v === 'string' && v.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(v);

function vD(v) {
    const x = String(v || '').toUpperCase();
    if (!vV(x)) return { ok: false, error: 'VIN должен быть 17 символов (без I, O, Q)' };
    const w = x.slice(0, 3), yc = x[9], pc = x[10], sr = x.slice(11);
    let brand = 'Неизвестно', country = '—';
    if (w === 'WVW') { brand = 'Volkswagen'; country = 'Германия'; }
    else if (w === 'WV1') { brand = 'Volkswagen (коммер.)'; country = 'Германия'; }
    else if (w === 'WV2') { brand = 'Volkswagen (автобус/фургон)'; country = 'Германия'; }
    else if (w === 'WV3') { brand = 'Volkswagen (грузовики)'; country = 'Германия'; }
    else if (w === 'WVG') { brand = 'Volkswagen (SUV)'; country = 'Германия'; }
    else if (w === '1VW') { brand = 'Volkswagen USA'; country = 'США'; }
    else if (w === '1V1') { brand = 'Volkswagen USA (коммер.)'; country = 'США'; }
    else if (w === '3VW') { brand = 'VW Mexico'; country = 'Мексика'; }
    else if (w === '8AW') { brand = 'VW Argentina'; country = 'Аргентина'; }
    else if (w === '9BW' || w === '9BV') { brand = 'VW do Brasil'; country = 'Бразилия'; }
    else if (w === 'AAV') { brand = 'VW South Africa'; country = 'ЮАР'; }
    else if (w === 'VSS' || w === 'VSK') { brand = 'SEAT'; country = 'Испания'; }
    else if (w === 'WAU') { brand = 'Audi'; country = 'Германия'; }
    else if (w === 'TRU') { brand = 'Audi'; country = 'Венгрия'; }
    else if (w === '93V') { brand = 'Audi Brazil'; country = 'Бразилия'; }
    else if (/^TM/.test(w)) { brand = 'Škoda'; country = 'Чехия'; }
    else if (w[0] === 'W') { brand = 'Volkswagen Group (Германия)'; country = 'Германия'; }
    let vp = x.slice(6, 9);
    if (!/^[0-9A-Z]{3}$/.test(vp) || /^ZZZ$/.test(vp)) vp = x.slice(3, 6);
    let model = '—', body = '—', gen = '', note = '';
    /* Каталог охватывает Polo/Caddy 1994–2003:
       6N1/6N2 — Polo (хэтчбек), 6V2 — Polo Classic (седан),
       6V5 — Polo Variant (универсал), 6KV/6K — Classic/Variant
       (перелицованные Seat Córdoba, платформа 6K),
       9K — Caddy (фургон/комби), 9U — Caddy Pickup. */
    if (/^6N/.test(vp)) {
        if (vp === '6N1') { model = 'Polo (6N1)'; body = 'Hatchback'; gen = '6N1'; }
        else if (vp === '6N2') { model = 'Polo (6N2)'; body = 'Hatchback'; gen = '6N2'; }
        else { model = 'Polo (6N)'; body = 'Hatchback'; }
    }
    else if (/^6V/.test(vp)) {
        if (vp === '6V2') { model = 'Polo Classic (6V2)'; body = 'Classic Sedan'; }
        else if (vp === '6V5') { model = 'Polo Variant (6V5)'; body = 'Variant'; }
        else { model = 'Polo Classic/Variant (6V)'; body = '—'; }
    }
    else if (/^6K/.test(vp)) {
        if (/^VSS/.test(w)) { model = 'Seat Ibiza/Cordoba (6K)'; body = '—'; note = 'Донорская платформа — не VW; сверяйте применимость деталей'; }
        else { model = 'Polo Classic/Variant (6KV)'; body = '—'; note = 'Седан/универсал на платформе Seat Córdoba — уточните кузов в «✎ Уточнить данные»'; }
    }
    else if (/^9K/.test(vp)) { model = 'Caddy (9K)'; body = 'Van'; note = 'Фургон/комби на платформе Seat Ibiza 6K'; }
    else if (/^9U/.test(vp)) { model = 'Caddy Pickup (9U)'; body = 'Pickup'; note = 'На базе Škoda Felicia Pickup'; }
    else if (/^9N/.test(vp)) { model = 'Polo (9N)'; body = 'Hatchback'; note = 'Следующее поколение (2001–2009) — каталог покрывает частично'; }
    else if (VW_MODELS[vp.slice(0, 2)]) { model = VW_MODELS[vp.slice(0, 2)]; note = 'Вне рамок каталога (Polo/Caddy 1994–2003)'; }
    else if (vp && !/^ZZZ/.test(vp)) { model = 'Неизвестная модель (код ' + vp + ')'; }
    const year = VY[yc] || null, pl = VP[pc] || ['—', '—'];
    return {
        ok: true, vin: x, brand, country, model, body, year, gen, note,
        modelCode: vp,
        plant: pl[0], plantCountry: pl[1],
        engines: /^(6N|6V|6K|9K|9U)/.test(vp) ? Object.keys(ENGINES) : ['—'],
        serial: sr
    };
}
async function vR(v) { return vD(v); }

/* ============ ХРАНИЛИЩЕ ============ */
function lG() {
    try {
        const r = localStorage.getItem(GK);
        if (r) {
            const a = JSON.parse(r);
            if (Array.isArray(a)) {
                G = a.filter(x => x && x.vin && x.id).map(x => ({
                    id: x.id,
                    vin: String(x.vin).toUpperCase(),
                    brand: String(x.brand || ''),
                    model: String(x.model || ''),
                    year: x.year || null,
                    body: String(x.body || ''),
                    gen: String(x.gen || ''),
                    plant: String(x.plant || ''),
                    engines: Array.isArray(x.engines) ? x.engines : [],
                    prodDate: String(x.prodDate || ''),
                    engineCode: String(x.engineCode || ''),
                    transCode: String(x.transCode || ''),
                    gearboxCode: String(x.gearboxCode || '').toUpperCase(),
                    equipCode: String(x.equipCode || ''),
                    bodyColor: String(x.bodyColor || ''),
                    roofColor: String(x.roofColor || ''),
                    addedAt: x.addedAt || Date.now()
                }));
            }
        }
    } catch (e) { }
}
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
                const ex = CATS.find(x => x.id === sid);
                if (ex) {
                    ex.label = s.label || ex.label;
                    ex.icon = s.icon || ex.icon;
                    if (s.parent) ex.parent = s.parent;
                } else {
                    CATS.push({
                        id: sid,
                        label: s.label || sid,
                        icon: s.icon || '📋',
                        parent: s.parent || null
                    });
                }
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

function lProfile() {
    try {
        const r = localStorage.getItem(PROFKEY);
        if (r) {
            const p = JSON.parse(r);
            if (p && typeof p === 'object') {
                USER = {
                    name: String(p.name || ''), email: String(p.email || ''),
                    city: String(p.city || ''), initials: String(p.initials || ''),
                    color: String(p.color || '#00b0f0')
                };
            }
        }
    } catch (e) { }
}
function sProfileStorage() { try { localStorage.setItem(PROFKEY, JSON.stringify(USER)); } catch (e) { } }

function lU() {
    try {
        const r = localStorage.getItem(UK);
        if (r) {
            const p = JSON.parse(r);
            SV = Object.assign(SV, p);
            if (!SV.expandedTree || typeof SV.expandedTree !== 'object') SV.expandedTree = {};
            if (!SV.expandedCats || typeof SV.expandedCats !== 'object') SV.expandedCats = {};
            if (!SV.garCollapsed || typeof SV.garCollapsed !== 'object') SV.garCollapsed = {};
            if (!SV.shopCollapsed || typeof SV.shopCollapsed !== 'object') SV.shopCollapsed = {};
            if (typeof SV._vinApplied !== 'boolean') SV._vinApplied = false;
            if (!CATS.some(c => c.id === SV.activeCat) && !['Favorites', 'Workshops', 'Log', 'Dash'].includes(SV.activeCat) && !(CUSTOM.sections && CUSTOM.sections[SV.activeCat]) && !SEC_TABLE_IDS.includes(SV.activeCat)) SV.activeCat = 'All';
        }
    } catch (e) { }
}
const sU = () => { try { localStorage.setItem(UK, JSON.stringify(SV)); } catch (e) { } };

const sD = () => {
    if (useIDB) iMany(SP, D).catch(() => toast('Ошибка IndexedDB', 'danger'));
    else {
        try { localStorage.setItem(PK, JSON.stringify(D)); }
        catch (e) { toast('Хранилище переполнено', 'danger'); }
    }
};
const sLogs = () => {
    if (useIDB) iMany('logs', LOG).catch(() => { });
    else { try { localStorage.setItem(LOGKEY, JSON.stringify(LOG)); } catch (e) { } }
};
const sWk = () => {
    if (useIDB) iMany(SW, W).catch(() => { });
    else { try { localStorage.setItem(WK, JSON.stringify(W)); } catch (e) { } }
};

function lLS() {
    try {
        const r = localStorage.getItem(PK);
        if (r) { const a = JSON.parse(r); if (Array.isArray(a)) D = a.map(nP).filter(Boolean); }
    } catch (e) { }
    if (!D.length) D = DB.map(nP).filter(Boolean);
    try {
        const r = localStorage.getItem(WK);
        if (r) { const a = JSON.parse(r); if (Array.isArray(a)) W = a.map(nW).filter(Boolean); }
    } catch (e) { }
}

/* ── ТО/пробег: раздельно по VIN (1.10.0) ──
   Ключ карты — VIN активной машины (upper) либо '__common__', если машина
   не выбрана. TO всегда синхронизирован с TO_ALL[toKey()] через toSync(). */
const TO_COMMON = '__common__';
const toDef = () => ({ km: null, lastKm: null, lastDate: null, interval: 15000 });
function toKey() {
    const av = gAV();
    return av && av.vin ? String(av.vin).trim().toUpperCase() : TO_COMMON;
}
function toForVin(vin) {
    const k = String(vin || '').trim().toUpperCase();
    return (k && TO_ALL[k]) || null;
}
function toNorm(t) {
    if (!t || typeof t !== 'object') return null;
    const km = t.km != null && !isNaN(Number(t.km)) ? Number(t.km) : null;
    const lastKm = t.lastKm != null && !isNaN(Number(t.lastKm)) ? Number(t.lastKm) : null;
    const lastDate = t.lastDate || null;
    const interval = Number(t.interval) || 15000;
    if (km == null && lastKm == null && !lastDate && interval === 15000) return null;
    return { km, lastKm, lastDate, interval };
}
function toSync() {
    const k = toKey();
    TO = TO_ALL[k] ? Object.assign(toDef(), TO_ALL[k]) : toDef();
}
/* Одноразовая миграция старого одиночного формата { km, lastDate, interval }:
   значения принадлежали «текущей» машине — относим их на активный VIN,
   единственную машину гаража либо в '__common__' (машина не выбрана).
   Важно: персистим карту напрямую (_toPersist), а не через sTOStorage —
   вид TO в этот момент ещё не синхронизирован и commit затёр бы перенос. */
function toMigrateLegacy() {
    const leg = TO_ALL['__legacy__'];
    if (!leg) return;
    delete TO_ALL['__legacy__'];
    let k = TO_COMMON;
    const av = gAV();
    if (av && av.vin) k = String(av.vin).trim().toUpperCase();
    else if (G.length === 1 && G[0].vin) k = String(G[0].vin).trim().toUpperCase();
    if (!TO_ALL[k]) TO_ALL[k] = leg;
    _toPersist();
}
function lTO() {
    TO_ALL = {};
    try {
        const r = localStorage.getItem(TOKEY);
        if (r) {
            const t = JSON.parse(r);
            if (t && typeof t === 'object' && t.byVin && typeof t.byVin === 'object') {
                for (const k of Object.keys(t.byVin)) {
                    const v = toNorm(t.byVin[k]);
                    if (v) TO_ALL[String(k).trim().toUpperCase()] = v;
                }
            } else {
                const v = toNorm(t);
                if (v) TO_ALL['__legacy__'] = v;
            }
        }
    } catch (e) { }
    toMigrateLegacy();
    toSync();
}
/* Запись карты TO_ALL в localStorage «как есть» (без commit текущего TO). */
function _toPersist() {
    try { localStorage.setItem(TOKEY, JSON.stringify({ byVin: TO_ALL })); } catch (e) { }
}
/* Сохраняет ТЕКУЩИЙ TO в карту под активным ключом и пишет всю карту.
   Пустые значения (сброс) удаляют запись ключа — карта не зарастает. */
function sTOStorage() {
    const k = toKey();
    const v = toNorm(TO);
    if (v) TO_ALL[k] = v; else delete TO_ALL[k];
    _toPersist();
}

async function lLogs() {
    try {
        const r = localStorage.getItem(LOGKEY);
        if (r) { const a = JSON.parse(r); if (Array.isArray(a)) LOG = a; }
    } catch (e) { }
    try {
        if (useIDB) {
            const db = await oDB();
            if (db.objectStoreNames.contains('logs')) {
                const lg = await iAll('logs');
                if (Array.isArray(lg) && lg.length) LOG = lg;
            }
        }
    } catch (e) { console.warn('logs load error', e); }
    logMigrateVins();
    _rebuildLogIndex();
}

/* ── Журнал: раздельно по VIN (1.10.0) ──
   Записи хранят vin (штамповался и раньше, но не использовался).
   vinLogs() — записи активной машины (без машины — все);
   carLogs() — с учётом переключателя «эта машина / все машины» в журнале;
   logMigrateVins() — одноразово относит старые записи без vin на активную
   машину (журнал до 1.10.0 вёлся по факту для текущего VIN). */
const logVinOf = e => String((e && e.vin) || '').trim().toUpperCase();
function vinLogs() {
    const av = gAV();
    if (!av || !av.vin) return LOG;
    const k = String(av.vin).trim().toUpperCase();
    return LOG.filter(e => logVinOf(e) === k);
}
function carLogs() {
    const av = gAV();
    if (av && SV.logScope === 'all') return LOG;
    return vinLogs();
}
function logMigrateVins() {
    let done = false;
    try { done = localStorage.getItem(LOGVMKEY) === '1'; } catch (e) { }
    if (done) return;
    const untagged = LOG.filter(e => !logVinOf(e));
    if (!untagged.length) {
        try { localStorage.setItem(LOGVMKEY, '1'); } catch (e) { }
        return;
    }
    const av = gAV();
    if (!av || !av.vin) return; // подождём, пока пользователь выберет машину (setAV повторит)
    const k = String(av.vin).trim().toUpperCase();
    for (const e of untagged) e.vin = k;
    sLogs();
    try { localStorage.setItem(LOGVMKEY, '1'); } catch (e) { }
    console.info('[bm] журнал: ' + untagged.length + ' записей без VIN отнесены к …' + k.slice(-6));
}

/* ============ ТОСТ ============ */
function toast(m, k) {
    const kk = k === 'success' ? 's' : k === 'danger' ? 'd' : (k || '');
    const e = $('tt');
    clearTimeout(tuT);
    e.innerHTML = '';
    e.textContent = m;
    e.className = 'tst show' + (kk ? ' ' + kk : '');
    clearTimeout(tt);
    tt = setTimeout(() => e.classList.remove('show'), 5000);
}
function toastUndo(msg, onUndo) {
    const e = $('tt');
    e.innerHTML = esc(msg) + ' <button id="tt_undo">↶ Вернуть</button><div id="tt_progress"></div>';
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
const sUS = () => { clearTimeout(usT); usT = setTimeout(sU, 300); };
const dRC = () => {
    clearTimeout(rcT);
    rcT = setTimeout(() => { rSB(); rC(); }, 120);
};

/* ============ ГАРАЖ ============ */
function gAV() {
    if (!SV.activeVinId) return null;
    const g = G.find(x => x.id === SV.activeVinId);
    return g ? Object.assign({ ok: true }, g) : null;
}

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
        /* 1.10.6: доноры в базе пишутся без цифры поколения («VW Polo 6N»),
           а модель — с ней («Polo (6N1)»), поэтому полное совпадение не
           срабатывало и карточка показывала 50 % / «возможно подходит»
           вместо «подходит». Добавлено префиксное сравнение числовых
           токенов: 6n1 ↔ 6n. Ложных срабатываний это не даёт —
           «VW Lupo 1.0» против «Polo (6N1)» по-прежнему 0 %. */
        const dt = d.split(/[\s()/\-]+/).filter(x => x.length >= 2);
        let hit = 0;
        for (const t of tokens) {
            if (d.includes(t)) { hit++; continue; }
            if (/[0-9]/.test(t) && dt.some(x => /[0-9]/.test(x) && (t.startsWith(x) || x.startsWith(t)))) hit++;
        }
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

/* ============================================================
   ФИЛЬТРЫ КПП — семейство и буквенный код
   partMatchesTrans: деталь проходит, если
     · семейство не выбрано, или
     · у детали пусто и то и другое (= «для всех»), или
     · семейство указано явно и совпало, или
     · у детали только буквенные коды — и хотя бы один
       относится к выбранному семейству.
   ============================================================ */
function partMatchesTrans(p, filter) {
    if (!filter || filter === 'all') return true;
    const fams = p.transmissions || [];
    const codes = p.transCodes || [];
    if (fams.length) return fams.includes(filter);
    if (codes.length) return codes.some(c => gearboxFamsOf(c).includes(filter));
    return true;
}
/* Фильтр по семейству двигателей (EA111 / EA827 / EA827-D):
   деталь проходит, если моторы не указаны (= все) или хотя бы
   один из её моторов относится к выбранному семейству. */
function partMatchesEngFam(p, filter) {
    if (!filter || filter === 'all') return true;
    const arr = p.engines || [];
    if (!arr.length) return true;
    return arr.some(e => engineFamOf(e) === filter);
}
/* partMatchesGearbox: фильтр по конкретному буквенному коду.
   Если у детали заявлены свои коды — нужно точное совпадение.
   Если кодов нет — проверяем семейство детали против семейства кода. */
function partMatchesGearbox(p, gb) {
    if (!gb || gb === 'all') return true;
    const codes = p.transCodes || [];
    if (codes.length) return codes.includes(gb);
    const fams = p.transmissions || [];
    const cf = gearboxFamsOf(gb);
    if (fams.length) return cf.length ? fams.some(f => cf.includes(f)) : true;
    return true;
}
/* VIN-строго: доноры + буквенный код КПП активного VIN + PR-несовместимость */
function vinStrictOk(p) {
    const av = gAV();
    if (av) {
        const gb = normGb(av.gearboxCode);
        const codes = p.transCodes || [];
        if (gb !== 'all' && codes.length && !codes.includes(gb)) return false;
        const pf = prFit(p);
        if (pf && pf.cls === 'n') return false;
    }
    if (!p.donors || !p.donors.length) return true;
    const cmp = pCompat(p);
    return !cmp || cmp.cls !== 'n';
}

/* ============================================================
   VIN-индикатор — рендерится в #vinBar (внутри заголовка гаража)
   ============================================================ */
function rVinBar() {
    const box = $('vinBar');
    if (!box) return;

    const av = gAV();
    if (!av || !av.ok) { box.innerHTML = ''; return; }

    const strictMark = SV.vinStrictFilter
        ? '<span class="nd-vin-tag">строго</span>'
        : '';

    box.innerHTML =
        '<span class="nd-vin">' +
        '<span class="nd-vin-ic">🔒</span>' +
        '<span class="nd-vin-lb">VIN …' + esc(av.vin.slice(-6)) + '</span>' +
        strictMark +
        '<button class="nd-vin-x" type="button" title="Снять VIN-фильтр">✕</button>' +
        '</span>';

    const btn = box.querySelector('.nd-vin-x');
    if (btn) btn.onclick = (e) => {
        e.stopPropagation();
        SV.activeVinId = null;
        SV.vinStrictFilter = false;
        applyVinFilters();
        sU(); rGar(); rSB(); rC();
        toast('VIN-фильтр снят');
    };
}

/* Иконка кузова для превью-переключателя в гараже */
function giBodyIcon(g) {
    const b = String(g.body || '');
    if (b.includes('caddy-van') || b.includes('caddy-kombi')) return '🚐';
    if (b.includes('pickup')) return '🛻';
    if (b.includes('estate')) return '🚙';
    if (b.includes('classic')) return '🚘';
    const pf = platformOf(g.body, g.model);
    return pf === 'caddy' ? '🚐' : pf === 'classic' ? '🚘' : pf === 'estate' ? '🚙' : '🚗';
}
function giBodyLabel(g) {
    if (g.body && BODIES[g.body]) return BODIES[g.body];
    const pf = platformOf(g.body, g.model);
    return { hatch: 'хэтчбек', estate: 'универсал', classic: 'седан', caddy: 'Caddy' }[pf] || '';
}

function rGar() {
    const l = $('gl'); if (!l) return;
    const cnt = $('gc');
    if (cnt) cnt.textContent = G.length ? '(' + G.length + ')' : '';
    if (!G.length) { l.innerHTML = '<div class="ge">Нет сохранённых машин</div>'; rVinBar(); return; }
    let h = '';
    for (const g of G) {
        const act = SV.activeVinId === g.id;
        const collapsed = !!(SV.garCollapsed && SV.garCollapsed[g.id]);
        const desc = [g.brand, g.model, g.year].filter(Boolean).join(' ');
        const col = lafColor(g.bodyColor);

        /* ── Превью-строка (видна и у свёрнутых карточек): иконка кузова +
              цвет кузова + год + мотор/КПП — переключатель между машинами ── */
        let metaHtml = '<div class="gi-meta">';
        metaHtml += '<span class="gi-ico" title="' + escA(giBodyLabel(g) || 'кузов') + '">' + giBodyIcon(g) + '</span>';
        if (col) metaHtml += '<span class="gi-dot" style="background:' + col.hex + '" title="' + escA(col.ru) + '"></span>';
        else if (g.bodyColor) metaHtml += '<span class="gi-dot unk" title="Цвет ' + escA(g.bodyColor) + ' (не в справочнике)"></span>';
        if (g.year) metaHtml += '<span class="gi-chip">' + esc(g.year) + '</span>';
        /* ✅ 1.10.0: пробег своей машины прямо в превью гаража */
        const gto = toForVin(g.vin);
        if (gto && gto.km != null) metaHtml += '<span class="gi-chip" title="Пробег этой машины (кабинет «Моя машина»)">🛠 ' + Number(gto.km).toLocaleString('ru-RU') + ' км</span>';
        if (g.engineCode) metaHtml += '<span class="gi-chip">⚙ ' + esc(g.engineCode) + '</span>';
        if (g.gearboxCode || g.transCode) metaHtml += '<span class="gi-chip">🔄 ' + esc(g.gearboxCode || g.transCode) + '</span>';
        if (g.gen) metaHtml += '<span class="gi-chip">🚘 ' + esc(g.gen) + '</span>';
        if (g.trim) metaHtml += '<span class="gi-chip gi-chip-b">🏷 ' + esc(g.trim) + '</span>';
        const bl = giBodyLabel(g);
        if (bl) metaHtml += '<span class="gi-chip gi-chip-b">' + esc(bl) + '</span>';
        metaHtml += '</div>';

        let colorHtml = '';
        if (g.bodyColor) {
            if (col) {
                const aka = (col.aka || []).filter(a => a !== col.code).slice(0, 2).join(', ');
                colorHtml = '<div class="vin-color-row"><span class="vin-color-swatch" style="background:' + col.hex + '"></span>'
                    + '<span class="vin-color-name">' + esc(col.ru) + ' <span class="vin-color-code">' + esc(col.code) + (aka ? ' · ' + esc(aka) : '') + '</span></span></div>';
            } else {
                colorHtml = '<div class="vin-color-row"><span class="vin-color-swatch unk">?</span><span class="vin-color-name">Код <span class="vin-color-code">' + esc(g.bodyColor) + '</span> — нет в справочнике</span></div>';
            }
        }
        if (g.roofColor && g.roofColor !== g.bodyColor) {
            const rc = lafColor(g.roofColor);
            colorHtml += '<div class="vin-color-row roof"><span class="vin-color-swatch" style="background:' + (rc ? rc.hex : '#888') + '"></span>'
                + '<span class="vin-color-name">Крыша: ' + esc(rc ? rc.ru + ' (' + rc.code + ')' : 'код ' + g.roofColor) + '</span></div>';
        }
        let weekHtml = '';
        if (g.prodDate) {
            const week = getWeekNumber(g.prodDate);
            const dstr = fmtDate(g.prodDate);
            if (week) {
                const serial = g.vin ? g.vin.slice(-6) : '';
                weekHtml = '<div class="vin-week-row" title="ISO-неделя производства. Серийный номер — последние 6 цифр VIN: порядковый номер автомобиля в потоке завода. В середине модельного года часто меняются артикулы — сверяйте дату при подборе.">'
                    + '<span class="vin-week-label">📅 ' + (dstr ? esc(dstr) : esc(g.prodDate)) + ' · неделя ' + week.week + '/' + week.year + '</span>'
                    + (serial ? '<span class="vin-serial">№ ' + serial + ' с конвейера</span>' : '')
                    + '</div>';
            }
        }
        let engineHtml = '';
        if (g.engineCode) {
            const details = getEngineDetails(g.engineCode);
            if (details) {
                const fam = details.family ? '<span class="vin-engine-fam" title="Семейство двигателей">' + esc(details.family) + '</span>' : '';
                engineHtml = '<div class="vin-engine-details"><span class="vin-engine-code">' + esc(g.engineCode) + '</span>'
                    + fam
                    + '<span class="vin-engine-spec">' + esc(details.volume) + ' л · ' + esc(details.power) + '</span>'
                    + '<span class="vin-engine-tech">' + esc([details.injection, details.ecu, details.euro].filter(Boolean).join(' · ') || '—') + '</span></div>';
            } else {
                engineHtml = '<div class="vin-engine-details"><span class="vin-engine-code">' + esc(g.engineCode) + '</span><span class="vin-engine-spec">код не в справочнике</span></div>';
            }
        }
        let transHtml = '';
        if (g.transCode) { const trans = TRANSMISSIONS[g.transCode]; transHtml = '<div class="vin-trans-row"><span class="vin-trans-label">🔄 КПП</span><span class="vin-trans-code">' + esc(g.transCode) + '</span>' + (trans ? '<span class="vin-trans-name">' + esc(trans) + '</span>' : '') + '</div>'; }
        if (g.gearboxCode) {
            const gi = gearboxInfo(g.gearboxCode);
            transHtml += '<div class="vin-trans-row"><span class="vin-trans-label">🔤 Код</span><span class="vin-trans-code">' + esc(g.gearboxCode) + '</span>'
                + (gi && gi.fams.length ? '<span class="vin-trans-name">' + esc(gi.fams.map(f => TRANSMISSIONS[f] || f).join(' / ')) + '</span>' : '')
                + '</div>';
        }
        let issuesHtml = '';
        const issues = issuesForGarageCar(g);
        if (issues.length) {
            /* Компактная миникнопка: карточка не перегружается, полный
               список открывается в модалке (oIssues). На кнопке —
               счётчик и раскладка по серьёзности. */
            const nH = issues.filter(i => i.severity === 'high').length;
            const nM = issues.filter(i => i.severity === 'medium').length;
            const nL = issues.length - nH - nM;
            issuesHtml = '<button type="button" class="gi-iss' + (nH ? ' has-high' : '') + '" data-vact="issues" data-gid="' + escA(g.id) + '"'
                + ' title="Открыть список типичных проблем мотора, КПП и кузова">'
                + '<span class="gi-iss-ic">⚠️</span>'
                + '<span class="gi-iss-lb">Болячки</span>'
                + '<span class="gi-iss-sev">' + (nH ? '🔴 ' + nH : '') + (nM ? '<span class="sep">🟡 ' + nM + '</span>' : '') + (nL ? '<span class="sep">🟢 ' + nL + '</span>' : '') + '</span>'
                + '<span class="gi-iss-n">' + issues.length + '</span></button>';
        }
        h += '<div class="gi' + (act ? ' active' : '') + '" data-gid="' + escA(g.id) + '"><div class="gi-top"><div class="gii"><div class="giv">' + esc(g.vin) + '</div><div class="gid">' + esc(desc || '—') + '</div></div>'
            + '<div class="gi-btns">'
            + (act ? '<button class="gi-tgl' + (collapsed ? ' collapsed' : '') + '" type="button" data-vact="collapse" data-gid="' + escA(g.id) + '" title="' + (collapsed ? 'Развернуть карточку' : 'Свернуть карточку') + '">▾</button>' : '')
            + '<button class="gix" data-vact="delete" data-gid="' + escA(g.id) + '" title="Удалить">✕</button>'
            + '</div></div>' + metaHtml;
        if (act && !collapsed) {
            h += '<div class="gi-details">';
            /* ✅ 1.10.1: честная подсказка, почему карточка «пустая»: оснащения
               этого VIN нет в базе (дамп ETKA даёт только список VIN либо
               запись без полей). Полный набор — как у машин с полной записью —
               появляется из базы/патча (garSyncFromDb) или из ручного ввода. */
            if (!g.engineCode && !g.gearboxCode && !g.transCode && !g.bodyColor && !g.prodDate) {
                const _dbrow = vinDbRow(g.vin);
                const _dbCore = !!(_dbrow && (_dbrow.engine || _dbrow.gearbox_code || _dbrow.paint || _dbrow.prod_date));
                const _dbPrN = (_dbrow && Array.isArray(_dbrow.pr)) ? _dbrow.pr.length : 0;
                let why = '';
                if (_dbCore) why = '';   // есть что подтянуть — garSyncFromDb дополнит карточку
                else if (_dbPrN) why = 'В базе нашлись только PR-коды оснащения (📋 «Оснащение (PR)» — ' + _dbPrN + ' шт.), а мотор/КПП/краска/дата в записи дампа отсутствуют.';
                else if (_dbrow) why = 'VIN есть в дампе ETKA, но запись без оснащения.';
                else why = 'Оснащение этого VIN в базе не найдено (ни в дампе ETKA, ни в ручных записях).';
                if (why) {
                    h += '<div class="gi-dbhint">📋 ' + why
                        + ' Поэтому карточка короче, чем у машин с полной записью. Заполните мотор/КПП/цвет/дату вручную («✎ Уточнить данные») или добавьте карточку ETKA этого VIN в <b>data/vin-db.patch.json</b> — и здесь появится всё: дата и неделя выпуска, цвета, коды, PR-оснащение.</div>';
                }
            }
            if (engineHtml) h += engineHtml; if (transHtml) h += transHtml; if (colorHtml) h += colorHtml; if (weekHtml) h += weekHtml; if (issuesHtml) h += issuesHtml;
            h += '<div class="gi-actions"><button class="gi-btn gi-btn-primary" data-vact="edit" data-gid="' + escA(g.id) + '">✎ Уточнить данные</button><button class="gi-btn" data-vact="pr" data-gid="' + escA(g.id) + '">📋 Оснащение (PR)</button><button class="gi-btn gi-btn-primary" data-vact="maintenance" data-gid="' + escA(g.id) + '">🛒 Расходники ТО</button><button class="gi-btn" data-vact="qr" data-gid="' + escA(g.id) + '">📱 QR-код</button><button class="gi-btn" data-vact="plate" data-gid="' + escA(g.id) + '">📍 Где коды</button><button class="gi-btn" data-vact="export" data-gid="' + escA(g.id) + '">📤 Экспорт</button></div></div>';
        }
        h += '</div>';
    }
    l.innerHTML = h; rVinBar();
}

const VIN_BODY_MAP = {
    'Hatchback 3d': '3d',
    'Hatchback 5d': '5d',
    'Hatchback': '',
    'Variant': 'estate',
    'Classic Sedan': 'classic',
    'Van': 'caddy-van',
    'Pickup': 'caddy-pickup'
};

/* ============================================================
   ОБЪЕДИНЁННЫЕ ФИЛЬТРЫ ШАПКИ
   Один select на «семейство + код»:
   · fmtr — ДВС: optgroup по семействам (EA111…), внутри —
     пункт «вся семья» (value fam:X) и коды моторов;
   · ftr — КПП: optgroup по семействам (084/085/002), внутри —
     пункт «вся семья» (value 084) и буквенные коды (value gb:CHL).
   Состояние по-прежнему хранится раздельно (SV.engineFilter/
   SV.engFamFilter, SV.transFilter/SV.gearboxFilter) — логика
   фильтрации не меняется, select лишь объединяет два контроля.
   ============================================================ */
function buildEngineSelect() {
    const sel = $('fmtr'); if (!sel) return;
    let h = '<option value="all">⚙️ Мотор: все</option>';
    Object.keys(ENGINE_FAMILIES).forEach(fam => {
        const F = ENGINE_FAMILIES[fam];
        const codes = F.codes.filter(k => ENGINES[k]);
        if (!codes.length) return;
        codes.sort((a, b) => {
            const ea = ENGINES[a], eb = ENGINES[b];
            return (parseFloat(ea.v) - parseFloat(eb.v)) || ea.v.localeCompare(eb.v)
                || (ea.hp - eb.hp) || a.localeCompare(b);
        });
        h += '<optgroup label="🧬 ' + escA(F.label) + '">';
        h += '<option value="fam:' + fam + '">— вся семья ' + fam + ' (' + codes.length + ' моторов) —</option>';
        codes.forEach(k => {
            const e = ENGINES[k];
            h += '<option value="' + k + '">' + k + ' · ' + esc(e.v) + ' ' + e.hp + ' л.с.' + (e.f === 'D' ? ' · дизель' : '') + '</option>';
        });
        h += '</optgroup>';
    });
    sel.innerHTML = h;
    syncEngineSelect();
}
function syncEngineSelect() {
    const sel = $('fmtr'); if (!sel) return;
    if (SV.engineFilter && SV.engineFilter !== 'all' && ENGINES[SV.engineFilter]) sel.value = SV.engineFilter;
    else if (SV.engFamFilter && SV.engFamFilter !== 'all' && ENGINE_FAMILIES[SV.engFamFilter]) sel.value = 'fam:' + SV.engFamFilter;
    else sel.value = 'all';
}
function buildTransSelect() {
    const sel = $('ftr'); if (!sel) return;
    let h = '<option value="all">🔄 КПП: все</option>';
    // Механика с базой буквенных кодов
    Object.keys(GEARBOX).forEach(fam => {
        const F = GEARBOX[fam];
        h += '<optgroup label="🔧 ' + escA(F.label) + '">';
        h += '<option value="' + fam + '">— вся семья ' + fam + ' —</option>';
        const codes = F.codes.concat(Object.keys(F.special || {})).sort();
        codes.forEach(c => { h += '<option value="gb:' + c + '">' + c + '</option>'; });
        h += '</optgroup>';
    });
    // Остальная механика (без базы кодов) + отдельные коды
    h += '<optgroup label="🔧 Механика — прочие">';
    ['020', '02K'].forEach(f => { if (TRANSMISSIONS[f]) h += '<option value="' + f + '">' + esc(TRANSMISSIONS[f]) + '</option>'; });
    Object.keys(GEARBOX_MISC).forEach(c => {
        if (!gearboxFamsOf(c).length) h += '<option value="gb:' + c + '">' + c + ' — отдельный код</option>';
    });
    h += '</optgroup>';
    // Автомат
    h += '<optgroup label="⚡ Автомат">';
    ['01M', '01N'].forEach(f => { if (TRANSMISSIONS[f]) h += '<option value="' + f + '">' + esc(TRANSMISSIONS[f]) + '</option>'; });
    h += '</optgroup>';
    sel.innerHTML = h;
    syncTransSelect();
}
function syncTransSelect() {
    const sel = $('ftr'); if (!sel) return;
    if (SV.gearboxFilter && SV.gearboxFilter !== 'all') {
        const val = 'gb:' + SV.gearboxFilter;
        // Код не из базы (введён через VIN вручную) — добавляем временную опцию
        if (!Array.from(sel.options).some(o => o.value === val)) {
            const o = document.createElement('option');
            o.value = val; o.textContent = SV.gearboxFilter + ' (вне базы)';
            sel.appendChild(o);
        }
        sel.value = val;
    } else if (SV.transFilter && SV.transFilter !== 'all' && TRANSMISSIONS[SV.transFilter]) {
        sel.value = SV.transFilter;
    } else {
        sel.value = 'all';
    }
}

/* ============================================================
   ОБЪЕДИНЁННЫЙ ФИЛЬТР «КУЗОВ / ПОКОЛЕНИЕ» (fbdy)
   Один select на два измерения:
   · поколения Polo (gen:6N1, gen:6N2) и кузова 3д/5д;
   · Classic (6V2/6KV) и Variant (6V5/6KV) — платформа 6K;
   · Caddy Van/Kombi (9K) и Pickup (9U).
   Значения: 'all' | 'gen:X' (поколение) | ключ BODIES (кузов).
   ============================================================ */
/* Ярлыки хэтчбеков для схемы «поколение → кузов» (в BODIES исторически латиница) */
const HATCH_LABELS = { '3d': 'хэтчбек 3-дверный', '5d': 'хэтчбек 5-дверный' };
const BODY_FULL_LABELS = {
    '3d': 'Polo хэтчбек 3д (6N)',
    '5d': 'Polo хэтчбек 5д (6N)',
    'classic': 'Polo Classic (6V2/6KV седан)',
    'estate': 'Polo Variant (6V5/6KV универсал)',
    'caddy-van': 'Caddy Van (9K)',
    'caddy-kombi': 'Caddy Kombi (9K)',
    'caddy-pickup': 'Caddy Pickup (9U)'
};
function buildBodyGenSelect() {
    const sel = $('fbdy'); if (!sel) return;
    const bodyOpt = b => (BODIES[b] ? '<option value="' + b + '">' + esc(BODY_FULL_LABELS[b] || BODIES[b]) + '</option>' : '');
    let h = '<option value="all">🚗 Кузов/поколение: все</option>';
    /* Polo 6N: поколение раскрывается в кузова —
       «6N1 дорестайл: 3д, 5д» и «6N2 рестайлинг: 3д, 5д».
       Комбо-значение «6N1|3d» ставит ОБА фильтра (поколение + кузов). */
    Object.keys(GENERATIONS).forEach(g => {
        h += '<optgroup label="🚘 ' + esc(GENERATIONS[g]) + '">';
        h += '<option value="gen:' + g + '">— всё поколение (3д + 5д)</option>';
        ['3d', '5d'].forEach(b => {
            h += '<option value="' + g + '|' + b + '">' + esc(HATCH_LABELS[b] || BODIES[b]) + '</option>';
        });
        h += '</optgroup>';
    });
    // Classic / Variant — платформа Seat Córdoba (6K)
    h += '<optgroup label="🚗 Classic / Variant (платформа 6K)">';
    h += bodyOpt('classic') + bodyOpt('estate');
    h += '</optgroup>';
    // Caddy (9K / 9U)
    h += '<optgroup label="📦 Caddy (9K / 9U)">';
    h += bodyOpt('caddy-van') + bodyOpt('caddy-kombi') + bodyOpt('caddy-pickup');
    h += '</optgroup>';
    // Страховка: кузовы, не попавшие в группы (если BODIES когда-то расширят)
    const placed = ['3d', '5d', 'classic', 'estate', 'caddy-van', 'caddy-kombi', 'caddy-pickup'];
    const rest = Object.keys(BODIES).filter(b => !placed.includes(b));
    if (rest.length) {
        h += '<optgroup label="🚗 Прочие кузова">';
        rest.forEach(b => { h += bodyOpt(b); });
        h += '</optgroup>';
    }
    sel.innerHTML = h;
    syncBodyGenSelect();
}
function syncBodyGenSelect() {
    const sel = $('fbdy'); if (!sel) return;
    const g = SV.genFilter, b = SV.bodyFilter;
    const hasG = g && g !== 'all' && GENERATIONS[g];
    const hasB = b && b !== 'all' && BODIES[b];
    // Поколение + кузов хэтчбека = комбо-пункт; иначе одиночные значения
    if (hasG && hasB && (b === '3d' || b === '5d')) sel.value = g + '|' + b;
    else if (hasG) sel.value = 'gen:' + g;
    else if (hasB) sel.value = b;
    else sel.value = 'all';
}

/* ✅ Правка №5: не сбрасывать фильтры, если они не были выставлены VIN'ом */
function applyVinFilters() {
    const av = gAV();
    if (!av) {
        // Сбрасываем только если до этого фильтры были выставлены VIN'ом
        if (SV._vinApplied) {
            SV.engineFilter = 'all';
            SV.engFamFilter = 'all';
            SV.bodyFilter = 'all';
            SV.transFilter = 'all';
            SV.gearboxFilter = 'all';
            SV.genFilter = 'all';
            SV._vinApplied = false;
        }
    } else {
        // Буквенный код КПП из «Уточнить данные»
        const gb = normGb(av.gearboxCode);
        // Семейство КПП: явный выбор или авто-вывод из буквенного кода
        let fam = (av.transCode && TRANSMISSIONS[av.transCode]) ? av.transCode : 'all';
        if (fam === 'all' && gb !== 'all') {
            const fs = gearboxFamsOf(gb);
            if (fs.length >= 1) fam = fs[0]; // у CHL/CHX два семейства — берём первое (084)
        }
        SV.engineFilter = (av.engineCode && ENGINES[av.engineCode]) ? av.engineCode : 'all';
        // Семейство ДВС — выводим из кода мотора
        SV.engFamFilter = (av.engineCode && engineFamOf(av.engineCode)) || 'all';
        SV.transFilter = fam;
        SV.gearboxFilter = gb;
        const bKey = VIN_BODY_MAP[av.body] || '';
        SV.bodyFilter = (bKey && BODIES[bKey]) ? bKey : 'all';
        SV.genFilter = (av.gen && GENERATIONS[av.gen]) ? av.gen : 'all';
        SV._vinApplied = true;
    }
    syncEngineSelect();
    syncTransSelect();
    syncBodyGenSelect();
    updateFilterStyling();
    sU();
}

function setAV(id) {
    const wasActive = !!SV.activeVinId;
    SV.activeVinId = SV.activeVinId === id ? null : id;

    if (!wasActive && SV.activeVinId) SV.vinStrictFilter = true;
    if (wasActive && !SV.activeVinId) SV.vinStrictFilter = false;
    if (SV.activeVinId === id) setHash('/vin/' + encodeURIComponent(id)); else syncCatHash();

    /* ✅ 1.10.0: у каждой машины свой пробег/ТО и свой журнал —
       при переключении VIN подтягиваем её данные и пересобираем индекс
       «меняли» (бейджи 🔧 в карточках деталей).
       ✅ 1.10.1: и свой список покупок — отметки переключаются вместе с VIN. */
    toSync();
    shopSync();
    logMigrateVins();
    _rebuildLogIndex();

    applyVinFilters();
    sU(); rGar(); rSB(); rTOWidget(); rC();

    const info = gAV();
    const av = gAV();
    let extra = '';
    if (av) {
        const bits = [];
        if (SV.engineFilter !== 'all') bits.push('⚙️ ' + SV.engineFilter + (engineFamOf(SV.engineFilter) ? ' · ' + engineFamOf(SV.engineFilter) : ''));
        else if (SV.engFamFilter !== 'all') bits.push('🧬 ' + SV.engFamFilter);
        if (SV.bodyFilter !== 'all') bits.push('🚗 ' + (BODIES[SV.bodyFilter] || SV.bodyFilter));
        if (SV.transFilter !== 'all') bits.push('🔄 ' + SV.transFilter);
        if (SV.gearboxFilter !== 'all') bits.push('🔤 ' + SV.gearboxFilter);
        if (TO.km != null) bits.push('🛠 ' + Number(TO.km).toLocaleString('ru-RU') + ' км');
        if (bits.length) extra = ' · ' + bits.join(' · ');
    }
    toast(info ? 'Активный VIN: …' + info.vin.slice(-6) + extra : 'VIN-фильтр снят');
}

function sGarV() {
    if (pubGuard()) return;
    /* v1.8.4: сохранение больше не зависит от кнопки «🔍 Декодировать».
       Раньше #g_sb оставалась disabled до успешного декодирования, а при
       !pGV.ok функция молча выходила — на телефоне «Сохранить» «не работало».
       Теперь VIN берётся прямо из поля и при необходимости декодируется
       офлайн (vD), а невалидный ввод показывается пользователю. */
    const raw = ($('g_vi').value || '').trim().toUpperCase();
    const re = $('g_re'), sb = $('g_sb');
    if (!vV(raw)) {
        if (re) { re.style.display = 'block'; re.innerHTML = '<span class="er">Введите VIN: 17 символов, без I, O, Q</span>'; }
        if (sb) sb.disabled = true;
        try { $('g_vi').focus(); } catch (e) { }
        return;
    }
    if (!pGV || !pGV.ok || pGV.vin !== raw) pGV = vD(raw);
    if (!pGV || !pGV.ok) { toast('Не удалось разобрать VIN', 'danger'); return; }
    if (G.some(g => g.vin === raw)) { toast('VIN уже в гараже', 'danger'); return; }
    const g = {
        id: 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        vin: raw,
        brand: pGV.brand || '',
        model: pGV.model || '',
        year: pGV.year || null,
        body: pGV.body || '',
        gen: pGV.gen || '',
        plant: pGV.plant || '',
        engines: Array.isArray(pGV.engines) ? pGV.engines : [],
        prodDate: '', engineCode: '', transCode: '', gearboxCode: '',
        equipCode: '', bodyColor: '', roofColor: '',
        addedAt: Date.now()
    };
    G.push(g); sG(); SV.activeVinId = g.id;
    // Оснащение из внешней базы VIN (если файл подключён): мотор, КПП, цвета, дата
    const dbrow = vinDbRow(g.vin);
    let fromDb = false;
    if (dbrow) {
        fromDb = true;
        const col = vinDbColors(dbrow);
        if (!g.engineCode && dbrow.engine && ENGINES[dbrow.engine]) g.engineCode = dbrow.engine;
        if (!g.gearboxCode && dbrow.gearbox_code) g.gearboxCode = String(dbrow.gearbox_code).toUpperCase();
        if (!g.transCode) g.transCode = vinDbFamily(dbrow, platformOf(g.body, g.model));
        if (!g.bodyColor && col.paint) g.bodyColor = String(col.paint).toUpperCase();
        if (!g.roofColor && col.roof) g.roofColor = String(col.roof).toUpperCase();
        if (!g.equipCode && col.equip) g.equipCode = String(col.equip).toUpperCase();
        if (!g.prodDate && dbrow.prod_date) g.prodDate = dbrow.prod_date;
    }
    applyVinFilters();
    /* ✅ 1.10.0: новая машина активирована — её пробег/ТО пусты, журнал
       этой машины пуст; виджет ТО и индекс «меняли» синхронизируем. */
    toSync(); _rebuildLogIndex();
    sU(); rGar(); rSB(); rTOWidget(); rC();
    cGM();
    toast(fromDb ? 'VIN сохранён · 📦 оснащение распознано по базе VIN' : 'VIN сохранён', 'success');
    window.ymGoal && window.ymGoal('vin_added');
}

function remV(id) {
    if (pubGuard()) return;
    const g = G.find(x => x.id === id); if (!g) return;
    if (!confirm('Удалить VIN ' + g.vin + '?')) return;
    G = G.filter(x => x.id !== id);
    if (SV.activeVinId === id) SV.activeVinId = null;
    /* ✅ 1.10.0: пробег/ТО и журнал удалённой машины НЕ стираем — при
       повторном добавлении того же VIN история вернётся. */
    toSync(); _rebuildLogIndex();
    applyVinFilters();
    sG(); sU(); rGar(); rSB(); rTOWidget(); rC();
    toast('VIN удалён', 'danger');
}

function oGM() {
    pGV = null;
    $('g_vi').value = '';
    $('g_re').style.display = 'none';
    $('g_re').innerHTML = '';
    $('g_sb').disabled = true;
    $('gmo').classList.add('show');
    setTimeout(() => $('g_vi').focus(), 50);
    window.ymGoal && window.ymGoal('vin_form_opened');
}
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
        const L = [];
        L.push('<b>' + esc(info.brand) + '</b> ' + esc(info.model));
        if (info.note) L.push('<span style="opacity:.75">ℹ️ ' + esc(info.note) + '</span>');
        if (info.year) L.push('Модельный год: <b>' + info.year + '</b> <span style="opacity:.6">(модельный год VW: август–июль)</span>');
        if (info.body && info.body !== '—') L.push('Кузов: ' + esc(info.body) + (info.gen ? ' · поколение ' + esc(info.gen) : ''));
        if (info.plant && info.plant !== '—') L.push('Завод: ' + esc(info.plant) + (info.plantCountry && info.plantCountry !== '—' ? ' (' + esc(info.plantCountry) + ')' : ''));
        if (info.modelCode) L.push('Код модели (символы 7–9 VIN): <b>' + esc(info.modelCode) + '</b>' + (info.serial ? ' · серийный № ' + esc(info.serial) : ''));
        if (info.engines && info.engines[0] !== '—') L.push('Возможные моторы: ' + info.engines.length + ' кодов — точный укажите через ✎ после сохранения');
        const dbrow = vinDbRow(raw);
        if (dbrow) {
            L.push('<span style="color:var(--ok)">📦 VIN найден в базе оснащения: ' + esc(vinDbSummary(dbrow) || 'да') + '</span>');
        }
        L.push('<span style="opacity:.7">🔤 Буквенные коды мотора/КПП в VIN не кодируются — они на наклейке в багажнике, в СТС и сервисной книжке</span>');
        re.innerHTML = L.join('<br>'); sb.disabled = false;
    } catch (e) {
        re.innerHTML = '<span class="er">Ошибка: ' + esc(e.message) + '</span>'; sb.disabled = true;
    } finally { btn.disabled = false; }
}

/* ============ ПРОФИЛЬ ============ */
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
function oProfileSoon() { toast('👤 Раздел появится в будущих релизах (но это не точно)', 'info'); }
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
    c.innerHTML = PROF_COLORS.map(col =>
        '<button type="button" class="prof-color' + (USER.color === col ? ' sel' : '') + '" data-color="' + col + '" style="background:' + col + '" title="' + col + '"></button>'
    ).join('');
    c.querySelectorAll('.prof-color').forEach(b => {
        b.onclick = () => { USER.color = b.dataset.color; renderColors(); updateProfPreview(); };
    });
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

/* ============ ДОНАТ / О ПРОГРАММЕ / БАГ ============ */
function oDonate() {
    $('donmo').classList.add('show');
    window.ymGoal && window.ymGoal('donate_opened');
}
function cDonate() { $('donmo').classList.remove('show'); }
const oAbout = () => { $('aboutmo').classList.add('show'); };
const cAbout = () => { $('aboutmo').classList.remove('show'); };
function oAPK() {
    openM('aboutmo');
    setTimeout(() => {
        const el = $('about_apk');
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const oldBg = el.style.background;
        const oldShadow = el.style.boxShadow;
        el.style.transition = 'all .3s ease';
        el.style.background = 'color-mix(in srgb, var(--a) 25%, transparent)';
        el.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--a) 30%, transparent)';
        setTimeout(() => {
            el.style.background = oldBg || '';
            el.style.boxShadow = oldShadow || '';
        }, 1200);
    }, 80);
}

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
    window.ymGoal && window.ymGoal('bug_opened');
};
const cBug = () => { $('bugmo').classList.remove('show'); };

/* ============ ИСТОРИЯ ВЕРСИЙ ============ */
async function fetchUpdateMeta() {
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('update.json: ' + r.status);
    const lm = r.headers.get('Last-Modified');
    let fallbackDate = '';
    if (lm) {
        const d = new Date(lm);
        if (!isNaN(d.getTime())) {
            fallbackDate = d.toISOString().slice(0, 10);
        }
    }
    const m = await r.json();
    return {
        appVersion: m && m.appVersion ? String(m.appVersion) : '',
        changelog: m && Array.isArray(m.changelog) ? m.changelog : [],
        releasedAt: m && m.releasedAt ? String(m.releasedAt) : '',
        fallbackDate: (m && m.releasedAt) || fallbackDate
    };
}

function _cmpVer(a, b) {
    const pa = String(a || '').split('.').map(n => parseInt(n, 10) || 0);
    const pb = String(b || '').split('.').map(n => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const x = pa[i] || 0, y = pb[i] || 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
}

function renderChangelog(list, currentVersion, fallbackDate) {
    const box = $('up_changelog');
    if (!box) return;
    if (!Array.isArray(list) || !list.length) {
        box.innerHTML = '<div class="cl-empty">Список изменений не опубликован.</div>';
        return;
    }
    const visible = list.filter(rel => rel && rel.version);
    if (!visible.length) {
        box.innerHTML = '<div class="cl-empty">Список изменений не опубликован.</div>';
        return;
    }
    let h = '';
    visible.forEach((rel, idx) => {
        const cmp = _cmpVer(rel.version, currentVersion);
        const isCurrent = cmp === 0;
        const dt = rel.date || (idx === 0 ? fallbackDate : '');
        const ch = Array.isArray(rel.changes) ? rel.changes : [];
        const head = '<div class="cl-head">'
            + '<span class="cl-ver">v' + esc(rel.version) + '</span>'
            + (dt ? '<span class="cl-date">' + esc(dt) + '</span>' : '')
            + '</div>';
        const body = ch.length
            ? '<ul class="cl-list">' + ch.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>'
            : '<div class="cl-empty">— без описания —</div>';
        if (isCurrent) {
            h += '<div class="cl-release current">' + head + body + '</div>';
        } else {
            h += '<details class="cl-release"><summary>' + head + '</summary>' + body + '</details>';
        }
    });
    box.innerHTML = h;
}

function oUp() {
    const u = $('up_url');
    if (u && !u.value) {
        let def = 'data/parts.json';
        try {
            const stored = localStorage.getItem(UPKEY);
            if (stored) {
                def = stored;
            } else if (location.protocol === 'http:' || location.protocol === 'https:') {
                def = location.origin +
                    location.pathname.replace(/[^/]*$/, '') +
                    'data/parts.json';
            }
        } catch (e) { }
        u.value = def;
    }
    const st = $('up_status'); if (st) st.innerHTML = '';
    const clBox = $('up_changelog');
    if (clBox) clBox.innerHTML = '<div class="cl-empty">⏳ Загружаем список изменений…</div>';
    $('upmo').classList.add('show');

    fetchUpdateMeta().then(meta => {
        renderChangelog(meta.changelog, APP_VERSION, meta.fallbackDate);
    }).catch(() => {
        renderChangelog(null, APP_VERSION, '');
    });
}

const cUp = () => { $('upmo').classList.remove('show'); window._upParts = null; };
function sUpUrl() {
    const u = $('up_url').value.trim();
    try { localStorage.setItem(UPKEY, u); } catch (e) { }
    toast(u ? 'URL сохранён' : 'URL очищен', 'success');
}

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

    const iKey = p => [
        p.cat || '',
        (p.sub || '').trim(),
        (p.oem || '').trim(),
        (p.name || '').trim()
    ].join('|');

    const seen = new Set(D.map(iKey));
    const serverSeen = new Set();
    let newCnt = 0;
    let dupCnt = 0;

    for (const raw of parts) {
        const p = nP(raw); if (!p) continue;
        const k = iKey(p);
        if (serverSeen.has(k)) { dupCnt++; continue; }
        serverSeen.add(k);
        if (!seen.has(k)) newCnt++;
    }

    const appNewer = remoteVer && remoteVer !== APP_VERSION;
    let h = '<div class="up-ok">';
    h += '<div style="font-weight:700;margin-bottom:8px">✓ Проверка завершена</div>';
    h += '<div style="margin-bottom:4px">Программа: <b>' + esc(APP_VERSION) + '</b>';
    if (appNewer) h += ' → <b style="color:var(--a)">' + esc(remoteVer) + '</b> — доступна новая';
    else h += ' — актуальна';
    h += '</div>';
    h += '<div style="margin-bottom:4px">У вас: <b>' + D.length + '</b> позиций · На сервере: <b>' + parts.length + '</b></div>';
    if (dupCnt > 0) {
        h += '<div style="margin-bottom:4px;font-size:.78rem;color:var(--mu)">'
            + 'В источнике <b>' + dupCnt + '</b> дубликатов (совпадают по категории+OEM+названию) — '
            + 'они не считаются новыми'
            + '</div>';
    }
    h += '<div style="margin-bottom:8px">Новых для добавления: <b>' + newCnt + '</b></div>';
    h += '<div class="up-actions">';
    h += '<button class="bn ok-btn" onclick="doFullUpdate()">🔄 Обновить всё</button>';
    if (newCnt) h += '<button class="bn p" onclick="applyUpMerge()">➕ Добавить новые (' + newCnt + ')</button>';
    h += '</div></div>';
    st.innerHTML = h;
}

function doFullUpdate() {
    toast('Загружаем свежую версию…', 'success');
    try { localStorage.removeItem('vw_polo_data_ver'); } catch (e) { }
    setTimeout(() => location.replace(location.pathname + '?v=' + Date.now()), 300);
}

function applyUpMerge() {
    const parts = window._upParts;
    if (!parts) { toast('Нет данных', 'danger'); return; }
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

/* ============ ЗАГРУЗКА ============ */
function _guessType(path) {
    const p = String(path || '').toLowerCase();
    if (/parts-\d|parts\.json|\/parts\//.test(p)) return 'parts';
    if (/categories\.json/.test(p)) return 'categories';
    if (/sections\.json|composition\.json/.test(p)) return 'sections';
    if (/analogs\.json/.test(p)) return 'analogs';
    if (/workshops\.json/.test(p)) return 'workshops';
    return 'unknown';
}
/* ============ СЛИЯНИЕ И ДЕДУПЛИКАЦИЯ ДЕТАЛЕЙ ============ */
function _mergeParts(a, b) {
    const out = { ...a };
    if (!out.name && b.name) out.name = b.name;
    if (!out.oem && b.oem) out.oem = b.oem;
    if (!out.sub && b.sub) out.sub = b.sub;
    if (b.verified) out.verified = true;
    if (!out.price && b.price != null) out.price = b.price;
    if (b.favorite) out.favorite = true;
    if (!out.notes && b.notes) out.notes = b.notes;
    if (!out.shopUrl && b.shopUrl) out.shopUrl = b.shopUrl;
    if (!out.status && b.status) out.status = b.status;

    const uniq = (x, y) => Array.from(new Set([...(x || []), ...(y || [])]));
    out.analogs = uniq(a.analogs, b.analogs);
    out.donors = uniq(a.donors, b.donors);
    out.engines = uniq(a.engines, b.engines);
    out.bodies = uniq(a.bodies, b.bodies);
    out.transmissions = uniq(a.transmissions, b.transmissions);
    out.transCodes = uniq(a.transCodes, b.transCodes);
    out.trims = uniq(a.trims, b.trims);
    out.gens = uniq(a.gens, b.gens);

    const im = new Map();
    [...(a.inst || []), ...(b.inst || [])].forEach(i => { if (i.text && !im.has(i.text)) im.set(i.text, i); });
    out.inst = Array.from(im.values());

    out.photos = Array.from(new Set([...(a.photos || []), ...(b.photos || [])])).slice(0, 12);

    if (Array.isArray(b.parts) && b.parts.length) {
        const pm = new Map();
        [...(a.parts || []), ...b.parts].forEach(p => {
            const k = (p.oem || '') + '|' + (p.name || '');
            if (!pm.has(k)) pm.set(k, p);
        });
        out.parts = Array.from(pm.values());
    }

    const hm = new Map();
    [...(a.priceHistory || []), ...(b.priceHistory || [])].forEach(h => hm.set(h.ts, h));
    out.priceHistory = Array.from(hm.values()).sort((x, y) => x.ts - y.ts).slice(-50);

    return out;
}

function _dedupeParts(parts) {
    const map = new Map();
    const keyOf = p => (p.oem || '').toLowerCase() + '|' + (p.name || '').toLowerCase();
    for (const p of parts) {
        if (!p) continue;
        const k = keyOf(p);
        if (!k || k === '|') continue;
        if (map.has(k)) map.set(k, _mergeParts(map.get(k), p));
        else map.set(k, p);
    }
    return Array.from(map.values());
}

/* ✅ 1.8.1: слияние серверных данных вынесено в функции — их используют
   обе ветки lAll() (полная загрузка и «лёгкая» перезагрузка поверх кэша) */
function _mergeCats(cats) {
    if (!Array.isArray(cats)) return;
    for (const c of cats) {
        if (!c || !c.id) continue;
        if (!CATS.find(x => x.id === c.id))
            CATS.push({ id: c.id, label: c.label || c.id, icon: c.icon || '📁' });
    }
}
function _mergeSections(secs) {
    if (!secs || typeof secs !== 'object' || Array.isArray(secs)) return;
    for (const sid of Object.keys(secs)) {
        const srv = secs[sid];
        if (!srv || typeof srv !== 'object') continue;
        const loc = CUSTOM.sections[sid];
        if (!loc) { CUSTOM.sections[sid] = srv; continue; }
        /* 1.11.0: справочники — серверные данные, локальная копия в localStorage
           только кеширует их между запусками. Раньше делалось
           Object.assign({}, srv, loc), т.е. ЛОКАЛЬНЫЕ rows имели приоритет,
           и дополненный data/sections.json не доезжал до тех, кто уже открывал
           приложение: раздел навсегда оставался со старым набором строк
           (исключение было сделано только для пустых локальных rows).
           Теперь rows/cols всегда берутся с сервера, а пользовательские
           label/icon (их можно править в интерфейсе) сохраняются. */
        const merged = Object.assign({}, srv);
        const lbl = String(loc.label || '').trim(), ico = String(loc.icon || '').trim();
        if (lbl) merged.label = lbl;
        if (ico) merged.icon = ico;
        if (!Array.isArray(merged.rows) || !merged.rows.length) {
            /* сервер прислал пустой раздел — не затираем локальные строки,
               иначе справочник мигнёт пустым при ошибке сети */
            if (Array.isArray(loc.rows) && loc.rows.length) {
                merged.rows = loc.rows;
                if (Array.isArray(loc.cols) && (!Array.isArray(merged.cols) || !merged.cols.length)) merged.cols = loc.cols;
            }
        }
        CUSTOM.sections[sid] = merged;
    }
    sMeta();
}
async function _mergeWorkshops(wss) {
    if (!Array.isArray(wss) || !wss.length) return;
    const normalized = wss.map(nW).filter(Boolean);
    const existingIds = new Set(W.map(w => w.id));
    const existingNames = new Set(W.map(w => (w.name || '').toLowerCase()));
    for (const w of normalized) {
        const nLow = (w.name || '').toLowerCase();
        if (!existingIds.has(w.id) && !existingNames.has(nLow)) {
            W.push(w);
            existingIds.add(w.id);
            existingNames.add(nLow);
        }
    }
    if (useIDB) { try { await iMany(SW, W); } catch (e) { } } else sWk();
}
async function lAll() {
    // 0. ✅ 1.8.1: пользовательская мета грузится ПЕРВОЙ — серверный мердж
    //    ниже не перетрёт её через sMeta(), а кастомные категории увидит nP()
    lMeta();

    // 1. Локальные данные из IndexedDB / localStorage
    try {
        const p = await iAll(SP), w = await iAll(SW);
        D = p.map(nP).filter(Boolean);
        W = w.map(nW).filter(Boolean);
    } catch (e) { useIDB = false; lLS(); }

    const base = location.origin + location.pathname.replace(/[^/]*$/, '');

    // 2. Мета update.json (версия + список файлов)
    let remoteVersion = '';
    let files = [];
    try {
        const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
        if (r.ok) {
            const m = await r.json();
            remoteVersion = String(m.appVersion || '');
            if (Array.isArray(m.files) && m.files.length) files = m.files;
            if (Array.isArray(m.changelog)) _setChangelog(m.changelog);
        }
    } catch (e) { console.warn('update.json недоступен', e); }

    if (!files.length) {
        files = [
            { path: 'data/parts.json', type: 'parts' },
            { path: 'data/parts-01-engine-fuel-ignition.json', type: 'parts' },
            { path: 'data/parts-02-cooling-heating-brakes-suspension.json', type: 'parts' },
            { path: 'data/parts-03-trans-exh-elec-bulbs.json', type: 'parts' },
            { path: 'data/parts-04-body-interior-maint-fluids-roadkit.json', type: 'parts' },
            { path: 'data/parts-05-rear-axle-controls.json', type: 'parts' },
            { path: 'data/categories.json', type: 'categories' },
            { path: 'data/sections.json', type: 'sections' },
            { path: 'data/analogs.json', type: 'analogs' },
            { path: 'data/workshops.json', type: 'workshops' }
        ];
    }

    // 3. Пропуск сети, если версия базы не менялась и данные есть
    let lastDataVer = '';
    try { lastDataVer = localStorage.getItem('vw_polo_data_ver') || ''; } catch (e) { }
    const skipFetch = D.length > 50 && remoteVersion && remoteVersion === lastDataVer;

    if (skipFetch) {
        console.log('[lAll] data v' + remoteVersion + ' cached · ' + D.length + ' items');
        /* ✅ 1.8.1: даже при совпавшей версии перечитываем ЛЁГКИЕ файлы
           (sections/categories/workshops). Раньше skipFetch отменял всю
           загрузку — и обновлённый sections.json без смены appVersion
           не попадал на клиент: разделы в сайдбаре есть, а таблицы пустые. */
        const typeOf = item => {
            const f = typeof item === 'string' ? item : item.path;
            return (typeof item === 'string' ? null : item.type) || _guessType(f);
        };
        const metaFiles = files.filter(item => ['sections', 'categories', 'workshops', 'analogs'].includes(typeOf(item)));
        if (!metaFiles.some(item => typeOf(item) === 'sections'))
            metaFiles.push({ path: 'data/sections.json', type: 'sections' });
        if (!metaFiles.some(item => typeOf(item) === 'analogs'))
            metaFiles.push({ path: 'data/analogs.json', type: 'analogs' });
        const mres = await Promise.all(metaFiles.map(async (item) => {
            const f = typeof item === 'string' ? item : item.path;
            try {
                const r = await fetch(f + '?t=' + Date.now(), { cache: 'no-store' });
                if (!r.ok) return null;
                return { type: typeOf(item), data: await r.json() };
            } catch (e) { return null; }
        }));
        for (const res of mres) {
            if (!res) continue;
            if (res.type === 'sections') _mergeSections(res.data);
            else if (res.type === 'categories') _mergeCats(res.data);
            else if (res.type === 'analogs') { if (res.data && typeof res.data === 'object') AKB = normalizeAKB(res.data); }
            else if (res.type === 'workshops') await _mergeWorkshops(res.data);
        }
        /* ✅ 1.9.0: цепи кроссов + база знаний — даже из кэша */
        applyAnalogKb();
    } else {
        const t0 = performance.now();

        // 4. ПАРАЛЛЕЛЬНАЯ загрузка всех файлов
        const results = await Promise.all(files.map(async (item) => {
            const f = typeof item === 'string' ? item : item.path;
            const type = typeof item === 'string' ? _guessType(f) : item.type;
            try {
                const r = await fetch(f + '?t=' + Date.now(), { cache: 'no-store' });
                if (!r.ok) return null;
                return { type, data: await r.json() };
            } catch (e) { console.warn('fetch fail:', f, e); return null; }
        }));

        let serverParts = [], cats = null, secs = null, wss = null, akbData = null;
        for (const res of results) {
            if (!res) continue;
            switch (res.type) {
                case 'parts': if (Array.isArray(res.data)) serverParts = serverParts.concat(res.data); break;
                case 'categories': if (Array.isArray(res.data)) cats = res.data; break;
                case 'sections':
                    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data))
                        secs = Object.assign(secs || {}, res.data);
                    break;
                case 'analogs':
                    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) akbData = res.data;
                    break;
                case 'workshops': if (Array.isArray(res.data)) wss = res.data; break;
            }
        }

        /* Фолбэк для чистого локального запуска / восстановления: боевого
           parts.json нет. Сначала пробуем ОРИГИНАЛ каталога (parts.full.json —
           слив data-src/parts-01..10), затем демо. Имена намеренно не совпадают
           с боевым путём data/parts.json — затирание при деплое невозможно. */
        if (!serverParts.length) {
            for (const alt of ['data/parts.full.json', 'data/parts.demo.json']) {
                try {
                    const rd = await fetch(alt + '?t=' + Date.now(), { cache: 'no-store' });
                    if (rd.ok) { const arr = await rd.json(); if (Array.isArray(arr) && arr.length) { serverParts = arr; break; } }
                } catch (e) { /* пробуем следующий */ }
            }
        }

        // 5. Нормализация + дедупликация всего серверного массива
        const normalized = serverParts.map(nP).filter(Boolean);
        const deduped = _dedupeParts(normalized);
        console.log('[lAll] files:' + files.length + ' · raw:' + serverParts.length +
            ' · after dedupe:' + deduped.length +
            ' · ' + Math.round(performance.now() - t0) + 'ms');

        // 6. Мерджим в локальную D — сохраняем правки пользователя
        if (deduped.length) {
            const keyOf = x => (x.oem || '').toLowerCase() + '|' + (x.name || '').toLowerCase();
            const localMap = new Map(D.map(x => [keyOf(x), x]));
            let add = 0, upd = 0;
            for (const np of deduped) {
                const k = keyOf(np);
                if (!localMap.has(k)) { D.push(np); localMap.set(k, np); add++; }
                else {
                    const old = localMap.get(k);
                    const user = {
                        id: old.id, status: old.status, favorite: old.favorite,
                        notes: old.notes, price: old.price, currency: old.currency,
                        priceHistory: old.priceHistory, shopUrl: old.shopUrl, photos: old.photos
                    };
                    Object.assign(old, np, user);
                    upd++;
                }
            }
            console.log('[lAll] add:' + add + ' · update:' + upd);
        }

        // 7. Финальный проход по объединённому массиву + сохранение
        D = _dedupeParts(D);
        /* ✅ 1.9.0: аналоги — цепочки кроссов + база знаний. Мерджим ДО
           сохранения, чтобы обогащённые analogs физически оседали в базе. */
        if (akbData) AKB = normalizeAKB(akbData);
        applyAnalogKb();
        if (useIDB) try { await iMany(SP, D); } catch (e) { } else sD();

        /* ✅ 1.8.1: версию базы записываем, только если детали реально
           загрузились — ошибка сети/404 больше не «замораживает» устаревшие
           данные в кэше (иначе skipFetch навсегда отменит докачку) */
        if (remoteVersion && serverParts.length) {
            try { localStorage.setItem('vw_polo_data_ver', remoteVersion); } catch (e) { }
        }

        /* ✅ 1.8.1: единые функции слияния (см. _mergeCats/_mergeSections/
           _mergeWorkshops) — те же правила применяются и в ветке skipFetch */
        _mergeCats(cats);
        _mergeSections(secs);
        await _mergeWorkshops(wss);
    }

    // 8. Гараж, профиль, ТО, логи (мета загружена в шаге 0 — ✅ 1.8.1)
    // ✅ 1.10.0: активный VIN валидируем ДО загрузки ТО/логов — от него
    // зависит, какой машине принадлежат пробег и записи журнала.
    lG(); lU(); lProfile();
    if (SV.activeVinId && !G.some(g => g.id === SV.activeVinId)) SV.activeVinId = null;
    /* ✅ 1.10.1: lShopAll() — после мерджа каталога (D готов): отметки
       списка покупок восстанавливаются устойчивыми ключами «oem|название». */
    lTO(); lShopAll(); await lLogs();
    try { vk = localStorage.getItem(VK) || ''; } catch (e) { }
}

/* ============ ТЕМА ============ */
function aTh() {
    THEMES.forEach(t => document.body.classList.remove(t.cls));
    const t = THEMES.find(x => x.id === SV.theme) || THEMES[2];
    document.body.classList.add(t.cls);
    document.body.style.colorScheme = (t.id === 'light' || t.id === 'paper') ? 'light' : 'dark';
}
function oTheme() { renderThemeGrid(); openM('thememmo'); }
const cTheme = () => closeM('thememmo');
function renderThemeGrid() {
    const g = $('themeGrid');
    if (!g) return;
    g.innerHTML = THEMES.map(t =>
        '<button type="button" class="th-card' + (SV.theme === t.id ? ' on' : '') + '" data-th="' + t.id + '">' +
        '<div class="th-preview" style="background:' + t.preview + '"></div>' +
        '<div class="th-label">' + t.icon + ' ' + esc(t.label) + '</div>' +
        '</button>'
    ).join('');
    g.querySelectorAll('[data-th]').forEach(b => { b.onclick = () => sTheme(b.dataset.th); });
}
function sTheme(id) {
    if (!THEMES.some(t => t.id === id)) return;
    SV.theme = id;
    aTh();
    sU();
    renderThemeGrid();
    const t = THEMES.find(x => x.id === id);
    toast('🎨 Тема: ' + t.label, 'success');
    window.ymGoal && window.ymGoal('theme_changed', { theme: id });
}
/* ============ UI / САЙДБАР / АДАПТИВ ============ */
function setV(v, s) {
    SV.view = v;
    if (!s) sU();
    const tg = $('viewToggle'), lb = $('vtLbl');
    if (tg) tg.checked = v === 'tree';
    if (lb) lb.textContent = v === 'tree' ? '🗂 Дерево' : '▦ Плитка';
    rC();
}
function aSS() {
    const m = window.innerWidth <= 900, sb = $('sb'), bd = document.body;
    if (!m && SV.sidebarCollapsed) { sb.classList.add('collapsed'); bd.classList.add('sidebar-collapsed'); }
    else { sb.classList.remove('collapsed'); bd.classList.remove('sidebar-collapsed'); }
}
function rSz() {
    aSS();
    const m = window.innerWidth <= 900;
    const mb = $('mob');
    if (mb) mb.style.display = m ? 'flex' : '';
    if (!m) cMM();
}
function tSB() {
    if (window.innerWidth <= 900) return;
    SV.sidebarCollapsed = !SV.sidebarCollapsed;
    aSS(); sU();
}
const oMM = () => { $('sb').classList.add('open-mobile'); $('ov').classList.add('show'); };
const cMM = () => { $('sb').classList.remove('open-mobile'); $('ov').classList.remove('show'); };
const tMM = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    $('sb').classList.contains('open-mobile') ? cMM() : oMM();
};

/* Виртуальные (не товарные) разделы — для сайдбара */
const VIRTUAL_CATS = {
    Dash: { label: 'Моя машина', icon: '🚘' },
    Workshops: { label: 'Мастерские/СТО', icon: '🔧' },
    Log: { label: 'Журнал обслуживания', icon: '📖' },
    Diagnostics: { label: 'Диагностика (OBD)', icon: '🩺' },
    Torque: { label: 'Моменты затяжки', icon: '🔩' },
    Lamps: { label: 'Лампы и цоколи', icon: '💡' },
    FluidSpecs: { label: 'Жидкости и объёмы', icon: '🛢️' },
    Wheels: { label: 'Колёса и шины', icon: '🛞' },
    Wiring: { label: 'Электросхемы', icon: '⚡' },
    WiringFuses: { label: 'Предохранители 6N1', icon: '🔌' },
    WiringRelays: { label: 'Реле 6N1', icon: '🎛️' },
    WiringRef: { label: 'Провода и клеммы', icon: '🎨' },
    WiringPins: { label: 'Разъёмы и пины', icon: '🔗' },
};

/* ✅ 1.8.1: табличные разделы-справочники из data/sections.json.
   Рендерятся через rSec даже если файл ещё не загрузился —
   с понятным экраном «не загружено» вместо пустого списка деталей. */
/* 1.11.0: добавлены «Лампы и цоколи» (Lamps) и «Жидкости и объёмы» (FluidSpecs).
   Оба справочника собираются из карточек каталога (Bulbs / Fluids) скриптом
   tools/build-sections.py — расхождений между справочником и артикулами не бывает. */
/* 1.12.0: добавлен «Wheels» — колёсные параметры (PCD/CB/ET/резьба/момент)
   и размеры шин с давлениями; строки размеров собираются генератором прямо из
   карточек каталога, поэтому справочник не может разъехаться с данными. */
const SEC_TABLE_IDS = ['Torque', 'Diagnostics', 'Lamps', 'FluidSpecs', 'Wheels', 'Wiring', 'WiringFuses', 'WiringRelays', 'WiringRef', 'WiringPins'];

/* ============================================================
   Отфильтрованный список для счётчиков в сайдбаре.
   ============================================================ */
function computeFilteredForSidebar() {
    const t = nz(SV.searchQuery).split(/\s+/).filter(Boolean);
    let f = D;

    if (SV.activeVinId && SV.vinStrictFilter) f = f.filter(vinStrictOk);

    if (SV.statusFilter && SV.statusFilter !== 'all')
        f = f.filter(p => (p.status || '') === SV.statusFilter);

    if (SV.engineFilter && SV.engineFilter !== 'all')
        f = f.filter(p => {
            const arr = p.engines || [];
            return !arr.length || arr.includes(SV.engineFilter);
        });

    if (SV.engFamFilter && SV.engFamFilter !== 'all')
        f = f.filter(p => partMatchesEngFam(p, SV.engFamFilter));

    if (SV.bodyFilter && SV.bodyFilter !== 'all')
        f = f.filter(p => {
            const arr = p.bodies || [];
            return !arr.length || arr.includes(SV.bodyFilter);
        });

    if (SV.transFilter && SV.transFilter !== 'all')
        f = f.filter(p => partMatchesTrans(p, SV.transFilter));

    if (SV.gearboxFilter && SV.gearboxFilter !== 'all')
        f = f.filter(p => partMatchesGearbox(p, SV.gearboxFilter));

    if (SV.genFilter && SV.genFilter !== 'all')
        f = f.filter(p => {
            const arr = p.gens || [];
            return !arr.length || arr.includes(SV.genFilter);
        });

    if (t.length) f = f.filter(p => mP(p, t));
    return f;
}

function rSB() {
    const n = $('nl');
    if (!n) return;
    n.innerHTML = '';
    if (!SV.expandedCats || typeof SV.expandedCats !== 'object') SV.expandedCats = {};

    const filtered = computeFilteredForSidebar();
    const byCat = {};
    let favCount = 0;
    for (const p of filtered) {
        byCat[p.cat] = (byCat[p.cat] || 0) + 1;
        if (p.favorite) favCount++;
    }

    const cnt = id => {
        const sec = CUSTOM.sections && CUSTOM.sections[id];
        if (sec && Array.isArray(sec.rows)) return sec.rows.length;

        if (id === 'Workshops') return W.length;
        if (id === 'Log') return carLogs().length;   // ✅ 1.10.0: счётчик журнала — по активной машине
        if (id === 'Diagnostics')
            return (CUSTOM.sections.Diagnostics && CUSTOM.sections.Diagnostics.rows || []).length;
        if (id === 'Torque')
            return (CUSTOM.sections.Torque && CUSTOM.sections.Torque.rows || []).length;

        if (id === 'All') return filtered.length;
        if (id === 'Favorites') return favCount;

        return byCat[id] || 0;
    };

    const addItem = (id, icon, label, count, cls, sub) => {
        const li = document.createElement('li');
        li.className = 'ni ' + (SV.activeCat === id && !SV.activeSub ? 'active ' : '') + (cls || '') + (sub ? ' sub' : '');
        li.setAttribute('tabindex', '-1');
        li.onclick = () => {
            SV.activeCat = id;
            SV.activeSub = null;
            sU(); rSB(); rC();
            if (window.innerWidth <= 900) cMM();
            $('ca').scrollTop = 0;
        };
        const dimStyle = (count === 0 && id !== 'All') ? ' style="opacity:.45"' : '';
        li.innerHTML =
            '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'
            + icon + ' ' + esc(label) +
            '</span><span class="bdg"' + dimStyle + '>' + count + '</span>';
        n.appendChild(li);
    };

    const addSection = label => {
        const li = document.createElement('li');
        li.className = 'nd-label';
        li.textContent = label;
        n.appendChild(li);
    };

    const addCatFolder = (c) => {
        const subs = new Map();
        for (const p of filtered) {
            if (p.cat !== c.id) continue;
            const s = (p.sub || '').trim();
            if (!s) continue;
            subs.set(s, (subs.get(s) || 0) + 1);
        }
        const subList = Array.from(subs.entries())
            .sort((a, b) => a[0].localeCompare(b[0], 'ru'));

        const kids = CATS.filter(k => k.parent === c.id);

        const total = cnt(c.id) + kids.reduce((s, k) => s + cnt(k.id), 0);

        const expanded = !!SV.expandedCats[c.id];
        const isAllActive = SV.activeCat === c.id && !SV.activeSub;

        const li = document.createElement('li');
        li.className = 'ni folder' + (expanded ? ' open' : '') + (isAllActive ? ' active' : '');
        li.setAttribute('tabindex', '-1');
        li.innerHTML =
            '<span class="fold-arr">▶</span>' +
            '<span class="fold-lb">' + c.icon + ' ' + esc(c.label) + '</span>' +
            '<span class="bdg"' + (total === 0 ? ' style="opacity:.45"' : '') + '>' + total + '</span>';
        li.onclick = () => {
            SV.expandedCats[c.id] = !SV.expandedCats[c.id];
            sU(); rSB();
        };
        n.appendChild(li);

        if (!expanded) return;

        const allLi = document.createElement('li');
        allLi.className = 'ni sub' + (isAllActive ? ' active' : '');
        allLi.setAttribute('tabindex', '-1');
        allLi.innerHTML =
            '<span style="flex:1;min-width:0">📦 Все разделы</span>' +
            '<span class="bdg">' + total + '</span>';
        allLi.onclick = (e) => {
            e.stopPropagation();
            SV.activeCat = c.id;
            SV.activeSub = null;
            sU(); rSB(); rC();
            if (window.innerWidth <= 900) cMM();
            $('ca').scrollTop = 0;
        };
        n.appendChild(allLi);

        subList.forEach(([sub, count]) => {
            const subActive = SV.activeCat === c.id && SV.activeSub === sub;
            const sli = document.createElement('li');
            sli.className = 'ni sub' + (subActive ? ' active' : '');
            sli.setAttribute('tabindex', '-1');
            sli.innerHTML =
                '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'
                + esc(sub) + '</span>' +
                '<span class="bdg"' + (count === 0 ? ' style="opacity:.45"' : '') + '>' + count + '</span>';
            sli.onclick = (e) => {
                e.stopPropagation();
                SV.activeCat = c.id;
                SV.activeSub = sub;
                sU(); rSB(); rC();
                if (window.innerWidth <= 900) cMM();
                $('ca').scrollTop = 0;
            };
            n.appendChild(sli);
        });

        kids.forEach(k => {
            const kidActive = SV.activeCat === k.id && !SV.activeSub;
            const kli = document.createElement('li');
            kli.className = 'ni sub' + (kidActive ? ' active' : '');
            kli.setAttribute('tabindex', '-1');
            const kc = cnt(k.id);
            kli.innerHTML =
                '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'
                + k.icon + ' ' + esc(k.label) + '</span>' +
                '<span class="bdg"' + (kc === 0 ? ' style="opacity:.45"' : '') + '>' + kc + '</span>';
            kli.onclick = (e) => {
                e.stopPropagation();
                SV.activeCat = k.id;
                SV.activeSub = null;
                sU(); rSB(); rC();
                if (window.innerWidth <= 900) cMM();
                $('ca').scrollTop = 0;
            };
            n.appendChild(kli);
        });
    };

    addItem('Dash', '🚘', 'Моя машина', SV.activeVinId ? 1 : 0);
    addItem('Favorites', '⭐', 'Избранное', cnt('Favorites'), 'fav');
    addItem('All', '📦', 'Все системы', cnt('All'));

    for (const grp of CAT_GROUPS) {
        addSection(grp.label);

        for (const cid of grp.cats) {
            if (grp.virtual && VIRTUAL_CATS[cid]) {
                const v = VIRTUAL_CATS[cid];
                addItem(cid, v.icon, v.label, cnt(cid));
                continue;
            }
            const c = CATS.find(x => x.id === cid);
            if (!c) continue;

            if (c.parent) continue;

            const hasSubs = filtered.some(p =>
                p.cat === cid && (p.sub || '').trim()
            );
            const hasKids = CATS.some(k => k.parent === cid);

            if (hasSubs || hasKids) {
                addCatFolder(c);
            } else {
                addItem(c.id, c.icon, c.label, cnt(c.id));
            }
        }
    }
}

/* ============ ПОИСК / ФИЛЬТРЫ ============ */
const uSC = () => $('scl').classList.toggle('show', !!(SV.searchQuery || '').length);
const cS = () => { SV.searchQuery = ''; $('sr').value = ''; uSC(); sU(); rC(); };
function resetFilters() {
    SV.searchQuery = ''; $('sr').value = ''; uSC();
    SV.statusFilter = 'all'; $('sf').value = 'all';
    SV.engineFilter = 'all';
    SV.engFamFilter = 'all';
    syncEngineSelect();
    SV.bodyFilter = 'all';
    SV.genFilter = 'all';
    syncBodyGenSelect();
    SV.transFilter = 'all';
    SV.gearboxFilter = 'all';
    syncTransSelect();
    SV.sortBy = 'default'; $('ss').value = 'default';
    SV._vinApplied = false;
    SV.fitOnly = false;
    updateFilterStyling(); sU(); rSB(); rC();
    toast('Фильтры сброшены', 'success');
}
function rD() {
    askConfirm(
        'При пересборке ваши записи и фото, внесённые вручную, удалятся.\n\n' +
        'Вы уверены?\n\n' +
        '💡 Если уверены — сначала сделайте Экспорт JSON.',
        doRebuild,
        { title: '♻️ Пересобрать базу?', yes: 'Да, пересобрать', no: 'Нет', showExport: true }
    );
}

async function doRebuild() {
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
    const h = nz([p.oem || '', p.name || '', ...(p.analogs || []), ...(p.donors || []),
    ...((p.inst || []).map(i => i.text)), p.notes || '',
    ...(p.engines || []), ...((p.engines || []).map(e => engineFamOf(e)).filter(Boolean)),
    ...(p.transmissions || []), ...(p.transCodes || []), ...(p.bodies || []), ...(p.gens || [])].join('  '));
    /* Второй проход — без пробелов/знаков: «030115561B» находит «030 115 561 B»,
       а поиск по артикулу аналога («530009010») даёт кросс на OEM */
    const t2 = t.map(x => x.replace(/[^a-z0-9]/g, ''));
    const h2 = h.replace(/[^a-z0-9]/g, '');
    return t.every((x, i) => {
        const alts = [x].concat(SYNONYMS[x] || []);   // синонимы: «грм» → ремень/ролик/натяжитель
        return alts.some(a => {
            const a2 = a.replace(/[^a-z0-9]/g, '');
            return h.includes(a) || (a2.length >= 5 && h2.includes(a2));
        });
    });
}
function sP(a) {
    const s = SV.sortBy;
    if (s === 'default' && SV.activeCat === 'Maintenance') {
        return a.slice().sort((x, y) =>
            _maintWeight(x) - _maintWeight(y)
            || (x.name || '').localeCompare(y.name || '')
            || (x.oem || '').localeCompare(y.oem || '')
        );
    }
    if (s === 'oem') return a.slice().sort((x, y) => (x.oem || '').localeCompare(y.oem || ''));
    if (s === 'name') return a.slice().sort((x, y) => (x.name || '').localeCompare(y.name || ''));
    if (s === 'priceAsc') return a.slice().sort((x, y) => (Number(x.price) || Infinity) - (Number(y.price) || Infinity));
    if (s === 'priceDesc') return a.slice().sort((x, y) => (Number(y.price) || -Infinity) - (Number(x.price) || -Infinity));
    if (s === 'favorite') return a.slice().sort((x, y) => (y.favorite ? 1 : 0) - (x.favorite ? 1 : 0));
    return a;
}

function gF() {
    const t = nz(SV.searchQuery).split(/\s+/).filter(Boolean);
    let f = D;
    if (SV.activeVinId && SV.vinStrictFilter) f = f.filter(vinStrictOk);
    if (SV.fitOnly && SV.activeVinId) f = f.filter(fitAllCriteria);
    if (SV.activeCat === 'Favorites') {
        f = f.filter(p => p.favorite);
    } else if (SV.activeCat !== 'All' && SV.activeCat !== 'Workshops' && SV.activeCat !== 'Log' && SV.activeCat !== 'Dash') {
        f = f.filter(p => p.cat === SV.activeCat);
        if (SV.activeSub) {
            f = f.filter(p => (p.sub || '').trim() === SV.activeSub);
        }
    }
    if (SV.engineFilter && SV.engineFilter !== 'all') f = f.filter(p => {
        const arr = p.engines || [];
        return !arr.length || arr.includes(SV.engineFilter);
    });
    if (SV.engFamFilter && SV.engFamFilter !== 'all') f = f.filter(p => partMatchesEngFam(p, SV.engFamFilter));
    if (SV.bodyFilter && SV.bodyFilter !== 'all') f = f.filter(p => {
        const arr = p.bodies || [];
        return !arr.length || arr.includes(SV.bodyFilter);
    });
    if (SV.transFilter && SV.transFilter !== 'all') f = f.filter(p => partMatchesTrans(p, SV.transFilter));
    if (SV.gearboxFilter && SV.gearboxFilter !== 'all') f = f.filter(p => partMatchesGearbox(p, SV.gearboxFilter));
    if (SV.genFilter && SV.genFilter !== 'all') f = f.filter(p => {
        const arr = p.gens || [];
        return !arr.length || arr.includes(SV.genFilter);
    });
    if (t.length) f = f.filter(p => mP(p, t));
    return sP(f);
}
function updateFilterStyling() {
    ['fmtr', 'fbdy', 'ftr'].forEach(id => {
        const el = $(id); if (!el) return;
        el.classList.toggle('act', el.value && el.value !== 'all');
    });
    const fb = $('fitOnlyBtn');
    if (fb) {
        fb.classList.toggle('act', !!SV.fitOnly);
        fb.title = SV.activeVinId
            ? (SV.fitOnly ? 'Показаны только подходящие вашему VIN — клик, чтобы снять' : 'Показать только позиции, подходящие вашему VIN по всем критериям')
            : 'Нужна активная машина в гараже';
    }
}
function updSearchSuggest() {
    const dl = $('searchSuggest'); if (!dl) return;
    const items = [], seen = new Set();
    const MAX = 200;
    /* Недавние запросы — сверху списка подсказок */
    getRecentQ().slice(0, 5).forEach(q => { items.push('🕘 ' + q); seen.add('r:' + q.toLowerCase()); });
    for (const p of D) {
        if (items.length >= MAX) break;
        if (p.oem && !seen.has('o:' + p.oem)) { items.push(p.oem); seen.add('o:' + p.oem); }
        if (items.length >= MAX) break;
        if (p.name && !seen.has('n:' + p.name)) { items.push(p.name); seen.add('n:' + p.name); }
    }
    dl.innerHTML = items.map(x => '<option value="' + escA(x) + '">').join('');
}
/* Недавние поисковые запросы (localStorage) */
function getRecentQ() {
    try { const a = JSON.parse(localStorage.getItem('vw_recent_q') || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch (e) { return []; }
}
function pushRecentQ(q) {
    const list = [q].concat(getRecentQ().filter(x => x.toLowerCase() !== q.toLowerCase())).slice(0, 8);
    try { localStorage.setItem('vw_recent_q', JSON.stringify(list)); } catch (e) { }
    updSearchSuggest();
}

/* ============ КОНТЕНТ ============ */
/* ✅ Правка №4: добавили SV.activeSub и SV.view в сигнатуру */
function _renderSignature() {
    return [
        SV.activeCat, SV.activeSub, SV.searchQuery, SV.statusFilter,
        SV.engineFilter, SV.engFamFilter, SV.bodyFilter, SV.transFilter, SV.gearboxFilter, SV.genFilter,
        SV.sortBy, SV.groupBySub, SV.view, SV.vinStrictFilter
    ].join('|');
}

function rC() {
    window._maintActive = false;   // каталог/журнал/мастерские заместили список расходников
    syncCatHash();
    if (SV.activeCat === 'Workshops') { rW(); return; }
    if (SV.activeCat === 'Log') { rLog(); return; }
    if (SV.activeCat === 'Dash') { rDash(); return; }
    /* ✅ 1.8.1: справочные разделы всегда через rSec — даже без данных
       покажем экран «не загружено» с кнопкой обновления, а не «найдено: 0» */
    if (CUSTOM.sections[SV.activeCat] || SEC_TABLE_IDS.includes(SV.activeCat)) { rSec(SV.activeCat); return; }

    const sig = _renderSignature();
    if (sig !== _lastRenderSig) { _visibleLimit = PAGE_SIZE; _lastRenderSig = sig; }

    const ar = $('ca'), f = gF();

    let title, icon;
    if (SV.activeCat === 'Favorites') { title = 'Избранное'; icon = '⭐'; }
    else if (SV.activeCat === 'All') { title = 'Все системы'; icon = '📦'; }
    else {
        const c = CATS.find(x => x.id === SV.activeCat);
        title = c ? c.label : '?';
        icon = c ? c.icon : '📦';
        if (SV.activeSub) title += ' → ' + SV.activeSub;
    }
    let h = '<h2 class="sh">' + icon + ' ' + esc(title) + '</h2>';

    const chips = [];
    chips.push('<span class="chip">найдено: <b>' + f.length + '</b></span>');
    if (SV.engineFilter && SV.engineFilter !== 'all') {
        const _ef = engineFamOf(SV.engineFilter);
        chips.push('<span class="chip">⚙️ ' + esc(SV.engineFilter) + (_ef ? ' · ' + esc(_ef) : '') + '</span>');
    } else if (SV.engFamFilter && SV.engFamFilter !== 'all') {
        chips.push('<span class="chip" data-chip="clearEngFam" style="cursor:pointer" title="Фильтр по семейству ДВС — клик, чтобы снять">🧬 ' + esc(SV.engFamFilter) + ' ✕</span>');
    }
    const _comboBG = !!(SV.genFilter && SV.genFilter !== 'all' && GENERATIONS[SV.genFilter]
        && SV.bodyFilter && SV.bodyFilter !== 'all' && (SV.bodyFilter === '3d' || SV.bodyFilter === '5d'));
    if (_comboBG) {
        // Комбо «поколение + кузов» выбрано одним пунктом — одной плашкой и снимается
        chips.push('<span class="chip" data-chip="clearBodyGen" style="cursor:pointer" title="Поколение + кузов — клик, чтобы снять">🚘 ' + esc(SV.genFilter) + ' · ' + esc(HATCH_LABELS[SV.bodyFilter] || BODIES[SV.bodyFilter]) + ' ✕</span>');
    } else if (SV.bodyFilter && SV.bodyFilter !== 'all') {
        chips.push('<span class="chip">🚗 ' + esc(BODIES[SV.bodyFilter] || SV.bodyFilter) + '</span>');
    }
    if (SV.transFilter && SV.transFilter !== 'all') chips.push('<span class="chip">🔄 ' + esc(TRANSMISSIONS[SV.transFilter] || SV.transFilter) + '</span>');
    if (SV.gearboxFilter && SV.gearboxFilter !== 'all') {
        const gbi = gearboxInfo(SV.gearboxFilter);
        const gbTitle = gbi && gbi.fams.length ? 'Семейство: ' + gbi.fams.map(f => TRANSMISSIONS[f] || f).join(' / ') : 'Буквенный код КПП';
        chips.push('<span class="chip" data-chip="clearGearbox" style="cursor:pointer;border-color:var(--wn)" title="' + escA(gbTitle + ' — клик, чтобы снять') + '">🔤 ' + esc(SV.gearboxFilter) + ' ✕</span>');
    }
    if (!_comboBG && SV.genFilter && SV.genFilter !== 'all') chips.push('<span class="chip">🚘 ' + esc(GENERATIONS[SV.genFilter] || SV.genFilter) + '</span>');
    if (SV.statusFilter && SV.statusFilter !== 'all') chips.push('<span class="chip">🏷 ' + esc(SV.statusFilter) + '</span>');
    if (SV.searchQuery) chips.push('<span class="chip">🔍 "' + esc(SV.searchQuery) + '"</span>');
    if (SV.activeSub) {
        chips.push(
            '<span class="chip" data-chip="clearSub" style="cursor:pointer" title="Показать весь раздел">'
            + '📂 ' + esc(SV.activeSub) + ' ✕</span>'
        );
    }
    chips.push('<span class="chip" data-chip="groupBySub" style="cursor:pointer;' + (SV.groupBySub ? 'border-color:var(--a);background:rgba(0,176,240,.12);' : '') + '" title="Группировать по подкатегориям">📂 Группы</span>');
    const av = gAV();
    if (av) {
        chips.push('<span class="chip">VIN …' + esc(av.vin.slice(-6)) + '</span>');
        chips.push('<span class="chip" data-chip="vinStrict" style="cursor:pointer;' + (SV.vinStrictFilter ? 'border-color:var(--dg);background:rgba(220,53,69,.12);' : '') + '" title="Скрыть детали, несовместимые с VIN">🔒 VIN-строго</span>');
        chips.push('<span class="chip" data-chip="fitOnly" style="cursor:pointer;' + (SV.fitOnly ? 'border-color:var(--ok);background:rgba(90,128,80,.14);' : '') + '" title="Только позиции, подходящие вашему VIN по всем критериям (мотор, кузов, поколение, комплектация, КПП, PR)">🎯 подходит моему VIN</span>');
    }
    h += '<div class="ri">' + chips.join('') + '</div>';

    if (!f.length) {
        let ei, em;
        if (SV.activeCat === 'Favorites') { ei = '⭐'; em = 'Пока нет избранного.'; }
        else if (!D.length) { ei = '📂'; em = 'База пуста. Положи parts.json в data/ или нажми ⚙️ → 📜 История версий.'; }
        else { ei = '🔍'; em = 'Ничего не найдено. Попробуйте сбросить фильтры.'; }
        h += '<div class="emp"><div class="empi">' + ei + '</div><p>' + em + '</p><button class="bn" onclick="resetFilters()" style="margin-top:10px">🔄 Сбросить фильтры</button></div>';
        ar.innerHTML = h;
        return;
    }

    if (SV.view === 'tree') {
        h += rET(f);
        ar.innerHTML = h;
        return;
    }

    if (SV.groupBySub) {
        const groups = {};
        for (const p of f) {
            const k = (p.sub || '').trim() || '— без подкатегории —';
            (groups[k] || (groups[k] = [])).push(p);
        }
        const keys = Object.keys(groups).sort((a, b) =>
            (a === '— без подкатегории —' ? 1 : b === '— без подкатегории —' ? -1 : 0)
            || a.localeCompare(b));

        let rendered = 0;
        for (const k of keys) {
            if (rendered >= _visibleLimit) break;
            h += '<h3 style="margin:14px 0 8px;font-size:.9rem;color:var(--b);display:flex;align-items:center;gap:6px">'
                + '<span style="display:inline-block;width:3px;height:14px;background:var(--a);border-radius:2px"></span>'
                + esc(k) + ' <span style="font-size:.72rem;color:var(--mu);font-weight:400">('
                + groups[k].length + ')</span></h3><div class="gr">';
            for (const p of groups[k]) {
                if (rendered >= _visibleLimit) break;
                h += cH(p);
                rendered++;
            }
            h += '</div>';
        }
    } else {
        const slice = f.slice(0, _visibleLimit);
        h += '<div class="gr">';
        for (const p of slice) h += cH(p);
        h += '</div>';
    }

    if (f.length > _visibleLimit) {
        h += '<div style="text-align:center;padding:22px 0">'
            + '<button class="bn p" onclick="_showMore()">▾ Показать ещё ('
            + (f.length - _visibleLimit) + ' из ' + f.length + ')</button></div>';
    }
    ar.innerHTML = h;
}
window._showMore = function () {
    _visibleLimit += PAGE_SIZE;
    rC();
};
window.toggleTreeAll = function () {
    const all = document.querySelectorAll('#ca details[data-etkey]');
    if (!all.length) return;
    const anyOpen = Array.from(all).some(d => d.open);
    if (!SV.expandedTree) SV.expandedTree = {};
    all.forEach(d => {
        const k = d.dataset.etkey;
        if (anyOpen) { d.open = false; delete SV.expandedTree[k]; }
        else { d.open = true; SV.expandedTree[k] = true; }
    });
    sU();
    const btn = document.querySelector('.et-tgl-btn');
    if (btn) {
        btn.textContent = anyOpen ? '▼ Развернуть всё' : '▲ Свернуть всё';
        btn.dataset.treeall = anyOpen ? 'expand' : 'collapse';
    }
};

/* ============ КРОСС-СЕРВИС: артикулы, PR-применимость, цены, подсветка ============ */
const normOem = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
function findByOem(o) {
    const n = normOem(o);
    if (!n) return null;
    /* ✅ 1.9.0: точное совпадение → сегмент мульти-артикула «A · B» */
    return D.find(p => normOem(p.oem) === n) || D.find(p => oemSegs(p.oem).includes(n)) || null;
}
/* PR-коды активной машины (когда база оснащения полная); null = проверять не по чему */
let _prSetV = null, _prSet = null;
function vinPrSet() {
    const av = gAV();
    const id = av ? av.id : null;
    if (id === _prSetV) return _prSet;
    _prSetV = id; _prSet = null;
    if (av) {
        const row = vinDbRow(av.vin);
        if (row && Array.isArray(row.pr) && row.pr.length) _prSet = new Set(row.pr.map(c => String(c).toUpperCase()));
    }
    return _prSet;
}
/* Подходит ли деталь под оснащение VIN по PR: {cls:'y'|'n', label} или null */
function prFit(p, set) {
    set = set === undefined ? vinPrSet() : set;
    if (!set) return null;
    if (!(p.prReq || []).length && !(p.prNo || []).length) return null;
    const miss = (p.prReq || []).filter(c => !set.has(c));
    const bad = (p.prNo || []).filter(c => set.has(c));
    if (miss.length || bad.length) {
        const why = [miss.length ? 'нет кодов ' + miss.join(', ') : '', bad.length ? 'есть несовместимый ' + bad.join(', ') : ''].filter(Boolean).join('; ');
        return { cls: 'n', label: 'PR: не подходит под ваш VIN (' + why + ')' };
    }
    return { cls: 'y', label: 'PR: проверено по оснащению вашего VIN — подходит' };
}
/* Статистика цены: текущая/мин/сред/макс + изменение к последней записи истории */
function priceStats(p) {
    const h = (p.priceHistory || []).map(x => ({ ts: x.ts, price: Number(x.price) })).filter(x => isFinite(x.price));
    const cur = p.price != null ? Number(p.price) : (h.length ? h[h.length - 1].price : null);
    if (cur == null) return null;
    const prices = h.map(x => x.price).concat([cur]);
    if (prices.length < 2) return { cur, min: cur, max: cur, avg: cur, delta: null, series: [cur] };
    const min = Math.min.apply(null, prices), max = Math.max.apply(null, prices);
    const avg = Math.round(prices.reduce((s, x) => s + x, 0) / prices.length);
    const prev = h[h.length - 1].price;
    const delta = prev > 0 ? Math.round((cur - prev) / prev * 100) : null;
    return { cur, min, max, avg, delta, series: prices.slice(-14) };
}
/* Мини-график цены (inline SVG, без библиотек) */
function sparkSvg(series, w, hgt) {
    if (!series || series.length < 2) return '';
    const min = Math.min.apply(null, series), max = Math.max.apply(null, series);
    const rng = (max - min) || 1;
    const pts = series.map((v, i) => {
        const x = (i / (series.length - 1)) * (w - 4) + 2;
        const y = (hgt - 4) - ((v - min) / rng) * (hgt - 8) + 2;
        return x.toFixed(1) + ',' + y.toFixed(1);
    });
    const last = pts[pts.length - 1].split(',');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + hgt + '" width="' + w + '" height="' + hgt + '" aria-hidden="true">'
        + '<polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--a)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>'
        + '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="2.2" fill="var(--a)"/></svg>';
}
/* Подсветка совпадений поискового запроса (безопасная: сначала esc) */
function prBadge(p) {
    const pf = prFit(p);
    if (!pf) return '';
    return '<span class="vb ' + (pf.cls === 'y' ? 't' : 'f') + '" title="' + escA(pf.label) + '">PR ' + (pf.cls === 'y' ? '✓' : '✗') + '</span>';
}
function hl(text) {
    const s = String(text == null ? '' : text);
    const toks = nz(SV.searchQuery).split(/\s+/).filter(x => x.length >= 2);
    if (!toks.length) return esc(s);
    const f = nz(s);
    const ranges = [];
    toks.forEach(tok => { let i = f.indexOf(tok); while (i >= 0) { ranges.push([i, i + tok.length]); i = f.indexOf(tok, i + 1); } });
    if (!ranges.length) return esc(s);
    ranges.sort((a, b) => a[0] - b[0]);
    let out = '', last = 0;
    ranges.forEach(r => { if (r[0] < last) return; out += esc(s.slice(last, r[0])) + '<mark>' + esc(s.slice(r[0], r[1])) + '</mark>'; last = r[1]; });
    return out + esc(s.slice(last));
}

/* ============ ПРИМЕНИМОСТЬ: покритериальный отчёт по активному VIN ============
   Доноры — косвенный признак; здесь же явные критерии: моторы (с семействами),
   кузова, поколения, комплектации, КПП (семейства + буквенные коды), PR-коды.
   По каждому — вердикт ✓/✗/— против активной машины и пояснение. */
function partFitReport(p) {
    const av = gAV();
    const d = av ? vD(av.vin) : null;
    const rows = [];
    const eng = p.engines || [];
    if (eng.length) {
        const fams = Array.from(new Set(eng.map(e => engineFamOf(e)).filter(Boolean)));
        const val = (eng.length <= 6 ? eng.join(', ') : fams.join('/') + ' · ' + eng.length + ' кодов')
            + (fams.length ? ' (' + fams.join(', ') + ')' : '');
        let vd = 'u', why = 'мотор машины неизвестен';
        if (av && av.engineCode) { vd = eng.includes(av.engineCode) ? 'y' : 'n'; why = av.engineCode + (vd === 'y' ? ' есть в списке' : ' отсутствует в списке'); }
        rows.push({ k: 'Двигатели', val, vd, why });
    } else rows.push({ k: 'Двигатели', val: 'все моторы каталога', vd: (av && av.engineCode) ? 'y' : 'u', why: (av && av.engineCode) ? 'ограничений нет' : '' });
    const bd = p.bodies || [];
    if (bd.length) {
        let vd = 'u', why = 'кузов машины неизвестен';
        if (av && av.body) { vd = bd.includes(av.body) ? 'y' : 'n'; why = (BODIES[av.body] || av.body) + (vd === 'y' ? ' есть в списке' : ' отсутствует в списке'); }
        rows.push({ k: 'Кузова', val: bd.map(b => BODIES[b] || b).join(', '), vd, why });
    } else rows.push({ k: 'Кузова', val: 'все кузова', vd: (av && av.body) ? 'y' : 'u', why: '' });
    const gn = p.gens || [];
    if (gn.length) {
        /* поколение: вручную из гаража, иначе автоподстановка из декодера VIN */
        const my = (av && av.gen) ? av.gen : (d && d.gen ? d.gen : '');
        let vd = 'u', why = 'поколение машины неизвестно (укажите в «✎ Уточнить данные» или добавьте VIN с 6N1/6N2)';
        if (my) { vd = gn.includes(my) ? 'y' : 'n'; why = my + (vd === 'y' ? ' есть в списке' : ' отсутствует в списке'); }
        rows.push({ k: 'Поколение', val: gn.join(', '), vd, why });
    }
    const trm = p.trims || [];
    if (trm.length) {
        const myT = (av && av.trim) ? av.trim : '';
        let vd = 'u', why = 'комплектация машины не указана — задайте в «✎ Уточнить данные»';
        if (myT) { vd = trm.includes(myT) ? 'y' : 'n'; why = myT + (vd === 'y' ? ' есть в списке' : ' отсутствует в списке'); }
        rows.push({ k: 'Комплектации', val: trm.join(', '), vd, why });
    }
    const tfams = p.transmissions || [], tcodes = p.transCodes || [];
    if (tfams.length || tcodes.length) {
        let vd = 'u', why = 'КПП машины неизвестна';
        if (av && (av.transCode || av.gearboxCode)) {
            const okFam = av.transCode && tfams.includes(av.transCode);
            const okCode = av.gearboxCode && tcodes.includes(av.gearboxCode);
            const okFamByCode = av.gearboxCode && gearboxFamsOf(av.gearboxCode).some(f => tfams.includes(f));
            vd = (okFam || okCode || okFamByCode) ? 'y' : 'n';
            why = [av.transCode, av.gearboxCode].filter(Boolean).join('/') + (vd === 'y' ? ' совпадает' : ' не совпадает');
        }
        rows.push({ k: 'КПП', val: tfams.map(f => TRANSMISSIONS[f] || f).concat(tcodes).join(', '), vd, why });
    } else rows.push({ k: 'КПП', val: 'все КПП', vd: (av && (av.transCode || av.gearboxCode)) ? 'y' : 'u', why: '' });
    if ((p.prReq || []).length || (p.prNo || []).length) {
        const pf = prFit(p);
        rows.push({ k: 'PR-коды', val: (p.prReq || []).concat((p.prNo || []).map(x => '!' + x)).join(', '), vd: pf ? pf.cls : 'u', why: pf ? pf.label : 'PR-коды машины неизвестны' });
    }
    if ((p.donors || []).length) {
        const cmp = pCompat(p);
        rows.push({
            k: 'Доноры (косвенно)', val: p.donors.slice(0, 5).join(', ') + (p.donors.length > 5 ? '…' : ''),
            vd: cmp ? (cmp.cls === 'y' ? 'y' : cmp.cls === 'n' ? 'n' : 'u') : 'u',
            why: cmp && cmp.cls !== 'u' ? cmp.label : ''
        });
    }
    return rows;
}
function fitSummaryBadge(p) {
    const rows = partFitReport(p);
    if (!rows.length) return '';
    if (rows.some(r => r.vd === 'n')) return '<span class="fit-sum n" title="Есть несовпадения с активным VIN — см. критерии ниже">✗ не подходит к вашему VIN</span>';
    if (rows.some(r => r.vd === 'y')) return '<span class="fit-sum y" title="Все проверенные критерии сходятся с активным VIN">✓ подходит к вашему VIN</span>';
    return '<span class="fit-sum u" title="Недостаточно данных машины для проверки">? не проверено</span>';
}
function fitRowsHtml(p) {
    const rows = partFitReport(p);
    if (!rows.length) return '<div class="dc-sub">Данных о применимости нет.</div>';
    return '<div class="fit-rows">' + rows.map(r =>
        '<div class="fit-row">'
        + '<span class="fit-b ' + r.vd + '" title="' + escA(r.why || (r.vd === 'y' ? 'совпадает' : r.vd === 'n' ? 'не совпадает' : 'нет данных')) + '">' + (r.vd === 'y' ? '✓' : r.vd === 'n' ? '✗' : '—') + '</span>'
        + '<span class="fit-k">' + esc(r.k) + '</span>'
        + '<span class="fit-v">' + esc(r.val) + '</span></div>'
    ).join('') + '</div>';
}
/* «Подходит моему VIN»: нет ни одного ✗ и есть хотя бы один ✓ */
function fitAllCriteria(p) {
    const rows = partFitReport(p);
    return rows.length > 0 && !rows.some(r => r.vd === 'n') && rows.some(r => r.vd === 'y');
}
function tgFitOnly() {
    if (!SV.activeVinId) { toast('Сначала выберите машину в гараже — иначе сравнивать не с чем', 'info'); return; }
    SV.fitOnly = !SV.fitOnly;
    sU(); updateFilterStyling(); rSB(); rC();
    toast(SV.fitOnly ? '🎯 Показаны только позиции, подходящие вашему VIN по всем критериям' : '🎯 Фильтр применимости снят', SV.fitOnly ? 'success' : '');
}

function cH(p) {
    const o = p.oem || '';
    const anInline = (p.analogs || []).length
        ? p.analogs.map((a, ai) => {
            const v = getVote(p, a);
            const score = (v.ok || 0) - (v.bad || 0);
            /* ✅ 1.9.0: бейдж источника — 🔗 цепочка кроссов, ❓ база знаний */
            const src = (p.analogSrc || {})[normOem(a)] || 'db';
            const srcB = src === 'chain'
                ? '<span class="an-src ch" title="Цепочка кроссов: аналог аналога (транзитивная связь)">🔗</span>'
                : src === 'kb'
                    ? '<span class="an-src kb" title="Из базы знаний кросс-номеров — проверьте применимость и проголосуйте 👍/👎">❓</span>'
                    : '';
            return '<span class="tg an' + (score >= 3 ? ' voted' : '') + '"' + (score >= 3 ? ' title="Проверено сообществом: подошёл ' + score + ' раз(а)"' : '') + '>' + esc(a) + srcB
                + '<button class="ctb2" data-copy="' + escA(a) + '" title="Копировать">📋</button>'
                + '<button type="button" class="vtb' + (v.my === 'ok' ? ' on' : '') + '" data-action="vote-analog" data-id="' + escA(p.id) + '" data-ai="' + ai + '" data-dir="ok" title="Подошёл (' + (v.ok || 0) + ')">👍' + (v.ok ? v.ok : '') + '</button>'
                + '<button type="button" class="vtb' + (v.my === 'bad' ? ' on bad' : '') + '" data-action="vote-analog" data-id="' + escA(p.id) + '" data-ai="' + ai + '" data-dir="bad" title="Не подошёл (' + (v.bad || 0) + ')">👎' + (v.bad ? v.bad : '') + '</button>'
                + '</span>';
        }).join('')
        : '<span style="color:var(--mu);font-size:.66rem">—</span>';
    const hasSrc = (p.analogs || []).some(a => { const s = (p.analogSrc || {})[normOem(a)]; return s === 'chain' || s === 'kb'; });
    const anLegend = hasSrc ? '<span class="an-legend">🔗 цепочка кроссов · ❓ база знаний — проверьте и голосуйте 👍/👎</span>' : '';
    const dn = (p.donors || []).map(d => '<span class="tg dn">' + esc(d) + '</span>').join('')
        || '<span style="color:var(--mu);font-size:.72rem">— нет данных —</span>';
    const eng = (p.engines || []).length
        ? p.engines.map(e => {
            const ef = engineFamOf(e);
            return '<span class="tg eg" title="' + escA(ef ? 'Серия ' + ef + ' — ' + ENGINE_FAMILIES[ef].label : 'Код двигателя') + '">' + esc(e) + '</span>';
        }).join('')
        : '<span style="color:var(--mu);font-size:.72rem">— не указано —</span>';
    const bdy = (p.bodies || []).length
        ? p.bodies.map(b => '<span class="tg bd">' + esc(BODIES[b] || b) + '</span>').join('')
        : '<span style="color:var(--mu);font-size:.72rem">— не указано —</span>';
    const trn = (p.transmissions || []).map(t => '<span class="tg tr">' + esc(TRANSMISSIONS[t] || t) + '</span>').join('');
    const trc = (p.transCodes || []).map(c => {
        const f = gearboxFamsOf(c);
        const ttl = f.length ? 'Семейство ' + f.join('/') : 'Отдельный код КПП';
        return '<span class="tg trc" title="' + escA(ttl) + '">' + esc(c) + '</span>';
    }).join('');
    const trnAll = trn + trc;
    const trm = (p.trims || []).map(t => '<span class="tg tm">' + esc(t) + '</span>').join('');
    const gn = (p.gens || []).map(g => '<span class="tg gn">' + esc(GENERATIONS[g] || g) + '</span>').join('');
    let ih = '';
    if (p.inst && p.inst.length) {
        const warns = p.inst.filter(i => i.type === 'warn');
        const others = p.inst.filter(i => i.type !== 'warn');
        ih = '<div class="ins">';
        for (const it of warns) ih += '<div class="ini"><span class="it tw">ВНИМАНИЕ</span>' + esc(it.text) + '</div>';
        for (const it of others) {
            const k = IM[it.type] || 'n';
            ih += '<div class="ini" style="margin-top:5px"><span class="it ' + IC[k] + '">' + IL[k] + '</span>' + esc(it.text) + '</div>';
        }
        ih += '</div>';
    }
    let partsHtml = '';
    if (p.parts && p.parts.length) {
        partsHtml = '<div class="cd-to-parts">'
            + '<div class="cd-to-parts-h">🛒 Купить запчасти для ТО </div>'
            + '<div class="tp-parts">'
            + p.parts.map(it => {
                const c = (it.oem || '').replace(/\s+/g, '');
                const links = c
                    ? '<a class="psl ex" target="_blank" rel="noopener noreferrer" href="' + SH.ex(c) + '" title="Exist">🟠 Exist</a>'
                    + '<a class="psl ad" target="_blank" rel="noopener noreferrer" href="' + SH.ad(c) + '" title="Autodoc">🔵 Autodoc</a>'
                    + '<a class="psl av" target="_blank" rel="noopener noreferrer" href="' + SH.av(it.oem, it.name) + '" title="Avito">🟣 Avito</a>'
                    : '';
                return '<div class="tpp-row">'
                    + '<div class="tpp-head">'
                    + '<span class="tpp-name">' + esc(it.name || '') + '</span>'
                    + (it.oem ? '<span class="tpp-oem" title="Артикул">' + esc(it.oem) + '</span>' : '')
                    + '</div>'
                    + (it.note ? '<div class="tpp-note">' + esc(it.note) + '</div>' : '')
                    + (links ? '<div class="tpp-links">' + links + '</div>' : '')
                    + '</div>';
            }).join('')
            + '</div></div>';
    }
    const ntH = '<textarea class="cn" data-notes-id="' + escA(p.id) + '" placeholder="Заметка…" rows="2">' + esc(p.notes || '') + '</textarea>';
    const phList = Array.isArray(p.photos) ? p.photos : [];
    /* ✅ Правка №12: lazy loading для фото */
    const phh = phList.length
        ? '<div class="cd-sec" style="padding-top:4px"><div class="cd-gallery">'
        + phList.map((src, i) =>
            '<img class="cd-photo" src="' + src + '" alt="" loading="lazy" decoding="async" '
            + 'data-lightbox-pid="' + escA(p.id) + '" data-lightbox-idx="' + i + '">'
        ).join('')
        + '</div></div>'
        : '';
    const f = !!p.favorite;
    const vb = p.verified ? '<span class="vb t">✓ ETKA</span>' : '<span class="vb f">⚠</span>';
    const cmp = pCompat(p);
    let ch = '';
    if (cmp) {
        const ic = cmp.cls === 'y' ? '✓' : cmp.cls === 'n' ? '✗' : '?';
        ch = '<span class="cb ' + cmp.cls + '" title="' + escA(cmp.label) + '">' + ic + ' ' + cmp.pct + '%</span>';
    }
    const st = p.status || '';
    const stBar = '<span class="cd-st-lb">Статус:</span>'
        + [['want', '🛒', 'Хочу'], ['bought', '📦', 'Купил'], ['installed', '✅', 'Поставил']]
            .map(x =>
                '<button class="tp' + (st === x[0] ? ' on' : '') + '" data-action="set-status" data-status="' + x[0] + '" data-id="' + escA(p.id) + '">' + x[1] + ' ' + x[2] + '</button>'
            ).join('');

    /* ✅ Правка №11: без onclick, через data-атрибуты */
    const findBtnHtml = o
        ? '<div class="cd-meta"><button class="bn" data-action="find-cheaper" data-oem="' + escA(o) + '" data-name="' + escA(p.name || '') + '" style="padding:4px 8px;font-size:.7rem" title="Открыть Exist + Autodoc + Avito">🔍 Найти дешевле</button></div>'
        : '';

    return '<div class="cd' + (f ? ' fav' : '') + '" data-id="' + escA(p.id) + '">'
        + '<div class="cd-top">'
        + '<h3 class="cd-nm">' + hl(p.name || '(без названия)') + '</h3>'
        + '<div class="cd-btns">'
        + '<button class="ctb sr' + (f ? ' on' : '') + '" data-action="favorite" title="Избранное">' + (f ? '★' : '☆') + '</button>'
        + '<button class="ctb" data-action="edit" title="Ред.">✎</button>'
        + '<button class="ctb dg" data-action="delete" title="Удалить">✕</button>'
        + '</div></div>'
        + '<div class="cd-meta">'
        + '<span class="cd-oem-v">' + (o ? hl(o) : '— без артикула —')
        + (o ? '<button class="cob" data-action="copy" data-oem="' + escA(o) + '" title="Копировать">📋</button>' : '')
        + '</span>' + vb + ch + prBadge(p)
        + '</div>'
        + '<div class="cd-meta cd-ans"><span class="cd-ans-lb">🔧 Аналоги:</span>' + anInline + anLegend + '</div>'
        + (partsHtml
            ? partsHtml
            : '<div class="cd-purchase">' + getPurchaseHtml(p) + '</div>'
            + findBtnHtml)
        + lastLogBadge(o)
        + '<div class="cd-st">' + stBar + '</div>'
        + '<details class="cd-body"><summary>Подробности</summary><div class="cd-content">'
        + phh
        + '<div class="cd-sec"><div class="cd-s-t">🚗 Применимость' + fitSummaryBadge(p) + '</div>'
        + fitRowsHtml(p)
        + '</div>'
        + (ih ? '<div class="cd-sec"><div class="cd-s-t">📖 Инструкции (' + p.inst.length + ')</div>' + ih + '</div>' : '')
        + '<div class="cd-sec"><div class="cd-s-t">📝 Заметки</div>' + ntH + '</div>'
        + '</div></details>'
        + '</div>';
}

function oPC(id) {
    const p = D.find(x => x.id === id);
    if (!p) return;
    partmoId = id;
    setHash('/part/' + encodeURIComponent(id));
    $('partmo_title').textContent = p.name || p.oem || 'Деталь';
    let html = cH(p);
    html = html.replace(/<button class="ctb" data-action="edit"[^>]*>✎<\/button>/, '');
    html = html.replace(/<button class="ctb dg" data-action="delete"[^>]*>✕<\/button>/, '');
    html = html.replace(/ class="cd( fav)?"/, ' class="cd$1" style="border:none;box-shadow:none"');
    $('partmo_body').innerHTML = '<div style="margin:-4px">' + html + '</div>';
    const det = $('partmo_body').querySelector('.cd-body');
    if (det) det.setAttribute('open', '');
    openM('partmo');
}
const cPC = () => { closeM('partmo'); partmoId = null; syncCatHash(); };

/* ============================================================
   СПРАВОЧНИКИ (data/sections.json) — рендер таблицы
   ------------------------------------------------------------
   1.12.0: заимствовано из зарубежных аналогов:
   · Ross-Tech Wiki / OBD-Codes.com — мгновенный поиск по коду
     (справочник на 100 строк без поиска бесполезен);
   · ALLDATA / Haynes — «липкая» шапка и зебра при длинных таблицах;
   · RockAuto — переход от справочной статьи к конкретной детали.
   Добавлены: фильтр по всем ячейкам, сортировка по любому столбцу,
   счётчик «показано N из M», sticky-заголовок, а также два вида
   внутренних ссылок: «#q:запрос» (поиск по каталогу деталей) и
   «#sec:Id» (переход в другой справочник).
   ============================================================ */
/* Состояние просмотра справочника: { [sid]: { q, col, dir } } — переживает
   переключение разделов, но не сохраняется между запусками (это не настройка) */
function secViewOf(sid) {
    if (!SV.secView || typeof SV.secView !== 'object') SV.secView = {};
    if (!SV.secView[sid]) SV.secView[sid] = { q: '', col: -1, dir: 1 };
    return SV.secView[sid];
}
/* Нормализация для поиска внутри справочника: ё→е, без диакритики, lowercase */
const secNz = s => nz(s).replace(/ё/g, 'е');

/* Одна ячейка справочника. Поддерживаются ссылки трёх видов:
     «метка|https://…» — внешняя ссылка (открывается в новой вкладке);
     «метка|#q:запрос»  — поиск по каталогу деталей;
     «метка|#sec:Id»    — переход в другой справочник.
   Несколько элементов в одной ячейке разделяются «;;».
   Голый URL тоже становится ссылкой; переводы строк → <br>. */
function secCellHtml(c) {
    const cs = String(c == null ? '' : c);
    if (!cs) return '';
    /* несколько элементов в одной ячейке разделяются «;;» — иначе парсер
       принял бы всю ячейку за одну ссылку «метка|цель» */
    if (cs.indexOf(';;') >= 0) return cs.split(';;').map(secCellHtml).filter(Boolean).join(' ');
    const m = cs.match(/^([\s\S]+?)\|([\s\S]+)$/);
    if (m) {
        const target = m[2].trim();
        if (/^https?:\/\/\S+$/.test(target))
            return '<a href="' + escA(target) + '" target="_blank" rel="noopener noreferrer" class="sec-l">' + esc(m[1]) + ' ↗</a>';
        if (target.indexOf('#q:') === 0)
            return '<button type="button" class="sec-q" data-q="' + escA(target.slice(3)) + '" title="Найти в каталоге деталей">' + esc(m[1]) + ' 🔎</button>';
        if (target.indexOf('#sec:') === 0)
            return '<button type="button" class="sec-s" data-sec="' + escA(target.slice(5)) + '" title="Открыть справочник">' + esc(m[1]) + ' →</button>';
    }
    if (/^https?:\/\//.test(cs))
        return '<a href="' + escA(cs) + '" target="_blank" rel="noopener noreferrer" class="sec-l sec-lb">' + esc(cs) + '</a>';
    return esc(cs).replace(/\n/g, '<br>');
}
/* Подходит ли строка под запрос: ищем по всем ячейкам, все слова запроса
   обязаны найтись (И). Часть ссылки после «|» тоже участвует в поиске —
   по названию источника находится и сама строка. */
function secRowMatch(row, q) {
    const nq = secNz(q || '').trim();
    if (!nq) return true;
    const hay = secNz((row || []).map(c => String(c == null ? '' : c)).join(' \u0001 '));
    return nq.split(/\s+/).filter(Boolean).every(t => hay.indexOf(t) >= 0);
}
/* Сортировка: числа — если обе ячейки начинаются с числа (удобно для
   столбцов «№» и «Момент»), иначе по тексту с русской локалью */
function secSortRows(rows, col, dir) {
    if (!(col >= 0) || !Array.isArray(rows)) return (rows || []).slice();
    const firstNum = v => {
        const m = String(v == null ? '' : v).replace(/\u00a0/g, ' ').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
        return m ? parseFloat(m[0]) : null;
    };
    return rows.slice().sort((a, b) => {
        const x = a[col], y = b[col];
        const nx = firstNum(x), ny = firstNum(y);
        let r;
        if (nx !== null && ny !== null && nx !== ny) r = nx - ny;
        else r = String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), 'ru');
        return dir < 0 ? -r : r;
    });
}
/* HTML строк таблицы (без обёртки) — используется и при перерисовке фильтра */
function secRowsHtml(rows) {
    return rows.map((r, i) => '<tr' + (i % 2 ? ' class="sec-alt"' : '') + '>' + r.map(c =>
        '<td class="sec-td">' + secCellHtml(c) + '</td>').join('') + '</tr>').join('');
}

function rSec(sid) {
    const ar = $('ca');
    const s = CUSTOM.sections[sid] || {};
    const vc = (typeof VIRTUAL_CATS !== 'undefined' && VIRTUAL_CATS[sid]) || {};
    const rows = Array.isArray(s.rows) ? s.rows : [];
    let h = '<h2 class="sh">' + (s.icon || vc.icon || '📋') + ' ' + esc(s.label || vc.label || sid) + '</h2>';
    h += '<div class="ri"><span class="chip">всего: <b>' + rows.length + '</b></span></div>';
    if (!rows.length) {
        if (CUSTOM.sections[sid]) {
            h += '<div class="emp"><div class="empi">📋</div><p>Раздел пуст — заполни через импорт JSON.</p></div>';
        } else {
            /* ✅ 1.8.1: раздел известен сайдбару, но файл данных не доехал */
            h += '<div class="emp"><div class="empi">📭</div>'
                + '<p><b>Данные раздела не загружены</b></p>'
                + '<p style="color:var(--mu);font-size:.85rem;max-width:420px;margin:6px auto 0">Обычно это кэш: приложение решило, что версия базы не менялась, и не стало скачивать <code>data/sections.json</code>. Кнопка ниже сбросит отметку версии и перечитает данные с сервера.</p>'
                + '<button type="button" class="bn" style="margin-top:12px" onclick="forceDataReload()">🔄 Обновить данные</button>'
                + '</div>';
        }
        ar.innerHTML = h; return;
    }
    const cols = Array.isArray(s.cols) ? s.cols : [];
    const v = secViewOf(sid);

    /* панель: поиск + сброс + счётчик */
    h += '<div class="sec-bar">'
        + '<input type="text" class="sec-in" id="secIn" placeholder="🔍 Фильтр по разделу («P0301», «ступица», «110 Нм»…)" value="' + escA(v.q) + '" autocomplete="off" spellcheck="false">'
        + '<button type="button" class="bn sec-clr" id="secClr" title="Очистить фильтр">✕</button>'
        + '<span class="sec-cnt" id="secCnt"></span>'
        + '</div>';

    h += '<div class="sec-wrap"><table class="sec-tbl">';
    if (cols.length) {
        h += '<thead><tr>' + cols.map((c, i) =>
            '<th class="sec-th' + (v.col === i ? ' sec-th-on' : '') + '" data-col="' + i + '" title="Сортировать по этому столбцу">'
            + esc(c) + '<span class="sec-ar">' + (v.col === i ? (v.dir > 0 ? ' ▲' : ' ▼') : '') + '</span></th>').join('') + '</tr></thead>';
    }
    h += '<tbody id="secBody"></tbody></table></div>';
    h += '<p class="sec-hint">Клик по заголовку столбца — сортировка. Ссылки 🔎 ищут по каталогу деталей, → открывают другой справочник.</p>';
    ar.innerHTML = h;
    secPaint(sid);

    /* события: фильтр, сортировка, внутренние ссылки (делегирование) */
    const inp = $('secIn');
    if (inp) {
        inp.addEventListener('input', e => { v.q = e.target.value; secPaint(sid); });
        inp.addEventListener('keydown', e => { if (e.key === 'Escape') { v.q = ''; inp.value = ''; secPaint(sid); } });
    }
    const clr = $('secClr');
    if (clr) clr.addEventListener('click', () => { v.q = ''; const i2 = $('secIn'); if (i2) { i2.value = ''; i2.focus(); } secPaint(sid); });
    ar.querySelectorAll('.sec-th').forEach(th => th.addEventListener('click', () => {
        const i = Number(th.getAttribute('data-col'));
        if (v.col === i) v.dir = -v.dir; else { v.col = i; v.dir = 1; }
        ar.querySelectorAll('.sec-th').forEach(x => { x.classList.remove('sec-th-on'); const a = x.querySelector('.sec-ar'); if (a) a.textContent = ''; });
        th.classList.add('sec-th-on');
        const a = th.querySelector('.sec-ar'); if (a) a.textContent = v.dir > 0 ? ' ▲' : ' ▼';
        secPaint(sid);
    }));
    ar.addEventListener('click', e => {
        const q = e.target.closest ? e.target.closest('.sec-q') : null;
        if (q) { secSearchCat(q.getAttribute('data-q')); return; }
        const sc = e.target.closest ? e.target.closest('.sec-s') : null;
        if (sc) {
            const id = sc.getAttribute('data-sec');
            if (CUSTOM.sections[id] || SEC_TABLE_IDS.includes(id)) { SV.activeCat = id; SV.activeSub = null; sU(); rSB(); rC(); }
            else toast('Раздел «' + id + '» не загружен', 'danger');
        }
    });
}
/* Перерисовка только строк и счётчика — чтобы не терять фокус в поле фильтра */
function secPaint(sid) {
    const s = CUSTOM.sections[sid] || {};
    const rows = Array.isArray(s.rows) ? s.rows : [];
    const v = secViewOf(sid);
    const shown = secSortRows(rows.filter(r => secRowMatch(r, v.q)), v.col, v.dir);
    const body = $('secBody');
    if (body) body.innerHTML = secRowsHtml(shown);
    const cnt = $('secCnt');
    if (cnt) cnt.textContent = v.q ? 'показано ' + shown.length + ' из ' + rows.length : rows.length + ' строк';
    if (body && !shown.length) body.innerHTML = '<tr><td class="sec-td sec-none" colspan="' + ((s.cols || []).length || 1) + '">Ничего не найдено по запросу «' + esc(v.q) + '»</td></tr>';
}
/* Поиск по каталогу деталей из справочника (как клик по «🔎» в строке кода) */
function secSearchCat(q) {
    SV.searchQuery = String(q || '').trim();
    SV.activeCat = 'All'; SV.activeSub = null;
    const si = $('sr'); if (si) si.value = SV.searchQuery;
    if (typeof uSC === 'function') uSC();
    sU(); rSB(); rC();
    toast(SV.searchQuery ? 'Каталог: поиск «' + SV.searchQuery + '»' : 'Фильтр поиска снят', 'info');
}

/* ✅ 1.8.1: «Обновить данные» — сбрасывает записанную версию базы
   и перезагружает страницу: lAll() гарантированно сходит в сеть */
function forceDataReload() {
    try { localStorage.removeItem('vw_polo_data_ver'); } catch (e) { }
    try { if (typeof location !== 'undefined' && location.reload) location.reload(); } catch (e) { }
}

function rET(parts) {
    const t = {};
    for (const p of parts) {
        const m = EK[p.cat] || { g: 'Прочее', s: 'Прочее' };
        const g = m.g;
        const s = (p.sub || '').trim() || m.s;
        if (!t[g]) t[g] = {};
        if (!t[g][s]) t[g][s] = [];
        t[g][s].push(p);
    }
    if (!SV.expandedTree || typeof SV.expandedTree !== 'object') SV.expandedTree = {};
    const exp = SV.expandedTree;
    const groupKeys = Object.keys(t).sort();
    const anyOpen = groupKeys.some(g => exp['g:' + g]);

    let h = '<div class="et">';
    h += '<div class="et-tools">'
        + '<button type="button" class="bn et-tgl-btn" onclick="toggleTreeAll()" data-treeall="' + (anyOpen ? 'collapse' : 'expand') + '">'
        + (anyOpen ? '▲ Свернуть всё' : '▼ Развернуть всё')
        + '</button>'
        + '<span class="et-hint">Нажми на папку 📁, чтобы раскрыть</span>'
        + '</div>';

    for (const g of groupKeys) {
        const sg = t[g];
        let tot = 0;
        for (const s of Object.keys(sg)) tot += sg[s].length;
        const gKey = 'g:' + g;
        const gOpen = !!exp[gKey];

        h += '<details class="et-group"' + (gOpen ? ' open' : '') + ' data-etkey="' + escA(gKey) + '">';
        h += '<summary>📁 ' + esc(g) + '<span class="gc">' + tot + '</span></summary>';

        for (const s of Object.keys(sg).sort()) {
            const a = sg[s];
            const sKey = 's:' + g + '|' + s;
            const sOpen = !!exp[sKey];
            h += '<details class="et-sub"' + (sOpen ? ' open' : '') + ' data-etkey="' + escA(sKey) + '">';
            h += '<summary style="font-size:.8rem;font-weight:600;color:var(--mu)">📂 ' + esc(s) + '<span class="gc">' + a.length + '</span></summary>';
            h += '<div class="sg">';
            const sorted = a.slice().sort((x, y) => {
                if (x.cat === 'Maintenance' || y.cat === 'Maintenance') {
                    const dx = _maintWeight(x), dy = _maintWeight(y);
                    if (dx !== dy) return dx - dy;
                    return (x.name || '').localeCompare(y.name || '');
                }
                return (x.oem || '').localeCompare(y.oem || '');
            });
            for (const p of sorted) {
                const w = p.verified ? '' : ' <span style="color:var(--wn);font-size:.68rem">⚠</span>';
                const cm = pCompat(p);
                let sm = '';
                if (cm) {
                    const col = cm.cls === 'y' ? 'var(--ok)' : cm.cls === 'n' ? 'var(--dg)' : 'var(--mu)';
                    const ic = cm.cls === 'y' ? '✓' : cm.cls === 'n' ? '✗' : '?';
                    sm = ' <span style="color:' + col + ';font-weight:700;font-size:.68rem">' + ic + cm.pct + '%</span>';
                }
                let pm = '';
                if (p.status === 'want') pm = ' 🛒';
                else if (p.status === 'bought') pm = ' 📦';
                else if (p.status === 'installed') pm = ' ✅';
                let nm = p.notes ? ' 📝' : '';
                h += '<div class="ep" data-id="' + escA(p.id) + '"><span class="om">' + hl(p.oem || '—') + '</span>' + prBadge(p) + '<span class="nm">' + hl(p.name || '') + pm + nm + w + sm + '</span></div>';
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
    ar.querySelectorAll('.cd-body').forEach(d => {
        if (anyOpen) d.removeAttribute('open');
        else d.setAttribute('open', '');
    });
}

function rW() {
    const ar = $('ca');
    let h = '<h2 class="sh">🔧 Мастерские</h2>';
    h += '<div class="ri"><span class="chip">всего: <b>' + W.length + '</b></span><button class="bn p" onclick="oWM()" style="padding:4px 10px;font-size:.78rem">➕ Добавить</button></div>';
    if (!W.length) {
        h += '<div class="emp"><div class="empi">🔧</div><p><b>Список пуст</b></p><p>Сохраняйте проверенных мастеров.</p></div>';
        ar.innerHTML = h; return;
    }
    h += '<div class="gr">';
    for (const w of W) h += wH(w);
    h += '</div>';
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

/* ============ КОПИРОВАНИЕ ============ */
function cT(t, b) {
    const x = String(t || '');
    const done = () => {
        const o = b.textContent;
        b.textContent = '✓';
        b.classList.add('ok');
        setTimeout(() => { b.textContent = o; b.classList.remove('ok'); }, 1200);
        toast('Скопировано: ' + x, 'success');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(x).then(done).catch(() => fC(x, done));
    else fC(x, done);
}
function fC(t, d) {
    try {
        const ta = document.createElement('textarea');
        ta.value = t;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        d && d();
    } catch (e) { toast('Не удалось скопировать', 'danger'); }
}

/* ============ КЛИКИ ============ */
function oCC(e) {
    const img = e.target.closest('[data-lightbox-pid]');
    if (img) {
        const pid = img.dataset.lightboxPid;
        const idx = parseInt(img.dataset.lightboxIdx, 10) || 0;
        const p = D.find(x => x.id === pid);
        if (p && Array.isArray(p.photos)) { oL(p.photos, idx); return; }
    }
    const chip = e.target.closest('[data-chip]');
    if (chip) {
        const k = chip.dataset.chip;
        if (k === 'groupBySub') {
            SV.groupBySub = !SV.groupBySub;
            sU(); rC();
        } else if (k === 'fitOnly') {
            tgFitOnly();
        } else if (k === 'vinStrict') {
            SV.vinStrictFilter = !SV.vinStrictFilter;
            sU(); rGar(); rSB(); rC();
        } else if (k === 'clearSub') {
            SV.activeSub = null;
            sU(); rSB(); rC();
        } else if (k === 'clearGearbox') {
            SV.gearboxFilter = 'all';
            SV._vinApplied = false;
            syncTransSelect();
            updateFilterStyling(); sU(); rSB(); rC();
        } else if (k === 'clearEngFam') {
            SV.engFamFilter = 'all';
            SV.engineFilter = 'all';
            SV._vinApplied = false;
            syncEngineSelect();
            updateFilterStyling(); sU(); rSB(); rC();
        } else if (k === 'clearBodyGen') {
            SV.genFilter = 'all';
            SV.bodyFilter = 'all';
            SV._vinApplied = false;
            syncBodyGenSelect();
            updateFilterStyling(); sU(); rSB(); rC();
        }
        return;
    }

    if (e.target.classList && e.target.classList.contains('cn')) return;
    const wb = e.target.closest('[data-wact]');
    if (wb) {
        const c = wb.closest('.wc');
        const id = c ? c.dataset.wid : null;
        if (!id) return;
        if (wb.dataset.wact === 'edit') oEMW(id); else dWsh(id);
        return;
    }
    /* Расходники под VIN: статусы позиции и возврат в каталог */
    const ms = e.target.closest('[data-action="maint-status"]');
    if (ms) { e.stopPropagation(); maintSetStatus(ms.dataset.gid, ms.dataset.id, ms.dataset.status); return; }
    const mbk = e.target.closest('[data-action="maint-back"]');
    if (mbk) { e.stopPropagation(); window._maintViewGid = null; rC(); return; }
    const mal = e.target.closest('[data-action="maint-all"]');
    if (mal) {
        e.stopPropagation();
        window._maintAll = !window._maintAll;
        const sc = $('ca') ? $('ca').scrollTop : 0;
        showMaintenanceForVin(window._maintViewGid);
        if ($('ca')) $('ca').scrollTop = sc;
        return;
    }
    const sch = e.target.closest('[data-action="scheme"]');
    if (sch) {
        e.stopPropagation();
        const sp = D.find(x => x.id === sch.dataset.id);
        if (sp) oScheme(sp.cat, (sp.sub || '').trim());
        return;
    }
    const va = e.target.closest('[data-action="vote-analog"]');
    if (va) {
        e.stopPropagation();
        const p = D.find(x => x.id === va.dataset.id);
        if (p && p.analogs && p.analogs[+va.dataset.ai] !== undefined) {
            setVote(p, p.analogs[+va.dataset.ai], va.dataset.dir === 'bad' ? 'bad' : 'ok');
            if (partmoId === p.id) oPC(p.id);
            rC();
        }
        return;
    }
    const ls = e.target.closest('[data-action="log-scope"]');
    if (ls) {
        e.stopPropagation();
        SV.logScope = SV.logScope === 'all' ? 'car' : 'all';
        sUS(); rLog();
        return;
    }
    const dk = e.target.closest('[data-action="dash-km"]');
    if (dk) {
        e.stopPropagation();
        const inp = $('dashKm');
        const v = inp && inp.value !== '' ? Math.max(0, parseInt(inp.value, 10)) : NaN;
        if (isNaN(v)) { toast('Введите пробег числом', 'danger'); return; }
        TO.km = v;
        sTOStorage(); rTOWidget(); rDash();
        const _av = gAV();
        /* ✅ 1.10.1: остаток до ТО пересчитывается по фактическому пробегу —
           показываем его сразу в тосте; если пробег на момент ТО ещё не
           указан, подсказываем, где его заполнить. */
        let m = (_av ? '🚘 …' + _av.vin.slice(-6) + ': ' : '') + 'пробег обновлён: ' + v.toLocaleString('ru-RU') + ' км';
        const _t = nextTO();
        if (_t && _t.byKm) m += ' · до ТО осталось ' + _t.kmLeft.toLocaleString('ru-RU') + ' км';
        else if (TO.lastKm == null) m += '. 💡 Укажите пробег на момент последнего ТО (✏️ Параметры) — счётчик до ТО будет считать остаток по одометру';
        toast(m, 'success');
        return;
    }
    const dn = e.target.closest('[data-action="dash-notify"]');
    if (dn) { e.stopPropagation(); askToNotify(); return; }
    const dp = e.target.closest('[data-action="dash-part"]');
    if (dp) { e.stopPropagation(); oPC(dp.dataset.id); return; }
    const oo = e.target.closest('[data-action="open-oem"]');
    if (oo) {
        e.stopPropagation();
        const np = findByOem(oo.dataset.oem);
        if (np) oPC(np.id); else toast('Артикул ' + oo.dataset.oem + ' в каталоге не найден', 'info');
        return;
    }
    const mk = e.target.closest('[data-action="maint-kit"]');
    if (mk) { e.stopPropagation(); maintAddAllToShop(); return; }
    const mop = e.target.closest('[data-action="maint-open"]');
    if (mop) { e.stopPropagation(); oPC(mop.dataset.id); return; }
    const mfv = e.target.closest('[data-action="maint-fav"]');
    if (mfv) { e.stopPropagation(); maintToggleFav(mfv.dataset.id); return; }
    const mch = e.target.closest('[data-action="maint-cheaper"]');
    if (mch) { e.stopPropagation(); findCheaper(mch.dataset.oem, mch.dataset.name); return; }
    const mtg = e.target.closest('[data-action="maint-tgl-all"]');
    if (mtg) { e.stopPropagation(); maintToggleAllGroups(); return; }
    /* Клик по заголовку раздела расходников: native-toggle <details> уже
       сработал, запоминаем новое состояние для следующих перерисовок */
    const msum = e.target.closest('.maint-sum');
    if (msum) {
        const d = msum.closest('details[data-mgr]');
        if (d) {
            if (!window._maintCollapsed) window._maintCollapsed = {};
            window._maintCollapsed[d.dataset.mgr] = !d.open;
        }
        return;
    }
    const sb2 = e.target.closest('[data-action="set-status"]');
    if (sb2) { e.stopPropagation(); sPS(sb2.dataset.id, sb2.dataset.status); return; }
    const ct = e.target.closest('[data-copy]');
    if (ct && !ct.closest('.cto')) { e.stopPropagation(); cT(ct.dataset.copy, ct); return; }
    const b = e.target.closest('[data-action]');
    if (b) {
        const a = b.dataset.action;
        /* ✅ Правка №11: обработка find-cheaper по data-атрибутам */
        if (a === 'find-cheaper') {
            e.stopPropagation();
            return findCheaper(b.dataset.oem, b.dataset.name);
        }
        const c = b.closest('.cd');
        const id = c ? c.dataset.id : null;
        if (a === 'copy') return cT(b.dataset.oem, b);
        if (a === 'favorite' && id) return tF(id);
        if (a === 'edit' && id) return oEM(id);
        if (a === 'delete' && id) return dPt(id);
    }
    const la = e.target.closest('[data-lac]');
    if (la) {
        const c = la.closest('.log-entry');
        const id = c ? c.dataset.lid : null;
        if (!id) return;
        if (la.dataset.lac === 'edit') oLogEdit(id); else dLog(id);
        return;
    }
    const tp = e.target.closest('.ep');
    if (tp && tp.dataset.id) oPC(tp.dataset.id);
}
function tF(id) {
    if (pubGuard()) return;
    const p = D.find(x => x.id === id); if (!p) return;
    p.favorite = !p.favorite;
    useIDB ? iPut(SP, p).catch(() => { }) : sD();
    rSB();
    if (window._maintActive && window._maintViewGid) maintRerender(); else rC();
    if (partmoId === id) oPC(id);
    toast(p.favorite ? '⭐ Добавлено' : 'Убрано');
    if (p.favorite) window.ymGoal && window.ymGoal('favorite_added');
}
function sPS(id, st) {
    if (pubGuard()) return;
    const p = D.find(x => x.id === id);
    if (!p || !['want', 'bought', 'installed'].includes(st)) return;
    const same = p.status === st;
    p.status = same ? '' : st;
    useIDB ? iPut(SP, p).catch(() => { }) : sD();
    rSB();
    if (window._maintActive && window._maintViewGid) maintRerender(); else rC();
    if (partmoId === id) oPC(id);
    const L = { want: '🛒 Хочу', bought: '📦 Куплено', installed: '✅ Установлено' };
    toast(same ? 'Статус снят' : L[st], same ? '' : 'success');
    if (!same) window.ymGoal && window.ymGoal('status_' + st);
    if (!same && st === 'installed' && typeof confetti === 'function') confetti();
}

function oL(list, idx) {
    _lbPhotos = Array.isArray(list) ? list.slice() : [];
    _lbIdx = Math.max(0, Math.min(_lbPhotos.length - 1, parseInt(idx, 10) || 0));
    if (!_lbPhotos.length) return;
    _lbShow();
    $('lbt').classList.add('show');
}
function _lbShow() {
    const img = $('lbi'), cnt = $('lbCount'), prev = $('lbPrev'), next = $('lbNext');
    if (img) img.src = _lbPhotos[_lbIdx] || '';
    if (cnt) cnt.textContent = _lbPhotos.length > 1 ? (_lbIdx + 1) + ' / ' + _lbPhotos.length : '';
    if (prev) prev.disabled = _lbIdx <= 0;
    if (next) next.disabled = _lbIdx >= _lbPhotos.length - 1;
}
function lbNav(dir) {
    if (!_lbPhotos.length) return;
    const n = _lbIdx + (dir > 0 ? 1 : -1);
    if (n < 0 || n >= _lbPhotos.length) return;
    _lbIdx = n;
    _lbShow();
}
const cL = () => {
    $('lbt').classList.remove('show');
    $('lbi').src = '';
    _lbPhotos = []; _lbIdx = 0;
};

/* ============ ФОРМА ДЕТАЛИ ============ */
const fCS = () => $('f_cat').innerHTML = CATS.filter(c => c.id !== 'All')
    .map(c => '<option value="' + c.id + '">' + c.icon + ' ' + esc(c.label) + '</option>').join('');

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
    l.innerHTML = h.slice().reverse().map(x =>
        '<div class="phi"><span class="phd">' + esc(fD(x.ts)) + '</span><span class="php">' + esc(fP(x.price, x.currency)) + '</span></div>'
    ).join('');
}
function oAM() {
    edId = null; pPhs = [];
    $('mt').textContent = 'Добавить деталь';
    $('f_id').value = '';
    $('f_cat').value = (SV.activeCat !== 'All' && SV.activeCat !== 'Favorites' && SV.activeCat !== 'Workshops' && SV.activeCat !== 'Log')
        ? SV.activeCat : 'Engine';
    ['f_name', 'f_oem', 'f_an', 'f_dn', 'f_pr', 'f_su', 'f_notes', 'f_eng', 'f_trn', 'f_trnc', 'f_bdy', 'f_trm', 'f_gen', 'f_prreq', 'f_sup_oem'].forEach(id => { if ($(id)) $(id).value = ''; });
    $('f_ver').checked = false; $('f_cu').value = 'RUB'; $('f_sts').value = ''; $('f_fav').value = '0';
    $('ie').innerHTML = ''; aIR('proc', '');
    uPP(); rPH([]);
    $('mo').classList.add('show');
    setTimeout(() => $('f_name').focus(), 50);
}
function oEM(id) {
    const p = D.find(x => x.id === id); if (!p) return;
    edId = id; pPhs = Array.isArray(p.photos) ? p.photos.slice() : [];
    $('mt').textContent = 'Редактировать: ' + (p.name || '');
    $('f_id').value = id;
    $('f_cat').value = p.cat || 'Engine';
    $('f_name').value = p.name || '';
    $('f_oem').value = p.oem || '';
    $('f_ver').checked = !!p.verified;
    $('f_an').value = (p.analogs || []).join(', ');
    if ($('f_prreq')) $('f_prreq').value = [].concat(p.prReq || [], (p.prNo || []).map(x => '!' + x)).join(', ');
    if ($('f_sup_oem')) $('f_sup_oem').value = p.sup || '';
    $('f_dn').value = (p.donors || []).join(', ');
    $('f_eng').value = (p.engines || []).join(', ');
    $('f_trn').value = (p.transmissions || []).join(', ');
    if ($('f_trnc')) $('f_trnc').value = (p.transCodes || []).join(', ');
    $('f_bdy').value = (p.bodies || []).join(', ');
    $('f_gen').value = (p.gens || []).join(', ');
    $('f_trm').value = (p.trims || []).join(', ');
    $('f_pr').value = (p.price != null) ? p.price : '';
    $('f_cu').value = p.currency || 'RUB';
    $('f_sts').value = p.status || '';
    $('f_fav').value = p.favorite ? '1' : '0';
    $('f_su').value = p.shopUrl || '';
    $('f_notes').value = p.notes || '';
    const ed = $('ie'); ed.innerHTML = '';
    if (p.inst && p.inst.length) p.inst.forEach(i => aIR(IM[i.type] || 'note', i.text));
    else aIR('proc', '');
    rPH(p.priceHistory || []);
    uPP();
    $('mo').classList.add('show');
    setTimeout(() => $('f_name').focus(), 50);
}
const cM = () => { $('mo').classList.remove('show'); edId = null; pPhs = []; };

function sPt() {
    if (pubGuard()) return;
    const name = $('f_name').value.trim(), cat = $('f_cat').value;
    if (!name) { toast('Введите название', 'danger'); $('f_name').focus(); return; }
    const oem = $('f_oem').value.trim(), verified = $('f_ver').checked;
    const analogs = sl($('f_an').value), donors = sl($('f_dn').value);
    /* PR-применимость и supersession */
    const prTokens = sl($('f_prreq') ? $('f_prreq').value : '').map(s => s.toUpperCase());
    const prReq = prTokens.filter(x => x[0] !== '!');
    const prNo = prTokens.filter(x => x[0] === '!').map(x => x.slice(1));
    const sup = $('f_sup_oem') ? $('f_sup_oem').value.trim().toUpperCase() : '';
    const engsRaw = sl($('f_eng').value).map(s => s.toUpperCase());
    const engs = engsRaw.filter(x => ENGINES[x]);
    const engsIgnored = engsRaw.filter(x => !ENGINES[x]);
    if (engsIgnored.length) toast('Двигатели: неизвестные коды проигнорированы — ' + engsIgnored.join(', '), 'danger');
    /* КПП: поле семейств + поле буквенных кодов.
       Буквенный код, попавший в поле семейств, автоматически переносится в коды. */
    const isGbCode = x => /^[A-Z]{3}$/.test(x) || /^[A-Z]{3}\d{3}$/.test(x);
    const trnRaw = sl($('f_trn').value).map(s => s.toUpperCase());
    const trns = trnRaw.filter(x => TRANSMISSIONS[x]);
    const trnAsCodes = trnRaw.filter(x => !TRANSMISSIONS[x] && isGbCode(x));
    const trcRaw = $('f_trnc') ? sl($('f_trnc').value).map(s => s.toUpperCase()) : [];
    const trcs = Array.from(new Set(trnAsCodes.concat(trcRaw.filter(isGbCode)))).slice(0, 50);
    const trnIgnored = trnRaw.filter(x => !TRANSMISSIONS[x] && !isGbCode(x))
        .concat(trcRaw.filter(x => !isGbCode(x)));
    if (trnIgnored.length) toast('КПП: неизвестные значения проигнорированы — ' + trnIgnored.join(', '), 'danger');
    // Коды не из базы сохраняем (могли снять с живой коробки), но предупреждаем
    const trcUnknown = trcs.filter(c => !gearboxFamsOf(c).length && !GEARBOX_MISC[c]);
    if (trcUnknown.length) toast('Коды КПП не найдены в базе (сохранены как есть): ' + trcUnknown.join(', '), 'info');
    const bdys = sl($('f_bdy').value).filter(x => BODIES[x]);
    const trms = sl($('f_trm').value).filter(x => TRIMS.includes(x));
    const gens = sl($('f_gen').value).map(s => s.toUpperCase()).filter(x => GENERATIONS[x]);
    const prRaw = $('f_pr').value, price = prRaw === '' ? null : Number(prRaw);
    const currency = $('f_cu').value, status = $('f_sts').value;
    const favorite = $('f_fav').value === '1', shopUrl = sUrl($('f_su').value.trim());
    const notes = $('f_notes').value.trim();
    const inst = [];
    document.querySelectorAll('#ie .ier').forEach(r => {
        const t = r.querySelector('select').value, x = r.querySelector('input').value.trim();
        if (x) inst.push({ type: t, text: x });
    });
    const photosArr = Array.isArray(pPhs) ? pPhs.slice() : [];
    if (edId) {
        const i = D.findIndex(x => x.id === edId);
        if (i < 0) return;
        const o = D[i];
        let h = Array.isArray(o.priceHistory) ? o.priceHistory.slice() : [];
        if (o.price !== price && price != null && !isNaN(price)) {
            h.push({ ts: Date.now(), price: Number(price), currency: currency || 'RUB' });
            if (h.length > 50) h = h.slice(-50);
        }
        D[i] = Object.assign({}, o, {
            cat, sub: o.sub || '', name, oem, verified, analogs, donors,
            engines: engs, bodies: bdys, transmissions: trns, transCodes: trcs, trims: trms, gens,
            prReq, prNo, sup,
            price, currency, status, favorite, notes, shopUrl, inst, photos: photosArr,
            priceHistory: h
        });
        if (useIDB) iPut(SP, D[i]).catch(() => { });
        toast('Сохранено', 'success');
        window.ymGoal && window.ymGoal('part_edited');
    } else {
        const np = {
            id: uid(), cat, sub: '', name, oem, verified, analogs, donors,
            engines: engs, bodies: bdys, transmissions: trns, transCodes: trcs, trims: trms, gens,
            prReq, prNo, sup,
            price, currency, status, favorite, notes, shopUrl, inst, photos: photosArr, priceHistory: []
        };
        D.push(np);
        if (useIDB) iPut(SP, np).catch(() => { });
        toast('Добавлено', 'success');
        window.ymGoal && window.ymGoal('part_added');
    }
    if (!useIDB) sD();
    applyAnalogKb();   /* ✅ 1.9.0: новая/изменённая деталь входит в граф кроссов */
    rSB(); rC(); cM();
}
function dPt(id) {
    if (pubGuard()) return;
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

/* ============ МАСТЕРСКИЕ ============ */
const oWM = () => {
    ewId = null;
    $('wmt').textContent = 'Добавить мастерскую';
    ['w_id', 'w_name', 'w_ph', 'w_ad', 'w_sp', 'w_no'].forEach(id => $(id).value = '');
    $('w_ra').value = '0';
    $('wmo').classList.add('show');
    setTimeout(() => $('w_name').focus(), 50);
};
function oEMW(id) {
    const w = W.find(x => x.id === id); if (!w) return;
    ewId = id;
    $('wmt').textContent = 'Редактировать: ' + (w.name || '');
    $('w_id').value = id;
    $('w_name').value = w.name || '';
    $('w_ph').value = w.phone || '';
    $('w_ad').value = w.address || '';
    $('w_sp').value = w.spec || '';
    $('w_ra').value = String(w.rating || 0);
    $('w_no').value = w.note || '';
    $('wmo').classList.add('show');
    setTimeout(() => $('w_name').focus(), 50);
}
const cWM = () => { $('wmo').classList.remove('show'); ewId = null; };
function sWsh() {
    const name = $('w_name').value.trim();
    if (!name) { toast('Введите название', 'danger'); return; }
    const d = {
        name, phone: $('w_ph').value.trim(), address: $('w_ad').value.trim(),
        spec: $('w_sp').value.trim(), rating: Number($('w_ra').value) || 0,
        note: $('w_no').value.trim()
    };
    if (ewId) {
        const i = W.findIndex(x => x.id === ewId);
        if (i < 0) return;
        W[i] = Object.assign({}, W[i], d);
        if (useIDB) iPut(SW, W[i]).catch(() => { });
        toast('Сохранено', 'success');
    } else {
        const nw = nW(Object.assign({ id: uid() }, d));
        W.push(nw);
        if (useIDB) iPut(SW, nw).catch(() => { });
        toast('Добавлено', 'success');
    }
    if (!useIDB) sWk();
    rSB(); rW(); cWM();
}
function dWsh(id) {
    const w = W.find(x => x.id === id); if (!w) return;
    if (!confirm('Удалить «' + (w.name || '').replace(/["'«»]/g, '') + '»?')) return;
    W = W.filter(x => x.id !== id);
    useIDB ? iDel(SW, id).catch(() => { }) : sWk();
    rSB(); rW();
    toast('Удалено', 'danger');
}

/* ============ ФОТО ============ */
const pkP = () => $('pf').click();

function rmPI(i) {
    if (!Array.isArray(pPhs)) return;
    pPhs.splice(i, 1);
    uPP();
}
function uPP() {
    const g = $('pgrid'), cnt = $('pCount');
    if (!g) return;
    if (!Array.isArray(pPhs)) pPhs = [];
    if (cnt) cnt.textContent = String(pPhs.length);
    /* ✅ Правка №12: lazy loading для превью */
    g.innerHTML = pPhs.map((src, i) =>
        '<div class="pgrid-item">' +
        '<img src="' + sImg(src) + '" alt="" loading="lazy" decoding="async">' +
        '<button type="button" class="rm" data-rmp="' + i + '" title="Удалить">✕</button>' +
        '</div>'
    ).join('');
    g.querySelectorAll('[data-rmp]').forEach(b => {
        b.onclick = () => rmPI(parseInt(b.dataset.rmp, 10));
    });
}
async function oPF(e) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (!files.length) return;
    const MAX = 12;
    for (const f of files) {
        if (pPhs.length >= MAX) { toast('Максимум ' + MAX + ' фото', 'danger'); break; }
        if (!/^image\//.test(f.type)) { toast('Не изображение: ' + f.name, 'danger'); continue; }
        try {
            const s = await cI(f, 800, .75);
            pPhs.push(s);
        } catch (err) { toast('Ошибка обработки', 'danger'); }
    }
    uPP();
}
const cI = (f, ms, q) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = e => {
        const im = new Image();
        im.onerror = rej;
        im.onload = () => {
            const sc = Math.min(1, ms / Math.max(im.width, im.height));
            const w = Math.max(1, Math.round(im.width * sc));
            const h = Math.max(1, Math.round(im.height * sc));
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const cx = c.getContext('2d');
            cx.fillStyle = '#fff';
            cx.fillRect(0, 0, w, h);
            cx.drawImage(im, 0, 0, w, h);
            res(c.toDataURL('image/jpeg', q));
        };
        im.src = e.target.result;
    };
    r.readAsDataURL(f);
});

/* ============ VIN-КЛЮЧ ============ */
const oSM = () => { $('s_vk').value = vk || ''; $('smo').classList.add('show'); };
const cSM = () => { $('smo').classList.remove('show'); };
const sSet = () => {
    vk = $('s_vk').value.trim();
    try { localStorage.setItem(VK, vk); } catch (e) { }
    toast('Сохранено', 'success');
    cSM();
};

/* ============ МЕНЮ ⚙️ ============ */
const cEM = () => $('em').classList.remove('show');
window.tMMenu = function (e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const m = document.getElementById('em');
    if (!m) return;
    m.classList.toggle('show');
};
const tMMenu = window.tMMenu;

/* ============ ЭКСПОРТ ============ */
function dl(f, c, m) {
    const b = new Blob([c], { type: m });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = f;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(u); }, 100);
}
function eD() {
    try {
        const p = {
            version: APP_VERSION,
            exportedAt: new Date().toISOString(),
            vehicle: 'VW Polo/Caddy 6N 1995-2003',
            author: USER.name || 'Guest',
            parts: D, workshops: W, garage: G,
            categories: CUSTOM.categories || [],
            sections: CUSTOM.sections || {}
        };
        const photoCount = D.reduce((s, x) => s + (Array.isArray(x.photos) ? x.photos.length : 0), 0);
        dl('vw_polo_caddy_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(p, null, 2), 'application/json');
        toast('Экспорт: ' + D.length + ' поз., ' + W.length + ' СТО, ' + photoCount + ' фото', 'success');
        window.ymGoal && window.ymGoal('export_json', { parts: D.length });
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}
const statL = s => ({ want: 'Хочу купить', bought: 'Куплено', installed: 'Установлено' }[s] || '');
const catL = id => { const c = CATS.find(x => x.id === id); return c ? c.label : id; };

function eCSV(of) {
    try {
        const src = of ? D.filter(p => p.favorite) : D;
        if (!src.length) { toast('Нет данных', 'danger'); return; }
        const H = ['Категория', 'Название', 'OEM', 'Подтверждён', 'Двигатели', 'КПП', 'Коды КПП', 'Кузова', 'Комплектации', 'Аналоги', 'Доноры', 'Цена', 'Валюта', 'Статус', 'Избранное', 'Магазин', 'Заметки'];
        const rows = src.map(p => [
            catL(p.cat), p.name || '', p.oem || '', p.verified ? 'Да' : '',
            (p.engines || []).join('; '), (p.transmissions || []).join('; '),
            (p.transCodes || []).join('; '),
            (p.bodies || []).join('; '), (p.trims || []).join('; '),
            (p.analogs || []).join('; '), (p.donors || []).join('; '),
            p.price != null ? p.price : '', p.currency || '',
            statL(p.status), p.favorite ? 'Да' : '', p.shopUrl || '', p.notes || ''
        ]);
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
        const srt = D.slice().sort((a, b) => {
            const ga = (EK[a.cat] || {}).g || '';
            const gb = (EK[b.cat] || {}).g || '';
            if (ga !== gb) return ga.localeCompare(gb);
            return (a.oem || '').localeCompare(b.oem || '');
        });
        let lg = '', ct = 0;
        for (const p of srt) {
            const m = EK[p.cat] || { g: 'Прочее', s: 'Прочее' };
            const g = m.g;
            const s = (p.sub || '').trim() || m.s;
            if (g !== lg) { ct = 1; lg = g; } else ct++;
            const n = (p.inst || []).map(i => IL[IM[i.type] || 'n'] + ': ' + i.text).join(' | ');
            rows.push([g, s, String(ct).padStart(3, '0'), p.oem || '', p.name || '', p.verified ? 'Да' : '—', '1', n]);
        }
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

/* ============ ИМПОРТ ============ */
const tI = () => $('if').click();
function oIF(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
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
        if (useIDB) iClr(SP).then(() => iMany(SP, D)).catch(() => { });
        else sD();
        if (ws && ws.length) {
            W = ws.map(nW).filter(Boolean);
            if (useIDB) iClr(SW).then(() => iMany(SW, W)).catch(() => { });
            else sWk();
        }
        if (gs && gs.length) {
            G = gs.filter(x => x && x.vin).map(x => ({
                id: x.id || ('g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)),
                vin: String(x.vin).toUpperCase(),
                brand: String(x.brand || ''),
                model: String(x.model || ''),
                year: x.year || null,
                body: String(x.body || ''),
                plant: String(x.plant || ''),
                engines: Array.isArray(x.engines) ? x.engines : [],
                addedAt: x.addedAt || Date.now()
            }));
            sG();
        }
        toast('База заменена: ' + D.length + ' поз.', 'success');
    } else if (m === 'merge') {
        const keyOf = x => (x.oem || '') + '||' + (x.name || '');
        const map = new Map(D.map(x => [keyOf(x), x]));
        let add = 0, merged = 0;
        for (const p of cl) {
            const k = keyOf(p);
            if (!map.has(k)) {
                D.push(p); map.set(k, p); add++;
            } else {
                const old = map.get(k);
                let touched = false;
                if (Array.isArray(p.photos) && p.photos.length) {
                    const existing = new Set(Array.isArray(old.photos) ? old.photos : []);
                    const merged2 = [...(old.photos || [])];
                    for (const src of p.photos) {
                        if (!existing.has(src)) { merged2.push(src); touched = true; }
                    }
                    if (touched) old.photos = merged2.slice(0, 12);
                }
                if (p.notes && p.notes !== old.notes) { old.notes = p.notes; touched = true; }
                if (p.price != null && p.price !== old.price) { old.price = p.price; touched = true; }
                if (p.shopUrl && p.shopUrl !== old.shopUrl) { old.shopUrl = p.shopUrl; touched = true; }
                if (touched) { merged++; if (useIDB) iPut(SP, old).catch(() => { }); }
            }
        }
        if (useIDB) iMany(SP, D).catch(() => { });
        else sD();

        let wa = 0;
        if (ws && ws.length) {
            const wsn = new Set(W.map(w => w.name || ''));
            for (const w of ws.map(nW).filter(Boolean)) {
                if (!wsn.has(w.name)) { W.push(w); wsn.add(w.name); wa++; }
            }
            if (useIDB) iMany(SW, W).catch(() => { });
            else sWk();
        }
        let ga = 0;
        if (gs && gs.length) {
            const gsn = new Set(G.map(g => g.vin));
            for (const g of gs) {
                if (g && g.vin && !gsn.has(String(g.vin).toUpperCase())) {
                    G.push({
                        id: g.id || ('g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)),
                        vin: String(g.vin).toUpperCase(),
                        brand: String(g.brand || ''),
                        model: String(g.model || ''),
                        year: g.year || null,
                        body: String(g.body || ''),
                        plant: String(g.plant || ''),
                        engines: Array.isArray(g.engines) ? g.engines : [],
                        addedAt: g.addedAt || Date.now()
                    });
                    gsn.add(String(g.vin).toUpperCase());
                    ga++;
                }
            }
            if (ga) sG();
        }
        let msg = '+' + add + ' поз., ~' + merged + ' обновлено';
        if (wa) msg += ', +' + wa + ' СТО';
        if (ga) msg += ', +' + ga + ' VIN';
        toast(msg, 'success');
    } else {
        toast('Неизвестный режим', 'danger');
        return;
    }

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

/* ============ ЖУРНАЛ ============
   ✅ 1.10.0: журнал ведётся РАЗДЕЛЬНО по машинам — каждая запись хранит
   VIN. С активной машиной показываются только её записи; переключатель
   «🚘 Эта машина / 🚙 Все машины» открывает общий список с бейджами VIN. */
function rLog() {
    const ar = $('ca');
    let h = '<h2 class="sh">📖 Журнал обслуживания</h2>';
    const av = gAV();
    const scopeAll = !!(av && SV.logScope === 'all');
    const list = carLogs();
    h += '<div class="ri">';
    h += '<span class="chip">записей: <b>' + list.length + '</b></span>';
    if (av) {
        h += '<span class="chip">VIN …' + esc(av.vin.slice(-6)) + '</span>';
        h += '<button class="bn' + (scopeAll ? '' : ' p') + '" data-action="log-scope" style="padding:4px 10px;font-size:.78rem" title="'
            + (scopeAll ? 'Показаны записи всех машин гаража — кликните, чтобы вернуться к активной' : 'Журнал ведётся раздельно по машинам — кликните, чтобы увидеть записи всех машин гаража') + '">'
            + (scopeAll ? '🚙 Все машины' : '🚘 Эта машина') + '</button>';
    } else {
        h += '<span class="chip" title="Выберите машину в гараже — журнал покажет её записи">машина не выбрана · показаны все записи</span>';
    }
    h += '<button class="bn p" onclick="oLogNew()" style="padding:4px 10px;font-size:.78rem">➕ Добавить запись</button>';
    h += '</div>';
    if (!list.length) {
        if (av && !scopeAll && LOG.length) {
            h += '<div class="emp"><div class="empi">📖</div><p><b>У этой машины записей пока нет</b></p>'
                + '<p style="font-size:.8rem;color:var(--mu)">Журнал ведётся раздельно по VIN. В других машинах гаража записей: ' + (LOG.length - vinLogs().length) + '.</p>'
                + '<button class="bn" data-action="log-scope">🚙 Показать все машины</button> <button class="bn p" onclick="oLogNew()">➕ Добавить запись</button></div>';
        } else {
            h += '<div class="emp"><div class="empi">📖</div><p><b>Журнал пуст</b></p><p>Фиксируй каждую работу — потом не вспомнишь, когда менял ГРМ.</p></div>';
        }
        ar.innerHTML = h; return;
    }
    const garVin = v => { const k = String(v || '').trim().toUpperCase(); return G.find(x => String(x.vin).toUpperCase() === k); };
    const srt = list.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.km || 0) - (a.km || 0));
    for (const e of srt) {
        h += '<div class="log-entry" data-lid="' + escA(e.id) + '" style="background:var(--cd);border:1px solid var(--bd);border-left:4px solid var(--a);border-radius:6px;padding:10px 12px;margin-bottom:8px">';
        h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px"><span style="font-family:Consolas,monospace;font-size:.72rem;color:var(--mu);font-weight:700">' + esc(e.date || '—') + '</span>';
        h += '<span style="display:flex;gap:4px;align-items:center">';
        /* Бейдж машины — в режиме «все машины» и когда машина не выбрана */
        if (scopeAll || !av) {
            const v = logVinOf(e);
            const mine = av && v === String(av.vin).trim().toUpperCase();
            const inGar = v && garVin(v);
            h += '<span title="' + (v ? escA(inGar ? (inGar.brand + ' ' + inGar.model).trim() : 'машина уже не в гараже') : 'запись без привязки к VIN') + '" style="font-family:Consolas,monospace;font-size:.66rem;padding:1px 6px;border-radius:10px;border:1px solid var(--bd);'
                + (mine ? 'color:var(--a);border-color:var(--a)' : 'color:var(--mu)') + '">'
                + (v ? (mine ? '🚘 ' : '') + '…' + esc(v.slice(-6)) + (inGar ? '' : ' ✝') : 'без VIN') + '</span>';
        }
        if (e.km) h += '<span style="font-size:.72rem;background:var(--hv);padding:1px 6px;border-radius:10px;color:var(--mu)">' + e.km.toLocaleString('ru-RU') + ' км</span>';
        h += '</span></div>';
        h += '<div style="font-weight:700;font-size:.92rem;color:var(--tx);margin:2px 0 6px">' + esc(e.title || '(без названия)') + '</div>';
        if (e.items && e.items.length) h += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px">'
            + e.items.map(it => '<span style="font-size:.68rem;background:rgba(0,176,240,.12);color:var(--a);padding:2px 6px;border-radius:3px;font-family:Consolas,monospace">' + esc(it) + '</span>').join('') + '</div>';
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
    /* ✅ 1.10.0: запись прикрепляется к активной машине — показываем, к какой */
    const av = gAV();
    $('logmt').textContent = av ? 'Новая запись · 🚘 …' + av.vin.slice(-6) : 'Новая запись';
    $('l_id').value = '';
    $('l_date').value = new Date().toISOString().slice(0, 10);
    $('l_km').value = TO.km || '';
    $('l_title').value = '';
    $('l_items').value = '';
    $('l_cost').value = '';
    $('l_cur').value = 'RUB';
    $('l_shop').value = '';
    $('l_notes').value = '';
    openM('logmo');
    setTimeout(() => $('l_title').focus(), 50);
}
function oLogEdit(id) {
    const e = LOG.find(x => x.id === id); if (!e) return;
    const ev = logVinOf(e);
    $('logmt').textContent = ev ? 'Редактирование · 🚘 …' + ev.slice(-6) : 'Редактирование';
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
    /* ✅ 1.10.0: при редактировании VIN записи не переписываем — запись
       остаётся в журнале той машины, к которой была прикреплена. */
    const prev = id ? LOG.find(x => x.id === id) : null;
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
        vin: (prev && logVinOf(prev)) ? logVinOf(prev) : (gAV() ? String(gAV().vin).toUpperCase() : ''),
        createdAt: (prev && prev.createdAt) || Date.now()
    };
    if (id) {
        const i = LOG.findIndex(x => x.id === id);
        if (i >= 0) LOG[i] = rec;
    } else LOG.push(rec);
    useIDB ? iPut('logs', rec).catch(() => { }) : sLogs();
    if (!useIDB) sLogs();
    _rebuildLogIndex();
    cLog(); rC();
    toast(id ? 'Запись обновлена' : 'Запись добавлена', 'success');
    window.ymGoal && window.ymGoal(id ? 'log_edited' : 'log_added');
}
function dLog(id) {
    if (!confirm('Удалить запись?')) return;
    LOG = LOG.filter(x => x.id !== id);
    useIDB ? iDel('logs', id).catch(() => { }) : sLogs();
    if (!useIDB) sLogs();
    _rebuildLogIndex();
    rC();
    toast('Удалено', 'danger');
}
function lastLogForOEM(oem) {
    if (!oem) return null;
    return _logByOem.get(nz(oem)) || null;
}
function lastLogBadge(oem) {
    if (!oem) return '';
    const l = lastLogForOEM(oem);
    if (!l) return '';
    return '<div class="cd-meta"><span class="hi" style="cursor:default" title="Последняя замена: ' + escA(l.title) + '">🔧 Меняли: ' + esc(l.date) + (l.km ? ' · ' + l.km.toLocaleString('ru-RU') + ' км' : '') + '</span></div>';
}

/* ============ ТО ============ */
/* ✅ 1.10.1: остаток до ТО считается ПО ФАКТИЧЕСКОМУ ПРОБЕГУ, если указан
   lastKm (пробег на момент последнего ТО): kmLeft = интервал − (текущий км −
   км на момент ТО). Обновил пробег в кабинете — остаток сразу пересчитался.
   Дни до ТО: по реальному темпу езды (км с последнего ТО / дней с даты),
   иначе оценка ~1000 км/мес. Без lastKm — прежняя оценка по дате
   (совместимость со старыми записями), в расчёте помечается byKm=false. */
function nextTO() {
    if (TO.km == null) return null;
    const interval = Number(TO.interval) || 15000;
    const DEF_RATE = 1000 / 30.44;          // ~1000 км/мес, км в сутки
    let last = null;
    if (TO.lastDate) {
        last = new Date(TO.lastDate);
        if (isNaN(last.getTime())) last = null;
    }
    const hasLastKm = TO.lastKm != null && !isNaN(Number(TO.lastKm));
    if (hasLastKm) {
        const kmSince = Math.max(0, Number(TO.km) - Number(TO.lastKm));
        const kmLeft = Math.max(0, interval - kmSince);
        let rate = DEF_RATE;
        if (last) {
            const daysSince = (Date.now() - last.getTime()) / 86400000;
            if (daysSince > 1 && kmSince > 0) rate = kmSince / daysSince;
        }
        return {
            interval, kmLeft: Math.round(kmLeft), daysLeft: Math.round(kmLeft / rate),
            lastDate: TO.lastDate || null, lastKm: Number(TO.lastKm),
            km: Number(TO.km), kmSince: Math.round(kmSince), byKm: true
        };
    }
    if (!last) return null;
    /* старая оценка по дате: ~1000 км в месяц */
    const monthsSince = Math.max(0, (Date.now() - last.getTime()) / (86400000 * 30.44));
    const kmSince = monthsSince * 1000;
    const kmLeft = Math.max(0, interval - kmSince);
    return {
        interval, kmLeft: Math.round(kmLeft), daysLeft: Math.round(kmLeft / DEF_RATE),
        lastDate: TO.lastDate, lastKm: null, km: Number(TO.km),
        kmSince: Math.round(kmSince), byKm: false
    };
}
function rTOWidget() {
    const chip = $('toChip'), lbl = $('toLbl');
    if (!chip || !lbl) return;
    const t = nextTO();
    if (!t) {
        lbl.textContent = 'Настроить ТО';
        chip.title = 'Заполни пробег и дату последнего ТО';
        chip.style.borderColor = '';
        chip.style.color = '';
        chip.style.background = '';
        return;
    }
    const urgent = t.daysLeft <= 7 || t.kmLeft <= 500;
    const warn = t.daysLeft <= 30 || t.kmLeft <= 2000;
    if (urgent) { chip.style.borderColor = 'var(--dg)'; chip.style.color = 'var(--dg)'; chip.style.background = 'rgba(220,53,69,.08)'; }
    else if (warn) { chip.style.borderColor = 'var(--sr)'; chip.style.color = 'var(--sr)'; chip.style.background = 'rgba(245,166,35,.08)'; }
    else { chip.style.borderColor = 'var(--ok)'; chip.style.color = 'var(--ok)'; chip.style.background = 'rgba(40,167,69,.08)'; }
    lbl.textContent = '⏱ ' + t.kmLeft.toLocaleString('ru-RU') + ' км / ' + t.daysLeft + ' дн.';
    chip.title = 'До ТО: ' + t.kmLeft.toLocaleString('ru-RU') + ' км / ' + t.daysLeft + ' дн. · Интервал ' + t.interval.toLocaleString('ru-RU') + ' км · '
        + (t.byKm
            ? 'расчёт по фактическому пробегу (с последнего ТО: ' + t.kmSince.toLocaleString('ru-RU') + ' км)'
            : 'оценка по дате (~1000 км/мес) — укажите пробег на момент ТО в настройках для точного расчёта')
        + '. Клик для настроек.';
}
function oTO() {
    /* ✅ 1.10.0: настройки ТО принадлежат активной машине — подписываем, какой */
    const av = gAV();
    const tc = $('tom_car');
    if (tc) tc.textContent = av ? '· 🚘 …' + av.vin.slice(-6) : '· машина не выбрана';
    $('t_km').value = TO.km != null ? TO.km : '';
    $('t_lastkm').value = TO.lastKm != null ? TO.lastKm : '';
    $('t_date').value = TO.lastDate || '';
    $('t_interval').value = String(TO.interval || 15000);
    openM('tomo');
}
const cTO = () => closeM('tomo');
function resetTO() {
    const av = gAV();
    if (!confirm('Сбросить настройки ТО' + (av ? ' машины …' + av.vin.slice(-6) : '') + '? Виджет вернётся в состояние «Настроить».')) return;
    TO = toDef();
    sTOStorage();   // ✅ 1.10.0: удаляет запись только этой машины, чужие не трогает
    cTO(); rTOWidget();
    if (SV.activeCat === 'Dash') rDash();
    toast('Настройки ТО сброшены', 'danger');
}
function sTO() {
    TO.km = $('t_km').value !== '' ? Number($('t_km').value) : null;
    TO.lastKm = $('t_lastkm').value !== '' ? Number($('t_lastkm').value) : null;
    TO.lastDate = $('t_date').value || null;
    TO.interval = Number($('t_interval').value) || 15000;
    /* ✅ 1.10.1: ТО сделано сегодня, а «пробег на момент ТО» не заполнен —
       считаем его равным текущему (самый частый сценарий: обслужился →
       записал). Не молча: сообщаем в тосте. */
    let note = '';
    const today = new Date().toISOString().slice(0, 10);
    if (TO.lastKm == null && TO.km != null && TO.lastDate === today) {
        TO.lastKm = TO.km;
        note = ' · пробег на момент ТО = текущий (' + TO.km.toLocaleString('ru-RU') + ' км)';
    }
    sTOStorage();
    cTO(); rTOWidget(); rGar();
    if (SV.activeCat === 'Dash') rDash();
    const av = gAV();
    toast((av ? '🚘 …' + av.vin.slice(-6) + ': ' : '') + 'настройки ТО сохранены' + note, 'success');
}

/* ============ СПИСОК ПОКУПОК ============
   «Список покупок на ТО» (кнопка «🛒 Список покупок» в «Моя машина» и
   «🛒 В список» из расходников VIN): только расходники ТО — ровно те, что
   отбирает классификатор maintClassOf для списка «Расходники для ТО»:
   фильтры, жидкости/масла/смазки, пробка и болт поддона (с шайбой),
   герметики и фиксаторы, ремни и ролики, колодки/диски/барабаны, свечи,
   щётки, регламент. Ремонтные запчасти (подвеска, электрика, радиаторы,
   суппорты, лампы и т.п.) сюда не попадают — они в каталоге.
   Если в гараже выбрана машина, список сужается до позиций её мотора/
   кузова/КПП.

   ✅ 1.10.1: отметки СОХРАНЯЮТСЯ — у каждой машины свой список (как пробег
   и журнал). Хранилище vw_polo_shop_v1 = { byVin: { VIN: [ключи] } }, ключ
   '__common__' — когда машина не выбрана. Позиции пишутся устойчивым ключом
   «oem|название» (lowercase), а не внутренним id: id пересоздаются при
   обновлении каталога, а артикул с названием — нет. */
const pickKeyOf = p => (String(p.oem || '').toLowerCase() + '|' + String(p.name || '').toLowerCase());
let SHOP_ALL = {};
function lShopAll() {
    SHOP_ALL = {};
    try {
        const r = localStorage.getItem(SHPKEY);
        if (r) {
            const t = JSON.parse(r);
            if (t && typeof t === 'object' && t.byVin && typeof t.byVin === 'object') {
                for (const k of Object.keys(t.byVin)) {
                    const arr = t.byVin[k];
                    if (Array.isArray(arr)) SHOP_ALL[String(k).trim().toUpperCase()] = arr.map(String).filter(Boolean);
                }
            }
        }
    } catch (e) { }
    shopSync();
}
/* shopPick = отметки активной машины: устойчивые ключи из хранилища →
   текущие id каталога (несуществующие позиции отбрасываются). */
function shopSync() {
    const keys = SHOP_ALL[toKey()] || [];
    const idx = new Map();
    for (const p of D) { const k = pickKeyOf(p); if (!idx.has(k)) idx.set(k, p.id); }
    const ids = [];
    for (const k of keys) { const id = idx.get(k); if (id) ids.push(id); }
    shopPick = new Set(ids);
}
function sShopPick() {
    const idx = new Map();
    for (const p of D) idx.set(p.id, pickKeyOf(p));
    const keys = [];
    for (const id of shopPick) { const k = idx.get(id); if (k) keys.push(k); }
    const key = toKey();
    if (keys.length) SHOP_ALL[key] = keys; else delete SHOP_ALL[key];
    try { localStorage.setItem(SHPKEY, JSON.stringify({ byVin: SHOP_ALL })); } catch (e) { }
}
function shopClearAll() {
    if (!shopPick.size) { toast('Отметок нет', 'info'); return; }
    if (!confirm('Снять все отметки в списке покупок' + (gAV() ? ' машины …' + gAV().vin.slice(-6) : '') + '?')) return;
    shopPick = new Set();
    sShopPick();
    oShopList(true);
    toast('Отметки сняты', 'info');
}
function oShopList(keep) {
    /* ✅ 1.10.1: при открытии отметки больше НЕ сбрасываются — галочки
       живут в хранилище (список готовится к печати/поездке в магазин).
       Очистка — явная, кнопкой «✖ Снять отметки» в подвале. */
    if (!keep) shopSync();
    const t = nextTO();
    const av = gAV();
    /* «ТО 15 000 км» / «🔧 ТО-2: воздушный фильтр + свечи» — напоминания
       регламента, а не товар: в список покупок не идут (в любой группе). */
    const isBuyable = p => {
        if (!maintClassOf(p)) return false;
        if (/^\s*(?:🔧\s*)?ТО[\s\-–—]*\d/i.test(String(p.name || ''))) return false;
        return true;
    };
    const candidates = D.filter(p => shopPick.has(p.id) || (isBuyable(p) && maintFitsCar(av, p)));
    const byGr = {};
    for (const p of candidates) {
        const gid = maintClassOf(p) || 'reglament';
        (byGr[gid] = byGr[gid] || []).push(p);
    }
    const ar = $('shopBody');
    let h = '';
    /* ✅ 1.10.3: дата последнего ТО может быть не указана (с 1.10.1 расчёт
       идёт по пробегу lastKm) — вместо пустого «Последнее ТО: » показываем
       пробег, на котором было ТО. */
    if (t) {
        const lastLbl = t.lastDate ? esc(t.lastDate)
            : (t.lastKm != null ? 'на ' + Number(t.lastKm).toLocaleString('ru-RU') + ' км' : '—');
        h += '<div style="padding:10px 12px;background:rgba(40,167,69,.08);border:1px solid var(--ok);border-radius:4px;font-size:.82rem;margin-bottom:12px">📅 Последнее ТО: <b>' + lastLbl + '</b> · Следующее через <b>' + t.kmLeft.toLocaleString('ru-RU') + ' км</b> (~' + t.daysLeft + ' дн.)</div>';
    }
    else h += '<div style="padding:10px 12px;background:rgba(245,166,35,.08);border:1px solid var(--sr);border-radius:4px;font-size:.82rem;margin-bottom:12px">⚠️ Настрой ТО в шапке (🛠) — расчёт будет точнее. Пока показываю всё по регламенту.</div>';
    h += '<p style="font-size:.82rem;color:var(--mu);margin-top:0">Отметь, что нужно купить. Итог суммируется внизу. Здесь только расходники ТО — ремонтные запчасти ищите в каталоге.</p>';
    if (!candidates.length) {
        h += '<div style="padding:26px 12px;text-align:center;color:var(--mu);font-size:.85rem">🛒 Расходников ТО не найдено.<br>Проверьте, что база загружена, а в карточке VIN указаны мотор и кузов.</div>';
    } else {
        const order = MAINT_GROUPS.map(x => x.id).filter(id => byGr[id] && byGr[id].length);
        Object.keys(byGr).forEach(id => { if (!order.includes(id)) order.push(id); });
        for (const id of order) {
            const meta = MAINT_GROUPS.find(x => x.id === id);
            const parts = byGr[id].slice().sort((a, b) => _maintWeight(a) - _maintWeight(b) || String(a.name || '').localeCompare(String(b.name || ''), 'ru'));
            /* Сворачиваемая группа: состояние помнится в SV.shopCollapsed. */
            const collapsed = !!(SV.shopCollapsed && SV.shopCollapsed[id]);
            const sel = parts.filter(p => shopPick.has(p.id)).length;
            h += '<div class="shop-gr" data-shop-gr="' + escA(id) + '">';
            h += '<button type="button" class="shop-gr-h" data-shop-tgl="' + escA(id) + '" aria-expanded="' + (collapsed ? 'false' : 'true') + '">'
                + '<span class="shop-chev' + (collapsed ? ' collapsed' : '') + '">▼</span>'
                + '<span>' + esc(meta ? meta.icon + ' ' + meta.label : id) + ' <span style="color:var(--mu);font-weight:400">(' + parts.length + ')</span></span>'
                + (sel ? '<span class="shop-gr-sel">✓ ' + sel + '</span>' : '')
                + '</button>';
            h += '<div class="shop-gr-b"' + (collapsed ? ' style="display:none"' : '') + '>';
            for (const p of parts) {
                h += '<label style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-bottom:1px solid var(--bd);cursor:pointer;transition:all .15s"><input type="checkbox" data-shop-id="' + escA(p.id) + '"' + (shopPick.has(p.id) ? ' checked' : '') + ' style="margin-top:3px;flex-shrink:0;width:16px;height:16px;cursor:pointer"><div style="flex:1;min-width:0">';
                h += '<div style="font-weight:700;font-size:.85rem;color:var(--tx)">' + esc(p.name || '') + '</div>';
                if (p.oem) h += '<div style="font-family:Consolas,monospace;font-size:.7rem;color:var(--mu)">' + esc(p.oem) + '</div>';
                if (p.analogs && p.analogs.length) h += '<div style="font-size:.7rem;color:var(--mu);margin-top:2px">Аналоги: ' + esc(p.analogs.slice(0, 3).join(', ')) + '</div>';
                if (p.price != null) h += '<div style="font-size:.72rem;color:var(--mu);margin-top:2px">' + esc(fP(p.price, p.currency)) + '</div>';
                h += '</div></label>';
            }
            h += '</div></div>';
        }
    }
    ar.innerHTML = h;
    ar.querySelectorAll('[data-shop-id]').forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) shopPick.add(cb.dataset.shopId);
            else shopPick.delete(cb.dataset.shopId);
            sShopPick();   // ✅ 1.10.1: отметка сразу уходит в хранилище
            updShopCount();
            updShopGrSel(cb);
        });
    });
    /* Клик по шапке группы — свернуть/развернуть (с запоминанием). */
    ar.querySelectorAll('[data-shop-tgl]').forEach(btn => {
        btn.addEventListener('click', () => {
            const gid = btn.dataset.shopTgl;
            const wrap = btn.closest ? btn.closest('.shop-gr') : null;
            if (!wrap) return;
            if (!SV.shopCollapsed || typeof SV.shopCollapsed !== 'object') SV.shopCollapsed = {};
            const now = !SV.shopCollapsed[gid];
            SV.shopCollapsed[gid] = now;
            const body = wrap.querySelector('.shop-gr-b');
            if (body) body.style.display = now ? 'none' : '';
            const chev = wrap.querySelector('.shop-chev');
            if (chev) chev.classList.toggle('collapsed', now);
            btn.setAttribute('aria-expanded', now ? 'false' : 'true');
            sU();
        });
    });
    updShopCount();
    openM('shopmo');
    window.ymGoal && window.ymGoal('shop_list_opened');
}
/* Счётчик выбранных позиций — в подвале модалки (слева от кнопок). */
function pluralPos(n) {
    const m = n % 100, k = n % 10;
    if (m >= 11 && m <= 14) return 'позиций';
    if (k === 1) return 'позиция';
    if (k >= 2 && k <= 4) return 'позиции';
    return 'позиций';
}
function updShopCount() {
    const el = $('shopCount');
    if (!el) return;
    el.innerHTML = '🛒 Выбрано: <b>' + shopPick.size + '</b> ' + pluralPos(shopPick.size);
    if (shopPick.size) el.classList.remove('zero'); else el.classList.add('zero');
}
/* Бейдж «✓ k» в шапке группы — сколько отмечено внутри. */
function updShopGrSel(cb) {
    const wrap = cb && cb.closest ? cb.closest('.shop-gr') : null;
    if (!wrap) return;
    let sel = 0;
    wrap.querySelectorAll('[data-shop-id]').forEach(c => { if (c.checked) sel++; });
    const head = wrap.querySelector('.shop-gr-h');
    let badge = wrap.querySelector('.shop-gr-sel');
    if (sel) {
        if (!badge && head) {
            badge = document.createElement('span');
            badge.className = 'shop-gr-sel';
            head.appendChild(badge);
        }
        if (badge) badge.textContent = '✓ ' + sel;
    } else if (badge && badge.remove) badge.remove();
}
const cShop = () => closeM('shopmo');
function pShop() {
    if (!shopPick.size) { toast('Ничего не выбрано', 'danger'); return; }
    const items = D.filter(p => shopPick.has(p.id));
    const av = gAV();
    const css = '<style>body{font-family:Arial,sans-serif;padding:20px;color:#000}h1{font-size:18px;margin:0 0 12px}h2{font-size:14px;margin:18px 0 8px;color:#004b8f;border-bottom:1px solid #ccc;padding-bottom:3px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f0f0f0}.vinbox{border:2px solid #000;padding:10px 14px;margin:10px 0 14px}.vinlab{font-size:11px;font-weight:700;letter-spacing:2px;color:#555}.vincode{font-family:Consolas,"Courier New",monospace;font-size:22px;font-weight:700;letter-spacing:2px}.vincar{font-size:12px;margin-top:4px}@media print{@page{margin:15mm}}</style>';
    const w = window.open('', '_blank');
    /* ✅ 1.10.3: защита от блокировщика всплывающих окон — без неё
       w === null и печать падала молча (TypeError), особенно на телефонах.
       Такой же guard есть в printIssueChecklist и printVinCard. */
    if (!w) { toast('Браузер заблокировал всплывающее окно — разрешите его для этого сайта', 'danger'); return; }
    let h = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Список покупок на ТО</title>' + css + '</head><body>';
    h += '<h1>Список покупок на ТО — VW Polo/Caddy 6N</h1>';
    /* VIN крупно — продавцу в магазине проще ориентироваться по машине. */
    if (av && av.vin) {
        const carBits = [];
        if (av.brand || av.model) carBits.push([av.brand, av.model].filter(Boolean).join(' '));
        if (av.year) carBits.push(av.year + ' г.');
        if (av.engineCode) carBits.push('мотор ' + av.engineCode);
        /* КПП: сначала буквенный код (выбит на корпусе, напр. CHL/DXP) — он
           однозначно определяет агрегат; семейство (085/02K) — только запасной
           вариант, если код в карточке не указан. */
        if (av.gearboxCode || av.transCode) carBits.push('КПП ' + (av.gearboxCode || av.transCode));
        if (av.prodDate) carBits.push('выпуск ' + av.prodDate);
        h += '<div class="vinbox"><div class="vinlab">VIN</div>'
            + '<div class="vincode">' + esc(String(av.vin).toUpperCase()) + '</div>'
            + (carBits.length ? '<div class="vincar">' + esc(carBits.join(' · ')) + '</div>' : '')
            + '</div>';
    } else {
        h += '<div style="border:1px dashed #999;padding:8px 12px;margin:10px 0 14px;font-size:12px;color:#666">VIN не указан — выберите машину в гараже, чтобы продавец мог проверить применяемость.</div>';
    }
    h += '<p style="font-size:12px;color:#666">Дата: ' + new Date().toLocaleDateString('ru-RU') + (TO.km ? ' · Пробег: ' + TO.km.toLocaleString('ru-RU') + ' км' : '') + '</p>';
    const byGr = {};
    for (const p of items) {
        const key = maintClassOf(p) || ('cat:' + (p.cat || ''));
        (byGr[key] = byGr[key] || []).push(p);
    }
    const grOrder = MAINT_GROUPS.map(x => x.id).filter(k => byGr[k])
        .concat(Object.keys(byGr).filter(k => k.indexOf('cat:') === 0));
    for (const key of grOrder) {
        const meta = MAINT_GROUPS.find(x => x.id === key);
        const title = meta ? meta.label : catL(key.slice(4));
        h += '<h2>' + esc(title) + '</h2><table><tr><th style="width:30px">OK</th><th style="width:150px">OEM</th><th>Наименование</th><th style="width:200px">Аналоги</th></tr>';
        for (const p of byGr[key]) {
            h += '<tr><td></td><td>' + esc(p.oem || '—') + '</td><td>' + esc(p.name || '') + '</td><td style="font-size:11px">' + esc((p.analogs || []).slice(0, 3).join(', ')) + '</td></tr>';
        }
        h += '</table>';
    }
    h += '<p style="margin-top:20px;font-size:11px;color:#666">Всего: ' + items.length + ' позиций.</p>';
    h += '<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>';
    h += '</body></html>';
    w.document.write(h);
    w.document.close();
    window.ymGoal && window.ymGoal('shop_list_printed', { items: items.length });
}
function eShopCSV() {
    if (!shopPick.size) { toast('Ничего не выбрано', 'danger'); return; }
    const items = D.filter(p => shopPick.has(p.id));
    const H = ['OEM', 'Название', 'Категория', 'Аналоги', 'Цена', 'Валюта', 'Заметки'];
    const rows = items.map(p => [p.oem || '', p.name || '', catL(p.cat), (p.analogs || []).join('; '), p.price != null ? p.price : '', p.currency || '', p.notes || '']);
    const csv = '\ufeff' + [H, ...rows].map(r => r.map(csvE).join(',')).join('\r\n');
    dl('to_shop_list_' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
    toast('CSV: ' + items.length + ' позиций', 'success');
}

/* ============ НАЙТИ ДЕШЕВЛЕ ============ */
function findCheaper(oem, name) {
    if (!oem) { toast('Нет артикула', 'danger'); return; }
    const c = String(oem).replace(/\s/g, '');
    const cleanName = String(name || '')
        .replace(/\b(?:vw|volkswagen)\s+polo\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const urls = [
        'https://www.exist.ru/Price/?pcode=' + c,
        'https://www.autodoc.ru/price/657/' + c,
        'https://www.avito.ru/rossiya/zapchasti_i_aksessuary?q=' +
        encodeURIComponent((cleanName ? cleanName + ' ' : '') + 'VW Polo ' + c),
        'https://elcats.ru/vw/'
    ];
    urls.forEach(u => {
        const a = document.createElement('a');
        a.href = u;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
    toast('Открыто 3 магазина', 'success');
    window.ymGoal && window.ymGoal('find_cheaper', { oem: c });
}

/* ============ ЮMONEY ============ */
function copyYm() {
    const num = '410017195918895';
    const done = () => toast('📋 ЮMoney: 4100 1719 5918 895', 'success');
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(num).then(done).catch(() => fC(num, done));
    } else {
        fC(num, done);
    }
}

/* ============ PWA ============ */
function iPWA() {
    try {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#001e50"/><text x="256" y="320" font-family="Arial" font-size="200" font-weight="bold" fill="#00b0f0" text-anchor="middle">VW</text></svg>';
        const ic = 'data:image/svg+xml;base64,' + btoa(svg);
        const mf = {
            name: 'VW Polo/Caddy 6N — База Мастера', short_name: 'Polo 6N',
            description: 'Каталог запчастей 1995-2003',
            start_url: location.href.split('#')[0], scope: '.',
            display: 'standalone', orientation: 'portrait-primary',
            background_color: '#0a1830', theme_color: '#0a1830', lang: 'ru',
            icons: [
                { src: ic, sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
                { src: ic, sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
            ]
        };
        const blob = new Blob([JSON.stringify(mf)], { type: 'application/manifest+json' });
        const url = URL.createObjectURL(blob);
        const l = document.createElement('link');
        l.rel = 'manifest'; l.href = url;
        document.head.appendChild(l);
        const ai = document.createElement('link');
        ai.rel = 'apple-touch-icon'; ai.href = ic;
        document.head.appendChild(ai);
        const fav = document.createElement('link');
        fav.rel = 'icon'; fav.href = ic;
        document.head.appendChild(fav);
    } catch (e) { }
    /* Оффлайн: Service Worker кэширует оболочку и данные (см. sw.js) */
    try {
        if ('serviceWorker' in navigator && location.protocol !== 'file:') {
            navigator.serviceWorker.register('sw.js').catch(() => { });
        }
    } catch (e) { }
    window.addEventListener('online', () => toast('📶 Сеть восстановлена', 'success'));
    window.addEventListener('offline', () => toast('📴 Оффлайн: работаю на закэшированных данных', 'info'));
}

/* ============ ВНЕШНЯЯ БАЗА ОСНАЩЕНИЯ ПО VIN (data/vin-db.json) ============
   Собирается инструментом tools/vin_extract.py + tools/make_vin_db_web.py
   из офлайн-базы ETKA: VIN → мотор, КПП+код, краска, салон, дата, PR-коды.
   Если файла нет — функция молча отключена (toast/подсказки не мешают). */
const VINDB = { map: null, alt: null, pr: null, promise: null };
/* 1.10.6: 9-й символ VIN у VAG — контрольный разряд; в европейских VIN на его
   месте часто стоит filler «Z», а в дампе ETKA / на табличке машины может быть
   реальный символ. В прогоне vin-db.meta.json таких расхождений два
   (WV1ZZZ9KZ3R530555 ↔ WV1ZZZ9KJ3R530555 и WVWZZZ6NZ1Y050165 ↔ WVWZZZ6N21Y050165):
   точный поиск по Map их не находил, и карточка оставалась «пустой».
   Держим запасной индекс без 9-го символа; точное совпадение всегда
   приоритетнее, а запасное используем, только если оно единственное. */
const vinAltKey = v => (v.length === 17 ? v.slice(0, 8) + v.slice(9) : '');
function vinDbIndex(rec) {
    if (!rec || !rec.vin) return;
    const v = String(rec.vin).trim().toUpperCase();
    if (!v) return;
    if (!VINDB.map) VINDB.map = new Map();
    if (!VINDB.alt) VINDB.alt = new Map();
    VINDB.map.set(v, rec);
    const k = vinAltKey(v);
    if (!k) return;
    const list = VINDB.alt.get(k);
    if (!list) VINDB.alt.set(k, [rec]);
    else if (!list.includes(rec)) list.push(rec);
}
function vinDbLoad() {
    if (VINDB.promise) return VINDB.promise;
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    VINDB.promise = (async () => {
        try {
            let r = await fetch(base + 'data/vin-db.json', { cache: 'no-store' });
            if (!r.ok) {
                /* Боевой базы нет (локальный запуск, чистая установка): грузим
                   пример формата, чтобы «Оснащение (PR)» можно было пощупать
                   без дампа. На проде с реальным vin-db.json ветка не трогается. */
                r = await fetch(base + 'data/vin-db.example.json', { cache: 'no-store' });
                if (r.ok) VINDB.example = true;
            }
            if (r.ok) {
                const arr = await r.json();
                VINDB.map = new Map();
                VINDB.alt = new Map();
                for (const rec of arr) vinDbIndex(rec);
            }
        } catch (e) { VINDB.map = null; VINDB.alt = null; }
        /* Патч базы VIN (data/vin-db.patch.json): ручные записи — машины, которых
           нет в дампе ETKA, и точечные исправления. Грузится ВСЕГДА (даже когда
           боевой vin-db.json отсутствует) и имеет приоритет над основной базой —
           серверный vin-db.json при деплое трогать не нужно. */
        try {
            const rp = await fetch(base + 'data/vin-db.patch.json', { cache: 'no-store' });
            if (rp.ok) vinDbPatchApply(await rp.json());
        } catch (e) { /* нет патча — не страшно */ }
        try {
            const r2 = await fetch(base + 'data/pr-codes.json', { cache: 'no-store' });
            if (r2.ok) VINDB.pr = await r2.json();
        } catch (e) { VINDB.pr = null; }
        /* Русские описания PR-кодов (переопределяют английские из pr-codes.json) */
        try {
            const r3 = await fetch(base + 'data/pr-codes-ru.json', { cache: 'no-store' });
            if (r3.ok) VINDB.prRu = await r3.json();
        } catch (e) { VINDB.prRu = null; }
        return VINDB.map;
    })();
    return VINDB.promise;
}
/* Применить записи патча поверх основной базы: новые VIN добавляются,
   существующие — перезаписываются (patch приоритетнее дампа). */
function vinDbPatchApply(arr) {
    if (!Array.isArray(arr) || !arr.length) return 0;
    if (!VINDB.map) VINDB.map = new Map();
    if (!VINDB.alt) VINDB.alt = new Map();
    let n = 0;
    for (const rec of arr) {
        if (!rec || !rec.vin) continue;
        rec.patch = true;
        vinDbIndex(rec);
        n++;
    }
    VINDB.patchCount = (VINDB.patchCount || 0) + n;
    return n;
}
/* Точное совпадение → запасное (без 9-го символа), если оно единственное.
   Второй аргумент (необязательный) получает { fuzzy, vin } — по нему UI
   показывает честную пометку «найдено без учёта контрольного разряда». */
const vinDbRow = (vin, out) => {
    const v = String(vin || '').trim().toUpperCase();
    if (!v || !VINDB.map) return null;
    const hit = VINDB.map.get(v);
    if (hit) return hit;
    const k = vinAltKey(v);
    const cand = (k && VINDB.alt) ? VINDB.alt.get(k) : null;
    if (cand && cand.length === 1) {
        if (out && typeof out === 'object') { out.fuzzy = true; out.vin = String(cand[0].vin || ''); }
        return cand[0];
    }
    return null;
};
function vinDbFamilyOf(row) {
    if (!row) return '';
    const f = gearboxFamsOf(row.gearbox_code || '');
    if (f.length) return f[0];
    return row.gearbox || '';
}
function vinDbSummary(row) {
    if (!row) return '';
    const bits = [];
    if (row.engine) bits.push('мотор ' + row.engine);
    if (row.gearbox_code) bits.push('КПП ' + row.gearbox_code + (row.gearbox ? ' (' + row.gearbox + ')' : ''));
    else if (row.gearbox) bits.push('КПП ' + row.gearbox);
    if (row.paint) bits.push('краска ' + row.paint);
    if (row.prod_date) bits.push('собран ' + row.prod_date);
    return bits.join(' · ');
}
/* Цвета/оснащение из записи базы VIN.
   Поле краски в дампе ETKA — склейка «кузов+крыша+оснащение» (J2J241 = J2/J2/41):
   новые базы отдают roof_color/equip_code отдельно, старые — единым trim,
   поэтому поддерживаем оба варианта. */
function vinDbColors(row) {
    if (!row) return { paint: '', roof: '', equip: '' };
    let roof = row.roof_color || '', equip = row.equip_code || '';
    const trim = row.trim || '';
    if (!roof && trim.length >= 4) { roof = trim.slice(0, 2); equip = equip || trim.slice(2, 4); }
    else if (!roof && trim.length === 2) { roof = trim; }
    return { paint: row.paint || '', roof, equip };
}
/* Семейство КПП из записи базы: код → семейство, иначе поле gearbox,
   иначе косвенно по PR: G0C = 5-ст. МКПП (для 6N это 085). */
function vinDbFamily(row, platform) {
    if (!row) return '';
    const f = gearboxFamsOf(row.gearbox_code || '');
    if (f.length) return f[0];
    if (row.gearbox && TRANSMISSIONS[row.gearbox]) return row.gearbox;
    if (Array.isArray(row.pr) && row.pr.includes('G0C') && (platform === 'hatch' || platform === 'estate')) return '085';
    return '';
}
/* ✅ 1.10.1: автодополнение карточек гаража из базы оснащения.
   База VIN грузится асинхронно (и патч поверх неё): если машину сохранили
   до окончания загрузки — её карточка оставалась «голой» навсегда, ведь
   sGarV подтягивает оснащение только в момент сохранения. Теперь после
   загрузки vin-db.json + vin-db.patch.json проходим по гаражу и заполняем
   ПУСТЫЕ поля из записи базы (мотор/КПП/семейство/цвета/оснащение/дата).
   Пользовательские значения не перетираются. Возвращает число дополненных
   машин. */
function garSyncFromDb() {
    if (!VINDB.map || !G.length) return 0;
    let touched = 0, activeFilled = null;
    for (const g of G) {
        const dbrow = vinDbRow(g.vin);
        if (!dbrow) continue;
        let n = 0;
        const col = vinDbColors(dbrow);
        if (!g.engineCode && dbrow.engine && ENGINES[dbrow.engine]) { g.engineCode = dbrow.engine; n++; }
        if (!g.gearboxCode && dbrow.gearbox_code) { g.gearboxCode = String(dbrow.gearbox_code).toUpperCase(); n++; }
        if (!g.transCode) { const fam = vinDbFamily(dbrow, platformOf(g.body, g.model)); if (fam) { g.transCode = fam; n++; } }
        if (!g.bodyColor && col.paint) { g.bodyColor = String(col.paint).toUpperCase(); n++; }
        if (!g.roofColor && col.roof) { g.roofColor = String(col.roof).toUpperCase(); n++; }
        if (!g.equipCode && col.equip) { g.equipCode = String(col.equip).toUpperCase(); n++; }
        if (!g.prodDate && dbrow.prod_date) { g.prodDate = dbrow.prod_date; n++; }
        if (n) {
            touched++;
            if (SV.activeVinId === g.id) activeFilled = g;
        }
    }
    if (touched) {
        sG(); rGar();
        if (activeFilled) {
            applyVinFilters();
            sU(); rSB(); rTOWidget(); rC();
            toast('📦 Карточка …' + activeFilled.vin.slice(-6) + ' дополнена из базы оснащения: ' + (vinDbSummary(vinDbRow(activeFilled.vin)) || 'данные подтянуты'), 'success');
        }
    }
    return touched;
}

/* ============ РЕДАКТОР VIN ============ */
function oVIN() {
    const av = gAV();
    if (!av || !av.ok) { toast('VIN не выбран', 'danger'); return; }
    vinEdId = av.id;
    const engSel = $('v_engine');
    let eo = '<option value="">— не указан —</option>';
    Object.keys(ENGINE_FAMILIES).forEach(fam => {
        const codes = ENGINE_FAMILIES[fam].codes.filter(k => ENGINES[k]);
        if (!codes.length) return;
        eo += '<optgroup label="' + escA(ENGINE_FAMILIES[fam].label) + '">'
            + codes.map(k => '<option value="' + k + '">' + k + ' — ' + ENGINES[k].v + ' ' + ENGINES[k].hp + ' л.с.</option>').join('')
            + '</optgroup>';
    });
    engSel.innerHTML = eo;
    const trnSel = $('v_trans');
    trnSel.innerHTML = '<option value="">— не указано —</option>'
        + Object.keys(TRANSMISSIONS).map(k => '<option value="' + k + '">' + TRANSMISSIONS[k] + '</option>').join('');
    $('v_model').value = av.model || '';
    $('v_proddate').value = av.prodDate || '';
    $('v_year').value = av.year || '';
    $('v_engine').value = av.engineCode || '';
    $('v_trans').value = av.transCode || '';
    $('v_gearbox').value = av.gearboxCode || '';
    // Пустые поля подсказывает внешняя база оснащения по VIN
    const dbrow = vinDbRow(av.vin);
    if (dbrow) {
        const col = vinDbColors(dbrow);
        if (!$('v_engine').value && dbrow.engine && ENGINES[dbrow.engine]) $('v_engine').value = dbrow.engine;
        if (!$('v_gearbox').value && dbrow.gearbox_code) $('v_gearbox').value = String(dbrow.gearbox_code).toUpperCase();
        if (!$('v_trans').value) { const fam = vinDbFamily(dbrow, platformOf(av.body, av.model)); if (fam && TRANSMISSIONS[fam]) $('v_trans').value = fam; }
        if (!$('v_bodycolor').value && col.paint) $('v_bodycolor').value = String(col.paint).toUpperCase();
        if (!$('v_roofcolor').value && col.roof) $('v_roofcolor').value = String(col.roof).toUpperCase();
        if (!$('v_equip').value && col.equip) $('v_equip').value = String(col.equip).toUpperCase();
        if (!$('v_proddate').value && dbrow.prod_date) $('v_proddate').value = dbrow.prod_date;
    }
    // Каскад: мотор сужает семейства и коды КПП (сохранённые значения не теряются)
    refreshTransForEngine();
    updEngHint();
    $('v_equip').value = av.equipCode || '';
    $('v_bodycolor').value = av.bodyColor || '';
    $('v_roofcolor').value = av.roofColor || '';
    /* Поколение и комплектация: вручную + автоподстановка поколения по VIN */
    const genSel = $('v_gen');
    if (genSel) {
        genSel.innerHTML = '<option value="">— неизвестно —</option>'
            + Object.keys(GENERATIONS).map(k => '<option value="' + escA(k) + '">' + esc(GENERATIONS[k]) + '</option>').join('')
            + '<option value="6V">6V — Classic/Variant (платформа 6K)</option>'
            + '<option value="9K">9K — Caddy</option><option value="9U">9U — Caddy Pickup</option>';
        genSel.value = av.gen || '';
        if (!genSel.value) { const dd = vD(av.vin); if (dd && dd.ok && dd.gen) genSel.value = dd.gen; }
    }
    const trimSel = $('v_trim');
    if (trimSel) {
        trimSel.innerHTML = '<option value="">— неизвестно —</option>' + TRIMS.map(x => '<option value="' + escA(x) + '">' + esc(x) + '</option>').join('');
        trimSel.value = av.trim || '';
    }
    lafBindPickers();
    openM('vinmo');
}

/* ============ ВЫБОР ЦВЕТА КУЗОВА (LAF) ============
   Живой образец цвета рядом с полем + кнопка 🎨, открывающая
   справочник всех кодов с превью. Значение поля остаётся
   свободным — можно ввести любой код, даже неизвестный. */
function lafPickerHtml() {
    let h = '<input type="text" class="laf-search" placeholder="🔍 Код или название…" autocomplete="off" spellcheck="false" oninput="lafFilter(this)">';
    h += '<div class="laf-list">';
    Object.keys(LAF_COLORS).sort((a, b) => LAF_COLORS[a].ru.localeCompare(LAF_COLORS[b].ru, 'ru')).forEach(k => {
        const c = LAF_COLORS[k];
        const s = nz(k + ' ' + c.ru + ' ' + c.name + ' ' + (c.aka || []).join(' '));
        h += '<button type="button" class="laf-item" data-laf="' + escA(k) + '" data-s="' + escA(s) + '">'
            + '<span class="laf-sw" style="background:' + c.hex + '"></span>'
            + '<span class="laf-code">' + esc(k) + '</span>'
            + '<span class="laf-name">' + esc(c.ru) + '</span></button>';
    });
    h += '</div>';
    return h;
}
function lafFilter(el) {
    const q = nz(el.value);
    const box = el.closest('.laf-pop');
    if (!box) return;
    box.querySelectorAll('.laf-item').forEach(it => {
        it.style.display = (!q || String(it.dataset.s || '').includes(q)) ? '' : 'none';
    });
}
function lafBindPickers() {
    lafBindPicker('v_bodycolor', 'v_bodycolor_sw', 'v_bodycolor_btn', 'v_bodycolor_pop');
    lafBindPicker('v_roofcolor', 'v_roofcolor_sw', 'v_roofcolor_btn', 'v_roofcolor_pop');
}
function lafBindPicker(inpId, swId, btnId, popId) {
    const inp = $(inpId), sw = $(swId), btn = $(btnId), pop = $(popId);
    if (!inp || !pop) return;
    if (!pop.innerHTML) pop.innerHTML = lafPickerHtml();
    const upd = () => {
        const c = lafColor(inp.value);
        if (sw) {
            sw.style.background = c ? c.hex : 'transparent';
            sw.classList.toggle('on', !!c);
            sw.classList.toggle('unk', !c && !!inp.value.trim());
            sw.title = c ? c.ru + ' · ' + c.name : (inp.value.trim() ? 'Код не найден в справочнике' : 'Код цвета');
        }
        const hint = $(inpId + '_hint');
        if (hint) hint.textContent = c ? c.ru + ' (' + c.name + ')' + (c.aka && c.aka.length ? ' · ' + c.aka.slice(0, 2).join('/') : '') : '';
    };
    if (!inp._lafBound) {
        inp._lafBound = true;
        inp.addEventListener('input', upd);
        if (btn) btn.addEventListener('click', e => {
            e.stopPropagation(); e.preventDefault();
            const willOpen = !pop.classList.contains('show');
            document.querySelectorAll('.laf-pop.show').forEach(p => p.classList.remove('show'));
            if (willOpen) {
                pop.classList.add('show');
                const s = pop.querySelector('.laf-search'); if (s) { s.value = ''; lafFilter(s); s.focus(); }
            }
        });
        pop.addEventListener('click', e => {
            const it = e.target.closest('.laf-item');
            if (it) {
                inp.value = it.dataset.laf;
                upd();
                pop.classList.remove('show');
                return;
            }
            e.stopPropagation(); // клики внутри попапа не закрывают его
        });
    }
    upd();
}
/* Закрытие всех попапов палитры по клику вне */
document.addEventListener('click', () => {
    document.querySelectorAll('.laf-pop.show').forEach(p => p.classList.remove('show'));
});

/* Платформа текущей редактируемой машины (hatch/estate/classic/caddy) */
function vinPlatform() {
    const g = G.find(x => x.id === vinEdId) || {};
    const vm = $('v_model') ? $('v_model').value : '';
    return platformOf(g.body, [g.model || '', vm].join(' '));
}

/* Подсказка по двигателю: семейство, объём, мощность, справка */
function updEngHint() {
    const hint = $('v_eng_hint'); if (!hint) return;
    const code = $('v_engine') ? $('v_engine').value : '';
    if (!code) {
        hint.innerHTML = 'ℹ️ Код двигателя — из СТС, наклейки в багажнике или сервисной книжки. Моторы сгруппированы по семействам (EA111 и др.); при выборе список КПП сузится до ставившихся с ним.';
        return;
    }
    const fam = engineFamOf(code), e = ENGINES[code] || {};
    let h = '<b>⚙️ ' + esc(code) + '</b>';
    if (e.v) h += ' — ' + esc(e.v) + ', ' + e.hp + ' л.с.' + (e.f === 'D' ? ', дизель' : ', бензин');
    if (fam && ENGINE_FAMILIES[fam]) {
        h += '<br>🧬 Семейство: <b>' + esc(fam) + '</b> · ' + esc(ENGINE_FAMILIES[fam].label);
        if (ENGINE_FAMILIES[fam].note) h += '<br>' + esc(ENGINE_FAMILIES[fam].note);
    }
    hint.innerHTML = h;
}

/* Каскад «мотор → семейства КПП»: перестраивает select семейств,
   сохраняя текущий выбор (если он не подходит — остаётся с пометкой ⚠) */
function refreshTransForEngine() {
    const trnSel = $('v_trans'), engSel = $('v_engine');
    if (!trnSel || !engSel) return;
    const info = gearboxForEngine(engSel.value, vinPlatform());
    const cur = trnSel.value;
    const keys = info.fams.length ? info.fams.filter(k => TRANSMISSIONS[k]) : Object.keys(TRANSMISSIONS);
    let opts = '<option value="">— не указано —</option>';
    keys.forEach(k => { opts += '<option value="' + k + '">' + esc(TRANSMISSIONS[k]) + '</option>'; });
    if (cur && !keys.includes(cur)) {
        opts += '<option value="' + cur + '">⚠ ' + esc(TRANSMISSIONS[cur] || cur) + ' (с этим мотором не значится)</option>';
    }
    trnSel.innerHTML = opts;
    if (cur) trnSel.value = cur;
    refreshGbCodeOptions();
    updGbHint();
}

/* Каскад «мотор/семейство → буквенные коды» для datalist v_gb_codes.
   Приоритет: проверенные коды под мотор (с учётом семейства) →
   коды выбранного семейства → коды семейств мотора → все. */
function refreshGbCodeOptions() {
    const engSel = $('v_engine'), trnSel = $('v_trans');
    const famSel = trnSel ? trnSel.value : '';
    const eng = engSel ? engSel.value : '';
    const info = gearboxForEngine(eng, vinPlatform());
    // 1) Проверенные коды под мотор (семейство не выбрано или совместимо)
    if (eng && info.codes.length && (!famSel || info.fams.includes(famSel))) {
        const codes = famSel ? info.codes.filter(c => gearboxFamsOf(c).includes(famSel)) : info.codes;
        if (codes.length) { fillGearboxDatalist('v_gb_codes', { codes }); return; }
        // под пару «мотор+семейство» проверенных кодов нет — ниже покажем коды семейства
    }
    // 2) Явно выбранное семейство с базой кодов
    if (famSel && GEARBOX[famSel]) { fillGearboxDatalist('v_gb_codes', { fams: [famSel] }); return; }
    // 3) Семейство без базы буквенных кодов (АКПП, 020/02K)
    if (famSel && TRANSMISSIONS[famSel]) { fillGearboxDatalist('v_gb_codes', { codes: [] }); return; }
    // 4) Объединение кодов семейств мотора
    if (info.fams.length) { fillGearboxDatalist('v_gb_codes', { fams: info.fams }); return; }
    // 5) Всё известное
    fillGearboxDatalist('v_gb_codes', {});
}

/* Подсказка: что ставилось с мотором + справка по введённому коду */
function updGbHint() {
    const hint = $('v_gb_hint'); if (!hint) return;
    const eng = $('v_engine') ? $('v_engine').value : '';
    const info = gearboxForEngine(eng, vinPlatform());
    let h = '';
    if (eng && info.fams.length) {
        h += '⚙️ С мотором <b>' + esc(eng) + '</b> ставили: ' + esc(info.fams.map(f => TRANSMISSIONS[f] || f).join(', '));
        if (info.codes.length) {
            h += '<br>📋 Проверенные коды: <b>' + info.codes.map(esc).join('</b>, <b>') + '</b>';
        }
    } else if (eng) {
        h += '⚙️ <b>' + esc(eng) + '</b>: данных по сочетаемости нет — показан полный список КПП';
    }
    const code = normGb($('v_gearbox').value);
    if (code !== 'all') {
        const gi = gearboxInfo(code);
        if (h) h += '<br>';
        h += '🔤 <b>' + esc(code) + '</b> → ';
        if (gi.fams.length) {
            h += esc(gi.fams.map(f => TRANSMISSIONS[f] || f).join(' / '));
            if (gi.fams.length > 1) h += ' <span style="color:var(--wn)">⚠ код встречается в двух семействах — уточни семейство выше</span>';
        } else {
            h += '<span style="color:var(--wn)">⚠ код не найден в базе</span>';
        }
        if (gi.special) h += '<br>📌 ' + esc(gi.special);
        else if (gi.note) h += '<br>' + esc(gi.note);
        if (eng && info.codes.length) {
            h += info.codes.includes(code)
                ? '<br><span style="color:var(--ok)">✔ Значится в справочнике для мотора ' + esc(eng) + '</span>'
                : '<br><span style="color:var(--wn)">⚠ В справочнике для мотора ' + esc(eng) + ' не значится — сверьте с ETKA/наклейкой</span>';
        }
    } else if (!h) {
        h = 'ℹ️ Буквенный код КПП выбит на корпусе коробки и на наклейке в багажнике (например CHL, DXB, FFU). Выбери двигатель — список КПП сузится до ставившихся с ним.';
    }
    hint.innerHTML = h;
}

/* Ввод буквенного кода: подсказка + авто-вывод семейства */
function onGbCodeInput() {
    updGbHint();
    const inp = $('v_gearbox'), sel = $('v_trans');
    if (!inp || !sel) return;
    const code = normGb(inp.value);
    if (code === 'all') return;
    const fams = gearboxFamsOf(code);
    // Авто-подставляем семейство, если оно пустое или код ему явно противоречит
    if (fams.length && !fams.includes(sel.value)) {
        sel.value = fams[0];
        refreshGbCodeOptions();
    }
}
const cVIN = () => { closeM('vinmo'); vinEdId = null; };
function sVIN() {
    if (pubGuard()) return;
    if (!vinEdId) return;
    const g = G.find(x => x.id === vinEdId);
    if (!g) return;
    g.model = $('v_model').value.trim();
    g.prodDate = $('v_proddate').value || '';
    const yv = $('v_year').value;
    g.year = yv ? Number(yv) : null;
    g.engineCode = $('v_engine').value || '';
    g.transCode = $('v_trans').value || '';
    g.gearboxCode = normGb($('v_gearbox').value) === 'all' ? '' : normGb($('v_gearbox').value);
    // Если семейство не выбрано, но код известный — выводим семейство из кода
    if (!g.transCode && g.gearboxCode) {
        const fs = gearboxFamsOf(g.gearboxCode);
        if (fs.length) g.transCode = fs[0];
    }
    g.equipCode = $('v_equip').value.trim();
    g.gen = $('v_gen') ? $('v_gen').value : '';
    g.trim = $('v_trim') ? $('v_trim').value : '';
    g.bodyColor = $('v_bodycolor').value.trim().toUpperCase();
    g.roofColor = $('v_roofcolor').value.trim().toUpperCase();
    // Мягкая проверка: код не из справочника для выбранного мотора — не ошибка, но повод сверить
    if (g.engineCode && g.gearboxCode) {
        const gi = gearboxForEngine(g.engineCode, platformOf(g.body, g.model));
        if (gi.codes.length && !gi.codes.includes(g.gearboxCode)) {
            toast('⚠ Код ' + g.gearboxCode + ' не значится в справочнике для ' + g.engineCode + ' — сверьте с ETKA', 'info');
        }
    }
    applyVinFilters();
    sG();
    rGar();
    rSB();
    rC();
    cVIN();
    toast('Данные сохранены', 'success');
}

/* ============ МОДАЛКА ОСНАЩЕНИЯ (PR) ИЗ БАЗЫ VIN ============
   PR-коды группируются по первой цифре/букве (классификатор VAG):
   0 — шасси/подвеска, 1 — тормоза, 2 — выхлоп/топливо, 3 — салон,
   4 — электрика, 5 — кузов, 6 — оптика, 7 — аудио, 8 — электрооборудование,
   9 — климат, буквы — спецоснащение/маркетинговые коды. */
const PR_CATEGORIES = {
    '0': { icon: '🛞', label: 'Шасси и подвеска' },
    '1': { icon: '🛑', label: 'Тормоза' },
    '2': { icon: '💨', label: 'Выхлоп и топливо' },
    '3': { icon: '🪑', label: 'Салон и оснащение' },
    '4': { icon: '⚡', label: 'Электрика' },
    '5': { icon: '🚗', label: 'Кузов и стёкла' },
    '6': { icon: '💡', label: 'Оптика и освещение' },
    '7': { icon: '📻', label: 'Аудио и связь' },
    '8': { icon: '🔌', label: 'Электрооборудование' },
    '9': { icon: '❄️', label: 'Климат и отопление' },
    '_': { icon: '🏷️', label: 'Спецоснащение / маркетинг' }
};
const PR_CAT_ORDER = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '_'];
function prCategoryOf(code) {
    const ch = String(code || '').trim().charAt(0).toUpperCase();
    return PR_CATEGORIES[ch] ? ch : '_';
}
function oPR(gid) {
    const g = (gid && G.find(x => x.id === gid)) || gAV();
    if (!g) { toast('VIN не выбран — добавьте машину в гараж', 'danger'); return; }
    const _vmeta = {};                    // { fuzzy, vin } — см. vinDbRow (1.10.6)
    const row = vinDbRow(g.vin, _vmeta);
    if (!row) { toast('Этого VIN нет в базе оснащения', 'info'); return; }
    const hasEquip = !!(row.engine || row.gearbox || row.gearbox_code || row.paint || row.prod_date || (Array.isArray(row.pr) && row.pr.length));
    if (!hasEquip) {
        /* VIN есть в фильтрованном списке дампа ETKA, но запись «пустая».
           Вместо тупика показываем всё, что известно: декодирование самого
           VIN (модель/год/завод/серия) + то, что пользователь указал в гараже,
           и быстрые действия. */
        const d = vD(g.vin);
        let h = '<div class="gb-hint">VIN <b>' + esc(g.vin) + '</b> найден в базе (дамп ETKA), но оснащение в записи пока не извлечено.</div>';
        const rows = [];
        if (d && d.ok) {
            rows.push(['Модель по VIN', [d.model, d.gen ? '(' + d.gen + ')' : ''].filter(Boolean).join(' ')]);
            if (d.year) rows.push(['Год выпуска', String(d.year) + ' (буква года «' + String(g.vin).charAt(9) + '»)']);
            if (d.plant) rows.push(['Завод', d.plant + (d.plantCountry ? ' (' + d.plantCountry + ')' : '')]);
            if (d.serial) rows.push(['Серийный №', d.serial + '-й с конвейера']);
            if (d.note) rows.push(['Примечание', d.note]);
        }
        if (g.engineCode) rows.push(['Мотор (из гаража)', g.engineCode + (ENGINES[g.engineCode] ? ' — ' + ENGINES[g.engineCode].v + ' ' + ENGINES[g.engineCode].hp + ' л.с.' : '')]);
        if (g.transCode || g.gearboxCode) rows.push(['КПП (из гаража)', [g.transCode, g.gearboxCode].filter(Boolean).join(' / ')]);
        const colB = lafColor(g.bodyColor);
        if (g.bodyColor) rows.push(['Цвет (из гаража)', colB ? colB.ru + ' (' + g.bodyColor + ')' : g.bodyColor]);
        if (g.prodDate) rows.push(['Дата производства (из гаража)', g.prodDate]);
        h += '<div class="pr-empty-box"><div class="pr-empty-h">🔎 Что известно об этой машине</div>';
        if (rows.length) rows.forEach(r => { h += '<div class="pr-empty-row"><span class="pr-empty-k">' + esc(r[0]) + '</span><span class="pr-empty-v">' + esc(r[1]) + '</span></div>'; });
        else h += '<div class="pr-empty-row"><span class="pr-empty-v">Пока ничего — уточните данные вручную.</span></div>';
        h += '</div>';
        h += '<div class="pr-empty-actions">'
            + '<button class="bn p" type="button" onclick="cPR();oVIN()">✎ Уточнить данные</button>'
            + '<button class="bn" type="button" onclick="cPR();showPlateLocation(\'' + escA(g.id) + '\')">📍 Где коды</button>'
            + '<button class="bn" type="button" onclick="cPR();showVinQR(\'' + escA(g.id) + '\')">📱 QR-код</button>'
            + '</div>';
        if (_vmeta.fuzzy) h += '<p class="pr-note">🔎 Запись найдена без учёта 9-го символа VIN (контрольный разряд): в базе этот автомобиль хранится как <b>' + esc(_vmeta.vin) + '</b>.</p>';
        h += '<p class="pr-note">Полное оснащение (мотор, КПП, краска, PR-коды) появится здесь после генерации <b>data/vin-db.json</b> из исходных файлов дампа — инструкция в <b>vin-dump/README.md</b>. Мотор и КПП можно указать вручную («✎ Уточнить данные») — каталог и списки ТО сразу сузятся под эту машину.</p>';
        $('prmo_body').innerHTML = h;
        $('prmo_title').textContent = '📋 Оснащение · …' + g.vin.slice(-6);
        openM('prmo');
        return;
    }
    let h = '<div class="gb-hint">' + esc(vinDbSummary(row) || 'Данных об оснащении нет') + '</div>';
    if (_vmeta.fuzzy) h += '<p class="pr-note">🔎 Совпадение без учёта 9-го символа VIN (контрольный разряд): в базе — <b>' + esc(_vmeta.vin) + '</b>.</p>';
    const prs = (Array.isArray(row.pr) ? row.pr : []).map(c => String(c || '').trim().toUpperCase()).filter(Boolean);
    if (prs.length) {
        /* Группировка по категориям */
        const groups = {};
        prs.forEach(c => { const k = prCategoryOf(c); (groups[k] = groups[k] || []).push(c); });
        Object.keys(groups).forEach(k => groups[k].sort());
        const order = PR_CAT_ORDER.filter(k => groups[k] && groups[k].length);
        h += '<div class="pr-toolbar"><input type="text" class="pr-filter" id="prFilter" placeholder="🔍 Фильтр по коду или описанию…" autocomplete="off" spellcheck="false">'
            + '<div class="pr-toolbar-btns"><button type="button" class="bn" onclick="prToggleAll(true)">Развернуть все</button>'
            + '<button type="button" class="bn" onclick="prToggleAll(false)">Свернуть все</button></div></div>';
        h += '<div class="pr-groups">';
        order.forEach(k => {
            const cat = PR_CATEGORIES[k];
            const codes = groups[k];
            const openAttr = order.length <= 4 ? ' open' : '';
            h += '<details class="pr-group"' + openAttr + ' data-prg><summary class="pr-group-header">'
                + '<span class="pr-cat-ico">' + cat.icon + '</span><span>' + esc(cat.label) + '</span>'
                + '<span class="pr-count">' + codes.length + '</span></summary><div class="pr-group-body">';
            codes.forEach(c => {
                const desc = (VINDB.prRu && VINDB.prRu[c]) || (VINDB.pr && VINDB.pr[c]) || '';
                const search = nz(c + ' ' + desc);
                h += '<div class="pr-row' + (desc ? '' : ' unknown') + '" data-prs="' + escA(search) + '">'
                    + '<span class="pr-code">' + esc(c) + '</span>'
                    + '<span class="pr-desc">' + (desc ? esc(desc) : 'описание не найдено') + '</span></div>';
            });
            h += '</div></details>';
        });
        h += '</div>';
        h += '<p class="pr-note">💡 Классификация по первой цифре PR-кода ориентировочная: у VAG один блок может содержать коды разного назначения.</p>';
        if (VINDB.example) h += '<p class="pr-note">ℹ️ Загружен пример данных (data/vin-db.example.json), а не боевая база оснащения.</p>';
        if (row.patch) h += '<p class="pr-note">🩹 Запись добавлена вручную (data/vin-db.patch.json) — этого VIN не было в дампе ETKA.</p>';
    } else {
        h += '<p style="font-size:.8rem;color:var(--mu)">PR-кодов в записи нет.</p>';
    }
    $('prmo_body').innerHTML = h;
    $('prmo_title').textContent = '📋 Оснащение · …' + g.vin.slice(-6) + ' (' + prs.length + ' кодов)';
    openM('prmo');
    /* Живой фильтр по группам */
    const inp = $('prFilter');
    if (inp) {
        inp.addEventListener('input', () => {
            const q = nz(inp.value);
            $('prmo_body').querySelectorAll('[data-prg]').forEach(gr => {
                let visible = 0;
                gr.querySelectorAll('.pr-row').forEach(r => {
                    const ok = !q || String(r.dataset.prs || '').includes(q);
                    r.style.display = ok ? '' : 'none';
                    if (ok) visible++;
                });
                gr.style.display = visible ? '' : 'none';
                if (q && visible) gr.open = true;
            });
        });
    }
}
function prToggleAll(open) {
    $('prmo_body').querySelectorAll('[data-prg]').forEach(gr => { if (gr.style.display !== 'none') gr.open = open; });
}
function cPR() { closeM('prmo'); }

/* ============ SKELETON ============ */
function showSkeleton() {
    const ar = $('ca');
    if (!ar) return;
    let h = '<div class="gr">';
    for (let i = 0; i < 6; i++) {
        h += '<div class="sk-card">' +
            '<div class="skeleton sk-line w70"></div>' +
            '<div class="skeleton sk-line w40"></div>' +
            '<div class="skeleton sk-line w90"></div>' +
            '<div class="skeleton sk-line w40"></div>' +
            '</div>';
    }
    h += '</div>';
    ar.innerHTML = h;
}

/* ============ КОНФЕТТИ ============ */
function confetti() {
    const canvas = $('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.classList.add('show');
    const colors = ['#00a8e8', '#38bdf8', '#3ecf7e', '#fbbf24', '#e63946', '#8b5cf6', '#ec4899'];
    const pieces = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
        pieces.push({
            x: canvas.width / 2 + (Math.random() - .5) * 200,
            y: canvas.height * 0.35,
            vx: (Math.random() - .5) * 12,
            vy: -Math.random() * 14 - 4,
            g: 0.4,
            w: 6 + Math.random() * 6,
            h: 8 + Math.random() * 6,
            color: colors[(Math.random() * colors.length) | 0],
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - .5) * .3,
            life: 1
        });
    }
    let frame = 0;
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = 0;
        for (const p of pieces) {
            if (p.life <= 0) continue;
            alive++;
            p.vy += p.g;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= .99;
            p.rot += p.vrot;
            if (p.y > canvas.height * 0.9) p.life -= .04;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
        frame++;
        if (alive > 0 && frame < 180) requestAnimationFrame(tick);
        else {
            canvas.classList.remove('show');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    tick();
}

/* ============ ПЛАШКА «ЧТО НОВОГО» ============ */
function _setChangelog(list) {
    if (Array.isArray(list)) _changelogCache = list;
}
function checkWhatsNew(defer) {
    let lastSeen = '';
    try { lastSeen = localStorage.getItem(WNKEY) || ''; } catch (e) { }
    const first = !lastSeen;
    if (first) {
        /* Первый запуск: плашка «Что нового» — шаг 3 схемы,
           выпускается после закрытия путеводителя (releasePendingWhatsNew). */
        if (defer) { _wnPending = true; return; }
        try { localStorage.setItem(WNKEY, APP_VERSION); } catch (e) { }
        return;
    }
    if (lastSeen === APP_VERSION) return;
    // Обновление версии: если путеводитель ещё не показан — плашка ждёт его закрытия
    if (defer) { _wnPending = true; return; }
    const rec = _changelogCache.find(r => r && String(r.version) === String(APP_VERSION));
    const changes = rec && Array.isArray(rec.changes) ? rec.changes.slice(0, 5) : [];
    showWhatsNew(APP_VERSION, changes);
}
/* Шаг 3 схемы «лицензия → FAQ → что нового»: выпустить отложенную плашку */
function releasePendingWhatsNew() {
    if (!_wnPending) return;
    _wnPending = false;
    try { localStorage.setItem(WNKEY, APP_VERSION); } catch (e) { }
    const rec = _changelogCache.find(r => r && String(r.version) === String(APP_VERSION));
    const changes = rec && Array.isArray(rec.changes) ? rec.changes.slice(0, 5) : [];
    showWhatsNew(APP_VERSION, changes);
}
function showWhatsNew(version, changes) {
    const el = $('whatsnew');
    if (!el) return;
    let h = '';
    h += '<div class="wn-head">';
    h += '<span class="wn-icon">🎉</span>';
    h += '<span class="wn-title">Что нового в v' + esc(version) + '</span>';
    h += '<button class="wn-close" onclick="closeWhatsNew(true)" title="Закрыть">✕</button>';
    h += '</div>';
    if (changes.length) {
        h += '<ul class="wn-list">';
        for (const c of changes) h += '<li>' + esc(c) + '</li>';
        h += '</ul>';
    } else {
        h += '<div class="wn-empty">Приложение обновлено до v' + esc(version) +
            '. Полный список изменений — в разделе «История версий».</div>';
    }
    h += '<div class="wn-foot">';
    h += '<button class="bn" onclick="closeWhatsNew(true)">Понятно</button>';
    h += '<button class="bn p" onclick="openWhatsNewDetails()">Подробнее</button>';
    h += '</div>';
    el.innerHTML = h;
    el.classList.add('show');
}
function closeWhatsNew(markSeen) {
    const el = $('whatsnew');
    if (!el) return;
    el.classList.remove('show');
    if (markSeen) {
        try { localStorage.setItem(WNKEY, APP_VERSION); } catch (e) { }
    }
}
function openWhatsNewDetails() {
    closeWhatsNew(true);
    oUp();
}

/* ============ FAQ ============ */
function oFaq() { openM('faqmo'); }

/* ============ ОБУЧЕНИЕ ПРИ ПЕРВОМ ЗАПУСКЕ ============
   После принятия лицензии (самый первый запуск на устройстве)
   автоматически открываем FAQ-путеводитель: человек видит, какие
   кнопки зачем, до того как начнёт работать с базой. Показываем
   один раз — факт показа запоминаем в ONBKEY. */
function maybeShowOnboarding() {
    let seen = '';
    try { seen = localStorage.getItem(ONBKEY) || ''; } catch (e) { }
    if (seen) return false;
    try { localStorage.setItem(ONBKEY, APP_VERSION); } catch (e) { }
    _onbPending = true;
    setTimeout(() => {
        if (!licAppReady) return;
        oFaq();
        toast('👋 Это быстрый путеводитель по базе. Закройте его, когда изучите — он вернётся в меню ⚙️ → «Помощь»', 'info');
    }, 900);
    return true;
}
function cFaq() {
    closeM('faqmo');
    /* Схема первого запуска: закрыли путеводитель (шаг 2) →
       выпускаем плашку «Что нового» (шаг 3), дав окну закрыться. */
    if (_onbPending) {
        _onbPending = false;
        setTimeout(releasePendingWhatsNew, 450);
    }
}

/* ============ INIT ============ */
async function init() {
    if (licAppReady) return;
    licAppReady = true;
    showSkeleton();
    await lAll();
    aTh();
    aSS();
    rGar();
    applyVinFilters();
    rSB();
    rC();
    renderProfile();
    bindUI();
    updSearchSuggest();
    rTOWidget();
    fireToReminder();
    iPWA();
    fCS();
    /* Схема первого запуска: 1) лицензия (гейт до init), 2) путеводитель FAQ,
       3) плашка «Что нового» — выпускается после закрытия путеводителя. */
    const onb = maybeShowOnboarding();
    checkWhatsNew(onb);
    // Внешняя база оснащения по VIN грузится асинхронно и не блокирует старт.
    // ✅ 1.10.1: когда база (+патч) загрузилась — дополняем пустые карточки
    // гаража (мотор/КПП/цвета/дата), чтобы карточка второй машины была не
    // хуже первой, даже если VIN сохранили до окончания загрузки.
    vinDbLoad().then(() => { try { garSyncFromDb(); } catch (e) { console.warn('garSyncFromDb', e); } }).catch(() => { });
    // Диплинк из URL (#/part/…, #/cat/…, #/vin/…, #/maint/…)
    routeHash();
    _hashReady = true;
}
/* ====== НОВЫЕ КНОПКИ КАРТОЧКИ VIN ======
   Расходники под VIN: мотор + КПП (семейство и буквенный код) + кузов.
   В список попадают ТОЛЬКО настоящие расходники ТО — то, что меняется при
   регламентном обслуживании: фильтры, жидкости/масла/смазки, пробка и болт
   поддона (с шайбой), герметики и фиксаторы резьбы, ремни и ролики (ГРМ),
   колодки/диски/барабаны, свечи, щётки.
   Крепёж (болт/гайка/шайба…), ремонтные запчасти (суппорт/цилиндр/
   радиатор/сальник…) и прочая база НЕ вываливаются — только по кнопке
   «🗂 Вся база под VIN». */
const MAINT_GROUPS = [
    { id: 'filters', icon: '🌀', label: 'Фильтры', re: /фильтр/i },
    { id: 'fluids', icon: '🛢️', label: 'Жидкости, масла и смазки', re: /масл|антифриз|тосол|охлажд|жидкост|смазк|омывател|дистилл|трансмиссион|гидравлич|\batf\b|\bdot\s?\d|\bg\s?0\d/i },
    { id: 'drainplug', icon: '🔩', label: 'Пробка и шайба поддона', re: null },
    { id: 'sealants', icon: '🧴', label: 'Герметики и фиксаторы', re: null },
    { id: 'belts', icon: '➰', label: 'Ремни, ролики, ГРМ', re: /ремн|ремень|грм|ролик|натяжител|демпфер|помп(?!.*топлив)|водян.{0,8}насос|насос\s+(водян|охлажд)/i },
    { id: 'brakes', icon: '🛑', label: 'Тормоза', re: /колодк|тормозн|барабан/i },
    { id: 'plugs', icon: '🔥', label: 'Свечи и провода зажигания', re: /свеч|высоковольтн|провод[а-яё]*\s+зажиган/i },
    { id: 'wipers', icon: '🌧️', label: 'Щётки стеклоочистителя', re: /щётк|щетк|дворник|стеклоочист/i },
    { id: 'reglament', icon: '📋', label: 'Регламент ТО — прочее', re: null }
];
/* Первое слово — метиз или ремонтная запчасть: точно не расходник */
const MAINT_JUNK_LEAD_RE = /^(болт|гайк|шайб|шпильк|винт|саморез|заклёпк|заклепк|шплинт|скоб|хомут|подшипник|сальник|прокладк|уплотнит|уплотнени|колпач[ко]|вкладыш|цилиндр|суппорт|шланг|труб[ко]|трубопровод|радиатор|бач[ко]|форсунк|датчик|амортизатор|пружин|рычаг|стойк|тяг|наконечник|шрус|пыльник|сайлент|клапан|поршн|кольц|генератор|стартер|компрессор|аккумулятор|лампа|лампочк|предохранит|трос|кронштейн|опор|подушк|втулк|обойм|шток|золотник|маслосъёмн|маслосъемн|маслоотраж|патрубок|термостат|ступиц|жгут|фланец|поводок|штуцер|щуп|шкив|кожух|адсорбер|корпус|заглушк|защёлк|защелк|проставк|пал[еь]ц|реле|успокоител|маслоуловител|маслоприёмн|маслоприемн|маслоотделит|корректор|распорн|ползун|манжет|несущ|инерцион|разъём|разъем|мотор-насос|роликоподшипник|глушител|электродвигател)/i;
/* Ремонтные слова в любом месте названия. Исключения для подшипника —
   только настоящие ролики/натяжители ГРМ («роликовый подшипник» и
   «роликоподшипник» — ремонт). «Поддон», «трубка», «крышка», «безопасность»
   и т.п. — ремонт, хотя и содержат «масл»/«ремн»; сливная пробка, болт
   поддона и герметики спасаются явным ТО-пре-чеком в maintClassOf. */
const MAINT_JUNK_ANY_RE = /шланг|суппорт|цилиндр|колпач[ко]|маслосъёмн|маслосъемн|маслоотраж|вкладыш|сальник|прокладк|уплотнител|уплотнени|манжет|радиатор|бач[ко]|патрубок|термостат|датчик|лямбда|ступиц|шрус|пыльник|сайлент[-\s]?блок|амортизатор|тормозн.{0,8}труб[ко]|труб[ко]|трубопровод|подшипник|поддон|маслян[а-яё]{0,6}\s+насос|насос\s+маслян|мотор-насос|насос[а-яё]*\s+омывател|омывател[а-яё]*\s+(мотор|насос)|жгут|фланец|поводок|штуцер|щуп|шкив|кожух|адсорбер|корпус|заглушк|защёлк|защелк|проставк|пал[еь]ц|реле|успокоител|маслоуловител|маслоприёмн|маслоприемн|маслоотделит|корректор|распорн|ползун|несущ|инерцион|пульсаци|глушител|разъём|разъем|соединител|блок\s+управлен|безопасн|крепёж|крепеж|рычаг|клапан|крышк|щётк[а-яё]*\s+генератор|генератор[а-яё]*\s+щётк|регулятор[а-яё]*\s+тормозн|тормозн[а-яё]*\s+(сил|лент)|главн[а-яё]*\s+тормозн|\bгтц\b|цапф|воздуховод|(?:^|[^а-яё])щит|наклейк|ремкомплект|редуктор\s+стеклоочист|электродвигател|мотор[а-яё\-]*\s+стеклоочист|стеклоочист[а-яё]*\s+(мотор|редуктор|электродвигател)|рам[а-яё]{0,3}\s+фильтр|фильтр[а-яё]*\s+омывател|элемент[а-яё]*\s+крепления/i;
/* Явные расходники ТО — проверяются ДО фильтра «крепёж/ремонт»:
   сливная пробка поддона (с её медной шайбой/прокладкой) и болт поддона
   меняются при каждой замене масла, а герметики и фиксаторы резьбы —
   рабочая химия ТО, хотя формально это метизы и клей. */
const MAINT_DRAIN_RE = /пробк[а-яё]{0,6}\s+(сливн|поддон|маслян)|сливн[а-яё]{0,6}\s+(пробк|шайб)|болт[а-яё]*\s+поддон|поддон[а-яё]*\s+болт|шайб[а-яё]{0,6}\s+сливн|медн[а-яё]{0,6}\s+шайб/i;
const MAINT_SEAL_RE = /герметик|фиксатор[а-яё]{0,6}\s+резьб|резьбов[а-яё]{0,10}\s+фиксатор|анаэробн/i;

/* Классификатор: id группы расходников или null (= не расходник).
   Матчинг — только по НАЗВАНИЮ позиции; подкатегория используется лишь
   чтобы отсечь подкатегории «Крепёж/Метизы». Так «Пробка сливная» из
   подкатегории «Масло и фильтры» не превращается в фильтр — она попадает
   в свою группу «Пробка и шайба поддона» по явному совпадению. */
function maintClassOf(p) {
    const name = String(p.name || '').trim();
    const sub = String(p.sub || '');
    if (MAINT_DRAIN_RE.test(name)) return 'drainplug';
    if (MAINT_SEAL_RE.test(name)) return 'sealants';
    if (/крепёж|крепеж|метиз/i.test(sub)) return null;
    if (MAINT_JUNK_LEAD_RE.test(name)) return null;
    if (MAINT_JUNK_ANY_RE.test(name)) {
        /* «Ролик натяжителя с подшипником» — легитимный комплект ГРМ
           (но «роликовый подшипник»/«роликоподшипник» — ремонт);
           «Смазка ШРУС-4» — расходная смазка, а не ремонт привода. */
        const rollerKit = /подшипник/i.test(name)
            && /(?:^|[^а-яё])(ролик|ролики|роликов|роликом|натяжител[а-яё]*|грм)(?:[^а-яё]|$)/i.test(name);
        const grease = /^смазк/i.test(name);
        if (!rollerKit && !grease) return null;
    }
    for (const g of MAINT_GROUPS) { if (g.re && g.re.test(name)) return g.id; }
    if (p.cat === 'Maintenance') return 'reglament';   // остальное из категории «Регламент ТО»
    return null;
}

/* Подходит ли позиция конкретной машине из гаража (мотор + кузов + КПП).
   Общий фильтр для «Расходников для ТО» и «Списка покупок на ТО». */
function maintFitsCar(g, p) {
    if (!g) return true;
    const gb = normGb(g.gearboxCode);
    if (g.engineCode && (p.engines || []).length && !p.engines.includes(g.engineCode)) return false;
    if (g.body && (p.bodies || []).length && !p.bodies.includes(g.body)) return false;
    if (g.transCode && !partMatchesTrans(p, g.transCode)) return false;
    if (gb !== 'all' && !partMatchesGearbox(p, gb)) return false;
    return true;
}

function showMaintenanceForVin(gid) {
    const g = G.find(x => x.id === gid); if (!g) return;
    window._maintViewGid = gid;
    window._maintActive = true;
    setHash('/maint/' + encodeURIComponent(gid));
    const collapsedMap = window._maintCollapsed || (window._maintCollapsed = {});
    const allMode = !!window._maintAll;
    const gb = normGb(g.gearboxCode);
    const fitsVin = p => maintFitsCar(g, p);

    let maintParts, grouped, order;
    window._maintIds = [];
    if (allMode) {
        /* Предохранитель: «вся база под VIN» — широкие категории, как раньше */
        const maintCats = ['Maintenance', 'Fluids', 'Engine', 'Fuel', 'Ignition', 'Cooling', 'Brakes', 'Suspension', 'Transmission', 'Tires'];
        maintParts = D.filter(p => maintCats.includes(p.cat) && fitsVin(p));
        grouped = {};
        maintParts.forEach(p => { const sub = (p.sub || '').trim() || catL(p.cat) || 'Прочее'; (grouped[sub] = grouped[sub] || []).push(p); });
        order = Object.keys(grouped);
    } else {
        /* Только расходники — канонические группы в фиксированном порядке */
        maintParts = D.filter(p => fitsVin(p) && maintClassOf(p));
        grouped = {};
        maintParts.forEach(p => { const id = maintClassOf(p); (grouped[id] = grouped[id] || []).push(p); });
        order = MAINT_GROUPS.map(x => x.id).filter(id => grouped[id] && grouped[id].length);
        Object.keys(grouped).forEach(id => { if (!order.includes(id)) order.push(id); });
    }
    order.forEach(id => grouped[id].sort((a, b) => _maintWeight(a) - _maintWeight(b) || String(a.name || '').localeCompare(String(b.name || ''), 'ru')));
    window._maintIds = maintParts.map(p => p.id);

    const nWant = maintParts.filter(p => p.status === 'want').length;
    const nBought = maintParts.filter(p => p.status === 'bought').length;
    const nDone = maintParts.filter(p => p.status === 'installed').length;

    let h = '<div class="maint-head">'
        + '<button class="bn" data-action="maint-back" title="Вернуться в каталог">← Каталог</button>'
        + '<h2 class="sh" style="margin:0">🛒 ' + (allMode ? 'Вся база под VIN' : 'Расходники для ТО') + '</h2>'
        + (maintParts.length ? '<button class="bn" data-action="maint-tgl-all" title="Свернуть или развернуть все разделы">⇕ Разделы</button>' : '')
        + (maintParts.length ? '<button class="bn" data-action="maint-kit" title="Добавить все позиции списка в список покупок на ТО">🛒 В список</button>' : '')
        + '<button class="bn maint-mode" data-action="maint-all" title="' + (allMode ? 'Вернуться к списку расходников' : 'Показать вообще все подходящие позиции каталога') + '">' + (allMode ? '🛒 Только расходники' : '🗂 Вся база под VIN') + '</button>'
        + '</div>';
    h += '<div class="ri">'
        + '<span class="chip">🚗 …' + esc(g.vin ? g.vin.slice(-6) : '') + '</span>'
        + (g.engineCode ? '<span class="chip">⚙ ' + esc(g.engineCode) + '</span>' : '')
        + ((g.transCode || gb !== 'all') ? '<span class="chip">🔄 ' + esc([g.transCode, gb !== 'all' ? gb : ''].filter(Boolean).join(' / ')) + '</span>' : '')
        + (g.body && BODIES[g.body] ? '<span class="chip">' + esc(BODIES[g.body]) + '</span>' : '')
        + '<span class="chip">Найдено: <b>' + maintParts.length + '</b></span>'
        + (maintParts.length ? '<span class="chip maint-sts-sum" title="Статусы списка">🛒 ' + nWant + ' · 📦 ' + nBought + ' · ✅ ' + nDone + '</span>' : '')
        + '</div>';
    if (!maintParts.length) {
        h += '<div class="emp"><div class="empi">🔧</div><p><b>' + (allMode ? 'Под этот VIN ничего не найдено' : 'Расходников под этот VIN не найдено') + '</b></p>'
            + '<p style="font-size:.8rem;color:var(--mu)">' + (allMode
                ? 'Проверьте мотор/кузов в карточке VIN и что база загружена.'
                : 'Убедитесь, что база загружена (⚙️ → 📜 История версий), а в карточке VIN указаны мотор и кузов. Если нужная позиция есть в каталоге, но не попала в список — включите «🗂 Вся база под VIN».') + '</p></div>';
    } else {
        window._maintGroups = order.slice();
        h += '<div class="gr">';
        for (const key of order) {
            const parts = grouped[key];
            const meta = MAINT_GROUPS.find(x => x.id === key);
            const title = allMode ? key : (meta ? meta.icon + ' ' + meta.label : key);
            const isOpen = !collapsedMap[key];
            h += '<details class="cd maint-gr"' + (isOpen ? ' open' : '') + ' data-mgr="' + escA(key) + '">'
                + '<summary class="cd-top maint-sum"><b>' + esc(title) + '</b> <span style="color:var(--mu);font-size:.78rem">(' + parts.length + ')</span></summary>'
                + '<div class="cd-body">';
            for (const p of parts) {
                const st = p.status || '';
                h += '<div class="maint-row' + (st ? ' has-' + st : '') + '">'
                    + '<div class="maint-info" data-action="maint-open" data-id="' + escA(p.id) + '" title="Открыть карточку детали">'
                    + '<div class="maint-top"><span class="maint-oem">' + esc(p.oem || '—') + '</span>'
                    + (p.price != null ? '<span class="maint-price">' + esc(fP(p.price, p.currency)) + '</span>' : '') + '</div>'
                    + '<span class="maint-name">' + esc(p.name || '') + '</span>'
                    + (p.analogs && p.analogs.length ? '<span class="maint-analogs">Аналоги: ' + esc(p.analogs.slice(0, 3).join(', ')) + '</span>' : '')
                    + '</div>'
                    + '<div class="maint-acts">'
                    + (p.oem ? '<button class="mact" data-action="maint-cheaper" data-oem="' + escA(p.oem) + '" data-name="' + escA(p.name || '') + '" title="Найти дешевле: Exist · Autodoc · Avito">🔍</button>' : '')
                    + '<button class="mact fav' + (p.favorite ? ' on' : '') + '" data-action="maint-fav" data-id="' + escA(p.id) + '" title="' + (p.favorite ? 'Убрать из избранного' : 'В избранное') + '">' + (p.favorite ? '★' : '☆') + '</button>'
                    + '</div>'
                    + '<div class="maint-sts">'
                    + [['want', '🛒', 'Хочу купить'], ['bought', '📦', 'Куплено'], ['installed', '✅', 'Установлено']].map(x =>
                        '<button class="mst ' + x[0] + (st === x[0] ? ' on' : '') + '" data-action="maint-status" data-gid="' + escA(g.id) + '" data-id="' + escA(p.id) + '" data-status="' + x[0] + '" title="' + x[2] + '">' + x[1] + '</button>').join('')
                    + '</div></div>';
            }
            h += '</div></details>';
        }
        h += '</div>';
    }
    const sc = $('ca') ? $('ca').scrollTop : 0;
    $('ca').innerHTML = h;
    if (sc && $('ca').scrollHeight > sc) $('ca').scrollTop = sc; else $('ca').scrollTop = 0;
}
/* Статус из списка расходников: пишет в карточку детали, как sPS,
   но перерисовывает список расходников, а не весь каталог. */
function maintSetStatus(gid, id, st) {
    if (pubGuard()) return;
    const p = D.find(x => x.id === id);
    if (!p || !['want', 'bought', 'installed'].includes(st)) return;
    const same = p.status === st;
    p.status = same ? '' : st;
    useIDB ? iPut(SP, p).catch(() => { }) : sD();
    rSB();
    maintRerender();
    const L = { want: '🛒 Хочу купить', bought: '📦 Куплено', installed: '✅ Установлено' };
    toast(same ? 'Статус снят' : L[st], same ? '' : 'success');
    if (!same && st === 'installed' && typeof confetti === 'function') confetti();
}
/* Перерисовка расходников с сохранением прокрутки и свёрнутых разделов */
function maintRerender() {
    if (!window._maintViewGid) return;
    const sc = $('ca') ? $('ca').scrollTop : 0;
    showMaintenanceForVin(window._maintViewGid);
    if ($('ca')) $('ca').scrollTop = sc;
}
/* Избранное из списка расходников (как tF, но без перерисовки каталога) */
function maintToggleFav(id) {
    if (pubGuard()) return;
    const p = D.find(x => x.id === id); if (!p) return;
    p.favorite = !p.favorite;
    useIDB ? iPut(SP, p).catch(() => { }) : sD();
    rSB();
    maintRerender();
    if (partmoId === id) oPC(id);
    toast(p.favorite ? '⭐ Добавлено в избранное' : 'Убрано из избранного', p.favorite ? 'success' : '');
    if (p.favorite) window.ymGoal && window.ymGoal('favorite_added');
}
/* Свернуть/развернуть все разделы списка расходников */
function maintToggleAllGroups() {
    const keys = window._maintGroups || [];
    if (!window._maintCollapsed) window._maintCollapsed = {};
    const anyOpen = keys.some(k => !window._maintCollapsed[k]);
    keys.forEach(k => { window._maintCollapsed[k] = anyOpen; });
    maintRerender();
}
/* Весь текущий список расходников — в список покупок на ТО */
function maintAddAllToShop() {
    const ids = window._maintIds || [];
    if (!ids.length) { toast('Список пуст — добавлять нечего', 'danger'); return; }
    ids.forEach(id => shopPick.add(id));   // ✅ 1.10.1: дополняем, а не перетираем прежние отметки
    sShopPick();
    toast('🛒 В список покупок добавлено: ' + ids.length, 'success');
    oShopList(true);   // не сбрасывать только что наполненный набор
}

function showVinQR(gid) {
    const g = G.find(x => x.id === gid); if (!g) return;
    /* Компактная сводка для мастера СТО — всё, что нужно для подбора */
    const lines = [];
    lines.push('VW Polo/Caddy — База Мастера');
    lines.push('VIN: ' + (g.vin || '—'));
    const desc = [g.brand, g.model, g.year].filter(Boolean).join(' ');
    if (desc) lines.push(desc);
    const eng = getEngineDetails(g.engineCode);
    if (g.engineCode) lines.push('Мотор: ' + g.engineCode + (eng ? ' · ' + eng.volume + ' л · ' + eng.power : ''));
    const trBits = [g.transCode, normGb(g.gearboxCode) !== 'all' ? normGb(g.gearboxCode) : ''].filter(Boolean);
    lines.push('КПП: ' + (trBits.length ? trBits.join(' / ') : '—'));
    const bl = giBodyLabel(g);
    if (g.body || bl) lines.push('Кузов: ' + (BODIES[g.body] || bl || g.body || '—'));
    const col = lafColor(g.bodyColor);
    if (g.bodyColor) lines.push('Цвет: ' + (col ? col.ru + ' (' + col.code + ')' : g.bodyColor));
    const wk = g.prodDate ? getWeekNumber(g.prodDate) : null;
    if (g.prodDate) lines.push('Производство: ' + g.prodDate + (wk ? ' (неделя ' + wk.week + ')' : ''));
    const qrData = lines.join('\n');

    /* Генерация оффлайн (qrcode-generator, встроен в app.js) —
       работает без интернета, в т.ч. в APK-версии. */
    let qrInner = '';
    try {
        const qr = QRGen(0, 'M');
        qr.addData(qrData, 'Byte');
        qr.make();
        qrInner = qr.createSvgTag({ cellSize: 6, margin: 10, scalable: true });
    } catch (e) {
        console.warn('QR generate fail', e);
        qrInner = '';
    }
    let h = '<h2 class="sh">📱 QR-код карточки</h2><div style="text-align:center;padding:20px">';
    if (qrInner) {
        h += '<div class="qr-card">' + qrInner + '</div>';
    } else {
        h += '<div style="padding:20px;background:var(--hv);border-radius:8px;margin-top:10px"><p style="font-size:.82rem;color:var(--mu)">QR не удалось сгенерировать. Данные карточки:</p>'
            + '<pre style="text-align:left;font-size:.78rem;white-space:pre-wrap;margin-top:10px">' + esc(qrData) + '</pre></div>';
    }
    h += '<p style="margin-top:16px;font-size:.82rem;color:var(--mu)">Отсканируйте камерой телефона — мастер СТО увидит комплектацию. Генерируется оффлайн, без интернета.</p>';
    h += '<details class="qr-data"><summary>Что зашифровано в QR</summary><pre>' + esc(qrData) + '</pre></details>';
    h += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px">'
        + '<button class="bn" onclick="copyQrData(this)">📋 Скопировать данные</button>'
        + '<button class="bn p" onclick="shareVinText(\'' + escA(g.id) + '\')">📤 Поделиться</button>'
        + '</div></div>';
    openM('qrmo'); $('qrmo_body').innerHTML = h;
    window._qrDataCache = qrData;
}
function copyQrData(btn) {
    const text = window._qrDataCache || '';
    if (!text) return;
    const done = () => toast('Данные карточки скопированы', 'success');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(() => fC(text, done));
    else fC(text, done);
}
/* Поделиться текстом карточки (Web Share API, иначе — копирование) */
function shareVinText(gid) {
    const g = G.find(x => x.id === gid); if (!g) return;
    const text = window._qrDataCache || ('VIN: ' + (g.vin || '—'));
    if (navigator.share) {
        navigator.share({ title: 'Карточка VIN — База Мастера', text }).catch(() => { });
    } else {
        cT(text);
        toast('Ссылка для шаринга недоступна — текст скопирован', 'info');
    }
}

function showPlateLocation(gid) {
    const g = G.find(x => x.id === gid); if (!g) return;
    const pf = platformOf(g.body, g.model);
    let location = '', svg = '';
    const svgStyle = 'width:100%;max-width:400px;margin:16px auto;display:block;background:var(--hv);border-radius:8px;padding:10px';
    if (pf === 'caddy') {
        location = '<b>Caddy 9K/9U:</b> под капотом на передней перегородке (моторный щит) справа по ходу. Дублирующая наклейка — в нише запасного колеса / на панели боковины в грузовом отсеке.';
        svg = '<svg viewBox="0 0 400 200" style="' + svgStyle + '"><text x="200" y="20" text-anchor="middle" font-size="12" fill="var(--mu)">Вид спереди (капот открыт)</text><rect x="40" y="50" width="320" height="110" rx="14" fill="none" stroke="var(--tx)" stroke-width="2"/><line x1="40" y1="80" x2="360" y2="80" stroke="var(--tx)" stroke-width="1" stroke-dasharray="3,3"/><text x="200" y="70" text-anchor="middle" font-size="10" fill="var(--mu)">передняя перегородка (моторный щит)</text><circle cx="310" cy="110" r="18" fill="var(--dg)" opacity="0.3" stroke="var(--dg)" stroke-width="2"/><text x="310" y="114" text-anchor="middle" font-size="10" fill="var(--dg)">VIN</text><text x="310" y="150" text-anchor="middle" font-size="10" fill="var(--dg)">справа по ходу</text><text x="120" y="185" text-anchor="middle" font-size="10" fill="var(--mu)">дубликат: ниша запаски / боковина</text></svg>';
    } else if (pf === 'classic') {
        location = '<b>Polo Classic 6V2 / Variant 6V5 (платформа 6K):</b> проём водительской двери, на центральной (B) стойке — нижняя часть. Дублирующая наклейка — в багажнике на нише запасного колеса.';
        svg = '<svg viewBox="0 0 400 200" style="' + svgStyle + '"><text x="200" y="20" text-anchor="middle" font-size="12" fill="var(--mu)">Вид сбоку (дверь открыта)</text><rect x="80" y="30" width="240" height="140" rx="10" fill="none" stroke="var(--tx)" stroke-width="2"/><line x1="200" y1="30" x2="200" y2="170" stroke="var(--tx)" stroke-width="1"/><circle cx="140" cy="140" r="18" fill="var(--dg)" opacity="0.3" stroke="var(--dg)" stroke-width="2"/><text x="140" y="144" text-anchor="middle" font-size="10" fill="var(--dg)">VIN</text><text x="140" y="190" text-anchor="middle" font-size="10" fill="var(--dg)">B-стойка, низ</text></svg>';
    } else if (pf === 'estate') {
        location = '<b>Polo Variant 6V5:</b> проём водительской двери, на центральной стойке (нижняя часть). Наклейка-дубликат с кодами — в багажнике на боковине/нише запаски.';
        svg = '<svg viewBox="0 0 400 200" style="' + svgStyle + '"><text x="200" y="20" text-anchor="middle" font-size="12" fill="var(--mu)">Вид сбоку (дверь открыта)</text><rect x="70" y="30" width="260" height="140" rx="10" fill="none" stroke="var(--tx)" stroke-width="2"/><line x1="185" y1="30" x2="185" y2="170" stroke="var(--tx)" stroke-width="1"/><circle cx="130" cy="140" r="18" fill="var(--dg)" opacity="0.3" stroke="var(--dg)" stroke-width="2"/><text x="130" y="144" text-anchor="middle" font-size="10" fill="var(--dg)">VIN</text><text x="130" y="190" text-anchor="middle" font-size="10" fill="var(--dg)">B-стойка, низ</text></svg>';
    } else {
        location = '<b>Polo 6N/6N2:</b> моторный отсек, на чашке правого амортизатора. Также дубликат в проёме водительской двери (на стойке) и наклейка с кодами (MKB/GKB/Lacknr/PR) в багажнике на нише запасного колеса.';
        svg = '<svg viewBox="0 0 400 200" style="' + svgStyle + '"><text x="200" y="20" text-anchor="middle" font-size="12" fill="var(--mu)">Вид спереди (капот открыт)</text><rect x="50" y="40" width="300" height="120" rx="20" fill="none" stroke="var(--tx)" stroke-width="2"/><circle cx="105" cy="75" r="16" fill="none" stroke="var(--mu)" stroke-width="1.5"/><circle cx="320" cy="80" r="18" fill="var(--dg)" opacity="0.3" stroke="var(--dg)" stroke-width="2"/><text x="320" y="84" text-anchor="middle" font-size="10" fill="var(--dg)">VIN</text><line x1="320" y1="98" x2="320" y2="140" stroke="var(--dg)" stroke-width="1.5" stroke-dasharray="4,2"/><text x="320" y="155" text-anchor="middle" font-size="10" fill="var(--dg)">Чашка амортизатора</text></svg>';
    }
    /* ── Персональный пример наклейки (данные из карточки VIN) ── */
    const col = lafColor(g.bodyColor), roof = lafColor(g.roofColor);
    const dbrow = vinDbRow(g.vin);
    const prsAll = (dbrow && Array.isArray(dbrow.pr)) ? dbrow.pr : [];
    const prs = prsAll.slice(0, 12);
    const wk = g.prodDate ? getWeekNumber(g.prodDate) : null;
    const sw = (c, x, y) => c ? '<rect x="' + x + '" y="' + y + '" width="14" height="14" rx="2" fill="' + c.hex + '" stroke="#666" stroke-width="0.5"/>' : '';
    /* PR-коды раскладываем по 5 в строку, высоту считаем динамически */
    const prLines = [];
    for (let i = 0; i < prs.length; i += 5) prLines.push(prs.slice(i, i + 5).join(' '));
    if (!prLines.length) prLines.push('—');
    const prExtra = prsAll.length > prs.length;
    const noteY = 152 + prLines.length * 15 + (prExtra ? 14 : 0);
    const pH = noteY + 78;
    let plate = '<svg viewBox="0 0 400 ' + pH + '" style="width:100%;max-width:420px;margin:8px auto;display:block;background:#f5f3ec;border:1px solid #999;border-radius:6px;font-family:monospace">'
        + '<rect x="8" y="8" width="384" height="' + (pH - 16) + '" rx="4" fill="#fff" stroke="#bbb"/>'
        + '<text x="200" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="#111">VOLKSWAGEN · DATENTRÄGER</text>'
        + '<line x1="16" y1="38" x2="384" y2="38" stroke="#ddd"/>'
        + '<text x="20" y="58" font-size="10" fill="#333">FIN</text><text x="90" y="58" font-size="12" font-weight="bold" fill="#000">' + esc(g.vin || '—') + '</text>'
        + '<text x="20" y="82" font-size="10" fill="#333">MKB</text><text x="90" y="82" font-size="12" font-weight="bold" fill="#000">' + esc(g.engineCode || '—') + '</text>'
        + '<text x="210" y="82" font-size="10" fill="#333">GKB</text><text x="270" y="82" font-size="12" font-weight="bold" fill="#000">' + esc(g.gearboxCode || g.transCode || '—') + '</text>'
        + '<text x="20" y="106" font-size="10" fill="#333">Lacknr</text><text x="90" y="106" font-size="12" font-weight="bold" fill="#000">' + esc(g.bodyColor || '—') + (g.roofColor ? ' / ' + esc(g.roofColor) : '') + '</text>'
        + sw(col, 200, 94) + sw(roof, 220, 94)
        + (col ? '<text x="240" y="106" font-size="9" fill="#555">' + esc(col.ru) + '</text>' : '')
        + '<text x="20" y="130" font-size="10" fill="#333">Modelljahr</text><text x="110" y="130" font-size="12" font-weight="bold" fill="#000">' + esc(g.year || '—') + (wk ? '<tspan font-size="9" fill="#555"> · неделя ' + wk.week + '</tspan>' : '') + '</text>'
        + '<text x="20" y="152" font-size="10" fill="#333">PR-Nr.</text>'
        + prLines.map((ln, i) => '<text x="90" y="' + (152 + i * 15) + '" font-size="11" fill="#000">' + esc(ln) + '</text>').join('')
        + (prExtra ? '<text x="90" y="' + (152 + prLines.length * 15) + '" font-size="9" fill="#777">… и ещё ' + (prsAll.length - prs.length) + ' — см. «Оснащение (PR)» в карточке</text>' : '')
        + '<line x1="16" y1="' + (noteY + 8) + '" x2="384" y2="' + (noteY + 8) + '" stroke="#eee"/>'
        + '<text x="20" y="' + (noteY + 26) + '" font-size="8" fill="#999">Пример — составлен из данных вашей карточки.</text>'
        + '<text x="20" y="' + (noteY + 40) + '" font-size="8" fill="#999">Настоящая наклейка: багажник (ниша запаски) или</text>'
        + '<text x="20" y="' + (noteY + 54) + '" font-size="8" fill="#999">сервисная книжка. Шрифт и размеры могут отличаться.</text>'
        + '</svg>';

    let h = '<h2 class="sh">📍 Где искать коды</h2><div style="padding:16px">'
        + '<div style="background:var(--hv);padding:12px;border-radius:8px;border-left:3px solid var(--a);font-size:.88rem;line-height:1.6">' + location + '</div>'
        + svg
        + '<div style="margin-top:8px;font-size:.85rem;font-weight:700;color:var(--tx)">🏷️ Как выглядит наклейка с кодами (ваша машина)</div>'
        + plate
        + '<div style="margin-top:16px;padding:12px;background:var(--hv);border-radius:8px;font-size:.82rem">'
        + '<b style="color:var(--a)">Что искать на табличке/наклейке:</b>'
        + '<ul style="margin:8px 0 0 20px;padding:0;color:var(--tx)">'
        + '<li><b>FIN/VIN</b> — 17-значный номер кузова</li>'
        + '<li><b>MKB / Motor</b> — буквенный код двигателя (3 буквы)</li>'
        + '<li><b>GKB / Getr</b> — буквенный код КПП (3 буквы)</li>'
        + '<li><b>Lacknr / Paint</b> — код цвета кузова (2–4 символа)</li>'
        + '<li><b>PR-Nr.</b> — коды оснащения (трёхзначные)</li>'
        + '</ul></div></div>';
    openM('platemmo'); $('platemmo_body').innerHTML = h;
}

/* ────────── ЭКСПОРТ КАРТОЧКИ VIN ──────────
   Кнопка «📤 Экспорт» открывает модалку с тремя форматами:
   PNG (рисуется оффлайн на canvas), печать/PDF и текст. */
let _expGid = null;

/* Единый набор строк карточки для всех форматов экспорта */
function vinCardRows(g) {
    const rows = [];
    rows.push({ k: 'VIN', v: g.vin || '—', mono: true });
    const desc = [g.brand, g.model, g.year].filter(Boolean).join(' ');
    if (desc) rows.push({ k: 'Автомобиль', v: desc });
    const bl = giBodyLabel(g);
    if (g.body || bl) rows.push({ k: 'Кузов', v: BODIES[g.body] || bl || g.body || '—' });
    const eng = getEngineDetails(g.engineCode);
    if (g.engineCode) {
        rows.push({ k: 'Двигатель', v: g.engineCode + (eng ? ' — ' + eng.volume + ' л · ' + eng.power + (eng.family ? ' · ' + eng.family : '') : '') });
        const tech = eng ? [eng.injection, eng.ecu, eng.euro].filter(Boolean).join(' · ') : '';
        if (tech) rows.push({ k: 'Впрыск / ЭБУ', v: tech });
    }
    const gb = normGb(g.gearboxCode);
    if (g.transCode || gb !== 'all') {
        rows.push({ k: 'КПП', v: [g.transCode ? (g.transCode + (TRANSMISSIONS[g.transCode] ? ' — ' + TRANSMISSIONS[g.transCode] : '')) : '', gb !== 'all' ? 'код ' + gb : ''].filter(Boolean).join(', ') });
    }
    const col = lafColor(g.bodyColor);
    if (g.bodyColor) rows.push({ k: 'Цвет кузова', v: (col ? col.ru + ' (' + col.code + ' · ' + col.name + ')' : 'код ' + g.bodyColor), hex: col ? col.hex : '' });
    const rc = lafColor(g.roofColor);
    if (g.roofColor && g.roofColor !== g.bodyColor) rows.push({ k: 'Цвет крыши', v: (rc ? rc.ru + ' (' + rc.code + ')' : 'код ' + g.roofColor), hex: rc ? rc.hex : '' });
    const wk = g.prodDate ? getWeekNumber(g.prodDate) : null;
    if (g.prodDate) rows.push({ k: 'Производство', v: g.prodDate + (wk ? ' · неделя ' + wk.week + '/' + wk.year : '') });
    if (g.vin) rows.push({ k: 'Серийный №', v: g.vin.slice(-6) + '-й автомобиль с конвейера (последние 6 цифр VIN)', mono: false });
    if (g.plant) rows.push({ k: 'Завод', v: g.plant });
    if (g.equipCode) rows.push({ k: 'Код оснащения', v: g.equipCode });
    const issues = issuesForGarageCar(g).filter(i => i.severity === 'high').slice(0, 3);
    if (issues.length) rows.push({ k: '⚠ Важно знать', v: issues.map(i => i.issue).join('; ') });
    return rows;
}

function exportVinCard(gid) { oExpCard(gid); }
function oExpCard(gid) {
    const g = G.find(x => x.id === gid); if (!g) return;
    _expGid = gid;
    let h = '<p style="margin-top:0;font-size:.84rem;color:var(--mu)">Выберите формат. PNG рисуется оффлайн и удобен для отправки в мессенджер; печать сохраняет карточку в PDF.</p>';
    h += '<div class="exp-actions">'
        + '<button class="bn exp-big" onclick="expVinPNG()">🖼<span>PNG-картинка<span class="exp-sm">сохранить / отправить в WhatsApp</span></span></button>'
        + '<button class="bn exp-big" onclick="printVinCard()">🖨<span>Печать / PDF<span class="exp-sm">через диалог печати браузера</span></span></button>'
        + '<button class="bn exp-big" onclick="expVinText()">📋<span>Текст<span class="exp-sm">скопировать или скачать .txt</span></span></button>';
    const canShare = typeof navigator.share === 'function';
    if (canShare) h += '<button class="bn exp-big" onclick="expVinShare()">📤<span>Поделиться…<span class="exp-sm">системное меню (телефон)</span></span></button>';
    h += '</div>';
    h += '<div class="exp-prev"><div class="exp-prev-h">Предпросмотр</div>';
    vinCardRows(g).forEach(r => { h += '<div class="exp-row"><span class="exp-k">' + esc(r.k) + '</span><span class="exp-v">' + (r.hex ? '<span class="gi-dot" style="background:' + r.hex + '"></span>' : '') + esc(r.v) + '</span></div>'; });
    h += '</div>';
    $('expmo_body').innerHTML = h;
    openM('expmo');
}
function cExp() { closeM('expmo'); _expGid = null; }

/* Текст карточки — в буфер обмена или файлом */
function expVinText() {
    const g = G.find(x => x.id === _expGid); if (!g) return;
    let text = '═══════════════════════════\n  КАРТОЧКА VIN\n═══════════════════════════\n\n';
    vinCardRows(g).forEach(r => { text += r.k + ':\n  ' + r.v + '\n'; });
    text += '\n═══════════════════════════\nСоздано: ' + new Date().toLocaleString('ru-RU') + '\nБаза Мастера v' + APP_VERSION + '\n';
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => toast('Карточка скопирована в буфер', 'success')).catch(() => downloadText(text, 'vin_' + (g.vin || 'card') + '.txt'));
    else downloadText(text, 'vin_' + (g.vin || 'card') + '.txt');
}

/* Печать / сохранение в PDF — отдельное окно со светлой вёрсткой */
function printVinCard() {
    const g = G.find(x => x.id === _expGid); if (!g) return;
    const w = window.open('', '_blank');
    if (!w) { toast('Браузер заблокировал всплывающее окно — разрешите его для этого сайта', 'danger'); return; }
    const css = '<style>body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;max-width:720px;margin:0 auto}'
        + 'h1{font-size:17px;margin:0 0 4px}.sub{font-size:11px;color:#666;margin-bottom:18px}'
        + 'table{border-collapse:collapse;width:100%}td{border:1px solid #999;padding:7px 10px;font-size:13px;vertical-align:top}'
        + 'td.k{background:#f0f0f0;width:190px;font-weight:bold}.mono{font-family:Consolas,monospace;letter-spacing:1px}'
        + '.sw{display:inline-block;width:13px;height:13px;border:1px solid #333;vertical-align:-2px;margin-right:6px;border-radius:2px}'
        + '.foot{margin-top:18px;font-size:10px;color:#777}</style>';
    let h = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Карточка VIN — ' + esc(g.vin || '') + '</title>' + css + '</head><body>';
    h += '<h1>🚗 Карточка VIN — VW Polo/Caddy</h1><div class="sub">База Мастера v' + esc(APP_VERSION) + ' · ' + new Date().toLocaleString('ru-RU') + '</div>';
    h += '<table>';
    vinCardRows(g).forEach(r => {
        h += '<tr><td class="k">' + esc(r.k) + '</td><td' + (r.mono ? ' class="mono"' : '') + '>' + (r.hex ? '<span class="sw" style="background:' + r.hex + '"></span>' : '') + esc(r.v) + '</td></tr>';
    });
    h += '</table><div class="foot">Сформировано приложением «База Мастера» · данные сверяйте по ETKA</div>';
    h += '<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>';
    w.document.write(h);
    w.document.close();
}

/* PNG-картинка — рисуем карточку на canvas (оффлайн, без html2canvas) */
function expVinPNG() {
    const g = G.find(x => x.id === _expGid); if (!g) return;
    const rows = vinCardRows(g);
    const S = 2;               // ретина
    const W = 900, PAD = 40;
    const ROW_H = 34, HEAD_H = 170;
    const H = HEAD_H + rows.length * ROW_H + 70;
    const cv = document.createElement('canvas');
    cv.width = W * S; cv.height = H * S;
    const c = cv.getContext('2d');
    c.scale(S, S);
    /* фон */
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#14232e'); bg.addColorStop(1, '#071219');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(45,212,191,.35)'; c.lineWidth = 2; c.strokeRect(10, 10, W - 20, H - 20);
    /* шапка */
    c.fillStyle = '#2dd4bf'; c.font = 'bold 20px -apple-system, "Segoe UI", Roboto, Arial';
    c.fillText('🚗 VW Polo/Caddy — База Мастера', PAD, PAD + 16);
    c.fillStyle = '#eef7f6'; c.font = 'bold 30px Consolas, "JetBrains Mono", monospace';
    c.fillText(g.vin || '—', PAD, PAD + 62);
    const desc = [g.brand, g.model, g.year].filter(Boolean).join(' ');
    c.fillStyle = '#9bb0ad'; c.font = '16px -apple-system, "Segoe UI", Roboto, Arial';
    c.fillText(desc || 'данные не указаны', PAD, PAD + 90);
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(PAD, HEAD_H - 18); c.lineTo(W - PAD, HEAD_H - 18); c.stroke();
    /* строки */
    let y = HEAD_H + 8;
    rows.forEach(r => {
        c.fillStyle = '#7d97a3'; c.font = '13px -apple-system, "Segoe UI", Roboto, Arial';
        c.fillText(String(r.k).toUpperCase(), PAD, y + 4);
        c.fillStyle = '#e8f2f0'; c.font = (r.mono ? 'bold 15px Consolas, monospace' : '15px -apple-system, "Segoe UI", Roboto, Arial');
        /* длинные значения переносим по словам */
        const maxW = W - PAD * 2 - 170;
        const words = String(r.v).split(' ');
        let line = '', lines = [];
        words.forEach(wd => {
            const t = line ? line + ' ' + wd : wd;
            if (c.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t;
        });
        if (line) lines.push(line);
        lines.slice(0, 2).forEach((ln, i) => {
            let x = PAD + 170;
            if (i === 0 && r.hex) { c.fillStyle = r.hex; c.fillRect(x, y - 11, 14, 14); c.strokeStyle = '#fff8'; c.strokeRect(x, y - 11, 14, 14); x += 22; c.fillStyle = '#e8f2f0'; }
            c.fillText(ln, x, y + 4);
            y += 20;
        });
        y += (lines.length > 1 ? 0 : ROW_H - 20);
        c.strokeStyle = 'rgba(255,255,255,.06)';
        c.beginPath(); c.moveTo(PAD, y - 6); c.lineTo(W - PAD, y - 6); c.stroke();
    });
    /* подвал */
    c.fillStyle = '#5c7480'; c.font = '12px -apple-system, "Segoe UI", Roboto, Arial';
    c.fillText('Создано: ' + new Date().toLocaleString('ru-RU') + ' · База Мастера v' + APP_VERSION + ' · артикулы сверяйте по ETKA', PAD, H - 30);
    /* сохранение */
    const fname = 'vin_' + (g.vin || 'card') + '.png';
    const finish = blob => {
        if (!blob) { toast('Не удалось создать PNG', 'danger'); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = fname; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast('PNG сохранён: ' + fname, 'success');
        window._vinPngBlob = blob; // для «Поделиться»
    };
    if (cv.toBlob) cv.toBlob(finish, 'image/png');
    else { /* fallback: dataURL → скачать */
        const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = fname; a.click();
        toast('PNG сохранён: ' + fname, 'success');
    }
}

/* Поделиться картинкой через системное меню (Web Share API level 2) */
function expVinShare() {
    const g = G.find(x => x.id === _expGid); if (!g) return;
    const rows = vinCardRows(g);
    const text = rows.map(r => r.k + ': ' + r.v).join('\n');
    if (navigator.share) {
        navigator.share({ title: 'Карточка VIN ' + (g.vin || ''), text }).catch(() => { });
        toast('Если нужен именно PNG — сначала «🖼 PNG-картинка», затем поделитесь файлом из загрузок', 'info');
    } else {
        expVinText();
    }
}
function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url); toast('Файл сохранён: ' + filename, 'success');
}

function bindUI() {
    if (window._uiAttached) return;

    const si = $('sr');
    if (!si) return;
    si.value = SV.searchQuery || '';
    uSC();

    si.addEventListener('input', e => {
        let v = e.target.value;
        if (v.indexOf('🕘 ') === 0) { v = v.slice(2); si.value = v; }   // выбор из «недавних»
        SV.searchQuery = v; uSC(); sUS(); dRC();
    });
    si.addEventListener('keydown', e => {
        if (e.key === 'Enter') { const q = (si.value || '').trim(); if (q.length >= 3) pushRecentQ(q); }
    });
    $('sf').addEventListener('change', e => { SV.statusFilter = e.target.value; sU(); rSB(); rC(); });
    $('ss').addEventListener('change', e => { SV.sortBy = e.target.value; sU(); rC(); });

    /* Объединённый фильтр ДВС: семейство (fam:X) + коды моторов в одном списке */
    buildEngineSelect();
    $('fmtr').addEventListener('change', e => {
        const v = e.target.value;
        if (v === 'all') { SV.engineFilter = 'all'; SV.engFamFilter = 'all'; }
        else if (v.indexOf('fam:') === 0) { SV.engFamFilter = v.slice(4); SV.engineFilter = 'all'; }
        else { SV.engineFilter = v; SV.engFamFilter = engineFamOf(v) || 'all'; }
        SV._vinApplied = false;
        updateFilterStyling(); sU(); rSB(); rC();
    });

    /* Объединённый фильтр «кузов / поколение»: gen:X, комбо «6N1|3d» и кузова в одном списке */
    buildBodyGenSelect();
    $('fbdy').addEventListener('change', e => {
        const v = e.target.value;
        if (v === 'all') { SV.bodyFilter = 'all'; SV.genFilter = 'all'; }
        else if (v.indexOf('gen:') === 0) { SV.genFilter = v.slice(4); SV.bodyFilter = 'all'; }
        else if (v.indexOf('|') > 0) {
            // Комбо «поколение + кузов»: ставим оба фильтра сразу
            const p = v.split('|');
            SV.genFilter = GENERATIONS[p[0]] ? p[0] : 'all';
            SV.bodyFilter = BODIES[p[1]] ? p[1] : 'all';
        }
        else { SV.bodyFilter = v; SV.genFilter = 'all'; }
        SV._vinApplied = false;
        updateFilterStyling(); sU(); rSB(); rC();
    });

    /* Объединённый фильтр КПП: семейство + буквенные коды (gb:X) в одном списке */
    buildTransSelect();
    fillGearboxDatalist('gbCodes', {}); // datalist для поля кодов в редакторе детали
    $('ftr').addEventListener('change', e => {
        const v = e.target.value;
        if (v === 'all') { SV.transFilter = 'all'; SV.gearboxFilter = 'all'; }
        else if (v.indexOf('gb:') === 0) {
            SV.gearboxFilter = v.slice(3);
            const fs = gearboxFamsOf(SV.gearboxFilter);
            // Однозначный код задаёт и семейство; неоднозначный (CHL/CHX) — нет
            SV.transFilter = fs.length === 1 ? fs[0] : 'all';
        }
        else { SV.transFilter = v; SV.gearboxFilter = 'all'; }
        SV._vinApplied = false;
        updateFilterStyling(); sU(); rSB(); rC();
    });

    /* Каскад «мотор → семейство → код» в редакторе VIN */
    const _ve = $('v_engine');
    if (_ve) _ve.addEventListener('change', () => { refreshTransForEngine(); updEngHint(); });
    const _vt = $('v_trans');
    if (_vt) _vt.addEventListener('change', () => { refreshGbCodeOptions(); updGbHint(); });
    const _vm = $('v_model');
    if (_vm) _vm.addEventListener('change', () => { refreshTransForEngine(); });
    const _vg = $('v_gearbox');
    if (_vg) {
        _vg.addEventListener('input', onGbCodeInput);
        _vg.addEventListener('change', () => { _vg.value = normGb(_vg.value) === 'all' ? '' : normGb(_vg.value); updGbHint(); });
    }

    $('if').addEventListener('change', oIF);
    $('pf').addEventListener('change', oPF);

    $('sf').value = SV.statusFilter || 'all';
    $('ss').value = SV.sortBy || 'default';
    syncEngineSelect();
    syncBodyGenSelect();
    syncTransSelect();
    updateFilterStyling();
    setV(SV.view || 'grid', true);

    ['pf_name', 'pf_ini', 'pf_city', 'pf_email'].forEach(id => {
        const el = $(id); if (el) el.addEventListener('input', updateProfPreview);
    });

    const ca = $('ca');
    ca.addEventListener('click', oCC);
    ca.addEventListener('click', e => {
        const sum = e.target.closest('summary');
        if (!sum) return;
        const det = sum.parentElement;
        if (!det || det.tagName !== 'DETAILS' || !det.dataset.etkey) return;
        setTimeout(() => {
            if (!SV.expandedTree) SV.expandedTree = {};
            const k = det.dataset.etkey;
            if (det.open) SV.expandedTree[k] = true;
            else delete SV.expandedTree[k];
            sU();
            const btn = document.querySelector('.et-tgl-btn');
            if (btn) {
                const any = !!document.querySelector('#ca details[data-etkey][open]');
                btn.textContent = any ? '▲ Свернуть всё' : '▼ Развернуть всё';
                btn.dataset.treeall = any ? 'collapse' : 'expand';
            }
        }, 0);
    }, false);
    ca.addEventListener('focusout', e => {
        const t = e.target;
        if (t && t.classList && t.classList.contains('cn')) {
            const id = t.dataset.notesId;
            if (!id) return;
            const p = D.find(x => x.id === id);
            if (!p) return;
            if (p.notes !== t.value) {
                p.notes = t.value;
                useIDB ? iPut(SP, p).catch(() => { }) : sD();
                toast('Заметка сохранена', 'success');
            }
        }
    });
    const pmb = $('partmo_body');
    if (pmb) {
        pmb.addEventListener('click', oCC);
        pmb.addEventListener('focusout', e => {
            const t = e.target;
            if (t && t.classList && t.classList.contains('cn')) {
                const id = t.dataset.notesId;
                if (!id) return;
                const p = D.find(x => x.id === id);
                if (!p) return;
                if (p.notes !== t.value) {
                    p.notes = t.value;
                    useIDB ? iPut(SP, p).catch(() => { }) : sD();
                    toast('Заметка сохранена', 'success');
                }
            }
        });
    }
    const gl = $('gl');
    if (gl) {
        gl.addEventListener('click', e => {
            const del = e.target.closest('[data-vact="delete"]'); if (del) { e.stopPropagation(); remV(del.dataset.gid); return; }
            const ed = e.target.closest('[data-vact="edit"]'); if (ed) { e.stopPropagation(); oVIN(); return; }
            const cgl = e.target.closest('[data-vact="collapse"]');
            if (cgl) {
                e.stopPropagation();
                const gid = cgl.dataset.gid;
                if (!SV.garCollapsed) SV.garCollapsed = {};
                SV.garCollapsed[gid] = !SV.garCollapsed[gid];
                sU(); rGar();
                return;
            }
            const pr = e.target.closest('[data-vact="pr"]'); if (pr) { e.stopPropagation(); oPR(pr.dataset.gid); return; }
            const maint = e.target.closest('[data-vact="maintenance"]'); if (maint) { e.stopPropagation(); showMaintenanceForVin(maint.dataset.gid); return; }
            const qr = e.target.closest('[data-vact="qr"]'); if (qr) { e.stopPropagation(); showVinQR(qr.dataset.gid); return; }
            const plate = e.target.closest('[data-vact="plate"]'); if (plate) { e.stopPropagation(); showPlateLocation(plate.dataset.gid); return; }
            const exp = e.target.closest('[data-vact="export"]'); if (exp) { e.stopPropagation(); exportVinCard(exp.dataset.gid); return; }
            const iss = e.target.closest('[data-vact="issues"]'); if (iss) { e.stopPropagation(); oIssues(iss.dataset.gid); return; }
            /* Клик по содержимому раскрытой карточки (виджеты, строки) не
               должен переключать/снимать активный VIN — setAV только по
               «пустым» зонам карточки: шапке, превью-строке, фону. */
            const gi = e.target.closest('.gi');
            if (gi && !e.target.closest('button') && !e.target.closest('.gi-details')) setAV(gi.dataset.gid);
        });
    }
    const gab = $('gab'); if (gab) gab.addEventListener('click', oGM);

    const modalClose = {
        mo: cM, wmo: cWM, gmo: cGM, smo: cSM, aboutmo: cAbout, bugmo: cBug,
        donmo: cDonate, profmo: cProfile, upmo: cUp, partmo: cPC,
        logmo: cLog, tomo: cTO, shopmo: cShop, vinmo: cVIN, thememmo: cTheme,
        faqmo: cFaq, prmo: cPR, apkmo: () => closeM('apkmo'),
        confirmmo: () => cConfirm(false), expmo: cExp, qrmo: () => closeM('qrmo'),
        platemmo: () => closeM('platemmo'), issmo: cIss, schmo: cSch, scanmo: cScan
    };
    Object.keys(modalClose).forEach(id => {
        const el = $(id); if (!el) return;
        el.addEventListener('click', e => { if (e.target.id === id) modalClose[id](); });
    });

    document.addEventListener('keydown', e => {
        /* Ctrl+K (или «/» вне полей ввода) — фокус в поиск, как в больших каталогах */
        const tag = String((e.target && e.target.tagName) || '');
        if (((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л'))
            || (e.key === '/' && !/^(input|textarea|select)$/i.test(tag))) {
            e.preventDefault();
            const s = $('sr'); if (s) { s.focus(); s.select(); }
            return;
        }
        if ($('lbt').classList.contains('show')) {
            if (e.key === 'ArrowLeft') { e.preventDefault(); lbNav(-1); return; }
            if (e.key === 'ArrowRight') { e.preventDefault(); lbNav(1); return; }
        }
        if (e.key === 'Escape') {
            if ($('confirmmo') && $('confirmmo').classList.contains('show')) return cConfirm(false);
            if ($('apkmo') && $('apkmo').classList.contains('show')) return closeM('apkmo');
            if ($('faqmo').classList.contains('show')) return cFaq();
            if ($('whatsnew') && $('whatsnew').classList.contains('show')) return closeWhatsNew(true);
            if ($('thememmo').classList.contains('show')) return cTheme();
            if ($('vinmo').classList.contains('show')) return cVIN();
            if ($('shopmo').classList.contains('show')) return cShop();
            if ($('tomo').classList.contains('show')) return cTO();
            if ($('logmo').classList.contains('show')) return cLog();
            if ($('partmo').classList.contains('show')) return cPC();
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
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            si.focus(); si.select();
        }
    });

    document.addEventListener('click', e => {
        const m = $('em');
        if (m.classList.contains('show') && !e.target.closest('.ew')) cEM();
    });

    let rz;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(rSz, 120); });

    const dt = $('dtgl');
    if (dt) dt.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); tSB(); });
    const mb = $('mob');
    if (mb) mb.addEventListener('click', tMM);

    const vtg = $('viewToggle');
    if (vtg) vtg.addEventListener('change', () => setV(vtg.checked ? 'tree' : 'grid'));

    const gv = $('g_vi');
    if (gv) {
        const vmLimit = 17;
        gv.setAttribute('autocapitalize', 'off');
        gv.setAttribute('autocomplete', 'off');
        gv.setAttribute('autocorrect', 'off');
        gv.setAttribute('spellcheck', 'false');
        gv.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); decG(); }
        });
        /* v1.8.4: «Сохранить» активируется сразу, как только введён валидный VIN.
           Раньше кнопка включалась лишь после «🔍 Декодировать» — при ручном
           вводе или после сканера QR она оставалась disabled («не нажимается»). */
        const syncVinState = () => {
            const v = gv.value.trim().toUpperCase();
            const ok = vV(v);
            const sb = $('g_sb'); if (sb) sb.disabled = !ok;
            if (ok && pGV && pGV.vin !== v) pGV = null; // VIN правили после декодирования — сброс
            const re = $('g_re');
            if (!re) return;
            if (!v) { re.style.display = 'none'; re.innerHTML = ''; return; }
            if (ok && !(pGV && pGV.ok)) {
                re.style.display = 'block';
                re.innerHTML = '<span style="opacity:.75">✓ VIN корректен — можно сразу сохранить, а «🔍» покажет подробности</span>';
            }
        };
        gv.addEventListener('input', syncVinState);
        ['paste', 'blur'].forEach(ev => gv.addEventListener(ev, () => {
            const f = () => {
                const r = gv.value, c = r.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, vmLimit);
                if (c !== r) gv.value = c;
                syncVinState();
            };
            if (ev === 'paste') setTimeout(f, 0); else f();
        }));
    }

    const box = $('garageBox');
    if (box) {
        try { if (localStorage.getItem('vw_garage_collapsed') === '1') box.removeAttribute('open'); } catch (e) { }
        box.addEventListener('toggle', () => {
            try { localStorage.setItem('vw_garage_collapsed', box.open ? '0' : '1'); } catch (e) { }
        });
    }

    /* ✅ Правка №6: ставим флаг в самом конце — если что-то упало, bindUI можно вызвать снова */
    window._uiAttached = true;
}

/* ============ СТАРТ ============ */
async function bootApp() {
    /* Самотест «html ↔ js»: версии файлов обязаны совпадать.
       Если на сервере или в кэше пользователя файлы «смешаны»
       (например, залили только index.html), интерфейс ломается
       молча — предупреждаем сразу и понятно. */
    try {
        const uiMeta = document.querySelector('meta[name="app-ui-ver"]');
        const uiVer = uiMeta ? String(uiMeta.getAttribute('content') || '') : '';
        if (uiVer && uiVer !== APP_VERSION) {
            console.warn('[ver] рассинхрон: index.html=' + uiVer + ', app.js=' + APP_VERSION);
            setTimeout(() => toast(
                '⚠️ Файлы разных версий: html ' + uiVer + ', js ' + APP_VERSION +
                '. Обновите страницу (Ctrl+Shift+R) или залейте index.html и js/app.js вместе',
                'danger'), 900);
        }
    } catch (e) { }

    /* ✅ Правка №2: checkLicense() — ДО fetch, чтобы пользователь не ждал сеть */
    ['ver_gate', 'ver_footer', 'ver_about', 'ver_bug'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = APP_VERSION;
    });
    fCS();
    checkLicense();

    // Асинхронно уточняем версию с сервера — не блокирует лицензию
    try {
        const base = location.origin + location.pathname.replace(/[^/]*$/, '');
        const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
        if (r.ok) {
            const m = await r.json();
            if (m.appVersion && String(m.appVersion) !== APP_VERSION) {
                APP_VERSION = String(m.appVersion);
                ['ver_gate', 'ver_footer', 'ver_about', 'ver_bug'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = APP_VERSION;
                });
            }
        }
    } catch (e) { }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootApp, { once: true });
} else {
    bootApp();
}

/* ============================================================
   ОФФЛАЙН-ГЕНЕРАТОР QR-КОДОВ
   qrcode-generator v1.4.4 · Copyright (c) 2009 Kazuhiko Arase
   Лицензия MIT · https://github.com/kazuhikoarase/qrcode-generator
   Встроен в app.js, чтобы QR карточки VIN работал без интернета
   (в т.ч. в APK-версии). Глобальный объект — QRGen(typeNumber, ecl).
   ============================================================ */
var QRGen;
(function () {
var qrcode=function(){var t=function(t,r){var e=t,n=g[r],o=null,i=0,a=null,u=[],f={},c=function(t,r){o=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(i=4*e+17),l(0,0),l(i-7,0),l(0,i-7),s(),h(),d(t,r),e>=7&&v(t),null==a&&(a=p(e,n,u)),w(a,r)},l=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||i<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||i<=r+n||(o[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},h=function(){for(var t=8;t<i-8;t+=1)null==o[t][6]&&(o[t][6]=t%2==0);for(var r=8;r<i-8;r+=1)null==o[6][r]&&(o[6][r]=r%2==0)},s=function(){for(var t=B.getPatternPosition(e),r=0;r<t.length;r+=1)for(var n=0;n<t.length;n+=1){var i=t[r],a=t[n];if(null==o[i][a])for(var u=-2;u<=2;u+=1)for(var f=-2;f<=2;f+=1)o[i+u][a+f]=-2==u||2==u||-2==f||2==f||0==u&&0==f}},v=function(t){for(var r=B.getBCHTypeNumber(e),n=0;n<18;n+=1){var a=!t&&1==(r>>n&1);o[Math.floor(n/3)][n%3+i-8-3]=a}for(n=0;n<18;n+=1){a=!t&&1==(r>>n&1);o[n%3+i-8-3][Math.floor(n/3)]=a}},d=function(t,r){for(var e=n<<3|r,a=B.getBCHTypeInfo(e),u=0;u<15;u+=1){var f=!t&&1==(a>>u&1);u<6?o[u][8]=f:u<8?o[u+1][8]=f:o[i-15+u][8]=f}for(u=0;u<15;u+=1){f=!t&&1==(a>>u&1);u<8?o[8][i-u-1]=f:u<9?o[8][15-u-1+1]=f:o[8][15-u-1]=f}o[i-8][8]=!t},w=function(t,r){for(var e=-1,n=i-1,a=7,u=0,f=B.getMaskFunction(r),c=i-1;c>0;c-=2)for(6==c&&(c-=1);;){for(var g=0;g<2;g+=1)if(null==o[n][c-g]){var l=!1;u<t.length&&(l=1==(t[u]>>>a&1)),f(n,c-g)&&(l=!l),o[n][c-g]=l,-1==(a-=1)&&(u+=1,a=7)}if((n+=e)<0||i<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=A.getRSBlocks(t,r),o=b(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var g=0;g<i[u].length;g+=1)i[u][g]=255&t.getBuffer()[g+e];e+=f;var l=B.getErrorCorrectPolynomial(c),h=k(i[u],l.getLength()-1).mod(l);for(a[u]=new Array(l.getLength()-1),g=0;g<a[u].length;g+=1){var s=g+h.getLength()-a[u].length;a[u][g]=s>=0?h.getAt(s):0}}var v=0;for(g=0;g<r.length;g+=1)v+=r[g].totalCount;var d=new Array(v),w=0;for(g=0;g<n;g+=1)for(u=0;u<r.length;u+=1)g<i[u].length&&(d[w]=i[u][g],w+=1);for(g=0;g<o;g+=1)for(u=0;u<r.length;u+=1)g<a[u].length&&(d[w]=a[u][g],w+=1);return d}(o,n)};f.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=M(t);break;case"Alphanumeric":e=x(t);break;case"Byte":e=m(t);break;case"Kanji":e=L(t);break;default:throw"mode:"+r}u.push(e),a=null},f.isDark=function(t,r){if(t<0||i<=t||r<0||i<=r)throw t+","+r;return o[t][r]},f.getModuleCount=function(){return i},f.make=function(){if(e<1){for(var t=1;t<40;t++){for(var r=A.getRSBlocks(t,n),o=b(),i=0;i<u.length;i++){var a=u[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var g=0;for(i=0;i<r.length;i++)g+=r[i].dataCount;if(o.getLengthInBits()<=8*g)break}e=t}c(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){c(!0,e);var n=B.getLostPoint(f);(0==e||t>n)&&(t=n,r=e)}return r}())},f.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<f.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<f.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=f.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},f.createSvgTag=function(t,r,e,n){var o={};"object"==typeof arguments[0]&&(t=(o=arguments[0]).cellSize,r=o.margin,e=o.alt,n=o.title),t=t||2,r=void 0===r?4*t:r,(e="string"==typeof e?{text:e}:e||{}).text=e.text||null,e.id=e.text?e.id||"qrcode-description":null,(n="string"==typeof n?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||"qrcode-title":null;var i,a,u,c,g=f.getModuleCount()*t+2*r,l="";for(c="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",l+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',l+=o.scalable?"":' width="'+g+'px" height="'+g+'px"',l+=' viewBox="0 0 '+g+" "+g+'" ',l+=' preserveAspectRatio="xMinYMin meet"',l+=n.text||e.text?' role="img" aria-labelledby="'+y([n.id,e.id].join(" ").trim())+'"':"",l+=">",l+=n.text?'<title id="'+y(n.id)+'">'+y(n.text)+"</title>":"",l+=e.text?'<description id="'+y(e.id)+'">'+y(e.text)+"</description>":"",l+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',l+='<path d="',a=0;a<f.getModuleCount();a+=1)for(u=a*t+r,i=0;i<f.getModuleCount();i+=1)f.isDark(a,i)&&(l+="M"+(i*t+r)+","+u+c);return l+='" stroke="transparent" fill="black"/>',l+="</svg>"},f.createDataURL=function(t,r){t=t||2,r=void 0===r?4*t:r;var e=f.getModuleCount()*t+2*r,n=r,o=e-r;return I(e,e,(function(r,e){if(n<=r&&r<o&&n<=e&&e<o){var i=Math.floor((r-n)/t),a=Math.floor((e-n)/t);return f.isDark(a,i)?0:1}return 1}))},f.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=f.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=f.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=y(e),o+='"'),o+="/>"};var y=function(t){for(var r="",e=0;e<t.length;e+=1){var n=t.charAt(e);switch(n){case"<":r+="&lt;";break;case">":r+="&gt;";break;case"&":r+="&amp;";break;case'"':r+="&quot;";break;default:r+=n}}return r};return f.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*f.getModuleCount()+2*t,u=t,c=a-t,g={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},h="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<c&&u<=r&&r<c&&f.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<c&&u<=r+1&&r+1<c&&f.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",h+=t<1&&r+1>=c?l[i]:g[i];h+="\n"}return a%2&&t>0?h.substring(0,h.length-a-1)+Array(a+1).join("▀"):h.substring(0,h.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=f.getModuleCount()*t+2*r,u=r,c=a-r,g=Array(t+1).join("██"),l=Array(t+1).join("  "),h="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<c&&u<=e&&e<c&&f.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?g:l;for(o=0;o<t;o+=1)h+=s+"\n"}return h.substring(0,h.length-1)},f.renderTo2dContext=function(t,r){r=r||2;for(var e=f.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=f.isDark(n,o)?"black":"white",t.fillRect(n*r,o*r,r,r)},f};t.stringToBytes=(t.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,t.createStringToBytes=function(t,r){var e=function(){for(var e=S(t),n=function(){var t=e.read();if(-1==t)throw"eof";return t},o=0,i={};;){var a=e.read();if(-1==a)break;var u=n(),f=n()<<8|n();i[String.fromCharCode(a<<8|u)]=f,o+=1}if(o!=r)throw o+" != "+r;return i}(),n="?".charCodeAt(0);return function(t){for(var r=[],o=0;o<t.length;o+=1){var i=t.charCodeAt(o);if(i<128)r.push(i);else{var a=e[t.charAt(o)];"number"==typeof a?(255&a)==a?r.push(a):(r.push(a>>>8),r.push(255&a)):r.push(n)}}return r}};var r,e,n,o,i,a=1,u=2,f=4,c=8,g={L:1,M:0,Q:3,H:2},l=0,h=1,s=2,v=3,d=4,w=5,p=6,y=7,B=(r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],e=1335,n=7973,i=function(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r},(o={}).getBCHTypeInfo=function(t){for(var r=t<<10;i(r)-i(e)>=0;)r^=e<<i(r)-i(e);return 21522^(t<<10|r)},o.getBCHTypeNumber=function(t){for(var r=t<<12;i(r)-i(n)>=0;)r^=n<<i(r)-i(n);return t<<12|r},o.getPatternPosition=function(t){return r[t-1]},o.getMaskFunction=function(t){switch(t){case l:return function(t,r){return(t+r)%2==0};case h:return function(t,r){return t%2==0};case s:return function(t,r){return r%3==0};case v:return function(t,r){return(t+r)%3==0};case d:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case w:return function(t,r){return t*r%2+t*r%3==0};case p:return function(t,r){return(t*r%2+t*r%3)%2==0};case y:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},o.getErrorCorrectPolynomial=function(t){for(var r=k([1],0),e=0;e<t;e+=1)r=r.multiply(k([1,C.gexp(e)],0));return r},o.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case f:case c:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case f:return 16;case c:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case f:return 16;case c:return 12;default:throw"mode:"+t}}},o.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var g=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(g+=1);return e+=Math.abs(100*g/r/r-50)/5*10},o),C=function(){for(var t=new Array(256),r=new Array(256),e=0;e<8;e+=1)t[e]=1<<e;for(e=8;e<256;e+=1)t[e]=t[e-4]^t[e-5]^t[e-6]^t[e-8];for(e=0;e<255;e+=1)r[t[e]]=e;var n={glog:function(t){if(t<1)throw"glog("+t+")";return r[t]},gexp:function(r){for(;r<0;)r+=255;for(;r>=256;)r-=255;return t[r]}};return n}();function k(t,r){if(void 0===t.length)throw t.length+"/"+r;var e=function(){for(var e=0;e<t.length&&0==t[e];)e+=1;for(var n=new Array(t.length-e+r),o=0;o<t.length-e;o+=1)n[o]=t[o+e];return n}(),n={getAt:function(t){return e[t]},getLength:function(){return e.length},multiply:function(t){for(var r=new Array(n.getLength()+t.getLength()-1),e=0;e<n.getLength();e+=1)for(var o=0;o<t.getLength();o+=1)r[e+o]^=C.gexp(C.glog(n.getAt(e))+C.glog(t.getAt(o)));return k(r,0)},mod:function(t){if(n.getLength()-t.getLength()<0)return n;for(var r=C.glog(n.getAt(0))-C.glog(t.getAt(0)),e=new Array(n.getLength()),o=0;o<n.getLength();o+=1)e[o]=n.getAt(o);for(o=0;o<t.getLength();o+=1)e[o]^=C.gexp(C.glog(t.getAt(o))+r);return k(e,0).mod(t)}};return n}var A=function(){var t=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(t,r){var e={};return e.totalCount=t,e.dataCount=r,e},e={};return e.getRSBlocks=function(e,n){var o=function(r,e){switch(e){case g.L:return t[4*(r-1)+0];case g.M:return t[4*(r-1)+1];case g.Q:return t[4*(r-1)+2];case g.H:return t[4*(r-1)+3];default:return}}(e,n);if(void 0===o)throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+n;for(var i=o.length/3,a=[],u=0;u<i;u+=1)for(var f=o[3*u+0],c=o[3*u+1],l=o[3*u+2],h=0;h<f;h+=1)a.push(r(c,l));return a},e}(),b=function(){var t=[],r=0,e={getBuffer:function(){return t},getAt:function(r){var e=Math.floor(r/8);return 1==(t[e]>>>7-r%8&1)},put:function(t,r){for(var n=0;n<r;n+=1)e.putBit(1==(t>>>r-n-1&1))},getLengthInBits:function(){return r},putBit:function(e){var n=Math.floor(r/8);t.length<=n&&t.push(0),e&&(t[n]|=128>>>r%8),r+=1}};return e},M=function(t){var r=a,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+2<r.length;)t.put(o(r.substring(n,n+3)),10),n+=3;n<r.length&&(r.length-n==1?t.put(o(r.substring(n,n+1)),4):r.length-n==2&&t.put(o(r.substring(n,n+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return n},x=function(t){var r=u,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+1<r.length;)t.put(45*o(r.charAt(n))+o(r.charAt(n+1)),11),n+=2;n<r.length&&t.put(o(r.charAt(n)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return n},m=function(r){var e=f,n=t.stringToBytes(r),o={getMode:function(){return e},getLength:function(t){return n.length},write:function(t){for(var r=0;r<n.length;r+=1)t.put(n[r],8)}};return o},L=function(r){var e=c,n=t.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(){var t=n("友");if(2!=t.length||38726!=(t[0]<<8|t[1]))throw"sjis not supported."}();var o=n(r),i={getMode:function(){return e},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return i},D=function(){var t=[],r={writeByte:function(r){t.push(255&r)},writeShort:function(t){r.writeByte(t),r.writeByte(t>>>8)},writeBytes:function(t,e,n){e=e||0,n=n||t.length;for(var o=0;o<n;o+=1)r.writeByte(t[o+e])},writeString:function(t){for(var e=0;e<t.length;e+=1)r.writeByte(t.charCodeAt(e))},toByteArray:function(){return t},toString:function(){var r="";r+="[";for(var e=0;e<t.length;e+=1)e>0&&(r+=","),r+=t[e];return r+="]"}};return r},S=function(t){var r=t,e=0,n=0,o=0,i={read:function(){for(;o<8;){if(e>=r.length){if(0==o)return-1;throw"unexpected end of file./"+o}var t=r.charAt(e);if(e+=1,"="==t)return o=0,-1;t.match(/^\s$/)||(n=n<<6|a(t.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return i},I=function(t,r,e){for(var n=function(t,r){var e=t,n=r,o=new Array(t*r),i={setPixel:function(t,r,n){o[r*e+t]=n},write:function(t){t.writeString("GIF87a"),t.writeShort(e),t.writeShort(n),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(e),t.writeShort(n),t.writeByte(0);var r=a(2);t.writeByte(2);for(var o=0;r.length-o>255;)t.writeByte(255),t.writeBytes(r,o,255),o+=255;t.writeByte(r.length-o),t.writeBytes(r,o,r.length-o),t.writeByte(0),t.writeString(";")}},a=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,i=u(),a=0;a<r;a+=1)i.add(String.fromCharCode(a));i.add(String.fromCharCode(r)),i.add(String.fromCharCode(e));var f,c,g,l=D(),h=(f=l,c=0,g=0,{write:function(t,r){if(t>>>r!=0)throw"length over";for(;c+r>=8;)f.writeByte(255&(t<<c|g)),r-=8-c,t>>>=8-c,g=0,c=0;g|=t<<c,c+=r},flush:function(){c>0&&f.writeByte(g)}});h.write(r,n);var s=0,v=String.fromCharCode(o[s]);for(s+=1;s<o.length;){var d=String.fromCharCode(o[s]);s+=1,i.contains(v+d)?v+=d:(h.write(i.indexOf(v),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(v+d)),v=d)}return h.write(i.indexOf(v),n),h.write(e,n),h.flush(),l.toByteArray()},u=function(){var t={},r=0,e={add:function(n){if(e.contains(n))throw"dup key:"+n;t[n]=r,r+=1},size:function(){return r},indexOf:function(r){return t[r]},contains:function(r){return void 0!==t[r]}};return e};return i}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=D();n.write(a);for(var u=function(){var t=0,r=0,e=0,n="",o={},i=function(t){n+=String.fromCharCode(a(63&t))},a=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return o.writeByte=function(n){for(t=t<<8|255&n,r+=8,e+=1;r>=6;)i(t>>>r-6),r-=6},o.flush=function(){if(r>0&&(i(t<<6-r),t=0,r=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return t}();qrcode.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||n>=57344?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)},function(t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports&&(module.exports=t())}((function(){return qrcode}));

    if (typeof qrcode === 'function') {
        /* Кириллица в QR: штатный режим библиотеки режет символы до 1 байта —
           переключаем на UTF-8, иначе русский текст не отсканируется. */
        if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
            qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
        }
        QRGen = qrcode;
    }
})();
