# Project structure

Updated 1 November 2026. [README](../../README.md) is the player/developer entry; [modules](modules.md) explains dependencies.

```text
index.html                         Main menu; only root HTML entry
pages/                             modes, levels, play, studio, editor, lab
styles/                            menu, play, editor, shared lab styles
content/parkour.json                Rules, profiles, modules, finite layouts, scene recipes
content/content-package.schema.json Canonical runtime/editor contract
content/game-flow.json              Mode and route metadata, section references
content/lab-course.json             Training stations and recorded lab inputs
content/audio.json                  Tracks, gains, hashes, sources and event mapping
src/                               Simulation, geometry, input, presentation, UI and editor
assets/character/                  Shared animation catalogue and 19 reference atlases
assets/generated/                  Three traversal sheets
assets/audio/                      Music, seven effects and license evidence
test/                              Unit/integration tests and campaign input recordings
tools/                             Server, content checks, recordings, atlas verification
Documents/Current/                 Implemented behavior and architecture
Documents/History/                 Dated decisions and validation records
Documents/Plans/                   Requirements, research, designs and remaining tasks
README.md, PROCESS.md, STANDARD.md  Root documentation
package.json, .gitignore, .nojekyll  Project and static-host configuration
```

Pages use a relative base URL so imports and assets work both locally and under the repository's GitHub Pages prefix. Internal navigation targets `pages/`; old root page URLs have been replaced. There is no generated distribution directory, package installation, runtime server or secret. Runtime data no longer depends on a design-document path. A matching Chinese document tree is maintained in the private workspace.
