# Parkour game requirements

Baseline: **22 October 2026**. Status: product requirements; a baseline character lab is now implemented, while full modes/editor remain pending. This document owns product requirements. Data contracts and algorithms belong to the linked design documents, not competing copies here.

## Direction and evidence

Build an original parkour game informed by Vector's movement-and-obstacle relationship. The author requires **dash grapple, swing grapple, ziplines and jump pads**, designed around environmental affordances; **authored finite levels and endless assembly of preset scene modules**; a **data-driven architecture, strict SSOT, a level data model and a level editor**.

See [reference analysis](../Research/vector-reference-analysis.md) for confirmed official claims, inspection limits and design inferences. The four added traversal mechanics and this project's endless/editor architecture are project requirements, not verified Vector features.

### Proposed baseline assumptions

Use a 2D side view, forward auto-running and readable action timing, with keyboard-first desktop play. This is a design proposal inferred from the reference, not a direct instruction or verified browser control scheme. Touch controls can map to the same actions later. Create original, shareable runtime assets and routes; local promotional-image references are research material, not an authorisation to ship Vector artwork or code.

The intended player is someone trying a short browser parkour challenge without installation. Initial sizing proposal: three short authored levels and roughly ten reusable modules, including safe start/recovery modules. Final counts and tuning remain open; **both modes, all four added traversal types and the editor remain required**. Stage implementation rather than silently removing them.

## Core loop and controls

Read the upcoming route, choose a timed action, change motion, see a clear result, then chain into the next obstacle. Failure explains its cause and offers a quick retry. Finite play reaches an authored finish; endless play continues until failure or an explicit stop.

Proposed bindings, stored in data and remappable: Space/Up jump, S/Down slide, E dash grapple, hold Q swing grapple/release Q detach, F zipline attach/detach, Escape pause, R retry. Contexts resolve conflicts; keyboard and future touch produce the same semantic actions. A held key must not create repeated attach or launch events.

## Functional requirements

| ID | Requirement | Observable acceptance |
|---|---|---|
| MOV-01 | Run, jump, slide and context-sensitive low-obstacle vaulting. | Gaps, low ceilings and vaultable blocks need appropriate actions; hit shapes and prompts agree. |
| MOV-02 | Jump timing tolerance, jump buffering and stand-up clearance use the selected movement profile. | A buffered landing jump works; standing under a low ceiling remains blocked; no duplicated timing constants. |
| TRV-01 | Dash grapple targets a compatible visible anchor within the configured cone/range. | Preview identifies the actual selected anchor; activation pulls rapidly toward it using collision sweeps rather than teleporting. |
| TRV-02 | Swing grapple attaches a rope constraint to a compatible anchor and preserves meaningful momentum. | Holding maintains attachment; release keeps tangential velocity; blocked rope/invalid target cannot attach silently. |
| TRV-03 | Ziplines are authored paths with entry, travel and exit behaviour. | A player can attach in the entry region, travel along the line, detach/jump and exit at its endpoint without becoming stuck. |
| TRV-04 | Jump pads apply the selected launch profile on valid contact. | A landing launches once; continued overlap does not repeatedly add velocity; another use requires rearming. |
| TRV-05 | Traversal transitions are explicit and exclusive. | Only one motion solver owns movement at a time; deaths, pause, collisions and destroyed/unloaded targets have defined outcomes. |
| ENV-01 | Surfaces, hazards, grapple anchors, cables and pads have readable silhouettes and interaction cues. | Dash and swing targets differ by shape/icon as well as colour; decorative geometry is distinguishable from collision. |
| ENV-02 | A designer can build routes chaining the new mechanics. | Demonstrate pad-to-swing, swing-to-landing and dash-to-zipline transitions, with safe teaching space before a combined challenge. |
| FIN-01 | Finite levels use a fixed authored layout, spawn, finish and restart policy. | Repeated starts load the same module instances; no random replacement alters the intended route. |
| FIN-02 | Finite progression teaches before combining skills. | Authored content introduces basic movement, demonstrates each new traversal type and includes a mixed route. |
| END-01 | Endless levels select and connect validated preset modules under authored rules. | Generation never falls back to unconstrained random geometry; socket and route contracts are checked. |
| END-02 | Seeded generation is reproducible for a versioned content/rules/generator signature. | Same signature produces the same logical module sequence independent of render rate or asset-load timing. |
| END-03 | Generation, active content and memory are bounded. | Lookahead and retirement limits hold; attached anchors/cables remain pinned; no valid successor uses a validated recovery path or a clear controlled failure. |
| END-04 | Difficulty grows under capped rules, with recovery and repeat limits. | Additional difficulty never bypasses compatibility or demands unsupported abilities. |
| DAT-01 | Gameplay values, entities, module catalogues and generation rules are authored as validated data. | Changing a profile or module updates play and editor preview without editing gameplay switches or copying constants. |
| DAT-02 | Every mutable fact has exactly one authoritative owner. | Inspector, export, simulation, collision, UI and preview cannot independently store competing versions of the same fact. |
| EDT-01 | Provide a browser level editor for modules, finite layouts and endless presets. | A designer can create, place, inspect, connect, validate, save/import/export and playtest all three document types. |
| EDT-02 | The editor uses the production schema, validator and simulation. | A save passes the same checks as runtime loading; playtest uses a frozen snapshot, not separate editor-only physics. |
| UX-01 | Menu supports finite play, endless play and editor entry; pause/results/retry are clear. | Play starts without login; last mode, finite level or endless seed can be retried predictably. |
| UX-02 | Handle invalid level data and focus loss explicitly. | A bad import leaves the active document intact with a useful error; backgrounding pauses and clears held input safely. |
| DEP-01 | Publish the game and editor as static browser output on GitHub Pages. | Both work under `/polyu-ap-a3/`, without a persistent server or bundled write credentials. |

## Traversal behaviour contract

**Dash grapple:** press once to acquire the previewed compatible anchor; resolve ties deterministically. Validate visibility, reach, motion state and cooldown before committing. A failed acquisition gives feedback and spends no cooldown. During the dash, swept collision can stop it; arrival or cancellation returns to grounded/airborne motion with the profile's exit velocity. There is no independent free-flight dash implied by this requirement.

**Swing grapple:** hold to acquire a swing anchor; initialise rope length from distance within the allowed range without teleporting. Reject capture beyond maximum rope length; initial slack is allowed if the minimum length exceeds the current distance. Apply the selected gravity/constraint rules, retaining momentum on release subject to an explicit speed cap. Initial scope has no rope wrapping or arbitrary reel-in. A blocked tether or invalid anchor releases with feedback; the supporting module cannot be recycled while attached.

**Zipline:** attach only inside the allowed capture region with a compatible motion state. Follow the authored path by arc length; do not integrate free flight simultaneously. Detach transfers tangent velocity plus an optional configured jump impulse. Endpoint behaviour is defined by the profile and the adjoining safe route.

**Jump pad:** activate on an eligible foot contact while approaching the pad's facing side, not every overlap tick. Replace/add velocity only according to its one launch policy. Re-arm after leaving the trigger and meeting the profile's rearm condition. The editor draws the resulting launch arc with the same simulation.

Death/finish and pause are session states outside locomotion. The locomotion arbiter admits one owner among normal motion, slide/vault, grapple dash, tether swing and zipline; pad contact requests a single transition to airborne motion. Rejected conflicting commands provide feedback rather than activating multiple solvers.

## Modes, outcomes and scope

Finite mode prioritises completion, then optional time/style measures; exact medals/scoring remain data-design choices. Endless mode reports distance and survival, with optional style metrics. Keep best scores separated by mode, level/preset and content/rules version. A fixed seed enables retry; a new run can choose a new seed. No online ranking is required to play, and [shared leaderboards](../Research/github-only-leaderboard.md) remain optional.

Pursuer AI, story cinematics, shops, paid unlocks, accounts, multiplayer, arbitrary rope wrapping, terrain deformation and an asset marketplace are outside the initial delivery scope. A visual chase motif can be explored without introducing hidden failure rules. These exclusions do not remove the author-requested traversal, modes or editor.

## Quality and acceptance gates

- All balance/physics values have a named data owner, unit and range. Rendering cannot write physics or generation state.
- Validate shape, references, geometry, route contracts and deterministic rehearsal; a schema-valid file alone is not a proven playable level.
- Target a stable browser experience on a representative desktop; set measured frame/memory budgets after the first slice, with bounded endless active content from the outset.
- Include readable prompts, keyboard navigation, optional reduced motion/sound controls and errors that do not trap the player. Touch coverage is a separate device decision.
- Complete at least one unprompted user trial, record a real observation and change/retention decision in PROCESS, and verify launch instructions and the live Pages build.

Implementation order: shared contracts/validator and movement slice; each traversal in an isolated test module; fixed authoring and editor round-trip; safe endless assembly; mixed-level playtest; Pages verification. All requested features remain on the final acceptance list.

## Related specifications

- [Data-driven architecture and SSOT](../Design/data-driven-architecture.md)
- [Level data and endless generation](../Design/level-data-and-generation.md)
- [Level editor](../Design/level-editor-requirements.md)
- [3C design](../Design/three-c-design.md), [character state machine](../Design/character-state-machine.md) and [action/scene recipes](../Design/parkour-scene-implementation.md)
- [Reference images and provenance](../Research/vector-action-assets.md)
- [Project TODO](../TODO.md)
