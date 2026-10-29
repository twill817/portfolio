"""Render the PA.gov walkthrough from a saved take.

usage: python3 render.py take.json audio_file out_dir
take.json holds {"marks": [...seconds per cue...], "duration": seconds}
Writes pa-walkthrough.mp4, pa-walkthrough.vtt, pa-walkthrough-poster.webp, chapters.json
"""
import json, os, re, subprocess, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FPS, OW, OH, XFADE, TAIL = 30, 1920, 1080, 0.5, 0.8
CARDS = {'s01-title', 's02-scale', 's10-hardcall', 's11-outcome', 's12-close'}

take = json.load(open(sys.argv[1])); audio = sys.argv[2]; out = sys.argv[3]
os.makedirs(out, exist_ok=True)
# Large takes are stored by the studio as base64 text of a mono WAV; turn that back into audio.
with open(audio, 'rb') as fh:
    head = fh.read(5)
if head == b'UklGR':
    import base64
    wav = os.path.join(out, '_take.wav')
    open(wav, 'wb').write(base64.b64decode(open(audio, 'rb').read()))
    audio = wav
data = json.load(open(os.path.join(HERE, 'cues.json'))); cues = data['cues']
marks = [float(m) for m in take['marks']]
assert len(marks) == len(cues) and marks[0] == 0 and all(b > a for a, b in zip(marks, marks[1:])), 'marks must be one per cue, rising, starting at 0'
dur = float(take['duration']) + TAIL
ends = marks[1:] + [dur]
slides = [Image.open(os.path.join(HERE, 'slides', c['slide'] + '.png')).convert('RGB') for c in cues]
SW, SH = slides[0].size

def ease(p): return p * p * (3 - 2 * p)

def frame(i, t):
    """Slide i at absolute time t, with its slow push between the two motion rects."""
    a, b = cues[i]['motion']; s, e = marks[i], ends[i]
    p = ease(min(1, max(0, (t - s) / max(0.1, e - s))))
    x, y, w = (a[k] + (b[k] - a[k]) * p for k in range(3))
    x, y = min(x, 1 - w), min(y, 1 - w)
    box = (x * SW, y * SH, (x + w) * SW, (y + w) * SH)
    return slides[i].resize((OW, OH), Image.BICUBIC, box=box, reducing_gap=2.0)

def cue_at(t):
    i = 0
    for k, m in enumerate(marks):
        if t >= m: i = k
    return i

tmp = os.path.join(out, '_video.mp4')
enc = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OW}x{OH}', '-r', str(FPS), '-i', '-',
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25', '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
n = int(dur * FPS)
for f in range(n):
    t = f / FPS; i = cue_at(t); im = frame(i, t)
    if i > 0 and t - marks[i] < XFADE:
        p = ease((t - marks[i]) / XFADE)
        if cues[i]['slide'] in CARDS or cues[i - 1]['slide'] in CARDS:
            # text cards dip through the page colour so two sets of words never overlap
            bg = Image.new('RGB', (OW, OH), (244, 242, 238))
            im = Image.blend(frame(i - 1, t), bg, p * 2) if p < .5 else Image.blend(bg, im, p * 2 - 1)
        else:
            im = Image.blend(frame(i - 1, t), im, p)
    enc.stdin.write(im.tobytes())
    if f == int(0.5 * FPS): im.save(os.path.join(out, 'pa-walkthrough-poster.webp'), quality=85)
enc.stdin.close(); enc.wait()

final = os.path.join(out, 'pa-walkthrough.mp4')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-t', f'{dur:.2f}',
                '-movflags', '+faststart', final], check=True)
os.remove(tmp)

# Captions: each cue's sentences share its time in proportion to their words; long sentences split near 12 words.
def chunks(text):
    out_ = []
    for s in re.split(r'(?<=[.!?])\s+', text.strip()):
        w = s.split()
        while len(w) > 14:
            cut = 12
            for k in range(8, min(14, len(w) - 3)):
                if w[k - 1].endswith(','): cut = k
            out_.append(' '.join(w[:cut])); w = w[cut:]
        if w: out_.append(' '.join(w))
    return out_
def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h:02d}:{m:02d}:{s:06.3f}'
vtt = ['WEBVTT', '']
for i, c in enumerate(cues):
    parts = [p for txt in c['text'] for p in chunks(txt)]
    words = [len(p.split()) for p in parts]; total = sum(words)
    s0, e0 = marks[i] + 0.15, ends[i] - (TAIL if i == len(cues) - 1 else 0.1)
    t = s0
    for p, wc in zip(parts, words):
        d = (e0 - s0) * wc / total
        vtt += [ts(t) + ' --> ' + ts(t + d - 0.05), p, '']; t += d
open(os.path.join(out, 'pa-walkthrough.vtt'), 'w').write('\n'.join(vtt))

chapters = []
for i, c in enumerate(cues):
    if not chapters or chapters[-1]['chapter'] != c['chapter']:
        chapters.append({'chapter': c['chapter'], 'title': data['chapters'][c['chapter']], 't': round(marks[i], 1)})
json.dump({'duration': round(dur, 1), 'chapters': chapters}, open(os.path.join(out, 'chapters.json'), 'w'), indent=1)
print('rendered', final, round(dur, 1), 's')
