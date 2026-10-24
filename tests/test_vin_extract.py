#!/usr/bin/env python3
"""Регрессионный тест tools/vin_extract.py — защита от подделки VIN из PR-кодов.

Воспроизводит дефект, из-за которого data/vin-db.json оказалась нерабочей:
поле `vin` собиралось из подстроки склеенных PR-кодов (1ARLAT6VU2BV0AWV1 = «1A»
из кода Q1A + последние пять кодов RLA T6V U2B V0A WV1).

Запуск: python3 tests/test_vin_extract.py [путь к vin_extract.py]
"""
import gzip
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'tools', 'vin_extract.py')

PR = ("1E1 3B0 6U0 2WA 4UE 7AA 1C1 9M0 J1P 5C0 K8B 1LB 1KD 4L2 2K1 7QA 7A0 5D1 4W0 6E3 3C7 "
      "3V0 B0A 6FB 8T0 FC0 VY0 4N0 2A5 4K4 2T0 1X0 0GG 8Z5 1SA MW8 A8S 6XE 2B0 1T3 6W5 1Z0 "
      "0F2 6R1 6Q1 C18 8GL 6PA FA0 VX0 8JH 8K0 8X0 8Q1 7E0 9AK 1EX 2G1 5TM 1VG 0W1 3HA 5SL "
      "4E0 1PC 6SS 5A5 7P1 4ZB 9Q0 7Q0 0VC 5K5 7X1 3CA FQ0 8UD 0N1 3GA 8TC 3Q6 3ND 6V1 VC0 "
      "5RU 3Y0 3FA 3S0 0LW 7M1 3L5 9P0 N4J 4A0 A00 1BA 4X3 4KC 5E2 3X0 1G3 9VD E0A 0ST 1N1 "
      "2C5 L0L 2PG QV0 9NX 9B0 9W0 6M1 7K0 H6U 1D0 NT0 1WC 1YA G0C 0G1 B01 2Z7 0DS F0A 0JH "
      "0YE CB1 4GH 8N4 PPA QH0 QA0 Q1A RLA T6V U2B V0A WV1").split()
BLOB = ''.join(PR)

FIXTURES = {
    # имя файла = настоящий VIN, внутри тот же PR-блоб (соблазн взять подстроку)
    'WVWZZZ6VZ2W012345.txt': "WVWZZZ6VZ2W012345\nAEE\nDKE\n" + BLOB + "\n",
    # имя = внутренний ключ ETKA, настоящего VIN нет нигде → запись не создаётся
    'Y1UML44E06N007481.txt': "AEE\nDKE\n" + BLOB + "\n",
    # имя = ключ ETKA, настоящий VIN внутри файла → должен найтись
    'X2ABC99Z01N000777.txt': "WVWZZZ9KZ3R530555\nAGR\nDXT\n" + BLOB + "\n",
    # VIN с пробелами
    'spaced.txt': "WVW ZZZ 6N Z 1Y 067890\nAER\nDKG\n" + BLOB + "\n",
    # чужая модель (Golf 1K) — не должна попасть
    'other.txt': "WVW-ZZZ-1KZ-5W012345\nAEE\nDKE\n" + BLOB + "\n",
}
EXPECT = {'WVWZZZ6VZ2W012345', 'WVWZZZ9KZ3R530555', 'WVWZZZ6NZ1Y067890'}
FORBIDDEN = {'1ARLAT6VU2BV0AWV1', 'WVWZZZ1KZ5W012345'}

ok = fail = 0


def check(cond, msg):
    global ok, fail
    print(('  ✅ ' if cond else '  ❌ ') + msg)
    ok, fail = (ok + 1, fail) if cond else (ok, fail + 1)


def main():
    if not os.path.exists(SCRIPT):
        print('скрипт не найден: %s' % SCRIPT)
        return 2
    tmp = tempfile.mkdtemp(prefix='vinfix-')
    dump, out = os.path.join(tmp, 'dump'), os.path.join(tmp, 'out')
    os.makedirs(dump)
    for name, text in FIXTURES.items():
        with open(os.path.join(dump, name), 'w', encoding='utf-8') as f:
            f.write(text)
    try:
        subprocess.run([sys.executable, SCRIPT, '-i', dump, '-o', out, '--include-donors'],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        rows = [json.loads(l) for l in gzip.open(os.path.join(out, 'vin-db.jsonl.gz'), 'rt', encoding='utf-8')]
        meta = json.load(open(os.path.join(out, 'vin-db.meta.json'), encoding='utf-8'))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    vins = {r['vin'] for r in rows}
    print('получено записей: %d → %s' % (len(rows), ', '.join(sorted(vins))))
    check(not (vins & FORBIDDEN), 'в базе нет поддельных VIN из PR-кодов и чужих моделей')
    check(EXPECT <= vins, 'все три настоящих VIN найдены (имя файла, содержимое, с пробелами)')
    check(all(r['vin'][11:].isdigit() for r in rows), 'у всех записей серийная часть цифровая')
    check(all(r['vin'][3:6] == 'ZZZ' for r in rows), 'у всех записей filler ZZZ')
    check(all(r.get('brand', '').startswith(('Volkswagen', 'SEAT')) for r in rows),
          'brand расшифрован (не «Неизвестно»)')
    check(all(len(r.get('pr') or []) == len(PR) for r in rows),
          'PR-коды сохранены полностью (%d шт.)' % len(PR))
    check(meta['totals'].get('rejected_not_vin', 0) >= 2,
          'отброшено кандидатов «не VIN»: %d' % meta['totals'].get('rejected_not_vin', 0))
    check(meta['totals'].get('rejected_other_model', 0) >= 1,
          'отброшено «чужая модель»: %d' % meta['totals'].get('rejected_other_model', 0))
    byvin = {r['vin']: r for r in rows}
    r6 = byvin.get('WVWZZZ6VZ2W012345', {})
    check(r6.get('model', '').startswith('Polo') and r6.get('plant') == 'Wolfsburg',
          '6V-запись расшифрована верно (model=%s, plant=%s)' % (r6.get('model'), r6.get('plant')))
    print('\n%s: %d passed, %d failed' % ('OK' if not fail else 'FAILED', ok, fail))
    return 1 if fail else 0


if __name__ == '__main__':
    sys.exit(main())
