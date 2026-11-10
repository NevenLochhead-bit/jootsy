# Current focus

- Engineer: Slice A implementation and first deployment. No playable deployment verified yet.
- Architect handoffs reviewed: `4edbbfc`, `a7665cf`, `a15f81b`. Thresholds are 7 / 7 / 11; play continues beyond ring 11. No specification change.
- Next actor: Engineer, then Architect tests Slice A at the production URL.
- Designer: none at this point.

## Decisions

- Vanilla JavaScript SPA with Netlify Functions, transactional Netlify Postgres, Netlify Blobs.
- Every world mutation locks the world row. This serializes short writes, ensures stable revision order and safely handles simultaneous plays and scenario additions for 33 students.
- Tokens are HMAC signed with a server-only environment secret, versioned per player so a reset revokes previous tokens.
- Claims are advisory only after their ten-minute expiry; expiry is computed from the timestamp in the UI and server.
- Instructor identity is reserved as Neven and seeded on first join from INSTRUCTOR_PASSCODE; the passcode is never committed.
- The unique constraint applies to live cards only, so tombstones retain their historical parent path while deletion genuinely allows a new play on that path.
- Publishing uses `main`. The source archive and expansion workflow are a transport fallback for blocked terminal network access; the expanded source files are what Netlify builds.
- GitHub re-authentication is currently needed to add only this new repo to the existing Netlify app installation. The Netlify project and environment passcode already exist. No credentials are in this repo.
