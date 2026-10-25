# Small modules, terrain and contextual traversal

Current motion revision: **`motion-run-07-directed` / `lab-06-directed`**. See [scene choreography](scene-choreography.md) for pre-input binding, timely/late/missed outcomes, directed camera and shared preset editing. Current totals: **153 tests, 24 recordings, 30/30 lab events; 852 local poses / 19 ignored pages plus three generated sheets**. Earlier increment counts below are historical.


Implemented **25 October 2026**, schema **1.3.0**, content revision `motion-lab-04-micro`, physics `lab-03-context`. See [Level Studio](level-editor.md) for the full workflow and [reference analysis](../Plans/Research/vector-context-and-micro-modules.md) for evidence and implementation differences.

## One definition per fact

The old 32–50 m test-station prefabs have been separated into **15 visible library modules** and one shared `terrain-course` definition. The library contains jump, slide, vault, dash, swing, cable, pad, three individual chain attachments, wall, one-way platform, blocked anchor, low-ledge climb and starter ground. The chained pad reuses the normal pad definition. Course floors and hazards have one geometry owner in `terrain-course`; the jump launch edge remains in its jump module because its marker references that edge. The nine lab stations and their obstacle/action-plane world coordinates remain intact.

Atomic library modules use an **entry socket at local [0, 0]**. Layout instances store only module ID and translation. Dropping a module places its entry at the cursor; moving a definition changes every instance. Make unique before editing an independent variant. Raw geometry, detector markers, profiles and rules remain canonical content; there is no separately editable prefab collision map.

## Derived occupied space

Schema 1.3 removes authored `module.size`. `src/module-space.js` derives an axis-aligned rectangle from:

- Actual rectangles, anchor points and cable geometry.
- Input anticipation zones, actor width/height, and vault/climb trajectory knots.
- Nominal jump/pad ballistic apex and landing, dash exit momentum, cable exit and recovery distance.
- The intended lower swing arc, anchor and forward recovery.

Recovery distance derives from `runSpeed × actionRecoverySeconds`; dimensions and trajectories come from the same rules/profiles used by simulation. This is the smallest AABB of those modeled points/extents, replacing the blanket 18 m height. For example the default vault is about **7.3 × 1.8 m**, and the pad about **8.9 × 4.5 m**, including approach/recovery. These are intended-route editing bounds, not a proof that every possible grapple release, unusual incoming velocity or neighboring composition stays inside them. The production collision solver remains authoritative.

The library shows width × height. Scene outlines, selection, framing and drag ghosts all consume this derived rectangle. Changing geometry/rules recomputes it without editing a second field. Empty modules use the actor dimensions as their editing footprint. The full course terrain is hidden from the small-module palette but remains editable in the layout.

## Height-calibrated block brush

**B** selects Block; **V** returns to Select. Drag in either direction to draw a rectangle in the scene or inside a shared prefab. Each stroke is one undoable transaction; Escape/pointer cancellation commits nothing. The brush shows world dimensions, H ratio, expected traversal class and an actor-height reference.

**H = `rules.climbMaxHeight`**, currently **1.2 m**. Actor height is **1.8 m = 1.5H**. Grid choices are H, H/2, H/4 and Off; the default H/4 is **0.3 m**. No second editor-owned climb height exists. Off permits free dimensions; the H ruler still explains them.

Painting in a layout creates a small surface module/instance. Equal-size strokes reuse one definition; shared edits therefore affect those linked blocks, while Make unique creates a variant. Painting in prefab mode adds geometry to that shared definition. Blocks use `surface.traversal: auto`; runtime derives their detectors. It does not write duplicated hand-authored detector coordinates into JSON.

A narrow eligible obstacle selects vault; a wider low ledge selects step-up climb. Heights over the climb limit remain solid and need another route. Actual entry height, supporting exit, body/overhead clearance and the entire swept route are rechecked at commitment. One-way/vaultable/traversal flags and numeric dimensions are editable in the Inspector. Raised or disconnected geometry still needs a supporting approach and a reachable next surface; painting is not automatic route certification.

## Climb and chained input

Climb is a grounded, deliberate Space action that ends **on top** of a low platform. It is a traversal mode inside the single Vault motion owner, not a second controller. The climb's approach uses body width plus collision skin, allowing closer steps; its trajectory gains height before moving over the face. This is not a full wall-grab, wall-run or high-ledge climbing system.

The final `actionChainWindowSeconds` of a vault/climb can retain one eligible next-marker input; the current motion completes before the next starts. Invalid height, released holds, expired requests and changed scene references cancel it. A captured grapple ID is revalidated directly rather than replaced just because a competing anchor ranks ahead.

Vault/climb report their actual trajectory velocity and preserve a valid forward exit speed. The camera uses a standing-body focus (crouching alone cannot pull it down), filtered velocity and queued attachment anticipation. Landing animation uses `actionRecoverySeconds` without delaying valid controls; a calibrated landmark match selects a compatible run phase. Fall/other clip clocks restart at their own sequence entry. These are presentation operations, never animation-driven collider motion.

## Preview, conversion and limits

Placed prefab previews retain the scene's real terrain/context and derive start/finish from that instance's sockets. An unplaced prefab uses a clearly labeled **PRACTICE FLOOR** scaffold, derived only for the frozen preview; jump scaffolds retain a landing gap. The scaffold is not exported and is not proof of authored level playability. Quick-test fall limits account for the actual terrain elevation.

A 1.2 import/recovered draft stays pending until **Convert explicitly to 1.3.0**. Conversion preserves geometry, removes obsolete fixed-size fields and obtains the new rule defaults from the current canonical package. Conversion/import is undoable; malformed or unknown-version files do not replace the active draft. Existing original files stay untouched.

**102 tests pass**, including painted-block climb/top support, exact hand contact, captured-target stability, late queued chaining, gait matching, derived dimensions, shared brush definitions and legacy conversion. The original **15 production rehearsals still cover 26/26 lab events**, including a full lap; climb is separately tested. Ten actual Edge CDP scenarios cover native library drag/drop and ghost, exact coordinates, a 2.4 × 1.2 m stroke and climb, both preview modes, all fifteen module views, file conversion, local recovery and compact layout, with zero browser exceptions. Local evidence is in `.midwork/assignment3/lab-evidence/2026-10-25/micro-editor/`.

Source art is still ignored local research material. The climb adapts the hand-support portion of `monkey_vault` with a dedicated contact window; it is not a recovered original high-wall controller. Generated eight-pose traversal sheets remain provisional. Endless generation, composition qualification, graphical route editing, human trial remain pending.

The library now has eighteen prefabs: the previous fifteen plus `unit-ledge`, `unit-wall-jump`, `unit-drop`. Their intended spaces include wall rebound/catch/mantle/recovery from `sceneTraversal`; this is still an authoring envelope, not universal reachability proof. Six new terrain definitions and finite layouts are documented in [campaign/actions](campaign-and-scene-actions.md).
