# Architect Notes — Jootsy!

## Current focus

- **State (Wed Nov 11, 23:55 ET):** live site is `main` `ca461c6` (confirmed: the served editor matches it). Since my last entry the Engineer shipped PR #11 (the Designer's visual redesign), #12 (white logo; demo names), #13 (demo players renamed Student 1–35), and **#14 and #15 (editor layout fixes, Tue 22:15 and 22:40)**. Review 5 below: all five are sound in themselves. **One finding must be fixed before the next release: F13.**
- **F13, before anything else ships:** PRs #14 and #15 changed `public/editor.js`, `public/app.js` and `public/style.css` directly, but **`source.tar.gz` still holds the older copies**. The "Expand source bundle" workflow untars that file over the tree whenever it changes, so **the Engineer's next bundle release will silently undo #14 and #15** (173 changed lines).
- **Next to act: Engineer.** Fix F13 (see Review 5 for the two acceptable ways), and bring `ENGINEER-HANDOFF.md` up to date: it stops at PR #13 and says nothing of #14 or #15. No game change is requested.
- **Next to act: Neven.** Nothing blocking. Thursday's class runs on what is live. If he wants anything changed before then, it comes through me as a spec line or to the Engineer as a visual note, **after** F13.
- **The class world now holds students' work.** From here on: migrations are additive only; no test writing in `mdst1050`; a database snapshot before any migration; the sandbox is the demonstration board and is not for automated tests either.

## Where things are

| What | Where |
|---|---|
| The spec (v4.1; fully built and live) | `docs/JOOTSY_TUESDAY_SPEC.md` on branch `architect` |
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
| Nov 10, 09:40 | **After playing v4 — words.** "Name" becomes "Choice", with a "Choices" section under the previous card listing it. "Fragment" becomes "Narrative Fragment". The Jootsy! confirm reads "Jootsy it!". "Find me" becomes "My Latest". Order: Destiny, Fork, Dream, Wormhole, Jootsy. |
| Nov 10, 09:40 | **After playing v4 — behaviour.** No transition options at all on the third stage. Commit possible after one stage, green when available. Each card: Add image and Add sound; no Paste a link. Add Scenario button beside Refresh. Remove the Jootsy! card at the centre of the Board. Players panel collapsible. Refresh runs a scan. Reasonable upload limits. |
| Nov 10, 09:40 | **Wires.** Arrowheads go; "an animation on each wire that shows a swelled bit of light passing through the wire." |
| Nov 10, 09:40 | **Login** must be "clear, easy, accessible"; students must be able to get back to their previous sessions. Graphic design notes go from him to the Engineer directly. |
| Nov 10, 09:42 | **GO on v4.** "go! yes i hear it - perfect." The commit sound is right. |
| Nov 10, 10:22 | **Short video on a card** "would be really nice." Issued as §17.C2: MP4 up to 4 MB, built after sound, same 11:30 gate. |

For him to veto (my calls inside his rules; they stand unless he objects):

1. **Sessions are saved on the server as drafts**, invisible to everyone else until Commit. Not in the browser only: a closed tab must not lose a student's writing.
2. **One open session at a time.** Commit or discard before starting another.
3. **A Fork needs both cards written to commit.** To commit one, Change it to a Destiny. Otherwise the Board fills with one-legged forks.
4. **Jootsy! still unlocks at five cards**, as he decided last night; instructors are exempt so he can demo it. A Jootsy! and a Wormhole can only leave a card you wrote.
5. **Transitions on committed cards cannot be changed today.** Change works inside a session only.
6. **Add Scenario is instructor-only**, following "only me for scenarios".
7. **Sound limit: MP3 or M4A up to 2 MB**, one image and one sound per card, 60 uploads per player.
8. **Video is MP4 up to 4 MB only** (§17.C2). Clips exported small will fit; clips straight off a phone usually will not, and iPhone `.mov` files are refused. Larger video needs a different upload route, not before Thursday.
9. **The join screen asks "I'm new" or "I've played before"**, so a misspelt name on Thursday cannot quietly create a second, empty player.

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

## Review 5 — Wed Nov 11, 23:55 ET (of PRs #11–#15, `1509e36..ca461c6`)

**Reviewed:** the diff of each PR, both data migrations, the expand-source workflow, `source.tar.gz` against the tree, `ENGINEER-HANDOFF.md`, and the live site's served `editor.js` and `style.css`.

| PR | When (ET) | What it changed | Verdict |
|---|---|---|---|
| #11 | Tue 11:39 | Redesign from the Designer's notes: header, scenario "source" nodes (`public/source-node.js`), small edits to `app.js`, `map.js`, `style.css`. Client only. | Fine. Not purely styling, as I had asked, but nothing server-side and no player-facing wording changed. |
| #12 | Tue 11:59 | White logo (CSS). Migration renaming **sandbox** players to fictional names. | Fine. The migration is scoped by `slug='sandbox'` and exits if that world is missing. |
| #13 | Tue 12:05 | Migration renaming the same sandbox players to "Student 1…35". No app code. | Fine. **Published five minutes after the 12:00 stop**, at the Designer's request; recorded, not contested. |
| #14 | Tue 22:15 | Editor: transition buttons stay compact on an unwritten card; column 3 heading "Then commit" → **"Then what?"**. Client only. | Fine. Save, Change and Commit logic untouched. One player-facing phrase changed without a spec line; it is better than what it replaced. |
| #15 | Tue 22:40 | Editor: aligned headings, equal card sizes, "From {card}" caption on stage-three cells; 100 lines of CSS. Client only. | Fine. Same logic paths; a null session is still guarded before `build()`. |

Neither migration touches `mdst1050`, `stress`, the instructor, passcodes, cards or paths. Transaction checks passed on `main` after #14 and #15.

**Findings**

| # | Severity | Finding | Ask |
|---|---|---|---|
| F13 | **Fix before the next release** | `source.tar.gz` is the input to `.github/workflows/expand-source.yml`, which runs `tar -xzf source.tar.gz` over the working tree on any push that changes the tarball (on `main` or `engineer-v3`) and commits the result. #14 and #15 were made directly on the tree from `fix/*` branches and did not update the tarball. Verified: the tarball's `public/editor.js`, `public/app.js` and `public/style.css` differ from the tree by 57, 16 and 100 lines; `map.js` and `api.mjs` are identical. The next tarball push reverts both PRs without any conflict or warning, and `engineer-v3` merges `main` with `-X ours` before expanding, so it would not notice either. | Choose one and say which in the handoff. **(a) Preferred: retire the bundle.** Make the tree on `main` the only source of truth, delete `source.tar.gz` and the expand workflow, keep `check.yml`. A 2.2 MB binary re-committed on every release is also what is bloating the repo. **(b) Minimum:** regenerate `source.tar.gz` from `main` at `ca461c6` so the two agree, and add a CI check that fails when the tarball and the tree differ. Either way: one `[skip netlify]` commit, **no production deploy needed**, since the served files do not change. |
| F14 | Process | #14 and #15 came from a different working pattern (`fix/*` branches, direct tree edits) with no entry in `ENGINEER-HANDOFF.md`, whose Current focus still names #13 as the latest release. | Update the handoff: what #14 and #15 changed, how they were verified (browser, widths), and the deploy count. If a second engineer or session is working on this repo, name it there, so both know about the tarball. |
| F15 | Housekeeping | Stale remote branches: `engineer-b`, `fix/editor-move-layout`, `fix/session-card-alignment` (both merged). | Delete the merged ones when convenient. |

**Still unverified by anyone:** a physical phone, a real screen reader, and reduced-motion behaviour. F11 and F12 remain open as after-class items.

**Credits:** by the Engineer's count the site had 11 production publications by Tuesday 12:05, and #14 and #15 make 13 since my budget of 8, at about 15 credits each. Neven should look at the balance before the next round of changes.

## Review 4 — Tue Nov 10, 10:15 ET (of v4.1 A+B at `main` `41a75d3`, runtime `f2e317e`)

**Reviewed:** `ENGINEER-HANDOFF.md` and the `join` route in `netlify/functions/api.mjs`. The rest of A+B is client wording and layout, which I accept on the Engineer's browser evidence.

- `mode` is required. `new` refuses an existing name (and the reserved instructor name). `returning` refuses an unknown name and **never creates a player**, except the instructor's first sign-in, which still requires the instructor passcode. Wrong passcode is refused. Names are trimmed, inner spaces collapsed, case-insensitive. Correct.
- The Engineer kept "Name" for the player's own name and the scenario's name, and uses "Choice" only for the card field. That is the right reading of §17.A.1.
- Not tested by anyone: a real screen reader's speech (roles and live regions are in place), and a physical phone.

No findings.

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

1. F13: (a) or (b)?
2. F14: was #14/#15 a second session or agent? Where is its verification recorded?

## Handoff log

Newest first. Each entry: commit or file, what is ready, who acts next. (Entries I logged earlier tonight carried times about an hour fast; the times below are from the commits.)

- **Nov 11, 23:55 ET — Architect.** `ARCHITECT-NOTES.md` § "Review 5": PRs #11–#15 reviewed at `ca461c6`; all sound; live site confirmed to match. **F13** (the source bundle will revert #14 and #15 on the next release) must be fixed first; F14 handoff out of date; F15 stale branches. **Next: Engineer** — F13 then F14, no deploy needed.

- **Nov 10, 11:35 ET — Architect.** `ARCHITECT-NOTES.md` Current focus: Designer has lifted the freeze for a visual redesign, working with the Engineer directly. Conditions recorded (styling only, one deploy by 11:50, rollback target `1509e36`). The Engineer's final v4.1 evidence (sound, video, wires) is read and accepted. **Next: Engineer.**

- **Nov 10, 11:02 ET — Architect.** `ARCHITECT-NOTES.md` Current focus: all of v4.1 (A, B, C, C2, D) is live at `1509e36`; deploy budget exhausted; freeze. **Next: Engineer** — final recheck and write-up only. **Neven** — full play-through and scenario check.

- **Nov 10, 10:25 ET — Architect.** `docs/JOOTSY_TUESDAY_SPEC.md` v4.1: added **§17.C2** short video on a card (MP4 ≤ 4 MB, `cards.video_url`, after sound, same 11:30 gate). **Next: Engineer** — C, then C2, then D.

- **Nov 10, 10:15 ET — Architect.** `ARCHITECT-NOTES.md` § "Review 4": v4.1 A+B at `f2e317e` reviewed (join route); no findings. Student manual written to Neven's Notion page "Jootsy!". **Next: Engineer** — §17.C, then §17.D; 3 deploys left.

- **Nov 10, 10:00 ET — Architect.** `ARCHITECT-NOTES.md`: Designer **GO on v4** recorded; commit sound confirmed. Tier 2 is released. **Next: Engineer** — §17 (v4.1) A+B, then C, then D; 4 deploys left; last deploy 11:45 ET.

- **Nov 10, 09:55 ET — Architect.** `docs/JOOTSY_TUESDAY_SPEC.md` → **v4.1**: new §17 from the Designer's notes after playing v4. A words/order/removals; B join screen (`mode` on `/join`, never auto-create when returning); C image + sound (`cards.audio_url`, limits, Range support); D light on the wires replacing arrowheads, Refresh scan; acceptance §17.E. No game rule changes. **Next: Engineer** — A+B first.

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
