"""Render slides.html sections s1-s9 to assets/img/coppel-N.webp (3200x1800, shown at 1600x900). s10-s14 are walkthrough-only slides (see ../walkthroughs/coppel)."""
import os, io
from playwright.sync_api import sync_playwright
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(HERE,'..','..','assets','img')
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1600,'height':900},device_scale_factor=2)
    pg.goto('file://'+os.path.join(HERE,'slides.html')); pg.evaluate('document.fonts.ready')
    for i in range(1,10):
        png=pg.locator(f'#s{i}').screenshot()
        Image.open(io.BytesIO(png)).convert('RGB').save(os.path.join(OUT,f'coppel-{i}.webp'),quality=90,method=6)
    b.close()
