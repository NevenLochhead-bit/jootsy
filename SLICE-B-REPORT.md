# Slice B — source validated, deployment pending

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
