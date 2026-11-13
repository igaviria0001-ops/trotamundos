# uso: python3 tools/build/agregar_fichas.py archivo.json  -> mezcla en data/fichas.json
import json, sys
F = json.load(open('data/fichas.json'))
N = json.load(open(sys.argv[1]))
F.update(N)
json.dump(F, open('data/fichas.json', 'w'), ensure_ascii=False, indent=1)
print('fichas', len(F), '+', len(N))
