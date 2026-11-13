"""Paso 2 de las fotos: baja las fotos elegidas en buena resolucion.

Lee tools/fotos/elegidas.json:
  {"eiffel": [{"file": "File:....jpg"}, {"file": "File:....jpg", "foco": [0.5, 0.35]}], ...}
Escribe en fotos/ (raiz del repo):
  <id>-<n>.webp       foto grande (max 1600x1200)
  min/<id>-<n>.webp   miniatura (max 520x390)
  creditos.json       autor, licencia y enlace de cada foto
Solo baja lo que cambio.
"""
import json, os, io, time, sys
from PIL import Image, ImageOps

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from candidatas import api, get, clean, CM, S  # noqa: E402

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(ROOT))
DEST = os.path.join(REPO, 'fotos')


def info(title):
    r = api(CM, action='query', titles=title, prop='imageinfo', redirects=1,
            iiprop='url|size|mime|extmetadata', iiurlwidth=1920,
            iiextmetadatafilter='LicenseShortName|License|LicenseUrl|Artist|Credit|AttributionRequired')
    pg = r['query']['pages'][0]
    if pg.get('missing') or not pg.get('imageinfo'):
        raise RuntimeError('no existe ' + title)
    ii = pg['imageinfo'][0]
    md = ii.get('extmetadata', {})
    g = lambda k: clean(md.get(k, {}).get('value'))
    return {
        'file': pg['title'], 'src': ii.get('thumburl') or ii.get('url'), 'page': ii.get('descriptionurl'),
        'w': ii.get('width'), 'h': ii.get('height'),
        'autor': g('Artist')[:160], 'licencia': g('LicenseShortName'), 'licurl': g('LicenseUrl'),
    }


def main():
    eleg = json.load(open(os.path.join(ROOT, 'elegidas.json'), encoding='utf-8'))
    os.makedirs(os.path.join(DEST, 'min'), exist_ok=True)
    cpath = os.path.join(DEST, 'creditos.json')
    cred = json.load(open(cpath)) if os.path.exists(cpath) else {}
    keep = set()
    for pid, lst in eleg.items():
        for n, e in enumerate(lst, 1):
            key = f'{pid}-{n}'
            keep.add(key)
            big = os.path.join(DEST, key + '.webp')
            small = os.path.join(DEST, 'min', key + '.webp')
            title = e['file'] if e['file'].startswith('File:') else 'File:' + e['file']
            old = cred.get(key)
            if old and old.get('file', '').replace('_', ' ') == title.replace('_', ' ') and os.path.exists(big) and os.path.exists(small):
                if e.get('foco'):
                    old['foco'] = e['foco']
                continue
            print('->', key, title, flush=True)
            try:
                c = info(title)
                data = get(c['src'], raw=True)
                im = Image.open(io.BytesIO(data))
                im = ImageOps.exif_transpose(im).convert('RGB')
                a = im.copy()
                a.thumbnail((1600, 1200), Image.LANCZOS)
                a.save(big, 'WEBP', quality=80, method=6)
                b = im.copy()
                b.thumbnail((520, 390), Image.LANCZOS)
                b.save(small, 'WEBP', quality=78, method=6)
                c.update(ancho=a.width, alto=a.height)
                c.pop('src', None)
                if e.get('foco'):
                    c['foco'] = e['foco']
                cred[key] = c
                time.sleep(0.3)
            except Exception as ex:
                print('   ERROR', key, ex)
    for key in list(cred):
        if key not in keep:
            cred.pop(key)
            for p in (os.path.join(DEST, key + '.webp'), os.path.join(DEST, 'min', key + '.webp')):
                if os.path.exists(p):
                    os.remove(p)
    json.dump(cred, open(cpath, 'w'), ensure_ascii=False, indent=1, sort_keys=True)
    print('fotos', len(cred))


if __name__ == '__main__':
    main()
