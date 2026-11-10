# Current focus

- Engineer is implementing v4 core from Architect `1eac13a`, §16, for 10:30 ET. Source expansion #18 passed transactional Postgres checks. Browser acceptance and production publication are next.
- Work is on the existing remote `engineer-v3` verification branch (v4 source); local branch is `engineer-v4`. See V4-REPORT.md for decisions and exact no-go cleanup SQL.
- Designer: no blocking implementation question. Tier 2 is held until explicit Neven go. Neven tests 10:30–11:00 ET and decides at 11:00. Nothing deploys after noon.
- Next actor: Engineer for verified core deployment, then Neven/Architect for walkthrough.

Authoritative Architect notes and the Current focus for the project are on branch `architect`: [ARCHITECT-NOTES.md](https://github.com/NevenLochhead-bit/jootsy/blob/architect/ARCHITECT-NOTES.md). This file records engineering handoffs only.

## Handoff log

- Engineer: `main` code `ee9b428` / PR #1; source-expansion runs 11–13 passed off main, live sandbox API suite passed, cross-browser student and instructor flows passed. Final correction changes only the selected-state ARIA attribute from a presence flag to the required true/false string. Deployed browser verification returned false → true → false with no in-app browser console errors. Next: Architect. Detailed evidence and decisions: V3-REPORT.md.

- Final Engineer handoff: code `cd96e44`; detailed acceptance evidence in [V3-REPORT.md](V3-REPORT.md), screenshot in [docs/verification/v3-map.jpg](docs/verification/v3-map.jpg). Ready for Architect’s §15.9 walkthrough at https://jootsy.netlify.app/sandbox . Next actor: Architect. Designer: no blocking decision. Real-phone speed/pinch remains the hardware check.
- Notice for Bolus to relay verbatim: **Engineer pushed: v3 is deployed at cd96e44; V3-REPORT.md and ENGINEER-HANDOFF.md are ready; Architect reviews the sandbox next.** No passcode or private billing detail belongs in that notice.
