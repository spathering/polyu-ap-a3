# Level data and endless generation

**Implementation update, 24 October 2026:** baseline movement, four traversal additions, camera, semantic input, an authored circuit and prepared sprite mapping are implemented in the [character lab](../../Current/character-lab.md). See actual paths/owners in [modules](../../Current/modules.md). 66 tests pass; 15 rehearsals cover 26/26 events. This document retains the broader product contract; the editor, endless generation, streaming qualification and production animation blending remain pending.

Status: proposed specification. The [JSON Schema](Schemas/content-package.schema.json) owns field shapes; the [example package](Examples/content-package.example.json) demonstrates them. Examples are not tuned defaults or proof of traversability. See [SSOT](data-driven-architecture.md) and [requirements](../Requirements/game-requirements.md).

## Package and coordinates

The package contains `schemaVersion`, `contentRevision`, `physicsVersion`, `generatorVersion`, `rules`, `profiles`, `modules`, `finiteLevels` and `endlessPresets`. All references resolve within the validated package. One movement ruleset is shared by its levels; variants require a separate versioned package or an explicitly designed profile reference, not hidden per-level overrides.

Positions use module-local metres, +X forward and +Y up; time uses seconds, velocities metres/second and angles radians. Rectangles are `[x, y, width, height]` from the lower-left; vectors are `[x, y]`. Player simulation position is its foot reference. Rendering alone inverts Y and applies pixel scaling.

## Authoring records

| Record | Key fields | Meaning |
|---|---|---|
| Rules | Fixed tick, gravity, run/jump values, timing tolerances, body sizes, enabled abilities and input bindings | Single owner of normal movement, collision dimensions and control mapping. |
| Traversal profile | `id`, discriminated `kind`, typed settings | Dash acquisition/travel, swing constraint, zipline travel/exit, or pad launch/rearm. |
| Module | `id`, `size`, `difficulty`, `tags`, `entities`, `sockets`, `routes` | A reusable authored scene; local coordinates and stable entity IDs. |
| Surface/hazard | `kind`, `id`, `rect`; surfaces add one-way/vaultable flags | Authoritative gameplay geometry, also used for gameplay drawing. |
| Anchor | `kind: anchor`, `id`, `position`, `profileId` | Profile kind determines dash versus swing compatibility and cue. No redundant anchor-mode field. |
| Zipline | `kind: zipline`, `id`, `points`, `profileId` | Ordered polyline; profile owns capture/travel/exit parameters. |
| Jump pad | `kind: jumpPad`, `id`, `rect`, `profileId` | Trigger geometry references one launch policy. |
| Socket | `id`, `role`, `position`, `contract` | Entry/exit endpoint plus admissible motion/clearance/capability envelope. |
| Route | Entry/exit socket IDs, required abilities, witness actions and maximum ticks | Authored intended connection and deterministic rehearsal input, not an unconditional proof. |
| Finite level | `id`, instances, explicit connections, spawn/finish socket references | Stable designed layout. No random substitution. |
| Endless preset | Pool/weights, start/fallback IDs, tier rules, retry/lookahead/retirement limits | Rules for choosing and streaming existing modules. |

Use distinct profile kinds `dashGrapple`, `swingGrapple`, `zipline` and `jumpPad`. Profiles own their own parameters; entities only hold references and placement. Geometry-specific information such as a cable's path belongs to that entity, not its shared travel profile.

In the first schema, pads use top-face (+Y) contact; arbitrary pad rotation is unsupported. Input bindings also live in `rules`; their action uniqueness and key-conflict checks belong to the shared semantic validator.

The current proposal is schema **1.1.0**. `rules` additionally owns ground/air acceleration, speed caps, support/sweep/stand tolerances, input-buffer capacity, landing feedback timing, complete base-vault tuning and `camera`. Validate min/base/max view-height order, lookahead bounds and movement/profile consistency in the shared semantic validator. Presentation animation catalogues remain a future versioned asset decision, not hidden extra fields in this package.

## IDs, placement and runtime records

IDs are unique in their declared namespace: profiles, modules, finite levels and presets globally within each catalogue; entities, sockets and routes within a module; instances within a finite layout. Never use array index as persistent identity.

An instance contains only `id`, `moduleId` and translation `position`. Resolve its entities from the module definition. Initial schema permits no rotation, scale, entity overrides or mirrored variants. Make a separately authored module variant when geometry differs; do not silently mutate shared definitions for one instance.

Socket world position is instance translation plus socket-local position. Connections reference two existing instance/socket pairs. Derived runtime IDs qualify run/chunk instance and local entity ID. Expanded entities, bounding boxes and spatial indexes are caches, not editable source data.

Runtime session records, not authored JSON, own mode, run signature, fixed tick, active instances, player motion, attachment reference, cooldowns, generator PRNG state, generated sequence and retired chunks. A save/replay records the run signature and semantic actions. Separate content identity from player progress.

## Finite mode

1. Select a finite level and validate all instance, connection, spawn and finish references.
2. Use its authored instance positions without randomisation. Connected socket transforms must align within the shared validator's tolerance, and declared routes must link spawn to finish.
3. Check geometry overlap/clearance, abilities, hazards, landing zones and intended action witnesses using the production simulator.
4. Start at the spawn contract, detect the finish only once and report outcome. Retry resets session state with the same content. Initial policy is full-level retry; checkpoints require an explicit later schema and restore policy.

Branching routes may be authored, but finite layout editing must preserve explicit connections. A visually adjacent platform is not automatically a declared route.

## Socket contracts and safety

Each socket declares accepted/output `postures`, ordered horizontal/vertical velocity ranges, required abilities and a clearance box. Entry describes admissible incoming states; exit describes the module's guaranteed outgoing envelope for its validated route. Geometry, labels and speed ranges alone do not certify a transition.

A join must satisfy role, transform alignment, clearance, available abilities and **outgoing-state containment within the next entry's admissible envelope**. Route validation must also show that the chosen outgoing exit is reachable from the admitted entry. Do not merely test that velocity intervals overlap: an actual outgoing state could lie outside the overlap.

Use conservative contracts, canonical simulation witnesses, sampled boundary tests and content review. Tests are evidence, not mathematical proof for every possible player action; only accepted route states may be promised. If a module cannot establish a conservative reachable envelope, exclude it from the endless pool or widen its safe recovery geometry and revalidate.

Certification is derived and bound to module/content and physics hashes. Any geometry/profile change invalidates it. The editor must distinguish structural validity, semantic validity, rehearsal passed and reviewed endless eligibility.

## Endless algorithm

1. Initialise a documented versioned PRNG with the seed and package/generator signature; place the designated safe start module.
2. At a logical generation boundary, calculate the current tier from generated-module count. Filter the pool by tier, enabled abilities, repetition rules and current exit contracts.
3. Sort candidates by stable module ID before weighted selection. Use gameplay RNG only for deterministic generation; rendering, asset completion and UI must not consume it.
4. Align the candidate entry socket to the frontier exit and check transformed bounds, clearance, route eligibility and enough forward progress. Perform bounded lookahead, including a feasible safe continuation. Speculative checks use cloned/substream RNG state; commit exactly the selected plan.
5. Attempt at most the preset's `maxAttempts`. A designated fallback is **not automatically safe**: validate it against the actual frontier. Pool design must guarantee a compatible recovery route for every admitted exit, or exclude that exit. If no safe continuation exists, stop safely and report a generation error rather than spawning impossible geometry or looping forever.
6. Commit the new instance and its qualified IDs atomically. Append to the deterministic logical sequence; preload assets ahead of the player without allowing asset timing to alter selection.
7. Retain the active lookahead window and retire modules sufficiently behind. Pin any module referenced by the player, rope, cable or active transition until released. Enforce `maxActiveModules`; never evict a live attachment to satisfy the limit. Stop further unsafe extension and diagnose a violated budget if necessary.

The same signature must produce the same logical sequence regardless of render frame rate and incremental/chunked requests. A 60 Hz render rate is not the simulation or generation authority. For long runs, use chunk index plus local offsets or controlled origin rebasing; distance and IDs remain logical and monotonic.

## Validation and migration

| Layer | Checks | Failure behaviour |
|---|---|---|
| Shape | Version, required fields, known kinds, numeric types/bounds, no unknown fields | Reject candidate; preserve current editor/play content. |
| References | Duplicate IDs, missing modules/profiles/sockets, incompatible profile kinds, wrong socket roles | Identify document path and object ID. |
| Geometry | Positive extents, valid cable segments, clear spawn/finish, bounds and swept-volume conflicts | Highlight objects and block release/playtest as appropriate. |
| Rules/contracts | Ordered ranges, valid rope lengths, enabled abilities, seam containment, directed spawn-to-finish route | Block invalid composition; never silently repair source. |
| Rehearsal | Fixed-step action witness reaches expected exit; collision and landing boundary cases | Record content/physics identity and diagnostics. |
| Endless | Seeded sequence stability, bounded attempts/memory, safe recovery, seam pairs and streaming attachment cases | Exclude unqualified modules; show controlled failure. |

Unknown versions fail with a useful message. Supported migrations create a new candidate, retain a backup, validate fully and apply as one undoable editor operation. The lab implements the schema keyword subset used by this contract and selected reference/profile/cable/control/camera semantic checks in `src/content.js`. Migrations, full seam qualification and generator/editor validation remain pending.

## Acceptance examples

- The example package passes structural validation and reference checks, while its traversal routes remain unproven until simulation exists.
- Reject an anchor referencing a pad profile, a duplicate local ID, a zero-length cable, inverted velocity bounds or a disconnected finite finish.
- Same seed/signature gives the same sequence under different render rates, pauses and generation batch sizes.
- A bad seam or exhausted candidate set uses a compatible verified fallback or a controlled error within the attempt budget.
- A swinging player cannot lose their anchor because its module was retired.
- Camera-visible span and safety margin fit the generated lookahead; scene acquisition/clearance recipes and state transitions match the linked [3C](three-c-design.md), [state machine](character-state-machine.md) and [scene implementation](parkour-scene-implementation.md).

## Scene synchronization revision, 24 October 2026

The shared contract is now 1.2.0, adding scene markers, context-input lifetime, grip offset and normalized vault trajectory. The previous 1.1.0 pair is archived locally. Space queues a vault in a matching approach and executes after start-plane validation, superseding the earlier automatic-vault assumption; normal jumping remains outside a matching context. Actual owners, reference evidence, smoothed assets and checks are in [current scene synchronization](../../Current/scene-action-synchronization.md).
