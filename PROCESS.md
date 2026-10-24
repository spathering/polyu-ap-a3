# Process

This file records actual development, reasons for changes, AI use, user trials and checks. Detailed records are in the [change log](Documents/History/Changelog/2026-10.md).

## Starting idea and current state

The author chose a browser parkour game informed by Vector, with dash/swing grapples, ziplines, jump pads, finite authored levels, modular endless generation, a level editor and strict data-driven SSOT. A native JavaScript/Canvas character lab is implemented, with provisional controls/tuning and processed sprites. A finite/prefab editor is now implemented; endless mode, final art/animation and deployment remain pending.

## Work log

### 22 October 2026: Documentation and direction

- Confirmed the `polyu-ap-a3` repository, branch `main` and remote `https://github.com/spathering/polyu-ap-a3.git`.
- Established root README, PROCESS and STANDARD documents and the current/history/plans categories, with structure and Mermaid documentation.
- Transcribed the supplied course brief, translated it locally and prepared a checklist for a browser game and Pages delivery.

### 22 October 2026: Language policy, terminology and leaderboard research

- The author required English-only repository project documents and a matching local counterpart. Replaced the earlier mixed-language paths and documents with English versions and placed Chinese counterparts under workspace `.midwork/assignment3/polyu-ap-a3/` using identical relative paths.
- Preserved the previous documentation outside the repository in `.midwork/assignment3/archive/2026-10-22-before-english-policy/`. The English course brief remains in the repository; its translation belongs in the local mirror.
- Added a current glossary distinguishing existing documentation, planned game concepts and researched services.
- Researched GitHub-only shared score storage from official documentation. The [research note](Documents/Plans/Research/github-only-leaderboard.md) proposes an optional, authenticated, asynchronous Issues/Actions approach. No leaderboard, Issue, workflow or storage endpoint was created.

### 22 October 2026: Parkour requirements and shared level contract

- The author specified the parkour reference, four environment traversal types, two level modes, SSOT and an editor. Created product requirements, reference analysis and separate architecture, data/generation and editor specifications.
- Inspected the official site and developer's App Store description. Browser inspection reached the embedded pre-start terms/privacy gate; did not start a run, accept those terms, or claim playtested mechanics.
- Proposed side-view auto-running, keyboard mappings and initial content sizing explicitly as design assumptions. These are not user-confirmed control choices or verified Vector behaviour.
- Added a proposed JSON Schema and example package, shared byte-for-byte with the local counterpart. The fixture illustrates all four traversal profiles and entity shapes, a finite layout and an endless preset; it is not a qualified playable level.
- Validated the schema and example with local `jsonschema` tooling installed outside the repository. Rejected five invalid structural mutations and checked fixture references and seam alignment. Physics, reachability, editor behaviour and generation are unimplemented.
- Extended current structure, modules/glossary, STANDARD, plan and TODO, and the matching Chinese tree.

### 22 October 2026: 3C, state decomposition and action-image archive

- Added character/camera/controls design, session and hierarchical locomotion diagrams, guarded transitions and action-to-scene collision/authoring recipes. Separate cosmetic trick poses from the physical motion owner and treat pad/landing as events.
- Extended the proposed schema/example to 1.1.0 for authoritative controller, vault, camera and swing-targeting fields; preserved the previous 1.0.0 pair in a local archive. Values remain untested fixtures and no migration/runtime code exists.
- Obtained 17 unmodified public promotional JPEGs from the official Steam page using supported browser asset export and visually reviewed all of them. Classified 10 gameplay stills, three trick-card screens and four context screens into six local folders.
- Stored originals only under workspace `.midwork/assignment3/reference-assets/vector/`; added an offline gallery and a canonical source/hash/dimension/rights/uncertainty manifest with identical local/Chinese copies. No reusable runtime-asset licence was identified, so the images are not game/deployment assets.
- The metadata API fetch failed; gallery-based export succeeded with 17/17 images and no export failures. No login, purchase, game start, terms acceptance, game-bundle extraction or AI-generated substitute image was used.
- An isolated slide sequence, complete animation cycles and screenshots proving the project's four added traversal mechanics were not obtained. State machines, tuning and movement algorithms are our proposals, not verified reference internals.

### 22 October 2026: Corrected character-frame scope and original-data extraction

- The author clarified that action images mean original character frame animation, permitting unpacking. Revised the earlier AI interpretation: promotional screenshots are supplemental and are not the requested character art.
- Inspected the official browser build's public body painter, action catalogue, byte parser and loader. Downloaded 16 public animation pack parts; preserved all source bytes/URLs/digests outside the repository and unpacked 259 clips / 20,435 samples without an access-control bypass.
- Used the unchanged original HERO body painter to rasterize 226 human clips / 15,192 transparent PNGs, with 349 sheet pages, 226 sampled contact sheets and 290 named action intervals. Preserved 33 cinematic/prop clips as bytes without misapplying the human rig; bike output is character-only.
- Kept one PNG sequence per original clip, with source-index/range/anchor/flag/hash metadata and a local offline action player. These are original skeletal-data-derived frames, not pre-existing raster sprite extraction or a live gameplay recording. No source code/art was imported into the game runtime or deployment.
- Automated validation passed source/pack-slice/frame/sheet digests, 326 action mappings, all PNG RGBA headers/dimensions, and 678 first/middle/last-frame transparency/margin/exact sheet-pixel comparisons. Visual review caught deferred mutable-canvas drawing in the first derived contact/sheet pass; rebuilt these from immutable PNG snapshots and verified cell pixels before delivery.
- Browser checks confirmed filtering, action selection, pause, next-frame navigation and loaded PNG/contact images. Updated English documentation and the matching Chinese tree. The [extraction note](Documents/Plans/Research/vector-character-frames.md) records sources, placement, timing and limitations. Runtime and user trials remain pending.

### 24 October 2026: Generated traversal key-pose trial

- The author asked to try PNG generation for jump pads, ziplines and swings using existing material. Used the built-in `image_gen.imagegen` tool with the reviewed run/vault contact sheets as style/proportion references, one generation call per mechanic. Exact prompts are recorded in the [trial note](Documents/Plans/Design/generated-character-actions.md).
- Saved all three generated transparent source images locally without overwriting original references. Created eight key poses per clip, 24 independent 512 x 512 RGBA PNGs and three 2048 x 1024 sheets with the established `snake_case`, `frame-0000.png`, `sheet-00.png` and `frames.json` conventions.
- Used lossless crop/integer translation rather than resizing or repainting during packing. Visual pelvis and hand estimates are explicit annotations, not recovered rig data. One source silhouette extends beyond its nominal equal grid cell, so component-based crop rectangles preserve the full body.
- Visually reviewed all poses and passed 24 transparent/nonempty/margin and exact atlas-cell pixel comparisons. These are trial key poses with minor proportion/hand-detail variation; no production acceptance, in-betweens, seamless loops, runtime contacts or game integration is claimed. Updated the matching English and Chinese documents, current structure/module/glossary and TODO.

### 24 October 2026: Character lab and corrected sprite integration

- Implemented a dependency-free JavaScript/Canvas lab with immutable 1.1.0 content, a 60 Hz simulation, swept body/support queries, semantic input and snapshot-driven camera/UI. Nine stations cover jump/slide/vault, dash, swing, cable, pad, chains and recovery; the authored finish returns to spawn and preserves lap/coverage totals.
- Kept geometry/profiles/controls/camera in one runtime content package, and lab checkpoints/rehearsals in a separate lab-owned file. Spawn/finish derive from finite socket references. The old design fixture remains illustrative; the schema's endless descriptor is not an implemented generator.
- Rehearsal exposed a failed swing landing and cropped framing. Adjusted the runtime anchor/landing/range and made the camera anticipate the arc's lowest point; recorded a complete circuit witness through the real simulator.
- The author observed that the page still used the procedural character instead of the prepared assets. Corrected this: Processed sprites is now default, using eight reference clips (ten local pages) and the three generated sheets. Added one runtime crop/anchor/sequence catalogue, state/event selection, foot/grip alignment, release poses, paused-time freezing and missing-image status/fallback. Reference pages remain ignored local research material, prepared by a hash-checking copy tool; no original renderer/parser code is part of the runtime.
- Retained the AI-assisted fixed-step/data ownership approach for the prototype; revised the initial procedural-default presentation following the author's concrete feedback. This records an actual revision, not an external playtest or claimed acceptance of all tuning.
- Verification: 49 tests pass, content validates (21 entities, nine stations), and 14 deterministic rehearsals cover all 23 events, including a complete lap. Actual simulation/Canvas/sprite offscreen captures verify representative action selection and framing; local HTTP returns the updated modules/catalogue/PNGs. Browser automation cannot initialise on this host, so browser layout/input feel remains unverified. No editor, seeded endless generation, Pages deployment or commit/push was performed.

### 24 October 2026: Scene-aware actions and sprite stability

- The author reported jitter, inconsistent size and action/scene mismatch. Inspected the unchanged archived browser player/move definitions: bounded input retention, animation-interval and scene/contact guards, detector alignment and pose interpolation informed our revision. Online source reopening failed; the dated archive and hashes are the evidence, not a new live gameplay claim.
- Added schema 1.2.0 scene markers referencing geometry, height/approach/late windows, a single expiring input intent and start-plane/target/clearance checks. Vault now requires early Space and synchronizes one swept route, sprite progress and a bounded hand-contact correction. Pads use centre-foot contact; swing/cable physics, camera and art share an authoritative grip.
- Replaced the elapsed-time/current-speed run clock with travelled distance, added read-only snapshot interpolation, calibrated actor/anchor metadata and stable hanging poses. Prepared 465 local 60-Hz reference poses on 11 pages from interpolated original joints, adding slide entry/exit. Kept original PNGs/bytes intact and all reference derivatives ignored; generated key poses remain provisional.
- Retained the author's detector/queued-alignment direction and replaced the earlier automatic vault and rapid generated-pose cycling. This is a concrete revision from author feedback, not the assignment's external-user trial.
- Verification: 66 tests, 15 deterministic rehearsals and 26/26 covered events, including a full lap. Independent Draft 2020-12 validation passes the schema, runtime content and fixture. Offscreen captures inspect actual prepared images and contact/framing; all 14 required sprite pages and new modules return HTTP 200 locally. Browser automation still fails during host initialization; browser feel, external trial, editor/endless generation and release remain pending. No commit, push or deployment performed.

## Decisions and revisions

The author retained the three documentation categories and code/configuration documentation update rule, and revised the initial mixed-language layout to English-only repository files. The local Chinese tree follows the English relative paths to make correspondence explicit.

The parkour direction and requested features now supersede the previously unspecified genre. Shared data and one production simulator are required boundaries; the lab now implements the baseline algorithms in native JavaScript/Canvas against the shared schema. The finite/prefab editor now uses those boundaries; endless generation remains a proposal. A shared leaderboard remains optional, independent of core play.

## AI use and sources

OpenAI Codex assisted with screenshot transcription and translation, repository inspection, documentation, terminology, Mermaid diagrams, leaderboard research, Vector reference analysis and the proposed parkour/editor data contract. Sources are linked in the [leaderboard note](Documents/Plans/Research/github-only-leaderboard.md) and [Vector analysis](Documents/Plans/Research/vector-reference-analysis.md).

The initial AI-produced mixed-language document layout was revised following the author's English-only instruction. Documentation categories and the required traversal/modes/editor were specified by the author; camera/control defaults, detailed algorithms and leaderboard design remain AI-assisted proposals. The author specifically rejected the procedural-default presentation by requesting prepared sprites; the correction and its implementation are recorded above. Future entries should describe real choices and their reasons without inventing an acceptance or rejection.

## User trial and response

**Pending.** Ask at least one other person to try the playable game before explaining it. Record attempts, hesitation and understanding of feedback, then make an improvement or explain why the design was retained. Do not publish identifying details or recordings of other people.

## Verification status

Documentation and contract checks cover corresponding English/Chinese trees, links, diagrams, shared schema/runtime/example validation and invalid inputs. 82 Node tests and 15 production rehearsals pass (26/26 event coverage). Twelve headless Edge CDP editor scenarios pass with no browser exceptions, including scene gestures, draft transactions, isolated vault playtest and recovery. OS download completion, human feel/external trials, endless generation, shared scores and public deployment remain unverified.

## 24–25 October 2026: transition polish and Level Studio

- Author feedback: the scene-aware version was much improved, with some remaining motion/animation jitter; requested a scene-first editor, movement prefabs, hideable floating panels, zoom, batch editing and quick tests. This is author feedback, not the assignment's independent user trial.
- Split the monolithic lab module into nine canonical movement prefabs; the finite circuit references them, preserving obstacle/action-plane world positions. Shared module definitions own 37 local entities and 11 markers. No second prefab/collision authority was introduced.
- Implemented floating draggable/resizable panels, pan/zoom/snap, box/Shift selection, batch move/duplicate/delete, typed geometry, advanced shared module/detector/socket editing, independent variants, finite-level settings, seam warnings, validated undoable import/export, local recovery and frozen production-runtime quick tests. Advanced endless, witness and graphical route tools remain planned.
- Corrected discrete pose timing at interpolated state boundaries and future-event selection. Added catalogue-driven pelvis/rotation inertia, pause/reset boundaries and exact-contact bypass. Tried short image crossfades, then discarded them after real browser screenshots showed duplicate silhouettes; retained one opaque sprite and calibrated visual correction. Full skeletal blending and generated-action in-betweens remain pending.
- Codex implemented code/tests, split authored data, prepared bilingual documents and operated local browser CDP checks. Existing source art and original painter/parser were not copied into runtime code; no new art was generated in this increment. The original browser automation host failed; an isolated temporary headless Edge session provided actual DOM/input/canvas validation through the browser skill.
- Verification: 82 automated tests; 15 deterministic production rehearsals, 26/26 events and a full lap; twelve browser scenarios with zero exceptions. Export Blob/filename/content were checked before OS download (completion unverified). User trial, seeded endless generation, final release art and Pages publication remain pending. No commit, push or deployment was performed.


## 25 October 2026: GitHub version checkpoint

- The author requested pushing the current version to GitHub with an English commit message.
- Prepared the character lab, nine shared movement prefabs, Level Studio, generated traversal sheets, tests and English project documentation as one version checkpoint. The Chinese counterpart and original reference-art archive remain outside the repository; ignored local-reference sprite pages are excluded.
- Fetched `origin/main` and confirmed the local baseline matches it before committing. The latest implementation validation passed 82 tests, 15 production rehearsals and the recorded browser checks. This checkpoint does not configure or publish GitHub Pages.
