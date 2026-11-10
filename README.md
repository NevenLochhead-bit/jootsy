Current release: **spec v4 §16 core**, runtime `19fdf3b` (PR #6). Start with [V4-REPORT.md](V4-REPORT.md) and [ENGINEER-HANDOFF.md](ENGINEER-HANDOFF.md). Architect owns the authoritative spec and notes on branch `architect`.

# Jootsy!

Collaborative branching-narrative card game for MDST 1050.

- Class: https://jootsy.netlify.app/mdst1050
- Demo and testing: https://jootsy.netlify.app/sandbox
- The stress world is an unlinked fixture for engineering checks.

Players choose their own name and passcode. Returning players use the same pair. Neven is the reserved instructor identity; its passcode is supplied privately through the Netlify environment, never this repository.

## Stack and development

Vanilla JavaScript, Canvas with d3-hierarchy, modern Netlify Functions, transactional Netlify Postgres, and Netlify Blobs for images. No game state lives in browser storage; device tokens, unread markers and unsent writing drafts do.

Use Node 22.12 or newer. Run `npm install`, `npm run check`, `npm run build`, then `netlify dev` against a local database. Committed migrations are under `netlify/database/migrations`; apply local migrations with `netlify database migrations apply`. Production migrations are applied by Netlify during deployment. Do not apply schema changes directly to the hosted database.

Configure `INSTRUCTOR_PASSCODE` and `TOKEN_SECRET` in Netlify environment variables scoped to functions. Database and Blob credentials are supplied by Netlify. The database is persistent and images are in the site-wide `jootsy-images` store under world-scoped random keys.

## Checks and handoffs

GitHub Actions runs syntax, build, transaction, ownership and stress-layout checks against a disposable PostgreSQL service. `/checks.html` runs API acceptance checks only in `sandbox`, never in the class world. Instructor and hidden-name checks also run in disposable Postgres and the live sandbox walkthrough.

See `ENGINEER-REPORT.md`, `SLICE-B-REPORT.md` and the Current focus block in `ARCHITECT-NOTES.md`. Architect notes live on branch `architect`; production deploys follow `main`. No passcodes, tokens or connection strings belong in these files.

Terminal network access was restricted during the build. The temporary source-bundle workflow expands `source.tar.gz` into ordinary source files in this repository, then the regular Netlify Git build runs. If producing another bundle, exclude `.git`, `.github`, `.netlify`, `node_modules`, `.env*` and the archive itself. The workflow files are maintained separately through GitHub.

## Tuesday boundaries

Core v4 uses private three-stage sessions, autosave, Change/Undo and atomic Commit. Only committed cards appear on the Board. Fork, Destiny and Dream create draft cells; Wormhole links your own committed cards; Jootsy links into another player’s committed, visible timeline after five committed cards (instructor exempt). Dead End and public blank cards are retired. Cards shows your threads or resumes your open session. No ring rule stops play.

The additive migration retains v3 code rollback compatibility. Tier 2 visual polish waits for explicit Neven go; see V4-REPORT.md for exact no-go cleanup SQL. Images remain downscaled to 1600 pixels and JPEG before upload; media links support the existing image/audio/video and provider embeds.
