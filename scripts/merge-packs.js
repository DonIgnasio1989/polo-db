const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');

const FILES = {
    Engine: 'parts-01-engine-fuel-ignition.json',
    Fuel: 'parts-01-engine-fuel-ignition.json',
    Ignition: 'parts-01-engine-fuel-ignition.json',
    Cooling: 'parts-02-cooling-heating-brakes-suspension.json',
    Heating: 'parts-02-cooling-heating-brakes-suspension.json',
    Brakes: 'parts-02-cooling-heating-brakes-suspension.json',
    Suspension: 'parts-02-cooling-heating-brakes-suspension.json',
    Transmission: 'parts-03-trans-exh-elec-bulbs.json',
    Exhaust: 'parts-03-trans-exh-elec-bulbs.json',
    Electrical: 'parts-03-trans-exh-elec-bulbs.json',
    Bulbs: 'parts-03-trans-exh-elec-bulbs.json',
    Body: 'parts-04-body-interior-maint-fluids-roadkit.json',
    Interior: 'parts-04-body-interior-maint-fluids-roadkit.json',
    Maintenance: 'parts-04-body-interior-maint-fluids-roadkit.json',
    Fluids: 'parts-04-body-interior-maint-fluids-roadkit.json',
    RoadKit: 'parts-04-body-interior-maint-fluids-roadkit.json',
    RearAxle: 'parts-05-rear-axle-controls.json',
    Controls: 'parts-05-rear-axle-controls.json'
};

// Поля могут быть: o/n/a/d/v + i, ИЛИ oem/name/analogs/donors/verified + inst
function normalize(p) {
    const inst = p.inst || p.i || [];
    const fixedInst = inst.map(x => {
        if (Array.isArray(x)) return x;                 // ["s","текст"]
        if (x && typeof x === 'object') {
            const typeMap = { spec:'s', tool:'t', proc:'p', warn:'w', note:'n', recommendation:'r' };
            const t = typeMap[x.type] || 'n';
            return [t, String(x.text || '')];
        }
        return null;
    }).filter(Boolean);

    return {
        cat: p.cat || 'Engine',
        sub: p.sub || p.subassembly || p.assembly || '',
        o: String(p.o || p.oem || ''),
        n: String(p.n || p.name || ''),
        v: (p.v || p.verified) ? 1 : 0,
        a: (p.a || p.analogs || []).map(String).filter(Boolean),
        d: (p.d || p.donors || []).map(String).filter(Boolean),
        engines: p.engines || [],
        bodies: p.bodies || [],
        transmissions: p.transmissions || [],
        i: fixedInst
    };
}

const key = p => (p.o || '') + '||' + (p.n || '');
const allByFile = {}; // filename -> Map(key -> part)

// 1. Загружаем существующие parts
for (const f of Object.values(FILES)) {
    if (!allByFile[f]) allByFile[f] = new Map();
    try {
        const arr = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
        for (const p of arr) {
            const n = normalize(p);
            allByFile[f].set(key(n), n);
        }
        console.log(`Загружено из ${f}: ${arr.length}`);
    } catch (e) { console.warn('Не найден:', f); }
}

// 2. Загружаем паки
const packs = ['polo_pack_v1.json', 'polo_full.json', 'polo_baza'];
let totalAdded = 0, totalSkipped = 0;

for (const pack of packs) {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(path.join(DATA, pack), 'utf8'));
    } catch (e) { console.warn('Пропущен', pack); continue; }

    const parts = Array.isArray(data) ? data : (data.parts || []);
    console.log(`\n${pack}: ${parts.length} позиций`);

    for (const raw of parts) {
        const p = normalize(raw);
        if (!p.o && !p.n) continue;

        const f = FILES[p.cat];
        if (!f) { console.warn('Нет файла для cat:', p.cat, '—', p.n); continue; }

        if (allByFile[f].has(key(p))) {
            totalSkipped++;
        } else {
            allByFile[f].set(key(p), p);
            totalAdded++;
        }
    }
}

// 3. Записываем обратно
console.log(`\nВсего: добавлено ${totalAdded}, пропущено (дубли) ${totalSkipped}\n`);
for (const [f, map] of Object.entries(allByFile)) {
    const arr = Array.from(map.values());
    fs.writeFileSync(path.join(DATA, f), JSON.stringify(arr, null, 2), 'utf8');
    console.log(`${f}: ${arr.length} поз.`);
}