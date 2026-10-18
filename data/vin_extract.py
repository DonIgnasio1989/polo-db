#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
vin_extract.py — двухстадийная выжимка офлайн-базы VIN под модели каталога
(VW Polo 6N1/6N2, Classic 6V2/6KV, Variant 6V5, Caddy 9K/9U;
опционально доноры Seat 6K / Lupo 6X).

Стадия 1 (ФИЛЬТР): обход папки с базой. Поддерживается ЛЮБАЯ смесь форматов:
  • txt-файлы «1 файл = 1 VIN» (содержимое: строка-строка через ';', просто VIN,
    VIN + строки PR-словаря, таблица из нескольких строк; если файл пустой —
    VIN берётся из имени файла);
  • большие таблицы: CSV/TSV/TXT с заголовком и без, JSON, JSONL, SQLite, XML.
Найденные VIN наших моделей записываются в out/filtered-vins.txt
(и out/filtered-files.txt — пути к файлам). Флаг --scan-only останавливается здесь.

Стадия 2 (СБОРКА): найденные записи расшифровываются теми же таблицами, что и
сайт (модель, кузов, поколение, год, завод, бренд), обогащаются полями источника
(мотор, семейство/код КПП, краска, салон, дата, PR-коды) и складываются В ОДНУ БАЗУ:
out/vin-db.jsonl.gz (+ out/vin-db.sqlite при --sqlite) и отчёт out/vin-db.meta.json.

Повторная сборка без перескана: --from-list out/filtered-files.txt

Запуск:
  python3 vin_extract.py -i /путь/к/базе -o ./out -v
  python3 vin_extract.py -i /путь/к/базе -o ./out --scan-only      # только фильтр
  python3 vin_extract.py -i /путь/к/базе -o ./out --from-list ./out/filtered-files.txt --sqlite
"""

import argparse
import csv
import gzip
import io
import json
import os
import re
import sqlite3
import sys
import time
from collections import Counter

# Windows-консоли (cp866/cp1251) не умеют часть символов — не падаем, а заменяем
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

VIN_RE = re.compile(r'(?<![A-HJ-NPR-Z0-9])[A-HJ-NPR-Z0-9]{17}(?![A-HJ-NPR-Z0-9])')  # только целым токеном
VIN_FULL_RE = re.compile(r'^[A-HJ-NPR-Z0-9]{17}$')

# ─────────────────── Таблицы расшифровки (зеркало js/app.js) ───────────────────
VY = {'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986, 'H': 1987,
      'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995,
      'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999, 'Y': 2000, '1': 2001, '2': 2002, '3': 2003,
      '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009}
VP = {'A': ['Ingolstadt', 'DE'], 'B': ['Bruxelles', 'BE'], 'C': ['Chattanooga', 'US'],
      'D': ['Bratislava', 'SK'], 'E': ['Emden', 'DE'], 'F': ['Resende', 'BR'],
      'G': ['Graz', 'AT'], 'H': ['Hannover', 'DE'], 'K': ['Osnabrück', 'DE'],
      'L': ['Lagos', 'NG'], 'M': ['Puebla', 'MX'], 'N': ['Neckarsulm', 'DE'],
      'P': ['Mosel / Anchieta', 'DE/BR'], 'R': ['Martorell', 'ES'], 'S': ['Salzgitter', 'DE'],
      'T': ['Taubaté / Sarajevo', 'BR/BA'], 'U': ['Uitenhage', 'ZA'],
      'V': ['Palmela / Westmoreland', 'PT/US'], 'W': ['Wolfsburg', 'DE'],
      'X': ['Poznań', 'PL'], 'Y': ['Pamplona', 'ES'], 'Z': ['Zwickau', 'DE'],
      '1': ['Győr', 'HU'], '2': ['Anting', 'CN'], '3': ['Changchun', 'CN'],
      '4': ['Curitiba', 'BR'], '8': ['Dresden / Pacheco', 'DE/AR'], '9': ['Września', 'PL']}
VW_MODELS = {
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
    'SK': 'Caddy 4', 'SY': 'Crafter 2'}

CATALOG_PREFIXES = ('6N', '6V', '9K', '9U')          # модели каталога
DONOR_PREFIXES = ('6K', '6X')                        # доноры (Seat 6K, Lupo 6X)

# Коды моторов / КПП приложения — для распознавания полей БЕЗ заголовков
ENGINES_SET = set("""AER ALL AEV ALD ANV AUC AEX APQ AKV ANX AKK ANW AUD APE AUA AEE ALM AUR AFT
1F ADZ AKW AHB AEY AGP AQM AYQ ASV 1Y AFN AHU ALE AGR ALH ADX AEA AHS AFH AJV AHW AKL AHT ABU
AKQ AFK ANM AKU AHG AGD AEF AKP AHV AMF""".split())
GB_FAMS_SET = {'084', '085', '002', '020', '02K', '01M', '01N'}
GB_CODES_SET = set("""ADX AGX AHK AKV AKW AKX AKY APY AUD CDK CED CEL CEN CEX CEY CFJ CFK CFL CFM
CFN CFO CFP CFQ CFR CFS CFT CFU CFV CFW CFX CFY CFZ CGA CGB CGC CGD CGE CGF CGG CGH CGI CGJ CGK
CGL CGM CGN CGO CGP CGQ CGR CGS CGT CGU CGW CGX CGY CGZ CHA CHB CHC CHD CHE CHF CHG CHH CHI CHJ
CHK CHL CHM CHN CHO CHP CHQ CHR CHS CHT CHU CHV CHW CHX CHY CHZ AEB AFA AGY AHD AHL AHZ ATV AUE
AYZ CCK CEC CEE CEF CEG CEH CEK CEM CHX CJB CJC CJG CKE CKM CKN CKP CKR CKS CKT CLJ CMC CNU CPZ
CRA CRX CSD CTW CTY CWL CWM CWN CWP CWR CWS CWT CWU CWV CWW CWX CZG DCA DCC DCD DCE DCG DCH DCJ
DCK DCT DDH DDJ DEB DED DHB DKC DKD DKE DKE085 DKF DKG DPE DPX DQW DQX DRC DSK DSP DSQ DTX DUQ
DUY DUZ DWY DWZ DXB DXC DXD DXE DXF DXG DXH DXJ DXK DXL DXM DXN DXP DXQ DYF DYG DYH DYJ DYK DYL
EKY ENA ENB EQV EQW EQX EQY EQZ ERA ERB ERC ERD ESY ESZ ETA ETB ETC ETD ETE ETF ETG EUX EUY FCC
FCD FDQ FDY FFC FFD FFE FFF FFG FFH FFJ FFK FFL FFM FFN FFP FFQ FFR FFS FFT FFU FFV FFW FFX FGF
FHX FHY FHZ FJA FJB FJD FJE FLE FPQ GJE DTP DTQ DVM DWT DWU DWV DWW DYR DYS DYT DYU DYV DYW DYX
DYY DYZ DZA EDA EDK EDL EFM EMH FCM FJQ FNK GCG FMC""".split())
ENGINE_CURATED = {  # проверенные буквенные коды КПП под мотор (ti-lo.de / polomagazin.de)
    'AER': ['DKC', 'DKG', 'DWZ', 'DXD'], 'ALL': ['DWZ', 'DXD', 'EQW'],
    'AEV': ['CWL', 'CWN', 'DCA', 'DCD'], 'ANV': ['ESY'], 'AUC': ['FDY', 'FFD'],
    'ADX': ['CJC', 'CWU', 'DCJ', 'DXK'], 'AEX': ['DDH', 'DHB', 'DKF', 'DQW', 'DXP'],
    'ANX': ['ERD'], 'AUD': ['ERD'], 'AHW': ['ETE', 'FFR', 'FFS'], 'AKQ': ['DUY', 'DXP'],
    'AFK': ['ETB', 'ETC', 'FHZ'], 'AFH': ['CWX', 'DSP', 'DXJ', 'DXM'],
    'AEA': ['CKE', 'CLJ', 'CWS', 'CWV'],
    'AEE': ['CZG', 'DCC', 'DCG', 'DDJ', 'DKE', 'DKE085', 'DSQ', 'DXE', 'DXH', 'EQY', 'EQZ'],
    'AJV': ['DTX'], 'AKU': ['DED', 'DXQ', 'ETA', 'ETF', 'FDQ'], 'AHG': ['DXG'],
    'AGD': ['DPX', 'DXF', 'EQX'], 'AEF': ['CWT', 'DCH', 'DCT', 'DED'],
}
TYPE_RE = re.compile(r'^(6N[12]|6V[25]|9K[0-9A-Z]?|9U[0-9A-Z]?|6K[0-9A-Z])[0-9A-Z]*$')
DATE_RE = re.compile(r'^(\d{2})(\d{2})(\d{4})$')
YEAR_RE = re.compile(r'^(19[89]\d|20[01]\d)$')
PAINT_RE = re.compile(r'^[A-Z0-9]{2}([A-Z0-9]{4})?$')
PR_LINE_RE = re.compile(r'^([A-Z0-9]{3})\t')

# Кандидаты имён полей для форматов с заголовками
FIELD_CANDIDATES = {
    'vin':          ('vin', 'wvin', 'chassis', 'chassisnumber', 'ident', 'identnr', 'number', 'vinnumber'),
    'engine':       ('engine', 'enginecode', 'motor', 'motorkennbuchstaben', 'mkb', 'eng'),
    'gearbox':      ('gearbox', 'transmission', 'trans', 'getriebe', 'gearboxfamily', 'transfamily'),
    'gearbox_code': ('gearboxcode', 'gearcode', 'gkb', 'getriebekennbuchstaben', 'transcode', 'boxcode'),
    'paint':        ('paint', 'color', 'colour', 'lack', 'bodycolor', 'paintcode'),
    'trim':         ('trim', 'equipment', 'equip', 'trimlevel', 'ausstattung'),
    'pr':           ('pr', 'prcodes', 'prc', 'options', 'optioncodes'),
}


def decode(vin):
    """Зеркало vD() из js/app.js."""
    x = vin.upper()
    w = x[:3]
    brand = 'Неизвестно'
    if w == 'WVW': brand = 'Volkswagen'
    elif w == 'WV1': brand = 'Volkswagen (коммер.)'
    elif w == 'WV2': brand = 'Volkswagen (автобус/фургон)'
    elif w == 'WV3': brand = 'Volkswagen (грузовики)'
    elif w == 'WVG': brand = 'Volkswagen (SUV)'
    elif w == '1VW': brand = 'Volkswagen USA'
    elif w == '1V1': brand = 'Volkswagen USA (коммер.)'
    elif w == '3VW': brand = 'VW Mexico'
    elif w == '8AW': brand = 'VW Argentina'
    elif w in ('9BW', '9BV'): brand = 'VW do Brasil'
    elif w == 'AAV': brand = 'VW South Africa'
    elif w in ('VSS', 'VSK'): brand = 'SEAT'
    elif w in ('WAU', 'TRU', '93V'): brand = 'Audi'
    elif w.startswith('TM'): brand = 'Škoda'
    elif w and w[0] == 'W': brand = 'Volkswagen Group (Германия)'

    vp = x[6:9]
    if not re.match(r'^[0-9A-Z]{3}$', vp) or vp == 'ZZZ':
        vp = x[3:6]

    model, body, gen, note = '—', '—', '', ''
    if vp.startswith('6N'):
        if vp == '6N1': model, body, gen = 'Polo (6N1)', 'Hatchback', '6N1'
        elif vp == '6N2': model, body, gen = 'Polo (6N2)', 'Hatchback', '6N2'
        else: model, body = 'Polo (6N)', 'Hatchback'
    elif vp.startswith('6V'):
        if vp == '6V2': model, body = 'Polo Classic (6V2)', 'Classic Sedan'
        elif vp == '6V5': model, body = 'Polo Variant (6V5)', 'Variant'
        else: model = 'Polo Classic/Variant (6V)'
    elif vp.startswith('6K'):
        if w.startswith('VSS'): model, note = 'Seat Ibiza/Cordoba (6K)', 'донор'
        else: model, note = 'Polo Classic/Variant (6KV)', 'седан/универсал на платформе Seat Córdoba'
    elif vp.startswith('9K'): model, body, note = 'Caddy (9K)', 'Van', 'фургон/комби на платформе Seat Ibiza 6K'
    elif vp.startswith('9U'): model, body, note = 'Caddy Pickup (9U)', 'Pickup', 'на базе Škoda Felicia Pickup'
    elif vp.startswith('9N'): model, body, note = 'Polo (9N)', 'Hatchback', 'следующее поколение (2001–2009)'
    elif vp[:2] in VW_MODELS: model, note = VW_MODELS[vp[:2]], 'вне рамок каталога (Polo/Caddy 1994–2003)'
    else: model = 'Неизвестная модель (код %s)' % vp

    pl = VP.get(x[10], ['—', '—'])
    return {'brand': brand, 'model': model, 'body': body, 'gen': gen, 'note': note,
            'year': VY.get(x[9]), 'plant': pl[0], 'plant_country': pl[1],
            'model_code': vp, 'serial': x[11:]}


def matches(vp, include_donors):
    if vp[:2] in CATALOG_PREFIXES:
        return True
    return bool(include_donors) and vp[:2] in DONOR_PREFIXES


def norm_key(s):
    return re.sub(r'[^a-z0-9]', '', str(s or '').lower())


def pick(rec, key, extra_map):
    names = list(FIELD_CANDIDATES[key])
    if key in extra_map:
        names = [norm_key(extra_map[key])] + names
    low = {norm_key(k): v for k, v in rec.items() if isinstance(v, str) and v}
    for n in names:
        if n in low:
            return str(low[n]).strip()
    return ''


def find_vin(rec):
    v = pick(rec, 'vin', {})
    if v and VIN_FULL_RE.match(v.upper()):
        return v.upper()
    for val in rec.values():
        if isinstance(val, str):
            m = VIN_FULL_RE.match(val.strip().upper())
            if m:
                return m.group(0)
    return ''


# ─────────────────────────── Читатели форматов ───────────────────────────
def _row_to_dict(vals, columns):
    """Строка без заголовка -> dict ролей: по --columns или эвристикой по значениям."""
    vals = [(v or '').strip() for v in vals]
    if columns:
        rec = {}
        for role, val in zip(columns, vals):
            if role and role not in ('skip', '.', ''):
                rec.setdefault(role, val)
        return rec
    rec = {}

    def put(role, val):
        if role not in rec:
            rec[role] = val
            return True
        return False

    for v in vals:
        if not v:
            continue
        u = v.upper()
        if VIN_FULL_RE.match(u) and put('vin', u):
            continue
        if TYPE_RE.match(u) and put('type', u):
            continue
        if u in ENGINES_SET and put('engine', u):
            continue
        if u in GB_CODES_SET and put('gearbox_code', u):
            continue
        if u in GB_FAMS_SET and put('gearbox', u):
            continue
        if DATE_RE.match(v) and put('date', v):
            continue
        if YEAR_RE.match(v) and put('year', v):
            continue
        if PAINT_RE.match(u) and put('paint', u):
            continue
        if len(v) >= 60 and put('pr', v):
            continue
    return rec


def iter_txt(path, columns=None):
    """1 файл = 1 VIN: строка-строка ';', просто VIN, VIN + PR-словарь, таблица."""
    try:
        with io.open(path, 'r', encoding='utf-8', errors='replace') as f:
            text = f.read(512 * 1024)
    except OSError:
        return
    lines = [l.rstrip('\r\n') for l in text.splitlines() if l.strip()]
    if not lines:
        # пустой файл: VIN может быть в имени — отдаём пустую запись,
        # build_record подставит VIN из имени файла
        yield {}
        return
    # таблица: несколько строк с ';' одинаковой ширины
    if len(lines) >= 5 and all(';' in l for l in lines[:5]):
        for l in lines:
            d = _row_to_dict(l.split(';'), columns)
            if d:
                yield d
        return
    rec = {}
    row = next((l for l in lines if ';' in l), None)
    if row:
        rec.update(_row_to_dict(row.split(';'), columns))
    if not rec.get('vin'):
        for l in lines:
            m = VIN_RE.search(l.upper())
            if m:
                rec['vin'] = m.group(0)
                break
    prs = []
    for l in lines:
        ls = l.strip()
        m = PR_LINE_RE.match(l)
        if m:
            prs.append(m.group(1))
        elif len(ls) >= 60 and len(ls) % 3 == 0 and re.match(r'^[A-Z0-9]+$', ls.upper()) and not rec.get('pr'):
            rec['pr'] = ls.upper()
    if prs and not rec.get('pr'):
        rec['pr'] = prs
    for l in lines:
        ls = l.strip().upper()
        if ls in ENGINES_SET and not rec.get('engine'):
            rec['engine'] = ls
        elif ls in GB_CODES_SET and not rec.get('gearbox_code'):
            rec['gearbox_code'] = ls
    if rec:
        yield rec


def iter_csv(path, columns=None):
    with io.open(path, 'r', encoding='utf-8', errors='replace', newline='') as f:
        head = f.readline()
        f.seek(0)
        delim = ';' if head.count(';') > max(head.count(','), head.count('\t')) else (
            '\t' if head.count('\t') > head.count(',') else ',')
        first = next(csv.reader([head], delimiter=delim), [])
        headerless = any(VIN_FULL_RE.match((c or '').strip().upper()) for c in first)
        if headerless:
            for row in csv.reader(f, delimiter=delim):
                d = _row_to_dict(row, columns)
                if d:
                    yield d
            return
        reader = csv.DictReader(f, delimiter=delim)
        for row in reader:
            yield {k: v for k, v in row.items() if k is not None}


def iter_jsonl(path, columns=None):
    with io.open(path, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                if isinstance(rec, dict):
                    yield rec
            except ValueError:
                continue


def iter_json(path, columns=None):
    with io.open(path, 'r', encoding='utf-8', errors='replace') as f:
        data = json.load(f)
    if isinstance(data, dict):
        for key in ('parts', 'items', 'data', 'records', 'rows', 'vins'):
            if isinstance(data.get(key), list):
                data = data[key]
                break
        else:
            data = [data]
    if isinstance(data, list):
        for rec in data:
            if isinstance(rec, dict):
                yield rec


def iter_sqlite(path, columns=None):
    con = sqlite3.connect('file:%s?mode=ro' % path, uri=True)
    con.row_factory = sqlite3.Row
    try:
        tables = [r[0] for r in con.execute(
            "SELECT name FROM sqlite_master WHERE type='table'")]
        for t in tables:
            try:
                for row in con.execute('SELECT * FROM "%s"' % t):
                    yield dict(row)
            except sqlite3.Error:
                continue
    finally:
        con.close()


def iter_xml(path, columns=None):
    from xml.etree import ElementTree as ET
    for _, el in ET.iterparse(path, events=('end',)):
        if len(el) == 0:
            continue
        rec = {ch.tag: (ch.text or '').strip() for ch in el}
        if rec:
            yield rec
        el.clear()


READERS = {'.txt': iter_txt, '.csv': iter_csv, '.tsv': iter_csv,
           '.jsonl': iter_jsonl, '.ndjson': iter_jsonl,
           '.json': iter_json, '.db': iter_sqlite, '.sqlite': iter_sqlite, '.sqlite3': iter_sqlite,
           '.xml': iter_xml}


def richness(rec):
    return sum(1 for v in rec.values() if v)


def vin_candidates(rec):
    """Все VIN-подобные строки записи (поля, строки содержимого, имя файла)."""
    cands = []
    for val in rec.values():
        if isinstance(val, str):
            for m in VIN_RE.finditer(val.upper()):
                if m.group(0) not in cands:
                    cands.append(m.group(0))
    stem = os.path.splitext(os.path.basename(str(rec.get('__file__', ''))))[0].upper()
    if VIN_FULL_RE.match(stem) and stem not in cands:
        cands.append(stem)
    return cands


def build_record(rec, extra_map, pr_dict, stats):
    """rec (dict ролей/именованных полей) -> готовая запись базы или None."""
    # Из всех VIN-подобных строк берём ту, что декодируется в наши модели:
    # в дампах ETKA встречались 17-символьные внутренние FGST-ключи
    # (напр. Y1UML44E06N007481) — они похожи на VIN, но моделью не являются.
    vin = ''
    for c in vin_candidates(rec):
        if matches(decode(c)['model_code'], stats['include_donors']):
            vin = c
            break
    if not vin:
        if vin_candidates(rec):
            stats['fgst_keys'] += 1     # VIN-подобный ключ, но не наша модель
        else:
            stats['no_vin'] += 1
        return None
    d = decode(vin)
    stats['matched'] += 1
    out = {'vin': vin}
    out.update(d)
    for key in ('engine', 'gearbox', 'gearbox_code', 'trim', 'pr'):
        val = pick(rec, key, extra_map) or rec.get(key, '')
        if val:
            out[key] = val
    paint = pick(rec, 'paint', extra_map) or rec.get('paint', '')
    if paint:
        if len(paint) >= 6:
            # колонка дампа ETKA = кузов + крыша + код оснащения (J2J241 = J2 / J2 / 41)
            out['paint'], out['roof_color'], out['equip_code'] = paint[:2], paint[2:4], paint[4:6]
            out['trim'] = paint[2:6]   # совместимость со старыми версиями сайта
        elif len(paint) == 4:
            out['paint'], out['roof_color'] = paint[:2], paint[2:]
            out['trim'] = paint[2:]
        else:
            out['paint'] = paint
    tcode = rec.get('type', '')
    if tcode:
        out['type_code'] = tcode
        m = re.match(r'^(6N[12]|6V[25])', tcode)
        if m:
            out['gen'] = m.group(1)
            if m.group(1) in ('6N1', '6N2'):
                out['model'] = 'Polo (%s)' % m.group(1)
            if not out.get('body') or out['body'] == '—':
                out['body'] = 'Hatchback' if m.group(1).startswith('6N') else (
                    'Classic Sedan' if m.group(1) == '6V2' else 'Variant')
    d8 = rec.get('date', '')
    md = DATE_RE.match(d8 or '')
    if md:
        out['prod_date'] = '%s-%s-%s' % (md.group(3), md.group(2), md.group(1))
    yr = rec.get('year', '')
    if yr and YEAR_RE.match(str(yr)):
        out['year_src'] = int(yr)
        if out.get('year') and out['year'] != int(yr):
            out['warn'] = 'год VIN (%s) != год источника (%s)' % (out['year'], yr)
    eng, gkb = out.get('engine'), out.get('gearbox_code')
    if eng and gkb and eng in ENGINE_CURATED:
        out['xcheck'] = 'ok' if gkb in ENGINE_CURATED[eng] else 'mismatch'
    pr = out.get('pr')
    if pr and not isinstance(pr, list):
        if ',' in pr or ';' in pr:
            out['pr'] = [x.strip() for x in re.split(r'[;,]', pr) if x.strip()]
        elif len(pr) >= 9 and len(pr) % 3 == 0 and all(
                re.match(r'^[A-Z0-9]{3}$', pr[i:i + 3]) for i in range(0, len(pr), 3)):
            out['pr'] = [pr[i:i + 3] for i in range(0, len(pr), 3)]
            if pr_dict:
                unk = [c for c in out['pr'] if c not in pr_dict]
                if unk:
                    stats['pr_unknown'] += len(unk)
    if isinstance(out.get('pr'), list) and out.get('gearbox') in ('01M', '01N') and 'G0C' in out['pr']:
        out['warn'] = (out.get('warn', '') + '; ' if out.get('warn') else '') + 'PR G0C (5-МКПП) при семействе АКПП'
    return out


def main():
    ap = argparse.ArgumentParser(description='Фильтр офлайн-базы VIN (1 файл = 1 VIN или таблицы) '
                                             'под модели Polo/Caddy и сборка в одну базу')
    ap.add_argument('-i', '--input', default='.', nargs='?',
                    help='файл или каталог с базой (по умолчанию — текущая папка)')
    ap.add_argument('-o', '--out', default='./out', help='каталог результата')
    ap.add_argument('--include-donors', action='store_true', help='включить доноров Seat 6K / Lupo 6X')
    ap.add_argument('--sqlite', action='store_true', help='дополнительно собрать vin-db.sqlite')
    ap.add_argument('--scan-only', action='store_true', help='стадия 1 без сборки: только список наших VIN')
    ap.add_argument('--from-list', default='', help='не сканировать: собрать базу из списка файлов (filtered-files.txt)')
    ap.add_argument('--copy-filtered', default='', help='копировать совпавшие файлы в указанный каталог')
    ap.add_argument('--ext', default='txt,csv,tsv,json,jsonl,ndjson,db,sqlite,sqlite3,xml',
                    help='расширения файлов при обходе каталога')
    ap.add_argument('--map', default='{}', help='JSON-переопределение имён колонок: \'{"engine":"MKB"}\'')
    ap.add_argument('--columns', default='',
                    help='роли полей беззаголовочных строк: vin,type,paint,engine,id,gkb,skip,date,skip,year,pr')
    ap.add_argument('--pr-dict', default='', help='путь к словарю PR-кодов (по умолчанию ../data/pr-codes.json)')
    ap.add_argument('--update-pr-dict', nargs='?', const='', default=None,
                    help='дописать в словарь pr-codes.json все PR-коды из собранных записей '
                         '(новые коды — с пустым описанием); значение — путь к словарю, по умолчанию где лежит')
    ap.add_argument('--limit', type=int, default=0, help='остановиться после N найденных VIN (проба)')
    ap.add_argument('-v', '--verbose', action='store_true')
    args = ap.parse_args()
    extra_map = json.loads(args.map or '{}')
    columns = [c.strip() for c in args.columns.split(',')] if args.columns else None
    exts = None if args.ext.strip() == '*' else set(
        '.' + e.strip().lower().lstrip('.') for e in args.ext.split(',') if e.strip())

    pr_dict = {}
    pr_path = args.pr_dict or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'pr-codes.json')
    if os.path.exists(pr_path):
        try:
            with io.open(pr_path, encoding='utf-8') as f:
                pr_dict = json.load(f)
        except (ValueError, OSError):
            pr_dict = {}

    os.makedirs(args.out, exist_ok=True)
    if args.copy_filtered:
        os.makedirs(args.copy_filtered, exist_ok=True)
    out_jsonl = os.path.join(args.out, 'vin-db.jsonl.gz')
    out_meta = os.path.join(args.out, 'vin-db.meta.json')
    out_vins = os.path.join(args.out, 'filtered-vins.txt')
    out_files = os.path.join(args.out, 'filtered-files.txt')
    out_sql = os.path.join(args.out, 'vin-db.sqlite')

    # ── Список файлов ──
    if args.from_list:
        with io.open(args.from_list, encoding='utf-8') as f:
            paths = [l.strip() for l in f if l.strip()]
    elif os.path.isdir(args.input):
        paths = []
        for root, _dirs, files in os.walk(args.input):
            for fn in files:
                stem, ext = os.path.splitext(fn)
                # ETKA FGST: файлы без расширения и/или названные по VIN
                if (exts is None or ext.lower() in exts or ext == ''
                        or VIN_FULL_RE.match(stem.upper())):
                    paths.append(os.path.join(root, fn))
        paths.sort()
    else:
        paths = [args.input]

    stats = Counter({'include_donors': 1 if args.include_donors else 0})
    store = {}
    per_model = Counter()
    t0 = time.time()
    print('Источник: %s (%d файлов)' % (os.path.abspath(args.input), len(paths)))
    sql_con = None
    if args.sqlite and not args.scan_only:
        if os.path.exists(out_sql):
            os.remove(out_sql)
        sql_con = sqlite3.connect(out_sql)
        sql_con.execute('CREATE TABLE vins (vin TEXT PRIMARY KEY, model TEXT, body TEXT, gen TEXT, '
                        'year INTEGER, plant TEXT, brand TEXT, engine TEXT, gearbox TEXT, '
                        'gearbox_code TEXT, paint TEXT, trim TEXT, prod_date TEXT, src TEXT)')

    f_vins = io.open(out_vins, 'w', encoding='utf-8')
    f_files = io.open(out_files, 'w', encoding='utf-8')
    fout = None if args.scan_only else gzip.open(out_jsonl, 'wt', encoding='utf-8')
    try:
        for pi, path in enumerate(paths, 1):
            stem, ext = os.path.splitext(path)
            ext = ext.lower()
            reader = READERS.get(ext)
            # ETKA FGST: без расширения или имя = VIN -> читаем как txt-запись
            if reader is None and (ext == '' or VIN_FULL_RE.match(os.path.basename(stem).upper())):
                reader = iter_txt
            if not reader:
                continue
            try:
                for rec in reader(path, columns):
                    rec['__file__'] = path
                    out = build_record(rec, extra_map, pr_dict, stats)
                    if not out:
                        continue
                    vin = out['vin']
                    f_vins.write(vin + '\n')
                    f_files.write(path + '\n')
                    if args.copy_filtered:
                        dst = os.path.join(args.copy_filtered, vin + '.txt')
                        if not os.path.exists(dst):
                            try:
                                import shutil
                                shutil.copyfile(path, dst)
                            except OSError:
                                pass
                    per_model[out['model']] += 1
                    if args.scan_only:
                        continue
                    prev = store.get(vin)
                    if prev is None or richness(out) > richness(prev):
                        store[vin] = out
                    if args.limit and len(store) >= args.limit:
                        break
            except (OSError, ValueError, sqlite3.Error) as e:
                stats['file_errors'] += 1
                if args.verbose:
                    print('  ! %s: %s' % (path, e), file=sys.stderr)
            if pi % 25000 == 0 or (args.verbose and pi % 5000 == 0):
                print('  … файлов: %d / %d, наших VIN: %d, %.0f с' %
                      (pi, len(paths), stats['matched'], time.time() - t0))
            if args.limit and stats['matched'] >= args.limit:
                break
    finally:
        f_vins.close()
        f_files.close()
        if fout:
            fout.close()

    if not args.scan_only:
        fout = gzip.open(out_jsonl, 'wt', encoding='utf-8')
        try:
            for vin in sorted(store):
                r = store[vin]
                fout.write(json.dumps(r, ensure_ascii=False) + '\n')
                if sql_con:
                    sql_con.execute('INSERT OR REPLACE INTO vins VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                                    (r['vin'], r.get('model'), r.get('body'), r.get('gen'), r.get('year'),
                                     r.get('plant'), r.get('brand'), r.get('engine'), r.get('gearbox'),
                                     r.get('gearbox_code'), r.get('paint'), r.get('trim'),
                                     r.get('prod_date'), r.get('src')))
        finally:
            fout.close()
            if sql_con:
                sql_con.commit()
                sql_con.close()

    # Дописываем все встреченные PR-коды в словарь (описания можно заполнить позже)
    if args.update_pr_dict is not None and not args.scan_only:
        dict_path = args.update_pr_dict or pr_path
        union = []
        for r in store.values():
            for c in (r['pr'] if isinstance(r.get('pr'), list) else []):
                if c not in union:
                    union.append(c)
        added = [c for c in union if c not in pr_dict]
        for c in added:
            pr_dict[c] = ''
        try:
            with io.open(dict_path, 'w', encoding='utf-8') as f:
                json.dump(pr_dict, f, ensure_ascii=False, indent=1)
            print('  PR-словарь: кодов %d, добавлено новых %d -> %s' % (len(pr_dict), len(added), dict_path))
            if added:
                print('    новые: %s' % ', '.join(sorted(added)[:24]) + (' …' if len(added) > 24 else ''))
        except OSError as e:
            print('  ! не удалось записать словарь: %s' % e, file=sys.stderr)
        stats['pr_union'] = len(union)
        stats['pr_added'] = len(added)

    meta = {'generated': time.strftime('%Y-%m-%dT%H:%M:%S'),
            'input': args.input, 'include_donors': bool(args.include_donors),
            'scan_only': bool(args.scan_only),
            'files_total': len(paths), 'files_scanned': pi if paths else 0,
            'totals': {k: v for k, v in stats.items() if k != 'include_donors'},
            'unique_vins': len(store) if not args.scan_only else stats['matched'],
            'per_model': dict(per_model),
            'pr_dict_codes': len(pr_dict),
            'filtered_list': out_vins,
            'catalog_prefixes': list(CATALOG_PREFIXES),
            'donor_prefixes': list(DONOR_PREFIXES) if args.include_donors else []}
    with io.open(out_meta, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)

    print('\nГотово за %.1f с.' % (time.time() - t0))
    print('  файлов просмотрено : %d' % meta['files_scanned'])
    print('  строк без VIN        : %d' % stats['no_vin'])
    print('  чужие модели         : %d' % stats['other_models'])
    if stats['fgst_keys']:
        print('  FGST-ключи ETKA без VIN: %d (имя файла не является VIN;' % stats['fgst_keys'])
        print('                           настоящий VIN ищем в содержимом файлов)')
    print('  наших VIN            : %d' % stats['matched'])
    if not args.scan_only:
        print('  уникальных в базе    : %d' % len(store))
    print('  по моделям:')
    for m, c in per_model.most_common():
        print('    %-32s %d' % (m, c))
    print('  список VIN   : %s' % out_vins)
    print('  список файлов: %s' % out_files)
    if not args.scan_only:
        print('  база         : %s' % out_jsonl)
        if args.sqlite:
            print('  база         : %s' % out_sql)
    print('  отчёт        : %s' % out_meta)
    return 0


if __name__ == '__main__':
    sys.exit(main())
