# Level editor requirements

Status, **25 October 2026**: finite-layout and shared-prefab authoring implemented in [Level Studio](../../Current/level-editor.md). This document retains the complete target contract; endless-preview and advanced witness/route tools remain planned. Related: [product requirements](../Requirements/game-requirements.md), [data contract](level-data-and-generation.md), [SSOT](data-driven-architecture.md).

## Workspaces and layout

Three workspaces operate on **one content package**, not unrelated file formats:

| Workspace | Authoring tasks | Required preview |
|---|---|---|
| Module | Place surfaces/hazards, dash/swing anchors, ziplines and pads; edit sockets and intended routes. | Local collision, capture ranges, tether length, launch arcs, entry/exit envelopes. |
| Finite level | Instantiate catalogue modules, translate them, connect sockets and choose spawn/finish. | Actual composed route, seam/clearance errors and full-level playtest. |
| Endless preset | Select eligible modules, weights, tier/repetition rules, safe start/recovery and streaming limits. | Seeded generated sequence, rejected candidates, seam contracts and bounded lookahead. |

Required UI (author revision, 24–25 October): the editable scene is the primary workspace. Prefab library, inspector, level settings and guide are hideable, draggable and resizable floating panels. Provide cursor-centred zoom, pan/grid snapping, Shift/marquee batch selection and editing, and immediate same-runtime playtest. Fields bind by stable IDs to one working document; panel state is not game content.

## Editing operations

| ID | Requirement | Acceptance |
|---|---|---|
| ED-01 | New/open/import/export package and select module/finite/preset workspace. | One schema/version model; cancel or invalid import never replaces the active document. |
| ED-02 | Pan/zoom, grid/snap, select, move, resize supported rectangles, duplicate/delete. | Property edits and viewport changes update the same object; IDs remain unique. |
| ED-03 | Typed inspectors for surfaces, hazards, anchors, cable points, pads, sockets and rules/profiles. | Valid profile choices are filtered by entity kind; no arbitrary JSON script execution. |
| ED-04 | Place module instances and connect sockets with compatibility overlays. | Translation-only first version; no hidden scale/rotation/overrides that violate the data contract. |
| ED-05 | Undo/redo complete transactions, including reference updates. | Delete refuses or explicitly repairs dependent references as one transaction; no dangling partial changes. |
| ED-06 | Dirty-state indicator, explicit export/save and recoverable local autosave. | Reload recovery distinguishes active draft, last export and playtest snapshot; storage failures are visible. |
| ED-07 | Shared validation with object/path errors and selectable highlights. | Distinguish structural, semantic and simulation/review status instead of a misleading single green badge. |
| ED-08 | Playtest from selected socket or full level with the production rules. | Freeze a validated snapshot; stop restores the untouched draft and editor camera/selection. |
| ED-09 | Seeded endless preview with tiers, rejects, fallback and stream-window diagnostics. | Rerun the same signature reproduces its logical sequence; change one rule invalidates derived qualification. |
| ED-10 | Inspect and edit intended route witnesses as fixed-tick semantic actions. | The witness uses the same input and simulator; a passed witness is not represented as universal reachability proof. |

## Traversal-specific tools

- **Dash anchor:** show compatible profile, acquisition cone/range, selected-target cue, collision sweep and arrival region.
- **Swing anchor:** show tether min/max length, initial attachment distance, occlusion and release trajectory. The first version supports a straight rope without wrapping.
- **Zipline:** edit polyline points in order, show capture region, travel direction and exit tangent; flag duplicate points/zero-length segments and unsafe exit clearance.
- **Jump pad:** draw trigger/facing surface, launch vector, one-shot/rearm state and same-simulator trajectory; geometry and profile edits immediately invalidate old trajectory caches.
- **Sockets/routes:** visualise entry/exit posture/velocity envelopes, required abilities, safe landing/clearance and reachable intended exits.
- **3C/state diagnostics:** show foot/body/swept volume, locomotion owner, transition rejection reason, input consumption and camera focus/dead-zone/prediction envelope. Preview camera/controller values from the same content snapshot; do not introduce editor-only defaults. See [3C](three-c-design.md) and [state design](character-state-machine.md).

## Save, import and authoring safety

Use browser download/upload of JSON as the portable baseline; do not require unsupported file-system APIs or repository write access. Local autosave is a convenience, not the only durable export. Large drafts show progress/errors without discarding the last valid document.

Validate a candidate off to the side, resolve references, then replace the document atomically. Preserve unknown-version files for recovery but do not execute or silently strip fields. Migration is explicit and undoable. Content is declarative data; URLs/scripts/remote asset execution are not accepted by this first schema.

Export includes only source content. Derived render geometry, expanded instances, simulation state and caches are not re-imported as competing authority. Schema defaults and editable rules are defined once; inspector control metadata must not recreate an independent rules schema.

## Editor acceptance scenarios

1. Create a module with a surface and each traversal entity, valid sockets and a route witness; edit a shared profile once and see matching game/preview changes.
2. Build a fixed layout from at least two module instances; choose spawn/finish, connect seams and diagnose one broken connection.
3. Build an endless preset with start, pool and recovery; inspect a reproducible preview and force an invalid successor to verify bounded fallback/error behaviour.
4. Export, reload and re-export canonical-equivalent content; undo/redo a multi-object edit and import failure without data loss.
5. Start/stop playtest without mutating the draft; background the browser and resume safely.

Initial interface should favour necessary authoring tools over a general scene engine. Advanced animation tools, collaborative cloud editing, arbitrary scripting and third-party asset marketplaces are outside scope. A final game engine/UI toolkit has not been selected.

## Implemented subset and remaining acceptance

ED-01 covers finite/prefab selection, creation and validated undoable package import/export; preset workspace remains pending. ED-02 provides scene gestures, typed rectangle dimensions and batch transforms. ED-03 provides geometry/profile fields plus validated advanced module JSON for markers/sockets/routes; dedicated rules/profile/route graphical tools remain pending. ED-04 provides socket append/alignment and seam warnings. ED-05 provides atomic edits with reference cleanup/protection. ED-06 provides visible local save status and explicit recovery, but no persistent UI/undo history or last-export checkpoint comparison. ED-07 provides shared path/semantic errors and warnings, without error-to-object selection. ED-08 runs full layout, selected start and isolated prefab tests on frozen snapshots through production classes, restoring untouched editor state. ED-09 and ED-10 remain pending. No seed preview or reachability proof is implied.
