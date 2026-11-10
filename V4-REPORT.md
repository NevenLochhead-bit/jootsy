# v4 core — deployed for the Designer walkthrough

The v4 core from Architect `1eac13a`, spec §16, is live. Latest runtime: **`6d927bace8eee3f5ab7a57e127d7dbe527932dfc`**, PR #5, Netlify deploy **`6af324baa9466af970bf7294`**, published **09:06:06 ET, 10 November 2026**. Reload any tab that was open on v3 or an earlier v4 release.

- Class: https://jootsy.netlify.app/mdst1050
- Review/QA: https://jootsy.netlify.app/sandbox
- Legacy fixture: https://jootsy.netlify.app/stress
- Infrastructure: existing claimed Netlify Postgres, Netlify Blobs `jootsy-images`, Netlify **Pro** team (`nf_team_pro`, verified through the site API). No database retention/setup click is outstanding.
- Instructor identity is **Neven**. The existing `INSTRUCTOR_PASSCODE` and independent `TOKEN_SECRET` remain Functions-scoped; the passcode is supplied privately in chat, never this public repo.
- **Three of four allowed v4 production publications used.** Transport and documentation commits skip Netlify; branch/preview deploys remain disabled. The runtime ignore rule is a second guard for documentation-only expansion commits.
- **Tier 2 has not started.** Neven tests 10:30–11:00 ET and gives go/no-go at 11:00. Architect reviews the core evidence below. No deployment after noon; any approved final polish deploy must finish by 11:45.

## Verification

No functional failure remains observed. §16.8 checks 2–14 pass using the evidence below. Check 1's complete desktop game loop passes; **sound quality/audibility still needs Neven's listening check**. **Physical-phone touch/pinch and performance remain unverified** (retained §12 item 17); the 360×800 layout was checked in Chrome, which does not constitute a real-phone test.

| §16.8 | Result and evidence |
| --- | --- |
| 1: desktop loop | Flow PASS: double-click scenario → Fork, write both names/fragments, Destiny from one, write stage 3, stage-3 controls disabled with exact message, atomic three-card Commit, Board centered/glowing. The WebAudio chime is implemented under one second, with a persistent mute toggle; human listening remains pending. |
| 2: private/public visibility | PASS: independent Chrome/in-app-browser logins; observer counted zero for the draft author, then all three committed cards in **994 ms**, with `commit-flash` on that player row. Disposable Postgres also verifies drafts are hidden from instructors. |
| 3: live names | PASS: typing Name immediately updates the previous card's option, before autosave. |
| 4: Change/Undo | PASS: Destiny↔Dream, single→Fork, Fork→single, card→link and link→card. Top content survives; removed second card plus its written subtree return on Undo. Card→Wormhole removed two written cells; Undo restored both names and fragments. Link→Dream→Undo restored the same link target. |
| 5: blanks | PASS: disabled Commit with visible reason for blank cells; API rejects blank and cleared drafts. |
| 6: recovery/session guard | PASS: all three saved drafts returned after reload and independent-browser login as the same player. Second-session API returns 409 and anchor; UI shows Resume/Discard, Resume returns the session, and Discard confirms. Keep writing preserves it. |
| 7: peer anchor | PASS: Orin committed a Dream from Mira's card; Mira received the continuation News entry only after Commit. Link buttons were dimmed on the peer anchor. |
| 8: Jootsy | PASS: below-five explanation, unlocked at six committed cards, searchable other-author committed targets, pink dotted reader/Board connection and a few continuously twinkling source points. The global toast reached Orin in **2.629 seconds** and the target author's News linked to the card. API tests cover hidden/own/draft target rejection and instructor exemption. |
| 9: Wormhole | PASS: own committed targets only, link-only private session, Commit, white dotted Board link and dotted reader option. |
| 10: reading | PASS: Wormhole → normal child → Back → Back, plus Jootsy navigation, in the same enlarged Board reader. Back and Close remain available. |
| 11: removals/Board | PASS: only Board/Cards navigation, committed-only map, no public blanks, no Dead End or ring rule in the player flow, My Cards filtering, scenario circles and left Players counts. |
| 12: hidden names | PASS: instructor Hide changed the student's open reader to “Hidden” / “Hidden by the instructor”; Unhide restored it through polling. SQL/API regression verifies all incoming labels are masked and their revs advance. |
| 13: persistent choices | PASS: all five transition choices remain present after use and Change; stage-3 choices show “Commit to the board, then keep going.” |
| 14: legacy worlds | PASS: legacy sandbox reading and all 300 stress cards/40 Wormholes retained. Walked stress Kitchen → Follow the echo → Back. CI verifies 307 committed nodes, deterministic radial depth and no node overlap. |

The published `/checks.html` sandbox API suite passed every v4 assertion. Source expansion and Transaction checks pass syntax, media/identity client checks, disposable Postgres migration/ownership/session/concurrency checks, stress geometry and build. Concurrency evidence covers ten simultaneous independent sessions/commits and a same-cell write race; this is not a claim of a 33-device physical load test. Chrome reports extension-origin errors in its own extensions; no Jootsy app error was observed in the walkthrough.

Evidence images: [desktop editor](docs/verification/v4-editor.jpg), [committed Board](docs/verification/v4-board.jpg). QA content was created only in `sandbox`; stress was read-only.

## Decisions made without blocking

- A valid Name + Fragment autosaves after 1.9 seconds or blur. Incomplete new cells retain their local buffer. Once saved, empty edits persist privately and block Commit. Saved server drafts survive device changes.
- Change to a link opens its target picker first. Cancel preserves the transition; choosing a target performs the change. Undo reconstructs removed content with new private row IDs where necessary.
- Cards groups threads by contiguous authorship, newest thread first; Previous/Next follows creation order within the thread.
- The three stages fit side by side from 1200px. Narrower displays scroll horizontally; the 360px header and controls remain usable. Commit stays visible while scrolling.
- Tier 1 Refresh is a plain sync with a confirmation toast only on success. No scan animation, curve-end correction, energy animation or colour pass has been started.
- The source transport retains the existing remote `engineer-v3` branch name; v4 is identified by commit and this report. Release-base conflicts involved only the archive and handoff notes and were resolved with the current v4 versions before rerunning checks.
- The v4 migration is additive, normalizes dead ends, retires unwritten paths, and enables Jootsy at five committed cards. Committed fragments and scenarios are retained.

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
