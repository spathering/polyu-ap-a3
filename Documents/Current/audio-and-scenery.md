# Audio and city presentation

Updated 1 November 2026. [Continuous play](continuous-play.md) defines the current audio lifetime and recovery behavior.

`content/audio.json` owns paths, provenance, SHA-256 hashes, gains, voice limits, step distance and event mapping. The music is **Racing Game Title by MintoDog (140 BPM, CC0)**. The persistent host owns one `GameAudio` engine and looping music source; screens share it across menus, courses, pause, retries and results. Gameplay activity controls effects only. Music is not restarted by scene changes or visibility handlers. The explicit music toggle can stop it; browser/OS lifecycle restrictions still apply. First playback requires a user gesture.

Effects consume new simulation event serials once. Retry snapshots discard stale events; inactive screens stop effects without touching music. Music/effects toggles and volume persist when local storage works. Missing tracks do not block gameplay. The seven Kenney effects are stylized cues rather than realistic foley. [Sources and license evidence](../../assets/audio/README.md).

`city.js` draws three deterministic, world-indexed parallax layers with level-seeded palettes, windows, antennas, tanks, cranes, sun and clouds. Visible cells limit drawing work; no scenery enters collision geometry. Idle ropes derive from shared anchors/profiles and grip height; attached ropes meet calibrated hands. Lowered anchors update every editor/game instance together.
