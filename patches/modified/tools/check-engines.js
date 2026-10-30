#!/usr/bin/env node
/* ============================================================
   tools/check-engines.js — сверка справочника ENGINES (js/app.js)
   с внешними эталонными данными и каталогом data-src.
   ------------------------------------------------------------
   Зачем: в раунде обследования volkswagenclub.net (см. отчёт
   «ОТЧЁТ.md» и «СВЕРКА-ДВИГАТЕЛЕЙ.md» в корне проекта) нашлись
   расхождения между нашей таблицей ENGINES и базой двигателей
   сайта. Этот инструмент держит эталонную таблицу REF (данные,
   вычитанные из карточек engine_detail.php и выдержки ETKA-
   таблицы «1950 2015 vw engine codes») и каждый прогон честно
   пересчитывает сверку заново — если ENGINES изменится, отчёт
   изменится вместе с ним. Файлы НЕ меняет (как audit-parts.js).

   Источники эталонов (первоисточники, которые цитирует сайт):
     • ms-motorservice.com/MediaAssets/2295355_ks_50003929_web.pdf
       (каталог KS 50003929; в REF помечен «KS стр.NNNN») —
       считан через карточки volkswagenclub.net 2026-10-30;
     • opendata.astra.admin.ch — швейцарские типовые одобрения
       (TAS);
     • manual_download.php?id=5557 — «1950 2015 vw engine codes»,
       выдержка ETKA-таблицы (строки вида «код кВт л.с. объём
       цилиндры старт финиш модель примечание»);
     • добор, цикл 4 (2026-10-30): зеркало en.volkswagenclub.net
       отдаёт карточки engine_detail.php ПОЛНОСТЬЮ (русский хост в
       этой сессии — только шапка/сбои прокси) — дочитаны 7 карточек
       (AKK 109, ALD 118, ALL 121, ANV 135, ANW 136, AUC 180,
       AUD 181) и «хвосты» AFN 80 / AHW 102 / APE 141; извлечены
       недостающие строки ETKA-таблицы 03.08.2015 (AHW/APE/AUA/
       AQM/ASV/AGR/ALH/ANM — Polo-интервалы) и ранний экспорт
       et_mkb.frm 07.03.2010 (fr.scribd.com/document/786098516) +
       североамериканский ETKA-экспорт (vaglinks.com/Docs/Catalogues/
       ETKA_VW_Engine_Codes.pdf) — для финальной проверки AHV;
     • добор, цикл 3 (2026-10-30): ПОЛНАЯ ETKA-таблица «ETKA -
       Engine Code» 03.08.2015 — vag-codes.info/files/engines/
       vw-engines.pdf (та же таблица, что id=5557; зеркала:
       scribd.com/doc/278437021, fr.scribd.com/document/849891594,
       es.scribd.com/document/714578221,
       slideshare.net/slideshow/…/201329802);
       заводские таблицы Elsa (зеркало elsaonline); Wikipedia
       («Volkswagen Polo Mk3», «List of discontinued Volkswagen
       Group petrol/diesel engines», «Volkswagen EA827 engine»);
       clubvw.org.au/vwreference/vwengines (ВНИМАНИЕ: в кВт-колонке
       известны ошибки — AEX «45», AEY «44», AHB «44»; оттуда
       берутся только модели/годы); auto-data.net;
     • наш собственный каталог data-src (ETKA-происхождения):
       поле engines карточек — для блока «сироты».

   Блоки отчёта:
     S  сверка совпала (OK; ROUND — расхождение на округление
        кВт→л.с.; LABEL — различается только маркировка впрыска)
     R  содержательные расхождения (MISMATCH) + статус адьюдикации
     A  применимость: ставился ли мотор на 6N/6N2/6V/6K/9K/9U
        (по данным сайта), и согласуется ли это с нашим ENGINES
     O  «сироты»: коды ENGINES, которые не упоминает поле engines
        ни одной карточки data-src (мёртвый вес в справочнике)
     N  наши коды, которых НЕТ в базе volkswagenclub.net (добор
        2026-10-30 выполнен: 36 кодов перенесены в REF → S/R/A;
        добор-3 2026-10-30: ещё 8 из 9 закрыты по ETKA-таблице
        03.08.2015/Elsa/Wikipedia/clubvw — остался только AHV)
     X  коды сайта, которых нет у нас (кандидаты и верно отсутствующие)

   Адьюдикация спорных кодов (задание владельца «б,в» от 2026-10-30
   + добор блока N 2026-10-30) хранится в VERDICTS и печатается в отчёте дословно; статус
   «требует ETKA» означает: данные в js/app.js НЕ правятся до
   подтверждения по ETKA (правило проекта «ничего не выдумывать»).

   Запуск:  node tools/check-engines.js [--json] [--strict]
   Отчёт:   restore/ENGINES-CHECK.md + restore/engines-check.json
   --strict: exit 1, если есть расхождение без закрытого вердикта
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ARGS = process.argv.slice(2);

/* ---------- 1. ENGINES из js/app.js (полные значения) ---------- */
const appSrc = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
/* версия рантайма — только для шапки отчёта (добор-4) */
const APP_VER = 'версия ' + ((appSrc.match(/APP_VERSION\s*=\s*'([^']+)'/) || [])[1] || '?');
const engStart = appSrc.indexOf('const ENGINES = {');
if (engStart < 0) { console.error('check-engines: не найден const ENGINES в js/app.js'); process.exit(2); }
const engBlock = appSrc.slice(engStart, appSrc.indexOf('\n};', engStart) + 2);
const ENGINES = vm.runInNewContext('(' + engBlock.replace(/^const ENGINES = /, '').replace(/;\s*$/, '') + ')');

/* ---------- 2. Эталонная таблица REF (volkswagenclub.net, чтение 2026-10-30;
   добор блока N — 29 карточек engine_detail.php + 7 строк engines_list, 2026-10-30) ----------
   Поля: id — номер карточки engine_detail.php (null = данных карточки нет,
   строка только из выдержки ETKA-таблицы id=5557); fuel P/D; ccm; kw; ps;
   apps — дословные строки «документированного применения» из карточки
   (источник: KS 50003929, страницы указаны); etka — строка(-и) ETKA-таблицы
   id=5557 (формат «МОДЕЛЬ MM/YY→MM/YY примечание»); src — первоисточники.
   Пустые apps = карточка не прочитана (не «применимости нет»!).          */
const KS = 'ms-motorservice KS 50003929';
const REF = [
    { code: '1F', id: 31, fuel: 'P', ccm: 1595, kw: 55, ps: 75, nm: 125, comp: '9:1', bs: '81×77.4',
      apps: ['Caddy II Typ 9K (9K9B 11.95→05.97, 9K9A 11.95→05.97)', 'Polo III 6N/6N2 (6V2 Classic 11.95→09.97)', 'Passat 08.88→07.90'],
      etka: ['CADDY 11/95→05/97', 'CADDY F.. 09/96→05/97', 'POLO 11/95→09/97', 'POLO AZ.,GH. 10/94→04/96', 'POLO RP. 10/94→04/96'],
      src: KS + ' стр.2350, 2408, 2428 + TAS; id=5557 стр.1' },
    { code: '1Y', id: null, fuel: 'D', ccm: 1896, kw: 47, ps: 64, nm: null, comp: null, bs: null,
      apps: [], etka: ['CADDY 11/95→06/03 DIESEL', 'CADDY RA. от 10/05 DIESEL', 'POLO RA. 01/96→10/96 DIESEL', 'POLO RA. от 10/05 DIESEL'],
      src: 'id=5557 стр.1 (ETKA-таблица)' },
    { code: '1Z', id: 38, fuel: 'D', ccm: 1896, kw: 66, ps: 90, nm: 202, comp: '19.5:1', bs: '79.5×95.5',
      apps: ['Golf III Van (1H1) 08.91→09.97 (KS стр.2432)', 'Passat B3/B4 (3A2) 10.93→07.96 (KS стр.2387)', 'Passat B3/B4 Variant (3A5) 10.93→07.96 (KS стр.2388)'],
      etka: ['CADDY 10/96→09/00 TDI'],
      src: KS + ' + TAS (opendata.astra.admin.ch); id=5557 стр.1' },
    { code: '1W', id: null, fuel: 'D', ccm: 1400, kw: 35, ps: 48, nm: null, comp: null, bs: null,
      apps: [], etka: ['POLO 10/90→07/94 DIESEL'],
      src: 'id=5557 стр.1 (ETKA-таблица)' },
    { code: '2G', id: 41, fuel: 'P', ccm: 1272, kw: 40, ps: null, nm: null, comp: '9:1', bs: '75×72',
      apps: ['Polo 86C (вне охвата каталога)'], etka: [], src: KS },
    { code: 'AAV', id: 50, fuel: 'P', ccm: 1272, kw: 40, ps: null, nm: null, comp: '9.2:1', bs: '75×72',
      apps: ['Polo 86C (вне охвата каталога)'], etka: [], src: KS },
    { code: 'AAK', id: 47, fuel: 'P', ccm: 1043, kw: 33, ps: null, nm: null, comp: '9.5:1', bs: '75×59',
      apps: ['Polo 86C (вне охвата каталога)'], etka: [], src: KS },
    { code: 'AAU', id: 49, fuel: 'P', ccm: 1043, kw: 33, ps: null, nm: null, comp: '10:1', bs: '75×59',
      apps: ['Polo 86C (вне охвата каталога)'], etka: [], src: KS },
    { code: 'ACM', id: 57, fuel: 'P', ccm: 1043, kw: 33, ps: null, nm: null, comp: '10:1', bs: '75×59',
      apps: ['Polo 86C (вне охвата каталога)'], etka: [], src: KS },
    { code: 'ACR', id: 58, fuel: 'P', ccm: 1595, kw: 53, ps: null, nm: null, comp: null, bs: null,
      apps: ['требует проверки применимости (вне охвата каталога)'], etka: [], src: KS },
    { code: 'ABU', id: 54, fuel: 'P', ccm: 1598, kw: 55, ps: 75, nm: 126, comp: '9.3:1', bs: '76.5×86.9',
      apps: ['Golf III (1H1) 09.92→09.94 (KS стр.2359)', 'Vento (1H2) 09.92→09.94 (KS стр.2426)'],
      etka: [], src: KS + ' стр.2359, 2426 + volkswagen-newsroom.com (motor-versions-golf-3) + clubvw.org.au («ABU, 1600, I4, P, 56, 75, Golf, Vento, 1992, 1994»; добор-3 — второй источник на 1.6/75)' },
    { code: 'ADX', id: 64, fuel: 'P', ccm: 1296, kw: 40, ps: 54, nm: null, comp: '10:1', bs: '76.5×70.5',
      apps: ['Polo III 6N/6N2 (6N1) 10.94→04.97 (KS стр.2407)'],
      etka: [], src: KS + ' стр.2407' },
    { code: 'AEA', id: 66, fuel: 'P', ccm: 1598, kw: 55, ps: 75, nm: 126, comp: '9.8:1', bs: '76.5×86.9',
      apps: ['Golf III (1H1) 10.94→06.95 (KS стр.2359)', 'Polo III 6N/6N2 (6N1) 10.94→10.99 и 08.95→10.99 (KS стр.2407)', 'Vento (1H2) 10.94→06.95 (KS стр.2426)'],
      etka: [], src: KS + ' стр.2359, 2407, 2426' },
    { code: 'AEE', id: 67, fuel: 'P', ccm: 1598, kw: 55, ps: 75, nm: 126, comp: '9.8:1', bs: '76.5×86.9',
      apps: ['Caddy II MPV (9K9B) 06.97→09.00 (KS стр.2350)', 'Caddy II Pickup (9U7) 06.96→12.00 (KS стр.2350)',
             'Caddy II Box Body/MPV (9K9A) 06.97→09.00 (KS стр.2428)', 'Golf III (1H1) 07.95→08.97 (KS стр.2359)',
             'Polo III 6N/6N2 (6N1) 07.95→10.99 (KS стр.2407)', 'Polo III Classic (6V2) 09.97→09.01 (KS стр.2408)',
             'Polo Variant (6V5) 05.97→09.01 (KS стр.2412)', 'Polo Van Estate Van (6V5) 09.97→12.98 (KS стр.2443)',
             'Vento (1H2) 07.95→09.98 (KS стр.2426)'],
      etka: [], src: KS + ' стр.2350, 2359, 2407-2408, 2412, 2426, 2428, 2443 (карточка id=67 прочитана полностью, добор-3 2026-10-30)' },
    { code: 'AEF', id: 68, fuel: 'D', ccm: 1896, kw: 47, ps: 64, nm: 124, comp: '22.5:1', bs: '79.5×95.5',
      siteLabel: '1.9 D',
      apps: ['Caddy II Pickup (9U7) 06.96→12.00 (KS стр.2350)', 'Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2402)', 'Polo III 6N/6N2 (6N1) 10.94→10.99 (KS стр.2407)'],
      etka: [], src: KS + ' стр.2350, 2402, 2407 + workshop-manuals.com (Polo Mk3 diesel engine data)' },
    { code: 'AEH', id: 69, fuel: 'P', ccm: 1595, kw: 74, ps: 101, nm: 145, comp: '10.2:1', bs: '81×77.4',
      apps: ['Golf IV (1J) — только (workshop-manuals.com + volkswagen-newsroom.com; KS-страниц карточка id=69 не цитирует)'],
      etka: [], src: 'workshop-manuals.com + volkswagen-newsroom.com (карточка id=69 прочитана полностью, добор-3 2026-10-30)' },
    { code: 'AEK', id: 70, fuel: 'P', ccm: 1595, kw: 74, ps: 101, nm: 140, comp: '10.3:1', bs: '81×77.4',
      apps: ['Golf III (1H1) 07.95→12.95 (KS стр.2359)', 'Golf III Cabriolet (1E7) 10.94→12.95 (KS стр.2360)', 'Golf III Variant (1H5) 07.94→12.95 (KS стр.2361)',
             'Passat B3/B4 (3A2) 10.94→12.95 (KS стр.2386)', 'Passat B3/B4 Variant (3A5) 07.94→12.95 (KS стр.2387)', 'Vento (1H2) 10.94→12.95 (KS стр.2426)'],
      etka: [], src: KS + ' стр.2359-2361, 2386-2387, 2426 + volkswagen-newsroom.com' },
    { code: 'AEP', id: 71, fuel: 'P', ccm: 1984, kw: 79, ps: null, nm: null, comp: '10.4:1', bs: '82.5×92.8',
      apps: ['2.0 GL — к 6N/9K не относится'], etka: [], src: KS },
    { code: 'AER', id: 72, fuel: 'P', ccm: 999, kw: 37, ps: 50, nm: 86, comp: '10.5:1', bs: '67.1×70.6',
      apps: ['Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2381)', 'Polo III 6N/6N2 (6N1) 09.96→10.99 (KS стр.2406)'],
      etka: ['POLO 09/96→12/99 (Wikipedia «1.0 R4: 37 kW»: Polo Mk3 AER 09/96-12/99)'],
      src: KS + ' стр.2381, 2406 + TAS (opendata.astra.admin.ch) (карточка id=72 прочитана полностью, добор-3 2026-10-30)' },
    /* --- добор блока N: карточки прочитаны 2026-10-30 (engine_detail.php + engines_list.php?kols=2..6) --- */
    { code: 'AEV', id: 75, fuel: 'P', ccm: 1043, kw: 33, ps: 45, nm: null, comp: '10:1', bs: '75×59',
      apps: ['Polo III 6N/6N2 (6N1) 10.94→09.96 (KS стр.2406)', 'Polo Van Hatchback Van (6N1) 10.94→12.99 (KS стр.2443)'],
      etka: [], src: KS + ' стр.2406, 2443 (карточка id=75 «AEV 45 1.0 33 kW»)' },
    { code: 'AFH', id: 78, fuel: 'P', ccm: 1390, kw: 74, ps: 101, nm: 128, comp: '10.5:1', bs: '76.5×75.6',
      apps: ['Polo III 6N/6N2 (6N1) 04.96→10.99 (KS стр.2406)'],
      etka: [], src: KS + ' стр.2406 + TAS (карточка id=78 «AFH 100 1.4 16V 74 kW»)' },
    { code: 'AFK', id: 79, fuel: 'P', ccm: 1390, kw: 74, ps: 101, nm: 128, comp: '10.5:1', bs: '76.5×75.6',
      apps: ['Lupo I (6X1, 6E1) 08.99→07.05 (KS стр.2382)', 'Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2401)'],
      etka: [], src: KS + ' стр.2382, 2401 + TAS (карточка id=79)' },
    { code: 'AFN', id: 80, fuel: 'D', ccm: 1896, kw: 81, ps: 110, nm: 235, comp: '19.5:1', bs: '79.5×95.5',
      apps: ['Golf III (1H1) 04.96→08.97 (KS стр.2360)', 'Golf III Cabriolet (1E7) 07.96→05.98 (KS стр.2360)',
             'Golf III Variant (1H5) 04.96→04.99 (KS стр.2361)', 'Golf IV Cabriolet (1E7) 06.98→06.02 (KS стр.2363)',
             'Golf Van III Variant (1H5) 05.96→02.99 (KS стр.2435)',
             'Passat B3/B4, Passat B5, Sharan, Vento (сводка карточки; строки не прочитаны)',
             'Polo III 6N/6N2 (подтверждено сводкой карточки id=80; интервальная строка не прочитана)',
             'Polo Mk3 Classic/Variant: AFN от 06/98 (Wikipedia «List of discontinued Volkswagen Group diesel engines»; строка обрезана)'],
      etka: [], src: KS + ' стр.2360-2361, 2363, 2435 + TAS' },
    { code: 'AFT', id: 81, fuel: 'P', ccm: 1595, kw: 74, ps: 101, nm: 140, comp: '10.5:1', bs: '81×77.4',
      apps: ['Golf III (1H1) 12.95→08.97 (KS стр.2359)', 'Golf III Cabriolet (1E7) 12.95→02.98 (KS стр.2360)',
             'Golf III Variant (1H5) 01.96→04.99 (KS стр.2361)', 'Golf IV Cabriolet (1E7) 06.98→06.02 (KS стр.2363)',
             'Passat B3/B4 (3A2) 12.95→08.96 (KS стр.2386)', 'Passat B3/B4 Variant (3A5) 12.95→12.95 (KS стр.2387)',
             'Polo Variant (6V5) 05.97→09.01 (KS стр.2412)', 'Vento (сводка карточки; строка не прочитана)'],
      etka: [], src: KS + ' стр.2359-2361, 2363, 2386-2387, 2412 + TAS' },
    { code: 'AGD', id: 83, fuel: 'D', ccm: 1896, kw: 47, ps: 64, nm: 124, comp: '19.5:1', bs: '79.5×95.5',
      apps: ['Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2402)', 'Polo III 6N/6N2 (6N1) 07.96→10.99 (KS стр.2407)'],
      etka: [], src: KS + ' стр.2402, 2407 + workshop-manuals.com (карточка id=83)' },
    { code: 'AGP', id: 89, fuel: 'D', ccm: 1896, kw: 50, ps: 68, nm: 133, comp: '19.5:1', bs: '79.5×95.5',
      siteLabel: '1.9 SDI',
      apps: ['Bora I (1J2) 10.98→05.05 (KS стр.2347)', 'Golf IV (1J1) 08.97→06.05 (KS стр.2362)',
             'Golf IV Variant (1J5) 05.99→06.06 (KS стр.2363)', 'Polo III Classic (6V2) 08.99→01.02 (KS стр.2408)',
             'Polo Variant (6V5) 08.99→09.01 (KS стр.2413)', 'Polo Van Estate Van (6V5) 10.99→09.01 (KS стр.2443)'],
      etka: [], src: KS + ' стр.2347, 2362-2363, 2408, 2413, 2443 (карточка id=89 «AGP 1.9 SDI 50 kW»)' },
    { code: 'AGR', id: 90, fuel: 'D', ccm: 1896, kw: 66, ps: 90, nm: 210, comp: '19.5:1', bs: '79.5×95.5',
      apps: ['Bora I (1J2) 11.98→04.02 (KS стр.2347)', 'Golf IV (1J1) 07.98→04.02 (KS стр.2362)',
             'Golf IV Variant (1J5) 05.99→04.02 (KS стр.2364)', 'Golf IV Van (1J1) 05.00→09.02 (KS стр.2433)'],
      etka: ['POLO 10/99→09/01 TDI (ETKA-таблица 03.08.2015)', 'POLO «RA.» 10/05- TDI (ETKA-таблица 03.08.2015)', 'BORA 10/98→05/05 TDI (ETKA-таблица 03.08.2015)', 'GOLF 10/97-… TDI (ETKA-таблица 03.08.2015)'], src: KS + ' стр.2347, 2362, 2364, 2433 (карточка id=90) + ETKA-таблица 03.08.2015 (зеркала slideshare 201329802 / fr.scribd 849891594 / es.scribd 714578221; добор-4 2026-10-30: строка POLO TDI 10/99-09/01)' },
    { code: 'AHB', id: 94, fuel: 'D', ccm: 1715, kw: 42, ps: 57, nm: null, comp: '19.5:1', bs: '79.5×86.4',
      apps: ['Caddy II MPV (9K9B) 07.96→09.00 (KS стр.2350)', 'Caddy II Box Body/MPV (9K9A) 07.96→09.00 (KS стр.2428)'],
      etka: [], src: KS + ' стр.2350, 2428 (карточка id=94)' },
    { code: 'AHG', id: 97, fuel: 'D', ccm: 1716, kw: 42, ps: 57, nm: 112, comp: '19.5:1', bs: '79.5×86.4',
      apps: ['Polo III 6N/6N2 (workshop-manuals.com + volkswagen-newsroom.com; KS-страниц и интервалов карточка не даёт)'],
      etka: [], src: 'workshop-manuals.com + volkswagen-newsroom.com + TAS (карточка id=97)' },
    { code: 'AHS', id: 100, fuel: 'P', ccm: 1598, kw: 55, ps: 75, nm: null, comp: '9.8:1', bs: '76.5×86.9',
      apps: ['Polo III 6N/6N2 (6N1) 07.95→10.99 (KS стр.2407)'],
      etka: [], src: KS + ' стр.2407 (карточка id=100 «AHS 75 1.6 55 kW»)' },
    { code: 'AHT', id: 101, fuel: 'P', ccm: 997, kw: 37, ps: 50, nm: 84, comp: '10.7:1', bs: '72×61.2',
      apps: ['Lupo I (6X1, 6E1) 10.98→05.00 (KS стр.2381)'],
      etka: [], src: KS + ' стр.2381 + TAS (карточка id=101)' },
    { code: 'AHW', id: 102, fuel: 'P', ccm: 1390, kw: 55, ps: 75, nm: null, comp: '10.5:1', bs: '76.5×75.6',
      apps: ['Bora I (1J2) 03.00→05.05 (KS стр.2347)', 'Bora Variant (1J6) 09.01→05.05 (KS стр.2348)',
             'Golf IV (1J1) 10.97→05.04 (KS стр.2361)', 'Golf IV Variant (1J5) 05.99→06.06 (KS стр.2363)',
             'Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2382)',
             'Polo III 6N/6N2 (подтверждено сводкой карточки id=102; интервальная строка не прочитана)',
             'Polo (clubvw.org.au: «AHW, 1390, I4, P, 55, 75, Lupo, Polo, Golf, Jetta»; добор-3)'],
      etka: ['POLO 10/99→09/01 16V (ETKA-таблица 03.08.2015)', 'BORA 10/98→05/05 16V (ETKA-таблица 03.08.2015)', 'GOLF 10/97→06/06 16V (ETKA-таблица 03.08.2015)', 'LUPO 01/99→07/05 16V (ETKA-таблица 03.08.2015)'], src: KS + ' стр.2347-2348, 2361, 2363, 2382 + TAS + clubvw.org.au + Elsa (AHW 1390 55(74) MPI) + ETKA-таблица 03.08.2015 (строка POLO 10/99-09/01 16V — добор-4 2026-10-30; зеркало en.volkswagenclub.net id=102)' },
    { code: 'AJV', id: 108, fuel: 'P', ccm: 1598, kw: 88, ps: 120, nm: 148, comp: '10.6:1', bs: '76.5×86.9',
      apps: ['Polo III 6N/6N2 (6N1) 09.98→10.99 (KS стр.2406)'],
      etka: [], src: KS + ' стр.2406 + workshop-manuals.com + newsroom + TAS (карточка id=108 «AJV 120 1.6 16V GTI 88 kW»)' },
    { code: 'AKK', id: 109, fuel: 'P', ccm: 1390, kw: 44, ps: null, nm: 116, comp: '10.4:1', bs: '76.5×75.6',
      apps: ['Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2401)', 'Polo Variant (6V5) 05.97→09.01 (KS стр.2412) — интервал группы 6V5 по карточке id=109', 'Polo III 6N/6N2 (en.volkswagenclub.net id=109 + volkswagen-newsroom.com motor-versions-polo-3-profile-19148)'],
      etka: ['POLO 10/99→09/01 (ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf))'],
      src: 'en.volkswagenclub.net id=109 (карточка дочитана полностью, добор-4 2026-10-30: 1390 см³, 44 кВт/60 PS @4700, 116 Нм @2800, 10.4:1, 76.5×75.6) + engines_list.php?kols=3 + ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf); «Volkswagen Engine Codes and Models»: Caddy 1999-2001 (добор-3 2026-10-30)' },
    { code: 'AKL', id: 110, fuel: 'P', ccm: 1595, kw: 74, ps: 101, nm: 145, comp: '10.2:1', bs: '81×77.4',
      apps: ['Golf IV (1J) — только (workshop-manuals.com + newsroom; KS-страниц карточка не цитирует)'],
      etka: [], src: 'workshop-manuals.com + volkswagen-newsroom.com + TAS (карточка id=110)' },
    { code: 'AKP', id: 112, fuel: 'P', ccm: 1390, kw: 40, ps: 54, nm: null, comp: '10.2:1', bs: '76.5×75.6',
      apps: ['Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2401)', 'Polo Variant (6V5) 12.98→09.01 (KS стр.2412)'],
      etka: [], src: KS + ' стр.2401, 2412 (карточка id=112 «AKP 1.4 40 kW»)' },
    { code: 'AKQ', id: 113, fuel: 'P', ccm: 1390, kw: 55, ps: 75, nm: 126, comp: '10.5:1', bs: '76.5×75.6',
      apps: ['Bora I (1J2) 03.00→05.05 (KS стр.2347)', 'Bora Variant (1J6) 09.01→05.05 (KS стр.2348)',
             'Golf IV (1J1) 10.97→05.04 (KS стр.2361)', 'Golf IV Variant (1J5) 05.99→06.06 (KS стр.2363)',
             'Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2382)'],
      etka: [], src: KS + ' стр.2347-2348, 2361, 2363, 2382 + TAS (карточка id=113; Polo/Caddy в применении НЕТ)' },
    { code: 'AKU', id: 116, fuel: 'D', ccm: 1716, kw: 44, ps: 60, nm: 115, comp: '19.5:1', bs: '79.5×86.4',
      apps: ['Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2382)', 'Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2402)',
             'Polo III 6N/6N2 (6N1) 08.97→10.99 (KS стр.2407)'],
      etka: [], src: KS + ' стр.2382, 2402, 2407 + newsroom + TAS (карточка id=116)' },
    { code: 'AKW', id: 117, fuel: 'D', ccm: 1715, kw: 44, ps: 60, nm: 115, comp: '19.5:1', bs: '79.5×86.4',
      apps: ['Polo III Classic (6V2) 07.97→09.01 (KS стр.2408)', 'Polo Variant (6V5) 08.97→09.01 (KS стр.2413)'],
      etka: ['POLO 11/97→08/99 SDI (ETKA-таблица 03.08.2015: AKW 44 кВт/60 л.с., 1,70)'],
      src: 'ETKA-таблица 03.08.2015 + Elsa (AKW 1715 44(59) SAUGDIESEL) + auto-data.net (Polo III Classic 1.7 SDI 60 Hp/115 Нм, 1997-1999) ПРОТИВ ' + KS + ' стр.2408, 2413 (карточка id=117: 42 кВт/57)' },
    { code: 'ALD', id: 118, fuel: 'P', ccm: 999, kw: 37, ps: null, nm: 86, comp: '10.7:1', bs: '67.1×70.6',
      apps: ['Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2381)', 'Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2401)', 'Polo Playa 05.99→05.02 (KS стр.2410) — вне охвата', 'Polo III 6N/6N2 (en.volkswagenclub.net id=118 + TAS opendata.astra.admin.ch)'],
      etka: ['LUPO 05/99→07/05 (ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf))', 'POLO 01/00→12/01 (Wikipedia «1.0 R4: 37 kW», Polo Mk3: ANV/ALD/AUC)'],
      src: 'en.volkswagenclub.net id=118 (карточка дочитана полностью, добор-4 2026-10-30: 999 см³, 37 кВт/50 PS @5000, 86 Нм @3000, 10.7:1, 67.1×70.6) + engines_list.php?kols=4 + ETKA-таблица 03.08.2015 + Wikipedia (добор-3 2026-10-30)' },
    { code: 'ALH', id: 120, fuel: 'D', ccm: 1896, kw: 66, ps: 90, nm: 210, comp: '19.5:1', bs: '79.5×95.5',
      apps: ['Golf IV (1J) — только (workshop-manuals.com + newsroom; KS-страниц карточка не цитирует)'],
      etka: ['POLO 10/99→09/01 TDI (ETKA-таблица 03.08.2015; зеркала fr.scribd 849891594, es.scribd 714578221, slideshare 201329802)', 'CADDY 09/00→06/03 TDI (ETKA-таблица 03.08.2015; строка есть и в экспорте et_mkb.frm 07.03.2010)', 'BORA 09/98→05/05 TDI (ETKA-таблица 03.08.2015)', 'GOLF 10/97- TDI (экспорт et_mkb.frm 07.03.2010)', 'JETTA «RA.» 10/00- TDI (экспорт et_mkb.frm 07.03.2010)', 'GOLF 12/98→09/00 TDI; JETTA «USA»/«CDN» 11/98-; NEW BEETLE 01/98→06/00 TDI (североамериканский экспорт ETKA, vaglinks.com/Docs/Catalogues/ETKA_VW_Engine_Codes.pdf)'], src: 'workshop-manuals.com + volkswagen-newsroom.com (карточка id=120) + ETKA-таблица 03.08.2015 + экспорт et_mkb.frm 07.03.2010 + североамериканский ETKA-экспорт (добор-4 2026-10-30)' },
    { code: 'ALL', id: 121, fuel: 'P', ccm: 999, kw: 37, ps: null, nm: 86, comp: '10.7:1', bs: '67.1×70.6',
      apps: ['Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2381)', 'Polo III 6N/6N2 (6N1) 09.96→10.99 (KS стр.2407)', 'Polo III 6N/6N2 (en.volkswagenclub.net id=121 + TAS opendata.astra.admin.ch)'],
      etka: ['LUPO 10/98→05/00 (ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf))', 'POLO 08/97→12/99 (ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf))'],
      src: 'en.volkswagenclub.net id=121 (карточка дочитана полностью, добор-4 2026-10-30: 999 см³, 37 кВт/50 PS @5000, 86 Нм @3000, 10.7:1, 67.1×70.6) + engines_list.php?kols=4 + ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf) (добор-3 2026-10-30)' },
    { code: 'ALM', id: 122, fuel: 'P', ccm: 1598, kw: 55, ps: 75, nm: 135, comp: '9.8:1', bs: '76.5×86.9',
      apps: ['Polo III Classic (6V2) 09.97→09.01 (KS стр.2408)', 'Polo Variant (6V5) 10.99→09.01 (KS стр.2413)'],
      etka: [], src: KS + ' стр.2408, 2413 + TAS (карточка id=122 «ALM 75 1.6 55 kW»)' },
    { code: 'AMF', id: 125, fuel: 'D', ccm: 1422, kw: 55, ps: 75, nm: 195, comp: '19.5:1', bs: '79.5×95.5',
      apps: ['Lupo I (6X1, 6E1) 01.99→07.05 (KS стр.2382)', 'Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2401)',
             'Polo 9N/9N3 (9N_) 10.01→06.05 (KS стр.2403) — вне охвата', 'Polo IV Saloon (9N4) 01.03→12.07 (KS стр.2410) — вне охвата'],
      etka: [], src: KS + ' стр.2382, 2401, 2403, 2410 + workshop-manuals.com + newsroom (карточка id=125)' },
    { code: 'ANM', id: 131, fuel: 'P', ccm: null, kw: 74, ps: 101, nm: null, comp: null, bs: null,
      apps: ['Lupo I (6X1, 6E1) 08.99→07.05 (KS стр.2382)'],
      etka: ['LUPO «SRE» 10/98→05/99 16V, 1,40, 74 кВт/100 л.с. (ETKA-таблица 03.08.2015; зеркала es.scribd 714578221, fr.scribd 849891594, slideshare 201329802, scribd 358450579 — во всех четырёх строка POLO у ANM ОТСУТСТВУЕТ)'], src: KS + ' стр.2382 (карточка id=131 скудная: только кВт; объём сайт не приводит) + ETKA-таблица 03.08.2015 («ANM 74 100 1,40 4 10/98-05/99 LUPO SRE 16V» — добор-4 2026-10-30)' },
    { code: 'ANV', id: 135, fuel: 'P', ccm: 999, kw: 37, ps: null, nm: null, comp: '10.7:1', bs: '67.1×70.6',
      apps: ['Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2381) — ЕДИНСТВЕННОЕ применение по карточке id=135', 'Polo Mk3 01/00→12/01 (Wikipedia «1.0 R4: 37 kW»: ANV/ALD/AUC) — источник против карточки сайта'], etka: ['LUPO 05/99→05/03 (ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf))', 'POLO 01/00→12/01 (Wikipedia «1.0 R4: 37 kW», Polo Mk3: ANV/ALD/AUC)'],
      src: 'en.volkswagenclub.net id=135 (карточка дочитана полностью, добор-4 2026-10-30: 999 см³, 37 кВт/50 PS @5000, момент не указан — «Torque is not established for this precise variant», 10.7:1, 67.1×70.6; в блоке «Used on the vehicles» только Lupo) + engines_list.php?kols=4 + ETKA-таблица 03.08.2015 + Wikipedia (добор-3 2026-10-30)' },
    { code: 'ANW', id: 136, fuel: 'P', ccm: 1390, kw: 44, ps: null, nm: 116, comp: '10.4:1', bs: '76.5×75.6',
      apps: ['Polo Variant (6V5) 05.97→09.01 (KS стр.2412) — интервал группы 6V5 по карточке id=136', 'Polo III 6N/6N2 (en.volkswagenclub.net id=136 + volkswagen-newsroom.com motor-versions-polo-3-profile-19148)'],
      etka: ['POLO 10/99→08/00 (ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf))'],
      src: 'en.volkswagenclub.net id=136 (карточка дочитана полностью, добор-4 2026-10-30: 1390 см³, 44 кВт/60 PS @4700, 116 Нм @2800, 10.4:1, 76.5×75.6) + engines_list.php?kols=4 + ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf) + Wikipedia «1.4 R4: 40-44 kW» (44 кВт/116 Нм); «Volkswagen Engine Codes and Models»: Caddy 1999-2003 (добор-3 2026-10-30)' },
    { code: 'ANX', id: 137, fuel: 'P', ccm: 1390, kw: 40, ps: 54, nm: null, comp: '10.2:1', bs: '76.5×75.6',
      apps: ['Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2401)', 'Polo III Classic (6V2) 01.98→08.99 (KS стр.2408)'],
      etka: [], src: KS + ' стр.2401, 2408 (карточка id=137 «ANX 1.4 40 kW»)' },
    { code: 'APE', id: 141, fuel: 'P', ccm: 1390, kw: 55, ps: 75, nm: null, comp: '10.5:1', bs: '76.5×75.6',
      apps: ['Bora I (1J2) 03.00→05.05 (KS стр.2347)', 'Bora Variant (1J6) 09.01→05.05 (KS стр.2348)',
             'Golf IV (1J1) 10.97→05.04 (KS стр.2361)', 'Golf IV Variant (1J5) 05.99→06.06 (KS стр.2363)',
             'Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2382)',
             'Polo III 6N/6N2 (подтверждено сводкой карточки id=141; интервальная строка не прочитана)',
             'Caddy 9K 1999→2003 1.4 («Volkswagen Engine Codes and Models», «Caddy Pickup 1999-2000 1.4 APE»; добор-3)'],
      etka: ['POLO 10/99→12/00 16V (ETKA-таблица 03.08.2015; зеркала es.scribd 714578221, fr.scribd 849891594)', 'BORA 05/99→04/01 16V (ETKA-таблица 03.08.2015; в редакции 05/99→05/00)', 'GOLF 05/99→05/00 16V (ETKA-таблица 03.08.2015)', 'LUPO 05/99→09/00 16V (ETKA-таблица 03.08.2015)', 'CADDY 16V (ETKA-таблица 03.08.2015 — строка CADDY в сниппете зеркала, интервал не извлечён)'], src: KS + ' стр.2347-2348, 2361, 2363, 2382 + TAS + en.volkswagenclub.net id=141 (сводка карточки: «applications: Bora / I A4 1J; Golf / IV A4 Typ 1J; Lupo; Polo / III Mk III Typ 6N/6N2»; добор-4 2026-10-30) + ETKA-таблица 03.08.2015' },
    { code: 'AQM', id: 149, fuel: 'D', ccm: 1896, kw: 50, ps: 68, nm: 133, comp: '19.5:1', bs: '79.5×95.5',
      apps: ['Bora I (1J2) 10.98→05.05 (KS стр.2347)',
             'Golf IV (1J1) 08.97→06.05 (KS стр.2362); Variant (1J5) 05.99→06.06 (стр.2363); Van 11.98→05.04 (стр.2432); Van Variant 05.99→05.06 (стр.2433)',
             'Polo III 6N/6N2 (подтверждено сводкой карточки id=149; интервальная строка не прочитана)'],
      etka: ['POLO 10/99→09/01 SDI (ETKA-таблица 03.08.2015; зеркала es.scribd 714578221, fr.scribd 849891594, scribd 358450579)', 'POLO 07/00→09/01 (ETKA-таблица 03.08.2015)', 'BORA 11/98→05/05 SDI (ETKA-таблица 03.08.2015)', 'GOLF 11/98→05/06 SDI (ETKA-таблица 03.08.2015)', 'JETTA TAXI FL2 02/02- (ETKA-таблица 03.08.2015)'], src: KS + ' стр.2347, 2362-2363, 2432-2433 + newsroom + TAS + ETKA-таблица 03.08.2015 (две строки POLO — добор-4 2026-10-30; en.volkswagenclub.net id=149)' },
    { code: 'ASV', id: 163, fuel: 'D', ccm: 1896, kw: 81, ps: 110, nm: 235, comp: '19.5:1', bs: '79.5×95.5',
      apps: ['Bora I (1J2) 10.98→06.01 (KS стр.2347)', 'Bora Variant (1J6) 05.99→06.01 (KS стр.2348)',
             'Golf IV (1J1) 08.97→05.04 (KS стр.2362)', 'Golf IV Variant (1J5) 05.99→06.01 (KS стр.2363)',
             'Golf Van IV Variant (1J5) 05.99→05.06 (KS стр.2433)',
             'Polo III 6N/6N2 (подтверждено сводкой карточки id=163; интервальная строка не прочитана)'],
      etka: ['POLO 10/99→09/01 TDI TRENDLINE (ETKA-таблица 03.08.2015; зеркала slideshare 201329802, fr.scribd 849891594)', 'BORA 05/00→05/05 TDI (ETKA-таблица 03.08.2015)', 'GOLF 02/00→05/06 TDI (ETKA-таблица 03.08.2015)'], src: KS + ' стр.2347-2348, 2362-2363, 2433 + newsroom + TAS + ETKA-таблица 03.08.2015 (строка POLO TDI TRENDLINE — добор-4 2026-10-30; en.volkswagenclub.net id=163)' },
    { code: 'AUA', id: 178, fuel: 'P', ccm: 1390, kw: 55, ps: 75, nm: 126, comp: '10.5:1', bs: '76.5×75.6',
      apps: ['Caddy II MPV (9K9B) 08.00→01.04 (KS стр.2350)', 'Caddy II Box Body/MPV (9K9A) 08.00→01.04, 11.98→12.03 (KS стр.2428)',
             'Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2382)', 'Polo III 6N/6N2 (6N2) 05.00→09.01 (KS стр.2401)',
             'Polo III Classic (6V2) 10.99→09.01 (KS стр.2408)', 'Polo Variant (6V5) 05.00→09.01 (KS стр.2412)',
             'Polo Van Estate Van (6V5) 06.00→09.01 (KS стр.2443)', 'Polo 9N (9N_) 10.01→05.08 (KS стр.2403) — вне охвата'],
      etka: ['CADDY 09/00→06/03 16V (ETKA-таблица 03.08.2015)', 'LUPO 05/00→04/02 16V (ETKA-таблица 03.08.2015)'], src: KS + ' стр.2350, 2382, 2401, 2403, 2408, 2412, 2428, 2443 + workshop-manuals.com + newsroom + TAS + ETKA-таблица 03.08.2015 (добор-4 2026-10-30)' },
    { code: 'AUC', id: 180, fuel: 'P', ccm: 999, kw: 37, ps: null, nm: 86, comp: '10.7:1', bs: '67.1×70.6',
      apps: ['Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2381)', 'Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2401)', 'Polo III 6N/6N2 (en.volkswagenclub.net id=180 + TAS opendata.astra.admin.ch)'], etka: ['POLO 01/00→12/01 (Wikipedia «1.0 R4: 37 kW», Polo Mk3: ANV/ALD/AUC)'],
      src: 'en.volkswagenclub.net id=180 (карточка дочитана полностью, добор-4 2026-10-30: 999 см³, 37 кВт/50 PS @5000, 86 Нм @3000, 10.7:1, 67.1×70.6) + engines_list.php?kols=5 + Wikipedia + clubvw.org.au («Lupo, Polo, 2000-2004») (добор-3 2026-10-30)' },
    { code: 'AUD', id: 181, fuel: 'P', ccm: 1390, kw: 44, ps: null, nm: 116, comp: '10.4:1', bs: '76.5×75.6',
      apps: ['Caddy II MPV (9K9B) 09.00→06.03 (KS стр.2350)', 'Caddy II Box Body/MPV (9K9A) 11.95→01.04 (KS стр.2428)', 'Lupo I (6X1, 6E1) 10.00→07.05 (KS стр.2382)', 'Polo III 6N/6N2 (6N2) 10.99→09.01 (KS стр.2401)', 'Polo Variant (6V5) 05.97→09.01 (KS стр.2412)', 'Polo III 6N/6N2 (en.volkswagenclub.net id=181 + newsroom + TAS)'], etka: ['CADDY 09/00→06/03 (ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf))', 'LUPO 09/00→07/05 (ETKA-экспорт 21.01.2014, es.scribd 714578221)'],
      src: 'en.volkswagenclub.net id=181 (карточка дочитана, добор-4 2026-10-30: 1390 см³, 44 кВт/60 PS @4700, 116 Нм @3000, 10.4:1, 76.5×75.6; применение Caddy II 9K9B/9K9A + Lupo + Polo 6N2/6V5) + engines_list.php?kols=5 + ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf) (добор-3 2026-10-30)' },
    { code: 'AYQ', id: 230, fuel: 'D', ccm: 1896, kw: 47, ps: 64, nm: 128, comp: '19.5:1', bs: '79.5×95.5',
      apps: ['Caddy II MPV (9K9B) 11.95→01.04 (KS стр.2350)', 'Caddy II Box Body/MPV (9K9A) 11.95→01.04 (KS стр.2428)'],
      etka: [], src: KS + ' стр.2350, 2428 + TAS (карточка id=230; только Caddy 9K)' },
    /* --- добор, цикл 3 (2026-10-30): коды, которых нет в БД volkswagenclub.net —
       данные из ETKA-таблицы «ETKA - Engine Code» 03.08.2015 (vag-codes.info/files/
       engines/vw-engines.pdf — та же таблица, что manual_download.php?id=5557),
       заводских таблиц Elsa (зеркало elsaonline), Wikipedia и clubvw.org.au.
       ВНИМАНИЕ: в клубных списках (clubvw) встречаются ошибки в кВт (AEX «45»,
       AEY «44», AHB «44») — оттуда берутся только модели/годы. --- */
    { code: 'AEX', id: null, fuel: 'P', ccm: 1390, kw: 44, ps: 60, nm: null, comp: null, bs: null,
      apps: [], etka: ['CADDY 11/95→06/03 MPI (ETKA-таблица 03.08.2015)', 'CADDY 09/96→05/98 (ETKA-таблица 03.08.2015)',
                       'POLO 1995→1999 (Wikipedia «Volkswagen Polo Mk3»: 1.4 8v AEX/AKV/APQ, 44 кВт/60 PS)'],
      src: 'ETKA-таблица 03.08.2015 + Wikipedia «Polo Mk3» и «1.4 R4» (parts prefix 030, ID codes AEX/APQ, 1390 см³) + clubvw.org.au (Polo, Golf, Vento, 1995-1998)' },
    { code: 'AKV', id: null, fuel: 'P', ccm: 1390, kw: 44, ps: 60, nm: null, comp: null, bs: null,
      apps: [], etka: ['POLO 05/97→12/99 (ETKA-таблица 03.08.2015)'],
      src: 'ETKA-таблица 03.08.2015 + Elsa (AKV 1389 44(59) MPI) + Wikipedia «Polo Mk3» (1.4 8v AEX/AKV/APQ, 44 кВт/60 PS)' },
    { code: 'APQ', id: null, fuel: 'P', ccm: 1390, kw: 44, ps: 60, nm: null, comp: null, bs: null,
      apps: [], etka: ['CADDY 11/95→06/03 (ETKA-таблица 03.08.2015)'],
      src: 'ETKA-таблица 03.08.2015 + Wikipedia «1.4 R4» (ID codes AEX/APQ, 1390 см³, prefix 030) и «Polo Mk3»' },
    { code: 'AUR', id: null, fuel: 'P', ccm: 1595, kw: 74, ps: 100, nm: 145, comp: null, bs: null,
      apps: [], etka: ['POLO 03/00→09/01 (ETKA-таблица 03.08.2015)'],
      src: 'ETKA-таблица 03.08.2015 + clubvw.org.au (1595, 74 кВт/99, Polo, Golf, Jetta, Passat, 1997-2004) + Wikipedia «Volkswagen EA827 engine» (1.6: 74 кВт/101 PS @5600, 145 Нм @3800 — AEH; AKL; APF; AUR) + vd Veer Engineering (Polo III 1.6 Variant/Classic)' },
    { code: 'ADZ', id: null, fuel: 'P', ccm: 1781, kw: 66, ps: 90, nm: null, comp: null, bs: null,
      apps: [], etka: ['GOLF 01/94→10/00 (ETKA-таблица 03.08.2015)', 'VENTO 10/93→12/96 (ETKA-таблица 03.08.2015)',
                       'DERBY 10/94→12/94 (зеркало «Ficha Técnica de Motores Volkswagen»; атрибуция спорна, к охвату каталога не относится)'],
      src: 'ETKA-таблица 03.08.2015 + Elsa (ADZ 1781 66(89) Monomotronic) + clubvw.org.au (Golf, Vento, 1994-1997); в зеркалах таблицы есть также строки SEAT Córdoba/Ibiza' },
    { code: 'AEY', id: null, fuel: 'D', ccm: 1896, kw: 47, ps: 64, nm: null, comp: null, bs: null,
      apps: [], etka: ['CADDY 11/95→09/00 SDI (ETKA-таблица 03.08.2015)'],
      src: 'ETKA-таблица 03.08.2015 + Elsa (AEY 1896 47(63)) + clubvw.org.au (модели «Polo, Golf, Vento, Caddy, 1995-1999»; кВт у clubvw ошибочно 44/60)' },
    { code: 'AHU', id: null, fuel: 'D', ccm: 1896, kw: 66, ps: 90, nm: null, comp: null, bs: null,
      apps: [], etka: ['CADDY 10/96→09/00 TDI (ETKA-таблица 03.08.2015)',
                       'POLO Classic/Variant 01/97→08/99 (Wikipedia «List of discontinued Volkswagen Group diesel engines»)'],
      src: 'ETKA-таблица 03.08.2015 + Wikipedia (Polo Mk3 Classic/Variant: AHU 01/97-08/99; Vento/Jetta, Golf) + Elsa (AHU 1896 66(89) VEP) + clubvw.org.au (Golf, Vento, Sharan, Passat, 1996-2000)' },
    { code: 'ALE', id: null, fuel: 'D', ccm: 1896, kw: 66, ps: 90, nm: null, comp: null, bs: null,
      apps: [], etka: ['CADDY 09/97→09/00 TDI (ETKA-таблица 03.08.2015)',
                       'POLO Classic/Variant 11/97→08/99 (Wikipedia «List of discontinued Volkswagen Group diesel engines»)'],
      src: 'ETKA-таблица 03.08.2015 + Wikipedia (Polo Mk3 Classic/Variant: ALE 11/97-08/99; Vento/Jetta 01/97-12/97) + clubvw.org.au («ALE … Polo, Jetta, Caddy, 1997-1999»)' },
];

/* ---------- 3. Адьюдикация спорных кодов (задание «в», 2026-10-30) ----------
   status: «требует ETKA» = правка js/app.js ЗАПРЕЩЕНА до подтверждения;
   «закрыто…» = расхождение снято, данные не меняются;
   «кандидат…» = решение по добавлению кода в ENGINES.                    */
const VERDICTS = {
    'ABU': {
        status: 'закрыто (удалён из ENGINES в 1.13.2)',
        text: 'Решение владельца («одобряю», 2026-10-30) — вариант (а) §11.5: ABU УДАЛЁН из 4 структур js/app.js (ENGINES, ENGINE_FAMILIES.EA111.codes, ENGINE_GEARBOX, KNOWN_ISSUES; версия 1.13.2). Основание: «сирота» — 0 карточек data-src; наше «1.4/60» не подтверждал ни один источник; внешние данные единодушны: KS id=54 (стр.2359, 2426) — ABU = 1598 см³, 55 кВт/75 л.с., только Golf III (1H1) 09.92→09.94 и Vento (1H2) 09.92→09.94; clubvw.org.au — «ABU, 1600, I4, P, 56, 75, Golf, Vento, 1992, 1994» — вне охвата каталога и без опоры в data-src (в отличие от донорских AEH/AKL, которые включены намеренно ради совместимости пружин 1J0 411 105). В блоке X остаётся как «код сайта, которого нет у нас» — верно отсутствующий. Добор-4 2026-10-30: независимое подтверждение — ранний экспорт ETKA et_mkb.frm 07.03.2010 (fr.scribd.com/document/786098516, стр.3) дословно «ABU 55 75 1,60 4 08/92-10/94 GOLF» и «ABU 55 75 1,60 4 08/92-09/94 VENTO»: строк POLO/CADDY нет, 1.6/75 — вне охвата.'
    },
    'ADX': {
        status: 'закрыто (округление)',
        text: 'Расхождения по сути нет: и наши «55 л.с.», и «54 PS» на сайте — это один и тот же мотор 1.3 '
            + '(1296 см³) мощностью 40 кВт. 40 кВт = 54.4 л.с.: сайт округлил вниз (54), VW в заводском '
            + 'обозначении модификации — вверх («Polo 55 1.3», так мотор значится в прайс-листах и '
            + 'каталогах запчастей; подтверждено поиском 2026-10-30). Наше значение 55 л.с. соответствует '
            + 'заводскому обозначению — оставлено без изменений. Применяемость подтверждена: Polo III 6N/6N2 '
            + '(6N1) 10.94→04.97, KS стр.2407. Момент на сайте не дóложен (пусто) — обогащать нечем. Добор-4 2026-10-30: дословная строка ETKA-экспорта 07.03.2010 «ADX 40 54 1,30 4 09/94-07/95 POLO» и «ADX 40 54 1,30 4 07/96-04/97 POLO «ET.»» — 40 кВт = 54.4 л.с., округление подтверждено заводской таблицей.'
    },
    'AEF': {
        status: 'закрыто (маркировка)',
        text: 'Характеристики совпадают полностью: 1896 см³, 47 кВт/64 л.с. Различается только маркировка '
            + 'впрыска: сайт называет мотор «1.9 D 47 kW» (общее обозначение атмосферного дизеля, тип впрыска '
            + 'карточка не фиксирует), у нас — «1.9 SDI». Наше значение опирается на карточки собственного '
            + 'каталога ETKA-происхождения: `028 100 090 KX` «Двигатель в сборе с ГБЦ (1.9 SDI, 47 кВт)» '
            + 'engines:["AEF"] и `028 100 103 LX` «Блок цилиндров (1.9 SDI)» engines:["AEF"] — всего AEF '
            + 'упоминают 194 карточки. По правилу проекта (К <артикул> — допустимый источник) оставлено '
            + '«1.9 SDI». Бонус сверки: получены точные интервалы применяемости — Polo 6N1 10.94→10.99 '
            + '(KS стр.2407), Polo 6N2 10.99→09.01 (стр.2402), Caddy 9U Pickup 06.96→12.00 (стр.2350).'
    },
    'AEA': {
        status: 'закрыто (подтверждено)',
        text: 'Сомнение прошлого раунда («в литературе AEA иногда указывается как 1.6 74 кВт — нет ли второй '
            + 'карточки») снято: карточка id=66 однозначна — 1598 см³, 55 кВт/75 л.с., 126 Нм @2600, 9.8:1. '
            + 'Наше 1.6/75 подтверждено. Применяемость: Polo III 6N1 10.94→10.99 и 08.95→10.99 (KS стр.2407), '
            + 'плюс Golf III/Vento до 06.95.'
    },
    '1Z': {
        status: 'кандидат — конфликт источников, НЕ добавлен',
        text: 'Два источника сайта противоречат друг другу: карточка id=38 (KS 50003929) даёт применение '
            + 'только Golf III Van 08.91→09.97 и Passat B3/B4 10.93→07.96, а выдержка ETKA-таблицы '
            + '(id=5557 стр.1) содержит строку «1Z 66 90 1,90 4 10/96 09/00 CADDY TDI». Проверка по '
            + 'vin-dump невозможна в принципе: VIN не кодирует двигатель (vD() в app.js отдаёт весь список '
            + 'ENGINES; в 13 359 VIN дампа мотор не зашит — вхождение «1ZZ» это часть WV1ZZZ9K…). '
            + 'В data-src код 1Z не упоминает ни одна карточка — добавление создаст второго «сироту» '
            + '(см. блок O и прецедент ABU). РЕШЕНИЕ: не добавлять; вернуться, если (а) ETKA подтвердит '
            + '1Z на Caddy 9K и (б) в каталоге появятся карточки с этим кодом. Характеристики для будущего '
            + 'добавления: 1.9 TDI, 66 кВт/90 л.с. @4000, 202 Нм @1900, 19.5:1, 79.5×95.5, семейство EA827.'
    },
    'AEK': {
        status: 'кандидат отклонён',
        text: 'Карточка id=70: 1595 см³, 74 кВт/101 л.с. @5800, 140 Нм @3500, 10.3:1. Документированное '
            + 'применение — только Golf III (1H1/1E7/1H5), Passat B3/B4, Vento, все интервалы заканчиваются '
            + '12.95. На Polo 6N/6N2, Polo Classic 6V и Caddy 9K/9U не ставился. В ENGINES не добавляем; '
            + 'в data-src код не встречается (проверено).'
    },
    /* --- добор блока N (2026-10-30): новые адьюдикации --- */
    'AEV': {
        status: 'закрыто (применено в 1.13.2: 50→45)',
        text: 'ПРАВКА ПРИМЕНЕНА в 1.13.2 (одобрено владельцем 2026-10-30): hp 50→45, v «1.0» оставлен (заводское обозначение «45 1.0»; 33 кВт = 44.9 л.с.). Основание: ETKA-таблица 03.08.2015 «AEV 33 45 1,05 4 10/94-06/96 POLO», Elsa «AEV 1043 33(44) Monomotron», KS id=75 (стр.2406, 2443), наш К `030 100 098 BX` «(1.05, 33 кВт)». Прежние 50 л.с. — характеристики поздних 1.0 (999 см³/37 кВт): AER/ALD/ALL/ANV/AUC, они верны и не менялись. Строки js/app.js: ENGINES + комментарий; FAMILIES/GEARBOX/KNOWN_ISSUES не менялись (код остаётся). §11.3 п.1.'
    },
    'AKU': {
        status: 'закрыто (применено в 1.13.2: 57→60)',
        text: 'ПРАВКА ПРИМЕНЕНА в 1.13.2 (одобрено владельцем 2026-10-30): hp 57→60. Основание: ETKA-таблица 03.08.2015 «AKU 44 60 1,70 LUPO SDI» (+ строка POLO), Elsa «AKU 1716 44(59) VEP», KS id=116 (стр.2382, 2402, 2407: Lupo 09.98→07.05, Polo 6N1 08.97→10.99, Polo 6N2 10.99→09.01), наш К `028 100 034 J` «(1.7 SDI, 44 кВт)». 57 л.с. (42 кВт) — это AHG/AHB; AKW=60 подтверждён отдельно (см. вердикт AKW). §11.3 п.2.'
    },
    'AHB': {
        status: 'закрыто (применено в 1.13.2: 60→57)',
        text: 'ПРАВКА ПРИМЕНЕНА в 1.13.2 (одобрено владельцем 2026-10-30): hp 60→57. Основание: ETKA-таблица 03.08.2015 «AHB 42 57 1,70 4 07/96-09/00 CADDY», Elsa «AHB 1715 42(57) VEP», KS id=94 (стр.2350, 2428), Sam’s VW World (VAG MKB). Диссидент clubvw «44/60» отклонён (в этом списке известны ошибки кВт: AEX «45», AEY «44»). 60 л.с. (44 кВт) — это AKU/AKW. §11.3 п.3.'
    },
    'AKW': {
        status: 'закрыто (наше значение подтверждено; правка ОТМЕНЕНА)',
        text: 'У нас AKW = 1.7 SDI/60. Раунд 2 по карточке id=117 (KS 50003929 стр.2408, 2413 «AKW 57 1.7 SDI 42 kW») готовил правку 60→57 — ДОБОР-3 ОТМЕНИЛ ЕЁ: ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf; = выдержка id=5557) даёт строку «AKW 44 60 1,70 4 11/97-08/99 POLO SDI», Elsa (заводские таблицы VW Service) — «AKW 1715 44(59) SAUGDIESEL», auto-data.net — «Volkswagen Polo III Classic (6N) 1.7 SDI (60 Hp), 1997-1999, 115 Нм @2200». То есть три источника (включая заводской Elsa) против одной карточки KS: AKW = 44 кВт/60 л.с., Polo Classic 6V2/Variant 6V5. Карточка KS id=117 помечена как ошибка составителя каталога MS Motor Service (либо смешение с AHG/AHB 42 кВт). Наше значение ВЕРНО — данные не меняются; строка §10.3 п.4 снимается с рассмотрения. Примечание: интервалы KS (6V2 07.97→09.01, 6V5 08.97→09.01) и ETKA-таблицы (POLO 11/97-08/99) слегка расходятся — на применяемость в окне каталога это не влияет (IN). §11.2.'
    },
    'AFK': {
        status: 'закрыто (применено в 1.13.2: 75→100)',
        text: 'ПРАВКА ПРИМЕНЕНА в 1.13.2 (одобрено владельцем 2026-10-30): hp 75→100. Основание: ETKA-таблица 03.08.2015 «AFK 74 100 1,40 4 05/99-05/03 LUPO 16V» и «AFK 74 100 1,40 4 07/99-09/01 POLO», Elsa «AFK 1390 74(100) MPI», KS id=79 (стр.2382, 2401 + TAS: 74 кВт/101 л.с. @6000, 128 Нм @4400). Округление 101→100 — как у AFH в нашей таблице. 75 л.с. (55 кВт) — это APE/AUA/AHW/AKQ. §11.3 п.4.'
    },
    'ANM': {
        status: 'закрыто (применено в 1.13.2: донорский Lupo, 75→100)',
        text: 'Решение владельца (§11.4, 2026-10-30): код ОСТАВЛЕН с пометкой «донорский Lupo» в комментарии ENGINES; значение исправлено 75→100 л.с. (версия 1.13.2) — по единственному внешнему источнику KS id=131 (стр.2382): 74 кВт/101 л.с., Lupo I (6X1, 6E1) 08.99→07.05, тот же мотор и те же годы, что AFK (для него округление 101→100 одобрено в §11.3 п.4 — применено и здесь); строки ANM в ETKA-таблице 03.08.2015 и Wikipedia не найдены. Прежние «1.4 16V/75» не подтверждали ни KS, ни внутренние карточки. Удаление не рассматривалось: в data-src 35 общих карточек (d: VW Polo 6N) включают ANM в engines — без кода nP() отбрасывал бы совместимость (прецедент 1.10.6). Вне охвата по применяемости — проектное решение, как AEH/AKL. §11.4. ДОБОР-4 2026-10-30: строка ETKA получена — «ANM 74 100 1,40 4 10/98-05/99 LUPO «SRE» 16V» (редакция 03.08.2015). Это третий независимый источник (к KS id=131 и Elsa «ANM 1400 74(100)»): мощность 74 кВт/100 л.с. подтверждена, применение — только Lupo, т.е. донорский статус верен. Во всех четырёх зеркалах таблицы строки POLO у ANM нет, поэтому CONFLICT в блоке A — расхождение KS-карточки (Lupo) и 35 карточек data-src (d: VW Polo 6N), которые включают ANM в сквозные списки engines; данные не меняются.'
    },
    'AHT': {
        status: 'закрыто (применено в 1.13.2: исправлен на 1.0/50, донорский Lupo)',
        text: 'Решение владельца (§11.4, 2026-10-30) — вариант (а): AHT ИСПРАВЛЕН на { v: «1.0», hp: 50 } с пометкой «донорский код Lupo» (версия 1.13.2; прецедент AEH/AKL, комментарий 1.10.6). Основание — три источника: ETKA-таблица 03.08.2015 «AHT 37 50 1,00 4 10/98-05/00 LUPO», Elsa «AHT 996 37(50) MPI», KS id=101 (стр.2381 + TAS: 997 см³, 37 кВт/50 л.с. @5000, 84 Нм @3250, 72×61.2). Прежние «1.4/75» не подтверждал ничто; геометрия 72×61.2 не совпадает с поло́вскими 1.0 (999 см³, 67.1×70.6). Код ОСТАВЛЕН (не удалён): в data-src 4 общие карточки — удаление ломало бы совместимость при загрузке. ECU «Siemens Simos 2P» добавлен по общему источнику для 1.0 MPI (карточка id=101 — Simos 2P, как у AER/ALD/ALL). §11.4.'
    },
    'ANX': {
        status: 'закрыто (применено в 1.13.2: 60→54)',
        text: 'ПРАВКА ПРИМЕНЕНА в 1.13.2 (одобрено владельцем 2026-10-30): hp 60→54. Основание: ETKA-таблица 03.08.2015 «ANX 40 54 1,40 4 07/95-12/99 POLO» (в зеркале «Ficha Técnica»: «01/98-12/99 POLO» и «POLO \"A.\"» — Австрия), Elsa «ANX 1389 40(54) MPI», Wikipedia «1.4 R4: 40 кВт/116 Нм (ANX; Austrian market only)», KS id=137. Конфликт раунда 2 (сводная карточка «1.4 44 кВт МКПП» `030 100 098 DX·HX·035 P·035 PX·098 LX` включала ANX) разрешён: в группу 44 кВт код попал у составителя каталога ошибочно — общий блок/агрегаты, другая прошивка. §10.4 (пересмотрено), §11.3 п.5.'
    },
    'AKP': {
        status: 'закрыто (применено в 1.13.2: 60→54)',
        text: 'ПРАВКА ПРИМЕНЕНА в 1.13.2 (одобрено владельцем 2026-10-30): hp 60→54; комментарий ENGINES «AKP 1.4 8V 60 — сверено по кросс-справочникам» заменён (прежняя пометка не подтвердилась). Основание: ETKA-таблица 03.08.2015 «AKP 40 54 1,40 4 10/99-09/01 POLO», Elsa «AKP 1389 40(54) MPI», KS id=112 (стр.2401, 2412: Polo 6N2 10.99→09.01, Variant 6V5 12.98→09.01). Та же ошибка группировки сводной карточки «1.4 44 кВт МКПП», что у ANX. §10.4 (пересмотрено), §11.3 п.6.'
    },
    'AEH': {
        status: 'закрыто (донорский код — намеренное включение)',
        text: 'Добор-3 прочитал карточку id=69 полностью: 1595 см³, 74 кВт/101 л.с. @5600, 145 Нм @3800, 10.2:1, 81×77.4; применение — только Golf IV A4 (1J) по workshop-manuals.com + newsroom (KS-страниц нет). Наши 1.6/100 — ROUND, характеристики верны. «Вне охвата» — НО включение намеренное: комментарий 1.10.6 в js/app.js (AEH/AKL/APF — донорские коды Golf IV/Bora для пружин 1J0 411 105 …, заменивших 6N0 411 105 F; в data-src ровно 1 карточка — эта пружина). НЕ удалять. §11.2.'
    },
    'ADZ': {
        status: 'закрыто (донорский код Golf III/Vento — оставлен, 1.13.2)',
        text: 'Решение владельца (§11.4, 2026-10-30): ADZ ОСТАВЛЕН с пометкой «донорский код Golf III/Vento 1.8» в комментарии ENGINES (версия 1.13.2). Характеристики подтверждены (ETKA-таблица 03.08.2015 «ADZ 66 90 1,80 GOLF/VENTO», Elsa «ADZ 1781 66(89) Monomotronic», clubvw); строк POLO/CADDY нет — вне охвата. Удаление отклонено: в data-src 10 общих карточек включают ADZ в сквозные списки engines (термостат 030 121 113 перечисляет все коды Polo + ADZ) — без кода nP() отбрасывал бы совместимость при загрузке (прецедент AEH, комментарий 1.10.6). §11.4.'
    },
    'AUR': {
        status: 'закрыто (применено в 1.13.2: 75→100)',
        text: 'ПРАВКА ПРИМЕНЕНА в 1.13.2 (одобрено владельцем 2026-10-30): hp 75→100. Основание: ETKA-таблица 03.08.2015 «AUR 74 100 1,60 4 03/00-09/01 POLO», Wikipedia «Volkswagen EA827 engine» (1.6, 1595 см³: 74 кВт/101 PS @5600, 145 Нм @3800 — AEH; AKL; APF; AUR), clubvw.org.au (1595, 74 кВт), vd Veer Engineering (Polo III 1.6 Variant/Classic), plenty.parts («AEH AFT AKL APF AUR 101 hp 74 kW»). AUR — поздний 1.6 (74 кВт) для Polo Classic/Variant, родственный AEH/AKL. 37 карточек data-src группировали AUR с AEE/ALM (55 кВт) — та же ошибка группировки составителя, что у ANX/AKP. §11.3 п.7.'
    },
    'ALE': {
        status: 'закрыто (подтверждено) + бонус применяемости',
        text: 'Добор-3 закрыл код из блока N. ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf; = выдержка id=5557): «ALE 66 90 1,90 4 09/97-09/00 CADDY TDI» (+ вторая строка в зеркалах); Wikipedia (diesel list): «Polo Mk3 Classic/Variant: ALE (11/97-08/99)», «Vento/Jetta (1H): ALE (01/97-12/97)»; clubvw.org.au: «ALE … Polo, Jetta, Caddy, 1997, 1999». Наше 1.9 TDI/90 подтверждено; применяемость IN (Caddy 9K TDI 09/97→09/00 — в окне каталога; Polo 6V2/6V5 TDI). Внутренняя опора — 6 общих карточек (те же, что у AHU). §11.1.'
    },
    'AHU': {
        status: 'закрыто (подтверждено) + бонус применяемости',
        text: 'Добор-3 закрыл код из блока N и принёс бонус: 1.9 TDI 90 на Caddy 9K и Polo Classic/Variant — в пределах охвата каталога. ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf; = выдержка id=5557): «AHU 66 90 1,90 4 10/96-09/00 CADDY TDI» (+ строка GOLF 08/96-07/97); Wikipedia (diesel list): «Volkswagen Polo Mk3 Classic / Variant: AHU (01/97-08/99), ALE (11/97-08/99), AFN (06/98-…)», «Vento/Jetta (1H): AHU (08/96-…)»; Elsa (заводские таблицы VW Service): «AHU 1896 66(89) VEP»; clubvw.org.au: «AHU … Golf, Vento, Sharan, Passat, 1996, 2000». Наше 1.9 TDI/90 подтверждено. Внутренняя опора слабая (6 общих карточек: свеча накаливания, масло 505 01, антифриз G12, шины 195/65 R15 «Caddy Van / Kombi (штатные)») — но теперь объяснимая: дизельные Caddy/Variant действительно входили в применение. §11.1.'
    },
    'AEY': {
        status: 'закрыто (подтверждено)',
        text: 'Добор-3 закрыл код из блока N. ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf; = выдержка id=5557): «AEY 47 64 1,90 4 11/95-09/00 CADDY SDI» (+ вторая строка в зеркалах); Elsa (заводские таблицы VW Service): «AEY 1896 47(63)». Наше 1.9 SDI/64 подтверждено. clubvw.org.au даёт модели «Polo, Golf, Vento, Caddy, 1995-1999», но кВт у него ошибочно 44/60 (в том списке известны ошибки: AEX «45», AHB «44») — использован только список моделей. Внутренняя опора — 7 карточек data-src, включая шину 185/55 R14 «хэтчбек 3d/5d (1.4/1.9 SDI)» (d: VW Polo 6N). Применяемость IN: Caddy 9K SDI 11/95→09/00. §11.1.'
    },
    'APQ': {
        status: 'закрыто (подтверждено)',
        text: 'Добор-3 закрыл код из блока N. ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf; = выдержка id=5557): «APQ 44 60 1,40 4 11/95-06/03 CADDY» (+ строки POLO/GOLF в зеркалах); Wikipedia «1.4 R4»: parts prefix 030, ID codes AEX/APQ, 1390 см³; «Polo Mk3»: 1.4 8v AEX/AKV/APQ 44 кВт/60 PS. Наше 1.4/60 Simos 2P подтверждено; внутренняя опора — 184 карточки. Применяемость IN: Polo 6N + Caddy 9K. §11.1.'
    },
    'AKV': {
        status: 'закрыто (подтверждено)',
        text: 'Добор-3 закрыл код из блока N. ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf; = выдержка id=5557): «AKV 44 60 1,40 4 05/97-12/99 POLO»; Elsa (заводские таблицы VW Service): «AKV 1389 44(59) MPI»; Wikipedia «Polo Mk3»: 1.4 8v 1995-1999 AEX/AKV/APQ 44 кВт/60 PS. Раунд 1 помечал AKV «спорным» — внешних противоречий не найдено: наше 1.4/60 Simos 2P верно; внутренняя опора — 198 карточек. Применяемость IN: Polo 6N (05/97→12/99 по ETKA-таблице). §11.1.'
    },
    'AEX': {
        status: 'закрыто (подтверждено)',
        text: 'Добор-3 закрыл код из блока N (карточки на сайте нет). ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf; = выдержка id=5557): «AEX 44 60 1,40 4 11/95-06/03 CADDY MPI», «AEX 44 60 1,40 4 09/96-05/98 CADDY» (+ строки POLO/GOLF в зеркалах); Wikipedia «Polo Mk3»: 1.4 8v 1995-1999 AEX/AKV/APQ 1390 см³ 44 кВт (60 PS) @4700; Wikipedia «1.4 R4»: parts prefix 030, ID codes AEX/APQ. Наше 1.4/60 Simos 2P подтверждено; внутренняя опора — 219 карточек data-src. Применяемость IN: Polo 6N/6N2 + Caddy 9K (включая 09/96→05/98 и 11/95→06/03). §11.1. Добор-4 2026-10-30: ETKA-экспорт 07.03.2010 маркирует мотор как DIESEL («AEF 47 64 1,90 4 06/96-12/00 CADDY DIESEL», «10/94-07/01 POLO DIESEL») — наше inj «SDI» расхождением не считается (прецедент AGP: SDI и есть атмосферный дизель), значение 47 кВт/64 л.с. совпало.'
    },
    'AKQ': {
        status: 'закрыто (донорский код Bora/Golf IV/Lupo — оставлен, 1.13.2)',
        text: 'Решение владельца (§11.4, 2026-10-30): AKQ ОСТАВЛЕН с пометкой «донорский код Bora/Golf IV/Lupo» в комментарии ENGINES (версия 1.13.2). Характеристики верны (1390 см³, 55 кВт/75 л.с., 126 Нм @3800, 16V — совпали с KS id=113); применение — только Bora I, Golf IV (+Variant), Lupo I (ETKA-таблица 03.08.2015 «AKQ 55 75 1,40 4 10/98-04/01 BORA 16V» и «10/98-05/00 BORA 16V»; KS стр.2347-2348, 2361, 2363, 2382) — Polo/Caddy отсутствуют. Удаление отклонено: в data-src 39 общих карточек (детали 1.4 16V/1.6 16V) — прецедент 1.10.6. §11.4.'
    },
    'AGR': {
        status: 'закрыто (в охвате: Polo 6N2 TDI; формулировка исправлена в 1.13.3)',
        text: 'Решение владельца (§11.4, 2026-10-30): AGR ОСТАВЛЕН с пометкой «донорский код Golf IV/Bora 1.9 TDI 90» в комментарии ENGINES (версия 1.13.2). Характеристики верны (1896 см³, 66 кВт/90 л.с., 210 Нм @1900 — совпали с KS id=90); применение: ETKA-таблица 03.08.2015 «AGR 66 90 1,90 4 10/98-05/05 BORA TDI» и «10/97-… GOLF», Wikipedia «Golf (1J): AGR/ALH (10/97-05/06)» — строк POLO/CADDY нет; диссидент clubvw («Polo 1999-2001») отклонён. Удаление отклонено: в data-src 6 общих карточек (d: Golf IV, Bora, Passat B5) — прецедент 1.10.6. §11.4. ДОБОР-4 2026-10-30 — УТОЧНЕНИЕ: формулировка «строк POLO/CADDY нет» ВЕРНА ТОЛЬКО для карточки KS id=90. В полной ETKA-таблице 03.08.2015 (зеркала slideshare 201329802, fr.scribd 849891594, es.scribd 714578221) есть дословные строки «AGR 66 90 1,90 4 10/99-09/01 POLO TDI» и «AGR 66 90 1,90 4 10/05- POLO «RA.» TDI»: первая — это Polo 6N2 1.9 TDI 90, т.е. код В ОХВАТЕ каталога (clubvw «Polo 1999-2001», отклонённый в цикле 3, оказался прав). Отсюда CONFLICT в блоке A — расхождение источников, а не наших данных: KS документирует только Golf IV/Bora, ETKA — ещё и Polo. Значения 66 кВт/90 л.с./210 Нм подтверждены обоими. Код остаётся. ПРИМЕНЕНО в 1.13.3 (одобрено владельцем 2026-10-30): комментарий у AGR/ALH в js/app.js и нота семейства EA827-D переписаны — «в охвате: ETKA POLO TDI 10/99-09/01; CADDY TDI 09/00-06/03 у ALH»; значения ENGINES не менялись (§13.5, §13.7).'
    },
    'ALH': {
        status: 'закрыто (в охвате: Polo 6N2 + Caddy 9K TDI; формулировка исправлена в 1.13.3)',
        text: 'Решение владельца (§11.4, 2026-10-30): ALH ОСТАВЛЕН с пометкой «донорский код Golf IV/Bora 1.9 TDI 90» в комментарии ENGINES (версия 1.13.2). Характеристики верны (1896 см³, 66 кВт/90 л.с., 210 Нм @1900); применение: Wikipedia (diesel list) «Golf (1J): AGR/ALH (10/97-05/06)»; полные строки ETKA-таблицы не извлечены (прокси-сбои) — в извлечённых фрагментах только GOLF/BORA. Удаление отклонено: в data-src 6 общих карточек (d: Golf IV, Bora, Passat B5) — прецедент 1.10.6. §11.4. ДОБОР-4 2026-10-30: строки ETKA извлечены полностью — «ALH 66 90 1,90 4 10/99-09/01 POLO TDI» (редакция 03.08.2015, три зеркала дословно) и «ALH 66 90 1,90 4 09/00-06/03 CADDY TDI» (та же редакция; строка CADDY есть и в экспорте et_mkb.frm 07.03.2010), плюс «10/97- GOLF TDI», «10/00- JETTA «RA.»:TDI». Североамериканский ETKA-экспорт (vaglinks.com/Docs/Catalogues/ETKA_VW_Engine_Codes.pdf) даёт ALH только как GOLF/JETTA/NEW BEETLE — это другой рынок, не противоречие. ВЫВОД: ALH ставился и на Polo 6N2 1.9 TDI 90, и на Caddy 9K TDI — код В ОХВАТЕ; прежняя пометка «чисто донорский» неверна. CONFLICT в блоке A — расхождение KS (только Golf IV) и ETKA (Polo/Caddy/Golf/Jetta), наши значения не затронуты. ПРИМЕНЕНО в 1.13.3 (одобрено владельцем 2026-10-30): комментарий в js/app.js и нота EA827-D исправлены (§13.5, §13.7); значения ENGINES не менялись.'
    },
    'AKL': {
        status: 'закрыто (донорский код — намеренное включение)',
        text: 'Характеристики совпали с округлением (1595 см³, 74 кВт/101 л.с. против наших 100 — ROUND; 145 Нм @3800, 10.2:1). Применение: карточка id=110 — только Golf IV; добор-3: ETKA-таблица 03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf; = выдержка id=5557) — «AKL 74 100 1,60 4 08/98-05/05 BORA» (+ строки GOLF) — Polo/Caddy НЕТ. НО: включение НАМЕРЕННОЕ — комментарий 1.10.6 в js/app.js документирует AEH/AKL/APF как донорские коды Golf IV/Bora для пружин 1J0 411 105 …, которыми VAG официально заменил 6N0 411 105 F (без этих кодов nP() отбрасывал совместимость позиций). Удаление сломает совместимость — НЕ удалять. Расхождение «вне охвата» закрыто как проектное решение. §11.2.'
    },
    /* --- добор, цикл 4 (2026-10-30): вердикты по дочитанным карточкам
       (зеркало en.volkswagenclub.net) и извлечённым строкам ETKA --- */
    'AHW': {
        status: 'закрыто (подтверждено; Polo 6N2 — интервал получен)',
        text: 'Добор-4 2026-10-30: 1390 см³, 55 кВт/75 PS @5000, 16V, 10.5:1, 76.5×75.6 — совпало с нашим «1.4 16V/75». '
            + 'Недостающая Polo-строка получена из ETKA-таблицы 03.08.2015: «AHW 55 75 1,40 4 10/99-09/01 POLO 16V» '
            + '(плюс «10/98-05/05 BORA 16V», «10/97-06/06 GOLF 16V», «01/99-07/05 LUPO 16V»). Карточка id=102 на зеркале '
            + 'en.volkswagenclub.net подтверждает сводку «applications: Bora / I A4 1J; Golf / IV A4 Typ 1J; Lupo; '
            + 'Polo / III Mk III Typ 6N/6N2». Правок не требуется.'
    },
    'APE': {
        status: 'закрыто (подтверждено; Polo 6N2 — интервал получен)',
        text: 'Добор-4 2026-10-30: 1390 см³, 55 кВт/75 PS @5000, 16V, 10.5:1, 76.5×75.6 — совпало с нашим «1.4 16V/75». '
            + 'ETKA-таблица 03.08.2015: «APE 55 75 1,40 4 10/99-12/00 POLO 16V», «05/99-09/00 LUPO 16V», '
            + '«05/99-04/01 BORA 16V», «05/99-05/00 GOLF 16V»; строка «…CADDY 16V» в зеркале присутствует, '
            + 'но её интервал извлечь не удалось (chunkIndex>0 не отдаётся) — применяемость Caddy 9K остаётся '
            + 'по KS-карточке AUA и «Volkswagen Engine Codes and Models» (Caddy 1999-2003 1.4 APE). Правок не требуется.'
    },
    'AQM': {
        status: 'закрыто (подтверждено; Polo — две строки ETKA)',
        text: 'Добор-4 2026-10-30: 1896 см³, 50 кВт/68 л.с., 133 Нм, 19.5:1, 79.5×95.5 — совпало с нашим «1.9 SDI/68». '
            + 'ETKA-таблица 03.08.2015: «AQM 50 68 1,90 4 10/99-09/01 POLO SDI» и «AQM 50 68 1,90 4 07/00-09/01 POLO» '
            + '(плюс BORA 11/98-05/05 SDI, GOLF 11/98-05/06 SDI, JETTA TAXI FL2 02/02-). '
            + 'Применяемость в охвате подтверждена строками, а не только сводкой карточки id=149. Правок не требуется.'
    },
    'ASV': {
        status: 'закрыто (подтверждено; Polo 6N2 TDI TRENDLINE)',
        text: 'Добор-4 2026-10-30: 1896 см³, 81 кВт/110 л.с., 235 Нм @1900, 19.5:1, 79.5×95.5 — совпало с нашим «1.9 TDI/110» '
            + '(исправление 1.8.0 «ASV — TDI, а не SDI» подтверждено). ETKA-таблица 03.08.2015: «ASV 81 110 1,90 4 10/99-09/01 … '
            + 'POLO TDI TRENDLINE», «05/00-05/05 BORA TDI», «02/00-05/06 GOLF TDI». Правок не требуется.'
    },
    'ANV': {
        status: 'закрыто (подтверждено; конфликт источников по применяемости)',
        text: 'Добор-4 2026-10-30: карточка id=135 дочитана полностью — 999 см³, 37 кВт/50 PS @5000, 10.7:1, 67.1×70.6, '
            + 'момент не указан («Torque is not established for this precise variant and remains empty») — наше «1.0/50» ✓. '
            + 'Применение по карточке — ТОЛЬКО Lupo I (6X1, 6E1) 09.98→07.05 (KS стр.2381); ETKA-таблица 03.08.2015 тоже '
            + 'даёт лишь «ANV 37 50 1,00 4 05/99-05/03 LUPO». Wikipedia («1.0 R4: 37 кВт, ID codes AER, ALD, ALL, ANV, ATE, '
            + 'AUC; applications … Polo Mk3 (ANV/ALD/AUC: 01/00-12/01)») относит ANV к Polo. Конфликт зафиксирован; '
            + 'на характеристики не влияет, код в ENGINES остаётся (в data-src карточки с ANV есть). Правок не требуется.'
    },
    'AKK': {
        status: 'закрыто (подтверждено; карточка дочитана)',
        text: 'Добор-4 2026-10-30: карточка id=109 дочитана полностью — 1390 см³, 44 кВт/60 PS @4700, 116 Нм @2800, 10.4:1, '
            + '76.5×75.6; применение «POLO (6N2) 10.99→09.01, KS стр.2401» и «POLO Variant (6V5) 05.97→09.01, KS стр.2412» '
            + '(интервал 6V5 в карточке приведён как интервал группы). ETKA: «AKK 44 60 1,40 4 10/99-09/01 POLO». '
            + 'Наше «1.4/60» ✓. Caddy 9K 1.4 — по «Volkswagen Engine Codes and Models» (1999-2001), в ETKA строки CADDY у AKK нет.'
    },
    'ANW': {
        status: 'закрыто (подтверждено; карточка дочитана)',
        text: 'Добор-4 2026-10-30: карточка id=136 дочитана полностью — 1390 см³, 44 кВт/60 PS @4700, 116 Нм @2800, 10.4:1, '
            + '76.5×75.6; применение «POLO Variant (6V5) 05.97→09.01, KS стр.2412» + volkswagen-newsroom.com '
            + 'motor-versions-polo-3-profile-19148. ETKA: «ANW 44 60 1,40 4 10/99-08/00 POLO». Наше «1.4/60» ✓.'
    },
    'AUD': {
        status: 'закрыто (подтверждено; карточка дочитана, Caddy 9K + Polo)',
        text: 'Добор-4 2026-10-30: карточка id=181 дочитана (первый чанк) — 1390 см³, 44 кВт/60 PS @4700, 116 Нм @3000, '
            + '10.4:1, 76.5×75.6; применение: CADDY II MPV (9K9B) 09.00→06.03 стр.2350, CADDY II Box Body/MPV (9K9A) '
            + '11.95→01.04 стр.2428, LUPO I 10.00→07.05 стр.2382, POLO (6N2) 10.99→09.01 стр.2401, POLO Variant (6V5) '
            + '05.97→09.01 стр.2412 + TAS. Наше «1.4/60» ✓; обе платформы охвата (6N2 и 9K) подтверждены.'
    },
    'ALD': {
        status: 'закрыто (подтверждено; карточка дочитана)',
        text: 'Добор-4 2026-10-30: карточка id=118 дочитана полностью — 999 см³, 37 кВт/50 PS @5000, 86 Нм @3000, 10.7:1, '
            + '67.1×70.6; применение LUPO I 09.98→07.05 стр.2381, POLO (6N2) 10.99→09.01 стр.2401, POLO PLAYA 05.99→05.02 '
            + 'стр.2410 (вне охвата) + TAS. ETKA: «ALD 37 50 1,00 4 05/99-07/05 LUPO». Наше «1.0/50» ✓; '
            + 'Polo 6N2 подтверждён страницей KS, а не только Wikipedia.'
    },
    'ALL': {
        status: 'закрыто (подтверждено; карточка дочитана)',
        text: 'Добор-4 2026-10-30: карточка id=121 дочитана полностью — 999 см³, 37 кВт/50 PS @5000, 86 Нм @3000, 10.7:1, '
            + '67.1×70.6; применение LUPO I 09.98→07.05 стр.2381 и POLO III (6N1) 09.96→10.99 стр.2407 + TAS. '
            + 'ETKA: «ALL 37 50 1,00 4 10/98-05/00 LUPO» и «08/97-12/99 POLO». Наше «1.0/50» ✓.'
    },
    'AUC': {
        status: 'закрыто (подтверждено; карточка дочитана)',
        text: 'Добор-4 2026-10-30: карточка id=180 дочитана полностью — 999 см³, 37 кВт/50 PS @5000, 86 Нм @3000, 10.7:1, '
            + '67.1×70.6; применение LUPO I 09.98→07.05 стр.2381 и POLO (6N2) 10.99→09.01 стр.2401 + TAS. '
            + 'Wikipedia относит AUC к Polo Mk3 01/00-12/01 — согласно. Наше «1.0/50» ✓.'
    },
    'AGP': {
        status: 'закрыто (применено в 1.13.2: маркировка SDI)',
        text: 'ПРАВКА ПРИМЕНЕНА в 1.13.2 (одобрено владельцем 2026-10-30): v «1.9 D»→«1.9 SDI», inj «D (мех. ТНВД)»→«SDI»; мощность 68 л.с. (50 кВт) и объём не менялись. Основание: карточка id=89 «AGP 1.9 SDI 50 kW» (KS стр.2347, 2362-2363, 2408, 2413, 2443); SDI и есть атмосферный дизель с механическим ТНВД — противоречия по сути нет, но заводская маркировка SDI (прецедент AEF усилен: К-карточки data-src молчат, внешние источники единодушны). Применяемость в охвате: Polo III Classic (6V2) 08.99→01.02, Variant/Van (6V5) 08.99→09.01 + Bora/Golf IV. §11.3 п.8.'
    },
};

/* Каталогное окно проекта: Polo 6N с 10.94, Caddy 9K по 06.03 (9U по 12.00+). */
const WINDOW_START = 1994 + 9 / 12;   /* 10.94 — старт 6N */
const yy2year = (yy) => (yy >= 80 ? 1900 + yy : 2000 + yy);
const dec = (mm, yy) => yy2year(yy) + (mm - 1) / 12;
/* Все интервалы строки: «MM.YY→MM.YY», «MM/YY→MM/YY», открытые «от MM.YY» */
function intervalsOf(s) {
    const out = [];
    const re = /(\d{2})[./](\d{2})\s*(?:→|->)\s*(?:(\d{2})[./](\d{2}))?|от\s*(\d{2})[./](\d{2})/g;
    let m;
    while ((m = re.exec(s))) {
        if (m[5] !== undefined) out.push({ start: dec(+m[5], +m[6]), end: null });
        else out.push({ start: dec(+m[1], +m[2]), end: m[3] !== undefined ? dec(+m[3], +m[4]) : null });
    }
    return out;
}
/* 1.13.2-инструмент, добор-4 2026-10-30: исправлен латентный баг — прежняя маска
   /(polo|caddy|6n|6v|6k|9k|9u)/i находила «6n» внутри «…volkswagen-newsroom…»,
   из-за чего строка источника без интервала давала ложный IN (ALH/AGR) и, как
   следствие, ложный CONFLICT. Теперь коды платформ — только как отдельные токены. */
const SCOPE_RE = /(polo|caddy|\b6[nvk]\d?\b|\b9[ku]\d?\b|\b6n1\b|\b6n2\b)/i;
/* Применяемость в окне каталога по массиву строк:
   null — строк нет вовсе (карточка не прочитана),
   false — применение известно, но наших платформ в окне каталога нет
           (Golf/Vento/Passat/86C и т.п. — «вне охвата» тоже сюда),
   true  — есть строка с 6N/6V/9K/9U/Polo/Caddy, оканчивающаяся не раньше 10.94. */
function scopeIn(strings) {
    if (!strings || !strings.length) return null;
    let seen = false;
    strings.forEach(s => {
        if (/вне охвата|не относится/i.test(s)) return;
        if (!SCOPE_RE.test(s)) return;
        const iv = intervalsOf(s);
        if (iv.length === 0 || iv.some(x => x.end === null || x.end >= WINDOW_START)) seen = true;
    });
    return seen;
}

/* ---------- 4. Карточки data-src: сколько раз каждый код упомянут в engines ---------- */
const cardRefs = Object.create(null);
const DS = path.join(ROOT, 'data-src');
if (fs.existsSync(DS)) {
    fs.readdirSync(DS).filter(f => /^parts-\d+.*\.json$/.test(f)).sort().forEach(f => {
        let arr;
        try { arr = JSON.parse(fs.readFileSync(path.join(DS, f), 'utf8')); } catch (e) { return; }
        (Array.isArray(arr) ? arr : []).forEach(r => {
            (Array.isArray(r.engines) ? r.engines : []).forEach(c => { cardRefs[c] = (cardRefs[c] || 0) + 1; });
        });
    });
} else {
    console.error('check-engines: нет data-src — блок O (сироты) будет пропущен');
}

/* ---------- 5. Сверка ---------- */
const ourV = e => parseFloat(String(e.v).replace(',', '.'));
const kwToPs = kw => Math.round(kw * 1.3596);
const F = { S: [], R: [], A: [], O: [], N: [], X: [] };
const refCodes = new Set(REF.map(r => r.code));

REF.forEach(r => {
    const e = ENGINES[r.code];
    const verdict = VERDICTS[r.code];
    /* --- блоки S/R: характеристики (только для кодов, которые у нас есть) --- */
    if (e) {
        const refPs = r.ps != null ? r.ps : (r.kw != null ? kwToPs(r.kw) : null);
        const ours = { v: e.v, hp: e.hp, f: e.f, inj: e.inj || '—' };
        const site = {
            v: r.ccm != null ? (r.ccm / 1000).toFixed(1) : '—',
            hp: refPs != null ? refPs + (r.ps == null ? ' (из кВт)' : '') : '—', f: r.fuel
        };
        const problems = [];
        if (r.fuel && e.f !== r.fuel) problems.push('топливо: у нас ' + e.f + ', сайт ' + r.fuel);
        if (r.ccm != null && Math.abs(ourV(e) - r.ccm / 1000) > 0.06)
            problems.push('объём: у нас ' + e.v + ' (' + Math.round(ourV(e) * 1000) + ' см³), сайт ' + r.ccm + ' см³');
        const hpDiff = refPs != null ? Math.abs(e.hp - refPs) : null;
        const kwDiff = r.kw != null ? Math.abs(e.hp - kwToPs(r.kw)) : null;
        if (hpDiff != null && hpDiff > 1)
            problems.push('мощность: у нас ' + e.hp + ' л.с., сайт ' + refPs + ' л.с.' + (r.kw != null ? ' (' + r.kw + ' кВт)' : ''));
        let cls = 'OK';
        if (problems.length) cls = 'MISMATCH';
        else if (hpDiff === 1 || kwDiff === 1) cls = 'ROUND';
        const ourLbl = String(e.v) + (e.inj && String(e.v).indexOf(String(e.inj).split(' ')[0]) < 0 ? ' ' + e.inj : '');
        const labelNote = r.siteLabel && ourLbl.replace(/\s/g, '').toUpperCase() !== r.siteLabel.replace(/\s/g, '').toUpperCase()
            ? 'у нас «' + ourLbl + '», сайт маркирует «' + r.siteLabel + '»' : null;
        const item = { code: r.code, id: r.id, cls, ours, site, kw: r.kw, nm: r.nm, comp: r.comp, bs: r.bs, problems, labelNote, src: r.src };
        if (cls === 'MISMATCH') {
            item.status = verdict ? verdict.status : 'НОВОЕ РАСХОЖДЕНИЕ — адьюдикации нет';
            item.verdict = verdict ? verdict.text : '⚠ Инструмент обнаружил расхождение, для которого в VERDICTS нет записи. Добавьте адьюдикацию (СВЕРКА-ДВИГАТЕЛЕЙ.md).';
            F.R.push(item);
        } else {
            if (verdict && !/закрыто|подтверждено/.test(verdict.status)) { item.status = verdict.status; item.verdict = verdict.text; }
            else if (verdict) { item.status = verdict.status; }
            F.S.push(item);
        }
    }
    /* --- блок A: применяемость --- */
    const ksIn = scopeIn(r.apps);
    const etkaIn = scopeIn(r.etka);
    let aCls, aWhy;
    if (ksIn === null && etkaIn === null) { aCls = 'Н/Д'; aWhy = 'карточка не прочитана / нет строк ETKA'; }
    else if (ksIn !== null && etkaIn !== null && ksIn !== etkaIn) { aCls = 'CONFLICT'; aWhy = 'KS-применяемость и ETKA-таблица противоречат друг другу'; }
    else if (ksIn === true || etkaIn === true) { aCls = 'IN'; aWhy = 'ставился на 6N/6N2/6V/9K/9U в окне каталога'; }
    else { aCls = 'OUT'; aWhy = 'по данным сайта к 6N/9K не относится (или закончился до 10.94)'; }
    const inOurs = !!ENGINES[r.code];
    let flag = '—';
    if (aCls === 'OUT' && inOurs) flag = '⚠ ВНЕ ОХВАТА, НО ЕСТЬ В ENGINES';
    else if ((aCls === 'IN' || aCls === 'CONFLICT') && !inOurs) flag = 'в охвате, но нет в ENGINES (кандидат)';
    F.A.push({ code: r.code, id: r.id, cls: aCls, why: aWhy, inOurs, flag, apps: (r.apps || []).concat((r.etka || []).map(s => 'ETKA: ' + s)), verdict: verdict && (aCls === 'OUT' || aCls === 'CONFLICT' || flag !== '—') ? verdict.text : null, status: verdict ? verdict.status : null });
    /* --- блок X: коды сайта, которых нет у нас --- */
    if (!inOurs) F.X.push({ code: r.code, id: r.id, cls: aCls, site: r.ccm != null ? (r.ccm / 1000).toFixed(1) + ' / ' + (r.kw != null ? r.kw + ' кВт' : '—') : '—', status: verdict ? verdict.status : null, verdict: verdict ? verdict.text : null, why: aWhy });
});

/* --- блок O: сироты --- */
if (fs.existsSync(DS)) {
    Object.keys(ENGINES).forEach(c => {
        if (!cardRefs[c]) F.O.push({ code: c, refs: 0, verdict: VERDICTS[c] ? VERDICTS[c].text : null, status: VERDICTS[c] ? VERDICTS[c].status : null });
    });
}
/* --- блок N: наши коды без внешних данных --- */
Object.keys(ENGINES).forEach(c => {
    if (!refCodes.has(c)) F.N.push({ code: c, v: ENGINES[c].v, hp: ENGINES[c].hp, f: ENGINES[c].f, refs: cardRefs[c] || 0 });
});

/* ---------- 6. Отчёт ---------- */
const L = [];
L.push('# ENGINES-CHECK — сверка справочника двигателей');
L.push('');
L.push('Сгенерировано: ' + new Date().toISOString() + ' · `node tools/check-engines.js` · рантайм `js/app.js`: '
    + APP_VER);
L.push('');
L.push('Источники эталонов: карточки `engine_detail.php` volkswagenclub.net (чтение 2026-10-30; добор блока N '
    + '2026-10-30 — 29 карточек полностью + 7 строк `engines_list.php`; добор-3 2026-10-30 — карточки id=67/69/72 '
    + 'дочитаны полностью; добор-4 2026-10-30 — зеркало en.volkswagenclub.net отдаёт карточки полностью, '
    + 'дочитаны id=109/118/121/135/136/180/181 и «хвосты» id=80/102/141; цитируют ' + KS + ' постранично '
    + 'и TAS opendata.astra.admin.ch); ETKA-таблица «ETKA - Engine Code» '
    + '03.08.2015 (vag-codes.info/files/engines/vw-engines.pdf — полная версия выдержки id=5557; зеркала slideshare '
    + '201329802, fr.scribd 849891594, es.scribd 714578221, scribd 358450579), ранний экспорт et_mkb.frm 07.03.2010 '
    + '(fr.scribd 786098516) и североамериканский ETKA-экспорт (vaglinks.com/Docs/Catalogues/ETKA_VW_Engine_Codes.pdf); '
    + 'заводские таблицы Elsa '
    + '(зеркало elsaonline); Wikipedia («Polo Mk3», списки снятых с производства бензиновых/дизельных двигателей VW Group, '
    + '«Volkswagen EA827 engine»); clubvw.org.au (только модели/годы — в кВт-колонке известны ошибки); auto-data.net. '
    + 'Адьюдикация спорных кодов — «СВЕРКА-ДВИГАТЕЛЕЙ.md» (корень проекта).');
L.push('');
L.push('| Блок | Что проверяет | Найдено |');
L.push('|---|---|---|');
L.push('| S | характеристики совпали (OK / ROUND-округление / LABEL-маркировка) | ' + F.S.length + ' |');
L.push('| R | содержательные расхождения с сайтом | ' + F.R.length + ' |');
L.push('| A | применяемость к 6N/6N2/6V/6K/9K/9U | ' + F.A.length + ' |');
L.push('| O | «сироты» ENGINES (0 карточек в data-src) | ' + F.O.length + ' |');
L.push('| N | наши коды без внешних данных (карточка не прочитана) | ' + F.N.length + ' |');
L.push('| X | коды сайта, которых нет у нас | ' + F.X.length + ' |');
L.push('');
L.push('ENGINES в js/app.js: **' + Object.keys(ENGINES).length + '** кодов. В поле `engines` карточек data-src упомянуто **'
    + Object.keys(cardRefs).length + '** кодов.');
L.push('');

function sect(title, arr, fmt) {
    L.push('## ' + title + ' (' + arr.length + ')');
    L.push('');
    if (!arr.length) { L.push('_Нет._'); L.push(''); return; }
    arr.forEach(x => L.push(fmt(x)));
    L.push('');
}
sect('S. Сверка совпала', F.S, x => '- `' + x.code + '` **' + x.cls + '** — у нас ' + x.ours.v + ' / ' + x.ours.hp
    + ' л.с. / ' + x.ours.f + '; сайт ' + x.site.v + ' / ' + x.site.hp + ' л.с.' + (x.kw != null ? ' (' + x.kw + ' кВт)' : '')
    + (x.nm ? ', ' + x.nm + ' Нм' : '') + (x.labelNote ? '; LABEL: ' + x.labelNote : '')
    + (x.status ? ' — **' + x.status + '**' : ''));
sect('R. Содержательные расхождения', F.R, x => '- `' + x.code + '` **MISMATCH** — ' + x.problems.join('; ')
    + '. Статус: **' + x.status + '**.\n  ' + (x.verdict || '').split('\n').join('\n  '));
sect('A. Применяемость (по данным сайта)', F.A, x => '- `' + x.code + '` [' + x.cls + '] ' + x.why
    + (x.inOurs ? ' · есть в ENGINES' : ' · НЕТ в ENGINES') + (x.flag !== '—' ? ' — **' + x.flag + '**' : '')
    + (x.apps.length ? '\n  - ' + x.apps.join('\n  - ') : '')
    + (x.verdict ? '\n  - Вердикт (**' + x.status + '**): ' + x.verdict : ''));
sect('O. «Сироты»: коды ENGINES без упоминаний в data-src', F.O, x => '- `' + x.code + '` — 0 карточек'
    + (x.status ? ' — **' + x.status + '**' : '') + (x.verdict ? '\n  ' + x.verdict : ''));
sect('X. Коды сайта, которых нет у нас', F.X, x => '- `' + x.code + '` [' + x.cls + '] ' + x.site
    + (x.status ? ' — **' + x.status + '**' : ' — ' + x.why) + (x.verdict ? '\n  ' + x.verdict : ''));
sect('N. Наши коды, которых нет в базе volkswagenclub.net (добор-3 2026-10-30: 8 из 9 закрыты по ETKA-таблице/Elsa/Wikipedia → перенесены в REF; добор-4 2026-10-30: по оставшемуся AHV получен отрицательный результат по четырём независимым слоям)', F.N, x => '- `' + x.code + '` ' + x.v + ' / ' + x.hp + ' л.с. / ' + x.f + ' — карточки на сайте нет (проверено постранично engines_list.php?kols=2..6); внутренняя опора: ' + x.refs + ' карточек data-src'
    + (x.code === 'AHV' ? '. Добор-3: во внешних источниках НЕ найден — в извлечённых строках ETKA-таблицы 03.08.2015 и в clubvw.org.au кода AHV нет («AHV» в PR-кодах VAG — опция фаркопа, не двигатель). Косвенные следы у производителей деталей: диаграмма ГРМ osvat.pdf (AHV в группе AEA/AEE/AHS/AEX/APQ/ANX, 1300/1600), распредвал 032 109 611 G «Caddy 1,6 AHV» (Alfa-guide). Внутренняя опора: сводная карточка `032 100 098 DX · GX · 032 H · 098 LX` «1.6 55 kW МКПП» engines [AEE, AHV] — согласуется с нашим 1.6/75. Статус: данных для сверки нет, запись не меняется. ДОБОР-4 2026-10-30 — проверка выполнена, результат ОТРИЦАТЕЛЬНЫЙ по четырём независимым слоям: (1) ETKA-экспорт et_mkb.frm 07.03.2010 (fr.scribd.com/document/786098516, читается текстом) — порядок строк AHS → AHT → AHU → AHW, кода AHV нет; (2) ETKA-таблица 03.08.2015 (четыре зеркала: vag-codes.info, slideshare 201329802, fr.scribd 849891594, es.scribd 714578221) — тот же порядок, AHV отсутствует; (3) североамериканский ETKA-экспорт vaglinks.com/Docs/Catalogues/ETKA_VW_Engine_Codes.pdf — AHV нет вовсе; (4) база volkswagenclub.net (карта id engines_list.php?kols=2..6 и зеркало en.volkswagenclub.net) — кода нет. Все прочие употребления «AHV» — не мотор VW: PR-код VAG «Trailer hitch aftermarket equipment», HSN/TSN-ключ (0603/AHV — New Beetle 2.0, 0588/AHV — Audi A3 1.9 TDI, 7593/AHV — Seat Altea XL 1.6 TDI) и код дизеля PSA «AHV (DW10FD) 2.0 BlueHDi». Единственные следы как моторного кода VAG — каталоги производителей деталей (распредвал «Caddy 1,6 AHV» 032 109 611 G — Alfa-guide; диаграмма ГРМ osvat.pdf) и внутренняя группировка data-src. РЕШЕНИЕ: запись { v: «1.6», hp: 75, f: «P», inj: «MPI» } оставлена — внешних данных для правки нет, внутренняя опора (3 карточки, в т.ч. «1.6 55 kW МКПП» [AEE, AHV]) ей не противоречит; удаление отклонено (прецедент 1.10.6 — nP() отбрасывает неизвестные коды). Сверка закрыта как «не поддаётся внешней проверке».' : ''));

const OUT = path.join(ROOT, 'restore');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'ENGINES-CHECK.md'), L.join('\n'), 'utf8');
const json = {
    generated: new Date().toISOString(),
    enginesTotal: Object.keys(ENGINES).length,
    counts: Object.fromEntries(Object.entries(F).map(([k, v]) => [k, v.length])),
    findings: F
};
fs.writeFileSync(path.join(OUT, 'engines-check.json'), JSON.stringify(json, null, 1), 'utf8');

/* ---------- 7. Консоль / коды возврата ---------- */
if (ARGS.includes('--json')) console.log(JSON.stringify({ counts: json.counts, enginesTotal: json.enginesTotal }));
else {
    console.log('ENGINES: ' + Object.keys(ENGINES).length + ' кодов, эталонов REF: ' + REF.length);
    Object.entries(F).forEach(([k, v]) => console.log('  ' + k + ': ' + String(v.length).padStart(4)));
    const unresolved = F.R.filter(x => !/закрыто|подтверждено|отклонён/.test(x.status || ''));
    unresolved.forEach(x => console.log('  ⚠ ' + x.code + ': ' + x.status));
    console.log('отчёт: restore/ENGINES-CHECK.md');
}
if (ARGS.includes('--strict')) {
    const bad = F.R.filter(x => !/^закрыто/.test(x.status || ''))
        .concat(F.A.filter(x => x.flag.startsWith('⚠') && !/^закрыто/.test(x.status || '')));
    if (bad.length) { console.error('strict: ' + bad.length + ' незакрытых расхождений: ' + bad.map(x => x.code).join(', ')); process.exit(1); }
}
