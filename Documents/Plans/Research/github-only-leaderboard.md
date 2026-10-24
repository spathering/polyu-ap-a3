# GitHub-only shared leaderboard research

Checked: **22 October 2026**. Scope: GitHub Pages plus other GitHub services, without an external backend. This is a sourced feasibility assessment, not a working prototype or a confirmed feature.

## Finding

**A small shared leaderboard is technically plausible using only GitHub services, if submissions require a GitHub identity and updates can be asynchronous. Pages alone cannot accept anonymous score writes.**

GitHub documents Pages as static hosting [1]. Public Issues can provide persistent submission records [2], and Issue events can start Actions workflows [4]. Combining those capabilities into a scoreboard is an **architectural inference**, not a GitHub-provided leaderboard product. A seamless anonymous, real-time and trusted score service is not established by this design.

## Options

| Approach | Shared between players? | Submission requirement | Assessment |
|---|---|---|---|
| Browser `localStorage` | No | None | Personal best on one browser/profile; not GitHub storage. |
| Maintainer-published JSON on Pages | Yes, for reading | Maintainer updates it | Simple shared snapshot, without public score writes. |
| Public Issues, read and ranked by the game | Yes | Player signs into GitHub and submits an Issue | Smallest GitHub-only candidate; requires format validation, public API reads and filtering. |
| Issues plus Actions-generated JSON | Yes | Same authenticated Issue submission | Candidate for a low-volume asynchronous board; adds automation and publishing delay. |
| Browser writes to repository files | Only with suitable authorisation | An authorised token with repository write access | Not a public-player submission channel. Never distribute the owner's token. |
| Anonymous automatic write from the Pages game | Not provided by Pages | No safe anonymous write entry point identified | Needs a changed architecture/identity model; do not promise this with Pages alone. |

Writing repository contents requires authorised credentials and appropriate permission [3]. Having a GitHub account or logging in does **not** grant players write permission to the game repository. Authenticated API integration is possible in principle, but its authentication UX and browser compatibility would need separate validation; it is not assumed here.

## Candidate flow

**Optional proposal: play anonymously, submit through GitHub when desired.** The game generates a short score summary; a player opens a prefilled Issue page and explicitly submits it after signing in. GitHub supports title/body URL parameters [2]. This is a page handoff, not a background API write using GitHub browser cookies.

```mermaid
flowchart LR
    Game["Pages game: optional score submission"] --> Form["GitHub Issue page: sign in and submit"]
    Form --> Records["Public score Issues"]
    Records --> Workflow["Proposed Actions: validate and aggregate"]
    Workflow --> Snapshot["Proposed leaderboard JSON"]
    Snapshot --> Deploy["Build and deploy Pages"]
    Deploy --> Read["Game reads the shared snapshot"]
```

1. Enable Issues and define a compact submission format. Use title/body parameters only; do not assume ordinary players can add labels or that long replays fit in a URL [2].
2. Keep original submissions as Issues in the repository. Example proposed fields: schema version, game version, score, run identifier and optional seed. Use GitHub's actual author identity rather than trusting a typed username.
3. A trusted workflow on the default branch can react to `issues` events [4]. Validate format, supported version and ranges; filter out unrelated Issues and pull requests. Define duplicate, edited/deleted submission and tie handling.
4. Generate a bounded public snapshot. If keeping a persistent file, a possible location is `data/leaderboard.json` on a dedicated data branch or the repository default branch. **Neither the branch nor this file exists.** Commit writes require appropriate permissions and concurrency handling; Issues remain the input record.
5. Build the game with the generated snapshot and deploy through a suitable Pages workflow [7]. Prefer a coordinated aggregation/build/deployment run or explicitly controlled handoff. A push made with `GITHUB_TOKEN` normally does not trigger another workflow; do not rely on that push to start a separate publishing job [5].
6. Let readers refresh the snapshot. Display processing/error states and a last-updated time; do not promise an instant update after submission.

An even smaller prototype can rank validated public Issues directly without Actions. That avoids republishing on each score but makes the browser handle API limits, pagination and submission changes. Both options remain untested.

## Practical constraints

- **Identity and friction:** optional score submission requires GitHub sign-in and leaving the game for a GitHub form in this proposal. Normal play should remain independent.
- **Trust:** a GitHub identity authenticates the submitter, not the score. A client-supplied number, checksum or client-held secret is forgeable. Stronger verification might replay deterministic inputs against trusted rules; feasibility depends on the eventual game and is unproven.
- **Automation safety:** treat Issue data as untrusted input, not shell code or executable content. Use a trusted parser, limited fields and least-privilege workflow permissions [6]. Do not checkout or run player-supplied code.
- **Visibility:** public Issues and published JSON expose submitted data. A player identity associated with a score is public and opt-in; avoid collecting unrelated personal details.
- **Limits and delay:** unauthenticated public REST reads have a primary budget of 60 requests per hour per originating IP; shared networks can share that budget [8]. Cache/batch reads rather than polling every frame. Workflow queues, builds and site caching introduce delay; no measured latency exists.
- **Hosting/billing:** Pages and Actions have service limits [9, 10]. Public repositories using standard GitHub-hosted runners have free execution usage, while storage and other runner choices have separate conditions [10]. This is not unlimited database capacity or a continuous server.

## Recommendation and open decisions

For this assignment, finish the core playable loop first. If a shared board is still worthwhile, prototype **Issues as submission records**, then decide between direct public reading and an Actions-produced static snapshot. This is a project recommendation inferred from the documented capabilities and the assignment scope.

Before implementation, decide whether GitHub sign-in and public submissions are acceptable; define score rules, validation, tie-breaking, retention and abuse handling; then test submission, concurrent updates, publishing, readback and failure behaviour. If anonymous one-click submission or immediate authoritative ranking is essential, revisit the GitHub-only restriction rather than embedding write credentials.

## Official sources

1. [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
2. [Creating an Issue, including URL query fields](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue)
3. [Repository contents API: create or update files](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)
4. [Workflow events: Issues](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issues)
5. [Triggering workflows from workflows](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow)
6. [Secure use of GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use)
7. [Custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
8. [REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
9. [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
10. [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
