# Slice A — source validated; production deployment pending

- Source validated: main at 7072ccb. Transaction checks passed against disposable PostgreSQL 17, including the production build.
- Deployed URL: none verified. Reserved address: https://jootsy.netlify.app.
- Instructor: Neven; passcode set in the environment and delivered privately to Neven in the engineer chat. No credentials are committed.
- Database: persistent Netlify managed Postgres on the new jootsy project. Dashboard confirms ready, production branch and daily backups. No trial-claim step was shown.
- Storage: Netlify Blobs, jootsy-images. Configured in API; images are C and storage is not yet exercised.
- Blocker: GitHub requires Neven to re-authenticate before adding only jootsy to the existing Netlify app selected repositories, keeping existing selections. Requested once in chat.
- Ready for review: Slice A source and scripts/api-checks.mjs.
- Next actor: Engineer connects main, deploys A and runs deployed sandbox/mobile checks; Architect may review source now and tests the live game when the URL is verified.

## Acceptance evidence

Passing isolated tests: seeds; returning identity and wrong passcodes; authoritative author/depth; card arity; claims and release; simultaneous plays returning one success and one 409; ten simultaneous scenario additions; all five ownership denials; own-author wormhole targets; delete/replay; incremental state; SQL path/card symmetry and depth invariants.

Checklist 1–3, 5–11, 15 and 16 have API or source evidence; visual/deployed portions remain unverified, so no full end-to-end passes are claimed yet. Items 4, 12–14 and 17 await later slices and deployment. Editing/deletion are in the API; their UI is deferred to C.

## Decisions

Plain JS SPA, modern Netlify Functions, Postgres and Blobs. A world-row lock serializes short mutations so revisions commit in order. A unique live-card constraint lets tombstones retain historical parents while permitting replay on a deleted leaf path. Neven is reserved and initialized from the environment on first join. Signed device tokens last 90 days; passcode resets revoke the affected player tokens. Ring 11 remains open, confirmed in architect a15f81b. Terminal networking is blocked, so a source bundle is expanded in GitHub; expanded files are the build source. Map work is being prepared locally while account access is pending; A remains first in the deployment queue.
