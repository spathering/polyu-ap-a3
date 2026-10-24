# Vector browser interaction findings

Inspected **24 October 2026** from the unchanged local archive collected on 22 October. Scope: the public browser build, not mobile/Steam internals or an observed live run. Original URLs: [player logic](https://vector.game/game/player.js), [move definitions](https://vector.game/game/moves.json), [reference page](https://vector.game/zh-Hans/). The browser search tool could not reopen the two source endpoints during this pass; the archived bytes and their hashes remain the evidence.

## Observed in archived source

- `player.js` identifies horizontal-support, vertical-contact, body-centre, camera and pivot nodes. Detector prediction depends on movement; contact tests feed transition selection.
- Pressed inputs receive a bounded lifetime: the inspected values are 21 updates at 60 Hz, about 0.35 seconds. Selection also checks the current animation interval, named scene areas, contact side, obstacle dimensions, relative position/velocity and priority.
- Some rules defer until their trigger ends. Other contact transitions align a specified detector to a contacted edge/corner. The switch routine places the new clip using that selected node, retaining preceding poses for continuity.
- Poses are evaluated between stored samples, rather than presenting every source sample as an unrelated bitmap.
- `moves.json` associates the vault with a named vault area and a start frame. Sliding has entry/safe/exit intervals and can continue into a sustained sliding state. This is richer than a state-to-image lookup.

These findings do **not** mean every action waits for an identical trigger or uses the same pivot. Source action rules and runtime placement vary. The broad phrase “detect, queue, align, execute” is our synthesis for this project's simpler controller.

## Applied design and differences

The [implemented scene action layer](../../Current/scene-action-synchronization.md) uses referenced entities, explicit spatial windows, one expiring intent, marker identity checks, swept trajectory validation and committed progress/contact targets. Our 0.5-second buffer is a lab tuning choice, not a copied reference value. Physics remains the single movement owner; generated poses do not become root-motion controllers.

The reference performs joint/trajectory placement and runtime pose interpolation. This lab instead prepares 60-Hz local raster derivatives offline, uses a normalized swept vault route and applies a bounded visual contact correction. Generated hanging art uses stable poses because it has only eight nonuniform key poses. These are explicit approximations, not a claim of equivalent reference animation quality.

Source records and SHA-256 digests are in the existing [animation manifest](VectorAssets/animation-manifest.json). The archive is under workspace `.midwork/assignment3/reference-assets/vector-character-animation/source/`. No original player/parser/painter implementation is copied into runtime source, and publisher-art derivatives remain ignored local study material.
