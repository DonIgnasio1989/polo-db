#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-sitemap.py — генератор sitemap.xml + robots.txt для «Базы Мастера».

Зачем инструмент, а не файл руками: каталог живёт в project/data/parts.json
(4127 карточек), справочные разделы — в project/data/sections.json, порядок
категорий — в BASE_CATS внутри project/js/app.js. Всё это меняется от релиза к
релизу, поэтому sitemap собирается из тех же источников, что читает приложение:
список URL не может разъехаться с реальным содержимым.

ЧТО ПОПАДАЕТ В SITEMAP (316 URL)
  1   × главная            <base>/                              priority 1.0  weekly
  20  × категории          <base>/#/cat/<Cat>                   priority 0.8  monthly
  285 × подкатегории       <base>/#/cat/<Cat>/<Sub>             priority 0.6  monthly
  10  × справочные разделы <base>/#/cat/<SectionId>             priority 0.7  monthly
      (Моменты затяжки, Диагностика OBD, Лампы, Жидкости, Колёса,
       Электросхемы, Предохранители, Реле, Обозначения проводов, Пины)

ЧТО СОЗНАТЕЛЬНО НЕ ПОПАДАЕТ
  · #/part/<oem> — 4114 карточек. Технически можно, но это 4114 URL одного
    документа (см. ниже про hash) без выигрыша в индексации;
  · #/vin/<id> и #/maint/<id> — машины из гаража пользователя, на сервере их нет;
  · Favorites / Workshops / Log / Dash — локальные представления (localStorage);
  · 103 карточки с пустым sub (Engine 32, Electrical 19, Body 11, …) — своего URL
    не получают: они видны на странице категории, которая в sitemap есть.
    Пустая подкатегория дала бы битый диплинк вида #/cat/Engine/;
  · /data/*.json, /js/, /css/, /sw.js, /manifest.webmanifest, /icons/ — служебные
    файлы приложения, в sitemap им не место.

⚠ ЧЕСТНО ПРО HASH. Google и Яндекс не индексируют фрагмент после «#»: для них все
  315 «глубоких» URL — один документ, тот же, что и <base>/. То есть sitemap не
  добавит страниц в выдачу. Владельцем выбран именно этот вариант, и он не вредит:
  дублей не создаётся (canonical на главной один), а ссылки реально рабочие для
  человека — routeHash() отрабатывает и на входящем диплинке (js/app.js:7571,
  вызов после _hashReady = true), то есть открытие <base>/#/cat/Engine/ГРМ сразу
  показывает нужную подкатегорию. Настоящая индексация разделов возможна только
  через реальные пути (/cat/Engine/) — это отдельная работа по роутингу.

ИСПОЛЬЗОВАНИЕ
  python3 seo/build-sitemap.py                       # base = DEFAULT_BASE, пишет рядом со скриптом
  python3 seo/build-sitemap.py --base https://…/repo/
  python3 seo/build-sitemap.py --out project/dist    # положить рядом с index.html
  python3 seo/build-sitemap.py --check               # собрать в память, прогнать проверки, не писать
  python3 seo/build-sitemap.py --lastmod 2026-10-30

  --base обязан начинаться с http(s):// и заканчиваться на «/» (скрипт добавит сам).
  Домен и подкаталог берутся ровно такими, как переданы: sitemap должен совпадать
  с canonical в index.html.
"""

import argparse
import collections
import datetime
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from urllib.parse import quote, unquote, urlsplit

HERE = os.path.dirname(os.path.abspath(__file__))

# Скрипт может лежать в корне поставки, в project/tools/ или в seo/ — ищем данные относительно себя.
def _candidates(*rel):
    out = []
    for base_dir in (HERE, os.path.join(HERE, '..'), os.path.join(HERE, 'project'), os.getcwd()):
        for r in rel:
            out.append(os.path.normpath(os.path.join(base_dir, r)))
    seen, res = set(), []
    for p in out:
        if p not in seen:
            seen.add(p)
            res.append(p)
    return res

PARTS_CANDS = _candidates('data/parts.json', 'project/data/parts.json')
SECTIONS_CANDS = _candidates('data/sections.json', 'project/data/sections.json')
APPJS_CANDS = _candidates('js/app.js', 'project/js/app.js')

# Что закрывать от индексации (пути относительно корня сайта, «/» добавится сам).
# Проверено 2026-10-30 по живому https://donignasio1989.github.io/polo-db/:
# GitHub Pages публикует ВЕСЬ репозиторий, поэтому наружу торчат материалы
# разработки. Отдают 200: /tools/, /tests/, /data-src/, /patches/, /data/vin-db.json
# (14 МБ, 13 414 VIN), /merged-data-src/, /volkswagenclub-net/. Отдают 404:
# /restore/, /docs/, /data/vin-db.jsonl, /vin-dump/*.
# ⚠ Disallow запрещает только ОБХОД роботом, доступ по прямой ссылке остаётся.
# /data/ целиком закрывать НЕЛЬЗЯ: parts.json, categories.json, sections.json,
# update.json и прочие грузятся самим приложением.
DISALLOW = [
    'data-src/',
    'merged-data-src/',
    'patches/',
    'restore/',
    'tests/',
    'tools/',
    'vin-dump/',
    'volkswagenclub-net/',
    'data/vin-db.json',
    'data/vin-db.jsonl',
    'data/filtered-vins.txt',
    'data/filtered-files.txt',
]

# Базовый URL сайта — боевой адрес, проверен 2026-10-30: GitHub Pages отдают
# приложение из корня репозитория DonIgnasio1989/polo-db (200 на /, /sitemap.xml,
# /robots.txt, /icons/og-image.png, /data/parts.json). Тот же адрес стоит в
# canonical/og:url/og:image/twitter:image и в url JSON-LD в index.html — при
# переезде менять и там, и здесь (или передавать --base).
DEFAULT_BASE = 'https://donignasio1989.github.io/polo-db/'

SKIP_CATS = set()      # страховка: категории, которые не должны попасть в sitemap

LEVELS = {             # changefreq/priority — подсказки (Google игнорирует их с 2023-го)
    'root': dict(priority='1.0', changefreq='weekly'),
    'cat':  dict(priority='0.8', changefreq='monthly'),
    'sec':  dict(priority='0.7', changefreq='monthly'),
    'sub':  dict(priority='0.6', changefreq='monthly'),
}

XMLNS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
IMAGE_NS = 'http://www.google.com/schemas/sitemap-image/1.1'
CHANGEFREQS = ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')


def _first_existing(cands, what):
    for c in cands:
        if os.path.isfile(c):
            return os.path.abspath(c)
    raise SystemExit('[sitemap] не найден %s; укажите путь вручную' % what)


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def read_base_cats(appjs_path):
    """Порядок категорий из BASE_CATS (js/app.js) — единственный источник правды.
       Возвращает [(id, label)] и список SEC_TABLE_IDS. Если разметка изменилась —
       мягко возвращает None, и генератор берёт порядок из parts.json."""
    try:
        src = open(appjs_path, encoding='utf-8').read()
    except OSError:
        return None, None
    m = re.search(r'const BASE_CATS = \[(.*?)\n\];', src, re.S)
    if not m:
        return None, None
    cats = re.findall(r"\{\s*id:\s*'([^']+)',\s*label:\s*'([^']*)'", m.group(1))
    m2 = re.search(r'const SEC_TABLE_IDS = \[([^\]]*)\]', src)
    secs = re.findall(r"'([^']+)'", m2.group(1)) if m2 else None
    return cats or None, secs


def collect(parts):
    """(OrderedDict cat→n, OrderedDict (cat,sub)→n, число карточек без sub)."""
    cats, subs, nosub = collections.OrderedDict(), collections.OrderedDict(), 0
    for p in parts:
        c, s = p.get('cat'), p.get('sub')
        if not c or c in SKIP_CATS:
            continue
        cats[c] = cats.get(c, 0) + 1
        if s:
            subs[(c, s)] = subs.get((c, s), 0) + 1
        else:
            nosub += 1
    return cats, subs, nosub


def ordered_cats(cats, base_cats):
    """Категории в порядке сайдбара; неизвестные — хвостом в порядке parts.json."""
    if not base_cats:
        return list(cats)
    ids = [i for i, _ in base_cats if i in cats]
    return ids + [c for c in cats if c not in ids]


def enc(segment):
    """encodeURIComponent-эквивалент: в <loc> обязаны быть только ASCII-символы."""
    return quote(str(segment), safe='')


def url_for(base, cat=None, sub=None):
    if cat is None:
        return base
    return base + '#/cat/' + enc(cat) + ('/' + enc(sub) if sub else '')


def build_entries(base, cats, subs, sections, sec_ids, base_cats, parts_total, nosub):
    entries = [(base, 'root', 'главная · %d карточек каталога' % parts_total)]
    labels = dict(base_cats or [])
    for c in ordered_cats(cats, base_cats):
        lab = labels.get(c)
        entries.append((url_for(base, c), 'cat', '%s%s · %d карточек'
                        % (c, ' (%s)' % lab if lab else '', cats[c])))
    for sid in (sec_ids or []):
        s = (sections or {}).get(sid)
        if not isinstance(s, dict):
            continue
        rows = len(s.get('rows') or [])
        lab = s.get('label') or sid
        entries.append((url_for(base, sid), 'sec', '%s — %s · %d строк' % (sid, lab, rows)))
    cat_order = {c: i for i, c in enumerate(ordered_cats(cats, base_cats))}
    for (c, s), n in sorted(subs.items(), key=lambda kv: (cat_order.get(kv[0][0], 999), kv[0][1])):
        entries.append((url_for(base, c, s), 'sub', '%s / %s · %d' % (c, s, n)))
    return entries


def build_xml(entries, base, lastmod, image=None):
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="%s"' % XMLNS,
             '        xmlns:image="%s">' % IMAGE_NS,
             '  <!-- База Мастера · собрано build-sitemap.py, не править руками -->',
             '  <!-- base: %s · URL: %d · lastmod: %s -->' % (base, len(entries), lastmod)]
    for loc, level, hint in entries:
        lv = LEVELS[level]
        lines.append('  <url>')
        lines.append('    <loc>%s</loc>' % loc)
        lines.append('    <lastmod>%s</lastmod>' % lastmod)
        lines.append('    <changefreq>%s</changefreq>' % lv['changefreq'])
        lines.append('    <priority>%s</priority>' % lv['priority'])
        if image and level == 'root':
            lines += ['    <image:image>',
                      '      <image:loc>%s</image:loc>' % image,
                      '      <image:title>База Мастера — каталог запчастей VW Polo 6N и Caddy 9K</image:title>',
                      '      <image:caption>Офлайн-каталог оригинальных запчастей, VIN-дешифратор и регламенты ТО</image:caption>',
                      '    </image:image>']
        if hint:
            lines.append('    <!-- %s -->' % hint)
        lines.append('  </url>')
    lines.append('</urlset>')
    return ('\n'.join(lines) + '\n').encode('utf-8')


def build_robots(base, lastmod):
    u = urlsplit(base)
    root = u.path if u.path.endswith('/') else u.path + '/'
    lines = [
        '# База Мастера — robots.txt',
        '# Сгенерирован tools/build-sitemap.py %s. Пути заданы от корня сайта' % lastmod,
        '# (%s), поэтому при переносе на другой домен правки не нужны —' % root.rstrip('/'),
        '# достаточно пересобрать sitemap с новым --base.',
        '',
        'User-agent: *',
        'Allow: %s' % root,
        'Allow: %sicons/' % root,
    ]
    for d in DISALLOW:
        lines.append('Disallow: %s%s' % (root, d))
    lines += [
        '# /data/ НЕ закрыт целиком намеренно: parts.json, categories.json,',
        '# sections.json, update.json и прочие грузятся самим приложением —',
        '# блокировка сломала бы офлайн-каталог на проде. Точечно закрыт только',
        '# дамп VIN (data/vin-db.json и исходники к нему).',
        '# ⚠ Disallow запрещает роботу ОБХОД, но не доступ по прямой ссылке.',
        '',
        'Sitemap: %ssitemap.xml' % base,
        'Host: %s' % u.netloc,
    ]
    return ('\n'.join(lines) + '\n').encode('utf-8')


# ─────────────────────────────── самопроверка ───────────────────────────────
RE_CAT = re.compile(r'^#/cat/([^/]+)(?:/(.+))?$')


def verify(xml_bytes, robots_bytes, base, cats, subs, sections, sec_ids, parts_total, nosub):
    errs, warns = [], []

    # 1. XML well-formed, корневой элемент и namespace — по протоколу sitemaps.org
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        return ['XML не парсится: %s' % e], []
    if root.tag != '{%s}urlset' % XMLNS:
        errs.append('корневой элемент не urlset: %s' % root.tag)

    url_nodes = root.findall('{%s}url' % XMLNS)
    urls = [e.findtext('{%s}loc' % XMLNS) for e in url_nodes]

    # 2. состав: главная + категории + разделы + подкатегории
    n_sec = len([s for s in (sec_ids or []) if isinstance((sections or {}).get(s), dict)])
    want = 1 + len(cats) + n_sec + len(subs)
    if len(urls) != want:
        errs.append('URL %d, ожидалось %d (1 + %d cat + %d sec + %d sub)'
                    % (len(urls), want, len(cats), n_sec, len(subs)))
    if urls and urls[0] != base:
        errs.append('первый URL не главная: %s' % urls[0])

    # 3. каждый loc: уникальный, ASCII, абсолютный, в пределах base, ≤2048, без запрещённых символов
    seen = set()
    for u in urls:
        if u in seen:
            errs.append('дубль URL: %s' % u)
        seen.add(u)
        if not (u or '').isascii():
            errs.append('не-ASCII в <loc> (нужен percent-encoding): %s' % u)
        if not u.startswith(base):
            errs.append('URL вне base %s: %s' % (base, u))
        if len(u) > 2048:
            errs.append('URL длиннее 2048 символов: %s' % u[:80])
        if any(ch in u for ch in ' "\'<>'):
            errs.append('запрещённый символ в <loc>: %s' % u)
        if u.count('#') > 1:
            errs.append('больше одного «#» в <loc>: %s' % u)

    # 4. каждый hash-роут разбирается regex'ами routeHash() из js/app.js
    bad = [u for u in urls if '#' in u and not RE_CAT.match('#' + u.split('#', 1)[1])]
    if bad:
        errs.append('routeHash() не разберёт %d URL, например %s' % (len(bad), bad[0]))

    # 5. round-trip: декодированный cat/sub совпадает с исходными данными.
    #    Неразобранные hash уже пойманы проверкой 4 — здесь их просто пропускаем,
    #    чтобы верификатор сообщал о дефекте, а не падал на нём.
    back = set()
    for u in urls:
        if '#' not in u:
            continue
        m = RE_CAT.match('#' + u.split('#', 1)[1])
        if not m:
            continue
        back.add((unquote(m.group(1)), unquote(m.group(2)) if m.group(2) else None))
    src = {(c, None) for c in cats} | {(c, s) for (c, s) in subs} | {(s, None) for s in (sec_ids or [])
                                                                    if isinstance((sections or {}).get(s), dict)}
    if back != src:
        errs.append('round-trip не сошёлся: потеряно %d %s, лишнее %d %s'
                    % (len(src - back), sorted(src - back)[:3], len(back - src), sorted(back - src)[:3]))

    # 6. lastmod — валидная дата (W3C, полный формат YYYY-MM-DD)
    lm = url_nodes[0].findtext('{%s}lastmod' % XMLNS) if url_nodes else None
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', lm or ''):
        errs.append('lastmod не YYYY-MM-DD: %s' % lm)
    else:
        try:
            datetime.date.fromisoformat(lm)
        except ValueError:
            errs.append('lastmod — несуществующая дата: %s' % lm)
    if len({e.findtext('{%s}lastmod' % XMLNS) for e in url_nodes}) != 1:
        warns.append('lastmod различается между URL (обычно так и задумано, но проверьте)')

    # 7. priority/changefreq — только разрешённые протоколом значения
    for e in url_nodes:
        pr = e.findtext('{%s}priority' % XMLNS)
        cf = e.findtext('{%s}changefreq' % XMLNS)
        if pr is None or not re.match(r'^(0\.0|0\.\d|1\.0)$', pr):
            errs.append('priority вне формата 0.0–1.0: %s' % pr)
        if cf not in CHANGEFREQS:
            errs.append('changefreq вне протокола: %s' % cf)
        for tag in ('loc', 'lastmod'):
            if not (e.findtext('{%s}%s' % (XMLNS, tag)) or '').strip():
                errs.append('пустой обязательный <%s>' % tag)

    # 8. robots.txt: ровно одна Sitemap:, совпадает с base, есть User-agent: *
    rt = robots_bytes.decode('utf-8')
    sm = [l for l in rt.splitlines() if l.startswith('Sitemap:')]
    if len(sm) != 1:
        errs.append('в robots.txt должно быть ровно одна строка Sitemap:, найдено %d' % len(sm))
    elif sm[0].split(': ', 1)[1] != base + 'sitemap.xml':
        errs.append('Sitemap: в robots.txt не совпадает с base: %s' % sm[0])
    if 'User-agent: *' not in rt:
        errs.append('в robots.txt нет User-agent: *')
    if rt.count('Host:') > 1:
        errs.append('в robots.txt больше одной строки Host:')
    p = urlsplit(base).path or '/'
    for d in DISALLOW:
        if ('Disallow: %s%s' % (p, d)) not in rt:
            errs.append('robots.txt не закрывает %s' % d)

    # 9. данные: каждая cat из parts.json обязана быть в sitemap
    listed = set()
    for u in urls:
        if '#' not in u:
            continue
        mm = RE_CAT.match('#' + u.split('#', 1)[1])
        if mm:
            listed.add(unquote(mm.group(1)))
    missing = [c for c in cats if c not in listed]
    if missing:
        errs.append('категории из parts.json отсутствуют в sitemap: %s' % missing)
    if nosub:
        warns.append('%d карточек без подкатегории — покрыты URL своей категории' % nosub)

    # 10. лимиты протокола: ≤50 000 URL и ≤50 МБ несжатого
    if len(urls) > 50000:
        errs.append('больше 50 000 URL — нужен sitemap-индекс')
    if len(xml_bytes) > 50 * 1024 * 1024:
        errs.append('sitemap.xml больше 50 МБ')
    return errs, warns


def main():
    ap = argparse.ArgumentParser(description='Генератор sitemap.xml + robots.txt для «Базы Мастера»')
    ap.add_argument('--base', default=DEFAULT_BASE, help='базовый URL сайта (http(s)://…, «/» добавится сам)')
    ap.add_argument('--parts', default=None, help='путь к data/parts.json')
    ap.add_argument('--sections', default=None, help='путь к data/sections.json')
    ap.add_argument('--appjs', default=None, help='путь к js/app.js (порядок категорий из BASE_CATS)')
    ap.add_argument('--out', default=HERE, help='куда писать файлы (по умолчанию — папка скрипта)')
    ap.add_argument('--lastmod', default=datetime.date.today().isoformat(), help='дата lastmod, YYYY-MM-DD')
    ap.add_argument('--image', default=None, help='URL OG-картинки для <image:image> на главной')
    ap.add_argument('--no-robots', action='store_true', help='не писать robots.txt')
    ap.add_argument('--check', action='store_true', help='только самопроверка, файлы не писать')
    a = ap.parse_args()

    base = a.base if a.base.endswith('/') else a.base + '/'
    if not base.startswith(('http://', 'https://')):
        raise SystemExit('[sitemap] --base должен начинаться с http:// или https://')

    parts_path = a.parts or _first_existing(PARTS_CANDS, 'data/parts.json')
    parts = load_json(parts_path)
    cats, subs, nosub = collect(parts)

    sections, sec_ids = {}, []
    try:
        sections = load_json(a.sections or _first_existing(SECTIONS_CANDS, 'data/sections.json'))
    except SystemExit:
        sections = {}
    try:
        base_cats, sec_ids = read_base_cats(a.appjs or _first_existing(APPJS_CANDS, 'js/app.js'))
    except SystemExit:
        base_cats, sec_ids = None, None
    if not sec_ids:
        sec_ids = [k for k in sections if isinstance(sections.get(k), dict)]

    entries = build_entries(base, cats, subs, sections, sec_ids, base_cats, len(parts), nosub)
    xml = build_xml(entries, base, a.lastmod, image=a.image or (base + 'icons/og-image.png'))
    robots = build_robots(base, a.lastmod)
    errs, warns = verify(xml, robots, base, cats, subs, sections, sec_ids, len(parts), nosub)

    n_sec = len([s for s in sec_ids if isinstance(sections.get(s), dict)])
    print('[sitemap] parts.json    : %s (%d карточек)' % (parts_path, len(parts)))
    print('[sitemap] sections.json : %d справочных разделов' % n_sec)
    print('[sitemap] порядок категорий: %s' % ('BASE_CATS из js/app.js' if base_cats else 'parts.json (app.js не найден)'))
    print('[sitemap] base          : %s' % base)
    print('[sitemap] URL           : %d = 1 главная + %d категорий + %d разделов + %d подкатегорий'
          % (len(entries), len(cats), n_sec, len(subs)))
    print('[sitemap] lastmod       : %s' % a.lastmod)
    print('[sitemap] размеры       : sitemap.xml %d Б · robots.txt %d Б' % (len(xml), len(robots)))
    for w in warns:
        print('[sitemap] ⚠ %s' % w)
    if errs:
        for e in errs:
            print('[sitemap] ✗ %s' % e)
        print('[sitemap] ПРОВАЛ: замечаний %d' % len(errs))
        return 1
    if not a.check:
        os.makedirs(a.out, exist_ok=True)
        for name, blob in (('sitemap.xml', xml), ('robots.txt', robots)):
            if name == 'robots.txt' and a.no_robots:
                continue
            p = os.path.join(a.out, name)
            with open(p, 'wb') as f:
                f.write(blob)
            print('[sitemap] записан %s (%d Б)' % (p, len(blob)))
    print('[sitemap] ПРОВЕРКИ ПРОЙДЕНЫ ✓ (10 групп)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
