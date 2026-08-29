/* =========================================================================
   THE CONFEDERATION PROBLEM — the map board
   Draws the thirteen states and reveals a vote across them one at a time.
   Used by the teacher's projector view and by solo mode.
   ========================================================================= */
(function () {
  "use strict";
  var M = window.AOC_MAP, D = window.AOC;

  var ABBR = {};
  D.STATES.forEach(function (s) { ABBR[s.name] = s.abbr; });

  var VOTE_CLASS = { Yes: "v-yes", No: "v-no", Abstain: "v-abstain" };
  var PAY_CLASS  = { full: "p-full", half: "p-half", none: "p-none" };
  var PAY_LABEL  = { full: "PAID", half: "HALF", none: "NOTHING" };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ------------------------------------------------------------- markup */
  function build(container) {
    var svg = '<svg class="aoc-map" viewBox="' + (M.viewBox || ("0 0 " + M.width + " " + M.height)) +
              '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of the thirteen states">';

    svg += '<defs>' +
      '<pattern id="hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">' +
        '<rect width="8" height="8" fill="#c8912f"/>' +
        '<line x1="0" y1="0" x2="0" y2="8" stroke="#8f6413" stroke-width="4"/>' +
      '</pattern>' +
      '<filter id="mapshadow" x="-8%" y="-8%" width="120%" height="120%">' +
        '<feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity=".28"/>' +
      '</filter>' +
    '</defs>';

    // Leader lines first so shapes and chips sit on top.
    svg += '<g class="leaders">';
    Object.keys(M.states).forEach(function (name) {
      var s = M.states[name];
      if (!s.chipX) return;
      svg += '<line class="leader" data-state="' + esc(name) + '" x1="' + s.ax + '" y1="' + s.ay +
             '" x2="' + (s.chipX - 6) + '" y2="' + s.chipY + '"/>';
    });
    svg += '</g>';

    svg += '<g class="shapes" filter="url(#mapshadow)">';
    Object.keys(M.states).forEach(function (name) {
      var s = M.states[name];
      svg += '<g class="st' + (s.neutral ? " neutral" : "") + '" data-state="' + esc(name) + '">' +
               '<path class="shape" d="' + s.d + '"/>' +
             '</g>';
    });
    svg += '</g>';

    // Labels for the roomy states go inside the shape.
    svg += '<g class="inlabels">';
    Object.keys(M.states).forEach(function (name) {
      var s = M.states[name];
      if (s.chipX) return;
      if (s.neutral) {
        svg += '<g class="inlabel neutral" data-state="' + esc(name) + '">' +
               '<text class="ab" x="' + s.ax + '" y="' + (s.ay - 2) + '">VT</text>' +
               '<text class="sub" x="' + s.ax + '" y="' + (s.ay + 16) + '">not a state</text></g>';
        return;
      }
      svg += '<g class="inlabel" data-state="' + esc(name) + '">' +
             '<text class="ab" x="' + s.ax + '" y="' + s.ay + '">' + ABBR[name] + '</text>' +
             '<text class="vt" x="' + s.ax + '" y="' + (s.ay + 27) + '"></text></g>';
    });
    svg += '</g>';

    // Cramped states get a chip out in the Atlantic.
    svg += '<g class="chips">';
    Object.keys(M.states).forEach(function (name) {
      var s = M.states[name];
      if (!s.chipX) return;
      svg += '<g class="chip" data-state="' + esc(name) + '" transform="translate(' + s.chipX + ',' + s.chipY + ')">' +
               '<rect class="chipbg" x="0" y="-27" rx="8" width="186" height="54"/>' +
               '<text class="ab" x="13" y="8">' + ABBR[name] + '</text>' +
               '<text class="nm" x="60" y="-3">' + esc(name) + '</text>' +
               '<text class="vt" x="60" y="17"></text>' +
             '</g>';
    });
    svg += '</g>';

    svg += '</svg>';
    container.innerHTML = svg;
    return container.querySelector(".aoc-map");
  }

  /* ------------------------------------------------------------- update */
  function paint(root, rows, mode) {
    rows.forEach(function (r) {
      var sel = '[data-state="' + r.name.replace(/"/g, '\\"') + '"]';
      var nodes = root.querySelectorAll(sel);
      var cls = "st";
      var label = "";

      if (r.absent) {
        cls += " absent"; label = "NO DELEGATE";
      } else if (mode === "payment" && r.payment) {
        cls += " " + PAY_CLASS[r.payment]; label = PAY_LABEL[r.payment];
      } else if (mode === "votes" && r.vote) {
        cls += " " + VOTE_CLASS[r.vote]; label = r.vote.toUpperCase();
      } else if (mode === "voting") {
        if (r.vote) { cls += " sealed"; label = "VOTE SEALED"; }
        else { cls += " pending"; label = r.isBot ? "" : "WAITING"; }
      }
      if (r.isYou) cls += " you";
      if (r.isBot) cls += " bot";

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.classList.contains("leader")) continue;
        // keep the element's own base class, swap the state classes
        var base = n.classList.contains("chip") ? "chip"
                 : (n.classList.contains("inlabel") ? "inlabel" : "st");
        n.setAttribute("class", base + " " + cls.replace(/^st\s*/, ""));
        var vt = n.querySelector(".vt");
        if (vt) vt.textContent = label;
      }
    });
  }

  /* --------------------------------------------------------- the reveal
     Votes land one state at a time so the room can react. Order runs
     north to south, which is also roughly the order the clerk called
     the roll in the Confederation Congress.                              */
  var ROLL_ORDER = ["New Hampshire","Massachusetts","Rhode Island","Connecticut","New York",
                    "New Jersey","Pennsylvania","Delaware","Maryland","Virginia",
                    "North Carolina","South Carolina","Georgia"];

  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function revealVotes(root, rows, opts) {
    opts = opts || {};
    var mode = opts.mode || "votes";
    var step = opts.step || 420;
    var onTick = opts.onTick || function () {};
    var onDone = opts.onDone || function () {};
    clearTimers();

    var byName = {};
    rows.forEach(function (r) { byName[r.name] = r; });
    var order = ROLL_ORDER.filter(function (n) { return byName[n]; });

    // start blank
    paint(root, rows.map(function (r) {
      return { name: r.name, isBot: r.isBot, isYou: r.isYou, absent: false };
    }), "blank");

    var yes = 0, no = 0, ab = 0, absent = 0;
    order.forEach(function (name, i) {
      timers.push(setTimeout(function () {
        var r = byName[name];
        paint(root, [r], mode);
        var nodes = root.querySelectorAll('[data-state="' + name.replace(/"/g,'\\"') + '"]');
        for (var k = 0; k < nodes.length; k++) {
          if (nodes[k].classList.contains("leader")) continue;
          nodes[k].classList.add("landing");
          (function (el) { setTimeout(function () { el.classList.remove("landing"); }, 620); })(nodes[k]);
        }
        if (r.absent) absent++;
        else if (r.vote === "Yes") yes++;
        else if (r.vote === "No") no++;
        else ab++;
        onTick({ name: name, row: r, yes: yes, no: no, abstain: ab, absent: absent,
                 index: i + 1, total: order.length });
        if (i === order.length - 1) timers.push(setTimeout(function () { onDone({ yes: yes, no: no, abstain: ab }); }, step));
      }, i * step));
    });
    return function cancel() { clearTimers(); };
  }

  window.AOCMAP = {
    build: build,
    paint: paint,
    revealVotes: revealVotes,
    cancel: clearTimers,
    ROLL_ORDER: ROLL_ORDER
  };
})();
