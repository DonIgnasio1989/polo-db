#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Сверка: результат применения repo-patches/36-repo-live-seo.patch к снимку
живого репозитория (live/) должен байт-в-байт совпасть с project/.
Запуск из корня рабочей копии: python3 seo/check-patch36.py"""
import hashlib
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = '/tmp/livecheck'
PATCH = os.path.join(ROOT, 'repo-patches', '36-repo-live-seo.patch')

if os.path.exists(WORK):
    shutil.rmtree(WORK)
os.makedirs(WORK)
for name in os.listdir(os.path.join(ROOT, 'live')):
    src = os.path.join(ROOT, 'live', name)
    dst = os.path.join(WORK, name)
    (shutil.copytree if os.path.isdir(src) else shutil.copy2)(src, dst)

subprocess.run(['git', 'init', '-q', '.'], cwd=WORK, check=True)
r = subprocess.run(['git', 'apply', '--check', PATCH], cwd=WORK, capture_output=True, text=True)
if r.returncode != 0:
    sys.exit('git apply --check ПРОВАЛ: ' + r.stderr)
print('git apply --check на снимке live/: ✓')
subprocess.run(['git', 'apply', PATCH], cwd=WORK, check=True)
print('git apply: ✓')

PAIRS = [('index.html', 'project/index.html', True),
         ('sitemap.xml', 'project/sitemap.xml', False),
         ('robots.txt', 'project/robots.txt', False),
         ('tools/build-sitemap.py', 'project/tools/build-sitemap.py', False),
         ('tools/test-build-sitemap.py', 'project/tools/test-build-sitemap.py', False)]


def md5(b):
    return hashlib.md5(b).hexdigest()


ok = True
for rel, proj, normalize in PAIRS:
    a = open(os.path.join(WORK, rel), 'rb').read()
    b = open(os.path.join(ROOT, proj), 'rb').read()
    if normalize:                      # index.html: в репозитории LF, у нас CRLF
        a = a.replace(b'\r\n', b'\n')
        b = b.replace(b'\r\n', b'\n')
    same = md5(a) == md5(b)
    ok = ok and same
    print('%-30s %s (%d Б)%s' % (rel, 'БАЙТ-В-БАЙТ ✓' if same else 'РАСХОЖДЕНИЕ ✗', len(a),
                                 '  [после нормализации CRLF→LF]' if normalize else ''))
print('ИТОГ:', 'патч 36 даёт ровно то, что лежит в project/ ✓' if ok else 'ЕСТЬ РАСХОЖДЕНИЯ ✗')
sys.exit(0 if ok else 1)
