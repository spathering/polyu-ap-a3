# Published reference animation assets

Implemented **26 October 2026** at the author's request. The selected runtime reference atlases are now part of the public release. Catalogue **`lab-sprites-06-published`** remains the single owner of image paths, frame geometry, calibration, sequence mappings and SHA-256 hashes.

| Asset group | Release contents | Runtime path |
|---|---|---|
| Reference-derived character | 18 clips, 19 PNG atlases, 852 poses; 2,121,658 bytes | `assets/character/reference/` |
| Generated traversal poses | Three PNG atlases, 24 poses | `assets/generated/` |
| Complete extraction / raw packs / parser | Outside Git and Pages | Workspace research archive |
| Legacy and unselected local copies | Ignored; not used by the current catalogue | `assets/local-reference/` |

The files are copied byte-for-byte from the hash-checked local runtime atlas subset; no new image generation, upscaling or clip retiming occurred. Source credit remains Nekki / Vector. Original source ranges and offline generation provenance remain linked in [character asset documentation](../../assets/character/README.md) and [extraction research](../Plans/Research/vector-character-frames.md). The `local-reference` origin tag is provenance, not an instruction to hide the current atlases. Publication follows the author's explicit instruction and does not change source ownership.

## Integration and behavior

Renderer, Motion Lab, editor playtest and main-menu runner all read the same catalogue. Only the atlas path/version/credits changed; sequence IDs, frame rectangles, anchors, scale, motion rules, camera and scenario timing are unchanged. Menu JSON and renderer catalogue requests revalidate cached data. New release atlas paths avoid the previous missing-sheet URLs. A successful normal load reports **Processed sprites ready**, with all 22 sheets available; the procedural rig is now only an error fallback.

The three same-obstacle witnesses retain distinct actual source clips: timely `speed_vault`, late `pop_vault_start`, missed `wall_collision_from_run_and_jump`. Wall rebound, ledge hold, mantle and roll likewise keep their prepared reference intervals. Generated swing/cable stable-pose limits and incomplete production in-betweens are unchanged.

A clean checkout is sufficient. `npm run prepare:reference` verifies bundled reference hashes without a local archive; optional restoration still uses the catalogue's source directories. `npm run check` checks all 22 PNG hashes, and the existing crop test now requires every runtime file instead of allowing missing reference pages. No second atlas manifest or copied physics configuration was added.

## Verification

153 Node tests and all 24 deterministic recordings pass. Browser checks compare the three vault clips, foundations keyboard completion, portrait presentation, six finite maps, ledge/mantle/wall/roll controls and editor loading. Public release verification checks all atlas URLs/hashes and normal sprite-ready loading; an intentionally blocked-image check preserves the error fallback. A source-only export is checked without ignored files to demonstrate that the workspace research archive is unnecessary for normal use. See [deployment](deployment.md) for live release status. Automated checks are not an external user trial.
