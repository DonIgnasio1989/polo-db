const fs = require('fs');
const file = 'parts-01-engine-fuel-ignition.json';

/* Список OEM → поколения */
const GENS_6N1 = new Set([
  '030 905 205 AE', '030 129 711 BF', '6N1 723 503', '6N1 721 555',
  '030 100 098 EX', '030 100 098 GX', '030 100 098 MX', '030 100 098 BX',
  '030 100 098 CX', '030 100 098 DX', '030 100 098 HX', '030 100 098 FX',
  '032 100 098 CX', '032 100 098 DX', '032 100 032 H', '032 100 098 EX',
  '032 100 032 J', '036 100 098 X',
  '030 100 104 FX', '030 100 104 GX', '030 100 104 DX',
  '030 100 103 SX', '030 100 103 RX',
  '030 100 104 X', '030 100 104 AX', '030 100 104 BX', '030 100 104 EX',
  '032 100 103 BX', '032 100 103 CX', '032 100 103 DX',
  '030 103 101 AE', '030 103 101 AF', '032 103 101 B'
]);
const GENS_6N2 = new Set([
  '036 100 032 X', '036 100 103 CX'
]);

let raw = fs.readFileSync(file, 'utf8');
let data = JSON.parse(raw);

/* 1. Расплющить вложенные массивы */
data = data.flat(Infinity);

/* 2. Добавить gens */
let n1 = 0, n2 = 0;
for (const p of data) {
  if (!p || typeof p !== 'object') continue;
  const oem = p.o || p.oem || '';
  if (GENS_6N1.has(oem)) { p.gens = ['6N1']; n1++; }
  else if (GENS_6N2.has(oem)) { p.gens = ['6N2']; n2++; }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`OK: всего ${data.length} позиций, 6N1=${n1}, 6N2=${n2}`);