# Scene action and animation synchronization

The [scene choreography contract](scene-choreography.md) owns marked actions. The detector prepares geometry, input windows, timely/late/missed variants, sequences and camera shots. Input confirms a variant; playback begins when the runner reaches its slot. The simulator alone moves the body, using swept paths and exit checks. Generic free-jump buffers retain their expiry.

The shot follows authored scene coordinates and time independently of animated root movement. Tick-boundary interpolation and bounded visual inertia keep transitions continuous. Hand/grip contacts override pelvis correction. Pause freezes clocks and cancels uncommitted intent; retry resets presentation memory. High-edge capture connects automatically to mantle, while low climbs retain forward progress; see [continuous play](continuous-play.md).

## Current art calibration

The [CC0 character catalogue](animation-assets.md) owns original strip hashes, source indices, crops, scale, foot/pelvis/hand anchors and clocks. The same nine strips serve every screen. Running phase follows distance. Side-hoist poses supply climb/mantle, low poses supply sliding, somersaults supply roll/pad, and grab/reach poses remain stable during rope travel. One opaque pixel sprite is drawn with nearest-neighbor sampling. No reference skeletal data or generated trial sheets are loaded.

The physical outcome and camera timing are unchanged by this asset replacement. The compact source pack does not supply a bespoke full cycle for every action; selected pose adaptations and their limitations are documented rather than presented as recovered reference animations.

## Verification

183 tests and 30 production recordings pass, covering all 30 required lab events and twelve campaign routes. Contact, pose-entry, fixed playback, read-only presentation and camera-noise checks remain. Browser tests cover real artwork, one-input high climbing, retry, audio continuity and editor access. New visual polish still needs player judgment.
