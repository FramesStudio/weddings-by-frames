/* Weddings by Frames · Landingpage v3 · Funktion
   Läuft ohne Animationsbibliothek: Tracking, Header, Sticky-CTA, Timecode,
   Trailer-Lightbox, YouTube 2-Klick, Formular. Animationen stehen in motion.js. */
(function () {
  'use strict';

  var FORM_ENDPOINT = 'https://formspree.io/f/xrpgoqej';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tracking-Hook (Meta Pixel erst mit Consent, siehe consent.js) ---------- */
  window.wbfTrack = window.wbfTrack || function (event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event, page: 'v3' }, data || {}));
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) window.wbfTrack(el.getAttribute('data-track'));
  });

  /* ---------- Header + Sticky CTA ---------- */
  var topbar = document.getElementById('topbar');
  var sticky = document.getElementById('sticky');
  var hero = document.querySelector('.hero');
  var form = document.getElementById('anfrage');
  var heroVisible = true, formVisible = false;
  function update() {
    topbar.classList.toggle('is-solid', !heroVisible);
    sticky.classList.toggle('is-visible', !heroVisible && !formVisible);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; update(); },
      { rootMargin: '-85% 0px 0px 0px' }).observe(hero);
    new IntersectionObserver(function (en) { formVisible = en[0].isIntersecting; update(); },
      { threshold: 0.05 }).observe(form);
  }

  /* ---------- Hero: Video + laufender Timecode ---------- */
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo && reduceMotion) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
  var tc = document.getElementById('tc');
  if (tc && !reduceMotion) {
    var t0 = performance.now(), heroOn = true;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { heroOn = en[0].isIntersecting; if (heroOn) requestAnimationFrame(tick); }).observe(hero);
    }
    var tick = function (now) {
      var f = Math.floor((now - t0) / 40);          // 25 fps
      tc.textContent = pad(Math.floor(f / 90000) % 24) + ':' + pad(Math.floor(f / 1500) % 60) + ':' + pad(Math.floor(f / 25) % 60) + ':' + pad(f % 25);
      if (heroOn && !document.hidden) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && heroOn) requestAnimationFrame(tick); });
  }

  /* ---------- Trailer mit Ton (selbst gehostet, kein Consent nötig) ---------- */
  var dlg = document.getElementById('trailer');
  if (dlg) {
    var tv = dlg.querySelector('video');
    var open = function () {
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      document.documentElement.classList.add('lb-open');
      if (window.Motion && window.Motion.lenis) window.Motion.lenis.stop();
      tv.muted = false;
      var p = tv.play();
      if (p && p.catch) p.catch(function () {});
      window.wbfTrack('film_play', { film: 'trailer' });
    };
    var close = function () {
      tv.pause();
      if (dlg.open && typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
    };
    dlg.addEventListener('close', function () {
      tv.pause();
      document.documentElement.classList.remove('lb-open');
      if (window.Motion && window.Motion.lenis) window.Motion.lenis.start();
    });
    document.querySelectorAll('[data-trailer]').forEach(function (b) { b.addEventListener('click', open); });
    dlg.querySelectorAll('[data-trailer-close]').forEach(function (b) { b.addEventListener('click', close); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  }

  /* ---------- Tonspur-Balken im Foto-oder-Film-Abschnitt (Bewegung per CSS) ---------- */
  var wave = document.querySelector('.wave g');
  if (wave) {
    var BARS = 72, html = '';
    for (var b = 0; b < BARS; b++) {
      var env = Math.sin(Math.PI * (b + 0.5) / BARS);           // in der Mitte lauter
      var h = Math.max(6, Math.round(60 * (0.25 + 0.75 * env) * (0.55 + Math.random() * 0.45)));
      html += '<rect x="' + (b * 600 / BARS + 1.5).toFixed(1) + '" y="' + ((60 - h) / 2) + '" width="3" height="' + h + '" rx="1.5" style="--t:' +
        (0.35 + Math.random() * 0.6).toFixed(2) + 's;--dl:-' + Math.random().toFixed(2) + 's;--lo:' + (0.12 + Math.random() * 0.3).toFixed(2) + '"/>';
    }
    wave.innerHTML = html;
  }

  /* ---------- Jahre: das Bild altert, je weiter man liest ---------- */
  var jahre = document.getElementById('jahre');
  if (jahre && 'IntersectionObserver' in window) {
    var yearIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var y = +en.target.getAttribute('data-y');
        if (en.isIntersecting) jahre.setAttribute('data-year', y);
        else if (en.boundingClientRect.top > 0 && +jahre.getAttribute('data-year') === y) jahre.setAttribute('data-year', y - 1);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    jahre.querySelectorAll('[data-y]').forEach(function (li) { yearIO.observe(li); });
  }

  /* ---------- YouTube-Vorschaubilder ----------
     Fehlt eine Bildgröße, liefert YouTube ein graues 120x90-Platzhalterbild
     mit Status 200 — ein onerror greift dort nicht. Deshalb Breite prüfen. */
  document.querySelectorAll('img[data-yt-thumb]').forEach(function (img) {
    var id = img.getAttribute('data-yt-thumb');
    var stufen = ['maxresdefault', 'sddefault', 'hqdefault'];
    var i = 0;
    function pruefen() {
      if (img.naturalWidth && img.naturalWidth <= 121 && i < stufen.length - 1) {
        i += 1;
        img.src = 'https://i.ytimg.com/vi/' + id + '/' + stufen[i] + '.jpg';
      }
    }
    img.addEventListener('load', pruefen);
    img.addEventListener('error', pruefen);
    if (img.complete) pruefen();
  });

  /* ---------- YouTube 2-Klick ---------- */
  document.querySelectorAll('.film[data-yt]').forEach(function (film) {
    var btn = film.querySelector('.film-cover');
    btn.addEventListener('click', function () {
      var id = film.getAttribute('data-yt');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      iframe.title = film.querySelector('h3').textContent;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      btn.replaceWith(iframe);
      document.documentElement.classList.remove('cursor-play');
      window.wbfTrack('film_play', { film: id });
    });
  });

  /* ---------- Formular ---------- */
  var lead = document.getElementById('lead-form');
  if (!lead) return;
  var datum = document.getElementById('f-datum');
  var offen = document.getElementById('f-datum-offen');
  var success = document.getElementById('form-success');
  datum.min = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

  var params = new URLSearchParams(location.search);
  document.getElementById('f-utm').value = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid']
    .filter(function (k) { return params.get(k); })
    .map(function (k) { return k + '=' + params.get(k); }).join('&');

  offen.addEventListener('change', function () {
    datum.disabled = offen.checked;
    if (offen.checked) { datum.value = ''; mark(datum, true); }
  });

  function mark(el, ok) {
    el.classList.toggle('is-invalid', !ok);
    if (ok) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');
    return ok;
  }
  function err(key, show) { lead.querySelector('[data-error="' + key + '"]').hidden = !show; }

  function valid() {
    var g = function (id) { return document.getElementById(id); };
    var ok = [
      mark(g('f-namen'), g('f-namen').value.trim().length > 1),
      offen.checked || mark(datum, !!datum.value),
      mark(g('f-location'), g('f-location').value.trim().length > 1),
      mark(g('f-telefon'), g('f-telefon').value.replace(/[^\d]/g, '').length >= 6),
      mark(g('f-email'), /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(g('f-email').value.trim()))
    ];
    return ok.every(Boolean);
  }

  lead.addEventListener('submit', function (e) {
    e.preventDefault();
    err('send', false);
    var ok = valid();
    err('fields', !ok);
    if (!ok) { var first = lead.querySelector('.is-invalid'); if (first) first.focus(); return; }
    if (lead.querySelector('.hp').value) return;

    var submit = lead.querySelector('button[type=submit]');
    var label = submit.textContent;
    submit.disabled = true;
    submit.textContent = 'Wird gesendet …';

    var data = new FormData(lead);
    data.delete('_gotcha');
    data.append('_subject', 'Neue Anfrage Landingpage v3: ' + (data.get('namen') || '') + ' · ' + (data.get('datum') || 'Datum offen'));

    fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        lead.hidden = true;
        var intro = document.getElementById('form-intro');
        if (intro) intro.hidden = true;
        success.hidden = false;
        success.focus();
        window.wbfTrack('lead');
      })
      .catch(function () {
        err('send', true);
        submit.disabled = false;
        submit.textContent = label;
      });
  });
})();
