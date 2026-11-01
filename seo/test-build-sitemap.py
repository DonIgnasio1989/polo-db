#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Негатив-тест самопроверки build-sitemap.py: ломаем вход и убеждаемся,
что verify() действительно ловит каждую категорию дефекта (а не всегда «OK»)."""
import importlib.util
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # корень проекта

spec = importlib.util.spec_from_file_location('bs', os.path.join(ROOT, 'tools', 'build-sitemap.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

base = 'https://donignasio1989.github.io/polo-db/'
parts = m.load_json(os.path.join(ROOT, 'data', 'parts.json'))
cats, subs, nosub = m.collect(parts)
bc, sec = m.read_base_cats(os.path.join(ROOT, 'js', 'app.js'))
secs = m.load_json(os.path.join(ROOT, 'data', 'sections.json'))
entries = m.build_entries(base, cats, subs, secs, sec, bc, len(parts), nosub)
xml = m.build_xml(entries, base, '2026-10-30')
rob = m.build_robots(base, '2026-10-30')


def V(x, r=rob, b=base):
    return m.verify(x, r, b, cats, subs, secs, sec, len(parts), nosub)[0]


cases = []
cases.append(('чистый (эталон)', xml, rob, base))

dup = xml.replace(
    '</urlset>'.encode(),
    ('  <url><loc>%s</loc><lastmod>2026-10-30</lastmod></url>\n</urlset>' % entries[1][0]).encode())
cases.append(('дубль URL', dup, rob, base))

nonascii = xml.replace('#/cat/Engine'.encode(), '#/cat/Двигатель'.encode('utf-8'), 1)
cases.append(('не-ASCII в loc', nonascii, rob, base))

baddate = xml.replace('2026-10-30'.encode(), '30.10.2026'.encode())
cases.append(('битый lastmod', baddate, rob, base))

cases.append(('рассинхрон base/robots', xml, rob, 'https://other.example.com/'))

badxml = xml.replace('<urlset'.encode(), '<urlse'.encode())
cases.append(('невалидный XML', badxml, rob, base))

emptyloc = xml.replace(('<loc>%s</loc>' % entries[3][0]).encode(), '<loc> </loc>'.encode(), 1)
cases.append(('пустой loc', emptyloc, rob, base))

badprio = xml.replace('<priority>0.8</priority>'.encode(), '<priority>7</priority>'.encode(), 1)
cases.append(('priority вне 0.0-1.0', badprio, rob, base))

badcf = xml.replace('<changefreq>monthly</changefreq>'.encode(), '<changefreq>часто</changefreq>'.encode(), 1)
cases.append(('changefreq вне протокола', badcf, rob, base))

badroute = xml.replace('#/cat/Fuel'.encode(), '#/fuel/x'.encode(), 1)
cases.append(('hash не из routeHash()', badroute, rob, base))

norobots = xml
cases.append(('нет Sitemap: в robots', norobots, b'User-agent: *\n', base))

thin_robots = ('User-agent: *\nAllow: /polo-db/\nSitemap: %ssitemap.xml\nHost: donignasio1989.github.io\n' % base).encode()
cases.append(('robots без Disallow', xml, thin_robots, base))

ok = True
for name, x, r, b in cases:
    errs = V(x, r, b)
    if name.startswith('чистый'):
        good = not errs
    else:
        good = bool(errs)
    ok = ok and good
    print('%-26s %s  %s' % (name, '✓' if good else '✗ ПРОПУЩЕН', (errs[0][:90] if errs else 'замечаний нет')))
print('\nИТОГ:', 'все дефекты пойманы ✓' if ok else 'САМОПРОВЕРКА НЕ РАБОТАЕТ ✗')
raise SystemExit(0 if ok else 1)
