#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Разовая правка project/index.html: базовый URL сайта → https://donignasio1989.github.io/polo-db/

Меняются 6 вхождений старого хоста (строки 10, 39-42, 44, 48, 53, 62 исходной разметки):
  · url в JSON-LD              — синхронизация с живым репозиторием (владелец там уже поправил);
  · link rel=canonical         — было на корень, а это 404;
  · og:url                     — то же;
  · og:image, twitter:image    — превью в соцсетях не грузилось (404);
  · комментарий SEO-блока      — фактический адрес и как собирается sitemap.

Версии НЕ трогаем: meta[app-ui-ver], css/app.css?v=, APP_VERSION, update.json остаются 1.13.3
(тест test_1106.js «версия синхронна в 5 местах» требует их равенства).
Переводы строк CRLF сохраняются: читаем и пишем в двоичном режиме.
"""

P = 'project/index.html'

# (что ищем, на что меняем, сколько вхождений ожидаем)
REPS = [
    (b'"url": "https://donignasio1989.github.io",',
     b'"url": "https://donignasio1989.github.io/polo-db/",', 1),
    (b'<link rel="canonical" href="https://donignasio1989.github.io/">',
     b'<link rel="canonical" href="https://donignasio1989.github.io/polo-db/">', 1),
    (b'<meta property="og:url" content="https://donignasio1989.github.io/">',
     b'<meta property="og:url" content="https://donignasio1989.github.io/polo-db/">', 1),
    (b'content="https://donignasio1989.github.io/icons/og-image.png"',
     b'content="https://donignasio1989.github.io/polo-db/icons/og-image.png"', 2),
]

OLD_COMMENT = (
    b'       ' + 'Базовый URL взят из JSON-LD выше (https://donignasio1989.github.io).'.encode('utf-8') + b'\r\n'
    b'       ' + 'Если сайт ляжет в подкаталог (…github.io/repo/) — править в четырёх'.encode('utf-8') + b'\r\n'
    b'       ' + 'местах: canonical, og:url, og:image, twitter:image.'.encode('utf-8') + b'\r\n'
    b'       ' + 'robots.txt и sitemap.xml лежат на сервере отдельно — сюда не дублируем.'.encode('utf-8') + b'\r\n'
)
NEW_COMMENT = (
    b'       ' + 'Базовый URL сайта: https://donignasio1989.github.io/polo-db/ (GitHub Pages,'.encode('utf-8') + b'\r\n'
    b'       ' + 'репозиторий DonIgnasio1989/polo-db). При переезде править в пяти местах:'.encode('utf-8') + b'\r\n'
    b'       ' + 'canonical, og:url, og:image, twitter:image и url в JSON-LD выше.'.encode('utf-8') + b'\r\n'
    b'       ' + 'robots.txt и sitemap.xml лежат в корне репозитория; оба собираются'.encode('utf-8') + b'\r\n'
    b'       ' + 'tools/build-sitemap.py (316 URL: главная, 20 категорий, 10 справочных'.encode('utf-8') + b'\r\n'
    b'       ' + 'разделов, 285 подкатегорий — из data/parts.json и data/sections.json).'.encode('utf-8') + b'\r\n'
)
REPS.append((OLD_COMMENT, NEW_COMMENT, 1))

b = open(P, 'rb').read()
orig = b
for old, new, want in REPS:
    n = b.count(old)
    if n != want:
        raise SystemExit('ОЖИДАЛОСЬ %d вхождений, найдено %d: %r' % (want, n, old[:70]))
    b = b.replace(old, new)
    print('замен %d: %s' % (n, old[:64].decode('utf-8', 'replace').replace('\r\n', '⏎')))

leftover = b.count(b'https://donignasio1989.github.io') - b.count(b'https://donignasio1989.github.io/polo-db/')
open(P, 'wb').write(b)
print('размер            : %d → %d Б' % (len(orig), len(b)))
print('CRLF              : %d → %d' % (orig.count(b'\r\n'), b.count(b'\r\n')))
print('старый хост без /polo-db/: %d (должно быть 0)' % leftover)
print('версии не тронуты : meta[app-ui-ver] 1.13.3 = %d · css?v=1.13.3 = %d'
      % (b.count(b'name="app-ui-ver" content="1.13.3"'), b.count(b'app.css?v=1.13.3')))
