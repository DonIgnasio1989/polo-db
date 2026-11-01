#!/usr/bin/env python3
# verify35.py — полная верификация: чистое дерево из uploads/ + все 35 патчей (добор блока N + циклы 3–4 + пакеты 1.13.2/1.13.3 + SEO-пакет: боевой base URL, sitemap.xml, robots.txt).
# Запуск: python3 verify34.py   (cwd = корень рабочей области)
import os, re, shutil, hashlib, subprocess, sys

ROOT = os.getcwd()
UP = os.path.join(ROOT, 'uploads')
PROJ = os.path.join(ROOT, 'project')
PATCHES = os.path.join(ROOT, 'patches')
CLEAN = '/tmp/clean35'

def md5(p):
    h = hashlib.md5()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()

# 1. индекс basename -> [пути] в project/ (без dist и без новых файлов этой сессии)
SKIP_PROJ = {'dist'}
idx = {}
for dp, dns, fns in os.walk(PROJ):
    dns[:] = [d for d in dns if d not in SKIP_PROJ]
    for fn in fns:
        full = os.path.join(dp, fn)
        rel = os.path.relpath(full, PROJ)
        idx.setdefault(fn, []).append(rel)

SPECIAL = {
    '1_README.md': 'tools/instructions/README.md',
    'README.md': 'vin-dump/README.md',
}
SKIP_UP = {'1_index.html', '1_migrate-1.10.6.js', '1_migrate-1.12.1.js'}

# 2. чистое дерево
if os.path.exists(CLEAN):
    shutil.rmtree(CLEAN)
os.makedirs(CLEAN)
placed, unresolved = 0, []
for fn in sorted(os.listdir(UP)):
    if fn in SKIP_UP:
        continue
    src = os.path.join(UP, fn)
    if fn in SPECIAL:
        dest = SPECIAL[fn]
    else:
        cands = idx.get(fn, [])
        if len(cands) == 1:
            dest = cands[0]
        elif len(cands) > 1:
            same = [c for c in cands if md5(os.path.join(PROJ, c)) == md5(src)]
            if len(same) == 1:
                dest = same[0]
            else:
                unresolved.append((fn, cands)); continue
        else:
            unresolved.append((fn, [])); continue
    tgt = os.path.join(CLEAN, dest)
    os.makedirs(os.path.dirname(tgt), exist_ok=True)
    shutil.copy2(src, tgt)
    placed += 1

print(f'чистое дерево: {placed} файлов из {len(os.listdir(UP)) - len(SKIP_UP)} ожидаемых')
for fn, c in unresolved:
    print('  НЕ РАЗМЕЩЁН:', fn, c)

# 3. все патчи: --check затем apply
pl = sorted(f for f in os.listdir(PATCHES) if f.endswith('.patch'))
print(f'патчей: {len(pl)} (ожидалось 35; патчи для живого репозитория лежат в repo-patches/ и тут не применяются)')
if len(pl) != 35:
    print('  ⚠ количество патчей не равно 35 — проверьте patches/ и repo-patches/')
bad = []
# проверяем и накладываем по порядку: патчи 27-28 модифицируют файлы, созданные
# патчами 25-26, поэтому --check имеет смысл только в точке очереди
for p in pl:
    r = subprocess.run(['git', 'apply', '--check', os.path.join(PATCHES, p)], cwd=CLEAN, capture_output=True, text=True)
    if r.returncode != 0:
        bad.append((p, 'check', r.stderr.strip()[:200]))
        continue
    r = subprocess.run(['git', 'apply', os.path.join(PATCHES, p)], cwd=CLEAN, capture_output=True, text=True)
    if r.returncode != 0:
        bad.append((p, 'apply', r.stderr.strip()[:200]))
print('git apply:', f'ВСЕ {len(pl)}/{len(pl)} ✓' if not bad else f'ОШИБКИ {bad}')

# 4. побайтовая сверка patches/modified/ с пропатченным деревом
MOD = os.path.join(PATCHES, 'modified')
n_mod, diff_mod = 0, []
for dp, dns, fns in os.walk(MOD):
    for fn in fns:
        m = os.path.join(dp, fn)
        rel = os.path.relpath(m, MOD)
        c = os.path.join(CLEAN, rel)
        n_mod += 1
        if not os.path.exists(c):
            diff_mod.append((rel, 'НЕТ В ДЕРЕВЕ'))
        elif md5(m) != md5(c):
            diff_mod.append((rel, 'БАЙТЫ РАСХОДЯТСЯ'))
print(f'modified/: {n_mod - len(diff_mod)}/{n_mod} файлов байт-в-байт ✓' if not diff_mod else f'modified/ РАСХОЖДЕНИЯ: {diff_mod}')

# 5. тесты на пропатченном чистом дереве
for t, exp in [('tests/test_instructions.js', None), ('tests/test_1106.js', None), ('tests/test_sections_1110.js', None)]:
    r = subprocess.run(['node', t], cwd=CLEAN, capture_output=True, text=True)
    tail = [l for l in r.stdout.strip().splitlines() if l.strip()][-1:]
    print(f'{t}: exit={r.returncode} | {tail[0][:110] if tail else r.stderr[:110]}')

# 6. check-engines на чистом дереве (data-src не слит — блоки должны совпасть)
r = subprocess.run(['node', 'tools/check-engines.js', '--json'], cwd=CLEAN, capture_output=True, text=True)
print('check-engines (чистое дерево):', r.stdout.strip() or r.stderr[:200])

# 7. SEO-блок: sitemap.xml/robots.txt из чистого дерева совпадают с project/,
#    генератор проходит --check, все URL под боевым base и разбираются routeHash()
BASE = 'https://donignasio1989.github.io/polo-db/'
sm_err = []
r = subprocess.run([sys.executable, os.path.join(CLEAN, 'tools', 'build-sitemap.py'),
                    '--check', '--lastmod', '2026-10-30'], cwd=CLEAN, capture_output=True, text=True)
if r.returncode != 0:
    sm_err.append('build-sitemap.py --check exit=%d: %s' % (r.returncode, (r.stdout + r.stderr).strip()[-300:]))
else:
    tail = [l for l in r.stdout.splitlines() if 'URL' in l][:1]
    print('build-sitemap --check:', (tail[0].strip() if tail else 'OK'))
for f in ('sitemap.xml', 'robots.txt'):
    a, b = os.path.join(PROJ, f), os.path.join(CLEAN, f)
    if not os.path.exists(b):
        sm_err.append('%s: НЕТ в чистом дереве (патч 35 не создал файл)' % f)
    elif md5(a) != md5(b):
        sm_err.append('%s: project/ и чистое дерево РАСХОДЯТСЯ' % f)
xml = open(os.path.join(PROJ, 'sitemap.xml'), encoding='utf-8').read()
locs = re.findall(r'<loc>(.*?)</loc>', xml)
if len(locs) != 316 or len(set(locs)) != 316:
    sm_err.append('sitemap.xml: %d loc (%d уникальных), ожидалось 316/316' % (len(locs), len(set(locs))))
if any(not l.startswith(BASE) for l in locs):
    sm_err.append('sitemap.xml: есть URL вне base %s' % BASE)
if any(not l.isascii() for l in locs):
    sm_err.append('sitemap.xml: не-ASCII в <loc>')
RE_CAT = re.compile(r'^#/cat/([^/]+)(?:/(.+))?$')
if any('#' in l and not RE_CAT.match('#' + l.split('#', 1)[1]) for l in locs):
    sm_err.append('sitemap.xml: hash не разбирается routeHash()')
html = open(os.path.join(PROJ, 'index.html'), encoding='utf-8').read()
for tag in ('rel="canonical" href=', 'property="og:url" content=',
            'property="og:image" content=', 'name="twitter:image" content='):
    i = html.find(tag)
    if i < 0 or not html[i + len(tag) + 1:].startswith(BASE.rstrip('/')):
        sm_err.append('index.html: %s… не указывает на %s' % (tag, BASE))
if '"url": "%s"' % BASE not in html:
    sm_err.append('index.html: url в JSON-LD не синхронизирован с base')
if html.count('https://donignasio1989.github.io"') or re.search(r'donignasio1989\.github\.io/(?!polo-db)', html):
    sm_err.append('index.html: остались ссылки на старый базовый URL (корень)')
rt = open(os.path.join(PROJ, 'robots.txt'), encoding='utf-8').read()
if rt.count('Sitemap: %ssitemap.xml' % BASE) != 1:
    sm_err.append('robots.txt: нет ровно одной Sitemap: на base')
print('SEO-блок:', '✓ sitemap 316 URL, robots.txt, canonical/OG/JSON-LD — всё на %s' % BASE if not sm_err else '✗ %s' % sm_err)

ok = placed == 85 and not unresolved and not bad and not diff_mod and not sm_err and len(pl) == 35
print('ИТОГ:', '✅ верификация пройдена' if ok else '❌ есть проблемы')
sys.exit(0 if ok else 1)
