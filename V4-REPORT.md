# v4 core — verification in progress

Scope: spec §16 at Architect `1eac13a`. Core target 10:30 ET, 10 November 2026. Tier 2 is held until Neven explicitly gives go. Production deploy budget: four; one v4 publication at this checkpoint.

- Class: https://jootsy.netlify.app/mdst1050 . QA only: https://jootsy.netlify.app/sandbox . Legacy stress: https://jootsy.netlify.app/stress .
- Existing claimed Netlify Postgres and Netlify Blobs `jootsy-images`; Pro team. Existing instructor environment and independent token signing environment retained. Credentials stay out of this public repository.
- First core publication: `12701f253531021b16de747dee957ca70b660c93` / PR #3 / Netlify deploy `6af31ef1800d66c56af5c8de`, 08:41:25 ET. The v4 migration is reported applied. Source expansion #18–21 and Transaction checks #23–24 passed, including the 300-card legacy stress geometry.
- Live sandbox: a new player made Fork + Destiny, wrote three named cards, recovered all three after reload and on the independent in-app browser, changed Fork to Destiny and back via Undo, changed Destiny to Dream and back, expanded a one-card transition to Fork and undid it. Before Commit the independent observer counted zero cards; after Commit it counted all three in **994 ms**, with `commit-flash` applied to the player row. Stage-three controls show the exact required Commit message.
- Browser review found desktop stage clipping and an extra native file input. A core layout/accessibility correction is being prepared; acceptance is still in progress.
- Sessions and draft columns are additive. Migration normalizes dead ends, retires unwritten paths, and enables Jootsy at five committed cards. No scenario or committed fragment is deleted.

## Implementation decisions

- A valid Name + Fragment autosaves after 1.9 seconds or blur; incomplete new cells retain their local buffer. Once saved, empty edits also persist privately and block Commit. Server state is authoritative across devices.
- Change to a link opens its target picker first. Cancel preserves the current transition; selecting a target performs the destructive change. Undo reconstructs removed content using new private row IDs where necessary.
- Cards groups a thread by contiguous authorship, newest thread first; Previous/Next follows that thread’s creation order.
- Tier 1 Refresh performs a plain sync and confirmation toast. No scan animation, curve-end correction, energy animation or colour pass has been started.
- Source transport reuses the existing `engineer-v3` verification branch, with v4 code identified by commit and report. Transport/report commits skip Netlify; only the verified merge publishes.

## No-go rollback (prepared, not executed)

Republish the existing v3 deploy for code commit `cd96e44dc3beb619aaf3d061356d62dacf846151`, then run the following **soft-delete** transaction through the database console. It retires private v4 rows and Jootsy links; committed tree cards and Wormholes survive. The extra v4 columns/table remain. Refresh every classroom browser after rollback.

```sql
BEGIN;
LOCK TABLE worlds, players, cards, paths, events, edit_sessions IN ACCESS EXCLUSIVE MODE;
UPDATE worlds SET rev = rev + 1;
UPDATE paths p SET deleted = true, rev = w.rev
FROM worlds w WHERE p.world_id = w.id AND (p.draft OR p.kind = 'jootsy');
UPDATE cards c SET deleted = true, rev = w.rev, updated_at = now()
FROM worlds w WHERE c.world_id = w.id AND c.draft;
UPDATE edit_sessions s SET status = 'discarded', rev = w.rev, updated_at = now()
FROM worlds w WHERE s.world_id = w.id AND s.status = 'open';
COMMIT;
```

The code rollback plus cleanup is reserved for Neven’s go/no-go decision. No database down migration or snapshot overwrite is needed.
