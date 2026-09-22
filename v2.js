/* Weddings by Frames · Landingpage v2 */
(function () {
  'use strict';

  var FORM_ENDPOINT = 'https://formspree.io/f/xrpgoqej';
  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tracking-Hook (Meta Pixel / GA4 erst mit Consent) ---------- */
  window.wbfTrack = window.wbfTrack || function (event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event, page: 'v2' }, data || {}));
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
      { rootMargin: '-80% 0px 0px 0px' }).observe(hero);
    new IntersectionObserver(function (en) { formVisible = en[0].isIntersecting; update(); },
      { threshold: 0.05 }).observe(form);
  }

  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo && reduceMotion) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }

  /* ---------- Reveal ---------- */
  var targets = document.querySelectorAll(
    'main section:not(.hero) h2, .eyebrow, .blind-fig, .blind-list li, .blind-close, .player, .photo-lead, .photo-list li, ' +
    '.photo-close, .film, .real p, .real-fig, .years-list li, .steps-list li, .form-card'
  );
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var sibs = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = Math.min(sibs, 4) * 80 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  /* ---------- Film mit Ton ---------- */
  document.querySelectorAll('[data-player]').forEach(function (player) {
    var video = player.querySelector('video');
    player.querySelector('.player-cover').addEventListener('click', function () {
      player.classList.add('is-playing');
      video.muted = false;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
      window.wbfTrack('film_play', { film: 'trailer' });
    });
  });


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
    if (offen.checked) { datum.value = ''; datum.classList.remove('is-invalid'); }
  });

  function mark(el, ok) { el.classList.toggle('is-invalid', !ok); return ok; }
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
    data.append('_subject', 'Neue Anfrage Landingpage v2: ' + (data.get('namen') || '') + ' · ' + (data.get('datum') || 'Datum offen'));

    fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        lead.hidden = true;
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
