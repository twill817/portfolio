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

/* ---------- Hero background: particles drift in from the left and settle into a human profile ---------- */
(function hero(){
  const stage = document.getElementById('stage');
  if (!window.THREE) { document.documentElement.classList.add('no-webgl'); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) { document.documentElement.classList.add('no-webgl'); return; }
  const PR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(PR);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  const VH = 2 * 9 * Math.tan(THREE.MathUtils.degToRad(18));   // visible height at the head's depth
  const head = new THREE.Group(); scene.add(head);
  const room = new THREE.Group(); scene.add(room);

  let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // Head silhouette (facing left), in a 480 x 600 drawing space.
  const P = [352,600,351,591,350,579,348,564,347,549,345,534,344,520,343,508,342,496,341,484,340,473,339,462,338,452,337,442,337,433,336,424,336,416,336,408,336,400,336,392,337,385,338,378,339,370,340,363,342,356,345,349,348,342,351,334,355,327,359,320,362,312,365,304,369,296,372,288,375,279,378,271,380,262,382,253,383,244,385,234,386,225,386,215,386,206,385,197,384,187,383,177,381,168,379,159,376,150,373,142,369,133,365,126,361,118,356,111,350,104,344,97,337,91,330,85,322,80,314,74,306,70,297,66,288,63,279,60,269,57,259,55,250,54,241,53,232,53,222,54,213,55,205,56,196,58,188,60,180,63,172,66,164,70,157,74,150,78,144,83,138,88,132,94,127,100,122,106,118,112,115,118,112,125,109,132,107,139,106,145,104,152,103,159,102,165,101,172,101,178,100,184,100,190,100,195,100,199,100,203,101,207,101,210,102,214,103,218,105,222,106,226,108,229,109,233,110,236,110,238,109,240,108,242,107,244,105,246,104,248,103,251,102,254,100,257,99,261,98,264,96,268,94,272,92,276,90,280,88,284,86,288,84,292,82,296,80,300,77,304,75,307,73,311,72,314,71,317,70,319,70,321,69,323,70,324,70,326,71,328,72,329,74,330,76,332,78,333,80,334,82,335,85,335,88,336,90,336,92,337,94,338,95,339,96,341,96,343,96,344,96,346,96,348,96,350,95,351,94,353,93,355,92,356,92,358,92,359,93,361,94,362,94,364,95,365,96,366,97,367,98,368,99,369,99,370,100,371,100,372,99,373,98,374,97,376,96,377,95,378,94,380,94,382,95,384,95,386,96,388,97,390,98,392,99,393,100,394,102,395,103,395,104,396,104,398,104,400,103,403,102,405,101,408,100,411,100,414,100,417,100,420,100,423,101,426,101,429,102,432,103,435,104,437,106,440,107,442,110,444,112,446,115,448,118,449,121,451,125,452,129,453,134,454,139,455,145,455,152,456,158,456,164,457,170,458,175,459,181,461,186,462,190,464,194,467,198,470,201,473,203,476,204,480,206,484,207,491,208,500,209,514,210,532,211,552,211,571,212,588,212,600];
  const W = 480, H = 600, CX = 228, CY = 256;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c2 = cv.getContext('2d'); c2.beginPath(); c2.moveTo(P[0], P[1]);
  for (let i = 2; i < P.length; i += 2) c2.lineTo(P[i], P[i+1]);
  c2.closePath(); c2.fill();
  const img = c2.getImageData(0, 0, W, H).data;
  const inside = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (img[(y*W + x)*4 + 3] > 128) inside.push(x, y);

  // Face particles: even fill, no outline. Light falls from the front of the face; depth follows a rounded skull.
  const N = 9500;
  const local = new Float32Array(N*3), pos = new Float32Array(N*3), from = new Float32Array(N*3);
  const out = new Float32Array(N*3), wob = new Float32Array(N*2), phase = new Float32Array(N), delay = new Float32Array(N), size = new Float32Array(N), alpha = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const j = Math.floor(rnd() * inside.length / 2) * 2;
    const px = inside[j] + rnd()*2, py = inside[j+1] + rnd()*2;
    // Distance to the silhouette edge, so light can catch the profile softly (no drawn outline).
    let dist = 30;
    for (let r = 3; r <= 30 && dist === 30; r += 3) for (let a = 0; a < 12; a++) {
      const qx = Math.round(px + Math.cos(a * .5236) * r), qy = Math.round(py + Math.sin(a * .5236) * r);
      if (qx < 0 || qy < 0 || qx >= W || qy >= H || img[(qy*W + qx)*4 + 3] <= 128) { dist = r; break; }
    }
    const rim = Math.pow(1 - dist / 30, 1.6);
    const depth = 38 * Math.sqrt(Math.max(0, 1 - Math.pow((px - 240) / 175, 2))) * (py > 470 ? .55 : 1);
    local[i*3] = px - CX; local[i*3+1] = -(py - CY); local[i*3+2] = (rnd()*2 - 1) * depth;
    const front = Math.max(0, 1 - (px - 70) / 330);
    const neck = Math.min(1, Math.max(0, (600 - py) / 95));
    alpha[i] = Math.min(1, (.2 + .38 * Math.pow(front, 1.2)) * (.75 + rnd()*.25) * (1 + rim * (1.2 + 1.8 * front))) * neck;
    size[i] = 2.4 + rnd() * 2.8;
    phase[i] = rnd() * 6.28;
    from[i*3] = rnd(); from[i*3+1] = rnd(); from[i*3+2] = (rnd()-.5) * 3;   // normalized start: left of screen, any height
    wob[i*2] = (rnd()-.5) * 1.4; wob[i*2+1] = (rnd()-.5) * 1.2;
    delay[i] = rnd() * 2.6 + (px / W) * .8;
    // Leaving: the back of the head lets go first, and everything drifts off to the right.
    out[i*3] = rnd(); out[i*3+1] = (rnd()-.5) * .35; out[i*3+2] = (1 - px / W) * 1.3 + rnd() * 1.1;
  }

  // Room dust: quiet complexity that stays in the background.
  const D = 900;
  const dBase = new Float32Array(D*3), dPos = new Float32Array(D*3), dPh = new Float32Array(D), dSize = new Float32Array(D), dAlpha = new Float32Array(D);
  for (let i = 0; i < D; i++) { dBase[i*3] = rnd(); dBase[i*3+1] = rnd(); dBase[i*3+2] = (rnd()-.5)*4; dPh[i] = rnd()*6.28; dSize[i] = 3 + rnd()*6; dAlpha[i] = .06 + rnd()*.16; }

  const vert = 'attribute float aSize; attribute float aAlpha; uniform float uPR; uniform float uScale; varying float vA;' +
    'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;' +
    'gl_PointSize = aSize * uPR * uScale * (9.0 / -mv.z); vA = aAlpha; }';
  const frag = 'uniform vec3 uColor; uniform float uOpacity; varying float vA;' +
    'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); a *= a;' +
    'gl_FragColor = vec4(uColor, a * vA * uOpacity); }';
  const makePoints = (parent, posArr, sizeArr, alphaArr) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizeArr, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alphaArr, 1));
    const m = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color() }, uOpacity: { value: 1 }, uPR: { value: PR }, uScale: { value: 1 } } });
    const p = new THREE.Points(g, m); p.frustumCulled = false; parent.add(p); return { g, m };
  };
  const dust = makePoints(room, dPos, dSize, dAlpha);
  const face = makePoints(head, pos, size, alpha);

  // Layout: the head sits toward the right and runs off the edge; smaller screens get a quieter version.
  let VW = VH, s = .01, narrow = false;
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    VW = VH * camera.aspect; narrow = w < 960;
    s = Math.min(.74 * VH / 404, (narrow ? 1.05 : .5) * VW / 316);
    const fx = narrow ? .74 : .73;   // where the front of the face lands, as a share of the width
    head.position.set(VW * (fx - .5) + (CX - 70) * s, VH * .44 - (CY - 54) * s, 0);
    head.scale.setScalar(s);
    face.m.uniforms.uScale.value = dust.m.uniforms.uScale.value = Math.max(.8, Math.min(1.25, w / 1200));
    face.m.uniforms.uOpacity.value = narrow ? .4 : 1;
    dust.m.uniforms.uOpacity.value = narrow ? .6 : 1;
    if (reduce) requestAnimationFrame(frame);
  }

  function applyTheme() {
    const cs = getComputedStyle(document.documentElement);
    face.m.uniforms.uColor.value.set(cs.getPropertyValue('--accent').trim() || '#0E6656');
    dust.m.uniforms.uColor.value.set(cs.getPropertyValue('--muted').trim() || '#5A646B');
    if (reduce) requestAnimationFrame(frame);
  }

  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  let t0 = performance.now();
  const FLY = 5.2, FORMED = .3 + 3.4 + FLY, HOLD = 3.5, OUT = 4.8;
  let visible = true;

  function frame(now) {
    const T = reduce ? FORMED : (now - t0) / 1000;
    const tm = reduce ? 0 : T;
    const hx = head.position.x, hy = head.position.y;
    const live = reduce ? 0 : 1;
    for (let i = 0; i < N; i++) {
      const k = ease(Math.min(1, Math.max(0, (T - .3 - delay[i]) / FLY)));
      const q = ease(Math.min(1, Math.max(0, (T - FORMED - HOLD - out[i*3+2]) / OUT)));
      // Formed: a slow, subtle shimmer, with a soft wave moving down the face.
      const wave = Math.sin(tm * 1.1 - local[i*3+1] * .025) * .9;
      const tx = local[i*3]   + (Math.sin(tm*.8 + phase[i]) * 1.4 + wave) * live;
      const ty = local[i*3+1] + Math.cos(tm*.7 + phase[i]) * 1.4 * live;
      const tz = local[i*3+2] + Math.sin(tm*.6 + phase[i]) * 2 * live;
      if (q > 0) {
        if (q >= 1) { pos[i*3] = 1e5; continue; }   // gone off to the right
        const ex = (VW/2 + .6 + out[i*3] * VW * .35 - hx) / s, ey = ty + out[i*3+1] * VH / s, ez = tz + wob[i*2+1] * 2 / s;
        const arc = Math.sin(q * Math.PI);
        pos[i*3]   = tx + (ex - tx) * q;
        pos[i*3+1] = ty + (ey - ty) * q + arc * wob[i*2] * .6 / s;
        pos[i*3+2] = tz + (ez - tz) * q;
        continue;
      }
      if (k >= 1) { pos[i*3] = tx; pos[i*3+1] = ty; pos[i*3+2] = tz; continue; }
      // Arriving: start just past the left edge of the screen, at any height, expressed in the head's local space.
      const wx = -VW/2 - .6 - from[i*3] * VW * .35, wy = (from[i*3+1] - .5) * VH * 1.1, wz = from[i*3+2];
      const sx = (wx - hx) / s, sy = (wy - hy) / s, sz = wz / s;
      const arc = Math.sin(k * Math.PI);
      pos[i*3]   = sx + (tx - sx) * k;
      pos[i*3+1] = sy + (ty - sy) * k + arc * wob[i*2]   / s;
      pos[i*3+2] = sz + (tz - sz) * k + arc * wob[i*2+1] / s;
    }
    face.g.attributes.position.needsUpdate = true;
    for (let i = 0; i < D; i++) {
      dPos[i*3]   = (dBase[i*3] - .5) * VW * 1.05 + Math.sin(tm*.07 + dPh[i]) * .5;
      dPos[i*3+1] = (dBase[i*3+1] - .5) * VH * 1.05 + Math.cos(tm*.06 + dPh[i]) * .35;
      dPos[i*3+2] = dBase[i*3+2];
    }
    dust.g.attributes.position.needsUpdate = true;
    const settled = ease(Math.min(1, Math.max(0, (T - 4) / 4)));
    head.rotation.y = Math.sin(tm * .1) * .03 * settled;
    head.scale.setScalar(s * (1 + Math.sin(tm * .5) * .006 * settled));
    renderer.render(scene, camera);
    if (visible && !reduce) requestAnimationFrame(frame);
  }

  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new ResizeObserver(layout).observe(stage); layout();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      const was = visible; visible = e.isIntersecting;
      // Coming back into view replays the arrival from the left.
      if (visible && !was && !reduce) { t0 = performance.now(); requestAnimationFrame(frame); }
    }).observe(stage);
  }
  requestAnimationFrame(frame);
})();
