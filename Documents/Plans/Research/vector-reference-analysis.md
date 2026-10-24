# Vector reference analysis

Reviewed **22 October 2026**. Requested reference: [Vector's official Chinese site](https://vector.game/zh-Hans/). This note separates evidence from this project's design proposals.

## Evidence and inspection boundary

The [official site](https://vector.game/zh-Hans/) describes browser parkour, running, vaulting and sliding, a pursuit setting, and advertises early access to a level editor. It does not publicly document its level schema or generation architecture.

The developer's [App Store description](https://apps.apple.com/us/app/vector-parkour-run/id578252579) discusses tricks, authored stages and challenge modes. These are mobile-product claims, not verification that every feature exists in the browser build.

Browser inspection reached the embedded game's pre-start screen. It displayed a start control with agreement to terms/privacy; no start action beyond that gate was taken. Thus timing windows, exact browser bindings, scoring formulas, pursuit AI, collision/rope physics, editor availability and endless generation were **not playtested**. That earlier inspection did not extract assets. After the author clarified the frame-art request, the public browser animation packs and renderer/parser scripts were downloaded and inspected; see [character-frame extraction](vector-character-frames.md). No runtime game or reference gameplay playtest is claimed. Public promotional images were subsequently collected separately for local study; source text and reviewed stills are evidence, not a reverse-engineered implementation.

## Breakdown for this project

| Design layer | Transferable design question | Proposed response in our game |
|---|---|---|
| Movement fantasy | How does moving through obstacles feel intentional and fluid? | A compact forward route where timing changes the player's trajectory and motion state. |
| Action/obstacle relationship | Can the player read what action a surface requires? | Distinct low-ceiling, gap, vault, grapple, cable and pad silhouettes with consistent action prompts. |
| Rhythm | How are observation, commitment and recovery arranged? | Teaching space, single-mechanic challenge, safe recovery, then chains; authored modules carry difficulty/recovery tags. |
| Feedback | Can success and failure explain themselves immediately? | State/target cue before commitment; motion, sound or visual confirmation after; explicit failure reason and fast retry. |
| Route progression | What stays fixed and what is variable? | Finite layouts are fully authored; endless layouts assemble the same reusable modules with compatibility rules. |
| Skill | Does mastery create better routes or merely higher numbers? | Landing, release timing and chained traversal matter; optional time/style measures never obscure reaching the finish. |
| Creation | Can the author inspect the same rules the player experiences? | Our own schema-driven editor, shared validator and production playtest runtime. |

These rows are original design inferences. We are not asserting Vector uses sockets, SSOT, seeded modular generation or the proposed movement solver.

## Explicit changes from reference to requirements

The author adds two distinct grapple behaviours, ziplines and jump pads, and explicitly requires finite and endless modes, data-driven SSOT and an editor. They become [our product requirements](../Requirements/game-requirements.md), irrespective of which mechanics Vector includes.

Use the reference's broad parkour readability as inspiration, while creating original routes, visual identity, interaction profiles and data. Avoid importing its progression economy or full commercial scope into this course project. Suggested auto-running, desktop bindings, module counts and teaching order are proposal defaults that remain revisable.

## Further visual analysis

The [image catalogue](vector-action-assets.md) records 17 reviewed official Steam gallery images and their uncertainty notes. These inform [3C](../Design/three-c-design.md), [state design](../Design/character-state-machine.md) and [action/scene mapping](../Design/parkour-scene-implementation.md). Images show poses and context, not exact simulation timing or the browser version's internal behaviour.
