#!/usr/bin/env node
/* ============================================================
   tools/build-parts.js — сборка каталога из data-src
   ------------------------------------------------------------
   data-src/parts-*.json (22 файла-источника)  →  data/parts.full.json
                                               →  data/parts.json
   Оба файла пишутся компактно (JSON.stringify без отступов, LF,
   без завершающего перевода строки) — ровно так, как лежало на
   сервере раньше, чтобы diff был читаемым.

   Порядок записей = порядок файлов по номеру (parts-01 … parts-22),
   внутри файла — как в источнике. Источники НЕ изменяются.

   Перед записью прогоняется tools/validate-data.js: при ошибках
   сборка прерывается (unless --force).

   Зачем отдельный файл, а не «скопировать parts.full.json»:
   до 1.10.6 боевой data/parts.json отставал от data-src на 206
   записей (parts-21, parts-22 не попали в сборку), и заметить это
   можно было только сверкой. Теперь сборка и сверка — одна команда.

   Запуск:  node tools/build-parts.js [--force] [--no-analogs]
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data-src');
const DATA = path.join(ROOT, 'data');
const ARGS = process.argv.slice(2);

const files = fs.readdirSync(SRC).filter(f => /^parts-.*\.json$/.test(f))
    .sort((a, b) => ((a.match(/parts-(\d+)/) || [0, 99])[1] | 0) - ((b.match(/parts-(\d+)/) || [0, 99])[1] | 0) || a.localeCompare(b));
if (!files.length) { console.error('в data-src нет parts-*.json'); process.exit(1); }

const out = [];
const per = [];
for (const f of files) {
    const arr = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
    if (!Array.isArray(arr)) { console.error(f + ': ожидается массив'); process.exit(1); }
    per.push(f.replace(/^parts-/, '').replace(/\.json$/, '') + ': ' + arr.length);
    arr.forEach(r => out.push(r));
}

/* ключ слияния приложения: oem|name в нижнем регистре (_dedupeParts) */
const oemOf = r => String(r.o || r.oem || '').trim();
const nameOf = r => String(r.n || r.name || '').trim();
const key = r => (oemOf(r).toLowerCase() + '|' + nameOf(r).toLowerCase());
const seen = new Map();
const dupes = [];
out.forEach((r, i) => {
    const k = key(r);
    if (seen.has(k)) dupes.push(k + ' (#' + seen.get(k) + ' и #' + i + ')');
    else seen.set(k, i);
});
if (dupes.length) {
    console.error('🔴 дубли «OEM+название» — merge-импорт схлопнет их в одну карточку:');
    dupes.slice(0, 10).forEach(d => console.error('   ' + d));
    if (!ARGS.includes('--force')) process.exit(1);
}

/* Валидация в два этапа: до записи проверяем ИСТОЧНИКИ и конфиг
   (--skip-prod: старый data/parts.json ещё не пересобран и валиться
   на нём смысла нет), после записи — полный прогон со сверкой дрейфа. */
const validate = extra => {
    try {
        execFileSync(process.execPath, [path.join(__dirname, 'validate-data.js'), '--quiet'].concat(extra || []), { cwd: ROOT, stdio: 'inherit' });
        return true;
    } catch (e) { return false; }
};
if (!ARGS.includes('--force') && !validate(['--skip-prod'])) {
    console.error('\n🔴 validate-data.js нашёл ошибки в data-src/конфиге — сборка прервана (обход: --force)');
    process.exit(1);
}

const json = JSON.stringify(out);
fs.writeFileSync(path.join(DATA, 'parts.full.json'), json, 'utf8');
fs.writeFileSync(path.join(DATA, 'parts.json'), json, 'utf8');
console.log('собрано: ' + files.length + ' файлов → ' + out.length + ' записей');
console.log('  ' + per.join(' · '));
console.log('записано: data/parts.full.json, data/parts.json (' + (json.length / 1024).toFixed(0) + ' КБ)');

console.log('\n--- контрольная валидация после сборки ---');
const okAfter = validate();

if (!ARGS.includes('--no-analogs')) {
    console.log('\n--- прогон tools/build-analogs.js ---');
    execFileSync(process.execPath, [path.join(__dirname, 'build-analogs.js')], { cwd: ROOT, stdio: 'inherit' });
}
process.exit(okAfter ? 0 : 1);
