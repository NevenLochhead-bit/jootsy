# Current focus

- A + B + C are deployed at https://jootsy.netlify.app/mdst1050 ; Architect should test https://jootsy.netlify.app/sandbox . Engineer is doing the final smoke check and report commit. See `FINAL-REPORT.md` for all checklist results.
- Checklist 1–16 have passing browser/API evidence. Item 17 is partial: stress load/draw about 1.3 seconds on this computer, 360 px Fit and desktop drag/zoom verified; real mid-range-phone speed and touch pinch remain untested.
- Next actor: Architect, for the class walkthrough and a real phone check. Designer: none. Engineer will fix any concrete review findings.
- No further account, database or storage retention action is required. Passcode remains private in the engineer chat. Classroom content has not been populated with QA writing.

## Earlier slice handoff record

- Slice A is deployed at https://jootsy.netlify.app/mdst1050 ; test in https://jootsy.netlify.app/sandbox . All deployed API acceptance checks passed, including concurrent plays, claims, ownership, wormholes, delete/replay, identity and scenario administration.
- Slice B source passed A regressions, build and stress/map checks on remote engineer-b at 0d6c1ca. The fixture has 33 synthetic players, 300 cards, 150 face-down paths, 40 wormholes and depth 12. Layout is deterministic, matches depth and has no world-space node overlap.
- Architect handoffs reviewed: `4edbbfc`, `a7665cf`, `a15f81b`. Thresholds are 7 / 7 / 11; play continues beyond ring 11. No specification change.
- Next actor: Architect can test A in the sandbox now. Engineer is deploying and verifying B, then continuing C after A + B are hardened.
- Designer: none. GitHub access and browser connection are working.
- Browser checks so far: first Fork played from a fresh identity at 360 px in about 25 seconds; other-author play, live claim display/disable, release on cancel, literal script rendering, and Dead End return work across Chrome and the in-app browser. Precise cross-browser polling latency is not yet verified.
- Phone testing caught Play covered by the hand in shorter composers. The action is now placed above the hand, and navigation scrolls the new card to the top; these fixes are in the pending B release.
- Database is provisioned and ready. Images use Netlify Blobs; image storage remains unexercised. C is deferred until A + B deployment and browser verification are complete.

## Decisions

- Vanilla JavaScript SPA with Netlify Functions, transactional Netlify Postgres, Netlify Blobs.
- Every world mutation locks the world row. This serializes short writes, ensures stable revision order and safely handles simultaneous plays and scenario additions for 33 students.
- Tokens are HMAC signed with a server-only environment secret, versioned per player so a reset revokes previous tokens.
- Claims are advisory only after their ten-minute expiry; expiry is computed from the timestamp in the UI and server.
- Instructor identity is reserved as Neven and seeded on first join from INSTRUCTOR_PASSCODE; the passcode is never committed.
- The unique constraint applies to live cards only, so tombstones retain their historical parent path while deletion genuinely allows a new play on that path.
- Publishing uses `main`. The source archive and expansion workflow are a transport fallback for blocked terminal network access; the expanded source files are what Netlify builds.
- GitHub re-authentication is currently needed to add only this new repo to the existing Netlify app installation. The Netlify project and environment passcode already exist. No credentials are in this repo.
