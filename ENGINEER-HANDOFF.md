# Current focus

- **17.A+B and 17.C sound are live.** A+B runtime `f2e317e` / PR #7 at 10:01 ET; sound runtime `bd1cf1e` / PR #8 at 10:24 ET. Six of the original eight production publications used. Latest Designer notice permits three remaining; the plan uses one for C2 video and one for D. Final by 11:45 ET, none after noon.
- **Sound ships.** Live MP3 and M4A upload and playback passed in Chrome and native Safari before 11:30. Commit/reload retains both. WAV and 3 MB audio return the exact refusal. Transaction tests verify another player's state, hidden masking, byte-Range 206/416/HEAD and concurrent upload quota. Second-player visual reader check is still being completed; no claim of actual VoiceOver speech or physical-phone testing.
- **C2 deployed** at `07f2312` / PR #9, 10:41 ET, publication 7. Five-second 1280×720 H.264 MP4 upload/play passed in Chrome and native Safari; Safari also uploaded and committed video + independent MP3. MOV and 6 MB UI refusals pass. A Chrome muted-property issue was found and is corrected in the D source bundle, pending final browser recheck. Video remains gated until that recheck and Commit/reload/second-player visual checks finish.
- **Next actor: Engineer** for D wires/Refresh scan + the explicit muted-property fix, then final media and stress checks. D source geometry checks pass. Architect can review A+B+C in Sandbox. The local preview server cannot bind under this computer’s permissions; full builds/transactions run in disposable GitHub CI before deployment.
- A+B browser checks pass: wording/order, green one-card Commit, no stage-three outgoing controls, live Choices, new/returning refusals and normalization, keyboard Enter/assertive error regions, Show passcode, signed identity, Add Scenario and remembered Players collapse. Safari recovers the saved open session.
- Decisions: player/scenario Name remains; card fields use Choice/Narrative Fragment. Stage-three incoming Change remains. Cards lists committed cards with an unfinished-session Resume banner. Media uses the same site-wide `jootsy-images` Blobs store and registered SQL upload ledger; limits are decimal MB. New migrations only. F11/F12 remain after class. No blocking Designer decision.

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

## v4.1 C2 video handoff (release verification in progress)

- Runtime `07f2312` / PR #9, 10:41 ET. Migration `20261110154500_card_video` applied. Source expansion #36 and disposable transaction checks #44 passed. Evidence: docs/verification/v41-safari-media.png.
- Ready: Add video, content-inspected MP4 up to 4 MB, exact MOV/size refusal, nullable `video_url` through plays/edit/state/hidden masks, SQL image-or-video constraint, shared 60-upload quota and byte-Range serving. Safari five-second playback/loop and video+sound Commit passed; Chrome playback passed.
- Follow-up included with D: set both the muted HTML attribute and live muted property (Chrome requires the latter). The 11:30 gate remains open until final recheck. No autoplay is requested anywhere.
- Next actor: Engineer finalizes D, repeats media checks and updates this report. Architect reviews the released behavior. Designer: no blocking decision.
