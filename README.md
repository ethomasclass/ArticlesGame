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
| 8–34 | Four rounds, about 6½ minutes each: read-aloud → 2-minute debate → vote → result → payment → reveal. |
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

### Running it over two days

It saves as it goes. Every vote, payment, score and treasury change is written the moment it happens —
nothing important lives in a browser — so stopping is just stopping. There is no save button because
there is nothing to save.

**Name the session** when you create it ("Period 3"), so you can tell your five classes apart.

**When the bell goes**, hit *Stop here — continue another day*. It shows the session name, the code in
large type, and exactly where you stopped, so you can photograph it. Then close everything.

**Next day**, open the teacher page and either type the code into *Resume that session* or pick the class
out of **Recent sessions**, which lists every session with its name, its code, and where it stopped
("Period 3 — Resolution 2 of 4, deciding who pays"). It comes back with the same states, scores,
treasury and vote history. You can resume on a completely different computer; nothing depends on the
machine you started on.

**Students** use the same code and pick the same state. If a group ends up on a different laptop, their
state will show as *held by* their names — tapping it takes it back, and their treasury, score and
voting record are all still there. Worth telling them on day one to write down which state they are.

A good place to break is after the reveal of Resolution 2. Day two then opens on the import tax
amendment, which is the round that needs the most argument.

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

## How a resolution is explained

Before a single vote is cast, every resolution puts four things in front of the student:

1. **The question, in one sentence** — "Should the Articles be amended to give Congress a 5% import
   tax?" Boxed and set apart, so nobody votes without knowing what they are voting on.
2. **If it passes / If it fails** — side by side, green and red. Written honestly: under the Articles,
   passing frequently changed nothing, and the text says so ("Congress sends every state a polite
   request. New York does not have to listen.").
3. **What it costs you** — your share in dollars and as a share of your whole treasury. On the two
   rounds with no bill to pay, it says so plainly instead of vanishing.
4. **What this touches for you** — which of your state's interests are pulled, and how hard.

Plus the vote threshold on a badge (9 of 13, or ALL 13) and tappable definitions for the hard words.
The prose runs at roughly a 6th-grade reading level, which is deliberate — students read it under time
pressure while somebody argues at them.

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

### The first-run tour

The first time a delegation reaches a resolution, eight spotlight steps walk them round their own
screen — the action bar, the question, both outcomes, the secret objective, the cost, what it touches,
and the two factions they have to reconcile. One line each.

It runs during the brief, while you are reading the opening aloud, and **retires itself the instant
debate opens** so nobody is reading a tooltip while the room argues without them. It shows once per
device; the **Tour** button on the state card replays it for anyone who skipped it or joined late.

Solo mode has its own version with stops suited to playing alone, including how to read the room before
spending an offer.

### Making deals

The deal panel separates the states a **bot** plays ("answers right away") from the ones **other students**
play ("talk to them in person"). Offers to a bot get an instant in-character reply. Offers to a human
delegation are delivered to that group's screen as an inbox item and answered out loud — the app never
puts words in another group's mouth.

---

## Playable links

**Single player, nothing to set up:** https://claude.ai/code/artifact/2d71f49e-6025-4826-b4c0-e6b69e8a5d88

That is the whole solo game — narration, map, roll call, payment reveal, debrief — in one page. Nothing
to install and no internet needed once it has loaded. Good for absent students, homework, a substitute,
or trying the thing yourself before class.

`standalone.html` in this repo is the same build as a file you can email, drop in Google Drive, or put
on a USB stick. It is generated — after editing any content, regenerate it:

```bash
node tools/build-standalone.js standalone.html
```

**The classroom version** (teacher panel + student delegations) needs hosting, because the two talk to
each other through a database. Three steps, about five minutes:

1. **Supabase → SQL Editor → Run the setup script.** Open the file `supabase-setup.sql` in this repo,
   select all of it, and paste **the contents** into the editor — not the filename. Press Run. It
   creates the tables and functions the game calls, and it is safe to run twice.
2. **Supabase → Project Settings → API.** Copy the Project URL and the `anon` `public` key into
   `assets/config.js`. That is the only file you edit. (The anon key is designed to live in a web page.
   Never paste the `service_role` key — that one is an admin key.)
3. **Repo → Settings → Pages → deploy from this branch.** You get
   `https://<your-username>.github.io/ArticlesGame/`.

Then `teacher.html` is your projector and `student.html` is the link the groups open. If you skip step 1
or 2, the teacher page says so in plain English on load rather than failing when you try to start.

### Switching backends

`assets/config.js` has a `backend` field: `"supabase"` or `"firebase"`. Both implement the same handful
of methods, so nothing else in the project knows which one is running. The original Firebase project is
still wired up if you ever want it back — set `backend: "firebase"` and publish `firestore.rules`.

### How the Supabase sync works

No client library and no CDN script — just `fetch` against PostgREST, so there is nothing extra for a
school filter to block.

Reads go through one polling loop shared by the whole page. It asks for a few-byte fingerprint about
once a second and only pulls the full session when that fingerprint moves, so a quiet classroom costs
almost no bandwidth and a busy one updates in about a second. Writes go through Postgres functions that
lock the row while they read and rewrite it, so two laptops writing at the same moment cannot clobber
each other. Deals are their own rows rather than an array inside the game document, because a dozen
groups appending to one shared array loses some of the offers.

## The teacher's guide

`lesson-plan.html` is the run of show — read it before you teach this. It prints to six pages, there is a
PDF in `download/`, and it is also online at
https://claude.ai/code/artifact/4a8b48c0-2af1-4510-b37e-b795d8a5d3e6 if you would rather read it on your
phone while the class files in.

It covers what students are meant to learn and why the game is built the way it is; a pre-class
checklist; a minute-by-minute run of show with the exact buttons to press and lines to say; what each
resolution exposes and what will probably happen; three moments worth slowing down for; a
troubleshooting table (a group cannot join, a money vote fails, the WiFi dies); how to split it over two
days; assessment; and an honest note on what is historically accurate and what is compressed.

## The worksheet

`worksheet.html` prints to two pages — one sheet, front and back — and there are ready-made PDFs in
`download/`.

**Page one is filled in as they play.** One box per resolution: how their state voted, whether it
passed, and one question that names the flaw that round exposed. Rounds 1 and 4 also ask for the two
numbers that matter — what Congress asked for, and what actually arrived.

**Page two is filled in during the debrief.** The six weaknesses with a column for which round showed
each; a short word-bank section on what the Articles *did* get right, since a unit that only shows
failure teaches a cartoon; the total asked against the total collected; and two questions, including the
one that matters most — *your state scored well by refusing to pay, so why did the country end up worse
off?*

Open the file and hit **Show answer key** for a teacher's copy with suggested answers, which prints to
the same two pages.

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
- `question`, `ifPasses`, `ifFails` — the briefing shown before the vote
- `WHAT_WORKED`, `VOICES` — the Northwest Ordinance and the Knox/Jefferson quotes in the debrief
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
node tests/explain.test.js       # every resolution states the question, both outcomes and the stake
node tests/tour.test.js          # first-run tour: runs once, yields to the vote, replays on demand
node tests/resume.test.js        # stop mid-session, come back on a fresh browser, carry on
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
