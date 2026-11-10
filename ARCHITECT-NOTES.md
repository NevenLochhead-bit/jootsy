# Architect Notes — Jootsy!

## Current focus

- **State (Tue Nov 10, 01:00 ET):** Slices A + B + C are deployed (`main`, code release `2c16471`). Review 1 found no blocking defect. Neven has decided the game changes to **"write, then cut"**: cards are all the same; Fork, Destiny, Dream, Wormhole and Dead End are options for how the author puts them in relation.
- **Next to act: Engineer.** In this order: (1) F1 and F2 below; (2) spec **v2.2**, `docs/JOOTSY_TUESDAY_SPEC.md` §15 on branch `architect`. Cutoff 09:00 ET; rollback recipe in §15.7.
- **Then: Architect.** Review of v2.2 against §15.6.
- **Next to act: Neven as Designer**, on items 2–4 under "Designer → Open". None blocks the Engineer.
- **Class:** Tue Nov 10, 12:30 pm ET. `2c16471` is class-ready as it stands and is the fallback if v2.2 misses its cutoff.

## Where things are

| What | Where |
|---|---|
| The spec the Engineer builds from (v2) | `docs/JOOTSY_TUESDAY_SPEC.md` on branch `architect` |
| Build plan for Neven (v2) | `docs/JOOTSY_BUILD_PLAN.md` on branch `architect` |
| These notes | `ARCHITECT-NOTES.md` on branch `architect` |

I write only to the `architect` branch, so my notes never trigger a Netlify deploy or collide with Engineer pushes on `main`. Read with:

```
git fetch origin architect && git show origin/architect:ARCHITECT-NOTES.md
```

If a spec change is needed I edit `docs/JOOTSY_TUESDAY_SPEC.md` here, bump its version line, and list the change in the log below. The Engineer never has to diff the spec to find out what changed.

**This repo is public.** No passcodes, database URLs or keys in any commit, note or report. The instructor passcode goes to Neven outside the repo; he passes it to me.

## Designer (Neven)

Decided:

| Date | Decision |
|---|---|
| Nov 9 | Anyone may play on any unwritten path: "a truly open networked structure." |
| Nov 9 | The game must keep the sense of playing cards. |
| Nov 9 | A Jootsy! card means jumping into another's timeline; the design must hold that distinction. Integrated as: only a Jootsy! lets you into a face-up card someone else wrote (spec §13). |
| Nov 9 | Scenarios are created by Neven only. He creates new ones himself. |
| Nov 9 | Deploy path is GitHub → Netlify. |
| Nov 9 | **Thresholds confirmed.** Asked by Bolus: "Jootsy unlocks at ring 7 after seven cards have been played, and the game ends at ring 11. Are you happy with that default?" Answer: "yes." In the spec: `jootsy_ring=7`, `jootsy_min_cards=7`, `end_ring=11`. Still adjustable in settings. |
| Nov 9 | **End of Game Perimeter is an open boundary.** Asked by Bolus whether he intended a hard stop at ring 11 or whether play should remain possible beyond it. Answer: "still allows play." The perimeter at ring 11 is drawn and labelled, and cards may be played beyond it. This matches the spec (§8.5); no change. |
| Nov 10 | **Write, then cut.** "Every card is essentially the same, but you determine how it branches… it's all about negotiating the cut from one to the next." And: "to me it is cleaner and I think we should change it. so we aren't playing specific cards but have these options for how to put them in relation." Issued as spec v2.2 (§15) for Tuesday. The hand of typed cards is removed; face-down cards and card backs stay. |
| Nov 10 | **The trace.** "The arrows have a trace of what the transition is, I can see a little arrow with the word wormhole on it for instance, so we understand the movement." Added to v2.2 as §15.4a. |

Open:

2. **Netlify plan.** Which plan is the `jootsy` site on, and what does its function usage allowance look like? See F2. Only he can see the account.
3. **Cuts on the card's edges.** Neven proposed (Nov 10, 00:12) that the cut buttons sit on all four sides of the card, any cut from any side: "I could draw a fork out of the top, or a wormhole on the side to the right." My reply: yes to cuts living on the card's edges; no to the side choosing where the next card goes, because that returns placement to the player and breaks the derived map (ring = distance). Offered instead: fixed meanings per edge (back / forward / the two lateral doors). Thursday at the earliest; nothing to build. Awaiting his answer.
4. **The word "cut".** v2.2 uses his word from "negotiating the cut" in all player-facing copy ("How does it cut?"). His to confirm or replace.

## Architect decisions (mine; not for Designer unless he objects)

- A card's type is fixed when it is played and determines the paths it names (spec R5).
- Soft claim while writing, 10 minutes (R6).
- Fragments 600 characters, labels 60 (R12).
- Card backs generated per player; a face-down card shows its dealer's back (§9).
- Tuesday media is images and pasted links only.
- Jootsy! mirrors the target card live; it never stores a copy (§13).

## Review 1 — Tue Nov 10, 00:45 ET

**Reviewed:** `netlify/functions/api.mjs`, the initial migration, `public/app.js` (composer, polling, rendering), `netlify.toml`, at `main` `8d7aea2`. Live site: join screen at 375 px (no horizontal overflow), and unauthenticated requests to `state` and `plays` (401), a bad token (401), an unknown world (404).

**Not reviewed:** play as two or three students in a browser. I do not create players or type passcodes on the live site myself. Either Neven signs a test student into the sandbox in the browser pane and I walk it from there, or the Engineer's browser evidence in `FINAL-REPORT.md` stands. My container cannot reach `jootsy.netlify.app` directly.

**What holds, from the code:**
- R1/R4: one live card per path is enforced by a partial unique index and by a world-row lock on every write. Concurrent plays cannot both land.
- R2: depth is set server-side from the parent.
- R5–R7, R9, R10: type/path counts, claims, scenario paths, path limits and delete rules match the spec.
- R8/R11: every author-only route checks ownership server-side.
- Delta reads run in a read-only repeatable-read snapshot, so a poll can never see half a write or skip a revision.
- No `innerHTML` anywhere in the client; fragments are text nodes.

**Findings**

| # | Severity | Finding | Ask |
|---|---|---|---|
| F1 | Do before class | Tokens are signed with `TOKEN_SECRET`, falling back to `INSTRUCTOR_PASSCODE` (`api.mjs` line 16). If the fallback is in use, any student's token is material for guessing the instructor passcode offline. | Confirm a random `TOKEN_SECRET` (32+ bytes) is set in the Netlify environment. If it is not, set it now; everyone logs in again, so do it before students join. Reply yes/no here, never the value. |
| F2 | Do before class | Every visible tab polls every 4 s. 33 students is about 8 function calls a second, roughly 59,000 per two-hour class, twice this week, plus play in between. Depending on the Netlify plan this may exhaust the allowance or cost money. | Make polling adaptive: 4 s for 60 s after the player's own action or any received change; otherwise 10 s; 15 s while the composer is open. Keep the pause when hidden and the immediate refresh after own writes. Report the measured calls per minute for one idle tab and one active tab. |
| F3 | Optional | `join` hashes the passcode with scrypt while holding the world lock. 33 students joining in the same minute queue behind each other. | Hash before opening the transaction. |
| F4 | Optional | An instructor cannot rename or remove a scenario's unwritten starting paths: the route requires authorship and scenarios have no author. | Allow instructors on scenario paths. |
| F5 | Optional | Two students with the same first name: the second sees "That name already exists. The passcode does not match." | Add: "If you are new, pick a different name." |
| F6 | Housekeeping | There are two files named `ARCHITECT-NOTES.md`: mine on `architect`, and one the Engineer wrote on `main`. | Engineer's status goes in `FINAL-REPORT.md` or an `ENGINEER-NOTES.md`. Remove or rename the copy on `main`. |

`FINAL-REPORT.md` item 17 (pan and pinch on a real mid-range phone) is still open. Neven can close it in one minute by opening `/stress` on his own phone.

## Questions for the Engineer

1. F1: is `TOKEN_SECRET` set? Yes or no.
2. Answered in `FINAL-REPORT.md`: Netlify managed Postgres and Netlify Blobs, no retention click, `main` deploys.

## Handoff log

Newest first. Each entry: commit or file, what is ready, who acts next.

- **Nov 10, 01:10 ET — Architect.** `docs/JOOTSY_TUESDAY_SPEC.md` v2.2: added §15.4a "The trace on every connection" and acceptance A7. Part of the same v2.2 work; no new data. **Next: Engineer**, unchanged (F1, F2, then §15).

- **Nov 10, 01:00 ET — Architect.** `docs/JOOTSY_TUESDAY_SPEC.md` → **v2.2**: new §15 "write, then cut" (one new card state `open`, two new routes, the hand removed, acceptance A1–A6, cutoff and rollback). Supersedes the v2.1 composer-reorder proposal, now deleted from these notes. **Next: Engineer** — F1, F2, then §15.

- **Nov 10, 00:55 ET — Architect.** `ARCHITECT-NOTES.md`: Designer item 3 opened (cuts on the card's edges). Nothing to build. **Next: unchanged** — Engineer on F1, F2; Neven on Designer items 1–3.

- **Nov 10, 00:45 ET — Architect.** `ARCHITECT-NOTES.md` § "Review 1": first review of `main` `8d7aea2` (code release `2c16471`). No blocking defect. Findings F1–F6; F1 and F2 before class. Two Designer items opened. **Next: Engineer** (F1, F2) **and Neven** (Designer items 1 and 2).

- **Nov 9, 22:30 ET — Architect.** `ARCHITECT-NOTES.md`: Designer clarification recorded (relayed by Bolus): ring 11 is an open boundary, play continues beyond it. My earlier note raising the question is removed as resolved. No spec change. **Next: Engineer** (Slice A + report), unchanged.

- **Nov 9, 22:25 ET — Architect.** `ARCHITECT-NOTES.md`: Designer confirmation of thresholds recorded (relayed by Bolus). No spec change; the values were already the spec's defaults. **Next: Engineer** (Slice A + report), unchanged.

- **Nov 9, 22:20 ET — Architect.** Branch `architect`, first commit: `docs/JOOTSY_TUESDAY_SPEC.md` (v2, identical to the kickoff copy), `docs/JOOTSY_BUILD_PLAN.md`, these notes. Nothing to review. **Next: Engineer** (Slice A + report).
