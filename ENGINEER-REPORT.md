# Slice A — deployed, API checks pass; Slice B releasing

- Live class URL: https://jootsy.netlify.app/mdst1050 . Demo/testing URL: https://jootsy.netlify.app/sandbox .
- Published A at main `6d551e7`; all deployed sandbox API checks passed, including instructor scenario creation/edit and student delta visibility.
- Instructor login and passcode were delivered privately in chat. Persistent Netlify Postgres is ready; Netlify Blobs is configured and awaiting image UI verification in C. No trial retention click was shown.
- Browser evidence: fresh identity → scenario → Fork → landing in about 25 seconds at 360 px, two offered paths, second author play, claim visibility/disable and cancellation release across Chrome and IAB, literal script text with zero script nodes, and Dead End return.
- Remaining: exact polling timing; Map previews/navigation, stress load and pan/zoom; C UI. No real mid-range phone hardware is available, so that performance check cannot be claimed.
- Fixed during verification: mobile hand could overlap Play in a short composer; Play now sits above the hand. New card navigation resets scroll. Dependencies pinned after Netlify could not resolve the latest Blobs transitive OTel release.
- Next: Architect tests the live sandbox. Engineer releases and verifies B, then C.

## Earlier source validation record

- Source reviewed by the passing Transaction checks run: `main` at `7072ccb`.
- Deployed URL: none verified yet. Reserved address: https://jootsy.netlify.app.
- Instructor: Neven. Passcode is set in the Netlify environment and delivered privately to Neven in the engineer chat; no passcodes are committed.
- Database: persistent Netlify managed Postgres, provisioned on the new `jootsy` project. Dashboard confirms ready, production branch, daily backups. No trial-claim step was shown.
- Storage: Netlify Blobs `jootsy-images`, configured in the API. Image upload UI belongs to Slice C and storage has not yet been exercised.
- External blocker: GitHub requires Neven to re-authenticate before adding only `jootsy` to the existing Netlify app's selected repositories. Existing selections must remain selected. This was requested once in chat.
- Next actor: Engineer connects `main`, deploys A, runs deployed sandbox and mobile checks, then gives the live URL to Architect. Architect may review A's source now.

## Evidence

The Transaction checks workflow passed against an isolated PostgreSQL 17 service, including the production build. Checks cover seed worlds; returning identity and wrong passcodes; authoritative author and depth; card arity; claim/release; simultaneous plays returning one success and one 409; ten concurrent scenario additions; all five ownership denials; own-author wormholes; delete/replay; incremental state; SQL path/card symmetry and depth invariants.

Checklist 1–3, 5–11, 15 and 16 have API or source evidence but still need their visual/deployed portions checked. None is claimed as a full end-to-end acceptance pass yet. Items 4, 12–14 and 17 await C or B and deployed verification. Card editing and deletion are implemented in the API; their UI is deferred to C.

## Decisions

- Plain JavaScript client, modern Netlify Functions, Postgres transactions and Netlify Blobs.
- A world-row lock serializes short mutations so revisions commit in order and races are resolved transactionally.
- Unique live card per path: tombstones retain their historical parent while an erased leaf's path can be played again.
- Neven is reserved and created from the environment passcode on the world's first join.
- Signed device tokens last 90 days; an instructor reset revokes the affected player's old tokens.
- No hard stop at ring 11, confirmed in architect `a15f81b`.
- Blocked terminal networking required a source bundle expanded by a narrowly scoped GitHub workflow. The expanded files are the build source. No access to any other repository was changed.
