/* ============================================================
   ASET/EDIT — script.js
   Tirai pembuka, tampil-per-scroll, hitung angka, tab kategori,
   pencarian, tombol magnet, tombol ke atas.
   Data aplikasi diambil dari apps.js.
   ============================================================ */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var body = document.body;
  var apps = Array.isArray(window.APPS) ? window.APPS : [];

  var PALETTE = [
    { bg: '#2E4BFF', light: false },
    { bg: '#FF4B33', light: false },
    { bg: '#FFC940', light: true },
    { bg: '#19A55C', light: false }
  ];

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------------------------------------------------------
     REFERENSI ELEMEN
  --------------------------------------------------------- */
  var intro = document.getElementById('intro');
  var grid = document.getElementById('grid');
  var emptyEl = document.getElementById('empty');
  var tabsEl = document.getElementById('tabs');
  var searchEl = document.getElementById('q');
  var searchJump = document.getElementById('searchJump');
  var countEl = document.getElementById('count');
  var toTop = document.getElementById('toTop');
  var heroArt = document.querySelector('.hero-art');

  /* ---------------------------------------------------------
     HITUNG DATA + ISI SEMUA ANGKA
  --------------------------------------------------------- */
  var cats = [];
  apps.forEach(function (a) {
    var c = (a.kategori || 'Lainnya').toUpperCase();
    if (cats.indexOf(c) === -1) cats.push(c);
  });
  var total = apps.length;

  document.getElementById('navCount').textContent = pad(total) + ' APPS';
  document.getElementById('heroSticker').textContent = pad(total);

  var statEls = document.querySelectorAll('.stat b[data-count]');
  var statTargets = [total, cats.length, 100];
  statEls.forEach(function (el, i) {
    el.dataset.count = statTargets[i] || 0;
  });

  /* ---------------------------------------------------------
     INTRO PEMBUKA
     Cap "ASET/EDIT" masuk, tahan sebentar, lalu panel kebuka.
     Klik kapan aja buat skip.
  --------------------------------------------------------- */
  var introDone = false;
  var introTimers = [];

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    introTimers.forEach(clearTimeout);
    introTimers = [];
    body.classList.remove('intro-lock');
    body.classList.add('loaded');
    if (intro) {
      intro.classList.add('out');
      introTimers.push(setTimeout(function () {
        intro.classList.add('split');
      }, 160));
      introTimers.push(setTimeout(function () {
        if (intro.parentNode) intro.parentNode.removeChild(intro);
      }, 980));
    }
  }

  if (reduce || !intro) {
    finishIntro();
  } else {
    body.classList.add('intro-lock');
    introTimers.push(setTimeout(finishIntro, 2350));
    intro.addEventListener('click', finishIntro);
  }

  /* ---------------------------------------------------------
     CURSOR MOUSE (oval + kabel)
     Ikut halus, miring ngikut arah, ketarik dikit ke elemen
     yang lagi ditunjuk, kabel + colokan nyeret di belakang.
  --------------------------------------------------------- */
  var curMouse = document.getElementById('curMouse');
  var curTilt = document.getElementById('curTilt');
  var curPlug = document.getElementById('curPlug');
  var curWire = document.getElementById('curWire');
  var wirePath = document.getElementById('wirePath');
  var wireBack = document.getElementById('wireBack');

  if (finePointer && !reduce && curMouse) {
    body.classList.add('cursor-on');

    var cmx = window.innerWidth / 2;
    var cmy = window.innerHeight / 2;
    var crx = cmx, cry = cmy;
    var ctx = cmx - 46, cty = cmy + 26;
    var tilt = 0;
    var hoverRect = null;
    var attractX = 0, attractY = 0;
    var curShown = false;
    var cursorParts = [curMouse, curPlug, curWire];

    function showCursor() {
      if (curShown) return;
      curShown = true;
      cursorParts.forEach(function (el) { el.classList.remove('is-hidden'); });
    }

    function hideCursor() {
      curShown = false;
      cursorParts.forEach(function (el) { el.classList.add('is-hidden'); });
    }

    window.addEventListener('mousemove', function (e) {
      cmx = e.clientX;
      cmy = e.clientY;
      showCursor();
    }, { passive: true });

    document.addEventListener('mouseleave', hideCursor);
    document.addEventListener('mouseenter', showCursor);

    document.addEventListener('mouseover', function (e) {
      var hot = e.target.closest
        ? e.target.closest('a, button, .tab, .card, input, [data-magnet]')
        : null;
      hoverRect = hot ? hot.getBoundingClientRect() : null;
      curMouse.classList.toggle('is-hot', !!hot);
    });

    document.addEventListener('mousedown', function () {
      curMouse.classList.add('is-click');
    });
    document.addEventListener('mouseup', function () {
      curMouse.classList.remove('is-click');
    });

    hideCursor();

    var cursorT0 = performance.now();

    (function cursorLoop(ts) {
      var t = ts - cursorT0;

      /* follow super halus */
      crx += (cmx - crx) * 0.3;
      cry += (cmy - cry) * 0.3;

      /* tarikan kecil ke elemen yang lagi ditunjuk */
      var ax = 0, ay = 0;
      if (hoverRect) {
        var cxs = hoverRect.left + hoverRect.width / 2;
        var cys = hoverRect.top + hoverRect.height / 2;
        var ddx = cxs - cmx;
        var ddy = cys - cmy;
        var dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        var pull = Math.min(10, dist * 0.08);
        ax = (ddx / dist) * pull;
        ay = (ddy / dist) * pull;
      }
      attractX += (ax - attractX) * 0.14;
      attractY += (ay - attractY) * 0.14;

      var fx = crx + attractX;
      var fy = cry + attractY;

      /* miring ngikut arah geser */
      var targetTilt = Math.max(-14, Math.min(14, (cmx - crx) * 0.5));
      tilt += (targetTilt - tilt) * 0.12;

      curMouse.style.transform = 'translate(' + fx.toFixed(1) + 'px,' + fy.toFixed(1) + 'px)';
      curTilt.style.transform = 'rotate(' + tilt.toFixed(2) + 'deg)';

      /* kabel: dari atas mouse melengkung ke ujung yang nyeret */
      ctx += (cmx - ctx) * 0.075;
      cty += (cmy - cty) * 0.075;

      var sx = fx;
      var sy = fy - 19;
      var dxw = fx - ctx;
      var dyw = fy - cty;
      var lenW = Math.sqrt(dxw * dxw + dyw * dyw) || 1;
      var nx = -dyw / lenW;
      var ny = dxw / lenW;
      var bow = 22 + Math.sin(t * 0.003) * 7;

      var cxp = (fx + ctx) / 2 + nx * bow;
      var cyp = (fy + cty) / 2 + ny * bow;

      var d = 'M ' + sx.toFixed(1) + ' ' + sy.toFixed(1) +
              ' Q ' + cxp.toFixed(1) + ' ' + cyp.toFixed(1) +
              ' ' + ctx.toFixed(1) + ' ' + cty.toFixed(1);
      wirePath.setAttribute('d', d);
      wireBack.setAttribute('d', d);

      /* colokan di ujung kabel, ikut arah kabel */
      var ang = Math.atan2(cty - cyp, ctx - cxp) * 180 / Math.PI - 90;
      curPlug.style.transform =
        'translate(' + (ctx - 6.5).toFixed(1) + 'px,' + (cty - 8.5).toFixed(1) + 'px) rotate(' + ang.toFixed(1) + 'deg)';

      requestAnimationFrame(cursorLoop);
    })(cursorT0);
  }

  /* ---------------------------------------------------------
     TAMPIL PER SCROLL + HITUNG ANGKA
  --------------------------------------------------------- */
  var revealed = false;
  var io = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          if (en.target.classList.contains('stat') && !revealed) {
            revealed = true;
            countStats();
          }
          io.unobserve(en.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -36px 0px' })
    : null;

  function countStats() {
    statEls.forEach(function (el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      var suffix = el.dataset.suffix || '';
      if (reduce) { el.textContent = target + suffix; return; }
      var t0 = null;
      (function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1100, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(performance.now());
    });
  }

  if (io) {
    document.querySelectorAll('.stat').forEach(function (s) { io.observe(s); });
  } else {
    revealed = true;
  }

  /* ---------------------------------------------------------
     TAB KATEGORI + RENDER KARTU
  --------------------------------------------------------- */
  var activeCat = 'all';
  var query = '';

  function catColor(cat) {
    var i = cats.indexOf(cat);
    return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
  }

  function buildTabs() {
    tabsEl.innerHTML = '';
    var all = ['all'].concat(cats);
    all.forEach(function (cat) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab' + (cat === activeCat ? ' on' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-pressed', cat === activeCat ? 'true' : 'false');

      var label = document.createElement('span');
      label.textContent = cat === 'all' ? 'SEMUA' : cat;

      var cnt = document.createElement('span');
      cnt.className = 'tcount';
      var amount = cat === 'all'
        ? apps.length
        : apps.filter(function (a) { return (a.kategori || 'Lainnya').toUpperCase() === cat; }).length;
      cnt.textContent = pad(amount);

      b.appendChild(label);
      b.appendChild(cnt);
      b.addEventListener('click', function () {
        activeCat = cat;
        buildTabs();
        renderGrid();
      });
      tabsEl.appendChild(b);
    });
  }

  function isPlaceholder(link) {
    return !link || link === '#' ||
      link === 'https://drive.google.com' ||
      link === 'https://drive.google.com/';
  }

  function buildCard(app, i) {
    var cat = (app.kategori || 'Lainnya').toUpperCase();
    var color = catColor(cat);
    var num = pad(i + 1);

    var art = document.createElement('article');
    art.className = 'card';
    art.style.setProperty('--c', color.bg);
    art.style.setProperty('--d', ((i % 4) * 70) + 'ms');

    var tape = document.createElement('i');
    tape.className = 'tape';
    art.appendChild(tape);

    var top = document.createElement('div');
    top.className = 'card-top';

    var icon = document.createElement('div');
    icon.className = 'icon' + (color.light ? ' light' : '');
    var initial = (app.nama || '?').trim().charAt(0).toUpperCase();
    if (app.gambar) {
      var img = document.createElement('img');
      img.alt = app.nama || '';
      img.src = app.gambar;
      img.addEventListener('error', function () { img.remove(); icon.textContent = initial; });
      icon.appendChild(img);
    } else {
      icon.textContent = initial;
    }

    var slot = document.createElement('div');
    slot.className = 'slot';
    var sno = document.createElement('span');
    sno.className = 'slot-no';
    sno.textContent = 'NO. ' + num;
    var bars = document.createElement('i');
    bars.className = 'barcode';
    bars.setAttribute('aria-hidden', 'true');
    slot.appendChild(sno);
    slot.appendChild(bars);

    top.appendChild(icon);
    top.appendChild(slot);
    art.appendChild(top);

    var h3 = document.createElement('h3');
    h3.textContent = app.nama || 'Tanpa Nama';
    art.appendChild(h3);

    var metas = [app.versi, app.ukuran, app.platform].filter(Boolean);
    if (metas.length) {
      var badges = document.createElement('div');
      badges.className = 'badges';
      metas.forEach(function (m) {
        var s = document.createElement('span');
        s.textContent = m;
        badges.appendChild(s);
      });
      art.appendChild(badges);
    }

    if (app.deskripsi) {
      var desc = document.createElement('p');
      desc.className = 'desc';
      desc.textContent = app.deskripsi;
      art.appendChild(desc);
    }

    var link = (app.link || '').trim();
    var off = isPlaceholder(link);
    var btn = document.createElement('a');
    btn.className = 'dl' + (off ? ' is-off' : '');
    btn.innerHTML = '<span class="dl-label"></span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
    btn.querySelector('.dl-label').textContent = off ? 'SEGERA HADIR' : 'DOWNLOAD';

    if (off) {
      btn.href = '#';
      btn.title = 'Link download belum tersedia';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        art.classList.remove('shake');
        void art.offsetWidth;
        art.classList.add('shake');
      });
    } else {
      btn.href = link;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
    }
    art.appendChild(btn);

    return art;
  }

  function renderGrid() {
    var q = query.trim().toLowerCase();
    var list = apps.filter(function (a) {
      var cat = (a.kategori || 'Lainnya').toUpperCase();
      var okCat = activeCat === 'all' || cat === activeCat;
      var hay = ((a.nama || '') + ' ' + (a.deskripsi || '') + ' ' + cat).toLowerCase();
      return okCat && (!q || hay.indexOf(q) !== -1);
    });

    grid.innerHTML = '';
    countEl.textContent = pad(list.length);
    emptyEl.hidden = list.length > 0;

    list.forEach(function (app, i) {
      var card = buildCard(app, i);
      grid.appendChild(card);
      if (io) io.observe(card);
      else card.classList.add('in');
    });
  }

  /* ---------------------------------------------------------
     PENCARIAN + SHORTCUT
  --------------------------------------------------------- */
  var searchTimer = null;
  if (searchEl) {
    searchEl.addEventListener('input', function (e) {
      var val = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        query = val;
        renderGrid();
      }, 130);
    });
  }

  if (searchJump && searchEl) {
    searchJump.addEventListener('click', function () {
      var anchor = document.getElementById('katalog');
      if (anchor) anchor.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { searchEl.focus(); }, reduce ? 0 : 420);
    });
  }

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

    if (e.key === '/' && !typing) {
      e.preventDefault();
      if (searchEl) searchEl.focus();
    } else if (e.key === 'Escape' && document.activeElement === searchEl) {
      searchEl.blur();
    }
  });

  /* ---------------------------------------------------------
     TOMBOL MAGNET (ikut narik ke arah kursor)
  --------------------------------------------------------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-magnet]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.16).toFixed(1) + 'px,' + (dy * 0.22).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------
     TOMBOL KE ATAS + PARALLAX HERO
  --------------------------------------------------------- */
  var ticking = false;

  function onScrollFrame() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop;

    if (toTop) toTop.classList.toggle('show', y > 650);

    if (heroArt && !reduce && y < 900) {
      heroArt.style.transform = 'translateY(' + Math.min(y * 0.07, 60).toFixed(1) + 'px)';
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }, { passive: true });
  onScrollFrame();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  buildTabs();
  renderGrid();
})();
