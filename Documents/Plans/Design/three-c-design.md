# 3C design: character, camera and controls

**Implementation update, 24 October 2026:** baseline movement, four traversal additions, camera, semantic input, an authored circuit and prepared sprite mapping are implemented in the [character lab](../../Current/character-lab.md). See actual paths/owners in [modules](../../Current/modules.md). 66 tests pass; 15 rehearsals cover 26/26 events. This document retains the broader product contract; the editor, endless generation, streaming qualification and production animation blending remain pending.

Status: proposed design, **22 October 2026**. Product authority: [game requirements](../Requirements/game-requirements.md). This is our implementation proposal, not a claim about Vector's internal code. Evidence is the official site/store description and reviewed promotional images indexed in the [asset catalogue](../Research/vector-action-assets.md).

## Reference observations and design choices

The official [Vector site](https://vector.game/zh-Hans/) describes running, vaulting and sliding. The publisher's [Steam page](https://store.steampowered.com/app/248970/Vector/) also describes climbing and timing challenges. Its screenshot gallery shows side-view silhouette poses, obstacle-relative action prompts and contrasting foreground routes. Individual images do not establish animation timing, precise controls, camera damping or the game's actual state machine. Steam screenshots may differ from the current browser edition.

Our baseline remains a proposed 2D forward-auto-run game, with manual action timing. No pursuer AI is required. Character physics, camera and semantic input share authoritative content/state, but only the simulator writes motion. Named reference tricks are potential presentation variants; the four added traversal types remain this project's requirements, not verified reference mechanics.

## Character

### Body and movement

- Use a foot-reference position and a capsule or equivalent swept 2D body. `rules.bodySize` and `slideBodySize` define standing/crouched extents; animation silhouettes never resize collision implicitly.
- Ground running accelerates toward `runSpeed` using `groundAcceleration`. Air control accelerates a below-target forward velocity using `airAcceleration`; it does not reset a faster grapple/pad release to `runSpeed`. Apply the shared horizontal/fall safety caps explicitly.
- Jump is a grounded/coyote/buffered impulse. Rising/falling is derived from vertical velocity; landing is a contact/transition event. Slide changes body shape once and uses the configured duration. If standing is obstructed, use CrouchHold until a clearance query succeeds.
- Vault is a short collision-checked traversal over a tagged low surface, with a known landing target. It is not permission to teleport through an arbitrary collider. Kinematic vault and normal movement cannot integrate concurrently.
- Dash grapple pulls toward one validated anchor; swing uses a rope constraint; zipline follows a path coordinate; a pad requests one airborne impulse. See [state machine](character-state-machine.md) and [scene implementation](parkour-scene-implementation.md).

### Animation and feedback

| Logical event/state | Presentation | Gameplay ownership |
|---|---|---|
| Run | Grounded stride and foot placement | Physics speed determines cadence; clip does not move the body. |
| Jump/rise/fall | Takeoff, airborne pose and descending anticipation | Velocity/contact determine phase. |
| Slide/CrouchHold | Low silhouette with readable head clearance | The motion state selects the collision shape. |
| Vault | Support-hand/body-clearance pose | Shared traversal solver owns the path and completion. |
| Land | One-shot compression/recovery; optional roll variant | Contact normal and pre-impact speed select feedback; no second movement controller. |
| Grapple/zipline | Anticipation, attached pose, release cue | One attachment union owns the target and lifetime. |
| Pad | Contact flash and launch pose | One trigger event, not a separate repeating pad-motion state. |
| Fail/finish | Clear outcome and retry/continue UI | Session state stops new gameplay input and emits one result. |

Separate locomotion, animation phase and cosmetic trick IDs. A named flip or vault skin may decorate the same physical jump/vault; do not create independent physics for every reference pose. The later [character extraction](../Research/vector-character-frames.md) provides local PNG pose sequences from original skeletal data, rather than pre-existing raster sheets; a runtime redistribution licence is still unestablished. Create original placeholder art first; bind future clips through one presentation catalogue rather than duplicate state booleans.

## Camera

### Framing and prediction

Choose an orthographic-equivalent 2D follow camera. All tuning belongs to `rules.camera` in the [content schema](Schemas/content-package.schema.json); numeric example values are untested starting points.

Let `W` be the visible world width derived from view height and viewport aspect, `u` the configured `targetScreenX`, `x` the interpolated player foot position and `vx` its velocity:

```text
forwardOffset = clamp(max(vx, 0) * lookAheadSeconds, minLookAhead, maxLookAhead)
desiredCentreX = x + (0.5 - u) * W + forwardOffset
alpha = 1 - exp(-renderDeltaSeconds / smoothingSeconds)
cameraNext = cameraCurrent + alpha * (desiredCentre - cameraCurrent)
```

Apply dead-zone and catch-up limits consistently; they do not change player state. Include a clamped vertical prediction and the currently attached anchor/cable exit in the focus set. Zoom out within min/base/max view height when the player and active attachment need more space; never change zoom on every decorative trick. Use a separate smoothing time for view height.

### Readability and boundaries

- Measure `visibleAhead / max(forwardSpeed, epsilon)` against `reactionBudgetSeconds`; that budget includes recognition/decision time. Actual route validation additionally includes action-commit and landing requirements. Camera visibility is not a reachability proof.
- Framing priority is player plus active attachment, actionable route/landing, content bounds, then cosmetic smoothing. If a contract cannot fit within the maximum camera view, fix the route/contract; do not rely on hidden zoom or instant camera cuts.
- Finite bounds derive from level content. Use background gutters for a level smaller than the viewport instead of cropping the player. Endless bounds derive from the generated active span, not an ever-changing global right edge. Pre-generation must cover the camera view and safety margin before it becomes visible.
- Avoid following every jump vertically. Use a dead zone, bounded vertical prediction and a catch-up speed sufficient for the permitted motion. Swing may move briefly backward; do not force a monotonic camera position that loses the player.
- Snap only at explicit load/retry/editor-playtest handoff or a controlled origin rebase. Rebase player, camera, attachments and cached transforms together, preserving screen continuity.
- Reduced motion suppresses optional shake/rapid cosmetic effects. Pause freezes gameplay; focus loss does not create a large camera catch-up on resume. UI stays inside screen safe areas and cannot hide the upcoming landing.

The editor viewport has its own pan/zoom state; entering playtest saves that viewport, then uses the same production camera profile. Ending playtest restores editor navigation without writing player coordinates back into the draft.

## Controls

Bindings remain proposals, authored once in `rules.bindings`:

| Intent | Proposed keyboard | Trigger semantics |
|---|---|---|
| Jump / zipline jump-off | Space or Up | Press edge; jump buffering only in valid contexts. |
| Slide | S or Down | Press edge, timed state; obstructed recovery remains crouched. |
| Dash grapple | E | One press, acquire the previewed compatible anchor. |
| Swing grapple | Hold Q | Press acquires once; release detaches; held input does not repeatedly re-acquire. |
| Zipline attach/detach | F | Press edge in capture/attached context. |
| Pause / retry | Escape / R | Session command, independent of locomotion. |

Pipeline: device events -> context/key mapping -> timestamped semantic actions -> fixed-tick bounded buffer -> action requests -> one motion arbiter. Ignore operating-system key-repeat for press actions. Future touch/gamepad inputs must produce the same commands rather than implement separate movement logic.

Target acquisition uses the shared scene query: compatible profile kind, enabled ability, allowed state, range/cone, visibility and cooldown. Sort valid candidates by angle, distance, then stable qualified ID. The selected target cue and command carry the same ID; revalidate at execution and reject visibly if it became invalid, rather than silently switching to another target.

Conflicting requests have a single documented resolution in the [state machine](character-state-machine.md); UI panels/editor inputs suppress gameplay commands. Loss of focus pauses, clears buffered/held input and requires explicit resume. A pre-pause held swing releases before the first resumed motion tick unless a fresh valid hold is received.

## Data ownership and checks

`rules` owns body, timing, acceleration, sweep tolerances, input bindings, vault and camera tuning. Typed traversal profiles own acquisition/travel/release values; module entities own scene geometry. Runtime state owns actual velocity, timers and attachments; camera/animation consume read-only snapshots. The new schema revision is a design contract, not a gameplay implementation.

Acceptance: test several aspect ratios, maximum permitted speed, pad launch, backward swing, small finite bounds, endless seams and origin rebase; no clipping of the player/active rope or unreadable next action. Test held/repeated/conflicting inputs, failure/finish/focus loss, frame-rate variation and an editor playtest round-trip. Tune values only from measured playtests and record changes in PROCESS.

## Scene synchronization revision, 24 October 2026

The shared contract is now 1.2.0, adding scene markers, context-input lifetime, grip offset and normalized vault trajectory. The previous 1.1.0 pair is archived locally. Space queues a vault in a matching approach and executes after start-plane validation, superseding the earlier automatic-vault assumption; normal jumping remains outside a matching context. Actual owners, reference evidence, smoothed assets and checks are in [current scene synchronization](../../Current/scene-action-synchronization.md).
