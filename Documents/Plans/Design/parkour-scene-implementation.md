# Parkour actions and scene implementation

**Implementation update, 24 October 2026:** baseline movement, four traversal additions, camera, semantic input, an authored circuit and prepared sprite mapping are implemented in the [character lab](../../Current/character-lab.md). See actual paths/owners in [modules](../../Current/modules.md). 66 tests pass; 15 rehearsals cover 26/26 events. This document retains the broader product contract; the editor, endless generation, streaming qualification and production animation blending remain pending.

Status: broader design proposal; baseline recipes implemented in the character lab. This document owns action-to-geometry recipes; [3C](three-c-design.md) owns feel/framing/input intent and the [state machine](character-state-machine.md) owns transitions. Shared fields are defined once in the [content schema](Schemas/content-package.schema.json).

## Evidence map

Image IDs refer to the [reference catalogue](../Research/vector-action-assets.md). These are reviewed promotional stills, not measured motion sequences. A crane hook in a picture does not prove a grapple mechanic. The later [character-frame archive](../Research/vector-character-frames.md) supplies original pose sequences and action intervals for silhouette/phase study; it does not replace our solver or establish the four added mechanics.

| Action/family | Reference evidence | Proposed scene representation | Scope |
|---|---|---|---|
| Run and ground recovery | VEC-005, 015, 017 | Existing `surface` entities and support contacts | Required basic movement. |
| Jump / airborne / land | VEC-001, 002, 007, 016 | Surface takeoff, gap and safe landing region | Required; pose names do not change the solver. |
| Slide / low clearance | Official site description; no isolated slide image in this collection | A low ceiling built from surfaces; crouched body clearance | Required; image evidence gap remains explicit. |
| Low-obstacle vault | VEC-009 and named cards VEC-011, 013, 014 | `surface.vaultable` plus clear approach/top/exit | Required basic context vault; specific fancy variants optional. |
| Wall/ledge contact or climb | VEC-006, 008; exact phase uncertain | Current wall surfaces; an optional future ledge/mantle contract | Reference analysis only, not a new mandatory wall-run/climb feature. |
| Named flips and vault poses | VEC-001, 002, 011, 013, 014 | Original presentation variants linked to existing jump/vault phases | No copied sprites; no separate physical state per trick name. |
| Dash grapple | No verified reference screenshot | Existing `anchor` referencing a dash profile | Author-required addition. |
| Swing grapple | No verified reference screenshot | Existing `anchor` referencing a swing profile | Author-required addition. |
| Zipline | No verified reference screenshot | Existing `zipline` points and profile | Author-required addition. |
| Jump pad | No verified reference screenshot | Existing `jumpPad` trigger and profile | Author-required addition. |

## Shared collision and query kernel

Use one fixed-step kinematic body/query implementation for game, editor previews and route rehearsal. Initial scene geometry is axis-aligned rectangles and cable polylines; the schema does not support rotated/scaled module instances or arbitrary sloped solids.

1. Construct body bounds from foot position and the authoritative standing/crouched dimensions. Use one skin/probe policy from `rules`, not separate renderer/editor tolerances.
2. Sweep against nearby solid geometry, choose earliest time of impact, move to the last legal position and resolve permitted remaining motion under the active solver. Broad-phase indexes are derived caches.
3. A one-way surface supports only a descending foot crossing from the allowed side; side/upward passage is not a grounded contact. A small support probe must not bridge a real gap or pull a rising body down.
4. Query full standing volume before expanding from crouch. Starting an action cannot shrink or teleport the body through unrelated geometry.
5. Sweep hazardous/trigger regions as well as solids so fast dash/cable travel does not tunnel. Sort same-time contacts by the state machine's terminal/contact priority.

Animation root motion, sprite bounds and image silhouettes never form a second collision map. Decorative props can differ visually but cannot imply a safe platform where no gameplay surface exists.

## Implementation recipes

### Ground running and jump

Move toward configured forward speed with bounded ground acceleration. For airborne motion, preserve higher legal horizontal momentum while only accelerating a slower forward velocity; apply shared safety caps. Jump checks support/coyote/buffer eligibility, consumes one edge and sets vertical velocity once. Cache pre-impact velocity for landing feedback.

The familiar ballistic formula `y(t) = y0 + vy0*t - gravity*t*t/2` helps explain a simple jump, but it is not a separately maintained reachability/preview solver. Production simulation owns arcs whenever acceleration, collision, attachments or launch policies matter. Landing requires an upward support normal and a descending crossing, not proximity to a platform.

### Slide and crouched recovery

Use a low-ceiling module with adequate approach and exit space. A slide press switches to crouched dimensions only if that volume is legal, starts one duration and continues swept ground travel. At timeout, stand if clear, otherwise CrouchHold. Leaving support enters airborne motion with a clearance-safe posture until full height fits. Repeated key events do not restart the slide timer indefinitely.

### Vault

Find the nearest tagged low surface in the approach region. Check configured height, width and acquisition distance, a clear support/top corridor and a legal exit/landing. Derive a traversal path from that geometry and body clearance. Advance over configured duration with sweeps along the path; never just hide collisions while a clip plays. A blocked path rejects acquisition or interrupts at the last legal position. Exit with configured forward speed and the correct supported/airborne state.

Fancy reference vault names may select original pose variations only after a valid base vault exists. Wall climbing/ledge hanging would need separately designed acquisition, support IDs, duration/release and route contracts; a wall-contact screenshot is insufficient to add them silently.

Optional ledge-catch/mantle design: derive a candidate from a wall surface's top corner, confirm approach/hand reach and clear head/body/top-standing volumes, then store one qualified surface reference. A future Hang owner would hold an exterior legal pose; climb intent would enter one swept Mantle path, while release loses the reference and enters Airborne. Acquiring a distant corner or resolving penetration by teleport is invalid. This extension is not part of the active schema/state baseline: add explicit guards, data and tests before implementation, rather than infer a wall-run solver from a static contact image.

### Dash grapple

Use an anchor with a `dashGrapple` profile, a readable cue, a clear swept corridor and a safe arrival/continuation area. Acquire the previewed qualified ID, recheck visibility/cone/range/state/cooldown, then pin its module. Travel toward the anchor at profile speed with full body and trigger sweeps. Arrival radius is a termination condition, not permission to snap through a wall. On arrival/block/invalid target, clear the attachment and return legal exit velocity/state. Only a successful acquisition spends cooldown.

### Swing grapple

Place a swing-compatible anchor above an open arc with a visible release landing. Keep the module pinned. Initialise rope length without moving the body; a too-far target fails. Integrate gravity, then constrain only when the tether is taut. Remove outward radial velocity while retaining tangent motion; use swept correction and an explicit profile speed cap. Do not add a release impulse merely to make a pose look stronger. Slack, blocked rope and failed corrections have defined diagnostics/release behaviour. Initial scope has no wrapping/reeling.

The camera must frame player/anchor and the intended release area within configured limits. Scene qualification samples acquisition, swing apex, early/late releases and landing extremes using the same simulator; matching socket height is not enough.

### Zipline

Author a polyline and compatible travel profile, plus clear capture and endpoint zones. Derive segment lengths/cumulative arc length once as read-only caches. Capture finds a legal closest point within radius and sweeps the small attachment displacement before committing. Progress by path arc length; when crossing a corner, sweep each traversed segment rather than shortcutting through scenery. Jump/toggle/end produces a tangent exit and releases the pin. Zero-length segments and trapped endpoint exits fail validation.

### Jump pad

The first schema uses top-face (+Y) foot contact on a pad rectangle. Keep per-trigger armed/contact state in the session. A new eligible crossing emits one launch request; `velocityPolicy` selects replace or add using its sole `launchVelocity`. Continued overlap never applies another impulse. Rearm after separation and the configured delay. Resolve lethal contacts first; apply the pad impulse for the next integration tick. Preview the resulting arc using the shared simulator.

## Scene composition and authoring checks

| Example module | Layout intent | Required checks |
|---|---|---|
| Teaching ground | Flat run, one jump and one low ceiling with recovery | Prompt lead time, body sizes, stand-up clearance and retry readability. |
| Vault strip | Tagged low block and supported exit | Approach, width/height bounds, swept top corridor and landing. |
| Dash crossing | Visible dash anchor beyond a gap | Target visibility, travel clearance, arrival and safe exit. |
| Swing bay | Overhead anchor, open arc and release landing | Rope occlusion, min/max length, momentum and camera envelope. |
| Cable descent | Clear capture area, ordered cable path, safe endpoint | Capture displacement, corner sweeps and exit tangent. |
| Pad ascent | Top-contact pad launching toward a landing/anchor | One-shot/rearm, full arc clearance and destination visibility. |
| Combination | Pad -> swing -> land; dash -> cable -> landing | Each transition guard, cooldown/capability envelope and fair approach. |
| Recovery seam | Broad ground after a complex move | Conservative outgoing state envelope and compatible next-module entry. |

Finite levels place these module instances explicitly. Endless generation uses their same definitions and certified route/socket envelopes; it cannot swap to an editor-only motion rule or repair a bad seam by changing velocity secretly.

Measure available reading distance at the actual permitted approach speed. A useful design budget is approach speed times recognition time plus simulation-derived action-commit travel and collision margin. Do not make mandatory prompts appear only at the obstacle's contact edge. Endless lookahead must also cover camera/prediction visibility.

Editor overlays show body volumes, sweep paths, target/cone, rope/arc, cable direction, pad launch, safe landing and seam envelopes. Geometry/profile edits invalidate derived overlays and prior route qualification. The same recipe data feeds playtest and runtime.

## Implementation and verification order

1. Shared swept body/support kernel, normal movement and input edges.
2. Slide/stand recovery, base vault and landing feedback.
3. Four traversal additions in isolated test scenes, including interruption and fast-motion collisions.
4. Mixed routes and camera framing at maximum allowed speeds.
5. Finite and endless providers plus editor preview using the same content and simulation.

Required regression cases include thin walls, one-way upward/downward crossings, low ceilings, blocked dash paths, slack/blocked/released ropes, cable corners/endpoints, persistent pad overlap, simultaneous lethal/pad/finish events, focus loss and streaming while attached. The lab regression suite exercises baseline collision, attachment, interruption and route cases. Streaming, pinning and generated seam/long-run safety remain unimplemented and untested.

## Scene synchronization revision, 24 October 2026

The shared contract is now 1.2.0, adding scene markers, context-input lifetime, grip offset and normalized vault trajectory. The previous 1.1.0 pair is archived locally. Space queues a vault in a matching approach and executes after start-plane validation, superseding the earlier automatic-vault assumption; normal jumping remains outside a matching context. Actual owners, reference evidence, smoothed assets and checks are in [current scene synchronization](../../Current/scene-action-synchronization.md).
