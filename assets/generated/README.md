# Generated traversal sprite sheets

Three byte-identical copies of the local `trial-01` sheets provide `jump_pad_launch`, `zipline_traverse` and `swing_grapple`. Each contains eight transparent 512 x 512 key poses, in four columns and two rows. See the [generation record and exact prompts](../../Documents/Plans/Design/generated-character-actions.md).

The default **Processed sprites** mode uses these images for pad, cable and swing states and relevant releases. The shared [character catalogue](../character/README.md) owns runtime crops, estimated anchors and phase selection metadata. No image changes collision or owns root motion. The previous procedural rig remains a selectable/missing-image fallback.

Produced with built-in imagegen using local Vector contact sheets as proportion/style references. Source masters, per-frame PNGs and authoring annotations remain in the local workspace; provenance snapshots are under Documents. The eight poses retain proportion/hand-detail variation and are not qualified seamless production animation.

After the synchronization revision, sustained swing/cable use one calibrated hanging pose with physical rotation/travel rather than a 6-Hz loop of inconsistent silhouettes. Per-frame head/pelvis scale annotations are explicit; full authored loops/in-betweens remain pending.
