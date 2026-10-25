# Project glossary

Updated: **24 October 2026**. These terms occur in current project documents. Their presence does not mean the corresponding feature or service is implemented. Add or revise entries as code, configuration and decisions change.

## Project and game terms

| Term | Meaning in this project | Current use |
|---|---|---|
| Interaction loop | Player input causes a meaningful program response and feedback that informs the next action. | Assignment requirement. |
| Core mechanic | The central repeated interaction: timing and chaining parkour movement through a readable route. | Timing/chaining implemented in the lab; tuning provisional. |
| Game state | Data describing the current game, such as phase, progress and score if applicable. | Owned by the lab simulator. |
| Game loop | Repeated input/update/render work that drives a running game. | Native JavaScript fixed-step update and Canvas render. |
| Feedback | Visible or audible evidence of what a player action changed. | State, motion, targets, logs and coverage visible in the lab. |
| MVP | Minimum viable product: the smallest complete playable scope used to validate the core interaction. | Planning shorthand, not an extra assignment requirement. |
| User trial / playtest | Another person tries the experience before receiving an explanation; observations inform a decision. | Required and pending. |
| Module | A unit with a clear responsibility and dependency boundary; it need not be a separate package. | See actual source boundaries in modules.md. |
| Mermaid | Text syntax used to describe diagrams within Markdown code blocks. | Used for document and candidate architecture diagrams. |

## Delivery and shared-data terms

| Term | Meaning in this project | Current use |
|---|---|---|
| GitHub Pages | GitHub's static website hosting service. | Planned game host. |
| Static site / static artifact | Publishable browser files, such as HTML, scripts and assets; not a continuously running application server. | Planned delivery format. |
| Project base path | The URL prefix `/polyu-ap-a3/` under which project-site resources must resolve. | Must be checked during deployment. |
| GitHub Actions / workflow / runner | GitHub automation, its job definition, and the environment executing those jobs. | Researched; no workflow configured. |
| REST API | HTTP endpoints for reading or changing GitHub resources, subject to authentication and permissions. | Research only. |
| Issue | A GitHub repository record normally used for requests and tracking; a possible authenticated score submission record. | Candidate storage, not a database provisioned for this game. |
| JSON | A structured text data format; a possible generated leaderboard snapshot. | Runtime content and animation metadata format. |
| Leaderboard | A ranking of results shared across players, unlike a best score stored on one device. | Optional research. |
| `localStorage` | Browser storage for one origin/profile; it does not synchronise players' scores. | Possible personal-best storage only. |
| Authentication / authorisation | Establishing an identity / deciding what that identity may do. Logging into GitHub does not grant write access to this repository's files. | Important leaderboard boundary. |
| PAT / `GITHUB_TOKEN` | A personal access token / the repository-scoped workflow token. Neither is an anonymous browser write credential. | Research only; do not ship credentials to players. |
| Asynchronous update | A submission is processed later rather than appearing immediately everywhere. | Expected for an Issues/Actions score flow. |
| Rate limit | A limit on API or service operations; users may share an unauthenticated IP budget. | Research constraint. |
| Anti-cheat / authoritative validation | Checking score legitimacy using trusted rules or execution; identity and numeric range checks alone do not prove a score. | Unsolved design topic. |

Service facts and their official sources are detailed in the [leaderboard research](../Plans/Research/github-only-leaderboard.md) and [deployment plan](../Plans/game-and-deployment-plan.md).

## Parkour and data design terms

| Term | Meaning in this project | Status |
|---|---|---|
| Dash grapple | A rapid collision-checked pull toward a compatible scene anchor; not a free dash. | Implemented in the character lab. |
| Swing grapple | A rope attachment with a length constraint; release retains tangential momentum. | Implemented in the character lab. |
| Zipline | An authored cable path that constrains attached player travel. | Implemented in the character lab. |
| Jump pad | A scene trigger applying one launch policy on eligible contact. | Implemented in the character lab. |
| SSOT | Single source of truth: one authority per fact, with derived read-only consumers. | Required architecture. |
| Data-driven | Authored rules/content determine behaviour within reusable code systems. | Required architecture. |
| Schema / semantic validation | Shape/type contract / checks of references, geometry and meaning beyond shape. | Shared schema subset and selected semantic checks implemented; full editor/generation checks pending. |
| Module definition / instance | Reusable local content / a placement referencing that content without copying it. | Proposed data contract. |
| Socket / contract | A module entry/exit and its admissible or guaranteed motion/clearance envelope. | Proposed seam design. |
| Route witness | Fixed-tick actions showing one intended path; not proof for all possible inputs. | Fifteen recorded lab rehearsals; not a universal route proof. |
| Seed / PRNG / run signature | Initial random seed / owned deterministic generator / content, physics and generator identity plus seed. | Planned reproducibility. |
| Streaming / pinning | Keeping a bounded active content window / preventing removal of still-referenced modules. | Required endless safety design. |
| Fixed step | Simulation advances by fixed logical time increments, independent of rendering. | Implemented at content-owned 60 Hz. |
| Editor playtest snapshot | Frozen content and isolated state running the production simulator without modifying the draft. | Required editor boundary. |

Definitions are developed in [requirements](../Plans/Requirements/game-requirements.md) and the [data architecture](../Plans/Design/data-driven-architecture.md).

## 3C and implementation vocabulary

| Term | Meaning in this project |
|---|---|
| 3C | Character, camera and controls: body/movement feel, framing and player intent. |
| HFSM | Hierarchical finite state machine; session gates plus one locomotion hierarchy, not many competing booleans. |
| Guard / transition / context | Eligibility condition / atomic state change / data owned by the active state. |
| Semantic action / input edge | Device-independent intent / a press or release event rather than repeated held-key messages. |
| Coyote time / jump buffer | Brief eligibility after leaving support / retaining a recent jump press until valid. |
| Swept collision / TOI | Checking the whole movement path / earliest time of impact, avoiding tunnelling. |
| Foot reference / clearance | Body origin at the feet / the volume required for legal posture or motion. |
| Dead zone / lookahead | Camera region tolerating small motion / predictive forward or vertical framing. |
| Arc length / tangent | Distance along a cable path / its local direction, used for zipline travel and exit. |
| Taut / slack rope | Rope at its limiting distance / rope shorter in actual separation than its permitted length. |
| Animation root motion | Animation-driven body displacement; not a competing movement authority in this design. |
| Reference still / sprite sheet | A single research screenshot / a page of structured animation frames. The still archive is the former; the separate character archive now contains locally rendered sheets from original skeletal data, without a runtime redistribution grant. |
| Skeletal sample / rasterized frame | Original joint-coordinate pose / transparent image generated from that pose by the original body painter. |
| Pose step / declared FPS | Runtime sample advancement interval / the source parser's separate declared sample rate. |
| Key pose / in-between | Deliberate action milestone / frames connecting milestones. The generated trial has eight key poses per clip and no qualified in-betweens. |
| Estimated presentation anchor | Visually annotated pelvis or hand point for local image alignment; not an authoritative physics joint or collision body. |

See [3C](../Plans/Design/three-c-design.md), [state machine](../Plans/Design/character-state-machine.md) and [image catalogue](../Plans/Research/vector-action-assets.md).

## Lab animation terms

| Term | Meaning |
|---|---|
| Processed sprites | Default presentation using prepared reference and generated atlas frames. |
| Animation catalogue | Canonical `assets/character/animations.json` crop, anchor, scale and sequence metadata. |
| Rig fallback | Procedural silhouette used for missing images or selected debugging. |
| Snapshot identity | Reset generation used to ignore earlier pad/release events after retry. |
| Offscreen capture | Actual simulation and Canvas rendering outside a browser; not browser-layout/input evidence. |

## Scene synchronization terms

| Term | Meaning |
|---|---|
| Scene action marker | Entity reference, input and spatial window compiled into a detector. |
| Pending intent | One expiring action request retained while motion continues. |
| Alignment plane | Start-world-X position required before committing a contextual move. |
| Grip offset | Raised-hand reference shared by physics, camera and presentation. |
| Contact correction | Brief bounded visual placement, never collision movement. |
| Skeletal resampling | Interpolate source joints before rasterization, rather than blend bitmap images. |
| Presentation interpolation | Read-only smoothing between fixed snapshots without advancing gameplay. |

## Level Studio and transition terms

| Term | Meaning in this project |
|---|---|
| Movement prefab | One canonical module definition bundling geometry, traversal markers, sockets and routes. |
| Instance | A finite-layout reference to a prefab ID plus translation; no copied editable geometry. |
| Shared edit / unique variant | Editing a definition updates all references; making unique creates a new definition and optionally redirects one selected instance. |
| Atomic transaction | A complete candidate edit validated before replacement; failures keep the old draft and undo history. |
| Marquee | A scene rectangle selecting intersecting entities/instances, optionally extending selection. |
| Socket seam | A from-exit/to-entry connection; spatial gaps and incompatible posture/velocity envelopes generate authoring warnings. |
| Frozen playtest | An immutable content snapshot running the production simulator while the editor draft remains untouched. |
| Visual inertia | Simulation-time decay of bounded pelvis/rotation offsets across animation sequences, without moving the physical body or blending duplicate silhouettes. |
| Autosave recovery | Explicit recovery of a browser-local draft; not a repository write, deployment or undo-history restore. |

## Small-module terms

| Term | Meaning |
|---|---|
| H | Shared `climbMaxHeight`, currently 1.2 m; brush grid/ruler unit, not an editor-only movement limit. |
| Entry-normalized pivot | Local [0,0] entry of a small library module; drag/drop places this reference at the cursor. |
| Intended occupied space | Derived AABB of geometry and modeled approach/action/recovery; not universal release/reachability certification. |
| Automatic block detector | A marker compiled from `surface.traversal: auto`, geometry and shared rules; no second editable coordinate. |
| Step-up climb | Grounded Space traversal onto a low surface, under the existing single Vault motion owner; not high-wall climbing. |
| Gait-phase match | Choose a compatible run pose from normalized joint landmarks, then continue distance-driven phase without moving physics. |
| Practice floor | Explicit frozen-preview scaffold for an unplaced module; excluded from the authored draft/export. |
| Legacy conversion | Explicit, undoable 1.2-to-1.3 transformation preserving geometry and removing obsolete size fields. |

## Game-flow terms

| Term | Project meaning |
|---|---|
| Challenge view | Frozen finite runtime derived from consecutive existing stations, without a second geometry source. |
| Completed | Finite session state that freezes at finish rather than looping through the lab gate. |
| Absolute grid snap | Align one world anchor to a lattice while preserving selected relative spacing. |
| Follow acceleration | Presentation-camera velocity-change limit, separate from character acceleration. |
| Two-pose stitching | Preserve local displayed pelvis velocity across clips, decay correction and prioritize contact. |
| Local best time | Best active simulation time stored only in this browser, not a shared/authenticated score. |

## Scene-action terms

| Term | Meaning |
|---|---|
| LedgeHang | Deliberate airborne catch that pins the body outside a clear corner until climb/drop/timeout. |
| Mantle | Collision-checked pull-up onto a standing-clear ledge; a mode of Vault rather than a second solver. |
| Wall rebound | One content-owned backward/upward impulse per marked wall per airborne period. |
| Roll buffer | Expiring slide intent that can become Roll only on a sufficiently hard landing. |
| Floating HUD | Small overlaid level/control/hint panels while the canvas fills the viewport. |
| Authored course | An independent finite layout referenced by level ID; different from a training view of the original circuit. |

## Scene choreography terms

| Term | Project meaning |
|---|---|
| Scene performance | Shared geometry-bound recipe with three outcomes, entry slots, pose clock and camera rail; stored in `scenePerformances`. |
| Pre-match | Prepare the scene and all outcomes before input; not a successful automatic action. |
| Timely / late / missed | First confirmed input before timely plane / before final deadline / no confirmation; different authored clips and results. |
| Playback slot | Outcome-specific spatial start plane; confirmation waits while running to it. |
| Directed shot / camera rail | Prebound scene coordinates and normalized keys sampled from time independently of the live character root. |
| SceneFailure | Simulator-owned collision/recoil playback before failure; never a successful auto-vault. |

[Current scene contract](scene-choreography.md) defines the limits and examples.

## Menu organization

| Term | Meaning |
|---|---|
| Mode / `modeId` | A catalogue-owned grouping of playable routes; every route references one mode. |
| Campaign | Six independently authored finite courses. |
| Training | Three existing station-based challenges played through the normal game scene. |
| Game editor workspace | `studio.html`, the separate launcher for Level Studio and Motion Lab; outside player mode/route flow. |
| Mode-bound navigation | Level return, completion count and next route use canonical membership; next never enters another mode. |

[Menu behavior](game-flow.md) also defines disabled Endless and legacy URL handling.
