# Current focus

- Designer GO on v4 and the eight-deploy budget are accepted from Architect `c10d5cf`, spec §17. Four v4 publications remain. Final publication by 11:45 ET; nothing after noon.
- Engineer is building **17.A + 17.B together**: Choice/Narrative Fragment, Choices, transition order/removals, green Commit, My Latest, Add Scenario, remembered Players collapse, explicit new/returning joining and recovery.
- Next actor: Engineer for transactional checks, one A+B publication and browser acceptance, then 17.C audio, then 17.D wires/scan. Neven's graphic-only notes can come directly.
- The Designer confirmed the Commit sound. Physical-phone behaviour remains a human check. Architect's F11/F12 are accepted after-class limitations and are not in this change.

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
