# Vector character animation frames

Extracted **22 October 2026** after the author clarified that the requested images were the original character's animation frames. The earlier [17 promotional stills](vector-action-assets.md) are supplemental research and do not fulfil that request.

## Acquired material

The requested [official browser game](https://vector.game/zh-Hans/) publicly loads a skeletal/vector character renderer. Its character assets in this inspected build are packed joint-coordinate samples, not pre-existing PNG sprite sheets. We unpacked those samples and rendered transparent character-only PNGs using the unmodified official `HERO` body painter. These are original-data-derived raster frames, not screenshot crops, AI reconstructions, or extracted mobile/Steam sprites.

| Material | Count |
|---|---:|
| Downloaded animation pack parts | 16 |
| Unpacked source clips / pose samples | 259 / 20,435 |
| Rendered character clips / transparent PNG frames | 226 / 15,192 |
| Named actions in the source / mapped to rendered frames | 326 / 290 |
| Sprite-sheet pages / sampled contact sheets | 349 / 226 |

33 cinematic/prop clips (5,243 samples; 36 action records) remain available as original bytes without human-body rasterization. Bike animations include the default human body only. This prevents drawing the human rig onto unrelated vehicles, ropes, doors or other prop nodes. Alternative skins, hunter body, equipment, effects, camera and world geometry are not exported.

## Local files and single source of truth

The archive is outside the repository at workspace `.midwork/assignment3/reference-assets/vector-character-animation/`.

```text
vector-character-animation/
├── README.md
├── gallery.html                    # Offline action player, filters and frame stepping
├── animation-manifest.json         # Canonical derived catalogue and provenance
├── catalogue.js                    # Generated offline mirror; do not edit
├── source/                         # Unmodified downloaded scripts/configuration/packs
│   └── clips/                      # all.json and pack-0.bin ... pack-15.bin
├── data/clips/                     # 259 decompressed, sliced original .bytes clips
├── frames/<category>/<clip>/
│   ├── frame-0000.png              # Every original sample, including source endpoints
│   ├── sheet-00.png                # Up to 8 x 8 frames/page, row-major
│   ├── contact.png                 # Up to 12 sampled poses, not the whole sequence
│   └── frames.json                 # Rectangles, anchors, source positions, flags and hashes
└── tools/                          # Inspect, export, preview rebuild and verification scripts
```

Each source clip is stored/rendered once. `actions[].clip` and `sourceFrameRangeInclusive` select the original frame interval; aliases and phases never duplicate PNG sequences. Source `moves.json` owns action definitions and `clips/all.json` owns pack offsets. All catalogues, PNGs and sheets are generated derivatives. The versioned metadata snapshot is [animation-manifest.json](VectorAssets/animation-manifest.json), identical to the local canonical manifest and Chinese counterpart. Do not hand-edit snapshots independently.

## Classification and examples

Category assignment is a naming-based retrieval aid, not a verified gameplay taxonomy. Original names and capitalization remain unchanged. A shared clip can contain multiple logical phases.

| Category directory | Clips | Purpose |
|---|---:|---|
| `01-stand-and-run` | 8 | Standing and running |
| `02-jump-and-airborne` | 20 | Jumping, flight and falling |
| `03-slide-crawl-and-slope` | 23 | Low postures and slopes |
| `04-vault-and-clearance` | 29 | Vaults and obstacle clearance |
| `05-wall-and-ledge` | 55 | Wall contact, running and ledges |
| `06-landing-roll-and-recovery` | 38 | Landing, rolling, collisions and recovery |
| `07-acrobatic-tricks` | 37 | Flips, spins and other tricks |
| `08-bike-character-only` | 15 | Character portion of bike poses |
| `10-other-character` | 1 | Other character poses |

| Original action ID | Shared clip | Inclusive source frames |
|---|---|---|
| `RunForward` | `run` | 1–16 |
| `Jump` | `jump` | 0–16 |
| `Sliding` | `sliding` | 1–12 |
| `SlideSimple` | `slide_simple` | 0–50 |
| `SpeedVault` | `speed_vault` | 0–32 |
| `WallRun` | `wall_run` | 0–46 |
| `LandingRoll` | `landing_roll` | 0–56 |
| `BackFlipStart` | `back_flip` | 0–54 |
| `DoubleKongStart` | `double_kong` | 0–113 |
| `SwallowStart` | `swallow` | 0–59 |

## Rendering, placement and timing

- Original packed/unpacked bytes and all source URLs have SHA-256 records. The official parser reconstructs little-endian float samples, including its packed byte-plane/delta format. Coordinates must be finite and pack slices must fit their declared bounds.
- The unmodified `body.js` painter draws the default HERO silhouette, rounded limb strokes and head mesh, black on transparent RGBA at one source unit per pixel. No source image upscaling, generative retouching or silhouette tracing is used.
- Normalize each frame around original node 41 (`pivot`): `x = source.x - pivot.x`, `y = -(source.y - pivot.y)`. All frames of one clip share one canvas, padding and anchor pixel. Source pivot/detector coordinates remain in `frames.json`, so normalization does not destroy the original positional evidence.
- `frames.json` stores each PNG's source index, flag, sprite-sheet page/rectangle, source anchor and digest. Page capacity is 64. No trimming/rotation is used; there are no hidden trim offsets. Empty cells at the end of a page remain transparent.
- `bytes.js` declares **30 FPS**. Separately, `player.js` advances poses at `mid + 1` simulation ticks; the inspected loop uses 60 Hz, so a source action with `mid = 2` has a **20 Hz nominal pose step** before overrides. These are different quantities. The gallery offers both. Runtime interpolation, holds, blends, reversal/mirroring, velocity binding and scene warping are not reproduced; the PNG sequence is the original pose samples, not an exact recording of live gameplay.
- Gallery looping is a preview convenience, not a claim that every clip loops seamlessly. Native sample ranges include both source endpoints and may contain repeated poses.

## Provenance and scope

Primary sources: [game entry/configuration](https://vector.game/game/index.html), [pack index](https://vector.game/game/clips/all.json), [action definitions](https://vector.game/game/moves.json), [byte parser](https://vector.game/game/bytes.js), [body renderer](https://vector.game/game/body.js), [player timing/loading](https://vector.game/game/player.js). The manifest records each downloaded pack/script URL and digest, renderer/tool identity and package version. Public downloads used no login, purchase, private endpoint or access-control bypass. No gameplay start or agreement-acceptance action was performed during extraction; the observed browser state reached the menu automatically.

This extraction establishes the inspected browser build's asset representation and pose data. It does not establish mobile/Steam parity, complete runtime animation behaviour, or permission to redistribute these assets. The original reference bytes and derived images remain local research material, outside Git and Pages. Update, 24 October: selected derived frames now drive the local lab from ignored `assets/local-reference/`, without importing the original code. They remain excluded from Git and Pages. Dash grapple, swing grapple, zipline and jump pad still need our own animation design; similarly named source tricks do not prove those mechanics exist.

The [3C](../Design/three-c-design.md), [state-machine](../Design/character-state-machine.md) and [scene recipes](../Design/parkour-scene-implementation.md) remain our proposed game design. Use these frames to study silhouette, anticipation, support and recovery without treating image bounds as authoritative collision geometry.
