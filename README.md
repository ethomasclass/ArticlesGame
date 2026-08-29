# The Confederation Problem

A 40-minute classroom simulation for 9th-grade U.S. History. Students are delegates to the
Confederation Congress in 1786. They debate and vote on four resolutions, and discover for themselves
why the Articles of Confederation had to be replaced.

Bots play every state the students don't, so the room always has thirteen states and the historically
immovable ones behave the way they actually behaved.

---

## The design idea

Most versions of this activity have students vote yes or no and score them on the result. That teaches
"the states disagreed," which students already suspect.

This one adds the step that actually killed the Articles: **after a money resolution passes, every state
privately decides whether to actually pay.** Nobody can make them. There is no president to enforce it
and no court to take them to. The projector then shows:

> Congress asked for **$1,000,000**. Congress received **$290,000**.

Students vote yes, feel good about it, and watch the money not arrive. Between 1781 and 1786 the real
Congress asked for about $15 million and collected about $2.5 million.

### The scoring trap

Two numbers pull against each other:

- **State Interest** — private, per state. Rewards protecting yourself. Refusing to pay is worth +8.
- **National Stability** — one shared number on the projector. Falls when Congress cannot act.

Highest State Interest wins **unless** National Stability drops below 30, in which case every state
loses 20 points, including the leader. Every group plays its own state correctly and the country fails
anyway. That is the argument for the Constitution, and students make it themselves.

---

## The four resolutions

| # | Resolution | Weakness it exposes | Rule |
|---|---|---|---|
| 1 | **Paying the War Debt** — $1,000,000 requisition | Congress could not tax | 9 of 13, then a payment phase |
| 2 | **The Trade War** — asking states to stop taxing each other | Congress could not regulate trade | 9 of 13; passing changes nothing |
| 3 | **The Import Tax Amendment** — 5% on imports | Amendments needed all 13 states | **13 of 13**. Rhode Island refuses. |
| 4 | **Shays' Rebellion** — $500,000 and troops | No army, no president | 9 of 13, then a payment phase |

They build on each other. Round 4's emergency is paid out of the treasury Round 1 was supposed to fill,
so a class that defected early finds nothing there when it matters.

Rounds 1 and 2 are deliberately easy to pass and rounds 3 is deliberately impossible — because that is
what happened. Congress approved requisitions every year from 1781 to 1786 and authorized troops against
Shays in October 1786. The votes were never the hard part. Round 3 was tried twice in real life: Rhode
Island alone blocked it in 1782, New York alone blocked it in 1786.

---

## Running it

### Before class
1. Host these files anywhere static (GitHub Pages works — Settings → Pages → deploy from branch).
2. In the [Firebase console](https://console.firebase.google.com/), paste `firestore.rules` into
   Firestore → Rules → Publish. **The game cannot save anything until you do this.**
3. Open `teacher.html` once and click through to check you get a join code.

### In class (about 40 minutes)

| Time | What happens |
|---|---|
| 0–5 | Open `teacher.html`, pick the student states, create the session, put the code on the board. Groups of two open `student.html` and claim a state. |
| 5–8 | Read the framing paragraph on your lobby screen. Groups read their secret objective. |
| 8–34 | Four rounds, about 6½ minutes each: brief → 2-minute debate → vote → result → payment → reveal. |
| 34–40 | Debrief screen, with discussion questions and an exit ticket. |

You drive every transition. Nothing advances without you clicking.

**Six student groups is the sweet spot.** Leave Rhode Island as a bot — Round 3 depends on someone
blocking the amendment, and a bot does it without a student taking the blame.

### The opening read-aloud

Every resolution opens with a short scene for you to perform to the class — about 45 seconds, written to
be spoken rather than skimmed. It appears on your screen in read-aloud type, and on every student screen
at the same time so they follow the words while they hear them.

The datelines advance across the period:

| | | |
|---|---|---|
| 1 | **Philadelphia · January 1786** | the letter from Paris |
| 2 | **New York Harbor · March 1786** | a farmer, a wagon, and a taxed lighthouse |
| 3 | **Philadelphia · July 1786** | five years of asking, and the one way out |
| 4 | **Springfield, Massachusetts · January 1787** | Daniel Shays on the road with a thousand men |

Students feel a year pass in forty minutes, and the chronology teaches itself.

Each one ends by handing the floor over — *"The floor is open."* — so there is no awkward gap between
the story and the arguing.

**Round 4 reads your class's own numbers back to it.** The line "look at what is actually in the national
treasury tonight" is filled in live with whatever the states actually paid in Round 1. If they defected,
you say the real, humiliating figure out loud, and the room hears the cost of its own choice.

**Bigger text** switches to presenter type for the back row. **Done reading** folds it away so the map
takes the screen, and a small button brings it back if someone arrives late.

To rewrite them, edit `narration` on each entry in `assets/game-data.js`. Use `{treasury}` anywhere you
want the live national treasury spoken.

### The map board

The projector view is a real map of the thirteen states, drawn from US Census boundary data with 1786
borders: **Maine is part of Massachusetts**, **West Virginia is part of Virginia**, and Vermont is drawn
in grey because in 1786 it was a self-declared republic, not a state.

When you close the vote, the map runs a **roll call**. States light up one at a time, north to south,
while the counter climbs toward the nine it needs and a gold marker shows where the bar sits. The room
watches the count stall at seven, or cross nine on the last state.

Then on a money resolution the same map runs **a second time** for the payment step, and goes dark red
as states refuse to pay. The tally bar still reads PASSED while the map bleeds out, and a money counter
ticks up and visibly stalls. That contradiction on one screen is the entire lesson.

**Replay the roll call** re-runs either pass on demand. **Map / List** toggles to the plain grid if you
want delegate names instead.

To regenerate the map (different states, different borders, different projection):

```bash
npm install us-atlas topojson-client topojson-simplify d3-geo --no-save
node tools/build-map.js        # rewrites assets/map-data.js
```

### Things on the teacher panel worth knowing

- **Resolution text folds away** once the brief is over, so the map is what fills the projector.
- **Deal ticker.** Groups send formal offers to other states ("we'll pay $50,000 of your share").
  Bots answer in one line. Read the good ones out loud — it makes the horse-trading public.
- **Send 3 delegations home.** Drops the room below the nine-state quorum so nothing can be voted on
  at all. Congress genuinely could not meet for long stretches. Use it once, for effect.
- **Congress tries again.** Appears only if a money resolution gets voted down. Pushes the class to the
  payment phase anyway, which is where the lesson lives. Historically fair: Congress re-introduced
  failed requisitions year after year.
- **+30 seconds** and **Skip to the vote** for pacing.

---

## The student screen

Two students share one laptop, so the screen is built to answer three questions without scrolling:

**What am I supposed to be doing right now?** A coloured bar sits pinned to the top of the screen and
changes with the phase — READ IT, DEBATE NOW (with the same countdown the teacher sees), VOTE NOW, NOW
PAY — OR DON'T. Students stop asking you what's happening.

**What does my state want?** The secret objective, the two internal factions, the treasury and the score
live in a rail that is *always on screen*, including while voting. Nothing that drives a decision ever
scrolls away.

**How does this bill hit me?** Two readouts, on every resolution:

- *What this bill costs you* — your share in dollars, and what percentage of your entire treasury it is.
- *What this touches for you* — the same dot product the bots use, broken out in plain words: "▲ debts
  you already owe — strongly for yes", "▼ money out of your treasury — for no". It shows which of their
  interests are being pulled and how hard, in both directions, without telling them how to vote.

Also: hard words (requisition, tariff, impost, quorum) are tappable for a plain-English definition; a
record strip shows what they voted and whether they paid in every earlier round, which is what makes
Round 4 land; and the two factions are numbered as **Delegate 1** and **Delegate 2**, so the pair has an
argument to have before they agree on a vote.

### Making deals

The deal panel separates the states a **bot** plays ("answers right away") from the ones **other students**
play ("talk to them in person"). Offers to a bot get an instant in-character reply. Offers to a human
delegation are delivered to that group's screen as an inbox item and answered out loud — the app never
puts words in another group's mouth.

---

## The three pages

| Page | Who | Needs internet? |
|---|---|---|
| `teacher.html` | You. Also your projector view. | Yes |
| `student.html` | Groups of two on one laptop | Yes |
| `solo.html` | One student against twelve bots | **No** — works offline once loaded |

`solo.html` is for absent students, homework, a substitute, or the day the WiFi dies. Same resolutions,
same bots, same debrief, no code and no teacher needed.

---

## How the bots decide

Each resolution is tagged (`taxation`, `state_sovereignty`, `trade_regulation`, `military`, …). Each
state has a weight for every tag. A bot's vote is the dot product, plus anything students have promised
it, plus a small amount of noise. This keeps bots legible: a student who reads Georgia's card ("frontier
defense or nothing") can correctly predict Georgia and go buy its vote.

Two bots have **red lines** that money mostly cannot move — Rhode Island and New York on the import tax,
which is exactly who blocked it in real life.

Bots are generous with their **vote** and stingy with their **money**, and that gap is the whole point.
It is two separate numbers in `assets/game-data.js`: `civicBias` on the resolution, `prideInNation` on
the state.

Bot rolls are seeded from the game code, so every screen in the room computes the same bot behavior.

---

## Editing the content

Nearly everything a teacher would want to change is in **`assets/game-data.js`**:

- `STATES` — each state's background, secret objective, two internal factions, treasury, and bot weights
- `RESOLUTIONS` — the text students read, the yes/no arguments, vote rule, tags
- `narration` on each resolution — the opening scene you read to the class
- `HISTORY_NOTES` — the "what actually happened" box after each round
- `GLOSSARY` and `WEAKNESSES` — used in the debrief

Percentages in `share` (land value, Resolution 1) and `popShare` (population, Resolution 4) must each
total 100.

To change how harshly the country falls apart, see `nationalStabilityChange` in `assets/engine.js`.

`assets/map-data.js` is generated — edit `tools/build-map.js` and re-run it rather than hand-editing the
path data.

---

## Tests

```bash
npm install playwright --no-save
python3 -m http.server 8899 &
node tests/solo.test.js          # full 4-round solo playthrough
node tests/multiplayer.test.js   # teacher + student, both tabs, all 4 rounds
node tests/map.test.js           # map board, roll call, payment reveal
node tests/deals.test.js         # bot offers answer, human offers are only delivered
node tests/narration.test.js     # read-aloud on both screens, live treasury token
```

The multiplayer test replaces the Firebase SDK with a small localStorage-backed stand-in
(`tests/shim/`), so it runs offline and never touches your real database. Both tests fail loudly on any
console error.

If Playwright's bundled Chromium is missing, point it at an installed one:
`chromium.launch({ executablePath: '/path/to/chrome' })`.

---

## Privacy

The only student data stored is the first names they type on the join screen. No accounts, no email, no
grades. Game sessions sit in Firestore until you delete them; deleting the `games/{CODE}` document
removes a class period entirely.
