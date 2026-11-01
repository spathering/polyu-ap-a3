# Player feedback update

Latest movement/audio rules: [continuous play, automatic high-edge climb and quick retry](continuous-play.md).


Implemented 1 November 2026. Feedback was relayed by the author from players; follow-up subjective confirmation is pending.

| Feedback | Current behavior | Verification |
|---|---|---|
| Climbing briefly freezes before running | Climb/mantle exit emits `TraverseExit`, clears the scene performance and returns to the pose-matched run without a synthetic landing clip | Swept mantle test checks immediate run and more than 1.1 m forward travel over the next 12 ticks; real held-jump browser test |
| More playable combinations | Six additional connected districts; twelve campaign and three training routes | All twelve full production input recordings finish; shared editor geometry |
| Sparse city | Three deterministic parallax layers, three palettes, sun/clouds, windows, roof tanks, antennas and cranes | Landscape and portrait canvas inspection |
| Swing anchor too far away and no visible rope | Standard anchor 9.5 m, chain anchor 8.5 m; idle rope/grip visible before use; attachment still follows calibrated hands | Updated full-loop/chain recordings and visible-rope browser capture |
| Separate rope and cable controls | One Q key and one touch button. Eligible cable takes precedence; otherwise hold/release swings. A held action never switches targets on key-up | Keyboard/touch ambiguity and release regression tests |
| Missing sound | Bundled CC0 electronic loop and seven effects, event mapping, separate music/effects toggles and volume | Eight real files decode and play after a trusted gesture; pause/mute and storage fallback checks |

High-edge capture now flows through a short grip settle directly into fixed mantle playback, without another input. See the [continuous-play follow-up](continuous-play.md). Camera motion remains scene-authored during traversal; neither sprites nor sound changes collision motion.

Longer routes reference existing terrain and movement modules. Seams use continuous supported ground; section references cover the whole route. Twelve campaign recordings plus eighteen lab recordings exercise production simulation. The shared content, atlas and audio checker verifies published files and hashes.

Public documentation describes the game, its controls, architecture, goals, decisions and credited material. Private source notes remain outside the repository. [Structure](project-structure.md) · [Audio/scenery](audio-and-scenery.md) · [Routes](campaign-and-scene-actions.md).
