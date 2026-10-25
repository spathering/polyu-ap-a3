# GitHub Pages deployment

Deployed and verified **25 October 2026**. [Play Motion / Run](https://spathering.github.io/polyu-ap-a3/). Visitors need a browser and an internet connection; no account, Node installation or local server is required.

## Published configuration

| Setting | Value |
|---|---|
| Repository | `spathering/polyu-ap-a3` (public) |
| Branch / folder | `main` / `/(root)` |
| Pages build type | `legacy`, GitHub-managed branch publishing |
| HTTPS | Enforced |
| Entry point | Root `index.html` |
| Static handling | Root `.nojekyll`; no bundler, dependency installation or custom workflow required |
| Deployment trigger | Push a commit to `main`; GitHub builds and publishes the branch |

The existing tracked HTML/CSS/JS, JSON contracts and generated PNGs are served directly. All game/menu data URLs remain relative to the repository subdirectory. `tools/serve.mjs` is only a local development server; it is not needed on Pages. The initial successful build published game commit `06a75c0`; subsequent deployment documentation and the overlay visibility fix use the same branch publishing configuration.

## User entry points

- [Main menu](https://spathering.github.io/polyu-ap-a3/): Play → Mode select → Campaign or Training → route.
- [Campaign](https://spathering.github.io/polyu-ap-a3/levels.html?mode=campaign): six independently authored finite routes.
- [Training](https://spathering.github.io/polyu-ap-a3/levels.html?mode=training): three focused routes.
- [Game editor](https://spathering.github.io/polyu-ap-a3/studio.html): separate Level Studio and Motion Lab launchers.

Endless remains disabled. Best times, completion and editor drafts are local to each browser/origin; local `127.0.0.1` progress does not transfer to the public site. There is no shared score service or server-side editor storage.

## Published artwork

The nineteen ignored `assets/local-reference/` research pages and offline publisher parser/painter remain outside Git and Pages. Their image requests return 404; the loader catches missing images and uses the procedural character rig. The home uses a code-native silhouette. The three tracked generated sheets remain available. Consequently the public game is playable, but it does not reproduce every local reference-frame animation. This is an explicit release limitation, not a failed deployment. Final shareable character animation/art remains pending.

## Verification and maintenance

- GitHub Pages reports a successful build from `main` and HTTPS is enforced.
- Public HTTPS returns 200 for 21 HTML/CSS/JS/content/schema/generated-image files; bytes were compared with committed Git objects (avoiding Windows working-tree newline differences).
- Ten Edge scenarios run against the public URL: help/Escape/focus, mode gating, campaign pause/restart, actual keyboard foundations completion, saved 1/3 training progress and mode-local next/return, unavailable/bad URLs, direct navigation, both editor tools, repository-prefix paths, 390-pixel menus and missing-art fallback. No browser exceptions were observed.
- Screenshot review found the restart control overriding its HTML `hidden` state. `play.css` now explicitly hides it on ready/results while retaining it on pause; preflight and public checks verify computed visibility.
- Local shared-content validation and all 153 Node tests pass. The 24 qualified production recordings remain the gameplay regression baseline.

Future releases: run `npm run check`, `npm test` and `npm run rehearse`; push to `main`; inspect the repository's [Actions](https://github.com/spathering/polyu-ap-a3/actions) and [Pages settings](https://github.com/spathering/polyu-ap-a3/settings/pages), then verify the public menu, representative run and changed assets. A successful Git push alone does not establish a successful deployment. GitHub's [branch-publishing guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) describes the same source configuration. Credentials were used only in memory by the local deployment helper and were not written into project files or logs.
