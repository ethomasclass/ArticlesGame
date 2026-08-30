/* =========================================================================
   THE CONFEDERATION PROBLEM — backend selector

   Picks whichever backend assets/config.js names and exposes it as
   window.NET. Both backends present the same handful of methods, so no
   other file in the project knows or cares which one is running.
   ========================================================================= */
(function () {
  "use strict";

  var want = (window.AOC_CONFIG && window.AOC_CONFIG.backend) || "supabase";
  var impls = window.AOC_NET_IMPLS || {};
  var chosen = impls[want];

  if (!chosen) {
    var available = Object.keys(impls);
    chosen = impls[available[0]];
    if (chosen) {
      console.warn('Backend "' + want + '" is not loaded; using "' + available[0] + '".');
    }
  }

  if (!chosen) {
    // Fail loudly and in plain English rather than with a null reference
    // twenty lines later.
    var msg = "No backend loaded. Check that assets/config.js and the " +
              "net-*.js files are included before net.js.";
    chosen = new Proxy({}, { get: function () {
      return function () { return Promise.reject(new Error(msg)); };
    }});
    console.error(msg);
  }

  window.NET = chosen;
  window.NET.backendName = want;

  // A misconfigured project should say so on the setup screen, not fail
  // silently the moment a teacher tries to create a session.
  if (want === "supabase" && chosen.isConfigured && !chosen.isConfigured()) {
    document.addEventListener("DOMContentLoaded", function () {
      var host = document.querySelector(".wrap, .wrap-wide, body");
      if (!host) return;
      var d = document.createElement("div");
      d.className = "card";
      d.style.cssText = "border-color:#8a2019;border-width:3px";
      d.innerHTML =
        '<h2 style="color:#8a2019">Supabase is not set up yet</h2>' +
        '<p class="lede">Open <strong>assets/config.js</strong> and paste your ' +
        'project URL and anon public key. Both are in Supabase under ' +
        '<strong>Project Settings &rarr; API</strong>.</p>' +
        '<p class="small muted">You also need to run <strong>supabase-setup.sql</strong> ' +
        'once in the Supabase SQL Editor. Until both are done, sessions cannot be created.</p>';
      host.insertBefore(d, host.firstChild);
    });
  }
})();
