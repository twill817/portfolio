"""Build the 16:9 slide images for the PA.gov walkthrough (3200x1800), in the site's palette."""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage

W, H = 3200, 1800
# Site tokens (assets/css/site.css, light theme)
BG = (245, 246, 248)          # --surface
WHITE = (255, 255, 255)       # --bg
INK = (17, 20, 24)            # --ink
MUTED = (89, 97, 112)         # --muted
LINE = (226, 229, 234)        # --line
ACCENT = (31, 74, 140)        # --accent
ACCENT_SOFT = (229, 236, 246) # --accent-soft
SHADOW = (17, 20, 24)
SOURCE_BG = 250               # the neutral grey the Figma exports sit on

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', '..', '..', 'assets', 'img')
OUT = os.path.join(HERE, 'slides'); os.makedirs(OUT, exist_ok=True)

def font(kind, size, weight):
    path = os.path.join(HERE, '..', 'fonts', 'SchibstedGrotesk%5Bwght%5D.ttf' if kind == 'display' else 'Roboto%5Bwdth,wght%5D.ttf')
    f = ImageFont.truetype(path, size)
    try:
        axes = f.get_variation_axes()
        f.set_variation_by_axes([weight if a.get('name', b'') in (b'Weight', 'Weight') else a['default'] for a in axes])
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

def tracked(d, xy, text, f, fill, track):
    """Text with letter-spacing, like the site's uppercase section labels."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill); x += d.textlength(ch, font=f) + track
    return x

def eyebrow(d, xy, text, size=42):
    tracked(d, xy, text.upper(), font('body', size, 600), ACCENT, size * 0.12)

def canvas(color=BG):
    return Image.new('RGB', (W, H), color)

def recolor(img, target, protect_pages=True):
    """Move the export's neutral grey backdrop (and its soft shadows) onto `target`, leaving the screens themselves untouched."""
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    neutral = (a.max(2) - a.min(2)) <= 6
    keep = np.zeros(neutral.shape, bool)
    if protect_pages:
        white = a.min(2) >= 253
        lab, n = ndimage.label(white)
        areas = ndimage.sum(white, lab, range(1, n + 1))
        for k, sl in enumerate(ndimage.find_objects(lab)):
            if areas[k] > white.size * 0.003: keep[sl] = True
    sel = neutral & ~keep
    a[sel] = a[sel] * (np.array(target, np.float32) / SOURCE_BG)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def card(base, img, xy, size, radius=20, border=True, shadow=110):
    """Place img (resized to size) at xy with a soft shadow, rounded corners and a hairline border."""
    x, y = xy; w, h = size
    im = img.resize((w, h), Image.LANCZOS)
    sh = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((x + 6, y + 30, x + w - 6, y + h + 30), radius, fill=shadow)
    base.paste(Image.new('RGB', (W, H), SHADOW), (0, 0), sh.filter(ImageFilter.GaussianBlur(46)))
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    base.paste(im, (x, y), m)
    if border: ImageDraw.Draw(base).rounded_rectangle((x, y, x + w - 1, y + h - 1), radius, outline=LINE, width=3)
    return base

def fit_card(base, img, box, **kw):
    x, y, bw, bh = box
    s = min(bw / img.width, bh / img.height); w, h = round(img.width * s), round(img.height * s)
    return card(base, img, (x + (bw - w) // 2, y + (bh - h) // 2), (w, h), **kw)

def fullbleed(img):
    """A composed 4:3 export, its backdrop moved onto the slide colour and extended to 16:9."""
    img = recolor(img, BG); c = canvas(); s = H / img.height
    im = img.resize((round(img.width * s), H), Image.LANCZOS)
    c.paste(im, ((W - im.width) // 2, 0)); return c

def save(img, name):
    img.save(os.path.join(OUT, name + '.png'))
    img.resize((1600, 900), Image.LANCZOS).save(os.path.join(OUT, name + '.webp'), quality=85)

M = 260
src = lambda f: Image.open(os.path.join(IMG, f)).convert('RGB')
sitemap = src('pa-0b-sitemap.webp')

# s01 title: the case name on the left, the work itself layered on the right
c = canvas(); d = ImageDraw.Draw(c)
# back: the services-first and agency-template columns of the site map, on white
sm = recolor(sitemap.crop((90, 300, 3520, 2620)), WHITE, protect_pages=False)
card(c, sm, (1560, 190), (1860, round(1860 * sm.height / sm.width)), radius=24)
# front: Find Services with the life-event filters applied
fs = src('pa-1-search.webp')
card(c, fs, (1420, 820), (1180, round(1180 * fs.height / fs.width)), radius=20, shadow=140)
# soft fade so the collage settles into the slide on the left edge
fade = Image.new('L', (W, H), 0); fd = ImageDraw.Draw(fade)
for i in range(240):
    fd.line([(1180 + i, 0), (1180 + i, H)], fill=int(255 * (1 - i / 240) ** 1.6))
c.paste(canvas(), (0, 0), fade)
d = ImageDraw.Draw(c)
d.rectangle((0, 0, 1180, H), fill=BG)
# Name and title live in the page header, so the slide carries only the case itself
d.text((M - 8, 620), 'PA.gov', font=font('display', 300, 700), fill=INK)
d.text((M, 990), 'Commonwealth of Pennsylvania', font=font('body', 58, 400), fill=MUTED)
d.text((M, 1066), '2023–2024', font=font('body', 58, 400), fill=MUTED)
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
d.rounded_rectangle((M, 1330, M + 1220, 1460), 65, fill=ACCENT_SOFT)
d.text((M + 60, 1358), 'The commitment: no wrong door', font=font('body', 64, 500), fill=ACCENT)
save(c, 's02-scale')

# s03 first-time applicant journey
save(fullbleed(src('pa-0a-journey.webp')), 's03-journey-first')

# s04 renewal stage of the time-constrained journey
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 150), 'Time-constrained benefits user · stage 5 of 5')
fit_card(c, Image.open(os.path.join(HERE, 'src', 'journey-renewal.png')).convert('RGB'), (M, 260, W - 2 * M, H - 380))
save(c, 's04-journey-renewal')

# s05 site map
c = canvas(); sm = recolor(sitemap, BG, protect_pages=False); s = min(W / sm.width, H / sm.height)
im = sm.resize((round(sm.width * s), round(sm.height * s)), Image.LANCZOS)
c.paste(im, ((W - im.width) // 2, (H - im.height) // 2)); save(c, 's05-sitemap')

# s06, s07 smaller screenshots as cards
for name, f, label in [('s06-search', 'pa-1-search.webp', 'Find Services, with life-event filters applied'),
                       ('s07-tags', 'pa-2-tags.webp', 'Search results, each tagged by agency, topic, and life event')]:
    c = canvas(); d = ImageDraw.Draw(c)
    eyebrow(d, (M, 150), label)
    save(fit_card(c, src(f), (M, 260, W - 2 * M, H - 380)), name)

# s08, s09 composed screens
save(fullbleed(src('pa-3-service.webp')), 's08-service')
save(fullbleed(src('pa-4-apply.webp')), 's09-apply')

# s04b research scale
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 300), 'The research')
stats = [('10', 'months'), ('566', 'residents'), ('44', 'hours of interviews'), ('333', 'unmoderated tests')]
colw = (W - 2 * M) // 4
for i, (n, lab) in enumerate(stats):
    x = M + i * colw
    d.text((x - 6, 420), n, font=font('display', 210, 700), fill=INK)
    d.text((x, 700), lab, font=font('body', 64, 500), fill=MUTED)
d.line((M, 900, W - M, 900), fill=LINE, width=4)
para(d, (M, 970), 'Three life events: a financial shock, health and aging, and starting a business.', font('body', 72, 400), INK, W - 2 * M, 96)
d.rounded_rectangle((M, 1200, M + 1900, 1330), 65, fill=ACCENT_SOFT)
d.text((M + 60, 1228), 'Including screen reader users and residents with cognitive disabilities', font=font('body', 56, 500), fill=ACCENT)
save(c, 's04b-research')

# s07b plain-language labels
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 200), 'Words residents actually use')
d.text((M - 4, 290), '50%', font=font('display', 200, 700), fill=ACCENT)
para(d, (M + 520, 330), 'of patients and caregivers couldn’t tell what “ECM” meant. 54% were lost on “OCDEL Announcements.”', font('body', 64, 400), INK, W - 2 * M - 520, 84)
rows = [('Our Programs', 'Programs, Services, and Benefits'), ('Resources', 'Documents, Forms, and Guidelines'),
        ('Medicaid', 'Health Insurance for Low Income Residents (Medicaid)'), ('Industrial and Occupational Safety', 'Construction Safety')]
y = 640; cx = M + 1060
tracked(d, (M, y), 'BEFORE', font('body', 42, 600), MUTED, 5); tracked(d, (cx, y), 'AFTER', font('body', 42, 600), ACCENT, 5)
y += 80
fb, fa = font('body', 60, 400), font('body', 60, 600)
for b, a in rows:
    d.line((M, y, W - M, y), fill=LINE, width=3); y += 38
    d.text((M, y), b, font=fb, fill=MUTED)
    w = d.textlength(b, font=fb); d.line((M, y + 40, M + w, y + 40), fill=MUTED, width=4)
    d.polygon([(cx - 90, y + 22), (cx - 50, y + 42), (cx - 90, y + 62)], fill=ACCENT)
    d.text((cx, y), a, font=fa, fill=INK); y += 120
d.line((M, y, W - M, y), fill=LINE, width=3)
para(d, (M, y + 60), 'The rule: name what a resident is looking for, not the office that owns it.', font('body', 60, 400), INK, W - 2 * M, 80)
save(c, 's07b-labels')

# s09b the wizard, pitched and tested
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 150), 'A guided search, pitched and tested')
# the three prototype screens straight on the slide, larger, running off the bottom edge like a scroll
WIZ = os.path.join(HERE, '..', '..', 'pa-wizard', 'src')
pw, gap = 820, 110; x0 = (W - 3 * pw - 2 * gap) // 2; top = 270; rad = 52
for i, n in enumerate(['step1', 'step2', 'step3']):
    im = Image.open(os.path.join(WIZ, n + '.png')).convert('RGB')
    im = im.resize((pw, round(im.height * pw / im.width)), Image.LANCZOS).crop((0, 0, pw, H - top + rad))
    x = x0 + i * (pw + gap)
    sh = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((x + 8, top + 30, x + pw - 8, top + im.height + 30), rad, fill=95)
    c.paste(Image.new('RGB', (W, H), SHADOW), (0, 0), sh.filter(ImageFilter.GaussianBlur(56)))
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, pw - 1, im.height - 1), rad, fill=255)
    c.paste(im, (x, top), m)
    ImageDraw.Draw(c).rounded_rectangle((x, top, x + pw - 1, top + im.height - 1), rad, outline=LINE, width=3)
save(c, 's09b-wizard')

# s10 hard call
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 300), 'The hard call')
colw = (W - 2 * M - 120) // 2
d.rounded_rectangle((M, 420, M + colw, 1240), 24, fill=WHITE, outline=LINE, width=4)
tracked(d, (M + 70, 480), 'FIRST PLAN', font('body', 42, 600), MUTED, 5)
para(d, (M + 70, 560), 'Organize the sites around life events', font('display', 92, 600), MUTED, colw - 140, 112)
x2 = M + colw + 120
d.rounded_rectangle((x2, 420, x2 + colw, 1240), 24, fill=ACCENT_SOFT)
tracked(d, (x2 + 70, 480), 'WHAT WE DID', font('body', 42, 600), ACCENT, 5)
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
# --- 10-slide cut: composites so each chapter is one slide ---

# research: the numbers on the left, the first-time applicant journey on the right
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 260), 'The research')
for i, (n, lab) in enumerate([('566', 'residents'), ('10', 'months'), ('44', 'hours of interviews'), ('333', 'unmoderated tests')]):
    x = M + (i % 2) * 520; y = 380 + (i // 2) * 420
    d.text((x - 6, y), n, font=font('display', 190, 700), fill=INK)
    d.text((x, y + 230), lab, font=font('body', 54, 500), fill=MUTED)
para(d, (M, 1260), 'Three life events: a financial shock, health and aging, and starting a business.', font('body', 54, 400), INK, 980, 72)
jm = recolor(src('pa-0a-journey.webp'), WHITE)
fit_card(c, jm, (1420, 200, W - 1420 - 140, H - 400))
save(c, 's03-research')

# search and tags: Find Services in front, tagged results behind
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 150), 'Search that starts from the resident')
tg = src('pa-2-tags.webp'); card(c, tg, (1500, 330), (1560, round(1560 * tg.height / tg.width)), radius=20)
fs = src('pa-1-search.webp'); card(c, fs, (M, 300), (1500, round(1500 * fs.height / fs.width)), radius=20, shadow=140)
save(c, 's05-search-tags')

# service pattern and ways to apply, side by side
c = canvas(); d = ImageDraw.Draw(c)
eyebrow(d, (M, 150), 'One pattern for every service')
gap = 100; bw = (W - 2 * M - gap) // 2
for i, (f, x0, y0) in enumerate([('pa-3-service.webp', 0.335, 0.1), ('pa-4-apply.webp', 0.4, 0.2)]):
    im = src(f); im = im.crop((round(im.width * x0), round(im.height * y0), round(im.width * (x0 + 0.55)), round(im.height * (y0 + 0.54))))
    fit_card(c, im, (M + i * (bw + gap), 260, bw, H - 360))
save(c, 's07-service-apply')

print('built', len([f for f in os.listdir(OUT) if f.endswith('.png')]), 'slides')
