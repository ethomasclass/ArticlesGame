/* =========================================================================
   THE CONFEDERATION PROBLEM — the first-run tour

   A short spotlight walk around whichever screen the student is on. The page
   supplies the stops as window.AOC_TOUR_STEPS; this builds its own markup, so
   a page only needs to load the file and say when to start.
   ========================================================================= */
(function () {
  "use strict";

  var STATE = { on: false, i: 0, steps: [], root: null, doneKey: "aoc_tour_done" };

  function build() {
    if (STATE.root) return STATE.root;
    var d = document.createElement("div");
    d.id = "tour";
    d.className = "hidden";
    d.innerHTML =
      '<div class="tour-block" id="tour-block"></div>' +
      '<div class="tour-hole" id="tour-hole"></div>' +
      '<div class="tour-card" id="tour-card">' +
        '<div class="step" id="tour-step"></div>' +
        '<h4 id="tour-title"></h4>' +
        '<p id="tour-body"></p>' +
        '<div class="row">' +
          '<button class="btn sm" id="tour-next">Next</button>' +
          '<button class="skip" id="tour-skip">Skip the tour</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(d);
    d.querySelector("#tour-next").addEventListener("click", next);
    d.querySelector("#tour-skip").addEventListener("click", stop);
    d.querySelector("#tour-block").addEventListener("click", next);
    STATE.root = d;
    return d;
  }

  function visible(sel) {
    var el = document.querySelector(sel);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return (r.width > 0 && r.height > 0) ? el : null;
  }

  function start(steps) {
    var list = steps || window.AOC_TOUR_STEPS || [];
    STATE.steps = list.filter(function (s) { return visible(s.sel); });
    if (!STATE.steps.length) return false;
    build();
    STATE.on = true; STATE.i = 0;
    STATE.root.classList.remove("hidden");
    show();
    return true;
  }

  function stop() {
    STATE.on = false;
    if (STATE.root) STATE.root.classList.add("hidden");
    try { localStorage.setItem(STATE.doneKey, "1"); } catch (e) {}
  }

  function seen() {
    try { return localStorage.getItem(STATE.doneKey) === "1"; } catch (e) { return false; }
  }

  function show() {
    var st = STATE.steps[STATE.i];
    var el = visible(st.sel);
    if (!el) {
      if (STATE.i + 1 < STATE.steps.length) { STATE.i++; return show(); }
      return stop();
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Measure after the scroll settles, or the spotlight lands where the
    // element used to be.
    setTimeout(function () {
      var r = el.getBoundingClientRect(), pad = 8, root = STATE.root;
      var hole = root.querySelector("#tour-hole");
      hole.style.top    = Math.max(4, r.top - pad) + "px";
      hole.style.left   = Math.max(4, r.left - pad) + "px";
      hole.style.width  = Math.min(window.innerWidth - 8, r.width + pad * 2) + "px";
      hole.style.height = Math.min(window.innerHeight - 8, r.height + pad * 2) + "px";

      root.querySelector("#tour-step").textContent = "Step " + (STATE.i + 1) + " of " + STATE.steps.length;
      root.querySelector("#tour-title").textContent = st.title;
      root.querySelector("#tour-body").textContent = st.body;
      root.querySelector("#tour-next").textContent =
        (STATE.i === STATE.steps.length - 1) ? "Got it" : "Next";

      var card = root.querySelector("#tour-card");
      var cw = card.offsetWidth, ch = card.offsetHeight;
      var below = r.bottom + 14, above = r.top - ch - 14;
      var top = (below + ch < window.innerHeight - 8) ? below
              : (above > 8 ? above : (window.innerHeight - ch) / 2);
      // Clamp both axes. A target taller than the screen, or one sitting near
      // the bottom of a small laptop display, otherwise pushes the card out of
      // view and the tour becomes a dead end.
      top  = Math.max(8, Math.min(top, window.innerHeight - ch - 8));
      var left = Math.max(10, Math.min(r.left + r.width / 2 - cw / 2, window.innerWidth - cw - 10));
      card.style.top = top + "px";
      card.style.left = left + "px";
    }, 260);
  }

  function next() {
    if (STATE.i + 1 >= STATE.steps.length) return stop();
    STATE.i++; show();
  }

  document.addEventListener("keydown", function (e) {
    if (!STATE.on) return;
    if (e.key === "Escape") stop();
    else if (e.key === "Enter" || e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
  });
  window.addEventListener("resize", function () { if (STATE.on) show(); });

  window.AOCTOUR = {
    start: start, stop: stop, next: next, seen: seen,
    isOpen: function () { return STATE.on; }
  };
})();
