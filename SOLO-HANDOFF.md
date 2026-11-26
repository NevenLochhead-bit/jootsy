# Jootsy Solo

## Current focus

The first implementation is local on `feature/jootsy-solo` in the `Jootsy/jootsy-solo` worktree. It adds a separate `/solo/` page. Production has not been updated from this session. The connected publishing chat acts next after email delivery is configured and browser checks pass.

## Implemented

- Email entry followed by a six-digit code. Codes expire after ten minutes, allow five attempts and can be used once. The returning browser session lasts thirty days. The email address identifies the same account on a new device.
- A private project library with New world, project titles, saved times, optional starter prompts and reopening. Each project has its own board, scenarios, cards, links and unfinished writing session.
- The existing board and three-stage card editor, with autosave of partial drafts, resume, Fork, Destiny, Dream, Change, Undo, Commit and Discard. The Solo editor is a separate module. Jootsy and Wormhole can link to other committed cards in the same personal world, without the multiplayer threshold or another author.
- The existing immersive reader, blurred future cards and spatial transitions. Its sidebar lists the current player's cards. Shared map and reader code use small optional Solo hooks, with their multiplayer defaults preserved.
- Persisted images, external HTTPS media links, MP3/M4A sound, MP4 video and GLB models. Any card type can have a GLB. World settings can apply one model across the project, and each card can inherit it, replace it or opt out. The 3D view uses bundled `@google/model-viewer` 4.4.0 with orbit and zoom controls.
- Private, account-checked file delivery with byte ranges. Files are stored in the separate site-wide Blobs store `jootsy-solo-media`. The new tables all start with `solo_`. No Solo request reads or writes the multiplayer tables or its media store.
- Project revision checks reject stale saves from another window. Text already being edited is kept in the local draft buffer. Recovered local text is presented for review, rather than automatically overwriting the saved project on load.

## Decisions

Solo is a page within the existing Jootsy application, with its own authentication and project records. It reuses the familiar layout. Email ownership is verified with a code. Resend supplies transactional email delivery. Uploaded video remains an image alternative with a separate sound track, and GLB is an additional object. GLB uploads are self-contained glTF 2.0 binaries, capped at 4 MB for this first serverless upload path. Audio keeps the 2 MB cap, video 4 MB, and resized JPEG images 1.5 MB.

## Email setup

The Jootsy Netlify project currently has `INSTRUCTOR_PASSCODE` and `TOKEN_SECRET`, and no transactional email sender. No email credentials or real sign-in codes have been written to the repository.

1. In Resend, open Domains, add a domain or subdomain you own, and complete its displayed DNS verification. Open API Keys and create a sending key for that domain.
2. In Netlify's Jootsy project, open Project configuration, then Environment variables. Add `SOLO_RESEND_API_KEY` as a secret available to Functions. Add `SOLO_EMAIL_FROM` with a sender address on the verified domain, optionally in the form `Jootsy Solo <sender@verified-domain>`.
3. The application reuses the existing server-only `TOKEN_SECRET` for code hashing. A separate secret named `SOLO_AUTH_SECRET` can be configured if the deployment should use a distinct key, but is not required.

The code intentionally reports that email sign-in awaits setup until both sender variables exist. Live delivery has not been tested. Resend's setup documentation is at https://resend.com/docs/dashboard/domains/introduction and https://resend.com/docs/api-reference/emails/send-email .

## Validation

- `npm run check` passes the existing checks, the immersive graph/travel checks, Solo source syntax checks and the GLB content inspection cases.
- The complete API checks pass against disposable PGlite PostgreSQL 17.5 through the local pool adapter. Solo cases exercise verified email, single-use and wrong-code attempt limits, account and project isolation, saved partial drafts, reopening, private media, stale writes, Fork completion, the stage cap, Solo Jootsy/Wormhole links, persisted sound/video/GLB, global models, card overrides, byte ranges and logout.
- The migration and the Solo test workflow leave full snapshots of the existing multiplayer and playtest tables identical. Tests use synthetic accounts and local file storage.
- A DOM simulation passes the UI path through email-code sign-in, the project library, new world, normal session editor, text autosave, GLB upload and preview element, Commit, Cards and project reopen. The existing multiplayer immersive lifecycle simulation also passes after the shared hooks.
- These simulations do not establish browser layout, WebGL rendering, actual email delivery, or Chrome/Safari media behavior. Those checks remain pending.
- The normal static build stops with `ENOENT` at `node_modules/d3-hierarchy/dist/d3-hierarchy.min.js` because this worktree's dependencies are not installed. The connected publisher must install the declared packages, including model-viewer, before the full build can be verified.

## Publishing

The source base is the saved local immersive branch at `dee241c`. Remote `main` could not be fetched because this session cannot resolve GitHub. Use only this Solo feature commit as a delta on a freshly fetched production checkout, resolving the small shared-map/reader hooks against the live files. Preserve the deployed source archive retirement and the publishing chat's other changes.

Install the declared dependencies and run `npm run check`, `npm run build` and the disposable Postgres integration suite. The build copies the model-viewer bundle to `dist/vendor/model-viewer.min.js`. Take the production database snapshot required by the existing engineering handoff before applying the additive Solo migration through the normal Netlify deployment. Deploy previews may contain production data and use a site-wide storage service, so use disposable local fixtures for automated writes.

Verify `/solo/` in Chrome and Safari, including one real email delivery, a sign-in on another browser, project reopen, unfinished-session resume, card-level and project-wide GLB orbit/zoom, saved image/sound/video playback, and the multiplayer board. The intended URL after publication is https://jootsy.netlify.app/solo/ .

The existing class and demo boards were not changed by this work. No production migration, media upload, email send or deployment was performed.
