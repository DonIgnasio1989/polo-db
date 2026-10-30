#!/usr/bin/env python3
# verify30.py — полная верификация: чистое дерево из uploads/ + все 30 патчей (добор блока N + добор, цикл 3).
# Запуск: python3 verify30.py   (cwd = корень рабочей области)
import os, shutil, hashlib, subprocess, sys

ROOT = os.getcwd()
UP = os.path.join(ROOT, 'uploads')
PROJ = os.path.join(ROOT, 'project')
PATCHES = os.path.join(ROOT, 'patches')
CLEAN = '/tmp/clean30'

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
print(f'патчей: {len(pl)}')
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

ok = placed == 85 and not unresolved and not bad and not diff_mod
print('ИТОГ:', '✅ верификация пройдена' if ok else '❌ есть проблемы')
sys.exit(0 if ok else 1)
