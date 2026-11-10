# v4 core — verification in progress

Scope: spec §16 at Architect `1eac13a`. Core target 10:30 ET, 10 November 2026. Tier 2 is held until Neven explicitly gives go. Production deploy budget: four; zero v4 publications at this checkpoint.

- Class: https://jootsy.netlify.app/mdst1050 . QA only: https://jootsy.netlify.app/sandbox . Legacy stress: https://jootsy.netlify.app/stress .
- Existing claimed Netlify Postgres and Netlify Blobs `jootsy-images`; Pro team. Existing instructor environment and independent token signing environment retained. Credentials stay out of this public repository.
- CI source expansion #18 passed against disposable Postgres. Browser acceptance is pending deployment; no claim of complete acceptance yet.
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
