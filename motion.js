/* Weddings by Frames · Landingpage v3 · Bewegung
   Aufbauend auf dem Frames-Motion-Gerüst (Motion-Vertrag, Lenis, Reveals, Lese-Aufhellung).
   Benötigt vendor/gsap.min.js, vendor/ScrollTrigger.min.js, optional vendor/lenis.min.js.

   VERTRAG
   - <html> hat sofort "js" (Inline-Skript im <head>).
   - Hier wird "motion" gesetzt (Animationen aktiv) oder "reduced"/"static".
     v3.css zeigt ohne "motion" ALLES vollständig im Fluss.
   - Jede Szene läuft in scene(); ein Fehler löscht ihre Inline-Styles, statt Inhalt zu verstecken.
*/
(() => {
  'use strict';

  /* ── Konstanten zum Tunen ─────────────────────────────── */
  const CFG = {
    ease: 'expo.out',
    lenis: { lerp: 0.1, wheelMultiplier: 0.95, minWidth: 1024 },
    anchorOffset: 64,
    reveal: { dur: 1.3, stagger: 0.04, start: 'top 86%' },
    fade: { dur: 1.2, y: 22, start: 'top 90%' },

    /* Euer Tag: Bildsequenz aus dem Trailer von Alwina & Ivan (assets/v3/day, 8 fps, 960 px) */
    day: {
      frames: 170,
      src: (i) => `assets/v3/day/d${String(i + 1).padStart(3, '0')}.webp`,
      scrub: 0.6,            // Glättung des Scroll-Scrubs in Sekunden
      filmEnd: 8.6,          // bis zu diesem Timeline-Zeitpunkt (von 10) läuft das Footage
      // [Anteil des Footage, Uhrzeit in Minuten, Moment] – Anteile = Schnittgrenzen im Montage-Clip
      clock: [
        [0.000, 600, 'Getting Ready'], [0.085, 640, 'Getting Ready'], [0.160, 735, 'Das Warten'],
        [0.236, 780, 'First Look'], [0.349, 840, 'Trauung'], [0.433, 880, 'Der erste Kuss'],
        [0.498, 910, 'Spalier'], [0.649, 1215, 'Eröffnungstanz'], [0.790, 1290, 'Party'],
        [0.866, 1340, 'Party'], [0.942, 1385, 'Spät in der Nacht'], [1.000, 1410, '23:30'],
      ],
      // Takte: [rein, raus] in Timeline-Sekunden (Gesamt 10). Der erste Takt steht schon zu Beginn.
      beats: [[0, 1.2], [1.5, 2.9], [3.8, 5.3], [5.8, 7.5]],
    },
  };

  const root = document.documentElement;
  const gsap = window.gsap, ST = window.ScrollTrigger;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const mq = (q) => matchMedia(q).matches;
  const reduced = mq('(prefers-reduced-motion: reduce)');
  const fine = mq('(hover: hover) and (pointer: fine)');
  let lenis = null;

  const ready = (fn) => (document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn());

  const scene = (name, fn) => {
    try { return fn(); } catch (err) {
      console.warn(`[motion:${name}]`, err);
      try { gsap && gsap.set($$(`.${name}, .${name} *`), { clearProps: 'all' }); } catch (_) {}
    }
  };

  // Ohne Bibliothek oder bei Reduced Motion: alles statisch und vollständig sichtbar
  if (!gsap || !ST || reduced) {
    root.classList.add(reduced ? 'reduced' : 'static');
    ready(() => initStummStatic());
    return;
  }

  gsap.registerPlugin(ST);
  gsap.defaults({ ease: CFG.ease });
  root.classList.add('motion');

  ready(() => {
    scene('lenis', initLenis);
    scene('anchors', initAnchors);
    scene('hero', initHero);
    scene('tag', initTag);
    scene('stumm', initStumm);
    scene('filme', initRail);
    scene('reveal', initReveal);
    scene('readlight', initReadlight);
    scene('count', initCount);
    scene('parallax', initParallax);
    scene('wir', initWir);
    scene('ablauf', initAblauf);
    scene('magnetic', initMagnetic);
    scene('cursor', initCursor);
    const refresh = () => ST.refresh();
    document.fonts && document.fonts.ready.then(refresh);
    addEventListener('load', refresh, { once: true });
  });

  /* ── Smooth Scroll: nur Maus/Trackpad, nur breite Screens ── */
  function initLenis() {
    if (!window.Lenis || !fine || innerWidth < CFG.lenis.minWidth) return;
    lenis = new Lenis({ lerp: CFG.lenis.lerp, wheelMultiplier: CFG.lenis.wheelMultiplier });
    root.classList.add('lenis');
    lenis.on('scroll', ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || a.classList.contains('skip')) return;
      const id = a.getAttribute('href');
      const t = id.length > 1 && $(id);
      if (!t) return;
      e.preventDefault();
      const top = Math.max(0, t.getBoundingClientRect().top + scrollY - (id === '#anfrage' ? 0 : CFG.anchorOffset));
      lenis ? lenis.scrollTo(top, { duration: 1.8 }) : scrollTo({ top, behavior: 'smooth' });
      history.pushState && history.pushState(null, '', id);
    });
  }

  /* ── Hero: Copy steigt und geht, das Bild fährt näher ── */
  function initHero() {
    const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero-inner', { y: -110, opacity: 0, ease: 'none', scrollTrigger: st });
    gsap.to('.hero-media', { scale: 1.12, opacity: 0.35, ease: 'none', scrollTrigger: { ...st } });
    gsap.to('.viewfinder, .scroll-cue', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '30% top', scrub: true } });
  }

  /* ══ EUER TAG ══════════════════════════════════════════════
     Scroll → eine Timeline (scrub) → S.p (0–1) → Bild aus dem Frame-Cache + Uhrzeit.
     Frames laden grob → fein (jeder 16., 8., 4., 2., 1.), gezeichnet wird der nächste geladene. */
  function initTag() {
    const sec = $('.tag'), stage = $('.tag-stage'), canvas = $('.tag-canvas');
    const ctx = canvas.getContext('2d');
    const D = CFG.day, N = D.frames, imgs = new Array(N);
    const timeEl = $('#tag-time'), momentEl = $('#tag-moment');
    const beats = $$('.beat', sec), end = $('.tag-end', sec), clock = $('.tag-clock', sec);
    let cw = 0, ch = 0, current = -1, lastMin = -1, started = false;

    const fit = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      cw = canvas.width = Math.round(stage.clientWidth * dpr);
      ch = canvas.height = Math.round(stage.clientHeight * dpr);
      current = -1; draw(S.p);
    };

    const load = () => {
      if (started) return; started = true;
      const order = [], seen = new Set();
      [16, 8, 4, 2, 1].forEach((step) => { for (let i = 0; i < N; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); } });
      if (!seen.has(N - 1)) order.splice(1, 0, N - 1);
      let k = 0;
      const next = () => {
        if (k >= order.length) return;
        const i = order[k++], im = new Image();
        im.decoding = 'async';
        im.onload = () => { imgs[i] = im; if (current < 0 || Math.abs(i - frameAt(S.p)) < Math.abs(current - frameAt(S.p))) { current = -1; draw(S.p); } next(); };
        im.onerror = next;
        im.src = D.src(i);
      };
      for (let c = 0; c < 4; c++) next();   // vier parallele Ladeketten
    };

    const frameAt = (p) => Math.min(N - 1, Math.max(0, Math.round(p * (N - 1))));
    const nearest = (i) => {
      for (let d = 0; d < N; d++) {
        if (imgs[i - d]) return i - d;
        if (imgs[i + d]) return i + d;
      }
      return -1;
    };

    function draw(p) {
      const want = frameAt(p), i = nearest(want);
      if (i < 0 || i === current || !cw) return;
      current = i;
      const im = imgs[i], s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
      const w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    }

    // Uhrzeit aus den Stützpunkten (stückweise linear)
    function clockAt(p) {
      const K = D.clock;
      for (let j = 1; j < K.length; j++) {
        if (p <= K[j][0]) {
          const a = K[j - 1], b = K[j], t = (p - a[0]) / (b[0] - a[0] || 1);
          return [a[1] + (b[1] - a[1]) * t, a[2]];
        }
      }
      return [K[K.length - 1][1], K[K.length - 1][2]];
    }
    function render() {
      draw(S.p);
      const [m, label] = clockAt(S.p), mm = Math.floor(m);
      if (mm !== lastMin) {
        lastMin = mm;
        timeEl.textContent = `${Math.floor(mm / 60)}:${String(mm % 60).padStart(2, '0')}`;
        if (momentEl.textContent !== label) momentEl.textContent = label;
      }
      stage.style.setProperty('--tl', ((m - 600) / 840).toFixed(4));
    }

    const S = { p: 0 };
    gsap.set(beats, { autoAlpha: 0, y: 26 });
    gsap.set(beats[0], { autoAlpha: 1, y: 0 });
    gsap.set(end, { autoAlpha: 0 });
    gsap.set(stage, { '--dim': 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: D.scrub } });
    tl.to(S, { p: 1, duration: D.filmEnd, ease: 'none', onUpdate: render }, 0);
    D.beats.forEach(([a, b], i) => {
      if (i > 0) tl.fromTo(beats[i], { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.45 }, a);
      tl.to(beats[i], { autoAlpha: 0, y: -22, duration: 0.4, ease: 'power2.in' }, b);
    });
    tl.to(stage, { '--dim': 0.8, duration: 0.9, ease: 'power1.inOut' }, D.filmEnd - 0.1)
      .to(clock, { opacity: 0.22, duration: 0.6 }, D.filmEnd)
      .fromTo(end, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.9 }, D.filmEnd + 0.3)
      .to({}, { duration: 0.6 });

    // Laden, sobald die Seite steht oder der Abschnitt näherkommt
    new IntersectionObserver((en) => { if (en[0].isIntersecting) load(); }, { rootMargin: '150% 0px' }).observe(sec);
    addEventListener('load', () => setTimeout(load, 300), { once: true });
    let rw = innerWidth;
    addEventListener('resize', () => { if (innerWidth !== rw || !cw) { rw = innerWidth; fit(); } });
    fit();
    render();
  }

  /* ══ FOTO ODER FILM ═══════════════════════════════════════
     Desktop: gepinnt, das graue Foto richtet sich auf, wird farbig, groß und beginnt zu laufen.
     Mobile: kein Pin – das Foto wird lebendig, sobald es im Bild ist. */
  function initStumm() {
    const sec = $('.stumm'), frame = $('.stumm-frame', sec), video = $('.stumm-video', sec);
    const items = $$('.stumm-list li', sec), copy = $('.stumm-copy', sec), b = $('.stumm-b', sec);
    const alive = (on) => {
      if (sec.classList.contains('is-alive') === on) return;
      sec.classList.toggle('is-alive', on);
      if (on) { if (video.preload === 'none') { video.preload = 'auto'; video.load(); } const p = video.play(); p && p.catch && p.catch(() => {}); }
      else video.pause();
    };

    gsap.matchMedia().add({ desk: '(min-width: 1000px)', mob: '(max-width: 999px)' }, (c) => {
      if (c.conditions.mob) {
        const st = ST.create({ trigger: frame, start: 'top 65%', end: 'bottom 10%', onToggle: (s) => alive(s.isActive) });
        return () => { st.kill(); alive(false); };
      }
      gsap.set(frame, { '--fx': '22vw', '--fy': '4vh', '--fs': 0.48, '--fr': '-3deg', '--fb': '30px', '--gray': 1, '--alive': 0, '--fsh': 0.9 });
      gsap.set(b, { autoAlpha: 0, y: 30 });
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.8,
          onUpdate: (s) => {
            const p = s.progress;
            items.forEach((li, i) => li.classList.toggle('is-on', p > 0.08 + i * 0.12));
            alive(p > 0.6);
          },
        },
      });
      tl.fromTo(frame, { '--fr': '-3deg' }, { '--fr': '2deg', duration: 4.6, ease: 'none' }, 0)
        .to(copy, { autoAlpha: 0, y: -30, duration: 0.8 }, 4.8)
        .to(frame, { '--fx': '0vw', '--fy': '0vh', '--fs': 1, '--fr': '0deg', '--fb': '0px', '--fsh': 0, duration: 2.2 }, 5)
        .to(frame, { '--gray': 0, duration: 1.4, ease: 'none' }, 5.3)
        .to(frame, { '--alive': 1, duration: 1 }, 6.6)
        .to(b, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' }, 7.4)
        .to({}, { duration: 1.6 });
      return () => { alive(false); items.forEach((li) => li.classList.remove('is-on')); };
    });
  }
  // Ohne Motion: Foto wird trotzdem lebendig, wenn es sichtbar ist (Video läuft nicht bei Reduced Motion)
  function initStummStatic() {
    const sec = $('.stumm');
    if (!sec || !('IntersectionObserver' in window)) return;
    new IntersectionObserver((en) => { if (en[0].isIntersecting) sec.classList.add('is-alive'); }, { threshold: 0.5 }).observe($('.stumm-frame', sec));
    if (reduced) { const v = $('.stumm-video', sec); v && v.remove(); }
  }

  /* ══ FILME: horizontale Schiene, auf Desktop vom Scroll gefahren ══ */
  function initRail() {
    const sec = $('.filme'), track = $('.rail-track', sec);
    gsap.matchMedia().add('(min-width: 1000px)', () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tw = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      $$('.film-cover img', track).forEach((img) => {
        gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.film'), containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      });
    });
  }

  /* ── Wörter in Masken zerlegen, Inline-Markup bleibt erhalten ── */
  function splitWords(el) {
    if (el._words) return el._words;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], words = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => {
      if (!n.nodeValue.trim()) return;
      const f = document.createDocumentFragment();
      n.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return f.appendChild(document.createTextNode(part));
        const m = document.createElement('span'); m.className = 'rv-m';
        const i = document.createElement('span'); i.className = 'rv-i'; i.textContent = part;
        m.appendChild(i); f.appendChild(m); words.push(i);
      });
      n.parentNode.replaceChild(f, n);
    });
    return (el._words = words);
  }

  function initReveal() {
    $$('[data-reveal]').forEach((el) => {
      const words = splitWords(el);
      gsap.set(words, { yPercent: 110 });
      gsap.to(words, { yPercent: 0, duration: CFG.reveal.dur, stagger: CFG.reveal.stagger,
        scrollTrigger: { trigger: el, start: CFG.reveal.start, once: true } });
    });
    $$('[data-fade]').forEach((el) => gsap.to(el, { opacity: 1, y: 0, duration: CFG.fade.dur,
      scrollTrigger: { trigger: el, start: CFG.fade.start, once: true } }));
  }

  function initReadlight() {
    $$('[data-readlight]').forEach((el) => {
      const words = splitWords(el);
      gsap.set(words, { opacity: 0.14 });
      gsap.to(words, { opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: 0.6 } });
    });
  }

  function initCount() {
    $$('[data-count]').forEach((el) => {
      const endV = parseFloat(el.dataset.count), dec = +(el.dataset.decimals ?? 2);
      const fmt = new Intl.NumberFormat('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      const o = { v: 0 };
      gsap.to(o, { v: endV, duration: 1.8, ease: 'power3.out',
        onUpdate: () => (el.textContent = fmt.format(o.v)), onComplete: () => (el.textContent = fmt.format(endV)),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  }

  function initParallax() {
    $$('[data-parallax]').forEach((el) => gsap.fromTo(el, { y: -parseFloat(el.dataset.parallax) / 2 }, { y: parseFloat(el.dataset.parallax) / 2, ease: 'none',
      scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: 0.8 } }));
  }

  /* ── Nata & Nils: Porträt öffnet sich wie ein Vorhang ── */
  function initWir() {
    const m = $('.wir-mask');
    gsap.fromTo(m, { '--clip': '100%' }, { '--clip': '0%', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: m, start: 'top 82%', once: true } });
    gsap.from('.wir-foto figcaption', { opacity: 0, x: -30, duration: 1.4, delay: 0.9, scrollTrigger: { trigger: m, start: 'top 82%', once: true } });
  }

  /* ── Ablauf: Linie zeichnet sich, Stationen leuchten auf ── */
  function initAblauf() {
    const line = $('.ablauf-line'), steps = $$('.ablauf-list li'), list = $('.ablauf-list');
    gsap.set(line, { '--line': 0 });
    ST.create({
      trigger: list, start: 'top 72%', end: 'bottom 60%', scrub: 0.6,
      onUpdate: (s) => {
        line.style.setProperty('--line', s.progress.toFixed(3));
        steps.forEach((li, i) => li.classList.toggle('is-lit', s.progress >= i / (steps.length - 1) - 0.02));
      },
    });
    // Linie an die Kreise anpassen (Desktop horizontal, Mobile vertikal)
    const place = () => {
      const a = $('.ablauf-n', steps[0]).getBoundingClientRect(), z = $('.ablauf-n', steps[steps.length - 1]).getBoundingClientRect();
      const s = $('.ablauf').getBoundingClientRect();
      if (innerWidth >= 1000) Object.assign(line.style, { top: (a.top - s.top + a.height / 2) + 'px', left: (a.left - s.left + a.width / 2) + 'px', right: (s.right - z.left - z.width / 2) + 'px', bottom: 'auto' });
      else Object.assign(line.style, { top: (a.top - s.top + a.height / 2) + 'px', bottom: (s.bottom - z.top - z.height / 2) + 'px', left: (a.left - s.left + a.width / 2) + 'px', right: 'auto' });
    };
    place();
    ST.addEventListener('refresh', place);
  }

  function initMagnetic() {
    if (!fine) return;
    $$('[data-magnetic]').forEach((el) => {
      const k = parseFloat(el.dataset.magnetic) || 9;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (((e.clientX - r.left) / r.width - 0.5) * 2 * k).toFixed(1) + 'px');
        el.style.setProperty('--my', (((e.clientY - r.top) / r.height - 0.5) * 2 * k * 0.6).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
    });
  }

  /* ── Cursor: Punkt folgt direkt, roter "Play"-Kreis mit Trägheit über Filmen ── */
  function initCursor() {
    if (!fine || innerWidth < 1000) return;
    const c = $('.cursor');
    root.classList.add('has-cursor');
    let x = -100, y = -100, rx = -100, ry = -100, moved = false;
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY; moved = true;
      const t = e.target.closest && e.target.closest('[data-cursor="play"]');
      root.classList.toggle('cursor-play', !!t && !root.classList.contains('lb-open'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => root.classList.remove('cursor-play'));
    gsap.ticker.add((t, dt) => {
      if (!moved && Math.abs(rx - x) < 0.1 && Math.abs(ry - y) < 0.1) return;
      moved = false;
      const k = 1 - Math.pow(1 - 0.16, dt / 16.67);
      rx += (x - rx) * k; ry += (y - ry) * k;
      c.style.setProperty('--dx', x + 'px'); c.style.setProperty('--dy', y + 'px');
      c.style.setProperty('--rx', rx.toFixed(1) + 'px'); c.style.setProperty('--ry', ry.toFixed(1) + 'px');
    });
  }

  window.Motion = { splitWords, scene, get lenis() { return lenis; }, CFG };
})();
