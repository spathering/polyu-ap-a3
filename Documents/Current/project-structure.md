# Project structure

Updated **25 October 2026**. A static JavaScript/Canvas character lab is implemented. See [controls and test matrix](character-lab.md) and [module relationships](modules.md). The finite/prefab editor is implemented; endless product flow and Pages publication remain planned.

```text
polyu-ap-a3/
  README.md, PROCESS.md, STANDARD.md
  index.html, style.css, editor.html, editor.css, package.json, .nojekyll, .gitignore
  content/
    parkour.json                 # Runtime movement, profiles, geometry and finite layout
    lab-course.json              # Stations, checkpoints, coverage and input rehearsals
  src/
    editor.js, editor-model.js, editor-view.js # Floating-panel editor, transactions and scene
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
    editor.test.js, presentation.test.js
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
        Schemas/                 # Shared 1.2.0 content schema
        Examples/                # Illustrative fixture, not runtime defaults
        GeneratedAssets/         # Generation provenance and exact prompts
```

No runtime dependencies or bundler are required. `npm run dev` serves the repository; `npm run check`, `npm test` and `npm run rehearse` verify content and simulation. `npm run prepare:reference` copies hash-checked, already extracted pages from the workspace research archive into the ignored local directory. An optional argument supplies a different archive root. See [asset ownership](../../assets/character/README.md).

The English project documents are mirrored in Chinese at workspace `.midwork/assignment3/polyu-ap-a3/` with matching relative paths. Only documents and their supporting contract/image files are mirrored; runtime code, content and animation catalogues have one owner in this repository. Original source packs, generated masters, authoring tools and offscreen QA remain outside Git in `.midwork/assignment3/`.

The root is the static browser output; `.nojekyll` is present. No release/deployment workflow or verified public play URL exists. Local reference art is intentionally absent from a clean clone; missing sprite images use the rig fallback and an explicit load status.

New current guide: [scene action synchronization](scene-action-synchronization.md); new research: [reference runtime interaction](../Plans/Research/vector-runtime-interaction.md). Smoothed reference derivatives contain 465 poses on 11 pages, alongside three generated sheets.

[Level Studio](level-editor.md) uses the shared 1.2.0 contract. Runtime content now owns nine canonical movement prefabs (37 local entities), composed by the lab finite layout. No separate editor prefab file or runtime-code mirror is maintained.
