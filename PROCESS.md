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

## Follow-up trial response — 1 November 2026

The author relayed a second player report: music restarted between screens, the track lacked speed, failures interrupted play, sliding into a high block could leave the runner stuck, and high-edge capture required another input. The screenshot supplied with the report informed the blocked-wall reproduction; this is reported feedback, not a newly observed trial.

- Moved audio ownership into a persistent same-origin screen host. Menus, gameplay, pause and quick retry retain the same looping music source; explicit mute remains available. Replaced Hyperton with the original CC0 Racing Game Title by MintoDog (140 BPM), retaining the credited Kenney effects.
- Added a 0.18-second automatic retry of the failed section without a failure overlay. A short forward collision sweep detects blocked approaches despite collision-skin micro-movement and fails them after 0.28 seconds.
- Revised the previous separately controlled ledge hang: one deliberate jump can catch an eligible high edge, settle for 0.10 seconds and mantle automatically. A low climb now progresses continuously over 0.42 seconds and returns directly to running.

Codex assisted with implementation, online music sourcing, documentation and verification. We accepted the automatic high-climb proposal and retained manual pause and completed-run menus. We rejected elapsed-position restoration as a substitute for continuous music: one persistent source preserves actual playback through navigation. Geometry and retry timings remain content-owned; the diagnostic lab retains failure snapshots.

Validation: **183 automated tests**, **30 production recordings** with all required lab events, and real browser checks of one music source across navigation/pause/retry/Back, one-tap keyboard and touch climbing, stuck-slide recovery without an overlay, editor access and explicit mute. Campaign recordings were regenerated through the actual simulator. No new human trial is claimed; perceived rhythm and the new mix still await player feedback. See [continuous play](Documents/Current/continuous-play.md).
