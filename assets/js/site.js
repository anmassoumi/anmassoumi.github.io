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

  /* ---- Drafting cursor + coordinate readout (desktop, fine pointer only) ---- */
  if (finePointer && !reduceMotion) {
    document.body.classList.add("has-cad-cursor");

    var dot = document.createElement("div");
    dot.className = "cad-cursor-dot";
    var ring = document.createElement("div");
    ring.className = "cad-cursor-ring";
    var readout = document.createElement("div");
    readout.className = "coord-readout";
    readout.innerHTML = 'X <b id="cadX">000</b>&nbsp;&nbsp;Y <b id="cadY">000</b>';
    document.body.append(dot, ring, readout);

    var xEl = readout.querySelector("#cadX");
    var yEl = readout.querySelector("#cadY");

    var ringX = 0, ringY = 0, targetX = 0, targetY = 0;
    var shown = false;

    function pad(n) {
      n = Math.max(0, Math.round(n));
      return n < 10 ? "00" + n : n < 100 ? "0" + n : "" + n;
    }

    document.addEventListener("mousemove", function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      dot.style.transform = "translate(" + targetX + "px," + targetY + "px) translate(-50%,-50%)";
      xEl.textContent = pad(targetX);
      yEl.textContent = pad(targetY);
      if (!shown) {
        shown = true;
        readout.classList.add("is-visible");
      }
    });

    document.addEventListener("mouseleave", function () {
      readout.classList.remove("is-visible");
    });

    function tick() {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      ring.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%,-50%)";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    var hoverTargets = document.querySelectorAll("a, button, .btn, input, label");
    hoverTargets.forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-active"); });
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
})();(function () {
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

  /* ---- Drafting cursor + coordinate readout (desktop, fine pointer only) ---- */
  if (finePointer && !reduceMotion) {
    document.body.classList.add("has-cad-cursor");

    var dot = document.createElement("div");
    dot.className = "cad-cursor-dot";
    var ring = document.createElement("div");
    ring.className = "cad-cursor-ring";
    var readout = document.createElement("div");
    readout.className = "coord-readout";
    readout.innerHTML = 'X <b id="cadX">000</b>&nbsp;&nbsp;Y <b id="cadY">000</b>';
    document.body.append(dot, ring, readout);

    var xEl = readout.querySelector("#cadX");
    var yEl = readout.querySelector("#cadY");

    var ringX = 0, ringY = 0, targetX = 0, targetY = 0;
    var shown = false;

    function pad(n) {
      n = Math.max(0, Math.round(n));
      return n < 10 ? "00" + n : n < 100 ? "0" + n : "" + n;
    }

    document.addEventListener("mousemove", function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      dot.style.transform = "translate(" + targetX + "px," + targetY + "px) translate(-50%,-50%)";
      xEl.textContent = pad(targetX);
      yEl.textContent = pad(targetY);
      if (!shown) {
        shown = true;
        readout.classList.add("is-visible");
      }
    });

    document.addEventListener("mouseleave", function () {
      readout.classList.remove("is-visible");
    });

    function tick() {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      ring.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%,-50%)";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    var hoverTargets = document.querySelectorAll("a, button, .btn, input, label");
    hoverTargets.forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-active"); });
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
