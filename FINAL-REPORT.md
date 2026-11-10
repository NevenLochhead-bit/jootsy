# Jootsy! — Tuesday release report

Class URL: https://jootsy.netlify.app/mdst1050  
Demo/test URL: https://jootsy.netlify.app/sandbox  
Repository: https://github.com/NevenLochhead-bit/jootsy

Instructor login: **Neven**. The passcode is set in `INSTRUCTOR_PASSCODE` and delivered privately in the engineer chat. Credentials are never stored in this public report. Use the gear button for instructor tools.

All three slices have been deployed. The current release is undergoing its final smoke check; the deploy's exact commit and next actor are recorded in `ARCHITECT-NOTES.md`.

## Storage and scope

Persistent Netlify managed Postgres holds all game state. Each mutation uses a real transaction and a world-row lock. Netlify Blobs, store `jootsy-images`, holds world-scoped, randomly keyed JPEGs. Image upload/read was exercised across two independent browsers: a 2048 × 1024 PNG became a 1600 × 800 JPEG. No trial claim or additional retention click was shown. Netlify provisions daily database backups.

Only the new `jootsy` repository, site and database were changed. Testing writes are in `sandbox`; `stress` contains the synthetic fixture and is not linked from the student UI. The class world retains its starting scenarios for Neven to revise.

## Acceptance checklist

| Item | Result | Evidence |
|---|---|---|
| 1. Join, scenario path, Fork, landing | Pass | Engineer-run flow at an actual 360 px viewport completed in about 25 seconds. This is not a novice-user study. |
| 2. Two face-down paths; sibling retained | Pass | Browser flow and deployed API checks. |
| 3. Other browser updates within 5 seconds | Pass | Chrome → independent IAB update measured at 1.7 seconds. |
| 4. Other author's play appears in news | Pass | New news and unread badge in 3.3 seconds; link opens the played card. |
| 5. Claim display, exclusion, cancellation | Pass | Other browser showed the writer and a disabled path; cancellation released it. |
| 6. Two simultaneous plays | Pass | Deployed concurrent API requests: exactly one card; other request gets 409 and winner ID. |
| 7. Ten concurrent scenario additions | Pass | Ten paths and ten cards; no errors. |
| 8. Ownership | Pass | Five unauthorized mutations return 403; another author's UI offers no Edit/Delete/path controls. |
| 9. Wormhole | Pass | Picker showed only own cards; foreign target rejected; landing and door navigation verified. |
| 10. Dead End | Pass | No paths and return to an ancestor with an unwritten path verified. |
| 11. Delete/reopen; protect written parents | Pass | UI leaf deletion reopens the path; replay succeeds; written-parent delete returns 409. Incoming Wormhole deletion tested in isolated Postgres. |
| 12. New instructor scenario on student Map | Pass | Instructor UI create → student card/Map in 3.1 seconds; student played on it. Scenario edits also passed deployed API checks. |
| 13. Map depth, overlap and rings | Pass | Stress layout assertions: depth-derived radii and no overlapping world-coordinate card rectangles; both labelled perimeters inspected. |
| 14. Map/Card/Map return | Pass | Same card URL and centred selection verified. Face-down preview → Play here also verified. |
| 15. Persistence and wrong passcode | Pass | Device reload retains identity/cards; returning name/passcode and wrong-passcode rejection tested. Logout/login flow exercised. |
| 16. Script-like fragment is text | Pass | Literal script text rendered; zero script elements in the card. |
| 17. Stress load and smooth mid-range-phone pan | Partial | About 1.3 seconds to load/draw on this computer; Fit at 360 px, zoom, drag, filters and toggles verified. Real mid-range phone performance and touch pinch are not hardware-tested. |

No failing acceptance check was observed. Item 17 retains the stated hardware limitation.

## Additional C checks

- Author body edit, path rename, deal and removal; the Fork minimum remains two.
- Leaf deletion reopens its path and keeps existing media on unrelated cards.
- Per-player backs are deterministic and differ by author.
- Uploaded image persisted and appeared in the other browser. YouTube embed construction was checked in the browser; Vimeo/SoundCloud routes have client checks. Native audio and video loaded metadata and persisted as native controls.
- Hidden content and media disappear for a student while paths/descendants stay reachable. Unhide restores visibility.
- Instructor settings propagate to the student view. The sandbox ring threshold was restored to seven. Player-table selection opens a filtered Map.
- Passcode reset, authorization and token revocation were exercised against disposable Postgres; no actual student's passcode was reset.

## Decisions where the spec needed interpretation

- Plain JavaScript SPA and Canvas, with d3-hierarchy for deterministic tree geometry.
- Short writes serialize per world, preserving both transaction safety and revision commit order.
- Uniqueness is enforced for live cards; deleted tombstones retain their historical parent path and do not prevent replay.
- Neven is reserved and initialized from the environment on the world's first join. Device tokens are signed and last 90 days.
- Last active means last login or mutation; read-only polling does not write presence records.
- Media type is inferred from the URL path extension for native images/audio/video; known provider hosts get embeds; other links remain links.
- Stress fixture identities cannot log in. There are 33 synthetic players, plus any real instructor/tester who joins that world.
- Map spacing targets 36 units of arc rather than the minimum 30, keeping its world-coordinate card rectangles clear diagonally. Card rectangles scale with the map; near zoom exposes the mini-card text and previews provide readable fragments.
- Ring 11 remains open. Jootsy! stays face-down and its Thursday behavior is not implemented.
- SDK versions are pinned after Netlify's installer failed to resolve a newer transitive telemetry package. A temporary source bundle workflow was necessary because terminal network access was restricted; the expanded source files are the build source.
