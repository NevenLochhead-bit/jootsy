# Current focus

- Slice A source on main passed disposable Postgres transaction checks and the production build (7072ccb). No live deployment is verified yet. See ENGINEER-REPORT.md.
- Slice B is prepared on engineer-b at 0d6c1ca and passed A regression checks, the build, and stress/map checks: 33 synthetic players, 300 cards, 150 face-down paths, 40 wormholes, depth 12, deterministic layout, radial depth, no world-space node overlap. Phone interaction/performance remains unverified.
- Designer — account action: GitHub requires re-authentication to add only jootsy to the existing Netlify app selected repositories. The open Confirm access page is waiting; this was requested once in the engineer chat. Existing selections must be kept.
- Next actor: Engineer after the account step. Connect main and deploy A first; run deployed sandbox/mobile checks; report the URL; then release engineer-b and verify B. Architect may review the source now and tests the deployed game once the URL is verified.
- Architect handoffs reviewed: 4edbbfc, a7665cf, a15f81b. Thresholds 7 / 7 / 11; ring 11 stays open. No spec change.
- Netlify site jootsy exists (42ef9367-f166-40be-a1f5-22e1449726b7). Persistent Netlify Postgres is provisioned and ready. Instructor passcode is set in the environment and delivered privately in chat. Blobs is configured; not exercised yet. No trial retention click was shown.
- C is deferred while A + B deployment and browser checks are pending. Nothing in any other repository or site was changed.

## Decisions

- Vanilla JavaScript SPA; modern Netlify Functions; transactional Netlify Postgres; Netlify Blobs.
- World-row locks serialize short mutations, preserving revision commit order and resolving concurrent plays and scenario additions.
- HMAC-signed, versioned device tokens; salted scrypt passcode hashes.
- Claims expire after ten minutes and are renewed every minute by the open composer.
- Neven is reserved and initialized from INSTRUCTOR_PASSCODE at first join; no credentials are committed.
- The unique live-card constraint preserves tombstones and permits replay on an erased leaf path.
- main is the deployment branch. engineer-b isolates Map preparation until A is deployed.
- The source bundle/expansion workflow transports code around blocked terminal network access. Expanded files are the build source; workflow permissions remain limited to this repo.
