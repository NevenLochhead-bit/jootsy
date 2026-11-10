# Current focus

- **17.A + 17.B are deployed together and verified**, runtime `f2e317e6a1b8bc1445cdbf2b2ba6d07331dc514f` / PR #7, 10:01 ET. Deploy **5 of 8**. Three publications remain; final by 11:45 ET, nothing after noon.
- Browser acceptance: returning typo and taken-name refusals, name spacing/case, keyboard Enter and assertive error regions, Show passcode, signed-in identity, one-card green Commit, live Choices, Destiny-first order, no stage-three outgoing controls, empty Board centre, instructor-only Add Scenario and remembered Players collapse pass. Safari returned as the same player and recovered the saved open session and card text. Actual VoiceOver speech was not tested.
- **Next actor: Engineer**, building 17.C image + sound, then 17.D wires + scan. Safari playback is a release gate for sound; if it is not solid by 11:30, ship without Add sound.
- Decisions: Name still labels the player identity and scenario name, as explicitly required by B/the scenario form; card fields are Choice and Narrative Fragment. Cards now shows the unfinished-session banner and Resume alongside committed cards. Stage-three incoming Change remains; outgoing transition controls are removed.
- Neven's Commit sound approval is recorded. Physical-phone touch/pinch/performance remains his hardware check. Existing Postgres/Blobs and private instructor environment are unchanged. F11/F12 remain after-class items.

Authoritative Architect notes and the Current focus for the project are on branch `architect`: [ARCHITECT-NOTES.md](https://github.com/NevenLochhead-bit/jootsy/blob/architect/ARCHITECT-NOTES.md). This file records engineering handoffs only.

## Handoff log

- Engineer: `main` code `ee9b428` / PR #1; source-expansion runs 11–13 passed off main, live sandbox API suite passed, cross-browser student and instructor flows passed. Final correction changes only the selected-state ARIA attribute from a presence flag to the required true/false string. Deployed browser verification returned false → true → false with no in-app browser console errors. Next: Architect. Detailed evidence and decisions: V3-REPORT.md.

- Final Engineer handoff: code `cd96e44`; detailed acceptance evidence in [V3-REPORT.md](V3-REPORT.md), screenshot in [docs/verification/v3-map.jpg](docs/verification/v3-map.jpg). Ready for Architect’s §15.9 walkthrough at https://jootsy.netlify.app/sandbox . Next actor: Architect. Designer: no blocking decision. Real-phone speed/pinch remains the hardware check.
- Notice for Bolus to relay verbatim: **Engineer pushed: v3 is deployed at cd96e44; V3-REPORT.md and ENGINEER-HANDOFF.md are ready; Architect reviews the sandbox next.** No passcode or private billing detail belongs in that notice.

## v4 core handoff

- Relevant runtime commit: `19fdf3b`, PR #6. Review files: V4-REPORT.md, public/editor.js, netlify/functions/api.mjs, netlify/database/migrations/20261110133000_sessions_v4.sql; screenshots under docs/verification/v4-*.jpg.
- Ready: private three-stage sessions, autosave/recovery, Change/Undo including removed subtrees, atomic Commit, committed Board, Cards threads, Wormhole, Jootsy and instructor hiding.
- Architect acts next on the sandbox review. Designer items for Neven: listen to Commit, try a real phone, then give go/no-go at 11:00 ET. No one should infer go from silence.
- Notice for Bolus: **Engineer pushed: v4 core is live at 19fdf3b; V4-REPORT.md and ENGINEER-HANDOFF.md are ready; Architect reviews the sandbox, and Neven gives the 11:00 go/no-go.**

## v4.1 A+B handoff

- Runtime `f2e317e` / PR #7; source-expansion #30 and transaction checks #36 passed. Evidence: docs/verification/v41-ab.jpg (saved locally, included in the next source bundle).
- Ready for Architect review in https://jootsy.netlify.app/sandbox . Class URL remains https://jootsy.netlify.app/mdst1050 . Reload before testing.
- Next: Engineer builds C then D without waiting. No Designer decision is blocking.
- Notice: **Engineer pushed: v4.1 A+B are live at f2e317e; ENGINEER-HANDOFF.md is ready; Architect can review while Engineer builds C.**
