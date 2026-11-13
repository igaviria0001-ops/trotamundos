"""Arma hojas de contacto locales con las miniaturas de candidatas (out/cand/<id>/<k>.jpg).
uso: python3 tools/fotos/hojas.py [ids separados por coma]  -> scratch/hojas/hoja-NN.jpg"""
import csv, json, os, sys
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out')
DEST = os.path.join(ROOT, '..', '..', 'scratch', 'hojas')
os.makedirs(DEST, exist_ok=True)
def font(s):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'):
        if os.path.exists(f): return ImageFont.truetype(f, s)
    return ImageFont.load_default()
rows = list(csv.DictReader(open(os.path.join(ROOT, 'lugares.tsv'), encoding='utf-8'), delimiter='\t'))
if len(sys.argv) > 1: rows = [r for r in rows if r['id'] in sys.argv[1].split(',')]
PER, NC, TW, TH, LW = int(os.environ.get("PER", 8)), int(os.environ.get("NC", 5)), 240, 180, 150
f1, f2, f3 = font(17), font(13), font(20)
for n in range(0, len(rows), PER):
    page = rows[n:n + PER]
    img = Image.new('RGB', (LW + NC * (TW + 6) + 6, len(page) * (TH + 30) + 6), (246, 244, 238))
    dr = ImageDraw.Draw(img)
    for r, row in enumerate(page):
        y = 6 + r * (TH + 30)
        try: d = json.load(open(os.path.join(OUT, 'lugares', row['id'] + '.json')))
        except Exception: d = {'candidatas': []}
        dr.text((6, y + 4), row['id'], fill=(20, 40, 70), font=f1)
        dr.text((6, y + 28), row['nombre'][:20], fill=(60, 60, 60), font=f2)
        dr.text((6, y + 46), f"n{row['nivel']} {row['cont']} {row['iso']}", fill=(90, 90, 90), font=f2)
        for k, c in enumerate(d.get('candidatas', [])[:NC]):
            x = LW + 6 + k * (TW + 6)
            p = os.path.join(OUT, 'cand', row['id'], f'{k + 1}.jpg')
            dr.rectangle([x, y, x + TW, y + TH], fill=(220, 220, 220))
            if os.path.exists(p):
                im = Image.open(p); im.thumbnail((TW, TH))
                img.paste(im, (x + (TW - im.width) // 2, y + (TH - im.height) // 2))
            dr.rectangle([x, y, x + 26, y + 26], fill=(20, 40, 70)); dr.text((x + 7, y + 2), str(k + 1), fill=(255, 255, 255), font=f3)
            dr.text((x + 2, y + TH + 3), f"{c['w']}x{c['h']} {c['origen']} {' '.join(c['calidad'])}"[:36], fill=(40, 40, 40), font=f2)
    img.save(os.path.join(DEST, f'hoja-{n // PER + 1:02d}.jpg'), quality=85)
print('hojas', (len(rows) + PER - 1) // PER)
