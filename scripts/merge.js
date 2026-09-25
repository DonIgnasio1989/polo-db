const fs = require('fs');
const dir = './data/';
const map = {
    Engine: '01', Fuel: '01', Ignition: '01',
    Cooling: '02', Heating: '02', Brakes: '02', Suspension: '02',
    Transmission: '03', Exhaust: '03', Electrical: '03', Bulbs: '03',
    Body: '04', Interior: '04', Maintenance: '04', Fluids: '04', RoadKit: '04',
    RearAxle: '05', Controls: '05'
};
const files = {};
for (const n of ['01', '02', '03', '04', '05'])
    files[n] = fs.readdirSync(dir).find(f => f.startsWith('parts-' + n + '-'));
const parts = {};
for (const n of ['01', '02', '03', '04', '05'])
    parts[n] = JSON.parse(fs.readFileSync(dir + files[n], 'utf8').replace(/^\uFEFF/, ''));
for (const pack of ['polo_pack_v1.json', 'polo_full.json']) {
    if (!fs.existsSync(dir + pack)) { console.log('Нет файла', pack); continue; }
    const data = JSON.parse(fs.readFileSync(dir + pack, 'utf8').replace(/^\uFEFF/, ''));
    const arr = Array.isArray(data) ? data : data.parts;
    console.log(pack, arr.length);
    for (const p of arr) {
        const n = map[p.cat] || '01';
        const item = {
            cat: p.cat, sub: p.sub || p.subassembly || p.assembly || '',
            o: p.o || p.oem || '', n: p.n || p.name || '',
            v: (p.v || p.verified) ? 1 : 0,
            a: p.a || p.analogs || [], d: p.d || p.donors || [],
            i: (p.i || p.inst || []).map(x => Array.isArray(x) ? x : [
                ({ spec: 's', tool: 't', proc: 'p', warn: 'w', note: 'n', recommendation: 'r' })[x.type] || 'n',
                x.text || ''
            ])
        };
        parts[n].push(item);
    }
}
for (const n of ['01', '02', '03', '04', '05']) {
    const seen = new Set();
    parts[n] = parts[n].filter(p => {
        const k = (p.o || '') + '|' + (p.n || '');
        if (seen.has(k)) return false;
        seen.add(k); return true;
    });
    fs.writeFileSync(dir + files[n], JSON.stringify(parts[n], null, 2));
    console.log(files[n], parts[n].length);
}