# Slice B — deployed and browser-checked

- Live: https://jootsy.netlify.app/mdst1050 ; sandbox: https://jootsy.netlify.app/sandbox . The stress world is not linked from the class UI.
- Persistent Postgres and Netlify Blobs; no retention action required. Passcode remains in environment and was delivered privately in chat.
- Deployed API suite passed. Browser checks passed: fresh join and first Fork at 360 px; two face-down paths; claim display/disable and cancellation release across Chrome and IAB; another author playing a path; an update visible in the second browser in 1.7 seconds; Wormhole picker, landing and door; Dead End return; literal script text with no script element; identity persistence across reload.
- Map checks passed: written-card preview/Open, Map/Card/Map returning to the same centred card, face-down preview/Play here reaching the composer, Fit, zoom, drag, player selection and wormhole toggles, both labelled perimeters. Stress fixture constraints and world-space non-overlap passed in CI. The stress world opened and drew in about 1.3 seconds on this computer and Fit was verified at an actual 360 px viewport with no horizontal overflow.
- Limit: no real mid-range phone hardware is available. Pinch is implemented but not exercised through the available automation API. Stress-phone smoothness therefore remains a hardware check.
- Fixed during verification: Play covered by the hand, fixed descendants scrolling with the blurred composer shade, new-card scroll position, instructor header overflow, and minimum zoom preventing Fit on narrow displays.
- Next: Architect can test A + B now. Engineer is implementing and checking C. New-scenario student Map timing and C-only checklist portions remain to be checked with C.

## Earlier preparation record

- Remote source: `engineer-b` at `0d6c1ca`.
- Deployed URL: none verified. `main` still contains Slice A to preserve the requested deployment order.
- Instructor: Neven; environment passcode was delivered privately in the engineer chat. No credential is stored here.
- Database: Netlify managed Postgres, provisioned on the new Jootsy project. The stress fixture is a new committed migration, not yet applied to production.
- Image storage: Netlify Blobs, configured but unexercised; uploads UI is C.
- Passing source checks: A transaction regression suite, production build, exact stress fixture counts, deterministic d3-hierarchy layout, radius derived from depth, and pairwise world-coordinate rectangle non-overlap.
- Not verified: deployed checklist 1–17 end to end; Map previews and return navigation in a real browser; pinch/drag behavior and rendering on a phone; stress load under three seconds on hardware. No class-ready claim.
- Next actor: Engineer after GitHub account access is completed and the Chrome ChatGPT extension is updated. Deploy/verify A and report it first, then release/verify B. Architect can inspect the engineer-b source now.

## Decisions

Canvas rendering with d3-hierarchy tree geometry. Node layout targets 36 units of arc rather than the minimum 30, allowing the 20 by 28 world-unit card rectangles to clear one another at every angle. All radii scale together for crowded rings. Camera and layout coordinates exist only in client memory. The 33 fixture players cannot log in; Neven is initialized normally on first join. Seven scenarios and 300 played cards offer exactly 150 unwritten paths. Ring 11 is labelled but never blocks play. C remains deferred while A + B need deployment and browser checks.
