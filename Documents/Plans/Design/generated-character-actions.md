# Generated traversal character actions

**Implementation update, 24 October 2026:** baseline movement, four traversal additions, camera, semantic input, an authored circuit and prepared sprite mapping are implemented in the [character lab](../../Current/character-lab.md). See actual paths/owners in [modules](../../Current/modules.md). 66 tests pass; 15 rehearsals cover 26/26 events. This document retains the broader product contract; the editor, endless generation, streaming qualification and production animation blending remain pending.

Status: **24 October 2026, trial-01 art experiment**. The author requested PNG action assets for jump pads, ziplines and swings, using the existing silhouette material as a reference. These are newly AI-generated poses, separate from the [original-data character archive](../Research/vector-character-frames.md).

## Deliverables and naming

The workspace archive is `.midwork/assignment3/generated-assets/parkour-character-animation/`, with a local `README.md`, `gallery.html`, unmodified generated sheets under `source/`, reproducible packing tools and derived frames. The three sheets are now copied byte-for-byte to runtime `assets/generated/`, with mapping in `assets/character/animations.json`; no Pages publication has occurred.

| Action ID | Category and clip | Poses |
|---|---|---:|
| `JumpPadLaunch` | `frames/11-jump-pad/jump_pad_launch/` | 8 |
| `ZiplineTraverse` | `frames/12-zipline/zipline_traverse/` | 8 |
| `SwingGrapple` | `frames/13-swing-grapple/swing_grapple/` | 8 |

Each clip contains `frame-0000.png` through `frame-0007.png`, `sheet-00.png`, `contact.png` and `frames.json`. Frames are transparent RGBA PNGs on a shared 512 x 512 canvas. A 2048 x 1024 sheet packs four columns by two rows, read row-major. Category numbers extend the existing 01–10 research convention; clip names remain `snake_case` and action IDs use the existing capitalized identifier convention.

The [manifest snapshot](GeneratedAssets/animation-manifest.json) records sources, phases, rectangles, offsets and hashes. The [full prompt set](GeneratedAssets/prompts.json) records the exact three prompts, two reference-image paths and the built-in `image_gen.imagegen` tool. Both snapshots are byte-identical to their local canonical files and the Chinese counterpart. Generated masters/per-frame PNGs remain local; three derived sheets are versioned for lab presentation. Original reference bytes remain separate and ignored.

## Presentation contract

- Jump pad: approach, compression, push-off, launch extension, rising tuck, apex, descent preparation and landing recovery.
- Zipline: reach, attach, hanging, two gliding poses, release preparation, release and airborne recovery.
- Swing: reach, acquire tension, backswing, bottom pass, forward swing, forward apex, release and free flight.
- Generate only the human silhouette. Pad surfaces, cables, ropes, anchors and trolleys belong to scene presentation and gameplay geometry.
- Preserve source pixels/alpha. Packing performs only cropping and integer translation, with no resampling, pose repainting or generated interpolation. Actual silhouette regions are used because the generated sheets do not have pixel-perfect equal cells.
- All frames use anchor pixel `[256, 288]`. Source pelvis locations and attached hand points are manually estimated visual annotations, not recovered rig joints. `frames.json` preserves these estimates and source transforms. Runtime retargeting must confirm hand contact and offset; frame bounds never own collision or world motion.
- Local preview uses 6 FPS for inspection only. The eight poses are a staged key-pose sequence, not a qualified seamless loop or final animation timing. Individual poses show minor proportion/hand-detail variation.

The local packer is the single authoring owner of extraction and visual-anchor annotations. Manifests, frame JSON, PNGs and gallery data are generated derivatives; do not independently edit snapshot copies. Runtime animation ownership is in the shared `assets/character/animations.json` catalogue; it adds no second physics controller.

## Verification and remaining work

All three generated source sheets and 24 derived poses were visually inspected. Automated checks found eight major silhouettes per source, nonempty transparent frames with at least 12 pixels of outer margin, and exact pixel equality for all 24 sprite-sheet cells against their PNG frames. Source and output hashes, source rectangles and placement metadata are recorded. This verifies file organization and image integrity.

Still pending: consistent production rig/proportions, in-between frames, real clip duration, loops for sustained hanging/swinging, state-transition blending, contact-event timing, production attachment refinement and browser playtesting in the [3C/state/scene design](parkour-scene-implementation.md). The author's request covers trial generation, so these PNGs remain marked as trial art rather than accepted production assets. The dash-grapple action was not requested in this batch.

## Scene synchronization revision, 24 October 2026

The shared contract is now 1.2.0, adding scene markers, context-input lifetime, grip offset and normalized vault trajectory. The previous 1.1.0 pair is archived locally. Space queues a vault in a matching approach and executes after start-plane validation, superseding the earlier automatic-vault assumption; normal jumping remains outside a matching context. Actual owners, reference evidence, smoothed assets and checks are in [current scene synchronization](../../Current/scene-action-synchronization.md).
