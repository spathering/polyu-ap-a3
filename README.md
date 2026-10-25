# polyu-ap-a3

A browser parkour game for Assignment 3: An interactive experience.

**Status: player menus and separate editor workspace implemented, 25 October 2026.** Main menu → Mode select → Campaign (six authored routes) or Training (three focused routes) → Game scene. Endless is visibly unavailable. Game editor is a separate entry for Level Studio and Motion Lab. One 60 Hz simulator handles baseline movement, four traversal additions, ledge catch/mantle, wall rebound and buffered landing roll. Eighteen editor prefabs share the same content and collision rules. See [campaign/actions](Documents/Current/campaign-and-scene-actions.md), [flow](Documents/Current/game-flow.md), [3C](Documents/Current/reference-driven-3c.md) and [editor](Documents/Current/level-editor.md). Endless generation and final original art remain pending.

## Assignment

- Individual project; 15% of the course grade; marked out of 15.
- Deadline: **1 November 2026, 23:59 Hong Kong time (UTC+8)**.
- Submit the public repository URL on Canvas: [spathering/polyu-ap-a3](https://github.com/spathering/polyu-ap-a3).
- Provide deliberate input, a meaningful response, clear feedback, sensible handling of one relevant error or interruption, and a trial with at least one other person before explaining the experience.
- See the [original assignment brief](Documents/Plans/Requirements/assignment3-brief.md).

## Play and run

Use Node.js 20 or newer. No package installation or build step is required. From the repository root:

```sh
npm run prepare:reference
npm run dev
```

Open `http://127.0.0.1:4173/`. The first command only copies this workspace's existing research frames; omit it if no local archive is available and use the rig fallback. Space jumps, S slides, E dash-grapples, hold Q to swing, F uses the cable, Esc pauses and R retries. Choose Play → mode → route from the main menu. Open Game editor for Level Studio and Motion Lab. Direct station selection, tuning and rehearsals remain at `http://127.0.0.1:4173/lab.html`. Checks: `npm run check`, `npm test`, `npm run rehearse`. Stop serving with Ctrl+C.

**Play online:** [Motion / Run](https://spathering.github.io/polyu-ap-a3/). GitHub Pages publishes `main` from `/(root)` over HTTPS. Visitors need no installation. Missing local research frames use the procedural rig; three generated sheets are included. See [deployment status and verification](Documents/Current/deployment.md).

## Documentation

All repository project documentation uses English. A Chinese counterpart with matching relative paths is maintained locally at `.midwork/assignment3/polyu-ap-a3/`, outside this repository.

| Document | Purpose |
|---|---|
| [STANDARD](STANDARD.md) | Concise rules, language policy and documentation synchronisation. |
| [PROCESS](PROCESS.md) | Development decisions, AI assistance, user trials and checks. |
| [Documentation index](Documents/README.md) | Current, historical and planning documents. |
| [Project structure](Documents/Current/project-structure.md) | Actual repository layout and status. |
| [Modules](Documents/Current/modules.md) | Actual module status and Mermaid relationships. |
| [Glossary](Documents/Current/glossary.md) | Project terms and their meanings. |
| [Game and deployment plan](Documents/Plans/game-and-deployment-plan.md) | Confirmed direction and candidate architecture. |
| [Game requirements](Documents/Plans/Requirements/game-requirements.md) | Parkour mechanics, modes, editor and acceptance criteria. |
| [Reference analysis](Documents/Plans/Research/vector-reference-analysis.md) | Official Vector evidence, inspection limits and design inferences. |
| [Data-driven architecture](Documents/Plans/Design/data-driven-architecture.md) | SSOT ownership and shared runtime/editor boundaries. |
| [Level data and generation](Documents/Plans/Design/level-data-and-generation.md) | Modules, sockets, fixed layouts, seeded assembly, schema and example. |
| [Editor requirements](Documents/Plans/Design/level-editor-requirements.md) | Workspaces, editing, validation, export and production playtest. |
| [3C design](Documents/Plans/Design/three-c-design.md) | Character feel, predictive camera and semantic input. |
| [Character state machine](Documents/Plans/Design/character-state-machine.md) | Session/locomotion layers, guards, interruption and event priority. |
| [Action/scene implementation](Documents/Plans/Design/parkour-scene-implementation.md) | Shared collision queries and environment traversal recipes. |
| [Vector action-image catalogue](Documents/Plans/Research/vector-action-assets.md) | Supplemental promotional stills; separate character-frame extraction linked below. |
| [Original character frames](Documents/Plans/Research/vector-character-frames.md) | 226 rendered character clips, 15,192 transparent PNGs, 349 sheets and source/action mappings; local research only. |
| [Generated traversal art](Documents/Plans/Design/generated-character-actions.md) | Jump-pad, zipline and swing trials: 24 transparent key-pose PNGs with matching names, metadata and prompts. |
| [TODO](Documents/Plans/TODO.md) | Remaining tasks and acceptance criteria. |
| [Leaderboard research](Documents/Plans/Research/github-only-leaderboard.md) | GitHub-only shared score storage: options, constraints and sources. |
| [Change log](Documents/History/Changelog/2026-10.md) | Dated changes and verification evidence. |

## Known limitations

153 automated tests and 24 deterministic recordings pass: 18 lab cases cover 30/30 required events and six complete finite courses. Scene recipes pre-match geometry before input, retain timely/late confirmation until playback and use directed scene/time cameras. Same-obstacle browser checks select three distinct clips; foundations keyboard completion, portrait play and editor preset edit/undo pass. Other-person trials and OS download completion remain unverified. Final original art/audio, endless generation and shared scores remain pending; ignored research pages have a procedural-rig fallback.

## Credits and tools

The [assignment screenshot](Documents/Plans/Requirements/assignment3-source.png) and its English transcription come from the supplied course brief. [Vector](https://vector.game/zh-Hans/) is a design reference. Public official Steam screenshots are archived locally for study, with [source metadata](Documents/Plans/Research/vector-action-assets.md); they are not runtime/deployment assets. At the author's request, public browser animation packs and renderer/parser scripts were later archived locally to export original-data-derived character frames. Selected exported frames now drive local lab presentation from ignored `assets/local-reference/`; they are excluded from Git and public releases. No original parser/painter code or level layout was copied into the runtime. Three generated traversal sheets are versioned with provenance. OpenAI Codex assisted with research, translation, documentation and design; see [PROCESS](PROCESS.md).

Current input/animation rules: [scene actions and synchronization](Documents/Current/scene-action-synchronization.md). Press Space early in the marked vault approach; it executes at the start plane. Vaulting is no longer automatic.

Open `http://127.0.0.1:4173/editor.html` or choose **Game editor → Level Studio**. The scene supports zoom/pan, box/Shift selection, batch movement/duplication/deletion, shared prefab/geometry editing, undo/redo, JSON import/export, local draft recovery and production-runtime quick tests. [Editor controls and limits](Documents/Current/level-editor.md).

Small-module update: **B** draws blocks, **V** selects, and library modules drag directly to the scene. H follows the 1.2 m climb limit; the default H/4 grid is 0.3 m. Occupied bounds include intended approach/action/recovery. Schema 1.3 explicitly converts old 1.2 drafts. See [micro modules and terrain](Documents/Current/micro-modules-and-terrain.md) and the [reference implementation review](Documents/Plans/Research/vector-context-and-micro-modules.md).

Open `modes.html` for modes, `levels.html?mode=campaign` for six fixed routes or `levels.html?mode=training` for three practice routes. `studio.html` is the separate editor launcher. Snap is explicitly on by default; dragged groups align an absolute anchor and retain relative spacing. [Public-runtime 3C review](Documents/Plans/Research/vector-3c-runtime-review.md).

Gameplay now fills the viewport. Use the small floating panels; **?** expands Controls. Hold Space near a marked ledge, then press again to mantle; press Space near a marked wall to rebound; press S before a hard landing to roll. [Six new course guide](Documents/Current/campaign-and-scene-actions.md).

Current 3C: [scene choreography](Documents/Current/scene-choreography.md). In the lab, compare `timing vault timely`, `timing vault late` and `timing vault missed` at the same obstacle. The camera follows the prepared scene timeline; Level Studio edits shared timing/clip/shot recipes.
