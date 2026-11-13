"""Paso 1 de las fotos: datos de cada lugar y fotos candidatas.

Corre en GitHub Actions (tiene acceso a Wikipedia, Wikidata y Wikimedia Commons).
Lee tools/fotos/lugares.tsv y escribe en tools/fotos/out/:
  lugares/<id>.json  datos de Wikidata y Wikipedia + candidatas con licencia
  hojas/hoja-NN.jpg  hojas de contacto para elegir las fotos a ojo
  paises.json        capital, poblacion, idiomas y moneda en espanol
Si un lugar ya tiene su json, no se vuelve a consultar (borra el json para rehacerlo).
"""
import csv, json, os, re, sys, time, io, html, math, subprocess
import requests
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out')
UA = 'TrotamundosGame/0.1 (https://github.com/igaviria0001-ops/trotamundos; juego educativo)'
S = requests.Session()
S.headers['User-Agent'] = UA
EN = 'https://en.wikipedia.org/w/api.php'
ES = 'https://es.wikipedia.org/w/api.php'
WD = 'https://www.wikidata.org/w/api.php'
CM = 'https://commons.wikimedia.org/w/api.php'
FORCE = os.environ.get('FORCE', '') == '1'


def get(url, params=None, tries=9, raw=False):
    last = None
    for i in range(tries):
        try:
            r = S.get(url, params=params, timeout=40)
            if r.status_code in (429, 502, 503, 504):
                wait = int(r.headers.get('Retry-After', '0') or 0) or 4 * (i + 1)
                time.sleep(min(wait, 90))
                continue
            r.raise_for_status()
            if raw:
                return r.content
            j = r.json()
            if isinstance(j, dict) and j.get('error', {}).get('code') == 'maxlag':
                time.sleep(5)
                continue
            return j
        except Exception as e:  # red inestable: reintenta
            last = e
            time.sleep(2 * (i + 1))
    raise RuntimeError(f'fallo {url} {params}: {last}')


def api(base, **p):
    p.update(format='json', formatversion=2, maxlag=5)
    time.sleep(0.15)
    return get(base, p)


def clean(s):
    if not s:
        return ''
    s = re.sub(r'<[^>]+>', '', str(s))
    return html.unescape(s).strip()


def claim_vals(ent, prop):
    cl = ent.get('claims', {}).get(prop, [])
    pref = [c for c in cl if c.get('rank') == 'preferred']
    use = pref or [c for c in cl if c.get('rank') != 'deprecated']
    out = []
    for c in use:
        dv = c.get('mainsnak', {}).get('datavalue')
        if dv:
            out.append(dv.get('value'))
    return out


def qid_of(v):
    return v.get('id') if isinstance(v, dict) else None


BAD_WORDS = set('map maps mapa karte carte plan plano diagram diagrama logo flag bandera coat wappen escudo locator location seal icon symbol signature firma sketch drawing painting engraving lithograph postcard stamp satellite nasa landsat sentinel infographic chart'.split())


def bad_name(name):
    words = re.split(r'[^a-zA-Z0-9]+', name.lower())
    if any(w in BAD_WORDS for w in words):
        return True
    return any(re.fullmatch(r'1[0-8]\d\d', w) for w in words)
FREE = re.compile(r'(cc[- ]?by|cc0|public domain|^pd|attribution|gfdl|no restrictions|copyrighted free use)', re.I)
NONFREE = re.compile(r'(-nc|nc-|noncommercial|-nd|nd-|no deriv|fair use|non-free)', re.I)
QUALITY = {
    'Category:Featured pictures on Wikimedia Commons': ('FP', 6),
    'Category:Quality images': ('QI', 4),
    'Category:Valued images sorted by promotion date': ('VI', 2),
}


def file_title(name):
    name = name.strip()
    if not name:
        return None
    if not name.lower().startswith('file:'):
        name = 'File:' + name
    return name.replace('_', ' ')


def place_data(row):
    pid, title = row['id'], row['enwiki']
    d = {'id': pid, 'enwiki': title}
    src = {}  # file title -> (puntos base, origen)

    def add(t, pts, why):
        t = file_title(t)
        if not t or not re.search(r'\.(jpe?g)$', t, re.I):
            return
        if bad_name(t.split(':', 1)[1]) and pts < 5:
            return
        if t not in src or src[t][0] < pts:
            src[t] = (pts, why)

    en = api(EN, action='query', titles=title, redirects=1,
             prop='pageprops|pageimages|coordinates|langlinks|images|description',
             ppprop='wikibase_item', piprop='name', lllang='es', imlimit='max')
    pages = en.get('query', {}).get('pages', [])
    if not pages or pages[0].get('missing'):
        d['error'] = 'no existe en enwiki'
        return d, src
    p = pages[0]
    d['enwiki'] = p.get('title', title)
    d['endesc'] = p.get('description', '')
    q = p.get('pageprops', {}).get('wikibase_item')
    d['qid'] = q
    if p.get('coordinates'):
        c = p['coordinates'][0]
        d['coord'] = [c['lat'], c['lon']]
    if p.get('pageimage'):
        add(p['pageimage'], 5, 'en')
    for im in p.get('images', [])[:60]:
        add(im['title'], 0, 'art-en')
    eswiki = None
    for ll in p.get('langlinks', []):
        if ll.get('lang') == 'es':
            eswiki = ll.get('title')

    if q:
        wd = api(WD, action='wbgetentities', ids=q, props='claims|labels|descriptions|sitelinks',
                 languages='es|en', sitefilter='eswiki|enwiki')
        ent = wd.get('entities', {}).get(q, {})
        d['label_es'] = ent.get('labels', {}).get('es', {}).get('value')
        d['desc_es'] = ent.get('descriptions', {}).get('es', {}).get('value')
        if not eswiki:
            eswiki = ent.get('sitelinks', {}).get('eswiki', {}).get('title')
        for v in claim_vals(ent, 'P625')[:1]:
            d['coord'] = [v['latitude'], v['longitude']]
        inc = []
        for prop in ('P571', 'P580', 'P1619'):
            for v in claim_vals(ent, prop):
                inc.append({'p': prop, 'time': v.get('time'), 'prec': v.get('precision')})
        d['inicio'] = inc
        for prop, key in (('P2048', 'altura'), ('P2044', 'elevacion'), ('P2046', 'area'),
                          ('P1174', 'visitantes'), ('P2043', 'largo')):
            vals = []
            for v in claim_vals(ent, prop):
                if isinstance(v, dict) and 'amount' in v:
                    vals.append({'v': float(v['amount']), 'u': v.get('unit', '').rsplit('/', 1)[-1]})
            if vals:
                d[key] = vals
        d['p31'] = [qid_of(v) for v in claim_vals(ent, 'P31')]
        d['p17'] = [qid_of(v) for v in claim_vals(ent, 'P17')]
        d['unesco'] = any(qid_of(v) == 'Q9259' for v in claim_vals(ent, 'P1435'))
        for v in claim_vals(ent, 'P18'):
            add(v, 6, 'P18')
        for prop in ('P8592', 'P4291'):
            for v in claim_vals(ent, prop):
                add(v, 3, prop)
        for v in claim_vals(ent, 'P3451'):
            add(v, 1, 'P3451')

    if eswiki:
        d['eswiki'] = eswiki
        es = api(ES, action='query', titles=eswiki, redirects=1, prop='extracts|pageimages',
                 exintro=1, explaintext=1, piprop='name')
        ep = es.get('query', {}).get('pages', [{}])[0]
        d['extracto_es'] = (ep.get('extract') or '')[:2500]
        if ep.get('pageimage'):
            add(ep['pageimage'], 4, 'es')

    # busqueda en Commons por si las del articulo no alcanzan
    try:
        sr = api(CM, action='query', list='search', srnamespace=6, srlimit=12,
                 srsearch=f'{row.get("buscar") or d["enwiki"]} filetype:bitmap -map -plan -logo')
        for i, h in enumerate(sr.get('query', {}).get('search', [])):
            add(h['title'], 1 if i < 4 else 0, 'busqueda')
    except Exception as e:
        print('  busqueda fallo', e)
    return d, src


def file_info(titles):
    info = {}
    titles = list(titles)
    for i in range(0, len(titles), 40):
        chunk = titles[i:i + 40]
        r = api(CM, action='query', titles='|'.join(chunk), prop='imageinfo|categories',
                iiprop='url|size|mime|extmetadata', iiurlwidth=330,
                iiextmetadatafilter='LicenseShortName|License|Artist|Credit|NonFree|ObjectName|DateTimeOriginal',
                clcategories='|'.join(QUALITY.keys()), cllimit='max', redirects=1)
        for pg in r.get('query', {}).get('pages', []):
            if pg.get('missing') or not pg.get('imageinfo'):
                continue
            ii = pg['imageinfo'][0]
            md = ii.get('extmetadata', {})
            g = lambda k: clean(md.get(k, {}).get('value'))
            cats = [c['title'] for c in pg.get('categories', [])]
            info[pg['title']] = {
                'file': pg['title'], 'w': ii.get('width'), 'h': ii.get('height'), 'mime': ii.get('mime'),
                'thumb': ii.get('thumburl'), 'url': ii.get('url'), 'page': ii.get('descriptionurl'),
                'licencia': g('LicenseShortName'), 'licurl': g('License'), 'autor': g('Artist')[:200],
                'credito': g('Credit')[:200], 'nonfree': g('NonFree'), 'fecha': g('DateTimeOriginal')[:20],
                'calidad': [QUALITY[c][0] for c in cats if c in QUALITY],
                'qpts': sum(QUALITY[c][1] for c in cats if c in QUALITY),
            }
    return info


def score(c, base):
    w, h = c['w'] or 0, c['h'] or 0
    if c['mime'] != 'image/jpeg' or w < 1100 or h < 650:
        return None
    lic = c['licencia'] + ' ' + c['licurl']
    if not FREE.search(lic) or NONFREE.search(lic) or c['nonfree'].lower() == 'true':
        return None
    a = w / h
    if a < 0.6 or a > 2.5:
        return None
    s = base + c['qpts']
    if 1.3 <= a <= 1.9:
        s += 3
    elif 1.1 <= a <= 2.2:
        s += 1
    mp = w * h / 1e6
    s += 2 if mp >= 3 else 0
    s += 1 if mp >= 8 else 0
    return s


def candidates(src):
    info = file_info(src.keys())
    out = []
    for t, (base, why) in src.items():
        c = info.get(t)
        if not c:
            continue
        s = score(c, base)
        if s is None:
            continue
        c = dict(c, puntos=s, origen=why)
        out.append(c)
    out.sort(key=lambda c: -c['puntos'])
    return out[:8]


def font(size):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
              '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default(size=size)


def contact_sheets(rows, datos, changed=None):
    os.makedirs(os.path.join(OUT, 'hojas'), exist_ok=True)
    TW, TH, LW, RH, PER, NC = 250, 168, 190, 200, 8, 6
    f1, f2, f3 = font(19), font(14), font(22)
    pages = [rows[i:i + PER] for i in range(0, len(rows), PER)]
    vfile = os.path.join(OUT, 'hojas', 'formato.txt')
    fmt = f'{PER}x{NC}'
    if not os.path.exists(vfile) or open(vfile).read().strip() != fmt:
        changed = None
        for f in os.listdir(os.path.join(OUT, 'hojas')):
            if f.endswith('.jpg'):
                os.remove(os.path.join(OUT, 'hojas', f))
        open(vfile, 'w').write(fmt)
    for n, page in enumerate(pages, 1):
        if changed is not None and not any(r['id'] in changed for r in page) and os.path.exists(os.path.join(OUT, 'hojas', f'hoja-{n:02d}.jpg')):
            continue
        W = LW + NC * (TW + 8) + 8
        img = Image.new('RGB', (W, RH * len(page) + 10), (246, 244, 238))
        dr = ImageDraw.Draw(img)
        for r, row in enumerate(page):
            y = 10 + r * RH
            d = datos[row['id']]
            dr.text((8, y + 4), row['id'], fill=(20, 40, 70), font=f1)
            dr.text((8, y + 30), row['nombre'][:22], fill=(60, 60, 60), font=f2)
            dr.text((8, y + 50), f"nivel {row['nivel']}  {row['cont']}", fill=(90, 90, 90), font=f2)
            for k, c in enumerate(d.get('candidatas', [])[:NC]):
                x = LW + 8 + k * (TW + 8)
                dr.rectangle([x, y, x + TW, y + TH], fill=(225, 225, 225))
                try:
                    im = Image.open(io.BytesIO(get(c['thumb'], raw=True))).convert('RGB')
                    im.thumbnail((TW, TH))
                    img.paste(im, (x + (TW - im.width) // 2, y + (TH - im.height) // 2))
                except Exception as e:
                    dr.text((x + 10, y + 60), 'sin miniatura', fill=(150, 0, 0), font=f2)
                dr.rectangle([x, y, x + 30, y + 28], fill=(20, 40, 70))
                dr.text((x + 8, y + 2), str(k + 1), fill=(255, 255, 255), font=f3)
                tag = ' '.join(c['calidad'])
                info = f"{c['w']}x{c['h']} {c['origen']} {tag}"
                dr.text((x + 2, y + TH + 4), info[:34], fill=(40, 40, 40), font=f2)
                time.sleep(0.1)
        img.save(os.path.join(OUT, 'hojas', f'hoja-{n:02d}.jpg'), quality=86)
        print('hoja', n)


def countries():
    path = os.path.join(OUT, 'paises.json')
    if os.path.exists(path) and not FORCE:
        return
    isos = [l.strip() for l in open(os.path.join(ROOT, 'paises.txt')) if l.strip()]
    vals = ' '.join(f'"{i}"' for i in isos)
    q = f'''SELECT ?iso ?item ?itemLabel
      (GROUP_CONCAT(DISTINCT CONCAT(?capLabel, "@", STR(?capCoord)); separator="|") AS ?caps)
      (MAX(?pop) AS ?population)
      (GROUP_CONCAT(DISTINCT ?langLabel; separator="|") AS ?langs)
      (GROUP_CONCAT(DISTINCT ?curLabel; separator="|") AS ?curs) WHERE {{
      VALUES ?iso {{ {vals} }}
      ?item wdt:P297 ?iso .
      OPTIONAL {{ ?item wdt:P36 ?cap . ?cap rdfs:label ?capLabel . FILTER(lang(?capLabel)="es")
                 OPTIONAL {{ ?cap wdt:P625 ?capCoord }} }}
      OPTIONAL {{ ?item wdt:P1082 ?pop . }}
      OPTIONAL {{ ?item wdt:P37 ?lang . ?lang rdfs:label ?langLabel . FILTER(lang(?langLabel)="es") }}
      OPTIONAL {{ ?item wdt:P38 ?cur . ?cur rdfs:label ?curLabel . FILTER(lang(?curLabel)="es") }}
      OPTIONAL {{ ?item rdfs:label ?itemLabel . FILTER(lang(?itemLabel)="es") }}
    }} GROUP BY ?iso ?item ?itemLabel'''
    r = S.post('https://query.wikidata.org/sparql', data={'query': q},
               headers={'Accept': 'application/sparql-results+json'}, timeout=120)
    r.raise_for_status()
    out = []
    for b in r.json()['results']['bindings']:
        g = lambda k: b.get(k, {}).get('value', '')
        out.append({'iso': g('iso'), 'qid': g('item').rsplit('/', 1)[-1], 'nombre': g('itemLabel'),
                    'capitales': [c for c in g('caps').split('|') if c], 'poblacion': g('population'),
                    'idiomas': [x for x in g('langs').split('|') if x],
                    'monedas': [x for x in g('curs').split('|') if x]})
    json.dump(out, open(path, 'w'), ensure_ascii=False, indent=1)
    print('paises', len(out))


def guardar_minis(pid, d):
    """miniaturas pequenas de las candidatas para elegir a ojo (las hojas se arman fuera)"""
    carpeta = os.path.join(OUT, 'cand', pid)
    if os.path.isdir(carpeta) and len(os.listdir(carpeta)) >= min(6, len(d.get('candidatas', []))):
        return False
    os.makedirs(carpeta, exist_ok=True)
    for k, c in enumerate(d.get('candidatas', [])[:6], 1):
        dest = os.path.join(carpeta, f'{k}.jpg')
        if os.path.exists(dest):
            continue
        try:
            im = Image.open(io.BytesIO(get(c['thumb'], raw=True))).convert('RGB')
            im.thumbnail((240, 180))
            im.save(dest, quality=74)
        except Exception as e:
            print('   mini fallo', pid, k, e)
        time.sleep(0.12)
    return True


def checkpoint(msg):
    if not os.environ.get('GITHUB_ACTIONS'):
        return
    try:
        subprocess.run(['git', 'add', OUT], check=True)
        r = subprocess.run(['git', 'commit', '-m', msg + ' [bot]'], capture_output=True)
        if r.returncode == 0:
            for _ in range(5):
                if subprocess.run(['git', 'pull', '--rebase', '-q']).returncode == 0 and subprocess.run(['git', 'push', '-q']).returncode == 0:
                    break
                time.sleep(4)
        print('checkpoint', msg, flush=True)
    except Exception as e:
        print('checkpoint fallo', e)


def main():
    rows = list(csv.DictReader(open(os.path.join(ROOT, 'lugares.tsv'), encoding='utf-8'), delimiter='\t'))
    os.makedirs(os.path.join(OUT, 'lugares'), exist_ok=True)
    try:
        countries()
    except Exception as e:
        print('PAISES FALLO', e)
    hechos = 0
    for row in rows:
        path = os.path.join(OUT, 'lugares', row['id'] + '.json')
        if os.path.exists(path) and not FORCE:
            d = json.load(open(path))
        else:
            print('->', row['id'], flush=True)
            try:
                d, src = place_data(row)
                d['candidatas'] = candidates(src) if src else []
            except Exception as e:
                print('   ERROR', e)
                d = {'id': row['id'], 'error': str(e), 'candidatas': []}
            json.dump(d, open(path, 'w'), ensure_ascii=False, indent=1)
            hechos += 1
        if guardar_minis(row['id'], d):
            hechos += 1
        if hechos >= 50:
            checkpoint('Fotos: avance de candidatas')
            hechos = 0
    sin = [r['id'] for r in rows if not json.load(open(os.path.join(OUT, 'lugares', r['id'] + '.json'))).get('candidatas')]
    print('sin candidatas:', sin)


if __name__ == '__main__':
    main()
