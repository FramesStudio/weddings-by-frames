/* Weddings by Frames · Einwilligung und Meta Pixel
   ------------------------------------------------
   Muss VOR v2.js geladen werden: v2.js definiert wbfTrack nur,
   wenn es noch nicht existiert ("window.wbfTrack || function"),
   die Fassung hier hat damit Vorrang und leitet Events an den Pixel weiter.

   Der Pixel lädt erst nach aktiver Zustimmung (§ 25 TDDDG, Art. 6 DSGVO).
   Ohne Zustimmung wird kein Skript von Meta geladen und kein Cookie gesetzt. */
(function () {
  'use strict';

  var PIXEL_ID = '1221463530202356';
  var KEY = 'wbf-consent-v2';

  /* ---------- gespeicherte Entscheidung ---------- */
  function lesen() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  }
  function schreiben(marketing) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        marketing: !!marketing, ts: new Date().toISOString()
      }));
    } catch (e) {}
    if (marketing) pixelLaden();
    verstecken();
  }

  /* ---------- Meta Pixel ---------- */
  function pixelLaden() {
    if (window.fbq) return;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    // Ereignisse, die vor der Zustimmung aufgelaufen sind, nachreichen
    (window.wbfQueue || []).forEach(function (a) { senden(a[0], a[1]); });
    window.wbfQueue = [];
  }

  /* ---------- Ereignisse an den Pixel ---------- */
  function senden(event, data) {
    if (!window.fbq) return;
    if (event === 'lead') {
      window.fbq('track', 'Lead', { content_name: 'Terminanfrage' });
    } else if (event === 'film_play') {
      window.fbq('trackCustom', 'FilmPlay', data || {});
    } else if (event && event.indexOf('cta') === 0) {
      window.fbq('trackCustom', 'CTAKlick', { position: event });
    }
  }

  /* Vorrang vor der Fassung in v2.js */
  window.wbfQueue = [];
  window.wbfTrack = function (event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event, page: 'v2' }, data || {}));
    if (window.fbq) senden(event, data);
    else window.wbfQueue.push([event, data]);
  };

  /* ---------- Banner ---------- */
  var banner;
  function zeigen()     { if (banner) banner.classList.add('is-open'); }
  function verstecken() { if (banner) banner.classList.remove('is-open'); }

  function bauen() {
    banner = document.createElement('div');
    banner.className = 'cc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cc-titel');
    banner.innerHTML =
      '<div class="cc-box">' +
        '<h2 id="cc-titel">Kurz gefragt</h2>' +
        '<p>Wir würden gern messen, wie unsere Anzeigen ankommen. Dafür lädt ein Dienst ' +
        'von Meta, der Daten in die USA übertragen kann. Ohne eure Zustimmung passiert ' +
        'das nicht — die Seite funktioniert trotzdem vollständig. ' +
        '<a href="/datenschutz#meta">Was dabei erhoben wird</a></p>' +
        '<div class="cc-actions">' +
          '<button type="button" class="cc-btn" data-cc="nein">Nur notwendige</button>' +
          '<button type="button" class="cc-btn cc-btn-red" data-cc="ja">Einverstanden</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]');
      if (b) schreiben(b.getAttribute('data-cc') === 'ja');
    });
  }

  function start() {
    bauen();
    var c = lesen();
    if (c && c.marketing) pixelLaden();
    else if (!c) setTimeout(zeigen, 1200);

    // Widerruf und nachträgliche Zustimmung über Fußzeilen-Link
    document.querySelectorAll('[data-cc-open]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); zeigen(); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();
