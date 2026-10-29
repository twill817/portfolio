"""Build the 16:9 slide images for the PA.gov walkthrough (3200x1800)."""
import json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 3200, 1800
BG = (244, 242, 238); INK = (23, 25, 27); MUTED = (94, 100, 104); LINE = (218, 214, 206)
ACCENT = (14, 102, 86); ACCENT_SOFT = (220, 235, 230); WARM = (192, 138, 46); WARM_SOFT = (243, 231, 207)
HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', '..', 'assets', 'img')
OUT = os.path.join(HERE, 'slides'); os.makedirs(OUT, exist_ok=True)

def font(kind, size, weight):
    path = os.path.join(HERE, 'fonts', 'SchibstedGrotesk%5Bwght%5D.ttf' if kind == 'display' else 'Roboto%5Bwdth,wght%5D.ttf')
    f = ImageFont.truetype(path, size)
    try:
        axes = f.get_variation_axes()
        vals = [weight if a.get('name', b'') in (b'Weight', 'Weight') else a['default'] for a in axes]
        f.set_variation_by_axes(vals)
    except Exception:
        pass
    return f

def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def para(d, xy, text, f, fill, maxw, lh):
    x, y = xy
    for ln in wrap(d, text, f, maxw):
        d.text((x, y), ln, font=f, fill=fill); y += lh
    return y

def canvas(color=BG):
    return Image.new('RGB', (W, H), color)

def shadowed(base, img, box, radius=18):
    """Paste img fitted into box (x,y,w,h) with a soft shadow and rounded corners."""
    x, y, bw, bh = box
    im = img.copy(); im.thumbnail((bw, bh), Image.LANCZOS) if im.width > bw or im.height > bh else None
    s = min(bw / im.width, bh / im.height)
    im = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    px, py = x + (bw - im.width) // 2, y + (bh - im.height) // 2
    sh = Image.new('L', (W, H), 0); ImageDraw.Draw(sh).rounded_rectangle((px, py + 24, px + im.width, py + im.height + 24), radius, fill=90)
    sh = sh.filter(ImageFilter.GaussianBlur(40))
    base.paste(Image.new('RGB', (W, H), (60, 60, 55)), (0, 0), sh)
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width, im.height), radius, fill=255)
    base.paste(im, (px, py), m)
    return base

def fullbleed(img):
    """Composed 4:3 images that already carry their own backdrop: extend that backdrop to 16:9."""
    img = img.convert('RGB'); bgc = img.getpixel((4, 4))
    c = canvas(bgc); s = H / img.height
    im = img.resize((round(img.width * s), H), Image.LANCZOS)
    c.paste(im, ((W - im.width) // 2, 0)); return c

def eyebrow(d, xy, text):
    d.text(xy, text.upper(), font=font('body', 44, 600), fill=ACCENT, spacing=0)

def save(img, name):
    img.save(os.path.join(OUT, name + '.png')); img.resize((1600, 900), Image.LANCZOS).save(os.path.join(OUT, name + '.webp'), quality=85)

M = 260  # side margin for cards

# s01 title
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 520), 'Case study walkthrough')
d.text((M - 8, 600), 'PA.gov', font=font('display', 330, 700), fill=INK)
d.text((M, 1010), 'Commonwealth of Pennsylvania · 2023–2024', font=font('body', 64, 400), fill=MUTED)
d.line((M, 1180, W - M, 1180), fill=LINE, width=4)
d.text((M, 1230), 'Tucker Williams', font=font('display', 72, 600), fill=INK)
d.text((M, 1325), 'UX & Product Design Leader', font=font('body', 56, 400), fill=MUTED)
save(c, 's01-title')

# s02 scale
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 330), 'The problem')
for i, (n, lab) in enumerate([('62', 'websites'), ('43', 'agencies')]):
    x = M + i * 1150
    d.text((x - 6, 420), n, font=font('display', 420, 700), fill=INK)
    d.text((x, 900), lab, font=font('body', 80, 500), fill=MUTED)
d.line((M, 1100, W - M, 1100), fill=LINE, width=4)
para(d, (M, 1160), 'Each site was organized around the agency that ran it.', font('body', 76, 400), INK, W - 2 * M, 100)
d.rounded_rectangle((M, 1330, M + 1280, 1460), 65, fill=WARM_SOFT)
d.text((M + 60, 1358), 'The commitment: no wrong door', font=font('body', 64, 500), fill=(110, 76, 18))
save(c, 's02-scale')

# s03 first-time applicant journey (already composed with backdrop)
save(fullbleed(Image.open(os.path.join(IMG, 'pa-0a-journey.webp'))), 's03-journey-first')

# s04 renewal stage of the time-constrained journey
j = Image.open(os.path.join(HERE, 'src', 'journey-renewal.png')).convert('RGB')
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 150), 'Time-constrained benefits user · stage 5 of 5')
save(shadowed(c, j, (M, 260, W - 2 * M, H - 380)), 's04-journey-renewal')

# s05 site map
sm = Image.open(os.path.join(IMG, 'pa-0b-sitemap.webp')).convert('RGB')
c = canvas(sm.getpixel((4, 4))); s = min(W / sm.width, H / sm.height)
im = sm.resize((round(sm.width * s), round(sm.height * s)), Image.LANCZOS)
c.paste(im, ((W - im.width) // 2, (H - im.height) // 2)); save(c, 's05-sitemap')

# s06, s07 smaller screenshots as cards
for name, f, label in [('s06-search', 'pa-1-search.webp', 'Find Services, with life-event filters applied'),
                       ('s07-tags', 'pa-2-tags.webp', 'Search results, each tagged by agency, topic, and life event')]:
    c = canvas(); d = ImageDraw.Draw(c)
    eyebrow(d, (M, 150), label)
    save(shadowed(c, Image.open(os.path.join(IMG, f)).convert('RGB'), (M, 260, W - 2 * M, H - 380)), name)

# s08, s09 composed screens
save(fullbleed(Image.open(os.path.join(IMG, 'pa-3-service.webp'))), 's08-service')
save(fullbleed(Image.open(os.path.join(IMG, 'pa-4-apply.webp'))), 's09-apply')

# s10 hard call
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 300), 'The hard call')
colw = (W - 2 * M - 120) // 2
d.rounded_rectangle((M, 420, M + colw, 1240), 24, outline=LINE, width=4)
d.text((M + 70, 480), 'FIRST PLAN', font=font('body', 44, 600), fill=MUTED)
para(d, (M + 70, 560), 'Organize the sites around life events', font('display', 92, 600), MUTED, colw - 140, 112)
x2 = M + colw + 120
d.rounded_rectangle((x2, 420, x2 + colw, 1240), 24, fill=ACCENT_SOFT)
d.text((x2 + 70, 480), 'WHAT WE DID', font=font('body', 44, 600), fill=ACCENT)
para(d, (x2 + 70, 560), 'Simpler recommendations, plus examples and guidance agencies could follow on their own', font('display', 92, 600), INK, colw - 140, 112)
d.polygon([(M + colw + 30, 800), (M + colw + 90, 830), (M + colw + 30, 860)], fill=ACCENT)
para(d, (M, 1330), 'Why: no one on the client side was going to own life-event content.', font('body', 64, 400), INK, W - 2 * M, 86)
save(c, 's10-hardcall')

# s11 outcome
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 300), 'Outcome')
para(d, (M, 400), 'Agencies weren’t required to adopt the new structure. All but a handful did.', font('display', 128, 600), INK, W - 2 * M, 150)
d.line((M, 860, W - M, 860), fill=LINE, width=4)
d.text((M - 4, 930), '37% → 95%', font=font('display', 240, 700), fill=ACCENT)
d.text((M, 1220), 'Accessibility audit score', font=font('body', 72, 500), fill=INK)
d.text((M, 1320), 'Program-wide figures, from many people’s work', font=font('body', 56, 400), fill=MUTED)
save(c, 's11-outcome')

# s12 close
c = canvas(); d = ImageDraw.Draw(c)
d.text((M - 6, 640), 'Thanks for watching.', font=font('display', 200, 700), fill=INK)
d.line((M, 960, W - M, 960), fill=LINE, width=4)
d.text((M, 1010), 'Tucker Williams', font=font('display', 72, 600), fill=INK)
d.text((M, 1105), 'tuckerwilliams.info', font=font('body', 60, 400), fill=ACCENT)
save(c, 's12-close')
print('done', sorted(os.listdir(OUT)))
