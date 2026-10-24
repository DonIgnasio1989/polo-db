#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/parse_etka_dump.py — разбор дампа ETKA (*.txt по одному на VIN)
=====================================================================
Зачем: исходные .txt дампа лежат на вашей машине (13 359 путей перечислены в
vin-dump/filtered-files.txt), а залить их целиком не получается. Скрипт
работает ЛОКАЛЬНО и умеет два режима:

  --probe   НИЧЕГО не пишет в data/, только изучает формат и печатает
            компактный отчёт (несколько КБ) — его и присылайте мне, по нему
            доведу разбор полей до конца;
  (без --probe)  собирает data/vin-db.json в формате приложения +
            restore/ETKA-PARSE-REPORT.md.

Формат записи (как ждёт js/app.js, см. vin-dump/README.md):
    {"vin": "WVWZZZ6NZYX123456", "engine": "AEX", "gearbox": "085",
     "gearbox_code": "CHL", "paint": "J2", "roof_color": "J2",
     "equip_code": "41", "prod_date": "1999-04-14", "pr": ["0EA", "1ZB"]}
Допустим и старый вариант со склейкой trim = "J2J241" (приложение разбирает оба).

Запуск:
    python3 tools/parse_etka_dump.py --src "D:\\etka-dump" --probe
    python3 tools/parse_etka_dump.py --src "D:\\etka-dump" --limit 200 --probe
    python3 tools/parse_etka_dump.py --src "D:\\etka-dump" --files vin-dump/filtered-files.txt
    python3 tools/parse_etka_dump.py --src "D:\\etka-dump" --out data/vin-db.json

Кодировки: автоопределение utf-8 / cp1251 / latin-1 (дампы ETKA часто в CP1251).
Файлы-источники НЕ изменяются.
"""
import argparse
import collections
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIN_RE = re.compile(r'\b[A-HJ-NPR-Z0-9]{17}\b')

# ---------------------------------------------------------------------------
# Словари ключевых слов: дамп может быть на немецком, английском или русском.
# Всё, что не найдётся, попадёт в отчёт «нераспознанные поля» — по нему словарь
# и дополняется.
# ---------------------------------------------------------------------------
FIELD_KEYS = {
    'vin':          ['fgst', 'fin', 'fahrgestell', 'vin', 'шасси', 'номер кузова', 'serial'],
    'engine':       ['motorkennbuchstabe', 'motor-kennbuchstabe', 'mot.', 'motor', 'engine', 'двигатель', 'двс', 'мотор', 'aggregat'],
    'gearbox':      ['getriebekennbuchstabe', 'getriebe', 'gearbox', 'transmission', 'код кпп', 'кпп', 'коробка передач', 'коробка', 'getr'],
    'paint':        ['lacknummer', 'lackierung', 'lack', 'paint', 'farbe', 'краска', 'цвет кузова', 'эмаль'],
    'roof_color':   ['dachfarbe', 'roof', 'крыша', 'цвет крыши'],
    'equip_code':   ['innenausstattung', 'ausstattung', 'interior', 'trim', 'салон', 'оснащение', 'обивка'],
    'prod_date':    ['baudatum', 'produktionsdatum', 'herstelldatum', 'build date', 'production date', 'дата производства', 'дата сборки', 'выпуск'],
    'model':        ['modell', 'model', 'модель', 'typ', 'baureihe'],
    'pr':           ['pr-nummer', 'pr nummer', 'pr-code', 'pr code', 'primärcode', 'primaercode', 'pr-коды', 'pr коды', 'коды оснащения', 'ausstattungscodes'],
    'model_year':   ['modelljahr', 'model year', 'модельный год', 'год выпуска', 'м.год'],
    'plant':        ['werk', 'plant', 'завод', 'производство'],
}
# «мусорные» строки, которые не надо считать полями
NOISE_RE = re.compile(r'^(seite|page|stand|version|datum|date|примечание|note|hinweis|комментарий|\.|=-|#|\*|$)', re.I)
# Подпись поля — ВСЁ до первого «:» или «=», пробелы разрешены
# («Код КПП: CQR», «Дата производства: 28.03.1999», «Motorkennbuchstabe: AKV»)
LABEL_RE = re.compile(r'^([^:=]{2,48}?)\s*[:=]\s*(.*)$')
# подписи, которые точно не являются полями (чтобы не засоряли отчёт)
NOT_FIELD_RE = NOISE_RE


def read_text(path):
    """Читает файл, подбирая кодировку. Возвращает (текст, кодировка)."""
    raw = open(path, 'rb').read()
    for enc in ('utf-8-sig', 'utf-8'):
        try:
            return raw.decode(enc), enc
        except UnicodeDecodeError:
            pass
    try:
        return raw.decode('cp1251'), 'cp1251'
    except UnicodeDecodeError:
        return raw.decode('latin-1', 'replace'), 'latin-1(replace)'


def line_shape(line):
    """Классифицирует строку — для режима --probe (что за формат у дампа)."""
    s = line.strip()
    if not s:
        return 'empty'
    if re.match(r'^[A-HJ-NPR-Z0-9]{17}$', s, re.I):
        return 'VIN (17 символов)'
    if re.match(r'^[^\s:=]{2,30}\s*[:=]\s*.+$', s):
        return 'KEY: VALUE'
    if re.match(r'^[^\s:=]{2,30}\s*[:=]\s*$', s):
        return 'KEY: (пусто)'
    if '\t' in s:
        return 'TAB-разделитель (%d полей)' % len(s.split('\t'))
    if re.match(r'^([A-Z0-9]{3}[\s,;]+){3,}[A-Z0-9]{3}\s*$', s, re.I):
        return 'список 3-символьных кодов (похоже на PR)'
    if re.match(r'^\d{4}-\d{2}-\d{2}$', s):
        return 'дата ISO'
    if re.match(r'^\d{2}[./]\d{2}[./]\d{2,4}$', s):
        return 'дата DD.MM.YYYY'
    if re.match(r'^[A-Z0-9]{1,4}\s*$', s):
        return 'короткий код (1–4 знака)'
    if re.match(r'^[\d\s.,;:/-]+$', s):
        return 'только цифры/пунктуация'
    if re.match(r'^\d+\s', s):
        return 'число + текст'
    return 'прочий текст'


def guess_field(label):
    """Определяет, какому полю соответствует подпись строки.

    Побеждает самое длинное совпавшее ключевое слово: иначе «Dachfarbe»
    уходило в paint (из-за «farbe»), а «Modelljahr» — в model (из-за «modell»)."""
    low = label.strip().lower().rstrip(':.')
    if NOT_FIELD_RE.match(low):
        return None
    best, best_len = None, 0
    for field, keys in FIELD_KEYS.items():
        for k in keys:
            if k in low and len(k) > best_len:
                best, best_len = field, len(k)
    return best


DATE_RE = re.compile(r'(\d{4}-\d{2}-\d{2}|\d{2}[./]\d{2}[./]\d{4}|\d{2}[./]\d{2}[./]\d{2})')
ENGINE_CODE_RE = re.compile(r'\b([A-Z0-9]{3})\b')
PR_RUN_RE = re.compile(r'\b([A-Z0-9]{3})\b')


def norm_date(s):
    s = s.strip()
    m = DATE_RE.search(s)
    if not m:
        return ''
    v = m.group(1)
    if re.match(r'^\d{4}-\d{2}-\d{2}$', v):
        return v
    parts = re.split(r'[./]', v)
    if len(parts) == 3:
        d, mo, y = parts
        if len(y) == 2:
            y = '19' + y if int(y) > 30 else '20' + y
        return '%s-%s-%s' % (y, mo.zfill(2), d.zfill(2))
    return ''


def parse_one(text, vin_from_name):
    """Достаёт поля из текста одного файла. Возвращает (record, notes)."""
    rec = {'vin': (vin_from_name or '').upper()}
    notes = []
    pr = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or NOISE_RE.match(line):
            continue
        m = LABEL_RE.match(line)
        if m:
            label, value = m.group(1).strip(), m.group(2).strip()
            field = guess_field(label)
            if not field:
                notes.append('неизвестная подпись: ' + label[:40])
                continue
            if not value:
                continue
            if field == 'vin':
                found = VIN_RE.search(value.upper())
                if found:
                    rec['vin'] = found.group(0)
            elif field == 'engine':
                c = ENGINE_CODE_RE.search(value.upper())
                if c:
                    rec['engine'] = c.group(1)
                else:
                    notes.append('engine: не нашёл 3-значный код в «%s»' % value[:40])
            elif field == 'gearbox':
                up = value.upper()
                fam = re.search(r'\b(002|01M|01N|020|02K|084|085)\b', up)
                code = re.search(r'\b([A-Z]{3})\b', up)
                if fam:
                    rec['gearbox'] = fam.group(1)
                if code:
                    rec['gearbox_code'] = code.group(1)
                if not fam and not code:
                    notes.append('gearbox: не разобрал «%s»' % value[:40])
            elif field in ('paint', 'roof_color', 'equip_code'):
                rec[field] = value.split()[0][:4]
            elif field == 'prod_date':
                d = norm_date(value)
                if d:
                    rec['prod_date'] = d
                else:
                    notes.append('prod_date: не разобрал «%s»' % value[:40])
            elif field in ('model', 'model_year', 'plant'):
                rec[field] = value[:60] if field == 'model' else value[:12]
            elif field == 'pr':
                pr += [c.group(1) for c in PR_RUN_RE.finditer(value.upper())]
            continue
        # строка без подписи: ищем PR-коды (длинные серии 3-значных токенов)
        toks = [c.group(1) for c in PR_RUN_RE.finditer(line.upper())]
        if len(toks) >= 6 and len(set(toks)) >= 5:
            pr += toks
        else:
            v = VIN_RE.search(line.upper())
            if v and not rec['vin']:
                rec['vin'] = v.group(0)
    # склейка trim (старый формат): кузов+крыша+оснащение
    if rec.get('paint') and rec.get('roof_color') and rec.get('equip_code'):
        rec['trim'] = (rec['paint'] + rec['roof_color'] + rec['equip_code'])[:8]
    if pr:
        seen, out = set(), []
        for c in pr:
            if c not in seen:
                seen.add(c)
                out.append(c)
        rec['pr'] = sorted(out)
    return rec, notes


def dict_from_app(name):
    p = os.path.join(ROOT, 'js', 'app.js')
    if not os.path.exists(p):
        return set()
    s = open(p, encoding='utf-8').read()
    i = s.find('const %s = {' % name)
    if i < 0:
        return set()
    j = s.find('\n};', i)
    return set(re.findall(r"'([^']+)'\s*:", s[i:j]))


def gearbox_codes():
    p = os.path.join(ROOT, 'js', 'app.js')
    if not os.path.exists(p):
        return set()
    s = open(p, encoding='utf-8').read()
    i = s.find('const GEARBOX = {')
    j = s.find('const GEARBOX_MISC', i)
    return set(re.findall(r"'([A-Z0-9]{3,6})'", s[i:j])) if i >= 0 else set()


def collect_files(src, files_list, limit):
    out = []
    if files_list and os.path.exists(files_list):
        for line in open(files_list, encoding='utf-8', errors='replace'):
            name = line.strip().replace('.\\', '').replace('./', '')
            if not name:
                continue
            cand = [os.path.join(src, name), name, os.path.join(src, os.path.basename(name))]
            for c in cand:
                if os.path.isfile(c):
                    out.append(c)
                    break
    else:
        for root, _dirs, files in os.walk(src):
            for f in files:
                if f.lower().endswith('.txt'):
                    out.append(os.path.join(root, f))
    out.sort()
    return out[:limit] if limit else out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True, help='папка с .txt дампа ETKA')
    ap.add_argument('--files', help='список путей (vin-dump/filtered-files.txt)')
    ap.add_argument('--limit', type=int, default=0, help='обработать не больше N файлов (0 = все)')
    ap.add_argument('--probe', action='store_true', help='только изучить формат, ничего не писать в data/')
    ap.add_argument('--out', default=os.path.join(ROOT, 'data', 'vin-db.json'))
    ap.add_argument('--show', type=int, default=2, help='сколько файлов целиком показать в probe-отчёте')
    a = ap.parse_args()

    if not os.path.isdir(a.src):
        print('нет папки: %s' % a.src)
        sys.exit(2)
    files = collect_files(a.src, a.files, a.limit)
    if not files:
        print('в %s не найдено .txt' % a.src)
        sys.exit(2)
    print('файлов к разбору: %d' % len(files))

    shapes = collections.Counter()
    encs = collections.Counter()
    labels = collections.Counter()
    unknown_labels = collections.Counter()
    sample_lines = []
    records = []
    fill = collections.Counter()
    notes_all = collections.Counter()
    bad_vin = 0
    for i, f in enumerate(files):
        text, enc = read_text(f)
        encs[enc] += 1
        name_vin = ''
        m = re.search(r'([A-HJ-NPR-Z0-9]{17})', os.path.basename(f), re.I)
        if m:
            name_vin = m.group(1).upper()
        if i < a.show:
            sample_lines.append('=== %s (%s, %d строк) ===\n%s' % (
                os.path.basename(f), enc, len(text.splitlines()),
                '\n'.join(text.splitlines()[:28])))
        for line in text.splitlines():
            s = line.strip()
            shapes[line_shape(s)] += 1
            mm = LABEL_RE.match(s)
            if mm:
                lab = mm.group(1).strip()
                labels[lab] += 1
                if not guess_field(lab) and not NOISE_RE.match(s):
                    unknown_labels[lab] += 1
        rec, notes = parse_one(text, name_vin)
        for n in notes:
            notes_all[n] += 1
        if not rec.get('vin'):
            bad_vin += 1
        else:
            if rec['vin'] != name_vin and name_vin:
                rec['_vin_mismatch'] = name_vin
            for k in ('engine', 'gearbox', 'gearbox_code', 'paint', 'roof_color', 'equip_code', 'prod_date', 'pr', 'model'):
                if rec.get(k):
                    fill[k] += 1
        records.append(rec)
        if a.limit and i + 1 >= a.limit:
            break

    # сверка со словарями приложения
    ENGINES = dict_from_app('ENGINES')
    GBC = gearbox_codes()
    eng_bad = collections.Counter(r['engine'] for r in records if r.get('engine') and ENGINES and r['engine'] not in ENGINES)
    gb_bad = collections.Counter(r['gearbox_code'] for r in records if r.get('gearbox_code') and GBC and r['gearbox_code'] not in GBC)
    prdict = {}
    prp = os.path.join(ROOT, 'data', 'pr-codes.json')
    if os.path.exists(prp):
        prdict = json.load(open(prp, encoding='utf-8'))
    pr_bad = collections.Counter()
    pr_total = 0
    for r in records:
        for c in (r.get('pr') or []):
            pr_total += 1
            if prdict and c not in prdict:
                pr_bad[c] += 1

    L = []
    L.append('# Отчёт разбора дампа ETKA — %s' % __import__('datetime').date.today())
    L.append('')
    L.append('Режим: **%s** · папка: `%s` · файлов: **%d**' % ('probe (ничего не записано)' if a.probe else 'полный', a.src, len(files)))
    L.append('')
    L.append('## Кодировки')
    for k, v in encs.most_common():
        L.append('- %s — %d файлов' % (k, v))
    L.append('')
    L.append('## Форма строк (что за формат у дампа)')
    L.append('')
    L.append('| Форма | Строк |')
    L.append('|---|---|')
    for k, v in shapes.most_common(14):
        L.append('| %s | %d |' % (k, v))
    L.append('')
    L.append('## Подписи полей (топ-40)')
    L.append('')
    L.append('| Подпись | Встречена | Распознана как |')
    L.append('|---|---|---|')
    for k, v in labels.most_common(40):
        L.append('| `%s` | %d | %s |' % (k[:38], v, guess_field(k) or '— НЕТ —'))
    L.append('')
    L.append('Нераспознанных подписей: **%d** уникальных (%d вхождений)' % (
        len(unknown_labels), sum(unknown_labels.values())))
    if unknown_labels:
        L.append('')
        L.append('Топ нераспознанного (это и надо добавить в FIELD_KEYS):')
        L.append('')
        for k, v in unknown_labels.most_common(25):
            L.append('- `%s` — %d' % (k[:50], v))
    L.append('')
    L.append('## Заполненность полей')
    L.append('')
    L.append('| Поле | Заполнено | %% |')
    L.append('|---|---|---|')
    n = max(1, len(records))
    for k in ('vin', 'engine', 'gearbox', 'gearbox_code', 'paint', 'roof_color', 'equip_code', 'prod_date', 'model', 'pr'):
        v = fill.get(k, 0) if k != 'vin' else sum(1 for r in records if r.get('vin'))
        L.append('| %s | %d | %.1f %% |' % (k, v, 100.0 * v / n))
    L.append('')
    L.append('Файлов без VIN: %d · расхождений VIN (имя файла ↔ содержимое): %d' % (
        bad_vin, sum(1 for r in records if r.get('_vin_mismatch'))))
    L.append('')
    L.append('## Сверка со словарями приложения')
    L.append('')
    L.append('- кодов мотора вне `ENGINES`: **%d** уникальных %s' % (
        len(eng_bad), ('— ' + ', '.join('%s×%d' % (k, v) for k, v in eng_bad.most_common(10))) if eng_bad else ''))
    L.append('- буквенных кодов КПП вне `GEARBOX`: **%d** уникальных %s' % (
        len(gb_bad), ('— ' + ', '.join('%s×%d' % (k, v) for k, v in gb_bad.most_common(10))) if gb_bad else ''))
    L.append('- PR-кодов всего: %d, вне `pr-codes.json`: **%d** уникальных %s' % (
        pr_total, len(pr_bad), ('— ' + ', '.join('%s×%d' % (k, v) for k, v in pr_bad.most_common(10))) if pr_bad else ''))
    L.append('')
    if notes_all:
        L.append('## Замечания разбора (топ-20)')
        L.append('')
        for k, v in notes_all.most_common(20):
            L.append('- %s — %d' % (k[:110], v))
        L.append('')
    L.append('## Примеры файлов (как есть)')
    L.append('')
    for s in sample_lines:
        L.append('```')
        L.append(s[:2200])
        L.append('```')
        L.append('')
    if not a.probe:
        good = [r for r in records if r.get('vin')]
        for r in good:
            r.pop('_vin_mismatch', None)
        L.append('## Пример разобранной записи')
        L.append('')
        L.append('```json')
        L.append(json.dumps(good[0] if good else {}, ensure_ascii=False, indent=1)[:1200])
        L.append('```')

    text_out = '\n'.join(L)
    print(text_out[:4000])
    outdir = os.path.join(ROOT, 'restore')
    if not os.path.exists(outdir):
        os.makedirs(outdir)
    name = 'ETKA-PROBE.md' if a.probe else 'ETKA-PARSE-REPORT.md'
    with open(os.path.join(outdir, name), 'w', encoding='utf-8') as fh:
        fh.write(text_out)
    print('\nотчёт: restore/%s (%d байт)' % (name, len(text_out.encode('utf-8'))))

    if not a.probe:
        good = [r for r in records if r.get('vin')]
        seen, uniq = set(), []
        for r in good:
            if r['vin'] in seen:
                continue
            seen.add(r['vin'])
            uniq.append(r)
        with open(a.out, 'w', encoding='utf-8') as fh:
            fh.write(json.dumps(uniq, ensure_ascii=False))
        print('записано %s: %d записей (%d уникальных VIN)' % (a.out, len(good), len(uniq)))
        if len(uniq) > 2000:
            print('⚠ файл большой (%.1f МБ) — приложение грузит его целиком;'
                  ' подумайте о разбивке или о том, чтобы оставить только нужные модели'
                  % (os.path.getsize(a.out) / 1048576.0))


if __name__ == '__main__':
    main()
