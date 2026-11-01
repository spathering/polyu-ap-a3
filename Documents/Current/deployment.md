# Static deployment

The game is hosted at [Motion / Run](https://spathering.github.io/polyu-ap-a3/). GitHub Pages publishes the `main` branch from the repository root. `.nojekyll` keeps the source tree directly servable. No custom build, package install, API key or runtime backend is needed.

| Entry | Path |
|---|---|
| Main menu | `index.html` |
| Modes / routes | `pages/modes.html`, `pages/levels.html?mode=campaign` |
| Game | `pages/play.html?level=roof-rhythm` |
| Editor workspace | `pages/studio.html`, `pages/editor.html`, `pages/lab.html` |

All 22 character sheets and eight audio files are bundled. `content/audio.json` and `assets/character/animations.json` record their hashes. Reference research archives are not deployment prerequisites. Audio starts only after a user gesture. Best times and preferences are stored locally; shared scores and endless generation are not implemented.

The 1 November 2026 update moves all non-home HTML into `pages/` and CSS into `styles/`; internal links and relative base URLs follow that layout. Old root-level deep links have been replaced. Use the main menu to navigate. Local checks cover the repository URL prefix as well as the plain development root.

Release procedure: run `npm run check`, `npm test` and `npm run rehearse`; verify menus, actions, audio and the editor in a browser; commit with an English message and push `main`; verify the Pages build and public content hashes. [Current update](player-feedback-update.md).
