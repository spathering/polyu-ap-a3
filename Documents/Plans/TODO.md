# Assignment 3 TODO

Deadline: **1 November 2026, 23:59 Hong Kong time (UTC+8)**. Individual project; 15% weighting; 15 marks. Sources: [brief](Requirements/assignment3-brief.md), [plan](game-and-deployment-plan.md).


## Lab and editor progress, 25 October 2026

- [x] Nine-station return circuit with baseline actions and all four traversal additions.
- [x] Native JavaScript/Canvas, one 60 Hz simulator, shared sweeps/input/camera and visible state feedback.
- [x] Prepared reference/generated sprites as default, one animation catalogue, foot/grip alignment and missing-image fallback.
- [x] 102 automated tests, 15 deterministic rehearsals, 26/26 events and a full lap.
- [x] Corresponding English/Chinese Current documents, PROCESS and history.
- [x] Floating-panel finite/prefab editor, shared-runtime quick tests, local recovery and ten current micro-editor browser scenarios.
- [ ] Endless generation, advanced editor tools, production animation, human feel/external trial and Pages release.

The lab is not full product acceptance; broader product tasks remain below.

## Completed preparation

- [x] Confirm the repository and small-game/Pages direction.
- [x] Establish root README, PROCESS, concise STANDARD and Current/History/Plans documents.
- [x] Document actual structure and module status with Mermaid, and retain the course brief/screenshot.
- [x] Convert repository documents and paths to English and create a matching local Chinese tree.
- [x] Add a project glossary.
- [x] Research GitHub-only shared leaderboard feasibility; record sources and limits without implementing it.
- [x] Analyse official Vector material, recording the pre-start inspection boundary and unverified behaviour.
- [x] Specify requested traversal, finite/endless modes, SSOT, level data and editor requirements.
- [x] Create a proposed JSON Schema and fixture; validate shape, five invalid cases and selected references/seams.
- [x] Specify 3C, session/locomotion state diagrams and action-to-scene implementation recipes.
- [x] Archive/classify 17 official promotional images locally and record provenance/rights/uncertainty metadata (supplemental stills).
- [x] Unpack public original browser character animation data and export 226 clips / 15,192 transparent frames, 349 sheets and 290 named-action mappings; preserve source bytes and validate offsets, hashes and sampled sheet pixels.
- [ ] Study selected reference action anticipation/support/recovery and create our own runtime animation catalogue, including all four added traversal types; do not import research art into Pages by default.
- [x] Generate a first jump-pad/zipline/swing art trial: 3 clips, 24 transparent key poses, sheets, naming, prompt/provenance metadata and pixel checks.
- [ ] Review/accept trial direction, unify the production actor/rig, add in-betweens and sustained-motion loops, and calibrate attachment/state blending in runtime.
- [x] Extend the proposed schema/fixture to 1.1.0 with single-owner camera/controller/vault parameters.

## Game design and implementation

- [ ] Name the game; confirm target devices and refine the proposed side-view/auto-run controls and movement tuning.
- [ ] Specify action, state change, feedback, progress/outcome and applicable restart flow.
- [x] Choose a small scope and static-browser technology; explain additions if reusing a course example or Assignment 2. (Character-lab scope.)
- [x] Choose one relevant error/interruption and its handling. (Character-lab scope.)
- [ ] Implement source, necessary assets, dependencies and the complete core interaction loop.
- [x] Add understandable instructions and applicable start/retry/back/stop controls. (Character-lab scope.)
- [x] Verify selected failure handling and explain one actual action-to-response code path. (Character-lab scope.)
- [x] Document exact preview/build commands; if Python is used, include exact `uv` commands and dependency metadata or requirements. (Character-lab scope.)
- [ ] If services/models are used, explain setup and supply a sample/demo for unavailable dependencies.
- [ ] Update Current documents, glossary, diagrams, affected README and Chinese counterparts with every code/configuration change.
- [ ] Preserve meaningful incremental commits and relevant verification records.

## Required traversal, modes and editor

- [x] Implement shared content loading/schema and one semantic validator; inspector edits validate against the same contract.
- [x] Implement normal movement, jump tolerances, slide/stand-up clearance and context vaulting. (Character-lab scope.)
- [x] Implement dash grapple acquisition/preview, swept travel, cancellation and exit policy. (Character-lab scope.)
- [x] Implement swing constraint, release momentum, occlusion and attachment lifetime. (Character-lab scope.)
- [x] Implement zipline capture/path travel/exit and one-shot/rearming jump pads. (Character-lab scope.)
- [x] Verify one motion owner per tick and mixed-mechanic transition routes. (Character-lab scope.)
- [x] Implement the shared swept body/trigger kernel, one-way support, crouch recovery and explicit interruption/event priority from the state specification. (Character-lab scope.)
- [x] Implement semantic input edges/buffering, preview-target ID consistency and focus/pause hold cleanup. (Character-lab scope.)
- [ ] Implement data-owned camera framing/prediction/dead zone, finite/endless bounds, aspect-ratio and attachment visibility checks.
- [ ] Create original animation/pose assets and bind them to committed movement events without a second root-motion controller; do not ship reference screenshots.
- [x] Author a lab finite layout with nine shared prefabs, sockets, spawn/finish and repeatable retry.
- [ ] Qualify modules with compatible state envelopes, conservative routes and same-runtime rehearsal.
- [ ] Implement seeded, versioned endless selection, bounded attempts/lookahead, compatible recovery and difficulty/repetition rules.
- [ ] Verify sequence determinism under frame/batch changes, active window limits, pinned attachments and long-run coordinates.
- [x] Implement finite/prefab workspaces, floating panels, zoom, batch editing, validated inspectors and seam diagnostics.
- [ ] Implement endless workspace and graphical socket/route/profile tools.
- [x] Implement transactional undo/redo, safe import/export, local autosave recovery and canonical round-trip.
- [x] Implement frozen full-layout, selected-start and isolated-prefab tests with the production simulator.
- [ ] Implement seeded generation preview and fixed-tick witness authoring.
- [ ] Deliver all requested mechanics, both modes and editor; refine content counts without removing mandatory scope.

Specifications: [requirements](Requirements/game-requirements.md), [architecture](Design/data-driven-architecture.md), [data/generation](Design/level-data-and-generation.md), [editor](Design/level-editor-requirements.md).

## User trial

- [ ] Have at least one other person try the game before explaining it.
- [ ] Record attempts, hesitation and understanding of feedback.
- [ ] Make one improvement or explain retaining the design; record the observation and response in PROCESS.

## Pages delivery

- [ ] Build the static site and record output paths and commands.
- [ ] Check assets and refresh under `/polyu-ap-a3/`.
- [ ] Configure Pages and a suitable build/check/deployment workflow.
- [ ] Verify live play, the main loop and selected error handling on target devices/browsers.
- [ ] Add the verified URL, controls, screenshot and limitations to README.

## Optional leaderboard: decision before implementation

- [ ] Decide whether a shared ranking is worthwhile for the selected mechanic.
- [ ] Decide whether GitHub login, an Issue submission page and asynchronous updates are acceptable.
- [ ] Choose GitHub-only Issue records/public JSON or revise service constraints; do not embed a repository write token in the game.
- [ ] Define score ordering, tie rules, identity, game version, validation and spam handling.
- [ ] If selected, prototype submission, persistent records, aggregation/readback, concurrency and unavailable-service behaviour.
- [ ] Verify that publishing actually runs; do not assume a `GITHUB_TOKEN` push triggers a separate workflow.
- [ ] Test public data visibility, API limits, delayed updates and score trust; document actual limits.

These are optional project tasks, not additional course requirements. See [research](Research/github-only-leaderboard.md).

## Documentation and submission

- [ ] Complete README: idea, player, main interaction, reproducible run steps, screenshot, live link and limitations.
- [ ] Consider a short recording for sound/animation if useful (optional).
- [ ] Complete PROCESS: initial idea, real changes/reasons, trial/response, AI tools and uses, and actual kept/revised/rejected suggestions when applicable.
- [ ] Credit shareable borrowed code, data and media, including course examples.
- [ ] Keep English files and local Chinese counterparts aligned; archive superseded plans when useful.
- [ ] Reproduce the main action from a fresh terminal and test the selected interruption.
- [ ] Check source, assets, documentation, credits and visible history; exclude secrets, personal information and recordings of others.
- [ ] Verify the repository is public, belongs to the author and opens while signed out.
- [ ] Submit the repository URL on Canvas before the deadline.

| Criterion | Marks | Evidence |
|---|---:|---|
| Interaction and design | 5 | Clear intent and meaningful input/response/feedback. |
| Working implementation | 4 | Working interaction and reproducible setup. |
| Usability and iteration | 3 | Understandable feedback, relevant error handling and trial-informed decision. |
| Process and communication | 3 | Useful README, honest process, credits and history. |
| Total | 15 | |

## Scene synchronization progress

- [x] Inspect archived reference action logic; implement detector volumes, expiring early input, alignment, contact and debug feedback.
- [x] Local 60-Hz reference poses, slide entry/exit, scale/grip calibration and read-only presentation interpolation.
- [ ] Full production generated-action loops/cross-clip skeletal blending and real browser feel trial.

## Small-module increment, 25 October 2026

- [x] Re-fetch public player/move sources, compare archive hashes and document phase/contact findings.
- [x] Separate station-sized scenes into small action modules and shared terrain, with normalized entry pivots.
- [x] Derive intended approach/action/recovery bounds without an authored fixed module-size field.
- [x] Add native library drag/drop, placement ghosts, exact coordinates and an H-calibrated block brush.
- [x] Match painted low blocks to swept vault/climb, retain next-marker inputs near action end and preserve captured target identity.
- [x] Add real traversal velocity, stable camera focus/prediction, sequence clocks and landmark-matched gait re-entry.
- [x] Prepare a hand-support climb interval with exact bounded contact and explicit legacy schema conversion.
- [ ] Qualify arbitrary action/terrain compositions, all grapple-release envelopes and reusable generation patterns before enabling endless generation.

## Main menu and public-runtime progress, 25 October 2026

- [x] Inspect public player/moves/camera/view/pad and record exact hashes.
- [x] Add acceleration-limited following, two-pose visual velocity stitching and blocked-approach eligibility.
- [x] Explicit Snap on by default; absolute batch anchor, entry-pivot drop and H-scaled visible grid.
- [x] Main menu, data-owned selection, three finite challenge views, ready/pause/retry/result/next/back and local best time.
- [x] Preserve the complete lab at `lab.html`, shared runtime and missing-art fallback.
- [ ] External-person trial, final original animation, distinct campaign scenery, certified endless generation and shared scores.

MOTION / RUN is a provisional title. Earlier unchecked complete-flow tasks are now implemented within these finite views; full product acceptance remains open.

## Full-scene and six-course increment

- [x] Replace the outer gameplay page with a viewport-filling scene and small floating HUD/control panels.
- [x] Add deliberate ledge hang/mantle/drop/timeout, one-use wall rebound and buffered hard-landing roll with clearance-safe recovery.
- [x] Match dedicated local pose frames, stable roll support and wrist contact; preserve rig fallback.
- [x] Add six independent finite layouts, socket-derived checkpoints, editor access and complete recorded production routes.
- [x] Nine-entry selection, 130 tests and 21 rehearsals; actual keyboard/pointer scene-action browser checks.
- [ ] Other-person trial, final original art/animation/audio, certified endless generation and shared scores.

## Scene director correction, 25 October 2026

- [x] Prepare scene geometry/three branches before input; retain first confirmation until the selected playback slot.
- [x] Timely vault, slower salvage vault and collision failure on the same unit; late/missed mappings for all seven marked action kinds.
- [x] Scene/time camera rails independent of instantaneous player roots; continuous approach/playback/recovery and secondary-action shots.
- [x] Shared editor presets, clip/key validation, undo and production quick-test integration.
- [x] Same-obstacle three-way witnesses; 149 tests and 24 qualified recordings cover 30/30 lab events and six finite completions.
- [ ] Human feel trial, final original per-variant animation/in-betweens, arbitrary terrain/attachment composition qualification; endless generation remain open.

## Player menu organization, 25 October 2026

- [x] Main menu, mode select and mode-filtered level select, with keyboard/pointer navigation and mobile layouts.
- [x] Six Campaign / three Training entries, disabled Endless; one catalogue-owned membership source.
- [x] Pause/restart/result and mode-local next/back; retain existing local best-time IDs.
- [x] Separate Game editor launcher preserves Level Studio and Motion Lab diagnostics.
- [x] 153 tests, unchanged 24 qualified recordings and ten menu browser scenarios.
- [ ] Implement certified endless generation; external usability trial, original release art/audio remain pending.

## Verified Pages release, 25 October 2026

- [x] Enable main/root branch publishing with HTTPS.
- [x] Verify public menus, gameplay completion/progress, preserved editors and mobile layouts.
- [x] Compare 21 public source/assets against committed Git bytes; record missing-art behavior.
- [x] Fix restart-control visibility during ready/results.
- [ ] Replace local-only reference character frames with final shareable production artwork; external trial and endless generation remain pending.

## Reference atlas release, 26 October 2026

- [x] Bundle the 19 catalogued reference atlases, retain source credit and publish them through Pages.
- [x] Reuse canonical animation metadata for local and public rendering; no physics duplication.
- [x] Require all 22 runtime sheets/hashes in content and crop checks; keep archive-free startup.
- [ ] Final original production art/in-betweens, external trial and endless generation remain pending.
