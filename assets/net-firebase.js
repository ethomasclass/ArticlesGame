/* =========================================================================
   THE CONFEDERATION PROBLEM — Firestore backend
   Classic script; loads the Firebase SDK with a dynamic import() so the
   solo/offline page can skip it entirely.

   Data model (kept deliberately shallow to stay inside the free tier):
     games/{CODE}                 phase, round, stability, treasury, deals,
                                  result, history, absent, settings
     games/{CODE}/states/{Name}   players[], isBot, interest, treasuryNow,
                                  votes{round:vote}, payments{round:choice}
   ========================================================================= */
(function () {
  "use strict";

  var CFG = (window.AOC_CONFIG && window.AOC_CONFIG.firebase) || {};

  var SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
  var ready = null, F = null;

  function boot() {
    if (ready) return ready;
    ready = Promise.all([
      import(SDK + "firebase-app.js"),
      import(SDK + "firebase-firestore.js")
    ]).then(function (mods) {
      var appMod = mods[0], fs = mods[1];
      var app = appMod.initializeApp(CFG);
      F = {
        db: fs.getFirestore(app),
        doc: fs.doc, collection: fs.collection, getDoc: fs.getDoc, getDocs: fs.getDocs,
        setDoc: fs.setDoc, updateDoc: fs.updateDoc, onSnapshot: fs.onSnapshot,
        deleteDoc: fs.deleteDoc, arrayUnion: fs.arrayUnion, writeBatch: fs.writeBatch,
        serverTimestamp: fs.serverTimestamp
      };
      return F;
    });
    return ready;
  }

  function gameRef(code) { return F.doc(F.db, "games", code); }
  function statesCol(code) { return F.collection(F.db, "games", code, "states"); }
  function stateRef(code, name) { return F.doc(F.db, "games", code, "states", name); }

  function makeCode() {
    // No vowels, no 0/O/1/I — these get read aloud across a classroom.
    var A = "BCDFGHJKLMNPQRSTVWXYZ23456789", s = "";
    for (var i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
    return s;
  }

  var NET = {
    /* --------------------------------------------------------- teacher */
    createGame: function (studentStateNames, opts) {
      return boot().then(function () {
        var code = makeCode();
        var batch = F.writeBatch(F.db);
        batch.set(gameRef(code), {
          status: "lobby",
          round: -1,
          phase: "lobby",
          stability: 60,
          nationalTreasury: 0,
          studentStates: studentStateNames,
          absent: [],
          deals: [],
          history: [],
          result: null,
          caucusEndsAt: null,
          settings: opts || {},
          createdAt: Date.now()
        });
        window.AOC.STATES.forEach(function (s) {
          batch.set(stateRef(code, s.name), {
            name: s.name,
            abbr: s.abbr,
            isBot: studentStateNames.indexOf(s.name) === -1,
            players: [],
            interest: 50,
            treasuryNow: s.treasury,
            votes: {},
            payments: {}
          });
        });
        return batch.commit().then(function () { return code; });
      });
    },

    updateGame: function (code, patch) {
      return boot().then(function () { return F.updateDoc(gameRef(code), patch); });
    },

    updateState: function (code, name, patch) {
      return boot().then(function () { return F.updateDoc(stateRef(code, name), patch); });
    },

    // Write many state docs at once (bot votes, payouts, score updates).
    batchStates: function (code, updates) {
      return boot().then(function () {
        var batch = F.writeBatch(F.db);
        updates.forEach(function (u) { batch.update(stateRef(code, u.name), u.patch); });
        return batch.commit();
      });
    },

    endGame: function (code) {
      return NET.updateGame(code, { status: "ended", phase: "debrief" });
    },

    /* --------------------------------------------------------- student */
    findGame: function (code) {
      return boot().then(function () {
        return F.getDoc(gameRef(code)).then(function (snap) {
          return snap.exists() ? snap.data() : null;
        });
      });
    },

    listStates: function (code) {
      return boot().then(function () {
        return F.getDocs(statesCol(code)).then(function (q) {
          return q.docs.map(function (d) { return d.data(); });
        });
      });
    },

    claimState: function (code, name, players) {
      return boot().then(function () {
        return F.updateDoc(stateRef(code, name), {
          players: players, isBot: false, claimed: true
        });
      });
    },

    releaseState: function (code, name) {
      return boot().then(function () {
        return F.updateDoc(stateRef(code, name), { players: [], isBot: true, claimed: false });
      });
    },

    castVote: function (code, name, round, vote) {
      return boot().then(function () {
        var p = {}; p["votes." + round] = vote;
        return F.updateDoc(stateRef(code, name), p);
      });
    },

    setPayment: function (code, name, round, choice, amount) {
      return boot().then(function () {
        var p = {};
        p["payments." + round] = { choice: choice, paid: amount };
        return F.updateDoc(stateRef(code, name), p);
      });
    },

    pushDeal: function (code, deal) {
      return boot().then(function () {
        return F.updateDoc(gameRef(code), { deals: F.arrayUnion(deal) });
      });
    },

    /* ------------------------------------------------------- listeners */
    onGame: function (code, cb) {
      var stop = function () {};
      boot().then(function () {
        stop = F.onSnapshot(gameRef(code), function (s) { if (s.exists()) cb(s.data()); });
      });
      return function () { stop(); };
    },

    onStates: function (code, cb) {
      var stop = function () {};
      boot().then(function () {
        stop = F.onSnapshot(statesCol(code), function (q) {
          cb(q.docs.map(function (d) { return d.data(); }));
        });
      });
      return function () { stop(); };
    },

    onState: function (code, name, cb) {
      var stop = function () {};
      boot().then(function () {
        stop = F.onSnapshot(stateRef(code, name), function (s) { if (s.exists()) cb(s.data()); });
      });
      return function () { stop(); };
    },

    boot: boot
  };

  // Teacher rewrites the whole deal list when it answers pending offers.
  NET.updateDeals = function (code, deals) {
    return NET.updateGame(code, { deals: deals });
  };

  (window.AOC_NET_IMPLS = window.AOC_NET_IMPLS || {}).firebase = NET;
})();
