"""Build the 16:9 slide images for the Coppel walkthrough (3200x1800) from ../../coppel-slides/slides.html,
the same source as the case study's diagrams."""
import os, io, json
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'coppel-slides', 'slides.html')
OUT = os.path.join(HERE, 'slides'); os.makedirs(OUT, exist_ok=True)
# walkthrough slide name -> section id in slides.html
SECTIONS = json.load(open(os.path.join(HERE, 'cues.json')))['sections']

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1600, 'height': 900}, device_scale_factor=2)
    pg.goto('file://' + os.path.abspath(SRC)); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(300)
    for name, sec in SECTIONS.items():
        im = Image.open(io.BytesIO(pg.locator('#' + sec).screenshot())).convert('RGB')
        im.save(os.path.join(OUT, name + '.png'))
        im.resize((1600, 900), Image.LANCZOS).save(os.path.join(OUT, name + '.webp'), quality=85)
    b.close()
print('built', len(SECTIONS), 'slides')
