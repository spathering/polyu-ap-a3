# Project structure

Updated **25 October 2026**. A static JavaScript/Canvas character lab is implemented. See [controls and test matrix](character-lab.md) and [module relationships](modules.md). The finite/prefab editor is implemented; endless product flow remains planned.

```text
polyu-ap-a3/
  README.md, PROCESS.md, STANDARD.md
  index.html, modes.html, levels.html, play.html, studio.html, lab.html, editor.html
  menu.css, play.css, style.css, editor.css, package.json, .nojekyll, .gitignore
  content/
    parkour.json                 # Runtime movement, profiles, geometry and finite layout
    lab-course.json              # Stations, checkpoints, coverage and input rehearsals
  src/
    editor.js, editor-model.js, editor-view.js # Floating-panel editor, transactions and scene
    module-space.js              # Derived geometry/action bounds, H grid and placement pivot
    pose-transition.js           # Simulation-time visual root/rotation inertia
    main.js                      # Loading, fixed-step scheduling, controls and UI
    content.js                   # Schema subset, semantic checks, immutable world expansion
    collision.js                 # Shared sweep, support, clearance and cable queries
    simulation.js                # Single motion owner, queued context and session state
    scene-actions.js             # Geometry-derived detector windows and action trajectory
    presentation.js              # Read-only fixed-snapshot interpolation
    input.js                     # Semantic keyboard/pointer edges and focus cleanup
    camera.js                    # Snapshot-driven framing
    animation.js                 # Snapshot-to-sprite selection
    renderer.js                  # Canvas scene, sprites and optional debug rig
    rehearsal.js                 # Recorded semantic input replay
  assets/
    character/animations.json    # Canonical runtime frame, anchor and sequence catalogue
    character/README.md
    generated/                   # Three generated traversal sheets and credits
    local-reference/             # Ignored local research pages; never part of Git/Pages
  tools/
    serve.mjs, check-content.mjs, rehearse.mjs, prepare-reference-art.mjs
  test/
    simulation.test.js, input.test.js, animation.test.js, scene-actions.test.js
    editor.test.js, presentation.test.js, micro-modules.test.js
  Documents/
    README.md
    Current/                     # Structure, modules, glossary and character lab
    History/Changelog/2026-10.md
    Plans/
      TODO.md, game-and-deployment-plan.md
      Requirements/              # Course brief/image and game requirements
      Research/                  # Vector and GitHub-only leaderboard research
        VectorAssets/            # Source/hash metadata; no original frame PNGs
      Design/                    # 3C, state/scene, SSOT, level/editor contracts
        Schemas/                 # Shared 1.3.0 content schema
        Examples/                # Illustrative fixture, not runtime defaults
        GeneratedAssets/         # Generation provenance and exact prompts
```

No runtime dependencies or bundler are required. `npm run dev` serves the repository; `npm run check`, `npm test` and `npm run rehearse` verify content and simulation. `npm run prepare:reference` copies hash-checked, already extracted pages from the workspace research archive into the ignored local directory. An optional argument supplies a different archive root. See [asset ownership](../../assets/character/README.md).

The English project documents are mirrored in Chinese at workspace `.midwork/assignment3/polyu-ap-a3/` with matching relative paths. Only documents and their supporting contract/image files are mirrored; runtime code, content and animation catalogues have one owner in this repository. Original source packs, generated masters, authoring tools and offscreen QA remain outside Git in `.midwork/assignment3/`.

The root is the static browser output; `.nojekyll` is present. GitHub Pages now publishes main/root automatically; see [deployment](deployment.md). Local reference art is intentionally absent from a clean clone; missing sprite images use the rig fallback and an explicit load status.

New current guide: [scene action synchronization](scene-action-synchronization.md); new research: [reference runtime interaction](../Plans/Research/vector-runtime-interaction.md). Smoothed reference derivatives contain 516 poses on 12 pages, alongside three generated sheets.

[Level Studio](level-editor.md) uses the shared 1.3.0 contract. Runtime content now owns fifteen small library modules plus one shared terrain definition (39 local entities), composed by the lab finite layout. No separate editor prefab file or runtime-code mirror is maintained.

## Main-menu and finite-flow files

- `index.html`, `levels.html`, `menu.css`, `src/menu.js`: home and level selection.
- `play.html`, `play.css`, `src/play.js`: challenge lifecycle, timer, result and local best time.
- `lab.html`, `src/main.js`: original loop, tuning and rehearsals, formerly at the root.
- `content/game-flow.json`, `src/game-flow.js`: metadata/references, validation and immutable views.
- `src/editor-snap.js`: absolute anchor snapping; `test/game-flow.test.js`: additional regressions.
- [Game flow](game-flow.md) and [reference-driven 3C](reference-driven-3c.md): current behavior.

These files extend the preceding lab/editor tree. Main/selection/finite result flow is implemented; endless generation remain pending.

## Full-scene and six-course additions

`src/scene-traversal.js`, `test/campaign.test.js` and `test/fixtures/campaign-rehearsals.json` add scene queries and qualified route recordings. Existing `parkour.json`, `game-flow.json`, play HTML/CSS/JS, menu and editor files own the six maps, nine-entry selection, viewport-filling canvas, small HUD panels and expanded traversal inspector. Reference-derived animation pages remain ignored; the catalogue now maps 702 local poses/16 pages and three generated sheets. See [current campaign/actions](campaign-and-scene-actions.md). No new dependencies or build stage.

## Directed-scene files

- `src/scene-performance.js`: pre-input binding, outcome path/clip/shot preparation, animation clock mapping and sequence-reference validation.
- `src/directed-camera.js`: pure scene/time camera sampling and continuous shot blends.
- `test/scene-performance.test.js`: timing variants, deterministic paths, camera noise/rate independence, boundaries and authoring guards.
- `Documents/Current/scene-choreography.md`: implemented contract and same-obstacle comparison procedure.

Current package is `motion-run-07-directed` / `lab-06-directed`; animation `lab-sprites-05-directed` has 852 local poses on 19 ignored pages plus three generated sheets. No dependency or deployment structure changed. The module totals remain 25 definitions, 18 visible prefabs and 56 local entities. The optional 1.3.0 recipe contract is shared by runtime and editor.

## Player/editor navigation increment

`modes.html` adds the mode screen; `studio.html` is the editor workspace launcher. `index.html`, `levels.html` and standalone `menu.css` now form the player menu stack. `menu.js` derives modes/levels/help from validated source data; `game-flow.js` owns mode lookup, membership and next/return destinations. `play.js` uses those helpers and adds full-run restart. `lab.html` and `editor.html` preserve the existing tools and link back to `studio.html`. `package.json` describes the complete game/editor. No geometry, physics or animation changes. See [navigation contract](game-flow.md).

## Published static site

[GitHub Pages](deployment.md) now serves the repository root from main with HTTPS enforced. The existing `.nojekyll` is sufficient; no new build folder, backend or workflow file was added. `play.css` explicitly honors the restart control's hidden state. The public build uses tracked generated sheets and the rig fallback for ignored local reference art.
