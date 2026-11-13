import csv, json, sys, re
rows = list(csv.DictReader(open('tools/fotos/lugares.tsv', encoding='utf-8'), delimiter='\t'))
F = json.load(open('data/fichas.json'))
filtro = sys.argv[1] if len(sys.argv) > 1 else ''
ini, n = int(sys.argv[2]) if len(sys.argv) > 2 else 0, int(sys.argv[3]) if len(sys.argv) > 3 else 30
sel = [r for r in rows if r['id'] not in F and (not filtro or eval(filtro, {}, {'r': r}))][ini:ini + n]
for r in sel:
    try: d = json.load(open(f"tools/fotos/out/lugares/{r['id']}.json"))
    except Exception: d = {}
    ex = re.sub(r'\s+', ' ', d.get('extracto_es', ''))[:520]
    inc = ';'.join(f"{i['time'][:12]}/{i['prec']}" for i in d.get('inicio', [])[:2])
    alt = ';'.join(str(a['v']) for a in d.get('altura', [])[:2])
    el = ';'.join(str(a['v']) for a in d.get('elevacion', [])[:1])
    print(f"## {r['id']} | {r['nombre']} | {r['iso']} | n{r['nivel']} | {r['cat']} | ini {inc} | alto {alt} | elev {el} | {d.get('desc_es','')}\n{ex}\n")
print('quedan', len([r for r in rows if r['id'] not in F and (not filtro or eval(filtro, {}, {'r': r}))]))
