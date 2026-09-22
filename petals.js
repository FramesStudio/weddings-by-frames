/* Weddings by Frames · Kirschblüten im Hintergrund
   ------------------------------------------------
   Jeder Abschnitt bekommt eine eigene Blütenebene, die zwischen seinem
   Hintergrund und dem Text liegt. Dadurch schweben die Blüten wirklich
   hinter der Schrift und nicht darüber.

   Warum nicht eine Ebene über die ganze Seite? Die Abschnitte haben
   deckende Hintergrundfarben. Eine durchgehende Ebene läge entweder
   über allem oder wäre komplett verdeckt.

   Zum Abschalten: die Zeile <script src="/petals.js" defer></script>
   in der index.html löschen. Sonst wird nichts anderes berührt. */
(function () {
  'use strict';

  /* ---------- Einstellungen zum Nachjustieren ---------- */
  var EINST = {
    dichte:       0.000018,  // Blüten je Pixel Fläche (mehr = mehr Blüten)
    hoechstens:        14,   // Obergrenze je Abschnitt
    groesseMin:        14,   // Pixel
    groesseMax:        30,
    deckkraftMin:    0.34,
    deckkraftMax:    0.70,
    sinkenMin:       0.12,   // Pixel pro Bild
    sinkenMax:       0.36,
    scrollFaktor:    0.22,   // wie stark sie beim Scrollen mitziehen
    schein:            14    // Weichheit des Scheins
  };

  /* Rosétöne mit genug Sättigung: heben sich vom hellen Elfenbein
     ebenso ab wie von den dunklen Abschnitten. */
  var FARBEN = [
    [217, 167, 162],   // Rosé, kräftig
    [201, 138, 133],   // Altrosa
    [235, 198, 194]    // Rosé, hell
  ];

  /* ---------- Abbrechen, wenn nicht erwünscht ---------- */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.requestAnimationFrame) return;

  var ebenen = [];               // je Abschnitt eine
  var scrollAlt = window.pageYOffset || 0;
  var scrollDelta = 0;
  var laeuft = true;

  function zufall(a, b) { return a + Math.random() * (b - a); }

  function neueBluete(breite, hoehe, obenStarten) {
    var f = FARBEN[Math.floor(Math.random() * FARBEN.length)];
    return {
      x: zufall(0, breite),
      y: obenStarten ? zufall(-140, -20) : zufall(0, hoehe),
      groesse: zufall(EINST.groesseMin, EINST.groesseMax),
      deckkraft: zufall(EINST.deckkraftMin, EINST.deckkraftMax),
      sinken: zufall(EINST.sinkenMin, EINST.sinkenMax),
      drift: zufall(-0.18, 0.18),
      winkel: zufall(0, Math.PI * 2),
      dreh: zufall(-0.006, 0.006),
      pendel: zufall(0, Math.PI * 2),
      pendelTempo: zufall(0.004, 0.011),
      farbe: f
    };
  }

  function ebeneAufbauen(e) {
    var r = e.abschnitt.getBoundingClientRect();
    e.breite = Math.max(1, Math.round(r.width));
    e.hoehe = Math.max(1, Math.round(e.abschnitt.offsetHeight));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    e.canvas.width = Math.floor(e.breite * dpr);
    e.canvas.height = Math.floor(e.hoehe * dpr);
    e.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var anzahl = Math.round(e.breite * e.hoehe * EINST.dichte);
    anzahl = Math.max(3, Math.min(EINST.hoechstens, anzahl));
    if (e.breite < 760) anzahl = Math.max(2, Math.round(anzahl * 0.55));

    e.blueten = [];
    for (var i = 0; i < anzahl; i++) e.blueten.push(neueBluete(e.breite, e.hoehe, false));
  }

  function blattZeichnen(ctx, g) {
    ctx.beginPath();
    ctx.moveTo(0, -g);
    ctx.bezierCurveTo(g * 0.72, -g * 0.62, g * 0.58, g * 0.52, 0, g);
    ctx.bezierCurveTo(-g * 0.58, g * 0.52, -g * 0.72, -g * 0.62, 0, -g);
    ctx.closePath();
  }

  function ebeneZeichnen(e) {
    var ctx = e.ctx;
    ctx.clearRect(0, 0, e.breite, e.hoehe);

    for (var i = 0; i < e.blueten.length; i++) {
      var b = e.blueten[i];

      b.y += b.sinken + scrollDelta * EINST.scrollFaktor;
      b.pendel += b.pendelTempo;
      b.x += b.drift + Math.sin(b.pendel) * 0.28;
      b.winkel += b.dreh;

      if (b.y - b.groesse > e.hoehe + 80) { e.blueten[i] = neueBluete(e.breite, e.hoehe, true); continue; }
      if (b.y + b.groesse < -180) {
        e.blueten[i] = neueBluete(e.breite, e.hoehe, false);
        e.blueten[i].y = e.hoehe + 30; continue;
      }
      if (b.x < -60) b.x = e.breite + 40;
      if (b.x > e.breite + 60) b.x = -40;

      var c = b.farbe;
      var farbe = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',';

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.winkel);
      ctx.shadowColor = farbe + (b.deckkraft * 0.85) + ')';
      ctx.shadowBlur = EINST.schein;
      ctx.fillStyle = farbe + b.deckkraft + ')';
      blattZeichnen(ctx, b.groesse);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = farbe + (b.deckkraft * 0.5) + ')';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -b.groesse * 0.8);
      ctx.lineTo(0, b.groesse * 0.8);
      ctx.stroke();
      ctx.restore();
    }
  }

  function bild() {
    if (!laeuft) return;
    for (var i = 0; i < ebenen.length; i++) {
      if (ebenen[i].sichtbar) ebeneZeichnen(ebenen[i]);   // nur was im Blick ist
    }
    scrollDelta *= 0.90;
    requestAnimationFrame(bild);
  }

  /* ---------- Ereignisse ---------- */
  var scrollWartet = false;
  window.addEventListener('scroll', function () {
    if (scrollWartet) return;
    scrollWartet = true;
    requestAnimationFrame(function () {
      var jetzt = window.pageYOffset || 0;
      scrollDelta += (jetzt - scrollAlt) * 0.12;
      scrollDelta = Math.max(-14, Math.min(14, scrollDelta));
      scrollAlt = jetzt;
      scrollWartet = false;
    });
  }, { passive: true });

  var umbauWartet;
  window.addEventListener('resize', function () {
    clearTimeout(umbauWartet);
    umbauWartet = setTimeout(function () { ebenen.forEach(ebeneAufbauen); }, 200);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { laeuft = false; }
    else if (!laeuft) { laeuft = true; requestAnimationFrame(bild); }
  });

  function start() {
    var abschnitte = document.querySelectorAll('section');
    var beobachter = window.IntersectionObserver ? new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (ein) {
        var e = ebenen.filter(function (x) { return x.abschnitt === ein.target; })[0];
        if (e) e.sichtbar = ein.isIntersecting;
      });
    }, { rootMargin: '150px 0px' }) : null;

    Array.prototype.forEach.call(abschnitte, function (sec) {
      // Der Hero hat bereits ein Video im Hintergrund — dort keine Blüten
      if (sec.classList.contains('hero')) return;

      var canvas = document.createElement('canvas');
      canvas.className = 'petals-bg';
      canvas.setAttribute('aria-hidden', 'true');
      var ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return;

      sec.classList.add('hat-blueten');
      sec.insertBefore(canvas, sec.firstChild);

      var e = { abschnitt: sec, canvas: canvas, ctx: ctx, blueten: [], sichtbar: !beobachter };
      ebeneAufbauen(e);
      ebenen.push(e);
      if (beobachter) beobachter.observe(sec);
    });

    if (ebenen.length) requestAnimationFrame(bild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();
