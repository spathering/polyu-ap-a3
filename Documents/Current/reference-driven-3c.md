# Reference-driven 3C implementation

Current artwork, **26 October 2026**: [19 reference-derived atlases and three generated sheets](animation-assets.md) are bundled for local and public play. Earlier local-only/ignored-art descriptions and counts below describe prior increments.


Updated **25 October 2026**. [Public-runtime observations/hashes](../Plans/Research/vector-3c-runtime-review.md) distinguish source findings from reimplementation. Native Vector equivalence is not claimed. The [scene choreography contract](scene-choreography.md) is the current authority for marked actions.

- **Character:** One 60-Hz Simulation owns free locomotion, swept vault/climb paths, attachment solvers, LedgeHang/mantle/drop, one wall rebound per airborne wall, buffered landing Roll and collision failure. Intervening solids hide blocked scene candidates; target, exit support and headroom guards remain shared.
- **Controls:** Match geometry before input; one signal pins timely or late, then waits for its playback slot. Required obstacles without confirmation play a missed result. Generic free jump buffers still expire. Swing/cable permit interactive release; pause/focus clears uncommitted intent and holds. A second deliberate press mantles or rebounds where eligible.
- **Camera:** Marked approach/playback/recovery samples a prepared scene rail from time, with authored framing, stable ground horizon, landing-height transitions and continuous handoffs. It ignores live root pose/velocity. Hang/mantle/rebound/roll receive directed shots. Free movement retains acceleration-limited follow, visibility guards and zoom bounds. Pause freezes and retry clears shot/blend memory.
- **Animation:** Each selected outcome has a fixed sequence clock; the renderer interpolates it without exposing future tick state. Hand/grip contact overrides bounded pelvis/rotation inertia. Distance gait matching and calibrated anchors remain. Stable generated hanging poses are not full skeletal blending.

The same recipes, validator, simulator, camera and renderer run in the lab, finite game and editor quick test. `scenePerformances` and the catalogue own authoring facts; editor changes are atomic and undoable. Finite `Completed` freezes results; the lab returns at its lap gate. The [play session](game-flow.md) owns cumulative active ticks through retries.

153 tests, 24 recordings (18 lab / six campaign) and actual browser clip/edit/control checks pass. Root-noise injection cannot affect directed shots. These checks are not a human feel trial. Final original animations, arbitrary composition qualification, endless generation remains pending. [Scene-action guards](campaign-and-scene-actions.md) describe ledge/wall/landing behavior.
