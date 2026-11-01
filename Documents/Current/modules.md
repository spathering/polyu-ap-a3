# Modules and ownership

Latest movement/audio rules: [continuous play, automatic high-edge climb and quick retry](continuous-play.md).


Updated 1 November 2026. The simulator is the only writer of character motion; canonical content owns gameplay facts.

```mermaid
flowchart TD
  JSON[Rules, modules, scenes, layouts] --> Contract[content.js: schema and semantic validation]
  Editor[editor-model.js: transactions and undo] --> Contract
  Contract --> World[compileWorld: immutable geometry]
  Flow[game-flow.js: route and section references] --> World
  Controls[input.js: contextual key edges] --> Sim[simulation.js: fixed-step motion]
  World --> Sim
  Collision[collision.js: swept contacts] --> Sim
  Recipes[scene-actions and scene-performance] --> Sim
  Sim --> Interpolate[presentation.js]
  Interpolate --> Camera[camera and directed-camera]
  Interpolate --> Art[animation and pose-transition]
  Camera --> Renderer[renderer.js]
  Art --> Renderer
  City[city.js: deterministic scenery] --> Renderer
  Sim --> Audio[audio.js: event observer]
  Host[shell.js: persistent owner] --> Audio
  Catalogue[audio.json: sources and event mapping] --> Audio
```

| Owner | Responsibility |
|---|---|
| `content/parkour.json` | Movement tuning, shared modules, scene timing, 13 finite layouts including the lab |
| `game-flow.json` / `game-flow.js` | Twelve campaign routes, three training views, mode navigation and device-local records |
| `input.js` | Keyboard/touch aliases; Q chooses cable when eligible, otherwise swing; holds retain their press identity |
| `scene-traversal.js` / `simulation.js` | Swept ledge/mantle and other moves; traversal exit hands directly to running |
| `renderer.js` / `city.js` | Character contact alignment, foreground, idle/attached ropes and decorative city; no motion writes |
| `audio.js` / `audio.json` | Gesture unlock, bounded sound voices, looped music, preferences and missing-file tolerance |
| `editor-*` / `module-space.js` | Shared-content editing, derived footprints, snapping, terrain, undo and production playtest |

New district layouts reference existing modules with translated instances. They do not copy terrain entities into UI code. Audio and decorative palettes are presentation-only; neither affects recorded outcomes. [Structure](project-structure.md) · [Scene choreography](scene-choreography.md).

`screen-route.js` owns URL conversion; `screen-host.js` routes direct entries and intercepts same-app navigation. `quick-retry.js` resets failed player sections after the content-owned delay. Music lifetime is independent of simulation session state.
