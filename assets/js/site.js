(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---- Scroll rule ---- */
  var rail = document.createElement("div");
  rail.className = "scroll-rule";
  var fill = document.createElement("div");
  fill.className = "scroll-rule__fill";
  rail.appendChild(fill);
  document.body.appendChild(rail);

  function updateScrollRule() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    fill.style.width = pct + "%";
  }
  document.addEventListener("scroll", updateScrollRule, { passive: true });
  window.addEventListener("resize", updateScrollRule);
  updateScrollRule();

  /* ---- Anteater cursor + coordinate readout (desktop, fine pointer only) ----
     The snout tip is the pointer's hotspot, so clicking is always precise. */

  // Optional: to use your own artwork instead of the built-in drawing, set the
  // image path and the pixel position of the "tip" inside that image, e.g.
  //   var ANTEATER_IMAGE = "images/my-anteater.png";
  //   var ANTEATER_HOTSPOT = [2, 20];
  // Only use artwork you have the rights to use on your site.
  var ANTEATER_IMAGE = "";
  var ANTEATER_HOTSPOT = [0, 0];

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
        '<rect class="a-shape a-leg-near a-leg-b" x="28" y="26" width="4.6" height="10" rx="2"/>' +
        '<rect class="a-shape a-leg-near a-leg-a" x="40" y="26" width="4.6" height="10" rx="2"/>' +
        '<circle class="a-ear" cx="22.5" cy="10.5" r="2"/>' +
        '<circle class="a-eye" cx="13.5" cy="15.2" r="1.1"/>' +
        '<path class="a-tongue" d="M2 18.7H-10"/>' +
        '<circle class="a-nose" cx="2.2" cy="18.5" r="1"/>' +
      '</g>' +
    '</svg>';

  if (finePointer && !reduceMotion) {
    document.body.classList.add("has-cad-cursor");

    var cursor = document.createElement("div");
    cursor.className = "anteater-cursor";
    var flip = document.createElement("div");
    flip.className = "anteater-flip";
    if (ANTEATER_IMAGE) {
      var img = document.createElement("img");
      img.src = ANTEATER_IMAGE;
      img.alt = "";
      img.style.left = -ANTEATER_HOTSPOT[0] + "px";
      img.style.top = -ANTEATER_HOTSPOT[1] + "px";
      flip.appendChild(img);
    } else {
      flip.innerHTML = ANTEATER_SVG;
    }
    cursor.appendChild(flip);

    var readout = document.createElement("div");
    readout.className = "coord-readout";
    readout.innerHTML = 'X <b id="cadX">000</b>&nbsp;&nbsp;Y <b id="cadY">000</b>';
    document.body.append(cursor, readout);

    var xEl = readout.querySelector("#cadX");
    var yEl = readout.querySelector("#cadY");

    var lastX = 0;
    var facingRight = false;
    var stopTimer = null;

    function pad(n) {
      n = Math.max(0, Math.round(n));
      return n < 10 ? "00" + n : n < 100 ? "0" + n : "" + n;
    }

    document.addEventListener("mousemove", function (e) {
      var x = e.clientX, y = e.clientY;
      cursor.style.transform = "translate(" + x + "px," + y + "px)";
      xEl.textContent = pad(x);
      yEl.textContent = pad(y);

      // Turn to face the direction of travel (small dead-zone avoids jitter)
      var dx = x - lastX;
      lastX = x;
      if (dx > 3 && !facingRight) {
        facingRight = true;
        flip.style.transform = "scaleX(-1)";
      } else if (dx < -3 && facingRight) {
        facingRight = false;
        flip.style.transform = "scaleX(1)";
      }

      // Walk while moving, stand still shortly after the mouse stops
      cursor.classList.add("is-visible", "is-moving");
      readout.classList.add("is-visible");
      clearTimeout(stopTimer);
      stopTimer = setTimeout(function () {
        cursor.classList.remove("is-moving");
      }, 110);
    });

    document.documentElement.addEventListener("mouseleave", function () {
      cursor.classList.remove("is-visible", "is-moving");
      readout.classList.remove("is-visible");
    });

    // Tongue flicks out over anything clickable
    var hoverTargets = document.querySelectorAll("a, button, .btn, input, label");
    hoverTargets.forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursor.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { cursor.classList.remove("is-active"); });
    });
  }

  /* ---- Magnetic buttons ---- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        btn.style.transition = "transform 0.08s ease-out";
        btn.style.transform = "translate(" + x * 0.22 + "px," + y * 0.28 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transition = "transform 0.35s cubic-bezier(.2,.7,.3,1)";
        btn.style.transform = "translate(0,0)";
      });
    });
  }
})();
