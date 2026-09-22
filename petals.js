/* Weddings by Frames · Kirschblüten im Hintergrund
   ------------------------------------------------
   Wenige, sehr zurückhaltende Blütenblätter, die langsam sinken und beim
   Scrollen mitgehen. Jedes hat einen weichen Schein am Rand.

   Zum Abschalten: die Zeile <script src="/petals.js" defer></script>
   in der index.html löschen. Sonst wird nichts anderes berührt. */
(function () {
  'use strict';

  /* ---------- Einstellungen zum Nachjustieren ---------- */
  var EINST = {
    anzahlDesktop: 16,
    anzahlMobil:    8,
    groesseMin:     7,    // Pixel
    groesseMax:    15,
    deckkraftMin: 0.16,   // sehr dezent
    deckkraftMax: 0.40,
    sinkenMin:   0.10,    // Pixel pro Bild
    sinkenMax:   0.32,
    scrollFaktor: 0.22,   // wie stark sie beim Scrollen mitziehen
    schein:        9      // Weichheit des Scheins
  };

  var FARBEN = [
    [235, 198, 194],   // Rosé, aus der Markenpalette
    [247, 237, 232],   // Creme
    [217, 167, 162]    // Rosé, kräftiger
  ];

  /* ---------- Abbrechen, wenn nicht erwünscht oder nicht sinnvoll ---------- */
  var ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ruhig) return;                       // Nutzer wünscht keine Bewegung
  if (!window.requestAnimationFrame) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'petals';
  canvas.setAttribute('aria-hidden', 'true');
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  var breite = 0, hoehe = 0, dpr = 1;
  var blueten = [];
  var scrollAlt = window.pageYOffset || 0;
  var scrollDelta = 0;
  var laeuft = true;

  function zufall(a, b) { return a + Math.random() * (b - a); }

  function neueBluete(obenStarten) {
    var f = FARBEN[Math.floor(Math.random() * FARBEN.length)];
    return {
      x: zufall(0, breite),
      y: obenStarten ? zufall(-120, -10) : zufall(0, hoehe),
      groesse: zufall(EINST.groesseMin, EINST.groesseMax),
      deckkraft: zufall(EINST.deckkraftMin, EINST.deckkraftMax),
      sinken: zufall(EINST.sinkenMin, EINST.sinkenMax),
      drift: zufall(-0.18, 0.18),
      winkel: zufall(0, Math.PI * 2),
      dreh: zufall(-0.006, 0.006),
      pendel: zufall(0, Math.PI * 2),
      pendelTempo: zufall(0.004, 0.011),
      pendelWeite: zufall(6, 20),
      farbe: f
    };
  }

  function aufbauen() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    breite = window.innerWidth;
    hoehe = window.innerHeight;
    canvas.width = Math.floor(breite * dpr);
    canvas.height = Math.floor(hoehe * dpr);
    canvas.style.width = breite + 'px';
    canvas.style.height = hoehe + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var anzahl = breite < 760 ? EINST.anzahlMobil : EINST.anzahlDesktop;
    blueten = [];
    for (var i = 0; i < anzahl; i++) blueten.push(neueBluete(false));
  }

  /* ---------- Form eines Blütenblatts ---------- */
  function blattZeichnen(b) {
    var g = b.groesse;
    ctx.beginPath();
    ctx.moveTo(0, -g);
    ctx.bezierCurveTo(g * 0.72, -g * 0.62, g * 0.58, g * 0.52, 0, g);
    ctx.bezierCurveTo(-g * 0.58, g * 0.52, -g * 0.72, -g * 0.62, 0, -g);
    ctx.closePath();
  }

  function bild() {
    if (!laeuft) return;
    ctx.clearRect(0, 0, breite, hoehe);

    for (var i = 0; i < blueten.length; i++) {
      var b = blueten[i];

      b.y += b.sinken + scrollDelta * EINST.scrollFaktor;
      b.pendel += b.pendelTempo;
      b.x += b.drift + Math.sin(b.pendel) * 0.28;
      b.winkel += b.dreh;

      // Am Rand wieder einsetzen
      if (b.y - b.groesse > hoehe + 60) { blueten[i] = neueBluete(true); continue; }
      if (b.y + b.groesse < -160)       { blueten[i] = neueBluete(false); blueten[i].y = hoehe + 20; continue; }
      if (b.x < -60)          b.x = breite + 40;
      if (b.x > breite + 60)  b.x = -40;

      var c = b.farbe;
      var farbe = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',';

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.winkel);
      // weicher Schein als Umrandung
      ctx.shadowColor = farbe + (b.deckkraft * 0.85) + ')';
      ctx.shadowBlur = EINST.schein;
      ctx.fillStyle = farbe + b.deckkraft + ')';
      blattZeichnen(b);
      ctx.fill();
      // zarte Mittellinie, damit es nach Blütenblatt aussieht
      ctx.shadowBlur = 0;
      ctx.strokeStyle = farbe + (b.deckkraft * 0.5) + ')';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -b.groesse * 0.8);
      ctx.lineTo(0, b.groesse * 0.8);
      ctx.stroke();
      ctx.restore();
    }

    scrollDelta *= 0.90;          // Scroll-Schub klingt weich aus
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
    umbauWartet = setTimeout(aufbauen, 200);
  });

  // Im Hintergrundtab anhalten, spart Strom
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { laeuft = false; }
    else if (!laeuft) { laeuft = true; requestAnimationFrame(bild); }
  });

  function start() {
    document.body.appendChild(canvas);
    aufbauen();
    requestAnimationFrame(bild);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();
