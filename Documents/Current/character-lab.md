# Character 3C and looping test course

Open `pages/lab.html` through the game editor workspace. Run `npm run dev` from the repository root; a clean checkout needs no private art archive. The lab shares the production simulator, content schema, camera, renderer and [CC0 character catalogue](animation-assets.md).

## Motion and controls

| Intent | Input / behavior |
|---|---|
| Forward run | Automatic acceleration toward the content-owned speed |
| Jump, vault, low climb | Space / Up; scene input confirms a prepared action and waits for alignment |
| High edge | One deliberate jump can catch, settle briefly and automatically mantle; S drops during the grip |
| Slide / landing roll | S / Down; head clearance controls standing recovery |
| Dash | E; capture the eligible anchor and sweep toward it |
| Swing / cable | Q; hold/release to swing, contextually press to attach/detach a cable |
| Jump pad | Eligible top-face foot contact triggers the shared impulse rule |
| Pause / retry | Escape / R; clears held input and transient presentation state |

Nine stations cover run, jump, slide, vault, dash, swing, cable, pad and chained traversal. Eighteen lab recordings cover 30 required events; twelve additional campaign recordings cover the authored routes. The lab retains failure snapshots for diagnosis. The player session separately owns automatic section retry without a failure menu.

## Ownership and presentation

`content/parkour.json` owns the body, fixed 60 Hz rules, modules, scene recipes and motion parameters. `content/lab-course.json` owns station references, diagnostic UI and rehearsal inputs. `content/content-package.schema.json` is shared with the editor. Geometry is compiled once and presentation never writes collider state.

Matched scenes prepare timely, late and missed outcomes before input. A confirmed variant waits for its start window. Vault/climb/mantle paths are swept against the same world; attachments and wall/ledge checks use shared collision queries. Directed shots cooperate with scene playback rather than tracking animated root jitter. Free motion retains bounded follow and visibility guards.

The default sprite mode uses nine openly licensed CC0 strips, calibrated to one scale. Foot, pelvis and hand anchors are recorded in the shared catalogue. Pixel frames use nearest-neighbor sampling; run phase follows distance. The diagnostic rig remains selectable and is also the missing-image fallback. See [scene synchronization](scene-action-synchronization.md) and [current retry/climb rules](continuous-play.md).

Verification: 183 tests, 30 production recordings and browser checks for menu/game/editor, keyboard/touch automatic mantle, wall-stall recovery and continuous audio. New pixel-art feel and broader device coverage still need player review.
