# Character animation catalogue

`animations.json` is the single runtime owner of crops, sequences, visual scale and anchors. Default presentation uses 60-Hz local reference derivatives plus three generated traversal sheets. See [scene synchronization](../../Documents/Current/scene-action-synchronization.md).

Baseline segments cover idle, run, slide entry/loop/exit, rise, fall, landing, vault and an adapted dash pose: eleven segments from ten source clips, including an adapted low-ledge hand-support interval. Nominal 20-Hz skeletal samples are linearly interpolated to 60 Hz before local rasterization with the original body painter, producing 516 poses on 12 pages. Original bytes and existing PNGs are unchanged; original painter code is not in the runtime bundle.

Reference segments use a calibrated skeletal-chain scale, visible-foot ground anchors and a stable airborne pelvis. Generated frames use explicit estimated head/pelvis landmarks; bounding-box height is not forced constant across crouched and stretched poses. Movement rules own the grip offset, and image hands attach to that point. Run phase uses travelled distance and presentation position is interpolated. Swing/cable use stable hanging poses with continuous physical motion, avoiding rapid switches between inconsistent generated silhouettes. Pad/release frames remain staged key poses; full production blending is pending.

`npm run prepare:reference` hash-checks and copies twelve already prepared local reference pages into ignored `assets/local-reference/`; it makes no network request. Derivatives are in workspace `.midwork/assignment3/reference-assets/vector-character-animation-runtime-v2/`, adjacent to the original archive; the local rebuild tool is `.midwork/assignment3/tools/build-smooth-lab-sprites.mjs`. Source provenance is in [extraction research](../../Documents/Plans/Research/vector-character-frames.md). Nekki's original and derived artwork remains local research material outside Git/Pages. Missing images show explicit status and use the rig fallback.

The three generated sheets have separate [provenance](../generated/README.md), and their landmarks remain visual estimates. Animation owns neither position/velocity nor collision; the single simulator owns the action trajectory and start alignment.

The climb sequence adapts `monkey_vault` frames 12–28 with a dedicated bounded hand-contact window. Local reference frames include normalized landmark signatures for compatible gait-phase selection on run re-entry. No transparent pose crossfade or animation-owned body motion is used.

## Scene-action clips, 25 October 2026

Four additional local research clips support the scene extension: `wall_jump` 27–45 (57 poses), `wall_cling` 41 (3 repeated/resampled poses for a stable hold), `corner_cling_low` 12–32 (63 mantle poses), `landing_roll` 34–54 (63 roll poses). The initial high-corner mantle trial was replaced after contact-sheet/browser inspection. The same offline chain-metric scale calibration is used; roll anchors use lowest visible alpha support, hang anchors the wrist, and mantle contact correction is bounded to 1.4 metres during its support interval.

Catalogue `lab-sprites-04-scene` totals 702 local poses on 16 ignored pages, plus three generated sheets. `npm run prepare:reference` prepares the sixteen local pages from the existing workspace archive. Original data and painter/parser stay unchanged and outside Git. This does not establish redistribution permission; missing local sheets use the rig fallback. [Scene implementation](../../Documents/Current/campaign-and-scene-actions.md).

## Timing outcome clips, 25 October 2026

Current catalogue **`lab-sprites-05-directed`** has **852 local poses / 19 ignored pages**, plus three generated sheets. Added source intervals: `wall_collision_from_run_and_jump` 8–25 (54 poses), `jump_off` 18–28 (33), `pop_vault_start` 11–31 (63), using the existing offline 60-Hz calibrated pipeline. `npm run prepare:reference` now copies nineteen pages. No publisher parser/painter is vendored.

Outcome aliases include `obstacleHit`, `vaultLate`, `missJump`, `jumpLate`, `slideLate`, `dashLate`, `swingLate`, `cableLate` and `missGrapple`. Existing clips/generated stable poses supply several aliases; these are not nine newly authored animation sets. Scene recipes own the chosen sequence and playback clock; catalogue owns its frames and anchors. [Choreography](../../Documents/Current/scene-choreography.md) records exact timing and limits. All original-derived frames remain local-only with rig fallback.
