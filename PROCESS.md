# Development process

Motion / Run began as a small browser parkour game inspired by Vector. The goal is a complete input → response → feedback loop with finite routes, reusable traversal modules and an editor. [Earlier development notes](Documents/History/development-notes-2026-10.md) retain the detailed implementation history.

| Decision | Reason and resulting behavior |
|---|---|
| Native JavaScript and Canvas; no build step | Run the same source locally and on GitHub Pages. |
| Canonical JSON, shared schema and one 60 Hz simulator | Prevent editor/runtime drift and keep input recordings reproducible. |
| Pre-matched scene recipes and directed cameras | Confirm input before alignment; play timely, late or missed outcomes without chasing animated root jitter. |
| Foot/grip calibration and pose-matched run entry | Keep the sprite aligned with collision and authored contact points. |
| Module references for expanded districts | Compose longer courses without duplicating obstacle geometry. |
| Browser-local progress and audio preferences | Keep static hosting simple; shared scores and endless generation remain planned. |

## Player trial and response — 1 November 2026

The author relayed feedback from players: a pause after climbing high geometry, too few combinations, a sparse city background, distant/invisible swing affordances, separate rope/cable keys and missing audio. This is a reported external trial; Codex did not observe the players directly and no identities or recordings were collected.

- Removed the artificial landing recovery after climb/mantle completion. The swept traversal now hands off immediately to pose-matched running; ledge hang remains a deliberate, separately controlled state.
- Added six connected district courses, increasing campaign content to twelve routes plus three training routes. The editor and game reference the same modules.
- Added deterministic city layers, windows, rooftop structures, cranes, clouds and three palettes; decoration has no collision authority.
- Lowered the standard swing anchor from 12 to 9.5 m and the chain anchor from 10 to 8.5 m. Idle ropes show the interaction before capture.
- Unified swing and cable on Q and one touch button. A press resolves the eligible context; release keeps the original action identity.
- Bundled Hyperton by Sudocolon and seven Kenney effects. Added gesture-unlocked music, event-driven effects, separate toggles and volume. Pause/hidden tabs stop sound; missing files do not block play.
- Simplified public documentation and moved page/style entry points into dedicated directories. The runtime schema now belongs to content.

Codex assisted with diagnosis, implementation, online audio research, English/Chinese documentation and automated/browser verification. We retained the player's shared-key and persistent-rope proposals. We revised the initial approach of treating climbing as a landing: grounded traversal exits now have a distinct event. Sound observes events instead of being added to the simulation. Longer routes reuse modules rather than copying their geometry.

Validation: **177 automated tests**, **30 recorded scenarios** (18 lab, 12 campaign), all required lab events, and actual browser checks for menus, all campaign loads, held ledge/mantle, audio decoding/playback and portrait layout. Recordings were refreshed after swing geometry changed; assertions were preserved. See the [current update](Documents/Current/player-feedback-update.md). A follow-up player trial of these changes and subjective music/mix approval are pending; automated checks are not a substitute for them.
