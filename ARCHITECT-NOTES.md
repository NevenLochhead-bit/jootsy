# Architect Notes — Jootsy!

## Current focus

- **State (Tue Nov 10, 09:40 ET):** **v4 core is live** (`main` runtime `19fdf3b`, published 09:13). Review 3 below: no blocking defect in the server code. Neven is playing it in the sandbox now.
- **Deploy budget for v4 is 8, not 4** (raised at 08:40, commit `d86d67b`; the Engineer's report had not seen it). **4 used, 4 left.** Tier 2 needs no further budget decision, only Neven's go.
- **Next to act: Neven.** Play the sandbox; listen for the commit sound; go / no-go by 11:00 ET. Defects straight to the Engineer through Bolus; design changes to me.
- **Next to act: Engineer.** Hold. Fix only what Neven reports as broken, batched. Start Tier 2 (§16.7) on his go. Last deploy 11:45; nothing after 12:00.
- **No-go path:** republish the v3 deploy and run the cleanup SQL in `V4-REPORT.md`. Prepared, not executed.

## Where things are

| What | Where |
|---|---|
| The spec (v4; §16 is the change to build) | `docs/JOOTSY_TUESDAY_SPEC.md` on branch `architect` |
| Build plan for Neven (v2; out of date since v3) | `docs/JOOTSY_BUILD_PLAN.md` on branch `architect` |
| These notes | `ARCHITECT-NOTES.md` on branch `architect` |
| Engineer's reports | `FINAL-REPORT.md`, `ENGINEER-REPORT.md`, `SLICE-B-REPORT.md` on `main` |

I write only to the `architect` branch. Read with:

```
git fetch origin architect && git show origin/architect:ARCHITECT-NOTES.md
```

**This repo is public.** No passcodes, database URLs or keys in any commit, note or report.

## Designer (Neven)

Decided (newest last; a later row overrides an earlier one):

| Date | Decision |
|---|---|
| Nov 9 | "A truly open networked structure." |
| Nov 9 | The game must keep the sense of playing cards. |
| Nov 9 | A Jootsy! card means jumping into another's timeline; the design must hold that distinction. |
| Nov 9 | Scenarios are created by Neven only. |
| Nov 9 | Deploy path is GitHub → Netlify. |
| Nov 9 | ~~Thresholds: Jootsy! at ring 7 with 7 cards; End of Game at ring 11, an open boundary.~~ Superseded Nov 10. |
| Nov 10 | **Every card is the same; the cut is the move.** "Every card is essentially the same, but you determine how it branches… it's all about negotiating the cut from one to the next." "We aren't playing specific cards but have these options for how to put them in relation." |
| Nov 10 | **The trace.** Connections are colour coded by their cut; the word shows on hover only. |
| Nov 10 | **Three things.** "The student really just needs to focus on naming their cards, adding an image or video, and a description." |
| Nov 10 | **No perimeters; the task is five cards.** "We don't need the perimeter… play at least five cards, that's it." Play continues past five. |
| Nov 10 | **Players are visible.** "Click the name of the user and see their cards light up on the overall deck." |
| Nov 10 | **Who writes what.** "Whoever writes a card names it, yes. A fork deals two blank cards, destiny deals one blank card, dream deals one blank card. The forker names the card. They author that transition. You can't write in someone else's transition, but you can subsequently fork from it." **This reverses my v2 rule** (anyone may write on any unwritten path). Now: blank cards belong to whoever cut; anyone may cut from any written card. |
| Nov 10 | **Five cards anywhere.** "They will automatically stick to their own." **Jootsy! unlocks after five.** |
| Nov 10 | **"Describe an image"** as an option, with AI making the image later. v3 stores the description only (§15.7), built last. |
| Nov 10, 08:07 | **After playing v3 — the session editor.** A left-to-right chain; "you get three stages of cells to build, and then you have to Commit to the board"; the card you opened from is the first stage, so a session is "chunks of two transitions"; then reopen your latest card to keep going. Transition buttons to the right of the card, with one-line definitions on hover. **Change** under each arrow, becoming **Undo**. |
| Nov 10, 08:07 | **Board and Cards.** "Card View should become Cards and it should be a toggle at the top next to Board." Cards = the cards you have played, one at a time, to edit. Double-clicking a peer's card on the Board opens it large enough to read, without leaving the Board; from there it can be opened in a session. "I like that the map is automatically organized by the system. This is key." |
| Nov 10, 08:07 | **Wording.** "What happens next?" replaces "How does it cut?". "Mine" becomes "My Cards". Fork: Two paths forward. Destiny: One way forward. Dream: Anything can happen. Wormhole: Jump to previous card. Jootsy: Jump into another timeline. |
| Nov 10, 08:07 | **The name is the option.** The name written on a card appears, as it is typed, as a button on the card before it. |
| Nov 10, 08:07 | **Removed:** Dead End ("a card that goes nowhere is a dead end"; the game always has a back button); the Face-down toggle; the blank Jootsy! card on the table. |
| Nov 10, 08:07 | **Jootsy! today.** "Their goal is five cards minimum, and one Jootsy." The Jootsy! picker lists all cards played; students find the name on the Board first. Wormhole picker lists their own cards. A Jootsy! card "sparkles continuously". |
| Nov 10, 08:07 | **Board feel.** Players panel on the left with a cards-played column; a name lights up when that player commits. Committed cards illuminate briefly with "a pleasing sound". Scenarios are circles. Wormholes and Jootsies stay dotted. A Refresh button that scans and says "Board is synced!". Energy flowing along the lines, "but I also don't want this to overwhelm the system". Arrowheads must sit on their lines. Desktop first; horizontal scroll on mobile. |

For him to veto (my calls inside his rules; they stand unless he objects):

1. **Sessions are saved on the server as drafts**, invisible to everyone else until Commit. Not in the browser only: a closed tab must not lose a student's writing.
2. **One open session at a time.** Commit or discard before starting another.
3. **A Fork needs both cards written to commit.** To commit one, Change it to a Destiny. Otherwise the Board fills with one-legged forks.
4. **Jootsy! still unlocks at five cards**, as he decided last night; instructors are exempt so he can demo it. A Jootsy! and a Wormhole can only leave a card you wrote.
5. **Transitions on committed cards cannot be changed today.** Change works inside a session only.

Open, none needed before class:

- "Describe an image": who generates the images, and when.
- Cut buttons on the card's edges (his idea of last night; superseded for now by "buttons to the right of the card").

## Thursday list

- Changing a transition after commit.
- Backwriting by inserting a card into your own thread.
- Sound and video uploads.
- "Describe an image" (§15.7), not built on Tuesday.
- Each student's branch as an export for the game review.
- Edge buttons, if he wants them.

## Review 3 — Tue Nov 10, 09:40 ET (of v4 core at `main` `7a4ea14`, runtime `19fdf3b`)

**Reviewed:** `V4-REPORT.md`, `ENGINEER-HANDOFF.md`, migration `20261110133000_sessions_v4.sql`, and in `netlify/functions/api.mjs` the state filter, session source and stage rules, link targets, Change, Commit, Discard and Delete. **Not reviewed:** the editor in a browser; that is Neven's test.

| Rule | Holds in the code? |
|---|---|
| Drafts invisible to everyone but their author (cards and paths), including to instructors | Yes: filtered in the `/state` queries themselves |
| S2 one open session | Yes: partial unique index plus `409` with the anchor |
| S4 three stages | Yes: a draft source must hang directly off the anchor |
| S3 link sources and targets; Jootsy! threshold, instructor exempt, hidden and own cards refused | Yes, and re-checked at Commit |
| S7 Commit is one transaction; refused with a blank cell | Yes |
| F8 hidden card's name masked, and the path re-sent on hide | Yes |
| Migration additive | Yes; adds an `edit_sessions` table beyond what I specified, which is a sound way to do S2 |

**Findings (none blocks class)**

| # | Severity | Finding | Ask |
|---|---|---|---|
| F11 | Known limitation | An open session leaves invisible draft paths on its anchor. While it is open, the anchor's author cannot delete that card and is told "A path leaves this card" with nothing visible to explain it. An abandoned session holds that state indefinitely. | After class: expire sessions untouched for 24 hours, and word the refusal "Someone is writing from this card." Not today. |
| F12 | Known limitation | If a Jootsy! target is hidden or deleted between drafting and Commit, the whole Commit is refused until the student Changes that transition. | Acceptable. Make sure the message names the card. Not today. |

The commit sound and real-phone behaviour remain unverified by anyone but Neven.

## Review 2 — Tue Nov 10, 01:20 ET (of v3 at `main` `5f5c4b3`, code `cd96e44`)

**Reviewed:** `V3-REPORT.md`, `ENGINEER-HANDOFF.md`, migration `20261110060000_cuts_v3.sql`, `netlify/functions/api.mjs` in full, client strings and routes, `docs/verification/v3-map.jpg`. Live: the site is serving the v3 client (cut row present, hand gone, no perimeter code).

**Against the spec, from the code:**

| Rule | Holds? |
|---|---|
| C1 anyone cuts any written, non-dead-end card; Fork 2, Destiny 1, Dream 1 | Yes |
| C2 only the dealer writes their blank card; name + fragment required | Yes (403 for others) |
| C3 wormhole own card → own other card | Yes |
| C4 dead end only by author, only with nothing leaving; no cuts from it | Yes |
| C5 discard own blanks and wormholes | Yes |
| C6 cap of 8 blanks | Yes; also applied when deleting a card, since that reopens a blank. Sensible. |
| C7, C8 ownership, delete | Yes |
| C9 scenarios | Yes; starting paths gone |
| C11 no claims | Yes |
| Migration | One transaction, snapshot first, as specified |
| F1 | Closed: separate signing secret required; fallback removed in code |
| F7 | Closed: 15 v2 deploys, 2 for v3; previews and branch builds off; report commits skipped |

**Findings**

| # | Severity | Finding | Ask |
|---|---|---|---|
| F8 | Should fix, batch it | When the instructor hides a card, its fragment and media are masked for students but its **name** is not: the name lives on the incoming path, which `/state` sends unmasked, so it still shows on tiles, the Map and the "came from" line. | For non-instructors, send the label of any path whose `to_card_id` is hidden as "Hidden", and stamp that path's `rev` when a card is hidden or unhidden so open tabs update. Do not spend a deploy on this alone before class unless Neven asks; ship it with the next change or by 09:00 ET. |
| F10 | Should fix, batch with F8 | Someone else's blank card reads only "{name}'s" (my wording, §15.4). Neven saw one at 07:28 and asked "what is this?" Students will too. | Change the band to two lines: **"Unwritten"** and under it **"{name} will write this"**. On tap or hover, a one-line note: "{name} dealt this card with a {Fork/Destiny/Dream}. Only they can write it. You can cut from the card above instead." Same wording for the Map preview of another player's blank card. |
| F9 | Note | §15.7 "Describe an image" was not built, as the spec allowed. | None. Thursday list. |

Everything else in `V3-REPORT.md` I accept as reported; I could not repeat the browser checks.

## Review 1 — Tue Nov 10, 00:13 ET (of v2 at `main` `8d7aea2`)

**Reviewed:** `netlify/functions/api.mjs`, the initial migration, `public/app.js`, `netlify.toml`. Live site: join screen at 375 px; unauthenticated `state` and `plays` (401); bad token (401); unknown world (404).

**Not reviewed:** play as students in a browser. I do not create players or type passcodes on the live site. My container cannot reach `jootsy.netlify.app`.

**Holds, from the code:** one live card per path (partial unique index plus world-row lock); depth set server-side; ownership checked on every author-only route; delta reads in a read-only repeatable-read snapshot; no `innerHTML` in the client.

**Findings**

| # | Severity | Finding | Ask |
|---|---|---|---|
| F1 | Before class | Tokens are signed with `TOKEN_SECRET`, falling back to `INSTRUCTOR_PASSCODE` (`api.mjs` line 16). On the fallback, any student's token is material for guessing the instructor passcode offline. | Confirm a random `TOKEN_SECRET` (32+ bytes) is set in Netlify. If not, set it before students join. Answer yes/no; never the value. |
| F7 | **Before anything else** | **Deploys are the cost, not traffic.** Neven's Netlify account (Pro, credit-based) has **1,283 credits left until Nov 17, auto-recharge off.** This period: 223 production deploys cost 3,345 credits, about **15 credits each**; 285,531 web requests cost 57. `main` has 24 commits from tonight, and the source-bundle workflow adds a second commit to every push. | (a) Report how many production deploys tonight's work triggered. (b) One change = one deploy: stop the workflow's second commit from triggering its own build, and mark report-only commits so Netlify skips them (`[skip netlify]`). (c) Confirm branch deploys and deploy previews are off, so pushes to `architect` and work branches cost nothing; if they cost credits, say so. (d) v3 reaches production in at most 3 deploys. |
| F2 | Withdrawn as a cost risk | Polling every 4 s is about 59,000 requests per class, which at the observed rate is about 12 credits. | Optional: back off to 10 s when idle. Not needed before class. |
| F3 | Optional | `join` hashes the passcode while holding the world lock. | Hash before the transaction. |
| F4 | Moot under v3 | Instructor could not edit a scenario's starting paths. | Starting paths are dropped (C9). |
| F5 | Optional | Second student with the same first name sees only "The passcode does not match." | Add: "If you are new, pick a different name." |
| F6 | Housekeeping | Two files named `ARCHITECT-NOTES.md` (mine on `architect`, the Engineer's on `main`). | Rename or remove the one on `main`. |

`FINAL-REPORT.md` item 17 (pan and pinch on a real phone) is still open; Neven can close it by opening `/stress` on his phone.

## Questions for the Engineer

None open.

## Handoff log

Newest first. Each entry: commit or file, what is ready, who acts next. (Entries I logged earlier tonight carried times about an hour fast; the times below are from the commits.)

- **Nov 10, 09:40 ET — Architect.** `ARCHITECT-NOTES.md` § "Review 3": v4 core at `19fdf3b` reviewed from code and report; no blocking defect; F11, F12 logged as known limitations. Deploy budget restated: 8 total, 4 left. **Next: Neven** (sandbox play, go / no-go by 11:00). **Engineer:** hold; fix reported defects in batches; Tier 2 on his go.

- **Nov 10, 08:40 ET — Architect.** `ARCHITECT-NOTES.md` Current focus: Designer is available to test at once. Deploy Tier 1 when it passes rather than at 10:30; two lanes for his findings (defects → Engineer via Bolus; design changes → Architect); deploy budget 8, overriding the 4 in §16.9. 11:00 go / no-go and the 12:00 freeze stand. **Next: Engineer.**

- **Nov 10, 08:35 ET — Architect.** `docs/JOOTSY_TUESDAY_SPEC.md` → **v4**: new §16 from the Designer's notes after playing v3. Additive schema (`draft` flags), session rules S1–S11, Board/Cards, the editor, Jootsy!, removals, Tier 2 polish, acceptance (§16.8), timetable and rollback (§16.9). F8 folded in; F10 moot; "frozen at v3" lifted by the Designer. **Next: Engineer** — Tier 1 by 10:30 ET.

- **Nov 10, 07:35 ET — Architect.** `ARCHITECT-NOTES.md`: new F10 (the label on another player's blank card is unclear; Designer report). **Next: Engineer** — F8 and F10 together, one deploy, by 09:00 ET.

- **Nov 10, 01:20 ET — Architect.** `ARCHITECT-NOTES.md` § "Review 2": v3 at `cd96e44` reviewed from code and reports. No blocking defect; go for class. F1 and F7 closed. New F8 (hidden card's name still visible), to be batched. **Next: Neven** (ten-minute play in the sandbox, phone if possible). **Engineer:** F8 only, held.

- **Nov 10, 00:40 ET — Architect.** `docs/JOOTSY_TUESDAY_SPEC.md` → **v3**: §15 rewritten whole. It replaces v2.2–v2.4, which the Engineer had not started. Model change: cuts on paths, blank cards owned by the cutter, anyone cuts from any written card, claims removed, no perimeters, five cards, Players panel, migration (§15.8), acceptance (§15.9), snapshot/rollback/deploy budget (§15.10). Notes rewritten; new finding F7 (deploy credits); F2 withdrawn. **Next: Engineer** — F1, F7, then §15.
- **Nov 10, 00:15–00:18 ET — Architect.** Spec v2.2 → v2.4 in five commits (`016ec63` … `7927252`), following Designer messages as they arrived. All superseded by v3.
- **Nov 10, 00:13 ET — Architect.** `6dbe3ad`: Review 1 of v2. No blocking defect.
- **Nov 9, 22:19 ET — Architect.** `a15f81b`: End of Game Perimeter recorded as an open boundary. Superseded Nov 10.
- **Nov 9, 22:17 ET — Architect.** `a7665cf`: thresholds confirmed. Superseded Nov 10.
- **Nov 9, 22:13 ET — Architect.** `4edbbfc`: first commit: v2 spec, build plan, notes.
