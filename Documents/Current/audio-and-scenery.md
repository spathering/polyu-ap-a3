# Audio and city presentation

Updated 1 November 2026.

`content/audio.json` owns track paths, provenance, SHA-256 hashes, gains, maximum voices, step distance and event mapping. `audio.js` observes new simulation event serials, preventing duplicate sounds across render frames. A new retry snapshot discards stale events. Music loops only during active play (or an active menu); hidden tabs and pauses stop playback. The next start restarts the loop. Separate music/effects toggles and master volume persist when local storage is available. Browser autoplay restrictions are respected; no audio starts before a pointer/key gesture. Missing or undecodable tracks fail independently and do not stop gameplay. Effects are stylized cues from an interface sound pack, not realistic recorded foley. See [sources and license evidence](../../assets/audio/README.md).

`city.js` draws three world-indexed parallax layers. A deterministic level-ID seed selects a palette and building details; viewport movement reveals stable city cells without random per-frame flicker. Windows, antennas, tanks, cranes, sun and clouds add depth. Buildings are decorative and never enter collision geometry. The visible-cell budget bounds per-frame work.

Idle swing ropes derive from the existing anchor/profile and the character grip height. Attached ropes end at calibrated hands. Lowered anchors are authored once in shared modules and therefore update gameplay, editor previews and every course instance together. [Feedback response](player-feedback-update.md).
