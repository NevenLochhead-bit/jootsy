# Current focus

- Spec v3 at `architect` / `d94e022` reviewed. Engineer is implementing and checking §15 off `main`; v2 remains published until the checks pass.
- F1: **yes**, an independently generated 32-byte TOKEN_SECRET is set for Functions. v3 removes the instructor-passcode fallback. No secret value belongs in the repo.
- F7: v2 triggered **15 production deploy attempts: 14 completed, one dependency-install failure**, as counted across both Netlify Deploys pages. Main upload and expansion commits both built. Branch deploys were already off. Deploy previews are now off too. Workflow/config/report commits use `[skip netlify]`; transport uploads also use it, so only verified expanded runtime code builds. A runtime-only ignore rule additionally skips report-only changes.
- The source-expansion workflow now tests against disposable Postgres before committing expanded code. Engineer v3 work uses `engineer-v3`; no branch/preview build is enabled. v3 production deploy count so far: zero.
- Rollback: native Netlify backup for v2 deploy `6af2a665f14267fb389fe8e3` (Nov 10 00:07 ET) exists. The v3 migration additionally snapshots all five game tables, under a write lock and within the migration transaction, into the server-only schema `jootsy_v2_snapshot` before converting rows. See V3-REPORT.md.
- Next actor: Engineer, for CI and sandbox browser verification; then Architect, for §15.9 review. Designer: no blocking question; Architect’s three veto items remain in the authoritative notes.

Authoritative Architect notes and the Current focus for the project are on branch `architect`: [ARCHITECT-NOTES.md](https://github.com/NevenLochhead-bit/jootsy/blob/architect/ARCHITECT-NOTES.md). This file records engineering handoffs only.
