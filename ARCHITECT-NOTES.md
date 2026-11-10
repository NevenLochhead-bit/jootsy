# Architect Notes — Jootsy!

## Current focus

- **State (Mon Nov 9, 22:25 ET):** v2 spec issued. Engineer is building Slice A. Nothing deployed or reviewed yet.
- **Next to act: Engineer.** Push Slice A, with a report (spec §14) in the repo: deployed URL, database and storage used, checklist items passing and failing, decisions made where the spec was silent.
- **Then: Architect.** I play the deployed build as three students (spec §12, items 1–12, 15, 16) and reply here with pass/fail and fixes.
- **Decisions needed from Neven as Designer:** none. All Designer items to date are confirmed.
- **Class:** Tue Nov 10, 12:30 pm ET. Slices A + B are the class-ready game. Fallback is last year's Miro board; I will say so here, in this block, the moment it looks necessary.

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

Architect's note on that confirmation: the question said the game "ends" at ring 11. In the spec the End of Game Perimeter is an open boundary, as in the brief: it is drawn and labelled, and cards may still be played beyond it. Nothing stops at ring 11. If Neven wants a hard stop, that is a new Designer item; I am not treating his "yes" as asking for one.

## Architect decisions (mine; not for Designer unless he objects)

- A card's type is fixed when it is played and determines the paths it names (spec R5).
- Soft claim while writing, 10 minutes (R6).
- Fragments 600 characters, labels 60 (R12).
- Card backs generated per player; a face-down card shows its dealer's back (§9).
- Tuesday media is images and pasted links only.
- Jootsy! mirrors the target card live; it never stores a copy (§13).

## Questions for the Engineer

1. Which database and storage did you provision, and does Neven have to click anything to keep them?
2. Is `main` what Netlify deploys? If you use a different branch, say which.

## Handoff log

Newest first. Each entry: commit or file, what is ready, who acts next.

- **Nov 9, 22:25 ET — Architect.** `ARCHITECT-NOTES.md`: Designer confirmation of thresholds recorded (relayed by Bolus). No spec change; the values were already the spec's defaults. **Next: Engineer** (Slice A + report), unchanged.

- **Nov 9, 22:20 ET — Architect.** Branch `architect`, first commit: `docs/JOOTSY_TUESDAY_SPEC.md` (v2, identical to the kickoff copy), `docs/JOOTSY_BUILD_PLAN.md`, these notes. Nothing to review. **Next: Engineer** (Slice A + report).
