document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Clients: accordion on phones, open grid elsewhere ---------- */
(function(){
  const groups = [...document.querySelectorAll('.client-group')];
  const mq = matchMedia('(max-width:640px)');
  const btn = document.getElementById('toggle-all');
  if (!btn) return;
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
      const sum = g.querySelector('summary');
      sum.tabIndex = mq.matches ? 0 : -1;
      // On larger screens the groups stay open, so the toggle is reported as unavailable
      if (mq.matches) sum.removeAttribute('aria-disabled'); else sum.setAttribute('aria-disabled', 'true');
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
    box.addEventListener('close', () => {
      box.classList.remove('zoomed', 'can-zoom');
      setTimeout(() => {
        const f = document.activeElement;
        if (f && f.classList.contains('car-slide') && f.getAttribute('aria-hidden') === 'true') f.closest('.carousel').querySelector('.car-slide.is-active')?.focus({ preventScroll: true });
      });
    });
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
  let carUid = 0;
  document.querySelectorAll('.carousel').forEach(root => {
    const slides = [...root.querySelectorAll('.car-slide')], n = slides.length;
    const count = root.querySelector('.car-count'), title = root.querySelector('.car-title'), desc = root.querySelector('.car-desc');
    const stage = root.querySelector('.car-stage');
    const narrow = matchMedia('(max-width:640px)');
    let index = 0;
    const flat = () => narrow.matches;
    // The button's name stays short; the image's full alt text is read as its description
    slides.forEach(el => { const img = el.querySelector('img'); if (!img.id) img.id = 'car-img-' + (++carUid); el.setAttribute('aria-describedby', img.id); });
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
          el.setAttribute('aria-label', 'Enlarge: ' + el.dataset.title);
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
        if (a) el.removeAttribute('aria-label'); else el.setAttribute('aria-label', 'Enlarge: ' + el.dataset.title);
      });
      caption();
    }
    const go = i => {
      const hadFocus = slides.includes(document.activeElement);
      index = (i + n) % n;
      if (flat()) { stage.scrollTo({ left: slides[index].offsetLeft - parseFloat(getComputedStyle(stage).paddingLeft), behavior: reduce ? 'auto' : 'smooth' }); slides.forEach((el, k) => el.classList.toggle('is-active', k === index)); caption(); }
      else render();
      if (hadFocus) slides[index].focus({ preventScroll: true });   // focus moves with the slide in front
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
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (flat() || i === index) ? open(i) : go(i); } });
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

/* Case-study video: plays only when asked, with play/pause, replay and a seek bar.
   initVid also wires players added later, such as the homepage teasers that turn into video. */
const initVid = (() => {
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const init = box => {
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
    // Sound: mute toggle and volume slider (phones set volume with their own buttons, so they get mute only)
    const mute = box.querySelector('.vid-mute'), vol = box.querySelector('.vid-volume');
    if (mute) {
      const syncAudio = () => {
        const off = v.muted || v.volume === 0;
        box.classList.toggle('muted', off);
        mute.setAttribute('aria-pressed', off ? 'true' : 'false'); mute.setAttribute('aria-label', off ? 'Unmute' : 'Mute');
        if (vol) { vol.value = off ? 0 : v.volume; vol.style.setProperty('--p', (vol.value * 100) + '%'); vol.setAttribute('aria-valuetext', Math.round(vol.value * 100) + '%'); }
      };
      mute.addEventListener('click', () => { if (v.muted || v.volume === 0) { v.muted = false; if (v.volume === 0) v.volume = 1; } else v.muted = true; });
      if (vol) vol.addEventListener('input', () => { v.volume = +vol.value; v.muted = +vol.value === 0; });
      v.addEventListener('volumechange', syncAudio); syncAudio();
    }
    // Captions on by default, with a toggle in the bar
    const cc = box.querySelector('.vid-cc'), tr = v.textTracks && v.textTracks[0];
    if (cc) {
      if (!tr) cc.hidden = true;
      else {
        const setCC = on => { tr.mode = on ? 'showing' : 'hidden'; cc.setAttribute('aria-pressed', on ? 'true' : 'false'); };
        setCC(true); cc.addEventListener('click', () => setCC(tr.mode !== 'showing'));
      }
    }
    // Controls sit inside the frame: shown when paused, on pointer movement, touch or keyboard focus; fade after a few idle seconds of play
    let idleTimer = 0, lastTouch = 0;
    const bar = box.querySelector('.vid-bar');
    const kbd = () => { const a = document.activeElement; try { return box.contains(a) && a.matches(':focus-visible'); } catch (e) { return false; } };
    const lift = up => { const t = v.textTracks && v.textTracks[0]; if (!t || !t.cues) return; [...t.cues].forEach(c => { try { c.line = up ? -4 : 'auto'; } catch (e) {} }); };
    const show = () => {
      box.classList.remove('idle'); lift(true); clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (!v.paused && !v.ended && !kbd() && !dragging) { box.classList.add('idle'); lift(false); } }, 2600);
    };
    ['pointermove', 'pointerdown', 'keydown', 'focusin'].forEach(e => box.addEventListener(e, show));
    box.addEventListener('pointerleave', () => { if (!v.paused && !v.ended) { clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!kbd()) { box.classList.add('idle'); lift(false); } }, 700); } });
    box.addEventListener('focusout', () => setTimeout(show, 0));
    v.addEventListener('play', show); ['pause', 'ended'].forEach(e => v.addEventListener(e, () => { clearTimeout(idleTimer); box.classList.remove('idle'); lift(true); }));
    v.addEventListener('loadedmetadata', () => lift(!box.classList.contains('idle')));
    if (v.textTracks && v.textTracks[0]) v.textTracks[0].addEventListener('cuechange', () => lift(!box.classList.contains('idle')));
    // On touch, a tap on the picture while the controls are hidden brings them back instead of pausing
    v.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && box.classList.contains('idle')) lastTouch = Date.now(); }, true);
    v.addEventListener('click', e => { if (Date.now() - lastTouch < 600) { e.stopImmediatePropagation(); show(); } }, true);
    // Scrolling away mid-play: narrated walkthroughs (.wide) shrink into a mini player in the corner and keep playing;
    // other videos pause. Scrolling back, or the return button, puts the player back in place.
    if ('IntersectionObserver' in window) {
      if (!box.classList.contains('wide')) {
        new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }, { threshold: 0 }).observe(box);
      } else {
        const slot = document.createElement('div'); slot.className = 'vid-slot';
        box.parentNode.insertBefore(slot, box); slot.appendChild(box);
        const mk = (cls, label, path) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'vid-ctl vid-dockctl ' + cls; b.setAttribute('aria-label', label);
          b.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + path + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; bar.appendChild(b); return b; };
        const back = mk('vid-return', 'Return the video to the page', 'M9.5 2.5h4v4M13.5 2.5 8.5 7.5M6.5 13.5h-4v-4M2.5 13.5l5-5');
        const close = mk('vid-close', 'Stop and close the mini player', 'M4 4l8 8M12 4l-8 8');
        let docked = false, inView = true, ccWas = null;
        const track = v.textTracks && v.textTracks[0];
        const fs = () => document.fullscreenElement || document.webkitFullscreenElement;
        const dock = () => {
          if (docked || fs()) return; docked = true;
          slot.style.height = slot.offsetHeight + 'px'; box.classList.add('docked');
          if (track) { ccWas = track.mode; track.mode = 'hidden'; } // too small to read in the corner
          document.body.classList.add('has-mini'); document.body.style.setProperty('--mini-h', box.offsetHeight + 'px'); show();
        };
        const undock = () => {
          if (!docked) return; docked = false;
          box.classList.remove('docked'); slot.style.height = '';
          if (track && ccWas) { track.mode = ccWas; ccWas = null; } document.body.classList.remove('has-mini'); show();
        };
        new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) undock(); else if (!v.paused && !v.ended) dock(); }, { threshold: 0 }).observe(slot);
        v.addEventListener('play', () => { if (!inView) dock(); });
        v.addEventListener('ended', undock);
        back.addEventListener('click', () => { undock(); slot.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
        close.addEventListener('click', () => { v.pause(); undock(); });
      }
    }
  };
  document.querySelectorAll('.vid').forEach(init);
  return init;
})();

/* Homepage teasers: the play button swaps the thumbnail for the video, in place, and starts it */
document.querySelectorAll('.tz-play').forEach(btn => btn.addEventListener('click', () => {
  const tz = btn.closest('.case-teaser'), tpl = tz && tz.querySelector('template');
  if (!tpl) return;
  const fig = tpl.content.firstElementChild.cloneNode(true);
  tz.replaceWith(fig);
  const box = fig.querySelector('.vid'), v = box.querySelector('video');
  initVid(box);
  box.classList.add('started');
  v.play().catch(() => box.classList.remove('started'));
  const ctl = box.querySelector('.vid-play'); if (ctl) ctl.focus({ preventScroll: true });
}));

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
  document.querySelectorAll('.vid').forEach(box => {
    const v = box.querySelector('video'); let sent = false;
    // the visualization video keeps its original event name so earlier counts still line up
    const path = box.dataset.gc || 'video-play', title = box.dataset.gcTitle || 'Played the visualization video';
    if (v) v.addEventListener('play', () => { if (!sent) { sent = true; gc(path, title); } });
  });
  const seen = new Set();
  document.querySelectorAll('.case').forEach(c => c.querySelectorAll('.car-btn, .car-slide').forEach(el => el.addEventListener('click', () => {
    if (seen.has(c.id)) return; seen.add(c.id); gc('carousel-' + c.id, 'Browsed the ' + c.id + ' carousel');
  })));
})();

/* ---------- Case media switch: tabs between the walkthrough video and the screens ---------- */
document.querySelectorAll('.mswitch').forEach(sw => {
  const tabs = [...sw.querySelectorAll('[role="tab"]')];
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab, panel = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
      if (!on) panel.querySelectorAll('video').forEach(v => v.pause());
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
    });
  });
});


/* ---------- Narrow screens: only the nav row stays pinned ---------- */
/* The header is sticky with a negative offset equal to the name row, so the name scrolls away
   with the page and the nav row pins at the top. Measured here because the name can wrap. */
(function(){
  const top = document.querySelector('.top'), nav = top?.querySelector('nav');
  if (!top || !nav) return;
  const root = document.documentElement.style;
  const measure = () => {
    const hide = nav.offsetTop - top.offsetTop;
    root.setProperty('--top-hide', hide + 'px');
    root.setProperty('--top-pin', (top.offsetHeight - hide) + 'px');
  };
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(top);
  measure();
})();

/* ---------- Copy email: icon buttons with a visible "Copied" note ---------- */
document.querySelectorAll('[data-copy-email]').forEach(btn => {
  const note = btn.nextElementSibling;
  let t;
  const show = (msg, ok) => {
    clearTimeout(t);
    btn.classList.toggle('copied', ok);
    if (note) note.textContent = msg;
    t = setTimeout(() => { btn.classList.remove('copied'); if (note) note.textContent = ''; }, ok ? 2200 : 6000);
  };
  btn.addEventListener('click', () => {
    const text = btn.dataset.copyEmail;
    const fail = () => show('Press Ctrl+C or ⌘C to copy', false);
    try { navigator.clipboard.writeText(text).then(() => show('Copied', true), fail); }
    catch (e) { fail(); }
  });
});
