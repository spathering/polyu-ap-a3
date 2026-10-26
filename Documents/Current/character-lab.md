# Character 3C and looping test course

Current artwork, **26 October 2026**: [19 reference-derived atlases and three generated sheets](animation-assets.md) are bundled for local and public play. Earlier local-only/ignored-art descriptions and counts below describe prior increments.


Current motion revision: **`motion-run-07-directed` / `lab-06-directed`**. See [scene choreography](scene-choreography.md) for pre-input binding, timely/late/missed outcomes, directed camera and shared preset editing. Current totals: **153 tests, 24 recordings, 30/30 lab events; 852 local poses / 19 bundled pages plus three generated sheets**. Earlier increment counts below are historical.


Implemented **24 October 2026**. This is the current playable **laboratory prototype**, derived from the [3C](../Plans/Design/three-c-design.md), [state-machine](../Plans/Design/character-state-machine.md) and [scene](../Plans/Design/parkour-scene-implementation.md) designs. The final finite/endless game flow remains pending; the separate [Level Studio](level-editor.md) now provides finite/prefab authoring.

## Run and controls

From the repository root, use Node.js 20 or newer:

```sh
npm run dev
```

Open `http://127.0.0.1:4173/lab.html`. No package installation, build step, external account or game service is needed. Static files also resolve under the development server's `/polyu-ap-a3/` prefix. Stop the server with Ctrl+C. Opening `index.html` directly as a file is unsupported because content loads through HTTP.

| Intent | Control | Behaviour |
|---|---|---|
| Forward run | Automatic | Accelerates toward the data-owned run speed. |
| Jump / cable jump-off | Space / Up | Press edge; grounded/coyote eligibility, bounded jump buffering. |
| Slide | S / Down | Timed low body; CrouchHold if standing is obstructed. |
| Context vault | Space / Up in its marked approach | Queue input, keep running, align to the start plane, then follow the swept vault route and contact phase. |
| Dash grapple | E | Acquire the same highlighted target ID; sweep toward it and release at arrival/block. |
| Swing grapple | Hold Q; release Q | Acquire once; constrain only when taut; preserve legal release velocity. |
| Cable capture / detach | F | Capture nearby highlighted cable / detach without a jump boost. |
| Jump pad | Eligible top-face foot contact | One replace/add launch request; separation/rearm prevents repeated firing. |
| Pause / resume | Escape or button | Freezes ticks, timers and camera; focus loss clears input and requires explicit resume. |
| Retry | R or button | Lab-only reset to the current station; clears attachment and timers. |

On-screen buttons produce the same semantic actions. Q is a hold button. OS repeats and duplicate keyboard aliases do not retrigger an action. Text fields suppress gameplay keys.

## Character, camera and motion ownership

- `content/parkour.json` owns normal movement, body sizes, timing, bindings, camera parameters, traversal profiles and the authored course module. Its schema is the shared 1.3.0 contract; shape and reference checks run before a snapshot is frozen.
- Positions are foot-referenced metres with +Y up. The 60 Hz simulator owns position, velocity, one locomotion state, one pending scene intent and one attachment union. A swept axis-aligned body is the initial capsule-equivalent approximation. Thin walls, one-way support and low-body recovery share the same query module.
- Implemented locomotion owners: Run, Slide, CrouchHold, Airborne, Vault, DashGrapple, SwingGrapple and Zipline. Rising/falling, landing and pad launch are derived phases/events. Pause, failure and retry are session operations. The broader menu/editor/results session graph remains planned.
- The camera consumes snapshots, uses exponential following, dead zones, velocity prediction, bounded zoom and backward following. Active swing framing anticipates the lowest point from rope length, rather than cropping the player when the arc descends. Visibility guards adjust presentation only. Cable focus includes local travel and a bounded forward exit preview, not the entire remote path at once.
- The loop gate and initial spawn are derived from the finite layout's socket references. `content/lab-course.json` owns only test stations, lab checkpoints, hints, coverage IDs, frame-loop bounds and recorded action rehearsals; it does not duplicate movement values or finish coordinates.
- Default **Processed sprites** uses the existing extracted reference frames for baseline locomotion and generated sheets for pad, cable and swing. The presentation selector reads committed state/events; offsets never change physics. A procedural rig is selectable and is the missing-image fallback. Offline reference-pose interpolation is implemented; sound and full production transition blending remain pending.

Initial lab tuning retains most design-fixture values. Actual runtime changes are in `content/parkour.json`: the swing targeting cone/range and overhead anchor/landing were adjusted through rehearsal, and camera maximum view height was increased to accommodate attachment framing. The old design fixture is illustrative and is not read by the game.

## Processed animation and scene alignment

Default **Processed sprites** now uses 60-Hz local skeletal-resampled reference segments, calibrated scale/root anchors, stable generated hanging poses, authoritative grip placement and interpolated presentation snapshots. Slide has entry/loop/exit phases. Reference pages remain ignored local research; the three generated sheets are versioned. Run `npm run prepare:reference` to copy the eleven prepared reference pages, or use the explicit rig fallback without that archive.

Eleven scene action markers bind early input to a referenced entity and spatial window. An expiring request waits while running, then commits after start-plane/target/clearance validation. Pad launches use centre-foot contact. The HUD and optional detector overlays show the process. See [scene action synchronization](scene-action-synchronization.md), [reference findings](../Plans/Research/vector-runtime-interaction.md) and [asset catalogue](../../assets/character/README.md) for owners, algorithms and limits.

## Nine-station test matrix

| Station | Tests | Recorded rehearsal |
|---|---|---|
| 01 Jump & landing | Run, takeoff, rise/fall, landing; gap also permits failure, coyote and buffer experiments | `jump`; `failure`; boundary cases in tests |
| 02 Low clearance | Slide timer expires inside a long tunnel, CrouchHold, clear standing recovery | `slide` |
| 03 Context vault | Queued Space, start alignment, tagged obstacle, synchronized swept route/contact and supported exit | `vault` |
| 04 Dash grapple | Target preview/identity, acquisition, high-speed sweep and arrival exit | `dash` |
| 05 Swing & release | Jump, valid overhead hold, slack/taut dynamics, forward release and landing | `swing` |
| 06 Cable traversal | Capture, segment/corner travel, F detach, Space jump-off and endpoint release | `cable-end`, `cable-detach`, `cable-jump` |
| 07 Jump-pad impulse | One-shot launch, airborne arc and raised landing | `pad` |
| 08 Linked traversal | Pad → swing → release → cable; optional dash branch | `chain` |
| 09 Collision & recovery | Occluded anchor rejection, thin wall jump, one-way support, pause/retry and return gate | `recovery`; `session`; collision regressions |

The gate automatically returns the player to the level spawn, releases transient state and snaps the camera through an explicit reset. Lap totals and action coverage remain. This is an authored repeat circuit, **not** procedural endless generation, streaming or a seamless origin rebase.

Click a station for a safe isolated start. **Watch rehearsal** replays versioned semantic inputs through the same simulator; any live action takes over. Full-circuit rehearsal completes one lap, then pauses. Other choices demonstrate cable exits or failure. Coverage is actual simulation-event coverage, including scripted input; it is not evidence of an unassisted user trial.

## Diagnostics and verification

The UI shows current state, velocity, position, tick, attachment, target eligibility, a transition log and 26 action/session checks. Collider/velocity/rope overlays are optional. Tuning controls create and validate a fresh content snapshot, reset coverage and allow JSON export; they are not a geometry/level editor. Tuning changes invalidate the stored rehearsal evidence and should be requalified.

```sh
npm run check
npm test
npm run rehearse
```

The **102-test** automated suite covers the authored routes plus jump edges/buffering/coyote, low-clearance recovery, high-speed thin-wall collision, event priority, one-way platforms, stale targets, one motion owner, pause/hold cleanup, input aliases/queue bounds, immutable content and camera behaviour. Fifteen deterministic rehearsals cover all 26 required events, including one complete loop and an early swing cancellation. Evidence and current limits are recorded in [the change log](../History/Changelog/2026-10.md).

The real simulator, sprites and renderer were checked offscreen. A later headless Edge CDP session verified the editor and its production-runtime vault playtest, with zero browser exceptions across twelve scenarios; see [editor verification](level-editor.md). The browser host tool initially failed, then direct local CDP provided the alternative. Human input feel, target-browser compatibility, the required other-person trial and seeded endless generation remain pending.

The nine stations now compose small action definitions with shared terrain: fifteen visible library modules and one course-terrain definition, with 39 local entities in the package. The obstacle positions and 11 detector planes remain unchanged; all 15 rehearsals still pass. Animation presentation now keeps discrete state/size behind the interpolated tick boundary, ignores future events and eases bounded pelvis/rotation offsets over the catalogue-owned 0.10 s transition window. Contact-locked actions bypass this correction. One opaque sprite is drawn, avoiding ghost silhouettes; generated eight-pose actions remain provisional.

## Small-module and 3C update

[Micro modules and terrain](micro-modules-and-terrain.md) add deliberate low-platform climb, shared automatic block detectors, late next-action queuing, stable captured targets, actual vault velocity, filtered camera prediction/standing focus and landmark-matched return to running. Original lab cues and 15 witnesses remain valid; climb is exercised in editor previews and integration tests. The reference subset now contains 516 poses on 12 pages.

The original loop now opens at `lab.html`; root opens the main menu. Finite challenges share this controller and add a completion state. See [game flow](game-flow.md) and [latest 3C](reference-driven-3c.md).

The original nine-station loop and 26-event baseline remain unchanged. New ledge/mantle, wall rebound and roll are covered by six authored course recordings and isolated editor prefab tests. `npm run rehearse` now runs 21 cases in total. [New courses and test scope](campaign-and-scene-actions.md).

The complete lab is now under **Game editor → Motion Lab** (`studio.html` → `lab.html`). Its station navigation, rehearsals, tuning, detectors and telemetry remain intact. The brand returns to the editor workspace. Players use the separate mode/route/game screens described in [game flow](game-flow.md).
