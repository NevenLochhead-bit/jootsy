# Jootsy v3 engineering report

Status: implementation under off-main verification. No v3 production deploy yet.

Spec: `architect` at `d94e022`, docs/JOOTSY_TUESDAY_SPEC.md §15. Class URL: https://jootsy.netlify.app/mdst1050 ; QA only: https://jootsy.netlify.app/sandbox . Same managed Netlify Postgres and Netlify Blobs image storage. No retention click required. Instructor passcode unchanged and delivered privately, never in this public repo.

## Review 1

- F1 yes: independent random 32-byte signing secret configured, Functions scope. Code now refuses a missing/short signing key; no passcode fallback.
- F7: 15 v2 production attempts, 14 completed / 1 failed installation. Branch builds were off; previews have now been disabled. All transport and report-only commits use `[skip netlify]`; expanded source is tested with disposable PostgreSQL before its bot commit. Runtime-only ignore rule is a second guard. Target: one v3 production deploy, with at most two corrections/rollback deploys.
- F3: hashes prepared before the join world lock; verification remains inside to avoid a reset/login race.
- F5: duplicate-name error now tells newcomers to choose another name.
- F6: main ARCHITECT-NOTES.md is a pointer only; Architect's branch is authoritative. ENGINEER-HANDOFF.md holds engineering updates.

## Migration and rollback

Native v2 database backup is visible at Netlify → jootsy → Data & storage → Database → Backups, production deploy `6af2a665f14267fb389fe8e3`, Nov 10 00:07 ET. The known-good code deploy is `6af2a56caed93547f338e85e` / code commit `2c16471`; published report-only `8d7aea2` has the same runtime code.

Before changing any row, migration `20261110060000_cuts_v3.sql` takes an exclusive lock and copies worlds, players, cards, paths, events and capture time into private `jootsy_v2_snapshot`. No API exposes this schema. It retains the exact immediately-pre-conversion data, including passcode hashes, inside the database only.

If v3 cannot pass by 09:00 ET, restore the native v2 backup via the Restore button on its row, then Netlify → Deploys → known-good deploy `6af2a56caed93547f338e85e` → Publish deploy. A database restore is destructive and needs Neven's confirmation at action time; do not perform it casually or after student writing begins. Prefer preserving the exact migration snapshot if anything changed since 00:07. Until verified, do not claim a rollback has been performed.

## Decisions

- Blank cards are unnamed until written. Their incoming path stores the card's name.
- Existing written v2 slots transfer to the written card's author during migration; unwritten slots retain their original dealer. Thus delete/replay keeps ownership coherent.
- Deletion also checks the blank-card cap because it reopens one blank card. Discard a blank first if already at eight.
- Legacy stress content is kept, with all 40 legacy doors converted to wormhole paths. Layout excludes wormhole paths from its tree.
- No image-description option yet; §15.7 is optional and follows all required acceptance checks.
- Real physical phone performance/pinch remains a manual check; emulated 360px is not represented as physical hardware evidence.

## Verification

Pending: disposable Postgres concurrency, ownership, migration and stress geometry; sandbox UI, incoming colours/arrows, Players panel and two-browser updates; no-ring Map; retained media; no QA writing in mdst1050.
