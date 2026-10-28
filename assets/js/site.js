document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Copy email ---------- */
document.getElementById('copy').addEventListener('click', () => {
  const text = document.getElementById('email').textContent.trim();
  const status = document.getElementById('status');
  const fallback = () => {
    const r = document.createRange(); r.selectNodeContents(document.getElementById('email'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    status.textContent = 'Selected. Press Ctrl+C or ⌘C to copy.';
  };
  try {
    navigator.clipboard.writeText(text).then(() => { status.textContent = 'Copied to clipboard'; }, fallback);
  } catch (e) { fallback(); }
});

/* ---------- Clients: accordion on phones, open grid elsewhere ---------- */
(function(){
  const groups = [...document.querySelectorAll('.client-group')];
  const mq = matchMedia('(max-width:640px)');
  const btn = document.getElementById('toggle-all');
  const allOpen = () => groups.every(g => g.open);
  const label = () => {
    const open = allOpen();
    btn.textContent = open ? 'Collapse all' : 'Expand all';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  btn.addEventListener('click', () => { const open = !allOpen(); groups.forEach(g => { g.open = open; }); label(); });
  groups.forEach(g => g.addEventListener('toggle', label));
  const apply = () => {
    groups.forEach((g, i) => {
      g.open = mq.matches ? i === 0 : true;
      g.querySelector('summary').tabIndex = mq.matches ? 0 : -1;
    });
    label();
  };
  groups.forEach(g => g.querySelector('summary').addEventListener('click', e => { if (!mq.matches) e.preventDefault(); }));
  mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
  apply();
})();


/* ---------- Case-study carousels: 3D on larger screens, a flat native swipe strip on phones ---------- */
(function(){
  const box = document.getElementById('lightbox');
  const boxImg = box && box.querySelector('img'), boxCap = box && box.querySelector('.lightbox-cap'), pan = box && box.querySelector('.lb-pan');
  // The lightbox steps through whichever carousel opened it
  const lb = { slides: null, i: 0, sync: null };
  const boxCount = box && box.querySelector('.lb-count');
  function show(i) {
    const n = lb.slides.length; lb.i = (i + n) % n;
    const el = lb.slides[lb.i], img = el.querySelector('img');
    box.classList.remove('zoomed', 'can-zoom');
    boxImg.src = img.getAttribute('src'); boxImg.alt = img.alt;   // always the full screen, never the phone crop
    boxCap.textContent = el.dataset.title + '. ' + el.dataset.desc;
    boxCount.textContent = String(lb.i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    box.classList.toggle('single', n < 2);
    pan.scrollTop = pan.scrollLeft = 0;
    if (boxImg.complete) boxImg.dispatchEvent(new Event('load'));
    if (lb.sync) lb.sync(lb.i);
  }
  window.__lbOpen = (slides, i, sync) => {
    if (!box || typeof box.showModal !== 'function') return;
    lb.slides = slides; lb.sync = sync; show(i);
    if (!box.open) box.showModal();
  };
  if (box) {
    const fit = () => box.classList.toggle('can-zoom', !!boxImg.naturalWidth && boxImg.naturalWidth > pan.clientWidth + 40);
    box.querySelector('.lightbox-close').addEventListener('click', () => box.close());
    box.querySelector('.lb-prev').addEventListener('click', () => show(lb.i - 1));
    box.querySelector('.lb-next').addEventListener('click', () => show(lb.i + 1));
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(lb.i + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(lb.i - 1); }
    });
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
    box.addEventListener('close', () => box.classList.remove('zoomed', 'can-zoom'));
    boxImg.addEventListener('load', fit);
    // Swipe between screens when the image isn't zoomed
    let sx = null, sy = 0, swiped = false;
    pan.addEventListener('pointerdown', e => { sx = box.classList.contains('zoomed') ? null : e.clientX; sy = e.clientY; swiped = false; });
    pan.addEventListener('pointerup', e => {
      if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { swiped = true; show(lb.i + (dx < 0 ? 1 : -1)); }
    });
    pan.addEventListener('pointercancel', () => { sx = null; });
    // Tap to zoom to the image's full size, centred on the tap; tap again to fit
    boxImg.addEventListener('click', e => {
      if (swiped) { swiped = false; return; }
      if (!box.classList.contains('can-zoom') && !box.classList.contains('zoomed')) return;
      const r = boxImg.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
      const on = box.classList.toggle('zoomed');
      if (on) { pan.scrollLeft = fx * boxImg.offsetWidth - pan.clientWidth / 2; pan.scrollTop = fy * boxImg.offsetHeight - pan.clientHeight / 2; }
    });
  }
  document.querySelectorAll('.carousel').forEach(root => {
    const slides = [...root.querySelectorAll('.car-slide')], n = slides.length;
    const count = root.querySelector('.car-count'), title = root.querySelector('.car-title'), desc = root.querySelector('.car-desc');
    const stage = root.querySelector('.car-stage');
    const narrow = matchMedia('(max-width:640px)');
    let index = 0;
    const flat = () => narrow.matches;
    function caption() {
      count.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      title.textContent = slides[index].dataset.title;
      desc.textContent = slides[index].dataset.desc;
    }
    function render() {
      root.classList.toggle('flat', flat());
      slides.forEach((el, i) => {
        el.setAttribute('role', 'button');
        if (flat()) {
          el.style.transform = el.style.opacity = el.style.filter = el.style.zIndex = el.style.pointerEvents = '';
          el.classList.toggle('is-active', i === index);
          el.removeAttribute('aria-hidden'); el.tabIndex = 0;
          el.setAttribute('aria-label', 'View larger: ' + el.dataset.title);
          return;
        }
        let d = ((i - index) % n + n) % n; if (d > n / 2) d -= n;
        const a = Math.abs(d), step = 70, depth = 260, turn = 34;
        el.style.transform = `translate(-50%,-50%) translateX(${d * step}%) translateZ(${-a * depth}px) rotateY(${-Math.sign(d) * Math.min(a, 1) * turn}deg)`;
        el.style.opacity = a > 1 ? 0 : a === 1 ? .55 : 1;
        el.style.filter = a ? 'saturate(.6)' : 'none';
        el.style.zIndex = 10 - a;
        el.style.pointerEvents = a > 1 ? 'none' : 'auto';
        el.classList.toggle('is-active', a === 0);
        el.setAttribute('aria-hidden', a ? 'true' : 'false');
        el.tabIndex = a ? -1 : 0;
        el.setAttribute('aria-label', a ? '' : 'View larger: ' + el.dataset.title);
      });
      caption();
    }
    const go = i => {
      index = (i + n) % n;
      if (flat()) { stage.scrollTo({ left: slides[index].offsetLeft - parseFloat(getComputedStyle(stage).paddingLeft), behavior: reduce ? 'auto' : 'smooth' }); slides.forEach((el, k) => el.classList.toggle('is-active', k === index)); caption(); }
      else render();
    };
    root.querySelector('.car-prev').addEventListener('click', () => go(index - 1));
    root.querySelector('.car-next').addEventListener('click', () => go(index + 1));
    // Opening the lightbox; paging inside it keeps this carousel on the same screen
    const open = i => window.__lbOpen && window.__lbOpen(slides, i, k => {
      if (k === index) return;
      if (flat()) { index = k; stage.scrollLeft = slides[k].offsetLeft - parseFloat(getComputedStyle(stage).paddingLeft); slides.forEach((el, j) => el.classList.toggle('is-active', j === k)); caption(); }
      else { index = k; render(); }
    });
    slides.forEach((el, i) => {
      el.addEventListener('click', () => { if (moved) return; (flat() || i === index) ? open(i) : go(i); });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    // Phones: the strip scrolls natively; keep the caption in step with the slide in view
    let t;
    stage.addEventListener('scroll', () => {
      if (!flat()) return;
      clearTimeout(t);
      t = setTimeout(() => {
        const pad = parseFloat(getComputedStyle(stage).paddingLeft);
        let best = 0, bd = Infinity;
        slides.forEach((el, i) => { const d = Math.abs(el.offsetLeft - pad - stage.scrollLeft); if (d < bd) { bd = d; best = i; } });
        if (best !== index) { index = best; slides.forEach((el, i) => el.classList.toggle('is-active', i === index)); caption(); }
      }, 60);
    }, { passive: true });
    // Larger screens: swipe or drag to turn the 3D carousel
    let x0 = null, moved = false;
    stage.addEventListener('pointerdown', e => { if (flat()) return; x0 = e.clientX; moved = false; });
    stage.addEventListener('pointermove', e => { if (x0 !== null && Math.abs(e.clientX - x0) > 8) moved = true; });
    stage.addEventListener('pointerup', e => {
      if (x0 === null) return; const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      setTimeout(() => { moved = false; }, 0);
    });
    const onChange = () => { render(); if (flat()) stage.scrollLeft = 0, index = 0, caption(); };
    narrow.addEventListener ? narrow.addEventListener('change', onChange) : narrow.addListener(onChange);
    render();
  });
})();

/* ---------- Back to top ---------- */
(function(){
  const b = document.getElementById('to-top');
  const update = () => b.classList.toggle('show', scrollY > 600);
  addEventListener('scroll', update, { passive: true }); update();
  const toTop = (e) => {
    if (e) e.preventDefault();
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.getElementById('top').focus({ preventScroll: true });
  };
  b.addEventListener('click', toTop);
  document.getElementById('top').addEventListener('click', toTop);
})();

/* ---------- Scroll settle + index highlight ---------- */
const settles = [...document.querySelectorAll('.settle')];
if ('IntersectionObserver' in window && !reduce) {
  const vh = innerHeight;
  settles.forEach(el => { if (el.getBoundingClientRect().top > vh) el.classList.add('pre'); });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  settles.forEach(el => io.observe(el));
}

/* ---------- Top navigation: mark the section in view ---------- */
if ('IntersectionObserver' in window) {
  const navLinks = [...document.querySelectorAll('.top nav a')];
  const byId = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
  const topSpy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { navLinks.forEach(l => l.classList.remove('on')); byId.get(e.target.id)?.classList.add('on'); }
  }), { rootMargin: '-35% 0px -60% 0px' });
  byId.forEach((a, id) => { const el = document.getElementById(id); if (el) topSpy.observe(el); });
  addEventListener('scroll', () => { if (scrollY < 200) navLinks.forEach(l => l.classList.remove('on')); }, { passive: true });
}

const links = [...document.querySelectorAll('.index a')].filter(a => a.getAttribute('href').startsWith('#'));
if ('IntersectionObserver' in window) {
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { links.forEach(l => l.classList.remove('on')); map.get(e.target.id)?.classList.add('on'); }
  }), { rootMargin: '-40% 0px -55% 0px' });
  map.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
}

/* ---------- Hero background: larger dots fly in from the left, connect into a low-poly face, and settle ---------- */
(function heroPolygon(){
  const stage = document.getElementById('stage');
  if (matchMedia('(max-width:640px)').matches) return;   // hidden on phones, so don't start it there
  if (!window.THREE) { document.documentElement.classList.add('no-webgl'); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { document.documentElement.classList.add('no-webgl'); return; }
  const PR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(PR);
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  const VH = 2 * 9 * Math.tan(THREE.MathUtils.degToRad(18));
  const head = new THREE.Group(); scene.add(head);
  const room = new THREE.Group(); scene.add(room);
  let seed = 31; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const MESH = {"p": [[350, 579], [347, 549], [344, 520], [342, 496], [339, 462], [337, 433], [336, 408], [338, 378], [345, 349], [355, 327], [365, 304], [375, 279], [382, 253], [386, 225], [385, 197], [381, 168], [373, 142], [361, 118], [344, 97], [322, 80], [297, 66], [269, 57], [241, 53], [213, 55], [188, 60], [164, 70], [138, 88], [118, 112], [107, 139], [102, 165], [100, 184], [100, 199], [101, 210], [105, 222], [110, 236], [105, 246], [100, 257], [96, 268], [90, 280], [84, 292], [77, 304], [71, 317], [71, 328], [80, 334], [92, 337], [96, 348], [92, 359], [99, 369], [95, 378], [97, 390], [104, 398], [101, 408], [100, 420], [102, 432], [107, 442], [118, 449], [129, 453], [139, 455], [164, 457], [190, 464], [206, 484], [209, 514], [211, 552], [271.8, 456.5], [311.6, 555.4], [219.5, 185.1], [244.9, 364.5], [320.3, 137.5], [269.9, 119.4], [131.2, 168.1], [243.3, 421.5], [182.8, 140.9], [162.5, 380.5], [174.9, 219.9], [167.4, 313.7], [238.4, 475.0], [267.7, 553.1], [245.3, 221.2], [294.3, 596.2], [261.9, 502.8], [214.9, 281.1], [280.9, 368.2], [145.2, 418.1], [310.9, 503.8], [286.3, 280.6], [210.0, 406.3], [154.7, 274.7], [338.3, 279.7], [266.9, 242.4], [137.0, 209.7], [262.6, 192.4], [325.8, 184.6], [151.0, 134.8], [266.7, 310.1], [318.5, 214.8], [160.9, 340.4], [217.9, 247.8], [205.4, 365.5], [300.8, 396.5], [235.8, 123.3], [139.7, 253.4], [139.9, 232.6], [187.4, 261.3], [140.0, 314.2], [246.5, 592.3], [121.0, 328.7], [187.1, 104.0], [154.2, 160.2], [179.6, 186.0], [291.0, 336.2], [303.2, 255.0], [160.6, 114.0], [160.6, 234.6], [117.5, 300.8], [141.9, 361.6], [202.4, 326.3], [207.9, 217.9], [294.3, 168.9], [210.8, 154.5], [345.7, 250.4], [317.4, 311.8], [234.5, 307.3], [154.6, 296.3], [157.1, 194.9], [118.9, 275.6], [308.0, 450.8], [179.6, 430.8], [138.4, 386.5], [283.2, 525.2], [229.8, 90.8], [211.2, 593.7], [313.5, 356.3], [126.6, 132.8], [240.6, 158.3], [160.9, 92.5], [252.5, 280.0], [269.4, 401.9], [140.8, 110.9], [157.5, 435.2], [219.0, 441.5], [345.6, 154.7], [354.9, 220.7], [134.3, 188.0], [139.9, 338.9], [126.2, 426.6], [239.5, 529.1], [121.0, 362.0], [137.3, 284.6], [287.6, 212.9], [166.6, 411.7], [164.2, 360.4], [290.6, 425.8], [98.2, 307.0], [326.3, 597.7], [117.4, 382.1], [166.8, 253.7], [292.4, 479.1], [267.9, 88.6], [301.9, 110.1], [129.4, 405.1]], "t": [[64, 0, 153], [78, 64, 153], [140, 17, 16], [15, 140, 16], [64, 1, 0], [2, 1, 64], [78, 76, 64], [106, 25, 24], [55, 144, 56], [144, 55, 54], [88, 110, 84], [119, 110, 94], [110, 87, 84], [87, 110, 119], [135, 88, 84], [93, 66, 121], [93, 135, 84], [135, 93, 121], [141, 14, 13], [141, 119, 94], [12, 141, 13], [141, 12, 119], [14, 91, 15], [91, 140, 15], [141, 91, 14], [91, 141, 94], [20, 157, 21], [157, 22, 21], [17, 67, 18], [140, 67, 17], [91, 67, 140], [43, 42, 41], [152, 43, 41], [43, 152, 44], [152, 38, 113], [83, 3, 2], [83, 2, 64], [3, 83, 4], [70, 66, 136], [66, 70, 85], [138, 144, 82], [111, 106, 71], [108, 118, 65], [118, 108, 71], [108, 107, 71], [53, 144, 54], [152, 105, 44], [105, 152, 113], [97, 66, 85], [110, 148, 94], [148, 110, 88], [148, 91, 94], [80, 135, 121], [151, 70, 136], [70, 151, 63], [5, 151, 6], [93, 109, 66], [157, 158, 68], [158, 67, 68], [19, 158, 20], [158, 157, 20], [158, 19, 18], [67, 158, 18], [99, 157, 68], [106, 99, 71], [99, 118, 71], [117, 67, 91], [117, 148, 90], [148, 117, 91], [67, 117, 68], [40, 152, 41], [76, 128, 64], [128, 83, 64], [83, 156, 4], [63, 156, 79], [156, 128, 79], [128, 156, 83], [57, 138, 58], [144, 57, 56], [138, 57, 144], [149, 138, 82], [138, 126, 58], [126, 149, 85], [149, 126, 138], [104, 76, 78], [104, 62, 76], [28, 27, 132], [28, 69, 29], [69, 28, 132], [69, 107, 142], [69, 30, 29], [30, 69, 142], [92, 69, 132], [69, 92, 107], [107, 92, 71], [92, 111, 71], [134, 25, 106], [111, 134, 106], [25, 134, 26], [27, 137, 132], [137, 92, 132], [92, 137, 111], [137, 27, 26], [134, 137, 26], [137, 134, 111], [86, 100, 155], [100, 34, 101], [112, 73, 155], [100, 112, 155], [112, 100, 101], [89, 112, 101], [112, 89, 73], [144, 159, 82], [105, 45, 44], [146, 45, 105], [66, 115, 121], [97, 115, 66], [80, 115, 74], [115, 80, 121], [115, 95, 74], [115, 97, 150], [95, 115, 150], [12, 11, 119], [11, 87, 119], [135, 96, 88], [80, 96, 135], [66, 81, 136], [109, 81, 66], [120, 9, 8], [87, 120, 84], [120, 93, 84], [120, 109, 93], [99, 133, 118], [133, 90, 65], [118, 133, 65], [133, 99, 68], [117, 133, 68], [133, 117, 90], [157, 129, 22], [99, 129, 157], [129, 23, 22], [129, 99, 106], [129, 106, 24], [23, 129, 24], [152, 39, 38], [40, 39, 152], [31, 30, 142], [89, 31, 142], [31, 89, 32], [151, 125, 63], [125, 156, 63], [156, 125, 4], [125, 5, 4], [125, 151, 5], [62, 145, 76], [128, 145, 79], [145, 128, 76], [75, 63, 79], [145, 75, 79], [75, 70, 63], [61, 145, 62], [75, 61, 60], [61, 75, 145], [104, 130, 62], [122, 147, 86], [147, 100, 86], [103, 105, 113], [147, 103, 113], [103, 147, 122], [103, 122, 74], [95, 103, 74], [35, 34, 100], [34, 33, 101], [33, 89, 101], [89, 33, 32], [73, 123, 108], [89, 123, 73], [123, 89, 142], [107, 123, 142], [108, 123, 107], [127, 149, 82], [159, 127, 82], [127, 159, 154], [146, 127, 154], [51, 159, 144], [143, 146, 105], [103, 143, 105], [143, 103, 95], [11, 10, 87], [10, 120, 87], [120, 10, 9], [102, 96, 80], [102, 86, 155], [73, 102, 155], [102, 122, 86], [102, 80, 74], [122, 102, 74], [116, 108, 65], [116, 73, 108], [116, 102, 73], [102, 116, 96], [131, 81, 109], [7, 131, 8], [131, 120, 8], [120, 131, 109], [98, 7, 6], [151, 98, 6], [98, 131, 7], [131, 98, 81], [98, 151, 136], [81, 98, 136], [75, 139, 70], [70, 139, 85], [139, 126, 85], [139, 75, 60], [147, 124, 100], [35, 124, 36], [124, 35, 100], [124, 37, 36], [124, 147, 113], [38, 124, 113], [37, 124, 38], [127, 72, 149], [97, 72, 150], [72, 97, 85], [149, 72, 85], [114, 127, 146], [143, 114, 146], [72, 114, 150], [114, 72, 127], [114, 95, 150], [114, 143, 95], [159, 50, 154], [51, 50, 159], [53, 52, 144], [52, 51, 144], [146, 47, 45], [47, 46, 45], [48, 47, 154], [47, 146, 154], [90, 77, 65], [77, 116, 65], [77, 148, 88], [148, 77, 90], [96, 77, 88], [116, 77, 96], [59, 139, 60], [126, 59, 58], [139, 59, 126], [49, 48, 154], [50, 49, 154]]};
  const W = 480, CX = 228, CY = 256;
  const M = MESH.p.length, TRI = MESH.t;
  const edgeSet = new Map();
  TRI.forEach(([a,b,c]) => [[a,b],[b,c],[c,a]].forEach(([i,j]) => { const k = i < j ? i+'_'+j : j+'_'+i; if (!edgeSet.has(k)) edgeSet.set(k, [Math.min(i,j), Math.max(i,j)]); }));
  const EDGES = [...edgeSet.values()], E = EDGES.length, F = TRI.length;

  // Vertices
  const local = new Float32Array(M*3), vpos = new Float32Array(M*3), from = new Float32Array(M*3), out = new Float32Array(M*3);
  const liveA = new Float32Array(M), wob = new Float32Array(M*2), phase = new Float32Array(M), delay = new Float32Array(M), vSize = new Float32Array(M), vAlpha = new Float32Array(M);
  for (let i = 0; i < M; i++) {
    const [px, py] = MESH.p[i];
    const z = 70 * Math.sqrt(Math.max(0, 1 - Math.pow((px - 240) / 190, 2))) * (.55 + rnd() * .45) * (py > 470 ? .6 : 1);
    local[i*3] = px - CX; local[i*3+1] = -(py - CY); local[i*3+2] = z;
    const neck = Math.min(1, Math.max(0, (600 - py) / 110));
    vAlpha[i] = (.7 + rnd() * .3) * neck;
    vSize[i] = 8 + rnd() * 6;
    phase[i] = rnd() * 6.28;
    from[i*3] = rnd(); from[i*3+1] = rnd(); from[i*3+2] = (rnd() - .5) * 3;
    wob[i*2] = (rnd() - .5) * 1.4; wob[i*2+1] = (rnd() - .5) * 1.2;
    delay[i] = rnd() * 2.2 + (px / W) * .7;
    out[i*3] = rnd(); out[i*3+1] = (rnd() - .5) * .35; out[i*3+2] = (1 - px / W) * 1.2 + rnd() * 1.0;
  }

  // Timeline (seconds)
  const SPEED = 1.3;
  const FLY = 4.2, ARRIVE = .3 + 2.9 + FLY;   // last dot lands
  const LINE_IN = .9, HOLD = 3.2, FOLD = 1.6, PAUSE = .5, OUT = 4.8;
  const arriveAt = i => .3 + delay[i] + FLY * .92;
  const MESH_DONE = ARRIVE + LINE_IN;
  const FOLD_AT = MESH_DONE + HOLD, OUT_AT = FOLD_AT + FOLD + PAUSE;
  const edgeLag = new Float32Array(E), edgeFold = new Float32Array(E);
  EDGES.forEach(([i,j], e) => { edgeLag[e] = rnd() * .35; edgeFold[e] = ((MESH.p[i][0] + MESH.p[j][0]) / 2 / W) * .7 + rnd() * .3; });

  const vert = 'attribute float aSize; attribute float aAlpha; attribute float aMix; uniform float uPR; uniform float uScale; varying float vA; varying float vM;' +
    'void main(){ vM = aMix; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;' +
    'gl_PointSize = aSize * uPR * uScale * (9.0 / -mv.z); vA = aAlpha; }';
  const fragDot = 'uniform vec3 uColor; uniform vec3 uColor2; uniform float uOpacity; varying float vA; varying float vM;' +
    'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.36, d);' +
    'gl_FragColor = vec4(mix(uColor, uColor2, vM), a * vA * uOpacity); }';
  const fragSoft = 'uniform vec3 uColor; uniform vec3 uColor2; uniform float uOpacity; varying float vA; varying float vM;' +
    'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); a *= a;' +
    'gl_FragColor = vec4(mix(uColor, uColor2, vM), a * vA * uOpacity); }';
  const vertFlat = 'attribute float aAlpha; attribute float aMix; varying float vA; varying float vM; void main(){ vM = aMix; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vA = aAlpha; }';
  const fragFlat = 'uniform vec3 uColor; uniform vec3 uColor2; uniform float uOpacity; varying float vA; varying float vM; void main(){ gl_FragColor = vec4(mix(uColor, uColor2, vM), vA * uOpacity); }';
  const mat = (v, f) => new THREE.ShaderMaterial({ vertexShader: v, fragmentShader: f, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color() }, uColor2: { value: new THREE.Color() }, uOpacity: { value: 1 }, uPR: { value: PR }, uScale: { value: 1 } } });

  // Facets (very faint fills), lines, dots
  const fPos = new Float32Array(F*9), fAlpha = new Float32Array(F*3), fShade = new Float32Array(F);
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3)); fGeo.setAttribute('aAlpha', new THREE.BufferAttribute(fAlpha, 1));
  const fMat = mat(vertFlat, fragFlat); const facets = new THREE.Mesh(fGeo, fMat); facets.frustumCulled = false; head.add(facets);
  const light = new THREE.Vector3(-.75, .35, .55).normalize();
  TRI.forEach(([a,b,c], f) => {
    const A = new THREE.Vector3(local[a*3], local[a*3+1], local[a*3+2]), B = new THREE.Vector3(local[b*3], local[b*3+1], local[b*3+2]), C = new THREE.Vector3(local[c*3], local[c*3+1], local[c*3+2]);
    const n = B.clone().sub(A).cross(C.clone().sub(A)).normalize(); if (n.z < 0) n.negate();
    fShade[f] = Math.max(0, n.dot(light));
  });
  const fMix = new Float32Array(F*3);
  for (let f = 0; f < F; f++) { const m = Math.min(1, Math.max(0, (fShade[f] - .45) / .4)) * .85 + (rnd() < .12 ? .5 : 0); fMix[f*3] = fMix[f*3+1] = fMix[f*3+2] = Math.min(1, m); }
  fGeo.setAttribute('aMix', new THREE.BufferAttribute(fMix, 1));
  const lPos = new Float32Array(E*6), lAlpha = new Float32Array(E*2);
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3)); lGeo.setAttribute('aAlpha', new THREE.BufferAttribute(lAlpha, 1)); lGeo.setAttribute('aMix', new THREE.BufferAttribute(new Float32Array(E*2).fill(.12), 1));
  const lMat = mat(vertFlat, fragFlat); const lines = new THREE.LineSegments(lGeo, lMat); lines.frustumCulled = false; head.add(lines);
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(vpos, 3)); dGeo.setAttribute('aSize', new THREE.BufferAttribute(vSize, 1)); dGeo.setAttribute('aAlpha', new THREE.BufferAttribute(liveA, 1));
  const dMix = new Float32Array(M); for (let i = 0; i < M; i++) dMix[i] = rnd() < .35 ? .8 + rnd() * .2 : rnd() * .15;
  dGeo.setAttribute('aMix', new THREE.BufferAttribute(dMix, 1));
  const dMat = mat(vert, fragDot); const dots = new THREE.Points(dGeo, dMat); dots.frustumCulled = false; head.add(dots);

  // Room dust
  const D = 500;
  const sBase = new Float32Array(D*3), sPos = new Float32Array(D*3), sPh = new Float32Array(D), sSize = new Float32Array(D), sAlpha = new Float32Array(D);
  for (let i = 0; i < D; i++) { sBase[i*3] = rnd(); sBase[i*3+1] = rnd(); sBase[i*3+2] = (rnd()-.5)*4; sPh[i] = rnd()*6.28; sSize[i] = 3 + rnd()*6; sAlpha[i] = .06 + rnd()*.14; }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1)); sGeo.setAttribute('aAlpha', new THREE.BufferAttribute(sAlpha, 1));
  const sMix = new Float32Array(D); for (let i = 0; i < D; i++) sMix[i] = rnd() < .4 ? 1 : 0;
  sGeo.setAttribute('aMix', new THREE.BufferAttribute(sMix, 1));
  const sMat = mat(vert, fragSoft); const dust = new THREE.Points(sGeo, sMat); dust.frustumCulled = false; room.add(dust);

  let VW = VH, s = .01, narrow = false, base = 1;
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    VW = VH * camera.aspect; narrow = w < 960;
    s = Math.min(.74 * VH / 404, (narrow ? 1.05 : .5) * VW / 316);
    const fx = narrow ? .74 : .73;
    head.position.set(VW * (fx - .5) + (CX - 70) * s, VH * .44 - (CY - 54) * s, 0);
    head.scale.setScalar(s);
    dMat.uniforms.uScale.value = sMat.uniforms.uScale.value = Math.max(.8, Math.min(1.25, w / 1200));
    base = narrow ? .4 : 1;
    sMat.uniforms.uOpacity.value = narrow ? .6 : 1;
    if (reduce) requestAnimationFrame(frame);
  }
  function applyTheme() {
    const cs = getComputedStyle(document.documentElement);
    const acc = cs.getPropertyValue('--accent').trim() || '#0E6656', mut = cs.getPropertyValue('--muted').trim() || '#5A646B';
    dMat.uniforms.uColor.value.set(acc); lMat.uniforms.uColor.value.set(acc); fMat.uniforms.uColor.value.set(acc);
    sMat.uniforms.uColor.value.set(mut);
    const warm = cs.getPropertyValue('--warm').trim() || '#C08A2E';
    [dMat, lMat, fMat, sMat].forEach(m => m.uniforms.uColor2.value.set(warm));
    if (reduce) requestAnimationFrame(frame);
  }

  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const clamp = t => Math.min(1, Math.max(0, t));
  let t0 = performance.now(), visible = true;

  function frame(now) {
    if (!stage.isConnected) return;
    const secs = (now - t0) / 1000;
    const T = reduce ? FOLD_AT + FOLD + 1 : secs * SPEED;   // timeline runs a little faster than real time
    const tm = reduce ? 0 : secs;
    const hx = head.position.x, hy = head.position.y;
    const formed = clamp((T - ARRIVE + 1) / 2);
    for (let i = 0; i < M; i++) {
      const k = ease(clamp((T - .3 - delay[i]) / FLY));
      const q = 0;   // the dots stay; they no longer drift off
      // Dots start out partly transparent, reach full strength as they land, then soften once the face has formed.
      const soften = 1 - .55 * ease(clamp((T - MESH_DONE - .3) / 1.6));
      liveA[i] = vAlpha[i] * (.18 + .82 * k * k) * soften;
      const tx = local[i*3]   + Math.sin(tm*.8 + phase[i]) * 1.6 * formed;
      const ty = local[i*3+1] + Math.cos(tm*.7 + phase[i]) * 1.6 * formed;
      const tz = local[i*3+2] + Math.sin(tm*.6 + phase[i]) * 2 * formed;
      if (q > 0) {
        if (q >= 1) { vpos[i*3] = 1e5; continue; }
        const ex = (VW/2 + .8 + out[i*3] * VW * .35 - hx) / s, ey = ty + out[i*3+1] * VH / s, ez = tz + wob[i*2+1] * 2 / s;
        const arc = Math.sin(q * Math.PI);
        vpos[i*3] = tx + (ex - tx) * q; vpos[i*3+1] = ty + (ey - ty) * q + arc * wob[i*2] * .6 / s; vpos[i*3+2] = tz + (ez - tz) * q;
        continue;
      }
      if (k >= 1) { vpos[i*3] = tx; vpos[i*3+1] = ty; vpos[i*3+2] = tz; continue; }
      const wx = -VW/2 - .8 - from[i*3] * VW * .35, wy = (from[i*3+1] - .5) * VH * 1.1, wz = from[i*3+2];
      const sx = (wx - hx) / s, sy = (wy - hy) / s, sz = wz / s, arc = Math.sin(k * Math.PI);
      vpos[i*3] = sx + (tx - sx) * k; vpos[i*3+1] = sy + (ty - sy) * k + arc * wob[i*2] / s; vpos[i*3+2] = sz + (tz - sz) * k + arc * wob[i*2+1] / s;
    }
    dGeo.attributes.position.needsUpdate = true; dGeo.attributes.aAlpha.needsUpdate = true;

    // Lines: grow from one dot to the next once both have landed, then shrink to their midpoints and fade.
    for (let e = 0; e < E; e++) {
      const [i, j] = EDGES[e];
      const grow = ease(clamp((T - Math.max(arriveAt(i), arriveAt(j)) - edgeLag[e]) / LINE_IN));
      const fold = 0;   // the lines stay once they have drawn in
      const ax = vpos[i*3], ay = vpos[i*3+1], az = vpos[i*3+2], bx = vpos[j*3], by = vpos[j*3+1], bz = vpos[j*3+2];
      const mx = (ax + bx) / 2, my = (ay + by) / 2, mz = (az + bz) / 2;
      // during growth: from a toward b. during fold: both ends toward the middle.
      let x0 = ax, y0 = ay, z0 = az, x1 = ax + (bx - ax) * grow, y1 = ay + (by - ay) * grow, z1 = az + (bz - az) * grow;
      if (fold > 0) { x0 = ax + (mx - ax) * fold; y0 = ay + (my - ay) * fold; z0 = az + (mz - az) * fold; x1 = bx + (mx - bx) * fold; y1 = by + (my - by) * fold; z1 = bz + (mz - bz) * fold; }
      lPos[e*6] = x0; lPos[e*6+1] = y0; lPos[e*6+2] = z0; lPos[e*6+3] = x1; lPos[e*6+4] = y1; lPos[e*6+5] = z1;
      const a = .5 * grow * (1 - fold) * Math.min(vAlpha[i], vAlpha[j]);
      lAlpha[e*2] = a; lAlpha[e*2+1] = a;
    }
    lGeo.attributes.position.needsUpdate = true; lGeo.attributes.aAlpha.needsUpdate = true;

    // Facets: a faint, lit fill that comes in with the mesh and leaves with the lines.
    const facetIn = ease(clamp((T - ARRIVE - .2) / 1.2));
    for (let f = 0; f < F; f++) {
      const [a, b, c] = TRI[f];
      for (let v = 0; v < 3; v++) { const id = [a,b,c][v]; fPos[f*9+v*3] = vpos[id*3]; fPos[f*9+v*3+1] = vpos[id*3+1]; fPos[f*9+v*3+2] = vpos[id*3+2]; }
      const al = (.03 + .16 * fShade[f]) * facetIn * Math.min(vAlpha[a], vAlpha[b], vAlpha[c]);
      fAlpha[f*3] = fAlpha[f*3+1] = fAlpha[f*3+2] = al;
    }
    fGeo.attributes.position.needsUpdate = true; fGeo.attributes.aAlpha.needsUpdate = true;

    for (let i = 0; i < D; i++) {
      sPos[i*3] = (sBase[i*3] - .5) * VW * 1.05 + Math.sin(tm*.07 + sPh[i]) * .5;
      sPos[i*3+1] = (sBase[i*3+1] - .5) * VH * 1.05 + Math.cos(tm*.06 + sPh[i]) * .35;
      sPos[i*3+2] = sBase[i*3+2];
    }
    sGeo.attributes.position.needsUpdate = true;
    dMat.uniforms.uOpacity.value = lMat.uniforms.uOpacity.value = fMat.uniforms.uOpacity.value = base;
    const settled = ease(clamp((T - ARRIVE + 2) / 4));
    head.rotation.y = -.12 + Math.sin(tm * .12) * .07 * settled;
    head.scale.setScalar(s * (1 + Math.sin(tm * .5) * .006 * settled));
    renderer.render(scene, camera);
    if (visible && !reduce) requestAnimationFrame(frame);
  }

  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new ResizeObserver(layout).observe(stage); layout();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting; if (visible && !was && !reduce) { t0 = performance.now(); requestAnimationFrame(frame); } }).observe(stage);
  }
  requestAnimationFrame(frame);
})();

/* Case-study video: plays only when asked, with play/pause, replay and a seek bar */
(() => {
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  document.querySelectorAll('.vid').forEach(box => {
    const v = box.querySelector('video'), big = box.querySelector('.vid-big'), play = box.querySelector('.vid-play'),
          replay = box.querySelector('.vid-replay'), seek = box.querySelector('.vid-seek'), time = box.querySelector('.vid-time');
    let dragging = false;
    const toggle = () => { if (v.paused || v.ended) v.play().catch(() => {}); else v.pause(); };
    const sync = () => { const on = !v.paused && !v.ended; box.classList.toggle('playing', on); play.setAttribute('aria-label', on ? 'Pause' : 'Play'); };
    const progress = () => {
      const d = v.duration || 0, p = d ? v.currentTime / d : 0;
      if (!dragging) seek.value = Math.round(p * 1000);
      seek.style.setProperty('--p', (seek.value / 10) + '%');
      seek.setAttribute('aria-valuetext', fmt(v.currentTime) + ' of ' + fmt(d));
      time.textContent = fmt(v.currentTime) + ' / ' + fmt(d);
    };
    v.addEventListener('play', () => { box.classList.add('started'); sync(); });
    ['pause', 'ended'].forEach(e => v.addEventListener(e, sync));
    ['timeupdate', 'loadedmetadata', 'seeked'].forEach(e => v.addEventListener(e, progress));
    big.addEventListener('click', toggle); play.addEventListener('click', toggle); v.addEventListener('click', toggle);
    replay.addEventListener('click', () => { v.currentTime = 0; v.play().catch(() => {}); });
    seek.addEventListener('input', () => { dragging = true; if (v.duration) v.currentTime = seek.value / 1000 * v.duration; seek.style.setProperty('--p', (seek.value / 10) + '%'); box.classList.add('started'); });
    seek.addEventListener('change', () => { dragging = false; });
    // Step chapters below the video: readable on any screen, and a quick way to jump in
    const fig = box.closest('figure'), chaps = fig ? [...fig.querySelectorAll('.vid-chapters button')] : [];
    chaps.forEach(b => b.addEventListener('click', () => { v.currentTime = parseFloat(b.dataset.t); box.classList.add('started'); v.play().catch(() => {}); }));
    const mark = () => { let on = 0; chaps.forEach((b, i) => { if (v.currentTime + .05 >= parseFloat(b.dataset.t)) on = i; }); chaps.forEach((b, i) => { b.classList.toggle('on', box.classList.contains('started') && i === on); b.setAttribute('aria-current', box.classList.contains('started') && i === on ? 'step' : 'false'); }); };
    ['timeupdate', 'seeked', 'play'].forEach(e => v.addEventListener(e, mark));
    // Full screen, so the interface in the recording is legible on a phone
    const full = box.querySelector('.vid-full');
    if (full) {
      const can = v.requestFullscreen || v.webkitRequestFullscreen || v.webkitEnterFullscreen;
      if (!can) full.hidden = true;
      full.addEventListener('click', () => {
        const go = v.requestFullscreen ? v.requestFullscreen() : v.webkitRequestFullscreen ? v.webkitRequestFullscreen() : v.webkitEnterFullscreen && v.webkitEnterFullscreen();
        Promise.resolve(go).then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {});
        box.classList.add('started'); if (v.paused) v.play().catch(() => {});
      });
    }
    // Pause if the viewer scrolls away mid-play
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }, { threshold: 0 }).observe(box);
  });
})();

/* Private theme toggle: only appears once a theme has been pinned with ?theme=dark or ?theme=light */
(() => {
  let t; try { t = localStorage.getItem('tw-theme'); } catch (e) {}
  if (!t) return;
  const root = document.documentElement, bar = document.createElement('div');
  bar.className = 'theme-pin';
  bar.innerHTML = '<button type="button" class="tp-toggle"></button><button type="button" class="tp-clear" aria-label="Stop pinning a theme">×</button>';
  const btn = bar.querySelector('.tp-toggle');
  const show = () => { btn.textContent = (root.getAttribute('data-theme') === 'dark' ? 'Dark' : 'Light') + ' mode'; };
  btn.addEventListener('click', () => { const n = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; root.setAttribute('data-theme', n); try { localStorage.setItem('tw-theme', n); } catch (e) {} show(); });
  bar.querySelector('.tp-clear').addEventListener('click', () => { try { localStorage.removeItem('tw-theme'); } catch (e) {} root.removeAttribute('data-theme'); bar.remove(); });
  show(); document.body.appendChild(bar);
})();

/* Visit counts (GoatCounter): video plays and case-study carousel opens */
(() => {
  const gc = (path, title) => { try { window.goatcounter && window.goatcounter.count && window.goatcounter.count({ path, title, event: true }); } catch (e) {} };
  const v = document.querySelector('.vid video'); let sent = false;
  if (v) v.addEventListener('play', () => { if (!sent) { sent = true; gc('video-play', 'Played the visualization video'); } });
  const seen = new Set();
  document.querySelectorAll('.case').forEach(c => c.querySelectorAll('.car-btn, .car-slide').forEach(el => el.addEventListener('click', () => {
    if (seen.has(c.id)) return; seen.add(c.id); gc('carousel-' + c.id, 'Browsed the ' + c.id + ' carousel');
  })));
})();
