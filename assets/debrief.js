/* =========================================================================
   THE CONFEDERATION PROBLEM — end-of-game debrief
   Shared by teacher.html, student.html and solo.html.
   ========================================================================= */
(function () {
  "use strict";
  var D = window.AOC, E = window.ENGINE;

  function tier(stab) {
    if (stab >= 55) return {
      label: "Holding together — barely",
      color: "#1d5233",
      text: "You did better than the real Confederation Congress ever managed. The country is still standing, but it took constant deal-making to get there, and nothing you passed could actually be enforced."
    };
    if (stab >= 30) return {
      label: "Falling apart",
      color: "#8f6413",
      text: "This is roughly where the real United States stood in 1786. Congress could meet, argue, and vote. It could not make anyone do anything."
    };
    return {
      label: "Collapse",
      color: "#8a2019",
      text: "The national government has stopped functioning. Debts are unpaid, trade has broken down, and armed men are shutting down courts. Every state protected itself, and there is no longer a country worth protecting."
    };
  }

  function render(container, G, states, opts) {
    opts = opts || {};
    var stab = Math.round(G.stability);
    var t = tier(stab);
    var hist = G.history || [];

    var enriched = states.map(function (s) {
      var d = D.byName(s.name) || {};
      return {
        name: s.name, abbr: s.abbr || d.abbr, isBot: s.isBot,
        players: s.players || [], interest: s.interest || 50,
        treasuryNow: s.treasuryNow !== undefined ? s.treasuryNow : d.treasury
      };
    });
    var rep = E.finalReport(enriched, stab, hist);

    var totalAsked = 0, totalGot = 0;
    hist.forEach(function (h) { totalAsked += h.requested || 0; totalGot += h.collected || 0; });
    var rate = totalAsked > 0 ? Math.round(totalGot / totalAsked * 100) : null;
    var passedCount = hist.filter(function (h) { return h.passed; }).length;

    var html = "";

    /* ---- headline ---- */
    html +=
      '<div class="card center">' +
        '<div class="eyebrow">The simulation is over</div>' +
        '<h1 style="color:' + t.color + '">' + t.label + '</h1>' +
        '<p class="lede" style="max-width:760px;margin:0 auto 14px">' + t.text + '</p>' +
        '<div class="grid g3" style="max-width:760px;margin:0 auto">' +
          '<div class="stat"><div class="k">Final stability</div><div class="v">' + stab + ' / 100</div></div>' +
          '<div class="stat"><div class="k">Resolutions passed</div><div class="v">' + passedCount + ' of ' + hist.length + '</div></div>' +
          '<div class="stat"><div class="k">Money actually collected</div><div class="v">' +
            (rate === null ? "—" : rate + "%") + '</div></div>' +
        '</div>' +
      '</div>';

    /* ---- THE central point ---- */
    if (totalAsked > 0) {
      html +=
        '<div class="card">' +
          '<div class="eyebrow">The whole problem, in two numbers</div>' +
          '<div class="grid g2" style="align-items:center">' +
            '<div>' +
              '<div style="font-size:2.6rem;font-weight:700;line-height:1.1">Congress asked for<br>' +
                '<span style="color:#8a2019">' + E.money(totalAsked) + '</span></div>' +
              '<div style="font-size:2.6rem;font-weight:700;line-height:1.1;margin-top:10px">Congress received<br>' +
                '<span style="color:#8a2019">' + E.money(totalGot) + '</span></div>' +
            '</div>' +
            '<div class="inset">' +
              '<p><strong>Your Congress voted yes and the money still did not come.</strong></p>' +
              '<p>That is not a bug in this game. Under the Articles of Confederation, a vote in Congress was ' +
              'a <em>request</em>. There was no president to enforce it and no national court to punish a state ' +
              'that ignored it. Delegates in Philadelphia voted like patriots. Their governments back home ' +
              'acted like thirteen separate countries.</p>' +
              '<p class="small muted">Between 1781 and 1786 the real Congress asked the states for about ' +
              '$15 million and received about $2.5 million — roughly one dollar in six.</p>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    /* ---- the trap ---- */
    if (rep.collapsed) {
      html +=
        '<div class="card" style="border-color:#8a2019;border-width:3px">' +
          '<h2 style="color:#8a2019">Everyone lost 20 points</h2>' +
          '<p class="lede">National stability fell below 30, so every single state took a 20-point penalty — ' +
          'including the states that played most cleverly.</p>' +
          '<p>Look at what just happened. Every group made good decisions <em>for its own state</em>. ' +
          'Refusing to pay was smart. Protecting your port was smart. Blocking a tax that would cost you money ' +
          'was smart. Thirteen states each did the smart thing, and the country failed anyway.</p>' +
          '<p><strong>That is the argument for the Constitution.</strong> Not that the delegates of 1787 were ' +
          'better people than you. They had watched exactly this happen and decided the rules themselves had ' +
          'to change.</p>' +
        '</div>';
    }

    /* ---- standings ---- */
    html +=
      '<div class="card">' +
        '<h2>Final standings</h2>' +
        '<p class="muted small">State Interest measures one thing only: how well you protected your own state.</p>' +
        '<table><thead><tr><th></th><th>State</th><th>Delegates</th>' +
        '<th class="num">Treasury</th><th class="num">State Interest</th></tr></thead><tbody>' +
        rep.ranked.map(function (r, i) {
          var me = opts.you && opts.you === r.name;
          return '<tr' + (me ? ' style="background:rgba(200,145,47,.22);font-weight:700"' : '') + '>' +
            '<td class="num">' + (i + 1) + '</td>' +
            '<td><strong>' + r.name + '</strong>' + (r.isBot ? ' <span class="pill">bot</span>' : '') + '</td>' +
            '<td class="small">' + (r.players.length ? r.players.join(", ") : "—") + '</td>' +
            '<td class="num">' + E.money(r.treasury) + '</td>' +
            '<td class="num">' + r.finalInterest +
              (r.penalty ? ' <span class="small" style="color:#8a2019">(' + r.penalty + ')</span>' : '') +
            '</td></tr>';
        }).join("") +
        '</tbody></table>' +
      '</div>';

    /* ---- round by round ---- */
    html +=
      '<div class="card">' +
        '<h2>What happened, round by round</h2>' +
        '<table><thead><tr><th>Resolution</th><th>Vote</th><th>Result</th>' +
        '<th class="num">Asked</th><th class="num">Paid</th><th class="num">Stability</th></tr></thead><tbody>' +
        hist.map(function (h) {
          var pct = h.requested ? Math.round(h.collected / h.requested * 100) + "%" : "—";
          return '<tr><td><strong>' + h.title + '</strong></td>' +
            '<td class="small">' + h.yes + "Y / " + h.no + "N / " + h.abstain + 'A</td>' +
            '<td>' + (!h.quorum ? '<span class="pill">no quorum</span>'
              : (h.passed ? '<span class="pill good">passed</span>' : '<span class="pill hot">failed</span>')) + '</td>' +
            '<td class="num">' + (h.requested ? E.money(h.requested) : "—") + '</td>' +
            '<td class="num">' + (h.requested ? E.money(h.collected) + " (" + pct + ")" : "—") + '</td>' +
            '<td class="num">' + h.stabilityAfter + '</td></tr>';
        }).join("") +
        '</tbody></table>' +
      '</div>';

    /* ---- the other half of the story ---- */
    var W = D.WHAT_WORKED;
    if (W) {
      html +=
        '<div class="card">' +
          '<div class="eyebrow">Before you decide it was all a disaster</div>' +
          '<h2>' + W.title + '</h2>' +
          W.body.split("\n\n").map(function (x) { return "<p>" + x + "</p>"; }).join("") +
          '<div class="callout warn" style="margin-top:12px"><p class="small" style="margin:0">' +
            W.note + '</p></div>' +
        '</div>';
    }

    /* ---- two men, one rebellion ---- */
    if (D.VOICES && D.VOICES.length) {
      html +=
        '<div class="card">' +
          '<div class="eyebrow">Two people watch the same rebellion</div>' +
          '<h2>Did Shays\u2019 Rebellion prove the government had to change?</h2>' +
          '<div class="grid g2">' +
          D.VOICES.map(function (v) {
            return '<div class="inset">' +
              '<div style="font-weight:700;font-size:1.1rem">' + v.who + '</div>' +
              '<div class="small muted" style="margin-bottom:8px">' + v.role + '</div>' +
              '<blockquote style="margin:0 0 10px;padding-left:12px;border-left:4px solid var(--gold);' +
                'font-size:1.05rem;font-style:italic">' + v.quote + '</blockquote>' +
              '<div class="small">' + v.gloss + '</div>' +
            '</div>';
          }).join("") +
          '</div>' +
          '<p class="center lede" style="margin:14px 0 0">They are both looking at the same four dead ' +
          'farmers in Springfield. Which one is right?</p>' +
        '</div>';
    }

    /* ---- the six weaknesses ---- */
    html +=
      '<div class="card">' +
        '<h2>The six weaknesses you just lived through</h2>' +
        '<div class="grid g2">' +
        D.WEAKNESSES.map(function (w) {
          return '<div class="inset"><h3>' + w.title + '</h3><p class="small" style="margin:0">' + w.text + '</p></div>';
        }).join("") +
        '</div>' +
        '<hr class="rule">' +
        '<p class="lede center" style="margin:0">In May 1787, delegates met in Philadelphia to fix the Articles. ' +
        'Within four days they gave up on fixing them and started writing the Constitution instead.</p>' +
      '</div>';

    /* ---- teacher-only discussion ---- */
    if (opts.teacher) {
      html +=
        '<div class="card dark">' +
          '<div class="eyebrow" style="color:var(--gold)">Discussion questions</div>' +
          '<h2 style="color:#f0e6cf">Ask these while it is still fresh</h2>' +
          '<ul class="clean" style="font-size:1.05rem">' +
            '<li>Whoever finished first: what did you do that worked? Was any of it good for the country?</li>' +
            '<li>Who voted yes on a requisition and then did not pay? Why did you do it? What would have stopped you?</li>' +
            '<li>Rhode Island blocked the import tax alone. Was that fair? Should one state out of thirteen be able to do that?</li>' +
            '<li>If you could change exactly one rule of this government, which one, and what would break as a result?</li>' +
            '<li>The states were afraid of a strong central government because of what they had just fought a war against. Were they wrong to be afraid?</li>' +
            '<li>By Round 4 the treasury was empty because of what happened in Round 1. Where else does that pattern show up in history?</li>' +
            '<li>The Northwest Ordinance worked when almost nothing else did. What made that one different?</li>' +
            '<li>Jefferson\u2019s 1784 plan to ban slavery in the west lost by one vote, because one man was too sick to attend. What do you do with a fact like that?</li>' +
          '</ul>' +
          '<hr class="rule">' +
          '<p class="small" style="color:#c9bfae;margin:0">Exit ticket: <em>Name one weakness of the Articles you ' +
          'experienced today, describe the moment you felt it, and explain how the Constitution fixed it.</em></p>' +
        '</div>';
    }

    container.innerHTML = html;
  }

  window.DEBRIEF = { render: render, tier: tier };
})();
