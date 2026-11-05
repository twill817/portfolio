"""Build the PA.gov life-event wizard images (pa-5-wizard.webp 2400x1800 and pa-5-wizard-m.webp 700x700)
from full-length 2x exports of the Figma prototype frames in src/ (status bar, header, page content; footer left out)."""
import os
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', '..', 'assets', 'img')
BG, LINE, SHADOW = (245, 246, 248), (226, 229, 234), (17, 20, 24)
src = lambda n: Image.open(os.path.join(HERE, 'src', n + '.png')).convert('RGB')

screens = [src('step1'), src('step2'), src('step3')]

def phone(base, img, x, y, w, radius):
    """Paste a screen as a rounded card with a soft shadow; anything past the canvas bleeds off the bottom edge."""
    s = w / img.width; im = img.resize((w, round(img.height * s)), Image.LANCZOS)
    W, H = base.size; h = min(im.height, H - y + radius + 4)
    im = im.crop((0, 0, w, h))
    sh = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((x + 6, y + 26, x + w - 6, y + h + 26), radius, fill=95)
    base.paste(Image.new('RGB', (W, H), SHADOW), (0, 0), sh.filter(ImageFilter.GaussianBlur(radius * 1.2)))
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    base.paste(im, (x, y), m)
    ImageDraw.Draw(base).rounded_rectangle((x, y, x + w - 1, y + h - 1), radius, outline=LINE, width=max(2, radius // 16))

# Desktop: all three steps, top aligned, running off the bottom like the other PA.gov screens
c = Image.new('RGB', (2400, 1800), BG); w, gap = 660, 120; x0 = (2400 - 3 * w - 2 * gap) // 2
for i, im in enumerate(screens): phone(c, im, x0 + i * (w + gap), 130, w, 44)
c.save(os.path.join(OUT, 'pa-5-wizard.webp'), quality=88, method=6)

# Phone: questions and results, larger, so the text stays readable at small widths
m = Image.new('RGB', (1400, 1400), BG); w, gap = 560, 80; x0 = (1400 - 2 * w - gap) // 2
for i, im in enumerate(screens[1:]): phone(m, im, x0 + i * (w + gap), 90, w, 36)
m.resize((700, 700), Image.LANCZOS).save(os.path.join(OUT, 'pa-5-wizard-m.webp'), quality=88, method=6)
print('built pa-5-wizard')
