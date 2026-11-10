# Jootsy! — Tuesday Spec (for Codex) — v4.1

> **v4.1 (Tue Nov 10, 09:55 ET): §17 is the change to build now.** It is the Designer's notes after playing the v4 core (live at `19fdf3b`): wording, the join screen, sound on cards, light on the wires instead of arrowheads, and a list of removals. §17 overrides §16 wherever they differ. §16 is what is deployed.

*From the architect. Sections 1–14 are v2, as built and deployed at `2c16471`; **§15 (v3) is the change to build now.** Self-contained: you do not need the brief to build this. Deadline: deployed and tested before **Tuesday Nov 10, 2026, 10:00 am ET**. Class is at 12:30 pm with 33 first-year students, many on phones.*

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

## 15. Change v3 — every card the same; the cut is the move

**This section replaces all earlier versions of §15 (v2.2–v2.4) and overrides §3–§8 wherever they differ.** It is a model change, not a reskin. Where §15 is silent, v2 stands.

Designer decisions (Neven, Nov 10):
- *"Every card is essentially the same, but you determine how it branches… it's all about negotiating the cut from one to the next."*
- *"We aren't playing specific cards but have these options for how to put them in relation."*
- *"A fork deals two blank cards, destiny deals one blank card, dream deals one blank card. The forker names the card. They author that transition. You can't write in someone else's transition, but you can subsequently fork from it."*
- *"The student really just needs to focus on naming their cards, adding an image or video, and a description."*
- *"We don't need the perimeter… my task for students is to play at least five cards."*

**The game in four sentences.** Any player can cut from any written card, their own or anyone else's: Fork, Destiny or Dream. A cut deals blank cards that belong to the player who cut. Only that player writes them: a name, a fragment, optional media. Everyone can then cut from what they wrote.

Do F1 and F7 from `ARCHITECT-NOTES.md` (branch `architect`) **first**.

### 15.1 Data

- `cards.type`: new cards are `open`. `dead_end` marks a dead end. `scenario` as before. Older values stay legal for existing rows.
- `paths` gains `kind` (`fork`, `destiny`, `dream`, `wormhole`; Thursday adds `jootsy`) and `cut_id` (shared by the two paths of one Fork). `paths.created_by` is the **dealer**: the owner of that blank card.
- `paths.label` may be `''` while unwritten; a written path's label is 1–60 characters and is the card's name.
- `cards.image_prompt` (nullable, up to 300 characters) — only if §15.7 is built.
- Claim columns stay in the table, unused.

### 15.2 Rules (these replace R4–R11; R1–R3 and R12–R15 stand)

- **C1. Cut.** Any player may cut from any written card that is not a dead end, including scenarios and other players' cards. `fork` deals **2** blank paths, `destiny` **1**, `dream` **1**. The paths carry the kind and belong to the cutter. A card may be cut any number of times, by any number of players.
- **C2. Write.** Only the dealer may write on their blank path: a name (1–60), a fragment (1–600), optional media. The card lands with depth = parent + 1; its name is the path's label. Anyone else gets `403`.
- **C3. Wormhole.** A player may cut a wormhole from one of **their own** cards to another of their own cards (never the same card). It is one path of kind `wormhole` with `to_card_id` set, an optional label (default: the target's name), no new card, and no effect on depth or layout.
- **C4. Dead End.** A card's author may mark it a dead end only while no live path leaves it. Nobody can cut from a dead end. The author can undo it.
- **C5. Discard.** A dealer may discard any of their own blank paths, or any of their own wormholes, at any time.
- **C6. Cap.** A player may hold at most **8** blank cards in a world. A cut that would exceed it returns `409`: "Write or discard one of your blank cards first."
- **C7. Ownership.** Only a card's author may edit its name, fragment or media. Nobody may write, rename or discard another player's blank card.
- **C8. Delete.** An author may delete their own card only while no tree path leaves it (written or blank, anyone's). Their own wormholes from or to it are tombstoned with it. The path it sat on becomes blank again and is still theirs.
- **C9. Scenarios** have no author; only the instructor creates, edits or deletes them (delete only while no path leaves them). Starting paths on scenarios are dropped. Everyone cuts from a scenario exactly as from any card.
- **C10.** A card's colour is the kind of the cut that leads into it. Scenarios are white.
- **C11.** There are no claims. Remove the claim calls and the "is writing…" state.

### 15.3 API (replaces the `plays`, `claim`, `cards/:id/paths` and path routes of §6)

| Method and path | Body | Does |
|---|---|---|
| `POST /cards/:id/cuts` | `{kind:"fork"\|"destiny"\|"dream"}` | C1, C6. Returns the new blank paths. |
| `POST /cards/:id/cuts` | `{kind:"wormhole", to_card_id, label?}` | C3. |
| `POST /plays` | `{path_id, label, body, media_kind?, media_url?, image_prompt?}` | C2. |
| `DELETE /paths/:id` | | C5. |
| `POST /cards/:id/dead-end` | `{value:bool}` | C4. |
| `PATCH /cards/:id` | `{label?, body?, media_kind?, media_url?, image_prompt?}` | C7. `label` renames the card (its incoming path). |
| `DELETE /cards/:id` | | C8. |

`join`, `state`, `uploads`, `hide`, `scenarios`, `settings`, `reset-passcode` are unchanged, except that `scenarios` ignores `paths`.

**Events:** `card_played` (own); `card_cut` with target = the card's author, written when a different player cuts from their card.

### 15.4 Card view (replaces §7.2)

- **Top bar:** back, **Map**, **Me**. No ring number.
- **Came from:** "← *{parent name}*" in the colour of the cut that brought you here, with its icon; the word on hover or tap.
- **The card:** portrait, frame in the colour of its incoming cut (C10); name; media; fragment; "by {name}". Tapping the author's name opens the Map with that player lit.
- **What leaves it,** as a row of small cards under it:
  - a written card → face-up tile: its name, its author, its cut's colour and icon. Tap to walk there.
  - **your** blank card → face-down with your card back and **Write**. A small × discards it.
  - **someone else's** blank card → face-down with their back, dimmed, "{name}'s", not tappable.
  - a wormhole → a black tile, "→ *{target name}*". Tap to go.
- **"How does it cut?"** directly under that row, on every written card, for every player: **🔀 Fork · 🔮 Destiny · ✨ Dream**. On your own cards also **⚫ Wormhole** and **🛑 Dead End**. Last, **🎆 Jootsy!** locked: "{n} of 5 cards played. Jootsy! opens on Thursday."
  - Each is **one click.** Fork: two of your blank cards appear in the row. Destiny, Dream: one. Wormhole: a searchable list of your own other cards. Dead End: confirms in place.
- **Composer** (tap one of your blank cards): **Name your card**, the fragment (placeholder *"I see… I hear… I walk toward…"*, count to 600), **Add image · Paste a link**, then **Play card**. Nothing else.
- **After Play card** you land on your new card with "How does it cut?" under it. The loop: **cut, write, cut.**
- **Dead end:** "🛑 Dead end." and **Back to the last fork**; no cut row for anyone; its author sees **Undo**.
- **A scenario with nothing cut from it yet** says one sentence: "Cut from here to begin. Fork gives you two cards to write."
- Player-facing copy says "cut". (The word is Neven's to change.)

### 15.5 Map (changes to §7.3 and §8)

- **No rings of any kind:** no perimeters, no hairlines, no ring labels, none in the legend. The layout is unchanged: radial, scenarios at the centre, radius strictly from depth.
- **Connections** are arrows pointing the way the story moves, in their cut's colour. The word ("Fork", "Dream", "Wormhole") appears only on hover (desktop) or tap (touch). No permanent text on connections.
- **Cards** are small portrait rectangles in the colour of their incoming cut. Blank cards are outlined, tinted with their dealer's back. Only your own blank cards are tappable (**Write**).
- **Players panel** (for everyone): every player's name with their count of cards played, most first. Tap a name: their cards light up, everyone else's dim to 35%. Tap again to clear. **Mine** stays as the shortcut.
- Fit, Find me, the previews and Map ↔ Card navigation stay.

### 15.6 Me, instructor, settings

- **Me:** "{n} of 5 cards played" with a bar; **My blank cards** (each with **Write** and **Discard**); **News**: "{name} forked from your card *{name}*" (likewise "dreamed from", "drew a destiny from"), linking to that card; Log out. Play does not stop at five.
- **Instructor players table:** name, cards played (marking those at five or more), last active; a row opens the Map with that player lit.
- **Settings:** `jootsy_min_cards` (default **5**; set it to 5 in every world) and `jootsy_enabled` only.

### 15.7 "Describe an image" — last, and only if everything in §15.9 already passes

Stores a description; generates nothing. The composer's media row gains **Describe an image**: one line, *"Describe the image this card should have."* A card has media or a description, not both. In the Card view the description sits where the image would be, in italics, captioned "image to come". If time is short, leave it out entirely.

### 15.8 Existing data

One migration, then nothing legacy remains:
- every existing path: `kind` = its from-card's type if that is `fork`, `destiny` or `dream`, otherwise `fork`;
- every existing wormhole card: add a `wormhole` path from it to its target, owned by its author, labelled with its door label;
- every non-scenario card: `type` = `dead_end` if it was a dead end, otherwise `open`;
- unwritten paths keep their dealer as owner; clear all claims; set `jootsy_min_cards` = 5.

Regenerate or keep the `stress` world as you prefer, as long as it has ~300 cards and still passes the layout check.

### 15.9 Acceptance (replaces §12 items 1–11 and 13; items 12 and 14–17 stand)

1. On a 360 px phone a new player opens a scenario, taps Fork, sees two blank cards, writes one (name, fragment), plays it, lands on it, and taps Fork again. Under 60 seconds, no instruction.
2. Player B opens player A's written card and taps Dream: one blank card of B's appears. A's news says B dreamed from it.
3. Player A cannot write on, rename or discard B's blank card (403; no control in the UI).
4. A second browser sees new cards and blank cards within 5 seconds.
5. Ten players fork from the same scenario at once: twenty blank cards, no errors.
6. The ninth blank card is refused with the C6 message; after one discard the cut succeeds.
7. Wormhole: offered only on your own cards; the picker lists only your own other cards; the API rejects any other target.
8. Dead End is refused on a card that has anything leaving it; nobody can cut from a dead end; **Back to the last fork** and **Undo** work.
9. Deleting your card turns its path blank again; a card with anything leaving it cannot be deleted.
10. Player B cannot edit or delete A's card (403).
11. A card's colour, on the card and on the Map, is its incoming cut's; no word shows on a connection until hover or tap; every arrow points away from the centre except wormholes.
12. The Map draws no ring anywhere; distance from the centre equals depth; no overlap in `stress`.
13. Players panel: tapping a name lights exactly that player's cards; counts match.
14. Migrated older cards walk and display correctly.

### 15.10 Cutoff, rollback, deploy budget

- **Before migrating, take a database snapshot or branch** and write down, in your report, the exact step that restores it. `mdst1050` holds no student cards before class, so a restore loses nothing.
- Known-good release: `main` at `2c16471`. v3 must be deployed and re-verified by **09:00 ET Tuesday**. If it is not, restore the snapshot, redeploy `2c16471`, and say so in the first line of your report.
- **Deploy budget: v3 reaches production in at most 3 deploys** (see F7). Build and test off `main`. Do not put QA writing in `mdst1050`.

## 16. Change v4 — the session editor, Board and Cards, Jootsy! today

Source: Neven's notes after playing v3 (Nov 10, 08:07 ET). His words are quoted where the wording matters. Class is at 12:30 pm ET; the timetable in §16.9 is part of the spec.

**The game in five sentences.** You open any card on the Board and choose what happens next. That opens a short editing session: the card you started from, then up to two transitions' worth of new cards, laid out left to right. Nothing in a session is visible to anyone else until you **Commit to the board**. The Board only ever shows committed cards. To keep going, open your latest card and start another session.

### 16.1 Data (additive only, so v3 code still runs against it)

- `cards.draft boolean NOT NULL DEFAULT false`; `paths.draft boolean NOT NULL DEFAULT false`. A draft row belongs to a session and is visible only to the player who made it.
- `paths.kind` already allows `jootsy`.
- Migration: set every `dead_end` card to `open`; tombstone every unwritten path (blank card) left over from v3; set `jootsy_enabled = true` and `jootsy_min_cards = 5` in every world.
- `GET /state` never returns another player's draft cards or draft paths. For non-instructors it also returns "Hidden" as the label of any path whose `to_card_id` is a hidden card, and hiding or unhiding a card stamps that path's `rev` (this closes F8).

### 16.2 Session rules (these replace C4, C5 and C6; C1–C3 and C7–C10 stand unless changed here)

- **S1. Anchor.** A session starts from any committed card: your own, another player's, or a scenario. The anchor is stage 1. It is read-only in the session.
- **S2. One session.** A player has at most one open session per world. Trying to start another returns `409` with the open session's anchor; the UI offers **Resume** or **Discard**.
- **S3. Transitions.** From the anchor, or from a written card in the session, the player chooses what happens next:
  - `fork` → two blank cells; `destiny` → one; `dream` → one;
  - `wormhole` → a link to one of the player's own committed cards. The source must be the player's own card (not a peer's anchor, not a scenario);
  - `jootsy` → a link to a committed, non-hidden card **by another player**. The source must be the player's own card. Allowed only if `jootsy_enabled` and the player has at least `jootsy_min_cards` committed cards (instructors exempt).
  One transition per card per session.
- **S4. Three stages.** *"You get three stages of cells to build, and then you have to Commit to the board."* A transition may start only from the anchor or from a session card whose parent is the anchor. A stage-3 card offers no transition until committed. The server refuses with `409`: "Commit to the board, then keep going."
- **S5. Writing.** A cell is written with a name (1–60), a fragment (1–600) and optional media. It autosaves as a draft card when the name and fragment are both present, and on every later edit (debounced about 2 s, and on blur). Drafts survive reload and a change of device.
- **S6. Change.** The transition leaving a card in the session can be changed:
  - Destiny ↔ Dream: the kind changes; the card and its content stay.
  - Destiny or Dream → Fork: the existing card stays on top; a new blank cell appears beneath it.
  - Fork → Destiny or Dream: the top cell stays; the second is removed.
  - anything → Wormhole or Jootsy!: its cells, and anything built beyond them, are removed and the picker opens.
  - Wormhole or Jootsy! → Fork, Destiny or Dream: the link is removed and blank cells appear.
  After a change the **Change** button reads **Undo** until the player's next action; Undo restores the previous transition and everything that was removed, content included. The client holds what was removed and re-creates it.
- **S7. Commit.** Allowed when the session has at least one new card or link and **no blank cell** (a Fork needs both of its cards written; to commit with one, Change it to a Destiny). One transaction makes every draft row committed and stamps `rev`. Events: `card_played` for each card; `card_cut` to the anchor's author if that is another player; `jootsy` to the author of each Jootsy! target.
- **S8. Discard** deletes every draft row of the session.
- **S9. After commit** a card's author may still edit its name, fragment and media, delete it while nothing leaves it (C8), and discard their own wormhole or Jootsy! links. Changing a committed transition is not in this version.
- **S10. Dead End is retired.** No button, no state. *"It should be implied that a card that goes nowhere is a dead end."*
- **S11. No blank cards on the Board, ever.** The blank-card cap (C6) and other players' blank cards are gone with them.

### 16.3 API

Reuse the v3 routes with draft semantics; add three.

| Method and path | Body | Does |
|---|---|---|
| `POST /cards/:id/cuts` | `{kind, to_card_id?}` | S1–S4. Creates draft paths (and for wormhole/jootsy a draft link). Starts the session if none is open. |
| `PUT /cards/:id/cut` | `{kind, to_card_id?}` | S6, on a draft transition only. |
| `POST /plays` | `{path_id, label, body, media_kind?, media_url?}` | S5. Creates the draft card on the player's own draft cell. |
| `PATCH /cards/:id` | as v3 | Autosave for drafts; edit for committed cards (S9). |
| `POST /session/commit` | | S7. |
| `DELETE /session` | | S8. |
| `GET /state` | | As §16.1. Include the caller's own drafts, flagged. |

`POST /cards/:id/dead-end` returns `410`.

### 16.4 Two views: Board and Cards

A toggle at the top of every screen: **Board · Cards**. Beside it: **Refresh**, **Me**, and the instructor gear. "Card view" as a name is retired.

**Board** (the map; *"I like that the map is automatically organized by the system. This is key."* Do not change the layout engine.)

- **Players panel docked on the left**, always visible on desktop (a drawer on narrow screens): two columns, name and **cards played**, most first. Tap a name to light that player's cards. When a player commits, their row lights up for about 3 seconds for everyone, on the next poll.
- Controls: **Fit**, **Find me**, **My Cards** (was "Mine"), one toggle for **Wormholes & Jootsies**. Remove the **Face-down** toggle.
- **Scenarios are circles.** Cards stay portrait rectangles in the colour of the transition that leads into them.
- **Wormholes and Jootsies are dotted lines** (keep), white and pink. A card with a Jootsy! leaving it **sparkles continuously** (a cheap twinkle; a few points of light, not a particle system).
- **Reading a card on the Board.** Double-click a card (single tap on touch): it enlarges over the Board, large enough to read: name, media, fragment, author. Under it, **its options as buttons: the names of the cards that leave it**, each in its transition's colour; wormholes and Jootsies as dotted buttons. Clicking an option walks to that card in the same overlay and recentres the Board behind it. **← Back** (the previous step of the walk) is always there, and **Close**. This overlay is the game's play mode; there is no separate Street View screen.
- In the overlay, to the right of the card: **What happens next?** with the transition buttons (§16.5). Choosing one opens the editor with this card as stage 1 and that transition in place. This works on a peer's card as well as your own.
- Hover (or tap) on a connection shows its word, as now.

**Cards** (your own work)

- A list of the cards you have played, grouped by thread, newest thread first. Selecting one shows it **one card at a time**, with previous and next along your own timeline, **Edit** (name, fragment, media) and **What happens next?**
- If you have an open session, Cards opens straight into it.

### 16.5 The editor (a session)

Desktop first. On narrow screens the same layout scrolls horizontally.

- **Three columns, left to right:** stage 1 (the anchor, read-only), stage 2, stage 3. A Fork shows its two cells **one above the other**, with an arrow to each. Each arrow is in its transition's colour with its icon; under the arrow, **Change** (S6).
- **Transition buttons sit to the right of the card you are editing**, each with its icon, always in this order, and **they never disappear** however many times each has been used. Unavailable ones are dimmed and say why on hover. Hovering (tap-and-hold on touch) shows exactly these lines:
  - **Fork** — Two paths forward
  - **Destiny** — One way forward
  - **Dream** — Anything can happen
  - **Wormhole** — Jump to previous card
  - **Jootsy!** — Jump into another timeline
  Dimmed reasons: Wormhole with no committed card of your own: "Play a card first." Jootsy! below the threshold: "{n} of 5 cards played." Any button on a stage-3 card: "Commit to the board, then keep going."
- The heading over the buttons is **"What happens next?"** It replaces "How does it cut?" everywhere.
- **A cell:** **Name** at the top, the fragment, **Add image · Paste a link**.
- **The name is the option.** As the player types a cell's name, the same text appears live as a button at the bottom of the previous card. This is how they learn that a card's name is what a reader clicks.
- **Wormhole:** a small dropdown of the cards the player has played. **Jootsy!:** a searchable dropdown of every committed card by other players, as "*name* — author", with the line "Find the card you want on the Board first."
- When a transition is chosen, the view slides so the new cell(s) are in view beside the card just written.
- **Commit to the board** (primary). Disabled, with the reason on hover, until S7 holds. **Discard session** (quiet, confirms).
- **On commit:** switch to the Board, centred on the new cards; they **illuminate briefly** (about 1.5 s) and **a short, pleasing sound** plays (synthesised with Web Audio, under one second, no audio file; a mute control in **Me**). Everyone else sees the player's row light up (§16.4).
- **A Jootsy! is an event.** When a poll brings in a new Jootsy! link, every player sees a toast: "🎆 Jootsy! {name} jumped into {author}'s timeline." The author's news says the same and links to the card.

### 16.6 Removed

The Dead End button; the Face-down toggle; blank cards and card backs anywhere outside the editor; the locked Jootsy! card; "How does it cut?"; the "Mine" label; the separate Card view screen (its reading role moves to the Board overlay, its writing role to the editor).

### 16.7 Tier 2 — polish, only after Tier 1 (§16.1–16.6) is deployed and Neven has said go

In this order; stop wherever time runs out.

1. **Arrowheads sit on their lines.** They currently drift off the curve (Designer screenshot). Compute each head from the curve's end tangent.
2. **Energy along the lines.** *"A little thing where the lines swell or glow a bit and move that glow forward, as if electricity is passing through."* One soft glow travelling each connection in its direction, slow. Low drain: no per-frame layout, 30 fps cap, paused when the tab is hidden, off under `prefers-reduced-motion`, and reduced to the connections on screen when there are more than 300.
3. **Refresh.** The button runs a sync, sweeps a scan line across the Board once, and says **"Board is synced!"**
4. Colour pass: every card and connection clearly in its transition's colour, in the editor, the overlay and the Board.

### 16.8 Acceptance

1. Desktop, new player: Board → double-click a scenario → Fork → editor shows the scenario, two stacked cells, arrows → write both → from one, Destiny → write it → no transition buttons work on that stage-3 card → Commit → Board centred on three lit cards, sound plays.
2. Until Commit, a second browser sees none of it. After Commit it sees all three within 5 s, and the first player's row lights up.
3. Typing a cell's name shows the same text as a button on the previous card as it is typed.
4. Change: Dream → Destiny keeps the card; Destiny → Fork adds a cell beneath; Fork → Destiny removes the second; → Wormhole opens the dropdown and removes the cells; **Undo** restores each, content included.
5. Commit is refused, with a reason, while any cell is blank.
6. Reload mid-session and log in on a second device: the session is there, intact. A second session cannot be started; Resume and Discard work.
7. From a peer's card on the Board: read it in the overlay, choose Dream, write, commit. The peer's news says so. Wormhole and Jootsy! are dimmed there.
8. Jootsy!: dimmed below five cards with the count; at five, the dropdown lists only other players' committed cards; after Commit the link is a dotted pink line, the source card sparkles, everyone sees the toast, the target's author has news.
9. Wormhole: lists only the player's own committed cards; dotted line on the Board.
10. Board overlay: options are the names of the next cards; walking forward and **Back** work across several steps, including through a wormhole and a Jootsy!.
11. No Dead End, no Face-down toggle, no blank card, no "How does it cut?" anywhere. "My Cards" and the left Players panel with counts are present. Scenarios are circles.
12. Hidden card: students see neither its fragment nor its name.
13. Transition buttons are all still present after each has been used several times.
14. v3 sandbox and `stress` content still reads and walks correctly.

### 16.9 Timetable, rollback, deploy budget (all ET)

- **By 10:30** — Tier 1 in production, verified by you against §16.8. Report immediately.
- **10:30–11:00** — Neven plays it. He is the only person who can judge it.
- **11:00 — go / no-go, his call.** No-go: republish the v3 deploy for `cd96e44` (code only; the schema change is additive), then delete draft rows and `jootsy` paths so v3 never meets them. Give the exact statements in your report.
- **After go** — Tier 2, last production deploy by **11:45**. **Nothing deploys after 12:00.**
- **Deploy budget:** at most 4 production deploys for all of v4. No QA writing in `mdst1050`.

## 17. Change v4.1 — the Designer's notes after playing v4

Source: Neven, Nov 10, 09:40 ET. No rule of the game changes. Build in the order A, B, C, D; one production deploy for A+B if B passes, otherwise A alone and B with C. **Last deploy 11:45 ET; nothing after 12:00.** Four deploys remain in the v4 budget of eight.

Neven will also bring **graphic design notes directly to you**. Take them directly when they change only how something looks. Anything that changes what a player can do, or a word a player reads, comes through this spec.

### 17.A Words, order and removals (first)

1. The field **"Name" is now "Choice"**, everywhere a player sees it (editor, Cards edit, validation messages: "Give this card a choice.").
2. The field **"Fragment" is now "Narrative Fragment"**.
3. **"Choices" section.** At the bottom of every card that has cards leaving it, in the editor and in the Board reader, a section headed **Choices** lists them as buttons. In the editor this is where the live text of the next card's Choice appears as it is typed (§16.5).
4. **Transition order, everywhere:** Destiny · Fork · Dream · Wormhole · Jootsy!
5. **Stage three shows no transitions at all.** No "What happens next?" heading, no dimmed buttons, no message. (This replaces the dimmed buttons and the "Commit to the board, then keep going" hover of §16.5. The server rule S4 and its `409` stay.)
6. **Commit to the board** is available as soon as the session has one written card or one link and no blank cell, including after a single stage. **When available the button is green and lit; when not, it is dull**, with the reason on hover.
7. In the Jootsy! picker the confirming button reads **"Jootsy it!"**
8. **Remove the wordmark card at the centre of the Board.** The centre is empty.
9. **"Find me" is now "My Latest"**: it centres the Board on the last card the player committed and selects it. With no cards yet it is dimmed: "Play a card first."
10. **Add Scenario** button beside Refresh, **instructor only**. It opens the existing new-scenario form (name, opening text). Students never see it.
11. **The Players panel collapses** to a narrow tab and reopens; its state is remembered on the device.
12. **Remove "Paste a link"** from the editor. Cards that already hold a link keep showing it.

### 17.B Joining and coming back (with A)

*"We need to ensure that student login is clear, easy, accessible, and not going to create all kinds of issues. They need to be able to access their previous sessions."* The mechanism (a name and a passcode they choose) stays. The screen changes so a typo cannot quietly create a second, empty player.

1. Two clear choices on the join screen: **"I'm new"** and **"I've played before"**.
   - *I'm new:* Name, Passcode, **Start**. If the name is taken: "That name is taken. Add an initial, or choose 'I've played before'."
   - *I've played before:* Name, Passcode, **Continue**. If no such name exists: "No player called '{name}' in this game. Check the spelling, or choose 'I'm new'." **This mode never creates a player.** Wrong passcode: "That passcode doesn't match. Ask your instructor to reset it."
   - The server takes a `mode` (`new` or `returning`) on `POST /join` and enforces both refusals.
2. Passcode help under the field: "At least 4 characters. Something you'll remember. You'll need it on Thursday." A **show** toggle on the passcode.
3. Names: trimmed, inner spaces collapsed, matched without regard to case (as now).
4. A device stays signed in (as now). **"Signed in as {name}"** is visible in the header at all times, with **Not you?** to sign out.
5. On return with an open session: a banner, "You have an unfinished session. **Resume**", on the Board and in Cards.
6. Accessibility: real `<label>`s, visible focus, Enter submits, errors announced (`aria-live`) and placed beside the field, `autocomplete="username"` and `new-password` / `current-password` so a password manager can save it, contrast at least 4.5:1, every control reachable by keyboard.
7. `jootsy.netlify.app/` (no world) goes to the class world `mdst1050`.
8. Instructor reset (existing) stays; after a reset show Neven the new passcode once, in large type, with **Copy**.

### 17.C Image and sound on a card (after A and B pass)

1. The editor's media row is **Add image · Add sound**. A card may have one of each.
2. New nullable column `cards.audio_url`. `POST /plays` and `PATCH /cards/:id` accept `audio_url`; `/state` returns it. Hidden cards mask it.
3. **Limits.** Image: as now, downscaled in the browser to 1600 px JPEG; reject over 1.5 MB after downscale. Sound: **MP3 or M4A, up to 2 MB** (about a minute); reject anything else with "Use an MP3 or M4A under 2 MB." Check type by content, not by file name. Per player: at most 60 uploads per world. Messages say the limit and what to do.
4. Storage as images are now. Served with the right `content-type`, `immutable` caching, and **HTTP Range support (206)**: Safari will not play audio without it.
5. Playback: a small play / pause control on the card in the editor, the Board reader and Cards. Never autoplay.
6. Acceptance: upload and play an MP3 and an M4A in Chrome and Safari; a 3 MB file and a WAV are refused with the message; the sound survives Commit and reload; a second player hears it.
7. If C is not solid by 11:30, ship without **Add sound** and say so. Do not ship a sound control that fails in Safari.

### 17.C2 A short video on a card — after sound passes, same gate

Designer (Neven, Nov 10, 10:22): *"a short 5 second video on their card… would be really nice."* It reuses the sound pipeline (upload, storage, Range), so build it only once §17.C's sound acceptance has passed.

1. The media row becomes **Add image · Add sound · Add video**. A card may have an image **or** a video, plus a sound.
2. New nullable column `cards.video_url`, handled exactly like `audio_url` (plays, edit, state, hidden masking).
3. **Limits: MP4 only, up to 4 MB.** Check by content (an `ftyp` box), not file name. Refusal message, verbatim: "Use an MP4 under 4 MB. About 5 seconds, exported at 720p, fits easily." Counts toward the 60 uploads per player.
4. Playback: `<video>` with `controls`, `playsinline`, `muted` by default, `loop`, `preload="metadata"`. Never autoplay on the Board; in the Board reader and the editor it starts on click.
5. Acceptance: a 5-second 720p H.264 MP4 uploads and plays in Chrome and Safari, survives Commit and reload, and a second player sees it; a 6 MB file and a `.mov` are refused with the message.
6. **Same gate as sound: if it is not solid in both browsers by 11:30, it does not ship today.** Sound must not be delayed for it.

### 17.D Light on the wires (replaces §16.7 items 1 and 2), and the Refresh scan

*"Sometimes the arrows are coming off the wires, so I think it is more useful to just have an animation on each wire that shows a swelled bit of light passing through the wire."*

1. **Remove arrowheads entirely.** Direction is shown by movement.
2. Each connection carries **one soft swell of light** travelling from the earlier card to the later one, in the connection's colour, slowly (about 3–4 s per crossing, staggered so they do not pulse in unison). Dotted wormhole and Jootsy! links carry it too.
3. **Low drain, as in §16.7:** no per-frame layout, capped at 30 fps, paused when the tab is hidden, static under `prefers-reduced-motion`, and limited to connections on screen when there are more than 300. On the `stress` world the Board must still pan smoothly; if it does not, halve the number of animated connections until it does, and report the number.
4. **Refresh:** runs a sync, sweeps one scan line across the Board (under a second), then says **"Board is synced!"**

### 17.E Acceptance for A and B

1. No player-facing "Name" or bare "Fragment" remains; "Choice", "Narrative Fragment" and a "Choices" section are present in the editor, the reader and Cards.
2. Transition order is Destiny, Fork, Dream, Wormhole, Jootsy! in every place it appears.
3. A stage-three card shows no transition controls of any kind.
4. Commit is dull with a blank cell, green after one written card, and commits a one-stage session.
5. No wordmark at the centre of the Board; "My Latest" centres the last committed card; Players panel collapses and remembers; "Add Scenario" visible to the instructor only; no "Paste a link".
6. "I've played before" with a misspelt name creates nobody and says so; "I'm new" with a taken name is refused; a returning player on a second device finds their cards and their open session.
7. The join screen is fully usable by keyboard alone, and a screen reader announces each error.
8. §16.8 items 1–14 still pass.
