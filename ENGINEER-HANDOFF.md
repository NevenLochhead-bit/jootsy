# Current focus

- **v4.1 A+B+C+C2+D are live. Sound SHIPPED; video SHIPPED.** Final runtime [`1509e36`](https://github.com/NevenLochhead-bit/jootsy/commit/1509e36f4dbaefd83d7d534cc047c5d67666fccf), PR #10, published **10:53:34 ET, Nov 10**. Netlify deploy `6af33dea6e72d49d6ced963b`. **8 of 8 production publications used.** The 11:30 media gate and 11:45 last-publication deadline were met.
- **Architect freeze acknowledged:** [`976de61`](https://github.com/NevenLochhead-bit/jootsy/commit/976de61a7db0ef17bd318cc775d7a0df211fbc97), 11:02 ET. Its requested final rechecks have passed and are recorded here. Architect accepts C/C2/D on this engineering evidence; he has not independently reviewed their code.
- **Next actor: Designer (Neven)**, reload https://jootsy.netlify.app/sandbox and play the full loop with sound and video, then confirm the scenarios in the class world. Architect reads this final evidence and records acknowledgement. No further runtime change is queued. Relevant files: public/extras.js, public/editor.js, public/map.js, public/wires.js, netlify/functions/lib/media.mjs, the two additive media migrations, and the final verification section below. Class: https://jootsy.netlify.app/mdst1050 .
- **Designer (Neven):** physical-phone touch/pinch/performance check remains on his hardware. No blocking design decision. Instructor identity/passcode and environment are unchanged; the value is supplied privately in chat, never this public repo. Student-manual sound instructions can stay.
- **Passing evidence:** MP3, M4A and five-second 720p H.264 MP4 upload/play in Chrome and native Safari; Commit/reload; a separate player opens and plays both media on the committed card. WAV, 3 MB audio, MOV and 6 MB video produce exact refusals. Chrome video is explicitly muted, looping and initially paused. D removes arrowheads, animates the cut-colour lights including dotted links and scans after Refresh. The live 300-card / 340-wire stress board pans/zooms, uses all 340 lights at Fit with ~2–3 ms paint cost, and culls to 233 lights in the checked zoomed viewport. No halving was needed (stride 1).
- **Pending manual verification:** actual screen-reader speech, physical-phone operation, and live OS reduced-motion/hidden-tab pause. The latter two behaviors are implemented and reviewed in code, but the agent's Chrome test surfaces stay visible; the user's active course browser was left alone. Do not label these manual checks passed. F11/F12 remain after-class issues as directed by Architect.
- **Engineering decisions:** decimal MB; image upload replaces a video and vice versa, while sound stays independent; no video duration cap beyond 4 MB (the spec's five seconds is export guidance). New media columns/migrations preserve existing cards. Registered media objects share the site-wide Blobs store and one transaction-reserved 60-upload allowance per player/world. Geometry is cached between graph changes; 30 fps is a ceiling and reduced motion draws static lights.

Authoritative Architect notes and the Current focus for the project are on branch `architect`: [ARCHITECT-NOTES.md](https://github.com/NevenLochhead-bit/jootsy/blob/architect/ARCHITECT-NOTES.md). This file records engineering handoffs only.

## Handoff log

- Engineer: `main` code `ee9b428` / PR #1; source-expansion runs 11–13 passed off main, live sandbox API suite passed, cross-browser student and instructor flows passed. Final correction changes only the selected-state ARIA attribute from a presence flag to the required true/false string. Deployed browser verification returned false → true → false with no in-app browser console errors. Next: Architect. Detailed evidence and decisions: V3-REPORT.md.

- Final Engineer handoff: code `cd96e44`; detailed acceptance evidence in [V3-REPORT.md](V3-REPORT.md), screenshot in [docs/verification/v3-map.jpg](docs/verification/v3-map.jpg). Ready for Architect’s §15.9 walkthrough at https://jootsy.netlify.app/sandbox . Next actor: Architect. Designer: no blocking decision. Real-phone speed/pinch remains the hardware check.
- Notice for Bolus to relay verbatim: **Engineer pushed: v3 is deployed at cd96e44; V3-REPORT.md and ENGINEER-HANDOFF.md are ready; Architect reviews the sandbox next.** No passcode or private billing detail belongs in that notice.

## v4 core handoff

- Relevant runtime commit: `19fdf3b`, PR #6. Review files: V4-REPORT.md, public/editor.js, netlify/functions/api.mjs, netlify/database/migrations/20261110133000_sessions_v4.sql; screenshots under docs/verification/v4-*.jpg.
- Ready: private three-stage sessions, autosave/recovery, Change/Undo including removed subtrees, atomic Commit, committed Board, Cards threads, Wormhole, Jootsy and instructor hiding.
- Architect acts next on the sandbox review. Designer items for Neven: listen to Commit, try a real phone, then give go/no-go at 11:00 ET. No one should infer go from silence.
- Notice for Bolus: **Engineer pushed: v4 core is live at 19fdf3b; V4-REPORT.md and ENGINEER-HANDOFF.md are ready; Architect reviews the sandbox, and Neven gives the 11:00 go/no-go.**

## v4.1 A+B handoff

- Runtime `f2e317e` / PR #7; source-expansion #30 and transaction checks #36 passed. Evidence: docs/verification/v41-ab.jpg (saved locally, included in the next source bundle).
- Ready for Architect review in https://jootsy.netlify.app/sandbox . Class URL remains https://jootsy.netlify.app/mdst1050 . Reload before testing.
- Next: Engineer builds C then D without waiting. No Designer decision is blocking.
- Notice: **Engineer pushed: v4.1 A+B are live at f2e317e; ENGINEER-HANDOFF.md is ready; Architect can review while Engineer builds C.**

## v4.1 C sound handoff

- Runtime `bd1cf1e` / PR #8; published 10:24 ET. Migration `20261110151000_card_audio` applied. Postgres transactions plus Netlify Blobs; Pro team. Class https://jootsy.netlify.app/mdst1050 ; review https://jootsy.netlify.app/sandbox . Instructor environment/passcode remains unchanged (private chat only).
- Ready for Architect: Add image + Add sound, 1600 px JPEG preparation/1.5 MB cap, actual-content MP3/M4A validation/2 MB cap, 60 uploads per player/world reserved atomically, correct MIME/immutable caching/Range, independent sound and image, native click-to-play with no autoplay, card edit/Commit/reload persistence.
- Next actor: Engineer for C2 then D; Architect reviews C in parallel. No Designer item blocking.
- Notice for Bolus: **Engineer pushed: sound is live at bd1cf1e and plays in Chrome and Safari; ENGINEER-HANDOFF.md is ready; Architect reviews sound while Engineer builds C2 video, then D.**

## v4.1 C2 video handoff (final verification passed)

- Runtime `07f2312` / PR #9, 10:41 ET. Migration `20261110154500_card_video` applied. Source expansion #36 and disposable transaction checks #44 passed. Evidence: docs/verification/v41-safari-media.png.
- Ready: Add video, content-inspected MP4 up to 4 MB, exact MOV/size refusal, nullable `video_url` through plays/edit/state/hidden masks, SQL image-or-video constraint, shared 60-upload quota and byte-Range serving. Safari five-second playback/loop and video+sound Commit passed; Chrome playback passed.
- Follow-up completed in D: both the muted HTML attribute and live muted property are set. Final Chrome readback was muted=true, loop=true, autoplay=false, paused=true before clicking Play, then paused=false with advancing playback and duration 5 seconds. Final Safari playback after reload showed Pause, Unmute and a five-second timeline. The media gate passed before 11:30.
- Next actor: Engineer finalizes D, repeats media checks and updates this report. Architect reviews the released behavior. Designer: no blocking decision.

## Final v4.1 verification and handoff

| Area | Result | Evidence / limits |
|---|---|---|
| 17.A wording, Choices, order, Commit, third stage, removals and controls | PASS | Chrome walkthrough; no third-stage outgoing controls; one-card Commit green; Players collapse persists. |
| 17.B join and recovery | PASS | Taken name / unknown returning name / wrong passcode refusals; normalization; returning second device recovers draft text; keyboard Enter and assertive error regions. Actual screen-reader speech pending. |
| 17.C sound + image | SHIPPED / PASS | MP3 and M4A upload/play in both browsers; image+sound coexist; Commit/reload and second-player playback; exact WAV / 3 MB refusal. Server content/Range/quota tests pass. |
| 17.C2 video | SHIPPED / PASS | Five-second 1280×720 H.264 MP4 uploaded in each browser and played in each; Safari Commit and browser reload retained video+MP3; V41 Listener opens V41 Rae's card and plays both. MOV / 6 MB refusals pass. Muted, looping, click-to-play; no Board autoplay. |
| Media authorization, hidden masks, image-or-video, upload races | PASS | Disposable Postgres integration checks cover ready-object registration, private sessions, hidden media removal, visual exclusivity and two simultaneous uploads at the last quota slot (201/429, exactly 60 reservations). |
| Range delivery | PASS | Correct MP3/M4A/MP4 MIME, 206 byte ranges, suffix/open ranges, 416 invalid ranges and HEAD. Real Safari playback works on this path. |
| 17.D wires, no arrowheads, Refresh | PASS | Native Safari screenshot shows scan and cut-colour swells; Chrome Refresh confirms “Board is synced!”. Cached geometry; 3.3–4 s stagger; 750 ms scan. |
| Stress pan/zoom and culling | PASS desktop | 33 seeded players, 300 cards, 40 Wormholes, 340 wires. All 340 lights at Fit, stride 1, ~2–3 ms moving-average paint. At the checked zoom/pan, 233 visible lights. Sample 184 paints / 8.14 s (~22.6 fps), below the 30 fps ceiling. No adaptive halving necessary. This is desktop evidence, not a phone claim. |
| Hidden pause / OS reduced motion | IMPLEMENTED; manual check pending | Visibility listener cancels RAF; returning schedules a frame. Reduced motion uses a static phase and suppresses scan/twinkle motion. No per-frame layout. Live settings were not changed on the user's working browser. |
| v4 session/game regressions | PASS | Source expansion #39 and disposable transaction checks #48: privacy/author permissions, stage cap, Change/Undo data, atomic Commit, Wormhole/Jootsy rules, concurrent commits, instructor controls, deterministic stress layout/no overlap. Final main source expansion #40 and transaction checks #49/#50 also passed. |
| Known after-class findings | OPEN by prior instruction | F11: an invisible private draft may block deleting its committed anchor. F12: a hidden/deleted target blocks Commit until Change; more helpful naming deferred. |

Infrastructure: **Netlify team Pro (`nf_team_pro`)**, claimed persistent **Netlify Database / Postgres**, site-wide **Netlify Blobs `jootsy-images`** for image/audio/video. No additional provider setup click is needed for this release. Instructor environment `INSTRUCTOR_PASSCODE` is unchanged; no credentials are committed.

Release trail: A+B `f2e317e` / PR #7 at 10:01 ET (publication 5); C sound `bd1cf1e` / PR #8 at 10:24 (6); C2 `07f2312` / PR #9 at 10:41 (7); D + Chrome muted-property correction `1509e36` / PR #10 at 10:53 (8). Docs-only handoff updates do not publish runtime changes.

Proof: [peer media](docs/verification/v41-peer-media.jpg), [Safari media](docs/verification/v41-safari-media.png), [Safari scan and wire lights](docs/verification/v41-scan.png), [340-wire stress board](docs/verification/v41-wires.jpg), [A+B](docs/verification/v41-ab.jpg).

**Next:** Neven plays the full Sandbox loop with sound/video, confirms the class scenarios, and tries a physical phone. Architect reads this final evidence and records acknowledgement on `architect`. No one answers for the Designer. The release is frozen per `976de61`; no further feature scope is queued before class.

**Notice for Bolus:** Engineer pushed: final rechecks pass at 1509e36; sound and video shipped; ENGINEER-HANDOFF.md acknowledges the freeze and is ready for Architect; Neven tests the full loop, class scenarios and phone next.
