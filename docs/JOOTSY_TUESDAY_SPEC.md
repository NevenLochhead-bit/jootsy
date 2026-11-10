# Jootsy! — Tuesday Spec (for Codex) — v2.4

> **v2.4 (Tue Nov 10, 01:40 ET): read §15 first.** It changes how a card is played ("write, then cut") and overrides §5 R5, §6 `POST /plays`, and §7.2 wherever they differ. Everything else in v2 stands.

*From the architect. **Replaces v1 entirely**; if you started on v1, the model changed (types now live on cards, every move plays a card, paths can be claimed). Self-contained: you do not need the brief to build this. Deadline: deployed and tested before **Tuesday Nov 10, 2026, 10:00 am ET**. Class is at 12:30 pm with 33 first-year students, many on phones.*

Build in the three slices in §11, deploy after each, and report as in §14. If something here is ambiguous, choose the simpler reading, note it, and keep going. Do not stop to ask.

---

## 1. What it is

A shared, persistent, branching story world, played with **cards**. A player picks a card from their hand (Fork, Destiny, Dream, Wormhole, Dead End), writes a short first-person fragment on it, and plays it onto a **path** that an earlier card left open. The card they play names new paths of its own. So the world is a forest of trees rooted at **scenarios**, growing outward.

Unwritten paths are **face-down cards**. Anyone may play on any face-down card, whoever dealt it. Written cards are **face-up** and belong to their author.

Two views of the same data: a radial **Map** and a one-card-at-a-time **Card view** ("Street View"), where all reading and playing happens. Nobody positions anything; layout is derived from the tree.

It must feel like playing cards: a hand you choose from, cards that are dealt, flipped and played onto a table.

## 2. Stack

- GitHub repo → Netlify, as usual. A **new, separate repo and Netlify site**. It shares no code or data with the MDST 1050 course site or the Scopitron.
- Netlify Functions for the API. The client is never trusted for author, depth or permissions.
- A **transactional Postgres** database: Netlify DB (Neon) or Supabase, whichever you can provision fastest. Rules R4 and R6 need real transactions; do not use a key-value or blob store for game state.
- Images in Netlify Blobs or Supabase Storage.
- If the database or storage needs Neven to click anything (claim it, create an account, approve an add-on) for it to persist past a trial, say exactly what in your report.
- Single-page app, usable on a phone at 360 px wide. Updates by polling (§6); no websockets.

## 3. Vocabulary

| Term | Meaning |
|---|---|
| World | One game. Everything is scoped to a world. More than one can exist. |
| Scenario | A root card at the centre. Belongs to no player. Made by the instructor. |
| Card | A fragment: a **type**, text (required), optional media, an author, and the paths it offers. |
| Type | `fork`, `destiny`, `dream`, `wormhole`, `dead_end` (Thursday adds `jootsy`). Fixed when the card is played. |
| Path | A named way forward from a card. Leads to one card, or is **unwritten**. |
| Face-down | An unwritten path. Shown as the back of a card with its name on it. |
| Face-up | A written card. |
| Playing a card | Choosing a type, writing it, and placing it on a face-down path. |
| Hand | The card types a player can play, shown fanned at the bottom of the Card view. Unlimited; it never runs out. |
| Ring | A card's depth: scenarios are ring 0, cards played on their paths ring 1, and so on. |
| Timeline | All the cards one player has played. |

A card's title is never stored; it is the label of the path it was played on, shown as **"Option: {label}"**. Scenarios show **"Name: {title}"**.

## 4. Data model

```
worlds   id, slug (unique), name, jootsy_ring int=7, jootsy_min_cards int=7,
         end_ring int=11, jootsy_enabled bool=false, rev bigint=0, created_at
players  id, world_id, name, name_key (lower/trimmed; unique per world),
         pass_hash, is_instructor bool, last_seen_at, created_at
cards    id, world_id, type, author_id (null for scenarios),
         scenario_title (scenarios only), body,
         media_kind (null|image|embed), media_url,
         parent_path_id (null for scenarios; UNIQUE), depth int,
         door_label, target_card_id   -- wormhole (and Thursday, jootsy) only
         hidden bool=false, deleted bool=false,
         seq bigint (creation order), rev bigint, created_at, updated_at
paths    id, world_id, from_card_id, label, to_card_id (nullable),
         created_by, position int,
         claimed_by (nullable), claimed_until (nullable),
         deleted bool=false, rev bigint, created_at, taken_at
events   id, world_id, type, actor_id, target_player_id (nullable),
         card_id, path_id, rev bigint, created_at
```

`cards.type` also takes `scenario`. Every mutation runs in one transaction that increments `worlds.rev` and stamps the new value on every row it touches. Deletes are tombstones (`deleted=true`), never row removal.

## 5. Rules (each is a test)

**Structure**
- **R1.** Every non-scenario card sits on exactly one path (`parent_path_id`), and that path's `to_card_id` is the card. One card per path, enforced by a unique constraint.
- **R2.** `depth(card) = depth(card the path belongs to) + 1`. Scenarios are 0. Set by the server.
- **R3.** No positions are stored anywhere.

**Playing**
- **R4.** Any player may play a card on any unwritten path on any card. Exactly one card lands. A second attempt gets `409` with the card that landed.
- **R5.** The paths a card offers are named when it is played, by type:
  - `fork`: 2–4 paths.
  - `destiny`: exactly 1 path.
  - `dream`: 1–4 paths.
  - `wormhole`: no paths. It has one **door**: a `door_label` and a `target_card_id` that is an existing, non-deleted card **by the same author** in the same world.
  - `dead_end`: no paths, no door.
- **R6.** *Claims.* Opening the composer on a path claims it for that player for 10 minutes, renewed every 60 s while the composer is open and released on cancel. While a claim is live, only the claimer may play there; others get `409 claimed`. An expired claim is no claim.
- **R7.** *Scenarios.* Any player may add one new path to a scenario and play a card on it in the same transaction. Scenarios have no path limit.

**Ownership**
- **R8.** Only a card's author may edit its body, media or door label.
- **R9.** Only the author may add a path to their own `fork` or `dream` card, rename an unwritten path on their card, or remove one. A fork never drops below 2 paths, a dream or destiny below 1, and no card exceeds 6.
- **R10.** An author may delete their own card only if none of its paths has been written. Deleting tombstones the card, its paths and any wormholes whose door points at it; the path it sat on becomes unwritten again.
- **R11.** Nobody but the author can change anything on a face-up card. Instructors may additionally hide or unhide any card, and create, edit or delete scenarios (delete only while nothing has been played on them).

**Content and identity**
- **R12.** `body` is 1–600 characters, plain text, rendered as text (never HTML). Path and door labels are 1–60 characters.
- **R13.** A hidden card is replaced, for non-instructors, by a stub "Hidden by the instructor". Its paths and descendants remain reachable.
- **R14.** A wormhole's door never affects depth or layout.
- **R15.** A player joins a world with a name and a passcode (4+ characters) they choose. If the name already exists in that world, the passcode must match. That is the login. The token persists on the device. No email.

## 6. API

All under `/api/w/:slug`. Bearer token on everything but `join`.

| Method and path | Body | Does |
|---|---|---|
| `POST /join` | `{name, passcode}` | Create or log in. Returns `{token, player}`. |
| `GET /state?since=<rev>` | | All cards, paths, players (id, name) and the caller's events with `rev > since`, plus world settings and current `rev`. `since=0` is the full world. |
| `POST /paths/:id/claim`, `DELETE /paths/:id/claim` | | R6. Claim also serves as the heartbeat. |
| `POST /plays` | `{path_id}` **or** `{new_path:{from_card_id, label}}`, plus `{type, body, media_kind?, media_url?, paths?:[label…], door?:{label, to_card_id}}` | Play a card (R4–R7). One transaction: creates the path if new, checks it is unwritten and not claimed by someone else, creates the card and its paths, clears the claim. `new_path` is allowed on scenarios (anyone) and on the caller's own fork or dream card. |
| `PATCH /cards/:id` | `{body?, media_kind?, media_url?, door_label?}` | R8. |
| `DELETE /cards/:id` | | R10. |
| `POST /cards/:id/paths` | `{label}` | R9. |
| `PATCH /paths/:id`, `DELETE /paths/:id` | `{label}` | R9. Unwritten paths only. |
| `POST /uploads` | image | Returns a URL. Client downscales to 1600 px max, JPEG, before upload. |
| `POST /cards/:id/hide` | `{value:bool}` | Instructor. |
| `POST /scenarios`, `PATCH /scenarios/:id`, `DELETE /scenarios/:id` | `{title, body, paths?:[label…]}` | Instructor. |
| `PATCH /settings` | | Instructor. |
| `POST /players/:id/reset-passcode` | | Instructor. |

Errors are `{error: code, message}` with a human message the UI shows as is.

**Polling.** The client calls `/state?since=rev` every 4 s while the tab is visible, on focus, and immediately after its own writes. Merge by id.

**Events** to write: `card_played`; `path_taken` (target = author of the card the path belongs to, when someone else plays on it); `card_hidden`.

## 7. Screens

### 7.1 Join
Wordmark, world name, name field, passcode field, **Enter**. One line under it: *"New here? Pick a name and a passcode. Coming back? Use the same ones."*

### 7.2 Card view (Street View)
Mobile-first. One card on the table, its paths below it, your hand at the bottom.

- **Top bar:** back (browser history), "Ring {n}", **Map** (opens the Map centred on this card), **Me**.
- **Came from:** a small link above the card to the card it was played from, "← {title}".
- **The card,** face-up, portrait (5:7), rounded corners: a frame in its type colour, the type's icon in two opposite corners like a suit; title; media; body; "by {name}".
  - Wormhole: a black door at the foot of the card, "⚫ {door_label}"; goes to its target.
  - Dead end: "🛑 Dead end." and **Back to the last fork** (nearest ancestor with an unwritten path; failing that, nearest ancestor fork).
- **Paths,** a row of small cards under it (wrapping), in position order:
  - written → a small face-up card: type colour, title, author. Tap to walk there.
  - unwritten → a small **face-down** card showing the back of the dealer (the author of the card above), with the path's name on a band across it. Tap to play on it.
  - claimed by someone else → face-down, "✍ {name} is writing…", not tappable.
  - on scenarios, and on the viewer's own fork or dream card with fewer than 6 paths: a ghost slot, **＋ new path**.
- **The hand,** fanned along the bottom edge: 🔀 Fork, 🔮 Destiny, ✨ Dream, ⚫ Wormhole, 🛑 Dead End, and 🎆 Jootsy! **face-down**. Tapping a hand card:
  - one playable path here → straight to the composer on it;
  - several → "Which path?" (the face-down cards lift);
  - none → "Nothing to play on here. Walk on, or find a face-down card on the Map."
  - Jootsy! → it stays face-down and says "Turns over at the Jootsy! Perimeter: ring {jootsy_ring}. You're at ring {my furthest ring}, {my cards} of {jootsy_min_cards} cards."
- Tapping a face-down path first, then a hand card, reaches the same composer.
- **Author tools** on your own card: Edit; Delete (when R10 allows); rename or remove unwritten paths inline.
- **Instructor:** Hide / Unhide.

**Composer.** The card you are playing, turned face-up and writable, over the table. Its type can still be switched by tapping another card in the hand.
- Title: the path's name (fixed), or a name field when it is a new path.
- Fragment, placeholder *"I see… I hear… I walk toward…"*, live count to 600. **Add image**, **Paste a link**.
- "Where does it lead?", by type:
  - Fork: two path-name fields, "+ path" to 4.
  - Destiny: one.
  - Dream: one, "+ path" to 4. Helper: *"Break cause and effect. Continue by association."*
  - Wormhole: a door name, then a searchable list of the player's own cards (title, first words, ring). Disabled with a one-line reason if they have none.
  - Dead End: nothing.
- **Play card.** The card lands on the path (a 300 ms flip is enough) and the player is now standing on it, its new face-down paths below, hand ready. This is the loop: play, land, play.
- On `409`: "Someone just played here." with a button to read their card.

### 7.3 Map (Overview)
Full-screen canvas or SVG, pan and zoom (drag, wheel, pinch). See §8.

- Controls: **Fit**, **Find me** (centres my furthest card), **Mine** (dims everyone else's cards to 35%), a player picker (same dimming for any player's timeline), toggles for face-down cards and wormholes.
- Tap a card → a small preview (title, first 140 characters, author) with **Open**. Tap a face-down card → preview with **Play here**.
- A legend of the types and the two rings.

### 7.4 Me (drawer)
- "{n} cards played · furthest ring {r}" and a progress bar to the Jootsy! Perimeter.
- **Face-down on my cards:** my unwritten paths, each with **Play**.
- **News:** "{name} played on your path '{label}'" linking to their card; unread count badge on **Me**.
- Log out.

### 7.5 Instructor
Reached by logging in as an instructor player.
- **Scenarios** (slice A): list; **New scenario** (name, opening text, optional starting paths); edit; delete if unplayed. A new scenario appears on everyone's Map within one poll.
- Players table: name, cards, furthest ring, last active; a row opens the Map filtered to that player; reset passcode.
- Settings: `jootsy_ring`, `jootsy_min_cards`, `end_ring`, `jootsy_enabled`.

## 8. Map layout

Deterministic and derived; recomputed whenever the state changes, animated over 400 ms so cards glide rather than jump.

1. Build a hierarchy: a virtual root → scenarios (in creation order) → for each card, its non-deleted paths in `position` order. A written path is represented by its card; an unwritten one is a face-down leaf.
2. Lay it out with `d3-hierarchy` `tree()` in polar coordinates: angle from the layout, **radius strictly from depth**: `r(d) = 240 + 170·d` world units. Scenarios sit at `r(0)`; the centre holds the wordmark, drawn as the deck.
3. If the most crowded ring gives any node less than 30 units of arc, multiply the ring spacing by the factor that fixes it. The world breathes outward, never overlaps.
4. Angular order never changes for existing siblings, so a player's branch stays where they left it.
5. **Rings:** a hairline at every depth; a pink dashed ring at `jootsy_ring` labelled "Jootsy! Perimeter"; a white dashed ring at `end_ring` labelled "End of Game ∞". Cards may exist beyond it.
6. **Edges:** curved radial links in the colour of the card they leave. Wormhole doors as thin dashed white chords, drawn beneath the nodes.
7. **Nodes are cards at every zoom:** far, small portrait rectangles in their type colour (about 7×10 px; scenarios 20×28 with their name); middle, the title appears; near, a mini-card with the first two lines. Face-down cards are outlined rectangles with a hatch.
8. **Budget:** 500 cards pan and zoom smoothly on a mid-range phone.

## 9. Look

A card table at night: lit cards on dark ground. Yours to refine; hold to these.

- Ground `#0d0f1a`; text `#f2f0ea`; hairlines at 12% white. Card faces are light (`#f7f4ec`) with dark text, so a card reads as a physical card on the dark table.
- Types: Fork `#4c8dff`, Destiny `#a26bff`, Dream `#ffd84a`, Dead End `#ff5a4f`, Jootsy! `#ff5fb0`, Wormhole black `#000` with a 1.5 px white edge. Scenario: white frame, larger.
- Icons: 🔀 Fork, 🔮 Destiny, ✨ Dream, ⚫ Wormhole, 🛑 Dead End, 🎆 Jootsy!.
- **Card backs are identity.** Each player's back is generated from their name: a hue and one of about eight simple patterns. A face-down card shows its dealer's back. Scenario paths use the world's back (the wordmark).
- Dream is the central card this term: give its yellow a soft glow.
- One display face with some play for titles and the wordmark; a plain, very readable face for fragments at 17 px or larger.
- Motion is small and card-like: lift on hover or press, flip on play. Nothing else moves.
- No tutorial overlays. Every empty state says what to do in one sentence.

## 10. Seeds

- World `mdst1050` — "Jootsy! · MDST 1050" — with one instructor player (`Neven`, passcode from an environment variable) and these starting scenarios, each with no paths. Neven will add and rewrite scenarios himself in the instructor view.

| Name | Text |
|---|---|
| Window | I turn to the window. Following the sound with my eyes I see… |
| Alarm | An alarm is going off somewhere. It isn't mine. I get up and… |
| Stairwell | I'm on a staircase I don't remember climbing. Below me I hear… |
| Screen | The screen lights up by itself. On it I see… |
| Bus | I wake up on a bus. Everyone else is asleep. Outside the window… |
| Kitchen | It's the middle of the night. The kitchen light is on. I walk in and… |
| Field | I'm standing in a field at dusk. Something is humming. I walk toward… |

- World `sandbox` — same scenarios, for the demo and for testing. Never shown to students.
- World `stress` — a script-generated world: 33 players, 300 cards of mixed types, about 150 face-down paths, 40 wormholes, depths to 12, realistic text lengths.

## 11. Slices and the cut line

Deploy after each. If time runs out, **A + B is the class-ready game**; say so and stop adding.

- **A — the game without a map.** Join; seeds; instructor scenario create and edit; `/state` and polling; Card view with paths and the hand; composer; playing all five types (R1–R7, R12, R14, R15); claims; landing on your played card.
- **B — the Map.** §8 in full, the previews, **Map** / **Open** in both directions, the `stress` world.
- **C — the rest.** Me drawer and news; edit, delete, add and rename paths (R8–R10); card backs per player (until then, one shared back); images and links (YouTube, Vimeo and SoundCloud URLs become embeds; a direct image, audio or video URL plays natively; anything else is a plain link); players table and settings; hiding (R13).

## 12. Acceptance checklist

Run these yourself, then report.

1. A new player joins on a phone, opens a scenario, adds a path, plays a Fork on it and lands on their card in under 90 seconds with no instruction.
2. Their Fork shows two or more face-down cards beneath it. They play on one; the other stays face-down.
3. A second browser sees the new card and the face-down path within 5 seconds, without reloading.
4. A second player plays on the first player's face-down path. The first player's news shows it.
5. While player A has the composer open on a path, player B sees "A is writing…" and cannot play there. After A cancels, B can.
6. Two browsers post a play to the same unclaimed path at the same instant: one card exists; the other sees the 409 message.
7. Ten players add a path to the same scenario at once: ten paths, ten cards, no errors.
8. Player B cannot edit or delete player A's card, or add, rename or remove a path on it (API returns 403, UI offers no control).
9. Wormhole: the picker lists only the player's own cards; the API rejects any other target. The door walks to its target.
10. A Dead End has no paths; **Back to the last fork** works.
11. Deleting a card with no written paths turns the path it sat on face-down again; a card with a written path cannot be deleted.
12. The instructor creates a new scenario; it is on a student's Map within 5 seconds and can be played on.
13. Every card's ring on the Map equals its depth; no two nodes overlap in the `stress` world; the two perimeters are drawn and labelled.
14. Map → Open → Card view → Map returns to the same card, centred.
15. Reload, log out and back in with the same name and passcode: nothing is lost. A wrong passcode for an existing name is refused with a clear message.
16. `<script>` typed into a fragment renders as text.
17. The `stress` world loads in under 3 seconds and pans smoothly on a phone.

## 13. Not on Tuesday (leave room, build nothing)

Thursday's Jootsy! card, so the model can take it without migration: a card of type `jootsy` is played on a path like any other, but its `target_card_id` is a **face-up card by another player**. It shows that card's fragment live (a mirror, never a stored copy), offers a door into the original, and has paths of its own. It is the only way into someone else's face-up card. Also not on Tuesday: the unlock at the perimeter, the Jootsy! event and notice, inserting a card into the middle of your own timeline, audio and video uploads, per-player branch export, creating worlds from a form. The face-down Jootsy! card in the hand, `type='jootsy'`, `target_card_id` and `jootsy_enabled` are the only traces on Tuesday.

## 14. Report back

After each slice: the deployed URL, the instructor passcode, the database and storage you used and anything Neven must click to keep them, which checklist items pass, and anything you decided where this spec was silent.

## 15. Change v2.4 — write, then cut

Designer decisions (Neven, Nov 10): *"we aren't playing specific cards but have these options for how to put them in relation."* And: *"the student really just needs to focus on naming their cards, adding an image or video, and a description of some type of narrative fragment."*

Every card is the same when it is written. Fork, Destiny, Dream, Wormhole and Dead End are **cuts**: the author's one-click choice of how their card hands off to what comes next. A cut deals blank face-down cards. Whoever writes a card names it.

Do F1 and F2 from `ARCHITECT-NOTES.md` (branch `architect`) **first**, deploy and verify them, then this.

*(v2.3 replaces v2.2 of this section. Differences: a cut no longer asks for path names; the writer names the card; the words on connections show on hover or tap only.)*

### 15.1 Data

- `cards.type` gains the value `open`: a written card that has not been cut. Replace the CHECK constraint in a new migration.
- `paths.label` may be empty (`''`) while the path is unwritten. Relax its CHECK to 0–60 characters. A written path always has a label of 1–60.

### 15.2 Rules (replace R5; add R16–R19)

- **R5′.** A card is played with a **name** (1–60 characters), a fragment (1–600) and optional media. The name becomes the label of the path it is played on, replacing anything pencilled there. The card lands with `type='open'`: no paths, no door. R4, R6 and R7 are otherwise unchanged (a scenario's new path and its card are still one transaction).
- **R16. Cut.** Only the author may cut their own `open` card, once, choosing:
  - `fork`: deals 2 blank paths (`count` 2–4, default 2);
  - `destiny`: deals exactly 1;
  - `dream`: deals 1 (`count` 1–4, default 1);
  - `wormhole`: a target that is another existing, non-deleted card by the same author (never the card itself), and an optional door label (default: the target's title);
  - `dead_end`: nothing.
  One transaction sets the type and creates the paths with empty labels. Cutting a card that is not `open` returns `409`.
- **R17. Uncut.** The author may undo their cut while none of the card's paths is written or claimed by someone else. It tombstones those paths, clears any door, and returns the card to `open`.
- **R18.** Nobody but the author can do anything to an `open` card. It offers no paths, so play continues from it only after its author cuts it.
- **R19. Pencilling.** The author of a card may write, change or clear a name on any of its unwritten paths (the existing `PATCH /paths/:id`, now accepting an empty label). It is an invitation only; the writer's name replaces it.

R9 (dealing one more blank path from your own Fork or Dream, to 6) and R10 (delete) are unchanged; an `open` card has no paths, so its author can delete it.

### 15.3 API

| Method and path | Body | Does |
|---|---|---|
| `POST /plays` | `{path_id}` or `{new_path:{from_card_id}}`, plus `{label, body, media_kind?, media_url?}` | Plays an `open` card and sets the path's label (R5′). `type`, `paths` and `door` are no longer accepted from the client. |
| `POST /cards/:id/cut` | `{type, count?, door?:{label?, to_card_id}}` | R16. |
| `DELETE /cards/:id/cut` | | R17. |
| `POST /cards/:id/paths` | `{}` | R9: deals one more blank path. |
| `PATCH /paths/:id` | `{label}` (0–60) | R19. |

### 15.4 Card view (replaces the hand and the type choice in §7.2)

- **The hand is removed** from the bottom of the Card view, and the type switcher from the composer.
- **Composer:** three things, in this order, and nothing else: **Name your card** (prefilled with a pencilled name if there is one), the fragment, **Add image** / **Paste a link**. Then **Play card**. Tapping a face-down card goes straight to it.
- **After Play card** the player lands on their new card with **"How does it cut?"** directly under it: 🔀 Fork · 🔮 Destiny · ✨ Dream · ⚫ Wormhole · 🛑 Dead End, and 🎆 Jootsy! locked with the same progress line as before. Each is **one click**:
  - Fork → two blank face-down cards appear under the card, immediately.
  - Destiny → one. Dream → one.
  - Wormhole → the searchable list of the player's own other cards; picking one makes the door.
  - Dead End → confirms in place.
- On your own Fork or Dream, a ghost **＋ card** deals one more (R9).
- The loop is now: **write, cut, write.**
- A blank face-down card reads **"unwritten"** on its band, or its pencilled name. On your own card, tapping the band's pencil lets you name it (R19); this is never required.
- Your own cut card whose paths are all unwritten shows a quiet **Change the cut** (R17).
- Someone else's `open` card shows one line in place of paths: *"{name} hasn't cut this card yet."*
- **Look:** an `open` card has a white frame; it takes its cut's colour when cut. On the Map an `open` card is white, and the viewer's own pulse gently.
- **Me drawer:** add **"Not yet cut"**, the player's own `open` cards, each with **Open**.
- Player-facing copy says "cut", never "type" or "hand". (The word is Neven's to change.)

### 15.4a The trace on every connection

Designer (Neven, Nov 10): *"the arrows have a trace of what the transition is… so we understand the movement"*, and *"maybe those words are only hover-over visible, and each transition is colour coded."*

- **Colour is the trace.** Every connection is an arrow pointing the way the story moves, in its cut's colour (already §8.6). Wormhole chords get an arrowhead at the target.
- **The word appears only on hover (desktop) or tap (touch):** a small label on the arrow, "Fork", "Dream", "Wormhole". No permanent text on connections at any zoom. The legend stays.
- **Card view.** The "came from" line and each path tile carry their cut's colour and icon; the word shows on hover or tap.
- A path's cut is the type of the card it leaves, so no new data is needed.

### 15.4b "Describe an image" — last, and only if A1–A8 already pass

Designer (Neven, Nov 10): *"we could also have a 'describe image' option and AI could make it for us when we later string it together."* On Tuesday this **stores a description only**. No image generation, no AI call, no key.

- New nullable column `cards.image_prompt` (text, up to 300 characters). Accepted by `POST /plays` and `PATCH /cards/:id`; returned in `/state`.
- Composer: the media row becomes **Add image · Paste a link · Describe an image**. The third opens one line: *"Describe the image this card should have."* A card has either media or a description, not both.
- Card view: where the image would be, a framed placeholder with the description in italics and the caption "image to come". Nothing on the Map.
- If this is not built by the cutoff, leave it out entirely; nothing else depends on it.

### 15.4c No perimeters

Designer (Neven, Nov 10): *"I also don't think we need the perimeter rings. My task for students is to play at least five cards, that's it."* This overrides §7 and §8 wherever they mention rings or perimeters.

- **Map:** draw no rings at all: no Jootsy! Perimeter, no End of Game ring, no depth hairlines, no ring labels; remove them from the legend. The layout itself is unchanged: radial, scenarios at the centre, radius strictly from depth (§8.1–8.4).
- **Card view:** remove "Ring {n}" from the top bar.
- **The task is five cards.** `jootsy_min_cards` defaults to 5 (migration: set it to 5 in every world). Wherever progress was shown toward the perimeter, show **"{n} of 5 cards played"** instead: in the Me drawer (with the bar), and on the locked 🎆 Jootsy! button, which on Tuesday reads "{n} of 5 cards played. Jootsy! opens on Thursday."
- **Settings:** show only `jootsy_min_cards` and `jootsy_enabled`. Leave `jootsy_ring` and `end_ring` in the table, unused.
- **Instructor players table:** drop "furthest ring"; keep cards played, and mark players who have reached `jootsy_min_cards`.
- Acceptance item 13 becomes: every card's distance from the centre on the Map equals its depth; no two nodes overlap in the `stress` world; **no ring or perimeter is drawn anywhere.**

### 15.5 Existing data

Cards already typed and paths already named (the `stress` world, sandbox tests) stay as they are and behave as before. No conversion.

### 15.6 Acceptance (in addition to re-running 2–17)

- **A1.** On a 360 px phone, a new player: scenario → **Start here** → names the card, writes, **Play card** → lands on an open card → taps Fork → two blank face-down cards appear with no further input. Under 60 seconds, no instruction.
- **A2.** Another player sees no cut controls on that open card, and `POST /cards/:id/cut` returns 403 for them.
- **A3.** Cutting an already-cut card returns 409.
- **A4.** Uncut works while all paths are unwritten; it is refused once another player has written or is writing on one.
- **A5.** A wormhole cut rejects the card itself and any card by another player as its target.
- **A6.** A previously typed card in `stress` renders and walks exactly as before.
- **A7.** No connection shows a word until it is hovered or tapped; every connection is in its cut's colour and points the right way.
- **A8.** Playing on a blank path without a name is refused with a clear message; a pencilled name is prefilled and can be replaced.

### 15.7 Cutoff and rollback

Known-good release: `main` at `2c16471`. This change must be deployed and re-verified by **09:00 ET Tuesday**. If it is not, say so in your report, redeploy `2c16471` plus F1/F2, and run `UPDATE cards SET type='dead_end' WHERE type='open'` and `UPDATE paths SET label='unwritten' WHERE label=''` so the older client never meets an open card or an empty label. Do not put QA writing in the `mdst1050` world.
