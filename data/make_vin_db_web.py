#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_vin_db_web.py — готовит data/vin-db.json для сайта из выжимки vin_extract.py.

Вход:  out/vin-db.jsonl.gz (или .jsonl) — результат сборки единой базы VIN.
Выход: data/vin-db.json — отсортированный по VIN массив компактных записей
       (только поля, нужные сайту: расшифровка + оснащение + PR-коды).

Запуск:
  python3 make_vin_db_web.py -i D:/vinout/vin-db.jsonl.gz -o ../data
"""
import argparse
import gzip
import io
import json
import os
import sys

KEEP = ('vin', 'model', 'body', 'gen', 'year', 'plant', 'brand',
        'engine', 'gearbox', 'gearbox_code', 'paint', 'trim', 'prod_date',
        'pr', 'xcheck', 'warn')


def main():
    ap = argparse.ArgumentParser(description='vin-db.jsonl.gz -> data/vin-db.json для сайта')
    ap.add_argument('-i', '--input', default='', nargs='?',
                    help='входной файл (по умолчанию ищет vin-db.jsonl.gz / vin-db.jsonl в текущей папке)')
    ap.add_argument('-o', '--out', default='.', help='куда положить vin-db.json (по умолчанию — текущая папка)')
    ap.add_argument('--update-pr-dict', nargs='?', const='', default=None,
                    help='дописать в pr-codes.json все PR-коды из базы (новые — с пустым описанием)')
    args = ap.parse_args()

    if not args.input:
        for cand in ('vin-db.jsonl.gz', 'vin-db.jsonl', os.path.join('out', 'vin-db.jsonl.gz')):
            if os.path.exists(cand):
                args.input = cand
                break
        else:
            print('Не нашёл vin-db.jsonl.gz в текущей папке — укажите путь через -i')
            return 1
        print('Вход: %s' % args.input)
    if not os.path.exists(args.input):
        print('Файл не найден: %s' % args.input)
        return 1

    opener = gzip.open if args.input.endswith('.gz') else io.open
    recs = {}
    with opener(args.input, 'rt', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except ValueError:
                continue
            if not r.get('vin'):
                continue
            recs[r['vin'].upper()] = {k: r[k] for k in KEEP if k in r}

    rows = [recs[v] for v in sorted(recs)]
    os.makedirs(args.out, exist_ok=True)
    dst = os.path.join(args.out, 'vin-db.json')
    with io.open(dst, 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False, separators=(',', ':'))

    with_pr = sum(1 for r in rows if r.get('pr'))
    with_eng = sum(1 for r in rows if r.get('engine'))
    with_gkb = sum(1 for r in rows if r.get('gearbox_code'))
    print('Записей: %d (с PR: %d, с мотором: %d, с кодом КПП: %d)' % (len(rows), with_pr, with_eng, with_gkb))
    print('Файл: %s (%.1f КБ)' % (dst, os.path.getsize(dst) / 1024.0))
    print('Скопируйте его в папку data сайта — приложение подхватит автоматически.')

    if args.update_pr_dict is not None:
        cand = [args.update_pr_dict] if args.update_pr_dict else [
            'pr-codes.json', os.path.join('..', 'data', 'pr-codes.json'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'pr-codes.json')]
        dict_path = next((c for c in cand if c and os.path.exists(c)), None)
        if not dict_path:
            print('Словарь pr-codes.json не найден — пропустите --update-pr-dict или укажите путь')
            return 1
        with io.open(dict_path, encoding='utf-8') as f:
            pr_dict = json.load(f)
        union = []
        for r in rows:
            for c in (r.get('pr') or []):
                if c not in union:
                    union.append(c)
        added = [c for c in union if c not in pr_dict]
        for c in added:
            pr_dict[c] = ''
        with io.open(dict_path, 'w', encoding='utf-8') as f:
            json.dump(pr_dict, f, ensure_ascii=False, indent=1)
        print('PR-словарь: кодов %d, добавлено новых %d -> %s' % (len(pr_dict), len(added), dict_path))
        if added:
            print('  новые: %s' % ', '.join(sorted(added)[:24]) + (' …' if len(added) > 24 else ''))
    return 0


if __name__ == '__main__':
    sys.exit(main())
