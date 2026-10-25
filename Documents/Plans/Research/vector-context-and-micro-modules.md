# Vector context, phase and scene matching review

Reviewed **25 October 2026**. The [official reference page](https://vector.game/zh-Hans/) describes browser parkour and creator-level editing. This implementation review concerns the public browser build, not proprietary mobile/Steam internals or an observed live full-game playthrough.

The browser search tool could read the landing page but could not open the two source endpoints. A direct HTTPS read successfully fetched [player.js](https://vector.game/game/player.js) and [moves.json](https://vector.game/game/moves.json); both were byte-identical to the 22 October local archive. Exact lengths/hashes and scope are in [the review record](VectorAssets/runtime-review-2026-10-25.json). Original source remains outside Git.

| Observed public-browser mechanism | Project application |
|---|---|
| Input has a 21-update lifetime at 60 updates/s; action selection also checks animation intervals, scene conditions and priority. | Keep one expiring intent; permit a next-marker request near the current traversal's end, while retaining one motion owner. Our 0.5 s buffer is a project tuning choice. |
| The switch path resolves named support/contact/centre pivots and can align a contacted corner. | Vault over a narrow obstruction or climb onto a broad low surface, with distinct swept paths and per-action contact windows. |
| The switch routine retains preceding poses, supports entry-velocity adjustment and phase-specific transitions back to run. | Report trajectory velocity, filter camera prediction and choose a compatible run phase using calibrated landmark distance. |
| Move records distinguish safe/exit intervals and include specific run-return frames. | Separate visual landing recovery from accepted input; start each sequence clock at its own entry. |
| Scene and animation rules combine dimensions, position and motion; a state label alone is insufficient. | Reject incompatible marked obstacle dimensions and preserve captured target identity; derive painted-block markers from shared geometry and limits. |

These are behavior findings, not copied implementation. Runtime code does not import the original parser/player/painter. Joint data is used only in the existing offline local-research asset preparation. Reference artwork stays ignored; generated traversal art remains separately credited.

## Scene construction synthesis

Small action components and freely painted terrain are our authoring design. The public landing page does not establish the internals of Nekki's creator editor. Therefore the H-scaled brush, entry-normalized pivots, dynamic footprints, JSON conversion and fifteen-part palette are project decisions, not claims about the reference's editor.

The 1.3.0 contract removes the old authored module-size boxes. Bounds derive from geometry, approach, controller trajectories and intended recovery. Full mathematical reachability, every possible grapple trajectory and the procedural generator remain unqualified. The starting ground descriptor replaces unsupported action-only modules in the disabled endless preset; no seeded generator was enabled.

## Animation selection and limits

Contact-sheet inspection showed that `corner_cling_middle` contains a tumbling motion unsuitable for our short step-up. The implemented climb instead adapts the hand-support interval **12–28** of `monkey_vault`, resampled locally to 51 poses at 60 Hz, with its own bounded contact correction. The original source bytes and previously exported frames are unchanged. The reference subset now totals **516 poses on 12 pages**, plus three generated sheets.

Only the playback catalogue's normalized landmark signatures drive phase matching. Signature comparison and visual root correction do not write to simulation. This raster pipeline approximates continuity; it does not reproduce the reference's complete joint blending or dynamic body physics. The [current implementation](../../Current/micro-modules-and-terrain.md) and dated checks describe the delivered scope.
