"""Builds assets/img/og.jpg, the 1200x630 link-preview image, from the site's palette.
Run from the repo root: python3 tools/og/build_og.py"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONTS = os.path.join(ROOT, 'tools', 'pa-video', 'fonts')
S = 2  # draw at 2x, then downsample for clean edges

BG, INK, MUTED, LINE, ACCENT = '#FFFFFF', '#111418', '#596170', '#E2E5EA', '#1F4A8C'

def font(kind, size, weight):
    name = 'SchibstedGrotesk%5Bwght%5D.ttf' if kind == 'display' else 'Roboto%5Bwdth,wght%5D.ttf'
    f = ImageFont.truetype(os.path.join(FONTS, name), size * S)
    axes = f.get_variation_axes()
    f.set_variation_by_axes([weight if a.get('name', b'') in (b'Weight', 'Weight') else a['default'] for a in axes])
    return f

W, H, M = 1200, 630, 72
im = Image.new('RGB', (W * S, H * S), BG)
d = ImageDraw.Draw(im)
d.rectangle([0, 0, 8 * S, H * S], fill=ACCENT)

d.text((M * S, 58 * S), 'Tucker Williams', font=font('body', 24, 500), fill=INK)
d.text((M * S, 92 * S), 'UX & Product Design Leader · tuckerwilliams.info', font=font('body', 17, 400), fill=MUTED)

# Headline, with "feel simple" in the accent color as on the site. Words are laid out one at a time so color can change mid-line.
hf = font('display', 58, 600)
words = [(w, INK) for w in 'I lead design teams that make large, complicated products'.split()] + \
        [('feel', ACCENT), ('simple', ACCENT), ('.', INK)]
x, y, maxx, lh, sp = M * S, 168 * S, (W - M - 40) * S, 70 * S, d.textlength(' ', font=hf)
for w, col in words:
    wl = d.textlength(w, font=hf)
    if w == '.':  # period sits right against "simple"
        x -= sp
    elif x + wl > maxx and x > M * S:
        x, y = M * S, y + lh
    d.text((x, y), w, font=hf, fill=col); x += wl + sp

# Lede, muted, under the headline.
d.text((M * S, y + 96 * S), 'New products and established ones, from first concept to delivery.', font=font('body', 24, 400), fill=MUTED)

d.rectangle([M * S, 503 * S, (W - M) * S, 504 * S - 1], fill=LINE)
lf, vf = font('body', 14, 400), font('body', 19, 500)
facts = [('Looking for', 'Director or Head of UX'), ('Experience', '15+ years'),
         ('Most recently', 'Publicis Sapient'), ('Based in', 'Dallas–Fort Worth')]
for i, (k, v) in enumerate(facts):
    cx = (M + i * 271) * S
    lx = cx
    for ch in k.upper():  # light letter-spacing on the labels
        d.text((lx, 527 * S), ch, font=lf, fill=MUTED); lx += d.textlength(ch, font=lf) + 0.9 * S
    d.text((cx, 551 * S), v, font=vf, fill=INK)

im.resize((W, H), Image.LANCZOS).save(os.path.join(ROOT, 'assets', 'img', 'og.jpg'), quality=92, optimize=True)
print('wrote assets/img/og.jpg')
