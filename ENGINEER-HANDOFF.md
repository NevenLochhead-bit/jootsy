# Current focus

- **v4 core is deployed and ready for review**, runtime `6d927bace8eee3f5ab7a57e127d7dbe527932dfc` / PR #5, published 09:06 ET. [V4-REPORT.md](V4-REPORT.md) contains the §16.8 checklist, evidence, decisions and exact no-go SQL.
- **Next actor: Neven as Designer**, for the 10:30–11:00 walkthrough and 11:00 go/no-go. Architect can review core now in https://jootsy.netlify.app/sandbox . Reload the page before testing.
- Core checks 2–14 pass; check 1's game flow passes with human listening still needed for the chime. Physical-phone touch/pinch/performance remains the hardware check. No observed functional failure remains.
- Three of four v4 production publications used. Tier 2 remains held until explicit Neven go; nothing deploys after noon. Existing Postgres/Blobs retained; Netlify Pro verified. Credentials remain private.
- Direct chat delivery to Bolus was attempted, but the app's thread-list tool failed, so no cross-chat notice was sent. The notice below is ready to relay. Do not rely on automatic alerts.

Authoritative Architect notes and the Current focus for the project are on branch `architect`: [ARCHITECT-NOTES.md](https://github.com/NevenLochhead-bit/jootsy/blob/architect/ARCHITECT-NOTES.md). This file records engineering handoffs only.

## Handoff log

- Engineer: `main` code `ee9b428` / PR #1; source-expansion runs 11–13 passed off main, live sandbox API suite passed, cross-browser student and instructor flows passed. Final correction changes only the selected-state ARIA attribute from a presence flag to the required true/false string. Deployed browser verification returned false → true → false with no in-app browser console errors. Next: Architect. Detailed evidence and decisions: V3-REPORT.md.

- Final Engineer handoff: code `cd96e44`; detailed acceptance evidence in [V3-REPORT.md](V3-REPORT.md), screenshot in [docs/verification/v3-map.jpg](docs/verification/v3-map.jpg). Ready for Architect’s §15.9 walkthrough at https://jootsy.netlify.app/sandbox . Next actor: Architect. Designer: no blocking decision. Real-phone speed/pinch remains the hardware check.
- Notice for Bolus to relay verbatim: **Engineer pushed: v3 is deployed at cd96e44; V3-REPORT.md and ENGINEER-HANDOFF.md are ready; Architect reviews the sandbox next.** No passcode or private billing detail belongs in that notice.

## v4 core handoff

- Relevant runtime commit: `6d927ba`, PR #5. Review files: V4-REPORT.md, public/editor.js, netlify/functions/api.mjs, netlify/database/migrations/20261110133000_sessions_v4.sql; screenshots under docs/verification/v4-*.jpg.
- Ready: private three-stage sessions, autosave/recovery, Change/Undo including removed subtrees, atomic Commit, committed Board, Cards threads, Wormhole, Jootsy and instructor hiding.
- Architect acts next on the sandbox review. Designer items for Neven: listen to Commit, try a real phone, then give go/no-go at 11:00 ET. No one should infer go from silence.
- Notice for Bolus: **Engineer pushed: v4 core is live at 6d927ba; V4-REPORT.md and ENGINEER-HANDOFF.md are ready; Architect reviews the sandbox, and Neven gives the 11:00 go/no-go.**
