/* =========================================================================
   THE CONFEDERATION PROBLEM — Supabase backend

   Plain fetch against PostgREST. No client library and no CDN script, so
   there is nothing extra for a school filter to block and nothing to keep
   up to date.

   Every read goes through one polling loop shared by the whole page: it
   asks for a few-byte fingerprint about once a second and only pulls the
   full session when that fingerprint moves. A quiet classroom costs almost
   no bandwidth; a busy one updates in about a second.
   ========================================================================= */
(function () {
  "use strict";

  var CFG = (window.AOC_CONFIG && window.AOC_CONFIG.supabase) || {};

  // Supabase shows the project URL in a few places, and the one on the API
  // settings page ends with /rest/v1/. Accept either form rather than
  // building requests to .../rest/v1/rest/v1/rpc/...
  function normalizeUrl(u) {
    return String(u || "").trim()
      .replace(/\/+$/, "")
      .replace(/\/rest\/v1$/i, "")
      .replace(/\/+$/, "");
  }

  var URL_BASE = normalizeUrl(CFG.url);
  var KEY = String(CFG.anonKey || "").trim();

  // The placeholders in config.js are non-empty strings, so a bare truthiness
  // check would call an untouched project "configured" and then fail on the
  // first request with something unreadable.
  function configured() {
    return /^https:\/\/[^\s]+\.supabase\.(co|in)$/.test(URL_BASE) &&
           KEY.length > 20 &&
           !/PASTE_/.test(URL_BASE + KEY);
  }

  function rpc(fn, args) {
    if (!configured()) {
      return Promise.reject(new Error(
        "Supabase is not configured. Open assets/config.js and paste your " +
        "project URL and anon key."));
    }
    return fetch(URL_BASE + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: {
        "apikey": KEY,
        "Authorization": "Bearer " + KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(args || {})
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error("Supabase " + r.status + ": " + t.slice(0, 300));
        });
      }
      return r.status === 204 ? null : r.json();
    });
  }

  function makeCode() {
    // No vowels, no 0/O/1/I — these get read aloud across a classroom.
    var A = "BCDFGHJKLMNPQRSTVWXYZ23456789", s = "";
    for (var i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
    return s;
  }

  /* ------------------------------------------------------------ polling
     One loop per page, however many things are listening. Subscribers are
     handed the same snapshot and each decides whether anything it cares
     about actually changed.                                              */
  var poll = {
    code: null, timer: null, pulse: null, snap: null,
    subs: { game: [], states: [], state: {} },
    last: { game: null, states: null, state: {} }
  };

  function fanOut(snap) {
    if (!snap) return;
    var game = snap.game;
    if (game) game = Object.assign({}, game, { deals: snap.deals || [] });
    var states = snap.states || [];

    // Order matters. The state rows are the data; the game document is the
    // pointer that says "now show it". Deliver the rows first, or a phase
    // flip to "tally" starts the roll call while the board still holds the
    // previous round's votes — every state reads as an abstention.
    var ss = JSON.stringify(states);
    if (ss !== poll.last.states) {
      poll.last.states = ss;
      poll.subs.states.forEach(function (cb) { try { cb(states); } catch (e) { console.error(e); } });
    }
    Object.keys(poll.subs.state).forEach(function (name) {
      var row = null;
      for (var i = 0; i < states.length; i++) if (states[i].name === name) { row = states[i]; break; }
      if (!row) return;
      var rs = JSON.stringify(row);
      if (rs === poll.last.state[name]) return;
      poll.last.state[name] = rs;
      poll.subs.state[name].forEach(function (cb) { try { cb(row); } catch (e) { console.error(e); } });
    });

    var gs = JSON.stringify(game);
    if (game && gs !== poll.last.game) {
      poll.last.game = gs;
      poll.subs.game.forEach(function (cb) { try { cb(game); } catch (e) { console.error(e); } });
    }
  }

  var INTERVAL = 950;

  function tick() {
    if (!poll.code) return;
    rpc("aoc_pulse", { p_code: poll.code }).then(function (p) {
      if (p === poll.pulse) return null;
      poll.pulse = p;
      return rpc("aoc_snapshot", { p_code: poll.code }).then(function (snap) {
        poll.snap = snap;
        fanOut(snap);
      });
    }).catch(function (e) {
      // A dropped request on classroom wifi is normal; the next tick retries.
      console.warn("sync retry:", e.message);
    });
  }

  function ensurePolling(code) {
    if (poll.code !== code) {
      poll.code = code;
      poll.pulse = null;
      poll.last = { game: null, states: null, state: {} };
    }
    if (!poll.timer) {
      poll.timer = setInterval(tick, INTERVAL);
      tick();
    }
  }

  // After we write something, don't make the room wait a second to see it.
  function nudge() { poll.pulse = null; setTimeout(tick, 60); }

  function unsub(list, cb) {
    return function () {
      var i = list.indexOf(cb);
      if (i >= 0) list.splice(i, 1);
    };
  }

  /* -------------------------------------------------------------- api */
  var NET = {
    createGame: function (studentStateNames, opts) {
      var code = makeCode();
      var game = {
        status: "lobby", round: -1, phase: "lobby",
        stability: 60, nationalTreasury: 0,
        studentStates: studentStateNames,
        absent: [], history: [], result: null, caucusEndsAt: null,
        settings: opts || {}, createdAt: Date.now()
      };
      var states = window.AOC.STATES.map(function (s) {
        return {
          name: s.name, abbr: s.abbr,
          isBot: studentStateNames.indexOf(s.name) === -1,
          players: [], interest: 50, treasuryNow: s.treasury,
          votes: {}, payments: {}
        };
      });
      return rpc("aoc_create_game", { p_code: code, p_game: game, p_states: states })
        .then(function () { return code; });
    },

    updateGame: function (code, patch) {
      return rpc("aoc_patch_game", { p_code: code, p_patch: patch }).then(nudge);
    },
    updateState: function (code, name, patch) {
      return rpc("aoc_patch_state", { p_code: code, p_name: name, p_patch: patch }).then(nudge);
    },
    batchStates: function (code, updates) {
      return rpc("aoc_patch_states", { p_code: code, p_updates: updates }).then(nudge);
    },
    endGame: function (code) {
      return NET.updateGame(code, { status: "ended", phase: "debrief" });
    },

    findGame: function (code) {
      return rpc("aoc_snapshot", { p_code: code }).then(function (snap) {
        if (!snap || !snap.game) return null;
        return Object.assign({}, snap.game, { deals: snap.deals || [] });
      });
    },
    listStates: function (code) {
      return rpc("aoc_snapshot", { p_code: code }).then(function (snap) {
        return (snap && snap.states) || [];
      });
    },

    claimState: function (code, name, players) {
      return NET.updateState(code, name, { players: players, isBot: false, claimed: true });
    },
    releaseState: function (code, name) {
      return NET.updateState(code, name, { players: [], isBot: true, claimed: false });
    },
    castVote: function (code, name, round, vote) {
      var p = {}; p["votes." + round] = vote;
      return NET.updateState(code, name, p);
    },
    setPayment: function (code, name, round, choice, amount) {
      var p = {}; p["payments." + round] = { choice: choice, paid: amount };
      return NET.updateState(code, name, p);
    },

    pushDeal: function (code, deal) {
      return rpc("aoc_push_deal", { p_code: code, p_deal: deal }).then(nudge);
    },
    updateDeals: function (code, deals) {
      return rpc("aoc_replace_deals", { p_code: code, p_deals: deals }).then(nudge);
    },

    onGame: function (code, cb) {
      ensurePolling(code);
      poll.subs.game.push(cb);
      if (poll.snap && poll.snap.game) {
        cb(Object.assign({}, poll.snap.game, { deals: poll.snap.deals || [] }));
      }
      return unsub(poll.subs.game, cb);
    },
    onStates: function (code, cb) {
      ensurePolling(code);
      poll.subs.states.push(cb);
      if (poll.snap) cb(poll.snap.states || []);
      return unsub(poll.subs.states, cb);
    },
    onState: function (code, name, cb) {
      ensurePolling(code);
      (poll.subs.state[name] = poll.subs.state[name] || []).push(cb);
      return unsub(poll.subs.state[name], cb);
    },

    isConfigured: configured,
    boot: function () { return Promise.resolve(); }
  };

  (window.AOC_NET_IMPLS = window.AOC_NET_IMPLS || {}).supabase = NET;
})();
