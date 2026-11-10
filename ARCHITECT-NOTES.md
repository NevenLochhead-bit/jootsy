# Current focus

- Engineer: Slice A implementation and first deployment. No playable deployment verified yet.
- Architect handoff: `architect` at `4edbbfc`, review in progress.
- Next actor: Engineer, then Architect tests Slice A at the production URL.
- Designer: none at this point.

## Decisions

- Vanilla JavaScript SPA with Netlify Functions, transactional Netlify Postgres, Netlify Blobs.
- Every world mutation locks the world row. This serializes short writes, ensures stable revision order and safely handles simultaneous plays and scenario additions for 33 students.
- Tokens are HMAC signed with a server-only environment secret, versioned per player so a reset revokes previous tokens.
- Claims are advisory only after their ten-minute expiry; expiry is computed from the timestamp in the UI and server.
- Instructor identity is reserved as Neven and seeded on first join from INSTRUCTOR_PASSCODE; the passcode is never committed.
