# Character animation catalogue

Updated **26 October 2026**. `animations.json` (`lab-sprites-06-published`) owns all crop rectangles, scale, anchors, sequences, timing and atlas hashes. The runtime and menu now use **19 tracked reference-derived PNG atlases** at `assets/character/reference/` (852 poses, 2,121,658 bytes), alongside three generated traversal sheets. Reference source attribution remains **Nekki / Vector**. These are prepared derivatives of the archived reference data, not original artwork created for this project.

The author explicitly requested publication of the runtime atlas subset. Raw animation packs, full extraction archives, unselected/legacy exports and publisher parser/painter remain outside the release. `assets/local-reference/` stays ignored. The catalogue's `origin: local-reference` describes source provenance, not current availability; all currently referenced sheets are included in Git/Pages. [Published asset contract](../../Documents/Current/animation-assets.md).

## Calibration and ownership

Nominal 20-Hz source samples were interpolated to 60 Hz before local rasterization with calibrated skeletal-chain scale, visible-support ground anchors and stable airborne pelvis. Generated sheets use estimated landmarks. Running phase uses distance; hand/grip windows lock contacts. Swing/cable use selected stable generated hanging poses, and pad/release remains discrete key-pose animation. One opaque sprite is rendered; complete skeletal blending/in-betweens remain pending. Animation never writes collider position or velocity.

The current clip selection covers idle/run/jump/fall/landing, slide entry/loop/exit, vault/climb, wall rebound/hang/mantle/roll and timely/late/missed scene outcomes. Several outcome aliases reuse existing source intervals or generated poses. The exact source ranges, hashes and filenames remain in the catalogue; no second mapping file is maintained. [Scene choreography](../../Documents/Current/scene-choreography.md).

## Verification and restoration

A clean checkout includes every runtime PNG. `npm run dev` needs no research archive. `npm run prepare:reference` now verifies bundled hashes and optionally restores missing files from the local archive; an explicit archive argument rebuilds/restores the same catalogued subset. It performs no network access and copies no raw publisher source. `npm run check` and the atlas/crop test reject any missing or modified sheet; missing images at runtime still use the rig fallback as error handling.

Provenance: [reference-frame extraction](../../Documents/Plans/Research/vector-character-frames.md), [generated sheets](../generated/README.md), and [timing/clip integration](../../Documents/Current/scene-action-synchronization.md). Publishing the prepared subset does not change source authorship or grant a new asset licence.
