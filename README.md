Current release: spec v4.1 §17 A–D including C2 video, runtime `1509e36` (PR #10), published Nov 10 at 10:53 ET. Sound and video shipped. Start with [ENGINEER-HANDOFF.md](ENGINEER-HANDOFF.md) for the final checks and next actor. Architect owns the authoritative [spec](https://github.com/NevenLochhead-bit/jootsy/blob/architect/docs/JOOTSY_TUESDAY_SPEC.md) and [notes](https://github.com/NevenLochhead-bit/jootsy/blob/architect/ARCHITECT-NOTES.md) on branch `architect`.

# Jootsy!

Collaborative branching-narrative card game for MDST 1050.

- Class: https://jootsy.netlify.app/mdst1050
- Demo and testing: https://jootsy.netlify.app/sandbox
- The stress world is an unlinked fixture for engineering checks.

Players choose their own name and passcode. Returning players use the same pair. Neven is the reserved instructor identity; its passcode is supplied privately through the Netlify environment, never this repository.

## Stack and development

Vanilla JavaScript, Canvas with d3-hierarchy, modern Netlify Functions, transactional Netlify Postgres, and Netlify Blobs for images, sound and video. No game state lives in browser storage; device tokens, unread markers and unsent writing drafts do.

Use Node 22.12 or newer. Run `npm install`, `npm run check`, `npm run build`, then `netlify dev` against a local database. Committed migrations are under `netlify/database/migrations`; apply local migrations with `netlify database migrations apply`. Production migrations are applied by Netlify during deployment. Do not apply schema changes directly to the hosted database.

Configure `INSTRUCTOR_PASSCODE` and `TOKEN_SECRET` in Netlify environment variables scoped to functions. Database and Blob credentials are supplied by Netlify. The database is persistent and images are in the site-wide `jootsy-images` store under world-scoped random keys.

## Checks and handoffs

GitHub Actions runs syntax, build, transaction, ownership and stress-layout checks against a disposable PostgreSQL service. `/checks.html` runs API acceptance checks only in `sandbox`, never in the class world. Instructor and hidden-name checks also run in disposable Postgres and the live sandbox walkthrough.

See `ENGINEER-REPORT.md`, `SLICE-B-REPORT.md` and the Current focus block in `ARCHITECT-NOTES.md`. Architect notes live on branch `architect`; production deploys follow `main`. No passcodes, tokens or connection strings belong in these files.

Terminal network access was restricted during the build. The temporary source-bundle workflow expands `source.tar.gz` into ordinary source files in this repository, then the regular Netlify Git build runs. If producing another bundle, exclude `.git`, `.github`, `.netlify`, `node_modules`, `.env*` and the archive itself. The workflow files are maintained separately through GitHub.

## Tuesday boundaries

Core v4 uses private three-stage sessions, autosave, Change/Undo and atomic Commit. Only committed cards appear on the Board. Fork, Destiny and Dream create draft cells; Wormhole links your own committed cards; Jootsy links into another player’s committed, visible timeline after five committed cards (instructor exempt). Dead End and public blank cards are retired. Cards shows your threads and an unfinished-session Resume banner. No ring rule stops play.

Additive migrations retain existing cards and v3 rollback compatibility; see V4-REPORT.md for fallback cleanup. Images are downscaled to 1600 pixels and JPEG (1.5 MB cap). MP3/M4A sound is capped at 2 MB and MP4 video at 4 MB, checked by content. Each card has an image or a video, plus an optional sound. All media share 60 uploads per player/world. Media starts on click; video is muted and loops. Wire lights use cached geometry and a 30 fps ceiling, with viewport culling, hidden-page pause and static reduced motion. Refresh scans for 750 ms after sync.
