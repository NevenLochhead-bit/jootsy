# Jootsy! — Build Plan (v2)

*Architect to Neven. Mon Nov 9, 2026, 10 pm. One page. Revised after your answers: open network, cards, the Jootsy! distinction, your own scenarios.*

## The design in six lines

1. **You play cards.** Your hand sits at the bottom of the screen: Fork, Destiny, Dream, Wormhole, Dead End, and Jootsy! face-down. You pick one, write your fragment on it, and play it onto the table.
2. **Every card names its paths when it is played.** A Fork names two or more; a Destiny one; a Dream one or more; a Dead End none. Each path lies on the table as a **face-down card** with its name on it.
3. **Anyone may play on any face-down card.** That is the open network. No teams, and no path belongs to the person who dealt it. You are told when someone plays on yours.
4. **A face-up card belongs to its author.** Nobody else can change it or add to it.
5. **The world is a tree with shortcuts.** Every card is played from exactly one earlier card, so the map draws itself: scenarios at the centre, one ring per step outward, the two perimeters as rings. Nothing is ever dragged.
6. **Map and Street View are one world.** The card page is where you read, walk and play. After you play, you are standing on your new card.

## The Jootsy! distinction

Before the perimeter you can only play on **face-down** cards: every move adds new story and the world only splits. A timeline is all the cards one player has played.

**Jootsy! is the only way into a face-up card that someone else wrote.** The Jootsy! card you play shows their fragment (live, credited, never copied), offers a door into their timeline, and carries paths of your own. A reader on your thread reaches a junction: stay with you, or cross into theirs. The world, for the first time, joins.

A Wormhole is the same move into a face-up card of your own.

## Other calls I've made (say so if you disagree)

- **Card type** is fixed when the card is played, as on the old board. This replaces my earlier version, where a card took its colour later.
- **"7 Forks" vs distance.** One far-out face-down card could carry a new player to ring 6 in a single play, so Jootsy! turns over at ring 7 **and** 7 cards played. End of Game at ring 11. All adjustable.
- **A soft hold while writing.** Opening a face-down card to write holds it for you ("Sam is writing…") so two people don't write the same path.
- **Card backs are identity.** Each player's back is generated from their name; a face-down card shows who dealt it.
- **Fragments are capped** at 600 characters; path names at 60.

## What ships

| Tuesday 12:30 | Thursday | After |
|---|---|---|
| Join with a name and a passcode you set | The Jootsy! card, turning over at the perimeter | New world for a new cohort, from a form |
| Scenarios you create and edit yourself | The Jootsy! event: celebration, notice to the jumped-into, live ticker for Zoom | Digest of what happened while you were away |
| The hand: Fork, Destiny, Dream, Wormhole, Dead End | Backwriting: insert a card into your own timeline | |
| Face-down paths anyone can play on; a notice when yours is played | Sound and video uploads | |
| Street View, on phones too | Each student's branch as an export, for the game review | |
| The Overview map with both perimeters drawn | Instructor export | |
| Edit and delete your own; instructor can hide a card | | |
| Images and pasted links (YouTube, Vimeo, SoundCloud) | | |

## What I need from you

1. **Hand `JOOTSY_TUESDAY_SPEC.md` (v2) to Codex tonight** and send me the URL it returns. It will be a new repo and Netlify site, separate from the 1050 course site; link to it from there. The game needs a database, which Netlify alone doesn't give; Codex will tell you if you have to click anything to keep it.
2. **Scenarios.** Seven starters are seeded so the game is playable (Window, Alarm, Stairwell, Screen, Bus, Kitchen, Field). Scenario creation is in the first slice, so you can write your own as soon as there is a URL.
3. **Scenarios are created by you only** (decided Nov 9).

## Checkpoints (ET)

- **Tonight:** spec to Codex. Three slices; the first (join, scenarios, cards, the hand) is a playable game without a map.
- **Tue 9:00 am:** I play the deployed build as three students and against a 300-card world.
- **Tue 10:00 am: go / no-go.** If the first two slices are not solid, I tell you then and you run the Miro board.
- **Tue 11:30 am:** two-minute walkthrough in your hands.

The risk is the hours, not the design: about 14 from now, most of them overnight, and I only see the build when a URL comes back.
