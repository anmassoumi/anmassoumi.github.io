(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var root = document.documentElement;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---- Scroll rule ---- */
  var rail = document.createElement("div");
  rail.className = "scroll-rule";
  var fill = document.createElement("div");
  fill.className = "scroll-rule__fill";
  rail.appendChild(fill);
  document.body.appendChild(rail);

  function updateScrollRule() {
    var max = root.scrollHeight - root.clientHeight;
    var pct = max > 0 ? (root.scrollTop / max) * 100 : 0;
    fill.style.width = pct + "%";
  }
  document.addEventListener("scroll", updateScrollRule, { passive: true });
  window.addEventListener("resize", updateScrollRule);
  updateScrollRule();

  /* ---- Shared state ---- */
  var pointer = { x: -999, y: -999, active: false };
  var hoverEl = null;      // the element the anteater is currently "on"
  var cursorEl = null;     // the anteater (desktop only)
  var hitNode = null;      // the node whose box counts as "the anteater's body"

  /* ======================================================================
     ANTEATER CURSOR (desktop, fine pointer only)
     The snout tip is the pointer's hotspot. The whole body counts for
     hovering: anything the anteater overlaps gets selected and clicked.
     ====================================================================== */

  // Optional: use your own artwork instead of the built-in drawing.
  //   ANTEATER_IMAGE   path to the image
  //   ANTEATER_HOTSPOT [x, y] pixel position of the snout tip inside the image
  //   ANTEATER_FACES   which way the artwork faces: "left" or "right"
  // Only use artwork you have the rights to use on your site.
  var ANTEATER_IMAGE = "";
  var ANTEATER_HOTSPOT = [0, 0];
  var ANTEATER_FACES = "left";

  var ANTEATER_SVG =
    '<svg width="1" height="1" aria-hidden="true">' +
      '<defs><clipPath id="anteaterBodyClip"><path d="M2 18.5C3.5 16.5 12 12.5 21 10.5C26 5.5 38 4.5 46 8.5C52 11 56 15 57 19C56 26 51 29 44 29L28 29C24 28 21.5 24.5 20.5 21.5C13 21.5 6 20.5 2 18.5Z"/></clipPath></defs>' +
      '<g transform="scale(0.8) translate(-2.2,-18.5)">' +
        '<path class="a-shape a-tail" d="M50 11C59 6 70 10 74 21C76.5 28 75 34 71 37.5C70 32 66 28 60 26C54 24 49 19 50 11Z"/>' +
        '<path class="a-fur" d="M56 14C62 13 68 16 71 22M55 18C61 18 66 22 68 28"/>' +
        '<rect class="a-shape a-leg-far a-leg-a" x="22" y="26" width="4.6" height="9" rx="2"/>' +
        '<rect class="a-shape a-leg-far a-leg-b" x="46" y="26" width="4.6" height="9" rx="2"/>' +
        '<path class="a-shape a-body" d="M2 18.5C3.5 16.5 12 12.5 21 10.5C26 5.5 38 4.5 46 8.5C52 11 56 15 57 19C56 26 51 29 44 29L28 29C24 28 21.5 24.5 20.5 21.5C13 21.5 6 20.5 2 18.5Z"/>' +
        '<path class="a-stripe" clip-path="url(#anteaterBodyClip)" d="M27 30L37 4L42 5L32 30Z"/>' +
        '<path class="a-line" d="M2 18.5C3.5 16.5 12 12.5 21 10.5C26 5.5 38 4.5 46 8.5C52 11 56 15 57 19C56 26 51 29 44 29L28 29C24 28 21.5 24.5 20.5 21.5C13 21.5 6 20.5 2 18.5Z"/>' +
        '<rect class="a-shape a-leg-near a-leg-b" x="28" y="26" width="4.6" height="10" rx="2"/>' +
        '<rect class="a-shape a-leg-near a-leg-a" x="40" y="26" width="4.6" height="10" rx="2"/>' +
        '<circle class="a-shape a-ear" cx="23" cy="9.6" r="2.6"/>' +
        '<circle class="a-shape a-eye" cx="13.6" cy="14.6" r="2.4"/>' +
        '<circle class="a-pupil" cx="12.8" cy="14.9" r="1"/>' +
        '<path class="a-tongue" d="M2 18.7H-10"/>' +
        '<circle class="a-nose" cx="2.6" cy="18.4" r="1.3"/>' +
      '</g>' +
    '</svg>';

  var INTERACTIVE = "a[href], button, label, .btn";
  var interactive = [];

  if (finePointer && !reduceMotion) {
    document.body.classList.add("has-cad-cursor");

    cursorEl = document.createElement("div");
    cursorEl.className = "anteater-cursor";
    var flip = document.createElement("div");
    flip.className = "anteater-flip";
    if (ANTEATER_IMAGE) {
      var img = document.createElement("img");
      img.src = ANTEATER_IMAGE;
      img.alt = "";
      img.style.left = -ANTEATER_HOTSPOT[0] + "px";
      img.style.top = -ANTEATER_HOTSPOT[1] + "px";
      flip.appendChild(img);
      hitNode = img;
    } else {
      flip.innerHTML = ANTEATER_SVG;
      hitNode = flip.querySelector("svg > g");
    }
    cursorEl.appendChild(flip);
    document.body.appendChild(cursorEl);

    var artFacesRight = ANTEATER_IMAGE ? ANTEATER_FACES === "right" : false;
    var lastX = 0;
    var facingRight = false;
    var stopTimer = null;

    interactive = Array.prototype.slice.call(document.querySelectorAll(INTERACTIVE));

    document.addEventListener("mousemove", function (e) {
      var x = e.clientX, y = e.clientY;
      pointer.x = x; pointer.y = y; pointer.active = true;
      cursorEl.style.transform = "translate(" + x + "px," + y + "px)";

      // Turn to face the direction of travel (dead-zone avoids jitter)
      var dx = x - lastX;
      lastX = x;
      if ((dx > 3 && !facingRight) || (dx < -3 && facingRight)) {
        facingRight = dx > 0;
        flip.style.transform = facingRight !== artFacesRight ? "scaleX(-1)" : "scaleX(1)";
      }

      // Walk while moving; stand still shortly after the mouse stops
      cursorEl.classList.add("is-visible", "is-moving");
      clearTimeout(stopTimer);
      stopTimer = setTimeout(function () {
        cursorEl.classList.remove("is-moving");
      }, 110);
    });

    root.addEventListener("mouseleave", function () {
      pointer.active = false;
      cursorEl.classList.remove("is-visible", "is-moving");
    });

    // If the anteater's body is over something but the snout isn't, the real
    // click lands elsewhere — so pass the click on to what the anteater selected.
    document.addEventListener("click", function (e) {
      if (!hoverEl || hoverEl.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      hoverEl.click();
    }, true);
  }

  /* Decide which clickable thing the anteater is "on": whatever is under the
     snout, otherwise whichever thing its body overlaps the most. */
  function updateHover() {
    if (!cursorEl) return;
    var next = null;

    if (pointer.active) {
      var under = document.elementFromPoint(pointer.x, pointer.y);
      var direct = under && under.closest ? under.closest(INTERACTIVE) : null;
      if (direct) {
        next = direct;
      } else if (hitNode) {
        var b = hitNode.getBoundingClientRect();
        var best = 0;
        for (var i = 0; i < interactive.length; i++) {
          var el = interactive[i];
          var r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          var w = Math.min(r.right, b.right) - Math.max(r.left, b.left);
          var h = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
          if (w <= 0 || h <= 0 || w * h < 100) continue;
          // Ignore things hidden under something else (e.g. the sticky nav)
          var top = document.elementFromPoint(
            Math.max(r.left, b.left) + w / 2,
            Math.max(r.top, b.top) + h / 2
          );
          if (!top || !(el === top || el.contains(top))) continue;
          if (w * h > best) { best = w * h; next = el; }
        }
      }
    }

    if (next !== hoverEl) {
      if (hoverEl) hoverEl.classList.remove("is-hovered");
      hoverEl = next;
      if (hoverEl) hoverEl.classList.add("is-hovered");
      cursorEl.classList.toggle("is-active", !!hoverEl); // tongue out
    }
  }

  /* ======================================================================
     ANTS — they wander the screen; the anteater eats any his snout reaches.
     On touch screens, tap an ant to squish it.
     ====================================================================== */
  var ANT_SVG =
    '<svg width="14" height="9" viewBox="0 0 14 9" aria-hidden="true">' +
      '<path class="ant-legs ant-legs-a" d="M8.2 3.6L10 1.2M6.5 3.6L4.8 1.4M7.3 5.7L7 8.2"/>' +
      '<path class="ant-legs ant-legs-b" d="M7.3 3.3L7 0.8M8.2 5.4L10 7.8M6.5 5.4L4.8 7.6"/>' +
      '<path class="ant-feel" d="M11.5 3.7L13.3 2.2M11.5 5.3L13.3 6.8"/>' +
      '<ellipse class="ant-body" cx="3.3" cy="4.5" rx="3.1" ry="2.3"/>' +
      '<ellipse class="ant-body" cx="7.3" cy="4.5" rx="1.7" ry="1.4"/>' +
      '<circle class="ant-body" cx="10.3" cy="4.5" r="1.6"/>' +
    '</svg>';

  var ANT_TOTAL = finePointer ? 8 : 5;
  var EAT_RADIUS = 26;
  var PANIC_RADIUS = 110;
  var ants = [];
  var eaten = 0;

  function spawnAnt(fromEdge) {
    var w = window.innerWidth, h = window.innerHeight, x, y, heading;
    if (fromEdge) {
      var side = Math.floor(Math.random() * 4);
      if (side === 0)      { x = -14;    y = Math.random() * h; heading = 0; }
      else if (side === 1) { x = w + 14; y = Math.random() * h; heading = Math.PI; }
      else if (side === 2) { x = Math.random() * w; y = -14;    heading = Math.PI / 2; }
      else                 { x = Math.random() * w; y = h + 14; heading = -Math.PI / 2; }
      heading += (Math.random() - 0.5) * 0.8;
    } else {
      x = 30 + Math.random() * Math.max(1, w - 60);
      y = 30 + Math.random() * Math.max(1, h - 60);
      heading = Math.random() * Math.PI * 2;
    }
    var el = document.createElement("div");
    el.className = "ant";
    el.innerHTML = ANT_SVG;
    document.body.appendChild(el);
    var ant = {
      el: el, x: x, y: y, heading: heading,
      speed: 26 + Math.random() * 22,
      turn: 0, turnT: 0, pause: 0, paused: false,
      entered: !fromEdge, eaten: false
    };
    ants.push(ant);
    return ant;
  }

  function pop(x, y, text) {
    var p = document.createElement("div");
    p.className = "ant-pop";
    p.textContent = text;
    p.style.left = x + "px";
    p.style.top = y + "px";
    document.body.appendChild(p);
    p.addEventListener("animationend", function () { p.remove(); });
  }

  function eatAnt(ant, tx, ty) {
    ant.eaten = true;
    ant.el.style.transition = "transform 0.16s ease-in, opacity 0.16s ease-in";
    ant.el.style.transform =
      "translate(" + tx + "px," + ty + "px) rotate(" + ant.heading + "rad) translate(-50%,-50%) scale(0.1)";
    ant.el.style.opacity = "0";
    setTimeout(function () {
      ant.el.remove();
      var i = ants.indexOf(ant);
      if (i > -1) ants.splice(i, 1);
    }, 220);
    setTimeout(function () { spawnAnt(true); }, 2200 + Math.random() * 2000);

    eaten++;
    var big = eaten % 5 === 0;
    pop(tx, ty - 6, "zot! zot! zot!");

    if (cursorEl) {
      cursorEl.classList.add("is-eating");
      setTimeout(function () { cursorEl.classList.remove("is-eating"); }, 220);
      if (big) {
        cursorEl.classList.add("is-happy");
        setTimeout(function () { cursorEl.classList.remove("is-happy"); }, 520);
      }
    }
  }

  function angleDiff(a, b) {
    var d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function updateAnts(dt) {
    var w = window.innerWidth, h = window.innerHeight, m = 26;
    var chasing = !!cursorEl && pointer.active;

    for (var i = 0; i < ants.length; i++) {
      var a = ants[i];
      if (a.eaten) continue;

      // Wander: pick a new gentle turn now and then, sometimes stop to sniff
      a.turnT -= dt;
      if (a.turnT <= 0) {
        a.turn = (Math.random() - 0.5) * 3.2;
        a.turnT = 0.4 + Math.random() * 1.1;
        if (Math.random() < 0.14) a.pause = 0.35 + Math.random() * 0.8;
      }
      var paused = a.pause > 0;
      if (paused) a.pause -= dt;
      if (paused !== a.paused) { a.paused = paused; a.el.classList.toggle("is-paused", paused); }

      var speed = paused ? 0 : a.speed;

      if (chasing) {
        var dx = a.x - pointer.x, dy = a.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < EAT_RADIUS * EAT_RADIUS) { eatAnt(a, pointer.x, pointer.y); continue; }
        if (d2 < PANIC_RADIUS * PANIC_RADIUS) { speed *= 2.2; a.pause = 0; }
      }

      a.heading += a.turn * dt;

      // Stay on screen: once inside, drift back toward the middle near the edges
      var inside = a.x > m && a.x < w - m && a.y > m && a.y < h - m;
      if (inside) a.entered = true;
      if (a.entered && !inside) {
        var want = Math.atan2(h / 2 - a.y, w / 2 - a.x);
        a.heading += angleDiff(a.heading, want) * Math.min(1, dt * 3);
      }

      a.x += Math.cos(a.heading) * speed * dt;
      a.y += Math.sin(a.heading) * speed * dt;
      a.el.style.transform =
        "translate(" + a.x.toFixed(1) + "px," + a.y.toFixed(1) + "px) rotate(" +
        a.heading.toFixed(3) + "rad) translate(-50%,-50%)";
    }
  }

  if (!reduceMotion) {
    for (var n = 0; n < ANT_TOTAL; n++) {
      (function (delay) { setTimeout(function () { spawnAnt(true); }, delay); })(700 + n * 650);
    }
    // Touch: tap an ant to squish it
    document.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      var best = null, bestD = 36 * 36;
      ants.forEach(function (a) {
        if (a.eaten) return;
        var d2 = (a.x - e.clientX) * (a.x - e.clientX) + (a.y - e.clientY) * (a.y - e.clientY);
        if (d2 < bestD) { bestD = d2; best = a; }
      });
      if (best) eatAnt(best, e.clientX, e.clientY);
    }, { passive: true });
  }

  /* ======================================================================
     HEADING LETTERS — swell, lift and turn blue as the pointer nears them
     ====================================================================== */
  var HEADING_WAVE = true; // set to false to switch the heading letter effect off
  var hosts = [];
  if (HEADING_WAVE && finePointer && !reduceMotion) {
    Array.prototype.forEach.call(document.querySelectorAll(".hero h1, .page-head h1"), function (h) {
      var label = Array.prototype.map.call(h.childNodes, function (n) {
        return n.nodeType === 3 ? n.textContent : " "; // <br> becomes a space
      }).join("").replace(/\s+/g, " ").trim();
      h.setAttribute("aria-label", label);
      var host = { el: h, letters: [], settled: true };
      Array.prototype.slice.call(h.childNodes).forEach(function (node) {
        if (node.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        var text = node.textContent;
        for (var i = 0; i < text.length; i++) {
          var chr = text.charAt(i);
          if (/\s/.test(chr)) { frag.appendChild(document.createTextNode(chr)); continue; }
          var span = document.createElement("span");
          span.className = "ch";
          span.setAttribute("aria-hidden", "true");
          span.textContent = chr;
          frag.appendChild(span);
          host.letters.push({ el: span, dy: 0, sc: 1, rot: 0, t: 0 });
        }
        h.replaceChild(frag, node);
      });
      if (host.letters.length) hosts.push(host);
    });
  }

  function updateLetters(dt) {
    var k = 1 - Math.exp(-dt * 14);
    for (var hI = 0; hI < hosts.length; hI++) {
      var host = hosts[hI];
      var hr = host.el.getBoundingClientRect();
      var near = pointer.active &&
        pointer.x > hr.left - 160 && pointer.x < hr.right + 160 &&
        pointer.y > hr.top - 160 && pointer.y < hr.bottom + 160;
      if (!near && host.settled) continue;

      var L, i, rects = [];
      for (i = 0; i < host.letters.length; i++) rects.push(host.letters[i].el.getBoundingClientRect());

      var still = true;
      for (i = 0; i < host.letters.length; i++) {
        L = host.letters[i];
        var r = rects[i];
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2 - L.dy; // undo current lift to get the resting centre
        var t = 0;
        if (near) {
          var d = Math.sqrt((pointer.x - cx) * (pointer.x - cx) + (pointer.y - cy) * (pointer.y - cy));
          t = clamp(1 - d / 140, 0, 1);
          t = t * t * (3 - 2 * t);
        }
        var tRot = near ? clamp((cx - pointer.x) / 140, -1, 1) * t * 6 : 0;
        L.dy += (-t * 8 - L.dy) * k;
        L.sc += (1 + t * 0.1 - L.sc) * k;
        L.rot += (tRot - L.rot) * k;
        L.t += (t - L.t) * k;
        L.el.style.transform =
          "translateY(" + L.dy.toFixed(2) + "px) scale(" + L.sc.toFixed(3) + ") rotate(" + L.rot.toFixed(2) + "deg)";
        L.el.style.setProperty("--t", L.t.toFixed(3));
        if (Math.abs(L.dy) > 0.05 || Math.abs(L.sc - 1) > 0.002) still = false;
      }
      host.settled = !near && still;
    }
  }

  /* ======================================================================
     SCROLL REVEAL — things glide up into place as they enter the screen
     ====================================================================== */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll(
      ".section-label, .panel, .about-figure, .about-copy p, .resume-wrap, .title-block > div, .footer-meta"
    );
    if (revealEls.length) {
      root.classList.add("js-reveal");
      Array.prototype.forEach.call(revealEls, function (el) { el.classList.add("reveal"); });
      var io = new IntersectionObserver(function (entries) {
        var batch = 0;
        entries.forEach(function (entry) {
          // Reveal anything on screen, or already scrolled past
          if (!entry.isIntersecting && entry.boundingClientRect.top > 0) return;
          io.unobserve(entry.target);
          var delay = Math.min(batch, 6) * 70; // stagger items that arrive together
          batch++;
          setTimeout(function () { entry.target.classList.add("is-in"); }, delay);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
      Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
    }
  }

  /* ---- One animation loop drives everything above ---- */
  if (!reduceMotion) {
    var last = performance.now();
    (function frame(now) {
      var dt = clamp((now - last) / 1000, 0.001, 0.05);
      last = now;
      updateHover();
      updateLetters(dt);
      updateAnts(dt);
      requestAnimationFrame(frame);
    })(last);
  }
})();
