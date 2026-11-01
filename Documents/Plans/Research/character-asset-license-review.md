# Character asset permission review

## Release decision

The user asked to replace character animation whose sharing permission could not be established, preferring open assets and using generated material only if necessary. The user selected the CC0 pixel-character option after being told that it changes the visual style.

| Source checked | Permission evidence and decision |
|---|---|
| [Vector / Nekki](https://nekki.com/en/legal/license_agreement/) | The publisher's terms restrict reproduction/distribution of game visual material without written agreement. No separate grant is recorded for this project. Remove the extracted atlases from the current public tree; keep the game as a design reference. |
| [Free 2D Platforming Character — 10KStudios](https://10kstudios.itch.io/free-2d-platforming-character) | Allows project use/modification but prohibits asset redistribution. Rejected for a repository that publishes its source PNGs. |
| [Animated Pixel Adventurer — rvros](https://rvros.itch.io/animated-pixel-hero) | Covers many required moves, but its published terms also prohibit redistribution. Rejected for the same reason. |
| [Adventure Series Character Agent SMS — Chasersgaming](https://opengameart.org/content/adventure-series-character-agent-sms) | The creator's free release is explicitly CC0 and includes running, jumping, grab and side-hoist frames. Selected; only files from this free archive are used. |

[Creator's own pack page](https://chasersgaming.itch.io/adventure-asset-character-agent-sms) distinguishes the free edition from paid additions. The project uses no paid/premium-only frames. [CC0 terms](https://creativecommons.org/publicdomain/zero/1.0/) permit redistribution and adaptation. Source metadata and exact file hashes live in the runtime catalogue, with a local license notice next to the unchanged selected PNGs.

The search found a usable open pack, so new AI artwork was not required. Its compact pixel cycles have less detail than the previous reference clips. Hoist, somersault and grab poses are adapted for slide, vault, pad and grapple roles; these are not represented as bespoke animations supplied by the original artist.

## Scope of removal

Nineteen extracted reference PNGs and three experimental generated sheets are removed from the current source tree and Pages release. The current catalogue contains fresh CC0 frame annotations, not old Vector pose data. The reference-restoration command is removed. Previous Git commits are retained; this change does not erase earlier repository history or third-party caches. Any separate history purge would require coordinated history rewriting.

[Current integration and checks](../../Current/animation-assets.md) · [Development decisions](../../../PROCESS.md).
