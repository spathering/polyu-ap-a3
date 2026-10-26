# Documentation

Repository project documentation is English-only. The Chinese counterpart is maintained outside the repository at workspace `.midwork/assignment3/polyu-ap-a3/`, with identical relative paths and filenames.

| Category | Purpose | Entry points |
|---|---|---|
| Current | Actual project structure, responsibilities and terminology | [Structure](Current/project-structure.md), [modules](Current/modules.md), [glossary](Current/glossary.md) |
| History | Dated changes, checks and archived decisions | [October change log](History/Changelog/2026-10.md) |
| Plans | Discussions, tasks, candidate designs, requirements and research | [Game plan](Plans/game-and-deployment-plan.md), [TODO](Plans/TODO.md), [leaderboard research](Plans/Research/github-only-leaderboard.md), [assignment](Plans/Requirements/assignment3-brief.md) |

Parkour design: [product requirements](Plans/Requirements/game-requirements.md), [Vector analysis](Plans/Research/vector-reference-analysis.md), [SSOT architecture](Plans/Design/data-driven-architecture.md), [level data/generation](Plans/Design/level-data-and-generation.md) and [editor requirements](Plans/Design/level-editor-requirements.md). The data design links its schema and structural fixture; the character lab now implements shared loading, validation and simulation; finite/prefab authoring is implemented in [Level Studio](Current/level-editor.md); endless generation remains pending.

Detailed movement design: [3C](Plans/Design/three-c-design.md), [state machines](Plans/Design/character-state-machine.md), [action/scene recipes](Plans/Design/parkour-scene-implementation.md) and [reference image catalogue](Plans/Research/vector-action-assets.md). Original reference images are stored locally outside the repository; only metadata and analysis are versioned here. The [character-frame extraction](Plans/Research/vector-character-frames.md) adds 226 original-data-derived character sequences and a local action player, separate from the promotional stills.

## Maintenance

- Follow the concise root [STANDARD](../STANDARD.md). [README](../README.md) is the project entry point; [PROCESS](../PROCESS.md) records actual development and AI assistance.
- Every code or configuration change must update Current documents and affected README sections in the same change. Keep actual paths, modules, diagrams, terminology and run/deployment status aligned.
- Document proposals in Plans. Move implemented facts into Current and record significant decisions and checks in PROCESS or History.
- Append dated history. Mark later corrections explicitly; archive superseded plans only when useful.
- Update the Chinese counterpart in the same change. Keep relative paths and links matching; translate prose and diagram labels, not filenames, commands or identifiers. The local assignment counterpart also retains the original English text.
- Add subfolders only when needed. History uses `Changelog`; Plans uses `Requirements`, `Research` and `Design`, with `Schemas` and `Examples` under Design.

The initial standalone `.midwork/assignment3/` brief and checklist are retained as source material; the mirrored project tree is the maintained Chinese reference.

Generated art trial: [jump-pad, zipline and swing actions](Plans/Design/generated-character-actions.md), with manifest/prompt snapshots and local PNG archive. These three eight-pose sequences now drive the default lab traversal sprites; production interpolation/blending remains pending.

Current playable implementation: [character 3C and looping lab](Current/character-lab.md). Processed sprites are the default; the [finite/prefab editor](Current/level-editor.md) is implemented; endless generation remains planned.

Scene synchronization: [current implementation](Current/scene-action-synchronization.md), [reference logic findings](Plans/Research/vector-runtime-interaction.md).

Current small-module work: [terrain brush, placement, action space and climb](Current/micro-modules-and-terrain.md); research: [phase/contact review and source hashes](Plans/Research/vector-context-and-micro-modules.md). Shared schema/example are 1.3.0.

Current entry: [main/selection/finite results](Current/game-flow.md), [3C follow-up](Current/reference-driven-3c.md), [public-runtime evidence](Plans/Research/vector-3c-runtime-review.md).

Current full-scene play, six additional independent layouts and ledge/wall/roll behavior: [campaign and scene actions](Current/campaign-and-scene-actions.md).

Current movement authority: [scene choreography and three timing outcomes](Current/scene-choreography.md). It supersedes earlier root-driven follow and input-first matching descriptions; shared preset editing and same-obstacle rehearsal steps are documented there.

Player navigation now follows [main menu → mode → route → scene](Current/game-flow.md); **Game editor** is a separate workspace for the existing Level Studio and Motion Lab.

Live release: [GitHub Pages configuration, online entry points, artwork limits and verification](Current/deployment.md).

Current public character art: [bundled reference animation assets](Current/animation-assets.md).
