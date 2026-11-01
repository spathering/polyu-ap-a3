# Open character animation assets

The release uses **Adventure Series Character Agent SMS (free files)** by **Chasersgaming**, published under **CC0-1.0** on [OpenGameArt](https://opengameart.org/content/adventure-series-character-agent-sms). The author selected this open pixel-art replacement after the license review. Vector remains a design reference; its extracted character art is no longer in the current tree or runtime catalogue. The three earlier reference-guided imagegen sheets are also retired.

| Release asset | Amount / location |
|---|---|
| Unmodified selected CC0 source images | 8 strips and 1 master-sheet PNG in `assets/character/cc0-agent/` |
| Clip definitions / runtime sequences | 22 / 29 in `assets/character/animations.json` |
| Provenance | Source URL, author, archive hash, original filenames, file hashes and CC0 identifier in the catalogue; local `LICENSE.txt` beside the PNGs |
| Original source samples used | 27 distinct selected samples; unused master-sheet regions are not drawn |
| Legacy extracted / experimental images | Outside the current public tree; previous Git commits are not rewritten |

## Mapping and calibration

`animations.json` is the sole runtime owner of strips, crop rectangles, source-frame indices, sequence aliases, frame clocks, foot/pelvis/contact points, scale and transition settings. Frames are selected from the unchanged source PNGs. No Vector joint samples, body painter, frame anchors or pose signatures are used in the replacement catalogue. Generic existing timing and contact-window configuration remain project data.

The source character is approximately 30 pixels tall. One common pixels-per-metre scale preserves size through all states. Grounded poses use annotated foot anchors; airborne poses use pelvis anchors. High-edge grip and rope/cable attachment use explicit hand points. Running phase still follows distance, and contact constraints take priority over presentation correction. Nearest-neighbor rendering preserves pixel edges. The menu sizes the runner from its physical height rather than a source-specific scale cap.

| Game action | Open-art adaptation |
|---|---|
| Idle / run | Visually checked standing export and unarmed master-sheet RUN row |
| Jump / fall / wall rebound | Reach-jump and airborne samples |
| Climb / mantle / timely vault | Side-hoist poses with shared contact windows |
| Late vault / roll / pad launch | Selected somersault poses |
| Slide / entry / exit | Low side-hoist pose and crouch/stand transitions |
| Swing / cable | Stable grab/reach pose; movement and rotation follow the attachment |
| Missed actions | Hurt/knockback poses with the existing failure behavior |

These are adaptations of a compact pixel-art pack, not dedicated full-motion animations for every sport action. Four-frame running and selected held poses are visibly less detailed than the former reference animation. Slide, vault and grapple polish remain candidates for original open artwork; no claim of skeletal blending or generated in-betweens is made.

## Verification and maintenance

A clean checkout includes every image. `npm run check:art` verifies release provenance and nine unique PNG hashes; `npm run check` validates content and assets. The renderer deduplicates shared strips, so menu, game, lab and editor read the same catalogue without falsely reporting missing images. The rig remains an error fallback. The old reference-restoration command is removed.

184 tests and 30 production recordings pass. Browser checks cover keyboard/touch automatic mantle, section retry, persistent music and editor access. [Permission review](../Plans/Research/character-asset-license-review.md) records accepted and rejected sources. Follow-up human feedback on the new visual style remains pending.

## Running-strip correction

The standalone source filenames were misleading and initially mapped idle-looking frames to running. Catalogue `open-agent-02-run` now selects the four unarmed RUN regions from the original master sheet and retains the standing export for idle. Both menu and game were observed cycling all four correct crops. The regression pins the reviewed master image hash and crop regions, checks actual simulation-driven frame progression and confirms pause freezes it. No physics, camera, speed or action-window tuning changed.
