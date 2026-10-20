/* Review mode: private, pin-style feedback comments for invited reviewers.
   Loaded only when a review code is present (see the loader in index.html).
   Comments live in Supabase; setup steps are in review/README.md. */
(function () {
  'use strict';

  // ---- Connection (filled in after Supabase setup; both values are safe to publish) ----
  var SUPABASE_URL = '';
  var SUPABASE_KEY = '';

  var STORE_KEY = 'tw-review';
  var code;
  try { code = localStorage.getItem(STORE_KEY); } catch (e) {}
  if (!code) return;

  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = (document.currentScript && document.currentScript.src || 'assets/js/review.js').replace(/js\/review\.js.*$/, 'css/review.css?v=1');
  document.head.appendChild(css);

  // ---------- State ----------
  var me = null;            // {name, is_owner, needs_name}
  var threads = [];         // from review_list
  var mode = false;         // comment mode on?
  var tab = 'open';         // panel tab
  var pinsHidden = false;
  var guestName = '';
  try { guestName = localStorage.getItem(STORE_KEY + '-name') || ''; } catch (e) {}
  var ui = {};
  var openThreadId = null;
  var draft = null;         // {anchor, el, x, y}
  var pollTimer = null;

  // ---------- Backend ----------
  function rpc(fn, args) {
    if (window.TW_REVIEW_MOCK) return window.TW_REVIEW_MOCK(fn, args);
    if (!SUPABASE_URL || !SUPABASE_KEY) return Promise.reject(new Error('not_configured'));
    return fetch(SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    }).then(function (r) {
      return r.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok) throw new Error((data && data.message) || ('http_' + r.status));
        return data;
      });
    });
  }

  var ERRORS = {
    invalid_code: "This review link isn't active anymore. If that seems wrong, let Tucker know.",
    not_configured: "Review mode isn't connected to its comment service yet.",
    name_required: 'Add your name first, so your comments are attributed.',
    rate_limited: "That's a lot of comments in a short time. Give it a few minutes and try again.",
    thread_not_found: 'That thread was removed.',
    not_allowed: "You don't have permission to do that.",
    comment_too_long: 'That comment is a little long. Try splitting it in two.'
  };
  function errText(err) {
    var m = err && err.message;
    return ERRORS[m] || "Couldn't reach the comment service. Your text is still here; try again in a moment.";
  }

  // ---------- Helpers ----------
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') el.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      else if (k === 'class') el.className = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function isUi(el) { return !!(el && el.closest && el.closest('[data-twr]')); }
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 86400 * 7) return Math.floor(s / 86400) + 'd ago';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  var narrow = window.matchMedia('(max-width: 640px)');
  function toast(msg) {
    var t = h('div', { class: 'twr-toast', 'data-twr': '', role: 'status', text: msg });
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3600);
  }
  function copy(text) {
    if (navigator.clipboard) return navigator.clipboard.writeText(text).then(function () { toast('Link copied.'); }, function () { prompt('Copy this link:', text); });
    prompt('Copy this link:', text);
  }

  // ---------- Anchoring ----------
  function pickTarget(el) {
    if (!el || el === document.documentElement) return document.body;
    var svg = el.closest && el.closest('svg');
    if (svg) el = svg.parentElement || svg;
    if (el.tagName === 'SOURCE') el = el.parentElement;
    return el;
  }
  function selectorFor(el) {
    var parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      if (el.id) { parts.unshift('#' + CSS.escape(el.id)); return parts.join(' > '); }
      var i = 1, sib = el;
      while ((sib = sib.previousElementSibling)) if (sib.tagName === el.tagName) i++;
      parts.unshift(el.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
      el = el.parentElement;
    }
    parts.unshift('body');
    return parts.join(' > ');
  }
  function labelFor(el) {
    var sec = el.closest('article, section, header, footer, aside, dialog');
    if (!sec) return 'Page';
    if (sec.classList.contains('hero')) return 'Introduction';
    if (sec.tagName === 'HEADER') return 'Header';
    if (sec.tagName === 'FOOTER') return 'Footer';
    if (sec.tagName === 'ASIDE') return 'Page index';
    var head = sec.querySelector('h1, h2, h3');
    if (sec.id === 'more') return 'More projects';
    return head ? head.textContent.trim().replace(/\s+/g, ' ').slice(0, 60) : 'Page';
  }
  function snippet(el) {
    var t = (el.getAttribute('alt') || el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ');
    return t.slice(0, 140);
  }
  function anchorFor(el, clientX, clientY, quote) {
    var r = el.getBoundingClientRect();
    return {
      sel: selectorFor(el),
      x: r.width ? Math.min(1, Math.max(0, (clientX - r.left) / r.width)) : 0.5,
      y: r.height ? Math.min(1, Math.max(0, (clientY - r.top) / r.height)) : 0.5,
      label: labelFor(el),
      text: snippet(el),
      quote: quote || undefined,
      vw: window.innerWidth
    };
  }
  function resolveAnchor(a) {
    var el = null;
    try { el = a && a.sel ? document.querySelector(a.sel) : null; } catch (e) {}
    if (!el) return null;
    var target = el;
    while (target && target !== document.body) {
      var r = target.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) break;
      target = target.parentElement;
    }
    if (!target) return null;
    var rr = target.getBoundingClientRect();
    var exact = target === el;
    return {
      el: el,
      x: rr.left + window.scrollX + (exact ? a.x : 0.5) * rr.width,
      y: rr.top + window.scrollY + (exact ? a.y : 0.5) * rr.height
    };
  }

  // ---------- Build UI ----------
  function build() {
    ui.layer = h('div', { class: 'twr-layer', 'data-twr': '' });
    ui.hl = h('div', { class: 'twr-hl', 'data-twr': '', 'aria-hidden': 'true' });
    ui.banner = h('div', { class: 'twr-banner', 'data-twr': '', role: 'status' }, [
      h('span', { text: narrow.matches ? 'Tap anything to leave a comment.' : "Click anything to leave a comment. Press Esc when you're done." }),
      h('button', { type: 'button', class: 'twr-link', text: 'Done', on: { click: function () { setMode(false); } } })
    ]);
    ui.modeBtn = h('button', { type: 'button', class: 'twr-btn twr-primary', 'aria-pressed': 'false', title: 'Comment (C)', on: { click: function () { setMode(!mode); } } }, [
      icon('M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3h-.5A1.5 1.5 0 0 1 3 12.5z'),
      h('span', { text: 'Comment' })
    ]);
    ui.countBtn = h('button', { type: 'button', class: 'twr-btn', 'aria-expanded': 'false', title: 'Show comments', on: { click: function () { togglePanel(); } } }, [
      h('span', { class: 'twr-count', text: '0' }), h('span', { class: 'twr-count-label', text: ' comments' })
    ]);
    ui.bar = h('div', { class: 'twr-bar', 'data-twr': '', role: 'toolbar', 'aria-label': 'Review tools' }, [ui.modeBtn, ui.countBtn]);
    ui.panel = h('aside', { class: 'twr-panel', 'data-twr': '', 'aria-label': 'Comments', hidden: true });
    ui.pop = h('div', { class: 'twr-pop', 'data-twr': '', role: 'dialog', hidden: true });
    [ui.layer, ui.hl, ui.banner, ui.bar, ui.panel, ui.pop].forEach(function (n) { document.body.appendChild(n); });
    document.documentElement.classList.add('twr-on');
  }
  function icon(d) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 20 20'); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d); s.appendChild(p);
    return s;
  }

  // ---------- Comment mode ----------
  function setMode(on) {
    mode = on;
    document.documentElement.classList.toggle('twr-commenting', on);
    ui.modeBtn.setAttribute('aria-pressed', String(on));
    ui.banner.classList.toggle('show', on);
    if (!on) { if (!draft) hideHl(); }
    else { closePop(); if (narrow.matches) closePanel(); }
  }
  function showHl(el) {
    var r = el.getBoundingClientRect();
    ui.hl.style.cssText = 'top:' + (r.top - 3) + 'px;left:' + (r.left - 3) + 'px;width:' + (r.width + 6) + 'px;height:' + (r.height + 6) + 'px';
    ui.hl.classList.add('show');
  }
  function hideHl() { ui.hl.classList.remove('show'); }

  var hoverEl = null;
  document.addEventListener('pointermove', function (e) {
    if (!mode || draft || e.pointerType === 'touch') return;
    var t = isUi(e.target) ? null : pickTarget(e.target);
    if (t === hoverEl) return;
    hoverEl = t;
    if (t) showHl(t); else hideHl();
  }, true);
  window.addEventListener('scroll', function () { if (!ui.pop) return; if (mode && hoverEl && !draft) showHl(hoverEl); if (draft && draft.el) showHl(draft.el); placePop(); }, { passive: true });

  ['pointerdown', 'mousedown', 'touchstart'].forEach(function (type) {
    document.addEventListener(type, function (e) { if (mode && !isUi(e.target)) e.stopPropagation(); }, { capture: true, passive: true });
  });
  function draftHasText() {
    var f = ui.pop.querySelector('textarea');
    return !!(f && f.value.trim());
  }
  function nudge() {
    ui.pop.classList.remove('nudge'); void ui.pop.offsetWidth; ui.pop.classList.add('nudge');
    var f = ui.pop.querySelector('textarea'); if (f) f.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    if (!ui.pop || isUi(e.target)) return;
    if (!mode) {
      // Outside click closes an open card, unless it holds unsent text.
      if (!ui.pop.hidden && !ui.pop.classList.contains('center')) { if (draftHasText()) nudge(); else closePop(); }
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (!ui.pop.hidden && draftHasText()) { nudge(); return; }
    var sel = window.getSelection();
    var quote = sel && !sel.isCollapsed ? sel.toString().trim().replace(/\s+/g, ' ').slice(0, 300) : '';
    var target = pickTarget(e.target);
    if (quote && sel.rangeCount) {
      var n = sel.getRangeAt(0).commonAncestorContainer;
      target = pickTarget(n.nodeType === 1 ? n : n.parentElement);
    }
    openComposer(target, e.clientX, e.clientY, quote);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (!ui.pop) return;
    var typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName);
    if (e.key === 'Escape') {
      if (!ui.pop.hidden) { closePop(); return; }
      if (mode) { setMode(false); return; }
      if (!ui.panel.hidden) closePanel();
      return;
    }
    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); setMode(!mode); }
  });

  // ---------- Popover (composer + thread) ----------
  var popAt = null; // {x, y} page coords
  function placePop() {
    if (!ui.pop || ui.pop.hidden || !popAt) return;
    if (narrow.matches) { ui.pop.classList.add('sheet'); ui.pop.style.cssText = ''; return; }
    ui.pop.classList.remove('sheet');
    var w = ui.pop.offsetWidth, hgt = ui.pop.offsetHeight;
    var x = popAt.x - window.scrollX + 18, y = popAt.y - window.scrollY - 14;
    if (x + w > window.innerWidth - 12) x = popAt.x - window.scrollX - w - 18;
    x = Math.max(12, x);
    y = Math.max(12, Math.min(y, window.innerHeight - hgt - 12));
    ui.pop.style.cssText = 'left:' + x + 'px;top:' + y + 'px';
  }
  function showPop(content, at, label) {
    ui.pop.replaceChildren(content);
    ui.pop.setAttribute('aria-label', label);
    ui.pop.hidden = false;
    popAt = at;
    placePop();
  }
  function closePop() {
    if (ui.pop.classList.contains('center')) {
      ui.pop.classList.remove('center');
      try { localStorage.setItem(STORE_KEY + '-seen-' + code, '1'); } catch (e) {}
    }
    ui.pop.hidden = true;
    ui.pop.replaceChildren();
    draft = null;
    openThreadId = null;
    popAt = null;
    hideHl();
    renderPins();
  }

  function nameField() {
    if (!me || !me.needs_name) return null;
    var inp = h('input', { type: 'text', class: 'twr-input', maxlength: '80', placeholder: 'Your name', value: guestName, 'aria-label': 'Your name', autocomplete: 'name' });
    inp.addEventListener('input', function () { guestName = inp.value.trim(); try { localStorage.setItem(STORE_KEY + '-name', guestName); } catch (e) {} });
    return inp;
  }

  function composeBox(placeholder, submitLabel, onSubmit, onCancel) {
    var ta = h('textarea', { class: 'twr-input twr-ta', rows: '3', maxlength: '4000', placeholder: placeholder, 'aria-label': placeholder });
    var send = h('button', { type: 'submit', class: 'twr-btn twr-primary twr-sm', text: submitLabel, disabled: true });
    var err = h('p', { class: 'twr-err', role: 'alert' });
    var name = (!guestName && me && me.needs_name) ? nameField() : null;
    function valid() { return ta.value.trim() && (!me.needs_name || guestName); }
    function sync() { send.disabled = !valid(); }
    ta.addEventListener('input', sync);
    if (name) name.addEventListener('input', sync);
    var form = h('form', { class: 'twr-compose' }, [name, ta, err, h('div', { class: 'twr-row' }, [
      onCancel ? h('button', { type: 'button', class: 'twr-link', text: 'Cancel', on: { click: onCancel } }) : null,
      h('span', { class: 'twr-hint', text: (navigator.platform || '').indexOf('Mac') > -1 ? '⌘↵ to send' : 'Ctrl+Enter to send' }),
      send
    ])]);
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (valid()) form.requestSubmit(); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid()) return;
      send.disabled = true; err.textContent = '';
      onSubmit(ta.value.trim()).then(function () { ta.value = ''; sync(); }, function (x) { err.textContent = errText(x); sync(); });
    });
    form.focusTa = function () { (name && !guestName ? name : ta).focus({ preventScroll: true }); };
    return form;
  }

  function openComposer(el, cx, cy, quote) {
    var anchor = anchorFor(el, cx, cy, quote);
    draft = { anchor: anchor, el: el };
    showHl(el);
    var form = composeBox('Add a comment', 'Comment', function (text) {
      return rpc('review_add', { p_code: code, p_body: text, p_anchor: anchor, p_page: location.pathname, p_name: guestName || null })
        .then(function (res) { draft = null; return refresh().then(function () { openThread(res.id); }); });
    }, closePop);
    var box = h('div', { class: 'twr-card' }, [
      h('div', { class: 'twr-card-head' }, [h('span', { class: 'twr-where', text: anchor.label }), closeBtn()]),
      quote ? h('blockquote', { class: 'twr-quote', text: quote }) : null,
      form
    ]);
    showPop(box, { x: cx + window.scrollX, y: cy + window.scrollY }, 'New comment');
    form.focusTa();
  }
  function closeBtn() {
    return h('button', { type: 'button', class: 'twr-x', 'aria-label': 'Close', on: { click: closePop } }, [icon('M5 5l10 10M15 5 5 15')]);
  }

  function openThread(id) {
    var t = threads.find(function (x) { return x.id === id; });
    if (!t) return;
    draft = null;
    openThreadId = id;
    var pos = resolveAnchor(t.anchor);
    if (pos) showHl(pos.el); else hideHl();
    var list = h('ol', { class: 'twr-thread' }, t.comments.map(function (c) {
      return h('li', null, [
        h('div', { class: 'twr-meta' }, [
          h('b', { text: c.author }), h('span', { text: ago(c.created_at) }),
          c.can_delete ? h('button', { type: 'button', class: 'twr-link twr-del', text: 'Delete', on: { click: function () { del(c, t); } } }) : null
        ]),
        h('p', { class: 'twr-body', text: c.body })
      ]);
    }));
    var reply = composeBox('Reply', 'Reply', function (text) {
      return rpc('review_add', { p_code: code, p_body: text, p_thread: t.id, p_name: guestName || null })
        .then(function () { return refresh().then(function () { openThread(t.id); }); });
    });
    var resolveBtn = t.can_resolve ? h('button', { type: 'button', class: 'twr-btn twr-sm', text: t.resolved ? 'Reopen' : 'Resolve', on: { click: function () {
      rpc('review_resolve', { p_code: code, p_thread: t.id, p_resolved: !t.resolved })
        .then(function () { return refresh(); }).then(function () { if (!t.resolved) { closePop(); toast('Resolved.'); } else openThread(t.id); }, function (x) { toast(errText(x)); });
    } } }) : null;
    var box = h('div', { class: 'twr-card' }, [
      h('div', { class: 'twr-card-head' }, [
        h('span', { class: 'twr-where' }, [h('span', { class: 'twr-num', text: String(numberOf(t)) }), document.createTextNode(t.anchor && t.anchor.label || 'Page'), t.resolved ? h('span', { class: 'twr-tag', text: 'Resolved' }) : null]),
        resolveBtn, closeBtn()
      ]),
      !pos ? h('p', { class: 'twr-note', text: 'This part of the page has changed since the comment was left.' }) : null,
      t.anchor && t.anchor.quote ? h('blockquote', { class: 'twr-quote', text: t.anchor.quote }) : null,
      list, reply
    ]);
    var at = pos ? { x: pos.x, y: pos.y } : { x: window.scrollX + window.innerWidth / 2 - 170, y: window.scrollY + 120 };
    showPop(box, at, 'Comment thread');
    renderPins();
  }

  function del(c, t) {
    var root = c.id === t.id;
    if (!confirm(root ? 'Delete this comment and its replies?' : 'Delete this reply?')) return;
    rpc('review_delete', { p_code: code, p_id: c.id })
      .then(function () { return refresh(); })
      .then(function () { if (root) closePop(); else openThread(t.id); }, function (x) { toast(errText(x)); });
  }

  // ---------- Pins ----------
  // Pins are kept and moved in place (not rebuilt) so hover and keyboard focus survive re-layout.
  var pins = {};
  function numberOf(t) { return threads.indexOf(t) + 1; }
  function renderPins() {
    if (!ui.layer) return;
    var keep = {};
    if (!pinsHidden) threads.forEach(function (t) {
      if (t.resolved && t.id !== openThreadId) return;
      var pos = resolveAnchor(t.anchor);
      if (!pos) return;
      keep[t.id] = true;
      var pin = pins[t.id];
      if (!pin) {
        pin = pins[t.id] = h('button', { type: 'button', 'data-twr': '', on: { click: function (e) {
          e.stopPropagation();
          if (openThreadId === t.id) closePop(); else openThread(t.id);
        } } }, [h('span')]);
        ui.layer.appendChild(pin);
      }
      var first = t.comments[0] || {};
      pin.className = 'twr-pin' + (t.id === openThreadId ? ' active' : '') + (t.resolved ? ' resolved' : '');
      pin.style.left = pos.x + 'px';
      pin.style.top = pos.y + 'px';
      pin.firstChild.textContent = String(numberOf(t));
      pin.setAttribute('aria-label', 'Comment ' + numberOf(t) + ' by ' + first.author + ' on ' + (t.anchor.label || 'the page'));
    });
    Object.keys(pins).forEach(function (id) { if (!keep[id]) { pins[id].remove(); delete pins[id]; } });
    var dp = draft && (resolveAnchor(draft.anchor) || popAt);
    if (dp) {
      if (!ui.draftPin) ui.draftPin = h('span', { class: 'twr-pin draft', 'aria-hidden': 'true' });
      ui.draftPin.style.left = dp.x + 'px';
      ui.draftPin.style.top = dp.y + 'px';
      if (!ui.draftPin.parentNode) ui.layer.appendChild(ui.draftPin);
    } else if (ui.draftPin) ui.draftPin.remove();
  }

  // ---------- Panel ----------
  function togglePanel() { if (ui.panel.hidden) openPanel(); else closePanel(); }
  function openPanel() { ui.panel.hidden = false; ui.countBtn.setAttribute('aria-expanded', 'true'); renderPanel(); if (narrow.matches) { setMode(false); closePop(); } }
  function closePanel() { ui.panel.hidden = true; ui.countBtn.setAttribute('aria-expanded', 'false'); }

  function renderPanel() {
    if (ui.panel.hidden) return;
    var open = threads.filter(function (t) { return !t.resolved; });
    var done = threads.filter(function (t) { return t.resolved; });
    var tabs = [['open', 'Open', open.length], ['resolved', 'Resolved', done.length]];
    if (me && me.is_owner) tabs.push(['people', 'Reviewers', null]);
    var head = h('div', { class: 'twr-panel-head' }, [
      h('h2', { text: 'Comments' }),
      h('button', { type: 'button', class: 'twr-x', 'aria-label': 'Close comments', on: { click: closePanel } }, [icon('M5 5l10 10M15 5 5 15')])
    ]);
    var tabRow = h('div', { class: 'twr-tabs', role: 'tablist' }, tabs.map(function (tb) {
      return h('button', { type: 'button', role: 'tab', 'aria-selected': String(tab === tb[0]), class: 'twr-tab', on: { click: function () { tab = tb[0]; renderPanel(); } } },
        [document.createTextNode(tb[1]), tb[2] != null ? h('span', { class: 'twr-tab-n', text: String(tb[2]) }) : null]);
    }));
    var body = h('div', { class: 'twr-panel-body' });
    if (tab === 'people') renderPeople(body);
    else {
      var list = tab === 'open' ? open : done;
      if (!list.length) {
        body.appendChild(h('p', { class: 'twr-empty', text: tab === 'open'
          ? (threads.length ? 'Nothing open. Everything has been resolved.' : 'No comments yet. Turn on Comment, then click anything on the page.')
          : 'Nothing resolved yet.' }));
      } else {
        list.slice().sort(function (a, b) {
          var pa = resolveAnchor(a.anchor), pb = resolveAnchor(b.anchor);
          return (pa ? pa.y : 1e9) - (pb ? pb.y : 1e9);
        }).forEach(function (t) {
          var first = t.comments[0] || {};
          var replies = t.comments.length - 1;
          body.appendChild(h('button', { type: 'button', class: 'twr-item', on: { click: function () { goTo(t); } } }, [
            h('div', { class: 'twr-item-top' }, [h('span', { class: 'twr-num', text: String(numberOf(t)) }), h('span', { class: 'twr-where', text: t.anchor && t.anchor.label || 'Page' }), h('span', { class: 'twr-time', text: ago(t.created_at) })]),
            h('p', { class: 'twr-item-body', text: first.body }),
            h('p', { class: 'twr-item-meta', text: first.author + (replies ? ' · ' + replies + (replies === 1 ? ' reply' : ' replies') : '') })
          ]));
        });
      }
    }
    var foot = h('div', { class: 'twr-panel-foot' }, [
      h('label', { class: 'twr-check' }, [
        h('input', { type: 'checkbox', checked: pinsHidden, on: { change: function (e) { pinsHidden = e.target.checked; renderPins(); } } }),
        document.createTextNode(' Hide pins')
      ]),
      me && me.is_owner && threads.length ? h('button', { type: 'button', class: 'twr-link', text: 'Export', on: { click: exportMd } }) : null,
      h('button', { type: 'button', class: 'twr-link', text: 'Leave review mode', on: { click: leave } })
    ]);
    ui.panel.replaceChildren(head, tabRow, body, foot);
  }

  function goTo(t) {
    var pos = resolveAnchor(t.anchor);
    if (narrow.matches) closePanel();
    if (pos) {
      var y = pos.y - window.innerHeight / 3;
      window.scrollTo({ top: Math.max(0, y), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      setTimeout(function () { openThread(t.id); }, 380);
    } else openThread(t.id);
  }

  function renderPeople(body) {
    body.appendChild(h('p', { class: 'twr-note', text: 'Each person gets their own link, so comments are attributed and any link can be switched off later. Leave the name blank for a shared link; people will be asked for their name.' }));
    var inp = h('input', { type: 'text', class: 'twr-input', maxlength: '80', placeholder: 'Reviewer name', 'aria-label': 'Reviewer name' });
    var btn = h('button', { type: 'submit', class: 'twr-btn twr-primary twr-sm', text: 'Create link' });
    var form = h('form', { class: 'twr-invite' }, [inp, btn]);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); btn.disabled = true;
      rpc('review_invite', { p_code: code, p_name: inp.value.trim() || null }).then(function (r) {
        copy(linkFor(r.code)); inp.value = ''; btn.disabled = false; renderPanel();
      }, function (x) { btn.disabled = false; toast(errText(x)); });
    });
    body.appendChild(form);
    var list = h('ul', { class: 'twr-people' }, [h('li', { class: 'twr-empty', text: 'Loading…' })]);
    body.appendChild(list);
    rpc('review_reviewers_list', { p_code: code }).then(function (people) {
      list.replaceChildren.apply(list, people.filter(function (p) { return !p.is_owner; }).map(function (p) {
        return h('li', { class: p.active ? '' : 'off' }, [
          h('div', null, [
            h('b', { text: p.name || 'Shared link' }),
            h('span', { class: 'twr-item-meta', text: (p.active ? '' : 'Switched off · ') + p.comments + (p.comments === 1 ? ' comment' : ' comments') + (p.last_seen_at ? ' · last visit ' + ago(p.last_seen_at) : ' · not opened yet') })
          ]),
          h('div', { class: 'twr-row' }, [
            p.active ? h('button', { type: 'button', class: 'twr-link', text: 'Copy link', on: { click: function () { copy(linkFor(p.code)); } } }) : null,
            h('button', { type: 'button', class: 'twr-link', text: p.active ? 'Switch off' : 'Switch on', on: { click: function () {
              rpc('review_set_active', { p_code: code, p_id: p.id, p_active: !p.active }).then(renderPanel, function (x) { toast(errText(x)); });
            } } })
          ])
        ]);
      }));
      if (!list.children.length) list.appendChild(h('li', { class: 'twr-empty', text: 'No reviewers yet.' }));
    }, function (x) { list.replaceChildren(h('li', { class: 'twr-empty', text: errText(x) })); });
  }
  function linkFor(c) { return location.origin + location.pathname + '?review=' + c; }

  function exportMd() {
    var lines = ['# Portfolio feedback', '', 'Exported ' + new Date().toLocaleString(), ''];
    threads.forEach(function (t) {
      lines.push('## ' + numberOf(t) + '. ' + (t.anchor && t.anchor.label || 'Page') + (t.resolved ? ' (resolved)' : ''));
      if (t.anchor && t.anchor.quote) lines.push('> ' + t.anchor.quote);
      else if (t.anchor && t.anchor.text) lines.push('_On: ' + t.anchor.text + '_');
      lines.push('');
      t.comments.forEach(function (c) { lines.push('- **' + c.author + '** (' + new Date(c.created_at).toLocaleDateString() + '): ' + c.body.replace(/\n+/g, ' ')); });
      lines.push('');
    });
    var a = h('a', { href: URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/markdown' })), download: 'portfolio-feedback.md' });
    document.body.appendChild(a); a.click(); a.remove();
  }

  function leave() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    location.reload();
  }

  // ---------- Welcome ----------
  function welcome() {
    var seenKey = STORE_KEY + '-seen-' + code;
    try { if (localStorage.getItem(seenKey)) return; } catch (e) {}
    var owner = me.is_owner;
    var name = me.needs_name ? nameField() : null;
    var close = function () { closePop(); };
    var card = h('div', { class: 'twr-card twr-welcome' }, [
      h('h2', { text: owner ? 'Review mode is on.' : (me.name ? 'Thanks for taking a look, ' + me.name.split(' ')[0] + '.' : 'Thanks for taking a look.') }),
      h('p', { text: owner
        ? "You'll see every comment here. Resolve threads as you go, and create reviewer links from the Reviewers tab in the comments panel."
        : 'Turn on Comment, then click anything on the page to leave a note. Small things are just as useful as big ones: a typo, a sentence that didn’t land, a project you wanted to hear more about.' }),
      owner ? null : h('p', { class: 'twr-note', text: 'Other reviewers can see and reply to comments. Normal visitors never see any of this.' }),
      name,
      h('div', { class: 'twr-row twr-end' }, [h('button', { type: 'button', class: 'twr-btn twr-primary twr-sm', text: 'Get started', on: { click: close } })])
    ]);
    ui.pop.classList.add('center');
    showPop(card, { x: window.scrollX + window.innerWidth / 2 - 180, y: window.scrollY + 140 }, 'Welcome');
  }

  // ---------- Data ----------
  function refresh() {
    return rpc('review_list', { p_code: code }).then(function (list) {
      threads = list || [];
      var n = threads.filter(function (t) { return !t.resolved; }).length;
      ui.countBtn.querySelector('.twr-count').textContent = String(n);
      ui.countBtn.querySelector('.twr-count-label').textContent = n === 1 ? ' comment' : ' comments';
      renderPins();
      renderPanel();
    });
  }
  function poll() {
    clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      if (document.hidden || draft || openThreadId) return;
      refresh().catch(function () {});
    }, 30000);
  }

  function fail(err) {
    ui.bar.replaceChildren(
      h('span', { class: 'twr-bar-msg', text: errText(err) }),
      h('button', { type: 'button', class: 'twr-link', text: 'Turn off', on: { click: leave } })
    );
    ui.bar.classList.add('error');
  }

  function start() {
    build();
    rpc('review_session', { p_code: code }).then(function (s) {
      me = s;
      return refresh().then(function () { welcome(); poll(); });
    }).catch(fail);

    var raf = 0;
    var schedule = function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; renderPins(); }); };
    window.addEventListener('resize', schedule);
    document.addEventListener('toggle', schedule, true);
    document.addEventListener('transitionend', schedule, true);
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
    setInterval(schedule, 1500); // carousels and other motion move anchors without telling anyone
    narrow.addEventListener && narrow.addEventListener('change', placePop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
