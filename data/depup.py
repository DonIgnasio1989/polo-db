import json, glob

seen = set()

for fn in sorted(glob.glob("parts-*.json")):
    data = json.load(open(fn, encoding="utf-8"))
    out = []
    for x in data:
        key = x.get("o") or x.get("oem") or x.get("n") or x.get("name")
        if key in seen:
            continue
        seen.add(key)
        out.append(x)
    json.dump(out, open(fn, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(fn, len(data), "->", len(out))