# Current focus

- Spec v3 from `architect` / `d94e022` is deployed. Verified code release: `main` at `cd96e44dc3beb619aaf3d061356d62dacf846151` (PR #2). Two v3 production deploys total. Architect should review the sandbox against §15.9.
- Core acceptance §15.9 items 1–14 pass via live browser/API or disposable Postgres evidence. First loop at 360px: 43 seconds; cross-browser blank update 2.588s and written-card update 2.09s; new scenario 2.83s. Physical mid-range-phone performance/pinch remains partial (retained §12 item 17).
- F1: **yes**, an independently generated 32-byte TOKEN_SECRET is set for Functions. v3 removes the instructor-passcode fallback. No secret value belongs in the repo.
- F7: v2 triggered **15 production deploy attempts: 14 completed, one dependency-install failure**, as counted across both Netlify Deploys pages. Main upload and expansion commits both built. Branch deploys were already off. Deploy previews are now off too. Workflow/config/report commits use `[skip netlify]`; transport uploads also use it, so only verified expanded runtime code builds. A runtime-only ignore rule additionally skips report-only changes.
- The source-expansion workflow now tests against disposable Postgres before committing expanded code. Engineer v3 work uses `engineer-v3`; no branch/preview build is enabled. v3 production deploy count: **two published**, within the maximum three. Report-only commits are skipped.
- Rollback: native Netlify backup for v2 deploy `6af2a665f14267fb389fe8e3` (Nov 10 00:07 ET) exists. The v3 migration additionally snapshots all five game tables, under a write lock and within the migration transaction, into the server-only schema `jootsy_v2_snapshot` before converting rows. See V3-REPORT.md.
- Next actor: Architect, for §15.9 review and a real-phone check. Engineer will fix concrete findings. Designer: no blocking question; Architect’s three veto items remain in the authoritative notes.

Authoritative Architect notes and the Current focus for the project are on branch `architect`: [ARCHITECT-NOTES.md](https://github.com/NevenLochhead-bit/jootsy/blob/architect/ARCHITECT-NOTES.md). This file records engineering handoffs only.

## Handoff log

- Engineer: `main` code `ee9b428` / PR #1; source-expansion runs 11–13 passed off main, live sandbox API suite passed, cross-browser student and instructor flows passed. Final correction changes only the selected-state ARIA attribute from a presence flag to the required true/false string. Deployed browser verification returned false → true → false with no in-app browser console errors. Next: Architect. Detailed evidence and decisions: V3-REPORT.md.

- Final Engineer handoff: code `cd96e44`; detailed acceptance evidence in [V3-REPORT.md](V3-REPORT.md), screenshot in [docs/verification/v3-map.jpg](docs/verification/v3-map.jpg). Ready for Architect’s §15.9 walkthrough at https://jootsy.netlify.app/sandbox . Next actor: Architect. Designer: no blocking decision. Real-phone speed/pinch remains the hardware check.
- Notice for Bolus to relay verbatim: **Engineer pushed: v3 is deployed at cd96e44; V3-REPORT.md and ENGINEER-HANDOFF.md are ready; Architect reviews the sandbox next.** No passcode or private billing detail belongs in that notice.
