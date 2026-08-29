/* =========================================================================
   THE CONFEDERATION PROBLEM  —  Rules Engine
   Pure functions. No DOM, no network. Shared by teacher, student, and solo.
   ========================================================================= */
(function () {
  "use strict";

  var D = window.AOC;

  /* ---------------------------------------------------------------- utils */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function money(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }

  // Deterministic pseudo-random so a game can be replayed from a seed.
  // Teacher panel and every student panel must agree on bot behavior, so
  // bot rolls are seeded from (gameCode + round + stateName).
  function seededRandom(seed) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return function () {
      h += 0x6D2B79F5;
      var t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------- apportionment */
  function amountOwed(state, resolution) {
    if (!resolution.compliance) return 0;
    var basis = resolution.complianceBasis === "popShare" ? state.popShare : state.share;
    return Math.round(resolution.complianceTotal * (basis / 100));
  }

  /* -------------------------------------------------------- bot: attend?
     New Hampshire and the far southern states genuinely failed to send
     delegates. If fewer than 9 states are present, no important vote can
     legally be held — students have to notice and react.                   */
  function botAttends(state, gameCode, round) {
    if (!state.bot) return true;
    var rnd = seededRandom(gameCode + "|attend|" + round + "|" + state.name);
    return rnd() > (state.bot.absenceChance || 0);
  }

  /* ------------------------------------------------------------ bot: vote
     Score = dot product of the resolution's tags and this state's weights,
     plus anything students have promised it in a deal. Red lines are the
     historical hard noes (Rhode Island and New York on the import tax).   */
  function botVoteScore(state, resolution, deals) {
    var w = state.bot.weights, score = 0;
    for (var tag in resolution.tags) {
      if (w[tag] !== undefined) score += resolution.tags[tag] * w[tag];
    }
    score = score / 10; // keep numbers human-sized

    var dealValue = 0;
    (deals || []).forEach(function (d) {
      if (d.to === state.name && d.status === "accepted") dealValue += d.weight || 0;
    });
    return { base: score, deals: dealValue, total: score + dealValue };
  }

  function botVote(state, resolution, deals, gameCode, round) {
    if (!state.bot) return null;
    var rnd = seededRandom(gameCode + "|vote|" + round + "|" + state.name);
    var s = botVoteScore(state, resolution, deals);
    var redLines = state.bot.redLines || [];
    var hitsRedLine =
      (resolution.special && redLines.indexOf(resolution.special) !== -1) ||
      (resolution.isAmendment && redLines.indexOf("amendment") !== -1);

    if (hitsRedLine) {
      // Only an enormous, explicit payoff moves them, and Rhode Island is
      // nearly immovable by design. This is possible but should almost never
      // happen — which is the lesson.
      var priceToBreak = 40 * (state.bot.stubbornness || 0.5);
      if (s.deals < priceToBreak) {
        return { vote: "No", reason: redLineReason(state, resolution), locked: true };
      }
      return { vote: "Yes", reason: state.abbr + " sets aside its objection because the offer is too large to refuse.", flipped: true };
    }

    // THE CENTRAL HISTORICAL FACT OF THIS GAME.
    // In Philadelphia, delegates postured as patriots and voted yes. Congress
    // really did approve requisitions in 1781, '82, '83, '84, '85 and '86, and
    // really did authorize troops against Shays. Almost none of it was ever
    // funded. So bots are generous with their VOTE (civicBias below) and
    // stingy with their MONEY (prideInNation, used in botCompliance).
    // The gap between those two numbers is the lesson.
    // Amendments get no civic bias: a permanent surrender of the taxing power
    // triggered a different, deeper fear that posturing could not overcome.
    // Per-resolution, because these were not equally controversial. Paying
    // France back and answering an armed rebellion were easy yes votes in
    // Congress; both really did pass. Handing Congress a permanent taxing
    // power was not, and never passed at all.
    var civicBias = resolution.isAmendment ? 0
      : (resolution.civicBias !== undefined ? resolution.civicBias : 2.6);

    // Stubborn states need a clearer case before they move off their instinct.
    var threshold = (state.bot.stubbornness || 0.5) * 1.0;
    var noise = (rnd() - 0.5) * 1.2;
    var v = s.total + civicBias + noise;

    if (v > threshold) return { vote: "Yes", reason: reasonFor(state, resolution, "Yes") };
    if (v < -threshold) return { vote: "No", reason: reasonFor(state, resolution, "No") };
    // Genuinely torn states abstain — and abstentions still count against
    // a resolution that needs nine yes votes.
    return { vote: "Abstain", reason: state.abbr + " is divided and will not commit either way." };
  }

  function redLineReason(state, resolution) {
    if (state.name === "Rhode Island") {
      return "Rhode Island will not give Congress the power to tax. It blocked this exact plan in 1782 and it will block it now.";
    }
    if (state.name === "New York") {
      return "New York collects its own import taxes at its port. Handing that money to Congress would bankrupt the state.";
    }
    return state.name + " refuses on principle.";
  }

  function reasonFor(state, resolution, vote) {
    var w = state.bot.weights, best = null, bestVal = 0;
    for (var tag in resolution.tags) {
      var contribution = resolution.tags[tag] * (w[tag] || 0);
      if (vote === "No") contribution = -contribution;
      if (contribution > bestVal) { bestVal = contribution; best = tag; }
    }
    var phrases = {
      taxation: "the cost to its treasury",
      national_power: "what it does to the power of Congress",
      state_sovereignty: "its right to govern itself",
      trade_regulation: "who controls trade",
      military: "its need for soldiers",
      debt_honor: "the debts already owed",
      north_economy: "its shipping and manufacturing",
      south_economy: "its farms and exports",
      small_state: "the interests of small states",
      west_expansion: "its western land claims"
    };
    var why = phrases[best] || "its own interests";
    return state.name + " votes " + vote.toLowerCase() + " because of " + why + ".";
  }

  /* ------------------------------------------------------- bot: deal reply
     Students offer money or a future favor. Bots answer in one line, on the
     projector, so the whole room sees horse-trading happen.                */
  var DEAL_OPTIONS = [
    { id: "pay25",  label: "We will pay $25,000 of your share",  weight: 2.0, cost: 25000 },
    { id: "pay50",  label: "We will pay $50,000 of your share",  weight: 3.8, cost: 50000 },
    { id: "payall", label: "We will pay your ENTIRE share",      weight: 6.5, cost: null },
    { id: "future", label: "We will vote your way next round",   weight: 2.6, cost: 0 },
    { id: "public", label: "We will publicly back your position",weight: 1.1, cost: 0 }
  ];

  function botDealReply(state, offer, resolution, gameCode, round) {
    var rnd = seededRandom(gameCode + "|deal|" + round + "|" + state.name + "|" + offer.id + "|" + offer.from);
    var stub = state.bot.stubbornness || 0.5;
    var s = botVoteScore(state, resolution, []);
    var redLines = state.bot.redLines || [];
    var hitsRedLine =
      (resolution.special && redLines.indexOf(resolution.special) !== -1) ||
      (resolution.isAmendment && redLines.indexOf("amendment") !== -1);

    if (hitsRedLine && offer.weight < 4.0) {
      return {
        status: "rejected",
        text: state.abbr + ": \"You cannot buy this vote. Some things are not for sale.\""
      };
    }
    // How badly does the bot already want to move in the offered direction?
    var need = -s.base;                 // positive = it currently leans no
    var value = offer.weight * (1.6 - stub);
    var accept = value + (rnd() - 0.4) > Math.max(0.3, need * 0.35);

    if (accept) {
      return {
        status: "accepted",
        weight: offer.weight,
        text: state.abbr + ": \"Agreed. " + acceptLine(state) + "\""
      };
    }
    return {
      status: "rejected",
      text: state.abbr + ": \"Not enough. " + rejectLine(state) + "\""
    };
  }

  function acceptLine(state) {
    var lines = {
      "Delaware": "Our vote counts the same as Virginia's. Use it well.",
      "Georgia": "Send us the soldiers and you have our vote.",
      "New Jersey": "Finally, someone treats us as an equal.",
      "New Hampshire": "We will send a delegate for this one.",
      "Maryland": "Remember this when the western lands come up.",
      "Connecticut": "We will hold you to it.",
      "North Carolina": "Do not expect this twice."
    };
    return lines[state.name] || "We will vote with you.";
  }

  function rejectLine(state) {
    var lines = {
      "Rhode Island": "We have been alone before and we are comfortable there.",
      "South Carolina": "The South does not sell itself so cheaply.",
      "New York": "Our port earns more than that in a week.",
      "Virginia": "We are the largest state here. Offer accordingly.",
      "North Carolina": "Our farmers cannot eat promises."
    };
    return lines[state.name] || "Come back with a better offer.";
  }

  /* --------------------------------------------------- what this touches
     The same dot product the bots use, broken out so a student can see WHY
     a resolution is good or bad for their state. Deliberately shows the
     pull in both directions without announcing a verdict — the point is to
     make them weigh it, not to vote for them.                             */
  var TAG_LABELS = {
    taxation:          "money out of your treasury",
    national_power:    "a stronger Congress",
    state_sovereignty: "your right to govern yourselves",
    trade_regulation:  "who controls trade",
    military:          "soldiers and defense",
    debt_honor:        "debts you already owe",
    north_economy:     "your shipping and manufacturing",
    south_economy:     "your farms and exports",
    small_state:       "the interests of small states",
    west_expansion:    "your western land"
  };

  function interestBreakdown(state, resolution) {
    var w = state.bot ? state.bot.weights : null;
    if (!w) return [];
    var out = [];
    for (var tag in resolution.tags) {
      var v = resolution.tags[tag] * (w[tag] || 0);
      if (!v) continue;
      out.push({
        tag: tag,
        label: TAG_LABELS[tag] || tag,
        value: v,
        toward: v > 0 ? "Yes" : "No",
        strength: Math.abs(v) >= 40 ? "strongly" : (Math.abs(v) >= 15 ? "" : "slightly")
      });
    }
    out.sort(function (a, b) { return Math.abs(b.value) - Math.abs(a.value); });
    return out;
  }

  /* -------------------------------------------------------- vote counting */
  function tally(votes, resolution, presentStates) {
    var yes = 0, no = 0, abstain = 0;
    presentStates.forEach(function (n) {
      var v = votes[n];
      if (v === "Yes") yes++;
      else if (v === "No") no++;
      else abstain++;
    });
    var needed = resolution.voteRule === "unanimous" ? 13 : 9;
    var quorum = presentStates.length >= 9;
    var passed = quorum && yes >= needed;
    return {
      yes: yes, no: no, abstain: abstain,
      present: presentStates.length,
      needed: needed,
      quorum: quorum,
      passed: passed,
      unanimousRule: resolution.voteRule === "unanimous"
    };
  }

  /* ------------------------------------------------- bot: pay or don't pay
     THE HEART OF THE GAME. A state can vote yes in Philadelphia and then
     quietly send nothing. Nobody can make it pay. Even yes-voters default
     often, because in real life they did.                                  */
  function botCompliance(state, resolution, votedYes, gameCode, round) {
    var rnd = seededRandom(gameCode + "|pay|" + round + "|" + state.name);
    var owed = amountOwed(state, resolution);
    var pressure = owed / Math.max(1, state.treasuryNow !== undefined ? state.treasuryNow : state.treasury);
    var pride = state.bot.prideInNation || 0.5;

    // Chance the state simply refuses to send anything.
    var refuse = 0.45 + (pressure * 0.45) - (pride * 0.40) - (votedYes ? 0.12 : -0.10);
    refuse = clamp(refuse, 0.05, 0.92);
    // Chance it sends a partial payment instead of nothing.
    var partial = clamp(0.30 + (pride * 0.15), 0.1, 0.5);

    var roll = rnd();
    if (roll < refuse) return { choice: "none", paid: 0, owed: owed };
    if (roll < refuse + partial) return { choice: "half", paid: Math.round(owed / 2), owed: owed };
    return { choice: "full", paid: owed, owed: owed };
  }

  var COMPLIANCE_EXCUSES = {
    none: [
      "has no hard money in its treasury and sends nothing.",
      "says its own citizens come first this year.",
      "sends a polite letter instead of money.",
      "says it already paid more than its share during the war.",
      "simply never answers Congress at all."
    ],
    half: [
      "sends part of what it owes and promises the rest later.",
      "sends half, in paper money of doubtful value.",
      "pays what it can and asks for patience."
    ],
    full: [
      "pays in full.",
      "sends the entire amount, and expects to be remembered for it.",
      "pays every dollar owed."
    ]
  };

  function complianceExcuse(state, choice, gameCode, round) {
    var list = COMPLIANCE_EXCUSES[choice];
    var rnd = seededRandom(gameCode + "|excuse|" + round + "|" + state.name);
    return state.name + " " + list[Math.floor(rnd() * list.length)];
  }

  /* --------------------------------------------------------------- scoring
     Two numbers pull against each other:
       State Interest    — private, rewards looking after yourself
       National Stability — shared, falls when the country cannot act
     At the end, if National Stability is too low, EVERY state loses points.
     Playing selfishly is individually correct and collectively fatal.      */

  function stateInterestFromVote(state, resolution, vote) {
    if (vote === "Abstain" || !vote) return 0;
    var s = 0, w = state.bot ? state.bot.weights : null;
    if (!w) return 0;
    for (var tag in resolution.tags) s += resolution.tags[tag] * (w[tag] || 0);
    s = s / 10;
    var aligned = (vote === "Yes" && s > 0) || (vote === "No" && s < 0);
    var strength = Math.min(3, Math.abs(s));
    return aligned ? Math.round(3 + strength) : -Math.round(2 + strength);
  }

  function stateInterestFromCompliance(choice) {
    if (choice === "none") return 8;   // you kept your money and paid no price
    if (choice === "half") return 2;
    return -6;                          // paying in full is expensive
  }

  function nationalStabilityChange(resolution, result, collectedFraction) {
    if (resolution.id === "debt") {
      if (!result.passed) return -18;
      return Math.round(-20 + 30 * collectedFraction);
    }
    if (resolution.id === "trade") {
      // Passing barely helps: Congress cannot enforce it. That IS the point.
      return result.passed ? -3 : -9;
    }
    if (resolution.id === "impost") {
      return result.passed ? 28 : -14;
    }
    if (resolution.id === "shays") {
      if (!result.passed) return -28;
      return Math.round(-25 + 42 * collectedFraction);
    }
    return 0;
  }

  /* Outcome text the teacher reads aloud after the reveal. */
  function outcomeNarrative(resolution, result, collected, requested) {
    var f = requested > 0 ? collected / requested : 0;
    if (resolution.id === "debt") {
      if (!result.passed) return "Congress cannot even agree to ask. France is informed that no payment is coming. American credit in Europe collapses.";
      if (f >= 0.85) return "The states actually paid. This is the single most successful requisition in the history of the Confederation — and it did not happen in real life.";
      if (f >= 0.5) return "About half the money arrived. Congress makes a partial payment to France and asks for more time. American credit is damaged but alive.";
      if (f >= 0.2) return "Congress voted yes. Far fewer states actually paid. Congress cannot cover the interest, let alone the loan. This is almost exactly what happened in real life.";
      return "Congress voted yes and collected almost nothing. The United States defaults on its loans. No European bank will lend to it again.";
    }
    if (resolution.id === "trade") {
      if (result.passed) return "The resolution passes. Congress sends a polite request to every state. New York keeps its tariffs anyway, because Congress has no power to make it stop. Nothing changes.";
      return "Congress cannot even agree to ask. The trade war spreads. More states begin taxing their neighbors' goods.";
    }
    if (resolution.id === "impost") {
      if (result.passed) return "All thirteen states agreed. Congress will have its own money for the first time. This never happened in real life — twelve states agreed in 1782 and Rhode Island refused.";
      return "Twelve states can agree and it still means nothing. One state is enough to stop any change to the Articles. Congress will stay broke.";
    }
    if (resolution.id === "shays") {
      if (!result.passed) return "Congress does nothing. The rebels take the arsenal at Springfield. Governments across the country wonder if they are next.";
      if (f >= 0.7) return "Enough money and men arrive to stop the rebellion. Congress acted — barely, slowly, and only because the states chose to let it.";
      if (f >= 0.3) return "Some money arrives, but too little and too late. Private Boston merchants pay for the rest of the army out of their own pockets. That is how it really ended.";
      return "Congress approved an army and could not pay for a single soldier. The states sent almost nothing. Congress is revealed to the whole world as powerless.";
    }
    return "";
  }

  /* ------------------------------------------------------------- endgame */
  function finalReport(states, nationalStability, history) {
    var COLLAPSE = 30;
    var penalty = nationalStability < COLLAPSE ? -20 : 0;
    var ranked = states.map(function (s) {
      return {
        name: s.name,
        abbr: s.abbr,
        isBot: !!s.isBot,
        players: s.players || [],
        rawInterest: Math.round(s.interest),
        penalty: penalty,
        finalInterest: Math.round(s.interest + penalty),
        treasury: Math.round(s.treasuryNow !== undefined ? s.treasuryNow : s.treasury)
      };
    }).sort(function (a, b) { return b.finalInterest - a.finalInterest; });

    var totalRequested = 0, totalCollected = 0, passedCount = 0;
    (history || []).forEach(function (h) {
      totalRequested += h.requested || 0;
      totalCollected += h.collected || 0;
      if (h.passed) passedCount++;
    });

    return {
      ranked: ranked,
      collapsed: nationalStability < COLLAPSE,
      penaltyApplied: penalty,
      stability: Math.round(nationalStability),
      passedCount: passedCount,
      totalResolutions: (history || []).length,
      totalRequested: totalRequested,
      totalCollected: totalCollected,
      collectionRate: totalRequested > 0 ? totalCollected / totalRequested : 0
    };
  }

  window.ENGINE = {
    clamp: clamp,
    money: money,
    seededRandom: seededRandom,
    amountOwed: amountOwed,
    botAttends: botAttends,
    botVote: botVote,
    botVoteScore: botVoteScore,
    botDealReply: botDealReply,
    botCompliance: botCompliance,
    complianceExcuse: complianceExcuse,
    DEAL_OPTIONS: DEAL_OPTIONS,
    tally: tally,
    TAG_LABELS: TAG_LABELS,
    interestBreakdown: interestBreakdown,
    stateInterestFromVote: stateInterestFromVote,
    stateInterestFromCompliance: stateInterestFromCompliance,
    nationalStabilityChange: nationalStabilityChange,
    outcomeNarrative: outcomeNarrative,
    finalReport: finalReport
  };
})();
